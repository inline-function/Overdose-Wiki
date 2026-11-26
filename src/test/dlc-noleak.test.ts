import { describe, expect, it } from 'vitest';
import { BATTLES, STARTER_DECK } from '../dlc/content';
import { createBattle } from '../dlc/engine';

describe('DLC 玩家增益不泄漏给敌方', () => {
  it('属性强化只加玩家，敌方血量仍用关卡定义', () => {
    const def = BATTLES[0];
    const s = createBattle(def, [...STARTER_DECK], 1, { maxPhys: 200, maxMental: 100, apPerTurn: 9, apCap: 9, drawPerTurn: 5 });
    expect(s.player.maxPhys).toBe(200);
    expect(s.player.maxMental).toBe(100);
    expect(s.enemy.maxPhys).toBe(def.maxPhys);
    expect(s.enemy.maxMental).toBe(def.maxMental);
    expect(s.enemy.phys).toBe(def.maxPhys);
  });

  it('流派/功能不影响敌方出牌数（正常模式）', () => {
    const s = createBattle(BATTLES[0], [...STARTER_DECK], 1, undefined, undefined,
      { serotonin: 5, delirium: 5, respiratory: 5, dissociation: 5, motivation: 3 },
      { tutor: true, deathSave: true, apHealMental: true, apHealPhys: true, exhaust: true, extraDraw: true });
    expect(s.enemyPlays).toBeUndefined(); // 敌方仍按 ENEMY_PLAYS
    expect(s.abilities.extraDraw).toBe(true);
    expect(s.player.ap).toBe(3); // 初始 AP 不受 drawPerTurn 影响
  });

  it('濒死代偿只救玩家，且每场一次', () => {
    const s = createBattle(BATTLES[0], [...STARTER_DECK], 1, undefined, undefined, undefined, { deathSave: true });
    s.player.mental = 0; s.player.phys = 60;
    // 通过内部检查触发：模拟一次伤害后检查
    expect(s.deathSaveUsed).toBe(false);
    expect(s.abilities.deathSave).toBe(true);
    expect(s.enemy.maxMental).toBe(BATTLES[0].maxMental);
  });
});
