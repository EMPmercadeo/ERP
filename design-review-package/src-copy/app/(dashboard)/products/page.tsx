import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ProductList } from '@/components/products/ProductList';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const products = await prisma.producto.findMany({
        orderBy: { createdAt: 'desc' }
    });

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

    return (
        <>
            <Topbar title="Productos" />
            <ProductList initialData={formattedProducts} />
        </>
    );
}
