import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { getTenantContext } from '@/lib/auth/context';
import { generarReporteZ } from '@/lib/services/reporteZ';
import { fechaPanama, rangoDiaPanama } from '@/lib/pos/fechaNegocio';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { empresaId, userId, role } = await getTenantContext();
    if (!['admin', 'super_admin'].includes(role))
      return NextResponse.json(
        { error: 'Solo el administrador puede registrar el cierre Z diario.' },
        { status: 403 }
      );
    const parsed = z
      .object({ fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Fecha inválida.' }, { status: 400 });
    const fecha = parsed.data.fecha;
    if (fecha > fechaPanama())
      return NextResponse.json({ error: 'No se puede cerrar una fecha futura.' }, { status: 400 });
    const { desde, hasta } = rangoDiaPanama(fecha);
    const [turnosAbiertos, mesasAbiertas, cierreExistente] = await Promise.all([
      prisma.turnoCaja.count({
        where: { empresaId, estado: 'abierto', fechaApertura: { lt: hasta } },
      }),
      prisma.sesionMesa.count({
        where: { empresaId, estado: 'abierta', abiertaAt: { lt: hasta } },
      }),
      prisma.cierreZDiario.findUnique({ where: { empresaId_fecha: { empresaId, fecha } } }),
    ]);
    if (cierreExistente)
      return NextResponse.json(
        { error: 'El cierre Z de esta fecha ya fue registrado.' },
        { status: 409 }
      );
    if (turnosAbiertos || mesasAbiertas)
      return NextResponse.json(
        { error: 'Cierra primero los turnos y cobra las mesas abiertas de ese día.' },
        { status: 409 }
      );
    const reporte = await generarReporteZ({ empresaId, fecha });
    if (!reporte)
      return NextResponse.json({ error: 'No se pudo generar el reporte.' }, { status: 400 });
    const cierre = await prisma.cierreZDiario.create({
      data: {
        empresaId,
        usuarioId: userId,
        fecha,
        resumen: reporte as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.alertaOperativa.updateMany({
      where: { empresaId, clave: `z:${fecha}` },
      data: { resueltaAt: new Date() },
    });
    return NextResponse.json({
      success: true,
      cierre: { id: cierre.id, fecha: cierre.fecha, createdAt: cierre.createdAt },
      rango: { desde, hasta },
    });
  } catch (error) {
    console.error('POST cierre Z', error);
    return NextResponse.json({ error: 'No se pudo registrar el cierre Z.' }, { status: 500 });
  }
}
