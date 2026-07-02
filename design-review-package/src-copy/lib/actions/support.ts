'use server';

import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export async function createSupportTicket(subject: string, message: string) {
    try {
        const { userId, empresaId } = await getTenantContext();

        const ticket = await prisma.auditoria.create({
            data: {
                usuarioId: userId,
                entidad: 'Soporte',
                entidadId: 'new-ticket',
                accion: 'crear',
                datosDespues: {
                    subject,
                    message,
                    empresaId,
                    createdAt: new Date().toISOString()
                }
            }
        });

        return { success: true, message: 'Ticket de soporte creado correctamente.', ticketId: ticket.id };
    } catch (error) {
        console.error('Error creating support ticket:', error);
        return { success: false, message: 'Error al enviar el ticket de soporte.' };
    }
}

export async function submitFeedback(text: string) {
    try {
        const { userId, empresaId } = await getTenantContext();

        const feedback = await prisma.auditoria.create({
            data: {
                usuarioId: userId,
                entidad: 'Feedback',
                entidadId: 'new-feedback',
                accion: 'crear',
                datosDespues: {
                    text,
                    empresaId,
                    createdAt: new Date().toISOString()
                }
            }
        });

        return { success: true, message: 'Comentarios enviados correctamente.', feedbackId: feedback.id };
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return { success: false, message: 'Error al enviar comentarios.' };
    }
}
