import { describe, expect, it } from 'vitest';
import { BATTLES, BATTLE_MAP, CARD_MAP, STARTER_DECK } from '../dlc/content';
import {
  createBattle, endPlayerTurn, playerDraw, playerPlay,
  AP_CAP, HAND_CAP, type BattleState,
} from '../dlc/engine';

function fresh(seed = 42): BattleState {
  return createBattle(BATTLE_MAP['dlc-b1'], [...STARTER_DECK], seed);
}

function setHand(state: BattleState, ids: string[]): void {
  state.player.hand = [...ids];
}

describe('DLC 引擎 · AP 与抽牌', () => {
  it('初始 3 AP，出牌耗 1，回合 +3 上限 5 且跨回合保留', () => {
    const s = fresh();
    s.enemy.hand = []; s.enemy.deck = []; s.enemy.discard = []; // 隔离敌方，纯测 AP 经济
    s.enemy.phys = 999; s.enemy.maxPhys = 999; s.enemy.mental = 999; s.enemy.maxMental = 999;
    expect(s.player.ap).toBe(3);
    playerPlay(s, 0, 'enemy');
    expect(s.player.ap).toBe(2);
    endPlayerTurn(s);
    expect(s.player.ap).toBe(AP_CAP); // 2+3=5
    playerPlay(s, 0, 'enemy');
    playerPlay(s, 0, 'enemy');
    expect(s.player.ap).toBe(3);
    endPlayerTurn(s);
    expect(s.player.ap).toBe(AP_CAP); // 3+3=6 → 5
  });

  it('0 AP 不能出牌也不能抽牌', () => {
    const s = fresh();
    s.player.ap = 0;
    const hand = [...s.player.hand];
    expect(playerPlay(s, 0, 'enemy')).toHaveLength(0);
    expect(playerDraw(s)).toHaveLength(0);
    expect(s.player.hand).toEqual(hand);
  });

  it('回合开始免费抽 1；+抽牌耗 1 AP；手牌上限 8', () => {
    const s = fresh();
    const before = s.player.hand.length;
    endPlayerTurn(s);
    expect(s.player.hand.length).toBe(Math.min(HAND_CAP, before - 0 + 1)); // 未出牌，+1
    const ap = s.player.ap;
    setHand(s, ['sertraline']);
    s.player.deck = ['fluoxetine', 'caffeine'];
    playerDraw(s);
    expect(s.player.ap).toBe(ap - 1);
    expect(s.player.hand).toContain('fluoxetine');
    setHand(s, Array(HAND_CAP).fill('sertraline'));
    expect(playerDraw(s)).toHaveLength(0);
  });

  it('牌库耗尽洗回弃牌', () => {
    const s = fresh();
    s.player.deck = [];
    s.player.discard = ['caffeine', 'magnesium'];
    setHand(s, []);
    const events = playerDraw(s);
    expect(events.some((e) => e.kind === 'shuffle')).toBe(true);
    expect(s.player.hand).toHaveLength(1);
    expect(s.player.discard).toHaveLength(0);
  });
});

describe('DLC 引擎 · 血清素', () => {
  it('达到 30 触发中量生理+大量心理，清零，每回合一次', () => {
    const s = fresh();
    s.player.statuses.serotonin = 25;
    setHand(s, ['sertraline', 'sertraline']);
    playerPlay(s, 0, 'player'); // +8 → 33
    expect(s.player.statuses.serotonin).toBe(0);
    expect(s.player.phys).toBe(50); // 60-10
    expect(s.player.mental).toBe(16); // 30-14
    playerPlay(s, 0, 'player'); // 再 +12，不触发
    expect(s.player.statuses.serotonin).toBe(12);
    expect(s.player.phys).toBe(50);
    endPlayerTurn(s);
    s.player.statuses.serotonin = 25;
    setHand(s, ['sertraline']);
    playerPlay(s, 0, 'player');
    expect(s.player.phys).toBe(40); // 新回合再触发
  });

  it('爆发伤害走伤害管线（镇痛可减）', () => {
    const s = fresh();
    s.player.statuses.analgesia = 2;
    s.player.statuses.serotonin = 25;
    setHand(s, ['sertraline']);
    playerPlay(s, 0, 'player');
    expect(s.player.phys).toBe(58); // 10 - ceil(10/3)*2 = 2
    expect(s.player.mental).toBe(26); // 14 - ceil(14/3)*2 = 4
  });
});

describe('DLC 引擎 · 嗜睡', () => {
  it('10/20/30 让回合 AP -1/-2/-3，回合末减半', () => {
    for (const [sed, penalty] of [[10, 1], [20, 2], [30, 3]] as const) {
      const s = fresh();
      s.player.ap = 0;
      s.player.statuses.sedation = sed;
      endPlayerTurn(s);
      expect(s.player.ap).toBe(3 - penalty);
      expect(s.player.statuses.sedation).toBe(Math.floor(sed / 2));
    }
  });

  it('40 昏睡一回合：不涨 AP、不出牌', () => {
    const s = fresh();
    s.player.ap = 5;
    s.player.statuses.sedation = 40;
    s.player.asleep = true;
    const turn = s.turn;
    endPlayerTurn(s);
    expect(s.player.ap).toBe(5); // 跳过回合，不 +3
    expect(s.turn).toBe(turn + 1);
    expect(s.player.statuses.sedation).toBe(20); // 40→20（每回合减半一次）
    expect(s.player.asleep).toBe(false);
  });
});

describe('DLC 引擎 · 呼吸抑制', () => {
  it('出牌后按层数 2/4/6，3 次/回合封顶，回合末减半', () => {
    const s = fresh();
    s.player.statuses.respiratory = 12; // 档 4
    s.player.ap = 5;
    setHand(s, ['caffeine', 'caffeine', 'caffeine', 'caffeine']);
    playerPlay(s, 0, 'enemy');
    playerPlay(s, 0, 'enemy');
    playerPlay(s, 0, 'enemy');
    expect(s.player.phys).toBe(48); // 3×4
    playerPlay(s, 0, 'enemy'); // 第 4 次不再触发
    expect(s.player.phys).toBe(48);
    endPlayerTurn(s);
    expect(s.player.statuses.respiratory).toBe(6);
  });

  it('层数档位 <10→2, <20→4, ≥20→6', () => {
    for (const [resp, dmg] of [[5, 2], [12, 4], [22, 6]] as const) {
      const s = fresh();
      s.player.statuses.respiratory = resp;
      setHand(s, ['sertraline']);
      playerPlay(s, 0, 'enemy');
      expect(s.player.phys).toBe(60 - dmg);
    }
  });
});

describe('DLC 引擎 · 谵妄', () => {
  it('跨 10 随机打出 1 张并受 2 生理+4 心理；每回合上限 2 张', () => {
    const s = fresh(7);
    s.player.statuses.delirium = 9;
    s.player.ap = 5;
    setHand(s, ['scopolamine', 'sertraline', 'caffeine', 'magnesium']);
    playerPlay(s, 0, 'player'); // +10 → 19 跨 10
    expect(s.player.phys).toBe(58);
    expect(s.player.mental).toBe(26);
    expect(s.player.deliriumCards).toBe(1);
    expect(s.player.hand.length).toBe(2); // 苯海索? scopolamine + 随机 1
    // 再跨 20：还能打 1 张
    s.player.statuses.delirium = 19;
    setHand(s, ['scopolamine', 'sertraline', 'caffeine']);
    playerPlay(s, 0, 'player'); // → 29 跨 20
    expect(s.player.deliriumCards).toBe(2);
    // 跨 30：不再打牌，但仍受伤害
    s.player.statuses.delirium = 29;
    setHand(s, ['scopolamine', 'sertraline']);
    const phys = s.player.phys;
    playerPlay(s, 0, 'player');
    expect(s.player.deliriumCards).toBe(2);
    expect(s.player.phys).toBe(phys - 2);
    endPlayerTurn(s);
    expect(s.player.statuses.delirium).toBe(19); // 39 减半
  });
});

describe('DLC 引擎 · 解离/反解离', () => {
  it('每层 ±20% 伤害与状态量，上限 3，不衰减', () => {
    const s = fresh();
    s.player.statuses.dissociation = 2;
    s.player.statuses.serotonin = 10;
    setHand(s, ['sertraline', 'memantine']);
    playerPlay(s, 0, 'player'); // +12×0.6=7，不触发爆发
    expect(s.player.phys).toBe(60);
    expect(s.player.statuses.serotonin).toBe(17);
    s.player.statuses.serotonin = 25;
    setHand(s, ['sertraline']);
    playerPlay(s, 0, 'player'); // 爆发 10×0.6=6
    expect(s.player.phys).toBe(54);
    setHand(s, ['memantine']);
    playerPlay(s, 0, 'player'); // memantine +1 → 3
    expect(s.player.statuses.dissociation).toBe(3);
    endPlayerTurn(s);
    expect(s.player.statuses.dissociation).toBe(3); // 不衰减
    const t = fresh();
    t.player.statuses.counter = 2;
    t.player.statuses.serotonin = 25;
    setHand(t, ['sertraline']);
    playerPlay(t, 0, 'player'); // 10×1.4=14
    expect(t.player.phys).toBe(46);
  });
});

describe('DLC 引擎 · 镇痛/止痛', () => {
  it('每层减 ceil(原伤/3)，不阻止状态附着', () => {
    const s = fresh();
    s.player.statuses.analgesia = 1;
    s.player.statuses.serotonin = 25;
    setHand(s, ['sertraline']);
    playerPlay(s, 0, 'player');
    expect(s.player.phys).toBe(54); // 10-ceil(10/3)=6 → 60-6
    expect(s.player.statuses.serotonin).toBe(0); // 状态照常附着并爆发
  });

  it('3 层合成 1 层止痛；止痛免疫一次伤害', () => {
    const s = fresh();
    s.player.statuses.analgesia = 2;
    setHand(s, ['magnesium', 'sertraline']);
    playerPlay(s, 0, 'player'); // +1 → 3 → 止痛 1
    expect(s.player.statuses.analgesia).toBe(0);
    expect(s.player.statuses.painkiller).toBe(1);
    s.player.statuses.serotonin = 25;
    playerPlay(s, 0, 'player'); // 爆发：生理被免疫，心理仍生效
    expect(s.player.phys).toBe(60);
    expect(s.player.mental).toBe(16);
    expect(s.player.statuses.painkiller).toBe(0);
  });
});

describe('DLC 引擎 · 补剂与胜负', () => {
  it('补剂只恢复不造成伤害', () => {
    const s = fresh();
    s.enemy.phys = 10;
    setHand(s, ['vitamin_b6']);
    const events = playerPlay(s, 0, 'enemy');
    expect(events.some((e) => e.kind === 'damage')).toBe(false);
    expect(s.enemy.phys).toBe(12);
  });

  it('任一轨归零判负；敌人归零判胜', () => {
    const win = fresh();
    win.enemy.mental = 1;
    setHand(win, ['venlafaxine']);
    playerPlay(win, 0, 'enemy');
    expect(win.outcome).toBe('win');
    const lose = fresh();
    lose.player.phys = 2;
    lose.player.statuses.serotonin = 25;
    setHand(lose, ['sertraline']);
    playerPlay(lose, 0, 'player');
    expect(lose.outcome).toBe('lose');
  });

  it('b8 二阶段：玩家生理≤50 触发，伤害 +25%', () => {
    const s = createBattle(BATTLE_MAP['dlc-b8'], [...STARTER_DECK], 3);
    s.player.phys = 50;
    setHand(s, ['caffeine', 'venlafaxine']);
    playerPlay(s, 0, 'enemy'); // 触发二阶段
    expect(s.phase2).toBe(true);
    playerPlay(s, 0, 'enemy'); // 此后伤害 +25%
    expect(s.enemy.mental).toBe(s.enemy.maxMental - 3); // 2×1.25=2.5→3
  });
});

describe('DLC 引擎 · 敌方 AI', () => {
  it('敌人每回合按关卡出牌，伤害牌打玩家', () => {
    const s = fresh();
    const phys = s.player.phys + s.player.mental;
    endPlayerTurn(s);
    const after = s.player.phys + s.player.mental;
    expect(after).toBeLessThanOrEqual(phys); // b1 敌人至少造成净伤害或状态
    expect(s.enemy.hand.length).toBeLessThan(4); // 抽 1 打 1
  });

  it('8 个战斗定义齐全且牌库合法', () => {
    expect(BATTLES).toHaveLength(8);
    for (const battle of BATTLES) {
      expect(battle.deck.length).toBeGreaterThanOrEqual(10);
      for (const id of battle.deck) expect(CARD_MAP[id]).toBeTruthy();
      expect(battle.maxPhys).toBe(battle.maxMental * 2);
    }
  });
});
