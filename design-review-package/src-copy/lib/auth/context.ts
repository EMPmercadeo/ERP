import { headers, cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/actions/auth'; // Reusing this or similar logic

// Mock session retriever. In real usage, this might decode a JWT, check cookies, or call Firebase Admin.
// We'll simulate getting the user email/id from headers or a mock "current user".

export interface TenantContext {
    userId: string;
    empresaId: string;
    role: string;
    isImpersonating?: boolean;
}

export async function getTenantContext(): Promise<TenantContext> {
    // 1. Get User Identity from session cookie
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get('session_email')?.value;

    let devUser = null;
    if (sessionEmail && sessionEmail !== 'guest') {
        devUser = await prisma.usuario.findUnique({
            where: { email: sessionEmail }
        });
    }

    // For Development: Only fall back if no session cookie was explicitly set as 'guest'
    if (!devUser && sessionEmail !== 'guest' && process.env.NODE_ENV === 'development') {
        devUser = await prisma.usuario.findUnique({
            where: { email: 'empsignature@gmail.com' }
        });

        if (!devUser) {
            devUser = await prisma.usuario.findFirst({
                where: { rol: 'super_admin' }
            });
        }

        if (!devUser) {
            devUser = await prisma.usuario.findFirst();
        }
    }

    if (!devUser) {
        redirect('/login');
    }

    // 2. Check Impersonation (Strictly for Super Admin)
    let activeEmpresaId = devUser.empresaId;
    let isImpersonating = false;

    if (devUser.rol === 'super_admin') {
        const impersonatedId = cookieStore.get('x-impersonation')?.value;

        if (impersonatedId) {
            activeEmpresaId = impersonatedId;
            isImpersonating = true;
        }
    }

    // 3. Return strict context
    return {
        userId: devUser.id, // Always the real user ID
        empresaId: activeEmpresaId,
        role: devUser.rol,
        isImpersonating
    };
}
