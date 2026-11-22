import type { MiniGameData } from './types';

/**
 * 小玩法数据放在私有大包的 minigames/ 目录；没有私有大包时是空表，
 * 剧情里的 minigame 拍会显示“玩法缺失”的占位。
 */
const modules = import.meta.glob<MiniGameData>('./private/minigames/*.json', {
  eager: true,
});

const games = new Map<string, MiniGameData>();
for (const [path, value] of Object.entries(modules)) {
  const fileId = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  const id = value.id || fileId;
  if (id) games.set(id, { ...value, id });
}

export function miniGameList(): MiniGameData[] {
  return [...games.values()];
}

export function getMiniGame(id: string): MiniGameData | undefined {
  return games.get(id);
}

export function minigamePromise(id: string): Promise<MiniGameData | undefined> {
  return Promise.resolve(games.get(id));
}
