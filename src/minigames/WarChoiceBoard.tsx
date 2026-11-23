import { useState } from 'react';
import type { RumorMapGame, TestimonyBoardGame, WarChoice } from '../content/types';
import type { WarTable } from '../game/types';
import { applyWarDecision, effectSummary } from '../game/warTable';
import s from './minigame.module.css';

const BASE = import.meta.env.BASE_URL;

type Game = RumorMapGame | TestimonyBoardGame;

export function WarChoiceBoard({
  data,
  warTable,
  onWarChange,
  onReady,
  onCaption,
  variant,
}: {
  data: Game;
  warTable: WarTable;
  onWarChange: (table: WarTable) => void;
  onReady: () => void;
  onCaption: (text: string) => void;
  variant: 'rumor' | 'testimony';
}) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<WarChoice | null>(null);
  const [finished, setFinished] = useState(false);
  const current = data.rounds[round];
  const last = round >= data.rounds.length - 1;
  const firstRound = data.rounds[0];
  const firstChoice = firstRound
    ? warTable.decisions[`${data.id}:${firstRound.id}`]?.choice
    : undefined;
  const reaction = round > 0 && firstChoice ? data.reactions?.[firstChoice] : undefined;

  function choose(choice: WarChoice) {
    if (selected || finished) return;
    const key = `${data.id}:${current.id}`;
    onWarChange(applyWarDecision(warTable, key, choice.id, choice.effects));
    setSelected(choice);
    onCaption(choice.result);
  }

  function next() {
    if (!selected) return;
    if (last) {
      if (finished) return;
      setFinished(true);
      onReady();
      onCaption(data.closing);
      return;
    }
    setRound((value) => value + 1);
    setSelected(null);
    onCaption(data.rounds[round + 1]?.prompt ?? data.intro);
  }

  return (
    <div
      className={`${s.warBoard} ${variant === 'rumor' ? s.warBoardRumor : s.warBoardTestimony}`}
      data-testid="war-board"
      data-variant={variant}
      data-round={round}
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.warBoardVeil} aria-hidden="true" />
      <div className={s.warBoardInner}>
        <div className={s.warBoardTop}>
          <span className={s.warBoardOperation}>{variant === 'rumor' ? '叙事战' : '合法性战场'}</span>
          <span className={s.warBoardRound}>{current.label ?? `第 ${round + 1} 回合`}</span>
        </div>
        <p className={s.warPrompt}>{current.prompt}</p>
        {reaction ? (
          <p className={s.warReaction} data-testid="war-reaction">
            <span>对手回应</span>
            {reaction}
          </p>
        ) : null}
        <div className={s.warOptions} role="group" aria-label="行动选项">
          {current.choices.map((choice) => {
            const hints = effectSummary(choice.effects);
            return (
              <button
                key={choice.id}
                type="button"
                className={s.warOption}
                data-testid="war-choice"
                data-choice={choice.id}
                data-tag={choice.tag ?? ''}
                aria-pressed={selected?.id === choice.id}
                disabled={Boolean(selected) || finished}
                onClick={() => choose(choice)}
              >
                <span className={s.warOptionTop}>
                  {choice.tag ? <span className={s.warOptionTag}>{choice.tag}</span> : null}
                  <span className={s.warOptionLabel}>{choice.label}</span>
                </span>
                <span className={s.warOptionDetail}>{choice.detail}</span>
                <span className={s.warOptionEffects}>
                  {hints.length ? hints.map((hint) => <span key={hint}>{hint}</span>) : '没有立刻改变化'}
                </span>
                <span className={s.warOptionAction}>
                  {selected?.id === choice.id ? '已执行' : '执行此项'}
                </span>
              </button>
            );
          })}
        </div>
        {selected ? (
          <div className={s.warResult} data-testid="war-result">
            <p className={s.warResultLine}>{selected.result}</p>
            <button type="button" className={s.warNext} data-testid="war-next" onClick={next}>
              {last ? '把这次行动归档' : '继续'}
            </button>
          </div>
        ) : (
          <p className={s.warHint}>选择一项行动。没有正确选项；只有谁先被写进档案。</p>
        )}
      </div>
    </div>
  );
}
