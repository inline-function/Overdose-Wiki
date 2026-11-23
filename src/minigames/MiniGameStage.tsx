import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MiniGameData } from '../content/types';
import type { WarTable } from '../game/types';
import { MemoryCollage } from './games/MemoryCollage';
import { ForumFix } from './games/ForumFix';
import { ChatTriage } from './games/ChatTriage';
import { TripTimeline } from './games/TripTimeline';
import { Perception } from './games/Perception';
import { WikiSort } from './games/WikiSort';
import { FindObjectGame } from './games/FindObjectGame';
import { Grounding } from './games/Grounding';
import { VoiceFilter } from './games/VoiceFilter';
import { PaintMix } from './games/PaintMix';
import { EchoMatch } from './games/EchoMatch';
import { SaviorAfter } from './games/SaviorAfter';
import { ArchiveEnvelope } from './games/ArchiveEnvelope';
import { MemoryDevelop } from './games/MemoryDevelop';
import { EmotionReturn } from './games/EmotionReturn';
import { AnchorRoom } from './games/AnchorRoom';
import { CameraWall } from './games/CameraWall';
import { RumorMap } from './games/RumorMap';
import { TestimonyBoard } from './games/TestimonyBoard';
import { RedactDocument } from './games/RedactDocument';
import { KnowledgeDossier } from './games/KnowledgeDossier';
import { WarTableHUD } from './WarTableHUD';
import s from './minigame.module.css';

type Props = {
  data: MiniGameData;
  onDone: () => void;
  onExit: () => void;
  completed?: boolean;
  warTable: WarTable;
  onWarChange: (table: WarTable) => void;
};

export function MiniGameStage({ data, onDone, onExit, completed = false, warTable, onWarChange }: Props) {
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState(data.intro);
  const [glitching, setGlitching] = useState(false);
  const [afterPost, setAfterPost] = useState(false);
  const [autoClosing, setAutoClosing] = useState(false);
  const windowRef = useRef<HTMLElement | null>(null);
  const postTimer = useRef<number | null>(null);
  const autoCloseTimer = useRef<number | null>(null);
  const post = data.kind === 'wiki-sort' ? data.postCompletion : undefined;

  useEffect(() => {
    windowRef.current?.focus();
  }, []);

  useEffect(() => {
    setGlitching(false);
    setAfterPost(false);
    setAutoClosing(false);
  }, [data.id]);

  useEffect(() => {
    return () => {
      if (postTimer.current !== null) window.clearTimeout(postTimer.current);
      if (autoCloseTimer.current !== null) window.clearTimeout(autoCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!autoClosing) onExit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [autoClosing, onExit]);

  const onReady = useCallback(() => setReady(true), []);
  const onCaption = useCallback((text: string) => setCaption(text), []);

  function handleArchiveDone() {
    if (autoClosing) return;
    setAutoClosing(true);
    autoCloseTimer.current = window.setTimeout(() => {
      autoCloseTimer.current = null;
      onDone();
    }, 1000);
  }

  function handleDone() {
    if (!post || afterPost) {
      onDone();
      return;
    }
    setGlitching(true);
    onCaption(post.glitchCaption);
    postTimer.current = window.setTimeout(() => {
      postTimer.current = null;
      setGlitching(false);
      setAfterPost(true);
      onCaption(post.caption);
    }, 1400);
  }

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
      case 'grounding':
        return <Grounding data={data} onReady={onReady} onCaption={onCaption} />;
      case 'voice-filter':
        return <VoiceFilter data={data} onReady={onReady} onCaption={onCaption} />;
      case 'paint-mix':
        return <PaintMix data={data} onReady={onReady} onCaption={onCaption} />;
      case 'echo-match':
        return <EchoMatch data={data} onReady={onReady} onCaption={onCaption} />;
      case 'archive-envelope':
        return <ArchiveEnvelope data={data} onCaption={onCaption} onDone={handleArchiveDone} />;
      case 'memory-develop':
        return <MemoryDevelop data={data} onReady={onReady} onCaption={onCaption} />;
      case 'emotion-return':
        return <EmotionReturn data={data} onReady={onReady} onCaption={onCaption} />;
      case 'anchor-room':
        return <AnchorRoom data={data} onReady={onReady} onCaption={onCaption} />;
      case 'camera-wall':
        return <CameraWall data={data} onReady={onReady} onCaption={onCaption} />;
      case 'rumor-map':
        return <RumorMap data={data} warTable={warTable} onWarChange={onWarChange} onReady={onReady} onCaption={onCaption} />;
      case 'testimony-board':
        return <TestimonyBoard data={data} warTable={warTable} onWarChange={onWarChange} onReady={onReady} onCaption={onCaption} />;
      case 'redact-document':
        return <RedactDocument data={data} warTable={warTable} onWarChange={onWarChange} onReady={onReady} onCaption={onCaption} />;
      case 'knowledge-dossier':
        return <KnowledgeDossier data={data} warTable={warTable} onWarChange={onWarChange} onReady={onReady} onCaption={onCaption} />;
    }
  })();

  return createPortal(
    <div className={s.overlay} data-testid="minigame-overlay" data-closing={autoClosing}>
      <section
        ref={windowRef}
        className={s.window}
        data-testid="minigame-stage"
        data-kind={data.kind}
        data-after-post={afterPost}
        data-glitching={glitching}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
        tabIndex={-1}
      >
        <div className={s.titleBar}>
          <span className={s.titleIcon} aria-hidden="true">▣</span>
          <span className={s.titleText}>{data.title}</span>
          <span className={s.titleCase}>
            {completed ? '已收入档案 · ' : ''}
            {data.subtitle}
          </span>
          <button
            type="button"
            className={s.winBtn}
            onClick={() => { if (!autoClosing) onExit(); }}
            disabled={autoClosing}
            aria-label="退出玩法"
            data-testid="minigame-exit"
          >
            ×
          </button>
        </div>
        <div className={s.body}>
          {afterPost ? null : <p className={s.intro}>{data.intro}</p>}
          {!afterPost && data.id.startsWith('ch04.') ? <WarTableHUD table={warTable} /> : null}
          <div className={s.game}>
            {afterPost && post ? <SaviorAfter data={post} /> : game}
          </div>
          <footer className={s.footer}>
            <span className={s.caption} data-testid="minigame-caption" aria-live="polite">
              {caption}
            </span>
            <button
              type="button"
              className={s.primary}
              onClick={handleDone}
              disabled={!ready || glitching}
              data-testid="minigame-done"
            >
              {glitching
                ? '……'
                : afterPost && post
                  ? (post.doneLabel ?? '关掉')
                  : ready
                    ? (data.doneLabel ?? '收入档案')
                    : '还差一点'}
            </button>
          </footer>
        </div>
        {glitching ? <div className={s.saviorGlitch} data-testid="savior-glitch" aria-hidden="true" /> : null}
      </section>
    </div>,
    document.body,
  );
}
