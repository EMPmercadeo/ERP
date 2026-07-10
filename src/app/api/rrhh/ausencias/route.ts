import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { puedeVerRuta } from '@/lib/permissions';
import { z } from 'zod';

const AusenciaSchema = z.object({
  empleadoId: z.string().min(1, 'ID de empleado requerido'),
  tipo: z.enum(['VACACIONES', 'ENFERMEDAD', 'PERMISO', 'INJUSTIFICADA', 'MATERNIDAD', 'LUTO', 'OTRO']),
  desde: z.string().or(z.date()),
  hasta: z.string().or(z.date()),
  documentoUrl: z.string().optional(),
  nota: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Sin esto, este endpoint devolvía las ausencias de TODAS las empresas del sistema a
    // cualquiera que cargara la página (nombres, cédula, tipo de incapacidad médica, etc.
    // de cada colaborador de cada empresa) — no filtraba por tenant en absoluto.
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver las ausencias.' }, { status: 401 });
    }
    if (!puedeVerRuta(role, '/rrhh/ausencias')) {
      return NextResponse.json({ error: 'Tu rol no tiene acceso al módulo de RRHH.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const empleadoId = searchParams.get('empleadoId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const where: Prisma.AusenciaWhereInput = { empleado: { empresaId } };
    if (empleadoId) where.empleadoId = empleadoId;
    if (estado && estado !== 'all') where.estado = estado;
    if (tipo && tipo !== 'all') where.tipo = tipo;

    const resultado = await paginar(prisma.ausencia, {
      cursor,
      take,
      where,
      orderBy: { desde: 'desc' },
      include: {
        empleado: { select: { id: true, nombre: true, cedula: true, cargo: true, empresaId: true } }
      }
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error GET /api/rrhh/ausencias:', error);
    return NextResponse.json({ error: 'Error al listar ausencias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para registrar una ausencia.' }, { status: 401 });
    }
    if (!puedeVerRuta(role, '/rrhh/ausencias')) {
      return NextResponse.json({ error: 'Tu rol no tiene acceso al módulo de RRHH.' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = AusenciaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { empleadoId, tipo, desde, hasta, documentoUrl, nota } = parseResult.data;

    // El empleado debe pertenecer a la empresa de la sesión — si no, cualquiera podría
    // registrar ausencias contra colaboradores de otra empresa con solo conocer su ID.
    const empleadoObjetivo = await prisma.empleado.findUnique({ where: { id: empleadoId } });
    if (!empleadoObjetivo || empleadoObjetivo.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Colaborador no encontrado en tu empresa.' }, { status: 404 });
    }

    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);

    if (fechaHasta < fechaDesde) {
      return NextResponse.json({ error: 'La fecha de fin (hasta) no puede ser anterior a la de inicio (desde)' }, { status: 400 });
    }

    // Calcular días calendario
    const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Verificar incapacidad de enfermedad/maternidad: exigen certificado según Regla 1.2
    if ((tipo === 'ENFERMEDAD' || tipo === 'MATERNIDAD') && !documentoUrl) {
      return NextResponse.json({ error: 'Las incapacidades de Enfermedad o Maternidad exigen adjuntar certificado médico o de la CSS (documentoUrl)' }, { status: 400 });
    }

    // Validación de servidor: no traslapes con ausencias ya aprobadas o pendientes para ese empleado
    const traslape = await prisma.ausencia.findFirst({
      where: {
        empleadoId,
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        AND: [
          { desde: { lte: fechaHasta } },
          { hasta: { gte: fechaDesde } }
        ]
      }
    });

    if (traslape) {
      return NextResponse.json({ error: 'El colaborador ya posee una ausencia registrada en ese periodo de fechas (traslape detectado)' }, { status: 400 });
    }

    const justificada = tipo !== 'INJUSTIFICADA';

    const ausencia = await prisma.ausencia.create({
      data: {
        empleadoId,
        tipo,
        desde: fechaDesde,
        hasta: fechaHasta,
        dias,
        justificada,
        documentoUrl: documentoUrl || null,
        estado: 'PENDIENTE',
        nota: nota || null
      },
      include: { empleado: true }
    });

    // Registrar en LogAuditoria
    await registrarLogAuditoria({
      adminId: ausencia.empleado.empresaId,
      accion: 'REGISTRAR_AUSENCIA',
      objetivo: 'Ausencia',
      objetivoId: ausencia.id,
      detalles: { empleado: ausencia.empleado.nombre, tipo, dias, justificada },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, ausencia });
  } catch (error) {
    console.error('Error POST /api/rrhh/ausencias:', error);
    return NextResponse.json({ error: 'Error al registrar solicitud de ausencia' }, { status: 500 });
  }
}
