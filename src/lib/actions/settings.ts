'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';
import { encrypt } from '@/lib/utils/crypto';
import { verifyPayPalSubscription } from '@/lib/services/paypalVerify';

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

        // La contraseña del PAC nunca se guarda en texto plano — se cifra con el mismo
        // esquema AES-256-GCM ya usado para credenciales de WooCommerce. Si el usuario no
        // envía una contraseña nueva, se conserva la que ya estaba guardada (cifrada).
        const passwordPacCifrada = data.passwordPac ? encrypt(data.passwordPac) : undefined;

        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                razonSocial: data.razonSocial,
                ruc: data.ruc,
                dv: data.dv,
                direccion: data.direccion,
                usuarioPac: data.usuarioPac || null,
                ...(passwordPacCifrada !== undefined ? { passwordPac: passwordPacCifrada } : {}),
                ambienteDgi: data.ambienteDgi || '1'
            }
        });

        // Upsert ConfiguracionFacturacionElectronica
        const credencialCifrada = passwordPacCifrada ?? '';
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

export async function updateCompanyPlan(empresaId: string, planType: string, paypalSubscriptionId?: string) {
    try {
        const { empresaId: authEmpresaId } = await getTenantContext();
        if (authEmpresaId !== empresaId) {
            return { success: false, message: 'Acceso denegado. No está autorizado para modificar esta empresa.' };
        }

        if (!['free', 'basic', 'pro', 'enterprise'].includes(planType)) {
            return { success: false, message: 'Plan no válido.' };
        }

        // CRÍTICO: los downgrades a 'free' no requieren verificación (el usuario solo se
        // perjudica a sí mismo). Pero cualquier upgrade a un plan pagado SÍ debe verificarse
        // contra la API real de PayPal — antes esta función confiaba ciegamente en lo que
        // mandara el cliente, así que cualquiera podía "activar" un plan pagado sin pagar
        // llamando a esta server action directamente (p. ej. desde la consola del navegador).
        if (planType !== 'free') {
            const planIdEnvMap: Record<string, string | undefined> = {
                basic: process.env.NEXT_PUBLIC_PLAN_BASIC_ID || process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC_ID,
                pro: process.env.NEXT_PUBLIC_PLAN_PRO_ID || process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO_ID,
            };
            const expectedPlanId = planIdEnvMap[planType];
            const verificacion = await verifyPayPalSubscription(paypalSubscriptionId, empresaId, expectedPlanId);
            if (!verificacion.ok) {
                return { success: false, message: verificacion.reason || 'No se pudo verificar el pago con PayPal.' };
            }
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

/**
 * Guarda las credenciales de Yappy Comercial (Botón de Pago V2) de esta empresa. La clave
 * secreta se cifra con AES-256-GCM (mismo esquema que passwordPac/consumerKey/consumerSec) y,
 * si el usuario no manda una nueva, se conserva la que ya estaba guardada — igual que
 * updateDgiSettings hace con passwordPac. `yappyEnabled` solo puede activarse si ya hay
 * merchantId + secretKey + dominio configurados (de lo contrario /api/pos/ventas/... nunca
 * hará una llamada real de todos modos, pero es mejor no dejar "encendido" algo a medias).
 */
export async function updateYappySettings(empresaId: string, data: {
    yappyMerchantId?: string;
    yappySecretKey?: string;
    yappyDomain?: string;
    yappyAmbiente?: string;
    yappyEnabled: boolean;
}) {
    try {
        const { empresaId: authEmpresaId } = await getTenantContext();
        if (authEmpresaId !== empresaId) {
            return { success: false, message: 'Acceso denegado. No está autorizado para modificar esta empresa.' };
        }

        const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
        if (!empresa) {
            return { success: false, message: 'Empresa no encontrada' };
        }

        const merchantId = data.yappyMerchantId?.trim() || null;
        const domain = data.yappyDomain?.trim() || null;
        const secretCifrada = data.yappySecretKey ? encrypt(data.yappySecretKey) : undefined;
        const tieneSecretGuardada = secretCifrada !== undefined || !!empresa.yappySecretKey;

        if (data.yappyEnabled && (!merchantId || !domain || !tieneSecretGuardada)) {
            return {
                success: false,
                message: 'Completa el ID de comercio, el dominio y la clave secreta antes de habilitar el cobro real con Yappy.'
            };
        }

        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                yappyMerchantId: merchantId,
                yappyDomain: domain,
                yappyAmbiente: data.yappyAmbiente === 'produccion' ? 'produccion' : 'pruebas',
                yappyEnabled: data.yappyEnabled,
                ...(secretCifrada !== undefined ? { yappySecretKey: secretCifrada } : {})
            }
        });

        revalidatePath('/settings');
        return { success: true, message: 'Configuración de Yappy guardada correctamente.' };
    } catch (error) {
        console.error('Error updating Yappy settings:', error);
        return { success: false, message: 'Error al guardar la configuración de Yappy.' };
    }
}
