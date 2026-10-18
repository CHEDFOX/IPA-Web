import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PropertySkeleton } from '@/components/PropertySkeleton';
import { PropertyView } from '@/components/PropertyView';
import { Shell } from '@/components/Shell';
import { getListings, getProperty, getSite, PUBLIC_API_URL, SITE_URL } from '@/lib/api';
import { propertyMetadata } from '@/lib/seo';
import type { PropertyCard, Site } from '@/lib/types';

// Prebuild the listings that exist now; new ones are built on their first visit.
// At least one entry is required, so an empty portfolio returns a placeholder that 404s.
export async function generateStaticParams() {
  const listings = await getListings();
  return listings.length ? listings.map((p) => ({ slug: p.slug })) : [{ slug: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/properties/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [property, site] = await Promise.all([getProperty(slug), getSite()]);
  if (!property) return { title: 'Property not found', robots: { index: false } };
  return propertyMetadata(property, site.settings, `/properties/${property.slug}`);
}

function relatedTo(slug: string, type: string, listings: PropertyCard[]) {
  const others = listings.filter((p) => p.slug !== slug);
  const sameType = others.filter((p) => p.type === type);
  return (sameType.length >= 3 ? sameType : [...sameType, ...others.filter((p) => p.type !== type)])
    .sort((a, b) => Number(a.status === 'sold') - Number(b.status === 'sold'))
    .slice(0, 3);
}

export default async function PropertyPage({ params }: PageProps<'/properties/[slug]'>) {
  const site = await getSite();
  return (
    <Shell settings={site.settings}>
      <Suspense fallback={<PropertySkeleton />}>
        <PropertyContent params={params} site={site} />
      </Suspense>
    </Shell>
  );
}

async function PropertyContent({ params, site }: Pick<PageProps<'/properties/[slug]'>, 'params'> & { site: Site }) {
  const { slug } = await params;
  const [property, listings] = await Promise.all([getProperty(slug), getListings()]);
  if (!property) notFound();
  return (
    <PropertyView
      property={property}
      settings={site.settings}
      pageUrl={`${SITE_URL}/properties/${property.slug}`}
      qrUrl={`/properties/${property.slug}/qr`}
      apiUrl={PUBLIC_API_URL}
      related={relatedTo(property.slug, property.type, listings)}
    />
  );
}
