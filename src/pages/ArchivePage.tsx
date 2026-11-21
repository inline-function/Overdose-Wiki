import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getReportMetas } from '../content/registry';
import { SAMPLE_ARCHIVE } from '../content/sample';
import { useGameStore } from '../game/store';
import { isReportUnlocked, unlockHint } from '../game/unlocks';
import p from './pages.module.css';

export function ArchivePage() {
  const setStatus = useGameStore((state) => state.setStatus);
  const save = useGameStore((state) => state.save);
  const reports = getReportMetas();
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = reports.filter((report) =>
    `${report.no} ${report.title} ${report.reporter}`.toLowerCase().includes(normalizedQuery),
  );
  return (
    <article className={p.page}>
      <p className={p.kicker}>档案 / 索引</p>
      <h1 className={p.pageTitle}>档案索引</h1>
      <div className={p.searchRow}>
        <input
          className={p.searchBox}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索编号、标题、报告者"
          aria-label="搜索档案"
        />
        <button
          type="button"
          className={p.pixelButton}
          onClick={() => setStatus('筛选在 S3 接入。')}
        >
          筛选
        </button>
      </div>

      {reports.length > 0 ? (
        <div className={p.archiveGrid}>
          {filtered.map((report) => {
            const unlocked = isReportUnlocked(report, save);
            return unlocked ? (
              <Link key={report.id} className={p.archiveCard} to={`/report/${report.id}`}>
                <span className={p.archiveTitle}>
                  报告 {report.no} · {report.title}
                </span>
                <span className={p.archiveMeta}>
                  {report.reporter} / {report.edited}
                </span>
              </Link>
            ) : (
              <button
                key={report.id}
                type="button"
                className={p.archiveCard}
                data-locked="true"
                onClick={() => setStatus(unlockHint(report))}
              >
                <span className={p.archiveTitle}>报告 {report.no} · ███</span>
                <span className={p.archiveMeta}>{unlockHint(report)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {reports.length > 0 && filtered.length === 0 && (
        <p className={p.empty}>没有匹配的档案。</p>
      )}
      {reports.length === 0 && (
        <div className={p.archiveGrid}>
          {SAMPLE_ARCHIVE.map((entry) =>
            entry.locked ? (
              <button
                key={entry.id}
                type="button"
                className={p.archiveCard}
                data-locked="true"
                aria-label={`${entry.title}，未归档`}
                onClick={() => setStatus('该档案尚未归档。')}
              >
                <span className={p.archiveTitle}>███ · {entry.id}</span>
                <span className={p.archiveMeta}>已隐去：未归档</span>
              </button>
            ) : (
              <Link key={entry.id} className={p.archiveCard} to={`/report/${entry.id}`}>
                <span className={p.archiveTitle}>{entry.title}</span>
                <span className={p.archiveMeta}>{entry.meta}</span>
              </Link>
            ),
          )}
        </div>
      )}
      <p className={p.versionLine}>私有大包含 14 篇报告；公开 demo 只含脱敏样本。</p>
    </article>
  );
}
