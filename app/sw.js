// Kassepris service worker: gjør appen tilgjengelig uten nett.
// Øk versjonsnummeret hver gang du legger ut en ny versjon.
const VERSJON = 'kassepris-v2';
const FILER = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSJON).then(c => c.addAll(FILER)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSJON).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Selve appen: prøv nett først (så du får nyeste versjon), bruk lagret kopi uten nett.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const kopi = res.clone(); caches.open(VERSJON).then(c => c.put('./index.html', kopi)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }

  // Fonter og egne filer: bruk lagret kopi, hent ny i bakgrunnen.
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open(VERSJON).then(async c => {
      const lagret = await c.match(req);
      const nett = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => lagret);
      return lagret || nett;
    }));
  }
});
