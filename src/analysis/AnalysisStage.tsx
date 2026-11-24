import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { gateAudio } from '../audio/gateAudio';
import { useT } from '../i18n';
import type { AnalysisBlockKind, AnalysisCase, AnalysisKeyword, AnalysisSlot } from '../content/types';
import s from './analysis.module.css';

type Phase = 'collect' | 'build' | 'sealed' | 'reveal' | 'restore';

const PHASE_KEY = {
  collect: 'analysis.phase.collect',
  build: 'analysis.phase.build',
  sealed: 'analysis.phase.sealed',
  reveal: 'analysis.phase.reveal',
  restore: 'analysis.phase.restore',
} as const;

/** 只用颜色区分四类积木，不再写字面标签。 */
const TONE: Record<AnalysisBlockKind, string> = {
  症状: 'symptom',
  病因: 'cause',
  认知: 'cognition',
  好处: 'benefit',
};

function requiredBlocks(data: AnalysisCase): Set<string> {
  return new Set(data.slots.flatMap((slot) => slot.accepts));
}

function nextOpenSlot(data: AnalysisCase, placed: Record<string, string>): AnalysisSlot | undefined {
  return data.slots.find((slot) => !placed[slot.id]);
}

/** 把报告段落里命中的蓝词切成按钮。 */
function renderKeywords(
  text: string,
  keywords: AnalysisKeyword[],
  collected: string[],
  onCollect: (keyword: AnalysisKeyword) => void,
) {
  const escaped = keywords
    .map((keyword) => keyword.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  if (!escaped.length) return text;
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  return parts.map((part, index) => {
    const keyword = keywords.find((item) => item.text === part);
    if (!keyword) return part;
    const collectedAlready = collected.includes(keyword.blockId);
    return (
      <button
        key={`${part}-${index}`}
        type="button"
        className={s.keyword}
        data-collected={collectedAlready}
        data-testid="analysis-keyword"
        data-keyword={keyword.text}
        onClick={() => onCollect(keyword)}
      >
        {part}
      </button>
    );
  });
}

export function AnalysisStage({
  data,
  onDone,
  onExit,
  headerRight,
}: {
  data: AnalysisCase;
  onDone: () => void;
  onExit?: () => void;
  headerRight?: ReactNode;
}) {
  const tr = useT();
  const required = useMemo(() => requiredBlocks(data), [data]);
  const [collected, setCollected] = useState<string[]>([]);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('collect');
  const [caption, setCaption] = useState(data.intro);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const shakeTimer = useRef<number | null>(null);
  const windowRef = useRef<HTMLElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const suppressClick = useRef(0);
  const dragAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    windowRef.current?.focus();
    return () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
      dragAbort.current?.abort();
    };
  }, []);

  const requiredCount = required.size;
  const collectedCount = [...required].filter((blockId) => collected.includes(blockId)).length;
  const allCollected = collectedCount >= requiredCount;
  const filled = Object.keys(placed).length;
  const complete = filled >= data.slots.length;

  const byId = useMemo(() => new Map(data.blocks.map((block) => [block.id, block])), [data.blocks]);
  const mainSlots = data.slots.filter((item) => item.chain === 'main');
  const branchSlots = data.slots.filter((item) => item.chain === 'branch');
  const placedIds = useMemo(() => new Set(Object.values(placed)), [placed]);
  const tray = data.blocks.filter(
    (block) =>
      !placedIds.has(block.id) &&
      (required.has(block.id) ? collected.includes(block.id) : phase !== 'collect'),
  );

  function flash(slotId: string) {
    setShake(slotId);
    if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(null), 420);
  }

  function scrollTray(direction: -1 | 1) {
    const tray = trayRef.current;
    if (!tray) return;
    const step = Math.max(48, Math.round(tray.clientHeight * 0.6));
    tray.scrollBy({ top: direction * step, behavior: 'smooth' });
    gateAudio.tick();
  }

  function collect(keyword: AnalysisKeyword) {
    setHint(null);
    if (collected.includes(keyword.blockId)) {
      gateAudio.tick();
      return;
    }
    gateAudio.data();
    const next = [...collected, keyword.blockId];
    setCollected(next);
    const nowAll = [...required].every((blockId) => next.includes(blockId));
    if (nowAll) {
      setCaption(tr('analysis.caption.done'));
    }
  }

  function closeReport() {
    if (!allCollected) {
      gateAudio.hollow();
      setHint(tr('analysis.hint.remaining', { n: requiredCount - collectedCount }));
      return;
    }
    setReportOpen(false);
    setHint(null);
    setPhase('build');
    setCaption(tr('analysis.caption.drag'));
  }

  function clickBlock(blockId: string) {
    gateAudio.tick();
    setHint(null);
    setSelected((current) => (current === blockId ? null : blockId));
  }

  function tryPlace(slot: AnalysisSlot, blockId: string, fromSlotId?: string) {
    if (placed[slot.id] === blockId) {
      setSelected(null);
      return;
    }
    if (!slot.accepts.includes(blockId)) {
      gateAudio.broken();
      flash(slot.id);
      setHint(tr('analysis.hint.mismatch'));
      return;
    }
    gateAudio.focus();
    setPlaced((prev) => {
      const next = { ...prev };
      if (fromSlotId) delete next[fromSlotId];
      next[slot.id] = blockId;
      return next;
    });
    setSelected(null);
    setHint(null);
    const nextPlaced = { ...placed };
    if (fromSlotId) delete nextPlaced[fromSlotId];
    nextPlaced[slot.id] = blockId;
    if (Object.keys(nextPlaced).length >= data.slots.length) {
      setPhase('sealed');
      setCaption(tr('analysis.caption.sealed'));
    } else {
      const next = nextOpenSlot(data, nextPlaced);
      if (next?.hint) setCaption(tr('analysis.caption.goto', { hint: next.hint }));
    }
  }

  function clickSlot(slot: AnalysisSlot) {
    if (placed[slot.id]) {
      if (selected) {
        setHint(tr('analysis.hint.occupied'));
        return;
      }
      setPlaced((prev) => {
        const next = { ...prev };
        delete next[slot.id];
        return next;
      });
      gateAudio.tick();
      return;
    }
    if (!selected) {
      setHint(tr('analysis.hint.empty'));
      return;
    }
    tryPlace(slot, selected);
  }

  function startDrag(
    event: ReactPointerEvent<HTMLElement>,
    blockId: string,
    fromSlotId?: string,
  ) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragAbort.current?.abort();
    const abort = new AbortController();
    dragAbort.current = abort;
    const origin = { x: event.clientX, y: event.clientY, moved: false };
    let hover: string | null = null;

    const onMove = (moveEvent: PointerEvent) => {
      const distance = Math.hypot(moveEvent.clientX - origin.x, moveEvent.clientY - origin.y);
      if (!origin.moved && distance < 6) return;
      origin.moved = true;
      setDragId(blockId);
      setDragPos({ x: moveEvent.clientX, y: moveEvent.clientY });
      const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const slotElement = element?.closest('[data-slot]') as HTMLElement | null;
      hover = slotElement?.dataset.slot ?? null;
      setHoverSlot(hover);
    };

    const cleanup = () => {
      abort.abort();
      if (dragAbort.current === abort) dragAbort.current = null;
      setDragId(null);
      setDragPos(null);
      setHoverSlot(null);
    };

    const onUp = () => {
      cleanup();
      if (!origin.moved) return;
      suppressClick.current = window.performance.now() + 400;
      if (!hover) {
        if (fromSlotId) {
          setPlaced((prev) => {
            const next = { ...prev };
            delete next[fromSlotId];
            return next;
          });
          gateAudio.tick();
        }
        return;
      }
      const target = data.slots.find((item) => item.id === hover);
      if (target) tryPlace(target, blockId, fromSlotId);
    };

    const onCancel = () => cleanup();

    window.addEventListener('pointermove', onMove, { signal: abort.signal });
    window.addEventListener('pointerup', onUp, { signal: abort.signal });
    window.addEventListener('pointercancel', onCancel, { signal: abort.signal });
  }

  function exit() {
    gateAudio.hollow();
    (onExit ?? onDone)();
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (reportOpen) {
        closeReport();
      } else {
        exit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function reveal() {
    setPhase('reveal');
    gateAudio.halo();
  }

  function finish() {
    gateAudio.pop();
    onDone();
  }

  const slot = (slot: AnalysisSlot) => {
    const blockId = placed[slot.id];
    const block = blockId ? byId.get(blockId) : undefined;
    const accepting = dragId ? slot.accepts.includes(dragId) : false;
    const tone = TONE[byId.get(slot.accepts[0])?.kind ?? '症状'];
    return (
      <button
        key={slot.id}
        type="button"
        className={s.slot}
        data-filled={block ? 'true' : 'false'}
        data-tone={tone}
        data-shake={shake === slot.id}
        data-accept={dragId ? accepting : undefined}
        data-drop={hoverSlot === slot.id && accepting}
        data-testid="analysis-slot"
        data-slot={slot.id}
        onPointerDown={(event) => {
          if (blockId) startDrag(event, blockId, slot.id);
        }}
        onClick={() => {
          if (window.performance.now() < suppressClick.current) return;
          clickSlot(slot);
        }}
        aria-label={block
          ? tr('analysis.slotFilledAria', {
              chain: tr(slot.chain === 'main' ? 'analysis.chain.main' : 'analysis.chain.branch'),
              text: block.text,
            })
          : tr('analysis.slotEmptyAria', {
              chain: tr(slot.chain === 'main' ? 'analysis.chain.main' : 'analysis.chain.branch'),
            })}
      >
        <span className={s.slotText}>{block?.text ?? tr('analysis.slotEmpty')}</span>
      </button>
    );
  };

  const workspace = (
    <section
      className={s.window}
      data-minimized={minimized}
      data-testid="analysis-window"
      ref={windowRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={tr('analysis.stageAria', { title: data.title })}
    >
      <div className={s.titleBar}>
        <span className={s.titleIcon} aria-hidden="true">▣</span>
        <span className={s.titleText}>{tr('analysis.windowTitle')}</span>
        <span className={s.titleCase}>{data.title}</span>
        <div className={s.titleButtons}>
          <button
            type="button"
            className={s.winBtn}
            aria-label={minimized ? tr('analysis.expandAria') : tr('analysis.collapseAria')}
            title={minimized ? tr('analysis.expand') : tr('analysis.collapse')}
            onClick={() => setMinimized((value) => !value)}
          >
            _
          </button>
          <button
            type="button"
            className={s.winBtn}
            aria-label={maximized ? tr('analysis.restoreAria') : tr('analysis.maximizeAria')}
            title={maximized ? tr('analysis.restore') : tr('analysis.maximize')}
            onClick={() => setMaximized((value) => !value)}
          >
            □
          </button>
          <button
            type="button"
            className={`${s.winBtn} ${s.exit}`}
            data-testid="analysis-exit"
            aria-label={tr('analysis.exitAria')}
            title={tr('analysis.exit')}
            onClick={exit}
          >
            ×
          </button>
        </div>
      </div>

      {minimized ? null : (
        <div className={s.windowBody} data-testid="analysis-stage">
          <header className={s.head}>
            <div className={s.headText}>
              <p className={s.kicker}>{tr('analysis.kicker')}</p>
              <h2 className={s.title}>{data.title}</h2>
              <p className={s.subtitle}>{data.subtitle}</p>
            </div>
            <div className={s.headActions}>
              {headerRight}
              <button
                type="button"
                className={s.ghost}
                data-testid="analysis-report-open"
                onClick={() => {
                  gateAudio.tick();
                  setReportOpen(true);
                }}
              >
                {tr('analysis.reportFull')}
              </button>
              <span className={s.counter} data-testid="analysis-counter">
                {tr('analysis.stats', { a: collectedCount, b: requiredCount, c: filled, d: data.slots.length })}
              </span>
            </div>
          </header>

          <p className={s.caption} data-testid="analysis-caption">
            {caption}
          </p>

          <div className={s.body}>
            <div className={s.boardWrap} data-blur={phase === 'collect' && !reportOpen}>
              <div className={s.board} data-complete={complete}>
                <div className={s.chain} data-chain="main">
                  <span className={s.chainTag}>{tr('analysis.chain.main')}</span>
                  {mainSlots.map((item, index) => (
                    <span key={item.id} className={s.chainPart}>
                      {index > 0 ? <span className={s.arrow} aria-hidden="true">→</span> : null}
                      {slot(item)}
                    </span>
                  ))}
                </div>
                <div className={s.chain} data-chain="branch">
                  <span className={s.chainTag}>{tr('analysis.chain.branch')}</span>
                  {branchSlots.map((item, index) => (
                    <span key={item.id} className={s.chainPart}>
                      {index > 0 ? <span className={s.arrow} aria-hidden="true">{tr('analysis.arrow.repress')}</span> : null}
                      {slot(item)}
                    </span>
                  ))}
                  <span className={s.arrow} aria-hidden="true">{tr('analysis.arrow.return')}</span>
                </div>
              </div>

              <div className={s.trayWrap}>
                <div
                  ref={trayRef}
                  id="analysis-tray-list"
                  className={s.tray}
                  aria-label={tr('analysis.trayAria')}
                  data-testid="analysis-tray"
                >
                  {tray.length === 0 ? (
                    <span className={s.trayEmpty}>
                      {phase === 'collect' ? tr('analysis.trayCollect') : tr('analysis.trayBuild')}
                    </span>
                  ) : (
                    tray.map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        className={s.block}
                        data-tone={TONE[block.kind]}
                        data-selected={selected === block.id}
                        data-testid="analysis-block"
                        data-block={block.id}
                        onPointerDown={(event) => startDrag(event, block.id)}
                        onClick={() => {
                          if (window.performance.now() < suppressClick.current) return;
                          clickBlock(block.id);
                        }}
                      >
                        {block.text}
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  className={`${s.trayScrollButton} ${s.trayScrollUp}`}
                  data-testid="analysis-tray-up"
                  aria-label={tr('analysis.trayUp')}
                  aria-controls="analysis-tray-list"
                  onClick={() => scrollTray(-1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={`${s.trayScrollButton} ${s.trayScrollDown}`}
                  data-testid="analysis-tray-down"
                  aria-label={tr('analysis.trayDown')}
                  aria-controls="analysis-tray-list"
                  onClick={() => scrollTray(1)}
                >
                  ↓
                </button>
              </div>
            </div>

          </div>

          <footer className={s.foot}>
            <p className={s.hint} data-testid="analysis-hint">
              {hint ?? (phase === 'collect' ? tr('analysis.hint.start') : tr('analysis.hint.drag'))}
            </p>
            {phase === 'sealed' ? (
              <button type="button" className={s.primary} data-testid="analysis-reveal" onClick={reveal}>
                {tr('analysis.revealButton')}
              </button>
            ) : null}
          </footer>

            {reportOpen ? (
              <div className={s.report} role="dialog" aria-label={tr('analysis.reportFull')} data-testid="analysis-report">
                <div className={s.reportHead}>
                  <span>{data.report.title}</span>
                  <button type="button" className={s.ghost} onClick={() => setReportOpen(false)}>
                    {tr('analysis.reportCollapse')}
                  </button>
                </div>
                <div className={s.reportBody}>
                  {data.report.paragraphs.map((paragraph, index) => (
                    <p key={index}>{renderKeywords(paragraph, data.keywords, collected, collect)}</p>
                  ))}
                </div>
                <div className={s.reportFoot}>
                  <span className={s.reportHint}>{tr('analysis.reportHint')}</span>
                  <button
                    type="button"
                    className={s.darkBtn}
                    data-testid="analysis-report-close"
                    onClick={closeReport}
                  >
                    {tr('analysis.reportExit', { a: collectedCount, b: requiredCount })}
                  </button>
                </div>
              </div>
            ) : null}

          {phase === 'reveal' || phase === 'restore' ? (
            <div className={s.veil} data-testid="analysis-veil">
              <div className={s.revealCard}>
                {phase === 'reveal' ? (
                  <>
                    <p className={s.revealQuote}>{data.reveal.quote}</p>
                    {data.reveal.paragraphs.map((paragraph, index) => (
                      <p key={index} className={s.revealBody}>
                        {paragraph}
                      </p>
                    ))}
                    <button
                      type="button"
                      className={s.primary}
                      data-testid="analysis-continue"
                      onClick={() => setPhase('restore')}
                    >
                      {tr('analysis.continue')}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={s.restoreTitle}>{tr('analysis.restoreTitle')}</p>
                    <p className={s.restoreText}>{data.restore.text}</p>
                    <p className={s.annotation}>{data.restore.annotation}</p>
                    <button type="button" className={s.primary} data-testid="analysis-done" onClick={finish}>
                      {tr('analysis.closeNotebook')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className={s.statusBar}>
        <span>{tr(PHASE_KEY[phase])}</span>
        <span>{tr('analysis.statusBar')}</span>
      </div>
    </section>
  );

  return (
    <>
      {typeof document !== 'undefined'
        ? createPortal(
            <div className={s.overlay} data-maximized={maximized} data-testid="analysis-overlay">
              {workspace}
            </div>,
            document.body,
          )
        : null}
      {dragId && dragPos && typeof document !== 'undefined'
        ? createPortal(
            <span
              className={s.dragGhost}
              style={{ left: dragPos.x, top: dragPos.y }}
              data-tone={byId.get(dragId) ? TONE[byId.get(dragId)!.kind] : undefined}
            >
              {byId.get(dragId)?.text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
