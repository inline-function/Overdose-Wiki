import { use, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Effect, EffectBlock, Report, ReportBlock } from '../content/types';
import { effectPromise, getEffectMetas, getReportMetas, hasContent, reportPromise } from '../content/registry';
import { drugWarText } from '../content/drugWar';
import { useGameStore } from '../game/store';
import { useT } from '../i18n';
import { DocWriter } from './DocWriter';
import p from './pages.module.css';

export function DocsPage() {
  const tr = useT();
  const save = useGameStore((state) => state.save);
  const readDoc = useGameStore((state) => state.readDoc);
  const readEffect = useGameStore((state) => state.readEffect);
  const [reader, setReader] = useState<string | null>(null);
  const [warOpen, setWarOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const writeId = params.get('write');
  const effectId = params.get('effect');
  const docs = getReportMetas()
    .filter((report) => report.no >= 100)
    .sort((a, b) => a.no - b.no);
  const effects = getEffectMetas();
  const written = docs.filter((report) => (save.read[report.id]?.length ?? 0) > 0);
  const writtenEffects = effects.filter((effect) => save.readEffects.includes(effect.id));
  const warUnlocked = hasContent() && save.completedScenes.includes('ch04.s40');
  const targetDoc = writeId ? docs.find((report) => report.id === writeId) : undefined;
  const targetEffect = effectId ? effects.find((effect) => effect.id === effectId) : undefined;
  const targetRead = targetDoc ? (save.read[targetDoc.id]?.length ?? 0) > 0 : false;
  const targetEffectRead = targetEffect ? save.readEffects.includes(targetEffect.id) : false;
  const closeWriter = () => setParams({}, { replace: true });

  useEffect(() => {
    if (!reader) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReader(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reader]);

  useEffect(() => {
    if (!writeId && !effectId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWriter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeId, effectId]);

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('docs.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('docs.title')}</h1>
      <p className={p.p}>{tr('docs.intro')}</p>

      {written.length === 0 && writtenEffects.length === 0 && !warUnlocked ? (
        <div className={p.docEmpty} role="status">
          <span className={p.docEmptyMark} aria-hidden="true">
            ▢
          </span>
          <p className={p.small}>{tr('docs.empty')}</p>
        </div>
      ) : (
        <div className={p.archiveGrid}>
          {writtenEffects.map((effect) => (
            <button
              key={`effect-${effect.id}`}
              type="button"
              className={p.archiveCard}
              onClick={() => setReader(effect.id)}
            >
              <span className={p.archiveTitle}>
                {tr('docs.effectCard', { title: effect.title })}
              </span>
              <span className={p.archiveMeta}>{tr('docs.effectMeta')}</span>
            </button>
          ))}
          {warUnlocked && (
            <button type="button" className={p.archiveCard} onClick={() => setWarOpen(true)}>
              <span className={p.archiveTitle}>{tr('docs.warCard')}</span>
              <span className={p.archiveMeta}>{tr('docs.warMeta')}</span>
            </button>
          )}
          {written.map((report) => (
            <Link key={report.id} className={p.archiveCard} to={`/report/${report.id}`}>
              <span className={p.archiveTitle}>
                {tr('docs.docCard', { no: String(report.no), title: report.title })}
              </span>
              <span className={p.archiveMeta}>
                {tr('docs.docMeta', { reporter: report.reporter, edited: report.edited })}
              </span>
            </Link>
          ))}
        </div>
      )}

      {targetDoc && !targetRead && (
        <DocWindow
          title={targetDoc.title}
          source={reportPromise(targetDoc.id)}
          onClose={closeWriter}
          onWritten={() => {
            readDoc(targetDoc.id, targetDoc.segments[0]?.id ?? `report-${targetDoc.id}-full`);
            closeWriter();
          }}
        />
      )}

      {targetEffect && !targetEffectRead && (
        <DocWindow
          title={targetEffect.title}
          source={effectPromise(targetEffect.id)}
          onClose={closeWriter}
          onWritten={() => {
            readEffect(targetEffect.id);
            closeWriter();
          }}
        />
      )}

      {warOpen && <DrugWarWindow onClose={() => setWarOpen(false)} />}

      {reader && (
        <DocReader
          title={effects.find((effect) => effect.id === reader)?.title ?? reader}
          source={effectPromise(reader)}
          onClose={() => setReader(null)}
        />
      )}
    </article>
  );
}

function DocWindow({
  title,
  source,
  onClose,
  onWritten,
}: {
  title: string;
  source: Promise<Report | Effect | undefined>;
  onClose: () => void;
  onWritten: () => void;
}) {
  const tr = useT();
  const doc = use(source);
  if (!doc) return null;
  const body: ReportBlock[] | undefined = 'blocks' in doc ? doc.blocks : doc.body;
  return (
    <div
      className={p.docWindowBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={p.docWindow}
        role="dialog"
        aria-modal="true"
        aria-label={tr('docs.writeAria', { title })}
      >
        <header className={p.docWindowBar}>
          <span className={p.docWindowTitle}>{tr('docs.windowTitle', { title })}</span>
          <span className={p.docWindowControls}>
            <span className={p.docWindowControl} aria-hidden="true">
              —
            </span>
            <span className={p.docWindowControl} aria-hidden="true">
              □
            </span>
            <button
              type="button"
              className={p.docWindowClose}
              aria-label={tr('docs.closeWrite')}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
            >
              ×
            </button>
          </span>
        </header>
        <div className={p.docWindowScroll} data-doc-scroll>
          <DocWriter title={title} body={body} onDone={onWritten} />
        </div>
      </section>
    </div>
  );
}

function DrugWarWindow({ onClose }: { onClose: () => void }) {
  const tr = useT();
  const war = drugWarText();
  const audioRef = useRef<HTMLAudioElement>(null);
  const settings = useGameStore((state) => state.save.settings);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = settings.audio.mute ? 0 : Math.min(1, settings.audio.sfx / 100);
    audio.currentTime = 0;
    const play = audio.play();
    if (play && typeof play.catch === 'function') void play.catch(() => undefined);
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [settings.audio.mute, settings.audio.sfx]);

  return (
    <div
      className={p.docWindowBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`${p.docWindow} ${p.warWindow}`}
        role="dialog"
        aria-modal="true"
        aria-label={tr('docs.viewAria', { title: war.title })}
      >
        <header className={p.docWindowBar}>
          <span className={p.docWindowTitle}>
            {tr('docs.windowTitle', { title: war.title })}
          </span>
          <span className={p.docWindowControls}>
            <span className={p.docWindowControl} aria-hidden="true">—</span>
            <span className={p.docWindowControl} aria-hidden="true">□</span>
            <button
              type="button"
              className={p.docWindowClose}
              aria-label={tr('docs.closeWar')}
              onClick={onClose}
            >
              ×
            </button>
          </span>
        </header>
        <div className={p.docWindowScroll}>
          <article className={p.warPaper} aria-label={tr('docs.warBodyAria')}>
            <h2 className={p.warHeading}>{war.heading}</h2>
            {war.body.map((paragraph) => (
              <p key={paragraph.slice(0, 18)} className={p.warParagraph}>{paragraph}</p>
            ))}
            <button type="button" className={p.warButton} onClick={onClose}>
              {war.button}
            </button>
          </article>
        </div>
        <audio ref={audioRef} src={`${import.meta.env.BASE_URL}assets-private/audio/drug-war.wav`} preload="auto" />
      </section>
    </div>
  );
}

function DocReader({
  title,
  source,
  onClose,
}: {
  title: string;
  source: Promise<Effect | undefined>;
  onClose: () => void;
}) {
  const tr = useT();
  const effect = use(source);
  if (!effect) return null;
  return (
    <div
      className={p.docWindowBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={p.docWindow}
        role="dialog"
        aria-modal="true"
        aria-label={tr('docs.viewAria', { title })}
      >
        <header className={p.docWindowBar}>
          <span className={p.docWindowTitle}>{tr('docs.windowTitle', { title })}</span>
          <span className={p.docWindowControls}>
            <span className={p.docWindowControl} aria-hidden="true">
              —
            </span>
            <span className={p.docWindowControl} aria-hidden="true">
              □
            </span>
            <button
              type="button"
              className={p.docWindowClose}
              aria-label={tr('docs.closeView')}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
            >
              ×
            </button>
          </span>
        </header>
        <div className={p.docWindowScroll} data-doc-scroll>
          <article className={p.writerPaper} aria-label={tr('docs.bodyAria')}>
            <h2 className={p.docReadTitle}>{title}</h2>
            <p className={p.docReadMeta}>{tr('docs.readMeta')}</p>
            <DocBlocks blocks={effect.blocks} />
          </article>
        </div>
      </section>
    </div>
  );
}

function DocBlocks({ blocks }: { blocks: EffectBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'h') {
          return (
            <h3 key={index} className={p.writerH}>
              {block.text}
            </h3>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={index} className={p.writerQuote}>
              {block.text}
            </blockquote>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className={p.docReadList}>
              {block.items.map((item) => (
                <li key={item} className={p.writerLi}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className={p.writerP}>
            {block.text}
          </p>
        );
      })}
    </>
  );
}
