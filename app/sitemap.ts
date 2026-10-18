import type { MetadataRoute } from 'next';
import { getListings, SITE_URL } from '@/lib/api';
import { localeHref, LOCALES } from '@/lib/i18n';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings();
  const pages: { path: string; lastModified?: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/properties', priority: 0.9 },
    ...listings.map((p) => ({
      path: `/properties/${p.slug}`,
      lastModified: p.updatedAt,
      priority: p.status === 'sold' ? 0.3 : 0.8,
    })),
  ];
  // Every page in both languages, each pointing at its other-language version.
  return pages.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}${localeHref(locale, page.path)}`,
      lastModified: page.lastModified,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${localeHref(l, page.path)}`])),
      },
    })),
  );
}
