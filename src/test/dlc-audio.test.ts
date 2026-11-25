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

  it('8 关战斗统一用燃曲 battle（Start the battle）', () => {
    for (const battle of BATTLES) {
      expect(battle.bgm, battle.id).toBe('battle');
      expect(CUES[battle.bgm as keyof typeof CUES]).toBeTruthy();
    }
  });

  it('曾经闲置的 night-market 现在可达', () => {
    expect(cueForPath('/dlc/shop')).toBe('night-market');
  });
});
