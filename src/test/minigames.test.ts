import { describe, expect, it } from 'vitest';
import { getMiniGame, miniGameList } from '../content/minigames';
import { shuffleArray, shuffleOptions } from '../minigames/shuffle';

describe('minigame registry', () => {
  it('loads the seven chapter-one and five chapter-two minigames', () => {
    const games = miniGameList();
    expect(games).toHaveLength(12);
    const ids = games.map((game) => game.id);
    expect(new Set(ids).size).toBe(12);
    expect(ids.filter((id) => id.startsWith('ch01.'))).toHaveLength(7);
    expect(ids.filter((id) => id.startsWith('ch02.'))).toHaveLength(5);
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
        'grounding',
        'voice-filter',
        'paint-mix',
        'echo-match',
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

  it('keeps chapter two data complete', () => {
    const kHole = getMiniGame('ch02.k-hole');
    expect(kHole?.kind).toBe('grounding');
    if (kHole?.kind === 'grounding') {
      expect(kHole.anchors).toHaveLength(5);
      expect(new Set(kHole.anchors.map((anchor) => anchor.sense)).size).toBe(5);
    }

    const voices = getMiniGame('ch02.voices');
    expect(voices?.kind).toBe('voice-filter');
    if (voices?.kind === 'voice-filter') {
      expect(voices.lines).toHaveLength(6);
      for (const line of voices.lines) expect(['check', 'inside']).toContain(line.suggested);
    }

    const paint = getMiniGame('ch02.paint');
    expect(paint?.kind).toBe('paint-mix');
    if (paint?.kind === 'paint-mix') {
      const pigments = new Set(paint.pigments.map((pigment) => pigment.id));
      expect(paint.layers).toHaveLength(3);
      for (const layer of paint.layers) {
        expect(layer.target.length).toBeGreaterThanOrEqual(2);
        for (const pigment of layer.target) expect(pigments.has(pigment)).toBe(true);
      }
    }

    const care = getMiniGame('ch02.care');
    expect(care?.kind).toBe('wiki-sort');
    if (care?.kind === 'wiki-sort') {
      expect(care.cards).toHaveLength(9);
      const categories = new Set(care.categories.map((category) => category.id));
      for (const card of care.cards) expect(categories.has(card.category)).toBe(true);
    }

    const echo = getMiniGame('ch02.echo');
    expect(echo?.kind).toBe('echo-match');
    if (echo?.kind === 'echo-match') {
      expect(echo.pairs).toHaveLength(4);
      for (const pair of echo.pairs) {
        expect(pair.left.text.length).toBeGreaterThan(0);
        expect(pair.right.text.length).toBeGreaterThan(0);
      }
    }
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
