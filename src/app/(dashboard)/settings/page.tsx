import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const { empresaId, role } = await getTenantContext();

    const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId }
    });

    if (!empresa) {
        throw new Error('Empresa no encontrada');
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
