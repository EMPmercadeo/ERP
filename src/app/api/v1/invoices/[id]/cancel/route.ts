import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { anularFacturaDGI } from '@/lib/actions/billing-fe';

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

        // Si la factura ya tiene CUFE (fue timbrada ante un PAC real), la anulación DEBE
        // notificarse al PAC — antes esta ruta solo cambiaba el estado localmente sin avisarle
        // nunca a la DGI, lo que habría dejado facturas "anuladas" en el ERP pero vigentes ante
        // el fisco. anularFacturaDGI() maneja ese caso (y respeta el kill-switch); si la factura
        // nunca fue timbrada (sin CUFE, aún en modo local/gratuito), simplemente se anula en el
        // sistema local ya que la DGI nunca llegó a conocer ese documento.
        if (invoice.cufe) {
            const resultado = await anularFacturaDGI(id, motivoAnulacion || 'Anulación por API');
            if (!resultado.success) {
                return NextResponse.json({ error: resultado.message }, { status: 400 });
            }
            return NextResponse.json({ success: true, status: 'cancelled', message: resultado.message });
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
            message: 'Factura anulada correctamente en el sistema local (no había sido timbrada ante la DGI).',
            data: updated
        });
    } catch (error) {
        console.error('API error in /cancel:', error);
        return NextResponse.json({ error: 'Error al anular la factura.' }, { status: 500 });
    }
}