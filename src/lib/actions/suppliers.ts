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
        nombreContacto: formData.get('nombreContacto') || null,
        email: formData.get('email') || null,
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        limiteCredito: formData.get('limiteCredito') ? Number(formData.get('limiteCredito')) : undefined,
        condicionPago: formData.get('condicionPago') || 'Contado',
        observaciones: formData.get('observaciones') || null,
        estado: formData.get('estado') || 'activo',
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
                nombreContacto: data.nombreContacto || '',
                email: data.email || '',
                telefono: data.telefono || '',
                direccion: data.direccion || '',
                limiteCredito: data.limiteCredito,
                condicionPago: data.condicionPago,
                observaciones: data.observaciones || '',
                estado: data.estado || 'activo'
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
        nombreContacto: formData.get('nombreContacto') || null,
        email: formData.get('email') || null,
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        limiteCredito: formData.get('limiteCredito') ? Number(formData.get('limiteCredito')) : undefined,
        condicionPago: formData.get('condicionPago') || 'Contado',
        observaciones: formData.get('observaciones') || null,
        estado: formData.get('estado') || 'activo',
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
                nombreContacto: data.nombreContacto || '',
                email: data.email || '',
                telefono: data.telefono || '',
                direccion: data.direccion || '',
                limiteCredito: data.limiteCredito,
                condicionPago: data.condicionPago,
                observaciones: data.observaciones || '',
                estado: data.estado || 'activo',
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error al actualizar el proveedor.' };
    }

    revalidatePath('/suppliers');
    revalidatePath(`/suppliers/${id}`);
    redirect('/suppliers');
}

export async function toggleSupplierStatus(id: string, nuevoEstado: string) {
    try {
        const { empresaId } = await getTenantContext();
        const existing = await prisma.proveedor.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return { success: false, error: 'Proveedor no encontrado o acceso denegado.' };
        }

        await prisma.proveedor.update({
            where: { id },
            data: { estado: nuevoEstado }
        });

        revalidatePath('/suppliers');
        revalidatePath(`/suppliers/${id}`);
        return { success: true, message: `Estado cambiado a ${nuevoEstado}.` };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al cambiar estado del proveedor.' };
    }
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
                data: { estado: 'archivado' }
            });
            revalidatePath('/suppliers');
            revalidatePath(`/suppliers/${id}`);
            return { success: true, message: 'Proveedor archivado (tiene compras asociadas).' };
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

export async function getSuppliersWithSummary() {
    try {
        const { empresaId } = await getTenantContext();

        const suppliers = await prisma.proveedor.findMany({
            where: { empresaId },
            take: 1000,
            orderBy: { razonSocial: 'asc' },
            include: {
                compras: {
                    where: { estadoPago: { not: 'anulada' } },
                    select: {
                        id: true,
                        fechaEmision: true,
                        fechaVencimiento: true,
                        saldoPendiente: true,
                        totalNeto: true,
                    }
                }
            }
        });

        const now = new Date();
        let totalPorPagar = 0;
        let saldoVencido = 0;
        let proximosVencimientos = 0;
        let proveedoresActivos = 0;

        const formattedSuppliers = suppliers.map((p) => {
            if (p.estado === 'activo') proveedoresActivos++;

            let saldo = 0;
            let facturasPendientes = 0;
            let facturasVencidas = 0;

            for (const c of p.compras) {
                const pend = Number(c.saldoPendiente || 0);
                if (pend > 0.01) {
                    saldo += pend;
                    facturasPendientes++;
                    totalPorPagar += pend;

                    const venc = new Date(c.fechaVencimiento);
                    if (venc < now) {
                        facturasVencidas++;
                        saldoVencido += pend;
                    } else {
                        proximosVencimientos += pend;
                    }
                }
            }

            return {
                id: p.id,
                tipoRuc: p.tipoRuc,
                ruc: p.ruc,
                dv: p.dv || '',
                razonSocial: p.razonSocial,
                nombreComercial: p.nombreComercial || '',
                nombreContacto: p.nombreContacto || '',
                email: p.email || '',
                telefono: p.telefono || '',
                direccion: p.direccion || '',
                limiteCredito: p.limiteCredito ? Number(p.limiteCredito) : 0,
                condicionPago: p.condicionPago || 'Contado',
                saldoPendiente: saldo,
                totalFacturas: p.compras.length,
                facturasPendientes,
                facturasVencidas,
                observaciones: p.observaciones || '',
                estado: p.estado || 'activo',
            };
        });

        const summary = {
            totalPorPagar,
            saldoVencido,
            proximosVencimientos,
            proveedoresActivos
        };

        return { success: true, suppliers: formattedSuppliers, summary };
    } catch (error) {
        console.error('Error fetching suppliers action:', error);
        return { success: false };
    }
}

