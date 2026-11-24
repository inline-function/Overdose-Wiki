import { use, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SAMPLE_EFFECTS } from '../content/sample';
import { effectPromise, getEffectMetas, hasContent } from '../content/registry';
import { useGameStore } from '../game/store';
import { useT } from '../i18n';
import p from './pages.module.css';

export function EffectsPage() {
  const tr = useT();
  const { id } = useParams();
  if (id) return <EffectDetail name={decodeURIComponent(id)} />;

  const metas = getEffectMetas();
  const entries = metas.length
    ? metas.map((effect) => ({ id: effect.id, title: effect.title }))
    : SAMPLE_EFFECTS.map((name) => ({ id: name, title: name }));
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filtered = entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(needle) || entry.id.toLowerCase().includes(needle),
  );
  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('effects.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('effects.title')}</h1>
      <p className={p.p}>{tr('effects.intro')}</p>
      <div className={p.searchRow}>
        <input
          className={p.searchBox}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr('effects.placeholder')}
          aria-label={tr('effects.searchAria')}
        />
      </div>

      <div className={p.effectsGrid}>
        {filtered.map((entry) => (
          <Link
            key={entry.id}
            className={p.effectCard}
            to={`/effects/${encodeURIComponent(entry.id)}`}
          >
            {entry.title}
            <br />
            <span className={p.deckMeta}>{tr('effects.cardMeta')}</span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className={p.empty}>{tr('effects.empty')}</p>}
      <p className={p.versionLine}>{tr('effects.versionLine')}</p>
    </article>
  );
}

function EffectDetail({ name }: { name: string }) {
  const tr = useT();
  const effect = use(effectPromise(name));
  const readEffect = useGameStore((state) => state.readEffect);
  useEffect(() => {
    if (effect) readEffect(effect.id);
  }, [effect, readEffect]);
  const known = Boolean(effect) || SAMPLE_EFFECTS.includes(name);
  if (!known) {
    return (
      <article className={p.page}>
        <p className={p.kicker}>{tr('effects.notFoundKicker')}</p>
        <h1 className={p.pageTitle}>{name}</h1>
        <p className={p.noticeBox}>{tr('effects.notFoundText')}</p>
        <Link className={p.pixelButton} to="/effects">
          {tr('effects.backIndex')}
        </Link>
      </article>
    );
  }
  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('effects.detailKicker')}</p>
      <div className={p.articleHeader}>
        <h1 className={p.pageTitle}>{effect?.title ?? name}</h1>
        <span className={p.tag}>{tr('effects.tag')}</span>
      </div>
      <p className={p.articleMeta}>
        {tr('effects.tagsLine', {
          tags: effect?.tags.join(' / ') ?? tr('effects.tagsFallback'),
        })}
      </p>
      {effect?.image && hasContent() && (
        <figure className={p.effectFigure}>
          <img
            className="pixelated"
            src={`${import.meta.env.BASE_URL}assets-private/effects/${effect.image}.png`}
            alt={tr('effects.imageAlt', { title: effect.title })}
            width={352}
            height={198}
          />
          <figcaption className={p.effectCaption}>
            {tr('effects.caption', { title: effect.title })}
          </figcaption>
        </figure>
      )}
      {effect ? (
        effect.blocks.map((block, index) => {
          if (block.type === 'h') {
            return (
              <h2 key={index} className={p.effectH}>
                {block.text}
              </h2>
            );
          }
          if (block.type === 'quote') {
            return (
              <blockquote key={index} className={p.quote}>
                {block.text}
              </blockquote>
            );
          }
          if (block.type === 'list') {
            return (
              <ul key={index} className={p.effectList}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className={p.p}>
              {block.text}
            </p>
          );
        })
      ) : (
        <p className={p.p}>{tr('effects.bodyPending')}</p>
      )}
      <div className={p.toc}>{tr('effects.related')}</div>
      <p className={p.small}>
        <Link to="/effects">{tr('effects.indexLink')}</Link> ·{' '}
        <Link to="/report/7">{tr('effects.reportLink', { no: '7' })}</Link> ·{' '}
        <Link to="/deck">{tr('effects.deckLink')}</Link>
      </p>
    </article>
  );
}
