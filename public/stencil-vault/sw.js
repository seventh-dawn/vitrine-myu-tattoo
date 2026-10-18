// App-shell cache so the app opens with no network at a convention.
// Bump VERSION when shipping changes to force a fresh shell.
const VERSION = 'sv-v4';
const SHELL = [
  './index.html', './styles.css', './app.js', './auth.js', './config.js', './drive.js',
  './store.js', './preview.js', './icons.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // Stale-while-revalidate: instant from cache, refreshed for next launch.
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = req.mode === 'navigate'
        ? await cache.match('./index.html', { ignoreSearch: true })
        : await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then(res => {
        if (res.ok) cache.put(req.mode === 'navigate' ? './index.html' : req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(fresh); return cached; }
      return (await fresh) || new Response('Offline', { status: 503 });
    })());
    return;
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      cache.put(req, res.clone());
      return res;
    })());
  }
  // Everything else (Google APIs) goes straight to the network.
});
