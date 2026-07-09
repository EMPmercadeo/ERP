import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { enviarCorreoSuperadmin } from '@/lib/correo';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const EnvioMasivoSchema = z.object({
  destinatarioTipo: z.enum(['todos', 'plan', 'individual']),
  planId: z.string().optional(),
  correoIndividual: z.string().email().optional(),
  asunto: z.string().min(2, 'El asunto es obligatorio'),
  cuerpoHtml: z.string().min(5, 'El contenido HTML del correo es obligatorio')
});

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado'); // ENVIADO | FALLIDO
    const q = searchParams.get('q');

    const where: any = {};
    if (estado && estado !== 'all') {
      where.estado = estado;
    }
    if (q) {
      where.OR = [
        { destinatario: { contains: q, mode: 'insensitive' } },
        { asunto: { contains: q, mode: 'insensitive' } }
      ];
    }

    const resultado = await paginar(prisma.correoEnviado, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error GET /api/admin/correos:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener historial de correos enviados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = EnvioMasivoSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { destinatarioTipo, planId, correoIndividual, asunto, cuerpoHtml } = validacion.data;

    let cuentasDestino: Array<{ id: string; correo: string; nombre: string; empresa: string }> = [];

    if (destinatarioTipo === 'individual') {
      if (!correoIndividual) {
        return NextResponse.json({ error: 'Debe especificar el correoIndividual' }, { status: 400 });
      }
      const cuenta = await prisma.cuenta.findUnique({ where: { correo: correoIndividual } });
      cuentasDestino.push({
        id: cuenta?.id || '',
        correo: correoIndividual,
        nombre: cuenta?.nombre || 'Usuario',
        empresa: cuenta?.empresa || 'Empresa'
      });
    } else if (destinatarioTipo === 'plan') {
      if (!planId) {
        return NextResponse.json({ error: 'Debe especificar el planId' }, { status: 400 });
      }
      const cuentas = await prisma.cuenta.findMany({
        where: { planId, eliminadoEn: null, estado: 'ACTIVA' },
        select: { id: true, correo: true, nombre: true, empresa: true }
      });
      cuentasDestino = cuentas;
    } else if (destinatarioTipo === 'todos') {
      const cuentas = await prisma.cuenta.findMany({
        where: { eliminadoEn: null, estado: 'ACTIVA' },
        select: { id: true, correo: true, nombre: true, empresa: true }
      });
      cuentasDestino = cuentas;
    }

    let enviados = 0;
    let fallidos = 0;

    for (const c of cuentasDestino) {
      const res = await enviarCorreoSuperadmin({
        cuentaId: c.id || null,
        destinatario: c.correo,
        asunto,
        cuerpoLibre: cuerpoHtml,
        variables: {
          nombre: c.nombre,
          empresa: c.empresa
        }
      });
      if (res.success) enviados++;
      else fallidos++;
    }

    await registrarLogAuditoria({
      adminId,
      accion: 'ENVIO_CORREO_MASIVO',
      objetivo: 'CorreoEnviado',
      detalles: { destinatarioTipo, totalIntentados: cuentasDestino.length, enviados, fallidos, asunto }
    });

    return NextResponse.json({
      success: true,
      message: `Campaña procesada: ${enviados} enviados con éxito, ${fallidos} fallidos.`,
      enviados,
      fallidos,
      total: cuentasDestino.length
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/admin/correos:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar envío masivo de correos' }, { status: 500 });
  }
}
