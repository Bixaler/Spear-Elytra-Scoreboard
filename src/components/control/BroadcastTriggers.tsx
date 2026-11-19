import { Medal, RotateCcw, Sparkles, Swords } from 'lucide-react';
import type { PlayerIndex } from '../../types';
import { useStore } from '../../state/store';
import { Btn } from '../ui/kit';

/**
 * BROADCAST TRIGGERS — one-shot commands to the overlay: player
 * introduction, per-player duel / round victory cinematics and the
 * animation reset. Shared by the Overlay tab AND the Match tab so the
 * operator never has to leave the score surface mid-match.
 */
export function BroadcastTriggers() {
  const { state, sendCommand } = useStore();

  return (
    <>
      <Btn
        variant="primary"
        icon={<Sparkles size={14} />}
        onClick={() => sendCommand({ type: 'intro' })}
        className="trigger-intro"
      >
        Player introduction
      </Btn>
      {[0, 1].map((i) => (
        <VictoryTrigger key={i} index={i as PlayerIndex} />
      ))}
      <div className="overlay-link-row">
        <Btn
          size="sm"
          variant="ghost"
          icon={<RotateCcw size={13} />}
          onClick={() => sendCommand({ type: 'resetAnims' })}
        >
          Reset animations
        </Btn>
      </div>
    </>
  );
}

function VictoryTrigger({ index }: { index: PlayerIndex }) {
  const { state, sendCommand } = useStore();
  const player = state.players[index];
  return (
    <div className="trigger-pair">
      <span className="trigger-name">{player.name || `P${index + 1}`}</span>
      <div className="trigger-btns">
        <Btn
          size="sm"
          variant="primary"
          icon={<Swords size={13} />}
          onClick={() => sendCommand({ type: 'duelVictory', player: index })}
        >
          Duel victory
        </Btn>
        <Btn
          size="sm"
          icon={<Medal size={13} />}
          onClick={() => sendCommand({ type: 'roundVictory', player: index })}
        >
          Round victory
        </Btn>
      </div>
    </div>
  );
}
