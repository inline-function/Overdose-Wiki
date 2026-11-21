import type { EnzymeId, Strength } from '../content/types';
import type { SideState } from './types';

export const ENZYMES: EnzymeId[] = [
  'CYP1A2',
  'CYP2A6',
  'CYP2B6',
  'CYP2C8',
  'CYP2C9',
  'CYP2C19',
  'CYP2D6',
  'CYP2E1',
  'CYP3A4',
  'CYP3A5',
  'MAO-A',
  'MAO-B',
];

const STRENGTH: Record<Strength, number> = {
  weak: 0.15,
  moderate: 0.3,
  strong: 0.5,
};

export function defaultEnzymes(): Record<EnzymeId, number> {
  return Object.fromEntries(ENZYMES.map((id) => [id, 1])) as Record<EnzymeId, number>;
}

export function applyEnzyme(
  side: SideState,
  enzyme: EnzymeId,
  mode: 'inhibit' | 'induce',
  strength: Strength,
): void {
  const amount = STRENGTH[strength];
  side.enzymes[enzyme] = Math.max(
    0.2,
    Math.min(2, side.enzymes[enzyme] + (mode === 'inhibit' ? -amount : amount)),
  );
}

export function decayEnzymes(side: SideState): void {
  for (const enzyme of ENZYMES) {
    const value = side.enzymes[enzyme];
    if (Math.abs(value - 1) <= 0.1) {
      side.enzymes[enzyme] = 1;
    } else {
      side.enzymes[enzyme] = value + (value > 1 ? -0.1 : 0.1);
    }
  }
}

export function cardLoad(side: SideState, substrates: EnzymeId[]): number {
  if (!substrates.length) return 1;
  const activity = Math.min(...substrates.map((enzyme) => side.enzymes[enzyme]));
  return Math.max(0.5, Math.min(2, 1 / activity));
}