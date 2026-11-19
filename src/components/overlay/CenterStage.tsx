import { AnimatePresence, motion } from 'framer-motion';
import type { BreakTimerState, MatchTimerState, OverlayConfig, Settings } from '../../types';
import { breakRemainingMs, matchElapsedMs } from '../../state/store';
import { formatCountdown, formatMMSS } from '../../utils/format';
import { AssetImage } from '../common/AssetImage';
import { cn } from '../../utils/cn';

/**
 * Center of the board: tournament logo, VS emblem, match clock and the
 * break countdown module. The break module only exists in the layout while
 * a countdown is running / paused / just finished, so the idle board stays
 * compact.
 */

const TIMER_LABEL: Record<MatchTimerState['mode'], string> = {
  idle: 'READY',
  running: 'LIVE',
  paused: 'PAUSED',
  done: 'LIVE',
};

export function CenterStage({
  overlay,
  settings,
  timer,
  breakState,
  logoAssetId,
  now,
}: {
  overlay: OverlayConfig;
  settings: Settings;
  timer: MatchTimerState;
  breakState: BreakTimerState;
  logoAssetId: string | null;
  now: number;
}) {
  const elapsed = matchElapsedMs(timer, now);
  const remaining = breakRemainingMs(breakState, now);
  const showBreak = breakState.mode !== 'idle';
  const urgency = breakState.mode === 'running' && remaining <= settings.breakUrgencyMs;
  const critical = breakState.mode === 'running' && remaining <= 5000;

  return (
    <div className="center">
      {overlay.showLogo && logoAssetId && (
        <div className="center-logo">
          <AssetImage assetId={logoAssetId} alt="Tournament logo" />
        </div>
      )}

      <div className="vs-emblem" aria-hidden>
        <span>VS</span>
      </div>

      {overlay.showTimer && (
        <div className={cn('timer-plate', `timer-plate--${timer.mode}`)}>
          <div className="timer-status">
            <span className="timer-dot" aria-hidden />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={TIMER_LABEL[timer.mode]}
                className="timer-status-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
              >
                {TIMER_LABEL[timer.mode]}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="timer-time">{formatMMSS(elapsed)}</div>
          <div className="timer-label">MATCH TIME</div>
        </div>
      )}

      <AnimatePresence>
        {showBreak && (
          <motion.div
            key="break"
            className={cn(
              'break-mod',
              `break-mod--${breakState.mode}`,
              urgency && 'break-mod--urgent',
              critical && 'break-mod--critical'
            )}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="break-tag">
              {breakState.mode === 'done' ? 'BREAK OVER' : 'BREAK'}
            </span>
            <div className="break-time">{formatCountdown(remaining, settings.breakUrgencyMs)}</div>
            <div className="break-bar">
              <span
                className="break-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (remaining / Math.max(1, breakState.durationMs)) * 100))}%`,
                }}
              />
            </div>
            <div className="break-state">
              {breakState.mode === 'running'
                ? 'IN PROGRESS'
                : breakState.mode === 'paused'
                  ? 'PAUSED'
                  : 'COMPLETE'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
