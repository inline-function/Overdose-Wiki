import { useEffect, useRef, useState } from 'react';
import type { GroundingAnchor, GroundingGame } from '../../content/types';
import s from '../minigame.module.css';

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

  return (
    <div className={s.grounding} data-testid="grounding-stage">
      <div className={s.groundingHole} aria-hidden="true">
        <span className={s.groundingHoleRing} />
      </div>
      <div className={s.groundingGrid}>
        {data.anchors.map((anchor) => {
          const done = found.includes(anchor.id);
          return (
            <button
              key={anchor.id}
              type="button"
              className={s.groundingAnchor}
              data-testid="grounding-anchor"
              data-sense={anchor.sense}
              data-found={done}
              data-active={active?.id === anchor.id}
              aria-pressed={done}
              onClick={() => pick(anchor)}
            >
              <span className={s.groundingSense}>{anchor.sense}</span>
              <span className={s.groundingLabel}>{anchor.label}</span>
            </button>
          );
        })}
      </div>
      <p className={s.groundingNow} aria-live="polite">
        {active ? active.line : '从最近的东西开始。一件就够。'}
      </p>
      <span className={s.groundingCount} aria-label={`已找回 ${found.length} 件`}>
        {found.length} / {data.anchors.length}
      </span>
    </div>
  );
}
