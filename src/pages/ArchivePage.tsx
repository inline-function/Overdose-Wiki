import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getReportMetas } from '../content/registry';
import { SAMPLE_ARCHIVE } from '../content/sample';
import { useGameStore } from '../game/store';
import { isReportUnlocked, unlockHint } from '../game/unlocks';
import { useT } from '../i18n';
import p from './pages.module.css';

export function ArchivePage() {
  const tr = useT();
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
      <p className={p.kicker}>{tr('archive.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('archive.title')}</h1>
      <div className={p.searchRow}>
        <input
          className={p.searchBox}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr('archive.searchPlaceholder')}
          aria-label={tr('archive.searchAria')}
        />
        <button
          type="button"
          className={p.pixelButton}
          onClick={() => setStatus(tr('archive.filterPending'))}
        >
          {tr('archive.filter')}
        </button>
      </div>

      {reports.length > 0 ? (
        <div className={p.archiveGrid}>
          {filtered.map((report) => {
            const unlocked = isReportUnlocked(report, save);
            return unlocked ? (
              <Link key={report.id} className={p.archiveCard} to={`/report/${report.id}`}>
                <span className={p.archiveTitle}>
                  {tr('archive.report', { no: report.no, title: report.title })}
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
                <span className={p.archiveTitle}>{tr('archive.reportHidden', { no: report.no })}</span>
                <span className={p.archiveMeta}>{unlockHint(report)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {reports.length > 0 && filtered.length === 0 && (
        <p className={p.empty}>{tr('archive.empty')}</p>
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
                aria-label={tr('archive.unfiledLabel', { title: entry.title })}
                onClick={() => setStatus(tr('archive.unfiled'))}
              >
                <span className={p.archiveTitle}>███ · {entry.id}</span>
                <span className={p.archiveMeta}>{tr('archive.redacted')}</span>
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
      <p className={p.versionLine}>{tr('archive.version')}</p>
    </article>
  );
}
