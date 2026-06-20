'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function importInvoices(invoices: any[]) {
    try {
        // 1. Get default context (Empresa, Sucursal, Caja, Usuario)
        // In a real app, this should come from session/auth
        const empresa = await prisma.empresa.findFirst();
        const sucursal = await prisma.sucursal.findFirst({ where: { empresaId: empresa?.id } });
        const caja = await prisma.caja.findFirst({ where: { sucursalId: sucursal?.id } });
        const usuario = await prisma.usuario.findFirst({ where: { empresaId: empresa?.id } });

        if (!empresa || !sucursal || !caja || !usuario) {
            return { success: false, error: 'No configuration found (Company/Branch/Box)' };
        }

        let createdCount = 0;
        let errors = [];

        for (const row of invoices) {
            try {
                // Expected Row: { numero, fecha, ruc, cliente, total, estado }
                const ruc = row.ruc || '9999-9999';
                const nombreCliente = row.cliente || 'Consumidor Final';
                const total = parseFloat(row.total || '0');
                const fecha = row.fecha ? new Date(row.fecha) : new Date();

                // 2. Find or Create Client
                let cliente = await prisma.cliente.findFirst({
                    where: { empresaId: empresa.id, ruc: ruc }
                });

                if (!cliente) {
                    cliente = await prisma.cliente.create({
                        data: {
                            empresaId: empresa.id,
                            ruc: ruc,
                            razonSocial: nombreCliente,
                            tipoRuc: ruc.includes('-') ? '01' : '02', // Simple heuristic
                            direccion: 'Ciudad de Panamá',
                        }
                    });
                }

                // 3. Create Invoice
                // We need a dummy product for the line item
                let producto = await prisma.producto.findFirst({ where: { empresaId: empresa.id } });
                if (!producto) {
                    producto = await prisma.producto.create({
                        data: {
                            empresaId: empresa.id,
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
                        empresaId: empresa.id,
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
        console.error('Import failed', error);
        return { success: false, error: 'Failed to process import' };
    }
}
