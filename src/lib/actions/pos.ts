'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';
import { encrypt } from '@/lib/utils/crypto';
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
        // Antes decía "Conexión establecida exitosamente" sin haber verificado nada real
        // contra el proveedor — cualquier credencial, válida o inventada, mostraba éxito.
        // Todavía no existe un adaptador real por proveedor que valide las credenciales
        // aquí (ver syncPOSProducts/Sales/Inventory más abajo), así que el mensaje ahora
        // es honesto sobre lo que de verdad pasó: se guardaron las credenciales, pero la
        // sincronización real con ${providerName} está pendiente de implementación.
        return {
            success: true,
            message: `Credenciales de ${providerName} guardadas. La sincronización real con este proveedor todavía no está implementada — por ahora no se van a traer datos automáticamente.`
        };
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

// Las tres funciones de sincronización de abajo (productos, ventas, inventario) antes
// fabricaban un número aleatorio de "registros procesados" con Math.random() y siempre
// guardaban status: 'success' — sin llamar nunca a la API real de Loyverse, Square,
// WooCommerce o Shopify. Un dueño de negocio podía ver "37 productos actualizados" en el
// log sin que un solo dato real se hubiera movido. Ahora responden honestamente que la
// sincronización real todavía no está implementada para ningún proveedor, y lo dejan
// registrado como tal en PosSyncLog (status: 'not_implemented') en vez de simular éxito.
//
// Para implementar la sincronización real de un proveedor específico (p. ej. Shopify o
// WooCommerce, que tienen APIs REST públicas y bien documentadas) hace falta además:
// 1. Agregar el campo de dominio/URL de tienda al formulario de conexión (hoy solo se
//    piden apiKey/apiSecret/accessToken, insuficiente para Shopify/WooCommerce/Square).
// 2. Implementar el cliente HTTP real por proveedor y el mapeo de su esquema de
//    productos/ventas/inventario al modelo interno (Producto, Venta, MovimientoInventario).
// 3. Probarlo contra una cuenta de prueba real de ese proveedor.

async function logSyncNotImplemented(
    empresaId: string,
    integrationId: string,
    providerName: string,
    syncType: 'products' | 'sales' | 'inventory',
    accionLabel: string
) {
    const message = `La sincronización real de ${accionLabel} con ${providerName} todavía no está implementada. No se procesó ningún dato.`;
    const log = await prisma.posSyncLog.create({
        data: {
            empresaId,
            posIntegrationId: integrationId,
            syncType,
            status: 'not_implemented',
            message,
            recordsProcessed: 0
        }
    });
    return { success: false, message, log };
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

        return await logSyncNotImplemented(empresaId, integration.id, integration.providerName, 'products', 'catálogo de productos');
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

        return await logSyncNotImplemented(empresaId, integration.id, integration.providerName, 'sales', 'ventas');
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

        return await logSyncNotImplemented(empresaId, integration.id, integration.providerName, 'inventory', 'inventario');
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
