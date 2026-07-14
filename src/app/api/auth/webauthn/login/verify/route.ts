import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { resolveUsuarioPorEmail } from '@/lib/auth/resolveUsuario';
import { adminAuth } from '@/lib/firebase/admin';
import { getOrigin, getRpID, WEBAUTHN_CHALLENGE_COOKIE } from '@/lib/webauthn';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Verifica la respuesta biométrica real contra la clave pública guardada y, solo si es
// válida, emite un Firebase Custom Token para ESE MISMO usuario. El cliente intercambia
// ese token por un ID Token real vía signInWithCustomToken() (Firebase Client SDK), que
// entra al mismo mecanismo de cookie de sesión (`setSessionToken`) que ya usan el login
// por contraseña y Google — no se creó un sistema de sesión paralelo.
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
        const email = cookieStore.get('webauthn_login_email')?.value;
        cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
        cookieStore.delete('webauthn_login_email');

        if (!expectedChallenge || !email) {
            return NextResponse.json({ verified: false, error: 'La solicitud de inicio de sesión expiró. Intenta de nuevo.' }, { status: 400 });
        }

        const usuario = await resolveUsuarioPorEmail(email);
        if (!usuario || !usuario.activo) {
            return NextResponse.json({ verified: false, error: 'Credenciales inválidas.' }, { status: 401 });
        }

        const body = await request.json();
        const credentialIdFromResponse: string | undefined = body?.id;
        if (!credentialIdFromResponse) {
            return NextResponse.json({ verified: false, error: 'Respuesta de autenticación inválida.' }, { status: 400 });
        }

        const stored = await prisma.webAuthnCredential.findUnique({
            where: { credentialId: credentialIdFromResponse }
        });

        if (!stored || stored.usuarioId !== usuario.id) {
            // No revelamos si el problema es "no existe" o "no es tuyo" — mismo mensaje genérico.
            logger.warn('Intento de login WebAuthn con credencial desconocida o de otro usuario', { email });
            return NextResponse.json({ verified: false, error: 'Credenciales inválidas.' }, { status: 401 });
        }

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: getOrigin(),
                expectedRPID: getRpID(),
                credential: {
                    id: stored.credentialId,
                    publicKey: new Uint8Array(stored.publicKey),
                    counter: Number(stored.counter),
                    transports: stored.transports ? (stored.transports.split(',') as never) : undefined
                }
            });
        } catch (err) {
            logger.warn('Falló la verificación de login WebAuthn', { email, error: err instanceof Error ? err.message : String(err) });
            return NextResponse.json({ verified: false, error: 'No se pudo verificar el dispositivo.' }, { status: 401 });
        }

        if (!verification.verified) {
            return NextResponse.json({ verified: false, error: 'Verificación biométrica fallida.' }, { status: 401 });
        }

        // Actualiza el contador anti-clonación y la fecha de último uso.
        await prisma.webAuthnCredential.update({
            where: { id: stored.id },
            data: {
                counter: BigInt(verification.authenticationInfo.newCounter),
                lastUsedAt: new Date()
            }
        });

        // Mintear un Custom Token de Firebase para este mismo usuario (ya verificado
        // biométricamente) — el cliente lo intercambia por un ID Token real.
        let customToken: string;
        try {
            const firebaseUser = await adminAuth.getUserByEmail(email);
            customToken = await adminAuth.createCustomToken(firebaseUser.uid);
        } catch (err) {
            logger.error('No se pudo generar el Custom Token de Firebase tras login WebAuthn', err, { email });
            return NextResponse.json({ verified: false, error: 'Error al completar el inicio de sesión.' }, { status: 500 });
        }

        logger.info('Login biométrico (WebAuthn) verificado correctamente', { email });
        return NextResponse.json({ verified: true, customToken });
    } catch (error) {
        console.error('[webauthn/login/verify] Error:', error);
        return NextResponse.json({ verified: false, error: 'Error interno al verificar el inicio de sesión.' }, { status: 500 });
    }
}
