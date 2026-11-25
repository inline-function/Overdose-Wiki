// 8 关可胜模拟：种子贪心玩家打通整个战役，验证平衡。
// 牌组随奖励成长（引擎不强制 12 张；UI 层另有限制）。
import { describe, expect, it } from 'vitest';
import { BATTLES, CARD_MAP, STAGES, STARTER_DECK } from '../dlc/content';
import { createBattle, endPlayerTurn, playerDraw, playerPlay, type BattleState, type Side } from '../dlc/engine';
import type { Card } from '../dlc/types';

function score(card: Card, s: BattleState, target: Side): number {
  const me = s.player;
  const foe = s.enemy;
  const mine = target === 'player';
  let value = 0;
  for (const e of card.effects) {
    if (e.kind === 'damage') value += mine ? -e.amount : e.amount * 1.3;
    const lowMental = me.mental < me.maxMental * 0.6;
    if (e.kind === 'heal') {
      const max = e.track === 'phys' ? me.maxPhys : me.maxMental;
      const missing = max - me[e.track];
      const gain = Math.min(e.amount, missing);
      const urgent = e.track === 'mental' && lowMental ? 2.6 : missing > max * 0.4 ? 1.4 : 0.4;
      value += mine ? gain * urgent : -gain;
    }
    if (e.kind === 'status') {
      const harmful = ['serotonin', 'sedation', 'respiratory', 'delirium', 'counter'].includes(e.status);
      if (e.status === 'serotonin' && !mine) {
        value += e.amount * 1.1 + (foe.statuses.serotonin + e.amount >= 30 ? 16 : 0);
      } else if (harmful) {
        value += mine ? -e.amount * 0.8 : e.amount * 0.7;
      } else {
        value += mine ? e.amount * (lowMental ? 6 : 3) : -e.amount * 3;
      }
    }
    if (e.kind === 'ap') value += mine ? e.amount * 2.2 : 0;
    if (e.kind === 'clear') {
      const removed = Math.min(e.amount, me.statuses[e.status]);
      value += mine ? removed * 1.2 : -removed;
    }
  }
  return value;
}

function playTurn(s: BattleState): void {
  let guard = 0;
  while (s.player.ap > 0 && s.outcome === 'ongoing' && guard < 16) {
    guard += 1;
    // 手牌不足时花 1 AP 抽牌，维持出牌节奏（规则：+卡抽牌耗 1 AP）
    if (s.player.hand.length <= 2 && s.player.ap >= 2 &&
        (s.player.deck.length > 0 || s.player.discard.length > 0)) {
      playerDraw(s);
      continue;
    }
    let best: { i: number; t: Side; v: number } | null = null;
    for (let i = 0; i < s.player.hand.length; i += 1) {
      const card = CARD_MAP[s.player.hand[i]];
      if (!card) continue;
      for (const t of ['player', 'enemy'] as Side[]) {
        const v = score(card, s, t);
        if (!best || v > best.v) best = { i, t, v };
      }
    }
    if (!best || best.v <= 0) break;
    playerPlay(s, best.i, best.t);
  }
}

function fight(stageIndex: number, deck: string[], seed: number): { won: boolean; turns: number } {
  const s = createBattle(BATTLES[stageIndex], deck, seed);
  let turns = 0;
  while (s.outcome === 'ongoing' && turns < 60) {
    playTurn(s);
    if (s.outcome !== 'ongoing') break;
    endPlayerTurn(s);
    turns += 1;
  }
  return { won: s.outcome === 'win', turns };
}

describe('DLC 战役 · 8 关可胜', () => {
  it('贪心玩家 + 奖励成长可打通全部 8 关', () => {
    let deck = [...STARTER_DECK];
    const report: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      const stage = STAGES[i];
      let won = false;
      let turns = 0;
      for (const seed of [11, 23, 47]) {
        const result = fight(i, deck, seed);
        if (result.won) { won = true; turns = result.turns; break; }
      }
      report.push(`b${i + 1} ${won ? 'WIN' : 'LOSE'} (${turns} turns)`);
      expect(won, `stage ${i + 1} should be winnable`).toBe(true);
      // 奖励入组：优先心理回复，其次血清素，再否则第一张（模拟 competent 选择）
      const reward =
        stage.rewards.find((id) => CARD_MAP[id]?.effects.some((e) => e.kind === 'heal' && e.track === 'mental')) ??
        stage.rewards.find((id) => CARD_MAP[id]?.tags.includes('serotonin')) ??
        stage.rewards[0];
      deck = [...deck, reward];
    }
    console.log(report.join(' | '));
  });
});
