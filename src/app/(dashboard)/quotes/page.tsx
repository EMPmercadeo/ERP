import { Prisma } from '@prisma/client';
import { Topbar } from '@/components/layout/Topbar';
import { QuotesList } from '@/components/quotes/QuotesList';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function QuotesPage(props: {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const status = searchParams.status || 'all';
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = (searchParams.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const andConditions: Prisma.CotizacionWhereInput[] = [];

    if (status && status !== 'all') {
        andConditions.push({ estado: status });
    }

    if (search) {
        andConditions.push({
            OR: [
                { numero: { contains: search, mode: 'insensitive' } },
                { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } }
            ]
        });
    }

    const where: Prisma.CotizacionWhereInput = {
        empresaId,
        AND: andConditions
    };

    const validSortFields = ['numero', 'fechaEmision', 'totalNeto', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [rawQuotes, totalCount] = await Promise.all([
        prisma.cotizacion.findMany({
            where,
            orderBy: { [orderByField]: sortOrder },
            include: {
                cliente: {
                    select: {
                        razonSocial: true,
                        ruc: true,
                        dv: true
                    }
                }
            },
            skip,
            take: limit
        }),
        prisma.cotizacion.count({ where })
    ]);

    const quotes = rawQuotes.map(quote => ({
        id: quote.id,
        numero: quote.numero,
        cliente: quote.cliente,
        fechaEmision: quote.fechaEmision.toISOString(),
        totalNeto: Number(quote.totalNeto),
        estado: quote.estado
    }));

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Cotizaciones" />
            <QuotesList 
                quotes={quotes}
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
