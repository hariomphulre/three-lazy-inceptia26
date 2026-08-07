"use client";

/**
 * High-level offline-first session API used by the games.
 *
 * Every write is durably queued in IndexedDB first, then (if online) flushed to
 * the backend immediately — so behaviour matches the old online flow when there
 * is a connection, and nothing is lost when there isn't.
 */

import {
  addMediaOp,
  addSaveOp,
  getSession,
  putSession,
  SessionRec,
} from "./db";
import { trySyncSession } from "./sync";

const SESSION_KEY = "sessionId";

function newUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (older browsers)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new assessment session. Generates the UUID locally (so it works
 * offline), stores it, and tries to create the server row immediately if online.
 * Returns the session id to use for the rest of the flow.
 */
export async function createSession(data: {
  name: string;
  age: number;
  gender: string;
}): Promise<string> {
  const id = newUUID();
  const rec: SessionRec = {
    id,
    name: data.name,
    age: data.age,
    gender: data.gender,
    serverCreated: false,
    createdAt: Date.now(),
  };
  await putSession(rec);
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
  // Fire-and-forget create on the server; if offline it stays queued.
  void trySyncSession(id);
  return id;
}

export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Queue a feature save ({ column: value, ... }) and flush if online.
 * Drop-in replacement for the old `fetch("/api/session/save", ...)` calls.
 */
export async function saveSession(
  payload: Record<string, unknown>
): Promise<void> {
  const sessionId = getCurrentSessionId();
  if (!sessionId) {
    console.warn("saveSession called with no sessionId");
    return;
  }
  await addSaveOp({ sessionId, payload, createdAt: Date.now() });
  await trySyncSession(sessionId);
}

/**
 * Queue an audio recording (Level 2). The blob is stored locally and the
 * returned Cloudinary URL will be written to `saveColumn` on sync.
 */
export async function saveAudio(blob: Blob, saveColumn: string): Promise<void> {
  const sessionId = getCurrentSessionId();
  if (!sessionId) return;
  await addMediaOp({
    sessionId,
    kind: "audio",
    blob,
    filename: "reading.webm",
    uploadEndpoint: "/api/upload",
    saveColumn,
    createdAt: Date.now(),
  });
  await trySyncSession(sessionId);
}

/**
 * Queue a handwriting image upload (Level 3). URL saved to test3_image on sync.
 */
export async function saveWritingImage(file: File): Promise<void> {
  const sessionId = getCurrentSessionId();
  if (!sessionId) return;
  await addMediaOp({
    sessionId,
    kind: "writing",
    blob: file,
    filename: file.name || "writing.png",
    uploadEndpoint: "/api/upload",
    saveColumn: "test3_image",
    createdAt: Date.now(),
  });
  await trySyncSession(sessionId);
}

/**
 * Queue the recorded assessment video. Uploaded via /api/session/upload on sync
 * (that endpoint handles both Cloudinary upload and the DB video_link update).
 */
export async function saveVideo(
  blob: Blob,
  sessionId: string
): Promise<void> {
  await addMediaOp({
    sessionId,
    kind: "video",
    blob,
    filename: "session.webm",
    uploadEndpoint: "/api/session/upload",
    createdAt: Date.now(),
  });
  await trySyncSession(sessionId);
}

/** Ensure a session record exists in IDB for a given id (used by video flow). */
export async function ensureSessionRecord(
  id: string,
  data?: { name: string; age: number; gender: string }
): Promise<void> {
  const existing = await getSession(id);
  if (existing) return;
  await putSession({
    id,
    name: data?.name ?? "",
    age: data?.age ?? 0,
    gender: data?.gender ?? "",
    serverCreated: false,
    createdAt: Date.now(),
  });
}
