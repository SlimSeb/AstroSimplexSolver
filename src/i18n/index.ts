import { en } from "./en";
import { fr } from "./fr";
import {
  defaultLocale,
  localeMeta,
  locales,
  type Locale,
  type Messages,
} from "./types";

export { defaultLocale, localeMeta, locales };
export type { Locale, LocaleMeta, Messages } from "./types";

const dictionaries: Record<Locale, Messages> = { en, fr };

/** Narrowing type guard for an unknown string. */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Returns the message dictionary for a locale, falling back to the default. */
export function getMessages(locale: string): Messages {
  return isLocale(locale) ? dictionaries[locale] : dictionaries[defaultLocale];
}

/** Builds the path for a locale: "/" for the default, "/<locale>/" otherwise. */
export function localePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}/`;
}

/** Extracts the active locale from a URL pathname. */
export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : defaultLocale;
}
