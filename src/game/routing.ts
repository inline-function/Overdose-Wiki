import { t } from '../i18n';
import type { Save } from './types';

export type Tab = {
  id: 'home' | 'replay' | 'report' | 'history' | 'discussion';
  label: string;
  to: string;
};

export const CHAPTER_REPORT: Record<string, string> = {
  ch01: '7',
  ch02: '49',
  ch03: '50',
  ch04: '51',
  dlc: '74',
};

export function lastReportId(save: Save): string {
  return save.progress.reportId ?? '7';
}

export function lastSegmentId(save: Save): string {
  return save.progress.segmentId ?? 'rp-7-1';
}

export function tabLinks(save: Save): Tab[] {
  const reportId = lastReportId(save);
  const segmentId = lastSegmentId(save);
  return [
    { id: 'home', label: t('tab.home'), to: '/' },
    {
      id: 'replay',
      label: t('tab.replay'),
      to: `/report/${reportId}/replay/${segmentId}`,
    },
    { id: 'report', label: t('tab.report'), to: `/report/${reportId}` },
    { id: 'history', label: t('tab.history'), to: '/history' },
    { id: 'discussion', label: t('tab.discussion'), to: `/discussion/${reportId}` },
  ];
}

export function activeTabId(pathname: string): Tab['id'] | null {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/report/') && pathname.includes('/replay/')) {
    return 'replay';
  }
  if (pathname.startsWith('/report/')) return 'report';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/discussion/')) return 'discussion';
  return null;
}

export function fakeUrl(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'odw.local';
  return `odw.local${pathname}`;
}

export function modeForPath(pathname: string): 'consent' | 'battle' | 'wiki' | 'afterstory' {
  if (pathname === '/consent') return 'consent';
  if (pathname.startsWith('/battle/')) return 'battle';
  if (pathname === '/afterstory' || pathname.startsWith('/afterstory/')) return 'afterstory';
  return 'wiki';
}