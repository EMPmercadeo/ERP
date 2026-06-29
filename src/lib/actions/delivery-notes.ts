'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

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

    const clienteId = formData.get('clienteId') as string;
    const pedidoId = (formData.get('pedidoId') as string) || null;
    const observaciones = (formData.get('observaciones') as string) || null;

    if (!clienteId || !items || items.length === 0) {
        return { message: 'Cliente e ítems son requeridos.' };
    }

    const { empresaId, userId } = await getTenantContext();

    try {
        const cliente = await prisma.cliente.findFirst({
            where: { id: clienteId, empresaId }
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

        const processedItems = items.map((item) => {
            const importe = Number(item.cantidad) * Number(item.precioUnitario);
            const descuentoDesc = Number(item.descuento) || 0;
            const baseImponible = importe - descuentoDesc;

            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                         item.codigoTasaItbms === '02' ? 0.10 :
                         item.codigoTasaItbms === '03' ? 0.15 : 0.00;
            const impuesto = baseImponible * tasa;

            subtotal += importe;
            totalDescuento += descuentoDesc;
            totalItbms += impuesto;

            return {
                productoId: item.productoId,
                descripcion: item.descripcion,
                cantidad: Number(item.cantidad),
                precioUnitario: Number(item.precioUnitario),
                descuento: descuentoDesc,
                codigoTasaItbms: item.codigoTasaItbms || '00',
                montoItbms: impuesto,
                montoTotal: baseImponible + impuesto
            };
        });

        const totalNeto = subtotal - totalDescuento + totalItbms;

        // Transaction to create albaran and deduct stock
        await prisma.$transaction(async (tx) => {
            await tx.albaranVenta.create({
                data: {
                    empresaId,
                    sucursalId: defaults.sucursal.id,
                    cajaId: defaults.caja.id,
                    clienteId,
                    creadorId: userId,
                    numero,
                    subtotal,
                    totalDescuento,
                    totalItbms,
                    totalNeto,
                    estado: 'pendiente',
                    pedidoId,
                    observaciones,
                    items: {
                        create: processedItems
                    }
                }
            });

            // Update product stock
            for (const item of processedItems) {
                if (item.productoId) {
                    await tx.producto.updateMany({
                        where: { id: item.productoId, empresaId },
                        data: {
                            stockActual: { decrement: Math.round(item.cantidad) }
                        }
                    });
                }
            }

            // If linked to a pedido, check if we should update its status
            if (pedidoId) {
                await tx.pedidoVenta.updateMany({
                    where: { id: pedidoId, empresaId },
                    data: { estado: 'entregado' }
                });
            }
        });

        revalidatePath('/delivery-notes');
        revalidatePath('/orders');
        return { success: true, message: `Albarán ${numero} creado exitosamente y stock actualizado.` };
    } catch (error: any) {
        console.error('Error creating delivery note:', error);
        return { message: error.message || 'Error al crear el albarán.' };
    }
}

export async function getDeliveryNotes() {
    const { empresaId } = await getTenantContext();
    return await prisma.albaranVenta.findMany({
        where: { empresaId },
        include: {
            cliente: { select: { razonSocial: true, ruc: true } },
            items: true
        },
        orderBy: { fechaEmision: 'desc' }
    });
}

export async function updateDeliveryNoteStatus(id: string, estado: string) {
    const { empresaId } = await getTenantContext();
    try {
        await prisma.albaranVenta.updateMany({
            where: { id, empresaId },
            data: { estado }
        });
        revalidatePath('/delivery-notes');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function invoiceGroupedDeliveryNotes(albaranIds: string[]) {
    if (!albaranIds || albaranIds.length === 0) {
        return { success: false, message: 'Selecciona al menos un albarán para facturar.' };
    }

    const { empresaId, userId } = await getTenantContext();

    try {
        const albaranes = await prisma.albaranVenta.findMany({
            where: { id: { in: albaranIds }, empresaId, estado: { not: 'facturado' } },
            include: { items: { include: { producto: true } } }
        });

        if (albaranes.length === 0) {
            return { success: false, message: 'No se encontraron albaranes pendientes válidos para facturar.' };
        }

        const clienteId = albaranes[0].clienteId;
        const differentClient = albaranes.some(a => a.clienteId !== clienteId);
        if (differentClient) {
            return { success: false, message: 'Todos los albaranes agrupados deben pertenecer al mismo cliente.' };
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
                const importe = Number(item.cantidad) * Number(item.precioUnitario);
                const desc = Number(item.descuento) || 0;
                const base = importe - desc;
                const impuesto = Number(item.montoItbms);

                subtotal += importe;
                totalDescuento += desc;
                totalItbms += impuesto;

                facturaItems.push({
                    productoId: item.productoId,
                    descripcion: `[${albaran.numero}] ${item.descripcion}`,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    costoUnitario: item.producto?.costoUnitario || 0,
                    descuento: desc,
                    codigoTasaItbms: item.codigoTasaItbms,
                    montoItbms: impuesto,
                    montoTotal: base + impuesto
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

            // Link albaranes to this invoice and mark as facturado
            await tx.albaranVenta.updateMany({
                where: { id: { in: albaranIds }, empresaId },
                data: {
                    estado: 'facturado',
                    facturaId: factura.id
                }
            });

            // Update client balance
            await tx.cliente.updateMany({
                where: { id: clienteId, empresaId },
                data: {
                    saldoPendiente: { increment: totalNeto }
                }
            });
        });

        revalidatePath('/delivery-notes');
        revalidatePath('/invoices');
        return { success: true, message: `Factura ${numeroCompleto} generada exitosamente agrupando ${albaranes.length} albarán(es).` };
    } catch (error: any) {
        console.error('Error grouping delivery notes into invoice:', error);
        return { success: false, message: error.message || 'Error al facturar albaranes.' };
    }
}
