import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/actions/auth'; // Reusing this or similar logic

// Mock session retriever. In real usage, this might decode a JWT, check cookies, or call Firebase Admin.
// We'll simulate getting the user email/id from headers or a mock "current user".

export interface TenantContext {
    userId: string;
    empresaId: string;
    role: string;
    isImpersonating?: boolean;
}

export async function getTenantContext(): Promise<TenantContext> {
    // 1. Get User Identity from session cookie
    const cookieStore = await cookies();
    const rawEmail = cookieStore.get('session_email')?.value;
    const sessionEmail = rawEmail ? rawEmail.trim().toLowerCase() : undefined;

    let devUser = null;
    if (sessionEmail && sessionEmail !== 'guest') {
        devUser = await prisma.usuario.findFirst({
            where: {
                OR: [
                    { email: sessionEmail },
                    { email: { equals: sessionEmail, mode: 'insensitive' } }
                ]
            }
        });

        // Auto-aprovisionar nueva cuenta en PostgreSQL para usuarios que inician sesión/registran por primera vez vía Firebase (Google o Email)
        if (!devUser && sessionEmail.includes('@')) {
            try {
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const rucGen = `PE-${Date.now()}-${randomSuffix}`;
                const nombreGen = sessionEmail.split('@')[0];
                const razonGen = nombreGen.toUpperCase();

                const nuevaEmpresa = await prisma.empresa.create({
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

                devUser = await prisma.usuario.create({
                    data: {
                        empresaId: nuevaEmpresa.id,
                        email: sessionEmail,
                        passwordHash: 'oauth-firebase',
                        nombre: nombreGen,
                        rol: 'admin',
                        activo: true
                    }
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

    // 3. Return strict context
    return {
        userId: devUser.id, // Always the real user ID
        empresaId: activeEmpresaId,
        role: devUser.rol,
        isImpersonating
    };
}
