import type { Scene } from '../content/types';
import { CUES, type CueId } from './manifest';

const CHAPTER_DEFAULT: Record<string, CueId> = {
  ch01: 'ch01',
  ch02: 'ch02-early',
  ch03: 'ch03',
  ch04: 'archive',
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

  // ch04 · 记录即去向
  'ch04.s03': 'tension', // 紧急事故
  'ch04.s05': 'tension', // 核武器
  'ch04.s07': 'tension', // 圣诞批斗
  'ch04.s08': 'tension', // 批斗余波
  'ch04.s09': 'tension', // 有人喊他回来
  'ch04.s10': 'tension', // 罗生门
  'ch04.s12': 'tension', // 四十六分钟
  'ch04.s13': 'tragedy', // 自己挂名被批斗到死
  'ch04.s14': 'tension', // 反击开始
  'ch04.s15': 'tension', // 暗中毁生活
  'ch04.s16': 'tension', // 控制者生活被毁
  'ch04.s17': 'tension', // 境母来电
  'ch04.s18': 'afterglow', // 后藤直率回答
  'ch04.s19': 'tension', // 后藤折返跑找人
  'ch04.s20': 'afterglow', // 草坪
  'ch04.s21': 'afterglow', // 红钻头
  'ch04.s22': 'afterglow', // 后藤恨铁不成钢
  'ch04.s23': 'afterglow', // 做自己
  'ch04.s24': 'afterglow', // 码头
  'ch04.s25': 'afterglow', // 背回
  'ch04.s26': 'afterglow', // 自我认同
  'ch04.s29': 'tension', // 方针之争
  'ch04.s34': 'tension', // 倒计时
  'ch04.s35': 'tension', // 来信
  'ch04.s36': 'tension', // 家长断药
  'ch04.s37': 'disappear', // 全面列管
  'ch04.s38': 'disappear', // 患者与路人
  'ch04.s39': 'disappear', // 药圈分崩离析
  'ch04.s40': 'credits', // 记录即去向

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
  if (pathname === '/extras') return 'extras';
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
