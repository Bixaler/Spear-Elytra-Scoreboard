/**
 * Cross-context sync channel.
 *
 * Control panel and OBS overlay usually live in two different browser
 * contexts. This module broadcasts every state write to any other context
 * on the same origin:
 *  - BroadcastChannel when available (same browser, incl. OBS docks/sources).
 *  - `storage` events as a fallback (cross-tab in the same browser).
 *
 * The transport is intentionally tiny and swappable: a future shared
 * real-time provider (WebSocket relay, Firebase, PartyKit, ...) can replace
 * `createSyncChannel` without touching the store or components.
 */

import type { ScoreboardState } from '../types';

export interface SyncMessage {
  type: 'state';
  origin: string;
  state: ScoreboardState;
}

export interface SyncChannel {
  post(message: SyncMessage): void;
  subscribe(handler: (message: SyncMessage) => void): () => void;
}

const CHANNEL_NAME = 'arena-cx-sync';
const STORAGE_KEY = 'arena-cx.state.v1';

export function createSyncChannel(): SyncChannel {
  const handlers = new Set<(message: SyncMessage) => void>();

  const emit = (message: SyncMessage) => {
    handlers.forEach((h) => h(message));
  };

  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (event: MessageEvent<SyncMessage>) => {
        if (event.data?.type === 'state') emit(event.data);
      };
    } catch {
      bc = null;
    }
  }

  // Fallback path: fire when the persisted blob changes in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue || bc) return;
    try {
      const parsed = JSON.parse(event.newValue) as ScoreboardState;
      emit({ type: 'state', origin: 'storage', state: parsed });
    } catch {
      /* ignore malformed payloads */
    }
  };
  window.addEventListener('storage', onStorage);

  return {
    post(message) {
      try {
        bc?.postMessage(message);
      } catch {
        /* channel closed — the storage fallback still covers same-browser tabs */
      }
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}
