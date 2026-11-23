import { describe, expect, it } from 'vitest';
import { applyWarDecision, recomputeWarTable, sumWarEffects } from '../game/warTable';
import { defaultWarTable } from '../game/types';

describe('war table', () => {
  it('applies an operation and clamps meters', () => {
    const table = applyWarDecision(defaultWarTable(), 'ch04.test:a', 'a', {
      chicken: -200,
      trust: 10,
      escalation: 10,
    });
    expect(table.chicken).toBe(0);
    expect(table.trust).toBe(60);
    expect(table.escalation).toBe(5);
    expect(table.decisions['ch04.test:a']?.choice).toBe('a');
  });

  it('replaces the same operation instead of stacking it', () => {
    const first = applyWarDecision(defaultWarTable(), 'ch04.test:a', 'a', { goto: 10 });
    const second = applyWarDecision(first, 'ch04.test:a', 'b', { goto: 20 });
    expect(second.goto).toBe(70);
    expect(second.decisions['ch04.test:a']?.choice).toBe('b');
    expect(Object.keys(second.decisions)).toHaveLength(1);
  });

  it('recomputes from decisions and keeps flags unique', () => {
    const table = recomputeWarTable({
      a: { choice: 'a', effects: { archive: 5, flags: ['x'] } },
      b: { choice: 'b', effects: { archive: 5, flags: ['x', 'y'] } },
    });
    expect(table.archive).toBe(60);
    expect(table.flags).toEqual(['x', 'y']);
  });

  it('sums line-level effects', () => {
    expect(sumWarEffects([
      { trust: 4, archive: -6, flags: ['a'] },
      { trust: -8, escalation: 1, flags: ['a', 'b'] },
    ])).toEqual({ trust: -4, archive: -6, escalation: 1, flags: ['a', 'b'] });
  });
});
