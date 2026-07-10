import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { WarehouseList } from '@/components/warehouses/WarehouseList';
import { getTenantContext } from '@/lib/auth/context';
import { puedeVerRuta } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function WarehousesPage() {
    const { empresaId, role } = await getTenantContext();
    if (!puedeVerRuta(role, '/warehouses')) redirect('/dashboard');

    const [bodegas, sucursales] = await Promise.all([
        prisma.bodega.findMany({
            where: { empresaId },
            include: { sucursal: true },
            orderBy: { codigo: 'asc' },
        }),
        prisma.sucursal.findMany({
            where: { empresaId, activa: true },
            select: { id: true, codigo: true, nombre: true },
            orderBy: { nombre: 'asc' },
        })
    ]);

    const formattedBodegas = bodegas.map(b => ({
        id: b.id,
        codigo: b.codigo,
        nombre: b.nombre,
        sucursalId: b.sucursalId,
        sucursalNombre: `${b.sucursal.codigo} - ${b.sucursal.nombre}`,
        activa: b.activa,
    }));

    const formattedSucursales = sucursales.map(s => ({
        id: s.id,
        codigo: s.codigo,
        nombre: s.nombre,
    }));

    return (
        <>
            <Topbar title="Bodegas" />
            <WarehouseList initialData={formattedBodegas} sucursales={formattedSucursales} />
        </>
    );
}
