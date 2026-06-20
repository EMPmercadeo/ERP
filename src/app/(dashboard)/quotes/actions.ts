'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function importQuotes(quotes: any[]) {
    try {
        const empresa = await prisma.empresa.findFirst();
        const sucursal = await prisma.sucursal.findFirst({ where: { empresaId: empresa?.id } });
        const caja = await prisma.caja.findFirst({ where: { sucursalId: sucursal?.id } }); // Quotes linked to box/branch? Yes per schema
        const usuario = await prisma.usuario.findFirst({ where: { empresaId: empresa?.id } });

        if (!empresa || !sucursal || !usuario || !caja) {
            return { success: false, error: 'No configuration found (Company/Branch/User/Box)' };
        }

        let createdCount = 0;
        let errors = [];

        for (const row of quotes) {
            try {
                // Expected Row: { numero, fecha, cliente, total, estado }
                // RUC optional if we just use name match or default
                const numero = row.numero;
                if (!numero) continue;

                const clienteNombre = row.cliente || 'Desconocido';

                let cliente = await prisma.cliente.findFirst({
                    where: { empresaId: empresa.id, razonSocial: clienteNombre }
                });

                if (!cliente) {
                    cliente = await prisma.cliente.create({
                        data: {
                            empresaId: empresa.id,
                            ruc: '9999-9999-imp',
                            razonSocial: clienteNombre,
                            tipoRuc: '02'
                        }
                    });
                }

                // Dummy product
                let producto = await prisma.producto.findFirst({ where: { empresaId: empresa.id } });
                if (!producto) {
                    producto = await prisma.producto.create({
                        data: {
                            empresaId: empresa.id,
                            codigoInterno: 'SERV-IMP',
                            descripcion: 'Servicio Generico',
                            costoUnitario: 0,
                            precioVenta: 1,
                            codigoTasaItbms: '00'
                        }
                    });
                }

                await prisma.cotizacion.create({
                    data: {
                        empresaId: empresa.id,
                        sucursalId: sucursal.id,
                        cajaId: caja.id,
                        clienteId: cliente.id,
                        creadorId: usuario.id,
                        numero: numero,
                        fechaEmision: row.fecha ? new Date(row.fecha) : new Date(),
                        validaHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                        subtotal: parseFloat(row.total || '0'),
                        totalItbms: 0,
                        totalNeto: parseFloat(row.total || '0'),
                        estado: row.estado || 'borrador',
                        items: {
                            create: {
                                productoId: producto.id,
                                descripcion: 'Importado: Cotización General',
                                cantidad: 1,
                                precioUnitario: parseFloat(row.total || '0'),
                                montoItbms: 0,
                                montoTotal: parseFloat(row.total || '0'),
                                codigoTasaItbms: '00'
                            }
                        }
                    }
                });
                createdCount++;

            } catch (err) {
                console.error('Error importing quote row:', row, err);
                errors.push(`Cotizacion ${row.numero}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        revalidatePath('/quotes');
        return { success: true, count: createdCount, errors };

    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Failed to process import' };
    }
}

export async function updateQuoteStatus(id: string, status: string) {
    try {
        await prisma.cotizacion.update({
            where: { id },
            data: { estado: status }
        });
        revalidatePath('/quotes');
        return { success: true };
    } catch (error) {
        console.error('Error updating quote status:', error);
        return { success: false, error: 'Failed to update quote status' };
    }
}
