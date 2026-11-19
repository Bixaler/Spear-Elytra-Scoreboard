import type { Command, PlayerIndex, ScoreboardState } from '../../types';
import { FlagChip } from './FlagChip';
import { PortraitFrame } from './PortraitFrame';
import { StatDuel, StatRounds, TotemSlot } from './StatModules';
import { cn } from '../../utils/cn';

/**
 * One competitor's broadcast panel. Player Two is mirrored for symmetry.
 *
 * Module order (swapped by operator request): ROUNDS WON is the big primary
 * plate, DUEL WINS is the compact counter beside the Totem slot.
 * A `roundVictory` command targeted at this player triggers the in-panel
 * ribbon + portrait ring animation.
 */
export function PlayerPanel({
  index,
  state,
  activeCommand,
}: {
  index: PlayerIndex;
  state: ScoreboardState;
  activeCommand: Command | null;
}) {
  const side = index === 0 ? 'left' : 'right';
  const player = state.players[index];
  const score = state.scores[index];
  const settings = state.settings;

  const roundWin =
    activeCommand?.type === 'roundVictory' && activeCommand.player === index;

  // Frameless portrait scale (1 = 100%).
  const scale = Math.min(1.5, Math.max(0.6, settings.portraitScale || 1));

  return (
    <div className={cn('pp', `pp--${side}`, roundWin && 'pp--roundwin')}>
      <div className="pp-frame">
        <div className="pp-inner">
          <div
            className="pp-portrait"
            style={{ width: Math.round(98 * scale), height: Math.round(118 * scale) }}
          >
            <PortraitFrame player={player} />
            {roundWin && <span className="pp-ring" aria-hidden />}
          </div>

          <div className="pp-body">
            <div className="pp-namebar">
              <span className="pp-name">{player.name}</span>
              <FlagChip player={player} />
            </div>

            <StatRounds score={score} settings={settings} />

            <div className="pp-subrow">
              <StatDuel score={score} settings={settings} />
              <TotemSlot
                score={score}
                settings={settings}
                iconAssetId={state.assets.totemIcon}
              />
            </div>
          </div>
        </div>
        <span className="pp-notch" aria-hidden />
      </div>

      <span className="pp-tag">{`P${index + 1}`}</span>

      {roundWin && (
        <div className="round-ribbon" key={activeCommand?.id}>
          <span className="round-ribbon-arrow" aria-hidden>
            <svg viewBox="0 0 8 8" width="7" height="7">
              <path d="M1 0 L5 4 L1 8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="round-ribbon-text">ROUND WON</span>
          <span className="round-ribbon-arrow round-ribbon-arrow--r" aria-hidden>
            <svg viewBox="0 0 8 8" width="7" height="7">
              <path d="M1 0 L5 4 L1 8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
