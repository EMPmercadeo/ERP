'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ClientSchema } from '@/lib/validations';
import { getTenantContext } from '@/lib/auth/context';

export async function createClient(prevState: unknown, formData: FormData) {
    const rawData = {
        tipoRuc: formData.get('tipoRuc'),
        ruc: formData.get('ruc'),
        dv: formData.get('dv') || null,
        razonSocial: formData.get('razonSocial'),
        email: formData.get('email') || null,
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        limiteCredito: formData.get('limiteCredito'),
        diasCredito: formData.get('diasCredito'),
        descuentoEspecial: formData.get('descuentoEspecial'),
    };

    const validatedFields = ClientSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId } = await getTenantContext();

    try {
        await prisma.cliente.create({
            data: {
                empresaId,
                tipoRuc: data.tipoRuc,
                ruc: data.ruc,
                dv: data.dv || '',
                razonSocial: data.razonSocial,
                email: data.email,
                telefono: data.telefono,
                direccion: data.direccion,
                limiteCredito: data.limiteCredito ? parseFloat(data.limiteCredito) : 0,
                condicionPago: data.diasCredito ? (data.diasCredito === '0' ? 'Contado' : `Crédito ${data.diasCredito}`) : 'Contado',
                descuentoEspecial: data.descuentoEspecial ? parseFloat(data.descuentoEspecial) : 0,
                estado: 'activo'
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos. El RUC podría estar duplicado.',
        };
    }

    revalidatePath('/clients');
    redirect('/clients');
}

export async function updateClient(id: string, prevState: unknown, formData: FormData) {
    const rawData = {
        tipoRuc: formData.get('tipoRuc'),
        ruc: formData.get('ruc'),
        dv: formData.get('dv') || null,
        razonSocial: formData.get('razonSocial'),
        email: formData.get('email') || null,
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        limiteCredito: formData.get('limiteCredito'),
        diasCredito: formData.get('diasCredito'),
        descuentoEspecial: formData.get('descuentoEspecial'),
    };

    const validatedFields = ClientSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId } = await getTenantContext();

    try {
        const existing = await prisma.cliente.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return {
                message: 'Cliente no encontrado o acceso denegado.'
            };
        }

        await prisma.cliente.update({
            where: { id },
            data: {
                tipoRuc: data.tipoRuc,
                ruc: data.ruc,
                dv: data.dv || '',
                razonSocial: data.razonSocial,
                email: data.email,
                telefono: data.telefono,
                direccion: data.direccion,
                limiteCredito: data.limiteCredito ? parseFloat(data.limiteCredito) : 0,
                condicionPago: data.diasCredito ? (data.diasCredito === '0' ? 'Contado' : `Crédito ${data.diasCredito}`) : 'Contado',
                descuentoEspecial: data.descuentoEspecial ? parseFloat(data.descuentoEspecial) : 0,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos. El RUC podría estar duplicado.',
        };
    }

    revalidatePath('/clients');
    redirect('/clients');
}

export async function deleteClient(id: string) {
    try {
        const { empresaId } = await getTenantContext();
        const existing = await prisma.cliente.findFirst({
            where: { id, empresaId }
        });
        if (!existing) {
            return { success: false, error: 'Cliente no encontrado o acceso denegado.' };
        }

        // Check for related invoices before hard delete
        const relatedInvoices = await prisma.factura.count({
            where: { clienteId: id, empresaId }
        });

        if (relatedInvoices > 0) {
            // Soft delete: mark as inactive instead of deleting
            await prisma.cliente.update({
                where: { id },
                data: { estado: 'inactivo' }
            });
            revalidatePath('/clients');
            return { success: true, message: 'Cliente desactivado (tiene facturas asociadas).' };
        }

        await prisma.cliente.delete({
            where: { id }
        });
        revalidatePath('/clients');
        return { success: true, message: 'Cliente eliminado correctamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al eliminar el cliente. Podría tener facturas asociadas.' };
    }
}

// Alta rápida de cliente para usarse en línea (p.ej. desde la pantalla de nueva cotización)
// SIN redirigir: crea el cliente con la misma validación (ClientSchema) y scope por empresa
// que createClient, revalida /clients para que aparezca en el módulo de Clientes y en las
// búsquedas, y DEVUELVE el cliente creado para poder seleccionarlo al instante donde se llamó.
export async function createClientQuick(input: {
    tipoRuc: string;
    ruc: string;
    dv?: string | null;
    razonSocial: string;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    // Opcionales: la alta rápida (modal) puede omitirlos y quedan en sus defaults,
    // pero si se envían usan la misma lógica que el alta de página completa (createClient)
    // para que ambos flujos produzcan el mismo modelo de datos.
    limiteCredito?: string | null;
    diasCredito?: string | null;
    descuentoEspecial?: string | null;
}) {
    const validated = ClientSchema.safeParse({
        tipoRuc: input.tipoRuc,
        ruc: input.ruc,
        dv: input.dv || null,
        razonSocial: input.razonSocial,
        email: input.email || null,
        telefono: input.telefono || null,
        direccion: input.direccion || null,
        limiteCredito: input.limiteCredito || null,
        diasCredito: input.diasCredito || null,
        descuentoEspecial: input.descuentoEspecial || null,
    });

    if (!validated.success) {
        return {
            success: false as const,
            message: validated.error.issues[0]?.message || 'Datos inválidos. Revisa los campos.',
        };
    }

    const { data } = validated;
    const { empresaId } = await getTenantContext();

    try {
        const cliente = await prisma.cliente.create({
            data: {
                empresaId,
                tipoRuc: data.tipoRuc,
                ruc: data.ruc,
                dv: data.dv || '',
                razonSocial: data.razonSocial,
                email: data.email,
                telefono: data.telefono,
                direccion: data.direccion,
                limiteCredito: data.limiteCredito ? parseFloat(data.limiteCredito) : 0,
                condicionPago: data.diasCredito ? (data.diasCredito === '0' ? 'Contado' : `Crédito ${data.diasCredito}`) : 'Contado',
                descuentoEspecial: data.descuentoEspecial ? parseFloat(data.descuentoEspecial) : 0,
                estado: 'activo',
            },
            select: {
                id: true,
                razonSocial: true,
                ruc: true,
                dv: true,
                email: true,
                telefono: true,
                direccion: true,
            },
        });

        // Refleja el nuevo cliente en el módulo de Clientes (y cualquier vista revalidada).
        revalidatePath('/clients');

        return { success: true as const, cliente };
    } catch (error) {
        console.error('createClientQuick error:', error);
        return {
            success: false as const,
            message: 'No se pudo crear el cliente. El RUC podría estar duplicado.',
        };
    }
}

