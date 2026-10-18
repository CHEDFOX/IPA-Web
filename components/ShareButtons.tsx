'use client';

import { useRef, useState } from 'react';
import { Close, Download, LinkIcon, QrCode, Share } from './Icons';

interface Props {
  url: string;
  title: string;
  text?: string;
  qrUrl: string;
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
export function ShareButton({ url, title, text }: Omit<Props, 'qrUrl'>) {
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
      <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
    </button>
  );
}

export function ShareRow({ url, title, qrUrl }: Props) {
  const { copied, copy } = useCopy();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="share-row">
      <span>Share this property</span>
      <div className="share-buttons">
        <button type="button" className="btn btn-outline" onClick={() => copy(url)}>
          <LinkIcon size={15} />
          <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
        </button>
        <button type="button" className="btn btn-outline" onClick={() => dialog.current?.showModal()}>
          <QrCode size={15} /> QR code
        </button>
      </div>
      <dialog ref={dialog} className="qr-dialog" aria-label={`QR code for ${title}`}>
        <div className="qr-dialog-inner">
          <strong>{title}</strong>
          <img src={qrUrl} alt={`QR code linking to ${url}`} width={240} height={240} loading="lazy" />
          <p className="muted">Scan with a phone camera to open this page.</p>
          <div className="share-buttons">
            <a className="btn btn-outline" href={qrUrl} download>
              <Download size={15} /> Download
            </a>
            <button type="button" className="btn btn-dark" onClick={() => dialog.current?.close()}>
              <Close size={15} /> Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
