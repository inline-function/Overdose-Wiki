import type { WarTable } from '../game/types';
import { WAR_METERS } from '../game/warTable';
import s from './minigame.module.css';

const HUD_LABEL: Record<string, string> = {
  goto: '藤控',
  chicken: '鸡控',
  trust: '信任',
  archive: '档案',
  escalation: '升级',
};

export function WarTableHUD({ table }: { table: WarTable }) {
  return (
    <section className={s.warHud} data-testid="war-table" aria-label="第四章战局">
      <div className={s.warHudHead}>
        <span className={s.warHudKicker}>战局</span>
        <span className={s.warHudCount}>{Object.keys(table.decisions).length} 次行动</span>
      </div>
      <div className={s.warMeters}>
        {WAR_METERS.map(({ key, label }) => {
          const value = Math.round(table[key]);
          const max = key === 'escalation' ? 5 : 100;
          return (
            <div
              key={key}
              className={s.warMeter}
              role="group"
              data-meter={key}
              data-value={value}
              aria-label={`${label} ${value}${key === 'escalation' ? ' / 5' : ''}`}
            >
              <span className={s.warMeterLabel}>
                <b>{HUD_LABEL[key] ?? label}</b>
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
