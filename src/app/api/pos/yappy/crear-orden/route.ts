import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { decrypt } from '@/lib/utils/crypto';
import { validarComercioYappy, crearOrdenYappy, generarOrderIdYappy } from '@/lib/pos/yappyClient';
import { z } from 'zod';

const CrearOrdenSchema = z.object({
  subtotal: z.number().nonnegative(),
  itbms: z.number().nonnegative(),
  total: z.number().positive()
});

/**
 * Crea una orden de cobro real contra el Botón de Pago Yappy V2 para la empresa de la sesión
 * actual. Requiere turno de caja abierto (misma regla que /api/pos/ventas) y que la empresa
 * tenga Yappy habilitado + configurado. La venta en sí (Venta/factura) se crea después, cuando
 * la notificación IPN confirme el pago (ver /api/v1/providers/webhooks/yappy).
 */
export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para cobrar con Yappy.' }, { status: 401 });
    }

    const turnoActivo = await prisma.turnoCaja.findFirst({
      where: { empresaId, usuarioId: userId, estado: 'abierto' }
    });
    if (!turnoActivo) {
      return NextResponse.json({ error: 'No tienes un turno de caja abierto.', requiereTurno: true }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = CrearOrdenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (
      process.env.YAPPY_INTEGRATION_ENABLED !== 'true' ||
      !empresa?.yappyEnabled ||
      !empresa.yappyMerchantId ||
      !empresa.yappySecretKey ||
      !empresa.yappyDomain
    ) {
      return NextResponse.json({ error: 'Yappy no está configurado/habilitado para tu empresa.' }, { status: 400 });
    }

    const cred = {
      merchantId: empresa.yappyMerchantId,
      secretKey: decrypt(empresa.yappySecretKey),
      domain: empresa.yappyDomain,
      ambiente: (empresa.yappyAmbiente === 'produccion' ? 'produccion' : 'pruebas') as 'produccion' | 'pruebas'
    };

    const orderId = generarOrderIdYappy();
    const ipnUrl = `${request.nextUrl.origin}/api/v1/providers/webhooks/yappy`;

    const { token } = await validarComercioYappy(cred);
    const orden = await crearOrdenYappy(cred, token, {
      orderId,
      ipnUrl,
      subtotal: parsed.data.subtotal,
      itbms: parsed.data.itbms,
      total: parsed.data.total
    });

    await prisma.yappyOrden.create({
      data: {
        id: orderId,
        empresaId,
        monto: parsed.data.total,
        estado: 'PENDIENTE',
        transactionId: orden.transactionId
      }
    });

    return NextResponse.json({
      success: true,
      orderId,
      transactionId: orden.transactionId,
      token: orden.token,
      documentName: orden.documentName
    });
  } catch (error) {
    console.error('Error POST /api/pos/yappy/crear-orden:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear la orden de cobro con Yappy' }, { status: 500 });
  }
}
