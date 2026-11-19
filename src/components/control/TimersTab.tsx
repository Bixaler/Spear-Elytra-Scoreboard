import { useState } from 'react';
import { Hourglass, Pause, Play, RotateCcw, Timer, Volume2 } from 'lucide-react';
import { breakRemainingMs, matchElapsedMs, useStore } from '../../state/store';
import { useNow } from '../../hooks/useNow';
import { formatCountdown, formatMMSS, parseDurationInput } from '../../utils/format';
import { playBreakChime } from '../../utils/sound';
import { Btn, Field, Panel, Tag, Toggle } from '../ui/kit';
import { useConfirm } from '../ui/Modal';

/**
 * TIME SYSTEMS — the count-up match timer and the break countdown are two
 * completely independent clocks with their own state and controls.
 *
 * Both panels are exported so the Match tab can surface them alongside the
 * score steppers (operator request) while the Timers tab keeps them too.
 */

export function MatchTimerPanel() {
  const { state, startMatchTimer, pauseMatchTimer, resumeMatchTimer, resetMatchTimer } = useStore();
  const confirm = useConfirm();
  const now = useNow(state.timer.mode === 'running');
  const elapsed = matchElapsedMs(state.timer, now);
  const mode = state.timer.mode;

  const primary =
    mode === 'running' ? (
      <Btn variant="primary" icon={<Pause size={15} />} onClick={pauseMatchTimer}>
        Pause
      </Btn>
    ) : mode === 'paused' ? (
      <Btn variant="primary" icon={<Play size={15} />} onClick={resumeMatchTimer}>
        Resume
      </Btn>
    ) : (
      <Btn variant="primary" icon={<Play size={15} />} onClick={startMatchTimer}>
        Start
      </Btn>
    );

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset match timer?',
      message: 'The elapsed match time will be cleared back to 00:00. This cannot be undone.',
      confirmLabel: 'Reset timer',
      danger: true,
    });
    if (ok) resetMatchTimer();
  };

  return (
    <Panel
      title="Match timer"
      icon={<Timer size={15} />}
      actions={<Tag tone={mode === 'running' ? 'accent' : 'muted'}>{mode.toUpperCase()}</Tag>}
    >
      <div className={`timer-display timer-display--${mode}`}>{formatMMSS(elapsed)}</div>
      <div className="timer-actions">
        {primary}
        <Btn variant="ghost" icon={<RotateCcw size={14} />} onClick={() => void reset()}>
          Reset
        </Btn>
      </div>
      <p className="panel-note">
        Epoch-based clock — accurate even when this tab is in the background, and restored
        correctly after a refresh while running.
      </p>
    </Panel>
  );
}

const BREAK_PRESETS = [3 * 60_000, 5 * 60_000, 10 * 60_000, 15 * 60_000];

export function BreakPanel() {
  const { state, setBreakDuration, startBreak, pauseBreak, resumeBreak, resetBreak, setSettings } =
    useStore();
  const confirm = useConfirm();
  const now = useNow(state.break.mode === 'running');
  const remaining = breakRemainingMs(state.break, now);
  const mode = state.break.mode;

  const totalMin = Math.floor(state.break.durationMs / 60_000);
  const totalSec = Math.floor((state.break.durationMs % 60_000) / 1000);
  const [customMin, setCustomMin] = useState(totalMin);
  const [customSec, setCustomSec] = useState(totalSec);

  const applyCustom = () => {
    setBreakDuration(parseDurationInput(customMin, customSec));
  };

  const primary =
    mode === 'running' ? (
      <Btn variant="primary" icon={<Pause size={15} />} onClick={pauseBreak}>
        Pause
      </Btn>
    ) : mode === 'paused' ? (
      <Btn variant="primary" icon={<Play size={15} />} onClick={resumeBreak}>
        Resume
      </Btn>
    ) : (
      <Btn variant="primary" icon={<Play size={15} />} onClick={startBreak}>
        Start
      </Btn>
    );

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset break countdown?',
      message: 'The countdown returns to its full configured duration.',
      confirmLabel: 'Reset break',
      danger: true,
    });
    if (ok) resetBreak();
  };

  return (
    <Panel
      title="Break countdown"
      icon={<Hourglass size={15} />}
      actions={<Tag tone={mode === 'running' ? 'accent' : mode === 'done' ? 'violet' : 'muted'}>{mode.toUpperCase()}</Tag>}
    >
      <Field label="Duration" hint="pick a preset or set a custom length">
        <div className="break-presets">
          {BREAK_PRESETS.map((ms) => (
            <Btn
              key={ms}
              size="sm"
              variant={state.break.durationMs === ms && mode === 'idle' ? 'primary' : 'default'}
              onClick={() => setBreakDuration(ms)}
            >
              {formatMMSS(ms)}
            </Btn>
          ))}
        </div>
        <div className="break-custom">
          <label>
            min
            <input
              type="number"
              min={0}
              max={360}
              value={customMin}
              onChange={(e) => setCustomMin(Math.max(0, Math.min(360, Number(e.target.value) || 0)))}
            />
          </label>
          <label>
            sec
            <input
              type="number"
              min={0}
              max={59}
              value={customSec}
              onChange={(e) => setCustomSec(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
            />
          </label>
          <Btn size="sm" onClick={applyCustom}>
            Apply
          </Btn>
        </div>
      </Field>

      <div
        className={`timer-display timer-display--${mode} ${
          mode === 'running' && remaining <= state.settings.breakUrgencyMs ? 'timer-display--urgent' : ''
        }`}
      >
        {formatCountdown(remaining, state.settings.breakUrgencyMs)}
      </div>

      <div className="timer-actions">
        {primary}
        <Btn variant="ghost" icon={<RotateCcw size={14} />} onClick={() => void reset()}>
          Reset
        </Btn>
      </div>

      <Toggle
        checked={state.settings.soundEnabled}
        onChange={(v) => setSettings({ soundEnabled: v })}
        label="Completion chime"
        hint="plays in the overlay when the countdown reaches zero"
      />
      <div className="timer-actions" style={{ marginTop: 8 }}>
        <Btn size="sm" variant="ghost" icon={<Volume2 size={13} />} onClick={() => playBreakChime()}>
          Test sound
        </Btn>
      </div>
    </Panel>
  );
}

export function TimersTab() {
  return (
    <div className="tab-body">
      <div className="timer-grid">
        <MatchTimerPanel />
        <BreakPanel />
      </div>
    </div>
  );
}
