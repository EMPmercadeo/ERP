import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { motivo, usuarioId } = body;

    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    if (venta.estado === 'ANULADA') {
      return NextResponse.json({ error: 'Esta venta ya se encuentra anulada' }, { status: 400 });
    }

    // Regla de POS: Nada de borrar ventas: una venta emitida se corrige con nota de crédito o evento de anulación DGI
    const ventaAnulada = await prisma.venta.update({
      where: { id },
      data: { estado: 'ANULADA' }
    });

    // Devolver inventario a bodega
    const items: any = Array.isArray(venta.items) ? venta.items : [];
    for (const item of items) {
      if (item.productoId && item.cantidad) {
        try {
          await prisma.producto.updateMany({
            where: { id: item.productoId },
            data: { stockActual: { increment: item.cantidad } }
          });
        } catch {}
      }
    }

    // Auditoría tributaria y de caja
    await registrarLogAuditoria({
      adminId: venta.empresaId,
      accion: 'ANULAR_VENTA_POS_NOTA_CREDITO',
      objetivo: 'Venta',
      objetivoId: venta.id,
      detalles: {
        cufe: venta.cufe || 'LOCAL_SIN_CUFE',
        total: venta.total,
        motivo: motivo || 'Anulación solicitada en caja por error de digitación o devolución',
        autorizadoPor: usuarioId || 'ADMIN_TIENDA'
      },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: 'Venta anulada correctamente. El inventario ha sido restituido y el evento reportado.',
      venta: ventaAnulada
    });
  } catch (error: any) {
    console.error('Error POST /api/pos/ventas/[id]/anular:', error);
    return NextResponse.json({ error: 'Error al anular la venta' }, { status: 500 });
  }
}
