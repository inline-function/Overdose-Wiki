import { describe, expect, it } from 'vitest';
import { BATTLES, STARTER_DECK } from '../dlc/content';
import { createBattle, endPlayerTurn } from '../dlc/engine';

describe('DLC 无尽模式', () => {
  it('enemyPlays 覆盖生效', () => {
    const s = createBattle(BATTLES[0], [...STARTER_DECK], 1, undefined, 4);
    expect(s.enemyPlays).toBe(4);
    // 敌方手牌充足时一回合打 4 张
    s.enemy.hand = ['sertraline', 'sertraline', 'sertraline', 'sertraline', 'sertraline'];
    s.enemy.deck = [];
    const before = s.enemy.hand.length;
    endPlayerTurn(s);
    expect(before - s.enemy.hand.length).toBeGreaterThanOrEqual(1);
  });

  it('波次缩放保持生理=心理×2', () => {
    const base = BATTLES[0];
    for (const wave of [1, 3, 5, 10]) {
      const scale = 1 + 0.2 * (wave - 1);
      const mental = Math.round(base.maxMental * scale);
      const phys = mental * 2;
      expect(phys).toBe(mental * 2);
      const s = createBattle({ ...base, maxPhys: phys, maxMental: mental }, [...STARTER_DECK], wave);
      expect(s.enemy.maxPhys).toBe(phys);
      expect(s.enemy.maxMental).toBe(mental);
    }
  });

  it('默认模式不覆盖出牌数', () => {
    const s = createBattle(BATTLES[0], [...STARTER_DECK], 1);
    expect(s.enemyPlays).toBeUndefined();
  });
});
