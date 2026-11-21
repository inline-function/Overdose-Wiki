import { CH01_DURATION, CH01_SFX, drawCh01 } from './ch01';
import { CH02_DURATION, CH02_SFX, drawCh02 } from './ch02';
import { CH03_DURATION, CH03_SFX, drawCh03 } from './ch03';
import { CH04_DURATION, CH04_SFX, drawCh04 } from './ch04';

export type CanvasOpening = {
  chapterId: string;
  duration: number;
  sfx: Array<{ t: number; key: string }>;
  draw: (ctx: CanvasRenderingContext2D, time: number) => void;
  ariaLabel: string;
  caption: string;
};

// 有画布开场动画的章节。没有登记的章节继续走文字章节卡。
export const CANVAS_OPENINGS: Record<string, CanvasOpening> = {
  ch01: {
    chapterId: 'ch01',
    duration: CH01_DURATION,
    sfx: CH01_SFX,
    draw: drawCh01,
    ariaLabel: '第一章《虚数根》开场动画',
    caption: '虚数根 · IMAGINARY ROOTS',
  },
  ch02: {
    chapterId: 'ch02',
    duration: CH02_DURATION,
    sfx: CH02_SFX,
    draw: drawCh02,
    ariaLabel: '第二章《苦涩的颜料》开场动画',
    caption: '苦涩的颜料 · BITTER PIGMENT',
  },
  ch03: {
    chapterId: 'ch03',
    duration: CH03_DURATION,
    sfx: CH03_SFX,
    draw: drawCh03,
    ariaLabel: '第三章《从此再也不见》开场动画',
    caption: '从此再也不见 · NEVER SEEN AGAIN',
  },
  ch04: {
    chapterId: 'ch04',
    duration: CH04_DURATION,
    sfx: CH04_SFX,
    draw: drawCh04,
    ariaLabel: '第四章《人们将往何处去》开场动画',
    caption: '人们将往何处去 · WHERE DO WE GO?',
  },
};
