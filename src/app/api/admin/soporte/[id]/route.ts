import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const EditarTicketSchema = z.object({
  estado: z.enum(['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO']).optional(),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  asignadoA: z.string().optional().nullable()
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const ticket = await prisma.ticketSoporte.findUnique({
      where: { id },
      include: {
        cuenta: true,
        respuestas: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket de soporte no encontrado' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error GET /api/admin/soporte/[id]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener detalle del ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = EditarTicketSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const anterior = await prisma.ticketSoporte.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const modificado = await prisma.ticketSoporte.update({
      where: { id },
      data: validacion.data,
      include: { cuenta: true }
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'EDITAR_TICKET_SOPORTE',
      objetivo: 'TicketSoporte',
      objetivoId: id,
      detalles: { anterior, nuevo: modificado }
    });

    return NextResponse.json(modificado);
  } catch (error) {
    console.error('Error PATCH /api/admin/soporte/[id]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar ticket' }, { status: 500 });
  }
}
