/**
 * mediaDb.ts — IndexedDB storage for photo blobs
 *
 * Runs entirely in parallel with db/index.ts (localStorage).
 * localStorage holds MediaMeta (metadata only).
 * IndexedDB holds the actual binary Blob data.
 *
 * Uses the `idb` library (npm install idb) — tiny Promise wrapper
 * over the raw IndexedDB API. ~1KB minified.
 *
 * In Phase 2 (Electron): swap this file to write Blobs as files
 * to the local filesystem via IPC. Nothing else in the app changes.
 */

import { openDB, type IDBPDatabase } from 'idb';

// ── Schema ────────────────────────────────────────────────────────────────────

const DB_NAME    = 'reflect-media';
const DB_VERSION = 1;
const STORE      = 'photos';

interface MediaRecord {
  id:   string;   // matches MediaMeta.id in localStorage
  blob: Blob;     // compressed JPEG Blob
}

// ── DB singleton ──────────────────────────────────────────────────────────────

let _db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
  return _db;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const mediaDb = {
  /**
   * Retrieve the raw Blob for a given media ID.
   * Returns undefined if not found.
   */
  async getBlob(id: string): Promise<Blob | undefined> {
    try {
      const db     = await getDb();
      const record = await db.get(STORE, id) as MediaRecord | undefined;
      return record?.blob;
    } catch (err) {
      console.error('[mediaDb] getBlob failed:', err);
      return undefined;
    }
  },

  /**
   * Store a Blob under the given ID.
   * Overwrites silently if ID already exists (idempotent re-upload).
   */
  async saveBlob(id: string, blob: Blob): Promise<void> {
    try {
      const db = await getDb();
      await db.put(STORE, { id, blob } satisfies MediaRecord);
    } catch (err) {
      console.error('[mediaDb] saveBlob failed:', err);
      throw err; // surface so PhotoUploader can show a toast
    }
  },

  /**
   * Delete a single blob by ID. No-op if not found.
   */
  async deleteBlob(id: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete(STORE, id);
    } catch (err) {
      console.error('[mediaDb] deleteBlob failed:', err);
    }
  },

  /**
   * Delete multiple blobs in a single transaction.
   * Used when deleting an entry with multiple photos.
   */
  async deleteBlobs(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readwrite');
      await Promise.all(ids.map(id => tx.store.delete(id)));
      await tx.done;
    } catch (err) {
      console.error('[mediaDb] deleteBlobs failed:', err);
    }
  },

  /**
   * Create an object URL for a blob.
   * Caller is responsible for calling URL.revokeObjectURL when done.
   * Returns undefined if blob not found.
   */
  async getBlobUrl(id: string): Promise<string | undefined> {
    const blob = await this.getBlob(id);
    if (!blob) return undefined;
    return URL.createObjectURL(blob);
  },

  /**
   * Wipe ALL photo blobs from IndexedDB.
   * Called by db.backup.deleteAll() so media is cleared with everything else.
   */
  async clear(): Promise<void> {
    try {
      const db = await getDb();
      await db.clear(STORE);
    } catch (err) {
      console.error('[mediaDb] clear failed:', err);
    }
  },

  /**
   * Export all blobs as base64 strings.
   * Used by exportWithMedia() in export.ts.
   * Returns a map of { id → base64DataUrl }.
   */
  async exportAllAsBase64(): Promise<Record<string, string>> {
    try {
      const db      = await getDb();
      const records = await db.getAll(STORE) as MediaRecord[];
      const result: Record<string, string> = {};
      await Promise.all(
        records.map(
          r =>
            new Promise<void>(resolve => {
              const reader   = new FileReader();
              reader.onload  = () => { result[r.id] = reader.result as string; resolve(); };
              reader.onerror = () => resolve(); // skip on error, not fatal
              reader.readAsDataURL(r.blob);
            })
        )
      );
      return result;
    } catch (err) {
      console.error('[mediaDb] exportAllAsBase64 failed:', err);
      return {};
    }
  },

  /**
   * Import blobs from a base64 map produced by exportAllAsBase64.
   * Used by importWithMedia() in export.ts.
   */
  async importFromBase64(map: Record<string, string>): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readwrite');
      await Promise.all(
        Object.entries(map).map(async ([id, dataUrl]) => {
          const res  = await fetch(dataUrl);
          const blob = await res.blob();
          await tx.store.put({ id, blob });
        })
      );
      await tx.done;
    } catch (err) {
      console.error('[mediaDb] importFromBase64 failed:', err);
      throw err;
    }
  },
};
