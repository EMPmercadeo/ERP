'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { TransferenciaBodegaSchema } from '@/lib/validations';
import { moverInventarioBodega } from '@/lib/actions/bodegas';

export async function getTransferencias() {
    const { empresaId } = await getTenantContext();
    return prisma.transferenciaBodega.findMany({
        where: { empresaId },
        include: {
            bodegaOrigen: true,
            bodegaDestino: true,
            creador: { select: { nombre: true } },
            receptor: { select: { nombre: true } },
            items: { include: { producto: { select: { descripcion: true, codigoInterno: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// Productos con stock disponible en una bodega dada, para el selector de la nueva transferencia.
// Excluye servicios (unidadMedida "SRV") — no llevan inventario físico, no se pueden transferir.
export async function getProductosDisponiblesEnBodega(bodegaId: string) {
    const { empresaId } = await getTenantContext();

    const bodega = await prisma.bodega.findFirst({ where: { id: bodegaId, empresaId } });
    if (!bodega) return [];

    const inventarios = await prisma.inventarioBodega.findMany({
        where: { empresaId, bodegaId, cantidad: { gt: 0 } },
        include: { producto: { select: { id: true, codigoInterno: true, descripcion: true, unidadMedida: true } } },
    });

    return inventarios
        .filter((i) => i.producto.unidadMedida !== 'SRV')
        .map((i) => ({
            productoId: i.productoId,
            codigo: i.producto.codigoInterno,
            descripcion: i.producto.descripcion,
            disponible: i.cantidad,
        }))
        .sort((a, b) => a.descripcion.localeCompare(b.descripcion));
}

export async function createTransferencia(prevState: unknown, formData: FormData) {
    const { empresaId, userId, role } = await getTenantContext();
    if (role !== 'admin' && role !== 'gerente') {
        return { message: 'Acceso denegado. Permisos insuficientes.' };
    }

    const rawData = {
        bodegaOrigenId: formData.get('bodegaOrigenId'),
        bodegaDestinoId: formData.get('bodegaDestinoId'),
        notas: formData.get('notas') || '',
        items: JSON.parse((formData.get('items') as string) || '[]'),
    };

    const validatedFields = TransferenciaBodegaSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: validatedFields.error.issues[0]?.message || 'Error de validación. Revisa los campos requeridos.',
        };
    }

    const { data } = validatedFields;

    try {
        const [origen, destino] = await Promise.all([
            prisma.bodega.findFirst({ where: { id: data.bodegaOrigenId, empresaId } }),
            prisma.bodega.findFirst({ where: { id: data.bodegaDestinoId, empresaId } }),
        ]);
        if (!origen) return { message: 'Bodega de origen no encontrada o no pertenece a tu empresa.' };
        if (!destino) return { message: 'Bodega de destino no encontrada o no pertenece a tu empresa.' };

        // Validar stock disponible en origen para cada ítem ANTES de descontar nada.
        const disponibilidad = await prisma.inventarioBodega.findMany({
            where: {
                empresaId,
                bodegaId: data.bodegaOrigenId,
                productoId: { in: data.items.map((i) => i.productoId) },
            },
        });
        const mapaDisponible = new Map(disponibilidad.map((d) => [d.productoId, d.cantidad]));

        for (const item of data.items) {
            const disponible = mapaDisponible.get(item.productoId) || 0;
            if (item.cantidad > disponible) {
                const prod = await prisma.producto.findUnique({
                    where: { id: item.productoId },
                    select: { descripcion: true },
                });
                return {
                    message: `Stock insuficiente en la bodega de origen para "${prod?.descripcion || item.productoId}". Disponible: ${disponible}.`,
                };
            }
        }

        const numero = await prisma.$transaction(async (tx) => {
            const count = await tx.transferenciaBodega.count({ where: { empresaId } });
            const numeroGenerado = `TRF-${String(count + 1).padStart(6, '0')}`;

            const transferencia = await tx.transferenciaBodega.create({
                data: {
                    empresaId,
                    numero: numeroGenerado,
                    bodegaOrigenId: data.bodegaOrigenId,
                    bodegaDestinoId: data.bodegaDestinoId,
                    notas: data.notas || null,
                    creadorId: userId,
                    items: {
                        create: data.items.map((i) => ({
                            productoId: i.productoId,
                            cantidad: Math.round(i.cantidad),
                        })),
                    },
                },
            });

            // Descuenta el stock de la bodega origen de inmediato: el producto ya salió
            // físicamente y no debe seguir contando como disponible ahí mientras viaja.
            for (const item of data.items) {
                await moverInventarioBodega(tx, {
                    empresaId,
                    bodegaId: data.bodegaOrigenId,
                    productoId: item.productoId,
                    delta: -Math.round(item.cantidad),
                });
                await tx.movimientoInventario.create({
                    data: {
                        empresaId,
                        productoId: item.productoId,
                        tipo: 'salida',
                        cantidad: Math.round(item.cantidad),
                        concepto: 'transferencia_bodega_envio',
                        referenciaId: transferencia.id,
                    },
                });
            }

            return numeroGenerado;
        });

        revalidatePath('/warehouses/transfers');
        revalidatePath('/products');
        return { success: true, message: `Transferencia ${numero} creada. El stock ya salió de la bodega de origen y quedó "en tránsito".` };
    } catch (error) {
        console.error('Error creating transferencia:', error);
        return { message: error instanceof Error ? error.message : 'Error al crear la transferencia.' };
    }
}

export async function recibirTransferencia(id: string) {
    const { empresaId, userId, role } = await getTenantContext();
    if (role !== 'admin' && role !== 'gerente') {
        return { success: false, message: 'Acceso denegado. Permisos insuficientes.' };
    }
    try {
        const transferencia = await prisma.transferenciaBodega.findFirst({
            where: { id, empresaId },
            include: { items: true },
        });
        if (!transferencia) {
            return { success: false, message: 'Transferencia no encontrada o acceso denegado.' };
        }
        if (transferencia.estado !== 'en_transito') {
            return { success: false, message: `Esta transferencia ya está en estado "${transferencia.estado}" y no se puede recibir de nuevo.` };
        }

        await prisma.$transaction(async (tx) => {
            await tx.transferenciaBodega.update({
                where: { id },
                data: { estado: 'recibido', fechaRecepcion: new Date(), receptorId: userId },
            });

            for (const item of transferencia.items) {
                await moverInventarioBodega(tx, {
                    empresaId,
                    bodegaId: transferencia.bodegaDestinoId,
                    productoId: item.productoId,
                    delta: item.cantidad,
                });
                await tx.movimientoInventario.create({
                    data: {
                        empresaId,
                        productoId: item.productoId,
                        tipo: 'entrada',
                        cantidad: item.cantidad,
                        concepto: 'transferencia_bodega_recepcion',
                        referenciaId: transferencia.id,
                    },
                });
            }
        });

        revalidatePath('/warehouses/transfers');
        revalidatePath('/products');
        return { success: true, message: `Transferencia ${transferencia.numero} recibida. Stock acreditado en la bodega destino.` };
    } catch (error) {
        console.error('Error receiving transferencia:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error al recibir la transferencia.' };
    }
}

export async function cancelarTransferencia(id: string) {
    const { empresaId, role } = await getTenantContext();
    if (role !== 'admin' && role !== 'gerente') {
        return { success: false, message: 'Acceso denegado. Permisos insuficientes.' };
    }
    try {
        const transferencia = await prisma.transferenciaBodega.findFirst({
            where: { id, empresaId },
            include: { items: true },
        });
        if (!transferencia) {
            return { success: false, message: 'Transferencia no encontrada o acceso denegado.' };
        }
        if (transferencia.estado !== 'en_transito') {
            return { success: false, message: `Solo se pueden cancelar transferencias en tránsito. Esta está "${transferencia.estado}".` };
        }

        await prisma.$transaction(async (tx) => {
            await tx.transferenciaBodega.update({
                where: { id },
                data: { estado: 'cancelado' },
            });

            // Revierte el descuento que se hizo en origen al crear la transferencia.
            for (const item of transferencia.items) {
                await moverInventarioBodega(tx, {
                    empresaId,
                    bodegaId: transferencia.bodegaOrigenId,
                    productoId: item.productoId,
                    delta: item.cantidad,
                });
                await tx.movimientoInventario.create({
                    data: {
                        empresaId,
                        productoId: item.productoId,
                        tipo: 'entrada',
                        cantidad: item.cantidad,
                        concepto: 'transferencia_bodega_cancelada',
                        referenciaId: transferencia.id,
                    },
                });
            }
        });

        revalidatePath('/warehouses/transfers');
        revalidatePath('/products');
        return { success: true, message: `Transferencia ${transferencia.numero} cancelada. Stock revertido a la bodega de origen.` };
    } catch (error) {
        console.error('Error cancelling transferencia:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error al cancelar la transferencia.' };
    }
}
