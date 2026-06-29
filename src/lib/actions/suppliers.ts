'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SupplierSchema } from '@/lib/validations';
import { getTenantContext } from '@/lib/auth/context';

export async function createSupplier(prevState: any, formData: FormData) {
    const rawData = {
        tipoRuc: formData.get('tipoRuc'),
        ruc: formData.get('ruc'),
        dv: formData.get('dv') || null,
        razonSocial: formData.get('razonSocial'),
        nombreComercial: formData.get('nombreComercial') || null,
        email: formData.get('email') || null,
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        condicionPago: formData.get('condicionPago') || 'Contado',
    };

    const validatedFields = SupplierSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos requeridos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId } = await getTenantContext();

    try {
        await prisma.proveedor.create({
            data: {
                empresaId,
                tipoRuc: data.tipoRuc,
                ruc: data.ruc,
                dv: data.dv || '',
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                email: data.email || '',
                telefono: data.telefono || '',
                direccion: data.direccion || '',
                condicionPago: data.condicionPago,
                estado: 'activo'
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos. El RUC del proveedor podría estar duplicado.',
        };
    }

    revalidatePath('/suppliers');
    redirect('/suppliers');
}

export async function updateSupplier(id: string, prevState: any, formData: FormData) {
    const rawData = {
        tipoRuc: formData.get('tipoRuc'),
        ruc: formData.get('ruc'),
        dv: formData.get('dv') || null,
        razonSocial: formData.get('razonSocial'),
        nombreComercial: formData.get('nombreComercial') || null,
        email: formData.get('email') || null,
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        condicionPago: formData.get('condicionPago') || 'Contado',
    };

    const validatedFields = SupplierSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId } = await getTenantContext();

    try {
        const existing = await prisma.proveedor.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return { message: 'Proveedor no encontrado o acceso denegado.' };
        }

        await prisma.proveedor.update({
            where: { id },
            data: {
                tipoRuc: data.tipoRuc,
                ruc: data.ruc,
                dv: data.dv || '',
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                email: data.email || '',
                telefono: data.telefono || '',
                direccion: data.direccion || '',
                condicionPago: data.condicionPago,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error al actualizar el proveedor.' };
    }

    revalidatePath('/suppliers');
    redirect('/suppliers');
}

export async function deleteSupplier(id: string) {
    try {
        const { empresaId } = await getTenantContext();
        const existing = await prisma.proveedor.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return { success: false, error: 'Proveedor no encontrado o acceso denegado.' };
        }

        const relatedPurchases = await prisma.compra.count({
            where: { proveedorId: id, empresaId }
        });

        if (relatedPurchases > 0) {
            await prisma.proveedor.update({
                where: { id },
                data: { estado: 'inactivo' }
            });
            revalidatePath('/suppliers');
            return { success: true, message: 'Proveedor desactivado (tiene compras asociadas).' };
        }

        await prisma.proveedor.delete({
            where: { id }
        });
        revalidatePath('/suppliers');
        return { success: true, message: 'Proveedor eliminado correctamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al eliminar el proveedor.' };
    }
}
