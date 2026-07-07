import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Topbar } from '@/components/layout/Topbar';
import { OrderList } from '@/components/orders/OrderList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        limit?: string;
    }>;
}

export default async function OrdersPage(props: PageProps) {
    const { empresaId } = await getTenantContext();
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.PedidoVentaWhereInput = {
        empresaId
    };

    if (search) {
        where.OR = [
            { numero: { contains: search, mode: 'insensitive' } },
            { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
            { cliente: { ruc: { contains: search, mode: 'insensitive' } } }
        ];
    }

    const [orders, totalCount] = await Promise.all([
        prisma.pedidoVenta.findMany({
            where,
            skip,
            take: limit,
            include: {
                cliente: {
                    select: {
                        razonSocial: true,
                        ruc: true,
                    }
                }
            },
            orderBy: { fechaEmision: 'desc' }
        }),
        prisma.pedidoVenta.count({ where })
    ]);

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

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Pedidos de Venta" />
            <OrderList 
                initialData={formattedOrders}
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
            />
        </>
    );
}
