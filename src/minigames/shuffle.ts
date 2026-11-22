/** Fisher-Yates shuffle for display-only ordering. */
export function shuffleArray<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Shuffle answer options and make sure the correct option is never the first
 * one. The story deliberately asks the player to read, not to always click the
 * top button.
 */
export function shuffleOptions<T>(
  items: readonly T[],
  isCorrect: (item: T) => boolean,
  random: () => number = Math.random,
): T[] {
  const next = shuffleArray(items, random);
  if (next.length < 2 || !isCorrect(next[0])) return next;
  const swapWith = 1 + Math.floor(random() * (next.length - 1));
  [next[0], next[swapWith]] = [next[swapWith], next[0]];
  return next;
}
