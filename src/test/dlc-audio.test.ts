import { describe, expect, it } from 'vitest';
import { cueForPath } from '../audio/cues';
import { CUES } from '../audio/manifest';
import { BATTLES } from '../dlc/content';

describe('DLC 配乐', () => {
  it('DLC 各页有专属配乐，战斗交给关卡控制', () => {
    expect(cueForPath('/dlc')).toBe('dlc-summer');
    expect(cueForPath('/dlc/shop')).toBe('night-market');
    expect(cueForPath('/dlc/ending')).toBe('morning');
    expect(cueForPath('/dlc/battle')).toBeUndefined();
  });

  it('8 关战斗配乐按情绪分配且全部存在于 manifest', () => {
    const used = new Set<string>();
    for (const battle of BATTLES) {
      expect(CUES[battle.bgm as keyof typeof CUES], battle.id).toBeTruthy();
      used.add(battle.bgm);
    }
    // 不再只有 tension/dlc-summer 两首
    expect(used.size).toBeGreaterThanOrEqual(5);
    expect(used.has('battle')).toBe(true);
    expect(used.has('separation')).toBe(true);
    expect(used.has('tragedy')).toBe(true);
  });

  it('曾经闲置的 night-market 现在可达', () => {
    expect(cueForPath('/dlc/shop')).toBe('night-market');
  });
});
