import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AfterstoryGame } from '../afterstory/AfterstoryGame';
import { ChapterOpening } from '../openings/ChapterOpening';
import { AFTERSTORY_OPENING } from '../openings/afterstory';
import { ENDINGS } from '../afterstory/content';
import { createRun } from '../afterstory/engine';
import { useGameStore } from '../game/store';
import s from './AfterstoryPage.module.css';

export function AfterstoryPage() {
  const savedRun = useGameStore((state) => state.save.afterstory?.active);
  const seenEndings = useGameStore((state) => state.save.afterstory?.seenEndings);
  const setAfterstory = useGameStore((state) => state.setAfterstory);
  const markAfterstoryEnding = useGameStore((state) => state.markAfterstoryEnding);
  const resumableRun = savedRun && savedRun.phase !== 'ending' ? savedRun : undefined;
  const [started, setStarted] = useState(Boolean(resumableRun));
  const [opening, setOpening] = useState<'new' | 'rewatch' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (!started) headingRef.current?.focus({ preventScroll: true });
  }, [started]);

  useEffect(() => {
    for (const src of [
      '/assets/afterstory/entry_hero.png',
      '/assets/afterstory/event_01_return.png',
    ]) {
      const image = new Image();
      image.src = src;
    }
  }, []);

  const start = () => {
    if (!resumableRun) {
      setAfterstory(createRun(Date.now()));
      if (!prefersReducedMotion()) {
        setOpening('new');
        return;
      }
    }
    setStarted(true);
  };

  const restart = () => {
    setAfterstory(createRun(Date.now()));
    setStarted(true);
  };

  const finishOpening = () => {
    const mode = opening;
    setOpening(null);
    if (mode === 'new') setStarted(true);
  };

  const rewatchOpening = () => {
    if (!prefersReducedMotion()) setOpening('rewatch');
  };

  const exit = () => {
    // 结局页退出时清掉 active：否则再次打开档案会恢复已结束的 run。
    if (savedRun?.phase === 'ending') setAfterstory(undefined);
    setStarted(false);
  };

  if (opening) {
    return (
      <article className={s.page} data-view="opening">
        <div className={s.scan} aria-hidden="true" />
        <ChapterOpening opening={AFTERSTORY_OPENING} onDone={finishOpening} />
      </article>
    );
  }

  if (started && savedRun) {
    return (
      <article className={s.page} data-view="game">
        <div className={s.scan} aria-hidden="true" />
        <AfterstoryGame
          run={savedRun}
          onChange={setAfterstory}
          onExit={exit}
          onRestart={restart}
          onEnding={markAfterstoryEnding}
        />
      </article>
    );
  }

  return (
    <article className={s.page} data-view="cover">
      <div className={s.scan} aria-hidden="true" />
      <div className={s.view} key="cover">
        <section className={s.cover} aria-labelledby="afterstory-title">
          <img
            className={s.hero}
            src="/assets/afterstory/entry_hero.png"
            alt=""
            width={960}
            height={540}
            decoding="async"
          />
          <div className={s.coverShade} aria-hidden="true" />
          <div className={s.coverCopy}>
            <p className={s.eyebrow}>AFTERSTORY // 之后</p>
            <h1
              id="afterstory-title"
              ref={headingRef}
              tabIndex={-1}
              className={s.title}
              data-text="在漫长岁月之后"
            >
              在漫长岁月之后
            </h1>
            <p className={s.subtitle}>药圈重组 · 八回合 · 2026.01—05</p>
            <p className={s.blurb}>
              名单还没有公布。你回到一张旧桌子前，桌上有烟灰、旧帖、没写完的手册，
              和一百个还没有被说服的位置。八回合，一本手册，一个名字。
            </p>
            <button type="button" className={s.enterButton} onClick={start}>
              <span>{resumableRun ? '继续档案' : '打开档案'}</span>
              <span aria-hidden="true">→</span>
            </button>
            {resumableRun && (
              <p className={s.resumeNote}>
                进度：第 {resumableRun.turn} 回合 / 进行中
              </p>
            )}
            {seenEndings && seenEndings.length > 0 && (
              <p className={s.seenNote} data-testid="as-seen-endings">
                已归档 {seenEndings.length}/7 · {seenEndings.map((id) => ENDINGS[id].title).join(' / ')}
              </p>
            )}
          </div>
          <div className={s.coverStamp} aria-hidden="true">
            <span>档案 08</span>
            <span>2026.01</span>
          </div>
          <div className={s.coverFoot}>
            <span>八回合 / 一本手册 / 一个名字</span>
            <span className={s.coverFootActions}>
              <button type="button" className={s.rewatch} onClick={rewatchOpening}>重看开场</button>
              <Link to="/">← 主页</Link>
            </span>
          </div>
        </section>
      </div>
    </article>
  );
}
