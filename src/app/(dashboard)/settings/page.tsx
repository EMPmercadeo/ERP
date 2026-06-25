import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { SettingsClient } from './SettingsClient';
import { ContentContainer } from '@/components/layout/Content';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    let empresaId: string | undefined;
    let role: string = '';

    try {
        const ctx = await getTenantContext();
        empresaId = ctx.empresaId;
        role = ctx.role;
    } catch (err: any) {
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error('[SettingsPage] getTenantContext failed:', err);
        throw new Error('No se pudo verificar la sesión del usuario. Intente iniciar sesión de nuevo.');
    }

    if (!empresaId) {
        return (
            <ContentContainer className="py-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm max-w-2xl mx-auto my-12">
                    <h2 className="text-xl font-bold mb-2">Identificador de Empresa Inválido</h2>
                    <p className="text-sm">
                        No se ha podido determinar el identificador de la empresa activa para su sesión. Por favor, intente iniciar sesión de nuevo.
                    </p>
                </div>
            </ContentContainer>
        );
    }

    let empresa;
    try {
        empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: {
                id: true,
                razonSocial: true,
                ruc: true,
                dv: true,
                direccion: true,
                ambienteDgi: true,
                certificadoDgi: true,
                usuarioPac: true,
                passwordPac: true,
                planType: true,
                fiscalEnabled: true,
                subscriptionStatus: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    } catch (err) {
        console.error('[SettingsPage] prisma.empresa.findUnique failed:', err);
        throw new Error('Error al conectar con la base de datos. Intente de nuevo en unos momentos.');
    }

    if (!empresa) {
        return (
            <ContentContainer className="py-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm max-w-2xl mx-auto my-12">
                    <h2 className="text-xl font-bold mb-2">Empresa no encontrada</h2>
                    <p className="text-sm mb-4">
                        No se pudo encontrar la empresa con ID <code className="bg-red-100 px-1 py-0.5 rounded">{empresaId}</code> asociada a su sesión.
                    </p>
                    <p className="text-sm">
                        Por favor, intente iniciar sesión de nuevo o contacte a soporte para verificar el estado de su cuenta.
                    </p>
                </div>
            </ContentContainer>
        );
    }

    let invoicesCount = 0;
    let documentUsage = {
        usedDocuments: 0,
        includedLimit: 10,
        extraDocumentsPurchased: 0,
        remainingDocuments: 10
    };

    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        invoicesCount = await prisma.factura.count({
            where: {
                empresaId,
                fechaEmision: {
                    gte: startOfMonth
                }
            }
        });

        const dbUsage = await prisma.documentUsage.findFirst({
            where: {
                empresaId,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            }
        });

        if (dbUsage) {
            documentUsage = {
                usedDocuments: dbUsage.usedDocuments,
                includedLimit: dbUsage.includedLimit,
                extraDocumentsPurchased: dbUsage.extraDocumentsPurchased,
                remainingDocuments: dbUsage.remainingDocuments
            };
        } else {
            // Fallback limits mapping
            const planLimits: Record<string, number> = {
                free: 10,
                emprendedor: 150,
                negocio: 300,
                pro: 600,
                empresa: 1000
            };
            const limit = planLimits[empresa.planType] || 10;
            documentUsage = {
                usedDocuments: invoicesCount,
                includedLimit: limit,
                extraDocumentsPurchased: 0,
                remainingDocuments: Math.max(0, limit - invoicesCount)
            };
        }
    } catch (err) {
        console.error('[SettingsPage] prisma queries failed:', err);
    }

    // Pass a clean, serializable company object
    // whatsapp/webhook columns don't exist in production DB yet (migration pending)
    // so we default them to empty strings
    const companyData = {
        id: empresa.id,
        razonSocial: empresa.razonSocial,
        ruc: empresa.ruc,
        dv: empresa.dv,
        direccion: empresa.direccion,
        ambienteDgi: empresa.ambienteDgi,
        certificadoDgi: empresa.certificadoDgi,
        usuarioPac: empresa.usuarioPac || '',
        passwordPac: empresa.passwordPac || '',
        planType: empresa.planType,
        fiscalEnabled: empresa.fiscalEnabled,
        subscriptionStatus: empresa.subscriptionStatus,
        createdAt: empresa.createdAt.toISOString(),
        updatedAt: empresa.updatedAt.toISOString(),
        whatsappPhone: '',
        whatsappToken: '',
        webhookUrl: '',
        webhookToken: '',
    };

    return (
        <SettingsClient 
            initialCompany={companyData} 
            invoicesCount={invoicesCount} 
            initialDocumentUsage={documentUsage}
            userRole={role} 
        />
    );
}
