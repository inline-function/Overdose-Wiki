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

  it('8 关各配专属战斗曲，且全部存在于 manifest', () => {
    const used = new Set<string>();
    for (const battle of BATTLES) {
      expect(CUES[battle.bgm as keyof typeof CUES], battle.id).toBeTruthy();
      used.add(battle.bgm);
    }
    expect(used.size).toBe(8); // 每关不同
    expect(BATTLES[7].bgm).toBe('battle'); // b8 剧烈变形 = Start the battle
    expect(used.has('battle-city')).toBe(true);
    expect(used.has('battle-sewer')).toBe(true);
  });

  it('曾经闲置的 night-market 现在可达', () => {
    expect(cueForPath('/dlc/shop')).toBe('night-market');
  });
});
