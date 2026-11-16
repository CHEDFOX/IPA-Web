'use client';

import { useActionState, useRef } from 'react';
import { uploadMedia, type ActionState } from '../../actions';

export function UploadForm({
  propertyId,
  role,
  label,
  accept = 'image/*,video/*',
  multiple = false,
}: {
  propertyId: number;
  role: string;
  label: string;
  accept?: string;
  multiple?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadMedia, undefined);
  const input = useRef<HTMLInputElement>(null);

  return (
    <form
      className="admin-upload"
      action={(form) => {
        action(form);
        if (input.current) input.current.value = '';
      }}
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="role" value={role} />
      <label>
        <span>{label}</span>
        <input ref={input} type="file" name="files" accept={accept} multiple={multiple} required />
      </label>
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? 'Uploading…' : 'Upload'}
      </button>
      {pending && <span className="admin-muted">Large videos take a while — keep this page open.</span>}
      {state?.ok && <span className="admin-ok">{state.ok}</span>}
      {state?.error && <span className="admin-error">{state.error}</span>}
    </form>
  );
}
