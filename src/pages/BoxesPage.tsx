import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../content/registry';
import { SAMPLE_ENGINE_CARDS } from '../content/sample';
import { useGameStore } from '../game/store';
import { DrugBadge } from '../ui/drug/DrugBadge';
import p from './pages.module.css';

const ODDS: Array<[string, number]> = [
  ['other', 15],
  ['otc', 40],
  ['rx', 30],
  ['c2', 10],
  ['c1', 2.5],
  ['narcotic', 2.5],
];

export function BoxesPage() {
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
      setMessage('药盒不足。');
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
      <p className={p.kicker}>药房 / 药盒</p>
      <h1 className={p.pageTitle}>药盒</h1>
      <p className={p.p}>
        特殊资源。首次阅读支线 +1。开启后按分级概率获得一张未拥有的药卡。
      </p>
      <div className={p.questPanel}>
        <p className={p.small}>
          持有药盒：<strong>{save.boxes}</strong> · 已收集：{kinds}/{cards.length} 种 · 共 {totalOwned} 张
        </p>
        <div className={p.inline}>
          <button type="button" className={p.pixelButton} onClick={open} disabled={save.boxes <= 0}>
            开启一个药盒
          </button>
          <Link className={p.pixelButton} to="/deck">
            去药箱配牌
          </Link>
        </div>
        {message && <p className={p.noticeBox}>{message}</p>}
        {resultCard && (
          <p className={p.p}>
            开出：<DrugBadge klass={resultCard.klass} /> {resultCard.name} ×{ownedCount(resultCard.id)} · {resultCard.summary}
          </p>
        )}
      </div>

      <h2 className={p.pageTitle}>图鉴</h2>
      <section className={p.deckShelf} aria-label="药品图鉴">
        {cards.map((card) => {
          const count = ownedCount(card.id);
          const has = count > 0;
          return (
            <div key={card.id} className={p.shelfCard} data-locked={!has}>
              <span className={p.deckMeta}>
                <DrugBadge klass={card.klass} /> {card.category}
              </span>
              <span className={p.shelfName}>{has ? card.name : '未获得'}</span>
              <span className={p.shelfSummary}>{has ? card.summary : '通过药盒获得'}</span>
              {has && <span className={p.deckCount}>×{count}</span>}
            </div>
          );
        })}
      </section>
      <p className={p.versionLine}>
        概率：其他 15% / OTC 40% / Rx 30% / 精二 10% / 精一或麻醉 5%。重复药品会叠加数量；不会开出剧情专用卡。
      </p>
    </article>
  );
}