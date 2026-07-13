'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getTenantContext } from '@/lib/auth/context';

// Antes esta función resolvía la empresa con prisma.empresa.findFirst() en vez de leer la
// sesión — cualquier importación (de cualquier usuario, de cualquier empresa) se pegaba
// siempre a la primera fila de la tabla Empresa, mezclando clientes entre tenants distintos.
export async function importClients(clients: Record<string, string>[]) {
    try {
        const { empresaId } = await getTenantContext();

        let createdCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < clients.length; i++) {
            const row = clients[i];
            // Fila visible para el usuario: +1 por índice 0-based, +1 por la fila de encabezado.
            const fila = i + 2;
            try {
                // Expected Row: { ruc, razonSocial, email, telefono, direccion }
                const ruc = row.ruc?.trim();
                if (!ruc) {
                    errors.push(`Fila ${fila}: sin RUC, se omitió.`);
                    continue;
                }

                const exists = await prisma.cliente.findFirst({
                    where: { empresaId, ruc: ruc }
                });

                if (exists) {
                    errors.push(`Fila ${fila}: el RUC ${ruc} ya existe (${exists.razonSocial}), se omitió.`);
                    continue;
                }

                await prisma.cliente.create({
                    data: {
                        empresaId,
                        ruc: ruc,
                        razonSocial: row.razonSocial || 'Sin Nombre',
                        tipoRuc: ruc.includes('-') ? '01' : '02',
                        email: row.email || null,
                        telefono: row.telefono || null,
                        direccion: row.direccion || null,
                        estado: 'activo'
                    }
                });
                createdCount++;

            } catch (err) {
                console.error('Error importing client row:', row, err);
                errors.push(`Fila ${fila}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            }
        }

        revalidatePath('/clients');
        return { success: true, count: createdCount, errors };

    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Failed to process import' };
    }
}
