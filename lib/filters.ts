import type { PropertyStatus, PropertyType } from './types';

export const TYPES: PropertyType[] = ['land', 'residential', 'commercial'];
export const STATUSES: PropertyStatus[] = ['available', 'under_offer', 'sold'];

export function filterHref(basePath: string, params: { type?: string; status?: string; location?: string }) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
