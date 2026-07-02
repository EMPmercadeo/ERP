export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('es-PA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatInteger(value: number): string {
    return new Intl.NumberFormat('es-PA', {
        maximumFractionDigits: 0,
    }).format(value);
}
