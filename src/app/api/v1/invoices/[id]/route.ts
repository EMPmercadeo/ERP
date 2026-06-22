import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId } = await getTenantContext();
        const { id } = await props.params;

        const invoice = await prisma.factura.findFirst({
            where: {
                id,
                empresaId
            },
            include: {
                cliente: true,
                items: true
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
        console.error('API error in GET /invoices/[id]:', error);
        return NextResponse.json({ error: 'Error al consultar la factura.' }, { status: 500 });
    }
}