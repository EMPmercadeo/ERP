import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { ContentContainer } from '@/components/layout/Content';
import { AdminBillingClient } from './AdminBillingClient';

export const dynamic = 'force-dynamic';

export default async function AdminBillingPage() {
    const { empresaId } = await getTenantContext();

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
        planType: empresa.planType,
        subscriptionStatus: empresa.subscriptionStatus,
    };

    return (
        <ContentContainer className="py-8">
            <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planes y Facturación</h1>
                    <p className="text-muted-foreground">Gestiona la suscripción de tu cuenta y los límites de consumo fiscal</p>
                </div>
            </div>

            <AdminBillingClient 
                company={companyData} 
                invoicesCount={invoicesCount} 
            />
        </ContentContainer>
    );
}
