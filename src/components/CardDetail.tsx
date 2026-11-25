// 共享卡牌详情浮层 + 长按 hook。战斗之外的场景（商店/收藏/抽卡）复用。
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useLocale } from '../i18n';
import { RARITY_META, STATUS_INFO } from '../dlc/content';
import { categoryKey, categoryIcon } from '../dlc/icons';
import { cardEffectLines, categoryOf, effectStatuses, pick, statusLabel } from '../dlc/format';
import type { Card, StatusId } from '../dlc/types';
import s from '../pages/Dlc.module.css';

export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const clear = () => window.clearTimeout(timer.current);
  return {
    onPointerDown: () => {
      fired.current = false;
      timer.current = window.setTimeout(() => { fired.current = true; onLongPress(); }, 350);
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: RPointerEvent<HTMLElement> | React.MouseEvent) => { e.preventDefault(); onLongPress(); },
    longPressed: fired,
  };
}

export function CardDetailOverlay({ card, onClose }: { card: Card; onClose: () => void }) {
  const locale = useLocale();
  const [statusPop, setStatusPop] = useState<StatusId | null>(null);
  const Icon = categoryIcon(categoryKey(card.tags) as never);
  const statuses = effectStatuses(card);
  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.detailCard} style={{ ['--rarity' as string]: RARITY_META[card.rarity].color }} onClick={(e) => e.stopPropagation()}>
        <div className={s.detailHead}>
          <Icon className={s.detailIcon} />
          <div>
            <div className={s.detailName}>{pick(card.name, locale)}</div>
            <div className={s.detailCat}>{pick(categoryOf(card), locale)}</div>
            <div className={s.detailRarity}>{pick(RARITY_META[card.rarity].label, locale)}</div>
          </div>
        </div>
        <div className={s.detailEffects}>
          {cardEffectLines(card, locale).map((line, i) => (
            <div key={i} className={s.detailEffect}>
              {statuses.length > 0
                ? line.split(new RegExp(`(${statuses.map((k) => statusLabel(k, locale)).join('|')})`)).map((part, j) => {
                    const hit = statuses.find((k) => statusLabel(k, locale) === part);
                    return hit ? <span key={j} className={s.statusLink} onClick={() => setStatusPop(hit)}>{part}</span> : <span key={j}>{part}</span>;
                  })
                : line}
            </div>
          ))}
        </div>
        <button type="button" className={`${s.pixelBtn} ${s.detailClose}`} data-variant="dark" onClick={onClose}>×</button>
      </div>
      {statusPop && (
        <div className={s.overlay} onClick={(e) => { e.stopPropagation(); setStatusPop(null); }}>
          <div className={s.statusPop} onClick={(e) => e.stopPropagation()}>
            <div className={s.statusPopName}>{statusLabel(statusPop, locale)}</div>
            <div className={s.statusPopDesc}>{pick(STATUS_INFO[statusPop].description, locale)}</div>
            <button type="button" className={`${s.pixelBtn} ${s.detailClose}`} data-variant="dark" onClick={() => setStatusPop(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}
