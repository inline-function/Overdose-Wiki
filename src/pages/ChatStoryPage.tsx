import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sceneToChatFrames } from '../content/chatScene';
import { extraStoryPromise, reportPromise, scenePromise } from '../content/registry';
import type { ChatFrame } from '../content/types';
import { gateAudio } from '../audio/gateAudio';
import { useGameStore } from '../game/store';
import { useSuppressGuide } from '../ui/guideState';
import s from './ChatStoryPage.module.css';

// 开场先铺三条上下文；之后每次点击只推进一条。
const INITIAL_FRAMES = 3;

type ChatDocument = {
  title: string;
  contact: string;
  meta: string;
  frames: ChatFrame[];
  readTarget: string;
  readKey: string;
};

function frameName(frame?: ChatFrame): string | null {
  return frame && (frame.kind === 'left' || frame.kind === 'right') ? frame.name : null;
}

function FrameView({ frame, previous }: { frame: ChatFrame; previous?: ChatFrame }) {
  if (frame.kind === 'note') {
    return (
      <aside className={s.note}>
        {frame.label ? <span className={s.noteLabel}>{frame.label}</span> : null}
        <div className={s.noteText}>{frame.text}</div>
      </aside>
    );
  }
  if (frame.kind === 'narration') {
    return <p className={s.narration}>{frame.text}</p>;
  }
  const previousName = frameName(previous);
  const showName = previousName !== frame.name;
  return (
    <div className={`${s.bubble} ${frame.kind === 'left' ? s.left : s.right}`}>
      {showName ? <span className={s.who}>{frame.name}</span> : null}
      {frame.text}
    </div>
  );
}

export function ChatStoryPage() {
  const { id, sceneId } = useParams();
  const [doc, setDoc] = useState<ChatDocument>();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const markedRef = useRef(false);
  const markRead = useGameStore((state) => state.markRead);
  const reduce = useGameStore((state) => state.save.settings.motion === 'reduce');
  useSuppressGuide(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setDoc(undefined);

    async function load() {
      if (sceneId) {
        const scene = await scenePromise(sceneId);
        if (!alive) return;
        if (scene) {
          const report = scene.reportId ? await reportPromise(scene.reportId) : undefined;
          if (!alive) return;
          setDoc({
            title: report?.title ?? scene.title,
            contact: '散页',
            meta: report ? `报告 ${report.no} · 聊天记录` : '散页 · 聊天记录',
            frames: sceneToChatFrames(scene),
            readTarget: scene.id,
            readKey: `chat-${scene.id}`,
          });
        }
        setLoading(false);
        return;
      }

      const extra = await extraStoryPromise(id ?? '20');
      if (!alive) return;
      if (extra) {
        setDoc({
          title: extra.chat.title,
          contact: extra.chat.contact,
          meta:
            extra.kind === 'story'
              ? extra.chat.period
              : `与 ${extra.chat.owner} · ${extra.chat.period}`,
          frames: extra.chat.frames,
          readTarget: extra.id,
          readKey: `extra-${extra.id}`,
        });
        setLoading(false);
        return;
      }

      const report = await reportPromise(id ?? '20');
      if (!alive) return;
      if (report?.chat) {
        setDoc({
          title: report.chat.title,
          contact: report.chat.contact,
          meta: `${report.no}号 · 与 ${report.chat.owner} · ${report.chat.period}`,
          frames: report.chat.frames,
          readTarget: report.id,
          readKey: `chat-${report.id}`,
        });
      }
      setLoading(false);
    }

    void load();
    return () => {
      alive = false;
    };
  }, [id, sceneId]);

  const frames = doc?.frames ?? [];

  useEffect(() => {
    if (!doc) return;
    setCount(Math.min(INITIAL_FRAMES, doc.frames.length));
    markedRef.current = false;
    pinnedRef.current = true;
    setShowJump(false);
  }, [doc]);

  useEffect(() => {
    if (!doc || frames.length === 0) return;
    if (count < frames.length || markedRef.current) return;
    markedRef.current = true;
    markRead(doc.readTarget, [doc.readKey]);
  }, [doc, count, frames.length, markRead]);

  const advance = useCallback(() => {
    if (!doc) return;
    if (count >= doc.frames.length) return;
    gateAudio.unlock();
    gateAudio.write();
    setCount((current) => Math.min(current + 1, doc.frames.length));
  }, [doc, count]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select')) return;
      if (event.key !== ' ' && event.key !== 'Enter' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  useEffect(() => {
    const log = logRef.current;
    if (!log || !pinnedRef.current) return;
    log.scrollTop = log.scrollHeight;
  }, [count]);

  function onClickLog(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) return;
    advance();
  }

  function onScrollLog() {
    const log = logRef.current;
    if (!log) return;
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 20;
    pinnedRef.current = atBottom;
    setShowJump(!atBottom);
  }

  function jumpToBottom() {
    const log = logRef.current;
    if (!log) return;
    pinnedRef.current = true;
    setShowJump(false);
    log.scrollTop = log.scrollHeight;
  }

  function restart() {
    setCount(Math.min(INITIAL_FRAMES, frames.length));
    markedRef.current = false;
    pinnedRef.current = true;
    setShowJump(false);
    const log = logRef.current;
    if (log) log.scrollTop = 0;
    gateAudio.close();
  }

  if (loading) {
    return (
      <div className={s.loading} role="status">
        载入记录…
      </div>
    );
  }

  if (!doc) {
    return (
      <article className={s.missing}>
        <p className={s.kicker}>番外 / 记录</p>
        <h1 className={s.missingTitle}>记录未找到</h1>
        <p className={s.missingText}>这篇番外只在私有档案中提供。</p>
        <Link className={s.back} to="/extras">
          返回番外
        </Link>
      </article>
    );
  }

  const done = count >= frames.length;

  return (
    <article className={s.page} data-reduce={reduce ? 'true' : 'false'}>
      <h1 className={s.srOnly}>{doc.title}</h1>

      <section className={s.chatShell} aria-label={`${doc.title}记录`}>
        <header className={s.chatHead}>
          <span className={s.chatName}>{doc.contact}</span>
          <span className={s.chatMeta}>{doc.meta}</span>
          <span className={s.chatState}>只读</span>
          <Link className={`${s.back} ${s.chatBack}`} to="/extras">
            返回番外
          </Link>
        </header>

        <div
          ref={logRef}
          className={s.log}
          role="log"
          aria-label={`${doc.title}记录`}
          tabIndex={0}
          onClick={onClickLog}
          onScroll={onScrollLog}
        >
          {frames.slice(0, count).map((frame, index) => (
            <FrameView key={index} frame={frame} previous={frames[index - 1]} />
          ))}
        </div>

        <footer className={s.footer}>
          {done ? (
            <>
              <span className={s.endMark}>记录结束</span>
              {showJump ? (
                <button type="button" className={s.ghost} onClick={jumpToBottom}>
                  回到底部
                </button>
              ) : null}
              <button type="button" className={s.ghost} onClick={restart}>
                重看
              </button>
              <span className={s.progress}>
                {count}/{frames.length}
              </span>
            </>
          ) : (
            <>
              <button type="button" className={s.advance} onClick={advance}>
                继续
              </button>
              <span className={s.hint}>点击记录 / 空格</span>
              {showJump ? (
                <button type="button" className={s.ghost} onClick={jumpToBottom}>
                  回到底部
                </button>
              ) : null}
              <span className={s.progress}>
                {count}/{frames.length}
              </span>
            </>
          )}
        </footer>
      </section>
    </article>
  );
}
