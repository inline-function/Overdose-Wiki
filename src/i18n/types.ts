export type Locale = 'zh' | 'en';

/** How the current locale was chosen. Explicit user choices always win. */
export type LocaleSource = 'default' | 'url' | 'explicit';

export const LOCALES: readonly Locale[] = ['zh', 'en'];

export const DEFAULT_LOCALE: Locale = 'zh';

export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en';
}
