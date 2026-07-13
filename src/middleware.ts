import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/redis-ratelimit';

// Lista de orígenes permitidos para consumir la API de nuestra aplicación
const allowedOrigins = [
  'https://erp-drab-psi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3008',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

function getActionFromPath(pathname: string, method: string): string {
  if (pathname.includes('/client-errors')) return 'client-error';
  if (pathname.includes('/login') || pathname.includes('/auth/login')) return 'login';
  if (pathname.includes('/session')) return 'session';
  if (pathname.includes('/forgot-password') || pathname.includes('/auth/forgot-password')) return 'password-reset';
  if (pathname.includes('/usuarios') && method === 'POST') return 'invitation';
  if (pathname.includes('/upload')) return 'upload';
  if (pathname.includes('/export') || pathname.includes('/download')) return 'export';
  if (pathname.includes('/sync') || pathname.includes('/reporte-z')) return 'heavy-report';
  if (pathname.includes('/webhooks')) return 'webhook';
  if (pathname.startsWith('/api/v1/')) return 'public-api';
  return 'default';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Solo aplicamos las reglas CORS y Rate Limit a las rutas del API (/api/*)
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous-ip';
    const action = getActionFromPath(pathname, method);
    
    // Obtener empresaId si viene en la cabecera (para delimitar rate limit por empresa)
    const empresaId = request.headers.get('x-empresa-id') || undefined;

    // Ejecutar Rate Limit (Upstash Redis en producción, Memoria local en dev)
    let rateLimitResult;
    try {
      rateLimitResult = await checkRateLimit(ip, action, empresaId);
    } catch (err) {
      console.error('Middleware Rate Limit Error:', err);
      // Fall-closed en producción: bloquear el request si falla la validación
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Error de configuración de seguridad: Rate Limit no disponible.' },
          { status: 500 }
        );
      }
      // En desarrollo permitir continuar
      rateLimitResult = { success: true, limit: 120, remaining: 119, reset: Date.now() + 60000 };
    }

    // Si excede el límite, bloqueamos con HTTP 429 Too Many Requests
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera un momento antes de reintentar (Rate Limit Exceeded).' },
        { 
          status: 429, 
          headers: { 
            'Retry-After': '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          } 
        }
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
    if (method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return new NextResponse(null, { status: 403, statusText: 'Forbidden (CORS)' });
      }
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': responseOrigin || allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token, x-impersonation, x-empresa-id',
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
    const requestHeaders = new Headers(request.headers);
    const requestId = crypto.randomUUID();
    requestHeaders.set('x-request-id', requestId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    if (responseOrigin) {
      response.headers.set('Access-Control-Allow-Origin', responseOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
