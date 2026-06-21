'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ClientSchema } from '@/lib/validations';

// Helper to get or create default enterprise
async function getCompanyId() {
    const company = await prisma.empresa.findFirst();
    if (company) return company.id;

    const newCompany = await prisma.empresa.create({
        data: {
            ruc: '123456789',
            dv: '00',
            razonSocial: 'Mi Empresa Default',
            direccion: 'Ciudad de Panamá',
            ambienteDgi: '1',
        }
    });

    const sucursal = await prisma.sucursal.create({
        data: {
            empresaId: newCompany.id,
            codigo: '001',
            nombre: 'Sucursal Principal',
            direccion: 'Ciudad de Panamá',
        }
    });

    await prisma.caja.create({
        data: {
            empresaId: newCompany.id,
            sucursalId: sucursal.id,
            codigo: '01',
            nombre: 'Caja Principal'
        }
    });

    return newCompany.id;
}

export async function createClient(prevState: any, formData: FormData) {
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
    };

    const validatedFields = ClientSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;
    const empresaId = await getCompanyId();

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

export async function updateClient(id: string, prevState: any, formData: FormData) {
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
    };

    const validatedFields = ClientSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }

    const { data } = validatedFields;

    try {
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
        await prisma.cliente.delete({
            where: { id }
        });
        revalidatePath('/clients');
        return { success: true, message: 'Cliente eliminado correctamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, message: 'Error al eliminar el cliente. Podría tener facturas asociadas.' };
    }
}

