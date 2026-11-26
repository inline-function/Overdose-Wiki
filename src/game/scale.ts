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
  // 分数自适应填充屏幕（不取整留黑边），横屏/全屏时尽量铺满。
  return Math.min(8, Math.max(0.5, fit));
}

/** 全屏 + 横屏锁定（移动端）。返回 fullscreen 状态与切换函数。 */
export function useFullscreen(): { fullscreen: boolean; toggle: () => void } {
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      try { (screen.orientation as unknown as { unlock?: () => void })?.unlock?.(); } catch { /* noop */ }
    } else {
      void document.documentElement.requestFullscreen?.().then(() => {
        const orient = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
        orient?.lock?.('landscape').catch(() => {});
      }).catch(() => {});
    }
  };
  return { fullscreen, toggle };
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