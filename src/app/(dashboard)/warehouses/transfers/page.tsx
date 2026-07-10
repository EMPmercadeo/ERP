import { Topbar } from '@/components/layout/Topbar';
import { TransferList } from '@/components/warehouses/TransferList';
import { getTenantContext } from '@/lib/auth/context';
import { puedeVerRuta } from '@/lib/permissions';
import { getTransferencias } from '@/lib/actions/transferencias';
import { getBodegas } from '@/lib/actions/bodegas';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function WarehouseTransfersPage() {
    const { role } = await getTenantContext();
    if (!puedeVerRuta(role, '/warehouses/transfers')) redirect('/dashboard');

    const [transferencias, bodegas] = await Promise.all([
        getTransferencias(),
        getBodegas(),
    ]);

    const formattedTransferencias = transferencias.map((t) => ({
        id: t.id,
        numero: t.numero,
        estado: t.estado,
        bodegaOrigenNombre: `${t.bodegaOrigen.codigo} - ${t.bodegaOrigen.nombre}`,
        bodegaDestinoNombre: `${t.bodegaDestino.codigo} - ${t.bodegaDestino.nombre}`,
        creadorNombre: t.creador.nombre,
        receptorNombre: t.receptor?.nombre ?? null,
        fechaEnvio: t.fechaEnvio.toISOString(),
        fechaRecepcion: t.fechaRecepcion ? t.fechaRecepcion.toISOString() : null,
        notas: t.notas,
        items: t.items.map((i) => ({
            descripcion: i.producto.descripcion,
            cantidad: i.cantidad,
        })),
    }));

    const formattedBodegas = bodegas
        .filter((b) => b.activa)
        .map((b) => ({
            id: b.id,
            codigo: b.codigo,
            nombre: b.nombre,
        }));

    return (
        <>
            <Topbar title="Transferencias entre Bodegas" />
            <TransferList initialData={formattedTransferencias} bodegas={formattedBodegas} />
        </>
    );
}
