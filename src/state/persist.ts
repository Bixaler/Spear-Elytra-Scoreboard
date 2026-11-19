/**
 * LocalStorage persistence for the scoreboard state.
 *
 * - Debounced writes keep rapid score-tapping cheap.
 * - Loading performs a defensive deep-merge over the defaults so state saved
 *   by an older version of the app still hydrates cleanly.
 * - Transient fields (command) are stripped before saving.
 */

import type { ScoreboardState } from '../types';
import { defaultState } from './defaults';
import { sessionId } from '../utils/id';

export const STORAGE_KEY = 'arena-cx.state.v1';

/** Recursively merge persisted data over defaults; arrays replace wholesale. */
function mergeOverDefaults<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(saved) ? saved : base) as T;
  }
  if (base && typeof base === 'object') {
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(base as Record<string, unknown>)) {
      out[key] = mergeOverDefaults(
        (base as Record<string, unknown>)[key],
        (saved as Record<string, unknown>)[key]
      );
    }
    return out as T;
  }
  // Primitives: accept saved value when present and of matching type.
  if (
    saved !== null &&
    saved !== undefined &&
    (typeof saved === typeof base || (base === null && typeof saved === 'object'))
  ) {
    return saved as T;
  }
  return base;
}

export function loadState(): ScoreboardState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ScoreboardState>;
    const merged = mergeOverDefaults(base, parsed);
    // Transient fields never survive a reload.
    merged.command = null;
    merged.origin = sessionId();
    return merged;
  } catch {
    return base;
  }
}

let saveTimer: number | null = null;

export function saveState(state: ScoreboardState): void {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    try {
      const { command: _command, ...persisted } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* storage full or unavailable — the app keeps working in-memory */
    }
  }, 180);
}
