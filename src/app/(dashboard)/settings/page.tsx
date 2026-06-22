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
    } catch (err) {
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
    try {
        // Get current calendar month start
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
    } catch (err) {
        console.error('[SettingsPage] prisma.factura.count failed:', err);
        // Non-critical - continue with 0
        invoicesCount = 0;
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
            userRole={role} 
        />
    );
}
