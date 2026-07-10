import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { puedeAutorizarDescuentos } from '@/lib/permissions';
import { z } from 'zod';

const CategoriaUpdateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descuentoPorcentaje: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    if (role !== 'admin' && !puedeAutorizarDescuentos(role)) {
      return NextResponse.json({ error: 'No tienes permiso para editar categorías.' }, { status: 403 });
    }

    const { id } = await params;
    const existente = await prisma.categoria.findFirst({ where: { id, empresaId } });
    if (!existente) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CategoriaUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const categoria = await prisma.categoria.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({
      success: true,
      categoria: {
        id: categoria.id,
        nombre: categoria.nombre,
        descuentoPorcentaje: Number(categoria.descuentoPorcentaje),
        activo: categoria.activo
      }
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 });
    }
    console.error('Error PATCH /api/categories/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar la categoría' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    if (role !== 'admin' && !puedeAutorizarDescuentos(role)) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar categorías.' }, { status: 403 });
    }

    const { id } = await params;
    const existente = await prisma.categoria.findFirst({ where: { id, empresaId } });
    if (!existente) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    // Soft-delete (activo: false) en vez de borrar: los productos que ya la tienen
    // asignada conservan la referencia y su descuento deja de aplicarse (el filtro
    // GET solo trae categorías activas), sin romper la relación ni requerir migración.
    await prisma.categoria.update({ where: { id }, data: { activo: false } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE /api/categories/[id]:', error);
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 });
  }
}
