# NeuroBloom — PWA & Offline Guide

NeuroBloom is an **installable Progressive Web App (PWA)** that also works **offline**:
a child can complete the whole assessment with no internet, and everything syncs to
the backend automatically when the connection returns.

---

## What we added

- **PWA** — makes the site installable to the home screen / desktop and lets pages &
  assets load offline.
  - `app/manifest.ts` — app name, icons, sky-blue theme, standalone/portrait display.
  - `public/sw.js` — service worker: caches pages/assets (runs **only in production**).
  - `components/ServiceWorkerRegister.tsx` — registers the worker in prod; unregisters
    + clears caches in dev (so dev never serves stale cached files).
  - `components/InstallPrompt.tsx` — install button (Android/desktop) + iOS "Add to
    Home Screen" hint.
  - `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-icon.png` —
    app icons (placeholders; replace the files anytime, no code change needed).

- **Offline database** — built on the browser's **IndexedDB** (`lib/offline/`), so no
  assessment data is lost when offline. Three stores:

  | Store        | Holds                                                        |
  | ------------ | ------------------------------------------------------------ |
  | `sessions`   | one row per assessment (name/age/gender + a device-made UUID)|
  | `saveQueue`  | each game answer (`{ column: value }`)                       |
  | `mediaQueue` | audio / handwriting image / video **blobs**                  |

  - `lib/offline/db.ts` — IndexedDB wrapper (self-healing connection, no dependencies).
  - `lib/offline/session.ts` — the API games call: `createSession`, `saveSession`,
    `saveAudio`, `saveWritingImage`, `saveVideo`.
  - `lib/offline/sync.ts` — the sync engine that replays everything to the backend.
  - `components/OfflineSync.tsx` — the status pill + auto-sync on load/reconnect.

---

## How it works

```
Child plays  →  saveSession() / saveAudio() / saveVideo()
                        │
                        ▼
             Written to IndexedDB (always, instantly)
                        │
              ┌─────────┴─────────┐
          ONLINE              OFFLINE
              │                   │
       flush immediately     stays queued
       to the backend        ("Offline · N saved")
                                  │
                        (internet returns)
                                  │
                        sync engine replays:
                        1. create DB row  (with the same UUID)
                        2. POST each answer  → Postgres
                        3. upload media      → Cloudinary
```

**Key trick:** the session ID is generated **on the device** with
`crypto.randomUUID()` instead of waiting for the server. That is what lets the whole
assessment run with zero internet. On sync, the server inserts the row *with that same
UUID* (`INSERT ... ON CONFLICT DO NOTHING`), so every queued answer lines up perfectly.

---

## What works offline vs. not

- ✅ **Offline:** all games, live face-detection, audio/video recording, and all
  answer/data collection.
- ❌ **Needs internet:** login/signup, the AI screening, and PDF reports — these run
  *after* sync. Nothing is lost; you **collect offline and analyze online**.

> First-load caveat: a page must be opened **once while online** before the service
> worker can serve it offline. For a classroom, open the app online first, then it
> keeps working after you go offline.

---

## How to install ("download") the app

Installability needs a **production** build (and HTTPS in production; `localhost`
counts as secure for testing):

```bash
cd neurobloom
npm run build && npm run start   # opens http://localhost:3000
```

- **Desktop Chrome / Edge:** open the site → click the **install icon** at the right of
  the address bar (a monitor with a down-arrow), or the blue **Install** banner → **Install**.
  It opens in its own app window.
- **Android Chrome:** menu **⋮** → **Install app / Add to Home screen**.
- **iPhone (Safari):** **Share** button → **Add to Home Screen** (the on-screen hint
  shows this).

> In `npm run dev` there is **no install button** — the service worker is intentionally
> disabled in development.

---

## How to test offline

1. Run `npm run build && npm run start`, open `http://localhost:3000` in **Chrome**, and
   **load the assessment once while online** (this caches it and registers the worker).
2. Open **DevTools** (`Cmd+Option+I`) → **Network** tab → switch **"No throttling"** to
   **Offline** (or **Application → Service Workers → tick Offline**).
3. Play through the games — answers save, recordings capture, face-detection runs. The
   **"Offline · N saved"** pill appears at the bottom-left.
4. Switch back to **Online** → the pill changes to **"Syncing N…"** then disappears as
   everything uploads to the backend.

---

## Where to see the offline database

In **DevTools → Application** tab → left sidebar → **Storage → IndexedDB**:

```
IndexedDB
└─ neurobloom-offline
   ├─ sessions     ← the assessment (name, age, UUID, serverCreated)
   ├─ saveQueue    ← queued game answers waiting to sync
   └─ mediaQueue   ← queued audio / image / video blobs
```

Click any store to inspect the rows. While **offline** they fill up; after you go
**online**, watch them **empty out** as the sync engine drains them — that is your proof
it is working.

In the same **Application** tab you can also check:
- **Service Workers** — confirm `sw.js` is "activated and running" (production only).
- **Manifest** — see the app name, icons, and theme color.

---

## Development vs. production

| Mode                         | Service worker | Use it for                         |
| ---------------------------- | -------------- | ---------------------------------- |
| `npm run dev`                | **Off**        | Everyday coding (clean, no caching)|
| `npm run build && npm run start` | **On**     | Testing install + offline + sync   |

Testing offline **must** be done in production mode — dev mode can't cache reliably and
its hot-reload connection always errors when offline.
