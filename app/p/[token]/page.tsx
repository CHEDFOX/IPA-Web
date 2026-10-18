import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PropertySkeleton } from '@/components/PropertySkeleton';
import { PropertyView } from '@/components/PropertyView';
import { Shell } from '@/components/Shell';
import { getSharedProperty, getSite, PUBLIC_API_URL, SITE_URL } from '@/lib/api';
import { propertyMetadata } from '@/lib/seo';
import type { Site } from '@/lib/types';

// Private links are never listed or prebuilt; each is rendered on its first visit.
export function generateStaticParams() {
  return [{ token: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/p/[token]'>): Promise<Metadata> {
  const { token } = await params;
  const [property, site] = await Promise.all([getSharedProperty(token), getSite()]);
  if (!property) return { title: 'Link not found', robots: { index: false, follow: false } };
  // Link previews still work; search engines are told not to index the page.
  return propertyMetadata(property, site.settings, `/p/${token}`, { index: false });
}

const NOTICES = {
  public: undefined,
  unlisted: 'Private listing: only people with this link can see it.',
  draft: 'Draft preview: this listing is not published yet. Only people with this link can see it.',
};

export default async function PrivatePropertyPage({ params }: PageProps<'/p/[token]'>) {
  const site = await getSite();
  return (
    <Shell settings={site.settings}>
      <Suspense fallback={<PropertySkeleton />}>
        <PrivateContent params={params} site={site} />
      </Suspense>
    </Shell>
  );
}

async function PrivateContent({ params, site }: Pick<PageProps<'/p/[token]'>, 'params'> & { site: Site }) {
  const { token } = await params;
  const property = await getSharedProperty(token);
  if (!property) notFound();
  return (
    <PropertyView
      property={property}
      settings={site.settings}
      pageUrl={`${SITE_URL}/p/${token}`}
      qrUrl={`/p/${token}/qr`}
      apiUrl={PUBLIC_API_URL}
      notice={NOTICES[property.visibility]}
    />
  );
}
