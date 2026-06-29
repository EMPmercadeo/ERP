import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { PurchaseList } from '@/components/purchases/PurchaseList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
    const { empresaId } = await getTenantContext();

    const purchases = await prisma.compra.findMany({
        where: { empresaId },
        include: {
            proveedor: {
                select: {
                    razonSocial: true,
                    ruc: true,
                }
            }
        },
        orderBy: { fechaEmision: 'desc' }
    });

    const formattedPurchases = purchases.map(p => ({
        id: p.id,
        numeroFactura: p.numeroFactura,
        fechaEmision: p.fechaEmision.toISOString().split('T')[0],
        fechaVencimiento: p.fechaVencimiento.toISOString().split('T')[0],
        totalNeto: Number(p.totalNeto),
        saldoPendiente: Number(p.saldoPendiente),
        estadoPago: p.estadoPago,
        observaciones: p.observaciones,
        proveedorId: p.proveedorId,
        proveedor: {
            razonSocial: p.proveedor.razonSocial,
            ruc: p.proveedor.ruc
        }
    }));

    return (
        <>
            <Topbar title="Cuentas por Pagar" />
            <PurchaseList initialData={formattedPurchases} />
        </>
    );
}
