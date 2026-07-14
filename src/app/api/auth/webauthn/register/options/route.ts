import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { getRpID, RP_NAME, WEBAUTHN_CHALLENGE_COOKIE, WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

// Paso 1 de registrar una passkey real: requiere sesión activa (no se puede registrar un
// dispositivo biométrico para una cuenta que no controlas). Genera un reto criptográfico
// y lo guarda en una cookie httpOnly de corta duración para verificarlo en el paso 2.
export async function POST() {
    try {
        const { userId } = await getTenantContext();

        const usuario = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { id: true, email: true, nombre: true }
        });
        if (!usuario) {
            return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
        }

        const existentes = await prisma.webAuthnCredential.findMany({
            where: { usuarioId: usuario.id },
            select: { credentialId: true, transports: true }
        });

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: getRpID(),
            userName: usuario.email,
            userDisplayName: usuario.nombre || usuario.email,
            attestationType: 'none',
            excludeCredentials: existentes.map((c) => ({
                id: c.credentialId,
                transports: c.transports ? (c.transports.split(',') as any) : undefined
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform'
            }
        });

        const cookieStore = await cookies();
        cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error('[webauthn/register/options] Error:', error);
        return NextResponse.json({ error: 'No se pudieron generar las opciones de registro.' }, { status: 500 });
    }
}
