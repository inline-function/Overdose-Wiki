import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { FindObjectGame } from '../../content/types';
import { shuffleArray } from '../shuffle';
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
  const [glitch, setGlitch] = useState(false);
  const wrongTimer = useRef<number | null>(null);
  const glitchTimer = useRef<number | null>(null);
  const reduceRef = useRef(false);
  const prompt = data.prompts[promptIndex];
  const last = promptIndex >= data.prompts.length - 1;

  useEffect(() => {
    reduceRef.current =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceRef.current || data.objects.length < 2) return;
    const timer = window.setInterval(() => {
      setLabels((current) => shuffleArray(current));
    }, 1150);
    return () => window.clearInterval(timer);
  }, [data.objects.length]);

  useEffect(() => {
    if (reduceRef.current) return;
    let burst: number | null = null;
    let reset: number | null = null;
    const schedule = () => {
      burst = window.setTimeout(() => {
        setGlitch(true);
        reset = window.setTimeout(() => {
          setGlitch(false);
          schedule();
        }, 150 + Math.random() * 160);
      }, 1600 + Math.random() * 1900);
    };
    schedule();
    return () => {
      if (burst !== null) window.clearTimeout(burst);
      if (reset !== null) window.clearTimeout(reset);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current);
      if (glitchTimer.current !== null) window.clearTimeout(glitchTimer.current);
    };
  }, []);

  function kickGlitch(duration = 420) {
    if (reduceRef.current) return;
    setGlitch(true);
    if (glitchTimer.current !== null) window.clearTimeout(glitchTimer.current);
    glitchTimer.current = window.setTimeout(() => setGlitch(false), duration);
  }

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
    onCaption('不是这个。标签在换，东西也在换。信号不稳。');
    kickGlitch(500);
    if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current);
    wrongTimer.current = window.setTimeout(() => setWrong(null), 650);
  }

  return (
    <div className={s.find} data-testid="find-stage" data-glitch={glitch} data-chaos={found.length}>
      <div
        className={s.findStage}
        style={{ backgroundImage: `url("${BG}")` }}
        aria-hidden="true"
      />
      <div className={s.findFlow} aria-hidden="true" />
      <div
        className={s.findRgb}
        data-channel="red"
        style={{ backgroundImage: `url("${BG}")` }}
        aria-hidden="true"
      />
      <div
        className={s.findRgb}
        data-channel="cyan"
        style={{ backgroundImage: `url("${BG}")` }}
        aria-hidden="true"
      />
      <div className={s.findShade} aria-hidden="true" />
      <div className={s.findNoise} aria-hidden="true" />
      <div className={s.findPrompt} data-testid="find-prompt">
        {prompt?.text ?? data.closing}
      </div>
      <span className={s.findSignal} aria-hidden="true">
        谵妄 / 信号不稳
      </span>
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
          style={
            {
              left: `${object.x}%`,
              top: `${object.y}%`,
              width: `${object.w}%`,
              height: `${object.h}%`,
              '--jitter-duration': `${1.8 + (index % 3) * 0.5}s`,
              '--jitter-delay': `${-(index * 0.7)}s`,
            } as CSSProperties
          }
        >
          <span className={s.shape} data-shape={object.shape} aria-hidden="true" />
          <span className={s.hotspotLabel}>{labels[index] ?? object.label}</span>
        </button>
      ))}
    </div>
  );
}
