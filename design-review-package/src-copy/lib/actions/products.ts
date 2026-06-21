'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProductSchema } from '@/lib/validations';

async function getCompanyId() {
    const company = await prisma.empresa.findFirst();
    if (company) return company.id;
    throw new Error('No hay empresa configurada');
}

export async function createProduct(prevState: any, formData: FormData) {
    const rawData = {
        codigoInterno: formData.get('codigoInterno'),
        descripcion: formData.get('descripcion'),
        descripcionLarga: formData.get('descripcionLarga'),
        unidadMedida: formData.get('unidadMedida'),
        costoUnitario: formData.get('costoUnitario'),
        precioVenta: formData.get('precioVenta'),
        codigoTasaItbms: formData.get('codigoTasaItbms'),
        stockActual: formData.get('stockActual'),
        stockMinimo: formData.get('stockMinimo'),
        activo: true
    };

    const validatedFields = ProductSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;
    const empresaId = await getCompanyId();

    try {
        await prisma.producto.create({
            data: {
                empresaId,
                codigoInterno: data.codigoInterno,
                descripcion: data.descripcion,
                descripcionLarga: data.descripcionLarga,
                costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : 0,
                precioVenta: parseFloat(data.precioVenta),
                codigoTasaItbms: data.codigoTasaItbms,
                unidadMedida: data.unidadMedida,
                stockActual: data.stockActual ? parseInt(data.stockActual) : 0,
                stockMinimo: data.stockMinimo ? parseInt(data.stockMinimo) : 0,
                activo: true
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error al crear producto. El código ya existe.',
        };
    }

    revalidatePath('/products');
    redirect('/products');
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
    console.log('Update Product Triggered for ID:', id);
    const rawData = {
        codigoInterno: formData.get('codigoInterno'),
        descripcion: formData.get('descripcion'),
        descripcionLarga: formData.get('descripcionLarga'),
        unidadMedida: formData.get('unidadMedida'),
        costoUnitario: formData.get('costoUnitario'),
        precioVenta: formData.get('precioVenta'),
        codigoTasaItbms: formData.get('codigoTasaItbms'),
        stockActual: formData.get('stockActual'),
        stockMinimo: formData.get('stockMinimo'),
        activo: true // Or handle separately if active toggle is needed
    };

    const validatedFields = ProductSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;

    try {
        await prisma.producto.update({
            where: { id },
            data: {
                codigoInterno: data.codigoInterno,
                descripcion: data.descripcion,
                // descripcionLarga: data.descripcionLarga,
                costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : 0,
                precioVenta: parseFloat(data.precioVenta),
                codigoTasaItbms: data.codigoTasaItbms,
                unidadMedida: data.unidadMedida,
                stockActual: data.stockActual ? parseInt(data.stockActual) : 0,
                stockMinimo: data.stockMinimo ? parseInt(data.stockMinimo) : 0,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error al actualizar producto.',
        };
    }

    revalidatePath('/products');
    revalidatePath(`/products/${id}`);

    return {
        message: 'Producto actualizado correctamente',
        success: true,
    };
}

export async function getProduct(id: string) {
    const product = await prisma.producto.findUnique({
        where: { id }
    });

    if (!product) return null;

    return {
        ...product,
        costoUnitario: product.costoUnitario.toNumber(),
        precioVenta: product.precioVenta.toNumber(),
        // Ensure strictly serializable
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    };
}

export async function deleteProduct(id: string) {
    try {
        await prisma.producto.delete({
            where: { id }
        });
        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: 'Failed to delete product' };
    }
}
