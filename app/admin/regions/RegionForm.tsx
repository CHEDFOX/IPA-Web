'use client';

import { useActionState } from 'react';
import { saveRegion, type ActionState } from '../actions';

interface Region {
  id: number;
  name: string;
  name_hi: string;
  note: string;
  sort_order: number;
}

export function RegionForm({ region, used }: { region?: Region; used?: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRegion, undefined);
  return (
    <form className="admin-inline-form" action={action}>
      {region && <input type="hidden" name="id" value={region.id} />}
      <label>
        <span>Name</span>
        <input name="name" defaultValue={region?.name ?? ''} placeholder="Deogarh" required maxLength={80} />
      </label>
      <label>
        <span>Hindi name</span>
        <input name="nameHi" defaultValue={region?.name_hi ?? ''} placeholder="देवगढ़" maxLength={80} />
      </label>
      <label>
        <span>Note</span>
        <input name="note" defaultValue={region?.note ?? ''} placeholder="District, state" maxLength={200} />
      </label>
      <label className="narrow">
        <span>Order</span>
        <input name="sortOrder" type="number" defaultValue={region?.sort_order ?? 0} />
      </label>
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : region ? 'Save' : 'Add region'}
      </button>
      {used !== undefined && <span className="admin-muted">{used} listing{used === 1 ? '' : 's'}</span>}
      {state?.error && <span className="admin-error">{state.error}</span>}
      {state?.ok && <span className="admin-ok">{state.ok}</span>}
    </form>
  );
}
