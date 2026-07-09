import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext, type TenantContext } from '@/lib/auth/context';

export async function verifySuperAdmin(userId: string) {
    if (!userId) {
        redirect('/login');
    }

    const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { rol: true }
    });

    if (!user || user.rol !== 'super_admin') {
        // Return 404 to hide existence of admin area
        redirect('/');
    }

    return true;
}

/**
 * Autorización real para los Route Handlers de /api/admin/**.
 *
 * getTenantContext() es la única fuente de verdad de sesión/rol en toda la app (cookie
 * de sesión de Firebase verificada + rol leído de Postgres), pero usa redirect() de
 * next/navigation, que solo funciona en Server Components/Actions (lanza un error
 * especial NEXT_REDIRECT). Dentro de un Route Handler eso simplemente rompe la
 * petición con un 500 en vez de negar el acceso correctamente, así que aquí
 * interceptamos ese throw y lo convertimos en una respuesta 401/403 real.
 *
 * Uso en cada route.ts de /api/admin/**:
 *   const auth = await requireSuperAdminApi();
 *   if ('error' in auth) return auth.error;
 *   const adminId = auth.context.userId; // identidad real, no un header que envía el cliente
 */
export async function requireSuperAdminApi(): Promise<
    { context: TenantContext } | { error: NextResponse }
> {
    try {
        const context = await getTenantContext();
        if (context.role !== 'super_admin') {
            return {
                error: NextResponse.json(
                    { error: 'Acceso denegado: se requiere rol super_admin.' },
                    { status: 403 }
                )
            };
        }
        return { context };
    } catch (err: unknown) {
        if (
            err &&
            typeof err === 'object' &&
            'digest' in err &&
            String((err as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
        ) {
            return {
                error: NextResponse.json(
                    { error: 'No autenticado. Inicia sesión para continuar.' },
                    { status: 401 }
                )
            };
        }
        console.error('[requireSuperAdminApi] Error verificando sesión:', err);
        return {
            error: NextResponse.json({ error: 'Error de autenticación.' }, { status: 500 })
        };
    }
}
