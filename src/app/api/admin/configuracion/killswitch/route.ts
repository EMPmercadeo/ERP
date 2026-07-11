import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';

export async function POST(_request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;

    // Buscar si hay algún PAC marcado como respaldo (esRespaldo = true)
    const pacRespaldo = await prisma.configuracionPAC.findFirst({
      where: { esRespaldo: true, activo: true }
    });

    if (!pacRespaldo) {
      return NextResponse.json({
        error: 'No hay un proveedor PAC de respaldo configurado y activo. Configure primero un PAC secundario en el módulo /admin/pac.'
      }, { status: 400 });
    }

    // 1 clic kill switch: desactivar esRespaldo para el primario actual y activar el PAC de respaldo como primario
    await prisma.$transaction([
      prisma.configuracionPAC.updateMany({
        where: { esRespaldo: false },
        data: { esRespaldo: true }
      }),
      prisma.configuracionPAC.update({
        where: { id: pacRespaldo.id },
        data: { esRespaldo: false, activo: true }
      })
    ]);

    await registrarLogAuditoria({
      adminId,
      accion: 'ACTIVAR_KILLSWITCH_PAC',
      objetivo: 'ConfiguracionPAC',
      objetivoId: pacRespaldo.id,
      detalles: { nuevoPACPrimario: pacRespaldo.proveedor, ambiente: pacRespaldo.ambiente }
    });

    return NextResponse.json({
      success: true,
      message: `¡Kill-Switch Ejecutado con Éxito! Todas las emisiones de facturación electrónica han sido conmutadas con 1 clic al PAC de respaldo: '${pacRespaldo.proveedor}' (${pacRespaldo.ambiente}).`,
      nuevoPrimario: {
        id: pacRespaldo.id,
        proveedor: pacRespaldo.proveedor,
        ambiente: pacRespaldo.ambiente
      }
    });
  } catch (error) {
    console.error('Error POST /api/admin/configuracion/killswitch:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al ejecutar kill switch de PAC' }, { status: 500 });
  }
}
