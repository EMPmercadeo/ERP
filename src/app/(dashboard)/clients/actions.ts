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

        for (const row of clients) {
            try {
                // Expected Row: { ruc, razonSocial, email, telefono, direccion }
                const ruc = row.ruc;
                if (!ruc) continue;

                const exists = await prisma.cliente.findFirst({
                    where: { empresaId, ruc: ruc }
                });

                if (!exists) {
                    await prisma.cliente.create({
                        data: {
                            empresaId,
                            ruc: ruc,
                            razonSocial: row.razonSocial || 'Sin Nombre',
                            tipoRuc: ruc.includes('-') ? '01' : '02',
                            email: row.email,
                            telefono: row.telefono,
                            direccion: row.direccion,
                            estado: 'activo'
                        }
                    });
                    createdCount++;
                }

            } catch (err) {
                console.error('Error importing client row:', row, err);
                errors.push(`RUC ${row.ruc}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        revalidatePath('/clients');
        return { success: 