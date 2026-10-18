import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PropertySkeleton } from '@/components/PropertySkeleton';
import { PropertyView } from '@/components/PropertyView';
import { Shell } from '@/components/Shell';
import { getListings, getProperty, getSite, PUBLIC_API_URL, SITE_URL } from '@/lib/api';
import { formatter } from '@/lib/format';
import { DICTIONARIES, localeHref, type Dictionary, type Locale } from '@/lib/i18n';
import { getDictionary, getLocale } from '@/lib/locale';
import { localizeCard, localizeProperty, localizeSettings } from '@/lib/localize';
import { propertyMetadata } from '@/lib/seo';
import type { PropertyCard, Settings } from '@/lib/types';

// Prebuild the listings that exist now (in both languages); new ones are built on their first visit.
// At least one entry is required, so an empty portfolio returns a placeholder that 404s.
export async function generateStaticParams() {
  const listings = await getListings();
  return listings.length ? listings.map((p) => ({ slug: p.slug })) : [{ slug: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/[lang]/properties/[slug]'>): Promise<Metadata> {
  const locale = await getLocale();
  const t = DICTIONARIES[locale];
  const { slug } = await params;
  const [property, site] = await Promise.all([getProperty(slug), getSite()]);
  if (!property) return { title: t.property.notFound, robots: { index: false } };
  const settings = localizeSettings(site.settings, locale);
  return propertyMetadata(localizeProperty(property, locale), settings, {
    locale,
    t,
    fmt: formatter(locale, settings.currency),
    path: `/properties/${property.slug}`,
  });
}

function relatedTo(slug: string, type: string, listings: PropertyCard[]) {
  const others = listings.filter((p) => p.slug !== slug);
  const sameType = others.filter((p) => p.type === type);
  return (sameType.length >= 3 ? sameType : [...sameType, ...others.filter((p) => p.type !== type)])
    .sort((a, b) => Number(a.status === 'sold') - Number(b.status === 'sold'))
    .slice(0, 3);
}

export default async function PropertyPage({ params }: PageProps<'/[lang]/properties/[slug]'>) {
  const { locale, t } = await getDictionary();
  const site = await getSite();
  const settings = localizeSettings(site.settings, locale);
  const { slug } = await params;
  return (
    <Shell settings={settings} locale={locale} t={t} path={`/properties/${slug}`}>
      <Suspense fallback={<PropertySkeleton label={t.property.loading} />}>
        <PropertyContent slug={slug} settings={settings} locale={locale} t={t} />
      </Suspense>
    </Shell>
  );
}

async function PropertyContent({ slug, settings, locale, t }: { slug: string; settings: Settings; locale: Locale; t: Dictionary }) {
  const [property, listings] = await Promise.all([getProperty(slug), getListings()]);
  if (!property) notFound();
  const path = `/properties/${property.slug}`;
  return (
    <PropertyView
      property={localizeProperty(property, locale)}
      settings={settings}
      locale={locale}
      t={t}
      fmt={formatter(locale, settings.currency)}
      pageUrl={`${SITE_URL}${localeHref(locale, path)}`}
      qrUrl={localeHref(locale, `${path}/qr`)}
      apiUrl={PUBLIC_API_URL}
      related={relatedTo(property.slug, property.type, listings).map((p) => localizeCard(p, locale))}
    />
  );
}
