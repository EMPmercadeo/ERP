'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/context';

// Antes esta función resolvía la empresa con prisma.empresa.findFirst() en vez de leer la
// sesión — cualquier importación (de cualquier usuario, de cualquier empresa) se pegaba
// siempre a la primera fila de la tabla Empresa, mezclando clientes entre tenants distintos.
export async function importClients(clients: Record<string, string>[]) {
    try {
        const { empresaId } = await requireAuth();

        const errors: string[] = [];
        const validRucs = clients
            .map(c => c.ruc?.trim())
            .filter((r): r is string => Boolean(r));

        const existingClients = validRucs.length > 0
            ? await prisma.cliente.findMany({
                where: { empresaId, ruc: { in: validRucs } },
                select: { ruc: true, razonSocial: true }
            })
            : [];

        const existingMap = new Map(existingClients.map(c => [c.ruc, c.razonSocial]));
        const seenInBatch = new Set<string>();
        const toCreate: {
            empresaId: string;
            ruc: string;
            razonSocial: string;
            tipoRuc: string;
            email: string | null;
            telefono: string | null;
            direccion: string | null;
            estado: string;
        }[] = [];

        for (let i = 0; i < clients.length; i++) {
            const row = clients[i];
            const fila = i + 2;
            const ruc = row.ruc?.trim();
            if (!ruc) {
                errors.push(`Fila ${fila}: sin RUC, se omitió.`);
                continue;
            }

            if (existingMap.has(ruc)) {
                errors.push(`Fila ${fila}: el RUC ${ruc} ya existe (${existingMap.get(ruc)}), se omitió.`);
                continue;
            }

            if (seenInBatch.has(ruc)) {
                errors.push(`Fila ${fila}: el RUC ${ruc} está duplicado en el mismo archivo, se omitió.`);
                continue;
            }

            seenInBatch.add(ruc);
            toCreate.push({
                empresaId,
                ruc,
                razonSocial: row.razonSocial || 'Sin Nombre',
                tipoRuc: ruc.includes('-') ? '01' : '02',
                email: row.email || null,
                telefono: row.telefono || null,
                direccion: row.direccion || null,
                estado: 'activo'
            });
        }

        let createdCount = 0;
        if (toCreate.length > 0) {
            const res = await prisma.cliente.createMany({
                data: toCreate,
                skipDuplicates: true
            });
            createdCount = res.count;
        }

        revalidatePath('/clients');
        return { success: true, count: createdCount, errors };

    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Failed to process import' };
    }
}
