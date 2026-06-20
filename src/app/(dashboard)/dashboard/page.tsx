import Link from 'next/link';

import {
    DollarSign,
    FileText,
    AlertCircle,
    TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable';
import { DgiStatusCard } from '@/components/dashboard/DgiStatusCard';
import { KpiCard } from '@/components/dashboard/KpiCard';

import { prisma } from '@/lib/db';
import { subHours, subDays, subMonths, startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

async function getDashboardData(searchParams: { [key: string]: string | string[] | undefined }) {
    const period = (searchParams?.period as string) || '3m';
    const customStart = searchParams?.start as string;
    const customEnd = searchParams?.end as string;

    let start = new Date();
    let end = new Date();
    const now = new Date();

    // Determine Date Range
    if (period === 'custom' && customStart && customEnd) {
        start = startOfDay(parseISO(customStart));
        end = endOfDay(parseISO(customEnd));
    } else {
        end = now;
        switch (period) {
            case '24h': start = subHours(now, 24); break;
            case '7d': start = subDays(now, 7); break;
            case '28d': start = subDays(now, 28); break;
            case '3m': start = subMonths(now, 3); break;
            case '6m': start = subMonths(now, 6); break;
            case '12m': start = subMonths(now, 12); break;
            case '16m': start = subMonths(now, 16); break;
            default: start = subMonths(now, 3);
        }
    }

    // Previous Period (for trends)
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    // Google Analytics style: "Previous period"
    const prevStart = new Date(prevEnd.getTime() - duration);

    const whereDate = { fechaEmision: { gte: start, lte: end } };
    const wherePrev = { fechaEmision: { gte: prevStart, lte: prevEnd } };

    // 1. Fetch Current Data
    const [
        recentInvoices,
        dgiStats, // GroupBy
        totalSalesAgg,
        totalInvoices,
        totalReceivablesAgg
    ] = await Promise.all([
        prisma.factura.findMany({
            where: whereDate,
            take: 20,
            orderBy: { fechaEmision: 'desc' },
            include: { cliente: { select: { razonSocial: true } } }
        }),
        prisma.factura.groupBy({
            by: ['estadoDgi'],
            _count: { estadoDgi: true },
            where: whereDate
        }),
        prisma.factura.aggregate({
            _sum: { totalNeto: true },
            where: whereDate
        }),
        prisma.factura.count({ where: whereDate }),
        prisma.factura.aggregate({
            _sum: { saldoPendiente: true },
            where: whereDate
        })
    ]);

    // 2. Fetch Previous Data for Trends
    const [prevSalesAgg, prevInvoices] = await Promise.all([
        prisma.factura.aggregate({ _sum: { totalNeto: true }, where: wherePrev }),
        prisma.factura.count({ where: wherePrev })
    ]);

    // Process DGI Stats
    const stats = { aceptadas: 0, pendientes: 0, rechazadas: 0, enviado: 0 };
    dgiStats.forEach((curr) => {
        const raw = (curr.estadoDgi || '').toLowerCase();
        const count = curr._count.estadoDgi;
        if (raw.includes('acept')) stats.aceptadas += count;
        else if (raw.includes('pend') || raw.includes('borr')) stats.pendientes += count;
        else if (raw.includes('rechaza') || raw.includes('error') || raw.includes('anul')) stats.rechazadas += count;
        else if (raw.includes('envia') || raw.includes('proce')) stats.enviado += count;
    });

    // Calculate Trends
    const currentSales = Number(totalSalesAgg._sum.totalNeto || 0);
    const previousSales = Number(prevSalesAgg._sum.totalNeto || 0);
    const salesChange = previousSales === 0 ? (currentSales > 0 ? 100 : 0) : ((currentSales - previousSales) / previousSales) * 100;

    const currentInvCount = totalInvoices;
    const prevInvCount = prevInvoices;
    const invChange = prevInvCount === 0 ? (currentInvCount > 0 ? 100 : 0) : ((currentInvCount - prevInvCount) / prevInvCount) * 100;

    const receivables = Number(totalReceivablesAgg._sum.saldoPendiente || 0);

    return {
        recentInvoices: recentInvoices.map(inv => ({
            id: inv.numeroCompleto || inv.id,
            client: inv.cliente.razonSocial,
            amount: Number(inv.totalNeto),
            balance: Number(inv.saldoPendiente),
            status: (inv.estadoDgi === 'borrador' ? 'pendiente' : inv.estadoDgi) as any,
            paymentStatus: (inv.saldoPendiente.equals(0) ? 'pagada' : inv.saldoPendiente.equals(inv.totalNeto) ? 'pendiente' : 'parcial') as any,
            date: inv.fechaEmision.toISOString().split('T')[0]
        })),
        dgiData: { ...stats, error: 0 },
        kpiData: {
            ventas: {
                value: currentSales,
                change: Math.round(salesChange * 10) / 10,
                trend: salesChange >= 0 ? 'up' : 'down' as const
            },
            facturasPendientes: {
                value: stats.pendientes,
                change: 0,
                trend: 'up' as const
            },
            cuentasPorCobrar: {
                value: receivables,
                change: 0,
                trend: 'up' as const
            },
            documentosProcesados: {
                value: totalInvoices,
                change: Math.round(invChange * 10) / 10,
                trend: invChange >= 0 ? 'up' : 'down' as const
            }
        },
        debugDate: { start: start.toISOString(), end: end.toISOString() }
    };
}

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const { recentInvoices, dgiData, kpiData, debugDate } = await getDashboardData(searchParams);

    return (
        <>
            <Topbar>
            </Topbar>

            <ContentContainer className="space-y-4">

                <DashboardHeader
                    title="Dashboard"
                    kpiData={kpiData}
                    recentInvoices={recentInvoices}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                    <KpiCard
                        title="Ventas del Periodo"
                        value={kpiData.ventas.value}
                        change={kpiData.ventas.change}
                        trend={kpiData.ventas.trend as "up" | "down"}
                        icon={DollarSign}
                        format="currency"
                        variant="primary"
                        href="/invoices"
                    />
                    <KpiCard
                        title="Facturas Pendientes (DGI)"
                        value={kpiData.facturasPendientes.value}
                        change={kpiData.facturasPendientes.change}
                        trend={kpiData.facturasPendientes.trend as "up" | "down"}
                        icon={AlertCircle}
                        href="/invoices?status=pendiente"
                    />
                    <KpiCard
                        title="Cuentas por Cobrar"
                        value={kpiData.cuentasPorCobrar.value}
                        change={kpiData.cuentasPorCobrar.change}
                        trend={kpiData.cuentasPorCobrar.trend as "up" | "down"}
                        icon={FileText}
                        format="currency"
                        href="/clients"
                    />
                    <KpiCard
                        title="Documentos Generados"
                        value={kpiData.documentosProcesados.value}
                        change={kpiData.documentosProcesados.change}
                        trend={kpiData.documentosProcesados.trend as "up" | "down"}
                        icon={TrendingUp}
                        href="/invoices"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
                    <div className="lg:col-span-8 h-full">
                        <RecentActivityTable invoices={recentInvoices} />
                    </div>
                    <div className="lg:col-span-4 h-full">
                        <DgiStatusCard data={dgiData} />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Link href="/invoices/new" className="block">
                        <Card className="cursor-pointer transition-colors hover:bg-accent/50 group h-full">
                            <CardContent className="flex items-center gap-4 pt-6">
                                <div className="rounded-lg bg-brand-1/10 p-3 group-hover:bg-brand-1 group-hover:text-white transition-colors text-brand-1">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Nueva Factura</h3>
                                    <p className="text-sm text-muted-foreground">Crear factura electrónica</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/invoices?status=pendiente" className="block">
                        <Card className="cursor-pointer transition-colors hover:bg-accent/50 group h-full">
                            <CardContent className="flex items-center gap-4 pt-6">
                                <div className="rounded-lg bg-emerald-500/10 p-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                                    <DollarSign className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Registrar Pago</h3>
                                    <p className="text-sm text-muted-foreground">Aplicar pago a factura</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/reports" className="block">
                        <Card className="cursor-pointer transition-colors hover:bg-accent/50 group h-full">
                            <CardContent className="flex items-center gap-4 pt-6">
                                <div className="rounded-lg bg-purple-500/10 p-3 group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-500">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Ver Reportes</h3>
                                    <p className="text-sm text-muted-foreground">Analítica y métricas</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </ContentContainer>
        </>
    );
}
