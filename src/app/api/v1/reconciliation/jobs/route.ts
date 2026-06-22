import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { empresaId, userId } = await getTenantContext();

        const pendingInvoices = await prisma.factura.findMany({
            where: {
                empresaId,
                estadoDgi: 'pendiente'
            }
        });

        let updatedCount = 0;

        for (const invoice of pendingInvoices) {
            const simulateSuccess = Math.random() > 0.2;
            const nextStatus = simulateSuccess ? 'aceptada' : 'rechazada';
            const mockCufe = simulateSuccess ? 'FE2026' + invoice.empresaId.substring(0, 10) + '01' + String(invoice.numeroSecuencial).padStart(8, '0') + '0000' : null;

            await prisma.$transaction(async (tx) => {
                await tx.factura.update({
                    where: { id: invoice.id },
                    data: {
                        estadoDgi: nextStatus,
                        cufe: mockCufe || invoice.cufe,
                        fechaAceptacion: nextStatus === 'aceptada' ? new Date() : null,
                        errorDgi: nextStatus === 'rechazada' ? 'Error simulado de comunicación con DGI' : null
                    }
                });

                await tx.auditoria.create({
                    data: {
                        usuarioId: userId,
                        entidad: 'Factura',
                        entidadId: invoice.id,
                        accion: 'editar',
                        datosDespues: { estadoDgi: nextStatus, source: 'reconciliation_job' }
                    }
                });
                updatedCount++;
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Trabajo de reconciliación completado. Facturas procesadas: ' + pendingInvoices.length + ', Actualizadas: ' + updatedCount
        });
    } catch (error) {
        console.error('API error in /reconciliation/jobs:', error);
        return NextResponse.json({ error: 'Error procesando el job de reconciliación.' }, { status: 500 });
    }
}