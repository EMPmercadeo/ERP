import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

/**
 * Búsqueda rápida de un cliente por RUC/cédula para el POS, scopeada a la empresa de la
 * sesión. Se usa para autocompletar el nombre y sugerir su descuento especial preaprobado
 * (Cliente.descuentoEspecial) sin tener que abrir el módulo completo de Clientes.
 */
export async function GET(request: NextRequest) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    const ruc = new URL(request.url).searchParams.get('ruc')?.trim();
    if (!ruc || ruc.length < 3) {
      return NextResponse.json({ cliente: null });
    }

    const cliente = await prisma.cliente.findFirst({
      where: { empresaId, ruc },
      select: { id: true, razonSocial: true, descuentoEspecial: true }
    });

    if (!cliente) {
      return NextResponse.json({ cliente: null });
    }

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        razonSocial: cliente.razonSocial,
        descuentoEspecial: Number(cliente.descuentoEspecial)
      }
    });
  } catch (error) {
    console.error('Error GET /api/pos/clientes:', error);
    return NextResponse.json({ error: 'Error al buscar el cliente' }, { status: 500 });
  }
}
