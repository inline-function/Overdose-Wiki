// DLC 抽卡引擎：卡池 banner + 全局概率 + 保底 + 歪保底。
import { CARDS } from './content';
import { DEFAULT_PITY, type GachaPity, type Rarity } from './types';

export { DEFAULT_PITY };
export type { GachaPity };

export const GACHA_WEIGHTS: [Rarity, number][] = [
  ['none', 10], ['otc', 40], ['rx', 30], ['class2', 10], ['class1', 5], ['narcotic', 5],
];

const ORDER: Record<Rarity, number> = { none: 0, otc: 1, rx: 2, class2: 3, class1: 4, narcotic: 5 };

export type GachaPool = {
  id: string;
  name: { zh: string; en: string };
  cardIds: string[];
};

const byTag = (pred: (tags: string[]) => boolean) => CARDS.filter((c) => pred(c.tags)).map((c) => c.id);

export const GACHA_POOLS: GachaPool[] = [
  { id: 'opioid', name: { zh: '阿片池', en: 'Opioid' }, cardIds: byTag((t) => t.includes('respiratory') && t.includes('analgesia')) },
  { id: 'benzo', name: { zh: '苯二氮卓池', en: 'Benzodiazepine' }, cardIds: ['diazepam', 'alprazolam', 'lorazepam', 'clonazepam', 'estazolam', 'zopiclone', 'zolpidem', 'suvorexant', 'phenobarbital', 'secobarbital'] },
  { id: 'esketamine', name: { zh: '艾司氯胺酮池', en: 'Esketamine' }, cardIds: ['esketamine', 'memantine', 'dextromethorphan', 'tiletamine'] },
  { id: 'stimulant', name: { zh: '兴奋剂池', en: 'Stimulant' }, cardIds: byTag((t) => t.includes('motivation') || t.includes('dopamine')) },
];

export const GACHA_POOL_MAP: Record<string, GachaPool> = Object.fromEntries(GACHA_POOLS.map((p) => [p.id, p]));

function rollRarity(rng: number): Rarity {
  const total = GACHA_WEIGHTS.reduce((acc, [, w]) => acc + w, 0);
  let roll = rng * total;
  for (const [rarity, weight] of GACHA_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return rarity;
  }
  return 'none';
}

const pick = <T,>(list: T[], rng: number): T => list[Math.floor(rng * list.length) % list.length];

export type GachaResult = { cardId: string; rarity: Rarity; pity: GachaPity; offBanner: boolean };

/** 单抽：保底优先，再按全局概率；featured 稀有度走卡池 50/50 + 歪保底。 */
export function rollOnce(pity: GachaPity, pool: GachaPool, rng: () => number): GachaResult {
  let rarity: Rarity;
  if (pity.pityN >= 29) rarity = 'narcotic';
  else if (pity.pity1 >= 29) rarity = 'class1';
  else if (pity.pity2 >= 9) rarity = 'class2';
  else rarity = rollRarity(rng());

  const poolSet = new Set(pool.cardIds);
  const allOfRarity = CARDS.filter((c) => c.rarity === rarity);
  const poolOfRarity = allOfRarity.filter((c) => poolSet.has(c.id));
  const featured = ORDER[rarity] >= ORDER.class2;

  let card;
  let guaranteed = pity.guaranteed;
  if (featured && poolOfRarity.length > 0) {
    if (guaranteed) { card = pick(poolOfRarity, rng()); guaranteed = false; }
    else if (rng() < 0.5) { card = pick(poolOfRarity, rng()); }
    else { card = pick(allOfRarity, rng()); }
  } else {
    card = pick(allOfRarity, rng());
  }

  const inPool = poolSet.has(card.id);
  if (featured && !inPool) guaranteed = true; // 歪
  if (inPool) guaranteed = false;

  const next: GachaPity = {
    pity2: ORDER[rarity] >= ORDER.class2 ? 0 : pity.pity2 + 1,
    pity1: ORDER[rarity] >= ORDER.class1 ? 0 : pity.pity1 + 1,
    pityN: rarity === 'narcotic' ? 0 : pity.pityN + 1,
    guaranteed,
  };
  return { cardId: card.id, rarity, pity: next, offBanner: featured && !inPool };
}
