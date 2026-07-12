import { prisma } from '@/lib/db';

/**
 * Reporte Z / Cierre diario del POS
 * ---------------------------------
 * Resumen fiscal de las ventas del POS, ya sea de un TURNO de caja concreto (Reporte Z de
 * cierre de turno) o de un DÍA completo de la empresa (cierre diario). Agrega:
 *  - Ventas por método de pago (efectivo, tarjeta, Yappy, transferencia, mixto)
 *  - Desglose de ITBMS por tasa (0 / 7 / 10 / 15 %)
 *  - Conteo de documentos (emitidos con CUFE, en cola/contingencia, anulados)
 *  - Totales (subtotal, ITBMS, total)
 *  - Arqueo de caja si es por turno (esperado vs contado, diferencia)
 *
 * Solo LEE datos existentes (Venta / TurnoCaja), no modifica nada. Siempre acotado por
 * empresaId (multi-tenant).
 */

type ItemVenta = {
    cantidad?: number;
    precioUnitario?: number;
    itbmsPorcentaje?: number;
    descuentoPorcentaje?: number;
};

export interface ReporteZMetodoPago {
    metodo: string;
    cantidad: number;
    total: number;
}

export interface ReporteZItbmsTasa {
    tasa: number;
    base: number;
    impuesto: number;
}

export interface ReporteZ {
    tipo: 'turno' | 'diario';
    empresa: string;
    generadoEn: string;
    rango: { desde: string; hasta: string };
    turno?: {
        id: string;
        cajero: string;
        estado: string;
        fechaApertura: string;
        fechaCierre: string | null;
        montoInicial: number;
        arqueo: { esperado: number | null; contado: number | null; diferencia: number | null };
    };
    documentos: {
        emitidos: number;
        conCufe: number;
        enColaOContingencia: number;
        anulados: number;
    };
    porMetodoPago: ReporteZMetodoPago[];
    itbmsPorTasa: ReporteZItbmsTasa[];
    totales: { subtotal: number; itbms: number; total: number };
}

function r2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseItems(raw: unknown): ItemVenta[] {
    if (Array.isArray(raw)) return raw as ItemVenta[];
    return [];
}

/**
 * Genera el Reporte Z. Pasa `turnoId` para el cierre de un turno, o `fecha` (YYYY-MM-DD)
 * para el cierre diario de la empresa. Si no se pasa ninguno, usa el día de hoy.
 */
export async function generarReporteZ(params: {
    empresaId: string;
    turnoId?: string | null;
    fecha?: string | null;
}): Promise<ReporteZ | null> {
    const { empresaId } = params;

    const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { razonSocial: true, nombreComercial: true },
    });
    const nombreEmpresa = empresa?.nombreComercial || empresa?.razonSocial || 'Empresa';

    let tipo: 'turno' | 'diario';
    let desde: Date;
    let hasta: Date;
    let turnoInfo: ReporteZ['turno'] | undefined;
    let ventasWhere: { empresaId: string; turnoCajaId?: string; createdAt?: { gte: Date; lte: Date } };

    if (params.turnoId) {
        const turno = await prisma.turnoCaja.findFirst({
            where: { id: params.turnoId, empresaId },
            include: { usuario: { select: { nombre: true } } },
        });
        if (!turno) return null;

        tipo = 'turno';
        desde = turno.fechaApertura;
        hasta = turno.fechaCierre ?? new Date();
        turnoInfo = {
            id: turno.id,
            cajero: turno.usuario?.nombre || 'Cajero',
            estado: turno.estado,
            fechaApertura: turno.fechaApertura.toISOString(),
            fechaCierre: turno.fechaCierre ? turno.fechaCierre.toISOString() : null,
            montoInicial: Number(turno.montoInicial),
            arqueo: {
                esperado: turno.montoEsperadoCierre != null ? Number(turno.montoEsperadoCierre) : null,
                contado: turno.montoContadoCierre != null ? Number(turno.montoContadoCierre) : null,
                diferencia: turno.diferencia != null ? Number(turno.diferencia) : null,
            },
        };
        ventasWhere = { empresaId, turnoCajaId: turno.id };
    } else {
        tipo = 'diario';
        const base = params.fecha ? new Date(`${params.fecha}T00:00:00`) : new Date();
        if (isNaN(base.getTime())) return null;
        desde = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
        hasta = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999);
        ventasWhere = { empresaId, createdAt: { gte: desde, lte: hasta } };
    }

    const ventas = await prisma.venta.findMany({
        where: ventasWhere,
        select: {
            subtotal: true,
            itbms: true,
            total: true,
            metodoPago: true,
            estado: true,
            cufe: true,
            items: true,
        },
    });

    const validas = ventas.filter((v) => v.estado !== 'ANULADA');
    const anuladas = ventas.length - validas.length;

    // Totales
    let subtotal = 0;
    let itbms = 0;
    let total = 0;
    // Por método de pago
    const metodoMap = new Map<string, { cantidad: number; total: number }>();
    // ITBMS por tasa
    const tasaMap = new Map<number, { base: number; impuesto: number }>();
    let conCufe = 0;
    let enColaOContingencia = 0;

    for (const v of validas) {
        const vSub = Number(v.subtotal);
        const vItbms = Number(v.itbms);
        const vTotal = Number(v.total);
        subtotal += vSub;
        itbms += vItbms;
        total += vTotal;

        const m = metodoMap.get(v.metodoPago) || { cantidad: 0, total: 0 };
        m.cantidad += 1;
        m.total += vTotal;
        metodoMap.set(v.metodoPago, m);

        if (v.cufe) conCufe += 1;
        if (v.estado === 'LOCAL' || v.estado === 'EN_COLA' || v.estado === 'RECHAZADA') {
            enColaOContingencia += 1;
        }

        for (const it of parseItems(v.items)) {
            const cant = Number(it.cantidad) || 0;
            const precio = Number(it.precioUnitario) || 0;
            const desc = Number(it.descuentoPorcentaje) || 0;
            const tasa = Number(it.itbmsPorcentaje) || 0;
            const baseNeta = cant * precio * (1 - desc / 100);
            const impuesto = baseNeta * (tasa / 100);
            const acc = tasaMap.get(tasa) || { base: 0, impuesto: 0 };
            acc.base += baseNeta;
            acc.impuesto += impuesto;
            tasaMap.set(tasa, acc);
        }
    }

    // Orden estable de métodos de pago conocidos, luego cualquier otro.
    const ordenMetodos = ['EFECTIVO', 'TARJETA', 'YAPPY', 'TRANSFERENCIA', 'MIXTO'];
    const porMetodoPago: ReporteZMetodoPago[] = Array.from(metodoMap.entries())
        .map(([metodo, d]) => ({ metodo, cantidad: d.cantidad, total: r2(d.total) }))
        .sort((a, b) => {
            const ia = ordenMetodos.indexOf(a.metodo);
            const ib = ordenMetodos.indexOf(b.metodo);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

    const itbmsPorTasa: ReporteZItbmsTasa[] = Array.from(tasaMap.entries())
        .map(([tasa, d]) => ({ tasa, base: r2(d.base), impuesto: r2(d.impuesto) }))
        .sort((a, b) => a.tasa - b.tasa);

    return {
        tipo,
        empresa: nombreEmpresa,
        generadoEn: new Date().toISOString(),
        rango: { desde: desde.toISOString(), hasta: hasta.toISOString() },
        turno: turnoInfo,
        documentos: {
            emitidos: validas.length,
            conCufe,
            enColaOContingencia,
            anulados: anuladas,
        },
        porMetodoPago,
        itbmsPorTasa,
        totales: { subtotal: r2(subtotal), itbms: r2(itbms), total: r2(total) },
    };
}

export interface TurnoReciente {
    id: string;
    cajero: string;
    estado: string;
    fechaApertura: string;
    fechaCierre: string | null;
}

/** Lista los turnos de caja más recientes de la empresa para elegir cuál Reporte Z ver. */
export async function listarTurnosRecientes(empresaId: string, limit = 20): Promise<TurnoReciente[]> {
    const turnos = await prisma.turnoCaja.findMany({
        where: { empresaId },
        orderBy: { fechaApertura: 'desc' },
        take: limit,
        include: { usuario: { select: { nombre: true } } },
    });
    return turnos.map((t) => ({
        id: t.id,
        cajero: t.usuario?.nombre || 'Cajero',
        estado: t.estado,
        fechaApertura: t.fechaApertura.toISOString(),
        fechaCierre: t.fechaCierre ? t.fechaCierre.toISOString() : null,
    }));
}
