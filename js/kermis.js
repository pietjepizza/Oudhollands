/* De kermis: een eigen plek aan de gracht, met een draaimolen in het midden. In de draaimolen kun je ringsteken.

   Zo ging het vroeger:
   - de kermis (van 'kerkmis', het feest van de kerkwijding) was het grootste feest van het jaar, met kramen, muziek en spel;
   - ringrijden en ringsteken zijn eeuwenoud: een ruiter steekt in volle vaart met een lans of stok door een hangende ring.
     Op Walcheren werd het vroeger op alle dorpen gehouden, ter gelegenheid van de kermis;
   - het woord carrousel komt van de ringsteektoernooien van de zeventiende eeuw; daarna kwamen er draaimolens met houten
     paarden waarop je kon oefenen, en op de kermis kon je in de draaimolen ringen steken. Wie de meeste ringen ving, won.

   Speelgevoel: je rijdt op een houten paard dat op en neer gaat. Kom je bij de ringengalg, tik dan: je steekt je lans uit.
   Raak je de ring, dan schuift hij op je lans. Een gouden ring telt drie keer. De molen draait steeds harder. */
(function () {
  'use strict';

  // ============================================================
  // MATEN (in meters; de draaimolen staat met zijn midden in de oorsprong, x naar rechts, y omhoog, z naar jou toe)
  // ============================================================
  const B = 400, DT = 1 / 120;
  const PAARDEN = 8, R_PAARD = 3.6, R_VLOER = 4.45, H_VLOER = 0.38;
  const R_KAP = 4.95, H_KAP = 3.62, H_TOP = 6.1, R_ZUIL = 1.15;
  const TH_RING = 0.46, R_RING = 4.3, H_RING = 1.98, R_GALG = 5.35, TH_GALG = 0.62;   // de ringengalg rechts vooraan (de paal iets rechts van de ring)
  const VOOR = 0.2;                     // zo ver steekt de punt van de lans voor de ruiter uit (in hoek)
  const T_UIT = 0.12, T_STEEK = 0.36;   // zo lang duurt het uitsteken, en de hele steek
  const RONDES = 10;
  const ZONE = [0.7, 0.32];             // een tik telt voor de ring vanaf zo lang ervoor tot zo lang erna (s)

  const UITERLIJK = {
    jij: { huid: '#F3CFAE', haar: '#7A4A22', hoed: 'stro', kleed: 'kiel', kleur: '#5D86B4', kleur2: '#3B3A48', voet: 'klomp' },
    twee: { huid: '#EBC3A0', haar: '#3E2A1A', hoed: 'muts', muts: '#B3362A', kleed: 'kiel', kleur: '#7A8656', kleur2: '#3A342E', voet: 'klomp' },
    jantje: { huid: '#F4CDA8', haar: '#C9732E', hoed: 'pet', pet: '#2C4A7C', kleed: 'kiel', kleur: '#B6452C', kleur2: '#2E3242', voet: 'schoen', sproet: true },
    mieke: { huid: '#F8DCC2', haar: '#9A5A2C', hoed: 'strik', strik: '#C8382B', kleed: 'jurk', kleur: '#3F6EA6', kleur2: '#2A2A38', schort: '#EFE6D2', voet: 'schoen' },
    trijntje: { huid: '#F3D1B1', haar: '#5A3820', hoed: 'hul', kleed: 'jurk', kleur: '#4F7A4A', kleur2: '#2A2A28', schort: '#ECE5D6', voet: 'klomp', sproet: true },
    teun: { huid: '#F2CBA6', haar: '#D9A94E', hoed: 'bakker', kleed: 'kiel', kleur: '#EFEAE0', kleur2: '#3A3A44', voet: 'klomp', meel: true },
    // kinderen die alleen een rondje meerijden
    meisje: { huid: '#F6D6BC', haar: '#B5743A', hoed: 'hul', kleed: 'jurk', kleur: '#A8423A', kleur2: '#2A2420', schort: '#F1EADB', voet: 'schoen' },
    jongen: { huid: '#EFC7A2', haar: '#4A3020', hoed: 'pet', pet: '#3E5A3A', kleed: 'kiel', kleur: '#C9A45A', kleur2: '#3A3430', voet: 'klomp' }
  };
  const PAARDKLEUR = [
    { vel: '#F4F0E6', schaduw: '#C9C2B4', vlek: '#B8B2A6', manen: '#D8B25A', zadel: '#B3362A' },
    { vel: '#3A302A', schaduw: '#1E1814', vlek: null, manen: '#1A1410', zadel: '#2C5A9A' },
    { vel: '#9A5A32', schaduw: '#6A3A1E', vlek: null, manen: '#3A2010', zadel: '#2F6A3A' },
    { vel: '#E8E2D6', schaduw: '#B8B0A0', vlek: '#9A948A', manen: '#5A5048', zadel: '#7A3A8A' }
  ];

  // ============================================================
  // TEGENSPELERS: hoe precies ze steken (spreiding in seconden) en of ze vaak te vroeg of te laat zijn
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'mieke', niveau: 1, beloning: 25, spreid: 0.19, neiging: -0.05,
      zegt: { start: ['Ik wil op het witte paard!', 'Rondje, rondje!'], raak: ['Hebbes!', 'Een ring!'], mis: ['Oei, net mis.', 'Hij draait te hard!'], goud: ['De gouden!', 'Kijk, goud!'], wint: ['Ik heb de meeste!', 'Gewonnen!'], verliest: ['Jij bent goed!', 'Nog een rondje?'] } },
    { id: 'teun', niveau: 2, beloning: 40, spreid: 0.125, neiging: 0.025,
      zegt: { start: ['Eerst de broodjes, dan de molen.', 'Hou je vast!'], raak: ['Raak!', 'Die is voor mij.'], mis: ['Hè, te laat.', 'Bijna!'], goud: ['Goud, net als een krentenbol!', 'Hebbes, goud!'], wint: ['Ringenkoning!', 'Gewonnen!'], verliest: ['Petje af!', 'Jij steekt beter.'] } },
    { id: 'jantje', niveau: 3, beloning: 60, spreid: 0.088, neiging: -0.02,
      zegt: { start: ['Ik ben de snelste van de kermis!', 'Let maar op!'], raak: ['Zo doe je dat!', 'Raak!'], mis: ['Dat telt niet!', 'Oeps!'], goud: ['Goud! Ik ben de beste!', 'Hebbes!'], wint: ['Ik heb er het meest!', 'De ringenkoning ben ik!'], verliest: ['Jij was beter dan ik!', 'Nog een keer!'] } },
    { id: 'trijntje', niveau: 4, beloning: 90, spreid: 0.064, neiging: 0,
      zegt: { start: ['Rustig kijken, dan steken.', 'Klaar?'], raak: ['Mooi.', 'Raak.'], mis: ['Hm.', 'Ach.'], goud: ['De gouden ring!', 'Goud.'], wint: ['Gewonnen.', 'Zo gaat dat.'], verliest: ['Knap gedaan!', 'Jij kunt het!'] } }
  ];
  TEGENSTANDERS.forEach((t) => { t.naam = window.Personen ? (Personen.namen[t.id] || t.id) : t.id; });
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  const MENS_MODEL = { spreid: 0.075, neiging: 0 };

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, doek, ctx, ui = {}, gebouwd = false, raf = 0, vorigeT = 0, rest = 0;
  let L = 560, sc = 1, dpr = 1, achter = null, achterSleutel = '';
  let tegen = TEGENSTANDERS[0], potjes = 0;
  let spelers = [], fase = 'klaar', spelId = 0, winnaar = -1, W = null, bevroren = false, herstart = null;
  let lesSoort = null, lesBewaard = null, deeltjes = [];
  let rnd = Math.random;

  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nu = () => performance.now();
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const naamVan = (k) => (spelers[k] ? spelers[k].naam : '');
  const gewonnen = () => (window.Duiten ? Duiten.veld('ring-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  function zaad(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const hoekVerschil = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function meng(a, b, t) { const x = rgb(a), y = rgb(b); return `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)}, ${Math.round(x[1] + (y[1] - x[1]) * t)}, ${Math.round(x[2] + (y[2] - x[2]) * t)})`; }
  const tint = (h) => ({ l: meng(h, '#FFF4E2', 0.22), m: h, d: meng(h, '#160C06', 0.3), dd: meng(h, '#160C06', 0.5) });
  Object.values(UITERLIJK).forEach((u) => {
    u.k = { kleur: tint(u.kleur), kleur2: tint(u.kleur2), huid: tint(u.huid), haar: tint(u.haar), wang: meng(u.huid, '#E0705A', 0.45) };
  });

  // ============================================================
  // DE CAMERA: een gewone gaatjescamera die op de draaimolen gericht staat
  // ============================================================
  const cam = { C: [0, 4.6, 14], T: [0.6, 2.1, 0.8], F: 400, cx: 200, cy: 300, r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, -1] };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  function zetCamera(C, T, F, cx, cy) {
    cam.C = C; cam.T = T; cam.F = F; cam.cx = cx; cam.cy = cy;
    cam.f = norm(sub(T, C));
    cam.r = norm(cross(cam.f, [0, 1, 0]));
    cam.u = cross(cam.r, cam.f);
  }
  // een punt in de wereld naar het scherm: [x, y, diepte]
  function P(x, y, z) {
    const d = [x - cam.C[0], y - cam.C[1], z - cam.C[2]];
    const zz = Math.max(0.1, dot(d, cam.f));
    return [cam.cx + cam.F * dot(d, cam.r) / zz, cam.cy - cam.F * dot(d, cam.u) / zz, zz];
  }
  const schaal = (x, y, z) => cam.F / Math.max(0.1, dot(sub([x, y, z], cam.C), cam.f));
  const rond = (r, a, y) => [r * Math.sin(a), y, r * Math.cos(a)];
  function schermVlak(g) { const k = sc * dpr; g.setTransform(k, 0, 0, k, 0, 0); }
  // een plat figuurtje (in meters, y omhoog) neerzetten op een punt in de wereld, met een breedte-factor (draaiing)
  function figuur(g, x, y, z, breed) {
    const p = P(x, y, z), m = cam.F / p[2], k = sc * dpr;
    g.setTransform(k * m * breed, 0, 0, -k * m, k * p[0], k * p[1]);
    return m;
  }
  function veelhoek(g, punten) { g.beginPath(); punten.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); }
  // een cirkel op hoogte y, als lijst schermpunten
  function cirkel(r, y, n, a0, a1) {
    const lijst = [], van = a0 === undefined ? 0 : a0, tot = a1 === undefined ? Math.PI * 2 : a1;
    for (let i = 0; i <= n; i++) { const a = van + (tot - van) * i / n; lijst.push(P(r * Math.sin(a), y, r * Math.cos(a))); }
    return lijst;
  }

  // ============================================================
  // HET DECOR (één keer getekend per beeld): lucht, het dorp, tenten, vlaggetjes en mensen
  // ============================================================
  function maakAchter(soort) {
    const c = document.createElement('canvas');
    c.width = doekVan(soort).width; c.height = doekVan(soort).height;
    const g = c.getContext('2d');
    const Lh = c.height / (sc * dpr);
    schermVlak(g);
    const hor = P(0, 0, -60)[1];
    // de lucht: een zomerse middag
    let gr = g.createLinearGradient(0, 0, 0, hor + 10);
    gr.addColorStop(0, '#79A6CC'); gr.addColorStop(0.55, '#B2CCDC'); gr.addColorStop(1, '#EDE3C6');
    g.fillStyle = gr; g.fillRect(0, 0, B, hor + 12);
    gr = g.createRadialGradient(B * 0.85, 0, 0, B * 0.85, 0, B);
    gr.addColorStop(0, 'rgba(255, 246, 220, .7)'); gr.addColorStop(1, 'rgba(255, 246, 220, 0)');
    g.fillStyle = gr; g.fillRect(0, 0, B, hor);
    const r = zaad(9);
    [[0.15, 0.2, 1], [0.6, 0.12, 1.2], [0.88, 0.3, 0.8]].forEach(([fx, fy, m]) => wolk(g, B * fx, Math.max(12, hor * fy), m * B / 400, r));
    // het dorp in de verte: daken, een kerktoren en een molen
    dorp(g, hor, r);
    // het veld: aangestampt zand met gras aan de randen
    gr = g.createLinearGradient(0, hor, 0, Lh);
    gr.addColorStop(0, '#9CA868'); gr.addColorStop(0.12, '#C9B98C'); gr.addColorStop(0.6, '#D4C29A'); gr.addColorStop(1, '#BFA87C');
    g.fillStyle = gr; g.fillRect(0, hor, B, Lh - hor);
    // sporen en voetstappen in het zand
    g.strokeStyle = 'rgba(120, 96, 60, .18)'; g.lineWidth = 0.8;
    for (let i = 0; i < 50; i++) {
      const x = r() * 30 - 15, z = -25 + r() * 35, p = P(x, 0, z), s = cam.F / p[2];
      g.beginPath(); g.ellipse(p[0], p[1], s * 0.14, s * 0.05, 0, 0, Math.PI * 2); g.stroke();
    }
    // kramen en tenten achter de draaimolen, en mensen die kijken
    KRAMEN.forEach((k) => kraam(g, k, r));
    // op het plein staan de koekkraam, de kop van Jut en de mensen ervoor vóór de draaimolen: die komen in een eigen laag
    const volk = mensenLijst(r, soort);
    if (soort === 'plein') tekenMensen(g, volk.filter((m) => m[1] < 2.5));
    else tekenMensen(g, volk);
    return c;
  }
  function maakVoor() {
    const c = document.createElement('canvas');
    c.width = BEELD.plein.doek.width; c.height = BEELD.plein.doek.height;
    const g = c.getContext('2d');
    schermVlak(g);
    const r = zaad(9), volk = mensenLijst(r, 'plein');
    // de mensen voor de molen, dan de kramen; van ver naar dichtbij
    const voor = volk.filter((m) => m[1] >= 2.5);
    const dingen = voor.map((m) => [m[1], () => tekenMensen(g, [m])]);
    dingen.push([KOEKKRAAM.z, () => koekkraam(g)], [KOPVANJUT.z, () => kopVanJut(g)]);
    // en een paar kijkers vlak voor je
    const r2 = zaad(21);
    for (let i = 0; i < 5; i++) {
      const x = -6 + i * 3 + r2() * 1.5, z = Math.max(KOEKKRAAM.z, KOPVANJUT.z) + 2.4 + r2() * 1.2, f = r2();
      if (Math.abs(x - KOEKKRAAM.x) < 2.6 || Math.abs(x - KOPVANJUT.x) < 1.6 || Math.abs(x) < 1.6) continue;
      dingen.push([z, () => tekenMensen(g, [[x, z, f]])]);
    }
    dingen.sort((a, b) => a[0] - b[0]).forEach((d) => d[1]());
    return c;
  }
  function wolk(g, x, y, m, r) {
    for (let i = 0; i < 8; i++) {
      const bx = x + (r() - 0.5) * 80 * m, by = y - Math.sin(i / 7 * Math.PI) * 14 * m - r() * 8 * m, br = (10 + r() * 14) * m;
      const gr = g.createRadialGradient(bx - br * 0.3, by - br * 0.4, br * 0.1, bx, by, br);
      gr.addColorStop(0, 'rgba(255, 252, 244, .95)'); gr.addColorStop(0.6, 'rgba(240, 238, 232, .8)'); gr.addColorStop(1, 'rgba(200, 206, 214, 0)');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    }
  }
  function dorp(g, hor, r) {
    // ver weg in de waas: een rij daken en gevels, een kerktoren en een molen op de wal
    const Z = -88;
    let x = -64;
    while (x < 66) {
      const b = 6 + r() * 6, h = 5.5 + r() * 5, z = Z - r() * 8;
      const top = P(x + b / 2, h + b * 0.55, z);
      wand(g, x, x + b, 0, h, z);
      g.fillStyle = meng('#B6C4CA', '#C8B496', r() * 0.25); g.fill();
      const p1 = P(x, h, z), p2 = P(x + b, h, z);
      g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(top[0], top[1]); g.lineTo(p2[0], p2[1]); g.closePath(); g.fill();
      x += b + 0.6;
    }
    // de kerktoren met een spits
    wand(g, -21, -17, 0, 26, Z - 4); g.fillStyle = '#AAB8C0'; g.fill();
    const t1 = P(-21.5, 26, Z - 4), t2 = P(-16.5, 26, Z - 4), sp = P(-19, 38, Z - 4);
    g.fillStyle = '#9EADB6'; g.beginPath(); g.moveTo(t1[0], t1[1]); g.lineTo(sp[0], sp[1]); g.lineTo(t2[0], t2[1]); g.closePath(); g.fill();
    // een molen op de wal
    const m = P(28, 10, Z), ms = cam.F / m[2];
    void ms;
    const ms2 = cam.F / m[2];
    g.fillStyle = '#AAB6BC'; g.beginPath(); g.moveTo(m[0] - 2 * ms2, m[1] + 10 * ms2); g.lineTo(m[0] - 1.2 * ms2, m[1]); g.lineTo(m[0] + 1.2 * ms2, m[1]); g.lineTo(m[0] + 2 * ms2, m[1] + 10 * ms2); g.closePath(); g.fill();
    g.strokeStyle = '#9CA8AE'; g.lineWidth = Math.max(1, 0.35 * ms2);
    [0.4, 1.97, 3.54, 5.11].forEach((a) => { g.beginPath(); g.moveTo(m[0], m[1]); g.lineTo(m[0] + Math.cos(a) * 7 * ms2, m[1] - Math.sin(a) * 7 * ms2); g.stroke(); });
    // bomen voor het dorp
    for (let i = 0; i < 18; i++) {
      const bx = -66 + i * 7.6 + r() * 3, bz = -62 - r() * 6, p = P(bx, 3, bz), s = cam.F / p[2];
      g.fillStyle = meng('#7E9668', '#64805A', r());
      g.beginPath(); g.arc(p[0], p[1], 3.1 * s, 0, Math.PI * 2); g.fill();
    }
    void hor;
  }
  // een rechtopstaand vlak (x0..x1, y0..y1) op diepte z: in perspectief, dus palen lopen mee met de camera
  function wand(g, x0, x1, y0, y1, z) { veelhoek(g, [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]); }
  function paal(g, x, z, y0, y1, dik, kleur) {
    const a = P(x, y0, z), b = P(x, y1, z), s = cam.F / a[2];
    g.strokeStyle = kleur; g.lineWidth = Math.max(1, dik * s); g.lineCap = 'butt';
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  // de kramen in een kring om de draaimolen (achteraan)
  const KRAMEN = [
    { x: -11, z: -9, b: 4.2, d: 3, kleur: '#2C5A8A', soort: 'tent' },
    { x: -5.5, z: -13, b: 4.6, d: 3, kleur: '#B3362A', soort: 'kraam', naam: 'Poffertjes' },
    { x: 1.5, z: -14.5, b: 5.2, d: 3.6, kleur: '#E0B44A', soort: 'tent' },
    { x: 8.5, z: -12, b: 4.4, d: 3, kleur: '#2F6A3A', soort: 'kraam', naam: 'Kramerij' },
    { x: 13.5, z: -7.5, b: 4, d: 3, kleur: '#7A3A8A', soort: 'tent' }
  ];
  function kraam(g, k, r) {
    const z = k.z, x0 = k.x - k.b / 2, x1 = k.x + k.b / 2;
    const voet = [P(x0, 0, z), P(x1, 0, z)], top = [P(x0, 2.4, z), P(x1, 2.4, z)];
    if (k.soort === 'tent') {
      // een tent met een spits dak en strepen
      const nok = P(k.x, 4.4, z);
      wand(g, x0, x1, 0, 2.4, z); g.fillStyle = '#EFE6D2'; g.fill();
      const n = 6;
      for (let i = 0; i < n; i++) {
        const xa = x0 + k.b * i / n, xb = x0 + k.b * (i + 1) / n, a = P(xa, 2.4, z), b = P(xb, 2.4, z);
        g.fillStyle = i % 2 ? '#F2EADB' : k.kleur;
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(nok[0], nok[1]); g.closePath(); g.fill();
        if (!(i % 2)) { wand(g, xa, xb, 0, 2.38, z); g.fill(); }
      }
      // de ingang, donker
      const d0 = P(k.x - 0.6, 0, z), d1 = P(k.x + 0.6, 0, z), d2 = P(k.x + 0.6, 1.6, z), d3 = P(k.x - 0.6, 1.6, z), dt = P(k.x, 2.0, z);
      g.fillStyle = '#3A2A22'; g.beginPath(); g.moveTo(d0[0], d0[1]); g.lineTo(d3[0], d3[1]); g.quadraticCurveTo(dt[0], dt[1], d2[0], d2[1]); g.lineTo(d1[0], d1[1]); g.closePath(); g.fill();
      // een vaantje op de nok
      g.strokeStyle = '#4A3A2A'; g.lineWidth = 1; g.beginPath(); g.moveTo(nok[0], nok[1]); g.lineTo(nok[0], nok[1] - 10); g.stroke();
      g.fillStyle = k.kleur; g.beginPath(); g.moveTo(nok[0], nok[1] - 10); g.lineTo(nok[0] + 9, nok[1] - 7.5); g.lineTo(nok[0], nok[1] - 5); g.closePath(); g.fill();
    } else {
      // een kraam: toonbank, palen en een gestreepte luifel
      wand(g, x0, x1, 0, 1.0, z); g.fillStyle = '#8A6038'; g.fill();
      wand(g, x0, x1, 0.95, 1.02, z); g.fillStyle = '#5A3A20'; g.fill();
      paal(g, x0, z, 0, 2.4, 0.1, '#5A3A20'); paal(g, x1, z, 0, 2.4, 0.1, '#5A3A20');
      const n = 7, luifel = 2.6;
      for (let i = 0; i < n; i++) {
        const a = P(x0 - 0.3 + (k.b + 0.6) * i / n, luifel, z + 0.6), b = P(x0 - 0.3 + (k.b + 0.6) * (i + 1) / n, luifel, z + 0.6);
        const a2 = P(x0 - 0.3 + (k.b + 0.6) * i / n, luifel + 0.7, z - 0.4), b2 = P(x0 - 0.3 + (k.b + 0.6) * (i + 1) / n, luifel + 0.7, z - 0.4);
        g.fillStyle = i % 2 ? '#F4ECDC' : k.kleur;
        g.beginPath(); g.moveTo(a2[0], a2[1]); g.lineTo(b2[0], b2[1]); g.lineTo(b[0], b[1]); g.lineTo(a[0], a[1]); g.closePath(); g.fill();
        g.beginPath(); g.arc((a[0] + b[0]) / 2, a[1], (b[0] - a[0]) / 2, 0, Math.PI); g.fill();
      }
      // waren op de toonbank
      for (let i = 0; i < 6; i++) {
        const p = P(x0 + 0.4 + i * (k.b - 0.8) / 5, 1.05, z + 0.2), s = cam.F / p[2];
        g.fillStyle = ['#C88A4A', '#E8D29A', '#B3362A', '#6E8A56', '#E0B44A', '#A8602C'][i];
        g.beginPath(); g.ellipse(p[0], p[1] - 0.12 * s, 0.22 * s, 0.14 * s, 0, 0, Math.PI * 2); g.fill();
      }
    }
    void r;
  }
  // de koekkraam (op het plein): ontbijtkoek aan touwtjes onder een rood-witte luifel
  const KOEKKRAAM = { x: -7.6, z: 3.4, b: 3.6 };
  function koekkraam(g) {
    const k = KOEKKRAAM, z = k.z, x0 = k.x - k.b / 2, x1 = k.x + k.b / 2;
    const voet = [P(x0, 0, z), P(x1, 0, z)], bank = [P(x0, 1.05, z), P(x1, 1.05, z)];
    g.fillStyle = 'rgba(40, 24, 10, .22)'; g.beginPath(); g.ellipse((voet[0][0] + voet[1][0]) / 2, voet[0][1] + 2, (voet[1][0] - voet[0][0]) * 0.62, 6, 0, 0, Math.PI * 2); g.fill();
    let gr = g.createLinearGradient(0, bank[0][1], 0, voet[0][1]);
    gr.addColorStop(0, '#A87A48'); gr.addColorStop(1, '#6A4826');
    wand(g, x0, x1, 0, 1.05, z); g.fillStyle = gr; g.fill();
    wand(g, x0, x1, 1.0, 1.08, z); g.fillStyle = '#E8DCC0'; g.fill();
    paal(g, x0, z, 0, 2.7, 0.1, '#5A3A20'); paal(g, x1, z, 0, 2.7, 0.1, '#5A3A20');
    // de koeken aan touwtjes
    for (let i = 0; i < 5; i++) {
      const x = x0 + 0.45 + i * (k.b - 0.9) / 4, a = P(x, 2.65, z), b = P(x, 1.75 + (i % 2) * 0.15, z), s = cam.F / b[2];
      g.strokeStyle = '#E4D7BC'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      g.fillStyle = '#93511F'; g.fillRect(b[0] - 0.14 * s, b[1], 0.28 * s, 0.34 * s);
      g.fillStyle = '#B26C30'; g.fillRect(b[0] - 0.12 * s, b[1] + 0.02 * s, 0.24 * s, 0.05 * s);
    }
    // de luifel
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = P(x0 - 0.3 + (k.b + 0.6) * i / n, 2.75, z + 0.5), b = P(x0 - 0.3 + (k.b + 0.6) * (i + 1) / n, 2.75, z + 0.5);
      const a2 = P(x0 - 0.3 + (k.b + 0.6) * i / n, 3.4, z - 0.4), b2 = P(x0 - 0.3 + (k.b + 0.6) * (i + 1) / n, 3.4, z - 0.4);
      g.fillStyle = i % 2 ? '#F4ECDC' : '#B3362A';
      g.beginPath(); g.moveTo(a2[0], a2[1]); g.lineTo(b2[0], b2[1]); g.lineTo(b[0], b[1]); g.lineTo(a[0], a[1]); g.closePath(); g.fill();
      g.beginPath(); g.arc((a[0] + b[0]) / 2, a[1], (b[0] - a[0]) / 2, 0, Math.PI); g.fill();
    }
    // een bordje
    const bp = P(k.x, 3.55, z - 0.4), s = cam.F / bp[2];
    g.fillStyle = '#F2E6C8'; g.strokeStyle = '#7A5A30'; g.lineWidth = 1;
    g.fillRect(bp[0] - 0.9 * s, bp[1] - 0.42 * s, 1.8 * s, 0.42 * s); g.strokeRect(bp[0] - 0.9 * s, bp[1] - 0.42 * s, 1.8 * s, 0.42 * s);
    g.fillStyle = '#5A2A14'; g.font = `${Math.max(7, 0.26 * s).toFixed(1)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('KOEK', bp[0], bp[1] - 0.2 * s);
    void gr;
  }
  // de kop van Jut (op het plein): een hoge paal met een schaal, een bel bovenin en een blok om op te slaan
  const KOPVANJUT = { x: 8.4, z: 1.8 };
  function kopVanJut(g) {
    const k = KOPVANJUT, z = k.z;
    const v = P(k.x, 0, z), t = P(k.x, 5.6, z), s = cam.F / v[2];
    g.fillStyle = 'rgba(40, 24, 10, .22)'; g.beginPath(); g.ellipse(v[0], v[1] + 2, 1.2 * s, 0.25 * s, 0, 0, Math.PI * 2); g.fill();
    // de paal met de schaal
    let gr = g.createLinearGradient(v[0] - 0.25 * s, 0, v[0] + 0.25 * s, 0);
    gr.addColorStop(0, '#E8DCC0'); gr.addColorStop(0.5, '#FFF8E8'); gr.addColorStop(1, '#B8A880');
    wand(g, k.x - 0.22, k.x + 0.22, 0, 5.6, z); g.fillStyle = gr; g.fill();
    for (let i = 1; i < 10; i++) {
      const y = 0.9 + i * 0.48;
      wand(g, k.x - 0.22, k.x + 0.22, y - 0.05, y + 0.05, z);
      g.fillStyle = i > 7 ? '#B3362A' : i > 4 ? '#E0B44A' : '#2C5A8A'; g.fill();
    }
    // de bel
    g.fillStyle = '#D8A840'; g.beginPath(); g.arc(t[0], t[1] - 0.12 * s, 0.3 * s, Math.PI, 0); g.closePath(); g.fill();
    // het blok met de kop
    const b = P(k.x - 0.7, 0, z + 0.3);
    wand(g, k.x - 1.1, k.x - 0.3, 0, 0.6, z + 0.3); g.fillStyle = '#6A4626'; g.fill();
    g.fillStyle = '#F2CBA6'; g.beginPath(); g.arc(b[0], b[1] - 0.78 * s, 0.22 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2A1A10'; g.fillRect(b[0] - 0.24 * s, b[1] - 1.02 * s, 0.48 * s, 0.1 * s);
    g.fillRect(b[0] - 0.14 * s, b[1] - 1.22 * s, 0.28 * s, 0.22 * s);
    void gr;
  }
  // mensen die staan te kijken (kleine figuurtjes van achteren en opzij)
  function mensenLijst(r, soort) {
    const plekken = [];
    for (let i = 0; i < 26; i++) {
      const a = Math.PI * (0.62 + r() * 0.76) * (r() < 0.5 ? 1 : -1), d = 6.6 + r() * 3.2;
      plekken.push([Math.sin(a) * d, Math.cos(a) * d - 1.5, r()]);
    }
    for (let i = 0; i < 12; i++) plekken.push([-14 + r() * 28, -9 - r() * 5, r()]);
    return plekken.filter(([x, z]) => !(soort === 'plein' && (Math.hypot(x - KOEKKRAAM.x, z - KOEKKRAAM.z) < 3.2 || Math.hypot(x - KOPVANJUT.x, z - KOPVANJUT.z) < 2.4))).sort((a, b) => a[1] - b[1]);
  }
  function tekenMensen(g, plekken) {
    plekken.forEach(([x, z, f]) => {
      const p = P(x, 0, z), s = cam.F / p[2], h = (f < 0.25 ? 1.15 : 1.65) * s;
      const kleur = ['#3A3A48', '#5A2A20', '#2C4A6A', '#6A5A3A', '#4A2A3A'][Math.floor(f * 5)];
      g.fillStyle = kleur;
      g.beginPath(); g.moveTo(p[0] - 0.22 * s, p[1]); g.lineTo(p[0] - 0.18 * s, p[1] - h * 0.78); g.quadraticCurveTo(p[0], p[1] - h * 0.86, p[0] + 0.18 * s, p[1] - h * 0.78); g.lineTo(p[0] + 0.22 * s, p[1]); g.closePath(); g.fill();
      g.fillStyle = f > 0.5 ? '#EBC8A6' : '#D8B08A'; g.beginPath(); g.arc(p[0], p[1] - h * 0.86, 0.11 * s, 0, Math.PI * 2); g.fill();
      g.fillStyle = f > 0.6 ? '#F2EEE4' : '#2A2420'; g.beginPath(); g.ellipse(p[0], p[1] - h * 0.93, 0.15 * s, 0.07 * s, 0, 0, Math.PI * 2); g.fill();
    });
  }

  // ============================================================
  // DE DRAAIMOLEN
  // ============================================================
  // een houten kermispaard in galop (in meters; oorsprong midden op het zadel, x vooruit, y omhoog)
  function tekenPaard(g, kl, t) {
    const vel = kl.vel, sch = kl.schaduw;
    const gr = g.createLinearGradient(0, 0.5, 0.2, -0.4);
    gr.addColorStop(0, meng(vel, '#FFFFFF', 0.25)); gr.addColorStop(0.55, vel); gr.addColorStop(1, sch);
    // achterbenen en voorbenen aan de verre kant (donkerder)
    g.lineCap = 'round'; g.lineJoin = 'round';
    const been = (pad, dik, kleur) => { g.strokeStyle = kleur; g.lineWidth = dik; g.beginPath(); g.moveTo(pad[0][0], pad[0][1]); for (let i = 1; i < pad.length; i++) g.lineTo(pad[i][0], pad[i][1]); g.stroke(); };
    been([[-0.44, -0.12], [-0.62, -0.42], [-0.8, -0.6]], 0.1, sch);
    been([[0.36, -0.14], [0.5, -0.44], [0.66, -0.56]], 0.09, sch);
    // de staart
    g.fillStyle = kl.manen;
    g.beginPath(); g.moveTo(-0.62, 0.12); g.bezierCurveTo(-0.9, 0.1, -1.0, -0.12, -1.08, -0.42); g.bezierCurveTo(-0.96, -0.3, -0.86, -0.18, -0.66, -0.02); g.closePath(); g.fill();
    // de romp
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0.34, 0.16);
    g.bezierCurveTo(0.1, 0.2, -0.3, 0.2, -0.56, 0.14);
    g.bezierCurveTo(-0.78, 0.08, -0.78, -0.14, -0.56, -0.2);
    g.bezierCurveTo(-0.3, -0.26, 0.2, -0.26, 0.42, -0.16);
    g.bezierCurveTo(0.56, -0.1, 0.56, 0.08, 0.34, 0.16);
    g.closePath(); g.fill();
    // de hals en het hoofd
    g.beginPath();
    g.moveTo(0.3, 0.12); g.quadraticCurveTo(0.42, 0.5, 0.56, 0.72);
    g.quadraticCurveTo(0.6, 0.82, 0.68, 0.84);
    g.lineTo(0.72, 0.92); g.lineTo(0.75, 0.83);
    g.bezierCurveTo(0.86, 0.78, 0.96, 0.62, 1.02, 0.5);
    g.quadraticCurveTo(1.04, 0.43, 0.97, 0.42);
    g.quadraticCurveTo(0.9, 0.44, 0.84, 0.46);
    g.quadraticCurveTo(0.74, 0.5, 0.66, 0.46);
    g.quadraticCurveTo(0.56, 0.26, 0.5, 0.02);
    g.closePath(); g.fill();
    // vlekken (appelschimmel)
    if (kl.vlek) {
      g.fillStyle = kl.vlek; g.globalAlpha = 0.45;
      [[-0.4, 0.0, 0.07], [-0.2, -0.08, 0.06], [-0.5, -0.1, 0.05], [0.1, -0.1, 0.05], [-0.05, 0.06, 0.04], [0.3, -0.05, 0.05]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
      g.globalAlpha = 1;
    }
    // de manen, golvend langs de hals
    g.fillStyle = kl.manen;
    g.beginPath(); g.moveTo(0.62, 0.84);
    g.bezierCurveTo(0.5, 0.8, 0.44, 0.66, 0.36, 0.56); g.bezierCurveTo(0.3, 0.44, 0.26, 0.3, 0.22, 0.2);
    g.bezierCurveTo(0.3, 0.26, 0.38, 0.4, 0.44, 0.52); g.bezierCurveTo(0.5, 0.64, 0.56, 0.74, 0.62, 0.84); g.closePath(); g.fill();
    // oog, neusgat en een open mond
    g.fillStyle = '#1A1410'; g.beginPath(); g.ellipse(0.79, 0.7, 0.028, 0.022, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(0.785, 0.708, 0.007, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5A2A20'; g.beginPath(); g.ellipse(0.97, 0.48, 0.02, 0.012, -0.5, 0, Math.PI * 2); g.fill();
    // het tuig: hoofdstel, borstriem met stenen, zadel met een dek
    g.strokeStyle = '#D8A840'; g.lineWidth = 0.025;
    g.beginPath(); g.moveTo(0.7, 0.82); g.lineTo(0.92, 0.46); g.moveTo(0.66, 0.62); g.quadraticCurveTo(0.82, 0.6, 0.98, 0.5); g.stroke();
    g.strokeStyle = kl.zadel; g.lineWidth = 0.05;
    g.beginPath(); g.moveTo(0.3, 0.12); g.quadraticCurveTo(0.46, -0.02, 0.42, -0.16); g.stroke();
    ['#C8382B', '#2C5A9A', '#3A8A4A'].forEach((k, i) => { g.fillStyle = k; g.beginPath(); g.arc(0.38 + i * 0.02, 0.06 - i * 0.08, 0.022, 0, Math.PI * 2); g.fill(); });
    const zg = g.createLinearGradient(0, 0.3, 0, -0.15);
    zg.addColorStop(0, meng(kl.zadel, '#FFFFFF', 0.25)); zg.addColorStop(1, meng(kl.zadel, '#000000', 0.3));
    g.fillStyle = zg;
    g.beginPath(); g.moveTo(-0.3, 0.16); g.lineTo(0.22, 0.16); g.lineTo(0.2, -0.14);
    for (let i = 0; i <= 5; i++) { const x = 0.2 - i * 0.1; g.quadraticCurveTo(x - 0.05, -0.2, x - 0.1, -0.14); }
    g.closePath(); g.fill();
    g.strokeStyle = '#D8A840'; g.lineWidth = 0.02; g.stroke();
    g.fillStyle = '#5A2A14'; g.beginPath(); g.moveTo(-0.18, 0.18); g.quadraticCurveTo(-0.02, 0.3, 0.14, 0.18); g.quadraticCurveTo(-0.02, 0.24, -0.18, 0.18); g.fill();
    // de benen aan deze kant: voorbeen hoog opgetrokken, achterbeen naar achter
    been([[0.42, -0.1], [0.6, -0.3], [0.74, -0.2]], 0.11, vel);
    been([[-0.48, -0.08], [-0.74, -0.32], [-0.98, -0.38]], 0.12, vel);
    g.fillStyle = '#2A2420';
    [[0.75, -0.2], [-0.99, -0.38], [0.67, -0.57], [-0.81, -0.61]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 0.045, 0, Math.PI * 2); g.fill(); });
    void t;
  }
  // een ruiter op het zadel (oorsprong op het zadel); de hand met de lans steekt naar buiten
  function tekenRuiter(g, U, houding) {
    const K = U.k, juich = houding.juich, sip = houding.sip;
    g.lineCap = 'round'; g.lineJoin = 'round';
    // het verre been, langs de flank
    g.strokeStyle = K.kleur2.dd; g.lineWidth = 0.09;
    g.beginPath(); g.moveTo(0.0, 0.2); g.lineTo(0.16, 0.12); g.lineTo(0.12, -0.18); g.stroke();
    // het lijf
    const lean = (juich ? -0.08 : 0.06) + (sip ? 0.2 : 0);
    g.save(); g.translate(0, 0.18); g.rotate(-lean);
    const gr = g.createLinearGradient(-0.1, 0.4, 0.12, 0);
    gr.addColorStop(0, K.kleur.l); gr.addColorStop(0.5, K.kleur.m); gr.addColorStop(1, K.kleur.d);
    if (U.kleed === 'jurk') {
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(-0.08, 0.06); g.quadraticCurveTo(-0.18, -0.04, -0.2, -0.2); g.quadraticCurveTo(0.02, -0.26, 0.24, -0.16); g.quadraticCurveTo(0.14, -0.02, 0.08, 0.06); g.closePath(); g.fill();
      g.fillStyle = U.schort; g.beginPath(); g.moveTo(0.02, 0.06); g.quadraticCurveTo(0.14, -0.04, 0.22, -0.16); g.lineTo(0.12, -0.2); g.quadraticCurveTo(0.06, -0.06, -0.01, 0.06); g.closePath(); g.fill();
    }
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-0.085, -0.02); g.quadraticCurveTo(-0.1, 0.22, -0.07, 0.4); g.quadraticCurveTo(0.01, 0.44, 0.075, 0.39); g.quadraticCurveTo(0.11, 0.2, 0.1, -0.02); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20, 14, 10, .25)'; g.lineWidth = 0.008; g.stroke();
    // het hoofd
    g.save(); g.translate(0.02, 0.56); g.rotate((sip ? -0.3 : 0) + (juich ? 0.2 : 0)); g.scale(1.16, 1.16);
    tekenKop(g, U, juich, sip);
    g.restore();
    g.restore();
    // het bijna been
    g.strokeStyle = U.kleed === 'jurk' ? '#2E2C34' : K.kleur2.m; g.lineWidth = 0.1;
    g.beginPath(); g.moveTo(0.0, 0.2); g.lineTo(0.2, 0.1); g.lineTo(0.15, -0.2); g.stroke();
    g.fillStyle = U.voet === 'klomp' ? '#E2C285' : '#2E2622';
    g.beginPath(); g.ellipse(0.19, -0.24, 0.085, 0.04, -0.2, 0, Math.PI * 2); g.fill();
    // de arm met de lans (de hand is waar de lans begint)
    const hand = juich ? [0.08, 0.86] : (houding.hand || [0.26, 0.5]);
    g.strokeStyle = K.kleur.m; g.lineWidth = 0.075;
    g.beginPath(); g.moveTo(0.02, 0.52); g.lineTo((0.02 + hand[0]) / 2 + 0.03, (0.52 + hand[1]) / 2 - 0.04); g.lineTo(hand[0], hand[1]); g.stroke();
    g.fillStyle = K.huid.m; g.beginPath(); g.arc(hand[0], hand[1], 0.035, 0, Math.PI * 2); g.fill();
    return hand;
  }
  function tekenKop(g, U, blij, sip) {
    const K = U.k;
    if (U.hoed !== 'hul') { g.fillStyle = K.haar.d; g.beginPath(); g.ellipse(-0.03, 0.02, 0.1, 0.1, 0, 0, Math.PI * 2); g.fill(); }
    const gr = g.createRadialGradient(0.02, 0.03, 0.01, 0, 0, 0.12);
    gr.addColorStop(0, K.huid.l); gr.addColorStop(0.6, K.huid.m); gr.addColorStop(1, K.huid.d);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-0.05, -0.08); g.quadraticCurveTo(-0.1, -0.02, -0.09, 0.04); g.quadraticCurveTo(-0.06, 0.11, 0.02, 0.105); g.quadraticCurveTo(0.08, 0.09, 0.085, 0.03);
    g.quadraticCurveTo(0.1, 0.0, 0.103, -0.012); g.quadraticCurveTo(0.09, -0.02, 0.085, -0.03); g.quadraticCurveTo(0.08, -0.08, 0.03, -0.09); g.quadraticCurveTo(-0.01, -0.095, -0.05, -0.08); g.closePath(); g.fill();
    g.fillStyle = K.wang; g.globalAlpha = 0.5; g.beginPath(); g.arc(0.045, -0.025, 0.026, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    if (U.sproet) { g.fillStyle = 'rgba(168, 90, 40, .6)'; [[0.06, -0.005], [0.07, -0.02], [0.05, -0.012]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 0.004, 0, Math.PI * 2); g.fill(); }); }
    g.fillStyle = '#2A1A10';
    if (blij) { g.strokeStyle = '#2A1A10'; g.lineWidth = 0.01; g.beginPath(); g.arc(0.055, 0.022, 0.012, Math.PI * 1.1, Math.PI * 1.9, true); g.stroke(); }
    else { g.beginPath(); g.ellipse(0.058, 0.02, 0.0095, 0.012, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(150, 60, 50, .8)'; g.lineWidth = 0.008; g.beginPath();
    if (sip) { g.moveTo(0.06, -0.06); g.quadraticCurveTo(0.075, -0.052, 0.088, -0.062); } else { g.moveTo(0.058, -0.055); g.quadraticCurveTo(0.075, -0.066 - (blij ? 0.01 : 0), 0.09, -0.052); }
    g.stroke();
    g.fillStyle = K.huid.d; g.beginPath(); g.ellipse(-0.01, 0.0, 0.018, 0.026, 0.2, 0, Math.PI * 2); g.fill();
    if (U.hoed !== 'hul') {
      g.fillStyle = K.haar.m; g.beginPath(); g.moveTo(0.07, 0.065); g.quadraticCurveTo(0.03, 0.12, -0.05, 0.1); g.quadraticCurveTo(-0.11, 0.06, -0.1, -0.03); g.quadraticCurveTo(-0.06, -0.01, -0.03, 0.04); g.quadraticCurveTo(0.02, 0.06, 0.07, 0.065); g.closePath(); g.fill();
    }
    if (U.hoed === 'stro') {
      g.fillStyle = '#E2C07C'; g.beginPath(); g.moveTo(-0.07, 0.07); g.quadraticCurveTo(-0.07, 0.15, 0, 0.15); g.quadraticCurveTo(0.07, 0.15, 0.07, 0.07); g.closePath(); g.fill();
      g.fillStyle = '#B8382A'; g.fillRect(-0.07, 0.07, 0.14, 0.022);
      g.fillStyle = '#D4B06C'; g.beginPath(); g.ellipse(0.005, 0.07, 0.14, 0.02, -0.05, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'muts') {
      g.fillStyle = U.muts; g.beginPath(); g.moveTo(0.075, 0.05); g.quadraticCurveTo(0.08, 0.15, -0.02, 0.15); g.quadraticCurveTo(-0.11, 0.13, -0.11, 0.03); g.quadraticCurveTo(-0.02, 0.05, 0.075, 0.05); g.closePath(); g.fill();
      g.fillStyle = '#F2E6D0'; g.beginPath(); g.arc(-0.04, 0.16, 0.025, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'pet') {
      g.fillStyle = U.pet; g.beginPath(); g.moveTo(0.075, 0.055); g.quadraticCurveTo(0.07, 0.14, -0.03, 0.14); g.quadraticCurveTo(-0.11, 0.13, -0.105, 0.04); g.quadraticCurveTo(-0.02, 0.06, 0.075, 0.055); g.closePath(); g.fill();
      g.fillStyle = meng(U.pet, '#000', 0.4); g.beginPath(); g.moveTo(0.06, 0.065); g.quadraticCurveTo(0.12, 0.07, 0.15, 0.05); g.quadraticCurveTo(0.11, 0.045, 0.06, 0.05); g.closePath(); g.fill();
    } else if (U.hoed === 'strik') {
      g.fillStyle = U.strik; g.beginPath(); g.moveTo(-0.06, 0.1); g.lineTo(-0.11, 0.14); g.lineTo(-0.1, 0.07); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-0.06, 0.1); g.lineTo(-0.01, 0.15); g.lineTo(0.0, 0.08); g.closePath(); g.fill();
    } else if (U.hoed === 'hul') {
      g.fillStyle = '#F4F1E8'; g.beginPath(); g.moveTo(0.07, 0.07); g.quadraticCurveTo(0.06, 0.14, -0.03, 0.14); g.quadraticCurveTo(-0.12, 0.12, -0.11, 0.0); g.quadraticCurveTo(-0.1, -0.07, -0.06, -0.08); g.lineTo(-0.04, -0.03); g.quadraticCurveTo(-0.04, 0.05, 0.07, 0.07); g.closePath(); g.fill();
    } else if (U.hoed === 'bakker') {
      g.fillStyle = '#F6F3EC'; g.beginPath(); g.moveTo(0.075, 0.06); g.quadraticCurveTo(0.09, 0.2, -0.04, 0.2); g.quadraticCurveTo(-0.15, 0.18, -0.11, 0.05); g.quadraticCurveTo(-0.02, 0.07, 0.075, 0.06); g.closePath(); g.fill();
    }
  }

  // de stand van de molen: de hoek van de vloer, en per paard de hoogte (de paarden gaan op en neer met de molen mee)
  const paardHoek = (phi, i) => phi + i * Math.PI * 2 / PAARDEN;
  const paardOp = (phi, i) => 0.2 * Math.sin(phi * 3 + i * 2.1);
  const H_ZADEL = 1.42;

  // de hele draaimolen, met wat erop rijdt. m = { phi, ruiters: {paard: ruiter}, t }
  function tekenDraaimolen(g, m) {
    const phi = m.phi, t = m.t;
    schermVlak(g);
    // schaduw op het zand
    const sch = cirkel(R_KAP + 0.6, 0.01, 40);
    veelhoek(g, sch); g.fillStyle = 'rgba(60, 40, 20, .2)'; g.fill();
    // de vloer: houten planken die meedraaien, met een versierde rand
    const vloer = cirkel(R_VLOER, H_VLOER, 64);
    veelhoek(g, vloer);
    let gr = g.createLinearGradient(0, P(0, H_VLOER, -R_VLOER)[1], 0, P(0, H_VLOER, R_VLOER)[1]);
    gr.addColorStop(0, '#6A4A2C'); gr.addColorStop(1, '#9A7448');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(40, 24, 10, .35)'; g.lineWidth = 0.7; g.beginPath();
    for (let j = 0; j < 24; j++) { const a = phi + j * Math.PI / 12, p0 = P(...rond(R_ZUIL, a, H_VLOER)), p1 = P(...rond(R_VLOER, a, H_VLOER)); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
    g.stroke();
    // de voorkant van de vloer: rood met goud, en treden
    for (let j = 0; j < 32; j++) {
      const a0 = -Math.PI / 2 + j * Math.PI / 32, a1 = a0 + Math.PI / 32;
      if (Math.cos(a0) < -0.05 && Math.cos(a1) < -0.05) continue;
      const q = [P(...rond(R_VLOER, a0, H_VLOER)), P(...rond(R_VLOER, a1, H_VLOER)), P(...rond(R_VLOER, a1, 0.06)), P(...rond(R_VLOER, a0, 0.06))];
      veelhoek(g, q);
      const fase = Math.floor(((a0 - phi) / (Math.PI / 16)) % 2 + 2) % 2;
      g.fillStyle = fase ? '#9A2E24' : '#B3362A'; g.fill();
    }
    g.strokeStyle = '#D8A840'; g.lineWidth = 1.4;
    g.beginPath(); cirkel(R_VLOER, H_VLOER - 0.02, 32, -Math.PI / 2, Math.PI / 2).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    // schaduw onder de kap op de vloer
    veelhoek(g, cirkel(R_VLOER * 0.98, H_VLOER + 0.01, 48));
    const midden = P(0, H_VLOER, 0);
    gr = g.createRadialGradient(midden[0], midden[1], 4, midden[0], midden[1], (P(R_VLOER, H_VLOER, 0)[0] - midden[0]) * 1.05);
    gr.addColorStop(0, 'rgba(20, 10, 4, .35)'); gr.addColorStop(1, 'rgba(20, 10, 4, .05)');
    g.fillStyle = gr; g.fill();
    // het plafond onder de kap (te zien als je eronder kijkt) en de binnenkant van de rand achterin
    if (cam.C[1] < H_KAP + 0.2) tekenPlafond(g, phi);
    // paarden achter de zuil, dan de zuil, dan de paarden ervoor
    const lijst = [];
    for (let i = 0; i < PAARDEN; i++) { const a = paardHoek(phi, i); lijst.push({ i, a, z: Math.cos(a) * R_PAARD }); }
    lijst.sort((a, b) => a.z - b.z);
    lijst.filter((p) => p.z < -0.2).forEach((p) => tekenPaardOpPaal(g, p, m));
    tekenZuil(g, phi);
    lijst.filter((p) => p.z >= -0.2).forEach((p) => tekenPaardOpPaal(g, p, m));
    tekenKap(g, phi, t);
  }
  function tekenPaardOpPaal(g, p, m) {
    const a = p.a, op = paardOp(m.phi, p.i), y = H_ZADEL + op;
    // de koperen paal, gedraaid
    schermVlak(g);
    const pb = P(...rond(R_PAARD, a, H_VLOER)), pt = P(...rond(R_PAARD, a, H_KAP)), s = cam.F / pb[2];
    g.lineCap = 'butt';
    g.strokeStyle = '#A8822E'; g.lineWidth = Math.max(1.2, 0.07 * s);
    g.beginPath(); g.moveTo(pb[0], pb[1]); g.lineTo(pt[0], pt[1]); g.stroke();
    g.strokeStyle = '#F4DC8C'; g.lineWidth = Math.max(0.6, 0.025 * s); g.setLineDash([Math.max(2, 0.12 * s), Math.max(2, 0.12 * s)]);
    g.lineDashOffset = -m.phi * 40;
    g.beginPath(); g.moveTo(pb[0] - 0.012 * s, pb[1]); g.lineTo(pt[0] - 0.012 * s, pt[1]); g.stroke();
    g.setLineDash([]);
    // het paard (en zijn ruiter), als een plat beeld dat meedraait
    const richting = Math.cos(a), breed = Math.sign(richting || 1) * Math.max(0.3, Math.abs(richting));
    const pos = rond(R_PAARD, a, y);
    figuur(g, pos[0], pos[1], pos[2], breed);
    const kl = PAARDKLEUR[p.i % PAARDKLEUR.length];
    tekenPaard(g, kl, m.t);
    const r = m.ruiters && m.ruiters[p.i];
    if (r) {
      g.save(); g.translate(-0.04, 0.2);
      const hand = tekenRuiter(g, UITERLIJK[r.look] || UITERLIJK.jij, { juich: r.juich > 0, sip: r.sip > 0, hand: r.hand });
      g.restore();
      // waar is de hand in de wereld? (voor de lans)
      const hx = hand[0] - 0.04, hy = hand[1] + 0.2;
      r._hand = [pos[0] + Math.cos(a) * hx + Math.sin(a) * 0.22, pos[1] + hy, pos[2] - Math.sin(a) * hx + Math.cos(a) * 0.22];
      if (r.lans) tekenLans(g, r, a, y);
      if (r.wijs) tekenWijzer(g, pos, m.t);
    }
  }
  // de lans: van de hand naar de punt; uitgestoken gaat de punt naar de ring toe. De gevangen ringen hangen erom.
  function tekenLans(g, r, a, y) {
    const s = r.steek || 0;
    const rust = rond(R_PAARD + 0.5, a + 0.13, y + 0.1), uit = rond(R_RING, a + VOOR, H_RING);
    const tip = [rust[0] + (uit[0] - rust[0]) * s, rust[1] + (uit[1] - rust[1]) * s, rust[2] + (uit[2] - rust[2]) * s];
    const h = r._hand;
    const dx = tip[0] - h[0], dy = tip[1] - h[1], dz = tip[2] - h[2], l = Math.hypot(dx, dy, dz) || 1;
    const kont = [h[0] - dx / l * 0.18, h[1] - dy / l * 0.18, h[2] - dz / l * 0.18];
    schermVlak(g);
    const p0 = P(...kont), p1 = P(...tip), sz = cam.F / p1[2];
    g.lineCap = 'round';
    g.strokeStyle = '#4A2E16'; g.lineWidth = Math.max(1.2, 0.035 * sz); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
    g.strokeStyle = 'rgba(255, 230, 190, .5)'; g.lineWidth = Math.max(0.5, 0.012 * sz); g.beginPath(); g.moveTo(p0[0], p0[1] - 0.5); g.lineTo(p1[0], p1[1] - 0.5); g.stroke();
    // de gevangen ringen schuiven tot bij de hand
    (r.ringen || []).forEach((soort, i) => {
      const f = 0.1 + i * 0.045, q = [h[0] + dx / l * f, h[1] + dy / l * f, h[2] + dz / l * f], pq = P(...q), sq = cam.F / pq[2];
      tekenRingVorm(g, pq[0], pq[1], sq * 0.07, sq * 0.11, soort, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
    });
    r._tip = p1;
  }
  function tekenRingVorm(g, x, y, rx, ry, soort, hoek) {
    g.save(); g.translate(x, y); g.rotate((hoek || 0) + Math.PI / 2);
    g.lineWidth = Math.max(1, ry * 0.28);
    g.strokeStyle = soort === 'goud' ? '#8A6010' : '#6A4A1A';
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    g.lineWidth = Math.max(0.7, ry * 0.16);
    g.strokeStyle = soort === 'goud' ? '#FFE08A' : '#D8A85A';
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI * 0.9, Math.PI * 1.9); g.stroke();
    g.restore();
  }
  // een gouden pijltje boven jouw ruiter, zodat je hem altijd terugvindt
  function tekenWijzer(g, pos, t) {
    const p = P(pos[0], pos[1] + 1.35, pos[2]), s = cam.F / p[2], h = Math.sin(t * 5) * 0.04 * s;
    schermVlak(g);
    g.fillStyle = '#F2C14E'; g.strokeStyle = 'rgba(90, 50, 10, .6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(p[0], p[1] + 0.16 * s + h); g.lineTo(p[0] - 0.12 * s, p[1] + h); g.lineTo(p[0] + 0.12 * s, p[1] + h); g.closePath(); g.fill(); g.stroke();
  }
  // de middenzuil met spiegels en schilderijtjes, die meedraait
  function tekenZuil(g, phi) {
    schermVlak(g);
    const n = 12;
    for (let j = 0; j < n; j++) {
      const a0 = phi * 1 + j * Math.PI * 2 / n, a1 = a0 + Math.PI * 2 / n;
      const zm = Math.cos((a0 + a1) / 2);
      if (zm < 0) continue;
      const q = [P(...rond(R_ZUIL, a0, H_VLOER)), P(...rond(R_ZUIL, a1, H_VLOER)), P(...rond(R_ZUIL, a1, H_KAP)), P(...rond(R_ZUIL, a0, H_KAP))];
      veelhoek(g, q);
      const licht = 0.55 + 0.45 * zm;
      if (j % 2) {
        const gr = g.createLinearGradient(q[0][0], q[2][1], q[1][0], q[0][1]);
        gr.addColorStop(0, meng('#DCEAF0', '#5A7080', 1 - licht)); gr.addColorStop(0.5, meng('#9FB8C6', '#3A4A56', 1 - licht)); gr.addColorStop(1, meng('#EAF4F8', '#5A7080', 1 - licht));
        g.fillStyle = gr;
      } else g.fillStyle = meng('#7A2E24', '#2A100C', 1 - licht);
      g.fill();
      g.strokeStyle = '#D8A840'; g.lineWidth = 1; g.stroke();
      if (!(j % 2)) {
        // een landschapje: lucht, groen, een molentje
        const c = [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[2][1]) / 2], bw = Math.abs(q[1][0] - q[0][0]) * 0.32, bh = Math.abs(q[0][1] - q[3][1]) * 0.16;
        g.fillStyle = meng('#9CC0D8', '#2A3A44', 1 - licht); g.fillRect(c[0] - bw, c[1] - bh, bw * 2, bh * 1.2);
        g.fillStyle = meng('#6E8A4A', '#1E2A14', 1 - licht); g.fillRect(c[0] - bw, c[1] + bh * 0.2, bw * 2, bh * 0.8);
      }
    }
  }
  function tekenPlafond(g, phi) {
    schermVlak(g);
    veelhoek(g, cirkel(R_KAP, H_KAP, 64));
    const m = P(0, H_KAP, 0), rand = P(0, H_KAP, -R_KAP);
    const gr = g.createRadialGradient(m[0], m[1], 2, m[0], m[1], Math.max(20, Math.abs(m[1] - rand[1]) * 3));
    gr.addColorStop(0, '#2A120C'); gr.addColorStop(0.6, '#5A2418'); gr.addColorStop(1, '#7A3424');
    g.fillStyle = gr; g.fill();
    // houten ribben en spiegeltjes die meedraaien
    g.strokeStyle = 'rgba(216, 168, 64, .55)'; g.lineWidth = 1; g.beginPath();
    for (let j = 0; j < 16; j++) { const a = phi + j * Math.PI / 8, p0 = P(...rond(R_ZUIL, a, H_KAP)), p1 = P(...rond(R_KAP, a, H_KAP)); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
    g.stroke();
    for (let j = 0; j < 16; j++) {
      const a = phi + (j + 0.5) * Math.PI / 8, p = P(...rond((R_ZUIL + R_KAP) / 2, a, H_KAP)), s = cam.F / p[2];
      g.fillStyle = j % 2 ? 'rgba(190, 214, 226, .55)' : 'rgba(232, 192, 96, .5)';
      g.beginPath(); g.ellipse(p[0], p[1], 0.22 * s, 0.07 * s, 0, 0, Math.PI * 2); g.fill();
    }
    // de binnenkant van de rand achterin, in de schaduw
    for (let j = 0; j < 24; j++) {
      const a0 = phi + j * Math.PI * 2 / 24, a1 = a0 + Math.PI * 2 / 24, am = (a0 + a1) / 2;
      if (Math.cos(am) > 0.15) continue;
      const q = [P(...rond(R_KAP, a0, H_KAP + 0.3)), P(...rond(R_KAP, a1, H_KAP + 0.3)), P(...rond(R_KAP, a1, H_KAP - 0.14)), P(...rond(R_KAP, a0, H_KAP - 0.14))];
      veelhoek(g, q);
      g.fillStyle = j % 2 ? '#8A7A64' : '#6A2018'; g.fill();
    }
  }
  // de kap: rood-witte banen, een geschulpte rand met franje, en bovenop een kroon met een vaantje
  function tekenKap(g, phi, t) {
    schermVlak(g);
    const n = 24, rand = H_KAP + 0.32;
    // het dak (alleen de voorkant is te zien)
    for (let j = 0; j < n; j++) {
      const a0 = phi + j * Math.PI * 2 / n, a1 = a0 + Math.PI * 2 / n;
      if (Math.cos((a0 + a1) / 2) < -0.15) continue;
      const q = [P(...rond(R_KAP, a0, rand)), P(...rond(R_KAP, a1, rand)), P(...rond(0.45, a1, H_TOP)), P(...rond(0.45, a0, H_TOP))];
      veelhoek(g, q);
      const licht = 0.72 + 0.28 * Math.cos((a0 + a1) / 2 - 0.5);
      g.fillStyle = j % 2 ? meng('#F4ECDA', '#6A5A48', 1 - licht) : meng('#C23A2C', '#4A120C', 1 - licht);
      g.fill();
    }
    // de geschulpte rand met franje
    for (let j = 0; j < n; j++) {
      const a0 = phi + j * Math.PI * 2 / n, a1 = a0 + Math.PI * 2 / n, am = (a0 + a1) / 2;
      if (Math.cos(am) < -0.1) continue;
      const boven = [P(...rond(R_KAP + 0.03, a0, rand)), P(...rond(R_KAP + 0.03, a1, rand))];
      const onder = [P(...rond(R_KAP + 0.03, a0, H_KAP - 0.12)), P(...rond(R_KAP + 0.03, a1, H_KAP - 0.12))];
      const punt = P(...rond(R_KAP + 0.03, am, H_KAP - 0.36));
      g.beginPath(); g.moveTo(boven[0][0], boven[0][1]); g.lineTo(boven[1][0], boven[1][1]); g.lineTo(onder[1][0], onder[1][1]);
      g.quadraticCurveTo(punt[0], punt[1] + (punt[1] - onder[1][1]) * 0.2, onder[0][0], onder[0][1]); g.closePath();
      const licht = 0.7 + 0.3 * Math.cos(am - 0.4);
      g.fillStyle = j % 2 ? meng('#F4ECDA', '#5A4A38', 1 - licht) : meng('#B3362A', '#3A0E08', 1 - licht);
      g.fill();
      g.strokeStyle = '#D8A840'; g.lineWidth = 1; g.stroke();
      // een gouden versiering in het midden van elk vlak
      const mid = P(...rond(R_KAP + 0.05, am, H_KAP + 0.08)), sm = cam.F / mid[2];
      g.fillStyle = '#E8C060'; g.beginPath(); g.arc(mid[0], mid[1], Math.max(1, 0.06 * sm), 0, Math.PI * 2); g.fill();
    }
    // de bovenrand, goud
    g.strokeStyle = '#E0B44A'; g.lineWidth = 2;
    g.beginPath(); cirkel(R_KAP + 0.05, rand, 40, -Math.PI * 0.55, Math.PI * 0.55).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    // de kroon en het vaantje
    const top = P(0, H_TOP, 0), s = cam.F / top[2];
    g.fillStyle = '#D8A840';
    g.beginPath(); g.moveTo(top[0] - 0.5 * s, top[1]); g.lineTo(top[0] - 0.55 * s, top[1] - 0.45 * s); g.lineTo(top[0] - 0.25 * s, top[1] - 0.22 * s); g.lineTo(top[0], top[1] - 0.55 * s); g.lineTo(top[0] + 0.25 * s, top[1] - 0.22 * s); g.lineTo(top[0] + 0.55 * s, top[1] - 0.45 * s); g.lineTo(top[0] + 0.5 * s, top[1]); g.closePath(); g.fill();
    g.strokeStyle = '#5A3A20'; g.lineWidth = Math.max(1, 0.05 * s); g.beginPath(); g.moveTo(top[0], top[1] - 0.5 * s); g.lineTo(top[0], top[1] - 1.5 * s); g.stroke();
    const wap = Math.sin(t * 3) * 0.08 * s;
    g.fillStyle = '#C23A2C'; g.beginPath(); g.moveTo(top[0], top[1] - 1.5 * s); g.quadraticCurveTo(top[0] + 0.5 * s, top[1] - 1.45 * s + wap, top[0] + 1.0 * s, top[1] - 1.32 * s); g.lineTo(top[0], top[1] - 1.12 * s); g.closePath(); g.fill();
  }

  // de ringengalg: een paal met een arm over de rand van de molen; aan de arm hangt de ring. De ringenman hangt nieuwe ringen op.
  function tekenGalg(g, ring, man, t) {
    schermVlak(g);
    const voet = P(...rond(R_GALG, TH_GALG, 0)), top = P(...rond(R_GALG, TH_GALG, 2.75)), s = cam.F / voet[2];
    g.fillStyle = 'rgba(60, 40, 20, .25)'; g.beginPath(); g.ellipse(voet[0], voet[1], 0.4 * s, 0.1 * s, 0, 0, Math.PI * 2); g.fill();
    let gr = g.createLinearGradient(voet[0] - 0.1 * s, 0, voet[0] + 0.1 * s, 0);
    gr.addColorStop(0, '#8A6038'); gr.addColorStop(1, '#4A301A');
    g.fillStyle = gr; g.fillRect(voet[0] - 0.08 * s, top[1], 0.16 * s, voet[1] - top[1]);
    // de arm
    const arm0 = P(...rond(R_GALG, TH_GALG, 2.62)), arm1 = P(...rond(R_RING - 0.12, TH_RING - 0.02, 2.5));
    g.strokeStyle = '#5A3A20'; g.lineWidth = Math.max(2, 0.09 * s); g.lineCap = 'round';
    g.beginPath(); g.moveTo(arm0[0], arm0[1]); g.lineTo(arm1[0], arm1[1]); g.stroke();
    g.strokeStyle = '#8A6038'; g.lineWidth = Math.max(1, 0.04 * s);
    g.beginPath(); g.moveTo(arm0[0], arm0[1] - 1); g.lineTo(arm1[0], arm1[1] - 1); g.stroke();
    // een schuine steun
    const st = P(...rond(R_GALG, TH_GALG, 2.1)), sm = P(...rond((R_GALG + R_RING) / 2 + 0.3, (TH_GALG + TH_RING) / 2 + 0.04, 2.58));
    g.strokeStyle = '#5A3A20'; g.lineWidth = Math.max(1.5, 0.05 * s); g.beginPath(); g.moveTo(st[0], st[1]); g.lineTo(sm[0], sm[1]); g.stroke();
    // de ringhouder en de ring (die een beetje zwaait)
    const zw = ring ? ring.zwaai : 0;
    const houder = P(...rond(R_RING, TH_RING, 2.5)), hang = P(...rond(R_RING, TH_RING + zw, H_RING + 0.1));
    g.strokeStyle = '#3A3430'; g.lineWidth = Math.max(1, 0.02 * s);
    g.beginPath(); g.moveTo(houder[0], houder[1]); g.lineTo(hang[0], hang[1]); g.stroke();
    if (ring && ring.soort) {
      const rp = P(...rond(R_RING, TH_RING + zw, H_RING)), rs = cam.F / rp[2];
      if (ring.soort === 'goud') {
        const gl = g.createRadialGradient(rp[0], rp[1], 0, rp[0], rp[1], 0.4 * rs);
        gl.addColorStop(0, `rgba(255, 226, 130, ${0.35 + 0.15 * Math.sin(t * 6)})`); gl.addColorStop(1, 'rgba(255, 226, 130, 0)');
        g.fillStyle = gl; g.beginPath(); g.arc(rp[0], rp[1], 0.4 * rs, 0, Math.PI * 2); g.fill();
      }
      if (ring.soort !== 'goud') {
        const gl = g.createRadialGradient(rp[0], rp[1], 0, rp[0], rp[1], 0.26 * rs);
        gl.addColorStop(0, 'rgba(255, 240, 200, .35)'); gl.addColorStop(1, 'rgba(255, 240, 200, 0)');
        g.fillStyle = gl; g.beginPath(); g.arc(rp[0], rp[1], 0.26 * rs, 0, Math.PI * 2); g.fill();
      }
      tekenRingVorm(g, rp[0], rp[1], (ring.soort === 'goud' ? 0.07 : 0.085) * rs, (ring.soort === 'goud' ? 0.1 : 0.125) * rs, ring.soort, 0.15 - Math.PI / 2);
    }
    tekenMan(g, man, t);
    void gr;
  }
  // de ringenman: een man met een hoed en een schort, met een mand vol ringen; hij reikt omhoog om een ring op te hangen
  function tekenMan(g, man, t) {
    const pos = rond(R_GALG + 0.25, TH_GALG + 0.2, 0);
    const p = P(...pos), s = cam.F / p[2];
    figuur(g, pos[0], 0, pos[2], -1);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(60, 40, 20, .25)'; g.beginPath(); g.ellipse(0, 0.01, 0.4, 0.06, 0, 0, Math.PI * 2); g.fill();
    // benen
    g.strokeStyle = '#3A3430'; g.lineWidth = 0.13;
    g.beginPath(); g.moveTo(-0.06, 0.86); g.lineTo(-0.08, 0.06); g.moveTo(0.06, 0.86); g.lineTo(0.08, 0.06); g.stroke();
    g.fillStyle = '#1E1814'; [[-0.04, 0.03], [0.12, 0.03]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 0.12, 0.05, 0, 0, Math.PI * 2); g.fill(); });
    // jas en schort
    const gr = g.createLinearGradient(-0.2, 1.5, 0.2, 0.8);
    gr.addColorStop(0, '#7A5A3A'); gr.addColorStop(1, '#4A3020');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-0.2, 0.8); g.quadraticCurveTo(-0.24, 1.2, -0.16, 1.5); g.quadraticCurveTo(0, 1.56, 0.16, 1.5); g.quadraticCurveTo(0.24, 1.2, 0.2, 0.8); g.closePath(); g.fill();
    g.fillStyle = '#2E3A2E'; g.beginPath(); g.moveTo(-0.13, 1.46); g.lineTo(0.13, 1.46); g.lineTo(0.15, 0.96); g.lineTo(-0.15, 0.96); g.closePath(); g.fill();
    g.fillStyle = '#EDE6D6'; g.beginPath(); g.moveTo(-0.04, 1.52); g.lineTo(0.06, 1.52); g.lineTo(0.01, 1.4); g.closePath(); g.fill();
    g.fillStyle = '#D8A840'; [1.36, 1.24, 1.12].forEach((y) => { g.beginPath(); g.arc(0.1, y, 0.014, 0, Math.PI * 2); g.fill(); });
    // hoofd met een hoed
    g.fillStyle = '#E8C4A0'; g.beginPath(); g.arc(0.03, 1.66, 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#B07050'; g.beginPath(); g.arc(0.1, 1.64, 0.025, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2A2420'; g.beginPath(); g.ellipse(0.02, 1.76, 0.24, 0.04, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(-0.1, 1.76, 0.24, 0.16);
    g.fillStyle = '#8A2E22'; g.fillRect(-0.1, 1.77, 0.24, 0.03);
    // de mand met ringen
    g.fillStyle = '#B08A50'; g.beginPath(); g.moveTo(-0.34, 0.95); g.lineTo(-0.3, 0.72); g.lineTo(-0.06, 0.72); g.lineTo(-0.02, 0.95); g.closePath(); g.fill();
    g.strokeStyle = '#D8A85A'; g.lineWidth = 0.025; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-0.18 + (i - 1.5) * 0.06, 0.97, 0.05, 0.03, 0, 0, Math.PI * 2); g.stroke(); }
    // de arm: rust, of omhoog naar de houder als hij een nieuwe ring ophangt
    const op = man ? man.reik : 0;
    const hand = [0.02 - 0.55 * op, 1.0 + 1.15 * op];
    g.strokeStyle = '#6A4A2E'; g.lineWidth = 0.1;
    g.beginPath(); g.moveTo(0.0, 1.42); g.lineTo((hand[0] + 0.0) / 2 - 0.05 * op, (hand[1] + 1.42) / 2 + 0.05); g.lineTo(hand[0], hand[1]); g.stroke();
    g.fillStyle = '#E8C4A0'; g.beginPath(); g.arc(hand[0], hand[1], 0.05, 0, Math.PI * 2); g.fill();
    if (man && man.houdt) tekenRingVorm(g, hand[0], hand[1] + 0.08, 0.06, 0.1, man.houdt, 0);
    // de andere arm wijst naar de mand
    g.beginPath(); g.moveTo(0.0, 1.4); g.lineTo(-0.12, 1.12); g.lineTo(-0.2, 0.98); g.stroke();
    void s; void t;
  }

  // ============================================================
  // TWEE BEELDEN: het spel (dicht bij de ringengalg) en het plein (de hele kermis)
  // ============================================================
  const BEELD = { molen: { doek: null, ctx: null, L: 560, sc: 1, dpr: 1, achter: null, sleutel: '' }, plein: { doek: null, ctx: null, L: 560, sc: 1, dpr: 1, achter: null, sleutel: '' } };
  let beeld = BEELD.molen;
  function doekVan(soort) { return BEELD[soort].doek; }
  function zetCameraVoor(soort) {
    const b = BEELD[soort], hoog = b.L / B;
    if (soort === 'molen') {
      // naast de galg, net onder de kap: de paarden galopperen van links naar de ring
      if (hoog > 1.15) zetCamera([2.7, 3.15, 10.4], [1.45, 2.05, 2.6], 640, B / 2, b.L * 0.5);
      else zetCamera([2.6, 3.05, 10.8], [1.25, 2.05, 2.3], 470 + (1.15 - hoog) * 90, B / 2, b.L * 0.52);
    } else if (hoog > 1.15) {
      // het plein staand: van bovenaf, de molen achteraan, de koekkraam en de kop van Jut vooraan
      zetCamera([0, 10.5, 24.5], [0, 1.4, 1.8], 600, B / 2, b.L * 0.6);
    } else {
      // het plein liggend: alles naast elkaar (het beeld is altijd 400 punten breed; lager beeld = minder lucht)
      zetCamera([0, 7.2, 24], [0, 2.3 + (hoog - 0.5) * 2, 0.8], 405, B / 2, b.L * 0.52);
    }
    // de koekkraam en de kop van Jut staan staand dichter bij de camera
    KOEKKRAAM.x = hoog > 1.15 ? -2.9 : -7.4; KOEKKRAAM.z = hoog > 1.15 ? 10.2 : 4.4;
    KOPVANJUT.x = hoog > 1.15 ? 3.7 : 7.8; KOPVANJUT.z = hoog > 1.15 ? 9.6 : 3.6;
  }
  function gebruik(soort) {
    beeld = BEELD[soort];
    L = beeld.L; sc = beeld.sc; dpr = beeld.dpr; ctx = beeld.ctx; doek = beeld.doek;
    zetCameraVoor(soort);
  }
  function pasBeeldAan(soort, vak, breedte, hoogte) {
    const b = BEELD[soort];
    const plein = soort === 'plein';
    const nieuweL = Math.round(B * klem(hoogte / Math.max(1, breedte), plein ? 0.36 : 0.5, plein ? 2.4 : 1.9));
    const s = Math.max(0.4, Math.min(breedte / B, hoogte / nieuweL, plein ? 8 : 3.2));
    // niet meer dan zo'n 2600 beeldpunten breed: op een groot scherm blijft het vlot
    const nieuweDpr = Math.min(2.5, window.devicePixelRatio || 1, 2600 / (B * s));
    if (nieuweL === b.L && Math.abs(s - b.sc) < 0.001 && nieuweDpr === b.dpr && b.achter) return false;
    b.L = nieuweL; b.sc = s; b.dpr = nieuweDpr;
    vak.style.setProperty('--km-b', Math.round(B * s) + 'px');
    vak.style.setProperty('--km-h', Math.round(nieuweL * s) + 'px');
    b.doek.width = Math.round(B * s * nieuweDpr); b.doek.height = Math.round(nieuweL * s * nieuweDpr);
    b.achter = null;
    return true;
  }
  function tekenAchter(soort) {
    const b = BEELD[soort];
    if (!b.achter) { b.achter = maakAchter(soort); b.vignet = maakVignet(b); b.voor = soort === 'plein' ? maakVoor() : null; }
    b.ctx.setTransform(1, 0, 0, 1, 0, 0);
    b.ctx.drawImage(b.achter, 0, 0);
  }
  function maakVignet(b) {
    const c = document.createElement('canvas');
    c.width = b.doek.width; c.height = b.doek.height;
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const gr = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.36, w / 2, h * 0.5, Math.hypot(w, h) * 0.62);
    gr.addColorStop(0, 'rgba(30, 20, 8, 0)'); gr.addColorStop(1, 'rgba(30, 20, 8, .34)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return c;
  }

  // ============================================================
  // HET SPEL: wie steekt de meeste ringen?
  // ============================================================
  const tolerantie = (w, soort) => (0.13 - 0.045 * Math.min(1, w.ronde / 9)) * (soort === 'goud' ? 0.62 : 1);
  const omwenteling = (ronde) => 5.4 - 0.22 * Math.min(9, ronde);
  function maakWereld(r) {
    return { t: 0, phi: -3.7, omega: 0, doelOmega: 0, ruiters: [], meerijders: [], ring: { soort: 'koper', zwaai: 0, zv: 0 }, man: { reik: 0, houdt: null, klus: 0, nieuw: null }, goud: 0, r, actief: false, cb: null, ronde: 0, rondes: RONDES };
  }
  function maakRuiter(k, paard, look, mens, t) {
    return { k, paard, look, mens, t: t || null, ringen: [], punten: 0, pogingen: 0, uitslagen: [], steek: 0, steekT: -1, telt: false, gekeken: false, wil: 0, pas: null, plan: null, juich: 0, sip: 0, lans: true, wijs: mens, hand: null };
  }
  // de molen draait; de ring zwaait; de ringenman hangt nieuwe ringen op; de ruiters steken
  function stapWereld(w, dt) {
    w.t += dt;
    const dw = w.doelOmega - w.omega;
    w.omega += klem(dw, -0.55 * dt, 0.5 * dt);
    w.phi += w.omega * dt;
    const ring = w.ring;
    ring.zv += (-52 * ring.zwaai - 1.5 * ring.zv) * dt;
    ring.zwaai += ring.zv * dt;
    const man = w.man;
    if (man.klus > 0) {
      man.klus -= dt;
      const t = 1.05 - man.klus;
      if (t < 0.4) { man.reik = 0; man.houdt = t > 0.2 ? man.nieuw : null; }
      else if (t < 0.7) { man.reik = (t - 0.4) / 0.3; man.houdt = man.nieuw; }
      else if (t < 0.78) { man.reik = 1; if (!ring.soort) { ring.soort = man.nieuw; ring.zv = 0.6; if (w.cb && w.cb.nieuweRing) w.cb.nieuweRing(man.nieuw); } man.houdt = null; }
      else man.reik = Math.max(0, 1 - (t - 0.78) / 0.27);
      if (man.klus <= 0) { man.klus = 0; man.reik = 0; }
    }
    w.ruiters.forEach((rn) => stapRuiter(w, rn, dt));
  }
  function stapRuiter(w, rn, dt) {
    rn.juich = Math.max(0, rn.juich - dt); rn.sip = Math.max(0, rn.sip - dt);
    if (rn.steekT >= 0) {
      rn.steekT += dt;
      const s = rn.steekT;
      rn.steek = s < T_UIT ? s / T_UIT : s < T_UIT + 0.1 ? 1 : Math.max(0, 1 - (s - T_UIT - 0.1) / 0.14);
      if (!rn.gekeken && s >= T_UIT) { rn.gekeken = true; kijk(w, rn); }
      if (s > T_STEEK) { rn.steekT = -1; rn.steek = 0; }
    }
    // waar is de ring? tot = zoveel seconden tot de punt van de lans (uitgestoken) bij de ring is
    const a = paardHoek(w.phi, rn.paard), d = hoekVerschil(a + VOOR, TH_RING);
    const tot = w.omega > 0.05 ? -d / w.omega : Infinity;
    const inZone = tot <= ZONE[0] && tot >= -ZONE[1];
    if (inZone && !rn.pas) {
      rn.pas = { gebruikt: false, telt: w.actief && rn.pogingen < w.rondes };
      if (rn.pas.telt && !rn.mens) {
        const e = (rn.t.neiging || 0) + gauss(w.r) * rn.t.spreid;
        rn.plan = { t: w.t + tot - T_UIT + e };
      }
    }
    if (!inZone && rn.pas) {
      if (rn.pas.telt && !rn.pas.gebruikt) { registreer(w, rn, 'gemist'); if (w.cb && w.cb.gemist) w.cb.gemist(rn); }
      rn.pas = null; rn.plan = null;
    }
    if (!rn.mens && rn.plan && w.t >= rn.plan.t) { rn.plan = null; steek(w, rn); }
    if (rn.mens && rn.wil > 0) { rn.wil = 0; steek(w, rn); }
  }
  function steek(w, rn) {
    if (rn.steekT >= 0 && rn.steekT < T_STEEK * 0.8) return false;
    rn.steekT = 0; rn.gekeken = false;
    rn.telt = !!(rn.pas && rn.pas.telt && !rn.pas.gebruikt);
    if (rn.telt) rn.pas.gebruikt = true;
    if (w.cb && w.cb.steek) w.cb.steek(rn);
    return true;
  }
  // de lans is helemaal uitgestoken: zit de ring eraan?
  function kijk(w, rn) {
    const ring = w.ring, a = paardHoek(w.phi, rn.paard);
    const delta = hoekVerschil(a + VOOR, TH_RING + ring.zwaai);
    const e = delta / Math.max(0.05, w.omega);
    if (!rn.telt) { if (Math.abs(e) < 0.25) ring.zv += -Math.sign(e || 1) * 0.5; return; }
    const tol = tolerantie(w, ring.soort);
    if (ring.soort && Math.abs(e) < tol) {
      const soort = ring.soort;
      rn.ringen.push(soort); rn.punten += soort === 'goud' ? 3 : 1;
      ring.soort = null; ring.zv = 0; ring.zwaai = 0;
      // de ringenman pakt een nieuwe ring: soms een gouden
      const goud = w.ronde >= 2 && w.goud < 3 && w.r() < 0.18;
      if (goud) w.goud++;
      w.man.nieuw = goud ? 'goud' : 'koper'; w.man.klus = 1.05;
      registreer(w, rn, soort);
      if (w.cb && w.cb.raak) w.cb.raak(rn, soort, e);
    } else {
      if (Math.abs(e) < 0.3) ring.zv += -Math.sign(e || 1) * 0.9;
      registreer(w, rn, 'mis');
      if (w.cb && w.cb.mis) w.cb.mis(rn, e);
    }
  }
  function registreer(w, rn, uitkomst) {
    rn.pogingen++; rn.uitslagen.push(uitkomst);
    const telt = w.ruiters.filter((x) => x.lans);
    w.ronde = Math.min(...telt.map((x) => x.pogingen));
    if (w.actief) w.doelOmega = Math.PI * 2 / omwenteling(w.ronde);
    if (w.cb && w.cb.ronde) w.cb.ronde(rn);
  }

  // ---------- vonkjes (in wereldmaten) ----------
  function strooi(p, n) {
    if (rustig()) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) deeltjes.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 2, vy: 0.5 + Math.random() * 1.6, vz: (Math.random() - 0.5) * 1, leef: 0.8 + Math.random() * 0.4, rot: Math.random() * 6 });
  }
  function stapDeeltjes(dt) {
    deeltjes.forEach((q) => { q.vy -= 1.8 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.leef -= dt; q.rot += dt * 5; });
    deeltjes = deeltjes.filter((q) => q.leef > 0);
  }
  function tekenDeeltjes(g) {
    deeltjes.forEach((q) => {
      const p = P(q.x, q.y, q.z), s = cam.F / p[2], a = Math.min(1, q.leef * 2);
      schermVlak(g); g.translate(p[0], p[1]); g.rotate(q.rot);
      g.fillStyle = `rgba(255, 220, 120, ${a})`; g.beginPath();
      for (let i = 0; i < 4; i++) { const b = i * Math.PI / 2; g.lineTo(Math.cos(b) * 0.07 * s, Math.sin(b) * 0.07 * s); g.lineTo(Math.cos(b + 0.78) * 0.02 * s, Math.sin(b + 0.78) * 0.02 * s); }
      g.closePath(); g.fill();
    });
  }

  // ============================================================
  // HET SCHERM VAN HET SPEL
  // ============================================================
  const ringGezicht = (k) => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${k ? '#A9B98E' : '#9DBBD6'}"/>
    <path d="M10 62 L54 6" stroke="#5A3A1E" stroke-width="4.5" stroke-linecap="round"/>
    <g fill="none" stroke-width="4"><ellipse cx="22" cy="47" rx="7" ry="10" stroke="#8A6010" transform="rotate(38 22 47)"/><ellipse cx="29" cy="38" rx="7" ry="10" stroke="#B07A2A" transform="rotate(38 29 38)"/></g>
    <ellipse cx="44" cy="20" rx="8" ry="11" fill="none" stroke="#E0B44A" stroke-width="4.5" transform="rotate(38 44 20)"/></svg>`;
  const gezichtVan = (k) => (spelers[k] && spelers[k].persoon && window.Personen && Personen.gezicht[spelers[k].persoon] ? Personen.gezicht[spelers[k].persoon] : ringGezicht(k));

  function bouw() {
    podium = document.getElementById('rs-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#kermis" aria-label="Terug naar de kermis" title="Terug naar de kermis">${icoon('terug')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="rs-stand"></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeler" title="Kies je tegenspeler" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="km-veldvak rs-veldvak">
      <canvas class="km-doek rs-doek" role="application" tabindex="0" aria-label="Ringsteken. Tik als je paard bij de ring komt: dan steek je je lans uit. Met het toetsenbord: de spatiebalk."></canvas>
      <div class="rs-ronde" aria-live="polite"></div>
      <div class="hp-tel rs-tel" aria-hidden="true"></div>
      <div class="sj-pops rs-pops" aria-hidden="true"></div>
      <div class="sj-kaart rs-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="rs-stand"></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeler" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met wie rijd je mee?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders"></div>
        <div class="mo-menu-voet">
          <button class="mo-knop mo-geluid" type="button" aria-pressed="true" aria-label="Geluid" title="Geluid">${icoon('geluid')}<i class="streep"></i></button>
          <button class="mo-knop mo-muziek" type="button" aria-pressed="false" aria-label="Muziek" title="Muziek">${icoon('muziek')}<i class="streep"></i></button>
          <button class="mo-knop mo-nieuw" type="button" aria-label="Opnieuw beginnen" title="Opnieuw beginnen">${icoon('opnieuw')}</button>
        </div>
      </div>
    </div>`);
    const meldEl = html('<p class="sr-only" aria-live="polite"></p>');
    [boven, midden, onder, menu, meldEl].forEach((e) => podium.appendChild(e));
    ui = {
      kaart: [onder.querySelector('.mo-speler'), boven.querySelector('.mo-speler')],
      midden, vak: midden.querySelector('.rs-veldvak'), pops: midden.querySelector('.rs-pops'), uitslag: midden.querySelector('.rs-kaart'),
      tel: midden.querySelector('.rs-tel'), ronde: midden.querySelector('.rs-ronde'),
      meer: boven.querySelector('.mo-meer'), menu, lijst: menu.querySelector('.mo-tegenstanders'), meld: meldEl
    };
    BEELD.molen.doek = midden.querySelector('.rs-doek');
    BEELD.molen.ctx = BEELD.molen.doek.getContext('2d');
    BEELD.molen.doek.addEventListener('pointerdown', neer);
    BEELD.molen.doek.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', toets);
    ui.kaart[1].addEventListener('click', openMenu);
    ui.meer.addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('ringsteken'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', () => sluitMenu(true));
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(true); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(false); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(true); });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(ui.midden);
    window.addEventListener('resize', () => pasMaatAan());
    const les = document.getElementById('les');
    if (les && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (location.hash === '#ringsteken' && les.hidden) { lesDemo(null); hervat(); } }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
    }
    gebouwd = true;
  }
  function pasMaatAan() {
    if (!ui.midden || !BEELD.molen.doek) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let breed = r.width;
    if (window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches) {
      const pr = podium.getBoundingClientRect(), cs = getComputedStyle(podium);
      breed = pr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * 168 - 20;
    }
    if (pasBeeldAan('molen', podium, breed - 8, r.height - 8)) teken();
  }

  // ============================================================
  // DE LUS
  // ============================================================
  let rol = null;
  function lus(t) {
    raf = requestAnimationFrame(lus);
    const dt = vorigeT ? Math.min(0.05, (t - vorigeT) / 1000) : 0;
    vorigeT = t;
    if (W && !bevroren) {
      rest += dt;
      let n = 0;
      while (rest >= DT && n < 12) { stapWereld(W, DT); rest -= DT; n++; }
      if (fase === 'spel' || fase === 'aanloop' || fase === 'uit') { if (!rol) rol = Geluid.rollen(); rol.zet(W.omega * 1.1); } else stopRollen();
    }
    stapDeeltjes(dt);
    if (W) werkStandBij();
    teken();
  }
  function stopRollen() { if (rol) { rol.stop(); rol = null; } }
  function teken() {
    if (!BEELD.molen.ctx || !BEELD.molen.doek.width || !W) return;
    gebruik('molen');
    tekenAchter('molen');
    const g = ctx, ruiters = {};
    W.meerijders.forEach((m) => { ruiters[m.paard] = m; });
    W.ruiters.forEach((rn) => { ruiters[rn.paard] = rn; });
    tekenDraaimolen(g, { phi: W.phi, ruiters, t: W.t });
    tekenGalg(g, W.ring, W.man, W.t);
    tekenDeeltjes(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (BEELD.molen.vignet) g.drawImage(BEELD.molen.vignet, 0, 0);
  }

  // ============================================================
  // HET SPELVERLOOP
  // ============================================================
  function nieuwePartij() {
    spelId++;
    if (tegen) spelers = [{ naam: 'Jij', mens: true, look: 'jij' }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, look: tegen.id }];
    else spelers = [{ naam: 'Speler 1', mens: true, look: 'jij' }, { naam: 'Speler 2', mens: true, look: 'twee' }];
    winnaar = -1; potjes++; herstart = null; bevroren = false; deeltjes = [];
    if (ui.uitslag) ui.uitslag.hidden = true;
    W = maakWereld(zaad(Math.floor(rnd() * 1e9)));
    W.cb = LIVE;
    W.ruiters = [maakRuiter(0, 0, spelers[0].look, true), maakRuiter(1, 4, spelers[1].look, spelers[1].mens, spelers[1].t)];
    // twee kinderen rijden alleen een rondje mee
    W.meerijders = [{ paard: 2, look: 'meisje', lans: false, juich: 0, sip: 0 }, { paard: 6, look: 'jongen', lans: false, juich: 0, sip: 0 }];
    stopRollen();
    werkKaartenBij(); werkRondeBij();
    if (tegen) setTimeout(() => zeg(1, 'start'), 600);
    meld(tegen ? `Nieuw spel tegen ${tegen.naam}. Wie steekt de meeste ringen in tien rondjes?` : 'Nieuw spel met z\'n tweeën.');
    aanloop(false);
  }
  // de molen komt op gang: drie, twee, één, en dan steken maar
  function aanloop(verder) {
    const id = ++spelId;
    fase = 'aanloop';
    W.actief = false;
    W.doelOmega = Math.PI * 2 / omwenteling(W.ronde);
    const zet = (tekst, groot) => {
      if (!ui.tel) return;
      ui.tel.innerHTML = `<b class="${groot ? 'groot' : ''}"></b>`;
      ui.tel.querySelector('b').textContent = tekst;
      ui.tel.classList.remove('in'); void ui.tel.offsetWidth; ui.tel.classList.add('in');
    };
    const stappen = verder ? [] : ['3', '2', '1'];
    const duur = rustig() ? 350 : 640;
    let i = 0;
    const volgende = () => {
      if (id !== spelId) return;
      if (i < stappen.length) { zet(stappen[i], true); Geluid.tel(); i++; setTimeout(volgende, duur); return; }
      zet(verder ? 'Verder!' : 'Steken maar!', false);
      Geluid.start();
      fase = 'spel'; W.actief = true;
      werkKaartenBij();
      setTimeout(() => { if (ui.tel && fase === 'spel') ui.tel.innerHTML = ''; }, 900);
    };
    setTimeout(volgende, verder ? 200 : (rustig() ? 200 : 600));
  }
  const LIVE = {
    steek(rn) { if (rn.mens) { Geluid.woesj(); if (window.Tril) Tril.tik(); } },
    raak(rn, soort) {
      Geluid.ring(soort === 'goud');
      strooi(rond(R_RING, TH_RING, H_RING), soort === 'goud' ? 14 : 7);
      rn.juich = 0.8;
      if (rn.mens) { pop(soort === 'goud' ? 'Goud!' : willekeurig(['Raak!', 'Hebbes!', 'Mooi!']), soort === 'goud' ? 'goed groot' : 'goed'); if (window.Tril) Tril.klik(); }
      else if (Math.random() < 0.45) zeg(rn.k, soort === 'goud' ? 'goud' : 'raak');
      werkKaartenBij();
    },
    mis(rn, e) {
      if (rn.mens) pop(e < 0 ? 'Te vroeg' : 'Te laat', 'zacht');
      else if (Math.random() < 0.5) zeg(rn.k, 'mis');
      rn.sip = 0.6;
      werkKaartenBij();
    },
    gemist(rn) { if (rn.mens) pop('Tik bij de ring!', 'zacht'); werkKaartenBij(); },
    nieuweRing(soort) { Geluid.pak(); if (soort === 'goud') { Geluid.kling(); meld('De ringenman hangt een gouden ring op.'); } },
    ronde() { werkRondeBij(); kijkKlaar(); }
  };
  // zijn alle rondjes gereden? Bij gelijke stand rijdt iedereen nog een rondje
  function kijkKlaar() {
    if (fase !== 'spel') return;
    const rs = W.ruiters;
    if (rs.some((rn) => rn.pogingen < W.rondes)) return;
    if (rs[0].punten === rs[1].punten) { W.rondes++; banier('Gelijk!', 'Nog één rondje'); werkRondeBij(); return; }
    winnaar = rs[0].punten > rs[1].punten ? 0 : 1;
    fase = 'uit'; W.actief = false; W.doelOmega = 0;
    rs[winnaar].juich = 3; rs[1 - winnaar].sip = 3;
    werkKaartenBij();
    const id = spelId;
    setTimeout(() => { if (id === spelId) einde(winnaar); }, rustig() ? 500 : 1700);
  }
  function einde(w) {
    fase = 'klaar';
    stopRollen();
    werkKaartenBij();
    const p0 = W.ruiters[0].punten, p1 = W.ruiters[1].punten, sub = `${Math.max(p0, p1)} tegen ${Math.min(p0, p1)}`;
    let bedrag, tekst, verderKnop = null, gewonnenSpel = false;
    if (!tegen) {
      bedrag = 20; gewonnenSpel = true; tekst = `${naamVan(w)} stak de meeste ringen: ${sub}!`;
      banier(`${naamVan(w)} wint!`, sub);
      Geluid.tada(); vonken(30);
    } else if (w === 0) {
      const telling = gewonnen(), eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('ring-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true; tekst = `Gewonnen van ${tegen.naam}: ${sub}!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} wil nu ook ringsteken!`;
        verderKnop = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('rs-tegen', volgende.id); nieuwePartij(); } };
      }
      banier('Gewonnen!', sub);
      Geluid.tada(); vonken(40);
      zeg(1, 'verliest');
    } else {
      bedrag = 10; tekst = `${tegen.naam} stak de meeste ringen: ${sub}. Goed geprobeerd!`;
      banier(`${tegen.naam} wint`, sub);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'ringsteken', bedrag, gewonnen: gewonnenSpel, tekst, verder: verderKnop, wacht: 2400 });
    const id = spelId;
    setTimeout(() => {
      if (fase !== 'klaar' || id !== spelId || !ui.uitslag) return;
      ui.uitslag.innerHTML = `<b>${tegen ? (w === 0 ? 'Gewonnen!' : 'Volgende keer beter') : `${naamVan(w)} wint!`}</b><span>${sub}</span><button class="knop rs-weer" type="button">${icoon('opnieuw')}Nog een rit</button>`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.rs-weer').addEventListener('click', () => nieuwePartij());
    }, 2300);
  }

  // ============================================================
  // TIKKEN: de tik telt voor wie bij de ring is (met z'n tweeën rijden jullie tegenover elkaar)
  // ============================================================
  function tik() {
    if (!W || fase !== 'spel') return;
    const mensen = W.ruiters.filter((rn) => rn.mens);
    let rn = mensen.find((x) => x.pas && x.pas.telt && !x.pas.gebruikt);
    if (!rn) rn = mensen.slice().sort((a, b) => Math.abs(hoekVerschil(paardHoek(W.phi, a.paard) + VOOR, TH_RING)) - Math.abs(hoekVerschil(paardHoek(W.phi, b.paard) + VOOR, TH_RING)))[0];
    if (rn) rn.wil = 1;
  }
  function neer(e) {
    if (!W || lesOpen() || fase === 'klaar') return;
    e.preventDefault();
    try { BEELD.molen.doek.focus({ preventScroll: true }); } catch (er) { /* */ }
    tik();
  }
  function toets(e) {
    if (location.hash !== '#ringsteken' || !W || lesOpen() || (ui.menu && !ui.menu.hidden)) return;
    const a = document.activeElement;
    if (a && a !== document.body && a !== BEELD.molen.doek) return;
    const t = (e.key || '').toLowerCase();
    if (![' ', 'enter', 'arrowup', 'arrowright', 'a', 'l'].includes(t)) return;
    e.preventDefault();
    if (e.repeat) return;
    tik();
  }

  // ============================================================
  // KAARTEN, PRAATJES EN BERICHTEN
  // ============================================================
  let standSleutel = '';
  function hint(rn) {
    if (fase !== 'spel' || !rn.mens) return '';
    if (rn.pas && rn.pas.telt && !rn.pas.gebruikt) return 'nu';
    return '';
  }
  function werkStandBij() {
    if (!ui.kaart || !W) return;
    const sl = W.ruiters.map((rn) => hint(rn) + rn.pogingen + ':' + rn.punten).join('|') + fase;
    if (sl !== standSleutel) { standSleutel = sl; werkKaartenBij(); }
  }
  function werkRondeBij() {
    if (!ui.ronde || !W) return;
    const r = Math.min(W.rondes, W.ronde + 1);
    ui.ronde.innerHTML = W.rondes > RONDES ? '<b>Nog één rondje</b>' : `<b>Rondje ${r} van ${W.rondes}</b>`;
  }
  function werkKaartenBij() {
    if (!ui.kaart || !spelers.length || !W) return;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k], p = spelers[k], rn = W.ruiters[k];
      kaart.classList.toggle('aan', fase === 'spel' && !!(rn.pas && rn.pas.telt && !rn.pas.gebruikt));
      kaart.classList.toggle('rs-winnaar', (fase === 'klaar' || fase === 'uit') && winnaar === k);
      const gz = kaart.querySelector('.mo-gezicht'), wie = p.persoon || 'ring' + k;
      if (gz.getAttribute('data-wie') !== wie) { gz.innerHTML = gezichtVan(k); gz.setAttribute('data-wie', wie); }
      kaart.querySelector('.mo-naam').textContent = p.naam;
      const doe = kaart.querySelector('.mo-doe');
      const h = hint(rn), tekst = h === 'nu' ? 'Steek!' : '';
      const inh = tekst ? `<span>${tekst}</span>` : '';
      if (doe.getAttribute('data-hint') !== inh) { doe.innerHTML = inh; doe.setAttribute('data-hint', inh); }
      // de stand: tien rondjes, en voor elke ring een ringetje
      const vakjes = Array.from({ length: Math.max(W.rondes, rn.pogingen) }, (_, i) => {
        const u = rn.uitslagen[i];
        return `<i class="rs-vak${u === 'koper' ? ' koper' : u === 'goud' ? ' goud' : u ? ' mis' : ''}"></i>`;
      }).join('');
      const stand = kaart.querySelector('.rs-stand');
      const inhoud = `<b class="rs-punten">${rn.punten}</b><span class="rs-vakjes">${vakjes}</span>`;
      if (stand._inh !== inhoud) { stand._inh = inhoud; stand.innerHTML = inhoud; }
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-ster"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', `${tegen ? 'Tegenspeler: ' + tegen.naam : 'Speler 2'}, ${rn.punten} punten. Tik om te wisselen`);
      } else kaart.setAttribute('aria-label', `${p.naam}, ${rn.punten} punten`);
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
    zeg.t = setTimeout(() => { b.hidden = true; }, soort === 'wint' || soort === 'verliest' ? 4000 : 2000);
  }
  function pop(tekst, soort) {
    if (!ui.pops || !BEELD.molen.doek) return;
    gebruik('molen');
    const e = document.createElement('span');
    e.className = 'sj-pop rs-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekst;
    const rv = ui.vak.getBoundingClientRect(), r = BEELD.molen.doek.getBoundingClientRect(), p = P(...rond(R_RING, TH_RING, H_RING + 0.7));
    e.style.left = klem(r.left - rv.left + p[0] * sc, 50, rv.width - 50) + 'px';
    e.style.top = klem(r.top - rv.top + p[1] * sc, 30, rv.height - 20) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), 1500);
  }
  function banier(titel, sub) {
    if (!ui.vak) return;
    ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    const b = document.createElement('div');
    b.className = 'sj-banier rs-banier';
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
  // KEUZEMENU
  // ============================================================
  function openMenu() {
    onderbreek();
    tekenMenu(); werkSchakelaars();
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
      const pips = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-ster"/></svg>`).join('')}</span>`;
      const gezichtje = t === TWEE ? `<span class="mo-twee">${ringGezicht(0)}${ringGezicht(1)}</span>` : (window.Personen ? Personen.gezicht[t.id] : '');
      b.innerHTML = `<span class="mo-gezicht">${gezichtje}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span>
        <span class="mo-keuze-naam">${t.naam}</span>${pips}
        ${t !== TWEE && open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${t.beloning}</span>` : ''}`;
      b.setAttribute('aria-label', t === TWEE ? 'Met z\'n tweeën op dit toestel: wie bij de ring komt, tikt' : `${t.naam}, niveau ${t.niveau} van 4${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`);
      b.addEventListener('click', () => {
        if (!open) { b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud'); if (window.Tril) Tril.fout(); Geluid.pak(); return; }
        tegen = t === TWEE ? null : t;
        if (window.Duiten) Duiten.zetVeld('rs-tegen', t.id);
        sluitMenu(false);
        nieuwePartij();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // ONDERBREKEN EN HERVATTEN
  // ============================================================
  function onderbreek() {
    if (ui.vak) ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    stopRollen();
    if (!gebouwd || !W || bevroren) return;
    if (fase === 'aanloop' || fase === 'spel') herstart = 'verder';
    else if (fase === 'uit') herstart = 'einde';
    spelId++;
    bevroren = true;
    W.actief = false;
    W.ruiters.forEach((rn) => { rn.wil = 0; rn.plan = null; if (rn.pas) rn.pas.telt = false; });
    if (ui.tel) ui.tel.innerHTML = '';
    if (fase === 'aanloop' || fase === 'spel') fase = 'pauze';
  }
  function hervat() {
    if (!gebouwd || lesOpen() || !W || (ui.menu && !ui.menu.hidden)) return;
    bevroren = false;
    const h = herstart; herstart = null;
    if (h === 'einde' && winnaar >= 0) { einde(winnaar); return; }
    if (h === 'verder') aanloop(true);
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function lesDemo(soort) {
    if (!gebouwd || soort === lesSoort || !W) return;
    if (!lesSoort && soort) {
      onderbreek();
      lesBewaard = { W, uitslag: !!ui.uitslag && !ui.uitslag.hidden };
      if (ui.uitslag) ui.uitslag.hidden = true;
      const w = maakWereld(zaad(77));
      w.ruiters = [maakRuiter(0, 0, spelers[0].look, true), maakRuiter(1, 4, spelers[1].look, spelers[1].mens, spelers[1].t)];
      w.meerijders = W.meerijders;
      w.ruiters[0].ringen = ['koper', 'koper', 'goud'];
      W = w;
    }
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) { W = lesBewaard.W; if (lesBewaard.uitslag && fase === 'klaar' && ui.uitslag) ui.uitslag.hidden = false; lesBewaard = null; }
      return;
    }
    // jouw paard vlak voor de ring
    const rn = W.ruiters[0];
    W.phi = TH_RING - VOOR - 0.32; W.omega = 0;
    W.ring.soort = soort === 'goud' ? 'goud' : 'koper'; W.ring.zwaai = 0; W.ring.zv = 0;
    rn.steek = soort === 'steek' ? 1 : 0;
    if (soort === 'steek') W.phi = TH_RING - VOOR - 0.03;
  }
  const vakOm = (pt, r) => {
    gebruik('molen');
    const d = BEELD.molen.doek.getBoundingClientRect(), p = P(...pt), m = cam.F / p[2] * sc;
    return { left: d.left + p[0] * sc - r * m, top: d.top + p[1] * sc - r * m, width: 2 * r * m, height: 2 * r * m };
  };
  if (window.Les) {
    Les.zet('ringsteken', () => [
      { doel: () => { lesDemo('kijk'); const a = paardHoek(W.phi, 0); return vakOm(rond(R_PAARD, a, H_ZADEL + paardOp(W.phi, 0) + 0.3), 1.2); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Dit ben jij, op je paard in de draaimolen' },
      { doel: () => { lesDemo('kijk'); return vakOm(rond(R_RING, TH_RING, H_RING), 0.55); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Aan de galg hangt een ring. Elk rondje kom je er één keer langs' },
      { doel: () => { lesDemo('steek'); return vakOm(rond(R_RING, TH_RING, H_RING), 0.8); }, vorm: 'rond', gebaar: 'tik', tekst: 'Tik als je bij de ring komt: je steekt je lans uit. Raak? Dan schuift de ring erop' },
      { doel: () => { lesDemo('goud'); return vakOm(rond(R_RING, TH_RING, H_RING), 0.55); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Een gouden ring telt drie keer. Die is wel kleiner' },
      { doel: () => { lesDemo(null); return ui.kaart[0].querySelector('.rs-stand'); }, marge: 8, gebaar: 'wijs', tekst: 'Na tien rondjes wint wie de meeste ringen heeft. De molen gaat steeds harder' },
      { doel: () => { lesDemo(null); return ui.meer; }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je met wie je meerijdt, of speel je met z\'n tweeën' }
    ]);
  }

  // ============================================================
  // HET KERMISPLEIN: de draaimolen in het midden, de koekkraam en de kop van Jut
  // ============================================================
  let plein = null, pleinRaf = 0, pleinT = 0, pleinPhi = 0;
  function bouwPlein() {
    const zaal = document.getElementById('km-plein');
    if (!zaal) return;
    zaal.innerHTML = `<header class="km-kop">
        <a class="mo-knop km-terug" href="#" aria-label="Terug naar de gracht" title="Terug naar de gracht">${icoon('terug')}</a>
        <p class="km-naam">De kermis</p>
        <span class="pk-saldo km-saldo" aria-label="Duiten"><svg class="duit" aria-hidden="true"><use href="#i-duit"/></svg><b class="km-saldo-getal">0</b></span>
      </header>
      <div class="km-vak"><div class="km-veldvak">
        <canvas class="km-doek" aria-hidden="true"></canvas>
        <a class="km-plek" href="#ringsteken" data-plek="molen" aria-label="Ringsteken in de draaimolen"><span class="km-bord">Ringsteken</span></a>
        <a class="km-plek" href="#koekhappen" data-plek="koek" aria-label="Koekhappen bij de koekkraam"><span class="km-bord">Koekhappen</span></a>
        <button class="km-plek dicht" type="button" data-plek="jut" aria-label="Kop van Jut, binnenkort"><span class="km-bord">Kop van Jut</span><span class="km-later">binnenkort</span></button>
      </div></div>`;
    BEELD.plein.doek = zaal.querySelector('.km-doek');
    BEELD.plein.ctx = BEELD.plein.doek.getContext('2d');
    zaal.querySelector('[data-plek="jut"]').addEventListener('click', (e) => {
      const b = e.currentTarget; b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
      Geluid.pak(); if (window.Tril) Tril.fout();
    });
    zaal.querySelectorAll('a.km-plek').forEach((a) => a.addEventListener('click', () => Geluid.deur()));
    plein = { zaal, vak: zaal.querySelector('.km-vak'), veld: zaal.querySelector('.km-veldvak') };
    if ('ResizeObserver' in window) new ResizeObserver(() => pasPleinAan()).observe(plein.vak);
    window.addEventListener('resize', () => pasPleinAan());
  }
  function pasPleinAan() {
    if (!plein || !BEELD.plein.doek) return;
    const r = plein.vak.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pasBeeldAan('plein', plein.veld, r.width, r.height);
    gebruik('plein');
    // de plekken: knoppen over de attracties heen, met een messing bordje eronder
    const zet = (sleutel, x0, y0, x1, y1) => {
      const e = plein.zaal.querySelector(`[data-plek="${sleutel}"]`);
      e.style.left = (x0 * sc) + 'px'; e.style.top = (y0 * sc) + 'px'; e.style.width = ((x1 - x0) * sc) + 'px'; e.style.height = ((y1 - y0) * sc) + 'px';
    };
    const kap = P(-R_KAP, H_TOP + 0.6, 0), voet = P(R_KAP, 0, R_VLOER);
    zet('molen', kap[0], kap[1], voet[0], voet[1]);
    const k0 = P(KOEKKRAAM.x - KOEKKRAAM.b / 2 - 0.3, 3.6, KOEKKRAAM.z), k1 = P(KOEKKRAAM.x + KOEKKRAAM.b / 2 + 0.3, 0, KOEKKRAAM.z);
    zet('koek', k0[0], k0[1], k1[0], k1[1]);
    const j0 = P(KOPVANJUT.x - 1.3, 6.2, KOPVANJUT.z), j1 = P(KOPVANJUT.x + 0.7, 0, KOPVANJUT.z);
    zet('jut', j0[0], j0[1], j1[0], j1[1]);
  }
  function pleinLus(t) {
    pleinRaf = requestAnimationFrame(pleinLus);
    const dt = pleinT ? Math.min(0.05, (t - pleinT) / 1000) : 0;
    pleinT = t;
    pleinPhi += dt * 0.75;
    if (!BEELD.plein.ctx || !BEELD.plein.doek.width) return;
    gebruik('plein');
    tekenAchter('plein');
    const g = ctx;
    const ruiters = { 0: { look: 'mieke', lans: false, juich: 0, sip: 0 }, 2: { look: 'jongen', lans: false, juich: 0, sip: 0 }, 5: { look: 'meisje', lans: false, juich: 0, sip: 0 }, 6: { look: 'teun', lans: false, juich: 0, sip: 0 } };
    tekenDraaimolen(g, { phi: pleinPhi, ruiters, t: t / 1000 });
    tekenGalg(g, { soort: 'koper', zwaai: Math.sin(t / 700) * 0.01 }, { reik: 0 }, t / 1000);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (BEELD.plein.voor) g.drawImage(BEELD.plein.voor, 0, 0);
    if (BEELD.plein.vignet) g.drawImage(BEELD.plein.vignet, 0, 0);
  }
  window.Kermis = {
    start() {
      if (!plein) bouwPlein();
      const s = plein && plein.zaal.querySelector('.km-saldo-getal');
      if (s && window.Duiten) s.textContent = Duiten.saldo;
      requestAnimationFrame(() => {
        BEELD.plein.achter = null;
        pasPleinAan();
        cancelAnimationFrame(pleinRaf); pleinT = 0;
        pleinRaf = requestAnimationFrame(pleinLus);
      });
    },
    stop() { cancelAnimationFrame(pleinRaf); }
  };

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.ringsteken = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaardT = window.Duiten ? Duiten.veld('rs-tegen', 'mieke') : 'mieke';
        const t = TEGENSTANDERS.find((x) => x.id === bewaardT);
        tegen = bewaardT === 'twee' ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste || !W) nieuwePartij();
        else { werkKaartenBij(); hervat(); }
        cancelAnimationFrame(raf);
        vorigeT = 0;
        raf = requestAnimationFrame(lus);
        if (window.Les) Les.eersteKeer('ringsteken');
      });
    },
    stop() {
      cancelAnimationFrame(raf);
      onderbreek();
      stopRollen();
      if (ui.menu) ui.menu.hidden = true;
    },
    opnieuw() { nieuwePartij(); },
    _toestand() {
      return {
        fase, winnaar, tegen: tegen ? tegen.id : 'twee', L: BEELD.molen.L, sc: BEELD.molen.sc, bevroren,
        ronde: W ? W.ronde : 0, rondes: W ? W.rondes : 0, omega: W ? W.omega : 0, ring: W ? W.ring.soort : null,
        ruiters: W ? W.ruiters.map((rn) => ({ punten: rn.punten, pogingen: rn.pogingen, uitslagen: rn.uitslagen.slice(), pas: !!(rn.pas && rn.pas.telt && !rn.pas.gebruikt) })) : []
      };
    },
    _test: {
      zaad(n) { rnd = n === undefined ? Math.random : zaad(n); },
      wereld() { return W; },
      tik() { tik(); },
      // tot wanneer moet ik wachten? (voor een tik-robot): seconden tot de lans bij de ring is
      tot(k) { if (!W) return null; const rn = W.ruiters[k || 0], a = paardHoek(W.phi, rn.paard), d = hoekVerschil(a + VOOR, TH_RING + W.ring.zwaai); return W.omega > 0.05 ? -d / W.omega : null; },
      T_UIT,
      // hele spellen in stilte, om de tegenspelers af te stemmen
      sim(idA, idB, n, seed) {
        const zoek = (id) => (typeof id === 'object' ? id : id === 'mens' ? MENS_MODEL : TEGENSTANDERS.find((x) => x.id === id));
        const ai = [zoek(idA), zoek(idB)];
        const r = zaad(seed || 5);
        const uit = { a: 0, b: 0, gelijk: 0, punten: [0, 0], goud: [0, 0] };
        for (let s = 0; s < (n || 50); s++) {
          const w = maakWereld(r);
          w.cb = { ronde() {
            if (w.ruiters.every((rn) => rn.pogingen >= w.rondes)) { if (w.ruiters[0].punten === w.ruiters[1].punten) w.rondes++; else w.klaar = true; }
          } };
          w.ruiters = [maakRuiter(0, 0, 'jij', false, ai[0]), maakRuiter(1, 4, 'jij', false, ai[1])];
          w.actief = true; w.doelOmega = Math.PI * 2 / omwenteling(0); w.omega = w.doelOmega;
          let t = 0;
          while (!w.klaar && t < 300) { stapWereld(w, DT); t += DT; }
          const [a, b] = w.ruiters.map((rn) => rn.punten);
          if (a > b) uit.a++; else if (b > a) uit.b++; else uit.gelijk++;
          w.ruiters.forEach((rn, i) => { uit.punten[i] += rn.punten; uit.goud[i] += rn.ringen.filter((x) => x === 'goud').length; });
        }
        const m = n || 50;
        uit.punten = uit.punten.map((x) => +(x / m).toFixed(1)); uit.goud = uit.goud.map((x) => +(x / m).toFixed(2));
        return uit;
      }
    }
  };
})();
