'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fill, type Dictionary, type Locale } from '@/lib/i18n';
import type { UnlockedDetail } from '@/lib/types';
import { Gallery, ZoomImage } from './Gallery';
import { Chat, Lock, Photos, Pin } from './Icons';
import { LocationMap } from './LocationMap';

interface GateConfig {
  /** Public listings unlock by slug; a private link passes its token instead. */
  slug?: string;
  token?: string;
  title: string;
  type: string;
  locale: Locale;
  t: Dictionary;
  photoCount: number;
  videoCount: number;
  /** WhatsApp link for "ask for a code", already carrying the site's one number. */
  whatsapp: string;
  helpText?: string;
}

type Phase = 'locked' | 'open' | 'expired';

interface GateState extends GateConfig {
  phase: Phase;
  detail: UnlockedDetail | null;
  countdown: string;
  openDialog: () => void;
}

const GateContext = createContext<GateState | null>(null);
const PING_MS = 60_000;

function remaining(expiresAt: number): string {
  const seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Holds the unlock for one property page: asks the server what this visitor may see, keeps
 * the session alive while the tab is open, and owns the code dialog. The two slots below
 * read from it, so the gallery and the location block unlock together.
 */
export function GateProvider({ children, ...config }: GateConfig & { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('locked');
  const [detail, setDetail] = useState<UnlockedDetail | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [countdown, setCountdown] = useState('');
  const { slug, token } = config;

  const apply = useCallback((data: { detail: UnlockedDetail; expiresAt?: number }) => {
    setDetail(data.detail);
    setExpiresAt(data.expiresAt ?? data.detail.expiresAt ?? 0);
    setPhase('open');
    setDialogOpen(false);
  }, []);

  // What may this visitor see right now? Asked on load, because the page itself is cached
  // and so never carries the answer.
  useEffect(() => {
    const query = token ? `token=${encodeURIComponent(token)}` : `slug=${encodeURIComponent(slug ?? '')}`;
    let cancelled = false;
    fetch(`/api/unlock?${query}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.unlocked && data.detail) apply(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, token, apply]);

  // While the tab is open the unlock is pushed forward, so it lasts as long as the visit.
  useEffect(() => {
    if (phase !== 'open') return;
    let stopped = false;
    const ping = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/unlock/ping', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug, token }),
        });
        const data = await res.json();
        if (stopped) return;
        if (data?.unlocked === false) {
          setPhase('expired');
          setDetail(null);
        } else if (data?.expiresAt) {
          setExpiresAt(data.expiresAt);
        }
      } catch {
        // Offline for a moment: the unlock stands until the server says otherwise.
      }
    };
    const timer = setInterval(ping, PING_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [phase, slug, token]);

  // The countdown only runs down while the tab is away; a ping resets it on return.
  useEffect(() => {
    if (phase !== 'open' || !expiresAt) return;
    const tick = () => {
      setCountdown(remaining(expiresAt));
      if (expiresAt <= Date.now()) {
        setPhase('expired');
        setDetail(null);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase, expiresAt]);

  const state: GateState = { ...config, phase, detail, countdown, openDialog: () => setDialogOpen(true) };

  return (
    <GateContext.Provider value={state}>
      {children}
      {dialogOpen && (
        <UnlockDialog
          slug={slug}
          token={token}
          title={config.title}
          labels={config.t.unlock}
          whatsapp={config.whatsapp}
          helpText={config.helpText}
          onClose={() => setDialogOpen(false)}
          onUnlocked={apply}
        />
      )}
    </GateContext.Provider>
  );
}

const useGate = () => useContext(GateContext);

/** The photo gallery, or the panel that opens the code dialog. */
export function GateGallery() {
  const gate = useGate();
  if (!gate) return null;
  const { t, detail, phase, photoCount, videoCount, title, openDialog } = gate;
  const labels = t.unlock;
  const total = photoCount + videoCount;

  if (phase === 'open' && detail) {
    return (
      <>
        <div className="unlock-bar" role="status">
          <Lock open size={16} />
          <span>{labels.openNow}</span>
          {gate.countdown && <span className="unlock-timer">{fill(labels.closingIn, { time: gate.countdown })}</span>}
        </div>
        <Gallery items={detail.gallery} title={title} labels={t.property} />
      </>
    );
  }

  return (
    <>
      {phase === 'expired' && (
        <p className="notice" role="status">
          {labels.expired}
        </p>
      )}
      <button type="button" className="locked-panel locked-gallery" onClick={openDialog}>
        <span className="locked-icon">
          <Lock size={22} />
        </span>
        <strong>{labels.photosTitle}</strong>
        <span className="muted">{total > 0 ? fill(labels.photosText, { n: total }) : labels.photosTextNoCount}</span>
        <span className="btn btn-dark btn-sm locked-cta">{labels.button}</span>
        {total > 0 && (
          <span className="media-chip right">
            <Photos /> {total}
          </span>
        )}
      </button>
    </>
  );
}

/** The map, site plan and nearby places, or the panel that opens the code dialog. */
export function GateLocation() {
  const gate = useGate();
  if (!gate) return null;
  const { t, detail, phase, title, type, locale, openDialog } = gate;
  const labels = t.unlock;
  const hasMap = detail?.latitude != null && detail?.longitude != null;
  const nearby = (detail?.nearby ?? []).filter((n) => n.place);

  if (phase === 'open' && detail) {
    if (!hasMap && !detail.plan && !nearby.length && !detail.address) return null;
    return (
      <section className="block" aria-labelledby="location-title">
        <h2 id="location-title">{t.property.location}</h2>
        {detail.address && (
          <p className="prop-address prop-address-block">
            <Pin /> {detail.address}
          </p>
        )}
        {hasMap && (
          <LocationMap
            lat={detail.latitude!}
            lng={detail.longitude!}
            title={title}
            locale={locale}
            satellite={type === 'land'}
            labels={t.property}
          />
        )}
        {detail.plan && (
          <ZoomImage
            image={detail.plan}
            alt={detail.plan.alt || fill(t.property.sitePlanOf, { title })}
            caption={t.property.sitePlan}
            labels={t.property}
          />
        )}
        {nearby.length > 0 && (
          <ul className="nearby">
            {nearby.map((n, i) => (
              <li key={i}>
                <span>{n.place}</span>
                <span>{n.distance}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="block" aria-labelledby="location-title">
      <h2 id="location-title">{t.property.location}</h2>
      <button type="button" className="locked-panel locked-location" onClick={openDialog}>
        <span className="locked-icon">
          <Lock size={22} />
        </span>
        <strong>{labels.locationTitle}</strong>
        <span className="muted">{labels.locationText}</span>
        <span className="btn btn-dark btn-sm locked-cta">{labels.button}</span>
      </button>
    </section>
  );
}

interface DialogProps {
  slug?: string;
  token?: string;
  title: string;
  labels: Dictionary['unlock'];
  whatsapp: string;
  helpText?: string;
  onClose: () => void;
  onUnlocked: (data: { detail: UnlockedDetail; expiresAt?: number }) => void;
}

function UnlockDialog({ slug, token, title, labels, whatsapp, helpText, onClose, onUnlocked }: DialogProps) {
  const [mode, setMode] = useState<'code' | 'request' | 'requested'>('code');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, token, code }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || labels.failed);
        return;
      }
      onUnlocked(data);
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  async function submitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          token,
          name: form.get('name'),
          phone: form.get('phone'),
          website: form.get('website'),
          pageUrl: window.location.href,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || labels.requestFailed);
        return;
      }
      setMode('requested');
    } catch {
      setError(labels.requestFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="unlock-backdrop" role="dialog" aria-modal="true" aria-label={fill(labels.dialogTitle, { title })}>
      <div className="unlock-card">
        <button type="button" className="unlock-close" onClick={onClose} aria-label={labels.close}>
          ×
        </button>

        {mode === 'code' && (
          <form onSubmit={submitCode}>
            <span className="label">
              <Lock size={13} /> {fill(labels.dialogTitle, { title })}
            </span>
            <p className="unlock-text">{helpText || labels.dialogText}</p>
            <div className="form-field">
              <label htmlFor="unlock-code">{labels.codeLabel}</label>
              <input
                id="unlock-code"
                ref={input}
                className="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoComplete="one-time-code"
                maxLength={12}
                required
              />
              <small className="muted">{labels.codeHint}</small>
            </div>
            {error && (
              <p className="form-status error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-accent btn-block" type="submit" disabled={busy || code.trim().length < 4}>
              {busy ? labels.checking : labels.submit}
            </button>
            <button type="button" className="text-link unlock-switch" onClick={() => setMode('request')}>
              {labels.noCode}
            </button>
          </form>
        )}

        {mode === 'request' && (
          <form onSubmit={submitRequest}>
            <span className="label">{labels.requestTitle}</span>
            <p className="unlock-text">{labels.requestText}</p>
            <div className="form-field">
              <label htmlFor="unlock-name">{labels.nameLabel}</label>
              <input id="unlock-name" name="name" autoComplete="name" maxLength={100} />
            </div>
            <div className="form-field">
              <label htmlFor="unlock-phone">{labels.phoneLabel}</label>
              <input id="unlock-phone" name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40} />
            </div>
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="unlock-website">Leave this empty</label>
              <input id="unlock-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            {error && (
              <p className="form-status error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-accent btn-block" type="submit" disabled={busy}>
              {busy ? labels.requestSending : labels.requestSubmit}
            </button>
            {whatsapp && (
              <a className="btn btn-outline btn-block" href={whatsapp} target="_blank" rel="noopener">
                <Chat size={16} /> {labels.whatsappAsk}
              </a>
            )}
            <button type="button" className="text-link unlock-switch" onClick={() => setMode('code')}>
              {labels.codeLabel}
            </button>
          </form>
        )}

        {mode === 'requested' && (
          <div className="unlock-done">
            <span className="label">{labels.requestTitle}</span>
            <p className="unlock-text">{labels.requestDone}</p>
            {whatsapp && (
              <a className="btn btn-accent btn-block" href={whatsapp} target="_blank" rel="noopener">
                <Chat size={16} /> {labels.whatsappAsk}
              </a>
            )}
            <button type="button" className="btn btn-outline btn-block" onClick={onClose}>
              {labels.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
