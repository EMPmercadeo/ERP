import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { SettingsClient } from './SettingsClient';
import { ContentContainer } from '@/components/layout/Content';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const { empresaId, role } = await getTenantContext();

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

    const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId }
    });

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

    // Get current calendar month start
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const invoicesCount = await prisma.factura.count({
        where: {
            empresaId,
            fechaEmision: {
                gte: startOfMonth
            }
        }
    });

    // Pass a clean, serializable company object
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
        whatsappPhone: (empresa as any).whatsappPhone || '',
        whatsappToken: (empresa as any).whatsappToken || '',
        webhookUrl: (empresa as any).webhookUrl || '',
        webhookToken: (empresa as any).webhookToken || '',
    };

    return (
        <SettingsClient 
            initialCompany={companyData} 
            invoicesCount={invoicesCount} 
            userRole={role} 
        />
    );
}
