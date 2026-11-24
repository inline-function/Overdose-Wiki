import {
  CLAUSE_BY_ID,
  CLAUSES,
  DEATH_INTERLUDE,
  ENDINGS,
  EXTERNAL_EVENTS,
  TURN_CONTENT,
  TURN_COUNT,
  type ClauseContent,
} from './content';
import type {
  ActionCard,
  ActionChoice,
  AfterstoryRun,
  Cell,
  Counts,
  DeathResponse,
  Effect,
  EndingId,
  ExternalEvent,
  Faction,
  MeterKey,
  Motion,
  Outcome,
  Relation,
  SeatId,
  SeatState,
  SideRelation,
  TurnContent,
} from './types';

export type ActionResult = { run: AfterstoryRun; ok: boolean; message: string };

const FACTIONS: Faction[] = ['harm', 'left', 'right', 'mass'];
const SOURCES: Record<Faction, string[]> = {
  harm: ['夜间答疑桌', '家属群', '急救转介', '值班记录', '急救回访'],
  left: ['公开词典', '研究讨论群', 'FOW 旧帖', '自由左值班表'],
  right: ['剩余交易群', '享乐群', '旧渠道', '熟客名单'],
  mass: ['平台求助', '围观者', '跟风账号', '家长群', '视频评论', '空椅'],
};

const FACTION_ANCHORS: Record<Faction, [number, number]> = {
  harm: [8.5, 1.5],
  left: [1.5, 1.5],
  right: [1.5, 8.5],
  mass: [8.5, 8.5],
};

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initialFactions(seed = 20260110): Faction[] {
  const counts: Counts = { harm: 32, left: 18, right: 14, mass: 36 };
  return layoutFactions(counts, seed);
}

function layoutFactions(counts: Counts, seed: number): Faction[] {
  const factions = FACTIONS.filter((faction) => counts[faction] > 0);
  const weights = Object.fromEntries(
    factions.map((faction) => [faction, Math.sqrt(counts[faction])]),
  ) as Record<Faction, number>;
  const random = mulberry32(seed ^ 0x9e3779b9);
  const cells = Array.from({ length: 100 }, (_, index) => {
    const row = Math.floor(index / 10);
    const col = index % 10;
    const scores = Object.fromEntries(
      factions.map((faction) => {
        const [anchorRow, anchorCol] = FACTION_ANCHORS[faction];
        const jitter = random() * 0.06;
        return [faction, ((row - anchorRow) ** 2 + (col - anchorCol) ** 2) / (weights[faction] ** 2) + jitter];
      }),
    ) as Record<Faction, number>;
    const sorted = [...factions].sort((a, b) => scores[a] - scores[b]);
    return {
      index,
      sorted,
      margin: scores[sorted[1]] - scores[sorted[0]],
    };
  });
  cells.sort((a, b) => b.margin - a.margin);
  const remaining = { ...counts };
  const assigned: Faction[] = new Array(100);
  for (const cell of cells) {
    for (const faction of cell.sorted) {
      if (remaining[faction] > 0) {
        assigned[cell.index] = faction;
        remaining[faction] -= 1;
        break;
      }
    }
  }
  for (let index = 0; index < 100; index += 1) {
    if (assigned[index]) continue;
    const faction = factions.find((item) => remaining[item] > 0);
    if (faction) {
      assigned[index] = faction;
      remaining[faction] -= 1;
    }
  }
  return assigned;
}

export function buildCells(seed = 20260110): Cell[] {
  const factions = initialFactions(seed);
  const used: Record<Faction, number> = { harm: 0, left: 0, right: 0, mass: 0 };
  return factions.map((faction, index) => {
    const sourceIndex = used[faction] % SOURCES[faction].length;
    used[faction] += 1;
    return {
      id: 'r' + Math.floor(index / 10) + 'c' + (index % 10),
      row: Math.floor(index / 10),
      col: index % 10,
      faction,
      source: SOURCES[faction][sourceIndex],
      changedTurn: 0,
    };
  });
}

export function createRun(seed = Date.now()): AfterstoryRun {
  return {
    version: 1,
    seed,
    turn: 1,
    phase: 'brief',
    cells: buildCells(seed),
    relations: { left: 'neutral', right: 'neutral', leftLeader: 'edward', friendProgress: 0 },
    meters: { trust: 50, chaos: 25, exposure: 20, pc: 3, ap: 2 },
    documents: {
      od: 'none',
      blockade: false,
      manual: {
        names: { status: 'none', variantId: null },
        knowledge: { status: 'none', variantId: null },
        overdose: { status: 'none', variantId: null },
        representation: { status: 'none', variantId: null },
      },
    },
    flags: [],
    replied: false,
    motionDone: false,
    log: [],
    night: [],
  };
}

export function countCells(cells: Cell[]): Counts {
  const counts: Counts = { harm: 0, left: 0, right: 0, mass: 0 };
  for (const cell of cells) counts[cell.faction] += 1;
  return counts;
}

export function activeCells(counts: Counts): number {
  return counts.harm + counts.left + counts.right;
}

export function includedCells(run: AfterstoryRun, counts = countCells(run.cells)): number {
  const left = run.relations.leftLeader === 'sage' && run.relations.left === 'friendly' ? counts.left : 0;
  return counts.harm + left;
}

export function includedRatio(run: AfterstoryRun): number {
  const counts = countCells(run.cells);
  const active = activeCells(counts);
  return active === 0 ? 0 : includedCells(run, counts) / active;
}

export function harmRatio(run: AfterstoryRun): number {
  const counts = countCells(run.cells);
  const active = activeCells(counts);
  return active === 0 ? 0 : counts.harm / active;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const METER_WARNING: Record<MeterKey, { threshold: number; direction: 'above' | 'below'; label: string }> = {
  trust: { threshold: 30, direction: 'below', label: '信任低于 30' },
  exposure: { threshold: 60, direction: 'above', label: '暴露高于 60' },
  chaos: { threshold: 60, direction: 'above', label: '混乱高于 60' },
};

export function isMeterWarning(key: MeterKey, value: number): boolean {
  const warning = METER_WARNING[key];
  return warning.direction === 'above' ? value > warning.threshold : value < warning.threshold;
}

export function warningMeters(run: AfterstoryRun): MeterKey[] {
  return (Object.keys(METER_WARNING) as MeterKey[]).filter((key) => isMeterWarning(key, run.meters[key]));
}

export function externalChance(run: AfterstoryRun): number {
  if (run.meters.exposure <= METER_WARNING.exposure.threshold) return 0;
  return clamp((run.meters.exposure - METER_WARNING.exposure.threshold) / 40, 0, 1);
}

export function externalEventFor(run: AfterstoryRun): ExternalEvent | undefined {
  const chance = externalChance(run);
  if (chance <= 0) return undefined;
  const random = mulberry32(run.seed ^ (run.turn * 7919) ^ 0x51ed270b);
  if (random() >= chance) return undefined;
  return EXTERNAL_EVENTS[Math.floor(random() * EXTERNAL_EVENTS.length)];
}

function stepRelation(current: Relation, delta: number, leader: 'edward' | 'sage'): Relation {
  const max = leader === 'edward' ? 1 : 2;
  const level = current === 'hostile' ? 0 : current === 'neutral' ? 1 : 2;
  const next = clamp(level + delta, 0, max);
  return next === 0 ? 'hostile' : next === 1 ? 'neutral' : 'friendly';
}

function stepSide(current: SideRelation, delta: number): SideRelation {
  const next = clamp(current === 'hostile' ? 0 : 1, 0, 1) + delta;
  return clamp(next, 0, 1) === 0 ? 'hostile' : 'neutral';
}

export function moveCells(
  cells: Cell[],
  from: Faction,
  to: Faction,
  n: number,
  turn: number,
): Cell[] {
  if (from === to || n <= 0) return cells;
  let remaining = n;
  return cells.map((cell) => {
    if (remaining > 0 && cell.faction === from) {
      remaining -= 1;
      return { ...cell, faction: to, changedTurn: turn };
    }
    return cell;
  });
}

export function applyEffect(run: AfterstoryRun, effect: Effect): AfterstoryRun {
  const next = structuredClone(run);
  next.meters.trust = clamp(next.meters.trust + (effect.trust ?? 0), 0, 100);
  next.meters.chaos = clamp(next.meters.chaos + (effect.chaos ?? 0), 0, 100);
  next.meters.exposure = clamp(next.meters.exposure + (effect.exposure ?? 0), 0, 100);
  next.meters.pc = clamp(next.meters.pc + (effect.pc ?? 0), 0, 8);

  if (effect.relation) {
    if (effect.relation.left) {
      next.relations.left = stepRelation(next.relations.left, effect.relation.left, next.relations.leftLeader);
    }
    if (effect.relation.right) {
      next.relations.right = stepSide(next.relations.right, effect.relation.right);
    }
  }

  for (const move of effect.move ?? []) {
    next.cells = moveCells(next.cells, move.from, move.to, move.n, next.turn);
  }
  for (const flag of effect.flags ?? []) {
    if (!next.flags.includes(flag)) next.flags.push(flag);
  }
  return next;
}

function addLog(run: AfterstoryRun, label: string, detail: string, tone: 'paper' | 'red' | 'green' | 'blue' = 'paper'): AfterstoryRun {
  return {
    ...run,
    log: [...run.log, { turn: run.turn, label, detail, tone }].slice(-40),
  };
}

function endIfFailed(run: AfterstoryRun): AfterstoryRun {
  if (run.meters.chaos >= 80) {
    return { ...run, phase: 'ending', ending: 'chaos' };
  }
  if (harmRatio(run) < 0.1) {
    return { ...run, phase: 'ending', ending: 'ebb' };
  }
  return run;
}

export function startVisit(run: AfterstoryRun): ActionResult {
  if (run.phase !== 'brief') return { run, ok: false, message: '现在不能看来访者。' };
  return { run: { ...run, phase: 'visit' }, ok: true, message: getTurnContent(run.turn).visitor.question };
}

export function getTurnContent(turn: number): TurnContent {
  return TURN_CONTENT[Math.min(TURN_COUNT - 1, Math.max(0, turn - 1))];
}

export function resolveReply(run: AfterstoryRun, optionId: string): ActionResult {
  if (run.replied || run.phase !== 'visit') {
    return { run, ok: false, message: '这一回合已经回复过了。' };
  }
  const visitor = getTurnContent(run.turn).visitor;
  const option = visitor.options.find((item) => item.id === optionId);
  if (!option) return { run, ok: false, message: '找不到这个回复。' };
  let next = applyEffect({ ...run, replied: true }, option.effect);
  next = addLog(next, '回复来访者', option.line, 'green');
  next.phase = 'table';
  return { run: endIfFailed(next), ok: true, message: option.line };
}

export function relationText(run: AfterstoryRun, side: 'left' | 'right'): string {
  if (side === 'left' && run.relations.leftLeader === 'edward') {
    return run.relations.left === 'hostile' ? '敌对（上限中立）' : '中立（上限中立）';
  }
  return run.relations[side] === 'friendly' ? '友好' : run.relations[side] === 'neutral' ? '中立' : '敌对';
}

export function leaderName(run: AfterstoryRun): string {
  return run.relations.leftLeader === 'edward' ? '爱德华' : '鼠尾草';
}

export function manualCount(run: AfterstoryRun): number {
  return Object.values(run.documents.manual).filter((item) => item.status === 'passed').length;
}

export function availableClauses(run: AfterstoryRun): ClauseContent[] {
  return CLAUSES.filter(
    (clause) => run.turn >= clause.turn && run.documents.manual[clause.id].status !== 'passed',
  );
}

export function getSignatures(run: AfterstoryRun): SeatId[] {
  const signatures: SeatId[] = [];
  const counts = countCells(run.cells);
  if (run.meters.trust >= 20) signatures.push('harm1', 'harm2');
  if (
    counts.left >= 5 &&
    run.relations.leftLeader === 'sage' &&
    (run.relations.left === 'friendly' || (run.relations.left === 'neutral' && manualCount(run) >= 3))
  ) {
    signatures.push('left');
  }
  if (
    counts.right >= 5 &&
    run.relations.right === 'neutral' &&
    (manualCount(run) >= 2 || run.flags.includes('old-deal'))
  ) {
    signatures.push('right');
  }
  return signatures;
}

export function canFound(run: AfterstoryRun): boolean {
  return (
    run.turn >= 5 &&
    run.phase === 'table' &&
    includedRatio(run) > 0.7 &&
    harmRatio(run) >= 0.1 &&
    run.meters.chaos < 80
  );
}

export function computeOutcome(run: AfterstoryRun): Outcome {
  if (run.ending) return 'victory';
  if (run.meters.chaos >= 80) return 'chaos';
  const counts = countCells(run.cells);
  if (activeCells(counts) === 0 || counts.harm / activeCells(counts) < 0.1) return 'ebb';
  if (includedRatio(run) > 0.7) return 'victory';
  if (run.turn >= TURN_COUNT) return 'timeout';
  return 'none';
}

export function computeEnding(run: AfterstoryRun): EndingId {
  if (run.meters.chaos >= 80) return 'chaos';
  const counts = countCells(run.cells);
  const active = activeCells(counts);
  if (active === 0 || counts.harm / active < 0.1) return 'ebb';
  if (includedRatio(run) > 0.7) {
    if (
      run.relations.leftLeader === 'sage' &&
      run.relations.left === 'friendly' &&
      manualCount(run) >= 3 &&
      getSignatures(run).length >= 4 &&
      counts.mass <= 15 &&
      run.meters.chaos < 80
    ) {
      return 'new-circle';
    }
    if (
      run.relations.left === 'hostile' &&
      run.relations.right === 'hostile' &&
      counts.mass >= 20 &&
      run.documents.blockade
    ) {
      return 'old-circle';
    }
    return 'clinic';
  }
  if (counts.left + counts.right >= Math.ceil(active * 0.5) && counts.harm < 30) return 'market';
  return 'long-night';
}

function motionEffect(motion: Motion): Effect {
  if (motion.kind === 'policy') {
    if (motion.policy === 'od') {
      return motion.variantId === 'maintain'
        ? { chaos: 4, exposure: -20, flags: ['od-maintained'] }
        : { trust: 2, chaos: -1, flags: ['od-revised'] };
    }
    return { chaos: 10, exposure: -30, relation: { left: -1 }, flags: ['blockade'] };
  }
  const clause = CLAUSE_BY_ID[motion.clauseId];
  return clause.variants.find((variant) => variant.id === motion.variantId)?.effect ?? {};
}

function applyMotion(run: AfterstoryRun, motion: Motion): AfterstoryRun {
  const next = structuredClone(run);
  if (motion.kind === 'policy') {
    if (motion.policy === 'od') {
      next.documents.od = motion.variantId === 'maintain' ? 'maintained' : 'revised';
    } else {
      next.documents.blockade = motion.variantId === 'activate';
    }
  } else {
    next.documents.manual[motion.clauseId] = { status: 'passed', variantId: motion.variantId };
  }
  return applyEffect(next, motionEffect(motion));
}

function lobbyChance(run: AfterstoryRun, seat: 'left' | 'right'): number {
  const trust = run.meters.trust / 200;
  if (seat === 'left') {
    const base = run.relations.left === 'friendly' ? 0.72 : run.relations.left === 'hostile' ? 0.12 : 0.42;
    return clamp(base + trust + (run.relations.friendProgress === 1 ? 0.08 : 0) - run.meters.exposure / 500, 0.08, 0.92);
  }
  const base = run.relations.right === 'neutral' ? 0.42 : 0.18;
  return clamp(base + trust - run.meters.chaos / 500, 0.06, 0.88);
}

export function getSeats(run: AfterstoryRun): SeatState[] {
  const counts = countCells(run.cells);
  const active = activeCells(counts);
  const harmWeight = counts.harm;
  const harm1Weight = Math.ceil(harmWeight / 2);
  const harm2Weight = harmWeight - harm1Weight;
  const leftPresent = counts.left >= 5;
  const rightPresent = counts.right >= 5;
  const leftVote = !leftPresent
    ? 'absent'
    : run.relations.left === 'friendly'
      ? 'yes'
      : run.relations.left === 'hostile'
        ? 'no'
        : 'abstain';
  const rightVote = !rightPresent ? 'absent' : 'no';
  const leftChance = leftPresent && run.relations.left !== 'hostile' ? lobbyChance(run, 'left') : undefined;
  const rightChance = rightPresent && run.relations.right === 'neutral' ? lobbyChance(run, 'right') : undefined;
  const seats: SeatState[] = [
    {
      id: 'harm1',
      label: '减害一席',
      holder: '减害代表',
      vote: 'yes',
      note: '默认赞成手册',
      lobbyable: false,
      weight: harm1Weight,
    },
    {
      id: 'harm2',
      label: '减害二席',
      holder: '减害代表',
      vote: run.meters.trust < 25 ? 'abstain' : 'yes',
      note: run.meters.trust < 25 ? '信任不足，弃权' : '默认赞成手册',
      lobbyable: false,
      weight: harm2Weight,
    },
    {
      id: 'left',
      label: '自由左',
      holder: leaderName(run),
      vote: leftVote,
      note: !leftPresent
        ? '不足五格，无席位'
        : run.relations.leftLeader === 'edward'
          ? '爱德华期上限中立'
          : '关系决定票向',
      lobbyable: leftPresent && run.relations.left !== 'hostile',
      weight: leftPresent ? counts.left : 0,
      chance: leftChance,
    },
    {
      id: 'right',
      label: '自由右',
      holder: '鸡哥',
      vote: rightVote,
      note: !rightPresent ? '不足五格，无席位' : '中立也会反对，需交易',
      lobbyable: rightPresent && run.relations.right === 'neutral',
      weight: rightPresent ? counts.right : 0,
      chance: rightChance,
    },
    {
      id: 'mass',
      label: '空椅',
      holder: '无人',
      vote: 'absent',
      note: '没有人坐。这一席不计票。',
      lobbyable: false,
      weight: 0,
    },
  ];
  // 只有活跃格有票权；空椅和不足五格的派别不计入总票数。
  if (active === 0) return seats;
  return seats;
}

export function seatWeightTotal(seats: SeatState[]): number {
  return seats.reduce((total, seat) => total + seat.weight, 0);
}

export function castVote(run: AfterstoryRun, lobbied: SeatId[]): ActionResult {
  if (run.phase !== 'council' || !run.pendingMotion) return { run, ok: false, message: '现在没有待表决的动议。' };
  const motion = run.pendingMotion;
  let next = structuredClone(run);
  const seats = getSeats(next);
  const valid = lobbied
    .filter((id) => {
      const seat = seats.find((item) => item.id === id);
      return Boolean(seat && seat.lobbyable);
    })
    .slice(0, next.meters.pc);
  const cost = valid.length;
  next.meters.pc = clamp(next.meters.pc - cost, 0, 8);
  const outcomes: string[] = [];
  const random = mulberry32(next.seed ^ (next.turn * 104729) ^ 0x2f6e2b1);
  const votes = seats.map((seat) => {
    if (!valid.includes(seat.id) || seat.vote === 'absent') return seat;
    const chance = seat.chance ?? 0;
    const success = random() < chance;
    if (!success) {
      outcomes.push(seat.label + '没有被说动');
      return seat;
    }
    outcomes.push(seat.label + '被说动');
    return { ...seat, vote: 'yes' as const };
  });
  const totalWeight = seatWeightTotal(votes);
  const yesWeight = votes.filter((seat) => seat.vote === 'yes').reduce((sum, seat) => sum + seat.weight, 0);
  const threshold = totalWeight > 0 ? Math.floor(totalWeight / 2) + 1 : 0;
  const passed = threshold > 0 && yesWeight >= threshold;
  if (passed) {
    next = applyMotion(next, motion);
    next = addLog(next, '议事通过', clauseLabel(motion) + ' 以 ' + yesWeight + ':' + (totalWeight - yesWeight) + ' 通过。', 'green');
  } else {
    next.meters.chaos = clamp(next.meters.chaos + 2, 0, 100);
    if (motion.kind === 'clause') {
      next.documents.manual[motion.clauseId] = { status: 'failed', variantId: motion.variantId };
    }
    next = addLog(next, '议事未通过', clauseLabel(motion) + ' 只拿到 ' + yesWeight + ' / ' + totalWeight + ' 票。', 'red');
  }
  next.motionDone = true;
  next.pendingMotion = undefined;
  next.phase = 'table';
  const lobbyText = valid.length > 0 ? '游说：' + outcomes.join('；') + '。' : '';
  return {
    run: endIfFailed(next),
    ok: true,
    message: (passed ? '动议通过。' : '动议未通过。') + lobbyText + '赞成 ' + yesWeight + ' / ' + totalWeight + ' 票。',
  };
}

export function clauseLabel(motion: Motion): string {
  if (motion.kind === 'policy') {
    if (motion.policy === 'od') return motion.variantId === 'maintain' ? '旧 OD 公约：维持' : '旧 OD 公约：修订';
    return motion.variantId === 'activate' ? '墙内封锁宣言' : '解除封锁宣言';
  }
  const clause = CLAUSE_BY_ID[motion.clauseId];
  const variant = clause.variants.find((item) => item.id === motion.variantId);
  return '手册第 ' + clause.order + ' 条 · ' + clause.title + ' / ' + (variant?.label ?? '');
}

export function getActions(run: AfterstoryRun): ActionCard[] {
  if (run.phase !== 'table') return [];
  const actions: ActionCard[] = [];
  const counts = countCells(run.cells);
  const clauses = availableClauses(run);
  if (clauses.length > 0 && !run.motionDone) {
    const choices: ActionChoice[] = [];
    for (const clause of clauses) {
      for (const variant of clause.variants) {
        choices.push({
          id: clause.id + ':' + variant.id,
          label: clause.order + ' · ' + clause.title + ' / ' + variant.label,
          effectText: variant.summary,
        });
      }
    }
    actions.push({
      id: 'draft',
      title: '起草手册',
      body: '旧公约背面还有空白。写下一个条款，然后把它交给五席。',
      hint: '1 AP · 起草后进入议事',
      art: '/assets/afterstory/briefing_desk.png',
      choices,
    });
  }

  actions.push({
    id: 'negotiate',
    title: '缓和派别',
    body: '先不谈条款。把一个人从对面拉回桌边。',
    hint: '1 AP + 1 PC',
    art: '/assets/afterstory/entry_card.png',
    choices: [
      {
        id: 'left',
        label: '自由左 · ' + leaderName(run) + '（' + relationText(run, 'left') + '）',
        effectText: run.relations.leftLeader === 'sage' && run.relations.friendProgress === 1
          ? '消耗「友好友进度」：免费，必定 +1 步'
          : '关系 +1 步，混乱 -4',
        disabled: run.relations.leftLeader === 'sage' && run.relations.friendProgress === 1
          ? undefined
          : run.meters.pc < 1 ? 'PC 不足，先结束本回合再谈' : undefined,
      },
      {
        id: 'right',
        label: '自由右 · 鸡哥（' + relationText(run, 'right') + '）',
        effectText: '关系 +1 步，混乱 -4；不能友好',
        disabled: run.meters.pc < 1 ? 'PC 不足，先结束本回合再谈' : undefined,
      },
    ],
  });

  actions.push({
    id: 'statement',
    title: '发表言论',
    body: '有些话必须公开说。公开会改变关系，也会把门打开一条缝。',
    hint: '1 AP · 暴露上升',
    art: '/assets/afterstory/event_desk.png',
    choices: [
      { id: 'mild', label: '温和：先承认彼此都在自卫', effectText: '自由左关系 +1，群众→减害 2，暴露 +8' },
      { id: 'hard', label: '强硬：把旧账一次说清', effectText: '自由左/自由右关系 -1，自由右→群众 2，暴露 +12，混乱 +4' },
      { id: 'technical', label: '技术：只讲急救与转介', effectText: '群众→减害 3，暴露 +9，混乱 -2' },
    ],
  });

  actions.push({
    id: 'spread',
    title: '传播信息',
    body: '把能救命的信息递出去。它不会让所有人喜欢你，但会让人知道桌子还在。',
    hint: '1 AP · 群众→减害 3',
    art: '/assets/afterstory/event_desk.png',
    choices: [{
      id: 'spread',
      label: '发出这一周的值班表',
      effectText: '群众→减害 3，暴露 +6，混乱 -1',
      disabled: counts.mass < 1 ? '没有群众格可动员' : undefined,
    }],
  });

  actions.push({
    id: 'document',
    title: '编写文档',
    body: '把发生过的事写下来。公开说明、内部复盘、平台申诉，写法不同，后果也不同。',
    hint: '1 AP · 降低暴露',
    art: '/assets/afterstory/event_desk.png',
    choices: [
      { id: 'public', label: '写一份公开说明', effectText: '暴露 -12，信任 +4，群众→减害 1' },
      { id: 'internal', label: '只写内部复盘', effectText: '暴露 -6，信任 +2，混乱 -3' },
      { id: 'appeal', label: '写平台申诉模板', effectText: '暴露 -8，混乱 -1' },
    ],
  });

  actions.push({
    id: 'coverup',
    title: '封锁消息',
    body: '压住报道、投诉、删帖。它会让外面安静一阵，但桌子不会因此变干净。',
    hint: '1 AP · 暴露↓ 混乱↑',
    art: '/assets/afterstory/entry_card.png',
    choices: [
      { id: 'local', label: '压住本地报道', effectText: '暴露 -18，混乱 +6，信任 -2' },
      { id: 'appeal', label: '只向平台申诉，不删证据', effectText: '暴露 -10，混乱 +1，信任 +1' },
    ],
  });

  actions.push({
    id: 'firstAid',
    title: '急救 / 转介',
    body: '急救包在桌子底下。先接住人，再决定要不要留下记录。',
    hint: '1 AP · 降低混乱',
    art: '/assets/afterstory/event_desk.png',
    choices: [
      { id: 'aid', label: '先叫救护车，再联系值班', effectText: '信任 +5，混乱 -5，暴露 +2，群众→减害 2' },
      { id: 'quiet', label: '不留记录，先找熟人', effectText: '信任 -2，混乱 +1，暴露 -2，群众→减害 1' },
    ],
  });

  actions.push({
    id: 'training',
    title: '培训值班人',
    body: '把急救、接待和交接写成一页。你不可能永远坐在这张桌子前。',
    hint: '1 AP · 信任与混乱',
    art: '/assets/afterstory/event_desk.png',
    choices: [
      {
        id: 'handover',
        label: '做一次完整的值班培训',
        effectText: '信任 +5，混乱 -4，群众→减害 1',
        disabled: run.meters.pc < 1 ? 'PC 不足，先结束本回合' : undefined,
      },
      {
        id: 'notes',
        label: '只交接电话和地址',
        effectText: '信任 +2，混乱 -2，暴露 -1',
      },
    ],
  });

  actions.push({
    id: 'suppress',
    title: '打压 / 清场',
    body: '取证、曝光、法律压力、舆论战、清场。它会让有组织的对手退回群众。',
    hint: '1 AP · 混乱+8 暴露+5',
    art: '/assets/afterstory/entry_card.png',
    choices: [
      { id: 'left', label: '打压自由左（' + leaderName(run) + '）', effectText: '自由左→群众 4，关系 -1，混乱 +8' },
      { id: 'right', label: '打压自由右（鸡哥）', effectText: '自由右→群众 4，关系 -1，混乱 +8' },
    ],
  });

  if (!run.motionDone && run.documents.od === 'none') {
    actions.push({
      id: 'policy',
      title: '旧 OD 公约',
      body: '两年前没写完的公约。恢复它，外界压力会降下来；修订它，才有新手册的位置。',
      hint: '1 AP · 提交议事',
      art: '/assets/afterstory/briefing_desk.png',
      choices: [
        { id: 'od:maintain', label: '恢复 OD 不扩散公约', effectText: '通过后暴露 -20，混乱 +4' },
        { id: 'od:revise', label: '修订：把旧三条划掉', effectText: '打开新手册，信任 +2，混乱 -1' },
      ],
    });
  }

  if (!run.motionDone && run.turn >= 4 && !run.documents.blockade) {
    actions.push({
      id: 'policy',
      title: '墙内封锁宣言',
      body: '停止对外发声，只保留核心名单。它最快，也最像旧药圈。',
      hint: '1 AP · 提交议事',
      art: '/assets/afterstory/entry_card.png',
      choices: [{ id: 'blockade:activate', label: '启动封锁宣言', effectText: '通过后暴露 -30，混乱 +10，自由左 -1' }],
    });
  }

  if (canFound(run)) {
    actions.push({
      id: 'found',
      title: '召开成立会',
      body: '计入比例已经超过 70%。你可以现在开，也可以等到 5.31 补手册和签字。',
      hint: '提前结局 · 不花 AP',
      art: '/assets/afterstory/entry_hero.png',
      choices: [{ id: 'found', label: '现在召开成立会', effectText: '立刻进入结局结算' }],
    });
  }
  const art = TURN_CONTENT[run.turn - 1]?.art ?? '/assets/afterstory/event_desk.png';
  return actions.map((action) => ({ ...action, art }));
}

function takeCost(run: AfterstoryRun, ap: number, pc: number): AfterstoryRun {
  return {
    ...run,
    meters: { ...run.meters, ap: clamp(run.meters.ap - ap, 0, 3), pc: clamp(run.meters.pc - pc, 0, 8) },
  };
}

export function resolveAction(run: AfterstoryRun, actionId: ActionCard['id'], choiceId: string): ActionResult {
  if (run.phase !== 'table') return { run, ok: false, message: '现在不是行动阶段。' };
  if (actionId === 'found') {
    if (!canFound(run)) return { run, ok: false, message: '还没有达到提前成立的条件。' };
    return { run: { ...run, phase: 'ending', ending: computeEnding(run) }, ok: true, message: '成立会开始。' };
  }
  if (run.meters.ap < 1) return { run, ok: false, message: '行动点用完了。结束本回合，或进入议事。' };
  if (actionId === 'draft') {
    if (run.motionDone) return { run, ok: false, message: '这一回合已经提交过动议。' };
    const [clauseId, variantId] = choiceId.split(':');
    const clause = CLAUSE_BY_ID[clauseId as keyof typeof CLAUSE_BY_ID];
    if (!clause || !clause.variants.some((variant) => variant.id === variantId)) {
      return { run, ok: false, message: '找不到这个条款。' };
    }
    let next = takeCost(run, 1, 0);
    next.pendingMotion = { kind: 'clause', clauseId: clause.id, variantId };
    next.phase = 'council';
    return { run: next, ok: true, message: '条款已提交五席。' };
  }
  if (actionId === 'policy') {
    if (run.motionDone) return { run, ok: false, message: '这一回合已经提交过动议。' };
    const [policy, variant] = choiceId.split(':');
    if (policy === 'od' && run.documents.od !== 'none') return { run, ok: false, message: '旧公约已经处理过。' };
    if (policy === 'blockade' && run.turn < 4) return { run, ok: false, message: '封锁宣言要到第 4 回合才会出现。' };
    const next = takeCost(run, 1, 0);
    next.pendingMotion = {
      kind: 'policy',
      policy: policy === 'blockade' ? 'blockade' : 'od',
      variantId: variant,
    };
    next.phase = 'council';
    return { run: next, ok: true, message: '动议已提交五席。' };
  }

  let next = structuredClone(run);
  let pcCost = 0;
  let message = '行动完成。';
  if (actionId === 'negotiate') {
    pcCost = 1;
    if (choiceId === 'left' && next.relations.leftLeader === 'sage' && next.relations.friendProgress === 1) {
      pcCost = 0;
      next.relations.friendProgress = 0;
    }
    if (next.meters.pc < pcCost) return { run, ok: false, message: '政治资本不够。' };
    next = takeCost(next, 1, pcCost);
    const delta = choiceId === 'left' ? 1 : 1;
    next = applyEffect(next, { chaos: -4, relation: { [choiceId]: delta } });
    message = '缓和完成：' + (choiceId === 'left' ? leaderName(run) : '鸡哥') + '关系 +1，混乱 -4。';
    next = addLog(next, '缓和', '你和' + (choiceId === 'left' ? leaderName(run) : '鸡哥') + '谈了一次。', 'blue');
  } else if (actionId === 'statement') {
    next = takeCost(next, 1, 0);
    if (choiceId === 'mild') {
      next = applyEffect(next, { exposure: 8, chaos: -2, relation: { left: 1 }, move: [{ from: 'mass', to: 'harm', n: 2 }] });
      message = '发言完成：自由左关系 +1，暴露 +8，混乱 -2，群众→减害 2。';
      next = addLog(next, '公开言论', '你承认两边都在自卫。有人觉得你软，有人第一次转发了你的话。', 'blue');
    } else if (choiceId === 'hard') {
      next = applyEffect(next, { exposure: 12, chaos: 4, relation: { left: -1, right: -1 }, move: [{ from: 'right', to: 'mass', n: 2 }] });
      message = '发言完成：自由左/自由右关系 -1，暴露 +12，混乱 +4，自由右→群众 2。';
      next = addLog(next, '公开言论', '你把旧账一次说清。清得很干净，桌子也空了一点。', 'red');
    } else {
      next = applyEffect(next, { exposure: 9, chaos: -2, move: [{ from: 'mass', to: 'harm', n: 3 }] });
      if (run.documents.manual.knowledge.status === 'passed') {
        next = applyEffect(next, { move: [{ from: 'mass', to: 'harm', n: 1 }] });
      }
      message = '发言完成：暴露 +9，混乱 -2，群众→减害 3。';
      next = addLog(next, '公开言论', '你只讲急救与转介。没有立场，只有电话和地址。', 'green');
    }
  } else if (actionId === 'spread') {
    next = takeCost(next, 1, 0);
    next = applyEffect(next, { exposure: 6, chaos: -1, move: [{ from: 'mass', to: 'harm', n: 3 }] });
    message = '传播完成：暴露 +6，混乱 -1，群众→减害 3。';
    next = addLog(next, '传播', '值班表发出去了。有人转，有人骂，有人私信问今晚有没有人。', 'green');
  } else if (actionId === 'document') {
    next = takeCost(next, 1, 0);
    if (choiceId === 'public') {
      next = applyEffect(next, { exposure: -12, trust: 4, move: [{ from: 'mass', to: 'harm', n: 1 }] });
      message = '公开说明完成：暴露 -12，信任 +4，群众→减害 1。';
      next = addLog(next, '编写文档', '公开说明发出去了。它不能替谁辩护，但至少把能查到的部分写清楚了。', 'green');
    } else if (choiceId === 'internal') {
      next = applyEffect(next, { exposure: -6, trust: 2, chaos: -3 });
      message = '内部复盘完成：暴露 -6，信任 +2，混乱 -3。';
      next = addLog(next, '编写文档', '内部复盘只留在桌上。有人第一次看见自己那一段被写进去。', 'blue');
    } else if (choiceId === 'appeal') {
      next = applyEffect(next, { exposure: -8, chaos: -1 });
      message = '申诉模板完成：暴露 -8，混乱 -1。';
      next = addLog(next, '编写文档', '申诉模板写好了。平台不会因此喜欢你们，但删帖前会多看一眼。', 'paper');
    } else {
      return { run, ok: false, message: '找不到这份文档。' };
    }
  } else if (actionId === 'coverup') {
    next = takeCost(next, 1, 0);
    if (choiceId === 'local') {
      next = applyEffect(next, { exposure: -18, chaos: 6, trust: -2 });
      message = '封锁完成：暴露 -18，混乱 +6，信任 -2。';
      next = addLog(next, '封锁消息', '本地报道压下去了。外面安静了，屋里的人开始互相猜是谁打的电话。', 'red');
    } else if (choiceId === 'appeal') {
      next = applyEffect(next, { exposure: -10, chaos: 1, trust: 1 });
      message = '封锁完成：暴露 -10，混乱 +1，信任 +1。';
      next = addLog(next, '封锁消息', '只申诉，不删证据。平台回复得很慢，但那条帖子暂时还在。', 'paper');
    } else {
      return { run, ok: false, message: '找不到这条封锁方式。' };
    }
  } else if (actionId === 'firstAid') {
    next = takeCost(next, 1, 0);
    if (choiceId === 'aid') {
      next = applyEffect(next, { trust: 5, chaos: -5, exposure: 2, move: [{ from: 'mass', to: 'harm', n: 2 }], flags: ['first-aid'] });
      message = '急救完成：信任 +5，混乱 -5，暴露 +2，群众→减害 2。';
      next = addLog(next, '急救 / 转介', '电话接通了。救护车来之前，有人一直陪着。', 'green');
    } else if (choiceId === 'quiet') {
      next = applyEffect(next, { trust: -2, chaos: 1, exposure: -2, move: [{ from: 'mass', to: 'harm', n: 1 }] });
      message = '急救完成：信任 -2，混乱 +1，暴露 -2，群众→减害 1。';
      next = addLog(next, '急救 / 转介', '没有留记录。人接住了，第二天没有人再提这件事。', 'paper');
    } else {
      return { run, ok: false, message: '找不到这个急救方式。' };
    }
  } else if (actionId === 'training') {
    if (choiceId === 'handover') {
      if (next.meters.pc < 1) return { run, ok: false, message: '政治资本不够。' };
      next = takeCost(next, 1, 1);
      next = applyEffect(next, { trust: 5, chaos: -4, move: [{ from: 'mass', to: 'harm', n: 1 }] });
      message = '培训完成：信任 +5，混乱 -4，群众→减害 1。';
      next = addLog(next, '培训值班人', '你把急救流程和交接表讲了一遍。有人第一次知道电话应该先打给谁。', 'green');
    } else if (choiceId === 'notes') {
      next = takeCost(next, 1, 0);
      next = applyEffect(next, { trust: 2, chaos: -2, exposure: -1 });
      message = '交接完成：信任 +2，混乱 -2，暴露 -1。';
      next = addLog(next, '培训值班人', '你只留下电话和地址。没有流程，但至少下一班知道该找谁。', 'blue');
    } else {
      return { run, ok: false, message: '找不到这个培训方式。' };
    }
  } else if (actionId === 'suppress') {
    if (choiceId !== 'left' && choiceId !== 'right') return { run, ok: false, message: '群众没有可清场的席位。' };
    next = takeCost(next, 1, 0);
    next = applyEffect(next, {
      exposure: 5,
      chaos: 8,
      relation: { [choiceId]: -1 },
      move: [{ from: choiceId as Faction, to: 'mass', n: 4 }],
      flags: ['suppressed-' + choiceId],
    });
    message = '清场完成：' + (choiceId === 'left' ? '自由左' : '自由右') + '→群众 4，关系 -1，暴露 +5，混乱 +8。';
    next = addLog(next, '打压 / 清场', '你清掉了' + (choiceId === 'left' ? '自由左' : '自由右') + '的四个格子。他们退回了群众。', 'red');
  } else {
    return { run, ok: false, message: '找不到这个行动。' };
  }
  next.phase = 'table';
  return { run: endIfFailed(next), ok: true, message };
}

export function getNightLines(run: AfterstoryRun): string[] {
  return [...getTurnContent(run.turn).night];
}

export function endTurn(run: AfterstoryRun): ActionResult {
  if (run.phase !== 'table') return { run, ok: false, message: '现在不能结束回合。' };
  let next = structuredClone(run);
  if (!next.replied) {
    next = applyEffect(next, { trust: -2, chaos: 1 });
    next = addLog(next, '来访者', '你没有回复。对方没有再问第二遍。', 'red');
  }
  const lines = getNightLines(next);
  // 夜间漂移：信任高时减害吸收；自由左友好时吸收；群众格被组织吸收。
  if (next.meters.trust > 50) {
    next.cells = moveCells(next.cells, 'mass', 'harm', 1, next.turn);
    lines.push('夜间答疑桌多留了一盏灯。一个群众格转成减害。');
  }
  if (next.relations.leftLeader === 'sage' && next.relations.left === 'friendly') {
    next.cells = moveCells(next.cells, 'mass', 'left', 1, next.turn);
    lines.push('自由左把一条公开词典的链接转进了群众群。');
  } else if (next.relations.left === 'hostile') {
    next.cells = moveCells(next.cells, 'harm', 'mass', 1, next.turn);
    lines.push('自由左在群里点名你。一个减害格退了出去。');
  }
  if (next.relations.right === 'neutral') {
    next.cells = moveCells(next.cells, 'mass', 'right', 1, next.turn);
    lines.push('鸡哥的人还在拉群。一个群众格往右移。');
  }
  if (next.documents.od === 'maintained') {
    next.meters.exposure = clamp(next.meters.exposure - 2, 0, 100);
    next.meters.chaos = clamp(next.meters.chaos + 2, 0, 100);
    lines.push('OD 不扩散公约还在生效。外面少问了一点，屋里少说了一点。');
  }
  if (next.documents.blockade) {
    next.meters.exposure = clamp(next.meters.exposure - 2, 0, 100);
    next.meters.chaos = clamp(next.meters.chaos + 3, 0, 100);
    lines.push('墙内封锁宣言还在生效。外围又安静了一层。');
  }
  if (next.meters.exposure >= 75) {
    next.meters.chaos = clamp(next.meters.chaos + 2, 0, 100);
    next.meters.trust = clamp(next.meters.trust - 2, 0, 100);
    lines.push('平台发来第三次限流通知。有人开始删聊天记录。');
  } else if (next.meters.exposure >= 50 && next.turn % 2 === 0) {
    next.meters.chaos = clamp(next.meters.chaos + 1, 0, 100);
    lines.push('记者在门口等了一会儿，没有进来。');
  }
  const external = externalEventFor(next);
  if (external) {
    next = applyEffect(next, external.effect);
    next.externalEvent = external.id;
    lines.push('外界观察：' + external.title + '。');
    next = addLog(next, '外界观察', external.title + ' — ' + external.effectText, 'red');
  }
  if (next.meters.chaos >= 80) {
    return { run: { ...next, phase: 'ending', ending: 'chaos', night: lines }, ok: true, message: '失控。' };
  }
  if (harmRatio(next) < 0.1) {
    return { run: { ...next, phase: 'ending', ending: 'ebb', night: lines }, ok: true, message: '退潮。' };
  }
  if (next.turn === 2) {
    const dead = structuredClone(next);
    dead.relations.leftLeader = 'sage';
    dead.cells = moveCells(dead.cells, 'left', 'mass', 1, 3);
    dead.meters.exposure = clamp(dead.meters.exposure + 10, 0, 100);
    dead.meters.chaos = clamp(dead.meters.chaos + 8, 0, 100);
    dead.meters.trust = clamp(dead.meters.trust - 5, 0, 100);
    dead.flags.push('edward-dead');
    dead.phase = 'interlude';
    dead.night = lines;
    return { run: dead, ok: true, message: '爱德华死了。' };
  }
  if (next.turn >= TURN_COUNT) {
    return { run: { ...next, phase: 'ending', ending: computeEnding(next), night: lines }, ok: true, message: '成立会。' };
  }
  next.phase = 'night';
  next.night = lines;
  next = addLog(next, '夜报', lines.join(' '), 'paper');
  return { run: next, ok: true, message: '天亮了。' };
}

export function advanceTurn(run: AfterstoryRun): ActionResult {
  if (run.phase !== 'night') return { run, ok: false, message: '现在不能进入下一回合。' };
  const next = structuredClone(run);
  next.turn = Math.min(TURN_COUNT, next.turn + 1);
  next.phase = 'brief';
  next.meters.pc = clamp(next.meters.pc + 1, 0, 8);
  next.meters.ap = 2;
  next.replied = false;
  next.motionDone = false;
  next.pendingMotion = undefined;
  next.night = [];
  next.externalEvent = undefined;
  return { run: next, ok: true, message: '第 ' + next.turn + ' 回合。' };
}

export function resolveDeath(run: AfterstoryRun, response: DeathResponse): ActionResult {
  if (run.phase !== 'interlude') return { run, ok: false, message: '现在不在幕间。' };
  if (run.death) return { run, ok: false, message: '死亡事件已经处理过。' };
  let next = structuredClone(run);
  next.death = { response };
  if (response === 'accountability') {
    next.relations.left = stepRelation(next.relations.left, -1, 'sage');
    next.meters.exposure = clamp(next.meters.exposure + 8, 0, 100);
    next.meters.chaos = clamp(next.meters.chaos + 5, 0, 100);
    next.flags.push('death-accountability');
  } else if (response === 'careFirst') {
    next.relations.left = 'neutral';
    next.meters.trust = clamp(next.meters.trust + 5, 0, 100);
    next.meters.chaos = clamp(next.meters.chaos - 3, 0, 100);
    next.relations.friendProgress = 1;
    next.flags.push('death-care', 'friend-progress');
  } else {
    next.meters.trust = clamp(next.meters.trust - 3, 0, 100);
    next.meters.chaos = clamp(next.meters.chaos + 3, 0, 100);
    next.flags.push('death-silence');
  }
  const option = DEATH_INTERLUDE.options.find((item) => item.id === response);
  next = addLog(next, '幕间 · 空椅', option?.line ?? '你什么也没有说。', 'red');
  next.turn = 3;
  next.phase = 'brief';
  next.meters.pc = clamp(next.meters.pc + 1, 0, 8);
  next.meters.ap = 2;
  next.replied = false;
  next.motionDone = false;
  next.pendingMotion = undefined;
  next.night = [];
  next.externalEvent = undefined;
  return { run: endIfFailed(next), ok: true, message: option?.line ?? '第 3 回合。' };
}

export function relationSummary(run: AfterstoryRun): string {
  return [
    '自由左（' + leaderName(run) + '）：' + relationText(run, 'left'),
    '自由右：' + relationText(run, 'right'),
  ].join(' / ');
}

export function endingContent(id: EndingId) {
  return ENDINGS[id];
}

export function turnLabel(run: AfterstoryRun): string {
  return '第 ' + run.turn + ' 回合 / ' + getTurnContent(run.turn).date;
}

export function normalizeAfterstory(value: unknown): AfterstoryRun | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<AfterstoryRun>;
  if (candidate.version !== 1 || typeof candidate.seed !== 'number') return undefined;
  if (!Array.isArray(candidate.cells) || candidate.cells.length !== 100) return undefined;
  if (typeof candidate.turn !== 'number' || candidate.turn < 1 || candidate.turn > 8) return undefined;
  if (!candidate.relations || !candidate.meters || !candidate.documents) return undefined;
  if (!candidate.documents.manual) return undefined;
  const rawCells = candidate.cells.filter(
    (cell) =>
      Boolean(cell) &&
      typeof cell.row === 'number' &&
      typeof cell.col === 'number' &&
      ['harm', 'left', 'right', 'mass', 'empty'].includes(cell.faction) &&
      typeof cell.source === 'string',
  );
  if (rawCells.length !== 100) return undefined;
  const cells: Cell[] = rawCells.map((cell) => ({
    ...cell,
    faction: (cell as unknown as { faction: string }).faction === 'empty' ? 'mass' : cell.faction,
  })) as Cell[];
  const run: AfterstoryRun = {
    ...(candidate as AfterstoryRun),
    cells,
    meters: {
      trust: clamp(Number(candidate.meters.trust) || 0, 0, 100),
      chaos: clamp(Number(candidate.meters.chaos) || 0, 0, 100),
      exposure: clamp(Number(candidate.meters.exposure) || 0, 0, 100),
      pc: clamp(Number(candidate.meters.pc) || 0, 0, 8),
      ap: clamp(Number(candidate.meters.ap) || 0, 0, 3),
    },
    relations: {
      left: ['hostile', 'neutral', 'friendly'].includes(candidate.relations.left) ? candidate.relations.left : 'neutral',
      right: ['hostile', 'neutral'].includes(candidate.relations.right) ? candidate.relations.right : 'neutral',
      leftLeader: candidate.relations.leftLeader === 'sage' ? 'sage' : 'edward',
      friendProgress: candidate.relations.friendProgress === 1 ? 1 : 0,
    },
    flags: Array.isArray(candidate.flags) ? candidate.flags.filter((flag): flag is string => typeof flag === 'string') : [],
    log: Array.isArray(candidate.log) ? candidate.log.slice(-40) : [],
    night: Array.isArray(candidate.night) ? candidate.night.filter((line): line is string => typeof line === 'string') : [],
  };
  if (run.relations.leftLeader === 'edward' && run.relations.left === 'friendly') run.relations.left = 'neutral';
  return run;
}
