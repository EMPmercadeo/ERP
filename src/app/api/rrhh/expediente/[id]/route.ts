import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { puedeVerRuta } from '@/lib/permissions';
import { z } from 'zod';

const ActaSchema = z.object({
  tipo: z.enum(['AMONESTACION_VERBAL', 'AMONESTACION_ESCRITA', 'MEMORANDO', 'SUSPENSION']),
  falta: z.string().min(2, 'Especifique la categoría de falta (p. ej. Ausentismo Injustificado, Incumplimiento)'),
  descripcion: z.string().min(10, 'Descripción detallada requerida'),
  fechaHecho: z.string().or(z.date()),
  evidenciaUrl: z.string().optional(),
  emitidaPor: z.string().min(2, 'Nombre del emisor requerido'),
  reincidenciaDe: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    let role: string;
    try {
      ({ empresaId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver el expediente.' }, { status: 401 });
    }
    if (!puedeVerRuta(role, '/rrhh/empleados')) {
      return NextResponse.json({ error: 'Tu rol no tiene acceso al módulo de RRHH.' }, { status: 403 });
    }

    const { id } = await params; // id del empleado
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado || empleado.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    const actas = await prisma.actaDisciplinaria.findMany({
      where: { empleadoId: id },
      orderBy: { fechaHecho: 'desc' }
    });

    return NextResponse.json({ actas });
  } catch (error: any) {
    console.error('Error GET /api/rrhh/expediente/[id]:', error);
    return NextResponse.json({ error: 'Error al obtener expediente disciplinario' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    let userId: string;
    let role: string;
    try {
      ({ empresaId, userId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para gestionar el expediente.' }, { status: 401 });
    }
    if (!puedeVerRuta(role, '/rrhh/empleados')) {
      return NextResponse.json({ error: 'Tu rol no tiene acceso al módulo de RRHH.' }, { status: 403 });
    }

    const { id } = await params; // id del empleado
    const body = await request.json();

    // Si es una firma de acuse de un acta existente
    if (body.accion === 'FIRMA_ACUSE' && body.actaId) {
      const actaExistente = await prisma.actaDisciplinaria.findUnique({
        where: { id: body.actaId },
        include: { empleado: true }
      });
      if (!actaExistente || actaExistente.empleado.empresaId !== empresaId) {
        return NextResponse.json({ error: 'Acta no encontrada' }, { status: 404 });
      }

      const actaActualizada = await prisma.actaDisciplinaria.update({
        where: { id: body.actaId },
        data: {
          acuseEmpleado: true,
          fechaAcuse: new Date()
        },
        include: { empleado: true }
      });

      await registrarLogAuditoria({
        adminId: userId,
        accion: 'FIRMA_ACUSE_DISCIPLINARIO',
        objetivo: 'ActaDisciplinaria',
        objetivoId: actaActualizada.id,
        detalles: { empleado: actaActualizada.empleado.nombre, tipo: actaActualizada.tipo, fechaAcuse: actaActualizada.fechaAcuse },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      });

      return NextResponse.json({ success: true, acta: actaActualizada });
    }

    // Si es creación de nueva acta
    const parseResult = ActaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const data = parseResult.data;
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado || empleado.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    const acta = await prisma.actaDisciplinaria.create({
      data: {
        empleadoId: id,
        tipo: data.tipo,
        falta: data.falta,
        descripcion: data.descripcion,
        fechaHecho: new Date(data.fechaHecho),
        evidenciaUrl: data.evidenciaUrl || null,
        emitidaPor: data.emitidaPor,
        reincidenciaDe: data.reincidenciaDe || null
      }
    });

    await registrarLogAuditoria({
      adminId: userId,
      accion: 'EMITIR_ACTA_DISCIPLINARIA',
      objetivo: 'ActaDisciplinaria',
      objetivoId: acta.id,
      detalles: { empleado: empleado.nombre, tipo: acta.tipo, falta: acta.falta, reincidenciaDe: acta.reincidenciaDe },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, acta });
  } catch (error: any) {
    console.error('Error POST /api/rrhh/expediente/[id]:', error);
    return NextResponse.json({ error: 'Error en la gestión del expediente disciplinario' }, { status: 500 });
  }
}
