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
    // 1. Get User Identity
    // TODO: Replace with real Auth check (e.g. NextAuth session, Firebase token)

    // For Development: Priority 1 - Explicit Super Admin
    let devUser = await prisma.usuario.findUnique({
        where: { email: 'empsignature@gmail.com' }
    });

    // Priority 2 - Any Super Admin
    if (!devUser) {
        devUser = await prisma.usuario.findFirst({
            where: { rol: 'super_admin' }
        });
    }

    // Priority 3 - Any User
    if (!devUser) {
        devUser = await prisma.usuario.findFirst();
    }

    if (!devUser) {
        throw new Error('Unauthorized: No users found in system');
    }

    // 2. Check Impersonation (Strictly for Super Admin)
    let activeEmpresaId = devUser.empresaId;
    let isImpersonating = false;

    if (devUser.rol === 'super_admin') {
        const cookieStore = await cookies();
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
