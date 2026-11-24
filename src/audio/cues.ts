import type { Scene } from '../content/types';
import { CUES, type CueId } from './manifest';

const CHAPTER_DEFAULT: Record<string, CueId> = {
  ch01: 'ch01',
  ch02: 'ch02-early',
  ch03: 'ch03',
  ch04: 'tension',
  side: 'archive',
  dlc: 'dlc-summer',
};

/**
 * 逐场的音乐分配：按情绪走，而不是整章一首。
 * 可用的曲子见 manifest.CUES。
 */
const SCENE_CUE: Record<string, CueId> = {
  // ch01 · 虚数根
  'ch01.s03': 'tension', // 站在楼上
  'ch01.s04': 'afterglow', // 余晖
  'ch01.s06': 'tension', // 第五高原
  'ch01.s08': 'archive', // 贴吧答疑
  'ch01.s09': 'archive', // 群聊
  'ch01.s10': 'archive', // 陌生人邀请
  'ch01.s11': 'afterglow', // 恢复术
  'ch01.s12': 'archive', // 报告编辑页
  'ch01.s14': 'afterglow', // 后记

  // ch02 · 苦涩的颜料
  'ch02.s07': 'tension', // 隧道与幻觉
  'ch02.s09': 'tension', // 昏迷与失忆
  'ch02.s11': 'ch02-late', // 对不起的循环
  'ch02.s12': 'afterglow', // 回光返照
  'ch02.s13': 'tension', // 虫子
  'ch02.s14': 'ch02-late', // 无人接听
  'ch02.s15': 'afterglow', // 姐姐的回忆
  'ch02.s16': 'tension', // 刑警的话
  'ch02.s17': 'tragedy', // 四月二十四日清晨
  'ch02.s18': 'ch02-late', // 那幅画
  'ch02.s19': 'ch02-late', // 打了一夜语音
  'ch02.s20': 'afterglow', // 姐姐的梦
  'ch02.s22': 'ch02-late', // 来得及
  'ch02.s23': 'tragedy', // 最后一条消息
  'ch02.s24': 'morning', // 五彩的画未干

  // ch03 · 解离
  'ch03.s07': 'tension', // 荒唐的世界
  'ch03.s08': 'afterglow', // 人生的每一刻
  'ch03.s15': 'tension', // 过载
  'ch03.s17': 'tension', // 失控
  'ch03.s18': 'afterglow', // 安全锚
  'ch03.s19': 'afterglow', // 拥抱之后
  'ch03.s22': 'tension', // 手机关机 24 小时
  'ch03.s24': 'disappear', // 空街

  // ch04 · 人们将往何处去（按实际场景重排，避免过于轻松的 afterglow）
  'ch04.s01': 'tension', // 建站三说
  'ch04.s02': 'battle', // 自由派与减害派
  'ch04.s03': 'tension', // 紧急事故；事件内一次性 drug-war
  'ch04.s04': 'battle', // 伪藤
  'ch04.s05': 'battle', // 核武器
  'ch04.s06': 'tension', // 退圈
  'ch04.s07': 'battle', // 圣诞批斗
  'ch04.s08': 'tension', // 批斗余波
  'ch04.s09': 'battle', // 反减害论
  'ch04.s10': 'tension', // 罗生门展开
  'ch04.s11': 'tension', // 声音一 · 反藤者
  'ch04.s12': 'tragedy', // 声音二 · 后藤
  'ch04.s13': 'battle', // 声音三 · 沐雨
  'ch04.s14': 'battle', // 四十六分钟
  'ch04.s15': 'tension', // 代管
  'ch04.s16': 'battle', // 反击开始
  'ch04.s17': 'battle', // 批斗员开战
  'ch04.s18': 'tension', // 假退圈
  'ch04.s19': 'tension', // 假死
  'ch04.s20': 'tragedy', // 公开文档
  'ch04.s21': 'tension', // FreeODwiki
  'ch04.s22': 'tension', // 爱德华
  'ch04.s23': 'battle', // 方针之争
  'ch04.s24': 'tension', // 苏镁条目
  'ch04.s25': 'tension', // 后藤回应
  'ch04.s26': 'tension', // 鼠尾草反驳
  'ch04.s27': 'tension', // 知识论
  'ch04.s28': 'battle', // 付费采访
  'ch04.s29': 'separation', // 南鸢
  'ch04.s30': 'tension', // 列管倒计时
  'ch04.s31': 'tragedy', // 自由的代价
  'ch04.s32': 'separation', // 来信
  'ch04.s33': 'tragedy', // 家长断药
  'ch04.s34': 'battle', // 药圈唾骂
  'ch04.s35': 'tragedy', // 精神障碍患者
  'ch04.s36': 'tension', // 评论
  'ch04.s37': 'disappear', // 药圈分崩离析
  'ch04.s38': 'disappear', // 后藤还在答疑
  'ch04.s39': 'disappear', // oder 的出路
  'ch04.s40': 'credits', // 没有人知道

  // dlc
  'dlc.s05': 'night-market', // 温柔 · 老友粉店
  'dlc.s06': 'tragedy', // 死藤水之夜
  'dlc.s07': 'tragedy', // 风父
  'dlc.s08': 'dlc-summer', // 稍尽春风

  // side · 散页
  'side-35': 'ch01', // 长路漫漫
  'side-58': 'tragedy', // 师傅
  'side-83': 'tension', // 门口的警车
  'side-84': 'afterglow', // 一种余晖
};

export function resolveSceneCue(scene: Pick<Scene, 'id' | 'chapterId'> & { cue?: string }): CueId {
  if (scene.cue && scene.cue in CUES) return scene.cue as CueId;
  return SCENE_CUE[scene.id] ?? CHAPTER_DEFAULT[scene.chapterId] ?? 'archive';
}

export function cueForPath(pathname: string): CueId | undefined {
  if (pathname === '/consent') return undefined;
  if (pathname.startsWith('/report/') && pathname.includes('/replay/')) return undefined;
  if (pathname.startsWith('/battle/')) return undefined;
  if (pathname === '/extras' || pathname.startsWith('/extras/')) return 'extras';
  if (pathname === '/') return 'title';
  if (pathname === '/settings') return 'archive';
  if (
    pathname === '/archive' ||
    pathname === '/history' ||
    pathname === '/discussion' ||
    pathname === '/docs' ||
    pathname === '/drugs' ||
    pathname === '/boxes' ||
    pathname === '/chapters' ||
    pathname === '/deck' ||
    pathname.startsWith('/analysis') ||
    pathname.startsWith('/effects') ||
    pathname.startsWith('/drug/') ||
    pathname.startsWith('/report/')
  ) {
    return 'archive';
  }
  return 'tension';
}
