'use client';

import {
    Download,
    TrendingUp,
    Users,
    Package,
    DollarSign,
    Percent,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

interface ClientReport {
    name: string;
    ruc: string;
    total: number;
    count: number;
}

interface ProductReport {
    desc: string;
    qty: number;
    total: number;
}

interface ReportsDashboardProps {
    totalSales: number;
    totalItbms: number;
    unpaidBalance: number;
    invoiceCount: number;
    topClients: ClientReport[];
    topProducts: ProductReport[];
    allClientReport: ClientReport[];
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function ReportsDashboard({
    totalSales,
    totalItbms,
    unpaidBalance,
    invoiceCount,
    topClients,
    topProducts,
    allClientReport
}: ReportsDashboardProps) {

    const avgTicket = invoiceCount > 0 ? totalSales / invoiceCount : 0;

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        
        // Sheet 1: Resumen General
        const summarySheet = workbook.addWorksheet('Resumen General');
        summarySheet.columns = [
            { header: 'Indicador', key: 'metric', width: 30 },
            { header: 'Valor', key: 'value', width: 20 }
        ];
        summarySheet.addRow({ metric: 'Total de Ventas', value: totalSales });
        summarySheet.addRow({ metric: 'ITBMS Recaudado (7%/10%/15%)', value: totalItbms });
        summarySheet.addRow({ metric: 'Saldo Pendiente por Cobrar', value: unpaidBalance });
        summarySheet.addRow({ metric: 'Cantidad de Facturas', value: invoiceCount });
        summarySheet.addRow({ metric: 'Ticket Promedio', value: avgTicket });
        
        // Format money cells
        summarySheet.getColumn('value').numFmt = '$#,##0.00';

        // Sheet 2: Ventas por Cliente
        const clientSheet = workbook.addWorksheet('Ventas por Cliente');
        clientSheet.columns = [
            { header: 'Cliente', key: 'name', width: 35 },
            { header: 'RUC', key: 'ruc', width: 20 },
            { header: 'Total Facturado', key: 'total', width: 20 },
            { header: 'Facturas Emitidas', key: 'count', width: 15 }
        ];
        allClientReport.forEach(c => {
            clientSheet.addRow({
                name: c.name,
                ruc: c.ruc,
                total: c.total,
                count: c.count
            });
        });
        clientSheet.getColumn('total').numFmt = '$#,##0.00';

        // Sheet 3: Ventas por Producto
        const productSheet = workbook.addWorksheet('Ventas por Producto');
        productSheet.columns = [
            { header: 'Producto/Servicio', key: 'desc', width: 35 },
            { header: 'Cantidad Vendida', key: 'qty', width: 20 },
            { header: 'Total Ingresos', key: 'total', width: 20 }
        ];
        topProducts.forEach(p => {
            productSheet.addRow({
                desc: p.desc,
                qty: p.qty,
                total: p.total
            });
        });
        productSheet.getColumn('total').numFmt = '$#,##0.00';

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `reporte-ventas-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportCSV = () => {
        let csvContent = "Cliente,RUC,Total Facturado,Facturas Emitidas\n";
        allClientReport.forEach(c => {
            const nameEscaped = c.name.replace(/"/g, '""');
            csvContent += `"${nameEscaped}","${c.ruc}",${c.total},${c.count}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `ventas-por-cliente-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span className="text-sm text-muted-foreground">Volver</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Reporte Analítico de Ventas</h1>
                    <p className="text-sm text-muted-foreground">
                        Resumen e indicadores financieros clave del periodo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-9 gap-2">
                                <Download className="h-4 w-4" />
                                Exportar Reporte
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Formatos</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleExportExcel}>
                                Exportar a Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportCSV}>
                                Exportar a CSV (.csv)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Ventas</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Monto total facturado</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">ITBMS Recaudado</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalItbms)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Impuestos fiscales calculados</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Cuentas por Cobrar</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(unpaidBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pendiente de cobro</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(avgTicket)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ventas / {invoiceCount} facturas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Tables */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Clients */}
                <Card className="bg-white border shadow-sm flex flex-col">
                    <CardHeader className="py-4 px-6 border-b">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-semibold">Top Clientes por Facturación</CardTitle>
                        </div>
                        <CardDescription className="text-xs">Los 5 clientes con mayores volúmenes de compra</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6">Cliente</TableHead>
                                    <TableHead>RUC</TableHead>
                                    <TableHead className="text-right">Facturas</TableHead>
                                    <TableHead className="text-right px-6">Total Neto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topClients.map((client, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium px-6">{client.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{client.ruc}</TableCell>
                                        <TableCell className="text-right">{client.count}</TableCell>
                                        <TableCell className="text-right font-bold px-6">{formatCurrency(client.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {topClients.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                            No hay registros de clientes
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="bg-white border shadow-sm flex flex-col">
                    <CardHeader className="py-4 px-6 border-b">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-base font-semibold">Top Productos por Ingresos</CardTitle>
                        </div>
                        <CardDescription className="text-xs">Los 5 productos/servicios más vendidos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6">Producto / Servicio</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right px-6">Total Ingresos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium px-6">{product.desc}</TableCell>
                                        <TableCell className="text-right">{product.qty}</TableCell>
                                        <TableCell className="text-right font-bold px-6">{formatCurrency(product.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {topProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">
                                            No hay registros de productos
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
