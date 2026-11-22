import { useEffect, useMemo, useRef, useState } from 'react';
import type { TripTimelineGame } from '../../content/types';
import s from '../minigame.module.css';

export function TripTimeline({
  data,
  onReady,
  onCaption,
}: {
  data: TripTimelineGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const readyRef = useRef(false);
  const slotCount = data.cards.length;
  const placedIds = useMemo(() => new Set(Object.values(placed)), [placed]);
  const tray = data.cards.filter((card) => !placedIds.has(card.id));
  const filled = Object.keys(placed).length;

  useEffect(() => {
    if (filled < slotCount) return;
    const bad = Array.from({ length: slotCount }, (_, slot) => {
      const card = data.cards.find((item) => item.id === placed[slot]);
      return card && card.order === slot + 1 ? -1 : slot;
    }).filter((index) => index >= 0);
    if (bad.length === 0) {
      setWrong([]);
      if (!readyRef.current) {
        readyRef.current = true;
        onReady();
      }
      onCaption(data.closing);
      return;
    }
    setWrong(bad);
    onCaption('记忆对不上。按发生过的顺序再排一次。');
  }, [filled, slotCount, placed, data.cards, data.closing, onReady, onCaption]);

  function place(slot: number, cardId: string | null) {
    if (!cardId) {
      if (placed[slot]) {
        setPlaced((current) => {
          const next = { ...current };
          delete next[slot];
          return next;
        });
        setSelected(null);
      }
      return;
    }
    setPlaced((current) => {
      const next: Record<number, string> = {};
      for (const [key, value] of Object.entries(current)) {
        if (value !== cardId) next[Number(key)] = value;
      }
      next[slot] = cardId;
      return next;
    });
    setSelected(null);
    setWrong([]);
  }

  function handleDrop(event: React.DragEvent, slot: number) {
    event.preventDefault();
    place(slot, event.dataTransfer.getData('text/plain') || selected);
  }

  return (
    <div className={s.timeline}>
      <div className={s.timelineTray} data-testid="timeline-tray">
        <p className={s.trayHeading}>未编目 · {tray.length}</p>
        {tray.map((card) => (
          <button
            key={card.id}
            type="button"
            className={s.tripCard}
            data-testid="trip-card"
            data-card={card.id}
            data-selected={selected === card.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', card.id);
              setSelected(card.id);
            }}
            onClick={() => setSelected(selected === card.id ? null : card.id)}
          >
            <span className={s.tripLabel}>{card.label}</span>
            <span className={s.tripLine}>{card.line}</span>
          </button>
        ))}
        {tray.length === 0 ? <span className={s.hint}>都放上去了。看看顺序。</span> : null}
      </div>
      <div className={s.timelineSlots} data-testid="timeline-slots">
        {Array.from({ length: slotCount }, (_, index) => {
          const card = data.cards.find((item) => item.id === placed[index]);
          return (
            <div key={index} className={s.timelineRow}>
              <span className={s.timelineIndex}>{String(index + 1).padStart(2, '0')}</span>
              <button
                type="button"
                className={s.timelineSlot}
                data-testid="timeline-slot"
                data-slot={index}
                data-filled={Boolean(card)}
                data-wrong={wrong.includes(index)}
                data-correct={Boolean(card && card.order === index + 1)}
                onClick={() => {
                  if (selected) place(index, selected);
                  else place(index, null);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
              >
                {card ? (
                  <>
                    <span className={s.tripLabel}>{card.label}</span>
                    <span className={s.tripLine}>{card.line}</span>
                  </>
                ) : (
                  <span>把卡片放到这里</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
