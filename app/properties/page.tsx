import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FilterSelects } from '@/components/Filters';
import { CardGrid } from '@/components/PropertyCard';
import { Shell } from '@/components/Shell';
import { ContactBand } from '@/components/SiteChrome';
import { getListings, getSite } from '@/lib/api';
import { filterHref, pick, STATUSES, TYPES } from '@/lib/filters';
import { TYPE_LABELS } from '@/lib/format';
import type { Site } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'All plots, homes and commercial sites in the portfolio, with photos, video, maps and details.',
  alternates: { canonical: '/properties' },
};

export default async function PortfolioPage({ searchParams }: PageProps<'/properties'>) {
  const site = await getSite();
  return (
    <Shell settings={site.settings} current="portfolio">
      <section className="wrap page-intro">
        <span className="label">Portfolio</span>
        <h1>All properties</h1>
        <p>Open any property for photos, video, the map and full details.</p>
      </section>
      <div className="wrap">
        {/* Filters come from the URL, which is only known per request. */}
        <Suspense fallback={<p className="result-count">Loading properties…</p>}>
          <Results searchParams={searchParams} site={site} />
        </Suspense>
      </div>
      <ContactBand settings={site.settings} title="Not seeing the right one?" />
    </Shell>
  );
}

async function Results({ searchParams, site }: Pick<PageProps<'/properties'>, 'searchParams'> & { site: Site }) {
  const query = await searchParams;
  const type = pick(query.type, TYPES);
  const status = pick(query.status, STATUSES);
  const location = pick(query.location, site.locations);
  const listings = await getListings();
  const items = listings.filter(
    (p) => (!type || p.type === type) && (!status || p.status === status) && (!location || p.location === location),
  );

  return (
    <>
      <div className="filters">
        <nav className="chips" aria-label="Property type">
          {[undefined, ...TYPES].map((t) => (
            <Link
              key={t ?? 'all'}
              href={filterHref({ type: t, status, location })}
              className="chip"
              aria-current={t === type ? 'page' : undefined}
              scroll={false}
            >
              {t ? TYPE_LABELS[t] : 'All'}
            </Link>
          ))}
        </nav>
        <FilterSelects type={type} status={status} location={location} locations={site.locations} />
      </div>
      <p className="result-count" aria-live="polite">
        {items.length === 1 ? '1 property' : `${items.length} properties`}
      </p>
      {items.length ? (
        <CardGrid items={items} currency={site.settings.currency} />
      ) : (
        <div className="empty-state">
          <strong>{listings.length ? 'No properties match these filters' : 'New listings are on their way'}</strong>
          <span className="muted">
            {listings.length ? 'Try another type or status, or message us what you are looking for.' : 'Message us to hear about new plots and homes first.'}
          </span>
          {listings.length > 0 && (
            <Link className="btn btn-outline btn-sm" href="/properties">
              Show all properties
            </Link>
          )}
        </div>
      )}
    </>
  );
}
