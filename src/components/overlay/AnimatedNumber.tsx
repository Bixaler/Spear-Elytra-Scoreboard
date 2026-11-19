import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Settings } from '../../types';
import { animFor } from '../../utils/motion';
import { cn } from '../../utils/cn';

/**
 * Rolling broadcast number.
 *  - Increment: digits roll UP with a neon flash.
 *  - Decrement: digits roll DOWN with a cool/danger flash (distinct motion).
 *  - The colour flash is TEMPORARY: after the roll settles the digit always
 *    glides back to its neutral white — including when a value is reset to 0
 *    (it rolls down and fades back to white instead of sticking coloured).
 *
 * The flash class lives on the plain WRAPPER span, NOT on the framer-motion
 * digit span: AnimatePresence popLayout freezes/overrides the className of
 * entering/exitung motion children, so classes applied there never reach
 * the DOM. The wrapper updates reliably and the colour cascades down.
 */
export function AnimatedNumber({
  value,
  settings,
  className,
}: {
  value: number;
  settings: Settings;
  className?: string;
}) {
  const anim = animFor(settings);
  const prevRef = useRef(value);
  const dirRef = useRef<1 | -1>(1);
  const mountedRef = useRef(false);
  /** Direction of the most recent change; null once the flash has settled. */
  const [flashDir, setFlashDir] = useState<1 | -1 | null>(null);

  // Track direction of the latest change (render-time ref write is stable
  // under StrictMode because the guard only fires once per change).
  if (value !== prevRef.current) {
    dirRef.current = value > prevRef.current ? 1 : -1;
    prevRef.current = value;
    mountedRef.current = true;
  }

  // Colour flash lifecycle: light up on every change, then clear so the
  // CSS colour transition walks the digit back to its neutral white.
  useEffect(() => {
    if (!mountedRef.current) return;
    setFlashDir(dirRef.current);
    const t = window.setTimeout(
      () => setFlashDir(null),
      ((FLASH_HOLD_S + FLASH_FADE_S) * 1000) / settings.speed
    );
    return () => window.clearTimeout(t);
  }, [value, settings.speed]);

  const dir = dirRef.current;
  const travel = `${anim.travel}em`;
  const showFlashOverlay = mountedRef.current && anim.flash && flashDir !== null;

  return (
    <span
      className={cn(
        'anim-num',
        className,
        flashDir === 1 && 'is-flash-up',
        flashDir === -1 && 'is-flash-down'
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="anim-num-val"
          initial={{ y: dir > 0 ? travel : `-${travel}`, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: dir > 0 ? `-${travel}` : travel, opacity: 0 }}
          transition={{ duration: anim.dur, ease: anim.ease }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {showFlashOverlay && (
        <motion.span
          key={`flash-${value}`}
          className={dir > 0 ? 'num-flash num-flash--up' : 'num-flash num-flash--down'}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.5 / settings.speed, times: [0, 0.25, 1] }}
        />
      )}
    </span>
  );
}

/** Seconds the accent colour holds before easing back to white. */
const FLASH_HOLD_S = 0.55;
/** Seconds of the colour glide back to white (CSS transition). */
export const FLASH_FADE_S = 0.35;
