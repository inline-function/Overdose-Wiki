import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../content/registry';
import { SAMPLE_ENGINE_CARDS } from '../content/sample';
import { useGameStore } from '../game/store';
import { DrugBadge } from '../ui/drug/DrugBadge';
import p from './pages.module.css';
import { cardName, cardSummary, drugClassLabel } from '../ui/drug/drugText';
import { useT } from '../i18n';

const ODDS: Array<[string, number]> = [
  ['other', 15],
  ['otc', 40],
  ['rx', 30],
  ['c2', 10],
  ['c1', 2.5],
  ['narcotic', 2.5],
];

export function BoxesPage() {
  const tr = useT();
  const save = useGameStore((state) => state.save);
  const claimBox = useGameStore((state) => state.claimBox);
  const allCards = getCards();
  const cards = (allCards.length ? allCards : SAMPLE_ENGINE_CARDS).filter(
    (card) => !card.storyOnly,
  );
  const ownedCount = (id: string) => save.ownedCards[id] ?? 0;
  const kinds = cards.filter((card) => ownedCount(card.id) > 0).length;
  const totalOwned = cards.reduce((sum, card) => sum + ownedCount(card.id), 0);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const resultCard = result ? cards.find((card) => card.id === result) : undefined;

  function open() {
    if (save.boxes <= 0) {
      setMessage(tr('boxes.insufficient'));
      return;
    }
    let roll = Math.random() * 100;
    let klass = 'other';
    for (const [candidate, chance] of ODDS) {
      roll -= chance;
      if (roll <= 0) {
        klass = candidate;
        break;
      }
    }
    let pool = cards.filter((card) => card.klass === klass);
    if (!pool.length) pool = cards;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    claimBox(picked.id);
    setResult(picked.id);
    setMessage('');
  }

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('boxes.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('boxes.title')}</h1>
      <p className={p.p}>{tr('boxes.intro')}</p>
      <div className={p.questPanel}>
        <p className={p.small}>
          {tr('boxes.held', { n: save.boxes, kinds, cards: cards.length, total: totalOwned })}
        </p>
        <div className={p.inline}>
          <button type="button" className={p.pixelButton} onClick={open} disabled={save.boxes <= 0}>
            {tr('boxes.open')}
          </button>
          <Link className={p.pixelButton} to="/deck">
            {tr('boxes.toDeck')}
          </Link>
        </div>
        {message && <p className={p.noticeBox}>{message}</p>}
        {resultCard && (
          <p className={p.p}>
            {tr('boxes.opened', {
              name: cardName(resultCard),
              count: ownedCount(resultCard.id),
              summary: cardSummary(resultCard),
            })}{' '}
            <DrugBadge klass={resultCard.klass} />
          </p>
        )}
      </div>

      <h2 className={p.pageTitle}>{tr('boxes.codex')}</h2>
      <section className={p.deckShelf} aria-label={tr('boxes.codexAria')}>
        {cards.map((card) => {
          const count = ownedCount(card.id);
          const has = count > 0;
          return (
            <div key={card.id} className={p.shelfCard} data-locked={!has}>
              <span className={p.deckMeta}>
                <DrugBadge klass={card.klass} /> {drugClassLabel(card.klass)}
              </span>
              <span className={p.shelfName}>{has ? cardName(card) : tr('boxes.notOwned')}</span>
              <span className={p.shelfSummary}>{has ? cardSummary(card) : tr('boxes.obtainHint')}</span>
              {has && <span className={p.deckCount}>×{count}</span>}
            </div>
          );
        })}
      </section>
      <p className={p.versionLine}>
        {tr('boxes.odds')}
      </p>
    </article>
  );
}