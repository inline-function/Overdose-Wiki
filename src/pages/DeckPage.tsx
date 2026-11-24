import { useState, type DragEvent } from 'react';
import { defaultDeck, validateDeck } from '../game/deck';
import { getCards } from '../content/registry';
import { SAMPLE_ENGINE_CARDS } from '../content/sample';
import { useGameStore } from '../game/store';
import { DrugBadge } from '../ui/drug/DrugBadge';
import { useT } from '../i18n';
import p from './pages.module.css';
import { cardName, cardSummary, drugClassLabel } from '../ui/drug/drugText';

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
  const tr = useT();
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
      setStatus(
        ownedCount(id) === 0 ? tr('deck.statusNotOwned') : tr('deck.statusAllInDeck'),
      );
      return;
    }
    if (ids.length >= 8) {
      setStatus(tr('deck.statusMax'));
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
    setStatus(tr('deck.statusFilled'));
  }

  function clearDeck() {
    setLocalDeck({});
  }

  function saveDeck() {
    setDeck(deck);
    setStatus(
      validation.ok ? tr('deck.statusSaved') : tr('deck.statusSavedInvalid'),
    );
  }

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('deck.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('deck.title')}</h1>
      <p className={p.articleMeta}>{tr('deck.meta', { n: String(ids.length) })}</p>

      <section
        className={p.deckShelf}
        aria-label={tr('deck.shelfAria')}
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
              aria-label={
                has
                  ? tr('deck.addAria', { name: cardName(card) })
                  : tr('deck.lockedAria', { name: cardName(card) })
              }
            >
              <span className={p.deckMeta}>
                <DrugBadge klass={card.klass} /> {drugClassLabel(card.klass)}
              </span>
              <span className={p.shelfName}>
                {has ? cardName(card) : tr('deck.notOwned')}
              </span>
              <span className={p.shelfSummary}>
                {has ? cardSummary(card) : tr('deck.obtainHint')}
              </span>
              {count > 0 && <span className={p.deckCount}>×{count}</span>}
              {has && ownedCount(card.id) > count && (
                <span className={p.small}>
                  {tr('deck.owned', { n: String(ownedCount(card.id)) })}
                </span>
              )}
            </button>
          );
        })}
      </section>

      <h2 className={p.pageTitle}>{tr('deck.deckTitle')}</h2>
      <section
        className={p.deckTray}
        aria-label={tr('deck.trayAria')}
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
                {tr('deck.emptySlot')}
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
              aria-label={tr('deck.removeAria', { name: cardName(card) })}
            >
              <DrugBadge klass={card.klass} />
              <span>{cardName(card)}</span>
            </button>
          );
        })}
      </section>

      <div className={p.deckCheck}>
        {validation.ok
          ? tr('deck.checkOk')
          : tr('deck.checkFail', { errors: validation.errors.join(' / ') })}
        <div className={p.settingsActions}>
          <button type="button" className={p.pixelButton} onClick={saveDeck}>
            {tr('deck.save')}
          </button>
          <button type="button" className={p.pixelButton} onClick={fillDefault}>
            {tr('deck.fill')}
          </button>
          <button type="button" className={p.pixelButton} onClick={clearDeck}>
            {tr('deck.clear')}
          </button>
        </div>
      </div>
    </article>
  );
}