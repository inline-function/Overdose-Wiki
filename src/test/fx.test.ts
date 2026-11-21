import { describe, expect, it } from 'vitest';
import type { Beat } from '../content/types';
import { FX, LAYER_ANIM, SCENE_ANIM, beatFx } from '../ui/fx';

describe('dialogue fx', () => {
  it('reads fx from dialogue and narration beats', () => {
    const dialogue: Beat = { type: 'dialogue', speaker: '后藤', text: '……', fx: 'shake' };
    const narration: Beat = { type: 'narration', text: '……', fx: 'blur' };
    expect(beatFx(dialogue)).toBe('shake');
    expect(beatFx(narration)).toBe('blur');
  });

  it('ignores unknown or missing fx', () => {
    expect(beatFx(undefined)).toBeUndefined();
    expect(beatFx({ type: 'narration', text: '……' })).toBeUndefined();
    expect(beatFx({ type: 'narration', text: '……', fx: 'meteor' })).toBeUndefined();
  });

  it('every fx has a label and a known sound', () => {
    for (const [id, spec] of Object.entries(FX)) {
      expect(spec.label.length, id).toBeGreaterThan(0);
      expect(['impact', 'dissolve', 'focus', 'halo', 'hollow', 'sting', 'heartbeat', 'broken', 'hiss'], id).toContain(
        spec.sound,
      );
    }
  });

  it('one-shot animations only exist for one-shot fx', () => {
    for (const id of Object.keys(SCENE_ANIM)) expect(FX[id as keyof typeof FX].oneShot).toBe(true);
    for (const id of Object.keys(LAYER_ANIM)) expect(FX[id as keyof typeof FX].oneShot).toBe(true);
  });
});
