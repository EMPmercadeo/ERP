import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { z } from 'zod';

const EmpleadoSchema = z.object({
  empresaId: z.string().min(1, 'Empresa ID requerido'),
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
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado'); // 'activo' | 'inactivo' | 'all'
    const cargo = searchParams.get('cargo');
    const buscar = searchParams.get('buscar');
    const empresaId = searchParams.get('empresaId');

    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
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
  } catch (error: any) {
    console.error('Error GET /api/rrhh/empleados:', error);
    return NextResponse.json({ error: 'Error al listar empleados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = EmpleadoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const data = parseResult.data;

    // Verificar si ya existe por cédula en la empresa
    const existe = await prisma.empleado.findUnique({
      where: { cedula: data.cedula }
    });
    if (existe) {
      return NextResponse.json({ error: 'Ya existe un colaborador registrado con esa cédula' }, { status: 400 });
    }

    const empleado = await prisma.empleado.create({
      data: {
        empresaId: data.empresaId,
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
      adminId: data.empresaId,
      accion: 'CREAR_EMPLEADO',
      objetivo: 'Empleado',
      objetivoId: empleado.id,
      detalles: { nombre: empleado.nombre, cedula: empleado.cedula, cargo: empleado.cargo },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, empleado });
  } catch (error: any) {
    console.error('Error POST /api/rrhh/empleados:', error);
    return NextResponse.json({ error: error.message || 'Error al registrar colaborador' }, { status: 500 });
  }
}
