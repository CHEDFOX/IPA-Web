import type { NextConfig } from 'next';

// The site keeps its own database, so a Vercel deploy would have nothing to read and no
// writable disk for uploads. Say so at build time rather than shipping an empty site.
if (process.env.VERCEL && process.env.NEXT_PUBLIC_DEMO !== '1') {
  throw new Error(
    'This app stores listings and uploaded photos on disk, so it needs a normal server (see README: Put it on your server). To deploy the sample listings to Vercel anyway, set NEXT_PUBLIC_DEMO=1.',
  );
}

const nextConfig: NextConfig = {
  // Cached data functions ('use cache') instead of per-request fetching; see lib/api.ts.
  cacheComponents: true,
  // Links prefetch a shared page shell; anything that depends on the URL streams in after.
  partialPrefetching: true,
  poweredByHeader: false,
};

export default nextConfig;
