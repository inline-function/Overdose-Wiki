import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale, useT } from '../i18n';
import { CARD_MAP, RARITY_META, STAGES } from '../dlc/content';
import { categoryKey, categoryIcon } from '../dlc/icons';
import { categoryOf, pick } from '../dlc/format';
import { DECK_SIZE, GACHA_COST, MAX_COPIES, deckValid, useDlcStore } from '../dlc/store';
import { UPGRADE_DEFS, computeStats, upgradeCost } from '../dlc/content';
import type { UpgradeTrack } from '../dlc/types';
import type { Card } from '../dlc/types';
import s from './Dlc.module.css';

function CardFace({ card, small }: { card: Card; small?: boolean }) {
  const locale = useLocale();
  const Icon = categoryIcon(categoryKey(card.tags) as never);
  const name = pick(card.name, locale);
  return (
    <div className={s.card} style={{ ['--rarity' as string]: RARITY_META[card.rarity].color, width: small ? 'calc(52 * var(--u))' : undefined, height: small ? 'calc(70 * var(--u))' : undefined }}>
      <Icon className={s.cardIcon} />
      <span className={`${s.cardName} ${name.length > 4 ? s.cardNameSmall : ''}`}>{name}</span>
      <span className={s.cardCat}>{pick(categoryOf(card), locale)}</span>
    </div>
  );
}

export function DlcShopPage() {
  const tr = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const save = useDlcStore((st) => st.save);
  const buyCard = useDlcStore((st) => st.buyCard);
  const buyUpgrade = useDlcStore((st) => st.buyUpgrade);
  const drawGacha = useDlcStore((st) => st.drawGacha);
  const decomposeCard = useDlcStore((st) => st.decomposeCard);
  const setDeck = useDlcStore((st) => st.setDeck);
  const [tab, setTab] = useState<'shop' | 'deck' | 'gacha' | 'upgrade'>('shop');
  const [lastDraw, setLastDraw] = useState<string | null>(null);
  const [drawKey, setDrawKey] = useState(0);
  const stage = STAGES[Math.min(7, Math.max(0, save.stage - 1))];

  const inDeck = (id: string) => save.deck.filter((x) => x === id).length;
  const addToDeck = (id: string) => {
    if (save.deck.length >= DECK_SIZE || inDeck(id) >= MAX_COPIES || inDeck(id) >= (save.collection[id] ?? 0)) return;
    setDeck([...save.deck, id]);
  };
  const removeFromDeck = (id: string) => {
    const i = save.deck.indexOf(id);
    if (i < 0) return;
    setDeck([...save.deck.slice(0, i), ...save.deck.slice(i + 1)]);
  };

  const collectionIds = Object.keys(save.collection).filter((id) => (save.collection[id] ?? 0) > 0 && CARD_MAP[id]);

  return (
    <div className={`${s.root} ${s.shop}`}>
      <div className={s.bg} style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets-private/bg/bg_dlc_night_market.png)` }} />
      <div className={s.bgTint} />
      <div className={s.vignette} />
      <div className={s.shopHead}>
        <button type="button" className={s.shopTab} data-on={tab === 'shop'} onClick={() => setTab('shop')}>{tr('dlc.shop')}</button>
        <button type="button" className={s.shopTab} data-on={tab === 'deck'} onClick={() => setTab('deck')}>{tr('dlc.deck')}</button>
        <button type="button" className={s.shopTab} data-on={tab === 'gacha'} onClick={() => setTab('gacha')}>{tr('dlc.gacha')}</button>
        <button type="button" className={s.shopTab} data-on={tab === 'upgrade'} onClick={() => setTab('upgrade')}>{tr('dlc.upgrade')}</button>
        <span className={s.shopCurrency}>{tr('dlc.currency')} {save.currency}</span>
        <button type="button" className={s.pixelBtn} data-variant="dark" onClick={() => navigate('/dlc')}>{tr('dlc.back')}</button>
      </div>
      <div className={s.shopBody}>
        {tab === 'shop' ? (
          <div className={s.shopGrid}>
            {stage.shop.map((id) => {
              const card = CARD_MAP[id];
              const cost = RARITY_META[card.rarity].cost;
              return (
                <div key={id} className={s.shopItem}>
                  <CardFace card={card} />
                  <span className={s.shopPrice}>{tr('dlc.currency')} {cost}</span>
                  <button type="button" className={s.miniBtn} disabled={save.currency < cost} onClick={() => buyCard(id)}>{tr('dlc.buy')}</button>
                </div>
              );
            })}
          </div>
        ) : tab === 'upgrade' ? (
          <div>
            <div className={s.upgradeStats}>
              {(() => { const st = computeStats(save.upgrades); return (
                <>
                  <span>{tr('dlc.phys')} <b>{st.maxPhys}</b></span>
                  <span>{tr('dlc.mental')} <b>{st.maxMental}</b></span>
                  <span>AP <b>{st.apPerTurn}</b>/{st.apCap}</span>
                  <span>{tr('dlc.draw')} <b>{st.drawPerTurn}</b></span>
                </>
              ); })()}
            </div>
            <div className={s.upgradeList}>
              {(['phys', 'mental', 'ap', 'apCap', 'draw'] as UpgradeTrack[]).map((track) => {
                const def = UPGRADE_DEFS[track];
                const level = save.upgrades?.[track] ?? 0;
                const maxed = level >= def.maxLevel;
                const cost = upgradeCost(track, level);
                const labelKey = `dlc.upgrade${track.charAt(0).toUpperCase()}${track.slice(1)}` as 'dlc.upgradePhys';
                return (
                  <div key={track} className={s.upgradeRow}>
                    <div className={s.upgradeInfo}>
                      <div className={s.upgradeName}>{tr(labelKey)} +{def.perLevel}</div>
                      <div className={s.upgradeLv}>{tr('dlc.upgradeLv', { n: String(level), max: String(def.maxLevel) })}</div>
                    </div>
                    <button type="button" className={`${s.miniBtn} ${s.upgradeBuy}`} disabled={maxed || save.currency < cost} onClick={() => buyUpgrade(track)}>
                      {maxed ? tr('dlc.upgradeMax') : `${tr('dlc.currency')} ${cost}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : tab === 'gacha' ? (
          <div className={s.gacha}>
            <div className={s.gachaHint}>{tr('dlc.gachaHint')}</div>
            <div className={s.gachaStage}>
              {lastDraw ? (
                <div key={drawKey} className={s.gachaReveal}>
                  <CardFace card={CARD_MAP[lastDraw]} />
                  <div className={s.gachaResult} style={{ color: RARITY_META[CARD_MAP[lastDraw].rarity].color }}>
                    {tr('dlc.gachaResult')} · {pick(RARITY_META[CARD_MAP[lastDraw].rarity].label, locale)}
                  </div>
                </div>
              ) : (
                <div className={s.gachaBack}>?</div>
              )}
            </div>
            <button
              type="button"
              className={s.pixelBtn}
              data-variant="amber"
              disabled={save.currency < GACHA_COST}
              onClick={() => { const id = drawGacha(); if (id) { setLastDraw(id); setDrawKey((k) => k + 1); } }}
            >
              {tr('dlc.gachaDraw')} · {tr('dlc.currency')} {GACHA_COST}
            </button>
            {save.currency < GACHA_COST && <div className={s.deckWarn}>{tr('dlc.gachaEmpty')}</div>}
          </div>
        ) : (
          <>
            <div className={s.deckBar}>
              <span className={s.deckCount}>{tr('dlc.deck')} {save.deck.length}/{DECK_SIZE}</span>
              {!deckValid(save.deck) && <span className={s.deckWarn}>{tr('dlc.deckInvalid')}</span>}
            </div>
            <div className={s.collectionGrid}>
              {collectionIds.map((id) => {
                const card = CARD_MAP[id];
                const owned = save.collection[id] ?? 0;
                const used = inDeck(id);
                return (
                  <div key={id} className={s.collectionItem}>
                    <CardFace card={card} small />
                    <span className={s.collectionCount}>
                      {tr('dlc.collection')} {owned} · <span className={s.inDeck}>{tr('dlc.deck')} {used}</span>
                    </span>
                    <div className={s.shopActions}>
                      <button type="button" className={s.miniBtn} disabled={save.deck.length >= DECK_SIZE || used >= MAX_COPIES || used >= owned} onClick={() => addToDeck(id)}>+</button>
                      <button type="button" className={s.miniBtn} disabled={used <= 0} onClick={() => removeFromDeck(id)}>−</button>
                      <button type="button" className={s.miniBtn} disabled={owned <= used} onClick={() => decomposeCard(id)}>{tr('dlc.decompose')}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
