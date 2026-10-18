import type { Metadata } from 'next';
import { formatPrice, sizeLine, TYPE_LABELS } from './format';
import type { Property, Settings } from './types';

/** Title, description and link-preview image for a property page. */
export function propertyMetadata(p: Property, settings: Settings, path: string, { index = true } = {}): Metadata {
  const facts = [sizeLine(p), p.location].filter(Boolean).join(', ');
  const previewTitle = facts ? `${p.title} · ${facts}` : p.title;
  const description = p.summary || [TYPE_LABELS[p.type], facts].filter(Boolean).join(' · ');
  const previewText = [description, formatPrice(p, settings.currency)].filter(Boolean).join(' · ');
  const images = p.cover ? [{ url: p.cover.og, width: 1200, height: 630, alt: p.title }] : undefined;
  return {
    title: p.title,
    description: previewText,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      title: previewTitle,
      description: previewText,
      url: path,
      images,
    },
    twitter: { card: 'summary_large_image', title: previewTitle, description: previewText, images: images?.map((i) => i.url) },
    robots: index ? undefined : { index: false, follow: false },
  };
}
