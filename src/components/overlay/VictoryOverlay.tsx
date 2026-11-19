import { motion } from 'framer-motion';
import type { Command, PlayerConfig, Settings } from '../../types';
import { dur } from '../../utils/motion';
import { PortraitFrame } from './PortraitFrame';
import { PixelBurst } from './PixelBurst';

/**
 * DUEL VICTORY — a full-width cinematic banner reserved for duel wins.
 * Distinct from the (much smaller) in-panel round victory ribbon.
 * Purely presentational; the Overlay root owns show/hide timing.
 */
export function VictoryOverlay({
  command,
  player,
  settings,
}: {
  command: Extract<Command, { type: 'duelVictory' }>;
  player: PlayerConfig;
  settings: Settings;
}) {
  return (
    <div className="victory">
      {/* Diagonal light sweep passing over the banner */}
      <motion.div
        className="victory-sweep"
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: dur(1.0, settings), ease: 'circOut', delay: dur(0.12, settings) }}
        aria-hidden
      />

      <motion.div
        className="victory-plate"
        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
        animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
        transition={{ duration: dur(0.5, settings), ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="victory-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: dur(0.6, settings), times: [0, 0.15, 1] }}
          aria-hidden
        />

        <div className="victory-portrait">
          <PortraitFrame player={player} />
        </div>

        <div className="victory-text">
          <motion.span
            className="victory-kicker"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dur(0.3, settings), duration: dur(0.3, settings) }}
          >
            DUEL VICTORY
          </motion.span>
          <motion.span
            className="victory-name"
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: dur(0.42, settings), duration: dur(0.4, settings) }}
          >
            {player.name}
          </motion.span>
        </div>

        {settings.intensity !== 'minimal' && (
          <PixelBurst burstKey={command.id} scale={1.7} className="victory-burst" />
        )}
      </motion.div>
    </div>
  );
}
