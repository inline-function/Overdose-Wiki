import { useState } from 'react';
import type { DrugEntry } from '../../content/types';
import { useT } from '../../i18n';
import { DrugBadge } from './DrugBadge';
import { drugClassLabel, drugDescription, drugName, effectLabel, neuroLabel, tagLabel } from './drugText';
import { infoText, type InfoKind } from './infoText';
import p from '../../pages/pages.module.css';
import d from './drugs.module.css';

const TURN_HOURS = 3;
const SEVERITY_KEY = { light: 'drug.severity.light', medium: 'drug.severity.medium', heavy: 'drug.severity.heavy' } as const;
const VALENCE_KEY = {
  positive: 'drug.valence.positive',
  negative: 'drug.valence.negative',
  neutral: 'drug.valence.neutral',
} as const;
const UNIT_KEY = { g: 'drug.unit.g', mg: 'drug.unit.mg', mcg: 'drug.unit.mcg' } as const;

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
  const tr = useT();
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
          {tr('drug.self')}
        </button>
        <button type="button" className={p.chip} data-active={side === 'opponent'} onClick={() => setSide('opponent')}>
          {tr('drug.other')}
        </button>
        <span className={p.small}>{tr('drug.graphMeta', { hours: TURN_HOURS, half: halfLife })}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={p.concentrationGraph}
        role="img"
        aria-label={tr('drug.graphAria', { name: drugName(drug) })}
      >
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
        <text x={x(0)} y={height - 1} className={p.graphLabel}>{tr('drug.now')}</text>
        <text x={x(6)} y={height - 1} className={p.graphLabel}>+6h</text>
        <text x={x(9) - 12} y={height - 1} className={p.graphLabel}>+9h</text>
      </svg>
      <p className={p.small}>
        {current > 0
          ? tr('drug.graphNow', { value: current.toFixed(2) })
          : tr('drug.graphEmpty')}
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
  const tr = useT();
  const [info, setInfo] = useState<Info | null>(null);
  const effects = drug.concentrationEffects ?? [];
  const openInfo = (kind: InfoKind, key: string, title?: string) =>
    setInfo({ kind, key, title: title ?? key });

  return (
    <div className={p.winFrame} role="dialog" aria-modal="true" aria-label={tr('drug.detailAria')}>
      <div className={p.winTitle}>
        <span>{tr('drugs.detailKicker')} / {drugName(drug)}</span>
        <span className={p.winDots} aria-hidden="true">— □</span>
        <button type="button" className={p.winClose} onClick={onClose} aria-label={tr('drug.closeDetail')}>
          ×
        </button>
      </div>
      <div className={`${p.winBody} scroll`}>
        <div className={p.winHeader}>
          <h2>
            <DrugBadge klass={drug.klass} /> {drugName(drug)}
          </h2>
          <button
            type="button"
            className={p.infoChip}
            onClick={() => openInfo('class', drug.klass, drugClassLabel(drug.klass))}
          >
            {drugClassLabel(drug.klass)}
          </button>
        </div>
        <div className={p.infoChipRow}>
          {drug.tags.map((tag) => (
            <Chip key={tag} label={tagLabel(tag)} onClick={() => openInfo('tag', tag)} />
          ))}
        </div>
        <p>{drugDescription(drug)}</p>

        <h3>{tr('drug.kinetics')}</h3>
        <p>
          {tr('drug.kineticsInfo', {
            half: drug.halfLife,
            bio: Math.round((drug.bioavailability ?? 0.6) * 100),
            tol: drug.tolerance,
          })}
        </p>

        <h3>{tr('drug.enzymes')}</h3>
        <p>{tr('drug.substrates')}</p>
        <div className={p.infoChipRow}>
          {drug.substrates.length ? drug.substrates.map((enzyme) => (
            <Chip key={enzyme} label={enzyme} onClick={() => openInfo('enzyme', enzyme)} />
          )) : <span className={p.small}>{tr('drug.untagged')}</span>}
        </div>
        <p>{tr('drug.inhibitors')}</p>
        <div className={p.infoChipRow}>
          {Object.keys(drug.inhibitors).length ? Object.entries(drug.inhibitors).map(([enzyme, strength]) => (
            <Chip key={enzyme} label={`${enzyme} (${strength})`} onClick={() => openInfo('enzyme', enzyme)} />
          )) : <span className={p.small}>{tr('drug.none')}</span>}
        </div>
        <p>{tr('drug.inducers')}</p>
        <div className={p.infoChipRow}>
          {drug.inducers.length ? drug.inducers.map((enzyme) => (
            <Chip key={enzyme} label={enzyme} onClick={() => openInfo('enzyme', enzyme)} />
          )) : <span className={p.small}>{tr('drug.none')}</span>}
        </div>

        <h3>{tr('drug.neuro')}</h3>
        <div className={p.infoChipRow}>
          {Object.keys(drug.neuro).length ? Object.keys(drug.neuro).map((neuro) => (
            <Chip key={neuro} label={neuroLabel(neuro)} onClick={() => openInfo('neuro', neuro)} />
          )) : <span className={p.small}>{tr('drug.untagged')}</span>}
        </div>

        <h3>{tr('drug.effectLine')}</h3>
        <p>{tr('drug.effectLineInfo', { n: drug.effectLine ?? 1 })}</p>
        <div className={p.infoChipRow}>
          {effects.map((effect) => (
            <Chip
              key={`${effect.name}-${effect.threshold}`}
              label={`${effectLabel(effect.name)} · ${tr(SEVERITY_KEY[effect.severity])} ${effect.weight}`}
              onClick={() => openInfo('effect', effect.name)}
            />
          ))}
        </div>

        <h3>{tr('drug.concentration')}</h3>
        <div className={d.effectTable}>
          {effects.map((effect) => (
            <div className={d.effectLine} key={`${effect.name}-${effect.threshold}`} data-valence={effect.valence}>
              <span>≥ {effect.threshold}{tr(UNIT_KEY[effect.unit])}</span>
              <button type="button" className={p.infoChip} onClick={() => openInfo('effect', effect.name)}>
                {effectLabel(effect.name)}
              </button>
              <span>{tr(SEVERITY_KEY[effect.severity])} · {effect.weight}</span>
              <span>{tr(VALENCE_KEY[effect.valence])}</span>
            </div>
          ))}
        </div>
        <ConcentrationGraph drug={drug} player={playerConcentration} opponent={opponentConcentration} />
      </div>

      {info && (
        <div className={p.infoPopup} role="dialog" aria-modal="true" aria-label={tr('drug.infoAria', { title: info.title })}>
          <div className={p.infoWindow}>
            <div className={p.winTitle}>
              <span>{info.title}</span>
              <button type="button" className={p.winClose} onClick={() => setInfo(null)} aria-label={tr('drug.closeInfo')}>
                ×
              </button>
            </div>
            <p>{infoText(info.kind, info.key)}</p>
            <button type="button" className={p.pixelButton} onClick={() => setInfo(null)}>
              {tr('drug.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
