/* Service worker: bewaart de site op het toestel, zodat Het Speelhuys ook zonder internet werkt.
   - De pagina zelf komt eerst van internet (dan zie je meteen de nieuwste versie), zonder internet uit de opslag.
   - Stijl en scripts hebben een versienummer in hun adres (?v=11) en veranderen dus nooit: die komen uit de opslag.
     Zo kan een nieuwe pagina nooit met oude scripts worden gecombineerd.
   - Letters van Google Fonts: één keer ophalen en daarna uit de opslag.
   Bij een nieuwe versie: verhoog V hier en het ?v= nummer in index.html. */
const V = '25';
const VERSIE = 'speelhuys-v' + V;
const LETTERS = 'speelhuys-letters-v1';
const BESTANDEN = [
  'css/stijl.css',
  'js/geluid.js',
  'js/muziek.js',
  'js/duiten.js',
  'js/pronk.js',
  'js/seizoen.js',
  'js/les.js',
  'js/personen.js',
  'js/ganzenbord.js',
  'js/sjoelen.js',
  'js/molenspel.js',
  'js/damregels.js',
  'js/dammen.js',
  'js/klaverregels.js',
  'js/klaverjassen.js',
  'js/knikkeren.js',
  'js/tollen.js',
  'js/huis.js',
  'js/app.js',
];
const KERN = [
  './',
  './manifest.webmanifest',
  './iconen/icoon-192.png',
  './iconen/icoon-512.png',
  './iconen/apple-touch-icon.png'
].concat(BESTANDEN.map((b) => './' + b + '?v=' + V));

self.addEventListener('install', (e) => {
  // 'reload': altijd vers van internet, nooit uit de gewone browseropslag
  e.waitUntil(
    caches.open(VERSIE)
      .then((c) => c.addAll(KERN.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
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
    if (verzoek.mode === 'navigate') {
      // de pagina: eerst internet, dan de opslag
      e.respondWith(
        fetch(verzoek.url, { cache: 'no-cache', credentials: 'same-origin' })
          .then((antwoord) => {
            if (antwoord.ok) { const kopie = antwoord.clone(); caches.open(VERSIE).then((c) => c.put('./', kopie)); }
            return antwoord;
          })
          .catch(() => caches.open(VERSIE).then((c) => c.match('./')))
      );
      return;
    }
    // stijl, scripts, iconen: eerst de opslag (exact adres, met versienummer), anders internet
    e.respondWith(
      caches.open(VERSIE).then(async (c) => {
        const opgeslagen = await c.match(verzoek);
        if (opgeslagen) return opgeslagen;
        try {
          const antwoord = await fetch(verzoek, { cache: 'no-cache' });
          if (antwoord.ok) c.put(verzoek, antwoord.clone());
          return antwoord;
        } catch (err) {
          return (await c.match(verzoek, { ignoreSearch: true })) || Response.error();
        }
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
