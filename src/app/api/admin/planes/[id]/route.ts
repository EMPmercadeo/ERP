import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const EditarPlanSchema = z.object({
  nombre: z.string().min(2).optional(),
  precio: z.number().min(0).optional(),
  facturasIncluidas: z.number().int().min(0).optional(),
  maxUsers: z.number().int().min(1).optional(),
  activo: z.boolean().optional(),
  featuresJson: z.any().optional()
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { cuentas: true, subscriptions: true } }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const suscriptores = await paginar(prisma.cuenta, {
      cursor,
      take,
      where: { planId: id, eliminadoEn: null },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      plan,
      suscriptores
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/planes/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener detalle del plan' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const validacion = EditarPlanSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const anterior = await prisma.plan.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const data: any = {};
    if (validacion.data.nombre !== undefined) {
      data.nombre = validacion.data.nombre;
      data.name = validacion.data.nombre;
    }
    if (validacion.data.precio !== undefined) {
      data.precio = validacion.data.precio;
      data.priceMonthly = validacion.data.precio;
    }
    if (validacion.data.facturasIncluidas !== undefined) {
      data.facturasIncluidas = validacion.data.facturasIncluidas;
      data.includedDocuments = validacion.data.facturasIncluidas;
    }
    if (validacion.data.maxUsers !== undefined) {
      data.maxUsers = validacion.data.maxUsers;
    }
    if (validacion.data.activo !== undefined) {
      data.activo = validacion.data.activo;
      data.isActive = validacion.data.activo;
    }
    if (validacion.data.featuresJson !== undefined) {
      data.featuresJson = validacion.data.featuresJson;
    }

    const modificado = await prisma.plan.update({
      where: { id },
      data
    });

    await registrarLogAuditoria({
      adminId: auth.context.userId,
      accion: 'EDITAR_PLAN',
      objetivo: 'Plan',
      objetivoId: id,
      detalles: { anterior, nuevo: modificado }
    });

    return NextResponse.json(modificado);
  } catch (error: any) {
    console.error('Error PATCH /api/admin/planes/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    if (plan._count.cuentas > 0) {
      // Si tiene suscriptores, no se borra físicamente sino que se desactiva
      const desactivado = await prisma.plan.update({
        where: { id },
        data: { isActive: false, activo: false }
      });

      await registrarLogAuditoria({
        adminId: auth.context.userId,
        accion: 'DESACTIVAR_PLAN_CON_SUSCRIPTORES',
        objetivo: 'Plan',
        objetivoId: id,
        detalles: { suscriptoresActivos: plan._count.cuentas }
      });

      return NextResponse.json({
        success: true,
        message: 'El plan tiene cuentas suscritas, por lo que ha sido desactivado en lugar de eliminado físicamente.',
        plan: desactivado
      });
    }

    await prisma.plan.delete({ where: { id } });

    await registrarLogAuditoria({
      adminId: auth.context.userId,
      accion: 'ELIMINAR_PLAN',
      objetivo: 'Plan',
      objetivoId: id,
      detalles: { nombre: plan.nombre || plan.name }
    });

    return NextResponse.json({ success: true, message: 'Plan eliminado correctamente' });
  } catch (error: any) {
    console.error('Error DELETE /api/admin/planes/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar plan' }, { status: 500 });
  }
}
