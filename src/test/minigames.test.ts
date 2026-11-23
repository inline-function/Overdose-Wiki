import { describe, expect, it } from 'vitest';
import { getMiniGame, miniGameList } from '../content/minigames';
import { shuffleArray, shuffleOptions } from '../minigames/shuffle';

describe('minigame registry', () => {
  it('loads the chapter-one through chapter-four minigames', () => {
    const games = miniGameList();
    expect(games).toHaveLength(20);
    const ids = games.map((game) => game.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids.filter((id) => id.startsWith('ch01.'))).toHaveLength(7);
    expect(ids.filter((id) => id.startsWith('ch02.'))).toHaveLength(5);
    expect(ids.filter((id) => id.startsWith('ch03.'))).toHaveLength(4);
    expect(ids.filter((id) => id.startsWith('ch04.'))).toHaveLength(4);
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
        'archive-envelope',
        'memory-develop',
        'emotion-return',
        'anchor-room',
        'camera-wall',
        'rumor-map',
        'testimony-board',
        'redact-document',
        'knowledge-dossier',
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

  it('keeps chapter three data complete', () => {
    const afterglow = getMiniGame('ch03.afterglow');
    expect(afterglow?.kind).toBe('memory-develop');
    if (afterglow?.kind === 'memory-develop') {
      expect(afterglow.photos).toHaveLength(5);
      expect(afterglow.photos.filter((photo) => photo.image)).toHaveLength(4);
      expect(afterglow.photos.filter((photo) => !photo.image)).toHaveLength(1);
      for (const photo of afterglow.photos) {
        expect(photo.label.length).toBeGreaterThan(0);
        expect(photo.line.length).toBeGreaterThan(0);
      }
    }

    const overload = getMiniGame('ch03.overload');
    expect(overload?.kind).toBe('emotion-return');
    if (overload?.kind === 'emotion-return') {
      expect(overload.emotions).toHaveLength(5);
      expect(new Set(overload.emotions.map((emotion) => emotion.id)).size).toBe(5);
      for (const emotion of overload.emotions) {
        expect(emotion.from.length).toBeGreaterThan(0);
        expect(emotion.line.length).toBeGreaterThan(0);
      }
    }

    const anchor = getMiniGame('ch03.anchor');
    expect(anchor?.kind).toBe('anchor-room');
    if (anchor?.kind === 'anchor-room') {
      expect(anchor.anchors).toHaveLength(4);
      expect(anchor.background).toMatch(/^assets-private\/bg\//);
      for (const object of anchor.anchors) {
        expect(object.x).toBeGreaterThanOrEqual(0);
        expect(object.x).toBeLessThanOrEqual(100);
        expect(object.line.length).toBeGreaterThan(0);
      }
    }

    const search = getMiniGame('ch03.search');
    expect(search?.kind).toBe('camera-wall');
    if (search?.kind === 'camera-wall') {
      expect(search.feeds).toHaveLength(6);
      for (const feed of search.feeds) {
        expect(feed.time).toMatch(/^\d{2}:\d{2}$/);
        expect(feed.image).toMatch(/^assets-private\/bg\//);
      }
    }
  });

  it('keeps chapter two data complete', () => {
    const kHole = getMiniGame('ch02.k-hole');
    expect(kHole?.kind).toBe('grounding');
    if (kHole?.kind === 'grounding') {
      expect(kHole.anchors).toHaveLength(5);
      expect(new Set(kHole.anchors.map((anchor) => anchor.sense)).size).toBe(5);
      for (const anchor of kHole.anchors) {
        expect(anchor.text.length).toBeGreaterThan(0);
        expect(anchor.image).toMatch(/^assets-private\/bg\//);
      }
    }

    const voices = getMiniGame('ch02.voices');
    expect(voices?.kind).toBe('voice-filter');
    if (voices?.kind === 'voice-filter') {
      expect(voices.voices.length).toBeGreaterThanOrEqual(20);
      expect(voices.image).toMatch(/^assets-private\/bg\//);
      for (const voice of voices.voices) expect(voice.text.length).toBeGreaterThan(0);
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
      expect(care.postCompletion?.categories).toHaveLength(1);
      expect(care.postCompletion?.categories[0]?.label).toBe('你能做的');
      expect(care.postCompletion?.cards).toHaveLength(1);
      expect(care.postCompletion?.cards[0]?.label).toBe('你不会死');
      expect(care.postCompletion?.cards[0]?.category).toBe('can');
    }

    const archive = getMiniGame('ch02.archive');
    expect(archive?.kind).toBe('archive-envelope');
    if (archive?.kind === 'archive-envelope') {
      expect(archive.cards.length).toBeGreaterThanOrEqual(3);
      expect(archive.name).toBe('桜崎彩加');
      expect(archive.background).toMatch(/^assets-private\/bg\//);
      for (const card of archive.cards) expect(card.text.length).toBeGreaterThan(0);
    }
  });


  it('keeps chapter four strategic operations complete', () => {
    const rumor = getMiniGame('ch04.rumor');
    expect(rumor?.kind).toBe('rumor-map');
    if (rumor?.kind === 'rumor-map') {
      expect(rumor.rounds).toHaveLength(2);
      expect(rumor.background).toMatch(/^assets-private\/bg\//);
      for (const round of rumor.rounds) {
        expect(round.prompt.length).toBeGreaterThan(0);
        expect(round.choices).toHaveLength(3);
        for (const choice of round.choices) {
          expect(choice.label.length).toBeGreaterThan(0);
          expect(choice.result.length).toBeGreaterThan(0);
          expect(Object.keys(choice.effects).length).toBeGreaterThan(1);
        }
      }
    }

    const testimony = getMiniGame('ch04.roshomon');
    expect(testimony?.kind).toBe('testimony-board');
    if (testimony?.kind === 'testimony-board') {
      expect(testimony.rounds).toHaveLength(2);
      for (const round of testimony.rounds) {
        expect(round.choices).toHaveLength(3);
        for (const choice of round.choices) {
          expect(choice.tag).toBeTruthy();
          expect(choice.result.length).toBeGreaterThan(0);
        }
      }
    }

    const redact = getMiniGame('ch04.redact');
    expect(redact?.kind).toBe('redact-document');
    if (redact?.kind === 'redact-document') {
      expect(redact.lines).toHaveLength(8);
      expect(redact.budget).toBe(4);
      expect(redact.minPublic).toBe(3);
      expect(redact.lines.filter((line) => line.stake === 'person')).toHaveLength(4);
      expect(redact.lines.filter((line) => line.stake === 'evidence')).toHaveLength(1);
      for (const line of redact.lines) {
        expect(Object.keys(line.redactEffects).length).toBeGreaterThan(0);
        expect(Object.keys(line.keepEffects).length).toBeGreaterThan(0);
      }
    }

    const knowledge = getMiniGame('ch04.knowledge');
    expect(knowledge?.kind).toBe('knowledge-dossier');
    if (knowledge?.kind === 'knowledge-dossier') {
      expect(knowledge.cards).toHaveLength(4);
      expect(knowledge.policies).toHaveLength(3);
      for (const card of knowledge.cards) {
        expect(card.faces).toHaveLength(2);
        expect(new Set(card.faces.map((face) => face.tone))).toEqual(new Set(['help', 'harm']));
      }
      for (const policy of knowledge.policies) {
        expect(Object.keys(policy.effects).length).toBeGreaterThan(0);
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
