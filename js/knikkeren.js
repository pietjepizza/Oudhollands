/* Knikkeren, schermvullend: een potje in de zandbak, om de beurt, tegen een buur of samen.

   De regels van het potje, zoals op het schoolplein:
   - iedereen zet vijf knikkers in en gooit ze om de beurt vanaf de streep naar het potje;
   - wiens knikker het dichtst bij het potje ligt, mag beginnen met tikken;
   - je tikt om de beurt een knikker naar het potje, en raak is nog een keer;
   - wie de laatste knikker in het potje tikt, wint de hele pot.

   Overgenomen van succesvolle schiet- en mikspellen:
   - trekken en loslaten, als een katapult (Angry Birds), met een duimpje achter de knikker;
   - een richtlijn die laat zien waar je knikker een andere raakt en welke kant die op gaat
     (8 Ball Pool, Carrom Pool); de kracht schat je zelf in met een krachtring;
   - eerlijke natuurkunde zonder toeval: elk schot loopt precies zoals je het mikt (Golf Clash);
   - een tegenstander met een gezicht die je ziet mikken, en iets om voor te spelen: de pot;
   - meteen nog een potje, en een ladder van buren die je een voor een verslaat. */
(function () {
  'use strict';

  // ============================================================
  // DE ZANDBAK (logische maten)
  // ============================================================
  const W = 400, H = 560, RAND = 20;
  const BIN = { l: RAND, r: W - RAND, t: RAND, b: H - RAND };
  const POT = { x: 200, y: 166, r: 18 };
  const KUIL = 21;                         // de schuine rand rond het potje
  const VAL = POT.r * 0.78;                // zo dicht bij het midden en langzaam genoeg: hij valt erin
  const LIJN = 446;                        // de streep
  const WERP_Y = LIJN + 17;                // hier ligt de knikker in je hand
  const RK = 9;                            // straal van een knikker
  const WRIJVING = 250, DEMPING = 0.35, HELLING = 340, VANG = 115, MUUR = 0.45, BOTS = 0.92;
  const VMAX = 680, TREK_MIN = 7, TREK_MAX = 118, GIDS = 170;
  const DT = 1 / 120;
  const INZET = 5;

  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const afstandTot = (k) => Math.hypot(k.x - POT.x, k.y - POT.y);

  // Hoe ver rolt een knikker in het zand? (vertraging WRIJVING + DEMPING * v)
  function afstand(v0, v1) {
    return (v0 - v1) / DEMPING - (WRIJVING / (DEMPING * DEMPING)) * Math.log((WRIJVING + DEMPING * v0) / (WRIJVING + DEMPING * v1));
  }
  // de beginsnelheid om een afstand af te leggen en dan nog v1 over te hebben
  function snelheidVoor(s, v1) {
    v1 = v1 || 0;
    let lo = v1, hi = VMAX * 1.6;
    for (let i = 0; i < 34; i++) { const m = (lo + hi) / 2; if (afstand(m, v1) < s) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const trekVoor = (v) => klem(v / VMAX * TREK_MAX, TREK_MIN, TREK_MAX);

  // ============================================================
  // NATUURKUNDE: zonder toeval, zodat elk schot gaat zoals het gemikt is
  // ============================================================
  function stap(lijst, cb) {
    for (const k of lijst) {
      if (!k.veld) continue;
      const dx = POT.x - k.x, dy = POT.y - k.y, d = Math.hypot(dx, dy);
      const opRand = d < KUIL;
      if (opRand && d > 0.5) { k.vx += dx / d * HELLING * DT; k.vy += dy / d * HELLING * DT; }
      let v = Math.hypot(k.vx, k.vy);
      if (v > 0) {
        const dv = (WRIJVING + v * DEMPING) * DT;
        if (v <= dv || (!opRand && v < 1.5)) { k.vx = 0; k.vy = 0; v = 0; } else { const f = (v - dv) / v; k.vx *= f; k.vy *= f; v -= dv; }
      }
      k.x += k.vx * DT; k.y += k.vy * DT;
      // de houten rand
      if (k.x < BIN.l + RK) { k.x = BIN.l + RK; if (k.vx < 0) { if (cb) cb.muur(k, -k.vx); k.vx = -k.vx * MUUR; } }
      if (k.x > BIN.r - RK) { k.x = BIN.r - RK; if (k.vx > 0) { if (cb) cb.muur(k, k.vx); k.vx = -k.vx * MUUR; } }
      if (k.y < BIN.t + RK) { k.y = BIN.t + RK; if (k.vy < 0) { if (cb) cb.muur(k, -k.vy); k.vy = -k.vy * MUUR; } }
      if (k.y > BIN.b - RK) { k.y = BIN.b - RK; if (k.vy > 0) { if (cb) cb.muur(k, k.vy); k.vy = -k.vy * MUUR; } }
      // het potje: langzaam genoeg erin, te hard eroverheen (met een hobbeltje)
      const d2 = Math.hypot(POT.x - k.x, POT.y - k.y);
      if (d2 < VAL && v < VANG) { k.veld = false; k.inPot = true; k.vx = 0; k.vy = 0; if (cb) cb.pot(k); continue; }
      if (d2 < POT.r) { if (!k.over && v >= VANG) { k.over = true; k.vx *= 0.86; k.vy *= 0.86; } } else k.over = false;
    }
    for (let i = 0; i < lijst.length; i++) {
      const a = lijst[i];
      if (!a.veld) continue;
      for (let j = i + 1; j < lijst.length; j++) {
        const b = lijst[j];
        if (!b.veld) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * RK * RK || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (2 * RK - d) / 2;
        a.x -= nx * over; a.y -= ny * over; b.x += nx * over; b.y += ny * over;
        const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vrel < 0) {
          const imp = -(1 + BOTS) * vrel / 2;
          a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny;
          if (cb) cb.bots(a, b, -vrel);
        }
      }
    }
  }
  const stil = (lijst) => lijst.every((k) => !k.veld || (k.vx === 0 && k.vy === 0));

  // Een schot in gedachten afspelen (voor de tegenstander): hoeveel gaan erin, waar eindigt de knikker?
  function simuleer(lijst, i, hoek, v) {
    const kopie = lijst.map((k) => ({ x: k.x, y: k.y, vx: 0, vy: 0, veld: k.veld, inPot: k.inPot, over: false }));
    const k = kopie[i];
    if (!k.veld) { k.veld = true; }
    k.vx = Math.cos(hoek) * v; k.vy = Math.sin(hoek) * v;
    let gepot = 0, eerst = false;
    const cb = { muur() {}, bots() {}, pot(q) { gepot++; if (q === k) eerst = true; } };
    for (let n = 0; n < 1500; n++) { stap(kopie, cb); if (stil(kopie)) break; }
    const leeg = !kopie.some((q) => q.veld);
    return { gepot, leeg, eigen: eerst, eind: k.veld ? afstandTot(k) : 0 };
  }

  // Waar raakt een schot het eerst iets? (voor de richtlijn)
  function voorspel(k, hoek, lijst) {
    const ux = Math.cos(hoek), uy = Math.sin(hoek);
    let lengte = GIDS, soort = 'vrij', doel = null;
    for (const o of lijst) {
      if (o === k || !o.veld) continue;
      const ox = o.x - k.x, oy = o.y - k.y, t = ox * ux + oy * uy;
      if (t <= 0) continue;
      const p2 = ox * ox + oy * oy - t * t, r2 = 4 * RK * RK;
      if (p2 > r2) continue;
      const tt = t - Math.sqrt(r2 - p2);
      if (tt < lengte) { lengte = Math.max(0, tt); soort = 'knikker'; doel = o; }
    }
    const tx = ux > 1e-6 ? (BIN.r - RK - k.x) / ux : ux < -1e-6 ? (BIN.l + RK - k.x) / ux : Infinity;
    const ty = uy > 1e-6 ? (BIN.b - RK - k.y) / uy : uy < -1e-6 ? (BIN.t + RK - k.y) / uy : Infinity;
    const tw = Math.min(tx, ty);
    if (tw < lengte) { lengte = Math.max(0, tw); soort = 'muur'; doel = tx < ty ? 'x' : 'y'; }
    const px = POT.x - k.x, py = POT.y - k.y, tp = px * ux + py * uy;
    const overPot = tp > 0 && tp < lengte + RK && px * px + py * py - tp * tp < POT.r * POT.r;
    const cx = k.x + ux * lengte, cy = k.y + uy * lengte;
    const uit = { ux, uy, lengte, soort, doel, overPot, cx, cy };
    if (soort === 'knikker') {
      const nx = doel.x - cx, ny = doel.y - cy, nl = Math.hypot(nx, ny) || 1;
      uit.nx = nx / nl; uit.ny = ny / nl;
    }
    return uit;
  }

  // ============================================================
  // TEGENSTANDERS: ze rekenen hun schoten door, maar hun hand trilt een beetje
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', niveau: 1, hoek: 4.5, zij: 4, kracht: 0.14, vast: 22, gooi: [6, 0.18], kies: 0.35, ketsen: false, beloning: 30,
      zegt: { start: ['Ik win de pot!'], begint: ['Ik mag eerst!'], raak: ['Raak!', 'Hij zit!'], mis: ['Oeps!', 'Bijna!'], laatste: ['Nu komt het erop aan!'], wint: ['De pot is van mij!'], verliest: ['Jij bent goed, zeg!'] } },
    { id: 'grietje', niveau: 2, hoek: 3.2, zij: 3.4, kracht: 0.1, vast: 17, gooi: [4.5, 0.14], kies: 0.15, ketsen: false, beloning: 45,
      zegt: { start: ['Rustig mikken...'], begint: ['Ik begin.'], raak: ['Zo!', 'Erin!'], mis: ['Ach.', 'Net niet.'], laatste: ['De laatste...'], wint: ['Gewonnen!'], verliest: ['Knap gespeeld!'] } },
    { id: 'kees', niveau: 3, hoek: 2.7, zij: 3.3, kracht: 0.09, vast: 15, gooi: [3.6, 0.11], kies: 0.05, ketsen: true, beloning: 60,
      zegt: { start: ['Kalm als een molen.'], begint: ['Ik mag.'], raak: ['Dat is er een.', 'Fijn gemalen.'], mis: ['Hm.', 'Tegenwind.'], laatste: ['Nog eentje.'], wint: ['De pot is binnen!'], verliest: ['Petje af.'] } },
    { id: 'burgemeester', niveau: 4, hoek: 2.1, zij: 2.8, kracht: 0.07, vast: 12, gooi: [3, 0.09], kies: 0, ketsen: true, beloning: 80,
      zegt: { start: ['Let op, zo doe je dat.'], begint: ['Uiteraard begin ik.'], raak: ['Uiteraard.', 'Zoals verwacht.'], mis: ['Onmogelijk!', 'Het zand ligt scheef.'], laatste: ['Dit is een formaliteit.'], wint: ['Zoals verwacht.'], verliest: ['Hoe is het mogelijk!'] } }
  ];
  // de eigen knikkers van de buren; die van jou komen uit de pronkkast
  const KNIKKER_VAN = {
    jantje: { a: '#F6C2A8', b: '#C2533A', c: '#6A2214', ader: null, glans: 0.35 },
    grietje: { a: '#E2F4D2', b: '#5E9A4E', c: '#21441C', ader: '#F2EED8', glans: 0.6 },
    kees: { a: '#FFFFFF', b: '#E2DED4', c: '#9C9484', ader: '#9A8F7C', glans: 0.45 },
    burgemeester: { a: '#FFF3C4', b: '#E2B44B', c: '#86560F', ader: '#FFFBEA', glans: 0.85 },
    twee: { a: '#DDE8FF', b: '#4C79C9', c: '#1B3170', ader: '#F4F0D8', glans: 0.7 }
  };
  let ruis = Math.random;
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = ruis(); while (v === 0) v = ruis(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const RAD = Math.PI / 180;

  // De trillende hand: een afwijking in richting (ook een vaste, zodat korte schoten niet altijd raak zijn) en in kracht
  function trillend(hoek, v, t, d, factor) {
    const f = factor || 1;
    return {
      hoek: hoek + gauss() * f * (t.hoek * RAD + (t.zij || 0) / Math.max(30, d || 80)),
      v: klem(v * (1 + gauss() * t.kracht * f) + gauss() * (t.vast || 0) * f, 20, VMAX)
    };
  }
  // Gooien vanaf de streep: recht op het potje af, zo hard dat hij in het midden stil zou liggen.
  // Van zo ver weg gooit niemand precies; daarom trilt de hand hier wat meer.
  function computerGooi(t) {
    const x = klem(POT.x + gauss() * 46, BIN.l + RK + 20, BIN.r - RK - 20);
    const dx = POT.x - x, dy = POT.y - WERP_Y, d = Math.hypot(dx, dy);
    const [gh, gk] = t.gooi || [4, 0.12];
    return { x, hoek: Math.atan2(dy, dx) + gauss() * gh * RAD, v: klem(snelheidVoor(d + 3) * (1 + gauss() * gk), 40, VMAX) };
  }

  // Tikken: bekijk een handvol schoten per knikker, speel ze een paar keer met een trillende hand af en kies het beste
  function kandidaten(lijst, t) {
    const uit = [];
    lijst.forEach((k, i) => {
      if (!k.veld) return;
      const dx = POT.x - k.x, dy = POT.y - k.y, d = Math.hypot(dx, dy);
      const h0 = Math.atan2(dy, dx);
      [2, 10, 22].forEach((extra) => [0, -2.5, 2.5].forEach((dh) => uit.push({ i, hoek: h0 + dh * RAD, v: snelheidVoor(d + extra) })));
      if (!t.ketsen) return;
      // ketsen: raak een andere knikker zo dat die naar het potje rolt
      lijst.forEach((o) => {
        if (o === k || !o.veld) return;
        const ox = POT.x - o.x, oy = POT.y - o.y, od = Math.hypot(ox, oy);
        if (od < 1 || od > 190) return;
        const gx = o.x - ox / od * 2 * RK, gy = o.y - oy / od * 2 * RK;
        const ax = gx - k.x, ay = gy - k.y, ad = Math.hypot(ax, ay);
        if (ad < 2 || ad > 230) return;
        const cos = (ax * ox + ay * oy) / (ad * od);
        if (cos < 0.55) return;
        const vNodig = snelheidVoor(od + 8) / (cos * (1 + BOTS) / 2);
        const v0 = snelheidVoor(ad, vNodig);
        if (v0 > VMAX) return;
        uit.push({ i, hoek: Math.atan2(ay, ax), v: v0, kets: true });
      });
    });
    return uit;
  }
  function beoordeel(lijst, kand, t, n) {
    let som = 0, eind = 0;
    const d = afstandTot(lijst[kand.i]);
    for (let s = 0; s < n; s++) {
      const sch = trillend(kand.hoek, kand.v, t, d);
      const r = simuleer(lijst, kand.i, sch.hoek, sch.v);
      som += r.gepot ? r.gepot + (r.leeg ? 2 : 0) : 0;
      eind += r.eind;
    }
    return som / n * 100 - eind / n * 0.08;
  }
  async function computerDuim(lijst, t, mijnId) {
    const lijstKand = kandidaten(lijst, t);
    let beste = [];
    for (let i = 0; i < lijstKand.length; i++) {
      const c = lijstKand[i];
      c.waarde = beoordeel(lijst, c, t, 3);
      beste.push(c);
      if (i % 24 === 23) { await new Promise((r) => setTimeout(r, 0)); if (mijnId !== spelId) return null; }
    }
    beste.sort((a, b) => b.waarde - a.waarde);
    let keuze = beste[0];
    if (beste.length > 2 && ruis() < t.kies) keuze = beste[1 + Math.floor(ruis() * Math.min(5, beste.length - 1))];
    const sch = trillend(keuze.hoek, keuze.v, t, afstandTot(lijst[keuze.i]));
    return { i: keuze.i, hoek: sch.hoek, v: sch.v };
  }

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, ui = {}, doek, ctx, achter = null, gebouwd = false;
  let schaal = 1, dpr = 1, raf = 0, vorigeT = 0, rest = 0, tijdSchaal = 1;
  let modus = 'tegen', tegen = TEGENSTANDERS[0], potjeNr = 0;
  let spelers = [], aan = 0, staat = 'gooien', fase = 'klaar', spelId = 0;
  let knikkers = [], werp = null, mik = null, schotGepot = 0, laatstePotter = -1, winnaar = -1, meting = null;
  let mikX = POT.x, deeltjes = [], ringen = [], spoorPunten = [], hintTot = 0;
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 60) : ms));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const gezichten = () => (window.Personen ? Personen.gezicht : {});
  const naamVan = (id) => (window.Personen && Personen.namen[id]) || id;
  const gewonnen = () => (window.Duiten ? Duiten.veld('knikker-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const eigenStijl = () => (window.Pronk ? Pronk.stijl('knikkers') : { a: '#E8CFAB', b: '#B88B5C', c: '#7A5432', ader: null, glans: 0.25 });
  const potIcoon = '<svg viewBox="0 0 40 26" aria-hidden="true"><ellipse cx="20" cy="14" rx="18" ry="10" fill="#C9A86E"/><ellipse cx="20" cy="14" rx="12" ry="6.6" fill="#3A2612"/><ellipse cx="22" cy="16" rx="8" ry="3.6" fill="#6E4E26" opacity=".7"/><circle cx="17" cy="13" r="3.4" fill="#E8CFAB"/><circle cx="23" cy="14.5" r="3.4" fill="#4C79C9"/></svg>';
  const mini = (st, leeg) => `<i class="kn-mini${leeg ? ' leeg' : ''}" style="--a:${st.a};--b:${st.b};--c:${st.c}"></i>`;

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('kn-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven kn-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="sj-stand kn-stand" type="button" aria-haspopup="dialog" aria-label="Kies je tegenstander"></button>
      <button class="mo-knop kn-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop kn-meer" type="button" aria-label="Kies je tegenstander" title="Kies je tegenstander" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden kn-midden"><div class="kn-veldvak">
      <canvas class="kn-doek" role="application" tabindex="0" aria-label="De zandbak met het potje. Druk op een knikker, trek naar achteren en laat los. Met de pijltjes mik je, met de spatiebalk schiet je."></canvas>
      <div class="sj-pops kn-pops" aria-hidden="true"></div>
      <div class="sj-kaart kn-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder kn-onder">
      <div class="mo-kaart kn-zelf">
        <span class="mo-gezicht kn-zelf-beeld"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="kn-hand" aria-hidden="true"></span></span>
        <span class="mo-doe"></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu kn-menu" role="dialog" aria-modal="true" aria-label="Tegen wie knikker je?" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Tegen wie knikker je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders sj-keuzes kn-keuzes"></div>
        <div class="mo-menu-voet">
          <button class="mo-knop mo-geluid" type="button" aria-pressed="true" aria-label="Geluid" title="Geluid">${icoon('geluid')}<i class="streep"></i></button>
          <button class="mo-knop mo-muziek" type="button" aria-pressed="false" aria-label="Muziek" title="Muziek">${icoon('muziek')}<i class="streep"></i></button>
          <button class="mo-knop mo-nieuw" type="button" aria-label="Opnieuw beginnen" title="Opnieuw beginnen">${icoon('opnieuw')}</button>
        </div>
      </div>
    </div>`);
    const meld = html('<p class="sr-only" aria-live="polite"></p>');
    [boven, midden, onder, menu, meld].forEach((e) => podium.appendChild(e));
    ui = {
      stand: boven.querySelector('.kn-stand'), midden, vak: midden.querySelector('.kn-veldvak'), pops: midden.querySelector('.kn-pops'),
      kaart: midden.querySelector('.kn-kaart'), zelf: onder.querySelector('.kn-zelf'), menu, keuzes: menu.querySelector('.kn-keuzes'), meld
    };
    doek = midden.querySelector('.kn-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', neer);
    doek.addEventListener('pointermove', beweeg);
    doek.addEventListener('pointerup', los);
    doek.addEventListener('pointercancel', () => { if (mik && !mik.computer) mik = null; schuift = false; doek.classList.remove('mikt'); });
    doek.addEventListener('keydown', toets);
    ui.stand.addEventListener('click', openMenu);
    boven.querySelector('.kn-meer').addEventListener('click', openMenu);
    boven.querySelector('.kn-vraag').addEventListener('click', () => { if (window.Les) Les.toon('knikkeren'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { achter = null; });
    gebouwd = true;
  }

  // De zandbak zo groot mogelijk, 5 bij 7
  function pasMaatAan() {
    if (!ui.midden) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const b = Math.floor(Math.min(r.width - 10, (r.height - 6) * W / H, 560));
    podium.style.setProperty('--veld', Math.max(180, b) + 'px');
    schaal = Math.max(180, b) / W;
    dpr = Math.min(3, window.devicePixelRatio || 1);
    doek.width = Math.round(W * schaal * dpr);
    doek.height = Math.round(H * schaal * dpr);
    achter = null;
    teken();
  }

  // ============================================================
  // TEKENEN: de zandbak een keer op een eigen doek, daarna alleen wat beweegt
  // ============================================================
  function maakAchtergrond() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    g.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    let zaad = 11;
    const rnd = () => { zaad = (zaad * 16807) % 2147483647; return (zaad - 1) / 2147483646; };

    // de houten bak: vier planken met verstekhoeken
    const planken = [
      [[0, 0], [W, 0], [W - RAND, RAND], [RAND, RAND], 'boven'],
      [[0, H], [RAND, H - RAND], [W - RAND, H - RAND], [W, H], 'onder'],
      [[0, 0], [RAND, RAND], [RAND, H - RAND], [0, H], 'links'],
      [[W, 0], [W, H], [W - RAND, H - RAND], [W - RAND, RAND], 'rechts']
    ];
    const kleur = { boven: ['#9A6838', '#7A4E28'], links: ['#8C5C30', '#6E4522'], rechts: ['#6A4220', '#55341A'], onder: ['#5E3A1C', '#4A2C14'] };
    planken.forEach(([a, b2, c2, d, kant]) => {
      g.save();
      g.beginPath(); g.moveTo(...a); g.lineTo(...b2); g.lineTo(...c2); g.lineTo(...d); g.closePath();
      const lg = kant === 'boven' || kant === 'onder' ? g.createLinearGradient(0, kant === 'boven' ? 0 : H, 0, kant === 'boven' ? RAND : H - RAND) : g.createLinearGradient(kant === 'links' ? 0 : W, 0, kant === 'links' ? RAND : W - RAND, 0);
      lg.addColorStop(0, kleur[kant][0]); lg.addColorStop(1, kleur[kant][1]);
      g.fillStyle = lg; g.fill();
      g.clip();
      // nerf in de lengte van de plank
      g.lineWidth = 0.8;
      for (let i = 0; i < 9; i++) {
        g.strokeStyle = `rgba(40, 20, 6, ${(0.12 + rnd() * 0.16).toFixed(2)})`;
        g.beginPath();
        const s = 2 + i * 2 + rnd();
        if (kant === 'boven' || kant === 'onder') {
          const y0 = kant === 'boven' ? s : H - s;
          g.moveTo(0, y0); for (let x = 0; x <= W; x += 40) g.lineTo(x, y0 + Math.sin(x / 37 + i) * 0.9);
        } else {
          const x0 = kant === 'links' ? s : W - s;
          g.moveTo(x0, 0); for (let y = 0; y <= H; y += 40) g.lineTo(x0 + Math.sin(y / 41 + i) * 0.9, y);
        }
        g.stroke();
      }
      // een kwast in het hout
      const kx = kant === 'boven' || kant === 'onder' ? 60 + rnd() * (W - 120) : (kant === 'links' ? RAND / 2 : W - RAND / 2);
      const ky = kant === 'boven' ? RAND / 2 : kant === 'onder' ? H - RAND / 2 : 80 + rnd() * (H - 160);
      g.fillStyle = 'rgba(50, 24, 8, .45)'; g.beginPath(); g.ellipse(kx, ky, kant === 'links' || kant === 'rechts' ? 3 : 6, kant === 'links' || kant === 'rechts' ? 6 : 3, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    // naden op de hoeken en een lichte bovenrand
    g.strokeStyle = 'rgba(30, 14, 4, .55)'; g.lineWidth = 1.2;
    [[0, 0, RAND, RAND], [W, 0, W - RAND, RAND], [0, H, RAND, H - RAND], [W, H, W - RAND, H - RAND]].forEach(([a, b2, c2, d]) => { g.beginPath(); g.moveTo(a, b2); g.lineTo(c2, d); g.stroke(); });
    g.strokeStyle = 'rgba(255, 230, 190, .28)'; g.lineWidth = 1.5; g.strokeRect(1.5, 1.5, W - 3, H - 3);
    // ijzeren hoekbeslag met spijkers
    [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, sx, sy]) => {
      g.fillStyle = '#2E2A26';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + sx * 30, y); g.lineTo(x + sx * 30, y + sy * 8); g.lineTo(x + sx * 8, y + sy * 8); g.lineTo(x + sx * 8, y + sy * 30); g.lineTo(x, y + sy * 30); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + (sx > 0 ? 0 : -30), y + (sy > 0 ? 0 : -1.5), 30, 1.5);
      [[18, 4], [4, 18], [4, 4]].forEach(([a, b2]) => {
        g.fillStyle = '#4A443E'; g.beginPath(); g.arc(x + sx * a, y + sy * b2, 2.1, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x + sx * a - 0.6, y + sy * b2 - 0.6, 0.8, 0, Math.PI * 2); g.fill();
      });
    });

    // het zand
    g.save();
    g.beginPath(); g.rect(BIN.l, BIN.t, BIN.r - BIN.l, BIN.b - BIN.t); g.clip();
    const zg = g.createRadialGradient(W * 0.42, H * 0.36, 30, W / 2, H / 2, H * 0.72);
    zg.addColorStop(0, '#EBD5A6'); zg.addColorStop(0.6, '#DFC490'); zg.addColorStop(1, '#C7A56C');
    g.fillStyle = zg; g.fillRect(BIN.l, BIN.t, BIN.r - BIN.l, BIN.b - BIN.t);
    // geharkte boogjes
    g.lineWidth = 1.4;
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = i % 2 ? 'rgba(255, 246, 222, .16)' : 'rgba(120, 86, 40, .09)';
      g.beginPath(); g.arc(W / 2, H + 220, 250 + i * 19, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    }
    // korrels
    for (let i = 0; i < 4200; i++) {
      const x = BIN.l + rnd() * (BIN.r - BIN.l), y = BIN.t + rnd() * (BIN.b - BIN.t);
      g.fillStyle = rnd() > 0.5 ? `rgba(120, 86, 40, ${(0.12 + rnd() * 0.18).toFixed(2)})` : `rgba(255, 248, 228, ${(0.18 + rnd() * 0.25).toFixed(2)})`;
      g.fillRect(x, y, 0.8 + rnd() * 1.2, 0.8 + rnd() * 1.2);
    }
    // steentjes
    for (let i = 0; i < 22; i++) {
      const x = BIN.l + 12 + rnd() * (BIN.r - BIN.l - 24), y = BIN.t + 12 + rnd() * (BIN.b - BIN.t - 24);
      if (Math.hypot(x - POT.x, y - POT.y) < KUIL + 14 || Math.abs(y - LIJN) < 8) continue;
      const rr = 1.4 + rnd() * 2.6;
      g.fillStyle = 'rgba(80, 55, 25, .3)'; g.beginPath(); g.ellipse(x + 0.8, y + 0.9, rr, rr * 0.75, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgb(${150 + rnd() * 50 | 0}, ${125 + rnd() * 40 | 0}, ${95 + rnd() * 30 | 0})`;
      g.beginPath(); g.ellipse(x, y, rr, rr * 0.75, rnd() * 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.35, 0, Math.PI * 2); g.fill();
    }
    // knieafdrukken achter de streep, waar je zit te mikken
    [[W / 2 - 46, H - RAND - 26], [W / 2 + 46, H - RAND - 26]].forEach(([x, y]) => {
      const kg = g.createRadialGradient(x, y - 2, 2, x, y, 22);
      kg.addColorStop(0, 'rgba(110, 78, 36, .22)'); kg.addColorStop(1, 'rgba(110, 78, 36, 0)');
      g.fillStyle = kg; g.beginPath(); g.ellipse(x, y, 24, 15, 0, 0, Math.PI * 2); g.fill();
    });
    // de streep, met een stokje in het zand getrokken
    g.lineCap = 'round';
    const streep = (dy, kleurS, b) => {
      g.strokeStyle = kleurS; g.lineWidth = b;
      g.beginPath(); g.moveTo(BIN.l + 14, LIJN + dy);
      for (let x = BIN.l + 14; x <= BIN.r - 14; x += 12) g.lineTo(x, LIJN + dy + Math.sin(x / 23) * 0.9 + (rnd() - 0.5) * 0.5);
      g.stroke();
    };
    streep(1.6, 'rgba(255, 244, 214, .55)', 1.6);
    streep(0, 'rgba(92, 62, 26, .62)', 2.8);
    // het stokje
    g.save(); g.translate(BIN.r - 46, BIN.b - 14); g.rotate(-0.18);
    g.fillStyle = 'rgba(60, 40, 15, .3)'; g.fillRect(-40, 2, 82, 4);
    g.fillStyle = '#7A5230'; g.fillRect(-42, -2, 82, 4.4);
    g.fillStyle = '#9A7044'; g.fillRect(-42, -2, 82, 1.4);
    g.strokeStyle = '#6A4626'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, -1); g.lineTo(20, -9); g.stroke();
    g.restore();
    // schaduw van de rand op het zand
    const schaduw = (x, y, b, h, x1, y1, x2, y2, a) => {
      const sg = g.createLinearGradient(x1, y1, x2, y2);
      sg.addColorStop(0, `rgba(60, 36, 12, ${a})`); sg.addColorStop(1, 'rgba(60, 36, 12, 0)');
      g.fillStyle = sg; g.fillRect(x, y, b, h);
    };
    schaduw(BIN.l, BIN.t, BIN.r - BIN.l, 18, 0, BIN.t, 0, BIN.t + 18, 0.42);
    schaduw(BIN.l, BIN.t, 16, BIN.b - BIN.t, BIN.l, 0, BIN.l + 16, 0, 0.32);
    schaduw(BIN.r - 8, BIN.t, 8, BIN.b - BIN.t, BIN.r, 0, BIN.r - 8, 0, 0.18);
    schaduw(BIN.l, BIN.b - 6, BIN.r - BIN.l, 6, 0, BIN.b, 0, BIN.b - 6, 0.14);
    g.restore();

    // het potje: een kuiltje met een opgehoogde rand, een schuine wand en een donker gat
    const rg = g.createRadialGradient(POT.x, POT.y, POT.r, POT.x, POT.y, KUIL + 10);
    rg.addColorStop(0, 'rgba(120, 84, 38, .7)'); rg.addColorStop(0.55, 'rgba(176, 138, 82, .35)'); rg.addColorStop(0.82, 'rgba(250, 236, 200, .5)'); rg.addColorStop(1, 'rgba(250, 236, 200, 0)');
    g.fillStyle = rg; g.beginPath(); g.arc(POT.x, POT.y, KUIL + 10, 0, Math.PI * 2); g.fill();
    // lichte rand linksboven, schaduw rechtsonder (licht van linksboven)
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(255, 246, 220, .6)'; g.beginPath(); g.arc(POT.x, POT.y, KUIL + 3, Math.PI * 0.95, Math.PI * 1.65); g.stroke();
    g.strokeStyle = 'rgba(100, 68, 28, .3)'; g.beginPath(); g.arc(POT.x, POT.y, KUIL + 3, Math.PI * 0.05, Math.PI * 0.7); g.stroke();
    const gat = g.createRadialGradient(POT.x + 4, POT.y + 5, 2, POT.x, POT.y, POT.r);
    gat.addColorStop(0, '#5A3E1C'); gat.addColorStop(0.6, '#3A2510'); gat.addColorStop(1, '#22150A');
    g.fillStyle = gat; g.beginPath(); g.arc(POT.x, POT.y, POT.r, 0, Math.PI * 2); g.fill();
    // de belichte binnenwand rechtsonder
    g.fillStyle = 'rgba(176, 132, 70, .55)';
    g.beginPath(); g.arc(POT.x, POT.y, POT.r - 0.5, Math.PI * -0.05, Math.PI * 0.75); g.arc(POT.x - 3, POT.y - 3.5, POT.r - 3, Math.PI * 0.75, Math.PI * -0.05, true); g.closePath(); g.fill();
    achter = c;
  }

  // ---------- Knikkers: een bol met vlekjes of een ader die echt meerolt ----------
  function nieuweVlekken(st, zaad) {
    let z = zaad || 1;
    const r = () => { z = (z * 16807) % 2147483647; return (z - 1) / 2147483646; };
    const punt = () => { const t = r() * Math.PI * 2, u = r() * 2 - 1, s = Math.sqrt(1 - u * u); return [s * Math.cos(t), s * Math.sin(t), u]; };
    if (st.ader) {
      // een ader langs een grote cirkel
      const as = punt(), b = [as[1], -as[0], 0], bl = Math.hypot(...b) || 1;
      const e1 = [b[0] / bl, b[1] / bl, 0], e2 = [as[1] * e1[2] - as[2] * e1[1], as[2] * e1[0] - as[0] * e1[2], as[0] * e1[1] - as[1] * e1[0]];
      return Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2; return [e1[0] * Math.cos(a) + e2[0] * Math.sin(a), e1[1] * Math.cos(a) + e2[1] * Math.sin(a), e1[2] * Math.cos(a) + e2[2] * Math.sin(a)]; });
    }
    return Array.from({ length: 7 }, punt);
  }
  function rol(k, dx, dy) {
    const l = Math.hypot(dx, dy);
    if (l < 0.01 || !k.vlekken) return;
    const hoek = l / RK, ax = -dy / l, ay = dx / l;   // as loodrecht op de beweging, in het vlak
    const c = Math.cos(hoek), s = Math.sin(hoek);
    k.vlekken = k.vlekken.map(([x, y, z]) => {
      const dot = ax * x + ay * y;
      // Rodrigues: v cos + (a x v) sin + a (a.v)(1 - cos)
      const cx = ay * z, cy = -ax * z, cz = ax * y - ay * x;
      return [x * c + cx * s + ax * dot * (1 - c), y * c + cy * s + ay * dot * (1 - c), z * c + cz * s];
    });
  }
  function tekenKnikker(x, y, r, st, k, o) {
    o = o || {};
    if (!o.zonderSchaduw) {
      const hoog = o.opgetild ? 1.8 : 1;
      ctx.fillStyle = 'rgba(70, 44, 14, .22)';
      ctx.beginPath(); ctx.ellipse(x + r * 0.42 * hoog, y + r * 0.55 * hoog, r * 1.05, r * 0.82, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(60, 36, 10, .28)';
      ctx.beginPath(); ctx.ellipse(x + r * 0.22, y + r * 0.3, r * 0.86, r * 0.7, 0.5, 0, Math.PI * 2); ctx.fill();
    }
    const gr = ctx.createRadialGradient(x - r * 0.36, y - r * 0.42, r * 0.08, x, y, r);
    gr.addColorStop(0, st.a); gr.addColorStop(0.58, st.b); gr.addColorStop(1, st.c);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (k && k.vlekken) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      if (st.ader) {
        ctx.strokeStyle = st.ader; ctx.lineCap = 'round';
        const p = k.vlekken;
        for (let i = 0; i < p.length; i++) {
          const a = p[i], b = p[(i + 1) % p.length];
          if (a[2] < -0.1 && b[2] < -0.1) continue;
          ctx.globalAlpha = 0.85 * klem((a[2] + b[2]) / 2 + 0.6, 0, 1);
          ctx.lineWidth = r * 0.36 * klem((a[2] + b[2]) / 2 + 0.4, 0.25, 1);
          ctx.beginPath(); ctx.moveTo(x + a[0] * r * 0.92, y + a[1] * r * 0.92); ctx.lineTo(x + b[0] * r * 0.92, y + b[1] * r * 0.92); ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(80, 50, 22, .42)';
        k.vlekken.forEach(([vx, vy, vz]) => {
          if (vz < 0) return;
          ctx.globalAlpha = klem(vz * 1.4, 0, 1);
          ctx.beginPath(); ctx.ellipse(x + vx * r * 0.9, y + vy * r * 0.9, r * 0.15, r * 0.15 * (0.35 + 0.65 * vz), Math.atan2(vy, vx), 0, Math.PI * 2); ctx.fill();
        });
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, .22)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x, y, r - 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(255, 255, 255, ${st.glans})`;
    ctx.beginPath(); ctx.ellipse(x - r * 0.36, y - r * 0.42, r * 0.3, r * 0.19, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, .5)';
    ctx.beginPath(); ctx.arc(x - r * 0.5, y - r * 0.5, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, .14)'; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.arc(x, y, r * 0.78, Math.PI * 0.1, Math.PI * 0.6); ctx.stroke();
  }

  // een duimpje achter de knikker: hoe verder je trekt, hoe verder de duim naar achteren
  function tekenDuim(x, y, hoek, trek) {
    const afst = RK + 3 + trek * 0.42;
    ctx.save();
    ctx.translate(x - Math.cos(hoek) * afst, y - Math.sin(hoek) * afst);
    ctx.rotate(hoek);
    ctx.fillStyle = 'rgba(60, 36, 10, .2)';
    ctx.beginPath(); ctx.ellipse(-12, 9, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    // gekromde wijsvinger
    ctx.fillStyle = '#E8B994'; ctx.strokeStyle = '#A8704C'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(-16, 9, 11, 8, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // de duim, met de nagel naar de knikker
    const dg = ctx.createLinearGradient(0, -7, 0, 7);
    dg.addColorStop(0, '#F6D4B4'); dg.addColorStop(1, '#E2AE88');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(-6, -6.5); ctx.quadraticCurveTo(1, -6, 1, 0); ctx.quadraticCurveTo(1, 6, -6, 6.5); ctx.lineTo(-34, 6); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FBE6D6'; ctx.strokeStyle = '#C99474';
    ctx.beginPath(); ctx.ellipse(-5, -1.2, 4.6, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function stijlVan(k) { return spelers[k.van] ? spelers[k.van].stijl : eigenStijl(); }

  function tekenMik() {
    if (!mik) return;
    const k = mik.k;
    const vk = k.inHand ? { x: k.x, y: k.y } : k;
    const p = voorspel(Object.assign({}, k, { veld: true, x: vk.x, y: vk.y }), mik.hoek, knikkers);
    const kleurLijn = mik.computer ? 'rgba(255, 236, 200, .75)' : 'rgba(255, 255, 255, .92)';
    // stippellijn tot het eerste raakpunt
    ctx.fillStyle = kleurLijn;
    for (let s = RK + 6; s < p.lengte; s += 8) {
      ctx.beginPath(); ctx.arc(vk.x + p.ux * s, vk.y + p.uy * s, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    if (p.soort === 'knikker') {
      ctx.strokeStyle = kleurLijn; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(p.cx, p.cy, RK, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // waar de geraakte knikker heen gaat
      const d = p.doel, lx = d.x + p.nx * 46, ly = d.y + p.ny * 46;
      ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(d.x + p.nx * (RK + 3), d.y + p.ny * (RK + 3)); ctx.lineTo(lx, ly); ctx.stroke();
      const ah = Math.atan2(p.ny, p.nx);
      ctx.fillStyle = kleurLijn;
      ctx.beginPath(); ctx.moveTo(lx + Math.cos(ah) * 6, ly + Math.sin(ah) * 6); ctx.lineTo(lx + Math.cos(ah + 2.4) * 6, ly + Math.sin(ah + 2.4) * 6); ctx.lineTo(lx + Math.cos(ah - 2.4) * 6, ly + Math.sin(ah - 2.4) * 6); ctx.closePath(); ctx.fill();
    } else if (p.soort === 'muur') {
      const rx = p.doel === 'x' ? -p.ux : p.ux, ry = p.doel === 'y' ? -p.uy : p.uy;
      ctx.globalAlpha = 0.45;
      for (let s = 6; s < 40; s += 8) { ctx.beginPath(); ctx.arc(p.cx + rx * s, p.cy + ry * s, 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (p.overPot) {
      ctx.strokeStyle = `rgba(242, 193, 78, ${0.55 + 0.3 * Math.sin(performance.now() / 160)})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(POT.x, POT.y, POT.r + 4, 0, Math.PI * 2); ctx.stroke();
    }
    // krachtring rond de knikker: groen, goud, rood
    const f = klem(mik.trek / TREK_MAX, 0, 1);
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(40, 24, 8, .35)';
    ctx.beginPath(); ctx.arc(vk.x, vk.y, RK + 7, 0, Math.PI * 2); ctx.stroke();
    if (f > 0) {
      const kleurF = f < 0.45 ? '#7BC86C' : f < 0.8 ? '#F2C14E' : '#D9573A';
      ctx.strokeStyle = kleurF;
      ctx.beginPath(); ctx.arc(vk.x, vk.y, RK + 7, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    tekenDuim(vk.x, vk.y, mik.hoek, mik.trek);
  }

  function teken() {
    if (!ctx) return;
    if (!achter) maakAchtergrond();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, doek.width, doek.height);
    ctx.drawImage(achter, 0, 0);
    ctx.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    const nu = performance.now();
    // knikkers in het potje
    const inPot = knikkers.filter((k) => k.inPot);
    inPot.forEach((k, i) => {
      const t = klem((nu - (k.valT || 0)) / 300, 0, 1);
      const plek = POTPLEK[i % POTPLEK.length];
      const x = POT.x + plek[0], y = POT.y + plek[1];
      const vx = k.valX !== undefined ? k.valX + (x - k.valX) * t : x, vy = k.valY !== undefined ? k.valY + (y - k.valY) * t : y;
      ctx.globalAlpha = 1;
      tekenKnikker(vx, vy, RK * (1 - 0.2 * t), stijlVan(k), k, { zonderSchaduw: true });
      ctx.fillStyle = `rgba(30, 18, 6, ${(0.18 + 0.22 * t).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(vx, vy, RK * (1 - 0.2 * t), 0, Math.PI * 2); ctx.fill();
    });
    // meting: wie ligt het dichtst bij?
    if (meting) {
      meting.forEach((m) => {
        if (!m.k || m.k.inPot) return;
        ctx.strokeStyle = m.kleur; ctx.lineWidth = m.beste ? 3 : 2; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(POT.x, POT.y); ctx.lineTo(m.k.x, m.k.y); ctx.stroke(); ctx.setLineDash([]);
        if (m.beste) { ctx.beginPath(); ctx.arc(m.k.x, m.k.y, RK + 6 + Math.sin(nu / 140) * 1.5, 0, Math.PI * 2); ctx.stroke(); }
      });
    }
    // aanwijzing: welke knikkers kun je tikken?
    const mensAan = fase === 'mikken' && !mik;
    if (mensAan && staat === 'duimen') {
      knikkers.forEach((k) => {
        if (!k.veld) return;
        ctx.strokeStyle = `rgba(242, 193, 78, ${(0.55 + 0.35 * Math.sin(nu / 260)).toFixed(2)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(k.x, k.y, RK + 5, 0, Math.PI * 2); ctx.stroke();
      });
    }
    // sporen van snelle knikkers
    knikkers.forEach((k) => {
      if (!k.veld) return;
      const v = Math.hypot(k.vx, k.vy);
      if (v < 260) return;
      const st = stijlVan(k);
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.12 * (4 - i) / 3;
        ctx.fillStyle = st.b;
        ctx.beginPath(); ctx.arc(k.x - k.vx * i * 0.012, k.y - k.vy * i * 0.012, RK * (1 - i * 0.08), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    // de knikkers op het veld
    knikkers.forEach((k) => { if (k.veld) tekenKnikker(k.x, k.y, RK, stijlVan(k), k); });
    // de knikker in de hand, bij de streep
    if (werp && werp.inHand) {
      if (mensAan && staat === 'gooien') {
        ctx.strokeStyle = `rgba(242, 193, 78, ${(0.6 + 0.35 * Math.sin(nu / 230)).toFixed(2)})`; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(werp.x, werp.y, RK + 6, 0, Math.PI * 2); ctx.stroke();
        if (nu < hintTot) {
          // pijltjes: trek naar achteren
          ctx.fillStyle = `rgba(255, 246, 222, ${(0.5 + 0.4 * Math.sin(nu / 180)).toFixed(2)})`;
          [0, 1].forEach((i) => {
            const y0 = werp.y + 22 + i * 10;
            ctx.beginPath(); ctx.moveTo(werp.x - 7, y0); ctx.lineTo(werp.x, y0 + 6); ctx.lineTo(werp.x + 7, y0); ctx.lineTo(werp.x, y0 + 3); ctx.closePath(); ctx.fill();
          });
        }
      }
      tekenKnikker(werp.x, werp.y, RK, stijlVan(werp), werp, { opgetild: !!mik });
    }
    // ringetjes en stof
    ringen = ringen.filter((r) => nu - r.t < r.duur);
    ringen.forEach((r) => {
      const t = (nu - r.t) / r.duur;
      ctx.strokeStyle = `rgba(${r.kleur}, ${(1 - t) * r.a})`; ctx.lineWidth = 2 * (1 - t) + 0.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * t, 0, Math.PI * 2); ctx.stroke();
    });
    deeltjes.forEach((d) => {
      ctx.fillStyle = `rgba(${d.kleur}, ${klem(d.leef / d.max, 0, 1) * 0.7})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    });
    tekenMik();
  }
  // de plekjes van de knikkers onderin het potje
  const POTPLEK = [[0, 0], [-6, -4], [6, -3], [-3, 6], [5, 5], [-8, 3], [1, -8], [8, -6], [-6, -9], [0, 9]];

  // ---------- Effecten ----------
  function stof(x, y, n, kracht) {
    if (rustig()) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (20 + Math.random() * 50) * (kracht || 1);
      deeltjes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, r: 0.8 + Math.random() * 1.6, leef: 0.5 + Math.random() * 0.4, max: 0.9, kleur: Math.random() > 0.5 ? '170, 132, 80' : '236, 214, 170' });
    }
  }
  function ring(x, y, r0, r1, duur, kleur, a) { if (!rustig()) ringen.push({ x, y, r0, r1, duur, kleur: kleur || '255, 246, 222', a: a || 0.8, t: performance.now() }); }

  let laatsteKlik = 0;
  const geluiden = {
    bots(a, b, v) {
      const nu = performance.now();
      if (v > 30 && nu - laatsteKlik > 35) { laatsteKlik = nu; Geluid.knik(Math.min(1, v / 500)); if (window.Tril) Tril.bots(v / 500); }
      if (v > 60) ring((a.x + b.x) / 2, (a.y + b.y) / 2, 3, 14, 260, '255, 250, 235', 0.7);
    },
    muur(k, v) { if (v > 60) { Geluid.tik(); stof(k.x, k.y, 3, 0.6); } },
    pot(k) {
      schotGepot++;
      laatstePotter = aan;
      k.valT = performance.now(); k.valX = k.x; k.valY = k.y;
      Geluid.plop();
      if (window.Tril) Tril.tik();
      ring(POT.x, POT.y, POT.r, KUIL + 12, 520, '255, 236, 190', 0.9);
      stof(POT.x, POT.y, 6, 0.7);
      pop(POT.x, POT.y - 30, 'Raak!', 'raak');
      werkStandBij();
    }
  };

  // ============================================================
  // DE LUS
  // ============================================================
  function lus(t) {
    const dt = Math.min(0.05, (t - (vorigeT || t)) / 1000);
    vorigeT = t;
    // vertraging bij de laatste knikker vlak bij het potje
    const veld = knikkers.filter((k) => k.veld);
    let doelSchaal = 1;
    if (staat === 'duimen' && fase === 'rolt' && veld.length === 1) {
      const k = veld[0], v = Math.hypot(k.vx, k.vy);
      if (afstandTot(k) < 70 && v > 5 && v < 330 && !rustig()) doelSchaal = 0.4;
    }
    tijdSchaal += (doelSchaal - tijdSchaal) * Math.min(1, dt * 6);
    rest += dt * tijdSchaal;
    let n = 0;
    while (rest >= DT && n < 12) {
      const voor = knikkers.map((k) => [k.x, k.y]);
      stap(knikkers, geluiden);
      knikkers.forEach((k, i) => { if (k.veld) rol(k, k.x - voor[i][0], k.y - voor[i][1]); });
      rest -= DT; n++;
    }
    deeltjes = deeltjes.filter((d) => (d.leef -= dt) > 0);
    deeltjes.forEach((d) => { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.92; d.vy *= 0.92; });
    if (fase === 'rolt' && stil(knikkers)) { fase = 'tussen'; naSchot(); }
    teken();
    raf = requestAnimationFrame(lus);
  }

  // ============================================================
  // INVOER: druk op een knikker, trek naar achteren en laat los
  // ============================================================
  let schuift = false, pijp = [];
  function naarVeld(e) {
    const r = doek.getBoundingClientRect();
    return { x: (e.clientX - r.left) / schaal, y: (e.clientY - r.top) / schaal, t: performance.now() };
  }
  function neer(e) {
    if (fase !== 'mikken' || !spelers[aan] || !spelers[aan].mens) return;
    const p = naarVeld(e);
    let k = null;
    if (staat === 'gooien') {
      if (!werp) return;
      if (Math.hypot(p.x - werp.x, p.y - werp.y) < 34) k = werp;
      else if (p.y > LIJN + 4) {
        // opzij schuiven langs de streep
        schuift = true;
        werp.x = klem(p.x, BIN.l + RK + 4, BIN.r - RK - 4); mikX = werp.x;
        e.preventDefault();
        if (doek.setPointerCapture) doek.setPointerCapture(e.pointerId);
        return;
      } else return;
    } else {
      let bd = 36;
      knikkers.forEach((q) => { if (!q.veld) return; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; k = q; } });
      if (!k) return;
    }
    e.preventDefault();
    if (doek.setPointerCapture) doek.setPointerCapture(e.pointerId);
    mik = { k, hoek: staat === 'gooien' ? -Math.PI / 2 : Math.atan2(POT.y - k.y, POT.x - k.x), trek: 0, mens: true };
    pijp = [p];
    doek.classList.add('mikt');
    Geluid.pak();
    if (window.Tril) Tril.tik();
  }
  function beweeg(e) {
    if (schuift && werp) {
      const p = naarVeld(e);
      werp.x = klem(p.x, BIN.l + RK + 4, BIN.r - RK - 4); mikX = werp.x;
      return;
    }
    if (!mik || mik.computer) return;
    const p = naarVeld(e);
    pijp.push(p); if (pijp.length > 8) pijp.shift();
    zetMik(p);
  }
  function zetMik(p) {
    const k = mik.k, dx = k.x - p.x, dy = k.y - p.y, l = Math.hypot(dx, dy);
    const vorige = mik.trek;
    mik.trek = klem(l, 0, TREK_MAX);
    if (l > 3) {
      let h = Math.atan2(dy, dx);
      if (staat === 'gooien') {
        // vanaf de streep gooi je naar voren
        const rel = Math.atan2(Math.sin(h + Math.PI / 2), Math.cos(h + Math.PI / 2));
        h = -Math.PI / 2 + klem(rel, -1.2, 1.2);
      }
      mik.hoek = h;
    }
    if (mik.trek >= TREK_MAX && vorige < TREK_MAX && window.Tril) Tril.tik();
  }
  function los(e) {
    if (schuift) { schuift = false; return; }
    if (!mik || mik.computer) return;
    // de stand van net voor het loslaten: een vinger trekt bij het optillen vaak nog even
    const nu = performance.now();
    const eerder = pijp.filter((q) => nu - q.t > 40);
    if (eerder.length) zetMik(eerder[eerder.length - 1]);
    doek.classList.remove('mikt');
    const m = mik;
    mik = null;
    if (m.trek < TREK_MIN) return;
    schiet(m.k, m.hoek, m.trek / TREK_MAX * VMAX);
  }
  // met het toetsenbord: pijltjes mikken en kracht, n kiest een andere knikker, spatie schiet
  function toets(e) {
    if (fase !== 'mikken' || !spelers[aan] || !spelers[aan].mens) return;
    const kies = () => {
      const lijst = staat === 'gooien' ? [werp] : knikkers.filter((k) => k.veld).sort((a, b) => afstandTot(a) - afstandTot(b));
      if (!lijst.length || !lijst[0]) return null;
      const i = mik ? (lijst.indexOf(mik.k) + 1) % lijst.length : 0;
      const k = lijst[i];
      return { k, hoek: staat === 'gooien' ? -Math.PI / 2 : Math.atan2(POT.y - k.y, POT.x - k.x), trek: TREK_MAX * 0.4, toets: true };
    };
    if (!mik && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'n', 'N', ' ', 'Enter'].includes(e.key)) { mik = kies(); if (!mik) return; e.preventDefault(); if (e.key !== 'n' && e.key !== 'N') return; }
    if (!mik) return;
    if (e.key === 'n' || e.key === 'N') { mik = kies(); e.preventDefault(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (e.shiftKey && staat === 'gooien') { werp.x = klem(werp.x + (e.key === 'ArrowLeft' ? -6 : 6), BIN.l + RK + 4, BIN.r - RK - 4); mikX = werp.x; }
      else mik.hoek += (e.key === 'ArrowLeft' ? -1 : 1) * (e.altKey ? 0.2 : 1.2) * RAD;
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      mik.trek = klem(mik.trek + (e.key === 'ArrowUp' ? 4 : -4), TREK_MIN, TREK_MAX); e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Enter') {
      const m = mik; mik = null; e.preventDefault();
      schiet(m.k, m.hoek, m.trek / TREK_MAX * VMAX);
    } else if (e.key === 'Escape') { mik = null; }
  }

  // ============================================================
  // HET SPELVERLOOP
  // ============================================================
  function maakKnikker(van, x, y) {
    const st = spelers[van].stijl;
    return { x, y, vx: 0, vy: 0, veld: false, inPot: false, inHand: true, van, vlekken: nieuweVlekken(st, 7 + knikkers.length * 31 + van * 5), over: false };
  }
  function nieuwSpel() {
    spelId++;
    potjeNr++;
    const st = eigenStijl();
    if (modus === 'tegen') spelers = [{ naam: 'Jij', mens: true, stijl: st }, { naam: naamVan(tegen.id), mens: false, persoon: tegen.id, t: tegen, stijl: KNIKKER_VAN[tegen.id] }];
    else spelers = [{ naam: 'Speler 1', mens: true, stijl: st }, { naam: 'Speler 2', mens: true, stijl: KNIKKER_VAN.twee }];
    spelers.forEach((p, i) => { p.i = i; p.hand = INZET; p.raak = 0; });
    knikkers = []; werp = null; mik = null; meting = null; winnaar = -1; laatstePotter = -1; schotGepot = 0;
    deeltjes = []; ringen = [];
    staat = 'gooien';
    aan = (potjeNr - 1) % 2;           // om en om beginnen met gooien
    ui.kaart.hidden = true;
    hintTot = performance.now() + 6000;
    werkStandBij();
    zeg('start', true);
    volgendeBeurt();
  }

  function volgendeBeurt() {
    const p = spelers[aan];
    if (staat === 'gooien') {
      werp = maakKnikker(aan, p.mens ? mikX : POT.x, WERP_Y);
      werp.x = vrijePlek(werp.x);
      knikkers.push(werp);
    } else werp = null;
    if (p.mens) {
      fase = 'mikken';
      meld(staat === 'gooien' ? `${p.naam}: trek je knikker naar achteren en laat los.` : `${p.naam}: tik een knikker in het potje.`);
    } else {
      fase = 'computer';
      computerBeurt();
    }
    werkStandBij();
    werkHudBij();
  }
  // leg de knikker in je hand niet bovenop een die al achter de streep ligt
  function vrijePlek(x) {
    for (let s = 0; s < 40; s++) {
      const kandidaat = klem(x + (s % 2 ? 1 : -1) * Math.ceil(s / 2) * 10, BIN.l + RK + 4, BIN.r - RK - 4);
      if (!knikkers.some((k) => k.veld && Math.hypot(k.x - kandidaat, k.y - WERP_Y) < 2 * RK + 2)) return kandidaat;
    }
    return x;
  }

  function schiet(k, hoek, v) {
    if (fase !== 'mikken' && fase !== 'computer') return;
    if (k.inHand) {
      k.inHand = false; k.veld = true;
      spelers[aan].hand--;
      Geluid.schuif();
    } else Geluid.knik(0.6);
    k.vx = Math.cos(hoek) * v; k.vy = Math.sin(hoek) * v;
    schotGepot = 0;
    fase = 'rolt';
    mik = null;
    hintTot = 0;
    stof(k.x, k.y, 5, 0.6);
    if (window.Tril) Tril.klik();
    werkStandBij();
    werkHudBij();
  }

  async function naSchot() {
    const mijnId = spelId, p = spelers[aan];
    const veld = knikkers.filter((k) => k.veld).length;
    if (staat === 'gooien') {
      if (spelers.every((q) => q.hand === 0)) {
        await wacht(500); if (mijnId !== spelId) return;
        if (!veld) { einde(laatstePotter >= 0 ? laatstePotter : aan); return; }
        await wieBegint(); return;
      }
      await wacht(350); if (mijnId !== spelId) return;
      aan = spelers[1 - aan].hand > 0 ? 1 - aan : aan;
      volgendeBeurt();
      return;
    }
    // tikken: raak is nog een keer, mis is de beurt naar de ander
    if (schotGepot > 0) {
      p.raak += schotGepot;
      if (!veld) { einde(aan); return; }
      if (schotGepot > 1) pop(POT.x, POT.y - 58, `${schotGepot} tegelijk!`, 'feest');
      await wacht(650); if (mijnId !== spelId) return;
      if (!p.mens) zeg('raak');
      if (veld === 1) zeg('laatste');
      volgendeBeurt();
    } else {
      if (!p.mens) zeg('mis');
      await wacht(600); if (mijnId !== spelId) return;
      aan = 1 - aan;
      if (veld === 1) zeg('laatste');
      banierKort(spelers[aan].mens && modus === 'tegen' ? 'Jouw beurt' : `${spelers[aan].naam} is aan de beurt`);
      volgendeBeurt();
    }
  }

  // Wiens knikker ligt het dichtst bij het potje? Die mag beginnen met tikken.
  async function wieBegint() {
    const mijnId = spelId;
    fase = 'meten';
    werkHudBij();
    const beste = spelers.map((q) => {
      let k = null, d = Infinity;
      knikkers.forEach((x) => { if (x.van !== q.i) return; const dd = x.inPot ? 0 : afstandTot(x); if (dd < d) { d = dd; k = x; } });
      return { k, d };
    });
    const begin = beste[0].d < beste[1].d ? 0 : beste[1].d < beste[0].d ? 1 : (potjeNr - 1) % 2;
    meting = beste.map((b, i) => ({ k: b.k, kleur: i === begin ? 'rgba(242, 193, 78, .95)' : 'rgba(255, 250, 235, .6)', beste: i === begin }));
    Geluid.pak();
    await wacht(1300); if (mijnId !== spelId) return;
    const q = spelers[begin];
    banier(q.mens && modus === 'tegen' ? 'Jij begint!' : `${q.naam} begint!`, beste[begin].d === 0 ? 'al een in het potje' : 'het dichtst bij het potje');
    if (!q.mens) zeg('begint');
    await wacht(1500); if (mijnId !== spelId) return;
    meting = null;
    staat = 'duimen';
    aan = begin;
    volgendeBeurt();
  }

  // De tegenstander denkt na, mikt zichtbaar met zijn duim en schiet
  async function computerBeurt() {
    const mijnId = spelId, p = spelers[aan], t = p.t;
    await wacht(520 + Math.random() * 380); if (mijnId !== spelId) return;
    let k, hoek, v;
    if (staat === 'gooien') {
      const g = computerGooi(t);
      // eerst de knikker opzij leggen
      const van = werp.x;
      for (let i = 1; i <= 12; i++) { werp.x = van + (g.x - van) * i / 12; await wacht(22); if (mijnId !== spelId) return; }
      werp.x = vrijePlek(g.x);
      k = werp; hoek = g.hoek; v = g.v;
    } else {
      const keuze = await computerDuim(knikkers, t, mijnId);
      if (!keuze || mijnId !== spelId) return;
      k = knikkers[keuze.i]; hoek = keuze.hoek; v = keuze.v;
    }
    mik = { k, hoek, trek: 0, computer: true };
    const doelTrek = trekVoor(v);
    const stappen = rustig() ? 1 : 16;
    for (let i = 1; i <= stappen; i++) { if (mik) mik.trek = doelTrek * i / stappen; await wacht(38); if (mijnId !== spelId) return; }
    await wacht(260); if (mijnId !== spelId) return;
    schiet(k, hoek, v);
  }

  function einde(w) {
    fase = 'klaar';
    winnaar = w;
    werp = null; mik = null;
    werkStandBij();
    werkHudBij();
    const pw = spelers[w];
    const totaal = knikkers.length;
    vliegNaarWinnaar(w);
    let bedrag, tekst, gewonnenSpel = false, verder = null;
    if (modus === 'twee') {
      bedrag = 25; gewonnenSpel = true;
      tekst = `${pw.naam} wint de pot: ${totaal} knikkers!`;
      banier(`${pw.naam} wint de pot!`, `${totaal} knikkers`);
      Geluid.tada(); vonken(34);
    } else if (pw.mens) {
      const telling = gewonnen();
      const eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('knikker-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true;
      tekst = `Je wint de pot van ${naamVan(tegen.id)}: ${totaal} knikkers!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${naamVan(volgende.id)} is vrij!`;
        verder = { tekst: `Tegen ${naamVan(volgende.id)}`, actie: () => { tegen = volgende; modus = 'tegen'; bewaarKeuze(); nieuwSpel(); } };
      }
      banier('Jij wint de pot!', `${totaal} knikkers`);
      Geluid.tada(); vonken(44);
      if (window.Tril) Tril.succes();
      zeg('verliest', true);
    } else {
      bedrag = 10 + spelers[0].raak * 2;
      tekst = `${pw.naam} tikte de laatste erin en wint de pot.`;
      banier(`${pw.naam} wint de pot`, 'de laatste knikker telt');
      Geluid.jammer();
      zeg('wint', true);
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'knikkeren', bedrag, gewonnen: gewonnenSpel, tekst, verder, wacht: 2600 });
    setTimeout(() => {
      if (fase !== 'klaar' || !ui.kaart) return;
      toonKaart(`<b>${modus === 'tegen' ? (pw.mens ? 'Gewonnen!' : 'Volgende keer beter') : `${pw.naam} wint!`}</b><span>Nog een potje?</span><button class="knop kn-weer" type="button">${icoon('opnieuw')}Nog een potje</button>`);
      ui.kaart.querySelector('.kn-weer').addEventListener('click', () => nieuwSpel());
    }, 2200);
  }

  // de knikkers vliegen uit het potje naar de winnaar
  function vliegNaarWinnaar(w) {
    if (rustig() || !ui.stand) return;
    const doel = ui.stand.querySelectorAll('.sj-speler')[w];
    if (!doel) return;
    const r = doek.getBoundingClientRect(), rv = ui.vak.getBoundingClientRect(), rd = doel.getBoundingClientRect();
    const sx = r.left - rv.left + POT.x * schaal, sy = r.top - rv.top + POT.y * schaal;
    const ex = rd.left - rv.left + rd.width / 2, ey = rd.top - rv.top + rd.height / 2;
    knikkers.forEach((k, i) => {
      const st = stijlVan(k);
      const e = document.createElement('i');
      e.className = 'kn-vlieg';
      e.style.setProperty('--a', st.a); e.style.setProperty('--b', st.b); e.style.setProperty('--c', st.c);
      e.style.left = sx + 'px'; e.style.top = sy + 'px';
      ui.pops.appendChild(e);
      const mx = (sx + ex) / 2 + (Math.random() - 0.5) * 120, my = Math.min(sy, ey) - 60 - Math.random() * 60;
      const a = e.animate([
        { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 },
        { transform: `translate(calc(-50% + ${mx - sx}px), calc(-50% + ${my - sy}px)) scale(1.1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(calc(-50% + ${ex - sx}px), calc(-50% + ${ey - sy}px)) scale(.5)`, opacity: 0.2 }
      ], { duration: 900, delay: 300 + i * 70, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'both' });
      a.onfinish = () => { e.remove(); if (i === knikkers.length - 1) { doel.classList.remove('kn-wip'); void doel.offsetWidth; doel.classList.add('kn-wip'); Geluid.tik(); } };
    });
  }

  // ============================================================
  // SCHERM: stand, onderkaart, kaartjes en banieren
  // ============================================================
  function werkStandBij() {
    if (!ui.stand) return;
    const g = gezichten();
    const inPot = knikkers.filter((k) => k.inPot).length;
    // per speler: in de gooironde hoeveel knikkers je nog hebt, daarna hoeveel je erin hebt getikt
    const gooit = staat === 'gooien' && fase !== 'klaar';
    const vakje = (p, i) => {
      const beeld = p.persoon ? (g[p.persoon] || '') : `<span class="kn-eigen" style="--a:${p.stijl.a};--b:${p.stijl.b};--c:${p.stijl.c}"></span>`;
      const getal = gooit ? p.hand : (winnaar === i ? INZET * 2 : p.raak);
      const teken = gooit ? mini(p.stijl) : '<i class="kn-gat"></i>';
      return `<span class="sj-speler${i === aan && fase !== 'klaar' ? ' aan' : ''}${winnaar === i ? ' kn-winnaar' : ''}"><span class="sj-speler-beeld">${beeld}</span><span class="sj-speler-naam">${p.naam}</span><b class="sj-speler-score kn-getal">${teken}${getal}</b></span>`;
    };
    ui.stand.innerHTML = vakje(spelers[0], 0) + `<span class="kn-pot" title="In het potje">${potIcoon}<b>${inPot}</b></span>` + vakje(spelers[1], 1);
    ui.stand.setAttribute('aria-label', `${spelers[0].naam} tegen ${spelers[1].naam}. ${inPot} van de ${INZET * 2} knikkers in het potje. Tik om een tegenstander te kiezen.`);
  }
  function werkHudBij() {
    const p = spelers[aan];
    if (!p || !ui.zelf) return;
    const beeld = ui.zelf.querySelector('.kn-zelf-beeld');
    beeld.innerHTML = p.persoon ? (gezichten()[p.persoon] || '') : `<span class="kn-eigen groot" style="--a:${p.stijl.a};--b:${p.stijl.b};--c:${p.stijl.c}"></span>`;
    ui.zelf.querySelector('.mo-naam').textContent = fase === 'klaar' ? (winnaar >= 0 ? `${spelers[winnaar].naam} wint` : '') : p.naam;
    ui.zelf.querySelector('.kn-hand').innerHTML = staat === 'gooien' && fase !== 'klaar' ? Array.from({ length: INZET }, (_, j) => mini(p.stijl, j >= p.hand)).join('') : '';
    const doe = ui.zelf.querySelector('.mo-doe');
    if (fase === 'mikken') doe.innerHTML = staat === 'gooien' ? `${icoon('pijl', 'kn-terug')}<span>Trek naar achteren en laat los</span>` : `${icoon('pijl', 'kn-op')}<span>Tik een knikker in het potje</span>`;
    else if (fase === 'computer') doe.innerHTML = '<span class="mo-denk"><i></i><i></i><i></i></span>';
    else if (fase === 'meten') doe.innerHTML = '<span>Wie ligt het dichtst bij?</span>';
    else doe.innerHTML = '';
    ui.zelf.classList.toggle('aan', fase === 'mikken');
  }
  function zeg(soort, altijd) {
    const p = spelers.find((q) => q.persoon);
    if (!p || !p.t || !ui.zelf) return;
    if (!altijd && spelers[aan] !== p && soort !== 'laatste') return;
    const b = ui.zelf.querySelector('.mo-ballon');
    b.textContent = willekeurig(p.t.zegt[soort] || ['…']);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(zeg.timer);
    zeg.timer = setTimeout(() => { b.hidden = true; }, 2300);
  }
  function pop(x, y, tekstje, soort) {
    if (!ui.pops) return;
    const e = document.createElement('span');
    e.className = 'sj-pop kn-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekstje;
    const r = doek.getBoundingClientRect(), rv = ui.vak.getBoundingClientRect();
    e.style.left = (r.left - rv.left + x * schaal) + 'px';
    e.style.top = (r.top - rv.top + y * schaal) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), 1600);
  }
  function toonKaart(inhoud) {
    ui.kaart.innerHTML = inhoud;
    ui.kaart.hidden = false;
    ui.kaart.classList.remove('in'); void ui.kaart.offsetWidth; ui.kaart.classList.add('in');
  }
  function banier(titel, sub) {
    const b = document.createElement('div');
    b.className = 'sj-banier';
    b.innerHTML = '<b></b><span></span>';
    b.querySelector('b').textContent = titel;
    b.querySelector('span').textContent = sub || '';
    ui.vak.appendChild(b);
    setTimeout(() => b.remove(), 1800);
  }
  function banierKort(titel) {
    const b = document.createElement('div');
    b.className = 'kn-beurt';
    b.textContent = titel;
    ui.vak.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  }
  function vonken(aantal) {
    if (rustig()) return;
    const rr = ui.vak.getBoundingClientRect();
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (rr.width * Math.random()) + 'px';
      v.style.top = (rr.height * (0.1 + Math.random() * 0.5)) + 'px';
      ui.pops.appendChild(v);
      const an = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(20 + Math.random() * 40).toFixed(0)}px)) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 600, easing: 'ease-out', fill: 'both' });
      an.onfinish = () => v.remove();
    }
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }

  // ============================================================
  // KEUZEMENU
  // ============================================================
  function bewaarKeuze() { if (window.Duiten) Duiten.zetVeld('knikker-tegen', modus === 'tegen' ? tegen.id : modus); }
  function openMenu() {
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.keuzes.querySelector('.mo-keuze.nu') || ui.keuzes.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu() { if (ui.menu) ui.menu.hidden = true; }
  function werkSchakelaars() {
    ui.menu.querySelector('.mo-geluid').setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    ui.menu.querySelector('.mo-muziek').setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
  }
  function tekenMenu() {
    const g = gezichten(), telling = gewonnen();
    ui.keuzes.innerHTML = '';
    const knop = (klasse, inhoud, label, actie) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mo-keuze ' + klasse; b.innerHTML = inhoud; b.setAttribute('aria-label', label);
      b.addEventListener('click', () => actie(b));
      ui.keuzes.appendChild(b);
    };
    TEGENSTANDERS.forEach((t) => {
      const open = isOpen(t), keer = telling[t.id] || 0;
      const wieken = `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-wiek"/></svg>`).join('')}</span>`;
      knop((modus === 'tegen' && tegen === t ? 'nu' : '') + (open ? '' : ' dicht'),
        `<span class="mo-gezicht">${g[t.id] || ''}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span><span class="mo-keuze-naam">${naamVan(t.id)}</span>${wieken}${open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${t.beloning}</span>` : ''}`,
        `${naamVan(t.id)}, niveau ${t.niveau} van 4${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`,
        (b) => {
          if (!open) { b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud'); if (window.Tril) Tril.fout(); Geluid.pak(); return; }
          modus = 'tegen'; tegen = t; bewaarKeuze(); sluitMenu(); nieuwSpel();
        });
    });
    const st = eigenStijl(), st2 = KNIKKER_VAN.twee;
    knop((modus === 'twee' ? 'nu ' : '') + 'sj-breed', `<span class="mo-gezicht sj-twee"><span class="kn-eigen" style="--a:${st.a};--b:${st.b};--c:${st.c}"></span><span class="kn-eigen" style="--a:${st2.a};--b:${st2.b};--c:${st2.c}"></span></span><span class="mo-keuze-naam">Met z'n tweeën</span>`, 'Met z\'n tweeën op dit toestel', () => { modus = 'twee'; bewaarKeuze(); sluitMenu(); nieuwSpel(); });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function vak(x, y, b, h) { const r = doek.getBoundingClientRect(); return { left: r.left + x * schaal, top: r.top + y * schaal, width: b * schaal, height: h * schaal }; }
  function punt(x, y) { const r = doek.getBoundingClientRect(); return [r.left + x * schaal, r.top + y * schaal]; }
  if (window.Les) {
    Les.zet('knikkeren', () => [
      { doel: () => vak(BIN.l, LIJN - 6, BIN.r - BIN.l, BIN.b - LIJN + 6), gebaar: 'veeg', van: () => punt(W / 2, WERP_Y), naar: () => punt(W / 2, WERP_Y + 70), voorwerp: 'knikker', tekst: 'Druk op je knikker, trek naar achteren en laat los' },
      { doel: () => vak(POT.x - 40, POT.y - 40, 80, 80), vorm: 'rond', gebaar: 'wijs', tekst: 'Gooi naar het potje. Wie het dichtst bij ligt, begint' },
      { doel: () => vak(BIN.l, BIN.t, BIN.r - BIN.l, LIJN - BIN.t), gebaar: 'wijs', tekst: 'Dan tik je om de beurt een knikker naar het potje' },
      { doel: () => vak(POT.x - 40, POT.y - 40, 80, 80), vorm: 'rond', gebaar: 'wijs', tekst: 'Raak? Dan mag je nog een keer' },
      { doel: () => ui.stand, gebaar: 'wijs', tekst: 'Wie de laatste erin tikt, wint de hele pot!' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.knikkeren = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('knikker-tegen', 'jantje') : 'jantje';
        const t = TEGENSTANDERS.find((x) => x.id === bewaard);
        if (bewaard === 'twee') modus = 'twee';
        else { modus = 'tegen'; tegen = t && isOpen(t) ? t : TEGENSTANDERS[0]; }
        requestAnimationFrame(() => { pasMaatAan(); nieuwSpel(); });
      } else {
        pasMaatAan();
      }
      cancelAnimationFrame(raf);
      vorigeT = 0;
      raf = requestAnimationFrame(lus);
      if (window.Duiten && !Duiten.veld('knikker-les-2', false)) { Duiten.zetVeld('les-knikkeren', false); Duiten.zetVeld('knikker-les-2', true); }
      if (window.Les) Les.eersteKeer('knikkeren');
    },
    // het spel pauzeert: wat rolt, ligt stil tot je terugkomt; de tegenstander wacht met zijn volgende schot
    stop() {
      cancelAnimationFrame(raf);
      if (mik && !mik.computer) mik = null;
      schuift = false;
      sluitMenu();
    },
    opnieuw() { nieuwSpel(); },
    _toestand() {
      return { staat, fase, aan, modus, tegen: tegen.id, hand: spelers.map((p) => p.hand), raak: spelers.map((p) => p.raak), veld: knikkers.filter((k) => k.veld).length, pot: knikkers.filter((k) => k.inPot).length, winnaar };
    },
    _test: {
      // schiet de knikker in je hand (gooien) of de knikker met dit nummer (tikken)
      schiet(i, hoek, v) {
        if (fase !== 'mikken') return false;
        const k = staat === 'gooien' ? werp : knikkers.filter((q) => q.veld)[i];
        if (!k) return false;
        schiet(k, hoek, v);
        return true;
      },
      // het beste schot zoals de burgemeester het zou kiezen, zonder trillende hand
      tip() {
        const t = { hoek: 0, zij: 0, kracht: 0, vast: 0, kies: 0, ketsen: true };
        const kand = kandidaten(knikkers, t);
        kand.forEach((c) => { c.waarde = beoordeel(knikkers, c, t, 1); });
        kand.sort((a, b) => b.waarde - a.waarde);
        const veld = knikkers.filter((q) => q.veld);
        return kand.length ? { i: veld.indexOf(knikkers[kand[0].i]), hoek: kand[0].hoek, v: kand[0].v } : null;
      },
      ruis(f) { ruis = f || Math.random; }
    },
    // een heel potje tussen twee tegenstanders in stilte, voor het afstemmen van de niveaus
    async _sim(idA, idB) {
      const tA = TEGENSTANDERS.find((x) => x.id === idA), tB = TEGENSTANDERS.find((x) => x.id === idB);
      const ts = [tA, tB];
      const lijst = [], hand = [INZET, INZET];
      let beurt = 0, schoten = 0, laatste = -1, missers = 0;
      const cb = { muur() {}, bots() {}, pot() { gepot++; laatste = beurt; } };
      let gepot = 0;
      const rolUit = () => { for (let n = 0; n < 3000; n++) { stap(lijst, cb); if (stil(lijst)) break; } };
      while (hand[0] + hand[1] > 0) {
        const g = computerGooi(ts[beurt]);
        lijst.push({ x: g.x, y: WERP_Y, vx: Math.cos(g.hoek) * g.v, vy: Math.sin(g.hoek) * g.v, veld: true, inPot: false, van: beurt, over: false });
        hand[beurt]--;
        rolUit();
        beurt = hand[1 - beurt] > 0 ? 1 - beurt : beurt;
      }
      const naGooien = lijst.filter((k) => k.inPot).length;
      if (!lijst.some((k) => k.veld)) return { winnaar: laatste, schoten, naGooien };
      const d = [0, 1].map((p) => Math.min(...lijst.filter((k) => k.van === p).map((k) => (k.inPot ? 0 : afstandTot(k)))));
      beurt = d[0] <= d[1] ? 0 : 1;
      while (lijst.some((k) => k.veld) && schoten < 200) {
        const keuze = await computerDuim(lijst, ts[beurt], spelId);
        if (!keuze) break;
        const k = lijst[keuze.i];
        k.vx = Math.cos(keuze.hoek) * keuze.v; k.vy = Math.sin(keuze.hoek) * keuze.v;
        gepot = 0;
        rolUit();
        schoten++;
        if (!lijst.some((q) => q.veld)) return { winnaar: beurt, schoten, naGooien, missers };
        if (!gepot) { beurt = 1 - beurt; missers++; }
      }
      return { winnaar: -1, schoten, naGooien, missers };
    }
  };
})();
