import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { SupplierList } from '@/components/suppliers/SupplierList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
    const { empresaId } = await getTenantContext();

    const suppliers = await prisma.proveedor.findMany({
        where: { empresaId },
        orderBy: { razonSocial: 'asc' }
    });

    const formattedSuppliers = suppliers.map(s => ({
        id: s.id,
        tipoRuc: s.tipoRuc,
        ruc: s.ruc,
        dv: s.dv,
        razonSocial: s.razonSocial,
        nombreComercial: s.nombreComercial,
        email: s.email,
        telefono: s.telefono,
        saldoPendiente: Number(s.saldoPendiente),
        condicionPago: s.condicionPago,
        estado: s.estado
    }));

    return (
        <>
            <Topbar title="Proveedores" />
            <SupplierList initialData={formattedSuppliers} />
        </>
    );
}
