import { useEffect, useRef, useState } from 'react';
import type { EmotionReturnGame } from '../../content/types';
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
  const [note, setNote] = useState('先点一团情绪。');
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
    setNote(`这是「${emotion.label}」。它从哪条消息来？`);
    onCaption(`先看这一团：${emotion.label}。`);
  }

  function chooseSource(source: (typeof data.emotions)[number]) {
    if (matched.includes(source.id)) return;
    if (!selected) {
      setNote('先点左边的一团情绪。');
      onCaption('先点左边的一团情绪，再找它来的那条消息。');
      return;
    }
    if (selected === source.id) {
      setMatched((current) => [...current, source.id]);
      setSelected(null);
      setNote('放回去了。手机轻了一点。');
      onCaption(source.line);
      return;
    }
    setNote('不是这一条。再看一眼。');
    onCaption('不是这一条。再看一眼。');
  }

  return (
    <div className={s.emotionReturn} data-testid="emotion-return-stage">
      <div className={s.emotionReturnChips} role="group" aria-label="不属于她的情绪">
        <p className={s.emotionReturnHead}>压在她身上的</p>
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
      <div className={s.emotionReturnSources} role="group" aria-label="这些情绪从哪里来">
        <p className={s.emotionReturnHead}>消息里</p>
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
        {all ? '手机还亮着。她还没有放下。' : note}
      </p>
      <span className={s.emotionReturnCount} aria-label={`已放回 ${matched.length} 组，共 ${data.emotions.length} 组`}>
        {matched.length} / {data.emotions.length}
      </span>
    </div>
  );
}
