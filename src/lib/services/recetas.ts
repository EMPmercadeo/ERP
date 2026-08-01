/**
 * Capa de acceso a datos del motor de recetas. La aritmética pura vive en
 * `recetasCore.ts` (sin dependencias, testeable con datos de mentira); aquí solo se
 * carga el grafo desde Postgres y se escriben los movimientos de inventario.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
    explotarReceta,
    consumoPorUnidad,
    calcularDisponibilidad,
    RecetaCiclicaError,
    type MapaRecetas,
    type ConsumoPorInsumo,
    type DisponibilidadProduccion,
} from './recetasCore';

export * from './recetasCore';

// ---------------------------------------------------------------------------
// Carga desde base de datos
// ---------------------------------------------------------------------------

type ClientePrisma = Prisma.TransactionClient | typeof prisma;

/**
 * Carga todas las recetas activas de la empresa en memoria. Se trae el grafo completo
 * de una sola vez (una empresa tiene decenas de recetas, no millones) para poder
 * explotarlas sin ir a la base en cada nivel de recursión.
 */
export async function cargarRecetas(empresaId: string, db: ClientePrisma = prisma): Promise<MapaRecetas> {
    const recetas = await db.receta.findMany({
        where: { empresaId, activo: true },
        select: {
            productoId: true,
            rendimiento: true,
            descuentaAutomatico: true,
            insumos: {
                select: { insumoId: true, cantidad: true, merma: true, opcional: true },
            },
        },
    });

    const mapa: MapaRecetas = new Map();
    for (const r of recetas) {
        mapa.set(r.productoId, {
            productoId: r.productoId,
            rendimiento: Number(r.rendimiento),
            descuentaAutomatico: r.descuentaAutomatico,
            insumos: r.insumos.map((i) => ({
                insumoId: i.insumoId,
                cantidad: Number(i.cantidad),
                merma: Number(i.merma),
                opcional: i.opcional,
            })),
        });
    }
    return mapa;
}

/** Stock actual (unidad base) de los productos pedidos. */
export async function cargarStock(
    empresaId: string,
    productoIds: string[],
    db: ClientePrisma = prisma
): Promise<Map<string, number>> {
    if (productoIds.length === 0) return new Map();
    const productos = await db.producto.findMany({
        where: { empresaId, id: { in: productoIds } },
        select: { id: true, stockActual: true },
    });
    return new Map(productos.map((p) => [p.id, p.stockActual]));
}

/**
 * Disponibilidad de varios productos elaborados de una sola vez (para listados).
 * Devuelve solo los que tienen receta activa.
 */
export async function calcularDisponibilidades(
    empresaId: string,
    productoIds: string[],
    db: ClientePrisma = prisma
): Promise<Map<string, DisponibilidadProduccion>> {
    const recetas = await cargarRecetas(empresaId, db);
    if (recetas.size === 0) return new Map();

    const insumosNecesarios = new Set<string>();
    for (const id of productoIds) {
        try {
            for (const insumoId of consumoPorUnidad(id, recetas).keys()) insumosNecesarios.add(insumoId);
        } catch (error) {
            if (!(error instanceof RecetaCiclicaError)) throw error;
        }
    }

    const stock = await cargarStock(empresaId, [...insumosNecesarios], db);
    const resultado = new Map<string, DisponibilidadProduccion>();
    for (const id of productoIds) {
        if (!recetas.has(id)) continue;
        try {
            resultado.set(id, calcularDisponibilidad(id, recetas, stock));
        } catch (error) {
            if (!(error instanceof RecetaCiclicaError)) throw error;
            // Una receta rota no debe tumbar el listado completo del catálogo.
        }
    }
    return resultado;
}
