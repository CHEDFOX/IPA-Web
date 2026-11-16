import 'server-only';
import { getDb } from './db';
import type { MediaRow, PropertyRow } from './serialize';
import { randomToken, slugify, uniqueSlug } from './util';

const PROPERTY_COLUMNS = `
  p.*,
  r.slug AS region_slug,
  r.name AS region_name,
  r.name_hi AS region_name_hi
`;

const FROM = 'FROM properties p LEFT JOIN regions r ON r.id = p.region_id';

// ---------- regions

export interface RegionRow {
  id: number;
  slug: string;
  name: string;
  name_hi: string;
  note: string;
  sort_order: number;
}

export function listRegions(): RegionRow[] {
  return getDb().prepare('SELECT * FROM regions ORDER BY sort_order, name').all() as RegionRow[];
}

/** Regions that have at least one public listing, for the website's filter. */
export function listPublicRegions(): RegionRow[] {
  return getDb()
    .prepare(
      `SELECT r.* FROM regions r
       WHERE EXISTS (SELECT 1 FROM properties p WHERE p.region_id = r.id AND p.visibility = 'public')
       ORDER BY r.sort_order, r.name`,
    )
    .all() as RegionRow[];
}

export function createRegion(input: { name: string; nameHi?: string; note?: string; sortOrder?: number }): RegionRow {
  const db = getDb();
  const exists = db.prepare('SELECT 1 FROM regions WHERE slug = ?');
  const slug = uniqueSlug(slugify(input.name, 'region'), (s) => Boolean(exists.get(s)));
  const info = db
    .prepare('INSERT INTO regions (slug, name, name_hi, note, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(slug, input.name, input.nameHi ?? '', input.note ?? '', input.sortOrder ?? 0);
  return getRegion(Number(info.lastInsertRowid))!;
}

export function getRegion(id: number): RegionRow | null {
  return (getDb().prepare('SELECT * FROM regions WHERE id = ?').get(id) as RegionRow) ?? null;
}

export function updateRegion(id: number, input: { name?: string; nameHi?: string; note?: string; sortOrder?: number }) {
  getDb()
    .prepare(
      `UPDATE regions SET
         name = COALESCE(@name, name),
         name_hi = COALESCE(@nameHi, name_hi),
         note = COALESCE(@note, note),
         sort_order = COALESCE(@sortOrder, sort_order)
       WHERE id = @id`,
    )
    .run({ id, name: input.name ?? null, nameHi: input.nameHi ?? null, note: input.note ?? null, sortOrder: input.sortOrder ?? null });
}

/** Listings keep working after their region goes: region_id simply becomes null. */
export function deleteRegion(id: number) {
  getDb().prepare('DELETE FROM regions WHERE id = ?').run(id);
}

export function countPropertiesInRegion(id: number): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM properties WHERE region_id = ?').get(id) as { n: number };
  return row.n;
}

// ---------- properties

export function listPublicProperties(): PropertyRow[] {
  return getDb()
    .prepare(`SELECT ${PROPERTY_COLUMNS} ${FROM} WHERE p.visibility = 'public' ORDER BY p.featured DESC, p.sort_order, p.updated_at DESC`)
    .all() as PropertyRow[];
}

export function listAllProperties(): PropertyRow[] {
  return getDb().prepare(`SELECT ${PROPERTY_COLUMNS} ${FROM} ORDER BY p.sort_order, p.updated_at DESC`).all() as PropertyRow[];
}

export function getPropertyBySlug(slug: string): PropertyRow | null {
  return (getDb().prepare(`SELECT ${PROPERTY_COLUMNS} ${FROM} WHERE p.slug = ?`).get(slug) as PropertyRow) ?? null;
}

export function getProperty(id: number): PropertyRow | null {
  return (getDb().prepare(`SELECT ${PROPERTY_COLUMNS} ${FROM} WHERE p.id = ?`).get(id) as PropertyRow) ?? null;
}

/** A listing's current address, when the one asked for is an old one. */
export function currentSlugFor(oldSlug: string): string | null {
  const row = getDb()
    .prepare('SELECT p.slug FROM slug_history h JOIN properties p ON p.id = h.property_id WHERE h.slug = ?')
    .get(oldSlug) as { slug: string } | undefined;
  return row?.slug ?? null;
}

export function getPropertyByToken(token: string): PropertyRow | null {
  return (getDb().prepare(`SELECT ${PROPERTY_COLUMNS} ${FROM} WHERE p.share_token = ?`).get(token) as PropertyRow) ?? null;
}

export interface PropertyInput {
  title: string;
  titleHi?: string;
  regionId?: number | null;
  type?: string;
  status?: string;
  visibility?: string;
  featured?: boolean;
  sortOrder?: number;
  price?: number | null;
  priceNote?: string;
  priceNoteHi?: string;
  address?: string;
  addressHi?: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  areaUnit?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  summary?: string;
  summaryHi?: string;
  description?: string;
  descriptionHi?: string;
  details?: unknown;
  nearby?: unknown;
  gated?: boolean;
}

export function createProperty(input: PropertyInput): PropertyRow {
  const db = getDb();
  const exists = db.prepare('SELECT 1 FROM properties WHERE slug = ?');
  const slug = uniqueSlug(slugify(input.title, 'property'), (s) => Boolean(exists.get(s)));
  const info = db
    .prepare(
      `INSERT INTO properties (slug, share_token, title, title_hi, region_id, type, status, visibility, featured, gated)
       VALUES (@slug, @shareToken, @title, @titleHi, @regionId, @type, @status, @visibility, @featured, @gated)`,
    )
    .run({
      slug,
      shareToken: randomToken(16),
      title: input.title,
      titleHi: input.titleHi ?? '',
      regionId: input.regionId ?? null,
      type: input.type ?? 'land',
      status: input.status ?? 'available',
      visibility: input.visibility ?? 'draft',
      featured: input.featured ? 1 : 0,
      gated: input.gated === false ? 0 : 1,
    });
  const id = Number(info.lastInsertRowid);
  updateProperty(id, input);
  return getProperty(id)!;
}

const UPDATABLE: Record<string, string> = {
  title: 'title',
  titleHi: 'title_hi',
  regionId: 'region_id',
  type: 'type',
  status: 'status',
  visibility: 'visibility',
  sortOrder: 'sort_order',
  price: 'price',
  priceNote: 'price_note',
  priceNoteHi: 'price_note_hi',
  address: 'address',
  addressHi: 'address_hi',
  latitude: 'latitude',
  longitude: 'longitude',
  area: 'area',
  areaUnit: 'area_unit',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  summary: 'summary',
  summaryHi: 'summary_hi',
  description: 'description',
  descriptionHi: 'description_hi',
};

export function updateProperty(id: number, input: PropertyInput & { slug?: string }) {
  const db = getDb();
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (!(key in input)) continue;
    sets.push(`${column} = @${key}`);
    params[key] = (input as unknown as Record<string, unknown>)[key] ?? null;
  }
  if ('featured' in input) {
    sets.push('featured = @featured');
    params.featured = input.featured ? 1 : 0;
  }
  if ('gated' in input) {
    sets.push('gated = @gated');
    params.gated = input.gated ? 1 : 0;
  }
  if ('details' in input) {
    sets.push('details = @details');
    params.details = JSON.stringify(input.details ?? []);
  }
  if ('nearby' in input) {
    sets.push('nearby = @nearby');
    params.nearby = JSON.stringify(input.nearby ?? []);
  }
  if (input.slug) {
    const exists = db.prepare('SELECT 1 FROM properties WHERE slug = ? AND id <> ?');
    const wanted = uniqueSlug(slugify(input.slug, 'property'), (s) => Boolean(exists.get(s, id)));
    const current = db.prepare('SELECT slug FROM properties WHERE id = ?').get(id) as { slug: string } | undefined;
    if (current && current.slug !== wanted) {
      // Keep the old address pointing here: it may be on a signboard already.
      db.prepare('INSERT OR REPLACE INTO slug_history (slug, property_id) VALUES (?, ?)').run(current.slug, id);
      db.prepare('DELETE FROM slug_history WHERE slug = ?').run(wanted);
    }
    sets.push('slug = @newSlug');
    params.newSlug = wanted;
  }
  if (!sets.length) return;
  sets.push("updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))");
  db.prepare(`UPDATE properties SET ${sets.join(', ')} WHERE id = @id`).run(params);
}

export function deleteProperty(id: number) {
  getDb().prepare('DELETE FROM properties WHERE id = ?').run(id);
}

export function countsByType(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT type, COUNT(*) AS n FROM properties WHERE visibility = 'public' GROUP BY type")
    .all() as { type: string; n: number }[];
  const counts: Record<string, number> = { land: 0, residential: 0, commercial: 0, total: 0 };
  for (const row of rows) {
    counts[row.type] = row.n;
    counts.total += row.n;
  }
  return counts;
}

// ---------- media

export function mediaOf(propertyId: number): MediaRow[] {
  return getDb()
    .prepare('SELECT * FROM media WHERE property_id = ? ORDER BY role, sort_order, id')
    .all(propertyId) as MediaRow[];
}

/** Covers for a set of listings in one query, so a grid is a single round trip. */
export function coversFor(ids: number[]): Map<number, MediaRow[]> {
  const out = new Map<number, MediaRow[]>();
  if (!ids.length) return out;
  const rows = getDb()
    .prepare(
      `SELECT * FROM media WHERE property_id IN (${ids.map(() => '?').join(',')})
         AND role IN ('cover', 'gallery') ORDER BY property_id, role, sort_order, id`,
    )
    .all(...ids) as MediaRow[];
  for (const row of rows) {
    const list = out.get(row.property_id!) ?? [];
    list.push(row);
    out.set(row.property_id!, list);
  }
  return out;
}

export function getMediaByKey(key: string): MediaRow | null {
  return (getDb().prepare('SELECT * FROM media WHERE key = ?').get(key) as MediaRow) ?? null;
}

export function getMedia(id: number): MediaRow | null {
  return (getDb().prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow) ?? null;
}

export function siteMedia(role: 'hero' | 'portrait'): MediaRow | null {
  return (
    (getDb()
      .prepare('SELECT * FROM media WHERE property_id IS NULL AND role = ? ORDER BY id DESC LIMIT 1')
      .get(role) as MediaRow) ?? null
  );
}

export function insertMedia(row: {
  propertyId: number | null;
  role: string;
  kind: string;
  key: string;
  originalName: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  file: string | null;
  variants: unknown;
  alt?: string;
}): number {
  const db = getDb();
  const next = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM media WHERE property_id IS ? AND role = ?')
    .get(row.propertyId, row.role) as { n: number };
  const info = db
    .prepare(
      `INSERT INTO media (property_id, role, kind, key, original_name, mime, bytes, width, height, duration, file, variants, alt, sort_order)
       VALUES (@propertyId, @role, @kind, @key, @originalName, @mime, @bytes, @width, @height, @duration, @file, @variants, @alt, @sortOrder)`,
    )
    .run({ ...row, alt: row.alt ?? '', variants: JSON.stringify(row.variants ?? {}), sortOrder: next.n });
  return Number(info.lastInsertRowid);
}

export function updateMedia(id: number, input: { alt?: string; sortOrder?: number; role?: string }) {
  getDb()
    .prepare(
      `UPDATE media SET
         alt = COALESCE(@alt, alt),
         sort_order = COALESCE(@sortOrder, sort_order),
         role = COALESCE(@role, role)
       WHERE id = @id`,
    )
    .run({ id, alt: input.alt ?? null, sortOrder: input.sortOrder ?? null, role: input.role ?? null });
}

export function deleteMedia(id: number) {
  getDb().prepare('DELETE FROM media WHERE id = ?').run(id);
}

/** Makes this photo the cover and demotes whichever one held the role. */
export function setCover(propertyId: number, mediaId: number) {
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE media SET role = 'gallery' WHERE property_id = ? AND role = 'cover'").run(propertyId);
    db.prepare("UPDATE media SET role = 'cover', sort_order = -1 WHERE id = ? AND property_id = ?").run(mediaId, propertyId);
  })();
}
