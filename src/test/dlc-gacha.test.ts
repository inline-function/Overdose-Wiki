import { describe, expect, it } from 'vitest';
import { BATTLES, CARD_MAP, STAGES, STARTER_DECK } from '../dlc/content';
import { rollGacha } from '../dlc/store';

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

  it('抽卡可产出精一/麻，且只从对应稀有度池抽取', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 4000; i += 1) {
      const id = rollGacha(i / 4000);
      expect(CARD_MAP[id]).toBeTruthy();
      seen.add(CARD_MAP[id].rarity);
    }
    expect(seen.has('class1')).toBe(true);
    expect(seen.has('narcotic')).toBe(true);
  });

  it('艾司氯胺酮为精一、瞬间回满心理，且不在敌方牌库', () => {
    const esk = CARD_MAP['esketamine'];
    expect(esk.rarity).toBe('class1');
    expect(esk.effects).toEqual([{ kind: 'heal', track: 'mental', amount: 99 }]);
    for (const battle of BATTLES) expect(battle.deck.includes('esketamine')).toBe(false);
  });
});
