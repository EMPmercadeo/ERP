'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { WarehouseSchema } from '@/lib/validations';

export async function getBodegas() {
    const { empresaId } = await getTenantContext();
    return prisma.bodega.findMany({
        where: { empresaId },
        include: { sucursal: true },
        orderBy: { codigo: 'asc' },
    });
}

export async function createBodega(prevState: unknown, formData: FormData) {
    const { empresaId, role } = await getTenantContext();
    if (role !== 'admin' && role !== 'gerente') {
        return { message: 'Acceso denegado. Permisos insuficientes.' };
    }

    const rawData = {
        codigo: formData.get('codigo'),
        nombre: formData.get('nombre'),
        sucursalId: formData.get('sucursalId'),
        activa: formData.get('activa') === 'true' || formData.get('activa') === 'on' || formData.get('activa') === null ? true : false,
    };

    const validatedFields = WarehouseSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos requeridos.',
        };
    }

    const { data } = validatedFields;

    try {
        const existe = await prisma.bodega.findFirst({
            where: {
                sucursalId: data.sucursalId,
                codigo: data.codigo,
            }
        });

        if (existe) {
            return {
                message: 'Ya existe una bodega con ese código en la sucursal seleccionada.',
            };
        }

        await prisma.bodega.create({
            data: {
                empresaId,
                sucursalId: data.sucursalId,
                codigo: data.codigo,
                nombre: data.nombre,
                activa: data.activa ?? true,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos al crear la bodega.',
        };
    }

    revalidatePath('/warehouses');
    redirect('/warehouses');
}

export async function updateBodega(id: string, prevState: unknown, formData: FormData) {
    const { empresaId, role } = await getTenantContext();
    if (role !== 'admin' && role !== 'gerente') {
        return { message: 'Acceso denegado. Permisos insuficientes.' };
    }

    const rawData = {
        codigo: formData.get('codigo'),
        nombre: formData.get('nombre'),
        sucursalId: formData.get('sucursalId'),
        activa: formData.get('activa') === 'true' || formData.get('activa') === 'on' ? true : false,
    };

    const validatedFields = WarehouseSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;

    try {
        const existing = await prisma.bodega.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return {
                message: 'Bodega no encontrada o acceso denegado.',
            };
        }

        if (existing.codigo !== data.codigo || existing.sucursalId !== data.sucursalId) {
            const existe = await prisma.bodega.findFirst({
                where: {
                    sucursalId: data.sucursalId,
                    codigo: data.codigo,
                    id: { not: id }
                }
            });

            if (existe) {
                return {
                    message: 'Ya existe otra bodega con ese código en la sucursal seleccionada.',
                };
            }
        }

        await prisma.bodega.update({
            where: { id },
            data: {
                codigo: data.codigo,
                nombre: data.nombre,
                sucursalId: data.sucursalId,
                activa: data.activa ?? true,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos al actualizar la bodega.',
        };
    }

    revalidatePath('/warehouses');
    redirect('/warehouses');
}

export async function deleteBodega(id: string) {
    try {
        const { empresaId, role } = await getTenantContext();
        if (role !== 'admin' && role !== 'gerente') {
            return { success: false, error: 'Acceso denegado. Permisos insuficientes.' };
        }
        const existing = await prisma.bodega.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return { success: false, error: 'Bodega no encontrada o acceso denegado.' };
        }

        const itemsConStock = await prisma.inventarioBodega.count({
            where: { bodegaId: id, cantidad: { gt: 0 } }
        });

        if (itemsConStock > 0) {
            return {
                success: false,
                error: 'No se puede eliminar la bodega porque tiene productos con stock disponible.'
            };
        }

        await prisma.inventarioBodega.deleteMany({
            where: { bodegaId: id }
        });

        await prisma.bodega.delete({
            where: { id }
        });

        revalidatePath('/warehouses');
        return { success: true, message: 'Bodega eliminada exitosamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al eliminar la bodega.' };
    }
}

// Resuelve qué bodega usar: valida la sugerida si viene, o cae a la primera bodega de la empresa.
export async function resolverBodegaId(tx: Prisma.TransactionClient, empresaId: string, bodegaIdSugerido?: string | null): Promise<string> {
    if (bodegaIdSugerido) {
        const valida = await tx.bodega.findFirst({ where: { id: bodegaIdSugerido, empresaId, activa: true } });
        if (valida) return valida.id;
    }
    const principal = await tx.bodega.findFirst({ where: { empresaId, activa: true }, orderBy: { codigo: 'asc' } });
    if (!principal) {
        throw new Error('La empresa no tiene ninguna bodega configurada.');
    }
    return principal.id;
}

async function moverInventarioBodega(tx: Prisma.TransactionClient, params: { empresaId: string; bodegaId: string; productoId: string; delta: number }) {
    await tx.inventarioBodega.upsert({
        where: { bodegaId_productoId: { bodegaId: params.bodegaId, productoId: params.productoId } },
        create: { empresaId: params.empresaId, bodegaId: params.bodegaId, productoId: params.productoId, cantidad: params.delta },
        update: { cantidad: { increment: params.delta } },
    });
}
export { moverInventarioBodega };
