'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';

// Antes esta función resolvía la empresa con prisma.empresa.findFirst() en vez de leer la
// sesión — cualquier importación se pegaba siempre a la primera fila de la tabla Empresa,
// mezclando cotizaciones entre tenants distintos. Ahora empresaId sale de getTenantContext().
export async function importQuotes(quotes: Record<string, string>[]) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const sucursal = await prisma.sucursal.findFirst({ where: { empresaId } });
        const caja = await prisma.caja.findFirst({ where: { sucursalId: sucursal?.id } }); // Quotes linked to box/branch? Yes per schema
        const usuario = await prisma.usuario.findFirst({ where: { id: userId, empresaId } });

        if (!sucursal || !usuario || !caja) {
            return { success: false, error: 'No configuration found (Company/Branch/User/Box)' };
        }

        let createdCount = 0;
        const errors: string[] = [];

        for (const row of quotes) {
            try {
                // Expected Row: { numero, fecha, cliente, total, estado }
                // RUC optional if we just use name match or default
                const numero = row.numero;
                if (!numero) continue;

                const clienteNombre = row.cliente || 'Desconocido';

                let cliente = await prisma.cliente.findFirst({
                    where: { empresaId, razonSocial: clienteNombre }
                });

                if (!cliente) {
                    cliente = await prisma.cliente.create({
                        data: {
                            empresaId,
                            ruc: '9999-9999-imp',
                            razonSocial: clienteNombre,
                            tipoRuc: '02'
                        }
                    });
                }

                // Dummy product
                let producto = await prisma.producto.findFirst({ where: { empresaId } });
                if (!producto) {
                    producto = await prisma.producto.create({
                        data: {
                            empresaId,
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
                        empresaId,
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

// Antes esta función no validaba empresaId en absoluto: cualquier usuario autenticado podía
// cambiar el estado de la cotización de OTRA empresa con solo adivinar/observar su id