import { useState, type DragEvent } from 'react';
import { defaultDeck, validateDeck } from '../game/deck';
import { getCards } from '../content/registry';
import { SAMPLE_ENGINE_CARDS } from '../content/sample';
import { useGameStore } from '../game/store';
import { DrugBadge } from '../ui/drug/DrugBadge';
import p from './pages.module.css';

function trimDeck(deck: Record<string, number>, max = 8): Record<string, number> {
  const next: Record<string, number> = {};
  let count = 0;
  for (const [id, value] of Object.entries(deck)) {
    if (count >= max) break;
    const take = Math.min(value, max - count);
    if (take > 0) next[id] = take;
    count += take;
  }
  return next;
}

export function DeckPage() {
  const contentCards = getCards();
  const cards = (contentCards.length > 0 ? contentCards : SAMPLE_ENGINE_CARDS).filter(
    (card) => !card.storyOnly,
  );
  const save = useGameStore((state) => state.save);
  const setDeck = useGameStore((state) => state.setDeck);
  const setStatus = useGameStore((state) => state.setStatus);
  const ownedCount = (id: string) => save.ownedCards[id] ?? 0;
  const [deck, setLocalDeck] = useState<Record<string, number>>(() => {
    const trimmed = trimDeck(save.deck);
    return Object.fromEntries(
      Object.entries(trimmed).filter(([id, count]) => count <= ownedCount(id) && count > 0),
    );
  });
  const [dragOver, setDragOver] = useState<'shelf' | 'tray' | null>(null);
  const ids = Object.entries(deck).flatMap(([id, count]) =>
    Array.from({ length: count }, () => id),
  );
  const validation = validateDeck(ids, cards);

  function add(id: string) {
    if (ownedCount(id) <= (deck[id] ?? 0)) {
      setStatus(ownedCount(id) === 0 ? '尚未获得这张药卡。打开药盒后再加入牌组。' : '持有的份数已经全部放进牌组。');
      return;
    }
    if (ids.length >= 8) {
      setStatus('牌组最多 8 张。');
      return;
    }
    setLocalDeck({ ...deck, [id]: (deck[id] ?? 0) + 1 });
  }

  function remove(id: string) {
    const copy = deck[id] ?? 0;
    if (copy <= 0) return;
    const next = { ...deck };
    if (copy === 1) delete next[id];
    else next[id] = copy - 1;
    setLocalDeck(next);
  }

  function dragShelf(event: DragEvent, id: string) {
    event.dataTransfer.setData('text/plain', `shelf:${id}`);
    event.dataTransfer.effectAllowed = 'copy';
  }

  function dragSlot(event: DragEvent, id: string) {
    event.dataTransfer.setData('text/plain', `deck:${id}`);
    event.dataTransfer.effectAllowed = 'move';
  }

  function dropOnShelf(event: DragEvent) {
    event.preventDefault();
    const [kind, id] = event.dataTransfer.getData('text/plain').split(':');
    if (kind === 'deck' && id) remove(id);
    setDragOver(null);
  }

  function dropOnTray(event: DragEvent) {
    event.preventDefault();
    const [kind, id] = event.dataTransfer.getData('text/plain').split(':');
    if (kind === 'shelf' && id) add(id);
    setDragOver(null);
  }

  function fillDefault() {
    const next: Record<string, number> = {};
    defaultDeck(cards)
      .filter((id) => ownedCount(id) > 0)
      .forEach((id) => {
      next[id] = (next[id] ?? 0) + 1;
    });
    setLocalDeck(trimDeck(next));
    setStatus('已填入默认 8 张牌组。');
  }

  function clearDeck() {
    setLocalDeck({});
  }

  function saveDeck() {
    setDeck(deck);
    setStatus(validation.ok ? '牌组已保存。' : '牌组已保存，但构筑校验未通过。');
  }

  return (
    <article className={p.page}>
      <p className={p.kicker}>药箱 / 构筑</p>
      <h1 className={p.pageTitle}>药箱</h1>
      <p className={p.articleMeta}>
        {ids.length} / 8 张 · 点击药箱或拖进下方牌组加入 · 点击牌组或拖回药箱移除
      </p>

      <section
        className={p.deckShelf}
        aria-label="药箱"
        data-dragover={dragOver === 'shelf'}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver('shelf');
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragOver((current) => (current === 'shelf' ? null : current));
        }}
        onDrop={dropOnShelf}
      >
        {cards.map((card) => {
          const count = deck[card.id] ?? 0;
          const has = ownedCount(card.id) > 0;
          return (
            <button
              key={card.id}
              type="button"
              className={p.shelfCard}
              data-locked={!has}
              draggable={has}
              onDragStart={(event) => dragShelf(event, card.id)}
              onClick={() => add(card.id)}
              disabled={!has}
              aria-label={has ? `${card.name}，加入牌组` : `${card.name}，尚未获得`}
            >
              <span className={p.deckMeta}>
                <DrugBadge klass={card.klass} /> {card.category}
              </span>
              <span className={p.shelfName}>{has ? card.name : '未获得'}</span>
              <span className={p.shelfSummary}>{has ? card.summary : '通过药盒获得'}</span>
              {count > 0 && <span className={p.deckCount}>×{count}</span>}
              {has && ownedCount(card.id) > count && (
                <span className={p.small}>持有 {ownedCount(card.id)}</span>
              )}
            </button>
          );
        })}
      </section>

      <h2 className={p.pageTitle}>牌组</h2>
      <section
        className={p.deckTray}
        aria-label="当前牌组"
        data-dragover={dragOver === 'tray'}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver('tray');
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragOver((current) => (current === 'tray' ? null : current));
        }}
        onDrop={dropOnTray}
      >
        {Array.from({ length: 8 }, (_, index) => {
          const id = ids[index];
          const card = id ? cards.find((item) => item.id === id) : undefined;
          if (!card) {
            return (
              <div key={`empty-${index}`} className={p.deckSlot} data-empty="true">
                空
              </div>
            );
          }
          return (
            <button
              key={`${id}-${index}`}
              type="button"
              className={p.deckSlot}
              draggable
              onDragStart={(event) => dragSlot(event, card.id)}
              onClick={() => remove(card.id)}
              aria-label={`从牌组移除 ${card.name}`}
            >
              <DrugBadge klass={card.klass} />
              <span>{card.name}</span>
            </button>
          );
        })}
      </section>

      <div className={p.deckCheck}>
        {validation.ok ? '构筑校验：通过。' : `构筑校验：${validation.errors.join('；')}`}
        <div className={p.settingsActions}>
          <button type="button" className={p.pixelButton} onClick={saveDeck}>
            保存牌组
          </button>
          <button type="button" className={p.pixelButton} onClick={fillDefault}>
            填入默认 8 张
          </button>
          <button type="button" className={p.pixelButton} onClick={clearDeck}>
            清空
          </button>
        </div>
      </div>
    </article>
  );
}