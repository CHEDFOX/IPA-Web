'use client';

import { useState, type FormEvent } from 'react';

interface Props {
  apiUrl: string;
  propertyId?: number;
  defaultMessage?: string;
}

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done' } | { kind: 'error'; message: string };

export function EnquiryForm({ apiUrl, propertyId, defaultMessage = '' }: Props) {
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
        throw new Error(data?.error || 'Your message could not be sent.');
      }
      setState({ kind: 'done' });
    } catch (err) {
      const message = err instanceof TypeError ? 'Could not connect. Please try again, or use WhatsApp.' : (err as Error).message;
      setState({ kind: 'error', message });
    }
  }

  if (state.kind === 'done') {
    return (
      <p className="form-done" role="status">
        Thank you. Your message has been sent and we will get back to you soon.
      </p>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="form-field">
        <label htmlFor="q-name">Your name</label>
        <input id="q-name" name="name" autoComplete="name" required maxLength={100} />
      </div>
      <div className="form-field">
        <label htmlFor="q-contact">Phone or email</label>
        <input id="q-contact" name="contact" autoComplete="tel" required minLength={5} maxLength={150} />
      </div>
      <div className="form-field">
        <label htmlFor="q-message">Message</label>
        <textarea id="q-message" name="message" rows={3} maxLength={3000} defaultValue={defaultMessage} />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="q-website">Leave this empty</label>
        <input id="q-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.kind === 'error' && (
        <p className="form-status error" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn btn-dark" type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
