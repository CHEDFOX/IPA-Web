'use client';

import { useActionState, useState } from 'react';
import { saveProperty, type ActionState } from '../actions';

export interface PropertyFormValues {
  id?: number;
  title: string;
  title_hi: string;
  region_id: number | null;
  type: string;
  status: string;
  visibility: string;
  featured: number;
  gated: number;
  sort_order: number;
  price: number | null;
  price_note: string;
  price_note_hi: string;
  address: string;
  address_hi: string;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  area_unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  summary: string;
  summary_hi: string;
  description: string;
  description_hi: string;
  details: string;
  nearby: string;
}

interface Detail {
  label: string;
  value: string;
  key?: boolean;
}
interface Nearby {
  place: string;
  distance: string;
}

const AREA_UNITS = [
  ['m2', 'm²'],
  ['sqft', 'sq ft'],
  ['sqyd', 'gaj / sq yd'],
  ['acre', 'acres'],
  ['bigha', 'bigha'],
  ['ha', 'hectares'],
];

function parse<T>(value: string, fallback: T[]): T[] {
  try {
    const out = JSON.parse(value);
    return Array.isArray(out) ? out : fallback;
  } catch {
    return fallback;
  }
}

export function PropertyForm({
  property,
  regions,
}: {
  property?: PropertyFormValues;
  regions: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProperty, undefined);
  const [details, setDetails] = useState<Detail[]>(() => parse<Detail>(property?.details ?? '[]', []));
  const [nearby, setNearby] = useState<Nearby[]>(() => parse<Nearby>(property?.nearby ?? '[]', []));
  const hasPoint = property?.latitude != null && property?.longitude != null;

  return (
    <form className="admin-form" action={action}>
      {property?.id && <input type="hidden" name="id" value={property.id} />}

      <div className="admin-grid">
        <label className="wide">
          <span>Title</span>
          <input name="title" defaultValue={property?.title ?? ''} required maxLength={160} />
        </label>
        <label className="wide">
          <span>Title in Hindi</span>
          <input name="titleHi" defaultValue={property?.title_hi ?? ''} maxLength={160} />
        </label>

        <label>
          <span>Region</span>
          <select name="regionId" defaultValue={property?.region_id ?? ''}>
            <option value="">— none —</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select name="type" defaultValue={property?.type ?? 'land'}>
            <option value="land">Land</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select name="status" defaultValue={property?.status ?? 'available'}>
            <option value="available">Available</option>
            <option value="under_offer">Under offer</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        <label>
          <span>Shown on the site</span>
          <select name="visibility" defaultValue={property?.visibility ?? 'draft'}>
            <option value="public">Public — listed</option>
            <option value="unlisted">Private link only</option>
            <option value="draft">Draft — hidden</option>
          </select>
        </label>

        <label>
          <span>Price</span>
          <input name="price" type="number" step="any" defaultValue={property?.price ?? ''} placeholder="14500000" />
        </label>
        <label>
          <span>Price note</span>
          <input name="priceNote" defaultValue={property?.price_note ?? ''} placeholder="Negotiable" maxLength={160} />
        </label>
        <label>
          <span>Area</span>
          <input name="area" type="number" step="any" defaultValue={property?.area ?? ''} />
        </label>
        <label>
          <span>Unit</span>
          <select name="areaUnit" defaultValue={property?.area_unit ?? 'm2'}>
            {AREA_UNITS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Bedrooms</span>
          <input name="bedrooms" type="number" defaultValue={property?.bedrooms ?? ''} />
        </label>
        <label>
          <span>Bathrooms</span>
          <input name="bathrooms" type="number" defaultValue={property?.bathrooms ?? ''} />
        </label>

        <label className="wide">
          <span>Summary — one line under the title</span>
          <input name="summary" defaultValue={property?.summary ?? ''} maxLength={400} />
        </label>
        <label className="wide">
          <span>Summary in Hindi</span>
          <input name="summaryHi" defaultValue={property?.summary_hi ?? ''} maxLength={400} />
        </label>
      </div>

      <fieldset className="admin-fieldset">
        <legend>Location — hidden until a visitor unlocks the property</legend>
        <div className="admin-grid">
          <label className="wide">
            <span>Address</span>
            <input name="address" defaultValue={property?.address ?? ''} maxLength={300} />
          </label>
          <label className="wide">
            <span>Address in Hindi</span>
            <input name="addressHi" defaultValue={property?.address_hi ?? ''} maxLength={300} />
          </label>
          <label className="wide">
            <span>Map link or coordinates</span>
            <input
              name="mapLink"
              placeholder={hasPoint ? `Now: ${property!.latitude}, ${property!.longitude} — paste a new link to change` : 'https://maps.app.goo.gl/… or 25.5429, 73.9177'}
              maxLength={500}
            />
            <small className="admin-muted">
              A Google Maps share link (short links work), plain coordinates, or survey degrees.
            </small>
          </label>
          {hasPoint && (
            <label className="checkbox wide">
              <input type="checkbox" name="clearPoint" />
              <span>Remove the pin from this property</span>
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Description</legend>
        <label>
          <span>English</span>
          <textarea name="description" rows={7} defaultValue={property?.description ?? ''} maxLength={8000} />
        </label>
        <label>
          <span>Hindi</span>
          <textarea name="descriptionHi" rows={7} defaultValue={property?.description_hi ?? ''} maxLength={8000} />
        </label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Details — the facts table</legend>
        {details.map((detail, i) => (
          <div className="admin-row" key={i}>
            <input name="detailLabel" defaultValue={detail.label} placeholder="Water" maxLength={60} />
            <input name="detailValue" defaultValue={detail.value} placeholder="Canal + borewell" maxLength={200} />
            <label className="checkbox">
              <input type="checkbox" name="detailKey" value={String(i)} defaultChecked={Boolean(detail.key)} />
              <span>Key fact</span>
            </label>
            <button type="button" className="admin-btn small" onClick={() => setDetails(details.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn small" onClick={() => setDetails([...details, { label: '', value: '' }])}>
          Add a detail
        </button>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Nearby places — hidden until unlocked</legend>
        {nearby.map((row, i) => (
          <div className="admin-row" key={i}>
            <input name="nearbyPlace" defaultValue={row.place} placeholder="Deogarh town" maxLength={80} />
            <input name="nearbyDistance" defaultValue={row.distance} placeholder="2 km" maxLength={40} />
            <button type="button" className="admin-btn small" onClick={() => setNearby(nearby.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn small" onClick={() => setNearby([...nearby, { place: '', distance: '' }])}>
          Add a place
        </button>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Access</legend>
        <label className="checkbox">
          <input type="checkbox" name="gated" defaultChecked={property ? Boolean(property.gated) : true} />
          <span>
            Require an access code for the photos, video and exact location
            <small className="admin-muted">Turn this off to show everything to everyone.</small>
          </span>
        </label>
        <label className="checkbox">
          <input type="checkbox" name="featured" defaultChecked={Boolean(property?.featured)} />
          <span>Feature on the home page</span>
        </label>
        <label className="narrow">
          <span>Order</span>
          <input name="sortOrder" type="number" defaultValue={property?.sort_order ?? 0} />
        </label>
      </fieldset>

      {state?.error && (
        <p className="admin-error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="admin-ok">{state.ok}</p>}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : property?.id ? 'Save changes' : 'Create property'}
        </button>
      </div>
    </form>
  );
}
