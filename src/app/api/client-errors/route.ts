import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Simple in-memory rate limiting map for client error reports (IP -> { count, windowStart })
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ERRORS_PER_MINUTE = 10; // Allow max 10 error logs per IP per minute to prevent DoS/flooding

export async function POST(req: NextRequest) {
    // 1. Basic Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'anonymous-ip';
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (!rateData || now - rateData.windowStart > LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
    } else {
        rateData.count++;
        if (rateData.count > MAX_ERRORS_PER_MINUTE) {
            // Rate limit exceeded silently or with status to prevent flooding logs
            return new NextResponse('Rate limit exceeded for error reporting.', { status: 429 });
        }
    }

    try {
        const body = await req.json();

        // 2. Strict Schema Validation
        const { digest, incidentId, ruta, timestamp, versionDespliegue, ...extra } = body;

        // Reject request if required fields are missing, invalid, or extra fields are sent
        if (!incidentId || typeof incidentId !== 'string' || incidentId.length > 100) {
            return new NextResponse('Invalid incidentId', { status: 400 });
        }
        if (!ruta || typeof ruta !== 'string' || ruta.length > 500) {
            return new NextResponse('Invalid ruta', { status: 400 });
        }
        if (!timestamp || typeof timestamp !== 'string' || isNaN(Date.parse(timestamp))) {
            return new NextResponse('Invalid timestamp', { status: 400 });
        }
        if (!versionDespliegue || typeof versionDespliegue !== 'string' || versionDespliegue.length > 50) {
            return new NextResponse('Invalid versionDespliegue', { status: 400 });
        }
        if (digest && (typeof digest !== 'string' || digest.length > 100)) {
            return new NextResponse('Invalid digest', { status: 400 });
        }

        // Verify no extra/unknown fields are provided to block potential log injection or sensitive data leakage
        if (Object.keys(extra).length > 0) {
            return new NextResponse('Payload contains unrecognized fields. Logging rejected.', { status: 400 });
        }

        // 3. Centralized Server Logging
        logger.error('Client Boundary Error Captured', new Error(`Incident: ${incidentId} on route ${ruta}`), {
            digest: digest || 'N/A',
            incidentId,
            ruta,
            timestamp,
            versionDespliegue,
            reportedByIp: ip,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return new NextResponse('Malformed request body', { status: 400 });
    }
}
