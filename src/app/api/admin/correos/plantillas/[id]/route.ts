import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { z } from 'zod';

const EditarPlantillaSchema = z.object({
  asunto: z.string().min(2).optional(),
  cuerpo: z.string().min(5).optional(),
  activa: z.boolean().optional()
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plantilla = await prisma.plantillaCorreo.findUnique({ where: { id } });
    if (!plantilla) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    return NextResponse.json(plantilla);
  } catch (error: any) {
    console.error('Error GET /api/admin/correos/plantillas/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener plantilla' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminId = request.headers.get('x-admin-id') || 'SUPERADMIN';
    const body = await request.json();
    const validacion = EditarPlantillaSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const anterior = await prisma.plantillaCorreo.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    const modificado = await prisma.plantillaCorreo.update({
      where: { id },
      data: validacion.data
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'EDITAR_PLANTILLA_CORREO',
      objetivo: 'PlantillaCorreo',
      objetivoId: id,
      detalles: { anterior, nuevo: modificado }
    });

    return NextResponse.json(modificado);
  } catch (error: any) {
    console.error('Error PATCH /api/admin/correos/plantillas/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar plantilla de correo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminId = request.headers.get('x-admin-id') || 'SUPERADMIN';

    const anterior = await prisma.plantillaCorreo.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    await prisma.plantillaCorreo.delete({ where: { id } });

    await registrarLogAuditoria({
      adminId,
      accion: 'ELIMINAR_PLANTILLA_CORREO',
      objetivo: 'PlantillaCorreo',
      objetivoId: id,
      detalles: { clave: anterior.clave, asunto: anterior.asunto }
    });

    return NextResponse.json({ success: true, message: 'Plantilla de correo eliminada con éxito' });
  } catch (error: any) {
    console.error('Error DELETE /api/admin/correos/plantillas/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar plantilla' }, { status: 500 });
  }
}
