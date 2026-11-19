
import type { ScoreboardState } from '../types';
import { sessionId } from '../utils/id';

/**
 * Factory for the default scoreboard state. The Totem icon slot is
 * intentionally EMPTY — no placeholder artwork is generated for it.
 */
export function defaultState(): ScoreboardState {
  return {
    rev: 0,
    origin: sessionId(),

    // Saved player profiles
    profiles: [],

    players: [
      {
        name: 'Player One',
        country: '',
        portraitAssetId: null,
        flagAssetId: null,
        flipX: false,
        flipY: false,
      },
      {
        name: 'Player Two',
        country: '',
        portraitAssetId: null,
        flagAssetId: null,
        flipX: false,
        flipY: false,
      },
    ],
    scores: [
      { duelWins: 0, roundsWon: 0, totems: 0 },
      { duelWins: 0, roundsWon: 0, totems: 0 },
    ],
    timer: { mode: 'idle', accumulatedMs: 0, sinceEpoch: null },
    break: {
      mode: 'idle',
      durationMs: 5 * 60_000,
      remainingMs: 5 * 60_000,
      endsAtEpoch: null,
    },
    overlay: {
      visible: true,
      anchor: 'top-center',
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      entrance: 'slide',
      animEpoch: 0,
      showLogo: true,
      showTimer: true,
    },
    settings: {
      intensity: 'standard',
      speed: 1,
      soundEnabled: true,
      autoHideBreak: true,
      breakUrgencyMs: 10_000,
      duelTarget: 5,
      autoVictoryFx: true,
      autoRoundFlow: true,
      autoDuelFlow: true,
      portraitScale: 1,
    },
    assets: {
      totemIcon: null,
      tournamentLogo: null,
      background: null,
      itemSlot1: null,
      itemSlot2: null,
      itemSlot3: null,
    },
    command: null,
    assetsMeta: [],
  };
}
