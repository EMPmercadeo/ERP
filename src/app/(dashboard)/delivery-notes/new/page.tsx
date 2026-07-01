import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { DeliveryNoteForm } from '@/components/delivery-notes/DeliveryNoteForm';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function NewDeliveryNotePage() {
    const { empresaId } = await getTenantContext();

    const [clients, products] = await Promise.all([
        prisma.cliente.findMany({
            where: { empresaId, estado: 'activo' },
            select: { id: true, razonSocial: true, ruc: true }
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { id: true, codigoInterno: true, descripcion: true, precioVenta: true, codigoTasaItbms: true }
        })
    ]);

    const formattedClients = clients.map(c => ({
        id: c.id,
        razonSocial: c.razonSocial,
        ruc: c.ruc
    }));

    const formattedProducts = products.map(p => ({
        id: p.id,
        codigo: p.codigoInterno,
        descripcion: p.descripcion,
        precio: p.precioVenta.toNumber(),
        itbms: p.codigoTasaItbms
    }));

    return (
        <>
            <Topbar title="Nuevo Albarán" />
            <DeliveryNoteForm 
                clients={formattedClients} 
                products={formattedProducts} 
                companyId={empresaId}
            />
        </>
    );
}
