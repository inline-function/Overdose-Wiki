import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MiniGameData } from '../content/types';
import { MemoryCollage } from './games/MemoryCollage';
import { ForumFix } from './games/ForumFix';
import { ChatTriage } from './games/ChatTriage';
import { TripTimeline } from './games/TripTimeline';
import { Perception } from './games/Perception';
import { WikiSort } from './games/WikiSort';
import { FindObjectGame } from './games/FindObjectGame';
import s from './minigame.module.css';

type Props = {
  data: MiniGameData;
  onDone: () => void;
  onExit: () => void;
  completed?: boolean;
};

export function MiniGameStage({ data, onDone, onExit, completed = false }: Props) {
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState(data.intro);
  const windowRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    windowRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onExit]);

  const onReady = useCallback(() => setReady(true), []);
  const onCaption = useCallback((text: string) => setCaption(text), []);

  const game = (() => {
    switch (data.kind) {
      case 'memory-collage':
        return <MemoryCollage data={data} onReady={onReady} onCaption={onCaption} />;
      case 'forum-fix':
        return <ForumFix data={data} onReady={onReady} onCaption={onCaption} />;
      case 'chat-triage':
        return <ChatTriage data={data} onReady={onReady} onCaption={onCaption} />;
      case 'trip-timeline':
        return <TripTimeline data={data} onReady={onReady} onCaption={onCaption} />;
      case 'perception':
        return <Perception data={data} onReady={onReady} onCaption={onCaption} />;
      case 'wiki-sort':
        return <WikiSort data={data} onReady={onReady} onCaption={onCaption} />;
      case 'find-object':
        return <FindObjectGame data={data} onReady={onReady} onCaption={onCaption} />;
    }
  })();

  return createPortal(
    <div className={s.overlay} data-testid="minigame-overlay">
      <section
        ref={windowRef}
        className={s.window}
        data-testid="minigame-stage"
        data-kind={data.kind}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
        tabIndex={-1}
      >
        <header className={s.titleBar}>
          <span className={s.titleIcon} aria-hidden="true">▣</span>
          <span className={s.titleText}>{data.title}</span>
          <span className={s.titleCase}>
            {completed ? '已收入档案 · ' : ''}
            {data.subtitle}
          </span>
          <button
            type="button"
            className={s.winBtn}
            onClick={onExit}
            aria-label="退出玩法"
            data-testid="minigame-exit"
          >
            ×
          </button>
        </header>
        <div className={s.body}>
          <p className={s.intro}>{data.intro}</p>
          <div className={s.game}>{game}</div>
          <footer className={s.footer}>
            <span className={s.caption} data-testid="minigame-caption" aria-live="polite">
              {caption}
            </span>
            <button
              type="button"
              className={s.primary}
              onClick={onDone}
              disabled={!ready}
              data-testid="minigame-done"
            >
              {ready ? (data.doneLabel ?? '收入档案') : '还差一点'}
            </button>
          </footer>
        </div>
      </section>
    </div>,
    document.body,
  );
}
