import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { z } from 'zod';

const EditarUsuarioSchema = z.object({
  nombre: z.string().min(2).optional(),
  empresa: z.string().min(2).optional(),
  ruc: z.string().min(3).optional(),
  correo: z.string().email().optional(),
  telefono: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
  estado: z.enum(['ACTIVA', 'SUSPENDIDA', 'BLOQUEADA']).optional()
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      include: {
        plan: true,
        pagos: { take: 10, orderBy: { createdAt: 'desc' } },
        facturas: { take: 10, orderBy: { createdAt: 'desc' } },
        tickets: { take: 10, orderBy: { createdAt: 'desc' } },
        movimientosCuota: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: {
          select: { pagos: true, facturas: true, tickets: true, movimientosCuota: true }
        }
      }
    });

    if (!cuenta) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(cuenta);
  } catch (error: any) {
    console.error('Error GET /api/admin/usuarios/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validacion = EditarUsuarioSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const anterior = await prisma.cuenta.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    const modificada = await prisma.cuenta.update({
      where: { id },
      data: validacion.data,
      include: { plan: true }
    });

    await registrarLogAuditoria({
      adminId: request.headers.get('x-admin-id') || 'SUPERADMIN',
      accion: 'EDITAR_CUENTA',
      objetivo: 'Cuenta',
      objetivoId: id,
      detalles: { anterior, nueva: modificada }
    });

    return NextResponse.json(modificada);
  } catch (error: any) {
    console.error('Error PATCH /api/admin/usuarios/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error interno al actualizar cuenta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const anterior = await prisma.cuenta.findUnique({ where: { id } });

    if (!anterior) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // Soft-delete según regla legal de retención DGI / Ley 81
    const softDeleted = await prisma.cuenta.update({
      where: { id },
      data: {
        eliminadoEn: new Date(),
        estado: 'BLOQUEADA'
      }
    });

    await registrarLogAuditoria({
      adminId: request.headers.get('x-admin-id') || 'SUPERADMIN',
      accion: 'ELIMINAR_CUENTA_SOFT',
      objetivo: 'Cuenta',
      objetivoId: id,
      detalles: { razonSocial: anterior.empresa, ruc: anterior.ruc, fechaEliminacion: softDeleted.eliminadoEn }
    });

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada mediante soft-delete. Los registros fiscales se conservan por retención legal.',
      cuenta: softDeleted
    });
  } catch (error: any) {
    console.error('Error DELETE /api/admin/usuarios/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar cuenta' }, { status: 500 });
  }
}
