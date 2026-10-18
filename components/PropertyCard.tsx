import Link from 'next/link';
import { formatPrice, sizeLine, STATUS_LABELS, TYPE_LABELS } from '@/lib/format';
import type { PropertyCard as Card, PropertyStatus } from '@/lib/types';
import { Play } from './Icons';
import { Picture } from './Picture';

export function StatusBadge({ status, outline = false }: { status: PropertyStatus; outline?: boolean }) {
  return (
    <span className={outline ? 'badge badge-outline' : 'badge'}>
      <span className="badge-dot" data-status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PropertyCard({ property: p, currency }: { property: Card; currency: string }) {
  return (
    <Link href={`/properties/${p.slug}`} className="card" data-status={p.status}>
      <div className="card-media">
        {p.cover ? (
          <Picture image={p.cover} alt="" sizes="(max-width: 720px) 100vw, (max-width: 1120px) 50vw, 440px" />
        ) : (
          <span className="no-photo">Photos coming soon</span>
        )}
        <StatusBadge status={p.status} />
        {p.videoCount > 0 && (
          <span className="media-count">
            <Play size={10} /> Video
          </span>
        )}
      </div>
      <div className="card-text">
        <span className="card-kicker">
          {TYPE_LABELS[p.type]}
          {p.location && ` · ${p.location}`}
        </span>
        <span className="card-title">{p.title}</span>
      </div>
      <div className="card-foot">
        <span>{sizeLine(p) || '—'}</span>
        <span>{formatPrice(p, currency)}</span>
      </div>
    </Link>
  );
}

export function CardGrid({ items, currency }: { items: Card[]; currency: string }) {
  return (
    <div className="card-grid">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} currency={currency} />
      ))}
    </div>
  );
}
