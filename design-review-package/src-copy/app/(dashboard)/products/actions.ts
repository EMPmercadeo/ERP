'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';

export async function importProducts(products: any[]) {
    try {
        const { empresaId, userId } = await getTenantContext();

        let createdCount = 0;
        let errors: string[] = [];

        for (let i = 0; i < products.length; i++) {
            const row = products[i];
            const rowNum = i + 2; // Row number in file excluding header
            try {
                const codigo = row.codigo?.toString().trim();
                const descripcion = row.descripcion?.toString().trim();
                const costoStr = row.costo?.toString().trim();
                const precioStr = row.precio?.toString().trim();
                const itbms = row.itbms?.toString().trim();
                const unidad = row.unidad?.toString().trim() || 'UND';

                // Basic Validations
                if (!codigo) {
                    errors.push(`Fila ${rowNum}: El Código es requerido.`);
                    continue;
                }
                if (!descripcion) {
                    errors.push(`Fila ${rowNum} [Cód: ${codigo}]: La Descripción es requerida.`);
                    continue;
                }

                const price = parseFloat(precioStr || '0');
                if (isNaN(price) || price < 0) {
                    errors.push(`Fila ${rowNum} [Cód: ${codigo}]: Precio de venta inválido.`);
                    continue;
                }

                const cost = parseFloat(costoStr || '0');
                if (isNaN(cost) || cost < 0) {
                    errors.push(`Fila ${rowNum} [Cód: ${codigo}]: Costo unitario inválido.`);
                    continue;
                }

                // ITBMS tax code validation ('00'=0%, '01'=7%, '02'=10%, '03'=15%)
                const validItbmsRates = ['00', '01', '02', '03'];
                let formattedItbms = '01'; // Default 7%

                if (itbms) {
                    // Match rates
                    const cleanItbms = itbms.toLowerCase().replace(/%/g, '').trim();
                    if (cleanItbms === '0' || cleanItbms === 'exento' || cleanItbms === '00') {
                        formattedItbms = '00';
                    } else if (cleanItbms === '7' || cleanItbms === '07' || cleanItbms === '01') {
                        formattedItbms = '01';
                    } else if (cleanItbms === '10' || cleanItbms === '02') {
                        formattedItbms = '02';
                    } else if (cleanItbms === '15' || cleanItbms === '03') {
                        formattedItbms = '03';
                    } else {
                        errors.push(`Fila ${rowNum} [Cód: ${codigo}]: Tasa ITBMS inválida (${itbms}). Usar 00 (Exento), 01 (7%), 02 (10%), o 03 (15%).`);
                        continue;
                    }
                }

                const exists = await prisma.producto.findFirst({
                    where: { empresaId, codigoInterno: codigo }
                });

                if (exists) {
                    errors.push(`Fila ${rowNum} [Cód: ${codigo}]: Código duplicado. El producto ya existe.`);
                    continue;
                }

                // Save in transaction with Audit log
                await prisma.$transaction(async (tx) => {
                    const prod = await tx.producto.create({
                        data: {
                            empresaId,
                            codigoInterno: codigo,
                            descripcion: descripcion,
                            costoUnitario: cost,
                            precioVenta: price,
                            codigoTasaItbms: formattedItbms,
                            activo: true,
                            unidadMedida: unidad,
                            stockActual: 0,
                            stockMinimo: 0
                        }
                    });

                    // Audit Log
                    await tx.auditoria.create({
                        data: {
                            usuarioId: userId,
                            entidad: 'Producto',
                            entidadId: prod.id,
                            accion: 'crear',
                            datosDespues: JSON.parse(JSON.stringify({
                                ...prod,
                                costoUnitario: prod.costoUnitario.toNumber(),
                                precioVenta: prod.precioVenta.toNumber()
                            }))
                        }
                    });
                });

                createdCount++;
            } catch (err) {
                console.error(`Error importing row ${rowNum}:`, err);
                errors.push(`Fila ${rowNum}: ${err instanceof Error ? err.message : 'Error desconocido al insertar.'}`);
            }
        }

        revalidatePath('/products');
        return { success: errors.length === 0 || createdCount > 0, count: createdCount, errors };

    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Error al procesar la importación' };
    }
}
