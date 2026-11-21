import type { CardOp, DrugEntry } from '../../content/types';
import { CLASS_LABEL, DrugBadge } from './DrugBadge';
import s from './drugs.module.css';

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function opText(op: CardOp): string {
  if (op.op === 'damage' || op.op === 'heal') {
    return `${op.op === 'damage' ? '扣' : '回复'}${op.track === 'phys' ? '生理' : '心理'} ${signed(
      op.op === 'damage' ? -op.amount : op.amount,
    )}`;
  }
  if (op.op === 'neuro') return `${op.neuro} ${signed(op.amount)}`;
  if (op.op === 'status') return `施加「${op.status}」${op.stacks ?? 1} 层`;
  if (op.op === 'clearStatus') return `清除「${op.status}」${op.stacks ?? 1} 层`;
  if (op.op === 'enzyme') {
    const strength = op.strength === 'strong' ? '强' : op.strength === 'moderate' ? '中' : '弱';
    return `${op.mode === 'inhibit' ? '抑制' : '诱导'} ${op.enzyme}（${strength}）`;
  }
  if (op.op === 'ap') return `行动点 +${op.amount}`;
  if (op.op === 'draw') return `抽 ${op.amount} 张牌`;
  if (op.op === 'delayed') return `延迟 ${op.turns} 回合`;
  return '未知效果';
}

function opList(ops: CardOp[]): string[] {
  return ops.map(opText);
}

const SEVERITY_LABEL = { light: '轻', medium: '中', heavy: '重' } as const;
const VALENCE_LABEL = { positive: '正面', negative: '负面', neutral: '中立' } as const;
const UNIT_LABEL = { g: '克', mg: '毫克', mcg: '微克' } as const;

export function DrugDetail({ drug }: { drug: DrugEntry }) {
  const proper = opList(drug.card.proper);
  const over = drug.card.over ? opList(drug.card.over) : [];
  const effects = drug.concentrationEffects ?? [];
  return (
    <div className={s.detail}>
      <p className={s.kicker}>药品档案 / {CLASS_LABEL[drug.klass]}</p>
      <h2>
        <DrugBadge klass={drug.klass} /> {drug.name}
      </h2>
      {drug.aliases.length > 0 && <p className={s.kicker}>别名：{drug.aliases.join(' / ')}</p>}
      <p className={s.kicker}>标签：{drug.tags.length ? drug.tags.join(' / ') : '未标注'}</p>
      <p>{drug.summary}</p>
      <p>{drug.description}</p>

      <div className={s.columns}>
        <div>
          <h3>单次使用</h3>
          <ul className={`${s.list} ${s.proper}`}>
            {proper.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>越过效应线</h3>
          {over.length ? (
            <ul className={`${s.list} ${s.over}`}>
              {over.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className={s.kicker}>没有额外效应；重复使用仍按单次处理。</p>
          )}
        </div>
      </div>
      <p className={s.kicker}>
        效应线：每回合第 {drug.effectLine ?? 1} 次使用为单次；再使用同一药品进入追加效应。
      </p>

      {drug.card.course && (
        <>
          <h3>疗程</h3>
          <p>
            连续 {drug.card.course.turns} 回合单次使用后建立「{drug.card.course.name}」；
            停药 {drug.card.course.grace} 回合后失效。每回合：
            {opList(drug.card.course.ops).join('；')}
          </p>
        </>
      )}

      <h3>药代动力学</h3>
      <p>
        半衰期（设定）：{drug.halfLife}h；生物利用度（设定）：
        {Math.round((drug.bioavailability ?? 0.6) * 100)}%；耐受倾向：{drug.tolerance}/3。
      </p>

      <h3>酶</h3>
      <p>
        底物：{drug.substrates.length ? drug.substrates.join(' / ') : '未标注'}；
        抑制：
        {Object.keys(drug.inhibitors).length
          ? Object.entries(drug.inhibitors)
              .map(([enzyme, strength]) => `${enzyme}(${strength})`)
              .join(' / ')
          : '无'}
        ；诱导：{drug.inducers.length ? drug.inducers.join(' / ') : '无'}
      </p>

      <h3>血药浓度效应</h3>
      {effects.length ? (
        <div className={s.effectTable}>
          <div className={s.effectHead}>阈值</div>
          <div className={s.effectHead}>效应</div>
          <div className={s.effectHead}>权重</div>
          <div className={s.effectHead}>性质</div>
          {effects.map((effect) => (
            <div className={s.effectLine} key={`${effect.name}-${effect.threshold}`} data-valence={effect.valence}>
              <span>
                ≥ {effect.threshold}{UNIT_LABEL[effect.unit]}
              </span>
              <span>{effect.name}</span>
              <span>
                {SEVERITY_LABEL[effect.severity]} · {effect.weight}
              </span>
              <span>{VALENCE_LABEL[effect.valence]}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={s.kicker}>未标注浓度效应。</p>
      )}

      {drug.withdrawal && <p>停药：{drug.withdrawal.log}</p>}
      {drug.classNote && <p className={s.kicker}>{drug.classNote}</p>}

      <p className={s.attribution}>
        药品分类与机制参考 Function Manual（MIT, linear function）。
      </p>
    </div>
  );
}