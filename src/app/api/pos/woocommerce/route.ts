import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import crypto from 'crypto';

// Utilidad de cifrado AES-256 en servidor
const SECRET_KEY = process.env.WOO_AES_SECRET || 'erp-panama-secret-key-32-bytes-abc';
const ALGORITHM = 'aes-256-cbc';

function cifrar(texto: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(texto, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function descifrar(textoCifrado: string): string {
  try {
    const parts = textoCifrado.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '***CLAVE_PROTEGIDA***';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cuentaId = searchParams.get('cuentaId') || 'empresa-demo-id';

    const config = await prisma.configuracionWoo.findUnique({
      where: { cuentaId }
    });

    if (!config) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({
      config: {
        id: config.id,
        cuentaId: config.cuentaId,
        urlTienda: config.urlTienda,
        consumerKeyMasked: config.consumerKey ? 'ck_**********' + config.consumerKey.slice(-4) : '',
        consumerSecMasked: config.consumerSec ? 'cs_**********' + config.consumerSec.slice(-4) : '',
        activo: config.activo,
        ultimaSync: config.ultimaSync
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/pos/woocommerce:', error);
    return NextResponse.json({ error: 'Error al obtener configuración de WooCommerce' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cuentaId, urlTienda, consumerKey, consumerSec, activo } = body;

    if (!cuentaId || !urlTienda || !consumerKey || !consumerSec) {
      return NextResponse.json({ error: 'Todos los campos de conexión (URL, Consumer Key, Consumer Secret) son requeridos' }, { status: 400 });
    }

    const keyCifrada = cifrar(consumerKey);
    const secCifrada = cifrar(consumerSec);

    const config = await prisma.configuracionWoo.upsert({
      where: { cuentaId },
      update: {
        urlTienda,
        consumerKey: keyCifrada,
        consumerSec: secCifrada,
        activo: activo !== undefined ? activo : true
      },
      create: {
        cuentaId,
        urlTienda,
        consumerKey: keyCifrada,
        consumerSec: secCifrada,
        activo: true
      }
    });

    await registrarLogAuditoria({
      adminId: cuentaId,
      accion: 'ACTUALIZAR_CREDENCIALES_WOOCOMMERCE',
      objetivo: 'ConfiguracionWoo',
      objetivoId: config.id,
      detalles: { urlTienda, activo },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: 'Conexión con WooCommerce guardada con cifrado de grado bancario (AES-256).'
    });
  } catch (error: any) {
    console.error('Error POST /api/pos/woocommerce:', error);
    return NextResponse.json({ error: 'Error al guardar credenciales de WooCommerce' }, { status: 500 });
  }
}
