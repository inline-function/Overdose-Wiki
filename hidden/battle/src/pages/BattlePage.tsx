import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getBattle, getCards, getDrug, getDrugs } from '../content/registry';
import {
  SAMPLE_BATTLE,
  SAMPLE_DRUGS,
  SAMPLE_ENGINE_CARDS,
  SAMPLE_FIXED_BATTLE,
  SAMPLE_FIXED_CARDS,
} from '../content/sample';
import {
  AP_CAP,
  createBattle,
  drawAction,
  endTurn,
  playCard,
  resetDrawPile,
  resultLabel,
} from '../battle/engine';
import type { BattleTargetChoice } from '../content/types';
import type { SideState } from '../battle/types';
import { useCue } from '../audio/useCue';
import { AUDIO_MANIFEST } from '../audio/manifest';
import { audio } from '../audio/AudioManager';
import { useGameStore } from '../game/store';
import { useFocusTrap } from '../game/focus';
import { makeHistory } from '../game/persistence';
import { DrugBadge } from '../ui/drug/DrugBadge';
import { DrugInfoWindow } from '../ui/drug/DrugInfoWindow';
import d from '../ui/drug/drugs.module.css';
import p from './pages.module.css';

type ReturnState = {
  reportId?: string;
  sceneId?: string;
  segmentId?: string;
  nextScene?: string;
  nextSegment?: string;
};

function Bar({
  label,
  value,
  max,
  blue,
}: {
  label: string;
  value: number;
  max: number;
  blue?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={p.barRow}>
      <span className={p.barLabel}>{label}</span>
      <div className={p.bar} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
        <i className={`${p.barFill} ${blue ? p.blue : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={p.barNum}>
        {value}/{max}
      </span>
    </div>
  );
}

function StatusRow({ statuses }: { statuses: Record<string, { stacks: number }> }) {
  const entries = Object.entries(statuses);
  if (!entries.length) return <div className={p.statusRow} aria-hidden="true" />;
  return (
    <div className={p.statusRow} aria-label="状态">
      {entries.slice(0, 4).map(([name, state]) => (
        <span key={name} className={p.statusStamp}>
          {name} {state.stacks}
        </span>
      ))}
      {entries.length > 4 && <span className={p.statusStamp}>+{entries.length - 4}</span>}
    </div>
  );
}

function EffectRow({ effects }: { effects: SideState['effects'] }) {
  const entries = Object.entries(effects);
  return (
    <div className={p.effectRow} aria-label="效应">
      <span className={p.effectLabel}>效应</span>
      {entries.map(([name, value]) => {
        const severity = value.weight >= 6 ? '重' : value.weight >= 3 ? '中' : '轻';
        return (
          <span
            key={name}
            className={p.effectChip}
            data-valence={value.valence}
            data-severity={severity}
          >
            {name} · {severity} {value.weight}
          </span>
        );
      })}
      {!entries.length && <span className={p.small}>无</span>}
    </div>
  );
}

function CourseRow({ courses }: { courses: Record<string, { turns: number; active: boolean }> }) {
  const entries = Object.entries(courses).filter(([, value]) => value.turns > 0 || value.active);
  if (!entries.length) return null;
  return (
    <div className={p.statusRow} aria-label="疗程">
      {entries.map(([id, value]) => (
        <span key={id} className={p.statusStamp} data-active={value.active}>
          {id} {value.turns}/3{value.active ? ' · 维持' : ''}
        </span>
      ))}
    </div>
  );
}

export function BattlePage() {
  const { id } = useParams();
  const location = useLocation();
  const returnState = (location.state as ReturnState | null) ?? null;
  const battle =
    getBattle(id ?? '') ??
    (id === SAMPLE_FIXED_BATTLE.id ? SAMPLE_FIXED_BATTLE : SAMPLE_BATTLE);
  const contentCards = getCards();
  const cards = contentCards.length > 0 ? contentCards : [...SAMPLE_ENGINE_CARDS, ...SAMPLE_FIXED_CARDS];
  const drugList = getDrugs();
  const drugs = drugList.length > 0 ? drugList : SAMPLE_DRUGS;
  useCue(battle.bgm ?? 'battle');
  const save = useGameStore((state) => state.save);
  const setStatus = useGameStore((state) => state.setStatus);
  const completeScene = useGameStore((state) => state.completeScene);
  const markRead = useGameStore((state) => state.markRead);
  const addHistory = useGameStore((state) => state.addHistory);
  const ownedCount = (id: string) => save.ownedCards[id] ?? 0;
  const deckCards =
    battle.deckMode === 'fixed' ? cards : cards.filter((card) => ownedCount(card.id) > 0);
  const deckIds = Object.entries(save.deck).flatMap(([cardId, count]) =>
    Array.from({ length: Math.min(count, ownedCount(cardId)) }, () => cardId),
  );

  const [state, setState] = useState(() => createBattle(battle, deckCards, deckIds, 20240711));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showDrawPile, setShowDrawPile] = useState(false);
  const [target, setTarget] = useState<BattleTargetChoice | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropSide, setDropSide] = useState<BattleTargetChoice | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [showMechanism, setShowMechanism] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const recorded = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const mechRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useFocusTrap(Boolean(state.result), resultRef);
  useFocusTrap(showLog, logRef);
  useFocusTrap(showMechanism, mechRef);
  useFocusTrap(Boolean(detailId), detailRef);

  useEffect(() => {
    setState(createBattle(battle, deckCards, deckIds, 20240711));
    setSelectedIndex(null);
    setTarget(null);
    recorded.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.id]);

  useEffect(() => {
    if (!state.result || recorded.current) return;
    recorded.current = true;
    if (returnState?.sceneId) completeScene(returnState.sceneId);
    if (returnState?.reportId && returnState.segmentId) {
      markRead(returnState.reportId, [returnState.segmentId]);
    }
    addHistory(
      makeHistory(
        'battle',
        `${battle.title} · ${resultLabel(state.result)}`,
        returnState?.reportId ? `/report/${returnState.reportId}` : '/report/7',
        battle.id,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.result]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const node = event.target as HTMLElement | null;
      if (node?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setShowLog((value) => !value);
      }
      if (event.key === 'Escape') {
        setShowLog(false);
        setShowMechanism(false);
        setDetailId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectedCard =
    selectedIndex !== null ? cards.find((card) => card.id === state.hand[selectedIndex]) : undefined;
  const detailDrug = detailId ? getDrug(detailId) ?? drugs.find((drug) => drug.id === detailId) : undefined;
  const returnReport = returnState?.reportId ? `/report/${returnState.reportId}` : '/report/7';
  const continueHref = returnState?.nextScene
    ? `/report/${returnState.reportId ?? '7'}/replay/${returnState.nextSegment ?? returnState.nextScene}`
    : returnReport;
  const logLines = state.log.slice(-8);
  const needsTarget = Boolean(selectedCard);

  function chooseCard(index: number) {
    const card = cards.find((item) => item.id === state.hand[index]);
    setSelectedIndex(index);
    setTarget(card?.targets === 'enemy' ? 'opponent' : 'player');
  }

  function playIndex(index: number, side: BattleTargetChoice) {
    const cardId = state.hand[index];
    if (!cardId) return;
    const next = playCard(state, battle, cards, drugs, cardId, side, index);
    if (next === state) {
      setStatus('无法出牌：AP 不足、目标/用法不合法或手牌不在。');
      return;
    }
    audio.playSfx(AUDIO_MANIFEST.sfx.card);
    setState(next);
    setSelectedIndex(null);
    setTarget(null);
  }

  function handlePlay() {
    if (!selectedCard || selectedIndex === null) {
      setStatus('先选一张牌。');
      return;
    }
    if (needsTarget && !target) {
      setStatus('先选择目标：自己或对方。');
      return;
    }
    playIndex(selectedIndex, target ?? 'player');
  }

  function dragCard(event: DragEvent, index: number) {
    event.dataTransfer.setData('text/plain', `hand:${index}`);
    event.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  }

  function endDrag() {
    setDragIndex(null);
    setDropSide(null);
  }

  function dropZone(side: BattleTargetChoice) {
    return {
      onDragOver: (event: React.DragEvent) => {
        if (dragIndex === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropSide(side);
      },
      onDragLeave: (event: React.DragEvent) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDropSide((current) => (current === side ? null : current));
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('text/plain');
        const index = Number(raw.split(':')[1]);
        if (Number.isInteger(index)) playIndex(index, side);
        endDrag();
      },
    };
  }

  function handleEnd() {
    audio.playSfx(AUDIO_MANIFEST.sfx.turn);
    const next = endTurn(state, battle, cards, drugs);
    if (next !== state) setState(next);
  }

  function handleDraw() {
    const next = drawAction(state, cards);
    if (next !== state) {
      audio.playSfx(AUDIO_MANIFEST.sfx.click);
      setState(next);
    }
  }

  function handleReset() {
    const next = resetDrawPile(state);
    if (next === state) {
      setStatus('无法重置：AP 不足。');
      return;
    }
    setState(next);
  }

  function restart() {
    setState(createBattle(battle, deckCards, deckIds, 20240711));
    setSelectedIndex(null);
    setTarget(null);
    recorded.current = false;
  }

  return (
    <section className={p.battlePage} aria-label={`复演台 ${battle.title}`} data-testid="battle-grid">
      <h1 className="sr-only">复演台 {battle.title}</h1>
      <div className={p.battleTop}>
        <span>{battle.title}</span>
        <span>回合 {state.turn}</span>
        <span>对方：{battle.opponent.epithet ?? battle.opponent.kind ?? '心理阴影'}</span>
        <Link to={returnReport}>退出</Link>
      </div>

      <section
        className={p.opponent}
        aria-label="对方"
        data-targetable={Boolean(selectedCard && needsTarget) || dragIndex !== null}
        data-dragover={dropSide === 'opponent'}
        onClick={() => selectedCard && needsTarget && setTarget('opponent')}
        {...dropZone('opponent')}
      >
        <div className={p.inline} style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--fs-10)' }}>{battle.opponent.name}</span>
          <span className={p.small}>{battle.opponent.invulnerable ? '不可触及' : '对方'}</span>
        </div>
        <Bar label="生理" value={state.opponent.phys} max={state.opponent.maxPhys} />
        <Bar label="心理" value={state.opponent.psy} max={state.opponent.maxPsy} blue />
        <EffectRow effects={state.opponent.effects} />
        <CourseRow courses={state.opponent.courses} />
      </section>

      <div className={p.battleLog} role="log" aria-live="polite">
        {logLines.map((line, index) => (
          <span key={`${line}-${index}`}>
            &gt; {line}
          </span>
        ))}
      </div>

      <section
        className={p.player}
        aria-label="自己"
        data-targetable={Boolean(selectedCard && needsTarget) || dragIndex !== null}
        data-dragover={dropSide === 'player'}
        onClick={() => selectedCard && needsTarget && setTarget('player')}
        {...dropZone('player')}
      >
        <div className={p.inline} style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--fs-10)' }}>自己</span>
          <span className={p.small}>{battle.opponent.invulnerable ? '撑住' : '痕迹'}</span>
        </div>
        <Bar label="生理" value={state.player.phys} max={state.player.maxPhys} />
        <Bar label="心理" value={state.player.psy} max={state.player.maxPsy} blue />
        {!state.fixed && (
          <>
            <div className={p.ap}>
              <span>AP</span>
              {Array.from({ length: AP_CAP }, (_, index) => (
                <i key={index} className={`${p.apDot} ${index >= state.ap ? p.off : ''}`} aria-hidden="true" />
              ))}
            </div>
            <div className={p.apActions}>
              <button
                type="button"
                className={p.pixelButton}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDraw();
                }}
                disabled={state.ap < 1 || state.hand.length >= 8 || state.fixed || state.drawPile.length === 0}
                aria-label="抽牌，消耗 1 AP"
              >
                抽牌
              </button>
              <button
                type="button"
                className={p.pixelButton}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowDrawPile(true);
                }}
              >
                牌库 {state.drawPile.length}
              </button>
              <button
                type="button"
                className={p.pixelButton}
                onClick={(event) => {
                  event.stopPropagation();
                  handleReset();
                }}
                disabled={state.ap < 2 || !state.initialDeck.length || state.fixed}
              >
                重置 -2AP
              </button>
            </div>
          </>
        )}
        <EffectRow effects={state.player.effects} />
        <CourseRow courses={state.player.courses} />
      </section>

      <div className={p.hand} aria-label="手牌" data-testid="battle-hand">
        {state.hand.map((cardId, index) => {
          const card = cards.find((item) => item.id === cardId);
          if (!card) return null;
          const playable = state.fixed || state.ap >= 1;
          return (
            <div key={`${cardId}-${index}`} className={p.cardWrap}>
              <button
                type="button"
                className={p.card}
                data-selected={selectedIndex === index}
                data-dragging={dragIndex === index}
                aria-pressed={selectedIndex === index}
                draggable={playable}
                onDragStart={(event) => dragCard(event, index)}
                onDragEnd={endDrag}
                disabled={!playable}
                onClick={() => chooseCard(index)}
              >
                <span className={p.cardCost}>1</span>
                <span className={p.cardBadge}>
                  <DrugBadge klass={card.klass} />
                </span>
                <span className={p.cardName}>{card.name}</span>
                <span className={p.cardSummary}>{card.summary}</span>
                <span className={p.cardTags}>
                  {card.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
              </button>
              <button
                type="button"
                className={p.cardDetail}
                aria-label={`查看 ${card.name} 详情`}
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailId(card.drugId);
                }}
              >
                详情
              </button>
            </div>
          );
        })}
      </div>

      <div className={p.battleStatus}>
        <span className={p.serum}>
          手牌 {state.hand.length}/8 · 牌库 {state.drawPile.length}
        </span>
        <span className={p.battleHint}>
          {selectedCard
            ? `已选：${selectedCard.name}${needsTarget ? ` · 目标：${target === 'player' ? '自己' : target === 'opponent' ? '对方' : '未选'}` : ''}`
            : '选牌 → 目标 → 出牌，或把牌拖到自己/对方；同药再用即过量'}
        </span>
        <span className={p.inline}>
          {needsTarget && (
            <>
              <button type="button" className={p.chip} data-active={target === 'player'} onClick={() => setTarget('player')}>
                自己
              </button>
              <button type="button" className={p.chip} data-active={target === 'opponent'} onClick={() => setTarget('opponent')}>
                对方
              </button>
            </>
          )}
          <button type="button" className={p.pixelButton} onClick={handlePlay}>
            出牌
          </button>
          <button type="button" className={p.pixelButton} onClick={handleEnd}>
            结束回合
          </button>
          <button type="button" className={p.pixelButton} onClick={() => setShowMechanism(true)}>
            机制
          </button>
          <button type="button" className={p.pixelButton} onClick={() => setShowLog(true)}>
            日志
          </button>
        </span>
      </div>

      {showDrawPile && (
        <div className={p.battleResult} role="dialog" aria-modal="true" aria-label="未抽到的牌">
          <div className={p.logCard}>
            <h2 className={p.pageTitle}>未抽到的牌 · {state.drawPile.length} 张</h2>
            <div className={`${p.logList} scroll`}>
              {state.drawPile.length ? (
                state.drawPile.map((id, index) => {
                  const card = cards.find((item) => item.id === id);
                  return (
                    <p key={`${id}-${index}`} className={p.small}>
                      {card ? `${card.name} · ${card.summary}` : id}
                    </p>
                  );
                })
              ) : (
                <p className={p.small}>牌库已抽空。使用 2 AP 重置牌库。</p>
              )}
            </div>
            <button type="button" className={p.pixelButton} onClick={() => setShowDrawPile(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {showLog && (
        <div className={p.battleResult} role="dialog" aria-modal="true" aria-label="战斗日志">
          <div className={p.logCard} ref={logRef}>
            <h2 className={p.pageTitle}>战斗日志</h2>
            <div className={`${p.logList} scroll`}>
              {state.log.map((line, index) => (
                <p key={`${line}-${index}`} className={p.small}>
                  {line}
                </p>
              ))}
            </div>
            <button type="button" className={p.pixelButton} onClick={() => setShowLog(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {showMechanism && (
        <div className={p.battleResult} role="dialog" aria-modal="true" aria-label="机制面板">
          <div className={p.logCard} ref={mechRef}>
            <h2 className={p.pageTitle}>机制面板</h2>
            <div className={`${p.mechColumns} scroll`}>
              {[
                ['自己', state.player],
                ['对方', state.opponent],
              ].map(([label, side]) => (
                <div key={label as string}>
                  <h3 className={p.small}>{label as string}</h3>
                  {Object.entries((side as typeof state.player).neuro).map(([name, value]) => (
                    <div className={d.meterRow} key={name}>
                      <span>{name}</span>
                      <span className={d.meter}>
                        <i style={{ width: `${value}%` }} data-low={value <= 20} data-high={value >= 80} />
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <h3 className={p.small}>状态</h3>
                  <StatusRow statuses={(side as typeof state.player).statuses} />
                  <h3 className={p.small}>酶</h3>
                  {Object.entries((side as typeof state.player).enzymes).map(([name, value]) => (
                    <div className={d.meterRow} key={name}>
                      <span>{name}</span>
                      <span className={d.meter}>
                        <i style={{ width: `${Math.min(100, value * 50)}%` }} data-low={value < 0.6} data-high={value > 1.3} />
                      </span>
                      <span>{value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button type="button" className={p.pixelButton} onClick={() => setShowMechanism(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {detailDrug && (
        <div className={p.battleResult} ref={detailRef}>
          <DrugInfoWindow
            drug={detailDrug}
            playerConcentration={state.player.concentration[detailDrug.id] ?? 0}
            opponentConcentration={state.opponent.concentration[detailDrug.id] ?? 0}
            onClose={() => setDetailId(null)}
          />
        </div>
      )}

      {state.result && (
        <div className={p.battleResult} role="dialog" aria-modal="true" aria-label="复演结果">
          <div className={p.resultCard} ref={resultRef}>
            <p className={p.kicker}>{resultLabel(state.result)}</p>
            <h2 className={p.pageTitle}>{state.result.title}</h2>
            <p>{state.result.detail}</p>
            <div className={p.inline}>
              <Link className={p.pixelButton} to={continueHref}>
                继续阅读
              </Link>
              <button type="button" className={p.pixelButton} onClick={restart}>
                再复演一次
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}