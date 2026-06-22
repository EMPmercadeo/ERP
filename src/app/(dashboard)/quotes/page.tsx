import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { QuotesList } from '@/components/quotes/QuotesList';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function QuotesPage(props: {
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
        where.AND.push({ estado: status });
    }

    if (search) {
        where.AND.push({
            OR: [
                { numero: { contains: search, mode: 'insensitive' as const } },
                { cliente: { razonSocial: { contains: search, mode: 'insensitive' as const } } }
            ]
        });
    }

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
