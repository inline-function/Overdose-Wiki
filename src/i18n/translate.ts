import { en } from './messages.en';
import { zh, type MessageKey } from './messages.zh';
import type { Locale } from './types';

export type MessageParams = Record<string, string | number>;

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { zh, en };

/** Look up a message and fill `{name}` placeholders. Falls back to Chinese. */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const template = DICTIONARIES[locale][key] ?? zh[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
