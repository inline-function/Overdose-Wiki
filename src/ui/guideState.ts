import { useEffect, useSyncExternalStore } from 'react';

let hiddenCount = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 有全屏浮层（章节开场、编写文档）时让任务指引让位 */
export function useSuppressGuide(on: boolean) {
  useEffect(() => {
    if (!on) return;
    hiddenCount += 1;
    emit();
    return () => {
      hiddenCount = Math.max(0, hiddenCount - 1);
      emit();
    };
  }, [on]);
}

export function useGuideSuppressed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hiddenCount > 0,
    () => false,
  );
}
