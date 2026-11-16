// Shapes returned by the IPA backend API.

export type PropertyType = 'land' | 'residential' | 'commercial';
export type PropertyStatus = 'available' | 'under_offer' | 'sold';
export type Visibility = 'public' | 'unlisted' | 'draft';
export type AreaUnit = 'm2' | 'ha' | 'acre' | 'sqft' | 'sqyd' | 'bigha';

export interface ImageSize {
  url: string;
  width: number;
  height: number;
}

export interface ImageSet {
  sizes: ImageSize[];
  og: string;
}

export interface ImageMedia extends ImageSet {
  id: number;
  kind: 'image';
  alt: string;
  width: number | null;
  height: number | null;
}

export interface VideoMedia {
  id: number;
  kind: 'video';
  alt: string;
  url: string;
  mime: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  poster: ImageSet | null;
}

export interface DocumentMedia {
  id: number;
  kind: 'document';
  alt: string;
  url: string;
  mime: string;
  bytes: number;
  name: string;
}

export type GalleryItem = ImageMedia | VideoMedia;

export interface Cover extends ImageSet {
  alt: string;
  width: number | null;
  height: number | null;
}

// Hindi fields are optional: older backends don't send them, and empty means "use English".
export interface DetailRow {
  label: string;
  value: string;
  labelHi?: string;
  valueHi?: string;
  key: boolean;
}

export interface NearbyRow {
  place: string;
  placeHi?: string;
  distance: string;
}

export interface Region {
  id: number;
  slug: string;
  name: string;
  nameHi?: string;
}

export interface PropertyCard {
  id: number;
  slug: string;
  title: string;
  titleHi?: string;
  type: PropertyType;
  status: PropertyStatus;
  visibility: Visibility;
  featured: boolean;
  price: number | null;
  priceNote: string;
  location: string;
  locationHi?: string;
  /** The managed region this listing sits in; `location` is its name, kept for older callers. */
  region?: Region | null;
  area: number | null;
  areaUnit: AreaUnit;
  bedrooms: number | null;
  bathrooms: number | null;
  summary: string;
  summaryHi?: string;
  updatedAt: string;
  cover: Cover | null;
  photoCount: number;
  videoCount: number;
}

export interface Property extends Omit<PropertyCard, 'photoCount' | 'videoCount'> {
  /**
   * True while the photos, videos, map and exact address are withheld behind an access code.
   * The gated fields below are then empty, and arrive from /api/unlock once a code is entered.
   */
  locked?: boolean;
  photoCount?: number;
  videoCount?: number;
  address: string;
  addressHi?: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  descriptionHi?: string;
  details: DetailRow[];
  nearby: NearbyRow[];
  gallery: GalleryItem[];
  plan: ImageMedia | null;
  brochure: DocumentMedia | null;
  createdAt: string;
}

export interface Settings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroText: string;
  aboutTitle: string;
  aboutText: string;
  contactTitle: string;
  contactText: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  currency: string;
  instagram: string;
  facebook: string;
  footerNote: string;
  /** Shown on the locked card so visitors know who to ask for an access code. */
  unlockHelpText?: string;
  unlockHelpTextHi?: string;
  siteNameHi?: string;
  taglineHi?: string;
  heroTitleHi?: string;
  heroTextHi?: string;
  aboutTitleHi?: string;
  aboutTextHi?: string;
  contactTitleHi?: string;
  contactTextHi?: string;
  addressHi?: string;
  footerNoteHi?: string;
}

/** The gated half of a listing, served only to a visitor holding a live unlock. */
export interface UnlockedDetail {
  address: string;
  addressHi?: string;
  latitude: number | null;
  longitude: number | null;
  nearby: NearbyRow[];
  gallery: GalleryItem[];
  plan: ImageMedia | null;
  brochure: DocumentMedia | null;
  /** Epoch milliseconds at which the unlock lapses unless the visitor stays on the site. */
  expiresAt: number;
}

export interface Site {
  settings: Settings;
  hero: ImageMedia | null;
  portrait: ImageMedia | null;
  locations: string[];
  regions: Region[];
  counts: Record<PropertyType | 'total', number>;
}
