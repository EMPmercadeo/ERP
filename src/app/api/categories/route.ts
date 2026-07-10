import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { puedeAutorizarDescuentos } from '@/lib/permissions';
import { z } from 'zod';

const CategoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la categoría es requerido').max(100),
  descuentoPorcentaje: z.number().min(0).max(100).optional().default(0)
});

export async function GET() {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    const categorias = await prisma.categoria.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json({
      items: categorias.map(c => ({
        id: c.id,
        nombre: c.nombre,
        descuentoPorcentaje: Number(c.descuentoPorcentaje)
      }))
    });
  } catch (error) {
    console.error('Error GET /api/categories:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    // Definir la política de descuento por categoría es una decisión del dueño/gerente,
    // no de cualquier vendedor que use el formulario de Productos.
    if (role !== 'admin' && !puedeAutorizarDescuentos(role)) {
      return NextResponse.json({ error: 'No tienes permiso para crear categorías.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CategoriaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const categoria = await prisma.categoria.create({
      data: {
        empresaId,
        nombre: parsed.data.nombre,
        descuentoPorcentaje: parsed.data.descuentoPorcentaje
      }
    });

    return NextResponse.json({
      success: true,
      categoria: {
        id: categoria.id,
        nombre: categoria.nombre,
        descuentoPorcentaje: Number(categoria.descuentoPorcentaje)
      }
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 });
    }
    console.error('Error POST /api/categories:', error);
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
