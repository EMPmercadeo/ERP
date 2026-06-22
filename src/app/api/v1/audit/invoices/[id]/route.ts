import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId } = await getTenantContext();
        const { id } = await props.params;

        const auditLogs = await prisma.auditoria.findMany({
            where: {
                entidad: 'Factura',
                entidadId: id,
                usuario: {
                    empresaId
                }
            },
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json({ success: true, data: auditLogs });
    } catch (error) {
        console.error('API error in GET /audit/invoices/[id]:', error);
        return NextResponse.json({ error: 'Error al consultar la bitácora de auditoría.' }, { status: 500 });
    }
}