// DLC 独立剧情引擎的数据模型与内容。不依赖主线 content/registry 或 ReplayPage。
// 春风星头无脸，expr 走 8 态差分。剧情以战前 interlude 插入八关，尾幕接结局。
// 基调：纪念/减害/哀悼；不殉道化；不写制毒/组合/剂量。

export type DlcBeat = {
  speaker?: string;
  expr?: string;
  text: string;
  bg?: string;
};

export type DlcScene = {
  id: string;
  title: string;
  bg: string;
  bgm?: string;
  /** 播完后跳转的路由（interlude → 战斗；尾幕 → 结局）。 */
  next?: string;
  beats: DlcBeat[];
};

export const DLC_STORY: DlcScene[] = [
  {
    id: 'interlude-1', title: '没有自我介绍', bg: 'bg_dlc_school_gate', bgm: 'night-view', next: '/dlc/battle?stage=1',
    beats: [
      { text: '二〇二四年五月七日。有人在网上找一个叫春风的人。' },
      { speaker: '春风', expr: 'calm', text: '没有自我介绍。你觉得我是怎样，就是怎样。' },
      { speaker: '春风', expr: 'restless', text: '取决于你，不取决于我。' },
    ],
  },
  {
    id: 'interlude-2', title: '草稿纸', bg: 'bg_dlc_classroom', bgm: 'rest-time', next: '/dlc/battle?stage=2',
    beats: [
      { text: '草稿纸上爬满结构式。色胺、苯丙胺、单胺氧化酶。' },
      { speaker: '春风', expr: 'smile', text: '看懂这些的时候，我觉得自己什么都能掌控。' },
      { speaker: '春风', expr: 'intense', text: '后来才发现，我才是那个小丑。' },
    ],
  },
  {
    id: 'interlude-3', title: '我家是我家吗', bg: 'bg_dlc_summer_street', bgm: 'circulation', next: '/dlc/battle?stage=3',
    beats: [
      { speaker: '春风', expr: 'blank', text: '我家……是我家吗？' },
      { speaker: '春风', expr: 'restless', text: '我刚才在房间里做了什么。想不起来。' },
      { speaker: '春风', expr: 'sad', text: '好怕自己真的变成傻子。' },
    ],
  },
  {
    id: 'interlude-4', title: '好对不起', bg: 'bg_dlc_classroom', bgm: 'longing', next: '/dlc/battle?stage=4',
    beats: [
      { text: '朋友为他写了一张纸条。他连一个约定都没做到。' },
      { speaker: '春风', expr: 'sad', text: '好对不起朋友。想说一万个对不起。' },
      { speaker: '春风', expr: 'smile', text: '他为我做了那么多。' },
    ],
  },
  {
    id: 'interlude-5', title: '猫与雨', bg: 'bg_dlc_noodle_shop', bgm: 'night-view', next: '/dlc/battle?stage=5',
    beats: [
      { text: '路上店里有只猫。可爱。' },
      { speaker: '春风', expr: 'calm', text: '下雨了。很适合的雨。' },
      { speaker: '春风', expr: 'sad', text: '可是除了这些，我什么都感觉不到。' },
    ],
  },
  {
    id: 'interlude-6', title: '重要事情说三遍', bg: 'bg_dlc_chunfeng_room', bgm: 'tension', next: '/dlc/battle?stage=6',
    beats: [
      { speaker: '春风', expr: 'intense', text: '重要的事情说三遍——不要经常 OD 右美沙芬。' },
      { speaker: '春风', expr: 'calm', text: '我知道的。我都告诉你们了。' },
      { speaker: '春风', expr: 'restless', text: '……那我自己呢。' },
    ],
  },
  {
    id: 'interlude-7', title: '门外的脚步声', bg: 'bg_dlc_school_gate', bgm: 'eight', next: '/dlc/battle?stage=7',
    beats: [
      { text: '门外的脚步声停了。问题还在。' },
      { speaker: '春风', expr: 'restless', text: '他们问，是不是在学校受了欺负。' },
      { speaker: '春风', expr: 'sad', text: '没有人知道。连我自己也不知道。' },
    ],
  },
  {
    id: 'interlude-8', title: '死藤水前夜', bg: 'bg_dlc_chunfeng_room', bgm: 'battle-sewer', next: '/dlc/battle?stage=8',
    beats: [
      { text: '锅里的东西熬了一个半小时。还在熬。' },
      { speaker: '春风', expr: 'calm', text: '就一下。我想看看那边是什么。' },
      { speaker: '春风', expr: 'hurt', text: '手在抖。不是冷。' },
    ],
  },
  {
    id: 'tail', title: '幻化成风', bg: 'bg_dlc_nebula', bgm: 'morning', next: '/dlc/ending',
    beats: [
      { text: '我们至今不知道，他在英语听力里听见了什么。' },
      { speaker: '春风', expr: 'blank', text: '……' },
      { text: '幻化成风，随风而去。' },
      { speaker: '春风', expr: 'calm', text: '春风还在。' },
    ],
  },
];

export const DLC_STORY_MAP: Record<string, DlcScene> = Object.fromEntries(
  DLC_STORY.map((scene) => [scene.id, scene]),
);
