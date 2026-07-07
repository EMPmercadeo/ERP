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

/**
 * Nota sobre la suspensión/reactivación de empresas:
 * Se utiliza el campo `subscriptionStatus` de la tabla `Empresa` ("active" vs "suspended")
 * porque es el único campo en el schema de Empresa destinado a controlar el estado del
 * ciclo de vida de la cuenta/suscripción (a diferencia de Sucursal o Caja que usan un booleano `activa`).
 */
export async function toggleTenantStatus(empresaId: string) {
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: { subscriptionStatus: true }
        });

        if (!empresa) {
            return { success: false, error: 'Empresa no encontrada' };
        }

        const newStatus = empresa.subscriptionStatus === 'suspended' ? 'active' : 'suspended';

        await prisma.empresa.update({
            where: { id: empresaId },
            data: { subscriptionStatus: newStatus }
        });

        revalidatePath('/admin');
        revalidatePath('/admin/empresas');
        revalidatePath(`/admin/empresas/${empresaId}`);

        return { success: true, newStatus };
    } catch (error) {
        console.error('Error toggling tenant status:', error);
        return { success: false, error: 'Error al cambiar estado de la empresa' };
    }
}

export async function getTenantById(empresaId: string) {
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            include: {
                usuarios: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        rol: true,
                        activo: true,
                        createdAt: true,
                        lastLogin: true
                    }
                },
                _count: {
                    select: {
                        usuarios: true,
                        facturas: true,
                        clientes: true,
                        productos: true
                    }
                }
            }
        });

        if (!empresa) return null;

        return {
            id: empresa.id,
            razonSocial: empresa.razonSocial,
            nombreComercial: empresa.nombreComercial || 'N/A',
            ruc: empresa.ruc,
            dv: empresa.dv,
            direccion: empresa.direccion,
            telefono: empresa.telefono || 'N/A',
            email: empresa.email || 'N/A',
            ambiente: empresa.ambienteDgi === '1' ? 'Pruebas' : 'Producción',
            planType: empresa.planType,
            fiscalEnabled: empresa.fiscalEnabled,
            subscriptionStatus: empresa.subscriptionStatus,
            status: empresa.subscriptionStatus === 'suspended' ? 'Suspendida' : 'Activa',
            createdAt: empresa.createdAt,
            updatedAt: empresa.updatedAt,
            usuarios: empresa.usuarios,
            counts: {
                usuarios: empresa._count.usuarios,
                facturas: empresa._count.facturas,
                clientes: empresa._count.clientes,
                productos: empresa._count.productos
            }
        };
    } catch (error) {
        console.error('Error fetching tenant by ID:', error);
        return null;
    }
}

export async function updateTenant(
    empresaId: string,
    data: {
        razonSocial: string;
        nombreComercial?: string;
        direccion: string;
        telefono?: string;
        email?: string;
        planType?: string;
    }
) {
    const { getTenantContext } = await import('@/lib/auth/context');
    const ctx = await getTenantContext();

    if (ctx.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial,
                direccion: data.direccion,
                telefono: data.telefono,
                email: data.email,
                planType: data.planType
            }
        });

        revalidatePath('/admin');
        revalidatePath('/admin/empresas');
        revalidatePath(`/admin/empresas/${empresaId}`);

        return { success: true };
    } catch (error) {
        console.error('Error updating tenant:', error);
        return { success: false, error: 'Error al actualizar los datos de la empresa' };
    }
}
