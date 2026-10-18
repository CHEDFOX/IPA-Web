import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FilterSelects } from '@/components/Filters';
import { CardGrid } from '@/components/PropertyCard';
import { Shell } from '@/components/Shell';
import { ContactBand } from '@/components/SiteChrome';
import { getListings, getSite } from '@/lib/api';
import { filterHref, pick, STATUSES, TYPES } from '@/lib/filters';
import { formatter } from '@/lib/format';
import { DICTIONARIES, fill, localeHref, type Dictionary, type Locale } from '@/lib/i18n';
import { getDictionary, getLocale } from '@/lib/locale';
import { localizeCard, localizeSettings } from '@/lib/localize';
import { alternates } from '@/lib/seo';
import type { Settings, Site } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = DICTIONARIES[locale];
  return { title: t.portfolio.title, description: t.portfolio.metaDescription, alternates: alternates('/properties', locale) };
}

export default async function PortfolioPage({ searchParams }: PageProps<'/[lang]/properties'>) {
  const { locale, t } = await getDictionary();
  const site = await getSite();
  const settings = localizeSettings(site.settings, locale);
  return (
    <Shell settings={settings} locale={locale} t={t} path="/properties" current="portfolio">
      <section className="wrap page-intro">
        <span className="label">{t.portfolio.kicker}</span>
        <h1>{t.portfolio.title}</h1>
        <p>{t.portfolio.intro}</p>
      </section>
      <div className="wrap">
        {/* Filters come from the URL, which is only known per request. */}
        <Suspense fallback={<p className="result-count">{t.portfolio.loading}</p>}>
          <Results searchParams={searchParams} site={site} settings={settings} locale={locale} t={t} />
        </Suspense>
      </div>
      <ContactBand settings={settings} t={t} title={t.portfolio.notRight} />
    </Shell>
  );
}

interface ResultsProps extends Pick<PageProps<'/[lang]/properties'>, 'searchParams'> {
  site: Site;
  settings: Settings;
  locale: Locale;
  t: Dictionary;
}

async function Results({ searchParams, site, settings, locale, t }: ResultsProps) {
  const query = await searchParams;
  const basePath = localeHref(locale, '/properties');
  const type = pick(query.type, TYPES);
  const status = pick(query.status, STATUSES);
  const location = pick(query.location, site.locations);
  const all = await getListings();
  // Filter values stay in English (they are in the URL); the dropdown shows Hindi names when entered.
  const locationNames = new Map(all.map((p) => [p.location, localizeCard(p, locale).location]));
  const items = all
    .filter((p) => (!type || p.type === type) && (!status || p.status === status) && (!location || p.location === location))
    .map((p) => localizeCard(p, locale));
  const fmt = formatter(locale, settings.currency);

  return (
    <>
      <div className="filters">
        <nav className="chips" aria-label={t.portfolio.typeLabel}>
          {[undefined, ...TYPES].map((x) => (
            <Link
              key={x ?? 'all'}
              href={filterHref(basePath, { type: x, status, location })}
              className="chip"
              aria-current={x === type ? 'page' : undefined}
              scroll={false}
            >
              {x ? t.types[x] : t.portfolio.all}
            </Link>
          ))}
        </nav>
        <FilterSelects
          basePath={basePath}
          type={type}
          status={status}
          location={location}
          locations={site.locations.map((value) => ({ value, label: locationNames.get(value) ?? value }))}
          labels={t.portfolio}
          statusLabels={t.status}
        />
      </div>
      <p className="result-count" aria-live="polite">
        {items.length === 1 ? t.portfolio.countOne : fill(t.portfolio.countMany, { n: items.length })}
      </p>
      {items.length ? (
        <CardGrid items={items} locale={locale} t={t} fmt={fmt} />
      ) : (
        <div className="empty-state">
          <strong>{all.length ? t.portfolio.noMatch : t.home.emptyTitle}</strong>
          <span className="muted">{all.length ? t.portfolio.noMatchText : t.home.emptyText}</span>
          {all.length > 0 && (
            <Link className="btn btn-outline btn-sm" href={basePath}>
              {t.portfolio.showAll}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
