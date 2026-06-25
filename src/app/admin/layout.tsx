import { Sidebar } from '@/components/layout/Sidebar';
import { Content } from '@/components/layout/Content';
import { verifySuperAdmin } from '@/lib/auth/admin';
import { getTenantContext } from '@/lib/auth/context';

// All admin routes require cookies (session), so they must be dynamic
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Get current tenant context (redirects to /login if unauthenticated)
    let context;
    try {
        context = await getTenantContext();
    } catch (err: any) {
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error('[AdminLayout] getTenantContext failed:', err);
        throw new Error('Error de autenticación al acceder al panel de administración.');
    }

    // 2. Enforce super admin check (redirects to / if unauthorized)
    try {
        await verifySuperAdmin(context.userId);
    } catch (err) {
        // verifySuperAdmin uses redirect() which throws a NEXT_REDIRECT error
        // We need to re-throw redirect errors, but catch actual errors
        if (err && typeof err === 'object' && 'digest' in err) {
            // This is a Next.js redirect - let it propagate
            throw err;
        }
        console.error('[AdminLayout] verifySuperAdmin failed:', err);
        throw new Error('Error al verificar permisos de administrador.');
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
