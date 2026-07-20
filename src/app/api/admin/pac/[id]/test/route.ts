import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { GenericoPACProvider } from '@/lib/facturacion-electronica/providers/generico.provider';

// Antes este endpoint fabricaba una latencia falsa (45-125ms) y declaraba "Conexión
// establecida exitosamente" con solo comprobar que existieran credenciales guardadas y
// pac.activo === true — nunca llamaba a ningún PAC real. Un super admin podía ver
// "Certificados digitales vigentes" para un proveedor que nunca respondió nada. Ahora
// intenta una operación real y liviana (consultarTransaccion) contra el proveedor
// configurado; mientras no exista un adaptador de PAC real implementado
// (GenericoPACProvider), esto siempre reporta honestamente que no hay conexión.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const adminId = auth.context.userId;

    const pac = await prisma.configuracionPAC.findUnique({ where: { id } });
    if (!pac) {
      return NextResponse.json({ error: 'PAC no encontrado' }, { status: 404 });
    }

    const inicio = performance.now();

    let ok = false;
    let mensaje = '';
    let statusHttp = 200;

    if (!pac.activo || !pac.credenciales) {
      mensaje = `El PAC '${pac.proveedor}' está inactivo o no tiene credenciales configuradas.`;
      statusHttp = 503;
    } else {
      try {
        // Sondeo real: no crea ni modifica ninguna factura, solo confirma que el
        // proveedor puede responder. Con el adaptador Genérico actual esto siempre
        // lanza "no implementado" — que es la verdad, no un simulacro.
        const provider = new GenericoPACProvider(pac.credenciales);
        await provider.consultarTransaccion('conexion-test');
        ok = true;
        mensaje = `Conexión con el PAC '${pac.proveedor}' (${pac.ambiente}) establecida correctamente.`;
      } catch (err) {
        ok = false;
        statusHttp = 503;
        mensaje = err instanceof Error ? err.message : `El PAC '${pac.proveedor}' no respondió.`;
      }
    }

    const fin = performance.now();
    const latenciaMs = Math.round(fin - inicio);

    await registrarLogAuditoria({
      adminId,
      accion: 'PROBAR_CONEXION_PAC',
      objetivo: 'ConfiguracionPAC',
      objetivoId: id,
      detalles: { proveedor: pac.proveedor, ok, latenciaMs }
    });

    return NextResponse.json({
      success: ok,
      proveedor: pac.proveedor,
      ambiente: pac.ambiente,
      latenciaMs,
      mensaje
    }, { status: statusHttp });
  } catch (error) {
    console.error('Error POST /api/admin/pac/[id]/test:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error de verificación del PAC' }, { status: 500 });
  }
}
