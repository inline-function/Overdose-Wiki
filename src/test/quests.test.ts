import { describe, expect, it } from 'vitest';
import { isQuestComplete, questFor, taskDone } from '../game/quests';
import { defaultSave } from '../game/types';

describe('archive quests', () => {
  it('chapter 1 is od引论 and the two opening effect entries', () => {
    const quest = questFor('ch01')!;
    expect(quest.tasks.map((task) => task.kind)).toEqual(['doc', 'effect', 'effect']);
    expect(quest.tasks.map((task) => task.ref)).toEqual(['108', '解离', '反解离']);
  });

  it('chapter 2 writes the three perception and consciousness effects', () => {
    const quest = questFor('ch02')!;
    expect(quest.tasks.map((task) => task.kind)).toEqual(['effect', 'effect', 'effect']);
    expect(quest.tasks.map((task) => task.ref)).toEqual(['幻觉', '谵妄', '镇静']);
  });

  it('chapter 3 writes 恢复术, the covenant, and the plateau analysis', () => {
    const quest = questFor('ch03')!;
    expect(quest.tasks.map((task) => task.kind)).toEqual(['effect', 'doc', 'doc']);
    expect(quest.tasks.map((task) => task.ref)).toEqual(['恢复术', '104', '101']);
  });

  it('chapter 4 writes od分论', () => {
    const quest = questFor('ch04')!;
    expect(quest.tasks.map((task) => task.kind)).toEqual(['doc']);
    expect(quest.tasks.map((task) => task.ref)).toEqual(['109']);
  });

  it('counts each effect only after it has been read', () => {
    const save = {
      ...defaultSave(),
      read: { 108: ['report-108-full'] },
      readEffects: ['解离'],
    };
    const quest = questFor('ch01')!;
    expect(quest.tasks.filter((task) => taskDone(save, task))).toHaveLength(2);
    expect(isQuestComplete(save, 'ch01')).toBe(false);
    expect(isQuestComplete({ ...save, readEffects: [...save.readEffects, '反解离'] }, 'ch01')).toBe(true);
  });
});
