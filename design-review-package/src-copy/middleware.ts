import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de orígenes permitidos para consumir la API de nuestra aplicación
const allowedOrigins = [
  'https://erp-drab-psi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3008',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

// Límite de solicitudes simple en memoria por IP (Rate Limiting para Edge)
// Ventana de 60 segundos, máximo 120 peticiones por minuto por IP
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 120; // 2 solicitudes por segundo en promedio

export function middleware(request: NextRequest) {
  // Solo aplicamos las reglas CORS y Rate Limit a las rutas del API (/api/*)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous-ip';
    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - rateData.lastReset > RATE_LIMIT_WINDOW) {
      rateData.count = 1;
      rateData.lastReset = now;
    } else {
      rateData.count += 1;
    }
    rateLimitMap.set(ip, rateData);

    // Si excede el límite, bloqueamos con HTTP 429 Too Many Requests
    if (rateData.count > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera un momento antes de reintentar (Rate Limit Exceeded).' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const origin = request.headers.get('origin');

    let isAllowedOrigin = false;
    let responseOrigin = '';

    if (!origin) {
      // Peticiones same-origin del propio servidor (SSR) o sin cabecera de origen externa
      isAllowedOrigin = true;
    } else {
      try {
        const originUrl = new URL(origin);
        const originClean = `${originUrl.protocol}//${originUrl.host}`;

        // Permitimos la lista explícita y subdominios de despliegue en Vercel de la app (.vercel.app)
        if (
          allowedOrigins.includes(originClean) ||
          /^https:\/\/erp-.*\.vercel\.app$/.test(originClean)
        ) {
          isAllowedOrigin = true;
          responseOrigin = originClean;
        }
      } catch {
        isAllowedOrigin = false;
      }
    }

    // 1. Manejo de peticiones Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return new NextResponse(null, { status: 403, statusText: 'Forbidden (CORS)' });
      }
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': responseOrigin || allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token, x-impersonation',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. Bloqueo de peticiones externas no autorizadas
    if (origin && !isAllowedOrigin) {
      return NextResponse.json(
        { error: 'Bloqueo de seguridad CORS: Origen externo no autorizado para consumir esta API.' },
        { status: 403 }
      );
    }

    // 3. Continuar con la petición permitida y adjuntar cabeceras CORS y Rate Limit
    const response = NextResponse.next();
    const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - (rateLimitMap.get(request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous-ip')?.count || 1));
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    if (responseOrigin) {
      response.headers.set('Access-Control-Allow-Origin', responseOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
