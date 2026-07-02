import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { ContentContainer } from '@/components/layout/Content';
import { AdminBillingClient } from './AdminBillingClient';

export const dynamic = 'force-dynamic';

export default async function AdminBillingPage() {
    let empresaId: string | undefined;

    try {
        const ctx = await getTenantContext();
        empresaId = ctx.empresaId;
    } catch (err: any) {
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error('[AdminBillingPage] getTenantContext failed:', err);
        // Re-throw to let the error boundary handle it with a nice UI
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
    let invoicesCount = 0;

    try {
        empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: {
                id: true,
                razonSocial: true,
                planType: true,
                subscriptionStatus: true,
            }
        });
    } catch (err) {
        console.error('[AdminBillingPage] prisma.empresa.findUnique failed:', err);
        throw new Error('Error al conectar con la base de datos. Intente de nuevo en unos momentos.');
    }

    if (!empresa) {
        return (
            <ContentContainer className="py-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm max-w-2xl mx-auto my-12">
                    <h2 className="text-xl font-bold mb-2">Empresa no encontrada</h2>
                    <p className="text-sm mb-4">
                        No se pudo encontrar la empresa con ID <code className="bg-red-100 px-1 py-0.5 rounded">{empresaId}</code>.
                    </p>
                    <p className="text-sm">
                        Si es un super administrador impersonando a otra empresa, por favor finalice la impersonación o seleccione otra empresa válida desde el panel de control.
                    </p>
                </div>
            </ContentContainer>
        );
    }

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
        console.error('[AdminBillingPage] prisma.factura.count failed:', err);
        // Non-critical - continue with 0
        invoicesCount = 0;
    }

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
