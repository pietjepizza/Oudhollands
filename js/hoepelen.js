/* Hoepelen, schermvullend: een hoepelrace langs de gracht, tot boven op de brug.

   Zo ging het vroeger:
   - kinderen dreven een houten hoepel voort met een stokje; vaak een oude hoepel van een ton van de kuiper;
   - op Delftse tegels uit de zeventiende eeuw zie je jongens met een hoepel en een stok (Museum De Lakenhal);
   - op Bruegels Kinderspelen (1560) begint een hoepelrace, en sommige hoepels hadden belletjes of plaatjes die
     rinkelden als ze rolden (zo tekende Gesina ter Borch haar neefje Cornelis Schellinger, omstreeks 1675-1685).

   Speelgevoel: tik, en je kind geeft de hoepel een tik met de stok. Het beste is vlak voor de stok (dan glimt hij):
   dan gaat de hoepel het hardst en loopt hij het rechtst. Te langzaam? Dan gaat hij wiebelen en valt hij om. Te hard?
   Dan loopt hij van je weg en gaat hij slingeren. Met vaart wip je over een losse kei; voor een gans die oversteekt
   houd je even in. Wie het eerst met zijn hoepel boven op de brug is, wint. */
(function () {
  'use strict';

  // ============================================================
  // MATEN (in meters, y omhoog; het beeld rekt mee met het scherm)
  // ============================================================
  const B = 400, DT = 1 / 120;
  const R = 0.33;                       // straal van de hoepel
  const D_OPT = 0.74, ZONE = [0.42, 1.12];  // waar de hoepel moet zijn als de stok hem raakt (vanaf het kind)
  const V_KRIT = 1.3, V_WILD = 5.9;     // onder V_KRIT gaat hij wiebelen, boven V_WILD slingeren
  const WRIJF0 = 0.5, WRIJF2 = 0.058;   // rolweerstand en luchtweerstand
  const AFKOEL = 0.2;                   // zo lang duurt een slag
  const KIND_OP = 5.2, KIND_AF = 8;      // zo snel trekt een kind op en remt het af (m/s²)
  const BAAN_Z = [0, 1];                // baan 0 vooraan (bij jou), baan 1 achter (bij het water)
  const LENGTES = { kort: 130, lang: 220 };
  const BRUG = 11, BRUG_H = 1.25;       // de brug: zo lang is de oprit, zo hoog de top (de finish)

  // Hoe de kinderen eruitzien (dezelfde kleren als op hun portretje)
  const UITERLIJK = {
    jij: { huid: '#F3CFAE', haar: '#7A4A22', hoed: 'stro', kleed: 'kiel', kleur: '#5D86B4', kleur2: '#3B3A48', voet: 'klomp' },
    twee: { huid: '#EBC3A0', haar: '#3E2A1A', hoed: 'muts', muts: '#B3362A', kleed: 'kiel', kleur: '#7A8656', kleur2: '#3A342E', voet: 'klomp' },
    jantje: { huid: '#F4CDA8', haar: '#C9732E', hoed: 'pet', pet: '#2C4A7C', kleed: 'kiel', kleur: '#B6452C', kleur2: '#2E3242', voet: 'schoen', sproet: true },
    mieke: { huid: '#F8DCC2', haar: '#9A5A2C', hoed: 'strik', strik: '#C8382B', kleed: 'jurk', kleur: '#3F6EA6', kleur2: '#2A2A38', schort: '#EFE6D2', voet: 'schoen' },
    trijntje: { huid: '#F3D1B1', haar: '#5A3820', hoed: 'hul', kleed: 'jurk', kleur: '#4F7A4A', kleur2: '#2A2A28', schort: '#ECE5D6', voet: 'klomp', sproet: true },
    teun: { huid: '#F2CBA6', haar: '#D9A94E', hoed: 'bakker', kleed: 'kiel', kleur: '#EFEAE0', kleur2: '#3A3A44', voet: 'klomp', meel: true }
  };

  // ============================================================
  // TEGENSPELERS: hoe hard ze kunnen rennen, welke vaart ze willen houden, hoe zuiver ze tikken
  // en hoe vaak ze een gans of een kei verkeerd inschatten
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'mieke', niveau: 1, beloning: 25, ren: 4.4, doel: 3.3, mik: 0.18, fout: 0.36, traag: 0.34,
      zegt: { start: ['Ik heb een hoepel van de kuiper!', 'Klaar? Hup!'], val: ['Oei, hij valt!', 'Ach, mijn hoepel!'], gans: ['Ga weg, gans!', 'Gak gak!'], wint: ['Eerst bij de brug!', 'Gewonnen!'], verliest: ['Jij bent vlug!', 'Nog een keer?'] } },
    { id: 'teun', niveau: 2, beloning: 40, ren: 4.85, doel: 4.0, mik: 0.12, fout: 0.24, traag: 0.24,
      zegt: { start: ['Eerst de broodjes, dan hoepelen.', 'Let op!'], val: ['Hè, ik struikel.', 'Die kei!'], gans: ['Hu, die gans!', 'Gaat-ie, gaat-ie...'], wint: ['Vers van de brug!', 'Gewonnen!'], verliest: ['Petje af!', 'Jij was vlugger.'] } },
    { id: 'trijntje', niveau: 3, beloning: 60, ren: 5.15, doel: 4.45, mik: 0.08, fout: 0.14, traag: 0.18,
      zegt: { start: ['Rustig tikken, dan rolt hij recht.', 'Klaar?'], val: ['Hm, te langzaam.', 'Ach.'], gans: ['Even wachten, gansje.', 'Eerst jij, gans.'], wint: ['Boven!', 'Zo gaat dat.'], verliest: ['Knap gedaan!', 'Jij kunt het!'] } },
    { id: 'jantje', niveau: 4, beloning: 90, ren: 5.5, doel: 4.95, mik: 0.045, fout: 0.06, traag: 0.12,
      zegt: { start: ['Ik ben de snelste van de gracht!', 'Kijk mij eens hoepelen!'], val: ['Dat telt niet!', 'Oeps!'], gans: ['Hop, erlangs!', 'Opzij, gans!'], wint: ['Eerst! Zoals altijd.', 'De snelste van de gracht!'], verliest: ['Jij bent sneller dan ik!', 'Nog een keer!'] } }
  ];
  TEGENSTANDERS.forEach((t) => { t.naam = window.Personen ? (Personen.namen[t.id] || t.id) : t.id; });
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  // een mens die goed oplet (om de tegenspelers af te stemmen)
  const MENS_MODEL = { ren: 5.4, doel: 4.7, mik: 0.08, fout: 0.15, traag: 0.2 };
  const REN_MENS = 5.4;

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, doek, ctx, ui = {}, gebouwd = false, raf = 0, vorigeT = 0, rest = 0;
  let L = 560, sc = 1, dpr = 1, S = 50, camX = 0, achter = null;
  let tegen = TEGENSTANDERS[0], lengte = 'lang', potjes = 0;
  let spelers = [], fase = 'klaar', spelId = 0, winnaar = -1, W = null, bevroren = false;
  let lesSoort = null, lesBewaard = null;
  let deeltjes = [], vingers = new Map();
  let rnd = Math.random, rol = null;

  const OPSLAG = 'speelhuys.hoepelen';
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nu = () => performance.now();
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const naamVan = (k) => (spelers[k] ? spelers[k].naam : '');
  const gewonnen = () => (window.Duiten ? Duiten.veld('hoepel-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  function zaad(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function meng(a, b, t) { const x = rgb(a), y = rgb(b); return `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)}, ${Math.round(x[1] + (y[1] - x[1]) * t)}, ${Math.round(x[2] + (y[2] - x[2]) * t)})`; }
  const tint = (h) => ({ l: meng(h, '#FFF4E2', 0.22), m: h, d: meng(h, '#160C06', 0.3), dd: meng(h, '#160C06', 0.5) });
  Object.values(UITERLIJK).forEach((u) => {
    u.k = { kleur: tint(u.kleur), kleur2: tint(u.kleur2), huid: tint(u.huid), haar: tint(u.haar), wang: meng(u.huid, '#E0705A', 0.45) };
  });

  // ============================================================
  // DE BAAN: de straat langs de gracht, met keien, plassen en dieren, en aan het eind de brug
  // ============================================================
  const grond = (w, x) => {
    // de brug: een gladde bult van BRUG meter op en BRUG meter af
    const d = Math.abs(x - w.finish);
    if (d >= BRUG) return 0;
    return BRUG_H * (0.5 + 0.5 * Math.cos(Math.PI * d / BRUG));
  };
  const helling = (w, x) => (grond(w, x + 0.05) - grond(w, x - 0.05)) / 0.1;

  function maakBaan(r, soort) {
    const finish = LENGTES[soort] || LENGTES.lang;
    const hindernissen = [];
    let x = 15, dieren = 0;
    while (x < finish - BRUG - 14) {
      let wat = r();
      const laatste = x > finish - BRUG - 40;
      if (!dieren && laatste) wat = 0.9;
      if (wat < 0.4) {
        // een losse kei: in elke baan één, niet precies op dezelfde plek
        BAAN_Z.forEach((b) => hindernissen.push({ soort: 'kei', x: x + (r() - 0.5) * 3, baan: b, h: 0.07 + r() * 0.03 }));
      } else if (wat < 0.68) {
        BAAN_Z.forEach((b) => hindernissen.push({ soort: 'plas', x: x + (r() - 0.5) * 3, baan: b, l: 0.9 + r() * 0.6 }));
      } else {
        // een dier steekt over, door beide banen (van het water naar de huizen aan onze kant)
        const kat = r() < 0.3;
        hindernissen.push({ soort: kat ? 'kat' : 'gans', x, z: -0.6, vz: 0, snel: kat ? 1.9 : 0.85, weg: false, geraakt: 0, stap: r() * 6, kant: r() < 0.5 ? 1 : -1, gak: 0 });
        dieren++;
      }
      x += 12 + r() * 9;
    }
    hindernissen.sort((a, b) => a.x - b.x);
    // de overkant: grachtenhuizen met trap-, hals-, klok-, lijst- en tuitgevels, en iepen langs de kade
    const huizen = [];
    let hx = -34;
    while (hx < finish + 60) {
      const b = 5.2 + r() * 3.4, gevel = ['trap', 'hals', 'klok', 'lijst', 'trap', 'tuit', 'hals'][Math.floor(r() * 7)];
      huizen.push({
        x: hx, b, h: (gevel === 'lijst' ? 12.5 : 10.2) + r() * 4.2, gevel,
        kleur: ['#8E3E2B', '#9B4631', '#7A3424', '#A65A3A', '#6E3326', '#C9B79A', '#8A4A36', '#5E4A44', '#9A5038'][Math.floor(r() * 9)],
        ramen: b > 6.8 ? 3 : 2, lagen: 3 + (r() < 0.45 ? 1 : 0), deur: Math.floor(r() * 3), luik: r() < 0.6, licht: r(), gevelsteen: r() < 0.35
      });
      hx += b + 0.04;
    }
    const bomenVer = [], lantaarns = [], palen = [], voor = [];
    for (let bx = -20 + r() * 4; bx < finish + 50; bx += 9 + r() * 4.5) bomenVer.push({ x: bx, s: 0.85 + r() * 0.3, f: r() });
    for (let lx = 7; lx < finish + 30; lx += 17 + r() * 4) lantaarns.push({ x: lx });
    for (let px = 3; px < finish + 30; px += 6.5 + r() * 3) if (!lantaarns.some((l) => Math.abs(l.x - px) < 2)) palen.push(px);
    for (let vx = 9 + r() * 8; vx < finish + 20; vx += 13 + r() * 15) voor.push({ x: vx, soort: ['paal', 'ton', 'mand', 'paal'][Math.floor(r() * 4)] });
    // schuiten: twee liggen aan onze kade, één vaart langzaam de andere kant op
    const schuiten = [
      { x: finish * 0.34, z: -3.3, l: 9, mast: 6.5 },
      { x: finish * 0.74, z: -3.3, l: 7.5, mast: 5.6 },
      { x: finish * 0.6, z: -12.5, l: 11, mast: 8, vaart: 0.6 }
    ];
    return { finish, hindernissen, huizen, bomenVer, lantaarns, palen, voor, schuiten, lint: 0 };
  }

  // ============================================================
  // DE RENNERS: een kind met een stok en een hoepel
  // ============================================================
  function maakRenner(k, look, mens, t) {
    const baan = k;
    return {
      k, baan, look, mens, t: t || null,
      ren: mens ? REN_MENS : t.ren,
      kind: { x: -D_OPT, v: 0, fase: 0, slag: 0, staan: true, juich: 0, sip: 0, buk: 0 },
      hoep: { x: 0, v: 0, w: 0, y: 0, vy: 0, phi: Math.random() * 6, val: 0, ligt: false, op: 0, kant: 1, plas: 0 },
      wil: 0, afkoel: 0, klaar: false, tijd: 0, slagen: 0, goed: 0, vallen: 0,
      plan: { volgende: 0 }
    };
  }

  function maakWereld(r, soort) {
    const baan = maakBaan(r, soort);
    return Object.assign(baan, { renners: [], actief: false, t: 0, cb: null, r });
  }

  // de stok raakt de hoepel: hoe dichter bij het beste punt, hoe harder en rechter
  function slaan(w, rn) {
    const kd = rn.kind, h = rn.hoep;
    if (rn.afkoel > 0 || rn.klaar) return null;
    rn.afkoel = AFKOEL;
    kd.slag = 1;
    if (h.ligt || h.val > 0) return { mis: true, reden: 'ligt' };
    const d = h.x - kd.x;
    if (d < ZONE[0] || d > ZONE[1] || h.y > 0.25) { if (w.cb && w.cb.mis) w.cb.mis(rn, d); return { mis: true, reden: d < ZONE[0] ? 'dichtbij' : 'ver' }; }
    const q = klem(1 - Math.abs(d - D_OPT) / 0.36, 0, 1);
    let dv = 0.85 + 1.55 * q;
    dv /= 1 + Math.max(0, h.v - 3.1) * 0.45;
    h.v += dv;
    h.w = Math.max(0, h.w - 0.2 * q) + (q < 0.35 ? 0.13 * (1 - q) : 0);
    rn.slagen++;
    if (q > 0.78) rn.goed++;
    if (w.cb && w.cb.slag) w.cb.slag(rn, q);
    return { mis: false, q };
  }

  // de computer: welke vaart wil hij nu, gezien wat er aankomt?
  function aiDoel(w, rn) {
    const t = rn.t, h = rn.hoep;
    let doel = t.doel;
    // de brug op: meer vaart
    if (h.x > w.finish - BRUG - 4) doel = t.doel + 0.45;
    for (const o of w.hindernissen) {
      const d = o.x - h.x;
      if (d < -0.5 || d > 14) continue;
      if ((o.soort === 'kei' || o.soort === 'plas') && o.baan === rn.baan) {
        if (o.soort === 'kei' && d < 7) doel = Math.max(doel, 2.9);
        if (o.soort === 'kei' && d < 4) doel = Math.min(doel, 4.9);
        if (o.soort === 'plas' && d < 5) doel = Math.max(doel, 3.2);
      }
      if ((o.soort === 'gans' || o.soort === 'kat') && !o.weg && d > 0.5) {
        // wanneer is het dier in mijn baan, en wanneer ben ik daar?
        if (o.beslist && o.beslist[rn.k] !== undefined) { if (o.beslist[rn.k] === 'wacht') doel = Math.min(doel, 1.55); continue; }
        const zBaan = rn.baan === 0 ? 2.0 : 0.8, vz = o.snel;
        const tIn = o.loopt ? Math.max(0, (zBaan - 0.5 - o.z) / vz) : (o.start - w.t + (zBaan - 0.5 - o.z) / vz);
        const tUit = tIn + 1.0 / vz;
        const tAan = d / Math.max(0.5, h.v);
        if (tAan > tIn - 0.4 && tAan < tUit + 0.4) {
          o.beslist = o.beslist || {};
          // inschattingsfout: soms denkt hij dat het wel lukt
          o.beslist[rn.k] = w.r() < t.fout ? 'door' : (tIn > 0.8 && d / (tIn - 0.3) < rn.ren * 0.95 ? 'erlangs' : 'wacht');
          if (o.beslist[rn.k] === 'wacht') doel = Math.min(doel, 1.55);
          if (o.beslist[rn.k] === 'erlangs') doel = Math.max(doel, Math.min(rn.ren, d / Math.max(0.3, tIn - 0.3)));
        }
      }
    }
    return doel;
  }
  function aiStap(w, rn) {
    const t = rn.t, kd = rn.kind, h = rn.hoep;
    if (h.ligt || h.val > 0 || rn.afkoel > 0 || !w.actief) return;
    const doel = aiDoel(w, rn);
    const d = h.x - kd.x;
    // een tik als hij onder zijn gewenste vaart zit en de hoepel goed voor de stok is (met een beetje ruis)
    // het mikpunt: hoe slordiger, hoe vaker hij tikt voordat hij goed bij de hoepel is
    if (rn.plan.mikt === undefined) rn.plan.mikt = D_OPT + Math.abs(gauss(w.r)) * t.mik * 1.4;
    if (h.v < doel - 0.12 || (h.v < 0.3)) {
      if (w.t >= rn.plan.volgende && d <= rn.plan.mikt + 0.02 && d >= ZONE[0]) {
        slaan(w, rn);
        rn.plan.mikt = undefined;
        rn.plan.volgende = w.t + t.traag * (0.6 + w.r() * 0.8);
      }
    }
  }

  // één stapje natuurkunde voor één renner
  function stapRenner(w, rn, dt) {
    const kd = rn.kind, h = rn.hoep;
    rn.afkoel = Math.max(0, rn.afkoel - dt);
    kd.slag = Math.max(0, kd.slag - dt / AFKOEL);
    // --- de hoepel ---
    if (h.val > 0) {
      // hij valt om: rolt nog een stukje door en tolt neer
      h.val += dt;
      h.v = Math.max(0, h.v - 6 * dt);
      h.x += h.v * dt;
      if (h.val > 0.75) { h.val = 0; h.ligt = true; h.v = 0; }
    } else if (!h.ligt) {
      let wrijf = WRIJF0 + WRIJF2 * h.v * h.v;
      if (h.plas > 0) wrijf *= 3.6;
      const a = -wrijf * Math.sign(h.v) - 9.81 * helling(w, h.x) * 0.5;
      h.v = Math.max(0, h.v + a * dt);
      if (h.v < 0.02 && helling(w, h.x) > 0.02) h.v = 0;
      h.x += h.v * dt;
      h.phi += h.v / R * dt;
      // wiebelen: te langzaam valt hij om, te hard gaat hij slingeren; met goede vaart staat hij recht
      if (w.actief || h.v > 0.05) {
        if (h.v < V_KRIT) h.w += (V_KRIT - h.v) * 0.5 * dt * (h.v > 0.05 || h.w > 0 ? 1 : 0);
        else h.w = Math.max(0, h.w - (h.v - V_KRIT) * 0.11 * dt * (0.3 + h.w));
        if (h.v > V_WILD) h.w += (h.v - V_WILD) * 0.35 * dt;
        if (h.plas > 0) h.w += 0.1 * dt;
      }
      if (h.y > 0 || h.vy > 0) {
        h.vy -= 9.81 * dt; h.y += h.vy * dt;
        if (h.y <= 0) { h.y = 0; if (h.vy < -1.2) h.w += 0.05; h.vy = 0; if (w.cb && w.cb.land) w.cb.land(rn); }
      }
      if (h.w >= 1) {
        h.w = 1; h.val = 0.001; rn.vallen++;
        if (w.cb && w.cb.val) w.cb.val(rn);
      }
      // hindernissen in de eigen baan
      h.plas = 0;
      for (const o of w.hindernissen) {
        if (o.baan !== undefined && o.baan !== rn.baan) continue;
        if (o.soort === 'kei' && !o.raak && Math.abs(h.x - o.x) < 0.12 && h.y < 0.05) {
          o.raak = true;
          if (h.v >= 2.2) { h.vy = 0.8 + 0.24 * h.v; h.y = 0.001; h.w += 0.07 + Math.max(0, h.v - 4.6) * 0.09; if (w.cb && w.cb.hop) w.cb.hop(rn, o); }
          else { h.v *= 0.35; h.w += 0.45; if (w.cb && w.cb.stoot) w.cb.stoot(rn, o); }
        } else if (o.soort === 'plas' && h.x > o.x && h.x < o.x + o.l) {
          h.plas = 1;
          if (!o.spat) { o.spat = true; if (w.cb && w.cb.plas) w.cb.plas(rn, o); }
        } else if ((o.soort === 'gans' || o.soort === 'kat') && !o.weg && Math.abs(h.x - o.x) < 0.45 && h.y < 0.3) {
          const zBaan = rn.baan === 0 ? 2.0 : 0.8;
          if (Math.abs(o.z - zBaan) < 0.48) {
            h.w = 1; h.val = 0.001; rn.vallen++;
            o.geraakt = 1; o.vz = o.snel * 3;
            if (w.cb && w.cb.dier) w.cb.dier(rn, o);
          }
        }
      }
    }
    // --- het kind: rent achter de hoepel aan, tot op de goede afstand ---
    let doelX = h.x - D_OPT;
    if (h.ligt) doelX = h.x - 0.45;
    const vmax = rn.ren * (1 - Math.max(0, helling(w, kd.x)) * 0.9);
    // het kind wil net zo hard als de hoepel, plus een beetje om de afstand goed te maken;
    // optrekken en afremmen gaan niet oneindig snel, en harder dan zijn benen kan hij niet
    const doelV = klem((h.ligt || h.val ? 0 : h.v) + (doelX - kd.x) * 3.2, -1.6, vmax);
    const dv = doelV - kd.v, amax = dv > 0 ? KIND_OP : KIND_AF;
    kd.v += klem(dv, -amax * dt, amax * dt);
    kd.x += kd.v * dt;
    kd.fase += kd.v * dt * 2.35;
    kd.staan = Math.abs(kd.v) < 0.15;
    // de hoepel ligt: oprapen
    if (h.ligt) {
      if (Math.abs(kd.x - doelX) < 0.12 && kd.v < 0.4) {
        kd.buk = Math.min(1, kd.buk + dt * 2.2);
        if (kd.buk >= 1) { h.ligt = false; h.w = 0.35; h.v = 0; h.y = 0; kd.buk = 0; if (w.cb && w.cb.op) w.cb.op(rn); }
      }
    } else kd.buk = Math.max(0, kd.buk - dt * 4);
    kd.juich = Math.max(0, kd.juich - dt);
    // de finish
    if (!rn.klaar && h.x >= w.finish) {
      rn.klaar = true; rn.tijd = w.t;
      if (w.cb && w.cb.finish) w.cb.finish(rn);
    }
  }

  // de dieren: een gans of een kat steekt over als er iemand aan komt
  function stapDieren(w, dt) {
    const voorste = Math.max(...w.renners.map((rn) => rn.hoep.x));
    for (const o of w.hindernissen) {
      if (o.soort !== 'gans' && o.soort !== 'kat') continue;
      if (o.weg) continue;
      if (!o.loopt && o.start === undefined && voorste > o.x - (o.soort === 'kat' ? 9 : 13)) o.start = w.t + 0.4 + w.r() * 0.6;
      if (!o.loopt && o.start !== undefined && w.t >= o.start) { o.loopt = true; o.vz = o.snel; if (w.cb && w.cb.dierStart) w.cb.dierStart(o); }
      if (o.loopt) {
        o.z += o.vz * dt;
        o.x += (o.kant || 1) * 0.12 * dt;
        o.stap += o.vz * dt * 5;
        if (o.z > 3.4) o.weg = true;
      }
      o.geraakt = Math.max(0, o.geraakt - dt);
      o.gak = Math.max(0, (o.gak || 0) - dt);
    }
  }

  function stapWereld(w, dt) {
    w.t += dt;
    if (w.actief) w.renners.forEach((rn) => { if (!rn.mens) aiStap(w, rn); });
    w.renners.forEach((rn) => {
      if (rn.mens && rn.wil > 0 && w.actief) { rn.wil--; slaan(w, rn); }
      stapRenner(w, rn, dt);
    });
    stapDieren(w, dt);
  }

  // ============================================================
  // HET BEELD: je kijkt over de gracht. Wat verder weg is, is kleiner en schuift trager voorbij.
  // Diepte z in meters: baan 0 op z = 2, baan 1 op z = 0,8, de kaderand op -0,5, de overkant op -24.
  // ============================================================
  const D0 = 7.4, Z_BAAN = [2.0, 0.8], Z_KADE = -0.5, Z_OVER = -24, Z_HUIS = -28.5, Z_VER = -95, Z_RAND = 2.4;
  let hc = 4, yH = 100, Y0 = 380, xa = 140, S0 = 50, zoom = 1, klinkers = null, kantstenen = null, vignet = null;
  const sk = (z) => D0 / (D0 + 2.0 - z);
  const PX = (x, z) => xa + (x - camX) * S * sk(z);
  const PY = (y, z) => yH + (hc - y) * S * sk(z);
  // tekenen in meters op diepte z (x vooruit, y omhoog), met de oorsprong op (x, y)
  function vlak(g, x, y, z) { const k = sc * dpr, m = S * sk(z); g.setTransform(k * m, 0, 0, -k * m, k * PX(x, z), k * PY(y, z)); }
  // hetzelfde, gespiegeld in het water (het water staat een meter onder de straat)
  function spiegelVlak(g, x, z) { const k = sc * dpr, m = S * sk(z); g.setTransform(k * m, 0, 0, k * m, k * PX(x, z), k * PY(-2, z)); }
  function schermVlak(g) { const k = sc * dpr; g.setTransform(k, 0, 0, k, 0, 0); }
  const zichtbaar = (x0, x1, z) => PX(x1, z) > -20 && PX(x0, z) < B + 20;

  // de camera volgt jouw kind; met vaart zoomt hij wat uit en kijkt hij verder vooruit
  function werkCameraBij(dt, direct) {
    if (!W) return;
    const rs = W.renners;
    let doelX, v;
    if (tegen) { doelX = rs[0].kind.x + 0.5; v = rs[0].hoep.v; }
    else { doelX = (rs[0].kind.x + rs[1].kind.x) / 2 + 0.5; v = Math.max(rs[0].hoep.v, rs[1].hoep.v); }
    let z = 1.12 - 0.2 * klem(v / 5, 0, 1);
    if (!tegen) { const spreid = Math.abs(rs[0].kind.x - rs[1].kind.x); z = Math.min(z, klem((B * 0.66) / (S0 * (spreid + 2.4)), 0.6, 1.2)); }
    const a = direct ? 1 : 1 - Math.exp(-dt * 1.8);
    zoom += (z - zoom) * a;
    S = S0 * zoom;
    yH = Y0 - hc * S;
    const anker = tegen ? B * (0.37 - 0.11 * klem(v / 5, 0, 1)) : B * 0.46;
    xa += (anker - xa) * (direct ? 1 : 1 - Math.exp(-dt * 1.4));
    camX += (doelX - camX) * (direct ? 1 : 1 - Math.exp(-dt * 6));
  }

  // ---------- de lucht (één keer getekend): een hoge Hollandse lucht met stapelwolken ----------
  function maakAchter() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    schermVlak(g);
    let gr = g.createLinearGradient(0, 0, 0, L);
    gr.addColorStop(0, '#6E9AC2'); gr.addColorStop(0.42, '#A8C4D8'); gr.addColorStop(0.78, '#DCDDCF'); gr.addColorStop(1, '#EFE4C8');
    g.fillStyle = gr; g.fillRect(0, 0, B, L);
    gr = g.createRadialGradient(B * 0.1, L * 0.02, 0, B * 0.1, L * 0.02, B * 1.1);
    gr.addColorStop(0, 'rgba(255, 246, 220, .75)'); gr.addColorStop(0.35, 'rgba(255, 240, 210, .2)'); gr.addColorStop(1, 'rgba(255, 240, 210, 0)');
    g.fillStyle = gr; g.fillRect(0, 0, B, L);
    const r = zaad(77);
    const hoog = Math.max(70, Math.min(L * 0.42, Y0 - hc * S0 * 1.4));
    [[0.12, 0.3, 1.0], [0.55, 0.16, 1.25], [0.92, 0.36, 0.85], [0.34, 0.62, 0.7], [0.78, 0.7, 0.6]].forEach(([fx, fy, m]) => wolk(g, B * fx, hoog * fy + 10, m * (B / 400), r));
    return c;
  }
  function wolk(g, x, y, m, r) {
    // een stapelwolk: bollen met een lichte bovenkant en een grijze buik, en een vlakke onderkant
    const bollen = [];
    for (let i = 0; i < 9; i++) bollen.push([x + (r() - 0.5) * 90 * m, y - Math.sin((i / 8) * Math.PI) * 18 * m - r() * 10 * m, (12 + r() * 16) * m]);
    bollen.forEach(([bx, by, br]) => {
      const gr = g.createRadialGradient(bx - br * 0.3, by - br * 0.5, br * 0.1, bx, by, br * 1.05);
      gr.addColorStop(0, 'rgba(255, 252, 244, .95)'); gr.addColorStop(0.6, 'rgba(240, 238, 232, .85)'); gr.addColorStop(1, 'rgba(196, 202, 210, 0)');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br * 1.05, 0, Math.PI * 2); g.fill();
    });
    const gr = g.createLinearGradient(0, y - 4 * m, 0, y + 12 * m);
    gr.addColorStop(0, 'rgba(176, 184, 196, 0)'); gr.addColorStop(1, 'rgba(160, 170, 184, .45)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y + 4 * m, 52 * m, 9 * m, 0, 0, Math.PI * 2); g.fill();
  }
  function maakVignet() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const gr = g.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.38, w / 2, h * 0.5, Math.hypot(w, h) * 0.62);
    gr.addColorStop(0, 'rgba(30, 20, 8, 0)'); gr.addColorStop(1, 'rgba(30, 20, 8, .32)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return c;
  }
  // de klinkers: vier rijen van zestien stenen, elke steen net iets anders van kleur
  function maakKlinkers() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    const r = zaad(31);
    const KLEUR = ['#7A3E2E', '#8A4A36', '#6B372B', '#95583F', '#5E3229', '#84503C', '#73402F', '#9A6046', '#5D5A60'];
    g.fillStyle = '#8E705C'; g.fillRect(0, 0, 512, 128);
    for (let rij = 0; rij < 4; rij++) {
      const off = rij % 2 ? 16 : 0;
      for (let i = -1; i < 17; i++) {
        const x = i * 32 + off, y = rij * 32;
        const basis = meng(KLEUR[Math.floor(r() * (r() < 0.06 ? KLEUR.length : KLEUR.length - 1))], '#7E4634', 0.45);
        const gr = g.createLinearGradient(0, y, 0, y + 28);
        gr.addColorStop(0, meng(basis, '#FFE8C8', 0.1 + r() * 0.05)); gr.addColorStop(0.55, basis); gr.addColorStop(1, meng(basis, '#100804', 0.18));
        g.fillStyle = gr;
        g.fillRect(x + 1.5, y + 2, 29, 27);
      }
    }
    return c;
  }
  function maakKantstenen() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 32;
    const g = c.getContext('2d');
    const r = zaad(5);
    g.fillStyle = '#6E6A62'; g.fillRect(0, 0, 512, 32);
    for (let i = 0; i < 4; i++) {
      const gr = g.createLinearGradient(0, 0, 0, 32);
      const b = meng('#A9A395', '#7E796E', r() * 0.5);
      gr.addColorStop(0, meng(b, '#FFF8E8', 0.3)); gr.addColorStop(0.35, b); gr.addColorStop(1, meng(b, '#201810', 0.35));
      g.fillStyle = gr; g.fillRect(i * 128 + 1, 1, 125, 29);
    }
    return c;
  }

  // ---------- heel ver weg: een kerktoren en een molen op de stadswal, in de waas ----------
  function tekenVerte(g) {
    const toren = W.finish * 0.42, molen = W.finish + 34;
    if (zichtbaar(toren - 8, toren + 8, Z_VER)) {
      vlak(g, toren, 0, Z_VER);
      const waas = '#A3B4C0', donker = '#8C9EAC', licht = '#BFCAD2';
      g.fillStyle = waas; g.fillRect(-6, 0, 12, 34);
      g.fillStyle = donker; g.fillRect(2, 0, 4, 34);
      g.fillStyle = licht; g.fillRect(-6.6, 33, 13.2, 1.4); g.fillRect(-5, 46, 10, 1.1);
      g.fillStyle = waas; g.fillRect(-4.6, 34.4, 9.2, 11.6);
      g.fillStyle = donker; g.fillRect(1.6, 34.4, 3, 11.6);
      g.fillStyle = waas; g.fillRect(-3.4, 47, 6.8, 9);
      g.fillStyle = donker; g.fillRect(1.2, 47, 2.2, 9);
      // de bekroning en de spits
      g.beginPath(); g.moveTo(-3.6, 56); g.quadraticCurveTo(0, 63, 3.6, 56); g.closePath(); g.fillStyle = '#9AACB9'; g.fill();
      g.fillStyle = waas; g.fillRect(-1.3, 59, 2.6, 5);
      g.beginPath(); g.moveTo(-1.6, 64); g.lineTo(0, 76); g.lineTo(1.6, 64); g.closePath(); g.fillStyle = '#8FA2B0'; g.fill();
      g.fillStyle = 'rgba(70, 86, 100, .35)';
      [[-3.6, 20], [0.6, 20], [-3.6, 8], [0.6, 8]].forEach(([x, y]) => g.fillRect(x, y, 2.4, 6));
      [[-2.6, 37.5], [0.6, 37.5], [-1.0, 49]].forEach(([x, y]) => g.fillRect(x, y, 1.8, 5));
    }
    if (zichtbaar(molen - 14, molen + 14, Z_VER)) {
      vlak(g, molen, 0, Z_VER);
      g.fillStyle = '#9FB1BE';
      g.beginPath(); g.moveTo(-5.5, 0); g.lineTo(-3.6, 20); g.lineTo(3.6, 20); g.lineTo(5.5, 0); g.closePath(); g.fill();
      g.fillStyle = '#93A6B4'; g.beginPath(); g.moveTo(-4.4, 20); g.quadraticCurveTo(0, 25, 4.4, 20); g.closePath(); g.fill();
      const t = nu() / 1000, hoek = t * 0.6;
      g.save(); g.translate(0, 21.5); g.rotate(-hoek);
      g.strokeStyle = '#8496A4'; g.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) {
        g.rotate(Math.PI / 2);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 12); g.stroke();
        g.fillStyle = 'rgba(150, 166, 180, .55)'; g.fillRect(0.3, 3, 1.7, 9);
      }
      g.restore();
    }
  }

  // ---------- de overkant: grachtenhuizen, bomen en de kade, en hun spiegeling in het water ----------
  function huisVorm(g, h) {
    const b = h.b, H = h.h;
    g.beginPath();
    g.moveTo(0, 0);
    if (h.gevel === 'trap') {
      const n = b > 7 ? 5 : 4, sw = b / (2 * n + 1.6), sh = b * 0.68 / (n + 1.2);
      let x = 0, y = H;
      for (let i = 0; i < n; i++) { y += sh; g.lineTo(x, y); x += sw; g.lineTo(x, y); }
      y += sh * 1.2; g.lineTo(x, y); x = b - x; g.lineTo(x, y);
      for (let i = 0; i < n; i++) { y = H + (n - i) * sh; g.lineTo(x, y); x += sw; g.lineTo(x, y); }
      g.lineTo(b, 0);
    } else if (h.gevel === 'hals') {
      const x0 = b * 0.27, x1 = b - x0, top = H + b * 0.8;
      g.lineTo(0, H); g.lineTo(x0 * 0.35, H);
      g.quadraticCurveTo(x0 * 0.95, H + 0.15, x0, H + b * 0.3);
      g.lineTo(x0, top - b * 0.14);
      g.quadraticCurveTo(b / 2, top + b * 0.1, x1, top - b * 0.14);
      g.lineTo(x1, H + b * 0.3);
      g.quadraticCurveTo(b - x0 * 0.95, H + 0.15, b - x0 * 0.35, H);
      g.lineTo(b, H); g.lineTo(b, 0);
    } else if (h.gevel === 'klok') {
      const top = H + b * 0.76;
      g.lineTo(0, H); g.lineTo(b * 0.05, H);
      g.bezierCurveTo(b * 0.32, H + 0.1, b * 0.14, top - b * 0.3, b * 0.33, top - b * 0.13);
      g.quadraticCurveTo(b / 2, top + b * 0.06, b * 0.67, top - b * 0.13);
      g.bezierCurveTo(b * 0.86, top - b * 0.3, b * 0.68, H + 0.1, b * 0.95, H);
      g.lineTo(b, H); g.lineTo(b, 0);
    } else if (h.gevel === 'tuit') {
      g.lineTo(0, H); g.lineTo(b * 0.32, H + b * 0.48); g.lineTo(b * 0.5, H + b * 0.86); g.lineTo(b * 0.68, H + b * 0.48); g.lineTo(b, H); g.lineTo(b, 0);
    } else {
      g.lineTo(0, H + 0.5); g.lineTo(b, H + 0.5); g.lineTo(b, 0);
    }
    g.closePath();
  }
  function tekenHuis(g, h) {
    const b = h.b, H = h.h;
    // het dak achter een lijstgevel
    if (h.gevel === 'lijst') {
      g.fillStyle = '#4E4A50';
      g.beginPath(); g.moveTo(0.3, H); g.lineTo(b * 0.5, H + b * 0.42); g.lineTo(b - 0.3, H); g.closePath(); g.fill();
      g.fillStyle = '#E8E0CC'; g.fillRect(b * 0.36, H + 0.4, b * 0.28, 1.7);
      g.fillStyle = '#2E3038'; g.fillRect(b * 0.41, H + 0.6, b * 0.18, 1.2);
    }
    huisVorm(g, h);
    const gr = g.createLinearGradient(0, H + 3, b, 0);
    gr.addColorStop(0, meng(h.kleur, '#FFE6C0', 0.22)); gr.addColorStop(0.6, h.kleur); gr.addColorStop(1, meng(h.kleur, '#140A06', 0.3));
    g.fillStyle = gr; g.fill();
    // zandstenen randen langs de top, en de lijst
    g.strokeStyle = h.gevel === 'tuit' ? 'rgba(40, 20, 10, .4)' : '#E4DCC6'; g.lineWidth = h.gevel === 'trap' ? 0.14 : 0.2;
    g.save(); g.clip(); huisVorm(g, h); g.stroke(); g.restore();
    if (h.gevel === 'lijst') { g.fillStyle = '#ECE5D2'; g.fillRect(-0.15, H, b + 0.3, 0.5); g.fillStyle = 'rgba(0, 0, 0, .25)'; g.fillRect(0, H - 0.18, b, 0.18); }
    else { g.fillStyle = 'rgba(236, 228, 208, .85)'; g.fillRect(0, H - 0.1, b, 0.16); }
    // de plint van blauwe steen
    g.fillStyle = '#5A5862'; g.fillRect(0, 0, b, 0.55);
    // ramen: een kruiskozijn met witte sponningen
    const lagen = h.lagen, vh = (H - 0.6) / lagen;
    for (let l = 0; l < lagen; l++) {
      const y0 = 0.6 + l * vh, n = h.ramen;
      const rw = Math.min(1.25, (b - 0.8) / n - 0.45), rh = vh * (l === 0 ? 0.62 : 0.6);
      for (let i = 0; i < n; i++) {
        let rx = 0.4 + (i + 0.5) * ((b - 0.8) / n) - rw / 2;
        if (l === 0 && i === h.deur % n) {
          // de voordeur met een bovenlicht, en een stoepje
          g.fillStyle = '#E8E0CC'; g.fillRect(rx - 0.1, y0 - 0.05, rw + 0.2, rh + 0.4);
          g.fillStyle = h.gevel === 'tuit' ? '#3E2A1C' : '#23402E'; g.fillRect(rx, y0, rw, rh - 0.35);
          g.fillStyle = '#C9D4D8'; g.fillRect(rx + 0.08, y0 + rh - 0.28, rw - 0.16, 0.5);
          g.fillStyle = '#8D8A86'; g.fillRect(rx - 0.3, 0, rw + 0.6, 0.5);
          continue;
        }
        if (h.gevel === 'tuit' && i === Math.floor(n / 2)) {
          // pakhuis: de luiken in het midden
          g.fillStyle = '#5A2A1E'; g.fillRect(rx - 0.05, y0, rw + 0.1, rh + 0.25);
          g.strokeStyle = 'rgba(0, 0, 0, .35)'; g.lineWidth = 0.06; g.beginPath(); g.moveTo(rx + rw / 2, y0); g.lineTo(rx + rw / 2, y0 + rh + 0.25); g.stroke();
          continue;
        }
        g.fillStyle = '#ECE6D6'; g.fillRect(rx - 0.1, y0 - 0.1, rw + 0.2, rh + 0.2);
        const gl = g.createLinearGradient(0, y0 + rh, 0, y0);
        gl.addColorStop(0, '#2A3640'); gl.addColorStop(0.6, '#45586A'); gl.addColorStop(1, '#7A90A2');
        g.fillStyle = gl; g.fillRect(rx, y0, rw, rh);
        if (h.licht > 0.8 && l === 1 && i === 0) { g.fillStyle = 'rgba(255, 214, 150, .55)'; g.fillRect(rx, y0, rw, rh); }
        g.fillStyle = '#ECE6D6'; g.fillRect(rx, y0 + rh * 0.62, rw, 0.09); g.fillRect(rx + rw / 2 - 0.045, y0, 0.09, rh);
        if (h.luik && l === 0) { g.fillStyle = h.kleur === '#5E4A44' ? '#7A2E22' : '#2F4A33'; g.fillRect(rx - 0.42, y0, 0.3, rh * 0.62); g.fillRect(rx + rw + 0.12, y0, 0.3, rh * 0.62); }
      }
    }
    // ramen in de top
    if (h.gevel !== 'lijst') {
      const ty = H + 0.5, tw = 0.8, th = 1.3;
      g.fillStyle = '#ECE6D6'; g.fillRect(b / 2 - tw / 2 - 0.08, ty - 0.08, tw + 0.16, th + 0.16);
      g.fillStyle = '#3D4E5E'; g.fillRect(b / 2 - tw / 2, ty, tw, th);
      if (h.gevel === 'tuit') { g.strokeStyle = '#3A2414'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(b / 2, H + b * 0.74); g.lineTo(b / 2 + 1.0, H + b * 0.74); g.stroke(); }
      if (h.gevelsteen) { g.fillStyle = '#DCD3BE'; g.fillRect(b / 2 - 0.5, H - 1.6, 1.0, 0.9); g.fillStyle = 'rgba(60, 40, 20, .4)'; g.fillRect(b / 2 - 0.3, H - 1.4, 0.6, 0.5); }
    }
    // schaduw van de buurman en de zon van links
    g.fillStyle = 'rgba(20, 10, 4, .14)'; g.fillRect(b - 0.35, 0, 0.35, H);
  }
  function tekenBoomVer(g, bm) {
    const s = bm.s;
    g.fillStyle = '#4A3A2A'; g.beginPath(); g.moveTo(-0.22 * s, 0); g.lineTo(-0.14 * s, 4.2 * s); g.lineTo(0.14 * s, 4.2 * s); g.lineTo(0.24 * s, 0); g.closePath(); g.fill();
    const bollen = [[-1.6, 5.4, 2.0], [1.5, 5.6, 2.1], [0, 7.2, 2.4], [-0.9, 8.6, 1.7], [1.0, 8.4, 1.6], [0, 4.6, 1.8]];
    bollen.forEach(([x, y, r], i) => {
      const gr = g.createRadialGradient((x - r * 0.35) * s, (y + r * 0.4) * s, r * 0.2 * s, x * s, y * s, r * s);
      const tint = bm.f > 0.5 ? ['#7E9A52', '#5E7A3A', '#3E5528'] : ['#89A05A', '#647E40', '#42592C'];
      gr.addColorStop(0, tint[0]); gr.addColorStop(0.55, tint[1]); gr.addColorStop(1, tint[2]);
      g.fillStyle = gr; g.globalAlpha = i === 5 ? 0.9 : 0.96;
      g.beginPath(); g.arc(x * s, y * s, r * s, 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
  }
  function tekenOverkant(g, t) {
    const zh = Z_HUIS, zb = Z_OVER - 0.8;
    const ywater = PY(-1, Z_OVER), ykade = PY(0, Z_KADE);
    // de straat aan de overkant en de kademuur
    schermVlak(g);
    const yHuisVoet = PY(0, zh), yKadeTop = PY(0, Z_OVER);
    g.fillStyle = '#8C7D6C'; g.fillRect(0, yHuisVoet - 0.5, B, yKadeTop - yHuisVoet + 1);
    let gr = g.createLinearGradient(0, yKadeTop, 0, ywater);
    gr.addColorStop(0, '#A49C8A'); gr.addColorStop(0.25, '#6E3A2C'); gr.addColorStop(1, '#4A2820');
    g.fillStyle = gr; g.fillRect(0, yKadeTop, B, ywater - yKadeTop + 0.5);
    // het water
    gr = g.createLinearGradient(0, ywater, 0, ykade);
    gr.addColorStop(0, '#7E908A'); gr.addColorStop(0.25, '#56665C'); gr.addColorStop(1, '#2C3A31');
    g.fillStyle = gr; g.fillRect(0, ywater, B, ykade - ywater + 1);
    // spiegelingen (eerst, want ze liggen in het water), golvend in dunne reepjes
    spiegeling(g, t, ywater, ykade, zh, zb);
    // de waterspiegel: de lucht licht op in het water, rimpels liggen dwars
    schermVlak(g);
    g.save();
    g.beginPath(); g.rect(0, ywater, B, ykade - ywater); g.clip();
    gr = g.createLinearGradient(0, ywater, 0, ykade);
    gr.addColorStop(0, 'rgba(170, 190, 196, .42)'); gr.addColorStop(0.35, 'rgba(90, 112, 104, .16)'); gr.addColorStop(1, 'rgba(24, 36, 30, .5)');
    g.fillStyle = gr; g.fillRect(0, ywater, B, ykade - ywater);
    rimpels(g, t, ywater, ykade);
    g.restore();
    // de huizen en de bomen
    W.huizen.forEach((h) => { if (zichtbaar(h.x, h.x + h.b, zh)) { vlak(g, h.x, 0, zh); tekenHuis(g, h); } });
    W.bomenVer.forEach((bm) => { if (zichtbaar(bm.x - 3, bm.x + 3, zb)) { vlak(g, bm.x, 0, zb); tekenBoomVer(g, bm); } });
    // de schuit die over de gracht vaart, en de schuiten aan onze kant
    W.schuiten.forEach((sc0) => tekenSchuit(g, sc0, t));
  }
  // de spiegeling: eerst op een eigen doek, dan in reepjes overgenomen die elk een tikje heen en weer golven
  // (op halve scherpte: dat is sneller, en zachter, net als echt water; opnieuw getekend als het beeld verschuift)
  let spiegelDoek = null, spiegelSleutel = '';
  function spiegeling(g, t, y0, y1, zh, zb) {
    const k = sc * dpr, kr = k * 0.5;
    const p0 = Math.max(0, Math.floor(y0 * k)), p1 = Math.min(doek.height, Math.ceil(y1 * k)), hoog = p1 - p0;
    if (hoog <= 2) return;
    const bw = Math.ceil(doek.width / 2), bh = Math.ceil(hoog / 2);
    if (!spiegelDoek || spiegelDoek.width !== bw || spiegelDoek.height !== bh) { spiegelDoek = document.createElement('canvas'); spiegelDoek.width = bw; spiegelDoek.height = bh; spiegelSleutel = ''; }
    const sleutel = [Math.round(PX(0, zh) * 4), Math.round(S * 40), p0, Math.round(yH * 4)].join(',');
    if (sleutel !== spiegelSleutel) {
      spiegelSleutel = sleutel;
      const sg = spiegelDoek.getContext('2d');
      sg.setTransform(1, 0, 0, 1, 0, 0);
      sg.clearRect(0, 0, bw, bh);
      // tekenen alsof het het grote doek is, maar dan op halve maat en p0 pixels omhoog geschoven
      const vlakSp = (x, z) => { const m = S * sk(z); sg.setTransform(kr * m, 0, 0, kr * m, kr * PX(x, z), kr * PY(-2, z) - p0 / 2); };
      W.huizen.forEach((h) => { if (zichtbaar(h.x, h.x + h.b, zh)) { vlakSp(h.x, zh); tekenHuis(sg, h); } });
      W.bomenVer.forEach((bm) => { if (zichtbaar(bm.x - 3, bm.x + 3, zb)) { vlakSp(bm.x, zb); tekenBoomVer(sg, bm); } });
    }
    // overnemen in reepjes die elk een tikje heen en weer golven; dichtbij kijk je meer in het water dan erover (minder spiegeling)
    g.setTransform(1, 0, 0, 1, 0, 0);
    const n = 16, hb = bh / n, w = doek.width;
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const dx = Math.sin(t * 1.3 + i * 1.7) * (0.5 + f * 2.4) * k;
      g.globalAlpha = 0.44 - f * 0.22;
      g.drawImage(spiegelDoek, 0, i * hb, bw, hb + 0.4, dx, p0 + i * hb * 2, w, hb * 2 + 0.8);
    }
    g.globalAlpha = 1;
  }
  // rimpels op het water: lichte en donkere streepjes die met de wereld meeschuiven
  function rimpels(g, t, y0, y1) {
    const n = 15;
    g.lineCap = 'round';
    for (let pas = 0; pas < 2; pas++) {
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n, y = y0 + (y1 - y0) * Math.pow(f, 1.35);
        // de diepte van deze rij (terugrekenen uit de schermhoogte van het water)
        const sz = (y - yH) / ((hc + 1) * S), z = 2 + D0 - D0 / Math.max(0.05, sz), sch = S * sk(z);
        const per = 2.4, x0 = camX - xa / sch - 2, x1 = camX + (B - xa) / sch + 2;
        for (let k = Math.floor(x0 / per); k < x1 / per; k++) {
          const hsh = ((k * 73856093) ^ (i * 19349663)) >>> 0, a = (hsh % 1000) / 1000;
          if ((pas === 0) !== (a < 0.5)) continue;
          const xm = k * per + a * per + Math.sin(t * 0.7 + i + k) * 0.25, lw = (0.4 + a * 0.9);
          const sx = PX(xm, z);
          g.moveTo(sx - lw * sch / 2, y); g.lineTo(sx + lw * sch / 2, y);
        }
      }
      g.strokeStyle = pas === 0 ? 'rgba(220, 230, 226, .3)' : 'rgba(20, 30, 24, .28)';
      g.lineWidth = 0.7;
      g.stroke();
    }
  }
  function tekenSchuit(g, b, t) {
    const x = b.x - (b.vaart || 0) * (W.t || 0), z = b.z;
    if (!zichtbaar(x - 6, x + 6, z)) return;
    vlak(g, x, -1, z);
    const l = b.l;
    // de romp, geteerd, met een lichte berghout
    g.beginPath(); g.moveTo(-l / 2, 1.1); g.quadraticCurveTo(-l / 2 + 0.3, 0.1, -l / 2 + 1.4, -0.1); g.lineTo(l / 2 - 1.2, -0.1); g.quadraticCurveTo(l / 2 - 0.1, 0.2, l / 2 + 0.3, 1.3); g.closePath();
    const gr = g.createLinearGradient(0, 1.2, 0, -0.1);
    gr.addColorStop(0, '#5A3A22'); gr.addColorStop(0.4, '#3A2414'); gr.addColorStop(1, '#1E140C');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#B08A50'; g.lineWidth = 0.08; g.beginPath(); g.moveTo(-l / 2 + 0.05, 1.0); g.quadraticCurveTo(0, 0.85, l / 2 + 0.2, 1.15); g.stroke();
    // de roef achterop, en een ton
    g.fillStyle = '#6A4A2E'; g.fillRect(-l / 2 + 0.9, 0.95, 2.0, 1.0);
    g.fillStyle = '#8A2E22'; g.beginPath(); g.moveTo(-l / 2 + 0.7, 1.95); g.quadraticCurveTo(-l / 2 + 1.9, 2.4, -l / 2 + 3.1, 1.95); g.closePath(); g.fill();
    g.fillStyle = '#E8DCB8'; g.fillRect(-l / 2 + 1.3, 1.3, 0.35, 0.35); g.fillRect(-l / 2 + 2.1, 1.3, 0.35, 0.35);
    // de mast met een opgerold zeil en een wimpel
    const mx = 0.6, mh = b.mast;
    g.strokeStyle = '#4A3420'; g.lineWidth = 0.14; g.beginPath(); g.moveTo(mx, 0.9); g.lineTo(mx, mh); g.stroke();
    g.lineWidth = 0.03; g.strokeStyle = 'rgba(40, 30, 20, .6)'; g.beginPath(); g.moveTo(mx, mh); g.lineTo(l / 2 + 0.2, 1.2); g.moveTo(mx, mh); g.lineTo(-l / 2 + 1.0, 2.0); g.stroke();
    g.fillStyle = '#D8C9A4'; g.beginPath(); g.ellipse(mx + 0.05, mh * 0.55, 0.22, mh * 0.32, 0, 0, Math.PI * 2); g.fill();
    const wap = Math.sin(t * 3 + b.x) * 0.15;
    g.fillStyle = '#B3362A'; g.beginPath(); g.moveTo(mx, mh); g.lineTo(mx - 1.3, mh - 0.2 + wap); g.lineTo(mx, mh - 0.35); g.closePath(); g.fill();
    // het water om de romp
    g.fillStyle = 'rgba(40, 56, 48, .55)'; g.fillRect(-l / 2 - 0.3, -0.1, l + 0.8, 0.22);
  }

  // ---------- onze straat: kantstenen langs de gracht, dan klinkers tot vlak voor je neus ----------
  function rij(g, za, zb, patroon, pi, hoogte) {
    const zm = (za + zb) / 2, sm = sk(zm), k = sc * dpr;
    const ya = PY(0, za), yb = PY(0, zb);
    const lengte = patroon === kantstenen ? 0.8 : 0.2;
    const bx = lengte * S * sm / (patroon === kantstenen ? 128 : 32), by = (yb - ya) / 32;
    const ox = PX(0, zm);
    if (!hoogte) {
      g.setTransform(k * bx, 0, 0, k * by, k * ox, k * (ya - pi * 32 * by));
      g.fillStyle = patroon;
      g.fillRect(-ox / bx - 2, pi * 32, B / bx + 4, 32.5);
      return;
    }
    // over de brug: de rij buigt mee met de bult
    const [x0, x1] = hoogte.bereik, stap = (x1 - x0) / 28;
    schermVlak(g);
    g.save();
    g.beginPath();
    for (let i = 0; i <= 28; i++) { const x = x0 + i * stap; g.lineTo(PX(x, zm), PY(hoogte.f(x), za)); }
    for (let i = 28; i >= 0; i--) { const x = x0 + i * stap; g.lineTo(PX(x, zm), PY(hoogte.f(x), zb) + 0.4); }
    g.closePath(); g.clip();
    const lift = PY(hoogte.f((x0 + x1) / 2), za) - ya;
    g.setTransform(k * bx, 0, 0, k * by, k * ox, k * (ya - pi * 32 * by));
    g.fillStyle = patroon;
    g.fillRect(-ox / bx - 2, pi * 32 + lift / by - 4, B / bx + 4, 40 - lift / by);
    g.restore();
  }
  function tekenStraat(g) {
    if (!klinkers) { klinkers = g.createPattern(maakKlinkers(), 'repeat'); kantstenen = g.createPattern(maakKantstenen(), 'repeat'); }
    const zOnder = 2 + D0 - D0 * (hc * S) / Math.max(1, L - yH) + 0.12;
    rij(g, Z_KADE, Z_KADE + 0.28, kantstenen, 0);
    let z = Z_KADE + 0.28, i = 0;
    while (z < zOnder) { const d = 0.1; rij(g, z, z + d, klinkers, i % 4); z += d; i++; }
    // waas in de verte, en de straat iets donkerder vlak voor je
    schermVlak(g);
    const ya = PY(0, Z_KADE);
    const gr = g.createLinearGradient(0, ya, 0, L);
    gr.addColorStop(0, 'rgba(214, 206, 188, .32)'); gr.addColorStop(0.35, 'rgba(214, 206, 188, .06)'); gr.addColorStop(1, 'rgba(30, 16, 8, .22)');
    g.fillStyle = gr; g.fillRect(0, ya, B, L - ya);
    // de rand van de kade: een schaduwlijntje
    g.fillStyle = 'rgba(20, 12, 6, .45)'; g.fillRect(0, ya - 0.6, B, 1.1);
  }

  // ---------- de brug: een stenen boog over een dwarsgracht; de finish is boven op de brug ----------
  function tekenBrug(g) {
    const f = W.finish, x0 = f - BRUG, x1 = f + BRUG;
    if (!zichtbaar(x0, x1, Z_RAND)) return;
    const hoogte = { bereik: [x0, x1], f: (x) => grond(W, x) };
    // het brugdek, rij voor rij
    rij(g, Z_KADE, Z_KADE + 0.28, kantstenen, 0, hoogte);
    let z = Z_KADE + 0.28, i = 0;
    while (z < Z_RAND - 0.001) { rij(g, z, Math.min(Z_RAND, z + 0.1), klinkers, i % 4, hoogte); z += 0.1; i++; }
    // de voorkant van de brug, met de boog over het water
    schermVlak(g);
    g.beginPath();
    for (let j = 0; j <= 40; j++) { const x = x0 + (x1 - x0) * j / 40; g.lineTo(PX(x, Z_RAND), PY(grond(W, x), Z_RAND)); }
    for (let j = 40; j >= 0; j--) {
      const x = x0 + (x1 - x0) * j / 40, d = Math.abs(x - f);
      const voet = d < 4.6 ? -1.6 : d < 5.4 ? -1.6 + (d - 4.6) / 0.8 * 1.6 : 0;
      g.lineTo(PX(x, Z_RAND), Math.min(L + 2, PY(voet, Z_RAND)));
    }
    g.closePath();
    let gr = g.createLinearGradient(0, PY(BRUG_H, Z_RAND), 0, PY(-1, Z_RAND));
    gr.addColorStop(0, '#8A4A36'); gr.addColorStop(1, '#5A2E22');
    g.fillStyle = gr; g.fill();
    // de boog: donker water onder de brug, met een stenen rand
    vlak(g, f, 0, Z_RAND);
    g.beginPath(); g.ellipse(0, -1.4, 4.1, 2.05, 0, Math.PI, 0, true); g.closePath();
    gr = g.createLinearGradient(0, 0.65, 0, -1.4);
    gr.addColorStop(0, '#120C08'); gr.addColorStop(0.7, '#1E2622'); gr.addColorStop(1, '#3A4A42');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#CFC6B0'; g.lineWidth = 0.22; g.stroke();
    g.strokeStyle = 'rgba(60, 50, 40, .5)'; g.lineWidth = 0.04;
    for (let a = 0.18; a < Math.PI; a += 0.26) { g.beginPath(); g.moveTo(Math.cos(a) * 4.1, -1.4 + Math.sin(a) * 2.05); g.lineTo(Math.cos(a) * 4.45, -1.4 + Math.sin(a) * 2.3); g.stroke(); }
    // een stenen band langs de bovenkant van de brug
    schermVlak(g);
    g.beginPath();
    for (let j = 0; j <= 40; j++) { const x = x0 + (x1 - x0) * j / 40; g.lineTo(PX(x, Z_RAND), PY(grond(W, x), Z_RAND)); }
    g.strokeStyle = '#D8D0BC'; g.lineWidth = Math.max(1.6, 0.2 * S); g.stroke();
    g.strokeStyle = 'rgba(60, 40, 24, .35)'; g.lineWidth = 1; g.stroke();
  }
  // de leuning aan de waterkant van de brug (achter de kinderen); voor zit alleen een lage stenen rand
  function tekenLeuning(g) {
    const f = W.finish, x0 = f - BRUG + 1.6, x1 = f + BRUG - 1.6;
    if (!zichtbaar(x0 - 3, x1 + 3, Z_KADE)) return;
    schermVlak(g);
    const z = Z_KADE + 0.08, s = S * sk(z);
    g.strokeStyle = '#2A2622'; g.lineCap = 'round';
    g.lineWidth = Math.max(1, 0.05 * s);
    g.beginPath();
    for (let x = x0; x <= x1 + 0.01; x += 0.6) { const yb = PY(grond(W, x), z); g.moveTo(PX(x, z), yb); g.lineTo(PX(x, z), yb - 0.9 * s); }
    g.stroke();
    g.lineWidth = Math.max(1.2, 0.07 * s);
    [0.9, 0.5].forEach((hh) => {
      g.beginPath();
      for (let x = x0; x <= x1 + 0.01; x += 0.5) g.lineTo(PX(x, z), PY(grond(W, x) + hh, z));
      g.stroke();
    });
    // lantaarns op de hoeken van de brug
    [x0 - 0.3, x1 + 0.3].forEach((x) => { const gy = grond(W, x); vlak(g, x, gy, -0.32); g.save(); tekenLantaarnVorm(g); g.restore(); });
  }
  // het lint van de finish, boven op de brug (na de kinderen getekend)
  function tekenBrugVoor(g, t) {
    const f = W.finish;
    if (!zichtbaar(f - 3, f + 3, Z_RAND)) return;
    // palen met een vaantje bij de finish, en het lint ertussen
    const g0 = grond(W, f);
    [Z_KADE + 0.1, Z_RAND - 0.12].forEach((zz, i) => {
      vlak(g, f, g0, zz);
      g.fillStyle = '#E8E0CC'; g.fillRect(-0.07, 0, 0.14, 1.35);
      g.fillStyle = '#B3362A'; g.fillRect(-0.09, 1.0, 0.18, 0.1);
      const wap = Math.sin(t * 4 + i) * 0.08;
      g.fillStyle = i ? '#C8382B' : '#2C4A7C';
      g.beginPath(); g.moveTo(0.05, 1.35); g.lineTo(0.75, 1.24 + wap); g.lineTo(0.05, 1.08); g.closePath(); g.fill();
    });
    schermVlak(g);
    const pa = [PX(f, Z_KADE + 0.1), PY(g0 + 0.95, Z_KADE + 0.1)], pb = [PX(f, Z_RAND - 0.12), PY(g0 + 0.95, Z_RAND - 0.12)];
    g.lineWidth = Math.max(1.4, 0.05 * S);
    if (!W.lint) {
      const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2 + 0.12 * S;
      g.strokeStyle = '#C8382B'; g.beginPath(); g.moveTo(pa[0], pa[1]); g.quadraticCurveTo(mx, my, pb[0], pb[1]); g.stroke();
      g.strokeStyle = 'rgba(255, 255, 255, .85)'; g.setLineDash([3, 4]); g.stroke(); g.setLineDash([]);
    } else {
      // gebroken: twee eindjes die nawapperen
      const na = Math.min(1, (W.t - W.lint) * 1.5);
      [[pa, 1], [pb, -1]].forEach(([p, kant]) => {
        const l = 0.55 * S, hoek = 1.2 + na * 0.3 + Math.sin(t * 7 + kant) * 0.15 * (1 - na * 0.5);
        g.strokeStyle = '#C8382B'; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + kant * l * 0.3, p[1] + l * 0.4, p[0] + Math.cos(hoek) * l * 0.4, p[1] + Math.sin(hoek) * l); g.stroke();
      });
    }
  }

  // ---------- aan onze kant: lantaarns van Jan van der Heyden, meerpalen, en dingen vlak voor je ----------
  function tekenLantaarn(g, x) { vlak(g, x, 0, -0.32); tekenLantaarnVorm(g); }
  function tekenLantaarnVorm(g) {
    g.fillStyle = '#2E2A26'; g.fillRect(-0.06, 0, 0.12, 2.5);
    g.fillStyle = '#3A3430'; g.fillRect(-0.12, 0, 0.24, 0.3);
    // de lantaarn: vier ruitjes onder een kapje
    g.fillStyle = '#2A2622'; g.beginPath(); g.moveTo(-0.17, 2.5); g.lineTo(0.17, 2.5); g.lineTo(0.22, 2.95); g.lineTo(-0.22, 2.95); g.closePath(); g.fill();
    g.fillStyle = 'rgba(220, 226, 214, .7)'; g.beginPath(); g.moveTo(-0.14, 2.54); g.lineTo(0.14, 2.54); g.lineTo(0.18, 2.91); g.lineTo(-0.18, 2.91); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255, 210, 120, .5)'; g.beginPath(); g.ellipse(0, 2.66, 0.03, 0.06, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2A2622'; g.fillRect(-0.01, 2.54, 0.02, 0.37);
    g.beginPath(); g.moveTo(-0.26, 2.95); g.lineTo(0, 3.18); g.lineTo(0.26, 2.95); g.closePath(); g.fill();
    g.beginPath(); g.arc(0, 3.22, 0.04, 0, Math.PI * 2); g.fill();
  }
  function tekenMeerpaal(g, x) {
    vlak(g, x, 0, -0.38);
    const gr = g.createLinearGradient(-0.12, 0, 0.12, 0);
    gr.addColorStop(0, '#6A5038'); gr.addColorStop(0.5, '#4A3624'); gr.addColorStop(1, '#2A1E14');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-0.11, 0); g.lineTo(-0.1, 0.85); g.quadraticCurveTo(0, 0.93, 0.1, 0.85); g.lineTo(0.11, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0, 0, 0, .3)'; g.fillRect(-0.11, 0.5, 0.22, 0.05);
  }
  function tekenVoorgrond(g, v) {
    vlak(g, v.x, 0, 3.15);
    if (v.soort === 'ton') {
      const gr = g.createLinearGradient(-0.3, 0, 0.3, 0);
      gr.addColorStop(0, '#5A3E24'); gr.addColorStop(0.4, '#8A6438'); gr.addColorStop(1, '#3A2614');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-0.26, 0); g.quadraticCurveTo(-0.34, 0.38, -0.26, 0.76); g.lineTo(0.26, 0.76); g.quadraticCurveTo(0.34, 0.38, 0.26, 0); g.closePath(); g.fill();
      g.strokeStyle = '#2A2420'; g.lineWidth = 0.035; [0.12, 0.64].forEach((y) => { g.beginPath(); g.moveTo(-0.29, y); g.lineTo(0.29, y); g.stroke(); });
      g.fillStyle = '#4A3420'; g.beginPath(); g.ellipse(0, 0.76, 0.26, 0.07, 0, 0, Math.PI * 2); g.fill();
    } else if (v.soort === 'paal') {
      const gr = g.createLinearGradient(-0.12, 0, 0.12, 0);
      gr.addColorStop(0, '#9A9488'); gr.addColorStop(0.5, '#7A756C'); gr.addColorStop(1, '#4E4A44');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-0.12, 0); g.lineTo(-0.1, 0.5); g.quadraticCurveTo(0, 0.6, 0.1, 0.5); g.lineTo(0.12, 0); g.closePath(); g.fill();
    } else {
      // een mand
      g.fillStyle = '#B08A50'; g.beginPath(); g.moveTo(-0.3, 0); g.lineTo(-0.34, 0.34); g.lineTo(0.34, 0.34); g.lineTo(0.3, 0); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(80, 50, 20, .55)'; g.lineWidth = 0.025;
      for (let y = 0.06; y < 0.34; y += 0.07) { g.beginPath(); g.moveTo(-0.32, y); g.lineTo(0.32, y); g.stroke(); }
      g.strokeStyle = '#8A6438'; g.lineWidth = 0.04; g.beginPath(); g.moveTo(-0.24, 0.34); g.quadraticCurveTo(0, 0.7, 0.24, 0.34); g.stroke();
      g.fillStyle = '#E8C880'; [[-0.12, 0.38], [0.06, 0.4], [0.16, 0.37]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 0.07, 0, Math.PI * 2); g.fill(); });
    }
  }

  // ---------- hindernissen ----------
  function tekenPlas(g, o, t) {
    const z = Z_BAAN[o.baan], xm = o.x + o.l / 2;
    if (!zichtbaar(o.x - 0.5, o.x + o.l + 0.5, z)) return;
    schermVlak(g);
    const cx = PX(xm, z), cy = PY(0, z), rx = o.l / 2 * S * sk(z), ry = Math.max(1.5, (PY(0, z + 0.2) - PY(0, z - 0.2)) / 2);
    // een grillige rand: een paar golfjes rond de ellips (vast per plas)
    const vorm = (schaal) => {
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = i / 24 * Math.PI * 2, wob = 1 + 0.12 * Math.sin(a * 3 + o.x) + 0.07 * Math.sin(a * 5 + o.x * 2);
        const px = cx + Math.cos(a) * rx * wob * schaal, py = cy + Math.sin(a) * ry * wob * schaal;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.closePath();
    };
    // natte klinkers rondom, donkerder
    vorm(1.28); g.fillStyle = 'rgba(40, 20, 12, .3)'; g.fill();
    // het water: de lucht spiegelt erin
    vorm(1);
    const gr = g.createLinearGradient(0, cy - ry, 0, cy + ry);
    gr.addColorStop(0, '#B4C6D0'); gr.addColorStop(0.55, '#8197A4'); gr.addColorStop(1, '#5E7280');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(255, 255, 255, .3)'; g.beginPath(); g.ellipse(cx - rx * 0.25, cy - ry * 0.25, rx * 0.45, ry * 0.2, 0, 0, Math.PI * 2); g.fill();
    if (o.spat) {
      const a = W.t - o.spatT;
      if (a < 1.6) { g.strokeStyle = `rgba(236, 244, 248, ${0.7 * (1 - a / 1.6)})`; g.lineWidth = 1; [0, 0.35].forEach((d) => { const q = Math.max(0, a - d); g.beginPath(); g.ellipse(PX(o.spatX, z), cy, q * 0.9 * S * sk(z), q * 0.9 * ry / 0.2, 0, 0, Math.PI * 2); g.stroke(); }); }
    }
    g.restore();
    vorm(1); g.strokeStyle = 'rgba(30, 16, 8, .45)'; g.lineWidth = 0.8; g.stroke();
    void t;
  }
  function tekenKei(g, o) {
    const z = Z_BAAN[o.baan];
    if (!zichtbaar(o.x - 0.3, o.x + 0.3, z)) return;
    vlak(g, o.x, grond(W, o.x), z);
    g.fillStyle = 'rgba(30, 16, 8, .35)'; g.beginPath(); g.ellipse(0.03, 0.005, 0.16, 0.035, 0, 0, Math.PI * 2); g.fill();
    const gr = g.createRadialGradient(-0.04, o.h * 0.9, 0.01, 0, o.h * 0.4, 0.16);
    gr.addColorStop(0, '#B8B0A4'); gr.addColorStop(0.6, '#7E766C'); gr.addColorStop(1, '#4A443E');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-0.13, 0); g.quadraticCurveTo(-0.14, o.h * 1.1, 0, o.h * 1.15); g.quadraticCurveTo(0.14, o.h * 1.05, 0.13, 0); g.closePath(); g.fill();
  }
  function tekenGans(g, o, t) {
    const z = o.z;
    if (!zichtbaar(o.x - 1, o.x + 1, z) || z > 4.2) return;
    vlak(g, o.x, grond(W, o.x), z);
    const kant = o.kant || 1;
    g.scale(kant, 1);
    g.fillStyle = 'rgba(30, 16, 8, .25)'; g.beginPath(); g.ellipse(0, 0.005, 0.32, 0.05, 0, 0, Math.PI * 2); g.fill();
    const st = o.stap, schrik = o.geraakt > 0 ? 1 : 0;
    // poten
    g.strokeStyle = '#E2832A'; g.lineWidth = 0.035;
    [0, Math.PI].forEach((f) => { const a = Math.sin(st + f) * 0.35; g.beginPath(); g.moveTo(0.02, 0.3); g.lineTo(0.02 + Math.sin(a) * 0.26, 0.04); g.lineTo(0.1 + Math.sin(a) * 0.26, 0.02); g.stroke(); });
    // lijf
    const wieg = Math.sin(st * 2) * 0.03;
    g.save(); g.translate(0, 0.42 + Math.abs(Math.sin(st)) * 0.02); g.rotate(wieg - schrik * 0.2);
    let gr = g.createLinearGradient(0, 0.18, 0, -0.16);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.7, '#ECE8E0'); gr.addColorStop(1, '#C8C2B6');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-0.36, 0.08); g.quadraticCurveTo(-0.3, -0.18, 0.02, -0.15); g.quadraticCurveTo(0.26, -0.12, 0.27, 0.06); g.quadraticCurveTo(0.2, 0.18, -0.05, 0.17); g.quadraticCurveTo(-0.3, 0.17, -0.42, 0.18); g.closePath(); g.fill();
    g.fillStyle = '#D6D0C4'; g.beginPath(); g.ellipse(-0.08, 0.02, 0.2, 0.08, 0.15, 0, Math.PI * 2); g.fill();
    // nek en kop (bij schrik: vleugels uit en de nek gestrekt)
    g.strokeStyle = '#F4F1EA'; g.lineWidth = 0.1; g.lineCap = 'round';
    const nx = 0.3 + schrik * 0.1, ny = 0.42 - schrik * 0.06;
    g.beginPath(); g.moveTo(0.18, 0.05); g.quadraticCurveTo(0.3, 0.2, nx, ny); g.stroke();
    g.fillStyle = '#F6F3EC'; g.beginPath(); g.ellipse(nx + 0.02, ny + 0.02, 0.075, 0.06, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#E8862C'; g.beginPath(); g.moveTo(nx + 0.08, ny + 0.035); g.lineTo(nx + 0.2, ny + 0.005 + (o.gak > 0 ? 0.02 : 0)); g.lineTo(nx + 0.08, ny - 0.01); g.closePath(); g.fill();
    g.fillStyle = '#1A1410'; g.beginPath(); g.arc(nx + 0.04, ny + 0.035, 0.012, 0, Math.PI * 2); g.fill();
    if (schrik) { g.fillStyle = 'rgba(240, 236, 228, .9)'; g.beginPath(); g.moveTo(-0.1, 0.1); g.quadraticCurveTo(-0.25, 0.45, -0.05, 0.5); g.quadraticCurveTo(0.05, 0.3, 0.05, 0.1); g.closePath(); g.fill(); }
    g.restore();
    void t;
  }
  function tekenKat(g, o) {
    const z = o.z;
    if (!zichtbaar(o.x - 1, o.x + 1, z) || z > 4.2) return;
    vlak(g, o.x, grond(W, o.x), z);
    g.scale(o.kant || 1, 1);
    g.fillStyle = 'rgba(30, 16, 8, .25)'; g.beginPath(); g.ellipse(0, 0.005, 0.24, 0.04, 0, 0, Math.PI * 2); g.fill();
    const st = o.stap * 1.4, rek = Math.sin(st) * 0.06;
    g.fillStyle = '#3A3430';
    g.strokeStyle = '#3A3430'; g.lineWidth = 0.045; g.lineCap = 'round';
    [[0.14, 0], [0.1, Math.PI], [-0.14, Math.PI * 0.5], [-0.18, Math.PI * 1.5]].forEach(([x, f]) => { const a = Math.sin(st + f) * 0.5; g.beginPath(); g.moveTo(x, 0.16); g.lineTo(x + Math.sin(a) * 0.12, 0.02); g.stroke(); });
    g.beginPath(); g.ellipse(0, 0.2, 0.2 + rek, 0.075, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(0.22 + rek, 0.26, 0.07, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(0.18 + rek, 0.31); g.lineTo(0.2 + rek, 0.37); g.lineTo(0.23 + rek, 0.32); g.moveTo(0.24 + rek, 0.32); g.lineTo(0.27 + rek, 0.37); g.lineTo(0.28 + rek, 0.3); g.fill();
    g.lineWidth = 0.035; g.beginPath(); g.moveTo(-0.2, 0.22); g.quadraticCurveTo(-0.34, 0.3, -0.32, 0.42 + Math.sin(st * 0.5) * 0.04); g.stroke();
    g.fillStyle = '#D8C040'; g.beginPath(); g.arc(0.25 + rek, 0.27, 0.012, 0, Math.PI * 2); g.fill();
  }

  // ---------- de hoepel: een houten hoepel van de kuiper met drie koperen belletjes ----------
  function tekenHoepel(g, rn, z, t) {
    const h = rn.hoep, x = h.x;
    if (!zichtbaar(x - 1, x + 1, z)) return;
    const gy = grond(W, x);
    vlak(g, x, gy, z);
    const m = S * sk(z);
    // schaduw
    if (!h.ligt) { g.fillStyle = 'rgba(30, 16, 8, .3)'; g.beginPath(); g.ellipse(0.02, 0.005, R * 0.8, 0.05, 0, 0, Math.PI * 2); g.fill(); }
    let rx = R, ry = R, hoogte = R + h.y, kantel = 0;
    if (h.ligt) {
      const plat = (PY(0, z - R) - PY(0, z + R)) / (2 * R * m);
      rx = R; ry = R * klem(plat, 0.12, 0.95); hoogte = 0.02;
    } else if (h.val > 0) {
      const a = klem(h.val / 0.75, 0, 1), lean = a * Math.PI / 2;
      const plat = (PY(0, z - R) - PY(0, z + R)) / (2 * R * m);
      ry = R * (Math.cos(lean) + Math.sin(lean) * klem(plat, 0.12, 0.95) * 0.9);
      rx = R * (1 - 0.2 * Math.sin(a * 9) * (1 - a));
      hoogte = ry + 0.02;
      kantel = Math.sin(a * 14) * 0.15 * (1 - a);
    } else if (h.w > 0.02) {
      const ww = Math.min(1, h.w), fw = t * (5 + 4 * ww) + rn.k;
      ry = R * Math.cos(ww * 0.55 * Math.sin(fw));
      rx = R * (1 - 0.22 * ww * Math.abs(Math.sin(fw * 0.7 + 1)));
      hoogte = ry + h.y;
      kantel = ww * 0.12 * Math.sin(fw * 0.5);
    }
    g.save();
    g.translate(0, hoogte); g.rotate(kantel);
    // de gloed als hij goed voor de stok zit (alleen voor wie zelf speelt)
    if (rn.mens && fase === 'spel' && !h.ligt && !h.val && rn.afkoel <= 0) {
      const d = h.x - rn.kind.x, q = 1 - Math.abs(d - D_OPT) / 0.1;
      if (q > 0) {
        g.strokeStyle = `rgba(255, 214, 110, ${0.55 * q * (0.75 + 0.25 * Math.sin(t * 14))})`;
        g.lineWidth = 0.11; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
      }
    }
    // de hoepel zelf: licht hout met een donkere binnenrand
    g.lineWidth = 0.056; g.strokeStyle = '#3A2412'; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 0.034; g.strokeStyle = '#D9AE6C'; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 0.012; g.strokeStyle = 'rgba(255, 244, 220, .85)'; g.beginPath(); g.ellipse(0, 0, rx + 0.008, ry + 0.008, 0, Math.PI * 0.95, Math.PI * 1.5); g.stroke();
    g.lineWidth = 0.01; g.strokeStyle = 'rgba(90, 56, 24, .6)'; g.beginPath(); g.ellipse(0, 0, rx - 0.009, ry - 0.009, 0, -Math.PI * 0.4, Math.PI * 0.35); g.stroke();
    // de belletjes draaien mee
    for (let i = 0; i < 3; i++) {
      const a = -h.phi + i * Math.PI * 2 / 3;
      const bx = Math.cos(a) * rx * 0.86, by = Math.sin(a) * ry * 0.86;
      const gr = g.createRadialGradient(bx - 0.01, by + 0.012, 0.002, bx, by, 0.034);
      gr.addColorStop(0, '#FFF0B8'); gr.addColorStop(0.5, '#D8A840'); gr.addColorStop(1, '#7A5418');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, 0.032, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  // ---------- het kind, van opzij, rennend achter zijn hoepel aan ----------
  const BEEN = [0.31, 0.29], ARM = [0.2, 0.19], STOK = 0.5;
  function ik(a, b, l1, l2, buig) {
    let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    d = Math.min(Math.max(d, 0.01), l1 + l2 - 0.001);
    dx /= Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; dy /= Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), s = Math.sqrt(Math.max(0, 1 - c * c));
    return [a[0] + (dx * c - dy * s * buig) * l1, a[1] + (dy * c + dx * s * buig) * l1];
  }
  function houding(rn) {
    const kd = rn.kind, h = rn.hoep, f = kd.fase;
    const juich = kd.juich > 0, sip = kd.sip > 0;
    const amp = klem(Math.abs(kd.v) / 4.2, 0, 1.1) * (1 - kd.buk);
    const bob = -amp * 0.028 * Math.cos(2 * f);
    const hipY = 0.64 - 0.025 * amp + bob - kd.buk * 0.24;
    const lean = 0.04 + 0.17 * amp + kd.buk * 0.55 + (sip ? 0.12 : 0) - (juich ? 0.06 : 0);
    const heup = [0, hipY];
    const schouder = [Math.sin(lean) * 0.37, hipY + Math.cos(lean) * 0.37];
    const kop = [schouder[0] + Math.sin(lean * 0.7 + (sip ? 0.3 : 0)) * 0.17 + 0.01, schouder[1] + Math.cos(lean * 0.7 + (sip ? 0.3 : 0)) * 0.17];
    const benen = [0, 1].map((i) => {
      const ph = f + i * Math.PI;
      const a1 = amp * (0.1 + 0.52 * Math.sin(ph)) + (amp < 0.15 ? (i ? -0.05 : 0.07) : 0);
      const kn = amp * (0.14 + 0.82 * Math.pow(0.5 + 0.5 * Math.cos(ph - 5.6), 2)) + 0.05 + kd.buk * 1.1;
      const knie = [heup[0] + Math.sin(a1) * BEEN[0], heup[1] - Math.cos(a1) * BEEN[0]];
      const a2 = a1 - kn;
      let enkel = [knie[0] + Math.sin(a2) * BEEN[1], knie[1] - Math.cos(a2) * BEEN[1]];
      if (enkel[1] < 0.05) enkel = [enkel[0], 0.05];
      return { knie, enkel, voet: Math.min(0.5, Math.max(-0.6, (a2 + 0.25) * 0.5)) };
    });
    // de vrije arm zwaait tegen het voorste been in; bij juichen gaan beide armen omhoog
    const zw = amp * 0.75 * Math.sin(f);
    let vrij;
    if (juich) vrij = [schouder[0] + 0.06, schouder[1] + 0.2, schouder[0] + 0.1 + Math.sin(nu() / 120) * 0.04, schouder[1] + 0.38];
    else {
      const el = [schouder[0] + Math.sin(zw) * ARM[0], schouder[1] - Math.cos(zw) * ARM[0]];
      const vz = zw + 1.25 + amp * 0.2;
      vrij = [el[0], el[1], el[0] + Math.sin(vz) * ARM[1], el[1] - Math.cos(vz) * ARM[1]];
    }
    // de stokhand reikt naar de hoepel
    const d = h.x - kd.x, slag = kd.slag;
    let hand;
    if (juich) hand = [schouder[0] + 0.04, schouder[1] + 0.36];
    else if (h.ligt || kd.buk > 0) hand = [0.25 + kd.buk * 0.1, 0.55 - kd.buk * 0.35];
    else hand = [0.17 + klem(d - D_OPT, -0.15, 0.2) * 0.6 + slag * 0.09, 0.72 - slag * 0.05];
    const elleboog = ik(schouder, hand, ARM[0], ARM[1], -1);
    return { heup, schouder, kop, benen, vrij, hand, elleboog, lean, amp, juich, sip };
  }
  function tekenKind(g, rn, z, t) {
    const kd = rn.kind, h = rn.hoep;
    if (!zichtbaar(kd.x - 1, kd.x + 1.5, z)) return;
    const U = UITERLIJK[rn.look] || UITERLIJK.jij, K = U.k;
    const p = houding(rn);
    vlak(g, kd.x, grond(W, kd.x), z);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // schaduw
    g.fillStyle = 'rgba(30, 16, 8, .3)'; g.beginPath(); g.ellipse(0.02, 0.005, 0.3, 0.05, 0, 0, Math.PI * 2); g.fill();
    const jurk = U.kleed === 'jurk';
    const kous = jurk ? '#2E2C34' : meng(U.kleur2, '#EFE8D8', 0.55);
    const been = (i) => {
      const b = p.benen[i], ver = i === 1;
      g.strokeStyle = jurk ? (ver ? '#1E1C22' : kous) : (ver ? K.kleur2.d : K.kleur2.m);
      g.lineWidth = jurk ? 0.075 : 0.1;
      g.beginPath(); g.moveTo(p.heup[0], p.heup[1]); g.lineTo(b.knie[0], b.knie[1]); g.stroke();
      g.strokeStyle = ver ? meng(kous, '#000', 0.3) : kous; g.lineWidth = 0.065;
      g.beginPath(); g.moveTo(b.knie[0], b.knie[1]); g.lineTo(b.enkel[0], b.enkel[1]); g.stroke();
      voet(g, b.enkel, b.voet, U.voet, ver);
    };
    const arm = (a, b, c, ver) => {
      g.strokeStyle = ver ? K.kleur.dd : K.kleur.m; g.lineWidth = 0.08;
      g.beginPath(); g.moveTo(p.schouder[0], p.schouder[1]); g.lineTo(a, b); g.lineTo(c[0], c[1]); g.stroke();
      g.fillStyle = ver ? K.huid.d : K.huid.m; g.beginPath(); g.arc(c[0], c[1], 0.034, 0, Math.PI * 2); g.fill();
    };
    been(1);
    arm(p.vrij[0], p.vrij[1], [p.vrij[2], p.vrij[3]], true);
    been(0);
    tekenLijf(g, p, U);
    tekenKop(g, p, U, rn);
    // de stok, en dan de hand die hem vasthoudt
    if (!p.juich) {
      const hoepX = h.x - kd.x, hoepY = grond(W, h.x) - grond(W, kd.x) + h.y + R;
      let tip;
      if (h.ligt || h.val > 0 || kd.buk > 0) tip = [p.hand[0] + 0.3, Math.max(0.02, p.hand[1] - 0.42)];
      else {
        const c = [hoepX - R * 0.84, hoepY + R * 0.5];
        const dx = c[0] - p.hand[0], dy = c[1] - p.hand[1], d = Math.hypot(dx, dy) || 1;
        const l = Math.min(STOK, d);
        tip = [p.hand[0] + dx / d * l + kd.slag * 0.05, p.hand[1] + dy / d * l];
      }
      const dx = tip[0] - p.hand[0], dy = tip[1] - p.hand[1], d = Math.hypot(dx, dy) || 1;
      const kont = [tip[0] - dx / d * (STOK + 0.06), tip[1] - dy / d * (STOK + 0.06)];
      g.strokeStyle = '#4A2E16'; g.lineWidth = 0.032; g.beginPath(); g.moveTo(kont[0], kont[1]); g.lineTo(tip[0], tip[1]); g.stroke();
      g.strokeStyle = 'rgba(255, 230, 190, .35)'; g.lineWidth = 0.01; g.beginPath(); g.moveTo(kont[0], kont[1] + 0.008); g.lineTo(tip[0], tip[1] + 0.008); g.stroke();
    }
    arm(p.elleboog[0], p.elleboog[1], p.hand, false);
    void t;
  }
  function voet(g, e, hoek, soort, ver) {
    g.save(); g.translate(e[0], e[1] - 0.045); g.rotate(-hoek * 0.6);
    if (soort === 'klomp') {
      g.beginPath(); g.moveTo(-0.07, 0.035); g.quadraticCurveTo(-0.085, -0.04, -0.03, -0.045); g.lineTo(0.12, -0.035); g.quadraticCurveTo(0.17, -0.01, 0.16, 0.03); g.quadraticCurveTo(0.06, 0.05, -0.07, 0.035); g.closePath();
      g.fillStyle = ver ? '#B0884C' : '#E2C285'; g.fill();
      g.strokeStyle = 'rgba(70, 46, 20, .5)'; g.lineWidth = 0.008; g.stroke();
    } else {
      g.beginPath(); g.moveTo(-0.06, 0.03); g.quadraticCurveTo(-0.07, -0.035, -0.02, -0.04); g.lineTo(0.1, -0.035); g.quadraticCurveTo(0.13, -0.01, 0.11, 0.02); g.quadraticCurveTo(0.03, 0.045, -0.06, 0.03); g.closePath();
      g.fillStyle = ver ? '#1A1614' : '#2E2622'; g.fill();
      g.fillStyle = '#C9B070'; g.fillRect(0.02, 0.005, 0.03, 0.02);
    }
    g.restore();
  }
  function tekenLijf(g, p, U) {
    const K = U.k, hp = p.heup, sh = p.schouder;
    g.save(); g.translate(hp[0], hp[1]); g.rotate(-p.lean);
    const gr = g.createLinearGradient(-0.1, 0.35, 0.12, 0);
    gr.addColorStop(0, K.kleur.l); gr.addColorStop(0.5, K.kleur.m); gr.addColorStop(1, K.kleur.d);
    if (U.kleed === 'jurk') {
      // de rok tot over de knie, met een schort ervoor
      g.beginPath(); g.moveTo(-0.075, 0.1); g.quadraticCurveTo(-0.15, -0.1, -0.16, -0.3); g.quadraticCurveTo(0, -0.34, 0.17, -0.29); g.quadraticCurveTo(0.14, -0.1, 0.08, 0.1); g.closePath();
      g.fillStyle = gr; g.fill();
      g.beginPath(); g.moveTo(0.03, 0.1); g.quadraticCurveTo(0.12, -0.1, 0.165, -0.28); g.lineTo(0.06, -0.3); g.quadraticCurveTo(0.03, -0.1, -0.005, 0.1); g.closePath();
      g.fillStyle = U.schort; g.fill();
    }
    // het bovenlijf: een kiel tot over de heup, of het lijfje van de jurk
    g.beginPath();
    if (U.kleed === 'kiel') { g.moveTo(-0.085, -0.13); g.quadraticCurveTo(-0.1, 0.18, -0.07, 0.38); g.quadraticCurveTo(0.01, 0.42, 0.075, 0.37); g.quadraticCurveTo(0.11, 0.18, 0.1, -0.13); g.quadraticCurveTo(0.01, -0.16, -0.085, -0.13); }
    else { g.moveTo(-0.075, 0.08); g.quadraticCurveTo(-0.09, 0.25, -0.065, 0.38); g.quadraticCurveTo(0.01, 0.42, 0.07, 0.37); g.quadraticCurveTo(0.095, 0.24, 0.08, 0.08); g.closePath(); }
    g.closePath();
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(20, 14, 10, .22)'; g.lineWidth = 0.008; g.stroke();
    if (U.kleed === 'kiel') { g.strokeStyle = 'rgba(20, 14, 10, .18)'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(-0.09, -0.02); g.quadraticCurveTo(0.01, 0.0, 0.1, -0.02); g.stroke(); }
    g.restore();
    void sh;
  }
  function tekenKop(g, p, U, rn) {
    const K = U.k, c = p.kop;
    g.save(); g.translate(c[0], c[1]); g.rotate(-(p.lean * 0.4) + (p.sip ? -0.35 : 0) + (p.juich ? 0.2 : 0)); g.scale(1.16, 1.16);
    // nek
    g.fillStyle = K.huid.d; g.fillRect(-0.03, -0.12, 0.05, 0.06);
    // achterhaar
    if (U.hoed !== 'hul') { g.fillStyle = K.haar.d; g.beginPath(); g.ellipse(-0.03, 0.02, 0.1, 0.1, 0, 0, Math.PI * 2); g.fill(); }
    // het gezicht
    const gr = g.createRadialGradient(0.02, 0.03, 0.01, 0, 0, 0.12);
    gr.addColorStop(0, K.huid.l); gr.addColorStop(0.6, K.huid.m); gr.addColorStop(1, K.huid.d);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-0.05, -0.08); g.quadraticCurveTo(-0.1, -0.02, -0.09, 0.04); g.quadraticCurveTo(-0.06, 0.11, 0.02, 0.105); g.quadraticCurveTo(0.08, 0.09, 0.085, 0.03);
    g.quadraticCurveTo(0.1, 0.0, 0.103, -0.012); g.quadraticCurveTo(0.09, -0.02, 0.085, -0.03); g.quadraticCurveTo(0.08, -0.08, 0.03, -0.09); g.quadraticCurveTo(-0.01, -0.095, -0.05, -0.08); g.closePath(); g.fill();
    // wang, oog en mond
    g.fillStyle = K.wang; g.globalAlpha = 0.5; g.beginPath(); g.arc(0.045, -0.025, 0.026, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    if (U.sproet) { g.fillStyle = 'rgba(168, 90, 40, .6)'; [[0.06, -0.005], [0.07, -0.02], [0.05, -0.012]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 0.004, 0, Math.PI * 2); g.fill(); }); }
    if (U.meel) { g.fillStyle = 'rgba(255, 255, 255, .7)'; g.beginPath(); g.ellipse(0.04, -0.03, 0.018, 0.01, 0.3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#2A1A10';
    const blij = p.juich || rn.kind.juich > 0;
    if (blij) { g.strokeStyle = '#2A1A10'; g.lineWidth = 0.01; g.beginPath(); g.arc(0.055, 0.022, 0.012, Math.PI * 1.1, Math.PI * 1.9, true); g.stroke(); }
    else { g.beginPath(); g.ellipse(0.058, 0.02, 0.0095, 0.012, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(150, 60, 50, .8)'; g.lineWidth = 0.008; g.beginPath();
    if (p.sip) { g.moveTo(0.06, -0.06); g.quadraticCurveTo(0.075, -0.052, 0.088, -0.062); } else { g.moveTo(0.058, -0.055); g.quadraticCurveTo(0.075, -0.066 - (blij ? 0.01 : 0), 0.09, -0.052); }
    g.stroke();
    // oor
    g.fillStyle = K.huid.d; g.beginPath(); g.ellipse(-0.01, 0.0, 0.018, 0.026, 0.2, 0, Math.PI * 2); g.fill();
    // haar en hoed
    const H = K.haar;
    if (U.hoed !== 'hul') {
      g.fillStyle = H.m; g.beginPath(); g.moveTo(0.07, 0.065); g.quadraticCurveTo(0.03, 0.12, -0.05, 0.1); g.quadraticCurveTo(-0.11, 0.06, -0.1, -0.03); g.quadraticCurveTo(-0.06, -0.01, -0.03, 0.04); g.quadraticCurveTo(0.02, 0.06, 0.07, 0.065); g.closePath(); g.fill();
    }
    if (U.hoed === 'stro') {
      g.fillStyle = '#E2C07C'; g.beginPath(); g.moveTo(-0.07, 0.07); g.quadraticCurveTo(-0.07, 0.15, 0, 0.15); g.quadraticCurveTo(0.07, 0.15, 0.07, 0.07); g.closePath(); g.fill();
      g.fillStyle = '#B8382A'; g.fillRect(-0.07, 0.07, 0.14, 0.022);
      g.fillStyle = '#D4B06C'; g.beginPath(); g.ellipse(0.005, 0.07, 0.14, 0.02, -0.05, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'muts') {
      g.fillStyle = U.muts; g.beginPath(); g.moveTo(0.075, 0.05); g.quadraticCurveTo(0.08, 0.15, -0.02, 0.15); g.quadraticCurveTo(-0.11, 0.13, -0.11, 0.03); g.quadraticCurveTo(-0.02, 0.05, 0.075, 0.05); g.closePath(); g.fill();
      g.fillStyle = meng(U.muts, '#000', 0.25); g.fillRect(-0.11, 0.025, 0.19, 0.03);
      g.fillStyle = '#F2E6D0'; g.beginPath(); g.arc(-0.04, 0.16, 0.025, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'pet') {
      g.fillStyle = U.pet; g.beginPath(); g.moveTo(0.075, 0.055); g.quadraticCurveTo(0.07, 0.14, -0.03, 0.14); g.quadraticCurveTo(-0.11, 0.13, -0.105, 0.04); g.quadraticCurveTo(-0.02, 0.06, 0.075, 0.055); g.closePath(); g.fill();
      g.fillStyle = meng(U.pet, '#000', 0.4); g.beginPath(); g.moveTo(0.06, 0.065); g.quadraticCurveTo(0.12, 0.07, 0.15, 0.05); g.quadraticCurveTo(0.11, 0.045, 0.06, 0.05); g.closePath(); g.fill();
    } else if (U.hoed === 'strik') {
      g.fillStyle = U.strik; g.beginPath(); g.moveTo(-0.06, 0.1); g.lineTo(-0.11, 0.14); g.lineTo(-0.1, 0.07); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-0.06, 0.1); g.lineTo(-0.01, 0.15); g.lineTo(0.0, 0.08); g.closePath(); g.fill();
    } else if (U.hoed === 'hul') {
      g.fillStyle = '#F4F1E8'; g.beginPath(); g.moveTo(0.07, 0.07); g.quadraticCurveTo(0.06, 0.14, -0.03, 0.14); g.quadraticCurveTo(-0.12, 0.12, -0.11, 0.0); g.quadraticCurveTo(-0.1, -0.07, -0.06, -0.08); g.lineTo(-0.04, -0.03); g.quadraticCurveTo(-0.04, 0.05, 0.07, 0.07); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160, 150, 130, .6)'; g.lineWidth = 0.008; g.stroke();
    } else if (U.hoed === 'bakker') {
      g.fillStyle = '#F6F3EC'; g.beginPath(); g.moveTo(0.075, 0.06); g.quadraticCurveTo(0.09, 0.2, -0.04, 0.2); g.quadraticCurveTo(-0.15, 0.18, -0.11, 0.05); g.quadraticCurveTo(-0.02, 0.07, 0.075, 0.06); g.closePath(); g.fill();
      g.fillStyle = '#E2DCCE'; g.fillRect(-0.11, 0.04, 0.19, 0.03);
    }
    g.restore();
  }

  // ---------- stofjes, spatten en sterretjes (in wereldmaten) ----------
  function strooi(x, y, z, n, soort, kracht) {
    if (rustig()) n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      const k = kracht || 1;
      deeltjes.push({ x, y, z, vx: (Math.random() - 0.3) * 2.2 * k, vy: (0.6 + Math.random() * 1.8) * k, vz: (Math.random() - 0.5) * 0.8, leef: soort === 'ster' ? 0.7 : 1.1, soort, r: 0.02 + Math.random() * 0.03, rot: Math.random() * 6 });
    }
  }
  function stapDeeltjes(dt) {
    deeltjes.forEach((q) => {
      const zwaar = q.soort === 'ster' ? 1.5 : q.soort === 'veer' ? 0.8 : 9.8;
      q.vy -= zwaar * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.leef -= dt; q.rot += dt * 6;
      if (q.soort === 'veer') { q.vx *= 0.96; q.vy = Math.max(q.vy, -0.4); }
      if (q.y < 0 && q.soort !== 'veer') { q.y = 0; q.vy *= -0.3; q.vx *= 0.5; }
    });
    deeltjes = deeltjes.filter((q) => q.leef > 0);
  }
  function tekenDeeltjes(g) {
    deeltjes.forEach((q) => {
      vlak(g, q.x, grond(W, q.x) + q.y, q.z);
      const a = Math.min(1, q.leef * 2);
      if (q.soort === 'spat') { g.fillStyle = `rgba(214, 228, 236, ${0.85 * a})`; g.beginPath(); g.arc(0, 0, q.r, 0, Math.PI * 2); g.fill(); }
      else if (q.soort === 'stof') { g.fillStyle = `rgba(190, 170, 140, ${0.5 * a})`; g.beginPath(); g.arc(0, 0, q.r * 1.6, 0, Math.PI * 2); g.fill(); }
      else if (q.soort === 'veer') { g.rotate(q.rot * 0.3); g.fillStyle = `rgba(250, 248, 242, ${a})`; g.beginPath(); g.ellipse(0, 0, 0.05, 0.016, 0, 0, Math.PI * 2); g.fill(); }
      else { g.rotate(q.rot); g.fillStyle = `rgba(255, 220, 120, ${a})`; g.beginPath(); for (let i = 0; i < 4; i++) { const b = i * Math.PI / 2; g.lineTo(Math.cos(b) * 0.05, Math.sin(b) * 0.05); g.lineTo(Math.cos(b + 0.78) * 0.015, Math.sin(b + 0.78) * 0.015); } g.closePath(); g.fill(); }
    });
  }

  // ---------- wie buiten beeld is, krijgt een pijltje aan de rand ----------
  function tekenRandjes(g) {
    if (!W) return;
    W.renners.forEach((rn) => {
      const z = Z_BAAN[rn.baan], sx = PX(rn.kind.x + 0.4, z);
      if (sx > -6 && sx < B + 6) return;
      const rechts = sx >= B + 6, afstand = Math.round(Math.abs(rn.hoep.x - W.renners[tegen ? 0 : 1 - rn.k].hoep.x));
      schermVlak(g);
      const y = PY(grond(W, rn.kind.x) + 0.9, z), w = 58, hh = 22, x = rechts ? B - w - 6 : 6;
      g.fillStyle = 'rgba(244, 233, 207, .92)'; g.strokeStyle = 'rgba(90, 60, 20, .45)'; g.lineWidth = 1;
      g.beginPath(); g.roundRect ? g.roundRect(x, y - hh / 2, w, hh, 11) : g.rect(x, y - hh / 2, w, hh); g.fill(); g.stroke();
      g.fillStyle = rn.look === 'jij' ? '#5D86B4' : (UITERLIJK[rn.look] || UITERLIJK.jij).kleur;
      g.beginPath(); g.arc(rechts ? x + 12 : x + w - 12, y, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2A1A08'; g.font = '600 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(`${rechts ? '' : '‹ '}${afstand} m${rechts ? ' ›' : ''}`, rechts ? x + 35 : x + 23, y + 0.5);
    });
  }

  // ---------- alles samen ----------
  function teken() {
    if (!ctx || !doek.width) return;
    const g = ctx, t = nu() / 1000;
    if (!achter) { achter = maakAchter(); vignet = maakVignet(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(achter, 0, 0);
    if (!W) return;
    tekenVerte(g);
    tekenOverkant(g, t);
    tekenStraat(g);
    tekenBrug(g);
    W.hindernissen.forEach((o) => { if (o.soort === 'plas') tekenPlas(g, o, t); });
    W.lantaarns.forEach((l) => { if (Math.abs(l.x - W.finish) > BRUG + 1 && zichtbaar(l.x - 1, l.x + 1, -0.32)) tekenLantaarn(g, l.x); });
    W.palen.forEach((x) => { if (Math.abs(x - W.finish) > BRUG + 1 && zichtbaar(x - 1, x + 1, -0.38)) tekenMeerpaal(g, x); });
    tekenLeuning(g);
    // wat op de straat staat of loopt, van ver naar dichtbij
    const lijst = [];
    W.hindernissen.forEach((o) => {
      if (o.soort === 'kei') lijst.push([Z_BAAN[o.baan] - 0.01, () => tekenKei(g, o)]);
      else if (o.soort === 'gans' && !o.weg) lijst.push([o.z, () => tekenGans(g, o, t)]);
      else if (o.soort === 'kat' && !o.weg) lijst.push([o.z, () => tekenKat(g, o)]);
    });
    W.renners.forEach((rn) => { const z = Z_BAAN[rn.baan]; lijst.push([z, () => { tekenKind(g, rn, z, t); tekenHoepel(g, rn, z + 0.02, t); }]); });
    lijst.sort((a, b) => a[0] - b[0]).forEach((e) => e[1]());
    tekenBrugVoor(g, t);
    W.voor.forEach((v) => { if (zichtbaar(v.x - 1, v.x + 1, 3.15) && Math.abs(v.x - W.finish) > BRUG + 2) tekenVoorgrond(g, v); });
    tekenDeeltjes(g);
    tekenRandjes(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(vignet, 0, 0);
  }

  // ============================================================
  // OPBOUW VAN HET SCHERM
  // ============================================================
  const hoepGezicht = (k) => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${k ? '#A9B98E' : '#9DBBD6'}"/>
    <path d="M6 54 L58 54" stroke="${k ? '#7E8C64' : '#7896B2'}" stroke-width="2"/>
    <circle cx="36" cy="31" r="19" fill="none" stroke="#6A4626" stroke-width="5"/><circle cx="36" cy="31" r="19" fill="none" stroke="#D4A464" stroke-width="2.4" stroke-dasharray="40 80" transform="rotate(150 36 31)"/>
    <g fill="#D8A840" stroke="#7A5418" stroke-width=".8"><circle cx="36" cy="13.5" r="3.2"/><circle cx="51.5" cy="40" r="3.2"/><circle cx="20.5" cy="40" r="3.2"/></g>
    <path d="M6 20 L22 36" stroke="#5A3A1E" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  const gezichtVan = (k) => (spelers[k] && spelers[k].persoon && window.Personen && Personen.gezicht[spelers[k].persoon] ? Personen.gezicht[spelers[k].persoon] : hoepGezicht(k));

  function bouw() {
    podium = document.getElementById('hp-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="hp-stand"><span class="hp-vaart" aria-hidden="true"><i></i></span></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeler" title="Kies je tegenspeler" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="hp-veldvak">
      <canvas class="hp-doek" role="application" tabindex="0" aria-label="Hoepelen. Tik op het veld om je hoepel een tik met de stok te geven. Met het toetsenbord: de spatiebalk."></canvas>
      <div class="hp-baan" aria-hidden="true"><i class="hp-lijn"></i><i class="hp-brug"></i><span class="hp-merk" data-k="1"></span><span class="hp-merk" data-k="0"></span></div>
      <div class="hp-tel" aria-hidden="true"></div>
      <div class="sj-pops hp-pops" aria-hidden="true"></div>
      <div class="sj-kaart hp-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="hp-stand"><span class="hp-vaart" aria-hidden="true"><i></i></span></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeler" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met wie hoepel je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders"></div>
        <div class="tt-keuzes"><div class="tt-keuzerij" role="group" aria-label="Hoe ver"><button class="kj-chip" type="button" data-lengte="kort">Korte race</button><button class="kj-chip" type="button" data-lengte="lang">Lange race</button></div></div>
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
      midden, vak: midden.querySelector('.hp-veldvak'), pops: midden.querySelector('.hp-pops'), uitslag: midden.querySelector('.hp-kaart'),
      tel: midden.querySelector('.hp-tel'), baan: midden.querySelector('.hp-baan'), merk: [...midden.querySelectorAll('.hp-merk')].sort((a, b) => a.getAttribute('data-k') - b.getAttribute('data-k')),
      meer: boven.querySelector('.mo-meer'), menu, lijst: menu.querySelector('.mo-tegenstanders'), meld: meldEl
    };
    doek = midden.querySelector('.hp-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', neer);
    doek.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', toets);
    ui.kaart[1].addEventListener('click', openMenu);
    ui.meer.addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('hoepelen'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', () => sluitMenu(true));
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(true); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(false); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    menu.querySelectorAll('[data-lengte]').forEach((c) => c.addEventListener('click', () => {
      const l = c.getAttribute('data-lengte');
      if (l === lengte) return;
      lengte = l;
      if (window.Duiten) Duiten.zetVeld('hp-lengte', l);
      werkSchakelaars(); sluitMenu(false); nieuwePartij();
    }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(true); });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(ui.midden);
    window.addEventListener('resize', () => pasMaatAan());
    const les = document.getElementById('les');
    if (les && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (location.hash === '#hoepelen' && les.hidden) { lesDemo(null); hervat(); } }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
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
    const nieuweL = Math.round(B * klem(hoog / Math.max(1, breed - 8), 0.42, 1.9));
    const s = Math.max(0.4, Math.min((breed - 8) / B, hoog / nieuweL, 3.2));
    // hooguit 2,5 beeldpunten per punt: haarscherp genoeg, en de race blijft vloeiend
    const nieuweDpr = Math.min(2.5, window.devicePixelRatio || 1);
    if (nieuweL === L && Math.abs(s - sc) < 0.001 && nieuweDpr === dpr && achter) return;
    L = nieuweL; sc = s; dpr = nieuweDpr;
    // hoe hoger het beeld, hoe hoger de camera: dan zie je de gracht en de huizen erboven
    hc = klem(0.5 + (L / B) * 3.7, 2.5, 6.4);
    Y0 = L - klem(L * 0.075, 14, 48);
    // staand dichterbij; in een breed, laag beeld verder weg, zodat de topgevels aan de overkant nog in beeld zijn
    S0 = klem(Math.min(B / klem(8.2 - (L / B - 0.7) * 2.2, 6.3, 8.0), (Y0 - 24) / ((0.805 * hc + 2.73) * 1.12)), B / 12.5, B / 6.3);
    podium.style.setProperty('--hp-b', Math.round(B * sc) + 'px');
    podium.style.setProperty('--hp-h', Math.round(L * sc) + 'px');
    doek.width = Math.round(B * sc * dpr); doek.height = Math.round(L * sc * dpr);
    achter = null;
    werkCameraBij(0, true);
    teken();
  }

  // ============================================================
  // DE LUS: natuurkunde met vaste stapjes, geluid, camera en tekenen
  // ============================================================
  function lus(t) {
    raf = requestAnimationFrame(lus);
    const dt = vorigeT ? Math.min(0.05, (t - vorigeT) / 1000) : 0;
    vorigeT = t;
    if (W && !bevroren) {
      rest += dt;
      let n = 0;
      while (rest >= DT && n < 12) { stapWereld(W, DT); rest -= DT; n++; }
      werkGeluidBij();
    }
    stapDeeltjes(dt);
    if (W) { werkCameraBij(dt); werkStandBij(); }
    teken();
  }
  // belletjes, klompen op de klinkers en het rollen van jouw hoepel
  function werkGeluidBij() {
    if (!W) return;
    let vMens = 0;
    W.renners.forEach((rn) => {
      const h = rn.hoep, kd = rn.kind, z = Z_BAAN[rn.baan];
      const sx = PX(h.x, z), dichtbij = sx > -80 && sx < B + 80;
      const pan = klem((sx / B - 0.5) * 1.2, -0.8, 0.8);
      const halve = Math.floor(h.phi / Math.PI);
      if (rn.belFase === undefined) rn.belFase = halve;
      if (halve !== rn.belFase) {
        rn.belFase = halve;
        if (dichtbij && !h.ligt && h.v > 0.4) Geluid.rinkel(klem(h.v / 5, 0.2, 1) * (rn.mens ? 1 : 0.45), pan);
      }
      const stap = Math.floor(kd.fase / Math.PI - 0.37);
      if (rn.stapFase === undefined) rn.stapFase = stap;
      if (stap !== rn.stapFase) {
        rn.stapFase = stap;
        if (dichtbij && Math.abs(kd.v) > 0.6 && (rn.mens || Math.abs(sx - B / 2) < B * 0.4)) Geluid.voet((UITERLIJK[rn.look] || UITERLIJK.jij).voet, pan);
      }
      if (rn.mens && !h.ligt && !h.val) vMens = Math.max(vMens, h.v);
    });
    if (fase === 'spel' || fase === 'uit') {
      if (!rol) rol = Geluid.rollen();
      rol.zet(vMens);
    } else stopRollen();
  }
  function stopRollen() { if (rol) { rol.stop(); rol = null; } }

  // ============================================================
  // HET SPELVERLOOP
  // ============================================================
  function nieuwePartij() {
    spelId++;
    if (tegen) spelers = [{ naam: 'Jij', mens: true, look: 'jij' }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, look: tegen.id }];
    else spelers = [{ naam: 'Speler 1', mens: true, look: 'jij' }, { naam: 'Speler 2', mens: true, look: 'twee' }];
    winnaar = -1; potjes++;
    if (ui.uitslag) ui.uitslag.hidden = true;
    W = maakWereld(zaad(Math.floor(rnd() * 1e9)), lengte);
    W.cb = LIVE;
    W.renners = [0, 1].map((k) => maakRenner(k, spelers[k].look, spelers[k].mens, spelers[k].t));
    deeltjes = []; vingers.clear(); bevroren = false; herstart = null;
    stopRollen();
    camX = 0; zoom = 1.12;
    werkCameraBij(0, true);
    werkKaartenBij();
    if (tegen) setTimeout(() => zeg(1, 'start'), 500);
    meld(tegen ? `Nieuwe race tegen ${tegen.naam}. Wie het eerst boven op de brug is, wint.` : 'Nieuwe race met z\'n tweeën.');
    aftellen(false);
  }
  const pop0 = (rn, tekst, soort) => { const h = rn.hoep; pop(h.x, grond(W, h.x) + 0.9, Z_BAAN[rn.baan], tekst, soort); };
  const LIVE = {
    slag(rn, q) {
      const h = rn.hoep, z = Z_BAAN[rn.baan];
      if (rn.mens || Math.abs(PX(h.x, z) - B / 2) < B * 0.6) Geluid.hoepel(q * (rn.mens ? 1 : 0.6));
      if (!rn.mens) return;
      if (window.Tril) Tril.tik();
      if (q > 0.86) { strooi(h.x - R * 0.8, R * 1.5, z, 4, 'ster', 0.6); if (rn.goed % 4 === 1) pop0(rn, willekeurig(['Mooi!', 'Raak!', 'Zo!']), 'goed'); }
    },
    mis(rn, d) {
      if (!rn.mens || fase !== 'spel') return;
      Geluid.woesj();
      pop0(rn, d < ZONE[0] ? 'Te dichtbij' : 'Te ver', 'zacht');
    },
    val(rn) {
      const h = rn.hoep, z = Z_BAAN[rn.baan];
      if (rn.mens || Math.abs(PX(h.x, z) - B / 2) < B * 0.7) Geluid.kletter();
      strooi(h.x, 0.05, z, 6, 'stof', 0.7);
      if (fase !== 'spel') return;
      if (rn.mens) { pop0(rn, 'Om!', 'fout'); if (window.Tril) Tril.fout(); }
      else if (Math.random() < 0.6) zeg(rn.k, 'val');
    },
    op() { Geluid.pak(); },
    hop(rn) { strooi(rn.hoep.x, 0.03, Z_BAAN[rn.baan], 3, 'stof', 0.5); if (rn.mens) Geluid.hout(0.35); },
    land(rn) { if (rn.mens) Geluid.hout(0.25); },
    stoot(rn) {
      Geluid.hout(0.9);
      if (rn.mens && fase === 'spel') { pop0(rn, 'Bonk!', 'fout'); if (window.Tril) Tril.bots(0.8); }
    },
    plas(rn, o) {
      const z = Z_BAAN[rn.baan];
      if (rn.mens || Math.abs(PX(rn.hoep.x, z) - B / 2) < B * 0.6) Geluid.spat();
      strooi(rn.hoep.x, 0.05, z, 12, 'spat', 1);
      o.spatT = W.t; o.spatX = rn.hoep.x;
    },
    dier(rn, o) {
      if (o.soort === 'gans') { Geluid.gak(); o.gak = 0.5; } else Geluid.miauw();
      strooi(o.x, 0.4, o.z, o.soort === 'gans' ? 8 : 0, 'veer', 0.6);
      if (fase !== 'spel') return;
      if (rn.mens) pop0(rn, o.soort === 'gans' ? 'Gak!' : 'Miauw!', 'fout');
      else zeg(rn.k, 'gans');
    },
    dierStart(o) {
      const sx = PX(o.x, 1.2);
      if (sx < B * 1.6) { if (o.soort === 'gans') { Geluid.gak(); o.gak = 0.5; } else Geluid.miauw(); }
    },
    finish(rn) {
      if (fase !== 'spel' || winnaar >= 0) return;
      winnaar = rn.k;
      W.lint = W.t;
      W.actief = false;
      fase = 'uit';
      rn.kind.juich = 4;
      const ander = W.renners[1 - rn.k];
      ander.kind.sip = 3;
      Geluid.munt();
      if (window.Tril && rn.mens) Tril.succes();
      vonken(rn.mens ? 26 : 8);
      werkKaartenBij();
      const id = spelId;
      setTimeout(() => { if (id === spelId) einde(winnaar); }, rustig() ? 500 : 1500);
    }
  };
  function aftellen(verder) {
    const id = ++spelId;
    fase = 'aftellen';
    if (W) W.actief = false;
    const zet = (tekst, groot, sub) => {
      if (!ui.tel) return;
      ui.tel.innerHTML = `<b class="${groot ? 'groot' : ''}"></b>${sub ? '<span></span>' : ''}`;
      ui.tel.querySelector('b').textContent = tekst;
      if (sub) ui.tel.querySelector('span').textContent = sub;
      ui.tel.classList.remove('in'); void ui.tel.offsetWidth; ui.tel.classList.add('in');
    };
    const stappen = verder ? [] : ['3', '2', '1'];
    const duur = rustig() ? 350 : 640;
    let i = 0;
    const volgende = () => {
      if (id !== spelId) return;
      if (i < stappen.length) { zet(stappen[i], true, i === 0 && !tegen ? (kaartenOpzij() ? 'Speler 1 tikt rechts, speler 2 links' : 'Speler 1 tikt links, speler 2 rechts') : ''); if (Geluid.tel) Geluid.tel(); i++; setTimeout(volgende, duur); return; }
      zet(verder ? 'Verder!' : 'Hup!', false);
      Geluid.start();
      fase = 'spel';
      if (W) { W.actief = true; W.renners.forEach((rn) => { rn.plan.volgende = W.t + 0.18 + Math.random() * 0.25; }); }
      werkKaartenBij();
      setTimeout(() => { if (ui.tel && fase === 'spel') ui.tel.innerHTML = ''; }, 900);
    };
    setTimeout(volgende, verder ? 200 : (rustig() ? 200 : 650));
  }
  function einde(w) {
    fase = 'klaar';
    stopRollen();
    werkKaartenBij();
    const rs = W.renners, voor = Math.max(0, rs[w].hoep.x - rs[1 - w].hoep.x);
    const verschil = voor >= 1.5 ? `${Math.round(voor)} meter voor` : 'op een haar na';
    let bedrag, tekst, verderKnop = null, gewonnenSpel = false;
    if (!tegen) {
      bedrag = 20; gewonnenSpel = true; tekst = `${naamVan(w)} is het eerst boven op de brug, ${verschil}!`;
      banier(`${naamVan(w)} wint!`, verschil);
      Geluid.tada(); vonken(30);
    } else if (w === 0) {
      const telling = gewonnen(), eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('hoepel-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true; tekst = `Gewonnen van ${tegen.naam}, ${verschil}!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} wil nu ook tegen je hoepelen!`;
        verderKnop = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('hp-tegen', volgende.id); nieuwePartij(); } };
      }
      banier('Gewonnen!', verschil);
      Geluid.tada(); vonken(40);
      zeg(1, 'verliest');
    } else {
      bedrag = 10; tekst = `${tegen.naam} was eerst boven, ${verschil}. Goed geprobeerd!`;
      banier(`${tegen.naam} wint`, verschil);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'hoepelen', bedrag, gewonnen: gewonnenSpel, tekst, verder: verderKnop, wacht: 2400 });
    const id = spelId;
    setTimeout(() => {
      if (fase !== 'klaar' || id !== spelId || !ui.uitslag) return;
      ui.uitslag.innerHTML = `<b>${tegen ? (w === 0 ? 'Gewonnen!' : 'Volgende keer beter') : `${naamVan(w)} wint!`}</b><span>${verschil}</span><button class="knop hp-weer" type="button">${icoon('opnieuw')}Nog een race</button>`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.hp-weer').addEventListener('click', () => nieuwePartij());
    }, 2300);
  }

  // ============================================================
  // TIKKEN (vinger, muis of toetsenbord)
  // ============================================================
  // met z'n tweeën: ieder tikt aan zijn eigen kant. Staan de kaarten naast het veld (telefoon dwars), dan is dat de kant
  // van je kaart (speler 2 links); anders tikt speler 1 links en speler 2 rechts.
  const kaartenOpzij = () => !!(window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches);
  function welkKind(e) {
    if (tegen) return 0;
    const r = doek.getBoundingClientRect(), links = e.clientX - r.left < r.width / 2;
    return kaartenOpzij() ? (links ? 1 : 0) : (links ? 0 : 1);
  }
  function tik(k) {
    if (!W || fase !== 'spel' || !spelers[k] || !spelers[k].mens) return;
    const rn = W.renners[k];
    rn.wil = Math.min(2, rn.wil + 1);
  }
  function neer(e) {
    if (!W || lesOpen() || fase === 'klaar') return;
    e.preventDefault();
    try { doek.focus({ preventScroll: true }); } catch (er) { /* */ }
    tik(welkKind(e));
  }
  const LINKS_TOETSEN = ['a', 'q', 's', 'w', 'z', ' '], RECHTS_TOETSEN = ['l', 'k', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  function toets(e) {
    if (location.hash !== '#hoepelen' || !W || lesOpen() || (ui.menu && !ui.menu.hidden)) return;
    const a = document.activeElement;
    if (a && a !== document.body && a !== doek) return;
    const t = (e.key || '').toLowerCase();
    let k = -1;
    if (tegen) { if ([' ', 'enter', 'arrowup', 'arrowright'].includes(t)) k = 0; }
    else if (LINKS_TOETSEN.includes(t)) k = 0;
    else if (RECHTS_TOETSEN.includes(t)) k = 1;
    if (k < 0) return;
    e.preventDefault();
    if (e.repeat) return;
    tik(k);
  }

  // ============================================================
  // DE KAARTEN, DE BAAN BOVENIN, PRAATJES EN BERICHTEN
  // ============================================================
  let standSleutel = '';
  function werkStandBij() {
    if (!ui.kaart || !spelers.length || !W) return;
    // de vaartmeters en de baan: elk beeldje
    W.renners.forEach((rn, k) => {
      const naald = ui.kaart[k].querySelector('.hp-vaart i');
      if (naald) {
        const v = rn.hoep.ligt || rn.hoep.val ? 0 : rn.hoep.v, p = Math.round(klem(v / 7, 0, 1) * 100);
        if (naald._p !== p) { naald._p = p; naald.style.left = p + '%'; }
      }
      const m = ui.merk[k];
      if (m) {
        const p = Math.round(klem(rn.hoep.x / W.finish, 0, 1) * 1000) / 10;
        if (m._p !== p) { m._p = p; m.style.left = p + '%'; }
      }
    });
    const sl = W.renners.map((rn) => hint(rn)).join('|') + '|' + fase;
    if (sl !== standSleutel) { standSleutel = sl; werkKaartenBij(); }
  }
  function hint(rn) {
    if (fase !== 'spel') return '';
    const h = rn.hoep, d = h.x - rn.kind.x;
    if (h.ligt || h.val > 0) return 'op';
    if (h.v < 0.2) return 'tik';
    if (h.w > 0.45 && h.v < V_KRIT + 0.4) return 'langzaam';
    if (h.v > V_WILD - 0.3) return 'hard';
    if (d > ZONE[1]) return 'ver';
    return '';
  }
  function werkKaartenBij() {
    if (!ui.kaart || !spelers.length || !W) return;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k], p = spelers[k], rn = W.renners[k];
      kaart.classList.toggle('aan', fase === 'spel');
      kaart.classList.toggle('hp-winnaar', (fase === 'klaar' || fase === 'uit') && winnaar === k);
      const gz = kaart.querySelector('.mo-gezicht'), wie = p.persoon || 'hoepel' + k;
      if (gz.getAttribute('data-wie') !== wie) { gz.innerHTML = gezichtVan(k); gz.setAttribute('data-wie', wie); }
      kaart.querySelector('.mo-naam').textContent = p.naam;
      const m = ui.merk[k];
      if (m && m.getAttribute('data-wie') !== wie) { m.innerHTML = gezichtVan(k); m.setAttribute('data-wie', wie); }
      const doe = kaart.querySelector('.mo-doe');
      let tekst = '';
      const hh = hint(rn);
      if (p.mens) {
        tekst = { op: 'Oprapen…', tik: 'Tik!', langzaam: 'Sneller!', hard: 'Rustig aan', ver: 'Wacht even' }[hh] || '';
        if (fase === 'spel' && !tekst && !rn.slagen) tekst = 'Tik!';
      } else if (hh === 'op') tekst = 'Raapt op…';
      const html2 = tekst ? `<span>${tekst}</span>` : '';
      if (doe.getAttribute('data-hint') !== html2) { doe.innerHTML = html2; doe.setAttribute('data-hint', html2); }
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-ster"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', `${tegen ? 'Tegenspeler: ' + tegen.naam : 'Speler 2'}. Tik om te wisselen`);
      } else kaart.setAttribute('aria-label', p.naam);
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
  function pop(x, y, z, tekst, soort) {
    if (!ui.pops || !doek) return;
    const e = document.createElement('span');
    e.className = 'sj-pop hp-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekst;
    const rv = ui.vak.getBoundingClientRect(), r = doek.getBoundingClientRect();
    e.style.left = klem(r.left - rv.left + PX(x, z) * sc, 44, rv.width - 44) + 'px';
    e.style.top = klem(r.top - rv.top + PY(y, z) * sc, 30, rv.height - 20) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), 1500);
  }
  function banier(titel, sub) {
    if (!ui.vak) return;
    ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    const b = document.createElement('div');
    b.className = 'sj-banier hp-banier';
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
    ui.menu.querySelectorAll('[data-lengte]').forEach((c) => c.classList.toggle('nu', c.getAttribute('data-lengte') === lengte));
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
      const gezichtje = t === TWEE ? `<span class="mo-twee">${hoepGezicht(0)}${hoepGezicht(1)}</span>` : (window.Personen ? Personen.gezicht[t.id] : '');
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
        if (window.Duiten) Duiten.zetVeld('hp-tegen', t.id);
        sluitMenu(false);
        nieuwePartij();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // ONDERBREKEN (weg van het scherm, het menu, of Gijs komt uitleggen) EN HERVATTEN
  // ============================================================
  let herstart = null;
  function onderbreek() {
    if (ui.vak) ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    stopRollen();
    if (!gebouwd || !W || bevroren) return;
    if (fase === 'aftellen' || fase === 'spel') herstart = 'verder';
    spelId++;
    bevroren = true;
    W.actief = false;
    W.renners.forEach((rn) => { rn.wil = 0; });
    vingers.clear();
    if (ui.tel) ui.tel.innerHTML = '';
    if (fase === 'aftellen' || fase === 'spel') fase = 'pauze';
    else if (fase === 'uit') { herstart = 'einde'; }
  }
  function hervat() {
    if (!gebouwd || lesOpen() || !W || (ui.menu && !ui.menu.hidden)) return;
    bevroren = false;
    const h = herstart; herstart = null;
    if (h === 'einde' && winnaar >= 0) { einde(winnaar); return; }
    if (h === 'verder') aftellen(true);
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function lesDemo(soort) {
    if (!gebouwd || soort === lesSoort || !W) return;
    if (!lesSoort && soort) {
      onderbreek();
      lesBewaard = { W, camX, zoom, xa, uitslag: !!ui.uitslag && !ui.uitslag.hidden };
      if (ui.uitslag) ui.uitslag.hidden = true;
      // een eigen straatje om te laten zien: jij staat klaar, verderop een kei en een gans
      const w = maakWereld(zaad(424242), 'kort');
      w.hindernissen = [{ soort: 'kei', x: 1.5, baan: 0, h: 0.09 }, { soort: 'gans', x: 2.9, z: 1.35, vz: 0, snel: 0.85, weg: false, geraakt: 0, stap: 1, kant: -1, gak: 0, loopt: true }];
      w.cb = {};
      w.renners = [0, 1].map((k) => maakRenner(k, spelers[k].look, spelers[k].mens, spelers[k].t));
      w.renners[1].kind.x = -6; w.renners[1].hoep.x = -5.3;
      W = w;
    }
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) {
        W = lesBewaard.W; camX = lesBewaard.camX; zoom = lesBewaard.zoom; xa = lesBewaard.xa;
        if (lesBewaard.uitslag && fase === 'klaar' && ui.uitslag) ui.uitslag.hidden = false;
        lesBewaard = null; werkCameraBij(0, true);
      }
      return;
    }
    const rn = W.renners[0], h = rn.hoep, kd = rn.kind;
    Object.assign(h, { x: 0, v: 0, w: 0, y: 0, vy: 0, val: 0, ligt: false });
    Object.assign(kd, { x: -D_OPT, v: 0, slag: soort === 'tik' ? 0.8 : 0, buk: 0 });
    rn.afkoel = 0;
    if (soort === 'vaart') { h.v = 3.6; kd.v = 3.6; kd.fase = 2.2; }
    werkCameraBij(0, true);
  }
  const vakOm = (x, y, z, r) => { const d = doek.getBoundingClientRect(), m = S * sk(z) * sc; return { left: d.left + PX(x, z) * sc - r * m, top: d.top + PY(y, z) * sc - r * m, width: 2 * r * m, height: 2 * r * m }; };
  const scherm = (x, y, z) => { const d = doek.getBoundingClientRect(); return [d.left + PX(x, z === undefined ? Z_BAAN[0] : z) * sc, d.top + PY(y, z === undefined ? Z_BAAN[0] : z) * sc]; };
  if (window.Les) {
    Les.zet('hoepelen', () => [
      { doel: () => { lesDemo('kijk'); return vakOm(0, R, Z_BAAN[0], 0.62); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Dit is jouw hoepel. Wie hem het eerst boven op de brug heeft, wint' },
      { doel: () => { lesDemo('tik'); return vakOm(-0.32, 0.6, Z_BAAN[0], 0.8); }, vorm: 'rond', gebaar: 'tik', tekst: 'Tik op het veld: dan geef je de hoepel een tik met je stok' },
      { doel: () => { lesDemo('kijk'); return vakOm(0, R, Z_BAAN[0], 0.55); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Tik als de hoepel glimt. Dan loopt hij het hardst en het rechtst' },
      { doel: () => { lesDemo('vaart'); return ui.kaart[0].querySelector('.hp-vaart'); }, marge: 8, gebaar: 'wijs', tekst: 'Te langzaam? Dan wiebelt hij en valt hij om. Te hard? Dan loopt hij van je weg' },
      { doel: () => { lesDemo('kei'); return vakOm(2.2, 0.35, Z_BAAN[0], 1.25); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Met vaart wip je over een losse kei. Steekt er een gans over, houd dan even in' },
      { doel: () => { lesDemo(null); return ui.meer; }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je tegen wie je hoepelt, of speel je met z\'n tweeën' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.hoepelen = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaardT = window.Duiten ? Duiten.veld('hp-tegen', 'mieke') : 'mieke';
        const t = TEGENSTANDERS.find((x) => x.id === bewaardT);
        tegen = bewaardT === 'twee' ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
        lengte = window.Duiten && Duiten.veld('hp-lengte', 'lang') === 'kort' ? 'kort' : 'lang';
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste || !W) nieuwePartij();
        else { werkKaartenBij(); hervat(); }
        cancelAnimationFrame(raf);
        vorigeT = 0;
        raf = requestAnimationFrame(lus);
        if (window.Les) Les.eersteKeer('hoepelen');
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
        fase, winnaar, lengte, tegen: tegen ? tegen.id : 'twee', L, sc, S, hc, yH, camX, bevroren,
        renners: W ? W.renners.map((rn) => ({ x: rn.hoep.x, v: rn.hoep.v, w: rn.hoep.w, ligt: rn.hoep.ligt, kind: rn.kind.x, slagen: rn.slagen, vallen: rn.vallen, klaar: rn.klaar })) : [],
        finish: W ? W.finish : 0
      };
    },
    _scherm(x, y, z) { return scherm(x, y, z); },
    _test: {
      zaad(n) { rnd = n === undefined ? Math.random : zaad(n); },
      wereld() { return W; },
      tik(k) { tik(k || 0); },
      intern: { stapWereld, maakWereld, maakRenner, slaan, grond, zaad },
      // hele races in stilte, om de tegenspelers af te stemmen
      sim(idA, idB, n, seed, soort) {
        const zoek = (id) => (typeof id === 'object' ? id : id === 'mens' ? MENS_MODEL : TEGENSTANDERS.find((x) => x.id === id));
        const ai = [zoek(idA), zoek(idB)];
        const r = zaad(seed || 99);
        const uit = { a: 0, b: 0, tijd: [0, 0], vallen: [0, 0], slagen: [0, 0], goed: [0, 0], verschil: 0 };
        for (let s = 0; s < (n || 20); s++) {
          const w = maakWereld(r, soort || 'lang');
          w.cb = {};
          w.renners = [0, 1].map((k) => maakRenner(k, 'jij', false, ai[k]));
          w.actief = true;
          let t = 0, eerste = -1;
          while (t < 240 && w.renners.some((rn) => !rn.klaar)) {
            stapWereld(w, DT); t += DT;
            if (eerste < 0) { const f = w.renners.find((rn) => rn.klaar); if (f) eerste = f.k; }
          }
          if (eerste === 0) uit.a++; else if (eerste === 1) uit.b++;
          w.renners.forEach((rn, i) => { uit.tijd[i] += rn.tijd || t; uit.vallen[i] += rn.vallen; uit.slagen[i] += rn.slagen; uit.goed[i] += rn.goed; });
          uit.verschil += Math.abs((w.renners[0].tijd || t) - (w.renners[1].tijd || t));
        }
        const m = n || 20;
        uit.tijd = uit.tijd.map((x) => +(x / m).toFixed(1)); uit.vallen = uit.vallen.map((x) => +(x / m).toFixed(2));
        uit.slagen = uit.slagen.map((x) => +(x / m).toFixed(1)); uit.goed = uit.goed.map((x) => +(x / m).toFixed(1));
        uit.verschil = +(uit.verschil / m).toFixed(1);
        return uit;
      }
    }
  };
})();
