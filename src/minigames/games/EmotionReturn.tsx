import { useEffect, useRef, useState } from 'react';
import type { EmotionReturnGame } from '../../content/types';
import { useT } from '../../i18n';
import { shuffleArray } from '../shuffle';
import s from '../minigame.module.css';

export function EmotionReturn({
  data,
  onReady,
  onCaption,
}: {
  data: EmotionReturnGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [sources] = useState(() => shuffleArray(data.emotions));
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const tr = useT();
  const [note, setNote] = useState(() => tr('emotionReturn.start'));
  const readyRef = useRef(false);
  const all = matched.length >= data.emotions.length;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function chooseEmotion(emotion: (typeof data.emotions)[number]) {
    if (matched.includes(emotion.id)) return;
    setSelected(emotion.id);
    setNote(tr('emotionReturn.picked', { label: emotion.label }));
    onCaption(tr('emotionReturn.pickedCaption', { label: emotion.label }));
  }

  function chooseSource(source: (typeof data.emotions)[number]) {
    if (matched.includes(source.id)) return;
    if (!selected) {
      setNote(tr('emotionReturn.pickFirst'));
      onCaption(tr('emotionReturn.pickFirstCaption'));
      return;
    }
    if (selected === source.id) {
      setMatched((current) => [...current, source.id]);
      setSelected(null);
      setNote(tr('emotionReturn.putBack'));
      onCaption(source.line);
      return;
    }
    setNote(tr('emotionReturn.wrong'));
    onCaption(tr('emotionReturn.wrong'));
  }

  return (
    <div className={s.emotionReturn} data-testid="emotion-return-stage">
      <div className={s.emotionReturnChips} role="group" aria-label={tr('emotionReturn.chipsAria')}>
        <p className={s.emotionReturnHead}>{tr('emotionReturn.chipsHead')}</p>
        {data.emotions.map((emotion) => (
          <button
            key={emotion.id}
            type="button"
            className={s.emotionReturnChip}
            data-testid="emotion-chip"
            data-emotion={emotion.id}
            data-matched={matched.includes(emotion.id)}
            data-selected={selected === emotion.id}
            aria-pressed={selected === emotion.id}
            disabled={matched.includes(emotion.id)}
            onClick={() => chooseEmotion(emotion)}
          >
            <span className={s.emotionReturnDot} aria-hidden="true" />
            <span>{emotion.label}</span>
          </button>
        ))}
      </div>
      <div className={s.emotionReturnSources} role="group" aria-label={tr('emotionReturn.sourcesAria')}>
        <p className={s.emotionReturnHead}>{tr('emotionReturn.sourcesHead')}</p>
        {sources.map((source) => (
          <button
            key={source.id}
            type="button"
            className={s.emotionReturnSource}
            data-testid="emotion-source"
            data-source={source.id}
            data-matched={matched.includes(source.id)}
            disabled={matched.includes(source.id)}
            onClick={() => chooseSource(source)}
          >
            <span className={s.emotionReturnFrom}>{source.from}</span>
            <span>{source.line}</span>
          </button>
        ))}
      </div>
      <p className={s.emotionReturnNote} aria-live="polite">
        {all ? tr('emotionReturn.all') : note}
      </p>
      <span className={s.emotionReturnCount} aria-label={tr('emotionReturn.countAria', { a: matched.length, b: data.emotions.length })}>
        {matched.length} / {data.emotions.length}
      </span>
    </div>
  );
}
