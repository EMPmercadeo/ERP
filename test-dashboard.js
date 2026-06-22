const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { subHours, subDays, subMonths, startOfDay, endOfDay, parseISO } = require('date-fns');

async function getDashboardData(searchParams) {
    const period = (searchParams?.period) || '3m';
    const customStart = searchParams?.start;
    const customEnd = searchParams?.end;

    let start = new Date();
    let end = new Date();
    const now = new Date();

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

    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(prevEnd.getTime() - duration);

    const whereDate = { fechaEmision: { gte: start, lte: end } };
    const wherePrev = { fechaEmision: { gte: prevStart, lte: prevEnd } };

    console.log('Running Dashboard queries...');
    const [
        recentInvoices,
        dgiStats,
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
            where: { fechaPago: { gte: start, lte: end } }
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
            where: { fechaPago: { gte: prevStart, lte: prevEnd } }
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
    const trendMonths = [];
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
                        fechaEmision: { gte: m.start, lte: m.end },
                        estadoDgi: { not: 'anulada' }
                    }
                }),
                prisma.pago.aggregate({
                    _sum: { monto: true },
                    where: {
                        fechaPago: { gte: m.start, lte: m.end }
                    }
                }),
                prisma.factura.aggregate({
                    _sum: { saldoPendiente: true },
                    where: {
                        fechaEmision: { gte: m.start, lte: m.end },
                        estadoDgi: { not: 'anulada' }
                    }
                }),
                prisma.factura.aggregate({
                    _sum: { saldoPendiente: true },
                    where: {
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

    console.log('Mapping invoices...');
    const mappedInvoices = recentInvoices.map(inv => ({
        id: inv.numeroCompleto || inv.id,
        client: inv.cliente.razonSocial,
        clientRuc: inv.cliente.ruc + (inv.cliente.dv ? `-${inv.cliente.dv}` : ''),
        amount: Number(inv.totalNeto),
        balance: Number(inv.saldoPendiente),
        status: (inv.estadoDgi === 'borrador' ? 'pendiente' : inv.estadoDgi),
        paymentStatus: (
            inv.saldoPendiente.equals(0)
                ? 'pagada'
                : (inv.fechaVencimiento && inv.fechaVencimiento < now && inv.saldoPendiente.gt(0))
                    ? 'vencida'
                    : inv.saldoPendiente.equals(inv.totalNeto)
                        ? 'pendiente'
                        : 'parcial'
        ),
        date: inv.fechaEmision.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
    }));

    console.log('Mapping completed successfully.');
    console.log('Sample invoice paymentStatus:', mappedInvoices[0]?.paymentStatus);
}

async function main() {
    try {
        await getDashboardData({});
    } catch (e) {
        console.error('Crash error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
