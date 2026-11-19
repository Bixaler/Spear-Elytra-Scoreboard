import { useEffect, useState } from 'react';

/**
 * Ticking wall-clock value for timer displays.
 *
 * Deliberately NOT requestAnimationFrame based: rAF suspends in background
 * tabs, and while epoch math keeps the displayed time correct either way,
 * the interval still lets background tabs fire cheap periodic updates so
 * countdown completion is detected promptly.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
