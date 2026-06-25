'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';

async function getOrInitializeUsage(companyId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Try to find existing usage
    let usage = await prisma.documentUsage.findUnique({
        where: {
            empresaId_month_year: {
                empresaId: companyId,
                month,
                year
            }
        }
    });

    if (usage) {
        return usage;
    }

    // If not found, look up the company's plan
    const company = await prisma.empresa.findUnique({
        where: { id: companyId },
        include: {
            subscription: {
                include: {
                    plan: true
                }
            }
        }
    });

    if (!company) {
        throw new Error('Empresa no encontrada');
    }

    // Get limit from subscription plan, or fall back to company.planType slugs
    let limit = 10; // Default Free limit
    if (company.subscription?.plan) {
        limit = company.subscription.plan.includedDocuments;
    } else {
        // Fallback mapping in case subscription record doesn't exist
        const planLimits: Record<string, number> = {
            free: 10,
            emprendedor: 150,
            negocio: 300,
            pro: 600,
            empresa: 1000
        };
        limit = planLimits[company.planType] || 10;
    }

    // Create new monthly usage record
    usage = await prisma.documentUsage.create({
        data: {
            empresaId: companyId,
            month,
            year,
            includedLimit: limit,
            usedDocuments: 0,
            extraDocumentsPurchased: 0,
            remainingDocuments: limit
        }
    });

    return usage;
}

export async function canCreateInvoice(companyId: string): Promise<boolean> {
    const usage = await getOrInitializeUsage(companyId);
    return usage.usedDocuments < (usage.includedLimit + usage.extraDocumentsPurchased);
}

export async function canCreateCreditNote(companyId: string): Promise<boolean> {
    const usage = await getOrInitializeUsage(companyId);
    return usage.usedDocuments < (usage.includedLimit + usage.extraDocumentsPurchased);
}

export async function canCreateDebitNote(companyId: string): Promise<boolean> {
    const usage = await getOrInitializeUsage(companyId);
    return usage.usedDocuments < (usage.includedLimit + usage.extraDocumentsPurchased);
}

export async function canAddUser(companyId: string): Promise<boolean> {
    const company = await prisma.empresa.findUnique({
        where: { id: companyId },
        include: {
            subscription: {
                include: {
                    plan: true
                }
            }
        }
    });
    if (!company) return false;

    let maxUsers = 1;
    if (company.subscription?.plan) {
        maxUsers = company.subscription.plan.maxUsers;
    } else {
        const planMaxUsers: Record<string, number> = {
            free: 1,
            emprendedor: 1,
            negocio: 2,
            pro: 5,
            empresa: 10
        };
        maxUsers = planMaxUsers[company.planType] || 1;
    }

    const userCount = await prisma.usuario.count({
        where: { empresaId: companyId }
    });

    return userCount < maxUsers;
}

export async function canUsePOSIntegration(companyId: string): Promise<boolean> {
    const company = await prisma.empresa.findUnique({
        where: { id: companyId }
    });
    if (!company) return false;
    return company.planType !== 'free' && company.planType !== 'emprendedor';
}

export async function canUploadProductImage(companyId: string): Promise<boolean> {
    return true; // Images are a standard feature in all plans
}

export async function incrementDocumentUsage(companyId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const usage = await getOrInitializeUsage(companyId);

    const nextUsed = usage.usedDocuments + 1;
    const nextRemaining = Math.max(0, (usage.includedLimit + usage.extraDocumentsPurchased) - nextUsed);

    await prisma.documentUsage.update({
        where: { id: usage.id },
        data: {
            usedDocuments: nextUsed,
            remainingDocuments: nextRemaining
        }
    });
}

export async function purchaseDocumentBlock(companyId: string, blockSize: number) {
    try {
        const usage = await getOrInitializeUsage(companyId);

        const nextExtra = usage.extraDocumentsPurchased + blockSize;
        const nextRemaining = (usage.includedLimit + nextExtra) - usage.usedDocuments;

        await prisma.documentUsage.update({
            where: { id: usage.id },
            data: {
                extraDocumentsPurchased: nextExtra,
                remainingDocuments: nextRemaining
            }
        });

        // Audit log
        const company = await prisma.empresa.findUnique({
            where: { id: companyId },
            include: { usuarios: { where: { rol: { in: ['admin', 'super_admin'] } } } }
        });
        const userId = company?.usuarios[0]?.id || 'system-billing';

        await prisma.auditoria.create({
            data: {
                usuarioId: userId,
                entidad: 'Empresa',
                entidadId: companyId,
                accion: 'editar',
                datosDespues: {
                    action: 'purchase_block',
                    blockSize,
                    totalExtra: nextExtra
                }
            }
        });

        revalidatePath('/settings');
        return { success: true, message: `Compra exitosa de bloque de ${blockSize} documentos.` };
    } catch (error) {
        console.error('Purchase document block error:', error);
        return { success: false, message: 'Ocurrió un error al procesar el pago del bloque de documentos.' };
    }
}

export async function getDocumentUsage(companyId: string) {
    return await getOrInitializeUsage(companyId);
}
