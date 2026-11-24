import { useEffect, useMemo, useRef, useState } from 'react';
import type { TripTimelineGame } from '../../content/types';
import { shuffleArray } from '../shuffle';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

const pad = (value: number) => String(value).padStart(2, '0');

export function TripTimeline({
  data,
  onReady,
  onCaption,
}: {
  data: TripTimelineGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const tr = useT();
  const [order] = useState(() => shuffleArray(data.cards));
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const readyRef = useRef(false);
  const slotCount = data.cards.length;
  const placedIds = useMemo(() => new Set(Object.values(placed)), [placed]);
  const tray = order.filter((card) => !placedIds.has(card.id));
  const filled = Object.keys(placed).length;
  const guideCard = data.cards.find((card) => card.id === (dragging ?? selected));
  const guideSlot = guideCard ? guideCard.order - 1 : null;

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
    onCaption(tr('trip.wrongOrder'));
  }, [filled, slotCount, placed, data.cards, data.closing, onReady, onCaption]);

  function select(cardId: string) {
    const card = data.cards.find((item) => item.id === cardId);
    if (selected === cardId) {
      setSelected(null);
      onCaption(tr('trip.placeHint'));
      return;
    }
    setSelected(cardId);
    if (card) {
      onCaption(
        tr('trip.guideCard', { label: card.label, order: pad(card.order) }),
      );
    }
  }

  function startDrag(cardId: string) {
    const card = data.cards.find((item) => item.id === cardId);
    setSelected(cardId);
    setDragging(cardId);
    if (card) {
      onCaption(tr('trip.placedGuide', { label: card.label, order: pad(card.order) }));
    }
  }

  function endDrag() {
    setDragging(null);
    setOver(null);
  }

  function place(slot: number, cardId: string | null) {
    if (!cardId) {
      if (placed[slot]) {
        setPlaced((current) => {
          const next = { ...current };
          delete next[slot];
          return next;
        });
        setSelected(null);
        setDragging(null);
        setOver(null);
        onCaption(tr('trip.returned'));
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
    setDragging(null);
    setOver(null);
    setWrong([]);
  }

  function handleDrop(event: React.DragEvent, slot: number) {
    event.preventDefault();
    place(slot, event.dataTransfer.getData('text/plain') || selected);
  }

  return (
    <div className={s.timeline}>
      <div className={s.timelineTray} data-testid="timeline-tray">
        <p className={s.trayHeading}>{tr('trip.tray', { n: tray.length })}</p>
        {guideCard ? (
          <p className={s.trayGuide} data-testid="timeline-guide">
            {tr('trip.guideCard', { label: guideCard.label, order: pad(guideCard.order) })}
          </p>
        ) : null}
        {tray.map((card) => (
          <button
            key={card.id}
            type="button"
            className={s.tripCard}
            data-testid="trip-card"
            data-card={card.id}
            data-selected={selected === card.id}
            data-dragging={dragging === card.id}
            draggable
            title={tr('trip.guideTitle')}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', card.id);
              event.dataTransfer.effectAllowed = 'move';
              startDrag(card.id);
            }}
            onDragEnd={endDrag}
            onClick={() => select(card.id)}
          >
            <span className={s.cardHead}>
              <span className={s.tripLabel}>{card.label}</span>
              <span className={s.dragHandle} aria-hidden>
                ⠿
              </span>
            </span>
            <span className={s.tripLine}>{card.line}</span>
          </button>
        ))}
        {tray.length === 0 ? <span className={s.hint}>{tr('trip.empty')}</span> : null}
      </div>
      <div className={s.timelineSlots} data-testid="timeline-slots">
        {Array.from({ length: slotCount }, (_, index) => {
          const card = data.cards.find((item) => item.id === placed[index]);
          const isGuide = guideSlot === index;
          return (
            <div key={index} className={s.timelineRow} data-guide={isGuide}>
              <span className={s.timelineIndex}>{pad(index + 1)}</span>
              <button
                type="button"
                className={s.timelineSlot}
                data-testid="timeline-slot"
                data-slot={index}
                data-filled={Boolean(card)}
                data-wrong={wrong.includes(index)}
                data-correct={Boolean(card && card.order === index + 1)}
                data-guide={isGuide}
                data-over={over === index}
                data-dragging={Boolean(card && dragging === card.id)}
                draggable={Boolean(card)}
                onDragStart={(event) => {
                  if (!card) return;
                  event.dataTransfer.setData('text/plain', card.id);
                  event.dataTransfer.effectAllowed = 'move';
                  startDrag(card.id);
                }}
                onDragEnd={endDrag}
                onClick={() => {
                  if (selected) place(index, selected);
                  else place(index, null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (over !== index) setOver(index);
                }}
                onDrop={(event) => handleDrop(event, index)}
              >
                {card ? (
                  <>
                    <span className={s.cardHead}>
                      <span className={s.tripLabel}>{card.label}</span>
                      <span className={s.dragHandle} aria-hidden>
                        ⠿
                      </span>
                    </span>
                    <span className={s.tripLine}>{card.line}</span>
                  </>
                ) : (
                  <span>{isGuide ? tr('trip.slotHere', { n: pad(index + 1) }) : tr('trip.slotEmpty')}</span>
                )}
                {isGuide ? (
                  <span className={s.slotGuide} data-testid="timeline-guide-slot">
                    {tr('trip.correct')}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
