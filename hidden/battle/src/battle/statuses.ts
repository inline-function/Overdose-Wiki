import type { StatusId } from '../content/types';
import type { SideState } from './types';

type StatusDef = {
  name: StatusId;
  max: number;
  defaultTurns: number;
  tick?: (side: SideState, stacks: number) => void;
  log?: string;
};

function hurt(side: SideState, track: 'phys' | 'psy', amount: number) {
  if (track === 'phys') side.phys = Math.max(0, side.phys - amount);
  else side.psy = Math.max(0, side.psy - amount);
}

function mend(side: SideState, track: 'phys' | 'psy', amount: number) {
  if (track === 'phys') side.phys = Math.min(side.maxPhys, side.phys + amount);
  else side.psy = Math.min(side.maxPsy, side.psy + amount);
}

export const STATUS_DEFS: Record<StatusId, StatusDef> = {
  呼吸抑制: {
    name: '呼吸抑制',
    max: 3,
    defaultTurns: 3,
    tick: (side, stacks) => hurt(side, 'phys', 3 * stacks),
    log: '呼吸变浅。',
  },
  镇静: {
    name: '镇静',
    max: 3,
    defaultTurns: 3,
    log: '动作变慢。',
  },
  谵妄: {
    name: '谵妄',
    max: 3,
    defaultTurns: 3,
    tick: (side, stacks) => hurt(side, 'psy', 2 * stacks),
    log: '现实开始错位。',
  },
  解离: {
    name: '解离',
    max: 3,
    defaultTurns: 3,
    log: '身体像隔着一层玻璃。',
  },
  血清素综合征: {
    name: '血清素综合征',
    max: 3,
    defaultTurns: 3,
    tick: (side, stacks) => {
      hurt(side, 'psy', 3 * stacks);
      hurt(side, 'phys', stacks);
    },
    log: '血清素过载。',
  },
  抗胆碱能: {
    name: '抗胆碱能',
    max: 3,
    defaultTurns: 3,
    tick: (side, stacks) => hurt(side, 'psy', stacks),
    log: '口干、发热、意识混浊。',
  },
  戒断: {
    name: '戒断',
    max: 2,
    defaultTurns: 3,
    tick: (side, stacks) => {
      hurt(side, 'psy', 4 * stacks);
      hurt(side, 'phys', stacks);
    },
    log: '反跳开始。',
  },
  耐受: {
    name: '耐受',
    max: 3,
    defaultTurns: 3,
    log: '同样的剂量不再那么有效。',
  },
  激越: {
    name: '激越',
    max: 3,
    defaultTurns: 3,
    tick: (side, stacks) => hurt(side, 'psy', stacks),
    log: '坐不住。',
  },
  欣快: {
    name: '欣快',
    max: 2,
    defaultTurns: 3,
    tick: (side, stacks) => {
      mend(side, 'psy', stacks);
      applyStatus(side, '耐受', 1, 3);
    },
    log: '一切都轻了一点。',
  },
};

export function applyStatus(
  side: SideState,
  status: StatusId,
  stacks: number,
  turns?: number,
): void {
  const def = STATUS_DEFS[status];
  if (!def) return;
  if (stacks < 0) {
    const current = side.statuses[status];
    if (!current) return;
    current.stacks += stacks;
    if (current.stacks <= 0) delete side.statuses[status];
    return;
  }
  const current = side.statuses[status] ?? { stacks: 0, turns: 0 };
  current.stacks = Math.min(def.max, current.stacks + stacks);
  current.turns = Math.max(current.turns, turns ?? def.defaultTurns);
  side.statuses[status] = current;
}

export function clearStatus(side: SideState, status: StatusId, stacks = 1): void {
  applyStatus(side, status, -stacks);
}

export function tickStatuses(side: SideState, log: string[]): void {
  for (const key of Object.keys(side.statuses) as StatusId[]) {
    const state = side.statuses[key];
    const def = STATUS_DEFS[key];
    if (!state) continue;
    if (def.tick) {
      def.tick(side, state.stacks);
      if (def.log) log.push(`${def.log}（${key} ${state.stacks}）`);
    }
    state.turns -= 1;
    if (state.turns <= 0) delete side.statuses[key];
  }
}

export function statusStacks(side: SideState, status: StatusId): number {
  return side.statuses[status]?.stacks ?? 0;
}