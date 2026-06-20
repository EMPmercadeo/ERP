import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { QuotesList } from '@/components/quotes/QuotesList';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
    const rawQuotes = await prisma.cotizacion.findMany({
        include: {
            cliente: {
                select: { razonSocial: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50 // Limit to 50 for performance
    });

    // Serialize data for client component
    const quotes = rawQuotes.map(quote => ({
        id: quote.id,
        numero: quote.numero,
        cliente: quote.cliente,
        fechaEmision: quote.fechaEmision.toISOString(),
        totalNeto: Number(quote.totalNeto),
        estado: quote.estado
    }));

    return (
        <>
            <Topbar title="Cotizaciones" />
            <QuotesList quotes={quotes} />
        </>
    );
}
