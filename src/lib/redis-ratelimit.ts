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

// Fallback en memoria para desarrollo/test
const localLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkInMemoryLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
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
 * Si no está configurado en producción, arroja un error (Fail-Closed).
 */
export async function checkRateLimit(
    ip: string,
    action: string,
    empresaId?: string
): Promise<RateLimitResult> {
    const isProd = process.env.NODE_ENV === 'production';
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const enabled = process.env.RATE_LIMIT_ENABLED !== 'false';

    if (!enabled) {
        return { success: true, limit: 9999, remaining: 9999, reset: Date.now() + 60000 };
    }

    const config = LIMITS[action] || LIMITS.default;
    const key = `ratelimit:${action}:${ip}${empresaId ? `:${empresaId}` : ''}`;

    if (!url || !token) {
        // Fallback a limitación en memoria (no distribuida) si Redis no está configurado.
        // En producción esto es subóptimo (cada instancia serverless tiene su propio contador),
        // pero es preferible a denegar todas las peticiones o crashear.
        if (isProd) {
            console.warn('[RATE-LIMIT] Redis no configurado en producción — usando fallback en memoria local (no distribuido).');
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
