'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { canCreateInvoice, incrementDocumentUsage } from '@/lib/actions/billing';
import { getEmpresaDefaults } from '@/lib/services/invoiceCreation';

export interface CreditNoteItemInput {
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    codigoTasaItbms: string;
}

export async function getInvoicesForCreditNote() {
    try {
        const { empresaId } = await getTenantContext();
        const invoices = await prisma.factura.findMany({
            where: {
                empresaId,
                estadoDgi: {
                    in: ['aceptada', 'pagada', 'borrador', 'pendiente']
                },
                tipoDocumento: {
                    not: '04' // Exclude other credit notes
                }
            },
            include: {
                cliente: true,
                items: {
                    include: {
                        producto: true
                    }
                }
            },
            orderBy: {
                fechaEmision: 'desc'
            },
            take: 50
        });

        return invoices.map((inv) => ({
            id: inv.id,
            numeroCompleto: inv.numeroCompleto,
            fechaEmision: inv.fechaEmision,
            subtotal: Number(inv.subtotal),
            totalDescuento: Number(inv.totalDescuento),
            totalItbms: Number(inv.totalItbms),
            totalNeto: Number(inv.totalNeto),
            cufe: inv.cufe || null,
            cliente: {
                id: inv.cliente.id,
                razonSocial: inv.cliente.razonSocial,
                ruc: inv.cliente.ruc
            },
            items: inv.items.map((it) => ({
                id: it.id,
                productoId: it.productoId,
                descripcion: it.descripcion,
                cantidad: Number(it.cantidad),
                precioUnitario: Number(it.precioUnitario),
                descuento: Number(it.descuento || 0),
                codigoTasaItbms: it.codigoTasaItbms,
                montoItbms: Number(it.montoItbms),
                montoTotal: Number(it.montoTotal)
            }))
        }));
    } catch (error) {
        console.error('Error fetching invoices for credit note:', error);
        return [];
    }
}

async function getNextCreditNoteSequence(empresaId: string, sucursalId: string, cajaId: string) {
    return await prisma.$transaction(async (tx) => {
        const sequence = await tx.secuencia.findUnique({
            where: {
                empresaId_sucursalId_cajaId_tipoDocumento: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: '04'
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
                    tipoDocumento: '04',
                    ultimoNumero: nextNumber
                }
            });
        }

        return nextNumber;
    });
}

export async function createCreditNote(prevState: unknown, formData: FormData) {
    const rawItems = formData.get('items');
    let items: CreditNoteItemInput[] = [];
    if (rawItems) {
        try {
            items = JSON.parse(rawItems as string);
        } catch {
            return { success: false, message: 'Formato de ítems inválido.' };
        }
    }

    if (!items || items.length === 0) {
        return { success: false, message: 'La nota de crédito debe contener al menos un ítem para devolución.' };
    }

    const facturaOrigenId = (formData.get('facturaOrigenId') as string) || null;
    const cufeReferencia = (formData.get('cufeReferencia') as string) || null;
    const motivoDgi = (formData.get('motivoDgi') as string) || '01 - Anulación total de la operación';
    const clienteId = formData.get('clienteId') as string;

    if (!facturaOrigenId && !cufeReferencia) {
        return { success: false, message: 'Debe seleccionar una factura original o ingresar un CUFE de referencia.' };
    }

    if (cufeReferencia && !/^[a-fA-F0-9]{66}$/.test(cufeReferencia)) {
        return { success: false, message: 'El CUFE de referencia debe tener exactamente 66 caracteres hexadecimales.' };
    }

    let redirectUrl = '/credit-notes';
    try {
        const { empresaId, userId } = await getTenantContext();
        const { empresa, sucursal, caja } = await getEmpresaDefaults(empresaId);

        const hasRemainingDocs = await canCreateInvoice(empresaId);
        if (!hasRemainingDocs) {
            return { success: false, message: 'Has alcanzado el límite mensual de documentos electrónicos de tu plan.' };
        }

        let targetClienteId = clienteId;
        if (!targetClienteId && facturaOrigenId) {
            const origInv = await prisma.factura.findFirst({ where: { id: facturaOrigenId, empresaId } });
            if (origInv) targetClienteId = origInv.clienteId;
        }

        if (!targetClienteId) {
            const defaultClient = await prisma.cliente.findFirst({ where: { empresaId } });
            if (!defaultClient) {
                return { success: false, message: 'No se especificó un cliente válido para la nota de crédito.' };
            }
            targetClienteId = defaultClient.id;
        }

        const isFiscal = empresa.fiscalEnabled && empresa.planType !== 'free';
        const prefix = isFiscal ? 'NC' : 'RNC';

        const numeroSecuencial = await getNextCreditNoteSequence(empresa.id, sucursal.id, caja.id);
        const numeroCompleto = isFiscal
            ? `${prefix}-001-001-04-${String(numeroSecuencial).padStart(8, '0')}`
            : `${prefix}-${String(numeroSecuencial).padStart(8, '0')}`;

        const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
        const totalDescuento = items.reduce((sum, item) => sum + (item.descuento || 0), 0);
        const totalItbms = items.reduce((sum, item) => {
            const tasa = item.codigoTasaItbms === '01' ? 0.07 : item.codigoTasaItbms === '02' ? 0.10 : item.codigoTasaItbms === '03' ? 0.15 : 0;
            const montoBruto = item.cantidad * item.precioUnitario;
            const montoNeto = Math.max(0, montoBruto - (item.descuento || 0));
            return sum + (montoNeto * tasa);
        }, 0);
        const totalNeto = subtotal - totalDescuento + totalItbms;

        // Resolve products
        const processedItems = await Promise.all(items.map(async (item) => {
            let producto = await prisma.producto.findFirst({
                where: { id: item.productoId, empresaId }
            });
            if (!producto) {
                producto = await prisma.producto.findFirst({ where: { empresaId } });
            }
            if (!producto) {
                producto = await prisma.producto.create({
                    data: {
                        empresaId,
                        codigoInterno: 'NC-GEN',
                        descripcion: 'Ítem de Devolución / Nota de Crédito',
                        costoUnitario: 0,
                        precioVenta: 0,
                        codigoTasaItbms: '00'
                    }
                });
            }

            const tasa = item.codigoTasaItbms === '01' ? 0.07 : item.codigoTasaItbms === '02' ? 0.10 : item.codigoTasaItbms === '03' ? 0.15 : 0;
            const montoBruto = item.cantidad * item.precioUnitario;
            const montoNeto = Math.max(0, montoBruto - (item.descuento || 0));
            const montoItbmsItem = montoNeto * tasa;
            const montoTotalItem = montoNeto + montoItbmsItem;

            return {
                productoId: producto.id,
                descripcion: item.descripcion || producto.descripcion,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                costoUnitario: 0,
                descuento: item.descuento || 0,
                codigoTasaItbms: item.codigoTasaItbms,
                montoItbms: montoItbmsItem,
                montoTotal: montoTotalItem
            };
        }));

        const creditNote = await prisma.factura.create({
            data: {
                empresaId,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: targetClienteId,
                creadorId: userId,
                tipoDocumento: '04',
                numeroSecuencial,
                numeroCompleto,
                fechaEmision: new Date(),
                subtotal,
                totalDescuento,
                totalItbms,
                totalNeto,
                totalPagado: 0,
                saldoPendiente: 0,
                estadoDgi: isFiscal ? 'pendiente' : 'aceptada',
                facturaOrigenId: facturaOrigenId || null,
                motivoAnulacion: `${motivoDgi} | Ref: ${cufeReferencia || (facturaOrigenId ? 'Factura del Sistema' : 'N/A')}`,
                items: {
                    create: processedItems
                }
            }
        });

        await incrementDocumentUsage(empresaId);

        // Si es anulación total y hay factura origen, actualizar la factura original
        if (facturaOrigenId && motivoDgi.startsWith('01')) {
            await prisma.factura.update({
                where: { id: facturaOrigenId },
                data: {
                    estadoDgi: 'anulada',
                    saldoPendiente: 0
                }
            });
        }

        redirectUrl = `/invoices?created_nc=true&id=${creditNote.id}&num=${encodeURIComponent(creditNote.numeroCompleto)}&total=${creditNote.totalNeto}`;

    } catch (error) {
        console.error('Error creating credit note:', error);
        return { success: false, message: 'Error al generar la Nota de Crédito Fiscal. Intente nuevamente.' };
    }

    revalidatePath('/invoices');
    revalidatePath('/credit-notes');
    redirect(redirectUrl);
}
