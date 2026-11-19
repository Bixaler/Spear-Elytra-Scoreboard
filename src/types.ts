/**
 * ARENA CX — shared domain types.
 *
 * Design rules enforced by these types:
 * - Duel Wins, Rounds Won and Totems are THREE SEPARATE numeric fields.
 *   No derived or coupled values exist anywhere in the state model.
 * - Images are never stored as base64 in LocalStorage. The state only keeps
 *   asset IDs; blobs live in IndexedDB (see state/imageStore.ts).
 */

export type PlayerIndex = 0 | 1;

/** The three fully independent per-player statistics. */
export type ScoreKey = 'duelWins' | 'roundsWon' | 'totems';

export interface PlayerConfig {
  name: string;
  /** 2-letter country code. Empty string = no country shown. */
  country: string;
  /** IndexedDB asset id of the portrait image (null = placeholder). */
  portraitAssetId: string | null;
  /** IndexedDB asset id of an uploaded flag image (null = code badge). */
  flagAssetId: string | null;
  /** Mirror the portrait horizontally (broadcast-only presentation flag). */
  flipX: boolean;
  /** Mirror the portrait vertically (broadcast-only presentation flag). */
  flipY: boolean;
}

export interface PlayerScore {
  duelWins: number;
  roundsWon: number;
  totems: number;
}

export type TimerMode = 'idle' | 'running' | 'paused' | 'done';

/**
 * Count-up match timer. Epoch based so it stays accurate even when the
 * browser tab is throttled in the background, and so a page refresh
 * mid-run restores the correct elapsed time.
 */
export interface MatchTimerState {
  mode: TimerMode;
  /** Milliseconds accumulated across previous runs. */
  accumulatedMs: number;
  /** Date.now() captured when the current run started (null when not running). */
  sinceEpoch: number | null;
}

/**
 * Break countdown. When running, `endsAtEpoch` is the absolute wall-clock
 * finish time; remaining time is always derived, never incremented.
 */
export interface BreakTimerState {
  mode: TimerMode;
  /** Configured countdown length. */
  durationMs: number;
  /** Remaining ms while paused (or after done). */
  remainingMs: number;
  /** Absolute finish timestamp while running. */
  endsAtEpoch: number | null;
}

export type AnchorId =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type EntranceStyle = 'slide' | 'rise' | 'glitch' | 'fade';
export type AnimIntensity = 'minimal' | 'standard' | 'cinematic';

export interface OverlayConfig {
  /** Master visibility of the whole scoreboard (hide/show for OBS scenes). */
  visible: boolean;
  anchor: AnchorId;
  /** Manual pixel offsets applied on top of the anchor. */
  offsetX: number;
  offsetY: number;
  /** Uniform scale factor for the whole board. */
  scale: number;
  entrance: EntranceStyle;
  /** Bumped to replay the entrance animation. */
  animEpoch: number;
  showLogo: boolean;
  showTimer: boolean;
}

export interface Settings {
  intensity: AnimIntensity;
  /** Duration multiplier: 0.5 = twice as slow, 2 = twice as fast. */
  speed: number;
  soundEnabled: boolean;
  /** Hide the break module automatically a few seconds after it completes. */
  autoHideBreak: boolean;
  /** Remaining time under which the countdown starts flashing urgently (ms). */
  breakUrgencyMs: number;
  /** Rounds a player must win to take the duel (BO5 = first to 5). */
  duelTarget: number;
  /**
   * Link the Match-panel steppers to the broadcast FX: stepping Rounds Won
   * fires the round-victory ribbon, reaching the duel target auto-credits
   * the Duel Win and plays the cinematic, stepping Duel Wins plays the
   * cinematic. Totems never trigger anything.
   */
  autoVictoryFx: boolean;
  /**
   * ROUND-WIN FLOW — fired on every round victory (steppers or trigger):
   * the count-up match timer resets to 00:00 and, once the round-win
   * ribbon has played out, both players' Totem counts return to 2 for the
   * next round.
   */
  autoRoundFlow: boolean;
  /**
   * DUEL-WIN FLOW — fired on every duel victory: the break countdown
   * starts immediately and, once the victory cinematic has played out,
   * both players' Rounds Won reset to 0 for the next duel.
   */
  autoDuelFlow: boolean;
  /** Scale factor for the frameless scoreboard portraits (1 = 100%). */
  portraitScale: number;
}

/** Preset duel formats offered in the Match panel (rounds to win). */
export const DUEL_TARGETS = [3, 5, 7] as const;

/** Fixed, labelled image slots shown in the Asset Library. */
export type AssetSlotId =
  | 'totemIcon'
  | 'tournamentLogo'
  | 'background'
  | 'itemSlot1'
  | 'itemSlot2'
  | 'itemSlot3';

export const ASSET_SLOT_IDS: AssetSlotId[] = [
  'totemIcon',
  'tournamentLogo',
  'background',
  'itemSlot1',
  'itemSlot2',
  'itemSlot3',
];

/** One-shot broadcast commands triggered from the control panel. */
export type Command =
  | { id: string; type: 'intro'; at: number }
  | { id: string; type: 'duelVictory'; player: PlayerIndex; at: number }
  | { id: string; type: 'roundVictory'; player: PlayerIndex; at: number }
  | { id: string; type: 'resetAnims'; at: number };

export interface ScoreboardState {
  /** Monotonic revision for last-write-wins sync between browser contexts. */
  rev: number;
  /** Runtime session id of the context that last wrote this state. */
  origin: string;
  players: [PlayerConfig, PlayerConfig];
  scores: [PlayerScore, PlayerScore];
  timer: MatchTimerState;
  break: BreakTimerState;
  overlay: OverlayConfig;
  settings: Settings;
  /** Fixed asset slots -> IndexedDB asset id (or null for intentionally empty). */
  assets: Record<AssetSlotId, string | null>;
  /** Transient command (not persisted). */
  command: Command | null;
  /** Metadata for every image stored in IndexedDB. */
  assetsMeta: AssetMeta[];
}

export type AssetKind = 'portrait' | 'flag' | 'icon' | 'logo' | 'background' | 'misc';

/** Metadata row for an image stored in IndexedDB (kept in LocalStorage). */
export interface AssetMeta {
  id: string;
  name: string;
  kind: AssetKind;
  mime: string;
  size: number;
  createdAt: number;
}

export const SCORE_KEYS: ScoreKey[] = ['duelWins', 'roundsWon', 'totems'];

export const SCORE_META: Record<ScoreKey, { label: string; short: string; min: number; max: number }> = {
  duelWins: { label: 'Duel Wins', short: 'DUEL', min: 0, max: 999 },
  roundsWon: { label: 'Rounds Won', short: 'ROUND', min: 0, max: 999 },
  totems: { label: 'Totems', short: 'TOTEM', min: 0, max: 99 },
};
