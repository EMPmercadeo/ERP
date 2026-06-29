import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { OrderList } from '@/components/orders/OrderList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const { empresaId } = await getTenantContext();

    const orders = await prisma.pedidoVenta.findMany({
        where: { empresaId },
        include: {
            cliente: {
                select: {
                    razonSocial: true,
                    ruc: true,
                }
            }
        },
        orderBy: { fechaEmision: 'desc' }
    });

    const formattedOrders = orders.map(o => ({
        id: o.id,
        numero: o.numero,
        fechaEmision: o.fechaEmision.toISOString().split('T')[0],
        fechaEntrega: o.fechaEntrega ? o.fechaEntrega.toISOString().split('T')[0] : null,
        totalNeto: Number(o.totalNeto),
        estado: o.estado,
        observaciones: o.observaciones,
        cliente: {
            razonSocial: o.cliente.razonSocial,
            ruc: o.cliente.ruc
        }
    }));

    return (
        <>
            <Topbar title="Pedidos de Venta" />
            <OrderList initialData={formattedOrders} />
        </>
    );
}
