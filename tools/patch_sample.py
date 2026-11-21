from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'src/content/sample.ts'
s = p.read_text(encoding='utf-8')
s = s.replace(
    "import type { Battle, Card, Chapter, Report, Scene } from './types';",
    "import type { Battle, Card, Chapter, DrugEntry, Report, Scene } from './types';",
)
start = s.index('export const SAMPLE_ENGINE_CARDS')
end = s.index('export const SAMPLE_EXTRAS')

new = r'''const CLASS_LABEL = { other: '其他', otc: 'OTC', rx: 'Rx', c2: '精二', c1: '精一', narcotic: '麻' } as const;

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

'''
p.write_text(s[:start] + new + s[end:], encoding='utf-8')
print('sample rewritten')