import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { encrypt } from '@/lib/utils/crypto';

/**
 * Este endpoint no tenía NINGUNA autenticación: cuentaId venía directo del query/body del
 * cliente, así que cualquiera podía leer o SOBRESCRIBIR las credenciales de WooCommerce
 * (Consumer Key/Secret de la tienda en línea) de cualquier otra empresa con solo mandar su
 * cuentaId. Además usaba un cifrado AES-256-CBC casero con una clave de respaldo hardcodeada
 * en vez del encrypt()/decrypt() real (AES-256-GCM autenticado) que ya usa el resto del app.
 * Ahora la cuenta se resuelve siempre desde la sesión, igual que en /api/pos/ventas.
 */
async function resolverCuentaDeSesion() {
  const { empresaId } = await getTenantContext();
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) return null;
  return prisma.cuenta.findFirst({ where: { ruc: empresa.ruc } });
}

export async function GET(_request: NextRequest) {
  try {
    let cuenta;
    try {
      cuenta = await resolverCuentaDeSesion();
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver esta configuración.' }, { status: 401 });
    }

    if (!cuenta) {
      return NextResponse.json({ config: null });
    }

    const config = await prisma.configuracionWoo.findUnique({
      where: { cuentaId: cuenta.id }
    });

    if (!config) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({
      config: {
        id: config.id,
        cuentaId: config.cuentaId,
        urlTienda: config.urlTienda,
        consumerKeyMasked: config.consumerKey ? 'ck_**********' : '',
        consumerSecMasked: config.consumerSec ? 'cs_**********' : '',
        activo: config.activo,
        ultimaSync: config.ultimaSync
      }
    });
  } catch (error) {
    console.error('Error GET /api/pos/woocommerce:', error);
    return NextResponse.json({ error: 'Error al obtener configuración de WooCommerce' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para guardar esta configuración.' }, { status: 401 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }
    const cuenta = await prisma.cuenta.findFirst({ where: { ruc: empresa.ruc } });
    if (!cuenta) {
      return NextResponse.json({ error: 'No hay cuenta fiscal vinculada a tu empresa. Contacta a soporte.' }, { status: 404 });
    }

    const body = await request.json();
    const { urlTienda, consumerKey, consumerSec, activo } = body;

    if (!urlTienda || !consumerKey || !consumerSec) {
      return NextResponse.json({ error: 'Todos los campos de conexión (URL, Consumer Key, Consumer Secret) son requeridos' }, { status: 400 });
    }

    const keyCifrada = encrypt(consumerKey);
    const secCifrada = encrypt(consumerSec);

    const config = await prisma.configuracionWoo.upsert({
      where: { cuentaId: cuenta.id },
      update: {
        urlTienda,
        consumerKey: keyCifrada,
        consumerSec: secCifrada,
        activo: activo !== undefined ? activo : true
      },
      create: {
        cuentaId: cuenta.id,
        urlTienda,
        consumerKey: keyCifrada,
        consumerSec: secCifrada,
        activo: true
      }
    });

    await registrarLogAuditoria({
      adminId: userId,
      accion: 'ACTUALIZAR_CREDENCIALES_WOOCOMMERCE',
      objetivo: 'ConfiguracionWoo',
      objetivoId: config.id,
      detalles: { urlTienda, activo },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: 'Conexión con WooCommerce guardada con cifrado AES-256-GCM.'
    });
  } catch (error) {
    console.error('Error POST /api/pos/woocommerce:', error);
    return NextResponse.json({ error: 'Error al guardar credenciales de WooCommerce' }, { status: 500 });
  }
}