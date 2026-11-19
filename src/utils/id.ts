/** Small id/uid helpers shared across the app. */

let counter = 0;

/** Prefixed, collision-resistant id without pulling an uuid dependency. */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Random session id used to tag state writes (sync loop prevention). */
export function sessionId(): string {
  return uid('sess');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
