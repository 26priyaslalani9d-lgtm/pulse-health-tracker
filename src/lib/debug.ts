/** Debug logger — no-op in production builds (the brief bans raw console.log). */

const enabled = __DEV__;

export function debug(tag: string, ...args: unknown[]): void {
  if (!enabled) return;
  // eslint-disable-next-line no-console
  console.log(`[pulse:${tag}]`, ...args);
}

export function debugWarn(tag: string, ...args: unknown[]): void {
  if (!enabled) return;
  // eslint-disable-next-line no-console
  console.warn(`[pulse:${tag}]`, ...args);
}
