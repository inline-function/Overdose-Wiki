import { DEFAULT_LOCALE, type Locale } from './types';

let current: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function syncDocumentLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
}

export function getLocale(): Locale {
  return current;
}

export function applyLocale(next: Locale): void {
  syncDocumentLocale(next);
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
