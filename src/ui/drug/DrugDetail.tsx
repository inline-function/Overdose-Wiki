import type { CardOp, DrugEntry } from '../../content/types';
import { useT } from '../../i18n';
import { DrugBadge } from './DrugBadge';
import {
  drugAliases,
  drugClassLabel,
  drugClassNote,
  drugCourseName,
  drugDescription,
  drugName,
  drugSummary,
  drugWithdrawalLog,
  effectLabel,
  neuroLabel,
  statusLabel,
  tagLabel,
} from './drugText';
import s from './drugs.module.css';

type Tr = ReturnType<typeof useT>;

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function opText(op: CardOp, tr: Tr): string {
  if (op.op === 'damage' || op.op === 'heal') {
    const track = op.track === 'phys' ? tr('drug.track.phys') : tr('drug.track.psy');
    const amount = signed(op.op === 'damage' ? -op.amount : op.amount);
    return op.op === 'damage'
      ? tr('drug.op.damage', { track, n: amount })
      : tr('drug.op.heal', { track, n: amount });
  }
  if (op.op === 'neuro') return `${neuroLabel(op.neuro)} ${signed(op.amount)}`;
  if (op.op === 'status') {
    return tr('drug.op.status', { status: statusLabel(op.status), n: op.stacks ?? 1 });
  }
  if (op.op === 'clearStatus') {
    return tr('drug.op.clearStatus', { status: statusLabel(op.status), n: op.stacks ?? 1 });
  }
  if (op.op === 'enzyme') {
    const strength =
      op.strength === 'strong'
        ? tr('drug.strength.strong')
        : op.strength === 'moderate'
          ? tr('drug.strength.moderate')
          : tr('drug.strength.weak');
    return tr('drug.op.enzyme', {
      mode: op.mode === 'inhibit' ? tr('drug.enzyme.inhibit') : tr('drug.enzyme.induce'),
      enzyme: op.enzyme,
      strength,
    });
  }
  if (op.op === 'ap') return tr('drug.op.ap', { n: op.amount });
  if (op.op === 'draw') return tr('drug.op.draw', { n: op.amount });
  if (op.op === 'delayed') return tr('drug.op.delayed', { n: op.turns });
  return tr('drug.op.unknown');
}

function opList(ops: CardOp[], tr: Tr): string[] {
  return ops.map((op) => opText(op, tr));
}

const SEVERITY_KEY = { light: 'drug.severity.light', medium: 'drug.severity.medium', heavy: 'drug.severity.heavy' } as const;
const VALENCE_KEY = {
  positive: 'drug.valence.positive',
  negative: 'drug.valence.negative',
  neutral: 'drug.valence.neutral',
} as const;
const UNIT_KEY = { g: 'drug.unit.g', mg: 'drug.unit.mg', mcg: 'drug.unit.mcg' } as const;

export function DrugDetail({ drug }: { drug: DrugEntry }) {
  const tr = useT();
  const proper = opList(drug.card.proper, tr);
  const over = drug.card.over ? opList(drug.card.over, tr) : [];
  const effects = drug.concentrationEffects ?? [];
  const aliases = drugAliases(drug);
  const courseName = drugCourseName(drug);
  const withdr = drugWithdrawalLog(drug);
  const classNote = drugClassNote(drug);
  return (
    <div className={s.detail}>
      <p className={s.kicker}>
        {tr('drugs.detailKicker')} / {drugClassLabel(drug.klass)}
      </p>
      <h2>
        <DrugBadge klass={drug.klass} /> {drugName(drug)}
      </h2>
      {aliases.length > 0 && <p className={s.kicker}>{tr('drug.aliases', { list: aliases.join(' / ') })}</p>}
      <p className={s.kicker}>
        {tr('drug.tags', { list: drug.tags.length ? drug.tags.map(tagLabel).join(' / ') : tr('drug.untagged') })}
      </p>
      <p>{drugSummary(drug)}</p>
      <p>{drugDescription(drug)}</p>

      <div className={s.columns}>
        <div>
          <h3>{tr('drug.singleUse')}</h3>
          <ul className={`${s.list} ${s.proper}`}>
            {proper.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{tr('drug.overLine')}</h3>
          {over.length ? (
            <ul className={`${s.list} ${s.over}`}>
              {over.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className={s.kicker}>{tr('drug.noExtra')}</p>
          )}
        </div>
      </div>
      <p className={s.kicker}>{tr('drug.effectLineDetail', { n: drug.effectLine ?? 1 })}</p>

      {drug.card.course && (
        <>
          <h3>{tr('drug.course')}</h3>
          <p>
            {tr('drug.courseInfo', {
              turns: drug.card.course.turns,
              name: courseName ?? drug.card.course.name,
              grace: drug.card.course.grace,
              ops: opList(drug.card.course.ops, tr).join(tr('drug.listSep')),
            })}
          </p>
        </>
      )}

      <h3>{tr('drug.kinetics')}</h3>
      <p>
        {tr('drug.kineticsInfo', {
          half: drug.halfLife,
          bio: Math.round((drug.bioavailability ?? 0.6) * 100),
          tol: drug.tolerance,
        })}
      </p>

      <h3>{tr('drug.enzymes')}</h3>
      <p>
        {tr('drug.substrates')}: {drug.substrates.length ? drug.substrates.join(' / ') : tr('drug.untagged')}
        {' · '}
        {tr('drug.inhibitors')}:{' '}
        {Object.keys(drug.inhibitors).length
          ? Object.entries(drug.inhibitors)
              .map(([enzyme, strength]) => `${enzyme}(${strength})`)
              .join(' / ')
          : tr('drug.none')}
        {' · '}
        {tr('drug.inducers')}: {drug.inducers.length ? drug.inducers.join(' / ') : tr('drug.none')}
      </p>

      <h3>{tr('drug.concentration')}</h3>
      {effects.length ? (
        <div className={s.effectTable}>
          <div className={s.effectHead}>{tr('drug.threshold')}</div>
          <div className={s.effectHead}>{tr('drug.effect')}</div>
          <div className={s.effectHead}>{tr('drug.weight')}</div>
          <div className={s.effectHead}>{tr('drug.nature')}</div>
          {effects.map((effect) => (
            <div className={s.effectLine} key={`${effect.name}-${effect.threshold}`} data-valence={effect.valence}>
              <span>
                ≥ {effect.threshold}
                {tr(UNIT_KEY[effect.unit])}
              </span>
              <span>{effectLabel(effect.name)}</span>
              <span>
                {tr(SEVERITY_KEY[effect.severity])} · {effect.weight}
              </span>
              <span>{tr(VALENCE_KEY[effect.valence])}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={s.kicker}>{tr('drug.noEffects')}</p>
      )}

      {withdr && <p>{tr('drug.withdrawal', { log: withdr })}</p>}
      {classNote && <p className={s.kicker}>{classNote}</p>}

      <p className={s.attribution}>{tr('drug.attribution')}</p>
    </div>
  );
}
