import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/crypto';
import { validarHashIpnYappy } from '@/lib/pos/yappyClient';

export const dynamic = 'force-dynamic';

/**
 * Notificación instantánea de pago (IPN) de Yappy Comercial — endpoint GET abierto, tal como
 * lo exige la documentación oficial (no hay autenticación por header, la seguridad viene de
 * validar el hash HMAC-SHA256 con la clave secreta de la empresa dueña de la orden).
 *
 * Esto solo actualiza el estado de la YappyOrden (PENDIENTE -> EJECUTADO/RECHAZADO/CANCELADO/
 * EXPIRADO). La Venta/factura real se crea del lado del POS cuando este confirma el estado
 * EJECUTADO vía GET /api/pos/yappy/consultar — así se reutiliza el mismo flujo de emisión DGI
 * que ya usan EFECTIVO/TARJETA en vez de duplicar esa lógica aquí.
 *
 * IMPORTANTE: no se pudo probar contra una notificación real de Yappy (sin credenciales). El
 * mapeo de status ('E'/'R'/'C'/'X') y el algoritmo de hash están copiados literalmente de la
 * documentación oficial.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const hash = searchParams.get('hash');
    const domain = searchParams.get('domain');

    if (!orderId || !status || !hash || !domain) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros en la notificación.' }, { status: 400 });
    }

    const orden = await prisma.yappyOrden.findUnique({ where: { id: orderId } });
    if (!orden) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada.' }, { status: 404 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: orden.empresaId } });
    if (!empresa?.yappySecretKey) {
      return NextResponse.json({ success: false, error: 'La empresa dueña de la orden ya no tiene Yappy configurado.' }, { status: 400 });
    }

    const hashValido = validarHashIpnYappy({
      orderId,
      status,
      domain,
      hash,
      secretKeyBase64: decrypt(empresa.yappySecretKey)
    });

    if (!hashValido) {
      console.error('Yappy IPN: hash inválido para orden', orderId);
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const estadoMap: Record<string, string> = {
      E: 'EJECUTADO',
      R: 'RECHAZADO',
      C: 'CANCELADO',
      X: 'EXPIRADO'
    };
    const nuevoEstado = estadoMap[status] || 'RECHAZADO';

    await prisma.yappyOrden.update({
      where: { id: orderId },
      data: {
        estado: nuevoEstado,
        confirmadoAt: nuevoEstado === 'EJECUTADO' ? new Date() : orden.confirmadoAt
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error GET /api/v1/providers/webhooks/yappy:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
