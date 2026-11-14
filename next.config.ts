import type { NextConfig } from 'next';

// Without the backend address a Vercel deploy would succeed but show no listings, so stop early.
// Demo mode (NEXT_PUBLIC_DEMO=1) has no backend to point at, so it is allowed through.
if (process.env.VERCEL && !process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_DEMO !== '1') {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it in Vercel → Project → Settings → Environment Variables, e.g. https://api.yourdomain.com — or set NEXT_PUBLIC_DEMO=1 to deploy the sample listings instead.',
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
