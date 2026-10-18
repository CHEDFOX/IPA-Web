import Link from 'next/link';
import {
  areaInSquareMetres,
  formatArea,
  formatPrice,
  mailtoHref,
  mapsHref,
  osmEmbed,
  paragraphs,
  pricePerSquareMetre,
  telHref,
  TYPE_LABELS,
  whatsappHref,
} from '@/lib/format';
import type { Property, PropertyCard, Settings } from '@/lib/types';
import { EnquiryForm } from './EnquiryForm';
import { Gallery, ZoomImage } from './Gallery';
import { ArrowRight, ArrowUpRight, Chat, Download, Mail, Phone, Pin } from './Icons';
import { CardGrid, StatusBadge } from './PropertyCard';
import { ShareButton, ShareRow } from './ShareButtons';

interface Props {
  property: Property;
  settings: Settings;
  /** The address people should share: the public page, or the private link. */
  pageUrl: string;
  qrUrl: string;
  apiUrl: string;
  related?: PropertyCard[];
  notice?: string;
}

function keyFacts(p: Property) {
  const facts: { label: string; value: string; sub?: string }[] = [];
  if (p.area !== null) facts.push({ label: 'Area', value: formatArea(p.area, p.areaUnit), sub: areaInSquareMetres(p.area, p.areaUnit) });
  if (p.bedrooms) facts.push({ label: 'Bedrooms', value: String(p.bedrooms) });
  if (p.bathrooms) facts.push({ label: 'Bathrooms', value: String(p.bathrooms) });
  for (const d of p.details) if (d.key && d.value) facts.push({ label: d.label, value: d.value });
  return facts.slice(0, 4);
}

export function PropertyView({ property: p, settings, pageUrl, qrUrl, apiUrl, related = [], notice }: Props) {
  const currency = settings.currency;
  const facts = keyFacts(p);
  const details = p.details.filter((d) => d.label && d.value);
  const nearby = p.nearby.filter((n) => n.place);
  const hasMap = p.latitude !== null && p.longitude !== null;
  const typeLabel = TYPE_LABELS[p.type];
  const greeting = `Hello, I'm interested in ${p.title}: ${pageUrl}`;
  const wa = whatsappHref(settings, greeting);
  const tel = telHref(settings.phone);
  const mail = mailtoHref(settings.email, `Enquiry: ${p.title}`);
  const perM2 = p.type === 'land' ? pricePerSquareMetre(p, currency) : '';

  return (
    <div className="has-mobile-bar">
      <div className="wrap">
        {notice && (
          <p className="notice" role="note">
            {notice}
          </p>
        )}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href="/properties">Portfolio</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/properties?type=${p.type}`}>{typeLabel}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.title}</span>
        </nav>

        <div className="prop-head">
          <div className="prop-head-text">
            <div className="prop-meta">
              <StatusBadge status={p.status} outline />
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
            <ShareButton url={pageUrl} title={p.title} text={p.summary || undefined} />
            {p.brochure && (
              <a className="btn btn-outline btn-sm" href={p.brochure.url} target="_blank" rel="noopener">
                <Download /> Brochure (PDF)
              </a>
            )}
          </div>
        </div>

        <Gallery items={p.gallery} title={p.title} />

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
                <h2 id="about-title">About this {p.type === 'land' ? 'plot' : 'property'}</h2>
                <div className="prose">
                  {paragraphs(p.description).map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
              </section>
            )}

            {details.length > 0 && (
              <section className="block" aria-labelledby="details-title">
                <h2 id="details-title">{p.type === 'land' ? 'Land details' : 'Details'}</h2>
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
                <div className="block-head">
                  <h2 id="location-title">Location</h2>
                  {hasMap && (
                    <a className="text-link" href={mapsHref(p.latitude!, p.longitude!)} target="_blank" rel="noopener">
                      Open in Google Maps <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
                {p.plan && <ZoomImage image={p.plan} alt={p.plan.alt || `Site plan of ${p.title}`} caption="Site plan" />}
                {hasMap && (
                  <div className="map-frame">
                    <iframe
                      src={osmEmbed(p.latitude!, p.longitude!)}
                      title={`Map showing the location of ${p.title}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <span className="map-coords">
                      {p.latitude!.toFixed(4)}, {p.longitude!.toFixed(4)}
                    </span>
                  </div>
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

          <aside id="enquire" className="prop-aside" aria-label="Price and enquiry">
            <div className="enquire-card">
              <div className="price">
                <span className="label">{p.status === 'sold' ? 'Sold' : p.price === null ? 'Price' : 'Asking price'}</span>
                <span className="price-value">{formatPrice(p, currency)}</span>
                {(p.priceNote || perM2) && <span className="price-sub">{[p.priceNote, perM2].filter(Boolean).join(' · ')}</span>}
              </div>
              {(wa || tel || mail) && (
                <div className="contact-buttons">
                  {wa && (
                    <a className="btn btn-accent btn-block" href={wa} target="_blank" rel="noopener">
                      <Chat size={18} /> Ask on WhatsApp
                    </a>
                  )}
                  {(tel || mail) && (
                    <div className="pair">
                      {tel && (
                        <a className="btn btn-outline" href={tel}>
                          <Phone /> Call
                        </a>
                      )}
                      {mail && (
                        <a className="btn btn-outline" href={mail}>
                          <Mail /> Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="divider">{wa || tel || mail ? 'or send a message' : 'Send a message'}</div>
              <EnquiryForm apiUrl={apiUrl} propertyId={p.id} defaultMessage={`I'm interested in ${p.title}. When can I visit?`} />
            </div>
            <ShareRow url={pageUrl} title={p.title} qrUrl={qrUrl} />
          </aside>
        </div>

        {related.length > 0 && (
          <section className="section" aria-labelledby="related-title">
            <div className="section-head">
              <div>
                <h2 id="related-title" className="section-title">
                  More {typeLabel.toLowerCase()}
                </h2>
              </div>
              <Link className="text-link" href={`/properties?type=${p.type}`}>
                View all {typeLabel.toLowerCase()} <ArrowRight />
              </Link>
            </div>
            <CardGrid items={related} currency={currency} />
          </section>
        )}
      </div>

      {(wa || tel) && (
        <div className="mobile-bar">
          {wa ? (
            <a className="btn btn-accent grow" href={wa} target="_blank" rel="noopener">
              <Chat size={18} /> WhatsApp
            </a>
          ) : (
            <a className="btn btn-accent grow" href="#enquire">
              Send a message
            </a>
          )}
          {tel && (
            <a className="btn btn-outline round" href={tel} aria-label="Call">
              <Phone size={20} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
