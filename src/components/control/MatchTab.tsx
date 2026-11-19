import { Fragment } from 'react';
import { FlipHorizontal2, FlipVertical2, Hourglass, ListChecks, RotateCcw, Swords, Users } from 'lucide-react';
import type { PlayerIndex, ScoreKey } from '../../types';
import { DUEL_TARGETS, SCORE_META } from '../../types';
import { matchElapsedMs } from '../../state/store';
import { useStore } from '../../state/store';
import { useNow } from '../../hooks/useNow';
import { formatMMSS } from '../../utils/format';
import { AssetImage } from '../common/AssetImage';
import { BreakPanel, MatchTimerPanel } from './TimersTab';
import { BroadcastTriggers } from './BroadcastTriggers';
import { Btn, Field, Panel, Segmented, Tag, Toggle } from '../ui/kit';
import { Stepper } from '../ui/Stepper';
import { useConfirm } from '../ui/Modal';
import { cn } from '../../utils/cn';

/**
 * SCORE MANAGEMENT — two fully independent player columns.
 *
 * VICTORY LINKING (BO5): the steppers stay the single source of truth for
 * each statistic, but when "auto victory FX" is enabled an INCREASE also
 * fires the matching broadcast animation:
 *   + Rounds Won            -> in-panel round-victory ribbon
 *   + Rounds Won == target  -> cinematic duel victory + Duel Wins +1
 *   + Duel Wins             -> cinematic duel victory
 *   Totems never trigger anything.
 *
 * MATCH FLOW AUTOMATIONS (see store sendCommand):
 *   Round-win flow  -> count-up resets to 00:00, Totems return to 2 after
 *                      the ribbon cooldown (fresh round)
 *   Duel-win flow   -> break countdown starts, Rounds Won reset to 0 after
 *                      the cinematic (next duel)
 *
 * The time systems and broadcast triggers are mirrored here so the whole
 * match can be run from this single tab.
 */

/** Pixel-block progress toward the duel target (Minecraft inventory feel). */
function DuelProgress({
  value,
  target,
  accent,
}: {
  value: number;
  target: number;
  accent: 'left' | 'right';
}) {
  const filled = Math.min(Math.max(0, value), target);
  const clinched = filled >= target;
  return (
    <div className={cn('duel-progress', `duel-progress--${accent}`, clinched && 'is-clinched')}>
      <span className="duel-progress-tag">BO{target}</span>
      <span className="duel-progress-blocks" aria-hidden>
        {Array.from({ length: target }, (_, i) => (
          <i key={i} className={cn('dp-block', i < filled && 'is-filled')} />
        ))}
      </span>
      <span className="duel-progress-count">
        {filled}/{target}
      </span>
    </div>
  );
}

function PlayerScoreCard({
  index,
  onScoreChange,
}: {
  index: PlayerIndex;
  onScoreChange: (index: PlayerIndex, key: ScoreKey, next: number) => void;
}) {
  const { state, setPlayerConfig, resetPlayerScores } = useStore();
  const confirm = useConfirm();
  const player = state.players[index];
  const score = state.scores[index];
  const target = state.settings.duelTarget;

  const reset = async () => {
    const ok = await confirm({
      title: `Reset ${player.name}?`,
      message: `All Duel Wins, Rounds Won and Totem counts for ${player.name} will be set to 0. This cannot be undone.`,
      confirmLabel: 'Reset player',
      danger: true,
    });
    if (ok) resetPlayerScores(index);
  };

  const flip = (patch: { flipX?: boolean; flipY?: boolean }) => setPlayerConfig(index, patch);
  const flipped = player.flipX || player.flipY;

  const rows: ScoreKey[] = ['roundsWon', 'duelWins', 'totems'];

  return (
    <Panel
      className="score-card"
      title={player.name || `Player ${index + 1}`}
      icon={<AssetImage assetId={player.portraitAssetId} className="score-card-avatar" />}
      actions={
        <>
          <Btn
            size="sm"
            variant="ghost"
            className={cn('icon-btn', player.flipX && 'is-active')}
            title="Flip portrait horizontally"
            aria-label="Flip portrait horizontally"
            aria-pressed={player.flipX}
            onClick={() => flip({ flipX: !player.flipX })}
          >
            <FlipHorizontal2 size={13} />
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            className={cn('icon-btn', player.flipY && 'is-active')}
            title="Flip portrait vertically"
            aria-label="Flip portrait vertically"
            aria-pressed={player.flipY}
            onClick={() => flip({ flipY: !player.flipY })}
          >
            <FlipVertical2 size={13} />
          </Btn>
          {flipped && (
            <Btn
              size="sm"
              variant="ghost"
              className="icon-btn"
              title="Reset portrait orientation"
              aria-label="Reset portrait orientation"
              onClick={() => flip({ flipX: false, flipY: false })}
            >
              <RotateCcw size={13} />
            </Btn>
          )}
          <Btn size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => void reset()}>
            Reset player
          </Btn>
        </>
      }
    >
      <div className="score-rows">
        {rows.map((key) => {
          const meta = SCORE_META[key];
          return (
            <Fragment key={key}>
              <Field
                label={meta.label}
                hint={
                  key === 'totems'
                    ? 'consumable · back to 2 each round'
                    : key === 'roundsWon'
                      ? `BO${target} · the big number on the board`
                      : undefined
                }
                inline
              >
                <Stepper
                  value={score[key]}
                  min={meta.min}
                  max={meta.max}
                  accent={key === 'roundsWon' ? 'violet' : key === 'totems' ? 'accent' : 'neutral'}
                  onSetValue={(v) => onScoreChange(index, key, v)}
                />
              </Field>
              {key === 'roundsWon' && target > 0 && (
                <DuelProgress value={score.roundsWon} target={target} accent={index === 0 ? 'left' : 'right'} />
              )}
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

/** Match rules: duel format + victory FX linking + round / duel flow automation. */
function MatchRules() {
  const { state, setSettings } = useStore();
  const s = state.settings;

  return (
    <Panel title="Match rules" icon={<ListChecks size={15} />}>
      <div className="rules-grid">
        <Field label="Duel format" hint={`${s.duelTarget} round${s.duelTarget === 1 ? '' : 's'} wins the duel`}>
          <Segmented
            value={String(s.duelTarget)}
            onChange={(v) => setSettings({ duelTarget: Number(v) })}
            options={DUEL_TARGETS.map((t) => ({ value: String(t), label: `BO${t}` }))}
          />
        </Field>
        <Field label="Victory linking">
          <Toggle
            checked={s.autoVictoryFx}
            onChange={(v) => setSettings({ autoVictoryFx: v })}
            label={s.autoVictoryFx ? 'Linked to steppers' : 'Manual only'}
            hint="stepping scores plays the matching broadcast animation"
          />
        </Field>
      </div>
      <div className="rules-grid rules-grid--stack">
        <Field label="Round-win flow">
          <Toggle
            checked={s.autoRoundFlow}
            onChange={(v) => setSettings({ autoRoundFlow: v })}
            label={s.autoRoundFlow ? 'Count-up resets · Totems back to 2' : 'Off'}
            hint="on every round win the clock resets, then totems return to 2 after the ribbon"
          />
        </Field>
        <Field label="Duel-win flow">
          <Toggle
            checked={s.autoDuelFlow}
            onChange={(v) => setSettings({ autoDuelFlow: v })}
            label={s.autoDuelFlow ? 'Break countdown starts · Rounds reset' : 'Off'}
            hint="on every duel win the countdown runs, rounds reset to 0 after the cinematic"
          />
        </Field>
      </div>
      <p className="panel-note">
        <Swords size={12} /> With linking on: <b>+ Round</b> fires the round-won ribbon — reaching{' '}
        <b>BO{s.duelTarget}</b> credits the Duel Win automatically and plays the duel-victory cinematic —{' '}
        <b>+ Duel</b> plays the cinematic. Totems never trigger effects.
      </p>
    </Panel>
  );
}

/** Live summary strip mirroring every statistic on the board. */
function SummaryStrip() {
  const { state } = useStore();
  const now = useNow(state.timer.mode === 'running');
  const [p1, p2] = state.scores;
  const cell = (v: number) => <b>{v}</b>;

  return (
    <div className="summary-strip">
      <div className="summary-side">
        <Users size={13} />
        <span>{state.players[0].name || 'P1'}</span>
        <Tag>R{cell(p1.roundsWon)}</Tag>
        <Tag tone="muted">D{cell(p1.duelWins)}</Tag>
        <Tag tone="accent">T{cell(p1.totems)}</Tag>
      </div>
      <div className="summary-clock">{formatMMSS(matchElapsedMs(state.timer, now))}</div>
      <div className="summary-side summary-side--right">
        <Tag>R{cell(p2.roundsWon)}</Tag>
        <Tag tone="muted">D{cell(p2.duelWins)}</Tag>
        <Tag tone="accent">T{cell(p2.totems)}</Tag>
        <span>{state.players[1].name || 'P2'}</span>
        <Users size={13} />
      </div>
    </div>
  );
}

export function MatchTab() {
  const { state, setScoreValue, sendCommand, resetMatch } = useStore();
  const confirm = useConfirm();

  /**
   * Single entry point for every Match-panel stepper. Persists the value
   * first, then (when linking is enabled) fires the matching broadcast FX
   * for INCREASES only. Each statistic is still stored independently — the
   * BO5 credit is an explicit operator-facing rule, not hidden coupling.
   * Timer / totem / round side-effects ride on the command itself (store).
   */
  const handleScoreChange = (index: PlayerIndex, key: ScoreKey, next: number) => {
    const prev = state.scores[index][key];
    setScoreValue(index, key, next);
    if (!state.settings.autoVictoryFx || next <= prev) return;

    if (key === 'duelWins') {
      // Operator credits a duel directly -> play the cinematic.
      sendCommand({ type: 'duelVictory', player: index });
    } else if (key === 'roundsWon') {
      const target = state.settings.duelTarget;
      const clincher = prev < target && next >= target;
      if (clincher) {
        // BO5: the duel is decided. Credit the Duel Win + cinematic.
        setScoreValue(index, 'duelWins', state.scores[index].duelWins + 1);
        sendCommand({ type: 'duelVictory', player: index });
      } else {
        sendCommand({ type: 'roundVictory', player: index });
      }
    }
    // totems: consumable counter — never triggers broadcast FX.
  };

  const resetAll = async () => {
    const ok = await confirm({
      title: 'Reset the entire match?',
      message:
        'All statistics for both players will be set to 0 and both timers will be stopped and cleared. Player names and images are kept.',
      confirmLabel: 'Reset match',
      danger: true,
    });
    if (ok) resetMatch();
  };

  return (
    <div className="tab-body">
      <SummaryStrip />
      <div className="score-grid">
        <PlayerScoreCard index={0} onScoreChange={handleScoreChange} />
        <PlayerScoreCard index={1} onScoreChange={handleScoreChange} />
      </div>

      <div className="timer-grid match-timer-grid">
        <MatchTimerPanel />
        <BreakPanel />
      </div>

      <Panel title="Broadcast triggers" icon={<Swords size={15} />}>
        <BroadcastTriggers />
      </Panel>

      <MatchRules />

      <Panel title="Danger zone" icon={<Hourglass size={15} />} tone="danger">
        <p className="danger-note">
          Resets all six statistics and stops both timers. Player identities and uploaded images
          are preserved.
        </p>
        <Btn variant="danger" icon={<RotateCcw size={14} />} onClick={() => void resetAll()}>
          Reset entire match
        </Btn>
      </Panel>
    </div>
  );
}
