import type { ImageSet } from '@/lib/types';

interface Props {
  image: ImageSet;
  alt: string;
  /** Rendered width hint for the browser, e.g. "(max-width: 720px) 100vw, 440px". */
  sizes: string;
  className?: string;
  priority?: boolean;
}

// The backend already makes 640/1280/2048 px WebP copies, so a plain responsive <img> is enough.
export function Picture({ image, alt, sizes, className, priority = false }: Props) {
  const fallback = image.sizes[Math.min(1, image.sizes.length - 1)];
  return (
    <img
      src={fallback.url}
      srcSet={image.sizes.map((s) => `${s.url} ${s.width}w`).join(', ')}
      sizes={sizes}
      width={fallback.width}
      height={fallback.height}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  );
}
