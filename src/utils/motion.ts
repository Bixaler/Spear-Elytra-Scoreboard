import type { AnimIntensity, Settings } from '../types';

/**
 * Central animation language. Every broadcast animation derives its numbers
 * from here so intensity + speed settings apply consistently across the
 * whole overlay. "intensity" controls magnitude, "speed" scales durations.
 */
export interface AnimConfig {
  /** Vertical travel of rolling digits, in em. */
  travel: number;
  /** Base duration (seconds) before the speed multiplier. */
  dur: number;
  ease: [number, number, number, number];
  /** Whether value changes emit a colour flash. */
  flash: boolean;
  /** Extra particle/glow embellishments allowed. */
  flourish: boolean;
}

export function animFor(settings: Settings): AnimConfig {
  const table: Record<AnimIntensity, Omit<AnimConfig, 'dur'>> = {
    minimal: { travel: 0.45, ease: [0.3, 0.9, 0.4, 1], flash: false, flourish: false },
    standard: { travel: 0.8, ease: [0.22, 1, 0.36, 1], flash: true, flourish: true },
    cinematic: { travel: 1.15, ease: [0.19, 1, 0.22, 1], flash: true, flourish: true },
  };
  const base = table[settings.intensity];
  return {
    ...base,
    dur: 0.34 / settings.speed,
  };
}

/** Convenience: duration in seconds scaled by the user's speed setting. */
export function dur(seconds: number, settings: Settings): number {
  return seconds / settings.speed;
}

/**
 * How long each broadcast command stays on screen (seconds, before speed
 * scaling). Shared by the Overlay root (auto-dismiss) and the store's
 * round/duel flow automations (delayed stat resets must wait for the
 * animation to finish).
 */
export const BROADCAST_DURATION_S: Record<
  'intro' | 'duelVictory' | 'roundVictory',
  number
> = {
  intro: 3.4,
  duelVictory: 4.4,
  roundVictory: 2.6,
};

/** Grace period added on top of a broadcast duration before a flow reset lands. */
export const FLOW_GRACE_S = 0.6;
