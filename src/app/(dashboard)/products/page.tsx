import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ProductList } from '@/components/products/ProductList';

export const dynamic = 'force-dynamic';

export default async function ProductsPage(props: {
    searchParams: Promise<{
        page?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = (searchParams.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = search ? {
        OR: [
            { codigoInterno: { contains: search, mode: 'insensitive' as const } },
            { descripcion: { contains: search, mode: 'insensitive' as const } },
        ]
    } : {};

    const validSortFields = ['codigoInterno', 'descripcion', 'precioVenta', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [products, totalCount] = await Promise.all([
        prisma.producto.findMany({
            where,
            orderBy: { [orderByField]: sortOrder },
            skip,
            take: limit
        }),
        prisma.producto.count({ where })
    ]);

    const formattedProducts = products.map(p => ({
        id: p.id,
        codigoInterno: p.codigoInterno,
        descripcion: p.descripcion,
        costoUnitario: p.costoUnitario.toNumber(),
        precioVenta: p.precioVenta.toNumber(),
        codigoTasaItbms: p.codigoTasaItbms,
        stockActual: p.stockActual,
        activo: p.activo
    }));

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Productos" />
            <ProductList 
                initialData={formattedProducts}
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
                initialSortBy={sortBy}
                initialSortOrder={sortOrder}
            />
        </>
    );
}
