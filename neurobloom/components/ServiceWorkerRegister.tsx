"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) — but ONLY in production.
 *
 * In development a caching service worker serves stale dev chunks and stale HTML,
 * which causes confusing hydration mismatches and "offline" fetch errors. So in
 * dev we instead actively unregister any existing worker and clear its caches,
 * which self-heals a browser that previously registered one while testing.
 *
 * Test offline with a production build: `npm run build && npm run start`.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Dev: tear down any SW + caches left over from earlier testing.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });
  }, []);

  return null;
}
