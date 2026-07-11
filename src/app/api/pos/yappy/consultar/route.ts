import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

/**
 * El POS hace polling corto a este endpoint (cada 2-3s) mientras espera que el cliente
 * confirme el pago en su app de Yappy, hasta ver `estado: 'EJECUTADO'` (o que se cumplan los
 * 5 minutos de vigencia del pedido y pase a RECHAZADO/EXPIRADO). Scopeado a la empresa de la
 * sesión: nunca se puede consultar una orden de otra empresa por más que se adivine el id.
 */
export async function GET(request: NextRequest) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Falta orderId.' }, { status: 400 });
    }

    const orden = await prisma.yappyOrden.findFirst({ where: { id: orderId, empresaId } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ estado: orden.estado });
  } catch (error) {
    console.error('Error GET /api/pos/yappy/consultar:', error);
    return NextResponse.json({ error: 'Error al consultar el estado de la orden Yappy' }, { status: 500 });
  }
}
