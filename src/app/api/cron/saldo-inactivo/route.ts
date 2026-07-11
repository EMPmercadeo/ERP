import { NextRequest, NextResponse } from 'next/server';
import { notificarCuentasSaldoInactivo, MESES_INACTIVIDAD_DEFECTO } from '@/lib/services/saldoInactivo';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

export const dynamic = 'force-dynamic';

/**
 * Cron de recordatorio de saldo de facturas inactivo.
 *
 * Pensado para Vercel Cron (que dispara con GET). Se protege con `CRON_SECRET`: Vercel
 * envía automáticamente `Authorization: Bearer ${CRON_SECRET}` cuando esa variable está
 * definida. Si CRON_SECRET no está configurado, el endpoint responde 503 (deshabilitado)
 * en vez de quedar abierto.
 *
 * Configuración en vercel.json:
 *   { "crons": [ { "path": "/api/cron/saldo-inactivo", "schedule": "0 13 * * 1" } ] }
 *   (lunes 13:00 UTC ≈ 8:00 a.m. Panamá)
 *
 * Nunca modifica el saldo: solo envía correos (cliente + resumen al superadmin).
 */
export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return NextResponse.json(
            { error: 'Cron deshabilitado: falta CRON_SECRET en las variables de entorno.' },
            { status: 503 }
        );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    try {
        const resultado = await notificarCuentasSaldoInactivo({ mesesInactividad: MESES_INACTIVIDAD_DEFECTO });

        await registrarLogAuditoria({
            adminId: 'system-cron',
            accion: 'NOTIFICAR_SALDO_INACTIVO',
            objetivo: 'Cuenta',
            detalles: {
                origen: 'vercel-cron',
                totalInactivas: resultado.totalInactivas,
                clientesNotificados: resultado.clientesNotificados,
                clientesOmitidosPorVentana: resultado.clientesOmitidosPorVentana,
            },
        });

        return NextResponse.json({ success: true, ...resultado });
    } catch (error) {
        console.error('Error GET /api/cron/saldo-inactivo:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error en el cron de saldo inactivo' },
            { status: 500 }
        );
    }
}
