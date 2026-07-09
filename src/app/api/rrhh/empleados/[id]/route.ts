import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { z } from 'zod';

// Estos tres handlers no tenían NINGUNA autenticación: exponían nombre, cédula y salario de
// cualquier colaborador de cualquier empresa a quien conociera/adivinara el id, y permitían
// editar salario/cargo o dar de baja a un colaborador ajeno sin sesión. Ahora todos verifican
// getTenantContext() y que el empleado pertenezca a esa empresa.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver esta ficha.' }, { status: 401 });
    }

    const { id } = await params;
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        ausencias: {
          orderBy: { desde: 'desc' },
          take: 50
        },
        movVacaciones: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        actas: {
          orderBy: { fechaHecho: 'desc' },
          take: 50
        }
      }
    });

    if (!empleado || empleado.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    // Calcular saldo de vacaciones sumando los movimientos en ledger
    const saldoVacaciones = empleado.movVacaciones.reduce((acc, mov) => {
      return acc + Number(mov.dias);
    }, 0);

    return NextResponse.json({
      empleado,
      saldoVacaciones: Number(saldoVacaciones.toFixed(2))
    });
  } catch (error: any) {
    console.error('Error GET /api/rrhh/empleados/[id]:', error);
    return NextResponse.json({ error: 'Error al obtener ficha de colaborador' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para editar esta ficha.' }, { status: 401 });
    }

    const { id } = await params;
    const existente = await prisma.empleado.findUnique({ where: { id } });
    if (!existente || existente.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    const body = await request.json();

    const empleado = await prisma.empleado.update({
      where: { id },
      data: {
        nombre: body.nombre,
        cargo: body.cargo,
        salarioBase: body.salarioBase ? Number(body.salarioBase) : undefined,
        tipoContrato: body.tipoContrato,
        activo: body.activo !== undefined ? body.activo : undefined
      }
    });

    await registrarLogAuditoria({
      adminId: userId,
      accion: 'EDITAR_EMPLEADO',
      objetivo: 'Empleado',
      objetivoId: empleado.id,
      detalles: body,
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, empleado });
  } catch (error: any) {
    console.error('Error PATCH /api/rrhh/empleados/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar colaborador' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para dar de baja a este colaborador.' }, { status: 401 });
    }

    const { id } = await params;
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado || empleado.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    // Soft delete obligatorio: marcar fechaSalida y activo=false (nunca borrado físico)
    const actualizado = await prisma.empleado.update({
      where: { id },
      data: {
        activo: false,
        fechaSalida: new Date()
      }
    });

    await registrarLogAuditoria({
      adminId: userId,
      accion: 'BAJA_EMPLEADO_SOFT_DELETE',
      objetivo: 'Empleado',
      objetivoId: empleado.id,
      detalles: { motivo: 'Baja o renuncia del colaborador (retención legal DGI/Trabajo aplicada)' },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, message: 'Colaborador dado de baja (soft-delete aplicado)', empleado: actualizado });
  } catch (error: any) {
    console.error('Error DELETE /api/rrhh/empleados/[id]:', error);
    return NextResponse.json({ error: 'Error al dar de baja al colaborador' }, { status: 500 });
  }
}
