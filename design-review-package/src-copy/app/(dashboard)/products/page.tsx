import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ProductList } from '@/components/products/ProductList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: string;
        status?: string;
        tax?: string;
        stockStatus?: string;
        unidad?: string;
    }>;
}

export default async function ProductsPage(props: PageProps) {
    const tenant = await getTenantContext();
    const empresaId = tenant.empresaId;

    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = (searchParams.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);
    const status = searchParams.status || 'all';
    const tax = searchParams.tax || 'all';
    const stockStatus = searchParams.stockStatus || 'all';
    const unidad = searchParams.unidad || 'all';

    const skip = (page - 1) * limit;

    // Build the query constraints
    const where: any = {
        empresaId
    };

    if (search) {
        where.OR = [
            { codigoInterno: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
            { descripcionLarga: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (status === 'activo') {
        where.activo = true;
    } else if (status === 'inactivo') {
        where.activo = false;
    }

    if (tax && tax !== 'all') {
        where.codigoTasaItbms = tax;
    }

    if (stockStatus && stockStatus !== 'all') {
        if (stockStatus === 'con_stock') {
            where.stockActual = { gt: 0 };
        } else if (stockStatus === 'sin_stock') {
            where.stockActual = { lte: 0 };
        } else if (stockStatus === 'bajo_stock') {
            where.stockActual = { gt: 0, lt: 10 };
        }
    }

    if (unidad && unidad !== 'all') {
        where.unidadMedida = unidad;
    }

    const validSortFields = ['codigoInterno', 'descripcion', 'precioVenta', 'stockActual', 'activo', 'createdAt'];
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
        activo: p.activo,
        unidadMedida: p.unidadMedida,
        imagenUrl: p.imagenUrl
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
                initialStatus={status}
                initialTax={tax}
                initialStockStatus={stockStatus}
                initialUnidad={unidad}
            />
        </>
    );
}
