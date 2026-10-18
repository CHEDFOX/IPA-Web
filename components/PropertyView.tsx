import Link from 'next/link';
import { mailtoHref, paragraphs, telHref, whatsappHref, type Formatter } from '@/lib/format';
import { fill, localeHref, type Dictionary, type Locale } from '@/lib/i18n';
import type { Property, PropertyCard, Settings } from '@/lib/types';
import { EnquiryForm } from './EnquiryForm';
import { Gallery, ZoomImage } from './Gallery';
import { ArrowRight, Chat, Download, Mail, Phone, Pin } from './Icons';
import { LocationMap } from './LocationMap';
import { CardGrid, StatusBadge } from './PropertyCard';
import { ShareButton, ShareRow } from './ShareButtons';

interface Props {
  /** Already localized (see lib/localize.ts), like settings and related. */
  property: Property;
  settings: Settings;
  locale: Locale;
  t: Dictionary;
  fmt: Formatter;
  /** The address people should share: the public page, or the private link. */
  pageUrl: string;
  qrUrl: string;
  apiUrl: string;
  related?: PropertyCard[];
  notice?: string;
}

function keyFacts(p: Property, t: Dictionary, fmt: Formatter) {
  const facts: { label: string; value: string; sub?: string }[] = [];
  if (p.area !== null) facts.push({ label: t.property.area, value: fmt.area(p.area, p.areaUnit), sub: fmt.areaCompared(p.area, p.areaUnit) });
  if (p.bedrooms) facts.push({ label: t.property.bedrooms, value: String(p.bedrooms) });
  if (p.bathrooms) facts.push({ label: t.property.bathrooms, value: String(p.bathrooms) });
  for (const d of p.details) if (d.key && d.value) facts.push({ label: d.label, value: d.value });
  return facts.slice(0, 4);
}

export function PropertyView({ property: p, settings, locale, t, fmt, pageUrl, qrUrl, apiUrl, related = [], notice }: Props) {
  const href = (path: string) => localeHref(locale, path);
  const facts = keyFacts(p, t, fmt);
  const details = p.details.filter((d) => d.label && d.value);
  const nearby = p.nearby.filter((n) => n.place);
  const hasMap = p.latitude !== null && p.longitude !== null;
  const typeLabel = t.types[p.type];
  const typePlural = t.typesPlural[p.type];
  const wa = whatsappHref(settings, fill(t.propertyGreeting, { title: p.title, url: pageUrl }));
  const tel = telHref(settings.phone);
  const mail = mailtoHref(settings.email, p.title);
  const perUnit = fmt.perUnit(p);
  const priceLabel = p.status === 'sold' ? t.property.sold : p.price === null ? t.property.price : t.property.askingPrice;

  return (
    <div className="has-mobile-bar">
      <div className="wrap">
        {notice && (
          <p className="notice" role="note">
            {notice}
          </p>
        )}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={href('/properties')}>{t.nav.portfolio}</Link>
          <span aria-hidden="true">/</span>
          <Link href={href(`/properties?type=${p.type}`)}>{typeLabel}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.title}</span>
        </nav>

        <div className="prop-head">
          <div className="prop-head-text">
            <div className="prop-meta">
              <StatusBadge status={p.status} t={t} outline />
              <span className="label">
                {typeLabel}
                {p.location && ` · ${p.location}`}
              </span>
            </div>
            <h1>{p.title}</h1>
            {p.address && (
              <span className="prop-address">
                <Pin /> {p.address}
              </span>
            )}
            {p.summary && <p className="prop-summary">{p.summary}</p>}
          </div>
          <div className="prop-actions">
            <ShareButton url={pageUrl} title={p.title} text={p.summary || undefined} labels={t.property} />
            {p.brochure && (
              <a className="btn btn-outline btn-sm" href={p.brochure.url} target="_blank" rel="noopener">
                <Download /> {t.property.brochure}
              </a>
            )}
          </div>
        </div>

        <Gallery items={p.gallery} title={p.title} labels={t.property} />

        <div className="prop-body">
          <div className="prop-main">
            {facts.length > 0 && (
              <dl className="facts">
                {facts.map((f) => (
                  <div className="fact" key={f.label}>
                    <dt>{f.label}</dt>
                    <dd className={f.value.length > 14 ? 'fact-value long' : 'fact-value'}>{f.value}</dd>
                    {f.sub && <dd className="fact-sub">{f.sub}</dd>}
                  </div>
                ))}
              </dl>
            )}

            {p.description && (
              <section className="block" aria-labelledby="about-title">
                <h2 id="about-title">{p.type === 'land' ? t.property.aboutPlot : t.property.aboutProperty}</h2>
                <div className="prose">
                  {paragraphs(p.description).map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
              </section>
            )}

            {details.length > 0 && (
              <section className="block" aria-labelledby="details-title">
                <h2 id="details-title">{p.type === 'land' ? t.property.landDetails : t.property.details}</h2>
                <dl className="details">
                  {details.map((d, i) => (
                    <div className="detail-row" key={i}>
                      <dt>{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {(hasMap || p.plan || nearby.length > 0) && (
              <section className="block" aria-labelledby="location-title">
                <h2 id="location-title">{t.property.location}</h2>
                {hasMap && (
                  <LocationMap
                    lat={p.latitude!}
                    lng={p.longitude!}
                    title={p.title}
                    locale={locale}
                    satellite={p.type === 'land'}
                    labels={t.property}
                  />
                )}
                {p.plan && (
                  <ZoomImage
                    image={p.plan}
                    alt={p.plan.alt || fill(t.property.sitePlanOf, { title: p.title })}
                    caption={t.property.sitePlan}
                    labels={t.property}
                  />
                )}
                {nearby.length > 0 && (
                  <ul className="nearby">
                    {nearby.map((n, i) => (
                      <li key={i}>
                        <span>{n.place}</span>
                        <span>{n.distance}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <aside id="enquire" className="prop-aside" aria-label={priceLabel}>
            <div className="enquire-card">
              <div className="price">
                <span className="label">{priceLabel}</span>
                <span className="price-value">{fmt.price(p)}</span>
                {(p.priceNote || perUnit) && <span className="price-sub">{[p.priceNote, perUnit].filter(Boolean).join(' · ')}</span>}
              </div>
              {(wa || tel || mail) && (
                <div className="contact-buttons">
                  {wa && (
                    <a className="btn btn-accent btn-block" href={wa} target="_blank" rel="noopener">
                      <Chat size={18} /> {t.property.askWhatsapp}
                    </a>
                  )}
                  {(tel || mail) && (
                    <div className="pair">
                      {tel && (
                        <a className="btn btn-outline" href={tel}>
                          <Phone /> {t.contact.call}
                        </a>
                      )}
                      {mail && (
                        <a className="btn btn-outline" href={mail}>
                          <Mail /> {t.contact.email}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="divider">{wa || tel || mail ? t.property.orMessage : t.property.sendMessage}</div>
              <EnquiryForm
                apiUrl={apiUrl}
                propertyId={p.id}
                defaultMessage={fill(t.enquiry.defaultMessage, { title: p.title })}
                labels={t.enquiry}
              />
            </div>
            <ShareRow url={pageUrl} title={p.title} qrUrl={qrUrl} labels={t.property} />
          </aside>
        </div>

        {related.length > 0 && (
          <section className="section" aria-labelledby="related-title">
            <div className="section-head">
              <div>
                <h2 id="related-title" className="section-title">
                  {fill(t.property.more, { type: typePlural })}
                </h2>
              </div>
              <Link className="text-link" href={href(`/properties?type=${p.type}`)}>
                {fill(t.property.viewAllType, { type: typePlural })} <ArrowRight />
              </Link>
            </div>
            <CardGrid items={related} locale={locale} t={t} fmt={fmt} />
          </section>
        )}
      </div>

      {(wa || tel) && (
        <div className="mobile-bar">
          {wa ? (
            <a className="btn btn-accent grow" href={wa} target="_blank" rel="noopener">
              <Chat size={18} /> {t.contact.whatsapp}
            </a>
          ) : (
            <a className="btn btn-accent grow" href="#enquire">
              {t.property.sendMessage}
            </a>
          )}
          {tel && (
            <a className="btn btn-outline round" href={tel} aria-label={t.contact.call}>
              <Phone size={20} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
