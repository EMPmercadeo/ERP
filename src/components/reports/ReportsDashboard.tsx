'use client';

import { useState, useEffect } from 'react';
import {
    Download,
    TrendingUp,
    Users,
    Package,
    DollarSign,
    Percent,
    ArrowLeft,
    FileText,
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Coins,
    AlertCircle,
    Ticket,
    Receipt,
    Briefcase,
    X,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { formatCurrency, formatNumber, formatInteger } from '@/lib/utils/currency';
import { ReportFilters } from './ReportFilters';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface KPIPeriod {
    totalFacturado: number;
    totalCobrado: number;
    accountsReceivable: number;
    accountsOverdue: number;
    itbms: number;
    countFE: number;
    countNC: number;
    ticketPromedio: number;
    grossProfit: number;
}

interface TrendPoint {
    mes: string;
    facturado: number;
    cobrado: number;
}

interface StatusSale {
    status: string;
    count: number;
    total: number;
}

interface ProductReport {
    id: string;
    codigoInterno: string;
    descripcion: string;
    cantidad: number;
    ingreso: number;
    costoTotal: number;
    gananciaBruta: number;
    stockActual: number;
}

interface ClientReport {
    id: string;
    razonSocial: string;
    ruc: string;
    dv: string | null;
    facturasCount: number;
    totalFacturado: number;
    totalPagado: number;
    saldoPendiente: number;
    ultimaCompra: Date | null;
}

interface InvoiceDetailRow {
    id: string;
    numeroCompleto: string;
    fechaEmision: Date;
    fechaVencimiento: Date | null;
    clienteNombre: string;
    clienteRuc: string;
    totalNeto: number;
    totalItbms: number;
    totalPagado: number;
    saldoPendiente: number;
    estadoDgi: string;
    tipoDocumento: string;
    vendedor: string;
}

interface ReceivablesAging {
    noVencido: number;
    days30: number;
    days60: number;
    days90: number;
    daysOver90: number;
    sinVencimiento: number;
}

interface SellerReport {
    id: string;
    nombre: string;
    email: string;
    facturasCount: number;
    totalFacturado: number;
}

interface ReportsDashboardProps {
    kpis: {
        current: KPIPeriod;
        previous: KPIPeriod;
    };
    trend: TrendPoint[];
    statusSales: StatusSale[];
    topProducts: ProductReport[];
    topClients: ClientReport[];
    receivablesAging: ReceivablesAging;
    salesBySeller: SellerReport[];
    invoiceDetail: {
        invoices: InvoiceDetailRow[];
        totalCount: number;
        pageCount: number;
    };
    filterClients: { id: string; razonSocial: string }[];
    filterProducts: { id: string; descripcion: string; codigoInterno: string }[];
    filterSellers: { id: string; nombre: string }[];
    filterCompanies: { id: string; razonSocial: string }[];
    isSuperAdmin: boolean;
    currentFilters: {
        dateFrom: string;
        dateTo: string;
        clienteId: string;
        productoId: string;
        creadorId: string;
        estadoDgi: string;
        metodoPago: string;
        tipoDocumento: string;
        paymentStatus: string;
        periodoRapido: string;
        groupBy: 'day' | 'week' | 'month';
        page: number;
        limit: number;
    };
}

export function ReportsDashboard({
    kpis,
    trend,
    statusSales,
    topProducts,
    topClients,
    receivablesAging,
    salesBySeller,
    invoiceDetail,
    filterClients,
    filterProducts,
    filterSellers,
    filterCompanies,
    isSuperAdmin,
    currentFilters
}: ReportsDashboardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Loading transition state
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(false);
    }, [searchParams]);

    const handleReset = () => {
        setIsLoading(true);
        router.push(pathname);
    };

    const getPercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const renderTrendBadge = (change: number) => {
        if (change > 0) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="h-3 w-3" />
                    +{change.toFixed(1)}%
                </span>
            );
        } else if (change < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    <ArrowDownRight className="h-3 w-3" />
                    {change.toFixed(1)}%
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-slate-50 px-1.5 py-0.5 rounded">
                    <Minus className="h-3 w-3" />
                    0.0%
                </span>
            );
        }
    };

    // Calculate changes
    const salesChange = getPercentageChange(kpis.current.totalFacturado, kpis.previous.totalFacturado);
    const cobradoChange = getPercentageChange(kpis.current.totalCobrado, kpis.previous.totalCobrado);
    const itbmsChange = getPercentageChange(kpis.current.itbms, kpis.previous.itbms);
    const avgTicketChange = getPercentageChange(kpis.current.ticketPromedio, kpis.previous.ticketPromedio);
    const countFEChange = getPercentageChange(kpis.current.countFE, kpis.previous.countFE);
    const countNCChange = getPercentageChange(kpis.current.countNC, kpis.previous.countNC);
    const profitChange = getPercentageChange(kpis.current.grossProfit, kpis.previous.grossProfit);

    const handlePageChange = (newPage: number) => {
        setIsLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    };

    const removeFilter = (key: string) => {
        setIsLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const activeFiltersCount = [
        currentFilters.clienteId !== 'all',
        currentFilters.productoId !== 'all',
        currentFilters.creadorId !== 'all',
        currentFilters.estadoDgi !== 'all',
        currentFilters.tipoDocumento !== 'all',
        currentFilters.paymentStatus !== 'all'
    ].filter(Boolean).length;

    // SVG parameters for Trend Curve
    const W = 760;
    const H = 220;
    const L = 50;
    const R = 20;
    const T = 20;
    const B = 30;
    const iw = W - L - R;
    const ih = H - T - B;

    const maxTrendVal = Math.max(...trend.map(t => Math.max(t.facturado, t.cobrado)), 1);
    const maxValCeil = Math.ceil(maxTrendVal / 1000) * 1000 || 1000;

    const getX = (i: number) => L + (i * iw) / (trend.length - 1 || 1);
    const getY = (v: number) => T + ih - (v / maxValCeil) * ih;

    const factPoints = trend.map((t, i) => [getX(i), getY(t.facturado)] as [number, number]);
    const cobrPoints = trend.map((t, i) => [getX(i), getY(t.cobrado)] as [number, number]);

    const generatePath = (pts: [number, number][]) => {
        if (pts.length < 2) return '';
        return `M ${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map(p => `L ${p[0]},${p[1]}`).join(' ');
    };

    const dFact = generatePath(factPoints);
    const dCobr = generatePath(cobrPoints);
    const dFactArea = factPoints.length > 0
        ? `${dFact} L ${factPoints[factPoints.length - 1][0]},${T + ih} L ${factPoints[0][0]},${T + ih} Z`
        : '';

    const maxProductIngreso = Math.max(...topProducts.map(p => p.ingreso), 1);
    const maxClientFacturado = Math.max(...topClients.map(c => c.totalFacturado), 1);
    const totalAging = Object.values(receivablesAging).reduce((a, b) => a + b, 0);

    // Excel export handler with metadata
    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();

        // 1. Resumen de KPIs
        const kpiSheet = workbook.addWorksheet('Resumen KPIs');
        
        // Add Filter Metadata & Header
        kpiSheet.addRow(['REPORTE FINANCIERO Y ANALÍTICO DE VENTAS']);
        kpiSheet.addRow([`Fecha de Generación: ${new Date().toLocaleString('es-PA')}`]);
        kpiSheet.addRow([`Rango de Fechas: Desde ${currentFilters.dateFrom} Hasta ${currentFilters.dateTo}`]);
        kpiSheet.addRow([`Filtros Aplicados:`]);
        kpiSheet.addRow([`  - Cliente: ${currentFilters.clienteId !== 'all' ? filterClients.find(c => c.id === currentFilters.clienteId)?.razonSocial : 'Todos'}`]);
        kpiSheet.addRow([`  - Producto: ${currentFilters.productoId !== 'all' ? filterProducts.find(p => p.id === currentFilters.productoId)?.descripcion : 'Todos'}`]);
        kpiSheet.addRow([`  - Vendedor: ${currentFilters.creadorId !== 'all' ? filterSellers.find(s => s.id === currentFilters.creadorId)?.nombre : 'Todos'}`]);
        kpiSheet.addRow([`  - Tipo Documento: ${currentFilters.tipoDocumento !== 'all' ? currentFilters.tipoDocumento : 'Todos'}`]);
        kpiSheet.addRow([`  - Estado DGI: ${currentFilters.estadoDgi !== 'all' ? currentFilters.estadoDgi : 'Todos'}`]);
        kpiSheet.addRow([`  - Estado de Pago: ${currentFilters.paymentStatus !== 'all' ? currentFilters.paymentStatus : 'Todos'}`]);
        kpiSheet.addRow([]); // blank space

        const headersRow = kpiSheet.addRow(['Indicador', 'Periodo Actual', 'Periodo Anterior', 'Variación %']);
        headersRow.font = { bold: true };

        const addKpiRow = (metric: string, curr: number, prev: number, change: number, isMoney = true) => {
            const row = kpiSheet.addRow([metric, curr, prev, change / 100]);
            if (isMoney) {
                row.getCell(2).numFmt = '$#,##0.00';
                row.getCell(3).numFmt = '$#,##0.00';
            } else {
                row.getCell(2).numFmt = '#,##0';
                row.getCell(3).numFmt = '#,##0';
            }
            row.getCell(4).numFmt = '0.0%';
        };

        addKpiRow('Ventas Facturadas (Neto)', kpis.current.totalFacturado, kpis.previous.totalFacturado, salesChange);
        addKpiRow('Cobros Recaudados', kpis.current.totalCobrado, kpis.previous.totalCobrado, cobradoChange);
        addKpiRow('Ganancia Bruta (Margen)', kpis.current.grossProfit, kpis.previous.grossProfit, profitChange);
        addKpiRow('ITBMS Recaudado', kpis.current.itbms, kpis.previous.itbms, itbmsChange);
        addKpiRow('Ticket Promedio', kpis.current.ticketPromedio, kpis.previous.ticketPromedio, avgTicketChange);
        addKpiRow('Facturas Emitidas (FE)', kpis.current.countFE, kpis.previous.countFE, countFEChange, false);
        addKpiRow('Notas de Crédito (NC)', kpis.current.countNC, kpis.previous.countNC, countNCChange, false);

        // Adjust column widths
        kpiSheet.getColumn(1).width = 30;
        kpiSheet.getColumn(2).width = 22;
        kpiSheet.getColumn(3).width = 22;
        kpiSheet.getColumn(4).width = 15;

        // 2. Detalle de Facturas
        const invoiceSheet = workbook.addWorksheet('Detalle de Facturas');
        invoiceSheet.columns = [
            { header: 'Documento', key: 'doc', width: 25 },
            { header: 'Fecha Emisión', key: 'emision', width: 15 },
            { header: 'Fecha Vencimiento', key: 'vence', width: 15 },
            { header: 'Cliente', key: 'cliente', width: 35 },
            { header: 'RUC', key: 'ruc', width: 18 },
            { header: 'Vendedor', key: 'vendedor', width: 22 },
            { header: 'Total Neto', key: 'total', width: 16 },
            { header: 'ITBMS', key: 'itbms', width: 14 },
            { header: 'Pagado', key: 'pagado', width: 16 },
            { header: 'Saldo Pendiente', key: 'saldo', width: 16 },
            { header: 'Estado DGI', key: 'estado', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 }
        ];

        invoiceDetail.invoices.forEach(inv => {
            const row = invoiceSheet.addRow({
                doc: inv.numeroCompleto,
                emision: new Date(inv.fechaEmision).toLocaleDateString('es-PA'),
                vence: inv.fechaVencimiento ? new Date(inv.fechaVencimiento).toLocaleDateString('es-PA') : '—',
                cliente: inv.clienteNombre,
                ruc: inv.clienteRuc,
                vendedor: inv.vendedor,
                total: inv.totalNeto,
                itbms: inv.totalItbms,
                pagado: inv.totalPagado,
                saldo: inv.saldoPendiente,
                estado: inv.estadoDgi.toUpperCase(),
                tipo: inv.tipoDocumento
            });
            row.getCell('total').numFmt = '$#,##0.00';
            row.getCell('itbms').numFmt = '$#,##0.00';
            row.getCell('pagado').numFmt = '$#,##0.00';
            row.getCell('saldo').numFmt = '$#,##0.00';
        });

        // 3. Clientes
        const clientSheet = workbook.addWorksheet('Clientes (Top)');
        clientSheet.columns = [
            { header: 'Razón Social', key: 'name', width: 35 },
            { header: 'RUC', key: 'ruc', width: 18 },
            { header: 'Facturas Emitidas', key: 'count', width: 15 },
            { header: 'Total Facturado', key: 'facturado', width: 20 },
            { header: 'Total Pagado', key: 'pagado', width: 20 },
            { header: 'Saldo Pendiente', key: 'saldo', width: 20 },
            { header: 'Última Compra', key: 'last', width: 15 }
        ];

        topClients.forEach(c => {
            const row = clientSheet.addRow({
                name: c.razonSocial,
                ruc: c.ruc + (c.dv ? `-${c.dv}` : ''),
                count: c.facturasCount,
                facturado: c.totalFacturado,
                pagado: c.totalPagado,
                saldo: c.saldoPendiente,
                last: c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('es-PA') : '—'
            });
            row.getCell('facturado').numFmt = '$#,##0.00';
            row.getCell('pagado').numFmt = '$#,##0.00';
            row.getCell('saldo').numFmt = '$#,##0.00';
            row.getCell('count').numFmt = '#,##0';
        });

        // 4. Productos
        const prodSheet = workbook.addWorksheet('Productos (Top)');
        prodSheet.columns = [
            { header: 'Código', key: 'code', width: 15 },
            { header: 'Producto / Servicio', key: 'desc', width: 35 },
            { header: 'Cantidad Vendida', key: 'qty', width: 15 },
            { header: 'Ingreso Total', key: 'income', width: 20 },
            { header: 'Costo Total', key: 'cost', width: 20 },
            { header: 'Ganancia Bruta', key: 'profit', width: 20 },
            { header: 'Stock Actual', key: 'stock', width: 15 }
        ];

        topProducts.forEach(p => {
            const row = prodSheet.addRow({
                code: p.codigoInterno,
                desc: p.descripcion,
                qty: p.cantidad,
                income: p.ingreso,
                cost: p.costoTotal,
                profit: p.gananciaBruta,
                stock: p.stockActual
            });
            row.getCell('income').numFmt = '$#,##0.00';
            row.getCell('cost').numFmt = '$#,##0.00';
            row.getCell('profit').numFmt = '$#,##0.00';
            row.getCell('qty').numFmt = '#,##0.00';
            row.getCell('stock').numFmt = '#,##0';
        });

        // 5. Antigüedad de Cartera
        const agingSheet = workbook.addWorksheet('Antigüedad de Saldos');
        agingSheet.columns = [
            { header: 'Bucket de Vencimiento', key: 'bucket', width: 30 },
            { header: 'Saldo Pendiente', key: 'balance', width: 22 },
            { header: 'Concentración %', key: 'pct', width: 15 }
        ];

        const addAgingRow = (bucket: string, val: number) => {
            const row = agingSheet.addRow({
                bucket,
                balance: val,
                pct: totalAging > 0 ? val / totalAging : 0
            });
            row.getCell('balance').numFmt = '$#,##0.00';
            row.getCell('pct').numFmt = '0.0%';
        };

        addAgingRow('No vencido', receivablesAging.noVencido);
        addAgingRow('Vencido 0-30 días', receivablesAging.days30);
        addAgingRow('Vencido 31-60 días', receivablesAging.days60);
        addAgingRow('Vencido 61-90 días', receivablesAging.days90);
        addAgingRow('Vencido +90 días', receivablesAging.daysOver90);
        addAgingRow('Sin vencimiento asignado', receivablesAging.sinVencimiento);

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `reporte-financiero-${currentFilters.dateFrom}-al-${currentFilters.dateTo}.xlsx`);
    };

    // CSV export handler with metadata header
    const handleExportCSV = () => {
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += "REPORTE FINANCIERO Y ANALÍTICO DE VENTAS\n";
        csvContent += `Fecha de Generacion: ${new Date().toLocaleString('es-PA')}\n`;
        csvContent += `Rango de Fechas: Desde ${currentFilters.dateFrom} Hasta ${currentFilters.dateTo}\n`;
        csvContent += `Filtros Aplicados: Cliente=${currentFilters.clienteId}, Producto=${currentFilters.productoId}, Vendedor=${currentFilters.creadorId}, DGI=${currentFilters.estadoDgi}, TipoDoc=${currentFilters.tipoDocumento}, EstadoPago=${currentFilters.paymentStatus}\n\n`;

        csvContent += "Documento,Fecha Emision,Cliente,RUC,Vendedor,Total Neto,ITBMS,Pagado,Saldo,Estado DGI,Tipo\n";
        invoiceDetail.invoices.forEach(inv => {
            const clientEscaped = inv.clienteNombre.replace(/"/g, '""');
            csvContent += `"${inv.numeroCompleto}","${new Date(inv.fechaEmision).toLocaleDateString('es-PA')}","${clientEscaped}","${inv.clienteRuc}","${inv.vendedor}",${inv.totalNeto},${inv.totalItbms},${inv.totalPagado},${inv.saldoPendiente},"${inv.estadoDgi.toUpperCase()}","${inv.tipoDocumento}"\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `detalle-ventas-${currentFilters.dateFrom}-al-${currentFilters.dateTo}.csv`);
    };

    return (
        <div className="space-y-6 relative">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50 flex items-center justify-center pointer-events-auto">
                    <Card className="p-5 shadow-2xl flex items-center gap-3 bg-white border border-slate-100">
                        <Loader2 className="h-5 w-5 animate-spin text-brand-1" />
                        <span className="text-xs font-bold text-slate-700">Cargando datos contables...</span>
                    </Card>
                </div>
            )}

            {/* Header Title with Back navigation */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-semibold transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Panel
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Reporte Financiero y Analítico de Ventas</h1>
                    <p className="text-sm text-muted-foreground">
                        Métricas operativas y de caja 100% integradas a la base de datos
                    </p>
                </div>
            </div>

            {/* Redesigned Filter Section */}
            <ReportFilters
                filterClients={filterClients}
                filterProducts={filterProducts}
                filterSellers={filterSellers}
                filterCompanies={filterCompanies}
                isSuperAdmin={isSuperAdmin}
                currentFilters={currentFilters}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
            />

            {/* Active Filters Indicators */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <span className="font-bold text-slate-500">Filtros activos:</span>
                    {currentFilters.clienteId !== 'all' && (
                        <Badge variant="secondary" className="gap-1.5 bg-white border border-slate-200 text-slate-700">
                            Cliente: {filterClients.find(c => c.id === currentFilters.clienteId)?.razonSocial || 'Seleccionado'}
                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeFilter('clienteId')} />
                        </Badge>
                    )}
                    {currentFilters.productoId !== 'all' && (
                        <Badge variant="secondary" className="gap-1.5 bg-white border border-slate-200 text-slate-700">
                            Producto: {filterProducts.find(p => p.id === currentFilters.productoId)?.descripcion || 'Seleccionado'}
                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeFilter('productoId')} />
                        </Badge>
                    )}
                    {currentFilters.creadorId !== 'all' && (
                        <Badge variant="secondary" className="gap-1.5 bg-white border border-slate-200 text-slate-700">
                            Vendedor: {filterSellers.find(s => s.id === currentFilters.creadorId)?.nombre || 'Seleccionado'}
                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeFilter('creadorId')} />
                        </Badge>
                    )}
                    {currentFilters.tipoDocumento !== 'all' && (
                        <Badge variant="secondary" className="gap-1.5 bg-white border border-slate-200 text-slate-700">
                            Tipo: {currentFilters.tipoDocumento}
                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeFilter('tipoDocumento')} />
                        </Badge>
                    )}
                    {currentFilters.estadoDgi !== 'all' && (
                        <Badge variant="secondary" className="gap-1.5 bg-white border border-slate-200 text-slate-700">
                            DGI: {currentFilters.estadoDgi}
                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeFilter('estadoDgi')} />
                        </Badge>
                    )}
                    {currentFilters.paymentStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1.5 bg-white border border-slate-200 text-slate-700">
                            Pago: {currentFilters.paymentStatus}
                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => removeFilter('paymentStatus')} />
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="h-6 text-[10px] text-brand-1 font-bold hover:bg-slate-100"
                    >
                        Limpiar todos
                    </Button>
                </div>
            )}

            {/* 8-Card KPIs Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facturado (Ventas Netas)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(kpis.current.totalFacturado)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-muted-foreground">FE ({kpis.current.countFE}) - NC ({kpis.current.countNC})</span>
                            {renderTrendBadge(salesChange)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cobrado (Caja Recaudado)</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(kpis.current.totalCobrado)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-muted-foreground">Flujo de caja recibido</span>
                            {renderTrendBadge(cobradoChange)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ganancia Bruta</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(kpis.current.grossProfit)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-muted-foreground">
                                Margen: {kpis.current.totalFacturado > 0 ? ((kpis.current.grossProfit / kpis.current.totalFacturado) * 100).toFixed(1) : 0}%
                            </span>
                            {renderTrendBadge(profitChange)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ITBMS Recaudado</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(kpis.current.itbms)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-muted-foreground">Impuesto facturado</span>
                            {renderTrendBadge(itbmsChange)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ticket Promedio</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(kpis.current.ticketPromedio)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-muted-foreground">Por factura emitida</span>
                            {renderTrendBadge(avgTicketChange)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cuentas por Cobrar</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(kpis.current.accountsReceivable)}</div>
                        <p className="text-xs text-muted-foreground mt-1.5">Saldo neto pendiente de cobro</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cartera Vencida</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(kpis.current.accountsOverdue)}</div>
                        <p className="text-xs text-muted-foreground mt-1.5">Facturas vencidas por cobrar</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facturas Emitidas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{formatInteger(kpis.current.countFE)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-muted-foreground">Documentos FE generados</span>
                            {renderTrendBadge(countFEChange)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Graphics and Status Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sales Trend line chart */}
                <Card className="bg-white border shadow-sm lg:col-span-2 flex flex-col">
                    <CardHeader className="p-5 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Tendencia de Ventas y Recaudación</CardTitle>
                            <CardDescription className="text-xs">Valores en USD facturados (línea continua) y cobrados (línea discontinua)</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <i className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                Facturado
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="w-2.5 h-2.5 rounded-full border border-dashed border-emerald-500 bg-white" />
                                Cobrado
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 flex-1 relative flex items-center justify-center min-h-[240px]">
                        {trend.length === 0 ? (
                            <span className="text-sm text-muted-foreground font-semibold">Sin datos suficientes en este intervalo</span>
                        ) : (
                            <div className="w-full h-full relative">
                                <svg
                                    viewBox={`0 0 ${W} ${H}`}
                                    className="w-full h-full min-h-[180px]"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id="gfReport" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0" stopColor="var(--info)" stopOpacity={0.2} />
                                            <stop offset="1" stopColor="var(--info)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    {[0, 1, 2, 3, 4].map(i => {
                                        const y = T + (ih * i) / 4;
                                        const val = maxValCeil - (maxValCeil / 4) * i;
                                        return (
                                            <g key={i}>
                                                <line x1={L} y1={y} x2={W - R} y2={y} stroke="#f1f4f9" strokeWidth={1} />
                                                <text x={L - 10} y={y + 4} textAnchor="end" fontSize={10} fill="#9aa7bd" className="font-mono">{formatInteger(val)}</text>
                                            </g>
                                        );
                                    })}

                                    {/* Month/Day labels */}
                                    {trend.map((t, i) => (
                                        <text key={i} x={getX(i)} y={H - 5} textAnchor="middle" fontSize={10} fill="#6b7a92" fontWeight={600}>
                                            {t.mes}
                                        </text>
                                    ))}

                                    {/* Facturado Area */}
                                    {dFactArea && <path d={dFactArea} fill="url(#gfReport)" />}

                                    {/* Cobrado Line (Dashed) */}
                                    {dCobr && (
                                        <path
                                            d={dCobr}
                                            fill="none"
                                            stroke="var(--success)"
                                            strokeWidth={2}
                                            strokeDasharray="4 4"
                                            strokeLinecap="round"
                                        />
                                    )}

                                    {/* Facturado Line (Solid) */}
                                    {dFact && (
                                        <path
                                            d={dFact}
                                            fill="none"
                                            stroke="var(--info)"
                                            strokeWidth={2.5}
                                            strokeLinecap="round"
                                        />
                                    )}

                                    {/* Circles */}
                                    {trend.map((t, i) => (
                                        <g key={i}>
                                            <circle cx={getX(i)} cy={getY(t.cobrado)} r={3} fill="#fff" stroke="var(--success)" strokeWidth={1.5} />
                                            <circle cx={getX(i)} cy={getY(t.facturado)} r={3} fill="#fff" stroke="var(--info)" strokeWidth={1.5} />
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Donut validation statuses */}
                <Card className="bg-white border shadow-sm flex flex-col">
                    <CardHeader className="p-5 border-b">
                        <CardTitle className="text-base font-semibold">Estado DGI (Fiscal)</CardTitle>
                        <CardDescription className="text-xs">Distribución de documentos de este periodo</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                        {statusSales.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground font-semibold py-10">
                                Sin registros de validación
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-center py-2">
                                    <div className="relative w-[140px] h-[140px]">
                                        <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg] w-full h-full">
                                            <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f4f9" strokeWidth="12" />
                                            {(() => {
                                                const total = statusSales.reduce((a, b) => a + b.count, 0);
                                                const C = 2 * Math.PI * 54;
                                                let offset = 0;
                                                return statusSales.map((s, i) => {
                                                    let color = 'var(--info)';
                                                    if (s.status === 'aceptada') color = 'var(--success)';
                                                    if (s.status === 'rechazada') color = 'var(--danger)';
                                                    if (s.status === 'pendiente') color = 'var(--warning)';
                                                    if (s.status === 'anulada') color = '#94a3b8';

                                                    const len = (s.count / total) * C;
                                                    const dash = Math.max(0.1, len - 2);
                                                    const strokeDashArray = `${dash} ${C - dash}`;
                                                    const strokeDashOffset = -offset;
                                                    offset += len;

                                                    return (
                                                        <circle
                                                            key={i}
                                                            cx="70"
                                                            cy="70"
                                                            r="54"
                                                            fill="none"
                                                            stroke={color}
                                                            strokeWidth="12"
                                                            strokeDasharray={strokeDashArray}
                                                            strokeDashoffset={strokeDashOffset}
                                                            strokeLinecap="round"
                                                            className="transition-all duration-300"
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="font-mono text-xl font-bold leading-none">
                                                {statusSales.reduce((a, b) => a + b.count, 0)}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground uppercase font-bold mt-1">documentos</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 mt-4">
                                    {statusSales.map((s, i) => {
                                        let color = 'bg-blue-500';
                                        if (s.status === 'aceptada') color = 'bg-green-500';
                                        if (s.status === 'rechazada') color = 'bg-red-500';
                                        if (s.status === 'pendiente') color = 'bg-yellow-500';
                                        if (s.status === 'anulada') color = 'bg-slate-400';

                                        const total = statusSales.reduce((a, b) => a + b.count, 0);
                                        const pct = total > 0 ? (s.count / total) * 100 : 0;

                                        return (
                                            <div key={i} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50 px-2 rounded transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                                    <span className="capitalize font-semibold text-muted-foreground">{s.status}</span>
                                                </div>
                                                <div className="flex items-center gap-3 font-mono font-bold">
                                                    <span>{s.count}</span>
                                                    <span className="text-muted-foreground/60 text-[10px] w-8 text-right">{pct.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Aging Cartera Section */}
            <Card className="bg-white border shadow-sm">
                <CardHeader className="p-5 border-b">
                    <CardTitle className="text-base font-semibold">Antigüedad de Saldos por Cobrar (Aging)</CardTitle>
                    <CardDescription className="text-xs">Distribución temporal del saldo total pendiente ({formatCurrency(totalAging)})</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                    {totalAging === 0 ? (
                        <div className="text-center py-6 text-sm text-muted-foreground font-semibold">
                            No hay cuentas pendientes por cobrar
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Horizontal cumulative progress bar */}
                            <div className="w-full bg-slate-100 h-4 rounded-full flex overflow-hidden shadow-inner">
                                {receivablesAging.noVencido > 0 && (
                                    <div
                                        className="bg-green-500 h-full transition-all"
                                        style={{ width: `${(receivablesAging.noVencido / totalAging) * 100}%` }}
                                        title={`Al día (No Vencido): ${formatCurrency(receivablesAging.noVencido)}`}
                                    />
                                )}
                                {receivablesAging.days30 > 0 && (
                                    <div
                                        className="bg-yellow-400 h-full transition-all"
                                        style={{ width: `${(receivablesAging.days30 / totalAging) * 100}%` }}
                                        title={`0-30 días: ${formatCurrency(receivablesAging.days30)}`}
                                    />
                                )}
                                {receivablesAging.days60 > 0 && (
                                    <div
                                        className="bg-orange-400 h-full transition-all"
                                        style={{ width: `${(receivablesAging.days60 / totalAging) * 100}%` }}
                                        title={`31-60 días: ${formatCurrency(receivablesAging.days60)}`}
                                    />
                                )}
                                {receivablesAging.days90 > 0 && (
                                    <div
                                        className="bg-rose-500 h-full transition-all"
                                        style={{ width: `${(receivablesAging.days90 / totalAging) * 100}%` }}
                                        title={`61-90 días: ${formatCurrency(receivablesAging.days90)}`}
                                    />
                                )}
                                {receivablesAging.daysOver90 > 0 && (
                                    <div
                                        className="bg-red-700 h-full transition-all"
                                        style={{ width: `${(receivablesAging.daysOver90 / totalAging) * 100}%` }}
                                        title={`+90 días: ${formatCurrency(receivablesAging.daysOver90)}`}
                                    />
                                )}
                                {receivablesAging.sinVencimiento > 0 && (
                                    <div
                                        className="bg-slate-400 h-full transition-all"
                                        style={{ width: `${(receivablesAging.sinVencimiento / totalAging) * 100}%` }}
                                        title={`Sin Vencimiento: ${formatCurrency(receivablesAging.sinVencimiento)}`}
                                    />
                                )}
                            </div>

                            {/* Color Legend & Values */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
                                {[
                                    { label: 'No vencido', val: receivablesAging.noVencido, color: 'bg-green-500' },
                                    { label: '1 - 30 días', val: receivablesAging.days30, color: 'bg-yellow-400' },
                                    { label: '31 - 60 días', val: receivablesAging.days60, color: 'bg-orange-400' },
                                    { label: '61 - 90 días', val: receivablesAging.days90, color: 'bg-rose-500' },
                                    { label: '+90 días', val: receivablesAging.daysOver90, color: 'bg-red-700' },
                                    { label: 'Sin Vencimiento', val: receivablesAging.sinVencimiento, color: 'bg-slate-400' }
                                ].map((bucket, i) => {
                                    const pct = totalAging > 0 ? (bucket.val / totalAging) * 100 : 0;
                                    return (
                                        <div key={i} className="flex flex-col items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-muted-foreground">
                                                <span className={`w-2.5 h-2.5 rounded-full ${bucket.color}`} />
                                                {bucket.label}
                                            </div>
                                            <div className="text-sm font-extrabold text-foreground font-mono">{formatCurrency(bucket.val)}</div>
                                            <div className="text-[10px] text-muted-foreground font-semibold">{pct.toFixed(1)}% del total</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Products and Clients horizontal bar lists */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Products */}
                <Card className="bg-white border shadow-sm">
                    <CardHeader className="p-5 border-b flex flex-row items-center gap-2">
                        <Package className="h-5 w-5 text-brand-1" />
                        <div>
                            <CardTitle className="text-base font-semibold">Productos más Vendidos (Top 10)</CardTitle>
                            <CardDescription className="text-xs">Listado por ingresos generados, cantidad vendida y márgenes brutas</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-5">Producto</TableHead>
                                    <TableHead className="text-right">Cant. Vendida</TableHead>
                                    <TableHead className="text-right">Margen %</TableHead>
                                    <TableHead className="text-right pr-5">Total Ingresos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts.map((p, i) => {
                                    const progress = (p.ingreso / maxProductIngreso) * 100;
                                    const margin = p.ingreso > 0 ? (p.gananciaBruta / p.ingreso) * 100 : 0;
                                    return (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <TableCell className="font-semibold pl-5 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground max-w-[200px] truncate">{p.descripcion}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">Cód: {p.codigoInterno} · Stock: {p.stockActual}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{formatNumber(p.cantidad)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-600">{margin.toFixed(1)}%</TableCell>
                                            <TableCell className="text-right font-mono pr-5 py-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-foreground">{formatCurrency(p.ingreso)}</span>
                                                    <div className="w-16 bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                                        <div className="bg-brand-1 h-full rounded-full" style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {topProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground font-semibold">
                                            No hay registros de productos
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Top Clients */}
                <Card className="bg-white border shadow-sm">
                    <CardHeader className="p-5 border-b flex flex-row items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <div>
                            <CardTitle className="text-base font-semibold">Clientes Principales (Top 10)</CardTitle>
                            <CardDescription className="text-xs">Los clientes con mayor facturación, cobros y saldos pendientes</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-5">Cliente</TableHead>
                                    <TableHead className="text-right">Facturas</TableHead>
                                    <TableHead className="text-right">Saldo Pend.</TableHead>
                                    <TableHead className="text-right pr-5">Total Compra</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topClients.map((c, i) => {
                                    const progress = (c.totalFacturado / maxClientFacturado) * 100;
                                    return (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <TableCell className="font-semibold pl-5 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground max-w-[200px] truncate">{c.razonSocial}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">RUC: {c.ruc}{c.dv ? `-${c.dv}` : ''}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{c.facturasCount}</TableCell>
                                            <TableCell className={`text-right font-mono font-bold ${c.saldoPendiente > 0 ? 'text-amber-500' : 'text-muted-foreground/40'}`}>
                                                {c.saldoPendiente > 0 ? formatCurrency(c.saldoPendiente) : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono pr-5 py-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-foreground">{formatCurrency(c.totalFacturado)}</span>
                                                    <div className="w-16 bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {topClients.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground font-semibold">
                                            No hay registros de clientes
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Sales by Seller */}
            <Card className="bg-white border shadow-sm">
                <CardHeader className="p-5 border-b">
                    <CardTitle className="text-base font-semibold">Ventas por Vendedor</CardTitle>
                    <CardDescription className="text-xs">Volumen total de facturas y montos netos emitidos por cada usuario</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-5">Vendedor</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead className="text-right">Documentos FE</TableHead>
                                <TableHead className="text-right pr-5">Total Emitido</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salesBySeller.map((s, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-semibold pl-5 py-3">{s.nombre}</TableCell>
                                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                                    <TableCell className="text-right font-mono font-semibold">{s.facturasCount}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-foreground pr-5 py-3">{formatCurrency(s.totalFacturado)}</TableCell>
                                </TableRow>
                            ))}
                            {salesBySeller.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground font-semibold">
                                        No hay registros de vendedores
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Invoice Detail with server-side pagination */}
            <Card className="bg-white border shadow-sm">
                <CardHeader className="p-5 border-b">
                    <CardTitle className="text-base font-semibold">Registro Detallado de Documentos</CardTitle>
                    <CardDescription className="text-xs">Listado de facturas y notas de crédito con sus respectivos estados fiscales</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex flex-col justify-between">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-5">Documento</TableHead>
                                <TableHead>Fecha Emisión</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead className="text-right">Monto Neto</TableHead>
                                <TableHead className="text-right">Saldo Pend.</TableHead>
                                <TableHead>DGI</TableHead>
                                <TableHead className="pr-5">Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoiceDetail.invoices.map((inv, i) => {
                                let badgeColor = 'bg-blue-500';
                                if (inv.estadoDgi === 'aceptada') badgeColor = 'bg-green-500';
                                if (inv.estadoDgi === 'rechazada') badgeColor = 'bg-red-500';
                                if (inv.estadoDgi === 'pendiente') badgeColor = 'bg-yellow-500';
                                if (inv.estadoDgi === 'anulada') badgeColor = 'bg-slate-400';

                                return (
                                    <TableRow key={i} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
                                        <TableCell className="font-mono text-xs font-bold text-brand-1 pl-5 py-3">{inv.numeroCompleto}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {new Date(inv.fechaEmision).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground text-sm max-w-[160px] truncate">{inv.clienteNombre}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{inv.vendedor}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">{formatCurrency(inv.totalNeto)}</TableCell>
                                        <TableCell className={`text-right font-mono font-semibold tabular-nums ${inv.saldoPendiente > 0 ? 'text-amber-500 font-bold' : 'text-muted-foreground/60'}`}>
                                            {inv.saldoPendiente > 0 ? formatCurrency(inv.saldoPendiente) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${badgeColor} hover:${badgeColor} text-white font-bold h-5 uppercase text-[10px]`}>
                                                {inv.estadoDgi}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-5">
                                            <Badge variant="outline" className="font-bold h-5 uppercase text-[10px]">
                                                {inv.tipoDocumento}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {invoiceDetail.invoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground font-semibold">
                                        No hay documentos que coincidan con los filtros seleccionados
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination control row */}
                    {invoiceDetail.pageCount > 1 && (
                        <div className="flex items-center justify-between border-t px-5 py-4 bg-slate-50/50">
                            <span className="text-xs text-muted-foreground font-semibold">
                                Mostrando {Math.min((currentFilters.page - 1) * currentFilters.limit + 1, invoiceDetail.totalCount)} a {Math.min(currentFilters.page * currentFilters.limit, invoiceDetail.totalCount)} de {invoiceDetail.totalCount} registros
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentFilters.page - 1)}
                                    disabled={currentFilters.page <= 1}
                                    className="h-8 font-semibold text-xs"
                                >
                                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                                    Anterior
                                </Button>
                                <span className="text-xs font-bold text-foreground px-2">
                                    Pág {currentFilters.page} de {invoiceDetail.pageCount}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentFilters.page + 1)}
                                    disabled={currentFilters.page >= invoiceDetail.pageCount}
                                    className="h-8 font-semibold text-xs"
                                >
                                    Siguiente
                                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
