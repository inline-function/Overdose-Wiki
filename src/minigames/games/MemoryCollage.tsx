import { useEffect, useState } from 'react';
import type { MemoryCollageGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function MemoryCollage({
  data,
  onReady,
  onCaption,
}: {
  data: MemoryCollageGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const lit = revealed.length >= data.fragments.length;
  const activeFragment = data.fragments.find((fragment) => fragment.id === active);

  useEffect(() => {
    if (!lit) return;
    onReady();
    onCaption(data.closing);
  }, [lit, data.closing, onReady, onCaption]);

  function choose(id: string, line: string) {
    setActive(id);
    if (revealed.includes(id)) {
      onCaption(line);
      return;
    }
    setRevealed((current) => [...current, id]);
    onCaption(line);
  }

  return (
    <div className={s.collageStage}>
      {data.fragments.map((fragment) => (
        <div
          key={fragment.id}
          className={s.collageBackdrop}
          data-active={active === fragment.id}
          data-testid="memory-background"
          style={{ backgroundImage: `url("${BASE}${fragment.image}")` }}
          aria-hidden="true"
        />
      ))}
      <div className={s.collageVeil} aria-hidden="true" />
      <div className={s.collageGrid}>
        {data.fragments.map((fragment, index) => {
          const done = revealed.includes(fragment.id);
          return (
            <button
              key={fragment.id}
              type="button"
              className={s.fragment}
              data-testid="memory-fragment"
              data-fragment={fragment.id}
              data-revealed={done}
              data-active={active === fragment.id}
              data-tone={fragment.tone ?? 'yellow'}
              data-float={index}
              onClick={() => choose(fragment.id, fragment.line)}
              style={{
                left: `${fragment.x}%`,
                top: `${fragment.y}%`,
                width: `${fragment.w}%`,
                height: `${fragment.h}%`,
              }}
              aria-pressed={done}
            >
              <span className={s.fragmentLabel}>
                {done ? fragment.label : `▢ ${fragment.label}`}
              </span>
              <span className={s.fragmentLine}>{fragment.line}</span>
            </button>
          );
        })}
      </div>
      <div className={s.collageNow} aria-live="polite">
        {activeFragment ? `此刻：${activeFragment.label}` : '点一段记忆，让它亮起来'}
      </div>
      <span className={s.collageHud}>
        {revealed.length} / {data.fragments.length}
      </span>
    </div>
  );
}
