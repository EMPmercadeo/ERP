import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://erp-panama.com';
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/como-funciona',
        '/funcionalidades',
        '/precios',
        '/glosario',
        '/rubros',
        '/terms',
        '/privacy',
        '/cookies'
      ],
      disallow: [
        '/dashboard/',
        '/admin/',
        '/api/',
        '/login',
        '/register',
        '/forgot-password'
      ]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
