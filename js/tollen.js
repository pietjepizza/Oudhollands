/* Tollen, schermvullend: een tollenstrijd in een krijtkring op de zoldervloer.

   Je drijftol draait in de kring; met het zweepje houd je hem aan de gang en stuur je hem.
   - Veeg langs je tol: dat is een zweepslag. Hij draait harder en schiet de kant op van je veeg.
   - Zweep je te vaak achter elkaar, dan gaat hij wiebelen.
   - De tol die de kring uit gaat of omvalt, verliest de ronde. Wie het eerst twee rondes wint, wint.

   Overgenomen van succesvolle tolspellen en van vroeger:
   - een arena waar je de ander uit duwt, de laatste tol die draait wint (Beyblade, Top.io);
   - de snelst draaiende tol duwt het hardst, en botsende tollen springen met vonken uiteen;
   - het zweepje van de drijftol, zoals op Bruegels Kinderspelen (1560) en op Delftse tegels;
   - krijtpatroontjes op de kop van de tol, die bij het draaien een caleidoscoop vormen (zoals kinderen vroeger deden);
   - tegenstanders met een gezicht en een eigen manier van zwepen, met z'n tweeën op één scherm, of oefenen voor je record. */
(function () {
  'use strict';

  // ============================================================
  // DE ZOLDERVLOER MET DE KRIJTKRING (logische maten)
  // ============================================================
  const W = 400, H = 560;
  const MX = 200, MY = 322;              // het midden van de kring op het scherm
  const R = 168;                         // straal van de kring, in vloermaat
  const PLAT = 0.6;                      // zo plat zie je de vloer
  const RT = 19;                         // botsstraal van een tol
  const HT = 62;                         // hoogte van een tol
  const DT = 1 / 120;
  const KOM = 0.35;                      // de oude zoldervloer zakt in het midden: tollen glijden naar elkaar toe
  const k = (z) => 1 + z / 620;          // wat dichterbij is, is groter
  const naarScherm = (x, z) => [MX + x * k(z), MY + z * PLAT * k(z)];
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));

  // ============================================================
  // NATUURKUNDE VAN EEN DRIJFTOL
  // ============================================================
  function nieuweTol(van, x, z, stijl, zaad) {
    return { van, x, z, vx: 0, vz: 0, spin: 0, wiebel: 0, pre: zaad * 1.7, draai: zaad, kant: 0, laatste: -9,
      valt: false, ligt: false, val: 0, valRicht: 1, uit: false, dwaal: zaad * 2.3, stijl, zweepT: -9, zweepX: 0, zweepZ: 0 };
  }
  function stapTol(T, dt, rondeTijd) {
    if (T.ligt) return;
    if (T.valt) {
      T.val = Math.min(1, T.val + dt * 3);
      T.x += T.vx * dt * 0.4; T.z += T.vz * dt * 0.4;
      T.vx *= 1 - 3 * dt; T.vz *= 1 - 3 * dt;
      if (T.val >= 1) T.ligt = true;
      return;
    }
    const moe = 1 + rondeTijd * 0.065;    // hoe langer de ronde, hoe sneller het draaien afneemt
    T.spin -= (3 * moe + T.wiebel * 5 + (T.spin < 22 ? 2.2 : 0)) * dt;
    T.wiebel = Math.max(0, T.wiebel - 0.32 * dt);
    // dwalen: een langzaam draaiende duw, sterker als de tol trager draait of wiebelt
    T.dwaal += (0.85 + 0.55 * Math.sin(T.pre * 0.37)) * dt;
    const w = (1.25 - Math.max(0, T.spin) / 100) * 30 * (1 + T.wiebel);
    T.vx += Math.cos(T.dwaal) * w * dt; T.vz += Math.sin(T.dwaal) * w * dt;
    T.vx -= T.x * KOM * dt; T.vz -= T.z * KOM * dt;
    T.vx *= 1 - 1.15 * dt; T.vz *= 1 - 1.15 * dt;
    T.x += T.vx * dt; T.z += T.vz * dt;
    T.pre += (2.2 + (100 - Math.max(0, T.spin)) / 16 + T.wiebel * 4) * dt;
    T.kant = Math.pow(1 - klem(T.spin, 0, 100) / 100, 1.6) * 24 + T.wiebel * 18;
    T.draai += Math.max(0, T.spin) / 100 * 34 * dt;
  }
  // Een zweepslag: harder draaien en een duw de kant op van de veeg; te snel achter elkaar geeft gewiebel
  function zweep(T, dx, dz, kracht, nu, rondeTijd) {
    if (!T || T.valt || T.ligt) return false;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    const kort = nu - T.laatste < 0.6;
    const f = (kort ? 0.35 : 1) * (1 - Math.min(0.35, (rondeTijd || 0) / 120));
    T.vx += dx * (45 + 120 * kracht) * f; T.vz += dz * (45 + 120 * kracht) * f;
    T.spin += (9 + 13 * kracht) * f;
    if (T.spin > 100) { T.wiebel = Math.min(1, T.wiebel + (T.spin - 100) / 20); T.spin = 100 - (T.spin - 100) * 0.5; }
    T.wiebel = Math.min(1, T.wiebel + (kort ? 0.2 : 0.03));
    T.laatste = nu;
    T.zweepT = nu; T.zweepX = dx; T.zweepZ = dz;
    return true;
  }
  // Twee draaiende tollen raken elkaar: ze springen uiteen, de snelst draaiende duwt het hardst
  function botsTollen(A, B, cb) {
    if (A.valt || B.valt || A.ligt || B.ligt) return;
    const dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz);
    if (d >= 2 * RT || d === 0) return;
    const nx = dx / d, nz = dz / d, over = (2 * RT - d) / 2;
    A.x -= nx * over; A.z -= nz * over; B.x += nx * over; B.z += nz * over;
    const vrel = (B.vx - A.vx) * nx + (B.vz - A.vz) * nz;
    const sa = Math.max(4, A.spin), sb = Math.max(4, B.spin);
    const imp = Math.max(0, -vrel) * 1.0 + 70 + (sa + sb) * 1.0;
    const opA = sb / (sa + sb), opB = sa / (sa + sb);
    A.vx -= nx * imp * opA * 1.1; A.vz -= nz * imp * opA * 1.1;
    B.vx += nx * imp * opB * 1.1; B.vz += nz * imp * opB * 1.1;
    // zijwaarts schuren: beide tollen draaien met de klok mee
    const tx = -nz, tz = nx, schuur = (sa + sb) * 0.32;
    A.vx += tx * schuur * opA; A.vz += tz * schuur * opA;
    B.vx -= tx * schuur * opB; B.vz -= tz * schuur * opB;
    const verlies = 8 + Math.max(0, -vrel) * 0.06;
    A.spin -= verlies * opA * 2; B.spin -= verlies * opB * 2;
    A.wiebel = Math.min(1, A.wiebel + 0.12 * opA); B.wiebel = Math.min(1, B.wiebel + 0.12 * opB);
    if (cb) cb(A, B, imp, (A.x + B.x) / 2, (A.z + B.z) / 2);
  }

  // ============================================================
  // TEGENSTANDERS: ieder zweept op zijn eigen manier
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', niveau: 1, reactie: 0.42, rust: 0.35, minSpin: 58, rand: 0.8, mis: 30, aanval: 0.3, kracht: 0.65, beloning: 30,
      stijl: { banden: ['#E8741C', '#2A2420', '#F2C14E'], kop: '#F09A3E' },
      zegt: { start: ['Mijn tol is de snelste!'], ronde: ['Hebbes!'], verliest: ['Oei!'], wint: ['Gewonnen!'], verliesSpel: ['Jij kan goed zwepen!'] } },
    { id: 'grietje', niveau: 2, reactie: 0.34, rust: 0.62, minSpin: 46, rand: 0.68, mis: 24, aanval: 0.42, kracht: 0.65, beloning: 45,
      stijl: { banden: ['#4F8E44', '#F4F1E8', '#2E6A3A'], kop: '#7FB86A' },
      zegt: { start: ['Rustig blijven draaien...'], ronde: ['Die is voor mij.'], verliest: ['Ach.'], wint: ['Gewonnen!'], verliesSpel: ['Knap gezweept!'] } },
    { id: 'kees', niveau: 3, reactie: 0.27, rust: 0.65, minSpin: 44, rand: 0.64, mis: 15, aanval: 0.55, kracht: 0.75, beloning: 60,
      stijl: { banden: ['#D9B98A', '#F4F1E8', '#8A6A4A'], kop: '#EFE6D2' },
      zegt: { start: ['Draaien als een molen.'], ronde: ['Die maalt.'], verliest: ['Hm, tegenwind.'], wint: ['Fijn gemalen!'], verliesSpel: ['Petje af.'] } },
    { id: 'burgemeester', niveau: 4, reactie: 0.26, rust: 0.62, minSpin: 42, rand: 0.6, mis: 15, aanval: 0.58, kracht: 0.78, beloning: 80,
      stijl: { banden: ['#1E1A16', '#E2B44B', '#8A2A1E'], kop: '#2A2420' },
      zegt: { start: ['Let op, zo doe je dat.'], ronde: ['Uiteraard.'], verliest: ['Onmogelijk!'], wint: ['Zoals verwacht.'], verliesSpel: ['Hoe is het mogelijk!'] } }
  ];
  const TWEEDE = { banden: ['#2B4C9A', '#F4F1E8', '#1C3473'], kop: '#4C79C9' };
  let ruis = Math.random;
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = ruis(); while (v === 0) v = ruis(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // De tegenstander kijkt naar zijn tol en die van jou, en beslist of en waarheen hij zweept
  function computerDenkt(T, ander, t, nu, dt) {
    T.denk = (T.denk || 0) - dt;
    if (T.denk > 0 || T.valt || T.ligt) return null;
    T.denk = t.reactie * (0.7 + 0.6 * ruis());
    if (nu - T.laatste < t.rust) return null;
    const r = Math.hypot(T.x, T.z);
    let dx = 0, dz = 0, kracht = t.kracht;
    const naarMidden = () => { dx = -T.x - T.vx * 0.3; dz = -T.z - T.vz * 0.3; };
    if (r > R * t.rand) { naarMidden(); kracht = Math.min(1, t.kracht + 0.15); }
    else if (ander && !ander.valt && !ander.ligt && ruis() < t.aanval * 0.6 && T.spin > 30 &&
      (Math.hypot(ander.x, ander.z) > R * 0.45 || T.spin > ander.spin + 8)) {
      // aanvallen: zweep je tol tegen de ander aan, liefst zodat die naar de rand gaat
      const ox = ander.x - T.x, oz = ander.z - T.z, ol = Math.hypot(ox, oz) || 1;
      const rx = ander.x / (Math.hypot(ander.x, ander.z) || 1), rz = ander.z / (Math.hypot(ander.x, ander.z) || 1);
      dx = ox / ol + rx * 0.35; dz = oz / ol + rz * 0.35;
      kracht = Math.min(1, t.kracht + 0.2);
    } else if (T.spin < t.minSpin) {
      naarMidden();
      dx += gauss() * 40; dz += gauss() * 40;
    } else return null;
    // de hand trilt: de richting wijkt wat af
    const hoek = Math.atan2(dz, dx) + gauss() * t.mis * Math.PI / 180;
    return { dx: Math.cos(hoek), dz: Math.sin(hoek), kracht: klem(kracht * (0.85 + 0.3 * ruis()), 0.2, 1) };
  }

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, ui = {}, doek, ctx, achter = null, gebouwd = false;
  let schaal = 1, dpr = 1, raf = 0, vorigeT = 0, rest = 0, tijdSchaal = 1;
  let modus = 'tegen', tegen = TEGENSTANDERS[0], spelId = 0;
  let spelers = [], tollen = [], rondes = [0, 0], ronde = 0, fase = 'klaar', rondeTijd = 0, speltijd = 0, uitslag = null;
  let deeltjes = [], ringen = [], vegen = new Map(), zweepSporen = [], botsKlok = 0, aftel = 0;
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 80) : ms));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const gezichten = () => (window.Personen ? Personen.gezicht : {});
  const naamVan = (id) => (window.Personen && Personen.namen[id]) || id;
  const gewonnen = () => (window.Duiten ? Duiten.veld('tol-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const eigenStijl = () => (window.Pronk ? Pronk.stijl('tollen') : { banden: ['#B6452C', '#1C3473', '#E7C36A'], kop: '#D45A3C' });
  function record() {
    let r = window.Duiten ? Duiten.veld('record-tollen', 0) : 0;
    return r;
  }
  const tolIcoon = (st) => `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="22" cy="36" rx="12" ry="3" fill="rgba(0,0,0,.3)"/><path d="M6 14 C6 24 16 31 19 35 L20 36 L21 35 C24 31 34 24 34 14 Z" fill="${st.banden[0]}"/><path d="M7 19 H33 L32 22 H8 Z" fill="${st.banden[1]}"/><path d="M10 25 H30 L28.5 27 H11.5 Z" fill="${st.banden[2]}"/><ellipse cx="20" cy="14" rx="14" ry="5" fill="${st.kop}"/><ellipse cx="16" cy="13" rx="4" ry="1.6" fill="#fff" opacity=".45"/></svg>`;

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('to-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven to-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="sj-stand to-stand" type="button" aria-haspopup="dialog" aria-label="Kies je tegenstander"></button>
      <button class="mo-knop to-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop to-meer kn-meer" type="button" aria-label="Kies je tegenstander" title="Kies je tegenstander" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden to-midden"><div class="to-veldvak">
      <canvas class="to-doek" role="application" tabindex="0" aria-label="De krijtkring op de zoldervloer. Veeg langs je tol om hem te zwepen; met de pijltjes zweep je hem die kant op."></canvas>
      <div class="sj-pops to-pops" aria-hidden="true"></div>
      <div class="sj-kaart to-kaart" hidden></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder to-onder">
      <div class="mo-kaart to-zelf">
        <span class="mo-gezicht to-zelf-beeld"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="to-meters"></span></span>
        <span class="mo-doe"></span>
        <span class="mo-ballon" hidden></span>
      </div>
    </div>`);
    const menu = html(`<div class="mo-menu to-menu" role="dialog" aria-modal="true" aria-label="Tegen wie tol je?" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Tegen wie tol je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders sj-keuzes to-keuzes"></div>
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
      stand: boven.querySelector('.to-stand'), midden, vak: midden.querySelector('.to-veldvak'), pops: midden.querySelector('.to-pops'),
      kaart: midden.querySelector('.to-kaart'), zelf: onder.querySelector('.to-zelf'), menu, keuzes: menu.querySelector('.to-keuzes'), meld
    };
    doek = midden.querySelector('.to-doek');
    ctx = doek.getContext('2d');
    doek.addEventListener('pointerdown', neer);
    doek.addEventListener('pointermove', beweeg);
    doek.addEventListener('pointerup', los);
    doek.addEventListener('pointercancel', los);
    doek.addEventListener('keydown', toets);
    ui.stand.addEventListener('click', openMenu);
    boven.querySelector('.to-meer').addEventListener('click', openMenu);
    boven.querySelector('.to-vraag').addEventListener('click', () => { if (window.Les) Les.toon('tollen'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const kn = document.getElementById('knop-muziek'); if (kn) kn.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    gebouwd = true;
  }

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
  // TEKENEN
  // ============================================================
  function maakAchtergrond() {
    const c = document.createElement('canvas');
    c.width = doek.width; c.height = doek.height;
    const g = c.getContext('2d');
    g.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    let zaad = 23;
    const rnd = () => { zaad = (zaad * 16807) % 2147483647; return (zaad - 1) / 2147483646; };
    const WAND = 150, VP = { x: MX, y: -420 };
    // de achterwand: baksteen met een balk en een plint
    g.fillStyle = '#6A3626'; g.fillRect(0, 0, W, WAND);
    for (let rij = 0; rij * 13 < WAND; rij++) {
      for (let kol = -1; kol * 34 < W; kol++) {
        const x = kol * 34 + (rij % 2 ? 17 : 0), y = rij * 13;
        const t = rnd();
        g.fillStyle = `rgb(${120 + t * 30 | 0}, ${58 + t * 16 | 0}, ${40 + t * 10 | 0})`;
        g.fillRect(x + 1, y + 1, 32, 11);
      }
    }
    const wg = g.createLinearGradient(0, 0, 0, WAND);
    wg.addColorStop(0, 'rgba(20, 10, 4, .55)'); wg.addColorStop(0.6, 'rgba(20, 10, 4, .15)'); wg.addColorStop(1, 'rgba(20, 10, 4, .35)');
    g.fillStyle = wg; g.fillRect(0, 0, W, WAND);
    g.fillStyle = '#3A2414'; g.fillRect(0, 26, W, 16);
    g.fillStyle = 'rgba(255, 230, 190, .12)'; g.fillRect(0, 26, W, 2);
    g.fillStyle = '#4A2E18'; g.fillRect(0, WAND - 10, W, 10);
    g.fillStyle = 'rgba(255, 230, 190, .15)'; g.fillRect(0, WAND - 10, W, 1.5);
    // een rond zolderraampje (ossenoog) met daglicht
    const ox = 74, oy = 84;
    g.fillStyle = '#2E1C10'; g.beginPath(); g.arc(ox, oy, 27, 0, Math.PI * 2); g.fill();
    const lucht = g.createRadialGradient(ox - 6, oy - 8, 2, ox, oy, 22);
    lucht.addColorStop(0, '#F8F0D8'); lucht.addColorStop(1, '#B9CBD6');
    g.fillStyle = lucht; g.beginPath(); g.arc(ox, oy, 21, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#3A2414'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(ox - 21, oy); g.lineTo(ox + 21, oy); g.moveTo(ox, oy - 21); g.lineTo(ox, oy + 21); g.stroke();
    g.strokeStyle = '#E4D8BD'; g.lineWidth = 2.5; g.beginPath(); g.arc(ox, oy, 24, 0, Math.PI * 2); g.stroke();
    // de lichtbundel van het raampje naar de kring
    const bundel = g.createLinearGradient(ox, oy, MX, MY);
    bundel.addColorStop(0, 'rgba(255, 240, 200, .3)'); bundel.addColorStop(1, 'rgba(255, 240, 200, 0)');
    g.fillStyle = bundel;
    g.beginPath(); g.moveTo(ox - 16, oy + 8); g.lineTo(ox + 18, oy - 10); g.lineTo(MX + 130, MY + 40); g.lineTo(MX - 60, MY + 90); g.closePath(); g.fill();
    // stofjes in de bundel
    for (let i = 0; i < 26; i++) {
      const f = rnd(), x = ox + (MX + 30 - ox) * f + (rnd() - 0.5) * 60 * f, y = oy + (MY + 60 - oy) * f + (rnd() - 0.5) * 30;
      g.fillStyle = `rgba(255, 246, 220, ${(0.25 + rnd() * 0.4).toFixed(2)})`;
      g.beginPath(); g.arc(x, y, 0.8 + rnd() * 1.1, 0, Math.PI * 2); g.fill();
    }
    // een plankje met tollen en een potje
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(250, 103, 120, 6);
    g.fillStyle = '#6E4626'; g.fillRect(246, 96, 124, 8);
    g.fillStyle = 'rgba(255, 230, 190, .2)'; g.fillRect(246, 96, 124, 1.5);
    [[262, 108], [356, 108]].forEach(([x, y]) => { g.fillStyle = '#3A2414'; g.fillRect(x - 2, y - 4, 4, 12); });
    const minitol = (x, y, a, b, c) => {
      g.fillStyle = a; g.beginPath(); g.moveTo(x - 10, y - 20); g.bezierCurveTo(x - 10, y - 10, x - 3, y - 4, x, y); g.bezierCurveTo(x + 3, y - 4, x + 10, y - 10, x + 10, y - 20); g.closePath(); g.fill();
      g.fillStyle = b; g.fillRect(x - 9.5, y - 15, 19, 3);
      g.fillStyle = c; g.beginPath(); g.ellipse(x, y - 20, 10, 3.4, 0, 0, Math.PI * 2); g.fill();
    };
    minitol(280, 96, '#2B4C9A', '#F4F1E8', '#4C79C9');
    minitol(306, 96, '#5E9A4E', '#F2C14E', '#7FB86A');
    g.fillStyle = '#C9A06A'; g.beginPath(); g.moveTo(330, 96); g.lineTo(332, 78); g.lineTo(350, 78); g.lineTo(352, 96); g.closePath(); g.fill();
    g.fillStyle = '#E4D8BD'; g.fillRect(329, 75, 24, 4);
    // een zweepje aan een spijker
    g.fillStyle = '#2E241A'; g.beginPath(); g.arc(214, 62, 2.4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#7A5230'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(214, 64); g.lineTo(206, 118); g.stroke();
    g.strokeStyle = '#4A3018'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(214, 64); g.bezierCurveTo(232, 80, 222, 112, 236, 132); g.stroke();
    // de vloer: planken die naar achteren toe smaller worden
    const vg = g.createLinearGradient(0, WAND, 0, H);
    vg.addColorStop(0, '#7A5634'); vg.addColorStop(1, '#9C7349');
    g.fillStyle = vg; g.fillRect(0, WAND, W, H - WAND);
    for (let i = -14; i <= 14; i++) {
      const xb = MX + i * 40;
      const t = (WAND - VP.y) / (H - VP.y), xt = VP.x + (xb - VP.x) * t;
      g.strokeStyle = 'rgba(40, 22, 8, .45)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(xt, WAND); g.lineTo(xb, H); g.stroke();
      g.strokeStyle = 'rgba(255, 230, 190, .08)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(xt + 1.2, WAND); g.lineTo(xb + 1.8, H); g.stroke();
      // nerf en spijkers in de plank
      for (let j = 0; j < 3; j++) {
        const f = 0.15 + rnd() * 0.85, y = WAND + (H - WAND) * f * f;
        const tt = (y - VP.y) / (H - VP.y), xa = VP.x + (xb - VP.x) * tt, xn = VP.x + (xb + 40 - VP.x) * tt;
        g.strokeStyle = 'rgba(50, 28, 10, .2)'; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(xa + 4, y); g.quadraticCurveTo((xa + xn) / 2, y + 2, xn - 4, y - 1); g.stroke();
      }
      const y1 = WAND + 40 + rnd() * 300, tt1 = (y1 - VP.y) / (H - VP.y), xs = VP.x + (xb + 6 - VP.x) * tt1;
      g.fillStyle = 'rgba(30, 24, 20, .6)'; g.beginPath(); g.arc(xs, y1, 1.4, 0, Math.PI * 2); g.fill();
    }
    // naden dwars over de planken
    [0.12, 0.38, 0.7].forEach((f) => {
      const y = WAND + (H - WAND) * f * f + 8;
      g.strokeStyle = 'rgba(40, 22, 8, .35)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    });
    // stof en wat stro
    for (let i = 0; i < 900; i++) {
      const x = rnd() * W, y = WAND + rnd() * (H - WAND);
      g.fillStyle = rnd() > 0.5 ? 'rgba(255, 236, 200, .1)' : 'rgba(30, 16, 6, .14)';
      g.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 9; i++) {
      const x = rnd() * W, y = WAND + 20 + rnd() * (H - WAND - 30), a = rnd() * Math.PI;
      g.strokeStyle = 'rgba(226, 190, 110, .55)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 4); g.stroke();
    }
    // een lichtplek van het hijsluik, op de kring
    const lg = g.createRadialGradient(MX - 40, MY - 30, 20, MX, MY, 300);
    lg.addColorStop(0, 'rgba(255, 228, 170, .32)'); lg.addColorStop(0.5, 'rgba(255, 228, 170, .1)'); lg.addColorStop(1, 'rgba(255, 228, 170, 0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    // de krijtkring: een beetje uit de losse hand, met krijtstof
    const kring = (r, jitter, breed, alfa) => {
      g.strokeStyle = `rgba(250, 248, 238, ${alfa})`; g.lineWidth = breed; g.lineCap = 'round';
      g.beginPath();
      for (let i = 0; i <= 140; i++) {
        const a = i / 140 * Math.PI * 2, rr = r + Math.sin(a * 3 + 1) * jitter + (rnd() - 0.5) * jitter * 0.6;
        const [x, y] = naarScherm(Math.cos(a) * rr, Math.sin(a) * rr);
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    };
    kring(R + 2, 1.6, 4.5, 0.5);
    kring(R, 1.2, 2.4, 0.85);
    kring(R - 3, 2.2, 1, 0.3);
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, rr = R + (rnd() - 0.5) * 12;
      const [x, y] = naarScherm(Math.cos(a) * rr, Math.sin(a) * rr);
      g.fillStyle = `rgba(250, 248, 238, ${(0.15 + rnd() * 0.35).toFixed(2)})`;
      g.fillRect(x, y, 1 + rnd(), 1 + rnd());
    }
    // het kruisje in het midden en twee startstreepjes
    g.strokeStyle = 'rgba(250, 248, 238, .55)'; g.lineWidth = 1.6;
    const kruis = (x, z, s) => { const [a, b] = naarScherm(x - s, z), [c, d] = naarScherm(x + s, z), [e, f] = naarScherm(x, z - s), [h, i2] = naarScherm(x, z + s); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.moveTo(e, f); g.lineTo(h, i2); g.stroke(); };
    kruis(0, 0, 9);
    [[-70, 62], [70, -62]].forEach(([x, z]) => { const [a, b] = naarScherm(x - 10, z), [c, d] = naarScherm(x + 10, z); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    // een stukje krijt naast de kring
    const [kx, ky] = naarScherm(R + 18, 70);
    g.save(); g.translate(kx, ky); g.rotate(0.4);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-9, 2, 20, 6);
    g.fillStyle = '#F6F2E6'; g.fillRect(-10, -2, 20, 6);
    g.fillStyle = '#FFFFFF'; g.fillRect(-10, -2, 20, 2);
    g.restore();
    // vignet
    const vgn = g.createRadialGradient(MX, MY, 160, MX, MY, 420);
    vgn.addColorStop(0, 'rgba(12, 6, 2, 0)'); vgn.addColorStop(1, 'rgba(12, 6, 2, .5)');
    g.fillStyle = vgn; g.fillRect(0, 0, W, H);
    achter = c;
  }

  // Een drijftol, staand op zijn punt. Kop met krijtpatroon dat bij het draaien een caleidoscoop wordt.
  function tekenTol(T, nu) {
    const [sx, sy] = naarScherm(T.x, T.z);
    const s = k(T.z) * 0.95;
    const st = T.stijl;
    const draaiF = klem(T.spin / 100, 0, 1);
    // schaduw op de vloer (licht van linksachter)
    ctx.fillStyle = 'rgba(30, 16, 6, .35)';
    ctx.beginPath(); ctx.ellipse(sx + 10 * s + T.val * 18 * s * T.valRicht, sy + 3 * s, (17 + T.val * 20) * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    // draai-ring op de vloer: hoe hard draait hij nog?
    if (!T.valt && !T.ligt) {
      const f = draaiF;
      const kleur = T.wiebel > 0.35 ? '#E8742C' : f < 0.25 ? '#D9573A' : f < 0.45 ? '#F2C14E' : '#8ED07A';
      ctx.lineWidth = 3 * s; ctx.strokeStyle = 'rgba(20, 10, 4, .35)';
      ctx.beginPath(); ctx.ellipse(sx, sy, 24 * s, 9 * s, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = kleur;
      ctx.beginPath(); ctx.ellipse(sx, sy, 24 * s, 9 * s, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.stroke();
    }
    ctx.save();
    ctx.translate(sx, sy);
    const kantel = T.valt || T.ligt ? T.valRicht * (Math.abs(Math.sin(T.pre)) * T.kant + (80 - Math.abs(Math.sin(T.pre)) * T.kant) * T.val) : T.kant * Math.sin(T.pre);
    ctx.rotate(kantel * Math.PI / 180);
    ctx.scale(s, s);
    // het lijf
    const lijf = new Path2D();
    lijf.moveTo(-22, -HT + 10);
    lijf.bezierCurveTo(-23, -30, -8, -12, -2.2, -4);
    lijf.lineTo(2.2, -4);
    lijf.bezierCurveTo(8, -12, 23, -30, 22, -HT + 10);
    lijf.closePath();
    ctx.fillStyle = st.banden[0]; ctx.fill(lijf);
    ctx.save(); ctx.clip(lijf);
    ctx.fillStyle = st.banden[1]; ctx.fillRect(-30, -HT + 20, 60, 8);
    ctx.fillStyle = st.banden[2]; ctx.fillRect(-30, -HT + 33, 60, 5);
    ctx.fillStyle = st.banden[1]; ctx.fillRect(-30, -HT + 43, 60, 3);
    // strepen die rondgaan: zo zie je hoe hard hij draait
    for (let i = 0; i < 5; i++) {
      const fz = T.draai * 3 + i * (Math.PI * 2 / 5), x = Math.sin(fz) * 18, zicht = Math.cos(fz);
      if (zicht < 0) continue;
      ctx.globalAlpha = 0.45 * zicht;
      ctx.fillStyle = '#FFF6E2';
      const b = draaiF > 0.5 ? 8 + draaiF * 10 : 3;
      ctx.fillRect(x - b / 2, -HT + 14, b, 30);
    }
    ctx.globalAlpha = 1;
    const lg = ctx.createLinearGradient(-22, 0, 22, 0);
    lg.addColorStop(0, 'rgba(255,255,255,.3)'); lg.addColorStop(0.42, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = lg; ctx.fillRect(-30, -HT, 60, HT);
    ctx.restore();
    ctx.strokeStyle = 'rgba(40, 20, 8, .55)'; ctx.lineWidth = 1.2; ctx.stroke(lijf);
    // de ijzeren punt
    ctx.fillStyle = '#5A5650';
    ctx.beginPath(); ctx.moveTo(-2.4, -4.5); ctx.lineTo(2.4, -4.5); ctx.lineTo(0, 0.5); ctx.closePath(); ctx.fill();
    // de kop, schuin van boven gezien, met krijtpatroon
    ctx.save();
    ctx.translate(0, -HT + 10);
    ctx.fillStyle = st.kop;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2); ctx.clip();
    if (draaiF > 0.5 && !T.valt) {
      // te snel om de stipjes te zien: ze worden kringen, als een caleidoscoop
      [[17, st.banden[1]], [12, '#FFFFFF'], [7, st.banden[2]], [3, st.banden[0]]].forEach(([r, kl], i) => {
        ctx.globalAlpha = 0.55 + 0.1 * Math.sin(nu / 90 + i);
        ctx.strokeStyle = kl; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    } else {
      for (let i = 0; i < 6; i++) {
        const a = T.draai * 4 + i * Math.PI / 3;
        ctx.fillStyle = i % 2 ? st.banden[1] : '#FFFFFF';
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 12, Math.sin(a) * 4.4, 3.2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = st.banden[2];
      ctx.beginPath(); ctx.ellipse(0, 0, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(40, 20, 8, .45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -HT + 10, 22, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(-9, -HT + 7.5, 7, 2, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // het zweepje: een touwtje dat je vinger volgt, met een klap bij het raken
  function tekenZweep(nu) {
    zweepSporen = zweepSporen.filter((z) => nu - z.t < 380);
    zweepSporen.forEach((z) => {
      const p = z.punten;
      if (p.length < 2) return;
      const a = Math.max(0, 1 - (nu - z.t) / 380);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgba(60, 34, 12, ${(0.85 * a).toFixed(2)})`; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.stroke();
      // het stokje aan het eind
      const q = p[p.length - 1], q2 = p[Math.max(0, p.length - 3)];
      const h = Math.atan2(q.y - q2.y, q.x - q2.x);
      ctx.strokeStyle = `rgba(110, 70, 34, ${a.toFixed(2)})`; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + Math.cos(h) * 22, q.y + Math.sin(h) * 22); ctx.stroke();
    });
  }

  function teken() {
    if (!ctx) return;
    if (!achter) maakAchtergrond();
    const nu = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, doek.width, doek.height);
    ctx.drawImage(achter, 0, 0);
    ctx.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    // de kring licht rood op waar een tol de rand nadert
    tollen.forEach((T) => {
      if (T.valt || T.ligt) return;
      const r = Math.hypot(T.x, T.z);
      if (r < R * 0.72) return;
      const a0 = Math.atan2(T.z, T.x), f = klem((r - R * 0.72) / (R * 0.28), 0, 1);
      ctx.strokeStyle = `rgba(226, 88, 52, ${(0.25 + 0.6 * f).toFixed(2)})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = -10; i <= 10; i++) {
        const a = a0 + i * 0.045;
        const [x, y] = naarScherm(Math.cos(a) * R, Math.sin(a) * R);
        if (i === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    // ringen (botsingen, zweepslagen)
    ringen = ringen.filter((r) => nu - r.t < r.duur);
    ringen.forEach((r) => {
      const t = (nu - r.t) / r.duur;
      ctx.strokeStyle = `rgba(${r.kleur}, ${((1 - t) * r.a).toFixed(2)})`; ctx.lineWidth = 2.5 * (1 - t) + 0.5;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r0 + (r.r1 - r.r0) * t, (r.r0 + (r.r1 - r.r0) * t) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    });
    // tollen van achter naar voor
    tollen.slice().sort((a, b) => a.z - b.z).forEach((T) => tekenTol(T, nu));
    // een pijltje boven je eigen tol (bij twee spelers: goud en blauw)
    tollen.forEach((T, i) => {
      if (!spelers[i] || !spelers[i].mens || T.ligt) return;
      const [sx, sy] = naarScherm(T.x, T.z), s = k(T.z);
      const y = sy - (HT + 18) * s + Math.sin(nu / 260 + i) * 2.5;
      ctx.fillStyle = i ? '#7FA8F0' : '#F2C14E'; ctx.strokeStyle = 'rgba(40, 20, 6, .6)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sx - 8, y - 7); ctx.lineTo(sx + 8, y - 7); ctx.lineTo(sx, y + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    // vonken en stof
    deeltjes.forEach((d) => {
      ctx.fillStyle = `rgba(${d.kleur}, ${klem(d.leef / d.max, 0, 1).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    });
    tekenZweep(nu);
    // aftellen
    if (fase === 'aftellen') {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 46px "EB Garamond", Georgia, serif';
      ctx.fillStyle = 'rgba(255, 246, 222, .95)'; ctx.strokeStyle = 'rgba(40, 20, 6, .7)'; ctx.lineWidth = 5;
      const tekstje = aftel > 0.9 ? 'Klaar?' : 'Af!';
      ctx.strokeText(tekstje, MX, MY - 120); ctx.fillText(tekstje, MX, MY - 120);
    }
  }

  // ---------- Effecten ----------
  function stof(x, y, n, kleur, kracht) {
    if (rustig()) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (30 + Math.random() * 90) * (kracht || 1);
      deeltjes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 20, r: 0.8 + Math.random() * 1.8, leef: 0.35 + Math.random() * 0.4, max: 0.75, kleur: kleur || '236, 214, 170' });
    }
  }
  function ring(x, y, r0, r1, duur, kleur, a) { if (!rustig()) ringen.push({ x, y, r0, r1, duur, kleur: kleur || '255, 246, 222', a: a || 0.8, t: performance.now() }); }
  function schok(kracht) {
    if (rustig() || !ui.vak) return;
    const s = Math.min(6, kracht);
    ui.vak.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-s}px, ${s * 0.5}px)` }, { transform: `translate(${s * 0.8}px, ${-s * 0.4}px)` }, { transform: 'translate(0,0)' }], { duration: 180, easing: 'ease-out' });
  }
  function opBotsing(A, B, imp, x, z) {
    if (speltijd - botsKlok < 0.12) return;
    botsKlok = speltijd;
    const [sx, sy] = naarScherm(x, z);
    Geluid.hout(Math.min(1, imp / 260));
    if (window.Tril) Tril.bots(Math.min(1, imp / 220));
    stof(sx, sy - 30 * k(z), 14, '255, 214, 120', 1.4);
    ring(sx, sy, 6, 40, 320, '255, 236, 190', 0.9);
    schok(imp / 45);
    if (imp > 190) pop(sx, sy - 70, willekeurig(['Bonk!', 'Klabam!', 'Pats!']), 'raak');
  }

  // ============================================================
  // DE LUS
  // ============================================================
  // een spel met snelheid staat stil zolang Gijs uitleg geeft of het menu open is
  const gepauzeerd = () => {
    if (ui.menu && !ui.menu.hidden) return true;
    const les = document.getElementById('les');
    return !!les && !les.hidden;
  };
  function lus(t) {
    let dt = Math.min(0.05, (t - (vorigeT || t)) / 1000);
    vorigeT = t;
    if (gepauzeerd()) dt = 0;
    // vertraging als een tol bijna de kring uit gaat
    let doelSchaal = 1;
    if (fase === 'spel' && !rustig()) {
      tollen.forEach((T) => {
        if (T.valt || T.ligt) return;
        const r = Math.hypot(T.x, T.z), uitwaarts = (T.x * T.vx + T.z * T.vz) / (r || 1);
        if (r > R * 0.9 && uitwaarts > 30) doelSchaal = 0.4;
      });
    }
    tijdSchaal += (doelSchaal - tijdSchaal) * Math.min(1, dt * 7);
    rest += dt * tijdSchaal;
    let n = 0;
    while (rest >= DT && n < 12) { stapSpel(DT); rest -= DT; n++; }
    deeltjes = deeltjes.filter((d) => (d.leef -= dt) > 0);
    deeltjes.forEach((d) => { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 140 * dt; d.vx *= 0.94; });
    if (fase === 'aftellen') {
      aftel -= dt;
      if (aftel <= 0) begin();
    }
    teken();
    werkMetersBij();
    raf = requestAnimationFrame(lus);
  }

  function stapSpel(dt) {
    if (fase !== 'spel' && fase !== 'uitrollen') {
      tollen.forEach((T) => { if (T.valt) stapTol(T, dt, rondeTijd); else if (!T.ligt) T.draai += Math.max(0, T.spin) / 100 * 34 * dt; });
      return;
    }
    speltijd += dt;
    if (fase === 'spel') rondeTijd += dt;
    // de tegenstander denkt mee
    if (fase === 'spel') {
      spelers.forEach((p, i) => {
        if (p.mens || !p.t) return;
        const T = tollen[i], ander = tollen[1 - i];
        const besluit = computerDenkt(T, ander, p.t, speltijd, dt);
        if (besluit && zweep(T, besluit.dx, besluit.dz, besluit.kracht, speltijd, rondeTijd)) computerZweepBeeld(T, besluit);
      });
      // oefenen: af en toe een hobbel in de vloer
      if (modus === 'oefen') {
        hobbel -= dt;
        if (hobbel <= 0) {
          hobbel = 3 + ruis() * 3.5;
          const a = ruis() * Math.PI * 2, T = tollen[0];
          if (T && !T.valt) { T.vx += Math.cos(a) * (25 + rondeTijd * 1.2); T.vz += Math.sin(a) * (25 + rondeTijd * 1.2); }
        }
      }
    }
    tollen.forEach((T) => stapTol(T, dt, rondeTijd));
    if (tollen.length === 2) botsTollen(tollen[0], tollen[1], opBotsing);
    if (fase !== 'spel') return;
    // wie valt er om of gaat de kring uit?
    tollen.forEach((T) => {
      if (T.valt || T.ligt) return;
      const r = Math.hypot(T.x, T.z);
      if (r > R + 2) valOm(T, 'uit');
      else if (T.spin <= 0) valOm(T, 'om');
    });
    const gevallen = tollen.filter((T) => T.valt || T.ligt);
    if (gevallen.length) eindeRonde(gevallen);
  }
  let hobbel = 4;

  function valOm(T, hoe) {
    T.valt = true; T.uit = hoe === 'uit'; T.val = 0;
    T.valRicht = Math.sin(T.pre) >= 0 ? 1 : -1;
    T.spin = 0;
    const [sx, sy] = naarScherm(T.x, T.z);
    Geluid.val();
    stof(sx, sy, 10, hoe === 'uit' ? '250, 248, 238' : '236, 214, 170', 1);
    pop(sx, sy - 74 * k(T.z), hoe === 'uit' ? 'Uit de kring!' : 'Om!', 'mis');
  }

  // ============================================================
  // INVOER: veeg langs je tol
  // ============================================================
  function naarVeld(e) {
    const r = doek.getBoundingClientRect();
    return { x: (e.clientX - r.left) / schaal, y: (e.clientY - r.top) / schaal, t: performance.now() };
  }
  // afstand tussen twee lijnstukken in het vlak
  function afstandStukken(a, b, c, d) {
    const pt = (p, q, r) => { const dx = r.x - q.x, dy = r.y - q.y, l2 = dx * dx + dy * dy; let t = l2 ? ((p.x - q.x) * dx + (p.y - q.y) * dy) / l2 : 0; t = klem(t, 0, 1); return Math.hypot(p.x - (q.x + t * dx), p.y - (q.y + t * dy)); };
    const kruist = (p1, p2, p3, p4) => {
      const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
      return o(p1, p2, p3) !== o(p1, p2, p4) && o(p3, p4, p1) !== o(p3, p4, p2);
    };
    if (kruist(a, b, c, d)) return 0;
    return Math.min(pt(a, c, d), pt(b, c, d), pt(c, a, b), pt(d, a, b));
  }
  function magZwepen(i) {
    const p = spelers[i];
    return p && p.mens && (fase === 'spel' || fase === 'aftellen');
  }
  function neer(e) {
    if (fase === 'klaar' && modus !== 'oefen') return;
    e.preventDefault();
    if (doek.setPointerCapture) doek.setPointerCapture(e.pointerId);
    const p = naarVeld(e);
    const spoor = { punten: [p], geraakt: new Set(), t: performance.now() };
    vegen.set(e.pointerId, spoor);
    zweepSporen.push(spoor);
  }
  function beweeg(e) {
    const spoor = vegen.get(e.pointerId);
    if (!spoor) return;
    const p = naarVeld(e);
    spoor.punten.push(p); if (spoor.punten.length > 16) spoor.punten.shift();
    spoor.t = performance.now();
    const a = spoor.punten[spoor.punten.length - 2], b = p;
    if (!a) return;
    tollen.forEach((T, i) => {
      if (spoor.geraakt.has(i) || !magZwepen(i) || T.valt || T.ligt) return;
      const [sx, sy] = naarScherm(T.x, T.z), s = k(T.z);
      const voet = { x: sx, y: sy - 4 * s }, kop = { x: sx, y: sy - (HT - 8) * s };
      if (afstandStukken(a, b, voet, kop) > 24 * s) return;
      // de snelheid van de veeg bepaalt de kracht
      const oud = spoor.punten.find((q) => p.t - q.t < 90) || spoor.punten[0];
      const dtv = Math.max(0.016, (p.t - oud.t) / 1000);
      const vx = (p.x - oud.x) / dtv, vy = (p.y - oud.y) / dtv, snel = Math.hypot(vx, vy);
      if (snel < 220) return;
      spoor.geraakt.add(i);
      if (fase === 'aftellen') return;
      const kracht = klem(snel / 1500, 0.25, 1);
      const dx = vx / s, dz = vy / (PLAT * s);
      if (zweep(T, dx, dz, kracht, speltijd, rondeTijd)) slagBeeld(T, kracht);
    });
  }
  function los(e) {
    const spoor = vegen.get(e.pointerId);
    if (spoor && spoor.geraakt.size && window.Tril) Tril.klik();
    vegen.delete(e.pointerId);
  }
  function slagBeeld(T, kracht) {
    const [sx, sy] = naarScherm(T.x, T.z);
    Geluid.zweep();
    if (window.Tril) Tril.tik();
    stof(sx, sy, 6, '236, 214, 170', 0.8);
    ring(sx, sy - 30 * k(T.z), 8, 30 + kracht * 20, 260, '255, 250, 235', 0.9);
    if (T.wiebel > 0.45) pop(sx, sy - 80 * k(T.z), 'Wiebel!', 'mis');
  }
  // de tegenstander zweept ook: een touwtje dat langs zijn tol slaat
  function computerZweepBeeld(T, b) {
    const [sx, sy] = naarScherm(T.x, T.z), s = k(T.z);
    const ex = b.dx * s, ey = b.dz * PLAT * s, l = Math.hypot(ex, ey) || 1;
    const ux = ex / l, uy = ey / l, my = sy - 32 * s, nu = performance.now();
    const punten = [];
    for (let i = 0; i <= 8; i++) {
      const f = i / 8 - 0.5;
      punten.push({ x: sx + ux * f * 120 - uy * Math.sin(i / 8 * Math.PI) * 14, y: my + uy * f * 120 + ux * Math.sin(i / 8 * Math.PI) * 14, t: nu });
    }
    zweepSporen.push({ punten, t: nu });
    slagBeeld(T, b.kracht);
  }
  function toets(e) {
    const r = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!r) return;
    e.preventDefault();
    if (!magZwepen(0) || fase !== 'spel') return;
    if (zweep(tollen[0], r[0], r[1], 0.7, speltijd, rondeTijd)) slagBeeld(tollen[0], 0.7);
  }

  // ============================================================
  // HET SPELVERLOOP
  // ============================================================
  function nieuwSpel() {
    spelId++;
    const st = eigenStijl();
    if (modus === 'tegen') spelers = [{ naam: 'Jij', mens: true, stijl: st }, { naam: naamVan(tegen.id), mens: false, persoon: tegen.id, t: tegen, stijl: tegen.stijl }];
    else if (modus === 'twee') spelers = [{ naam: 'Speler 1', mens: true, stijl: st }, { naam: 'Speler 2', mens: true, stijl: TWEEDE }];
    else spelers = [{ naam: 'Jij', mens: true, stijl: st }];
    rondes = [0, 0]; ronde = 0; uitslag = null;
    ui.kaart.hidden = true;
    zeg('start', true);
    nieuweRonde();
  }
  function nieuweRonde() {
    ronde++;
    rondeTijd = 0; hobbel = 4; deeltjes = []; ringen = [];
    tollen = spelers.map((p, i) => nieuweTol(i, modus === 'oefen' ? 0 : (i ? 70 : -70), modus === 'oefen' ? 40 : (i ? -62 : 62), p.stijl, 1 + i * 3.1 + ronde * 0.7));
    tollen.forEach((T) => { T.spin = 72; });
    fase = 'aftellen';
    aftel = rustig() ? 0.2 : 1.7;
    werkStandBij();
    werkHudBij();
    meld(modus === 'oefen' ? 'Houd je tol zo lang mogelijk draaiende.' : `Ronde ${ronde}. Klaar? Af!`);
  }
  function begin() {
    if (fase !== 'aftellen') return;
    fase = 'spel';
    Geluid.zweep();
    tollen.forEach((T, i) => {
      const [sx, sy] = naarScherm(T.x, T.z);
      ring(sx, sy, 6, 34, 360);
      stof(sx, sy, 8);
      T.vx = (i ? -1 : 1) * 12; T.vz = 0;
    });
    werkHudBij();
  }

  async function eindeRonde(gevallen) {
    const mijnId = spelId;
    fase = 'uitrollen';
    if (modus === 'oefen') {
      await wacht(1200); if (mijnId !== spelId) return;
      return eindeOefen();
    }
    const winnaar = gevallen.length === 2 ? -1 : (tollen[0].valt || tollen[0].ligt ? 1 : 0);
    // nog even laten uitdraaien
    await wacht(1100); if (mijnId !== spelId) return;
    fase = 'tussen';
    if (winnaar >= 0) rondes[winnaar]++;
    werkStandBij();
    const w = spelers[winnaar];
    if (winnaar < 0) banier('Gelijk!', 'beide tollen liggen');
    else if (modus === 'tegen') {
      banier(w.mens ? 'Ronde voor jou!' : `Ronde voor ${w.naam}`, `${rondes[0]} – ${rondes[1]}`);
      if (w.mens) { Geluid.klok(); zeg('verliest', true); } else { Geluid.jammer(); zeg('ronde', true); }
    } else { banier(`Ronde voor ${w.naam}`, `${rondes[0]} – ${rondes[1]}`); Geluid.klok(); }
    await wacht(1900); if (mijnId !== spelId) return;
    if (rondes[0] >= 2 || rondes[1] >= 2) return einde(rondes[0] >= 2 ? 0 : 1);
    nieuweRonde();
  }

  function eindeOefen() {
    fase = 'klaar';
    const sec = Math.round(rondeTijd * 10) / 10;
    const best = record();
    const nieuw = sec > best;
    if (nieuw && window.Duiten) Duiten.zetVeld('record-tollen', sec);
    const tijdTekst = sec.toFixed(1).replace('.', ',');
    banier(nieuw ? 'Record!' : `${tijdTekst} seconden`, nieuw ? `${tijdTekst} seconden` : `je record is ${String(best).replace('.', ',')}`);
    if (nieuw) { Geluid.tada(); vonken(30); } else Geluid.klok();
    werkStandBij();
    werkHudBij();
    meld(`${tijdTekst} seconden`);
    if (window.Duiten && sec >= 2) Duiten.beloon({ spel: 'tollen', bedrag: Math.min(60, 5 + Math.floor(sec / 2)), gewonnen: nieuw, tekst: nieuw ? `${tijdTekst} s · record!` : `${tijdTekst} seconden`, wacht: 2400 });
    setTimeout(() => toonWeer('Nog een keer?'), 2000);
  }

  function einde(w) {
    fase = 'klaar';
    uitslag = w;
    werkStandBij();
    werkHudBij();
    const pw = spelers[w];
    let bedrag, tekst, gewonnenSpel = false, verder = null;
    if (modus === 'twee') {
      bedrag = 25; gewonnenSpel = true;
      tekst = `${pw.naam} wint met ${rondes[w]} tegen ${rondes[1 - w]}!`;
      banier(`${pw.naam} wint!`, `${rondes[0]} – ${rondes[1]}`);
      Geluid.tada(); vonken(34);
    } else if (pw.mens) {
      const telling = gewonnen();
      const eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('tol-gewonnen', telling);
      bedrag = tegen.beloning; gewonnenSpel = true;
      tekst = `Gewonnen van ${naamVan(tegen.id)}: ${rondes[0]} tegen ${rondes[1]}!`;
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${naamVan(volgende.id)} is vrij!`;
        verder = { tekst: `Tegen ${naamVan(volgende.id)}`, actie: () => { tegen = volgende; modus = 'tegen'; bewaarKeuze(); nieuwSpel(); } };
      }
      banier('Gewonnen!', `${rondes[0]} – ${rondes[1]}`);
      Geluid.tada(); vonken(44);
      if (window.Tril) Tril.succes();
      zeg('verliesSpel', true);
    } else {
      bedrag = 10 + rondes[0] * 5;
      tekst = `${pw.naam} wint met ${rondes[1]} tegen ${rondes[0]}.`;
      banier(`${pw.naam} wint`, `${rondes[0]} – ${rondes[1]}`);
      Geluid.jammer();
      zeg('wint', true);
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'tollen', bedrag, gewonnen: gewonnenSpel, tekst, verder, wacht: 2400 });
    setTimeout(() => toonWeer(modus === 'tegen' ? (pw.mens ? 'Nog een keer?' : 'Revanche?') : 'Nog een keer?'), 2000);
  }
  function toonWeer(vraag) {
    if (fase !== 'klaar' || !ui.kaart) return;
    toonKaart(`<b>${vraag}</b><button class="knop to-weer" type="button">${icoon('opnieuw')}Opnieuw</button>`);
    ui.kaart.querySelector('.to-weer').addEventListener('click', () => nieuwSpel());
  }

  // ============================================================
  // SCHERM: stand, onderkaart, kaartjes en banieren
  // ============================================================
  function werkStandBij() {
    if (!ui.stand) return;
    const g = gezichten();
    const vakje = (p, i) => {
      const beeld = p.persoon ? (g[p.persoon] || '') : tolIcoon(p.stijl);
      const punten = modus === 'oefen'
        ? `<b class="sj-speler-score">${fase === 'klaar' || fase === 'uitrollen' ? String(Math.round(rondeTijd * 10) / 10).replace('.', ',') : '–'}</b>`
        : `<span class="to-rondes">${[0, 1].map((j) => `<i class="${j < rondes[i] ? 'vol' : ''}"></i>`).join('')}</span>`;
      return `<span class="sj-speler${uitslag === i ? ' kn-winnaar' : ''}"><span class="sj-speler-beeld">${beeld}</span><span class="sj-speler-naam">${p.naam}</span>${punten}</span>`;
    };
    let inhoud = spelers.map(vakje).join('<i class="sj-tegen">·</i>');
    if (modus === 'oefen') inhoud += `<i class="sj-tegen">·</i><span class="sj-speler sj-record"><span class="sj-speler-beeld">${icoon('ster')}</span><span class="sj-speler-naam">Record</span><b class="sj-speler-score">${record() ? String(record()).replace('.', ',') : '–'}</b></span>`;
    ui.stand.innerHTML = inhoud;
    ui.stand.setAttribute('aria-label', (modus === 'oefen' ? 'Oefenen' : spelers.map((p, i) => `${p.naam} ${rondes[i]} rondes`).join(', ')) + '. Tik om een tegenstander te kiezen.');
  }
  function werkHudBij() {
    if (!ui.zelf || !spelers.length) return;
    const p = spelers[0];
    ui.zelf.querySelector('.to-zelf-beeld').innerHTML = tolIcoon(p.stijl);
    ui.zelf.querySelector('.mo-naam').textContent = modus === 'twee' ? 'Speler 1 en 2' : p.naam;
    const meters = ui.zelf.querySelector('.to-meters');
    const aantal = modus === 'twee' ? 2 : 1;
    if (meters.children.length !== aantal) meters.innerHTML = Array.from({ length: aantal }, () => '<span class="to-meter"><i></i></span>').join('');
    const doe = ui.zelf.querySelector('.mo-doe');
    if (fase === 'aftellen' || fase === 'spel') doe.innerHTML = `${icoon('zweep', 'to-zweepje')}<span>Veeg langs je tol</span>`;
    else doe.innerHTML = '';
    ui.zelf.classList.toggle('aan', fase === 'spel');
  }
  function werkMetersBij() {
    if (!ui.zelf) return;
    const meters = ui.zelf.querySelectorAll('.to-meter i');
    meters.forEach((m, i) => {
      const T = tollen[i];
      const f = T ? klem(T.spin / 100, 0, 1) : 0;
      m.style.width = (f * 100).toFixed(1) + '%';
      m.className = T && T.wiebel > 0.35 ? 'wiebel' : f < 0.25 ? 'laag' : f < 0.45 ? 'midden' : '';
    });
  }
  function zeg(soort, altijd) {
    const p = spelers.find((q) => q.persoon);
    if (!p || !p.t || !ui.zelf) return;
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
    e.className = 'sj-pop to-pop' + (soort ? ' ' + soort : '');
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
  function bewaarKeuze() { if (window.Duiten) Duiten.zetVeld('tol-tegen', modus === 'tegen' ? tegen.id : modus); }
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
    const st = eigenStijl();
    knop((modus === 'twee' ? 'nu ' : '') + 'sj-breed', `<span class="mo-gezicht sj-twee">${tolIcoon(st)}${tolIcoon(TWEEDE)}</span><span class="mo-keuze-naam">Met z'n tweeën</span>`, 'Met z\'n tweeën op dit toestel', () => { modus = 'twee'; bewaarKeuze(); sluitMenu(); nieuwSpel(); });
    knop((modus === 'oefen' ? 'nu ' : '') + 'sj-breed', `<span class="mo-gezicht sj-twee">${tolIcoon(st)}</span><span class="mo-keuze-naam">Oefenen · record ${record() ? String(record()).replace('.', ',') : '–'}</span>`, 'Alleen oefenen: zo lang mogelijk tollen', () => { modus = 'oefen'; bewaarKeuze(); sluitMenu(); nieuwSpel(); });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function vak(x, y, b, h) { const r = doek.getBoundingClientRect(); return { left: r.left + x * schaal, top: r.top + y * schaal, width: b * schaal, height: h * schaal }; }
  function punt(x, y) { const r = doek.getBoundingClientRect(); return [r.left + x * schaal, r.top + y * schaal]; }
  function eigenTol() { const T = tollen[0]; return T ? naarScherm(T.x, T.z) : naarScherm(-70, 62); }
  if (window.Les) {
    Les.zet('tollen', () => [
      { doel: () => { const [x, y] = eigenTol(); return vak(x - 60, y - 80, 120, 96); }, gebaar: 'veeg', van: () => { const [x, y] = eigenTol(); return punt(x - 70, y - 30); }, naar: () => { const [x, y] = eigenTol(); return punt(x + 70, y - 30); }, duur: 900, tekst: 'Veeg langs je tol: een zweepslag' },
      { doel: () => vak(MX - R - 8, MY - R * 0.48, 2 * R + 16, R * 1.1), gebaar: 'wijs', tekst: 'Hij schiet de kant op van je veeg' },
      { doel: () => { const [x, y] = eigenTol(); return vak(x - 34, y - 16, 68, 32); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Niet te vaak zwepen, anders gaat hij wiebelen' },
      { doel: () => vak(MX - R - 8, MY - R * 0.48, 2 * R + 16, R * 1.1), gebaar: 'wijs', tekst: 'Duw de andere tol de kring uit, of laat hem omvallen' },
      { doel: () => ui.stand, gebaar: 'wijs', tekst: 'Wie het eerst twee rondes wint, wint!' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.tollen = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('tol-tegen', 'jantje') : 'jantje';
        const t = TEGENSTANDERS.find((x) => x.id === bewaard);
        if (bewaard === 'twee' || bewaard === 'oefen') modus = bewaard;
        else { modus = 'tegen'; tegen = t && isOpen(t) ? t : TEGENSTANDERS[0]; }
        requestAnimationFrame(() => { pasMaatAan(); nieuwSpel(); });
      } else pasMaatAan();
      cancelAnimationFrame(raf);
      vorigeT = 0;
      raf = requestAnimationFrame(lus);
      if (window.Duiten && !Duiten.veld('tol-les-2', false)) { Duiten.zetVeld('les-tollen', false); Duiten.zetVeld('tol-les-2', true); }
      if (window.Les) Les.eersteKeer('tollen');
    },
    // het spel pauzeert als je weggaat: de tollen staan stil tot je terugkomt
    stop() {
      cancelAnimationFrame(raf);
      vegen.clear();
      sluitMenu();
    },
    opnieuw() { nieuwSpel(); },
    _toestand() {
      return { fase, modus, tegen: tegen.id, ronde, rondes: rondes.slice(), uitslag, rondeTijd: Math.round(rondeTijd * 10) / 10,
        tollen: tollen.map((T) => ({ x: Math.round(T.x), z: Math.round(T.z), spin: Math.round(T.spin), wiebel: Math.round(T.wiebel * 100) / 100, valt: T.valt || T.ligt })) };
    },
    _test: {
      zweep(i, dx, dz, kracht) { if (fase !== 'spel' || !tollen[i]) return false; const ok = zweep(tollen[i], dx, dz, kracht, speltijd, rondeTijd); if (ok) slagBeeld(tollen[i], kracht); return ok; },
      ruis(f) { ruis = f || Math.random; },
      // laat een tol omvallen (om de afloop te testen)
      val(i) { if (fase === 'spel' && tollen[i] && !tollen[i].valt) valOm(tollen[i], 'om'); }
    },
    // een hele partij in stilte: twee tegenstanders, of een 'speler' met een eigen manier van zwepen
    _sim(idA, idB) {
      const tA = typeof idA === 'object' ? idA : TEGENSTANDERS.find((x) => x.id === idA);
      const tB = typeof idB === 'object' ? idB : TEGENSTANDERS.find((x) => x.id === idB);
      const stand = [0, 0], duur = [];
      let tijd = 0;
      for (let r = 0; r < 9 && stand[0] < 2 && stand[1] < 2; r++) {
        const ts = [nieuweTol(0, -70, 62, tA.stijl, 1 + r), nieuweTol(1, 70, -62, tB.stijl, 4 + r)];
        ts.forEach((T) => { T.spin = 72; });
        let rt = 0;
        for (let n = 0; n < 120 * 180; n++) {
          tijd += DT; rt += DT;
          [tA, tB].forEach((t, i) => { const b = computerDenkt(ts[i], ts[1 - i], t, tijd, DT); if (b) zweep(ts[i], b.dx, b.dz, b.kracht, tijd, rt); });
          ts.forEach((T) => stapTol(T, DT, rt));
          botsTollen(ts[0], ts[1], null);
          const weg = ts.map((T) => Math.hypot(T.x, T.z) > R + 2 || T.spin <= 0);
          if (weg[0] || weg[1]) { if (weg[0] !== weg[1]) stand[weg[0] ? 1 : 0]++; break; }
        }
        duur.push(Math.round(rt));
      }
      return { winnaar: stand[0] >= 2 ? 0 : stand[1] >= 2 ? 1 : -1, stand, duur };
    }
  };
})();
