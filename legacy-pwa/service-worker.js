/* Pulse Health Tracker — Service Worker v2
   Network-first for the main page (so updates appear immediately).
   Cache-first for assets (fonts, icons, libraries) for speed.
*/
const CACHE_NAME = 'pulse-v2.0.0';
const ASSETS = [
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // NETWORK-FIRST for HTML / navigation requests (so app updates immediately)
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('/pulse-health-tracker/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // CACHE-FIRST for everything else (assets, fonts, libraries)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      }).catch(() => undefined);
    })
  );
});

// Listen for skip-waiting message from page (instant updates)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
