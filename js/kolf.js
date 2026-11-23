/* Kolf op het ijs, schermvullend: een leren bal, een kolf met een ijzeren kop en een paal in het ijs.

   Zo speelde men het in de winter op de bevroren vaarten (Avercamp schilderde het vaak):
   - je slaat je bal met de kolf naar de paal; raak je de paal, dan ben je klaar met die baan;
   - je slaat om de beurt, en elke slag telt; valt je bal in een wak, dan telt er een strafslag bij
     en sla je opnieuw vanaf de plek waar je stond;
   - na drie (of vijf) banen wint wie de minste slagen nodig had; bij gelijkspel volgt een beslissende baan.

   Speelgevoel (zoals bij het knikkeren): druk op je bal, trek terug en laat los. Op het ijs glijdt alles ver door,
   dus het gaat om de richting én om de kracht. Sneeuw remt, het riet en de oever houden je bal tegen,
   en tegen de vastgevroren schuit kaatst hij terug. De natuurkunde is eerlijk: elke slag gaat zoals hij gemikt is. */
(function () {
  'use strict';

  // ============================================================
  // MATEN (logisch; het veld is 400 breed, de lengte rekt mee met het scherm)
  // ============================================================
  const B = 400, RAND = 32, VER = 108, ONDER = 26, HOR = 50;
  const BR = 8.5, PR = 5, DT = 1 / 120;
  const WRIJVING = 58, DEMPING = 0.34, SNEEUW = 560, OEVER = 950;
  const VMAX = 640, TREK_MIN = 10, TREK_MAX = 180, GIDS = 104, BOTS = 0.9;
  const MAX_SLAG = 8;
  const RAD = Math.PI / 180;

  // De banen, in delen van het speelveld: u dwars (0 links, 1 rechts), v in de lengte (0 ver weg, 1 dichtbij)
  const BANEN = [
    { naam: 'De lange streek', start: [0.5, 0.9], paal: [0.5, 0.13],
      dingen: [{ soort: 'sneeuw', u: 0.2, v: 0.55, r: 0.1 }, { soort: 'sneeuw', u: 0.83, v: 0.3, r: 0.08 }, { soort: 'riet', u: 0.06, v: 0.72, r: 0.05 }] },
    { naam: 'Het wak', start: [0.44, 0.9], paal: [0.56, 0.14],
      dingen: [{ soort: 'wak', u: 0.5, v: 0.5, rx: 0.15, ry: 0.065 }, { soort: 'sneeuw', u: 0.86, v: 0.66, r: 0.09 }, { soort: 'riet', u: 0.94, v: 0.25, r: 0.05 }] },
    { naam: 'Achter de schuit', start: [0.26, 0.9], paal: [0.62, 0.16],
      dingen: [{ soort: 'schuit', u: 0.5, v: 0.44, rx: 0.2, ry: 0.034, hoek: -0.12 }, { soort: 'riet', u: 0.91, v: 0.32, r: 0.06 }, { soort: 'sneeuw', u: 0.15, v: 0.36, r: 0.09 }] },
    { naam: 'Tussen het riet', start: [0.7, 0.9], paal: [0.3, 0.16],
      dingen: [{ soort: 'riet', u: 0.47, v: 0.56, r: 0.06 }, { soort: 'riet', u: 0.6, v: 0.36, r: 0.05 }, { soort: 'sneeuw', u: 0.18, v: 0.46, r: 0.11 }, { soort: 'wak', u: 0.76, v: 0.2, rx: 0.1, ry: 0.05 }] },
    { naam: 'Bij de koek-en-zopie', start: [0.5, 0.92], paal: [0.76, 0.11],
      dingen: [{ soort: 'wak', u: 0.63, v: 0.33, rx: 0.12, ry: 0.05 }, { soort: 'sneeuw', u: 0.28, v: 0.3, r: 0.1 }, { soort: 'schuit', u: 0.34, v: 0.62, rx: 0.15, ry: 0.03, hoek: 0.2 }] }
  ];

  // ============================================================
  // TEGENSPELERS: ze rekenen hun slagen door, maar hun hand trilt een beetje
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', niveau: 1, beloning: 25, hoek: 3.4, kracht: 0.13, kies: 0.35,
      zegt: { start: ['Ik sla hem in één keer!', 'Kijk uit, daar komt hij!'], paal: ['Paal!', 'Raak!'], wak: ['Plons!', 'Oei, het wak!'], mis: ['Te hard!', 'Bijna!'], wint: ['Gewonnen!'], verliest: ['Nog een keer?'] } },
    { id: 'grietje', niveau: 2, beloning: 40, hoek: 2.3, kracht: 0.09, kies: 0.2,
      zegt: { start: ['Mooi ijs vandaag.', 'Zullen we?'], paal: ['Raak!', 'Netjes.'], wak: ['Ach, het wak.', 'Daar gaat hij.'], mis: ['Net niet.', 'Te zacht.'], wint: ['Gewonnen!'], verliest: ['Goed gespeeld!'] } },
    { id: 'kees', niveau: 3, beloning: 60, hoek: 1.65, kracht: 0.07, kies: 0.08,
      zegt: { start: ['Kalm aan, het ijs is glad.', 'Daar gaan we.'], paal: ['Zo maalt de molen.', 'Paal!'], wak: ['Hm, nat.', 'Dat kost een slag.'], mis: ['Tegenwind.', 'Hm.'], wint: ['Fijngemalen!'], verliest: ['Knap gedaan!'] } },
    { id: 'burgemeester', niveau: 4, beloning: 90, hoek: 0.8, kracht: 0.04, kies: 0,
      zegt: { start: ['Ik kolf al veertig winters.', 'Let op, zo doe je dat.'], paal: ['Uiteraard.', 'Zoals verwacht.'], wak: ['Onmogelijk!', 'Wie heeft dat wak gehakt?'], mis: ['Het ijs ligt scheef.', 'Hm.'], wint: ['De stad is van mij.'], verliest: ['Petje af!'] } }
  ];
  TEGENSTANDERS.forEach((t) => { t.naam = window.Personen ? Personen.namen[t.id] : t.id; });
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  const MENS_MODEL = { hoek: 1.3, kracht: 0.06, kies: 0 };
  const BALKLEUR = [{ a: '#FBF5E6', b: '#E3D6B8', c: '#A8946A', naad: '#9A3A2A' }, { a: '#E8B276', b: '#B67638', c: '#6A3E16', naad: '#F3E3C2' }];

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, doek, ctx, ui = {}, gebouwd = false, raf = 0, vorigeT = 0, rest = 0;
  let L = 600, sc = 1, dpr = 1, achter = null, achterSleutel = '';
  let tegen = TEGENSTANDERS[0];          // null = met z'n tweeën
  let aantal = 3, volgorde = [0, 1, 2], nr = 0, potjes = 0;
  let spelers = [], aan = 0, fase = 'klaar', spelId = 0, winnaar = -1;
  let ballen = [], baan = null, mik = null, pijp = [], vlucht = null;
  let deeltjes = [], ringen = [], spoor = [];
  let herstart = null, lesSoort = null, lesBewaard = null;
  let rnd = Math.random;

  const OPSLAG = 'speelhuys.kolf';
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nu = () => performance.now();
  const wacht = (ms) => new Promise((r) => setTimeout(r, rustig() ? Math.min(ms, 80) : ms));
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const willekeurig = (l) => l[Math.floor(rnd() * l.length)];
  const mens = (k) => !spelers[k] || spelers[k].mens;
  const naamVan = (k) => (spelers[k] ? spelers[k].naam : '');
  const gewonnen = () => (window.Duiten ? Duiten.veld('kolf-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  function zaad(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const binnenB = () => B - 2 * RAND, binnenL = () => L - ONDER - VER;
  const somVan = (k) => (spelers[k] ? spelers[k].slagen.reduce((s, x) => s + x, 0) : 0);

  // een baan in echte maten
  function maakBaan(i) {
    const b = BANEN[i], W = binnenB(), H = binnenL();
    const P = ([u, v]) => ({ x: RAND + u * W, y: VER + v * H });
    return {
      i, naam: b.naam, start: P(b.start), paal: P(b.paal),
      dingen: b.dingen.map((d) => {
        const p = P([d.u, d.v]);
        if (d.soort === 'sneeuw' || d.soort === 'riet') return { soort: d.soort, x: p.x, y: p.y, r: d.r * W };
        return { soort: d.soort, x: p.x, y: p.y, rx: d.rx * W, ry: d.ry * H * (d.soort === 'schuit' ? 2.2 : 1), hoek: d.hoek || 0 };
      })
    };
  }

  // ============================================================
  // NATUURKUNDE: ijs remt weinig; zonder toeval
  // ============================================================
  function afstand(v0) { return v0 / DEMPING - (WRIJVING / (DEMPING * DEMPING)) * Math.log(1 + DEMPING * v0 / WRIJVING); }
  function snelheidVoor(s) {
    let lo = 0, hi = VMAX * 1.5;
    for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (afstand(m) < s) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  // in een ellips (met draaiing)? geeft ook de normaal terug
  function inEllips(px, py, d, extra) {
    const c = Math.cos(-d.hoek), s = Math.sin(-d.hoek), dx = px - d.x, dy = py - d.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c, rx = d.rx + extra, ry = d.ry + extra;
    const f = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry);
    if (f >= 1) return null;
    // de normaal in eigen maten, terug gedraaid
    let nx = lx / (rx * rx), ny = ly / (ry * ry);
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const c2 = Math.cos(d.hoek), s2 = Math.sin(d.hoek);
    return { f, nx: nx * c2 - ny * s2, ny: nx * s2 + ny * c2 };
  }
  function stap(lijst, bn, cb) {
    for (const k of lijst) {
      if (!k.op || (k.vx === 0 && k.vy === 0)) continue;
      let v = Math.hypot(k.vx, k.vy);
      let rem = WRIJVING + DEMPING * v;
      for (const d of bn.dingen) if (d.soort === 'sneeuw' && Math.hypot(k.x - d.x, k.y - d.y) < d.r) { rem += SNEEUW; break; }
      if (k.x < RAND || k.x > B - RAND || k.y < VER || k.y > L - ONDER) rem += OEVER;
      const dv = rem * DT;
      if (v <= dv || v < 2) { k.vx = 0; k.vy = 0; continue; }
      const f = (v - dv) / v; k.vx *= f; k.vy *= f; v -= dv;
      k.x += k.vx * DT; k.y += k.vy * DT;
      k.weg += v * DT;
      // de oever: verder dan de sneeuwrand kan hij niet
      if (k.x < RAND - 18) { k.x = RAND - 18; if (k.vx < 0) k.vx = -k.vx * 0.2; }
      if (k.x > B - RAND + 18) { k.x = B - RAND + 18; if (k.vx > 0) k.vx = -k.vx * 0.2; }
      if (k.y < VER - 20) { k.y = VER - 20; if (k.vy < 0) k.vy = -k.vy * 0.2; }
      if (k.y > L - ONDER + 14) { k.y = L - ONDER + 14; if (k.vy > 0) k.vy = -k.vy * 0.2; }
      for (const d of bn.dingen) {
        if (d.soort === 'riet') {
          const dx = k.x - d.x, dy = k.y - d.y, dd = Math.hypot(dx, dy);
          if (dd < d.r + BR && dd > 0) {
            const nx = dx / dd, ny = dy / dd;
            k.x = d.x + nx * (d.r + BR); k.y = d.y + ny * (d.r + BR);
            const vn = k.vx * nx + k.vy * ny;
            if (vn < 0) { k.vx -= (1.15) * vn * nx; k.vy -= (1.15) * vn * ny; k.vx *= 0.45; k.vy *= 0.45; if (cb) cb.riet(k, -vn); }
          }
        } else if (d.soort === 'schuit') {
          const e = inEllips(k.x, k.y, d, BR);
          if (e) {
            // naar buiten duwen langs de normaal, en terugkaatsen
            for (let n = 0; n < 8 && inEllips(k.x, k.y, d, BR); n++) { k.x += e.nx * 1.2; k.y += e.ny * 1.2; }
            const vn = k.vx * e.nx + k.vy * e.ny;
            if (vn < 0) { k.vx -= 1.55 * vn * e.nx; k.vy -= 1.55 * vn * e.ny; if (cb) cb.schuit(k, -vn); }
          }
        } else if (d.soort === 'wak') {
          if (inEllips(k.x, k.y, d, -BR * 0.3)) { k.vx = 0; k.vy = 0; k.op = false; k.inWak = true; if (cb) cb.wak(k, d); break; }
        }
      }
      if (!k.op) continue;
      // de paal
      const px = k.x - bn.paal.x, py = k.y - bn.paal.y, pd = Math.hypot(px, py);
      if (pd < PR + BR && pd > 0) {
        const nx = px / pd, ny = py / pd;
        k.x = bn.paal.x + nx * (PR + BR); k.y = bn.paal.y + ny * (PR + BR);
        const vn = k.vx * nx + k.vy * ny;
        if (vn < 0) { k.vx -= 1.3 * vn * nx; k.vy -= 1.3 * vn * ny; k.vx *= 0.5; k.vy *= 0.5; }
        if (!k.paal) { k.paal = true; if (cb) cb.paal(k, Math.max(0, -vn)); }
      }
    }
    // ballen tegen elkaar
    for (let i = 0; i < lijst.length; i++) {
      const a = lijst[i];
      if (!a.op) continue;
      for (let j = i + 1; j < lijst.length; j++) {
        const b = lijst[j];
        if (!b.op) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * BR * BR || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (2 * BR - d) / 2;
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
  const stil = (lijst) => lijst.every((k) => !k.op || (k.vx === 0 && k.vy === 0));

  // een slag in gedachten afspelen (voor de tegenspeler)
  function simuleer(lijst, bn, i, hoek, v) {
    const kopie = lijst.map((k) => ({ x: k.x, y: k.y, vx: 0, vy: 0, op: k.op && !k.klaar, paal: false, inWak: false, weg: 0 }));
    const k = kopie[i];
    k.op = true; k.vx = Math.cos(hoek) * v; k.vy = Math.sin(hoek) * v;
    let raak = false, wak = false;
    const cb = { riet() {}, schuit() {}, bots() {}, paal(q) { if (q === k) raak = true; }, wak(q) { if (q === k) wak = true; } };
    for (let n = 0; n < 1100; n++) { stap(kopie, bn, cb); if (raak || wak || stil(kopie)) break; }
    return { raak, wak, eind: Math.hypot(k.x - bn.paal.x, k.y - bn.paal.y), x: k.x, y: k.y };
  }
  // ligt er iets tussen een plek en de paal?
  function geblokkeerd(x, y, bn) {
    const dx = bn.paal.x - x, dy = bn.paal.y - y, l = Math.hypot(dx, dy) || 1;
    for (let s = 12; s < l - 8; s += 8) {
      const px = x + dx * s / l, py = y + dy * s / l;
      for (const d of bn.dingen) {
        if (d.soort === 'riet' && Math.hypot(px - d.x, py - d.y) < d.r + BR) return true;
        if ((d.soort === 'wak' || d.soort === 'schuit') && inEllips(px, py, d, BR)) return true;
      }
    }
    return false;
  }

  // ============================================================
  // DE TEGENSPELER KIEST EEN SLAG
  // ============================================================
  function trillend(hoek, v, t, d) {
    return {
      hoek: hoek + gauss() * (t.hoek * RAD + 1.6 / Math.max(60, d)),
      v: klem(v * (1 + gauss() * t.kracht), 20, VMAX)
    };
  }
  function kandidaten(lijst, bn, i) {
    const k = lijst[i], dx = bn.paal.x - k.x, dy = bn.paal.y - k.y, d = Math.hypot(dx, dy), h0 = Math.atan2(dy, dx);
    const uit = [];
    [-24, 14, 60, 150].forEach((extra) => [0, -1.2, 1.2].forEach((dh) => uit.push({ hoek: h0 + dh * RAD, v: snelheidVoor(Math.max(20, d + extra)), doel: 'paal' })));
    // omwegen: een plek waarvandaan je de paal vrij ziet
    const ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    [0.45, 0.65, 0.85].forEach((f) => [-130, -80, -45, 45, 80, 130].forEach((zij) => {
      const px = k.x + dx * f + nx * zij, py = k.y + dy * f + ny * zij;
      if (px < RAND + BR || px > B - RAND - BR || py < VER + BR || py > L - ONDER - BR) return;
      if (geblokkeerd(px, py, bn)) return;
      const ax = px - k.x, ay = py - k.y;
      uit.push({ hoek: Math.atan2(ay, ax), v: snelheidVoor(Math.hypot(ax, ay)), doel: 'omweg' });
    }));
    return uit;
  }
  function beoordeel(lijst, bn, i, c, t, n) {
    let waarde = 0;
    const d = Math.hypot(bn.paal.x - lijst[i].x, bn.paal.y - lijst[i].y);
    for (let s = 0; s < n; s++) {
      const sl = trillend(c.hoek, c.v, t, d);
      const r = simuleer(lijst, bn, i, sl.hoek, sl.v);
      if (r.raak) waarde += 100;
      else if (r.wak) waarde -= 60;
      else waarde -= r.eind / 3.2 + (geblokkeerd(r.x, r.y, bn) ? 34 : 0) + ((r.x < RAND || r.x > B - RAND || r.y < VER) ? 14 : 0);
    }
    return waarde / n;
  }
  function kiesSlag(lijst, bn, i, t) {
    const lijstK = kandidaten(lijst, bn, i);
    lijstK.forEach((c) => { c.waarde = beoordeel(lijst, bn, i, c, t, 4); });
    lijstK.sort((a, b) => b.waarde - a.waarde);
    let keuze = lijstK[0];
    if (lijstK.length > 3 && rnd() < t.kies) keuze = lijstK[1 + Math.floor(rnd() * 3)];
    const d = Math.hypot(bn.paal.x - lijst[i].x, bn.paal.y - lijst[i].y);
    return trillend(keuze.hoek, keuze.v, t, d);
  }

  // ============================================================
  // OPBOUW
  // ============================================================
  const balGezicht = (k) => {
    const c = BALKLEUR[k];
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${k ? '#8FA6AD' : '#A7BABE'}"/>
      <ellipse cx="35" cy="41" rx="18" ry="7" fill="#1E2A30" opacity=".3"/>
      <circle cx="32" cy="32" r="17" fill="url(#ko-bal${k})"/>
      <path d="M17.5 26 Q31 36 37.5 15.5 M27 48.5 Q34 34 48.5 37" fill="none" stroke="${c.naad}" stroke-width="1.6" stroke-dasharray="2.6 2" opacity=".8"/>
      <ellipse cx="25" cy="24" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-35 25 24)"/></svg>`;
  };
  const gezichtVan = (k) => (spelers[k] && spelers[k].persoon && window.Personen ? Personen.gezicht[spelers[k].persoon] : balGezicht(k));

  function bouw() {
    podium = document.getElementById('ko-podium');
    podium.innerHTML = '';
    podium.appendChild(html(`<svg class="mo-defs" width="0" height="0" aria-hidden="true"><defs>
      ${BALKLEUR.map((c, k) => `<radialGradient id="ko-bal${k}" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="${c.a}"/><stop offset=".6" stop-color="${c.b}"/><stop offset="1" stop-color="${c.c}"/></radialGradient>`).join('')}
    </defs></svg>`));
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="ko-stand"></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeler" title="Kies je tegenspeler" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="ko-veldvak">
      <canvas class="ko-doek" role="application" tabindex="0" aria-label="Het ijs met de paal. Druk op je bal, trek naar achteren en laat los. Met het toetsenbord: pijltjes mikken, omhoog en omlaag voor de kracht, spatie slaat."></canvas>
      <div class="ko-baan" aria-live="polite"></div>
      <div class="sj-pops ko-pops" aria-hidden="true"></div>
      <div class="sj-kaart ko-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="ko-stand"></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeler" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met wie kolf je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders"></div>
        <div class="tt-keuzes"><div class="tt-keuzerij" role="group" aria-label="Aantal banen"><button class="kj-chip" type="button" data-banen="3">3 banen</button><button class="kj-chip" type="button" data-banen="5">5 banen</button></div></div>
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
      kaart: [onder.querySelector('.mo-speler'), boven.querySelector('.mo-speler')],
      midden, vak: midden.querySelector('.ko-veldvak'), pops: midden.querySelector('.ko-pops'), uitslag: midden.querySelector('.ko-kaart'),
      baan: midden.querySelector('.ko-baan'), meer: boven.querySelector('.mo-meer'), menu, lijst: menu.querySelector('.mo-tegenstanders'), meld
    };
    doek = midden.querySelector('.ko-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', neer);
    doek.addEventListener('pointermove', beweeg);
    doek.addEventListener('pointerup', los);
    doek.addEventListener('pointercancel', () => { if (mik && !mik.computer) mik = null; });
    doek.addEventListener('keydown', toets);
    ui.kaart[1].addEventListener('click', openMenu);
    ui.meer.addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('kolf'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    menu.querySelectorAll('[data-banen]').forEach((c) => c.addEventListener('click', () => {
      const n = +c.getAttribute('data-banen');
      if (n === aantal) return;
      aantal = n;
      if (window.Duiten) Duiten.zetVeld('kolf-banen', n);
      werkSchakelaars(); sluitMenu(); nieuwePartij();
    }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(ui.midden);
    window.addEventListener('resize', () => pasMaatAan());
    const les = document.getElementById('les');
    if (les && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (location.hash === '#kolf' && les.hidden) { lesDemo(null); hervat(); } }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
    }
    gebouwd = true;
  }

  function pasMaatAan() {
    if (!ui.midden || !doek) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let breed = r.width;
    if (window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches) {
      // dwars: het ijs krijgt alles wat de twee smalle kolommen met de kaarten overlaten
      const pr = podium.getBoundingClientRect(), cs = getComputedStyle(podium);
      breed = pr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * 168 - 20;
    }
    const nieuweL = Math.round(B * klem((r.height - 8) / Math.max(1, breed - 8), 1.02, 1.72));
    const s = Math.max(0.4, Math.min((breed - 8) / B, (r.height - 8) / nieuweL, 1.7));
    const nieuweDpr = Math.min(3, window.devicePixelRatio || 1);
    if (nieuweL === L && Math.abs(s - sc) < 0.001 && nieuweDpr === dpr && achter) return;
    if (nieuweL !== L) herschik(L, nieuweL);
    L = nieuweL; sc = s; dpr = nieuweDpr;
    podium.style.setProperty('--ko-b', Math.round(B * sc) + 'px');
    podium.style.setProperty('--ko-h', Math.round(L * sc) + 'px');
    doek.width = Math.round(B * sc * dpr); doek.height = Math.round(L * sc * dpr);
    achter = null;
    if (baan) { baan = maakBaan(baan.i); teken(); }
  }
  // als het veld langer of korter wordt, schuiven de ballen mee
  function herschik(oud, nieuw) {
    const f = (y) => VER + (y - VER) * (nieuw - ONDER - VER) / Math.max(1, oud - ONDER - VER);
    ballen.forEach((k) => { k.y = f(k.y); if (k.vanY !== undefined) k.vanY = f(k.vanY); });
  }

  // ============================================================
  // HET LANDSCHAP: een keer getekend per baan (lucht, verre stad, oevers, ijs, wak, sneeuw, schuit, riet)
  // ============================================================
  function maakAchter() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    const k = sc * dpr;
    g.setTransform(k, 0, 0, k, 0, 0);
    const r = zaad(1600 + (baan ? baan.i * 31 : 0));
    tekenLucht(g, r);
    tekenVerte(g, r);
    tekenIjs(g, r);
    if (baan) baan.dingen.forEach((d) => { if (d.soort === 'wak') tekenWak(g, d, r); });
    if (baan) baan.dingen.forEach((d) => { if (d.soort === 'sneeuw') tekenSneeuwhoop(g, d, r); });
    tekenOevers(g, r);
    if (baan) tekenStart(g, baan.start);
    if (baan) baan.dingen.forEach((d) => { if (d.soort === 'schuit') tekenSchuit(g, d); if (d.soort === 'riet') tekenRietpol(g, d, r); });
    tekenToeschouwers(g, r);
    // licht: de lage winterzon van linksboven, en een zachte rand
    g.setTransform(1, 0, 0, 1, 0, 0);
    const w = c.width, h = c.height;
    let gr = g.createRadialGradient(w * 0.15, h * 0.05, 0, w * 0.15, h * 0.05, Math.hypot(w, h));
    gr.addColorStop(0, 'rgba(255, 236, 200, .16)'); gr.addColorStop(0.5, 'rgba(255, 236, 200, .04)'); gr.addColorStop(1, 'rgba(255, 236, 200, 0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    gr = g.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.4, w / 2, h * 0.55, Math.hypot(w, h) * 0.62);
    gr.addColorStop(0, 'rgba(20, 30, 40, 0)'); gr.addColorStop(1, 'rgba(20, 30, 40, .38)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return c;
  }
  function tekenLucht(g, r) {
    let gr = g.createLinearGradient(0, 0, 0, HOR + 8);
    gr.addColorStop(0, '#B9C7CC'); gr.addColorStop(0.55, '#DCD9CB'); gr.addColorStop(1, '#EEDFC6');
    g.fillStyle = gr; g.fillRect(0, 0, B, HOR + 10);
    // een paar zachte wolken
    for (let i = 0; i < 7; i++) {
      const x = r() * B, y = 6 + r() * (HOR - 22), rx = 30 + r() * 60, ry = 5 + r() * 7;
      gr = g.createRadialGradient(x, y, 0, x, y, rx);
      gr.addColorStop(0, 'rgba(250, 248, 242, .5)'); gr.addColorStop(1, 'rgba(250, 248, 242, 0)');
      g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    // vogels
    g.strokeStyle = 'rgba(70, 76, 80, .55)'; g.lineWidth = 0.7;
    [[300, 18], [312, 14], [322, 20], [92, 24]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 3, y); g.quadraticCurveTo(x - 1.4, y - 1.6, x, y); g.quadraticCurveTo(x + 1.4, y - 1.6, x + 3, y); g.stroke(); });
  }
  // de verte: een stadje met een kerk, een molen, bomen, en het ijs met kleine schaatsers
  function tekenVerte(g, r) {
    const ver = 'rgba(122, 132, 138, .75)', verder = 'rgba(150, 158, 162, .6)';
    // het verre ijs tussen de horizon en de oever
    let gr = g.createLinearGradient(0, HOR, 0, VER - 8);
    gr.addColorStop(0, '#D9DCD4'); gr.addColorStop(1, '#C3CCC8');
    g.fillStyle = gr; g.fillRect(0, HOR, B, VER - HOR);
    // het stadje links
    g.fillStyle = verder;
    g.beginPath(); g.moveTo(0, HOR + 1);
    [[0, HOR - 6], [14, HOR - 6], [14, HOR - 11], [22, HOR - 16], [30, HOR - 11], [30, HOR - 7], [44, HOR - 7], [44, HOR - 12], [52, HOR - 17], [60, HOR - 12], [60, HOR - 6], [78, HOR - 6], [78, HOR - 9], [96, HOR - 9], [96, HOR - 4], [118, HOR - 4], [118, HOR + 1]].forEach(([x, y]) => g.lineTo(x, y));
    g.closePath(); g.fill();
    // de kerk met spits
    g.fillStyle = ver;
    g.fillRect(64, HOR - 22, 7, 22);
    g.beginPath(); g.moveTo(62.5, HOR - 22); g.lineTo(67.5, HOR - 40); g.lineTo(72.5, HOR - 22); g.closePath(); g.fill();
    g.fillRect(67, HOR - 44, 1, 5);
    g.fillRect(70, HOR - 12, 22, 12);
    g.beginPath(); g.moveTo(69, HOR - 12); g.lineTo(81, HOR - 19); g.lineTo(93, HOR - 12); g.closePath(); g.fill();
    // een standerdmolen rechts
    const mx = 336, my = HOR - 2;
    g.fillStyle = ver; g.strokeStyle = ver;
    g.lineWidth = 1; g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx, my - 9); g.lineTo(mx + 6, my); g.stroke();
    g.fillRect(mx - 5, my - 22, 10, 13);
    g.beginPath(); g.moveTo(mx - 6, my - 22); g.lineTo(mx, my - 27); g.lineTo(mx + 6, my - 22); g.closePath(); g.fill();
    g.save(); g.translate(mx, my - 18); g.rotate(0.35);
    g.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      g.rotate(Math.PI / 2);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -17); g.stroke();
      g.fillStyle = 'rgba(122, 132, 138, .45)'; g.fillRect(0.6, -16, 3.6, 12);
    }
    g.restore();
    // kale bomen langs de verre horizon
    const boom = (x, h, kleur) => {
      g.strokeStyle = kleur; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(x, HOR + 1); g.lineTo(x, HOR - h); g.stroke();
      for (let i = 0; i < 7; i++) { const y = HOR - h * (0.35 + i * 0.09), l = h * (0.4 - i * 0.04); g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.7, y - l * 0.6); g.moveTo(x, y); g.lineTo(x + l * 0.6, y - l * 0.7); g.stroke(); }
    };
    [[140, 16], [152, 12], [176, 18], [238, 14], [258, 19], [276, 13], [372, 15], [388, 11]].forEach(([x, h]) => boom(x, h, verder));
    // kleine schaatsers en een slee op het verre ijs
    const figuurtje = (x, y, s, kleur, leun) => {
      g.strokeStyle = kleur; g.fillStyle = kleur; g.lineWidth = 0.9 * s;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + leun * s, y - 6 * s); g.stroke();
      g.beginPath(); g.moveTo(x - 2 * s, y); g.lineTo(x + leun * s, y - 4 * s); g.lineTo(x + 2.4 * s, y); g.stroke();
      g.beginPath(); g.arc(x + leun * s * 1.15, y - 7.3 * s, 1.1 * s, 0, Math.PI * 2); g.fill();
    };
    const rij = [[40, HOR + 18, 1, 'rgba(60, 54, 50, .7)', 1.6], [118, HOR + 26, 1.15, 'rgba(70, 40, 34, .75)', -1.4], [196, HOR + 14, 0.85, 'rgba(60, 54, 50, .65)', 1.2],
      [210, HOR + 15, 0.85, 'rgba(120, 40, 30, .6)', 1.2], [292, HOR + 30, 1.2, 'rgba(50, 46, 44, .75)', 1.8], [356, HOR + 20, 0.95, 'rgba(60, 54, 50, .7)', -1.5]];
    rij.forEach(([x, y, s, k, l]) => figuurtje(x, y, s, k, l));
    // schaduwlijntjes van het verre ijs
    g.strokeStyle = 'rgba(255, 255, 255, .35)'; g.lineWidth = 0.6;
    for (let i = 0; i < 26; i++) { const x = r() * B, y = HOR + 6 + r() * (VER - HOR - 22), l = 8 + r() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 1.5); g.stroke(); }
    // de verre oever: een sneeuwrand met riet en knotwilgen
    const oy = VER - 12;
    gr = g.createLinearGradient(0, oy - 10, 0, oy + 12);
    gr.addColorStop(0, '#F6F4EC'); gr.addColorStop(1, '#D9DFE2');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, oy + 10);
    for (let x = 0; x <= B; x += 10) g.lineTo(x, oy - 4 + Math.sin(x * 0.05) * 2 + (r() - 0.5) * 2);
    g.lineTo(B, oy + 14); g.lineTo(0, oy + 14); g.closePath(); g.fill();
    for (let x = 4; x < B; x += 3 + r() * 6) riet(g, x, oy + 2 + r() * 6, 0.6 + r() * 0.6, r);
    [[58, oy + 4, 1.05], [214, oy + 2, 0.92], [322, oy + 5, 1.12]].forEach(([x, y, s]) => knotwilg(g, x, y, s, r));
    kraam(g, 128, oy + 3);
  }
  function riet(g, x, y, s, r) {
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const h = (9 + r() * 9) * s, buig = (r() - 0.5) * 5 * s;
      g.strokeStyle = r() < 0.5 ? '#B49A60' : '#8E7543'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(x + i * 0.8, y); g.quadraticCurveTo(x + i * 0.8 + buig * 0.3, y - h * 0.6, x + i * 0.8 + buig, y - h); g.stroke();
      if (r() < 0.35) { g.fillStyle = '#6E5530'; g.beginPath(); g.ellipse(x + i * 0.8 + buig, y - h - 2 * s, 0.9 * s, 2.6 * s, buig * 0.06, 0, Math.PI * 2); g.fill(); }
    }
  }
  // een knotwilg: een dikke stam met een knot, en een kroon van dunne rechte twijgen
  function knotwilg(g, x, y, s, r) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(30, 40, 50, .18)'; g.beginPath(); g.ellipse(6, 1.5, 12, 2.6, 0, 0, Math.PI * 2); g.fill();
    const gr = g.createLinearGradient(-5, 0, 6, 0);
    gr.addColorStop(0, '#5C4632'); gr.addColorStop(0.5, '#3E2E20'); gr.addColorStop(1, '#2A1E14');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-6, -10, -4, -18); g.quadraticCurveTo(-7, -21, -4, -24); g.quadraticCurveTo(0, -26, 4, -24); g.quadraticCurveTo(7, -21, 4, -18); g.quadraticCurveTo(6, -10, 5, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255, 250, 240, .18)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-3, -2); g.quadraticCurveTo(-4, -10, -2.5, -17); g.stroke();
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 1.7, l = 12 + r() * 16, bx = (r() - 0.5) * 7;
      g.strokeStyle = r() < 0.5 ? 'rgba(92, 58, 40, .85)' : 'rgba(122, 76, 52, .75)'; g.lineWidth = 0.55;
      g.beginPath(); g.moveTo(bx, -23); g.quadraticCurveTo(bx + Math.cos(a) * l * 0.5, -23 + Math.sin(a) * l * 0.5 - 1, bx + Math.cos(a) * l, -23 + Math.sin(a) * l); g.stroke();
    }
    // sneeuw op de knot
    g.fillStyle = '#F4F2EA'; g.beginPath(); g.ellipse(0, -24.5, 4.6, 1.5, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // de koek-en-zopie: een tentje van zeil met een vlaggetje en een ton ervoor
  function kraam(g, x, y) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(30, 40, 50, .18)'; g.beginPath(); g.ellipse(4, 1, 20, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#E8DFC9'; g.beginPath(); g.moveTo(-16, 0); g.lineTo(-2, -20); g.lineTo(12, 0); g.closePath(); g.fill();
    g.fillStyle = '#CFC3A6'; g.beginPath(); g.moveTo(-2, -20); g.lineTo(12, 0); g.lineTo(17, -1); g.lineTo(4, -20); g.closePath(); g.fill();
    g.fillStyle = '#4A3A2A'; g.beginPath(); g.moveTo(-5, 0); g.lineTo(-2, -8); g.lineTo(1, 0); g.closePath(); g.fill();
    g.strokeStyle = '#5A4632'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-2, -20); g.lineTo(-2, -29); g.stroke();
    g.fillStyle = '#B23A2C'; g.beginPath(); g.moveTo(-2, -29); g.lineTo(5, -27); g.lineTo(-2, -25); g.closePath(); g.fill();
    g.fillStyle = '#7A5634'; g.fillRect(10, -5, 5, 5); g.fillStyle = '#5A3E24'; g.fillRect(10, -3.4, 5, 0.8);
    g.restore();
  }
  // het ijs: grijsgroen, met krassen van schaatsen, scheuren, luchtbelletjes en wat sneeuwstof
  function tekenIjs(g, r) {
    let gr = g.createLinearGradient(0, VER - 10, 0, L);
    gr.addColorStop(0, '#C1CDCB'); gr.addColorStop(0.35, '#A9BBBB'); gr.addColorStop(1, '#8DA1A3');
    g.fillStyle = gr; g.fillRect(0, VER - 10, B, L - VER + 10);
    // vlekken: het ijs is niet overal even helder
    for (let i = 0; i < 16; i++) {
      const x = r() * B, y = VER + r() * (L - VER), rad = 30 + r() * 80, licht = r() < 0.5;
      gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, licht ? 'rgba(226, 236, 236, .14)' : 'rgba(40, 70, 78, .12)'); gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // de weerspiegeling van de wilgen
    [58, 214, 322].forEach((x) => {
      gr = g.createLinearGradient(0, VER - 4, 0, VER + 46);
      gr.addColorStop(0, 'rgba(60, 50, 40, .14)'); gr.addColorStop(1, 'rgba(60, 50, 40, 0)');
      g.fillStyle = gr; g.fillRect(x - 6, VER - 4, 12, 50);
    });
    // krassen van schaatsen: lange bogen
    for (let i = 0; i < 70; i++) {
      const x = r() * B, y = VER + r() * (L - VER), l = 30 + r() * 140, hoek = (r() - 0.5) * 1.6 + (r() < 0.5 ? 0 : Math.PI / 2 * (r() - 0.5));
      const bocht = (r() - 0.5) * 40;
      g.strokeStyle = `rgba(250, 252, 252, ${(0.12 + r() * 0.26).toFixed(3)})`; g.lineWidth = 0.4 + r() * 0.7;
      const ex = x + Math.cos(hoek) * l, ey = y + Math.sin(hoek) * l * 0.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + ex) / 2 - Math.sin(hoek) * bocht, (y + ey) / 2 + Math.cos(hoek) * bocht, ex, ey); g.stroke();
    }
    // scheuren: dunne donkere lijnen met witte randjes, die vertakken
    const scheur = (x, y, hoek, l, diepte) => {
      let px = x, py = y;
      const stukken = 5 + Math.floor(r() * 5);
      for (let i = 0; i < stukken; i++) {
        hoek += (r() - 0.5) * 0.9;
        const nx = px + Math.cos(hoek) * l / stukken, ny = py + Math.sin(hoek) * l / stukken;
        g.strokeStyle = 'rgba(46, 70, 78, .45)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
        g.strokeStyle = 'rgba(255, 255, 255, .4)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(px + 0.7, py + 0.7); g.lineTo(nx + 0.7, ny + 0.7); g.stroke();
        if (diepte < 2 && r() < 0.3) scheur(nx, ny, hoek + (r() < 0.5 ? 0.9 : -0.9), l * 0.4, diepte + 1);
        px = nx; py = ny;
      }
    };
    for (let i = 0; i < 5; i++) scheur(RAND + r() * (B - 2 * RAND), VER + 30 + r() * (L - VER - 80), r() * Math.PI * 2, 50 + r() * 70, 0);
    // luchtbelletjes, ingevroren
    for (let i = 0; i < 140; i++) {
      const x = r() * B, y = VER + r() * (L - VER), s = 0.5 + r() * 1.5;
      g.fillStyle = `rgba(245, 250, 250, ${(0.2 + r() * 0.35).toFixed(3)})`;
      g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
    }
    // sneeuwstof dat over het ijs is gewaaid
    for (let i = 0; i < 22; i++) {
      const x = r() * B, y = VER + r() * (L - VER), rx = 14 + r() * 40;
      gr = g.createRadialGradient(x, y, 0, x, y, rx);
      gr.addColorStop(0, 'rgba(246, 248, 246, .3)'); gr.addColorStop(1, 'rgba(246, 248, 246, 0)');
      g.save(); g.translate(x, y); g.scale(1, 0.4); g.translate(-x, -y);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }
  // de oevers links, rechts en onderaan: sneeuw met een blauwe schaduwrand en riet
  function tekenOevers(g, r) {
    const oever = (pad, glans) => {
      const gr = g.createLinearGradient(0, VER, 0, L);
      gr.addColorStop(0, '#F5F3EB'); gr.addColorStop(1, '#E2E6E6');
      g.fillStyle = gr; g.fill(pad);
      g.save(); g.clip(pad);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(190, 204, 216, ${(0.08 + r() * 0.16).toFixed(3)})`; const x = r() * B, y = VER - 20 + r() * (L - VER + 20); g.beginPath(); g.ellipse(x, y, 2 + r() * 6, 1 + r() * 2, 0, 0, Math.PI * 2); g.fill(); }
      // voetstappen in de sneeuw
      for (let i = 0; i < 24; i++) { const x = glans(r()), y = VER + r() * (L - VER - 10); g.fillStyle = 'rgba(160, 176, 190, .35)'; g.beginPath(); g.ellipse(x, y, 1.4, 2.4, 0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(x + 3, y + 5, 1.4, 2.4, 0.3, 0, Math.PI * 2); g.fill(); }
      g.restore();
    };
    const golf = (y) => Math.sin(y * 0.045) * 3 + Math.sin(y * 0.13) * 1.4;
    // links
    const links = new Path2D(); links.moveTo(0, VER - 14);
    for (let y = VER - 14; y <= L; y += 6) links.lineTo(RAND - 4 + golf(y), y);
    links.lineTo(0, L); links.closePath();
    // rechts
    const rechts = new Path2D(); rechts.moveTo(B, VER - 14);
    for (let y = VER - 14; y <= L; y += 6) rechts.lineTo(B - RAND + 4 + golf(y + 50), y);
    rechts.lineTo(B, L); rechts.closePath();
    // onder
    const onder = new Path2D(); onder.moveTo(0, L);
    for (let x = 0; x <= B; x += 6) onder.lineTo(x, L - ONDER + 6 + Math.sin(x * 0.07) * 2);
    onder.lineTo(B, L); onder.closePath();
    // eerst een blauwe schaduw onder de sneeuwrand, zodat de oever hoger ligt dan het ijs
    g.save(); g.translate(2.5, 3); g.fillStyle = 'rgba(70, 96, 120, .3)'; g.fill(links); g.fill(rechts); g.fill(onder); g.restore();
    oever(links, (x) => 4 + x * (RAND - 12));
    oever(rechts, (x) => B - RAND + 8 + x * (RAND - 12));
    oever(onder, (x) => 20 + x * (B - 40));
    // riet langs de rand van het ijs
    for (let y = VER; y < L - ONDER; y += 4 + r() * 10) { if (r() < 0.5) riet(g, RAND - 6 + golf(y) + r() * 4, y, 0.7 + r() * 0.5, r); if (r() < 0.5) riet(g, B - RAND + 2 + golf(y + 50) + r() * 4, y, 0.7 + r() * 0.5, r); }
  }
  // toeschouwers op de oever, zoals de figuurtjes van Avercamp
  function tekenToeschouwers(g, r) {
    const mens = (x, y, s, jas, accent, hoed, rok) => {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = 'rgba(60, 80, 100, .22)'; g.beginPath(); g.ellipse(3, 0.5, 7, 1.8, 0, 0, Math.PI * 2); g.fill();
      if (rok) { g.fillStyle = jas; g.beginPath(); g.moveTo(-4.5, 0); g.quadraticCurveTo(-3.6, -8, -2.4, -12); g.lineTo(2.4, -12); g.quadraticCurveTo(3.6, -8, 4.5, 0); g.closePath(); g.fill(); }
      else {
        g.strokeStyle = '#2A2420'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-1.2, 0); g.lineTo(-1, -6); g.moveTo(1.2, 0); g.lineTo(1, -6); g.stroke();
        g.fillStyle = jas; g.beginPath(); g.moveTo(-3, -5); g.quadraticCurveTo(-3.4, -10, -2.4, -13); g.lineTo(2.4, -13); g.quadraticCurveTo(3.4, -10, 3, -5); g.closePath(); g.fill();
      }
      g.fillStyle = accent; g.fillRect(-2.6, rok ? -8.5 : -8, 5.2, 1.4);
      g.fillStyle = '#E8C9A8'; g.beginPath(); g.arc(0, -14.8, 1.9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#F4F0E6'; g.beginPath(); g.ellipse(0, -13, 2.8, 0.9, 0, 0, Math.PI * 2); g.fill();
      if (hoed === 'hoog') { g.fillStyle = '#1E1A18'; g.fillRect(-1.8, -20.5, 3.6, 4.6); g.beginPath(); g.ellipse(0, -16.3, 3.6, 0.9, 0, 0, Math.PI * 2); g.fill(); }
      else if (hoed === 'muts') { g.fillStyle = '#F4F0E6'; g.beginPath(); g.arc(0, -15.6, 2.2, Math.PI, 0); g.fill(); }
      else { g.fillStyle = '#2A2420'; g.beginPath(); g.ellipse(0, -16.4, 3.4, 1.1, 0, 0, Math.PI * 2); g.fill(); g.fillRect(-1.6, -18.2, 3.2, 1.9); }
      g.restore();
    };
    const plek = [[14, VER + 30, 1, '#2C2A2E', '#A8352A', 'hoog', false], [20, VER + 44, 0.95, '#5A3A2A', '#2C4A7C', 'muts', true],
      [B - 16, VER + 70, 1.05, '#2E2826', '#C9A24E', 'rond', false], [B - 22, L - 80, 1, '#3B2C3A', '#F0E6D2', 'muts', true], [12, L - 120, 1, '#2C3A2E', '#A8352A', 'rond', false]];
    plek.forEach(([x, y, s, jas, acc, hoed, rok]) => mens(x, y, s, jas, acc, hoed, rok));
  }
  function tekenWak(g, d, r) {
    g.save(); g.translate(d.x, d.y); g.rotate(d.hoek);
    // de afgebroken rand: lichter ijs, dan het zwarte water
    const rand = new Path2D(), water = new Path2D();
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, f = 1 + (r() - 0.5) * 0.12;
      const x = Math.cos(a) * (d.rx + 6) * f, y = Math.sin(a) * (d.ry + 5) * f;
      if (i) rand.lineTo(x, y); else rand.moveTo(x, y);
      const f2 = 1 + (r() - 0.5) * 0.1, x2 = Math.cos(a) * d.rx * f2, y2 = Math.sin(a) * d.ry * f2;
      if (i) water.lineTo(x2, y2); else water.moveTo(x2, y2);
    }
    g.fillStyle = 'rgba(232, 240, 242, .85)'; g.fill(rand);
    let gr = g.createLinearGradient(0, -d.ry, 0, d.ry);
    gr.addColorStop(0, '#14242C'); gr.addColorStop(1, '#2C4652');
    g.fillStyle = gr; g.fill(water);
    // glans op het water en kleine ijsschotsjes
    g.save(); g.clip(water);
    g.strokeStyle = 'rgba(200, 220, 228, .35)'; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-d.rx * 0.6 + i * 8, -d.ry * 0.2 + i * 3); g.lineTo(-d.rx * 0.2 + i * 10, -d.ry * 0.25 + i * 3); g.stroke(); }
    g.fillStyle = 'rgba(220, 232, 236, .8)';
    [[0.3, 0.2, 4], [-0.45, 0.35, 3], [0.6, -0.3, 2.6]].forEach(([u, v, s]) => { g.beginPath(); g.moveTo(u * d.rx - s, v * d.ry); g.lineTo(u * d.rx, v * d.ry - s * 0.6); g.lineTo(u * d.rx + s, v * d.ry + 0.4); g.closePath(); g.fill(); });
    g.restore();
    g.strokeStyle = 'rgba(30, 50, 60, .5)'; g.lineWidth = 0.8; g.stroke(water);
    g.restore();
    // een waarschuwing: een paaltje met een bosje stro, zoals men een wak aangaf
    g.save(); g.translate(d.x + d.rx * Math.cos(d.hoek) + 8, d.y + d.rx * Math.sin(d.hoek) - 2);
    g.strokeStyle = '#4A3624'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -16); g.stroke();
    g.fillStyle = '#D8B866'; g.beginPath(); g.ellipse(0, -17, 3.4, 2.2, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#B8963E'; g.lineWidth = 0.6; for (let i = -3; i <= 3; i += 1.5) { g.beginPath(); g.moveTo(0, -17); g.lineTo(i, -20.5); g.stroke(); }
    g.restore();
  }
  function tekenSneeuwhoop(g, d, r) {
    g.save();
    let gr = g.createRadialGradient(d.x + 3, d.y + 3, 0, d.x + 3, d.y + 3, d.r * 1.15);
    gr.addColorStop(0, 'rgba(70, 96, 120, .22)'); gr.addColorStop(1, 'rgba(70, 96, 120, 0)');
    g.fillStyle = gr; g.beginPath(); g.arc(d.x + 3, d.y + 3, d.r * 1.15, 0, Math.PI * 2); g.fill();
    const pad = new Path2D();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, f = 1 + Math.sin(a * 3 + d.x) * 0.06 + (r() - 0.5) * 0.06; const x = d.x + Math.cos(a) * d.r * f, y = d.y + Math.sin(a) * d.r * f * 0.82; if (i) pad.lineTo(x, y); else pad.moveTo(x, y); }
    gr = g.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.35, d.r * 0.1, d.x, d.y, d.r);
    gr.addColorStop(0, '#FFFFFC'); gr.addColorStop(0.65, '#EEF1F0'); gr.addColorStop(1, '#C6D2DA');
    g.fillStyle = gr; g.fill(pad);
    g.save(); g.clip(pad);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(170, 190, 206, ${(0.1 + r() * 0.15).toFixed(3)})`; g.beginPath(); g.ellipse(d.x + (r() - 0.5) * d.r * 2, d.y + (r() - 0.5) * d.r * 1.6, 1.5 + r() * 3, 0.8 + r(), 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    g.restore();
  }
  // een vastgevroren schuitje, van boven gezien
  function tekenSchuit(g, d) {
    g.save(); g.translate(d.x, d.y); g.rotate(d.hoek);
    const rx = d.rx, ry = d.ry;
    const romp = new Path2D();
    romp.moveTo(-rx, 0); romp.quadraticCurveTo(-rx * 0.85, -ry, -rx * 0.4, -ry); romp.lineTo(rx * 0.55, -ry * 0.95); romp.quadraticCurveTo(rx * 1.02, -ry * 0.6, rx, 0);
    romp.quadraticCurveTo(rx * 1.02, ry * 0.6, rx * 0.55, ry * 0.95); romp.lineTo(-rx * 0.4, ry); romp.quadraticCurveTo(-rx * 0.85, ry, -rx, 0); romp.closePath();
    g.save(); g.translate(3, 4); g.fillStyle = 'rgba(40, 60, 80, .3)'; g.fill(romp); g.restore();
    let gr = g.createLinearGradient(0, -ry, 0, ry);
    gr.addColorStop(0, '#6E4A2C'); gr.addColorStop(0.5, '#5A3A22'); gr.addColorStop(1, '#3E2816');
    g.fillStyle = gr; g.fill(romp);
    // de binnenkant met planken en twee doften
    g.save(); g.scale(0.84, 0.72);
    gr = g.createLinearGradient(0, -ry, 0, ry);
    gr.addColorStop(0, '#8C6440'); gr.addColorStop(1, '#6A4A2E');
    g.fillStyle = gr; g.fill(romp);
    g.strokeStyle = 'rgba(40, 24, 12, .45)'; g.lineWidth = 0.7;
    for (let y = -ry * 0.6; y <= ry * 0.6; y += ry * 0.4) { g.beginPath(); g.moveTo(-rx * 0.8, y); g.lineTo(rx * 0.85, y); g.stroke(); }
    g.restore();
    g.fillStyle = '#4A3018'; [-rx * 0.3, rx * 0.25].forEach((x) => g.fillRect(x - 2.5, -ry * 0.7, 5, ry * 1.4));
    // sneeuw in de boot en op de rand
    g.fillStyle = 'rgba(250, 250, 246, .9)';
    g.beginPath(); g.ellipse(-rx * 0.55, ry * 0.15, rx * 0.18, ry * 0.4, 0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(rx * 0.55, -ry * 0.1, rx * 0.14, ry * 0.32, -0.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255, 250, 240, .35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-rx * 0.4, -ry + 0.8); g.lineTo(rx * 0.55, -ry * 0.95 + 0.8); g.stroke();
    // ijs eromheen, opgestuwd
    g.strokeStyle = 'rgba(235, 244, 246, .6)'; g.lineWidth = 2.2; g.stroke(romp);
    g.restore();
  }
  // een pol riet die uit het ijs steekt
  function tekenRietpol(g, d, r) {
    const gr = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 1.3);
    gr.addColorStop(0, 'rgba(120, 100, 60, .35)'); gr.addColorStop(1, 'rgba(120, 100, 60, 0)');
    g.fillStyle = gr; g.beginPath(); g.arc(d.x, d.y, d.r * 1.3, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, dd = r() * d.r * 0.8; riet(g, d.x + Math.cos(a) * dd, d.y + Math.sin(a) * dd * 0.7, 0.9 + r() * 0.6, r); }
  }
  // het beginpunt: een kruis in het ijs gekrast
  function tekenStart(g, p) {
    g.strokeStyle = 'rgba(255, 255, 255, .6)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(p.x - 7, p.y - 7); g.lineTo(p.x + 7, p.y + 7); g.moveTo(p.x + 7, p.y - 7); g.lineTo(p.x - 7, p.y + 7); g.stroke();
    g.strokeStyle = 'rgba(40, 60, 70, .3)'; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(p.x - 6.4, p.y - 7.6); g.lineTo(p.x + 7.6, p.y + 6.4); g.stroke();
  }

  // ============================================================
  // TEKENEN WAT BEWEEGT: de paal, de ballen, de kolf, de richtlijn
  // ============================================================
  function tekenPaal(g, t) {
    const p = baan.paal;
    g.save();
    // schaduw op het ijs, naar rechtsonder
    g.fillStyle = 'rgba(30, 50, 60, .28)'; g.beginPath(); g.moveTo(p.x - 2, p.y); g.lineTo(p.x + 22, p.y + 20); g.lineTo(p.x + 25, p.y + 18); g.lineTo(p.x + 3, p.y - 1); g.closePath(); g.fill();
    g.fillStyle = 'rgba(30, 50, 60, .3)'; g.beginPath(); g.ellipse(p.x + 1, p.y + 1, PR + 2, (PR + 2) * 0.5, 0, 0, Math.PI * 2); g.fill();
    // het ijs is om de paal heen wat opgestoven
    g.fillStyle = 'rgba(250, 252, 252, .55)'; g.beginPath(); g.ellipse(p.x, p.y + 0.5, PR + 4, (PR + 4) * 0.45, 0, 0, Math.PI * 2); g.fill();
    // de paal zelf: een ronde houten paal, rechtop
    const h = 44;
    const gr = g.createLinearGradient(p.x - PR, 0, p.x + PR, 0);
    gr.addColorStop(0, '#8C6A44'); gr.addColorStop(0.35, '#C49A64'); gr.addColorStop(1, '#5A3E24');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(p.x - PR * 0.8, p.y); g.lineTo(p.x - PR * 0.7, p.y - h); g.quadraticCurveTo(p.x, p.y - h - 2.4, p.x + PR * 0.7, p.y - h); g.lineTo(p.x + PR * 0.8, p.y); g.quadraticCurveTo(p.x, p.y + 1.6, p.x - PR * 0.8, p.y); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40, 24, 12, .35)'; g.lineWidth = 0.5;
    for (let y = p.y - h + 8; y < p.y - 4; y += 9) { g.beginPath(); g.moveTo(p.x - PR * 0.6, y); g.quadraticCurveTo(p.x, y + 1.2, p.x + PR * 0.6, y); g.stroke(); }
    // een rood lint bovenaan, dat wappert
    const w = Math.sin(t / 260) * 2.4, w2 = Math.sin(t / 190 + 1) * 1.6;
    g.fillStyle = '#B5372A';
    g.beginPath(); g.moveTo(p.x + PR * 0.5, p.y - h + 3); g.quadraticCurveTo(p.x + 9, p.y - h + 1 + w, p.x + 17, p.y - h + 4 + w2); g.lineTo(p.x + 15, p.y - h + 8 + w2); g.quadraticCurveTo(p.x + 8, p.y - h + 6 + w, p.x + PR * 0.5, p.y - h + 7); g.closePath(); g.fill();
    g.restore();
  }
  function tekenBal(g, k) {
    if (!k.op && !k.zinkt) return;
    const c = BALKLEUR[k.wie], s = k.zinkt ? Math.max(0, 1 - k.zinkt) : 1;
    if (s <= 0) return;
    const r = BR * s;
    g.save();
    g.globalAlpha = k.klaar ? 0.55 : 1;
    g.fillStyle = 'rgba(28, 46, 56, .32)'; g.beginPath(); g.ellipse(k.x + 2.4, k.y + 3, r * 1.05, r * 0.6, 0.3, 0, Math.PI * 2); g.fill();
    const gr = g.createRadialGradient(k.x - r * 0.35, k.y - r * 0.4, r * 0.1, k.x, k.y, r);
    gr.addColorStop(0, c.a); gr.addColorStop(0.62, c.b); gr.addColorStop(1, c.c);
    g.fillStyle = gr; g.beginPath(); g.arc(k.x, k.y, r, 0, Math.PI * 2); g.fill();
    // de naad draait mee met hoe ver hij gegleden is
    g.save(); g.beginPath(); g.arc(k.x, k.y, r * 0.96, 0, Math.PI * 2); g.clip();
    g.translate(k.x, k.y); g.rotate(k.weg / BR * 0.5 + k.wie); g.scale(r, r * (0.55 + 0.45 * Math.abs(Math.cos(k.weg / BR * 0.35))));
    g.strokeStyle = c.naad; g.lineWidth = 0.09; g.setLineDash([0.16, 0.12]);
    g.beginPath(); g.moveTo(-0.95, -0.3); g.quadraticCurveTo(-0.05, 0.25, 0.25, -0.98); g.moveTo(-0.2, 0.98); g.quadraticCurveTo(0.2, -0.05, 0.96, 0.32); g.stroke();
    g.setLineDash([]);
    g.restore();
    g.fillStyle = 'rgba(255, 255, 255, .55)'; g.beginPath(); g.ellipse(k.x - r * 0.38, k.y - r * 0.42, r * 0.3, r * 0.17, -0.6, 0, Math.PI * 2); g.fill();
    if (k.wenk > 0.02) { g.strokeStyle = `rgba(255, 222, 130, ${(k.wenk * (0.55 + 0.35 * Math.sin(nu() / 170))).toFixed(3)})`; g.lineWidth = 2; g.beginPath(); g.arc(k.x, k.y, r + 6, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  // de kolf achter de bal: een ijzeren kop aan een houten steel; bij het terugtrekken gaat hij naar achteren
  function tekenKolf(g, m) {
    const k = ballen[m.k];
    if (!k) return;
    const ux = Math.cos(m.hoek), uy = Math.sin(m.hoek), px = -uy, py = ux;
    const terug = BR + 5 + (m.zwaai !== undefined ? m.zwaai : m.trek * 0.3);
    const hx = k.x - ux * terug, hy = k.y - uy * terug;
    // wie slaat, staat naast de bal: de steel loopt schuin naar achteren en opzij, naar de handen
    const sx = hx - ux * 52 + px * 34, sy = hy - uy * 52 + py * 34;
    g.save();
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(30, 50, 60, .22)'; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(hx + 4, hy + 5); g.lineTo(sx + 10, sy + 14); g.stroke();
    const gr = g.createLinearGradient(hx, hy, sx, sy);
    gr.addColorStop(0, '#7A5430'); gr.addColorStop(1, '#4A3018');
    g.strokeStyle = gr; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(sx, sy); g.stroke();
    g.strokeStyle = 'rgba(255, 240, 210, .3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx - 1, hy - 1); g.lineTo(sx - 1, sy - 1); g.stroke();
    // de greep: een stuk leer om het eind van de steel
    g.strokeStyle = '#2E1C0E'; g.lineWidth = 4.4;
    g.beginPath(); g.moveTo(sx + (hx - sx) * 0.2, sy + (hy - sy) * 0.2); g.lineTo(sx, sy); g.stroke();
    // de ijzeren kop: dwars op de slagrichting, met het slagvlak naar de bal
    g.translate(hx, hy); g.rotate(m.hoek);
    g.fillStyle = 'rgba(30, 50, 60, .3)'; g.beginPath(); g.ellipse(2, 4, 6, 10, 0, 0, Math.PI * 2); g.fill();
    const kg = g.createLinearGradient(-4, 0, 4, 0);
    kg.addColorStop(0, '#3A3A38'); kg.addColorStop(0.6, '#6A6A66'); kg.addColorStop(1, '#2A2A28');
    g.fillStyle = kg;
    g.beginPath(); g.moveTo(-4.5, -9); g.lineTo(3, -8.5); g.quadraticCurveTo(5, -8, 5, -6); g.lineTo(5, 7); g.quadraticCurveTo(5, 9, 3, 9.5); g.lineTo(-4.5, 9); g.quadraticCurveTo(-6, 0, -4.5, -9); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255, 255, 255, .35)'; g.fillRect(2.6, -7, 1.2, 14);
    g.restore();
  }
  function tekenMik(g, m) {
    const k = ballen[m.k];
    if (!k || m.computer) return;
    const ux = Math.cos(m.hoek), uy = Math.sin(m.hoek), f = klem((m.trek - TREK_MIN) / (TREK_MAX - TREK_MIN), 0, 1);
    // de richtlijn: een stippellijn over het ijs, even lang bij elke kracht
    g.save();
    g.strokeStyle = 'rgba(255, 250, 236, .8)'; g.lineWidth = 2; g.setLineDash([5, 6]); g.lineCap = 'round';
    g.beginPath(); g.moveTo(k.x + ux * (BR + 4), k.y + uy * (BR + 4)); g.lineTo(k.x + ux * (BR + GIDS), k.y + uy * (BR + GIDS)); g.stroke();
    g.setLineDash([]);
    // de kracht: een boogje om de bal dat volloopt van groen naar rood
    const kleur = f < 0.5 ? `rgba(${Math.round(120 + f * 2 * 120)}, 200, 110, .95)` : `rgba(240, ${Math.round(200 - (f - 0.5) * 2 * 140)}, 90, .95)`;
    g.strokeStyle = 'rgba(20, 30, 36, .35)'; g.lineWidth = 5; g.beginPath(); g.arc(k.x, k.y, BR + 9, -Math.PI / 2, Math.PI * 1.5); g.stroke();
    g.strokeStyle = kleur; g.lineWidth = 3.4; g.beginPath(); g.arc(k.x, k.y, BR + 9, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); g.stroke();
    g.restore();
  }
  function tekenEffecten(g, t) {
    deeltjes = deeltjes.filter((d) => {
      const u = (t - d.t0) / d.duur;
      if (u >= 1) return false;
      g.fillStyle = `rgba(${d.kleur}, ${(d.a * (1 - u)).toFixed(3)})`;
      g.beginPath(); g.arc(d.x + d.vx * u, d.y + d.vy * u + d.val * u * u, d.r * (1 - u * 0.4), 0, Math.PI * 2); g.fill();
      return true;
    });
    ringen = ringen.filter((q) => {
      const u = (t - q.t0) / q.duur;
      if (u >= 1) return false;
      g.strokeStyle = `rgba(${q.kleur}, ${(0.85 * (1 - u)).toFixed(3)})`; g.lineWidth = 2.6 * (1 - u) + 0.5;
      g.beginPath(); g.ellipse(q.x, q.y, q.r0 + (q.r1 - q.r0) * u, (q.r0 + (q.r1 - q.r0) * u) * (q.plat || 1), 0, 0, Math.PI * 2); g.stroke();
      return true;
    });
  }
  function scherf(x, y, n, kleur, kracht, val) {
    if (rustig()) return;
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, v = (8 + rnd() * 22) * (kracht || 1);
      deeltjes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - (val ? 10 : 0), val: val || 0, r: 0.8 + rnd() * 1.4, a: 0.7, kleur: kleur || '246, 250, 252', t0: nu(), duur: 380 + rnd() * 360 });
    }
  }
  function ring(x, y, kleur, r1, plat) { if (!rustig()) ringen.push({ x, y, r0: 6, r1: r1 || 34, duur: 520, kleur: kleur || '255, 224, 140', t0: nu(), plat }); }
  // het spoor dat een bal op het ijs trekt
  function tekenSpoor(g) {
    if (!spoor.length) return;
    g.save(); g.lineCap = 'round';
    spoor.forEach((s) => {
      if (s.punten.length < 2) return;
      g.strokeStyle = `rgba(255, 255, 255, ${(0.32 * s.a).toFixed(3)})`; g.lineWidth = 1.2;
      g.beginPath(); s.punten.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    });
    g.restore();
  }

  function teken() {
    if (!ctx || !doek.width || !baan) return;
    const t = nu();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!achter || achterSleutel !== baan.i + '|' + L) { achter = maakAchter(); achterSleutel = baan.i + '|' + L; }
    ctx.drawImage(achter, 0, 0);
    const k = sc * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    tekenSpoor(ctx);
    // wat dichterbij is (lager op het scherm), komt over wat verder weg is
    const dingen = ballen.filter((b) => b.op || b.zinkt).map((b) => ({ y: b.y, teken: () => tekenBal(ctx, b) }));
    dingen.push({ y: baan.paal.y, teken: () => tekenPaal(ctx, t) });
    dingen.sort((a, b) => a.y - b.y).forEach((d) => d.teken());
    if (mik) { tekenMik(ctx, mik); tekenKolf(ctx, mik); }
    tekenEffecten(ctx, t);
  }

  // ============================================================
  // DE LUS: natuurkunde met vaste stapjes, en tekenen
  // ============================================================
  function lus(t) {
    raf = requestAnimationFrame(lus);
    const dt = vorigeT ? Math.min(0.05, (t - vorigeT) / 1000) : 0;
    vorigeT = t;
    if (vlucht) {
      rest += dt;
      let n = 0;
      while (rest >= DT && n < 12) { stap(ballen, baan, vlucht.cb); rest -= DT; n++; }
      ballen.forEach((b, i) => {
        if (!b.op || (b.vx === 0 && b.vy === 0)) return;
        const s = spoor[i] || (spoor[i] = { punten: [], a: 1 });
        const l = s.punten[s.punten.length - 1];
        if (!l || Math.hypot(l[0] - b.x, l[1] - b.y) > 5) s.punten.push([b.x, b.y]);
        s.a = 1;
      });
      if (stil(ballen)) { const v = vlucht; vlucht = null; rest = 0; v.klaar(); }
    }
    spoor.forEach((s) => { if (s) s.a = Math.max(0, s.a - dt * 0.12); });
    ballen.forEach((b, i) => {
      if (b.zinkt) b.zinkt = Math.min(1, b.zinkt + dt * 2.2);
      const wenk = fase === 'mikken' && i === aan && mens(aan) && !mik ? 1 : 0;
      b.wenk += (wenk - b.wenk) * Math.min(1, dt * 8);
    });
    teken();
  }
  const wachtTot = (test, max) => new Promise((klaar) => { const t0 = nu(); const kijk = () => { if (test() || nu() - t0 > max) klaar(); else setTimeout(kijk, 30); }; kijk(); });
  function wachtOpLes() {
    return new Promise((klaar) => {
      const l = document.getElementById('les');
      if (!l || l.hidden) { klaar(); return; }
      const mo = new MutationObserver(() => { if (l.hidden) { mo.disconnect(); setTimeout(klaar, 250); } });
      mo.observe(l, { attributes: true, attributeFilter: ['hidden'] });
    });
  }

  // ============================================================
  // HET SPELVERLOOP
  // ============================================================
  function nieuwePartij() {
    spelId++;
    mik = null; vlucht = null; winnaar = -1; herstart = null;
    if (tegen) spelers = [{ naam: 'Jij', mens: true, slagen: [] }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, slagen: [] }];
    else spelers = [{ naam: 'Speler 1', mens: true, slagen: [] }, { naam: 'Speler 2', mens: true, slagen: [] }];
    volgorde = Array.from({ length: aantal }, (_, i) => i % BANEN.length);
    nr = 0;
    aan = potjes % 2;
    potjes++;
    ui.uitslag.hidden = true;
    if (tegen) setTimeout(() => zeg(1, 'start'), 500);
    meld(tegen ? `Nieuwe partij tegen ${tegen.naam}.` : 'Nieuwe partij met z\'n tweeën.');
    nieuweBaan();
  }
  function nieuweBaan(bewaard) {
    const id = ++spelId;
    baan = maakBaan(volgorde[nr] !== undefined ? volgorde[nr] : nr % BANEN.length);
    achter = null; spoor = []; mik = null; vlucht = null;
    spelers.forEach((p) => { p.slagen[nr] = 0; });
    ballen = [0, 1].map((wie) => ({ wie, x: baan.start.x, y: baan.start.y, vx: 0, vy: 0, op: false, klaar: false, paal: false, inWak: false, weg: 0, wenk: 0, gestart: false }));
    if (bewaard) {
      bewaard.ballen.forEach((o, i) => Object.assign(ballen[i], o));
      spelers.forEach((p, i) => { p.slagen[nr] = bewaard.slagen[i]; });
    }
    werkBaanBij();
    banier(nr >= aantal ? 'Beslissende baan' : `Baan ${nr + 1}`, baan.naam);
    werkKaartenBij();
    setTimeout(() => { if (id === spelId) volgendeBeurt(); }, rustig() ? 200 : 1300);
  }
  function werkBaanBij() {
    if (!ui.baan) return;
    ui.baan.innerHTML = `<b>${nr >= aantal ? 'Beslissend' : `Baan ${nr + 1}<small>/${aantal}</small>`}</b><span>${baan.naam}</span>`;
  }
  // wie is er aan de beurt: om de beurt, maar wie klaar is, slaat niet meer
  function volgendeBeurt() {
    const klaar = (k) => ballen[k].klaar;
    if (klaar(0) && klaar(1)) { baanKlaar(); return; }
    if (klaar(aan)) aan = 1 - aan;
    const k = ballen[aan];
    // nog niet geslagen: de bal komt op het kruis te liggen (naast die van de ander als die er nog ligt)
    if (!k.gestart) {
      k.gestart = true; k.op = true;
      k.x = baan.start.x; k.y = baan.start.y;
      const o = ballen[1 - aan];
      if (o.op && Math.hypot(o.x - k.x, o.y - k.y) < BR * 2.4) k.x += (k.x > B / 2 ? -1 : 1) * BR * 2.6;
    }
    fase = mens(aan) ? 'mikken' : 'computer';
    bewaar();
    werkKaartenBij();
    if (!mens(aan)) computerBeurt();
  }
  async function computerBeurt() {
    const id = spelId, t = spelers[aan].t;
    await wacht(700);
    await wachtOpLes();
    if (id !== spelId || fase !== 'computer') return;
    const sl = kiesSlag(ballen, baan, aan, t);
    // ze mikt zichtbaar: de kolf draait naar de richting, trekt terug en zwaait
    const k = ballen[aan], h0 = Math.atan2(baan.paal.y - k.y, baan.paal.x - k.x);
    const doelTrek = klem(sl.v / VMAX * TREK_MAX, TREK_MIN, TREK_MAX);
    mik = { k: aan, hoek: h0, trek: 0, computer: true };
    const t0 = nu(), duur = rustig() ? 60 : 900;
    await new Promise((klaar) => {
      const stap1 = () => {
        if (id !== spelId || !mik) { klaar(); return; }
        const u = Math.min(1, (nu() - t0) / duur), e = 1 - Math.pow(1 - u, 3);
        let dh = sl.hoek - h0; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
        mik.hoek = h0 + dh * Math.min(1, e * 1.4);
        mik.trek = doelTrek * e;
        if (u < 1) requestAnimationFrame(stap1); else klaar();
      };
      stap1();
    });
    await wacht(280);
    if (id !== spelId || !mik) return;
    mik.hoek = sl.hoek;
    await zwaai(mik);
    if (id !== spelId) return;
    mik = null;
    sla(aan, sl.hoek, sl.v);
  }
  // de kolf zwaait naar de bal
  function zwaai(m) {
    return new Promise((klaar) => {
      const van = m.trek * 0.32, t0 = nu(), duur = rustig() ? 20 : 90;
      const stapje = () => {
        const u = Math.min(1, (nu() - t0) / duur);
        m.zwaai = van * (1 - u * u);
        if (u < 1) requestAnimationFrame(stapje); else klaar();
      };
      stapje();
    });
  }
  function sla(wie, hoek, v) {
    const k = ballen[wie];
    k.vanX = k.x; k.vanY = k.y;
    k.vx = Math.cos(hoek) * v; k.vy = Math.sin(hoek) * v;
    spelers[wie].slagen[nr]++;
    fase = 'rolt';
    Geluid.kolf(v / VMAX);
    if (mens(wie) && window.Tril) Tril.klik();
    scherf(k.x - Math.cos(hoek) * BR, k.y - Math.sin(hoek) * BR, 6, '246, 250, 252', 0.8);
    spoor[wie] = { punten: [[k.x, k.y]], a: 1 };
    werkKaartenBij();
    let paal = null, wak = null;
    const id = spelId;
    const cb = {
      riet(q, kr) { Geluid.schuif(); scherf(q.x, q.y, 4, '190, 160, 100', 0.6); },
      schuit(q, kr) { Geluid.hout(Math.min(1, kr / 300)); scherf(q.x, q.y, 3, '120, 90, 60', 0.5); },
      bots(a, b, kr) { Geluid.knik(Math.min(1, kr / 300)); ring((a.x + b.x) / 2, (a.y + b.y) / 2, '255, 255, 255', 18); },
      paal(q, kr) { if (q === k && !paal) { paal = q; Geluid.paal(Math.min(1, 0.3 + kr / 300)); ring(baan.paal.x, baan.paal.y, '255, 214, 110', 40, 0.5); scherf(baan.paal.x, baan.paal.y - 6, 10, '255, 236, 170', 1); } },
      wak(q, d) { if (!wak && q === k) { wak = q; Geluid.plons(); scherf(q.x, q.y, 14, '160, 200, 220', 1.2, 30); ring(q.x, q.y, '200, 230, 240', 26, 0.5); q.zinkt = 0.01; } else if (q !== k) { q.zinkt = 0.01; } }
    };
    vlucht = { cb, klaar: () => { if (id === spelId) naSlag(wie, paal, wak); } };
  }
  async function naSlag(wie, paal, wak) {
    const id = spelId, k = ballen[wie], p = spelers[wie];
    // een andere bal die in het wak is getikt, gaat terug naar waar hij lag (zonder strafslag)
    ballen.forEach((b) => { if (b !== k && b.inWak) { b.inWak = false; b.zinkt = 0; b.op = true; b.x = b.vanX !== undefined ? b.vanX : baan.start.x; b.y = b.vanY !== undefined ? b.vanY : baan.start.y; } });
    if (paal) {
      k.klaar = true;
      pop([baan.paal.x, baan.paal.y - 40], 'Paal!', 'serie');
      vonken(12);
      if (p.t) zeg(wie, 'paal');
      if (mens(wie) && window.Tril) Tril.succes();
      meld(`${p.naam} raakt de paal in ${p.slagen[nr]} ${p.slagen[nr] === 1 ? 'slag' : 'slagen'}.`);
      await wacht(700);
      if (id !== spelId) return;
      k.op = false;
    } else if (wak) {
      p.slagen[nr]++;
      pop([k.x, k.y - 20], 'Plons! +1', 'fout');
      if (p.t) zeg(wie, 'wak');
      meld(`${p.naam} slaat in het wak: een strafslag.`);
      await wacht(900);
      if (id !== spelId) return;
      k.inWak = false; k.zinkt = 0; k.op = true; k.x = k.vanX; k.y = k.vanY; k.vx = 0; k.vy = 0;
      scherf(k.x, k.y, 5, '246, 250, 252', 0.5);
    } else if (p.t && rnd() < 0.3) zeg(wie, 'mis');
    // te veel slagen: dan pak je je bal op
    if (!k.klaar && p.slagen[nr] >= MAX_SLAG) {
      p.slagen[nr] = MAX_SLAG + 1;
      k.klaar = true; k.op = false;
      pop([k.x, k.y - 20], 'Opgepakt', 'zacht');
    }
    werkKaartenBij();
    await wacht(250);
    if (id !== spelId) return;
    aan = 1 - aan;
    volgendeBeurt();
  }
  async function baanKlaar() {
    const id = spelId;
    fase = 'tussen';
    const s0 = spelers[0].slagen[nr], s1 = spelers[1].slagen[nr];
    const kop = s0 === s1 ? 'Gelijk' : `${s0 < s1 ? naamVan(0) : naamVan(1)} wint de baan`;
    toonUitslag(kop, `${naamVan(0)} ${s0} · ${s1} ${naamVan(1)}`);
    await wacht(rustig() ? 400 : 2100);
    if (id !== spelId) return;
    ui.uitslag.hidden = true;
    nr++;
    const t0 = somVan(0), t1 = somVan(1);
    if (nr >= aantal && t0 !== t1) { einde(t0 < t1 ? 0 : 1); return; }
    // na drie beslissende banen nog steeds gelijk: dan is het gelijkspel
    if (nr >= aantal + 3) { einde(-1); return; }
    // wie de baan won, mag de volgende beginnen
    if (s0 !== s1) aan = s0 < s1 ? 0 : 1;
    if (nr >= aantal) volgorde[nr] = (volgorde[nr - 1] + 2) % BANEN.length;
    nieuweBaan();
  }
  function toonUitslag(kop, regel) {
    ui.uitslag.innerHTML = `<b></b><span></span>`;
    ui.uitslag.querySelector('b').textContent = kop;
    ui.uitslag.querySelector('span').textContent = regel;
    ui.uitslag.hidden = false;
    ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
  }
  function einde(w) {
    fase = 'klaar'; winnaar = w; mik = null;
    werkKaartenBij();
    wis();
    const t0 = somVan(0), t1 = somVan(1);
    let bedrag, tekst, verder = null, gewonnenSpel = false;
    if (w < 0) {
      bedrag = 15; tekst = `Gelijkspel: ${t0} tegen ${t1} slagen.`;
      banier('Gelijkspel', `${t0} tegen ${t1} slagen`);
      Geluid.fluit();
    } else if (!tegen) {
      bedrag = 20; gewonnenSpel = true; tekst = `${naamVan(w)} wint met ${Math.min(t0, t1)} slagen!`;
      banier(`${naamVan(w)} wint!`, `${t0} tegen ${t1} slagen`);
      Geluid.tada(); vonken(30);
    } else if (w === 0) {
      const telling = gewonnen(), eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('kolf-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true; tekst = `Gewonnen van ${tegen.naam}: ${t0} tegen ${t1} slagen!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} is vrij!`;
        verder = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('kolf-tegen', volgende.id); nieuwePartij(); } };
      }
      banier('Gewonnen!', `${t0} tegen ${t1} slagen`);
      Geluid.tada(); vonken(40);
      if (window.Tril) Tril.succes();
      zeg(1, 'verliest');
    } else {
      bedrag = 10; tekst = `${tegen.naam} won met ${t1} tegen ${t0} slagen. Goed geprobeerd!`;
      banier(`${tegen.naam} wint`, `${t1} tegen ${t0} slagen`);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'kolf', bedrag, gewonnen: gewonnenSpel, tekst, verder, wacht: 2400 });
    setTimeout(() => {
      if (fase !== 'klaar' || !ui.uitslag) return;
      ui.uitslag.innerHTML = `<b>${w < 0 ? 'Gelijkspel' : tegen ? (w === 0 ? 'Gewonnen!' : 'Volgende keer beter') : `${naamVan(w)} wint!`}</b><span>${t0} tegen ${t1} slagen</span><button class="knop ko-weer" type="button">${icoon('opnieuw')}Nog een partij</button>`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.ko-weer').addEventListener('click', () => nieuwePartij());
    }, 2300);
  }

  // ============================================================
  // MIKKEN MET JE VINGER (of het toetsenbord)
  // ============================================================
  function naarVeld(e) { const r = doek.getBoundingClientRect(); return { x: (e.clientX - r.left) / sc, y: (e.clientY - r.top) / sc, t: nu() }; }
  function neer(e) {
    if (fase !== 'mikken' || !mens(aan) || lesOpen()) return;
    const p = naarVeld(e), k = ballen[aan];
    // druk op of vlak bij je bal; anders trek je vanaf waar je drukt
    e.preventDefault();
    try { doek.setPointerCapture(e.pointerId); } catch (er) { /* */ }
    mik = { k: aan, hoek: Math.atan2(baan.paal.y - k.y, baan.paal.x - k.x), trek: 0, van: Math.hypot(p.x - k.x, p.y - k.y) < 44 ? null : p };
    pijp = [p];
    Geluid.pak();
    if (window.Tril) Tril.tik();
    werkKaartenBij();
  }
  function beweeg(e) {
    if (!mik || mik.computer) return;
    const p = naarVeld(e);
    pijp.push(p); if (pijp.length > 8) pijp.shift();
    zetMik(p);
  }
  function zetMik(p) {
    const k = ballen[mik.k], o = mik.van || k;
    const dx = o.x - p.x, dy = o.y - p.y, l = Math.hypot(dx, dy);
    const vorige = mik.trek;
    mik.trek = klem(l, 0, TREK_MAX);
    if (l > 4) mik.hoek = Math.atan2(dy, dx);
    if (mik.trek >= TREK_MAX && vorige < TREK_MAX && window.Tril) Tril.tik();
  }
  function los() {
    if (!mik || mik.computer) return;
    // de stand van net voor het loslaten: een vinger trekt bij het optillen vaak nog even
    const t = nu(), eerder = pijp.filter((q) => t - q.t > 40);
    if (eerder.length) zetMik(eerder[eerder.length - 1]);
    const m = mik;
    if (m.trek < TREK_MIN) { mik = null; werkKaartenBij(); return; }
    fase = 'slaat';
    const id = spelId;
    zwaai(m).then(() => { if (id !== spelId) return; mik = null; sla(m.k, m.hoek, m.trek / TREK_MAX * VMAX); });
  }
  function toets(e) {
    if (fase !== 'mikken' || !mens(aan)) return;
    const k = ballen[aan];
    if (!mik && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(e.key)) {
      mik = { k: aan, hoek: Math.atan2(baan.paal.y - k.y, baan.paal.x - k.x), trek: TREK_MAX * 0.45, toets: true };
      e.preventDefault();
      if (e.key !== ' ' && e.key !== 'Enter') return;
    }
    if (!mik) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { mik.hoek += (e.key === 'ArrowLeft' ? -1 : 1) * (e.altKey ? 0.2 : 1) * RAD; e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { mik.trek = klem(mik.trek + (e.key === 'ArrowUp' ? 3 : -3), TREK_MIN, TREK_MAX); e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); const m = mik, id = spelId; fase = 'slaat'; zwaai(m).then(() => { if (id !== spelId) return; mik = null; sla(m.k, m.hoek, m.trek / TREK_MAX * VMAX); }); }
    else if (e.key === 'Escape') mik = null;
  }

  // ============================================================
  // HET SCHERM ERBOVEN
  // ============================================================
  function werkKaartenBij() {
    if (!ui.kaart || !spelers.length) return;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k], p = spelers[k];
      const actief = k === aan && (fase === 'mikken' || fase === 'computer' || fase === 'slaat' || fase === 'rolt');
      kaart.classList.toggle('aan', actief);
      kaart.classList.toggle('ko-winnaar', fase === 'klaar' && winnaar === k);
      const gz = kaart.querySelector('.mo-gezicht'), wie = p.persoon || 'bal' + k;
      if (gz.getAttribute('data-wie') !== wie) { gz.innerHTML = gezichtVan(k); gz.setAttribute('data-wie', wie); }
      kaart.querySelector('.mo-naam').textContent = p.naam;
      const deze = p.slagen[nr] || 0, totaal = somVan(k);
      kaart.querySelector('.ko-stand').innerHTML = `<b class="ko-totaal" aria-label="${totaal} slagen in totaal">${totaal}</b><small class="ko-deze" aria-label="${deze} slagen deze baan">${ballen[k] && ballen[k].klaar ? icoon('vink') : `${icoon('kolf')}${deze}`}</small>`;
      const doe = kaart.querySelector('.mo-doe');
      let hint = '';
      if (actief && mens(k)) hint = fase === 'mikken' ? (mik ? '<span>Laat los om te slaan</span>' : `${icoon('pijl', 'ko-terug')}<span>Trek terug en laat los</span>`) : '';
      else if (actief && !mens(k)) hint = '<span class="mo-denk" aria-label="mikt"><i></i><i></i><i></i></span>';
      if (doe.getAttribute('data-hint') !== hint) { doe.innerHTML = hint; doe.setAttribute('data-hint', hint); }
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-kolf"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', `${tegen ? 'Tegenspeler: ' + tegen.naam : 'Speler 2'}, ${totaal} slagen. Tik om te wisselen`);
      } else kaart.setAttribute('aria-label', `${p.naam}, ${totaal} slagen`);
    });
  }
  function zeg(k, soort) {
    const p = spelers[k];
    if (!p || !p.t || !ui.kaart) return;
    const b = ui.kaart[k].querySelector('.mo-ballon');
    b.textContent = willekeurig(p.t.zegt[soort] || ['…']);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(zeg.t);
    zeg.t = setTimeout(() => { b.hidden = true; }, soort === 'wint' || soort === 'verliest' ? 4000 : 2400);
  }
  function pop(p, tekst, soort) {
    if (!ui.pops || !doek) return;
    const e = document.createElement('span');
    e.className = 'sj-pop ko-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekst;
    const rv = ui.vak.getBoundingClientRect(), r = doek.getBoundingClientRect();
    e.style.left = klem(r.left - rv.left + p[0] * sc, 50, rv.width - 50) + 'px';
    e.style.top = klem(r.top - rv.top + p[1] * sc, 30, rv.height - 20) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), 1700);
  }
  function banier(titel, sub) {
    if (!ui.vak) return;
    ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    const b = document.createElement('div');
    b.className = 'sj-banier ko-banier';
    b.innerHTML = '<b></b><span></span>';
    b.querySelector('b').textContent = titel;
    b.querySelector('span').textContent = sub || '';
    ui.vak.appendChild(b);
    setTimeout(() => b.remove(), 1800);
  }
  function vonken(aantalV) {
    if (rustig() || !ui.pops) return;
    const rr = ui.vak.getBoundingClientRect();
    for (let i = 0; i < aantalV; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (rr.width * Math.random()) + 'px';
      v.style.top = (rr.height * (0.08 + Math.random() * 0.5)) + 'px';
      ui.pops.appendChild(v);
      const an = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(20 + Math.random() * 40).toFixed(0)}px)) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 500, easing: 'ease-out', fill: 'both' });
      an.onfinish = () => v.remove();
    }
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }

  // ============================================================
  // KEUZEMENU
  // ============================================================
  function openMenu() {
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.lijst.querySelector('.mo-keuze.nu') || ui.lijst.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu() { if (ui.menu) ui.menu.hidden = true; }
  function werkSchakelaars() {
    ui.menu.querySelector('.mo-geluid').setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    ui.menu.querySelector('.mo-muziek').setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
    ui.menu.querySelectorAll('[data-banen]').forEach((c) => c.classList.toggle('nu', +c.getAttribute('data-banen') === aantal));
  }
  function tekenMenu() {
    const telling = gewonnen();
    ui.lijst.innerHTML = '';
    TEGENSTANDERS.concat([TWEE]).forEach((t) => {
      const open = t === TWEE || isOpen(t);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mo-keuze' + ((t === TWEE ? !tegen : tegen === t) ? ' nu' : '') + (open ? '' : ' dicht');
      const keer = telling[t.id] || 0;
      const pips = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-kolf"/></svg>`).join('')}</span>`;
      const gezichtje = t === TWEE ? `<span class="mo-twee">${balGezicht(0)}${balGezicht(1)}</span>` : (window.Personen ? Personen.gezicht[t.id] : '');
      b.innerHTML = `<span class="mo-gezicht">${gezichtje}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span>
        <span class="mo-keuze-naam">${t.naam}</span>${pips}
        ${t !== TWEE && open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${t.beloning}</span>` : ''}`;
      b.setAttribute('aria-label', t === TWEE ? 'Met z\'n tweeën op dit toestel' : `${t.naam}, niveau ${t.niveau} van 4${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`);
      b.addEventListener('click', () => {
        if (!open) {
          b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
          if (window.Tril) Tril.fout();
          Geluid.pak();
          return;
        }
        tegen = t === TWEE ? null : t;
        if (window.Duiten) Duiten.zetVeld('kolf-tegen', t.id);
        sluitMenu();
        nieuwePartij();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // BEWAREN: weg en terug, dan sla je verder waar je was
  // ============================================================
  function bewaar() {
    if (!spelers.length || fase === 'klaar') return;
    try {
      localStorage.setItem(OPSLAG, JSON.stringify({
        tegen: tegen ? tegen.id : 'twee', aantal, volgorde, nr, aan, potjes,
        slagen: spelers.map((p) => p.slagen.slice()),
        ballen: ballen.map((b) => ({ x: b.x, y: b.y, op: b.op, klaar: b.klaar, gestart: b.gestart, vanX: b.vanX, vanY: b.vanY }))
      }));
    } catch (e) { /* */ }
  }
  function wis() { try { localStorage.removeItem(OPSLAG); } catch (e) { /* */ } }
  function laad() {
    try {
      const o = JSON.parse(localStorage.getItem(OPSLAG) || 'null');
      if (!o || !Array.isArray(o.slagen) || o.slagen.length !== 2 || !Array.isArray(o.ballen) || o.ballen.length !== 2) return null;
      if (typeof o.nr !== 'number' || o.nr < 0 || o.nr > 12) return null;
      return o;
    } catch (e) { return null; }
  }

  // ============================================================
  // ONDERBREKEN (weg van het scherm, of Gijs komt uitleggen) EN HERVATTEN
  // ============================================================
  function onderbreek() {
    if (ui.vak) ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    if (!gebouwd || fase === 'klaar' || !spelers.length) return;
    // een rollende bal maakt zijn slag gewoon af, in één keer
    if (vlucht) {
      for (let n = 0; n < 4000 && !stil(ballen); n++) stap(ballen, baan, vlucht.cb);
      const v = vlucht; vlucht = null; rest = 0;
      spelId++;
      v.klaar = () => {};
      herstart = 'beurt';
      // de afloop van de slag: zelf afhandelen, zonder wachten
      const k = ballen[aan];
      ballen.forEach((b) => { if (b.inWak) { b.inWak = false; b.zinkt = 0; b.op = true; if (b === k) spelers[aan].slagen[nr]++; b.x = b.vanX; b.y = b.vanY; b.vx = 0; b.vy = 0; } });
      if (k.paal) { k.klaar = true; k.op = false; }
      if (!k.klaar && spelers[aan].slagen[nr] >= MAX_SLAG) { spelers[aan].slagen[nr] = MAX_SLAG + 1; k.klaar = true; k.op = false; }
      aan = 1 - aan;
    } else {
      spelId++;
      if (fase === 'computer' || fase === 'slaat' || fase === 'tussen' || fase === 'mikken') herstart = fase === 'tussen' ? 'baan' : 'beurt';
    }
    mik = null;
    werkKaartenBij();
  }
  function hervat() {
    if (!gebouwd || lesOpen() || !spelers.length) return;
    const h = herstart; herstart = null;
    if (h === 'baan') { baanKlaar(); return; }
    if (h === 'beurt') volgendeBeurt();
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function lesDemo(soort) {
    if (!gebouwd || soort === lesSoort || !baan) return;
    if (!lesSoort && soort) { onderbreek(); lesBewaard = { ballen: ballen.map((b) => Object.assign({}, b)), baanI: baan.i }; }
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) { lesBewaard.ballen.forEach((o, i) => Object.assign(ballen[i], o)); lesBewaard = null; mik = null; }
      return;
    }
    // jouw bal ligt klaar op het kruis
    const k = ballen[0];
    if (!k.op) { k.op = true; k.x = baan.start.x; k.y = baan.start.y; }
    mik = soort === 'mik' ? { k: 0, hoek: Math.atan2(baan.paal.y - k.y, baan.paal.x - k.x), trek: TREK_MAX * 0.55, demo: true } : null;
  }
  const vakOm = (x, y, r) => { const d = doek.getBoundingClientRect(); return { left: d.left + (x - r) * sc, top: d.top + (y - r) * sc, width: 2 * r * sc, height: 2 * r * sc }; };
  const scherm = (x, y) => { const d = doek.getBoundingClientRect(); return [d.left + x * sc, d.top + y * sc]; };
  if (window.Les) {
    Les.zet('kolf', () => {
      const obstakel = baan ? (baan.dingen.find((d) => d.soort === 'wak') || baan.dingen.find((d) => d.soort === 'sneeuw') || baan.dingen[0]) : null;
      return [
        { doel: () => { lesDemo('kijk'); return vakOm(baan.paal.x, baan.paal.y - 18, 30); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Sla je bal met de kolf tegen de paal, met zo min mogelijk slagen' },
        { doel: () => { lesDemo('mik'); const k = ballen[0]; return vakOm(k.x, k.y, 26); }, vorm: 'rond', gebaar: 'veeg', van: () => scherm(ballen[0].x, ballen[0].y), naar: () => { const k = ballen[0], h = Math.atan2(baan.paal.y - k.y, baan.paal.x - k.x); return scherm(k.x - Math.cos(h) * 90, k.y - Math.sin(h) * 90); }, tekst: 'Druk op je bal, trek terug en laat los. Hoe verder je trekt, hoe harder' },
        { doel: () => { lesDemo('kijk'); const k = ballen[0], p = baan.paal; return { left: doek.getBoundingClientRect().left + (Math.min(k.x, p.x) - 30) * sc, top: doek.getBoundingClientRect().top + (p.y - 10) * sc, width: (Math.abs(k.x - p.x) + 60) * sc, height: (k.y - p.y + 20) * sc }; }, gebaar: 'wijs', tekst: 'Op het ijs glijdt hij ver door. Sla niet te hard' },
        obstakel ? { doel: () => { lesDemo('kijk'); return obstakel.r ? vakOm(obstakel.x, obstakel.y, obstakel.r + 6) : vakOm(obstakel.x, obstakel.y, obstakel.rx + 8); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Sneeuw remt, riet houdt hem tegen. In het wak kost het een strafslag' } : null,
        { doel: () => { lesDemo(null); return ui.kaart[0].querySelector('.ko-stand'); }, marge: 8, gebaar: 'wijs', tekst: 'Om de beurt. Wie na alle banen de minste slagen heeft, wint' },
        { doel: () => { lesDemo(null); return ui.meer; }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je tegen wie je speelt' }
      ];
    });
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.kolf = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaardT = window.Duiten ? Duiten.veld('kolf-tegen', 'jantje') : 'jantje';
        const t = TEGENSTANDERS.find((x) => x.id === bewaardT);
        tegen = bewaardT === 'twee' ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
        aantal = window.Duiten ? (+Duiten.veld('kolf-banen', 3) === 5 ? 5 : 3) : 3;
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste) {
          const oud = laad();
          const ot = oud && (oud.tegen === 'twee' ? TWEE : TEGENSTANDERS.find((x) => x.id === oud.tegen));
          if (oud && ot && (ot === TWEE || isOpen(ot))) {
            tegen = ot === TWEE ? null : ot;
            aantal = oud.aantal === 5 ? 5 : 3; volgorde = oud.volgorde || Array.from({ length: aantal }, (_, i) => i); nr = oud.nr; potjes = oud.potjes || 1;
            spelers = tegen ? [{ naam: 'Jij', mens: true, slagen: oud.slagen[0] }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, slagen: oud.slagen[1] }]
              : [{ naam: 'Speler 1', mens: true, slagen: oud.slagen[0] }, { naam: 'Speler 2', mens: true, slagen: oud.slagen[1] }];
            aan = oud.aan === 1 ? 1 : 0;
            nieuweBaan({ ballen: oud.ballen.map((b) => Object.assign({ vx: 0, vy: 0, weg: 0, paal: false, inWak: false, wenk: 0 }, b)), slagen: [oud.slagen[0][nr] || 0, oud.slagen[1][nr] || 0] });
            meld(tegen ? `Verder met je partij tegen ${tegen.naam}.` : 'Verder met jullie partij.');
          } else nieuwePartij();
        } else {
          werkKaartenBij();
          hervat();
        }
        cancelAnimationFrame(raf);
        vorigeT = 0;
        raf = requestAnimationFrame(lus);
        if (window.Les) Les.eersteKeer('kolf');
      });
    },
    stop() {
      cancelAnimationFrame(raf);
      onderbreek();
      sluitMenu();
    },
    opnieuw() { nieuwePartij(); },
    _toestand() {
      return {
        fase, aan, nr, aantal, tegen: tegen ? tegen.id : 'twee', winnaar, L, sc,
        baan: baan && { i: baan.i, naam: baan.naam, paal: baan.paal, start: baan.start, dingen: baan.dingen },
        slagen: spelers.map((p) => p.slagen.slice()), som: [somVan(0), somVan(1)],
        ballen: ballen.map((b) => ({ x: b.x, y: b.y, op: b.op, klaar: b.klaar, rolt: !!(b.vx || b.vy) }))
      };
    },
    _scherm(x, y) { return scherm(x, y); },
    _test: {
      zaad(n) { rnd = n === undefined ? Math.random : zaad(n); },
      // het beste schot zoals de burgemeester het zou kiezen, zonder trillende hand
      tip() { const t = { hoek: 0, kracht: 0, kies: 0 }; return kiesSlag(ballen, baan, aan, t); },
      sla(hoek, v) { if (fase !== 'mikken') return false; fase = 'slaat'; sla(aan, hoek, v); return true; },
      trekVoor(v) { return klem(v / VMAX * TREK_MAX, TREK_MIN, TREK_MAX); },
      // een hele partij tussen twee spelers in stilte, om de niveaus af te stemmen
      sim(idA, idB, n, banen) {
        const zoek = (id) => (id === 'mens' ? MENS_MODEL : TEGENSTANDERS.find((x) => x.id === id));
        const ts = [zoek(idA), zoek(idB)], uit = { a: 0, b: 0, gelijk: 0, slagen: [0, 0] };
        for (let s = 0; s < (n || 100); s++) {
          const totaal = [0, 0];
          for (let bi = 0; bi < (banen || 3); bi++) {
            const bn = maakBaan(bi % BANEN.length);
            const lijst = [0, 1].map(() => ({ x: bn.start.x, y: bn.start.y, vx: 0, vy: 0, op: false, klaar: false, paal: false, inWak: false, weg: 0 }));
            const slagen = [0, 0];
            let wie = s % 2, veilig = 0;
            while ((!lijst[0].klaar || !lijst[1].klaar) && veilig++ < 60) {
              if (lijst[wie].klaar) wie = 1 - wie;
              const k = lijst[wie];
              if (!k.op) { k.op = true; k.x = bn.start.x; k.y = bn.start.y; const o = lijst[1 - wie]; if (o.op && Math.hypot(o.x - k.x, o.y - k.y) < BR * 2.4) k.x += BR * 2.6; }
              const sl = kiesSlag(lijst, bn, wie, ts[wie]);
              const vanX = k.x, vanY = k.y;
              k.vx = Math.cos(sl.hoek) * sl.v; k.vy = Math.sin(sl.hoek) * sl.v;
              slagen[wie]++;
              let raak = false, wak = false;
              const cb = { riet() {}, schuit() {}, bots() {}, paal(q) { if (q === k) raak = true; }, wak(q) { if (q === k) wak = true; else { q.op = true; q.inWak = false; } } };
              for (let m = 0; m < 1500 && !stil(lijst); m++) stap(lijst, bn, cb);
              if (raak) { k.klaar = true; k.op = false; }
              else if (wak) { slagen[wie]++; k.op = true; k.inWak = false; k.x = vanX; k.y = vanY; k.vx = 0; k.vy = 0; }
              if (!k.klaar && slagen[wie] >= MAX_SLAG) { slagen[wie] = MAX_SLAG + 1; k.klaar = true; k.op = false; }
              wie = 1 - wie;
            }
            totaal[0] += slagen[0]; totaal[1] += slagen[1];
          }
          uit.slagen[0] += totaal[0]; uit.slagen[1] += totaal[1];
          if (totaal[0] < totaal[1]) uit.a++; else if (totaal[1] < totaal[0]) uit.b++; else uit.gelijk++;
        }
        uit.slagen = uit.slagen.map((x) => x / (n || 100));
        return uit;
      }
    }
  };
})();
