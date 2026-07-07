'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { hash, compare } from 'bcryptjs';
import { getTenantContext } from '@/lib/auth/context';

export async function updatePersonalInfo(email: string, formData: FormData) {
    const name = formData.get('fullName') as string;

    try {
        const ctx = await getTenantContext();
        const loggedInUser = await prisma.usuario.findUnique({
            where: { id: ctx.userId }
        });
        if (!loggedInUser || loggedInUser.email !== email) {
            return { success: false, message: 'Acceso denegado.' };
        }

        await prisma.usuario.update({
            where: { email },
            data: {
                nombre: name
            }
        });

        revalidatePath('/profile');
        return { success: true, message: 'Información personal actualizada' };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, message: 'Error al actualizar el perfil' };
    }
}

export async function changePassword(email: string, formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, message: 'Todos los campos son obligatorios' };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, message: 'las contraseñas nuevas no coinciden' };
    }

    if (newPassword.length < 6) {
        return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    try {
        const ctx = await getTenantContext();
        const loggedInUser = await prisma.usuario.findUnique({
            where: { id: ctx.userId }
        });
        if (!loggedInUser || loggedInUser.email !== email) {
            return { success: false, message: 'Acceso denegado.' };
        }

        // Fetch user to get current hash
        const user = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!user || !user.passwordHash) {
            return { success: false, message: 'Usuario no encontrado o sin contraseña configurada' };
        }

        // Verify current password
        const isValid = await compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return { success: false, message: 'La contraseña actual es incorrecta' };
        }

        // Update
        const newHash = await hash(newPassword, 10);
        await prisma.usuario.update({
            where: { email },
            data: {
                passwordHash: newHash
            }
        });

        return { success: true, message: 'Contraseña actualizada correctamente' };

    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, message: 'Error al cambiar la contraseña' };
    }
}

export async function getProfileOverview() {
    try {
        const ctx = await getTenantContext();
        const user = await prisma.usuario.findUnique({
            where: { id: ctx.userId }
        });
        const empresa = await prisma.empresa.findUnique({
            where: { id: ctx.empresaId },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!user || !empresa) return null;

        const { getDocumentUsage } = await import('@/lib/actions/billing');
        const usage = await getDocumentUsage(ctx.empresaId);

        return {
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                activo: user.activo,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            },
            empresa: {
                id: empresa.id,
                razonSocial: empresa.razonSocial,
                nombreComercial: empresa.nombreComercial || 'N/A',
                ruc: empresa.ruc,
                dv: empresa.dv,
                direccion: empresa.direccion,
                telefono: empresa.telefono || 'N/A',
                email: empresa.email || 'N/A',
                logo: empresa.logo || null,
                ambienteDgi: empresa.ambienteDgi === '1' ? 'Pruebas' : 'Producción',
                certificadoDgi: empresa.certificadoDgi ? 'Configurado / Activo' : 'No Configurado',
                planType: empresa.planType,
                fiscalEnabled: empresa.fiscalEnabled,
                subscriptionStatus: empresa.subscriptionStatus
            },
            billing: {
                planName: empresa.subscription?.plan?.name || empresa.planType.toUpperCase(),
                priceMonthly: empresa.subscription?.plan?.priceMonthly ? Number(empresa.subscription.plan.priceMonthly) : 0,
                status: empresa.subscription?.status || empresa.subscriptionStatus,
                currentPeriodEnd: empresa.subscription?.currentPeriodEnd || null,
                foliosIncluded: usage.includedLimit,
                foliosUsed: usage.usedDocuments,
                foliosExtra: usage.extraDocumentsPurchased,
                foliosRemaining: usage.remainingDocuments
            }
        };
    } catch (error) {
        console.error('Error fetching profile overview:', error);
        return null;
    }
}

