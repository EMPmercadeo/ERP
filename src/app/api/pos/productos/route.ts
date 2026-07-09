import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

/**
 * Catálogo de productos para el POS, scopeado a la empresa de la sesión actual
 * (getTenantContext(), nunca un empresaId que mande el cliente). Antes el POS llamaba
 * a /api/inventario/productos, una ruta que nunca existió en este repo — por eso
 * siempre caía al catálogo de demostración hardcodeado en vez de mostrar el inventario
 * real que se administra en /productos.
 */
export async function GET(request: NextRequest) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver el catálogo del POS.' }, { status: 401 });
    }

    const productos = await prisma.producto.findMany({
      where: { empresaId, activo: true },
      orderBy: { descripcion: 'asc' },
      take: 200
    });

    return NextResponse.json({
      items: productos.map((p) => ({
        id: p.id,
        codigoInterno: p.codigoInterno,
        codigoBarras: p.codigoBarras,
        descripcion: p.descripcion,
        precioVenta: Number(p.precioVenta),
        codigoTasaItbms: p.codigoTasaItbms,
        stockActual: p.stockActual
      }))
    });
  } catch (error: any) {
    console.error('Error GET /api/pos/productos:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener el catálogo del POS' }, { status: 500 });
  }
}
