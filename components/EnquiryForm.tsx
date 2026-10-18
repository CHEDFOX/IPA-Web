'use client';

import { useState, type FormEvent } from 'react';
import type { Dictionary } from '@/lib/i18n';

interface Props {
  apiUrl: string;
  propertyId?: number;
  defaultMessage?: string;
  labels: Dictionary['enquiry'];
}

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done' } | { kind: 'error'; message: string };

export function EnquiryForm({ apiUrl, propertyId, defaultMessage = '', labels }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ kind: 'sending' });
    try {
      const res = await fetch(`${apiUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          name: form.get('name'),
          contact: form.get('contact'),
          message: form.get('message'),
          website: form.get('website'),
          pageUrl: window.location.href,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || labels.failed);
      }
      setState({ kind: 'done' });
    } catch (err) {
      const message = err instanceof TypeError ? labels.offline : (err as Error).message;
      setState({ kind: 'error', message });
    }
  }

  if (state.kind === 'done') {
    return (
      <p className="form-done" role="status">
        {labels.done}
      </p>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="form-field">
        <label htmlFor="q-name">{labels.name}</label>
        <input id="q-name" name="name" autoComplete="name" required maxLength={100} />
      </div>
      <div className="form-field">
        <label htmlFor="q-contact">{labels.contact}</label>
        <input id="q-contact" name="contact" autoComplete="tel" required minLength={5} maxLength={150} />
      </div>
      <div className="form-field">
        <label htmlFor="q-message">{labels.message}</label>
        <textarea id="q-message" name="message" rows={3} maxLength={3000} defaultValue={defaultMessage} />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="q-website">{labels.honeypot}</label>
        <input id="q-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.kind === 'error' && (
        <p className="form-status error" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn btn-dark" type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? labels.sending : labels.send}
      </button>
    </form>
  );
}
