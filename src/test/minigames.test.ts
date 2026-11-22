import { describe, expect, it } from 'vitest';
import { getMiniGame, miniGameList } from '../content/minigames';
import { shuffleArray, shuffleOptions } from '../minigames/shuffle';

describe('minigame registry', () => {
  it('loads the seven chapter-one minigames', () => {
    const games = miniGameList();
    expect(games).toHaveLength(7);
    const ids = games.map((game) => game.id);
    expect(new Set(ids).size).toBe(7);
    for (const id of ids) expect(getMiniGame(id)?.id).toBe(id);
  });

  it('covers every supported kind', () => {
    expect(new Set(miniGameList().map((game) => game.kind))).toEqual(
      new Set([
        'memory-collage',
        'forum-fix',
        'chat-triage',
        'trip-timeline',
        'perception',
        'wiki-sort',
        'find-object',
      ]),
    );
  });

  it('shuffles answer options without losing any or putting the correct one first', () => {
    const source = ['correct', 'wrong-a', 'wrong-b'];
    const result = shuffleOptions(source, (item) => item === 'correct', () => 0.99);
    expect(result.filter((item) => item === 'correct')).toHaveLength(1);
    expect([...result].sort()).toEqual([...source].sort());
    expect(result[0]).not.toBe('correct');

    const plain = shuffleArray([1, 2, 3], () => 0.5);
    expect([...plain].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('keeps timeline order and wiki categories self-consistent', () => {
    for (const game of miniGameList()) {
      if (game.kind === 'trip-timeline') {
        expect(game.cards.map((card) => card.order).sort((a, b) => a - b)).toEqual(
          game.cards.map((_, index) => index + 1),
        );
      }
      if (game.kind === 'wiki-sort') {
        const categories = new Set(game.categories.map((category) => category.id));
        for (const card of game.cards) expect(categories.has(card.category)).toBe(true);
      }
    }
  });
});
