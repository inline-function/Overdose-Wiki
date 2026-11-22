import { useEffect, useRef, useState } from 'react';
import type { EchoMatchGame, EchoPair } from '../../content/types';
import { shuffleArray } from '../shuffle';
import s from '../minigame.module.css';

export function EchoMatch({
  data,
  onReady,
  onCaption,
}: {
  data: EchoMatchGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [rightOrder] = useState(() => shuffleArray(data.pairs));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [note, setNote] = useState('先点左边一句。');
  const readyRef = useRef(false);
  const all = matched.length >= data.pairs.length;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function chooseLeft(pair: EchoPair) {
    if (matched.includes(pair.id)) return;
    setSelectedLeft(pair.id);
    setNote(`${pair.left.speaker}：${pair.left.text}`);
    onCaption(`她说：${pair.left.text}`);
  }

  function chooseRight(pair: EchoPair) {
    if (matched.includes(pair.id)) return;
    if (!selectedLeft) {
      setNote('先点左边她说的那一句。');
      onCaption('先选左边一句，再找右边的回音。');
      return;
    }
    if (selectedLeft === pair.id) {
      setMatched((current) => [...current, pair.id]);
      setSelectedLeft(null);
      setNote(pair.note);
      onCaption(pair.note);
      return;
    }
    setNote('不是这一句。她说的和这句之间，还隔着一层。');
    onCaption('不是这一句。再听一遍。');
  }

  return (
    <div className={s.echo} data-testid="echo-stage">
      <div className={s.echoColumn} role="group" aria-label="她说的">
        <p className={s.echoHead}>她说的</p>
        {data.pairs.map((pair) => (
          <button
            key={pair.id}
            type="button"
            className={s.echoLine}
            data-testid="echo-left"
            data-pair={pair.id}
            data-matched={matched.includes(pair.id)}
            data-selected={selectedLeft === pair.id}
            aria-pressed={selectedLeft === pair.id}
            disabled={matched.includes(pair.id)}
            onClick={() => chooseLeft(pair)}
          >
            <span className={s.echoWho}>{pair.left.speaker}</span>
            <span>{pair.left.text}</span>
          </button>
        ))}
      </div>
      <div className={s.echoColumn} role="group" aria-label="你听见的">
        <p className={s.echoHead}>你听见的</p>
        {rightOrder.map((pair) => (
          <button
            key={pair.id}
            type="button"
            className={s.echoLine}
            data-testid="echo-right"
            data-pair={pair.id}
            data-matched={matched.includes(pair.id)}
            disabled={matched.includes(pair.id)}
            onClick={() => chooseRight(pair)}
          >
            <span className={s.echoWho}>{pair.right.speaker}</span>
            <span>{pair.right.text}</span>
          </button>
        ))}
      </div>
      <p className={s.echoNote} aria-live="polite">
        {note}
      </p>
      <span className={s.echoCount} aria-label={`已连上 ${matched.length} 对`}>
        {matched.length} / {data.pairs.length}
      </span>
    </div>
  );
}
