import { cacheLife } from 'next/cache';

/** The current year for the footer, re-read daily instead of frozen at build time. */
export async function currentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}
