import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import {
    getReportKPIs,
    getSalesTrend,
    getSalesByStatus,
    getTopProducts,
    getTopClients,
    getReceivablesAging,
    getSalesBySeller,
    getInvoiceDetail,
    ReportFilters
} from '@/lib/reports/report-queries';
import { startOfMonth, endOfDay, parseISO, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        dateFrom?: string;
        dateTo?: string;
        clienteId?: string;
        productoId?: string;
        creadorId?: string;
        estadoDgi?: string;
        metodoPago?: string;
        tipoDocumento?: string;
        groupBy?: 'day' | 'week' | 'month';
        page?: string;
        limit?: string;
    }>;
}

export default async function ReportsPage(props: PageProps) {
    const tenant = await getTenantContext();
    const empresaId = tenant.empresaId;

    const searchParams = await props.searchParams;
    const dateFromStr = searchParams.dateFrom;
    const dateToStr = searchParams.dateTo;
    const clienteId = searchParams.clienteId || undefined;
    const productoId = searchParams.productoId || undefined;
    const creadorId = searchParams.creadorId || undefined;
    const estadoDgi = searchParams.estadoDgi || 'all';
    const metodoPago = searchParams.metodoPago || 'all';
    const tipoDocumento = searchParams.tipoDocumento || 'all';
    const page = Number(searchParams.page) || 1;
    const limit = Number(searchParams.limit) || 10;

    // Parse dates or default to current month
    const dateFrom = dateFromStr ? parseISO(dateFromStr) : startOfMonth(new Date());
    const dateTo = dateToStr ? parseISO(dateToStr) : endOfDay(new Date());

    // Auto-detect best grouping based on date range if not specified
    const rangeInDays = differenceInDays(dateTo, dateFrom);
    let groupBy = searchParams.groupBy;
    if (!groupBy) {
        if (rangeInDays <= 31) {
            groupBy = 'day';
        } else if (rangeInDays <= 180) {
            groupBy = 'week';
        } else {
            groupBy = 'month';
        }
    }

    const filters: ReportFilters = {
        empresaId,
        dateFrom,
        dateTo,
        clienteId,
        productoId,
        creadorId,
        estadoDgi,
        metodoPago,
        tipoDocumento,
    };

    // Parallel aggregate data fetching from database
    const [
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
        filterSellers
    ] = await Promise.all([
        getReportKPIs(filters),
        getSalesTrend(filters, groupBy),
        getSalesByStatus(filters),
        getTopProducts(filters, 10),
        getTopClients(filters, 10),
        getReceivablesAging(filters),
        getSalesBySeller(filters),
        getInvoiceDetail(filters, page, limit),
        // Filter lookup lists
        prisma.cliente.findMany({
            where: { empresaId },
            select: { id: true, razonSocial: true },
            orderBy: { razonSocial: 'asc' }
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { id: true, descripcion: true, codigoInterno: true },
            orderBy: { descripcion: 'asc' }
        }),
        prisma.usuario.findMany({
            where: { empresaId, activo: true },
            select: { id: true, nombre: true },
            orderBy: { nombre: 'asc' }
        })
    ]);

    return (
        <>
            <Topbar title="Reportes" />
            <ContentContainer>
                <ReportsDashboard
                    kpis={kpis}
                    trend={trend}
                    statusSales={statusSales}
                    topProducts={topProducts}
                    topClients={topClients}
                    receivablesAging={receivablesAging}
                    salesBySeller={salesBySeller}
                    invoiceDetail={invoiceDetail}
                    filterClients={filterClients}
                    filterProducts={filterProducts}
                    filterSellers={filterSellers}
                    currentFilters={{
                        dateFrom: dateFrom.toISOString().split('T')[0],
                        dateTo: dateTo.toISOString().split('T')[0],
                        clienteId: clienteId || 'all',
                        productoId: productoId || 'all',
                        creadorId: creadorId || 'all',
                        estadoDgi,
                        metodoPago,
                        tipoDocumento,
                        groupBy,
                        page,
                        limit
                    }}
                />
            </ContentContainer>
        </>
    );
}
