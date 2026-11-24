import type { WarEffectPatch } from '../content/types';
import type { AfterstorySave } from '../afterstory/types';

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

export type WarDecision = {
  choice: string;
  effects: WarEffectPatch;
};

export type WarTable = {
  goto: number;
  chicken: number;
  trust: number;
  archive: number;
  escalation: number;
  decisions: Record<string, WarDecision>;
  flags: string[];
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
  /** 已完成的小玩法 id */
  completedMinigames: string[];
  /** 第四章战局：跨四个玩法保留的政治状态 */
  warTable: WarTable;
  /** 非正史 DLC：入口、八回合存档与已见结局 */
  afterstory?: AfterstorySave;
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

export function defaultWarTable(): WarTable {
  return {
    goto: 50,
    chicken: 50,
    trust: 50,
    archive: 50,
    escalation: 1,
    decisions: {},
    flags: [],
  };
}

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
    completedMinigames: [],
    warTable: defaultWarTable(),
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