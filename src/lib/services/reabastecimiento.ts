/**
 * Capa de acceso a datos del motor de reabastecimiento. La aritmética y la redacción
 * del aviso viven en `reabastecimientoCore.ts` (sin dependencias, testeable con datos
 * de mentira); aquí solo se consulta el historial real y se arman las alertas.
 */

import { prisma } from '@/lib/db';
import {
    cargarRecetas,
    explotarReceta,
    calcularDisponibilidad,
    RecetaCiclicaError,
    type ConsumoPorInsumo,
    type MapaRecetas,
} from './recetas';
import {
    calcularCobertura,
    sugerirCompra,
    redactarAviso,
    DIAS_HISTORIAL_POR_DEFECTO,
    DIAS_COLCHON_POR_DEFECTO,
    type SeveridadReabastecimiento,
    type ProveedorSugerido,
    type ImpactoProducto,
    type AlertaReabastecimiento,
    type OpcionesAlertas,
} from './reabastecimientoCore';

export * from './reabastecimientoCore';

// ---------------------------------------------------------------------------
// Consumo real a partir del historial de ventas
// ---------------------------------------------------------------------------

interface ItemVendidoCrudo {
    productoId: string;
    cantidad: number;
}

/**
 * Trae todo lo vendido en el período, tanto por factura como por POS, y lo explota por
 * receta para saber cuántas unidades base de cada insumo se gastaron de verdad.
 *
 * Un producto sin receta se explota en sí mismo, así que los insumos que también se
 * venden sueltos (una bolsa de harina vendida tal cual) quedan contados igual de bien.
 */
export async function calcularConsumoHistorico(
    empresaId: string,
    dias: number = DIAS_HISTORIAL_POR_DEFECTO,
    recetasPrecargadas?: MapaRecetas
): Promise<{ consumoTotal: ConsumoPorInsumo; consumoDiario: Map<string, number>; diasAnalizados: number }> {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    const recetas = recetasPrecargadas ?? (await cargarRecetas(empresaId));

    const [itemsFactura, ventasPos] = await Promise.all([
        prisma.facturaItem.findMany({
            where: {
                factura: {
                    empresaId,
                    fechaEmision: { gte: desde },
                    estadoDgi: { notIn: ['anulada', 'canceled', 'borrador'] },
                },
            },
            select: { productoId: true, cantidad: true },
        }),
        prisma.venta.findMany({
            where: {
                empresaId,
                createdAt: { gte: desde },
                estado: { notIn: ['ANULADA', 'RECHAZADA'] },
            },
            select: { items: true },
        }),
    ]);

    const vendidos: ItemVendidoCrudo[] = [];

    for (const item of itemsFactura) {
        if (!item.productoId) continue;
        vendidos.push({ productoId: item.productoId, cantidad: Number(item.cantidad) });
    }

    // Venta.items es Json libre (viene del POS): se parsea a la defensiva para que una
    // venta con forma rara no tumbe el cálculo entero.
    for (const venta of ventasPos) {
        if (!Array.isArray(venta.items)) continue;
        for (const raw of venta.items) {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
            const fila = raw as Record<string, unknown>;
            const productoId = typeof fila.productoId === 'string' ? fila.productoId : null;
            const cantidad = Number(fila.cantidad);
            if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) continue;
            vendidos.push({ productoId, cantidad });
        }
    }

    const consumoTotal: ConsumoPorInsumo = new Map();
    for (const v of vendidos) {
        try {
            explotarReceta(v.productoId, v.cantidad, recetas, consumoTotal);
        } catch (error) {
            if (!(error instanceof RecetaCiclicaError)) throw error;
        }
    }

    const consumoDiario = new Map<string, number>();
    for (const [insumoId, total] of consumoTotal) {
        consumoDiario.set(insumoId, total / dias);
    }

    return { consumoTotal, consumoDiario, diasAnalizados: dias };
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

export async function generarAlertasReabastecimiento(
    empresaId: string,
    opciones: OpcionesAlertas = {}
): Promise<AlertaReabastecimiento[]> {
    const dias = opciones.dias ?? DIAS_HISTORIAL_POR_DEFECTO;

    const recetas = await cargarRecetas(empresaId);
    const { consumoDiario } = await calcularConsumoHistorico(empresaId, dias, recetas);

    // Universo a vigilar: todo lo que alguna receta consume, más lo marcado como insumo
    // a mano, más cualquier producto con consumo medido en el período.
    const idsInsumos = new Set<string>([...consumoDiario.keys()]);
    for (const receta of recetas.values()) {
        for (const insumo of receta.insumos) idsInsumos.add(insumo.insumoId);
    }

    const productosInsumo = await prisma.producto.findMany({
        where: {
            empresaId,
            activo: true,
            OR: [{ id: { in: [...idsInsumos] } }, { esInsumo: true }],
        },
        select: {
            id: true,
            codigoInterno: true,
            descripcion: true,
            unidadMedida: true,
            stockActual: true,
            stockMinimo: true,
            diasCoberturaObjetivo: true,
            esElaborado: true,
        },
    });

    // Los elaborados virtuales no se vigilan: no tienen stock propio, su disponibilidad
    // se deriva de los insumos y avisar por ellos sería avisar dos veces por lo mismo.
    const vigilados = productosInsumo.filter((p) => {
        const receta = recetas.get(p.id);
        return !(receta && receta.descuentaAutomatico && receta.insumos.length > 0);
    });
    if (vigilados.length === 0) return [];

    const idsVigilados = vigilados.map((p) => p.id);

    const [presentaciones, elaborados] = await Promise.all([
        prisma.proveedorInsumo.findMany({
            where: { empresaId, activo: true, productoId: { in: idsVigilados } },
            select: {
                id: true,
                productoId: true,
                proveedorId: true,
                presentacion: true,
                unidadesPorPresentacion: true,
                precioPresentacion: true,
                diasEntrega: true,
                pedidoMinimo: true,
                esPreferido: true,
                proveedor: { select: { razonSocial: true, nombreComercial: true } },
            },
            orderBy: [{ esPreferido: 'desc' }, { precioPresentacion: 'asc' }],
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true, receta: { is: { activo: true } } },
            select: { id: true, descripcion: true },
        }),
    ]);

    const presentacionesPorInsumo = new Map<string, typeof presentaciones>();
    for (const p of presentaciones) {
        const lista = presentacionesPorInsumo.get(p.productoId) ?? [];
        lista.push(p);
        presentacionesPorInsumo.set(p.productoId, lista);
    }

    const stockPorInsumo = new Map(vigilados.map((p) => [p.id, p.stockActual]));

    // Disponibilidad de cada elaborado, para poder decir "te quedan 10 pizzas medianas"
    // en vez de solo "te quedan 1000 g de harina".
    const disponibilidades = new Map<string, ReturnType<typeof calcularDisponibilidad>>();
    for (const elaborado of elaborados) {
        try {
            disponibilidades.set(elaborado.id, calcularDisponibilidad(elaborado.id, recetas, stockPorInsumo));
        } catch (error) {
            if (!(error instanceof RecetaCiclicaError)) throw error;
        }
    }

    const alertas: AlertaReabastecimiento[] = [];

    for (const insumo of vigilados) {
        const consumo = consumoDiario.get(insumo.id) ?? 0;
        const lista = presentacionesPorInsumo.get(insumo.id) ?? [];
        const preferida = lista.find((p) => p.esPreferido) ?? lista[0] ?? null;
        const diasEntrega = preferida ? preferida.diasEntrega : 0;

        const cobertura = calcularCobertura({
            stockActual: insumo.stockActual,
            consumoDiario: consumo,
            diasEntrega,
            diasColchon: DIAS_COLCHON_POR_DEFECTO,
            diasObjetivo: insumo.diasCoberturaObjetivo ?? DIAS_HISTORIAL_POR_DEFECTO / 4,
        });

        // Respaldo para negocios que todavía no tienen historial de ventas: si no hay
        // consumo medible, al menos se respeta el stock mínimo que el dueño ya configuró.
        const bajoMinimo = insumo.stockMinimo > 0 && insumo.stockActual <= insumo.stockMinimo;
        const severidad: SeveridadReabastecimiento =
            cobertura.severidad !== 'ok' ? cobertura.severidad : bajoMinimo ? 'pronto' : 'ok';

        if (severidad === 'ok' && !opciones.incluirOk) continue;

        const faltante =
            cobertura.faltante > 0
                ? cobertura.faltante
                : bajoMinimo
                  ? Math.max(0, insumo.stockMinimo * 2 - insumo.stockActual)
                  : 0;

        const aSugerencia = (p: (typeof presentaciones)[number]): ProveedorSugerido | null => {
            const compra = sugerirCompra(faltante, {
                unidadesPorPresentacion: Number(p.unidadesPorPresentacion),
                precioPresentacion: Number(p.precioPresentacion),
                pedidoMinimo: p.pedidoMinimo,
            });
            if (!compra) return null;
            return {
                proveedorInsumoId: p.id,
                proveedorId: p.proveedorId,
                proveedorNombre: p.proveedor.nombreComercial || p.proveedor.razonSocial,
                presentacion: p.presentacion,
                unidadesPorPresentacion: Number(p.unidadesPorPresentacion),
                precioPresentacion: Number(p.precioPresentacion),
                diasEntrega: p.diasEntrega,
                compra,
            };
        };

        const proveedor = preferida ? aSugerencia(preferida) : null;
        const alternativas = lista
            .filter((p) => p.id !== preferida?.id)
            .map(aSugerencia)
            .filter((s): s is ProveedorSugerido => s !== null);

        const impacto: ImpactoProducto[] = [];
        for (const elaborado of elaborados) {
            const disp = disponibilidades.get(elaborado.id);
            if (!disp || disp.unidadesPosibles === null) continue;
            const limita = disp.limitantes.find((l) => l.insumoId === insumo.id);
            if (!limita) continue;
            impacto.push({
                productoId: elaborado.id,
                descripcion: elaborado.descripcion,
                unidadesPosibles: limita.unidadesQuePermite,
                esCuelloDeBotella: disp.cuelloDeBotella?.insumoId === insumo.id,
            });
        }
        impacto.sort((a, b) => a.unidadesPosibles - b.unidadesPosibles);

        alertas.push({
            insumoId: insumo.id,
            codigoInterno: insumo.codigoInterno,
            descripcion: insumo.descripcion,
            unidadMedida: insumo.unidadMedida,
            stockActual: insumo.stockActual,
            consumoDiario: consumo,
            diasCobertura: cobertura.diasCobertura,
            puntoReorden: cobertura.puntoReorden,
            faltante,
            severidad,
            diasEntrega,
            proveedor,
            alternativas,
            impacto,
            mensaje: redactarAviso({
                descripcion: insumo.descripcion,
                unidadMedida: insumo.unidadMedida,
                stockActual: insumo.stockActual,
                consumoDiario: consumo,
                diasCobertura: cobertura.diasCobertura,
                severidad,
                impacto,
                proveedor,
            }),
        });
    }

    const orden: Record<SeveridadReabastecimiento, number> = { agotado: 0, critico: 1, pronto: 2, ok: 3 };
    alertas.sort((a, b) => {
        if (orden[a.severidad] !== orden[b.severidad]) return orden[a.severidad] - orden[b.severidad];
        return (a.diasCobertura ?? Infinity) - (b.diasCobertura ?? Infinity);
    });

    return alertas;
}

