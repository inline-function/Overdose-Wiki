import { getEffectMeta, getReportMeta } from '../content/registry';
import { t } from '../i18n';
import type { Save } from './types';

export type QuestTask = {
  id: string;
  label: string;
  kind: 'doc' | 'effect';
  ref: string;
};

export type ChapterQuest = {
  id: string;
  title: string;
  tasks: QuestTask[];
};

const QUESTS_RAW: Record<string, ChapterQuest> = {
  ch01: {
    id: 'ch01',
    title: '第一批归档',
    tasks: [
      { id: 'ch01.doc.108', label: '编写《od引论》', kind: 'doc', ref: '108' },
      { id: 'ch01.effect.解离', label: '编写效果文档「解离」', kind: 'effect', ref: '解离' },
      { id: 'ch01.effect.反解离', label: '编写效果文档「反解离」', kind: 'effect', ref: '反解离' },
    ],
  },
  ch02: {
    id: 'ch02',
    title: '第二次校订',
    tasks: [
      { id: 'ch02.effect.幻觉', label: '编写效果文档「幻觉」', kind: 'effect', ref: '幻觉' },
      { id: 'ch02.effect.谵妄', label: '编写效果文档「谵妄」', kind: 'effect', ref: '谵妄' },
      { id: 'ch02.effect.镇静', label: '编写效果文档「镇静」', kind: 'effect', ref: '镇静' },
    ],
  },
  ch03: {
    id: 'ch03',
    title: '消失前的索引',
    tasks: [
      { id: 'ch03.effect.恢复术', label: '编写效果文档「恢复术」', kind: 'effect', ref: '恢复术' },
      { id: 'ch03.doc.104', label: '编写《od不扩散公约》', kind: 'doc', ref: '104' },
      { id: 'ch03.doc.101', label: '编写《高原人员构成分析》', kind: 'doc', ref: '101' },
    ],
  },
  ch04: {
    id: 'ch04',
    title: '废墟上的记录',
    tasks: [
      { id: 'ch04.doc.109', label: '编写《od分论》', kind: 'doc', ref: '109' },
    ],
  },
};

const TITLE_KEYS = {
  ch01: 'quest.ch01.title',
  ch02: 'quest.ch02.title',
  ch03: 'quest.ch03.title',
  ch04: 'quest.ch04.title',
} as const;

/** Labels point at whichever title the current locale shows for the doc/effect. */
function taskLabel(task: QuestTask): string {
  const title =
    task.kind === 'doc'
      ? (getReportMeta(task.ref)?.title ?? '')
      : (getEffectMeta(task.ref)?.title ?? '');
  return task.kind === 'doc'
    ? t('quest.writeDoc', { title })
    : t('quest.writeEffect', { title });
}

function localizedQuest(quest: ChapterQuest): ChapterQuest {
  const key = TITLE_KEYS[quest.id as keyof typeof TITLE_KEYS];
  return {
    id: quest.id,
    title: key ? t(key) : quest.title,
    tasks: quest.tasks.map((task) => ({ ...task, label: taskLabel(task) })),
  };
}

export function questFor(chapterId: string): ChapterQuest | undefined {
  const raw = QUESTS_RAW[chapterId];
  return raw ? localizedQuest(raw) : undefined;
}

export function taskDone(save: Save, task: QuestTask): boolean {
  if (task.kind === 'effect') return save.readEffects.includes(task.ref);
  return (save.read[task.ref] ?? []).length > 0;
}

export function questTasks(save: Save, chapterId: string) {
  const quest = questFor(chapterId);
  if (!quest) return [];
  return quest.tasks.map((task) => ({ ...task, done: taskDone(save, task) }));
}

export function isQuestComplete(save: Save, chapterId: string): boolean {
  const tasks = questTasks(save, chapterId);
  return tasks.length > 0 && tasks.every((task) => task.done);
}

export function isQuestClaimed(save: Save, chapterId: string): boolean {
  return save.claimedQuests.includes(chapterId);
}
