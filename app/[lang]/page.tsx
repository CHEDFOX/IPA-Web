import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Chat } from '@/components/Icons';
import { Picture } from '@/components/Picture';
import { CardGrid } from '@/components/PropertyCard';
import { Shell } from '@/components/Shell';
import { ContactBand } from '@/components/SiteChrome';
import { getListings, getSite } from '@/lib/api';
import { TYPES } from '@/lib/filters';
import { formatter, mailtoHref, paragraphs, telHref, whatsappHref } from '@/lib/format';
import { fill, localeHref } from '@/lib/i18n';
import { getDictionary, getLocale } from '@/lib/locale';
import { localizeCard, localizeSettings } from '@/lib/localize';
import { alternates } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates('/', await getLocale()) };
}

export default async function HomePage() {
  const { locale, t } = await getDictionary();
  const [site, all] = await Promise.all([getSite(), getListings()]);
  const settings = localizeSettings(site.settings, locale);
  const listings = all.map((p) => localizeCard(p, locale));
  const fmt = formatter(locale, settings.currency);
  const href = (path: string) => localeHref(locale, path);

  const forSale = listings.filter((p) => p.status !== 'sold');
  const featured = forSale.filter((p) => p.featured);
  // Full rows of three: featured listings first, topped up with the newest others.
  const showcase = [...featured, ...forSale.filter((p) => !p.featured)].slice(0, featured.length > 3 ? 6 : 3);
  const heroProperty = featured.find((p) => p.cover) ?? forSale.find((p) => p.cover);
  const heroImage = site.hero ?? heroProperty?.cover ?? null;
  const wa = whatsappHref(settings, fill(t.greeting, { name: settings.siteName }));

  const types = TYPES.map((type) => ({ type, cover: listings.find((p) => p.type === type && p.cover)?.cover })).filter(
    (x) => site.counts[x.type] > 0,
  );

  const contacts = [
    settings.phone && { label: t.contact.phone, value: settings.phone, href: telHref(settings.phone) },
    settings.whatsapp && { label: t.contact.whatsapp, value: settings.whatsapp, href: whatsappHref(settings) },
    settings.email && { label: t.contact.email, value: settings.email, href: mailtoHref(settings.email) },
    settings.address && { label: t.contact.office, value: settings.address, href: '' },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  let section = 0;
  const number = () => String(++section).padStart(2, '0');

  return (
    <Shell settings={settings} locale={locale} t={t} path="/">
      <section className="hero" aria-labelledby="hero-title">
        <div className={heroImage ? 'hero-frame' : 'hero-frame hero-plain'}>
          {heroImage && <Picture image={heroImage} alt="" sizes="100vw" priority />}
          {heroProperty && (
            <Link href={href(`/properties/${heroProperty.slug}`)} className="hero-featured">
              <span className="label">{t.home.featured}</span>
              <span>
                {heroProperty.title}
                {heroProperty.area !== null && ` · ${fmt.area(heroProperty.area, heroProperty.areaUnit)}`}
              </span>
              <ArrowRight />
            </Link>
          )}
          <div className="hero-panel">
            <span className="label">{types.length ? types.map((x) => t.types[x.type]).join(' · ') : settings.tagline}</span>
            <h1 id="hero-title">{settings.heroTitle}</h1>
            {settings.heroText && <p>{settings.heroText}</p>}
            <div className="hero-actions">
              <Link className="btn btn-accent" href={href('/properties')}>
                {t.home.viewPortfolio} <ArrowRight />
              </Link>
              {wa && (
                <a className="btn btn-ink-outline" href={wa} target="_blank" rel="noopener">
                  <Chat /> {t.contact.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {showcase.length > 0 && (
        <section className="wrap section" aria-labelledby="featured-title">
          <div className="section-head">
            <div>
              <span className="label">
                {number()} — {t.home.featured}
              </span>
              <h2 id="featured-title" className="section-title">
                {featured.length ? t.home.featuredTitle : t.home.latestTitle}
              </h2>
            </div>
            <Link className="text-link" href={href('/properties')}>
              {fill(t.home.viewAll, { n: site.counts.total })} <ArrowRight />
            </Link>
          </div>
          <CardGrid items={showcase} locale={locale} t={t} fmt={fmt} />
        </section>
      )}

      {types.length > 1 && (
        <section className="wrap section" aria-labelledby="browse-title">
          <div className="section-head">
            <div>
              <span className="label">
                {number()} — {t.home.browse}
              </span>
              <h2 id="browse-title" className="section-title">
                {t.home.browseTitle}
              </h2>
            </div>
          </div>
          <div className="type-grid">
            {types.map(({ type, cover }) => (
              <Link key={type} href={href(`/properties?type=${type}`)} className="type-tile">
                {cover && <Picture image={cover} alt="" sizes="(max-width: 720px) 100vw, 440px" />}
                <span className="type-label">
                  <span>
                    <strong>{t.types[type]}</strong>
                    <small>
                      {t.typeBlurbs[type]} · {site.counts[type]}
                    </small>
                  </span>
                  <ArrowRight size={20} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {listings.length === 0 && (
        <section className="wrap section">
          <div className="empty-state">
            <strong>{t.home.emptyTitle}</strong>
            <span className="muted">{t.home.emptyText}</span>
          </div>
        </section>
      )}

      {settings.aboutText && (
        <section id="about" className="about" aria-labelledby="about-title">
          <div className="about-inner">
            {site.portrait && (
              <div className="portrait">
                <Picture image={site.portrait} alt={site.portrait.alt || settings.aboutTitle} sizes="(max-width: 720px) 100vw, 460px" />
              </div>
            )}
            <div className="about-text">
              <span className="label">
                {number()} — {t.home.about}
              </span>
              <h2 id="about-title">{settings.aboutTitle || fill(t.home.aboutFallback, { name: settings.siteName })}</h2>
              <div className="prose">
                {paragraphs(settings.aboutText).map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
              {contacts.length > 0 && (
                <dl className="contact-list">
                  {contacts.map((c) => (
                    <div key={c.label}>
                      <dt>{c.label}</dt>
                      <dd>
                        {c.href ? (
                          <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
                            {c.value}
                          </a>
                        ) : (
                          c.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </section>
      )}

      <ContactBand settings={settings} t={t} />
    </Shell>
  );
}
