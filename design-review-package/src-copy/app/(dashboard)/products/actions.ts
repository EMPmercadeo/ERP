'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function importProducts(products: any[]) {
    try {
        const empresa = await prisma.empresa.findFirst();

        if (!empresa) {
            return { success: false, error: 'No configuration found (Company)' };
        }

        let createdCount = 0;
        let errors = [];

        for (const row of products) {
            try {
                // Expected Row: { codigo, descripcion, costo, precio, itbms }
                const codigo = row.codigo;
                if (!codigo) continue;

                const exists = await prisma.producto.findFirst({
                    where: { empresaId: empresa.id, codigoInterno: codigo }
                });

                if (!exists) {
                    await prisma.producto.create({
                        data: {
                            empresaId: empresa.id,
                            codigoInterno: codigo,
                            descripcion: row.descripcion || 'Sin Descripción',
                            costoUnitario: parseFloat(row.costo || '0'),
                            precioVenta: parseFloat(row.precio || '0'),
                            codigoTasaItbms: row.itbms || '01', // 01=7% default? or 00?
                            activo: true,
                            unidadMedida: 'UND'
                        }
                    });
                    createdCount++;
                }

            } catch (err) {
                console.error('Error importing product row:', row, err);
                errors.push(`Codigo ${row.codigo}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        revalidatePath('/products');
        return { success: true, count: createdCount, errors };

    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Failed to process import' };
    }
}
