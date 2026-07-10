import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const PlantillaSchema = z.object({
  clave: z.string().min(2, 'La clave es obligatoria (Ej. BIENVENIDA)'),
  asunto: z.string().min(2, 'El asunto es obligatorio'),
  cuerpo: z.string().min(5, 'El cuerpo HTML es obligatorio'),
  activa: z.boolean().default(true)
});

export async function GET(_request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const plantillas = await prisma.plantillaCorreo.findMany({
      orderBy: { clave: 'asc' }
    });
    return NextResponse.json(plantillas);
  } catch (error) {
    console.error('Error GET /api/admin/correos/plantillas:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener plantillas de correo' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = PlantillaSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { clave, asunto, cuerpo, activa } = validacion.data;

    const existe = await prisma.plantillaCorreo.findUnique({ where: { clave } });
    if (existe) {
      return NextResponse.json({ error: 'Ya existe una plantilla con esa clave' }, { status: 409 });
    }

    const nuevaPlantilla = await prisma.plantillaCorreo.create({
      data: { clave, asunto, cuerpo, activa }
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'CREAR_PLANTILLA_CORREO',
      objetivo: 'PlantillaCorreo',
      objetivoId: nuevaPlantilla.id,
      detalles: { clave, asunto }
    });

    return NextResponse.json(nuevaPlantilla, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/correos/plantillas:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear plantilla de correo' }, { status: 500 });
  }
}