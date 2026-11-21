import type { Card } from '../content/types';

export function validateDeck(ids: string[], cards: Card[]) {
  const errors: string[] = [];
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  if (ids.length < 4 || ids.length > 8) errors.push('卡组需要 4–8 张');
  for (const id of ids) {
    if (!cardMap.has(id)) errors.push(`不存在的卡：${id}`);
  }
  return { ok: errors.length === 0, errors };
}

const DEFAULT_COUNTS: Array<[string, number]> = [
  ['sertraline', 1],
  ['dextromethorphan', 1],
  ['magnesium_threonate', 1],
  ['caffeine', 1],
  ['naloxone', 1],
  ['pregabalin', 1],
  ['fluoxetine', 1],
  ['amantadine', 1],
];

const DEFAULT_ALIASES: Record<string, string[]> = {
  dextromethorphan: ['dextromethorphan', 'dxm'],
  magnesium_threonate: ['magnesium_threonate', 'magnesium'],
};

export function defaultDeck(cards: Card[]): string[] {
  const available = new Map(
    cards.filter((card) => !card.storyOnly).map((card) => [card.id, card]),
  );
  const deck: string[] = [];
  for (const [id, count] of DEFAULT_COUNTS) {
    const actual = (DEFAULT_ALIASES[id] ?? [id]).find((candidate) => available.has(candidate));
    if (!actual) continue;
    for (let i = 0; i < count; i += 1) deck.push(actual);
  }
  for (const card of available.values()) {
    if (deck.length >= 8) break;
    if (!deck.includes(card.id)) deck.push(card.id);
  }
  for (const card of available.values()) {
    if (deck.length >= 8) break;
    deck.push(card.id);
  }
  return deck.slice(0, 8);
}
