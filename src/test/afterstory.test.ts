import { describe, expect, it } from 'vitest';
import {
  activeCells,
  advanceTurn,
  buildCells,
  canFound,
  castVote,
  clauseLabel,
  computeEnding,
  countCells,
  createRun,
  endTurn,
  externalChance,
  externalEventFor,
  getActions,
  getSeats,
  getSignatures,
  includedRatio,
  isMeterWarning,
  manualCount,
  normalizeAfterstory,
  resolveAction,
  resolveDeath,
  resolveReply,
  seatWeightTotal,
  startVisit,
  warningMeters,
} from '../afterstory/engine';
import type { AfterstoryRun, EndingId, Faction } from '../afterstory/types';

function cells(factions: Faction[]) {
  return factions.map((faction, index) => ({
    id: 'test-' + index,
    row: Math.floor(index / 10),
    col: index % 10,
    faction,
    source: '测试来源',
  }));
}

function withFactions(run: AfterstoryRun, factions: Faction[]): AfterstoryRun {
  return { ...run, cells: cells(factions) };
}

function fill(faction: Faction, n: number): Faction[] {
  return Array.from({ length: n }, () => faction);
}

function toTurn2Interlude(): AfterstoryRun {
  let run = createRun(7);
  run = startVisit(run).run;
  run = resolveReply(run, 'sit').run;
  run = resolveAction(run, 'policy', 'od:revise').run;
  run = castVote(run, ['left', 'right']).run;
  run = resolveAction(run, 'spread', 'spread').run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;
  run = startVisit(run).run;
  run = resolveReply(run, 'listen').run;
  run = resolveAction(run, 'draft', 'names:circle').run;
  run = castVote(run, ['left', 'right']).run;
  run = resolveAction(run, 'spread', 'spread').run;
  return endTurn(run).run;
}

function playNewCircle(): AfterstoryRun {
  let run = createRun(42);
  run = startVisit(run).run;
  run = resolveReply(run, 'sit').run;
  run = resolveAction(run, 'policy', 'od:revise').run;
  run = castVote(run, ['left', 'right']).run;
  run = resolveAction(run, 'spread', 'spread').run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;

  run = startVisit(run).run;
  run = resolveReply(run, 'listen').run;
  run = resolveAction(run, 'draft', 'names:circle').run;
  run = castVote(run, ['left', 'right']).run;
  run = resolveAction(run, 'spread', 'spread').run;
  run = endTurn(run).run;
  run = resolveDeath(run, 'careFirst').run;

  run = startVisit(run).run;
  run = resolveReply(run, 'care').run;
  run = resolveAction(run, 'statement', 'mild').run;
  run = resolveAction(run, 'spread', 'spread').run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;

  run = startVisit(run).run;
  run = resolveReply(run, 'facts').run;
  run = resolveAction(run, 'statement', 'mild').run;
  run = resolveAction(run, 'spread', 'spread').run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;

  run = startVisit(run).run;
  run = resolveReply(run, 'protect').run;
  run = resolveAction(run, 'draft', 'overdose:ambulance').run;
  run = castVote(run, []).run;
  run = resolveAction(run, 'firstAid', 'aid').run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;

  run = startVisit(run).run;
  run = resolveReply(run, 'admit').run;
  run = resolveAction(run, 'draft', 'knowledge:open').run;
  run = castVote(run, ['right']).run;
  run = resolveAction(run, 'spread', 'spread').run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;

  run = startVisit(run).run;
  run = resolveReply(run, 'refuse').run;
  run = resolveAction(run, 'draft', 'representation:election').run;
  run = castVote(run, []).run;
  run = endTurn(run).run;
  run = advanceTurn(run).run;

  run = startVisit(run).run;
  run = resolveReply(run, 'sign').run;
  return resolveAction(run, 'found', 'found').run;
}

describe('afterstory engine', () => {
  it('creates the designed 100-cell opening map with four corner clusters', () => {
    const run = createRun(20260110);
    expect(run.cells).toHaveLength(100);
    const counts = countCells(run.cells);
    expect(counts).toEqual({ harm: 32, left: 18, right: 14, mass: 36 });
    expect(activeCells(counts)).toBe(64);
    expect(run.turn).toBe(1);
    expect(run.phase).toBe('brief');
    expect(run.meters).toMatchObject({ trust: 50, chaos: 25, exposure: 20, pc: 3, ap: 2 });
    expect(run.relations.leftLeader).toBe('edward');
    expect(manualCount(run)).toBe(0);
    expect(includedRatio(run)).toBeCloseTo(0.5, 2);

    const inBox = (faction: Faction, rows: number[], cols: number[]) =>
      run.cells.filter((cell) => cell.faction === faction && rows.includes(cell.row) && cols.includes(cell.col)).length;
    expect(inBox('left', [0, 1, 2], [0, 1, 2])).toBeGreaterThan(7);
    expect(inBox('right', [0, 1, 2], [7, 8, 9])).toBeGreaterThan(8);
    expect(inBox('harm', [7, 8, 9], [0, 1, 2])).toBeGreaterThan(6);
    expect(inBox('mass', [7, 8, 9], [7, 8, 9])).toBeGreaterThan(6);
  });

  it('computes warning thresholds and external observation chance', () => {
    expect(isMeterWarning('exposure', 60)).toBe(false);
    expect(isMeterWarning('exposure', 61)).toBe(true);
    expect(isMeterWarning('chaos', 60)).toBe(false);
    expect(isMeterWarning('chaos', 61)).toBe(true);
    expect(isMeterWarning('trust', 30)).toBe(false);
    expect(isMeterWarning('trust', 29)).toBe(true);
    expect(externalChance(createRun(1))).toBe(0);
    const exposed = { ...createRun(1), meters: { ...createRun(1).meters, exposure: 100 } };
    expect(externalChance(exposed)).toBe(1);
    expect(externalEventFor(exposed)).toBeTruthy();
    expect(warningMeters(exposed)).toContain('exposure');
  });

  it('walks brief → visit → table and records the reply', () => {
    let run = createRun(1);
    expect(startVisit(run).run.phase).toBe('visit');
    run = startVisit(run).run;
    const trust = run.meters.trust;
    run = resolveReply(run, 'sit').run;
    expect(run.phase).toBe('table');
    expect(run.replied).toBe(true);
    expect(run.meters.trust).toBeGreaterThan(trust);
    expect(run.log.at(-1)?.label).toBe('回复来访者');
    const actions = getActions(run);
    expect(actions.map((action) => action.id)).toContain('document');
    expect(actions.map((action) => action.id)).toContain('coverup');
    expect(actions.map((action) => action.id)).toContain('firstAid');
    expect(actions.find((action) => action.id === 'draft')).toBeUndefined();
    expect(actions[0]?.art).toBe('/assets/afterstory/event_01_return.png');
  });

  it('trains the next shift and explains unaffordable choices', () => {
    const run = { ...createRun(6), phase: 'table' as const, replied: true };
    const action = getActions(run).find((item) => item.id === 'training');
    expect(action?.choices.find((choice) => choice.id === 'handover')?.disabled).toBeUndefined();

    const poor = { ...run, meters: { ...run.meters, pc: 0 } };
    const poorAction = getActions(poor).find((item) => item.id === 'training');
    expect(poorAction?.choices.find((choice) => choice.id === 'handover')?.disabled).toContain('PC');

    const result = resolveAction(run, 'training', 'handover');
    expect(result.ok).toBe(true);
    expect(result.run.meters.trust).toBe(55);
    expect(result.run.meters.chaos).toBe(21);
    expect(countCells(result.run.cells).harm).toBe(33);
    expect(result.run.log.at(-1)?.label).toBe('培训值班人');
  });

  it('weights seats by cells, keeps the empty chair voteless and rolls lobbies', () => {
    const run = createRun(2);
    const seats = getSeats(run);
    expect(seats.map((seat) => seat.id)).toEqual(['harm1', 'harm2', 'left', 'right', 'mass']);
    expect(seats.find((seat) => seat.id === 'harm1')?.weight).toBe(16);
    expect(seats.find((seat) => seat.id === 'left')?.weight).toBe(18);
    expect(seats.find((seat) => seat.id === 'right')?.weight).toBe(14);
    expect(seats.find((seat) => seat.id === 'mass')).toMatchObject({ holder: '无人', vote: 'absent', weight: 0, lobbyable: false });
    expect(seatWeightTotal(seats)).toBe(64);
    expect(seats.find((seat) => seat.id === 'left')?.chance).toBeGreaterThan(0);
    expect(seats.find((seat) => seat.id === 'left')?.chance).toBeLessThan(1);
    expect(getSignatures(run)).not.toContain('mass');
  });

  it('passes a motion when weighted yes votes clear half', () => {
    let run = createRun(3);
    run = { ...run, turn: 2, phase: 'table', replied: true, relations: { ...run.relations, leftLeader: 'sage', left: 'friendly' } };
    const submitted = resolveAction(run, 'draft', 'names:circle');
    expect(submitted.run.phase).toBe('council');
    expect(clauseLabel(submitted.run.pendingMotion!)).toContain('名字与边界');
    const seats = getSeats(submitted.run);
    const yes = seats.filter((seat) => seat.vote === 'yes').reduce((sum, seat) => sum + seat.weight, 0);
    expect(yes).toBeGreaterThanOrEqual(33);
    const passed = castVote(submitted.run, []).run;
    expect(passed.documents.manual.names).toEqual({ status: 'passed', variantId: 'circle' });
    expect(manualCount(passed)).toBe(1);
  });

  it('switches to Sage after the death interlude and moves one left cell to blank', () => {
    const interlude = toTurn2Interlude();
    expect(interlude.phase).toBe('interlude');
    expect(interlude.relations.leftLeader).toBe('sage');
    expect(interlude.flags).toContain('edward-dead');
    const before = countCells(interlude.cells);
    const broken = interlude.meters;
    const after = resolveDeath(interlude, 'careFirst').run;
    expect(after.phase).toBe('brief');
    expect(after.turn).toBe(3);
    expect(after.death).toEqual({ response: 'careFirst' });
    expect(after.relations.left).toBe('neutral');
    expect(after.relations.friendProgress).toBe(1);
    expect(after.meters.trust).toBe(Math.min(100, broken.trust + 5));
    expect(after.meters.chaos).toBe(Math.max(0, broken.chaos - 3));
    expect(countCells(after.cells).mass).toBe(before.mass);
    expect(resolveDeath(after, 'careFirst').ok).toBe(false);
  });

  it('counts only the Sage-period friendly left and the eligible neutral seats', () => {
    let run = createRun(4);
    run = withFactions(run, [
      ...fill('harm', 40),
      ...fill('left', 10),
      ...fill('right', 10),
      ...fill('mass', 40),
    ]);
    run = { ...run, turn: 6, relations: { ...run.relations, leftLeader: 'sage', left: 'friendly', right: 'neutral' } };
    run.documents.manual.names = { status: 'passed', variantId: 'circle' };
    run.documents.manual.knowledge = { status: 'passed', variantId: 'open' };
    run.documents.manual.overdose = { status: 'passed', variantId: 'ambulance' };
    expect(getSignatures(run)).toEqual(['harm1', 'harm2', 'left', 'right']);

    const edward = { ...run, relations: { ...run.relations, leftLeader: 'edward' as const, left: 'neutral' as const } };
    expect(getSignatures(edward)).not.toContain('left');
  });

  it('computes all seven endings from the final state', () => {
    const run = createRun(5);
    const neutral = { ...run, relations: { ...run.relations, leftLeader: 'sage' as const, left: 'neutral' as const, right: 'neutral' as const } };

    const clinic = withFactions(neutral, [...fill('harm', 80), ...fill('left', 10), ...fill('right', 10)]);
    expect(computeEnding(clinic)).toBe('clinic');

    const oldCircle = withFactions(neutral, [...fill('harm', 60), ...fill('left', 5), ...fill('right', 5), ...fill('mass', 30)]);
    oldCircle.documents.blockade = true;
    oldCircle.relations.left = 'hostile';
    oldCircle.relations.right = 'hostile';
    expect(computeEnding(oldCircle)).toBe('old-circle');

    const ebb = withFactions(neutral, [...fill('harm', 4), ...fill('left', 20), ...fill('right', 20), ...fill('mass', 56)]);
    expect(computeEnding(ebb)).toBe('ebb');

    const chaos = { ...clinic, meters: { ...clinic.meters, chaos: 80 } };
    expect(computeEnding(chaos)).toBe('chaos');

    const market = withFactions(neutral, [...fill('harm', 20), ...fill('left', 25), ...fill('right', 25), ...fill('mass', 30)]);
    expect(computeEnding(market)).toBe('market');

    const longNight = withFactions(neutral, [...fill('harm', 40), ...fill('left', 10), ...fill('right', 10), ...fill('mass', 40)]);
    expect(computeEnding(longNight)).toBe('long-night');
  });

  it('reaches the new-circle ending through the playable route', () => {
    const run = playNewCircle();
    expect(run.phase).toBe('ending');
    expect(run.ending).toBe('new-circle');
    expect(manualCount(run)).toBe(4);
    expect(getSignatures(run)).toHaveLength(4);
    expect(includedRatio(run)).toBeGreaterThan(0.7);
    expect(countCells(run.cells).mass).toBeLessThanOrEqual(15);
    expect(canFound(run)).toBe(false);
  });

  it('applies an external observation event when exposure is critical', () => {
    let run = createRun(9);
    run = { ...run, phase: 'table', replied: true, meters: { ...run.meters, exposure: 100 } };
    const result = endTurn(run).run;
    expect(result.externalEvent).toBeTruthy();
    expect(result.log.some((entry) => entry.label === '外界观察')).toBe(true);
  });

  it('normalizes valid saves and migrates legacy empty cells to blank', () => {
    const run = createRun(6);
    const normalized = normalizeAfterstory(JSON.parse(JSON.stringify(run)));
    expect(normalized?.turn).toBe(1);
    expect(normalized?.cells).toHaveLength(100);

    const legacy = {
      ...run,
      cells: run.cells.map((cell) => ({ ...cell, faction: cell.faction === 'mass' ? 'empty' : cell.faction })),
    };
    const migrated = normalizeAfterstory(legacy);
    expect(migrated?.cells).toHaveLength(100);
    expect(countCells(migrated!.cells).mass).toBe(36);

    const edwardFriendly = normalizeAfterstory({ ...run, relations: { ...run.relations, left: 'friendly' } });
    expect(edwardFriendly?.relations.left).toBe('neutral');
    expect(normalizeAfterstory({ ...run, cells: run.cells.slice(0, 2) })).toBeUndefined();
    expect(normalizeAfterstory({ ...run, turn: 99 })).toBeUndefined();
    expect(normalizeAfterstory(null)).toBeUndefined();
  });

  it('keeps ending IDs type-safe', () => {
    const ids: EndingId[] = ['new-circle', 'clinic', 'old-circle', 'ebb', 'chaos', 'market', 'long-night'];
    expect(new Set(ids).size).toBe(7);
    expect(buildCells(1)).toHaveLength(100);
  });
});
