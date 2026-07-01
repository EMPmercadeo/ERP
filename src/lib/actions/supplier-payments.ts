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
        await prisma.$transaction(async (tx) => {
            const compra = await tx.compra.findFirst({
                where: { id: data.compraId, empresaId }
            });

            if (!compra) {
                throw new Error('Factura de compra no encontrada o acceso denegado.');
            }

            const sumPagos = await tx.pagoProveedor.aggregate({
                _sum: { montoAplicado: true },
                where: { compraId: data.compraId }
            });

            const saldoRealCompra = Number(compra.totalNeto) - Number(sumPagos._sum.montoAplicado || 0);

            if (Number(data.monto) > saldoRealCompra + 0.005) {
                throw new Error(`Sobrepago rechazado: El monto a pagar ($${data.monto.toFixed(2)}) excede el saldo disponible ($${saldoRealCompra.toFixed(2)}) de la factura.`);
            }

            const nuevoSaldoCompra = Math.max(0, saldoRealCompra - Number(data.monto));
            const nuevoEstadoPago = nuevoSaldoCompra <= 0.005 ? 'pagada' : 'parcial';

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

    } catch (error: any) {
        console.error('Create Supplier Payment Error:', error);
        return { success: false, message: error?.message || 'Error al registrar el pago al proveedor.' };
    }

    revalidatePath('/purchases');
    revalidatePath('/suppliers');
    revalidatePath(`/suppliers/${data.proveedorId}`);

    if (formData.get('noRedirect') === 'true') {
        return { success: true, message: 'Pago aplicado exitosamente.' };
    }

    redirect('/purchases');
}
