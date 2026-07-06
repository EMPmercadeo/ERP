'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Landmark,
    ArrowLeft,
    CheckCircle2,
    Circle,
    Scale,
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ImportMovimientosDialog } from './ImportMovimientosDialog';

export interface BankAccountDetailData {
    id: string;
    nombre: string;
    banco: string;
    numeroCuenta: string;
    tipoCuenta: string;
    cuentaContableId: string;
    cuentaContableCodigo: string;
    cuentaContableNombre: string;
    saldoInicial: number;
    activa: boolean;
}

export interface MovimientoBancarioData {
    id: string;
    fecha: string;
    descripcion: string;
    monto: number;
    tipo: string;
    referencia: string | null;
    conciliado: boolean;
    asientoContableId: string | null;
    origenImportacion: string | null;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BankAccountDetailClient({
    cuenta,
    movimientos,
    totales,
    pagination,
}: {
    cuenta: BankAccountDetailData;
    movimientos: MovimientoBancarioData[];
    // Calculados server-side sobre TODOS los movimientos de la cuenta, no solo la
    // página actual — `movimientos` ahora llega paginado, así que estos totales ya
    // no se pueden derivar reduciendo el array recibido.
    totales: { totalDepositos: number; totalRetiros: number; pendientesConciliar: number };
    pagination: { page: number; limit: number; totalCount: number };
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { totalDepositos, totalRetiros, pendientesConciliar } = totales;
    const saldoActual = cuenta.saldoInicial + totalDepositos - totalRetiros;
    const { page, limit, totalCount } = pagination;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const goToPage = (target: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(target));
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <ContentContainer className="py-4 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/bank-accounts">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-brand-1 to-brand-2 text-white shrink-0">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{cuenta.nombre}</h2>
                        <p className="text-muted-foreground text-sm">
                            {cuenta.banco} · {cuenta.numeroCuenta} · Vinculada a {cuenta.cuentaContableCodigo} — {cuenta.cuentaContableNombre}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/bank-accounts/${cuenta.id}/reconcile`}>
                        <Button variant="outline">
                            <Scale className="mr-2 h-4 w-4" />
                            Conciliar
                        </Button>
                    </Link>
                    <ImportMovimientosDialog cuentaBancariaId={cuenta.id} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Inicial</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(cuenta.saldoInicial)}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Actual (calculado)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(saldoActual)}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Movimientos sin conciliar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{pendientesConciliar}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={cuenta.activa ? 'success' : 'destructive'} className="capitalize">
                            {cuenta.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100/80">
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Origen</TableHead>
                                    <TableHead>Conciliado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movimientos.length > 0 ? (
                                    movimientos.map((m) => (
                                        <TableRow key={m.id} className="hover:bg-slate-50/60">
                                            <TableCell className="text-xs">{formatDate(m.fecha)}</TableCell>
                                            <TableCell className="text-xs font-medium text-slate-700">{m.descripcion}</TableCell>
                                            <TableCell className="text-xs">
                                                <Badge variant={m.tipo === 'DEPOSITO' ? 'success' : 'destructive'} className="text-[10px]">
                                                    {m.tipo === 'DEPOSITO' ? 'Depósito' : 'Retiro'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-xs font-bold ${m.tipo === 'DEPOSITO' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {m.tipo === 'DEPOSITO' ? '+' : '-'}{formatCurrency(m.monto)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{m.origenImportacion || 'Manual'}</TableCell>
                                            <TableCell>
                                                {m.conciliado ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-slate-300" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                                            No hay movimientos importados todavía para esta cuenta.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalCount > 0 && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4 mt-2">
                            <span className="text-sm text-muted-foreground">
                                Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, totalCount)} de {totalCount} movimientos
                                {' · '}Página {page} de {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => goToPage(page - 1)}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => goToPage(page + 1)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
