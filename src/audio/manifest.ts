export const ATTRIBUTION = '音乐由[乌鸦Producer]提供';

export type Cue = { src: string; loop: boolean };

// GitHub Pages 部署在 /Overdose-Wiki/ 子路径下，音频必须跟随 Vite 的 base，
// 不能写成根路径 /audio/...，否则会请求到域名根目录并返回 404。
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const CUES = {
  title: { src: asset('audio/bgm/title.mp3'), loop: true },
  archive: { src: asset('audio/bgm/archive.mp3'), loop: true },
  ch01: { src: asset('audio/bgm/ch01.mp3'), loop: true },
  afterglow: { src: asset('audio/bgm/afterglow.mp3'), loop: true },
  'ch02-early': { src: asset('audio/bgm/ch02-early.mp3'), loop: true },
  'ch02-late': { src: asset('audio/bgm/ch02-late.mp3'), loop: true },
  morning: { src: asset('audio/bgm/morning.mp3'), loop: true },
  ch03: { src: asset('audio/bgm/ch03.mp3'), loop: true },
  disappear: { src: asset('audio/bgm/disappear.mp3'), loop: true },
  'dlc-summer': { src: asset('audio/bgm/dlc-summer.mp3'), loop: true },
  'night-market': { src: asset('audio/bgm/night-market.mp3'), loop: true },
  tragedy: { src: asset('audio/bgm/tragedy.mp3'), loop: true },
  battle: { src: asset('audio/bgm/battle.mp3'), loop: true },
  tension: { src: asset('audio/bgm/tension.mp3'), loop: true },
  credits: { src: asset('audio/bgm/credits.mp3'), loop: false },
  extras: { src: asset('audio/bgm/extras.mp3'), loop: true },
} satisfies Record<string, Cue>;

export type CueId = keyof typeof CUES;

export const AUDIO_MANIFEST = {
  cues: CUES,
  sfx: {
    click: asset('audio/sfx-click.wav'),
    card: asset('audio/sfx-card.wav'),
    turn: asset('audio/sfx-turn.wav'),
    stamp: asset('audio/sfx-stamp.wav'),
  },
};
