import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getDrugs } from '../content/registry';
import type { DrugClass } from '../content/types';
import { CLASS_LABEL, DrugBadge, DrugBadgeLegend } from '../ui/drug/DrugBadge';
import d from '../ui/drug/drugs.module.css';
import p from './pages.module.css';

const CLASSES: Array<DrugClass | 'all'> = ['all', 'otc', 'rx', 'c2', 'c1', 'narcotic', 'other'];

export function DrugsPage() {
  const [query, setQuery] = useState('');
  const [klass, setKlass] = useState<DrugClass | 'all'>('all');
  const drugs = getDrugs().filter((drug) => drug.kind === 'drug');
  const normalized = query.trim().toLowerCase();
  const filtered = drugs.filter((drug) => {
    if (klass !== 'all' && drug.klass !== klass) return false;
    if (!normalized) return true;
    return [
      drug.name,
      ...drug.aliases,
      ...drug.tags,
      drug.summary,
      drug.description,
      ...drug.substrates,
      ...Object.keys(drug.inhibitors),
      ...drug.inducers,
      ...Object.keys(drug.neuro),
      CLASS_LABEL[drug.klass],
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized);
  });

  return (
    <article className={p.page}>
      <p className={p.kicker}>分类 / 药品</p>
      <h1 className={p.pageTitle}>药品索引</h1>
      <p className={p.p}>
        按药名、别名、类别、递质或酶检索。药品资料只写机制与档案信息，不写剂量或用法。
      </p>
      <div className={p.searchRow}>
        <input
          className={p.searchBox}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索药名、别名、类别、递质、酶"
          aria-label="搜索药品"
        />
        <span className={p.small}>{filtered.length} 条</span>
      </div>
      <div className={d.filterRow} aria-label="药品类别">
        {CLASSES.map((item) => (
          <button
            key={item}
            type="button"
            className={d.filter}
            data-active={klass === item}
            onClick={() => setKlass(item)}
          >
            {item === 'all' ? '全部' : CLASS_LABEL[item]}
          </button>
        ))}
      </div>
      <DrugBadgeLegend />
      {filtered.length > 0 ? (
        <div className={d.drugGrid}>
          {filtered.map((drug) => (
            <Link key={drug.id} className={d.drugCard} to={`/drugs/${encodeURIComponent(drug.id)}`}>
              <span>
                <DrugBadge klass={drug.klass} /> <strong>{drug.name}</strong>
              </span>
              <small>{drug.summary}</small>
              <small>{drug.tags.join(' / ')}</small>
            </Link>
          ))}
        </div>
      ) : (
        <p className={p.empty}>没有匹配的药品。</p>
      )}
    </article>
  );
}