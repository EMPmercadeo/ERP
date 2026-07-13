import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Esquema base: solo las variables SIN las cuales la app no puede arrancar en absoluto.
// DATABASE_URL es la única variable realmente crítica al inicio porque Prisma la necesita
// para crear el pool de conexiones. Las demás se validan de forma lazy (al momento de uso).
const baseEnvSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
});

let validated = false;

/**
 * Valida de forma centralizada la presencia y el formato de las variables de entorno.
 * Lanza un error temprano en producción SOLO si falta DATABASE_URL (sin BD no hay app).
 * Las demás variables se validan con degradación controlada: warnings + funcionalidad
 * deshabilitada en vez de crash total.
 */
export function validateEnv() {
    if (validated || isTest) return;

    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true';

    // 1. Validar esquema base (solo DATABASE_URL)
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

    // 2. Validaciones en producción en runtime (FASE 3)
    // Separamos las variables en CRÍTICAS (sin ellas la app no puede funcionar)
    // y DEGRADABLES (sin ellas, la funcionalidad correspondiente se deshabilita
    // con un warning, pero la app sigue sirviendo peticiones).
    if (isProduction && !isBuildTime) {
        const criticalMissing: string[] = [];
        const degradedFeatures: string[] = [];

        // === CRÍTICAS (causan crash si faltan) ===
        // Firebase Admin: sin esto, ningún usuario puede autenticarse
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            criticalMissing.push('FIREBASE_SERVICE_ACCOUNT_KEY');
        }

        // === DEGRADABLES (causan warning si faltan) ===

        // Clave de cifrado — sin esto, las operaciones de cifrado fallarán con error descriptivo
        if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
            degradedFeatures.push('Cifrado AES-256 (ENCRYPTION_KEY, mín. 32 caracteres) — las operaciones de cifrado darán error descriptivo');
        }

        // Código de superadmin — sin esto, nadie puede reclamar el rol de superadmin
        if (!process.env.SUPERADMIN_CLAIM_CODE || process.env.SUPERADMIN_CLAIM_CODE.length < 8) {
            degradedFeatures.push('Claim Superadmin (SUPERADMIN_CLAIM_CODE, mín. 8 caracteres) — el endpoint /api/claim-superadmin rechazará peticiones');
        }

        // Redis (Upstash) — sin esto, el rate limiting usa fallback en memoria local.
        // Por defecto esto es una DEGRADACIÓN (warning), no un bloqueo, para no tumbar
        // la API mientras Upstash no esté configurado. Si el dueño del proyecto marca
        // REQUIRE_DISTRIBUTED_RATE_LIMIT=true (recomendado en cuanto configure Upstash),
        // pasa a ser un requisito CRÍTICO que bloquea el arranque si falta.
        const requireDistributedRateLimit = process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === 'true';
        // Acepta también los nombres KV_REST_API_* que genera la integración de
        // Vercel Marketplace al conectar Upstash desde Storage (mismo endpoint REST).
        const hasRedis = !!(
            (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
            (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
        );
        if (!hasRedis) {
            if (requireDistributedRateLimit) {
                criticalMissing.push('UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (exigido por REQUIRE_DISTRIBUTED_RATE_LIMIT=true)');
            } else {
                degradedFeatures.push('Rate Limiting distribuido (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) — usando fallback en memoria local. Configure Upstash y luego REQUIRE_DISTRIBUTED_RATE_LIMIT=true para exigirlo.');
            }
        }

        // Storage Remoto — sin esto, la subida de archivos fallará con error descriptivo.
        // Mismo patrón: degradado por defecto, crítico si REQUIRE_REMOTE_STORAGE=true.
        const requireRemoteStorage = process.env.REQUIRE_REMOTE_STORAGE === 'true';
        const provider = process.env.STORAGE_PROVIDER || 'vercel';
        if (provider === 'local') {
            const msg = "STORAGE_PROVIDER='local' en producción — los archivos se perderán entre deploys. Configure 'vercel' o 's3'";
            if (requireRemoteStorage) {
                criticalMissing.push(`STORAGE_PROVIDER='local' (exigido remoto por REQUIRE_REMOTE_STORAGE=true)`);
            } else {
                degradedFeatures.push(msg);
            }
        }
        const hasAws = !!(
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.AWS_BUCKET_NAME
        );
        const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
        if (provider !== 'local' && !hasAws && !hasVercelBlob) {
            if (requireRemoteStorage) {
                criticalMissing.push('BLOB_READ_WRITE_TOKEN o AWS S3 credentials (exigido por REQUIRE_REMOTE_STORAGE=true)');
            } else {
                degradedFeatures.push('Storage remoto (BLOB_READ_WRITE_TOKEN o AWS S3 credentials) — la subida de archivos dará error descriptivo');
            }
        }

        // SMTP — sin esto, los correos no se envían pero la app sigue funcionando
        const hasSmtpConfig = !!(
            process.env.SMTP_HOST ||
            process.env.SMTP_USER ||
            process.env.SMTP_PASSWORD ||
            process.env.SMTP_FROM_EMAIL
        );
        if (!hasSmtpConfig) {
            degradedFeatures.push('Correo transaccional (SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL) — los correos no se enviarán');
        } else {
            // Si se configuró parcialmente, advertir sobre las faltantes
            const partialSmtp: string[] = [];
            if (!process.env.SMTP_HOST) partialSmtp.push('SMTP_HOST');
            if (!process.env.SMTP_USER) partialSmtp.push('SMTP_USER');
            if (!process.env.SMTP_PASSWORD) partialSmtp.push('SMTP_PASSWORD');
            if (!process.env.SMTP_FROM_EMAIL) partialSmtp.push('SMTP_FROM_EMAIL');
            if (partialSmtp.length > 0) {
                degradedFeatures.push(`Correo SMTP parcialmente configurado — faltan: ${partialSmtp.join(', ')}`);
            }
        }

        // Sentry — sin esto, los errores se registran solo en stdout/stderr
        if (!process.env.SENTRY_DSN) {
            degradedFeatures.push('Sentry (SENTRY_DSN) — los errores se registran en logs locales');
        }

        // Emitir advertencias de degradación
        if (degradedFeatures.length > 0) {
            console.warn(
                `[DEGRADACIÓN CONTROLADA] Las siguientes funcionalidades están deshabilitadas por falta de configuración:\n` +
                degradedFeatures.map(f => `  ⚠ ${f}`).join('\n')
            );
        }

        // Fallar solo por variables verdaderamente críticas
        if (criticalMissing.length > 0) {
            throw new Error(
                `[FAIL-CLOSED] Error de configuración de producción: Faltan las siguientes variables CRÍTICAS sin las cuales la aplicación no puede funcionar: [ ${criticalMissing.join(', ')} ].`
            );
        }
    }

    validated = true;
}
