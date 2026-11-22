import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { ArchiveCard, ArchiveEnvelopeGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

type Phase = 'cards' | 'closing' | 'moving' | 'label' | 'whiteout' | 'bleeding' | 'black';

type Falling = {
  card: ArchiveCard;
  left: number;
  top: number;
  distance: number;
};

type Ghost = {
  card: ArchiveCard;
  x: number;
  y: number;
};

export function ArchiveEnvelope({
  data,
  onCaption,
  onDone,
}: {
  data: ArchiveEnvelopeGame;
  onCaption: (text: string) => void;
  onDone: () => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [falling, setFalling] = useState<Falling | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [drawerClosed, setDrawerClosed] = useState(false);
  const [centered, setCentered] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>('cards');
  const typedRef = useRef(0);
  const timers = useRef<number[]>([]);
  const dragCleanup = useRef<(() => void) | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLButtonElement | null>(null);

  function after(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  useEffect(() => {
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
      dragCleanup.current?.();
    };
  }, []);

  const allPlaced = placed.length >= data.cards.length;

  useEffect(() => {
    if (!allPlaced || phase !== 'cards') return;
    setPhase('closing');
    setDrawerClosed(true);
    onCaption('抽屉自己合上了。');
    after(700, () => {
      setCentered(true);
      setPhase('moving');
      onCaption('档案袋先快后慢，挪到屏幕中间。');
    });
    after(1900, () => {
      setLabelVisible(true);
      setPhase('label');
      onCaption('标签上还缺一个名字。点它，或按空格 / 回车。');
    });
  }, [allPlaced, phase, onCaption]);

  useEffect(() => {
    if (phase !== 'label') return;
    labelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function advance() {
    if (phase !== 'label') return;
    const current = typedRef.current;
    if (current >= data.name.length) return;
    const next = current + 1;
    typedRef.current = next;
    setTyped(next);
    onCaption(
      next === data.name.length
        ? '名字写完了。'
        : `写下第 ${next} 个字：${data.name[next - 1]}。`,
    );
    if (next === data.name.length) {
      setPhase('whiteout');
      after(320, () => setPhase('bleeding'));
      after(1250, () => setPhase('black'));
      after(2250, () => onDone());
    }
  }

  function pointOverEnvelope(x: number, y: number) {
    const envelope = envelopeRef.current?.getBoundingClientRect();
    if (!envelope) return false;
    return x >= envelope.left && x <= envelope.right && y >= envelope.top && y <= envelope.bottom;
  }

  function dropAt(card: ArchiveCard, clientX?: number) {
    if (phase !== 'cards' || falling || placed.includes(card.id)) return;
    const envelope = envelopeRef.current?.getBoundingClientRect();
    if (!envelope) return;
    const left = clientX === undefined
      ? 50
      : Math.max(10, Math.min(90, ((clientX - envelope.left) / envelope.width) * 100));
    setGhost(null);
    setDraggingId(null);
    setOver(false);
    setFalling({
      card,
      left,
      top: -10,
      distance: envelope.height * 0.94,
    });
    onCaption('手松开了，卡片从上面掉进去。');
    after(720, () => {
      setFalling(null);
      setPlaced((current) => (current.includes(card.id) ? current : [...current, card.id]));
      onCaption('卡片落进了档案袋。');
    });
  }

  function beginPointer(card: ArchiveCard, event: ReactPointerEvent<HTMLButtonElement>) {
    if (phase !== 'cards' || falling || placed.includes(card.id)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    dragCleanup.current?.();

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (dragCleanup.current === cleanup) dragCleanup.current = null;
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 4) {
        moved = true;
        setDraggingId(card.id);
        onCaption('把卡片拖到档案袋上，然后松手。');
      }
      if (!moved) return;
      setGhost({ card, x: moveEvent.clientX, y: moveEvent.clientY });
      setOver(pointOverEnvelope(moveEvent.clientX, moveEvent.clientY));
      if (moveEvent.cancelable) moveEvent.preventDefault();
    };

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      cleanup();
      if (!moved) {
        dropAt(card);
        return;
      }
      if (pointOverEnvelope(upEvent.clientX, upEvent.clientY)) {
        dropAt(card, upEvent.clientX);
      } else {
        setGhost(null);
        setDraggingId(null);
        setOver(false);
        onCaption('卡片没有落进档案袋。');
      }
    };

    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
      setGhost(null);
      setDraggingId(null);
      setOver(false);
    };

    dragCleanup.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  const glow = [0.55, 0.95, 1.5, 2.3, 3.6][Math.min(typed, 4)];
  const saturation = [0.86, 1.1, 1.4, 1.8, 2.4][Math.min(typed, 4)];
  const drawerCards = data.cards.filter(
    (card) => !placed.includes(card.id) && falling?.card.id !== card.id,
  );

  return (
    <div className={s.archiveStage} ref={stageRef} data-testid="archive-stage">
      <div
        className={s.archiveBg}
        data-testid="archive-background"
        style={{
          backgroundImage: `url("${BASE}${data.background}")`,
          filter: `blur(calc(1.2 * var(--u))) brightness(${glow}) saturate(${saturation})`,
        }}
        aria-hidden="true"
      />
      <div className={s.archiveHaze} aria-hidden="true" />
      <div className={s.archiveNoise} aria-hidden="true" />

      <div
        className={s.archiveEnvelope}
        ref={envelopeRef}
        data-testid="archive-envelope"
        data-centered={centered}
        data-over={over}
      >
        <div className={s.archiveBack} aria-hidden="true" />
        <div className={s.archiveOpening} aria-hidden="true" />

        {falling ? (
          <div
            key={falling.card.id}
            className={s.archiveFallingCard}
            data-testid="archive-falling-card"
            style={{
              left: `${falling.left}%`,
              top: `${falling.top}%`,
              '--fall-distance': `${falling.distance}px`,
            } as CSSProperties}
            aria-hidden="true"
          >
            {falling.card.text}
          </div>
        ) : null}

        <div className={s.archiveFront} aria-hidden="true">
          <span className={s.archiveFlapFace} />
          <svg
            className={s.archiveFlapLines}
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M1 1 L50 29 L99 1" />
          </svg>
          <span className={s.archiveStamped}>档案</span>
          <svg
            className={s.archiveStringArt}
            viewBox="0 0 100 34"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M7 22 C 21 12, 31 30, 50 22 S 79 12, 93 22" />
            <path d="M7 22 C 21 32, 31 14, 50 22 S 79 32, 93 22" />
            <path d="M7 22 C 2 12, 8 5, 15 11" />
            <path d="M93 22 C 98 12, 92 5, 85 11" />
            <circle cx="7" cy="22" r="4.6" />
            <circle cx="93" cy="22" r="4.6" />
            <circle cx="50" cy="22" r="1.2" />
          </svg>
          <span className={s.archiveButtonLeft} />
          <span className={s.archiveButtonRight} />
          <span className={s.archiveCreaseA} />
          <span className={s.archiveCreaseB} />
          <span className={s.archiveSeamLeft} />
          <span className={s.archiveSeamRight} />
          <span className={s.archiveBottomFold} />
        </div>

        <div className={s.archiveLabelFrame} aria-hidden="true" />

        {labelVisible ? (
          <button
            type="button"
            ref={labelRef}
            className={s.archiveNameLabel}
            data-testid="archive-label"
            data-visible={labelVisible}
            aria-label={`在档案袋标签上写名字。第 ${Math.min(typed + 1, data.name.length)} 个字。`}
            onClick={advance}
          >
            <span className={s.archiveNameCaption}>姓名</span>
            <span className={s.archiveName} data-testid="archive-name">
              {Array.from(data.name).map((char, index) => (
                <span key={`${char}-${index}`} data-filled={index < typed}>
                  {index < typed ? char : '＿'}
                </span>
              ))}
            </span>
          </button>
        ) : null}
      </div>

      <div className={s.archiveDrawer} data-testid="archive-drawer" data-closed={drawerClosed}>
        <div className={s.archiveDrawerHead}>
          <span>她说过的</span>
          <span className={s.archiveCount}>{placed.length} / {data.cards.length}</span>
        </div>
        <div className={s.archiveCards}>
          {drawerCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={s.archiveCard}
              data-testid="archive-card"
              data-card={card.id}
              data-dragging={draggingId === card.id}
              title="按住拖到档案袋上，然后松手；也可以点一下"
              onPointerDown={(event) => beginPointer(card, event)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                dropAt(card);
              }}
            >
              {card.text}
            </button>
          ))}
          {drawerCards.length === 0 ? <span className={s.archiveEmpty}>都放进去了。</span> : null}
        </div>
      </div>

      {ghost ? (
        <div
          className={s.archiveDragCard}
          data-testid="archive-drag-card"
          style={{ left: ghost.x, top: ghost.y } as CSSProperties}
          aria-hidden="true"
        >
          {ghost.card.text}
        </div>
      ) : null}

      {phase === 'whiteout' || phase === 'bleeding' || phase === 'black' ? (
        <div className={s.archiveWhiteout} data-testid="archive-whiteout" aria-hidden="true" />
      ) : null}
      {phase === 'bleeding' || phase === 'black' ? (
        <div className={s.archiveBleed} data-testid="archive-bleed" aria-hidden="true" />
      ) : null}
      {phase === 'black' ? (
        <div className={s.archiveBlackout} data-testid="archive-black" aria-hidden="true" />
      ) : null}
    </div>
  );
}
