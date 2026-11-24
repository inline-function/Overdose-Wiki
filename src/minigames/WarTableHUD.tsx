import type { WarTable } from '../game/types';
import { useT } from '../i18n';
import { WAR_METERS, type WarMeterKey } from '../game/warTable';
import s from './minigame.module.css';

export function WarTableHUD({ table }: { table: WarTable }) {
  const tr = useT();
  const shortKey: Record<WarMeterKey, 'war.gotoShort' | 'war.chickenShort' | 'war.trustShort' | 'war.archiveShort' | 'war.escalationShort'> = {
    goto: 'war.gotoShort',
    chicken: 'war.chickenShort',
    trust: 'war.trustShort',
    archive: 'war.archiveShort',
    escalation: 'war.escalationShort',
  };
  const labelKey: Record<WarMeterKey, 'war.goto' | 'war.chicken' | 'war.trust' | 'war.archive' | 'war.escalation'> = {
    goto: 'war.goto',
    chicken: 'war.chicken',
    trust: 'war.trust',
    archive: 'war.archive',
    escalation: 'war.escalation',
  };
  return (
    <section className={s.warHud} data-testid="war-table" aria-label={tr('war.hudAria')}>
      <div className={s.warHudHead}>
        <span className={s.warHudKicker}>{tr('war.hudKicker')}</span>
        <span className={s.warHudCount}>{tr('war.actions', { n: Object.keys(table.decisions).length })}</span>
      </div>
      <div className={s.warMeters}>
        {WAR_METERS.map(({ key }) => {
          const value = Math.round(table[key]);
          const max = key === 'escalation' ? 5 : 100;
          return (
            <div
              key={key}
              className={s.warMeter}
              role="group"
              data-meter={key}
              data-value={value}
              aria-label={`${tr(labelKey[key])} ${value}${key === 'escalation' ? ' / 5' : ''}`}
            >
              <span className={s.warMeterLabel}>
                <b>{tr(shortKey[key])}</b>
              </span>
              <span className={s.warMeterTrack} aria-hidden="true">
                <i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
              </span>
              <span className={s.warMeterValue}>{value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
