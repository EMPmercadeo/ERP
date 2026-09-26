import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { getTenantContext } from '@/lib/auth/context';
import { z } from 'zod';

type Ctx = { params: Promise<{ id: string }> };
const admin = (role: string) => role === 'admin' || role === 'super_admin';
const acceso = (role: string) => admin(role) || role === 'salonero';

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { empresaId, userId, role } = await getTenantContext();
    if (!acceso(role)) return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 });
    const { id } = await params;
    const sesion = await prisma.sesionMesa.findFirst({
      where: {
        mesaId: id,
        empresaId,
        estado: 'abierta',
        ...(admin(role) ? {} : { saloneroId: userId }),
      },
      include: { mesa: { select: { nombre: true } }, salonero: { select: { nombre: true } } },
    });
    if (!sesion)
      return NextResponse.json({ error: 'Mesa no disponible para tu usuario.' }, { status: 404 });
    return NextResponse.json({
      sesion: {
        id: sesion.id,
        mesa: sesion.mesa.nombre,
        salonero: sesion.salonero.nombre,
        tipo: sesion.tipo,
        abiertaAt: sesion.abiertaAt,
        version: sesion.version,
        items: sesion.items,
      },
    });
  } catch (error) {
    console.error('GET mesa', error);
    return NextResponse.json({ error: 'No se pudo consultar la mesa.' }, { status: 500 });
  }
}

const CambioSchema = z.discriminatedUnion('accion', [
  z.object({
    accion: z.literal('abrir'),
    tipo: z.enum(['normal', 'reserva', 'evento']).default('normal'),
  }),
  z.object({
    accion: z.literal('pedido'),
    version: z.number().int().min(0),
    items: z
      .array(
        z.object({ productoId: z.string().min(1), cantidad: z.number().int().min(1).max(100) })
      )
      .max(50),
  }),
]);

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { empresaId, userId, role } = await getTenantContext();
    if (!acceso(role)) return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 });
    const { id } = await params;
    const parsed = CambioSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const mesa = await prisma.mesaRestaurante.findFirst({ where: { id, empresaId, activa: true } });
    if (!mesa) return NextResponse.json({ error: 'Mesa no encontrada.' }, { status: 404 });
    if (parsed.data.accion === 'abrir') {
      const turno = await prisma.turnoCaja.findFirst({
        where: { empresaId, usuarioId: userId, estado: 'abierto' },
        select: { id: true },
      });
      if (!turno)
        return NextResponse.json(
          { error: 'Abre tu turno de caja antes de abrir una mesa.' },
          { status: 409 }
        );
      const sesion = await prisma.sesionMesa.create({
        data: { empresaId, mesaId: id, saloneroId: userId, tipo: parsed.data.tipo, items: [] },
      });
      return NextResponse.json({ sesionId: sesion.id });
    }
    const sesion = await prisma.sesionMesa.findFirst({
      where: {
        empresaId,
        mesaId: id,
        estado: 'abierta',
        ...(admin(role) ? {} : { saloneroId: userId }),
      },
    });
    if (!sesion)
      return NextResponse.json(
        {
          error: 'Solo el salonero que abrió la mesa o el administrador pueden cambiar el pedido.',
        },
        { status: 403 }
      );
    if (new Set(parsed.data.items.map((i) => i.productoId)).size !== parsed.data.items.length)
      return NextResponse.json({ error: 'Hay productos repetidos en el pedido.' }, { status: 400 });
    const productos = await prisma.producto.findMany({
      where: { empresaId, activo: true, id: { in: parsed.data.items.map((i) => i.productoId) } },
      select: {
        id: true,
        descripcion: true,
        precioVenta: true,
        codigoTasaItbms: true,
        stockActual: true,
        unidadMedida: true,
        esElaborado: true,
      },
    });
    if (productos.length !== new Set(parsed.data.items.map((i) => i.productoId)).size)
      return NextResponse.json(
        { error: 'El pedido contiene productos no disponibles.' },
        { status: 400 }
      );
    const items = parsed.data.items.map((i) => {
      const p = productos.find((p) => p.id === i.productoId)!;
      if (p.unidadMedida !== 'SRV' && !p.esElaborado && p.stockActual < i.cantidad)
        throw new Error(`Stock insuficiente: ${p.descripcion}`);
      return {
        productoId: p.id,
        descripcion: p.descripcion,
        cantidad: i.cantidad,
        precioUnitario: Number(p.precioVenta),
        itbmsPorcentaje:
          p.codigoTasaItbms === '01'
            ? 7
            : p.codigoTasaItbms === '02'
              ? 10
              : p.codigoTasaItbms === '03'
                ? 15
                : 0,
        descuentoPorcentaje: 0,
      };
    });
    const updated = await prisma.sesionMesa.updateMany({
      where: { id: sesion.id, empresaId, estado: 'abierta', version: parsed.data.version },
      data: { items: items as Prisma.InputJsonValue, version: { increment: 1 } },
    });
    if (!updated.count)
      return NextResponse.json(
        { error: 'La mesa cambió en otra pantalla. Recarga el pedido.' },
        { status: 409 }
      );
    return NextResponse.json({ success: true, version: parsed.data.version + 1, items });
  } catch (error) {
    console.error('PATCH mesa', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar la mesa.' },
      { status: 409 }
    );
  }
}
