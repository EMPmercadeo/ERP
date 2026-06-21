import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 10;

        // Security: Get companyId from session/auth (Mocked for now)
        // In a real scenario, this would come from getServerSession or similar
        // const companyId = "cm6s25dti000008l102cz361a"; // Mocked Default ID replaced below

        // Dynamic fetch for dev/demo purposes to match seed data
        const company = await prisma.empresa.findFirst();
        if (!company) {
            return NextResponse.json({ data: [] }); // No company in DB
        }
        const companyId = company.id;

        if (!query || query.length === 0) {
            // Default suggestions: 3 results ordered by razonSocial descending
            const clients = await prisma.cliente.findMany({
                where: {
                    empresaId: companyId,
                },
                orderBy: {
                    razonSocial: 'desc',
                },
                take: 3,
                select: {
                    id: true,
                    razonSocial: true,
                    ruc: true,
                    dv: true,
                    email: true,
                    telefono: true,
                    direccion: true,
                },
            });
            return NextResponse.json({ data: clients });
        }

        if (query.length < 2) {
            return NextResponse.json({ data: [] });
        }

        const clients = await prisma.cliente.findMany({
            where: {
                empresaId: companyId,
                OR: [
                    { razonSocial: { contains: query } },
                    { ruc: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            take: limit,
            select: {
                id: true,
                razonSocial: true,
                ruc: true,
                dv: true,
                email: true,
                telefono: true,
                direccion: true,
            },
        });

        return NextResponse.json({ data: clients });

    } catch (error) {
        console.error('Error searching clients:', error);
        return NextResponse.json(
            { error: 'Error searching clients' },
            { status: 500 }
        );
    }
}
