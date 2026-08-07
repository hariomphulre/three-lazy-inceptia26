"use client";

/**
 * Sync engine — replays everything collected offline to the existing backend.
 *
 * Per session, in order:
 *   1. Create the row on the server (INSERT with the client UUID) if not done.
 *   2. Replay queued feature saves  -> POST /api/session/save
 *   3. Replay queued media uploads   -> /api/upload (+ save URL) or /api/session/upload
 *
 * Any failed step leaves its op in IndexedDB so it is retried on the next sync
 * (on app load, on the "online" event, or after each new save while online).
 */

import {
  deleteMediaOp,
  deleteSaveOp,
  getAllSessions,
  getMediaForSession,
  getSavesForSession,
  getSession,
  markSessionCreated,
  MediaOp,
} from "./db";

let syncing = false;

/** Notifies UI (OfflineSync indicator) that pending counts may have changed. */
function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("neurobloom:sync-change"));
  }
}

async function ensureServerSession(sessionId: string): Promise<boolean> {
  const rec = await getSession(sessionId);
  if (!rec) return false;
  if (rec.serverCreated) return true;

  const res = await fetch("/api/session/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: rec.id,
      name: rec.name,
      age: rec.age,
      gender: rec.gender,
    }),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status}`);
  await markSessionCreated(sessionId);
  return true;
}

async function flushMedia(op: MediaOp): Promise<void> {
  if (op.uploadEndpoint === "/api/session/upload") {
    // Video: server uploads to Cloudinary AND updates the DB row.
    const fd = new FormData();
    fd.append("file", op.blob, op.filename);
    const res = await fetch("/api/session/upload", {
      method: "POST",
      headers: { "x-session-id": op.sessionId },
      body: fd,
    });
    if (!res.ok) throw new Error(`video upload failed: ${res.status}`);
    return;
  }

  // Audio / writing image: upload to Cloudinary, then save the URL to a column.
  const fd = new FormData();
  fd.append("file", op.blob, op.filename);
  const up = await fetch("/api/upload", { method: "POST", body: fd });
  const upJson = await up.json();
  if (!up.ok || !upJson.url) throw new Error("media upload failed");

  if (op.saveColumn) {
    const save = await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: op.sessionId,
        payload: { [op.saveColumn]: upJson.url },
      }),
    });
    if (!save.ok) throw new Error(`media url save failed: ${save.status}`);
  }
}

/** Flush a single session's queued ops. Returns true if fully drained. */
export async function flushSession(sessionId: string): Promise<boolean> {
  await ensureServerSession(sessionId);

  const saves = await getSavesForSession(sessionId);
  for (const op of saves) {
    const res = await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, payload: op.payload }),
    });
    if (!res.ok) throw new Error(`save failed: ${res.status}`);
    if (op.id != null) await deleteSaveOp(op.id);
    notifyChange();
  }

  const media = await getMediaForSession(sessionId);
  for (const op of media) {
    await flushMedia(op);
    if (op.id != null) await deleteMediaOp(op.id);
    notifyChange();
  }

  return true;
}

/** Attempt to sync every session. Best-effort: swallows per-session errors. */
export async function syncAll(): Promise<void> {
  if (syncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  syncing = true;
  try {
    const sessions = await getAllSessions();
    for (const s of sessions) {
      try {
        await flushSession(s.id);
      } catch (err) {
        // Leave this session's ops queued; try again next time.
        console.warn("Sync deferred for session", s.id, err);
      }
    }
  } finally {
    syncing = false;
    notifyChange();
  }
}

/** Best-effort flush of one session; never throws (for use in game save paths). */
export async function trySyncSession(sessionId: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    await flushSession(sessionId);
  } catch (err) {
    console.warn("Deferred sync for session", sessionId, err);
  } finally {
    notifyChange();
  }
}
