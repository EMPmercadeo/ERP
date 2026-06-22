'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { InvoiceSchema } from '@/lib/validations';

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

async function getDefaults() {
    const company = await prisma.empresa.findFirst({
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
        const { empresa, sucursal, caja } = await getDefaults();

        // Check monthly document consumption limits
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const invoiceCount = await prisma.factura.count({
            where: {
                empresaId: empresa.id,
                fechaEmision: {
                    gte: startOfMonth
                }
            }
        });

        if (empresa.planType === 'free' && invoiceCount >= 10) {
            return {
                message: 'Límite de documentos excedido para tu plan. Actualiza tu plan en Configuración > Planes y Facturación para continuar.'
            };
        }

        if (empresa.planType === 'pro' && invoiceCount >= 500) {
            return {
                message: 'Límite de documentos excedido para tu plan. Actualiza tu plan en Configuración > Planes y Facturación para continuar.'
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
                creadorId: (await prisma.usuario.findFirst())?.id || '',

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
                    create: data.items.map(item => ({
                        productoId: item.productoId,
                        descripcion: item.descripcion,
                        cantidad: item.cantidad,
                        precioUnitario: item.precioUnitario,
                        costoUnitario: 0,
                        codigoTasaItbms: item.codigoTasaItbms,
                        montoItbms: item.cantidad * item.precioUnitario * (item.codigoTasaItbms === '01' ? 0.07 : 0),
                        montoTotal: item.cantidad * item.precioUnitario * (1 + (item.codigoTasaItbms === '01' ? 0.07 : 0))
                    }))
                }
            }
        });

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
        const invoice = await prisma.factura.findUnique({
            where: { id }
        });

        if (!invoice) {
            return { success: false, message: 'Factura no encontrada.' };
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
