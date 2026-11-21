import { useEffect, useRef } from 'react';
import { audio } from '../audio/AudioManager';
import { gateAudio } from '../audio/gateAudio';
import type { CanvasOpening } from './registry';
import g from './openings.module.css';

function playSfx(key: string) {
  switch (key) {
    case 'origin':
      gateAudio.origin();
      break;
    case 'axis':
      gateAudio.axis();
      break;
    case 'circle':
      gateAudio.circle();
      break;
    case 'root0':
      gateAudio.root(0);
      break;
    case 'root1':
      gateAudio.root(1);
      break;
    case 'root2':
      gateAudio.root(2);
      break;
    case 'cut':
      gateAudio.cut();
      break;
    case 'shatter':
      gateAudio.shatter();
      break;
    case 'write':
      gateAudio.write();
      break;
    case 'vanish':
      gateAudio.vanish();
      break;
    case 'appear':
      gateAudio.capsule();
      break;
    case 'spin':
      gateAudio.spin();
      break;
    case 'morph':
      gateAudio.morph();
      break;
    case 'crack':
      gateAudio.crack();
      break;
    case 'burst':
      gateAudio.burst();
      break;
    case 'shimmer':
      gateAudio.shimmer();
      break;
    case 'bugs':
      gateAudio.bugs();
      break;
    case 'fall':
      gateAudio.fall();
      break;
    case 'drip':
      gateAudio.drip();
      break;
    case 'heartbeat':
      gateAudio.heartbeat();
      break;
    case 'focus':
      gateAudio.focus();
      break;
    case 'hiss':
      gateAudio.hiss();
      break;
    case 'stamp':
      gateAudio.stamp();
      break;
    case 'tick':
      gateAudio.tick();
      break;
    case 'paper':
      gateAudio.paper();
      break;
    case 'fire':
      gateAudio.fire();
      break;
    default:
      break;
  }
}

export function ChapterOpening({
  opening,
  onDone,
}: {
  opening: CanvasOpening;
  onDone: (completed: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    audio.stopBgm();
    gateAudio.unlock();

    let frame = 0;
    let time = 0;
    let started = 0;
    const fired = new Set<number>();
    const finish = (completed: boolean) => {
      if (done.current) return;
      done.current = true;
      if (frame) window.cancelAnimationFrame(frame);
      onDoneRef.current(completed);
    };
    const start = () => {
      started = performance.now();
      const loop = (now: number) => {
        time = (now - started) / 1000;
        opening.draw(ctx, time);
        canvas.dataset.introTime = time.toFixed(2);
        opening.sfx.forEach((event, index) => {
          if (time < event.t || fired.has(index)) return;
          fired.add(index);
          playSfx(event.key);
        });
        if (time >= opening.duration) {
          finish(true);
          return;
        }
        frame = window.requestAnimationFrame(loop);
      };
      frame = window.requestAnimationFrame(loop);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Escape') return;
      event.preventDefault();
      finish(false);
    };
    window.addEventListener('keydown', onKey);
    const ready = document.fonts?.ready ?? Promise.resolve();
    void ready.then(() => {
      if (!done.current) start();
    });

    return () => {
      window.removeEventListener('keydown', onKey);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [opening]);

  return (
    <div className={g.opening} data-testid="chapter-opening">
      <canvas
        ref={canvasRef}
        className={`${g.canvas} pixelated`}
        width={352}
        height={198}
        role="img"
        aria-label={opening.ariaLabel}
        data-testid="opening-canvas"
      />
      <span className="sr-only">{opening.caption}</span>
      <button
        type="button"
        className={g.skip}
        onClick={() => {
          if (done.current) return;
          done.current = true;
          audio.stopBgm();
          const canvas = canvasRef.current;
          if (canvas) canvas.dataset.introTime = 'skipped';
          onDoneRef.current(false);
        }}
      >
        跳过
      </button>
    </div>
  );
}
