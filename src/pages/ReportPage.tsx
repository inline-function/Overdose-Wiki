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
import { DocWriter } from './DocWriter';
import { PlaceholderPage } from './PlaceholderPage';
import p from './pages.module.css';

type JumpTarget = {
  label: string;
  sceneId: string;
  segmentId: string;
};

export function ReportPage() {
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
  const currentSceneId =
    chapter?.scenes.find((scene) => scene.id === save.progress.sceneId)?.id ??
    chapter?.scenes[0]?.id ??
    null;
  const current = currentSceneId ?? progressSegment ?? report?.segments[0]?.id ?? '';
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
  }, [current, currentSceneId]);

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
      if (chapter && currentSceneId) {
        const index = chapter.scenes.findIndex((scene) => scene.id === currentSceneId);
        const next = chapter.scenes[index + step];
        if (next) openScene(next);
        return;
      }
      const index = report.segments.findIndex((item) => item.id === current);
      const next = report.segments[index + step];
      if (next) openSegment(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, currentSceneId, chapter, report]);

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

  function go(target: JumpTarget) {
    setConfirmJump(null);
    setProgress({
      reportId: report!.id,
      segmentId: target.segmentId,
      sceneId: target.sceneId,
      beat: 0,
    });
    addHistory(
      makeHistory(
        'scene',
        `打开 ${target.label}`,
        `/report/${report!.id}/replay/${target.segmentId}`,
        target.segmentId,
      ),
    );
    navigate(`/report/${report!.id}/replay/${target.segmentId}`);
  }

  function sceneLocked(scene: Scene) {
    const meta = getSceneMeta(scene.id);
    return meta ? !isSceneUnlocked(meta, save) : false;
  }

  function openScene(scene: Scene) {
    if (sceneLocked(scene)) {
      setStatus('该段尚未解锁：先完成前置章节。');
      return;
    }
    const segment = segmentForScene(report!.id, scene.id);
    const target: JumpTarget = {
      label: scene.title,
      sceneId: scene.id,
      segmentId: segment?.id ?? scene.id,
    };
    if (!completed.has(scene.id) && scene.id !== currentSceneId && !save.settings.spoilers) {
      setConfirmJump(target);
      return;
    }
    go(target);
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
    const target: JumpTarget = {
      label: segment.label,
      sceneId: segment.sceneId,
      segmentId: segment.id,
    };
    if (!read.has(segment.id) && segment.id !== current && !save.settings.spoilers) {
      setConfirmJump(target);
      return;
    }
    go(target);
  }

  const chapterIndex = chapter
    ? chapter.scenes.findIndex((scene) => scene.id === currentSceneId)
    : -1;

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
      {!isDoc &&
        (chapter ? (
          <p className={p.toc}>
            目录：{chapter.scenes.length} 段对话 · 从「{chapter.scenes[0]?.title}」到「
            {chapter.scenes[chapter.scenes.length - 1]?.title}」
          </p>
        ) : (
          <p className={p.toc}>
            目录：1 初次 · 9 地狱之行 · 12 余晖 · 13 复刻失败 · 26 最后一次
          </p>
        ))}

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

      {confirmJump && (
        <div className={p.confirmBar} role="alert">
          <span>跳到未读段「{confirmJump.label}」？</span>
          <span className={p.confirmActions}>
            <button
              type="button"
              className={`${p.pixelButton} ${p.primary}`}
              onClick={() => go(confirmJump)}
            >
              跳转
            </button>
            <button
              type="button"
              className={p.pixelButton}
              onClick={() => setConfirmJump(null)}
            >
              取消
            </button>
          </span>
        </div>
      )}

      {chapter ? (
        <ol className={p.segmentList} aria-label="对话段落">
          {chapter.scenes.map((scene, index) => {
            const isCurrent = scene.id === currentSceneId;
            const isRead = completed.has(scene.id);
            const isUnread = !isCurrent && !isRead;
            const lockedScene = sceneLocked(scene);
            return (
              <li key={scene.id} ref={isCurrent ? currentRef : undefined}>
                <button
                  type="button"
                  className={p.segmentButton}
                  data-testid="report-dialogue"
                  data-scene={scene.id}
                  data-current={isCurrent}
                  data-unread={isUnread}
                  data-locked={lockedScene}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => openScene(scene)}
                >
                  <span className={p.segMeta}>
                    <span>
                      第 {index + 1} 段 · {scene.title}
                    </span>
                    {isCurrent && <span className={`${p.tagSmall} ${p.tagUnread}`}>当前</span>}
                    {isUnread && <span className={`${p.tagSmall} ${p.tagUnread}`}>未读</span>}
                    {!isCurrent && isRead && (
                      <span className={`${p.tagSmall} ${p.tagRead}`}>已读</span>
                    )}
                    {lockedScene && <span className={p.tagSmall}>锁定</span>}
                  </span>
                  <span className={p.segText}>
                    {lockedScene ? '尚未解锁：先完成前置章节。' : scene.summary}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
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
      )}

      <footer className={p.articleFoot}>
        <span>点击任意对话跳转</span>
        <span>
          {chapter && chapterIndex >= 0
            ? `当前：第 ${chapterIndex + 1} 段 · ${chapter.scenes[chapterIndex]?.title}`
            : `当前：${current}`}
        </span>
      </footer>
    </article>
  );
}
