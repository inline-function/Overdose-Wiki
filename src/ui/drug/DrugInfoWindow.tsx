import { useState } from 'react';
import type { DrugEntry } from '../../content/types';
import { CLASS_LABEL, DrugBadge } from './DrugBadge';
import { infoText, type InfoKind } from './infoText';
import p from '../../pages/pages.module.css';
import d from './drugs.module.css';

const TURN_HOURS = 3;
const SEVERITY_LABEL = { light: '轻', medium: '中', heavy: '重' } as const;
const VALENCE_LABEL = { positive: '正面', negative: '负面', neutral: '中立' } as const;
const UNIT_LABEL = { g: '克', mg: '毫克', mcg: '微克' } as const;

type Info = { kind: InfoKind; key: string; title: string };

function concentrationAt(current: number, halfLife: number, hours: number): number {
  if (current <= 0) return 0;
  return current * Math.pow(2, -hours / Math.max(0.1, halfLife));
}

function ConcentrationGraph({
  drug,
  player,
  opponent,
}: {
  drug: DrugEntry;
  player: number;
  opponent: number;
}) {
  const [side, setSide] = useState<'player' | 'opponent'>('player');
  const current = side === 'player' ? player : opponent;
  const halfLife = drug.halfLife || 1;
  const points = Array.from({ length: 25 }, (_, index) => {
    const hours = -3 + index * 0.5;
    return { hours, value: concentrationAt(current, halfLife, hours) };
  });
  const peak = Math.max(
    1,
    ...points.map((point) => point.value),
    ...(drug.concentrationEffects ?? []).map((effect) => effect.threshold),
  );
  const width = 260;
  const height = 96;
  const pad = 8;
  const x = (hours: number) => pad + ((hours + 3) / 12) * (width - pad * 2);
  const y = (value: number) => height - pad - (value / peak) * (height - pad * 2);
  const line = points.map((point) => `${x(point.hours)},${y(point.value)}`).join(' ');
  return (
    <div className={p.graphBlock}>
      <div className={p.inline}>
        <button type="button" className={p.chip} data-active={side === 'player'} onClick={() => setSide('player')}>
          自己
        </button>
        <button type="button" className={p.chip} data-active={side === 'opponent'} onClick={() => setSide('opponent')}>
          对方
        </button>
        <span className={p.small}>
          当前 {TURN_HOURS} 小时/回合 · 半衰期 {halfLife}h
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className={p.concentrationGraph} role="img" aria-label={`${drug.name} 血药浓度曲线`}>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} className={p.graphAxis} />
        <line x1={x(0)} y1={pad} x2={x(0)} y2={height - pad} className={p.graphNow} />
        {(drug.concentrationEffects ?? []).map((effect) => (
          <line
            key={`${effect.name}-${effect.threshold}`}
            x1={pad}
            y1={y(effect.threshold)}
            x2={width - pad}
            y2={y(effect.threshold)}
            className={p.graphThreshold}
            data-valence={effect.valence}
          />
        ))}
        <polyline points={line} className={p.graphLine} data-side={side} />
        <text x={x(-3)} y={height - 1} className={p.graphLabel}>-3h</text>
        <text x={x(0)} y={height - 1} className={p.graphLabel}>现在</text>
        <text x={x(6)} y={height - 1} className={p.graphLabel}>+6h</text>
        <text x={x(9) - 12} y={height - 1} className={p.graphLabel}>+9h</text>
      </svg>
      <p className={p.small}>
        {current > 0
          ? `当前浓度 ${current.toFixed(2)}（设定值）；虚线为效应阈值。`
          : '尚未使用；使用后会生成曲线。'}
      </p>
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={p.infoChip} onClick={onClick}>
      {label}
    </button>
  );
}

export function DrugInfoWindow({
  drug,
  playerConcentration,
  opponentConcentration,
  onClose,
}: {
  drug: DrugEntry;
  playerConcentration: number;
  opponentConcentration: number;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<Info | null>(null);
  const effects = drug.concentrationEffects ?? [];
  const openInfo = (kind: InfoKind, key: string, title?: string) =>
    setInfo({ kind, key, title: title ?? key });

  return (
    <div className={p.winFrame} role="dialog" aria-modal="true" aria-label="药品详情">
      <div className={p.winTitle}>
        <span>药品档案 / {drug.name}</span>
        <span className={p.winDots} aria-hidden="true">— □</span>
        <button type="button" className={p.winClose} onClick={onClose} aria-label="关闭药品详情">
          ×
        </button>
      </div>
      <div className={`${p.winBody} scroll`}>
        <div className={p.winHeader}>
          <h2>
            <DrugBadge klass={drug.klass} /> {drug.name}
          </h2>
          <button type="button" className={p.infoChip} onClick={() => openInfo('class', drug.klass, CLASS_LABEL[drug.klass])}>
            {CLASS_LABEL[drug.klass]}
          </button>
        </div>
        <div className={p.infoChipRow}>
          {drug.tags.map((tag) => (
            <Chip key={tag} label={tag} onClick={() => openInfo('tag', tag)} />
          ))}
        </div>
        <p>{drug.description}</p>

        <h3>药代动力学</h3>
        <p>
          半衰期（设定）：{drug.halfLife}h；生物利用度（设定）：
          {Math.round((drug.bioavailability ?? 0.6) * 100)}%；耐受倾向：{drug.tolerance}/3。
        </p>

        <h3>酶</h3>
        <p>底物</p>
        <div className={p.infoChipRow}>
          {drug.substrates.length ? drug.substrates.map((enzyme) => (
            <Chip key={enzyme} label={enzyme} onClick={() => openInfo('enzyme', enzyme)} />
          )) : <span className={p.small}>未标注</span>}
        </div>
        <p>抑制</p>
        <div className={p.infoChipRow}>
          {Object.keys(drug.inhibitors).length ? Object.entries(drug.inhibitors).map(([enzyme, strength]) => (
            <Chip key={enzyme} label={`${enzyme} (${strength})`} onClick={() => openInfo('enzyme', enzyme)} />
          )) : <span className={p.small}>无</span>}
        </div>
        <p>诱导</p>
        <div className={p.infoChipRow}>
          {drug.inducers.length ? drug.inducers.map((enzyme) => (
            <Chip key={enzyme} label={enzyme} onClick={() => openInfo('enzyme', enzyme)} />
          )) : <span className={p.small}>无</span>}
        </div>

        <h3>神经递质</h3>
        <div className={p.infoChipRow}>
          {Object.keys(drug.neuro).length ? Object.keys(drug.neuro).map((neuro) => (
            <Chip key={neuro} label={neuro} onClick={() => openInfo('neuro', neuro)} />
          )) : <span className={p.small}>未标注</span>}
        </div>

        <h3>效应线</h3>
        <p>
          每回合第 {drug.effectLine ?? 1} 次使用为单次；同一药品再次使用进入追加效应。
          追加是否触发取决于药品自身设置。
        </p>
        <div className={p.infoChipRow}>
          {effects.map((effect) => (
            <Chip
              key={`${effect.name}-${effect.threshold}`}
              label={`${effect.name} · ${SEVERITY_LABEL[effect.severity]} ${effect.weight}`}
              onClick={() => openInfo('effect', effect.name)}
            />
          ))}
        </div>

        <h3>血药浓度效应</h3>
        <div className={d.effectTable}>
          {effects.map((effect) => (
            <div className={d.effectLine} key={`${effect.name}-${effect.threshold}`} data-valence={effect.valence}>
              <span>≥ {effect.threshold}{UNIT_LABEL[effect.unit]}</span>
              <button type="button" className={p.infoChip} onClick={() => openInfo('effect', effect.name)}>
                {effect.name}
              </button>
              <span>{SEVERITY_LABEL[effect.severity]} · {effect.weight}</span>
              <span>{VALENCE_LABEL[effect.valence]}</span>
            </div>
          ))}
        </div>
        <ConcentrationGraph drug={drug} player={playerConcentration} opponent={opponentConcentration} />
      </div>

      {info && (
        <div className={p.infoPopup} role="dialog" aria-modal="true" aria-label={`${info.title} 说明`}>
          <div className={p.infoWindow}>
            <div className={p.winTitle}>
              <span>{info.title}</span>
              <button type="button" className={p.winClose} onClick={() => setInfo(null)} aria-label="关闭说明">
                ×
              </button>
            </div>
            <p>{infoText(info.kind, info.key)}</p>
            <button type="button" className={p.pixelButton} onClick={() => setInfo(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}