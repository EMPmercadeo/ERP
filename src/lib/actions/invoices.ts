'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { InvoiceSchema } from '@/lib/validations';

import { getTenantContext } from '@/lib/auth/context';
import { canCreateInvoice, incrementDocumentUsage } from '@/lib/actions/billing';

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

export async function createInvoice(prevState: any, formData: FormData) {
    const rawItems = formData.get('items');
    const items = rawItems ? JSON.parse(rawItems as string) : [];

    const rawData = {
        clienteId: formData.get('clienteId'),
        condicionPago: formData.get('condicionPago'),
        observaciones: formData.get('observaciones'),
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

        // Calculate totals
        const subtotal = data.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
        const totalItbms = data.items.reduce((sum, item) => {
            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                item.codigoTasaItbms === '02' ? 0.10 :
                    item.codigoTasaItbms === '03' ? 0.15 : 0;
            return sum + (item.cantidad * item.precioUnitario * tasa);
        }, 0);
        const totalNeto = subtotal + totalItbms;

        // Create Invoice with items
        const invoice = await prisma.factura.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: data.clienteId,
                creadorId: userId,

                tipoDocumento: tipoDoc,
                numeroSecuencial,
                numeroCompleto, // Generated based on Tier

                subtotal,
                totalItbms,
                totalNeto,
                saldoPendiente: data.condicionPago === 'contado' ? 0 : totalNeto,
                totalPagado: data.condicionPago === 'contado' ? totalNeto : 0,

                estadoDgi: isFiscal ? 'pendiente' : 'local', // 'local' avoids DGI triggers

                items: {
                    create: data.items.map(item => {
                        const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                            item.codigoTasaItbms === '02' ? 0.10 :
                                item.codigoTasaItbms === '03' ? 0.15 : 0;
                        return {
                            productoId: item.productoId,
                            descripcion: item.descripcion,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            costoUnitario: 0,
                            codigoTasaItbms: item.codigoTasaItbms,
                            montoItbms: item.cantidad * item.precioUnitario * tasa,
                            montoTotal: item.cantidad * item.precioUnitario * (1 + tasa)
                        };
                    })
                }
            }
        });

        // Increment monthly document usage
        await incrementDocumentUsage(empresaId);
        
        redirectUrl = `/invoices?created=true&id=${invoice.id}&num=${encodeURIComponent(invoice.numeroCompleto)}&total=${invoice.totalNeto}`;

    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error al crear la factura. ' + (error instanceof Error ? error.message : ''),
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
        return { success: false, message: 'Error al intentar anular la factura. ' + (error instanceof Error ? error.message : '') };
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
                remainingSaldo: newSaldo 
            };
        });

        if (result.success) {
            revalidatePath('/invoices');
            revalidatePath('/receivables');
        }
        return result;

    } catch (error) {
        console.error('Record payment error:', error);
        return { 
            success: false, 
            error: 'Error al intentar registrar el pago. ' + (error instanceof Error ? error.message : '') 
        };
    }
}

export async function createInvoicePOS(rawData: {
    clienteId: string;
    condicionPago: string;
    metodoPago?: string;
    observaciones?: string;
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

        // Create Invoice
        const invoice = await prisma.factura.create({
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
                            costoUnitario: 0,
                            codigoTasaItbms: item.codigoTasaItbms,
                            montoItbms: item.cantidad * item.precioUnitario * tasa,
                            montoTotal: item.cantidad * item.precioUnitario * (1 + tasa)
                        };
                    })
                }
            }
        });

        // Update stock
        for (const item of rawData.items) {
            await prisma.producto.update({
                where: { id: item.productoId },
                data: {
                    stockActual: {
                        decrement: item.cantidad
                    }
                }
            });
        }

        // If payment is made, record it in Pago model
        if (rawData.condicionPago === 'contado') {
            await prisma.pago.create({
                data: {
                    empresaId,
                    facturaId: invoice.id,
                    clienteId: rawData.clienteId,
                    usuarioId: userId,
                    monto: totalNeto,
                    metodoPago: rawData.metodoPago || 'efectivo',
                    montoAplicado: totalNeto,
                }
            });
        }

        // Increment usage
        await incrementDocumentUsage(empresaId);

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
        return { success: false, error: 'Error de base de datos: ' + (error instanceof Error ? error.message : '') };
    }
}
