import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { AnchorId, Command, EntranceStyle } from '../../types';
import { useStore, breakRemainingMs } from '../../state/store';
import { useNow } from '../../hooks/useNow';
import { playBreakChime, playUrgencyTick } from '../../utils/sound';
import { BROADCAST_DURATION_S, dur } from '../../utils/motion';
import { AssetImage } from '../common/AssetImage';
import { CenterStage } from './CenterStage';
import { IntroSequence } from './IntroSequence';
import { PlayerPanel } from './PlayerPanel';
import { VictoryOverlay } from './VictoryOverlay';
import { cn } from '../../utils/cn';

/**
 * OBS broadcast overlay root.
 *  - Transparent full-viewport stage, pointer-events disabled.
 *  - Anchor + offset + scale positioning tuned for 1920x1080 canvases.
 *  - Executes one-shot commands (intro / victory) pushed from the control
 *    panel; auto-dismisses them after their broadcast duration.
 *  - Detects countdown completion independently (works even when the
 *    control panel is closed) and plays the break chime / urgency ticks.
 */

/** Entrance variants per style; slide direction follows the anchor. */
function entranceVariants(style: EntranceStyle, anchor: AnchorId): Variants {
  const dirX = anchor.endsWith('left') ? -1 : anchor.endsWith('right') ? 1 : 0;
  const dirY = anchor.startsWith('top') ? -1 : 1;

  switch (style) {
    case 'slide':
      return {
        hidden: { opacity: 0, x: dirX * 64, y: dirY * 56 },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, x: dirX * 40, y: dirY * 40, transition: { duration: 0.3 } },
      };
    case 'rise':
      return {
        hidden: { opacity: 0, y: 72, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, y: 44, transition: { duration: 0.3 } },
      };
    case 'glitch':
      // CSS class `ent-glitch` adds the clip-path jitter on top.
      return {
        hidden: { opacity: 0, scale: 1.03 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.28 } },
        exit: { opacity: 0, transition: { duration: 0.16 } },
      };
    case 'fade':
    default:
      return {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.45 } },
        exit: { opacity: 0, transition: { duration: 0.28 } },
      };
  }
}

function transformOriginFor(anchor: AnchorId): string {
  const y = anchor.startsWith('top') ? 'top' : 'bottom';
  const x = anchor.endsWith('left') ? 'left' : anchor.endsWith('right') ? 'right' : 'center';
  return `${x} ${y}`;
}

/** How long each command stays on screen — shared with the store's flow resets. */
const COMMAND_DURATION_S = BROADCAST_DURATION_S;

export function Overlay() {
  const { state, completeBreak, resetBreak } = useStore();
  const { overlay, settings, timer, break: breakState, command, players, scores, assets } = state;

  const timerActive = timer.mode === 'running' || breakState.mode === 'running';
  const now = useNow(timerActive);

  // --- Countdown completion detection (epoch based, background-safe) ------
  useEffect(() => {
    if (breakState.mode === 'running' && breakState.endsAtEpoch !== null) {
      if (Date.now() >= breakState.endsAtEpoch) {
        completeBreak();
      }
    }
  });

  // --- Sound: chime on completion, ticks during the final seconds ----------
  const prevBreakModeRef = useRef(breakState.mode);
  useEffect(() => {
    if (prevBreakModeRef.current === 'running' && breakState.mode === 'done' && settings.soundEnabled) {
      playBreakChime();
    }
    prevBreakModeRef.current = breakState.mode;
  }, [breakState.mode, settings.soundEnabled]);

  const remaining = breakRemainingMs(breakState, now);
  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (breakState.mode !== 'running' || !settings.soundEnabled) return;
    const sec = Math.ceil(remaining / 1000);
    if (remaining > 0 && remaining <= 5000 && lastTickRef.current !== sec) {
      lastTickRef.current = sec;
      playUrgencyTick();
    }
  }, [remaining, breakState.mode, settings.soundEnabled]);

  // --- Auto-hide the break module a few seconds after completion -----------
  useEffect(() => {
    if (breakState.mode !== 'done' || !settings.autoHideBreak) return;
    const t = window.setTimeout(() => {
      resetBreak();
    }, 8000);
    return () => window.clearTimeout(t);
  }, [breakState.mode, settings.autoHideBreak, resetBreak]);

  // --- Command execution ----------------------------------------------------
  const [activeCmd, setActiveCmd] = useState<Command | null>(null);
  useEffect(() => {
    if (!command) return;
    if (Date.now() - command.at > 8000) return; // stale command — ignore
    if (command.type === 'resetAnims') {
      setActiveCmd(null);
      return;
    }
    setActiveCmd(command);
  }, [command]);

  useEffect(() => {
    if (!activeCmd || activeCmd.type === 'resetAnims') return;
    const ms = ((COMMAND_DURATION_S[activeCmd.type] + 0.4) / settings.speed) * 1000;
    const t = window.setTimeout(() => setActiveCmd(null), ms);
    return () => window.clearTimeout(t);
  }, [activeCmd, settings.speed]);

  // --- Positioning ----------------------------------------------------------
  const variants = entranceVariants(overlay.entrance, overlay.anchor);

  return (
    <div className={cn('ov-stage', `ov-stage--${overlay.anchor}`)}>
      <AnimatePresence>
        {overlay.visible && (
          <motion.div
            key={overlay.animEpoch}
            className={cn(
              'ov-board-wrap',
              overlay.entrance === 'glitch' && 'ent-glitch'
            )}
            variants={variants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div
              className="ov-board"
              style={{
                transform: `translate(${overlay.offsetX}px, ${overlay.offsetY}px) scale(${overlay.scale})`,
                transformOrigin: transformOriginFor(overlay.anchor),
              }}
            >
              {assets.background && (
                <AssetImage assetId={assets.background} className="ov-bg" alt="" />
              )}

              <PlayerPanel index={0} state={state} activeCommand={activeCmd} />
              <CenterStage
                overlay={overlay}
                settings={settings}
                timer={timer}
                breakState={breakState}
                logoAssetId={assets.tournamentLogo}
                now={now}
              />
              <PlayerPanel index={1} state={state} activeCommand={activeCmd} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic one-shot sequences (rendered above the board) */}
      <AnimatePresence>
        {activeCmd?.type === 'duelVictory' && (
          <VictoryOverlay
            key={activeCmd.id}
            command={activeCmd}
            player={players[activeCmd.player]}
            settings={settings}
          />
        )}
        {activeCmd?.type === 'intro' && (
          <IntroSequence key={activeCmd.id} players={players} settings={settings} />
        )}
      </AnimatePresence>
    </div>
  );
}
