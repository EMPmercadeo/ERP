import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const { id } = await props.params;

        const invoice = await prisma.factura.findFirst({
            where: { id, empresaId },
            include: { cliente: true, empresa: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        const errors = [];

        if (!invoice.empresa.ruc || !invoice.empresa.dv) {
            errors.push('El emisor no tiene configurado RUC o DV.');
        }
        if (!invoice.cliente.ruc) {
            errors.push('El cliente receptor no tiene RUC configurado.');
        }
        if (!invoice.cliente.razonSocial) {
            errors.push('El cliente receptor no tiene Razón Social configurada.');
        }
        if (invoice.totalNeto.toNumber() <= 0) {
            errors.push('El monto neto total de la factura debe ser mayor a 0.');
        }

        const nextStatus = errors.length > 0 ? 'rechazada' : 'pendiente';
        const errorText = errors.length > 0 ? errors.join(' | ') : null;

        const updated = await prisma.$transaction(async (tx) => {
            const inv = await tx.factura.update({
                where: { id },
                data: {
                    estadoDgi: nextStatus,
                    errorDgi: errorText
                }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Factura',
                    entidadId: id,
                    accion: 'editar',
                    datosDespues: { estadoDgi: inv.estadoDgi, errorDgi: errorText }
                }
            });

            return inv;
        });

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                status: 'rejected_business',
                errors,
                data: updated
            }, { status: 422 });
        }

        return NextResponse.json({
            success: true,
            status: 'validated_local',
            data: updated
        });

    } catch (error) {
        console.error('API error in /validate:', error);
        return NextResponse.json({ error: 'Error durante la validación fiscal local.' }, { status: 500 });
    }
}