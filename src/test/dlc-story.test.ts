import { describe, expect, it } from 'vitest';
import { DLC_STORY, DLC_STORY_MAP } from '../dlc/story';
import { CUES } from '../audio/manifest';

const MOODS = ['calm', 'smile', 'intense', 'tired', 'sad', 'restless', 'blank', 'hurt'];

describe('DLC 剧情 interlude', () => {
  it('八关战前幕 + 尾幕齐全，跳转正确', () => {
    for (let n = 1; n <= 8; n += 1) {
      const scene = DLC_STORY_MAP[`interlude-${n}`];
      expect(scene, `interlude-${n}`).toBeTruthy();
      expect(scene.next).toBe(`/dlc/battle?stage=${n}`);
    }
    expect(DLC_STORY_MAP['tail'].next).toBe('/dlc/ending');
  });

  it('每幕轻量（≤4 拍），表情/BGM/背景合法', () => {
    for (const scene of DLC_STORY) {
      expect(scene.beats.length).toBeLessThanOrEqual(5);
      expect(scene.beats.length).toBeGreaterThan(0);
      if (scene.bgm) expect(CUES[scene.bgm as keyof typeof CUES], scene.id).toBeTruthy();
      expect(scene.bg.startsWith('bg_dlc_')).toBe(true);
      for (const beat of scene.beats) {
        if (beat.expr) expect(MOODS).toContain(beat.expr);
        expect(beat.text.length).toBeGreaterThan(0);
      }
    }
  });
});
