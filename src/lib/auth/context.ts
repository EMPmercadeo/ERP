import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { crearPlanCuentasParaEmpresa } from '@/lib/contabilidad/planCuentasDefault';
import { adminAuth } from '@/lib/firebase/admin';
import { resolveUsuarioPorEmail } from '@/lib/auth/resolveUsuario';
import { cache } from 'react';

// Mock session retriever. In real usage, this might decode a JWT, check cookies, or call Firebase Admin.
// We'll simulate getting the user email/id from headers or a mock "current user".

export interface TenantContext {
    userId: string;
    empresaId: string;
    role: string;
    isImpersonating?: boolean;
    // true solo si Firebase confirma que el email del usuario está verificado
    // (claim `email_verified` del ID token, vía Firebase Admin SDK). Nunca se
    // toma de una columna guardada en Postgres porque puede desactualizarse.
    emailVerified: boolean;
    requestId?: string;
}

export const getTenantContext = cache(async (): Promise<TenantContext> => {
    // 1. Get User Identity from session cookie
    const cookieStore = await cookies();
    const sessionCookieValue = cookieStore.get('session_token')?.value;
    let sessionEmail: string | undefined;
    let emailVerified = false;
    if (sessionCookieValue) {
        try {
            const decoded = await adminAuth.verifySessionCookie(sessionCookieValue, true);
            sessionEmail = decoded.email?.trim().toLowerCase();
            emailVerified = decoded.email_verified === true;
        } catch {
            sessionEmail = undefined;
        }
    }

    let devUser = null;
    if (sessionEmail && sessionEmail !== 'guest') {
        devUser = await resolveUsuarioPorEmail(sessionEmail);

        // Auto-aprovisionar nueva cuenta en PostgreSQL para usuarios que inician sesión/registran por primera vez vía Firebase (Google o Email)
        if (!devUser && sessionEmail.includes('@')) {
            try {
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const rucGen = `PE-${Date.now()}-${randomSuffix}`;
                const nombreGen = sessionEmail.split('@')[0];
                const razonGen = nombreGen.toUpperCase();

                devUser = await prisma.$transaction(async (tx) => {
                    const nuevaEmpresa = await tx.empresa.create({
                        data: {
                            ruc: rucGen,
                            dv: '00',
                            razonSocial: razonGen,
                            direccion: 'Panamá',
                            email: sessionEmail,
                            planType: 'free',
                            subscriptionStatus: 'active'
                        }
                    });

                    await crearPlanCuentasParaEmpresa(tx, nuevaEmpresa.id);

                    const nuevaSucursal = await tx.sucursal.create({
                        data: {
                            empresaId: nuevaEmpresa.id,
                            codigo: '001',
                            nombre: 'Casa Matriz',
                            direccion: 'Panamá',
                            activa: true,
                        }
                    });

                    await tx.caja.create({
                        data: {
                            empresaId: nuevaEmpresa.id,
                            sucursalId: nuevaSucursal.id,
                            codigo: '001',
                            nombre: 'Caja Principal',
                            activa: true,
                        }
                    });

                    await tx.bodega.create({
                        data: {
                            empresaId: nuevaEmpresa.id,
                            sucursalId: nuevaSucursal.id,
                            codigo: '001',
                            nombre: 'Bodega Principal',
                            activa: true,
                        }
                    });

                    return await tx.usuario.create({
                        data: {
                            empresaId: nuevaEmpresa.id,
                            email: sessionEmail,
                            passwordHash: 'oauth-firebase',
                            nombre: nombreGen,
                            rol: 'admin',
                            activo: true
                        }
                    });
                });
                console.log(`Auto-provisioned new account in PostgreSQL for ${sessionEmail}`);
            } catch (error) {
                console.error('Error auto-provisioning user in PostgreSQL:', error);
            }
        }

    }

    // En entorno de desarrollo exclusivo, permitir un usuario demo solo si se configuró explícitamente
    if (!devUser && process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_FALLBACK === 'true') {
        devUser = await prisma.usuario.findFirst({
            where: { email: { contains: 'empsignature', mode: 'insensitive' } }
        });
        // Modo mock de desarrollo: no hay ID Token real de Firebase que decodificar,
        // así que no podemos verificar email_verified de verdad. Se asume true para
        // no bloquear el flujo de desarrollo local.
        emailVerified = true;
    }

    if (!devUser) {
        redirect('/login');
    }

    if (!devUser.activo) {
        redirect('/login?error=inactive');
    }

    if (!devUser.empresaId && devUser.rol !== 'super_admin') {
        redirect('/login?error=no-company');
    }

    // 2. Check Impersonation (Strictly for Super Admin)
    let activeEmpresaId = devUser.empresaId;
    let isImpersonating = false;

    if (devUser.rol === 'super_admin') {
        const impersonatedId = cookieStore.get('x-impersonation')?.value;

        if (impersonatedId && impersonatedId !== 'undefined' && impersonatedId !== 'null' && impersonatedId !== '') {
            // Validate that the target company actually exists in the database
            const targetEmpresa = await prisma.empresa.findUnique({
                where: { id: impersonatedId },
                select: { id: true }
            });
            if (targetEmpresa) {
                activeEmpresaId = impersonatedId;
                isImpersonating = true;
            }
        }
    }

    let requestId: string | undefined;
    try {
        const headerList = await headers();
        requestId = headerList.get('x-request-id') || undefined;
    } catch {
        // Headers cannot be read (e.g. outside request context/prerendering)
    }

    return {
        userId: devUser.id, // Always the real user ID
        empresaId: activeEmpresaId,
        role: devUser.rol,
        isImpersonating,
        emailVerified,
        requestId
    };
});
