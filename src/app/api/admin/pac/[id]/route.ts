import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { encrypt as cifrar } from '@/lib/utils/crypto';
import { z } from 'zod';

const EditarPACSchema = z.object({
  proveedor: z.string().min(2).optional(),
  ambiente: z.enum(['TEST', 'PRODUCCION']).optional(),
  credenciales: z.string().optional(),
  esRespaldo: z.boolean().optional(),
  activo: z.boolean().optional(),
  makePrimary: z.boolean().optional() // 1 click toggle
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = EditarPACSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const pac = await prisma.configuracionPAC.findUnique({ where: { id } });
    if (!pac) {
      return NextResponse.json({ error: 'Configuración PAC no encontrada' }, { status: 404 });
    }

    const data: Prisma.ConfiguracionPACUpdateInput = {};
    if (validacion.data.proveedor !== undefined) data.proveedor = validacion.data.proveedor;
    if (validacion.data.ambiente !== undefined) data.ambiente = validacion.data.ambiente;
    if (validacion.data.credenciales) data.credenciales = cifrar(validacion.data.credenciales);
    if (validacion.data.esRespaldo !== undefined) data.esRespaldo = validacion.data.esRespaldo;
    if (validacion.data.activo !== undefined) data.activo = validacion.data.activo;

    // Toggle 1 clic para volver este PAC el primario (esRespaldo = false y los demás = true)
    if (validacion.data.makePrimary || validacion.data.esRespaldo === false) {
      data.esRespaldo = false;
      await prisma.configuracionPAC.updateMany({
        where: { id: { not: id } },
        data: { esRespaldo: true }
      });
    }

    const modificado = await prisma.configuracionPAC.update({
      where: { id },
      data
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'EDITAR_CONFIGURACION_PAC',
      objetivo: 'ConfiguracionPAC',
      objetivoId: id,
      detalles: { proveedor: modificado.proveedor, ambiente: modificado.ambiente, esRespaldo: modificado.esRespaldo }
    });

    return NextResponse.json({
      ...modificado,
      credenciales: '••••••••••••••••',
      hasCredentials: true
    });
  } catch (error) {
    console.error('Error PATCH /api/admin/pac/[id]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar PAC' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const adminId = auth.context.userId;

    const pac = await prisma.configuracionPAC.findUnique({ where: { id } });
    if (!pac) {
      return NextResponse.json({ error: 'Configuración PAC no encontrada' }, { status: 404 });
    }

    await prisma.configuracionPAC.delete({ where: { id } });

    await registrarLogAuditoria({
      adminId,
      accion: 'ELIMINAR_CONFIGURACION_PAC',
      objetivo: 'ConfiguracionPAC',
      objetivoId: id,
      detalles: { proveedor: pac.proveedor }
    });

    return NextResponse.json({ success: true, message: 'Proveedor PAC eliminado correctamente' });
  } catch (error) {
    console.error('Error DELETE /api/admin/pac/[id]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al eliminar PAC' }, { status: 500 });
  }
}
