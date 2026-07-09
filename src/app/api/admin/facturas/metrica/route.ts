import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdminApi } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    // 1. Total facturas emitidas en el periodo (o total global por estado)
    const porEstado = await prisma.facturaEmitida.groupBy({
      by: ['estado'],
      _count: { id: true },
      _sum: { total: true, itbms: true }
    });

    const totalFacturas = porEstado.reduce((acc, curr) => acc + curr._count.id, 0);
    const totalMonto = porEstado.reduce((acc, curr) => acc + Number(curr._sum.total || 0), 0);
    const rechazadas = porEstado.find(p => p.estado === 'RECHAZADA')?._count.id || 0;
    const aceptadas = porEstado.find(p => p.estado === 'ACEPTADA')?._count.id || 0;

    // 2. Ranking de cuentas con mayor volumen de emisión de facturas
    const rankingCuentasRaw = await prisma.facturaEmitida.groupBy({
      by: ['cuentaId'],
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const cuentaIds = rankingCuentasRaw.map(r => r.cuentaId);
    const cuentasInfo = await prisma.cuenta.findMany({
      where: { id: { in: cuentaIds } },
      select: { id: true, empresa: true, ruc: true, plan: { select: { nombre: true, name: true } } }
    });

    const ranking = rankingCuentasRaw.map(r => {
      const info = cuentasInfo.find(c => c.id === r.cuentaId);
      return {
        cuentaId: r.cuentaId,
        empresa: info?.empresa || 'Desconocido',
        ruc: info?.ruc || 'N/A',
        plan: info?.plan?.nombre || info?.plan?.name || 'Sin plan',
        emitidas: r._count.id,
        montoTotal: r._sum.total || 0
      };
    });

    // 3. Consumo promedio por plan
    const planes = await prisma.plan.findMany({
      select: { id: true, name: true, nombre: true, facturasIncluidas: true, includedDocuments: true }
    });

    const consumoPorPlan = await Promise.all(
      planes.map(async p => {
        const cuentasEnPlan = await prisma.cuenta.findMany({
          where: { planId: p.id },
          select: { id: true }
        });
        const ids = cuentasEnPlan.map(c => c.id);
        const emitidasPlan = ids.length > 0
          ? await prisma.facturaEmitida.count({ where: { cuentaId: { in: ids } } })
          : 0;
        return {
          planId: p.id,
          nombrePlan: p.nombre || p.name,
          cuotasIncluidas: p.facturasIncluidas || p.includedDocuments || 100,
          cuentasSuscritas: cuentasEnPlan.length,
          totalEmitidas: emitidasPlan,
          promedioPorCuenta: cuentasEnPlan.length > 0 ? Number((emitidasPlan / cuentasEnPlan.length).toFixed(2)) : 0
        };
      })
    );

    return NextResponse.json({
      resumenGlobal: {
        totalFacturas,
        totalMonto,
        aceptadas,
        rechazadas,
        tasaRechazo: totalFacturas > 0 ? `${((rechazadas / totalFacturas) * 100).toFixed(1)}%` : '0%'
      },
      rankingCuentas: ranking,
      consumoPorPlan
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/facturas/metrica:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener métricas de facturación' }, { status: 500 });
  }
}
