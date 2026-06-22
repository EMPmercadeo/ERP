import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { InvoiceList } from '@/components/invoices/InvoiceList';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage(props: {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const status = searchParams.status || 'all';
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = (searchParams.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = {
        AND: []
    };

    if (status && status !== 'all') {
        where.AND.push({ estadoDgi: status });
    }

    if (search) {
        where.AND.push({
            OR: [
                { numeroCompleto: { contains: search, mode: 'insensitive' as const } },
                { cliente: { razonSocial: { contains: search, mode: 'insensitive' as const } } },
                { cliente: { ruc: { contains: search, mode: 'insensitive' as const } } },
            ]
        });
    }

    const validSortFields = ['numeroCompleto', 'fechaEmision', 'totalNeto', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [invoices, totalCount] = await Promise.all([
        prisma.factura.findMany({
            where,
            orderBy: { [orderByField]: sortOrder },
            include: { cliente: true },
            skip,
            take: limit,
        }),
        prisma.factura.count({ where })
    ]);

    const formattedInvoices = invoices.map(i => ({
        id: i.id,
        numeroCompleto: i.numeroCompleto,
        clientName: i.cliente.razonSocial,
        clientRuc: i.cliente.ruc,
        fechaEmision: i.fechaEmision.toISOString(),
        fechaVencimiento: i.fechaVencimiento ? i.fechaVencimiento.toISOString() : null,
        totalNeto: i.totalNeto.toNumber(),
        saldoPendiente: i.saldoPendiente.toNumber(),
        estadoDgi: i.estadoDgi
    }));

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Facturas" />
            <InvoiceList 
                initialData={formattedInvoices} 
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
                initialStatus={status}
                initialSortBy={sortBy}
                initialSortOrder={sortOrder}
            />
        </>
    );
}
