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
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado'); // ABIERTO | EN_PROCESO | RESUELTO | CERRADO
    const prioridad = searchParams.get('prioridad'); // BAJA | NORMAL | ALTA | URGENTE
    const cuentaId = searchParams.get('cuentaId');
    const asignadoA = searchParams.get('asignadoA');

    const where: any = {};
    if (estado && estado !== 'all') where.estado = estado;
    if (prioridad && prioridad !== 'all') where.prioridad = prioridad;
    if (cuentaId && cuentaId !== 'all') where.cuentaId = cuentaId;
    if (asignadoA && asignadoA !== 'all') where.asignadoA = asignadoA;

    const resultado = await paginar(prisma.ticketSoporte, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cuenta: { select: { id: true, nombre: true, empresa: true, ruc: true, correo: true } },
        _count: { select: { respuestas: true } }
      }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error GET /api/admin/soporte:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener tickets de soporte' }, { status: 500 });
  }
}
