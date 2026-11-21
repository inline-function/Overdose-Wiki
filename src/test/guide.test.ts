import { describe, expect, it } from 'vitest';
import { nextGuide } from '../game/guide';
import { defaultSave } from '../game/types';
import type { Save } from '../game/types';

const effectDoc = (name: string) => `/docs?effect=${encodeURIComponent(name)}`;

function save(patch: Partial<Save> = {}): Save {
  return {
    ...defaultSave(),
    completedScenes: ['ch01.s14'],
    progress: { beat: 0, reportId: '7', segmentId: 'ch01.s14', sceneId: 'ch01.s14' },
    ...patch,
  };
}

describe('nextGuide', () => {
  it('stays quiet on a fresh save', () => {
    expect(nextGuide(defaultSave())).toBeNull();
  });

  it('stays quiet while the chapter is still being read', () => {
    expect(
      nextGuide(
        save({
          completedScenes: ['ch01.s01'],
          progress: { beat: 0, reportId: '7', segmentId: 'ch01.s05', sceneId: 'ch01.s05' },
        }),
      ),
    ).toBeNull();
  });

  it('points at od引论 first after chapter 1', () => {
    const guide = nextGuide(save())!;
    expect(guide.title).toBe('第一批归档');
    expect(guide.step).toContain('od引论');
    expect(guide.to).toBe('/docs?write=108');
    expect(guide.action).toBe('去编写');
    expect(guide.done).toBe(0);
    expect(guide.total).toBe(3);
  });

  it('moves through chapter 1 effect documents after od引论', () => {
    const guide = nextGuide(save({ read: { 108: ['x'] } }))!;
    expect(guide.step).toContain('解离');
    expect(guide.to).toBe(effectDoc('解离'));
    expect(guide.done).toBe(1);
  });

  it('points at the next chapter once chapter 1 is written', () => {
    const guide = nextGuide(
      save({ read: { 108: ['x'] }, readEffects: ['解离', '反解离'] }),
    )!;
    expect(guide.title).toBe('第二次校订');
    expect(guide.step).toContain('第二章');
    expect(guide.action).toBe('继续剧情');
    expect(guide.to).toBe('/report/49/replay/ch02.s01');
  });

  it('shows the pending quest even if play already jumped to the next chapter', () => {
    const guide = nextGuide(
      save({
        completedScenes: ['ch01.s01', 'ch01.s14'],
        read: { 108: ['x'] },
        progress: { beat: 0, reportId: '49', segmentId: 'ch02.s01', sceneId: 'ch02.s01' },
      }),
    )!;
    expect(guide.title).toBe('第一批归档');
    expect(guide.to).toBe(effectDoc('解离'));
  });

  it('walks chapter 2 effect documents in order', () => {
    const guide = nextGuide(
      save({
        completedScenes: ['ch01.s14', 'ch02.s24'],
        read: { 108: ['x'] },
        readEffects: ['解离', '反解离'],
        progress: { beat: 0, reportId: '49', segmentId: 'ch02.s24', sceneId: 'ch02.s24' },
      }),
    )!;
    expect(guide.title).toBe('第二次校订');
    expect(guide.step).toContain('幻觉');
    expect(guide.to).toBe(effectDoc('幻觉'));
    expect(guide.done).toBe(0);
    expect(guide.total).toBe(3);
  });

  it('points at 恢复术 when chapter 3 begins its archive', () => {
    const guide = nextGuide(
      save({
        completedScenes: ['ch01.s14', 'ch02.s24', 'ch03.s24'],
        read: { 108: ['x'] },
        readEffects: ['解离', '反解离', '幻觉', '谵妄', '镇静'],
        progress: { beat: 0, reportId: '49', segmentId: 'ch03.s24', sceneId: 'ch03.s24' },
      }),
    )!;
    expect(guide.title).toBe('消失前的索引');
    expect(guide.step).toContain('恢复术');
    expect(guide.to).toBe(effectDoc('恢复术'));
  });

  it('points at 高原人员构成分析 after 恢复术 and the covenant', () => {
    const guide = nextGuide(
      save({
        completedScenes: ['ch01.s14', 'ch02.s24', 'ch03.s24'],
        read: { 108: ['x'], 104: ['x'] },
        readEffects: ['解离', '反解离', '幻觉', '谵妄', '镇静', '恢复术'],
        progress: { beat: 0, reportId: '49', segmentId: 'ch03.s24', sceneId: 'ch03.s24' },
      }),
    )!;
    expect(guide.title).toBe('消失前的索引');
    expect(guide.step).toContain('高原人员构成分析');
    expect(guide.to).toBe('/docs?write=101');
    expect(guide.done).toBe(2);
    expect(guide.total).toBe(3);
  });

  it('points at od分论 in chapter 4', () => {
    const guide = nextGuide(
      save({
        completedScenes: ['ch01.s14', 'ch02.s24', 'ch03.s24', 'ch04.s40'],
        read: { 108: ['x'], 104: ['x'], 101: ['x'] },
        readEffects: ['解离', '反解离', '幻觉', '谵妄', '镇静', '恢复术'],
        progress: { beat: 0, reportId: '49', segmentId: 'ch04.s40', sceneId: 'ch04.s40' },
      }),
    )!;
    expect(guide.title).toBe('废墟上的记录');
    expect(guide.step).toContain('od分论');
    expect(guide.to).toBe('/docs?write=109');
  });

  it('stays quiet again once the next chapter starts', () => {
    expect(
      nextGuide(
        save({
          read: { 108: ['x'] },
          readEffects: ['解离', '反解离'],
          completedScenes: ['ch01.s14', 'ch02.s01'],
          progress: { beat: 0, reportId: '49', segmentId: 'ch02.s02', sceneId: 'ch02.s02' },
        }),
      ),
    ).toBeNull();
  });
});
