import { Link } from 'react-router-dom';
import { SAMPLE_HISTORY } from '../content/sample';
import { useGameStore } from '../game/store';
import { localizeHistory } from '../game/historyText';
import { getLocale, useT } from '../i18n';
import p from './pages.module.css';

export function HistoryPage() {
  const tr = useT();
  const save = useGameStore((state) => state.save);
  const entries =
    save.history.length > 0
      ? save.history.map((entry) => ({
          key: `${entry.at}-${entry.href}`,
          at: formatTime(entry.at),
          label: localizeHistory(entry),
          href: entry.href,
        }))
      : SAMPLE_HISTORY.map((entry) => ({
          key: `${entry.at}-${entry.label}`,
          at: entry.at,
          label: localizeHistory({ ...entry, kind: 'scene' }),
          href: entry.href,
        }));

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('history.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('history.title')}</h1>
      <p className={p.articleMeta}>{tr('history.meta')}</p>
      <ul className={p.historyList}>
        {entries.map((entry) => (
          <li key={entry.key}>
            <Link className={p.historyRow} to={entry.href}>
              <span className={p.historyTime}>{entry.at}</span>
              <span>{entry.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className={p.versionLine}>{tr('history.versionLine')}</p>
    </article>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(getLocale() === 'en' ? 'en-GB' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
