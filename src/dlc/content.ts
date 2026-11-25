// DLC《稍尽春风》卡牌/战斗/关卡数据。
// 数值来自回退前已验证的版本（docs/dlc-card-data-reference.ts.txt），一字未改。
import type {
  BattleDef,
  Card,
  DlcSave,
  Effect,
  LocaleText,
  Rarity,
  Stage,
  StatusId,
  Tag,
  Track,
} from './types';

const dmg = (track: Track, amount: number): Effect => ({ kind: 'damage', track, amount });
const heal = (track: Track, amount: number): Effect => ({ kind: 'heal', track, amount });
const st = (status: StatusId, amount: number, percent?: number): Effect => ({ kind: 'status', status, amount, percent });
const clear = (status: StatusId, amount = 99): Effect => ({ kind: 'clear', status, amount });

const card = (
  id: string,
  zh: string,
  en: string,
  rarity: Rarity,
  tags: Tag[],
  effects: Effect[],
): Card => ({ id, name: { zh, en }, rarity, tags, effects });

export const CARDS: Card[] = [
  // 血清素
  card('sertraline', '舍曲林', 'Sertraline', 'rx', ['serotonin'], [st('serotonin', 12)]),
  card('fluoxetine', '氟西汀', 'Fluoxetine', 'rx', ['serotonin'], [st('serotonin', 12)]),
  card('paroxetine', '帕罗西汀', 'Paroxetine', 'rx', ['serotonin'], [st('serotonin', 10)]),
  card('citalopram', '西酞普兰', 'Citalopram', 'rx', ['serotonin'], [st('serotonin', 9)]),
  card('escitalopram', '艾司西酞普兰', 'Escitalopram', 'rx', ['serotonin'], [st('serotonin', 15)]),
  card('fluvoxamine', '氟伏沙明', 'Fluvoxamine', 'rx', ['serotonin'], [st('serotonin', 10)]),
  card('venlafaxine', '文拉法辛', 'Venlafaxine', 'rx', ['serotonin'], [st('serotonin', 12), dmg('mental', 2)]),
  card('duloxetine', '度洛西汀', 'Duloxetine', 'rx', ['serotonin'], [st('serotonin', 12), heal('mental', 2)]),
  card('phenelzine', '苯乙肼', 'Phenelzine', 'class1', ['serotonin'], [st('serotonin', 18)]),
  card('tranylcypromine', '反苯环丙胺', 'Tranylcypromine', 'class1', ['serotonin'], [st('serotonin', 15)]),
  card('moclobemide', '吗氯贝胺', 'Moclobemide', 'rx', ['serotonin'], [st('serotonin', 0, 0.6)]),

  // 嗜睡 / 呼吸抑制
  card('diazepam', '地西泮', 'Diazepam', 'class2', ['sedation'], [st('sedation', 8), heal('mental', 2)]),
  card('alprazolam', '阿普唑仑', 'Alprazolam', 'class2', ['sedation'], [st('sedation', 10)]),
  card('lorazepam', '劳拉西泮', 'Lorazepam', 'class2', ['sedation'], [st('sedation', 10)]),
  card('clonazepam', '氯硝西泮', 'Clonazepam', 'class2', ['sedation'], [st('sedation', 12)]),
  card('estazolam', '艾司唑仑', 'Estazolam', 'class2', ['sedation'], [st('sedation', 10)]),
  card('zopiclone', '佐匹克隆', 'Zopiclone', 'class2', ['sedation'], [st('sedation', 8)]),
  card('zolpidem', '唑吡坦', 'Zolpidem', 'class2', ['sedation'], [st('sedation', 10)]),
  card('suvorexant', '苏沃雷生', 'Suvorexant', 'rx', ['sedation'], [st('sedation', 8)]),
  card('phenobarbital', '苯巴比妥', 'Phenobarbital', 'class1', ['sedation', 'respiratory'], [st('sedation', 8), st('respiratory', 4)]),
  card('secobarbital', '司可巴比妥', 'Secobarbital', 'class1', ['sedation', 'respiratory'], [st('sedation', 10), st('respiratory', 5)]),

  // 呼吸抑制 / 阿片
  card('morphine', '吗啡', 'Morphine', 'narcotic', ['respiratory', 'analgesia'], [st('respiratory', 10), st('analgesia', 1), heal('mental', 2)]),
  card('oxycodone', '羟考酮', 'Oxycodone', 'narcotic', ['respiratory', 'analgesia'], [st('respiratory', 10), st('analgesia', 1), heal('mental', 2)]),
  card('fentanyl', '芬太尼', 'Fentanyl', 'narcotic', ['respiratory', 'analgesia'], [st('respiratory', 14), st('analgesia', 2), heal('mental', 3)]),
  card('codeine', '可待因', 'Codeine', 'narcotic', ['respiratory', 'analgesia'], [st('respiratory', 6), st('analgesia', 1), heal('mental', 2)]),
  card('tramadol', '曲马多', 'Tramadol', 'class1', ['respiratory', 'analgesia'], [st('respiratory', 6), st('analgesia', 1), heal('mental', 2)]),
  card('methadone', '美沙酮', 'Methadone', 'narcotic', ['respiratory', 'analgesia'], [st('respiratory', 8), st('analgesia', 1), heal('mental', 2)]),
  card('buprenorphine', '丁丙诺啡', 'Buprenorphine', 'class1', ['respiratory', 'analgesia'], [st('respiratory', 6), st('analgesia', 1)]),
  card('pentazocine', '喷他佐辛', 'Pentazocine', 'class1', ['respiratory', 'analgesia'], [st('respiratory', 5), st('analgesia', 1)]),
  card('nitrous', '一氧化二氮', 'Nitrous Oxide', 'rx', ['respiratory', 'analgesia'], [st('respiratory', 4), st('analgesia', 1)]),

  // 谵妄
  card('trihexyphenidyl', '苯海索', 'Trihexyphenidyl', 'rx', ['delirium'], [st('delirium', 8)]),
  card('diphenhydramine', '苯海拉明', 'Diphenhydramine', 'otc', ['delirium', 'sedation'], [st('delirium', 6), st('sedation', 3)]),
  card('promethazine', '异丙嗪', 'Promethazine', 'rx', ['delirium', 'sedation'], [st('delirium', 6), st('sedation', 3)]),
  card('scopolamine', '东莨菪碱', 'Scopolamine', 'class1', ['delirium'], [st('delirium', 10)]),
  card('atropine', '阿托品', 'Atropine', 'rx', ['delirium'], [st('delirium', 6)]),
  card('benztropine', '苯托品', 'Benztropine', 'rx', ['delirium'], [st('delirium', 8)]),
  card('orphenadrine', '奥芬那君', 'Orphenadrine', 'rx', ['delirium'], [st('delirium', 6)]),

  // 多巴胺
  card('bupropion', '安非他酮', 'Bupropion', 'rx', ['dopamine'], [heal('mental', 6)]),
  card('amantadine', '金刚烷胺', 'Amantadine', 'rx', ['dopamine'], [heal('mental', 5)]),
  card('bromocriptine', '溴隐亭', 'Bromocriptine', 'rx', ['dopamine'], [heal('mental', 7)]),
  card('pramipexole', '普拉克索', 'Pramipexole', 'rx', ['dopamine'], [heal('mental', 6)]),

  // 动机 / AP
  card('caffeine', '咖啡因', 'Caffeine', 'otc', ['motivation'], [st('motivation', 2)]),
  card('ephedrine', '麻黄碱', 'Ephedrine', 'class1', ['motivation'], [st('motivation', 2)]),
  card('amphetamine', '安非他命', 'Amphetamine', 'class1', ['motivation'], [st('motivation', 2)]),
  card('methylphenidate', '哌甲酯', 'Methylphenidate', 'class1', ['motivation'], [st('motivation', 2)]),
  card('nicotine', '尼古丁', 'Nicotine', 'otc', ['motivation'], [st('motivation', 2)]),

  // 镇痛
  card('magnesium', '苏糖酸镁', 'Magnesium Threonate', 'none', ['analgesia'], [st('analgesia', 1)]),
  card('pregabalin', '普瑞巴林', 'Pregabalin', 'class2', ['analgesia', 'sedation'], [st('analgesia', 1), st('sedation', 3)]),
  card('gabapentin', '加巴喷丁', 'Gabapentin', 'rx', ['analgesia'], [st('analgesia', 1)]),
  card('lidocaine', '利多卡因', 'Lidocaine', 'rx', ['analgesia'], [st('analgesia', 1)]),
  card('esketamine', '艾司氯胺酮', 'Esketamine', 'class1', ['dissociation'], [heal('mental', 99)]),

  // 营养
  card('vitamin_b6', '维生素 B6', 'Vitamin B6', 'none', ['nutrition'], [heal('phys', 2)]),
  card('electrolyte', '电解质', 'Electrolytes', 'none', ['nutrition'], [heal('phys', 3)]),
  card('nutrition_iv', '营养液', 'Nutrition IV', 'rx', ['nutrition'], [heal('phys', 4)]),
  card('thiamine', '硫胺素', 'Thiamine', 'none', ['nutrition'], [heal('phys', 2)]),

  // 解离 / 反解离
  card('dextromethorphan', '右美沙芬', 'Dextromethorphan', 'otc', ['dissociation'], [st('dissociation', 1), heal('mental', 2)]),
  card('memantine', '美金刚', 'Memantine', 'rx', ['dissociation'], [st('dissociation', 1)]),
  card('tiletamine', '替来他明', 'Tiletamine', 'class1', ['dissociation'], [st('dissociation', 1), dmg('mental', 2)]),

  // 反解离 / 解毒
  card('flumazenil', '氟马西尼', 'Flumazenil', 'rx', ['counter', 'harm'], [st('counter', 1), clear('sedation')]),
  card('naloxone', '纳洛酮', 'Naloxone', 'otc', ['counter', 'harm'], [st('counter', 1), clear('respiratory')]),
];

export const STARTER_DECK = [
  'sertraline', 'sertraline', 'fluoxetine', 'fluoxetine', 'escitalopram', 'escitalopram',
  'diazepam', 'zopiclone', 'pregabalin', 'magnesium', 'caffeine', 'vitamin_b6',
];

export const STARTING_COLLECTION: Record<string, number> = STARTER_DECK.reduce<Record<string, number>>(
  (acc, id) => { acc[id] = (acc[id] ?? 0) + 1; return acc; },
  {},
);

export const RARITY_META: Record<Rarity, { label: LocaleText; cost: number; color: string }> = {
  none: { label: { zh: '无', en: 'None' }, cost: 0, color: '#8c8270' },
  otc: { label: { zh: 'OTC', en: 'OTC' }, cost: 1, color: '#5b8fa8' },
  rx: { label: { zh: 'Rx', en: 'Rx' }, cost: 2, color: '#4a6fa5' },
  class2: { label: { zh: '精二', en: 'Class II' }, cost: 3, color: '#d9a441' },
  class1: { label: { zh: '精一', en: 'Class I' }, cost: 4, color: '#c2556a' },
  narcotic: { label: { zh: '麻', en: 'Narcotic' }, cost: 5, color: '#a62b20' },
};

export const STATUS_INFO: Record<StatusId, { label: LocaleText; short: string; description: LocaleText }> = {
  motivation: {
    label: { zh: '动机增强', en: 'Motivation Boost' }, short: 'MOT',
    description: { zh: '持续 2 回合：每回合结束额外 +1 行动点。重复使用叠加持续时间。', en: 'Lasts 2 turns: +1 extra AP at the end of each turn. Reuse stacks duration.' },
  },
  serotonin: {
    label: { zh: '血清素', en: 'Serotonin' }, short: '5-HT',
    description: { zh: '达到 30 时立刻触发一次：造成中量生理伤害与大量心理伤害，然后清零。每回合最多触发一次。', en: 'At 30 it triggers once: medium physical damage and heavy mental damage, then resets. Once per turn.' },
  },
  sedation: {
    label: { zh: '嗜睡', en: 'Sedation' }, short: 'SED',
    description: { zh: '10/20/30 分别让 AP -1/-2/-3；达到 40 会昏睡一回合。每回合减半。', en: 'At 10/20/30, AP -1/-2/-3; at 40, sleep for one turn. Halves each turn.' },
  },
  respiratory: {
    label: { zh: '呼吸抑制', en: 'Respiratory Depression' }, short: 'RESP',
    description: { zh: '每次出牌后受到 2/4/6 点生理伤害，按层数。每回合最多触发 3 次，随后减半。', en: 'After each card, take 2/4/6 physical damage by layer. Up to 3 times per turn, then halves.' },
  },
  delirium: {
    label: { zh: '谵妄', en: 'Delirium' }, short: 'DEL',
    description: { zh: '10/20/30 会随机打出 1/2/3 张牌，并造成少量生理与中量心理伤害。每回合最多 2 张，随后减半。', en: 'At 10/20/30, play 1/2/3 random cards and take small physical and medium mental damage. Up to 2 cards, then halves.' },
  },
  dissociation: {
    label: { zh: '解离', en: 'Dissociation' }, short: 'DIS',
    description: { zh: '每层让受到的伤害降低 20%，也让附着在你身上的状态降低 20%。最多 3 层，不衰减。', en: 'Each layer reduces incoming damage and statuses applied to you by 20%. Max 3, no decay.' },
  },
  counter: {
    label: { zh: '反解离', en: 'Counter-Dissociation' }, short: 'CNT',
    description: { zh: '每层让受到的伤害提高 20%，也让附着在你身上的状态提高 20%。最多 3 层，不衰减。', en: 'Each layer increases incoming damage and statuses applied to you by 20%. Max 3, no decay.' },
  },
  analgesia: {
    label: { zh: '镇痛', en: 'Analgesia' }, short: 'ANL',
    description: { zh: '每层让受到的任何伤害降低 1/3（向上取整），不阻止状态附着。3 层会合成 1 层「止痛」。不衰减。', en: 'Each layer reduces any incoming damage by one third (rounded up) and does not prevent statuses. 3 layers become 1 Painkiller. No decay.' },
  },
  painkiller: {
    label: { zh: '止痛', en: 'Painkiller' }, short: 'PAIN',
    description: { zh: '免疫下一次伤害，包括状态造成的伤害。不阻止状态附着。最多 1 层。', en: 'Immune to the next damage instance, including status damage. Does not prevent statuses. Max 1.' },
  },
};

export const TAG_INFO: Record<Tag, LocaleText> = {
  serotonin: { zh: '血清素', en: 'Serotonin' },
  sedation: { zh: '嗜睡', en: 'Sedation' },
  respiratory: { zh: '呼吸抑制', en: 'Respiratory' },
  delirium: { zh: '谵妄', en: 'Delirium' },
  dopamine: { zh: '多巴胺', en: 'Dopamine' },
  motivation: { zh: '动机', en: 'Motivation' },
  analgesia: { zh: '镇痛', en: 'Analgesia' },
  nutrition: { zh: '营养', en: 'Nutrition' },
  dissociation: { zh: '解离', en: 'Dissociation' },
  counter: { zh: '反解离', en: 'Counter' },
  harm: { zh: '减害', en: 'Harm Reduction' },
};

export const CARD_MAP: Record<string, Card> = Object.fromEntries(
  CARDS.map((item) => [item.id, item]),
);

const battle = (
  id: string,
  titleZh: string,
  titleEn: string,
  enemyZh: string,
  enemyEn: string,
  epithetZh: string,
  epithetEn: string,
  sprite: BattleDef['sprite'],
  bg: string,
  deck: string[],
  maxPhys: number,
  maxMental: number,
  introZh: string,
  introEn: string,
  winZh: string,
  winEn: string,
  loseZh: string,
  loseEn: string,
  phase2At?: number,
  bgm = 'tension',
): BattleDef => ({
  id,
  title: { zh: titleZh, en: titleEn },
  enemyName: { zh: enemyZh, en: enemyEn },
  epithet: { zh: epithetZh, en: epithetEn },
  sprite,
  portrait: 'enemy-' + id.slice(-1).padStart(2, '0'),
  bg,
  deck,
  maxPhys,
  maxMental,
  intro: { zh: introZh, en: introEn },
  win: { zh: winZh, en: winEn },
  lose: { zh: loseZh, en: loseEn },
  ...(phase2At ? { phase2At, phase2Log: { zh: '死藤水在血管里展开。星头膨胀，白大褂的边缘化成像素。', en: 'The ayahuasca unfolds in the veins. The star-head swells; the coat dissolves into pixels.' } } : {}),
  bgm,
});

export const BATTLES: BattleDef[] = [
  battle('dlc-b1', '失眠', 'Insomnia', '失眠', 'Insomnia', '醒着太久', 'Awake too long', 'paper', 'bg_dlc_school_gate',
    ['sertraline', 'fluoxetine', 'citalopram', 'diazepam', 'caffeine', 'vitamin_b6', 'diphenhydramine', 'magnesium', 'naloxone', 'bupropion'],
    24, 12, '你已经很久没有睡着了。', 'You have not slept for a long time.', '天终于亮了一点。', 'Morning finally arrives.', '你还在夜里。', 'You are still in the night.', undefined, 'battle-city'),
  battle('dlc-b2', '戒断', 'Withdrawal', '戒断', 'Withdrawal', '身体在讨债', 'The body collects its debt', 'paper', 'bg_dlc_classroom',
    ['sertraline', 'paroxetine', 'venlafaxine', 'fluoxetine', 'escitalopram', 'diazepam', 'zopiclone', 'vitamin_b6', 'electrolyte', 'bupropion'],
    60, 30, '手在抖。不是冷。', 'Your hands are shaking. It is not the cold.', '这一阵过去了。', 'This wave passes.', '身体先一步垮了。', 'The body gives out first.', undefined, 'battle-desert'),
  battle('dlc-b3', '解离', 'Dissociation', '解离', 'Dissociation', '我不在身体里', 'I am not in my body', 'mirror', 'bg_dlc_summer_street',
    ['memantine', 'memantine', 'dextromethorphan', 'tiletamine', 'magnesium', 'morphine', 'naloxone', 'caffeine', 'sertraline', 'diazepam'],
    64, 32, '你看见自己站在两步之外。', 'You see yourself standing two steps away.', '你回到了身体里。', 'You return to your body.', '你留在外面。', 'You stay outside.', undefined, 'battle-dj'),
  battle('dlc-b4', '自责', 'Self-Blame', '自责', 'Self-Blame', '都是你的错', 'It is all your fault', 'shadow', 'bg_dlc_classroom',
    ['memantine', 'memantine', 'dextromethorphan', 'tiletamine', 'flumazenil', 'naloxone', 'sertraline', 'diazepam', 'bupropion', 'caffeine'],
    68, 34, '所有声音都在指你。', 'Every voice is pointing at you.', '你让那句话停下。', 'You make the sentence stop.', '你被它说中了。', 'It gets you.', undefined, 'battle-fruit'),
  battle('dlc-b5', '空洞', 'Emptiness', '空洞', 'Emptiness', '什么都感觉不到', 'I feel nothing', 'soft', 'bg_dlc_noodle_shop',
    ['morphine', 'oxycodone', 'codeine', 'tramadol', 'magnesium', 'pregabalin', 'gabapentin', 'lidocaine', 'nutrition_iv', 'electrolyte'],
    72, 36, '没有痛，也没有别的东西。', 'No pain. Nothing else either.', '有一点感觉回来了。', 'Something comes back.', '你什么都没有抓住。', 'You catch nothing.', undefined, 'battle-run'),
  battle('dlc-b6', '幻觉', 'Hallucination', '幻觉', 'Hallucination', '墙在呼吸', 'The walls are breathing', 'cup', 'bg_dlc_chunfeng_room',
    ['phenelzine', 'tranylcypromine', 'moclobemide', 'trihexyphenidyl', 'scopolamine', 'benztropine', 'memantine', 'dextromethorphan', 'morphine', 'naloxone'],
    76, 38, '墙在呼吸。你决定不眨眼。', 'The wall is breathing. You decide not to blink.', '墙安静下来。', 'The wall goes quiet.', '墙把你吞进去。', 'The wall swallows you.', undefined, 'battle-pixel'),
  battle('dlc-b7', '父亲的质问', 'The Father\'s Question', '父亲的质问', 'The Father\'s Question', '你为什么不回家', 'Why don\'t you come home', 'shadow', 'bg_dlc_school_gate',
    ['phenobarbital', 'secobarbital', 'morphine', 'fentanyl', 'methadone', 'trihexyphenidyl', 'scopolamine', 'diazepam', 'clonazepam', 'naloxone'],
    80, 40, '门口站着一个不肯走的人。', 'Someone at the door refuses to leave.', '你让那阵风过去了。', 'You let the wind pass.', '你被那阵风压垮了。', 'The wind presses you down.', undefined, 'battle-sewer'),
  battle('dlc-b8', '剧烈变形', 'Violent Metamorphosis', '剧烈变形', 'Violent Metamorphosis', '死藤水在血管里展开', 'The ayahuasca unfolds in the veins', 'harukaze', 'bg_dlc_summer_street',
    ['phenelzine', 'tranylcypromine', 'escitalopram', 'fentanyl', 'morphine', 'memantine', 'scopolamine', 'trihexyphenidyl', 'diazepam', 'naloxone', 'vitamin_b6', 'magnesium'],
    160, 80, '你喝下了死藤水。身体开始不属于你。', 'You drank the ayahuasca. Your body stops belonging to you.', '变形停了。你还认得自己。', 'The deformation stops. You still recognize yourself.', '你在幻觉里散开了。', 'You come apart inside the hallucination.', 50, 'battle'),
];

export const STAGES: Stage[] = [
  {
    id: 'dlc-1', no: 1, title: { zh: '失眠', en: 'Insomnia' },
    blurb: { zh: '醒着太久的人，先被自己的清醒追上。', en: 'Wake long enough and your own wakefulness catches you.' },
    battleId: 'dlc-b1', bg: 'bg_dlc_school_gate', rewards: ['sertraline', 'vitamin_b6', 'caffeine'], shop: ['sertraline', 'fluoxetine', 'vitamin_b6', 'diazepam'],
  },
  {
    id: 'dlc-2', no: 2, title: { zh: '戒断', en: 'Withdrawal' },
    blurb: { zh: '身体开始讨要那些你答应过不再碰的东西。', en: 'The body starts collecting what you promised never to touch again.' },
    battleId: 'dlc-b2', bg: 'bg_dlc_classroom', rewards: ['paroxetine', 'electrolyte', 'diazepam'], shop: ['escitalopram', 'venlafaxine', 'zopiclone', 'electrolyte'],
  },
  {
    id: 'dlc-3', no: 3, title: { zh: '解离', en: 'Dissociation' },
    blurb: { zh: '你看见自己在两步之外，像看一个陌生人。', en: 'You see yourself two steps away, like a stranger.' },
    battleId: 'dlc-b3', bg: 'bg_dlc_summer_street', rewards: ['alprazolam', 'magnesium', 'pregabalin'], shop: ['lorazepam', 'pregabalin', 'magnesium', 'memantine'],
  },
  {
    id: 'dlc-4', no: 4, title: { zh: '自责', en: 'Self-Blame' },
    blurb: { zh: '所有声音都长着同一张脸，说同一句话。', en: 'Every voice has the same face and says the same sentence.' },
    battleId: 'dlc-b4', bg: 'bg_dlc_classroom', rewards: ['memantine', 'bupropion', 'flumazenil'], shop: ['dextromethorphan', 'memantine', 'naloxone', 'bupropion'],
  },
  {
    id: 'dlc-5', no: 5, title: { zh: '空洞', en: 'Emptiness' },
    blurb: { zh: '没有痛，也没有别的东西。你摸不到自己的底。', en: 'No pain, and nothing else. You cannot feel the bottom of yourself.' },
    battleId: 'dlc-b5', bg: 'bg_dlc_noodle_shop', rewards: ['gabapentin', 'nutrition_iv', 'pregabalin'], shop: ['lidocaine', 'pregabalin', 'electrolyte', 'nutrition_iv'],
  },
  {
    id: 'dlc-6', no: 6, title: { zh: '幻觉', en: 'Hallucination' },
    blurb: { zh: '墙在呼吸。你决定不眨眼。', en: 'The wall is breathing. You decide not to blink.' },
    battleId: 'dlc-b6', bg: 'bg_dlc_chunfeng_room', rewards: ['moclobemide', 'trihexyphenidyl', 'naloxone'], shop: ['moclobemide', 'trihexyphenidyl', 'benztropine', 'dextromethorphan'],
  },
  {
    id: 'dlc-7', no: 7, title: { zh: '父亲的质问', en: "The Father's Question" },
    blurb: { zh: '门外的脚步声停了。问题还在。', en: 'The footsteps stop. The question remains.' },
    battleId: 'dlc-b7', bg: 'bg_dlc_school_gate', rewards: ['lorazepam', 'estazolam', 'clonazepam'], shop: ['clonazepam', 'lorazepam', 'trihexyphenidyl', 'naloxone'],
  },
  {
    id: 'dlc-8', no: 8, title: { zh: '剧烈变形', en: 'Violent Metamorphosis' },
    blurb: { zh: '死藤水下去，世界开始折叠。在幻觉把你拆散之前，认出你自己。', en: 'The ayahuasca goes down and the world starts to fold. Recognize yourself before the hallucination takes you apart.' },
    battleId: 'dlc-b8', bg: 'bg_dlc_summer_street', rewards: ['escitalopram', 'memantine', 'vitamin_b6'], shop: ['moclobemide', 'memantine', 'naloxone', 'magnesium'],
  },
];

export const STAGE_MAP: Record<string, Stage> = Object.fromEntries(
  STAGES.map((stage) => [stage.id, stage]),
);

export const BATTLE_MAP: Record<string, BattleDef> = Object.fromEntries(
  BATTLES.map((item) => [item.id, item]),
);

export const DEFAULT_UPGRADES = { phys: 0, mental: 0, ap: 0, apCap: 0, draw: 0 };

/** 强化定义：每级增量、上限、费用（baseCost + costStep*当前级）。 */
export const UPGRADE_DEFS: Record<
  string,
  { perLevel: number; maxLevel: number; baseCost: number; costStep: number }
> = {
  phys: { perLevel: 8, maxLevel: 5, baseCost: 12, costStep: 6 },
  mental: { perLevel: 4, maxLevel: 5, baseCost: 12, costStep: 6 },
  ap: { perLevel: 1, maxLevel: 2, baseCost: 20, costStep: 10 },
  apCap: { perLevel: 1, maxLevel: 3, baseCost: 15, costStep: 8 },
  draw: { perLevel: 1, maxLevel: 2, baseCost: 18, costStep: 10 },
};

export function upgradeCost(track: string, level: number): number {
  const def = UPGRADE_DEFS[track];
  return def.baseCost + def.costStep * level;
}

/** 由强化等级算出战斗属性（生理/心理增量保持 ×2）。 */
export function computeStats(upgrades: Record<string, number>): import('./types').PlayerStats {
  const u = { ...DEFAULT_UPGRADES, ...upgrades };
  return {
    maxPhys: 60 + UPGRADE_DEFS.phys.perLevel * u.phys,
    maxMental: 30 + UPGRADE_DEFS.mental.perLevel * u.mental,
    apPerTurn: 3 + u.ap,
    apCap: 5 + u.apCap,
    drawPerTurn: 1 + u.draw,
  };
}

export const DEFAULT_DLC_SAVE: DlcSave = {
  upgrades: { ...DEFAULT_UPGRADES },
  stage: 1,
  completed: [],
  deck: [...STARTER_DECK],
  collection: { ...STARTING_COLLECTION },
  currency: 30,
  seenIntro: false,
  battleWins: [],
};
