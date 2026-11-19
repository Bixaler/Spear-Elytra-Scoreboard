/**
 * IndexedDB image storage.
 *
 * Image blobs live here (never base64 in LocalStorage). Only small metadata
 * rows are mirrored into the main state so the library UI can render lists
 * without touching the database.
 */

import type { AssetMeta } from '../types';

const DB_NAME = 'arena-cx-images';
const STORE = 'images';
const DB_VERSION = 1;

export interface ImageRecord {
  id: string;
  blob: Blob;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open image database'));
  });
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Image database request failed'));
  });
}

export async function putImage(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put({ id, blob } satisfies ImageRecord));
}

export async function getImage(id: string): Promise<ImageRecord | null> {
  const rec = await withStore<ImageRecord | undefined>('readonly', (store) => store.get(id));
  return rec ?? null;
}

export async function deleteImage(id: string): Promise<void> {
  urlCache.delete(id);
  const cached = revokedCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    revokedCache.delete(id);
  }
  await withStore('readwrite', (store) => store.delete(id));
}

export async function listImageIds(): Promise<string[]> {
  const keys = await withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  return keys.map(String);
}

/** id -> object URL, cached for the lifetime of the page. */
const urlCache = new Map<string, string>();
/** URLs created during this session (for revocation on delete). */
const revokedCache = new Map<string, string>();

export interface ResolvedImage {
  url: string;
  meta: AssetMeta | null;
}

/**
 * Resolve an asset id to a usable object URL. Missing / invalid assets
 * resolve to null so callers can render graceful placeholders.
 */
export async function resolveImage(id: string): Promise<ResolvedImage | null> {
  const hit = urlCache.get(id);
  if (hit) return { url: hit, meta: null };
  try {
    const rec = await getImage(id);
    if (!rec || !(rec.blob instanceof Blob)) return null;
    const url = URL.createObjectURL(rec.blob);
    urlCache.set(id, url);
    revokedCache.set(id, url);
    return { url, meta: null };
  } catch {
    return null;
  }
}
