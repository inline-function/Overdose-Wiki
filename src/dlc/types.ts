// DLC《稍尽春风》类型定义。
export type LocaleText = { zh: string; en: string };

export type Track = 'phys' | 'mental';

export type StatusId =
  | 'serotonin'
  | 'sedation'
  | 'respiratory'
  | 'delirium'
  | 'dissociation'
  | 'counter'
  | 'analgesia'
  | 'painkiller';

export type Tag =
  | 'serotonin'
  | 'sedation'
  | 'respiratory'
  | 'delirium'
  | 'dopamine'
  | 'motivation'
  | 'analgesia'
  | 'nutrition'
  | 'dissociation'
  | 'counter'
  | 'harm';

export type Rarity = 'none' | 'otc' | 'rx' | 'class2' | 'class1' | 'narcotic';

export type Effect =
  | { kind: 'damage'; track: Track; amount: number }
  | { kind: 'heal'; track: Track; amount: number }
  | { kind: 'status'; status: StatusId; amount: number; percent?: number }
  | { kind: 'ap'; amount: number }
  | { kind: 'clear'; status: StatusId; amount: number };

export type Card = {
  id: string;
  name: LocaleText;
  rarity: Rarity;
  tags: Tag[];
  effects: Effect[];
};

export type SpriteVariant = 'paper' | 'mirror' | 'shadow' | 'soft' | 'cup' | 'harukaze';

export type BattleDef = {
  id: string;
  title: LocaleText;
  enemyName: LocaleText;
  epithet: LocaleText;
  sprite: SpriteVariant;
  portrait: string;
  bg: string;
  deck: string[];
  maxPhys: number;
  maxMental: number;
  intro: LocaleText;
  win: LocaleText;
  lose: LocaleText;
  phase2At?: number;
  phase2Log?: LocaleText;
  bgm: string;
};

export type Stage = {
  id: string;
  no: number;
  title: LocaleText;
  blurb: LocaleText;
  battleId: string;
  bg: string;
  rewards: string[];
  shop: string[];
};

export type UpgradeTrack = 'phys' | 'mental' | 'ap' | 'apCap' | 'draw';
export type Upgrades = Record<UpgradeTrack, number>;

/** 战斗可用的强化后属性。 */
export type PlayerStats = {
  maxPhys: number;
  maxMental: number;
  apPerTurn: number;
  apCap: number;
  drawPerTurn: number;
};

export type DlcSave = {
  /** 属性强化等级 */
  upgrades: Upgrades;
  /** 当前关卡（1–8） */
  stage: number;
  /** 已通关的 stage id */
  completed: string[];
  /** 出战牌组（ card id ，含重复） */
  deck: string[];
  /** 收藏数量 */
  collection: Record<string, number>;
  currency: number;
  seenIntro: boolean;
  /** 赢过的 battle id */
  battleWins: string[];
};
