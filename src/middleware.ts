import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de orígenes permitidos para consumir la API de nuestra aplicación
const allowedOrigins = [
  'https://erp-drab-psi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3008',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

export function middleware(request: NextRequest) {
  // Solo aplicamos las reglas CORS a las rutas del API (/api/*)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || request.headers.get('referer');

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
          originClean.endsWith('.vercel.app')
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

    // 3. Continuar con la petición permitida y adjuntar cabeceras CORS
    const response = NextResponse.next();
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
