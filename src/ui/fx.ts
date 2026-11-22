import type { Beat } from '../content/types';

/** 持续型效果用的 CSS 滤镜；进入/退出由 .sceneWrap 的 filter transition 补间。 */
export const FX_FILTER: Partial<Record<FxId, string>> = {
  blur: 'blur(1px)',
  sharpen: 'contrast(1.24) saturate(1.18) brightness(1.03)',
  dull: 'grayscale(0.72) brightness(0.82) contrast(0.94)',
  gloom: 'brightness(0.72) saturate(0.68) contrast(1.02)',
};

/** 叠在场景上的持续型覆盖层（辉光 / 隧道视野） */
export const FX_OVERLAY: Partial<Record<FxId, 'glow' | 'vignette' | 'gloom'>> = {
  glow: 'glow',
  vignette: 'vignette',
  gloom: 'gloom',
};

/** 对话特效：整屏反馈 + 声音，由 beat 上的 fx 字段触发。 */
export type FxId =
  | 'shake'
  | 'blur'
  | 'sharpen'
  | 'glow'
  | 'dull'
  | 'flash'
  | 'vignette'
  | 'tear'
  | 'pulse'
  | 'invert'
  | 'static'
  | 'gloom';

export type FxSound =
  | 'impact'
  | 'dissolve'
  | 'focus'
  | 'halo'
  | 'hollow'
  | 'sting'
  | 'heartbeat'
  | 'broken'
  | 'hiss';

export type FxSpec = {
  /** 无障碍描述，读屏与调试用 */
  label: string;
  sound?: FxSound;
  /** 一次性效果：重播 Web Animations，而不是持续滤镜 */
  oneShot?: boolean;
};

export const FX: Record<FxId, FxSpec> = {
  shake: { label: '震惊 · 屏幕抖动', sound: 'impact', oneShot: true },
  blur: { label: '解离 · 画面模糊', sound: 'dissolve' },
  sharpen: { label: '反解离 · 画面锐化', sound: 'focus' },
  glow: { label: '余晖 · 边缘辉光', sound: 'halo' },
  dull: { label: '沮丧 · 褪色下沉', sound: 'hollow' },
  flash: { label: '闪白 · 一瞬刺目', sound: 'sting', oneShot: true },
  vignette: { label: '压迫 · 隧道视野', sound: 'heartbeat' },
  tear: { label: '撕裂 · 画面错位', sound: 'broken', oneShot: true },
  pulse: { label: '心跳 · 屏息脉动', sound: 'heartbeat', oneShot: true },
  invert: { label: '断片 · 反相闪回', sound: 'sting', oneShot: true },
  static: { label: '失神 · 静电噪点', sound: 'hiss', oneShot: true },
  gloom: { label: '阴暗 · 画面沉下去', sound: 'hollow' },
};

export function beatFx(beat: Beat | undefined): FxId | undefined {
  const id = (beat as { fx?: string } | undefined)?.fx;
  return id && id in FX ? (id as FxId) : undefined;
}

/** 一次性效果的整屏动画（Web Animations），duration 与音效对齐 */
export const SCENE_ANIM: Partial<
  Record<FxId, { keyframes: Keyframe[]; options: KeyframeAnimationOptions }>
> = {
  shake: {
    keyframes: [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(-5px, 3px, 0)' },
      { transform: 'translate3d(4px, -4px, 0)' },
      { transform: 'translate3d(-4px, -2px, 0)' },
      { transform: 'translate3d(3px, 3px, 0)' },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    options: { duration: 460, easing: 'steps(3, end)' },
  },
  pulse: {
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.012)' },
      { transform: 'scale(1)' },
      { transform: 'scale(1.008)' },
      { transform: 'scale(1)' },
    ],
    options: { duration: 1100, easing: 'ease-in-out' },
  },
  tear: {
    keyframes: [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(-7px, 0, 0) skewX(-1.4deg)' },
      { transform: 'translate3d(6px, 0, 0) skewX(1.1deg)' },
      { transform: 'translate3d(-2px, 0, 0)' },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    options: { duration: 380, easing: 'steps(4, end)' },
  },
};

/** 叠在场景上的效果层（闪光 / 反相 / 噪点） */
export const LAYER_ANIM: Partial<
  Record<FxId, { keyframes: Keyframe[]; options: KeyframeAnimationOptions }>
> = {
  flash: {
    keyframes: [{ opacity: 0 }, { opacity: 0.9, offset: 0.18 }, { opacity: 0 }],
    options: { duration: 380, easing: 'ease-out' },
  },
  invert: {
    keyframes: [{ opacity: 0 }, { opacity: 0.75, offset: 0.3 }, { opacity: 0 }],
    options: { duration: 300, easing: 'steps(2, end)' },
  },
  static: {
    keyframes: [
      { opacity: 0 },
      { opacity: 0.4, offset: 0.15 },
      { opacity: 0.16, offset: 0.55 },
      { opacity: 0 },
    ],
    options: { duration: 700, easing: 'linear' },
  },
};
