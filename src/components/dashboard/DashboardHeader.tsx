'use client';

import {
    Filter,
    Download,
    FileBarChart,
    ChevronDown
} from 'lucide-react';
import { TimeFilter } from './TimeFilter';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

interface DashboardHeaderProps {
    title?: string;
    kpiData?: any;
    recentInvoices?: any[];
}

export function DashboardHeader({ title = 'Dashboard', kpiData, recentInvoices }: DashboardHeaderProps) {
    
    const handleExportExcel = async () => {
        if (!kpiData || !recentInvoices) return;

        const workbook = new ExcelJS.Workbook();
        
        // 1. Resumen KPI Sheet
        const kpiSheet = workbook.addWorksheet('Resumen');
        kpiSheet.columns = [
            { header: 'Indicador', key: 'title', width: 30 },
            { header: 'Valor', key: 'value', width: 20 },
            { header: 'Cambio %', key: 'change', width: 15 },
        ];
        
        kpiSheet.addRow({
            title: 'Facturado',
            value: new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(kpiData.ventas.value),
            change: `${kpiData.ventas.change}%`
        });
        kpiSheet.addRow({
            title: 'Cobrado',
            value: new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(kpiData.cobrado.value),
            change: `${kpiData.cobrado.change}%`
        });
        kpiSheet.addRow({
            title: 'Pendiente por Cobrar',
            value: new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(kpiData.pendiente.value),
            change: `${kpiData.pendiente.change}%`
        });
        kpiSheet.addRow({
            title: 'Vencido',
            value: new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(kpiData.vencido.value),
            change: `${kpiData.vencido.change}%`
        });

        // 2. Recent Invoices Sheet
        const invoiceSheet = workbook.addWorksheet('Facturas Recientes');
        invoiceSheet.columns = [
            { header: 'Número de Factura', key: 'id', width: 25 },
            { header: 'Cliente', key: 'client', width: 30 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Saldo Pendiente', key: 'balance', width: 15 },
            { header: 'Estado DGI', key: 'status', width: 15 },
            { header: 'Estado Pago', key: 'paymentStatus', width: 15 },
            { header: 'Fecha', key: 'date', width: 15 },
        ];

        recentInvoices.forEach((inv) => {
            invoiceSheet.addRow({
                id: inv.id,
                client: inv.client,
                amount: inv.amount,
                balance: inv.balance,
                status: inv.status,
                paymentStatus: inv.paymentStatus,
                date: inv.date
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `resumen-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportCSV = () => {
        if (!recentInvoices) return;
        
        let csvContent = "Numero,Cliente,Monto,Saldo Pendiente,Estado DGI,Estado Pago,Fecha\n";
        
        recentInvoices.forEach((inv) => {
            const clientEscaped = inv.client.replace(/"/g, '""');
            csvContent += `"${inv.id}","${clientEscaped}",${inv.amount},${inv.balance},"${inv.status}","${inv.paymentStatus}","${inv.date}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `facturas-recientes-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">
                    Resumen general de tu negocio y estado DGI
                </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Date Filter */}
                <div className="flex items-center">
                    <TimeFilter />
                </div>

                <Separator orientation="vertical" className="hidden h-8 sm:block" />

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2" suppressHydrationWarning>
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filtros</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>Sucursal Principal</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Sucursal Este</DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>Caja 1</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Caja 2</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2">
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only sm:not-sr-only">Exportar</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Exportar Datos</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleExportExcel} disabled={!kpiData || !recentInvoices}>
                                    Exportar a Excel (.xlsx)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportCSV} disabled={!recentInvoices}>
                                    Exportar a CSV (.csv)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" className="h-9 gap-2" asChild>
                            <Link href="/reports">
                                <FileBarChart className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only">Reportes</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
