/** Display names. Keys are the Chinese names used in content; values are the
 *  names shown in English. Keep this list in sync with docs/i18n/GLOSSARY.md. */
export const EN_NAMES: Record<string, string> = {
  后藤: 'Gotō',
  彩加: 'Ayaka',
  照顾者: 'Caregiver',
  彩加母亲: "Ayaka's Mother",
  彼岸境: 'Jing',
  右仔: 'Dex',
  小郁: 'Xiaoyu',
  鸡哥: 'Brother Ji',
  冷却报告: 'Cooling Report',
  反藤者: 'Anti-Gotō',
  群友: 'Group Member',
  沐雨: 'Muyu',
  批斗员: 'Critic',
  鼠尾草: 'Sage',
  南鸢: 'Nanyuan',
  来信者: 'Letter Writer',
  路人: 'Passerby',
  朋友: 'Friend',
  精神障碍患者: 'Patient',
  评论: 'Comment',
  处理者手记: "Handler's Notes",
  匿名: 'Anonymous',
  第一回合: 'Round One',
  第二回合: 'Round Two',
  第三回合: 'Round Three',
  结局: 'Ending',
  春风: 'Spring',
};

export function localizeName(name: string | undefined): string | undefined {
  if (!name) return name;
  return EN_NAMES[name] ?? name;
}
