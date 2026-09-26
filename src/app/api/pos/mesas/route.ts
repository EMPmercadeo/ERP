import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { z } from 'zod';

const admin = (role: string) => role === 'admin' || role === 'super_admin';
const acceso = (role: string) => admin(role) || role === 'salonero';

export async function GET() {
  try {
    const { empresaId, userId, role } = await getTenantContext();
    if (!acceso(role))
      return NextResponse.json({ error: 'Sin permiso para consultar mesas.' }, { status: 403 });
    const [mesas, empresa, cierres, alertas, historial] = await Promise.all([
      prisma.mesaRestaurante.findMany({
        where: { empresaId, activa: true },
        orderBy: { nombre: 'asc' },
        include: {
          sesiones: {
            where: { estado: 'abierta' },
            select: {
              id: true,
              saloneroId: true,
              tipo: true,
              abiertaAt: true,
              salonero: { select: { nombre: true } },
            },
          },
        },
      }),
      prisma.empresa.findUnique({ where: { id: empresaId }, select: { horaCierreNegocio: true } }),
      prisma.cierreZDiario.findMany({
        where: { empresaId },
        orderBy: { fecha: 'desc' },
        take: 2,
        select: { fecha: true, createdAt: true },
      }),
      prisma.alertaOperativa.findMany({
        where: { empresaId, resueltaAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, clave: true, tipo: true, mensaje: true, createdAt: true },
      }),
      admin(role)
        ? prisma.sesionMesa.findMany({
            where: { empresaId, estado: 'cerrada' },
            orderBy: { cerradaAt: 'desc' },
            take: 20,
            select: {
              id: true,
              abiertaAt: true,
              cerradaAt: true,
              tipo: true,
              ventaId: true,
              mesa: { select: { nombre: true } },
              salonero: { select: { nombre: true } },
              venta: { select: { total: true, metodoPago: true } },
            },
          })
        : Promise.resolve([]),
    ]);
    return NextResponse.json({
      mesas: mesas.map((m) => {
        const s = m.sesiones[0];
        const visible = s && (admin(role) || s.saloneroId === userId);
        return {
          id: m.id,
          nombre: m.nombre,
          estado: s ? 'abierta' : 'libre',
          sesionId: visible ? s.id : null,
          tipo: visible ? s.tipo : null,
          abiertaAt: visible ? s.abiertaAt : null,
          salonero: visible ? s.salonero.nombre : null,
        };
      }),
      esAdmin: admin(role),
      horaCierreNegocio: empresa?.horaCierreNegocio ?? '22:00',
      cierres,
      alertas: admin(role)
        ? alertas
        : alertas.filter((a) =>
            mesas.some((m) =>
              m.sesiones.some((s) => s.saloneroId === userId && a.clave === `mesa:${s.id}`)
            )
          ),
      historial: historial.map((s) => ({
        id: s.id,
        mesa: s.mesa.nombre,
        salonero: s.salonero.nombre,
        tipo: s.tipo,
        abiertaAt: s.abiertaAt,
        cerradaAt: s.cerradaAt,
        ventaId: s.ventaId,
        total: Number(s.venta?.total ?? 0),
        metodoPago: s.venta?.metodoPago ?? '',
      })),
    });
  } catch (error) {
    console.error('GET mesas', error);
    return NextResponse.json({ error: 'No se pudieron consultar las mesas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { empresaId, role } = await getTenantContext();
    if (!admin(role))
      return NextResponse.json(
        { error: 'Solo el administrador puede crear mesas.' },
        { status: 403 }
      );
    const parsed = z
      .object({ nombre: z.string().trim().min(1).max(40) })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Escribe un nombre de mesa (máximo 40 caracteres).' },
        { status: 400 }
      );
    const mesa = await prisma.mesaRestaurante.create({
      data: { empresaId, nombre: parsed.data.nombre },
    });
    return NextResponse.json({ mesa }, { status: 201 });
  } catch (error) {
    console.error('POST mesas', error);
    return NextResponse.json(
      { error: 'No se pudo crear la mesa. Comprueba si ya existe.' },
      { status: 409 }
    );
  }
}
