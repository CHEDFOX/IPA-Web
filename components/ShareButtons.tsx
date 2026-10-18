'use client';

import { useRef, useState } from 'react';
import { fill, type Dictionary } from '@/lib/i18n';
import { Close, Download, LinkIcon, QrCode, Share } from './Icons';

interface Props {
  url: string;
  title: string;
  text?: string;
  qrUrl: string;
  labels: Dictionary['property'];
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };
  return { copied, copy };
}

/** "Share" button: the phone's share sheet where available, otherwise copies the link. */
export function ShareButton({ url, title, text, labels }: Omit<Props, 'qrUrl'>) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ url, title, text });
            return;
          } catch (err) {
            if ((err as Error).name === 'AbortError') return;
          }
        }
        copy(url);
      }}
    >
      <Share />
      <span aria-live="polite">{copied ? labels.linkCopied : labels.share}</span>
    </button>
  );
}

export function ShareRow({ url, title, qrUrl, labels }: Props) {
  const { copied, copy } = useCopy();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="share-row">
      <span>{labels.shareThis}</span>
      <div className="share-buttons">
        <button type="button" className="btn btn-outline" onClick={() => copy(url)}>
          <LinkIcon size={15} />
          <span aria-live="polite">{copied ? labels.copied : labels.copyLink}</span>
        </button>
        <button type="button" className="btn btn-outline" onClick={() => dialog.current?.showModal()}>
          <QrCode size={15} /> {labels.qr}
        </button>
      </div>
      <dialog ref={dialog} className="qr-dialog" aria-label={`${labels.qr}: ${title}`}>
        <div className="qr-dialog-inner">
          <strong>{title}</strong>
          <img src={qrUrl} alt={fill(labels.qrAlt, { url })} width={240} height={240} loading="lazy" />
          <p className="muted">{labels.qrHelp}</p>
          <div className="share-buttons">
            <a className="btn btn-outline" href={qrUrl} download>
              <Download size={15} /> {labels.download}
            </a>
            <button type="button" className="btn btn-dark" onClick={() => dialog.current?.close()}>
              <Close size={15} /> {labels.close}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
