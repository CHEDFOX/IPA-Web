'use client';

import { useEffect, useRef, useState } from 'react';
import type { GalleryItem, ImageSet } from '@/lib/types';
import { formatDuration } from '@/lib/format';
import { ChevronLeft, ChevronRight, Close, Photos, Play } from './Icons';
import { Picture } from './Picture';

const posterOf = (item: GalleryItem): ImageSet | null => (item.kind === 'video' ? item.poster : item);
const largest = (set: ImageSet) => set.sizes[set.sizes.length - 1].url;

function Thumb({ item, sizes, priority }: { item: GalleryItem; sizes: string; priority?: boolean }) {
  const set = posterOf(item);
  return set ? <Picture image={set} alt="" sizes={sizes} priority={priority} /> : null;
}

interface Props {
  items: GalleryItem[];
  title: string;
}

export function Gallery({ items, title }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open !== null && !el.open) el.showModal();
    if (open === null && el.open) el.close();
  }, [open]);

  if (!items.length) {
    return (
      <div className="gallery">
        <div className="gallery-main gallery-tile single">
          <span className="no-photo">Photos coming soon</span>
        </div>
      </div>
    );
  }

  const photoCount = items.filter((i) => i.kind === 'image').length;
  const main = items[0];
  const rest = items.slice(1);
  // Prefer showing a video in the side column so visitors can see there is one.
  const firstVideo = rest.find((i) => i.kind === 'video');
  const side = firstVideo ? [firstVideo, ...rest.filter((i) => i !== firstVideo)].slice(0, 2) : rest.slice(0, 2);

  const show = (item: GalleryItem) => setOpen(items.indexOf(item));
  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length));
  const current = open === null ? null : items[open];

  const tileLabel = (item: GalleryItem, n: number) =>
    item.kind === 'video' ? `Play video of ${title}` : `Open photo ${n} of ${title}`;

  return (
    <>
      <div className="gallery">
        <div className={side.length ? 'gallery-main' : 'gallery-main gallery-solo'}>
          <button type="button" className="gallery-tile" onClick={() => show(main)} aria-label={tileLabel(main, 1)}>
            <Thumb item={main} sizes="(max-width: 860px) 100vw, 66vw" priority />
            {main.kind === 'video' && (
              <span className="play">
                <Play size={22} />
              </span>
            )}
            {!side.length && items.length > 1 && (
              <span className="media-chip right">
                <Photos /> All {items.length}
              </span>
            )}
          </button>
        </div>
        {side.length > 0 && (
          <div className="gallery-side">
            {side.map((item, i) => {
              const isLast = i === side.length - 1;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="gallery-tile"
                  onClick={() => show(item)}
                  aria-label={isLast && items.length > 3 ? `Show all ${items.length} photos and videos` : tileLabel(item, items.indexOf(item) + 1)}
                >
                  <Thumb item={item} sizes="(max-width: 860px) 50vw, 33vw" />
                  {item.kind === 'video' && (
                    <>
                      <span className="play">
                        <Play size={22} />
                      </span>
                      <span className="media-chip left">Video{item.duration ? ` · ${formatDuration(item.duration)}` : ''}</span>
                    </>
                  )}
                  {isLast && items.length > 3 && (
                    <span className="media-chip right">
                      <Photos /> {photoCount === items.length ? `All ${items.length} photos` : `All ${items.length}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={`${title} photos`}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {current && (
          <div className="lightbox-inner">
            <div className="lightbox-bar">
              <span className="lightbox-count">
                {open! + 1} / {items.length}
              </span>
              <button type="button" className="icon-btn" onClick={() => setOpen(null)} aria-label="Close">
                <Close size={20} />
              </button>
            </div>
            {current.kind === 'video' ? (
              <video
                key={current.id}
                src={current.url}
                poster={current.poster ? largest(current.poster) : undefined}
                controls
                autoPlay
                playsInline
                preload="metadata"
              />
            ) : (
              <img key={current.id} src={largest(current)} alt={current.alt || `${title}, photo ${open! + 1}`} />
            )}
            {current.alt && <p className="lightbox-caption">{current.alt}</p>}
            {items.length > 1 && (
              <>
                <button type="button" className="icon-btn lightbox-prev" onClick={() => step(-1)} aria-label="Previous">
                  <ChevronLeft size={22} />
                </button>
                <button type="button" className="icon-btn lightbox-next" onClick={() => step(1)} aria-label="Next">
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

/** A single image (e.g. a site plan) that opens full screen when clicked. */
export function ZoomImage({ image, alt, caption }: { image: ImageSet; alt: string; caption?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="plan">
      <button type="button" onClick={() => dialog.current?.showModal()} aria-label={`Enlarge: ${alt}`}>
        <Picture image={image} alt={alt} sizes="(max-width: 860px) 100vw, 860px" />
      </button>
      {caption && <figcaption>{caption}</figcaption>}
      <dialog ref={dialog} className="lightbox" aria-label={alt}>
        <div className="lightbox-inner">
          <div className="lightbox-bar">
            <span />
            <button type="button" className="icon-btn" onClick={() => dialog.current?.close()} aria-label="Close">
              <Close size={20} />
            </button>
          </div>
          <img src={largest(image)} alt={alt} />
        </div>
      </dialog>
    </figure>
  );
}
