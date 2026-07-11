'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MailWarning, Trash2, RefreshCw } from 'lucide-react';

export interface CuentaInactivaDTO {
    id: string;
    nombre: string;
    empresa: string;
    ruc: string;
    correo: string;
    saldoFacturas: number;
    ultimoConsumo: string | null;
    diasSinConsumir: number;
    notificadoInactividadEn: string | null;
}

export function CuotasInactivasClient({
    cuentasIniciales,
    meses,
}: {
    cuentasIniciales: CuentaInactivaDTO[];
    meses: number;
}) {
    const [cuentas, setCuentas] = useState<CuentaInactivaDTO[]>(cuentasIniciales);
    const [cargando, setCargando] = useState(false);
    const [notificando, setNotificando] = useState(false);

    async function refrescar() {
        setCargando(true);
        try {
            const res = await fetch(`/api/admin/cuotas/inactivas?meses=${meses}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cargar');
            setCuentas(data.cuentas || []);
            toast.success('Lista actualizada.');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudo actualizar la lista.');
        } finally {
            setCargando(false);
        }
    }

    async function notificarTodas() {
        setNotificando(true);
        try {
            const res = await fetch('/api/admin/cuotas/inactivas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meses }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al notificar');
            toast.success(
                `Notificados ${data.clientesNotificados} cliente(s). Omitidos por ventana anti-spam: ${data.clientesOmitidosPorVentana}. Resumen al admin: ${data.adminNotificado ? 'sí' : 'no'}.`
            );
            await refrescar();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudo enviar las notificaciones.');
        } finally {
            setNotificando(false);
        }
    }

    async function eliminarSaldo(cuenta: CuentaInactivaDTO) {
        const nota = window.prompt(
            `Vas a ELIMINAR el saldo de ${cuenta.saldoFacturas} factura(s) de "${cuenta.empresa}".\n\nEsta acción es manual, queda registrada en el ledger y NO se puede deshacer sola.\n\nEscribe el motivo (obligatorio):`
        );
        if (nota === null) return; // cancelado
        if (nota.trim().length < 3) {
            toast.error('El motivo es obligatorio (mínimo 3 caracteres).');
            return;
        }
        try {
            const res = await fetch(`/api/admin/cuotas/${cuenta.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'eliminar_saldo', nota }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar saldo');
            toast.success(data.message || 'Saldo eliminado.');
            setCuentas((prev) => prev.filter((c) => c.id !== cuenta.id));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudo eliminar el saldo.');
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">
                    Cuentas con saldo inactivo{' '}
                    <Badge variant="secondary" className="ml-2">{cuentas.length}</Badge>
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refrescar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${cargando ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button size="sm" onClick={notificarTodas} disabled={notificando || cuentas.length === 0}>
                        <MailWarning className="h-4 w-4 mr-1" />
                        {notificando ? 'Enviando…' : 'Notificar a todos'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {cuentas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No hay cuentas con saldo de facturas sin usar por {meses}+ meses. 🎉
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4 font-medium">Empresa</th>
                                    <th className="py-2 pr-4 font-medium">Correo</th>
                                    <th className="py-2 pr-4 font-medium text-right">Saldo</th>
                                    <th className="py-2 pr-4 font-medium text-right">Sin usar</th>
                                    <th className="py-2 pr-4 font-medium">Último uso</th>
                                    <th className="py-2 pr-4 font-medium">Notificado</th>
                                    <th className="py-2 font-medium text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cuentas.map((c) => (
                                    <tr key={c.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4">
                                            <div className="font-medium">{c.empresa}</div>
                                            <div className="text-xs text-muted-foreground">{c.ruc}</div>
                                        </td>
                                        <td className="py-2 pr-4">{c.correo}</td>
                                        <td className="py-2 pr-4 text-right font-semibold">{c.saldoFacturas}</td>
                                        <td className="py-2 pr-4 text-right">{c.diasSinConsumir} días</td>
                                        <td className="py-2 pr-4">
                                            {c.ultimoConsumo
                                                ? new Date(c.ultimoConsumo).toLocaleDateString('es-PA')
                                                : <span className="text-muted-foreground">sin uso</span>}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {c.notificadoInactividadEn
                                                ? new Date(c.notificadoInactividadEn).toLocaleDateString('es-PA')
                                                : <span className="text-muted-foreground">nunca</span>}
                                        </td>
                                        <td className="py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => eliminarSaldo(c)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Eliminar saldo
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
