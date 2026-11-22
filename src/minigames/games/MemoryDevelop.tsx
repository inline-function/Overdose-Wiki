import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MemoryDevelopGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function MemoryDevelop({
  data,
  onReady,
  onCaption,
}: {
  data: MemoryDevelopGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [visited, setVisited] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const readyRef = useRef(false);
  const all = visited.length >= data.photos.length;
  const activePhoto = data.photos.find((photo) => photo.id === active);

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function choose(photo: (typeof data.photos)[number]) {
    setActive(photo.id);
    if (!visited.includes(photo.id)) {
      setVisited((current) => [...current, photo.id]);
    }
    onCaption(photo.line);
  }

  return (
    <div className={s.memoryDevelop} data-testid="memory-develop-stage">
      <div className={s.memoryDevelopLine} aria-hidden="true" />
      <div className={s.memoryDevelopPhotos} role="group" aria-label="没有显影的照片">
        {data.photos.map((photo, index) => {
          const done = visited.includes(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              className={s.memoryDevelopPhoto}
              data-testid="memory-photo"
              data-photo={photo.id}
              data-developed={done}
              data-blank={photo.tone === 'blank'}
              data-active={active === photo.id}
              data-tone={photo.tone}
              aria-pressed={done}
              onClick={() => choose(photo)}
              style={{ '--photo-tilt': `${(index % 2 === 0 ? -1 : 1) * (1.5 + index * 0.7)}deg` } as CSSProperties}
            >
              {photo.image ? (
                <span
                  className={s.memoryDevelopImage}
                  style={{ backgroundImage: `url("${BASE}${photo.image}")` }}
                  aria-hidden="true"
                />
              ) : (
                <span className={s.memoryDevelopBlank} aria-hidden="true">
                  <span />
                </span>
              )}
              <span className={s.memoryDevelopLabel}>{photo.label}</span>
              <span className={s.memoryDevelopCopy}>{photo.line}</span>
            </button>
          );
        })}
      </div>
      <div className={s.memoryDevelopNote} aria-live="polite">
        {all
          ? '照片都看过了。最后一张还是空的。'
          : activePhoto
            ? `此刻：${activePhoto.label}`
            : '点一张照片，让它显影。'}
      </div>
      <span className={s.memoryDevelopCount} aria-label={`已显影 ${visited.length} 张，共 ${data.photos.length} 张`}>
        {visited.length} / {data.photos.length}
      </span>
    </div>
  );
}
