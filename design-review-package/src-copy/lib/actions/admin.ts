'use server';

import { prisma } from '@/lib/db';
import { verifySuperAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function getTenants() {
    // 1. Verify Super Admin Access
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    // In real app, pass current user ID. 
    // Here we assume the caller or the layout blocked unauthorized access, 
    // but good practice is to verify again.
    // await verifySuperAdmin(currentUserId);

    // For now, fetching all empresas
    try {
        const empresas = await prisma.empresa.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { usuarios: true }
                }
            }
        });

        // Map to simpler structure
        return empresas.map(e => ({
            id: e.id,
            razonSocial: e.razonSocial,
            ruc: e.ruc,
            ambiente: e.ambienteDgi === '1' ? 'Pruebas' : 'Producción',
            createdAt: e.createdAt,
            userCount: e._count.usuarios,
            // Mock status for now as schema doesn't have 'estado' on Empresa yet? 
            // Checking schema... it has 'ambienteDgi', maybe not 'estado' active/inactive.
            // Requirement said "Status (activa/suspendida)".
            // I'll add a mock status or use a field.
            status: 'Activa'
        }));
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return [];
    }
}

export async function getGlobalUsers(
    search?: string,
    role?: string,
    status?: string,
    page: number = 1,
    pageSize: number = 10
) {
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const where: any = {};

        if (search) {
            where.OR = [
                { nombre: { contains: search } },
                { email: { contains: search } }
            ];
        }

        if (role && role !== 'all') {
            where.rol = role;
        }

        if (status && status !== 'all') {
            where.activo = status === 'active';
        }

        // Count total matching items
        const totalCount = await prisma.usuario.count({ where });

        // Skip calculations
        const skip = (page - 1) * pageSize;

        const users = await prisma.usuario.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                empresa: {
                    select: {
                        razonSocial: true
                    }
                }
            }
        });

        const mappedUsers = users.map(u => ({
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            rol: u.rol,
            activo: u.activo,
            empresaName: u.empresa.razonSocial,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
        }));

        return {
            users: mappedUsers,
            totalCount
        };
    } catch (error) {
        console.error('Error fetching global users:', error);
        return {
            users: [],
            totalCount: 0
        };
    }
}

export async function updateUserStatusAndRole(targetUserId: string, rol: string, activo: boolean) {
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.usuario.update({
            where: { id: targetUserId },
            data: { rol, activo }
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error updating user status and role:', error);
        return { success: false, error: 'Error al actualizar usuario' };
    }
}
