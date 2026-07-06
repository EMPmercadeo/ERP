import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Content } from '@/components/layout/Content';
import { getTenantContext } from '@/lib/auth/context';

// All admin routes require cookies (session), so they must be dynamic
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fuente única de verdad para el rol: getTenantContext() (redirige a /login si no
    // hay sesión). Antes había una segunda verificación independiente (verifySuperAdmin
    // con su propia consulta a Postgres) — se eliminó para no tener dos lógicas que
    // puedan desincronizarse; ahora solo se usa el `role` que ya devolvió el contexto.
    let context;
    try {
        context = await getTenantContext();
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'digest' in err && String((err as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error('[AdminLayout] getTenantContext failed:', err);
        throw new Error('Error de autenticación al acceder al panel de administración.');
    }

    if (context.role !== 'super_admin') {
        // 404 en vez de 403 para no revelar la existencia del panel de admin
        redirect('/');
    }

    // Using standardized layout components for consistency
    return (
        <>
            <Sidebar />
            <Content>
                {children}
            </Content>
        </>
    );
}
