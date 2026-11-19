/**
 * Tiny WebAudio sound engine — synthesized tones, zero audio assets.
 *
 * Used for the break countdown completion chime and optional final-seconds
 * ticks. OBS browser sources allow autoplay; regular browsers may require a
 * user gesture first, in which case the context is resumed silently on the
 * next attempt.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, startDelay: number, duration: number, gainValue: number, type: OscillatorType = 'sine'): void {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + startDelay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Warm three-note chime for break completion. */
export function playBreakChime(): void {
  tone(880, 0, 0.28, 0.22);
  tone(1108.7, 0.16, 0.28, 0.22);
  tone(1318.5, 0.32, 0.5, 0.24);
}

/** Soft tick for the final seconds of a countdown. */
export function playUrgencyTick(): void {
  tone(660, 0, 0.09, 0.12, 'triangle');
}

/** Confirm blip used by control panel actions (kept very quiet). */
export function playConfirmBlip(): void {
  tone(520, 0, 0.08, 0.05, 'square');
}
