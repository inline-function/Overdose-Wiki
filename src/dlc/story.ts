// DLC 独立剧情引擎的数据模型与内容。不依赖主线 content/registry 或 ReplayPage。
// 春风星头无脸，expr 走 8 态差分（calm/smile/intense/tired/sad/restless/blank/hurt）。

export type DlcBeat = {
  /** '春风' 或省略（旁白）。后续可加其他角色。 */
  speaker?: string;
  /** 春风表情差分；省略则沿用上一拍。 */
  expr?: string;
  text: string;
  /** 可选：本拍切换背景。 */
  bg?: string;
};

export type DlcScene = {
  id: string;
  title: string;
  bg: string;
  beats: DlcBeat[];
};

// 示例幕：演示引擎与差分切换。正式剧情由此扩写。
export const DLC_STORY: DlcScene[] = [
  {
    id: 'summer-street',
    title: '夏日街道',
    bg: 'bg_dlc_summer_street',
    beats: [
      { text: '二〇二四年的夏天，街道被晒得发白。' },
      { speaker: '春风', expr: 'calm', text: '……又是一个人。也好。' },
      { speaker: '春风', expr: 'smile', text: '至少今天的云，看起来很好吃。' },
      { speaker: '春风', expr: 'restless', text: '可是手还是在抖。不是冷。' },
      { speaker: '春风', expr: 'sad', text: '如果有一天我把自己弄丢了，会有人发现吗。' },
      { speaker: '春风', expr: 'calm', text: '……先回去吧。药还在桌上。' },
    ],
  },
];

export const DLC_STORY_MAP: Record<string, DlcScene> = Object.fromEntries(
  DLC_STORY.map((scene) => [scene.id, scene]),
);
