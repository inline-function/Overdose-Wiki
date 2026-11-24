import type { Save } from './types';
import { getChapterMeta } from '../content/registry';
import { isChapterUnlocked } from './unlocks';
import { t } from '../i18n';
import { questFor, taskDone } from './quests';
import { CHAPTER_REPORT } from './routing';

export type Guide = {
  title: string;
  step: string;
  action: string;
  to: string;
  done: number;
  total: number;
  finished?: boolean;
};

const ORDER = ['ch01', 'ch02', 'ch03', 'ch04'] as const;

const CHAPTER_KEYS = {
  ch01: 'guide.chapter.ch01',
  ch02: 'guide.chapter.ch02',
  ch03: 'guide.chapter.ch03',
  ch04: 'guide.chapter.ch04',
} as const;

function chapterName(id: string): string {
  const key = CHAPTER_KEYS[id as keyof typeof CHAPTER_KEYS];
  return key ? t(key) : id;
}

const CHAPTER_NAME: Record<string, string> = {
  ch01: '第一章',
  ch02: '第二章',
  ch03: '第三章',
  ch04: '第四章',
};

function chapterMeta(chapterId: string) {
  return getChapterMeta(chapterId);
}

function lastSceneId(chapterId: string): string | undefined {
  const meta = chapterMeta(chapterId);
  return meta?.scenes[meta.scenes.length - 1]?.id;
}

function chapterFinished(save: Save, chapterId: string): boolean {
  const last = lastSceneId(chapterId);
  return Boolean(last && save.completedScenes.includes(last));
}

function chapterStarted(save: Save, chapterId: string): boolean {
  if (save.progress.sceneId?.startsWith(chapterId)) return true;
  const meta = chapterMeta(chapterId);
  return Boolean(meta?.scenes.some((scene) => save.completedScenes.includes(scene.id)));
}

/**
 * 右下角任务指引：只在章节读完后的间隙出现。
 * 以「第一个任务还没做完的章节」为准，避免下一章自动开场后指引消失。
 */
export function nextGuide(save: Save): Guide | null {
  for (const chapterId of ORDER) {
    const quest = questFor(chapterId);
    if (!quest) continue;
    if (!isChapterUnlocked({ id: chapterId } as Parameters<typeof isChapterUnlocked>[0], save)) {
      continue;
    }
    const tasks = quest.tasks.map((task) => ({ task, done: taskDone(save, task) }));
    const done = tasks.filter((item) => item.done).length;
    const total = tasks.length;
    if (tasks.every((item) => item.done)) continue;

    // 这一章还没开始：指路去开这一章
    if (!chapterStarted(save, chapterId)) {
      const meta = chapterMeta(chapterId);
      if (!meta) continue;
      return {
        title: quest.title,
        step: t('guide.startChapter', { chapter: chapterName(chapterId) }),
        action: t('guide.continueStory'),
        to: `/report/${CHAPTER_REPORT[chapterId] ?? '7'}/replay/${meta.firstScene}`,
        done,
        total,
      };
    }

    // 还在读这一章：不打扰
    if (!chapterFinished(save, chapterId)) return null;

    const next = tasks.find((item) => !item.done)!;
    return {
      title: quest.title,
      step: t('guide.writeTask', { label: next.task.label }),
      action: t('guide.goWrite'),
      to:
        next.task.kind === 'doc'
          ? `/docs?write=${next.task.ref}`
          : `/docs?effect=${encodeURIComponent(next.task.ref)}`,
      done,
      total,
    };
  }

  const sceneId = save.progress.sceneId;
  if (sceneId && !save.completedScenes.includes(sceneId)) {
    return {
      title: t('guide.continueTitle'),
      step: t('guide.readOn', { scene: sceneId }),
      action: t('guide.continueAction'),
      to: `/report/${save.progress.reportId ?? '7'}/replay/${sceneId}`,
      done: 0,
      total: 0,
    };
  }
  if (save.completedScenes.length === 0) return null;
  return {
    title: t('guide.doneTitle'),
    step: t('guide.doneStep'),
    action: t('guide.doneAction'),
    to: '/chapters',
    done: 1,
    total: 1,
    finished: true,
  };
}

export { CHAPTER_NAME };
