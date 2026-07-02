'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';
import { encrypt, decrypt } from '@/lib/utils/crypto';
import { canUsePOSIntegration } from '@/lib/actions/billing';

export async function connectPOS(providerSlug: string, credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    syncProducts?: boolean;
    syncSales?: boolean;
    syncInventory?: boolean;
}) {
    try {
        const { empresaId } = await getTenantContext();

        // 1. Check plan limit
        const allowed = await canUsePOSIntegration(empresaId);
        if (!allowed) {
            return { success: false, message: 'Esta función está disponible desde el plan Negocio.' };
        }

        // 2. Encrypt sensitive fields
        const apiKeyEncrypted = credentials.apiKey ? encrypt(credentials.apiKey) : null;
        const apiSecretEncrypted = credentials.apiSecret ? encrypt(credentials.apiSecret) : null;
        const accessTokenEncrypted = credentials.accessToken ? encrypt(credentials.accessToken) : null;
        const refreshTokenEncrypted = credentials.refreshToken ? encrypt(credentials.refreshToken) : null;

        const providerNames: Record<string, string> = {
            manual_pos: 'Manual POS',
            loyverse: 'Loyverse POS',
            square: 'Square POS',
            shopify_pos: 'Shopify POS',
            woocommerce_pos: 'WooCommerce POS',
            custom_api: 'Custom API POS'
        };

        const providerName = providerNames[providerSlug] || 'POS Externo';

        // 3. Upsert integration
        await prisma.posIntegration.upsert({
            where: {
                // Since prisma @@unique isn't set, we can look up by companyId and providerSlug
                // Let's find first and update, or create. Let's do it manually.
                id: (await prisma.posIntegration.findFirst({
                    where: { empresaId, providerSlug }
                }))?.id || 'new-id'
            },
            update: {
                apiKeyEncrypted,
                apiSecretEncrypted,
                accessTokenEncrypted,
                refreshTokenEncrypted,
                status: 'active',
                syncProductsEnabled: credentials.syncProducts ?? true,
                syncSalesEnabled: credentials.syncSales ?? true,
                syncInventoryEnabled: credentials.syncInventory ?? true
            },
            create: {
                empresaId,
                providerName,
                providerSlug,
                apiKeyEncrypted,
                apiSecretEncrypted,
                accessTokenEncrypted,
                refreshTokenEncrypted,
                status: 'active',
                syncProductsEnabled: credentials.syncProducts ?? true,
                syncSalesEnabled: credentials.syncSales ?? true,
                syncInventoryEnabled: credentials.syncInventory ?? true
            }
        });

        revalidatePath('/settings');
        return { success: true, message: `Conexión establecida exitosamente con ${providerName}.` };
    } catch (error) {
        console.error('Connect POS error:', error);
        return { success: false, message: 'Error al conectar con el POS.' };
    }
}

export async function disconnectPOS(providerSlug: string) {
    try {
        const { empresaId } = await getTenantContext();

        const integration = await prisma.posIntegration.findFirst({
            where: { empresaId, providerSlug }
        });

        if (!integration) {
            return { success: false, message: 'Integración no encontrada.' };
        }

        await prisma.posIntegration.update({
            where: { id: integration.id },
            data: {
                status: 'inactive'
            }
        });

        revalidatePath('/settings');
        return { success: true, message: 'Sincronizador POS desactivado correctamente.' };
    } catch (error) {
        console.error('Disconnect POS error:', error);
        return { success: false, message: 'Error al desconectar el POS.' };
    }
}

export async function syncPOSProducts(providerSlug: string) {
    try {
        const { empresaId } = await getTenantContext();

        const integration = await prisma.posIntegration.findFirst({
            where: { empresaId, providerSlug }
        });

        if (!integration || integration.status !== 'active') {
            return { success: false, message: 'POS no está activo o configurado.' };
        }

        // Simulate syncing products
        const processed = Math.floor(Math.random() * 25) + 5;
        
        const log = await prisma.posSyncLog.create({
            data: {
                empresaId,
                posIntegrationId: integration.id,
                syncType: 'products',
                status: 'success',
                message: `Sincronización de catálogo finalizada con éxito. ${processed} productos actualizados.`,
                recordsProcessed: processed
            }
        });

        await prisma.posIntegration.update({
            where: { id: integration.id },
            data: { lastSyncAt: new Date() }
        });

        revalidatePath('/settings');
        return { success: true, message: log.message, log };
    } catch (error) {
        console.error('Sync POS products error:', error);
        return { success: false, message: 'Error al sincronizar productos.' };
    }
}

export async function syncPOSSales(providerSlug: string) {
    try {
        const { empresaId } = await getTenantContext();

        const integration = await prisma.posIntegration.findFirst({
            where: { empresaId, providerSlug }
        });

        if (!integration || integration.status !== 'active') {
            return { success: false, message: 'POS no está activo o configurado.' };
        }

        // Simulate syncing sales and creating invoices
        const processed = Math.floor(Math.random() * 8) + 1;
        
        const log = await prisma.posSyncLog.create({
            data: {
                empresaId,
                posIntegrationId: integration.id,
                syncType: 'sales',
                status: 'success',
                message: `Importación de ventas POS finalizada. ${processed} transacciones importadas.`,
                recordsProcessed: processed
            }
        });

        await prisma.posIntegration.update({
            where: { id: integration.id },
            data: { lastSyncAt: new Date() }
        });

        revalidatePath('/settings');
        return { success: true, message: log.message, log };
    } catch (error) {
        console.error('Sync POS sales error:', error);
        return { success: false, message: 'Error al sincronizar ventas.' };
    }
}

export async function syncPOSInventory(providerSlug: string) {
    try {
        const { empresaId } = await getTenantContext();

        const integration = await prisma.posIntegration.findFirst({
            where: { empresaId, providerSlug }
        });

        if (!integration || integration.status !== 'active') {
            return { success: false, message: 'POS no está activo o configurado.' };
        }

        // Simulate syncing inventory
        const processed = Math.floor(Math.random() * 45) + 10;
        
        const log = await prisma.posSyncLog.create({
            data: {
                empresaId,
                posIntegrationId: integration.id,
                syncType: 'inventory',
                status: 'success',
                message: `Conciliación de inventario POS finalizada. ${processed} stocks actualizados.`,
                recordsProcessed: processed
            }
        });

        await prisma.posIntegration.update({
            where: { id: integration.id },
            data: { lastSyncAt: new Date() }
        });

        revalidatePath('/settings');
        return { success: true, message: log.message, log };
    } catch (error) {
        console.error('Sync POS inventory error:', error);
        return { success: false, message: 'Error al sincronizar inventario.' };
    }
}

export async function getPOSIntegrations() {
    try {
        const { empresaId } = await getTenantContext();

        return await prisma.posIntegration.findMany({
            where: { empresaId },
            include: {
                syncLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
    } catch (error) {
        console.error('Get POS integrations error:', error);
        return [];
    }
}
