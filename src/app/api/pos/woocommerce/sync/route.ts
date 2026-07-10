import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { decrypt } from '@/lib/utils/crypto';

/**
 * Igual que /api/pos/woocommerce: no tenía autenticación y cuentaId venía del cliente.
 * Además SYNC_STOCK_CATALOGO consultaba prisma.producto.findMany({ where: { activo: true } })
 * SIN filtro de empresaId — traía hasta 100 productos de TODAS las empresas del sistema
 * (fuga de datos entre tenants). Ahora la cuenta y la empresa se resuelven desde la sesión
 * y el catálogo se filtra siempre por empresaId del llamante.
 *
 * Además, SYNC_STOCK_CATALOGO e IMPORTAR_PEDIDOS_WOO nunca llamaban a la API real de
 * WooCommerce: el primero solo tocaba la fecha de última sincronización y decía "stock
 * alineado" sin haber contactado la tienda; el segundo devolvía dos pedidos de ejemplo
 * hardcodeados ("María Rodríguez", "Roberto Gómez") sin importar qué tienda estuviera
 * configurada. Ahora ambos usan la REST API v3 de WooCommerce (wp-json/wc/v3) autenticada
 * con Basic Auth (Consumer Key/Secret, ya guardados cifrados en ConfiguracionWoo).
 */

const WOO_TIMEOUT_MS = 15000;

async function wooRequest(
  urlTienda: string,
  consumerKey: string,
  consumerSecret: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const base = urlTienda.replace(/\/+$/, '');
  const url = `${base}/wp-json/wc/v3${path}`;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    signal: AbortSignal.timeout(WOO_TIMEOUT_MS)
  });
}

export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para sincronizar con WooCommerce.' }, { status: 401 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }
    const cuenta = await prisma.cuenta.findFirst({ where: { ruc: empresa.ruc } });
    if (!cuenta) {
      return NextResponse.json({ error: 'No hay cuenta fiscal vinculada a tu empresa.' }, { status: 404 });
    }

    const body = await request.json();
    const { accion } = body; // 'SYNC_STOCK_CATALOGO' | 'IMPORTAR_PEDIDOS_WOO'

    const config = await prisma.configuracionWoo.findUnique({ where: { cuentaId: cuenta.id } });
    if (!config || !config.activo) {
      return NextResponse.json({ error: 'Integración con WooCommerce inactiva o no configurada para esta cuenta' }, { status: 400 });
    }

    const consumerKey = decrypt(config.consumerKey);
    const consumerSec = decrypt(config.consumerSec);

    // Si la acción es sincronizar catálogo y niveles de inventario bidireccionalmente
    if (accion === 'SYNC_STOCK_CATALOGO') {
      const productos = await prisma.producto.findMany({
        where: { activo: true, empresaId, codigoInterno: { not: '' } },
        take: 100
      });

      // Llamada de prueba para detectar credenciales inválidas o tienda inalcanzable ANTES
      // de recorrer todo el catálogo (evita 100 requests fallidos si algo básico está mal).
      let testRes: Response;
      try {
        testRes = await wooRequest(config.urlTienda, consumerKey, consumerSec, '/products?per_page=1');
      } catch {
        return NextResponse.json({
          error: 'No se pudo conectar con la URL de la tienda WooCommerce configurada. Verifica que sea correcta, use HTTPS y esté accesible públicamente.'
        }, { status: 502 });
      }
      if (testRes.status === 401 || testRes.status === 403) {
        return NextResponse.json({
          error: 'WooCommerce rechazó las credenciales configuradas (Consumer Key/Secret inválidas o sin permiso de Lectura/Escritura). Revísalas en Configuración → Integraciones.'
        }, { status: 400 });
      }
      if (!testRes.