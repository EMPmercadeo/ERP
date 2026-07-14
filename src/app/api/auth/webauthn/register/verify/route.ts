import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { getOrigin, getRpID, WEBAUTHN_CHALLENGE_COOKIE } from '@/lib/webauthn';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Paso 2 de registrar una passkey real: verifica criptográficamente la respuesta del
// autenticador contra el reto guardado en el paso 1, y solo si es válida guarda la clave
// pública (nunca la huella/rostro, que nunca sale del dispositivo del usuario).
export async function POST(request: NextRequest) {
    try {
        const { userId } = await getTenantContext();

        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
        if (!expectedChallenge) {
            return NextResponse.json({ error: 'El reto de registro expiró. Intenta de nuevo.' }, { status: 400 });
        }

        const body = await request.json();
        const { nombre, ...response } = body as { nombre?: string; [key: string]: unknown };

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: response as never,
                expectedChallenge,
                expectedOrigin: getOrigin(),
                expectedRPID: getRpID()
            });
        } catch (err) {
            logger.warn('Falló la verificación de registro WebAuthn', { userId, error: err instanceof Error ? err.message : String(err) });
            return NextResponse.json({ verified: false, error: 'No se pudo verificar el dispositivo.' }, { status: 400 });
        } finally {
            cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
        }

        if (!verification.verified || !verification.registrationInfo) {
            return NextResponse.json({ verified: false, error: 'Verificación de registro fallida.' }, { status: 400 });
        }

        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

        await prisma.webAuthnCredential.create({
            data: {
                usuarioId: userId,
                credentialId: credential.id,
                publicKey: Buffer.from(credential.publicKey),
                counter: BigInt(credential.counter),
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                transports: credential.transports?.join(',') || null,
                nombre: nombre?.slice(0, 60) || 'Dispositivo sin nombre'
            }
        });

        logger.info('Passkey registrada correctamente', { userId });
        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error('[webauthn/register/verify] Error:', error);
        return NextResponse.json({ error: 'Error interno al verificar el registro.' }, { status: 500 });
    }
}
