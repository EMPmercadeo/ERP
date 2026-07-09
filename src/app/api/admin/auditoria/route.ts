import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { requireSuperAdminApi } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '30', 10);
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

    const resultado = await paginar(prisma.logAuditoria, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error GET /api/admin/auditoria:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener log de auditoría' }, { status: 500 });
  }
}
