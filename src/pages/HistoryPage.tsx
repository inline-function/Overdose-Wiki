import { Link } from 'react-router-dom';
import { SAMPLE_HISTORY } from '../content/sample';
import { useGameStore } from '../game/store';
import p from './pages.module.css';

export function HistoryPage() {
  const save = useGameStore((state) => state.save);
  const entries =
    save.history.length > 0
      ? save.history.map((entry) => ({
          key: `${entry.at}-${entry.href}`,
          at: formatTime(entry.at),
          label: entry.label,
          href: entry.href,
        }))
      : SAMPLE_HISTORY.map((entry) => ({
          key: `${entry.at}-${entry.label}`,
          at: entry.at,
          label: entry.label,
          href: entry.href,
        }));

  return (
    <article className={p.page}>
      <p className={p.kicker}>历史 / 最近更改</p>
      <h1 className={p.pageTitle}>最近更改</h1>
      <p className={p.articleMeta}>阅读、编辑、归档与解锁都会留在这里；只存在本地。</p>
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
      <p className={p.versionLine}>最多保留 200 条；S1 接入真实写入。</p>
    </article>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}