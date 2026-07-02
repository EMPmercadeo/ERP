'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function getUserRole(email: string | null | undefined) {
    if (!email) return null;

    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            select: { rol: true }
        });

        return user?.rol;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
}

export async function getCurrentUser(email: string | null | undefined) {
    if (!email) return null;

    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                nombre: true,
                rol: true,
                activo: true,
                empresaId: true
            }
        });
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

export async function getCurrentUserWithPlan(email: string | null | undefined) {
    if (!email) return null;

    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                nombre: true,
                rol: true,
                activo: true,
                empresaId: true,
                empresa: {
                    select: {
                        planType: true,
                        subscriptionStatus: true
                    }
                }
            }
        });
        if (!user || !user.empresa) return null;
        return {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            activo: user.activo,
            empresaId: user.empresaId,
            planType: user.empresa.planType,
            subscriptionStatus: user.empresa.subscriptionStatus
        };
    } catch (error) {
        console.error('Error fetching current user with plan:', error);
        return null;
    }
}

export async function setSessionEmail(email: string) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cookieStore = await cookies();
    cookieStore.set('session_email', cleanEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });
}

export async function deleteSessionEmail() {
    const cookieStore = await cookies();
    cookieStore.delete('session_email');
}

