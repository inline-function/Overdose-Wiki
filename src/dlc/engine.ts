// DLC 战斗引擎：纯逻辑 + 事件流。规则见 DLC_DESIGN_NOTES.md（已确认版）。
import type { BattleDef, Card, LocaleText, PlayerStats, StatusId, Track } from './types';
import { CARD_MAP } from './content';

export type Side = 'player' | 'enemy';

export type Combatant = {
  phys: number;
  mental: number;
  maxPhys: number;
  maxMental: number;
  statuses: Record<StatusId, number>;
  serotoninFired: boolean;
  respTriggers: number;
  deliriumCards: number;
  asleep: boolean;
  deck: string[];
  hand: string[];
  discard: string[];
};

export type PlayerCombatant = Combatant & { ap: number };

export type BattleEvent = { id: number } & (
  | { kind: 'play'; side: Side; cardId: string; target: Side }
  | { kind: 'damage'; side: Side; track: Track; amount: number; heavy: boolean }
  | { kind: 'heal'; side: Side; track: Track; amount: number }
  | { kind: 'status'; side: Side; status: StatusId; amount: number }
  | { kind: 'clear'; side: Side; status: StatusId }
  | { kind: 'immune'; side: Side }
  | { kind: 'burst'; side: Side }
  | { kind: 'ap'; side: Side; amount: number }
  | { kind: 'draw'; side: Side; cardId: string }
  | { kind: 'shuffle'; side: Side }
  | { kind: 'sleep'; side: Side }
  | { kind: 'turn'; side: Side; turn: number }
  | { kind: 'phase2' }
  | { kind: 'win' }
  | { kind: 'lose' }
  | { kind: 'log'; text: LocaleText }
);

export type BattleState = {
  def: BattleDef;
  turn: number;
  active: Side;
  player: PlayerCombatant;
  enemy: Combatant;
  phase2: boolean;
  outcome: 'ongoing' | 'win' | 'lose';
  rng: () => number;
  serial: number;
  stats: PlayerStats;
  /** 无尽模式：覆盖敌方每回合出牌数。 */
  enemyPlays?: number;
};

export const PLAYER_MAX_PHYS = 60;
export const PLAYER_MAX_MENTAL = 30;
export const AP_PER_TURN = 3;
export const AP_CAP = 5;
export const HAND_CAP = 8;
export const OPENING_HAND = 4;
export const SEROTONIN_THRESHOLD = 30;
export const BURST_PHYS = 10;
export const BURST_MENTAL = 14;
export const ENEMY_PLAYS = [1, 1, 2, 2, 2, 2, 3, 5];

const ZERO_STATUSES = (): Record<StatusId, number> => ({
  serotonin: 0, sedation: 0, respiratory: 0, delirium: 0,
  dissociation: 0, counter: 0, analgesia: 0, painkiller: 0, motivation: 0,
});

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeCombatant(maxPhys: number, maxMental: number, deck: string[], rng: () => number): Combatant {
  return {
    phys: maxPhys, mental: maxMental, maxPhys, maxMental,
    statuses: ZERO_STATUSES(),
    serotoninFired: false, respTriggers: 0, deliriumCards: 0, asleep: false,
    deck: shuffle(deck, rng), hand: [], discard: [],
  };
}

export function createBattle(
  def: BattleDef,
  playerDeck: string[],
  seed: number,
  stats?: Partial<PlayerStats>,
  enemyPlays?: number,
): BattleState {
  const rng = mulberry32(seed);
  const s: PlayerStats = {
    maxPhys: PLAYER_MAX_PHYS,
    maxMental: PLAYER_MAX_MENTAL,
    apPerTurn: AP_PER_TURN,
    apCap: AP_CAP,
    drawPerTurn: 1,
    ...stats,
  };
  const state: BattleState = {
    def,
    turn: 1,
    active: 'player',
    player: { ...makeCombatant(s.maxPhys, s.maxMental, playerDeck, rng), ap: s.apPerTurn },
    enemy: makeCombatant(def.maxPhys, def.maxMental, def.deck, rng),
    phase2: false,
    outcome: 'ongoing',
    rng,
    serial: 0,
    stats: s,
    enemyPlays,
  };
  for (let i = 0; i < OPENING_HAND; i += 1) drawCard(state, 'player');
  for (let i = 0; i < s.drawPerTurn; i += 1) drawCard(state, 'player'); // 第一回合免费抽
  for (let i = 0; i < 3; i += 1) drawCard(state, 'enemy');
  return state;
}

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never;

function emit(state: BattleState, event: WithoutId<BattleEvent>): BattleEvent {
  state.serial += 1;
  return { id: state.serial, ...event } as BattleEvent;
}

function combatant(state: BattleState, side: Side): Combatant {
  return side === 'player' ? state.player : state.enemy;
}

function other(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

function drawCard(state: BattleState, side: Side, events?: BattleEvent[]): BattleEvent | null {
  const c = combatant(state, side);
  if (c.hand.length >= HAND_CAP) return null;
  if (c.deck.length === 0) {
    if (c.discard.length === 0) return null;
    c.deck = shuffle(c.discard, state.rng);
    c.discard = [];
    const shuffled = emit(state, { kind: 'shuffle', side });
    if (events) events.push(shuffled);
  }
  const cardId = c.deck.shift();
  if (!cardId) return null;
  c.hand.push(cardId);
  return emit(state, { kind: 'draw', side, cardId });
}

function checkOutcome(state: BattleState, events: BattleEvent[]): void {
  if (state.outcome !== 'ongoing') return;
  if (state.enemy.phys <= 0 || state.enemy.mental <= 0) {
    state.outcome = 'win';
    events.push(emit(state, { kind: 'win' }));
  } else if (state.player.phys <= 0 || state.player.mental <= 0) {
    state.outcome = 'lose';
    events.push(emit(state, { kind: 'lose' }));
  }
}

/** 伤害管线：止痛免疫 → 镇痛每层减 ceil(原伤/3) → 解离/反解离 ±20%。 */
function dealDamage(state: BattleState, side: Side, track: Track, amount: number, events: BattleEvent[]): void {
  if (amount <= 0 || state.outcome !== 'ongoing') return;
  const c = combatant(state, side);
  if (c.statuses.painkiller > 0) {
    c.statuses.painkiller -= 1;
    events.push(emit(state, { kind: 'immune', side }));
    return;
  }
  let dmg = amount;
  if (c.statuses.analgesia > 0) {
    dmg = Math.max(0, dmg - Math.ceil(amount / 3) * c.statuses.analgesia);
  }
  const mod = 1 - 0.2 * c.statuses.dissociation + 0.2 * c.statuses.counter;
  dmg = Math.round(dmg * mod);
  if (dmg <= 0) return;
  c[track] = Math.max(0, c[track] - dmg);
  events.push(emit(state, { kind: 'damage', side, track, amount: dmg, heavy: dmg >= 6 }));
  checkOutcome(state, events);
}

function heal(state: BattleState, side: Side, track: Track, amount: number, events: BattleEvent[]): void {
  if (amount <= 0) return;
  const c = combatant(state, side);
  const max = track === 'phys' ? c.maxPhys : c.maxMental;
  const gained = Math.min(amount, max - c[track]);
  if (gained <= 0) return;
  c[track] += gained;
  events.push(emit(state, { kind: 'heal', side, track, amount: gained }));
}

const HARMFUL: ReadonlySet<StatusId> = new Set(['serotonin', 'sedation', 'respiratory', 'delirium', 'counter']);

function applyStatus(state: BattleState, side: Side, status: StatusId, amount: number, percent: number | undefined, events: BattleEvent[]): void {
  const c = combatant(state, side);
  let gain = amount + (percent ? Math.ceil(c.statuses[status] * percent) : 0);
  const mod = 1 - 0.2 * c.statuses.dissociation + 0.2 * c.statuses.counter;
  gain = Math.round(gain * mod);
  if (gain <= 0) return;
  const before = c.statuses[status];
  c.statuses[status] += gain;
  if (status === 'dissociation' || status === 'counter') {
    c.statuses[status] = Math.min(3, c.statuses[status]);
  }
  if (status === 'painkiller') c.statuses.painkiller = Math.min(1, c.statuses.painkiller);
  if (status === 'motivation') c.statuses.motivation = Math.min(6, c.statuses.motivation);
  if (status === 'analgesia') {
    while (c.statuses.analgesia >= 3) {
      c.statuses.analgesia -= 3;
      c.statuses.painkiller = Math.min(1, c.statuses.painkiller + 1);
      events.push(emit(state, { kind: 'status', side, status: 'painkiller', amount: 1 }));
    }
  }
  events.push(emit(state, { kind: 'status', side, status, amount: gain }));
  if (status === 'serotonin' && c.statuses.serotonin >= SEROTONIN_THRESHOLD && !c.serotoninFired) {
    c.serotoninFired = true;
    c.statuses.serotonin = 0;
    events.push(emit(state, { kind: 'burst', side }));
    dealDamage(state, side, 'phys', BURST_PHYS, events);
    dealDamage(state, side, 'mental', BURST_MENTAL, events);
  }
  if (status === 'sedation' && c.statuses.sedation >= 40 && !c.asleep) {
    c.asleep = true;
    events.push(emit(state, { kind: 'sleep', side }));
  }
  if (status === 'delirium') {
    const now = c.statuses.delirium;
    const crossed = (before < 10 && now >= 10) || (before < 20 && now >= 20) || (before < 30 && now >= 30);
    if (crossed) triggerDelirium(state, side, events);
  }
}

/** 谵妄：10/20/30 随机打出 1/2/3 张（每回合共上限 2 张）+ 少量生理 + 中量心理。 */
function triggerDelirium(state: BattleState, side: Side, events: BattleEvent[]): void {
  const c = combatant(state, side);
  const band = c.statuses.delirium >= 30 ? 3 : c.statuses.delirium >= 20 ? 2 : 1;
  const want = Math.min(band, 2 - c.deliriumCards);
  dealDamage(state, side, 'phys', 2, events);
  dealDamage(state, side, 'mental', 4, events);
  for (let i = 0; i < want; i += 1) {
    if (c.hand.length === 0 || state.outcome !== 'ongoing') break;
    const index = Math.floor(state.rng() * c.hand.length);
    const target: Side = state.rng() < 0.5 ? side : other(side);
    c.deliriumCards += 1;
    playFromHand(state, side, index, target, events, true);
  }
}

function applyEffects(state: BattleState, user: Side, card: Card, target: Side, events: BattleEvent[]): void {
  for (const effect of card.effects) {
    if (state.outcome !== 'ongoing') break;
    switch (effect.kind) {
      case 'damage': {
        let amount = effect.amount;
        if (user === 'player' && state.phase2) amount = Math.round(amount * 1.25);
        dealDamage(state, target, effect.track, amount, events);
        break;
      }
      case 'heal':
        heal(state, target, effect.track, effect.amount, events);
        break;
      case 'status':
        applyStatus(state, target, effect.status, effect.amount, effect.percent, events);
        break;
      case 'ap':
        if (user === 'player') {
          state.player.ap = Math.max(0, Math.min(state.stats.apCap, state.player.ap + effect.amount));
          events.push(emit(state, { kind: 'ap', side: 'player', amount: effect.amount }));
        }
        break;
      case 'clear': {
        const c = combatant(state, target);
        const removed = Math.min(effect.amount, c.statuses[effect.status]);
        if (removed > 0) {
          c.statuses[effect.status] -= removed;
          events.push(emit(state, { kind: 'clear', side: target, status: effect.status }));
        }
        break;
      }
    }
  }
}

/** 呼吸抑制：每次出牌后按层数 2/4/6，3 次/回合封顶。 */
function respiratoryTick(state: BattleState, side: Side, events: BattleEvent[]): void {
  const c = combatant(state, side);
  if (c.statuses.respiratory <= 0 || c.respTriggers >= 3) return;
  const band = c.statuses.respiratory >= 20 ? 6 : c.statuses.respiratory >= 10 ? 4 : 2;
  c.respTriggers += 1;
  dealDamage(state, side, 'phys', band, events);
}

function playFromHand(state: BattleState, side: Side, handIndex: number, target: Side, events: BattleEvent[], free: boolean): void {
  const c = combatant(state, side);
  const cardId = c.hand[handIndex];
  const card = CARD_MAP[cardId];
  if (!card) return;
  if (!free && side === 'player') {
    if (state.player.ap <= 0) return;
    state.player.ap -= 1;
  }
  c.hand.splice(handIndex, 1);
  c.discard.push(cardId);
  events.push(emit(state, { kind: 'play', side, cardId, target }));
  applyEffects(state, side, card, target, events);
  respiratoryTick(state, side, events);
  maybePhase2(state, events);
}

function maybePhase2(state: BattleState, events: BattleEvent[]): void {
  const at = state.def.phase2At;
  if (at === undefined || state.phase2 || state.outcome !== 'ongoing') return;
  if (state.player.phys <= at) {
    state.phase2 = true;
    events.push(emit(state, { kind: 'phase2' }));
    if (state.def.phase2Log) events.push(emit(state, { kind: 'log', text: state.def.phase2Log }));
  }
}

// ---------- 玩家动作 ----------

export function playerPlay(state: BattleState, handIndex: number, target: Side): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (state.outcome !== 'ongoing' || state.active !== 'player' || state.player.ap <= 0) return events;
  if (handIndex < 0 || handIndex >= state.player.hand.length) return events;
  playFromHand(state, 'player', handIndex, target, events, false);
  return events;
}

export function playerDraw(state: BattleState): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (state.outcome !== 'ongoing' || state.active !== 'player' || state.player.ap <= 0) return events;
  if (state.player.hand.length >= HAND_CAP) return events;
  if (state.player.deck.length === 0 && state.player.discard.length === 0) return events;
  state.player.ap -= 1;
  const event = drawCard(state, 'player', events);
  if (event) events.push(event);
  return events;
}

function decay(state: BattleState, side: Side): void {
  const c = combatant(state, side);
  // 回合制（回合末折半）：嗜睡、呼吸抑制、谵妄。永留：血清素/解离/反解离/镇痛。
  c.statuses.sedation = Math.floor(c.statuses.sedation / 2);
  c.statuses.respiratory = Math.floor(c.statuses.respiratory / 2);
  c.statuses.delirium = Math.floor(c.statuses.delirium / 2);
  c.respTriggers = 0;
  c.deliriumCards = 0;
}

function startTurn(state: BattleState, side: Side, events: BattleEvent[]): void {
  state.active = side;
  state.player.serotoninFired = false;
  state.enemy.serotoninFired = false;
  const c = combatant(state, side);
  if (c.asleep) {
    c.asleep = false;
    events.push(emit(state, { kind: 'sleep', side }));
    decay(state, side);
    return;
  }
  if (side === 'player') {
    state.player.ap = Math.min(state.stats.apCap, state.player.ap + state.stats.apPerTurn);
    const sed = c.statuses.sedation;
    const penalty = sed >= 30 ? 3 : sed >= 20 ? 2 : sed >= 10 ? 1 : 0;
    if (penalty > 0) {
      state.player.ap = Math.max(0, state.player.ap - penalty);
      events.push(emit(state, { kind: 'ap', side: 'player', amount: -penalty }));
    }
  }
  decay(state, side); // 上一回合的状态在此减半
  const draws = side === 'player' ? state.stats.drawPerTurn : 1;
  for (let i = 0; i < draws; i += 1) {
    const drawn = drawCard(state, side, events);
    if (drawn) events.push(drawn);
  }
  events.push(emit(state, { kind: 'turn', side, turn: state.turn }));
}

// ---------- 敌方 AI ----------

function scoreTarget(state: BattleState, card: Card, target: Side): number {
  const self = state.enemy;
  const foe = state.player;
  const mine = target === 'enemy';
  const me = mine ? self : foe;
  let score = 0;
  for (const effect of card.effects) {
    switch (effect.kind) {
      case 'damage':
        score += mine ? -effect.amount : effect.amount * 1.2;
        break;
      case 'heal': {
        const max = effect.track === 'phys' ? me.maxPhys : me.maxMental;
        const missing = max - me[effect.track];
        const value = Math.min(effect.amount, missing);
        score += mine ? value * 0.9 : -value * 0.6;
        break;
      }
      case 'status': {
        const beneficial = !HARMFUL.has(effect.status);
        const gain = effect.amount + (effect.percent ? Math.ceil(me.statuses[effect.status] * effect.percent) : 0);
        if (beneficial) {
          score += mine ? -gain * 0.5 : -gain * 3; // 症状不龟缩：不主动叠增益状态
        } else {
          let value = gain * 0.9;
          if (effect.status === 'serotonin' && !mine) value = gain * 0.5 + (me.statuses.serotonin + gain >= SEROTONIN_THRESHOLD ? 4 : 0);
          if (effect.status === 'sedation' && !mine && me.statuses.sedation + gain >= 40) value += 5;
          score += mine ? -gain * 0.7 : value;
        }
        break;
      }
      case 'ap':
        score += 0;
        break;
      case 'clear': {
        const removed = Math.min(effect.amount, me.statuses[effect.status]);
        const harmful = HARMFUL.has(effect.status);
        if (harmful) score += mine ? removed * 0.9 : -removed * 0.5;
        else score += mine ? -removed * 2 : removed * 0.5;
        break;
      }
    }
  }
  return score;
}

function enemyPlay(state: BattleState, events: BattleEvent[]): void {
  const stageIndex = Math.max(0, Math.min(7, state.def.id.charCodeAt(state.def.id.length - 1) - 49));
  const plays = state.enemyPlays ?? ENEMY_PLAYS[stageIndex];
  for (let i = 0; i < plays; i += 1) {
    if (state.outcome !== 'ongoing' || state.enemy.hand.length === 0) break;
    let best: { index: number; target: Side; score: number } | null = null;
    for (let h = 0; h < state.enemy.hand.length; h += 1) {
      const card = CARD_MAP[state.enemy.hand[h]];
      if (!card) continue;
      for (const target of ['player', 'enemy'] as Side[]) {
        const score = scoreTarget(state, card, target);
        if (!best || score > best.score) best = { index: h, target, score };
      }
    }
    if (!best || best.score <= 0) break;
    playFromHand(state, 'enemy', best.index, best.target, events, true);
  }
}

/** 结束玩家回合：玩家衰减 → 敌方回合（抽牌+出牌+衰减）→ 玩家回合开始。 */
/** 动机增强：回合结束额外 +1 AP，持续回合 -1。 */
function tickMotivation(state: BattleState, side: Side, events: BattleEvent[]): void {
  const c = combatant(state, side);
  if (c.statuses.motivation <= 0) return;
  if (side === 'player') {
    state.player.ap = Math.min(state.stats.apCap, state.player.ap + 1);
    events.push(emit(state, { kind: 'ap', side: 'player', amount: 1 }));
  }
  c.statuses.motivation -= 1;
}


export function endPlayerTurn(state: BattleState): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (state.outcome !== 'ongoing' || state.active !== 'player') return events;
  tickMotivation(state, 'player', events);
  const enemySlept = state.enemy.asleep;
  startTurn(state, 'enemy', events);
  if (!enemySlept && state.outcome === 'ongoing') enemyPlay(state, events);
  tickMotivation(state, 'enemy', events);
  if (state.outcome !== 'ongoing') return events;
  state.turn += 1;
  startTurn(state, 'player', events);
  return events;
}
