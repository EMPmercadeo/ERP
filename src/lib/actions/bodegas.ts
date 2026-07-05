'use server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export async function getBodegas() {
    const { empresaId } = await getTenantContext();
    return prisma.bodega.findMany({
        where: { empresaId, activa: true },
        orderBy: { codigo: 'asc' },
    });
}

// Resuelve qué bodega usar: valida la sugerida si viene, o cae a la primera bodega de la empresa.
export async function resolverBodegaId(tx: any, empresaId: string, bodegaIdSugerido?: string | null): Promise<string> {
    if (bodegaIdSugerido) {
        const valida = await tx.bodega.findFirst({ where: { id: bodegaIdSugerido, empresaId, activa: true } });
        if (valida) return valida.id;
    }
    const principal = await tx.bodega.findFirst({ where: { empresaId, activa: true }, orderBy: { codigo: 'asc' } });
    if (!principal) {
        throw new Error('La empresa no tiene ninguna bodega configurada.');
    }
    return principal.id;
}

async function moverInventarioBodega(tx: any, params: { empresaId: string; bodegaId: string; productoId: string; delta: number }) {
    await tx.inventarioBodega.upsert({
        where: { bodegaId_productoId: { bodegaId: params.bodegaId, productoId: params.productoId } },
        create: { empresaId: params.empresaId, bodegaId: params.bodegaId, productoId: params.productoId, cantidad: params.delta },
        update: { cantidad: { increment: params.delta } },
    });
}
export { moverInventarioBodega };
