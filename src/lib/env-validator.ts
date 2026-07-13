import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Esquema base de variables requeridas
const baseEnvSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
    ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY debe tener al menos 32 caracteres (256 bits) para cifrado AES-256'),
    SUPERADMIN_CLAIM_CODE: z.string().min(8, 'SUPERADMIN_CLAIM_CODE debe tener al menos 8 caracteres de seguridad'),
});

let validated = false;

/**
 * Valida de forma centralizada la presencia y el formato de las variables de entorno.
 * Lanza un error temprano en producción con los nombres de las variables faltantes
 * sin revelar ningún valor. En desarrollo y tiempo de build, registra advertencias sin interrumpir.
 */
export function validateEnv() {
    if (validated || isTest) return;

    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true';

    // 1. Validar esquema base
    const baseResult = baseEnvSchema.safeParse(process.env);
    if (!baseResult.success) {
        const missing = baseResult.error.issues.map((issue: any) => issue.path.join('.')).join(', ');
        const message = `Faltan o son inválidas las siguientes variables de entorno obligatorias: [ ${missing} ].`;

        if (isProduction && !isBuildTime) {
            throw new Error(`[FAIL-CLOSED] Error de inicialización: ${message}`);
        } else {
            console.warn(`[WARNING] Configuración incompleta en desarrollo/compilación: ${message}`);
            return; // No continuar con más validaciones
        }
    }

    // 2. Validaciones estrictas en producción en runtime (FASE 3)
    if (isProduction && !isBuildTime) {
        const missingProductionVars: string[] = [];

        // Firebase Admin
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            missingProductionVars.push('FIREBASE_SERVICE_ACCOUNT_KEY');
        }

        // Redis (Upstash)
        if (!process.env.UPSTASH_REDIS_REST_URL) {
            missingProductionVars.push('UPSTASH_REDIS_REST_URL');
        }
        if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
            missingProductionVars.push('UPSTASH_REDIS_REST_TOKEN');
        }

        // Storage Remoto (No se permite 'local' en producción)
        const provider = process.env.STORAGE_PROVIDER || 'remote';
        if (provider === 'local') {
            throw new Error(
                "[FAIL-CLOSED] Error de seguridad: STORAGE_PROVIDER='local' no está permitido en producción para evitar pérdida de datos efímeros."
            );
        }
        const hasAws = !!(
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.AWS_BUCKET_NAME
        );
        const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
        if (!hasAws && !hasVercelBlob) {
            missingProductionVars.push('BLOB_READ_WRITE_TOKEN (o AWS S3 credentials)');
        }

        // SMTP (Solo si se habilita el envío de correos)
        const hasSmtpConfig = !!(
            process.env.SMTP_HOST ||
            process.env.SMTP_USER ||
            process.env.SMTP_PASSWORD ||
            process.env.SMTP_FROM_EMAIL
        );
        if (hasSmtpConfig) {
            if (!process.env.SMTP_HOST) missingProductionVars.push('SMTP_HOST');
            if (!process.env.SMTP_USER) missingProductionVars.push('SMTP_USER');
            if (!process.env.SMTP_PASSWORD) missingProductionVars.push('SMTP_PASSWORD');
            if (!process.env.SMTP_FROM_EMAIL) missingProductionVars.push('SMTP_FROM_EMAIL');
        }

        // Sentry (Si feature flag está activo)
        if (process.env.SENTRY_ENABLED === 'true' && !process.env.SENTRY_DSN) {
            missingProductionVars.push('SENTRY_DSN');
        }

        if (missingProductionVars.length > 0) {
            throw new Error(
                `[FAIL-CLOSED] Error de configuración de producción: Faltan las siguientes variables externas requeridas para el correcto funcionamiento: [ ${missingProductionVars.join(', ')} ].`
            );
        }
    }

    validated = true;
}
