import 'server-only';
import type {
  Cover,
  DocumentMedia,
  GalleryItem,
  ImageMedia,
  ImageSet,
  Property,
  PropertyCard,
  Region,
  UnlockedDetail,
  VideoMedia,
} from '../types';
import { parseJson } from './util';

export interface MediaRow {
  id: number;
  property_id: number | null;
  role: string;
  kind: string;
  key: string;
  original_name: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  file: string | null;
  variants: string;
  alt: string;
  sort_order: number;
}

export interface PropertyRow {
  id: number;
  slug: string;
  share_token: string;
  region_id: number | null;
  region_slug: string | null;
  region_name: string | null;
  region_name_hi: string | null;
  title: string;
  title_hi: string;
  type: string;
  status: string;
  visibility: string;
  featured: number;
  price: number | null;
  price_note: string;
  price_note_hi: string;
  address: string;
  address_hi: string;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  area_unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  summary: string;
  summary_hi: string;
  description: string;
  description_hi: string;
  details: string;
  nearby: string;
  gated: number;
  created_at: string;
  updated_at: string;
}

type Variant = { file: string; width: number; height: number };
type Variants = Record<string, Variant | undefined>;

const SIZE_ORDER = ['sm', 'md', 'lg'];

/**
 * Media is served by our own route, which checks the unlock cookie for gated files.
 * `k` is the media key; the path carries the variant so each size caches separately.
 */
const mediaUrl = (key: string, variant: string) => `/media/${key}/${variant}`;

function imageSet(key: string, variants: Variants): ImageSet | null {
  const sizes = SIZE_ORDER.filter((name) => variants[name]).map((name) => ({
    url: mediaUrl(key, name),
    width: variants[name]!.width,
    height: variants[name]!.height,
  }));
  if (!sizes.length) return null;
  return { sizes, og: variants.og ? mediaUrl(key, 'og') : sizes[sizes.length - 1].url };
}

export function serializeImage(row: MediaRow): ImageMedia | null {
  const set = imageSet(row.key, parseJson<Variants>(row.variants, {}));
  if (!set) return null;
  return { id: row.id, kind: 'image', alt: row.alt, width: row.width, height: row.height, ...set };
}

function serializeVideo(row: MediaRow): VideoMedia {
  return {
    id: row.id,
    kind: 'video',
    alt: row.alt,
    url: mediaUrl(row.key, 'file'),
    mime: row.mime,
    width: row.width,
    height: row.height,
    duration: row.duration,
    poster: imageSet(row.key, parseJson<Variants>(row.variants, {})),
  };
}

function serializeDocument(row: MediaRow): DocumentMedia {
  return {
    id: row.id,
    kind: 'document',
    alt: row.alt,
    url: mediaUrl(row.key, 'file'),
    mime: row.mime,
    bytes: row.bytes,
    name: row.original_name,
  };
}

export function serializeGalleryItem(row: MediaRow): GalleryItem | null {
  return row.kind === 'video' ? serializeVideo(row) : serializeImage(row);
}

export function serializeCover(row: MediaRow | undefined): Cover | null {
  if (!row) return null;
  if (row.kind === 'video') {
    const video = serializeVideo(row);
    return video.poster ? { ...video.poster, alt: row.alt, width: row.width, height: row.height } : null;
  }
  const image = serializeImage(row);
  return image ? { sizes: image.sizes, og: image.og, alt: image.alt, width: image.width, height: image.height } : null;
}

export function serializeRegion(row: Pick<PropertyRow, 'region_id' | 'region_slug' | 'region_name' | 'region_name_hi'>): Region | null {
  if (!row.region_id || !row.region_slug || !row.region_name) return null;
  return { id: row.region_id, slug: row.region_slug, name: row.region_name, nameHi: row.region_name_hi || undefined };
}

function common(row: PropertyRow) {
  const region = serializeRegion(row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleHi: row.title_hi || undefined,
    type: row.type as PropertyCard['type'],
    status: row.status as PropertyCard['status'],
    visibility: row.visibility as PropertyCard['visibility'],
    featured: Boolean(row.featured),
    price: row.price,
    priceNote: row.price_note,
    location: region?.name ?? '',
    locationHi: region?.nameHi,
    region,
    area: row.area,
    areaUnit: row.area_unit as PropertyCard['areaUnit'],
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    summary: row.summary,
    summaryHi: row.summary_hi || undefined,
    updatedAt: row.updated_at,
  };
}

/** A listing as it appears in a grid. Only the cover photo is ever shown here. */
export function serializeCard(row: PropertyRow, media: MediaRow[]): PropertyCard {
  const gallery = media.filter((m) => m.role === 'cover' || m.role === 'gallery');
  return {
    ...common(row),
    cover: serializeCover(media.find((m) => m.role === 'cover') ?? gallery[0]),
    photoCount: gallery.filter((m) => m.kind === 'image').length,
    videoCount: gallery.filter((m) => m.kind === 'video').length,
  };
}

/**
 * The listing as the cached page renders it. When the listing is gated, every field that
 * would give away the location or show the photos is left empty; `locked` says so.
 */
export function serializeProperty(row: PropertyRow, media: MediaRow[], unlocked: boolean): Property {
  const locked = Boolean(row.gated) && !unlocked;
  const detail = serializeDetail(row, media);
  const gallery = media.filter((m) => m.role === 'cover' || m.role === 'gallery');
  return {
    ...common(row),
    locked,
    cover: serializeCover(media.find((m) => m.role === 'cover') ?? gallery[0]),
    photoCount: gallery.filter((m) => m.kind === 'image').length,
    videoCount: gallery.filter((m) => m.kind === 'video').length,
    description: row.description,
    descriptionHi: row.description_hi || undefined,
    details: parseJson(row.details, []),
    priceNote: row.price_note,
    createdAt: row.created_at,
    // Gated half: empty while locked, filled in by the client once a code is accepted.
    address: locked ? '' : detail.address,
    addressHi: locked ? undefined : detail.addressHi,
    latitude: locked ? null : detail.latitude,
    longitude: locked ? null : detail.longitude,
    nearby: locked ? [] : detail.nearby,
    gallery: locked ? [] : detail.gallery,
    plan: locked ? null : detail.plan,
    brochure: locked ? null : detail.brochure,
  };
}

/** Everything held back from a locked listing. */
export function serializeDetail(row: PropertyRow, media: MediaRow[], expiresAt = 0): UnlockedDetail {
  const plan = media.find((m) => m.role === 'plan');
  const brochure = media.find((m) => m.role === 'brochure');
  return {
    address: row.address,
    addressHi: row.address_hi || undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    nearby: parseJson(row.nearby, []),
    gallery: media
      .filter((m) => m.role === 'cover' || m.role === 'gallery')
      .map(serializeGalleryItem)
      .filter((item): item is GalleryItem => item !== null),
    plan: plan ? serializeImage(plan) : null,
    brochure: brochure ? serializeDocument(brochure) : null,
    expiresAt,
  };
}
