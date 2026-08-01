/**
 * Prueba del motor de recetas y reabastecimiento con el caso real de una pizzería.
 * No toca la base de datos: alimenta el núcleo aritmético con datos de mentira, así
 * que corre en cualquier lado y en menos de un segundo.
 *
 *   npx tsx scripts/test-recetas.ts
 */

import {
    explotarReceta,
    consumoPorUnidad,
    calcularDisponibilidad,
    costoTeoricoPorUnidad,
    RecetaCiclicaError,
    type MapaRecetas,
} from '../src/lib/services/recetasCore';
import {
    calcularCobertura,
    sugerirCompra,
    redactarAviso,
} from '../src/lib/services/reabastecimientoCore';

let fallos = 0;

function check(nombre: string, real: unknown, esperado: unknown) {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`${ok ? '  OK  ' : ' FALLA'} ${nombre}${ok ? '' : `\n         esperado: ${JSON.stringify(esperado)}\n         obtenido: ${JSON.stringify(real)}`}`);
}

function checkCerca(nombre: string, real: number, esperado: number, tolerancia = 0.001) {
    const ok = Math.abs(real - esperado) <= tolerancia;
    if (!ok) fallos++;
    console.log(`${ok ? '  OK  ' : ' FALLA'} ${nombre}${ok ? '' : ` (esperado ~${esperado}, obtenido ${real})`}`);
}

// ---------------------------------------------------------------------------
// Escenario: pizzería. La harina se lleva en GRAMOS (unidad base del producto).
//
//   Harina           insumo real, stock en g
//   Bola de masa     elaborado virtual: 5000 g de harina rinden 50 bolas
//   Pizza mediana    elaborado virtual: 1 bola
//   Pizza familiar   elaborado virtual: 2 bolas
// ---------------------------------------------------------------------------

const recetas: MapaRecetas = new Map([
    ['bola', {
        productoId: 'bola',
        rendimiento: 50,
        descuentaAutomatico: true,
        insumos: [{ insumoId: 'harina', cantidad: 5000, merma: 0, opcional: false }],
    }],
    ['mediana', {
        productoId: 'mediana',
        rendimiento: 1,
        descuentaAutomatico: true,
        insumos: [
            { insumoId: 'bola', cantidad: 1, merma: 0, opcional: false },
            { insumoId: 'queso', cantidad: 150, merma: 0, opcional: false },
        ],
    }],
    ['familiar', {
        productoId: 'familiar',
        rendimiento: 1,
        descuentaAutomatico: true,
        insumos: [
            { insumoId: 'bola', cantidad: 2, merma: 0, opcional: false },
            { insumoId: 'queso', cantidad: 300, merma: 0, opcional: false },
            { insumoId: 'albahaca', cantidad: 5, merma: 0, opcional: true },
        ],
    }],
]);

console.log('\n== Explosión de recetas ==');

// Una bola son 5000/50 = 100 g de harina.
checkCerca('1 bola = 100 g de harina', consumoPorUnidad('bola', recetas).get('harina')!, 100);

// Una mediana baja dos niveles: 1 bola -> 100 g de harina.
checkCerca('1 mediana = 100 g de harina', consumoPorUnidad('mediana', recetas).get('harina')!, 100);
checkCerca('1 familiar = 200 g de harina', consumoPorUnidad('familiar', recetas).get('harina')!, 200);

// El caso exacto que planteó el negocio: un saco de 5 kg, 40 medianas facturadas.
const consumo40 = explotarReceta('mediana', 40, recetas);
checkCerca('40 medianas gastan 4000 g de harina', consumo40.get('harina')!, 4000);
checkCerca('40 medianas gastan 6000 g de queso', consumo40.get('queso')!, 6000);

console.log('\n== Disponibilidad con lo que queda ==');

// Sobran 1000 g de harina del saco de 5 kg, y queso de sobra.
const stock = new Map([['harina', 1000], ['queso', 99999], ['albahaca', 0]]);

check('quedan 10 bolas de masa', calcularDisponibilidad('bola', recetas, stock).unidadesPosibles, 10);
check('quedan 10 pizzas medianas', calcularDisponibilidad('mediana', recetas, stock).unidadesPosibles, 10);
check('quedan 5 pizzas familiares', calcularDisponibilidad('familiar', recetas, stock).unidadesPosibles, 5);

check(
    'el cuello de botella es la harina',
    calcularDisponibilidad('mediana', recetas, stock).cuelloDeBotella?.insumoId,
    'harina'
);

// La albahaca está en cero pero es opcional: no debe bloquear la producción.
check(
    'un insumo opcional agotado no bloquea',
    calcularDisponibilidad('familiar', recetas, stock).unidadesPosibles,
    5
);

console.log('\n== Insumos compartidos entre ramas ==');

// El pan de ajo también gasta harina. Al aplanar, la harina se suma una sola vez.
const conPanDeAjo: MapaRecetas = new Map(recetas);
conPanDeAjo.set('combo', {
    productoId: 'combo',
    rendimiento: 1,
    descuentaAutomatico: true,
    insumos: [
        { insumoId: 'mediana', cantidad: 1, merma: 0, opcional: false },
        { insumoId: 'pan', cantidad: 1, merma: 0, opcional: false },
    ],
});
conPanDeAjo.set('pan', {
    productoId: 'pan',
    rendimiento: 10,
    descuentaAutomatico: true,
    insumos: [{ insumoId: 'harina', cantidad: 500, merma: 0, opcional: false }],
});

// 100 g (pizza) + 50 g (pan) = 150 g por combo, no dos límites separados.
checkCerca('1 combo = 150 g de harina', consumoPorUnidad('combo', conPanDeAjo).get('harina')!, 150);
check(
    'con 1000 g de harina salen 6 combos',
    calcularDisponibilidad('combo', conPanDeAjo, stock).unidadesPosibles,
    6
);

console.log('\n== Merma ==');

const conMerma: MapaRecetas = new Map([
    ['bola', {
        productoId: 'bola',
        rendimiento: 50,
        descuentaAutomatico: true,
        insumos: [{ insumoId: 'harina', cantidad: 5000, merma: 10, opcional: false }],
    }],
]);
checkCerca('10% de merma sube el consumo a 110 g', consumoPorUnidad('bola', conMerma).get('harina')!, 110);

console.log('\n== Productos con stock propio ==');

// Si la bola se produce por lotes y se cuenta a mano (descuentaAutomatico = false),
// la pizza consume bolas y NO baja hasta la harina.
const bolaConStock: MapaRecetas = new Map(recetas);
bolaConStock.set('bola', { ...recetas.get('bola')!, descuentaAutomatico: false });
check(
    'con bola de stock propio, la mediana consume bolas',
    [...consumoPorUnidad('mediana', bolaConStock).keys()].sort(),
    ['bola', 'queso']
);

console.log('\n== Recetas circulares ==');

const circular: MapaRecetas = new Map([
    ['a', { productoId: 'a', rendimiento: 1, descuentaAutomatico: true, insumos: [{ insumoId: 'b', cantidad: 1, merma: 0, opcional: false }] }],
    ['b', { productoId: 'b', rendimiento: 1, descuentaAutomatico: true, insumos: [{ insumoId: 'a', cantidad: 1, merma: 0, opcional: false }] }],
]);
let capturado = false;
try {
    consumoPorUnidad('a', circular);
} catch (error) {
    capturado = error instanceof RecetaCiclicaError;
}
check('un ciclo lanza RecetaCiclicaError en vez de colgarse', capturado, true);

console.log('\n== Costo teórico ==');

// Harina a 0.0018/g y queso a 0.008/g -> una mediana cuesta 0.18 + 1.20 = 1.38
checkCerca(
    'costo de una mediana',
    costoTeoricoPorUnidad('mediana', recetas, new Map([['harina', 0.0018], ['queso', 0.008]])),
    1.38,
    0.0001
);

console.log('\n== Cobertura y punto de reorden ==');

// Se venden 40 medianas al día => 4000 g de harina al día. Quedan 1000 g.
const cobertura = calcularCobertura({
    stockActual: 1000,
    consumoDiario: 4000,
    diasEntrega: 2,
    diasColchon: 3,
    diasObjetivo: 7,
});
checkCerca('cobertura de 0.25 días', cobertura.diasCobertura!, 0.25);
checkCerca('punto de reorden = 5 días de consumo', cobertura.puntoReorden, 20000);
check('hay que pedir ya', cobertura.necesitaPedir, true);
check('severidad crítica', cobertura.severidad, 'critico');
checkCerca('faltan 27000 g para 7 días', cobertura.faltante, 27000);

// El objetivo nunca puede quedar por debajo del tiempo de entrega + colchón.
const objetivoCorto = calcularCobertura({
    stockActual: 0,
    consumoDiario: 100,
    diasEntrega: 7,
    diasColchon: 3,
    diasObjetivo: 2,
});
checkCerca('el objetivo se estira hasta cubrir la entrega', objetivoCorto.faltante, 1000);

// Sin historial de ventas no se inventa una proyección.
const sinConsumo = calcularCobertura({
    stockActual: 500,
    consumoDiario: 0,
    diasEntrega: 2,
    diasColchon: 3,
    diasObjetivo: 7,
});
check('sin consumo no hay proyección', sinConsumo.diasCobertura, null);
check('sin consumo y con stock, no alarma', sinConsumo.severidad, 'ok');

console.log('\n== Sugerencia de compra ==');

// Faltan 27000 g y el saco trae 5000 g: 6 sacos (30000 g), sobran 3000.
const compra = sugerirCompra(27000, { unidadesPorPresentacion: 5000, precioPresentacion: 18, pedidoMinimo: 1 })!;
check('6 sacos', compra.presentaciones, 6);
checkCerca('B/. 108.00', compra.costoEstimado, 108);
checkCerca('sobran 3000 g', compra.excedente, 3000);

const conMinimo = sugerirCompra(1000, { unidadesPorPresentacion: 5000, precioPresentacion: 18, pedidoMinimo: 4 })!;
check('se respeta el pedido mínimo del proveedor', conMinimo.presentaciones, 4);

check('sin faltante no se sugiere compra', sugerirCompra(0, { unidadesPorPresentacion: 5000, precioPresentacion: 18, pedidoMinimo: 1 }), null);

console.log('\n== Aviso redactado ==');

const aviso = redactarAviso({
    descripcion: 'Harina de pizza',
    unidadMedida: 'g',
    stockActual: 1000,
    consumoDiario: 4000,
    diasCobertura: 0.25,
    severidad: 'critico',
    impacto: [{ productoId: 'mediana', descripcion: 'Pizza mediana', unidadesPosibles: 10, esCuelloDeBotella: true }],
    proveedor: {
        proveedorInsumoId: 'pi1',
        proveedorId: 'p1',
        proveedorNombre: 'Distribuidora El Molino',
        presentacion: 'Saco 5 kg',
        unidadesPorPresentacion: 5000,
        precioPresentacion: 18,
        diasEntrega: 2,
        compra: { presentaciones: 6, unidadesQueLlegan: 30000, costoEstimado: 108, excedente: 3000 },
    },
});
console.log(`        "${aviso}"`);
check('el aviso menciona las unidades que quedan', aviso.includes('10 Pizza mediana'), true);
check('el aviso menciona al proveedor y el costo', aviso.includes('Distribuidora El Molino') && aviso.includes('108.00'), true);

console.log(`\n${fallos === 0 ? 'TODAS LAS PRUEBAS PASARON' : `${fallos} PRUEBA(S) FALLARON`}\n`);
process.exit(fallos === 0 ? 0 : 1);
