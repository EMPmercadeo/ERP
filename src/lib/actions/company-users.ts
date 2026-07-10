'use server';

import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { ASSIGNABLE_ROLES, ROLES_AUTORIZAN_DESCUENTOS, type AppRole } from '@/lib/permissions';

/**
 * Gestión de usuarios DENTRO de la propia empresa (el dueño invitando a su equipo y
 * asignándoles un rol) — distinto de /admin/users, que es el panel de super_admin para
 * TODAS las empresas de la plataforma. Solo el rol 'admin' de la empresa puede invitar,
 * cambiar roles o desactivar a sus compañeros.
 */

async function requireAdmin() {
    const ctx = await getTenantContext();
    if (ctx.role !== 'admin') {
        throw new Error('Solo el administrador de la empresa puede gestionar usuarios.');
    }
    return ctx;
}

export async function listCompanyUsers() {
    const { empresaId } = await requireAdmin();
    const usuarios = await prisma.usuario.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
            createdAt: true,
            lastLogin: true,
            pinAutorizacion: true,
            descuentoMaximoPermitido: true,
        }
    });
    return usuarios.map(u => ({
        ...u,
        tienePin: !!u.pinAutorizacion,
        pinAutorizacion: undefined,
        descuentoMaximoPermitido: u.descuentoMaximoPermitido != null ? Number(u.descuentoMaximoPermitido) : null,
        createdAt: u.createdAt.toISOString(),
        lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
    }));
}

export async function inviteCompanyUser(nombre: string, email: string, rol: string) {
    const { empresaId } = await requireAdmin();

    if (!nombre?.trim() || !email?.trim()) {
        return { success: false, error: 'Nombre y correo son requeridos.' };
    }
    if (!(ASSIGNABLE_ROLES as string[]).includes(rol)) {
        return { success: false, error: 'Rol inválido.' };
    }

    const emailNorm = email.trim().toLowerCase();
    const existente = await prisma.usuario.findUnique({ where: { email: emailNorm } });
    if (existente) {
        return { success: false, error: 'Ya existe un usuario registrado con ese correo (en esta u otra empresa).' };
    }

    // Se crea el registro "invitado" ya vinculado a esta empresa. Cuando esa persona inicie
    // sesión por primera vez con Google o email/contraseña usando este mismo correo,
    // getTenantContext() lo encontrará por email y usará esta cuenta — en vez de disparar el
    // auto-aprovisionamiento que le crearía una empresa nueva y separada.
    const usuario = await prisma.usuario.create({
        data: {
            empresaId,
            email: emailNorm,
            nombre: nombre.trim(),
            rol,
            passwordHash: 'invitado-pendiente',
            activo: true,
        }
    });

    revalidatePath('/settings');
    return {
        success: true,
        message: `${nombre} fue agregado con rol "${rol}". Cuando inicie sesión con ${emailNorm} (Google o correo/contraseña), entrará directo a esta empresa.`,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    };
}

export async function updateCompanyUserRole(userId: string, rol: string, activo: boolean) {
    const { empresaId, userId: myId } = await requireAdmin();

    if (!(ASSIGNABLE_ROLES as string[]).includes(rol)) {
        return { success: false, error: 'Rol inválido.' };
    }

    const objetivo = await prisma.usuario.findFirst({ where: { id: userId, empresaId } });
    if (!objetivo) {
        return { success: false, error: 'Usuario no encontrado en tu empresa.' };
    }
    if (objetivo.id === myId && (rol !== 'admin' || !activo)) {
        return { success: false, error: 'No puedes quitarte a ti mismo el rol de administrador ni desactivar tu propia cuenta.' };
    }

    await prisma.usuario.update({
        where: { id: userId },
        data: { rol, activo }
    });

    revalidatePath('/settings');
    return { success: true, message: 'Usuario actualizado.' };
}

export async function setMyDiscountPin(pin: string) {
    const ctx = await getTenantContext();
    if (!ROLES_AUTORIZAN_DESCUENTOS.includes(ctx.role as AppRole) && ctx.role !== 'admin') {
        return { success: false, error: 'Tu rol no puede autorizar descuentos, así que no necesita un PIN.' };
    }
    if (!/^\d{4,8}$/.test(pin)) {
        return { success: false, error: 'El PIN debe tener entre 4 y 8 dígitos numéricos.' };
    }

    const pinHash = await hash(pin, 10);
    await prisma.usuario.update({
        where: { id: ctx.userId },
        data: { pinAutorizacion: pinHash }
    });

    revalidatePath('/settings');
    return { success: true, message: 'PIN de autorización guardado. Úsalo en el POS para aprobar descuentos especiales.' };
}

export async function updateCompanyDiscountThreshold(porcentaje: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const { empresaId } = await requireAdmin();
        const pct = Math.min(100, Math.max(0, porcentaje));

        await prisma.empresa.update({
            where: { id: empresaId },
            data: { descuentoMaximoSinAutorizacion: pct }
        });

        revalidatePath('/settings');
        return { success: true, message: `Tope de descuento sin autorización actualizado a ${pct}%.` };
    } catch (e: any) {
        return { success: false, error: e?.message || 'Error al guardar el tope.' };
    }
}

export async function getCompanyDiscountThreshold() {
    const { empresaId } = await getTenantContext();
    const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { descuentoMaximoSinAutorizacion: true }
    });
    return Number(empresa?.descuentoMaximoSinAutorizacion ?? 10);
}
