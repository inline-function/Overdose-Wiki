import { useGameStore } from '../game/store';
import { applyLocale } from './locale';
import { isLocale, type Locale } from './types';

/** `?lang=en` (or `?lang=zh`) in the real query string, i.e. before the hash route. */
export function readRequestedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = new URLSearchParams(window.location.search).get('lang');
    return isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Pick the startup locale: explicit URL wins, then the saved preference, then
 * Chinese. Browser language is deliberately NOT consulted; see docs/i18n.
 */
export function initLocale(): void {
  const requested = readRequestedLocale();
  const saved = useGameStore.getState().save.settings.lang;
  const initial = requested ?? (isLocale(saved) ? saved : 'zh');
  applyLocale(initial);
  if (requested && requested !== saved) {
    useGameStore.getState().setSettings({ lang: requested });
  }
}
