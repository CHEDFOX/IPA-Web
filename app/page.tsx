import Link from 'next/link';
import { ArrowRight, Chat } from '@/components/Icons';
import { Picture } from '@/components/Picture';
import { CardGrid } from '@/components/PropertyCard';
import { Shell } from '@/components/Shell';
import { ContactBand } from '@/components/SiteChrome';
import { getListings, getSite } from '@/lib/api';
import { formatArea, mailtoHref, paragraphs, telHref, TYPE_BLURBS, TYPE_LABELS, whatsappHref } from '@/lib/format';
import type { PropertyType } from '@/lib/types';

export default async function HomePage() {
  const [site, listings] = await Promise.all([getSite(), getListings()]);
  const { settings } = site;
  const forSale = listings.filter((p) => p.status !== 'sold');
  const featured = forSale.filter((p) => p.featured);
  // Full rows of three: featured listings first, topped up with the newest others.
  const showcase = [...featured, ...forSale.filter((p) => !p.featured)].slice(0, featured.length > 3 ? 6 : 3);
  const heroProperty = featured.find((p) => p.cover) ?? forSale.find((p) => p.cover);
  const heroImage = site.hero ?? heroProperty?.cover ?? null;
  const wa = whatsappHref(settings, `Hello ${settings.siteName}, I'd like to ask about your properties.`);

  const types = (Object.keys(TYPE_LABELS) as PropertyType[])
    .map((type) => ({ type, cover: listings.find((p) => p.type === type && p.cover)?.cover }))
    .filter((t) => site.counts[t.type] > 0);

  const contacts = [
    settings.phone && { label: 'Phone', value: settings.phone, href: telHref(settings.phone) },
    settings.whatsapp && { label: 'WhatsApp', value: settings.whatsapp, href: whatsappHref(settings) },
    settings.email && { label: 'Email', value: settings.email, href: mailtoHref(settings.email) },
    settings.address && { label: 'Office', value: settings.address, href: '' },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  let section = 0;
  const number = () => String(++section).padStart(2, '0');

  return (
    <Shell settings={settings}>
      <section className="hero" aria-labelledby="hero-title">
        <div className={heroImage ? 'hero-frame' : 'hero-frame hero-plain'}>
          {heroImage && <Picture image={heroImage} alt="" sizes="100vw" priority />}
          {heroProperty && (
            <Link href={`/properties/${heroProperty.slug}`} className="hero-featured">
              <span className="label">Featured</span>
              <span>
                {heroProperty.title}
                {heroProperty.area !== null && ` · ${formatArea(heroProperty.area, heroProperty.areaUnit)}`}
              </span>
              <ArrowRight />
            </Link>
          )}
          <div className="hero-panel">
            <span className="label">
              {types.length ? types.map((t) => TYPE_LABELS[t.type]).join(' · ') : settings.tagline}
            </span>
            <h1 id="hero-title">{settings.heroTitle}</h1>
            {settings.heroText && <p>{settings.heroText}</p>}
            <div className="hero-actions">
              <Link className="btn btn-accent" href="/properties">
                View the portfolio <ArrowRight />
              </Link>
              {wa && (
                <a className="btn btn-ink-outline" href={wa} target="_blank" rel="noopener">
                  <Chat /> WhatsApp
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
              <span className="label">{number()} — Featured</span>
              <h2 id="featured-title" className="section-title">
                {featured.length ? 'Featured listings' : 'Latest listings'}
              </h2>
            </div>
            <Link className="text-link" href="/properties">
              View all {site.counts.total} properties <ArrowRight />
            </Link>
          </div>
          <CardGrid items={showcase} currency={settings.currency} />
        </section>
      )}

      {types.length > 1 && (
        <section className="wrap section" aria-labelledby="browse-title">
          <div className="section-head">
            <div>
              <span className="label">{number()} — Browse</span>
              <h2 id="browse-title" className="section-title">
                What are you looking for?
              </h2>
            </div>
          </div>
          <div className="type-grid">
            {types.map(({ type, cover }) => (
              <Link key={type} href={`/properties?type=${type}`} className="type-tile">
                {cover && <Picture image={cover} alt="" sizes="(max-width: 720px) 100vw, 440px" />}
                <span className="type-label">
                  <span>
                    <strong>{TYPE_LABELS[type]}</strong>
                    <small>
                      {TYPE_BLURBS[type]} · {site.counts[type]}
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
            <strong>New listings are on their way</strong>
            <span className="muted">Message us to hear about plots and homes before they are published.</span>
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
              <span className="label">{number()} — About</span>
              <h2 id="about-title">{settings.aboutTitle || `About ${settings.siteName}`}</h2>
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

      <ContactBand settings={settings} />
    </Shell>
  );
}
