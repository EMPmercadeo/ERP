/**
 * Control de hardware físico de POS (impresora térmica ESC/POS y cajón de dinero) desde el
 * navegador, vía la Web Serial API (Chrome/Edge en desktop y Android — no soportada en
 * Safari/iOS ni Firefox).
 *
 * Esto SOLO puede probarse con hardware real conectado al dispositivo del usuario: en este
 * entorno de desarrollo no hay impresora ni cajón físicos, así que todo aquí está escrito de
 * forma defensiva (feature-detect primero, no-op silencioso con un motivo si no hay soporte
 * o el usuario no conecta nada) — el flujo de venta/impresión por `window.print()` (diálogo
 * del sistema operativo) sigue funcionando siempre, sin depender de este módulo.
 *
 * Protocolo: comandos ESC/POS crudos (estándar de facto de impresoras térmicas de recibo).
 * El comando de apertura de cajón (ESC p) es el mismo que casi toda impresora térmica con
 * puerto RJ11 reenvía al cajón conectado a ella — no existe un estándar universal más allá
 * de eso sin conocer la marca/modelo exacto del cajón.
 */

export function haySoporteSerial(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

// ESC @ - inicializa/resetea la impresora
const CMD_INIT = new Uint8Array([0x1b, 0x40]);
// ESC p 0 25 250 - pulso al pin 2 del conector RJ11 (abre el cajón en la inmensa mayoría de
// impresoras térmicas económicas; algunos modelos usan el pin 5, no hay forma de saberlo sin
// probar con el hardware real del usuario)
const CMD_ABRIR_CAJON = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
// GS V 0 - corte total de papel (si la impresora tiene cuchilla automática)
const CMD_CORTAR = new Uint8Array([0x1d, 0x56, 0x00]);
const LF = new Uint8Array([0x0a]);

interface ReciboParaImprimir {
  numero: string;
  fecha: string;
  tipo: string;
  cliente: string;
  items: Array<{ cantidad: number; descripcion: string; precioUnitario: number }>;
  subtotal: number;
  itbms: number;
  total: number;
  metodoPago: string;
  referenciaPago?: string;
  mensajeLegal: string;
}

function textoALineasEscPos(recibo: ReciboParaImprimir): Uint8Array[] {
  const enc = new TextEncoder();
  const linea = (s: string) => enc.encode(s + '\n');
  const partes: Uint8Array[] = [CMD_INIT];

  partes.push(linea('ERP PANAMA POS'));
  partes.push(linea(recibo.tipo));
  partes.push(linea(`#${recibo.numero}  ${recibo.fecha}`));
  partes.push(linea('--------------------------------'));
  partes.push(linea(`Cliente: ${recibo.cliente}`));
  for (const it of recibo.items) {
    partes.push(linea(`${it.cantidad}x ${it.descripcion}  $${(it.cantidad * it.precioUnitario).toFixed(2)}`));
  }
  partes.push(linea('--------------------------------'));
  partes.push(linea(`Subtotal: $${recibo.subtotal.toFixed(2)}`));
  partes.push(linea(`ITBMS: $${recibo.itbms.toFixed(2)}`));
  partes.push(linea(`TOTAL: $${recibo.total.toFixed(2)}`));
  partes.push(linea(`Pago: ${recibo.metodoPago}${recibo.referenciaPago ? ' - Ref: ' + recibo.referenciaPago : ''}`));
  partes.push(linea(''));
  partes.push(linea(recibo.mensajeLegal));
  partes.push(LF, LF, LF);
  partes.push(CMD_CORTAR);
  return partes;
}

/**
 * Pide al usuario que elija un puerto serial (diálogo nativo del navegador — requiere un
 * gesto de usuario, ej. click de un botón) y lo abre a 9600 baudios, la velocidad por
 * defecto de la mayoría de impresoras térmicas ESC/POS baratas. Si el modelo del usuario usa
 * otra velocidad, tendrá que ajustarse aquí una vez se conozca el hardware real.
 */
export async function conectarImpresoraSerial(): Promise<SerialPort> {
  if (!haySoporteSerial()) {
    throw new Error('Este navegador no soporta Web Serial (usa Chrome o Edge en computadora o Android).');
  }
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });
  return port;
}

export async function desconectarImpresoraSerial(port: SerialPort | null): Promise<void> {
  if (!port) return;
  try {
    await port.close();
  } catch {
    // Si ya estaba cerrado o el dispositivo se desconectó físicamente, no hay nada que hacer.
  }
}

async function escribirEnPuerto(port: SerialPort, buffers: Uint8Array[]): Promise<void> {
  const writer = port.writable?.getWriter();
  if (!writer) throw new Error('El puerto serial no tiene un stream de escritura disponible.');
  try {
    for (const buf of buffers) {
      await writer.write(buf);
    }
  } finally {
    writer.releaseLock();
  }
}

/**
 * Envía el recibo como texto crudo ESC/POS a la impresora térmica conectada. Complementa
 * (no reemplaza) el botón de "Imprimir" normal por `window.print()`, que sigue siendo la
 * opción segura cuando no hay impresora térmica USB/Serial conectada.
 */
export async function imprimirReciboEscPos(port: SerialPort, recibo: ReciboParaImprimir): Promise<void> {
  await escribirEnPuerto(port, textoALineasEscPos(recibo));
}

/**
 * Abre el cajón de dinero conectado a la impresora térmica. No-op silencioso (rechaza la
 * promesa, que el llamador debe capturar) si no hay puerto conectado — nunca debe romper el
 * flujo de cobro del POS.
 */
export async function abrirCajonDinero(port: SerialPort): Promise<void> {
  await escribirEnPuerto(port, [CMD_ABRIR_CAJON]);
}
