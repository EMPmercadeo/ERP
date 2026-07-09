import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado'); // ACEPTADA | RECHAZADA | ANULADA | ENVIADA
    const cuentaId = searchParams.get('cuentaId');
    const soloRechazadas = searchParams.get('soloRechazadas') === 'true';

    const where: any = {};
    if (soloRechazadas) {
      where.estado = 'RECHAZADA';
    } else if (estado && estado !== 'all') {
      where.estado = estado;
    }

    if (cuentaId && cuentaId !== 'all') {
      where.cuentaId = cuentaId;
    }

    const resultado = await paginar(prisma.facturaEmitida, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cuenta: { select: { id: true, nombre: true, empresa: true, ruc: true, correo: true } }
      }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error GET /api/admin/facturas:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener facturas electrónicas' }, { status: 500 });
  }
}
