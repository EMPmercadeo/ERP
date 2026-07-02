import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { EditClientForm } from '@/components/clients/EditClientForm';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function EditClientPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const { empresaId } = await getTenantContext();

    const client = await prisma.cliente.findFirst({
        where: { id, empresaId }
    });

    if (!client) {
        notFound();
    }

    const formattedClient = {
        id: client.id,
        tipoRuc: client.tipoRuc,
        ruc: client.ruc,
        dv: client.dv || '',
        razonSocial: client.razonSocial,
        nombreComercial: client.nombreComercial || '',
        direccion: client.direccion || '',
        email: client.email || '',
        telefono: client.telefono || '',
        limiteCredito: client.limiteCredito.toNumber(),
        condicionPago: client.condicionPago,
    };

    return <EditClientForm client={formattedClient} />;
}
