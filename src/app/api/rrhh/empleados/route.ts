import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { puedeVerRuta } from '@/lib/permissions';
import { z } from 'zod';

// empresaId ya no se acepta del cliente: sin autenticación ni scoping alguno, este endpoint
// exponía (GET) y permitía crear (POST) colaboradores de cualquier empresa con solo pasar
// el empresaId en el query/body — ahora se deriva siempre de getTenantContext().
const EmpleadoSchema = z.object({
  cuentaId: z.string().optional(),
  nombre: z.string().min(2, 'Nombre requerido'),
  cedula: z.string().min(4, 'Cédula requerida'),
  cargo: z.string().min(2, 'Cargo requerido'),
  salarioBase: z.number().positive('Salario debe ser mayor a 0'),
  tipoContrato: z.enum(['INDEFINIDO', 'DEFINIDO', 'OBRA']),
  fechaIngreso: z.string().or(z.date())
});

export async function GET(request: NextRequest) {
  try {
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver los colaboradores.' }, { status: 401 });
    }
    if (!puedeVerRuta(role, '/rrhh/empleados')) {
      return NextResponse.json({ error: 'Tu rol no tiene acceso al módulo de RRHH.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado'); // 'activo' | 'inactivo' | 'all'
    const cargo = searchParams.get('cargo');
    const buscar = searchParams.get('buscar');

    const where: Prisma.EmpleadoWhereInput = { empresaId };
    if (estado === 'activo') where.activo = true;
    if (estado === 'inactivo') where.activo = false;
    if (cargo && cargo !== 'all') where.cargo = cargo;
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { cedula: { contains: buscar, mode: 'insensitive' } }
      ];
    }

    const resultado = await paginar(prisma.empleado, {
      cursor,
      take,
      where,
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { ausencias: true, actas: true, movVacaciones: true }
        }
      }
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error GET /api/rrhh/empleados:', error);
    return NextResponse.json({ error: 'Error al listar empleados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    let role: string;
    try {
      ({ empresaId, userId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para registrar un colaborador.' }, { status: 401 });
    }
    if (!puedeVerRuta(role, '/rrhh/empleados')) {
      return NextResponse.json({ error: 'Tu rol no tiene acceso al módulo de RRHH.' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = EmpleadoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const data = parseResult.data;

    // cedula ahora es única por empresa (@@unique([empresaId, cedula])), no global — dos
    // empresas distintas pueden tener cada una un colaborador con la misma cédula.
    const existe = await prisma.empleado.findFirst({
      where: { cedula: data.cedula, empresaId }
    });
    if (existe) {
      return NextResponse.json({ error: 'Ya existe un colaborador registrado con esa cédula' }, { status: 400 });
    }

    const empleado = await prisma.empleado.create({
      data: {
        empresaId,
        cuentaId: data.cuentaId || null,
        nombre: data.nombre,
        cedula: data.cedula,
        cargo: data.cargo,
        salarioBase: data.salarioBase,
        tipoContrato: data.tipoContrato,
        fechaIngreso: new Date(data.fechaIngreso),
        activo: true
      }
    });

    // Auditoría
    await registrarLogAuditoria({
      adminId: userId,
      accion: 'CREAR_EMPLEADO',
      objetivo: 'Empleado',
      objetivoId: empleado.id,
      detalles: { nombre: empleado.nombre, cedula: empleado.cedula, cargo: empleado.cargo },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, empleado });
  } catch (error) {
    console.error('Error POST /api/rrhh/empleados:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al registrar colaborador' }, { status: 500 });
  }
}
