import type {
  CardOp,
  CourseSpec,
  EffectValence,
  EnzymeId,
  NeuroId,
  StatusId,
} from '../content/types';

export type StatusState = { stacks: number; turns: number };
export type EffectState = { weight: number; valence: EffectValence };

export type CourseState = {
  turns: number;
  active: boolean;
  grace: number;
  usedThisTurn: boolean;
  ops: CardOp[];
};

export type SideState = {
  phys: number;
  psy: number;
  maxPhys: number;
  maxPsy: number;
  statuses: Partial<Record<StatusId, StatusState>>;
  effects: Partial<Record<StatusId, EffectState>>;
  doses: Record<string, number>;
  concentration: Record<string, number>;
  neuro: Record<NeuroId, number>;
  enzymes: Record<EnzymeId, number>;
  courses: Record<string, CourseState>;
  exposures: { drugId: string; turnsLeft: number }[];
};

export type DelayedOp = {
  dueTurn: number;
  actor: 'player' | 'opponent';
  chosen: 'player' | 'opponent';
  effect: CardOp;
};

export type BattleResult = {
  kind: 'win' | 'lose' | 'mutual';
  title: string;
  detail: string;
};

export type BattleState = {
  battleId: string;
  turn: number;
  phase: 'player' | 'result';
  fixed: boolean;
  player: SideState;
  opponent: SideState;
  hand: string[];
  initialDeck: string[];
  drawPile: string[];
  discard: string[];
  exhaust: string[];
  delayed: DelayedOp[];
  ap: number;
  log: string[];
  result?: BattleResult;
  seed: number;
  rngState: number;
  opponentInvulnerable: boolean;
};

export type UseMode = 'proper' | 'over';
export type BattleTargetChoice = 'player' | 'opponent';

export type CourseDefinition = CourseSpec;