import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ClientList } from '@/components/clients/ClientList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function ClientsPage(props: {
    searchParams: Promise<{
        page?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = (searchParams.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const limit = Number(searchParams.limit) || 20;
    const skip = (page - 1) * limit;

    const where = search ? {
        empresaId,
        OR: [
            { razonSocial: { contains: search, mode: 'insensitive' as const } },
            { ruc: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
        ]
    } : { empresaId };

    const validSortFields = ['razonSocial', 'saldoPendiente', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [clients, totalCount] = await Promise.all([
        prisma.cliente.findMany({
            where,
            orderBy: { [orderByField]: sortOrder },
            skip,
            take: limit
        }),
        prisma.cliente.count({ where })
    ]);

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

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Clientes" />
            <ClientList 
                initialData={formattedClients}
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
                initialSortBy={sortBy}
                initialSortOrder={sortOrder}
            />
        </>
    );
}
