import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import manifesto from '../content/home-manifesto.md?raw';
import { SAMPLE_REPORT } from '../content/sample';
import { getChapterMeta, getReportMeta, getSceneMeta } from '../content/registry';
import { useGameStore } from '../game/store';
import p from './pages.module.css';

export function HomePage() {
  const save = useGameStore((state) => state.save);
  const navigate = useNavigate();
  const report =
    getReportMeta('7') ?? {
      id: '7',
      no: 7,
      title: SAMPLE_REPORT.title,
      reporter: SAMPLE_REPORT.reporter,
      edited: SAMPLE_REPORT.edited,
      segments: SAMPLE_REPORT.segments.map((segment) => ({
        id: segment.id,
        label: segment.label,
        sceneId: segment.sceneId,
      })),
    };
  const segment = save.progress.segmentId ?? 'rp-7-1';
  const sceneMeta = save.progress.sceneId ? getSceneMeta(save.progress.sceneId) : undefined;
  const chapterTitle = getChapterMeta(sceneMeta?.chapterId ?? 'ch01')?.title ?? '虚数根';
  const sceneNo = sceneMeta?.id.split('.').pop() ?? '01';
  const sceneTitle = sceneMeta?.title ?? '档案室';
  const readCount = save.read[report.id]?.length ?? 0;
  const progress = save.completedScenes.length > 0 ? '42%' : '0%';
  const [dlcShake, setDlcShake] = useState(false);
  const manifestoLines = manifesto.trim().split(/\r?\n/).filter(Boolean);

  return (
    <article className={p.page}>
      <h1 className={p.homeTitle}>Overdose Wiki</h1>
      <p className={p.homeSub}>
        由后藤建立 / 处理者：你 / 已归档 {save.completedScenes.length} / 未读{' '}
        {Math.max(0, report.segments.length - readCount)}
      </p>

      <div className={p.homeGrid}>
        <section className={p.continueBox} aria-labelledby="continue-title">
          <p id="continue-title" className={p.kicker}>
            继续阅读
          </p>
          <p className={p.big}>ch01 · {chapterTitle}</p>
          <p className={p.small}>场景 {sceneNo} · {sceneTitle}</p>
          <p className={`${p.small} ${p.muted}`} style={{ margin: 'calc(3 * var(--u)) 0' }}>
            你上次读到：他说“不想死”的那一段。
          </p>
          <div
            style={{
              height: 'calc(4 * var(--u))',
              border: 'var(--bw-2) solid var(--c-ink)',
              background: 'var(--c-paper2)',
              margin: 'calc(3 * var(--u)) 0',
            }}
            role="progressbar"
            aria-label="阅读进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number.parseInt(progress, 10)}
          >
            <div
              style={{
                width: progress,
                height: '100%',
                background: 'var(--c-red)',
              }}
            />
          </div>
          <div className={p.inline} style={{ justifyContent: 'space-between' }}>
            <span className={p.small}>{progress}</span>
            <button
              type="button"
              className={p.pixelButton}
              onClick={() => navigate(`/report/${report.id}/replay/${segment}`)}
            >
              继续 →
            </button>
          </div>
        </section>

        <div className={p.homeCards}>
          <Link className={p.homeCard} to="/chapters">
            <span className={p.homeCardKicker}>主线</span>
            <span className={p.homeCardTitle}>ch01–04</span>
            <span className={p.homeCardMeta}>92 场 · 从虚数根到废墟</span>
          </Link>
          <div className={p.homeDlcRow}>
            <button
              type="button"
              className={`${p.homeCard} ${p.homeDlcCard} ${dlcShake ? p.homeCardShake : ''}`}
              aria-label="DLC 稍尽春风 8 场 · 番外（暂不可进入）"
              data-locked="true"
              title="暂不可进入"
              onClick={() => setDlcShake(true)}
              onAnimationEnd={() => setDlcShake(false)}
            >
              <span className={p.homeCardKicker}>DLC</span>
              <span className={p.homeCardTitle}>稍尽春风</span>
              <span className={p.homeCardMeta}>8 场 · 番外</span>
            </button>
            <Link
              className={`${p.homeCard} ${p.homeAfterstoryCard}`}
              to="/afterstory"
              aria-label="DLC 在漫长岁月之后 8 回合"
            >
              <span className={p.homeCardKicker}>DLC</span>
              <span className={p.homeCardTitle}>在漫长岁月<br />之后</span>
              <span className={p.homeCardMeta}>8 回合</span>
            </Link>
          </div>
        </div>
      </div>

      <section className={p.manifesto} aria-label="主页宣言">
        {manifestoLines.map((line, index) => (
          <p
            key={line}
            className={index === manifestoLines.length - 1 ? p.manifestoLast : p.manifestoLine}
          >
            {line}
          </p>
        ))}
      </section>
    </article>
  );
}
