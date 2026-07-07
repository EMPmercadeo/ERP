'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

import { revalidatePath } from 'next/cache';

export async function getTenants(
    search?: string,
    page: number = 1,
    pageSize: number = 20
) {
    // 1. Verify Super Admin Access
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const where: Prisma.EmpresaWhereInput = {};
        if (search) {
            where.OR = [
                { razonSocial: { contains: search, mode: 'insensitive' } },
                { ruc: { contains: search, mode: 'insensitive' } },
                { nombreComercial: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (page - 1) * pageSize;

        const [empresas, totalCount] = await Promise.all([
            prisma.empresa.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                include: {
                    _count: {
                        select: { usuarios: true }
                    }
                }
            }),
            prisma.empresa.count({ where })
        ]);

        const mapped = empresas.map(e => ({
            id: e.id,
            razonSocial: e.razonSocial,
            ruc: e.ruc,
            ambiente: e.ambienteDgi === '1' ? 'Pruebas' : 'Producción',
            createdAt: e.createdAt,
            userCount: e._count.usuarios,
            status: e.subscriptionStatus === 'suspended' ? 'Suspendida' : 'Activa'
        }));

        return {
            companies: mapped,
            totalCount,
            pageCount: Math.ceil(totalCount / pageSize)
        };
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return {
            companies: [],
            totalCount: 0,
            pageCount: 0
        };
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
        const where: Prisma.UsuarioWhereInput = {};

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
