// DLC 存档的响应式封装（zustand）。
import { create } from 'zustand';
import { CARDS, CARD_MAP, RARITY_META, STARTER_DECK, UPGRADE_DEFS, DEFAULT_UPGRADES, upgradeCost } from './content';
import type { Rarity, UpgradeTrack } from './types';
import { loadDlcSave, persistDlcSave } from './save';
import type { DlcSave } from './types';

export const DECK_SIZE = 12;
export const MAX_COPIES = 2;
export const WIN_CURRENCY = 15;
export const DECOMPOSE_CURRENCY = 5;
export const GACHA_COST = 10;

/** 抽卡稀有度权重：精一/麻只能通过抽卡获得。 */
const GACHA_WEIGHTS: [Rarity, number][] = [
  ['none', 30], ['otc', 25], ['rx', 25], ['class2', 12], ['class1', 6], ['narcotic', 2],
];

function rollRarity(rng: number): Rarity {
  const total = GACHA_WEIGHTS.reduce((acc, [, w]) => acc + w, 0);
  let roll = rng * total;
  for (const [rarity, weight] of GACHA_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return rarity;
  }
  return 'none';
}

export function rollGacha(rng: number): string {
  const rarity = rollRarity(rng);
  const pool = CARDS.filter((card) => card.rarity === rarity);
  return pool[Math.floor(rng * pool.length) % pool.length].id;
}

type DlcStore = {
  save: DlcSave;
  patch: (update: (save: DlcSave) => DlcSave) => void;
  markIntroSeen: () => void;
  recordWin: (stageId: string, battleId: string) => void;
  chooseReward: (cardId: string) => void;
  buyCard: (cardId: string) => boolean;
  buyUpgrade: (track: UpgradeTrack) => boolean;
  drawGacha: () => string | null;
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
    commit(set, get, (save) => ({
      ...save,
      completed: save.completed.includes(stageId) ? save.completed : [...save.completed, stageId],
      battleWins: save.battleWins.includes(battleId) ? save.battleWins : [...save.battleWins, battleId],
      currency: save.currency + (save.battleWins.includes(battleId) ? 0 : WIN_CURRENCY),
      stage: Math.min(8, Math.max(save.stage, Number(stageId.slice(-1)) + 1)),
    })),

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

  drawGacha: () => {
    const save = get().save;
    if (save.currency < GACHA_COST) return null;
    const cardId = rollGacha(Math.random());
    commit(set, get, (s) => ({
      ...s,
      currency: s.currency - GACHA_COST,
      collection: { ...s.collection, [cardId]: (s.collection[cardId] ?? 0) + 1 },
    }));
    return cardId;
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
