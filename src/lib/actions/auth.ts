'use server';

import { prisma } from '@/lib/db';

// ... existing imports

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
