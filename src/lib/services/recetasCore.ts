/**
 * MOTOR DE RECETAS
 *
 * Traduce "vendí 40 pizzas medianas" a "gasté 4000 g de harina, me quedan 1000 g,
 * o sea 10 bolas de masa".
 *
 * Modelo mental (el mismo que usa el dueño del negocio):
 *
 *   Harina           -> INSUMO. Se compra, tiene stock real en su unidad base (g).
 *   Bola de masa     -> ELABORADO VIRTUAL. Tiene receta: 5000 g de harina rinden 50
 *                       bolas. No lleva stock propio; cuántas hay se calcula al vuelo
 *                       desde la harina que queda.
 *   Pizza mediana    -> ELABORADO VIRTUAL. Receta: 1 bola por unidad.
 *   Pizza familiar   -> ELABORADO VIRTUAL. Receta: 2 bolas por unidad.
 *
 * "Virtual" = Receta.descuentaAutomatico es true. Si el negocio sí produce por lotes
 * y quiere contar las bolas físicamente (las hace en la mañana y las cuenta), se pone
 * descuentaAutomatico = false: entonces la bola pasa a ser un insumo con stock propio
 * y las recetas de arriba consumen ese stock en vez de bajar hasta la harina.
 *
 * DECISIÓN CLAVE PARA NO DESCUADRAR EL INVENTARIO: un producto con receta automática
 * NO descuenta su propio stockActual al venderse. Se descuentan sus insumos y punto.
 * Así nunca hay dos números peleándose por representar lo mismo.
 *
 * Todo el cálculo de este archivo es aritmética pura sobre estructuras planas
 * (sin Prisma) para poder probarlo con datos de mentira; la carga desde base de datos
 * vive al final, claramente separada.
 */

// ---------------------------------------------------------------------------
// Tipos del grafo de recetas
// ---------------------------------------------------------------------------

export interface InsumoDeReceta {
    insumoId: string;
    /** Cantidad, en la unidad base del insumo, que gasta UN LOTE completo. */
    cantidad: number;
    /** Merma esperada en % (0-100). El consumo real es cantidad * (1 + merma/100). */
    merma: number;
    /** Si falta, no impide producir (topping extra, salsa opcional...). */
    opcional: boolean;
}

export interface NodoReceta {
    productoId: string;
    /** Unidades del producto que salen de un lote. */
    rendimiento: number;
    /** true = producto virtual, se baja a sus insumos. false = tiene stock propio. */
    descuentaAutomatico: boolean;
    insumos: InsumoDeReceta[];
}

/** productoId -> receta activa. Solo contiene recetas activas. */
export type MapaRecetas = Map<string, NodoReceta>;

/** insumoId -> cantidad en unidad base. */
export type ConsumoPorInsumo = Map<string, number>;

export class RecetaCiclicaError extends Error {
    readonly ruta: string[];

    constructor(ruta: string[]) {
        super(
            `Receta circular detectada: ${ruta.join(' -> ')}. ` +
            'Un producto no puede ser insumo de sí mismo, ni directa ni indirectamente.'
        );
        this.name = 'RecetaCiclicaError';
        this.ruta = ruta;
    }
}

// ---------------------------------------------------------------------------
// Núcleo: explotar una receta
// ---------------------------------------------------------------------------

/**
 * Convierte "N unidades de este producto" en la lista plana de insumos REALES que se
 * consumen, bajando por todas las recetas virtuales intermedias y sumando los insumos
 * que se repiten en varias ramas.
 *
 * Aplanar en vez de calcular rama por rama es lo que hace que el resultado sea correcto
 * cuando dos ingredientes distintos salen del mismo insumo: si la pizza lleva masa y
 * pan de ajo, y los dos gastan harina, aquí la harina se suma una sola vez con el total
 * real, en lugar de dar dos límites independientes que se contradicen.
 *
 * Un producto sin receta activa (o con receta no automática) es terminal: se devuelve
 * él mismo, porque su stock sí es real.
 */
export function explotarReceta(
    productoId: string,
    cantidad: number,
    recetas: MapaRecetas,
    acumulador: ConsumoPorInsumo = new Map(),
    ruta: string[] = []
): ConsumoPorInsumo {
    if (cantidad <= 0) return acumulador;

    if (ruta.includes(productoId)) {
        throw new RecetaCiclicaError([...ruta, productoId]);
    }

    const receta = recetas.get(productoId);

    // Terminal: no hay receta virtual debajo, este producto se consume tal cual.
    if (!receta || !receta.descuentaAutomatico || receta.insumos.length === 0) {
        acumulador.set(productoId, (acumulador.get(productoId) ?? 0) + cantidad);
        return acumulador;
    }

    const rendimiento = receta.rendimiento > 0 ? receta.rendimiento : 1;

    for (const insumo of receta.insumos) {
        const porUnidad = (insumo.cantidad * (1 + insumo.merma / 100)) / rendimiento;
        explotarReceta(insumo.insumoId, porUnidad * cantidad, recetas, acumulador, [...ruta, productoId]);
    }

    return acumulador;
}

/**
 * Consumo de insumos por UNA unidad del producto. Es la base de todo lo demás:
 * la disponibilidad, el costo teórico y las alertas de reabastecimiento.
 */
export function consumoPorUnidad(productoId: string, recetas: MapaRecetas): ConsumoPorInsumo {
    return explotarReceta(productoId, 1, recetas);
}

// ---------------------------------------------------------------------------
// Disponibilidad: ¿cuántas unidades puedo producir con lo que tengo?
// ---------------------------------------------------------------------------

export interface LimitanteProduccion {
    insumoId: string;
    /** Cuánto de este insumo gasta una unidad del producto. */
    consumoPorUnidad: number;
    stockDisponible: number;
    /** Unidades del producto que alcanzan a salir solo con este insumo. */
    unidadesQuePermite: number;
}

export interface DisponibilidadProduccion {
    productoId: string;
    /** null = el producto no tiene receta, su disponibilidad es su propio stockActual. */
    unidadesPosibles: number | null;
    /** El insumo que se acaba primero. Es el que hay que reabastecer. */
    cuelloDeBotella: LimitanteProduccion | null;
    limitantes: LimitanteProduccion[];
}

/**
 * Cuántas unidades del producto se pueden producir con el stock actual de insumos.
 * Es el mínimo entre lo que permite cada insumo obligatorio.
 *
 * Los insumos marcados como opcionales no limitan: si no hay, se produce igual.
 */
export function calcularDisponibilidad(
    productoId: string,
    recetas: MapaRecetas,
    stockPorInsumo: Map<string, number>
): DisponibilidadProduccion {
    const receta = recetas.get(productoId);
    if (!receta || !receta.descuentaAutomatico || receta.insumos.length === 0) {
        return { productoId, unidadesPosibles: null, cuelloDeBotella: null, limitantes: [] };
    }

    const opcionales = insumosOpcionalesTerminales(productoId, recetas);
    const consumo = consumoPorUnidad(productoId, recetas);

    const limitantes: LimitanteProduccion[] = [];
    for (const [insumoId, porUnidad] of consumo) {
        if (porUnidad <= 0) continue;
        const stock = stockPorInsumo.get(insumoId) ?? 0;
        const limitante: LimitanteProduccion = {
            insumoId,
            consumoPorUnidad: porUnidad,
            stockDisponible: stock,
            unidadesQuePermite: Math.max(0, Math.floor(stock / porUnidad)),
        };
        if (!opcionales.has(insumoId)) limitantes.push(limitante);
    }

    if (limitantes.length === 0) {
        return { productoId, unidadesPosibles: null, cuelloDeBotella: null, limitantes: [] };
    }

    limitantes.sort((a, b) => a.unidadesQuePermite - b.unidadesQuePermite);
    return {
        productoId,
        unidadesPosibles: limitantes[0].unidadesQuePermite,
        cuelloDeBotella: limitantes[0],
        limitantes,
    };
}

/**
 * Insumos terminales que llegan SOLO por ramas opcionales. Si un insumo aparece
 * también en una rama obligatoria, no cuenta como opcional (mandan las obligatorias).
 */
function insumosOpcionalesTerminales(
    productoId: string,
    recetas: MapaRecetas,
    esRamaOpcional = false,
    opcionales: Set<string> = new Set(),
    obligatorios: Set<string> = new Set(),
    ruta: string[] = []
): Set<string> {
    if (ruta.includes(productoId)) return opcionales;

    const receta = recetas.get(productoId);
    if (!receta || !receta.descuentaAutomatico || receta.insumos.length === 0) {
        if (esRamaOpcional) opcionales.add(productoId);
        else obligatorios.add(productoId);
        return opcionales;
    }

    for (const insumo of receta.insumos) {
        insumosOpcionalesTerminales(
            insumo.insumoId,
            recetas,
            esRamaOpcional || insumo.opcional,
            opcionales,
            obligatorios,
            [...ruta, productoId]
        );
    }

    for (const id of obligatorios) opcionales.delete(id);
    return opcionales;
}

/**
 * Costo teórico de producir una unidad, según el costo unitario de cada insumo.
 * Sirve para comparar contra el precio de venta y detectar recetas que dan pérdida.
 */
export function costoTeoricoPorUnidad(
    productoId: string,
    recetas: MapaRecetas,
    costoPorInsumo: Map<string, number>
): number {
    let total = 0;
    for (const [insumoId, cantidad] of consumoPorUnidad(productoId, recetas)) {
        total += cantidad * (costoPorInsumo.get(insumoId) ?? 0);
    }
    return total;
}
