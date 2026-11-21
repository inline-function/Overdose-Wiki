import { use, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SAMPLE_EFFECTS } from '../content/sample';
import { effectPromise, getEffectMetas, hasContent } from '../content/registry';
import { useGameStore } from '../game/store';
import p from './pages.module.css';

export function EffectsPage() {
  const { id } = useParams();
  if (id) return <EffectDetail name={decodeURIComponent(id)} />;

  const metas = getEffectMetas();
  const names = metas.length ? metas.map((effect) => effect.id) : SAMPLE_EFFECTS;
  const [query, setQuery] = useState('');
  const filtered = names.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <article className={p.page}>
      <p className={p.kicker}>效果 / 索引</p>
      <h1 className={p.pageTitle}>效果</h1>
      <p className={p.p}>
        10 类药效词条。词条是 wiki 写法：机制、体验、关联报告与卡牌；不写剂量与方法。
      </p>
      <div className={p.searchRow}>
        <input
          className={p.searchBox}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索效果词条"
          aria-label="搜索效果"
        />
      </div>

      <div className={p.effectsGrid}>
        {filtered.map((name) => (
          <Link key={name} className={p.effectCard} to={`/effects/${encodeURIComponent(name)}`}>
            {name}
            <br />
            <span className={p.deckMeta}>效果词条</span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className={p.empty}>没有匹配的词条。</p>}
      <p className={p.versionLine}>私有大包含 10 篇效果词条；公开 demo 使用脱敏索引。</p>
    </article>
  );
}

function EffectDetail({ name }: { name: string }) {
  const effect = use(effectPromise(name));
  const readEffect = useGameStore((state) => state.readEffect);
  useEffect(() => {
    if (effect) readEffect(effect.id);
  }, [effect, readEffect]);
  const known = Boolean(effect) || SAMPLE_EFFECTS.includes(name);
  if (!known) {
    return (
      <article className={p.page}>
        <p className={p.kicker}>效果 / 404</p>
        <h1 className={p.pageTitle}>{name}</h1>
        <p className={p.noticeBox}>此词条尚未归档。返回效果索引继续阅读。</p>
        <Link className={p.pixelButton} to="/effects">
          返回效果索引
        </Link>
      </article>
    );
  }
  return (
    <article className={p.page}>
      <p className={p.kicker}>效果 / 词条</p>
      <div className={p.articleHeader}>
        <h1 className={p.pageTitle}>{effect?.title ?? name}</h1>
        <span className={p.tag}>效果</span>
      </div>
      <p className={p.articleMeta}>
        标签：{effect?.tags.join(' / ') ?? '抑制型 / 解离 / 机制'}
      </p>
      {effect?.image && hasContent() && (
        <figure className={p.effectFigure}>
          <img
            className="pixelated"
            src={`${import.meta.env.BASE_URL}assets-private/effects/${effect.image}.png`}
            alt={`${effect.title} 概念插图`}
            width={352}
            height={198}
          />
          <figcaption className={p.effectCaption}>档案插图 · {effect.title}</figcaption>
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
        <p className={p.p}>词条正文将在 S1 接入。</p>
      )}
      <div className={p.toc}>关联：右美沙芬 · 金刚烷胺 · 苏糖酸镁 · 报告 7 · 报告 50</div>
      <p className={p.small}>
        <Link to="/effects">← 效果索引</Link> · <Link to="/report/7">报告 7</Link> ·{' '}
        <Link to="/deck">药箱</Link>
      </p>
    </article>
  );
}