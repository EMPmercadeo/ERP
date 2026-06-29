'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PurchaseSchema } from '@/lib/validations';
import { getTenantContext } from '@/lib/auth/context';

export async function createPurchase(prevState: any, formData: FormData) {
    const rawItems = formData.get('items');
    let items: any[] = [];
    if (rawItems) {
        try {
            items = JSON.parse(rawItems as string);
        } catch (e) {
            return { message: 'Formato de ítems inválido.' };
        }
    }

    const rawData = {
        proveedorId: formData.get('proveedorId'),
        numeroFactura: formData.get('numeroFactura'),
        fechaEmision: formData.get('fechaEmision'),
        fechaVencimiento: formData.get('fechaVencimiento'),
        observaciones: formData.get('observaciones') || null,
        items,
    };

    const validatedFields = PurchaseSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos requeridos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId, userId } = await getTenantContext();

    try {
        const proveedor = await prisma.proveedor.findFirst({
            where: { id: data.proveedorId, empresaId }
        });

        if (!proveedor) {
            return { message: 'Proveedor no encontrado o acceso denegado.' };
        }

        // Calculate totals
        let subtotal = 0;
        let totalDescuento = 0;
        let totalItbms = 0;

        const processedItems = data.items.map((item) => {
            const importe = item.cantidad * item.costoUnitario;
            const descuentoDesc = item.descuento || 0;
            const baseImponible = importe - descuentoDesc;

            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                         item.codigoTasaItbms === '02' ? 0.10 :
                         item.codigoTasaItbms === '03' ? 0.15 : 0;
            const montoItbms = baseImponible * tasa;
            const montoTotal = baseImponible + montoItbms;

            subtotal += importe;
            totalDescuento += descuentoDesc;
            totalItbms += montoItbms;

            return {
                productoId: item.productoId || null,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                costoUnitario: item.costoUnitario,
                descuento: descuentoDesc,
                codigoTasaItbms: item.codigoTasaItbms || '00',
                montoItbms,
                montoTotal,
            };
        });

        const totalNeto = subtotal - totalDescuento + totalItbms;

        // Transaction: Create purchase, update supplier balance, and increment inventory stock
        await prisma.$transaction(async (tx) => {
            await tx.compra.create({
                data: {
                    empresaId,
                    proveedorId: data.proveedorId,
                    creadorId: userId,
                    numeroFactura: data.numeroFactura,
                    fechaEmision: new Date(`${data.fechaEmision}T12:00:00`),
                    fechaVencimiento: new Date(`${data.fechaVencimiento}T12:00:00`),
                    subtotal,
                    totalDescuento,
                    totalItbms,
                    totalNeto,
                    saldoPendiente: totalNeto,
                    estadoPago: 'pendiente',
                    observaciones: data.observaciones || null,
                    items: {
                        create: processedItems
                    }
                }
            });

            // Increment supplier balance
            await tx.proveedor.update({
                where: { id: data.proveedorId },
                data: {
                    saldoPendiente: {
                        increment: totalNeto
                    }
                }
            });

            // Update inventory stock and unit cost for linked products
            for (const item of processedItems) {
                if (item.productoId) {
                    await tx.producto.updateMany({
                        where: { id: item.productoId, empresaId },
                        data: {
                            stockActual: { increment: Math.round(Number(item.cantidad)) },
                            costoUnitario: item.costoUnitario
                        }
                    });
                }
            }
        });

    } catch (error) {
        console.error('Create Purchase Error:', error);
        return { message: 'Error al registrar la factura de compra.' };
    }

    revalidatePath('/purchases');
    revalidatePath('/suppliers');
    revalidatePath('/products');
    redirect('/purchases');
}

export async function deletePurchase(id: string) {
    try {
        const { empresaId } = await getTenantContext();
        const compra = await prisma.compra.findFirst({
            where: { id, empresaId },
            include: { items: true }
        });

        if (!compra) {
            return { success: false, error: 'Compra no encontrada o acceso denegado.' };
        }

        if (Number(compra.saldoPendiente) !== Number(compra.totalNeto)) {
            return { success: false, error: 'No se puede eliminar una factura que ya tiene pagos registrados.' };
        }

        await prisma.$transaction(async (tx) => {
            // Revert inventory stock
            for (const item of compra.items) {
                if (item.productoId) {
                    await tx.producto.updateMany({
                        where: { id: item.productoId, empresaId },
                        data: {
                            stockActual: { decrement: Math.round(Number(item.cantidad)) }
                        }
                    });
                }
            }

            // Decrement supplier balance
            await tx.proveedor.update({
                where: { id: compra.proveedorId },
                data: {
                    saldoPendiente: { decrement: compra.totalNeto }
                }
            });

            // Delete purchase
            await tx.compra.delete({
                where: { id }
            });
        });

        revalidatePath('/purchases');
        revalidatePath('/suppliers');
        revalidatePath('/products');
        return { success: true, message: 'Factura de compra eliminada y stock revertido.' };
    } catch (error) {
        console.error('Delete Purchase Error:', error);
        return { success: false, error: 'Error al eliminar la compra.' };
    }
}
