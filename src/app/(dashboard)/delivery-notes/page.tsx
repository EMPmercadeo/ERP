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
            }
        },
        orderBy: { fechaEmision: 'desc' }
    });

    const formattedNotes = notes.map(n => ({
        id: n.id,
        numero: n.numero,
        fechaEmision: n.fechaEmision ? n.fechaEmision.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        totalNeto: n.totalNeto ? Number(n.totalNeto) : 0,
        estado: n.estado || 'pendiente',
        observaciones: n.observaciones || '',
        clienteId: n.clienteId,
        cliente: {
            razonSocial: n.cliente?.razonSocial || 'Cliente Desconocido',
            ruc: n.cliente?.ruc || 'N/A'
        }
    }));

    return (
        <>
            <Topbar title="Notas de Entrega" />
            <DeliveryNoteList initialData={formattedNotes} />
        </>
    );
}
