import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GroundingAnchor, GroundingGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;
const COLORS = ['#f0c866', '#e8e0cc', '#8fa8b8', '#d98f9b', '#7f9a6b'];
const ZONES = [
  { x: [10, 18], y: [14, 24] },
  { x: [48, 58], y: [16, 26] },
  { x: [16, 26], y: [42, 54] },
  { x: [50, 60], y: [44, 56] },
  { x: [30, 40], y: [70, 80] },
];
const TYPE_MS = 62;
const HOLD_MS = 1650;
const FADE_MS = 360;
const GAP_MS = 260;

type Phase = 'typing' | 'hold' | 'leaving';

function randomIn([min, max]: number[]) {
  return min + Math.random() * (max - min);
}

function positionFor(index: number) {
  const zone = ZONES[index % ZONES.length];
  return { x: randomIn(zone.x), y: randomIn(zone.y) };
}

function angleFor() {
  return -14 + Math.round(Math.random() * 28);
}

function GroundingWord({
  anchor,
  index,
  found,
  active,
  reduce,
  onPick,
}: {
  anchor: GroundingAnchor;
  index: number;
  found: boolean;
  active: boolean;
  reduce: boolean;
  onPick: (anchor: GroundingAnchor) => void;
}) {
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [position, setPosition] = useState(() => positionFor(index));
  const [angle, setAngle] = useState(angleFor);
  const visibleText = found || reduce ? anchor.text : anchor.text.slice(0, typed);

  useEffect(() => {
    if (found) return;
    if (reduce) {
      setTyped(anchor.text.length);
      setPhase('hold');
      return;
    }
    let stopped = false;
    let timer = 0;
    let cursor = 0;

    const schedule = (fn: () => void, ms: number) => {
      timer = window.setTimeout(fn, ms);
    };
    const typeNext = () => {
      if (stopped) return;
      cursor += 1;
      setTyped(cursor);
      if (cursor < anchor.text.length) {
        schedule(typeNext, TYPE_MS + Math.random() * 24);
        return;
      }
      setPhase('hold');
      schedule(beginLeave, HOLD_MS + Math.random() * 360);
    };
    const beginLeave = () => {
      if (stopped) return;
      setPhase('leaving');
      schedule(() => {
        if (stopped) return;
        setPosition(positionFor(index));
        setAngle(angleFor());
        cursor = 0;
        setTyped(0);
        setPhase('typing');
        schedule(typeNext, GAP_MS);
      }, FADE_MS);
    };

    schedule(typeNext, 180 + index * 260 + Math.random() * 340);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [anchor.text, found, index, reduce]);

  return (
    <button
      type="button"
      className={s.groundingWord}
      data-testid="grounding-anchor"
      data-anchor={anchor.id}
      data-sense={anchor.sense}
      data-found={found}
      data-active={active}
      data-phase={found ? 'found' : phase}
      aria-label={anchor.text}
      aria-pressed={found}
      style={
        {
          left: `${position.x}%`,
          top: `${position.y}%`,
          '--word-color': COLORS[index % COLORS.length],
          '--tilt': `${angle}deg`,
          '--jitter-duration': `${1.8 + (index % 3) * 0.35}s`,
          '--jitter-delay': `${-index * 0.4}s`,
        } as CSSProperties
      }
      onClick={() => onPick(anchor)}
    >
      <span className={s.groundingWordText} aria-hidden="true">
        {visibleText}
      </span>
      {!found && phase === 'typing' ? <span className={s.groundingCaret} aria-hidden="true" /> : null}
    </button>
  );
}

export function Grounding({
  data,
  onReady,
  onCaption,
}: {
  data: GroundingGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [found, setFound] = useState<string[]>([]);
  const [active, setActive] = useState<GroundingAnchor | null>(null);
  const [reduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const readyRef = useRef(false);
  const all = found.length >= data.anchors.length;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function pick(anchor: GroundingAnchor) {
    setActive(anchor);
    setFound((current) => (current.includes(anchor.id) ? current : [...current, anchor.id]));
    onCaption(anchor.line);
  }

  const image = active ? `${BASE}${active.image}` : undefined;

  return (
    <div className={s.grounding} data-testid="grounding-stage">
      <div
        key={active?.id ?? 'void'}
        className={s.groundingBg}
        data-testid="grounding-backdrop"
        data-bg={active?.id ?? ''}
        data-active={Boolean(active)}
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
        aria-hidden="true"
      />
      <div className={s.groundingFlow} aria-hidden="true" />
      <div className={s.groundingFlowB} aria-hidden="true" />
      <div className={s.groundingVeil} aria-hidden="true" />
      <div className={s.groundingNoise} aria-hidden="true" />
      <p className={s.groundingHint}>点一下正在散开的五感。点中的那一句会把背景叫回来。</p>
      {data.anchors.map((anchor, index) => (
        <GroundingWord
          key={anchor.id}
          anchor={anchor}
          index={index}
          found={found.includes(anchor.id)}
          active={active?.id === anchor.id}
          reduce={reduce}
          onPick={pick}
        />
      ))}
      <div className={s.groundingProgress} data-testid="grounding-progress">
        <span>找回来</span>
        <span className={s.groundingDots}>
          {data.anchors.map((anchor) => (
            <span
              key={anchor.id}
              className={s.groundingDot}
              data-done={found.includes(anchor.id)}
            />
          ))}
        </span>
        <span>{found.length} / {data.anchors.length}</span>
      </div>
    </div>
  );
}
