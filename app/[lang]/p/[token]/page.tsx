import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PropertySkeleton } from '@/components/PropertySkeleton';
import { PropertyView } from '@/components/PropertyView';
import { Shell } from '@/components/Shell';
import { getSharedProperty, getSite, PUBLIC_API_URL, SITE_URL } from '@/lib/api';
import { formatter } from '@/lib/format';
import { DICTIONARIES, localeHref, type Dictionary, type Locale } from '@/lib/i18n';
import { getDictionary, getLocale } from '@/lib/locale';
import { localizeProperty, localizeSettings } from '@/lib/localize';
import { propertyMetadata } from '@/lib/seo';
import type { Settings } from '@/lib/types';

// Private links are never listed or prebuilt; each is rendered on its first visit.
export function generateStaticParams() {
  return [{ token: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/[lang]/p/[token]'>): Promise<Metadata> {
  const locale = await getLocale();
  const t = DICTIONARIES[locale];
  const { token } = await params;
  const [property, site] = await Promise.all([getSharedProperty(token), getSite()]);
  if (!property) return { title: t.property.linkNotFound, robots: { index: false, follow: false } };
  const settings = localizeSettings(site.settings, locale);
  // Link previews still work; search engines are told not to index the page.
  return propertyMetadata(localizeProperty(property, locale), settings, {
    locale,
    t,
    fmt: formatter(locale, settings.currency),
    path: `/p/${token}`,
    index: false,
  });
}

export default async function PrivatePropertyPage({ params }: PageProps<'/[lang]/p/[token]'>) {
  const { locale, t } = await getDictionary();
  const site = await getSite();
  const settings = localizeSettings(site.settings, locale);
  const { token } = await params;
  return (
    <Shell settings={settings} locale={locale} t={t} path={`/p/${token}`}>
      <Suspense fallback={<PropertySkeleton label={t.property.loading} />}>
        <PrivateContent token={token} settings={settings} locale={locale} t={t} />
      </Suspense>
    </Shell>
  );
}

async function PrivateContent({ token, settings, locale, t }: { token: string; settings: Settings; locale: Locale; t: Dictionary }) {
  const property = await getSharedProperty(token);
  if (!property) notFound();
  const notices = { public: undefined, unlisted: t.property.privateNotice, draft: t.property.draftNotice };
  return (
    <PropertyView
      property={localizeProperty(property, locale)}
      settings={settings}
      locale={locale}
      t={t}
      fmt={formatter(locale, settings.currency)}
      pageUrl={`${SITE_URL}${localeHref(locale, `/p/${token}`)}`}
      qrUrl={localeHref(locale, `/p/${token}/qr`)}
      apiUrl={PUBLIC_API_URL}
      notice={notices[property.visibility]}
    />
  );
}
