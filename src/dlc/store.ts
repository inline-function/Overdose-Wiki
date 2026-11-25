// DLC 存档的响应式封装（zustand）。
import { create } from 'zustand';
import { CARD_MAP, RARITY_META, STARTER_DECK, UPGRADE_DEFS, DEFAULT_UPGRADES, upgradeCost } from './content';
import { GACHA_POOLS, GACHA_POOL_MAP, rollOnce, type GachaResult } from './gacha';
import { DEFAULT_PITY, type UpgradeTrack } from './types';
import { loadDlcSave, persistDlcSave } from './save';
import type { DlcSave } from './types';

export const DECK_SIZE = 12;
export const MAX_COPIES = 2;
export const WIN_CURRENCY = 100;
export const REPEAT_WIN_CURRENCY = 50;
export const LAST_FIRST_CURRENCY = 300;
export const LAST_REPEAT_CURRENCY = 200;
export const DECOMPOSE_CURRENCY = 5;
export const GACHA_COST = 10;

type DlcStore = {
  save: DlcSave;
  patch: (update: (save: DlcSave) => DlcSave) => void;
  markIntroSeen: () => void;
  recordWin: (stageId: string, battleId: string) => void;
  chooseReward: (cardId: string) => void;
  buyCard: (cardId: string) => boolean;
  buyUpgrade: (track: UpgradeTrack) => boolean;
  drawGacha: (poolId: string, count: number) => GachaResult[] | null;
  decomposeCard: (cardId: string) => boolean;
  setDeck: (deck: string[]) => void;
  resetDlc: () => void;
};

function commit(set: (fn: (state: DlcStore) => Partial<DlcStore>) => void, get: () => DlcStore, update: (save: DlcSave) => DlcSave) {
  const next = update(get().save);
  persistDlcSave(next);
  set(() => ({ save: next }));
}

export const useDlcStore = create<DlcStore>()((set, get) => ({
  save: loadDlcSave(),

  patch: (update) => commit(set, get, update),

  markIntroSeen: () => commit(set, get, (save) => ({ ...save, seenIntro: true })),

  recordWin: (stageId, battleId) =>
    commit(set, get, (save) => {
      const first = !save.battleWins.includes(battleId);
      const isLast = stageId === 'dlc-8';
      const reward = first
        ? (isLast ? LAST_FIRST_CURRENCY : WIN_CURRENCY)
        : (isLast ? LAST_REPEAT_CURRENCY : REPEAT_WIN_CURRENCY);
      return {
        ...save,
        completed: save.completed.includes(stageId) ? save.completed : [...save.completed, stageId],
        battleWins: first ? [...save.battleWins, battleId] : save.battleWins,
        currency: save.currency + reward,
        stage: Math.min(8, Math.max(save.stage, Number(stageId.slice(-1)) + 1)),
      };
    }),

  chooseReward: (cardId) =>
    commit(set, get, (save) => ({
      ...save,
      collection: { ...save.collection, [cardId]: (save.collection[cardId] ?? 0) + 1 },
    })),

  buyCard: (cardId) => {
    const save = get().save;
    const card = CARD_MAP[cardId];
    if (!card) return false;
    const cost = RARITY_META[card.rarity].cost;
    if (save.currency < cost) return false;
    commit(set, get, (s) => ({
      ...s,
      currency: s.currency - cost,
      collection: { ...s.collection, [cardId]: (s.collection[cardId] ?? 0) + 1 },
    }));
    return true;
  },

  buyUpgrade: (track) => {
    const save = get().save;
    const def = UPGRADE_DEFS[track];
    const level = save.upgrades?.[track] ?? 0;
    if (!def || level >= def.maxLevel) return false;
    const cost = upgradeCost(track, level);
    if (save.currency < cost) return false;
    commit(set, get, (s) => ({
      ...s,
      currency: s.currency - cost,
      upgrades: { ...s.upgrades, [track]: level + 1 },
    }));
    return true;
  },

  drawGacha: (poolId, count) => {
    const save = get().save;
    const cost = count * GACHA_COST;
    if (save.currency < cost || count <= 0) return null;
    const pool = GACHA_POOL_MAP[poolId] ?? GACHA_POOLS[0];
    let pity = save.gacha ?? DEFAULT_PITY;
    const results: GachaResult[] = [];
    for (let i = 0; i < count; i += 1) {
      const r = rollOnce(pity, pool, Math.random);
      pity = r.pity;
      results.push(r);
    }
    commit(set, get, (s) => {
      const collection = { ...s.collection };
      for (const r of results) collection[r.cardId] = (collection[r.cardId] ?? 0) + 1;
      return { ...s, currency: s.currency - cost, collection, gacha: pity };
    });
    return results;
  },

  decomposeCard: (cardId) => {
    const save = get().save;
    const owned = save.collection[cardId] ?? 0;
    const inDeck = save.deck.filter((id) => id === cardId).length;
    if (owned <= inDeck || owned <= 0) return false;
    commit(set, get, (s) => ({
      ...s,
      currency: s.currency + DECOMPOSE_CURRENCY,
      collection: { ...s.collection, [cardId]: (s.collection[cardId] ?? 0) - 1 },
    }));
    return true;
  },

  setDeck: (deck) => commit(set, get, (save) => ({ ...save, deck: [...deck] })),

  resetDlc: () => {
    const fresh = structuredClone({
      endlessBest: 0,
      gacha: { pity2: 0, pity1: 0, pityN: 0, guaranteed: false },
      upgrades: { ...DEFAULT_UPGRADES },
      stage: 1,
      completed: [],
      deck: [...STARTER_DECK],
      collection: Object.fromEntries(STARTER_DECK.map((id) => [id, 0])),
      currency: 30,
      seenIntro: false,
      battleWins: [],
    } as DlcSave);
    for (const id of STARTER_DECK) fresh.collection[id] = (fresh.collection[id] ?? 0) + 1;
    persistDlcSave(fresh);
    set(() => ({ save: fresh }));
  },
}));

export function deckValid(deck: string[]): boolean {
  if (deck.length !== DECK_SIZE) return false;
  const counts: Record<string, number> = {};
  for (const id of deck) {
    if (!CARD_MAP[id]) return false;
    counts[id] = (counts[id] ?? 0) + 1;
    if (counts[id] > MAX_COPIES) return false;
  }
  return true;
}
