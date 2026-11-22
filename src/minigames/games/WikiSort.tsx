import { useEffect, useMemo, useRef, useState } from 'react';
import type { WikiSortGame } from '../../content/types';
import s from '../minigame.module.css';

export function WikiSort({
  data,
  onReady,
  onCaption,
}: {
  data: WikiSortGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  const readyRef = useRef(false);
  const placedIds = useMemo(() => new Set(Object.keys(placed)), [placed]);
  const tray = data.cards.filter((card) => !placedIds.has(card.id));
  const all = tray.length === 0;

  useEffect(() => {
    if (!all) return;
    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  function pulse(categoryId: string) {
    setFlash(categoryId);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 420);
  }

  function place(categoryId: string, cardId: string | null) {
    if (!cardId) return;
    const card = data.cards.find((item) => item.id === cardId);
    if (!card) return;
    if (card.category !== categoryId) {
      pulse(categoryId);
      onCaption(`「${card.label}」不该放在「${data.categories.find((item) => item.id === categoryId)?.label ?? categoryId}」。`);
      return;
    }
    setPlaced((current) => ({ ...current, [cardId]: categoryId }));
    setSelected(null);
    onCaption(`「${card.label}」归档。`);
  }

  function handleDrop(event: React.DragEvent, categoryId: string) {
    event.preventDefault();
    place(categoryId, event.dataTransfer.getData('text/plain') || selected);
  }

  return (
    <div className={s.wiki}>
      <div className={s.wikiTray} data-testid="wiki-tray">
        <p className={s.trayHeading}>未整理 · {tray.length}</p>
        {tray.map((card) => (
          <button
            key={card.id}
            type="button"
            className={s.wikiCard}
            data-testid="wiki-card"
            data-card={card.id}
            data-selected={selected === card.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', card.id);
              setSelected(card.id);
            }}
            onClick={() => setSelected(selected === card.id ? null : card.id)}
          >
            <span className={s.wikiCardLabel}>{card.label}</span>
            <span className={s.wikiCardNote}>{card.note}</span>
          </button>
        ))}
        {tray.length === 0 ? <span className={s.hint}>都归档了。</span> : null}
      </div>
      <div className={s.wikiCategories} data-testid="wiki-categories">
        {data.categories.map((category) => {
          const cards = data.cards.filter((card) => placed[card.id] === category.id);
          return (
            <div
              key={category.id}
              className={s.wikiCategory}
              data-testid="wiki-category"
              data-category={category.id}
              data-flash={flash === category.id}
              data-drop={selected ? true : undefined}
              onClick={() => place(category.id, selected)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, category.id)}
            >
              <span className={s.wikiCategoryLabel}>
                {category.label} · {cards.length}
              </span>
              <div className={s.wikiPlaced}>
                {cards.map((card) => (
                  <span key={card.id} className={s.wikiChip}>
                    {card.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
