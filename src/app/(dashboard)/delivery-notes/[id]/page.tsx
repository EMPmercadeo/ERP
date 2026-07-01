import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { DeliveryNoteDetailClient } from '@/components/delivery-notes/DeliveryNoteDetailClient';

export const dynamic = 'force-dynamic';

export default async function DeliveryNoteDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const { empresaId } = await getTenantContext();

    const note = await prisma.albaranVenta.findFirst({
        where: { id, empresaId },
        include: {
            cliente: {
                select: {
                    id: true,
                    razonSocial: true,
                    ruc: true,
                    dv: true,
                    email: true,
                    telefono: true,
                    direccion: true,
                }
            },
            creador: {
                select: {
                    nombre: true
                }
            },
            items: true,
            factura: {
                select: {
                    id: true,
                    numeroCompleto: true
                }
            }
        }
    });

    if (!note) {
        notFound();
    }

    const formattedNote = {
        id: note.id,
        numero: note.numero,
        fechaEmision: note.fechaEmision.toISOString(),
        estado: note.estado,
        subtotal: note.subtotal.toNumber(),
        totalDescuento: note.totalDescuento.toNumber(),
        totalItbms: note.totalItbms.toNumber(),
        totalNeto: note.totalNeto.toNumber(),
        observaciones: note.observaciones || '',
        cliente: {
            id: note.cliente.id,
            razonSocial: note.cliente.razonSocial,
            ruc: note.cliente.ruc,
            dv: note.cliente.dv || '',
            email: note.cliente.email || '',
            telefono: note.cliente.telefono || '',
            direccion: note.cliente.direccion || ''
        },
        creador: {
            nombre: note.creador.nombre
        },
        items: note.items.map(item => ({
            id: item.id,
            descripcion: item.descripcion,
            cantidad: item.cantidad.toNumber(),
            precioUnitario: item.precioUnitario.toNumber(),
            descuento: item.descuento.toNumber(),
            montoItbms: item.montoItbms.toNumber(),
            montoTotal: item.montoTotal.toNumber()
        })),
        factura: note.factura ? {
            id: note.factura.id,
            numeroCompleto: note.factura.numeroCompleto
        } : null
    };

    return (
        <DeliveryNoteDetailClient note={formattedNote} />
    );
}
