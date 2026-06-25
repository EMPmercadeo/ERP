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
        await prisma.factura.create({
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

    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error al crear la factura. ' + (error instanceof Error ? error.message : ''),
        };
    }

    revalidatePath('/invoices');
    redirect('/invoices');
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
