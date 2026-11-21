import type { NeuroId } from '../content/types';
import { applyStatus, clearStatus } from './statuses';
import type { SideState } from './types';

export const NEUROS: NeuroId[] = [
  '血清素',
  '多巴胺',
  '去甲肾上腺素',
  '谷氨酸',
  'GABA',
  '乙酰胆碱',
  '组胺',
  '内啡肽',
];

export function defaultNeuro(): Record<NeuroId, number> {
  return Object.fromEntries(NEUROS.map((id) => [id, 50])) as Record<NeuroId, number>;
}

export function clampNeuro(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function applyNeuro(side: SideState, neuro: NeuroId, amount: number): void {
  side.neuro[neuro] = clampNeuro(side.neuro[neuro] + amount);
}

export function applyNeuroThresholds(
  side: SideState,
  before: Record<NeuroId, number>,
  log: string[],
): void {
  const crossedHigh = (id: NeuroId) => before[id] < 80 && side.neuro[id] >= 80;
  const crossedLow = (id: NeuroId) => before[id] > 20 && side.neuro[id] <= 20;

  if (crossedHigh('血清素')) {
    applyStatus(side, '血清素综合征', 2, 3);
    log.push('血清素越过阈值：血清素综合征。');
  }
  if (crossedHigh('多巴胺')) {
    applyStatus(side, '欣快', 1, 3);
    log.push('多巴胺越过阈值：欣快。');
  }
  if (crossedHigh('谷氨酸')) {
    applyStatus(side, '激越', 1, 3);
    log.push('谷氨酸越过阈值：激越。');
  }
  if (crossedHigh('GABA')) {
    applyStatus(side, '镇静', 1, 3);
    log.push('GABA 越过阈值：镇静。');
  }
  if (crossedHigh('组胺')) {
    clearStatus(side, '镇静', 1);
    log.push('组胺升高：清醒了一点。');
  }
  if (crossedHigh('内啡肽')) {
    applyStatus(side, '呼吸抑制', 1, 3);
    log.push('内啡肽越过阈值：呼吸抑制。');
  }
  if (crossedLow('谷氨酸')) {
    applyStatus(side, '解离', 1, 3);
    log.push('谷氨酸过低：解离。');
  }
  if (crossedLow('GABA')) {
    applyStatus(side, '激越', 1, 3);
    log.push('GABA 过低：激越。');
  }
  if (crossedLow('组胺')) {
    applyStatus(side, '镇静', 1, 3);
    log.push('组胺过低：镇静。');
  }
}

export function tickNeuro(side: SideState, log: string[]): void {
  const hurt = (track: 'phys' | 'psy', amount: number, reason: string) => {
    if (track === 'phys') side.phys = Math.max(0, side.phys - amount);
    else side.psy = Math.max(0, side.psy - amount);
    log.push(`${reason}：${track === 'phys' ? '生理' : '心理'} -${amount}`);
  };
  if (side.neuro['血清素'] <= 20) hurt('psy', 2, '血清素过低');
  if (side.neuro['多巴胺'] <= 20) hurt('psy', 1, '多巴胺过低');
  if (side.neuro['去甲肾上腺素'] >= 80) hurt('phys', 2, '去甲肾上腺素过高');
  if (side.neuro['去甲肾上腺素'] <= 20) hurt('psy', 1, '去甲肾上腺素过低');
  if (side.neuro['乙酰胆碱'] >= 80) hurt('phys', 1, '乙酰胆碱过高');
  if (side.neuro['乙酰胆碱'] <= 20) hurt('psy', 1, '乙酰胆碱过低');
  if (side.neuro['内啡肽'] <= 20) hurt('phys', 1, '内啡肽过低');
}

export function driftNeuro(side: SideState): void {
  for (const neuro of NEUROS) {
    const value = side.neuro[neuro];
    side.neuro[neuro] = value > 50 ? value - 1 : value < 50 ? value + 1 : 50;
  }
}