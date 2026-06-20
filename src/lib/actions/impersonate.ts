'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';

export async function startImpersonation(targetEmpresaId: string) {
    const ctx = await getTenantContext();

    // STRICT SECURITY: Only Super Admin can impersonate
    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized: Only Super Admins can impersonate.');
    }

    // Verify target exists
    const targetEmpresa = await prisma.empresa.findUnique({
        where: { id: targetEmpresaId }
    });

    if (!targetEmpresa) {
        throw new Error('Target company not found.');
    }

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('x-impersonation', targetEmpresaId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60, // 1 hour
    });

    redirect('/dashboard');
}

export async function stopImpersonation() {
    const cookieStore = await cookies();
    cookieStore.delete('x-impersonation');
    redirect('/admin/empresas');
}
