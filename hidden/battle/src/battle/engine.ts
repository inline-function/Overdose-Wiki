import type {
  Battle,
  BattleTargetChoice,
  Card,
  CardOp,
  DrugEntry,
  EnzymeId,
  NeuroId,
} from '../content/types';
import {
  NEUROS,
  applyNeuro,
  applyNeuroThresholds,
  defaultNeuro,
  driftNeuro,
  tickNeuro,
} from './neuro';
import {
  ENZYMES,
  applyEnzyme,
  cardLoad,
  decayEnzymes,
  defaultEnzymes,
} from './enzymes';
import { applyStatus, clearStatus, statusStacks, tickStatuses } from './statuses';
import type { BattleResult, BattleState, DelayedOp, SideState } from './types';

export const AP_BASE = 2;
export const AP_CAP = 3;
export const START_HAND = 4;
export const MAX_HAND = 8;
const MAX_LOG = 60;

export function createBattle(
  battle: Battle,
  cards: Card[],
  deckIds: string[],
  seed = 20240711,
): BattleState {
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const validDeck =
    battle.deckMode === 'fixed'
      ? []
      : validateDeck(deckIds, cards).ok && deckIds.length > 0
        ? deckIds
        : defaultDeck(cards);
  const state: BattleState = {
    battleId: battle.id,
    turn: 1,
    phase: 'player',
    fixed: battle.deckMode === 'fixed',
    player: makeSide(battle.player?.maxPhys ?? 60, battle.player?.maxPsy ?? 60, battle.player),
    opponent: makeSide(battle.opponent.maxPhys, battle.opponent.maxPsy, battle.opponent),
    hand: [],
    initialDeck: battle.deckMode === 'fixed' ? [] : [...validDeck],
    drawPile: battle.deckMode === 'fixed' ? [] : [...validDeck],
    discard: [],
    exhaust: [],
    delayed: [],
    ap: battle.deckMode === 'fixed' ? 0 : AP_BASE,
    log: [`复演开始：${battle.title}`],
    seed,
    rngState: seed,
    opponentInvulnerable: battle.opponent.invulnerable ?? false,
  };

  if (battle.deckMode === 'fixed') {
    state.hand = (battle.fixedHand ?? []).filter((id) => cardMap.has(id));
  } else {
    shuffle(state);
    for (let index = 0; index < START_HAND; index += 1) drawOne(state, cardMap);
  }
  state.ap = battle.deckMode === 'fixed' ? 0 : AP_BASE;
  return state;
}

export function drawAction(state: BattleState, cards: Card[]): BattleState {
  if (state.phase !== 'player' || state.result || state.fixed) return state;
  if (state.ap < 1 || state.hand.length >= MAX_HAND) return state;
  if (!state.drawPile.length) return state;
  const next = clone(state);
  next.ap -= 1;
  drawOne(next, new Map(cards.map((card) => [card.id, card])));
  addLog(next, `抽了一张牌（手牌 ${next.hand.length}/${MAX_HAND}）。`);
  return next;
}

export function resetDrawPile(state: BattleState): BattleState {
  if (state.phase !== 'player' || state.result || state.fixed) return state;
  if (state.ap < 2 || !state.initialDeck.length) return state;
  const next = clone(state);
  next.ap -= 2;
  next.drawPile = [...next.initialDeck];
  next.discard = [];
  addLog(next, '消耗 2 AP 重置牌库；手牌保留。');
  return next;
}

export function playCard(
  state: BattleState,
  battle: Battle,
  cards: Card[],
  drugs: DrugEntry[],
  cardId: string,
  target?: BattleTargetChoice,
  handIndex?: number,
): BattleState {
  if (state.phase !== 'player' || state.result) return state;
  const card = cards.find((item) => item.id === cardId);
  if (!card || !state.hand.includes(cardId)) return state;
  if (!state.fixed && state.ap < 1) return state;
  const chosen: 'player' | 'opponent' = target ?? (card.targets === 'enemy' ? 'opponent' : 'player');
  const next = clone(state);
  const removeIndex = handIndex !== undefined && handIndex >= 0 ? handIndex : next.hand.indexOf(cardId);
  if (removeIndex >= 0) next.hand.splice(removeIndex, 1);
  if (!next.fixed) next.ap = Math.max(0, next.ap - 1);
  if (card.storyOnly) next.exhaust.push(cardId);
  else next.discard.push(cardId);

  const drug = drugs.find((item) => item.id === card.drugId);
  const targetSide = chosen === 'player' ? next.player : next.opponent;
  const load = drug ? cardLoad(targetSide, drug.substrates) : 1;
  const dose = drug ? (targetSide.doses[drug.id] ?? 0) + 1 : 1;
  const over = Boolean(drug && card.over && dose > (drug.effectLine ?? 1));
  if (drug) {
    targetSide.doses[drug.id] = dose;
    targetSide.concentration[drug.id] =
      (targetSide.concentration[drug.id] ?? 0) + (drug.concentrationPerDose ?? 1);
  }
  addLog(
    next,
    `你对${chosen === 'player' ? '自己' : '对方'}使用「${card.name}」${dose > 1 ? `（第 ${dose} 次）` : ''}。${over ? '越过效应线。' : ''}`,
  );
  applyOps(next, over && card.over ? card.over : card.proper, 'player', chosen, load, drug, cards);
  if (drug) {
    applyEnzymeLoad(targetSide, drug);
    applyConcentrationEffects(targetSide, drug, targetSide.concentration[drug.id] ?? 0, next.log);
    if (drug.withdrawal && !targetSide.exposures.some((item) => item.drugId === drug.id)) {
      targetSide.exposures.push({ drugId: drug.id, turnsLeft: 3 });
    }
  }
  updateCourse(targetSide, card, over);
  checkOutcome(next, battle);
  return next;
}

function applyConcentrationEffects(
  side: SideState,
  drug: DrugEntry,
  concentration: number,
  log: string[],
): void {
  for (const effect of drug.concentrationEffects ?? []) {
    if (concentration < effect.threshold) continue;
    const current = side.effects[effect.name];
    if (current && current.weight >= effect.weight) continue;
    side.effects[effect.name] = { weight: effect.weight, valence: effect.valence };
    const stacks = effect.weight >= 6 ? 3 : effect.weight >= 3 ? 2 : 1;
    applyStatus(side, effect.name, stacks, 3);
    log.push(
      `血药浓度 ${concentration.toFixed(1)}${effect.unit === 'g' ? '克' : effect.unit === 'mcg' ? '微克' : '毫克'}：${effect.name}（${effect.severity}）`,
    );
  }
}

export function endTurn(
  state: BattleState,
  battle: Battle,
  cards: Card[],
  drugs: DrugEntry[] = [],
): BattleState {
  if (state.phase !== 'player' || state.result) return state;
  const next = clone(state);
  addLog(next, `—— 回合 ${next.turn} 结束 ——`);

  tickStatuses(next.player, next.log);
  tickStatuses(next.opponent, next.log);
  checkOutcome(next, battle);
  if (next.result) return finish(next);

  settleCourses(next, cards);
  checkOutcome(next, battle);
  if (next.result) return finish(next);

  tickDelayed(next, cards);
  tickExposures(next, drugs);
  checkOutcome(next, battle);
  if (next.result) return finish(next);

  decayEnzymes(next.player);
  decayEnzymes(next.opponent);
  driftNeuro(next.player);
  driftNeuro(next.opponent);

  const script = battle.script[(next.turn - 1) % battle.script.length];
  if (script && scriptAllowed(script, next)) {
    addLog(next, script.log);
    applyOps(next, script.ops, 'opponent', 'player', 1, undefined, cards);
    checkOutcome(next, battle);
    if (next.result) return finish(next);
  }

  tickNeuro(next.player, next.log);
  tickNeuro(next.opponent, next.log);
  checkOutcome(next, battle);
  if (next.result) return finish(next);

  for (const side of [next.player, next.opponent]) {
    side.doses = {};
    for (const [id, value] of Object.entries(side.concentration)) {
      const decayed = value * 0.85;
      if (decayed < 0.05) delete side.concentration[id];
      else side.concentration[id] = decayed;
    }
  }
  next.turn += 1;
  next.ap = next.fixed ? 0 : Math.max(0, AP_BASE - statusStacks(next.player, '镇静'));
  return next;
}

export function validateDeck(ids: string[], cards: Card[]) {
  const errors: string[] = [];
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  if (ids.length < 4 || ids.length > 8) errors.push('卡组需要 4–8 张');
  for (const id of ids) {
    if (!cardMap.has(id)) errors.push(`不存在的卡：${id}`);
  }
  return { ok: errors.length === 0, errors };
}

const DEFAULT_COUNTS: Array<[string, number]> = [
  ['sertraline', 1],
  ['dextromethorphan', 1],
  ['magnesium_threonate', 1],
  ['caffeine', 1],
  ['naloxone', 1],
  ['pregabalin', 1],
  ['fluoxetine', 1],
  ['amantadine', 1],
];

const DEFAULT_ALIASES: Record<string, string[]> = {
  dextromethorphan: ['dextromethorphan', 'dxm'],
  magnesium_threonate: ['magnesium_threonate', 'magnesium'],
};

export function defaultDeck(cards: Card[]): string[] {
  const available = new Map(
    cards.filter((card) => !card.storyOnly).map((card) => [card.id, card]),
  );
  const deck: string[] = [];
  for (const [id, count] of DEFAULT_COUNTS) {
    const actual = (DEFAULT_ALIASES[id] ?? [id]).find((candidate) => available.has(candidate));
    if (!actual) continue;
    for (let i = 0; i < count; i += 1) deck.push(actual);
  }
  for (const card of available.values()) {
    if (deck.length >= 8) break;
    if (!deck.includes(card.id)) deck.push(card.id);
  }
  for (const card of available.values()) {
    if (deck.length >= 8) break;
    deck.push(card.id);
  }
  return deck.slice(0, 8);
}

export function resultLabel(result?: BattleResult): string {
  if (!result) return '';
  if (result.kind === 'win') return '阴影退去';
  if (result.kind === 'mutual') return '同归于尽';
  return '被阴影吞没';
}

function makeSide(
  maxPhys: number,
  maxPsy: number,
  spec?: {
    neuro?: Partial<Record<NeuroId, number>>;
    enzymes?: Partial<Record<EnzymeId, number>>;
  },
): SideState {
  const neuro = defaultNeuro();
  for (const id of NEUROS) if (spec?.neuro?.[id] !== undefined) neuro[id] = spec.neuro[id]!;
  const enzymes = defaultEnzymes();
  for (const id of ENZYMES) if (spec?.enzymes?.[id] !== undefined) enzymes[id] = spec.enzymes[id]!;
  return {
    phys: maxPhys,
    psy: maxPsy,
    maxPhys,
    maxPsy,
    statuses: {},
    effects: {},
    doses: {},
    concentration: {},
    neuro,
    enzymes,
    courses: {},
    exposures: [],
  };
}

function clone(state: BattleState): BattleState {
  return structuredClone(state);
}

function finish(state: BattleState): BattleState {
  state.phase = 'result';
  return state;
}

function addLog(state: BattleState, line: string): void {
  state.log = [...state.log, line].slice(-MAX_LOG);
}

function drawOne(state: BattleState, cardMap: Map<string, Card>): void {
  const cardId = state.drawPile.shift();
  if (cardId && cardMap.has(cardId)) state.hand.push(cardId);
}

function shuffle(state: BattleState): void {
  for (let index = state.drawPile.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(roll(state) * (index + 1));
    [state.drawPile[index], state.drawPile[swap]] = [state.drawPile[swap], state.drawPile[index]];
  }
}

function roll(state: BattleState): number {
  let t = (state.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function resolveSide(
  actor: 'player' | 'opponent',
  opTarget: 'chosen' | 'self' | 'enemy',
  chosen: 'player' | 'opponent',
  state: BattleState,
): SideState {
  if (opTarget === 'chosen') return chosen === 'player' ? state.player : state.opponent;
  if (actor === 'player') {
    // "self" means the side the player card was aimed at; "enemy" is the other side.
    const side = opTarget === 'self' ? chosen : chosen === 'player' ? 'opponent' : 'player';
    return side === 'player' ? state.player : state.opponent;
  }
  return opTarget === 'self' ? state.opponent : state.player;
}

function applyOps(
  state: BattleState,
  ops: CardOp[],
  actor: 'player' | 'opponent',
  chosen: 'player' | 'opponent',
  load = 1,
  _drug?: DrugEntry,
  cards: Card[] = [],
): void {
  const beforePlayer = { ...state.player.neuro };
  const beforeOpponent = { ...state.opponent.neuro };
  const targetSide = chosen === 'player' ? state.player : state.opponent;

  for (const op of ops) {
    if (op.op === 'delayed') {
      state.delayed.push({
        dueTurn: state.turn + op.turns,
        actor,
        chosen,
        effect: op.effect,
      } as DelayedOp);
      continue;
    }
    if (op.op === 'draw') {
      if (actor === 'player' && !state.fixed) {
        for (let index = 0; index < op.amount; index += 1) {
          drawOne(state, new Map(cards.map((card) => [card.id, card])));
        }
      }
      continue;
    }
    if (op.op === 'ap') {
      if (actor === 'player' && !state.fixed) state.ap = Math.min(AP_CAP, state.ap + op.amount);
      continue;
    }
    const side = resolveSide(actor, op.target, chosen, state);
    const tolerance = 1 - 0.1 * statusStacks(side, '耐受');
    if (op.op === 'damage') {
      const amount = Math.max(1, Math.round(op.amount * load * tolerance));
      if (side === state.opponent && state.opponentInvulnerable) {
        addLog(state, '它没有身体，伤害无效。');
        continue;
      }
      if (op.track === 'phys') side.phys = Math.max(0, side.phys - amount);
      else side.psy = Math.max(0, side.psy - amount);
      addLog(state, `${op.track === 'phys' ? '生理' : '心理'} -${amount}`);
    } else if (op.op === 'heal') {
      const amount = Math.max(1, Math.round(op.amount * load * tolerance));
      if (op.track === 'phys') side.phys = Math.min(side.maxPhys, side.phys + amount);
      else side.psy = Math.min(side.maxPsy, side.psy + amount);
      addLog(state, `${op.track === 'phys' ? '生理' : '心理'} +${amount}`);
    } else if (op.op === 'neuro') {
      applyNeuro(side, op.neuro, Math.round(op.amount * load));
    } else if (op.op === 'status') {
      applyStatus(side, op.status, op.stacks ?? 1);
    } else if (op.op === 'clearStatus') {
      clearStatus(side, op.status, op.stacks ?? 1);
    } else if (op.op === 'enzyme') {
      applyEnzyme(side, op.enzyme, op.mode, op.strength);
    }
  }

  applyNeuroThresholds(state.player, beforePlayer, state.log);
  applyNeuroThresholds(state.opponent, beforeOpponent, state.log);
  if (targetSide.enzymes['MAO-A'] < 0.6 && targetSide.neuro['血清素'] >= 60) {
    applyStatus(targetSide, '血清素综合征', 1, 3);
  }
}

function applyEnzymeLoad(side: SideState, drug: DrugEntry): void {
  for (const [enzyme, strength] of Object.entries(drug.inhibitors) as [
    EnzymeId,
    'weak' | 'moderate' | 'strong',
  ][]) {
    applyEnzyme(side, enzyme, 'inhibit', strength);
  }
  for (const enzyme of drug.inducers) applyEnzyme(side, enzyme, 'induce', 'weak');
  if (
    drug.klass === 'c2' &&
    drug.tags.some((tag) => tag.includes('苯二氮卓')) &&
    side.enzymes.CYP3A4 < 0.6
  ) {
    applyEnzyme(side, 'CYP3A4', 'inhibit', 'weak');
  }
}

function updateCourse(side: SideState, card: Card, over: boolean): void {
  if (!card.course) return;
  const course = side.courses[card.course.id] ?? {
    turns: 0,
    active: false,
    grace: 0,
    usedThisTurn: false,
    ops: card.course.ops,
  };
  if (over) {
    course.turns = 0;
    course.active = false;
    course.grace = 0;
  } else {
    course.turns = Math.min(card.course.turns, course.turns + 1);
    course.usedThisTurn = true;
    if (course.turns >= card.course.turns) course.active = true;
  }
  side.courses[card.course.id] = course;
}

function settleCourses(state: BattleState, _cards: Card[]): void {
  for (const [actor, side] of [
    ['player', state.player],
    ['opponent', state.opponent],
  ] as const) {
    for (const course of Object.values(side.courses)) {
      if (course.active) {
        applyOps(state, course.ops, actor, actor, 1);
        state.log.push(`${actor === 'player' ? '你' : '阴影'}的疗程维持。`);
        if (course.usedThisTurn) course.grace = 2;
        else course.grace -= 1;
        if (course.grace < 0) course.active = false;
      } else if (!course.usedThisTurn) {
        course.turns = 0;
      }
      course.usedThisTurn = false;
    }
  }
}

function tickDelayed(state: BattleState, cards: Card[]): void {
  const due = state.delayed.filter((item) => item.dueTurn <= state.turn);
  state.delayed = state.delayed.filter((item) => item.dueTurn > state.turn);
  for (const item of due) {
    applyOps(state, [item.effect], item.actor, item.chosen, 1, undefined, cards);
  }
}

function tickExposures(state: BattleState, drugs: DrugEntry[]): void {
  for (const side of [state.player, state.opponent]) {
    for (const exposure of side.exposures) exposure.turnsLeft -= 1;
    const expired = side.exposures.filter((item) => item.turnsLeft <= 0);
    side.exposures = side.exposures.filter((item) => item.turnsLeft > 0);
    for (const item of expired) {
      const drug = drugs.find((entry) => entry.id === item.drugId);
      if (drug?.withdrawal) {
        applyStatus(side, drug.withdrawal.status, 1, 3);
        state.log.push(drug.withdrawal.log);
      }
    }
  }
}

function scriptAllowed(
  script: {
    when?: {
      turnMin?: number;
      selfBarBelow?: 'phys' | 'psy';
      playerBarBelow?: 'phys' | 'psy';
    };
  },
  state: BattleState,
): boolean {
  if (!script.when) return true;
  if (script.when.turnMin && state.turn < script.when.turnMin) return false;
  if (script.when.selfBarBelow) {
    const track = script.when.selfBarBelow;
    const max = track === 'phys' ? state.opponent.maxPhys : state.opponent.maxPsy;
    if (state.opponent[track] > max * 0.5) return false;
  }
  if (script.when.playerBarBelow) {
    const track = script.when.playerBarBelow;
    const max = track === 'phys' ? state.player.maxPhys : state.player.maxPsy;
    if (state.player[track] > max * 0.5) return false;
  }
  return true;
}

function checkOutcome(state: BattleState, battle: Battle): void {
  if (state.opponentInvulnerable) {
    state.opponent.phys = Math.max(1, state.opponent.phys);
    state.opponent.psy = Math.max(1, state.opponent.psy);
  }
  const playerDown = state.player.phys <= 0 || state.player.psy <= 0;
  const opponentDown = state.opponent.phys <= 0 || state.opponent.psy <= 0;
  if (playerDown && opponentDown) {
    state.result = { kind: 'mutual', title: '同归于尽', detail: battle.ending.mutual };
  } else if (opponentDown) {
    state.result = { kind: 'win', title: '阴影退去', detail: battle.ending.win };
  } else if (playerDown) {
    state.result = { kind: 'lose', title: '被阴影吞没', detail: battle.ending.lose };
  } else if (battle.turnLimit && state.turn >= battle.turnLimit) {
    const kind = battle.turnLimitResult ?? 'mutual';
    state.result = {
      kind,
      title: kind === 'win' ? '阴影退去' : kind === 'lose' ? '被阴影吞没' : '同归于尽',
      detail: battle.ending[kind],
    };
  }
  if (state.result) state.phase = 'result';
}