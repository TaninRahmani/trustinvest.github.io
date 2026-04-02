const CACHE = "trustinves-pwa-v6"; // <-- bump this every time you update

const ASSETS = [
  "/trustinvest.github.io/",
  "/trustinvest.github.io/index.html",
  "/trustinvest.github.io/manifest.json",
  "/trustinvest.github.io/icon-192.png",
  "/trustinvest.github.io/icon-512.png",
  "trustinvest.github.io/sw.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first for HTML (so updates appear), cache-first for others
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin requests
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // If it's navigation / HTML, try network first
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match("/trustinvest.github.io/index.html");
      }
    })());
    return;
  }

  // For other files, cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
