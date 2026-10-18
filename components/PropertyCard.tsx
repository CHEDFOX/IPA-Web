import Link from 'next/link';
import type { Formatter } from '@/lib/format';
import { localeHref, type Dictionary, type Locale } from '@/lib/i18n';
import type { PropertyCard as Card, PropertyStatus } from '@/lib/types';
import { Play } from './Icons';
import { Picture } from './Picture';

export function StatusBadge({ status, t, outline = false }: { status: PropertyStatus; t: Dictionary; outline?: boolean }) {
  return (
    <span className={outline ? 'badge badge-outline' : 'badge'}>
      <span className="badge-dot" data-status={status} />
      {t.status[status]}
    </span>
  );
}

interface CardProps {
  /** Already localized (see lib/localize.ts). */
  property: Card;
  locale: Locale;
  t: Dictionary;
  fmt: Formatter;
}

export function PropertyCard({ property: p, locale, t, fmt }: CardProps) {
  return (
    <Link href={localeHref(locale, `/properties/${p.slug}`)} className="card" data-status={p.status}>
      <div className="card-media">
        {p.cover ? (
          <Picture image={p.cover} alt="" sizes="(max-width: 720px) 100vw, (max-width: 1120px) 50vw, 440px" />
        ) : (
          <span className="no-photo">{t.property.photosSoon}</span>
        )}
        <StatusBadge status={p.status} t={t} />
        {p.videoCount > 0 && (
          <span className="media-count">
            <Play size={10} /> {t.property.video}
          </span>
        )}
      </div>
      <div className="card-text">
        <span className="card-kicker">
          {t.types[p.type]}
          {p.location && ` · ${p.location}`}
        </span>
        <span className="card-title">{p.title}</span>
      </div>
      <div className="card-foot">
        <span>{fmt.sizeLine(p) || '—'}</span>
        <span>{fmt.price(p)}</span>
      </div>
    </Link>
  );
}

export function CardGrid({ items, ...rest }: Omit<CardProps, 'property'> & { items: Card[] }) {
  return (
    <div className="card-grid">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} {...rest} />
      ))}
    </div>
  );
}
