"use client";

/**
 * Minimal IndexedDB wrapper for NeuroBloom offline mode (no external deps).
 *
 * Three object stores:
 *  - sessions:   one record per assessment (client-generated UUID = future DB id)
 *  - saveQueue:  queued feature saves (each is a column->value map for a session)
 *  - mediaQueue: queued audio / writing image / video blobs to upload
 *
 * The client generates the session UUID up front (crypto.randomUUID) so the whole
 * assessment can be collected offline; the sync engine later replays everything to
 * the existing Postgres + Cloudinary backend when the network returns.
 */

const DB_NAME = "neurobloom-offline";
const DB_VERSION = 1;

export const STORE_SESSIONS = "sessions";
export const STORE_SAVES = "saveQueue";
export const STORE_MEDIA = "mediaQueue";

export interface SessionRec {
  id: string; // client UUID — also becomes the Postgres row id
  name: string;
  age: number;
  gender: string;
  serverCreated: boolean; // has the row been INSERTed on the server yet?
  createdAt: number;
}

export interface SaveOp {
  id?: number; // auto key
  sessionId: string;
  payload: Record<string, unknown>; // { column: value, ... }
  createdAt: number;
}

export interface MediaOp {
  id?: number; // auto key
  sessionId: string;
  kind: "audio" | "writing" | "video";
  blob: Blob;
  filename: string;
  /** Endpoint that accepts the file upload. */
  uploadEndpoint: "/api/upload" | "/api/session/upload";
  /** For audio/writing: DB column that should store the returned URL. */
  saveColumn?: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SAVES)) {
        const s = db.createObjectStore(STORE_SAVES, {
          keyPath: "id",
          autoIncrement: true,
        });
        s.createIndex("bySession", "sessionId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        const m = db.createObjectStore(STORE_MEDIA, {
          keyPath: "id",
          autoIncrement: true,
        });
        m.createIndex("bySession", "sessionId", { unique: false });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // If the connection is closed/superseded, drop the cached promise so the
      // next call reopens instead of using a dying connection.
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

/** Runs a DB operation, reopening once if the cached connection was closing. */
async function withDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  try {
    return await fn(await openDB());
  } catch {
    // Stale/closing connection — reset and retry once with a fresh one.
    dbPromise = null;
    return await fn(await openDB());
  }
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return withDB(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        t.onabort = () => reject(t.error);
      })
  );
}

function getAllByIndex<T>(
  store: string,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  return withDB(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const t = db.transaction(store, "readonly");
        const req = t.objectStore(store).index(indexName).getAll(key);
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
        t.onabort = () => reject(t.error);
      })
  );
}

/* ---- sessions ---- */

export function putSession(rec: SessionRec): Promise<IDBValidKey> {
  return tx(STORE_SESSIONS, "readwrite", (s) => s.put(rec));
}

export function getSession(id: string): Promise<SessionRec | undefined> {
  return tx(STORE_SESSIONS, "readonly", (s) => s.get(id));
}

export function getAllSessions(): Promise<SessionRec[]> {
  return tx(STORE_SESSIONS, "readonly", (s) => s.getAll());
}

export async function markSessionCreated(id: string): Promise<void> {
  const rec = await getSession(id);
  if (!rec) return;
  rec.serverCreated = true;
  await putSession(rec);
}

/* ---- save queue ---- */

export function addSaveOp(op: SaveOp): Promise<IDBValidKey> {
  return tx(STORE_SAVES, "readwrite", (s) => s.add(op));
}

export function getSavesForSession(sessionId: string): Promise<SaveOp[]> {
  return getAllByIndex<SaveOp>(STORE_SAVES, "bySession", sessionId);
}

export function getAllSaves(): Promise<SaveOp[]> {
  return tx(STORE_SAVES, "readonly", (s) => s.getAll());
}

export function deleteSaveOp(id: number): Promise<undefined> {
  return tx(STORE_SAVES, "readwrite", (s) => s.delete(id));
}

/* ---- media queue ---- */

export function addMediaOp(op: MediaOp): Promise<IDBValidKey> {
  return tx(STORE_MEDIA, "readwrite", (s) => s.add(op));
}

export function getMediaForSession(sessionId: string): Promise<MediaOp[]> {
  return getAllByIndex<MediaOp>(STORE_MEDIA, "bySession", sessionId);
}

export function getAllMedia(): Promise<MediaOp[]> {
  return tx(STORE_MEDIA, "readonly", (s) => s.getAll());
}

export function deleteMediaOp(id: number): Promise<undefined> {
  return tx(STORE_MEDIA, "readwrite", (s) => s.delete(id));
}

/** Total number of not-yet-synced operations (saves + media). */
export async function pendingCount(): Promise<number> {
  const [saves, media] = await Promise.all([getAllSaves(), getAllMedia()]);
  return saves.length + media.length;
}
