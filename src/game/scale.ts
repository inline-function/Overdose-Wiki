import { useEffect, useState } from 'react';
import type { ScaleSetting } from './types';

export const LOGICAL_W = 480;
export const LOGICAL_H = 270;

export function computeScale(
  locked: ScaleSetting,
  viewportW = window.innerWidth,
  viewportH = window.innerHeight,
): number {
  if (locked !== 'auto') return locked;
  const fit = Math.min(viewportW / LOGICAL_W, viewportH / LOGICAL_H);
  // 视口放不下 1× 时用分数缩放整窗适配，而不是裁切（修 430 竖屏右边被裁的根因）。
  if (fit < 1) return Math.max(0.5, fit);
  return Math.max(1, Math.min(4, Math.floor(fit)));
}

export function useGameScale(locked: ScaleSetting): number {
  const [scale, setScale] = useState(() => {
    if (typeof window === 'undefined') return 2;
    return computeScale(locked);
  });

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      setScale(
        computeScale(
          locked,
          vv?.width ?? window.innerWidth,
          vv?.height ?? window.innerHeight,
        ),
      );
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [locked]);

  useEffect(() => {
    document.documentElement.style.setProperty('--s', String(scale));
  }, [scale]);

  return scale;
}