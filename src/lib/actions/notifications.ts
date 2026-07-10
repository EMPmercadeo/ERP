'use server';

import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export type NotificacionSeveridad = 'info' | 'warning' | 'critical';

export interface Notificacion {
    id: string;
    tipo: 'facturas_vencidas' | 'facturas_dgi_error' | 'stock_bajo' | 'plan_limite';
    titulo: string;
    mensaje: string;
    href: string;
    severidad: NotificacionSeveridad;
    count: number;
}

// Notificaciones calculadas al vuelo a partir de datos existentes (sin tabla nueva
// de notificaciones ni migración): facturas vencidas por cobrar, facturas rechazadas
// por la DGI, stock bajo/agotado, y consumo del plan mensual cerca del límite.
export async function getNotificaciones(): Promise<Notificacion[]> {
    const { empresaId } = await getTenantContext();
    const ahora = new Date();

    const [facturasVencidas, facturasError, productosStockBajo, usoDelMes] = await Promise.all([
        prisma.factura.count({
            where: {
                empresaId,
                saldoPendiente: { gt: 0 },
                fechaVencimiento: { lt: ahora },
                estadoDgi: { notIn: ['anulada', 'canceled'] },
            },
        }),
        prisma.factura.count({
            where: {
                empresaId,
                estadoDgi: 'rechazada',
            },
        }),
        // Prisma no soporta comparar dos columnas entre sí directamente en un `where`,
        // así que se traen los dos campos y se filtra en JS.
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { stockActual: true, stockMinimo: true },
        }).then((rows) => rows.filter((p) => p.stockActual <= p.stockMinimo).length),
        prisma.documentUsage.findFirst({
            where: {
                empresaId,
                month: ahora.getMonth() + 1,
                year: ahora.getFullYear(),
            },
        }),
    ]);

    const notificaciones: Notificacion[] = [];

    if (facturasVencidas > 0) {
        notificaciones.push({
            id: 'facturas_vencidas',
            tipo: 'facturas_vencidas',
            titulo: 'Facturas vencidas por cobrar',
            mensaje: `Tienes ${facturasVencidas} factura${facturasVencidas === 1 ? '' : 's'} vencida${facturasVencidas === 1 ? '' : 's'} sin cobrar.`,
            href: '/receivables',
            severidad: 'warning',
            count: facturasVencidas,
        });
    }

    if (facturasError > 0) {
        notificaciones.push({
            id: 'facturas_dgi_error',
            tipo: 'facturas_dgi_error',
            titulo: 'Facturas rechazadas por la DGI',
            mensaje: `${facturasError} factura${facturasError === 1 ? '' : 's'} con error fiscal que necesita${facturasError === 1 ? '' : 'n'} corregirse o reintentarse.`,
            href: '/invoices',
            severidad: 'critical',
            count: facturasError,
        });
    }

    if (productosStockBajo > 0) {
        notificaciones.push({
            id: 'stock_bajo',
            tipo: 'stock_bajo',
            titulo: 'Stock bajo o agotado',
            mensaje: `${productosStockBajo} producto${productosStockBajo === 1 ? '' : 's'} por debajo de su punto de reorden.`,
            href: '/products',
            severidad: 'warning',
            count: productosStockBajo,
        });
    }

    if (usoDelMes && usoDelMes.includedLimit > 0) {
        const usados = usoDelMes.usedDocuments;
        const limite = usoDelMes.includedLimit + usoDelMes.extraDocumentsPurchased;
        const porcentaje = usados / limite;
        if (porcentaje >= 0.8) {
            notificaciones.push({
                id: 'plan_limite',
                tipo: 'plan_limite',
                titulo: 'Límite del plan casi alcanzado',
                mensaje: `Has usado ${usados} de ${limite} documentos incluidos este mes (${Math.round(porcentaje * 100)}%).`,
                href: '/settings',
                severidad: porcentaje >= 1 ? 'critical' : 'warning',
                count: usados,
            });
        }
    }

    return notificaciones;
}
