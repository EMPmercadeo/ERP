'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

const DOC_TYPE_PEDIDO = 'PED';

async function getNextSequence(empresaId: string, sucursalId: string, cajaId: string) {
    return await prisma.$transaction(async (tx) => {
        const sequence = await tx.secuencia.findUnique({
            where: {
                empresaId_sucursalId_cajaId_tipoDocumento: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: DOC_TYPE_PEDIDO
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
                    tipoDocumento: DOC_TYPE_PEDIDO,
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

export async function createSalesOrder(prevState: any, formData: FormData) {
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
    const fechaEntregaStr = formData.get('fechaEntrega') as string;
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
        const nextNum = await getNextSequence(empresaId, defaults.sucursal.id, defaults.caja.id);
        const numero = `PED-${defaults.sucursal.codigo}-${String(nextNum).padStart(6, '0')}`;

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

        await prisma.pedidoVenta.create({
            data: {
                empresaId,
                sucursalId: defaults.sucursal.id,
                cajaId: defaults.caja.id,
                clienteId,
                creadorId: userId,
                numero,
                fechaEntrega: fechaEntregaStr ? new Date(fechaEntregaStr) : null,
                subtotal,
                totalDescuento,
                totalItbms,
                totalNeto,
                estado: 'pendiente',
                observaciones,
                items: {
                    create: processedItems
                }
            }
        });

        revalidatePath('/orders');
        return { success: true, message: `Pedido ${numero} creado exitosamente.` };
    } catch (error: any) {
        console.error('Error creating sales order:', error);
        return { message: error.message || 'Error al crear el pedido.' };
    }
}

export async function getSalesOrders(limit: number = 100) {
    const { empresaId } = await getTenantContext();
    return await prisma.pedidoVenta.findMany({
        where: { empresaId },
        take: limit,
        include: {
            cliente: { select: { razonSocial: true, ruc: true } },
            items: true
        },
        orderBy: { fechaEmision: 'desc' }
    });
}

export async function updateSalesOrderStatus(id: string, estado: string) {
    const { empresaId } = await getTenantContext();
    try {
        await prisma.pedidoVenta.updateMany({
            where: { id, empresaId },
            data: { estado }
        });
        revalidatePath('/orders');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function convertQuoteToOrder(quoteId: string) {
    const { empresaId, userId } = await getTenantContext();
    try {
        const cotizacion = await prisma.cotizacion.findFirst({
            where: { id: quoteId, empresaId },
            include: { items: true }
        });

        if (!cotizacion) {
            return { success: false, message: 'Cotización no encontrada.' };
        }

        const defaults = await getDefaults(empresaId);
        const nextNum = await getNextSequence(empresaId, defaults.sucursal.id, defaults.caja.id);
        const numero = `PED-${defaults.sucursal.codigo}-${String(nextNum).padStart(6, '0')}`;

        const orderItems = cotizacion.items.map(item => ({
            productoId: item.productoId,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento,
            codigoTasaItbms: item.codigoTasaItbms,
            montoItbms: item.montoItbms,
            montoTotal: item.montoTotal
        }));

        await prisma.$transaction(async (tx) => {
            await tx.pedidoVenta.create({
                data: {
                    empresaId,
                    sucursalId: defaults.sucursal.id,
                    cajaId: defaults.caja.id,
                    clienteId: cotizacion.clienteId,
                    creadorId: userId,
                    numero,
                    subtotal: cotizacion.subtotal,
                    totalDescuento: cotizacion.totalDescuento,
                    totalItbms: cotizacion.totalItbms,
                    totalNeto: cotizacion.totalNeto,
                    estado: 'pendiente',
                    cotizacionId: quoteId,
                    items: {
                        create: orderItems
                    }
                }
            });

            await tx.cotizacion.updateMany({
                where: { id: quoteId, empresaId },
                data: { estado: 'aceptada' }
            });
        });

        revalidatePath('/orders');
        revalidatePath('/quotes');
        return { success: true, message: `Pedido ${numero} creado desde la cotización ${cotizacion.numero}.` };
    } catch (error: any) {
        console.error('Error converting quote to order:', error);
        return { success: false, message: error.message || 'Error al convertir cotización.' };
    }
}
