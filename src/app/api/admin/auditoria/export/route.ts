import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const accion = searchParams.get('accion');
    const objetivo = searchParams.get('objetivo');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const where: any = {};
    if (adminId && adminId !== 'all') where.adminId = adminId;
    if (accion && accion !== 'all') where.accion = accion;
    if (objetivo && objetivo !== 'all') where.objetivo = objetivo;

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) where.createdAt.lte = new Date(`${fechaHasta}T23:59:59.999Z`);
    }

    const logs = await prisma.logAuditoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    await registrarLogAuditoria({
      adminId: auth.context.userId,
      accion: 'EXPORTAR_AUDITORIA_CSV',
      objetivo: 'LogAuditoria',
      detalles: { totalExportados: logs.length, filtros: { adminId, accion, objetivo, fechaDesde, fechaHasta } }
    });

    const cabecera = ['ID', 'Admin ID', 'Acción', 'Objetivo', 'ID Objetivo', 'IP', 'Detalles', 'Fecha'];
    const filas = logs.map(l => [
      l.id,
      `"${l.adminId}"`,
      l.accion,
      l.objetivo,
      `"${l.objetivoId || ''}"`,
      `"${l.ip || 'N/A'}"`,
      `"${JSON.stringify(l.detalles || {}).replace(/"/g, '""')}"`,
      l.createdAt.toISOString()
    ]);

    const csvContent = [cabecera.join(','), ...filas.map(f => f.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="auditoria-superadmin-erppanama-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/auditoria/export:', error);
    return NextResponse.json({ error: error.message || 'Error al exportar log de auditoría' }, { status: 500 });
  }
}
