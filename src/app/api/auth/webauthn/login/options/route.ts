import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { resolveUsuarioPorEmail } from '@/lib/auth/resolveUsuario';
import { getRpID, WEBAUTHN_CHALLENGE_COOKIE, WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

// Ruta pública (sin sesión todavía — es justo lo que se usa para iniciar sesión).
// Deliberadamente responde con la misma forma tanto si el correo existe como si no,
// para no permitir enumerar cuentas registradas probando correos al azar.
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!email) {
            return NextResponse.json({ error: 'Correo requerido.' }, { status: 400 });
        }

        let allowCredentials: { id: string; transports?: string[] }[] = [];
        try {
            const usuario = await resolveUsuarioPorEmail(email);
            if (usuario) {
                const credenciales = await prisma.webAuthnCredential.findMany({
                    where: { usuarioId: usuario.id },
                    select: { credentialId: true, transports: true }
                });
                allowCredentials = credenciales.map((c) => ({
                    id: c.credentialId,
                    transports: c.transports ? c.transports.split(',') : undefined
                }));
            }
        } catch {
            // Silenciosamente se deja allowCredentials vacío — misma respuesta que "no tiene passkeys".
        }

        const options = await generateAuthenticationOptions({
            rpID: getRpID(),
            userVerification: 'preferred',
            allowCredentials: allowCredentials as never
        });

        const cookieStore = await cookies();
        cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS
        });
        // Necesitamos recordar qué correo intenta este login para el paso de verificación
        // (la cookie de challenge no identifica al usuario por sí sola).
        cookieStore.set('webauthn_login_email', email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error('[webauthn/login/options] Error:', error);
        return NextResponse.json({ error: 'No se pudieron generar las opciones de autenticación.' }, { status: 500 });
    }
}
