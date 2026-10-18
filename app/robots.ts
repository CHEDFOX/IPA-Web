import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api';

// Private links (/p/...) stay crawlable on purpose: chat apps fetch them for link previews,
// and the pages themselves carry "noindex".
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
