import { Link } from 'react-router-dom';
import { getReportMetas } from '../content/registry';
import { SAMPLE_EXTRAS } from '../content/sample';
import { useGameStore } from '../game/store';
import { isReportUnlocked, unlockHint } from '../game/unlocks';
import p from './pages.module.css';

// 主线报告挂在四章与 DLC 上，文档在「文档」页；番外只剩零散的报告分支。
const MAINLINE = new Set(['2', '7', '49', '50', '51', '74']);

export function ExtrasPage() {
  const setStatus = useGameStore((state) => state.setStatus);
  const save = useGameStore((state) => state.save);
  const reports = getReportMetas();
  const extras = reports
    .filter((report) => report.no < 100 && !MAINLINE.has(report.id))
    .sort((a, b) => a.no - b.no);
  return (
    <article className={p.page}>
      <p className={p.kicker}>番外 / 散页</p>
      <h1 className={p.pageTitle}>番外</h1>
      <p className={p.p}>不进主线的零散报告与处理者笔记。锁定条目只显示编号与状态。</p>
      {reports.length > 0 ? (
        <div className={p.extrasGrid}>
          {extras.map((report) => {
            const unlocked = isReportUnlocked(report, save);
            return unlocked ? (
              <Link key={report.id} className={p.extraCard} to={`/report/${report.id}`}>
                <span className={p.extraTitle}>
                  {report.no} · {report.title}
                </span>
                <span className={p.extraMeta}>
                  {report.reporter} / {report.edited}
                </span>
              </Link>
            ) : (
              <button
                key={report.id}
                type="button"
                className={p.extraCard}
                data-locked="true"
                onClick={() => setStatus(unlockHint(report))}
              >
                <span className={p.extraTitle}>███ · {report.no}</span>
                <span className={p.extraMeta}>{unlockHint(report)}</span>
              </button>
            );
          })}
          <Link className={p.extraCard} to="/analysis">
            <span className={p.extraTitle}>精神分析实验台</span>
            <span className={p.extraMeta}>后藤的自我病例</span>
          </Link>
          <button
            type="button"
            className={p.extraCard}
            data-locked="true"
            onClick={() => setStatus('处理者笔记将在 S4 接入。')}
          >
            <span className={p.extraTitle}>处理者笔记</span>
            <span className={p.extraMeta}>{reports.length} 篇报告 / 暂无笔记</span>
          </button>
        </div>
      ) : (
        <div className={p.extrasGrid}>
          {SAMPLE_EXTRAS.map((entry) =>
            entry.locked ? (
              <button
                key={entry.id}
                type="button"
                className={p.extraCard}
                data-locked="true"
                onClick={() => setStatus('该番外尚未解锁。')}
              >
                <span className={p.extraTitle}>███ · {entry.id}</span>
                <span className={p.extraMeta}>未解锁</span>
              </button>
            ) : (
              <Link key={entry.id} className={p.extraCard} to="/archive">
                <span className={p.extraTitle}>{entry.title}</span>
                <span className={p.extraMeta}>{entry.meta}</span>
              </Link>
            ),
          )}
        </div>
      )}
      <p className={p.versionLine}>私有大包含 6 章、14 篇报告、10 篇文档、10 篇效果；解锁规则在 S4 完善。</p>
    </article>
  );
}
