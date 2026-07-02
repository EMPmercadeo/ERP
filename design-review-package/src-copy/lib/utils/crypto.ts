import crypto from 'crypto';

function getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL: ENCRYPTION_KEY no está definida en el entorno de producción.');
        }
        console.warn('⚠️ ADVERTENCIA: Usando clave de encriptación por defecto de desarrollo.');
        return 'panama-erp-secret-key-32-chars-!';
    }
    if (Buffer.from(key).length !== 32) {
        throw new Error('CRITICAL: ENCRYPTION_KEY debe tener exactamente 32 bytes.');
    }
    return key;
}

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 12; // For GCM, 12 bytes is standard

export function encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    
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
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}
