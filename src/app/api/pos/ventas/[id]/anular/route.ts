import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';

interface VentaItemJson {
  productoId?: string;
  cantidad?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para anular ventas.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { motivo } = body;

    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Sin esto, cualquier usuario autenticado de cualquier empresa podía anular (y hacer que se
    // reembolsara cuota de) una venta ajena con solo adivinar/conocer su ID.
    if (venta.empresaId !== empresaId) {
      return NextResponse.json({ error: 'No tienes permiso para anular esta venta.' }, { status: 403 });
    }

    if (venta.estado === 'ANULADA') {
      return NextResponse.json({ error: 'Esta venta ya se encuentra anulada' }, { status: 400 });
    }

    // Si la venta ya había sido AUTORIZADA ante el PAC, se consumió 1 cuota del saldo de facturas.
    // Al anular, esa cuota debe reembolsarse al cliente; de lo contrario se le cobra por una factura anulada.
    const debeReembolsarCuota = venta.estado === 'AUTORIZADA' && !!venta.cuentaId;

    // Regla de POS: Nada de borrar ventas: una venta emitida se corrige con nota de crédito o evento de anulación DGI
    let ventaAnulada;
    if (debeReembolsarCuota && venta.cuentaId) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: venta.cuentaId } });
      if (!cuenta) {
        return NextResponse.json({ error: 'Cuenta fiscal asociada a la venta no encontrada' }, { status: 404 });
      }

      const saldoAnte = cuenta.saldoFacturas;
      const saldoPost = saldoAnte + 1;

      const [, , actualizada] = await prisma.$transaction([
        prisma.cuenta.update({
          where: { id: venta.cuentaId },
          data: { saldoFacturas: { increment: 1 } }
        }),
        prisma.movimientoCuota.create({
          data: {
            cuentaId: venta.cuentaId,
            tipo: 'REEMBOLSO',
            cantidad: 1,
            saldoAnte,
            saldoPost,
            nota: `Reembolso de cuota por anulación de venta POS - CUFE: ${venta.cufe || 'N/A'}`,
            referencia: `ANULACION-${venta.id}`
          }
        }),
        prisma.venta.update({
          where: { id },
          data: { estado: 'ANULADA' }
        })
      ]);
      ventaAnulada = actualizada;
    } else {
      ventaAnulada = await prisma.venta.update({
        where: { id },
        data: { estado: 'ANULADA' }
      });
    }

    // Devolver inventario a bodega
    const items: VentaItemJson[] = Array.isArray(venta.items) ? (venta.items as VentaItemJson[]) : [];
    for (const item of items) {
      if (item.productoId && item.cantidad) {
        try {
          await prisma.producto.updateMany({
            where: { id: item.productoId, unidadMedida: { not: 'SRV' } },
            data: { stockActual: { increment: item.cantidad } }
          });
        } catch {}
      }
    }

    // Auditoría tributaria y de caja
    await registrarLogAuditoria({
      adminId: userId,
      accion: 'ANULAR_VENTA_POS_NOTA_CREDITO',
      objetivo: 'Venta',
      objetivoId: venta.id,
      detalles: {
        cufe: venta.cufe || 'LOCAL_SIN_CUFE',
        total: venta.total,
        motivo: motivo || 'Anulación solicitada en caja por error de digitación o devolución',
        autorizadoPor: userId
      },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: 'Venta anulada correctamente. El inventario ha sido restituido y el evento reportado.',
      venta: ventaAnulada
    });
  } catch (error) {
    console.error('Error POST /api/pos/ventas/[id]/anular:', error);
    return NextResponse.json({ error: 'Error al anular la venta' }, { status: 500 });
  }
}
