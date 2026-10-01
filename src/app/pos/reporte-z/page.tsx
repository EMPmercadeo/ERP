import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTenantContext } from '@/lib/auth/context';
import { generarReporteZ, listarTurnosRecientes, type ReporteZ } from '@/lib/services/reporteZ';
import { Button } from '@/components/ui/button';
import { PrintButton } from './PrintButton';
import { prisma } from '@/lib/db';
import { fechaAnterior, fechaPanama } from '@/lib/pos/fechaNegocio';
import { redirect } from 'next/navigation';
import { CerrarZButton } from './CerrarZButton';
import { CerrarTurnoAdmin } from './CerrarTurnoAdmin';

export const dynamic = 'force-dynamic';

const money = (n: number) => `$${n.toFixed(2)}`;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-PA') : '—');

export default async function ReporteZPage({
    searchParams,
}: {
    searchParams: Promise<{ turnoId?: string; fecha?: string }>;
}) {
    let empresaId: string;
    let role: string;
    try {
        ({ empresaId, role } = await getTenantContext());
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'digest' in err && String((err as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        throw new Error('No se pudo verificar la sesión.');
    }
    if (!['admin', 'super_admin'].includes(role)) redirect('/pos');

    const sp = await searchParams;
    const fechaSeleccionada = sp.fecha || fechaPanama();
    const cierre = !sp.turnoId ? await prisma.cierreZDiario.findUnique({ where: { empresaId_fecha: { empresaId, fecha: fechaSeleccionada } }, select: { id: true, createdAt: true } }) : null;
    const [reporte, turnos] = await Promise.all([
        cierre
            ? prisma.cierreZDiario.findUnique({ where: { id: cierre.id }, select: { resumen: true } }).then(c => c?.resumen as unknown as ReporteZ | null)
            : generarReporteZ({ empresaId, turnoId: sp.turnoId, fecha: fechaSeleccionada }),
        listarTurnosRecientes(empresaId, 20),
    ]);

    const hoyStr = fechaPanama();

    return (
        <div className="mx-auto max-w-3xl p-4 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <Button variant="ghost" asChild className="-ml-2">
                    <Link href="/pos" className="flex items-center text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Volver al POS
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/pos/reporte-z?fecha=${hoyStr}`}>Cierre diario de hoy</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/pos/reporte-z?fecha=${fechaAnterior(hoyStr)}`}>Día anterior</Link>
                    </Button>
                    {reporte && <PrintButton />}
                </div>
            </div>

            {!reporte ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                    No se encontró el turno indicado o la fecha es inválida. Elige un turno abajo o genera el cierre diario de hoy.
                </div>
            ) : (
                <div className="rounded-xl border bg-card p-6 space-y-6">
                    {reporte.tipo === 'diario' && <div className="print:hidden rounded-md border border-border bg-muted/30 p-3 text-sm">
                        {cierre ? <p className="font-medium">Cierre Z del {fechaSeleccionada} registrado el {fmt(cierre.createdAt.toISOString())}.</p> : <div className="flex flex-wrap items-center justify-between gap-2"><p>Pendiente: registra el cierre Z al terminar la jornada.</p><CerrarZButton fecha={fechaSeleccionada} /></div>}
                    </div>}
                    {/* Encabezado */}
                    <div className="text-center border-b pb-4">
                        <h1 className="text-xl font-bold tracking-tight">
                            {reporte.tipo === 'turno' ? 'Reporte Z — Cierre de turno' : 'Cierre diario (Reporte Z)'}
                        </h1>
                        <p className="text-sm text-muted-foreground">{reporte.empresa}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {fmt(reporte.rango.desde)} — {fmt(reporte.rango.hasta)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Generado: {fmt(reporte.generadoEn)}</p>
                    </div>

                    {/* Turno / arqueo */}
                    {reporte.turno && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">Cajero:</span> <span className="font-medium">{reporte.turno.cajero}</span></div>
                            <div><span className="text-muted-foreground">Estado:</span> <span className="font-medium">{reporte.turno.estado}</span></div>
                            <div><span className="text-muted-foreground">Apertura:</span> {fmt(reporte.turno.fechaApertura)}</div>
                            <div><span className="text-muted-foreground">Cierre:</span> {fmt(reporte.turno.fechaCierre)}</div>
                            <div className="col-span-2 mt-2 rounded-lg border p-3 grid grid-cols-2 gap-2 bg-muted/30">
                                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arqueo de caja</div>
                                <div><span className="text-muted-foreground">Fondo inicial:</span> {money(reporte.turno.montoInicial)}</div>
                                <div><span className="text-muted-foreground">Efectivo esperado:</span> {reporte.turno.arqueo.esperado != null ? money(reporte.turno.arqueo.esperado) : '—'}</div>
                                <div><span className="text-muted-foreground">Efectivo contado:</span> {reporte.turno.arqueo.contado != null ? money(reporte.turno.arqueo.contado) : '—'}</div>
                                <div>
                                    <span className="text-muted-foreground">Diferencia:</span>{' '}
                                    <span className="font-semibold">{reporte.turno.arqueo.diferencia != null ? money(reporte.turno.arqueo.diferencia) : '—'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documentos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="rounded-lg border p-3">
                            <div className="text-lg font-bold">{reporte.documentos.emitidos}</div>
                            <div className="text-[11px] text-muted-foreground">Ventas</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-lg font-bold">{reporte.documentos.conCufe}</div>
                            <div className="text-[11px] text-muted-foreground">Con CUFE</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-lg font-bold">{reporte.documentos.enColaOContingencia}</div>
                            <div className="text-[11px] text-muted-foreground">En cola/conting.</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-lg font-bold">{reporte.documentos.anulados}</div>
                            <div className="text-[11px] text-muted-foreground">Anuladas</div>
                        </div>
                    </div>

                    {/* Por método de pago */}
                    <div>
                        <h2 className="text-sm font-semibold mb-2">Ventas por método de pago</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-1.5 font-medium">Método</th>
                                    <th className="py-1.5 font-medium text-right">Docs</th>
                                    <th className="py-1.5 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reporte.porMetodoPago.length === 0 ? (
                                    <tr><td colSpan={3} className="py-3 text-center text-muted-foreground">Sin ventas en este periodo.</td></tr>
                                ) : (
                                    reporte.porMetodoPago.map((m) => (
                                        <tr key={m.metodo} className="border-b last:border-0">
                                            <td className="py-1.5">{m.metodo}</td>
                                            <td className="py-1.5 text-right">{m.cantidad}</td>
                                            <td className="py-1.5 text-right font-mono">{money(m.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ITBMS por tasa */}
                    <div>
                        <h2 className="text-sm font-semibold mb-2">Desglose de ITBMS</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-1.5 font-medium">Tasa</th>
                                    <th className="py-1.5 font-medium text-right">Base gravable</th>
                                    <th className="py-1.5 font-medium text-right">ITBMS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reporte.itbmsPorTasa.length === 0 ? (
                                    <tr><td colSpan={3} className="py-3 text-center text-muted-foreground">Sin datos.</td></tr>
                                ) : (
                                    reporte.itbmsPorTasa.map((t) => (
                                        <tr key={t.tasa} className="border-b last:border-0">
                                            <td className="py-1.5">{t.tasa === 0 ? 'Exento (0%)' : `${t.tasa}%`}</td>
                                            <td className="py-1.5 text-right font-mono">{money(t.base)}</td>
                                            <td className="py-1.5 text-right font-mono">{money(t.impuesto)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totales */}
                    <div className="border-t pt-4 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (neto):</span><span className="font-mono">{money(reporte.totales.subtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">ITBMS:</span><span className="font-mono">{money(reporte.totales.itbms)}</span></div>
                        <div className="flex justify-between text-base font-bold pt-1 border-t"><span>Total del periodo:</span><span className="font-mono">{money(reporte.totales.total)}</span></div>
                    </div>
                </div>
            )}

            {/* Selector de turnos */}
            <div className="rounded-xl border bg-card p-4 print:hidden">
                <h2 className="text-sm font-semibold mb-3">Turnos recientes</h2>
                {turnos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay turnos de caja registrados todavía.</p>
                ) : (
                    <ul className="divide-y">
                        {turnos.map((t) => (
                            <li key={t.id}>
                                <Link
                                    href={`/pos/reporte-z?turnoId=${t.id}`}
                                    className={`flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent text-sm ${sp.turnoId === t.id ? 'bg-accent' : ''}`}
                                >
                                    <span>
                                        <span className="font-medium">{t.cajero}</span>{' '}
                                        <span className="text-muted-foreground">— {fmt(t.fechaApertura)}</span>
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.estado === 'abierto' ? 'bg-warning-bg text-warning' : 'bg-muted text-muted-foreground'}`}>
                                        {t.estado}
                                    </span>
                                </Link>
                                {t.estado === 'abierto' && <div className="px-2 pb-2"><CerrarTurnoAdmin turnoId={t.id} cajero={t.cajero} /></div>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
