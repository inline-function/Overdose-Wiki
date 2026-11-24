import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import {
  advanceTurn,
  castVote,
  countCells,
  endTurn,
  getActions,
  getSeats,
  getSignatures,
  externalChance,
  includedRatio,
  isMeterWarning,
  manualCount,
  resolveAction,
  resolveDeath,
  resolveReply,
  seatWeightTotal,
  startVisit,
  warningMeters,
  clauseLabel,
  relationText,
} from './engine';
import { clauseList, deathInterlude, endingContentAll, externalEventList, turnContentAt } from './content';
import { joinList, z } from './text';
import type {
  ActionCard,
  AfterstoryRun,
  Cell,
  DeathResponse,
  EndingId,
  Faction,
  MeterKey,
  SeatId,
  SeatState,
} from './types';
import s from './AfterstoryGame.module.css';

type Props = {
  run: AfterstoryRun;
  onChange: (run: AfterstoryRun) => void;
  onExit: () => void;
  onRestart: () => void;
  onEnding: (ending: EndingId) => void;
};

function factionLabel(faction: Faction): string {
  return faction === 'harm'
    ? z('减害')
    : faction === 'left'
      ? z('自由左')
      : faction === 'right'
        ? z('自由右')
        : z('群众');
}

const SEAT_ORDER: SeatId[] = ['harm1', 'harm2', 'left', 'right', 'mass'];

function seatLabel(seat: SeatId): string {
  switch (seat) {
    case 'harm1':
      return z('减一');
    case 'harm2':
      return z('减二');
    case 'left':
      return z('左');
    case 'right':
      return z('右');
    default:
      return z('空椅');
  }
}

function endingSeatLabel(seat: SeatId): string {
  switch (seat) {
    case 'harm1':
      return z('减害一席');
    case 'harm2':
      return z('减害二席');
    case 'left':
      return z('自由左');
    case 'right':
      return z('自由右');
    default:
      return z('空椅');
  }
}

function factionProfiles() {
  return [
    {
      id: 'harm' as Faction,
      name: z('减害'),
      latin: 'HARM REDUCTION',
      line: z('把 od 当作压制痛苦的手段，而非目的。'),
      edge: z('主张节制知识、讲危害反制，最终引人离开药物。'),
    },
    {
      id: 'left' as Faction,
      name: z('自由左'),
      latin: 'LIBERTARIAN LEFT',
      line: z('主张 od 信息自由公开，反道德化审查。'),
      edge: z('不反策划药，但反不透；是知识理念取向的自由。'),
    },
    {
      id: 'right' as Faction,
      name: z('自由右'),
      latin: 'LIBERTARIAN RIGHT',
      line: z('把 od 当作享乐与生意。'),
      edge: z('主张药自由卖、用到死，拒绝道德引导和「离开」这个终点。'),
    },
    {
      id: 'mass' as Faction,
      name: z('群众'),
      latin: 'THE UNAFFILIATED',
      line: z('不站队的人、离场的人、还没决定的人。'),
      edge: z('群众没有具体的派别，或是没有找清自己定位，或是完全中立。'),
    },
  ];
}

function meterInfoTable(): Record<MeterKey, { title: string; rule: string; body: string }> {
  return {
    trust: {
      title: z('信任'),
      rule: z('低于 30 进入警戒。'),
      body: z('信任决定还有多少人愿意把事交给你。低于 30 时，减害二席会弃权，游说也更难成功。回复来访者、急救和兑现承诺会抬高它；清场、封锁和反复失约会压低它。'),
    },
    exposure: {
      title: z('暴露'),
      rule: z('高于 60 进入警戒，并按比例触发外界观察。'),
      body: z('暴露是外面看见你们的程度。超过 60 后，每回合都会按暴露比例掷一次外界观察：视频主、记者、平台、药品管理，都会来。封锁消息、编写文档、恢复旧公约和封锁宣言可以把它压下去。'),
    },
    chaos: {
      title: z('混乱'),
      rule: z('高于 60 进入警戒，到 80 直接失控。'),
      body: z('混乱是桌子还能不能继续开会的程度。强制清场、压报道、公开对骂都会抬高它。到 80 时，不需要再投票：会议直接散场。'),
    },
  };
}

const ENDING_ART: Record<EndingId, string> = {
  'new-circle': '/assets/afterstory/ending_new-circle.png',
  clinic: '/assets/afterstory/ending_clinic.png',
  'old-circle': '/assets/afterstory/ending_old-circle.png',
  ebb: '/assets/afterstory/ending_ebb.png',
  chaos: '/assets/afterstory/ending_chaos.png',
  market: '/assets/afterstory/ending_market.png',
  'long-night': '/assets/afterstory/ending_long-night.png',
};

function percent(part: number, total: number): number {
  return total <= 0 ? 0 : Math.round((part / total) * 100);
}

function FactionIcon({ faction }: { faction: Faction }) {
  if (faction === 'harm') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9z" />
      </svg>
    );
  }
  if (faction === 'left') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M9 17V8a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-7a2 2 0 0 1 4 0v8-4a2 2 0 0 1 4 0v8c0 6-4 10-10 10-5 0-8-3-9-7l-2-5a2 2 0 0 1 3-2z" />
      </svg>
    );
  }
  if (faction === 'right') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="11" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M15 16l13 13M22 23l3-3M25 26l3-3" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 6h14v11H9zM7 17h18v4H7zM10 21l-2 7M22 21l2 7" fill="none" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}

function Meter({
  label,
  value,
  tone,
  warning,
  onClick,
  testId,
}: {
  label: string;
  value: number;
  tone: string;
  warning: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className={s.meter + (warning ? ' ' + s.meterWarn : '')}
      onClick={onClick}
      aria-label={z('{label} {value}{warning}', { label, value, warning: warning ? z('，警戒') : '' })}
      title={z('查看{label}说明', { label })}
      data-testid={testId}
    >
      <span className={s.meterName}>{label}</span>
      <span className={s.meterTrack} aria-hidden="true">
        <span className={s.meterFill + ' ' + s[tone]} style={{ width: value + '%' }} />
      </span>
      <b>{value}</b>
      {warning && <i className={s.warnMark} aria-hidden="true">!</i>}
    </button>
  );
}

function VoteBadge({ vote }: { vote: SeatState['vote'] }) {
  const label =
    vote === 'yes'
      ? z('赞成')
      : vote === 'no'
        ? z('反对')
        : vote === 'abstain'
          ? z('摇摆')
          : z('空置');
  return <span className={s.vote + ' ' + s['vote-' + vote]}>{label}</span>;
}

export function AfterstoryGame({ run, onChange, onExit, onRestart, onEnding }: Props) {
  const locale = useLocale();
  void locale;
  const [mapMode, setMapMode] = useState<'faction' | 'included'>('faction');
  const [selected, setSelected] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [card, setCard] = useState<ActionCard | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [meterInfo, setMeterInfo] = useState<MeterKey | null>(null);
  const [lobby, setLobby] = useState<SeatId[]>([]);
  const [notice, setNotice] = useState('');
  const [actionWarnings, setActionWarnings] = useState<ActionCard['id'][]>([]);
  const [endingIntroDone, setEndingIntroDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mapRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const endingRef = useRef<EndingId | null>(null);
  const endingTitleRef = useRef<HTMLHeadingElement>(null);

  const counts = countCells(run.cells);
  const active = counts.harm + counts.left + counts.right;
  const inc = Math.round(includedRatio(run) * 100);
  const turn = turnContentAt(run.turn);
  const seats = run.phase === 'council' ? getSeats(run) : [];
  const actions = run.phase === 'table' ? getActions(run) : [];
  const signatures = getSignatures(run);
  const ending = run.ending ? endingContentAll()[run.ending] : null;
  const passing = manualCount(run);
  const external = run.externalEvent
    ? externalEventList().find((event) => event.id === run.externalEvent)
    : undefined;
  const totalSeatWeight = seatWeightTotal(seats);

  const mapSummary = useMemo(
    () =>
      z('减害 {harm}%，自由左 {left}%，自由右 {right}%，群众 {mass} 格；计入 {inc}%', {
        harm: percent(counts.harm, active),
        left: percent(counts.left, active),
        right: percent(counts.right, active),
        mass: counts.mass,
        inc,
      }),
    [counts, active, inc],
  );

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [run.phase, run.turn]);

  useEffect(() => {
    const image = new Image();
    image.src = turn.art;
  }, [turn.art]);

  useEffect(() => {
    if (run.phase === 'ending' && run.ending && endingRef.current !== run.ending) {
      endingRef.current = run.ending;
      onEnding(run.ending);
    }
  }, [run.phase, run.ending, onEnding]);

  useEffect(() => {
    if (run.phase !== 'ending') {
      setEndingIntroDone(false);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setEndingIntroDone(true);
      return;
    }
    const timer = window.setTimeout(() => setEndingIntroDone(true), 4400);
    return () => window.clearTimeout(timer);
  }, [run.phase, run.ending]);

  useEffect(() => {
    if (run.phase === 'ending' && endingIntroDone) {
      endingTitleRef.current?.focus({ preventScroll: true });
    }
  }, [run.phase, endingIntroDone]);

  useEffect(() => {
    if (run.phase !== 'council') setLobby([]);
  }, [run.phase, run.pendingMotion]);

  useEffect(() => {
    setActionWarnings([]);
  }, [run.turn]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (card) {
        setCard(null);
        event.preventDefault();
      } else if (manualOpen) {
        setManualOpen(false);
        event.preventDefault();
      } else if (logOpen) {
        setLogOpen(false);
        event.preventDefault();
      } else if (helpOpen) {
        setHelpOpen(false);
        event.preventDefault();
      } else if (meterInfo) {
        setMeterInfo(null);
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, manualOpen, logOpen, helpOpen, meterInfo]);

  const apply = (result: { run: AfterstoryRun; ok: boolean; message: string }) => {
    if (!result.ok) {
      setNotice(result.message);
      return false;
    }
    onChange(result.run);
    setNotice('');
    setCard(null);
    return true;
  };

  const focusCell = (index: number) => {
    const next = Math.max(0, Math.min(99, index));
    setFocusIndex(next);
    setSelected(next);
    mapRefs.current[next]?.focus();
  };

  const onCellKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const row = Math.floor(index / 10);
    if (event.key === 'ArrowLeft') focusCell(index - 1);
    else if (event.key === 'ArrowRight') focusCell(index + 1);
    else if (event.key === 'ArrowUp') focusCell(index - 10);
    else if (event.key === 'ArrowDown') focusCell(index + 10);
    else if (event.key === 'Home') focusCell(row * 10);
    else if (event.key === 'End') focusCell(row * 10 + 9);
    else return;
    event.preventDefault();
  };

  const cellClass = (cell: Cell) => {
    const classes = [s.cell, s['cell-' + cell.faction]];
    const included = cell.faction === 'harm' || (run.relations.leftLeader === 'sage' && run.relations.left === 'friendly' && cell.faction === 'left');
    if (mapMode === 'included' && !included) classes.push(s.cellDim);
    if (mapMode === 'included' && included) classes.push(s.cellCounted);
    if (selected === run.cells.indexOf(cell)) classes.push(s.cellSelected);
    return classes.join(' ');
  };

  const chooseReply = (id: string) => apply(resolveReply(run, id));
  const chooseAction = (actionId: ActionCard['id'], choiceId: string) => {
    const before = new Set(warningMeters(run));
    const result = resolveAction(run, actionId, choiceId);
    let suffix = '';
    if (result.ok) {
      const entered = warningMeters(result.run).filter((key) => !before.has(key));
      if (entered.length > 0) {
        setActionWarnings((current) => (current.includes(actionId) ? current : [...current, actionId]));
        suffix = ' ' + joinList(entered.map((key) => meterInfoTable()[key].title)) + z('进入警戒。');
      }
      setLobby([]);
    }
    apply(result);
    if (result.ok) setNotice(result.message + suffix);
  };
  const chooseDeath = (id: DeathResponse) => apply(resolveDeath(run, id));
  const vote = () => {
    const result = castVote(run, lobby);
    apply(result);
    if (result.ok) setNotice(result.message);
    setLobby([]);
  };

  const selectedCell = selected === null ? null : run.cells[selected];
  const warningKeys = warningMeters(run);

  return (
    <article className={s.game} data-testid="afterstory-game" data-phase={run.phase} data-warning={warningKeys.length > 0 ? 'true' : undefined}>
      <div key={run.phase + '-' + run.turn} className={s.phaseWipe} aria-hidden="true" />
      <header className={s.head}>
        <div className={s.headTitle}>
          <p className={s.eyebrow}>{z('第 {n} 回合 / {date}', { n: run.turn, date: turn.date })}</p>
          <h1 ref={headingRef} tabIndex={-1} data-testid="as-turn-title">{turn.title}</h1>
        </div>
        <div className={s.headActions}>
          {run.turn >= 3 && run.relations.leftLeader === 'sage' && <span className={s.miniStamp}>{z('鼠尾草接任')}</span>}
          <button type="button" className={s.chip} onClick={() => setManualOpen(true)} data-testid="as-manual-open">
            {z('手册 {n}/4', { n: passing })}
          </button>
          <button type="button" className={s.chip} onClick={() => setLogOpen(true)} aria-label={z('查看回执 {n}', { n: run.log.length })} title={z('最近发生的行动与夜报')} data-testid="as-log-open">{z('回执 {n}', { n: run.log.length })}</button>
          <button type="button" className={s.chip} onClick={() => setHelpOpen(true)} aria-label={z('派别理念')} title={z('各种派别')}>?</button>
          <button type="button" className={s.chip} onClick={onExit} data-testid="as-exit">{z('退出')}</button>
        </div>
      </header>

      <div className={s.body}>
        <section className={s.mapPane} aria-label={z('药圈倾向图')}>
          <div className={s.mapHead}>
            <div className={s.mapTabs} role="group" aria-label={z('地图视图')}>
              <button type="button" className={s.mapTab + (mapMode === 'faction' ? ' ' + s.mapTabOn : '')} aria-pressed={mapMode === 'faction'} onClick={() => setMapMode('faction')}>{z('派别')}</button>
              <button type="button" className={s.mapTab + (mapMode === 'included' ? ' ' + s.mapTabOn : '')} aria-pressed={mapMode === 'included'} onClick={() => setMapMode('included')}>{z('计入')}</button>
            </div>
            <span className={s.inc}>{z('计入')} <b>{inc}%</b></span>
          </div>
          <div className={s.relations}>
            <span
              className={s.rel + ' ' + s['rel-' + run.relations.left]}
              title={z('自由左（{leader}）：{relation}', {
                leader: run.relations.leftLeader === 'edward' ? z('爱德华') : z('鼠尾草'),
                relation: relationText(run, 'left'),
              })}
            >
              {z('左 · ')}
              {relationText(run, 'left').replace(z('（上限中立）'), '')}
            </span>
            <span
              className={s.rel + ' ' + s['rel-' + run.relations.right]}
              title={z('自由右：{relation}', { relation: relationText(run, 'right') })}
            >
              {z('右 · ')}
              {relationText(run, 'right')}
            </span>
            <span className={s.rel + ' ' + s.relBlank} title={z('群众没有代表，不计入票权')}>{z('群众')}</span>
          </div>
          <div className={s.mapGrid} role="group" aria-label={z('药圈倾向图，10 乘 10 格。使用方向键移动，回车查看来源。')} data-testid="as-map">
            {run.cells.map((cell, index) => {
              const included = cell.faction === 'harm' || (run.relations.leftLeader === 'sage' && run.relations.left === 'friendly' && cell.faction === 'left');
              return (
                <button
                  key={cell.id}
                  style={{ animationDelay: `${Math.min(1.2, index * 0.012)}s` }}
                  ref={(node) => { mapRefs.current[index] = node; }}
                  type="button"
                  className={cellClass(cell)}
                  tabIndex={index === focusIndex ? 0 : -1}
                  aria-label={z('第 {row} 行第 {col} 列，{faction}{included}，来源：{source}', {
                    row: cell.row + 1,
                    col: cell.col + 1,
                    faction: factionLabel(cell.faction),
                    included: included && mapMode === 'included' ? z('，计入胜利') : '',
                    source: cell.source,
                  })}
                  aria-pressed={selected === index}
                  onClick={() => { setSelected(index); setFocusIndex(index); }}
                  onFocus={() => { setFocusIndex(index); setSelected(index); }}
                  onKeyDown={(event) => onCellKeyDown(event, index)}
                />
              );
            })}
          </div>
          <p className={s.sourceLine} aria-live="polite">
            {selectedCell
              ? z('第 {row} 行 {col} 列 · {faction} · {source}', {
                  row: selectedCell.row + 1,
                  col: selectedCell.col + 1,
                  faction: factionLabel(selectedCell.faction),
                  source: selectedCell.source,
                })
              : z('点一格看来源。颜色和位置一起读。')}
          </p>
          <div className={s.legend} aria-label={mapSummary}>
            {(['harm', 'left', 'right'] as Faction[]).map((faction) => (
              <span key={faction} className={s.legendItem}>
                <i className={s.swatch + ' ' + s['cell-' + faction]} aria-hidden="true" />
                {factionLabel(faction)} {percent(counts[faction], active)}%
              </span>
            ))}
            <span className={s.legendItem + ' ' + s.legendWide}>
              <i className={s.swatch + ' ' + s['cell-mass']} aria-hidden="true" />
              {z('群众 {mass} 格 · 活跃 {active}', { mass: counts.mass, active })}
            </span>
          </div>
        </section>

        <section className={s.panel} aria-live="polite">
          {run.phase === 'brief' && (
            <div key={'brief-' + run.turn} className={s.panelInner} data-testid="as-brief">
              <div className={s.panelHero}>
                <div className={s.panelHeroCopy}>
                  <p className={s.eyebrow}>{z('本周简报 / {headline}', { headline: turn.headline })}</p>
                  <h2 className={s.panelTitle}>{turn.title}</h2>
                </div>
                <img className={s.panelThumb} src={turn.art} alt="" width={768} height={768} />
              </div>
              <div className={s.briefText}>
                {turn.brief.map((line, index) => <p key={line} style={{ animationDelay: `${index * 0.07}s` }}>{line}</p>)}
              </div>
              <button type="button" className={s.primary} onClick={() => apply(startVisit(run))} data-testid="as-open-visit">
                {z('看来访者')} <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {run.phase === 'visit' && (
            <div key={'visit-' + run.turn} className={s.panelInner} data-testid="as-visit">
              <div className={s.panelHero}>
                <div className={s.panelHeroCopy}>
                  <p className={s.eyebrow}>{z('来访 / {role}', { role: turn.visitor.role })}</p>
                  <h2 className={s.panelTitle}>{turn.visitor.from}</h2>
                </div>
                <img className={s.panelThumb} src={turn.art} alt="" width={768} height={768} />
              </div>
              <p className={s.quote}>{turn.visitor.question}</p>
              <div className={s.replies}>
                {turn.visitor.options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    className={s.reply + ' ' + s.replyIn}
                    style={{ animationDelay: `${index * 0.07}s` }}
                    onClick={() => chooseReply(option.id)}
                  >
                    <span>{option.label}</span>
                    <small>{option.effectText}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {run.phase === 'table' && (
            <div key={'table-' + run.turn} className={s.panelInner} data-testid="as-table">
              <div className={s.panelTop}>
                <div>
                  <p className={s.eyebrow}>{z('主桌 / 行动点 {ap} / 政治资本 {pc}', { ap: run.meters.ap, pc: run.meters.pc })}</p>
                  <h2 className={s.panelTitle}>{z('这张桌子还能用吗？')}</h2>
                </div>
                <span className={s.seal}>{z('第 {n} 幕', { n: run.turn })}</span>
              </div>
              <div className={s.actionGrid}>
                {actions.map((action, index) => {
                  const warn = actionWarnings.includes(action.id);
                  return (
                    <button
                      key={action.id + action.title}
                      type="button"
                      className={s.action + ' ' + s.actionIn + (warn ? ' ' + s.actionWarn : '')}
                      style={{ animationDelay: `${0.06 + index * 0.055}s` }}
                      disabled={run.meters.ap < 1 && action.id !== 'found'}
                      onClick={() => setCard(action)}
                    >
                      <span>
                        {action.title}
                        {warn && <i className={s.warnMark} aria-label={z('进入警戒')}>!</i>}
                      </span>
                      <small>{action.hint}</small>
                    </button>
                  );
                })}
              </div>
              {run.meters.ap < 1 && <p className={s.note}>{z('行动点用完了。结束本回合，或去议事。')}</p>}
              <div className={s.panelFoot}>
                <button type="button" className={s.secondary} onClick={() => setManualOpen(true)}>{z('翻手册')}</button>
                <button type="button" className={s.endTurn} onClick={() => apply(endTurn(run))} data-testid="as-end-turn">{z('结束本回合')}</button>
              </div>
            </div>
          )}

          {run.phase === 'council' && (
            <div key={'council-' + run.turn + '-' + (run.pendingMotion?.kind ?? 'none')} className={s.panelInner} data-testid="as-council">
              <p className={s.eyebrow}>{z('议事 / 动议 / 总票权 {n}', { n: totalSeatWeight })}</p>
              <h2 className={s.panelTitle}>{run.pendingMotion ? clauseLabel(run.pendingMotion) : z('没有动议')}</h2>
              <p className={s.note}>{z('按票权过半通过。游说 1PC，按好感度判定，不保证成功。空椅不计票。')}</p>
              <div className={s.seats}>
                {seats.map((seat, index) => (
                  <div key={seat.id} className={s.seat + ' ' + s.seatIn + (seat.id === 'mass' ? ' ' + s.seatEmpty : '')} style={{ animationDelay: `${0.08 + index * 0.07}s` }}>
                    <div className={s.seatName}>
                      <b>{seat.label}</b>
                      <small>{seat.holder}</small>
                    </div>
                    <span className={s.seatWeight}>{z('{n} 票', { n: seat.weight })}</span>
                    <VoteBadge vote={lobby.includes(seat.id) ? 'yes' : seat.vote} />
                    {seat.lobbyable && seat.vote !== 'yes' ? (
                      <button
                        type="button"
                        className={s.lobby + (lobby.includes(seat.id) ? ' ' + s.lobbyOn : '')}
                        aria-pressed={lobby.includes(seat.id)}
                        disabled={!lobby.includes(seat.id) && lobby.length >= run.meters.pc}
                        title={!lobby.includes(seat.id) && lobby.length >= run.meters.pc ? z('PC 不足，先取消一个游说') : undefined}
                        onClick={() => setLobby((current) => current.includes(seat.id) ? current.filter((id) => id !== seat.id) : current.length < run.meters.pc ? [...current, seat.id] : current)}
                      >
                        {z('游说 1PC · {n}%', { n: Math.round((seat.chance ?? 0) * 100) })}
                      </button>
                    ) : seat.id === 'mass' ? <span className={s.seatHint}>{seat.note}</span> : null}
                  </div>
                ))}
              </div>
              <div className={s.panelFoot}>
                <span className={s.note}>
                  {z('已选 {n} / PC {pc}', { n: lobby.length, pc: run.meters.pc })}
                  {run.meters.pc === 0 ? z(' · 无 PC，只能投票') : lobby.length >= run.meters.pc ? z(' · PC 已用完') : ''}
                </span>
                <button type="button" className={s.endTurn} onClick={vote} data-testid="as-vote">{z('投票')}</button>
              </div>
            </div>
          )}

          {run.phase === 'night' && (
            <div key={'night-' + run.turn} className={s.panelInner} data-testid="as-night">
              <div className={s.panelHero}>
                <div className={s.panelHeroCopy}>
                  <p className={s.eyebrow}>{z('夜报 / {date}', { date: turn.date })}</p>
                  <h2 className={s.panelTitle}>{z('天亮了')}</h2>
                </div>
                <img className={s.panelThumb} src={turn.art} alt="" width={768} height={768} />
              </div>
              {external && (
                <div className={s.eventBox} data-testid="as-external-event">
                  <p className={s.eyebrow}>{z('外界观察 / {title}', { title: external.title })}</p>
                  <p>{external.body}</p>
                  <small>{external.effectText}</small>
                </div>
              )}
              <div className={s.nightList}>
                {run.night.map((line, index) => <p key={line} style={{ animationDelay: `${index * 0.055}s` }}>{line}</p>)}
              </div>
              <div className={s.nightStats}>
                <Meter label={z('信任')} value={run.meters.trust} tone="trust" warning={warningKeys.includes('trust')} onClick={() => setMeterInfo('trust')} />
                <Meter label={z('暴露')} value={run.meters.exposure} tone="exposure" warning={warningKeys.includes('exposure')} onClick={() => setMeterInfo('exposure')} />
                <Meter label={z('混乱')} value={run.meters.chaos} tone="chaos" warning={warningKeys.includes('chaos')} onClick={() => setMeterInfo('chaos')} />
              </div>
              <button type="button" className={s.primary} onClick={() => apply(advanceTurn(run))} data-testid="as-next-turn">{z('进入下一回合 →')}</button>
            </div>
          )}

          {run.phase === 'interlude' && (
            <div key={'interlude-' + run.turn} className={s.panelInner} data-testid="as-interlude">
              <p className={s.eyebrow}>{z('幕间 / {date}', { date: '2026.02.04' })}</p>
              <h2 className={s.panelTitle}>{z('一把空椅')}</h2>
              <p className={s.quote}>{z('“爱德华怎么死的？你们是不是害死了他？”')}</p>
            </div>
          )}
        </section>
      </div>

      <footer className={s.footer}>
        <div className={s.meters}>
          <Meter label={z('信任')} value={run.meters.trust} tone="trust" warning={warningKeys.includes('trust')} onClick={() => setMeterInfo('trust')} testId="as-meter-trust" />
          <Meter label={z('暴露')} value={run.meters.exposure} tone="exposure" warning={warningKeys.includes('exposure')} onClick={() => setMeterInfo('exposure')} testId="as-meter-exposure" />
          <Meter label={z('混乱')} value={run.meters.chaos} tone="chaos" warning={warningKeys.includes('chaos')} onClick={() => setMeterInfo('chaos')} testId="as-meter-chaos" />
        </div>
        <span className={s.footMeta}>{z('AP {ap}/2 · PC {pc} · 手册 {n}/4 · 签字 {s}/4', { ap: run.meters.ap, pc: run.meters.pc, n: passing, s: signatures.length })}</span>
      </footer>

      {notice && <p key={notice} className={s.notice} role="status">{notice}</p>}

      {card && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="as-card-title">
          <div className={s.card}>
            <div className={s.cardArt}>
              <img src={card.art} alt="" width={960} height={540} />
              <span className={s.cardTag}>{z('主桌行动')}</span>
            </div>
            <div className={s.cardCopy}>
              <p className={s.eyebrow}>{z('选择 / {hint}', { hint: card.hint })}</p>
              <h2 id="as-card-title" className={s.cardTitle}>{card.title}</h2>
              <p className={s.cardBody}>{card.body}</p>
              <div className={s.cardChoices}>
                {card.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={s.cardChoice}
                    disabled={Boolean(choice.disabled)}
                    onClick={() => chooseAction(card.id, choice.id)}
                  >
                    <span>{choice.label}</span>
                    <small>{choice.disabled ?? choice.effectText}</small>
                  </button>
                ))}
              </div>
              <button type="button" className={s.close} onClick={() => setCard(null)} aria-label={z('关闭行动')} autoFocus>×</button>
            </div>
          </div>
        </div>
      )}

      {meterInfo && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="as-meter-title">
          <div className={s.infoCard} data-testid="as-meter-info">
            <div className={s.manualHead}>
              <div>
                <p className={s.eyebrow}>{z('量表说明 / {rule}', { rule: meterInfoTable()[meterInfo].rule })}</p>
                <h2 id="as-meter-title" className={s.manualTitle}>{meterInfoTable()[meterInfo].title} · {run.meters[meterInfo]}</h2>
              </div>
              <button type="button" className={s.close} onClick={() => setMeterInfo(null)} aria-label={z('关闭说明')} autoFocus>×</button>
            </div>
            <p className={s.infoBody}>{meterInfoTable()[meterInfo].body}</p>
            {meterInfo === 'exposure' && run.meters.exposure > 60 && (
              <p className={s.note} data-testid="as-external-chance">
                {z('当前暴露 {n}，本回合外界观察触发概率约 {p}%。', {
                n: run.meters.exposure,
                p: Math.round(externalChance(run) * 100),
              })}
              </p>
            )}
            <p className={s.note}>
              {isMeterWarning(meterInfo, run.meters[meterInfo]) ? z('当前已在警戒范围。') : z('当前未进入警戒范围。')}
            </p>
            <div className={s.manualFoot}>
              <span className={s.note}>{z('行动让某个量表进入警戒时，该行动旁会出现红色感叹号。')}</span>
              <button type="button" className={s.secondary} onClick={() => setMeterInfo(null)}>{z('知道了')}</button>
            </div>
          </div>
        </div>
      )}

      {run.phase === 'interlude' && (
        <div className={s.deathOverlay} role="dialog" aria-modal="true" aria-labelledby="as-death-title">
          <div className={s.deathCard}>
            <p className={s.eyebrow}>{z('幕间 / {date}', { date: deathInterlude().date })}</p>
            <h2 id="as-death-title" className={s.deathTitle}>{deathInterlude().title}</h2>
            <div className={s.deathBody}>
              {deathInterlude().body.map((line) => <p key={line}>{line}</p>)}
            </div>
            <p className={s.quote}>{deathInterlude().question}</p>
            <div className={s.deathOptions}>
              {deathInterlude().options.map((option) => (
                <button key={option.id} type="button" className={s.deathOption} onClick={() => chooseDeath(option.id as DeathResponse)} autoFocus={option.id === 'careFirst'}>
                  <span>{option.label}</span>
                  <small>{option.effectText}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {manualOpen && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="as-manual-title">
          <div className={s.manual}>
            <div className={s.manualHead}>
              <div>
                <p className={s.eyebrow}>{z('旧公约背面 / 草稿')}</p>
                <h2 id="as-manual-title" className={s.manualTitle}>{z('新药圈共用手册')}</h2>
              </div>
              <button type="button" className={s.close} onClick={() => setManualOpen(false)} aria-label={z('关闭手册')} autoFocus>×</button>
            </div>
            <p className={s.manualIntro}>{z('团结不是同意，是同意继续谈。')}</p>
            <div className={s.clauses}>
              {clauseList().map((clause) => {
                const state = run.documents.manual[clause.id];
                return (
                  <div key={clause.id} className={s.clause + (state.status === 'passed' ? ' ' + s.clausePassed : '')}>
                    <div className={s.clauseHead}>
                      <b>{clause.order}. {clause.title}</b>
                      <span>{state.status === 'passed' ? z('已通过') : state.status === 'failed' ? z('未通过') : z('空白')}</span>
                    </div>
                    <p>{state.status === 'passed' ? clause.variants.find((variant) => variant.id === state.variantId)?.summary : clause.subtitle}</p>
                  </div>
                );
              })}
            </div>
            <div className={s.signatures}>
              <b>{z('签字栏 {n}/4', { n: signatures.length })}</b>
              <span>{SEAT_ORDER.map((id) => seatLabel(id) + (signatures.includes(id) ? '✓' : '·')).join(' ')}</span>
            </div>
            <div className={s.manualFoot}>
              <span className={s.note}>{z('手册 ≥3 条 + 四席签字，才有可能进入「新药圈」。')}</span>
              <button type="button" className={s.secondary} onClick={() => setManualOpen(false)}>{z('合上')}</button>
            </div>
          </div>
        </div>
      )}

      {logOpen && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="as-log-title">
          <div className={s.manual} data-testid="as-log">
            <div className={s.manualHead}>
              <div>
                <p className={s.eyebrow}>{z('桌上回执 / 只记已发生的事')}</p>
                <h2 id="as-log-title" className={s.manualTitle}>{z('本周回执')}</h2>
              </div>
              <button type="button" className={s.close} onClick={() => setLogOpen(false)} aria-label={z('关闭回执')} autoFocus>×</button>
            </div>
            <p className={s.manualIntro}>{z('行动、投票与夜报留下的记录。最近十条，最近的在上。')}</p>
            <div className={s.receiptList}>
              {run.log.length === 0 ? (
                <p className={s.note}>{z('还没有回执。先坐下。')}</p>
              ) : (
                run.log.slice(-10).reverse().map((entry, index) => (
                  <div className={s.receiptRow} key={entry.turn + '-' + entry.label + '-' + index}>
                    <div className={s.receiptHead}>
                      <b>{entry.label}</b>
                      <span>{z('第 {n} 回合', { n: entry.turn })}</span>
                    </div>
                    <p>{entry.detail}</p>
                  </div>
                ))
              )}
            </div>
            <div className={s.manualFoot}>
              <span className={s.note}>{z('回执只显示最近 10 条。')}</span>
              <button type="button" className={s.secondary} onClick={() => setLogOpen(false)}>{z('合上')}</button>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="as-help-title">
          <div className={s.help}>
            <div className={s.manualHead}>
              <div>
                <p className={s.eyebrow}>{z('各种派别 / 没有统一答案')}</p>
                <h2 id="as-help-title" className={s.manualTitle}>{z('谁在这张桌子上')}</h2>
              </div>
              <button type="button" className={s.close} onClick={() => setHelpOpen(false)} aria-label={z('关闭派别说明')} autoFocus>×</button>
            </div>
            <p className={s.helpIntro}>{z('各种派别，各种对「救人」的理解。没有人天然正确，也没有人天然该被代表。')}</p>
            <div className={s.factionGrid}>
              {factionProfiles().map((faction) => (
                <div key={faction.id} className={s.factionCard + ' ' + s['faction-' + faction.id]}>
                  <div className={s.factionIcon}><FactionIcon faction={faction.id} /></div>
                  <div>
                    <p className={s.eyebrow}>{faction.latin}</p>
                    <h3>{faction.name}</h3>
                  </div>
                  <p className={s.factionLine}>{faction.line}</p>
                  <small>{faction.edge}</small>
                </div>
              ))}
            </div>
            <div className={s.manualFoot}>
              <button type="button" className={s.secondary} onClick={() => setHelpOpen(false)}>{z('合上')}</button>
            </div>
          </div>
        </div>
      )}

      {run.phase === 'ending' && ending && (
        <div className={s.ending} data-testid="as-ending" data-ending={run.ending}>
          {!endingIntroDone && (
            <div className={s.endingIntro} data-testid="as-ending-intro">
              <div className={s.endingIntroInner} aria-hidden="true">
                <p className={s.endingIntroDate}>{z('{date} / 结局归档', { date: turn.date })}</p>
                <h2 className={s.endingIntroTitle}>{ending.title}</h2>
                <div className={s.endingIntroSeats}>
                  {SEAT_ORDER.map((id, index) => (
                    <span
                      key={id}
                      className={s.endingIntroSeat + (signatures.includes(id) ? ' ' + s.endingIntroSeatSigned : '') + (id === 'mass' ? ' ' + s.endingIntroSeatEmpty : '')}
                      style={{ animationDelay: `${1.15 + index * 0.12}s` }}
                    >
                      {endingSeatLabel(id)}
                    </span>
                  ))}
                </div>
                <div className={s.endingIntroSigns}>
                  {[0, 1, 2, 3].map((line) => (
                    <i key={line} style={{ animationDelay: `${2.05 + line * 0.13}s` }} />
                  ))}
                </div>
                <span className={s.endingIntroStamp}>{z('归档')}</span>
                <span className={s.endingIntroFlash} />
              </div>
              <button type="button" className={s.endingSkip} onClick={() => setEndingIntroDone(true)} autoFocus>
                {z('跳过转场')}
              </button>
            </div>
          )}

          <img className={s.endingArt} src={ENDING_ART[run.ending ?? 'new-circle']} alt="" width={1152} height={648} />
          <div className={s.endingShade} aria-hidden="true" />
          <div className={s.endingArchive} aria-hidden="true">
            <span>{z('档案 08')}</span>
            <b>{z('结')}</b>
            <span>{z('归档')}</span>
          </div>

          <div className={s.endingCard + (endingIntroDone ? ' ' + s.endingCardReady : '')}>
            <div className={s.endingCardHead}>
              <p className={s.endingKicker}>{z('结局 / {kicker}', { kicker: ending.kicker })}</p>
              <span className={s.endingDate}>{turn.date}</span>
            </div>
            <h2 ref={endingTitleRef} tabIndex={-1} className={s.endingTitle}>{ending.title}</h2>
            <p className={s.endingLead}>{ending.body[0]}</p>
            <div className={s.endingBody}>
              {ending.body.slice(1).map((line) => <p key={line}>{line}</p>)}
            </div>
            <p className={s.endingFinal}>{ending.final}</p>
            <p className={s.endingMeta}>
              {z('手册 {n}/4', { n: passing })} · 减害 {percent(counts.harm, active)}% · 群众 {counts.mass}
            </p>
            <div className={s.endingActions}>
              <button type="button" className={s.primary} onClick={onRestart} data-testid="as-ending-restart">{z('再开一次')}</button>
              <button type="button" className={s.secondary} onClick={onExit} data-testid="as-ending-exit">{z('回到封面')}</button>
            </div>
          </div>
        </div>
      )}

    </article>
  );
}
