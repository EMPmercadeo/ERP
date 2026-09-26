import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { z } from 'zod';

export async function PATCH(request: NextRequest) {
  try {
    const { empresaId, role } = await getTenantContext();
    if (!['admin', 'super_admin'].includes(role))
      return NextResponse.json(
        { error: 'Solo el administrador puede cambiar el horario.' },
        { status: 403 }
      );
    const parsed = z
      .object({ hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ error: 'La hora debe tener formato HH:mm.' }, { status: 400 });
    await prisma.empresa.update({
      where: { id: empresaId },
      data: { horaCierreNegocio: parsed.data.hora },
    });
    return NextResponse.json({ success: true, hora: parsed.data.hora });
  } catch (error) {
    console.error('PATCH configuracion cierre', error);
    return NextResponse.json({ error: 'No se pudo guardar el horario.' }, { status: 500 });
  }
}
