import { describe, expect, it } from 'vitest';
import { CUES } from '../audio/manifest';
import { resolveSceneCue } from '../audio/cues';
import { chapterLoaders } from '../content/generated';

describe('场景配乐与背景', () => {
  it('每一场都有可用的配乐，且不会播完就静音', async () => {
    const scenes: { id: string; cue: string; loop: boolean }[] = [];
    for (const load of Object.values(chapterLoaders)) {
      const chapter = await load();
      for (const scene of chapter.scenes) {
        const cue = resolveSceneCue({ id: scene.id, chapterId: chapter.id });
        expect(CUES[cue], `${scene.id} → ${cue}`).toBeTruthy();
        scenes.push({ id: scene.id, cue, loop: CUES[cue].loop });
      }
    }
    expect(scenes.length).toBeGreaterThan(100);
    // 只有终章最后一幕允许用不循环的片尾曲
    const nonLoop = scenes.filter((scene) => !scene.loop);
    expect(nonLoop.map((scene) => scene.id)).toEqual(['ch04.s40']);
    expect(CUES['drug-war'].loop).toBe(false);
    expect(CUES['separation']).toBeTruthy();
  });

  it('配乐不是整章一首：主要章节至少有 4 首不同的曲子', async () => {
    const byChapter: Record<string, Set<string>> = {};
    for (const load of Object.values(chapterLoaders)) {
      const chapter = await load();
      for (const scene of chapter.scenes) {
        const cue = resolveSceneCue({ id: scene.id, chapterId: chapter.id });
        (byChapter[chapter.id] ??= new Set()).add(cue);
      }
    }
    for (const chapterId of ['ch01', 'ch02', 'ch03', 'ch04']) {
      expect(byChapter[chapterId].size, chapterId).toBeGreaterThanOrEqual(4);
    }
    expect(byChapter.ch04.has('afterglow')).toBe(false);
    expect(byChapter.ch04.has('battle')).toBe(true);
    expect(byChapter.ch04.has('separation')).toBe(true);
  });
});
