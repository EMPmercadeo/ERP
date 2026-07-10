import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

/**
 * Auto-reclamo de super_admin con código secreto (SUPERADMIN_CLAIM_CODE).
 *
 * Pensado para el bootstrap inicial: el primer usuario ya autenticado (login normal,
 * incluye Google) que conozca el código puede auto-promoverse a super_admin, sin que
 * nadie tenga que ejecutar scripts contra la base de datos a mano.
 *
 * Salvaguardas:
 * - Si SUPERADMIN_CLAIM_CODE no está configurada, la ruta queda deshabilitada (deny-by-default).
 * - Solo funciona mientras NO exista ya un super_admin en el sistema — una vez reclamado,
 *   este endpoint deja de tener efecto para siempre (no es una puerta trasera permanente).
 */
export async function POST(request: NextRequest) {
  try {
    const claimCode = process.env.SUPERADMIN_CLAIM_CODE;
    if (!claimCode) {
      return NextResponse.json(
        { error: 'Función no habilitada. Define SUPERADMIN_CLAIM_CODE en las variables de entorno para activarla.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body?.code === 'string' ? body.code : '';

    if (!code || code !== claimCode) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 403 });
    }

    let context;
    try {
      context = await getTenantContext();
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión primero y luego volver a intentarlo.' }, { status: 401 });
    }

    if (context.role === 'super_admin') {
      return NextResponse.json({ success: true, message: 'Tu cuenta ya es super_admin.' });
    }

    const existingSuperAdmin = await prisma.usuario.findFirst({ where: { rol: 'super_admin' } });
    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: 'Ya existe un super_admin registrado en el sistema. Por seguridad, el auto-reclamo ya no está disponible; pide al super_admin actual que te dé el rol desde /admin/users.' },
        { status: 409 }
      );
    }

    await prisma.usuario.update({
      where: { id: context.userId },
      data: { rol: 'super_admin' }
    });

    return NextResponse.json({
      success: true,
      message: 'Listo — tu cuenta ahora es super_admin. Recarga la página para ver el panel de Superadministración en el menú.'
    });
  } catch (error) {
    console.error('Error POST /api/claim-superadmin:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al procesar el reclamo de super_admin.' }, { status: 500 });
  }
}
