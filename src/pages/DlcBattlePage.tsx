import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLocale, useT } from '../i18n';
import { audio } from '../audio/AudioManager';
import { AUDIO_MANIFEST } from '../audio/manifest';
import { useCue } from '../audio/useCue';
import { BATTLE_MAP, CARD_MAP, RARITY_META, STAGES, STATUS_INFO } from '../dlc/content';
import { categoryKey, categoryIcon, StatusIcon } from '../dlc/icons';
import { cardEffectLines, categoryOf, effectStatuses, pick, statusLabel } from '../dlc/format';
import { createBattle, endPlayerTurn, playerDraw, playerPlay, type BattleEvent, type BattleState, type Side } from '../dlc/engine';
import { useDlcStore } from '../dlc/store';
import type { Card, StatusId } from '../dlc/types';
import s from './Dlc.module.css';

const HERO = { x: 66, y: 96 };
const ENEMY = { x: 396, y: 96 };
const HAND = { x: 238, y: 182 };

type Fx = {
  id: number;
  kind: 'float' | 'fly' | 'flash' | 'spark';
  side?: Side;
  text?: string;
  tone?: string;
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  cardId?: string;
};

const AURA: Record<string, string> = {
  paper: 'rgba(232,224,204,0.5)',
  mirror: 'rgba(91,143,168,0.6)',
  shadow: 'rgba(122,90,168,0.6)',
  soft: 'rgba(217,143,155,0.55)',
  cup: 'rgba(217,164,65,0.55)',
  harukaze: 'rgba(226,80,47,0.6)',
};

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function DlcBattlePage() {
  const tr = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const save = useDlcStore((st) => st.save);
  const chooseReward = useDlcStore((st) => st.chooseReward);
  const recordWin = useDlcStore((st) => st.recordWin);

  const [searchParams] = useSearchParams();
  const requested = Number.parseInt(searchParams.get('stage') ?? '', 10);
  const stageNo = Math.min(save.stage, Math.max(1, Number.isFinite(requested) ? requested : save.stage));
  const stage = STAGES[stageNo - 1];
  const def = BATTLE_MAP[stage.battleId];
  useCue(def.bgm);

  const stateRef = useRef<BattleState | null>(null);
  if (!stateRef.current || stateRef.current.def.id !== def.id) {
    stateRef.current = createBattle(def, save.deck, Math.floor(Math.random() * 1e9));
  }
  const state = stateRef.current;
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ index: number; x: number; y: number } | null>(null);
  const [banner, setBanner] = useState<{ text: string; enemy: boolean; key: number } | null>(null);
  const bannerKey = useRef(0);
  const [fx, setFx] = useState<Fx[]>([]);
  const fxId = useRef(0);
  const [heroHit, setHeroHit] = useState(false);
  const [heroAttack, setHeroAttack] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [shake, setShake] = useState(false);
  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [statusTab, setStatusTab] = useState<Side>('player');
  const [detail, setDetail] = useState<Card | null>(null);
  const [detailStatus, setDetailStatus] = useState<StatusId | null>(null);
  const [rewardDone, setRewardDone] = useState(false);
  const recordedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const addFx = useCallback((f: Omit<Fx, 'id'>, life = 560) => {
    fxId.current += 1;
    const id = fxId.current;
    setFx((list) => [...list, { ...f, id }]);
    window.setTimeout(() => setFx((list) => list.filter((x) => x.id !== id)), life);
  }, []);

  const posOf = (side: Side) => (side === 'player' ? HERO : ENEMY);

  const applyFx = useCallback((e: BattleEvent) => {
    switch (e.kind) {
      case 'play': {
        const from = e.side === 'player' ? HAND : ENEMY;
        const to = posOf(e.target);
        addFx({ kind: 'fly', x: from.x - 26, y: from.y - 35, dx: to.x - from.x, dy: to.y - from.y, cardId: e.cardId }, 260);
        if (e.side === 'player') { setHeroAttack(true); window.setTimeout(() => setHeroAttack(false), 300); }
        audio.playSfx(AUDIO_MANIFEST.sfx.card);
        const card = CARD_MAP[e.cardId];
        if (card) setLog(`${pick(card.name, locale)} → ${e.target === 'player' ? tr('dlc.statusPlayer') : pick(def.enemyName, locale)}`);
        break;
      }
      case 'damage': {
        const p = posOf(e.side);
        addFx({ kind: 'float', side: e.side, text: `-${e.amount}`, tone: e.heavy ? s.floatHeavy : '', x: p.x - 8 + Math.random() * 12, y: p.y - 20 });
        if (e.side === 'player') { setHeroHit(true); window.setTimeout(() => setHeroHit(false), 130); }
        else { setEnemyHit(true); window.setTimeout(() => setEnemyHit(false), 130); }
        addFx({ kind: 'spark', x: p.x - 8, y: p.y - 8 }, 220);
        if (e.amount >= 4) { setShake(true); window.setTimeout(() => setShake(false), 130); }
        audio.playSfx(AUDIO_MANIFEST.sfx.stamp);
        break;
      }
      case 'heal': {
        const p = posOf(e.side);
        addFx({ kind: 'float', side: e.side, text: `+${e.amount}`, tone: s.floatHeal, x: p.x - 6, y: p.y - 24 });
        break;
      }
      case 'status': {
        const p = posOf(e.side);
        addFx({ kind: 'float', side: e.side, text: `${STATUS_INFO[e.status].short}+${e.amount}`, tone: s.floatStatus, x: p.x - 10, y: p.y - 34 }, 700);
        break;
      }
      case 'burst': {
        addFx({ kind: 'flash', x: 0, y: 0 }, 180);
        addFx({ kind: 'float', text: tr('dlc.burst'), tone: s.floatHeavy, x: 200, y: 70 }, 700);
        setShake(true); window.setTimeout(() => setShake(false), 160);
        audio.playSfx(AUDIO_MANIFEST.sfx.stamp);
        audio.playSfx(AUDIO_MANIFEST.sfx.turn);
        break;
      }
      case 'immune': {
        const p = posOf(e.side);
        addFx({ kind: 'float', side: e.side, text: tr('dlc.immune'), tone: s.floatImmune, x: p.x - 10, y: p.y - 24 });
        break;
      }
      case 'sleep': {
        const p = posOf(e.side);
        addFx({ kind: 'float', side: e.side, text: tr('dlc.sleep'), tone: s.floatStatus, x: p.x - 10, y: p.y - 24 });
        break;
      }
      case 'log':
        setLog(pick(e.text, locale));
        break;
      case 'turn': {
        const text = e.side === 'player' ? tr('dlc.yourTurn') : tr('dlc.enemyTurn');
        setLog(text);
        bannerKey.current += 1;
        setBanner({ text, enemy: e.side === 'enemy', key: bannerKey.current });
        window.setTimeout(() => setBanner((b) => (b && b.key === bannerKey.current ? null : b)), 720);
        if (e.side === 'player') addFx({ kind: 'float', text: '+3 AP', tone: s.floatStatus, x: HERO.x - 10, y: HERO.y - 40 }, 600);
        audio.playSfx(AUDIO_MANIFEST.sfx.turn);
        break;
      }
      case 'draw':
        if (e.side === 'player') addFx({ kind: 'float', text: tr('dlc.draw'), tone: s.floatStatus, x: HAND.x + 60, y: HAND.y - 30 }, 500);
        break;
      case 'ap':
        if (e.amount > 0) addFx({ kind: 'float', text: `+${e.amount} AP`, tone: s.floatStatus, x: HERO.x - 10, y: HERO.y - 40 }, 600);
        break;
      default:
        break;
    }
  }, [addFx, locale, tr, def]);

  const runEvents = useCallback((events: BattleEvent[]) => {
    let delay = 0;
    for (const e of events) {
      window.setTimeout(() => applyFx(e), delay);
      if (e.kind === 'play') delay += 240;
      else if (e.kind === 'damage' || e.kind === 'burst') delay += 110;
      else delay += 30;
    }
    refresh();
    if (events.length > 0) {
      setBusy(true);
      window.setTimeout(() => { setBusy(false); refresh(); }, delay + 120);
    }
  }, [applyFx, refresh]);

  // 胜利记录（一次性）
  useEffect(() => {
    if (state.outcome === 'win' && !recordedRef.current) {
      recordedRef.current = true;
      recordWin(stage.id, def.id);
      audio.playSfx(AUDIO_MANIFEST.sfx.stamp);
    }
  }, [state.outcome, recordWin, stage.id, def.id]);

  const canAct = state.outcome === 'ongoing' && state.active === 'player' && !busy;
  const ap = state.player.ap;

  const playAt = (target: Side) => {
    if (selected === null || !canAct || ap <= 0) return;
    const events = playerPlay(state, selected, target);
    setSelected(null);
    runEvents(events);
  };

  const onEndTurn = () => {
    if (!canAct) return;
    setSelected(null);
    runEvents(endPlayerTurn(state));
  };

  const onDraw = () => {
    if (!canAct || ap <= 0) return;
    runEvents(playerDraw(state));
  };

  // 长按详情
  const pressTimer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);
  const pressRef = useRef<{ index: number; x: number; y: number; moved: boolean } | null>(null);
  const onCardDown = (e: RPointerEvent<HTMLButtonElement>, index: number) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pressRef.current = { index, x: e.clientX, y: e.clientY, moved: false };
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setDetail(CARD_MAP[state.player.hand[index]] ?? null);
    }, 350);
  };
  const onCardMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const p = pressRef.current;
    if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) {
      p.moved = true;
      window.clearTimeout(pressTimer.current);
    }
    if (p.moved) {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const u = rect.width / 476;
        setDrag({ index: p.index, x: (e.clientX - rect.left) / u, y: (e.clientY - rect.top) / u });
      }
    }
  };
  const onCardUp = (e: RPointerEvent<HTMLButtonElement>, index: number) => {
    window.clearTimeout(pressTimer.current);
    const p = pressRef.current;
    pressRef.current = null;
    if (longPressed.current) { setDrag(null); return; }
    if (p?.moved) {
      setDrag(null);
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const target: Side | null = el?.closest('[data-testid="dlc-enemy"]') ? 'enemy' : el?.closest('[data-testid="dlc-hero"]') ? 'player' : null;
      if (target && canAct && ap > 0) runEvents(playerPlay(state, index, target));
      return;
    }
    if (canAct && ap > 0) setSelected((cur) => (cur === index ? null : index));
  };

  const restart = () => {
    stateRef.current = createBattle(def, useDlcStore.getState().save.deck, Math.floor(Math.random() * 1e9));
    recordedRef.current = false;
    setRewardDone(false);
    setSelected(null);
    setFx([]);
    refresh();
  };

  const pickReward = (cardId: string) => {
    if (rewardDone) return;
    chooseReward(cardId);
    setRewardDone(true);
    audio.playSfx(AUDIO_MANIFEST.sfx.click);
    window.setTimeout(() => navigate(save.stage >= 8 ? '/dlc/ending' : '/dlc'), 500);
  };

  const player = state.player;
  const enemy = state.enemy;
  const statusCount = (side: Side) => Object.values(side === 'player' ? player.statuses : enemy.statuses).filter((v) => v > 0).length;

  const renderBar = (value: number, max: number, cls: string) => (
    <div className={`${s.bar} ${cls}`}>
      <div className={s.barFill} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );

  const handCards = player.hand.map((id, i) => {
    const card = CARD_MAP[id];
    if (!card) return null;
    const rarity = RARITY_META[card.rarity];
    const Icon = categoryIcon(categoryKey(card.tags) as never);
    const name = pick(card.name, locale);
    const small = name.length > 4;
    return (
      <button
        key={`${id}-${i}`}
        type="button"
        data-testid="dlc-card"
        className={s.card}
        style={{ ['--rarity' as string]: rarity.color }}
        data-selected={selected === i}
        data-disabled={ap <= 0 || !canAct}
        onPointerDown={(ev) => onCardDown(ev, i)}
        onPointerMove={onCardMove}
        onPointerUp={(ev) => onCardUp(ev, i)}
        onContextMenu={(ev) => { ev.preventDefault(); setDetail(card); }}
        aria-label={name}
      >
        <Icon className={s.cardIcon} />
        <span className={`${s.cardName} ${small ? s.cardNameSmall : ''}`}>{name}</span>
        <span className={s.cardCat}>{pick(categoryOf(card), locale)}</span>
      </button>
    );
  });

  const statusList = (side: Side) => {
    const c = side === 'player' ? player : enemy;
    const entries = (Object.keys(c.statuses) as StatusId[]).filter((k) => c.statuses[k] > 0);
    if (entries.length === 0) return <div className={s.statusEmpty}>{tr('dlc.noStatus')}</div>;
    return entries.map((k) => (
      <button key={k} type="button" className={s.statusRow} onClick={() => setDetailStatus(k)}>
        <StatusIcon status={k} className={s.statusRowIcon} />
        <span className={s.statusRowBody}>
          <span className={s.statusRowTop}>
            <span className={s.statusRowName}>{statusLabel(k, locale)}</span>
            <span className={s.statusRowLayers}>×{c.statuses[k]}</span>
          </span>
          <span className={s.statusRowDesc}>{pick(STATUS_INFO[k].description, locale)}</span>
        </span>
      </button>
    ));
  };

  return (
    <div className={s.root} ref={rootRef} data-shake={shake}>
      <div className={s.bg} style={{ backgroundImage: `url(${asset(`assets-private/bg/${def.bg}.png`)})` }} />
      <div className={s.bgTint} />
      <div className={s.ground} />
      <div className={s.dust}><i /><i /><i /><i /></div>
      <div className={s.vignette} />

      {/* 立绘 */}
      <div className={s.heroWrap} data-testid="dlc-hero" data-phase2={state.phase2} data-hit={heroHit} data-attack={heroAttack} data-victory={state.outcome === 'win'} data-target={selected !== null || drag !== null} onClick={() => playAt('player')}>
        <div className={s.shadow} />
        <img className={s.hero} src={asset('assets-private/dlc/harukaze_boss.png')} alt={tr('dlc.statusPlayer')} />
        <div className={s.heroGlow} />
        {(selected !== null || drag !== null) && <div className={s.reticle} />}
      </div>
      <div className={s.enemyWrap} data-testid="dlc-enemy" style={{ ['--aura' as string]: AURA[def.sprite] }} data-hit={enemyHit} data-dead={state.outcome === 'win'} data-target={selected !== null || drag !== null} onClick={() => playAt('enemy')}>
        <div className={s.enemyAura} />
        <div className={s.shadow} />
        <img className={s.enemy} src={asset(`assets-private/dlc/${def.portrait}.png`)} alt={pick(def.enemyName, locale)} />
        {(selected !== null || drag !== null) && <div className={s.reticle} />}
      </div>

      {/* HUD */}
      <div className={s.hudTop}>
        <div className={s.panel}>
          <div className={s.name}>{tr('dlc.statusPlayer')}{state.phase2 && <span className={s.phaseTag}> · {tr('dlc.phase2')}</span>}</div>
          {renderBar(player.phys, player.maxPhys, s.barPhys)}
          {renderBar(player.mental, player.maxMental, s.barMental)}
          <div className={s.barMeta}><span>{tr('dlc.phys')} {player.phys}</span><span>{tr('dlc.mental')} {player.mental}</span></div>
          {renderBar(player.statuses.serotonin, 30, s.barSero)}
        </div>
        <div className={`${s.panel} ${s.panelRight}`}>
          <div className={s.name}>{pick(def.enemyName, locale)}</div>
          <div className={s.epithet}>{pick(def.epithet, locale)}</div>
          {renderBar(enemy.phys, enemy.maxPhys, s.barPhys)}
          {renderBar(enemy.mental, enemy.maxMental, s.barMental)}
          <div className={s.barMeta}><span>{tr('dlc.phys')} {enemy.phys}</span><span>{tr('dlc.mental')} {enemy.mental}</span></div>
          {renderBar(enemy.statuses.serotonin, 30, s.barSero)}
        </div>
      </div>
      <div className={s.turnBadge}>
        {tr('dlc.turn', { n: String(state.turn) })}
        <div className={s.apRow}>
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className={s.apPip} data-on={i < ap} />)}
        </div>
      </div>
      {log && <div className={s.log}>{log}</div>}

      {/* 手牌 */}
      <div className={s.hand} data-testid="dlc-hand">
        {handCards}
        <button type="button" className={`${s.card} ${s.drawCard}`} data-disabled={ap <= 0 || !canAct} onClick={onDraw} aria-label={tr('dlc.draw')}>
          <span className={s.drawPlus}>+</span>
          <span className={s.drawLabel}>{tr('dlc.draw')}</span>
        </button>
      </div>
      {(selected !== null || drag !== null) && <div className={s.hint}>{tr('dlc.targetSelf')} / {tr('dlc.targetEnemy')}</div>}

      <button type="button" className={`${s.pixelBtn} ${s.statusBtn}`} data-variant="dark" onClick={() => setShowStatus(true)}>
        {tr('dlc.status')}<span className={s.badge}>{statusCount('player') + statusCount('enemy')}</span>
      </button>
      <button type="button" className={`${s.pixelBtn} ${s.endTurn}`} data-variant="amber" data-pulse={ap === 0 && canAct} disabled={!canAct} onClick={onEndTurn}>
        {tr('dlc.endTurn')}
      </button>

      {/* 反馈层 */}
      {fx.map((f) => {
        if (f.kind === 'flash') return <div key={f.id} className={s.burstFlash} />;
        if (f.kind === 'spark') return <div key={f.id} className={s.spark} style={{ left: `calc(${f.x} * var(--u))`, top: `calc(${f.y} * var(--u))` }} />;
        if (f.kind === 'fly') {
          const card = f.cardId ? CARD_MAP[f.cardId] : null;
          const Icon = card ? categoryIcon(categoryKey(card.tags) as never) : null;
          return (
            <div key={f.id} className={s.flyCard} style={{ left: `calc(${f.x} * var(--u))`, top: `calc(${f.y} * var(--u))`, ['--dx' as string]: `calc(${f.dx} * var(--u))`, ['--dy' as string]: `calc(${f.dy} * var(--u))`, ['--rarity' as string]: card ? RARITY_META[card.rarity].color : undefined }}>
              {Icon && <Icon />}
            </div>
          );
        }
        return <div key={f.id} className={`${s.float} ${f.tone ?? ''}`} style={{ left: `calc(${f.x} * var(--u))`, top: `calc(${f.y} * var(--u))` }}>{f.text}</div>;
      })}

      {drag && (() => {
        const card = CARD_MAP[state.player.hand[drag.index]];
        if (!card) return null;
        const Icon = categoryIcon(categoryKey(card.tags) as never);
        return (
          <div className={s.dragGhost} style={{ left: `calc(${drag.x - 26} * var(--u))`, top: `calc(${drag.y - 34} * var(--u))`, ['--rarity' as string]: RARITY_META[card.rarity].color }}>
            <Icon />
            <span>{pick(card.name, locale)}</span>
          </div>
        );
      })()}
      {banner && <div key={banner.key} className={s.turnBanner} data-enemy={banner.enemy}>{banner.text}</div>}

      {/* 状态列表 */}
      {showStatus && (
        <div className={s.statusPanel}>
          <div className={s.statusHead}>
            <div className={s.statusTabs}>
              <button type="button" className={s.statusTab} data-on={statusTab === 'player'} onClick={() => setStatusTab('player')}>{tr('dlc.statusPlayer')}</button>
              <button type="button" className={s.statusTab} data-on={statusTab === 'enemy'} onClick={() => setStatusTab('enemy')}>{tr('dlc.statusEnemy')}</button>
            </div>
            <button type="button" className={s.miniBtn} onClick={() => setShowStatus(false)}>×</button>
          </div>
          <div className={s.statusList}>{statusList(statusTab)}</div>
        </div>
      )}

      {/* 卡牌详情 */}
      {detail && (
        <div className={s.overlay} onClick={() => setDetail(null)}>
          <div className={s.detailCard} style={{ ['--rarity' as string]: RARITY_META[detail.rarity].color }} onClick={(e) => e.stopPropagation()}>
            <div className={s.detailHead}>
              {(() => { const Icon = categoryIcon(categoryKey(detail.tags) as never); return <Icon className={s.detailIcon} />; })()}
              <div>
                <div className={s.detailName}>{pick(detail.name, locale)}</div>
                <div className={s.detailCat}>{pick(categoryOf(detail), locale)}</div>
                <div className={s.detailRarity}>{pick(RARITY_META[detail.rarity].label, locale)}</div>
              </div>
            </div>
            <div className={s.detailEffects}>
              {cardEffectLines(detail, locale).map((line, i) => (
                <div key={i} className={s.detailEffect}>
                  {effectStatuses(detail).length > 0
                    ? line.split(new RegExp(`(${effectStatuses(detail).map((k) => statusLabel(k, locale)).join('|')})`)).map((part, j) => {
                        const hit = effectStatuses(detail).find((k) => statusLabel(k, locale) === part);
                        return hit ? <span key={j} className={s.statusLink} onClick={() => setDetailStatus(hit)}>{part}</span> : <span key={j}>{part}</span>;
                      })
                    : line}
                </div>
              ))}
            </div>
            <button type="button" className={`${s.pixelBtn} ${s.detailClose}`} data-variant="dark" onClick={() => setDetail(null)}>×</button>
          </div>
        </div>
      )}

      {/* 状态说明 */}
      {detailStatus && (
        <div className={s.overlay} onClick={() => setDetailStatus(null)}>
          <div className={s.statusPop} onClick={(e) => e.stopPropagation()}>
            <div className={s.statusPopName}>{statusLabel(detailStatus, locale)}</div>
            <div className={s.statusPopDesc}>{pick(STATUS_INFO[detailStatus].description, locale)}</div>
            <button type="button" className={`${s.pixelBtn} ${s.detailClose}`} data-variant="dark" onClick={() => setDetailStatus(null)}>×</button>
          </div>
        </div>
      )}

      {/* 结果 */}
      {state.outcome !== 'ongoing' && (
        <div className={s.overlay}>
          <div className={s.resultBox}>
            <div className={s.resultStamp} data-lose={state.outcome === 'lose'}>{state.outcome === 'win' ? tr('dlc.win') : tr('dlc.lose')}</div>
            <div className={s.resultLine}>{pick(state.outcome === 'win' ? def.win : def.lose, locale)}</div>
            {state.outcome === 'win' ? (
              <>
                <div className={s.detailCat}>{tr('dlc.rewardHint')}</div>
                <div className={s.rewardRow}>
                  {stage.rewards.map((id) => {
                    const card = CARD_MAP[id];
                    const Icon = categoryIcon(categoryKey(card.tags) as never);
                    return (
                      <button key={id} type="button" className={`${s.card} ${s.rewardCard}`} style={{ ['--rarity' as string]: RARITY_META[card.rarity].color }} disabled={rewardDone} onClick={() => pickReward(id)}>
                        <Icon className={s.cardIcon} />
                        <span className={`${s.cardName} ${pick(card.name, locale).length > 4 ? s.cardNameSmall : ''}`}>{pick(card.name, locale)}</span>
                        <span className={s.cardCat}>{pick(categoryOf(card), locale)}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={s.shopActions}>
                <button type="button" className={s.pixelBtn} data-variant="amber" onClick={restart}>{tr('dlc.retry')}</button>
                <button type="button" className={s.pixelBtn} data-variant="dark" onClick={() => navigate('/dlc')}>{tr('dlc.back')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
