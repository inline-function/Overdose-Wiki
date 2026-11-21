export const FULL_USERNAME = '@Supergogoto';
export const FULL_PASSWORD = 'to_the_Ephemeral_and_to_the_Eternal';

// The '@' is printed from the start; the player types the rest one key at a time.
export const USERNAME_TYPED = FULL_USERNAME.length - 1;
export const PASSWORD_TYPED = FULL_PASSWORD.length;

function clampCount(count: number, max: number) {
  return Math.max(0, Math.min(max, Math.floor(count)));
}

export function buildUsername(count: number): string {
  if (count <= 0) return '';
  return FULL_USERNAME.slice(0, 1 + clampCount(count, USERNAME_TYPED));
}

export function buildPassword(count: number): string {
  return FULL_PASSWORD.slice(0, clampCount(count, PASSWORD_TYPED));
}

export function nextCount(count: number, max: number): number {
  return Math.min(max, count + 1);
}

export function maskPassword(value: string, show: boolean): string {
  if (show || !value) return value;
  return `${'*'.repeat(Math.max(0, value.length - 1))}${value.slice(-1)}`;
}