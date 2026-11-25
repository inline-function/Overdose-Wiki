import { describe, expect, it } from 'vitest';
import { BATTLE_MAP, STARTER_DECK } from '../dlc/content';
import { createBattle, endPlayerTurn, playerPlay } from '../dlc/engine';

function fresh() {
  const s = createBattle(BATTLE_MAP['dlc-b1'], [...STARTER_DECK], 42);
  s.enemy.hand = []; s.enemy.deck = []; s.enemy.discard = [];
  s.enemy.phys = 999; s.enemy.maxPhys = 999; s.enemy.mental = 999; s.enemy.maxMental = 999;
  return s;
}

describe('DLC 状态分类核查', () => {
  it('永留状态回合末不衰减：血清素/解离/反解离/镇痛', () => {
    const s = fresh();
    s.player.statuses.serotonin = 20;
    s.player.statuses.dissociation = 2;
    s.player.statuses.counter = 2;
    s.player.statuses.analgesia = 2;
    endPlayerTurn(s);
    expect(s.player.statuses.serotonin).toBe(20);
    expect(s.player.statuses.dissociation).toBe(2);
    expect(s.player.statuses.counter).toBe(2);
    expect(s.player.statuses.analgesia).toBe(2);
  });

  it('回合制折半状态：嗜睡/呼吸抑制/谵妄', () => {
    const s = fresh();
    s.player.statuses.sedation = 12;
    s.player.statuses.respiratory = 12;
    s.player.statuses.delirium = 12;
    endPlayerTurn(s);
    expect(s.player.statuses.sedation).toBe(6);
    expect(s.player.statuses.respiratory).toBe(6);
    expect(s.player.statuses.delirium).toBe(6);
  });

  it('回合制持续状态：动机增强每回合 -1', () => {
    const s = fresh();
    s.player.statuses.motivation = 2;
    endPlayerTurn(s);
    expect(s.player.statuses.motivation).toBe(1);
  });

  it('止痛为消耗型：免疫一次伤害后清除', () => {
    const s = fresh();
    s.player.statuses.painkiller = 1;
    s.player.statuses.serotonin = 25;
    s.player.hand = ['sertraline'];
    // 爆发伤害被止痛免疫
    playerPlay(s, 0, 'player');
    expect(s.player.statuses.painkiller).toBe(0);
    expect(s.player.phys).toBe(60);
  });
});
