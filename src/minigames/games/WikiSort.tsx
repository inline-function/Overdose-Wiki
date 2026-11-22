import { useEffect, useMemo, useRef, useState } from 'react';
import type { WikiSortGame } from '../../content/types';
import { shuffleArray } from '../shuffle';
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
  const [order] = useState(() => shuffleArray(data.cards));
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  const readyRef = useRef(false);
  const placedIds = useMemo(() => new Set(Object.keys(placed)), [placed]);
  const tray = order.filter((card) => !placedIds.has(card.id));
  const all = tray.length === 0;
  const guideCard = data.cards.find((card) => card.id === (dragging ?? selected));
  const guideCategory = guideCard
    ? data.categories.find((category) => category.id === guideCard.category)
    : undefined;

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

  function select(cardId: string) {
    const card = data.cards.find((item) => item.id === cardId);
    setSelected((current) => (current === cardId ? null : cardId));
    if (card) {
      const category = data.categories.find((item) => item.id === card.category);
      onCaption(
        category
          ? `「${card.label}」应该归到「${category.label}」。拖过去，或点一下分类。`
          : '拖动这张卡，或点一下它，再点分类。',
      );
    }
  }

  function startDrag(cardId: string) {
    const card = data.cards.find((item) => item.id === cardId);
    setSelected(cardId);
    setDragging(cardId);
    const category = data.categories.find((item) => item.id === card?.category);
    if (card && category) {
      onCaption(`「${card.label}」→「${category.label}」。右侧高亮的分类就是它的位置。`);
    }
  }

  function endDrag() {
    setDragging(null);
    setOver(null);
  }

  function place(categoryId: string, cardId: string | null) {
    if (!cardId) return;
    const card = data.cards.find((item) => item.id === cardId);
    if (!card) return;
    const category = data.categories.find((item) => item.id === categoryId);
    if (card.category !== categoryId) {
      pulse(categoryId);
      onCaption(`「${card.label}」不该放在「${category?.label ?? categoryId}」。看高亮的分类。`);
      return;
    }
    setPlaced((current) => ({ ...current, [cardId]: categoryId }));
    setSelected(null);
    setDragging(null);
    setOver(null);
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
        {guideCard && guideCategory ? (
          <p className={s.trayGuide} data-testid="wiki-guide">
            「{guideCard.label}」→「{guideCategory.label}」
          </p>
        ) : null}
        {tray.map((card) => (
          <button
            key={card.id}
            type="button"
            className={s.wikiCard}
            data-testid="wiki-card"
            data-card={card.id}
            data-selected={selected === card.id}
            data-dragging={dragging === card.id}
            draggable
            title="拖动到右侧分类，或点一下再点分类"
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', card.id);
              event.dataTransfer.effectAllowed = 'move';
              startDrag(card.id);
            }}
            onDragEnd={endDrag}
            onClick={() => select(card.id)}
          >
            <span className={s.cardHead}>
              <span className={s.wikiCardLabel}>{card.label}</span>
              <span className={s.dragHandle} aria-hidden>
                ⠿
              </span>
            </span>
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
              data-guide={guideCategory?.id === category.id}
              data-over={over === category.id}
              onClick={() => place(category.id, selected)}
              onDragOver={(event) => {
                event.preventDefault();
                if (over !== category.id) setOver(category.id);
              }}
              onDrop={(event) => handleDrop(event, category.id)}
            >
              <span className={s.wikiCategoryLabel}>
                {category.label} · {cards.length}
              </span>
              <div className={s.wikiPlaced}>
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={s.wikiChip}
                    data-testid="wiki-placed-card"
                    data-card={card.id}
                    data-dragging={dragging === card.id}
                    draggable
                    title="拖动换一个分类，或点一下再点分类"
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', card.id);
                      event.dataTransfer.effectAllowed = 'move';
                      startDrag(card.id);
                    }}
                    onDragEnd={endDrag}
                    onClick={(event) => {
                      if (selected && selected !== card.id) return;
                      event.stopPropagation();
                      select(card.id);
                    }}
                  >
                    <span className={s.chipHandle} aria-hidden>
                      ⠿
                    </span>
                    {card.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
