import { getChapterMeta, getReportMeta } from '../content/registry';
import { t } from '../i18n';
import type { ChapterMeta, ReportMeta, SceneMeta } from '../content/types';
import type { Save } from './types';
import { isQuestComplete, questFor } from './quests';

export function isReportUnlocked(meta: ReportMeta, save: Save): boolean {
  if (meta.id === '7') return true;
  const rule = meta.unlock;
  if (!rule) return true;
  if (rule.kind === 'archive') return true;
  const target = rule.ref ?? rule.scene;
  if (!target) return true;
  return save.completedScenes.includes(target);
}

export function isChapterUnlocked(meta: ChapterMeta, save: Save): boolean {
  switch (meta.id) {
    case 'ch01':
      return true;
    case 'ch02':
      return save.completedScenes.includes('ch01.s14') && isQuestComplete(save, 'ch01');
    case 'ch03':
      return save.completedScenes.includes('ch02.s24') && isQuestComplete(save, 'ch02');
    case 'ch04':
      return save.completedScenes.includes('ch03.s24') && isQuestComplete(save, 'ch03');
    case 'dlc':
      return save.completedScenes.includes('ch01.s14');
    case 'side':
      return true;
    default:
      return true;
  }
}

export function isSceneUnlocked(meta: SceneMeta, save: Save): boolean {
  if (meta.reportId) {
    const report = getReportMeta(meta.reportId);
    if (report && !isReportUnlocked(report, save)) return false;
  }
  const chapter = getChapterMeta(meta.chapterId);
  return chapter ? isChapterUnlocked(chapter, save) : true;
}

export function chapterUnlockHint(id: string): string {
  switch (id) {
    case 'ch02':
      return t('unlock.afterDocs', { chapter: 'ch01', quest: t('quest.ch01.title') });
    case 'ch03':
      return t('unlock.afterDocs', { chapter: 'ch02', quest: t('quest.ch02.title') });
    case 'ch04':
      return t('unlock.afterDocs', { chapter: 'ch03', quest: t('quest.ch03.title') });
    case 'dlc':
      return t('unlock.afterScene', { id: 'ch01.s14' });
    default:
      return t('unlock.archived');
  }
}

export function questHint(id: string): string {
  const quest = questFor(id);
  return quest ? t('unlock.quest', { title: quest.title }) : '';
}

export function unlockHint(meta: ReportMeta): string {
  const rule = meta.unlock;
  if (!rule) return t('unlock.archived');
  const target = rule.ref ?? rule.scene;
  return target ? t('unlock.afterTarget', { target }) : t('unlock.locked');
}
