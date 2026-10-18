import type { AreaUnit, Property, PropertyCard, PropertyStatus, PropertyType, Settings } from './types';

export const TYPE_LABELS: Record<PropertyType, string> = {
  land: 'Land',
  residential: 'Residential',
  commercial: 'Commercial',
};

export const TYPE_BLURBS: Record<PropertyType, string> = {
  land: 'Plots, farmland, development land',
  residential: 'Villas, houses, apartments',
  commercial: 'Offices, retail, sites',
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Available',
  under_offer: 'Under offer',
  sold: 'Sold',
};

const UNIT_SUFFIX: Record<AreaUnit, string> = { m2: 'm²', ha: 'ha', acre: 'acres', sqft: 'sq ft' };
const SQUARE_METRES: Record<AreaUnit, number> = { m2: 1, ha: 10_000, acre: 4046.8564224, sqft: 0.09290304 };

const number = (n: number, digits = 2) => new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(n);

export function formatArea(area: number | null, unit: AreaUnit): string {
  if (area === null) return '';
  return `${number(area)} ${area === 1 && unit === 'acre' ? 'acre' : UNIT_SUFFIX[unit]}`;
}

/** The same area in square metres, when the listing uses another unit. */
export function areaInSquareMetres(area: number | null, unit: AreaUnit): string {
  if (area === null || unit === 'm2') return '';
  return `${number(area * SQUARE_METRES[unit], 0)} m²`;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount < 100 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${number(amount)}`;
  }
}

export function formatPrice(p: Pick<PropertyCard, 'price'>, currency: string): string {
  return p.price === null ? 'Price on request' : formatMoney(p.price, currency);
}

export function pricePerSquareMetre(p: Pick<Property, 'price' | 'area' | 'areaUnit'>, currency: string): string {
  if (p.price === null || p.area === null || p.price === 0) return '';
  const perM2 = p.price / (p.area * SQUARE_METRES[p.areaUnit]);
  return `≈ ${formatMoney(perM2, currency)} per m²`;
}

/** Short size line for cards: "2.4 ha" or "5 bed · 420 m²". */
export function sizeLine(p: Pick<PropertyCard, 'area' | 'areaUnit' | 'bedrooms'>): string {
  const parts = [];
  if (p.bedrooms) parts.push(`${p.bedrooms} bed`);
  if (p.area !== null) parts.push(formatArea(p.area, p.areaUnit));
  return parts.join(' · ');
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- contact links

const digits = (phone: string) => phone.replace(/[^\d]/g, '');

export function telHref(phone: string): string {
  const d = digits(phone);
  return d ? `tel:${phone.trim().startsWith('+') ? '+' : ''}${d}` : '';
}

export function whatsappHref(settings: Pick<Settings, 'whatsapp'>, message?: string): string {
  const d = digits(settings.whatsapp);
  if (!d) return '';
  return `https://wa.me/${d}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function mailtoHref(email: string, subject?: string): string {
  if (!email) return '';
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}

export function mapsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** OpenStreetMap embed centred on the point, roughly 1 km across. */
export function osmEmbed(lat: number, lng: number): string {
  const dLat = 0.006;
  const dLng = 0.006 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(5)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
