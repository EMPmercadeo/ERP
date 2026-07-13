'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { resolveUsuarioPorEmail } from '@/lib/auth/resolveUsuario';
import { logger } from '@/lib/logger';

// getUserRole/getCurrentUser/getCurrentUserWithPlan son la fuente que consume el
// cliente (hook useAuth -> role). Antes usaban `findUnique({ where: { email } })`,
// un match exacto y case-sensitive, mientras que `getTenantContext()` (server)
// usaba un match case-insensitive — dos lógicas distintas para la misma pregunta
// ("¿qué rol tiene este email?"). Ahora ambas pasan por `resolveUsuarioPorEmail()`,
// la única fuente de verdad.

export async function getUserRole(email: string | null | undefined) {
    try {
        const user = await resolveUsuarioPorEmail(email);
        return user?.rol ?? null;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
}

export async function getCurrentUser(email: string | null | undefined) {
    try {
        const user = await resolveUsuarioPorEmail(email);
        if (!user) return null;
        return {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            activo: user.activo,
            empresaId: user.empresaId,
        };
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

export async function getCurrentUserWithPlan(email: string | null | undefined) {
    try {
        const user = await resolveUsuarioPorEmail(email);
        if (!user) return null;

        const empresa = await prisma.empresa.findUnique({
            where: { id: user.empresaId },
            select: { planType: true, subscriptionStatus: true }
        });
        if (!empresa) return null;

        return {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            activo: user.activo,
            empresaId: user.empresaId,
            planType: empresa.planType,
            subscriptionStatus: empresa.subscriptionStatus
        };
    } catch (error) {
        console.error('Error fetching current user with plan:', error);
        return null;
    }
}

export async function setSessionToken(idToken: string) {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email) {
        throw new Error('El token no contiene un correo verificado.');
    }
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 dias en ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: expiresIn / 1000,
    });
    logger.info('Sesión de usuario iniciada correctamente', { email: decoded.email, uid: decoded.uid });
}

export async function deleteSessionEmail() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    cookieStore.delete('session_token');
    cookieStore.delete('session_email');
    
    if (sessionToken) {
        try {
            const decoded = await adminAuth.verifySessionCookie(sessionToken).catch(() => null);
            if (decoded) {
                logger.info('Sesión de usuario cerrada correctamente', { email: decoded.email, uid: decoded.uid });
            } else {
                logger.info('Sesión de usuario cerrada (token ya expirado o inválido)');
            }
        } catch {
            logger.info('Sesión de usuario cerrada (error al decodificar para log)');
        }
    } else {
        logger.info('Sesión de usuario cerrada (sin token activo)');
    }
}
