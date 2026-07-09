import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const cuentaId = searchParams.get('cuentaId');

    const where: any = {};
    if (estado && estado !== 'all') {
      where.estado = estado;
    }
    if (cuentaId) {
      where.cuentaId = cuentaId;
    }

    const pagos = await prisma.pagoCuenta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cuenta: { select: { empresa: true, ruc: true, correo: true } },
        plan: { select: { nombre: true, name: true } }
      }
    });

    await registrarLogAuditoria({
      adminId: auth.context.userId,
      accion: 'EXPORTAR_PAGOS_CSV',
      objetivo: 'PagoCuenta',
      detalles: { cantidad: pagos.length, filtros: { estado, cuentaId } }
    });

    const cabecera = ['ID Pago', 'Empresa', 'RUC', 'Correo', 'Plan', 'Monto', 'Método', 'Referencia', 'Estado', 'Fecha'];
    const filas = pagos.map(p => [
      p.id,
      `"${(p.cuenta.empresa || '').replace(/"/g, '""')}"`,
      `"${p.cuenta.ruc}"`,
      `"${p.cuenta.correo}"`,
      `"${p.plan?.nombre || p.plan?.name || 'Sin plan'}"`,
      p.monto.toString(),
      p.metodo,
      `"${p.referencia}"`,
      p.estado,
      p.createdAt.toISOString()
    ]);

    const csvContent = [cabecera.join(','), ...filas.map(f => f.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pagos-ingresos-erppanama-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/pagos/export:', error);
    return NextResponse.json({ error: error.message || 'Error al exportar pagos CSV' }, { status: 500 });
  }
}
