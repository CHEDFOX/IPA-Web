'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { PropertyStatus, PropertyType } from '@/lib/types';
import { filterHref } from '@/lib/filters';
import { STATUS_LABELS } from '@/lib/format';

interface Props {
  type?: PropertyType;
  status?: PropertyStatus;
  location?: string;
  locations: string[];
}

export function FilterSelects({ type, status, location, locations }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (next: { status?: string; location?: string }) =>
    startTransition(() => router.push(filterHref({ type, status, location, ...next }), { scroll: false }));

  return (
    <div className="selects" aria-busy={pending}>
      <div className="select-field">
        <label htmlFor="filter-status">Status</label>
        <select id="filter-status" value={status ?? ''} onChange={(e) => go({ status: e.target.value })}>
          <option value="">Any status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {locations.length > 1 && (
        <div className="select-field">
          <label htmlFor="filter-location">Location</label>
          <select id="filter-location" value={location ?? ''} onChange={(e) => go({ location: e.target.value })}>
            <option value="">Any location</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
