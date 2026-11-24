import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getDrugs } from '../content/registry';
import type { DrugClass } from '../content/types';
import { useT } from '../i18n';
import { DrugBadge, DrugBadgeLegend } from '../ui/drug/DrugBadge';
import {
  drugAliases,
  drugClassLabel,
  drugDescription,
  drugName,
  drugSummary,
  tagLabel,
} from '../ui/drug/drugText';
import d from '../ui/drug/drugs.module.css';
import p from './pages.module.css';

const CLASSES: Array<DrugClass | 'all'> = ['all', 'otc', 'rx', 'c2', 'c1', 'narcotic', 'other'];

export function DrugsPage() {
  const tr = useT();
  const [query, setQuery] = useState('');
  const [klass, setKlass] = useState<DrugClass | 'all'>('all');
  const drugs = getDrugs().filter((drug) => drug.kind === 'drug');
  const normalized = query.trim().toLowerCase();
  const filtered = drugs.filter((drug) => {
    if (klass !== 'all' && drug.klass !== klass) return false;
    if (!normalized) return true;
    return [
      drugName(drug),
      drug.name,
      ...drugAliases(drug),
      ...drug.aliases,
      ...drug.tags.map(tagLabel),
      ...drug.tags,
      drugSummary(drug),
      drug.summary,
      drugDescription(drug),
      drug.description,
      ...drug.substrates,
      ...Object.keys(drug.inhibitors),
      ...drug.inducers,
      ...Object.keys(drug.neuro),
      drugClassLabel(drug.klass),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized);
  });

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('drugs.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('drugs.title')}</h1>
      <p className={p.p}>{tr('drugs.intro')}</p>
      <div className={p.searchRow}>
        <input
          className={p.searchBox}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr('drugs.searchPlaceholder')}
          aria-label={tr('drugs.searchAria')}
        />
        <span className={p.small}>{tr('drugs.count', { n: filtered.length })}</span>
      </div>
      <div className={d.filterRow} aria-label={tr('drugs.filterAria')}>
        {CLASSES.map((item) => (
          <button
            key={item}
            type="button"
            className={d.filter}
            data-active={klass === item}
            onClick={() => setKlass(item)}
          >
            {item === 'all' ? tr('drugs.all') : drugClassLabel(item)}
          </button>
        ))}
      </div>
      <DrugBadgeLegend />
      {filtered.length > 0 ? (
        <div className={d.drugGrid}>
          {filtered.map((drug) => (
            <Link key={drug.id} className={d.drugCard} to={`/drugs/${encodeURIComponent(drug.id)}`}>
              <span>
                <DrugBadge klass={drug.klass} /> <strong>{drugName(drug)}</strong>
              </span>
              <small>{drugSummary(drug)}</small>
              <small>{drug.tags.map(tagLabel).join(' / ')}</small>
            </Link>
          ))}
        </div>
      ) : (
        <p className={p.empty}>{tr('drugs.empty')}</p>
      )}
    </article>
  );
}
