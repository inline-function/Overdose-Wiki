// DLC 独立存档：localStorage odw.dlc.v1，与主存档管线隔离。
import { DEFAULT_DLC_SAVE, DEFAULT_UPGRADES } from './content';
import type { DlcSave, Upgrades } from './types';

export const DLC_STORAGE_KEY = 'odw.dlc.v1';
export const DLC_SAVE_VERSION = 1 as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function migrateDlc(raw: unknown): DlcSave | null {
  if (!isObject(raw) || raw.version !== DLC_SAVE_VERSION) return null;
  if (typeof raw.stage !== 'number' || !Array.isArray(raw.completed)) return null;
  if (!Array.isArray(raw.deck) || !isObject(raw.collection)) return null;
  if (typeof raw.currency !== 'number') return null;
  const base = structuredClone(DEFAULT_DLC_SAVE);
  const rawUp = isObject(raw.upgrades) ? (raw.upgrades as Record<string, unknown>) : {};
  const upgrades = Object.fromEntries(
    Object.keys(DEFAULT_UPGRADES).map((k) => {
      const v = rawUp[k];
      return [k, typeof v === 'number' && v >= 0 ? Math.floor(v) : 0];
    }),
  ) as Upgrades;
  return {
    upgrades,
    stage: Math.max(1, Math.min(8, Math.floor(raw.stage))),
    completed: raw.completed.filter((id): id is string => typeof id === 'string'),
    deck: raw.deck.filter((id): id is string => typeof id === 'string'),
    collection: Object.fromEntries(
      Object.entries(raw.collection as Record<string, unknown>)
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([id, count]) => [id, Math.floor(count as number)]),
    ),
    currency: Math.max(0, Math.floor(raw.currency)),
    seenIntro: raw.seenIntro === true,
    battleWins: Array.isArray(raw.battleWins)
      ? raw.battleWins.filter((id): id is string => typeof id === 'string')
      : base.battleWins,
  };
}

export function loadDlcSave(): DlcSave {
  try {
    const raw = localStorage.getItem(DLC_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DLC_SAVE);
    return migrateDlc(JSON.parse(raw)) ?? structuredClone(DEFAULT_DLC_SAVE);
  } catch {
    return structuredClone(DEFAULT_DLC_SAVE);
  }
}

export function persistDlcSave(save: DlcSave): void {
  try {
    localStorage.setItem(DLC_STORAGE_KEY, JSON.stringify({ version: DLC_SAVE_VERSION, ...save }));
  } catch {
    // 存储满/禁用：保留内存态。
  }
}

export function clearDlcSave(): void {
  try {
    localStorage.removeItem(DLC_STORAGE_KEY);
  } catch {
    // ignore
  }
}
