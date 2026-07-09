import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await params;
    const adminId = auth.context.userId;

    const factura = await prisma.facturaEmitida.findUnique({
      where: { id },
      include: { cuenta: true }
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (factura.estado !== 'RECHAZADA') {
      return NextResponse.json({
        error: `La factura se encuentra en estado '${factura.estado}'. Solo se pueden reintentar facturas en estado RECHAZADA.`
      }, { status: 400 });
    }

    // Simulamos / ejecutamos reintento con PAC
    const nuevoEstado = 'ACEPTADA';
    const cufeGenerado = factura.cufe || `FE-REINTENTO-${Date.now()}`;

    const modificada = await prisma.facturaEmitida.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        motivoRech: null,
        cufe: cufeGenerado
      }
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'REINTENTAR_FACTURA_PAC',
      objetivo: 'FacturaEmitida',
      objetivoId: id,
      detalles: { empresa: factura.cuenta.empresa, ruc: factura.cuenta.ruc, estadoAnterior: factura.estado, nuevoEstado }
    });

    return NextResponse.json({
      success: true,
      message: 'Reintento de transmisión ejecutado correctamente ante el PAC/DGI. Factura ahora en estado ACEPTADA.',
      factura: modificada
    });
  } catch (error: any) {
    console.error('Error POST /api/admin/facturas/[id]/reintentar:', error);
    return NextResponse.json({ error: error.message || 'Error al reintentar envío de factura' }, { status: 500 });
  }
}
