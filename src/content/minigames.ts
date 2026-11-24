import { getLocale } from '../i18n/locale';
import type { MiniGameData } from './types';

/**
 * 小玩法数据放在私有大包的 minigames/ 目录；没有私有大包时是空表，
 * 剧情里的 minigame 拍会显示“玩法缺失”的占位。
 */
const modules = import.meta.glob<MiniGameData>('./private/minigames/*.json', {
  eager: true,
});
// English minigame files mirror the Chinese structure field for field; the
// loader picks them by id when the locale is English and falls back to zh.
const enModules = import.meta.glob<MiniGameData>('./private/en/minigames/*.json', {
  eager: true,
});

const games = new Map<string, MiniGameData>();
for (const [path, value] of Object.entries(modules)) {
  const fileId = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  const id = value.id || fileId;
  if (id) games.set(id, { ...value, id });
}
const enGames = new Map<string, MiniGameData>();
for (const [path, value] of Object.entries(enModules)) {
  const fileId = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  const id = value.id || fileId;
  if (id) enGames.set(id, { ...value, id });
}

function pick(id: string): MiniGameData | undefined {
  const base = games.get(id);
  if (getLocale() !== 'en') return base;
  return enGames.get(id) ?? base;
}

export function miniGameList(): MiniGameData[] {
  return [...games.keys()].map((id) => pick(id)!).filter(Boolean);
}

export function getMiniGame(id: string): MiniGameData | undefined {
  return pick(id);
}

export function minigamePromise(id: string): Promise<MiniGameData | undefined> {
  return Promise.resolve(pick(id));
}
