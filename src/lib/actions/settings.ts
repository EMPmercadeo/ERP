'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';
import { encrypt } from '@/lib/utils/crypto';

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
        const { empresaId: authEmpresaId } = await getTenantContext();
        if (authEmpresaId !== empresaId) {
            return { success: false, message: 'Acceso denegado. No está autorizado para modificar esta empresa.' };
        }

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

        // Upsert ConfiguracionFacturacionElectronica
        const credencialCifrada = data.passwordPac ? encrypt(data.passwordPac) : '';
        const ambiente = data.ambienteDgi === '2' ? 1 : 2; // DGI: 1 = producción, 2 = pruebas

        await prisma.configuracionFacturacionElectronica.upsert({
            where: { empresaId },
            create: {
                empresaId,
                proveedor: 'GENERICO',
                ambiente,
                baseUrl: 'https://api.generico-pac.com',
                authTipo: 'API_KEY',
                credencialCifrada,
                activo: empresa.fiscalEnabled
            },
            update: {
                ambiente,
                credencialCifrada: data.passwordPac ? credencialCifrada : undefined,
                activo: empresa.fiscalEnabled
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
        const { empresaId: authEmpresaId } = await getTenantContext();
        if (authEmpresaId !== empresaId) {
            return { success: false, message: 'Acceso denegado. No está autorizado para modificar esta empresa.' };
        }

        if (!['free', 'basic', 'pro', 'enterprise'].includes(planType)) {
            return { success: false, message: 'Plan no válido.' };
        }

        // If plan is pro or enterprise, enable fiscal integrations.
        // If it's free, disable it, and reset ambienteDgi to test '1'.
        const fiscalEnabled = planType !== 'free';
        const updateData: { planType: string; fiscalEnabled: boolean; ambienteDgi?: string } = {
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

        // Sync with ConfiguracionFacturacionElectronica active flag
        const config = await prisma.configuracionFacturacionElectronica.findUnique({
            where: { empresaId }
        });
        if (config) {
            await prisma.configuracionFacturacionElectronica.update({
                where: { empresaId },
                data: {
                    activo: fiscalEnabled,
                    ambiente: planType === 'free' ? 2 : config.ambiente
                }
            });
        } else {
            // Create a default one if plan updated but none exists
            await prisma.configuracionFacturacionElectronica.create({
                data: {
                    empresaId,
                    proveedor: 'GENERICO',
                    ambiente: 2,
                    baseUrl: 'https://api.generico-pac.com',
                    authTipo: 'API_KEY',
                    credencialCifrada: '',
                    activo: fiscalEnabled
                }
            });
        }

        revalidatePath('/settings');
        return { success: true, message: `Plan actualizado a ${planType.toUpperCase()} correctamente.` };
    } catch (error) {
        console.error('Error updating plan:', error);
        return { success: false, message: 'Error al cambiar de plan.' };
    }
}

export async function updateIntegrationSettings(empresaId: string, data: {
    whatsappPhone?: string;
    whatsappToken?: string;
    webhookUrl?: string;
    webhookToken?: string;
}) {
    try {
        const { empresaId: authEmpresaId } = await getTenantContext();
        if (authEmpresaId !== empresaId) {
            return { success: false, message: 'Acceso denegado. No está autorizado para modificar esta empresa.' };
        }

        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                whatsappPhone: data.whatsappPhone || null,
                whatsappToken: data.whatsappToken || null,
                webhookUrl: data.webhookUrl || null,
                webhookToken: data.webhookToken || null
            }
        });

        revalidatePath('/settings');
        return { success: true, message: 'Configuración de integraciones guardada correctamente.' };
    } catch (error) {
        console.error('Error updating integration settings:', error);
        return { success: false, message: 'Error al guardar la configuración de integraciones.' };
    }
}
