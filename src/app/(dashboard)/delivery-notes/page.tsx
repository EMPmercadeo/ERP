import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Topbar } from '@/components/layout/Topbar';
import { DeliveryNoteList } from '@/components/delivery-notes/DeliveryNoteList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        limit?: string;
    }>;
}

export default async function DeliveryNotesPage(props: PageProps) {
    const { empresaId } = await getTenantContext();
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AlbaranVentaWhereInput = {
        empresaId
    };

    if (search) {
        where.OR = [
            { numero: { contains: search, mode: 'insensitive' } },
            { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
            { cliente: { ruc: { contains: search, mode: 'insensitive' } } },
            { factura: { numeroCompleto: { contains: search, mode: 'insensitive' } } }
        ];
    }

    const [notes, totalCount] = await Promise.all([
        prisma.albaranVenta.findMany({
            where,
            skip,
            take: limit,
            include: {
                cliente: {
                    select: {
                        razonSocial: true,
                        ruc: true,
                    }
                },
                factura: {
                    select: {
                        id: true,
                        numeroCompleto: true,
                    }
                },
                items: {
                    select: {
                        id: true,
                        descripcion: true,
                        cantidad: true,
                    }
                }
            },
            orderBy: { fechaEmision: 'desc' }
        }),
        prisma.albaranVenta.count({ where })
    ]);

    const formattedNotes = notes.map(n => {
        const fechaEntrega = n.fechaRealEntrega 
            ? n.fechaRealEntrega.toISOString().split('T')[0]
            : n.fechaEstimadaEntrega 
                ? n.fechaEstimadaEntrega.toISOString().split('T')[0]
                : 'Pendiente';

        return {
            id: n.id,
            numero: n.numero || 'N/A',
            fechaEmision: n.fechaEmision ? n.fechaEmision.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            fechaEntrega,
            totalNeto: n.totalNeto ? Number(n.totalNeto) : 0,
            estado: n.estado || 'pendiente',
            observaciones: n.observaciones || '',
            clienteId: n.clienteId,
            cliente: {
                razonSocial: n.cliente?.razonSocial || 'Cliente Desconocido',
                ruc: n.cliente?.ruc || 'N/A'
            },
            factura: n.factura ? {
                id: n.factura.id,
                numero: n.factura.numeroCompleto
            } : null,
            itemsCount: n.items?.length || 0,
            itemsSummary: n.items && n.items.length > 0 
                ? n.items.map(i => `${Number(i.cantidad || 0)}x ${i.descripcion || ''}`).join(', ')
                : 'Sin ítems'
        };
    });

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <>
            <Topbar title="Notas de Entrega" />
            <DeliveryNoteList 
                initialData={formattedNotes}
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
            />
        </>
    );
}
