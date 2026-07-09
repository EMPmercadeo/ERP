import crypto from 'crypto';

// La clave se resuelve de forma perezosa (no al importar el módulo). Next.js importa los
// módulos de route.ts durante "Collecting page data" en el build para analizarlos estáticamente,
// incluso si la ruta nunca llega a ejecutarse; resolver la clave al importar hacía fallar el build
// completo de Vercel apenas un route.ts importaba este archivo, aunque esa ruta no se invocara.
let cachedKey: string | null = null;

function getEncryptionKey(): string {
    if (cachedKey) return cachedKey;

    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL: ENCRYPTION_KEY no está definida en el entorno de producción.');
        }
        console.warn('⚠️ ADVERTENCIA: Usando clave de encriptación por defecto de desarrollo.');
        cachedKey = 'panama-erp-secret-key-32-chars-!';
        return cachedKey;
    }
    if (Buffer.from(key).length !== 32) {
        throw new Error('CRITICAL: ENCRYPTION_KEY debe tener exactamente 32 bytes.');
    }
    cachedKey = key;
    return cachedKey;
}

const IV_LENGTH = 12; // For GCM, 12 bytes is standard

export function encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(getEncryptionKey()), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:encryptedText:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

export function decrypt(text: string): string {
    if (!text) return '';
    const parts = text.split(':');
    if (parts.length !== 3) {
        throw new Error('Formato de texto cifrado inválido.');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(getEncryptionKey()), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
