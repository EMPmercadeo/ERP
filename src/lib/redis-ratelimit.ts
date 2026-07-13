export interface RateLimitConfig {
    limit: number;
    windowSeconds: number;
}

export const LIMITS: Record<string, RateLimitConfig> = {
    login: { limit: 10, windowSeconds: 60 },
    session: { limit: 15, windowSeconds: 60 },
    'password-reset': { limit: 5, windowSeconds: 60 },
    invitation: { limit: 5, windowSeconds: 60 },
    upload: { limit: 5, windowSeconds: 60 },
    export: { limit: 10, windowSeconds: 60 },
    'client-error': { limit: 10, windowSeconds: 60 },
    'public-api': { limit: 60, windowSeconds: 60 },
    'heavy-report': { limit: 5, windowSeconds: 60 },
    webhook: { limit: 30, windowSeconds: 60 },
    default: { limit: 120, windowSeconds: 60 },
};

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

// Fallback en memoria para desarrollo/test/degradación controlada en producción.
const localLimitMap = new Map<string, { count: number; lastReset: number }>();

// Evita fuga de memoria: en una instancia serverless "warm" de larga vida, el mapa
// de fallback crecería sin límite (una entrada por IP+acción+empresa nunca vista).
// Barremos entradas ya expiradas cada cierto número de llamadas en vez de en cada
// petición (para no penalizar latencia) y limitamos el tamaño máximo como tope duro.
const MAX_MEMORY_MAP_ENTRIES = 20000;
let callsSinceSweep = 0;

function sweepExpiredEntries(nowMs: number) {
    for (const [k, v] of localLimitMap) {
        // Una entrada sin actividad por más de 10 minutos ya no es relevante para
        // ninguna ventana de rate limit configurada (la más larga es 60s).
        if (nowMs - v.lastReset > 10 * 60 * 1000) {
            localLimitMap.delete(k);
        }
    }
    // Salvaguarda dura: si aun así el mapa creciera demasiado (ataque de IPs
    // distintas), lo vaciamos por completo antes de que consuma memoria del proceso.
    if (localLimitMap.size > MAX_MEMORY_MAP_ENTRIES) {
        localLimitMap.clear();
    }
}

function checkInMemoryLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    callsSinceSweep++;
    if (callsSinceSweep >= 500) {
        callsSinceSweep = 0;
        sweepExpiredEntries(now);
    }

    const data = localLimitMap.get(key) || { count: 0, lastReset: now };

    if (now - data.lastReset > windowMs) {
        data.count = 1;
        data.lastReset = now;
    } else {
        data.count++;
    }
    localLimitMap.set(key, data);

    const remaining = Math.max(0, config.limit - data.count);
    const reset = data.lastReset + windowMs;

    return {
        success: data.count <= config.limit,
        limit: config.limit,
        remaining,
        reset
    };
}

/**
 * Verifica el límite de tasa usando Upstash Redis (REST pipeline) en producción.
 *
 * Comportamiento cuando Redis NO está configurado:
 * - Por defecto (`REQUIRE_DISTRIBUTED_RATE_LIMIT` ausente o `false`): se degrada a un
 *   contador en memoria local (no distribuido entre instancias serverless). No es el
 *   estado ideal, pero evita que toda la API quede inutilizable mientras el dueño del
 *   proyecto termina de configurar Upstash. Cada petición degradada se registra con
 *   `console.warn` para que sea visible en los logs de Vercel.
 * - Si `REQUIRE_DISTRIBUTED_RATE_LIMIT=true` (activarlo una vez Upstash esté
 *   configurado y probado): falta de Redis en producción provoca Fail-Closed real
 *   (bloquea la petición con 429) en vez de degradar silenciosamente.
 */
export async function checkRateLimit(
    ip: string,
    action: string,
    empresaId?: string
): Promise<RateLimitResult> {
    const isProd = process.env.NODE_ENV === 'production';
    // Acepta tanto los nombres "clásicos" de Upstash (UPSTASH_REDIS_REST_*) como los que
    // genera la integración "Vercel Marketplace Database" (KV_REST_API_*) al conectar
    // Upstash desde la pestaña Storage de Vercel — ambos apuntan al mismo endpoint REST.
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    const enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
    const requireDistributed = process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === 'true';

    if (!enabled) {
        return { success: true, limit: 9999, remaining: 9999, reset: Date.now() + 60000 };
    }

    const config = LIMITS[action] || LIMITS.default;
    const key = `ratelimit:${action}:${ip}${empresaId ? `:${empresaId}` : ''}`;

    if (!url || !token) {
        if (isProd && requireDistributed) {
            // El dueño del proyecto marcó explícitamente que Redis distribuido es
            // obligatorio en producción: sin credenciales, fallamos cerrado.
            console.error('[RATE-LIMIT] REQUIRE_DISTRIBUTED_RATE_LIMIT=true pero Upstash Redis no está configurado — bloqueando petición (Fail-Closed).');
            return { success: false, limit: config.limit, remaining: 0, reset: Date.now() + 60000 };
        }
        // Fallback a limitación en memoria (no distribuida) si Redis no está configurado.
        // En producción esto es subóptimo (cada instancia serverless tiene su propio contador),
        // pero es preferible a denegar todas las peticiones o crashear mientras no exista
        // una decisión explícita del dueño del proyecto (ver REQUIRE_DISTRIBUTED_RATE_LIMIT).
        if (isProd) {
            console.warn('[RATE-LIMIT] Redis no configurado en producción — usando fallback en memoria local (no distribuido). Configure UPSTASH_REDIS_REST_URL/TOKEN y REQUIRE_DISTRIBUTED_RATE_LIMIT=true para exigir Redis.');
        }
        return checkInMemoryLimit(key, config);
    }

    try {
        const pipeline = [
            ['INCR', key],
            ['EXPIRE', key, String(config.windowSeconds), 'NX'],
            ['TTL', key]
        ];

        const response = await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pipeline),
            signal: AbortSignal.timeout(2000)
        });

        if (!response.ok) {
            throw new Error(`Upstash Redis API responded with status ${response.status}`);
        }

        const data = await response.json();
        const count = Number(data[0]?.result || 1);
        const ttl = Number(data[2]?.result || config.windowSeconds);

        const remaining = Math.max(0, config.limit - count);
        const reset = Date.now() + (ttl > 0 ? ttl : config.windowSeconds) * 1000;

        return {
            success: count <= config.limit,
            limit: config.limit,
            remaining,
            reset
        };
    } catch (error) {
        console.error('Error al contactar Upstash Redis:', error);
        // Fail-closed en producción ante fallas de Redis
        if (isProd) {
            return { success: false, limit: config.limit, remaining: 0, reset: Date.now() + 60000 };
        }
        return { success: true, limit: config.limit, remaining: 1, reset: Date.now() + 60000 };
    }
}
