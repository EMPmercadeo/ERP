'use server';

/**
 * Server actions del catálogo de suministro: en qué presentación vende cada proveedor
 * cada insumo, a qué precio, en cuántos días y cuánto rinde esa presentación.
 *
 * Es la mitad "compra" del módulo de insumos. La mitad "consumo" son las recetas
 * (src/lib/actions/recetas.ts) y el cruce de las dos produce las alertas de
 * reabastecimiento (src/lib/services/reabastecimiento.ts).
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { ProveedorInsumoSchema } from '@/lib/validations';
import { cargarRecetas, consumoPorUnidad, RecetaCiclicaError } from '@/lib/services/recetas';
import { generarAlertasReabastecimiento, type AlertaReabastecimiento } from '@/lib/services/reabastecimiento';

const ROLES_EDICION = ['admin', 'gerente'];

export interface PresentacionVista {
    id: string;
    proveedorId: string;
    proveedorNombre: string;
    productoId: string;
    codigoInterno: string;
    descripcion: string;
    unidadMedida: string;
    codigoProveedor: string | null;
    presentacion: string;
    unidadesPorPresentacion: number;
    precioPresentacion: number;
    /** Precio por unidad base, para comparar presentaciones distintas de igual a igual. */
    precioPorUnidad: number;
    diasEntrega: number;
    pedidoMinimo: number;
    esPreferido: boolean;
    activo: boolean;
    notas: string | null;
    /**
     * Cuántas unidades de cada producto elaborado rinde UNA presentación. Es lo que
     * traduce "un saco de 5 kg" a "50 bolas de masa" sin que nadie lo escriba a mano.
     */
    rendimientos: { productoId: string; descripcion: string; unidades: number }[];
}

function mapearRendimientos(
    unidadesPorPresentacion: number,
    productoId: string,
    elaborados: { id: string; descripcion: string }[],
    recetas: Awaited<ReturnType<typeof cargarRecetas>>
) {
    const rendimientos: { productoId: string; descripcion: string; unidades: number }[] = [];
    for (const elaborado of elaborados) {
        try {
            const porUnidad = consumoPorUnidad(elaborado.id, recetas).get(productoId);
            if (!porUnidad || porUnidad <= 0) continue;
            rendimientos.push({
                productoId: elaborado.id,
                descripcion: elaborado.descripcion,
                unidades: Math.floor(unidadesPorPresentacion / porUnidad),
            });
        } catch (error) {
            if (!(error instanceof RecetaCiclicaError)) throw error;
        }
    }
    return rendimientos.sort((a, b) => b.unidades - a.unidades);
}

/** Presentaciones de un proveedor (pestaña Suministros dentro de la ficha del proveedor). */
export async function getInsumosDeProveedor(proveedorId: string): Promise<PresentacionVista[]> {
    const { empresaId } = await getTenantContext();

    const [filas, elaborados, recetas] = await Promise.all([
        prisma.proveedorInsumo.findMany({
            where: { empresaId, proveedorId },
            include: {
                proveedor: { select: { razonSocial: true, nombreComercial: true } },
                producto: { select: { codigoInterno: true, descripcion: true, unidadMedida: true } },
            },
            orderBy: [{ activo: 'desc' }, { producto: { descripcion: 'asc' } }],
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true, receta: { is: { activo: true } } },
            select: { id: true, descripcion: true },
        }),
        cargarRecetas(empresaId),
    ]);

    return filas.map((f) => {
        const unidades = Number(f.unidadesPorPresentacion);
        const precio = Number(f.precioPresentacion);
        return {
            id: f.id,
            proveedorId: f.proveedorId,
            proveedorNombre: f.proveedor.nombreComercial || f.proveedor.razonSocial,
            productoId: f.productoId,
            codigoInterno: f.producto.codigoInterno,
            descripcion: f.producto.descripcion,
            unidadMedida: f.producto.unidadMedida,
            codigoProveedor: f.codigoProveedor,
            presentacion: f.presentacion,
            unidadesPorPresentacion: unidades,
            precioPresentacion: precio,
            precioPorUnidad: unidades > 0 ? precio / unidades : 0,
            diasEntrega: f.diasEntrega,
            pedidoMinimo: f.pedidoMinimo,
            esPreferido: f.esPreferido,
            activo: f.activo,
            notas: f.notas,
            rendimientos: mapearRendimientos(unidades, f.productoId, elaborados, recetas),
        };
    });
}

/** Proveedores que venden un insumo dado (pestaña Insumo dentro de la ficha del producto). */
export async function getProveedoresDeInsumo(productoId: string): Promise<PresentacionVista[]> {
    const { empresaId } = await getTenantContext();

    const [filas, elaborados, recetas] = await Promise.all([
        prisma.proveedorInsumo.findMany({
            where: { empresaId, productoId },
            include: {
                proveedor: { select: { razonSocial: true, nombreComercial: true } },
                producto: { select: { codigoInterno: true, descripcion: true, unidadMedida: true } },
            },
            orderBy: [{ esPreferido: 'desc' }, { activo: 'desc' }, { precioPresentacion: 'asc' }],
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true, receta: { is: { activo: true } } },
            select: { id: true, descripcion: true },
        }),
        cargarRecetas(empresaId),
    ]);

    return filas.map((f) => {
        const unidades = Number(f.unidadesPorPresentacion);
        const precio = Number(f.precioPresentacion);
        return {
            id: f.id,
            proveedorId: f.proveedorId,
            proveedorNombre: f.proveedor.nombreComercial || f.proveedor.razonSocial,
            productoId: f.productoId,
            codigoInterno: f.producto.codigoInterno,
            descripcion: f.producto.descripcion,
            unidadMedida: f.producto.unidadMedida,
            codigoProveedor: f.codigoProveedor,
            presentacion: f.presentacion,
            unidadesPorPresentacion: unidades,
            precioPresentacion: precio,
            precioPorUnidad: unidades > 0 ? precio / unidades : 0,
            diasEntrega: f.diasEntrega,
            pedidoMinimo: f.pedidoMinimo,
            esPreferido: f.esPreferido,
            activo: f.activo,
            notas: f.notas,
            rendimientos: mapearRendimientos(unidades, f.productoId, elaborados, recetas),
        };
    });
}

export interface ResultadoAccion {
    success: boolean;
    error?: string;
    id?: string;
}

export interface EntradaPresentacion {
    proveedorId: string;
    productoId: string;
    codigoProveedor?: string | null;
    presentacion: string;
    unidadesPorPresentacion: number;
    precioPresentacion: number;
    diasEntrega: number;
    pedidoMinimo: number;
    esPreferido: boolean;
    activo: boolean;
    notas?: string | null;
}

export async function guardarPresentacionProveedor(
    id: string | null,
    entrada: EntradaPresentacion
): Promise<ResultadoAccion> {
    try {
        const { empresaId, role } = await getTenantContext();
        if (!ROLES_EDICION.includes(role)) {
            return { success: false, error: 'No tienes permiso para editar el catálogo de suministro.' };
        }

        const validado = ProveedorInsumoSchema.safeParse({
            ...entrada,
            codigoProveedor: entrada.codigoProveedor ?? '',
            notas: entrada.notas ?? '',
        });
        if (!validado.success) {
            const primero = validado.error.issues[0];
            return { success: false, error: primero?.message ?? 'Datos inválidos.' };
        }
        const data = validado.data;

        // Ambos extremos tienen que ser de la empresa del usuario, sin excepción.
        const [proveedor, producto] = await Promise.all([
            prisma.proveedor.findFirst({ where: { id: data.proveedorId, empresaId }, select: { id: true } }),
            prisma.producto.findFirst({ where: { id: data.productoId, empresaId }, select: { id: true } }),
        ]);
        if (!proveedor) return { success: false, error: 'Proveedor no encontrado.' };
        if (!producto) return { success: false, error: 'Producto no encontrado.' };

        if (id) {
            const existente = await prisma.proveedorInsumo.findFirst({
                where: { id, empresaId },
                select: { id: true },
            });
            if (!existente) return { success: false, error: 'Presentación no encontrada.' };
        }

        const resultado = await prisma.$transaction(async (tx) => {
            // Solo una presentación puede ser la preferida por insumo: es la que se usa
            // para sugerir la compra, y dos "preferidas" harían la sugerencia ambigua.
            if (data.esPreferido) {
                await tx.proveedorInsumo.updateMany({
                    where: { empresaId, productoId: data.productoId, ...(id ? { id: { not: id } } : {}) },
                    data: { esPreferido: false },
                });
            }

            const payload = {
                codigoProveedor: data.codigoProveedor || null,
                presentacion: data.presentacion,
                unidadesPorPresentacion: data.unidadesPorPresentacion,
                precioPresentacion: data.precioPresentacion,
                diasEntrega: data.diasEntrega,
                pedidoMinimo: data.pedidoMinimo,
                esPreferido: data.esPreferido,
                activo: data.activo,
                notas: data.notas || null,
            };

            const fila = id
                ? await tx.proveedorInsumo.update({ where: { id }, data: payload })
                : await tx.proveedorInsumo.create({
                      data: {
                          empresaId,
                          proveedorId: data.proveedorId,
                          productoId: data.productoId,
                          ...payload,
                      },
                  });

            // Si alguien registra de dónde comprar este producto, es un insumo por definición.
            await tx.producto.updateMany({
                where: { id: data.productoId, empresaId, esInsumo: false },
                data: { esInsumo: true },
            });

            return fila;
        });

        revalidatePath(`/suppliers/${data.proveedorId}`);
        revalidatePath(`/products/${data.productoId}`);
        revalidatePath('/products');
        return { success: true, id: resultado.id };
    } catch (error) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return {
                success: false,
                error: 'Este proveedor ya tiene registrada una presentación con ese nombre para este insumo.',
            };
        }
        console.error('Error guardando presentación de proveedor:', error);
        return { success: false, error: 'No se pudo guardar la presentación.' };
    }
}

export async function eliminarPresentacionProveedor(id: string): Promise<ResultadoAccion> {
    try {
        const { empresaId, role } = await getTenantContext();
        if (!ROLES_EDICION.includes(role)) {
            return { success: false, error: 'No tienes permiso para editar el catálogo de suministro.' };
        }

        const fila = await prisma.proveedorInsumo.findFirst({
            where: { id, empresaId },
            select: { id: true, proveedorId: true, productoId: true },
        });
        if (!fila) return { success: false, error: 'Presentación no encontrada.' };

        await prisma.proveedorInsumo.delete({ where: { id } });

        revalidatePath(`/suppliers/${fila.proveedorId}`);
        revalidatePath(`/products/${fila.productoId}`);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando presentación de proveedor:', error);
        return { success: false, error: 'No se pudo eliminar la presentación.' };
    }
}

/** Proveedores activos, para el selector al registrar dónde comprar un insumo. */
export async function getProveedoresActivos() {
    const { empresaId } = await getTenantContext();

    const proveedores = await prisma.proveedor.findMany({
        where: { empresaId, estado: 'activo' },
        select: { id: true, razonSocial: true, nombreComercial: true },
        orderBy: { razonSocial: 'asc' },
    });

    return proveedores.map((p) => ({ id: p.id, nombre: p.nombreComercial || p.razonSocial }));
}

/** Insumos candidatos para asociar a un proveedor. */
export async function getInsumosDisponibles() {
    const { empresaId } = await getTenantContext();

    const productos = await prisma.producto.findMany({
        where: { empresaId, activo: true, esKit: false },
        select: {
            id: true,
            codigoInterno: true,
            descripcion: true,
            unidadMedida: true,
            stockActual: true,
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
        esInsumo: p.esInsumo,
    }));
}

/**
 * Alertas de reabastecimiento para la pestaña Abastecimiento. Solo lectura, pero se
 * restringe a los roles que ya ven Compras: expone costos y proveedores.
 */
export async function getAlertasReabastecimiento(opciones?: {
    dias?: number;
    incluirOk?: boolean;
}): Promise<{ alertas: AlertaReabastecimiento[]; error?: string }> {
    const { empresaId, role } = await getTenantContext();
    if (!ROLES_EDICION.includes(role)) {
        return { alertas: [], error: 'No tienes permiso para ver el abastecimiento.' };
    }

    try {
        const alertas = await generarAlertasReabastecimiento(empresaId, opciones);
        return { alertas };
    } catch (error) {
        console.error('Error generando alertas de reabastecimiento:', error);
        return { alertas: [], error: 'No se pudieron calcular las alertas.' };
    }
}
