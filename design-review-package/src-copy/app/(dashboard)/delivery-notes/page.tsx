import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { DeliveryNoteList } from '@/components/delivery-notes/DeliveryNoteList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function DeliveryNotesPage() {
    const { empresaId } = await getTenantContext();

    const notes = await prisma.albaranVenta.findMany({
        where: { empresaId },
        include: {
            cliente: {
                select: {
                    razonSocial: true,
                    ruc: true,
                }
            },
            factura: {
                select: {
                    id: true,
                    numeroCompleto: true,
                }
            },
            items: {
                select: {
                    id: true,
                    descripcion: true,
                    cantidad: true,
                }
            }
        },
        orderBy: { fechaEmision: 'desc' }
    });

    const formattedNotes = notes.map(n => {
        const fechaEntrega = n.fechaRealEntrega 
            ? n.fechaRealEntrega.toISOString().split('T')[0]
            : n.fechaEstimadaEntrega 
                ? n.fechaEstimadaEntrega.toISOString().split('T')[0]
                : 'Pendiente';

        return {
            id: n.id,
            numero: n.numero || 'N/A',
            fechaEmision: n.fechaEmision ? n.fechaEmision.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            fechaEntrega,
            totalNeto: n.totalNeto ? Number(n.totalNeto) : 0,
            estado: n.estado || 'pendiente',
            observaciones: n.observaciones || '',
            clienteId: n.clienteId,
            cliente: {
                razonSocial: n.cliente?.razonSocial || 'Cliente Desconocido',
                ruc: n.cliente?.ruc || 'N/A'
            },
            factura: n.factura ? {
                id: n.factura.id,
                numero: n.factura.numeroCompleto
            } : null,
            itemsCount: n.items?.length || 0,
            itemsSummary: n.items && n.items.length > 0 
                ? n.items.map(i => `${Number(i.cantidad || 0)}x ${i.descripcion || ''}`).join(', ')
                : 'Sin ítems'
        };
    });

    return (
        <>
            <Topbar title="Notas de Entrega" />
            <DeliveryNoteList initialData={formattedNotes} />
        </>
    );
}
