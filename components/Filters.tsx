'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { filterHref } from '@/lib/filters';
import type { Dictionary } from '@/lib/i18n';
import type { PropertyStatus, PropertyType } from '@/lib/types';

interface Props {
  /** /properties or /hi/properties */
  basePath: string;
  type?: PropertyType;
  status?: PropertyStatus;
  location?: string;
  /** Location filter values with their display names in this language. */
  locations: { value: string; label: string }[];
  labels: Dictionary['portfolio'];
  statusLabels: Dictionary['status'];
}

export function FilterSelects({ basePath, type, status, location, locations, labels, statusLabels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (next: { status?: string; location?: string }) =>
    startTransition(() => router.push(filterHref(basePath, { type, status, location, ...next }), { scroll: false }));

  return (
    <div className="selects" aria-busy={pending}>
      <div className="select-field">
        <label htmlFor="filter-status">{labels.status}</label>
        <select id="filter-status" value={status ?? ''} onChange={(e) => go({ status: e.target.value })}>
          <option value="">{labels.anyStatus}</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {locations.length > 1 && (
        <div className="select-field">
          <label htmlFor="filter-location">{labels.location}</label>
          <select id="filter-location" value={location ?? ''} onChange={(e) => go({ location: e.target.value })}>
            <option value="">{labels.anyLocation}</option>
            {locations.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
