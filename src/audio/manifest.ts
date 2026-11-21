export const ATTRIBUTION = '音乐由[乌鸦Producer]提供';

export type Cue = { src: string; loop: boolean };

export const CUES = {
  title: { src: '/audio/bgm/title.mp3', loop: true },
  archive: { src: '/audio/bgm/archive.mp3', loop: true },
  ch01: { src: '/audio/bgm/ch01.mp3', loop: true },
  afterglow: { src: '/audio/bgm/afterglow.mp3', loop: true },
  'ch02-early': { src: '/audio/bgm/ch02-early.mp3', loop: true },
  'ch02-late': { src: '/audio/bgm/ch02-late.mp3', loop: true },
  morning: { src: '/audio/bgm/morning.mp3', loop: true },
  ch03: { src: '/audio/bgm/ch03.mp3', loop: true },
  disappear: { src: '/audio/bgm/disappear.mp3', loop: true },
  'dlc-summer': { src: '/audio/bgm/dlc-summer.mp3', loop: true },
  'night-market': { src: '/audio/bgm/night-market.mp3', loop: true },
  tragedy: { src: '/audio/bgm/tragedy.mp3', loop: true },
  battle: { src: '/audio/bgm/battle.mp3', loop: true },
  tension: { src: '/audio/bgm/tension.mp3', loop: true },
  credits: { src: '/audio/bgm/credits.mp3', loop: false },
  extras: { src: '/audio/bgm/extras.mp3', loop: true },
} satisfies Record<string, Cue>;

export type CueId = keyof typeof CUES;

export const AUDIO_MANIFEST = {
  cues: CUES,
  sfx: {
    click: '/audio/sfx-click.wav',
    card: '/audio/sfx-card.wav',
    turn: '/audio/sfx-turn.wav',
    stamp: '/audio/sfx-stamp.wav',
  },
};