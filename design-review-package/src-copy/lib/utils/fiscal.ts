import { formatCurrency } from './currency';

export const ITBMS_RATES: Record<string, number> = {
    '00': 0.00, // Exento
    '01': 0.07, // ITBMS 7%
    '02': 0.10, // ITBMS 10%
    '03': 0.15, // ITBMS 15%
};

export const ITBMS_NAMES: Record<string, string> = {
    '00': 'Exento',
    '01': 'ITBMS 7%',
    '02': 'ITBMS 10%',
    '03': 'ITBMS 15%',
};

export function obtenerTasaITBMS(codigo: string): number {
    return ITBMS_RATES[codigo] ?? 0;
}

export function calcularITBMS(precioVenta: number, codigoTasaItbms: string): number {
    const tasa = obtenerTasaITBMS(codigoTasaItbms);
    return precioVenta * tasa;
}

export function calcularPrecioConImpuesto(precioVenta: number, codigoTasaItbms: string): number {
    return precioVenta + calcularITBMS(precioVenta, codigoTasaItbms);
}

export function calcularMargen(precioVenta: number, costoUnitario: number) {
    const rentabilidad = precioVenta - costoUnitario;
    const margenPorcentaje = precioVenta > 0 ? (rentabilidad / precioVenta) * 100 : 0;
    return {
        rentabilidad,
        margenPorcentaje
    };
}

export function formatearMoneda(valor: number): string {
    return formatCurrency(valor);
}

export function formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
}
