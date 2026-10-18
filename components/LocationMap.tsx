'use client';

import { useState } from 'react';
import { directionsHref, earthHref, mapEmbedSrc, mapsHref } from '@/lib/format';
import { fill, type Dictionary, type Locale } from '@/lib/i18n';
import { ArrowUpRight, LinkIcon, Pin } from './Icons';

interface Props {
  lat: number;
  lng: number;
  title: string;
  locale: Locale;
  /** Satellite first suits land; the street map suits homes and offices. */
  satellite: boolean;
  labels: Dictionary['property'];
}

export function LocationMap({ lat, lng, title, locale, satellite, labels }: Props) {
  const [view, setView] = useState<'m' | 'k'>(satellite ? 'k' : 'm');
  const [copied, setCopied] = useState(false);
  const coords = `${lat}, ${lng}`;

  async function copyCoords() {
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(labels.copyCoords, coords);
    }
  }

  return (
    <div className="map-block">
      <div className="map-frame">
        <iframe
          key={view}
          src={mapEmbedSrc(lat, lng, view, locale)}
          title={fill(labels.mapTitle, { title })}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div className="map-views" role="group" aria-label={labels.location}>
          <button type="button" aria-pressed={view === 'm'} onClick={() => setView('m')}>
            {labels.map}
          </button>
          <button type="button" aria-pressed={view === 'k'} onClick={() => setView('k')}>
            {labels.satellite}
          </button>
        </div>
      </div>
      <div className="map-actions">
        <button type="button" className="map-coords" onClick={copyCoords} title={labels.copyCoords}>
          <Pin size={14} /> {lat.toFixed(6)}, {lng.toFixed(6)}
          <span className="map-copy" aria-live="polite">
            <LinkIcon size={13} /> {copied ? labels.copied : labels.copyCoords}
          </span>
        </button>
        <span className="map-links">
          <a className="btn btn-outline btn-sm" href={mapsHref(lat, lng)} target="_blank" rel="noopener">
            {labels.openMaps} <ArrowUpRight size={14} />
          </a>
          <a className="btn btn-outline btn-sm" href={earthHref(lat, lng)} target="_blank" rel="noopener">
            {labels.openEarth} <ArrowUpRight size={14} />
          </a>
          <a className="btn btn-outline btn-sm" href={directionsHref(lat, lng)} target="_blank" rel="noopener">
            {labels.directions} <ArrowUpRight size={14} />
          </a>
        </span>
      </div>
    </div>
  );
}
