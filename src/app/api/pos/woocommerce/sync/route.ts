import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { decrypt } from '@/lib/utils/crypto';

/**
 * Igual que /api/pos/woocommerce: no tenia autenticacion y cuentaId venia del cliente.
 * Ademas SYNC_STOCK_CATALOGO consultaba prisma.producto.findMany({ where: { activo: true } })
 * SIN filtro de empresaId -- traia hasta 100 productos de TODAS las empresas del sistema
 * (fuga de datos entre tenants). Ahora la cuenta y la empresa se resuelven desde la sesion
 * y el catalogo se filtra siempre por empresaId del llamante.
 *
 * Ademas, SYNC_STOCK_CATALOGO e IMPORTAR_PEDIDOS_WOO nunca llamaban a la API real de
 * WooCommerce: el primero solo tocaba la fecha de ultima sincronizacion y decia "stock
 * alineado" sin haber contactado la tienda; el segundo devolvia dos pedidos de ejemplo
 * hardcodeados sin importar que tienda estuviera configurada. Ahora ambos usan la REST API
 * v3 de WooCommerce (wp-json/wc/v3) autenticada con Basic Auth (Consumer Key/Secret, ya
 * guardados cifrados en ConfiguracionWoo).
 */

const WOO_TIMEOUT_MS = 15000;

interface WooMetaData {
  key?: string;
  value?: string | number;
}

interface WooLineItem {
  name: string;
  quantity: number;
  total?: string | number;
}

interface WooOrder {
  number?: string | number;
  id: string | number;
  meta_data?: WooMetaData[];
  billing?: { first_name?: string; last_name?: string; company?: string };
  total_tax?: string | number;
  total?: string | number;
  payment_method_title?: string;
  line_items?: WooLineItem[];
  date_created?: string;
}

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
      return NextResponse.json({ error: 'Debes iniciar sesion para sincronizar con WooCommerce.' }, { status: 401 });
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
      return NextResponse.json({ error: 'Integracion con WooCommerce inactiva o no configurada para esta cuenta' }, { status: 400 });
    }

    const consumerKey = decrypt(config.consumerKey);
    const consumerSec = decrypt(config.consumerSec);

    // Si la accion es sincronizar catalogo y niveles de inventario bidireccionalmente
    if (accion === 'SYNC_STOCK_CATALOGO') {
      const productos = await prisma.producto.findMany({
        where: { activo: true, empresaId, codigoInterno: { not: '' } },
        take: 100
      });

      // Llamada de prueba para detectar credenciales invalidas o tienda inalcanzable ANTES
      // de recorrer todo el catalogo (evita 100 requests fallidos si algo basico esta mal).
      let testRes: Response;
      try {
        testRes = await wooRequest(config.urlTienda, consumerKey, consumerSec, '/products?per_page=1');
      } catch {
        return NextResponse.json({
          error: 'No se pudo conectar con la URL de la tienda WooCommerce configurada. Verifica que sea correcta, use HTTPS y este accesible publicamente.'
        }, { status: 502 });
      }
      if (testRes.status === 401 || testRes.status === 403) {
        return NextResponse.json({
          error: 'WooCommerce rechazo las credenciales configuradas (Consumer Key/Secret invalidas o sin permiso de Lectura/Escritura). Revisalas en Configuracion -> Integraciones.'
        }, { status: 400 });
      }
      if (!testRes.ok) {
        return NextResponse.json({ error: `No se pudo conectar con WooCommerce (HTTP ${testRes.status}).` }, { status: 400 });
      }

      let actualizados = 0;
      let sinCoincidencia = 0;
      const errores: string[] = [];

      for (const producto of productos) {
        try {
          const buscar = await wooRequest(
            config.urlTienda,
            consumerKey,
            consumerSec,
            `/products?sku=${encodeURIComponent(producto.codigoInterno)}&per_page=1`
          );
          if (!buscar.ok) {
            errores.push(`${producto.codigoInterno}: HTTP ${buscar.status} al buscar`);
            continue;
          }
          const encontrados = await buscar.json();
          if (!Array.isArray(encontrados) || encontrados.length === 0) {
            sinCoincidencia++;
            continue;
          }
          const actualizar = await wooRequest(
            config.urlTienda,
            consumerKey,
            consumerSec,
            `/products/${encontrados[0].id}`,
            { method: 'PUT', body: JSON.stringify({ stock_quantity: producto.stockActual, manage_stock: true }) }
          );
          if (actualizar.ok) {
            actualizados++;
          } else {
            errores.push(`${producto.codigoInterno}: HTTP ${actualizar.status} al actualizar`);
          }
        } catch (e) {
          errores.push(`${producto.codigoInterno}: ${e instanceof Error ? e.message : 'error de red'}`);
        }
      }

      await prisma.configuracionWoo.update({
        where: { cuentaId: cuenta.id },
        data: { ultimaSync: new Date() }
      });

      await registrarLogAuditoria({
        adminId: userId,
        accion: 'SYNC_WOOCOMMERCE_STOCK',
        objetivo: 'ConfiguracionWoo',
        detalles: { productosProcesados: productos.length, actualizados, sinCoincidencia, errores: errores.length, urlTienda: config.urlTienda },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      });

      return NextResponse.json({
        success: true,
        message: `Sincronizacion completada: ${actualizados} de ${productos.length} productos actualizados en WooCommerce por SKU` +
          (sinCoincidencia ? `, ${sinCoincidencia} sin SKU coincidente en la tienda` : '') +
          (errores.length ? `, ${errores.length} con error` : '') + '.',
        detalles: { actualizados, sinCoincidencia, errores: errores.slice(0, 10) },
        ultimaSync: new Date().toISOString()
      });
    }

    // Si la accion es importar pedidos de la tienda online para emitir boletas/facturas electronicas en Panama
    if (accion === 'IMPORTAR_PEDIDOS_WOO') {
      let ordersRes: Response;
      try {
        ordersRes = await wooRequest(
          config.urlTienda,
          consumerKey,
          consumerSec,
          '/orders?status=processing,on-hold&per_page=25&orderby=date&order=desc'
        );
      } catch {
        return NextResponse.json({
          error: 'No se pudo conectar con la URL de la tienda WooCommerce configurada. Verifica que sea correcta, use HTTPS y este accesible publicamente.'
        }, { status: 502 });
      }

      if (ordersRes.status === 401 || ordersRes.status === 403) {
        return NextResponse.json({
          error: 'WooCommerce rechazo las credenciales configuradas (Consumer Key/Secret invalidas o sin permiso de lectura). Revisalas en Configuracion -> Integraciones.'
        }, { status: 400 });
      }
      if (!ordersRes.ok) {
        return NextResponse.json({ error: `Error al consultar pedidos en WooCommerce (HTTP ${ordersRes.status}).` }, { status: 400 });
      }

      const ordenesWoo = await ordersRes.json();
      if (!Array.isArray(ordenesWoo)) {
        return NextResponse.json({ error: 'Respuesta inesperada de WooCommerce al listar pedidos.' }, { status: 502 });
      }

      const pedidos = (ordenesWoo as WooOrder[]).map((o) => {
        const metaRuc = (o.meta_data || []).find((m) => /ruc|cedula|c[ée]dula/i.test(m?.key || ''));
        const nombreCliente =
          [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(' ').trim() ||
          o.billing?.company ||
          'Consumidor Final';
        const tieneImpuesto = Number(o.total_tax || 0) > 0;

        return {
          idWoo: String(o.number ?? o.id),
          cliente: nombreCliente,
          ruc: metaRuc?.value ? String(metaRuc.value) : 'CF',
          total: Number(o.total || 0),
          metodoPago: o.payment_method_title || 'No especificado',
          items: (o.line_items || []).map((li) => ({
            descripcion: li.name,
            cantidad: li.quantity,
            precioUnitario: li.quantity > 0 ? Number(li.total || 0) / li.quantity : Number(li.total || 0),
            itbmsPorcentaje: tieneImpuesto ? 7 : 0
          })),
          fecha: o.date_created || new Date().toISOString()
        };
      });

      await registrarLogAuditoria({
        adminId: userId,
        accion: 'IMPORTAR_PEDIDOS_WOOCOMMERCE',
        objetivo: 'ConfiguracionWoo',
        detalles: { pedidosEncontrados: pedidos.length, urlTienda: config.urlTienda },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      });

      return NextResponse.json({
        success: true,
        pedidos,
        message: pedidos.length > 0
          ? `Se encontraron ${pedidos.length} pedido(s) en WooCommerce pendientes de facturacion DGI.`
          : 'No hay pedidos nuevos ("processing"/"on-hold") en tu tienda WooCommerce en este momento.'
      });
    }

    return NextResponse.json({ error: 'Accion no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('Error POST /api/pos/woocommerce/sync:', error);
    return NextResponse.json({ error: 'Error durante la sincronizacion con WooCommerce' }, { status: 500 });
  }
}
