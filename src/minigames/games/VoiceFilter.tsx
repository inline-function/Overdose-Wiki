import { useEffect, useRef, useState } from 'react';
import type { VoiceFilterGame, VoiceLine } from '../../content/types';
import s from '../minigame.module.css';

type Choice = 'check' | 'inside';

export function VoiceFilter({
  data,
  onReady,
  onCaption,
}: {
  data: VoiceFilterGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const readyRef = useRef(false);
  const assigned = Object.keys(choices).length;
  const all = assigned >= data.lines.length;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function choose(line: VoiceLine, choice: Choice) {
    setChoices((current) => ({ ...current, [line.id]: choice }));
    if (choice === line.suggested) {
      onCaption(
        choice === 'check'
          ? '这句能和聊天记录对上。先把它放在外面。'
          : '这句只能先听她说。别把它当成事实。',
      );
      return;
    }
    onCaption('先不用替她判断。这里没有标准答案，重要的是别替她下结论。');
  }

  return (
    <div className={s.voiceFilter} data-testid="voice-stage">
      <div className={s.voiceHeader}>
        <span>她听见的声音</span>
        <span className={s.voiceCount} aria-label={`已归类 ${assigned} 条`}>
          {assigned} / {data.lines.length}
        </span>
      </div>
      <div className={s.voiceList}>
        {data.lines.map((line) => {
          const choice = choices[line.id];
          return (
            <div
              key={line.id}
              className={s.voiceRow}
              data-testid="voice-line"
              data-line={line.id}
              data-choice={choice ?? ''}
            >
              <span className={s.voiceWho}>{line.speaker}</span>
              <span className={s.voiceText}>{line.text}</span>
              <span
                className={s.voiceChoices}
                role="group"
                aria-label={`归类这条声音：${line.text}`}
              >
                <button
                  type="button"
                  className={s.voiceChoice}
                  data-testid="voice-choice"
                  data-choice="check"
                  aria-pressed={choice === 'check'}
                  onClick={() => choose(line, 'check')}
                >
                  能核对
                </button>
                <button
                  type="button"
                  className={s.voiceChoice}
                  data-testid="voice-choice"
                  data-choice="inside"
                  aria-pressed={choice === 'inside'}
                  onClick={() => choose(line, 'inside')}
                >
                  只在里面
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
