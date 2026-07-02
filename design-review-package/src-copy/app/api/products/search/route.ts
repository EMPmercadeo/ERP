import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { empresaId } = await getTenantContext();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        const products = await prisma.producto.findMany({
            where: {
                empresaId,
                activo: true,
                OR: [
                    { descripcion: { contains: query, mode: 'insensitive' } },
                    { codigoInterno: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                descripcion: true,
                codigoInterno: true,
                stockActual: true
            },
            take: 10
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('API error in /api/products/search:', error);
        return NextResponse.json({ error: 'Error al buscar productos.' }, { status: 500 });
    }
}
