'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProductSchema } from '@/lib/validations';
import { getTenantContext } from '@/lib/auth/context';

export async function createProduct(prevState: any, formData: FormData) {
    const { empresaId, userId } = await getTenantContext();

    const rawData = {
        codigoInterno: formData.get('codigoInterno'),
        codigoBarras: formData.get('codigoBarras'),
        descripcion: formData.get('descripcion'),
        descripcionLarga: formData.get('descripcionLarga'),
        imagenUrl: formData.get('imagenUrl'),
        unidadMedida: formData.get('unidadMedida') || 'UND',
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

    // Check duplicate code within company
    const exists = await prisma.producto.findFirst({
        where: { empresaId, codigoInterno: data.codigoInterno }
    });

    if (exists) {
        return {
            message: 'El código interno ya está registrado en esta empresa.',
            errors: { codigoInterno: ['Código interno duplicado'] }
        };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const prod = await tx.producto.create({
                data: {
                    empresaId,
                    codigoInterno: data.codigoInterno,
                    codigoBarras: data.codigoBarras || null,
                    descripcion: data.descripcion,
                    descripcionLarga: data.descripcionLarga,
                    imagenUrl: data.imagenUrl || null,
                    costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : 0,
                    precioVenta: parseFloat(data.precioVenta),
                    codigoTasaItbms: data.codigoTasaItbms,
                    unidadMedida: data.unidadMedida,
                    stockActual: data.stockActual ? parseInt(data.stockActual) : 0,
                    stockMinimo: data.stockMinimo ? parseInt(data.stockMinimo) : 0,
                    activo: true
                },
            });

            // Write to Auditoria
            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Producto',
                    entidadId: prod.id,
                    accion: 'crear',
                    datosDespues: JSON.parse(JSON.stringify({
                        ...prod,
                        costoUnitario: prod.costoUnitario.toNumber(),
                        precioVenta: prod.precioVenta.toNumber()
                    })),
                }
            });
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error al crear producto.',
        };
    }

    revalidatePath('/products');
    redirect('/products');
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
    const { empresaId, userId } = await getTenantContext();

    const rawData = {
        codigoInterno: formData.get('codigoInterno'),
        codigoBarras: formData.get('codigoBarras'),
        descripcion: formData.get('descripcion'),
        descripcionLarga: formData.get('descripcionLarga'),
        imagenUrl: formData.get('imagenUrl'),
        unidadMedida: formData.get('unidadMedida'),
        costoUnitario: formData.get('costoUnitario'),
        precioVenta: formData.get('precioVenta'),
        codigoTasaItbms: formData.get('codigoTasaItbms'),
        stockActual: formData.get('stockActual'),
        stockMinimo: formData.get('stockMinimo'),
        activo: formData.get('activo') === 'true'
    };

    const validatedFields = ProductSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;

    // Verify ownership
    const existingProduct = await prisma.producto.findFirst({
        where: { id, empresaId }
    });

    if (!existingProduct) {
        return {
            message: 'Producto no encontrado o acceso denegado.'
        };
    }

    // Check duplicate code if changed
    if (data.codigoInterno !== existingProduct.codigoInterno) {
        const duplicate = await prisma.producto.findFirst({
            where: { empresaId, codigoInterno: data.codigoInterno, id: { not: id } }
        });
        if (duplicate) {
            return {
                message: 'El código interno ya está registrado en esta empresa.',
                errors: { codigoInterno: ['Código interno duplicado'] }
            };
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            const updated = await tx.producto.update({
                where: { id },
                data: {
                    codigoInterno: data.codigoInterno,
                    codigoBarras: data.codigoBarras || null,
                    descripcion: data.descripcion,
                    descripcionLarga: data.descripcionLarga,
                    imagenUrl: data.imagenUrl || null,
                    costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : 0,
                    precioVenta: parseFloat(data.precioVenta),
                    codigoTasaItbms: data.codigoTasaItbms,
                    unidadMedida: data.unidadMedida,
                    stockActual: data.stockActual ? parseInt(data.stockActual) : 0,
                    stockMinimo: data.stockMinimo ? parseInt(data.stockMinimo) : 0,
                    activo: rawData.activo
                },
            });

            // Write to Auditoria
            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Producto',
                    entidadId: id,
                    accion: 'editar',
                    datosAntes: JSON.parse(JSON.stringify({
                        ...existingProduct,
                        costoUnitario: existingProduct.costoUnitario.toNumber(),
                        precioVenta: existingProduct.precioVenta.toNumber()
                    })),
                    datosDespues: JSON.parse(JSON.stringify({
                        ...updated,
                        costoUnitario: updated.costoUnitario.toNumber(),
                        precioVenta: updated.precioVenta.toNumber()
                    })),
                }
            });
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
    try {
        const { empresaId } = await getTenantContext();
        const product = await prisma.producto.findFirst({
            where: { id, empresaId }
        });

        if (!product) return null;

        // Fetch Audit history as well
        const auditLogs = await prisma.auditoria.findMany({
            where: { entidad: 'Producto', entidadId: id },
            include: { usuario: { select: { nombre: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const formattedAuditLogs = auditLogs.map(log => ({
            id: log.id,
            accion: log.accion,
            createdAt: log.createdAt.toISOString(),
            usuarioNombre: log.usuario.nombre,
            usuarioEmail: log.usuario.email,
            datosAntes: log.datosAntes,
            datosDespues: log.datosDespues
        }));

        // Fetch Sales history from billing (outputs / salidas) as a proxy for movements
        const salesItems = await prisma.facturaItem.findMany({
            where: { productoId: id, factura: { empresaId, estadoDgi: { not: 'anulada' } } },
            include: { factura: { select: { numeroCompleto: true, fechaEmision: true, cliente: { select: { razonSocial: true } } } } },
            orderBy: { factura: { fechaEmision: 'desc' } },
            take: 20
        });

        const formattedSalesHistory = salesItems.map(item => ({
            id: item.id,
            facturaId: item.facturaId,
            facturaNumero: item.factura.numeroCompleto,
            fecha: item.factura.fechaEmision.toISOString(),
            cliente: item.factura.cliente.razonSocial,
            cantidad: item.cantidad.toNumber(),
            precio: item.precioUnitario.toNumber(),
            total: item.montoTotal.toNumber()
        }));

        return {
            ...product,
            costoUnitario: product.costoUnitario.toNumber(),
            precioVenta: product.precioVenta.toNumber(),
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
            auditHistory: formattedAuditLogs,
            salesHistory: formattedSalesHistory
        };
    } catch (e) {
        console.error('Error fetching product:', e);
        return null;
    }
}

export async function deleteProduct(id: string) {
    try {
        const { empresaId, userId } = await getTenantContext();

        // 1. Verify product ownership
        const product = await prisma.producto.findFirst({
            where: { id, empresaId }
        });
        if (!product) {
            return { success: false, error: 'Producto no encontrado o acceso denegado' };
        }

        // 2. Check for related FacturaItems
        const relatedInvoicesCount = await prisma.facturaItem.count({
            where: { productoId: id }
        });

        if (relatedInvoicesCount > 0) {
            // Logical deactivation
            await prisma.$transaction(async (tx) => {
                await tx.producto.update({
                    where: { id },
                    data: { activo: false }
                });

                // Write to Auditoria
                await tx.auditoria.create({
                    data: {
                        usuarioId: userId,
                        entidad: 'Producto',
                        entidadId: id,
                        accion: 'editar',
                        datosAntes: { activo: product.activo },
                        datosDespues: { activo: false }
                    }
                });
            });
            revalidatePath('/products');
            return { success: true, deactivated: true, message: 'Producto desactivado lógicamente por tener facturas asociadas.' };
        }

        // Physical deletion if no associations exist
        await prisma.$transaction(async (tx) => {
            await tx.producto.delete({
                where: { id }
            });

            // Write to Auditoria
            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Producto',
                    entidadId: id,
                    accion: 'eliminar',
                    datosAntes: JSON.parse(JSON.stringify({
                        ...product,
                        costoUnitario: product.costoUnitario.toNumber(),
                        precioVenta: product.precioVenta.toNumber()
                    }))
                }
            });
        });
        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: 'Error al procesar la eliminación' };
    }
}

export async function getProductsForExport(filters: {
    search?: string;
    status?: string;
    tax?: string;
    stockStatus?: string;
}) {
    try {
        const { empresaId } = await getTenantContext();

        const where: any = {
            empresaId
        };

        if (filters.search) {
            where.OR = [
                { codigoInterno: { contains: filters.search, mode: 'insensitive' } },
                { descripcion: { contains: filters.search, mode: 'insensitive' } },
                { descripcionLarga: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        if (filters.status === 'activo') {
            where.activo = true;
        } else if (filters.status === 'inactivo') {
            where.activo = false;
        }

        if (filters.tax && filters.tax !== 'all') {
            where.codigoTasaItbms = filters.tax;
        }

        if (filters.stockStatus && filters.stockStatus !== 'all') {
            if (filters.stockStatus === 'con_stock') {
                where.stockActual = { gt: 0 };
            } else if (filters.stockStatus === 'sin_stock') {
                where.stockActual = { lte: 0 };
            } else if (filters.stockStatus === 'bajo_stock') {
                where.stockActual = { gt: 0, lt: 10 };
            }
        }

        const products = await prisma.producto.findMany({
            where,
            orderBy: { codigoInterno: 'asc' }
        });

        return products.map(p => ({
            codigoInterno: p.codigoInterno,
            descripcion: p.descripcion,
            descripcionLarga: p.descripcionLarga || '',
            precioVenta: p.precioVenta.toNumber(),
            costoUnitario: p.costoUnitario.toNumber(),
            codigoTasaItbms: p.codigoTasaItbms,
            stockActual: p.stockActual,
            activo: p.activo,
            unidadMedida: p.unidadMedida,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString()
        }));
    } catch (e) {
        console.error('Export query failed', e);
        return [];
    }
}
