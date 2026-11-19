/** Time + text formatting helpers. */

/**
 * Format milliseconds as MM:SS. Minutes intentionally roll past 59
 * (e.g. 75:30) to keep the readout compact during long matches.
 */
export function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * Countdown formatting: MM:SS normally, SS.t (tenths) for the final
 * 10 seconds to give the urgency phase a sharper feel.
 */
export function formatCountdown(ms: number, urgencyMs: number): string {
  const clamped = Math.max(0, ms);
  if (clamped <= urgencyMs) {
    const total = Math.floor(clamped / 100) / 10; // seconds with tenths
    return `${total.toFixed(1)}`.padStart(4, '0');
  }
  return formatMMSS(clamped);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseDurationInput(minutes: number, seconds: number): number {
  return Math.max(0, Math.round(minutes * 60 + seconds)) * 1000;
}
