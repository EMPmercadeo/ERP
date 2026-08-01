'use server';

/**
 * Server actions de recetas: qué insumos consume un producto elaborado y cuánto rinde
 * un lote. La aritmética vive en src/lib/services/recetasCore.ts; aquí solo se valida,
 * se escribe y se protege el acceso.
 *
 * Toda consulta va scopeada por empresaId (multi-tenant) y toda escritura exige rol
 * admin/gerente, igual que Productos y Compras.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { RecetaSchema } from '@/lib/validations';
import {
    cargarRecetas,
    calcularDisponibilidad,
    consumoPorUnidad,
    costoTeoricoPorUnidad,
    RecetaCiclicaError,
    type DisponibilidadProduccion,
} from '@/lib/services/recetas';

const ROLES_EDICION = ['admin', 'gerente'];

export interface InsumoDeRecetaVista {
    insumoId: string;
    codigoInterno: string;
    descripcion: string;
    unidadMedida: string;
    cantidad: number;
    merma: number;
    opcional: boolean;
    /** Consumo por UNA unidad del producto: cantidad * (1 + merma/100) / rendimiento. */
    consumoPorUnidad: number;
    stockActual: number;
    costoUnitario: number;
    /** Unidades del producto que alcanzan a salir solo con este insumo. */
    unidadesQuePermite: number;
}

export interface RecetaVista {
    id: string;
    productoId: string;
    rendimiento: number;
    descuentaAutomatico: boolean;
    activo: boolean;
    notas: string | null;
    insumos: InsumoDeRecetaVista[];
    /** Unidades producibles con el stock actual. null si la receta no descuenta. */
    unidadesPosibles: number | null;
    cuelloDeBotellaId: string | null;
    costoPorUnidad: number;
    precioVenta: number;
    /** Margen en % sobre el precio de venta. null si no hay precio. */
    margenPorcentaje: number | null;
}

export async function getRecetaDeProducto(productoId: string): Promise<RecetaVista | null> {
    const { empresaId } = await getTenantContext();

    const receta = await prisma.receta.findFirst({
        where: { productoId, empresaId },
        include: {
            producto: { select: { precioVenta: true } },
            insumos: {
                include: {
                    insumo: {
                        select: {
                            id: true,
                            codigoInterno: true,
                            descripcion: true,
                            unidadMedida: true,
                            stockActual: true,
                            costoUnitario: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!receta) return null;

    const rendimiento = Number(receta.rendimiento) > 0 ? Number(receta.rendimiento) : 1;

    // Se recalcula con el grafo completo para que el consumo mostrado sea el real
    // (bajando por las recetas intermedias), no solo el primer nivel.
    const recetas = await cargarRecetas(empresaId);
    const idsInsumosProfundos: string[] = [];
    let disponibilidad: DisponibilidadProduccion | null = null;
    let costoPorUnidad = 0;

    try {
        const consumoProfundo = consumoPorUnidad(productoId, recetas);
        idsInsumosProfundos.push(...consumoProfundo.keys());

        const stockProfundo = await prisma.producto.findMany({
            where: { empresaId, id: { in: idsInsumosProfundos } },
            select: { id: true, stockActual: true, costoUnitario: true },
        });

        disponibilidad = calcularDisponibilidad(
            productoId,
            recetas,
            new Map(stockProfundo.map((p) => [p.id, p.stockActual]))
        );
        costoPorUnidad = costoTeoricoPorUnidad(
            productoId,
            recetas,
            new Map(stockProfundo.map((p) => [p.id, p.costoUnitario.toNumber()]))
        );
    } catch (error) {
        if (!(error instanceof RecetaCiclicaError)) throw error;
        // Una receta circular no debe romper la pantalla: se muestra sin proyección.
    }

    const precioVenta = receta.producto.precioVenta.toNumber();

    return {
        id: receta.id,
        productoId: receta.productoId,
        rendimiento,
        descuentaAutomatico: receta.descuentaAutomatico,
        activo: receta.activo,
        notas: receta.notas,
        insumos: receta.insumos.map((i) => {
            const cantidad = Number(i.cantidad);
            const merma = Number(i.merma);
            const porUnidad = (cantidad * (1 + merma / 100)) / rendimiento;
            return {
                insumoId: i.insumoId,
                codigoInterno: i.insumo.codigoInterno,
                descripcion: i.insumo.descripcion,
                unidadMedida: i.insumo.unidadMedida,
                cantidad,
                merma,
                opcional: i.opcional,
                consumoPorUnidad: porUnidad,
                stockActual: i.insumo.stockActual,
                costoUnitario: i.insumo.costoUnitario.toNumber(),
                unidadesQuePermite: porUnidad > 0 ? Math.floor(i.insumo.stockActual / porUnidad) : 0,
            };
        }),
        unidadesPosibles: disponibilidad?.unidadesPosibles ?? null,
        cuelloDeBotellaId: disponibilidad?.cuelloDeBotella?.insumoId ?? null,
        costoPorUnidad,
        precioVenta,
        margenPorcentaje: precioVenta > 0 ? ((precioVenta - costoPorUnidad) / precioVenta) * 100 : null,
    };
}

/**
 * Productos que pueden usarse como insumo de este producto. Se excluyen los kits (son
 * otro concepto) y el propio producto. Los ciclos indirectos se validan al guardar,
 * porque dependen del grafo completo.
 */
export async function getProductosParaReceta(excluirProductoId: string) {
    const { empresaId } = await getTenantContext();

    const productos = await prisma.producto.findMany({
        where: { empresaId, activo: true, esKit: false, id: { not: excluirProductoId } },
        select: {
            id: true,
            codigoInterno: true,
            descripcion: true,
            unidadMedida: true,
            stockActual: true,
            costoUnitario: true,
            esInsumo: true,
        },
        orderBy: [{ esInsumo: 'desc' }, { descripcion: 'asc' }],
    });

    return productos.map((p) => ({
        id: p.id,
        codigoInterno: p.codigoInterno,
        descripcion: p.descripcion,
        unidadMedida: p.unidadMedida,
        stockActual: p.stockActual,
        costoUnitario: p.costoUnitario.toNumber(),
        esInsumo: p.esInsumo,
    }));
}

export interface ResultadoAccion {
    success: boolean;
    error?: string;
}

export async function guardarReceta(
    productoId: string,
    entrada: {
        rendimiento: number;
        descuentaAutomatico: boolean;
        activo: boolean;
        notas?: string | null;
        insumos: { insumoId: string; cantidad: number; merma: number; opcional: boolean }[];
    }
): Promise<ResultadoAccion> {
    try {
        const { empresaId, role } = await getTenantContext();
        if (!ROLES_EDICION.includes(role)) {
            return { success: false, error: 'No tienes permiso para editar recetas.' };
        }

        const validado = RecetaSchema.safeParse({ ...entrada, notas: entrada.notas ?? '' });
        if (!validado.success) {
            const primero = validado.error.issues[0];
            return { success: false, error: primero?.message ?? 'Datos inválidos.' };
        }
        const data = validado.data;

        const producto = await prisma.producto.findFirst({
            where: { id: productoId, empresaId },
            select: { id: true, esKit: true },
        });
        if (!producto) return { success: false, error: 'Producto no encontrado.' };
        if (producto.esKit) {
            return {
                success: false,
                error: 'Este producto ya es un kit. Un kit agrupa productos que también se venden por separado; una receta transforma insumos. Desactiva el kit antes de crear la receta.',
            };
        }

        if (data.insumos.some((i) => i.insumoId === productoId)) {
            return { success: false, error: 'Un producto no puede ser insumo de sí mismo.' };
        }

        // Los insumos deben ser de la misma empresa: sin esto se podría inyectar el id de
        // un producto de otro tenant y filtrar su stock a través de la disponibilidad.
        const idsInsumos = data.insumos.map((i) => i.insumoId);
        const insumosValidos = await prisma.producto.findMany({
            where: { empresaId, id: { in: idsInsumos } },
            select: { id: true },
        });
        if (insumosValidos.length !== idsInsumos.length) {
            return { success: false, error: 'Alguno de los insumos no existe o no pertenece a tu empresa.' };
        }

        // Anti-ciclos: se simula el grafo con la receta nueva ya aplicada antes de escribir.
        const recetas = await cargarRecetas(empresaId);
        recetas.set(productoId, {
            productoId,
            rendimiento: data.rendimiento,
            descuentaAutomatico: data.descuentaAutomatico,
            insumos: data.insumos.map((i) => ({
                insumoId: i.insumoId,
                cantidad: i.cantidad,
                merma: i.merma,
                opcional: i.opcional,
            })),
        });
        try {
            consumoPorUnidad(productoId, recetas);
        } catch (error) {
            if (error instanceof RecetaCiclicaError) return { success: false, error: error.message };
            throw error;
        }

        await prisma.$transaction(async (tx) => {
            const receta = await tx.receta.upsert({
                where: { productoId },
                create: {
                    empresaId,
                    productoId,
                    rendimiento: data.rendimiento,
                    descuentaAutomatico: data.descuentaAutomatico,
                    activo: data.activo,
                    notas: data.notas || null,
                },
                update: {
                    rendimiento: data.rendimiento,
                    descuentaAutomatico: data.descuentaAutomatico,
                    activo: data.activo,
                    notas: data.notas || null,
                },
            });

            await tx.recetaInsumo.deleteMany({ where: { recetaId: receta.id } });
            await tx.recetaInsumo.createMany({
                data: data.insumos.map((i) => ({
                    empresaId,
                    recetaId: receta.id,
                    insumoId: i.insumoId,
                    cantidad: i.cantidad,
                    merma: i.merma,
                    opcional: i.opcional,
                })),
            });

            // El producto queda marcado como elaborado y sus insumos como insumo, para que
            // el catálogo y el POS los presenten distinto sin que haya que marcarlos a mano.
            await tx.producto.update({
                where: { id: productoId },
                data: { esElaborado: data.activo },
            });
            await tx.producto.updateMany({
                where: { empresaId, id: { in: idsInsumos }, esInsumo: false },
                data: { esInsumo: true },
            });
        });

        revalidatePath(`/products/${productoId}`);
        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error('Error guardando receta:', error);
        return { success: false, error: 'No se pudo guardar la receta.' };
    }
}

export async function eliminarReceta(productoId: string): Promise<ResultadoAccion> {
    try {
        const { empresaId, role } = await getTenantContext();
        if (!ROLES_EDICION.includes(role)) {
            return { success: false, error: 'No tienes permiso para eliminar recetas.' };
        }

        const receta = await prisma.receta.findFirst({
            where: { productoId, empresaId },
            select: { id: true },
        });
        if (!receta) return { success: false, error: 'Este producto no tiene receta.' };

        await prisma.$transaction(async (tx) => {
            await tx.recetaInsumo.deleteMany({ where: { recetaId: receta.id } });
            await tx.receta.delete({ where: { id: receta.id } });
            await tx.producto.update({ where: { id: productoId }, data: { esElaborado: false } });
        });

        revalidatePath(`/products/${productoId}`);
        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error('Error eliminando receta:', error);
        return { success: false, error: 'No se pudo eliminar la receta.' };
    }
}
