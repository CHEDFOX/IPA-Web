import { cacheLife, cacheTag } from 'next/cache';
import { DEMO, demoListings, demoProperty, demoSharedProperty, demoSite } from './demo';
import type { Property, PropertyCard, Region, Site } from './types';

/**
 * This website's public address, used for link previews, QR codes and the sitemap.
 * SITE_URL is read at run time, so a container can be pointed at a new domain with a
 * restart rather than a rebuild; NEXT_PUBLIC_SITE_URL still works and is baked in at build.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/+$/, '');

/** Kept for the enquiry form, which now posts to this same app. */
export const PUBLIC_API_URL = '';

/** Every cached read carries this tag; an admin edit clears them all. */
export const CACHE_TAG = 'ipa';

const FRESH = 'hours';

/**
 * Data comes from the SQLite database in this same app (see lib/server). The reads live
 * behind 'use cache' so pages stay prerendered, and every admin edit calls
 * revalidateTag(CACHE_TAG).
 *
 * Gated listings are always cached in their locked form: the photos, map and address are
 * never part of the cached HTML. A visitor who enters a code gets them from /api/unlock.
 */

export async function getSite(): Promise<Site> {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife(FRESH);
  if (DEMO) return demoSite();
  const { readSite } = await import('./server/read');
  return readSite();
}

export async function getListings(): Promise<PropertyCard[]> {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife(FRESH);
  if (DEMO) return demoListings();
  const { readListings } = await import('./server/read');
  return readListings();
}

export async function getProperty(slug: string): Promise<Property | null> {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife(FRESH);
  if (DEMO) return demoProperty(slug);
  const { readProperty } = await import('./server/read');
  return readProperty(slug);
}

/** Private links are shared deliberately, so they open the listing in full, code or no code. */
export async function getSharedProperty(token: string): Promise<Property | null> {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife(FRESH);
  if (DEMO) return demoSharedProperty(token);
  const { readSharedProperty } = await import('./server/read');
  return readSharedProperty(token);
}

/** The address a renamed listing now lives at, so old links and QR codes still work. */
export async function getSlugRedirect(slug: string): Promise<string | null> {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife(FRESH);
  if (DEMO) return null;
  const { readSlugRedirect } = await import('./server/read');
  return readSlugRedirect(slug);
}

export async function getRegions(): Promise<Region[]> {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife(FRESH);
  if (DEMO) return demoSite().regions;
  const { readRegions } = await import('./server/read');
  return readRegions();
}
