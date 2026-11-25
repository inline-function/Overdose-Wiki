import { describe, expect, it } from 'vitest';
import { BATTLE_MAP, CARD_MAP, STARTER_DECK } from '../dlc/content';
import { createBattle, endPlayerTurn, playerPlay } from '../dlc/engine';

function fresh(seed = 42) {
  const s = createBattle(BATTLE_MAP['dlc-b1'], [...STARTER_DECK], seed);
  s.enemy.hand = []; s.enemy.deck = []; s.enemy.discard = [];
  s.enemy.phys = 999; s.enemy.maxPhys = 999; s.enemy.mental = 999; s.enemy.maxMental = 999;
  return s;
}

describe('DLC 动机增强', () => {
  it('动机牌不再直接加 AP，而是给自己 2 回合动机增强', () => {
    const s = fresh();
    s.player.hand = ['caffeine'];
    const ap = s.player.ap;
    playerPlay(s, 0, 'player');
    expect(s.player.ap).toBe(ap - 1); // 只付出牌成本，不直接加 AP
    expect(s.player.statuses.motivation).toBe(2);
    expect(CARD_MAP['ephedrine'].effects).toEqual([{ kind: 'status', status: 'motivation', amount: 2 }]);
  });

  it('回合结束额外 +1 AP，持续 2 回合后消退', () => {
    const s = fresh();
    s.player.hand = ['caffeine'];
    playerPlay(s, 0, 'player'); // motivation 2, ap 2
    endPlayerTurn(s); // tick: +1 AP, motivation 1; 回合开始 +3
    expect(s.player.statuses.motivation).toBe(1);
    const apAfter = s.player.ap;
    endPlayerTurn(s); // tick: +1 AP, motivation 0
    expect(s.player.statuses.motivation).toBe(0);
    expect(s.player.ap).toBeGreaterThanOrEqual(apAfter); // 仍有回合 +3
  });

  it('重复使用叠加持续时间（上限 6）', () => {
    const s = fresh();
    s.player.hand = ['caffeine', 'caffeine', 'caffeine', 'caffeine'];
    s.player.ap = 5;
    playerPlay(s, 0, 'player');
    playerPlay(s, 0, 'player');
    playerPlay(s, 0, 'player');
    playerPlay(s, 0, 'player');
    expect(s.player.statuses.motivation).toBe(6); // 2*4=8 → 上限 6
  });
});
