import { getLocale, useLocale, useT } from '../../i18n';
import type { DrugClass } from '../../content/types';
import { drugClassAria, drugClassLabel } from './drugText';
import s from './drugs.module.css';

export function DrugBadge({ klass }: { klass: DrugClass }) {
  useLocale();
  if (klass === 'other') return null;
  const label = drugClassAria(klass);
  const en = getLocale() === 'en';
  return (
    <span className={s.badge} data-kind={klass} aria-label={label} title={label}>
      {klass === 'otc' ? 'OTC' : klass === 'rx' ? 'Rx' : klass === 'narcotic' ? (
        en ? 'N' : '麻'
      ) : klass === 'c2' || klass === 'c1' ? (
        <>
          <i />
          <i />
          <i />
          <i />
        </>
      ) : null}
    </span>
  );
}

export function DrugBadgeLegend() {
  useLocale();
  const tr = useT();
  return (
    <div className={s.badgeLegend}>
      {(['otc', 'rx', 'c2', 'c1', 'narcotic'] as DrugClass[]).map((klass) => (
        <span key={klass}>
          <DrugBadge klass={klass} /> {drugClassLabel(klass)}
        </span>
      ))}
      <span>{tr('drugs.legendOther')}</span>
    </div>
  );
}
