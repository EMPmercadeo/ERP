import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { fechaPanama } from '@/lib/pos/fechaNegocio';

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
    let role: string;
    try {
      ({ empresaId, userId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para anular ventas.' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(role)) return NextResponse.json({ error: 'Solo el administrador puede anular ventas POS.' }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim().slice(0, 500) : '';

    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Sin esto, cualquier usuario autenticado de cualquier empresa podía anular (y hacer que se
    // reembolsara cuota de) una venta ajena con solo adivinar/conocer su ID.
    if (venta.empresaId !== empresaId) {
      return NextResponse.json({ error: 'No tienes permiso para anular esta venta.' }, { status: 403 });
    }
    const mesaPagada = await prisma.sesionMesa.findFirst({ where: { empresaId, ventaId: id }, select: { id: true } });
    if (mesaPagada) return NextResponse.json({ error: 'La venta de una mesa no se puede anular directamente; requiere un proceso controlado de devolución y nueva facturación.' }, { status: 409 });

    if (venta.estado === 'ANULADA') {
      return NextResponse.json({ error: 'Esta venta ya se encuentra anulada' }, { status: 400 });
    }
    const zCerrado = await prisma.cierreZDiario.findUnique({ where: { empresaId_fecha: { empresaId, fecha: fechaPanama(venta.createdAt) } }, select: { id: true } });
    if (zCerrado) return NextResponse.json({ error: 'Esta venta pertenece a una jornada con cierre Z registrado. Usa el proceso de corrección fiscal correspondiente.' }, { status: 409 });
    if (venta.cufe || venta.estado === 'AUTORIZADA') return NextResponse.json({ error: 'La venta autorizada requiere anulación fiscal o nota de crédito ante el PAC; esta ruta no ejecuta esa operación.' }, { status: 409 });

    const cambio = await prisma.venta.updateMany({
      where: { id, empresaId, estado: { not: 'ANULADA' } },
      data: { estado: 'ANULADA' },
    });
    if (!cambio.count) return NextResponse.json({ error: 'La venta ya fue anulada.' }, { status: 409 });
    const ventaAnulada = await prisma.venta.findUniqueOrThrow({ where: { id } });

    // Devolver inventario a bodega
    const items: VentaItemJson[] = Array.isArray(venta.items) ? (venta.items as VentaItemJson[]) : [];
    const productosElaborados = await prisma.producto.findMany({ where: { empresaId, id: { in: items.map(i => i.productoId).filter((id): id is string => !!id) }, esElaborado: true }, select: { id: true } });
    const elaborados = new Set(productosElaborados.map(p => p.id));
    const consumos = await prisma.movimientoInventario.findMany({ where: { empresaId, referenciaId: venta.id, concepto: 'consumo_receta', tipo: 'salida' }, select: { productoId: true, cantidad: true } });
    for (const consumo of consumos) {
      await prisma.producto.updateMany({ where: { id: consumo.productoId, empresaId }, data: { stockActual: { increment: Number(consumo.cantidad) } } });
    }
    for (const item of items) {
      if (item.productoId && item.cantidad && !elaborados.has(item.productoId)) {
        try {
          await prisma.producto.updateMany({
            where: { id: item.productoId, empresaId, unidadMedida: { not: 'SRV' } },
            data: { stockActual: { increment: item.cantidad } }
          });
        } catch {}
      }
    }

    // Auditoría tributaria y de caja
    await registrarLogAuditoria({
      adminId: userId,
      accion: 'ANULAR_VENTA_POS_LOCAL',
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
      message: 'Venta local anulada. El inventario se restituyó; no se reportó ningún evento al PAC.',
      venta: ventaAnulada
    });
  } catch (error) {
    console.error('Error POST /api/pos/ventas/[id]/anular:', error);
    return NextResponse.json({ error: 'Error al anular la venta' }, { status: 500 });
  }
}
