import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { TurnoCajaAperturaSchema } from '@/lib/validations';
import { fechaPanama, fechasZVencidas, rangoDiaPanama } from '@/lib/pos/fechaNegocio';

/**
 * Abre un turno de caja para el cajero de la sesión actual. Bloquea si ya tiene uno abierto
 * (un cajero no puede tener dos turnos abiertos a la vez) — esta es la fuente de verdad real:
 * /api/pos/ventas rechaza cualquier venta si no encuentra un turno 'abierto' para
 * (empresaId, usuarioId) en el servidor, sin importar lo que la UI crea.
 */
export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    let role: string;
    try {
      ({ empresaId, userId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para abrir un turno de caja.' }, { status: 401 });
    }
    if (!['admin', 'super_admin', 'gerente', 'vendedor', 'salonero'].includes(role)) return NextResponse.json({ error: 'Sin permiso para abrir caja.' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const parsed = TurnoCajaAperturaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const hoy = fechaPanama();
    const cierreHoy = await prisma.cierreZDiario.findUnique({ where: { empresaId_fecha: { empresaId, fecha: hoy } }, select: { id: true } });
    if (cierreHoy) return NextResponse.json({ error: 'El cierre Z de hoy ya fue registrado. Abre un nuevo turno mañana.' }, { status: 409 });
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { horaCierreNegocio: true } });
    for (const fecha of fechasZVencidas(empresa?.horaCierreNegocio ?? '22:00')) {
      const { desde, hasta } = rangoDiaPanama(fecha);
      const [actividad, cierre] = await Promise.all([
        prisma.turnoCaja.count({ where: { empresaId, fechaApertura: { gte: desde, lt: hasta } } }),
        prisma.cierreZDiario.findUnique({ where: { empresaId_fecha: { empresaId, fecha } }, select: { id: true } }),
      ]);
      if (actividad && !cierre) return NextResponse.json({ error: `Debes registrar el cierre Z pendiente del ${fecha} antes de abrir otro turno.` }, { status: 409 });
    }

    const turnoAbierto = await prisma.turnoCaja.findFirst({
      where: { empresaId, usuarioId: userId, estado: 'abierto' }
    });
    if (turnoAbierto) {
      return NextResponse.json({
        error: 'Ya tienes un turno de caja abierto. Ciérralo antes de abrir uno nuevo.',
        turno: { id: turnoAbierto.id, fechaApertura: turnoAbierto.fechaApertura, montoInicial: Number(turnoAbierto.montoInicial) }
      }, { status: 409 });
    }

    const turno = await prisma.turnoCaja.create({
      data: {
        empresaId,
        usuarioId: userId,
        montoInicial: parsed.data.montoInicial,
        observaciones: parsed.data.observaciones || null,
        estado: 'abierto'
      }
    });

    return NextResponse.json({
      success: true,
      turno: { id: turno.id, fechaApertura: turno.fechaApertura, montoInicial: Number(turno.montoInicial) }
    });
  } catch (error) {
    console.error('Error POST /api/pos/turno/abrir:', error);
    return NextResponse.json({ error: 'Error al abrir el turno de caja' }, { status: 500 });
  }
}
