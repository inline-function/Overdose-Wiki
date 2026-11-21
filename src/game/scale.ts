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
  const fit = Math.floor(
    Math.min(viewportW / LOGICAL_W, viewportH / LOGICAL_H),
  );
  return Math.max(1, Math.min(4, fit || 1));
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