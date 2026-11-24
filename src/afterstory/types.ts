export type Faction = 'harm' | 'left' | 'right' | 'mass';
export type Relation = 'hostile' | 'neutral' | 'friendly';
export type SideRelation = Exclude<Relation, 'friendly'>;
export type Leader = 'edward' | 'sage';
export type ClauseId = 'names' | 'knowledge' | 'overdose' | 'representation';
export type SeatId = 'harm1' | 'harm2' | 'left' | 'right' | 'mass';
export type Vote = 'yes' | 'no' | 'abstain' | 'absent';
export type DeathResponse = 'accountability' | 'careFirst' | 'silence';
export type TurnPhase = 'brief' | 'visit' | 'table' | 'council' | 'night' | 'interlude' | 'ending';
export type EndingId =
  | 'new-circle'
  | 'clinic'
  | 'old-circle'
  | 'ebb'
  | 'chaos'
  | 'market'
  | 'long-night';

export type Cell = {
  id: string;
  row: number;
  col: number;
  faction: Faction;
  source: string;
  changedTurn?: number;
};

export type ManualClauseState = {
  status: 'none' | 'passed' | 'failed';
  variantId: string | null;
};

export type Motion =
  | { kind: 'clause'; clauseId: ClauseId; variantId: string }
  | { kind: 'policy'; policy: 'od' | 'blockade'; variantId: string };

export type Effect = {
  trust?: number;
  chaos?: number;
  exposure?: number;
  pc?: number;
  move?: { from: Faction; to: Faction; n: number }[];
  relation?: Partial<Record<'left' | 'right', -1 | 0 | 1>>;
  flags?: string[];
};

export type LogEntry = {
  turn: number;
  label: string;
  detail: string;
  tone?: 'paper' | 'red' | 'green' | 'blue';
};

export type AfterstoryRun = {
  version: 1;
  seed: number;
  turn: number;
  phase: TurnPhase;
  cells: Cell[];
  relations: {
    left: Relation;
    right: SideRelation;
    leftLeader: Leader;
    friendProgress: 0 | 1;
  };
  meters: {
    trust: number;
    chaos: number;
    exposure: number;
    pc: number;
    ap: number;
  };
  documents: {
    od: 'none' | 'maintained' | 'revised';
    blockade: boolean;
    manual: Record<ClauseId, ManualClauseState>;
    statement?: { tone: string; turn: number };
  };
  flags: string[];
  replied: boolean;
  motionDone: boolean;
  pendingMotion?: Motion;
  death?: { response: DeathResponse };
  log: LogEntry[];
  ending?: EndingId;
  night: string[];
  externalEvent?: string;
};

export type AfterstorySave = {
  active?: AfterstoryRun;
  seenEndings: EndingId[];
};

export type ReplyOption = {
  id: string;
  label: string;
  effectText: string;
  line: string;
  effect: Effect;
};

export type Visitor = {
  from: string;
  role: string;
  question: string;
  options: ReplyOption[];
};

export type TurnContent = {
  id: number;
  date: string;
  title: string;
  headline: string;
  brief: string[];
  visitor: Visitor;
  night: string[];
  art: string;
};

export type ActionChoice = {
  id: string;
  label: string;
  effectText: string;
  disabled?: string;
  effect?: Effect;
};

export type ActionCard = {
  id:
    | 'negotiate'
    | 'statement'
    | 'spread'
    | 'suppress'
    | 'firstAid'
    | 'training'
    | 'draft'
    | 'coverup'
    | 'document'
    | 'policy'
    | 'found';
  title: string;
  body: string;
  hint: string;
  art: string;
  choices: ActionChoice[];
};

export type SeatState = {
  id: SeatId;
  label: string;
  holder: string;
  vote: Vote;
  note: string;
  lobbyable: boolean;
  weight: number;
  chance?: number;
};

export type ExternalEvent = {
  id: string;
  title: string;
  body: string;
  effectText: string;
  effect: Effect;
};

export type MeterKey = 'trust' | 'exposure' | 'chaos';

export type Counts = Record<Faction, number>;

export type Outcome = 'none' | 'victory' | 'ebb' | 'chaos' | 'timeout';
