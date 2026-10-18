import { DICTIONARIES, fill, type Locale } from './i18n';
import type { AreaUnit, Property, PropertyCard, Settings } from './types';

const UNIT_LABELS: Record<AreaUnit, Record<Locale, string>> = {
  m2: { en: 'm²', hi: 'वर्ग मी.' },
  ha: { en: 'ha', hi: 'हेक्टेयर' },
  acre: { en: 'acres', hi: 'एकड़' },
  sqft: { en: 'sq ft', hi: 'वर्ग फुट' },
  sqyd: { en: 'sq yd', hi: 'गज' },
  bigha: { en: 'bigha', hi: 'बीघा' },
};

// Square metres per unit. Bigha differs from state to state, so it is never converted.
const SQUARE_METRES: Partial<Record<AreaUnit, number>> = {
  m2: 1,
  ha: 10_000,
  acre: 4046.8564224,
  sqft: 0.09290304,
  sqyd: 0.83612736,
};

// The familiar comparison shown under an area, e.g. "2.4 ha" with "5.93 acres" below.
const COMPARE_WITH: Partial<Record<AreaUnit, AreaUnit>> = { m2: 'sqft', sqft: 'sqyd', sqyd: 'sqft', acre: 'sqft', ha: 'acre' };

// In rupees, price per unit is quoted per sq ft, per gaj, per acre or per bigha.
const INR_PRICE_UNIT: Record<AreaUnit, AreaUnit> = { m2: 'sqft', sqft: 'sqft', sqyd: 'sqyd', acre: 'acre', ha: 'acre', bigha: 'bigha' };

function convert(area: number, from: AreaUnit, to: AreaUnit): number | null {
  const a = SQUARE_METRES[from];
  const b = SQUARE_METRES[to];
  return a && b ? (area * a) / b : null;
}

/** Number, price and area formatting for one language and currency. */
export function formatter(locale: Locale, currency: string) {
  const t = DICTIONARIES[locale];
  const inr = currency === 'INR';
  const grouping = inr ? 'en-IN' : 'en';
  const num = (n: number, digits = 2) => new Intl.NumberFormat(grouping, { maximumFractionDigits: digits }).format(n);

  function money(amount: number): string {
    if (inr) {
      // 1 lakh = 1,00,000 and 1 crore = 1,00,00,000
      if (amount >= 1e7) return `₹${num(amount / 1e7)} ${locale === 'hi' ? 'करोड़' : 'Cr'}`;
      if (amount >= 1e5) return `₹${num(amount / 1e5)} ${locale === 'hi' ? 'लाख' : 'Lakh'}`;
      return `₹${num(amount, amount < 100 ? 2 : 0)}`;
    }
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        maximumFractionDigits: amount < 100 ? 2 : 0,
      }).format(amount);
    } catch {
      return `${currency} ${num(amount)}`;
    }
  }

  function unitLabel(unit: AreaUnit, amount?: number): string {
    if (locale === 'en' && unit === 'acre' && amount === 1) return 'acre';
    return UNIT_LABELS[unit][locale];
  }

  function area(value: number | null, unit: AreaUnit): string {
    return value === null ? '' : `${num(value)} ${unitLabel(unit, value)}`;
  }

  /** The same area in a more familiar unit, or '' when there is none (bigha). */
  function areaCompared(value: number | null, unit: AreaUnit): string {
    const target = COMPARE_WITH[unit];
    if (value === null || !target) return '';
    const converted = convert(value, unit, target);
    return converted === null ? '' : `${num(converted, converted < 10 ? 2 : 0)} ${unitLabel(target, converted)}`;
  }

  function price(p: Pick<PropertyCard, 'price'>): string {
    return p.price === null ? t.priceOnRequest : money(p.price);
  }

  function perUnit(p: Pick<Property, 'price' | 'area' | 'areaUnit' | 'type'>): string {
    if (!p.price || !p.area) return '';
    if (!inr && p.type !== 'land') return '';
    let unit: AreaUnit = inr ? INR_PRICE_UNIT[p.areaUnit] : SQUARE_METRES[p.areaUnit] ? 'm2' : p.areaUnit;
    let quantity = unit === p.areaUnit ? p.area : convert(p.area, p.areaUnit, unit);
    if (quantity === null) {
      unit = p.areaUnit;
      quantity = p.area;
    }
    const label = unit === 'acre' && locale === 'en' ? 'acre' : unitLabel(unit);
    return `≈ ${money(p.price / quantity)} ${t.per} ${label}`;
  }

  /** Short size line for cards: "2.4 ha" or "5 bed · 420 m²". */
  function sizeLine(p: Pick<PropertyCard, 'area' | 'areaUnit' | 'bedrooms'>): string {
    const parts = [];
    if (p.bedrooms) parts.push(fill(t.bed, { n: p.bedrooms }));
    if (p.area !== null) parts.push(area(p.area, p.areaUnit));
    return parts.join(' · ');
  }

  return { money, area, areaCompared, price, perUnit, sizeLine };
}

export type Formatter = ReturnType<typeof formatter>;

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

/** Google Earth (3D satellite view), with a pin at the exact point. */
export function earthHref(lat: number, lng: number): string {
  return `https://earth.google.com/web/search/${lat},${lng}`;
}

export function directionsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Google Maps embed (no API key needed); "k" is the satellite view. */
export function mapEmbedSrc(lat: number, lng: number, view: 'm' | 'k', locale: Locale): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&t=${view}&z=17&hl=${locale}&output=embed`;
}
