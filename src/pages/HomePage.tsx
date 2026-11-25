import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import manifestoZh from '../content/home-manifesto.md?raw';
import manifestoEn from '../content/home-manifesto.en.md?raw';
import { SAMPLE_REPORT } from '../content/sample';
import { getChapterMeta, getReportMeta, getSceneMeta } from '../content/registry';
import { useGameStore } from '../game/store';
import { useLocale, useT } from '../i18n';
import p from './pages.module.css';

export function HomePage() {
  const tr = useT();
  const locale = useLocale();
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
  const chapterId = sceneMeta?.chapterId ?? 'ch01';
  const chapterTitle =
    getChapterMeta(chapterId)?.title ?? tr('home.fallbackChapter');
  const sceneNo = sceneMeta?.id.split('.').pop() ?? '01';
  const sceneTitle = sceneMeta?.title ?? tr('home.fallbackScene');
  const readCount = save.read[report.id]?.length ?? 0;
  const progress = save.completedScenes.length > 0 ? '42%' : '0%';
  const [dlcShake, setDlcShake] = useState(false);
  const dlcUnlocked = save.completedScenes.includes('ch01.s14');
  const manifesto = locale === 'en' ? manifestoEn : manifestoZh;
  const manifestoLines = manifesto.trim().split(/\r?\n/).filter(Boolean);

  return (
    <article className={p.page}>
      <h1 className={p.homeTitle}>Overdose Wiki</h1>
      <p className={p.homeSub}>
        {tr('home.established', {
          archived: String(save.completedScenes.length),
          unread: String(Math.max(0, report.segments.length - readCount)),
        })}
      </p>

      <div className={p.homeGrid}>
        <section className={p.continueBox} aria-labelledby="continue-title">
          <p id="continue-title" className={p.kicker}>
            {tr('home.continue')}
          </p>
          <p className={p.big}>
            {tr('home.chapterLine', { id: chapterId, title: chapterTitle })}
          </p>
          <p className={p.small}>
            {tr('home.sceneLine', { no: sceneNo, title: sceneTitle })}
          </p>
          <p className={`${p.small} ${p.muted}`} style={{ margin: 'calc(3 * var(--u)) 0' }}>
            {tr('home.lastRead')}
          </p>
          <div
            style={{
              height: 'calc(4 * var(--u))',
              border: 'var(--bw-2) solid var(--c-ink)',
              background: 'var(--c-paper2)',
              margin: 'calc(3 * var(--u)) 0',
            }}
            role="progressbar"
            aria-label={tr('home.progressAria')}
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
              {tr('home.continueButton')}
            </button>
          </div>
        </section>

        <div className={p.homeCards}>
          <Link className={p.homeCard} to="/chapters">
            <span className={p.homeCardKicker}>{tr('home.mainKicker')}</span>
            <span className={p.homeCardTitle}>ch01–04</span>
            <span className={p.homeCardMeta}>{tr('home.mainMeta')}</span>
          </Link>
          <div className={p.homeDlcRow}>
            {dlcUnlocked ? (
              <Link
                className={`${p.homeCard} ${p.homeDlcCard}`}
                to="/dlc/cover"
                aria-label={tr('home.dlcAria')}
                data-locked="false"
              >
                <span className={p.homeCardKicker}>DLC</span>
                <span className={p.homeCardTitle}>{tr('home.dlcTitle')}</span>
                <span className={p.homeCardMeta}>{tr('home.dlcMeta')}</span>
              </Link>
            ) : (
              <button
                type="button"
                className={`${p.homeCard} ${p.homeDlcCard} ${dlcShake ? p.homeCardShake : ''}`}
                aria-label={tr('home.dlcAria')}
                data-locked="true"
                title={tr('home.dlcLockedTitle')}
                onClick={() => setDlcShake(true)}
                onAnimationEnd={() => setDlcShake(false)}
              >
                <span className={p.homeCardKicker}>DLC</span>
                <span className={p.homeCardTitle}>{tr('home.dlcTitle')}</span>
                <span className={p.homeCardMeta}>{tr('home.dlcMeta')}</span>
              </button>
            )}
            <Link
              className={`${p.homeCard} ${p.homeAfterstoryCard}`}
              to="/afterstory"
              aria-label={tr('home.afterstoryAria')}
            >
              <span className={p.homeCardKicker}>DLC</span>
              <span className={p.homeCardTitle}>
                {tr('home.afterstoryLine1')}
                <br />
                {tr('home.afterstoryLine2')}
              </span>
              <span className={p.homeCardMeta}>{tr('home.afterstoryMeta')}</span>
            </Link>
          </div>
        </div>
      </div>

      <section className={p.manifesto} aria-label={tr('home.manifestoAria')}>
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
