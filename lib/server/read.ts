import 'server-only';
import type { Property, PropertyCard, Region, Settings, Site } from '../types';
import { listPublicProperties, listPublicRegions, coversFor, countsByType, currentSlugFor, getPropertyBySlug, getPropertyByToken, mediaOf, siteMedia, type RegionRow } from './repo';
import { serializeCard, serializeImage, serializeProperty } from './serialize';
import { readSettings } from './settings';

const toRegion = (row: RegionRow): Region => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  nameHi: row.name_hi || undefined,
});

export function readRegions(): Region[] {
  return listPublicRegions().map(toRegion);
}

export function readSite(): Site {
  const regions = readRegions();
  const hero = siteMedia('hero');
  const portrait = siteMedia('portrait');
  return {
    settings: readSettings() as unknown as Settings,
    hero: hero ? serializeImage(hero) : null,
    portrait: portrait ? serializeImage(portrait) : null,
    locations: regions.map((r) => r.name),
    regions,
    counts: countsByType() as Site['counts'],
  };
}

export function readListings(): PropertyCard[] {
  const rows = listPublicProperties();
  const covers = coversFor(rows.map((r) => r.id));
  return rows.map((row) => serializeCard(row, covers.get(row.id) ?? []));
}

/** Always the locked form for a gated listing: nothing gated reaches the cached page. */
export function readProperty(slug: string): Property | null {
  const row = getPropertyBySlug(slug);
  if (!row || row.visibility !== 'public') return null;
  return serializeProperty(row, mediaOf(row.id), false);
}

/** Where an address that no longer exists should send the visitor. */
export function readSlugRedirect(slug: string): string | null {
  return currentSlugFor(slug);
}

/** A private link carries its own secret, so it shows the listing in full. */
export function readSharedProperty(token: string): Property | null {
  const row = getPropertyByToken(token);
  if (!row) return null;
  return serializeProperty(row, mediaOf(row.id), true);
}
