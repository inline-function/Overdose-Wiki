import { describe, expect, it } from 'vitest';
import { computeStats, upgradeCost, UPGRADE_DEFS, BATTLE_MAP, STARTER_DECK } from '../dlc/content';
import { createBattle, endPlayerTurn } from '../dlc/engine';

describe('DLC 属性强化', () => {
  it('默认属性 = 60/30/3AP/5上限/1抽', () => {
    expect(computeStats({})).toEqual({ maxPhys: 60, maxMental: 30, apPerTurn: 3, apCap: 5, drawPerTurn: 1 });
  });

  it('生理/心理增量保持 ×2，AP/抽牌叠加', () => {
    const s = computeStats({ phys: 2, mental: 2, ap: 1, apCap: 1, draw: 1 });
    expect(s.maxPhys).toBe(76);
    expect(s.maxMental).toBe(38);
    expect(s.maxPhys).toBe(s.maxMental * 2);
    expect(s.apPerTurn).toBe(4);
    expect(s.apCap).toBe(6);
    expect(s.drawPerTurn).toBe(2);
  });

  it('费用随等级递增', () => {
    expect(upgradeCost('phys', 0)).toBe(UPGRADE_DEFS.phys.baseCost);
    expect(upgradeCost('phys', 2)).toBe(UPGRADE_DEFS.phys.baseCost + UPGRADE_DEFS.phys.costStep * 2);
  });

  it('引擎读取强化属性：上限/初始AP/抽牌/回合AP', () => {
    const s = createBattle(BATTLE_MAP['dlc-b1'], [...STARTER_DECK], 1, {
      maxPhys: 100, maxMental: 50, apPerTurn: 5, apCap: 8, drawPerTurn: 2,
    });
    expect(s.player.maxPhys).toBe(100);
    expect(s.player.maxMental).toBe(50);
    expect(s.player.ap).toBe(5);
    expect(s.player.hand.length).toBe(6); // 4 起手 + 2 免费抽
    s.enemy.hand = []; s.enemy.deck = []; s.enemy.discard = [];
    s.enemy.phys = 999; s.enemy.maxPhys = 999; s.enemy.mental = 999; s.enemy.maxMental = 999;
    endPlayerTurn(s);
    expect(s.player.ap).toBe(8); // 5+5=10 → 上限 8
  });
});
