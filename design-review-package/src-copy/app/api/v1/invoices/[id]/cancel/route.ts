import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const { id } = await props.params;
        const body = await request.json().catch(() => ({}));
        const { motivoAnulacion } = body;

        const invoice = await prisma.factura.findFirst({
            where: { id, empresaId }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        if (invoice.estadoDgi === 'anulada') {
            return NextResponse.json({ error: 'La factura ya está anulada.' }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
            const inv = await tx.factura.update({
                where: { id },
                data: {
                    estadoDgi: 'anulada',
                    saldoPendiente: 0,
                    motivoAnulacion: motivoAnulacion || 'Anulación por API'
                }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Factura',
                    entidadId: id,
                    accion: 'anular',
                    datosDespues: { estadoDgi: 'anulada', saldoPendiente: 0 }
                }
            });

            return inv;
        });

        return NextResponse.json({
            success: true,
            status: 'cancelled',
            message: 'Factura anulada correctamente (Nota de Crédito emitida).',
            data: updated
        });
    } catch (error) {
        console.error('API error in /cancel:', error);
        return NextResponse.json({ error: 'Error al anular la factura.' }, { status: 500 });
    }
}