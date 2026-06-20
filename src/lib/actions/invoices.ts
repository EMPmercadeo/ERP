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
