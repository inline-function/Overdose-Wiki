import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PerceptionGame } from '../../content/types';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

const BASE = import.meta.env.BASE_URL;
const COLORS = ['#f0c866', '#e8e0cc', '#8fa8b8', '#d98f9b', '#7f9a6b', '#5b8fa8', '#e8c87a', '#f2d9cf'];

type WordLook = {
  color: string;
  angle: number;
  fadeMin: number;
  fadeMax: number;
  fadeDuration: number;
  fadeDelay: number;
  jitterDuration: number;
  jitterDelay: number;
  typeStep: number;
};

export function Perception({
  data,
  onReady,
  onCaption,
}: {
  data: PerceptionGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const tr = useT();
  const required = Math.min(data.required ?? 6, data.words.length);
  const [caught, setCaught] = useState<string[]>([]);
  const readyRef = useRef(false);
  const [looks] = useState<WordLook[]>(() =>
    data.words.map((_, index) => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: -12 + Math.round(Math.random() * 24),
      fadeMin: 0.14 + Math.random() * 0.16,
      fadeMax: 0.58 + Math.random() * 0.28,
      fadeDuration: 2.8 + Math.random() * 2.4,
      fadeDelay: -Math.random() * 4,
      jitterDuration: 1.4 + Math.random() * 1.8,
      jitterDelay: -Math.random() * 2,
      typeStep: 0.035 + (index % 4) * 0.012,
    })),
  );

  useEffect(() => {
    if (caught.length < required || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [caught.length, required, data.closing, onReady, onCaption]);

  function catchWord(id: string, note: string | undefined, text: string) {
    if (caught.includes(id)) return;
    setCaught((current) => [...current, id]);
    onCaption(note ?? tr('perception.grab', { text }));
  }

  return (
    <div className={s.perception} data-testid="perception-stage">
      <div
        className={s.perceptionBg}
        style={{ backgroundImage: `url("${BASE}assets-private/bg/bg_plateau.png")` }}
        aria-hidden="true"
      />
      <div className={s.perceptionFlow} aria-hidden="true" />
      <div className={s.perceptionFlowB} aria-hidden="true" />
      <div className={s.perceptionVeil} aria-hidden="true" />
      <p className={s.perceptionHint}>{tr('perception.hint', { n: required })}</p>
      {data.words.map((word, index) => {
        const done = caught.includes(word.id);
        const look = looks[index];
        return (
          <button
            key={word.id}
            type="button"
            className={s.perceptionWord}
            data-testid="perception-word"
            data-word={word.id}
            data-caught={done}
            aria-label={word.text}
            aria-pressed={done}
            onClick={() => catchWord(word.id, word.note, word.text)}
            style={
              {
                left: `${word.x}%`,
                top: `${word.y}%`,
                '--word-color': look.color,
                '--tilt': `${look.angle}deg`,
                '--fade-min': look.fadeMin,
                '--fade-max': look.fadeMax,
                '--fade-duration': `${look.fadeDuration}s`,
                '--fade-delay': `${look.fadeDelay}s`,
                '--jitter-duration': `${look.jitterDuration}s`,
                '--jitter-delay': `${look.jitterDelay}s`,
              } as CSSProperties
            }
          >
            {Array.from(word.text).map((char, charIndex) => (
              <span
                key={`${word.id}-${charIndex}`}
                className={s.perceptionChar}
                aria-hidden="true"
                style={{ animationDelay: `${charIndex * look.typeStep}s` }}
              >
                {char}
              </span>
            ))}
          </button>
        );
      })}
      <div className={s.perceptionProgress} data-testid="perception-progress">
        <span>
          {tr('perception.caught', { a: caught.length, b: required })}
        </span>
        <span className={s.perceptionDots} aria-hidden="true">
          {data.words.map((word) => (
            <span key={word.id} className={s.perceptionDot} data-done={caught.includes(word.id)} />
          ))}
        </span>
      </div>
    </div>
  );
}
