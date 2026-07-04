'use client';

import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export interface CashFlowBucket {
    label: string;
    ingresos: number;
    egresos: number;
    neto: number;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value);
}

export function CashFlowView({
    data,
    totales,
    facturasSinFechaEstimadas,
}: {
    data: CashFlowBucket[];
    totales: CashFlowBucket;
    facturasSinFechaEstimadas: number;
}) {
    return (
        <ContentContainer className="py-4 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Flujo de Caja Proyectado</h2>
                <p className="text-muted-foreground text-sm">
                    Ingresos esperados (CxC) contra egresos esperados (CxP), agrupados por vencimiento
                </p>
            </div>

            {facturasSinFechaEstimadas > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                        {facturasSinFechaEstimadas} factura(s) no tienen fecha de vencimiento registrada; se estimó
                        <strong> fecha de emisión + 30 días</strong> para proyectarlas en este reporte.
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingresos Totales Proyectados</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totales.ingresos)}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Egresos Totales Proyectados</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totales.egresos)}</div>
                    </CardContent>
                </Card>
                <Card className={`border-l-4 shadow-sm ${totales.neto >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Neto Proyectado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totales.neto >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                            {formatCurrency(totales.neto)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100/80">
                                <TableRow>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Ingresos (CxC)</TableHead>
                                    <TableHead className="text-right">Egresos (CxP)</TableHead>
                                    <TableHead className="text-right">Neto Proyectado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row) => (
                                    <TableRow key={row.label} className="hover:bg-slate-50/60">
                                        <TableCell className="font-medium text-slate-800">{row.label}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-emerald-600">
                                            {formatCurrency(row.ingresos)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-red-600">
                                            {formatCurrency(row.egresos)}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono text-xs font-bold ${row.neto >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                                            {formatCurrency(row.neto)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-50 font-bold border-t-2">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right font-mono text-xs text-emerald-700">{formatCurrency(totales.ingresos)}</TableCell>
                                    <TableCell className="text-right font-mono text-xs text-red-700">{formatCurrency(totales.egresos)}</TableCell>
                                    <TableCell className={`text-right font-mono text-xs ${totales.neto >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
                                        {formatCurrency(totales.neto)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
