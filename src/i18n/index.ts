import { useCallback, useSyncExternalStore } from 'react';
import { getLocale, subscribeLocale } from './locale';
import type { MessageKey } from './messages.zh';
import { translate, type MessageParams } from './translate';
import type { Locale } from './types';

export { getLocale } from './locale';
export type { Locale } from './types';
export type { MessageKey } from './messages.zh';
export type { MessageParams } from './translate';

/** Translate outside React. Components should prefer `useT()` so they re-render. */
export function t(key: MessageKey, params?: MessageParams): string {
  return translate(getLocale(), key, params);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

export function useT(): (key: MessageKey, params?: MessageParams) => string {
  const locale = useLocale();
  return useCallback(
    (key: MessageKey, params?: MessageParams) => translate(locale, key, params),
    [locale],
  );
}
