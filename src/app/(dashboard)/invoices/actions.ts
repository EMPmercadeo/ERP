'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';

// Antes esta función resolvía la empresa con prisma.empresa.findFirst() en vez de leer la
// sesión — cualquier importación se pegaba siempre a la primera fila de la tabla Empresa,
// mezclando facturas entre tenants distintos. Ahora empresaId sale de getTenantContext().
export async function importInvoices(invoices: Record<string, string>[]) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const sucursal = await prisma.sucursal.findFirst({ where: { empresaId } });
        const caja = await prisma.caja.findFirst({ where: { sucursalId: sucursal?.id } });
        const usuario = await prisma.usuario.findFirst({ where: { id: userId, empresaId } });

        if (!sucursal || !caja || !usuario) {
            return { success: false, error: 'No configuration found (Company/Branch/Box)' };
        }

        let createdCount = 0;
        const errors: string[] = [];

        for (const row of invoices) {
            try {
                // Expected Row: { numero, fecha, ruc, cliente, total, estado }
                const ruc = row.ruc || '9999-9999';
                const nombreCliente = row.cliente || 'Consumidor Final';
                const total = parseFloat(row.total || '0');
                const fecha = row.fecha ? new Date(row.fecha) : new Date();

                // 2. Find or Create Client
                let cliente = await prisma.cliente.findFirst({
                    where: { empresaId, ruc: ruc }
                });

                if (!cliente) {
                    cliente = await prisma.cliente.create({
                        data: {
                            empresaId,
                            ruc: ruc,
                            razonSocial: nombreCliente,
                            tipoRuc: ruc.includes('-') ? '01' : '02', // Simple heuristic
                            direccion: 'Ciudad de Panamá',
                        }
                    });
                }

                // 3. Create Invoice
                // We need a dummy product for the line item
                let producto = await prisma.producto.findFirst({ where: { empresaId } });
                if (!producto) {
                    producto = await prisma.producto.create({
                        data: {
                            empresaId,
                            codigoInterno: 'SERV-01',
                            descripcion: 'Servicios Generales',
                            costoUnitario: 0,
                            precioVenta: 1.00,
                            codigoTasaItbms: '00', // Exento by default for import simplicity
                        }
                    });
                }

                // Prepare totals (assuming tax included or 0 tax for simplicity of import)
                const subtotal = total;
                const tax = 0;

                await prisma.factura.create({
                    data: {
                        empresaId,
                        sucursalId: sucursal.id,
                        cajaId: caja.id,
                        clienteId: cliente.id,
                        creadorId: usuario.id,
                        tipoDocumento: 'FE',
                        numeroSecuencial: Date.now(), // Fallback unique
                        numeroCompleto: row.numero || `IMP-${Date.now()}`,
                        fechaEmision: fecha,
                        subtotal: subtotal,
                        totalItbms: tax,
                        totalNeto: total,
                        saldoPendiente: row.estado === 'pagada' ? 0 : total,
                        estadoDgi: row.estado === 'pagada' ? 'aceptada' : 'borrador', // Mapping 'pagada' to 'aceptada' roughly
                        items: {
                            create: {
                                productoId: producto.id,
                                descripcion: 'Importado: ' + (row.descripcion || 'Ventas varias'),
                                cantidad: 1,
                                precioUnitario: subtotal,
                                costoUnitario: 0,
                                montoItbms: tax,
                                montoTotal: total,
                                codigoTasaItbms: '00'
                            }
                        }
                    }
                });
                createdCount++;

            } catch (err) {
                console.error('Error importing row:', row, err);
                errors.push(`Row ${row.numero}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        revalidatePath('/invoices');
        return { success: true, count: createdCount, errors };

    } catch (error) {
   