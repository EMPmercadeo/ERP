import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Topbar } from '@/components/layout/Topbar';
import { PurchaseList } from '@/components/purchases/PurchaseList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        limit?: string;
    }>;
}

export default async function PurchasesPage(props: PageProps) {
    const { empresaId } = await getTenantContext();
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CompraWhereInput = {
        empresaId
    };

    if (search) {
        where.OR = [
            { numeroFactura: { contains: search, mode: 'insensitive' } },
            { proveedor: { razonSocial: { contains: search, mode: 'insensitive' } } },
            { proveedor: { ruc: { contains: search, mode: 'insensitive' } } }
        ];
    }

    const [purchases, totalCount] = await Promise.all([
        prisma.compra.findMany({
            where,
            skip,
            take: limit,
            include: {
                proveedor: {
                    select: {
                        razonSocial: true,
                        ruc: true,
                    }
                }
            },
            orderBy: { fechaEmision: 'desc' }
        }),
        prisma.compra.count({ where })
    ]);

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

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Cuentas por Pagar" />
            <PurchaseList 
                initialData={formattedPurchases}
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
            />
        </>
    );
}
