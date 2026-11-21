import { use, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Effect, EffectBlock, Report, ReportBlock } from '../content/types';
import { effectPromise, getEffectMetas, getReportMetas, hasContent, reportPromise } from '../content/registry';
import { DRUG_WAR_BODY, DRUG_WAR_BUTTON, DRUG_WAR_HEADING, DRUG_WAR_TITLE } from '../content/drugWar';
import { useGameStore } from '../game/store';
import { DocWriter } from './DocWriter';
import p from './pages.module.css';

export function DocsPage() {
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
      <p className={p.kicker}>文档 / 归档</p>
      <h1 className={p.pageTitle}>文档</h1>
      <p className={p.p}>这里只显示你亲手写过的文档。空白稿纸会从任务指引里打开。</p>

      {written.length === 0 && writtenEffects.length === 0 && !warUnlocked ? (
        <div className={p.docEmpty} role="status">
          <span className={p.docEmptyMark} aria-hidden="true">
            ▢
          </span>
          <p className={p.small}>还没有文档。任务指引会替你打开一张空白稿纸。</p>
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
              <span className={p.archiveTitle}>效果文档 · {effect.title}</span>
              <span className={p.archiveMeta}>后藤 / 已编写 · 点击重读</span>
            </button>
          ))}
          {warUnlocked && (
            <button type="button" className={p.archiveCard} onClick={() => setWarOpen(true)}>
              <span className={p.archiveTitle}>药圈内战</span>
              <span className={p.archiveMeta}>后藤 / 已解禁 · 点击查看</span>
            </button>
          )}
          {written.map((report) => (
            <Link key={report.id} className={p.archiveCard} to={`/report/${report.id}`}>
              <span className={p.archiveTitle}>
                文档 {report.no} · {report.title}
              </span>
              <span className={p.archiveMeta}>
                {report.reporter} / {report.edited} · 已编写
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
        aria-label={`写文档：${title}`}
      >
        <header className={p.docWindowBar}>
          <span className={p.docWindowTitle}>文档 · {title}</span>
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
              aria-label="关闭写文档窗口"
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
        aria-label={`查看文档：${DRUG_WAR_TITLE}`}
      >
        <header className={p.docWindowBar}>
          <span className={p.docWindowTitle}>文档 · {DRUG_WAR_TITLE}</span>
          <span className={p.docWindowControls}>
            <span className={p.docWindowControl} aria-hidden="true">—</span>
            <span className={p.docWindowControl} aria-hidden="true">□</span>
            <button
              type="button"
              className={p.docWindowClose}
              aria-label="关闭药圈内战窗口"
              onClick={onClose}
            >
              ×
            </button>
          </span>
        </header>
        <div className={p.docWindowScroll}>
          <article className={p.warPaper} aria-label="药圈内战正文">
            <h2 className={p.warHeading}>{DRUG_WAR_HEADING}</h2>
            {DRUG_WAR_BODY.map((paragraph) => (
              <p key={paragraph.slice(0, 18)} className={p.warParagraph}>{paragraph}</p>
            ))}
            <button type="button" className={p.warButton} onClick={onClose}>
              {DRUG_WAR_BUTTON}
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
        aria-label={`查看文档：${title}`}
      >
        <header className={p.docWindowBar}>
          <span className={p.docWindowTitle}>文档 · {title}</span>
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
              aria-label="关闭文档查看窗口"
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
          <article className={p.writerPaper} aria-label="文档正文">
            <h2 className={p.docReadTitle}>{title}</h2>
            <p className={p.docReadMeta}>后藤 · 已归档</p>
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
