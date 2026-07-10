import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { enviarCorreoSuperadmin } from '@/lib/correo';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const ResponderTicketSchema = z.object({
  mensaje: z.string().min(2, 'El mensaje de la respuesta no puede estar vacío'),
  cambiarEstado: z.enum(['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO']).optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = ResponderTicketSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const ticket = await prisma.ticketSoporte.findUnique({
      where: { id },
      include: { cuenta: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket de soporte no encontrado' }, { status: 404 });
    }

    const { mensaje, cambiarEstado } = validacion.data;

    // 1. Crear respuesta y actualizar estado de ticket transaccionalmente
    const [respuesta, ticketActualizado] = await prisma.$transaction([
      prisma.respuestaTicket.create({
        data: {
          ticketId: id,
          autor: adminId,
          mensaje
        }
      }),
      prisma.ticketSoporte.update({
        where: { id },
        data: {
          estado: cambiarEstado || (ticket.estado === 'ABIERTO' ? 'EN_PROCESO' : ticket.estado)
        }
      })
    ]);

    // 2. Enviar correo de notificación al cliente
    if (ticket.cuenta && ticket.cuenta.correo) {
      await enviarCorreoSuperadmin({
        cuentaId: ticket.cuentaId,
        destinatario: ticket.cuenta.correo,
        asunto: `Actualización en Ticket #${ticket.id.slice(-6).toUpperCase()}: ${ticket.asunto}`,
        cuerpoLibre: `<p>Hola <strong>${ticket.cuenta.nombre}</strong>,</p><p>El equipo de soporte ha respondido a tu ticket <strong>"${ticket.asunto}"</strong>:</p><blockquote style="background:#f4f4f4;padding:12px;border-left:4px solid #00f0ff;">${mensaje}</blockquote><p>Estado actual del ticket: <strong>${ticketActualizado.estado}</strong>.</p>`
      });
    }

    // 3. Registrar auditoría
    await registrarLogAuditoria({
      adminId,
      accion: 'RESPONDER_TICKET_SOPORTE',
      objetivo: 'TicketSoporte',
      objetivoId: id,
      detalles: { mensaje, estadoResultante: ticketActualizado.estado }
    });

    return NextResponse.json({
      success: true,
      message: 'Respuesta añadida y notificación enviada al cliente por correo.',
      respuesta,
      ticket: ticketActualizado
    }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/soporte/[id]/responder:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al responder ticket de soporte' }, { status: 500 });
  }
}
