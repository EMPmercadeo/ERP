'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { prisma } from '@/lib/db';
import { InvoiceSchema } from '@/lib/validations';

import { getTenantContext } from '@/lib/auth/context';
import { resolverBodegaId, moverInventarioBodega } from './bodegas';
import { canCreateInvoice, incrementDocumentUsage } from '@/lib/actions/billing';
import { generarAsientoFactura, generarAsientoCobro, generarAsientoCostoVenta } from '@/lib/contabilidad/asientos';
import { timbrarFacturaDGI } from './billing-fe';
import { dispatchWebhookEvent } from '@/lib/integrations/webhooks';
import { enviarWhatsAppFactura } from '@/lib/integrations/whatsapp';

// DGI Document Codes
const DOC_TYPE_FE = 'FE'; // Factura Electrónica

async function getNextSequence(empresaId: string, sucursalId: string, cajaId: string) {
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // Upsert sequence counter
        const sequence = await tx.secuencia.findUnique({
            where: {
                empresaId_sucursalId_cajaId_tipoDocumento: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: DOC_TYPE_FE
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
                    tipoDocumento: DOC_TYPE_FE,
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

export async function createInvoice(prevState: unknown, formData: FormData) {
    const rawItems = formData.get('items');
    let items: unknown[] = [];
    if (rawItems) {
        try {
            items = JSON.parse(rawItems as string);
        } catch {
            return { success: false, message: 'Formato de ítems inválido.' };
        }
    }

    const rawData = {
        clienteId: formData.get('clienteId'),
        condicionPago: formData.get('condicionPago'),
        observaciones: formData.get('observaciones'),
        bodegaId: formData.get('bodegaId') || null,
        items: items
    };

    const validatedFields = InvoiceSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación en la factura.',
        };
    }

    const { data } = validatedFields;

    let redirectUrl = '/invoices';
    try {
        const { empresaId, userId } = await getTenantContext();
        const { empresa, sucursal, caja } = await getDefaults(empresaId);

        // Verify client belongs to current company
        const client = await prisma.cliente.findFirst({
            where: { id: data.clienteId, empresaId }
        });
        if (!client) {
            return {
                message: 'El cliente seleccionado no pertenece a tu empresa o no existe.'
            };
        }

        // Verify all products belong to current company
        const productIds = data.items.map(item => item.productoId);
        const uniqueProductIds = Array.from(new Set(productIds));
        const products = await prisma.producto.findMany({
            where: {
                id: { in: uniqueProductIds },
                empresaId
            },
            include: {
                kitInfo: {
                    include: {
                        componentes: {
                            include: {
                                productoComponente: true
                            }
                        }
                    }
                }
            }
        });
        if (products.length !== uniqueProductIds.length) {
            return {
                message: 'Uno o más productos seleccionados no pertenecen a tu empresa o no existen.'
            };
        }

        // Check monthly document consumption limits
        const hasRemainingDocs = await canCreateInvoice(empresaId);
        if (!hasRemainingDocs) {
            return {
                message: 'Has alcanzado el límite mensual de documentos electrónicos de tu plan. Compra un bloque adicional o actualiza tu plan.'
            };
        }

        // --- FREE TIER CHECK ---
        const isFiscal = empresa.fiscalEnabled && empresa.planType !== 'free'; // Double check
        const tipoDoc = isFiscal ? 'FE' : 'REC'; // FE = Factura Electrónica, REC = Recibo Interno
        const prefix = isFiscal ? 'FE' : 'REC';

        // Get next sequence number atomically
        const numeroSecuencial = await getNextSequence(empresa.id, sucursal.id, caja.id);

        let numeroCompleto = '';
        if (isFiscal) {
            // Format Full Fiscal Number: SSS-PPP-CC-TT-NNNNNNNN
            numeroCompleto = `${prefix}-001-001-01-${String(numeroSecuencial).padStart(8, '0')}`;
        } else {
            // Simple Internal Number
            numeroCompleto = `${prefix}-${String(numeroSecuencial).padStart(8, '0')}`;
        }

        // Calculate totals with discount per DGI fiscal rules
        const subtotal = data.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
        const totalDescuento = data.items.reduce((sum, item) => sum + (item.descuento || 0), 0);
        const totalItbms = data.items.reduce((sum, item) => {
            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                item.codigoTasaItbms === '02' ? 0.10 :
                    item.codigoTasaItbms === '03' ? 0.15 : 0;
            const montoBruto = item.cantidad * item.precioUnitario;
            const montoNeto = Math.max(0, montoBruto - (item.descuento || 0));
            return sum + (montoNeto * tasa);
        }, 0);
        const totalNeto = subtotal - totalDescuento + totalItbms;

        // Calcula el total de ventas por tipo (Mercancías vs Servicios) usando la unidad de medida del producto
        const getProductoCosto = (prod: any): number => {
            if (prod.esKit && prod.kitInfo && prod.kitInfo.activo) {
                let totalCosto = 0;
                for (const comp of prod.kitInfo.componentes) {
                    totalCosto += getProductoCosto(comp.productoComponente) * comp.cantidad;
                }
                return totalCosto;
            }
            return Number(prod.costoUnitario || 0);
        };

        const mapaUnidad = new Map(products.map((p) => [p.id, p.unidadMedida]));
        const mapaCosto = new Map(products.map((p) => [p.id, getProductoCosto(p)]));
        const mapaProductDetails = new Map(products.map((p) => [p.id, p]));

        let costoVentaTotal = 0;
        for (const item of data.items) {
            const unidad = mapaUnidad.get(item.productoId);
            if (unidad !== 'SRV' && unidad !== 'HRS') {
                const costo = mapaCosto.get(item.productoId) ?? 0;
                costoVentaTotal += costo * item.cantidad;
            }
        }
        let ventasMercancias = 0;
        let ventasServicios = 0;
        for (const item of data.items) {
            const unidad = mapaUnidad.get(item.productoId);
            const montoBrutoItem = item.cantidad * item.precioUnitario;
            if (unidad === 'SRV' || unidad === 'HRS') {
                ventasServicios += montoBrutoItem;
            } else {
                ventasMercancias += montoBrutoItem;
            }
        }

        // Crea la factura y su asiento contable de forma atómica
        const invoice = await prisma.$transaction(async (tx) => {
            const nuevaFactura = await tx.factura.create({
                data: {
                    empresaId: empresa.id,
                    sucursalId: sucursal.id,
                    cajaId: caja.id,
                    clienteId: data.clienteId,
                    creadorId: userId,
                    tipoDocumento: tipoDoc,
                    numeroSecuencial,
                    numeroCompleto,
                    subtotal,
                    totalDescuento,
                    totalItbms,
                    totalNeto,
                    saldoPendiente: data.condicionPago === 'contado' ? 0 : totalNeto,
                    totalPagado: data.condicionPago === 'contado' ? totalNeto : 0,
                    estadoDgi: isFiscal ? 'pendiente' : 'local',
                    items: {
                        create: data.items.map(item => {
                            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                                item.codigoTasaItbms === '02' ? 0.10 :
                                    item.codigoTasaItbms === '03' ? 0.15 : 0;
                            const desc = item.descuento || 0;
                            const montoBruto = item.cantidad * item.precioUnitario;
                            const montoNeto = Math.max(0, montoBruto - desc);
                            const montoItbms = montoNeto * tasa;
                            return {
                                productoId: item.productoId,
                                descripcion: item.descripcion,
                                cantidad: item.cantidad,
                                precioUnitario: item.precioUnitario,
                                costoUnitario: mapaCosto.get(item.productoId) ?? 0,
                                descuento: desc,
                                codigoTasaItbms: item.codigoTasaItbms,
                                montoItbms: montoItbms,
                                montoTotal: montoNeto + montoItbms
                            };
                        })
                    }
                }
            });

            await generarAsientoFactura(tx, {
                empresaId: empresa.id,
                facturaId: nuevaFactura.id,
                numeroCompleto: nuevaFactura.numeroCompleto,
                fecha: nuevaFactura.fechaEmision,
                usuarioId: userId,
                subtotal,
                totalDescuento,
                totalItbms,
                totalNeto,
                ventasMercancias,
                ventasServicios,
            });

            await generarAsientoCostoVenta(tx, {
                empresaId: empresa.id,
                facturaId: nuevaFactura.id,
                numeroCompleto: nuevaFactura.numeroCompleto,
                fecha: nuevaFactura.fechaEmision,
                usuarioId: userId,
                costoTotal: costoVentaTotal,
            });

            const bodegaId = await resolverBodegaId(tx, empresa.id, data.bodegaId ?? null);

            const descontarStock = async (prodId: string, cantidad: number, esKit: boolean, kitInfo: any) => {
                if (esKit && kitInfo && kitInfo.activo) {
                    for (const comp of kitInfo.componentes) {
                        const compProd = comp.productoComponente;
                        const totalQty = comp.cantidad * cantidad;
                        await descontarStock(compProd.id, totalQty, compProd.esKit, compProd.kitInfo);
                    }
                } else {
                    const prod = await tx.producto.findFirst({
                        where: { id: prodId },
                        select: { controlaLotes: true }
                    });

                    await tx.producto.update({
                        where: { id: prodId },
                        data: { stockActual: { decrement: Math.round(cantidad) } },
                    });
                    await moverInventarioBodega(tx, {
                        empresaId: empresa.id,
                        bodegaId,
                        productoId: prodId,
                        delta: -Math.round(cantidad)
                    });

                    if (prod?.controlaLotes) {
                        let cantidadPorDescontar = Math.round(cantidad);
                        const lotes = await tx.loteProducto.findMany({
                            where: {
                                empresaId: empresa.id,
                                productoId: prodId,
                                bodegaId,
                                cantidadDisponible: { gt: 0 }
                            },
                            orderBy: [
                                { fechaVencimiento: 'asc' },
                                { createdAt: 'asc' }
                            ]
                        });

                        for (const lote of lotes) {
                            if (cantidadPorDescontar <= 0) break;
                            const cantidadDescontarDeEsteLote = Math.min(lote.cantidadDisponible, cantidadPorDescontar);
                            await tx.loteProducto.update({
                                where: { id: lote.id },
                                data: {
                                    cantidadDisponible: { decrement: cantidadDescontarDeEsteLote }
                                }
                            });
                            cantidadPorDescontar -= cantidadDescontarDeEsteLote;
                        }

                        if (cantidadPorDescontar > 0) {
                            if (lotes.length > 0) {
                                await tx.loteProducto.update({
                                    where: { id: lotes[lotes.length - 1].id },
                                    data: {
                                        cantidadDisponible: { decrement: cantidadPorDescontar }
                                    }
                                });
                            } else {
                                await tx.loteProducto.create({
                                    data: {
                                        empresaId: empresa.id,
                                        productoId: prodId,
                                        bodegaId,
                                        numeroLote: 'LOTE-SISTEMA',
                                        fechaVencimiento: null,
                                        cantidadRecibida: 0,
                                        cantidadDisponible: -cantidadPorDescontar
                                    }
                                });
                            }
                        }
                    }
                }
            };

            for (const item of data.items) {
                const unidad = mapaUnidad.get(item.productoId);
                if (unidad !== 'SRV' && unidad !== 'HRS') {
                    const prodDetails = mapaProductDetails.get(item.productoId);
                    if (prodDetails) {
                        await descontarStock(
                            item.productoId,
                            item.cantidad,
                            prodDetails.esKit,
                            prodDetails.kitInfo
                        );
                    }
                }
            }

            // Si es de contado, registrar pago y generar asiento de cobro
            if (data.condicionPago === 'contado') {
                const metodoPago = (formData.get('metodoPago') as string) || 'efectivo';
                const nuevoPago = await tx.pago.create({
                    data: {
                        empresaId: empresa.id,
                        facturaId: nuevaFactura.id,
                        clienteId: data.clienteId,
                        usuarioId: userId,
                        monto: totalNeto,
                        metodoPago,
                        montoAplicado: totalNeto,
                    }
                });

                await generarAsientoCobro(tx, {
                    empresaId: empresa.id,
                    pagoId: nuevoPago.id,
                    numeroFactura: nuevaFactura.numeroCompleto,
                    fecha: nuevaFactura.fechaEmision,
                    usuarioId: userId,
                    monto: totalNeto,
                    metodoPago,
                });
            }

            return nuevaFactura;
        });

        // Increment monthly document usage
        await incrementDocumentUsage(empresaId);

        // Si la facturación electrónica está configurada y activa, timbrar en background
        const feConfig = await prisma.configuracionFacturacionElectronica.findUnique({
            where: { empresaId }
        });
        if (feConfig && feConfig.activo) {
            await prisma.factura.update({
                where: { id: invoice.id },
                data: { estadoDgi: 'pendiente' }
            });
        }

        // Tareas en background (timbrado DGI, webhook saliente, WhatsApp): after() garantiza que
        // Next.js las ejecute tras enviar la respuesta, incluso en runtimes serverless donde el
        // proceso puede congelarse justo después del redirect() de más abajo.
        after(async () => {
            if (feConfig && feConfig.activo) {
                await timbrarFacturaDGI(invoice.id);
            }

            await dispatchWebhookEvent(empresaId, 'factura.creada', {
                facturaId: invoice.id,
                numeroFactura: invoice.numeroCompleto,
                total: Number(invoice.totalNeto),
                clienteId: invoice.clienteId
            });

            await enviarWhatsAppFactura({
                empresaId,
                clienteId: invoice.clienteId,
                facturaId: invoice.id,
                numeroFactura: invoice.numeroCompleto,
                total: Number(invoice.totalNeto)
            });
        });

        redirectUrl = `/invoices?created=true&id=${invoice.id}&num=${encodeURIComponent(invoice.numeroCompleto)}&total=${invoice.totalNeto}`;

    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error al crear la factura. Por favor intente nuevamente.',
        };
    }

    revalidatePath('/invoices');
    redirect(redirectUrl);
}

export async function voidInvoice(id: string) {
    try {
        const { empresaId } = await getTenantContext();
        const invoice = await prisma.factura.findFirst({
            where: { id, empresaId }
        });

        if (!invoice) {
            return { success: false, message: 'Factura no encontrada o acceso denegado.' };
        }

        if (invoice.estadoDgi === 'anulada') {
            return { success: false, message: 'La factura ya está anulada.' };
        }

        await prisma.factura.update({
            where: { id },
            data: {
                estadoDgi: 'anulada',
                saldoPendiente: 0
            }
        });

        revalidatePath('/invoices');
        return { success: true, message: 'Factura anulada correctamente (Nota de Crédito aplicada).' };
    } catch (error) {
        console.error('Void invoice error:', error);
        return { success: false, message: 'Error al intentar anular la factura. Por favor intente nuevamente.' };
    }
}

export async function recordInvoicePayment(
    invoiceId: string,
    amount: number,
    method: string,
    reference?: string
) {
    try {
        const { empresaId, userId } = await getTenantContext();

        const result = await prisma.$transaction(async (tx) => {
            // Find invoice
            const invoice = await tx.factura.findFirst({
                where: { id: invoiceId, empresaId },
            });

            if (!invoice) {
                return { success: false, error: 'Factura no encontrada o acceso denegado.' };
            }

            const currentSaldo = Number(invoice.saldoPendiente);
            if (currentSaldo <= 0) {
                return { success: false, error: 'La factura ya se encuentra cancelada (sin saldo pendiente).' };
            }

            const paymentAmount = Math.min(amount, currentSaldo);
            const newSaldo = currentSaldo - paymentAmount;
            const newTotalPagado = Number(invoice.totalPagado) + paymentAmount;

            // Update invoice
            await tx.factura.update({
                where: { id: invoiceId },
                data: {
                    saldoPendiente: newSaldo,
                    totalPagado: newTotalPagado,
                },
            });

            // Create Pago record
            const payment = await tx.pago.create({
                data: {
                    empresaId,
                    facturaId: invoiceId,
                    clienteId: invoice.clienteId,
                    usuarioId: userId,
                    monto: paymentAmount,
                    metodoPago: method,
                    referencia: reference || null,
                    montoAplicado: paymentAmount,
                    montoCredito: 0,
                },
            });

            await generarAsientoCobro(tx, {
                empresaId,
                pagoId: payment.id,
                numeroFactura: invoice.numeroCompleto,
                fecha: payment.fechaPago,
                usuarioId: userId,
                monto: paymentAmount,
                metodoPago: method,
            });

            // Log to Auditoria
            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Factura',
                    entidadId: invoiceId,
                    accion: 'registrar_pago',
                    datosAntes: {
                        saldoPendiente: currentSaldo,
                        totalPagado: Number(invoice.totalPagado),
                    },
                    datosDespues: {
                        saldoPendiente: newSaldo,
                        totalPagado: newTotalPagado,
                        pagoId: payment.id,
                        montoPago: paymentAmount,
                        metodoPago: method,
                    },
                },
            });

            return {
                success: true,
                message: `Pago de $${paymentAmount.toFixed(2)} registrado exitosamente.`,
                remainingSaldo: newSaldo,
                clienteId: invoice.clienteId,
                montoPagado: paymentAmount,
                metodoPago: method
            };
        });

        if (result.success) {
            revalidatePath('/invoices');
            revalidatePath('/receivables');

            after(async () => {
                await dispatchWebhookEvent(empresaId, 'pago.recibido', {
                    facturaId: invoiceId,
                    clienteId: result.clienteId,
                    monto: result.montoPagado,
                    metodoPago: result.metodoPago
                });
            });
        }
        return result;

    } catch (error) {
        console.error('Record payment error:', error);
        return { 
            success: false, 
            error: 'Error al intentar registrar el pago. Por favor intente nuevamente.' 
        };
    }
}

export async function createInvoicePOS(rawData: {
    clienteId: string;
    condicionPago: string;
    metodoPago?: string;
    observaciones?: string;
    bodegaId?: string | null;
    items: {
        productoId: string;
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        codigoTasaItbms: string;
    }[];
}) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const { empresa, sucursal, caja } = await getDefaults(empresaId);

        // Validate client
        const client = await prisma.cliente.findFirst({
            where: { id: rawData.clienteId, empresaId }
        });
        if (!client) {
            return { success: false, error: 'El cliente seleccionado no existe.' };
        }

        // Check limits
        const hasRemainingDocs = await canCreateInvoice(empresaId);
        if (!hasRemainingDocs) {
            return { success: false, error: 'Has alcanzado el límite mensual de documentos electrónicos de tu plan.' };
        }

        const isFiscal = empresa.fiscalEnabled && empresa.planType !== 'free';
        const tipoDoc = isFiscal ? 'FE' : 'REC';
        const prefix = isFiscal ? 'FE' : 'REC';

        // Get next sequence number atomically
        const numeroSecuencial = await getNextSequence(empresa.id, sucursal.id, caja.id);

        let numeroCompleto = '';
        if (isFiscal) {
            numeroCompleto = `${prefix}-001-001-01-${String(numeroSecuencial).padStart(8, '0')}`;
        } else {
            numeroCompleto = `${prefix}-${String(numeroSecuencial).padStart(8, '0')}`;
        }

        // Calculate totals
        const subtotal = rawData.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
        const totalItbms = rawData.items.reduce((sum, item) => {
            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                item.codigoTasaItbms === '02' ? 0.10 :
                    item.codigoTasaItbms === '03' ? 0.15 : 0;
            return sum + (item.cantidad * item.precioUnitario * tasa);
        }, 0);
        const totalNeto = subtotal + totalItbms;

        // Validate all products belong to tenant BEFORE creating invoice, y traer datos necesarios para contabilidad
        const productIds = rawData.items.map((i) => i.productoId).filter(Boolean);
        let productsData: any[] = [];
        if (productIds.length > 0) {
            productsData = await prisma.producto.findMany({
                where: { id: { in: productIds }, empresaId },
                include: {
                    kitInfo: {
                        include: {
                            componentes: {
                                include: {
                                    productoComponente: true
                                }
                            }
                        }
                    }
                }
            });
            if (productsData.length !== productIds.length) {
                return { success: false, error: 'Producto no válido para esta empresa.' };
            }
        }

        const getProductoCosto = (prod: any): number => {
            if (prod.esKit && prod.kitInfo && prod.kitInfo.activo) {
                let totalCosto = 0;
                for (const comp of prod.kitInfo.componentes) {
                    totalCosto += getProductoCosto(comp.productoComponente) * comp.cantidad;
                }
                return totalCosto;
            }
            return Number(prod.costoUnitario || 0);
        };

        const mapaUnidad = new Map(productsData.map((p) => [p.id, p.unidadMedida]));
        const mapaCosto = new Map(productsData.map((p) => [p.id, getProductoCosto(p)]));
        const mapaProductDetails = new Map(productsData.map((p) => [p.id, p]));

        let ventasMercancias = 0;
        let ventasServicios = 0;
        let costoVentaTotal = 0;
        for (const item of rawData.items) {
            const unidad = mapaUnidad.get(item.productoId);
            const montoBrutoItem = item.cantidad * item.precioUnitario;
            if (unidad === 'SRV' || unidad === 'HRS') {
                ventasServicios += montoBrutoItem;
            } else {
                ventasMercancias += montoBrutoItem;
                costoVentaTotal += (mapaCosto.get(item.productoId) ?? 0) * item.cantidad;
            }
        }

        const invoice = await prisma.$transaction(async (tx) => {
            // Create Invoice
            const inv = await tx.factura.create({
                data: {
                    empresaId: empresa.id,
                    sucursalId: sucursal.id,
                    cajaId: caja.id,
                    clienteId: rawData.clienteId,
                    creadorId: userId,
                    tipoDocumento: tipoDoc,
                    numeroSecuencial,
                    numeroCompleto,
                    subtotal,
                    totalItbms,
                    totalNeto,
                    saldoPendiente: rawData.condicionPago === 'contado' ? 0 : totalNeto,
                    totalPagado: rawData.condicionPago === 'contado' ? totalNeto : 0,
                    estadoDgi: isFiscal ? 'pendiente' : 'local',
                    items: {
                        create: rawData.items.map(item => {
                            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                                item.codigoTasaItbms === '02' ? 0.10 :
                                    item.codigoTasaItbms === '03' ? 0.15 : 0;
                            return {
                                productoId: item.productoId,
                                descripcion: item.descripcion,
                                cantidad: item.cantidad,
                                precioUnitario: item.precioUnitario,
                                costoUnitario: mapaCosto.get(item.productoId) ?? 0,
                                codigoTasaItbms: item.codigoTasaItbms,
                                montoItbms: item.cantidad * item.precioUnitario * tasa,
                                montoTotal: item.cantidad * item.precioUnitario * (1 + tasa)
                            };
                        })
                    }
                }
            });

            await generarAsientoFactura(tx, {
                empresaId: empresa.id,
                facturaId: inv.id,
                numeroCompleto: inv.numeroCompleto,
                fecha: inv.fechaEmision,
                usuarioId: userId,
                subtotal,
                totalDescuento: 0,
                totalItbms,
                totalNeto,
                ventasMercancias,
                ventasServicios,
            });

            await generarAsientoCostoVenta(tx, {
                empresaId: empresa.id,
                facturaId: inv.id,
                numeroCompleto: inv.numeroCompleto,
                fecha: inv.fechaEmision,
                usuarioId: userId,
                costoTotal: costoVentaTotal,
            });

            const bodegaId = await resolverBodegaId(tx, empresa.id, rawData.bodegaId ?? null);

            const descontarStock = async (prodId: string, cantidad: number, esKit: boolean, kitInfo: any) => {
                if (esKit && kitInfo && kitInfo.activo) {
                    for (const comp of kitInfo.componentes) {
                        const compProd = comp.productoComponente;
                        const totalQty = comp.cantidad * cantidad;
                        await descontarStock(compProd.id, totalQty, compProd.esKit, compProd.kitInfo);
                    }
                } else {
                    const prod = await tx.producto.findFirst({
                        where: { id: prodId },
                        select: { controlaLotes: true }
                    });

                    await tx.producto.update({
                        where: { id: prodId },
                        data: { stockActual: { decrement: Math.round(cantidad) } },
                    });
                    await moverInventarioBodega(tx, {
                        empresaId: empresa.id,
                        bodegaId,
                        productoId: prodId,
                        delta: -Math.round(cantidad)
                    });

                    if (prod?.controlaLotes) {
                        let cantidadPorDescontar = Math.round(cantidad);
                        const lotes = await tx.loteProducto.findMany({
                            where: {
                                empresaId: empresa.id,
                                productoId: prodId,
                                bodegaId,
                                cantidadDisponible: { gt: 0 }
                            },
                            orderBy: [
                                { fechaVencimiento: 'asc' },
                                { createdAt: 'asc' }
                            ]
                        });

                        for (const lote of lotes) {
                            if (cantidadPorDescontar <= 0) break;
                            const cantidadDescontarDeEsteLote = Math.min(lote.cantidadDisponible, cantidadPorDescontar);
                            await tx.loteProducto.update({
                                where: { id: lote.id },
                                data: {
                                    cantidadDisponible: { decrement: cantidadDescontarDeEsteLote }
                                }
                            });
                            cantidadPorDescontar -= cantidadDescontarDeEsteLote;
                        }

                        if (cantidadPorDescontar > 0) {
                            if (lotes.length > 0) {
                                await tx.loteProducto.update({
                                    where: { id: lotes[lotes.length - 1].id },
                                    data: {
                                        cantidadDisponible: { decrement: cantidadPorDescontar }
                                    }
                                });
                            } else {
                                await tx.loteProducto.create({
                                    data: {
                                        empresaId: empresa.id,
                                        productoId: prodId,
                                        bodegaId,
                                        numeroLote: 'LOTE-SISTEMA',
                                        fechaVencimiento: null,
                                        cantidadRecibida: 0,
                                        cantidadDisponible: -cantidadPorDescontar
                                    }
                                });
                            }
                        }
                    }
                }
            };

            // Update stock
            for (const item of rawData.items) {
                const prodDetails = mapaProductDetails.get(item.productoId);
                if (prodDetails) {
                    await descontarStock(item.productoId, item.cantidad, prodDetails.esKit, prodDetails.kitInfo);
                }
            }

            // If payment is made, record it in Pago model
            if (rawData.condicionPago === 'contado') {
                const pago = await tx.pago.create({
                    data: {
                        empresaId,
                        facturaId: inv.id,
                        clienteId: rawData.clienteId,
                        usuarioId: userId,
                        monto: totalNeto,
                        metodoPago: rawData.metodoPago || 'efectivo',
                        montoAplicado: totalNeto,
                    }
                });

                await generarAsientoCobro(tx, {
                    empresaId,
                    pagoId: pago.id,
                    numeroFactura: inv.numeroCompleto,
                    fecha: inv.fechaEmision,
                    usuarioId: userId,
                    monto: totalNeto,
                    metodoPago: rawData.metodoPago || 'efectivo',
                });
            }

            return inv;
        });

        // Increment usage
        await incrementDocumentUsage(empresaId);

        // Si la facturación electrónica está configurada y activa, timbrar en background
        const feConfig = await prisma.configuracionFacturacionElectronica.findUnique({
            where: { empresaId }
        });
        if (feConfig && feConfig.activo) {
            await prisma.factura.update({
                where: { id: invoice.id },
                data: { estadoDgi: 'pendiente' }
            });
        }

        // Tareas en background (timbrado DGI, webhook saliente, WhatsApp): after() garantiza que
        // Next.js las ejecute tras enviar la respuesta, incluso en runtimes serverless.
        after(async () => {
            if (feConfig && feConfig.activo) {
                await timbrarFacturaDGI(invoice.id);
            }

            await dispatchWebhookEvent(empresaId, 'factura.creada', {
                facturaId: invoice.id,
                numeroFactura: invoice.numeroCompleto,
                total: Number(totalNeto),
                clienteId: rawData.clienteId
            });

            await enviarWhatsAppFactura({
                empresaId,
                clienteId: rawData.clienteId,
                facturaId: invoice.id,
                numeroFactura: invoice.numeroCompleto,
                total: Number(totalNeto)
            });
        });

        revalidatePath('/invoices');
        return {
            success: true,
            invoice: {
                id: invoice.id,
                numeroCompleto: invoice.numeroCompleto,
                totalNeto: totalNeto
            }
        };

    } catch (error) {
        console.error('POS Checkout Error:', error);
        return { success: false, error: 'Error al crear la factura POS. Por favor intente nuevamente.' };
    }
}
