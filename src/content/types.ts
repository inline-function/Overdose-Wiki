export type ContentFlag =
  | 'drug_use'
  | 'overdose'
  | 'suicide_ideation'
  | 'suicide'
  | 'self_harm'
  | 'death_of_minor'
  | 'coma'
  | 'psychosis'
  | 'amnesia'
  | 'depression'
  | 'paranoia'
  | 'battle'
  | 'ending';

export type Unlock = {
  kind: 'report' | 'effect' | 'extra' | 'side' | 'dlc' | 'chapter';
  ref: string;
};

export type ChoiceOption = {
  id: string;
  label: string;
  targetScene?: string;
  targetBattle?: string;
  note?: string;
  unlock?: Unlock;
};

export type AnalysisBlockKind = '症状' | '病因' | '认知' | '好处';

export type AnalysisKeyword = { text: string; blockId: string };

export type AnalysisBlock = { id: string; kind: AnalysisBlockKind; text: string };

export type AnalysisSlot = {
  id: string;
  chain: 'main' | 'branch';
  /** 能放进这个空位的积木 id；空数组表示任何积木都放不进 */
  accepts: string[];
  hint?: string;
};

export type AnalysisCase = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  intro: string;
  report: { title: string; paragraphs: string[] };
  keywords: AnalysisKeyword[];
  blocks: AnalysisBlock[];
  slots: AnalysisSlot[];
  reveal: { quote: string; paragraphs: string[] };
  restore: { text: string; annotation: string };
};

export type AnalysisCaseMeta = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
};

export type MiniGameKind =
  | 'memory-collage'
  | 'forum-fix'
  | 'chat-triage'
  | 'trip-timeline'
  | 'perception'
  | 'wiki-sort'
  | 'find-object'
  | 'grounding'
  | 'voice-filter'
  | 'paint-mix'
  | 'echo-match'
  | 'archive-envelope'
  | 'memory-develop'
  | 'emotion-return'
  | 'anchor-room'
  | 'camera-wall'
  | 'rumor-map'
  | 'testimony-board'
  | 'redact-document'
  | 'knowledge-dossier';

export type MiniGameBase = {
  id: string;
  kind: MiniGameKind;
  title: string;
  subtitle: string;
  intro: string;
  closing: string;
  doneLabel?: string;
};

export type MemoryFragment = {
  id: string;
  label: string;
  line: string;
  /** Workspace-relative private background image, e.g. assets-private/bg/....png */
  image: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone?: 'red' | 'yellow' | 'blue' | 'green';
};

export type MemoryCollageGame = MiniGameBase & {
  kind: 'memory-collage';
  fragments: MemoryFragment[];
};

export type ForumError = {
  phrase: string;
  options: string[];
  correct: string;
  right: string;
  wrong: string;
};

export type ForumPost = {
  id: string;
  author: string;
  role: string;
  body: string;
};

export type ForumFixGame = MiniGameBase & {
  kind: 'forum-fix';
  threadTitle: string;
  posts: ForumPost[];
  errors: Record<string, ForumError>;
};

export type ChatReply = {
  id: string;
  label: string;
  ok: boolean;
  reply: string;
  followUp?: string;
};

export type ChatQuestion = {
  id: string;
  from: string;
  text: string;
  replies: ChatReply[];
  interlude?: string;
};

export type ChatTriageGame = MiniGameBase & {
  kind: 'chat-triage';
  questions: ChatQuestion[];
};

export type TripCard = {
  id: string;
  label: string;
  line: string;
  order: number;
};

export type TripTimelineGame = MiniGameBase & {
  kind: 'trip-timeline';
  cards: TripCard[];
};

export type PerceptionWord = {
  id: string;
  text: string;
  note?: string;
  x: number;
  y: number;
};

export type PerceptionGame = MiniGameBase & {
  kind: 'perception';
  words: PerceptionWord[];
  /** How many words must be caught to finish; defaults to 6. */
  required?: number;
};

export type WikiCategory = { id: string; label: string };

export type WikiCard = {
  id: string;
  label: string;
  note: string;
  category: string;
};

export type WikiSortPostCompletion = {
  glitchCaption: string;
  caption: string;
  categories: WikiCategory[];
  cards: WikiCard[];
  doneLabel?: string;
  intro?: string;
};

export type WikiSortGame = MiniGameBase & {
  kind: 'wiki-sort';
  categories: WikiCategory[];
  cards: WikiCard[];
  /** Optional vocabulary so the same board can read as care triage instead of wiki filing. */
  trayLabel?: string;
  placeVerb?: string;
  /** Optional false-victory reset shown after the board is finished. */
  postCompletion?: WikiSortPostCompletion;
};

export type FindShape = 'kettle' | 'tea' | 'cup' | 'phone' | 'pill';

export type FindObject = {
  id: string;
  label: string;
  shape: FindShape;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FindPrompt = { text: string; target: string };

export type FindObjectGame = MiniGameBase & {
  kind: 'find-object';
  prompts: FindPrompt[];
  objects: FindObject[];
};

export type GroundingSense = '看' | '听' | '触' | '闻' | '尝';

export type GroundingAnchor = {
  id: string;
  sense: GroundingSense;
  /** Floating phrase typed on the dark stage. */
  text: string;
  /** Caption after it is found. */
  line: string;
  /** Workspace-relative private background image, e.g. assets-private/bg/bg_....png */
  image: string;
};

export type GroundingGame = MiniGameBase & {
  kind: 'grounding';
  anchors: GroundingAnchor[];
};

export type VoiceLine = {
  id: string;
  text: string;
};

export type VoiceFilterGame = MiniGameBase & {
  kind: 'voice-filter';
  voices: VoiceLine[];
  /** Distorted private background image. */
  image: string;
};

export type PaintPigment = { id: string; label: string; color: string };

export type PaintLayer = {
  id: string;
  label: string;
  /** Pigment ids; order does not matter. */
  target: string[];
  underlay: string;
  note: string;
};

export type PaintMixGame = MiniGameBase & {
  kind: 'paint-mix';
  pigments: PaintPigment[];
  layers: PaintLayer[];
};

export type EchoLine = { speaker: string; text: string };

export type EchoPair = {
  id: string;
  left: EchoLine;
  right: EchoLine;
  note: string;
};

export type EchoMatchGame = MiniGameBase & {
  kind: 'echo-match';
  pairs: EchoPair[];
};

export type ArchiveCard = {
  id: string;
  text: string;
};

export type ArchiveEnvelopeGame = MiniGameBase & {
  kind: 'archive-envelope';
  /** Colorful hallucination background behind the envelope. */
  background: string;
  cards: ArchiveCard[];
  /** The full name written on the label, one character at a time. */
  name: string;
};

export type MemoryDevelopPhoto = {
  id: string;
  label: string;
  line: string;
  /** Workspace-relative private background image; omitted for the blank photo. */
  image?: string;
  tone: 'warm' | 'blank';
};

export type MemoryDevelopGame = MiniGameBase & {
  kind: 'memory-develop';
  photos: MemoryDevelopPhoto[];
};

export type EmotionReturnCard = {
  id: string;
  label: string;
  from: string;
  line: string;
};

export type EmotionReturnGame = MiniGameBase & {
  kind: 'emotion-return';
  emotions: EmotionReturnCard[];
};

export type AnchorRoomAnchor = {
  id: string;
  label: string;
  line: string;
  x: number;
  y: number;
};

export type AnchorRoomGame = MiniGameBase & {
  kind: 'anchor-room';
  /** Workspace-relative private background image, e.g. assets-private/bg/bg_higan_home.png */
  background: string;
  anchors: AnchorRoomAnchor[];
};

export type CameraWallFeed = {
  id: string;
  label: string;
  time: string;
  line: string;
  image: string;
};

export type CameraWallGame = MiniGameBase & {
  kind: 'camera-wall';
  feeds: CameraWallFeed[];
};

export type WarEffectPatch = {
  goto?: number;
  chicken?: number;
  trust?: number;
  archive?: number;
  escalation?: number;
  flags?: string[];
};

export type WarChoice = {
  id: string;
  label: string;
  detail: string;
  result: string;
  tag?: string;
  effects: WarEffectPatch;
};

export type WarRound = {
  id: string;
  label?: string;
  prompt: string;
  choices: WarChoice[];
};

export type RumorMapGame = MiniGameBase & {
  kind: 'rumor-map';
  background: string;
  reactions?: Record<string, string>;
  rounds: WarRound[];
};

export type TestimonyBoardGame = MiniGameBase & {
  kind: 'testimony-board';
  background: string;
  reactions?: Record<string, string>;
  rounds: WarRound[];
};

export type RedactStake = 'person' | 'evidence' | 'record';

export type RedactLine = {
  id: string;
  text: string;
  stake: RedactStake;
  note: string;
  redactEffects: WarEffectPatch;
  keepEffects: WarEffectPatch;
};

export type RedactDocumentGame = MiniGameBase & {
  kind: 'redact-document';
  background: string;
  documentTitle: string;
  budget: number;
  minPublic: number;
  lines: RedactLine[];
};

export type KnowledgeFace = {
  text: string;
  tone: 'help' | 'harm';
};

export type KnowledgeCard = {
  id: string;
  title: string;
  faces: [KnowledgeFace, KnowledgeFace];
};

export type KnowledgePolicy = {
  id: string;
  label: string;
  line: string;
  effects: WarEffectPatch;
};

export type KnowledgeDossierGame = MiniGameBase & {
  kind: 'knowledge-dossier';
  background: string;
  cards: KnowledgeCard[];
  policies: KnowledgePolicy[];
};

export type MiniGameData =
  | MemoryCollageGame
  | ForumFixGame
  | ChatTriageGame
  | TripTimelineGame
  | PerceptionGame
  | WikiSortGame
  | FindObjectGame
  | GroundingGame
  | VoiceFilterGame
  | PaintMixGame
  | EchoMatchGame
  | ArchiveEnvelopeGame
  | MemoryDevelopGame
  | EmotionReturnGame
  | AnchorRoomGame
  | CameraWallGame
  | RumorMapGame
  | TestimonyBoardGame
  | RedactDocumentGame
  | KnowledgeDossierGame;

export type EventId = 'civil-war';

export type Beat =
  | { type: 'analysis'; caseId: string; label?: string }
  | { type: 'minigame'; id: string; label?: string }
  | { type: 'narration'; text: string; speaker?: string; fx?: string; emotion?: string }
  | { type: 'dialogue'; speaker: string; text: string; expr?: string; fx?: string; emotion?: string }
  | { type: 'quote'; text: string; source?: string; fx?: string; emotion?: string }
  | { type: 'heading'; text: string }
  | { type: 'choice'; id: string; prompt?: string; options: ChoiceOption[] }
  | { type: 'battle'; battleId: string; label?: string }
  | { type: 'event'; event: EventId }
  | { type: 'bg'; bg: string }
  | { type: 'bust'; speaker: string; expr: string }
  | { type: 'sfx'; id: string };

export type Scene = {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  summary: string;
  flags: ContentFlag[];
  sourceRefs: string[];
  reportId?: string;
  reportSegment?: string;
  stage: { bg: string; bust?: { speaker: string; expr: string } };
  /** 场景切换动画；不给则按 sceneTransition 的旧规则 */
  transition?: 'fade' | 'slide' | 'glitch';
  /** 本场配乐（CueId）；不给则按 SCENE_CUE / 章节默认 */
  cue?: string;
  beats: Beat[];
  next?: string;
  unlocks?: Unlock[];
};

export type Chapter = {
  id: string;
  title: string;
  scenes: Scene[];
};

export type ReportSegment = {
  id: string;
  label: string;
  date?: string;
  summary: string;
  sceneId?: string;
  locked?: boolean;
};

export type ReportBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; src: string; caption?: string };

export type UnlockRule = {
  kind?: string;
  ref?: string;
  chapter?: string;
  scene?: string;
};

export type Report = {
  id: string;
  no: number;
  title: string;
  reporter: string;
  handler: string;
  vitals: string;
  drugs: string;
  edited: string;
  unlock?: UnlockRule;
  segments: ReportSegment[];
  body?: ReportBlock[];
};

export type EffectBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string; level?: 2 | 3 }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] };

export type Effect = {
  id: string;
  title: string;
  tags: string[];
  image?: string;
  blocks: EffectBlock[];
};

export type NeuroId =
  | '血清素'
  | '多巴胺'
  | '去甲肾上腺素'
  | '谷氨酸'
  | 'GABA'
  | '乙酰胆碱'
  | '组胺'
  | '内啡肽';

export type EnzymeId =
  | 'CYP1A2'
  | 'CYP2A6'
  | 'CYP2B6'
  | 'CYP2C8'
  | 'CYP2C9'
  | 'CYP2C19'
  | 'CYP2D6'
  | 'CYP2E1'
  | 'CYP3A4'
  | 'CYP3A5'
  | 'MAO-A'
  | 'MAO-B';

export type DrugClass = 'other' | 'otc' | 'rx' | 'c2' | 'c1' | 'narcotic';

export type Strength = 'weak' | 'moderate' | 'strong';

export type StatusId =
  | '呼吸抑制'
  | '镇静'
  | '谵妄'
  | '解离'
  | '血清素综合征'
  | '抗胆碱能'
  | '戒断'
  | '耐受'
  | '激越'
  | '欣快';

export type BattleTarget = 'self' | 'enemy' | 'both';
export type BattleTargetChoice = 'player' | 'opponent';
/** @deprecated dose is now automatic; kept for old sample data */
export type UseMode = 'proper' | 'over';
export type EffectValence = 'positive' | 'negative' | 'neutral';
export type EffectSeverity = 'light' | 'medium' | 'heavy';
export type ConcentrationEffect = {
  name: StatusId;
  threshold: number;
  unit: 'g' | 'mg' | 'mcg';
  weight: number;
  severity: EffectSeverity;
  valence: EffectValence;
};

export type OpTarget = 'chosen' | 'self' | 'enemy';

export type CardOp =
  | {
      op: 'damage' | 'heal';
      target: OpTarget;
      track: 'phys' | 'psy';
      amount: number;
    }
  | { op: 'neuro'; target: OpTarget; neuro: NeuroId; amount: number }
  | {
      op: 'status' | 'clearStatus';
      target: OpTarget;
      status: StatusId;
      stacks?: number;
    }
  | {
      op: 'enzyme';
      target: OpTarget;
      enzyme: EnzymeId;
      mode: 'inhibit' | 'induce';
      strength: Strength;
    }
  | { op: 'draw'; amount: number }
  | { op: 'ap'; amount: number }
  | { op: 'delayed'; turns: number; effect: CardOp };

export type CourseSpec = {
  id: string;
  name: string;
  turns: number;
  ops: CardOp[];
  grace: number;
};

export type DrugEntry = {
  kind: 'drug' | 'action';
  id: string;
  name: string;
  aliases: string[];
  klass: DrugClass;
  classNote?: string;
  tags: string[];
  summary: string;
  description: string;
  neuro: Partial<Record<NeuroId, number>>;
  substrates: EnzymeId[];
  inhibitors: Partial<Record<EnzymeId, Strength>>;
  inducers: EnzymeId[];
  halfLife: number;
  bioavailability?: number;
  effectLine?: number;
  concentrationPerDose?: number;
  concentrationEffects?: ConcentrationEffect[];
  tolerance: number;
  withdrawal?: { status: StatusId; log: string };
  card: {
    targets: BattleTarget;
    proper: CardOp[];
    over?: CardOp[];
    course?: CourseSpec;
    storyOnly?: boolean;
  };
};

export type Card = {
  id: string;
  drugId: string;
  name: string;
  cost: number;
  klass: DrugClass;
  category: string;
  targets: BattleTarget;
  summary: string;
  tags: string[];
  effectLine?: number;
  concentrationEffects?: ConcentrationEffect[];
  proper: CardOp[];
  over?: CardOp[];
  course?: CourseSpec;
  storyOnly?: boolean;
  /** @deprecated kept for old sample/replay data */
  ops?: CardOp[];
};

export type ShadowSpec = {
  name: string;
  epithet?: string;
  kind?: 'trauma' | 'emotion' | 'habit' | 'symptom';
  maxPhys: number;
  maxPsy: number;
  neuro?: Partial<Record<NeuroId, number>>;
  enzymes?: Partial<Record<EnzymeId, number>>;
  invulnerable?: boolean;
};

export type SideSpec = {
  maxPhys: number;
  maxPsy: number;
  neuro?: Partial<Record<NeuroId, number>>;
  enzymes?: Partial<Record<EnzymeId, number>>;
};

export type ScriptTurn = {
  log: string;
  ops: CardOp[];
  when?: {
    turnMin?: number;
    selfBarBelow?: 'phys' | 'psy';
    playerBarBelow?: 'phys' | 'psy';
  };
};

export type BattleEnding = { win: string; lose: string; mutual: string };

export type Battle = {
  id: string;
  title: string;
  opponent: ShadowSpec;
  player?: SideSpec;
  deckMode: 'constructed' | 'fixed';
  fixedHand?: string[];
  script: ScriptTurn[];
  ending: BattleEnding;
  outcomePolicy?: 'player-first' | 'opponent-first';
  turnLimit?: number;
  turnLimitResult?: 'win' | 'lose' | 'mutual';
  bgm?: string;
};

/** @deprecated old name kept for compatibility with older content */
export type BattleOp = CardOp;
/** @deprecated old name kept for compatibility */
export type EnemyTurn = ScriptTurn;

export type SceneMeta = {
  id: string;
  chapterId: string;
  title: string;
  reportId?: string;
  reportSegment?: string;
};

export type ChapterMeta = {
  id: string;
  title: string;
  sceneCount: number;
  firstScene: string;
  scenes: SceneMeta[];
};

export type ReportSegmentMeta = {
  id: string;
  label: string;
  sceneId?: string;
};

export type ReportMeta = {
  id: string;
  no: number;
  title: string;
  reporter: string;
  edited: string;
  unlock?: UnlockRule;
  segments: ReportSegmentMeta[];
};

export type EffectMeta = {
  id: string;
  title: string;
  tags: string[];
};

export type ContentManifest = {
  chapters: ChapterMeta[];
  reports: ReportMeta[];
  effects: EffectMeta[];
};

export type ContentBundle = {
  chapters: Chapter[];
  reports: Report[];
  effects: Effect[];
  cards: Card[];
  battles: Battle[];
};