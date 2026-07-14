/**
 * Configuración compartida de WebAuthn (login biométrico real: huella, Face ID, Windows
 * Hello, llaves de seguridad). Usa @simplewebauthn/server, la librería estándar de la
 * industria para esto — no se implementa criptografía WebAuthn a mano.
 *
 * rpID debe ser el dominio SIN esquema ni puerto (ej. "erp-drab-psi.vercel.app" o
 * "localhost" en desarrollo). Una vez que una passkey se registra contra un rpID, solo
 * sirve para ese dominio — si cambias de dominio de producción más adelante, los usuarios
 * tendrán que volver a registrar su passkey.
 */

function getAppUrl(): string {
    const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return url.replace(/\/$/, '');
}

export function getRpID(): string {
    try {
        return new URL(getAppUrl()).hostname;
    } catch {
        return 'localhost';
    }
}

export function getOrigin(): string {
    return getAppUrl();
}

export const RP_NAME = 'ERP Panamá';

// Nombre de la cookie donde se guarda temporalmente el "challenge" (reto criptográfico)
// entre el paso de generar opciones y el paso de verificar la respuesta del autenticador.
// Vive muy poco tiempo (2 minutos) y solo contiene un valor aleatorio de un solo uso, no
// ningún secreto reutilizable.
export const WEBAUTHN_CHALLENGE_COOKIE = 'webauthn_challenge';
export const WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS = 120;
