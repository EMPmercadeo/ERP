const ZONA = 'America/Panama';

export function fechaPanama(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

export function horaPanama(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ahora);
}

export function fechaAnterior(fecha: string): string {
  return new Date(Date.parse(`${fecha}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

export function rangoDiaPanama(fecha: string): { desde: Date; hasta: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`))) {
    throw new Error('Fecha inválida');
  }
  const desde = new Date(`${fecha}T05:00:00.000Z`);
  return { desde, hasta: new Date(desde.getTime() + 86_400_000) };
}

// Para locales que cierran entre medianoche y las 05:59, el vencimiento
// corresponde al día calendario anterior. El Z sigue agrupando por fecha calendario.
export function fechasZVencidas(horaCierre: string, ahora = new Date()): string[] {
  const hoy = fechaPanama(ahora);
  const ayer = fechaAnterior(hoy);
  const hora = horaPanama(ahora);
  if (horaCierre < '06:00') {
    return [fechaAnterior(ayer), ...(hora >= horaCierre ? [ayer] : [])];
  }
  return [ayer, ...(hora >= horaCierre ? [hoy] : [])];
}
