import { describe, expect, it } from 'vitest';
import { computeScale } from '../game/scale';

describe('computeScale', () => {
  it('uses integer fit for auto scale', () => {
    expect(computeScale('auto', 480, 270)).toBe(1);
    expect(computeScale('auto', 960, 540)).toBe(2);
    expect(computeScale('auto', 1440, 810)).toBe(3);
    expect(computeScale('auto', 1920, 1080)).toBe(4);
    expect(computeScale('auto', 300, 200)).toBe(1);
  });

  it('honors a locked scale', () => {
    expect(computeScale(2, 480, 270)).toBe(2);
    expect(computeScale(4, 960, 540)).toBe(4);
  });
});