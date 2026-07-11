import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

/**
 * Turno de caja activo (abierto) del cajero de la sesión actual, scopeado a empresaId +
 * usuarioId (nunca a un empresaId/usuarioId que mande el cliente). Si hay un turno abierto,
 * incluye un resumen en vivo de lo esperado en caja (monto inicial + ventas en efectivo del
 * turno) para que la UI lo muestre antes del cierre — el cálculo autoritativo real se repite
 * de todos modos en el servidor al momento de cerrar (POST /api/pos/turno/cerrar).
 */
export async function GET() {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver el turno de caja.' }, { status: 401 });
    }

    const turno = await prisma.turnoCaja.findFirst({
      where: { empresaId, usuarioId: userId, estado: 'abierto' },
      orderBy: { fechaApertura: 'desc' }
    });

    if (!turno) {
      return NextResponse.json({ turno: null });
    }

    const ventasEfectivo = await prisma.venta.aggregate({
      where: {
        turnoCajaId: turno.id,
        metodoPago: 'EFECTIVO',
        estado: { not: 'ANULADA' }
      },
      _sum: { total: true }
    });

    const totalEfectivoVentas = Number(ventasEfectivo._sum.total || 0);
    const montoEsperado = Number(turno.montoInicial) + totalEfectivoVentas;

    return NextResponse.json({
      turno: {
        id: turno.id,
        fechaApertura: turno.fechaApertura,
        montoInicial: Number(turno.montoInicial),
        observaciones: turno.observaciones,
        estado: turno.estado
      },
      resumen: {
        totalEfectivoVentas,
        montoEsperado
      }
    });
  } catch (error) {
    console.error('Error GET /api/pos/turno:', error);
    return NextResponse.json({ error: 'Error al consultar el turno de caja' }, { status: 500 });
  }
}
