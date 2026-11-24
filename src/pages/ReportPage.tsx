import { use, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SAMPLE_REPORT } from '../content/sample';
import type { Chapter, Report, ReportSegment, Scene } from '../content/types';
import {
  chapterPromise,
  getReportMeta,
  getSceneMeta,
  normalizeReportId,
  reportPromise,
  segmentForScene,
} from '../content/registry';
import { makeHistory } from '../game/persistence';
import { isReportUnlocked, isSceneUnlocked, unlockHint } from '../game/unlocks';
import { CHAPTER_REPORT } from '../game/routing';
import { useGameStore } from '../game/store';
import { useT } from '../i18n';
import { DocWriter } from './DocWriter';
import { PlaceholderPage } from './PlaceholderPage';
import p from './pages.module.css';

type JumpTarget = {
  label: string;
  sceneId: string;
  segmentId: string;
  beatIndex: number;
};

type DialogueLine = {
  key: string;
  scene: Scene;
  beatIndex: number;
  speaker: string;
  text: string;
};

export function ReportPage() {
  const tr = useT();
  const { id } = useParams();
  const save = useGameStore((state) => state.save);
  const setProgress = useGameStore((state) => state.setProgress);
  const addHistory = useGameStore((state) => state.addHistory);
  const setStatus = useGameStore((state) => state.setStatus);
  const readDoc = useGameStore((state) => state.readDoc);
  const navigate = useNavigate();
  const [confirmJump, setConfirmJump] = useState<JumpTarget | null>(null);
  const reportMeta = getReportMeta(id ?? '');
  const locked = reportMeta ? !isReportUnlocked(reportMeta, save) : false;
  const report: Report | undefined =
    use(locked ? Promise.resolve(undefined) : reportPromise(id ?? '')) ??
    (id === '7' && !locked ? (SAMPLE_REPORT as unknown as Report) : undefined);
  const reportKey = normalizeReportId(id ?? '');
  const chapterId = Object.entries(CHAPTER_REPORT).find(([, rid]) => rid === reportKey)?.[0];
  const chapter: Chapter | undefined = use(chapterPromise(locked ? undefined : chapterId));
  const progressSegment = report?.segments.find(
    (item) => item.id === save.progress.segmentId,
  )?.id;
  const lines: DialogueLine[] = [];
  if (chapter) {
    chapter.scenes.forEach((scene) => {
      scene.beats.forEach((beat, beatIndex) => {
        if (beat.type === 'dialogue') {
          lines.push({
            key: `${scene.id}:${beatIndex}`,
            scene,
            beatIndex,
            speaker: beat.speaker,
            text: beat.text,
          });
        } else if (beat.type === 'narration') {
          lines.push({
            key: `${scene.id}:${beatIndex}`,
            scene,
            beatIndex,
            speaker: beat.speaker ?? tr('report.narration'),
            text: beat.text,
          });
        } else if (beat.type === 'quote') {
          lines.push({
            key: `${scene.id}:${beatIndex}`,
            scene,
            beatIndex,
            speaker: beat.source ?? tr('report.quoteSource'),
            text: beat.text,
          });
        }
      });
    });
  }
  const currentLineIndex = lines.findIndex(
    (line) =>
      line.scene.id === save.progress.sceneId && line.beatIndex === save.progress.beat,
  );
  const progressSceneLineIndex = lines.reduce(
    (last, line, index) => (line.scene.id === save.progress.sceneId ? index : last),
    -1,
  );
  const focusLineIndex =
    currentLineIndex >= 0
      ? currentLineIndex
      : progressSceneLineIndex >= 0
        ? progressSceneLineIndex
        : 0;
  const currentLine = currentLineIndex >= 0 ? lines[currentLineIndex] : undefined;
  const focusLine = lines[focusLineIndex];
  const current = currentLine?.key ?? progressSegment ?? report?.segments[0]?.id ?? '';
  const focusKey = focusLine?.key ?? current;
  const read = new Set(save.read[report?.id ?? '7'] ?? []);
  const completed = new Set(save.completedScenes);
  const isDoc = (report?.no ?? 0) >= 100;
  const written = isDoc && read.size > 0;
  const currentRef = useRef<HTMLLIElement>(null);
  const scrolled = useRef(false);

  useEffect(() => {
    if (scrolled.current) return;
    scrolled.current = true;
    requestAnimationFrame(() => currentRef.current?.scrollIntoView?.({ block: 'nearest' }));
  }, [focusKey]);

  useEffect(() => {
    if (!report) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        setConfirmJump(null);
        return;
      }
      if (event.key !== '[' && event.key !== ']') return;
      event.preventDefault();
      const step = event.key === ']' ? 1 : -1;
      if (chapter) {
        const index = currentLineIndex >= 0 ? currentLineIndex : focusLineIndex;
        const next = lines[index + step] ?? (index < 0 && step > 0 ? lines[0] : undefined);
        if (next) openLine(next);
        return;
      }
      const index = report.segments.findIndex((item) => item.id === current);
      const next = report.segments[index + step];
      if (next) openSegment(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, currentLineIndex, focusLineIndex, chapter, report]);

  if (!report) {
    return (
      <PlaceholderPage
        title={
          locked
            ? tr('report.placeholderLocked', { no: String(reportMeta?.no ?? id) })
            : tr('report.placeholderUnknown', { id: id ?? '?' })
        }
        kicker={locked ? tr('report.kickerLocked') : tr('report.kickerMissing')}
        note={
          locked && reportMeta
            ? tr('report.noteLocked', { hint: unlockHint(reportMeta) })
            : tr('report.noteMissing')
        }
      />
    );
  }

  function go(target: JumpTarget) {
    setConfirmJump(null);
    setProgress({
      reportId: report!.id,
      segmentId: target.segmentId,
      sceneId: target.sceneId,
      beat: target.beatIndex,
    });
    addHistory(
      makeHistory(
        'scene',
        tr('report.jumpHistory', { label: target.label }),
        `/report/${report!.id}/replay/${target.segmentId}`,
        target.sceneId,
      ),
    );
    navigate(`/report/${report!.id}/replay/${target.segmentId}`, {
      state: { startBeat: target.beatIndex },
    });
  }

  function sceneLocked(scene: Scene) {
    const meta = getSceneMeta(scene.id);
    return meta ? !isSceneUnlocked(meta, save) : false;
  }

  function lineRead(line: DialogueLine) {
    if (completed.has(line.scene.id)) return true;
    return line.scene.id === save.progress.sceneId && line.beatIndex < save.progress.beat;
  }

  function openLine(line: DialogueLine) {
    if (sceneLocked(line.scene)) {
      setStatus(tr('report.statusSceneLocked'));
      return;
    }
    const segment = segmentForScene(report!.id, line.scene.id);
    const target: JumpTarget = {
      label: `${line.scene.title} · ${line.speaker}`,
      sceneId: line.scene.id,
      segmentId: segment?.id ?? line.scene.id,
      beatIndex: line.beatIndex,
    };
    const isCurrent = line.key === currentLine?.key;
    if (!lineRead(line) && !isCurrent && !save.settings.spoilers) {
      setConfirmJump(target);
      return;
    }
    go(target);
  }

  function openSegment(segment: ReportSegment) {
    if (segment.locked) {
      setStatus(tr('report.statusSegmentLocked'));
      return;
    }
    if (!segment.sceneId) {
      setStatus(tr('report.statusNoScene'));
      return;
    }
    const target: JumpTarget = {
      label: segment.label,
      sceneId: segment.sceneId,
      segmentId: segment.id,
      beatIndex: 0,
    };
    if (!read.has(segment.id) && segment.id !== current && !save.settings.spoilers) {
      setConfirmJump(target);
      return;
    }
    go(target);
  }

  return (
    <article className={p.page}>
      <header className={p.articleHeader}>
        <h1 className={p.pageTitle}>{report.title}</h1>
        <span className={p.tag}>
          {report.no >= 100
            ? written
              ? tr('report.tagDocWritten')
              : tr('report.tagDocPending')
            : tr('report.tagReport', { no: String(report.no) })}
        </span>
      </header>
      <p className={p.articleMeta}>
        {tr('report.metaLine', {
          reporter: report.reporter,
          handler: report.handler ?? '—',
          edited: report.edited,
        })}
      </p>
      {(report.vitals !== '—' || report.drugs !== '—') && (
        <p className={p.articleMeta}>
          {tr('report.vitalsLine', { vitals: report.vitals, drugs: report.drugs })}
        </p>
      )}
      {!isDoc &&
        (chapter ? (
          <p className={p.toc}>
            {tr('report.tocScene', {
              scenes: String(chapter.scenes.length),
              lines: String(lines.length),
            })}
          </p>
        ) : (
          <p className={p.toc}>{tr('report.tocSample')}</p>
        ))}

      {isDoc && !written ? (
        <DocWriter
          title={report.title}
          body={report.body}
          onDone={() => readDoc(report.id, report.segments[0]?.id ?? `report-${report.id}-full`)}
        />
      ) : report.body && report.body.length > 0 ? (
        <section className={p.reportBody} aria-label={tr('report.bodyAria')}>
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
                    alt={block.caption ?? tr('report.imageAlt')}
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

      {confirmJump && (
        <div className={p.confirmBar} role="alert">
          <span>{tr('report.confirmJump', { label: confirmJump.label })}</span>
          <span className={p.confirmActions}>
            <button
              type="button"
              className={`${p.pixelButton} ${p.primary}`}
              onClick={() => go(confirmJump)}
            >
              {tr('report.jump')}
            </button>
            <button
              type="button"
              className={p.pixelButton}
              onClick={() => setConfirmJump(null)}
            >
              {tr('report.cancel')}
            </button>
          </span>
        </div>
      )}

      {chapter ? (
        <ol className={p.segmentList} aria-label={tr('report.lineIndexAria')}>
          {lines.map((line, index) => {
            const isCurrent = line.key === currentLine?.key;
            const isRead = lineRead(line);
            const isUnread = !isCurrent && !isRead;
            const lockedScene = sceneLocked(line.scene);
            return (
              <li key={line.key} ref={line.key === focusKey ? currentRef : undefined}>
                <button
                  type="button"
                  className={p.segmentButton}
                  data-testid="report-line"
                  data-scene={line.scene.id}
                  data-beat={line.beatIndex}
                  data-current={isCurrent}
                  data-unread={isUnread}
                  data-locked={lockedScene}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => openLine(line)}
                >
                  <span className={p.segMeta}>
                    <span>
                      {tr('report.lineMeta', {
                        n: String(index + 1),
                        title: line.scene.title,
                      })}
                    </span>
                    {isCurrent && (
                      <span className={`${p.tagSmall} ${p.tagUnread}`}>
                        {tr('report.tagCurrent')}
                      </span>
                    )}
                    {isUnread && (
                      <span className={`${p.tagSmall} ${p.tagUnread}`}>
                        {tr('report.tagUnread')}
                      </span>
                    )}
                    {!isCurrent && isRead && (
                      <span className={`${p.tagSmall} ${p.tagRead}`}>
                        {tr('report.tagRead')}
                      </span>
                    )}
                    {lockedScene && (
                      <span className={p.tagSmall}>{tr('report.tagLocked')}</span>
                    )}
                  </span>
                  <span className={p.segText}>
                    {lockedScene
                      ? tr('report.lineLockedText')
                      : tr('report.lineText', { speaker: line.speaker, text: line.text })}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className={p.segmentList} aria-label={tr('report.segmentsAria')}>
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
                      {tr('report.segmentMeta', {
                        label: segment.label,
                        date: segment.date ?? '',
                      })}
                    </span>
                    {isCurrent && (
                      <span className={`${p.tagSmall} ${p.tagUnread}`}>
                        {tr('report.tagCurrent')}
                      </span>
                    )}
                    {isUnread && (
                      <span className={`${p.tagSmall} ${p.tagUnread}`}>
                        {tr('report.tagUnread')}
                      </span>
                    )}
                    {!isCurrent && isRead && (
                      <span className={`${p.tagSmall} ${p.tagRead}`}>
                        {tr('report.tagRead')}
                      </span>
                    )}
                    {segment.locked && (
                      <span className={p.tagSmall}>{tr('report.tagLocked')}</span>
                    )}
                  </span>
                  <span className={p.segText}>
                    {segment.locked ? tr('report.segmentLocked') : segment.summary}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <footer className={p.articleFoot}>
        <span>{tr('report.footHint')}</span>
        <span>
          {chapter
            ? currentLine
              ? tr('report.footCurrent', {
                  n: String(currentLineIndex + 1),
                  title: currentLine.scene.title,
                })
              : focusLine
                ? tr('report.footReadTo', {
                    n: String(focusLineIndex + 1),
                    title: focusLine.scene.title,
                  })
                : tr('report.footDone')
            : tr('report.footCurrentSegment', { id: current })}
        </span>
      </footer>
    </article>
  );
}
