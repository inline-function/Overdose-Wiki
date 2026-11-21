import { getChapterMeta, getReportMeta } from '../content/registry';
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
      return '完成 ch01 与任务「第一批归档」（三份文档）后解锁';
    case 'ch03':
      return '完成 ch02 与任务「第二次校订」（三份文档）后解锁';
    case 'ch04':
      return '完成 ch03 与任务「消失前的索引」（三份文档）后解锁';
    case 'dlc':
      return '完成 ch01.s14 后解锁';
    default:
      return '已归档';
  }
}

export function questHint(id: string): string {
  const quest = questFor(id);
  return quest ? `任务「${quest.title}」` : '';
}

export function unlockHint(meta: ReportMeta): string {
  const rule = meta.unlock;
  if (!rule) return '已归档';
  const target = rule.ref ?? rule.scene;
  return target ? `完成 ${target} 后解锁` : '未解锁';
}
