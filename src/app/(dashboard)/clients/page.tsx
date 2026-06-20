import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ClientList } from '@/components/clients/ClientList';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    const clients = await prisma.cliente.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const formattedClients = clients.map(c => ({
        id: c.id,
        tipoRuc: c.tipoRuc,
        ruc: c.ruc,
        dv: c.dv,
        razonSocial: c.razonSocial,
        email: c.email,
        telefono: c.telefono,
        saldoPendiente: c.saldoPendiente.toNumber(),
        estado: c.estado
    }));

    return (
        <>
            <Topbar title="Clientes" />
            <ClientList initialData={formattedClients} />
        </>
    );
}
