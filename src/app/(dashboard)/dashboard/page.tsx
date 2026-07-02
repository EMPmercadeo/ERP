import Link from 'next/link';

import {
    DollarSign,
    FileText,
    Clock,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable';
import { DgiStatusCard } from '@/components/dashboard/DgiStatusCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendChart } from '@/components/dashboard/TrendChart';

import { prisma } from '@/lib/db';
import { subHours, subDays, subMonths, startOfDay, endOfDay, parseISO } from 'date-fns';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

async function getDashboardData(searchParams: { [key: string]: string | string[] | undefined }, empresaId: string) {
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

    const whereDate = { empresaId, fechaEmision: { gte: start, lte: end } };
    const wherePrev = { empresaId, fechaEmision: { gte: prevStart, lte: prevEnd } };

    // 1. Fetch Current Data & Details
    const [
        recentInvoices,
        dgiStats, // GroupBy
        totalSalesAgg,
        totalPaymentsAgg,
        totalReceivablesAgg,
        totalOverdueAgg,
        totalInvoices
    ] = await Promise.all([
        prisma.factura.findMany({
            where: whereDate,
            take: 20,
            orderBy: { fechaEmision: 'desc' },
            include: { cliente: { select: { razonSocial: true, ruc: true, dv: true } } }
        }),
        prisma.factura.groupBy({
            by: ['estadoDgi'],
            _count: { estadoDgi: true },
            where: whereDate
        }),
        prisma.factura.aggregate({
            _sum: { totalNeto: true },
            where: { ...whereDate, estadoDgi: { not: 'anulada' } }
        }),
        prisma.pago.aggregate({
            _sum: { monto: true },
            where: { empresaId, fechaPago: { gte: start, lte: end } }
        }),
        prisma.factura.aggregate({
            _sum: { saldoPendiente: true },
            where: { ...whereDate, estadoDgi: { not: 'anulada' } }
        }),
        prisma.factura.aggregate({
            _sum: { saldoPendiente: true },
            where: {
                ...whereDate,
                fechaVencimiento: { lt: now },
                saldoPendiente: { gt: 0 },
                estadoDgi: { not: 'anulada' }
            }
        }),
        prisma.factura.count({ where: whereDate })
    ]);

    // 2. Fetch Previous Data for Trends
    const [
        prevSalesAgg,
        prevPaymentsAgg,
        prevReceivablesAgg,
        prevOverdueAgg
    ] = await Promise.all([
        prisma.factura.aggregate({
            _sum: { totalNeto: true },
            where: { ...wherePrev, estadoDgi: { not: 'anulada' } }
        }),
        prisma.pago.aggregate({
            _sum: { monto: true },
            where: { empresaId, fechaPago: { gte: prevStart, lte: prevEnd } }
        }),
        prisma.factura.aggregate({
            _sum: { saldoPendiente: true },
            where: { ...wherePrev, estadoDgi: { not: 'anulada' } }
        }),
        prisma.factura.aggregate({
            _sum: { saldoPendiente: true },
            where: {
                ...wherePrev,
                fechaVencimiento: { lt: prevEnd },
                saldoPendiente: { gt: 0 },
                estadoDgi: { not: 'anulada' }
            }
        })
    ]);

    // 3. Last 6 months trend & sparks calculation
    const trendMonths: { mes: string; start: Date; end: Date }[] = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        trendMonths.push({
            mes: monthNames[d.getMonth()],
            start: startOfMonth,
            end: endOfMonth
        });
    }

    const trendDataAndSparks = await Promise.all(
        trendMonths.map(async (m) => {
            const [salesAgg, paymentsAgg, pendingAgg, overdueAgg] = await Promise.all([
                prisma.factura.aggregate({
                    _sum: { totalNeto: true },
                    where: {
                        empresaId,
                        fechaEmision: { gte: m.start, lte: m.end },
                        estadoDgi: { not: 'anulada' }
                    }
                }),
                prisma.pago.aggregate({
                    _sum: { monto: true },
                    where: {
                        empresaId,
                        fechaPago: { gte: m.start, lte: m.end }
                    }
                }),
                prisma.factura.aggregate({
                    _sum: { saldoPendiente: true },
                    where: {
                        empresaId,
                        fechaEmision: { gte: m.start, lte: m.end },
                        estadoDgi: { not: 'anulada' }
                    }
                }),
                prisma.factura.aggregate({
                    _sum: { saldoPendiente: true },
                    where: {
                        empresaId,
                        fechaEmision: { gte: m.start, lte: m.end },
                        fechaVencimiento: { lt: now },
                        saldoPendiente: { gt: 0 },
                        estadoDgi: { not: 'anulada' }
                    }
                })
            ]);

            return {
                mes: m.mes,
                facturado: Number(salesAgg._sum.totalNeto || 0),
                cobrado: Number(paymentsAgg._sum.monto || 0),
                pendiente: Number(pendingAgg._sum.saldoPendiente || 0),
                vencido: Number(overdueAgg._sum.saldoPendiente || 0)
            };
        })
    );

    const trendData = trendDataAndSparks.map(d => ({
        mes: d.mes,
        facturado: d.facturado,
        cobrado: d.cobrado
    }));

    const sparks = {
        facturado: trendDataAndSparks.map(d => d.facturado),
        cobrado: trendDataAndSparks.map(d => d.cobrado),
        pendiente: trendDataAndSparks.map(d => d.pendiente),
        vencido: trendDataAndSparks.map(d => d.vencido)
    };

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

    const currentCobrado = Number(totalPaymentsAgg._sum.monto || 0);
    const previousCobrado = Number(prevPaymentsAgg._sum.monto || 0);
    const cobradoChange = previousCobrado === 0 ? (currentCobrado > 0 ? 100 : 0) : ((currentCobrado - previousCobrado) / previousCobrado) * 100;

    const currentPendiente = Number(totalReceivablesAgg._sum.saldoPendiente || 0);
    const previousPendiente = Number(prevReceivablesAgg._sum.saldoPendiente || 0);
    const pendienteChange = previousPendiente === 0 ? (currentPendiente > 0 ? 100 : 0) : ((currentPendiente - previousPendiente) / previousPendiente) * 100;

    const currentVencido = Number(totalOverdueAgg._sum.saldoPendiente || 0);
    const previousVencido = Number(prevOverdueAgg._sum.saldoPendiente || 0);
    const vencidoChange = previousVencido === 0 ? (currentVencido > 0 ? 100 : 0) : ((currentVencido - previousVencido) / previousVencido) * 100;

    return {
        recentInvoices: recentInvoices.map(inv => ({
            id: inv.numeroCompleto || inv.id,
            client: inv.cliente.razonSocial,
            clientRuc: inv.cliente.ruc + (inv.cliente.dv ? `-${inv.cliente.dv}` : ''),
            amount: Number(inv.totalNeto),
            balance: Number(inv.saldoPendiente),
            status: (inv.estadoDgi === 'borrador' ? 'pendiente' : inv.estadoDgi) as any,
            paymentStatus: (
                inv.saldoPendiente.equals(0)
                    ? 'pagada'
                    : (inv.fechaVencimiento && inv.fechaVencimiento < now && inv.saldoPendiente.gt(0))
                        ? 'vencida'
                        : inv.saldoPendiente.equals(inv.totalNeto)
                            ? 'pendiente'
                            : 'parcial'
            ) as any,
            date: inv.fechaEmision.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
        })),
        dgiData: { ...stats, error: 0 },
        trendData,
        sparks,
        kpiData: {
            ventas: {
                value: currentSales,
                change: Math.round(salesChange * 10) / 10,
                trend: (salesChange >= 0 ? 'up' : 'down') as 'up' | 'down'
            },
            cobrado: {
                value: currentCobrado,
                change: Math.round(cobradoChange * 10) / 10,
                trend: (cobradoChange >= 0 ? 'up' : 'down') as 'up' | 'down'
            },
            pendiente: {
                value: currentPendiente,
                change: Math.round(pendienteChange * 10) / 10,
                trend: (pendienteChange >= 0 ? 'up' : 'down') as 'up' | 'down'
            },
            vencido: {
                value: currentVencido,
                change: Math.round(vencidoChange * 10) / 10,
                trend: (vencidoChange >= 0 ? 'up' : 'down') as 'up' | 'down'
            }
        },
        debugDate: { start: start.toISOString(), end: end.toISOString() }
    };
}

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();
    const { recentInvoices, dgiData, trendData, sparks, kpiData } = await getDashboardData(searchParams, empresaId);

    return (
        <>
            <Topbar />

            <ContentContainer className="space-y-4">
                <DashboardHeader
                    title="Dashboard"
                    kpiData={kpiData}
                    recentInvoices={recentInvoices}
                />

                {/* KPIs Row */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                    <KpiCard
                        title="Facturado"
                        value={kpiData.ventas.value}
                        change={kpiData.ventas.change}
                        trend={kpiData.ventas.trend}
                        icon={DollarSign}
                        format="currency"
                        variant="primary"
                        sparkPoints={sparks.facturado}
                        sparkColor="white"
                        sparkId="spark-facturado"
                        href="/invoices"
                    />
                    <KpiCard
                        title="Cobrado"
                        value={kpiData.cobrado.value}
                        change={kpiData.cobrado.change}
                        trend={kpiData.cobrado.trend}
                        icon={CheckCircle2}
                        format="currency"
                        chipClass="bg-success-bg text-success"
                        sparkPoints={sparks.cobrado}
                        sparkColor="var(--success)"
                        sparkId="spark-cobrado"
                        href="/invoices?status=pagada"
                    />
                    <KpiCard
                        title="Pendiente por Cobrar"
                        value={kpiData.pendiente.value}
                        change={kpiData.pendiente.change}
                        trend={kpiData.pendiente.trend}
                        icon={Clock}
                        format="currency"
                        chipClass="bg-warning-bg text-warning"
                        sparkPoints={sparks.pendiente}
                        sparkColor="var(--warning)"
                        sparkId="spark-pendiente"
                        href="/invoices?status=pendiente"
                    />
                    <KpiCard
                        title="Vencido"
                        value={kpiData.vencido.value}
                        change={kpiData.vencido.change}
                        trend={kpiData.vencido.trend}
                        icon={AlertTriangle}
                        format="currency"
                        chipClass="bg-danger-bg text-danger"
                        sparkPoints={sparks.vencido}
                        sparkColor="var(--danger)"
                        sparkId="spark-vencido"
                        href="/invoices?status=vencida"
                    />
                </div>

                {/* Trend + DGI Row */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-stretch">
                    <div className="lg:col-span-8 flex flex-col">
                        <TrendChart data={trendData} />
                    </div>
                    <div className="lg:col-span-4 flex flex-col">
                        <DgiStatusCard data={dgiData} />
                    </div>
                </div>

                {/* Recent Invoices Table */}
                <div className="w-full">
                    <RecentActivityTable invoices={recentInvoices} />
                </div>

                {/* Quick Actions Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/invoices/new" className="block">
                        <Card className="cursor-pointer transition-colors hover:bg-slate-50 border-border group h-full">
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
                        <Card className="cursor-pointer transition-colors hover:bg-slate-50 border-border group h-full">
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
                        <Card className="cursor-pointer transition-colors hover:bg-slate-50 border-border group h-full">
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
