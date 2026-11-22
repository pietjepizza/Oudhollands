/* Sjoelen, schermvullend: een beukenhouten sjoelbak met Hindelooper versiering die het hele scherm vult.

   Overgenomen van succesvolle schuif- en schietspellen:
   - druk op de schijf en veeg omhoog: hoe harder je veegt, hoe verder hij gaat (Shuffleboard 3D);
   - een richtlijn bij het mikken, die laat zien op welk poortje je afgaat (Carrom Pool);
   - eerlijke, voorspelbare worpen: in recensies is slecht afgestelde kracht de grootste klacht;
   - echte natuurkunde met klikkende schijven, en een feestje bij elke serie;
   - tegenstanders met een gezicht die na jou hun eigen ronde gooien (zoals bij het molenspel),
     met een knop om door te spoelen. Versla er een en de volgende komt vrij.
   De telling is die van de sjoelbond: 2-3-4-1, een serie (één in elk vak) is 20, hoogstens 148. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  // DE SJOELBAK (logische maten; de lengte verschilt tussen spel en muur)
  // ============================================================
  const W = 360, H = 720;
  const L = 26, R = W - 26, VAK_B = (R - L) / 4;
  const TOP = 26, POORT_Y = 152, POORT_H = 14;
  const WERP_Y = H - 132, ONDER = H - 20, RUST_Y = H - 76;
  const RS = 13, OPENING = 19, WRIJVING = 240, VMAX = 1000;
  const WAARDE = [2, 3, 4, 1];
  const midVak = (k) => L + VAK_B * k + VAK_B / 2;

  const muren = [];
  (function () {
    let x = L;
    for (let k = 0; k < 4; k++) { const c = midVak(k); muren.push([x, POORT_Y, c - OPENING, POORT_Y + POORT_H]); x = c + OPENING; }
    muren.push([x, POORT_Y, R, POORT_Y + POORT_H]);
    for (let k = 1; k < 4; k++) { const sx = L + VAK_B * k; muren.push([sx - 2.5, TOP, sx + 2.5, POORT_Y]); }
  })();

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const tekst = (t, attrs, ouder) => { const e = el('text', attrs, ouder); e.textContent = t; return e; };

  // Een Hindelooper krul: blad, bloem en sierlijke lijn in rood, groen en blauw
  function krul(ouder, x, y, s, spiegel) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${spiegel ? -s : s} ${s})` }, ouder);
    el('path', { d: 'M0 0 C6 -10 18 -10 22 -2 C25 4 20 9 15 6', fill: 'none', stroke: '#2E5A8A', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M8 -6 C10 -14 18 -15 20 -9 C17 -9 12 -8 8 -6 Z', fill: '#4F7A3A' }, g);
    el('path', { d: 'M15 6 C13 9 9 9 8 6 C10 5 13 5 15 6 Z', fill: '#4F7A3A' }, g);
    el('circle', { cx: 2, cy: 0, r: 3.6, fill: '#B23A2A' }, g);
    el('circle', { cx: 2, cy: 0, r: 1.4, fill: '#E7C36A' }, g);
  }

  // De sjoelbak als tekening: in het spel (360 x 720) en aan de muur (lang en smal)
  function tekenBak(hoog, sfx, eenvoudig) {
    const werp = hoog - 132, onder = hoog - 20;
    const svg = el('svg', { viewBox: `0 0 ${W} ${hoog}`, class: 'sj-bak', role: 'img', 'aria-label': 'Een houten sjoelbak met vier poortjes' });
    const defs = el('defs', {}, svg);
    const lin = (id, x2, y2, stops) => { const g = el('linearGradient', { id: id + sfx, x1: 0, y1: 0, x2, y2 }, defs); stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a === undefined ? 1 : a }, g)); };
    lin('sj-rand', 1, 0, [[0, '#3E2612'], [0.5, '#6A4424'], [1, '#3E2612']]);
    lin('sj-vlak', 0, 1, [[0, '#D2A36A'], [0.18, '#E0B987'], [0.6, '#DDB27C'], [1, '#D3A56C']]);
    lin('sj-glans', 1, 0, [[0, '#FFFFFF', 0], [0.32, '#FFF6E2', 0.22], [0.42, '#FFFFFF', 0], [1, '#FFFFFF', 0]]);
    lin('sj-balk', 0, 1, [[0, '#8A5A30'], [1, '#4E2E16']]);
    lin('sj-achter', 0, 1, [[0, '#8E5A2E'], [1, '#B47F48']]);
    // rand van donker hout met afgeronde hoeken
    el('rect', { x: 0, y: 0, width: W, height: hoog, rx: 16, fill: `url(#sj-rand${sfx})` }, svg);
    el('rect', { x: 6, y: 6, width: W - 12, height: hoog - 12, rx: 12, fill: 'none', stroke: 'rgba(255,230,190,.18)', 'stroke-width': 2 }, svg);
    // speelvlak van beukenhout met nerf en glans
    el('rect', { x: L, y: TOP - 8, width: R - L, height: onder - TOP + 8, fill: `url(#sj-vlak${sfx})` }, svg);
    let zaad = 17;
    const rnd = () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280; };
    const nerf = el('g', { fill: 'none', stroke: '#7A4A1E' }, svg);
    for (let i = 0; i < (eenvoudig ? 26 : 54); i++) {
      const x0 = L + rnd() * (R - L);
      let d = `M${x0.toFixed(1)} ${TOP - 8}`;
      for (let y = TOP + 32; y <= onder; y += 48) d += ` L${(x0 + Math.sin(y / 95 + i) * (2 + rnd() * 4)).toFixed(1)} ${y}`;
      el('path', { d, 'stroke-opacity': (0.05 + rnd() * 0.09).toFixed(3), 'stroke-width': 1 }, nerf);
    }
    el('rect', { x: L, y: TOP - 8, width: R - L, height: onder - TOP + 8, fill: `url(#sj-glans${sfx})` }, svg);
    // de achterwand met de vakken: iets donkerder, met de getallen en Hindelooper krullen
    el('rect', { x: L, y: TOP - 8, width: R - L, height: POORT_Y - TOP + 8, fill: `url(#sj-achter${sfx})`, opacity: 0.55 }, svg);
    WAARDE.forEach((v, k) => {
      const cx = midVak(k);
      el('ellipse', { cx, cy: 64, rx: 26, ry: 30, fill: '#F4E3C0', opacity: 0.85, stroke: '#7A4A1E', 'stroke-width': 1.4 }, svg);
      tekst(String(v), { x: cx, y: 80, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 44, fill: '#9A2E22' }, svg);
      if (!eenvoudig) {
        krul(svg, cx - 12, 108, 0.62, true);
        krul(svg, cx + 12, 108, 0.62, false);
      }
    });
    // schotjes tussen de vakken
    for (let k = 1; k < 4; k++) {
      const sx = L + VAK_B * k;
      el('rect', { x: sx - 2.5, y: TOP - 8, width: 5, height: POORT_Y - TOP + 8, fill: '#4E2E16' }, svg);
      el('rect', { x: sx - 2.5, y: TOP - 8, width: 1.5, height: POORT_Y - TOP + 8, fill: 'rgba(255,230,190,.25)' }, svg);
    }
    // de poortbalk met vier poortjes en koperen hoekjes
    muren.slice(0, 5).forEach((m) => {
      el('rect', { x: m[0], y: m[1], width: m[2] - m[0], height: m[3] - m[1], fill: `url(#sj-balk${sfx})` }, svg);
      el('rect', { x: m[0], y: m[1], width: m[2] - m[0], height: 1.6, fill: 'rgba(255,230,190,.32)' }, svg);
    });
    for (let k = 0; k < 4; k++) {
      const c = midVak(k);
      [c - OPENING, c + OPENING].forEach((x) => el('rect', { x: x - 2, y: POORT_Y - 1, width: 4, height: POORT_H + 2, fill: '#C9973F', stroke: '#6A4A14', 'stroke-width': 0.6 }, svg));
    }
    el('rect', { x: L, y: POORT_Y + POORT_H, width: R - L, height: 6, fill: '#000', opacity: 0.12 }, svg);
    // de werpstreep met ruitjes
    el('line', { x1: L + 6, y1: werp, x2: R - 6, y2: werp, stroke: '#5A3214', 'stroke-width': 2.2, 'stroke-dasharray': '7 6', opacity: 0.7 }, svg);
    [L + 14, W / 2, R - 14].forEach((x) => el('path', { d: `M${x} ${werp - 6} l6 6 l-6 6 l-6 -6 Z`, fill: '#9A2E22', opacity: 0.8 }, svg));
    if (!eenvoudig) {
      krul(svg, W / 2 - 40, werp + 34, 0.8, true);
      krul(svg, W / 2 + 40, werp + 34, 0.8, false);
    }
    // binnenschaduw van de rand
    el('rect', { x: L + 1.5, y: TOP - 6.5, width: R - L - 3, height: onder - TOP + 5, fill: 'none', stroke: 'rgba(0,0,0,.28)', 'stroke-width': 3 }, svg);
    return svg;
  }

  // ============================================================
  // NATUURKUNDE
  // ============================================================
  let schijven = [], stilSim = false, laatsteTik = 0;
  function tik(kracht) {
    if (stilSim) return;
    const nu = performance.now();
    if (kracht > 60 && nu - laatsteTik > 45) { laatsteTik = nu; Geluid.hout(Math.min(1, kracht / 700)); if (window.Tril) Tril.bots(kracht / 700); }
  }
  function botsRechthoek(s, m) {
    const cx = Math.max(m[0], Math.min(s.x, m[2])), cy = Math.max(m[1], Math.min(s.y, m[3]));
    const dx = s.x - cx, dy = s.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= RS * RS) return;
    let d = Math.sqrt(d2), nx, ny;
    if (d < 1e-6) { nx = 0; ny = 1; d = 0; } else { nx = dx / d; ny = dy / d; }
    s.x += nx * (RS - d); s.y += ny * (RS - d);
    const vn = s.vx * nx + s.vy * ny;
    if (vn < 0) { s.vx -= 1.45 * vn * nx; s.vy -= 1.45 * vn * ny; s.vx *= 0.92; s.vy *= 0.92; tik(Math.abs(vn)); }
  }
  function stapNatuur(dt) {
    for (const s of schijven) {
      const v = Math.hypot(s.vx, s.vy);
      if (v > 0) {
        const dv = WRIJVING * dt;
        if (v <= dv) { s.vx = 0; s.vy = 0; } else { const f = (v - dv) / v; s.vx *= f; s.vy *= f; }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < L + RS) { s.x = L + RS; s.vx = Math.abs(s.vx) * 0.5; tik(s.vx * 2); }
      if (s.x > R - RS) { s.x = R - RS; s.vx = -Math.abs(s.vx) * 0.5; tik(-s.vx * 2); }
      if (s.y < TOP + RS) { s.y = TOP + RS; s.vy = Math.abs(s.vy) * 0.3; tik(s.vy * 3); }
      if (s.y > ONDER - RS) { s.y = ONDER - RS; s.vy = -Math.abs(s.vy) * 0.3; }
      for (const m of muren) botsRechthoek(s, m);
      if (s.vak === null && s.y + RS <= POORT_Y + 0.5) {
        s.vak = Math.max(0, Math.min(3, Math.floor((s.x - L) / VAK_B)));
        inVak(s);
      }
      if (s.vak !== null && s.y + RS > POORT_Y) { s.y = POORT_Y - RS; s.vy = -Math.abs(s.vy) * 0.3; }
    }
    for (let i = 0; i < schijven.length; i++) {
      const a = schijven[i];
      for (let j = i + 1; j < schijven.length; j++) {
        const b = schijven[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * RS * RS || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (2 * RS - d) / 2;
        a.x += nx * over; a.y += ny * over; b.x -= nx * over; b.y -= ny * over;
        const vrel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vrel < 0) { const jj = -(1 + 0.86) * vrel / 2; a.vx += jj * nx; a.vy += jj * ny; b.vx -= jj * nx; b.vy -= jj * ny; tik(-vrel); }
      }
    }
  }
  const allesStil = () => schijven.every((s) => s.vx === 0 && s.vy === 0);
  function telling(lijst) {
    const n = [0, 0, 0, 0];
    (lijst || schijven).forEach((s) => { if (s.vak !== null) n[s.vak]++; });
    const series = Math.min(...n);
    const rest = n.reduce((som, c, i) => som + (c - series) * WAARDE[i], 0);
    return { n, series, totaal: series * 20 + rest };
  }

  // ============================================================
  // TEGENSTANDERS
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', niveau: 1, hoek: 3.0, kracht: 0.12, plek: 8, dwaal: 0.35, beloning: 30,
      zegt: { start: ['Ik gooi ze allemaal erin!'], serie: ['Joepie, een serie!'], mis: ['Oeps!'], wint: ['Hoera!'], verliest: ['Jij bent goed!'] } },
    { id: 'grietje', niveau: 2, hoek: 1.55, kracht: 0.065, plek: 4, dwaal: 0.12, beloning: 45,
      zegt: { start: ['Rustig mikken...'], serie: ['Een serie!'], mis: ['Ach.'], wint: ['Gewonnen!'], verliest: ['Knap gegooid!'] } },
    { id: 'kees', niveau: 3, hoek: 0.95, kracht: 0.04, plek: 2.5, dwaal: 0.03, beloning: 60,
      zegt: { start: ['Zo glad als meel.'], serie: ['Dat is er een.'], mis: ['Hm.'], wint: ['Fijngemalen!'], verliest: ['Petje af.'] } },
    { id: 'burgemeester', niveau: 4, hoek: 0.6, kracht: 0.03, plek: 2, dwaal: 0, beloning: 80,
      zegt: { start: ['Let op, zo doe je dat.'], serie: ['Uiteraard.'], mis: ['Onmogelijk!'], wint: ['Zoals verwacht.'], verliest: ['Hoe is het mogelijk!'] } }
  ];
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // De computer mikt op het vak dat een serie het meest nodig heeft, en ontwijkt schijven die in de weg liggen.
  function computerWorp(t) {
    const n = telling().n;
    const geblokt = (k) => schijven.some((s) => s.vak === null && Math.abs(s.x - midVak(k)) < RS * 1.8 && s.y > POORT_Y && s.y < WERP_Y);
    let k;
    if (Math.random() < t.dwaal) k = Math.floor(Math.random() * 4);
    else {
      const score = [0, 1, 2, 3].map((v) => n[v] * 10 + (geblokt(v) ? 15 : 0) + (v === 2 ? -1 : 0) + Math.random() * 2);
      k = score.indexOf(Math.min(...score));
    }
    const x = Math.max(L + RS, Math.min(R - RS, midVak(k) + gauss() * t.plek));
    const doel = POORT_Y - 26 - Math.random() * 60;
    const v = Math.sqrt(2 * WRIJVING * (RUST_Y - doel)) * (1 + gauss() * t.kracht);
    const hoek = (gauss() * t.hoek + (midVak(k) - x) / (RUST_Y - POORT_Y) * 57.3) * Math.PI / 180;
    return { x, vx: Math.sin(hoek) * v, vy: -Math.cos(hoek) * v };
  }

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, ui = {}, doek, ctx, bakSvg, gebouwd = false;
  let schaal = 1, dpr = 1, raf = 0, vorigeT = 0;
  let modus = 'tegen', tegen = TEGENSTANDERS[0];
  let spelers = [], aan = 0, hand = 30, beurt = 1, fase = 'klaar', spelId = 0, snel = false;
  let vast = null, spoor = [], mikX = W / 2, geteld = { series: 0, totaal: 0 };
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() || snel ? Math.min(ms, 30) : ms));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const gezichten = () => (window.Personen ? Personen.gezicht : {});
  const naamVan = (id) => (window.Personen && Personen.namen[id]) || id;
  const gewonnen = () => (window.Duiten ? Duiten.veld('sjoel-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  function record() {
    let r = window.Duiten ? Duiten.veld('sjoel-record', 0) : 0;
    try { r = Math.max(r, Number(localStorage.getItem('speelhuys.sjoelen.best') || 0)); } catch (e) { /* */ }
    return r;
  }
  const schijfIcoon = '<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="21" cy="23" rx="15" ry="14" fill="rgba(0,0,0,.3)"/><circle cx="20" cy="20" r="15" fill="#D9A866" stroke="#7A4B22" stroke-width="1.5"/><circle cx="20" cy="20" r="9" fill="none" stroke="#7A4B22" stroke-opacity=".4"/><ellipse cx="15" cy="14" rx="5" ry="3" fill="#fff" opacity=".35"/></svg>';

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('sj-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven sj-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="sj-stand" type="button" aria-haspopup="dialog" aria-label="Kies je tegenstander"></button>
      <button class="mo-knop sj-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop sj-meer" type="button" aria-label="Kies je tegenstander" title="Kies je tegenstander" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden sj-midden"><div class="sj-bakvak">
      <canvas class="sj-doek" role="application" tabindex="0" aria-label="De sjoelbak. Druk op de schijf onderaan en veeg omhoog. Met de pijltjes mik je, met de spatiebalk gooi je."></canvas>
      <div class="sj-pops" aria-hidden="true"></div>
      <div class="sj-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder sj-onder">
      <div class="mo-kaart sj-zelf">
        <span class="mo-gezicht sj-zelf-beeld"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="sj-beurten" aria-hidden="true"><i></i><i></i><i></i></span></span>
        <span class="mo-doe"></span>
        <span class="mo-ballon" hidden></span>
      </div>
      <button class="mo-knop sj-snel" type="button" aria-label="Doorspoelen" title="Doorspoelen" hidden>${icoon('snel')}</button>
    </div>`);
    const menu = html(`<div class="mo-menu sj-menu" role="dialog" aria-modal="true" aria-label="Tegen wie sjoel je?" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Tegen wie sjoel je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders sj-keuzes"></div>
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
      stand: boven.querySelector('.sj-stand'), midden, vak: midden.querySelector('.sj-bakvak'), pops: midden.querySelector('.sj-pops'),
      kaart: midden.querySelector('.sj-kaart'), zelf: onder.querySelector('.sj-zelf'), snel: onder.querySelector('.sj-snel'),
      menu, keuzes: menu.querySelector('.sj-keuzes'), meld
    };
    bakSvg = tekenBak(H, 's', false);
    ui.vak.insertBefore(bakSvg, ui.vak.firstChild);
    doek = midden.querySelector('.sj-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', pakVast);
    doek.addEventListener('pointermove', beweeg);
    doek.addEventListener('pointerup', laatLos);
    doek.addEventListener('pointercancel', () => { if (vast) { mikX = vast.x; vast = null; spoor = []; } });
    doek.addEventListener('keydown', toets);
    doek.addEventListener('keyup', toetsLos);
    ui.stand.addEventListener('click', openMenu);
    boven.querySelector('.sj-meer').addEventListener('click', openMenu);
    boven.querySelector('.sj-vraag').addEventListener('click', () => { if (window.Les) Les.toon('sjoelen'); });
    ui.snel.addEventListener('click', () => { snel = true; ui.snel.hidden = true; });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    gebouwd = true;
  }

  // De bak zo groot mogelijk: half zo breed als hoog
  function pasMaatAan() {
    if (!ui.midden) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const b = Math.floor(Math.min(r.width - 12, (r.height - 8) / 2, 420));
    podium.style.setProperty('--bak', Math.max(150, b) + 'px');
    schaal = b / W;
    dpr = Math.min(3, window.devicePixelRatio || 1);
    doek.width = Math.round(W * schaal * dpr);
    doek.height = Math.round(H * schaal * dpr);
    teken();
  }

  // ============================================================
  // TEKENEN (de schijven; de bak zelf is een tekening eronder)
  // ============================================================
  const STIJL_COMPUTER = { a: '#C9906A', b: '#8A4E2E', c: '#5A2E16', rand: '#3A1A0A' };
  function stijlVan(p) {
    if (p && !p.mens && p.persoon) return STIJL_COMPUTER;
    return window.Pronk ? Pronk.stijl('schijven') : { a: '#F6DDB0', b: '#D9A866', c: '#A8743C', rand: '#7A4B22' };
  }
  function tekenSchijf(x, y, st, opgetild, geest) {
    const g = ctx;
    g.save();
    if (geest) g.globalAlpha = 0.5;
    g.fillStyle = 'rgba(40, 20, 5, .35)';
    g.beginPath(); g.ellipse(x + (opgetild ? 5 : 2), y + (opgetild ? 7 : 2.5), RS, RS, 0, 0, Math.PI * 2); g.fill();
    const r = opgetild ? RS * 1.08 : RS;
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, st.a); gr.addColorStop(0.7, st.b); gr.addColorStop(1, st.c);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = st.rand; g.globalAlpha = (geest ? 0.5 : 1) * 0.8; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.arc(x, y, r * 0.6, 0, Math.PI * 2); g.globalAlpha = (geest ? 0.5 : 1) * 0.35; g.stroke();
    g.globalAlpha = geest ? 0.5 : 1;
    if (st.motief === 'delft') {
      g.strokeStyle = '#1C3473'; g.lineWidth = 1.3;
      g.beginPath(); g.arc(x, y, r * 0.82, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#1C3473'; g.beginPath(); g.arc(x, y, r * 0.2, 0, Math.PI * 2); g.fill();
    } else if (st.motief === 'ster') {
      g.fillStyle = 'rgba(120, 80, 20, .75)';
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.2 : r * 0.45; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    } else if (st.motief === 'choco') {
      g.strokeStyle = 'rgba(30, 14, 6, .45)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x - r * 0.7, y); g.lineTo(x + r * 0.7, y); g.moveTo(x, y - r * 0.7); g.lineTo(x, y + r * 0.7); g.stroke();
    }
    g.fillStyle = '#fff'; g.globalAlpha = (geest ? 0.5 : 1) * 0.28;
    g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.42, r * 0.38, r * 0.22, -0.6, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  // De richtlijn: waar gaat de schijf heen, en door welk poortje?
  function richting() {
    if (!vast) return null;
    const nu = performance.now();
    const recent = spoor.filter((p) => nu - p.t < 120);
    let dx = 0, dy = -1;
    if (recent.length >= 2) {
      const a = recent[0], b = recent[recent.length - 1];
      if (b.y - a.y < -6) { const d = Math.hypot(b.x - a.x, b.y - a.y); dx = (b.x - a.x) / d; dy = (b.y - a.y) / d; }
    }
    return [dx, dy];
  }
  function poortVoor(x0, y0, dx, dy) {
    if (dy >= -0.2) return { x: x0, poort: -1 };
    const t = (POORT_Y + POORT_H - y0) / dy;
    const x = x0 + dx * t;
    for (let k = 0; k < 4; k++) if (Math.abs(x - midVak(k)) <= OPENING - RS * 0.55) return { x, poort: k };
    return { x, poort: -1 };
  }

  function teken() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, doek.width, doek.height);
    ctx.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    const p = spelers[aan];
    const st = stijlVan(p);
    // de tellers in de vakken
    const t = telling();
    for (let k = 0; k < 4; k++) {
      if (!t.n[k]) continue;
    }
    for (const s of schijven) tekenSchijf(s.x, s.y, s.stijl || st, false);
    for (let k = 0; k < 4; k++) {
      if (!t.n[k]) continue;
      const x = midVak(k) + 23, y = TOP + 8;
      ctx.fillStyle = 'rgba(30, 16, 6, .85)';
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#E7C36A'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#F4E9CF'; ctx.font = '600 15px "EB Garamond", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(t.n[k]), x, y + 1);
    }
    // mikken: de richtlijn en het poortje dat oplicht
    if (vast) {
      const [dx, dy] = richting();
      const pv = poortVoor(vast.x, vast.y, dx, dy);
      ctx.save();
      ctx.setLineDash([4, 9]); ctx.lineCap = 'round';
      ctx.strokeStyle = pv.poort >= 0 ? 'rgba(255, 240, 190, .9)' : 'rgba(255, 240, 190, .5)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(vast.x, vast.y - RS - 4);
      const eindY = Math.max(POORT_Y + POORT_H + 2, vast.y - 420);
      ctx.lineTo(vast.x + dx * ((eindY - vast.y) / dy), eindY); ctx.stroke();
      ctx.setLineDash([]);
      if (pv.poort >= 0) {
        const c = midVak(pv.poort);
        ctx.fillStyle = 'rgba(255, 226, 130, .45)';
        ctx.fillRect(c - OPENING, POORT_Y - 4, OPENING * 2, POORT_H + 8);
        ctx.strokeStyle = '#FFE29A'; ctx.lineWidth = 2; ctx.strokeRect(c - OPENING, POORT_Y - 4, OPENING * 2, POORT_H + 8);
      }
      ctx.restore();
      tekenSchijf(vast.x, vast.y, st, true);
    } else if (fase === 'mikken' && hand > 0 && allesStil()) {
      tekenSchijf(mikX, RUST_Y, st, false, true);
      // een zacht pijltje omhoog om te laten zien wat je moet doen
      const k = (performance.now() / 600) % 2, a = k < 1 ? k : 2 - k;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.4 * a;
      ctx.strokeStyle = '#FFF4D6'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const y = RUST_Y - RS - 14 - a * 6;
      ctx.beginPath(); ctx.moveTo(mikX - 8, y + 6); ctx.lineTo(mikX, y - 2); ctx.lineTo(mikX + 8, y + 6); ctx.stroke();
      ctx.restore();
    }
  }

  function lus(t) {
    const dtTot = Math.min(0.05, (t - (vorigeT || t)) / 1000);
    vorigeT = t;
    const keer = fase === 'computer' ? 3 : 1;
    if (!allesStil()) {
      const n = Math.max(1, Math.ceil(dtTot * keer / 0.004));
      for (let i = 0; i < n; i++) stapNatuur(dtTot * keer / n);
    }
    teken();
    raf = requestAnimationFrame(lus);
  }

  // ============================================================
  // INVOER: druk op de schijf en veeg omhoog
  // ============================================================
  function naarBak(e) {
    const r = doek.getBoundingClientRect();
    return { x: (e.clientX - r.left) / schaal, y: (e.clientY - r.top) / schaal, t: performance.now() };
  }
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  function pakVast(e) {
    if (fase !== 'mikken' || vast || hand <= 0 || !allesStil()) return;
    const p = naarBak(e);
    if (p.y < WERP_Y - 30) return;
    e.preventDefault();
    try { doek.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    vast = { x: klem(p.x, L + RS, R - RS), y: klem(p.y, WERP_Y + RS + 2, ONDER - RS) };
    spoor = [p];
    Geluid.pak();
    if (window.Tril) Tril.tik();
    werkHudBij();
  }
  function beweeg(e) {
    if (!vast) return;
    const p = naarBak(e);
    spoor.push(p);
    if (spoor.length > 14) spoor.shift();
    vast.x = klem(p.x, L + RS, R - RS);
    vast.y = klem(p.y, WERP_Y + RS + 2, ONDER - RS);
    if (p.y < WERP_Y - 6) laatLos();
  }
  function laatLos() {
    if (!vast) return;
    const nu = performance.now();
    const recent = spoor.filter((p) => nu - p.t < 110);
    let vx = 0, vy = 0;
    if (recent.length >= 2) {
      const a = recent[0], b = recent[recent.length - 1];
      const dt = Math.max(0.016, (b.t - a.t) / 1000);
      vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt;
    }
    if (vy > -90) {
      // geen worp: de schijf blijft liggen waar je hem neerlegde
      mikX = vast.x; vast = null; spoor = [];
      werkHudBij();
      return;
    }
    const v = Math.hypot(vx, vy);
    if (v > VMAX) { vx *= VMAX / v; vy *= VMAX / v; }
    gooiSchijf(vast.x, vast.y, vx, vy);
    mikX = vast.x;
    vast = null; spoor = [];
  }
  let laden = null;
  function toets(e) {
    if (fase !== 'mikken' || vast) return;
    if (e.key === 'ArrowLeft') { mikX = klem(mikX - 8, L + RS, R - RS); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { mikX = klem(mikX + 8, L + RS, R - RS); e.preventDefault(); }
    else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && hand > 0 && laden === null) { laden = performance.now(); e.preventDefault(); }
  }
  function toetsLos(e) {
    if ((e.key === ' ' || e.key === 'Enter') && laden !== null && fase === 'mikken') {
      e.preventDefault();
      const t = ((performance.now() - laden) / 1400) % 2, k = t < 1 ? t : 2 - t;
      laden = null;
      gooiSchijf(mikX, RUST_Y, (Math.random() - 0.5) * 12, -(420 + k * 420));
    }
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  function gooiSchijf(x, y, vx, vy, stijl) {
    hand--;
    schijven.push({ x, y, vx, vy, vak: null, stijl: stijl || null });
    if (!stilSim) { Geluid.schuif(); if (window.Tril) Tril.tik(); }
    if (fase === 'mikken') fase = 'rolt';
    werkHudBij();
  }

  // Een schijf schuift door een poortje: punten, en misschien een serie
  function inVak(s) {
    const t = telling();
    const was = geteld;
    geteld = t;
    const p = spelers[aan];
    if (p) p.score = t.totaal;
    if (stilSim) return;
    Geluid.plop();
    const x = midVak(s.vak);
    if (t.series > was.series) {
      pop(x, POORT_Y - 60, 'Serie!', 'serie');
      Geluid.molen ? Geluid.molen() : Geluid.tada();
      if (window.Tril) Tril.succes();
      if (p && p.persoon && Math.random() < 0.5) zeg('serie');
    } else {
      pop(x, POORT_Y - 60, '+' + WAARDE[s.vak], '');
      if (window.Tril) Tril.klik();
    }
    werkStandBij();
  }
  function pop(x, y, tekstje, soort) {
    const e = document.createElement('span');
    e.className = 'sj-pop ' + soort;
    e.textContent = tekstje;
    e.style.left = (x * schaal) + 'px';
    e.style.top = (y * schaal) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), soort === 'serie' ? 1500 : 1000);
  }

  function nieuwSpel() {
    spelId++;
    snel = false;
    if (modus === 'tegen') spelers = [{ id: 'jij', naam: 'Jij', mens: true, score: null }, { id: tegen.id, naam: naamVan(tegen.id), mens: false, persoon: tegen.id, t: tegen, score: null }];
    else if (modus === 'twee') spelers = [{ id: 'een', naam: 'Speler 1', mens: true, score: null }, { id: 'twee', naam: 'Speler 2', mens: true, score: null }];
    else spelers = [{ id: 'jij', naam: 'Jij', mens: true, score: null }];
    aan = 0;
    beginRonde();
  }

  function beginRonde() {
    schijven = []; hand = 30; beurt = 1; vast = null; spoor = []; mikX = W / 2; geteld = { series: 0, totaal: 0 };
    const p = spelers[aan];
    p.score = 0;
    ui.kaart.hidden = true;
    fase = p.mens ? 'mikken' : 'computer';
    ui.snel.hidden = p.mens;
    werkStandBij();
    werkHudBij();
    if (p.mens) meld(`${p.naam}: druk op de schijf en veeg omhoog.`);
    else computerRonde();
  }

  // Na elke worp: liggen alle schijven stil, dan volgt de volgende worp of de volgende beurt
  function wachtOpStilte(mijnId) {
    return new Promise((res) => {
      const kijk = () => {
        if (mijnId !== spelId) return;
        if (allesStil()) res(); else setTimeout(kijk, 60);
      };
      kijk();
    });
  }
  async function naWorp() {
    const mijnId = spelId;
    await wachtOpStilte(mijnId);
    if (mijnId !== spelId || fase !== 'rolt') return;
    if (hand > 0) { fase = 'mikken'; werkHudBij(); return; }
    await eindeBeurt();
  }
  // houd in de gaten of een gegooide schijf weer stil ligt
  setInterval(() => { if (fase === 'rolt' && allesStil()) naWorp(); }, 120);

  async function eindeBeurt() {
    const mijnId = spelId, p = spelers[aan];
    const los = schijven.filter((s) => s.vak === null);
    if (beurt < 3 && los.length > 0) {
      fase = 'tussen';
      await wacht(450); if (mijnId !== spelId) return;
      schijven = schijven.filter((s) => s.vak !== null);
      hand = los.length; beurt++;
      Geluid.schuif();
      if (!stilSim) banier(`Beurt ${beurt}`, `${hand} ${hand === 1 ? 'schijf' : 'schijven'} terug`);
      await wacht(900); if (mijnId !== spelId) return;
      fase = p.mens ? 'mikken' : 'computer';
      werkHudBij();
      return;
    }
    rondeKlaar();
  }

  async function rondeKlaar() {
    const mijnId = spelId, p = spelers[aan];
    fase = 'tussen';
    p.score = telling().totaal;
    werkStandBij();
    werkHudBij();
    if (p.mens && modus !== 'twee') {
      const r = record();
      if (p.score > r) { if (window.Duiten) Duiten.zetVeld('sjoel-record', p.score); try { localStorage.setItem('speelhuys.sjoelen.best', String(p.score)); } catch (e) { /* */ } p.record = true; }
    }
    if (p.score >= 148 && !stilSim) banier('Maximaal!', '148 punten');
    // nog een speler?
    if (aan < spelers.length - 1) {
      await wacht(1100); if (mijnId !== spelId) return;
      aan++;
      const q = spelers[aan];
      toonKaart(q.mens
        ? `<b>${p.naam}: ${p.score}</b><span>Nu ${q.naam}!</span><button class="knop sj-start" type="button">${icoon('pijl')}Start</button>`
        : `<span class="sj-kaart-gezicht">${gezichten()[q.persoon] || ''}</span><b>Jij: ${p.score}</b><span>Nu gooit ${q.naam}</span>`);
      if (q.mens) {
        ui.kaart.querySelector('.sj-start').addEventListener('click', () => { if (mijnId === spelId) beginRonde(); });
        ui.kaart.querySelector('.sj-start').focus({ preventScroll: true });
      } else {
        await wacht(1600); if (mijnId !== spelId) return;
        beginRonde();
      }
      return;
    }
    einde();
  }

  // De tegenstander gooit zijn ronde; met de knop gaat het in een flits
  async function computerRonde() {
    const mijnId = spelId, p = spelers[aan], t = p.t;
    zeg('start');
    await wacht(900);
    while (mijnId === spelId && fase !== 'klaar') {
      if (snel) { simuleerRest(t); return; }
      if (fase === 'computer' && allesStil()) {
        if (hand > 0) {
          const w = computerWorp(t);
          fase = 'computer';
          gooiSchijf(w.x, RUST_Y, w.vx, w.vy, STIJL_COMPUTER);
          await wacht(260);
          await wachtOpStilte(mijnId);
          if (mijnId !== spelId) return;
          await wacht(220);
        } else {
          await eindeBeurt();
          if (fase === 'tussen' || fase === 'klaar') return;
        }
      } else {
        await wacht(80);
      }
    }
  }
  function simuleerRest(t) {
    stilSim = true;
    for (let veilig = 0; veilig < 200; veilig++) {
      while (!allesStil()) stapNatuur(1 / 200);
      if (hand > 0) { const w = computerWorp(t); gooiSchijf(w.x, RUST_Y, w.vx, w.vy, STIJL_COMPUTER); continue; }
      const los = schijven.filter((s) => s.vak === null);
      if (beurt < 3 && los.length > 0) { schijven = schijven.filter((s) => s.vak !== null); hand = los.length; beurt++; continue; }
      break;
    }
    stilSim = false;
    geteld = telling();
    spelers[aan].score = geteld.totaal;
    werkStandBij();
    rondeKlaar();
  }

  function einde() {
    fase = 'klaar';
    ui.snel.hidden = true;
    werkHudBij();
    const [a, b] = spelers;
    let bedrag, tekst, gewonnenSpel, verder = null;
    if (modus === 'oefen') {
      bedrag = 10 + Math.round(a.score / 4);
      tekst = a.record ? `${a.score} punten · record!` : `${a.score} punten`;
      gewonnenSpel = !!a.record;
      banier(a.record ? 'Record!' : `${a.score} punten`, a.record ? `${a.score} punten` : `Je record is ${record()}`);
      if (a.record) { Geluid.tada(); vonken(30); } else Geluid.klok();
    } else if (modus === 'twee') {
      const winnaar = a.score === b.score ? null : (a.score > b.score ? a : b);
      bedrag = 25;
      tekst = winnaar ? `${winnaar.naam} wint met ${winnaar.score} punten!` : `Gelijk: ${a.score} tegen ${b.score}`;
      gewonnenSpel = true;
      banier(winnaar ? `${winnaar.naam} wint!` : 'Gelijkspel', `${a.score} tegen ${b.score}`);
      Geluid.tada(); vonken(30);
    } else {
      const ikWin = a.score > b.score, gelijk = a.score === b.score;
      if (ikWin) {
        const telling2 = gewonnen();
        const eerste = !telling2[tegen.id];
        telling2[tegen.id] = (telling2[tegen.id] || 0) + 1;
        if (window.Duiten) Duiten.zetVeld('sjoel-gewonnen', telling2);
        bedrag = tegen.beloning;
        tekst = `Gewonnen van ${b.naam}: ${a.score} tegen ${b.score}!`;
        const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
        if (volgende) {
          if (eerste) tekst += ` ${naamVan(volgende.id)} is vrij!`;
          verder = { tekst: `Tegen ${naamVan(volgende.id)}`, actie: () => { tegen = volgende; modus = 'tegen'; bewaarKeuze(); nieuwSpel(); } };
        }
        banier('Gewonnen!', `${a.score} tegen ${b.score}`);
        Geluid.tada(); vonken(40);
        if (window.Tril) Tril.succes();
        zeg('verliest');
      } else {
        bedrag = 10 + Math.round(a.score / 10);
        tekst = gelijk ? `Gelijk: ${a.score} tegen ${b.score}` : `${b.naam} wint: ${b.score} tegen ${a.score}`;
        banier(gelijk ? 'Gelijkspel' : `${b.naam} wint`, `${a.score} tegen ${b.score}`);
        if (gelijk) Geluid.klok(); else Geluid.jammer();
        zeg(gelijk ? 'verliest' : 'wint');
      }
      gewonnenSpel = ikWin;
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'sjoelen', bedrag, gewonnen: gewonnenSpel, tekst, verder, wacht: 2400 });
  }

  // ============================================================
  // SCHERM: stand, onderkaart, kaartjes en banieren
  // ============================================================
  function werkStandBij() {
    const g = gezichten();
    const vakje = (p, i) => {
      const beeld = p.persoon ? (g[p.persoon] || schijfIcoon) : schijfIcoon;
      const score = p.score === null ? '–' : p.score;
      return `<span class="sj-speler${i === aan && fase !== 'klaar' ? ' aan' : ''}"><span class="sj-speler-beeld">${beeld}</span><span class="sj-speler-naam">${p.naam}</span><b class="sj-speler-score">${score}</b></span>`;
    };
    let inhoud = spelers.map(vakje).join('<i class="sj-tegen">·</i>');
    if (modus === 'oefen') inhoud += `<i class="sj-tegen">·</i><span class="sj-speler sj-record"><span class="sj-speler-beeld">${icoon('ster')}</span><span class="sj-speler-naam">Record</span><b class="sj-speler-score">${record() || '–'}</b></span>`;
    ui.stand.innerHTML = inhoud;
    ui.stand.setAttribute('aria-label', spelers.map((p) => `${p.naam} ${p.score === null ? 'nog niet' : p.score}`).join(', ') + '. Tik om een tegenstander te kiezen.');
  }
  function werkHudBij() {
    const p = spelers[aan];
    if (!p) return;
    const ik = p.mens ? p : spelers[0];
    ui.zelf.querySelector('.sj-zelf-beeld').innerHTML = p.persoon ? (gezichten()[p.persoon] || schijfIcoon) : schijfIcoon;
    ui.zelf.querySelector('.mo-naam').textContent = p.mens ? `${ik.naam} · ${hand}` : `${p.naam} · ${hand}`;
    ui.zelf.querySelectorAll('.sj-beurten i').forEach((b, i) => { b.className = i < beurt - 1 ? 'klaar' : i === beurt - 1 ? 'nu' : ''; });
    const doe = ui.zelf.querySelector('.mo-doe');
    if (fase === 'mikken') doe.innerHTML = `${icoon('pijl', 'sj-omhoog')}<span>Veeg de schijf omhoog</span>`;
    else if (fase === 'computer') doe.innerHTML = `<span class="mo-denk"><i></i><i></i><i></i></span>`;
    else doe.innerHTML = '';
    ui.zelf.classList.toggle('aan', fase === 'mikken');
    ui.zelf.setAttribute('aria-label', `${p.naam}: nog ${hand} ${hand === 1 ? 'schijf' : 'schijven'}, beurt ${beurt} van 3`);
  }
  function zeg(soort) {
    const p = spelers.find((q) => q.persoon);
    if (!p || !p.t) return;
    const b = ui.zelf.querySelector('.mo-ballon');
    if (spelers[aan] !== p && soort !== 'wint' && soort !== 'verliest') return;
    b.textContent = willekeurig(p.t.zegt[soort] || ['…']);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(zeg.timer);
    zeg.timer = setTimeout(() => { b.hidden = true; }, 2400);
  }
  function toonKaart(inhoud) {
    ui.kaart.innerHTML = inhoud;
    ui.kaart.hidden = false;
    ui.kaart.classList.remove('in'); void ui.kaart.offsetWidth; ui.kaart.classList.add('in');
  }
  function banier(titel, sub) {
    const b = document.createElement('div');
    b.className = 'sj-banier';
    b.innerHTML = `<b></b><span></span>`;
    b.querySelector('b').textContent = titel;
    b.querySelector('span').textContent = sub || '';
    ui.vak.appendChild(b);
    setTimeout(() => b.remove(), 1800);
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
  function bewaarKeuze() { if (window.Duiten) Duiten.zetVeld('sjoel-tegen', modus === 'tegen' ? tegen.id : modus); }
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
    const g = gezichten(), telling2 = gewonnen();
    ui.keuzes.innerHTML = '';
    const knop = (klasse, inhoud, label, actie) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mo-keuze ' + klasse; b.innerHTML = inhoud; b.setAttribute('aria-label', label);
      b.addEventListener('click', () => actie(b));
      ui.keuzes.appendChild(b);
    };
    TEGENSTANDERS.forEach((t) => {
      const open = isOpen(t), keer = telling2[t.id] || 0;
      const wieken = `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-wiek"/></svg>`).join('')}</span>`;
      knop((modus === 'tegen' && tegen === t ? 'nu' : '') + (open ? '' : ' dicht'),
        `<span class="mo-gezicht">${g[t.id] || ''}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span><span class="mo-keuze-naam">${naamVan(t.id)}</span>${wieken}${open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${t.beloning}</span>` : ''}`,
        `${naamVan(t.id)}, niveau ${t.niveau} van 4${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`,
        (b) => {
          if (!open) { b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud'); if (window.Tril) Tril.fout(); Geluid.pak(); return; }
          modus = 'tegen'; tegen = t; bewaarKeuze(); sluitMenu(); nieuwSpel();
        });
    });
    knop((modus === 'twee' ? 'nu ' : '') + 'sj-breed', `<span class="mo-gezicht sj-twee">${schijfIcoon}${schijfIcoon}</span><span class="mo-keuze-naam">Met z'n tweeën</span>`, 'Met z\'n tweeën op dit toestel', () => { modus = 'twee'; bewaarKeuze(); sluitMenu(); nieuwSpel(); });
    knop((modus === 'oefen' ? 'nu ' : '') + 'sj-breed', `<span class="mo-gezicht sj-twee">${schijfIcoon}</span><span class="mo-keuze-naam">Oefenen · record ${record() || '–'}</span>`, 'Alleen oefenen', () => { modus = 'oefen'; bewaarKeuze(); sluitMenu(); nieuwSpel(); });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function vak(x, y, b, h) { const r = doek.getBoundingClientRect(); return { left: r.left + x * schaal, top: r.top + y * schaal, width: b * schaal, height: h * schaal }; }
  function punt(x, y) { const r = doek.getBoundingClientRect(); return [r.left + x * schaal, r.top + y * schaal]; }
  if (window.Les) {
    Les.zet('sjoelen', () => [
      { doel: () => vak(L, WERP_Y, R - L, ONDER - WERP_Y), gebaar: 'veeg', van: () => punt(W / 2, RUST_Y), naar: () => punt(W / 2, WERP_Y - 160), voorwerp: 'schijf', tekst: 'Druk op de schijf en veeg hem omhoog' },
      { doel: () => vak(L, WERP_Y, R - L, ONDER - WERP_Y), gebaar: 'veeg', van: () => punt(W / 2 - 60, RUST_Y), naar: () => punt(W / 2 + 60, RUST_Y), voorwerp: 'schijf', tekst: 'Schuif opzij om te mikken' },
      { doel: () => vak(L, POORT_Y - 8, R - L, POORT_H + 16), gebaar: 'wijs', tekst: 'Door een poortje in een vak' },
      { doel: () => vak(L, TOP - 6, R - L, POORT_Y - TOP), gebaar: 'wijs', tekst: 'Eén in elk vak is een serie: 20 punten' },
      { doel: () => ui.zelf, gebaar: 'wijs', tekst: 'Dertig schijven, drie beurten' },
      { doel: () => ui.stand, gebaar: 'tik', tekst: 'Tik hier om een tegenstander te kiezen' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.sjoelen = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('sjoel-tegen', 'jantje') : 'jantje';
        const t = TEGENSTANDERS.find((x) => x.id === bewaard);
        if (bewaard === 'twee' || bewaard === 'oefen') modus = bewaard;
        else { modus = 'tegen'; tegen = t && isOpen(t) ? t : TEGENSTANDERS[0]; }
        requestAnimationFrame(() => { pasMaatAan(); nieuwSpel(); });
      } else {
        pasMaatAan();
        if (fase === 'computer') computerRonde();
        else if (fase === 'mikken' && hand === 0 && allesStil()) eindeBeurt();
      }
      cancelAnimationFrame(raf);
      vorigeT = 0;
      raf = requestAnimationFrame(lus);
      if (window.Duiten && !Duiten.veld('sjoel-les-2', false)) { Duiten.zetVeld('les-sjoelen', false); Duiten.zetVeld('sjoel-les-2', true); }
      if (window.Les) Les.eersteKeer('sjoelen');
    },
    stop() {
      spelId++;
      cancelAnimationFrame(raf);
      vast = null; spoor = [];
      sluitMenu();
      // een ronde van de computer begint opnieuw te gooien bij terugkomst
      if (fase === 'tussen') { fase = spelers[aan] && spelers[aan].mens ? 'mikken' : 'computer'; }
    },
    opnieuw() { nieuwSpel(); },
    // de sjoelbak aan de muur van de voorkamer: dezelfde tekening, maar lang en smal
    maakBak(hoog) { return tekenBak(hoog || 1845, 'm', true); },
    _toestand() { return { fase, aan, hand, beurt, modus, scores: spelers.map((p) => p.score), telling: telling() }; },
    _test: { gooi(x, vx, vy) { if (fase === 'mikken' && hand > 0 && allesStil()) { gooiSchijf(x, RUST_Y, vx, vy); return true; } return false; } },
    _sim(id) {
      // speel een hele ronde van een tegenstander in stilte, voor het afstemmen van de niveaus
      const t = TEGENSTANDERS.find((x) => x.id === id);
      const bewaard = { schijven, hand, beurt, fase, spelers, aan, geteld };
      schijven = []; hand = 30; beurt = 1; fase = 'computer'; spelers = [{ naam: 'sim', score: 0 }]; aan = 0; stilSim = true;
      for (let veilig = 0; veilig < 200; veilig++) {
        while (!allesStil()) stapNatuur(1 / 200);
        if (hand > 0) { const w = computerWorp(t); hand--; schijven.push({ x: w.x, y: RUST_Y, vx: w.vx, vy: w.vy, vak: null }); continue; }
        const los = schijven.filter((s) => s.vak === null);
        if (beurt < 3 && los.length > 0) { schijven = schijven.filter((s) => s.vak !== null); hand = los.length; beurt++; continue; }
        break;
      }
      const uit = telling().totaal;
      stilSim = false;
      ({ schijven, hand, beurt, fase, spelers, aan, geteld } = bewaard);
      return uit;
    }
  };
})();
