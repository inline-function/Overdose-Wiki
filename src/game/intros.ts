export type ChapterIntro = {
  chapterId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  lines: string[];
  cue: string;
};

export const CHAPTER_INTROS: Record<string, ChapterIntro> = {
  ch01: {
    chapterId: 'ch01',
    eyebrow: 'CHAPTER 01',
    title: '虚数根',
    subtitle: '一个人的根',
    lines: [
      '2022 年，北方农村。他以为一切希望都押在一件事上。',
      '后来那件事失败了。他开始寻找一条看不见的根。',
      '余晖、减害、执念——虚数根在实数里无解，却支撑了他全部的枝干。',
    ],
    cue: 'ch01',
  },
  ch02: {
    chapterId: 'ch02',
    eyebrow: 'CHAPTER 02',
    title: '苦涩的颜料',
    subtitle: '把苦涂成颜色',
    lines: [
      '2023 年，一个陌生人把她当成救命稻草。',
      '她把苦涂成五彩斑斓的颜色，越亮，底下的东西越苦。',
      '2024 年 5 月 5 日，颜料用完了。',
    ],
    cue: 'ch02-early',
  },
  ch03: {
    chapterId: 'ch03',
    eyebrow: 'CHAPTER 03',
    title: '从此再也不见',
    subtitle: '撤离点',
    lines: [
      '2024 年 2 月，她向后藤要一个不会痛苦的方法。',
      '后藤没有给方法，只问她在哪。',
      '三月，她消失在北方大城市监控最多的街上。',
    ],
    cue: 'ch03',
  },
  ch04: {
    chapterId: 'ch04',
    eyebrow: 'CHAPTER 04',
    title: '人们将往何处去',
    subtitle: '记录之后',
    lines: [
      '批斗、内战、列管、外部凝视。',
      '药圈一步步走向死亡，记录还在继续。',
      '人们将往何处去。',
    ],
    cue: 'disappear',
  },
  dlc: {
    chapterId: 'dlc',
    eyebrow: 'DLC',
    title: '稍尽春风',
    subtitle: '回望一个死去的指路人',
    lines: [
      '2024 年，后藤还在找一个死去一年多的人。',
      '他循着幻化成风的踪迹，回望 2022 年的夏天。',
      '稍尽春风。',
    ],
    cue: 'dlc-summer',
  },
};