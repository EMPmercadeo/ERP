'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function importClients(clients: any[]) {
    try {
        const empresa = await prisma.empresa.findFirst();

        if (!empresa) {
            return { success: false, error: 'No configuration found (Company)' };
        }

        let createdCount = 0;
        let errors = [];

        for (const row of clients) {
            try {
                // Expected Row: { ruc, razonSocial, email, telefono, direccion }
                const ruc = row.ruc;
                if (!ruc) continue;

                const exists = await prisma.cliente.findFirst({
                    where: { empresaId: empresa.id, ruc: ruc }
                });

                if (!exists) {
                    await prisma.cliente.create({
                        data: {
                            empresaId: empresa.id,
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
        return { success: true, count: createdCount, errors };

    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Failed to process import' };
    }
}
