import type { Metadata } from 'next';
import type { Formatter } from './format';
import { localeHref, type Dictionary, type Locale } from './i18n';
import type { Property, Settings } from './types';

/** Canonical address for this language plus links to the other language version. */
export function alternates(path: string, locale: Locale): Metadata['alternates'] {
  return {
    canonical: localeHref(locale, path),
    languages: { en: path, hi: localeHref('hi', path), 'x-default': path },
  };
}

/** Title, description and link-preview image for a (localized) property page. */
export function propertyMetadata(
  p: Property,
  settings: Settings,
  { locale, t, fmt, path, index = true }: { locale: Locale; t: Dictionary; fmt: Formatter; path: string; index?: boolean },
): Metadata {
  const facts = [fmt.sizeLine(p), p.location].filter(Boolean).join(', ');
  const previewTitle = facts ? `${p.title} · ${facts}` : p.title;
  const description = p.summary || [t.types[p.type], facts].filter(Boolean).join(' · ');
  const previewText = [description, fmt.price(p)].filter(Boolean).join(' · ');
  const images = p.cover ? [{ url: p.cover.og, width: 1200, height: 630, alt: p.title }] : undefined;
  return {
    title: p.title,
    description: previewText,
    alternates: index ? alternates(path, locale) : { canonical: localeHref(locale, path) },
    openGraph: {
      type: 'website',
      locale: t.ogLocale,
      siteName: settings.siteName,
      title: previewTitle,
      description: previewText,
      url: localeHref(locale, path),
      images,
    },
    twitter: { card: 'summary_large_image', title: previewTitle, description: previewText, images: images?.map((i) => i.url) },
    robots: index ? undefined : { index: false, follow: false },
  };
}
