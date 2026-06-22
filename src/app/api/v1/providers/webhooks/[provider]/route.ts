import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, props: { params: Promise<{ provider: string }> }) {
    try {
        const { provider } = await props.params;
        const body = await request.json();
        const { cufe, status, errorMsg, invoiceId } = body;

        if (!invoiceId && !cufe) {
            return NextResponse.json({ error: 'Falta cufe o invoiceId.' }, { status: 400 });
        }

        const where = invoiceId ? { id: invoiceId } : { cufe: cufe };
        const invoice = await prisma.factura.findFirst({ where });

        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada en el sistema.' }, { status: 404 });
        }

        const nextStatus = status === 'authorized' ? 'aceptada' : status === 'rejected' ? 'rechazada' : invoice.estadoDgi;

        const updated = await prisma.$transaction(async (tx) => {
            const inv = await tx.factura.update({
                where: { id: invoice.id },
                data: {
                    estadoDgi: nextStatus,
                    errorDgi: errorMsg || null,
                    fechaAceptacion: nextStatus === 'aceptada' ? new Date() : invoice.fechaAceptacion
                }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: invoice.creadorId,
                    entidad: 'Factura',
                    entidadId: invoice.id,
                    accion: 'editar',
                    datosDespues: { estadoDgi: nextStatus, errorDgi: errorMsg, source: 'webhook', provider }
                }
            });

            return inv;
        });

        return NextResponse.json({ success: true, message: 'Estado de factura actualizado vía webhook.', data: updated });
    } catch (error) {
        console.error('API error in webhook:', error);
        return NextResponse.json({ error: 'Error procesando el webhook del proveedor.' }, { status: 500 });
    }
}