import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { empresaId } = await getTenantContext();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        const customers = await prisma.cliente.findMany({
            where: {
                empresaId,
                OR: [
                    { razonSocial: { contains: query, mode: 'insensitive' } },
                    { ruc: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                razonSocial: true,
                ruc: true,
                dv: true,
                email: true
            },
            take: 10
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('API error in /api/customers/search:', error);
        return NextResponse.json({ error: 'Error al buscar clientes.' }, { status: 500 });
    }
}
