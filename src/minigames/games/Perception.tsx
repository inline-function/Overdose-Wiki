import { useEffect, useRef, useState } from 'react';
import type { PerceptionGame } from '../../content/types';
import s from '../minigame.module.css';

export function Perception({
  data,
  onReady,
  onCaption,
}: {
  data: PerceptionGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const timer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const line = data.lines[index];
  const last = index >= data.lines.length - 1;

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  function startHold() {
    if (done.includes(index) || holding) return;
    setHolding(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setDone((current) => (current.includes(index) ? current : [...current, index]));
      onCaption(data.lines[index].note ?? '这一句终于读完了。');
      if (last) {
        onReady();
        onCaption(data.closing);
        return;
      }
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        setIndex((current) => current + 1);
      }, 420);
    }, 900);
  }

  function cancelHold() {
    setHolding(false);
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }

  return (
    <div className={s.perception}>
      <div className={s.phone} data-stable={holding} data-testid="perception-phone">
        <div className={s.driftLine} aria-live="polite">
          {Array.from(line.text).map((char, charIndex) => (
            <span
              key={`${line.id}-${charIndex}`}
              className={s.driftChar}
              style={{ animationDelay: `${(charIndex % 7) * 0.13}s` }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={s.holdButton}
        data-testid="perception-hold"
        data-holding={holding}
        onPointerDown={(event) => {
          event.preventDefault();
          startHold();
        }}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(event) => {
          if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
            event.preventDefault();
            startHold();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') cancelHold();
        }}
      >
        {holding ? '按住……别松' : '按住读这一句'}
      </button>
      <div className={s.perceptionMeta}>
        <span>
          {index + 1} / {data.lines.length}
        </span>
        <span className={s.dots} aria-hidden="true">
          {data.lines.map((item, dotIndex) => (
            <span key={item.id} className={s.dot} data-done={done.includes(dotIndex)} />
          ))}
        </span>
      </div>
    </div>
  );
}
