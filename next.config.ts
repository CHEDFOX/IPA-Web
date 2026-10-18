import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cached data functions ('use cache') instead of per-request fetching; see lib/api.ts.
  cacheComponents: true,
  // Links prefetch a shared page shell; anything that depends on the URL streams in after.
  partialPrefetching: true,
  // Self-contained server in .next/standalone for running on a VPS.
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
