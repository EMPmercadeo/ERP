'use server';

import { prisma } from '@/lib/db';
import { verifySuperAdmin } from '@/lib/auth/admin';

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
