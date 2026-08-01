/**
 * MOTOR DE REABASTECIMIENTO
 *
 * Responde la pregunta que el dueño se hace todos los días: "¿de qué me estoy quedando
 * sin darme cuenta, y cuánto tengo que pedir?".
 *
 * La cadena de razonamiento es la misma que haría a mano, pero con los números reales:
 *
 *   1. ¿A qué ritmo se consume este insumo?  -> ventas de los últimos N días, explotadas
 *      por receta (40 pizzas medianas al día = 4000 g de harina al día).
 *   2. ¿Cuánto me dura lo que tengo?          -> stock / consumo diario = días de cobertura.
 *   3. ¿Cuándo tengo que pedir?               -> antes de que la cobertura baje del tiempo
 *      de entrega del proveedor más un colchón. Ese es el punto de reorden.
 *   4. ¿Cuánto pido?                          -> lo que falta para volver a tener cobertura
 *      objetivo, redondeado hacia arriba a presentaciones completas del proveedor
 *      (nadie vende medio saco), respetando el pedido mínimo.
 *
 * FUENTE ÚNICA DEL CONSUMO: las ventas. No se mezcla con MovimientoInventario a propósito
 * -- si se sumaran las dos cosas, el consumo por receta se contaría dos veces (una como
 * venta y otra como movimiento) y las alertas dispararían antes de tiempo.
 */

/** Días de historial de ventas que se miran para estimar el ritmo de consumo. */
export const DIAS_HISTORIAL_POR_DEFECTO = 30;

/** Colchón de seguridad por defecto, por encima del tiempo de entrega del proveedor. */
export const DIAS_COLCHON_POR_DEFECTO = 3;

export type SeveridadReabastecimiento = 'agotado' | 'critico' | 'pronto' | 'ok';

// ---------------------------------------------------------------------------
// Núcleo aritmético (sin base de datos, para poder probarlo con datos de mentira)
// ---------------------------------------------------------------------------

export interface EntradaCobertura {
    stockActual: number;
    /** Unidades base consumidas por día, promedio del historial. */
    consumoDiario: number;
    /** Días que tarda el proveedor en entregar. */
    diasEntrega: number;
    /** Colchón de seguridad por encima del tiempo de entrega. */
    diasColchon: number;
    /** Días de stock que se quieren tener después de reponer. */
    diasObjetivo: number;
}

export interface Cobertura {
    /** Días que aguanta el stock al ritmo actual. null = no hay consumo medible. */
    diasCobertura: number | null;
    /** Nivel de stock por debajo del cual hay que pedir ya. */
    puntoReorden: number;
    necesitaPedir: boolean;
    /** Unidades base que faltan para llegar al objetivo. 0 si no hace falta pedir. */
    faltante: number;
    severidad: SeveridadReabastecimiento;
}

export function calcularCobertura(e: EntradaCobertura): Cobertura {
    const consumo = e.consumoDiario > 0 ? e.consumoDiario : 0;

    // Sin consumo medible no se puede proyectar nada; solo se avisa si ya está en cero.
    if (consumo === 0) {
        return {
            diasCobertura: null,
            puntoReorden: 0,
            necesitaPedir: e.stockActual <= 0,
            faltante: 0,
            severidad: e.stockActual <= 0 ? 'agotado' : 'ok',
        };
    }

    const diasCobertura = e.stockActual / consumo;
    const diasProteccion = Math.max(0, e.diasEntrega) + Math.max(0, e.diasColchon);
    const puntoReorden = consumo * diasProteccion;

    // El objetivo nunca puede ser menor que la protección: pedir para 5 días cuando el
    // proveedor tarda 7 sería pedir para llegar tarde igual.
    const diasObjetivo = Math.max(e.diasObjetivo, diasProteccion);
    const stockObjetivo = consumo * diasObjetivo;

    const necesitaPedir = e.stockActual <= puntoReorden;
    const faltante = necesitaPedir ? Math.max(0, stockObjetivo - e.stockActual) : 0;

    let severidad: SeveridadReabastecimiento;
    if (e.stockActual <= 0) severidad = 'agotado';
    else if (diasCobertura <= Math.max(1, e.diasEntrega)) severidad = 'critico';
    else if (necesitaPedir) severidad = 'pronto';
    else severidad = 'ok';

    return { diasCobertura, puntoReorden, necesitaPedir, faltante, severidad };
}

export interface PresentacionProveedor {
    unidadesPorPresentacion: number;
    precioPresentacion: number;
    pedidoMinimo: number;
}

export interface SugerenciaCompra {
    presentaciones: number;
    unidadesQueLlegan: number;
    costoEstimado: number;
    /** Sobrante por comprar presentaciones completas (nadie vende medio saco). */
    excedente: number;
}

export function sugerirCompra(faltante: number, p: PresentacionProveedor): SugerenciaCompra | null {
    if (faltante <= 0 || p.unidadesPorPresentacion <= 0) return null;

    const minimo = Math.max(1, Math.floor(p.pedidoMinimo) || 1);
    const presentaciones = Math.max(minimo, Math.ceil(faltante / p.unidadesPorPresentacion));
    const unidadesQueLlegan = presentaciones * p.unidadesPorPresentacion;

    return {
        presentaciones,
        unidadesQueLlegan,
        costoEstimado: presentaciones * p.precioPresentacion,
        excedente: unidadesQueLlegan - faltante,
    };
}

/**
 * El camino inverso de `sugerirCompra`: ya compraste N presentaciones, ¿cuánto entra al
 * inventario y a qué costo por unidad?
 *
 * Es lo que cierra el círculo del stock. Comprar "2 × Paquete 100" tiene que sumar 200
 * unidades, no 2 — si se registra la cantidad en paquetes, el inventario queda corto y
 * todas las alertas de reabastecimiento pasan a mentir.
 */
export function convertirPresentacionAUnidades(
    cantidadPresentaciones: number,
    p: Pick<PresentacionProveedor, 'unidadesPorPresentacion' | 'precioPresentacion'>
): { cantidadBase: number; costoPorUnidadBase: number } | null {
    if (!Number.isFinite(cantidadPresentaciones) || cantidadPresentaciones <= 0) return null;
    if (!Number.isFinite(p.unidadesPorPresentacion) || p.unidadesPorPresentacion <= 0) return null;

    return {
        cantidadBase: cantidadPresentaciones * p.unidadesPorPresentacion,
        costoPorUnidadBase: p.precioPresentacion / p.unidadesPorPresentacion,
    };
}

export interface ProveedorSugerido {
    proveedorInsumoId: string;
    proveedorId: string;
    proveedorNombre: string;
    presentacion: string;
    unidadesPorPresentacion: number;
    precioPresentacion: number;
    diasEntrega: number;
    compra: SugerenciaCompra;
}

export interface ImpactoProducto {
    productoId: string;
    descripcion: string;
    /** Unidades del producto que todavía se pueden producir con el stock que queda. */
    unidadesPosibles: number;
    /** true si este insumo es justamente el que se acaba primero para ese producto. */
    esCuelloDeBotella: boolean;
}

export interface AlertaReabastecimiento {
    insumoId: string;
    codigoInterno: string;
    descripcion: string;
    unidadMedida: string;
    stockActual: number;
    consumoDiario: number;
    diasCobertura: number | null;
    puntoReorden: number;
    faltante: number;
    severidad: SeveridadReabastecimiento;
    diasEntrega: number;
    proveedor: ProveedorSugerido | null;
    /** Otros proveedores con el mismo insumo, para comparar precio sin salir de la pantalla. */
    alternativas: ProveedorSugerido[];
    impacto: ImpactoProducto[];
    /** El aviso ya redactado, en el idioma del dueño del negocio. */
    mensaje: string;
}

export interface OpcionesAlertas {
    dias?: number;
    /** Incluir también los insumos que están bien, para la vista completa. */
    incluirOk?: boolean;
}

// ---------------------------------------------------------------------------
// Redacción del aviso
// ---------------------------------------------------------------------------

function formatearNumero(n: number): string {
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) >= 100) return Math.round(n).toLocaleString('es-PA');
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(1);
}

function formatearDias(dias: number): string {
    if (dias < 1) return 'menos de un día';
    if (dias < 2) return 'un día';
    return `${Math.floor(dias)} días`;
}

/**
 * Convierte los números en la frase que el dueño quiere leer. Es el "anuncio":
 * qué queda, para cuánto alcanza, qué se deja de producir y qué hacer al respecto.
 */
export function redactarAviso(datos: {
    descripcion: string;
    unidadMedida: string;
    stockActual: number;
    consumoDiario: number;
    diasCobertura: number | null;
    severidad: SeveridadReabastecimiento;
    impacto: ImpactoProducto[];
    proveedor: ProveedorSugerido | null;
}): string {
    const partes: string[] = [];
    const unidad = datos.unidadMedida?.toLowerCase() ?? 'und';

    if (datos.stockActual <= 0) {
        partes.push(`${datos.descripcion} está agotado.`);
    } else {
        partes.push(`Quedan ${formatearNumero(datos.stockActual)} ${unidad} de ${datos.descripcion}.`);
    }

    const afectado = datos.impacto.find((i) => i.esCuelloDeBotella) ?? datos.impacto[0];
    if (afectado) {
        partes.push(
            `Con eso alcanza para ${formatearNumero(afectado.unidadesPosibles)} ${afectado.descripcion}.`
        );
    }

    if (datos.diasCobertura !== null && datos.consumoDiario > 0) {
        partes.push(
            `Al ritmo de ${formatearNumero(datos.consumoDiario)} ${unidad} por día, se acaba en ${formatearDias(datos.diasCobertura)}.`
        );
    }

    if (datos.proveedor) {
        const p = datos.proveedor;
        const entrega = p.diasEntrega > 0 ? `, entrega en ${formatearDias(p.diasEntrega)}` : '';
        partes.push(
            `Pedir ${p.compra.presentaciones} × ${p.presentacion} a ${p.proveedorNombre} ` +
            `(B/. ${p.compra.costoEstimado.toFixed(2)}${entrega}).`
        );
    } else {
        partes.push('No hay ningún proveedor con presentación registrada para este insumo.');
    }

    return partes.join(' ');
}
