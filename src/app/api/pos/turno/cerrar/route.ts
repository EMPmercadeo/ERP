import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { TurnoCajaCierreSchema } from '@/lib/validations';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

/**
 * Cierra el turno de caja abierto del cajero actual. El monto esperado NUNCA se confía del
 * cliente: se recalcula aquí a partir de las ventas reales en efectivo (no anuladas) que
 * quedaron ligadas a este turno (Venta.turnoCajaId), más el monto inicial declarado al abrir.
 * La diferencia (contado - esperado) queda registrada para el arqueo de caja.
 */
export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para cerrar un turno de caja.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = TurnoCajaCierreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const turno = await prisma.turnoCaja.findFirst({
      where: { empresaId, usuarioId: userId, estado: 'abierto' }
    });
    if (!turno) {
      return NextResponse.json({ error: 'No tienes ningún turno de caja abierto para cerrar.' }, { status: 404 });
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
    const montoEsperadoCierre = Number(turno.montoInicial) + totalEfectivoVentas;
    const diferencia = Number((parsed.data.montoContadoCierre - montoEsperadoCierre).toFixed(2));

    const turnoCerrado = await prisma.turnoCaja.update({
      where: { id: turno.id },
      data: {
        fechaCierre: new Date(),
        montoContadoCierre: parsed.data.montoContadoCierre,
        montoEsperadoCierre,
        diferencia,
        estado: 'cerrado',
        observaciones: parsed.data.observaciones
          ? [turno.observaciones, parsed.data.observaciones].filter(Boolean).join(' | ')
          : turno.observaciones
      }
    });

    await registrarLogAuditoria({
      adminId: userId,
      accion: 'CERRAR_TURNO_CAJA_POS',
      objetivo: 'TurnoCaja',
      objetivoId: turno.id,
      detalles: {
        montoInicial: Number(turno.montoInicial),
        totalEfectivoVentas,
        montoEsperadoCierre,
        montoContadoCierre: parsed.data.montoContadoCierre,
        diferencia
      },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      turno: {
        id: turnoCerrado.id,
        fechaApertura: turnoCerrado.fechaApertura,
        fechaCierre: turnoCerrado.fechaCierre,
        montoInicial: Number(turnoCerrado.montoInicial),
        montoEsperadoCierre: Number(turnoCerrado.montoEsperadoCierre),
        montoContadoCierre: Number(turnoCerrado.montoContadoCierre),
        diferencia: Number(turnoCerrado.diferencia)
      }
    });
  } catch (error) {
    console.error('Error POST /api/pos/turno/cerrar:', error);
    return NextResponse.json({ error: 'Error al cerrar el turno de caja' }, { status: 500 });
  }
}
