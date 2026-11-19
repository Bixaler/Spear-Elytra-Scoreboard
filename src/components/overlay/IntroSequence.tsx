import { motion } from 'framer-motion';
import type { PlayerConfig, Settings } from '../../types';
import { dur } from '../../utils/motion';
import { FlagChip } from './FlagChip';
import { PortraitFrame } from './PortraitFrame';

/**
 * Cinematic player introduction: both competitors slide in from opposite
 * sides, names reveal, then the VS emblem slams in. Auto-dismissed by the
 * Overlay root after ~3.4 s (scaled by the speed setting).
 */
export function IntroSequence({
  players,
  settings,
}: {
  players: [PlayerConfig, PlayerConfig];
  settings: Settings;
}) {
  const d = (s: number) => dur(s, settings);

  const plate = (dir: -1 | 1) => ({
    hidden: { opacity: 0, x: dir * 320, clipPath: 'inset(0 100% 0 0)' },
    show: {
      opacity: 1,
      x: 0,
      clipPath: 'inset(0 0% 0 0)',
      transition: { duration: d(0.55), ease: [0.22, 1, 0.36, 1] as const },
    },
    exit: { opacity: 0, transition: { duration: d(0.25) } },
  });

  const nameReveal = (delay: number) => ({
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { delay: d(delay), duration: d(0.35) } },
    exit: { opacity: 0, transition: { duration: d(0.2) } },
  });

  return (
    <motion.div className="intro" initial="hidden" animate="show" exit="exit">
      <motion.div
        className="intro-flash"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: [0, 0.45, 0], transition: { duration: d(0.5), times: [0, 0.2, 1] } },
          exit: { opacity: 0, transition: { duration: d(0.2) } },
        }}
        aria-hidden
      />

      <motion.div className="intro-plate intro-plate--left" variants={plate(-1)}>
        <PortraitFrame player={players[0]} />
        <div className="intro-meta">
          <motion.span className="intro-name" variants={nameReveal(0.35)}>
            {players[0].name}
          </motion.span>
          <motion.span variants={nameReveal(0.45)} className="intro-flag">
            <FlagChip player={players[0]} />
          </motion.span>
        </div>
        <span className="intro-seed">P1</span>
      </motion.div>

      <motion.div
        className="intro-vs"
        variants={{
          hidden: { opacity: 0, scale: 2.4, rotate: -8 },
          show: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: { delay: d(0.85), duration: d(0.32), ease: [0.22, 1, 0.36, 1] as const },
          },
          exit: { opacity: 0, transition: { duration: d(0.2) } },
        }}
      >
        <span>VS</span>
      </motion.div>

      {/* Mirrored twin of the left plate: name block first, portrait last —
          the pair reads as portrait · name · VS · name · portrait. */}
      <motion.div className="intro-plate intro-plate--right" variants={plate(1)}>
        <div className="intro-meta">
          <motion.span className="intro-name" variants={nameReveal(0.45)}>
            {players[1].name}
          </motion.span>
          <motion.span variants={nameReveal(0.55)} className="intro-flag">
            <FlagChip player={players[1]} />
          </motion.span>
        </div>
        <PortraitFrame player={players[1]} />
        <span className="intro-seed">P2</span>
      </motion.div>

      <motion.div
        className="intro-title"
        variants={{
          hidden: { opacity: 0, letterSpacing: '0.6em' },
          show: {
            opacity: 1,
            letterSpacing: '0.34em',
            transition: { delay: d(1.15), duration: d(0.45) },
          },
          exit: { opacity: 0, transition: { duration: d(0.2) } },
        }}
      >
        DUEL INCOMING
      </motion.div>
    </motion.div>
  );
}
