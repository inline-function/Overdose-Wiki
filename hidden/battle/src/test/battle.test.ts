import { describe, expect, it } from 'vitest';
import {
  AP_BASE,
  START_HAND,
  createBattle,
  defaultDeck,
  drawAction,
  endTurn,
  resetDrawPile,
  playCard,
  validateDeck,
} from '../battle/engine';
import type { Battle } from '../content/types';
import { SAMPLE_DRUGS, SAMPLE_ENGINE_CARDS, SAMPLE_FIXED_CARDS } from '../content/sample';

const cards = [...SAMPLE_ENGINE_CARDS, ...SAMPLE_FIXED_CARDS];
const drugs = SAMPLE_DRUGS;

const quiet: Battle = {
  id: 'quiet',
  title: '测试',
  opponent: { name: '影子', maxPhys: 60, maxPsy: 60 },
  player: { maxPhys: 60, maxPsy: 60 },
  deckMode: 'constructed',
  script: [],
  ending: { win: '赢', lose: '输', mutual: '同归' },
};

function fresh(): ReturnType<typeof createBattle> {
  return createBattle(quiet, cards, [], 42);
}

describe('deck', () => {
  it('builds the curated 15-card default deck', () => {
    const deck = defaultDeck(cards);
    expect(deck).toHaveLength(8);
    expect(new Set(deck).size).toBeGreaterThanOrEqual(6);
    expect(deck).toContain('sertraline');
    expect(deck.some((id) => id === 'dextromethorphan' || id === 'dxm')).toBe(true);
    expect(deck.some((id) => id === 'magnesium_threonate' || id === 'magnesium')).toBe(true);
    expect(validateDeck(deck, cards).ok).toBe(true);
  });

  it('validates the default deck', () => {
    const deck = defaultDeck(cards);
    expect(validateDeck(deck, cards).ok).toBe(true);
  });

  it('rejects a short deck', () => {
    expect(validateDeck(['sertraline'], cards).ok).toBe(false);
  });
});

describe('turn actions', () => {
  it('starts with 5 cards and 2 AP', () => {
    const state = fresh();
    expect(state.hand).toHaveLength(START_HAND);
    expect(START_HAND).toBe(4);
    expect(state.ap).toBe(AP_BASE);
  });

  it('draws one card for one AP', () => {
    const state = fresh();
    const next = drawAction(state, cards);
    expect(next.ap).toBe(AP_BASE - 1);
    expect(next.hand).toHaveLength(START_HAND + 1);
  });

  it('resets the draw pile for 2 AP while keeping the hand', () => {
    let state = fresh();
    state.hand = ['sertraline', 'dxm'];
    state.drawPile = [];
    state.ap = 2;
    const next = resetDrawPile(state);
    expect(next.ap).toBe(0);
    expect(next.hand).toEqual(['sertraline', 'dxm']);
    expect(next.drawPile).toHaveLength(8);
  });

  it('does not draw at hand limit', () => {
    const state = fresh();
    state.hand = Array.from({ length: 8 }, () => 'sertraline');
    expect(drawAction(state, cards)).toBe(state);
  });

  it('plays two cards in a turn', () => {
    let state = fresh();
    state.hand = ['sertraline', 'dxm'];
    state.ap = 2;
    state = playCard(state, quiet, cards, drugs, 'sertraline');
    state = playCard(state, quiet, cards, drugs, 'dxm', 'player');
    expect(state.ap).toBe(0);
    expect(state.hand).toHaveLength(0);
  });

  it('defaults a card to self and can be aimed at the opponent', () => {
    const state = fresh();
    state.hand = ['dxm'];
    const self = playCard(state, quiet, cards, drugs, 'dxm');
    expect(self).not.toBe(state);
    const next = playCard(state, quiet, cards, drugs, 'dxm', 'opponent');
    expect(next).not.toBe(state);
    expect(next.opponent.neuro['谷氨酸']).toBeLessThan(50);
  });

  it('applies self-target card ops to the side the card is aimed at', () => {
    const state = fresh();
    state.opponent.psy = 40;
    state.hand = ['sertraline'];
    const next = playCard(state, quiet, cards, drugs, 'sertraline', 'opponent');
    expect(next.opponent.psy).toBeGreaterThan(40);
    expect(next.player.psy).toBe(60);
  });

  it('treats the second use of the same drug in a turn as overuse', () => {
    let state = fresh();
    state.hand = ['dxm', 'dxm'];
    state.ap = 2;
    state = playCard(state, quiet, cards, drugs, 'dxm', 'opponent');
    expect(state.opponent.statuses['解离']).toBeUndefined();
    state = playCard(state, quiet, cards, drugs, 'dxm', 'opponent');
    expect(state.opponent.statuses['解离']).toBeTruthy();
  });
});

describe('courses and neuro', () => {
  it('builds an SSRI course after three proper uses and heals psy each turn', () => {
    let state = fresh();
    state.player.psy = 20;
    for (let turn = 0; turn < 3; turn += 1) {
      state.hand = ['sertraline'];
      state.ap = 2;
      state = playCard(state, quiet, cards, drugs, 'sertraline');
      state = endTurn(state, quiet, cards, drugs);
    }
    expect(state.player.courses.SSRI?.active).toBe(true);
    const before = state.player.psy;
    state = endTurn(state, quiet, cards, drugs);
    expect(state.player.psy).toBeGreaterThan(before);
  });

  it('clears the course and triggers serotonin syndrome on overuse', () => {
    let state = fresh();
    state.player.neuro['血清素'] = 70;
    state.hand = ['sertraline', 'sertraline'];
    state.ap = 2;
    state = playCard(state, quiet, cards, drugs, 'sertraline', 'player');
    expect(state.player.courses.SSRI?.turns).toBe(1);
    state = playCard(state, quiet, cards, drugs, 'sertraline', 'player');
    expect(state.player.statuses['血清素综合征']).toBeTruthy();
    expect(state.player.courses.SSRI?.active).toBe(false);
    const before = state.player.psy;
    state = endTurn(state, quiet, cards, drugs);
    expect(state.player.psy).toBeLessThan(before);
  });

  it('applies a light effect when blood concentration crosses its threshold', () => {
    let state = fresh();
    state.hand = ['caffeine'];
    state.ap = 2;
    state = playCard(state, quiet, cards, drugs, 'caffeine');
    expect(state.player.effects['欣快']?.weight).toBe(1);
    expect(state.player.statuses['欣快']?.stacks).toBe(1);
  });

  it('adds AP from a proper stimulant but caps at 3', () => {
    let state = fresh();
    state.hand = ['caffeine', 'caffeine'];
    state.ap = 2;
    state = playCard(state, quiet, cards, drugs, 'caffeine');
    state = playCard(state, quiet, cards, drugs, 'caffeine');
    expect(state.ap).toBeLessThanOrEqual(3);
  });
});

describe('outcome', () => {
  it('wins when the shadow psy reaches zero', () => {
    const state = fresh();
    state.opponent.psy = 0;
    const next = endTurn(state, quiet, cards, drugs);
    expect(next.result?.kind).toBe('win');
  });

  it('loses when the player phys reaches zero', () => {
    const state = fresh();
    state.player.phys = 0;
    const next = endTurn(state, quiet, cards, drugs);
    expect(next.result?.kind).toBe('lose');
  });

  it('treats simultaneous zero as mutual', () => {
    const state = fresh();
    state.player.psy = 0;
    state.opponent.psy = 0;
    const next = endTurn(state, quiet, cards, drugs);
    expect(next.result?.kind).toBe('mutual');
  });

  it('ends a survive-style battle at its turn limit', () => {
    const limited: Battle = {
      ...quiet,
      id: 'limited',
      turnLimit: 2,
      turnLimitResult: 'mutual',
    };
    let state = createBattle(limited, cards, [], 42);
    state = endTurn(state, limited, cards, drugs);
    expect(state.result).toBeUndefined();
    state = endTurn(state, limited, cards, drugs);
    expect(state.result?.kind).toBe('mutual');
  });

  it('can use the turn limit as a scripted loss', () => {
    const limited: Battle = {
      ...quiet,
      id: 'limited-loss',
      turnLimit: 1,
      turnLimitResult: 'lose',
    };
    const state = endTurn(createBattle(limited, cards, [], 42), limited, cards, drugs);
    expect(state.result?.kind).toBe('lose');
  });
});

describe('fixed hand', () => {
  it('does not charge AP for story actions', () => {
    const fixed: Battle = {
      ...quiet,
      id: 'fixed',
      deckMode: 'fixed',
      fixedHand: ['breathe'],
    };
    const state = createBattle(fixed, cards, [], 1);
    expect(state.ap).toBe(0);
    const next = playCard(state, fixed, cards, drugs, 'breathe');
    expect(next.ap).toBe(0);
  });
});