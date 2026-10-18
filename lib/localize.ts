import { DETAIL_LABELS_HI, STANDARD_TEXT_HI, type Locale } from './i18n';
import type { Property, PropertyCard, Settings } from './types';

const pick = (locale: Locale, english: string, hindi?: string) => (locale === 'hi' && hindi?.trim() ? hindi : english);

const SETTING_KEYS = [
  'siteName',
  'tagline',
  'heroTitle',
  'heroText',
  'aboutTitle',
  'aboutText',
  'contactTitle',
  'contactText',
  'address',
  'footerNote',
] as const;

/**
 * Site text in the visitor's language. On the Hindi site an empty Hindi box falls back to the
 * built-in Hindi version of the standard text, or to the owner's own English text.
 */
export function localizeSettings(settings: Settings, locale: Locale): Settings {
  if (locale === 'en') return settings;
  const out = { ...settings };
  for (const key of SETTING_KEYS) {
    const hindi = settings[`${key}Hi`];
    out[key] = hindi?.trim() ? hindi : (STANDARD_TEXT_HI[settings[key]] ?? settings[key]);
  }
  return out;
}

export function localizeCard<T extends PropertyCard>(p: T, locale: Locale): T {
  if (locale === 'en') return p;
  return {
    ...p,
    title: pick(locale, p.title, p.titleHi),
    summary: pick(locale, p.summary, p.summaryHi),
    location: pick(locale, p.location, p.locationHi),
  };
}

export function localizeProperty(p: Property, locale: Locale): Property {
  if (locale === 'en') return p;
  return {
    ...p,
    title: pick(locale, p.title, p.titleHi),
    summary: pick(locale, p.summary, p.summaryHi),
    location: pick(locale, p.location, p.locationHi),
    address: pick(locale, p.address, p.addressHi),
    description: pick(locale, p.description, p.descriptionHi),
    details: p.details.map((d) => ({
      ...d,
      label: pick(locale, DETAIL_LABELS_HI[d.label.trim().toLowerCase()] ?? d.label, d.labelHi),
      value: pick(locale, d.value, d.valueHi),
    })),
    nearby: p.nearby.map((n) => ({ ...n, place: pick(locale, n.place, n.placeHi) })),
  };
}
