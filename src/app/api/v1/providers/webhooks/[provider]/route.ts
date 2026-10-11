import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function verifyWebhookSignature(providedSignature: string, expectedSecret: string): boolean {
    if (!providedSignature || !expectedSecret) return false;
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSecret);
    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest, props: { params: Promise<{ provider: string }> }) {
    try {
        const { provider } = await props.params;
        const body = await request.json();
        const { cufe, status, errorMsg, invoiceId } = body;

        // Verify webhook token / signature
        const authHeader = request.headers.get('authorization');
        const webhookToken = authHeader?.replace('Bearer ', '');
        if (!webhookToken) {
            return NextResponse.json({ error: 'Missing webhook token or signature' }, { status: 401 });
        }

        // Find the empresa by webhook token
        const empresa = await prisma.empresa.findFirst({
            where: { webhookToken },
            select: { id: true, webhookToken: true }
        });
        if (!empresa || !verifyWebhookSignature(webhookToken, empresa.webhookToken || '')) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
        }

        if (!invoiceId && !cufe) {
            return NextResponse.json({ error: 'Falta cufe o invoiceId.' }, { status: 400 });
        }

        const where = invoiceId ? { id: invoiceId, empresaId: empresa.id } : { cufe: cufe, empresaId: empresa.id };
        const invoice = await prisma.factura.findFirst({ where });

        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada en el sistema.' }, { status: 404 });
        }

        const nextStatus = status === 'authorized' ? 'aceptada' : status === 'rejected' ? 'rechazada' : invoice.estadoDgi;

        await prisma.$transaction(async (tx) => {
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

        return NextResponse.json({ received: true, invoiceId: invoice.id });
    } catch (error) {
        console.error('API error in webhook:', error);
        return NextResponse.json({ error: 'Error procesando el webhook del proveedor.' }, { status: 500 });
    }
}