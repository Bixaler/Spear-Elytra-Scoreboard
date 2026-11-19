/**
 * Central scoreboard store.
 *
 * Responsibilities:
 *  - Single source of truth for players, the three INDEPENDENT statistics,
 *    timers, overlay config, settings, asset slots and asset meta.
 *  - Match-flow automations: round win resets the count-up and restores the
 *    Totems to 2 (after the ribbon); duel win starts the break countdown and
 *    clears Rounds Won (after the cinematic).
 *  - Persistence (LocalStorage) and cross-context sync (BroadcastChannel /
 *    storage events) with last-write-wins via a monotonic `rev` counter.
 *  - Pure action functions so a future shared real-time provider can be
 *    dropped in without touching components.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AssetKind,
  AssetMeta,
  AssetSlotId,
  BreakTimerState,
  Command,
  MatchTimerState,
  PlayerIndex,
  ScoreKey,
  ScoreboardState,
} from '../types';
import { SCORE_META } from '../types';
import { clamp, sessionId, uid } from '../utils/id';
import { createSyncChannel, type SyncChannel } from './sync';
import { loadState, saveState } from './persist';
import { deleteImage, putImage } from './imageStore';
import { BROADCAST_DURATION_S, FLOW_GRACE_S } from '../utils/motion';

export interface StoreApi {
  state: ScoreboardState;
  /** Apply a partial update; every write bumps `rev` and broadcasts. */
  update: (patch: Partial<ScoreboardState>) => void;
  /** Functional variant for updates that depend on current state. */
  updateFn: (fn: (state: ScoreboardState) => Partial<ScoreboardState>) => void;

  // --- Player config -------------------------------------------------------
  setPlayerConfig: (index: PlayerIndex, patch: Partial<ScoreboardState['players'][PlayerIndex]>) => void;

  // --- Independent statistics ---------------------------------------------
  adjustScore: (index: PlayerIndex, key: ScoreKey, delta: number) => void;
  setScoreValue: (index: PlayerIndex, key: ScoreKey, value: number) => void;
  resetPlayerScores: (index: PlayerIndex) => void;
  /** Reset all statistics for both players (timers untouched). */
  resetMatchScores: () => void;
  /** Full match reset: statistics + both timers + transient commands. */
  resetMatch: () => void;

  // --- Timers --------------------------------------------------------------
  startMatchTimer: () => void;
  pauseMatchTimer: () => void;
  resumeMatchTimer: () => void;
  resetMatchTimer: () => void;
  setBreakDuration: (ms: number) => void;
  startBreak: () => void;
  pauseBreak: () => void;
  resumeBreak: () => void;
  resetBreak: () => void;
  /** Internally used when the countdown hits zero. */
  completeBreak: () => void;

  // --- Overlay / settings --------------------------------------------------
  setOverlay: (patch: Partial<ScoreboardState['overlay']>) => void;
  setSettings: (patch: Partial<ScoreboardState['settings']>) => void;
  replayEntrance: () => void;

  // --- Commands ------------------------------------------------------------
  sendCommand: (command: CommandInput) => void;

  // --- Assets --------------------------------------------------------------
  /**
   * Upload an image file into IndexedDB, register its metadata and (optionally)
   * assign it to a fixed slot. Resolves with the new asset id.
   */
  importAsset: (
    file: File,
    kind: AssetKind,
    opts?: { slot?: AssetSlotId; name?: string }
  ) => Promise<string>;
  removeAsset: (assetId: string) => Promise<void>;
  setSlotAsset: (slot: AssetSlotId, assetId: string | null) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

/** Omit that distributes across the Command union. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type CommandInput = DistributiveOmit<Command, 'id' | 'at'>;

export function useStore(): StoreApi {
  const api = useContext(StoreContext);
  if (!api) throw new Error('useStore must be used inside <StoreProvider>');
  return api;
}

// ---------------------------------------------------------------------------
// Derived time helpers (epoch based — accurate regardless of frame rate)
// ---------------------------------------------------------------------------

export function matchElapsedMs(timer: MatchTimerState, now: number): number {
  if (timer.mode === 'running' && timer.sinceEpoch !== null) {
    return timer.accumulatedMs + Math.max(0, now - timer.sinceEpoch);
  }
  if (timer.mode === 'paused') return timer.accumulatedMs;
  return 0;
}

export function breakRemainingMs(breakState: BreakTimerState, now: number): number {
  if (breakState.mode === 'running' && breakState.endsAtEpoch !== null) {
    return Math.max(0, breakState.endsAtEpoch - now);
  }
  if (breakState.mode === 'paused') return breakState.remainingMs;
  if (breakState.mode === 'done') return 0;
  return breakState.durationMs;
}

// ---------------------------------------------------------------------------

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScoreboardState>(() => loadState());
  const sessionRef = useRef(sessionId());
  const syncRef = useRef<SyncChannel | null>(null);
  /** rev of the last state this context pushed out — avoids echo loops. */
  const lastPushedRevRef = useRef(state.rev);

  // --- Persistence ---------------------------------------------------------
  useEffect(() => {
    saveState(state);
  }, [state]);

  // --- Sync subscribe ------------------------------------------------------
  useEffect(() => {
    const channel = createSyncChannel();
    syncRef.current = channel;
    const unsubscribe = channel.subscribe((message) => {
      if (message.origin === sessionRef.current) return; // our own echo
      setState((prev) => {
        // Last write wins: only accept strictly newer revisions.
        if (message.state.rev <= prev.rev) return prev;
        lastPushedRevRef.current = message.state.rev;
        return { ...message.state, origin: sessionRef.current };
      });
    });
    return () => {
      unsubscribe();
      syncRef.current = null;
    };
  }, []);

  // --- Sync publish --------------------------------------------------------
  useEffect(() => {
    if (state.rev === lastPushedRevRef.current) return;
    lastPushedRevRef.current = state.rev;
    syncRef.current?.post({ type: 'state', origin: sessionRef.current, state });
  }, [state]);

  // --- Core update helpers -------------------------------------------------
  const update = useCallback((patch: Partial<ScoreboardState>) => {
    setState((prev) => ({ ...prev, ...patch, rev: prev.rev + 1, origin: sessionRef.current }));
  }, []);

  const updateFn = useCallback((fn: (state: ScoreboardState) => Partial<ScoreboardState>) => {
    setState((prev) => ({ ...prev, ...fn(prev), rev: prev.rev + 1, origin: sessionRef.current }));
  }, []);

  // --- Player config -------------------------------------------------------
  const setPlayerConfig = useCallback<StoreApi['setPlayerConfig']>(
    (index, patch) => {
      updateFn((prev) => {
        const players = [...prev.players] as ScoreboardState['players'];
        players[index] = { ...players[index], ...patch };
        return { players };
      });
    },
    [updateFn]
  );

  // --- Independent statistics ----------------------------------------------
  // Each score key is mutated in complete isolation; no action touches more
  // than one key, and no derived coupling exists anywhere in the app.
  const setScoreValue = useCallback<StoreApi['setScoreValue']>(
    (index, key, value) => {
      const { min, max } = SCORE_META[key];
      updateFn((prev) => {
        const scores = [...prev.scores] as ScoreboardState['scores'];
        scores[index] = { ...scores[index], [key]: clamp(Math.round(value), min, max) };
        return { scores };
      });
    },
    [updateFn]
  );

  const adjustScore = useCallback<StoreApi['adjustScore']>(
    (index, key, delta) => {
      setScoreValue(index, key, state.scores[index][key] + delta);
    },
    [setScoreValue, state.scores]
  );

  const resetPlayerScores = useCallback<StoreApi['resetPlayerScores']>(
    (index) => {
      updateFn((prev) => {
        const scores = [...prev.scores] as ScoreboardState['scores'];
        scores[index] = { duelWins: 0, roundsWon: 0, totems: 0 };
        return { scores };
      });
    },
    [updateFn]
  );

  const resetMatchScores = useCallback(() => {
    update({
      scores: [
        { duelWins: 0, roundsWon: 0, totems: 0 },
        { duelWins: 0, roundsWon: 0, totems: 0 },
      ],
    });
  }, [update]);

  // --- Match-flow timers (delayed resets land after the broadcast FX) ------

  /** Pending delayed flow resets (totems / rounds land after the broadcast FX). */
  const flowTimersRef = useRef<number[]>([]);
  const clearFlowTimers = useCallback(() => {
    flowTimersRef.current.forEach((t) => window.clearTimeout(t));
    flowTimersRef.current = [];
  }, []);

  // Never leave stray timers behind when the provider unmounts.
  useEffect(() => clearFlowTimers, [clearFlowTimers]);

  const scheduleFlow = useCallback((delayMs: number, run: () => void) => {
    const t = window.setTimeout(() => {
      flowTimersRef.current = flowTimersRef.current.filter((id) => id !== t);
      run();
    }, Math.max(0, delayMs));
    flowTimersRef.current.push(t);
  }, []);

  const resetMatch = useCallback(() => {
    // Cancel any pending round/duel flow resets — a manual full reset wins.
    clearFlowTimers();
    update({
      scores: [
        { duelWins: 0, roundsWon: 0, totems: 0 },
        { duelWins: 0, roundsWon: 0, totems: 0 },
      ],
      timer: { mode: 'idle', accumulatedMs: 0, sinceEpoch: null },
      break: {
        mode: 'idle',
        durationMs: state.break.durationMs,
        remainingMs: state.break.durationMs,
        endsAtEpoch: null,
      },
      command: null,
    });
  }, [update, state.break.durationMs]);

  // --- Match count-up timer ------------------------------------------------
  const startMatchTimer = useCallback(() => {
    update({
      timer: { mode: 'running', accumulatedMs: 0, sinceEpoch: Date.now() },
    });
  }, [update]);

  const pauseMatchTimer = useCallback(() => {
    updateFn((prev) => {
      if (prev.timer.mode !== 'running' || prev.timer.sinceEpoch === null) return {};
      return {
        timer: {
          mode: 'paused',
          accumulatedMs: prev.timer.accumulatedMs + Math.max(0, Date.now() - prev.timer.sinceEpoch),
          sinceEpoch: null,
        },
      };
    });
  }, [updateFn]);

  const resumeMatchTimer = useCallback(() => {
    update({ timer: { mode: 'running', accumulatedMs: state.timer.accumulatedMs, sinceEpoch: Date.now() } });
  }, [update, state.timer.accumulatedMs]);

  const resetMatchTimer = useCallback(() => {
    update({ timer: { mode: 'idle', accumulatedMs: 0, sinceEpoch: null } });
  }, [update]);

  // --- Break countdown -----------------------------------------------------
  const setBreakDuration = useCallback<StoreApi['setBreakDuration']>(
    (ms) => {
      const duration = clamp(Math.round(ms), 0, 6 * 60 * 60_000);
      update({
        break: {
          mode: 'idle',
          durationMs: duration,
          remainingMs: duration,
          endsAtEpoch: null,
        },
      });
    },
    [update]
  );

  const startBreak = useCallback(() => {
    update({
      break: {
        mode: 'running',
        durationMs: state.break.durationMs,
        remainingMs: state.break.durationMs,
        endsAtEpoch: Date.now() + state.break.durationMs,
      },
    });
  }, [update, state.break.durationMs]);

  const pauseBreak = useCallback(() => {
    updateFn((prev) => {
      if (prev.break.mode !== 'running' || prev.break.endsAtEpoch === null) return {};
      return {
        break: {
          ...prev.break,
          mode: 'paused',
          remainingMs: Math.max(0, prev.break.endsAtEpoch - Date.now()),
          endsAtEpoch: null,
        },
      };
    });
  }, [updateFn]);

  const resumeBreak = useCallback(() => {
    updateFn((prev) => {
      if (prev.break.mode !== 'paused') return {};
      return {
        break: {
          ...prev.break,
          mode: 'running',
          endsAtEpoch: Date.now() + prev.break.remainingMs,
        },
      };
    });
  }, [updateFn]);

  const resetBreak = useCallback(() => {
    update({
      break: { mode: 'idle', durationMs: state.break.durationMs, remainingMs: state.break.durationMs, endsAtEpoch: null },
    });
  }, [update, state.break.durationMs]);

  const completeBreak = useCallback(() => {
    updateFn((prev) => {
      if (prev.break.mode !== 'running') return {};
      return { break: { ...prev.break, mode: 'done', remainingMs: 0, endsAtEpoch: null } };
    });
  }, [updateFn]);

  // --- Overlay / settings --------------------------------------------------
  const setOverlay = useCallback<StoreApi['setOverlay']>(
    (patch) => {
      updateFn((prev) => ({ overlay: { ...prev.overlay, ...patch } }));
    },
    [updateFn]
  );

  const setSettings = useCallback<StoreApi['setSettings']>(
    (patch) => {
      updateFn((prev) => ({ settings: { ...prev.settings, ...patch } }));
    },
    [updateFn]
  );

  const replayEntrance = useCallback(() => {
    updateFn((prev) => ({ overlay: { ...prev.overlay, animEpoch: prev.overlay.animEpoch + 1 } }));
  }, [updateFn]);

  // --- Commands + match-flow automations -----------------------------------

  const sendCommand = useCallback<StoreApi['sendCommand']>(
    (command) => {
      updateFn((prev) => {
        const cmd = { ...command, id: uid('cmd'), at: Date.now() } as Command;
        const patch: Partial<ScoreboardState> = { command: cmd };

        // ROUND-WIN FLOW — the count-up clock returns to 00:00 immediately.
        if (command.type === 'roundVictory' && prev.settings.autoRoundFlow) {
          patch.timer = { mode: 'idle', accumulatedMs: 0, sinceEpoch: null };
        }

        // DUEL-WIN FLOW — the break countdown starts right away.
        if (command.type === 'duelVictory' && prev.settings.autoDuelFlow) {
          patch.break = {
            mode: 'running',
            durationMs: prev.break.durationMs,
            remainingMs: prev.break.durationMs,
            endsAtEpoch: Date.now() + prev.break.durationMs,
          };
        }
        return patch;
      });

      // Delayed resets land AFTER the broadcast animation has played out
      // (cooldown), so the board stays cinematic before showing fresh numbers.
      if (command.type === 'roundVictory') {
        scheduleFlow(
          ((BROADCAST_DURATION_S.roundVictory + FLOW_GRACE_S) / state.settings.speed) * 1000,
          () => {
            updateFn((prev) => {
              if (!prev.settings.autoRoundFlow) return {}; // toggled off meanwhile
              const scores = [...prev.scores] as ScoreboardState['scores'];
              scores[0] = { ...scores[0], totems: 2 };
              scores[1] = { ...scores[1], totems: 2 };
              return { scores };
            });
          }
        );
      }
      if (command.type === 'duelVictory') {
        scheduleFlow(
          ((BROADCAST_DURATION_S.duelVictory + FLOW_GRACE_S) / state.settings.speed) * 1000,
          () => {
            updateFn((prev) => {
              if (!prev.settings.autoDuelFlow) return {}; // toggled off meanwhile
              const scores = [...prev.scores] as ScoreboardState['scores'];
              scores[0] = { ...scores[0], roundsWon: 0 };
              scores[1] = { ...scores[1], roundsWon: 0 };
              return { scores };
            });
          }
        );
      }
    },
    [update, updateFn, scheduleFlow, state.settings.speed]
  );

  // --- Assets --------------------------------------------------------------
  const addAssetMeta = useCallback(
    (meta: AssetMeta) => {
      updateFn((prev) => ({ assetsMeta: [...prev.assetsMeta, meta] }));
    },
    [updateFn]
  );

  const importAsset = useCallback<StoreApi['importAsset']>(
    async (file, kind, opts) => {
      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        throw new Error('Unsupported file type — use PNG, JPG or WEBP.');
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new Error('Image is too large — maximum 8 MB.');
      }
      const id = uid('img');
      await putImage(id, file);
      addAssetMeta({
        id,
        name: opts?.name ?? file.name.replace(/\.[^.]+$/, ''),
        kind,
        mime: file.type,
        size: file.size,
        createdAt: Date.now(),
      });
      if (opts?.slot) {
        updateFn((prev) => ({ assets: { ...prev.assets, [opts.slot as AssetSlotId]: id } }));
      }
      return id;
    },
    [addAssetMeta, updateFn]
  );

  const setSlotAsset = useCallback<StoreApi['setSlotAsset']>(
    (slot, assetId) => {
      updateFn((prev) => ({ assets: { ...prev.assets, [slot]: assetId } }));
    },
    [updateFn]
  );

  const removeAsset = useCallback<StoreApi['removeAsset']>(
    async (assetId) => {
      // Unassign the asset from fixed slots…
      updateFn((prev) => {
        const assets = { ...prev.assets };
        let touched = false;
        (Object.keys(assets) as AssetSlotId[]).forEach((slot) => {
          if (assets[slot] === assetId) {
            assets[slot] = null;
            touched = true;
          }
        });
        // …and from any player config referencing it.
        const players = prev.players.map((p) => ({
          ...p,
          portraitAssetId: p.portraitAssetId === assetId ? null : p.portraitAssetId,
          flagAssetId: p.flagAssetId === assetId ? null : p.flagAssetId,
        }));
        return {
          ...(touched ? { assets } : {}),
          players: players as ScoreboardState['players'],
          assetsMeta: prev.assetsMeta.filter((m) => m.id !== assetId),
        };
      });
      await deleteImage(assetId);
    },
    [updateFn]
  );

  const api = useMemo<StoreApi>(
    () => ({
      state,
      update,
      updateFn,
      setPlayerConfig,
      adjustScore,
      setScoreValue,
      resetPlayerScores,
      resetMatchScores,
      resetMatch,
      startMatchTimer,
      pauseMatchTimer,
      resumeMatchTimer,
      resetMatchTimer,
      setBreakDuration,
      startBreak,
      pauseBreak,
      resumeBreak,
      resetBreak,
      completeBreak,
      setOverlay,
      setSettings,
      replayEntrance,
      sendCommand,
      importAsset,
      removeAsset,
      setSlotAsset,
    }),
    [
      state,
      update,
      updateFn,
      setPlayerConfig,
      adjustScore,
      setScoreValue,
      resetPlayerScores,
      resetMatchScores,
      resetMatch,
      startMatchTimer,
      pauseMatchTimer,
      resumeMatchTimer,
      resetMatchTimer,
      setBreakDuration,
      startBreak,
      pauseBreak,
      resumeBreak,
      resetBreak,
      completeBreak,
      setOverlay,
      setSettings,
      replayEntrance,
      sendCommand,
      importAsset,
      removeAsset,
      setSlotAsset,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
