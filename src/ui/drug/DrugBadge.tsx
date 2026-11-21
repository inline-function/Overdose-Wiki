import type { DrugClass } from '../../content/types';
import s from './drugs.module.css';

export const CLASS_LABEL: Record<DrugClass, string> = {
  other: '其他',
  otc: 'OTC',
  rx: 'Rx',
  c2: '精二',
  c1: '精一',
  narcotic: '麻',
};

const CLASS_ARIA: Record<DrugClass, string> = {
  other: '其他',
  otc: '非处方药',
  rx: '处方药',
  c2: '第二类精神药品',
  c1: '第一类精神药品',
  narcotic: '麻醉药品',
};

export function DrugBadge({ klass }: { klass: DrugClass }) {
  if (klass === 'other') return null;
  return (
    <span
      className={s.badge}
      data-kind={klass}
      aria-label={CLASS_ARIA[klass]}
      title={CLASS_ARIA[klass]}
    >
      {klass === 'otc' ? 'OTC' : klass === 'rx' ? 'Rx' : klass === 'narcotic' ? (
        '麻'
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
  return (
    <div className={s.badgeLegend}>
      {(['otc', 'rx', 'c2', 'c1', 'narcotic'] as DrugClass[]).map((klass) => (
        <span key={klass}>
          <DrugBadge klass={klass} /> {CLASS_LABEL[klass]}
        </span>
      ))}
      <span>其他：无徽章</span>
    </div>
  );
}