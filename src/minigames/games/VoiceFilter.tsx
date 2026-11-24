import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { VoiceFilterGame, VoiceLine } from '../../content/types';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

const BASE = import.meta.env.BASE_URL;
const COLORS = ['#f0c866', '#e8e0cc', '#8fa8b8', '#d98f9b', '#a9b88f', '#d8a36a', '#c9b6cf'];
const COLS = 5;
const ROWS = 5;
const DISPEL_KEYS = ['voice.dispel0', 'voice.dispel1', 'voice.dispel2', 'voice.dispel3'] as const;

type Look = {
  x: number;
  y: number;
  color: string;
  angle: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  large: boolean;
};

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeLooks(count: number): Look[] {
  const slots = shuffled(Array.from({ length: COLS * ROWS }, (_, index) => index));
  return Array.from({ length: count }, (_, index) => {
    const slot = slots[index % slots.length];
    const col = slot % COLS;
    const row = Math.floor(slot / COLS);
    return {
      x: ((col + 0.5) / COLS) * 100 + (Math.random() - 0.5) * 2.4,
      y: ((row + 0.5) / ROWS) * 100 + (Math.random() - 0.5) * 2.4,
      color: COLORS[index % COLORS.length],
      angle: -16 + Math.round(Math.random() * 32),
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 3,
      duration: 4.2 + Math.random() * 4.8,
      delay: -Math.random() * 7,
      large: index % 6 === 0,
    };
  });
}

export function VoiceFilter({
  data,
  onReady,
  onCaption,
}: {
  data: VoiceFilterGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const tr = useT();
  const [removed, setRemoved] = useState<string[]>([]);
  const [looks] = useState(() => makeLooks(data.voices.length));
  const readyRef = useRef(false);
  const remaining = data.voices.length - removed.length;
  const all = remaining === 0;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function dispel(voice: VoiceLine) {
    setRemoved((current) => (current.includes(voice.id) ? current : [...current, voice.id]));
    onCaption(tr(DISPEL_KEYS[removed.length % DISPEL_KEYS.length]));
  }

  return (
    <div className={s.voiceStage} data-testid="voice-stage">
      <div
        className={s.voiceBg}
        data-testid="voice-backdrop"
        style={{ backgroundImage: `url("${BASE}${data.image}")` }}
        aria-hidden="true"
      />
      <div className={s.voiceWarp} aria-hidden="true" />
      <div className={s.voiceFlow} aria-hidden="true" />
      <div className={s.voiceFlowB} aria-hidden="true" />
      <div className={s.voiceVeil} aria-hidden="true" />
      <div className={s.voiceNoise} aria-hidden="true" />
      <p className={s.voiceHint}>{tr('voice.hint')}</p>
      {data.voices.map((voice, index) => {
        if (removed.includes(voice.id)) return null;
        const look = looks[index];
        return (
          <button
            key={voice.id}
            type="button"
            className={s.voiceGhost}
            data-testid="voice-ghost"
            data-voice={voice.id}
            data-large={look.large}
            aria-label={tr('voice.muteAria', { text: voice.text })}
            style={
              {
                left: `${look.x}%`,
                top: `${look.y}%`,
                '--word-color': look.color,
                '--tilt': `${look.angle}deg`,
                '--dx': look.dx,
                '--dy': look.dy,
                '--drift-duration': `${look.duration}s`,
                '--drift-delay': `${look.delay}s`,
              } as CSSProperties
            }
            onClick={() => dispel(voice)}
          >
            {voice.text}
          </button>
        );
      })}
      <div className={s.voiceProgress} data-testid="voice-progress">
        <span>{tr('voice.ringing')}</span>
        <span className={s.voiceProgressNumber}>{remaining}</span>
      </div>
    </div>
  );
}
