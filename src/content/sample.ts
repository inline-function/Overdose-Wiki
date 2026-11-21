import type { Battle, Card, Chapter, DrugEntry, Report, Scene } from './types';

export type SampleSegment = {
  id: string;
  label: string;
  date: string;
  summary: string;
  sceneId: string;
  locked?: boolean;
};

const sampleSegments: SampleSegment[] = [
  {
    id: 'rp-7-1',
    label: 'RP-7-1',
    date: '2022.08.27',
    summary: '第一次记录。……醒来时如同发烧初愈。',
    sceneId: 'ch01.s02',
  },
  {
    id: 'rp-7-9',
    label: 'RP-7-9',
    date: '2023.06.03',
    summary: '长时间昏睡，醒来后记忆断片。',
    sceneId: 'ch01.s03',
  },
  {
    id: 'rp-7-12',
    label: 'RP-7-12',
    date: '2023.07.11 11:46',
    summary:
      '突然不想死了，想好好活着。记忆像是回来了一部分。',
    sceneId: 'ch01.s05',
  },
  {
    id: 'rp-7-13',
    label: 'RP-7-13',
    date: '2023.07.26',
    summary:
      '复刻失败；记忆与情绪都变得更糟。',
    sceneId: 'ch01.s06',
  },
  {
    id: 'rp-7-26',
    label: 'RP-7-26',
    date: '2024.02.27',
    summary: '最后一次记录。本次失败难以避免。',
    sceneId: 'ch01.s09',
  },
];

export const SAMPLE_REPORT = {
  id: '7',
  no: 7,
  title: '个人记录整合（样本）',
  reporter: '匿名报告者',
  handler: '你',
  vitals: '175cm，60kg',
  drugs: '右美沙芬、咖啡因、金刚烷胺、茶苯海明、复方甘草片、氟伏沙明',
  note: '删改了部分内容，以更方便阅读',
  edited: '最后编辑 2024-07-08 04:13',
  segments: sampleSegments,
};

export const SAMPLE_SCENE = {
  id: 'ch01.s05',
  title: '余晖',
  chapter: 'ch01 · 虚数根',
  bgLabel: '江边夜',
  speaker: '后藤',
  meta: '2023.07.11 11:46',
  lines: [
    '感觉 suicide 好没有意义。',
    '突然就不想死了，想好好活着。',
    '因为感觉脑子突然记忆就好了。',
    '小学的走廊，过年的鞭炮，母亲在厨房切菜的背影……全都在那几个小时里回来了。',
  ],
  choices: [
    { id: 'cost', label: '你之后试了多少次？' },
    { id: 'record', label: '那一次，你记下了什么？' },
    { id: 'silence', label: '沉默' },
  ],
};

export type SampleCard = {
  id: string;
  name: string;
  cost: number;
  category: string;
  summary: string;
  tags: string[];
};

export const SAMPLE_CARDS: SampleCard[] = [
  { id: 'sertraline', name: '舍曲林', cost: 1, category: 'SRI', summary: '心理 +5；延迟 +3。', tags: ['五朵金花', '延迟'] },
  { id: 'dxm', name: '右美沙芬', cost: 1, category: '解离', summary: '生理 -3；心理 +5。', tags: ['双刃', '解离'] },
  { id: 'amantadine', name: '金刚烷胺', cost: 1, category: '镇静 / 谵妄', summary: '己 心+6；敌 谵+2。', tags: ['镇静', '谵妄'] },
  { id: 'magnesium', name: '苏糖酸镁', cost: 1, category: '反解离', summary: '清解离/谵妄 1。', tags: ['恢复'] },
  { id: 'pregabalin', name: '普瑞巴林', cost: 1, category: '镇静', summary: '心理 +4；镇静 +1。', tags: ['镇静'] },
  { id: 'licorice', name: '复方甘草片', cost: 1, category: '阿片类', summary: '生理 +4；心理 +3。', tags: ['阿片类'] },
  { id: 'caffeine', name: '咖啡因', cost: 0, category: '兴奋', summary: 'AP +1；生理 -1。', tags: ['兴奋'] },
  { id: 'naloxone', name: '纳洛酮', cost: 1, category: '恢复', summary: '清镇静 1；生理 +2。', tags: ['恢复'] },
  { id: 'fluoxetine', name: '氟西汀', cost: 1, category: 'SRI', summary: '心理 +4；负载 +1。', tags: ['五朵金花'] },
  { id: 'paroxetine', name: '帕罗西汀', cost: 2, category: 'SRI', summary: '心理 +7；负载 +2。', tags: ['五朵金花'] },
  { id: 'fluvoxamine', name: '氟伏沙明', cost: 1, category: 'SRI', summary: '心理 +4；镇静 +1。', tags: ['五朵金花'] },
  { id: 'citalopram', name: '西酞普兰', cost: 1, category: 'SRI', summary: '心理 +5；负载 +1。', tags: ['五朵金花'] },
];

export const SAMPLE_HISTORY = [
  { at: '07-08 04:13', label: '编辑了报告 7 · 余晖', href: '/report/7/replay/ch01.s05' },
  { at: '07-08 04:02', label: '已读 RP-7-12', href: '/report/7/replay/ch01.s05' },
  { at: '07-07 23:40', label: '归档了 ch01.s03 昏迷', href: '/report/7' },
  { at: '07-07 23:31', label: '解锁了效果 · 余晖', href: '/effects/%E4%BD%99%E6%99%96' },
  { at: '07-07 23:12', label: '打开报告 51', href: '/report/51' },
];

export const SAMPLE_EFFECTS = [
  '解离',
  '反解离',
  '谵妄',
  '镇静',
  '幻觉',
  '兴奋',
  'SRI',
  '阿片类麻醉',
  '恢复术',
  '余晖',
];

export const SAMPLE_ARCHIVE = [
  { id: '000', title: '0号收件箱', meta: '未编号', locked: false },
  { id: '002', title: '报告 2 · 醒来', meta: '已归档', locked: false },
  { id: '007', title: '报告 7 · 虚数根', meta: '26 次 trip', locked: false },
  { id: '020', title: '报告 20 · 一个下午', meta: '已归档', locked: false },
  { id: '049', title: '报告 49 · k-hole', meta: '已归档', locked: false },
  { id: '050', title: '报告 50 · 老师', meta: '已归档', locked: false },
  { id: '051', title: '报告 51 · 幕间', meta: '未解锁', locked: true },
  { id: '074', title: '报告 74 · 稍尽春风', meta: 'DLC', locked: true },
];

export const SAMPLE_REPORT_DATA: Report = {
  ...SAMPLE_REPORT,
  segments: SAMPLE_REPORT.segments.map((segment) => ({
    ...segment,
    sceneId:
      segment.id === 'rp-7-12'
        ? 'ch01.s05'
        : segment.id === 'rp-7-13' || segment.id === 'rp-7-26'
          ? 'ch01.s06'
          : 'ch01.s01',
  })),
};

const sampleScene01: Scene = {
  id: 'ch01.s01',
  chapterId: 'ch01',
  order: 1,
  title: '档案室',
  summary: '七月十一日。档案室没有窗。',
  flags: [],
  sourceRefs: ['report-007'],
  reportSegment: 'rp-7-1',
  stage: { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'calm' } },
  beats: [
    { type: 'narration', text: '七月十一日。档案室没有窗。' },
    { type: 'dialogue', speaker: '处理者', text: '桌上放着一份没有封口的档案。' },
    {
      type: 'choice',
      id: 'sample.s01.choice',
      options: [
        { id: 'o1', label: '先读 RP-7-12', targetScene: 'ch01.s05' },
        { id: 'o2', label: '从 RP-7-1 开始读', targetScene: 'ch01.s05' },
      ],
    },
  ],
  next: 'ch01.s05',
};

const sampleScene05: Scene = {
  id: 'ch01.s05',
  chapterId: 'ch01',
  order: 5,
  title: '余晖',
  summary: '突然不想死了，想好好活着。',
  flags: [],
  sourceRefs: ['report-007#RP-7-12'],
  reportSegment: 'rp-7-12',
  stage: { bg: 'bg_river_night', bust: { speaker: '后藤', expr: 'calm' } },
  beats: [
    ...SAMPLE_SCENE.lines.map((text) => ({
      type: 'dialogue' as const,
      speaker: '后藤',
      text,
    })),
    { type: 'battle', battleId: 'battle-ch01-s05', label: '复演：余晖' },
    {
      type: 'choice',
      id: 'sample.s05.choice',
      options: SAMPLE_SCENE.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        ...(choice.id === 'silence' ? { targetScene: 'ch01.s06' } : {}),
      })),
    },
  ],
  next: 'ch01.s06',
};

const sampleScene06: Scene = {
  id: 'ch01.s06',
  chapterId: 'ch01',
  order: 6,
  title: '复刻失败',
  summary: '同样的方案，更大的量。这次没有记忆恢复。',
  flags: [],
  sourceRefs: ['report-007#RP-7-13'],
  reportSegment: 'rp-7-13',
  stage: { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'tired' } },
  beats: [
    { type: 'dialogue', speaker: '处理者', text: '同样的方案，更大的量。这次没有记忆恢复。' },
    { type: 'dialogue', speaker: '后藤', text: '失败。' },
  ],
};

export const SAMPLE_CHAPTER: Chapter = {
  id: 'ch01',
  title: '虚数根',
  scenes: [sampleScene01, sampleScene05, sampleScene06],
};

const CLASS_LABEL = { other: '其他', otc: 'OTC', rx: 'Rx', c2: '精二', c1: '精一', narcotic: '麻' } as const;

function sampleDrug(
  id: string,
  name: string,
  klass: DrugEntry['klass'],
  targets: DrugEntry['card']['targets'],
  proper: DrugEntry['card']['proper'],
  over?: DrugEntry['card']['over'],
  course?: DrugEntry['card']['course'],
  tags: string[] = [],
): DrugEntry {
  return {
    kind: 'drug',
    id,
    name,
    aliases: [],
    klass,
    tags,
    summary: '规范使用有正面收益。',
    description: '样本药品。',
    neuro: {},
    substrates: [],
    inhibitors: {},
    inducers: [],
    halfLife: 4,
    tolerance: 1,
    card: { targets, proper, over, course },
  };
}

const SSRI_COURSE = {
  id: 'SSRI',
  name: 'SSRI 疗程',
  turns: 3,
  grace: 2,
  ops: [{ op: 'heal' as const, target: 'self' as const, track: 'psy' as const, amount: 1 }],
};

export const SAMPLE_DRUGS: DrugEntry[] = [
  sampleDrug('sertraline', '舍曲林', 'rx', 'self',
    [
      { op: 'heal', target: 'self', track: 'psy', amount: 1 },
      { op: 'neuro', target: 'self', neuro: '血清素', amount: 3 },
    ],
    [
      { op: 'heal', target: 'self', track: 'psy', amount: 4 },
      { op: 'neuro', target: 'self', neuro: '血清素', amount: 20 },
      { op: 'status', target: 'self', status: '血清素综合征', stacks: 2 },
    ],
    SSRI_COURSE,
    ['SSRI', '五朵金花'],
  ),
  sampleDrug('dxm', '右美沙芬', 'c2', 'both',
    [
      { op: 'clearStatus', target: 'chosen', status: '解离', stacks: 1 },
      { op: 'neuro', target: 'chosen', neuro: '谷氨酸', amount: -8 },
      { op: 'neuro', target: 'chosen', neuro: '多巴胺', amount: 4 },
    ],
    [
      { op: 'neuro', target: 'chosen', neuro: '谷氨酸', amount: -18 },
      { op: 'status', target: 'chosen', status: '解离', stacks: 2 },
      { op: 'damage', target: 'self', track: 'psy', amount: 4 },
    ],
    undefined,
    ['解离剂'],
  ),
  sampleDrug('magnesium_threonate', '苏糖酸镁', 'other', 'self',
    [
      { op: 'clearStatus', target: 'self', status: '解离', stacks: 1 },
      { op: 'heal', target: 'self', track: 'psy', amount: 2 },
    ],
    undefined,
    undefined,
    ['抗解离剂'],
  ),
  sampleDrug('caffeine', '咖啡因', 'other', 'self',
    [
      { op: 'ap', amount: 1 },
      { op: 'neuro', target: 'self', neuro: '多巴胺', amount: 6 },
    ],
    [
      { op: 'ap', amount: 1 },
      { op: 'neuro', target: 'self', neuro: '多巴胺', amount: 20 },
      { op: 'status', target: 'self', status: '激越', stacks: 2 },
    ],
    undefined,
    ['兴奋剂'],
  ),
  sampleDrug('alprazolam', '阿普唑仑', 'c2', 'both',
    [
      { op: 'heal', target: 'chosen', track: 'psy', amount: 2 },
      { op: 'clearStatus', target: 'chosen', status: '激越', stacks: 1 },
      { op: 'neuro', target: 'chosen', neuro: 'GABA', amount: 6 },
    ],
    [
      { op: 'neuro', target: 'chosen', neuro: 'GABA', amount: 15 },
      { op: 'status', target: 'chosen', status: '镇静', stacks: 2 },
      { op: 'status', target: 'chosen', status: '呼吸抑制', stacks: 1 },
    ],
    undefined,
    ['苯二氮卓类药品'],
  ),
  sampleDrug('naloxone', '纳洛酮', 'rx', 'both',
    [
      { op: 'clearStatus', target: 'chosen', status: '呼吸抑制', stacks: 2 },
      { op: 'neuro', target: 'chosen', neuro: '内啡肽', amount: -15 },
      { op: 'heal', target: 'chosen', track: 'phys', amount: 4 },
    ],
    undefined,
    undefined,
    ['拮抗剂'],
  ),
];

const sampleCaffeine = SAMPLE_DRUGS.find((entry) => entry.id === 'caffeine');
if (sampleCaffeine) {
  sampleCaffeine.effectLine = 1;
  sampleCaffeine.concentrationPerDose = 1;
  sampleCaffeine.bioavailability = 0.5;
  sampleCaffeine.concentrationEffects = [
    { name: '欣快', threshold: 1, unit: 'mg', weight: 1, severity: 'light', valence: 'positive' },
    { name: '激越', threshold: 6, unit: 'mg', weight: 6, severity: 'heavy', valence: 'negative' },
  ];
}

export const SAMPLE_ENGINE_CARDS: Card[] = SAMPLE_DRUGS.map((entry) => ({
  id: entry.id,
  drugId: entry.id,
  name: entry.name,
  cost: 1,
  klass: entry.klass,
  category: CLASS_LABEL[entry.klass],
  targets: entry.card.targets,
  summary: entry.summary,
  tags: entry.tags,
  proper: entry.card.proper,
  over: entry.card.over,
  course: entry.card.course,
}));

export const SAMPLE_FIXED_CARDS: Card[] = [
  { id: 'breathe', drugId: 'breathe', name: '呼吸', cost: 0, klass: 'other', category: '现实检验', targets: 'self', summary: '心理 +4。', tags: ['固定'], proper: [{ op: 'heal', target: 'self', track: 'psy', amount: 4 }], storyOnly: true },
  { id: 'window', drugId: 'window', name: '看窗外', cost: 0, klass: 'other', category: '现实检验', targets: 'self', summary: '心理 +3。', tags: ['固定'], proper: [{ op: 'heal', target: 'self', track: 'psy', amount: 3 }], storyOnly: true },
  { id: 'ask', drugId: 'ask', name: '问自己', cost: 0, klass: 'other', category: '现实检验', targets: 'self', summary: '心理 +4。', tags: ['固定'], proper: [{ op: 'heal', target: 'self', track: 'psy', amount: 4 }], storyOnly: true },
  { id: 'message', drugId: 'message', name: '给朋友发消息', cost: 0, klass: 'other', category: '现实检验', targets: 'self', summary: '心理 +5。', tags: ['固定'], proper: [{ op: 'heal', target: 'self', track: 'psy', amount: 5 }], storyOnly: true },
];

export const SAMPLE_BATTLE: Battle = {
  id: 'battle-ch01-s03',
  title: '复演：昏迷',
  opponent: { name: '呼吸的重量', epithet: '心理阴影', kind: 'trauma', maxPhys: 60, maxPsy: 60 },
  player: { maxPhys: 60, maxPsy: 60 },
  deckMode: 'constructed',
  script: [
    { log: '呼吸慢了一拍。', ops: [{ op: 'damage', target: 'enemy', track: 'phys', amount: 3 }] },
    { log: '你听见自己的心跳。', ops: [{ op: 'damage', target: 'enemy', track: 'phys', amount: 4 }] },
    { log: '天快亮了。', ops: [{ op: 'damage', target: 'enemy', track: 'phys', amount: 5 }] },
  ],
  ending: {
    win: '你撑过了这一版。',
    lose: '记录到此为止。',
    mutual: '你和它一起沉了下去。',
  },
};

export const SAMPLE_FIXED_BATTLE: Battle = {
  id: 'battle-side-83',
  title: '复演：门口的警车',
  opponent: { name: '门口的警车', epithet: '被害妄想', kind: 'symptom', maxPhys: 30, maxPsy: 30 },
  player: { maxPhys: 30, maxPsy: 30 },
  deckMode: 'fixed',
  fixedHand: ['breathe', 'window', 'ask', 'message'],
  script: [
    { log: '影子退到窗帘后面。', ops: [{ op: 'damage', target: 'enemy', track: 'psy', amount: 3 }] },
    { log: '门卫在扫地。', ops: [{ op: 'damage', target: 'enemy', track: 'psy', amount: 3 }] },
    { log: '心跳。你问自己：这是被害妄想吗？', ops: [{ op: 'damage', target: 'enemy', track: 'psy', amount: 3 }] },
  ],
  ending: {
    win: '那只是一辆车。',
    lose: '你没能说服自己。',
    mutual: '你和警车一起停在门口。',
  },
};

export const SAMPLE_BATTLES: Battle[] = [SAMPLE_BATTLE, SAMPLE_FIXED_BATTLE];

export const SAMPLE_EXTRAS = [
  { id: 'ch01', title: '虚数根', meta: '主线 · 已归档', locked: false },
  { id: 'ch02', title: '苦涩的颜料', meta: '主线 · 已归档', locked: false },
  { id: 'ch03', title: '从此再也不见', meta: '主线 · 未解锁', locked: true },
  { id: 'dlc', title: '稍尽春风', meta: 'DLC · 未解锁', locked: true },
  { id: 'side', title: '散页', meta: '32 / 35 / 58 / 83 / 84', locked: false },
  { id: 'notes', title: '处理者笔记', meta: '暂无', locked: true },
];