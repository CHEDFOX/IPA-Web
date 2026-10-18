import { cacheLife, cacheTag } from 'next/cache';
import type { Property, PropertyCard, Site } from './types';

const trim = (url: string) => url.replace(/\/+$/, '');

/** Backend address the browser uses (enquiry form). */
export const PUBLIC_API_URL = trim(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
/** Backend address the server uses. */
const SERVER_API_URL = PUBLIC_API_URL;
/** This website's public address. On Vercel it defaults to the project's production domain. */
export const SITE_URL = trim(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
);

/** Every cached request carries this tag; the backend's refresh call clears them all. */
export const CACHE_TAG = 'ipa';

const EMPTY_SITE: Site = {
  settings: {
    siteName: 'IPA',
    tagline: 'Real estate & land',
    heroTitle: 'Land and property, ready to view.',
    heroText: '',
    aboutTitle: '',
    aboutText: '',
    contactTitle: 'Looking for something specific?',
    contactText: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    currency: 'USD',
    instagram: '',
    facebook: '',
    footerNote: '',
  },
  hero: null,
  portrait: null,
  locations: [],
  counts: { land: 0, residential: 0, commercial: 0, total: 0 },
};

class NotFound extends Error {}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_API_URL}${path}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) throw new NotFound(path);
  if (!res.ok) throw new Error(`Backend request ${path} failed with HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// Normal entries refresh every minute in the background, and straight away when the backend
// calls /api/revalidate. If the backend is unreachable the site stays up with empty content
// and retries after 30 seconds. Only one cacheLife call may run per cached call.
const FRESH = 'minutes';
const RETRY_SOON = { stale: 30, revalidate: 30, expire: 300 };

function onBackendError(path: string, err: unknown) {
  console.error(`[ipa] ${path}:`, err instanceof Error ? err.message : err);
  cacheLife(RETRY_SOON);
}

export async function getSite(): Promise<Site> {
  'use cache';
  cacheTag(CACHE_TAG);
  try {
    const site = await request<Site>('/api/site');
    cacheLife(FRESH);
    return site;
  } catch (err) {
    onBackendError('/api/site', err);
    return EMPTY_SITE;
  }
}

/** All public listings; pages filter them, which keeps one cached request for the whole portfolio. */
export async function getListings(): Promise<PropertyCard[]> {
  'use cache';
  cacheTag(CACHE_TAG);
  try {
    const data = await request<{ items: PropertyCard[] }>('/api/properties');
    cacheLife(FRESH);
    return data.items;
  } catch (err) {
    onBackendError('/api/properties', err);
    return [];
  }
}

export async function getProperty(slug: string): Promise<Property | null> {
  'use cache';
  cacheTag(CACHE_TAG);
  try {
    const property = await request<Property>(`/api/properties/${encodeURIComponent(slug)}`);
    cacheLife(FRESH);
    return property;
  } catch (err) {
    if (err instanceof NotFound) cacheLife(FRESH);
    else onBackendError(`/api/properties/${slug}`, err);
    return null;
  }
}

export async function getSharedProperty(token: string): Promise<Property | null> {
  'use cache';
  cacheTag(CACHE_TAG);
  try {
    const property = await request<Property>(`/api/share/${encodeURIComponent(token)}`);
    cacheLife(FRESH);
    return property;
  } catch (err) {
    if (err instanceof NotFound) cacheLife(FRESH);
    else onBackendError(`/api/share/${token}`, err);
    return null;
  }
}
