'use server';

import { refresh, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { CACHE_TAG } from '@/lib/api';
import { markAccessRequest, replaceAllCodes, replaceCode, revokeUnlocks, setPoolUses } from '@/lib/server/access';
import { endAdminSession, passwordMatches, requireAdmin, startAdminSession } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { resolvePoint } from '@/lib/server/maplink';
import { removeMediaFiles, storeUpload, type MediaRole } from '@/lib/server/media';
import {
  createProperty,
  createRegion,
  deleteMedia,
  deleteProperty,
  deleteRegion,
  getMedia,
  setCover,
  updateMedia,
  updateProperty,
  updateRegion,
  type PropertyInput,
} from '@/lib/server/repo';
import { writeSettings, type SettingKey } from '@/lib/server/settings';
import { clampInt, text, toInt, toNumber } from '@/lib/server/util';

/** Every edit drops the cached public pages, so the website shows the change at once. */
function published() {
  revalidateTag(CACHE_TAG, { expire: 0 });
  refresh();
}

/**
 * For edits the website never sees (codes, call-backs, read flags): redraw the panel so the
 * person who clicked sees the result without reloading.
 */
function redrawPanel() {
  refresh();
}

export type ActionState = { error?: string; ok?: string } | undefined;

// ---------- sign in

export async function signIn(_state: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get('password') ?? '');
  if (!passwordMatches(password)) {
    // A pause makes guessing at the password tedious.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: 'Wrong password.' };
  }
  await startAdminSession();
  redirect('/admin');
}

export async function signOut() {
  await endAdminSession();
  redirect('/admin');
}

// ---------- regions

export async function saveRegion(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toInt(form.get('id'));
  const name = text(form.get('name'), 80);
  if (!name) return { error: 'A region needs a name.' };
  const input = {
    name,
    nameHi: text(form.get('nameHi'), 80),
    note: text(form.get('note'), 200),
    sortOrder: clampInt(form.get('sortOrder'), -999, 999, 0),
  };
  if (id) updateRegion(id, input);
  else createRegion(input);
  published();
  return { ok: id ? 'Region saved.' : 'Region added.' };
}

export async function removeRegion(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  if (id) deleteRegion(id);
  published();
}

// ---------- properties

function propertyFields(form: FormData): PropertyInput {
  const details: { label: string; value: string; labelHi?: string; valueHi?: string; key: boolean }[] = [];
  const labels = form.getAll('detailLabel').map(String);
  const values = form.getAll('detailValue').map(String);
  const keys = form.getAll('detailKey').map(String);
  for (let i = 0; i < labels.length; i++) {
    const label = text(labels[i], 60);
    const value = text(values[i], 200);
    if (label && value) details.push({ label, value, key: keys[i] === 'on' || keys[i] === String(i) });
  }

  const nearby: { place: string; distance: string }[] = [];
  const places = form.getAll('nearbyPlace').map(String);
  const distances = form.getAll('nearbyDistance').map(String);
  for (let i = 0; i < places.length; i++) {
    const place = text(places[i], 80);
    if (place) nearby.push({ place, distance: text(distances[i], 40) });
  }

  return {
    title: text(form.get('title'), 160),
    titleHi: text(form.get('titleHi'), 160),
    regionId: toInt(form.get('regionId')),
    type: ['land', 'residential', 'commercial'].includes(String(form.get('type'))) ? String(form.get('type')) : 'land',
    status: ['available', 'under_offer', 'sold'].includes(String(form.get('status'))) ? String(form.get('status')) : 'available',
    visibility: ['public', 'unlisted', 'draft'].includes(String(form.get('visibility'))) ? String(form.get('visibility')) : 'draft',
    featured: form.get('featured') === 'on',
    gated: form.get('gated') === 'on',
    sortOrder: clampInt(form.get('sortOrder'), -999, 999, 0),
    price: toNumber(form.get('price')),
    priceNote: text(form.get('priceNote'), 160),
    priceNoteHi: text(form.get('priceNoteHi'), 160),
    address: text(form.get('address'), 300),
    addressHi: text(form.get('addressHi'), 300),
    area: toNumber(form.get('area')),
    areaUnit: ['m2', 'ha', 'acre', 'sqft', 'sqyd', 'bigha'].includes(String(form.get('areaUnit')))
      ? String(form.get('areaUnit'))
      : 'm2',
    bedrooms: toInt(form.get('bedrooms')),
    bathrooms: toInt(form.get('bathrooms')),
    summary: text(form.get('summary'), 400),
    summaryHi: text(form.get('summaryHi'), 400),
    description: text(form.get('description'), 8000),
    descriptionHi: text(form.get('descriptionHi'), 8000),
    details,
    nearby,
  };
}

export async function saveProperty(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toInt(form.get('id'));
  const fields = propertyFields(form);
  if (!fields.title) return { error: 'A property needs a title.' };

  // "Location" accepts a Google Maps link (short links too), coordinates or survey degrees.
  const link = text(form.get('mapLink'), 500);
  if (link) {
    const point = await resolvePoint(link);
    if (!point) return { error: 'That location link could not be read. Paste a Google Maps link or "lat, lng".' };
    fields.latitude = point.latitude;
    fields.longitude = point.longitude;
  } else if (form.get('clearPoint') === 'on') {
    fields.latitude = null;
    fields.longitude = null;
  }

  if (id) {
    updateProperty(id, fields);
    published();
    return { ok: 'Saved.' };
  }
  const created = createProperty(fields);
  published();
  redirect(`/admin/properties/${created.id}`);
}

export async function removeProperty(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  if (!id) return;
  const rows = getDb().prepare('SELECT key FROM media WHERE property_id = ?').all(id) as { key: string }[];
  deleteProperty(id);
  for (const row of rows) await removeMediaFiles(row.key);
  published();
  redirect('/admin/properties');
}

// ---------- media

export async function uploadMedia(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const propertyId = toInt(form.get('propertyId'));
  const role = String(form.get('role') || 'gallery') as MediaRole;
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: 'Choose a file first.' };

  let added = 0;
  const problems: string[] = [];
  for (const file of files) {
    try {
      const stored = await storeUpload({ propertyId, role, file, alt: text(form.get('alt'), 200) });
      // The first photo on a listing becomes its cover, which is the public one.
      if (propertyId && role === 'gallery') {
        const existing = getDb()
          .prepare("SELECT COUNT(*) AS n FROM media WHERE property_id = ? AND role = 'cover'")
          .get(propertyId) as { n: number };
        if (!existing.n) setCover(propertyId, stored.id);
      }
      added++;
    } catch (err) {
      problems.push(`${file.name}: ${(err as Error).message}`);
    }
  }
  published();
  if (problems.length) return { error: problems.join(' · '), ok: added ? `${added} uploaded.` : undefined };
  return { ok: `${added} file${added === 1 ? '' : 's'} uploaded.` };
}

export async function removeMedia(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  if (!id) return;
  const row = getMedia(id);
  if (!row) return;
  deleteMedia(id);
  await removeMediaFiles(row.key);
  published();
}

export async function makeCover(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  const propertyId = toInt(form.get('propertyId'));
  if (id && propertyId) setCover(propertyId, id);
  published();
}

export async function moveMedia(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  const direction = String(form.get('direction')) === 'up' ? -1 : 1;
  const row = id ? getMedia(id) : null;
  if (!row) return;
  updateMedia(row.id, { sortOrder: row.sort_order + direction * 3 });
  // Re-number so the list stays tidy after a few moves.
  const siblings = getDb()
    .prepare('SELECT id FROM media WHERE property_id IS ? AND role = ? ORDER BY sort_order, id')
    .all(row.property_id, row.role) as { id: number }[];
  siblings.forEach((sibling, index) => updateMedia(sibling.id, { sortOrder: index * 2 }));
  published();
}

export async function saveMediaAlt(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  if (id) updateMedia(id, { alt: text(form.get('alt'), 200) });
  published();
}

// ---------- access codes

/** Retires one waiting code and mints another in its place. */
export async function newCode(form: FormData) {
  await requireAdmin();
  const codeId = toInt(form.get('codeId'));
  if (codeId) replaceCode(codeId);
  redrawPanel();
}

/** Retires every waiting code for a property and mints a fresh set. */
export async function replaceCodes(form: FormData) {
  await requireAdmin();
  const propertyId = toInt(form.get('propertyId'));
  if (propertyId) replaceAllCodes(propertyId, clampInt(form.get('maxUses'), 1, 50, 1));
  redrawPanel();
}

export async function changeCodeUses(form: FormData) {
  await requireAdmin();
  const propertyId = toInt(form.get('propertyId'));
  if (propertyId) setPoolUses(propertyId, clampInt(form.get('maxUses'), 1, 50, 1));
  redrawPanel();
}

export async function closeUnlocks(form: FormData) {
  await requireAdmin();
  const propertyId = toInt(form.get('propertyId'));
  if (propertyId) revokeUnlocks(propertyId);
  redrawPanel();
}

// ---------- requests and enquiries

export async function updateRequest(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  const state = String(form.get('state'));
  if (id && (state === 'new' || state === 'sent' || state === 'closed')) {
    markAccessRequest(id, state, text(form.get('sentCode'), 20));
  }
  redrawPanel();
}

export async function markEnquiryRead(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  if (id) getDb().prepare('UPDATE enquiries SET is_read = 1 WHERE id = ?').run(id);
  redrawPanel();
}

export async function removeEnquiry(form: FormData) {
  await requireAdmin();
  const id = toInt(form.get('id'));
  if (id) getDb().prepare('DELETE FROM enquiries WHERE id = ?').run(id);
  redrawPanel();
}

/** Rebuilds the public pages now — useful after restoring a backup into the data folder. */
export async function refreshSite() {
  await requireAdmin();
  published();
}

// ---------- settings

export async function saveSettings(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const values: Partial<Record<SettingKey, unknown>> = {};
  for (const [key, value] of form.entries()) values[key as SettingKey] = value;
  writeSettings(values);
  published();
  return { ok: 'Settings saved.' };
}

export async function uploadSiteImage(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const role = String(form.get('role')) === 'portrait' ? 'portrait' : 'hero';
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) return { error: 'Choose an image first.' };
  try {
    await storeUpload({ propertyId: null, role, file });
  } catch (err) {
    return { error: (err as Error).message };
  }
  published();
  return { ok: 'Picture updated.' };
}
