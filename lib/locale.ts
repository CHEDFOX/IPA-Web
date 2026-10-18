import { notFound } from 'next/navigation';
import { lang } from 'next/root-params';
import { DICTIONARIES, isLocale, type Locale } from './i18n';

/** The language of the current page, from the /[lang] segment (server components only). */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: DICTIONARIES[locale] };
}
