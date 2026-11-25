/* Koekhappen, schermvullend: een plak ontbijtkoek aan een touwtje, en happen zonder handen.

   Zo ging het vroeger (Jan ter Gouw zag het in 1869 nog in de Diemermeer bij de Tolbrug):
   - aan een lijn tussen twee bomen hangen koeken aan touwtjes;
   - de kinderen staan eronder met de handen op de rug en proberen de koek met hun mond te pakken;
   - raak je de koek met je neus of je kin, dan slingert hij weg; wie zijn koek het eerst op heeft, wint.

   Speelgevoel: houd je vinger op het scherm, dan zak je door je knieën; hoe langer, hoe hoger je springt.
   Laat los: je springt, je mond gaat open, en komt de koek tussen je tanden, dan hap je.
   De koek slingert echt (een slinger aan een touwtje, aan een lijn die meeveert), dus het gaat om het moment.
   Na elke hap schuif je een stapje naar de koek toe; het laatste stuk hangt hoog bij het touwtje. */
(function () {
  'use strict';

  // ============================================================
  // MATEN (in centimeters, y omhoog; het beeld rekt mee met het scherm)
  // ============================================================
  const B = 400, DT = 1 / 120;
  const LIJN = 152, TOUW = 26, KW = 6.6, KH = 9.2, LP = TOUW + KH * 0.55;
  const G_K = 640, G_S = 470, DEMP = 0.3;
  const PIV = [-12.5, 12.5];
  const T_LAAD = 0.62, H_MIN = 1.5, H_MAX = 17, DIEP = 6.5;
  const HAP_R = 2.9, OP_REST = 0.08, BOVEN = 2.2, KAUW = 0.5, OPEN_NA = 0.07, KAAK = 0.22;
  const NX = 14, NY = 20, N = NX * NY, GAT = [0, 0.9];
  // het bovenste randje bij het touwtje telt niet mee: als de rest op is, is de koek op
  const N_ONDER = Array.from({ length: NY }, (_, iy) => ((iy + 0.5) * KH / NY > BOVEN ? NX : 0)).reduce((a, b) => a + b, 0);
  const SPLEET = 2.6;
  // een kind van een jaar of negen: heup op 65,5 cm, schouders op 107, het hoofd (19 cm) vlak op een korte nek
  const HEUP = [-1.5, 65.5], NEK = [4.0, 43.0], HOOFD = [0.3, 9.9], RH = 9.3;
  // kinderen hebben een groot hoofd: alles in het hoofd-vlak wordt 10% groter getekend (en zo ook geraakt)
  const HS = 1.1;
  const SCH = [-0.6, -2.6], MOND = [10.4, -4.4];
  const HOR = 109;

  // Hoe de kinderen eruitzien (dezelfde kleren als op hun portretje)
  const UITERLIJK = {
    jij: { huid: '#F3CFAE', haar: '#7A4A22', kapsel: 'kort', hoed: 'stro', kleed: 'kiel', kleur: '#5D86B4', kleur2: '#3B3A48', das: '#C8382B' },
    twee: { huid: '#EBC3A0', haar: '#3E2A1A', kapsel: 'kort', hoed: 'muts', muts: '#B3362A', kleed: 'kiel', kleur: '#7A8656', kleur2: '#3A342E', das: '#E7C36A' },
    jantje: { huid: '#F4CDA8', haar: '#C9732E', kapsel: 'kort', hoed: 'pet', pet: '#2C4A7C', kleed: 'kiel', kleur: '#B6452C', kleur2: '#2E3242', das: '#E7C36A', sproet: true },
    mieke: { huid: '#F8DCC2', haar: '#9A5A2C', kapsel: 'bob', hoed: 'strik', strik: '#C8382B', kleed: 'jurk', kleur: '#3F6EA6', kleur2: '#2A2A38', kraag: '#FBF8F0', schort: '#EFE6D2', wimper: true },
    trijntje: { huid: '#F3D1B1', haar: '#5A3820', kapsel: 'kort', hoed: 'hul', kleed: 'jurk', kleur: '#4F7A4A', kleur2: '#2A2A28', kraag: '#FBF8F0', schort: '#ECE5D6', sproet: true, wimper: true },
    teun: { huid: '#F2CBA6', haar: '#D9A94E', kapsel: 'kort', hoed: 'bakker', kleed: 'kiel', kleur: '#EFEAE0', kleur2: '#3A3A44', das: '#3F5F8F', meel: true }
  };

  // ============================================================
  // TEGENSPELERS: ze rekenen uit wanneer ze moeten springen, maar ze zijn niet allemaal even vlug
  // tijd/laad: hoe ver hun gevoel ernaast zit (seconden); denk: hoe lang ze kauwen en kijken; ongeduld: zomaar springen
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', niveau: 1, beloning: 25, hap: 0.8, tijd: 0.12, laad: 0.06, denk: [0.7, 1.3], ongeduld: 0.4,
      zegt: { start: ['Ik ben het eerst!', 'Happen maar!'], hap: ['Hap!', 'Mmm, koek!'], bots: ['Au, mijn neus!', 'Stil nou, koek!'], wint: ['Op! Op! Op!', 'Gewonnen!'], verliest: ['Nog een koek?', 'Jij was vlugger.'] } },
    { id: 'mieke', niveau: 2, beloning: 40, hap: 0.88, tijd: 0.09, laad: 0.045, denk: [0.6, 1.05], ongeduld: 0.2,
      zegt: { start: ['Handen op je rug, hè!', 'Ik heb honger.'], hap: ['Lekker!', 'Hap!'], bots: ['Hè, hij wiebelt.', 'Oei!'], wint: ['Mijn koek is op!', 'Gewonnen!'], verliest: ['Goed gedaan!', 'Volgende keer ik.'] } },
    { id: 'trijntje', niveau: 3, beloning: 60, hap: 0.98, tijd: 0.06, laad: 0.03, denk: [0.4, 0.75], ongeduld: 0.08,
      zegt: { start: ['Rustig kijken, dan happen.', 'Klaar?'], hap: ['Hebbes!', 'Hap!'], bots: ['Hm, te vroeg.', 'Ach.'], wint: ['Op!', 'Zo gaat dat.'], verliest: ['Knap gedaan!', 'Jij kunt het!'] } },
    { id: 'teun', niveau: 4, beloning: 90, hap: 1.14, tijd: 0.035, laad: 0.02, denk: [0.32, 0.55], ongeduld: 0,
      zegt: { start: ['Mijn vader bakt ze, ik eet ze.', 'Let op, zo doe je dat.'], hap: ['Hap!', 'Vers van de bakker!'], bots: ['Die zat raar.', 'Hm!'], wint: ['Op! Nog een?', 'Ik ben bakkerszoon.'], verliest: ['Petje af!', 'Jij bent vlug!'] } }
  ];
  TEGENSTANDERS.forEach((t) => { t.naam = window.Personen ? (Personen.namen[t.id] || t.id) : t.id; });
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  const MENS_MODEL = { tijd: 0.06, laad: 0.035, denk: [0.3, 0.55], ongeduld: 0 };

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, doek, ctx, ui = {}, gebouwd = false, raf = 0, vorigeT = 0, rest = 0;
  let L = 400, sc = 1, dpr = 1, S = 4.2, TOP = 175, achter = null, achterSleutel = '';
  let tegen = TEGENSTANDERS[0];
  let aantal = 3, ronde = 0, wins = [0, 0], potjes = 0;
  let spelers = [], fase = 'klaar', spelId = 0, winnaar = -1, W = null, bevroren = false;
  let herstart = null, lesSoort = null, lesBewaard = null;
  let deeltjes = [], vingers = new Map();
  let rnd = Math.random;

  const OPSLAG = 'speelhuys.koekhappen';
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nu = () => performance.now();
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const mens = (k) => !spelers[k] || spelers[k].mens;
  const naamVan = (k) => (spelers[k] ? spelers[k].naam : '');
  const gewonnen = () => (window.Duiten ? Duiten.veld('kh-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  const nodig = () => (aantal === 1 ? 1 : 2);
  function zaad(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // van centimeters naar het logische veld (en terug)
  const X = (x) => B / 2 + x * S;
  const Y = (y) => (TOP - y) * S;

  // kleuren: lichter en donkerder, één keer uitgerekend
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function meng(a, b, t) { const x = rgb(a), y = rgb(b); return `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)}, ${Math.round(x[1] + (y[1] - x[1]) * t)}, ${Math.round(x[2] + (y[2] - x[2]) * t)})`; }
  const tint = (h) => ({ l: meng(h, '#FFF4E2', 0.2), m: h, d: meng(h, '#160C06', 0.3), dd: meng(h, '#160C06', 0.5) });
  Object.values(UITERLIJK).forEach((u) => {
    u.k = { kleur: tint(u.kleur), kleur2: tint(u.kleur2), huid: tint(u.huid), haar: tint(u.haar), wang: meng(u.huid, '#E0705A', 0.45) };
  });

  // ============================================================
  // DE WERELD: twee koeken aan één lijn, en twee kinderen
  // ============================================================
  function maakKoek(k) {
    const pt = new Float32Array(N * 2);
    for (let iy = 0, i = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++, i++) {
      pt[i * 2] = -KW / 2 + (ix + 0.5) * KW / NX;
      pt[i * 2 + 1] = (iy + 0.5) * KH / NY;
    }
    const kk = { k, th: 0, om: 0, px: 0, pvx: 0, ax: 0, py: 0, pvy: 0, ay: 0, fi: 0, fv: 0, pt, weg: new Uint8Array(N), rest: N, deel: 1, beten: [], rand: [], bots: 0, op: false, versie: 0 };
    werkRandBij(kk);
    return kk;
  }
  // de punten aan de rand (daar kan een mond de koek raken): voor de computer, die vooruitrekent
  function werkRandBij(kk) {
    kk.rand = [];
    for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++) {
      const i = iy * NX + ix;
      if (kk.weg[i]) continue;
      const leeg = (x, y) => x < 0 || y < 0 || x >= NX || y >= NY || kk.weg[y * NX + x];
      if (leeg(ix - 1, iy) || leeg(ix + 1, iy) || leeg(ix, iy - 1) || leeg(ix, iy + 1)) kk.rand.push(i);
    }
  }
  function maakKind(k, look, isMens, ai) {
    const kd = { k, dir: k === 0 ? 1 : -1, look, mens: isMens, ai, fx: 0, fxDoel: 0, staat: 'staan', z: 0, vz: 0, zak: 0, dx: 0, laad: 0, beta: 0.03, alpha: 0.14, jaw: 0,
      open: false, hapt: false, tl: 0, tUp: 0.2, apexT: -1, kauw: 0, au: 0, blij: 0, wil: false, plan: null, denk: 0.9, happen: 0, botsen: 0, kruimels: [], stap: 0, naLanden: null, p: null };
    kd.fx = kd.fxDoel = rustVoet(kd, null);
    pose(kd);
    return kd;
  }
  function maakWereld(r, windKracht) {
    const w = { t: 0, rnd: r, wind: 0, windDraai: 0, windKracht: windKracht === undefined ? 0.35 : windKracht, wf: [r() * 6, r() * 6, r() * 6, r() * 6], actief: false, cb: STIL, koeken: [maakKoek(0), maakKoek(1)], kinderen: [] };
    return w;
  }

  // ---------- de houding van een kind: heup, nek, hoofd ----------
  function pose(kd) {
    const d = kd.dir, b = kd.beta, a = kd.alpha;
    const hipX = kd.fx + d * (HEUP[0] - kd.zak * 0.3 + (kd.dx || 0)), hipY = HEUP[1] + kd.z;
    const cb = Math.cos(b), sb = Math.sin(b);
    const nekX = hipX + d * (NEK[0] * cb + NEK[1] * sb), nekY = hipY - NEK[0] * sb + NEK[1] * cb;
    const ca = Math.cos(a), sa = Math.sin(a);
    kd.p = { hipX, hipY, nekX, nekY, cx: nekX + d * (HOOFD[0] * ca - HOOFD[1] * sa), cy: nekY + HOOFD[0] * sa + HOOFD[1] * ca, ca, sa };
    return kd.p;
  }
  function naarHoofd(kd, wx, wy) {
    const p = kd.p, dx = (wx - p.cx) * kd.dir / HS, dy = (wy - p.cy) / HS;
    return [dx * p.ca + dy * p.sa, -dx * p.sa + dy * p.ca];
  }
  function naarWereldH(kd, hx, hy) {
    const p = kd.p;
    return [p.cx + kd.dir * HS * (hx * p.ca - hy * p.sa), p.cy + HS * (hx * p.sa + hy * p.ca)];
  }
  // de kaak draait om een scharnier achter de mond
  function kaak(x, y, j) {
    const a = KAAK * j, c = Math.cos(a), s = Math.sin(a), dx = x - SCH[0], dy = y - SCH[1];
    return [SCH[0] + dx * c + dy * s, SCH[1] - dx * s + dy * c];
  }
  // hoe groot je hap is: rustig happen geeft een flinke hap, een koek die voorbij zwiept een hapje
  const hapMaat = (vrel) => klem(1.15 - vrel / 160, 0.55, 1.1);
  const mondZone = (j) => ({ cx: MOND[0], cy: MOND[1] - 0.9 * j, rx: 1.7, ry: 0.8 + 1.0 * j });
  const inMond = (x, y, m) => { const a = (x - m.cx) / m.rx, b = (y - m.cy) / m.ry; return a * a + b * b <= 1; };
  // waar de koek tegen je hoofd botst; met je mond wijd open pak je hem ook als hij langs je neus komt
  function inGezicht(x, y, j, marge) {
    const open = j > 0.55, m = marge || 0;
    if ((x * x) + (y - 0.6) * (y - 0.6) < ((open ? 8.8 : 9.2) + m) ** 2) return true;   // schedel en voorhoofd
    const [kx, ky] = kaak(8.0, -7.2, j);
    if ((x - kx) ** 2 + (y - ky) ** 2 < (2.0 + m) ** 2) return true;                     // kin
    if (open) return false;
    if ((x - 10.0) ** 2 + (y + 1.6) ** 2 < (1.3 + m) ** 2) return true;                  // neus
    if ((x - 9.6) ** 2 + (y + 4.4) ** 2 < (1.25 + m) ** 2) return true;                  // dichte lippen
    return false;
  }
  // waar de mond zit als je gewoon staat (ten opzichte van je voeten)
  const MOND_RUST = (() => {
    const kd = { dir: 1, fx: 0, zak: 0, z: 0, dx: 0, beta: 0.03, alpha: 0.14 };
    pose(kd);
    return naarWereldH(kd, MOND[0], MOND[1])[0];
  })();
  // waar je voeten moeten staan: je mond net voor de dichtstbijzijnde koek
  function rustVoet(kd, kk) {
    let rand = kd.dir > 0 ? -KW / 2 : KW / 2;
    if (kk) {
      let best = kd.dir > 0 ? Infinity : -Infinity;
      for (let i = 0; i < N; i++) {
        if (kk.weg[i] || kk.pt[i * 2 + 1] < 2.4) continue;
        const u = kk.pt[i * 2];
        best = kd.dir > 0 ? Math.min(best, u) : Math.max(best, u);
      }
      if (Number.isFinite(best)) rand = best - kd.dir * (KW / NX / 2);
    }
    return PIV[kd.k] + rand - kd.dir * (SPLEET + MOND_RUST);
  }

  // ---------- de koek aan zijn touwtje ----------
  function koekStand(kk) {
    return { ex: PIV[kk.k] + kk.px + TOUW * Math.sin(kk.th), ey: LIJN + kk.py - TOUW * Math.cos(kk.th), c: Math.cos(kk.th), s: Math.sin(kk.th), f: Math.cos(kk.fi) };
  }
  // de lijn veert (op en neer, heen en weer) en neemt de andere koek een beetje mee; de koeken slingeren eraan
  function stapKoeken(w, dt) {
    const a = w.koeken[0], b = w.koeken[1];
    const KX = 150, CX = 4.5, KY = 330, CY = 5.5, KOP = 40;
    a.ax = -KX * a.px - CX * a.pvx + KOP * (b.px - a.px) + 7 * Math.sin(a.th);
    a.ay = -KY * a.py - CY * a.pvy + KOP * (b.py - a.py);
    b.ax = -KX * b.px - CX * b.pvx + KOP * (a.px - b.px) + 7 * Math.sin(b.th);
    b.ay = -KY * b.py - CY * b.pvy + KOP * (a.py - b.py);
    for (let i = 0; i < 2; i++) {
      const kk = w.koeken[i];
      kk.pvx += kk.ax * dt; kk.px += kk.pvx * dt;
      kk.pvy += kk.ay * dt; kk.py += kk.pvy * dt;
      const al = -((G_K + kk.ay) * Math.sin(kk.th) + kk.ax * Math.cos(kk.th)) / LP - DEMP * kk.om + w.wind * (i ? 0.85 : 1);
      kk.om += al * dt; kk.th += kk.om * dt;
      kk.fv += (-16 * kk.fi - 1.1 * kk.fv + w.windDraai * (i ? -1 : 1)) * dt;
      kk.fi = klem(kk.fi + kk.fv * dt, -0.5, 0.5);
      if (kk.bots > 0) kk.bots -= dt;
    }
  }
  function stapWind(w, dt) {
    w.t += dt;
    const t = w.t, f = w.wf;
    w.wind = w.windKracht * (0.55 * Math.sin(t * 0.63 + f[0]) + 0.3 * Math.sin(t * 1.71 + f[1]) + 0.15 * Math.sin(t * 3.1 + f[2]));
    w.windDraai = w.windKracht * 2.2 * Math.sin(t * 0.9 + f[3]);
  }

  // ---------- een kind: staan, door de knieën, springen, landen ----------
  function stapKind(w, kd, dt, actief) {
    if (kd.kauw > 0) kd.kauw -= dt;
    if (kd.au > 0) kd.au -= dt;
    if (kd.blij > 0) kd.blij -= dt;
    let zakDoel = 0, betaDoel = 0.03, alphaDoel = 0.14, jawDoel = 0, dxDoel = 0;
    switch (kd.staat) {
      case 'staan': {
        if (actief && kd.wil && kd.kauw <= 0) { kd.staat = 'laden'; kd.laad = 0; }
        const dx = kd.fxDoel - kd.fx;
        if (Math.abs(dx) > 0.02) { const v = Math.sign(dx) * Math.min(Math.abs(dx), 20 * dt); kd.fx += v; kd.stap += Math.abs(v); }
        break;
      }
      case 'laden': {
        kd.laad += dt;
        const c = Math.min(1, kd.laad / T_LAAD);
        zakDoel = DIEP * (1 - (1 - c) * (1 - c));
        betaDoel = 0.03 + 0.04 * c; alphaDoel = 0.17;
        if (!actief) kd.staat = 'staan';
        else if (!kd.wil) spring(w, kd);
        break;
      }
      case 'lucht': {
        kd.tl += dt;
        kd.vz -= G_S * dt; kd.z += kd.vz * dt;
        if (kd.apexT < 0 && kd.vz <= 0) kd.apexT = kd.tl;
        const prog = kd.apexT < 0 ? Math.min(1, kd.tl / kd.tUp) : Math.max(0, 1 - (kd.tl - kd.apexT) / kd.tUp);
        betaDoel = 0.03 + 0.08 * prog; alphaDoel = 0.14 + 0.24 * prog; dxDoel = 3.8 * prog;
        if (kd.hapt) { betaDoel = 0.02; alphaDoel = 0.2; dxDoel = 0.6; }
        if (kd.open && kd.apexT >= 0 && kd.tl - kd.apexT > OPEN_NA) { kd.open = false; w.cb.klap(kd); }
        jawDoel = kd.open ? 1 : 0;
        if (kd.z <= 0 && kd.vz < 0) {
          kd.z = 0; kd.vz = 0; kd.tl = 0; kd.open = false;
          kd.staat = kd.naLanden || 'landen'; kd.naLanden = null;
          w.cb.land(kd);
        }
        break;
      }
      case 'landen':
        kd.tl += dt;
        zakDoel = 3.2 * Math.sin(Math.PI * Math.min(1, kd.tl / 0.17));
        if (kd.tl >= 0.17) kd.staat = 'staan';
        break;
      case 'juich':
        kd.tl += dt;
        alphaDoel = 0.3; betaDoel = -0.05;
        break;
      case 'sip':
        alphaDoel = -0.16; betaDoel = 0.07;
        break;
    }
    if (kd.staat !== 'lucht') {
      kd.zak += (zakDoel - kd.zak) * Math.min(1, dt * (kd.staat === 'laden' ? 18 : 12));
      kd.z = kd.staat === 'juich' ? 2.2 * Math.abs(Math.sin(kd.tl * 7.5)) : -kd.zak;
    }
    const f = Math.min(1, dt * 16);
    kd.dx = (kd.dx || 0) + (dxDoel - (kd.dx || 0)) * Math.min(1, dt * 14);
    kd.beta += (betaDoel - kd.beta) * f;
    kd.alpha += (alphaDoel - kd.alpha) * f;
    if (kd.kauw > 0) jawDoel = 0.2 + 0.18 * Math.sin(kd.kauw * 34);
    kd.jaw += (jawDoel - kd.jaw) * Math.min(1, dt * (jawDoel > kd.jaw ? 30 : 22));
    pose(kd);
    const mnd = naarWereldH(kd, MOND[0], MOND[1]);
    if (kd.mondW && dt > 0) kd.mondV = [(mnd[0] - kd.mondW[0]) / dt, (mnd[1] - kd.mondW[1]) / dt];
    kd.mondW = mnd;
  }
  function spring(w, kd) {
    const c = Math.min(1, kd.laad / T_LAAD);
    const h = H_MIN + (H_MAX - H_MIN) * c;
    kd.staat = 'lucht'; kd.tl = 0; kd.apexT = -1;
    kd.vz = Math.sqrt(2 * G_S * (h + kd.zak));
    kd.tUp = kd.vz / G_S;
    kd.z = -kd.zak;
    kd.open = true; kd.hapt = false;
    w.cb.sprong(kd, c);
  }

  // ---------- raken: hap of bots ----------
  function botsingen(w) {
    for (let k = 0; k < 2; k++) {
      const kd = w.kinderen[k], kk = w.koeken[k];
      if (kk.op) continue;
      const st = koekStand(kk), p = kd.p;
      const mx = st.ex + (KH / 2) * st.s, my = st.ey - (KH / 2) * st.c;
      if ((mx - p.cx) ** 2 + (my - p.cy) ** 2 > (RH * HS + 9) ** 2) continue;
      const open = kd.open && kd.jaw > 0.55, m = mondZone(kd.jaw);
      let mond = null, bots = null;
      for (let i = 0; i < N; i++) {
        if (kk.weg[i]) continue;
        const u = kk.pt[i * 2], v = kk.pt[i * 2 + 1];
        const wx = st.ex + u * st.f * st.c + v * st.s, wy = st.ey + u * st.f * st.s - v * st.c;
        const h = naarHoofd(kd, wx, wy);
        if (h[0] * h[0] + h[1] * h[1] > (RH + 3) ** 2) continue;
        if (open && inMond(h[0], h[1], m)) { mond = [wx, wy]; break; }
        if (!bots && inGezicht(h[0], h[1], kd.jaw)) bots = [h[0], h[1], wx, wy];
      }
      if (mond) {
        // snelheid van dat stukje koek (slinger plus verende lijn) min die van je mond
        const pvx = PIV[k] + kk.px, pvy = LIJN + kk.py;
        const kvx = kk.pvx - kk.om * (mond[1] - pvy), kvy = kk.pvy + kk.om * (mond[0] - pvx);
        const mv = kd.mondV || [0, 0];
        hap(w, kd, kk, st, hapMaat(Math.hypot(kvx - mv[0], kvy - mv[1])));
      }
      else if (bots && kk.bots <= 0 && !(kd.hapt && kd.staat === 'lucht')) botst(w, kd, kk, st, bots);
    }
  }
  function hap(w, kd, kk, st, maat) {
    const m = mondZone(kd.jaw);
    const [bx, by] = naarWereldH(kd, m.cx + 1.6, m.cy);
    const R = HAP_R * (maat || 1) * ((kd.ai && kd.ai.hap) || 1), r2 = R * R;
    let n = 0;
    for (let i = 0; i < N; i++) {
      if (kk.weg[i]) continue;
      const u = kk.pt[i * 2], v = kk.pt[i * 2 + 1];
      if ((u - GAT[0]) ** 2 + (v - GAT[1]) ** 2 < 0.8 * 0.8) continue; // het knoopje in het touw
      const wx = st.ex + u * st.f * st.c + v * st.s, wy = st.ey + u * st.f * st.s - v * st.c;
      if ((wx - bx) ** 2 + (wy - by) ** 2 <= r2) { kk.weg[i] = 1; n++; }
    }
    const qx = bx - st.ex, qy = by - st.ey;
    kk.beten.push([+((qx * st.c + qy * st.s) / st.f).toFixed(2), +(qx * st.s - qy * st.c).toFixed(2), +R.toFixed(2)]);
    losseBrokken(kk);
    telRest(kk);
    werkRandBij(kk);
    kk.versie++;
    kd.open = false; kd.hapt = true; kd.kauw = KAUW; kd.happen++; kd.blij = 0.7;
    kk.om += kd.dir * (0.45 + w.rnd() * 0.3); kk.pvy -= 24; kk.fv += (w.rnd() - 0.5) * 5;
    const klaar = kk.deel <= OP_REST;
    if (klaar) { kk.weg.fill(1); kk.rest = 0; kk.deel = 0; kk.op = true; kk.rand = []; kk.versie++; }
    else kd.fxDoel = rustVoet(kd, kk);
    kd.laatsteHap = maat || 1;
    w.cb.hap(kd, kk, n, [bx, by], klaar, maat || 1);
  }
  function telRest(kk) {
    let n = 0, o = 0;
    for (let i = 0; i < N; i++) if (!kk.weg[i]) { n++; if (kk.pt[i * 2 + 1] > BOVEN) o++; }
    kk.rest = n; kk.deel = o / N_ONDER;
  }
  // wat na een hap nergens meer aan vastzit, valt eraf (de hond zal blij zijn)
  function losseBrokken(kk) {
    const vast = new Uint8Array(N), rij = [];
    for (let i = 0; i < N; i++) {
      if (kk.weg[i]) continue;
      if ((kk.pt[i * 2] - GAT[0]) ** 2 + (kk.pt[i * 2 + 1] - GAT[1]) ** 2 < 1.2 * 1.2) { vast[i] = 1; rij.push(i); }
    }
    while (rij.length) {
      const i = rij.pop(), x = i % NX, y = (i - x) / NX;
      [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([a, b]) => {
        if (a < 0 || b < 0 || a >= NX || b >= NY) return;
        const j = b * NX + a;
        if (!kk.weg[j] && !vast[j]) { vast[j] = 1; rij.push(j); }
      });
    }
    let los = 0;
    for (let i = 0; i < N; i++) if (!kk.weg[i] && !vast[i]) { kk.weg[i] = 1; los++; }
    if (los) kk.brokje = (kk.brokje || 0) + los;
  }
  function botst(w, kd, kk, st, b) {
    const wx = b[2], wy = b[3];
    if (kd.staat !== 'lucht') {
      // je staat stil en de koek tikt tegen je neus: hij wiebelt weer weg, verder niets
      kk.om = kd.dir * kk.om < 0 ? -kk.om * 0.6 + kd.dir * 0.12 : kk.om + kd.dir * 0.12;
      kk.bots = 0.25;
      return;
    }
    let nx = wx - kd.p.cx, ny = wy - kd.p.cy;
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const vz = kd.staat === 'lucht' ? kd.vz : 0;
    const kracht = 0.75 + Math.min(1.1, Math.abs(vz) * 0.006) + w.rnd() * 0.3;
    const tan = nx * st.c + ny * st.s;
    kk.om += (Math.abs(tan) < 0.25 ? kd.dir * 0.3 : tan) * kracht * 1.5;
    const weg = kd.dir * Math.max(0.8, Math.abs(kk.om) * 0.5 + kracht * 0.8);
    if (kd.dir * kk.om < kd.dir * weg) kk.om = weg;
    kk.pvy += Math.max(0, ny) * (12 + Math.max(0, vz) * 0.25);
    kk.fv += (w.rnd() - 0.5) * 6;
    kk.bots = 0.32;
    kd.au = 0.5; kd.botsen++;
    if (kd.staat === 'lucht' && kd.vz > 0) kd.vz *= 0.55;
    if (kd.open) { kd.open = false; }
    w.cb.bots(kd, kk, [wx, wy], [b[0], b[1]]);
  }

  // ============================================================
  // DE COMPUTER: hij weet hoe zijn sprong verloopt en rekent de slinger van de koek vooruit
  // ============================================================
  const LAADTIJDEN = [0.05, 0.13, 0.22, 0.32, 0.43, 0.55, 0.66];
  const STIL = { sprong() {}, land() {}, klap() {}, hap() {}, bots() {} };
  let SPRONGEN = null;
  function maakSprongen() {
    const w0 = { cb: STIL, rnd: () => 0.5 };
    SPRONGEN = LAADTIJDEN.map((tc) => {
      const kd = { k: 0, dir: 1, fx: 0, fxDoel: 0, staat: 'staan', z: 0, vz: 0, zak: 0, dx: 0, laad: 0, beta: 0.03, alpha: 0.14, jaw: 0, open: false, tl: 0, tUp: 0.2, apexT: -1, kauw: 0, au: 0, blij: 0, wil: true, stap: 0 };
      pose(kd);
      let t = 0;
      while (t < tc - 1e-9) { stapKind(w0, kd, DT, true); t += DT; }
      kd.wil = false;
      const uit = [];
      let n = 0, tt = 0, top = -Infinity;
      do {
        stapKind(w0, kd, DT, true); tt += DT; n++;
        uit.push({ t: tt, cx: kd.p.cx, cy: kd.p.cy, ca: kd.p.ca, sa: kd.p.sa, jaw: kd.jaw, open: kd.open });
        const mm = naarWereldH(kd, MOND[0], MOND[1] - 0.9 * kd.jaw);
        if (mm[1] > top) { top = mm[1]; uit.top = mm; }
      } while (kd.staat === 'lucht' && n < 400);
      return uit;
    });
  }
  function voorspelKoek(w, k, duur) {
    const kopie = w.koeken.map((kk) => ({ k: kk.k, th: kk.th, om: kk.om, px: kk.px, pvx: kk.pvx, py: kk.py, pvy: kk.pvy, fi: kk.fi, fv: kk.fv, ax: 0, ay: 0, bots: 0 }));
    const w2 = { koeken: kopie, wind: 0, windDraai: 0 };
    const uit = [];
    for (let n = 1; n * DT <= duur; n++) {
      stapKoeken(w2, DT);
      uit.push(koekStand(kopie[k]));
    }
    return uit;
  }
  function kiesSprong(w, kd) {
    if (!SPRONGEN) maakSprongen();
    const kk = w.koeken[kd.k];
    if (kk.op || !kk.rand.length) return null;
    const horizon = 1.2;
    const baan = voorspelKoek(w, kd.k, horizon + 1.4);
    const pts = kk.rand.map((i) => [kk.pt[i * 2], kk.pt[i * 2 + 1]]);
    let best = null;
    for (let s = 0; s <= 16; s++) {
      const t0 = s * horizon / 16;
      for (let li = 0; li < LAADTIJDEN.length; li++) {
        const tc = LAADTIJDEN[li], sp = SPRONGEN[li];
        let uitkomst = 0, tHap = 0, maat = 1, brok = 0;
        for (let j = 0; j < sp.length && !uitkomst; j++) {
          const q = sp[j], tAbs = t0 + tc + q.t;
          const bi = Math.round(tAbs / DT) - 1;
          if (bi >= baan.length) break;
          const st = baan[Math.max(0, bi)];
          const cx = kd.fx + kd.dir * q.cx, cy = q.cy;
          const m = mondZone(q.jaw), open = q.open && q.jaw > 0.55;
          const vorig = baan[Math.max(0, bi - 1)], qv = sp[Math.max(0, j - 1)];
          let geraakt = false;
          for (let e = 0; e < pts.length; e++) {
            const u = pts[e][0], v = pts[e][1];
            const wx = st.ex + u * st.f * st.c + v * st.s, wy = st.ey + u * st.f * st.s - v * st.c;
            const dx = (wx - cx) * kd.dir, dy = wy - cy;
            const hx = (dx * q.ca + dy * q.sa) / HS, hy = (-dx * q.sa + dy * q.ca) / HS;
            if (hx * hx + hy * hy > 160) continue;
            if (open && inMond(hx, hy, m)) {
              const px = vorig.ex + u * vorig.f * vorig.c + v * vorig.s, py = vorig.ey + u * vorig.f * vorig.s - v * vorig.c;
              const dtt = DT, mvx = kd.dir * (q.cx - qv.cx) / dtt, mvy = (q.cy - qv.cy) / dtt;
              maat = hapMaat(Math.hypot((wx - px) / dtt - mvx, (wy - py) / dtt - mvy));
              // hoeveel koek levert deze hap op?
              const R = HAP_R * maat * ((kd.ai && kd.ai.hap) || 1), bxh = m.cx + 1.6, byh = m.cy;
              const bx = cx + kd.dir * HS * (bxh * q.ca - byh * q.sa), by = cy + HS * (bxh * q.sa + byh * q.ca);
              brok = 0;
              for (let i2 = 0; i2 < N; i2++) {
                if (kk.weg[i2]) continue;
                const u2 = kk.pt[i2 * 2], v2 = kk.pt[i2 * 2 + 1];
                const x2 = st.ex + u2 * st.f * st.c + v2 * st.s, y2 = st.ey + u2 * st.f * st.s - v2 * st.c;
                if ((x2 - bx) ** 2 + (y2 - by) ** 2 <= R * R) brok++;
              }
              uitkomst = 1; tHap = tAbs; break;
            }
            if (inGezicht(hx, hy, q.jaw, 1.0)) geraakt = true;
          }
          if (!uitkomst && geraakt) uitkomst = -1;
        }
        const score = uitkomst > 0 ? Math.min(1, brok / 30) + 0.25 - tHap * 0.3 : uitkomst;
        if (!best || score > best.score) best = { score, wacht: t0, laad: tc };
      }
    }
    return best;
  }
  function stapComputer(w, kd, dt) {
    const ai = kd.ai;
    if (!ai) return;
    if (kd.plan) {
      kd.plan.t += dt;
      if (kd.staat === 'staan' && !kd.wil && kd.kauw <= 0 && kd.plan.t >= kd.plan.start) kd.wil = true;
      if (kd.wil && kd.staat === 'laden' && kd.laad >= kd.plan.laad) { kd.wil = false; kd.plan = null; kd.denk = ai.denk[0] + w.rnd() * (ai.denk[1] - ai.denk[0]); }
      else if (kd.plan && kd.plan.t > kd.plan.start + 2) { kd.plan = null; kd.wil = false; }
      return;
    }
    if (kd.staat !== 'staan' || kd.kauw > 0) return;
    if (kd.denk > 0) { kd.denk -= dt; return; }
    // eerst rustig gaan staan (anders klopt de sprong die hij in zijn hoofd heeft niet)
    if (Math.abs(kd.zak) > 0.25 || Math.abs(kd.beta - 0.03) > 0.012 || Math.abs(kd.alpha - 0.14) > 0.02 || Math.abs(kd.fx - kd.fxDoel) > 0.05) return;
    const keus = kiesSprong(w, kd);
    if (!keus || keus.score < 0.3) {
      if (w.rnd() < ai.ongeduld * 0.2) kd.plan = { t: 0, start: 0.05, laad: 0.08 + w.rnd() * 0.5 };
      else kd.denk = 0.1;
      return;
    }
    kd.plan = { t: 0, start: Math.max(0, keus.wacht + gauss(w.rnd) * ai.tijd), laad: klem(keus.laad + gauss(w.rnd) * ai.laad, 0.04, 0.8) };
    kd.verwacht = keus;
  }

  // ---------- één stapje van de hele wereld ----------
  function stapWereld(w, dt) {
    stapWind(w, dt);
    stapKoeken(w, dt);
    for (let k = 0; k < 2; k++) {
      const kd = w.kinderen[k];
      if (w.actief && !kd.mens) stapComputer(w, kd, dt);
      stapKind(w, kd, dt, w.actief);
    }
    if (w.actief) botsingen(w);
  }

  // ============================================================
  // HET SCHERM
  // ============================================================
  const koekGezicht = (k) => {
    const bg = k ? '#C9B2D6' : '#A9C4D8';
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/>
      <path d="M32 0 V20" stroke="#F3EAD6" stroke-width="1.6"/>
      <path d="M19 22 Q32 16.5 45 22 L45 52 Q45 55 42 55 L22 55 Q19 55 19 52 Z" fill="#A45F28"/>
      <path d="M19 22 Q32 16.5 45 22 L45 27.5 Q32 22.5 19 27.5 Z" fill="#5E2E12"/>
      <circle cx="46.5" cy="49" r="8.2" fill="${bg}"/>
      <g fill="#6E3816" opacity=".55"><circle cx="25" cy="33" r="1"/><circle cx="33" cy="38" r=".9"/><circle cx="27" cy="45" r="1"/><circle cx="38" cy="31" r=".8"/><circle cx="35" cy="47" r=".8"/></g>
      <circle cx="32" cy="24.2" r="1.5" fill="#2A1408"/></svg>`;
  };
  const gezichtVan = (k) => (spelers[k] && spelers[k].persoon && window.Personen && Personen.gezicht[spelers[k].persoon] ? Personen.gezicht[spelers[k].persoon] : koekGezicht(k));

  function bouw() {
    podium = document.getElementById('kh-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#kermis" aria-label="Terug naar de kermis" title="Terug naar de kermis">${icoon('terug')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="kh-stand"></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeler" title="Kies je tegenspeler" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="kh-veldvak">
      <canvas class="kh-doek" role="application" tabindex="0" aria-label="Koekhappen. Houd je vinger op het veld om door je knieën te zakken, laat los om te springen en te happen. Met het toetsenbord: houd de spatiebalk ingedrukt en laat los."></canvas>
      <div class="kh-ronde" aria-live="polite"></div>
      <div class="kh-tel" aria-hidden="true"></div>
      <div class="sj-pops kh-pops" aria-hidden="true"></div>
      <div class="sj-kaart kh-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="kh-stand"></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeler" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met wie hap je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders"></div>
        <div class="tt-keuzes"><div class="tt-keuzerij" role="group" aria-label="Aantal koeken"><button class="kj-chip" type="button" data-koeken="1">1 koek</button><button class="kj-chip" type="button" data-koeken="3">3 koeken</button></div></div>
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
      midden, vak: midden.querySelector('.kh-veldvak'), pops: midden.querySelector('.kh-pops'), uitslag: midden.querySelector('.kh-kaart'),
      ronde: midden.querySelector('.kh-ronde'), tel: midden.querySelector('.kh-tel'), meer: boven.querySelector('.mo-meer'), menu, lijst: menu.querySelector('.mo-tegenstanders'), meld
    };
    doek = midden.querySelector('.kh-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', neer);
    doek.addEventListener('pointerup', los);
    doek.addEventListener('pointercancel', los);
    doek.addEventListener('lostpointercapture', los);
    doek.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => toets(e, true));
    document.addEventListener('keyup', (e) => toets(e, false));
    window.addEventListener('blur', () => { vingers.clear(); if (W) W.kinderen.forEach((kd) => { if (kd.mens) kd.wil = false; }); });
    ui.kaart[1].addEventListener('click', openMenu);
    ui.meer.addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('koekhappen'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', () => sluitMenu(true));
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(true); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(false); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    menu.querySelectorAll('[data-koeken]').forEach((c) => c.addEventListener('click', () => {
      const n = +c.getAttribute('data-koeken');
      if (n === aantal) return;
      aantal = n;
      if (window.Duiten) Duiten.zetVeld('kh-koeken', n);
      werkSchakelaars(); sluitMenu(false); nieuwePartij();
    }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(true); });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(ui.midden);
    window.addEventListener('resize', () => pasMaatAan());
    const les = document.getElementById('les');
    if (les && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (location.hash === '#koekhappen' && les.hidden) { lesDemo(null); hervat(); } }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
    }
    gebouwd = true;
  }

  function pasMaatAan() {
    if (!ui.midden || !doek) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let breed = r.width;
    if (window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches) {
      const pr = podium.getBoundingClientRect(), cs = getComputedStyle(podium);
      breed = pr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * 168 - 20;
    }
    const hoog = r.height - 8;
    const nieuweL = Math.round(B * klem(hoog / Math.max(1, breed - 8), 0.62, 1.8));
    const s = Math.max(0.4, Math.min((breed - 8) / B, hoog / nieuweL, 3));
    const nieuweDpr = Math.min(3, window.devicePixelRatio || 1);
    if (nieuweL === L && Math.abs(s - sc) < 0.001 && nieuweDpr === dpr && achter) return;
    L = nieuweL; sc = s; dpr = nieuweDpr;
    // staand beeld: de kinderen helemaal, met hun klompen in het gras; breed beeld: dichtbij, van de borst af
    if (L / B > 1.25) { S = klem(L / 172, 3.25, 4.4); TOP = L / S - 5; }
    else { S = klem(Math.min(B / 94, L / 66), 3.2, 4.6); TOP = 160 + Math.max(0, L / S - 62) * 0.42; }
    podium.style.setProperty('--kh-b', Math.round(B * sc) + 'px');
    podium.style.setProperty('--kh-h', Math.round(L * sc) + 'px');
    doek.width = Math.round(B * sc * dpr); doek.height = Math.round(L * sc * dpr);
    achter = null;
    if (W) W.koeken.forEach((kk) => { kk.beeld = null; });
    teken(nu());
  }

  // ============================================================
  // HET DECOR: een zomermiddag op het dorpsplein, met in de verte de tolbrug (één keer getekend)
  // ============================================================
  function wereldVlak(g) { g.translate(B / 2, TOP * S); g.scale(S, -S); }
  function maakAchter() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    const k = sc * dpr;
    g.setTransform(k, 0, 0, k, 0, 0);
    const r = zaad(4242);
    const links = -B / 2 / S, rechts = B / 2 / S, onder = TOP - L / S;
    // de lucht
    let gr = g.createLinearGradient(0, 0, 0, Y(HOR));
    gr.addColorStop(0, '#86B2D4'); gr.addColorStop(0.55, '#B7D2E3'); gr.addColorStop(0.9, '#EBE4CC'); gr.addColorStop(1, '#F4E6C4');
    g.fillStyle = gr; g.fillRect(0, 0, B, Y(HOR) + 1);
    gr = g.createRadialGradient(X(-70), Y(TOP + 20), 0, X(-70), Y(TOP + 20), B * 0.9);
    gr.addColorStop(0, 'rgba(255, 244, 214, .7)'); gr.addColorStop(0.4, 'rgba(255, 238, 200, .18)'); gr.addColorStop(1, 'rgba(255, 238, 200, 0)');
    g.fillStyle = gr; g.fillRect(0, 0, B, Y(HOR));
    g.save(); wereldVlak(g);
    // wolken
    [[-30, HOR + 36, 1.1], [26, HOR + 52, 0.9], [44, HOR + 22, 0.7], [-48, HOR + 64, 0.8], [6, HOR + 78, 1.0]].forEach(([x, y, m]) => { if (y < TOP + 10) wolk(g, x, y, m, r); });
    // ver weg: bomenrij, dorp, kerk, molen, de tolbrug over de vaart
    verte(g, links, rechts, r);
    // het gras
    g.restore();
    gr = g.createLinearGradient(0, Y(HOR), 0, L);
    gr.addColorStop(0, '#B4BF7C'); gr.addColorStop(0.18, '#98AD60'); gr.addColorStop(1, '#6B8A3E');
    g.fillStyle = gr; g.fillRect(0, Y(HOR) - 0.5, B, L - Y(HOR) + 1);
    g.save(); wereldVlak(g);
    gras(g, links, rechts, onder, r);
    toeschouwers(g, r);
    // de lindebomen links en rechts: hun bladeren hangen in de hoeken
    loof(g, links - 4, LIJN + 22, -1, r);
    loof(g, rechts + 4, LIJN + 20, 1, r);
    g.restore();
    // zacht licht van linksboven, en een donkerder rand
    g.setTransform(1, 0, 0, 1, 0, 0);
    const w = c.width, h = c.height;
    gr = g.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.hypot(w, h) * 0.62);
    gr.addColorStop(0, 'rgba(30, 24, 10, 0)'); gr.addColorStop(1, 'rgba(30, 24, 10, .34)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return c;
  }
  function wolk(g, x, y, m, r) {
    for (let i = 0; i < 11; i++) {
      const bx = x + (r() - 0.5) * 22 * m, by = y + (r() - 0.3) * 5 * m, br = (3 + r() * 5) * m;
      const gr = g.createRadialGradient(bx - br * 0.3, by + br * 0.4, 0, bx, by, br);
      gr.addColorStop(0, 'rgba(255, 255, 252, .92)'); gr.addColorStop(0.6, 'rgba(246, 244, 238, .6)'); gr.addColorStop(1, 'rgba(225, 230, 236, 0)');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    }
  }
  function verte(g, links, rechts, r) {
    // de vaart langs de horizon (rechts), met het licht van de lucht erin
    let gr = g.createLinearGradient(0, HOR + 0.4, 0, HOR - 1.4);
    gr.addColorStop(0, '#C9DCE2'); gr.addColorStop(1, '#9FBFCB');
    g.fillStyle = gr; g.fillRect(-2, HOR - 1.3, rechts + 4, 1.5);
    // bomengroepen met ronde kruinen en rijen populieren: Holland is plat
    const kruin = (x, b, kl) => {
      g.fillStyle = kl;
      for (let i = 0; i < 4; i++) { const rr = b * (0.32 + r() * 0.22); g.beginPath(); g.arc(x + (r() - 0.5) * b, HOR + 0.3 + rr * 0.9 + r() * 0.4, rr, 0, Math.PI * 2); g.fill(); }
    };
    const populier = (x, h, kl) => { g.fillStyle = kl; g.beginPath(); g.ellipse(x, HOR + h * 0.5, 0.42, h * 0.5, 0, 0, Math.PI * 2); g.fill(); };
    for (let x = links - 3; x < rechts + 3;) {
      const vrij = (x > -47 && x < -26) || (x > 2 && x < 21);
      if (!vrij) {
        if (r() < 0.25) { const n = 3 + Math.floor(r() * 4); for (let i = 0; i < n; i++) populier(x + i * 0.9, 3.4 + r() * 1.4, 'rgba(98, 122, 104, .9)'); x += n * 0.9 + 1; continue; }
        const b = 1.8 + r() * 3.4;
        kruin(x, b, r() < 0.5 ? 'rgba(112, 136, 116, .92)' : 'rgba(124, 146, 122, .92)');
        x += b * (0.6 + r() * 0.7);
      } else x += 1.2;
    }
    // het dorp: trapgevels en de kerk met een spitse toren
    const gevel = (x, b, h, kl) => {
      g.fillStyle = kl;
      g.beginPath(); g.moveTo(x, HOR); g.lineTo(x, HOR + h);
      const tr = 3, st = b / (2 * tr + 1);
      for (let i = 0; i < tr; i++) { g.lineTo(x + st * i, HOR + h + st * 0.9 * i); g.lineTo(x + st * (i + 1), HOR + h + st * 0.9 * i); }
      g.lineTo(x + st * tr, HOR + h + st * 0.9 * tr); g.lineTo(x + b - st * tr, HOR + h + st * 0.9 * tr);
      for (let i = tr - 1; i >= 0; i--) { g.lineTo(x + b - st * (i + 1), HOR + h + st * 0.9 * i); g.lineTo(x + b - st * i, HOR + h + st * 0.9 * i); }
      g.lineTo(x + b, HOR); g.closePath(); g.fill();
      g.fillStyle = 'rgba(246, 236, 210, .55)';
      g.fillRect(x + b * 0.28, HOR + h * 0.3, b * 0.14, h * 0.25); g.fillRect(x + b * 0.58, HOR + h * 0.3, b * 0.14, h * 0.25);
    };
    gevel(-45.6, 2.4, 2.2, '#A8705A'); gevel(-42.8, 2.9, 2.7, '#B47A60'); gevel(-39.6, 2.2, 2.0, '#9E6A56');
    g.fillStyle = '#9A7C68'; g.fillRect(-36.4, HOR, 1.6, 6.8);
    g.fillStyle = '#8A7062'; g.fillRect(-36.7, HOR + 6.6, 2.2, 0.5);
    g.beginPath(); g.moveTo(-36.5, HOR + 7.1); g.lineTo(-35.6, HOR + 11.4); g.lineTo(-34.7, HOR + 7.1); g.closePath(); g.fillStyle = '#5E6470'; g.fill();
    g.fillStyle = '#7E6A5E'; g.fillRect(-34.8, HOR, 4.6, 3.0);
    g.beginPath(); g.moveTo(-35, HOR + 3); g.lineTo(-32.5, HOR + 4.6); g.lineTo(-30.0, HOR + 3); g.closePath(); g.fillStyle = '#5E5250'; g.fill();
    gevel(-29.8, 2.6, 2.4, '#B07660'); gevel(-26.9, 2.0, 1.8, '#A46E58');
    // molens in de verte
    const molen = (x, m) => {
      g.fillStyle = '#6E6460';
      g.beginPath(); g.moveTo(x - 1.1 * m, HOR); g.lineTo(x - 0.6 * m, HOR + 4.4 * m); g.lineTo(x + 0.6 * m, HOR + 4.4 * m); g.lineTo(x + 1.1 * m, HOR); g.closePath(); g.fill();
      g.beginPath(); g.arc(x, HOR + 4.5 * m, 0.7 * m, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(80, 70, 66, .9)'; g.lineWidth = 0.22 * m;
      g.beginPath(); g.moveTo(x - 2.8 * m, HOR + 7.2 * m); g.lineTo(x + 2.8 * m, HOR + 1.8 * m); g.moveTo(x - 2.7 * m, HOR + 1.9 * m); g.lineTo(x + 2.7 * m, HOR + 7.1 * m); g.stroke();
    };
    molen(-55, 1.0); molen(24.5, 0.75);
    // de tolbrug: een witte ophaalbrug over de vaart, met het tolhuisje
    g.fillStyle = '#F6F2E8'; g.strokeStyle = 'rgba(150, 144, 130, .9)'; g.lineWidth = 0.09;
    g.beginPath(); g.moveTo(3.6, HOR - 0.2); g.quadraticCurveTo(10.4, HOR + 1.0, 17.2, HOR - 0.2); g.lineTo(17.2, HOR + 0.35); g.quadraticCurveTo(10.4, HOR + 1.5, 3.6, HOR + 0.35); g.closePath(); g.fill(); g.stroke();
    [7.6, 13.2].forEach((x) => { g.fillRect(x - 0.22, HOR + 0.5, 0.44, 6.0); g.strokeRect(x - 0.22, HOR + 0.5, 0.44, 6.0); });
    g.fillRect(7.0, HOR + 6.3, 6.8, 0.42); g.strokeRect(7.0, HOR + 6.3, 6.8, 0.42);
    g.save(); g.translate(10.4, HOR + 6.75); g.rotate(-0.05);
    g.fillRect(-4.8, -0.2, 11.4, 0.4); g.strokeRect(-4.8, -0.2, 11.4, 0.4);
    g.restore();
    g.strokeStyle = 'rgba(70, 66, 60, .7)'; g.lineWidth = 0.07;
    g.beginPath(); g.moveTo(5.8, HOR + 6.55); g.lineTo(4.6, HOR + 0.5); g.moveTo(16.4, HOR + 6.25); g.lineTo(16.0, HOR + 0.5);
    g.moveTo(4.2, HOR + 1.1); g.quadraticCurveTo(10.4, HOR + 2.2, 16.6, HOR + 1.1); g.stroke();
    g.fillStyle = '#EFE9DA'; g.fillRect(18.4, HOR, 2.6, 2.0);
    g.beginPath(); g.moveTo(18.2, HOR + 2); g.lineTo(19.7, HOR + 3.5); g.lineTo(21.2, HOR + 2); g.closePath(); g.fillStyle = '#4A5650'; g.fill();
    g.fillStyle = 'rgba(70, 60, 50, .55)'; g.fillRect(19.0, HOR + 0.6, 0.5, 0.7); g.fillRect(20.0, HOR + 0.6, 0.5, 0.7);
    // weerkaatsing en rimpels in de vaart
    g.fillStyle = 'rgba(246, 242, 232, .35)'; g.fillRect(7.4, HOR - 1.25, 0.5, 1.0); g.fillRect(13.0, HOR - 1.25, 0.5, 1.0);
    g.strokeStyle = 'rgba(255, 255, 255, .5)'; g.lineWidth = 0.1;
    for (let i = 0; i < 10; i++) { const x = r() * rechts; g.beginPath(); g.moveTo(x, HOR - 0.5 - r() * 0.7); g.lineTo(x + 1.2 + r() * 2.2, HOR - 0.5 - r() * 0.7); g.stroke(); }
    // nevel over de verte
    gr = g.createLinearGradient(0, HOR + 12, 0, HOR - 2);
    gr.addColorStop(0, 'rgba(244, 234, 206, 0)'); gr.addColorStop(0.75, 'rgba(244, 234, 206, .38)'); gr.addColorStop(1, 'rgba(244, 234, 206, .12)');
    g.fillStyle = gr; g.fillRect(links - 2, HOR - 2, rechts - links + 4, 14);
  }
  function gras(g, links, rechts, onder, r) {
    // grasstreken, verder weg fijner en lichter
    const laag = Math.min(onder, HOR - 4);
    for (let i = 0; i < 340; i++) {
      const y = HOR - 1.2 - Math.pow(r(), 1.5) * (HOR - laag + 2);
      const x = links + r() * (rechts - links);
      const diepte = Math.min(1, (HOR - y) / 60);
      g.strokeStyle = r() < 0.55 ? `rgba(66, 92, 34, ${0.1 + diepte * 0.22})` : `rgba(204, 214, 136, ${0.08 + diepte * 0.16})`;
      g.lineWidth = 0.14 + diepte * 0.5;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 0.8 + diepte * 3, y + 0.2 + diepte, x + 1.4 + diepte * 6, y + (r() - 0.5) * 0.4); g.stroke();
    }
    // een sloot met riet in de verte, links
    g.fillStyle = 'rgba(150, 182, 196, .6)';
    g.beginPath(); g.moveTo(links - 2, HOR - 2.4); g.quadraticCurveTo(-30, HOR - 2.0, -6, HOR - 1.7); g.lineTo(-6, HOR - 1.5); g.quadraticCurveTo(-30, HOR - 1.6, links - 2, HOR - 1.8); g.closePath(); g.fill();
    // madeliefjes en boterbloemen
    for (let i = 0; i < 90; i++) {
      const y = HOR - 2.5 - Math.pow(r(), 0.8) * 46, x = links + r() * (rechts - links);
      const m = 0.12 + (HOR - y) / 110;
      g.fillStyle = r() < 0.62 ? 'rgba(255, 252, 244, .85)' : 'rgba(246, 206, 70, .85)';
      g.beginPath(); g.arc(x, y, m, 0, Math.PI * 2); g.fill();
      if (m > 0.3) { g.fillStyle = 'rgba(236, 190, 60, .9)'; g.beginPath(); g.arc(x, y, m * 0.35, 0, Math.PI * 2); g.fill(); }
    }
  }
  // dorpelingen die staan te kijken, een eindje verderop (geen in het midden: daar wordt gehapt)
  function persoon(g, x, y0, h, o) {
    const s = h / 100, d = o.kijk || 1;
    const vul = (kl) => { const gr = g.createLinearGradient(x - 14 * s, 0, x + 14 * s, 0); gr.addColorStop(0, meng(kl, '#FFF4E2', 0.18)); gr.addColorStop(0.6, kl); gr.addColorStop(1, meng(kl, '#100804', 0.3)); return gr; };
    g.fillStyle = 'rgba(40, 52, 20, .22)'; g.beginPath(); g.ellipse(x + 6 * s, y0 + 0.3, 16 * s, 2.6 * s, 0, 0, Math.PI * 2); g.fill();
    if (!o.rok) {
      g.fillStyle = o.broek || '#2E2A28';
      g.fillRect(x - 7 * s, y0, 5.4 * s, 44 * s); g.fillRect(x + 1.6 * s, y0, 5.4 * s, 44 * s);
    }
    g.beginPath();
    if (o.rok) {
      g.moveTo(x - 15 * s, y0); g.quadraticCurveTo(x - 13 * s, y0 + 38 * s, x - 9 * s, y0 + 62 * s);
      g.lineTo(x - 9.5 * s, y0 + 78 * s); g.quadraticCurveTo(x, y0 + 84 * s, x + 9.5 * s, y0 + 78 * s);
      g.lineTo(x + 9 * s, y0 + 62 * s); g.quadraticCurveTo(x + 13 * s, y0 + 38 * s, x + 15 * s, y0);
    } else {
      g.moveTo(x - 10 * s, y0 + 34 * s); g.lineTo(x - 10.5 * s, y0 + 76 * s); g.quadraticCurveTo(x, y0 + 84 * s, x + 10.5 * s, y0 + 76 * s); g.lineTo(x + 10 * s, y0 + 34 * s);
    }
    g.closePath(); g.fillStyle = vul(o.jas); g.fill();
    if (o.schort) { g.fillStyle = o.schort; g.beginPath(); g.moveTo(x - 6 * s, y0 + 6 * s); g.lineTo(x - 5 * s, y0 + 58 * s); g.lineTo(x + 5 * s, y0 + 58 * s); g.lineTo(x + 6 * s, y0 + 6 * s); g.closePath(); g.fill(); }
    if (o.kraag) { g.fillStyle = o.kraag; g.beginPath(); g.ellipse(x, y0 + 78 * s, 8.5 * s, 3 * s, 0, 0, Math.PI * 2); g.fill(); }
    // armen
    g.strokeStyle = meng(o.jas, '#100804', 0.15); g.lineWidth = 4.6 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 9 * s, y0 + 74 * s); g.quadraticCurveTo(x - 12 * s, y0 + 58 * s, x - 10 * s, y0 + (o.armen ? 66 : 44) * s); g.stroke();
    g.beginPath(); g.moveTo(x + 9 * s, y0 + 74 * s); g.quadraticCurveTo(x + 12 * s, y0 + 58 * s, x + 10 * s, y0 + 44 * s); g.stroke();
    g.fillStyle = o.huid || '#E8C4A2';
    g.beginPath(); g.arc(x - 10 * s, y0 + (o.armen ? 67 : 42) * s, 2.4 * s, 0, Math.PI * 2); g.arc(x + 10 * s, y0 + 42 * s, 2.4 * s, 0, Math.PI * 2); g.fill();
    // hoofd, iets gedraaid naar het spel
    g.beginPath(); g.ellipse(x + d * 0.6 * s, y0 + 89 * s, 6.4 * s, 7.2 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(120, 60, 30, .18)'; g.beginPath(); g.ellipse(x + d * 3.2 * s, y0 + 88 * s, 3.2 * s, 6.4 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(40, 20, 10, .7)'; g.beginPath(); g.arc(x + d * 3.0 * s, y0 + 90 * s, 0.8 * s, 0, Math.PI * 2); g.fill();
    // hoofddeksel
    if (o.hoed === 'hoog') {
      g.fillStyle = '#1E1A18'; g.fillRect(x - 9.5 * s, y0 + 95 * s, 19 * s, 2.2 * s); g.fillRect(x - 6 * s, y0 + 96.5 * s, 12 * s, 13 * s);
    } else if (o.hoed === 'kap') {
      g.fillStyle = '#FBF8F0'; g.beginPath(); g.ellipse(x - d * 0.6 * s, y0 + 91.5 * s, 7.6 * s, 7.4 * s, 0, Math.PI * 0.92, Math.PI * 2.08); g.fill();
      g.strokeStyle = 'rgba(160, 150, 130, .6)'; g.lineWidth = 0.6 * s; g.stroke();
    } else if (o.hoed === 'pet') {
      g.fillStyle = o.hoedKleur || '#2E3A54'; g.beginPath(); g.ellipse(x, y0 + 94.5 * s, 7.2 * s, 3.6 * s, 0, Math.PI, 0); g.fill(); g.fillRect(x + d * 2 * s - (d < 0 ? 7 * s : 0), y0 + 93.6 * s, 7 * s, 1.4 * s);
    } else if (o.hoed === 'stro') {
      g.fillStyle = '#D8B870'; g.beginPath(); g.ellipse(x, y0 + 94.2 * s, 11 * s, 2 * s, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(x, y0 + 97 * s, 5.8 * s, 4.2 * s, 0, Math.PI, 0); g.fill();
    } else if (o.haar) { g.fillStyle = o.haar; g.beginPath(); g.ellipse(x - d * 0.8 * s, y0 + 92.5 * s, 6.6 * s, 4.6 * s, 0, Math.PI * 0.95, Math.PI * 2.05); g.fill(); }
  }
  function toeschouwers(g, r) {
    const y0 = HOR - 6.5;
    persoon(g, -54, y0 - 1, 27, { jas: '#3A3646', rok: true, schort: '#E8E2D2', hoed: 'kap', kraag: '#F4F0E6', kijk: 1 });
    persoon(g, -49.6, y0, 29, { jas: '#4E3E30', broek: '#2A2624', hoed: 'hoog', kijk: 1 });
    persoon(g, -45.8, y0 + 0.5, 17, { jas: '#9A4A36', broek: '#3A3430', hoed: 'pet', hoedKleur: '#2C3C5A', kijk: 1, armen: true });
    persoon(g, 45.2, y0 - 0.5, 26, { jas: '#2E3A4E', rok: true, schort: '#ECE6D6', hoed: 'kap', kraag: '#F4F0E6', kijk: -1 });
    persoon(g, 49.4, y0 + 0.4, 16, { jas: '#6E7A4A', rok: true, haar: '#C9732E', kijk: -1, armen: true });
    persoon(g, 53.4, y0 - 1.2, 28, { jas: '#5A4A3A', broek: '#2E2A28', hoed: 'stro', kijk: -1 });
    // de kraam van de bakker, met een gestreept zeil en stapels koek
    const x = 36.2, y = HOR - 4.6;
    g.fillStyle = '#6E5236'; g.fillRect(x - 3.6, y, 0.4, 6.2); g.fillRect(x + 3.2, y, 0.4, 6.2);
    g.fillStyle = '#8A6A46'; g.fillRect(x - 4, y + 2.6, 8, 0.5);
    g.fillStyle = '#7A4220'; for (let i = 0; i < 4; i++) { g.fillRect(x - 3.2 + i * 1.7, y + 3.1, 1.3, 1.3); g.fillStyle = '#4A2410'; g.fillRect(x - 3.2 + i * 1.7, y + 4.1, 1.3, 0.3); g.fillStyle = '#7A4220'; }
    g.fillStyle = '#F2EEE4'; g.beginPath(); g.moveTo(x - 4.6, y + 6.2); g.lineTo(x + 4.6, y + 6.2); g.lineTo(x + 3.8, y + 7.6); g.lineTo(x - 3.8, y + 7.6); g.closePath(); g.fill();
    g.fillStyle = '#B8402E'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x - 4.6 + i * 1.84, y + 6.2); g.lineTo(x - 3.7 + i * 1.84, y + 6.2); g.lineTo(x - 3.05 + i * 1.5, y + 7.6); g.lineTo(x - 3.8 + i * 1.5, y + 7.6); g.closePath(); g.fill(); }
    void r;
  }
  function loof(g, x, y, kant, r) {
    // de stam van de linde (op brede schermen net in beeld), takken en bladeren
    g.fillStyle = '#4A3A2A';
    g.beginPath(); g.moveTo(x - 3.2, HOR - 40); g.bezierCurveTo(x - 2.4, y - 20, x - 2.2, y, x - 1.6, y + 14); g.lineTo(x + 2.4, y + 14); g.bezierCurveTo(x + 2.4, y, x + 3, y - 20, x + 3.6, HOR - 40); g.closePath(); g.fill();
    g.strokeStyle = '#4A3A2A'; g.lineCap = 'round';
    [[0.9, 18, 6], [0.55, 24, 12], [1.25, 14, 16]].forEach(([a, l, h]) => { g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, y + h); g.quadraticCurveTo(x - kant * l * 0.5, y + h + l * 0.3 * a, x - kant * l, y + h - 2 + l * 0.2); g.stroke(); });
    // donkere binnenkant, dan de bladeren in het licht
    for (let i = 0; i < 18; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 16;
      g.fillStyle = 'rgba(46, 66, 32, .55)';
      g.beginPath(); g.arc(x - kant * 4 + Math.cos(a) * d * 1.3, y + 12 + Math.sin(a) * d * 0.7, 3 + r() * 3, 0, Math.PI * 2); g.fill();
    }
    const kleuren = ['#3A5428', '#4A6A30', '#5A7A38', '#6C8C42', '#86A24E', '#A0B85E'];
    for (let i = 0; i < 300; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 22;
      const bx = x - kant * 3 + Math.cos(a) * d * 1.3, by = y + 11 + Math.sin(a) * d * 0.78;
      if (by < LIJN + 5) continue;
      const licht = -(bx - x) * 0.9 + (by - y) * 0.7 + (r() - 0.5) * 10;
      g.fillStyle = kleuren[klem(Math.round(2.5 + licht / 10), 0, 5)];
      g.globalAlpha = 0.9;
      const rx = 0.9 + r() * 0.8, hoek = r() * 3;
      g.beginPath(); g.ellipse(bx, by, rx, rx * 0.62, hoek, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  // ============================================================
  // DE KOEK: een plak ontbijtkoek met korst, en de happen eruit (één keer getekend per hap)
  // ============================================================
  function koekBeelden(kk) {
    const res = Math.max(6, Math.round(S * sc * dpr * 1.3));
    const sleutel = kk.versie + '|' + res;
    if (kk.beeld && kk.beeldSleutel === sleutel) return kk;
    const rand = 0.6;
    const bw = Math.ceil((KW + rand * 2) * res), bh = Math.ceil((KH + rand * 2) * res);
    const c = document.createElement('canvas'); c.width = bw; c.height = bh;
    const g = c.getContext('2d');
    g.setTransform(res, 0, 0, res, (KW / 2 + rand) * res, rand * res);
    const r = zaad(77 + kk.k * 13);
    // de vorm: recht gesneden, met bovenop de bolle bruine korst
    const vorm = () => {
      g.beginPath();
      g.moveTo(-KW / 2, 0.3);
      g.quadraticCurveTo(0, -0.45, KW / 2, 0.3);
      g.lineTo(KW / 2, KH - 0.4); g.quadraticCurveTo(KW / 2, KH, KW / 2 - 0.4, KH);
      g.lineTo(-KW / 2 + 0.4, KH); g.quadraticCurveTo(-KW / 2, KH, -KW / 2, KH - 0.4);
      g.closePath();
    };
    vorm();
    let gr = g.createLinearGradient(-KW / 2, 0, KW / 2, KH);
    gr.addColorStop(0, '#A45E2A'); gr.addColorStop(0.5, '#93511F'); gr.addColorStop(1, '#7C431A');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    // kruim: fijne poriën en spikkels
    for (let i = 0; i < 260; i++) {
      const x = (r() - 0.5) * KW, y = r() * KH;
      g.fillStyle = r() < 0.55 ? `rgba(98, 50, 18, ${0.25 + r() * 0.3})` : `rgba(206, 146, 84, ${0.25 + r() * 0.3})`;
      g.beginPath(); g.ellipse(x, y, 0.05 + r() * 0.1, 0.04 + r() * 0.07, r() * 3, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 22; i++) {
      const x = (r() - 0.5) * (KW - 0.8), y = 0.8 + r() * (KH - 1.2);
      g.fillStyle = 'rgba(70, 32, 10, .45)';
      g.beginPath(); g.ellipse(x, y, 0.1 + r() * 0.14, 0.06 + r() * 0.08, r() * 3, 0, Math.PI * 2); g.fill();
    }
    // stukjes sukade
    for (let i = 0; i < 5; i++) {
      const x = (r() - 0.5) * (KW - 1.4), y = 1.6 + r() * (KH - 2.4);
      g.fillStyle = 'rgba(214, 160, 60, .75)';
      g.beginPath(); g.ellipse(x, y, 0.22, 0.14, r() * 3, 0, Math.PI * 2); g.fill();
    }
    // de korst bovenop, glanzend; en een dun korstje aan de zijkanten
    g.beginPath(); g.moveTo(-KW / 2 - 0.1, 0.3); g.quadraticCurveTo(0, -0.45, KW / 2 + 0.1, 0.3); g.lineTo(KW / 2 + 0.1, 0.95); g.quadraticCurveTo(0, 0.25, -KW / 2 - 0.1, 0.95); g.closePath();
    gr = g.createLinearGradient(0, -0.4, 0, 1);
    gr.addColorStop(0, '#4A220C'); gr.addColorStop(0.6, '#6A3414'); gr.addColorStop(1, '#7E4220');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(255, 220, 170, .45)'; g.lineWidth = 0.09;
    g.beginPath(); g.moveTo(-KW / 2 + 0.5, 0.12); g.quadraticCurveTo(-1.2, -0.22, 0.6, -0.12); g.stroke();
    g.restore();
    vorm();
    g.strokeStyle = 'rgba(92, 44, 16, .85)'; g.lineWidth = 0.2; g.stroke();
    // het gaatje voor het touw
    g.fillStyle = '#2A1206'; g.beginPath(); g.arc(GAT[0], GAT[1], 0.2, 0, Math.PI * 2); g.fill();
    // de happen: met tandjes, en een lichte rand van vers kruim
    if (kk.beten.length || kk.op) {
      g.globalCompositeOperation = 'destination-out';
      kk.beten.forEach(([u, v, r]) => { hapVorm(g, u, v, r || HAP_R); g.fill(); });
      if (kk.op) g.fillRect(-KW, -1, KW * 2, KH + 2);
      // losse brokken die eraf vielen: weggummen wat niet meer bestaat
      wegGum(g, kk);
      g.globalCompositeOperation = 'source-atop';
      g.strokeStyle = 'rgba(222, 160, 96, .7)'; g.lineWidth = 0.34;
      kk.beten.forEach(([u, v, r]) => { hapVorm(g, u, v, (r || HAP_R) + 0.12); g.stroke(); });
      g.globalCompositeOperation = 'source-over';
    }
    // de zijkant (dikte van de plak) als donkere kopie, voor als hij draait
    const z = document.createElement('canvas'); z.width = bw; z.height = bh;
    const zg = z.getContext('2d');
    zg.drawImage(c, 0, 0);
    zg.globalCompositeOperation = 'source-atop';
    zg.fillStyle = 'rgba(58, 26, 8, .62)'; zg.fillRect(0, 0, bw, bh);
    kk.beeld = c; kk.zij = z; kk.beeldSleutel = sleutel; kk.res = res; kk.rand2 = rand;
    return kk;
  }
  function hapVorm(g, u, v, r) {
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * Math.PI * 2, rr = r + 0.13 * Math.sin(a * 11);
      if (i) g.lineTo(u + Math.cos(a) * rr, v + Math.sin(a) * rr); else g.moveTo(u + Math.cos(a) * rr, v + Math.sin(a) * rr);
    }
    g.closePath();
  }
  // wat los raakte (zonder hap) ook weghalen: per weggevallen punt een vakje
  function wegGum(g, kk) {
    if (!kk.brokje) return;
    const dx = KW / NX, dy = KH / NY;
    const bijHap = (u, v) => kk.beten.some(([bu, bv, r]) => (u - bu) ** 2 + (v - bv) ** 2 <= ((r || HAP_R) + 0.4) ** 2);
    for (let i = 0; i < N; i++) {
      if (!kk.weg[i]) continue;
      const u = kk.pt[i * 2], v = kk.pt[i * 2 + 1];
      if (bijHap(u, v)) continue;
      g.fillRect(u - dx / 2 - 0.02, v - dy / 2 - 0.02, dx + 0.04, dy + 0.04);
    }
  }

  // ============================================================
  // TEKENEN
  // ============================================================
  function teken() {
    if (!ctx || !doek.width || !W) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sleutel = L + '|' + doek.width;
    if (!achter || achterSleutel !== sleutel) { achter = maakAchter(); achterSleutel = sleutel; }
    ctx.drawImage(achter, 0, 0);
    const k = sc * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    tekenLijn(ctx);
    if (TOP - L / S < 8) tekenSchaduwen(ctx);
    W.kinderen.forEach((kd) => tekenKind(ctx, kd));
    W.koeken.forEach((kk) => tekenKoek(ctx, kk));
    tekenDeeltjes(ctx);
    tekenGeest(ctx);
  }
  // schaduwen van de kinderen en de koeken op het gras: kleiner als je springt
  function tekenSchaduwen(g) {
    g.save(); wereldVlak(g);
    W.kinderen.forEach((kd) => {
      const hoog = Math.max(0, kd.z), m = 1 / (1 + hoog / 22);
      const gr = g.createRadialGradient(kd.fx + 5, 0.6, 0, kd.fx + 5, 0.6, 19 * m);
      gr.addColorStop(0, `rgba(36, 48, 16, ${0.42 * m})`); gr.addColorStop(1, 'rgba(36, 48, 16, 0)');
      g.fillStyle = gr; g.save(); g.translate(kd.fx + 5, 0.6); g.scale(1, 0.2); g.translate(-(kd.fx + 5), -0.6);
      g.beginPath(); g.arc(kd.fx + 5, 0.6, 19 * m, 0, Math.PI * 2); g.fill(); g.restore();
    });
    g.restore();
  }
  // de lijn tussen de bomen, met vlaggetjes, en de touwtjes naar de koeken
  function tekenLijn(g) {
    const a = W.koeken[0], b = W.koeken[1];
    const p0 = [-B / 2 / S - 8, LIJN + 3], p1 = [PIV[0] + a.px, LIJN + a.py], p2 = [PIV[1] + b.px, LIJN + b.py], p3 = [B / 2 / S + 8, LIJN + 3];
    g.save(); wereldVlak(g);
    g.lineCap = 'round';
    const lijn = () => {
      g.beginPath(); g.moveTo(p0[0], p0[1]);
      g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 1.6, p1[0], p1[1]);
      g.quadraticCurveTo((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 - 0.9, p2[0], p2[1]);
      g.quadraticCurveTo((p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2 - 1.6, p3[0], p3[1]);
    };
    g.strokeStyle = 'rgba(40, 30, 10, .18)'; g.lineWidth = 0.7; g.save(); g.translate(0.4, -0.5); lijn(); g.stroke(); g.restore();
    g.strokeStyle = '#B9A274'; g.lineWidth = 0.55; lijn(); g.stroke();
    g.strokeStyle = 'rgba(255, 244, 214, .5)'; g.lineWidth = 0.16; g.setLineDash([0.5, 0.6]); lijn(); g.stroke(); g.setLineDash([]);
    // vlaggetjes: rood, wit en blauw
    const kleuren = ['#B8382A', '#F4F0E6', '#3A5C94'];
    const vlag = (x, y, i) => {
      const zw = Math.sin(W.t * 2.2 + x * 0.4) * 0.5;
      g.fillStyle = kleuren[i % 3];
      g.beginPath(); g.moveTo(x - 1.3, y); g.lineTo(x + 1.3, y); g.lineTo(x + zw * 0.6, y - 3.2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40, 20, 10, .25)'; g.lineWidth = 0.08; g.stroke();
    };
    const op = (pa, pb, t, zak) => [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t - zak * 4 * t * (1 - t)];
    [0.2, 0.45, 0.7].forEach((t, i) => { const q = op(p0, p1, t, 1.6); vlag(q[0], q[1], i); });
    [0.33, 0.66].forEach((t, i) => { const q = op(p1, p2, t, 0.9); vlag(q[0], q[1], i + 1); });
    [0.3, 0.55, 0.8].forEach((t, i) => { const q = op(p2, p3, t, 1.6); vlag(q[0], q[1], i + 2); });
    // de touwtjes
    W.koeken.forEach((kk) => {
      const st = koekStand(kk), gx = st.ex + GAT[1] * st.s, gy = st.ey - GAT[1] * st.c;
      const px = PIV[kk.k] + kk.px, py = LIJN + kk.py;
      g.strokeStyle = 'rgba(40, 30, 10, .2)'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(px + 0.25, py - 0.3); g.lineTo(gx + 0.25, gy - 0.3); g.stroke();
      g.strokeStyle = '#EFE6D0'; g.lineWidth = 0.15; g.beginPath(); g.moveTo(px, py); g.lineTo(gx, gy); g.stroke();
      g.fillStyle = '#B9A274'; g.beginPath(); g.arc(px, py, 0.42, 0, Math.PI * 2); g.fill();
    });
    g.restore();
  }
  function tekenKoek(g, kk) {
    const st = koekStand(kk);
    if (!kk.op) {
      koekBeelden(kk);
      const res = kk.res, rd = kk.rand2, bw = kk.beeld.width / res, bh = kk.beeld.height / res;
      g.save();
      g.translate(X(st.ex), Y(st.ey));
      g.rotate(-kk.th);
      g.scale(S * st.f, S);
      const zij = Math.sin(kk.fi) * 1.6 / Math.max(0.6, st.f);
      g.shadowColor = 'rgba(30, 14, 4, .35)'; g.shadowBlur = 6 * sc * dpr; g.shadowOffsetX = 2 * sc * dpr; g.shadowOffsetY = 3 * sc * dpr;
      if (Math.abs(zij) > 0.04) g.drawImage(kk.zij, -KW / 2 - rd + zij, -rd, bw, bh);
      g.drawImage(kk.beeld, -KW / 2 - rd, -rd, bw, bh);
      g.shadowColor = 'transparent';
      g.restore();
    } else {
      // alleen het knoopje met een kruimel blijft over
      g.save(); wereldVlak(g);
      const gx = st.ex + GAT[1] * st.s, gy = st.ey - GAT[1] * st.c;
      g.fillStyle = '#7A3E18'; g.beginPath(); g.ellipse(gx, gy - 0.2, 0.55, 0.45, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }

  // ---------- een kind, van opzij ----------
  function tekenKind(g, kd) {
    const U = UITERLIJK[kd.look] || UITERLIJK.jij, p = kd.p, d = kd.dir;
    g.save(); wereldVlak(g);
    g.lineCap = 'round'; g.lineJoin = 'round';
    tekenBenen(g, kd, U);
    tekenNek(g, kd, U);
    // lijf en armen
    g.save(); g.translate(p.hipX, p.hipY); g.scale(d, 1); g.rotate(-kd.beta);
    tekenArm(g, kd, U, false);
    tekenLijf(g, kd, U);
    if (kd.staat !== 'juich') tekenArm(g, kd, U, true);
    g.restore();
    // hoofd
    g.save(); g.translate(p.cx, p.cy); g.scale(d, 1); g.rotate(kd.alpha); g.scale(HS, HS);
    tekenHoofd(g, kd, U);
    g.restore();
    if (kd.staat === 'juich') { g.save(); g.translate(p.hipX, p.hipY); g.scale(d, 1); g.rotate(-kd.beta); tekenArm(g, kd, U, true); g.restore(); }
    g.restore();
  }
  // de nek loopt van de kraag (lijf-vlak) tot onder de kaak (hoofd-vlak), dus hij buigt mee als je omhoog kijkt
  function tekenNek(g, kd, U) {
    const p = kd.p, d = kd.dir, cb = Math.cos(kd.beta), sb = Math.sin(kd.beta);
    const lijf = (x, y) => [p.hipX + d * (x * cb + y * sb), p.hipY - x * sb + y * cb];
    const a0 = lijf(-2.0, 38.6), a1 = lijf(6.0, 37.8);
    const b0 = naarWereldH(kd, -4.2, -5.2), b1 = naarWereldH(kd, 4.6, -7.2);
    g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.lineTo(a1[0], a1[1]); g.closePath();
    const gr = g.createLinearGradient(b1[0], b1[1], (a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2);
    gr.addColorStop(0, U.k.huid.dd); gr.addColorStop(0.35, U.k.huid.d); gr.addColorStop(1, U.k.huid.m);
    g.fillStyle = gr; g.fill();
  }
  function knie(h, a, l1, l2, d) {
    let dx = a[0] - h[0], dy = a[1] - h[1], dist = Math.hypot(dx, dy);
    dist = Math.min(dist, l1 + l2 - 0.01);
    dx /= dist || 1; dy /= dist || 1;
    const c = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), s = Math.sqrt(Math.max(0, 1 - c * c));
    let nx = -dy, ny = dx;
    if (nx * d < 0) { nx = -nx; ny = -ny; }
    return [h[0] + dx * l1 * c + nx * l1 * s, h[1] + dy * l1 * c + ny * l1 * s];
  }
  function tekenBenen(g, kd, U) {
    const d = kd.dir, p = kd.p, K = U.k;
    const lucht = kd.staat === 'lucht' || kd.z > 0.4;
    const heupen = [[p.hipX - d * 1.6, p.hipY - 2], [p.hipX + d * 0.8, p.hipY - 2]];
    const opGrond = (i) => [kd.fx + d * (i ? 2.6 : -2.2) + Math.sin(kd.stap * 0.5 + i * Math.PI) * 1.2 * (Math.abs(kd.fxDoel - kd.fx) > 0.05 ? 1 : 0), 7.5];
    const enkels = [0, 1].map((i) => (lucht ? [heupen[i][0] + d * (i ? 2.5 : -0.5), heupen[i][1] - 52] : opGrond(i)));
    [0, 1].forEach((i) => {
      const h = heupen[i], a = enkels[i], kn = knie(h, a, 28.7, 27.9, d);
      const ver = i === 0, jurk = U.kleed === 'jurk';
      // broek (of kousen onder de rok): dij breder dan de kuit, en een knie ertussen
      const kleur = jurk ? (ver ? '#1E1C22' : '#2E2C34') : (ver ? K.kleur2.d : K.kleur2.m);
      g.strokeStyle = kleur;
      g.lineWidth = jurk ? 7.4 : 9.8;
      g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(kn[0], kn[1]); g.stroke();
      g.lineWidth = jurk ? 5.8 : 7.8;
      g.beginPath(); g.moveTo(kn[0], kn[1]); g.lineTo(a[0], a[1] + 1.5); g.stroke();
      if (!ver) { g.strokeStyle = 'rgba(255, 244, 226, .1)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(h[0] - d * 2.4, h[1] - 2); g.lineTo(kn[0] - d * 2.2, kn[1]); g.stroke(); }
      klomp(g, a, d, ver);
    });
  }
  function klomp(g, a, d, ver) {
    g.save(); g.translate(a[0], a[1] - 7.5); g.scale(d * 0.88, 0.88);
    g.beginPath();
    g.moveTo(-7.2, 1.2); g.bezierCurveTo(-7.6, 5.2, -5.6, 8.6, -2.2, 8.4);
    g.bezierCurveTo(2.4, 8.4, 6.4, 6.4, 11.6, 4.6);
    g.bezierCurveTo(14.4, 3.8, 15.4, 2.6, 14.6, 1.4);
    g.bezierCurveTo(10.6, -0.2, -3.4, -0.4, -7.2, 1.2); g.closePath();
    const gr = g.createLinearGradient(0, 8.6, 0, 0);
    gr.addColorStop(0, ver ? '#C8A262' : '#EBCF94'); gr.addColorStop(1, ver ? '#8E6E3E' : '#B08A50');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(70, 46, 20, .55)'; g.lineWidth = 0.25; g.stroke();
    g.fillStyle = 'rgba(40, 24, 8, .65)'; g.beginPath(); g.ellipse(-2.6, 7.8, 3.6, 1.0, 0.05, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // het lijf in het lijf-vlak: oorsprong in de heup, x naar voren, y omhoog
  function tekenLijf(g, kd, U) {
    const K = U.k, d = kd.dir;
    const lx = -10 * d;
    const vul = (t, x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, t.l); gr.addColorStop(0.5, t.m); gr.addColorStop(1, t.d); return gr; };
    if (U.kleed === 'jurk') {
      // rok met schort
      g.beginPath();
      g.moveTo(-8.0, 8.5); g.bezierCurveTo(-10.6, 0, -12.6, -12, -12.6, -21.5);
      g.quadraticCurveTo(0, -24.4, 12.4, -21.0);
      g.bezierCurveTo(12.0, -12, 10.4, 0, 8.4, 8.5); g.closePath();
      g.fillStyle = vul(K.kleur, lx, 8, -lx, -22); g.fill();
      g.strokeStyle = 'rgba(20, 14, 10, .22)'; g.lineWidth = 0.22;
      [[-6, -2], [-2, -3], [3, -3], [7, -1]].forEach(([x, s]) => { g.beginPath(); g.moveTo(x * 0.8, 6); g.quadraticCurveTo(x * 1.1, -8, x * 1.4 + s * 0.2, -21.5); g.stroke(); });
      g.beginPath(); g.moveTo(3.2, 8.2); g.bezierCurveTo(6.6, 0, 11.6, -10, 11.8, -20.2); g.quadraticCurveTo(8.4, -21.6, 5.6, -21.2); g.bezierCurveTo(5.0, -10, 3.0, 0, 1.2, 8.2); g.closePath();
      g.fillStyle = U.schort; g.fill(); g.strokeStyle = 'rgba(120, 100, 70, .35)'; g.stroke();
    }
    // het bovenlijf (kiel tot over de heup, of het lijfje van de jurk)
    g.beginPath();
    if (U.kleed === 'kiel') {
      g.moveTo(-8.0, -9.2); g.bezierCurveTo(-9.8, 2, -10.0, 18, -8.8, 30);
      g.bezierCurveTo(-7.9, 36.2, -5.0, 40.6, -1.4, 41.4);
      g.bezierCurveTo(1.2, 41.8, 3.8, 41.0, 5.4, 39.0);
      g.bezierCurveTo(7.8, 35.6, 9.2, 28, 9.4, 18);
      g.bezierCurveTo(9.6, 8, 9.2, -2, 8.6, -9.2);
      g.quadraticCurveTo(0.2, -10.8, -8.0, -9.2);
    } else {
      g.moveTo(-7.2, 7.8); g.bezierCurveTo(-8.8, 16, -9.4, 26, -8.4, 30.5);
      g.bezierCurveTo(-7.6, 36.2, -4.8, 40.6, -1.4, 41.4);
      g.bezierCurveTo(1.2, 41.8, 3.8, 41.0, 5.4, 39.0);
      g.bezierCurveTo(7.6, 35.6, 8.6, 30, 8.4, 24);
      g.bezierCurveTo(8.2, 18, 7.6, 12, 7.8, 7.8);
      g.quadraticCurveTo(0.2, 6.4, -7.2, 7.8);
    }
    g.closePath();
    g.fillStyle = vul(K.kleur, lx, 38, -lx, -8); g.fill();
    g.strokeStyle = 'rgba(20, 14, 10, .3)'; g.lineWidth = 0.22; g.stroke();
    // plooien
    g.strokeStyle = 'rgba(20, 14, 10, .16)'; g.lineWidth = 0.3;
    if (U.kleed === 'kiel') {
      [[-4.6, 30, -5.4, -8], [0.6, 33, 0.8, -9], [5.2, 31, 6.0, -8.4]].forEach(([x0, y0, x1, y1]) => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.8, (y0 + y1) / 2, x1, y1); g.stroke(); });
      g.beginPath(); g.moveTo(-8.6, 29.6); g.quadraticCurveTo(0, 32.2, 8.0, 31.0); g.stroke();
      g.setLineDash([0.5, 0.45]); g.strokeStyle = 'rgba(255, 246, 228, .35)'; g.lineWidth = 0.16;
      g.beginPath(); g.moveTo(-8.4, 28.9); g.quadraticCurveTo(0, 31.5, 8.1, 30.3); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(250, 240, 220, .8)'; [35.4, 32.6].forEach((y) => { g.beginPath(); g.arc(6.9 - (35.4 - y) * 0.12, y, 0.42, 0, Math.PI * 2); g.fill(); });
      g.strokeStyle = 'rgba(20, 14, 10, .2)'; g.lineWidth = 0.22;
      g.beginPath(); g.moveTo(3.2, 8.4); g.lineTo(3.4, 3.2); g.quadraticCurveTo(5.6, 2.4, 7.8, 3.2); g.lineTo(8.2, 8.6); g.stroke();
    } else {
      g.beginPath(); g.moveTo(-7.4, 8.6); g.quadraticCurveTo(0, 7.2, 7.8, 8.6); g.lineWidth = 0.9; g.strokeStyle = K.kleur.d; g.stroke();
    }
    // kraag of halsdoek
    if (U.kraag) {
      g.beginPath(); g.moveTo(-2.6, 40.6); g.quadraticCurveTo(1.6, 41.8, 5.8, 38.4); g.quadraticCurveTo(5.0, 36.0, 2.0, 36.4); g.quadraticCurveTo(-1.0, 37.4, -2.6, 40.6); g.closePath();
      g.fillStyle = U.kraag; g.fill(); g.strokeStyle = 'rgba(120, 110, 90, .4)'; g.lineWidth = 0.15; g.stroke();
    }
    if (U.das) {
      g.beginPath(); g.moveTo(1.6, 40.6); g.quadraticCurveTo(4.4, 40.4, 6.0, 38.0); g.lineTo(7.6, 33.0); g.lineTo(5.4, 34.6); g.lineTo(4.0, 33.4); g.quadraticCurveTo(3.0, 37.6, 1.6, 40.6); g.closePath();
      g.fillStyle = U.das; g.fill(); g.strokeStyle = 'rgba(40, 20, 10, .3)'; g.lineWidth = 0.15; g.stroke();
    }
  }
  function tekenArm(g, kd, U, voor) {
    const K = U.k, kleur = U.kleed === 'jurk' || U.kleed === 'kiel' ? K.kleur : K.kleur;
    let sch = [-1.4, 35.4], elb, pols;
    if (kd.staat === 'juich') {
      const zw = Math.sin(kd.tl * 9 + (voor ? 0 : 1.4)) * 0.3;
      elb = [voor ? 3.4 : 0.6, 50.5 + 2 * zw]; pols = [(voor ? 6.4 : 3.0) + 3.2 * zw, 63.5];
    } else if (voor) { elb = [-6.6, 20.6]; pols = [-10.2, 13.6]; }
    else { elb = [-5.4, 21.4]; pols = [-8.8, 14.2]; }
    g.strokeStyle = voor ? kleur.m : kleur.dd;
    g.lineWidth = 6.6;
    g.beginPath(); g.moveTo(sch[0], sch[1]); g.lineTo(elb[0], elb[1]); g.stroke();
    g.lineWidth = 5.6;
    g.beginPath(); g.moveTo(elb[0], elb[1]); g.lineTo(pols[0], pols[1]); g.stroke();
    if (voor) {
      g.strokeStyle = 'rgba(255, 244, 226, .18)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(sch[0] - 1.2, sch[1] - 1); g.lineTo(elb[0] - 1.4, elb[1]); g.stroke();
      g.strokeStyle = 'rgba(20, 12, 6, .22)'; g.lineWidth = 0.25;
      g.beginPath(); g.moveTo(elb[0] + 1.4, elb[1] + 1.6); g.quadraticCurveTo(elb[0], elb[1] - 0.6, elb[0] - 1.8, elb[1] + 0.4); g.stroke();
    }
    // de hand
    const ang = Math.atan2(pols[1] - elb[1], pols[0] - elb[0]);
    const hx = pols[0] + Math.cos(ang) * 1.4, hy = pols[1] + Math.sin(ang) * 1.4;
    g.fillStyle = voor ? K.huid.m : K.huid.d;
    g.beginPath(); g.ellipse(hx, hy, 2.7, 2.0, ang, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(120, 60, 30, .3)'; g.lineWidth = 0.15; g.stroke();
  }

  // ---------- het hoofd, in het hoofd-vlak: oorsprong midden in het hoofd, x naar voren, y omhoog ----------
  function tekenHoofd(g, kd, U) {
    const K = U.k, d = kd.dir, j = kd.jaw;
    const J = (x, y) => kaak(x, y, j);
    // licht van linksboven in de wereld: in het hoofd-vlak is dat achter (bij d = 1) of voor (bij d = -1)
    const lx = -6 * d;
    achterHaar(g, kd, U);
    // de mondholte, als de mond open is
    if (j > 0.06) {
      const a = J(8.8, -4.2), b = J(9.9, -4.9);
      g.beginPath(); g.moveTo(10.2, -3.55); g.lineTo(8.5, -4.0); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(10.6, -4.1); g.closePath();
      g.fillStyle = '#4A1610'; g.fill();
      g.fillStyle = '#FBF6EC'; g.beginPath(); g.moveTo(8.9, -3.62); g.lineTo(10.0, -3.6); g.lineTo(9.9, -3.98); g.lineTo(9.0, -3.98); g.closePath(); g.fill();
      const t = J(9.0, -4.7); g.fillStyle = '#C8605A'; g.beginPath(); g.ellipse(t[0], t[1], 0.75, 0.35, -0.2, 0, Math.PI * 2); g.fill();
    }
    // het gezicht en de schedel
    g.beginPath();
    g.moveTo(-4.6, -7.2);
    g.bezierCurveTo(-8.6, -5.6, -9.8, -1.2, -9.5, 2.4);
    g.bezierCurveTo(-9.1, 7.2, -4.6, 9.9, 0.6, 9.8);
    g.bezierCurveTo(5.0, 9.7, 8.0, 7.0, 8.3, 3.8);
    g.bezierCurveTo(8.4, 2.6, 8.1, 1.6, 8.6, 0.8);
    g.bezierCurveTo(9.4, -0.2, 10.5, -1.0, 10.9, -1.6);
    g.bezierCurveTo(11.1, -2.1, 10.6, -2.6, 9.7, -2.55);
    g.bezierCurveTo(9.8, -2.9, 10.25, -3.1, 10.2, -3.55);
    g.bezierCurveTo(10.0, -3.85, 9.4, -3.95, 8.9, -4.05);
    const pad = [[8.9, -4.15], [[9.6, -4.2], [10.0, -4.6], [9.8, -5.2]], [[9.6, -5.6], [9.3, -5.8], [9.5, -6.4]], [[9.7, -7.4], [8.8, -8.6], [7.2, -8.9]], [[5.2, -9.2], [3.4, -8.8], [2.2, -8.0]]];
    const p0 = J(pad[0][0], pad[0][1]); g.lineTo(p0[0], p0[1]);
    for (let i = 1; i < pad.length; i++) { const [c1, c2, e] = pad[i].map((q) => J(q[0], q[1])); g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]); }
    g.lineTo(1.0, -7.6);
    g.quadraticCurveTo(-1.8, -6.4, -4.6, -7.2);
    g.closePath();
    const gr = g.createRadialGradient(lx * 0.6, 3.2, 1, 0, 0, 12.5);
    gr.addColorStop(0, K.huid.l); gr.addColorStop(0.6, K.huid.m); gr.addColorStop(1, K.huid.d);
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(120, 60, 30, .35)'; g.lineWidth = 0.18; g.stroke();
    // wang (bol als hij kauwt)
    const kauwt = kd.kauw > 0;
    const bol = kauwt ? 0.4 + 0.5 * Math.abs(Math.sin(kd.kauw * 17)) : 0;
    let wg = g.createRadialGradient(5.4, -3.2, 0, 5.4, -3.2, 2.9 + bol);
    wg.addColorStop(0, K.wang); wg.addColorStop(1, 'rgba(232, 128, 110, 0)');
    g.globalAlpha = 0.7; g.fillStyle = wg; g.beginPath(); g.arc(5.4, -3.2, 2.9 + bol, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    if (kauwt) {
      g.fillStyle = K.huid.m; g.beginPath(); g.ellipse(6.6, -3.8, 1.5 + bol * 0.8, 1.3 + bol * 0.5, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(150, 80, 50, .35)'; g.lineWidth = 0.14; g.beginPath(); g.arc(6.6, -3.8, 1.5 + bol * 0.8, -1.2, 1.4); g.stroke();
    }
    if (U.sproet) { g.fillStyle = 'rgba(168, 90, 40, .55)'; [[6.6, -1.0], [7.5, -1.6], [6.0, -1.9], [7.1, -0.4], [5.4, -0.8]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 0.2, 0, Math.PI * 2); g.fill(); }); }
    if (U.meel) { g.fillStyle = 'rgba(255, 255, 255, .7)'; g.beginPath(); g.ellipse(4.6, -2.8, 1.3, 0.8, 0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(9.8, -1.4, 0.6, 0.4, 0, 0, Math.PI * 2); g.fill(); }
    // neusvleugel
    g.strokeStyle = 'rgba(140, 70, 40, .5)'; g.lineWidth = 0.16; g.beginPath(); g.moveTo(9.4, -2.3); g.quadraticCurveTo(9.0, -1.7, 9.7, -1.4); g.stroke();
    // lippen
    g.strokeStyle = 'rgba(170, 70, 60, .7)'; g.lineWidth = 0.22;
    g.beginPath(); g.moveTo(9.0, -4.0); g.quadraticCurveTo(9.7, -3.7, 10.15, -3.6); g.stroke();
    if (j < 0.06) { g.beginPath(); g.moveTo(8.8, -4.12); g.lineTo(9.9, -4.1); g.strokeStyle = 'rgba(110, 40, 30, .55)'; g.stroke(); }
    // het oor
    g.fillStyle = K.huid.d; g.beginPath(); g.ellipse(-1.4, -0.6, 1.55, 2.35, 0.15, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(130, 60, 30, .45)'; g.lineWidth = 0.18; g.beginPath(); g.arc(-1.2, -0.5, 1.0, -1.4, 1.6); g.stroke();
    // het oog
    oog(g, kd, U);
    // kruimels op het gezicht
    g.fillStyle = '#8A4A1E';
    kd.kruimels.forEach((q) => { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[2] * 0.75, q[3], 0, Math.PI * 2); g.fill(); });
    voorHaar(g, kd, U);
  }
  function oog(g, kd, U) {
    const au = kd.au > 0, blij = !au && (kd.blij > 0 || kd.staat === 'juich'), sip = kd.staat === 'sip';
    const lucht = kd.staat === 'lucht';
    const wenkbrauw = lucht ? 0.7 : au ? -0.3 : sip ? 0.2 : 0;
    g.strokeStyle = U.k.haar.d; g.lineWidth = 0.42;
    g.beginPath();
    if (sip) { g.moveTo(4.4, 3.9 + wenkbrauw); g.quadraticCurveTo(5.8, 3.6 + wenkbrauw, 7.0, 3.0 + wenkbrauw); }
    else { g.moveTo(4.4, 3.5 + wenkbrauw); g.quadraticCurveTo(5.8, 4.2 + wenkbrauw, 7.1, 3.7 + wenkbrauw); }
    g.stroke();
    g.strokeStyle = '#3A2214'; g.lineWidth = 0.3;
    if (au) {
      g.beginPath(); g.moveTo(4.8, 2.3); g.lineTo(6.3, 1.7); g.lineTo(4.8, 1.0); g.stroke();
      return;
    }
    if (blij) {
      g.beginPath(); g.moveTo(4.7, 1.5); g.quadraticCurveTo(5.6, 2.6, 6.5, 1.6); g.stroke();
      return;
    }
    // amandelvorm met de iris naar voren-boven (ze kijkt naar de koek)
    const open = sip ? 0.45 : 1;
    g.beginPath(); g.moveTo(4.6, 1.75); g.quadraticCurveTo(5.5, 1.75 + 1.0 * open, 6.5, 1.85); g.quadraticCurveTo(5.6, 1.1, 4.6, 1.75); g.closePath();
    g.fillStyle = '#FBF8F2'; g.fill();
    g.save(); g.clip();
    g.fillStyle = '#4A3020'; g.beginPath(); g.arc(5.95, 2.05, 0.55, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#140A04'; g.beginPath(); g.arc(6.05, 2.1, 0.28, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(5.85, 2.3, 0.13, 0, Math.PI * 2); g.fill();
    g.restore();
    g.beginPath(); g.moveTo(4.5, 1.8); g.quadraticCurveTo(5.5, 1.85 + 1.0 * open, 6.6, 1.9); g.stroke();
    if (U.wimper) { g.lineWidth = 0.18; g.beginPath(); g.moveTo(6.4, 1.95); g.lineTo(7.0, 2.4); g.moveTo(6.0, 2.3); g.lineTo(6.4, 2.85); g.stroke(); }
  }
  function haarVorm(g, U) {
    g.beginPath();
    if (U.kapsel === 'bob') {
      g.moveTo(7.7, 4.0); g.bezierCurveTo(8.4, 8.6, 4.0, 11.4, -1.0, 11.2);
      g.bezierCurveTo(-7.6, 11.0, -11.2, 5.6, -10.8, -0.6);
      g.bezierCurveTo(-10.6, -4.6, -9.6, -7.4, -8.6, -8.2);
      g.lineTo(-5.4, -8.0); g.bezierCurveTo(-4.6, -5.0, -3.4, -2.4, -1.4, -0.8);
      g.bezierCurveTo(0.2, 1.8, 2.6, 3.4, 5.2, 3.5); g.quadraticCurveTo(6.6, 3.5, 7.7, 4.0);
    } else {
      g.moveTo(6.9, 6.2); g.bezierCurveTo(5.0, 10.8, -4.0, 11.6, -8.6, 6.4);
      g.bezierCurveTo(-10.8, 3.6, -10.4, -2.0, -8.6, -4.6);
      g.bezierCurveTo(-7.0, -4.2, -5.5, -2.2, -3.8, -0.4);
      g.bezierCurveTo(-2.4, 1.8, -0.6, 3.0, 1.2, 2.8);
      g.bezierCurveTo(2.2, 3.8, 3.8, 5.8, 6.9, 6.2);
    }
    g.closePath();
  }
  function achterHaar(g, kd, U) {
    const H = U.k.haar;
    if (U.hoed === 'stro') {
      // achterkant van de rand
      g.fillStyle = '#B89450'; g.beginPath(); g.ellipse(-3.2, 6.4, 9.6, 1.0, 0.04, Math.PI * 0.05, Math.PI * 0.95); g.fill();
    }
    if (U.hoed === 'strik') {
      g.fillStyle = U.strik; g.strokeStyle = 'rgba(90, 20, 10, .45)'; g.lineWidth = 0.15;
      g.beginPath(); g.moveTo(-3.6, 10.0); g.lineTo(-7.8, 13.0); g.lineTo(-7.4, 8.4); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-3.6, 10.0); g.lineTo(0.2, 13.4); g.lineTo(0.6, 9.0); g.closePath(); g.fill(); g.stroke();
    }
    void H;
  }
  function voorHaar(g, kd, U) {
    const H = U.k.haar;
    if (U.hoed !== 'hul') {
      haarVorm(g, U);
      const gr = g.createLinearGradient(-6 * kd.dir, 11, 4 * kd.dir, -4);
      gr.addColorStop(0, H.l); gr.addColorStop(0.5, H.m); gr.addColorStop(1, H.d);
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(30, 16, 6, .3)'; g.lineWidth = 0.18; g.stroke();
      g.strokeStyle = 'rgba(30, 16, 6, .25)'; g.lineWidth = 0.2;
      [[-6.6, 6.4, -9.0, 0.4], [-3.2, 9.2, -6.8, 3.4], [1.0, 10.0, -2.0, 6.0], [4.4, 8.8, 2.6, 6.2]].forEach(([a, b, c, e]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 - 1, (b + e) / 2 + 0.5, c, e); g.stroke(); });
    }
    if (U.hoed === 'strik') {
      g.fillStyle = meng(U.strik, '#000', 0.25); g.beginPath(); g.arc(-3.6, 10.0, 0.9, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'pet') {
      g.beginPath();
      g.moveTo(6.8, 6.0); g.bezierCurveTo(6.2, 11.8, -6.4, 12.8, -9.6, 5.8);
      g.bezierCurveTo(-9.9, 4.6, -9.4, 3.4, -8.6, 2.8);
      g.bezierCurveTo(-3.0, 5.2, 2.4, 6.0, 6.8, 6.0); g.closePath();
      const gr = g.createLinearGradient(-8 * kd.dir, 12, 6 * kd.dir, 3);
      gr.addColorStop(0, meng(U.pet, '#fff', 0.2)); gr.addColorStop(1, meng(U.pet, '#000', 0.3));
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(10, 16, 30, .4)'; g.lineWidth = 0.18; g.stroke();
      g.beginPath(); g.moveTo(5.6, 6.6); g.quadraticCurveTo(10.6, 7.0, 12.6, 5.6); g.quadraticCurveTo(9.8, 5.0, 6.0, 5.6); g.closePath();
      g.fillStyle = meng(U.pet, '#000', 0.45); g.fill();
      g.fillStyle = '#B6452C'; g.beginPath(); g.arc(-1.6, 11.6, 0.8, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'stro') {
      // de bol en de rand, met een rood lint
      g.beginPath(); g.moveTo(-6.8, 6.6); g.bezierCurveTo(-7.0, 12.6, -5.0, 13.6, 0.2, 13.6); g.bezierCurveTo(5.4, 13.6, 7.2, 12.4, 7.0, 6.8); g.closePath();
      let gr = g.createLinearGradient(-7 * kd.dir, 13, 7 * kd.dir, 6);
      gr.addColorStop(0, '#F2DCA0'); gr.addColorStop(0.6, '#E0BE76'); gr.addColorStop(1, '#B8944E');
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(120, 90, 40, .35)'; g.lineWidth = 0.12;
      for (let y = 8; y < 13.4; y += 0.9) { g.beginPath(); g.moveTo(-6.6, y); g.lineTo(6.8, y + 0.15); g.stroke(); }
      g.fillStyle = '#B8382A'; g.beginPath(); g.moveTo(-6.9, 6.6); g.lineTo(7.05, 6.8); g.lineTo(7.0, 8.5); g.lineTo(-6.85, 8.3); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-13.0, 6.2); g.quadraticCurveTo(0, 7.4, 13.6, 6.4); g.quadraticCurveTo(14.4, 6.0, 13.6, 5.4); g.quadraticCurveTo(0, 6.4, -12.8, 5.2); g.quadraticCurveTo(-13.6, 5.6, -13.0, 6.2); g.closePath();
      gr = g.createLinearGradient(0, 7.4, 0, 5.2); gr.addColorStop(0, '#E8C987'); gr.addColorStop(1, '#A88444');
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(110, 80, 30, .45)'; g.lineWidth = 0.12; g.stroke();
      // schaduw van de rand op het voorhoofd
      g.fillStyle = 'rgba(80, 40, 10, .12)'; g.beginPath(); g.ellipse(6.4, 4.4, 2.8, 1.2, 0, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'muts') {
      g.beginPath(); g.moveTo(7.2, 5.4); g.bezierCurveTo(7.4, 12.8, -8.2, 13.8, -10.2, 3.4); g.lineTo(-9.8, 1.4); g.bezierCurveTo(-4.0, 3.0, 2.0, 4.4, 7.2, 5.4); g.closePath();
      const gr = g.createLinearGradient(-8 * kd.dir, 12, 6 * kd.dir, 3);
      gr.addColorStop(0, meng(U.muts, '#fff', 0.2)); gr.addColorStop(1, meng(U.muts, '#000', 0.3));
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(60, 10, 6, .3)'; g.lineWidth = 0.2;
      for (let i = -8; i <= 6; i += 1.6) { g.beginPath(); g.moveTo(i, 2.6 + (i + 10) * 0.18); g.lineTo(i * 0.6, 11.4); g.stroke(); }
      g.beginPath(); g.moveTo(7.4, 5.4); g.bezierCurveTo(2.0, 4.0, -4.0, 2.6, -10.0, 1.2); g.lineTo(-10.1, 3.8); g.bezierCurveTo(-4.0, 5.0, 2.0, 6.6, 7.5, 7.6); g.closePath();
      g.fillStyle = meng(U.muts, '#000', 0.25); g.fill();
      g.fillStyle = '#F2E6D0'; g.beginPath(); g.arc(-3.0, 13.2, 2.1, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(160, 140, 110, .5)'; g.beginPath(); g.arc(-2.4, 12.6, 1.2, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'hul') {
      // een wit mutsje met een kanten randje, en een streepje donker haar ervoor
      g.fillStyle = U.k.haar.m; g.beginPath(); g.moveTo(6.8, 6.4); g.quadraticCurveTo(5.2, 8.8, 1.4, 9.6); g.lineTo(2.0, 8.0); g.quadraticCurveTo(4.6, 7.6, 6.4, 5.4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(6.2, 7.4); g.bezierCurveTo(5.2, 11.8, -5.4, 12.8, -9.6, 6.6); g.bezierCurveTo(-11.6, 3.2, -11.2, -3.6, -8.6, -6.6);
      g.lineTo(-6.4, -5.8); g.bezierCurveTo(-7.4, -2.4, -6.8, 1.6, -4.6, 4.0); g.bezierCurveTo(-1.6, 7.2, 2.6, 8.4, 6.2, 7.4); g.closePath();
      const gr = g.createLinearGradient(-9 * kd.dir, 11, 5 * kd.dir, 0);
      gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.7, '#F1EEE6'); gr.addColorStop(1, '#CFC8B8');
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(150, 140, 120, .55)'; g.lineWidth = 0.18; g.stroke();
      g.setLineDash([0.3, 0.35]); g.strokeStyle = 'rgba(170, 160, 140, .8)'; g.lineWidth = 0.3;
      g.beginPath(); g.moveTo(6.6, 7.6); g.bezierCurveTo(2.6, 8.9, -1.8, 7.6, -4.9, 4.3); g.stroke(); g.setLineDash([]);
      const kin = kaak(4.0, -8.8, kd.jaw);
      g.strokeStyle = 'rgba(250, 248, 240, .9)'; g.lineWidth = 0.32; g.beginPath(); g.moveTo(-2.6, -3.0); g.quadraticCurveTo(0.2, -6.6, kin[0], kin[1]); g.stroke();
    } else if (U.hoed === 'bakker') {
      g.beginPath(); g.moveTo(6.6, 5.8); g.bezierCurveTo(7.8, 14.8, -4.2, 17.8, -11.6, 11.8); g.bezierCurveTo(-14.0, 9.6, -11.8, 5.2, -9.2, 4.2); g.bezierCurveTo(-4.0, 5.8, 1.8, 6.4, 6.6, 5.8); g.closePath();
      const gr = g.createLinearGradient(-10 * kd.dir, 15, 6 * kd.dir, 4);
      gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.65, '#F0ECE2'); gr.addColorStop(1, '#C9C2B2');
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(150, 140, 120, .5)'; g.lineWidth = 0.18; g.stroke();
      g.strokeStyle = 'rgba(160, 150, 130, .45)'; g.lineWidth = 0.22;
      [[-6, 14.4, -8.4, 7.4], [-1.6, 15.4, -3.4, 6.8], [2.8, 13.6, 1.6, 7.0]].forEach(([a, b, c, e]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 1, (b + e) / 2, c, e); g.stroke(); });
      g.beginPath(); g.moveTo(6.8, 5.4); g.bezierCurveTo(1.8, 6.0, -4.0, 5.4, -9.4, 3.6); g.lineTo(-9.0, 6.0); g.bezierCurveTo(-4.0, 7.6, 1.8, 8.2, 6.8, 7.6); g.closePath();
      g.fillStyle = '#E6E0D2'; g.fill(); g.strokeStyle = 'rgba(150, 140, 120, .5)'; g.stroke();
    }
  }

  // ---------- kruimels en stofjes ----------
  function kruimels(x, y, n, kracht, dir) {
    if (rustig()) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      deeltjes.push({ x: x + (Math.random() - 0.5) * 1.6, y: y + (Math.random() - 0.5) * 1.2, vx: (Math.random() - 0.5) * 40 * kracht - dir * 8, vy: Math.random() * 30 * kracht, r: 0.12 + Math.random() * 0.26, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 20, kleur: Math.random() < 0.3 ? '#5E2E12' : Math.random() < 0.6 ? '#A4602C' : '#C88A4A', leef: 2.5 });
    }
  }
  function stapDeeltjes(dt) {
    deeltjes.forEach((q) => { q.vy -= 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; q.leef -= dt; });
    deeltjes = deeltjes.filter((q) => q.leef > 0 && q.y > TOP - L / S - 4);
  }
  function tekenDeeltjes(g) {
    if (!deeltjes.length) return;
    g.save(); wereldVlak(g);
    deeltjes.forEach((q) => {
      g.save(); g.translate(q.x, q.y); g.rotate(q.rot);
      g.fillStyle = q.kleur; g.beginPath(); g.moveTo(-q.r, -q.r * 0.6); g.lineTo(q.r * 0.8, -q.r * 0.8); g.lineTo(q.r, q.r * 0.5); g.lineTo(-q.r * 0.4, q.r); g.closePath(); g.fill();
      g.restore();
    });
    g.restore();
  }
  // hoe hoog je komt als je nu loslaat (alleen voor mensen, tijdens het laden)
  function tekenGeest(g) {
    if (!SPRONGEN) maakSprongen();
    W.kinderen.forEach((kd) => {
      if (!kd.mens || kd.staat !== 'laden') return;
      const tc = kd.laad;
      let i = 0; while (i < LAADTIJDEN.length - 1 && LAADTIJDEN[i + 1] < tc) i++;
      const a = SPRONGEN[i].top, b = SPRONGEN[Math.min(i + 1, LAADTIJDEN.length - 1)].top;
      const t = i < LAADTIJDEN.length - 1 ? klem((tc - LAADTIJDEN[i]) / (LAADTIJDEN[i + 1] - LAADTIJDEN[i]), 0, 1) : 1;
      const mx = kd.fx + kd.dir * (a[0] + (b[0] - a[0]) * t), my = a[1] + (b[1] - a[1]) * t;
      const nuM = naarWereldH(kd, MOND[0], MOND[1]);
      g.save(); wereldVlak(g);
      g.strokeStyle = 'rgba(255, 250, 235, .55)'; g.lineWidth = 0.22; g.setLineDash([0.5, 0.7]);
      g.beginPath(); g.moveTo(nuM[0] + kd.dir * 1.6, nuM[1]); g.lineTo(mx + kd.dir * 1.6, my); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255, 250, 235, .9)'; g.lineWidth = 0.4;
      g.beginPath(); g.moveTo(mx + kd.dir * 0.4, my + 1.0); g.quadraticCurveTo(mx + kd.dir * 2.4, my, mx + kd.dir * 0.4, my - 1.0); g.stroke();
      g.fillStyle = 'rgba(255, 250, 235, .9)'; g.beginPath(); g.arc(mx + kd.dir * 1.6, my, 0.32, 0, Math.PI * 2); g.fill();
      g.restore();
    });
  }

  // ============================================================
  // DE LUS: natuurkunde met vaste stapjes, en tekenen
  // ============================================================
  function lus(t) {
    raf = requestAnimationFrame(lus);
    const dt = vorigeT ? Math.min(0.05, (t - vorigeT) / 1000) : 0;
    vorigeT = t;
    if (W && !bevroren) {
      rest += dt;
      let n = 0;
      while (rest >= DT && n < 12) { stapWereld(W, DT); rest -= DT; n++; }
    }
    stapDeeltjes(dt);
    if (W) werkStandBij();
    teken();
  }

  // ============================================================
  // HET SPELVERLOOP
  // ============================================================
  function nieuwePartij() {
    spelId++;
    if (tegen) spelers = [{ naam: 'Jij', mens: true, look: 'jij' }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, look: tegen.id }];
    else spelers = [{ naam: 'Speler 1', mens: true, look: 'jij' }, { naam: 'Speler 2', mens: true, look: 'twee' }];
    wins = [0, 0]; ronde = 0; winnaar = -1; herstart = null;
    potjes++;
    ui.uitslag.hidden = true;
    if (tegen) setTimeout(() => zeg(1, 'start'), 500);
    meld(tegen ? `Nieuwe partij tegen ${tegen.naam}.` : 'Nieuwe partij met z\'n tweeën.');
    nieuweRonde();
  }
  const LIVE = {
    sprong(kd, c) { Geluid.woesj(); if (kd.mens && window.Tril) Tril.tik(); void c; },
    land() { Geluid.stap(); },
    klap(kd) { if (Geluid.klap) Geluid.klap(); if (kd.mens && !kd.hapt) pop(naarWereldH(kd, MOND[0] + 2, MOND[1]), 'mis', 'zacht'); },
    hap(kd, kk, n, p, klaar, maat) {
      if (Geluid.hap) Geluid.hap(); else Geluid.pak();
      kruimels(p[0], p[1], 6 + Math.round(n / 3), 1, kd.dir);
      if (kd.kruimels.length < 7) kd.kruimels.push([8.6 + Math.random() * 1.6, -5.6 - Math.random() * 2.0, 0.2 + Math.random() * 0.14, Math.random() * 3]);
      if (kd.mens && window.Tril) Tril.klik();
      pop(p, klaar ? 'Op!' : maat > 0.85 ? 'Hap!' : 'hapje', klaar ? '' : maat > 0.85 ? 'hap' : 'zacht');
      if (kk.brokje) { kruimels(p[0], p[1] - 2, 8, 0.6, -kd.dir); kk.brokje = 0; }
      if (!kd.mens && !klaar && Math.random() < 0.35) zeg(kd.k, 'hap');
      bewaar();
      if (klaar) rondeKlaar(kd.k);
    },
    bots(kd, kk, p) {
      if (Geluid.boing) Geluid.boing(); else Geluid.stuit(0.4);
      if (kd.mens && window.Tril) Tril.bots(0.7);
      if (kd.kruimels.length < 7 && Math.random() < 0.5) kd.kruimels.push([7.6 + Math.random() * 2.4, -1.0 - Math.random() * 3.0, 0.18 + Math.random() * 0.12, Math.random() * 3]);
      kruimels(p[0], p[1], 3, 0.5, kd.dir);
      if (kd.mens) pop(p, 'Au!', 'fout');
      else if (Math.random() < 0.4) zeg(kd.k, 'bots');
    }
  };
  function nieuweRonde(bewaard) {
    const r = zaad(Math.floor(Math.random() * 1e9));
    W = maakWereld(r, tegen ? 0.22 + tegen.niveau * 0.05 : 0.32);
    W.cb = LIVE;
    W.kinderen = [0, 1].map((k) => maakKind(k, spelers[k].look, spelers[k].mens, spelers[k].mens ? null : spelers[k].t));
    if (bewaard) {
      W.koeken.forEach((kk, i) => { (bewaard[i] || []).forEach((b) => speelHapNa(kk, b)); });
      W.kinderen.forEach((kd, i) => { const kk = W.koeken[i]; kd.fx = kd.fxDoel = rustVoet(kd, kk); kd.happen = kk.beten.length; pose(kd); });
    }
    deeltjes = []; vingers.clear(); bevroren = false;
    werkRondeBij();
    werkKaartenBij();
    bewaar();
    aftellen(false);
  }
  // een bewaarde hap opnieuw uit de koek nemen (in koek-maten, zonder slinger)
  function speelHapNa(kk, b) {
    const [u0, v0] = b, R = b[2] || HAP_R;
    for (let i = 0; i < N; i++) {
      if (kk.weg[i]) continue;
      const u = kk.pt[i * 2], v = kk.pt[i * 2 + 1];
      if ((u - GAT[0]) ** 2 + (v - GAT[1]) ** 2 < 0.64) continue;
      if ((u - u0) ** 2 + (v - v0) ** 2 <= R * R) kk.weg[i] = 1;
    }
    kk.beten.push([u0, v0, R]);
    losseBrokken(kk); kk.brokje = 0;
    telRest(kk);
    werkRandBij(kk); kk.versie++;
  }
  function aftellen(verder) {
    const id = ++spelId;
    fase = 'aftellen';
    if (W) W.actief = false;
    const tel = (tekst, groot) => {
      if (!ui.tel) return;
      ui.tel.innerHTML = `<b class="${groot ? 'groot' : ''}"></b>`;
      ui.tel.querySelector('b').textContent = tekst;
      ui.tel.classList.remove('in'); void ui.tel.offsetWidth; ui.tel.classList.add('in');
    };
    const stappen = verder ? [] : ['3', '2', '1'];
    const duur = rustig() ? 350 : 620;
    let i = 0;
    const volgende = () => {
      if (id !== spelId) return;
      if (i < stappen.length) { tel(stappen[i], true); if (Geluid.tel) Geluid.tel(); else Geluid.tik(); i++; setTimeout(volgende, duur); return; }
      tel(verder ? 'Verder!' : 'Happen maar!', false);
      if (Geluid.start) Geluid.start(); else Geluid.fluit();
      fase = 'spel';
      if (W) W.actief = true;
      werkKaartenBij();
      setTimeout(() => { if (ui.tel && fase === 'spel') ui.tel.innerHTML = ''; }, 900);
    };
    setTimeout(volgende, verder ? 200 : (rustig() ? 200 : 700));
  }
  function rondeKlaar(k) {
    if (fase !== 'spel') return;
    fase = 'tussen';
    W.actief = false;
    wins[k]++;
    const kd = W.kinderen[k], ander = W.kinderen[1 - k];
    const naar = (x, st) => { x.wil = false; x.plan = null; if (x.staat === 'lucht') x.naLanden = st; else { x.staat = st; x.tl = 0; } };
    naar(kd, 'juich'); naar(ander, 'sip');
    vingers.clear();
    const id = ++spelId;
    werkKaartenBij();
    if (!rustig()) vonken(18);
    Geluid.munt();
    const klaar = wins[k] >= nodig();
    if (!klaar) {
      banier(spelers[k] && spelers[k].naam === 'Jij' ? 'Jij hebt de koek op!' : `${naamVan(k)} heeft de koek op!`, `${wins[0]} tegen ${wins[1]}`);
      if (spelers[k].t) zeg(k, 'wint');
      bewaar();
      setTimeout(() => { if (id === spelId) { ronde++; nieuweRonde(); } }, rustig() ? 900 : 2600);
    } else {
      setTimeout(() => { if (id === spelId) einde(k); }, rustig() ? 300 : 1100);
    }
  }
  function werkRondeBij() {
    if (!ui.ronde) return;
    ui.ronde.innerHTML = aantal === 1 ? '<b>Eén koek</b>' : `<b>Koek ${ronde + 1}</b><span>wie er twee op heeft, wint</span>`;
  }
  function einde(w) {
    fase = 'klaar'; winnaar = w;
    werkKaartenBij();
    wis();
    const t0 = wins[0], t1 = wins[1];
    let bedrag, tekst, verder = null, gewonnenSpel = false;
    if (!tegen) {
      bedrag = 20; gewonnenSpel = true; tekst = `${naamVan(w)} wint met ${Math.max(t0, t1)} tegen ${Math.min(t0, t1)}!`;
      banier(`${naamVan(w)} wint!`, `${t0} tegen ${t1}`);
      Geluid.tada(); vonken(30);
    } else if (w === 0) {
      const telling = gewonnen(), eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('kh-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true; tekst = `Gewonnen van ${tegen.naam}: ${t0} tegen ${t1}!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} is vrij!`;
        verder = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('kh-tegen', volgende.id); nieuwePartij(); } };
      }
      banier('Gewonnen!', `${t0} tegen ${t1}`);
      Geluid.tada(); vonken(40);
      if (window.Tril) Tril.succes();
      zeg(1, 'verliest');
    } else {
      bedrag = 10; tekst = `${tegen.naam} won met ${t1} tegen ${t0}. Goed geprobeerd!`;
      banier(`${tegen.naam} wint`, `${t1} tegen ${t0}`);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'koekhappen', bedrag, gewonnen: gewonnenSpel, tekst, verder, wacht: 2400 });
    const id = spelId;
    setTimeout(() => {
      if (fase !== 'klaar' || id !== spelId || !ui.uitslag) return;
      ui.uitslag.innerHTML = `<b>${tegen ? (w === 0 ? 'Gewonnen!' : 'Volgende keer beter') : `${naamVan(w)} wint!`}</b><span>${t0} tegen ${t1}</span><button class="knop kh-weer" type="button">${icoon('opnieuw')}Nog een partij</button>`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.kh-weer').addEventListener('click', () => nieuwePartij());
    }, 2300);
  }

  // ============================================================
  // DRUKKEN EN LOSLATEN (vinger, muis of toetsenbord)
  // ============================================================
  function welkKind(e) {
    if (tegen) return 0;
    const r = doek.getBoundingClientRect();
    return e.clientX - r.left < r.width / 2 ? 0 : 1;
  }
  function neer(e) {
    if (!W || lesOpen() || fase === 'klaar') return;
    e.preventDefault();
    const k = welkKind(e);
    if (!mens(k)) return;
    try { doek.setPointerCapture(e.pointerId); } catch (er) { /* */ }
    vingers.set(e.pointerId, k);
    W.kinderen[k].wil = true;
    if (window.Tril) Tril.tik();
  }
  function los(e) {
    if (!vingers.has(e.pointerId)) return;
    const k = vingers.get(e.pointerId);
    vingers.delete(e.pointerId);
    if (W && ![...vingers.values()].includes(k)) W.kinderen[k].wil = false;
  }
  const LINKS_TOETSEN = ['a', 'q', 's', 'w', 'z', ' '], RECHTS_TOETSEN = ['l', 'k', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  function toets(e, omlaag) {
    if (location.hash !== '#koekhappen' || !W || lesOpen() || (ui.menu && !ui.menu.hidden)) return;
    const a = document.activeElement;
    if (a && a !== document.body && a !== doek) return;
    const t = (e.key || '').toLowerCase();
    let k = -1;
    if (tegen) { if ([' ', 'enter', 'arrowup', 'arrowdown'].includes(t)) k = 0; }
    else if (LINKS_TOETSEN.includes(t)) k = 0;
    else if (RECHTS_TOETSEN.includes(t)) k = 1;
    if (k < 0) return;
    e.preventDefault();
    if (e.repeat) return;
    if (omlaag && fase === 'klaar') return;
    W.kinderen[k].wil = omlaag;
  }

  // ============================================================
  // DE KAARTEN, PRAATJES EN BERICHTEN
  // ============================================================
  let standSleutel = '';
  function werkStandBij() {
    if (!ui.kaart || !spelers.length) return;
    const sl = W.koeken.map((kk) => Math.round(kk.deel * 20)).join(',') + '|' + W.kinderen.map((kd) => kd.staat + (kd.kauw > 0 ? 'k' : '')).join(',') + '|' + fase;
    if (sl !== standSleutel) { standSleutel = sl; werkKaartenBij(); }
  }
  function werkKaartenBij() {
    if (!ui.kaart || !spelers.length || !W) return;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k], p = spelers[k], kd = W.kinderen[k], kk = W.koeken[k];
      kaart.classList.toggle('aan', fase === 'spel');
      kaart.classList.toggle('kh-winnaar', fase === 'klaar' && winnaar === k);
      const gz = kaart.querySelector('.mo-gezicht'), wie = p.persoon || 'koek' + k;
      if (gz.getAttribute('data-wie') !== wie) { gz.innerHTML = gezichtVan(k); gz.setAttribute('data-wie', wie); }
      kaart.querySelector('.mo-naam').textContent = p.naam;
      const rest = kk ? kk.deel : 1;
      const winst = Array.from({ length: nodig() }, (_, i) => `<svg class="${i < wins[k] ? 'vol' : ''}" aria-hidden="true"><use href="#i-koek"/></svg>`).join('');
      kaart.querySelector('.kh-stand').innerHTML = `<span class="kh-winst" aria-label="${wins[k]} koeken op">${winst}</span><span class="kh-mini" aria-label="nog ${Math.round(rest * 100)} procent koek"><i style="height:${Math.round(Math.max(0, (rest - OP_REST) / (1 - OP_REST)) * 100)}%"></i></span>`;
      const doe = kaart.querySelector('.mo-doe');
      let hint = '';
      if (fase === 'spel' && mens(k)) {
        if (kd.staat === 'laden') hint = '<span>Laat los!</span>';
        else if (kd.kauw > 0) hint = '<span>Kauwen…</span>';
        else if (kd.staat === 'staan' && !kd.happen) hint = `${icoon('veer', 'kh-veer')}<span>Houd vast, laat los</span>`;
      } else if (fase === 'spel' && !mens(k)) hint = kd.kauw > 0 ? '<span>Kauwt…</span>' : '';
      if (doe.getAttribute('data-hint') !== hint) { doe.innerHTML = hint; doe.setAttribute('data-hint', hint); }
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-koek"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', `${tegen ? 'Tegenspeler: ' + tegen.naam : 'Speler 2'}, ${wins[k]} koeken op. Tik om te wisselen`);
      } else kaart.setAttribute('aria-label', `${p.naam}, ${wins[k]} koeken op`);
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
    zeg.t = setTimeout(() => { b.hidden = true; }, soort === 'wint' || soort === 'verliest' ? 4000 : 2200);
  }
  function pop(p, tekst, soort) {
    if (!ui.pops || !doek) return;
    const e = document.createElement('span');
    e.className = 'sj-pop kh-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekst;
    const rv = ui.vak.getBoundingClientRect(), r = doek.getBoundingClientRect();
    e.style.left = klem(r.left - rv.left + X(p[0]) * sc, 40, rv.width - 40) + 'px';
    e.style.top = klem(r.top - rv.top + Y(p[1] + 5) * sc, 24, rv.height - 20) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), 1500);
  }
  function banier(titel, sub) {
    if (!ui.vak) return;
    ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    const b = document.createElement('div');
    b.className = 'sj-banier kh-banier';
    b.innerHTML = '<b></b><span></span>';
    b.querySelector('b').textContent = titel;
    b.querySelector('span').textContent = sub || '';
    ui.vak.appendChild(b);
    setTimeout(() => b.remove(), 2000);
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
  // KEUZEMENU (het spel staat even stil zolang het open is)
  // ============================================================
  function openMenu() {
    onderbreek();
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.lijst.querySelector('.mo-keuze.nu') || ui.lijst.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu(verder) {
    if (!ui.menu || ui.menu.hidden) return;
    ui.menu.hidden = true;
    if (verder) hervat();
  }
  function werkSchakelaars() {
    ui.menu.querySelector('.mo-geluid').setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    ui.menu.querySelector('.mo-muziek').setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
    ui.menu.querySelectorAll('[data-koeken]').forEach((c) => c.classList.toggle('nu', +c.getAttribute('data-koeken') === aantal));
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
      const pips = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-koek"/></svg>`).join('')}</span>`;
      const gezichtje = t === TWEE ? `<span class="mo-twee">${koekGezicht(0)}${koekGezicht(1)}</span>` : (window.Personen ? Personen.gezicht[t.id] : '');
      b.innerHTML = `<span class="mo-gezicht">${gezichtje}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span>
        <span class="mo-keuze-naam">${t.naam}</span>${pips}
        ${t !== TWEE && open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${t.beloning}</span>` : ''}`;
      b.setAttribute('aria-label', t === TWEE ? 'Met z\'n tweeën op dit toestel: ieder een kant van het scherm' : `${t.naam}, niveau ${t.niveau} van 4${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`);
      b.addEventListener('click', () => {
        if (!open) {
          b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
          if (window.Tril) Tril.fout();
          Geluid.pak();
          return;
        }
        tegen = t === TWEE ? null : t;
        if (window.Duiten) Duiten.zetVeld('kh-tegen', t.id);
        sluitMenu(false);
        nieuwePartij();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // BEWAREN: weg en terug, dan hap je verder waar je was
  // ============================================================
  function bewaar() {
    if (!spelers.length || fase === 'klaar' || !W) return;
    try {
      localStorage.setItem(OPSLAG, JSON.stringify({
        tegen: tegen ? tegen.id : 'twee', aantal, ronde, wins: wins.slice(), potjes,
        beten: fase === 'tussen' ? [[], []] : W.koeken.map((kk) => kk.beten.slice())
      }));
    } catch (e) { /* */ }
  }
  function wis() { try { localStorage.removeItem(OPSLAG); } catch (e) { /* */ } }
  function laad() {
    try {
      const o = JSON.parse(localStorage.getItem(OPSLAG) || 'null');
      if (!o || !Array.isArray(o.wins) || o.wins.length !== 2 || !Array.isArray(o.beten) || o.beten.length !== 2) return null;
      if (o.wins.some((x) => typeof x !== 'number' || x < 0 || x > 2)) return null;
      return o;
    } catch (e) { return null; }
  }

  // ============================================================
  // ONDERBREKEN (weg van het scherm, het menu, of Gijs komt uitleggen) EN HERVATTEN
  // ============================================================
  function onderbreek() {
    if (ui.vak) ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    if (!gebouwd || !W || bevroren) return;
    if (fase === 'aftellen' || fase === 'spel') herstart = 'verder';
    else if (fase === 'tussen') herstart = 'ronde';
    spelId++;
    bevroren = true;
    W.actief = false;
    W.kinderen.forEach((kd) => { kd.wil = false; kd.plan = null; if (kd.staat === 'laden') kd.staat = 'staan'; });
    vingers.clear();
    if (ui.tel) ui.tel.innerHTML = '';
    if (fase === 'aftellen' || fase === 'spel') fase = 'pauze';
    bewaar();
  }
  function hervat() {
    if (!gebouwd || lesOpen() || !W || (ui.menu && !ui.menu.hidden)) return;
    bevroren = false;
    const h = herstart; herstart = null;
    if (h === 'ronde') {
      if (wins[0] >= nodig() || wins[1] >= nodig()) einde(wins[0] >= nodig() ? 0 : 1);
      else { ronde++; nieuweRonde(); }
      return;
    }
    if (h === 'verder') aftellen(true);
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function kopieWereld(w) {
    return {
      koeken: w.koeken.map((kk) => Object.assign({}, kk, { pt: kk.pt, weg: kk.weg.slice(), beten: kk.beten.slice(), rand: kk.rand.slice(), beeld: null })),
      kinderen: w.kinderen.map((kd) => Object.assign({}, kd, { kruimels: kd.kruimels.slice(), plan: null, wil: false }))
    };
  }
  function lesDemo(soort) {
    if (!gebouwd || soort === lesSoort || !W) return;
    if (!lesSoort && soort) { onderbreek(); lesBewaard = kopieWereld(W); }
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) { W.koeken = lesBewaard.koeken; W.kinderen = lesBewaard.kinderen; W.kinderen.forEach(pose); lesBewaard = null; }
      return;
    }
    // begin van de les: alles hangt stil, jij staat klaar
    const kd = W.kinderen[0], kk = W.koeken[0];
    kk.th = soort === 'zwaai' ? -0.32 : 0; kk.om = 0; kk.px = kk.py = kk.pvx = kk.pvy = 0; kk.fi = 0; kk.fv = 0;
    Object.assign(kd, { staat: 'staan', z: 0, vz: 0, zak: 0, dx: 0, laad: 0, beta: 0.03, alpha: 0.14, jaw: 0, kauw: 0, au: 0, blij: 0, open: false });
    if (soort === 'laad') Object.assign(kd, { staat: 'laden', laad: 0.38, zak: DIEP * 0.82, z: -DIEP * 0.82, beta: 0.1, alpha: 0.1 });
    if (soort === 'sprong') Object.assign(kd, { staat: 'lucht', z: 6.2, vz: 0, apexT: 0.1, tl: 0.1, tUp: 0.2, open: true, jaw: 1, beta: 0.1, alpha: 0.4, dx: 3.2 });
    pose(kd);
  }
  const vakOm = (x, y, r) => { const d = doek.getBoundingClientRect(); return { left: d.left + (X(x) - r * S) * sc, top: d.top + (Y(y) - r * S) * sc, width: 2 * r * S * sc, height: 2 * r * S * sc }; };
  const scherm = (x, y) => { const d = doek.getBoundingClientRect(); return [d.left + X(x) * sc, d.top + Y(y) * sc]; };
  if (window.Les) {
    Les.zet('koekhappen', () => [
      { doel: () => { lesDemo('kijk'); const st = koekStand(W.koeken[0]); return vakOm(st.ex, st.ey - KH / 2, 7.5); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Dit is jouw koek. Eet hem op zonder handen, vlugger dan de ander' },
      { doel: () => { lesDemo('laad'); const p = W.kinderen[0].p; return vakOm(p.cx - 2, p.cy - 10, 16); }, vorm: 'rond', gebaar: 'tik', tekst: 'Houd je vinger op het veld: je zakt door je knieën. Hoe langer, hoe hoger je springt' },
      { doel: () => { lesDemo('sprong'); const m = naarWereldH(W.kinderen[0], MOND[0], MOND[1]); return vakOm(m[0] + 2, m[1] + 2, 7); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Laat los: je springt met je mond open. Komt de koek ertussen, dan hap je' },
      { doel: () => { lesDemo('zwaai'); const st = koekStand(W.koeken[0]); return vakOm(st.ex - 2, st.ey - KH / 2, 9); }, vorm: 'rond', gebaar: 'wijs', tekst: 'De koek slingert. Raak je hem met je neus, dan schiet hij weg. Spring als hij naar je toe komt' },
      { doel: () => { lesDemo(null); return ui.kaart[0].querySelector('.kh-stand'); }, marge: 8, gebaar: 'wijs', tekst: aantal === 1 ? 'Wie zijn koek het eerst op heeft, wint' : 'Wie het eerst twee koeken op heeft, wint' },
      { doel: () => { lesDemo(null); return ui.meer; }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je tegen wie je speelt, of speel je met z\'n tweeën' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.koekhappen = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaardT = window.Duiten ? Duiten.veld('kh-tegen', 'jantje') : 'jantje';
        const t = TEGENSTANDERS.find((x) => x.id === bewaardT);
        tegen = bewaardT === 'twee' ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
        aantal = window.Duiten ? (+Duiten.veld('kh-koeken', 3) === 1 ? 1 : 3) : 3;
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste) {
          const oud = laad();
          const ot = oud && (oud.tegen === 'twee' ? TWEE : TEGENSTANDERS.find((x) => x.id === oud.tegen));
          if (oud && ot && (ot === TWEE || isOpen(ot))) {
            tegen = ot === TWEE ? null : ot;
            aantal = oud.aantal === 1 ? 1 : 3; ronde = oud.ronde || 0; wins = oud.wins.slice(); potjes = oud.potjes || 1;
            spelers = tegen ? [{ naam: 'Jij', mens: true, look: 'jij' }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, look: tegen.id }]
              : [{ naam: 'Speler 1', mens: true, look: 'jij' }, { naam: 'Speler 2', mens: true, look: 'twee' }];
            if (wins[0] >= nodig() || wins[1] >= nodig()) nieuwePartij();
            else { nieuweRonde(oud.beten); meld(tegen ? `Verder met je partij tegen ${tegen.naam}.` : 'Verder met jullie partij.'); }
          } else nieuwePartij();
        } else {
          werkKaartenBij();
          hervat();
        }
        cancelAnimationFrame(raf);
        vorigeT = 0;
        raf = requestAnimationFrame(lus);
        if (window.Les) Les.eersteKeer('koekhappen');
      });
    },
    stop() {
      cancelAnimationFrame(raf);
      onderbreek();
      if (ui.menu) ui.menu.hidden = true;
    },
    opnieuw() { nieuwePartij(); },
    _toestand() {
      return {
        fase, ronde, aantal, wins: wins.slice(), tegen: tegen ? tegen.id : 'twee', winnaar, L, sc, S, TOP, bevroren,
        koeken: W ? W.koeken.map((kk) => ({ rest: kk.deel, op: kk.op, th: kk.th, beten: kk.beten.length })) : [],
        kinderen: W ? W.kinderen.map((kd) => ({ staat: kd.staat, happen: kd.happen, botsen: kd.botsen, fx: kd.fx, kauw: kd.kauw, wil: kd.wil })) : []
      };
    },
    _scherm(x, y) { return scherm(x, y); },
    _test: {
      zaad(n) { rnd = n === undefined ? Math.random : zaad(n); },
      wereld() { return W; },
      // de computer laten kiezen voor jouw kind (zonder trillen): wanneer springen en hoe lang laden
      tip() { return W ? kiesSprong(W, W.kinderen[0]) : null; },
      druk(k, aan) { if (W) W.kinderen[k || 0].wil = !!aan; },
      intern: { stapWereld, maakWereld, maakKind, kiesSprong, koekStand, naarHoofd, inGezicht, inMond, mondZone, zaad, sprongen: () => SPRONGEN },
      // hele races in stilte, om de niveaus af te stemmen
      sim(idA, idB, n, seed, wind) {
        const zoek = (id) => (typeof id === 'object' ? id : id === 'mens' ? MENS_MODEL : TEGENSTANDERS.find((x) => x.id === id));
        const ai = [zoek(idA), zoek(idB)];
        const r = zaad(seed || 1234);
        const uit = { a: 0, b: 0, tijd: 0, happen: [0, 0], botsen: [0, 0], sprongen: [0, 0], log: {}, maat: 0, nh: 0 };
        for (let s = 0; s < (n || 20); s++) {
          const w = maakWereld(r, wind !== undefined ? wind : 0.25 + (s % 3) * 0.05);
          let klaar = -1;
          w.cb = { sprong(kd) { uit.sprongen[kd.k]++; kd.sprongBots = false; }, land(kd) { if (kd.verwacht) { const v = kd.verwacht.score > 0 ? 'v' : 'n'; const a = kd.hapt ? 'h' : kd.sprongBots ? 'b' : 'm'; uit.log[v + a] = (uit.log[v + a] || 0) + 1; kd.verwacht = null; } }, klap() {}, hap(kd, kk, m, p, op, maat) { uit.maat += maat; uit.nh++; if (op && klaar < 0) klaar = kd.k; }, bots(kd) { kd.sprongBots = true; } };
          w.kinderen = [0, 1].map((k) => maakKind(k, 'jij', false, ai[k]));
          w.actief = true;
          let t = 0;
          while (klaar < 0 && t < 120) { stapWereld(w, DT); t += DT; }
          if (klaar === 0) uit.a++; else if (klaar === 1) uit.b++;
          uit.tijd += t;
          w.kinderen.forEach((kd, i) => { uit.happen[i] += kd.happen; uit.botsen[i] += kd.botsen; });
        }
        const m = n || 20;
        uit.maat = +(uit.maat / Math.max(1, uit.nh)).toFixed(2);
        uit.tijd /= m; uit.happen = uit.happen.map((x) => x / m); uit.botsen = uit.botsen.map((x) => x / m); uit.sprongen = uit.sprongen.map((x) => x / m);
        return uit;
      }
    }
  };
})();
