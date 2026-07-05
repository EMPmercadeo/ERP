'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export async function getKitDeProducto(productoId: string) {
    const { empresaId } = await getTenantContext();

    const kit = await prisma.productoKit.findUnique({
        where: { productoId },
        include: {
            componentes: {
                include: {
                    productoComponente: {
                        select: { id: true, codigoInterno: true, descripcion: true, costoUnitario: true }
                    }
                }
            }
        }
    });

    if (!kit || kit.empresaId !== empresaId) return null;

    return {
        id: kit.id,
        activo: kit.activo,
        componentes: kit.componentes.map((c) => ({
            productoComponenteId: c.productoComponenteId,
            cantidad: c.cantidad,
            codigoInterno: c.productoComponente.codigoInterno,
            descripcion: c.productoComponente.descripcion,
            costoUnitario: c.productoComponente.costoUnitario.toNumber(),
        }))
    };
}

// Productos elegibles para ser agregados como componentes (activos, y que no sean kits, para evitar anidamiento)
export async function getProductosParaKit(excluirProductoId: string) {
    const { empresaId } = await getTenantContext();

    const productos = await prisma.producto.findMany({
        where: {
            empresaId,
            activo: true,
            esKit: false,
            id: { not: excluirProductoId }
        },
        select: { id: true, codigoInterno: true, descripcion: true, costoUnitario: true },
        orderBy: { descripcion: 'asc' }
    });

    return productos.map((p) => ({
        id: p.id,
        codigoInterno: p.codigoInterno,
        descripcion: p.descripcion,
        costoUnitario: p.costoUnitario.toNumber(),
    }));
}

export async function crearOActualizarKit(
    productoId: string,
    componentes: { productoComponenteId: string; cantidad: number }[]
) {
    try {
        const { empresaId } = await getTenantContext();

        if (!componentes || componentes.length === 0) {
            return { success: false, error: 'Debes agregar al menos un componente al kit.' };
        }

        if (componentes.some((c) => c.productoComponenteId === productoId)) {
            return { success: false, error: 'Un producto no puede ser componente de sí mismo.' };
        }

        if (componentes.some((c) => !Number.isFinite(c.cantidad) || c.cantidad <= 0)) {
            return { success: false, error: 'La cantidad de cada componente debe ser mayor a 0.' };
        }

        const uniqueIds = new Set(componentes.map((c) => c.productoComponenteId));
        if (uniqueIds.size !== componentes.length) {
            return { success: false, error: 'No puedes agregar el mismo componente más de una vez.' };
        }

        const producto = await prisma.producto.findFirst({ where: { id: productoId, empresaId } });
        if (!producto) {
            return { success: false, error: 'Producto no encontrado o acceso denegado.' };
        }

        const componentIds = Array.from(uniqueIds);
        const componentProducts = await prisma.producto.findMany({
            where: { id: { in: componentIds }, empresaId }
        });
        if (componentProducts.length !== componentIds.length) {
            return { success: false, error: 'Uno o más componentes no pertenecen a esta empresa o no existen.' };
        }

        const kitComponent = componentProducts.find((p) => p.esKit);
        if (kitComponent) {
            return {
                success: false,
                error: `"${kitComponent.descripcion}" ya es un kit y no puede usarse como componente de otro kit (no se permiten kits anidados).`
            };
        }

        await prisma.$transaction(async (tx) => {
            await tx.producto.update({ where: { id: productoId }, data: { esKit: true } });

            const kit = await tx.productoKit.upsert({
                where: { productoId },
                create: { empresaId, productoId, activo: true },
                update: { activo: true },
            });

            const existentes = await tx.productoKitComponente.findMany({ where: { productoKitId: kit.id } });
            const existentesMap = new Map(existentes.map((e) => [e.productoComponenteId, e]));

            const aBorrar = existentes.filter((e) => !uniqueIds.has(e.productoComponenteId));
            if (aBorrar.length > 0) {
                await tx.productoKitComponente.deleteMany({ where: { id: { in: aBorrar.map((e) => e.id) } } });
            }

            for (const comp of componentes) {
                const existente = existentesMap.get(comp.productoComponenteId);
                if (existente) {
                    if (existente.cantidad !== comp.cantidad) {
                        await tx.productoKitComponente.update({ where: { id: existente.id }, data: { cantidad: comp.cantidad } });
                    }
                } else {
                    await tx.productoKitComponente.create({
                        data: {
                            empresaId,
                            productoKitId: kit.id,
                            productoComponenteId: comp.productoComponenteId,
                            cantidad: comp.cantidad
                        }
                    });
                }
            }
        });

        revalidatePath(`/products/${productoId}`);
        return { success: true, message: 'Kit guardado correctamente.' };
    } catch (error) {
        console.error('crearOActualizarKit error:', error);
        return { success: false, error: 'Error al guardar el kit.' };
    }
}

export async function desactivarKit(productoId: string) {
    try {
        const { empresaId } = await getTenantContext();

        const producto = await prisma.producto.findFirst({ where: { id: productoId, empresaId } });
        if (!producto) {
            return { success: false, error: 'Producto no encontrado o acceso denegado.' };
        }

        const kit = await prisma.productoKit.findUnique({ where: { productoId } });
        if (!kit || kit.empresaId !== empresaId) {
            return { success: false, error: 'Este producto no tiene un kit configurado.' };
        }

        await prisma.productoKit.update({ where: { productoId }, data: { activo: false } });

        revalidatePath(`/products/${productoId}`);
        return { success: true, message: 'Kit desactivado correctamente.' };
    } catch (error) {
        console.error('desactivarKit error:', error);
        return { success: false, error: 'Error al desactivar el kit.' };
    }
}
