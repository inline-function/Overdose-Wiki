import { getEffectMeta, getReportMeta, getSceneMeta } from '../content/registry';
import { getLocale, t } from '../i18n';
import type { HistoryEntry } from './types';

/** History labels are stored when the action happens, so a save written in Chinese
 *  keeps Chinese strings. Translate the known shapes at render time instead. */
export function localizeHistory(entry: HistoryEntry): string {
  if (getLocale() !== 'en') return entry.label;
  const scene = entry.ref ? getSceneMeta(entry.ref) : undefined;
  if (entry.label.startsWith('打开报告')) {
    return t('history.openReport', { id: entry.label.replace(/^打开报告\s*/, '') });
  }
  if (entry.kind === 'scene') {
    if (entry.label.startsWith('读完')) {
      return t('history.readScene', { title: scene?.title ?? entry.label.replace(/^读完\s*/, '') });
    }
    if (entry.label.startsWith('打开')) {
      return t('history.openScene', { title: scene?.title ?? entry.label.replace(/^打开\s*/, '') });
    }
  }
  const edited = entry.label.match(/^编辑了报告\s*(\S+)\s*·\s*(.+)$/);
  if (edited) {
    const meta = getReportMeta(edited[1]);
    return t('history.editReport', { id: edited[1], title: meta?.title ?? edited[2] });
  }
  const archived = entry.label.match(/^归档了\s*(\S+)\s*(.*)$/);
  if (archived) {
    const meta = getSceneMeta(archived[1]);
    return t('history.archiveScene', { id: archived[1], title: meta?.title ?? archived[2] });
  }
  const unlocked = entry.label.match(/^解锁了效果\s*·\s*(.+)$/);
  if (unlocked) {
    const meta = getEffectMeta(unlocked[1]);
    return t('history.unlockEffect', { title: meta?.title ?? unlocked[1] });
  }
  if (entry.label.startsWith('已读')) {
    return t('history.readReport', { id: entry.label.replace(/^已读\s*/, '') });
  }
  return entry.label;
}
