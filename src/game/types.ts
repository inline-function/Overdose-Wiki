export const CONSENT_VERSION = 2;
export const SAVE_VERSION = 1 as const;

export const STARTER_CARDS = [
  'sertraline',
  'dextromethorphan',
  'magnesium_threonate',
  'caffeine',
  'naloxone',
  'pregabalin',
  'fluoxetine',
  'amantadine',
] as const;

export type ScaleSetting = 'auto' | 1 | 2 | 3 | 4;

export type Settings = {
  scale: ScaleSetting;
  font: 'normal' | 'large';
  motion: 'auto' | 'reduce';
  contrast: 'normal' | 'high';
  scanlines: boolean;
  spoilers: boolean;
  audio: { bgm: number; sfx: number; mute: boolean };
};

export type HistoryEntry = {
  at: string;
  kind: 'scene' | 'report' | 'battle' | 'settings';
  label: string;
  href: string;
  ref?: string;
};

export type BattleProgress = {
  id: string;
  returnScene: string;
  returnBeat: number;
  seed: number;
};

export type Save = {
  version: typeof SAVE_VERSION;
  consent: { version: number; acceptedAt: string };
  progress: {
    sceneId?: string;
    beat: number;
    reportId?: string;
    segmentId?: string;
    battle?: BattleProgress;
  };
  read: Record<string, string[]>;
  completedScenes: string[];
  choices: Record<string, string>;
  unlocks: string[];
  deck: Record<string, number>;
  ownedCards: Record<string, number>;
  boxes: number;
  claimedDocs: string[];
  claimedQuests: string[];
  readEffects: string[];
  seenIntros: string[];
  /** 已走完的精神分析案例 id */
  analysis: string[];
  settings: Settings;
  history: HistoryEntry[];
};

export const DEFAULT_SETTINGS: Settings = {
  scale: 'auto',
  font: 'normal',
  motion: 'auto',
  contrast: 'normal',
  scanlines: true,
  spoilers: false,
  audio: { bgm: 60, sfx: 70, mute: false },
};

export function defaultSave(): Save {
  return {
    version: SAVE_VERSION,
    consent: { version: 0, acceptedAt: '' },
    progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
    read: {},
    completedScenes: [],
    choices: {},
    unlocks: [],
    deck: {},
    ownedCards: Object.fromEntries(STARTER_CARDS.map((id) => [id, 1])),
    boxes: 30,
    claimedDocs: [],
    claimedQuests: [],
    readEffects: [],
    seenIntros: [],
    analysis: [],
    settings: actionSettings(),
    history: [],
  };
}

function actionSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    audio: { ...DEFAULT_SETTINGS.audio },
  };
}