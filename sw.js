/* Service worker: bewaart de site op het toestel, zodat Het Speelhuys ook zonder internet werkt.
   Eigen bestanden: eerst uit de opslag (snel), en op de achtergrond verversen.
   Letters van Google Fonts: één keer ophalen en daarna uit de opslag. */
const VERSIE = 'speelhuys-v6';
const LETTERS = 'speelhuys-letters-v1';
const KERN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/stijl.css',
  './js/geluid.js',
  './js/muziek.js',
  './js/duiten.js',
  './js/pronk.js',
  './js/seizoen.js',
  './js/les.js',
  './js/ganzenbord.js',
  './js/sjoelen.js',
  './js/molenspel.js',
  './js/knikkeren.js',
  './js/tollen.js',
  './js/huis.js',
  './js/app.js',
  './iconen/icoon-192.png',
  './iconen/icoon-512.png',
  './iconen/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIE).then((c) => c.addAll(KERN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((sleutels) => Promise.all(sleutels.filter((k) => k !== VERSIE && k !== LETTERS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const verzoek = e.request;
  if (verzoek.method !== 'GET') return;
  const url = new URL(verzoek.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(VERSIE).then(async (c) => {
        const opgeslagen = await c.match(verzoek, { ignoreSearch: true });
        const vers = fetch(verzoek)
          .then((antwoord) => { if (antwoord.ok) c.put(verzoek, antwoord.clone()); return antwoord; })
          .catch(() => opgeslagen || (verzoek.mode === 'navigate' ? c.match('./index.html') : undefined));
        return opgeslagen || vers;
      })
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(LETTERS).then(async (c) => {
        const opgeslagen = await c.match(verzoek);
        if (opgeslagen) return opgeslagen;
        try {
          const antwoord = await fetch(verzoek);
          c.put(verzoek, antwoord.clone());
          return antwoord;
        } catch (err) {
          return Response.error();
        }
      })
    );
  }
});
