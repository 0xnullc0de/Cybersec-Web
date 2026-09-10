import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { writeups as fallbackWriteups } from '@/data/writeups';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://nullbyte.vercel.app'
  );

  // Core public routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/writeups`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/til`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamic writeups from database
  try {
    const { data: dbWriteups } = await supabase
      .from('writeups')
      .select('slug, updated_at, date_published');

    const writeupList = (dbWriteups && dbWriteups.length > 0) ? dbWriteups : fallbackWriteups;

    writeupList.forEach((w: any) => {
      routes.push({
        url: `${baseUrl}/writeups/${w.slug}`,
        lastModified: w.updated_at ? new Date(w.updated_at) : (w.date_published ? new Date(w.date_published) : new Date()),
        changeFrequency: 'weekly',
        priority: 0.85,
      });
    });
  } catch (e) {
    console.error('Error generating sitemap writeups:', e);
  }

  return routes;
}
