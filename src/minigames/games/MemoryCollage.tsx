import { useEffect, useState } from 'react';
import type { MemoryCollageGame } from '../../content/types';
import s from '../minigame.module.css';

const BG = `${import.meta.env.BASE_URL}assets-private/bg/bg_spring_festival.png`;

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
  const lit = revealed.length >= data.fragments.length;

  useEffect(() => {
    if (!lit) return;
    onReady();
    onCaption(data.closing);
  }, [lit, data.closing, onReady, onCaption]);

  function reveal(id: string, line: string) {
    if (revealed.includes(id)) return;
    setRevealed((current) => [...current, id]);
    onCaption(line);
  }

  return (
    <div className={s.collageStage} data-lit={lit} style={{ backgroundImage: `url("${BG}")` }}>
      <div className={s.collageGrid}>
        {data.fragments.map((fragment) => {
          const done = revealed.includes(fragment.id);
          return (
            <button
              key={fragment.id}
              type="button"
              className={s.fragment}
              data-testid="memory-fragment"
              data-fragment={fragment.id}
              data-revealed={done}
              data-tone={fragment.tone ?? 'yellow'}
              onClick={() => reveal(fragment.id, fragment.line)}
              style={{
                left: `${fragment.x}%`,
                top: `${fragment.y}%`,
                width: `${fragment.w}%`,
                height: `${fragment.h}%`,
              }}
              aria-pressed={done}
            >
              <span className={s.fragmentLabel}>{done ? fragment.label : `▢ ${fragment.label}`}</span>
              <span className={s.fragmentLine}>{fragment.line}</span>
            </button>
          );
        })}
      </div>
      <span className={s.collageHud}>
        {revealed.length} / {data.fragments.length}
      </span>
    </div>
  );
}
