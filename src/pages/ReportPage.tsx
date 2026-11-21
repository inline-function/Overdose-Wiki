import { use, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SAMPLE_REPORT } from '../content/sample';
import type { Report, ReportSegment } from '../content/types';
import { getReportMeta, reportPromise } from '../content/registry';
import { makeHistory } from '../game/persistence';
import { isReportUnlocked, unlockHint } from '../game/unlocks';
import { useGameStore } from '../game/store';
import { DocWriter } from './DocWriter';
import { PlaceholderPage } from './PlaceholderPage';
import p from './pages.module.css';

export function ReportPage() {
  const { id } = useParams();
  const save = useGameStore((state) => state.save);
  const setProgress = useGameStore((state) => state.setProgress);
  const addHistory = useGameStore((state) => state.addHistory);
  const setStatus = useGameStore((state) => state.setStatus);
  const readDoc = useGameStore((state) => state.readDoc);
  const navigate = useNavigate();
  const [confirmSeg, setConfirmSeg] = useState<ReportSegment | null>(null);
  const reportMeta = getReportMeta(id ?? '');
  const locked = reportMeta ? !isReportUnlocked(reportMeta, save) : false;
  const report: Report | undefined =
    use(locked ? Promise.resolve(undefined) : reportPromise(id ?? '')) ??
    (id === '7' && !locked ? (SAMPLE_REPORT as unknown as Report) : undefined);
  const progressSegment = report?.segments.find(
    (item) => item.id === save.progress.segmentId,
  )?.id;
  const current = progressSegment ?? report?.segments[0]?.id ?? '';
  const read = new Set(save.read[report?.id ?? '7'] ?? []);
  const isDoc = (report?.no ?? 0) >= 100;
  const written = isDoc && read.size > 0;
  const currentRef = useRef<HTMLLIElement>(null);
  const scrolled = useRef(false);

  useEffect(() => {
    if (scrolled.current) return;
    scrolled.current = true;
    requestAnimationFrame(() => currentRef.current?.scrollIntoView?.({ block: 'nearest' }));
  }, [current]);

  useEffect(() => {
    if (!report) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        setConfirmSeg(null);
        return;
      }
      if (event.key !== '[' && event.key !== ']') return;
      event.preventDefault();
      const index = report.segments.findIndex((item) => item.id === current);
      const next = report.segments[index + (event.key === ']' ? 1 : -1)];
      if (next) openSegment(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, report]);

  if (!report) {
    return (
      <PlaceholderPage
        title={locked ? `报告 ${reportMeta?.no ?? id}` : `报告 ${id ?? '?'}`}
        kicker={locked ? '档案 / 锁定' : '档案 / 未接入'}
        note={
          locked && reportMeta
            ? `${unlockHint(reportMeta)}。解锁后可在档案索引打开。`
            : '这份报告已在目录中，但正文与段落索引尚未接入。'
        }
      />
    );
  }

  function openSegment(segment: ReportSegment) {
    if (segment.locked) {
      setStatus('该段已隐去：未归档。');
      return;
    }
    if (!segment.sceneId) {
      setStatus('该段没有可复演的场景。');
      return;
    }
    if (!read.has(segment.id) && segment.id !== current && !save.settings.spoilers) {
      setConfirmSeg(segment);
      return;
    }
    go(segment);
  }

  function go(segment: ReportSegment) {
    setConfirmSeg(null);
    setProgress({
      reportId: report!.id,
      segmentId: segment.id,
      sceneId: segment.sceneId,
      beat: 0,
    });
    addHistory(
      makeHistory('scene', `打开 ${segment.label}`, `/report/${report!.id}/replay/${segment.id}`, segment.id),
    );
    navigate(`/report/${report!.id}/replay/${segment.id}`);
  }

  return (
    <article className={p.page}>
      <header className={p.articleHeader}>
        <h1 className={p.pageTitle}>{report.title}</h1>
        <span className={p.tag}>
          {report.no >= 100
            ? written
              ? '文档 · 已编写'
              : '文档 · 待编写'
            : `报告 ${report.no}`}
        </span>
      </header>
      <p className={p.articleMeta}>
        报告者：{report.reporter} / 处理者：{report.handler} /{' '}
        {report.edited}
      </p>
      {(report.vitals !== '—' || report.drugs !== '—') && (
        <p className={p.articleMeta}>
          身高体重：{report.vitals} / 有关药物：{report.drugs}
        </p>
      )}
      <p className={p.toc}>
        目录：1 初次 · 9 地狱之行 · 12 余晖 · 13 复刻失败 · 26 最后一次
      </p>

      {isDoc && !written ? (
        <DocWriter
          title={report.title}
          body={report.body}
          onDone={() => readDoc(report.id, report.segments[0]?.id ?? `report-${report.id}-full`)}
        />
      ) : report.body && report.body.length > 0 ? (
        <section className={p.reportBody} aria-label="报告正文">
          {report.body.map((block, index) => {
            if (block.type === 'h') {
              return (
                <h2 key={index} className={p.effectH}>
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote key={index} className={p.quote}>
                  {block.text}
                </blockquote>
              );
            }
            if (block.type === 'list') {
              return (
                <ul key={index} className={p.effectList}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            if (block.type === 'image') {
              return (
                <figure key={index} className={p.docFigure}>
                  <img
                    className={p.docImage}
                    src={block.src}
                    alt={block.caption ?? '文档插图'}
                    loading="lazy"
                  />
                  {block.caption && <figcaption className={p.docCaption}>{block.caption}</figcaption>}
                </figure>
              );
            }
            return (
              <p key={index} className={p.p}>
                {block.text}
              </p>
            );
          })}
        </section>
      ) : null}

      {confirmSeg && (
        <div className={p.confirmBar} role="alert">
          <span>跳到未读段「{confirmSeg.label}」？</span>
          <span className={p.confirmActions}>
            <button
              type="button"
              className={`${p.pixelButton} ${p.primary}`}
              onClick={() => go(confirmSeg)}
            >
              跳转
            </button>
            <button
              type="button"
              className={p.pixelButton}
              onClick={() => setConfirmSeg(null)}
            >
              取消
            </button>
          </span>
        </div>
      )}

      <ol className={p.segmentList} aria-label="报告段落">
        {report.segments.map((segment) => {
          const isCurrent = segment.id === current;
          const isRead = read.has(segment.id);
          const isUnread = !isCurrent && !isRead;
          return (
            <li key={segment.id} ref={isCurrent ? currentRef : undefined}>
              <button
                type="button"
                className={p.segmentButton}
                data-current={isCurrent}
                data-unread={isUnread}
                data-locked={segment.locked}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => openSegment(segment)}
              >
                <span className={p.segMeta}>
                  <span>
                    {segment.label} · {segment.date}
                  </span>
                  {isCurrent && <span className={`${p.tagSmall} ${p.tagUnread}`}>当前</span>}
                  {isUnread && <span className={`${p.tagSmall} ${p.tagUnread}`}>未读</span>}
                  {!isCurrent && isRead && (
                    <span className={`${p.tagSmall} ${p.tagRead}`}>已读</span>
                  )}
                  {segment.locked && <span className={p.tagSmall}>锁定</span>}
                </span>
                <span className={p.segText}>
                  {segment.locked ? '已隐去：未归档' : segment.summary}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <footer className={p.articleFoot}>
        <span>点击任意段跳转</span>
        <span>当前：{current}</span>
      </footer>
    </article>
  );
}