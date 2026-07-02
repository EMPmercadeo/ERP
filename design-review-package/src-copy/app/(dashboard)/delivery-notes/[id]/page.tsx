import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { DeliveryNoteDetailClient } from '@/components/delivery-notes/DeliveryNoteDetailClient';

export const dynamic = 'force-dynamic';

export default async function DeliveryNoteDetailPage(props: { 
    params: Promise<{ id: string }>;
    searchParams: Promise<{ print?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const printParam = searchParams.print;
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
            responsable: {
                select: {
                    nombre: true
                }
            },
            cotizacion: {
                select: {
                    id: true,
                    numero: true
                }
            },
            items: true,
            factura: {
                select: {
                    id: true,
                    numeroCompleto: true
                }
            },
            historialEstados: {
                orderBy: { fechaCambio: 'asc' },
                include: {
                    usuario: {
                        select: {
                            nombre: true
                        }
                    }
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
        fechaEmision: note.fechaEmision ? note.fechaEmision.toISOString() : new Date().toISOString(),
        estado: note.estado || 'pendiente',
        subtotal: note.subtotal ? note.subtotal.toNumber() : 0,
        totalDescuento: note.totalDescuento ? note.totalDescuento.toNumber() : 0,
        totalItbms: note.totalItbms ? note.totalItbms.toNumber() : 0,
        totalNeto: note.totalNeto ? note.totalNeto.toNumber() : 0,
        observaciones: note.observaciones || '', // customer notes
        direccionEntrega: note.direccionEntrega || '',
        nombreContacto: note.nombreContacto || '',
        telefonoContacto: note.telefonoContacto || '',
        fechaEstimadaEntrega: note.fechaEstimadaEntrega ? note.fechaEstimadaEntrega.toISOString() : null,
        fechaRealEntrega: note.fechaRealEntrega ? note.fechaRealEntrega.toISOString() : null,
        notasInternas: note.notasInternas || '',
        cliente: {
            id: note.cliente?.id || '',
            razonSocial: note.cliente?.razonSocial || 'Cliente Desconocido',
            ruc: note.cliente?.ruc || 'N/A',
            dv: note.cliente?.dv || '',
            email: note.cliente?.email || '',
            telefono: note.cliente?.telefono || '',
            direccion: note.cliente?.direccion || ''
        },
        creador: {
            nombre: note.creador?.nombre || 'Sistema'
        },
        responsable: note.responsable ? {
            nombre: note.responsable.nombre
        } : null,
        cotizacion: note.cotizacion ? {
            id: note.cotizacion.id,
            numero: note.cotizacion.numero
        } : null,
        items: note.items ? note.items.map(item => ({
            id: item.id,
            descripcion: item.descripcion,
            cantidad: item.cantidad ? item.cantidad.toNumber() : 0, // quantity delivered
            cantidadPedida: item.cantidadPedida ? item.cantidadPedida.toNumber() : 0,
            cantidadPendiente: item.cantidadPendiente ? item.cantidadPendiente.toNumber() : 0,
            precioUnitario: item.precioUnitario ? item.precioUnitario.toNumber() : 0,
            descuento: item.descuento ? item.descuento.toNumber() : 0,
            montoItbms: item.montoItbms ? item.montoItbms.toNumber() : 0,
            montoTotal: item.montoTotal ? item.montoTotal.toNumber() : 0
        })) : [],
        factura: note.factura ? {
            id: note.factura.id,
            numeroCompleto: note.factura.numeroCompleto
        } : null,
        historialEstados: note.historialEstados ? note.historialEstados.map(h => ({
            id: h.id,
            estadoAnterior: h.estadoAnterior || '',
            estadoNuevo: h.estadoNuevo || '',
            fechaCambio: h.fechaCambio ? h.fechaCambio.toISOString() : new Date().toISOString(),
            notas: h.notas || '',
            usuario: {
                nombre: h.usuario?.nombre || 'Sistema'
            }
        })) : []
    };

    return (
        <DeliveryNoteDetailClient note={formattedNote} printMode={printParam === 'true'} />
    );
}
