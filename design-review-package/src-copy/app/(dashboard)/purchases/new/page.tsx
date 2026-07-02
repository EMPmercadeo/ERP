import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { NewPurchaseForm } from '@/components/purchases/NewPurchaseForm';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function NewPurchasePage() {
    const { empresaId } = await getTenantContext();

    const [suppliers, products] = await Promise.all([
        prisma.proveedor.findMany({
            where: { empresaId, estado: 'activo' },
            select: { id: true, razonSocial: true, ruc: true },
            orderBy: { razonSocial: 'asc' }
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { id: true, descripcion: true, costoUnitario: true },
            orderBy: { descripcion: 'asc' }
        })
    ]);

    const formattedProducts = products.map(p => ({
        id: p.id,
        descripcion: p.descripcion,
        costoUnitario: Number(p.costoUnitario || 0)
    }));

    return (
        <>
            <Topbar title="Nueva Compra" />
            <NewPurchaseForm suppliers={suppliers} products={formattedProducts} />
        </>
    );
}
