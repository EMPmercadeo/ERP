import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://erp-panama.com';
  
  const publicRoutes = [
    '',
    '/como-funciona',
    '/funcionalidades',
    '/precios',
    '/glosario',
    '/rubros',
    '/terms',
    '/privacy',
    '/cookies'
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.8
  }));
}
