// NeuroBloom service worker — runtime caching for offline use.
//
// Strategy:
//  - Static assets (Next chunks, images, fonts, sounds): stale-while-revalidate,
//    so once a page has been opened online its assets work offline afterwards.
//  - Page navigations: network-first, falling back to the cached page, then to a
//    branded /offline page.
//  - API requests (/api/*) and non-GET requests are never cached — the app's
//    IndexedDB layer handles offline data, and mutations must hit the network.
//
// Data safety: this SW never intercepts POSTs, so offline saves are queued by the
// app (IndexedDB) and synced later, not silently dropped here.

const CACHE = "neurobloom-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/sounds/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico|mp3|wav|webm)$/i.test(
      url.pathname
    )
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs; leave everything else (POSTs, cross-origin
  // Cloudinary/Supabase calls, /api/*) to the network untouched.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
