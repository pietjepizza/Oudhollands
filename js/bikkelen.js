/* Bikkelen, schermvullend: vier bikkels en een leren balletje op de stoep.

   Zo werd het gespeeld, vooral door meisjes, op de stoep of op tafel:
   - gooi de vier bikkels neer;
   - gooi de bal op, laat hem één keer stuiten, pak intussen bikkels en vang de bal weer;
   - enen, tweeën, drieën (drie en één) en vieren: zoveel bikkels per keer;
   - daarna draai je de bikkels één voor één op dezelfde kant: bol, hol, rug en S;
     liggen ze alle vier goed, dan pak je ze in één keer op;
   - pak je te veel of te weinig, of stuit de bal twee keer: dan is de ander;
     wie weer aan de beurt komt, begint opnieuw aan het figuur waar ze gebleven was;
   - wie het eerst alle acht figuren heeft, wint.
   Een bikkel is het sprongbeentje van een schaap. Hij valt het vaakst op een brede kant (bol of hol)
   en maar zelden op een smalle (rug of S).

   Speelgevoel:
   - veeg de bikkels van je zakdoek de stoep op: zacht vegen houdt ze bij elkaar, hard vegen strooit ze uit;
   - tik op de bal en hij vliegt omhoog: hij wordt groter en zijn schaduw loopt weg;
   - tik een bikkel om hem te pakken of om te draaien, veeg over twee, drie of vier bikkels om ze samen te pakken;
   - vang de bal na de eerste stuit met een tik;
   - de tegenspeelster speelt aan de overkant; tik op de stoep om haar beurt sneller te laten gaan. */
(function () {
  'use strict';

  // ============================================================
  // MATEN EN REGELS (logische maten; de stoep is 400 breed, de lengte rekt mee met het scherm)
  // ============================================================
  const B = 400;
  const BL = 40;                          // de lengte van een bikkel
  const BAL_R = 13;                       // de straal van de bal
  const ZONE = 112;                       // de strook met de zakdoek aan elke kant
  const RAAK = 24;                        // zo dicht moet een veeg langs een bikkel gaan om hem mee te nemen
  const TIK_R = 31;                       // zo ver naast een bikkel mag een tik zijn
  const MIN_AF = 44;                      // zo dicht liggen bikkels hoogstens bij elkaar
  const T1 = 1.25, E = 0.56, T2 = T1 * E; // eerste vlucht (s), hoe hoog hij terugstuit, tweede vlucht (s)
  const SPEL = 0.07;                      // een klein beetje speling na de tweede stuit (s)
  const KANTEN = ['bol', 'hol', 'rug', 's'];
  const VALKANS = [['bol', 0.39], ['hol', 0.37], ['rug', 0.12], ['s', 0.12]];
  const KANTNAAM = { bol: 'bol', hol: 'hol', rug: 'rug', s: 'S' };
  const FIGUREN = [
    { id: 'enen', naam: 'Enen', n: 1 },
    { id: 'tweeen', naam: 'Tweeën', n: 2 },
    { id: 'drieen', naam: 'Drieën', n: 3 },
    { id: 'vieren', naam: 'Vieren', n: 4 },
    { id: 'bol', naam: 'Bol', kant: 'bol' },
    { id: 'hol', naam: 'Hol', kant: 'hol' },
    { id: 'rug', naam: 'Rug', kant: 'rug' },
    { id: 's', naam: 'S', kant: 's' }
  ];
  const FOUT = { mis: 'Mis!', teveel: 'Te veel!', teweinig: 'Te weinig!', drieofeen: 'Drie of één!', dubbel: 'Eén keer pakken!', geraakt: 'Geraakt!' };

  // ============================================================
  // TEGENSPEELSTERS: hoe vlug haar handen zijn (greep, draai) en hoe goed ze vangt
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'mieke', niveau: 1, beloning: 25, greep: 0.9, vang: 0.93, draai: 0.92, strooi: 0.25, rust: 1.25,
      zegt: { start: ['Ik kan al tot de vieren!', 'Mag ik ook?'], goed: ['Hup!', 'Gelukt!'], mis: ['Oei!', 'Hij stuitte weg!'], jouw: ['Nu ik!', 'Mijn beurt!'], wint: ['Gewonnen!'], verliest: ['Nog een keer?'] } },
    { id: 'grietje', niveau: 2, beloning: 40, greep: 0.94, vang: 0.95, draai: 0.95, strooi: 0.55, rust: 1.1,
      zegt: { start: ['Zullen we bikkelen?', 'Jij mag de bal.'], goed: ['Zo!', 'Netjes.'], mis: ['Ach, mis.', 'Te hoog gegooid.'], jouw: ['Mijn beurt.', 'Dank je!'], wint: ['Gewonnen!'], verliest: ['Goed gedaan!'] } },
    { id: 'trijntje', niveau: 3, beloning: 60, greep: 0.965, vang: 0.97, draai: 0.97, strooi: 0.8, rust: 0.95,
      zegt: { start: ['Ik bikkel elke dag op de stoep.', 'Let maar op.'], goed: ['Hop, hop.', 'Kinderspel.'], mis: ['Hè, net niet.', 'Die was glad.'], jouw: ['Nu ga ik.', 'Kijk maar.'], wint: ['Op de stoep ben ik de baas.'], verliest: ['Jij hebt vlugge handen!'] } },
    { id: 'opoe', niveau: 4, beloning: 90, greep: 0.976, vang: 0.982, draai: 0.982, strooi: 1, rust: 0.9,
      zegt: { start: ['Vroeger bikkelde ik de hele dag.', 'Kijk maar, kind.'], goed: ['Zo deden we dat vroeger.', 'Het zit er nog in!'], mis: ['Och, mijn vingers.', 'Och, och.'], jouw: ['Opoe is aan de beurt.', 'Let maar op, kind.'], wint: ['Opoe kan het nog!'], verliest: ['Knap hoor, kind!'] } }
  ];
  TEGENSTANDERS.forEach((t) => { t.naam = window.Personen ? Personen.namen[t.id] : t.id; });
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  // een mens, zoals de simulatie hem nadoet bij het afstemmen
  const MENS_MODEL = { greep: 0.97, vang: 0.96, draai: 0.97, strooi: 0.6, rust: 1 };

  // ============================================================
  // DE VORM VAN EEN BIKKEL (van boven gezien; x van -1 tot 1 over de lengte)
  // ============================================================
  const VORM = {
    breed: 'M-1 0.02 C-1 -0.36 -0.82 -0.6 -0.5 -0.6 C-0.2 -0.6 0.1 -0.52 0.4 -0.56 C0.66 -0.6 0.94 -0.48 0.98 -0.24 C1 -0.12 0.9 -0.07 0.9 0 C0.9 0.06 1 0.12 0.98 0.24 C0.94 0.46 0.68 0.58 0.4 0.56 C0.1 0.54 -0.18 0.6 -0.5 0.6 C-0.82 0.6 -1 0.38 -1 0.02 Z',
    rug: 'M-1 0 C-1 -0.3 -0.8 -0.43 -0.5 -0.42 C-0.16 -0.41 0.18 -0.38 0.5 -0.4 C0.8 -0.41 1 -0.28 1 0 C1 0.28 0.8 0.41 0.5 0.4 C0.18 0.39 -0.16 0.43 -0.5 0.42 C-0.8 0.42 -1 0.3 -1 0 Z',
    s: 'M-1 0.04 C-1 -0.28 -0.8 -0.42 -0.52 -0.38 C-0.2 -0.34 0.1 -0.46 0.44 -0.44 C0.78 -0.42 1 -0.26 1 0.02 C1 0.3 0.8 0.42 0.5 0.38 C0.2 0.34 -0.1 0.46 -0.44 0.44 C-0.78 0.42 -1 0.32 -1 0.04 Z'
  };
  // bol: de groef van het katrolletje aan één kant; rug: een rechte groef; S: een kronkel
  const DETAIL = { bol: 'M0.9 0 C0.62 -0.03 0.4 0.02 0.16 0', rug: 'M-0.66 0.02 Q0 -0.05 0.66 0.02', s: 'M-0.64 0.14 C-0.26 -0.34 0.26 0.36 0.64 -0.12' };
  const NAAD = 'M-0.95 -0.32 Q-0.05 0.22 0.2 -0.99 M-0.22 0.99 Q0.18 -0.06 0.96 0.3';
  const paden = {};
  const pad2d = (sleutel, d) => paden[sleutel] || (paden[sleutel] = new Path2D(d));
  const vormVan = (kant) => (kant === 'bol' || kant === 'hol' ? pad2d('breed', VORM.breed) : pad2d(kant, VORM[kant]));

  // het licht valt van linksboven (op het scherm); schaduwen vallen naar rechtsonder
  const NAAR_LICHT = [-0.55, -0.835];

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, doek, ctx, ui = {}, gebouwd = false, raf = 0, vorigeT = 0;
  let liggend = false, L = 540, sc = 1, dpr = 1, steen = null, achter = null, achterSleutel = '';
  let tegen = TEGENSTANDERS[0];          // null = met z'n tweeën
  let spelers = [], aan = 0, fase = 'klaar', spelId = 0, winnaar = -1, potjes = 0;
  let bikkels = [], bal = null, worp = null, draaien = false;
  let veeg = null, trek = null, hand = null, toetsKeuze = null;
  let anims = [], deeltjes = [], ringen = [];
  let tempo = 1, herstart = null, naarWissel = -1, hintStuit = 0;
  let lesSoort = null, lesBewaard = null;
  let rnd = Math.random;

  const NS = 'http://www.w3.org/2000/svg';
  const OPSLAG = 'speelhuys.bikkelen';
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nu = () => performance.now();
  const wacht = (ms) => new Promise((r) => setTimeout(r, rustig() ? Math.min(ms, 80) : ms / tempo));
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const afst = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const plek = (b) => [b.x, b.y];
  const willekeurig = (l) => l[Math.floor(rnd() * l.length)];
  const mens = (k) => !spelers[k] || spelers[k].mens;
  const naamVan = (k) => (spelers[k] ? spelers[k].naam : '');
  const figuur = (k) => FIGUREN[Math.min(FIGUREN.length - 1, spelers[k === undefined ? aan : k] ? spelers[k === undefined ? aan : k].fig : 0)];
  const gewonnen = () => (window.Duiten ? Duiten.veld('bik-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  function zaad(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  function valKant() { let r = rnd(); for (const [k, p] of VALKANS) { if ((r -= p) < 0) return k; } return 'bol'; }

  // aan welke kant van de stoep iemand speelt: 0 = onder (bij jou), 1 = boven (de overkant)
  // met z'n tweeën speelt wie aan de beurt is onderaan: je geeft de telefoon door
  const zijdeVan = (k) => (tegen ? k : (k === aan ? 0 : 1));
  const voor = (z) => (z === 0 ? -1 : 1);
  const handMidden = (z) => (z === 0 ? [B / 2, L - 58] : [B / 2, 58]);
  const SLOTS = [[-79, 11, -0.5], [-45, -15, 0.35], [45, -15, -0.3], [79, 11, 0.55]];
  function slot(z, i) {
    const m = handMidden(z), s = SLOTS[i], f = z === 0 ? 1 : -1;
    return { x: m[0] + s[0] * f, y: m[1] + s[1] * f, hoek: s[2] + (z ? Math.PI : 0) };
  }
  const balRust = (z) => { const m = handMidden(z); return [m[0], m[1] + (z === 0 ? 3 : -3)]; };
  const kleurVan = (k) => (k === 0 ? 'rood' : 'blauw');
  const opVloer = () => bikkels.filter((b) => b.waar === 'vloer');
  const alleOp = (kant) => bikkels.every((b) => b.waar !== 'vloer' || b.kant === kant);

  // ============================================================
  // VAN LOGISCHE MATEN NAAR HET SCHERM (dwars: een kwartslag gedraaid, jij rechts)
  // ============================================================
  function zetVeld(g) {
    const k = sc * dpr;
    if (liggend) g.setTransform(0, -k, k, 0, 0, B * k); else g.setTransform(k, 0, 0, k, 0, 0);
  }
  function naarScherm(x, y) {
    const r = doek.getBoundingClientRect();
    return liggend ? [r.left + y * sc, r.top + (B - x) * sc] : [r.left + x * sc, r.top + y * sc];
  }
  function naarVeld(cx, cy) {
    const r = doek.getBoundingClientRect(), sx = (cx - r.left) / sc, sy = (cy - r.top) / sc;
    return liggend ? [B - sy, sx] : [sx, sy];
  }
  // een richting op het scherm in veldmaten
  const inVeld = (v) => (liggend ? [-v[1], v[0]] : [v[0], v[1]]);

  // ============================================================
  // OPBOUW
  // ============================================================
  const bikkelSvg = (kant) => {
    const smal = kant === 'rug' || kant === 's';
    const d = smal ? VORM[kant] : VORM.breed;
    const detail = kant === 'hol' ? '<ellipse cx="-0.04" cy="0" rx="0.42" ry="0.2" fill="#9C7E50" opacity=".75" transform="rotate(-20)"/>'
      : `<path d="${DETAIL[kant]}" fill="none" stroke="#9C7E50" stroke-width=".09" stroke-linecap="round"/>`;
    return `<path d="${d}" fill="url(#bk-bot)" stroke="#6B5434" stroke-width=".05"${kant === 'hol' ? ' transform="scale(1 -1)"' : ''}/>${detail}`;
  };
  const gezicht = (kleur) => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="url(#bk-ruit-${kleur})"/>
    <ellipse cx="34.5" cy="38" rx="21" ry="12" fill="#000" opacity=".22" transform="rotate(-22 34.5 38)"/>
    <g transform="translate(32 33) rotate(-22) scale(19)">${bikkelSvg('bol')}<ellipse cx="-0.42" cy="-0.26" rx="0.24" ry="0.1" fill="#fff" opacity=".6"/></g></svg>`;
  const gezichtVan = (k) => {
    const p = spelers[k];
    if (p && p.persoon && window.Personen) return Personen.gezicht[p.persoon];
    return gezicht(kleurVan(k));
  };
  const STIP = { 1: [[12, 12]], 2: [[7.5, 7.5], [16.5, 16.5]], 3: [[6, 6], [12, 12], [18, 18]], 4: [[7.5, 7.5], [16.5, 7.5], [7.5, 16.5], [16.5, 16.5]] };
  const glyph = (f) => (f.kant ? icoon('bk-' + f.kant)
    : `<svg viewBox="0 0 24 24" aria-hidden="true">${STIP[f.n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.1" fill="currentColor"/>`).join('')}</svg>`);
  const rijVan = (fig) => FIGUREN.map((f, i) => `<i class="bk-fig${i < fig ? ' klaar' : (i === fig ? ' nu' : '')}">${glyph(f)}</i>`).join('');

  function bouw() {
    podium = document.getElementById('bk-podium');
    podium.innerHTML = '';
    const ruit = (id, kleur) => `<pattern id="bk-ruit-${id}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="12" height="12" fill="#F2ECDF"/><rect width="6" height="12" fill="${kleur}" opacity=".5"/><rect width="12" height="6" fill="${kleur}" opacity=".5"/></pattern>`;
    podium.appendChild(html(`<svg class="mo-defs" width="0" height="0" aria-hidden="true"><defs>
      ${ruit('rood', '#B2302A')}${ruit('blauw', '#244E8C')}
      <radialGradient id="bk-bot" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#FFF9EC"/><stop offset=".42" stop-color="#EBDCBA"/><stop offset="1" stop-color="#BFA273"/></radialGradient>
    </defs></svg>`));
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="bk-rij" aria-hidden="true"></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeelster" title="Kies je tegenspeelster" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="bk-veldvak">
      <canvas class="bk-doek" role="application" tabindex="0" aria-label="De stoep met vier bikkels en een bal. Veeg de bikkels de stoep op, tik op de bal om hem op te gooien, tik of veeg over bikkels om ze te pakken en tik op de bal om hem te vangen. Met het toetsenbord: de spatiebalk gooit en vangt, de cijfers 1 tot 4 pakken bikkels."></canvas>
      <div class="sj-pops bk-pops" aria-hidden="true"></div>
      <div class="sj-kaart bk-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="bk-rij" aria-hidden="true"></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeelster" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met wie bikkel je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders"></div>
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
      midden, vak: midden.querySelector('.bk-veldvak'), pops: midden.querySelector('.bk-pops'), uitslag: midden.querySelector('.bk-kaart'),
      meer: boven.querySelector('.mo-meer'), menu, lijst: menu.querySelector('.mo-tegenstanders'), meld
    };
    doek = midden.querySelector('.bk-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', neer);
    doek.addEventListener('pointermove', beweeg);
    doek.addEventListener('pointerup', los);
    doek.addEventListener('pointercancel', () => { trek = null; if (veeg) { bikkels.forEach((b) => { b.gloed = 0; }); veeg = null; } });
    doek.addEventListener('keydown', toets);
    ui.kaart[1].addEventListener('click', openMenu);
    ui.meer.addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('bikkelen'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    document.addEventListener('visibilitychange', () => {
      if (location.hash !== '#bikkelen') return;
      if (document.hidden) onderbreek(); else hervat();
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(ui.midden);
    window.addEventListener('resize', () => pasMaatAan());
    // als Gijs komt, wacht het spel; als hij weggaat, gaat het verder
    const les = document.getElementById('les');
    if (les && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => {
        if (location.hash !== '#bikkelen') return;
        if (!les.hidden) { if (!lesSoort) onderbreek(); }
        else { lesDemo(null); hervat(); }
      }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
    }
    bikkels = [0, 1, 2, 3].map((i) => ({ i, x: 0, y: 0, hoek: 0, kant: KANTEN[i], waar: 'hand', zijde: 0, slot: i, h: 0, flip: 1, gloed: 0, wiebel: 0 }));
    bal = { x: B / 2, y: L - 54, h: 0, spin: 0, plet: 0, wenk: 0 };
    gebouwd = true;
  }

  // De stoep zo groot mogelijk; de lengte rekt mee tussen 1,12 en 1,62 keer de breedte
  function pasMaatAan() {
    if (!ui.midden || !doek) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const wasLiggend = liggend;
    liggend = !!(window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches);
    let breed = r.width;
    if (liggend) {
      // dwars: de stoep krijgt alles wat de twee smalle kolommen met de kaarten overlaten
      const pr = podium.getBoundingClientRect(), cs = getComputedStyle(podium);
      breed = pr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * 168 - 20;
    }
    const lang = (liggend ? breed : r.height) - 8, kort = (liggend ? r.height : r.width) - 8;
    const nieuweL = Math.round(B * klem(lang / Math.max(1, kort), 1.12, 1.62));
    const s = Math.max(0.45, Math.min(kort / B, lang / nieuweL, 1.6));
    const nieuweDpr = Math.min(3, window.devicePixelRatio || 1);
    if (nieuweL === L && Math.abs(s - sc) < 0.001 && wasLiggend === liggend && nieuweDpr === dpr && steen) return;
    if (nieuweL !== L) herschik(L, nieuweL);
    L = nieuweL; sc = s; dpr = nieuweDpr;
    const bw = (liggend ? L : B) * sc, bh = (liggend ? B : L) * sc;
    podium.style.setProperty('--bk-b', Math.round(bw) + 'px');
    podium.style.setProperty('--bk-h', Math.round(bh) + 'px');
    podium.classList.toggle('bk-liggend', liggend);
    doek.width = Math.round(bw * dpr); doek.height = Math.round(bh * dpr);
    steen = null; achter = null;
    if (spelers.length) teken();
  }
  // als de stoep langer of korter wordt, schuift alles mee
  function herschik(oud, nieuw) {
    const f = (y) => ZONE + (y - ZONE) * (nieuw - 2 * ZONE) / Math.max(1, oud - 2 * ZONE);
    bikkels.forEach((b) => {
      if (b.waar === 'hand') { const s = slot(b.zijde, b.slot); L = nieuw; const s2 = slot(b.zijde, b.slot); L = oud; b.x = s2.x; b.y = s2.y; b.hoek = s.hoek; }
      else b.y = f(b.y);
    });
    if (bal && !worp) { const z = bal.y > oud / 2 ? 0 : 1; L = nieuw; const p = balRust(z); L = oud; bal.x = p[0]; bal.y = p[1]; }
    else if (bal) bal.y = f(bal.y);
    if (worp) { [worp.van, worp.land, worp.na].forEach((p) => { p[1] = f(p[1]); }); }
  }

  // ============================================================
  // DE STOEP: hardsteen met frijnslag, een paar voegen, zon en schaduw van een boom
  // ============================================================
  function maakSteen() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    const r = zaad(20231);
    zetVeld(g);
    const naadY = Math.round(L * 0.29), naadX = Math.round(B * 0.62);
    const platen = [
      { x0: -40, y0: -40, x1: B + 40, y1: naadY, toon: [112, 120, 129], hoek: 0.05 },
      { x0: -40, y0: naadY, x1: naadX, y1: L + 40, toon: [104, 112, 121], hoek: -0.03 },
      { x0: naadX, y0: naadY, x1: B + 40, y1: L + 40, toon: [117, 124, 132], hoek: 1.54 }
    ];
    platen.forEach((p) => tekenPlaat(g, p, r));
    tekenNaad(g, [-40, naadY], [B + 40, naadY], r);
    tekenNaad(g, [naadX, naadY], [naadX, L + 40], r);
    seizoensDingen(g, r);
    // licht en schaduw op het scherm
    g.setTransform(1, 0, 0, 1, 0, 0);
    const w = c.width, h = c.height, m = Math.hypot(w, h);
    let gr = g.createRadialGradient(w * 0.1, h * 0.06, 0, w * 0.1, h * 0.06, m * 0.95);
    gr.addColorStop(0, 'rgba(255, 230, 186, .22)'); gr.addColorStop(0.5, 'rgba(255, 230, 186, .06)'); gr.addColorStop(1, 'rgba(255, 230, 186, 0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // de schaduw van een linde, rechtsboven
    const r2 = zaad(77);
    for (let i = 0; i < 18; i++) {
      const cx = w * (0.6 + r2() * 0.5), cy = h * (-0.06 + r2() * 0.3), rad = Math.min(w, h) * (0.05 + r2() * 0.09);
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, 'rgba(10, 16, 22, .2)'); rg.addColorStop(0.6, 'rgba(10, 16, 22, .1)'); rg.addColorStop(1, 'rgba(10, 16, 22, 0)');
      g.fillStyle = rg; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, 'rgba(20, 28, 40, 0)'); gr.addColorStop(1, 'rgba(20, 28, 40, .2)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, m * 0.62);
    gr.addColorStop(0, 'rgba(6, 8, 12, 0)'); gr.addColorStop(1, 'rgba(6, 8, 12, .5)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (document.documentElement.getAttribute('data-seizoen') === 'winter') {
      g.fillStyle = 'rgba(214, 228, 242, .16)'; g.fillRect(0, 0, w, h);
      const r3 = zaad(5);
      for (let i = 0; i < w * h / 1400; i++) { g.fillStyle = `rgba(240, 246, 252, ${0.12 + r3() * 0.3})`; g.fillRect(r3() * w, r3() * h, 1 + r3() * 1.6, 1 + r3() * 1.6); }
    }
    return c;
  }
  function tekenPlaat(g, p, r) {
    const bw = p.x1 - p.x0, bh = p.y1 - p.y0, [cr, cg, cb] = p.toon;
    g.save();
    g.beginPath(); g.rect(p.x0, p.y0, bw, bh); g.clip();
    let gr = g.createLinearGradient(p.x0, p.y0, p.x1, p.y1);
    gr.addColorStop(0, `rgb(${cr + 7}, ${cg + 7}, ${cb + 7})`); gr.addColorStop(1, `rgb(${cr - 9}, ${cg - 9}, ${cb - 7})`);
    g.fillStyle = gr; g.fillRect(p.x0, p.y0, bw, bh);
    // wolken van lichter en donkerder steen
    for (let i = 0; i < 10; i++) {
      const cx = p.x0 + r() * bw, cy = p.y0 + r() * bh, rad = 40 + r() * 130, licht = r() < 0.5;
      gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, licht ? 'rgba(206, 216, 226, .08)' : 'rgba(18, 24, 32, .09)'); gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    // frijnslag: korte, fijne beitelslagen in één richting
    g.save();
    g.translate((p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2);
    g.rotate(p.hoek);
    const half = Math.hypot(bw, bh) / 2 + 10;
    g.lineCap = 'round';
    for (let x = -half; x < half; x += 1.9 + r() * 2.6) {
      let y = -half + r() * 10;
      while (y < half) {
        const len = 2.5 + r() * 15, a = 0.025 + r() * 0.07, licht = r() < 0.22;
        g.strokeStyle = licht ? `rgba(220, 228, 236, ${(a * 0.55).toFixed(3)})` : `rgba(14, 18, 24, ${a.toFixed(3)})`;
        g.lineWidth = 0.4 + r() * 0.8;
        const dx = (r() - 0.5) * 1.2;
        g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x - dx * 0.4, y + len); g.stroke();
        y += len + 1 + r() * 9;
      }
    }
    g.restore();
    // korrel: fijn en wat grover
    {
      const opp0 = bw * bh;
      for (let i = 0; i < opp0 / 26; i++) { const x = p.x0 + r() * bw, y = p.y0 + r() * bh, d = 0.3 + r() * 0.7; g.fillStyle = r() < 0.55 ? `rgba(8, 12, 18, ${(0.05 + r() * 0.1).toFixed(3)})` : `rgba(226, 232, 240, ${(0.04 + r() * 0.08).toFixed(3)})`; g.fillRect(x, y, d, d); }
      for (let i = 0; i < opp0 / 380; i++) { const x = p.x0 + r() * bw, y = p.y0 + r() * bh, d = 1 + r() * 2.6; g.fillStyle = r() < 0.6 ? `rgba(20, 26, 34, ${(0.03 + r() * 0.05).toFixed(3)})` : `rgba(200, 210, 222, ${(0.025 + r() * 0.04).toFixed(3)})`; g.beginPath(); g.arc(x, y, d, 0, Math.PI * 2); g.fill(); }
    }
    // de boordslag: een gladdere rand langs de voegen
    const band = 15;
    [[p.x0, p.y0, bw, band], [p.x0, p.y1 - band, bw, band], [p.x0, p.y0, band, bh], [p.x1 - band, p.y0, band, bh]].forEach(([x, y, w, h]) => {
      g.fillStyle = 'rgba(178, 188, 198, .07)'; g.fillRect(x, y, w, h);
    });
    // fossieltjes (de witte stipjes en ringetjes van hardsteen) en korrel
    const opp = bw * bh;
    for (let i = 0; i < opp / 650; i++) { const x = p.x0 + r() * bw, y = p.y0 + r() * bh, s = 0.5 + r() * 1.3; g.fillStyle = `rgba(232, 238, 242, ${(0.1 + r() * 0.32).toFixed(3)})`; g.fillRect(x, y, s, s * (0.6 + r() * 0.6)); }
    g.lineWidth = 0.55;
    for (let i = 0; i < opp / 2600; i++) { const x = p.x0 + r() * bw, y = p.y0 + r() * bh; g.strokeStyle = `rgba(226, 232, 236, ${(0.14 + r() * 0.2).toFixed(3)})`; g.beginPath(); g.arc(x, y, 0.9 + r() * 1.5, 0, Math.PI * 2); g.stroke(); }
    for (let i = 0; i < opp / 160; i++) { const x = p.x0 + r() * bw, y = p.y0 + r() * bh, s = 0.35 + r() * 0.6; g.fillStyle = r() < 0.5 ? `rgba(10, 14, 20, ${(0.05 + r() * 0.08).toFixed(3)})` : `rgba(230, 236, 242, ${(0.04 + r() * 0.06).toFixed(3)})`; g.fillRect(x, y, s, s); }
    // uitgesleten plekken, waar iedereen loopt
    for (let i = 0; i < 2; i++) {
      const cx = p.x0 + r() * bw, cy = p.y0 + r() * bh, rad = 60 + r() * 90;
      gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, 'rgba(200, 208, 216, .06)'); gr.addColorStop(1, 'rgba(200, 208, 216, 0)');
      g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    g.restore();
  }
  function tekenNaad(g, a, b, r) {
    const d = [b[0] - a[0], b[1] - a[1]], len = Math.hypot(d[0], d[1]), n = [-d[1] / len, d[0] / len];
    const licht = inVeld(NAAR_LICHT);
    // de rand die naar het licht kijkt, glimt; de andere ligt in de schaduw
    const t = n[0] * licht[0] + n[1] * licht[1] < 0 ? 1 : -1;
    const lijn = (off, kleur, dik) => { g.strokeStyle = kleur; g.lineWidth = dik; g.beginPath(); g.moveTo(a[0] + n[0] * off, a[1] + n[1] * off); g.lineTo(b[0] + n[0] * off, b[1] + n[1] * off); g.stroke(); };
    lijn(0, '#2C3137', 4.4);
    lijn(0, '#191C20', 1.8);
    lijn(2.6 * t, 'rgba(226, 234, 242, .2)', 1);
    lijn(-2.6 * t, 'rgba(8, 10, 14, .35)', 1.2);
    // zand en mos in de voeg
    for (let s = 0; s < len; s += 1.6 + r() * 4.5) {
      const x = a[0] + d[0] * s / len + n[0] * (r() - 0.5) * 2.6, y = a[1] + d[1] * s / len + n[1] * (r() - 0.5) * 2.6;
      const mos = r() < 0.13;
      g.fillStyle = mos ? `rgba(76, 100, 52, ${(0.35 + r() * 0.4).toFixed(3)})` : `rgba(156, 140, 112, ${(0.16 + r() * 0.26).toFixed(3)})`;
      const s2 = mos ? 1.2 + r() * 1.4 : 0.7 + r() * 1;
      g.fillRect(x, y, s2, s2);
    }
  }
  // in de sinterklaastijd liggen er een paar pepernoten op de stoep
  function seizoensDingen(g, r) {
    if (document.documentElement.getAttribute('data-seizoen') !== 'sinterklaas') return;
    const licht = inVeld(NAAR_LICHT);
    [[B - 34, 120], [B - 52, 132], [B - 28, 146]].forEach(([x, y], i) => {
      g.save();
      g.translate(x, y);
      g.fillStyle = 'rgba(10, 12, 16, .35)';
      g.beginPath(); g.ellipse(-licht[0] * 2, -licht[1] * 2, 5.4, 5, 0, 0, Math.PI * 2); g.fill();
      const gr = g.createRadialGradient(licht[0] * 2, licht[1] * 2, 0.5, 0, 0, 5.6);
      gr.addColorStop(0, '#D99A5C'); gr.addColorStop(0.6, '#A8642E'); gr.addColorStop(1, '#6E3A16');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(0, 0, 5.4 - i * 0.3, 5, i, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255, 236, 200, .35)';
      for (let k = 0; k < 4; k++) g.fillRect((r() - 0.5) * 6, (r() - 0.5) * 6, 0.7, 0.7);
      g.restore();
    });
  }
  // een zakdoek met ruitjes: hier liggen je bikkels en je bal
  function tekenZakdoek(g, z, kleur) {
    const DB = 214, DH = 94, m = handMidden(z);
    const tint = kleur === 'rood' ? '178, 48, 42' : '36, 78, 140';
    g.save();
    zetVeld(g);
    g.translate(m[0], m[1]);
    g.rotate(z ? Math.PI - 0.035 : -0.035);
    const rr = () => { const x = -DB / 2, y = -DH / 2, w = DB, h = DH, q = 5; g.beginPath(); g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath(); };
    const k = sc * dpr;
    g.shadowColor = 'rgba(8, 12, 18, .5)'; g.shadowBlur = 7 * k; g.shadowOffsetX = -NAAR_LICHT[0] * 3.5 * k; g.shadowOffsetY = -NAAR_LICHT[1] * 3.5 * k;
    rr(); g.fillStyle = '#F2ECDF'; g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    g.save(); rr(); g.clip();
    const stap = 13, baan = 6.5;
    g.fillStyle = `rgba(${tint}, .5)`;
    for (let x = -DB / 2 + 3; x < DB / 2; x += stap) g.fillRect(x, -DH / 2, baan, DH);
    for (let y = -DH / 2 + 3; y < DH / 2; y += stap) g.fillRect(-DB / 2, y, DB, baan);
    // het weefsel
    g.fillStyle = 'rgba(0, 0, 0, .05)';
    for (let x = -DB / 2; x < DB / 2; x += 1.6) g.fillRect(x, -DH / 2, 0.5, DH);
    g.fillStyle = 'rgba(255, 255, 255, .05)';
    for (let y = -DH / 2; y < DH / 2; y += 1.6) g.fillRect(-DB / 2, y, DB, 0.5);
    // zachte plooien
    [[-50, -40, 10, 40, 0.1], [30, -40, 70, 40, 0.08], [-90, 10, 90, 22, 0.06]].forEach(([x0, y0, x1, y1, a]) => {
      const gr = g.createLinearGradient(x0, y0, x1 + 20, y1 - 30);
      gr.addColorStop(0, 'rgba(0, 0, 0, 0)'); gr.addColorStop(0.45, `rgba(255, 252, 240, ${a})`); gr.addColorStop(0.55, `rgba(30, 16, 8, ${a})`); gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = gr; g.fillRect(-DB / 2, -DH / 2, DB, DH);
    });
    g.restore();
    g.lineWidth = 3; g.strokeStyle = `rgba(${tint}, .72)`;
    g.save(); g.translate(0, 0); g.scale((DB - 4) / DB, (DH - 4) / DH); rr(); g.stroke(); g.restore();
    g.lineWidth = 0.6; g.strokeStyle = 'rgba(40, 20, 10, .3)'; rr(); g.stroke();
    g.restore();
  }
  // de stoep met de twee zakdoeken, een keer getekend tot er iets verandert
  function achtergrond() {
    const z0 = spelerOpZijde(0), sleutel = `${kleurVan(z0)}|${kleurVan(1 - z0)}`;
    if (achter && achterSleutel === sleutel) return achter;
    if (!steen) steen = maakSteen();
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    g.drawImage(steen, 0, 0);
    tekenZakdoek(g, 1, kleurVan(1 - z0));
    tekenZakdoek(g, 0, kleurVan(z0));
    achter = c; achterSleutel = sleutel;
    return c;
  }
  function spelerOpZijde(z) { return zijdeVan(0) === z ? 0 : 1; }

  // ============================================================
  // TEKENEN: bikkels, bal, schaduwen
  // ============================================================
  function groef(g, p, lx, ly, w) {
    g.save(); g.lineCap = 'round';
    // de kant naar het licht ligt in de schaduw van de rand, de verre kant vangt licht
    g.translate(lx * w * 0.5, ly * w * 0.5); g.strokeStyle = 'rgba(86, 62, 32, .5)'; g.lineWidth = w; g.stroke(p);
    g.translate(-lx * w, -ly * w); g.strokeStyle = 'rgba(255, 248, 228, .55)'; g.lineWidth = w * 0.7; g.stroke(p);
    g.restore();
  }
  // elke bikkel is een beetje anders: oud bot vergeelt, en heeft poriën en vlekjes
  const TINT = ['255, 252, 244', '236, 212, 160', '244, 222, 200', '222, 218, 206'];
  function vlekjesVoor(i) {
    const r = zaad(31 + i * 17), uit = [];
    for (let n = 0; n < 9; n++) uit.push([(r() - 0.5) * 1.3, (r() - 0.5) * 0.6, 0.018 + r() * 0.03, 0.12 + r() * 0.22]);
    return uit;
  }
  function tekenBikkel(g, b) {
    const k = sc * dpr, h = Math.max(0, b.h || 0), kant = b.kant, smal = kant === 'rug' || kant === 's';
    const s = (BL / 2) * (1 + 0.55 * h);
    const licht = inVeld(NAAR_LICHT), c = Math.cos(b.hoek), sn = Math.sin(b.hoek);
    const spiegel = kant === 'hol' ? -1 : 1;
    const lx = licht[0] * c + licht[1] * sn, ly = (-licht[0] * sn + licht[1] * c) * spiegel;
    const flip = Math.max(0.06, Math.abs(b.flip === undefined ? 1 : b.flip));
    const vorm = vormVan(kant);
    const wiebel = b.wiebel ? Math.sin(nu() / 30) * 0.12 * b.wiebel : 0;
    g.save();
    zetVeld(g);
    g.translate(b.x, b.y);
    g.rotate(b.hoek + wiebel);
    g.scale(s, s * spiegel * flip);
    // schaduw en lijf in één keer
    const sh = 1.8 + 38 * h;
    g.shadowColor = `rgba(10, 12, 16, ${(0.58 - 0.32 * Math.min(1, h)).toFixed(3)})`;
    g.shadowBlur = (2.6 + 16 * h) * k;
    g.shadowOffsetX = -NAAR_LICHT[0] * sh * k; g.shadowOffsetY = -NAAR_LICHT[1] * sh * k;
    let gr = g.createRadialGradient(lx * 0.4, ly * 0.4, 0.04, 0, 0, 1.2);
    gr.addColorStop(0, '#FFF8E8'); gr.addColorStop(0.34, '#F1E4C8'); gr.addColorStop(0.72, '#DAC6A0'); gr.addColorStop(1, '#B89E72');
    g.fillStyle = gr; g.fill(vorm);
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    // de eigen kleur van dit botje
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = `rgb(${TINT[b.i % 4]})`; g.fill(vorm);
    g.globalCompositeOperation = 'source-over';
    // de kant van de schaduw is donkerder: een zachte overgang over het hele botje
    gr = g.createLinearGradient(lx, ly, -lx, -ly);
    gr.addColorStop(0, 'rgba(255, 252, 238, .16)'); gr.addColorStop(0.5, 'rgba(255, 252, 238, 0)'); gr.addColorStop(0.78, 'rgba(84, 60, 30, .1)'); gr.addColorStop(1, 'rgba(70, 48, 22, .32)');
    g.fillStyle = gr; g.fill(vorm);
    if (kant === 'bol') {
      // het katrolletje: twee ronde knobbels met een groef ertussen, en een glanzende bolling
      gr = g.createRadialGradient(-0.2 + lx * 0.35, ly * 0.35, 0, -0.2, 0, 0.75);
      gr.addColorStop(0, 'rgba(255, 255, 250, .42)'); gr.addColorStop(1, 'rgba(255, 255, 250, 0)');
      g.fillStyle = gr; g.fill(vorm);
      [-0.27, 0.27].forEach((y) => {
        gr = g.createRadialGradient(0.56 + lx * 0.09, y + ly * 0.09, 0, 0.56, y, 0.3);
        gr.addColorStop(0, 'rgba(255, 252, 240, .5)'); gr.addColorStop(1, 'rgba(255, 252, 240, 0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0.56, y, 0.3, 0, Math.PI * 2); g.fill();
      });
      groef(g, pad2d('d-bol', DETAIL.bol), lx, ly, 0.075);
    } else if (kant === 'hol') {
      // de diepe holte schuin over het midden, en een kuiltje bij het eind
      g.save(); g.rotate(-0.35);
      g.beginPath(); g.ellipse(-0.06, 0.02, 0.44, 0.21, 0, 0, Math.PI * 2);
      const r = Math.cos(-0.35), q = Math.sin(-0.35), hx = lx * r + ly * q, hy = -lx * q + ly * r;
      gr = g.createLinearGradient(-0.06 + hx * 0.44, 0.02 + hy * 0.21, -0.06 - hx * 0.44, 0.02 - hy * 0.21);
      gr.addColorStop(0, 'rgba(86, 60, 30, .8)'); gr.addColorStop(0.55, 'rgba(160, 128, 86, .5)'); gr.addColorStop(1, 'rgba(255, 246, 226, .62)');
      g.fillStyle = gr; g.fill();
      g.lineWidth = 0.03; g.strokeStyle = 'rgba(84, 60, 30, .45)'; g.stroke();
      g.restore();
      g.beginPath(); g.ellipse(0.66, -0.12, 0.1, 0.08, 0, 0, Math.PI * 2);
      g.fillStyle = 'rgba(96, 70, 38, .45)'; g.fill();
    } else {
      groef(g, pad2d('d-' + kant, DETAIL[kant]), lx, ly, 0.085);
      [-0.74, 0.74].forEach((x) => {
        gr = g.createRadialGradient(x + lx * 0.08, ly * 0.08, 0, x, 0, 0.26);
        gr.addColorStop(0, 'rgba(255, 252, 240, .42)'); gr.addColorStop(1, 'rgba(255, 252, 240, 0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, 0, 0.26, 0, Math.PI * 2); g.fill();
      });
    }
    // poriën en vlekjes
    (b.vlekjes || (b.vlekjes = vlekjesVoor(b.i))).forEach(([x, y, r, a]) => {
      g.fillStyle = `rgba(112, 86, 52, ${a.toFixed(2)})`;
      g.beginPath(); g.arc(x, y * (smal ? 0.7 : 1), r, 0, Math.PI * 2); g.fill();
    });
    // een zachte glans waar het licht valt
    g.fillStyle = 'rgba(255, 255, 255, .42)';
    g.beginPath(); g.ellipse(lx * 0.5 - 0.1, ly * (smal ? 0.24 : 0.34), 0.22, 0.07, Math.atan2(ly, lx) + Math.PI / 2, 0, Math.PI * 2); g.fill();
    g.lineWidth = 0.032; g.strokeStyle = 'rgba(86, 62, 32, .4)'; g.stroke(vorm);
    if (b.gloed > 0) { g.lineWidth = 0.12; g.strokeStyle = `rgba(255, 214, 110, ${b.gloed.toFixed(2)})`; g.stroke(vorm); }
    g.restore();
  }
  function tekenBal(g) {
    if (!bal) return;
    const k = sc * dpr, h = Math.max(0, bal.h);
    const r = BAL_R * (1 + 0.85 * h);
    const licht = inVeld(NAAR_LICHT);
    g.save();
    zetVeld(g);
    g.translate(bal.x, bal.y);
    if (bal.plet > 0) { const p = bal.plet * 0.12; g.scale(1 + p, 1 - p); }
    const sh = 1.8 + 46 * h;
    g.shadowColor = `rgba(12, 14, 18, ${(0.55 - 0.32 * Math.min(1, h)).toFixed(3)})`;
    g.shadowBlur = (2.6 + 18 * h) * k;
    g.shadowOffsetX = -NAAR_LICHT[0] * sh * k; g.shadowOffsetY = -NAAR_LICHT[1] * sh * k;
    const gr = g.createRadialGradient(licht[0] * r * 0.45, licht[1] * r * 0.45, r * 0.08, 0, 0, r * 1.05);
    gr.addColorStop(0, '#EDC48F'); gr.addColorStop(0.45, '#B2703A'); gr.addColorStop(1, '#4E270E');
    g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    // de naden van het leer draaien mee
    g.save();
    g.beginPath(); g.arc(0, 0, r * 0.98, 0, Math.PI * 2); g.clip();
    g.rotate(bal.spin || 0); g.scale(r, r);
    const naad = pad2d('naad', NAAD);
    g.lineWidth = 0.06; g.strokeStyle = 'rgba(58, 28, 10, .5)'; g.stroke(naad);
    g.setLineDash([0.15, 0.11]); g.lineWidth = 0.07; g.strokeStyle = 'rgba(242, 222, 182, .85)'; g.stroke(naad); g.setLineDash([]);
    g.restore();
    g.fillStyle = 'rgba(255, 255, 255, .42)';
    g.beginPath(); g.ellipse(licht[0] * r * 0.42, licht[1] * r * 0.42, r * 0.26, r * 0.16, Math.atan2(licht[1], licht[0]) + Math.PI / 2, 0, Math.PI * 2); g.fill();
    if (bal.wenk > 0) {
      g.lineWidth = 2.2; g.strokeStyle = `rgba(255, 220, 120, ${(bal.wenk * (0.55 + 0.35 * Math.sin(nu() / 170))).toFixed(3)})`;
      g.beginPath(); g.arc(0, 0, r + 6, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
  }
  // de hand van de tegenspeelster: een zachte schaduw die over de stoep gaat
  function tekenHand(g) {
    if (!hand || hand.a <= 0) return;
    const sch = inVeld([-NAAR_LICHT[0], -NAAR_LICHT[1]]);
    const x = hand.x + sch[0] * 16, y = hand.y + sch[1] * 16, rad = 30;
    g.save(); zetVeld(g);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(10, 12, 16, ${(0.26 * hand.a).toFixed(3)})`); gr.addColorStop(0.6, `rgba(10, 12, 16, ${(0.14 * hand.a).toFixed(3)})`); gr.addColorStop(1, 'rgba(10, 12, 16, 0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function tekenVeeg(g) {
    if (!veeg || veeg.punten.length < 2) return;
    g.save(); zetVeld(g);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(255, 246, 222, .28)'; g.lineWidth = 12;
    g.beginPath(); veeg.punten.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    g.strokeStyle = 'rgba(255, 246, 222, .55)'; g.lineWidth = 3; g.stroke();
    g.restore();
  }
  // het gooigebaar: waar de bikkels ongeveer zullen landen
  function tekenTrek(g) {
    if (!trek || fase !== 'gooien') return;
    const z = zijdeVan(aan), w = strooiWorp(z, trek);
    const m = handMidden(z), doel = w.midden;
    g.save(); zetVeld(g);
    g.strokeStyle = 'rgba(255, 248, 230, .5)'; g.lineWidth = 2.5; g.setLineDash([7, 6]);
    g.beginPath(); g.ellipse(doel[0], doel[1], w.straal + 10, (w.straal + 10) * 0.9, 0, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]);
    g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = 'rgba(255, 248, 230, .65)';
    const van = [m[0], m[1] + voor(z) * 30];
    g.beginPath(); g.moveTo(van[0], van[1]); g.lineTo(doel[0], doel[1]); g.stroke();
    const hoek = Math.atan2(doel[1] - van[1], doel[0] - van[0]);
    g.beginPath(); g.moveTo(doel[0] - Math.cos(hoek - 0.45) * 14, doel[1] - Math.sin(hoek - 0.45) * 14); g.lineTo(doel[0], doel[1]); g.lineTo(doel[0] - Math.cos(hoek + 0.45) * 14, doel[1] - Math.sin(hoek + 0.45) * 14); g.stroke();
    g.restore();
  }
  function tekenDeeltjes(g, t) {
    if (!deeltjes.length && !ringen.length) return;
    g.save(); zetVeld(g);
    deeltjes = deeltjes.filter((d) => {
      const u = (t - d.t0) / d.duur;
      if (u >= 1) return false;
      g.fillStyle = `rgba(222, 216, 204, ${(d.a * (1 - u)).toFixed(3)})`;
      g.beginPath(); g.arc(d.x + d.vx * u, d.y + d.vy * u, d.r * (1 + u), 0, Math.PI * 2); g.fill();
      return true;
    });
    ringen = ringen.filter((q) => {
      const u = (t - q.t0) / q.duur;
      if (u >= 1) return false;
      g.strokeStyle = `rgba(${q.kleur}, ${(0.85 * (1 - u)).toFixed(3)})`; g.lineWidth = 3 * (1 - u) + 0.5;
      g.beginPath(); g.arc(q.x, q.y, q.r0 + (q.r1 - q.r0) * u, 0, Math.PI * 2); g.stroke();
      return true;
    });
    g.restore();
  }
  function stof(x, y, n, kracht) {
    if (rustig()) return;
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, v = 6 + rnd() * 12 * (kracht || 1);
      deeltjes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 0.8 + rnd() * 1.2, a: 0.35 + rnd() * 0.3, t0: nu(), duur: 380 + rnd() * 300 });
    }
  }
  function ring(x, y, kleur) { if (!rustig()) ringen.push({ x, y, r0: 10, r1: 36, duur: 420, kleur: kleur || '255, 224, 140', t0: nu() }); }

  function teken() {
    if (!ctx || !doek.width) return;
    const t = nu();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(achtergrond(), 0, 0);
    // eerst wat op de grond ligt, dan wat in de lucht is (de hoogste het laatst)
    const lijst = bikkels.slice().sort((a, b) => (a.h || 0) - (b.h || 0));
    const laag = lijst.filter((b) => (b.h || 0) < 0.02), hoog = lijst.filter((b) => (b.h || 0) >= 0.02);
    laag.forEach((b) => tekenBikkel(ctx, b));
    tekenHand(ctx);
    tekenVeeg(ctx);
    const balHoog = bal && bal.h > 0.02;
    if (bal && !balHoog) tekenBal(ctx);
    hoog.filter((b) => !balHoog || b.h <= bal.h).forEach((b) => tekenBikkel(ctx, b));
    if (balHoog) tekenBal(ctx);
    if (balHoog) hoog.filter((b) => b.h > bal.h).forEach((b) => tekenBikkel(ctx, b));
    tekenDeeltjes(ctx, t);
    tekenTrek(ctx);
  }

  // ============================================================
  // ANIMATIES
  // ============================================================
  function anim(duur, stap) {
    return new Promise((klaar) => {
      const a = { t0: nu(), duur: Math.max(1, rustig() ? Math.min(duur, 90) : duur / tempo), stap, klaar };
      anims.push(a);
      stap(0);
    });
  }
  function spoelAnims() {
    const l = anims; anims = [];
    l.forEach((a) => { try { a.stap(1); } catch (e) { /* */ } a.klaar(); });
  }
  const zacht = (u) => 1 - Math.pow(1 - u, 2.2);
  const inUit = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  function wachtTot(test, max) {
    return new Promise((klaar) => {
      const t0 = nu();
      const kijk = () => { if (test() || nu() - t0 > max) klaar(); else setTimeout(kijk, 30); };
      kijk();
    });
  }
  function wachtOpLes() {
    return new Promise((klaar) => {
      const l = document.getElementById('les');
      if (!l || l.hidden) { klaar(); return; }
      const mo = new MutationObserver(() => { if (l.hidden) { mo.disconnect(); setTimeout(klaar, 250); } });
      mo.observe(l, { attributes: true, attributeFilter: ['hidden'] });
    });
  }
  // een bikkel vliegt in een boogje naar een plek
  function vlieg(b, doel, duur, hoogte, opties) {
    const o = opties || {};
    const van = [b.x, b.y], h0 = b.h || 0, hoek0 = b.hoek;
    let dh = (doel.hoek === undefined ? hoek0 : doel.hoek) - hoek0;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    b.vliegt = true;
    return anim(duur, (u) => {
      const e = inUit(u);
      b.x = van[0] + (doel.x - van[0]) * e; b.y = van[1] + (doel.y - van[1]) * e;
      b.h = h0 * (1 - u) + hoogte * 4 * u * (1 - u);
      b.hoek = hoek0 + dh * e;
      if (u >= 1) { b.h = 0; b.vliegt = false; if (o.klaar) o.klaar(); }
    });
  }

  // ============================================================
  // DE LUS
  // ============================================================
  function lus(t) {
    raf = requestAnimationFrame(lus);
    const dt = vorigeT ? Math.min(0.05, (t - vorigeT) / 1000) : 0;
    vorigeT = t;
    for (const a of anims.slice()) {
      const u = Math.min(1, (t - a.t0) / a.duur);
      a.stap(u);
      if (u >= 1) { const i = anims.indexOf(a); if (i >= 0) anims.splice(i, 1); a.klaar(); }
    }
    if (worp && !worp.rust) balVlucht(dt);
    if (bal) {
      if (bal.plet > 0) bal.plet = Math.max(0, bal.plet - dt * 9);
      const wenk = fase === 'opgooien' && mens(aan) ? 1 : (worp && worp.mens && worp.actie && kanVangen() ? 0.9 : 0);
      bal.wenk += (wenk - bal.wenk) * Math.min(1, dt * 10);
    }
    bikkels.forEach((b) => { if (b.wiebel > 0) b.wiebel = Math.max(0, b.wiebel - dt * 2.2); });
    teken();
  }

  // ============================================================
  // DE BAL
  // ============================================================
  function gooiBal(z, isMens) {
    const van = [bal.x, bal.y], v = voor(z);
    const land = [klem(van[0] + (rnd() - 0.5) * 64, 60, B - 60), van[1] + v * (80 + rnd() * 34)];
    const na = [land[0] + (land[0] - van[0]) * 0.5, land[1] + (land[1] - van[1]) * 0.42];
    let los;
    const einde = new Promise((r) => { los = r; });
    worp = { van, land, na, tijd: 0, zijde: z, mens: isMens, actie: null, klaar: false, gevangen: false, gevallen: false, geenVangst: false, rust: false, stuit1: false, stuit2: false, versnel: 1, los, einde };
    Geluid.woesj();
    if (isMens) { fase = 'vlucht'; werkKaartenBij(); }
    return worp;
  }
  const kanVangen = () => !!worp && !worp.klaar && !worp.geenVangst && worp.tijd > T1 && worp.tijd < T1 + T2 + SPEL;
  function balVlucht(dt) {
    const w = worp;
    w.tijd += dt * (w.mens ? 1 : tempo) * w.versnel;
    const tt = w.tijd;
    let p, h;
    if (tt < T1) {
      const u = tt / T1;
      p = [w.van[0] + (w.land[0] - w.van[0]) * u, w.van[1] + (w.land[1] - w.van[1]) * u]; h = 4 * u * (1 - u);
    } else if (tt < T1 + T2) {
      if (!w.stuit1) { w.stuit1 = true; stuit(w.land, 0.85); }
      const u = (tt - T1) / T2;
      p = [w.land[0] + (w.na[0] - w.land[0]) * u, w.land[1] + (w.na[1] - w.land[1]) * u]; h = E * E * 4 * u * (1 - u);
    } else {
      if (!w.stuit2) { w.stuit2 = true; stuit(w.na, 0.55); }
      if (tt >= T1 + T2 + SPEL && !w.gevallen) {
        w.gevallen = true;
        if (!w.klaar) { w.klaar = true; w.los('gevallen'); if (!w.geenVangst) fout('mis', null); }
      }
      // na de tweede stuit rolt hij nog een stukje door
      const u = tt - T1 - T2, dir = [w.na[0] - w.land[0], w.na[1] - w.land[1]];
      const rol = (1 - Math.exp(-u * 2.6)) * 0.9;
      p = [w.na[0] + dir[0] * rol, w.na[1] + dir[1] * rol];
      h = Math.pow(E, 4) * Math.abs(Math.sin(u * 9)) * Math.exp(-u * 5);
      if (u > 1.1) w.rust = true;
    }
    p[0] = klem(p[0], 16, B - 16); p[1] = klem(p[1], 16, L - 16);
    bal.x = p[0]; bal.y = p[1]; bal.h = h;
    bal.spin += dt * 7 * (w.mens ? 1 : tempo) * (tt < T1 + T2 ? 1 : 0.4);
  }
  function stuit(p, kracht) {
    Geluid.stuit(kracht);
    bal.plet = 1;
    stof(p[0], p[1], 5, kracht);
  }
  function vang() {
    const w = worp;
    if (!w || w.klaar || w.geenVangst) return false;
    w.klaar = true; w.gevangen = true;
    const doel = balRust(w.zijde), van = [bal.x, bal.y], h0 = bal.h;
    Geluid.vang();
    if (w.mens && window.Tril) Tril.klik();
    ring(bal.x, bal.y);
    w.rust = true;
    anim(230, (u) => {
      const e = zacht(u);
      bal.x = van[0] + (doel[0] - van[0]) * e; bal.y = van[1] + (doel[1] - van[1]) * e;
      bal.h = h0 * (1 - u) + 0.22 * Math.sin(Math.PI * u);
      if (u >= 1) bal.h = 0;
    });
    w.los('gevangen');
    if (w.mens) {
      worp = null;
      if (!w.actie) { fase = 'opgooien'; werkKaartenBij(); }
      else naGoedeWorp();
    }
    return true;
  }

  // ============================================================
  // BIKKELS GOOIEN, PAKKEN EN DRAAIEN
  // ============================================================
  // hoe hard en welke kant op: midden en wijdte van de worp
  function strooiWorp(z, t) {
    let s = 0.45, zij = 0;
    if (t) {
      const d = [t.naar[0] - t.van[0], t.naar[1] - t.van[1]], vooruit = d[1] * voor(z), len = Math.hypot(d[0], d[1]);
      if (len >= 12 && vooruit >= 6) { s = klem((vooruit - 12) / 190, 0, 1); zij = klem(d[0] / Math.max(40, vooruit), -1, 1); }
    }
    return strooiMaat(z, s, zij);
  }
  function strooiMaat(z, s, zij) {
    const m = handMidden(z);
    const ver = Math.min(120 + 120 * s, (L - 2 * ZONE) / 2 + 40);
    const midden = [klem(B / 2 + zij * 70, 70, B - 70), klem(m[1] + voor(z) * ver, ZONE + 40, L - ZONE - 40)];
    return { s, zij, midden, straal: 26 + 92 * s };
  }
  function strooiPlekken(maat) {
    const { midden, straal } = maat;
    const p = [0, 1, 2, 3].map(() => {
      const a = rnd() * Math.PI * 2, d = straal * Math.sqrt(rnd());
      return [midden[0] + Math.cos(a) * d, midden[1] + Math.sin(a) * d * 0.9];
    });
    // ze duwen elkaar een beetje opzij: bikkels liggen nooit op elkaar
    for (let n = 0; n < 40; n++) {
      let bots = false;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1], d = Math.hypot(dx, dy) || 0.01;
        if (d < MIN_AF) {
          bots = true;
          const f = (MIN_AF - d) / 2 + 0.4, ux = dx / d, uy = dy / d;
          p[i][0] -= ux * f; p[i][1] -= uy * f; p[j][0] += ux * f; p[j][1] += uy * f;
        }
      }
      p.forEach((q) => { q[0] = klem(q[0], 34, B - 34); q[1] = klem(q[1], ZONE + 18, L - ZONE - 18); });
      if (!bots) break;
    }
    return p;
  }
  async function strooi(z, maat) {
    const id = spelId;
    fase = 'strooit';
    werkKaartenBij();
    const doelen = strooiPlekken(maat), kanten = bikkels.map(() => valKant());
    Geluid.woesj();
    await Promise.all(bikkels.map((b, i) => vliegUit(b, doelen[i], kanten[i], i * 45, maat.s)));
    if (id !== spelId) return false;
    const f = figuur();
    draaien = !!f.kant && !alleOp(f.kant);
    fase = mens(aan) ? 'opgooien' : 'computer';
    werkKaartenBij();
    return true;
  }
  function vliegUit(b, doel, kant, vertraging, s) {
    return wacht(vertraging).then(() => {
      const van = [b.x, b.y], h0 = b.h || 0, hoek0 = b.hoek, hoek1 = rnd() * Math.PI * 2;
      const draai = (b.i % 2 ? 1 : -1) * (4 + b.i), duur = 430 + 170 * s + rnd() * 70;
      const glij = [(doel[0] - van[0]) * 0.06, (doel[1] - van[1]) * 0.06];
      const kantLijst = [b.kant, KANTEN[(b.i + 1) % 4], KANTEN[(b.i + 2) % 4], KANTEN[(b.i + 3) % 4], kant];
      let geland = false;
      b.waar = 'vloer'; b.vliegt = true;
      return anim(duur, (u) => {
        if (u < 0.8) {
          const v = u / 0.8, e = zacht(v);
          b.x = van[0] + (doel[0] - glij[0] - van[0]) * e; b.y = van[1] + (doel[1] - glij[1] - van[1]) * e;
          b.h = h0 * (1 - v) + (0.5 + 0.35 * s) * 4 * v * (1 - v);
          b.hoek = hoek0 + (hoek1 + draai - hoek0) * e;
          b.kant = kantLijst[Math.min(4, Math.floor(v * 5))];
        } else {
          if (!geland) { geland = true; b.kant = kant; Geluid.bikkel(0.5 + 0.4 * s); stof(b.x, b.y, 4, 0.7); }
          const v = (u - 0.8) / 0.2;
          b.x = doel[0] - glij[0] * (1 - v); b.y = doel[1] - glij[1] * (1 - v);
          b.h = 0.06 * Math.sin(Math.PI * v);
          b.hoek = hoek1 + draai;
        }
        if (u >= 1) { b.x = doel[0]; b.y = doel[1]; b.h = 0; b.kant = kant; b.vliegt = false; b.hoek = (hoek1 + draai) % (Math.PI * 2); }
      });
    });
  }
  function vrijSlot(z) {
    for (let i = 0; i < 4; i++) if (!bikkels.some((b) => b.waar === 'hand' && b.zijde === z && b.slot === i)) return i;
    return 0;
  }
  function pakOp(lijst, z) {
    Geluid.pak();
    if (mens(aan) && window.Tril) Tril.tik();
    lijst.forEach((b, j) => {
      const s = vrijSlot(z);
      b.waar = 'hand'; b.zijde = z; b.slot = s; b.gloed = 0;
      const doel = slot(z, s);
      setTimeout(() => Geluid.bikkel(0.35), 120 + j * 40);
      vlieg(b, doel, 260 + j * 40, 0.4);
    });
  }
  function draaiOm(b, kant) {
    Geluid.bikkel(0.45);
    if (mens(aan) && window.Tril) Tril.tik();
    const hoek0 = b.hoek, dh = (rnd() - 0.5) * 0.8;
    let gedraaid = false;
    b.vliegt = true;
    return anim(300, (u) => {
      b.h = 0.24 * Math.sin(Math.PI * u);
      b.flip = Math.cos(Math.PI * u);
      if (!gedraaid && u >= 0.5) { gedraaid = true; b.kant = kant; }
      b.hoek = hoek0 + dh * u;
      if (u >= 1) { b.flip = 1; b.h = 0; b.kant = kant; b.vliegt = false; }
    });
  }
  function wiebel(b) { if (b) b.wiebel = 1; }
  // de bikkel die het dichtst bij een punt ligt
  function bikkelBij(p, straal) {
    let beste = null, d0 = straal;
    opVloer().forEach((b) => { const d = afst(p, plek(b)); if (d < d0 && !b.vliegt) { d0 = d; beste = b; } });
    return beste;
  }
  // wat mag je in één keer pakken: true, of wat er mis is
  function magPakken(n) {
    const f = figuur(), op = opVloer().length;
    let nodig;
    if (f.kant) nodig = [op];
    else if (f.n === 3 && op === 4) nodig = [1, 3];
    else if (f.n === 3) nodig = [op];
    else nodig = [f.n];
    if (nodig.includes(n)) return true;
    if (n > Math.max(...nodig)) return 'teveel';
    if (n < Math.min(...nodig)) return 'teweinig';
    return 'drieofeen';
  }
  // na een goede worp: is het figuur klaar?
  function naGoedeWorp() {
    const f = figuur();
    if (f.kant && draaien) {
      if (alleOp(f.kant)) {
        draaien = false;
        const m = middenVanVloer();
        pop(m, `Alle vier ${KANTNAAM[f.kant]}!`, 'serie');
        Geluid.fluit();
      }
    } else if (!opVloer().length) {
      figuurGehaald();
      return 'klaar';
    }
    if (mens(aan)) fase = 'opgooien';
    werkKaartenBij();
    return 'verder';
  }
  function middenVanVloer() {
    const v = opVloer();
    if (!v.length) return [B / 2, L / 2];
    return [v.reduce((s, b) => s + b.x, 0) / v.length, v.reduce((s, b) => s + b.y, 0) / v.length - 24];
  }

  // ============================================================
  // DE BEURT VAN EEN MENS
  // ============================================================
  function neer(e) {
    if (fase === 'klaar' || fase === 'les' || lesOpen() || !spelers.length) return;
    const p = naarVeld(e.clientX, e.clientY);
    if (!mens(aan)) {
      // de tegenspeelster is bezig: een tik laat haar sneller spelen
      if (fase !== 'fout' && tempo < 3) { tempo = 3; werkKaartenBij(); }
      return;
    }
    try { doek.setPointerCapture(e.pointerId); } catch (er) { /* */ }
    if (fase === 'gooien') { trek = { van: p, naar: p, id: e.pointerId }; return; }
    if (fase === 'opgooien') {
      if (afst(p, [bal.x, bal.y]) < 70 || Math.abs(p[1] - handMidden(zijdeVan(aan))[1]) < ZONE * 0.75) gooiBal(zijdeVan(aan), true);
      return;
    }
    if (fase !== 'vlucht' || !worp || worp.klaar) return;
    const rB = BAL_R * (1 + 0.85 * bal.h) + 22;
    const opBal = afst(p, [bal.x, bal.y]) < rB, opBikkel = bikkelBij(p, TIK_R);
    if (opBal && kanVangen() && (worp.actie || !opBikkel)) { vang(); return; }
    if (opBal && !opBikkel && !kanVangen() && worp.tijd < T1) { if (hintStuit++ < 3) pop([bal.x, bal.y - 26], 'Eerst laten stuiten', 'zacht'); return; }
    veeg = { punten: [p], geraakt: new Set(), id: e.pointerId };
    raakLangs(p);
  }
  function beweeg(e) {
    if (trek && e.pointerId === trek.id) { trek.naar = naarVeld(e.clientX, e.clientY); return; }
    if (!veeg || e.pointerId !== veeg.id) return;
    const p = naarVeld(e.clientX, e.clientY), q = veeg.punten[veeg.punten.length - 1];
    const d = afst(p, q), n = Math.ceil(d / 4);
    for (let i = 1; i <= n; i++) raakLangs([q[0] + (p[0] - q[0]) * i / n, q[1] + (p[1] - q[1]) * i / n]);
    veeg.punten.push(p);
  }
  function los(e) {
    if (trek && e.pointerId === trek.id) {
      const t = trek; trek = null;
      if (fase === 'gooien' && mens(aan)) strooi(zijdeVan(aan), strooiWorp(zijdeVan(aan), t));
      return;
    }
    if (veeg && e.pointerId === veeg.id) { const v = veeg; veeg = null; grijp(v); }
  }
  function raakLangs(p) {
    opVloer().forEach((b) => { if (!b.vliegt && afst(p, plek(b)) < RAAK && !veeg.geraakt.has(b)) { veeg.geraakt.add(b); b.gloed = 1; if (Geluid.tik) Geluid.tik(); } });
  }
  function padLengte(pp) { let s = 0; for (let i = 1; i < pp.length; i++) s += afst(pp[i], pp[i - 1]); return s; }
  function grijp(v) {
    bikkels.forEach((b) => { b.gloed = 0; });
    if (fase !== 'vlucht' || !worp || worp.klaar) return;
    let lijst;
    if (v.toets) lijst = Array.from(v.geraakt);
    else if (padLengte(v.punten) < 10) { const b = bikkelBij(v.punten[v.punten.length - 1], TIK_R); lijst = b ? [b] : []; }
    else lijst = Array.from(v.geraakt);
    if (!lijst.length) return;
    if (worp.actie) { fout('dubbel', lijst[0]); return; }
    const f = figuur();
    if (f.kant && draaien) {
      if (lijst.length > 1) { fout('geraakt', lijst[1]); return; }
      const b = lijst[0];
      if (b.kant === f.kant) { wiebel(b); return; }
      worp.actie = 'gedraaid';
      draaiOm(b, f.kant);
      werkKaartenBij();
      return;
    }
    const mag = magPakken(lijst.length);
    if (mag !== true) { fout(mag, lijst[lijst.length - 1]); return; }
    worp.actie = 'gepakt';
    pakOp(lijst, zijdeVan(aan));
    werkKaartenBij();
  }
  function toets(e) {
    if (!mens(aan) || lesOpen()) return;
    const spatie = e.key === ' ' || e.key === 'Enter';
    if (fase === 'gooien' && spatie) { e.preventDefault(); strooi(zijdeVan(aan), strooiMaat(zijdeVan(aan), 0.45, 0)); return; }
    if (fase === 'opgooien' && spatie) { e.preventDefault(); gooiBal(zijdeVan(aan), true); return; }
    if (fase !== 'vlucht') return;
    if (spatie) { e.preventDefault(); if (kanVangen()) vang(); return; }
    if (/^[1-4]$/.test(e.key)) {
      // de bikkels van links naar rechts genummerd; snel na elkaar is in één keer
      const lijst = opVloer().sort((a, b) => naarScherm(a.x, a.y)[0] - naarScherm(b.x, b.y)[0]);
      const b = lijst[+e.key - 1];
      if (!b) return;
      if (!toetsKeuze) toetsKeuze = { geraakt: new Set(), timer: 0 };
      toetsKeuze.geraakt.add(b); b.gloed = 1;
      clearTimeout(toetsKeuze.timer);
      toetsKeuze.timer = setTimeout(() => { const k = toetsKeuze; toetsKeuze = null; grijp({ toets: true, geraakt: k.geraakt, punten: [] }); }, 380);
    }
  }

  // ============================================================
  // FOUTEN, BEURTEN EN FIGUREN
  // ============================================================
  async function fout(soort, waar) {
    if (fase === 'fout' || fase === 'klaar' || fase === 'wissel') return;
    const id = spelId;
    fase = 'fout';
    if (worp) { worp.geenVangst = true; worp.versnel = 1.8; }
    const p = waar ? plek(waar) : (worp ? worp.na : [bal.x, bal.y]);
    pop([p[0], p[1] - 22], FOUT[soort], 'fout');
    if (waar) wiebel(waar);
    Geluid.jammer();
    if (mens(aan) && window.Tril) Tril.fout();
    meld(`${naamVan(aan)}: ${FOUT[soort]}`);
    const ander = 1 - aan;
    if (spelers[aan].t) zeg(aan, 'mis'); else if (spelers[ander] && spelers[ander].t) setTimeout(() => zeg(ander, 'jouw'), 500);
    naarWissel = ander;
    werkKaartenBij();
    await wachtTot(() => !worp || worp.rust || worp.gevangen, 2600);
    await wacht(450);
    if (id !== spelId) return;
    wissel(ander);
  }
  async function wissel(k) {
    const id = spelId;
    fase = 'wissel';
    naarWissel = -1;
    aan = k;
    draaien = false; worp = null; tempo = 1; hand = null;
    bewaar();
    werkKaartenBij();
    await verzamel();
    if (id !== spelId) return;
    beginBeurt();
  }
  // alle bikkels en de bal gaan naar wie aan de beurt is
  async function verzamel() {
    const z = zijdeVan(aan);
    achter = null;
    const doel = balRust(z), van = [bal.x, bal.y];
    const balAnim = anim(520, (u) => { const e = inUit(u); bal.x = van[0] + (doel[0] - van[0]) * e; bal.y = van[1] + (doel[1] - van[1]) * e; bal.h = 0.25 * Math.sin(Math.PI * u); if (u >= 1) bal.h = 0; });
    const lijst = bikkels.map((b, i) => {
      const s = slot(z, i);
      b.waar = 'hand'; b.zijde = z; b.slot = i; b.gloed = 0; b.flip = 1;
      return wacht(i * 50).then(() => vlieg(b, s, 520, 0.45));
    });
    await Promise.all(lijst.concat([balAnim]));
  }
  function beginBeurt() {
    const p = spelers[aan];
    worp = null; draaien = false; veeg = null; trek = null; hand = null;
    if (!p) return;
    banier(figuur().naam, p.naam);
    bewaar();
    if (p.mens) { fase = 'gooien'; tempo = 1; werkKaartenBij(); }
    else computerBeurt();
  }
  async function figuurGehaald() {
    const id = spelId, p = spelers[aan], f = figuur();
    p.fig++;
    fase = 'tussen';
    Geluid.fluit();
    if (p.mens && window.Tril) Tril.succes();
    vonken(10);
    pop(middenVanHand(), f.naam + '!', 'serie');
    werkKaartenBij();
    bewaar();
    if (p.t && rnd() < 0.5) zeg(aan, 'goed');
    if (p.fig >= FIGUREN.length) { await wacht(700); if (id === spelId) einde(aan); return; }
    await wacht(950);
    if (id !== spelId) return;
    banier(figuur().naam, p.naam);
    if (p.mens) { fase = 'gooien'; werkKaartenBij(); }
    else { fase = 'computer'; werkKaartenBij(); }
  }
  const middenVanHand = () => { const m = handMidden(zijdeVan(aan)); return [m[0], m[1] + voor(zijdeVan(aan)) * 70]; };

  function nieuwSpel() {
    spelId++;
    spoelAnims();
    tempo = 1; winnaar = -1; herstart = null; naarWissel = -1;
    worp = null; veeg = null; trek = null; hand = null; draaien = false;
    if (tegen) spelers = [{ naam: 'Jij', mens: true, fig: 0 }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, fig: 0 }];
    else spelers = [{ naam: 'Speler 1', mens: true, fig: 0 }, { naam: 'Speler 2', mens: true, fig: 0 }];
    aan = potjes % 2;
    potjes++;
    achter = null;
    ui.uitslag.hidden = true;
    const z = zijdeVan(aan);
    bikkels.forEach((b, i) => { const s = slot(z, i); Object.assign(b, { x: s.x, y: s.y, hoek: s.hoek, waar: 'hand', zijde: z, slot: i, h: 0, flip: 1, gloed: 0, wiebel: 0, vliegt: false }); });
    const r = balRust(z);
    Object.assign(bal, { x: r[0], y: r[1], h: 0, plet: 0 });
    if (tegen) setTimeout(() => zeg(1, 'start'), 400);
    meld(tegen ? `Nieuw spel tegen ${tegen.naam}.` : 'Nieuw spel met z\'n tweeën.');
    bewaar();
    beginBeurt();
  }
  function einde(w) {
    fase = 'klaar'; winnaar = w;
    worp = null; hand = null;
    werkKaartenBij();
    wis();
    let bedrag, tekst, verder = null, gewonnenSpel = false;
    if (!tegen) {
      bedrag = 20; gewonnenSpel = true; tekst = `${naamVan(w)} wint!`;
      banier(`${naamVan(w)} wint!`, 'alle acht figuren');
      Geluid.tada(); vonken(30);
    } else if (w === 0) {
      const telling = gewonnen(), eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('bik-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true; tekst = `Gewonnen van ${tegen.naam}!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} is vrij!`;
        verder = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('bik-tegen', volgende.id); nieuwSpel(); } };
      }
      banier('Gewonnen!', 'alle acht figuren');
      Geluid.tada(); vonken(40);
      if (window.Tril) Tril.succes();
      zeg(1, 'verliest');
    } else {
      bedrag = 10; tekst = `${tegen.naam} won. Goed geprobeerd!`;
      banier(`${tegen.naam} wint`, 'alle acht figuren');
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'bikkelen', bedrag, gewonnen: gewonnenSpel, tekst, verder, wacht: 2400 });
    setTimeout(() => {
      if (fase !== 'klaar' || !ui.uitslag) return;
      ui.uitslag.innerHTML = `<b>${tegen ? (w === 0 ? 'Gewonnen!' : 'Volgende keer beter') : `${naamVan(w)} wint!`}</b><span>Nog een keer bikkelen?</span><button class="knop bk-weer" type="button">${icoon('opnieuw')}Nog een keer</button>`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.bk-weer').addEventListener('click', () => nieuwSpel());
    }, 2200);
  }

  // ============================================================
  // DE TEGENSPEELSTER
  // ============================================================
  // hoe ver liggen de bikkels van de andere bikkels af (de ruimte om te pakken)
  function afstandTotPad(q, pad) {
    if (pad.length === 1) return afst(q, pad[0]);
    let m = Infinity;
    for (let i = 1; i < pad.length; i++) {
      const a = pad[i - 1], b = pad[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
      const u = klem(((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2, 0, 1);
      m = Math.min(m, Math.hypot(q[0] - a[0] - u * dx, q[1] - a[1] - u * dy));
    }
    return m;
  }
  function volgordes(l) {
    if (l.length <= 1) return [l];
    const uit = [];
    l.forEach((x, i) => volgordes(l.slice(0, i).concat(l.slice(i + 1))).forEach((r) => uit.push([x].concat(r))));
    return uit;
  }
  function groepen(l, k) {
    if (k === 0) return [[]];
    if (l.length < k) return [];
    const [eerste, ...rest] = l;
    return groepen(rest, k - 1).map((g) => [eerste].concat(g)).concat(groepen(rest, k));
  }
  // de kans dat een greep lukt: hoe meer bikkels, hoe verder uit elkaar en hoe dichter een andere erbij, hoe lastiger
  function beoordeelGroep(groep, vloer, t) {
    let beste = null;
    for (const v of volgordes(groep)) {
      const pad = v.map(plek), lengte = padLengte(pad);
      if (!beste || lengte < beste.lengte) beste = { volgorde: v, pad, lengte };
    }
    let drukte = 0;
    vloer.forEach((b) => { if (!groep.includes(b)) drukte += Math.max(0, 1 - afstandTotPad(plek(b), beste.pad) / 46) * 1.3; });
    const moeite = 1 + 0.55 * (groep.length - 1) + beste.lengte / 170 + drukte;
    return { lijst: beste.volgorde, kans: Math.pow(t.greep, moeite), drukte };
  }
  function aiPlan(t, vloer, f, nogDraaien) {
    if (f.kant && nogDraaien && vloer.some((b) => b.kant !== f.kant)) {
      const kand = vloer.filter((b) => b.kant !== f.kant);
      let beste = null;
      kand.forEach((b) => {
        let drukte = 0;
        vloer.forEach((o) => { if (o !== b) drukte += Math.max(0, 1 - afst(plek(o), plek(b)) / 46) * 1.3; });
        const smal = f.kant === 'rug' || f.kant === 's';
        const kans = Math.pow(t.draai, 1 + (smal ? 0.7 : 0) + drukte);
        if (!beste || kans > beste.kans) beste = { soort: 'draai', lijst: [b], kans, kant: f.kant };
      });
      return beste;
    }
    let ns;
    if (f.kant) ns = [vloer.length];
    else if (f.n === 3 && vloer.length === 4) ns = [1, 3];
    else if (f.n === 3) ns = [vloer.length];
    else ns = [f.n];
    let beste = null;
    ns.forEach((n) => groepen(vloer, n).forEach((g) => {
      const o = beoordeelGroep(g, vloer, t);
      // bij drieën: eerst één pakken laat er drie liggen die je daarna nog moet halen
      let waarde = o.kans;
      if (f.n === 3 && vloer.length === 4) {
        const rest = vloer.filter((b) => !g.includes(b));
        waarde *= beoordeelGroep(rest, rest, t).kans;
      }
      if (!beste || waarde > beste.waarde) beste = { soort: 'pak', lijst: o.lijst, kans: o.kans, waarde };
    }));
    return beste;
  }
  function aiUitkomst(t, plan) {
    if (rnd() > plan.kans) return plan.soort === 'draai' ? 'geraakt' : (rnd() < 0.6 ? 'teveel' : 'teweinig');
    if (rnd() > t.vang) return 'mis';
    return 'goed';
  }
  function kiesKracht(t, f) {
    const ideaal = f.kant ? 0.62 : ({ 1: 0.55, 2: 0.28, 3: 0.22, 4: 0.08 })[f.n];
    return klem(ideaal + gauss() * 0.28 * (1 - t.strooi) + gauss() * 0.04, 0, 1);
  }
  function handNaar(p, duur) {
    if (!hand) { const m = handMidden(zijdeVan(aan)); hand = { x: m[0], y: m[1], a: 0 }; }
    const van = [hand.x, hand.y], a0 = hand.a;
    return anim(duur, (u) => { const e = inUit(u); hand.x = van[0] + (p[0] - van[0]) * e; hand.y = van[1] + (p[1] - van[1]) * e; hand.a = a0 + (1 - a0) * Math.min(1, u * 2); });
  }
  async function handLangs(punten, duur) {
    for (const p of punten) await handNaar(p, duur / Math.max(1, punten.length));
  }
  async function computerBeurt() {
    const id = spelId, p = spelers[aan], t = p.t;
    fase = 'computer'; tempo = 1;
    werkKaartenBij();
    await wacht(650);
    await wachtOpLes();
    if (id !== spelId) return;
    for (;;) {
      const f = figuur();
      // eerst de banier laten verdwijnen: die staat midden op de stoep
      await wachtTot(() => id !== spelId || !ui.vak.querySelector('.sj-banier'), 2200);
      if (id !== spelId) return;
      const ok = await strooi(zijdeVan(aan), strooiMaat(zijdeVan(aan), kiesKracht(t, f), klem(gauss() * 0.25, -0.6, 0.6)));
      if (!ok || id !== spelId) return;
      await wacht(380 * t.rust);
      for (;;) {
        await wachtOpLes();
        if (id !== spelId) return;
        const plan = aiPlan(t, opVloer(), f, draaien);
        if (!plan) { if (!opVloer().length && naGoedeWorp() === 'klaar') break; return; }
        const uitkomst = aiUitkomst(t, plan);
        const r = await aiWorp(plan, uitkomst, t);
        if (id !== spelId || r !== 'goed') return;
        if (naGoedeWorp() === 'klaar') break;
        await wacht(260 * t.rust);
      }
      // het figuur is gehaald: figuurGehaald loopt, wacht tot die klaar is
      await wachtTot(() => id !== spelId || fase === 'computer' || fase === 'klaar', 4000);
      if (id !== spelId || fase === 'klaar') return;
      await wacht(300 * t.rust);
    }
  }
  async function aiWorp(plan, uitkomst, t) {
    const id = spelId, z = zijdeVan(aan);
    const w = gooiBal(z, false);
    werkKaartenBij();
    const eerste = plek(plan.lijst[0]);
    await handNaar(eerste, 300 * t.rust);
    // ze pakt terwijl de bal omhoog gaat
    const pakOpTijd = 0.28 + rnd() * 0.22 * t.rust;
    await wachtTot(() => id !== spelId || !worp || worp.tijd >= pakOpTijd, 3000);
    if (id !== spelId || worp !== w) return 'weg';
    if (plan.soort === 'draai') {
      if (uitkomst === 'geraakt') {
        const buur = opVloer().filter((b) => b !== plan.lijst[0]).sort((a, b) => afst(plek(a), eerste) - afst(plek(b), eerste))[0];
        if (buur) { await handNaar(plek(buur), 120); fout('geraakt', buur); return 'fout'; }
        uitkomst = 'mis';
      } else {
        w.actie = 'gedraaid';
        draaiOm(plan.lijst[0], plan.kant);
      }
    } else {
      let lijst = plan.lijst.slice();
      if (uitkomst === 'teveel') {
        const rest = opVloer().filter((b) => !lijst.includes(b));
        const laatste = plek(lijst[lijst.length - 1]);
        if (rest.length) lijst.push(rest.sort((a, b) => afst(plek(a), laatste) - afst(plek(b), laatste))[0]); else uitkomst = 'mis';
      } else if (uitkomst === 'teweinig') {
        if (lijst.length > 1) lijst = lijst.slice(0, -1); else uitkomst = 'mis';
      }
      await handLangs(lijst.map(plek), 110 * lijst.length * t.rust);
      if (id !== spelId || worp !== w) return 'weg';
      if (uitkomst === 'teveel' || uitkomst === 'teweinig') {
        lijst.forEach((b) => { b.gloed = 1; setTimeout(() => { b.gloed = 0; }, 500); });
        fout(uitkomst, lijst[lijst.length - 1]);
        return 'fout';
      }
      w.actie = 'gepakt';
      pakOp(lijst, z);
    }
    werkKaartenBij();
    if (uitkomst === 'mis') {
      // ze grijpt net mis
      const t0 = T1 + T2 * 0.6;
      await wachtTot(() => id !== spelId || !worp || worp.tijd >= t0, 3000);
      if (id !== spelId) return 'weg';
      handNaar([bal.x + 26, bal.y + 8], 160);
      await w.einde;
      return 'fout';
    }
    const vangOp = T1 + T2 * (0.12 + rnd() * 0.5);
    const naderen = vangOp - 0.16;
    await wachtTot(() => id !== spelId || !worp || worp.tijd >= naderen, 4000);
    if (id !== spelId || worp !== w) return 'weg';
    handNaar([bal.x, bal.y], 120);
    await wachtTot(() => id !== spelId || !worp || worp.tijd >= vangOp, 3000);
    if (id !== spelId || worp !== w) return 'weg';
    vang();
    worp = null;
    const m = handMidden(z);
    handNaar(m, 260).then(() => { if (hand) hand.a = 0; });
    return 'goed';
  }

  // Een heel spel in stilte, om de tegenspeelsters af te stemmen: wie haalt het eerst alle acht figuren?
  function simSpel(tA, tB, maxBeurten) {
    const oudL = L, oud = { bikkels, draaien };
    const spelersT = [tA, tB], fig = [0, 0];
    let beurt = 0, beurten = 0, worpen = 0;
    const vbikkels = [0, 1, 2, 3].map((i) => ({ i, x: 0, y: 0, hoek: 0, kant: 'bol', waar: 'hand' }));
    bikkels = vbikkels;
    try {
      while (beurten < (maxBeurten || 400)) {
        beurten++;
        const t = spelersT[beurt];
        let fout = false;
        while (!fout && fig[beurt] < FIGUREN.length) {
          const f = FIGUREN[fig[beurt]];
          bikkels.forEach((b) => { b.waar = 'hand'; });
          const plekken = strooiPlekken(strooiMaat(beurt, kiesKracht(t, f), klem(gauss() * 0.25, -0.6, 0.6)));
          bikkels.forEach((b, i) => { b.x = plekken[i][0]; b.y = plekken[i][1]; b.kant = valKant(); b.waar = 'vloer'; });
          let nogDraaien = !!f.kant && !bikkels.every((b) => b.kant === f.kant);
          for (;;) {
            const vloer = bikkels.filter((b) => b.waar === 'vloer');
            const plan = aiPlan(t, vloer, f, nogDraaien);
            worpen++;
            if (aiUitkomst(t, plan) !== 'goed') { fout = true; break; }
            if (plan.soort === 'draai') { plan.lijst[0].kant = f.kant; if (bikkels.every((b) => b.waar !== 'vloer' || b.kant === f.kant)) nogDraaien = false; }
            else plan.lijst.forEach((b) => { b.waar = 'hand'; });
            if (!bikkels.some((b) => b.waar === 'vloer')) break;
          }
          if (!fout) fig[beurt]++;
        }
        if (fig[beurt] >= FIGUREN.length) return { winnaar: beurt, beurten, worpen, fig };
        beurt = 1 - beurt;
      }
      return { winnaar: -1, beurten, worpen, fig };
    } finally {
      bikkels = oud.bikkels; draaien = oud.draaien; L = oudL;
    }
  }

  // ============================================================
  // WAT ER ONDERBROKEN WORDT (je gaat weg, of Gijs komt uitleggen)
  // ============================================================
  function onderbreek() {
    if (ui.vak) ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    if (!gebouwd || fase === 'klaar' || !spelers.length) return;
    spelId++;
    spoelAnims();
    hand = null; veeg = null; trek = null;
    bikkels.forEach((b) => { b.gloed = 0; b.vliegt = false; b.h = 0; b.flip = 1; });
    const w = worp;
    worp = null;
    if (naarWissel >= 0) { aan = naarWissel; naarWissel = -1; herstart = 'beurt'; }
    else if (!mens(aan) || fase === 'wissel' || fase === 'tussen' || fase === 'computer') herstart = 'beurt';
    else if (fase === 'strooit') { const f = figuur(); draaien = !!f.kant && !alleOp(f.kant); fase = 'opgooien'; }
    else if (fase === 'vlucht' && w) {
      // een halve worp telt niet als fout: wat je al pakte, blijft gepakt
      const f = figuur();
      if (w.actie) {
        if (f.kant && draaien) { if (alleOp(f.kant)) draaien = false; fase = 'opgooien'; }
        else if (!opVloer().length) { spelers[aan].fig++; herstart = spelers[aan].fig >= FIGUREN.length ? 'einde' : 'beurt'; }
        else fase = 'opgooien';
      } else fase = 'opgooien';
    }
    const z = zijdeVan(aan), r = balRust(herstart ? z : z);
    if (bal) { bal.x = r[0]; bal.y = r[1]; bal.h = 0; bal.plet = 0; }
    tempo = 1;
    werkKaartenBij();
  }
  async function hervat() {
    if (!gebouwd || lesOpen()) return;
    if (herstart === 'einde') { herstart = null; einde(aan); return; }
    if (herstart !== 'beurt') return;
    herstart = null;
    const id = spelId;
    fase = 'wissel';
    werkKaartenBij();
    await verzamel();
    if (id !== spelId) return;
    beginBeurt();
  }

  // ============================================================
  // HET SCHERM ERBOVEN: kaarten, ballonnetjes, banieren
  // ============================================================
  function hintVan(k) {
    const p = spelers[k];
    if (!p.mens) return tempo > 1 ? `${icoon('snel')}<span>Vlug</span>` : '<span class="mo-denk" aria-label="speelt"><i></i><i></i><i></i></span>';
    const f = figuur(k);
    if (fase === 'gooien') return `${icoon('pijl', 'bk-op')}<span>Gooi de bikkels</span>`;
    if (fase !== 'opgooien' && fase !== 'vlucht') return '';
    if (worp && worp.actie) return '<span>Vang de bal!</span>';
    if (f.kant && draaien) return `${glyph(f)}<span>Draai er een op ${KANTNAAM[f.kant]}</span>`;
    const op = opVloer().length;
    if (f.kant) return `${glyph(f)}<span>Pak ze alle vier</span>`;
    if (f.n === 3 && op === 4) return '<span>Pak er 3 of 1</span>';
    const n = f.n === 3 ? op : f.n;
    return `<span>Pak er ${n === 1 ? 'één' : n}</span>`;
  }
  function werkKaartenBij() {
    if (!ui.kaart || !spelers.length) return;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k], p = spelers[k];
      const actief = k === aan && fase !== 'klaar';
      kaart.classList.toggle('aan', actief);
      kaart.classList.toggle('bk-winnaar', fase === 'klaar' && winnaar === k);
      const gz = kaart.querySelector('.mo-gezicht'), nieuw = gezichtVan(k);
      if (gz.getAttribute('data-wie') !== (p.persoon || kleurVan(k))) { gz.innerHTML = nieuw; gz.setAttribute('data-wie', p.persoon || kleurVan(k)); }
      kaart.querySelector('.mo-naam').textContent = p.naam;
      kaart.querySelector('.bk-rij').innerHTML = rijVan(p.fig);
      const doe = kaart.querySelector('.mo-doe');
      const hint = actief ? hintVan(k) : '';
      if (doe.getAttribute('data-hint') !== hint) { doe.innerHTML = hint; doe.setAttribute('data-hint', hint); }
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-bikkel"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', `${tegen ? 'Tegenspeelster: ' + tegen.naam : 'Speler 2'}, ${p.fig} van de 8 figuren. Tik om te wisselen`);
      } else kaart.setAttribute('aria-label', `${p.naam}, ${p.fig} van de 8 figuren`);
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
    e.className = 'sj-pop bk-pop' + (soort ? ' ' + soort : '');
    e.textContent = tekst;
    const rv = ui.vak.getBoundingClientRect(), s = naarScherm(p[0], p[1]);
    e.style.left = klem(s[0] - rv.left, 60, rv.width - 60) + 'px';
    e.style.top = klem(s[1] - rv.top, 30, rv.height - 20) + 'px';
    ui.pops.appendChild(e);
    setTimeout(() => e.remove(), 1700);
  }
  function banier(titel, sub) {
    if (!ui.vak) return;
    ui.vak.querySelectorAll('.sj-banier').forEach((x) => x.remove());
    const b = document.createElement('div');
    b.className = 'sj-banier bk-banier';
    b.innerHTML = '<b></b><span></span>';
    b.querySelector('b').textContent = titel;
    b.querySelector('span').textContent = sub || '';
    ui.vak.appendChild(b);
    setTimeout(() => b.remove(), 1800);
  }
  function vonken(aantal) {
    if (rustig() || !ui.pops) return;
    const rr = ui.vak.getBoundingClientRect();
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (rr.width * Math.random()) + 'px';
      v.style.top = (rr.height * (0.1 + Math.random() * 0.6)) + 'px';
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
      const pips = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-bikkel"/></svg>`).join('')}</span>`;
      const gezichtje = t === TWEE ? `<span class="mo-twee">${gezicht('rood')}${gezicht('blauw')}</span>` : (window.Personen ? Personen.gezicht[t.id] : '');
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
        if (window.Duiten) Duiten.zetVeld('bik-tegen', t.id);
        sluitMenu();
        nieuwSpel();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // BEWAREN: weg en terug, dan ga je verder bij hetzelfde figuur
  // ============================================================
  function bewaar() {
    if (!spelers.length || fase === 'klaar') return;
    try { localStorage.setItem(OPSLAG, JSON.stringify({ tegen: tegen ? tegen.id : 'twee', fig: spelers.map((p) => p.fig), aan: naarWissel >= 0 ? naarWissel : aan, potjes })); } catch (e) { /* */ }
  }
  function wis() { try { localStorage.removeItem(OPSLAG); } catch (e) { /* */ } }
  function laad() {
    try {
      const o = JSON.parse(localStorage.getItem(OPSLAG) || 'null');
      if (!o || !Array.isArray(o.fig) || o.fig.length !== 2) return null;
      if (o.fig.some((f) => typeof f !== 'number' || f < 0 || f >= FIGUREN.length)) return null;
      return o;
    } catch (e) { return null; }
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function lesDemo(soort) {
    if (!gebouwd || soort === lesSoort) return;
    if (!lesSoort && soort) onderbreek();
    if (!lesSoort && soort) lesBewaard = { bikkels: bikkels.map((b) => Object.assign({}, b)), bal: Object.assign({}, bal), fase, draaien };
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) {
        lesBewaard.bikkels.forEach((o, i) => Object.assign(bikkels[i], o));
        Object.assign(bal, lesBewaard.bal);
        fase = lesBewaard.fase; draaien = lesBewaard.draaien;
        lesBewaard = null;
        werkKaartenBij();
      }
      return;
    }
    fase = 'les';
    const m = [B / 2, L / 2];
    const zet = (i, x, y, hoek, kant, waar) => Object.assign(bikkels[i], { x, y, hoek, kant, waar: waar || 'vloer', h: 0, flip: 1, gloed: 0, wiebel: 0, vliegt: false });
    const inHand = (i) => { const s = slot(0, i); zet(i, s.x, s.y, s.hoek, bikkels[i].kant, 'hand'); bikkels[i].zijde = 0; bikkels[i].slot = i; };
    const r = balRust(0);
    Object.assign(bal, { x: r[0], y: r[1], h: 0, plet: 0 });
    if (soort === 'kanten') KANTEN.forEach((k, i) => zet(i, B / 2 - 108 + i * 72, m[1], 0, k));
    else if (soort === 'gooi') [0, 1, 2, 3].forEach(inHand);
    else {
      const leg = [[-72, -34, 0.4, 'bol'], [44, -66, -0.8, 'hol'], [96, 20, 1.9, 'rug'], [-26, 44, -2.2, 'bol']];
      leg.forEach(([dx, dy, h, k], i) => zet(i, m[0] + dx, m[1] + dy, h, k));
      if (soort === 'pak') { Object.assign(bal, { x: B / 2 + 8, y: L - 54 - 50, h: 0.85 }); bikkels[0].gloed = 1; }
      if (soort === 'vang') { inHand(0); Object.assign(bal, { x: B / 2 + 20, y: L - 54 - 104, h: 0.16 }); }
      if (soort === 'twee') { zet(3, m[0] - 36, m[1] - 8, -1.2, 'hol'); Object.assign(bal, { x: B / 2 - 6, y: L - 54 - 48, h: 0.8 }); bikkels[0].gloed = 1; bikkels[3].gloed = 1; }
      if (soort === 'draai') { bikkels[2].gloed = 1; }
    }
  }
  function vakRond(lijst, marge) {
    const p = lijst.map((b) => naarScherm(b.x, b.y)), xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    return { left: Math.min(...xs) - marge, top: Math.min(...ys) - marge, width: Math.max(...xs) - Math.min(...xs) + 2 * marge, height: Math.max(...ys) - Math.min(...ys) + 2 * marge };
  }
  function balVak() { const p = naarScherm(bal.x, bal.y), r = BAL_R * (1 + 0.85 * bal.h) * sc + 6; return { left: p[0] - r, top: p[1] - r, width: 2 * r, height: 2 * r }; }
  const scherm = (p) => naarScherm(p[0], p[1]);
  if (window.Les) {
    Les.zet('bikkelen', () => [
      { doel: () => { lesDemo('kanten'); return vakRond(bikkels, 30 * sc + 6); }, gebaar: 'wijs', tekst: 'Een bikkel is een botje van een schaap. Hij heeft vier kanten: bol, hol, rug en S' },
      { doel: () => { lesDemo('gooi'); return vakRond(bikkels, 22 * sc + 6); }, gebaar: 'veeg', voorwerp: 'bikkel', van: () => scherm(handMidden(0)), naar: () => scherm([B / 2, L / 2]), tekst: 'Veeg de bikkels de stoep op. Zacht vegen houdt ze bij elkaar' },
      { doel: () => { lesDemo('bal'); return balVak(); }, vorm: 'rond', gebaar: 'tik', tekst: 'Tik op de bal: hij vliegt omhoog' },
      { doel: () => { lesDemo('pak'); return vakRond([bikkels[0]], 24 * sc); }, vorm: 'rond', gebaar: 'tik', tekst: 'Pak gauw een bikkel…' },
      { doel: () => { lesDemo('vang'); return balVak(); }, vorm: 'rond', gebaar: 'tik', tekst: '…en vang de bal als hij één keer gestuit is' },
      { doel: () => { lesDemo('twee'); return vakRond([bikkels[0], bikkels[3]], 22 * sc); }, gebaar: 'veeg', van: () => scherm(plek(bikkels[0])), naar: () => scherm(plek(bikkels[3])), tekst: 'Bij tweeën, drieën en vieren veeg je ze in één keer op' },
      { doel: () => { lesDemo('draai'); return vakRond([bikkels[2]], 24 * sc); }, vorm: 'rond', gebaar: 'tik', tekst: 'Daarna draai je ze één voor één op bol, hol, rug en S' },
      { doel: () => { lesDemo(null); return ui.kaart[0].querySelector('.bk-rij'); }, marge: 8, gebaar: 'wijs', tekst: 'Mis je, dan is de ander. Wie het eerst alle acht figuren haalt, wint' },
      { doel: () => { lesDemo(null); return ui.meer; }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je met wie je speelt' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.bikkelen = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('bik-tegen', 'mieke') : 'mieke';
        const t = TEGENSTANDERS.find((x) => x.id === bewaard);
        tegen = bewaard === 'twee' ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste) {
          const oud = laad();
          const ot = oud && (oud.tegen === 'twee' ? TWEE : TEGENSTANDERS.find((x) => x.id === oud.tegen));
          if (oud && ot && (ot === TWEE || isOpen(ot))) {
            tegen = ot === TWEE ? null : ot;
            potjes = oud.potjes || 1;
            spelers = tegen ? [{ naam: 'Jij', mens: true, fig: oud.fig[0] }, { naam: tegen.naam, mens: false, persoon: tegen.id, t: tegen, fig: oud.fig[1] }]
              : [{ naam: 'Speler 1', mens: true, fig: oud.fig[0] }, { naam: 'Speler 2', mens: true, fig: oud.fig[1] }];
            aan = oud.aan === 1 ? 1 : 0;
            const z = zijdeVan(aan);
            bikkels.forEach((b, i) => { const s = slot(z, i); Object.assign(b, { x: s.x, y: s.y, hoek: s.hoek, waar: 'hand', zijde: z, slot: i }); });
            const r = balRust(z); bal.x = r[0]; bal.y = r[1];
            meld(tegen ? `Verder met je spel tegen ${tegen.naam}.` : 'Verder met jullie spel.');
            werkKaartenBij();
            beginBeurt();
          } else nieuwSpel();
        } else {
          werkKaartenBij();
          hervat();
        }
        cancelAnimationFrame(raf);
        vorigeT = 0;
        raf = requestAnimationFrame(lus);
        if (window.Les) Les.eersteKeer('bikkelen');
      });
    },
    stop() {
      cancelAnimationFrame(raf);
      onderbreek();
      sluitMenu();
    },
    opnieuw() { nieuwSpel(); },
    _toestand() {
      return {
        fase, aan, tegen: tegen ? tegen.id : 'twee', fig: spelers.map((p) => p.fig), figuur: spelers.length ? figuur().id : null, draaien, liggend, L, sc, tempo, winnaar,
        bikkels: bikkels.map((b) => ({ x: b.x, y: b.y, kant: b.kant, waar: b.waar, vliegt: !!b.vliegt })),
        bal: bal && { x: bal.x, y: bal.y, h: bal.h },
        worp: worp && { tijd: worp.tijd, actie: worp.actie, klaar: worp.klaar, mens: worp.mens }
      };
    },
    _scherm(x, y) { return naarScherm(x, y); },
    _bikkel(i) { return naarScherm(bikkels[i].x, bikkels[i].y); },
    _bal() { return naarScherm(bal.x, bal.y); },
    _kanVangen() { return kanVangen(); },
    _T: { T1, T2, SPEL },
    _test: {
      zaad(n) { rnd = n === undefined ? Math.random : zaad(n); },
      zetFig(k, f) { if (spelers[k]) { spelers[k].fig = f; werkKaartenBij(); } },
      sim(idA, idB, n) {
        const zoek = (id) => (id === 'mens' ? MENS_MODEL : TEGENSTANDERS.find((x) => x.id === id));
        const a = zoek(idA), b = zoek(idB), uit = { a: 0, b: 0, geen: 0, beurten: 0, worpen: 0 };
        for (let i = 0; i < (n || 200); i++) {
          const r = i % 2 ? simSpel(b, a) : simSpel(a, b);
          const wA = i % 2 ? r.winnaar === 1 : r.winnaar === 0;
          if (r.winnaar < 0) uit.geen++; else if (wA) uit.a++; else uit.b++;
          uit.beurten += r.beurten; uit.worpen += r.worpen;
        }
        uit.beurten /= (n || 200); uit.worpen /= (n || 200);
        return uit;
      }
    }
  };
})();
