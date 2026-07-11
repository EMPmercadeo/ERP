import crypto from 'crypto';

/**
 * Cliente para el Botón de Pago Yappy V2 (Banco General), documentado en
 * https://www.yappy.com.pa/comercial/desarrolladores/boton-de-pago-yappy-nueva-integracion/
 *
 * IMPORTANTE — esto no se pudo probar contra credenciales reales (el usuario todavía no las
 * tiene). Las dos llamadas REST de aquí abajo (validar comercio + crear orden) están escritas
 * exactamente como las documenta Yappy, con nombres de campo y URLs copiados literalmente de
 * la documentación oficial. Antes de usar en producción, hay que probar primero contra el
 * ambiente de "Pruebas" (UAT) de Yappy con credenciales de un usuario de prueba real.
 *
 * Interruptor global: igual que PAC_INTEGRATION_ENABLED (src/lib/pac/mock-pac-client.ts), esto
 * se repite DENTRO de cada función (no solo en los call-sites) para que sea imposible hacer una
 * llamada real a Yappy mientras el interruptor esté apagado, sin importar qué empresa lo tenga
 * configurado.
 */
const YAPPY_INTEGRATION_ENABLED = process.env.YAPPY_INTEGRATION_ENABLED === 'true';

const BASE_URL_PRODUCCION = 'https://apipagosbg.bgeneral.cloud';
const BASE_URL_PRUEBAS = 'https://api-comecom-uat.yappycloud.com';

export interface YappyCredenciales {
  merchantId: string;
  secretKey: string; // ya descifrada
  domain: string;
  ambiente: 'produccion' | 'pruebas';
}

function baseUrl(ambiente: 'produccion' | 'pruebas'): string {
  return ambiente === 'produccion' ? BASE_URL_PRODUCCION : BASE_URL_PRUEBAS;
}

interface ValidarComercioResponse {
  status: { code: string; description: string };
  body: { epochTime: number; token: string };
}

/**
 * Paso 1: valida el comercio contra Yappy y obtiene el token de sesión que se debe usar en el
 * paso 2 (crear orden). POST {baseUrl}/payments/validate/merchant
 */
export async function validarComercioYappy(cred: YappyCredenciales): Promise<{ token: string }> {
  if (!YAPPY_INTEGRATION_ENABLED) {
    throw new Error('La integración con Yappy todavía no está habilitada en este entorno.');
  }

  const res = await fetch(`${baseUrl(cred.ambiente)}/payments/validate/merchant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: cred.merchantId,
      urlDomain: cred.domain
    })
  });

  const data = (await res.json().catch(() => null)) as ValidarComercioResponse | null;
  if (!res.ok || !data?.body?.token) {
    throw new Error(data?.status?.description || 'Yappy rechazó la validación del comercio.');
  }
  return { token: data.body.token };
}

interface CrearOrdenResponse {
  status: { code: string; description: string };
  body: { transactionId: string; token: string; documentName: string };
}

export interface CrearOrdenYappyInput {
  orderId: string; // alfanumérico, 1-15 caracteres
  ipnUrl: string;
  subtotal: number;
  itbms: number;
  descuento?: number;
  total: number;
}

/**
 * Paso 2: crea la orden de cobro. POST {baseUrl}/payments/payment-wc
 * Requiere el token del paso 1 en el header Authorization.
 */
export async function crearOrdenYappy(
  cred: YappyCredenciales,
  token: string,
  input: CrearOrdenYappyInput
): Promise<{ transactionId: string; token: string; documentName: string }> {
  if (!YAPPY_INTEGRATION_ENABLED) {
    throw new Error('La integración con Yappy todavía no está habilitada en este entorno.');
  }
  if (input.orderId.length < 1 || input.orderId.length > 15) {
    throw new Error('El orderId de Yappy debe tener entre 1 y 15 caracteres alfanuméricos.');
  }

  const res = await fetch(`${baseUrl(cred.ambiente)}/payments/payment-wc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify({
      merchantId: cred.merchantId,
      orderId: input.orderId,
      domain: cred.domain,
      paymentDate: Date.now(),
      ipnUrl: input.ipnUrl,
      discount: (input.descuento ?? 0).toFixed(2),
      taxes: input.itbms.toFixed(2),
      subtotal: input.subtotal.toFixed(2),
      total: input.total.toFixed(2)
    })
  });

  const data = (await res.json().catch(() => null)) as CrearOrdenResponse | null;
  if (!res.ok || !data?.body?.transactionId) {
    throw new Error(data?.status?.description || 'Yappy rechazó la creación de la orden.');
  }
  return data.body;
}

/**
 * Genera un orderId corto (<=15 caracteres alfanuméricos) requerido por Yappy. No usa cuid()
 * porque esos son de 25 caracteres, muy largos para este campo.
 */
export function generarOrderIdYappy(): string {
  const base = Date.now().toString(36); // ~8 caracteres
  const rand = crypto.randomBytes(3).toString('hex'); // 6 caracteres
  return (base + rand).slice(0, 15);
}

/**
 * Valida el hash HMAC-SHA256 que Yappy manda en la notificación IPN, siguiendo exactamente el
 * algoritmo documentado (clave secreta en base64, separada por '.', se usa solo la primera
 * parte como clave HMAC sobre `orderId + status + domain`).
 */
export function validarHashIpnYappy(params: {
  orderId: string;
  status: string;
  domain: string;
  hash: string;
  secretKeyBase64: string;
}): boolean {
  try {
    const decoded = Buffer.from(params.secretKeyBase64, 'base64').toString('utf-8');
    const claveHmac = decoded.split('.')[0];
    const firma = crypto
      .createHmac('sha256', claveHmac)
      .update(params.orderId + params.status + params.domain)
      .digest('hex');
    // Comparación en tiempo constante para no filtrar el hash esperado por timing attack.
    const a = Buffer.from(firma, 'hex');
    const b = Buffer.from(params.hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
