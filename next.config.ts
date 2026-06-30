import type { NextConfig } from "next";

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
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://apis.google.com https://www.gstatic.com https://*.firebaseio.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' blob: data: https:; connect-src 'self' https: wss:; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com https://*.firebaseapp.com; upgrade-insecure-requests;",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
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
