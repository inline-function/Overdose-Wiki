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
import type { AnalysisBlockKind, AnalysisCase, AnalysisKeyword, AnalysisSlot } from '../content/types';
import s from './analysis.module.css';

type Phase = 'collect' | 'build' | 'sealed' | 'reveal' | 'restore';

const PHASE_LABEL: Record<Phase, string> = {
  collect: '解离中',
  build: '串链中',
  sealed: '链条闭合',
  reveal: '点破压抑',
  restore: '恢复',
};

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
      setCaption('词都齐了。退出报告，把积木串成链子。');
    }
  }

  function closeReport() {
    if (!allCollected) {
      gateAudio.hollow();
      setHint(`还有 ${requiredCount - collectedCount} 个蓝词没有点：把报告再读一遍。`);
      return;
    }
    setReportOpen(false);
    setHint(null);
    setPhase('build');
    setCaption('拖动积木，把它们串成一条链。');
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
      setHint('这一块和这条链对不上。');
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
      setCaption('链子合上了。点「点破压抑」，看看被压住的是什么。');
    } else {
      const next = nextOpenSlot(data, nextPlaced);
      if (next?.hint) setCaption(`后藤：${next.hint}`);
    }
  }

  function clickSlot(slot: AnalysisSlot) {
    if (placed[slot.id]) {
      if (selected) {
        setHint('这个位置已经有积木了；先点它取回，再放别的。');
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
      setHint('先从下面拖一块积木，或者先点它再点空位。');
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
        aria-label={`${slot.chain === 'main' ? '主链' : '分支'}空位${block ? `：${block.text}` : '，空'}`}
      >
        <span className={s.slotText}>{block?.text ?? '空'}</span>
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
      aria-label={`精神分析：${data.title}`}
    >
      <div className={s.titleBar}>
        <span className={s.titleIcon} aria-hidden="true">▣</span>
        <span className={s.titleText}>精神分析 · 病例工作台</span>
        <span className={s.titleCase}>{data.title}</span>
        <div className={s.titleButtons}>
          <button
            type="button"
            className={s.winBtn}
            aria-label={minimized ? '展开窗口' : '收起窗口'}
            title={minimized ? '展开' : '收起'}
            onClick={() => setMinimized((value) => !value)}
          >
            _
          </button>
          <button
            type="button"
            className={s.winBtn}
            aria-label={maximized ? '还原窗口' : '放大窗口'}
            title={maximized ? '还原' : '放大'}
            onClick={() => setMaximized((value) => !value)}
          >
            □
          </button>
          <button
            type="button"
            className={`${s.winBtn} ${s.exit}`}
            data-testid="analysis-exit"
            aria-label="退出精神分析"
            title="退出"
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
              <p className={s.kicker}>精神分析 · 病例</p>
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
                报告全文
              </button>
              <span className={s.counter} data-testid="analysis-counter">
                关键词 {collectedCount}/{requiredCount} · 链条 {filled}/{data.slots.length}
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
                  <span className={s.chainTag}>主链</span>
                  {mainSlots.map((item, index) => (
                    <span key={item.id} className={s.chainPart}>
                      {index > 0 ? <span className={s.arrow} aria-hidden="true">→</span> : null}
                      {slot(item)}
                    </span>
                  ))}
                </div>
                <div className={s.chain} data-chain="branch">
                  <span className={s.chainTag}>分支</span>
                  {branchSlots.map((item, index) => (
                    <span key={item.id} className={s.chainPart}>
                      {index > 0 ? <span className={s.arrow} aria-hidden="true">⇢ 压抑 ⇢</span> : null}
                      {slot(item)}
                    </span>
                  ))}
                  <span className={s.arrow} aria-hidden="true">回到病因</span>
                </div>
              </div>

              <div className={s.tray} aria-label="积木" data-testid="analysis-tray">
                {tray.length === 0 ? (
                  <span className={s.trayEmpty}>
                    {phase === 'collect' ? '点开报告全文，把蓝词收成积木。' : '积木都放上去了。'}
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
            </div>

          </div>

          <footer className={s.foot}>
            <p className={s.hint} data-testid="analysis-hint">
              {hint ?? (phase === 'collect' ? '先点右上角「报告全文」。' : '把积木拖进空位；点已填的格子可以取回。')}
            </p>
            {phase === 'sealed' ? (
              <button type="button" className={s.primary} data-testid="analysis-reveal" onClick={reveal}>
                点破压抑
              </button>
            ) : null}
          </footer>

            {reportOpen ? (
              <div className={s.report} role="dialog" aria-label="报告全文" data-testid="analysis-report">
                <div className={s.reportHead}>
                  <span>{data.report.title}</span>
                  <button type="button" className={s.ghost} onClick={() => setReportOpen(false)}>
                    收起
                  </button>
                </div>
                <div className={s.reportBody}>
                  {data.report.paragraphs.map((paragraph, index) => (
                    <p key={index}>{renderKeywords(paragraph, data.keywords, collected, collect)}</p>
                  ))}
                </div>
                <div className={s.reportFoot}>
                  <span className={s.reportHint}>点蓝词，把它收成积木。</span>
                  <button
                    type="button"
                    className={s.darkBtn}
                    data-testid="analysis-report-close"
                    onClick={closeReport}
                  >
                    退出报告（{collectedCount}/{requiredCount}）
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
                      继续
                    </button>
                  </>
                ) : (
                  <>
                    <p className={s.restoreTitle}>恢复</p>
                    <p className={s.restoreText}>{data.restore.text}</p>
                    <p className={s.annotation}>{data.restore.annotation}</p>
                    <button type="button" className={s.primary} data-testid="analysis-done" onClick={finish}>
                      合上笔记本
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className={s.statusBar}>
        <span>{PHASE_LABEL[phase]}</span>
        <span>病例 · ESC 退出 · 拖拽积木入槽</span>
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
