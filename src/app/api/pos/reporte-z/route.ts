import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth/context';
import { generarReporteZ } from '@/lib/services/reporteZ';
import { prisma } from '@/lib/db';
import { fechaPanama } from '@/lib/pos/fechaNegocio';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pos/reporte-z?turnoId=...   -> Reporte Z de un turno de caja
 * GET /api/pos/reporte-z?fecha=YYYY-MM-DD -> Cierre diario de la empresa
 * GET /api/pos/reporte-z                -> Cierre diario de hoy
 *
 * Siempre acotado por la empresa de la sesión (multi-tenant).
 */
export async function GET(request: NextRequest) {
    let empresaId: string;
    let role: string;
    try {
        ({ empresaId, role } = await getTenantContext());
    } catch {
        return NextResponse.json({ error: 'Debes iniciar sesión para ver el Reporte Z.' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(role)) return NextResponse.json({ error: 'Solo el administrador puede ver el cierre Z.' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const turnoId = searchParams.get('turnoId');
        const fecha = searchParams.get('fecha');
        if (!turnoId) {
            const cierre = await prisma.cierreZDiario.findUnique({ where: { empresaId_fecha: { empresaId, fecha: fecha || fechaPanama() } }, select: { resumen: true } });
            if (cierre) return NextResponse.json(cierre.resumen);
        }

        const reporte = await generarReporteZ({ empresaId, turnoId, fecha });
        if (!reporte) {
            return NextResponse.json({ error: 'No se encontró el turno indicado o la fecha es inválida.' }, { status: 404 });
        }

        return NextResponse.json(reporte);
    } catch (error) {
        console.error('Error GET /api/pos/reporte-z:', error);
        return NextResponse.json({ error: 'Error al generar el Reporte Z.' }, { status: 500 });
    }
}
