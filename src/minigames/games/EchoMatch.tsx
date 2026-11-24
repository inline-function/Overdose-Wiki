import { useEffect, useRef, useState } from 'react';
import type { EchoMatchGame, EchoPair } from '../../content/types';
import { shuffleArray } from '../shuffle';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

export function EchoMatch({
  data,
  onReady,
  onCaption,
}: {
  data: EchoMatchGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const tr = useT();
  const [rightOrder] = useState(() => shuffleArray(data.pairs));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [note, setNote] = useState(() => tr('echo.start'));
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
    onCaption(tr('echo.pickCaption', { text: pair.left.text }));
  }

  function chooseRight(pair: EchoPair) {
    if (matched.includes(pair.id)) return;
    if (!selectedLeft) {
      setNote(tr('echo.first'));
      onCaption(tr('echo.firstCaption'));
      return;
    }
    if (selectedLeft === pair.id) {
      setMatched((current) => [...current, pair.id]);
      setSelectedLeft(null);
      setNote(pair.note);
      onCaption(pair.note);
      return;
    }
    setNote(tr('echo.wrong'));
    onCaption(tr('echo.wrongCaption'));
  }

  return (
    <div className={s.echo} data-testid="echo-stage">
      <div className={s.echoColumn} role="group" aria-label={tr('echo.leftAria')}>
        <p className={s.echoHead}>{tr('echo.leftHead')}</p>
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
      <div className={s.echoColumn} role="group" aria-label={tr('echo.rightAria')}>
        <p className={s.echoHead}>{tr('echo.rightHead')}</p>
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
      <span className={s.echoCount} aria-label={tr('echo.countAria', { n: matched.length })}>
        {matched.length} / {data.pairs.length}
      </span>
    </div>
  );
}
