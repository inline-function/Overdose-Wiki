import type { WarEffectPatch } from '../content/types';
import { t } from '../i18n';
import { defaultWarTable, type WarTable } from './types';

export type WarMeterKey = 'goto' | 'chicken' | 'trust' | 'archive' | 'escalation';

export const WAR_METERS: { key: WarMeterKey; label: string; short: string }[] = [
  { key: 'goto', label: '藤控合法性', short: '藤' },
  { key: 'chicken', label: '鸡控合法性', short: '鸡' },
  { key: 'trust', label: '公共信任', short: '信' },
  { key: 'archive', label: '档案可信度', short: '档' },
  { key: 'escalation', label: '升级度', short: '升' },
];

export function warTableOf(save: { warTable?: WarTable } | null | undefined): WarTable {
  return save?.warTable ?? defaultWarTable();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function applyEffects(base: WarTable, effects: WarEffectPatch): void {
  base.goto = clamp(base.goto + (effects.goto ?? 0), 0, 100);
  base.chicken = clamp(base.chicken + (effects.chicken ?? 0), 0, 100);
  base.trust = clamp(base.trust + (effects.trust ?? 0), 0, 100);
  base.archive = clamp(base.archive + (effects.archive ?? 0), 0, 100);
  base.escalation = clamp(base.escalation + (effects.escalation ?? 0), 0, 5);
  for (const flag of effects.flags ?? []) {
    if (!base.flags.includes(flag)) base.flags.push(flag);
  }
}

export function recomputeWarTable(decisions: WarTable['decisions']): WarTable {
  const base = defaultWarTable();
  base.decisions = decisions;
  for (const decision of Object.values(decisions)) applyEffects(base, decision.effects);
  return base;
}

/** 写入/替换一次行动；同 key 重玩时按新选择重算，不会叠加两次。 */
export function applyWarDecision(
  table: WarTable,
  key: string,
  choice: string,
  effects: WarEffectPatch,
): WarTable {
  return recomputeWarTable({ ...table.decisions, [key]: { choice, effects } });
}

export function sumWarEffects(list: WarEffectPatch[]): WarEffectPatch {
  const out: WarEffectPatch = {};
  const flags: string[] = [];
  for (const effects of list) {
    for (const key of ['goto', 'chicken', 'trust', 'archive', 'escalation'] as const) {
      const value = effects[key];
      if (typeof value === 'number') out[key] = (out[key] ?? 0) + value;
    }
    flags.push(...(effects.flags ?? []));
  }
  if (flags.length) out.flags = Array.from(new Set(flags));
  return out;
}

export function meterDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

const METER_LABEL_KEY: Record<WarMeterKey, 'war.gotoShort' | 'war.chickenShort' | 'war.trustShort' | 'war.archiveShort' | 'war.escalationShort'> = {
  goto: 'war.gotoShort',
  chicken: 'war.chickenShort',
  trust: 'war.trustShort',
  archive: 'war.archiveShort',
  escalation: 'war.escalationShort',
};

export function effectSummary(effects: WarEffectPatch): string[] {
  const out: string[] = [];
  for (const { key } of WAR_METERS) {
    const value = effects[key];
    if (typeof value === 'number' && value !== 0) {
      out.push(`${t(METER_LABEL_KEY[key])} ${meterDelta(value)}`);
    }
  }
  return out;
}
