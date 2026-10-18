import type { MetadataRoute } from 'next';
import { getListings, SITE_URL } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings();
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: 'daily', priority: 0.9 },
    ...listings.map((p) => ({
      url: `${SITE_URL}/properties/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: p.status === 'sold' ? 0.3 : 0.8,
    })),
  ];
}
