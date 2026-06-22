import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to troubleshoot production errors.
 * DELETE THIS ROUTE after debugging is complete.
 */
export async function GET() {
    const diagnostics: Record<string, any> = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    };

    // 1. Test cookie access
    try {
        const cookieStore = await cookies();
        const sessionEmail = cookieStore.get('session_email')?.value;
        diagnostics.sessionEmail = sessionEmail || '(not set)';
        diagnostics.cookieAccess = 'OK';
    } catch (err: any) {
        diagnostics.cookieAccess = 'FAILED';
        diagnostics.cookieError = err?.message;
    }

    // 2. Test DB connection
    try {
        const userCount = await prisma.usuario.count();
        diagnostics.dbConnection = 'OK';
        diagnostics.userCount = userCount;
    } catch (err: any) {
        diagnostics.dbConnection = 'FAILED';
        diagnostics.dbError = err?.message?.substring(0, 300);
    }

    // 3. Test empresa query
    try {
        const empresaCount = await prisma.empresa.count();
        diagnostics.empresaQuery = 'OK';
        diagnostics.empresaCount = empresaCount;
    } catch (err: any) {
        diagnostics.empresaQuery = 'FAILED';
        diagnostics.empresaError = err?.message?.substring(0, 300);
    }

    // 4. Test if session_email user exists
    try {
        const cookieStore = await cookies();
        const sessionEmail = cookieStore.get('session_email')?.value;
        if (sessionEmail && sessionEmail !== 'guest') {
            const user = await prisma.usuario.findUnique({
                where: { email: sessionEmail },
                select: { id: true, rol: true, empresaId: true }
            });
            diagnostics.sessionUser = user ? {
                id: user.id,
                rol: user.rol,
                empresaId: user.empresaId
            } : 'NOT_FOUND';
        } else {
            diagnostics.sessionUser = 'NO_SESSION';
        }
    } catch (err: any) {
        diagnostics.sessionUser = 'QUERY_FAILED';
        diagnostics.sessionUserError = err?.message?.substring(0, 300);
    }

    // 5. Test impersonation cookie
    try {
        const cookieStore = await cookies();
        const impersonation = cookieStore.get('x-impersonation')?.value;
        diagnostics.impersonationCookie = impersonation || '(not set)';
    } catch (err: any) {
        diagnostics.impersonationCheck = 'FAILED';
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
