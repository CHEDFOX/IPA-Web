'use client';

import { useActionState } from 'react';
import { saveSettings, uploadSiteImage, type ActionState } from '../actions';

type Values = Record<string, string>;

const TEXT_PAIRS: { key: string; label: string; hint?: string; long?: boolean }[] = [
  { key: 'siteName', label: 'Site name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'heroTitle', label: 'Headline on the home page' },
  { key: 'heroText', label: 'Text under the headline', long: true },
  { key: 'aboutTitle', label: 'About heading' },
  { key: 'aboutText', label: 'About text', long: true },
  { key: 'contactTitle', label: 'Contact band heading' },
  { key: 'contactText', label: 'Contact band text', long: true },
  { key: 'unlockHelpText', label: 'Text on the access-code card', hint: 'Tell visitors how to get a code.', long: true },
  { key: 'footerNote', label: 'Footer note' },
];

export function SettingsForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, undefined);

  return (
    <form className="admin-form" action={action}>
      <fieldset className="admin-fieldset">
        <legend>Contact — used everywhere on the site</legend>
        <p className="admin-muted">
          One WhatsApp number serves every property: each WhatsApp button opens a chat with this number, with the
          property&rsquo;s name and link already typed.
        </p>
        <div className="admin-grid">
          <label>
            <span>WhatsApp number</span>
            <input name="whatsapp" defaultValue={values.whatsapp} placeholder="+91 90000 00000" />
            <small className="admin-muted">With the country code. Leave empty to hide the WhatsApp buttons.</small>
          </label>
          <label>
            <span>Phone number</span>
            <input name="phone" defaultValue={values.phone} placeholder="+91 90000 00000" />
            <small className="admin-muted">Used by the Call buttons.</small>
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" defaultValue={values.email} />
          </label>
          <label>
            <span>Currency</span>
            <select name="currency" defaultValue={values.currency}>
              <option value="INR">INR — lakh and crore</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
            </select>
          </label>
          <label className="wide">
            <span>Office address</span>
            <input name="address" defaultValue={values.address} />
          </label>
          <label>
            <span>Instagram link</span>
            <input name="instagram" defaultValue={values.instagram} />
          </label>
          <label>
            <span>Facebook link</span>
            <input name="facebook" defaultValue={values.facebook} />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Words on the site</legend>
        {TEXT_PAIRS.map((field) => (
          <div className="admin-pair" key={field.key}>
            <label>
              <span>{field.label}</span>
              {field.long ? (
                <textarea name={field.key} rows={3} defaultValue={values[field.key]} />
              ) : (
                <input name={field.key} defaultValue={values[field.key]} />
              )}
              {field.hint && <small className="admin-muted">{field.hint}</small>}
            </label>
            <label>
              <span>{field.label} — Hindi</span>
              {field.long ? (
                <textarea name={`${field.key}Hi`} rows={3} defaultValue={values[`${field.key}Hi`]} />
              ) : (
                <input name={`${field.key}Hi`} defaultValue={values[`${field.key}Hi`]} />
              )}
            </label>
          </div>
        ))}
      </fieldset>

      {state?.error && <p className="admin-error">{state.error}</p>}
      {state?.ok && <p className="admin-ok">{state.ok}</p>}
      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}

export function SiteImageForm({ role, label }: { role: 'hero' | 'portrait'; label: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadSiteImage, undefined);
  return (
    <form className="admin-upload" action={action}>
      <input type="hidden" name="role" value={role} />
      <label>
        <span>{label}</span>
        <input type="file" name="file" accept="image/*" required />
      </label>
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? 'Uploading…' : 'Upload'}
      </button>
      {state?.ok && <span className="admin-ok">{state.ok}</span>}
      {state?.error && <span className="admin-error">{state.error}</span>}
    </form>
  );
}
