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

export interface Site {
  settings: Settings;
  hero: ImageMedia | null;
  portrait: ImageMedia | null;
  locations: string[];
  counts: Record<PropertyType | 'total', number>;
}
