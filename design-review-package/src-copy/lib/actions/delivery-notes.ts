'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { DeliveryNoteSchema } from '@/lib/validations';

const DOC_TYPE_ALBARAN = 'ALB';
const DOC_TYPE_FE = 'FE';

async function getNextSequence(empresaId: string, sucursalId: string, cajaId: string, tipo: string) {
    return await prisma.$transaction(async (tx) => {
        const sequence = await tx.secuencia.findUnique({
            where: {
                empresaId_sucursalId_cajaId_tipoDocumento: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: tipo
                }
            }
        });

        let nextNumber = 1;
        if (sequence) {
            nextNumber = sequence.ultimoNumero + 1;
            await tx.secuencia.update({
                where: { id: sequence.id },
                data: { ultimoNumero: nextNumber }
            });
        } else {
            await tx.secuencia.create({
                data: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: tipo,
                    ultimoNumero: nextNumber
                }
            });
        }

        return nextNumber;
    });
}

async function getDefaults(empresaId: string) {
    const company = await prisma.empresa.findUnique({
        where: { id: empresaId },
        include: {
            sucursales: {
                include: {
                    cajas: true
                }
            }
        }
    });

    if (!company || !company.sucursales[0] || !company.sucursales[0].cajas[0]) {
        throw new Error('Configuración de empresa/sucursal/caja incompleta');
    }

    return {
        empresa: company,
        sucursal: company.sucursales[0],
        caja: company.sucursales[0].cajas[0]
    };
}

export async function createDeliveryNote(prevState: any, formData: FormData) {
    const rawItems = formData.get('items');
    let items: any[] = [];
    if (rawItems) {
        try {
            items = JSON.parse(rawItems as string);
        } catch (e) {
            return { message: 'Formato de ítems inválido.' };
        }
    }

    const rawData = {
        clienteId: formData.get('clienteId'),
        cotizacionId: formData.get('cotizacionId') || null,
        pedidoId: formData.get('pedidoId') || null,
        direccionEntrega: formData.get('direccionEntrega') || '',
        nombreContacto: formData.get('nombreContacto') || '',
        telefonoContacto: formData.get('telefonoContacto') || '',
        fechaEstimadaEntrega: formData.get('fechaEstimadaEntrega') || null,
        notasInternas: formData.get('notasInternas') || '',
        notasCliente: formData.get('notasCliente') || '',
        responsableId: formData.get('responsableId') || null,
        items
    };

    const validatedFields = DeliveryNoteSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos requeridos.'
        };
    }

    const { data } = validatedFields;
    const { empresaId, userId } = await getTenantContext();

    try {
        const cliente = await prisma.cliente.findFirst({
            where: { id: data.clienteId, empresaId }
        });

        if (!cliente) {
            return { message: 'Cliente no encontrado o acceso denegado.' };
        }

        const defaults = await getDefaults(empresaId);
        const nextNum = await getNextSequence(empresaId, defaults.sucursal.id, defaults.caja.id, DOC_TYPE_ALBARAN);
        const numero = `ALB-${defaults.sucursal.codigo}-${String(nextNum).padStart(6, '0')}`;

        let subtotal = 0;
        let totalDescuento = 0;
        let totalItbms = 0;

        const processedItems = data.items.map((item) => {
            const qtyEntregada = item.cantidadEntregada;
            const qtyPedida = item.cantidadPedida;
            const qtyPendiente = Math.max(0, qtyPedida - qtyEntregada);

            const basePrice = item.precioUnitario;
            const baseAmount = qtyPedida * basePrice; // based on ordered quantity
            const disc = item.descuento || 0;
            const baseImponible = baseAmount - disc;

            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                         item.codigoTasaItbms === '02' ? 0.10 :
                         item.codigoTasaItbms === '03' ? 0.15 : 0.00;
            const impuesto = baseImponible * tasa;

            subtotal += baseAmount;
            totalDescuento += disc;
            totalItbms += impuesto;

            return {
                productoId: item.productoId,
                descripcion: item.descripcion,
                cantidad: qtyEntregada, // matches standard schema
                cantidadPedida: qtyPedida,
                cantidadPendiente: qtyPendiente,
                precioUnitario: basePrice,
                descuento: disc,
                codigoTasaItbms: item.codigoTasaItbms || '00',
                montoItbms: impuesto,
                montoTotal: baseImponible + impuesto
            };
        });

        const totalNeto = subtotal - totalDescuento + totalItbms;
        const finalEstado = formData.get('estado') as string || 'pendiente'; // borrador | pendiente | entregado

        await prisma.$transaction(async (tx) => {
            const note = await tx.albaranVenta.create({
                data: {
                    empresaId,
                    sucursalId: defaults.sucursal.id,
                    cajaId: defaults.caja.id,
                    clienteId: data.clienteId,
                    creadorId: userId,
                    numero,
                    subtotal,
                    totalDescuento,
                    totalItbms,
                    totalNeto,
                    estado: finalEstado,
                    pedidoId: data.pedidoId,
                    cotizacionId: data.cotizacionId,
                    direccionEntrega: data.direccionEntrega,
                    nombreContacto: data.nombreContacto,
                    telefonoContacto: data.telefonoContacto,
                    fechaEstimadaEntrega: data.fechaEstimadaEntrega ? new Date(`${data.fechaEstimadaEntrega}T12:00:00`) : null,
                    fechaRealEntrega: finalEstado === 'entregado' ? new Date() : null,
                    notasInternas: data.notasInternas,
                    observaciones: data.notasCliente, // maps to observations in standard schema
                    responsableId: data.responsableId,
                    items: {
                        create: processedItems
                    }
                }
            });

            // Log status history
            await tx.albaranEstadoHistorial.create({
                data: {
                    empresaId,
                    albaranId: note.id,
                    estadoAnterior: '',
                    estadoNuevo: finalEstado,
                    usuarioId: userId,
                    notas: 'Creación inicial del documento.'
                }
            });

            // If state is entregado, parcialmente entregado or despachado, decrease inventory stock & register Kardex movement
            const isDeliveredState = ['entregado', 'parcialmente_entregado', 'parcialmente entregado', 'despachado'].includes(finalEstado);
            if (isDeliveredState) {
                for (const item of processedItems) {
                    if (item.productoId && item.cantidad > 0) {
                        await tx.producto.updateMany({
                            where: { id: item.productoId, empresaId },
                            data: {
                                stockActual: { decrement: Math.round(item.cantidad) }
                            }
                        });

                        await tx.movimientoInventario.create({
                            data: {
                                empresaId,
                                productoId: item.productoId,
                                tipo: 'salida',
                                cantidad: Math.round(item.cantidad),
                                concepto: 'albaran_entrega',
                                referenciaId: note.id
                            }
                        });
                    }
                }
            }

            // If linked to a sale order, update its state
            if (data.pedidoId) {
                await tx.pedidoVenta.updateMany({
                    where: { id: data.pedidoId, empresaId },
                    data: { estado: finalEstado === 'entregado' ? 'entregado' : 'procesando' }
                });
            }
        });

        revalidatePath('/delivery-notes');
        revalidatePath('/orders');
        revalidatePath('/clients');
        return { success: true, message: `Nota de entrega ${numero} creada exitosamente.` };
    } catch (error: any) {
        console.error('Error creating delivery note:', error);
        return { message: error.message || 'Error al crear la nota de entrega.' };
    }
}

export async function updateDeliveryNoteStatus(id: string, nuevoEstado: string, notasHistorial?: string) {
    const { empresaId, userId } = await getTenantContext();
    try {
        const albaran = await prisma.albaranVenta.findFirst({
            where: { id, empresaId },
            include: { items: true }
        });

        if (!albaran) {
            return { success: false, message: 'Nota de entrega no encontrada.' };
        }

        const estadoAnterior = albaran.estado;
        if (estadoAnterior === nuevoEstado) {
            return { success: true };
        }

        await prisma.$transaction(async (tx) => {
            // Update status & real delivery date
            await tx.albaranVenta.update({
                where: { id },
                data: {
                    estado: nuevoEstado,
                    fechaRealEntrega: nuevoEstado === 'entregado' ? new Date() : albaran.fechaRealEntrega
                }
            });

            // Log status history
            await tx.albaranEstadoHistorial.create({
                data: {
                    empresaId,
                    albaranId: id,
                    estadoAnterior,
                    estadoNuevo: nuevoEstado,
                    usuarioId: userId,
                    notas: notasHistorial || `Cambio de estado de ${estadoAnterior} a ${nuevoEstado}.`
                }
            });

            // 1. Inventory Logic: Deduct stock when delivering
            const deliveredStates = ['entregado', 'parcialmente_entregado', 'parcialmente entregado', 'despachado', 'facturado'];
            const wasDelivered = deliveredStates.includes(estadoAnterior);
            const isNowDelivered = deliveredStates.includes(nuevoEstado);

            if (!wasDelivered && isNowDelivered) {
                // Deduct stock and log salida
                for (const item of albaran.items) {
                    if (item.productoId && item.cantidad.toNumber() > 0) {
                        await tx.producto.updateMany({
                            where: { id: item.productoId, empresaId },
                            data: {
                                stockActual: { decrement: Math.round(item.cantidad.toNumber()) }
                            }
                        });

                        await tx.movimientoInventario.create({
                            data: {
                                empresaId,
                                productoId: item.productoId,
                                tipo: 'salida',
                                cantidad: Math.round(item.cantidad.toNumber()),
                                concepto: 'albaran_entrega',
                                referenciaId: id
                            }
                        });
                    }
                }
            }

            // 2. Inventory Logic: Return stock if anulado
            if (wasDelivered && nuevoEstado === 'anulado') {
                for (const item of albaran.items) {
                    if (item.productoId && item.cantidad.toNumber() > 0) {
                        await tx.producto.updateMany({
                            where: { id: item.productoId, empresaId },
                            data: {
                                stockActual: { increment: Math.round(item.cantidad.toNumber()) }
                            }
                        });

                        await tx.movimientoInventario.create({
                            data: {
                                empresaId,
                                productoId: item.productoId,
                                tipo: 'entrada',
                                cantidad: Math.round(item.cantidad.toNumber()),
                                concepto: 'albaran_anulado',
                                referenciaId: id
                            }
                        });
                    }
                }
            }
        });

        revalidatePath('/delivery-notes');
        revalidatePath('/products');
        return { success: true };
    } catch (e: any) {
        console.error('Error updating delivery note status:', e);
        return { success: false, message: e.message };
    }
}

export async function invoiceGroupedDeliveryNotes(albaranIds: string[]) {
    if (!albaranIds || albaranIds.length === 0) {
        return { success: false, message: 'Selecciona al menos un documento de entrega para facturar.' };
    }

    const { empresaId, userId } = await getTenantContext();

    try {
        const albaranes = await prisma.albaranVenta.findMany({
            where: { id: { in: albaranIds }, empresaId, estado: { not: 'facturado' } },
            include: { items: { include: { producto: true } } }
        });

        if (albaranes.length === 0) {
            return { success: false, message: 'No se encontraron documentos de entrega pendientes válidos para facturar.' };
        }

        const clienteId = albaranes[0].clienteId;
        const differentClient = albaranes.some(a => a.clienteId !== clienteId);
        if (differentClient) {
            return { success: false, message: 'Todos los documentos de entrega agrupados deben pertenecer al mismo cliente.' };
        }

        const defaults = await getDefaults(empresaId);
        const nextNum = await getNextSequence(empresaId, defaults.sucursal.id, defaults.caja.id, DOC_TYPE_FE);
        const numeroCompleto = `FE-${defaults.sucursal.codigo}-${defaults.caja.codigo}-${String(nextNum).padStart(8, '0')}`;

        let subtotal = 0;
        let totalDescuento = 0;
        let totalItbms = 0;
        const facturaItems: any[] = [];

        for (const albaran of albaranes) {
            for (const item of albaran.items) {
                const qty = item.cantidad.toNumber(); // delivered qty gets invoiced
                const price = item.precioUnitario.toNumber();
                const base = qty * price;
                const desc = item.descuento.toNumber() || 0;
                const baseImponible = base - desc;
                const impuesto = item.montoItbms.toNumber();

                subtotal += base;
                totalDescuento += desc;
                totalItbms += impuesto;

                facturaItems.push({
                    productoId: item.productoId,
                    descripcion: `[${albaran.numero}] ${item.descripcion}`,
                    cantidad: qty,
                    precioUnitario: price,
                    costoUnitario: item.producto?.costoUnitario || 0,
                    descuento: desc,
                    codigoTasaItbms: item.codigoTasaItbms,
                    montoItbms: impuesto,
                    montoTotal: baseImponible + impuesto
                });
            }
        }

        const totalNeto = subtotal - totalDescuento + totalItbms;

        await prisma.$transaction(async (tx) => {
            const factura = await tx.factura.create({
                data: {
                    empresaId,
                    sucursalId: defaults.sucursal.id,
                    cajaId: defaults.caja.id,
                    clienteId,
                    creadorId: userId,
                    tipoDocumento: DOC_TYPE_FE,
                    numeroSecuencial: nextNum,
                    numeroCompleto,
                    subtotal,
                    totalDescuento,
                    totalItbms,
                    totalNeto,
                    saldoPendiente: totalNeto,
                    estadoDgi: 'borrador',
                    items: {
                        create: facturaItems
                    }
                }
            });

            // Update state & log history for each delivery note
            for (const alb of albaranes) {
                await tx.albaranVenta.update({
                    where: { id: alb.id },
                    data: {
                        estado: 'facturado',
                        facturaId: factura.id
                    }
                });

                await tx.albaranEstadoHistorial.create({
                    data: {
                        empresaId,
                        albaranId: alb.id,
                        estadoAnterior: alb.estado,
                        estadoNuevo: 'facturado',
                        usuarioId: userId,
                        notas: `Facturado automáticamente en el documento fiscal ${numeroCompleto}.`
                    }
                });

                // Inventory Logic: If it wasn't delivered yet, deduct stock now
                if (alb.estado !== 'entregado') {
                    for (const item of alb.items) {
                        if (item.productoId && item.cantidad.toNumber() > 0) {
                            await tx.producto.updateMany({
                                where: { id: item.productoId, empresaId },
                                data: {
                                    stockActual: { decrement: Math.round(item.cantidad.toNumber()) }
                                }
                            });

                            await tx.movimientoInventario.create({
                                data: {
                                    empresaId,
                                    productoId: item.productoId,
                                    tipo: 'salida',
                                    cantidad: Math.round(item.cantidad.toNumber()),
                                    concepto: 'albaran_entrega',
                                    referenciaId: alb.id
                                }
                            });
                        }
                    }
                }
            }

            // Increment client balance (Accounts Receivable only changes upon invoice issuance!)
            await tx.cliente.update({
                where: { id: clienteId },
                data: {
                    saldoPendiente: { increment: totalNeto }
                }
            });
        });

        revalidatePath('/delivery-notes');
        revalidatePath('/invoices');
        revalidatePath('/clients');
        return { success: true, message: `Factura ${numeroCompleto} generada exitosamente agrupando ${albaranes.length} documento(s) de entrega.` };
    } catch (error: any) {
        console.error('Error grouping delivery notes into invoice:', error);
        return { success: false, message: error.message || 'Error al facturar documentos de entrega.' };
    }
}
