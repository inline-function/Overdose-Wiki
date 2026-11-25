import { describe, expect, it } from 'vitest';
import { BATTLES, CARD_MAP, STAGES, STARTER_DECK } from '../dlc/content';
import { GACHA_POOLS, GACHA_WEIGHTS, rollOnce } from '../dlc/gacha';
import { DEFAULT_PITY } from '../dlc/types';

describe('DLC 抽卡', () => {
  it('玩家获取途径（初始/奖励/商店）不含精一/麻', () => {
    const restricted = new Set(['class1', 'narcotic']);
    for (const id of STARTER_DECK) expect(restricted.has(CARD_MAP[id].rarity)).toBe(false);
    for (const stage of STAGES) {
      for (const id of [...stage.rewards, ...stage.shop]) {
        expect(restricted.has(CARD_MAP[id].rarity), `${id} in stage ${stage.no}`).toBe(false);
      }
    }
  });

  it('概率为 无10/OTC40/Rx30/精二10/精一5/麻5', () => {
    const w = Object.fromEntries(GACHA_WEIGHTS);
    expect(w).toEqual({ none: 10, otc: 40, rx: 30, class2: 10, class1: 5, narcotic: 5 });
    expect(GACHA_WEIGHTS.reduce((a, [, v]) => a + v, 0)).toBe(100);
  });

  it('四个卡池齐全且卡牌合法', () => {
    expect(GACHA_POOLS.map((p) => p.id)).toEqual(['opioid', 'benzo', 'esketamine', 'stimulant']);
    for (const pool of GACHA_POOLS) {
      expect(pool.cardIds.length).toBeGreaterThan(0);
      for (const id of pool.cardIds) expect(CARD_MAP[id], id).toBeTruthy();
    }
    expect(GACHA_POOLS[2].cardIds).toContain('esketamine');
  });

  it('10 抽保底精二、30 抽保底精一/麻', () => {
    const pool = GACHA_POOLS[0];
    const r2 = rollOnce({ ...DEFAULT_PITY, pity2: 9 }, pool, () => 0.99);
    expect(['class2', 'class1', 'narcotic']).toContain(r2.rarity);
    const r1 = rollOnce({ ...DEFAULT_PITY, pity1: 29 }, pool, () => 0.99);
    expect(['class1', 'narcotic']).toContain(r1.rarity);
    const rN = rollOnce({ ...DEFAULT_PITY, pityN: 29 }, pool, () => 0.99);
    expect(rN.rarity).toBe('narcotic');
  });

  it('歪保底：guaranteed 时必得当前卡池', () => {
    const pool = GACHA_POOLS[2]; // esketamine
    const r = rollOnce({ ...DEFAULT_PITY, pity1: 29, guaranteed: true }, pool, () => 0.5);
    expect(pool.cardIds).toContain(r.cardId);
    expect(r.pity.guaranteed).toBe(false);
  });

  it('艾司氯胺酮为精一、瞬间回满心理，且不在敌方牌库', () => {
    const esk = CARD_MAP['esketamine'];
    expect(esk.rarity).toBe('class1');
    expect(esk.effects).toEqual([{ kind: 'heal', track: 'mental', amount: 99 }]);
    for (const battle of BATTLES) expect(battle.deck.includes('esketamine')).toBe(false);
  });
});
