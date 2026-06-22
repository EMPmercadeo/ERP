'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateDgiSettings(empresaId: string, data: {
    razonSocial: string;
    ruc: string;
    dv: string;
    direccion: string;
    usuarioPac?: string;
    passwordPac?: string;
    ambienteDgi?: string;
}) {
    try {
        // Fetch current plan to check if they attempt to set production
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa) {
            return { success: false, message: 'Empresa no encontrada' };
        }

        // If they are on the free plan and try to set production environment
        if (empresa.planType === 'free' && data.ambienteDgi === '2') {
            return { 
                success: false, 
                message: 'El ambiente de producción DGI solo está disponible en planes Pro o Enterprise. Por favor, actualiza tu plan.' 
            };
        }

        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                razonSocial: data.razonSocial,
                ruc: data.ruc,
                dv: data.dv,
                direccion: data.direccion,
                usuarioPac: data.usuarioPac || null,
                passwordPac: data.passwordPac || null,
                ambienteDgi: data.ambienteDgi || '1'
            }
        });

        revalidatePath('/settings');
        return { success: true, message: 'Configuración DGI guardada correctamente.' };
    } catch (error) {
        console.error('Error updating DGI settings:', error);
        return { success: false, message: 'Error al guardar la configuración.' };
    }
}

export async function updateCompanyPlan(empresaId: string, planType: string) {
    try {
        if (!['free', 'basic', 'pro', 'enterprise'].includes(planType)) {
            return { success: false, message: 'Plan no válido.' };
        }

        // If plan is pro or enterprise, enable fiscal integrations.
        // If it's free, disable it, and reset ambienteDgi to test '1'.
        const fiscalEnabled = planType !== 'free';
        const updateData: any = {
            planType,
            fiscalEnabled
        };

        if (planType === 'free') {
            updateData.ambienteDgi = '1';
        }

        await prisma.empresa.update({
            where: { id: empresaId },
            data: updateData
        });

        revalidatePath('/settings');
        return { success: true, message: `Plan actualizado a ${planType.toUpperCase()} correctamente.` };
    } catch (error) {
        console.error('Error updating plan:', error);
        return { success: false, message: 'Error al cambiar de plan.' };
    }
}
