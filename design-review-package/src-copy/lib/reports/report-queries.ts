import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, startOfWeek, startOfMonth } from 'date-fns';

export interface ReportFilters {
    empresaId: string;
    dateFrom: Date;
    dateTo: Date;
    clienteId?: string;
    productoId?: string;
    creadorId?: string;  // vendedor
    estadoDgi?: string;
    metodoPago?: string;
    tipoDocumento?: string;
    paymentStatus?: string;
}

function buildPrismaWhere(filters: ReportFilters): Prisma.FacturaWhereInput {
    const where: Prisma.FacturaWhereInput = {
        empresaId: filters.empresaId,
        fechaEmision: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
        },
    };

    if (filters.clienteId) {
        where.clienteId = filters.clienteId;
    }
    if (filters.creadorId) {
        where.creadorId = filters.creadorId;
    }
    if (filters.estadoDgi && filters.estadoDgi !== 'all') {
        where.estadoDgi = filters.estadoDgi;
    }
    if (filters.tipoDocumento && filters.tipoDocumento !== 'all') {
        where.tipoDocumento = filters.tipoDocumento;
    }
    if (filters.productoId) {
        where.items = { some: { productoId: filters.productoId } };
    }
    if (filters.metodoPago && filters.metodoPago !== 'all') {
        where.pagos = { some: { metodoPago: filters.metodoPago } };
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        const now = new Date();
        if (filters.paymentStatus === 'pagada') {
            where.saldoPendiente = 0;
            where.estadoDgi = { not: 'anulada' };
        } else if (filters.paymentStatus === 'pendiente') {
            where.saldoPendiente = { gt: 0 };
            where.totalPagado = 0;
            where.estadoDgi = { not: 'anulada' };
            where.fechaVencimiento = { gte: now };
        } else if (filters.paymentStatus === 'parcial') {
            where.saldoPendiente = { gt: 0 };
            where.totalPagado = { gt: 0 };
            where.estadoDgi = { not: 'anulada' };
            where.fechaVencimiento = { gte: now };
        } else if (filters.paymentStatus === 'vencida') {
            where.saldoPendiente = { gt: 0 };
            where.estadoDgi = { not: 'anulada' };
            where.fechaVencimiento = { lt: now };
        } else if (filters.paymentStatus === 'anulada') {
            where.estadoDgi = 'anulada';
        }
    }

    return where;
}

async function getPeriodStats(filters: ReportFilters) {
    const whereClause = buildPrismaWhere(filters);

    // Active FEs
    const feWhere = {
        ...whereClause,
        tipoDocumento: 'FE',
        estadoDgi: { not: 'anulada' }
    };
    const feAgg = await prisma.factura.aggregate({
        where: feWhere,
        _sum: {
            totalNeto: true,
            saldoPendiente: true,
            totalItbms: true,
        },
        _count: {
            id: true,
        }
    });

    // Active NCs
    const ncWhere = {
        ...whereClause,
        tipoDocumento: 'NC',
        estadoDgi: { not: 'anulada' }
    };
    const ncAgg = await prisma.factura.aggregate({
        where: ncWhere,
        _sum: {
            totalNeto: true,
        },
        _count: {
            id: true,
        }
    });

    // Payments collected in the period
    const pagoWhere: Prisma.PagoWhereInput = {
        empresaId: filters.empresaId,
        fechaPago: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
        }
    };
    if (filters.clienteId) pagoWhere.clienteId = filters.clienteId;
    if (filters.metodoPago && filters.metodoPago !== 'all') pagoWhere.metodoPago = filters.metodoPago;
    if (filters.productoId) {
        pagoWhere.factura = { items: { some: { productoId: filters.productoId } } };
    }
    const pagoAgg = await prisma.pago.aggregate({
        where: pagoWhere,
        _sum: {
            monto: true,
        }
    });

    // Overdue accounts (invoice deadline has passed and there is a pending balance)
    const vencidaWhere = {
        ...feWhere,
        saldoPendiente: { gt: 0 },
        fechaVencimiento: { lt: new Date() }
    };
    const vencidaAgg = await prisma.factura.aggregate({
        where: vencidaWhere,
        _sum: {
            saldoPendiente: true
        }
    });

    // Gross profit = Sales - COGS
    const items = await prisma.facturaItem.findMany({
        where: {
            factura: {
                ...whereClause,
                estadoDgi: { not: 'anulada' }
            }
        },
        select: {
            montoTotal: true,
            costoUnitario: true,
            cantidad: true,
            factura: {
                select: {
                    tipoDocumento: true
                }
            }
        }
    });

    let grossProfit = 0;
    for (const item of items) {
        const revenue = Number(item.montoTotal || 0);
        const cost = Number(item.costoUnitario || 0) * Number(item.cantidad || 0);
        if (item.factura.tipoDocumento === 'FE') {
            grossProfit += (revenue - cost);
        } else if (item.factura.tipoDocumento === 'NC') {
            grossProfit -= (revenue - cost);
        }
    }

    const feTotal = Number(feAgg._sum.totalNeto || 0);
    const ncTotal = Number(ncAgg._sum.totalNeto || 0);
    const totalFacturado = feTotal - ncTotal;
    const totalCobrado = Number(pagoAgg._sum.monto || 0);
    const accountsReceivable = Number(feAgg._sum.saldoPendiente || 0);
    const accountsOverdue = Number(vencidaAgg._sum.saldoPendiente || 0);
    const itbms = Number(feAgg._sum.totalItbms || 0);
    const countFE = feAgg._count.id || 0;
    const countNC = ncAgg._count.id || 0;
    const ticketPromedio = countFE > 0 ? (totalFacturado / countFE) : 0;

    return {
        totalFacturado,
        totalCobrado,
        accountsReceivable,
        accountsOverdue,
        itbms,
        countFE,
        countNC,
        ticketPromedio,
        grossProfit
    };
}

export async function getReportKPIs(filters: ReportFilters) {
    const current = await getPeriodStats(filters);

    const duration = filters.dateTo.getTime() - filters.dateFrom.getTime();
    const prevFilters: ReportFilters = {
        ...filters,
        dateFrom: new Date(filters.dateFrom.getTime() - duration - 1000 * 60 * 60 * 24),
        dateTo: new Date(filters.dateFrom.getTime() - 1000 * 60 * 60 * 24)
    };

    const previous = await getPeriodStats(prevFilters);

    return {
        current,
        previous
    };
}

export async function getSalesTrend(filters: ReportFilters, groupBy: 'day' | 'week' | 'month') {
    const whereClause = buildPrismaWhere(filters);

    // Fetch Facturado
    const invoices = await prisma.factura.findMany({
        where: {
            ...whereClause,
            estadoDgi: { not: 'anulada' }
        },
        select: {
            fechaEmision: true,
            totalNeto: true,
            tipoDocumento: true
        }
    });

    // Fetch Cobrado
    const pagoWhere: Prisma.PagoWhereInput = {
        empresaId: filters.empresaId,
        fechaPago: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
        }
    };
    if (filters.clienteId) pagoWhere.clienteId = filters.clienteId;
    if (filters.metodoPago && filters.metodoPago !== 'all') pagoWhere.metodoPago = filters.metodoPago;
    if (filters.productoId) {
        pagoWhere.factura = { items: { some: { productoId: filters.productoId } } };
    }
    const payments = await prisma.pago.findMany({
        where: pagoWhere,
        select: {
            fechaPago: true,
            monto: true
        }
    });

    const points: { label: string; facturado: number; cobrado: number; sortKey: string }[] = [];

    if (groupBy === 'day') {
        const days = eachDayOfInterval({ start: filters.dateFrom, end: filters.dateTo });
        for (const day of days) {
            const key = format(day, 'yyyy-MM-dd');
            const label = format(day, 'dd MMM');
            points.push({ label, facturado: 0, cobrado: 0, sortKey: key });
        }
    } else if (groupBy === 'week') {
        const weeks = eachWeekOfInterval({ start: filters.dateFrom, end: filters.dateTo });
        for (const week of weeks) {
            const startW = startOfWeek(week);
            const key = format(startW, 'yyyy-MM-dd');
            const label = `Sem ${format(startW, 'dd MMM')}`;
            points.push({ label, facturado: 0, cobrado: 0, sortKey: key });
        }
    } else { // month
        const months = eachMonthOfInterval({ start: filters.dateFrom, end: filters.dateTo });
        for (const month of months) {
            const key = format(month, 'yyyy-MM');
            const label = format(month, 'MMM yyyy');
            points.push({ label, facturado: 0, cobrado: 0, sortKey: key });
        }
    }

    const getPointKey = (d: Date): string => {
        if (groupBy === 'day') return format(d, 'yyyy-MM-dd');
        if (groupBy === 'week') return format(startOfWeek(d), 'yyyy-MM-dd');
        return format(startOfMonth(d), 'yyyy-MM');
    };

    // Populate facturado
    for (const inv of invoices) {
        const key = getPointKey(inv.fechaEmision);
        const pt = points.find(p => p.sortKey === key);
        if (pt) {
            const val = Number(inv.totalNeto);
            if (inv.tipoDocumento === 'NC') {
                pt.facturado -= val;
            } else {
                pt.facturado += val;
            }
        }
    }

    // Populate cobrado
    for (const p of payments) {
        const key = getPointKey(p.fechaPago);
        const pt = points.find(p => p.sortKey === key);
        if (pt) {
            pt.cobrado += Number(p.monto);
        }
    }

    return points.map(pt => ({
        mes: pt.label,
        facturado: pt.facturado,
        cobrado: pt.cobrado
    }));
}

export async function getSalesByStatus(filters: ReportFilters) {
    const whereClause = buildPrismaWhere(filters);
    const statusGroups = await prisma.factura.groupBy({
        by: ['estadoDgi'],
        where: {
            ...whereClause,
            tipoDocumento: 'FE'
        },
        _count: {
            id: true
        },
        _sum: {
            totalNeto: true
        }
    });

    return statusGroups.map(g => ({
        status: g.estadoDgi,
        count: g._count.id,
        total: Number(g._sum.totalNeto || 0)
    }));
}

export async function getTopProducts(filters: ReportFilters, limit = 10) {
    const items = await prisma.facturaItem.findMany({
        where: {
            factura: {
                ...buildPrismaWhere(filters),
                estadoDgi: { not: 'anulada' }
            }
        },
        include: {
            producto: true,
            factura: {
                select: {
                    tipoDocumento: true
                }
            }
        }
    });

    const productMap = new Map<string, {
        id: string;
        codigoInterno: string;
        descripcion: string;
        cantidad: number;
        ingreso: number;
        costoTotal: number;
        gananciaBruta: number;
        stockActual: number;
    }>();

    for (const item of items) {
        const prodId = item.productoId;
        const qty = Number(item.cantidad);
        const revenue = Number(item.montoTotal);
        const cost = Number(item.costoUnitario) * qty;
        const factor = item.factura.tipoDocumento === 'NC' ? -1 : 1;

        if (!productMap.has(prodId)) {
            productMap.set(prodId, {
                id: prodId,
                codigoInterno: item.producto.codigoInterno,
                descripcion: item.descripcion,
                cantidad: 0,
                ingreso: 0,
                costoTotal: 0,
                gananciaBruta: 0,
                stockActual: item.producto.stockActual
            });
        }

        const data = productMap.get(prodId)!;
        data.cantidad += qty * factor;
        data.ingreso += revenue * factor;
        data.costoTotal += cost * factor;
        data.gananciaBruta += (revenue - cost) * factor;
    }

    return Array.from(productMap.values())
        .sort((a, b) => b.ingreso - a.ingreso)
        .slice(0, limit);
}

export async function getTopClients(filters: ReportFilters, limit = 10) {
    const invoices = await prisma.factura.findMany({
        where: {
            ...buildPrismaWhere(filters),
            estadoDgi: { not: 'anulada' }
        },
        include: {
            cliente: true
        }
    });

    const clientMap = new Map<string, {
        id: string;
        razonSocial: string;
        ruc: string;
        dv: string | null;
        facturasCount: number;
        totalFacturado: number;
        totalPagado: number;
        saldoPendiente: number;
        ultimaCompra: Date | null;
    }>();

    for (const inv of invoices) {
        const clientId = inv.clienteId;
        const factor = inv.tipoDocumento === 'NC' ? -1 : 1;
        const total = Number(inv.totalNeto) * factor;
        const pagado = Number(inv.totalPagado) * factor;
        const saldo = Number(inv.saldoPendiente) * factor;

        if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
                id: clientId,
                razonSocial: inv.cliente.razonSocial,
                ruc: inv.cliente.ruc,
                dv: inv.cliente.dv,
                facturasCount: 0,
                totalFacturado: 0,
                totalPagado: 0,
                saldoPendiente: 0,
                ultimaCompra: null
            });
        }

        const data = clientMap.get(clientId)!;
        if (inv.tipoDocumento === 'FE') {
            data.facturasCount += 1;
        }
        data.totalFacturado += total;
        data.totalPagado += pagado;
        data.saldoPendiente += saldo;

        const emision = new Date(inv.fechaEmision);
        if (!data.ultimaCompra || emision > data.ultimaCompra) {
            data.ultimaCompra = emision;
        }
    }

    return Array.from(clientMap.values())
        .sort((a, b) => b.totalFacturado - a.totalFacturado)
        .slice(0, limit);
}

export async function getReceivablesAging(filters: ReportFilters) {
    const baseWhere = buildPrismaWhere(filters);
    const invoices = await prisma.factura.findMany({
        where: {
            ...baseWhere,
            tipoDocumento: 'FE',
            estadoDgi: { not: 'anulada' },
            saldoPendiente: { gt: 0 }
        },
        select: {
            saldoPendiente: true,
            fechaVencimiento: true
        }
    });

    const now = new Date();
    const buckets = {
        noVencido: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        daysOver90: 0,
        sinVencimiento: 0
    };

    for (const inv of invoices) {
        const saldo = Number(inv.saldoPendiente);
        if (!inv.fechaVencimiento) {
            buckets.sinVencimiento += saldo;
            continue;
        }

        const vencimiento = new Date(inv.fechaVencimiento);
        if (vencimiento >= now) {
            buckets.noVencido += saldo;
        } else {
            const diffTime = Math.abs(now.getTime() - vencimiento.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
                buckets.days30 += saldo;
            } else if (diffDays <= 60) {
                buckets.days60 += saldo;
            } else if (diffDays <= 90) {
                buckets.days90 += saldo;
            } else {
                buckets.daysOver90 += saldo;
            }
        }
    }

    return buckets;
}

export async function getSalesBySeller(filters: ReportFilters) {
    const invoices = await prisma.factura.findMany({
        where: {
            ...buildPrismaWhere(filters),
            estadoDgi: { not: 'anulada' }
        },
        include: {
            creador: true
        }
    });

    const sellerMap = new Map<string, {
        id: string;
        nombre: string;
        email: string;
        facturasCount: number;
        totalFacturado: number;
    }>();

    for (const inv of invoices) {
        const sellerId = inv.creadorId;
        const factor = inv.tipoDocumento === 'NC' ? -1 : 1;
        const total = Number(inv.totalNeto) * factor;

        if (!sellerMap.has(sellerId)) {
            sellerMap.set(sellerId, {
                id: sellerId,
                nombre: inv.creador.nombre,
                email: inv.creador.email,
                facturasCount: 0,
                totalFacturado: 0
            });
        }

        const data = sellerMap.get(sellerId)!;
        if (inv.tipoDocumento === 'FE') {
            data.facturasCount += 1;
        }
        data.totalFacturado += total;
    }

    return Array.from(sellerMap.values())
        .sort((a, b) => b.totalFacturado - a.totalFacturado);
}

export async function getInvoiceDetail(filters: ReportFilters, page = 1, limit = 10) {
    const whereClause = buildPrismaWhere(filters);
    const skip = (page - 1) * limit;

    const [invoices, totalCount] = await Promise.all([
        prisma.factura.findMany({
            where: whereClause,
            include: {
                cliente: true,
                creador: true
            },
            orderBy: {
                fechaEmision: 'desc'
            },
            skip,
            take: limit
        }),
        prisma.factura.count({
            where: whereClause
        })
    ]);

    return {
        invoices: invoices.map(inv => ({
            id: inv.id,
            numeroCompleto: inv.numeroCompleto,
            fechaEmision: inv.fechaEmision,
            fechaVencimiento: inv.fechaVencimiento,
            clienteNombre: inv.cliente.razonSocial,
            clienteRuc: inv.cliente.ruc,
            totalNeto: Number(inv.totalNeto),
            totalItbms: Number(inv.totalItbms),
            totalPagado: Number(inv.totalPagado),
            saldoPendiente: Number(inv.saldoPendiente),
            estadoDgi: inv.estadoDgi,
            tipoDocumento: inv.tipoDocumento,
            vendedor: inv.creador.nombre
        })),
        totalCount,
        pageCount: Math.ceil(totalCount / limit)
    };
}
