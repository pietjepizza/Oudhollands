/* Vliegeren, schermvullend: een vliegerwedstrijd op het stoppelveld, onder een Hollandse wolkenlucht.

   Zo ging het vroeger:
   - een van de vroegste afbeeldingen van een vlieger in de Nederlanden staat op een prent naar Adriaen van de Venne
     bij het Kinder-spel van Jacob Cats (Middelburg, 1618): kinderen spelen op het plein voor het Hof van Zeeland, en
     hoog boven hen staat een vlieger. Vliegers komen uit Azië; hoe ze naar Europa kwamen, weet niemand precies;
   - in de nazomer, na de oogst, liet men vliegers op boven de stoppelvelden. Wie stond het hoogst? En men stuurde een
     papiertje langs het touw omhoog: in Brabant een 'bode', in Brugge een 'verzendertje' (Biekorf, 1931);
   - wie te hard trekt in een windvlaag, raakt zijn vlieger kwijt: het touw knapt.

   Speelgevoel: houd vast en je haalt het touw in (de vlieger klimt steiler, maar het touw wordt korter); laat los en
   je viert: de wind neemt touw mee en de vlieger gaat verder weg en hoger. In de luwte zakt de vlieger: haal in, anders
   valt hij in de stoppels. In een windvlaag: niet trekken, anders knapt het touw. Een vlaag of luwte trekt zichtbaar van
   links over het veld. Wie het hoogst staat als de kerkklok slaat, wint; elk briefje dat boven komt telt vijf meter mee. */
(function () {
  'use strict';

  // ============================================================
  // MATEN EN REGELS (meters en seconden; het beeld is 400 punten breed)
  // ============================================================
  const B = 400, DT = 1 / 60;
  const L_MIN = 6, L_MAX = 150, L_START = 10;   // touw op de klos
  const V_IN = 2.6;                             // zo snel haal je in (m/s)
  const V_TREK = 3.2;                           // inhalen geeft de vlieger zoveel extra wind
  const V_VIER0 = 3.5, V_VIER = 0.55;           // vieren: zoveel touw neemt de wind mee per m/s boven de 3,5 m/s
  const KWIJT_T = 3;                            // zo lang duurt het voor de reservevlieger in de lucht is
  const W_BREUK = 13, BREUK_T = 0.5;            // boven deze (schijnbare) wind knapt het touw als je blijft trekken
  const RONDE = 70;                             // zo lang tot de klok slaat
  const BRIEFJES = 3, BONUS = 5;
  const C_WIND = 70;                            // zo snel trekt een vlaag over het veld (punten per seconde)
  const GR = Math.PI / 180;

  // Hoe de vliegeraars eruitzien (van achteren gezien), en hun vlieger
  const UITERLIJK = {
    jij: { huid: '#F3CFAE', haar: '#7A4A22', hoed: 'stro', kleur: '#5D86B4', kleur2: '#3B3A48', rok: false, vlieger: 'zon' },
    twee: { huid: '#EBC3A0', haar: '#3E2A1A', hoed: 'muts', muts: '#B3362A', kleur: '#7A8656', kleur2: '#3A342E', rok: false, vlieger: 'maan' },
    mieke: { huid: '#F8DCC2', haar: '#9A5A2C', hoed: 'strik', strik: '#C8382B', kleur: '#3F6EA6', kleur2: '#2A2A38', schort: '#EFE6D2', rok: true, vlieger: 'hart' },
    teun: { huid: '#F2CBA6', haar: '#D9A94E', hoed: 'bakker', kleur: '#EFEAE0', kleur2: '#3A3A44', rok: false, vlieger: 'krakeling' },
    trijntje: { huid: '#F3D1B1', haar: '#5A3820', hoed: 'hul', kleur: '#4F7A4A', kleur2: '#2A2A28', schort: '#ECE5D6', rok: true, vlieger: 'ster' },
    kees: { huid: '#EFC4A0', haar: '#CFC8BA', hoed: 'molenaar', kleur: '#E6E0D2', kleur2: '#6A5A48', rok: false, vlieger: 'prins' }
  };

  // ============================================================
  // TEGENSPELERS: hoe snel ze een vlaag zien aankomen, wanneer ze inhalen en hoe vaak ze toch blijven trekken
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'mieke', niveau: 1, beloning: 25, traag: 0.8, vooruit: 0, laag: 0.5, hoog: 0.72, slaap: 0.35, roekeloos: 0.25, eindTrek: 0, brief: 0.3,
      zegt: { start: ['Mijn vlieger heeft een hart!', 'Laat maar op!'], neer: ['Oei, hij valt!', 'Ach, in de stoppels!'], knap: ['Mijn vlieger! Weg!', 'Het touw is geknapt!'], brief: ['Een briefje naar boven!'], wint: ['Mijn vlieger stond het hoogst!', 'Gewonnen!'], verliest: ['Jouw vlieger is hoger!', 'Nog een keer?'] } },
    { id: 'teun', niveau: 2, beloning: 40, traag: 0.55, vooruit: 0.4, laag: 0.45, hoog: 0.66, slaap: 0.2, roekeloos: 0.14, eindTrek: 4.5, brief: 0.5,
      zegt: { start: ['Eerst de broodjes, dan vliegeren.', 'Kijk mijn krakeling eens vliegen!'], neer: ['Hè, hij duikt.', 'Daar ligt-ie.'], knap: ['Knap! Weg is hij.', 'Daar gaat mijn vlieger!'], brief: ['Een briefje, vers van de bakker!'], wint: ['Hoogst van allemaal!', 'Gewonnen!'], verliest: ['Petje af!', 'Jij kunt het beter.'] } },
    { id: 'trijntje', niveau: 3, beloning: 60, traag: 0.4, vooruit: 0.8, laag: 0.38, hoog: 0.6, slaap: 0.1, roekeloos: 0.07, eindTrek: 3.5, brief: 0.75,
      zegt: { start: ['Rustig vieren, dan klimt hij.', 'Klaar?'], neer: ['Hm, te weinig wind.', 'Ach.'], knap: ['Te hard getrokken...', 'Weg!'], brief: ['Een telegram!'], wint: ['Mijn ster staat het hoogst!', 'Zo gaat dat.'], verliest: ['Knap gedaan!', 'Jouw vlieger danst!'] } },
    { id: 'kees', niveau: 4, beloning: 90, traag: 0.25, vooruit: 1.25, laag: 0.3, hoog: 0.52, slaap: 0.03, roekeloos: 0.02, eindTrek: 2.2, brief: 1,
      zegt: { start: ['Een molenaar kent de wind.', 'Wind uit het westen, mooi zo.'], neer: ['Windstil. Dat ken ik.', 'Hm, de molen staat ook stil.'], knap: ['Te veel zeil bijgezet!', 'Daar gaat-ie!'], brief: ['Een briefje voor de wieken!'], wint: ['De wind en ik zijn oude vrienden.', 'Gemalen en gewonnen!'], verliest: ['Jij kent de wind ook!', 'Petje af, vliegeraar!'] } }
  ];
  TEGENSTANDERS.forEach((t) => { t.naam = window.Personen ? (Personen.namen[t.id] || t.id) : t.id; });
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  // een mens die goed oplet (om de tegenspelers af te stemmen)
  const MENS_MODEL = { traag: 0.35, vooruit: 1, laag: 0.38, hoog: 0.6, slaap: 0.05, roekeloos: 0.05, eindTrek: 3, brief: 0.8 };

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, doek, ctx, ui = {}, gebouwd = false, raf = 0, vorigeT = 0, rest = 0;
  let L = 640, sc = 1, dpr = 1, yH = 470, PM = 3, achter = null, wolkSprites = null;
  let tegen = TEGENSTANDERS[0];
  let spelers = [], fase = 'klaar', spelId = 0, W = null, bevroren = false, uitslag = null;
  let deeltjes = [], lesSoort = null, lesBewaard = null;
  let rnd = Math.random, windGeluid = null;
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const gewonnen = () => (window.Duiten ? Duiten.veld('vlieger-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  function zaad(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ============================================================
  // DE WIND: een gewone wind met golfjes, en om de paar tellen een vlaag of een luwte die van links over het veld trekt
  // ============================================================
  function maakWind(r) {
    const basis = 6.1 + r() * 0.9, f1 = r() * 6.28, f2 = r() * 6.28;
    const ev = [];
    let t = 4 + r() * 3, vorige = '';
    while (t < RONDE + 12) {
      const soort = vorige === 'luwte' ? (r() < 0.75 ? 'vlaag' : 'luwte') : vorige === 'vlaag' ? (r() < 0.65 ? 'luwte' : 'vlaag') : (r() < 0.5 ? 'vlaag' : 'luwte');
      const duur = soort === 'vlaag' ? 2.3 + r() * 1.6 : 3.3 + r() * 2.6;
      const sterkte = soort === 'vlaag' ? 3.4 + r() * 2.6 : -(4.2 + r() * 1.6);
      ev.push({ soort, t0: t, duur, sterkte });
      vorige = soort;
      t += duur + 3.4 + r() * 4.6;
    }
    return { basis, f1, f2, ev };
  }
  function wind(wd, t) {
    let w = wd.basis + 0.8 * Math.sin(t * 0.27 + wd.f1) + 0.45 * Math.sin(t * 0.83 + wd.f2);
    for (const e of wd.ev) {
      const u = (t - e.t0) / e.duur;
      if (u > 0 && u < 1) w += e.sterkte * Math.pow(Math.sin(Math.PI * u), 1.3);
    }
    return Math.max(0.5, w);
  }
  const windBij = (w, x, extra) => wind(w.wd, w.t + (extra || 0) - x / C_WIND);

  // ============================================================
  // DE VLIEGERS
  // ============================================================
  function maakVlieger(k, look, mens, t, x, y, schaal) {
    const st = Array.from({ length: 9 }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    return {
      k, look, mens, t, x, y, schaal, status: 'wacht', trek: false, L: L_START, th: 0.42, h: 0, d: 0, Wl: 6,
      span: 0, spanT: 0, neerT: 0, briefjes: [], over: BRIEFJES, bonus: 0, kwijt: null, wieg: Math.random() * 6,
      staart: st, staartKlaar: false, plan: { trek: false, tot: 0, volgendBrief: 6 + Math.random() * 6, eind: false },
      armFase: 0, neerKeer: 0, knapKeer: 0, aantalTrek: 0
    };
  }
  function maakWereld(r) { return { t: -1, wd: maakWind(r), vliegers: [], actief: false, cb: {}, r }; }

  function stapVlieger(w, v, dt) {
    v.Wl = windBij(w, v.x);
    v.wieg += dt * (1.6 + v.Wl * 0.25);
    if (v.status === 'kwijt') {
      // de vlieger zonder touw: hij schiet nog even omhoog en waait dan weg, tuimelend
      const k = v.kwijt;
      k.t += dt;
      k.vx += (v.Wl * 1.4 - k.vx) * dt * 0.8; k.vy += (k.t < 1.2 ? 6 : -4) * dt;
      k.hx += k.vx * dt; k.hy += k.vy * dt; k.rot += dt * (2 + k.t);
      // gauw de reservevlieger aan het touw geknoopt, en opnieuw oplaten
      if (k.t > KWIJT_T) { v.status = 'vliegt'; v.kwijt = null; v.L = L_START; v.th = 0.5; v.staartKlaar = false; if (w.cb.op) w.cb.op(v); }
      v.h = 0;
      return;
    }
    if (v.status === 'neer') {
      // de vlieger ligt in de stoppels: een stuk touw inhalen en opnieuw oplaten
      v.neerT -= dt;
      if (v.neerT <= 0) { v.status = 'vliegt'; v.L = Math.max(L_START, v.Lneer * 0.45); v.th = 0.5; v.staartKlaar = false; if (w.cb.op) w.cb.op(v); }
      v.h = 0;
      return;
    }
    if (v.status !== 'vliegt') { v.h = v.L * Math.sin(v.th); v.d = v.L * Math.cos(v.th); return; }
    const trek = v.trek && v.L > L_MIN + 0.3;
    if (trek && !v.wasTrek) v.aantalTrek++;
    v.wasTrek = trek;
    const We = v.Wl + (trek ? V_TREK : 0);
    // de hoek die de vlieger zoekt: steiler bij meer wind; bij te weinig wind valt hij (een negatieve hoek)
    const doel = Math.min(74, 8 + (We - 3) * 8) * GR;
    v.th += (doel - v.th) * Math.min(1, (doel > v.th ? 1.1 : doel < 0 ? 1.5 : 0.9) * dt);
    if (trek) v.L = Math.max(L_MIN, v.L - V_IN * dt);
    else if (v.th > 0.15) v.L = Math.min(L_MAX, v.L + klem((v.Wl - V_VIER0) * V_VIER, 0, 4.5) * dt);
    // de spanning op het touw: alleen als je trekt kan het knappen
    v.span = (We / W_BREUK) * (We / W_BREUK);
    if (trek && v.span > 1) { v.spanT += dt; if (v.spanT > BREUK_T) { knap(w, v); return; } }
    else v.spanT = Math.max(0, v.spanT - dt * 2);
    if (v.th <= 0.017) { neer(w, v); return; }
    v.h = v.L * Math.sin(v.th); v.d = v.L * Math.cos(v.th);
    // de briefjes langs het touw: met wind schuiven ze omhoog, valt het touw slap, dan glijden ze terug
    v.briefjes.forEach((b) => {
      const vb = v.th > 0.2 ? (v.Wl - 2.2) * 1.7 : -3;
      b.s += vb * dt;
      b.wap += dt * 9;
      if (b.s >= v.L - 0.5) { b.klaar = true; v.bonus += BONUS; if (w.cb.brief) w.cb.brief(v, b); }
      else if (b.s < 0) { b.weg = true; if (w.cb.briefWeg) w.cb.briefWeg(v, b); }
    });
    v.briefjes = v.briefjes.filter((b) => !b.klaar && !b.weg);
  }
  function neer(w, v) {
    v.status = 'neer'; v.neerT = 2; v.Lneer = v.L; v.th = 0; v.h = 0; v.neerKeer++; v.trek = false;
    v.briefjes.forEach((b) => { if (w.cb.briefWeg) w.cb.briefWeg(v, b); });
    v.briefjes = [];
    if (w.cb.neer) w.cb.neer(v);
  }
  function knap(w, v) {
    v.status = 'kwijt'; v.knapKeer++; v.trek = false;
    v.kwijt = { t: 0, hx: 0, hy: 0, vx: v.Wl * 0.8, vy: 3, rot: 0, L: v.L, th: v.th };
    v.briefjes = [];
    if (w.cb.knap) w.cb.knap(v);
  }
  function stuurBrief(w, v) {
    if (v.status !== 'vliegt' || v.over <= 0 || v.L < 18) return false;
    v.over--;
    v.briefjes.push({ s: 1, wap: 0, klaar: false, weg: false });
    if (w.cb.stuur) w.cb.stuur(v);
    return true;
  }

  // De tegenspeler: kijkt (met wat vertraging) naar de wind bij zich en verderop, haalt in als de vlieger te laag hangt,
  // laat los voor een vlaag (behalve als hij roekeloos is), trekt vlak voor de klok nog even, en stuurt briefjes.
  function aiStap(w, v, dt) {
    const a = v.t, p = v.plan;
    if (v.status !== 'vliegt') { v.trek = false; p.trek = false; return; }
    const tLeft = RONDE - w.t;
    const nuW = windBij(w, v.x, -a.traag), vooruitW = windBij(w, v.x, a.vooruit - a.traag);
    if (w.t >= p.tot) {
      p.tot = w.t + 0.08 + Math.random() * 0.06;
      const vlaag = Math.max(nuW, vooruitW) > 9.2, luwte = nuW < 3.6;
      // bij elke vlaag en elke luwte: let hij goed op, of niet? (wie niet oplet, houdt vast in een vlaag of
      // vergeet in te halen in een luwte)
      if (vlaag && !p.inVlaag) { p.inVlaag = true; p.dom = Math.random() < a.roekeloos; }
      else if (!vlaag && nuW < 8) p.inVlaag = false;
      if (luwte && !p.inLuwte) { p.inLuwte = true; p.slaapt = Math.random() < a.slaap; }
      else if (!luwte && nuW > 4.6) p.inLuwte = false;
      let trek = p.trek;
      if (vlaag) trek = p.dom;
      else if (p.inLuwte && p.slaapt) trek = false;
      else {
        if (v.th < a.laag || luwte) trek = true;
        else if (v.th > a.hoog) trek = false;
        if (v.L < 30 && v.th > 0.5) trek = false;
        // vlak voor de klok: nog even inhalen voor een steilere vlieger
        if (a.eindTrek && tLeft < a.eindTrek && tLeft > 0) trek = true;
      }
      p.trek = trek;
    }
    v.trek = p.trek;
    if (w.t > p.volgendBrief && v.over > 0) {
      p.volgendBrief = w.t + 4 + Math.random() * 5;
      if (Math.random() < a.brief && v.L > 45 && v.th > 0.5 && nuW > 4.8 && nuW < 8.6 && tLeft > 12) stuurBrief(w, v);
    }
  }

  function stapWereld(w, dt) {
    if (!w.actief) {
      // voor het begin wiegen de vliegers alleen in de wind; na de klok vliegen ze vanzelf verder (niemand trekt meer)
      if (w.klaar) { w.t += dt; w.vliegers.forEach((v) => { v.trek = false; stapVlieger(w, v, dt); }); }
      else w.vliegers.forEach((v) => { v.Wl = windBij(w, v.x); v.wieg += dt * (1.6 + v.Wl * 0.25); });
      return;
    }
    w.t += dt;
    w.vliegers.forEach((v) => { if (!v.mens) aiStap(w, v, dt); stapVlieger(w, v, dt); });
    if (w.t >= RONDE && !w.klaar) { w.klaar = true; w.actief = false; if (w.cb.klok) w.cb.klok(); }
  }
  const stand = (v) => (v.status === 'vliegt' ? v.h : 0) + v.bonus;

  // ============================================================
  // HET BEELD: hoogte naar beeld (0 tot 150 m loopt van de horizon tot bovenin)
  // ============================================================
  function schermVan(v) {
    // de vlieger staat boven het kind, en drijft met de wind wat naar rechts (de wind komt van links achter je)
    const h = Math.max(0, v.h), d = Math.max(0, v.d);
    const p = 1 / (1 + d / 120);
    const handY = v.y - 66 * v.schaal;
    return {
      x: v.x + 10 * v.schaal + d * 0.42 + Math.sin(v.wieg * 0.7) * 3 * p,
      y: Math.min(handY - 12, yH - h * PM) + Math.sin(v.wieg * 1.3) * 1.6 * p,
      s: klem(30 * p, 13, 30) * (dichtbij(v) ? 1 : 0.86) * klem(L / 520, 0.75, 1),
      hx: v.x + 10 * v.schaal, hy: handY
    };
  }

  // de achtergrond, één keer getekend: lucht, verte, kerk, molen (zonder wieken) en het stoppelveld
  function maakAchter() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    const k = sc * dpr;
    g.setTransform(k, 0, 0, k, 0, 0);
    // de lucht: blauw boven, warm en heiig bij de horizon
    const lucht = g.createLinearGradient(0, 0, 0, yH);
    lucht.addColorStop(0, '#6F9DCD'); lucht.addColorStop(0.45, '#9DBDDC'); lucht.addColorStop(0.82, '#E3DCCB'); lucht.addColorStop(1, '#F3E3C2');
    g.fillStyle = lucht; g.fillRect(0, 0, B, yH + 1);
    const zon = g.createRadialGradient(70, yH * 0.18, 4, 70, yH * 0.18, 220);
    zon.addColorStop(0, 'rgba(255,244,210,.75)'); zon.addColorStop(0.3, 'rgba(255,236,190,.25)'); zon.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = zon; g.fillRect(0, 0, B, yH);
    // ijle, hoge sluierwolkjes
    g.globalAlpha = 0.35;
    for (let i = 0; i < 7; i++) {
      const x = (i * 71 + 20) % B, y = 30 + (i * 37) % (yH * 0.4);
      g.fillStyle = '#FFFFFF';
      g.beginPath(); g.ellipse(x, y, 40 + (i % 3) * 14, 3 + (i % 2) * 2, -0.05, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    // de verte: een lage rij bomen, een boerderij met een hooiberg, en de dijk
    g.fillStyle = '#8FA0A6';
    g.beginPath(); g.moveTo(0, yH);
    for (let x = 0; x <= B; x += 6) g.lineTo(x, yH - 6 - 5 * Math.abs(Math.sin(x * 0.07)) - 3 * Math.abs(Math.sin(x * 0.23)));
    g.lineTo(B, yH); g.closePath(); g.fill();
    g.fillStyle = '#7A8C88';
    g.beginPath(); g.moveTo(120, yH);
    for (let x = 120; x <= 300; x += 5) g.lineTo(x, yH - 9 - 6 * Math.abs(Math.sin(x * 0.11)));
    g.lineTo(300, yH); g.closePath(); g.fill();
    // de boerderij met hooiberg
    g.fillStyle = '#8A6A55'; g.fillRect(232, yH - 15, 22, 12);
    g.fillStyle = '#6A4E3E'; g.beginPath(); g.moveTo(229, yH - 15); g.lineTo(243, yH - 25); g.lineTo(257, yH - 15); g.closePath(); g.fill();
    g.fillStyle = '#C9A55A'; g.beginPath(); g.moveTo(262, yH - 3); g.lineTo(262, yH - 13); g.quadraticCurveTo(269, yH - 20, 276, yH - 13); g.lineTo(276, yH - 3); g.closePath(); g.fill();
    g.strokeStyle = '#5A4A3A'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(261, yH - 3); g.lineTo(261, yH - 19); g.moveTo(277, yH - 3); g.lineTo(277, yH - 19); g.stroke();
    g.fillStyle = '#5A4A3A'; g.beginPath(); g.moveTo(259, yH - 19); g.lineTo(269, yH - 24); g.lineTo(279, yH - 19); g.closePath(); g.fill();
    // de kerk met de klok (de wijzer tekenen we elk beeldje)
    tekenKerk(g, 58, yH);
    // de molen (de wieken draaien, die tekenen we elk beeldje)
    tekenMolenRomp(g, 342, yH);
    // de dijk
    g.fillStyle = '#9FAE6E';
    g.beginPath(); g.moveTo(0, yH + 3); g.quadraticCurveTo(B / 2, yH - 3, B, yH + 2); g.lineTo(B, yH + 7); g.lineTo(0, yH + 7); g.closePath(); g.fill();
    // het stoppelveld: goudgeel, met de ploegvoren die naar de horizon lopen (echte perspectief: het verdwijnpunt
    // ligt op de horizon recht voor je)
    const veld = g.createLinearGradient(0, yH, 0, L);
    veld.addColorStop(0, '#CDB273'); veld.addColorStop(0.3, '#D8B967'); veld.addColorStop(1, '#C39A4A');
    g.fillStyle = veld; g.fillRect(0, yH + 5, B, L - yH);
    const K = 2.4 * (L - yH), vx = B / 2;
    const opVeld = (X, z) => [vx + K * X / (z * 1.5), yH + K / z];
    g.lineWidth = 0.6;
    for (let i = -24; i <= 24; i++) {
      const [x1, y1] = opVeld(i * 0.9, 80), [x2, y2] = opVeld(i * 0.9, 1.6);
      g.strokeStyle = i % 2 ? 'rgba(120,84,30,.13)' : 'rgba(250,232,180,.16)';
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    // stoppels: korte streepjes, kleiner naar achteren
    const r = zaad(77);
    for (let i = 0; i < 1100; i++) {
      const z = 1.6 + Math.pow(r(), 0.55) * 60, [x, y] = opVeld((r() - 0.5) * z * 1.6, z), h = Math.min(6, 9 / z);
      if (y < yH + 6 || x < -4 || x > B + 4) continue;
      g.strokeStyle = r() < 0.5 ? 'rgba(236,212,150,.75)' : 'rgba(140,100,40,.38)';
      g.lineWidth = Math.min(1, 0.3 + 1.2 / z);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.3) * h * 0.4, y - h); g.stroke();
    }
    // de schoven: rijen hokken (drie schoven tegen elkaar), van ver naar dichtbij, zodat de voorste over de achterste vallen
    const hokken = [];
    [-7.2, -4.2, -1.4, 2.6, 5.6, 8.6].forEach((X, rij) => {
      for (let z = 4.6 + (rij % 3) * 1.3; z < 70; z *= 1.3) hokken.push([X + (r() - 0.5) * 0.5, z * (0.95 + r() * 0.1)]);
    });
    hokken.sort((p1, p2) => p2[1] - p1[1]).forEach(([X, z]) => {
      const [x, y] = opVeld(X, z), s = K * 0.95 / (z * 1.5) / 20;
      if (x < -30 || x > B + 30 || y > L + 10 || s < 0.12) return;
      tekenSchoof(g, x, y, s, r);
    });
    // een vignet aan de randen
    const vig = g.createRadialGradient(B / 2, L * 0.45, L * 0.3, B / 2, L * 0.45, L * 0.9);
    vig.addColorStop(0, 'rgba(40,24,10,0)'); vig.addColorStop(1, 'rgba(40,24,10,.32)');
    g.fillStyle = vig; g.fillRect(0, 0, B, L);
    return c;
  }
  // een hok: drie schoven tegen elkaar, met een strobandje om het midden, de aren boven en de stoppels onder
  function tekenSchoof(g, x, y, s, r) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(80,50,20,.24)'; g.beginPath(); g.ellipse(6, 0.5, 12, 2.6, 0, 0, Math.PI * 2); g.fill();
    [[-3, 0.2, '#D2AC56'], [3, -0.2, '#C49D4A'], [0, 0, '#E0BF68']].forEach(([ox, scheef, kleur]) => {
      g.save(); g.translate(ox, 0); g.rotate(scheef + (r() - 0.5) * 0.1);
      g.fillStyle = kleur; g.strokeStyle = '#7A5418'; g.lineWidth = 0.55; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-3.6, 0); g.lineTo(-1.8, -8.6); g.lineTo(1.8, -8.6); g.lineTo(3.6, 0); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-1.8, -9); g.quadraticCurveTo(-4.8, -13, -3.2, -17); g.quadraticCurveTo(0, -21, 3.2, -17); g.quadraticCurveTo(4.8, -13, 1.8, -9); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(110,76,24,.45)'; g.lineWidth = 0.35;
      g.beginPath();
      for (let k = -2; k <= 2; k++) { g.moveTo(k * 0.6, -8.4); g.lineTo(k * 1.25, -0.4); g.moveTo(k * 0.5, -9.6); g.lineTo(k * 1.3, -17.6); }
      g.stroke();
      // licht van linksboven
      g.fillStyle = 'rgba(255,240,200,.28)'; g.beginPath(); g.moveTo(-1.8, -9.4); g.quadraticCurveTo(-4.4, -13, -3, -16.6); g.lineTo(-1.2, -15); g.closePath(); g.fill();
      g.strokeStyle = '#6A4A16'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-2.1, -8.8); g.lineTo(2.1, -8.8); g.stroke();
      g.restore();
    });
    g.restore();
  }
  function tekenKerk(g, x, y) {
    g.fillStyle = '#7E8A8C';
    g.fillRect(x - 26, y - 22, 26, 20);
    g.beginPath(); g.moveTo(x - 28, y - 22); g.lineTo(x - 13, y - 31); g.lineTo(x + 2, y - 22); g.closePath(); g.fill();
    g.fillStyle = '#727E80'; g.fillRect(x - 2, y - 58, 13, 56);
    g.beginPath(); g.moveTo(x - 3, y - 58); g.lineTo(x + 4.5, y - 86); g.lineTo(x + 12, y - 58); g.closePath(); g.fill();
    g.strokeStyle = '#727E80'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 4.5, y - 86); g.lineTo(x + 4.5, y - 92); g.stroke();
    g.fillStyle = '#F4EBD4'; g.beginPath(); g.arc(x + 4.5, y - 49, 4.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#5A6466'; g.lineWidth = 0.5; g.stroke();
    g.fillStyle = '#5E6A6C'; g.fillRect(x + 1.5, y - 40, 2, 4); g.fillRect(x + 5.5, y - 40, 2, 4);
  }
  const KLOK = { x: 62.5, y: -49 };
  function tekenMolenRomp(g, x, y) {
    g.fillStyle = '#7C7068';
    g.beginPath(); g.moveTo(x - 9, y - 1); g.lineTo(x - 6, y - 40); g.lineTo(x + 6, y - 40); g.lineTo(x + 9, y - 1); g.closePath(); g.fill();
    g.fillStyle = '#6A5E56'; g.beginPath(); g.moveTo(x - 7.5, y - 40); g.quadraticCurveTo(x, y - 50, x + 7.5, y - 40); g.closePath(); g.fill();
    g.fillStyle = '#5A4E46'; g.fillRect(x - 13, y - 22, 26, 2);
    g.fillStyle = '#4A3E36'; g.fillRect(x - 2, y - 9, 4, 8);
  }
  const MOLEN = { x: 342, y: -44 };
  function tekenWieken(g, hoek) {
    const cx = MOLEN.x, cy = yH + MOLEN.y;
    g.save(); g.translate(cx, cy); g.rotate(hoek);
    for (let i = 0; i < 4; i++) {
      g.rotate(Math.PI / 2);
      g.fillStyle = 'rgba(236,228,210,.92)'; g.strokeStyle = '#5A4E46'; g.lineWidth = 0.7;
      g.beginPath(); g.rect(1, -33, 6, 29); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -34); g.stroke();
      g.strokeStyle = 'rgba(90,78,70,.6)'; g.lineWidth = 0.4;
      for (let j = 0; j < 6; j++) { g.beginPath(); g.moveTo(1, -8 - j * 4.4); g.lineTo(7, -8 - j * 4.4); g.stroke(); }
    }
    g.fillStyle = '#3E342E'; g.beginPath(); g.arc(0, 0, 2.2, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  // wolken als losse plaatjes (één keer getekend), die met de wind meedrijven
  function maakWolken() {
    const lijst = [];
    const r = zaad(11);
    for (let n = 0; n < 4; n++) {
      const bw = 150 + n * 18, bh = 70 + (n % 2) * 16;
      const c = document.createElement('canvas');
      const k = sc * dpr;
      c.width = Math.ceil(bw * k); c.height = Math.ceil(bh * k);
      const g = c.getContext('2d');
      g.setTransform(k, 0, 0, k, 0, 0);
      const bollen = [];
      for (let i = 0; i < 11; i++) {
        const u = i / 10;
        const bx = 18 + u * (bw - 36) + (r() - 0.5) * 12, rr = 13 + Math.sin(u * Math.PI) * (16 + r() * 12);
        bollen.push([bx, bh - 14 - rr * 0.75 - Math.sin(u * Math.PI) * 10 * r(), rr]);
      }
      // de schaduwkant onder, het licht van linksboven
      bollen.forEach(([x, y, rr]) => { g.fillStyle = 'rgba(150,160,178,.55)'; g.beginPath(); g.arc(x + 3, y + 5, rr, 0, Math.PI * 2); g.fill(); });
      bollen.forEach(([x, y, rr]) => {
        const gr = g.createRadialGradient(x - rr * 0.35, y - rr * 0.45, rr * 0.1, x, y, rr);
        gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.7, '#F4F2EE'); gr.addColorStop(1, '#D8DCE4');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      });
      g.fillStyle = 'rgba(160,170,186,.5)';
      g.beginPath(); g.ellipse(bw / 2, bh - 13, bw * 0.42, 5, 0, 0, Math.PI * 2); g.fill();
      lijst.push({ c, bw, bh });
    }
    return lijst;
  }
  let wolken = [];
  function zetWolken() {
    wolken = [0, 1, 2, 3, 4, 5].map((i) => ({ sprite: i % 4, x: (i * 97) % (B + 160) - 80, y: 20 + ((i * 53) % Math.max(60, yH * 0.5)), s: 0.55 + (i % 3) * 0.22, snel: 0.6 + (i % 3) * 0.3 }));
  }

  // een kind van achteren gezien, met de klos in de handen voor zich (het touw gaat over de schouder omhoog)
  function tekenKind(g, v, t) {
    const U = UITERLIJK[v.look] || UITERLIJK.jij, s = v.schaal;
    g.save(); g.translate(v.x, v.y); g.scale(s, s);
    const trek = v.trek && v.status === 'vliegt' ? 1 : 0;
    const a = Math.sin(v.armFase) * 4 * trek;
    g.fillStyle = 'rgba(60,40,15,.28)'; g.beginPath(); g.ellipse(2, 1, 20, 4.5, 0, 0, Math.PI * 2); g.fill();
    // benen en klompen (van achteren zie je de hielen)
    g.fillStyle = '#EDE6D6'; g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 0.8;
    [-6, 6].forEach((dx) => { g.beginPath(); g.rect(dx - 3, -26, 6, 22); g.fill(); g.stroke(); });
    g.fillStyle = '#C9A26A'; g.strokeStyle = '#6A4A22';
    [-6, 6].forEach((dx) => { g.beginPath(); g.ellipse(dx, -3, 5, 4, 0, 0, Math.PI * 2); g.fill(); g.stroke(); });
    // broek of rok
    g.fillStyle = v.look === 'kees' ? '#8A7A64' : U.kleur2; g.strokeStyle = 'rgba(30,20,10,.55)'; g.lineWidth = 0.9;
    if (U.rok) { g.beginPath(); g.moveTo(-15, -22); g.lineTo(-11, -52); g.lineTo(11, -52); g.lineTo(15, -22); g.quadraticCurveTo(0, -19, -15, -22); g.closePath(); g.fill(); g.stroke(); }
    else { g.beginPath(); g.moveTo(-12, -24); g.lineTo(-10, -50); g.lineTo(10, -50); g.lineTo(12, -24); g.lineTo(2, -24); g.lineTo(0, -34); g.lineTo(-2, -24); g.closePath(); g.fill(); g.stroke(); }
    if (U.schort) { g.fillStyle = U.schort; g.beginPath(); g.moveTo(-9, -50); g.lineTo(-8, -40); g.lineTo(8, -40); g.lineTo(9, -50); g.closePath(); g.fill(); }
    // armen: naar voren omhoog, bij het inhalen om en om
    g.fillStyle = U.kleur; g.strokeStyle = 'rgba(30,20,10,.55)';
    g.beginPath(); g.moveTo(-12, -72); g.quadraticCurveTo(-21, -64 - a, -14, -55 - a); g.lineTo(-9, -58 - a); g.quadraticCurveTo(-13, -64, -7, -70); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(12, -72); g.quadraticCurveTo(21, -66 + a, 15, -58 + a); g.lineTo(10, -60 + a); g.quadraticCurveTo(13, -65, 7, -70); g.closePath(); g.fill(); g.stroke();
    // het lijf (een kiel of een jak)
    g.fillStyle = U.kleur;
    g.beginPath(); g.moveTo(-11, -48); g.quadraticCurveTo(-14, -66, -9, -76); g.lineTo(9, -76); g.quadraticCurveTo(14, -66, 11, -48); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -75); g.lineTo(0, -50); g.stroke();
    // kraagje en hoofd (achterkant: haar)
    g.fillStyle = '#F6F0E2'; g.beginPath(); g.ellipse(0, -77, 9, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = U.huid; g.beginPath(); g.rect(-3.5, -81, 7, 5); g.fill();
    g.fillStyle = U.haar; g.strokeStyle = 'rgba(30,20,10,.55)'; g.lineWidth = 0.9;
    const kijk = v.status === 'vliegt' ? -2 : 0;
    g.beginPath(); g.ellipse(0, -89 + kijk, 9.5, 10.5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    // oortjes
    g.fillStyle = U.huid; [-9.6, 9.6].forEach((dx) => { g.beginPath(); g.ellipse(dx, -88 + kijk, 1.8, 3, 0, 0, Math.PI * 2); g.fill(); });
    tekenHoed(g, U, kijk);
    g.restore();
  }
  function tekenHoed(g, U, kijk) {
    g.strokeStyle = 'rgba(30,20,10,.6)'; g.lineWidth = 0.9;
    const y = -94 + kijk;
    if (U.hoed === 'stro') {
      g.fillStyle = '#E2C579'; g.beginPath(); g.ellipse(0, y + 2, 17, 4.5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(0, y - 3, 9, 6, 0, Math.PI, 0); g.fill(); g.stroke();
      g.fillStyle = '#B6452C'; g.fillRect(-9, y - 1.5, 18, 2.2);
    } else if (U.hoed === 'muts') {
      g.fillStyle = U.muts || '#B3362A'; g.beginPath(); g.ellipse(0, y, 10.5, 8, 0, Math.PI, 0); g.lineTo(10.5, y + 2); g.lineTo(-10.5, y + 2); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.arc(0, y - 8, 2.4, 0, Math.PI * 2); g.fill();
    } else if (U.hoed === 'strik') {
      g.fillStyle = U.strik || '#C8382B';
      g.beginPath(); g.moveTo(0, y - 4); g.lineTo(-7, y - 9); g.lineTo(-7, y + 1); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0, y - 4); g.lineTo(7, y - 9); g.lineTo(7, y + 1); g.closePath(); g.fill();
      g.beginPath(); g.arc(0, y - 4, 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = U.haar; g.lineWidth = 3; g.beginPath(); g.moveTo(-3, y + 12); g.quadraticCurveTo(-4, y + 20, -1, y + 24); g.moveTo(3, y + 12); g.quadraticCurveTo(4, y + 20, 1, y + 24); g.stroke();
    } else if (U.hoed === 'hul') {
      g.fillStyle = '#F4EFE4'; g.beginPath(); g.ellipse(0, y + 3, 11, 11, 0, Math.PI, 0); g.lineTo(11, y + 8); g.lineTo(-11, y + 8); g.closePath(); g.fill(); g.stroke();
    } else if (U.hoed === 'bakker') {
      g.fillStyle = '#FBF8F0'; g.beginPath(); g.moveTo(-9, y + 2); g.lineTo(-11, y - 9); g.quadraticCurveTo(0, y - 16, 11, y - 9); g.lineTo(9, y + 2); g.closePath(); g.fill(); g.stroke();
    } else if (U.hoed === 'molenaar') {
      g.fillStyle = '#F1ECE2'; g.beginPath(); g.ellipse(0, y, 11, 8.5, 0, Math.PI, 0); g.lineTo(11, y + 2); g.lineTo(-11, y + 2); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-2, y - 8); g.quadraticCurveTo(6, y - 14, 10, y - 6); g.lineTo(8, y - 4); g.closePath(); g.fill(); g.stroke();
    }
  }

  // de vlieger: een kruisvlieger (twee latjes, papier eroverheen) met een eigen tekening en een staart met strikjes
  const PAPIER = { zon: ['#F2D27A', '#C8553A'], maan: ['#2E4C7E', '#F3E3A4'], hart: ['#F7EFE2', '#C8382B'], krakeling: ['#F1E3C0', '#A0703F'], ster: ['#3F6EA6', '#FFF6DA'], prins: ['#F7EFE2', '#E07A1E'] };
  function tekenVlieger(g, v, x, y, s, rot) {
    const [kleur, teken] = PAPIER[(UITERLIJK[v.look] || UITERLIJK.jij).vlieger] || PAPIER.zon;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s / 20, s / 20);
    // de vorm: een ruit, boven breder dan onder
    g.fillStyle = 'rgba(40,30,20,.18)'; g.beginPath(); g.moveTo(1.5, -18); g.lineTo(14.5, -2); g.lineTo(1.5, 24); g.lineTo(-11.5, -2); g.closePath(); g.fill();
    g.fillStyle = kleur; g.strokeStyle = '#3A2A1A'; g.lineWidth = 1.3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, -20); g.lineTo(13, -4); g.lineTo(0, 22); g.lineTo(-13, -4); g.closePath(); g.fill(); g.stroke();
    // de tekening op het papier
    const soort = (UITERLIJK[v.look] || UITERLIJK.jij).vlieger;
    g.fillStyle = teken; g.strokeStyle = teken;
    if (soort === 'zon') {
      g.beginPath(); g.arc(0, -2, 5.5, 0, Math.PI * 2); g.fill();
      g.lineWidth = 1.1; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; g.beginPath(); g.moveTo(Math.cos(a) * 7, -2 + Math.sin(a) * 7); g.lineTo(Math.cos(a) * 9.5, -2 + Math.sin(a) * 9.5); g.stroke(); }
      g.fillStyle = '#3A2A1A'; g.beginPath(); g.arc(-2, -3.5, 0.8, 0, 7); g.arc(2, -3.5, 0.8, 0, 7); g.fill();
      g.strokeStyle = '#3A2A1A'; g.lineWidth = 0.7; g.beginPath(); g.arc(0, -1.5, 2.6, 0.3, Math.PI - 0.3); g.stroke();
    } else if (soort === 'maan') {
      g.beginPath(); g.arc(0, -2, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = PAPIER.maan[0]; g.beginPath(); g.arc(3, -4, 6.4, 0, Math.PI * 2); g.fill();
    } else if (soort === 'hart') {
      g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-11, -2, -6, -11, 0, -5); g.bezierCurveTo(6, -11, 11, -2, 0, 6); g.fill();
    } else if (soort === 'krakeling') {
      g.lineWidth = 2.2; g.beginPath(); g.moveTo(-6, 4); g.bezierCurveTo(-10, -6, -2, -9, 0, -2); g.bezierCurveTo(2, -9, 10, -6, 6, 4); g.moveTo(-6, 4); g.lineTo(5, -3); g.moveTo(6, 4); g.lineTo(-5, -3); g.stroke();
    } else if (soort === 'ster') {
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3 : 7.5; g.lineTo(Math.cos(a) * r, -2 + Math.sin(a) * r); }
      g.closePath(); g.fill();
    } else if (soort === 'prins') {
      // de prinsenvlag: oranje, wit en blauw
      g.save(); g.beginPath(); g.moveTo(0, -20); g.lineTo(13, -4); g.lineTo(0, 22); g.lineTo(-13, -4); g.closePath(); g.clip();
      g.fillStyle = '#E07A1E'; g.fillRect(-14, -21, 28, 13);
      g.fillStyle = '#2F5596'; g.fillRect(-14, 6, 28, 17);
      g.restore();
    }
    // de latjes
    g.strokeStyle = '#6A4A22'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, -19); g.lineTo(0, 21); g.moveTo(-12, -4); g.lineTo(12, -4); g.stroke();
    g.restore();
  }
  // de staart: een touwtje met papieren strikjes dat achter de vlieger aan wappert (eenvoudige touwnatuurkunde)
  function stapStaart(v, x, y, s, dt, wind) {
    const st = v.staart, seg = s * 0.36;
    if (!v.staartKlaar) { st.forEach((p, i) => { p.x = p.px = x; p.y = p.py = y + i * seg; }); v.staartKlaar = true; }
    st[0].x = x; st[0].y = y; st[0].px = x; st[0].py = y;
    const fx = (wind * 9 + Math.sin(v.wieg * 3) * 14) * dt * dt, fy = 120 * dt * dt;
    for (let i = 1; i < st.length; i++) {
      const p = st[i];
      let vx = (p.x - p.px) * 0.96, vy = (p.y - p.py) * 0.96;
      // niet te hard zwiepen (als de vlieger ineens verspringt)
      const vv = Math.hypot(vx, vy), max = seg * 0.6;
      if (vv > max) { vx *= max / vv; vy *= max / vv; }
      p.px = p.x; p.py = p.y;
      p.x += vx + fx * (0.6 + i * 0.08); p.y += vy + fy;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < st.length; i++) {
        const a = st[i - 1], b = st[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - seg) / d;
        b.x -= dx * f; b.y -= dy * f;
      }
    }
  }
  function tekenStaart(g, v, s) {
    const st = v.staart, [, strik] = PAPIER[(UITERLIJK[v.look] || UITERLIJK.jij).vlieger] || PAPIER.zon;
    g.strokeStyle = 'rgba(60,40,20,.75)'; g.lineWidth = Math.max(0.5, s * 0.035);
    g.beginPath(); g.moveTo(st[0].x, st[0].y);
    for (let i = 1; i < st.length; i++) g.lineTo(st[i].x, st[i].y);
    g.stroke();
    const b = s * 0.16;
    for (let i = 2; i < st.length; i += 1) {
      const p = st[i];
      g.fillStyle = i % 2 ? strik : '#F7EFE2';
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - b, p.y - b * 0.6); g.lineTo(p.x - b, p.y + b * 0.6); g.closePath();
      g.moveTo(p.x, p.y); g.lineTo(p.x + b, p.y - b * 0.6); g.lineTo(p.x + b, p.y + b * 0.6); g.closePath(); g.fill();
    }
  }
  // het touw van de handen naar de vlieger: strak bij spanning, met een bocht als het slap hangt; trillend vlak voor het knappen
  function tekenTouw(g, hx, hy, kx, ky, v, t) {
    const strak = klem(v.span, 0, 1.2), len = Math.hypot(kx - hx, ky - hy);
    const zak = (1 - Math.min(1, strak * 1.15)) * len * 0.14 + 2;
    const tril = v.trek && v.span > 0.82 ? Math.sin(t * 60) * (v.span - 0.8) * 10 : 0;
    const mx = (hx + kx) / 2 + 6 + tril, my = (hy + ky) / 2 + zak;
    g.strokeStyle = v.trek && v.span > 0.9 ? 'rgba(150,50,30,.85)' : 'rgba(58,42,30,.78)';
    g.lineWidth = dichtbij(v) ? 0.9 : 0.6;
    g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(mx, my, kx, ky); g.stroke();
    return [mx, my];
  }
  // het kind vooraan (jij, of met z'n tweeën allebei); de tegenspeler staat verderop
  const dichtbij = (v) => v.k === 0 || !tegen;
  const opBocht = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;

  function teken() {
    if (!ctx || !doek) return;
    const k = sc * dpr;
    if (!achter) { achter = maakAchter(); wolkSprites = maakWolken(); if (!wolken.length) zetWolken(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(achter, 0, 0);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const t = W ? W.t : 0, nu2 = performance.now() / 1000;
    // de wolken
    wolken.forEach((wk) => {
      const sp = wolkSprites[wk.sprite];
      ctx.globalAlpha = 0.95;
      ctx.drawImage(sp.c, wk.x, wk.y, sp.bw * wk.s, sp.bh * wk.s);
    });
    ctx.globalAlpha = 1;
    // de molen draait met de wind; de kerkklok loopt mee met de wedstrijd
    tekenWieken(ctx, molenHoek);
    const deel = W ? klem(W.t / RONDE, 0, 1) : 0;
    ctx.save(); ctx.translate(KLOK.x, yH + KLOK.y); ctx.rotate(-Math.PI / 2 + deel * Math.PI * 2);
    ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3.4, 0); ctx.stroke(); ctx.restore();
    // vlagen en luwtes die over het veld trekken
    if (W) tekenVlagen(ctx, t);
    // verre vliegers van andere kinderen (versiering)
    [[36, 0.62, '#C8553A'], [300, 0.5, '#3F6EA6'], [372, 0.68, '#E6B53F']].forEach(([x, f, kl], i) => {
      const yy = yH - 40 - yH * 0.25 * f + Math.sin(nu2 * 0.8 + i) * 3, xx = x + Math.sin(nu2 * 0.5 + i * 2) * 4;
      ctx.strokeStyle = 'rgba(80,70,60,.3)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(xx - 6, yH + 2); ctx.lineTo(xx, yy); ctx.stroke();
      ctx.fillStyle = kl; ctx.beginPath(); ctx.moveTo(xx, yy - 4); ctx.lineTo(xx + 3, yy); ctx.lineTo(xx, yy + 5); ctx.lineTo(xx - 3, yy); ctx.closePath(); ctx.fill();
    });
    // de hoogtemeter links
    tekenMeter(ctx);
    if (W) {
      // achter naar voren: eerst wie verderop staat
      const volg = W.vliegers.slice().sort((a, b) => a.y - b.y);
      volg.forEach((v) => tekenSpeler(ctx, v, t));
    }
    tekenDeeltjes(ctx);
    // de klok bovenin: hoeveel tijd er nog is
    if (W && fase !== 'klaar') tekenTijd(ctx, deel);
  }
  function tekenSpeler(g, v, t) {
    const sp = schermVan(v);
    if (v.status === 'kwijt' && v.kwijt) {
      // de losse vlieger waait weg, het touw valt naar beneden
      const k = v.kwijt;
      const kx = sp.x + k.hx * PM * 0.6, ky = (yH - k.L * Math.sin(k.th) * PM) - k.hy * PM * 0.6;
      if (k.t < 2.2) {
        g.strokeStyle = `rgba(58,42,30,${(0.7 * (1 - k.t / 2.2)).toFixed(2)})`; g.lineWidth = 0.7;
        g.beginPath(); g.moveTo(sp.hx, sp.hy); g.quadraticCurveTo(sp.hx + 30, sp.hy - 20 + k.t * 40, sp.hx + 60, sp.hy + k.t * 30); g.stroke();
      }
      if (ky > -60 && kx < B + 60) { stapStaart(v, kx, ky + sp.s * 0.9, sp.s, DT, v.Wl); tekenStaart(g, v, sp.s); tekenVlieger(g, v, kx, ky, sp.s, k.rot); }
      tekenKind(g, v, t);
      return;
    }
    if (v.status === 'neer') {
      // de vlieger ligt in de stoppels voor het kind
      tekenKind(g, v, t);
      const lx = v.x + 38 * v.schaal, ly = v.y - (dichtbij(v) ? 34 : 6) * v.schaal;
      tekenVlieger(g, v, lx, ly, sp.s * (dichtbij(v) ? 0.8 : 0.6), 1.35);
      return;
    }
    const rot = (v.status === 'vliegt' ? Math.sin(v.wieg) * 0.12 + (v.Wl - 6) * 0.015 + (v.trek && v.span > 0.85 ? Math.sin(t * 40) * 0.15 : 0) : 0);
    const [mx, my] = tekenTouw(g, sp.hx, sp.hy, sp.x, sp.y + sp.s * 0.15, v, t);
    // de briefjes op het touw
    v.briefjes.forEach((b) => {
      const u = klem(b.s / Math.max(1, v.L), 0, 1);
      const bx = opBocht(sp.hx, mx, sp.x, u), by = opBocht(sp.hy, my, sp.y + sp.s * 0.15, u);
      g.save(); g.translate(bx, by); g.rotate(Math.sin(b.wap) * 0.5);
      const bs = dichtbij(v) ? 8 : 5.5;
      g.fillStyle = 'rgba(255,250,225,.35)'; g.beginPath(); g.arc(0, -bs * 0.35, bs * 0.95, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFDF4'; g.strokeStyle = 'rgba(90,70,40,.85)'; g.lineWidth = 0.6;
      g.beginPath(); g.rect(-bs / 2, -bs * 0.7, bs, bs * 0.7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-bs / 2, -bs * 0.7); g.lineTo(0, -bs * 0.28); g.lineTo(bs / 2, -bs * 0.7); g.stroke();
      g.fillStyle = '#B8432C'; g.beginPath(); g.arc(0, -bs * 0.3, bs * 0.13, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    stapStaart(v, sp.x, sp.y + sp.s * 0.95, sp.s, DT, v.Wl);
    tekenStaart(g, v, sp.s);
    tekenVlieger(g, v, sp.x, sp.y, sp.s, rot);
    tekenKind(g, v, t);
  }
  // een vlaag is een donkere strook met windkrullen (zoals op de oude prenten), een luwte een bleke, stille strook met
  // pluisjes die blijven hangen; ze trekken van links naar rechts over het veld
  function tekenVlagen(g, t) {
    W.wd.ev.forEach((e, n) => {
      const x1 = (t - e.t0) * C_WIND, x0 = x1 - e.duur * C_WIND;
      if (x0 > B + 40 || x1 < -40) return;
      const vlaag = e.soort === 'vlaag', sterk = Math.min(1, Math.abs(e.sterkte) / 5);
      const kleur = vlaag ? '70,45,12' : '255,250,232', a = (vlaag ? 0.3 : 0.36) * (0.65 + 0.35 * sterk);
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, `rgba(${kleur},0)`); gr.addColorStop(0.3, `rgba(${kleur},${a.toFixed(3)})`);
      gr.addColorStop(0.78, `rgba(${kleur},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${kleur},0)`);
      const xa = Math.max(0, x0), xb = Math.min(B, x1);
      g.fillStyle = gr; g.fillRect(xa, yH + 5, xb - xa, L - yH);
      const breed = Math.max(1, x1 - x0);
      if (vlaag) {
        // windkrullen in het veld en laag in de lucht, sneller dan de vlaag zelf
        g.strokeStyle = 'rgba(255,248,226,.7)'; g.lineCap = 'round';
        for (let i = 0; i < 16; i++) {
          const u = ((i * 0.618 + t * 0.9 + n * 0.3) % 1), x = x0 + u * breed;
          const lucht = i % 3 === 0, y = lucht ? yH - 18 - ((i * 37) % 90) : yH + 10 + ((i * 53) % Math.max(12, L - yH - 24));
          if (x < 2 || x > B - 2) continue;
          const k = lucht ? 0.8 : 0.6 + (y - yH) / (L - yH);
          const f = Math.sin(u * Math.PI);
          g.globalAlpha = f;
          g.lineWidth = 0.9 * k;
          g.beginPath(); g.moveTo(x - 14 * k, y); g.quadraticCurveTo(x - 6 * k, y - 3.5 * k, x + 2 * k, y);
          g.quadraticCurveTo(x + 8 * k, y + 3 * k, x + 12 * k, y - 1.5 * k);
          g.arc(x + 12 * k, y - 4 * k, 2.5 * k, Math.PI / 2, -Math.PI * 0.9, true); g.stroke();
        }
        g.globalAlpha = 1; g.lineCap = 'butt';
      } else {
        // pluisjes die stil in de lucht hangen
        g.fillStyle = 'rgba(255,252,240,.85)';
        for (let i = 0; i < 9; i++) {
          const u = (i * 0.37 + 0.13) % 1, x = x0 + u * breed + Math.sin(t * 0.8 + i) * 3;
          const y = yH - 10 + ((i * 41) % Math.max(20, L - yH)) + Math.sin(t * 0.6 + i * 2) * 2;
          if (x < 2 || x > B - 2) continue;
          g.globalAlpha = Math.sin(u * Math.PI);
          g.beginPath(); g.arc(x, y, 1.3, 0, Math.PI * 2); g.fill();
          g.strokeStyle = 'rgba(255,252,240,.6)'; g.lineWidth = 0.4;
          g.beginPath(); for (let k = 0; k < 6; k++) { const h = k * Math.PI / 3; g.moveTo(x, y); g.lineTo(x + Math.cos(h) * 3, y + Math.sin(h) * 3); } g.stroke();
        }
        g.globalAlpha = 1;
      }
    });
  }
  function tekenMeter(g) {
    g.save();
    g.font = '9px "IM Fell English", Georgia, serif'; g.textAlign = 'left';
    for (let m = 25; m <= 150; m += 25) {
      const y = yH - m * PM;
      if (y < 8) continue;
      g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(0, y); g.lineTo(m % 50 ? 5 : 9, y); g.stroke();
      if (m % 50 === 0) { g.fillStyle = 'rgba(40,30,20,.55)'; g.fillText(String(m), 30, y + 3); }
    }
    if (W) {
      // per vlieger een klein ruitje in zijn eigen kleur (jouw ruitje met een gouden rand)
      W.vliegers.slice().reverse().forEach((v) => {
        const h = v.status === 'vliegt' ? v.h : 0, y = Math.max(8, yH - h * PM);
        const [kleur] = PAPIER[(UITERLIJK[v.look] || UITERLIJK.jij).vlieger] || PAPIER.zon, x = v.k === 0 ? 12 : 22;
        g.fillStyle = kleur; g.strokeStyle = v.k === 0 && v.mens ? '#8A5A10' : 'rgba(40,30,20,.75)'; g.lineWidth = v.k === 0 && v.mens ? 1.4 : 0.9;
        g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 4.6, y - 1.2); g.lineTo(x, y + 6.5); g.lineTo(x - 4.6, y - 1.2); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(80,50,20,.5)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y - 5.5); g.lineTo(x, y + 6); g.moveTo(x - 4.2, y - 1.2); g.lineTo(x + 4.2, y - 1.2); g.stroke();
      });
    }
    g.restore();
  }
  function tekenTijd(g, deel) {
    const x = B - 22, y = 22, r = 13;
    g.save();
    g.fillStyle = 'rgba(244,233,207,.92)'; g.strokeStyle = 'rgba(60,40,20,.7)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = deel > 0.86 ? 'rgba(200,70,40,.75)' : 'rgba(201,151,63,.7)';
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, r - 2.5, -Math.PI / 2 + deel * Math.PI * 2, Math.PI * 1.5); g.closePath(); g.fill();
    g.strokeStyle = '#2A2420'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(-Math.PI / 2 + deel * Math.PI * 2) * (r - 3), y + Math.sin(-Math.PI / 2 + deel * Math.PI * 2) * (r - 3)); g.stroke();
    g.restore();
  }

  // deeltjes: vonkjes bij een briefje dat aankomt, stof bij een val, stukjes touw bij het knappen
  function strooi(x, y, n, soort) {
    for (let i = 0; i < n; i++) deeltjes.push({ x, y, vx: (Math.random() - 0.5) * (soort === 'vonk' ? 60 : 40), vy: -Math.random() * (soort === 'vonk' ? 50 : 30), t: 0, max: 0.8 + Math.random() * 0.6, soort });
  }
  function stapDeeltjes(dt) {
    deeltjes.forEach((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.soort === 'stof' ? 20 : 40) * dt; });
    deeltjes = deeltjes.filter((p) => p.t < p.max);
  }
  function tekenDeeltjes(g) {
    deeltjes.forEach((p) => {
      const a = 1 - p.t / p.max;
      if (p.soort === 'vonk') { g.fillStyle = `rgba(255,236,160,${a.toFixed(2)})`; g.beginPath(); g.arc(p.x, p.y, 1.8 * a + 0.6, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = `rgba(150,120,70,${(a * 0.5).toFixed(2)})`; g.beginPath(); g.arc(p.x, p.y, 3 + p.t * 6, 0, Math.PI * 2); g.fill(); }
    });
  }

  // ============================================================
  // OPBOUW
  // ============================================================
  const BRIEF_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7 H20.5 V17.5 H3.5 Z" fill="#FFFDF4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3.5 7 L12 13 L20.5 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  function bouw() {
    podium = document.getElementById('vl-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="vl-stand"><b class="vl-hoogte">0</b><small>m</small></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop vl-brief vl-brief2" type="button" aria-label="Speler 2: stuur een briefje langs het touw omhoog" title="Briefje omhoog" hidden>${BRIEF_SVG}<i class="vl-brief-tal">3</i></button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeler" title="Kies je tegenspeler" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="vl-veldvak">
      <canvas class="vl-doek" role="application" tabindex="0" aria-label="Vliegeren. Houd je vinger op het veld om het touw in te halen, laat los om te vieren. Met het toetsenbord: houd de spatiebalk (of A) ingedrukt; B stuurt een briefje. Met z'n tweeën houdt speler 2 de L ingedrukt en stuurt met N een briefje."></canvas>
      <div class="hp-tel vl-tel" aria-hidden="true"></div>
      <div class="sj-pops vl-pops" aria-hidden="true"></div>
      <div class="sj-kaart vl-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="vl-stand"><b class="vl-hoogte">0</b><small>m</small></span>
        <span class="mo-ballon" hidden></span>
      </div>
      <button class="mo-knop vl-brief" type="button" aria-label="Stuur een briefje langs het touw omhoog" title="Briefje omhoog">${BRIEF_SVG}<i class="vl-brief-tal">3</i></button>
      <button class="gb-beker vl-klos" type="button" aria-label="Houd vast om het touw in te halen" title="Inhalen">
        <svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,.35)"/>
          <rect x="11" y="18" width="42" height="28" rx="3" fill="#C99B5A" stroke="#4A2C12" stroke-width="2"/>
          <path d="M14 22 H50 M14 26 H50 M14 30 H50 M14 34 H50 M14 38 H50 M14 42 H50" stroke="#EFE3C4" stroke-width="2.2"/>
          <path d="M14 22 H50 M14 30 H50 M14 38 H50" stroke="#B89A6A" stroke-width=".8"/>
          <rect x="6" y="12" width="8" height="40" rx="2.5" fill="#7A4A22" stroke="#3A2210" stroke-width="2"/>
          <rect x="50" y="12" width="8" height="40" rx="2.5" fill="#7A4A22" stroke="#3A2210" stroke-width="2"/>
          <path class="vl-klos-touw" d="M50 24 Q60 10 58 2" fill="none" stroke="#EFE3C4" stroke-width="1.6"/></svg>
        <span class="gb-beker-tekst">Haal in</span>
      </button>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeler" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met wie vlieger je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
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
      midden, vak: midden.querySelector('.vl-veldvak'), pops: midden.querySelector('.vl-pops'), uitslag: midden.querySelector('.vl-kaart'),
      tel: midden.querySelector('.vl-tel'), meer: boven.querySelector('.mo-meer'), menu, lijst: menu.querySelector('.mo-tegenstanders'), meld: meldEl,
      brief: onder.querySelector('.vl-brief'), brief2: boven.querySelector('.vl-brief2'), klos: onder.querySelector('.vl-klos')
    };
    doek = midden.querySelector('.vl-doek');
    ctx = doek.getContext('2d');
    // vasthouden = inhalen; loslaten = vieren. Met z'n tweeën: ieder op zijn eigen helft
    const vingers = new Map(), toets = [false, false];
    const wie = (e) => {
      if (tegen) return 0;
      const r = doek.getBoundingClientRect();
      return e.clientX < r.left + r.width / 2 ? 0 : 1;
    };
    const werkTrekBij = () => {
      if (!W) return;
      const vast = [false, false];
      vingers.forEach((k) => { vast[k] = true; });
      if (klosVast || toets[0]) vast[0] = true;
      if (toets[1] && !tegen) vast[1] = true;
      W.vliegers.forEach((v, k) => { if (v.mens) v.trek = vast[k] && fase === 'spel'; });
    };
    doek.addEventListener('pointerdown', (e) => { e.preventDefault(); doek.focus({ preventScroll: true }); vingers.set(e.pointerId, wie(e)); werkTrekBij(); begin(); });
    const los = (e) => { vingers.delete(e.pointerId); werkTrekBij(); };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => doek.addEventListener(n, los));
    doek.addEventListener('contextmenu', (e) => e.preventDefault());
    let klosVast = false;
    ui.klos.addEventListener('pointerdown', (e) => { e.preventDefault(); klosVast = true; ui.klos.classList.add('schudt'); werkTrekBij(); begin(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => ui.klos.addEventListener(n, () => { klosVast = false; ui.klos.classList.remove('schudt'); werkTrekBij(); }));
    ui.klos.addEventListener('contextmenu', (e) => e.preventDefault());
    ui.brief.addEventListener('click', () => briefje(0));
    ui.brief2.addEventListener('click', () => briefje(1));
    const welkeToets = (e) => (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A' ? 0 : e.key === 'l' || e.key === 'L' ? 1 : -1);
    document.addEventListener('keydown', (e) => {
      if (location.hash !== '#vliegeren' || lesOpen()) return;
      if (ui.menu && !ui.menu.hidden) { if (e.key === 'Escape') sluitMenu(true); return; }
      const k = welkeToets(e);
      if (k >= 0) { e.preventDefault(); if (!toets[k]) { toets[k] = true; werkTrekBij(); begin(); } }
      else if (e.key === 'b' || e.key === 'B') briefje(0);
      else if ((e.key === 'n' || e.key === 'N') && !tegen) briefje(1);
    });
    document.addEventListener('keyup', (e) => { const k = welkeToets(e); if (k >= 0 && toets[k]) { toets[k] = false; werkTrekBij(); } });
    ui.werkTrekBij = werkTrekBij;
    ui.kaart[1].addEventListener('click', openMenu);
    ui.meer.addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('vliegeren'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', () => sluitMenu(true));
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(true); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(false); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(ui.midden);
    window.addEventListener('resize', () => pasMaatAan());
    const les = document.getElementById('les');
    if (les && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (location.hash === '#vliegeren' && les.hidden) { lesDemo(null); hervat(); } }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
    }
    gebouwd = true;
  }
  const lesOpen = () => { const l = document.getElementById('les'); return !!(l && !l.hidden); };
  // de eerste aanraking start ook het geluid van de wind
  function begin() { if (Geluid.aan && !windGeluid && Geluid.wind && fase === 'spel') windGeluid = Geluid.wind(); }

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
    const nieuweL = Math.round(B * klem(hoog / Math.max(1, breed - 8), 0.62, 2.1));
    const s = Math.max(0.4, Math.min((breed - 8) / B, hoog / nieuweL, 3.2));
    const nieuweDpr = Math.min(2.5, window.devicePixelRatio || 1);
    if (nieuweL === L && Math.abs(s - sc) < 0.001 && nieuweDpr === dpr && achter) return;
    L = nieuweL; sc = s; dpr = nieuweDpr;
    // de horizon laag in beeld, zodat er veel lucht is; in een laag, breed beeld iets lager
    yH = Math.round(L * (L / B > 1.2 ? 0.74 : 0.79));
    PM = (yH - 24) / 150;
    podium.style.setProperty('--vl-b', Math.round(B * sc) + 'px');
    podium.style.setProperty('--vl-h', Math.round(L * sc) + 'px');
    doek.width = Math.round(B * sc * dpr); doek.height = Math.round(L * sc * dpr);
    achter = null; wolken = [];
    plaatsKinderen();
    teken();
  }
  // waar de kinderen staan: jij vooraan in het midden, de tegenspeler verderop links (met z'n tweeën allebei vooraan)
  // (in perspectief: wie verderop staat, is kleiner en staat hoger, naar de horizon toe)
  function plaatsKinderen() {
    if (!W) return;
    const voor = klem((L - yH) / 136, 0.62, 1.2), r = 0.42;
    W.vliegers.forEach((v) => {
      if (tegen) {
        if (v.k === 0) { v.x = B * 0.56; v.y = L + 4; v.schaal = voor; }
        else { v.x = B * 0.26; v.y = yH + r * (L + 4 - yH); v.schaal = voor * r; }
      } else {
        v.x = v.k === 0 ? B * 0.3 : B * 0.72; v.y = L + 4; v.schaal = voor * 0.92;
      }
    });
  }

  // ============================================================
  // DE LUS
  // ============================================================
  let molenHoek = 0;
  function lus(t) {
    raf = requestAnimationFrame(lus);
    const dt = vorigeT ? Math.min(0.05, (t - vorigeT) / 1000) : 0;
    vorigeT = t;
    if (W && !bevroren) {
      rest += dt;
      let n = 0;
      while (rest >= DT && n < 6) { stapWereld(W, DT); W.vliegers.forEach((v) => { if (v.trek) v.armFase += DT * 9; }); rest -= DT; n++; }
      // de klos ratelt als je inhaalt
      W.vliegers.forEach((v) => {
        if (!v.mens || !v.trek || v.status !== 'vliegt' || fase !== 'spel' || v.L <= L_MIN + 0.3) { v.klik = 0; return; }
        v.klik = (v.klik || 0) + dt;
        if (v.klik > 0.15) { v.klik = 0; if (Geluid.klos) Geluid.klos(); }
      });
    }
    const wNu = W ? windBij(W, 330) : 6;
    molenHoek += dt * wNu * 0.32;
    wolken.forEach((wk) => { wk.x += dt * wk.snel * (W ? windBij(W, wk.x) : 6) * 0.9; if (wk.x > B + 40) wk.x = -wolkSprites[wk.sprite].bw * wk.s - 20; });
    stapDeeltjes(dt);
    werkGeluidBij();
    if (W) werkStandBij();
    teken();
  }
  function werkGeluidBij() {
    if (!windGeluid) return;
    if (!W || bevroren || fase !== 'spel') { windGeluid.stop(); windGeluid = null; return; }
    const v = W.vliegers[0];
    windGeluid.zet(windBij(W, v.x), v.trek && v.status === 'vliegt' ? v.span : 0);
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  function nieuwePartij() {
    spelId++;
    if (tegen) spelers = [{ naam: 'Jij', mens: true, look: 'jij' }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, look: tegen.id }];
    else spelers = [{ naam: 'Speler 1', mens: true, look: 'jij' }, { naam: 'Speler 2', mens: true, look: 'twee' }];
    uitslag = null;
    if (ui.uitslag) ui.uitslag.hidden = true;
    W = maakWereld(zaad(Math.floor(rnd() * 1e9)));
    W.cb = LIVE;
    W.vliegers = [0, 1].map((k) => maakVlieger(k, spelers[k].look, spelers[k].mens, spelers[k].t, 0, 0, 1));
    plaatsKinderen();
    // de vliegers gaan alvast een stukje de lucht in
    W.vliegers.forEach((v) => { v.status = 'vliegt'; v.L = 22; v.th = 0.62; v.h = v.L * Math.sin(v.th); v.d = v.L * Math.cos(v.th); });
    deeltjes = []; bevroren = false; herstart = null;
    if (windGeluid) { windGeluid.stop(); windGeluid = null; }
    werkKaartenBij();
    if (tegen) setTimeout(() => zeg(1, 'start'), 500);
    meld(tegen ? `Nieuwe wedstrijd tegen ${tegen.naam}. Wie het hoogst staat als de klok slaat, wint.` : 'Nieuwe wedstrijd met z\'n tweeën.');
    aftellen(false);
  }
  const LIVE = {
    neer(v) {
      const sp = schermVan(v);
      strooi(v.x + 38 * v.schaal, v.y - (dichtbij(v) ? 34 : 6) * v.schaal, 6, 'stof');
      if (fase !== 'spel') return;
      if (Geluid.plop) Geluid.plop();
      if (v.mens) { pop(sp.hx, sp.hy - 60, 'In de stoppels!', 'fout'); if (window.Tril) Tril.fout(); }
      else zeg(v.k, 'neer');
    },
    op(v) { if (v.mens && fase === 'spel' && Geluid.woesj) Geluid.woesj(); },
    knap(v) {
      const sp = schermVan(v);
      if (Geluid.knap) Geluid.knap();
      if (v.mens) setTimeout(() => { if (fase === 'spel') Geluid.jammer(); }, 450);
      strooi(sp.x, sp.y, 8, 'vonk');
      if (fase !== 'spel') return;
      if (v.mens) { pop(sp.hx, sp.hy - 70, 'Knap!', 'fout'); if (window.Tril) Tril.bots(1); }
      else zeg(v.k, 'knap');
    },
    stuur(v) { if (Geluid.deel) Geluid.deel(); if (!v.mens && fase === 'spel' && Math.random() < 0.5) zeg(v.k, 'brief'); },
    brief(v) {
      const sp = schermVan(v);
      strooi(sp.x, sp.y, 12, 'vonk');
      if (Geluid.kling) Geluid.kling();
      if (v.mens) pop(sp.x, sp.y - 22, `+${BONUS}`, 'goed');
    },
    briefWeg(v) { if (v.mens && fase === 'spel') { const sp = schermVan(v); pop(sp.hx + 20, sp.hy - 80, 'Briefje weg', 'zacht'); } },
    klok() { einde(); }
  };
  function briefje(k) {
    if (!W || fase !== 'spel') return;
    const v = W.vliegers[k];
    if (!v || !v.mens) return;
    const knop = k ? ui.brief2 : ui.brief;
    if (stuurBrief(W, v)) { werkKaartenBij(); if (window.Tril) Tril.tik(); }
    else if (knop) { knop.classList.remove('schud'); void knop.offsetWidth; knop.classList.add('schud'); }
  }
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
      if (i < stappen.length) { zet(stappen[i], true, i === 0 && !tegen ? 'Speler 1 links, speler 2 rechts' : ''); if (Geluid.tel) Geluid.tel(); i++; setTimeout(volgende, duur); return; }
      zet(verder ? 'Verder!' : 'Laat op!', false);
      Geluid.start();
      fase = 'spel';
      if (W) { W.actief = true; if (W.t < 0) W.t = 0; }
      if (ui.werkTrekBij) ui.werkTrekBij();
      begin();
      werkKaartenBij();
      setTimeout(() => { if (ui.tel && fase === 'spel') ui.tel.innerHTML = ''; }, 900);
    };
    setTimeout(volgende, verder ? 200 : (rustig() ? 200 : 650));
  }
  function einde() {
    if (fase === 'klaar') return;
    fase = 'klaar';
    if (windGeluid) { windGeluid.stop(); windGeluid = null; }
    W.vliegers.forEach((v) => { v.trek = false; });
    // de kerkklok slaat
    if (Geluid.klok) { Geluid.klok(); setTimeout(() => Geluid.klok(), 900); }
    const s = W.vliegers.map(stand);
    const w = s[0] === s[1] ? -1 : s[0] > s[1] ? 0 : 1;
    uitslag = { w, s };
    werkKaartenBij();
    const verschil = Math.abs(s[0] - s[1]) < 1 ? 'precies even hoog' : `${Math.round(Math.abs(s[0] - s[1]))} meter hoger`;
    let bedrag, tekst, verderKnop = null, gewonnenSpel = false;
    const naam = (k) => spelers[k].naam;
    if (!tegen) {
      bedrag = 20; gewonnenSpel = true;
      tekst = w < 0 ? 'Even hoog! Allebei gewonnen.' : `${naam(w)} staat het hoogst, ${verschil}!`;
      banier(w < 0 ? 'Gelijk!' : `${naam(w)} wint!`, w < 0 ? '' : verschil);
      Geluid.tada(); vonken(30);
    } else if (w === 0) {
      const telling = gewonnen(), eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('vlieger-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true; tekst = `Gewonnen van ${tegen.naam}: jouw vlieger stond ${verschil}!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} wil nu ook tegen je vliegeren!`;
        verderKnop = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('vl-tegen', volgende.id); nieuwePartij(); } };
      }
      banier('Gewonnen!', verschil);
      Geluid.tada(); vonken(40);
      zeg(1, 'verliest');
    } else {
      bedrag = 10; gewonnenSpel = false;
      tekst = w < 0 ? `Precies even hoog als ${tegen.naam}. Bijna!` : `${tegen.naam} stond ${verschil}. Goed geprobeerd!`;
      banier(w < 0 ? 'Gelijk!' : `${tegen.naam} wint`, w < 0 ? '' : verschil);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'vliegeren', bedrag, gewonnen: gewonnenSpel, tekst, verder: verderKnop, wacht: 2600 });
    const id = spelId;
    setTimeout(() => {
      if (fase !== 'klaar' || id !== spelId || !ui.uitslag) return;
      ui.uitslag.innerHTML = `<b>${tegen ? (w === 0 ? 'Gewonnen!' : w < 0 ? 'Gelijk!' : 'Volgende keer beter') : (w < 0 ? 'Gelijk!' : `${naam(w)} wint!`)}</b><span>${Math.round(s[0])} m tegen ${Math.round(s[1])} m</span><button class="knop hp-weer" type="button">${icoon('opnieuw')}Nog een keer</button>`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.hp-weer').addEventListener('click', () => nieuwePartij());
    }, 2400);
  }

  // ============================================================
  // KAARTEN, HINTS EN PRAATJES
  // ============================================================
  let standSleutel = '';
  function werkStandBij() {
    if (!ui.kaart || !W) return;
    W.vliegers.forEach((v, k) => {
      // na de klok blijft de uitslag staan (de vliegers vliegen nog wel even door)
      const el = ui.kaart[k].querySelector('.vl-hoogte'), h = Math.round(fase === 'klaar' && uitslag ? uitslag.s[k] : stand(v));
      if (el._h !== h) { el._h = h; el.textContent = h; }
    });
    const sl = W.vliegers.map((v) => hint(v)).join('|') + '|' + fase;
    if (sl !== standSleutel) { standSleutel = sl; werkKaartenBij(); }
  }
  function hint(v) {
    if (fase !== 'spel') return '';
    if (v.status === 'neer') return 'neer';
    if (v.status === 'kwijt') return 'kwijt';
    if (v.trek && v.span > 0.86) return 'los';
    if (v.th < 0.3 && !v.trek) return 'zakt';
    return '';
  }
  function gezichtVan(k) {
    const p = spelers[k];
    if (p && p.persoon && window.Personen && Personen.gezicht[p.persoon]) return Personen.gezicht[p.persoon];
    const kl = k === 0 ? '#5D86B4' : '#7A8656';
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#9DBBD6"/><path d="M32 10 L48 30 L32 58 L16 30 Z" fill="${k === 0 ? '#F2D27A' : '#2E4C7E'}" stroke="#3A2A1A" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 12 V56 M17 30 H47" stroke="#6A4A22" stroke-width="1.6"/><circle cx="32" cy="30" r="6" fill="${k === 0 ? '#C8553A' : '#F3E3A4'}"/><path d="M32 58 Q26 62 30 64" stroke="${kl}" stroke-width="1.5" fill="none"/></svg>`;
  }
  function werkKaartenBij() {
    if (!ui.kaart || !spelers.length || !W) return;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k], p = spelers[k], v = W.vliegers[k];
      kaart.classList.toggle('aan', fase === 'spel');
      kaart.classList.toggle('hp-winnaar', fase === 'klaar' && uitslag && uitslag.w === k);
      const gz = kaart.querySelector('.mo-gezicht'), wie = p.persoon || 'vlieger' + k;
      if (gz.getAttribute('data-wie') !== wie) { gz.innerHTML = gezichtVan(k); gz.setAttribute('data-wie', wie); }
      kaart.querySelector('.mo-naam').textContent = p.naam;
      const doe = kaart.querySelector('.mo-doe');
      let tekst = '';
      const hh = hint(v);
      if (p.mens) tekst = { neer: 'In de stoppels', kwijt: 'Vlieger kwijt', los: 'Laat los!', zakt: 'Haal in!' }[hh] || '';
      const html2 = tekst ? `<span>${tekst}</span>` : '';
      if (doe.getAttribute('data-hint') !== html2) { doe.innerHTML = html2; doe.setAttribute('data-hint', html2); }
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-ster"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', `${tegen ? 'Tegenspeler: ' + tegen.naam : 'Speler 2'}. Tik om te wisselen`);
      } else kaart.setAttribute('aria-label', p.naam);
    });
    [[ui.brief, 0], [ui.brief2, 1]].forEach(([knop, k]) => {
      if (!knop) return;
      const v = W.vliegers[k];
      if (k === 1) knop.hidden = !!tegen;
      knop.querySelector('.vl-brief-tal').textContent = v.over;
      knop.disabled = v.over <= 0 || fase !== 'spel';
    });
    if (ui.klos) {
      // de klos roept als je moet inhalen, en kleurt rood als het touw dreigt te knappen
      const v = W.vliegers[0], hh = spelers[0].mens ? hint(v) : '';
      ui.klos.classList.toggle('uit', fase !== 'spel');
      ui.klos.classList.toggle('roep', hh === 'zakt');
      ui.klos.classList.toggle('gevaar', hh === 'los');
    }
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
  function pop(x, y, tekst, soort) {
    if (!ui.pops || !doek) return;
    const e = document.createElement('span');
    e.className = 'sj-pop hp-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekst;
    const rv = ui.vak.getBoundingClientRect(), r = doek.getBoundingClientRect();
    e.style.left = klem(r.left - rv.left + x * sc, 70, rv.width - 70) + 'px';
    e.style.top = klem(r.top - rv.top + y * sc, 30, rv.height - 20) + 'px';
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
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 600, easing: 'ease-out', fill: 'both' });
      an.onfinish = () => v.remove();
    }
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }

  // ============================================================
  // KEUZEMENU
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
      const gezichtje = t === TWEE ? `<span class="mo-twee">${gezichtVanLeeg(0)}${gezichtVanLeeg(1)}</span>` : (window.Personen ? Personen.gezicht[t.id] : '');
      b.innerHTML = `<span class="mo-gezicht">${gezichtje}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span>
        <span class="mo-keuze-naam">${t.naam}</span>${pips}
        ${t !== TWEE && open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${t.beloning}</span>` : ''}`;
      b.setAttribute('aria-label', t === TWEE ? 'Met z\'n tweeën op dit toestel: ieder een helft van het veld' : `${t.naam}, niveau ${t.niveau} van 4${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`);
      b.addEventListener('click', () => {
        if (!open) {
          b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
          if (window.Tril) Tril.fout();
          Geluid.pak();
          return;
        }
        tegen = t === TWEE ? null : t;
        if (window.Duiten) Duiten.zetVeld('vl-tegen', t.id);
        sluitMenu(false);
        nieuwePartij();
      });
      ui.lijst.appendChild(b);
    });
  }
  function gezichtVanLeeg(k) {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#9DBBD6"/><path d="M32 10 L48 30 L32 58 L16 30 Z" fill="${k === 0 ? '#F2D27A' : '#2E4C7E'}" stroke="#3A2A1A" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 12 V56 M17 30 H47" stroke="#6A4A22" stroke-width="1.6"/></svg>`;
  }

  // ============================================================
  // ONDERBREKEN EN HERVATTEN
  // ============================================================
  let herstart = null;
  function onderbreek() {
    if (ui.vak) ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    if (windGeluid) { windGeluid.stop(); windGeluid = null; }
    if (!gebouwd || !W || bevroren) return;
    if (fase === 'aftellen' || fase === 'spel') herstart = 'verder';
    spelId++;
    bevroren = true;
    W.actief = false;
    W.vliegers.forEach((v) => { v.trek = false; });
    if (ui.tel) ui.tel.innerHTML = '';
    if (fase === 'aftellen' || fase === 'spel') fase = 'pauze';
  }
  function hervat() {
    if (!gebouwd || lesOpen() || !W || (ui.menu && !ui.menu.hidden)) return;
    bevroren = false;
    const h = herstart; herstart = null;
    if (h === 'verder') aftellen(true);
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
      const w = maakWereld(zaad(4242));
      w.cb = {};
      w.vliegers = [0, 1].map((k) => maakVlieger(k, spelers[k].look, spelers[k].mens, spelers[k].t, 0, 0, 1));
      W = w;
      plaatsKinderen();
    }
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) {
        W = lesBewaard.W;
        if (lesBewaard.uitslag && fase === 'klaar' && ui.uitslag) ui.uitslag.hidden = false;
        lesBewaard = null;
      }
      return;
    }
    // een stilstaand plaatje om uit te leggen: een vlaag die over het veld komt, of een luwte
    const v = W.vliegers[0], o = W.vliegers[1];
    Object.assign(v, { status: 'vliegt', L: 120, th: soort === 'luwte' ? 0.3 : 0.7, trek: soort === 'trek', span: soort === 'vlaag' ? 0.95 : 0.5, staartKlaar: false });
    Object.assign(o, { status: 'vliegt', L: 100, th: 0.6, trek: false, staartKlaar: false });
    [v, o].forEach((x) => { x.h = x.L * Math.sin(x.th); x.d = x.L * Math.cos(x.th); });
    v.briefjes = soort === 'brief' ? [{ s: 50, wap: 0 }] : [];
    W.wd.ev = soort === 'vlaag' ? [{ soort: 'vlaag', t0: 0, duur: 3.2, sterkte: 5 }] : soort === 'luwte' ? [{ soort: 'luwte', t0: 0, duur: 4, sterkte: -4.5 }] : [];
    W.t = soort === 'vlaag' ? 2.4 : soort === 'luwte' ? 3.4 : 0;
  }
  const kaderOm = (x, y, r) => { const d = doek.getBoundingClientRect(); return { left: d.left + (x - r) * sc, top: d.top + (y - r) * sc, width: 2 * r * sc, height: 2 * r * sc }; };
  if (window.Les) {
    Les.zet('vliegeren', () => [
      { doel: () => { lesDemo('kijk'); const sp = schermVan(W.vliegers[0]); return kaderOm(sp.x, sp.y, 30); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Dit is jouw vlieger. Wie het hoogst staat als de kerkklok slaat, wint' },
      { doel: () => { lesDemo('trek'); return ui.klos; }, vorm: 'rond', gebaar: 'tik', tekst: 'Houd vast om in te halen: dan klimt hij. Laat los om te vieren: dan neemt de wind touw mee' },
      { doel: () => { lesDemo('luwte'); return kaderOm(B * 0.25, yH + (L - yH) * 0.45, 70); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Een lichte strook is een luwte: dan zakt je vlieger. Haal in!' },
      { doel: () => { lesDemo('vlaag'); return kaderOm(B * 0.25, yH + (L - yH) * 0.45, 70); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Een donkere strook is een windvlaag. Niet trekken, anders knapt het touw!' },
      { doel: () => { lesDemo('brief'); return ui.brief; }, vorm: 'rond', gebaar: 'tik', tekst: 'Stuur een briefje langs het touw omhoog. Komt het boven, dan telt het vijf meter mee' },
      { doel: () => { lesDemo('kijk'); return kaderOm(B - 22, 22, 19); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Hier zie je hoe lang het nog duurt. Haal vlak voor het eind even in: dan staat je vlieger het steilst' },
      { doel: () => { lesDemo(null); return ui.meer; }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je tegen wie je vliegert, of speel je met z\'n tweeën' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.vliegeren = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaardT = window.Duiten ? Duiten.veld('vl-tegen', 'mieke') : 'mieke';
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
        if (window.Les) Les.eersteKeer('vliegeren');
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
        fase, tegen: tegen ? tegen.id : 'twee', L, sc, yH, t: W ? W.t : 0, bevroren,
        vliegers: W ? W.vliegers.map((v) => ({ status: v.status, L: +v.L.toFixed(1), th: +v.th.toFixed(3), h: +v.h.toFixed(1), bonus: v.bonus, over: v.over, trek: v.trek, span: +v.span.toFixed(2), wind: +v.Wl.toFixed(1), stand: +stand(v).toFixed(1) })) : [],
        uitslag
      };
    },
    _test: {
      zaad(n) { rnd = n === undefined ? Math.random : zaad(n); },
      wereld() { return W; },
      trek(aan) { if (W) { W.vliegers[0].trek = !!aan; } },
      brief() { briefje(0); },
      tijd(t) { if (W) W.t = t; },
      intern: { maakWind, wind, maakWereld, maakVlieger, stapWereld, stapVlieger, aiStap, stand, zaad },
      // hele wedstrijden in stilte, om de tegenspelers af te stemmen
      sim(idA, idB, n, seed) {
        const zoek = (id) => (typeof id === 'object' ? id : id === 'mens' ? MENS_MODEL : TEGENSTANDERS.find((x) => x.id === id));
        const ai = [zoek(idA), zoek(idB)];
        const r = zaad(seed || 99);
        const uit = { a: 0, b: 0, gelijk: 0, hoogte: [0, 0], neer: [0, 0], knap: [0, 0], brief: [0, 0], verschil: 0 };
        for (let s = 0; s < (n || 50); s++) {
          const w = maakWereld(r);
          w.cb = {};
          w.vliegers = [0, 1].map((k) => { const v = maakVlieger(k, 'jij', false, ai[k], k ? 105 : 225, 0, 1); v.status = 'vliegt'; v.L = 22; v.th = 0.62; return v; });
          w.actief = true; w.t = 0;
          while (!w.klaar) stapWereld(w, DT);
          const st = w.vliegers.map(stand);
          if (st[0] > st[1]) uit.a++; else if (st[1] > st[0]) uit.b++; else uit.gelijk++;
          w.vliegers.forEach((v, i) => { uit.hoogte[i] += st[i]; uit.neer[i] += v.neerKeer; uit.knap[i] += v.knapKeer; uit.brief[i] += v.bonus / BONUS; });
          uit.verschil += Math.abs(st[0] - st[1]);
        }
        const m = n || 50;
        uit.hoogte = uit.hoogte.map((x) => +(x / m).toFixed(1)); uit.neer = uit.neer.map((x) => +(x / m).toFixed(2));
        uit.knap = uit.knap.map((x) => +(x / m).toFixed(2)); uit.brief = uit.brief.map((x) => +(x / m).toFixed(2));
        uit.verschil = +(uit.verschil / m).toFixed(1);
        return uit;
      }
    }
  };
})();
