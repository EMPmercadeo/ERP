import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ReceivablesList } from '@/components/receivables/ReceivablesList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function ReceivablesPage(props: {
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
    const sortBy = searchParams.sortBy || 'fechaEmision';
    const sortOrder = (searchParams.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const andConditions: Prisma.FacturaWhereInput[] = [];

    if (search) {
        andConditions.push({
            OR: [
                { numeroCompleto: { contains: search, mode: 'insensitive' } },
                { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
                { cliente: { ruc: { contains: search, mode: 'insensitive' } } },
            ]
        });
    }

    const where: Prisma.FacturaWhereInput = {
        empresaId,
        saldoPendiente: { gt: 0 },
        AND: andConditions
    };

    const validSortFields = ['numeroCompleto', 'fechaEmision', 'totalNeto', 'saldoPendiente', 'fechaVencimiento'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'fechaEmision';

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
            <Topbar title="Cuentas por Cobrar" />
            <ReceivablesList 
                initialData={formattedInvoices} 
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
                initialSortBy={orderByField}
                initialSortOrder={sortOrder}
            />
        </>
    );
}
