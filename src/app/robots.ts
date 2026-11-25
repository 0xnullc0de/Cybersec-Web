import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://0xnullc0de.vercel.app'
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/admin', '/admin-vault'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
