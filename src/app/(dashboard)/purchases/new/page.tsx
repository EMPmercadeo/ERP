import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { NewPurchaseForm } from '@/components/purchases/NewPurchaseForm';
import { getTenantContext } from '@/lib/auth/context';
import { getBodegas } from '@/lib/actions/bodegas';

export const dynamic = 'force-dynamic';

export default async function NewPurchasePage() {
    const { empresaId } = await getTenantContext();

    const [suppliers, products, bodegas, presentaciones] = await Promise.all([
        prisma.proveedor.findMany({
            where: { empresaId, estado: 'activo' },
            select: { id: true, razonSocial: true, ruc: true },
            orderBy: { razonSocial: 'asc' }
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { id: true, descripcion: true, costoUnitario: true, unidadMedida: true },
            orderBy: { descripcion: 'asc' }
        }),
        getBodegas(),
        // Presentaciones de compra registradas (ProveedorInsumo). Se traen todas de una vez
        // porque son pocas por empresa y así el formulario puede convertir "2 paquetes de 100"
        // a 200 unidades sin ir al servidor en cada cambio de fila.
        prisma.proveedorInsumo.findMany({
            where: { empresaId, activo: true },
            select: {
                id: true,
                proveedorId: true,
                productoId: true,
                presentacion: true,
                unidadesPorPresentacion: true,
                precioPresentacion: true,
                esPreferido: true,
            },
            orderBy: [{ esPreferido: 'desc' }, { presentacion: 'asc' }]
        })
    ]);

    const formattedProducts = products.map(p => ({
        id: p.id,
        descripcion: p.descripcion,
        costoUnitario: Number(p.costoUnitario || 0),
        unidadMedida: p.unidadMedida
    }));

    const formattedPresentaciones = presentaciones.map(p => ({
        id: p.id,
        proveedorId: p.proveedorId,
        productoId: p.productoId,
        presentacion: p.presentacion,
        unidadesPorPresentacion: Number(p.unidadesPorPresentacion),
        precioPresentacion: Number(p.precioPresentacion),
        esPreferido: p.esPreferido
    }));

    return (
        <>
            <Topbar title="Nueva Compra" />
            <NewPurchaseForm
                suppliers={suppliers}
                products={formattedProducts}
                bodegas={bodegas}
                presentaciones={formattedPresentaciones}
            />
        </>
    );
}
