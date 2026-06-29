'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SupplierPaymentSchema } from '@/lib/validations';
import { getTenantContext } from '@/lib/auth/context';

export async function createSupplierPayment(prevState: any, formData: FormData) {
    const rawData = {
        proveedorId: formData.get('proveedorId'),
        compraId: formData.get('compraId'),
        monto: formData.get('monto') ? parseFloat(formData.get('monto') as string) : 0,
        metodoPago: formData.get('metodoPago'),
        referencia: formData.get('referencia') || null,
    };

    const validatedFields = SupplierPaymentSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos requeridos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId, userId } = await getTenantContext();

    try {
        const compra = await prisma.compra.findFirst({
            where: { id: data.compraId, empresaId }
        });

        if (!compra) {
            return { message: 'Factura de compra no encontrada o acceso denegado.' };
        }

        if (Number(data.monto) > Number(compra.saldoPendiente) + 0.01) {
            return { message: 'El monto a pagar no puede ser mayor al saldo pendiente de la factura.' };
        }

        const nuevoSaldoCompra = Math.max(0, Number(compra.saldoPendiente) - Number(data.monto));
        const nuevoEstadoPago = nuevoSaldoCompra === 0 ? 'pagada' : 'parcial';

        await prisma.$transaction(async (tx) => {
            // Create payment record
            await tx.pagoProveedor.create({
                data: {
                    empresaId,
                    compraId: data.compraId,
                    proveedorId: data.proveedorId,
                    usuarioId: userId,
                    monto: data.monto,
                    metodoPago: data.metodoPago,
                    referencia: data.referencia || null,
                    montoAplicado: data.monto
                }
            });

            // Update purchase pending balance and status
            await tx.compra.update({
                where: { id: data.compraId },
                data: {
                    saldoPendiente: nuevoSaldoCompra,
                    estadoPago: nuevoEstadoPago
                }
            });

            // Decrement supplier balance
            await tx.proveedor.update({
                where: { id: data.proveedorId },
                data: {
                    saldoPendiente: {
                        decrement: data.monto
                    }
                }
            });
        });

    } catch (error) {
        console.error('Create Supplier Payment Error:', error);
        return { message: 'Error al registrar el pago al proveedor.' };
    }

    revalidatePath('/purchases');
    revalidatePath('/suppliers');
    redirect('/purchases');
}
