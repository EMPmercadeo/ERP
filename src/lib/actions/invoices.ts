'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { prisma } from '@/lib/db';
import { InvoiceSchema } from '@/lib/validations';

import { getTenantContext } from '@/lib/auth/context';
import { generarAsientoCobro } from '@/lib/contabilidad/asientos';
import { timbrarFacturaDGI } from './billing-fe';
import { dispatchWebhookEvent } from '@/lib/integrations/webhooks';
import { enviarWhatsAppFactura } from '@/lib/integrations/whatsapp';
import { crearFacturaCompleta, FacturaCreationError } from '@/lib/services/invoiceCreation';

// Kill-switch de seguridad: el PAC (GenericoPACProvider) hoy no tiene ninguna integración real y
// solo lanza errores (ver generico.provider.ts). Esta bandera además impide invocarlo del todo
// aunque alguien active ConfiguracionFacturacionElectronica.activo por error o a propósito — no
// existe PAC_INTEGRATION_ENABLED en ningún .env todavía, a propósito, hasta que haya un PAC real.
const PAC_INTEGRATION_ENABLED = process.env.PAC_INTEGRATION_ENABLED === 'true';

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
        const metodoPago = (formData.get('metodoPago') as string) || undefined;

        const invoice = await crearFacturaCompleta({
            empresaId,
            userId,
            clienteId: data.clienteId,
            condicionPago: data.condicionPago,
            metodoPago,
            bodegaId: data.bodegaId ?? null,
            items: data.items
        });

        // Si la facturación electrónica está configurada y activa, timbrar en background
        const feConfig = await prisma.configuracionFacturacionElectronica.findUnique({
            where: { empresaId }
        });
        if (PAC_INTEGRATION_ENABLED && feConfig && feConfig.activo) {
            await prisma.factura.update({
                where: { id: invoice.id },
                data: { estadoDgi: 'pendiente' }
            });
        }

        // Tareas en background (timbrado DGI, webhook saliente, WhatsApp): after() garantiza que
        // Next.js las ejecute tras enviar la respuesta, incluso en runtimes serverless donde el
        // proceso puede congelarse justo después del redirect() de más abajo.
        after(async () => {
            if (PAC_INTEGRATION_ENABLED && feConfig && feConfig.activo) {
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
        if (error instanceof FacturaCreationError) {
            return { message: error.message };
        }
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

        const invoice = await crearFacturaCompleta({
            empresaId,
            userId,
            clienteId: rawData.clienteId,
            condicionPago: rawData.condicionPago,
            metodoPago: rawData.metodoPago,
            bodegaId: rawData.bodegaId ?? null,
            items: rawData.items
        });

        // Si la facturación electrónica está configurada y activa, timbrar en background
        const feConfig = await prisma.configuracionFacturacionElectronica.findUnique({
            where: { empresaId }
        });
        if (PAC_INTEGRATION_ENABLED && feConfig && feConfig.activo) {
            await prisma.factura.update({
                where: { id: invoice.id },
                data: { estadoDgi: 'pendiente' }
            });
        }

        // Tareas en background (timbrado DGI, webhook saliente, WhatsApp): after() garantiza que
        // Next.js las ejecute tras enviar la respuesta, incluso en runtimes serverless.
        after(async () => {
            if (PAC_INTEGRATION_ENABLED && feConfig && feConfig.activo) {
                await timbrarFacturaDGI(invoice.id);
            }

            await dispatchWebhookEvent(empresaId, 'factura.creada', {
                facturaId: invoice.id,
                numeroFactura: invoice.numeroCompleto,
                total: Number(invoice.totalNeto),
                clienteId: rawData.clienteId
            });

            await enviarWhatsAppFactura({
                empresaId,
                clienteId: rawData.clienteId,
                facturaId: invoice.id,
                numeroFactura: invoice.numeroCompleto,
                total: Number(invoice.totalNeto)
            });
        });

        revalidatePath('/invoices');
        return {
            success: true,
            invoice: {
                id: invoice.id,
                numeroCompleto: invoice.numeroCompleto,
                totalNeto: Number(invoice.totalNeto)
            }
        };

    } catch (error) {
        if (error instanceof FacturaCreationError) {
            return { success: false, error: error.message };
        }
        console.error('POS Checkout Error:', error);
        return { success: false, error: 'Error al crear la factura POS. Por favor intente nuevamente.' };
    }
}
