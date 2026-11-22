import { useEffect, useMemo, useRef, useState } from 'react';
import type { FindObjectGame } from '../../content/types';
import s from '../minigame.module.css';

const BG = `${import.meta.env.BASE_URL}assets-private/bg/bg_goto_room.png`;

export function FindObjectGame({
  data,
  onReady,
  onCaption,
}: {
  data: FindObjectGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [labels, setLabels] = useState(() => data.objects.map((object) => object.label));
  const wrongTimer = useRef<number | null>(null);
  const prompt = data.prompts[promptIndex];
  const last = promptIndex >= data.prompts.length - 1;

  const shuffledLabels = useMemo(() => labels, [labels]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || data.objects.length < 2) return;
    const timer = window.setInterval(() => {
      setLabels((current) => {
        const next = [...current];
        const first = next.shift();
        if (first) next.push(first);
        return next;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [data.objects.length]);

  useEffect(() => {
    return () => {
      if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current);
    };
  }, []);

  function clickObject(id: string) {
    if (!prompt) return;
    if (id === prompt.target) {
      const nextFound = found.includes(id) ? found : [...found, id];
      setFound(nextFound);
      setWrong(null);
      onCaption(`找到了。${prompt.text}。`);
      if (last) {
        onReady();
        onCaption(data.closing);
        return;
      }
      setPromptIndex((current) => current + 1);
      return;
    }
    setWrong(id);
    onCaption('不是这个。标签在换，东西也在换。');
    if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current);
    wrongTimer.current = window.setTimeout(() => setWrong(null), 650);
  }

  return (
    <div className={s.find} data-testid="find-stage">
      <div className={s.findStage} style={{ backgroundImage: `url("${BG}")` }} />
      <div className={s.findShade} />
      <div className={s.findPrompt} data-testid="find-prompt">
        {prompt?.text ?? data.closing}
      </div>
      <div className={s.findProgress}>
        找到 {found.length} / {data.prompts.length}
      </div>
      {data.objects.map((object, index) => (
        <button
          key={object.id}
          type="button"
          className={s.hotspot}
          data-testid="find-object"
          data-object={object.id}
          data-wrong={wrong === object.id}
          aria-label={`物体：${object.label}`}
          onClick={() => clickObject(object.id)}
          style={{
            left: `${object.x}%`,
            top: `${object.y}%`,
            width: `${object.w}%`,
            height: `${object.h}%`,
          }}
        >
          <span className={s.shape} data-shape={object.shape} aria-hidden="true" />
          <span className={s.hotspotLabel}>{shuffledLabels[index] ?? object.label}</span>
        </button>
      ))}
    </div>
  );
}
