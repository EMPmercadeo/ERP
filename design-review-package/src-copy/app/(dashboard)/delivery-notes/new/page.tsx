import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { DeliveryNoteForm } from '@/components/delivery-notes/DeliveryNoteForm';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function NewDeliveryNotePage() {
    const { empresaId } = await getTenantContext();

    const [clients, products, quotes, users] = await Promise.all([
        prisma.cliente.findMany({
            where: { empresaId, estado: 'activo' },
            select: { id: true, razonSocial: true, ruc: true }
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { id: true, codigoInterno: true, descripcion: true, precioVenta: true, codigoTasaItbms: true }
        }),
        prisma.cotizacion.findMany({
            where: { 
                empresaId, 
                estado: { in: ['aceptada', 'enviada'] } 
            },
            select: { 
                id: true, 
                numero: true, 
                clienteId: true,
                items: {
                    select: {
                        productoId: true,
                        descripcion: true,
                        cantidad: true,
                        precioUnitario: true,
                        codigoTasaItbms: true,
                        descuento: true
                    }
                }
            }
        }),
        prisma.usuario.findMany({
            where: { empresaId, activo: true },
            select: { id: true, nombre: true }
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

    const formattedQuotes = quotes.map(q => ({
        id: q.id,
        numero: q.numero,
        clienteId: q.clienteId,
        items: q.items.map(item => ({
            productoId: item.productoId,
            descripcion: item.descripcion,
            cantidad: item.cantidad.toNumber(),
            precioUnitario: item.precioUnitario.toNumber(),
            codigoTasaItbms: item.codigoTasaItbms,
            descuento: item.descuento.toNumber()
        }))
    }));

    const formattedUsers = users.map(u => ({
        id: u.id,
        nombre: u.nombre
    }));

    return (
        <>
            <Topbar title="Nueva Nota de Entrega" />
            <DeliveryNoteForm 
                clients={formattedClients} 
                products={formattedProducts} 
                quotes={formattedQuotes}
                users={formattedUsers}
                companyId={empresaId}
            />
        </>
    );
}
