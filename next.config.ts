import type { NextConfig } from "next";

// Dev-only allowance so impeccable live mode can load.
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://apis.google.com https://www.gstatic.com https://*.firebaseio.com${__impeccableLiveDev}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' blob: data: https:; connect-src 'self' https: wss:${__impeccableLiveDev}; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com https://*.firebaseapp.com; upgrade-insecure-requests;`,
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // puppeteer-core y @sparticuz/chromium generan/leen un binario de Chromium en tiempo de
  // ejecución (no es JS puro) — si webpack intenta empaquetarlos como al resto del código,
  // rompe. serverExternalPackages los deja fuera del bundle (se resuelven vía node_modules
  // normal en runtime) y outputFileTracingIncludes asegura que ese binario SÍ viaje dentro
  // de la función serverless de Vercel (con output: 'standalone' el tracing automático no
  // siempre detecta archivos binarios cargados por ruta de archivo en vez de por require()).
  serverExternalPackages: ['firebase-admin', 'puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/invoices/[id]/pdf': ['./node_modules/@sparticuz/chromium/**/*'],
    '/api/rrhh/expediente/[id]/pdf': ['./node_modules/@sparticuz/chromium/**/*'],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Aplicar cabeceras de seguridad a todas las rutas de la aplicación
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
