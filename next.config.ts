import type { NextConfig } from 'next';

// Without the backend address a Vercel deploy would succeed but show no listings, so stop early.
if (process.env.VERCEL && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it in Vercel → Project → Settings → Environment Variables, e.g. https://api.yourdomain.com',
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
