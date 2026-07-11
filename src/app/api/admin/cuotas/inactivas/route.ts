import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import {
    getCuentasSaldoInactivo,
    notificarCuentasSaldoInactivo,
    MESES_INACTIVIDAD_DEFECTO,
} from '@/lib/services/saldoInactivo';

export const dynamic = 'force-dynamic';

function parseMeses(value: string | null): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 24) return MESES_INACTIVIDAD_DEFECTO;
    return Math.floor(n);
}

/**
 * GET /api/admin/cuotas/inactivas?meses=3
 * Lista las cuentas con saldo de facturas sin usar por N meses. Solo superadmin.
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdminApi();
    if ('error' in auth) return auth.error;
    try {
        const { searchParams } = new URL(request.url);
        const meses = parseMeses(searchParams.get('meses'));
        const cuentas = await getCuentasSaldoInactivo(meses);
        return NextResponse.json({ meses, total: cuentas.length, cuentas });
    } catch (error) {
        console.error('Error GET /api/admin/cuotas/inactivas:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al listar cuentas con saldo inactivo' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/cuotas/inactivas  { meses?: number, forzarReenvio?: boolean }
 * Detecta y notifica (correo al cliente + resumen al superadmin). Nunca toca el saldo.
 *
 * Autorización: superadmin autenticado, O una llamada de cron con
 * `Authorization: Bearer ${CRON_SECRET}` (para automatizarlo con Vercel Cron sin dejar
 * el endpoint abierto). Si no hay CRON_SECRET configurado, solo se permite superadmin.
 */
export async function POST(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const esCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    let adminId: string | null = null;
    if (!esCron) {
        const auth = await requireSuperAdminApi();
        if ('error' in auth) return auth.error;
        adminId = auth.context.userId;
    }

    try {
        const body = await request.json().catch(() => ({}));
        const meses = typeof body.meses === 'number' ? parseMeses(String(body.meses)) : MESES_INACTIVIDAD_DEFECTO;
        const forzarReenvio = body.forzarReenvio === true;

        const resultado = await notificarCuentasSaldoInactivo({ mesesInactividad: meses, forzarReenvio });

        await registrarLogAuditoria({
            adminId: adminId || 'system-cron',
            accion: 'NOTIFICAR_SALDO_INACTIVO',
            objetivo: 'Cuenta',
            detalles: {
                meses,
                forzarReenvio,
                origen: esCron ? 'cron' : 'manual',
                totalInactivas: resultado.totalInactivas,
                clientesNotificados: resultado.clientesNotificados,
                clientesOmitidosPorVentana: resultado.clientesOmitidosPorVentana,
            },
        });

        return NextResponse.json({ success: true, ...resultado });
    } catch (error) {
        console.error('Error POST /api/admin/cuotas/inactivas:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al notificar cuentas con saldo inactivo' },
            { status: 500 }
        );
    }
}
