/* Triktrak, schermvullend: het spel met vijftien schijven en twee dobbelstenen, aan tafel in de voorkamer.
   Een opengeklapte triktrakkist van notenhout met ingelegde punten van ebben en rood, ivoren en ebben schijven,
   een leren beker en echte dobbelstenen. De regels en de tegenspelers staan in triktrakregels.js.

   Overgenomen van succesvolle backgammon-apps:
   - tik een schijf en zie meteen waar hij heen mag (ook met beide ogen tegelijk); tik de plek, of sleep;
   - wat niet mag, kan ook niet: alleen schijven die mogen bewegen, lichten op; zetten volgen de regel
     'zoveel mogelijk ogen gebruiken';
   - gebruikte dobbelstenen worden grijs; terugnemen kan tot je beurt voorbij is; een tip als je twijfelt;
   - tegenspelers met een gezicht, van makkelijk tot sterk: versla er een en de volgende komt vrij;
   - een partij tot 3 of 5 punten, met dubbel en driedubbel; de partij wordt bewaard als je even weggaat.
   Op een staande telefoon draait het bord een kwartslag, zodat de schijven groot genoeg blijven om te tikken. */
(function () {
  'use strict';
  const R = window.Triktrakregels;
  if (!R) return;
  const NS = 'http://www.w3.org/2000/svg';
  const OPSLAG = 'speelhuys.triktrak';

  // Het bord in liggende maten (1000 x 720): rand, twee helften met elk zes punten boven en onder,
  // de scharnierlat (bar) in het midden en rechts de bak voor uitgenomen schijven.
  const LB = 1000, LH = 720, F = 30, PW = 68, BAR0 = 438, BAR1 = 482, RECHTS1 = 890, BAK0 = 904, BAK1 = 970;
  const BOVEN = F, ONDER = LH - F, MID = LH / 2, PL = 270, RS = 30;

  // ============================================================
  // TEGENSPELERS
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', naam: 'Jantje', niveau: 1, beloning: 25, denk: { ruis: 0.9, tijd: 300 },
      zegt: { start: ['Ik gooi dubbel zes!', 'Triktrak kan ik best!'], slaat: ['Hap!', 'Naar de bar!'], geslagen: ['Hé, mijn schijf!', 'Oeps!'], dubbel: ['Dubbel!', 'Vier keer!'], wint: ['Hoera, gewonnen!'], verliest: ['Nog een keer?', 'Jij bent goed!'] } },
    { id: 'grietje', naam: 'Grietje', niveau: 2, beloning: 40, denk: { ruis: 0.28, tijd: 400 },
      zegt: { start: ['Zullen we?', 'Pas op je losse schijven!'], slaat: ['Die is voor mij.', 'Dank je wel!'], geslagen: ['Ach, mijn schijf.', 'Slim hoor.'], dubbel: ['Kijk eens!', 'Dubbel!'], wint: ['Gewonnen!'], verliest: ['Goed gespeeld!'] } },
    { id: 'kees', naam: 'Molenaar Kees', niveau: 3, beloning: 60, denk: { ruis: 0.04, tijd: 600 },
      zegt: { start: ['Rustig aan, punt voor punt.', 'Daar gaan we.'], slaat: ['Zo maalt de molen.', 'Terug naar af.'], geslagen: ['Hm, slim.', 'Die zag ik niet.'], dubbel: ['Wind in de wieken!'], wint: ['Fijngemalen!'], verliest: ['Knap gedaan!'] } },
    { id: 'burgemeester', naam: 'De burgemeester', niveau: 4, beloning: 90, denk: { ruis: 0, vooruit: 1, kandidaten: 8, tijd: 1500 },
      zegt: { start: ['Welaan.', 'Ik speel om te winnen.'], slaat: ['Zo gaat dat.', 'Precies volgens plan.'], geslagen: ['Brutaal!', 'Hm.'], dubbel: ['Uiteraard.'], wint: ['De stad is van mij.'], verliest: ['Petje af!'] } }
  ];
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];

  // gezichten: de tegenspelers uit Personen, en een schijf voor jezelf
  const schijfGezicht = (kant) => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${kant ? '#8A7458' : '#4E3520'}"/>
    <circle cx="34" cy="37" r="22" fill="#000" opacity=".32"/>
    <circle cx="32" cy="32" r="22" fill="url(#tt-mini-${kant ? 'zwart' : 'wit'})"/>
    <circle cx="32" cy="32" r="17" fill="none" stroke="${kant ? 'rgba(255,240,220,.2)' : 'rgba(110,80,40,.38)'}" stroke-width="1.4"/>
    <circle cx="32" cy="32" r="10" fill="none" stroke="${kant ? 'rgba(255,240,220,.16)' : 'rgba(110,80,40,.3)'}" stroke-width="1.2"/>
    <ellipse cx="24.5" cy="23.5" rx="7.5" ry="3.4" fill="#fff" opacity="${kant ? 0.2 : 0.55}" transform="rotate(-32 24.5 23.5)"/></svg>`;
  const gezicht = Object.assign({}, window.Personen ? Personen.gezicht : {}, { wit: schijfGezicht(0), zwart: schijfGezicht(1) });

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, svg, doek, lagen = {}, ui = {}, gebouwd = false, staand = false;
  let tegen = TEGENSTANDERS[0];          // null = met z'n tweeën
  let variant = 'gewoon', lengte = 3;
  let partij = { score: [0, 0], nr: 0 };
  let st = R.beginStand('gewoon');
  let fase = 'klaar';                    // opening | gooien | zetten | klaar | denkt | bezig | uitslag | einde
  let gekozen = null, doelen = null, geschiedenis = [], beurtMemo = new Map(), tipPad = null;
  let spelId = 0, druk = null, autoKlaar = 0, dobbelKant = 0, dobbelWaarden = [], eersteLes = false;
  const stapels = {};                    // plek -> lijst schijf-elementen (onderste eerst)
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 60) : ms));
  const mens = (kant) => !tegen || kant === 0;
  const naamVan = (kant) => (tegen ? (kant === 0 ? 'Jij' : tegen.naam) : (kant === 0 ? 'Wit' : 'Zwart'));
  const gewonnen = () => (window.Duiten ? Duiten.veld('trik-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;

  // ============================================================
  // MATEN: liggend getekend; staand een kwartslag gedraaid
  // ============================================================
  const M = (x, y) => (staand ? [LH - y, x] : [x, y]);
  const terugM = (X, Y) => (staand ? [Y, LH - X] : [X, Y]);
  const VB = () => (staand ? [LH, LB] : [LB, LH]);
  function puntX(k) { // k = punt 1..24 gezien vanuit wit
    if (k <= 6) return RECHTS1 - PW * (k - 0.5);
    if (k <= 12) return BAR0 - PW * (k - 6 - 0.5);
    if (k <= 18) return F + PW * (k - 13 + 0.5);
    return BAR1 + PW * (k - 19 + 0.5);
  }
  const onderRij = (k) => k <= 12;
  const tussenruimte = (n) => (n <= 5 ? 54 : Math.max(15, 240 / (n - 1)));
  // het midden van de j-de schijf (van n) op een plek, in liggende maten
  function plekXY(plek, j, n) {
    if (typeof plek === 'number') {
      const k = plek + 1, x = puntX(k), d = tussenruimte(n);
      return onderRij(k) ? [x, ONDER - RS - j * d] : [x, BOVEN + RS + j * d];
    }
    const s = n <= 4 ? 54 : Math.max(16, 150 / (n - 1)), bx = (BAK0 + BAK1) / 2, dik = 10.5;
    if (plek === 'bar0') return [(BAR0 + BAR1) / 2, MID - 58 - j * s];
    if (plek === 'bar1') return [(BAR0 + BAR1) / 2, MID + 58 + j * s];
    if (plek === 'af0') return [bx, ONDER - 9 - j * dik];
    if (plek === 'af1') return [bx, BOVEN + 9 + j * dik];
    if (plek === 'w0') return [bx, MID - 16 - j * dik];
    return [bx, MID + 16 + j * dik];
  }
  const isPlak = (plek) => typeof plek === 'string' && (plek[0] === 'a' || plek[0] === 'w');
  // regel-plekken (index, 'bar', 'wacht', 'af') naar tekenplekken (per kant)
  const tekenPlek = (p, kant) => (typeof p === 'number' ? p : p === 'bar' ? 'bar' + kant : p === 'af' ? 'af' + kant : 'w' + kant);
  // het driehoekje van een punt, in liggende maten
  function puntHoeken(k) {
    const x = puntX(k);
    return onderRij(k) ? [[x - PW / 2, ONDER], [x + PW / 2, ONDER], [x, ONDER - PL]] : [[x - PW / 2, BOVEN], [x + PW / 2, BOVEN], [x, BOVEN + PL]];
  }
  const punten = (lijst) => lijst.map(([x, y]) => M(x, y).map((v) => v.toFixed(1)).join(',')).join(' ');
  // waar liggen de dobbelstenen van een kant (liggend): wit rechts in het midden, zwart links
  function dobbelPlekken(kant, n) {
    const cx = kant === 0 ? (BAR1 + RECHTS1) / 2 : (F + BAR0) / 2, d = n === 4 ? 82 : 112;
    return Array.from({ length: n }, (_, i) => [cx + (i - (n - 1) / 2) * d, MID]);
  }

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('tt-podium');
    podium.innerHTML = '';
    podium.appendChild(html(`<svg class="mo-defs" width="0" height="0" aria-hidden="true"><defs>
      <radialGradient id="tt-mini-wit" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFFDF6"/><stop offset=".65" stop-color="#E6DCC6"/><stop offset="1" stop-color="#B9AD92"/></radialGradient>
      <radialGradient id="tt-mini-zwart" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#6A5F57"/><stop offset=".65" stop-color="#2C2522"/><stop offset="1" stop-color="#151110"/></radialGradient>
    </defs></svg>`));
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="mo-stapels tt-stand"></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenspeler" title="Kies je tegenspeler" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="tt-bordvak"><canvas class="tt-hout" aria-hidden="true"></canvas>
      <div class="tt-dobbels" aria-hidden="true"></div><div class="mo-banier" aria-hidden="true" hidden></div><div class="mo-vonken" aria-hidden="true"></div>
      <div class="tt-uitslag" role="dialog" aria-modal="false" aria-label="Uitslag" hidden>
        <p class="tt-uitslag-kop"></p><p class="tt-uitslag-sub"></p>
        <p class="tt-uitslag-stand"><span class="tt-s0"></span><span class="tt-s-tot"></span><span class="tt-s1"></span></p>
        <button class="knop tt-volgend" type="button">${icoon('pijl')}<span>Volgend spel</span></button>
      </div></div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="mo-stapels tt-stand"></span>
        <span class="mo-ballon" hidden></span>
      </div>
      <button class="mo-knop mo-terug" type="button" aria-label="Zet terugnemen" title="Zet terugnemen">${icoon('terugzet')}</button>
      <button class="mo-knop mo-tip" type="button" aria-label="Tip" title="Tip">${icoon('tip')}</button>
      <button class="gb-beker tt-beker" type="button" aria-label="Schud de beker en gooi" title="Gooi">
        <svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="19" ry="4" fill="rgba(0,0,0,.35)"/><path d="M13 13 L51 13 L45.5 55 Q32 59.5 18.5 55 Z" fill="#7A4424" stroke="#2A160A" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 22 H48 M18 46 H46" stroke="#D9A64A" stroke-width="3"/><path d="M20 14 L24 54" stroke="#fff" stroke-opacity=".16" stroke-width="4"/><ellipse cx="32" cy="13" rx="19" ry="5.5" fill="#3A1E0C" stroke="#2A160A" stroke-width="2.2"/></svg>
        <span class="gb-beker-tekst">Gooi</span>
      </button>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenspeler" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Tegen wie speel je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders"></div>
        <div class="tt-keuzes">
          <div class="tt-keuzerij" role="group" aria-label="Opzet"><button class="kj-chip" type="button" data-variant="gewoon">Gewoon</button><button class="kj-chip" type="button" data-variant="hollands">Hollands</button></div>
          <div class="tt-keuzerij" role="group" aria-label="Partij"><button class="kj-chip" type="button" data-lengte="3">Tot 3</button><button class="kj-chip" type="button" data-lengte="5">Tot 5</button></div>
        </div>
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
      bordvak: midden.querySelector('.tt-bordvak'), midden, banier: midden.querySelector('.mo-banier'), vonken: midden.querySelector('.mo-vonken'),
      dobbels: midden.querySelector('.tt-dobbels'), uitslag: midden.querySelector('.tt-uitslag'),
      terug: onder.querySelector('.mo-terug'), tip: onder.querySelector('.mo-tip'), beker: onder.querySelector('.tt-beker'), menu, meld,
      lijst: menu.querySelector('.mo-tegenstanders')
    };
    doek = midden.querySelector('.tt-hout');
    svg = el('svg', { class: 'tt-bord', role: 'img', 'aria-label': 'Het triktrakbord' });
    ui.bordvak.insertBefore(svg, ui.dobbels);
    lagen.defs = el('defs', {}, svg);
    lagen.punten = el('g', { class: 'tt-punten' }, svg);
    lagen.merk = el('g', { class: 'tt-merk' }, svg);
    lagen.schijven = el('g', { class: 'tt-schijven' }, svg);
    lagen.boven = el('g', { class: 'tt-bovenop' }, svg);
    kleurSchijven();
    maakDobbels();

    boven.querySelector('.mo-speler').addEventListener('click', openMenu);
    boven.querySelector('.mo-meer').addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('triktrak'); });
    ui.terug.addEventListener('click', neemTerug);
    ui.tip.addEventListener('click', geefTip);
    ui.uitslag.querySelector('.tt-volgend').addEventListener('click', volgendSpel);
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    menu.querySelectorAll('[data-variant]').forEach((c) => c.addEventListener('click', () => {
      if (variant === c.getAttribute('data-variant')) return;
      variant = c.getAttribute('data-variant');
      if (window.Duiten) Duiten.zetVeld('trik-variant', variant);
      werkSchakelaars(); sluitMenu(); nieuwePartij();
    }));
    menu.querySelectorAll('[data-lengte]').forEach((c) => c.addEventListener('click', () => {
      if (lengte === +c.getAttribute('data-lengte')) return;
      lengte = +c.getAttribute('data-lengte');
      if (window.Duiten) Duiten.zetVeld('trik-lengte', lengte);
      werkSchakelaars(); sluitMenu(); nieuwePartij();
    }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    // de beker: ingedrukt houden is schudden, loslaten is gooien
    const b = ui.beker;
    b.addEventListener('pointerdown', (e) => { if (!b.disabled) { e.preventDefault(); b.classList.add('schudt'); if (Geluid.schud) Geluid.schud(); } });
    const los = () => { if (b.classList.contains('schudt')) { b.classList.remove('schudt'); gooiMens(); } };
    b.addEventListener('pointerup', los);
    b.addEventListener('pointerleave', los);
    b.addEventListener('pointercancel', los);
    b.addEventListener('click', (e) => { if (e.detail === 0 && !b.disabled) gooiMens(); });
    svg.addEventListener('pointerdown', neer);
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', loslaten);
    svg.addEventListener('pointercancel', () => { annuleerSleep(); });

    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    gebouwd = true;
  }

  // Het bord zo groot mogelijk in het midden; staand een kwartslag gedraaid
  const DWARS = '(orientation: landscape) and (max-height: 620px)';
  function pasMaatAan() {
    if (!ui.midden) return;
    let b, h;
    if (window.matchMedia && window.matchMedia(DWARS).matches) {
      const p = podium.getBoundingClientRect(), cs = getComputedStyle(podium);
      if (!p.width || !p.height) return;
      const hoog = p.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
      const breed = p.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * 150 - 24;
      staand = false;
      h = Math.min(hoog, breed * LH / LB); b = h * LB / LH;
    } else {
      const r = ui.midden.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const rb = r.width - (r.width < 500 ? 4 : 12), rh = r.height - 8;
      // staand als het bord zo groter wordt (telefoon rechtop)
      const liggend = Math.min(rb, rh * LB / LH), rechtop = Math.min(rh, rb * LB / LH);
      staand = rechtop > liggend * 1.12;
      if (staand) { h = Math.min(rh, rb * LB / LH, 1100); b = h * LH / LB; } else { b = Math.min(liggend, 1100); h = b * LH / LB; }
    }
    b = Math.floor(b); h = Math.floor(h);
    const was = podium.classList.contains('tt-staand');
    podium.classList.toggle('tt-staand', staand);
    podium.style.setProperty('--tt-b', b + 'px');
    podium.style.setProperty('--tt-h', h + 'px');
    const [vw, vh] = VB();
    svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    if (was !== staand || !lagen.punten.firstChild) tekenPunten();
    plaatsAlles(false);
    zetDobbels(false);
    tekenMerk();
    requestAnimationFrame(tekenHout);
  }

  // ============================================================
  // HET HOUT: een opengeklapte triktrakkist, één keer getekend op een canvas
  // ============================================================
  function tekenHout() {
    if (!doek || !ui.bordvak) return;
    const r = ui.bordvak.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const bw = Math.round(r.width * dpr), bh = Math.round(r.height * dpr);
    if (!bw || !bh || (doek.width === bw && doek.height === bh && doek.dataset.staand === String(staand))) return;
    doek.width = bw; doek.height = bh; doek.dataset.staand = String(staand);
    const g = doek.getContext('2d');
    if (!g) return;
    const k = bw / VB()[0];
    // liggend tekenen; staand met een kwartslag
    if (staand) g.setTransform(0, k, -k, 0, LH * k, 0); else g.setTransform(k, 0, 0, k, 0, 0);
    let zaad = 1659;
    const rnd = () => { zaad = (zaad * 16807) % 2147483647; return (zaad - 1) / 2147483646; };
    const rond = (x, y, b, h, rr) => { g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + b, y, x + b, y + h, rr); g.arcTo(x + b, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + b, y, rr); g.closePath(); };
    const nerf = (x, y, b, h, n, licht, donker, liggend) => {
      g.save(); g.beginPath(); g.rect(x, y, b, h); g.clip();
      for (let i = 0; i < n; i++) {
        const t = rnd(), a = 0.05 + rnd() * 0.12;
        g.strokeStyle = rnd() < 0.35 ? `rgba(${licht},${a})` : `rgba(${donker},${a})`;
        g.lineWidth = 0.5 + rnd() * 1.3;
        g.beginPath();
        if (liggend) {
          const yy = y + t * h, golf = 2 + rnd() * 5;
          g.moveTo(x, yy);
          for (let xx = x; xx <= x + b; xx += 40) g.lineTo(xx, yy + Math.sin(xx / (60 + rnd() * 40) + t * 9) * golf);
        } else {
          const xx = x + t * b, golf = 2 + rnd() * 4;
          g.moveTo(xx, y);
          for (let yy = y; yy <= y + h; yy += 40) g.lineTo(xx + Math.sin(yy / (60 + rnd() * 40) + t * 9) * golf, yy);
        }
        g.stroke();
      }
      g.restore();
    };
    // de kist van notenhout
    const kist = g.createLinearGradient(0, 0, LB, LH);
    kist.addColorStop(0, '#62401F'); kist.addColorStop(0.5, '#4B2E16'); kist.addColorStop(1, '#33200E');
    g.fillStyle = kist; rond(0, 0, LB, LH, 22); g.fill();
    g.save(); rond(0, 0, LB, LH, 22); g.clip();
    nerf(0, 0, LB, LH, 120, '150,105,60', '20,10,4', true);
    g.restore();
    // de twee speelvelden van licht palmhout, verdiept in de kist
    [[F, BAR0 - F], [BAR1, RECHTS1 - BAR1]].forEach(([x, b]) => {
      const vlak = g.createLinearGradient(x, BOVEN, x + b, ONDER);
      vlak.addColorStop(0, '#EEDDB6'); vlak.addColorStop(0.5, '#E4CF9F'); vlak.addColorStop(1, '#D6BC86');
      g.fillStyle = vlak; g.fillRect(x, BOVEN, b, ONDER - BOVEN);
      nerf(x, BOVEN, b, ONDER - BOVEN, 70, '255,245,220', '120,85,40', false);
      // een zachte schaduw langs de bovenrand en de linkerrand: het veld ligt dieper
      const sch = g.createLinearGradient(x, BOVEN, x, BOVEN + 26);
      sch.addColorStop(0, 'rgba(40,22,8,.34)'); sch.addColorStop(1, 'rgba(40,22,8,0)');
      g.fillStyle = sch; g.fillRect(x, BOVEN, b, 26);
      const sch2 = g.createLinearGradient(x, 0, x + 20, 0);
      sch2.addColorStop(0, 'rgba(40,22,8,.28)'); sch2.addColorStop(1, 'rgba(40,22,8,0)');
      g.fillStyle = sch2; g.fillRect(x, BOVEN, 20, ONDER - BOVEN);
    });
    // de punten: ingelegd ebben en rood, met een dun biesje
    for (let k = 1; k <= 24; k++) {
      const [a, b, c] = puntHoeken(k);
      const rood = onderRij(k) ? k % 2 === 1 : k % 2 === 0;
      const kl = g.createLinearGradient(c[0], a[1], c[0], c[1]);
      if (rood) { kl.addColorStop(0, '#A63223'); kl.addColorStop(1, '#7E2418'); } else { kl.addColorStop(0, '#2F2721'); kl.addColorStop(1, '#1D1713'); }
      g.fillStyle = kl;
      g.beginPath(); g.moveTo(a[0] + 2, a[1]); g.lineTo(b[0] - 2, b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(232,206,150,.55)'; g.lineWidth = 1.2; g.stroke();
      // een fijne nerf in het inlegwerk
      g.save(); g.clip();
      for (let i = 0; i < 6; i++) {
        g.strokeStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`; g.lineWidth = 0.8;
        const xx = c[0] + (rnd() - 0.5) * PW * 0.6;
        g.beginPath(); g.moveTo(xx, a[1]); g.lineTo(xx + (rnd() - 0.5) * 6, c[1]); g.stroke();
      }
      g.restore();
    }
    // de scharnierlat met twee koperen scharnieren
    const lat = g.createLinearGradient(BAR0, 0, BAR1, 0);
    lat.addColorStop(0, '#3A2312'); lat.addColorStop(0.5, '#5A3A1E'); lat.addColorStop(1, '#3A2312');
    g.fillStyle = lat; g.fillRect(BAR0, BOVEN - 6, BAR1 - BAR0, ONDER - BOVEN + 12);
    [150, LH - 150].forEach((y) => {
      const kop = g.createLinearGradient(BAR0 + 6, y - 30, BAR1 - 6, y + 30);
      kop.addColorStop(0, '#F6DC97'); kop.addColorStop(0.45, '#C9973F'); kop.addColorStop(1, '#71501E');
      g.fillStyle = kop; rond(BAR0 + 7, y - 34, BAR1 - BAR0 - 14, 68, 5); g.fill();
      g.fillStyle = 'rgba(60,40,10,.55)';
      [-20, 0, 20].forEach((dy) => { g.beginPath(); g.arc((BAR0 + BAR1) / 2, y + dy, 2.6, 0, Math.PI * 2); g.fill(); });
    });
    // de bak voor uitgenomen schijven, verdiept, met een tussenlat
    g.fillStyle = '#2A190C'; g.fillRect(BAK0, BOVEN, BAK1 - BAK0, ONDER - BOVEN);
    const bak = g.createLinearGradient(BAK0, 0, BAK1, 0);
    bak.addColorStop(0, 'rgba(0,0,0,.55)'); bak.addColorStop(0.3, 'rgba(0,0,0,.1)'); bak.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = bak; g.fillRect(BAK0, BOVEN, BAK1 - BAK0, ONDER - BOVEN);
    g.fillStyle = '#4B2E16'; g.fillRect(BAK0, MID - 3, BAK1 - BAK0, 6);
    // koperen hoekjes op de kist
    [[0, 0], [LB, 0], [0, LH], [LB, LH]].forEach(([x, y]) => {
      const sx = x ? -1 : 1, sy = y ? -1 : 1;
      const kop = g.createLinearGradient(x, y, x + sx * 40, y + sy * 40);
      kop.addColorStop(0, '#F6DC97'); kop.addColorStop(0.5, '#C9973F'); kop.addColorStop(1, '#71501E');
      g.fillStyle = kop;
      g.beginPath(); g.moveTo(x + sx * 4, y + sy * 4); g.lineTo(x + sx * 44, y + sy * 4); g.lineTo(x + sx * 4, y + sy * 44); g.closePath(); g.fill();
      g.fillStyle = 'rgba(60,40,10,.6)'; g.beginPath(); g.arc(x + sx * 14, y + sy * 14, 2.4, 0, Math.PI * 2); g.fill();
    });
  }

  // De raakvlakken van de punten (onzichtbaar) en de plek voor oplichtende doelen
  function tekenPunten() {
    lagen.punten.innerHTML = '';
    for (let k = 1; k <= 24; k++) el('polygon', { points: punten(puntHoeken(k)), class: 'tt-punt', 'data-punt': k - 1 }, lagen.punten);
  }

  // ============================================================
  // SCHIJVEN
  // ============================================================
  function schijfStijl() { return window.Pronk ? Pronk.stijl('stenen') : { wit: ['#FFFDF6', '#E6DCC6', '#B9AD92', '#8D8167'], zwart: ['#6A5F57', '#2C2522', '#151110', '#000'] }; }
  function kleurSchijven() {
    const s = schijfStijl();
    lagen.defs.innerHTML = ['wit', 'zwart'].map((k) => `<radialGradient id="tt-${k}" cx="38%" cy="32%" r="76%"><stop offset="0" stop-color="${s[k][0]}"/><stop offset=".62" stop-color="${s[k][1]}"/><stop offset="1" stop-color="${s[k][2]}"/></radialGradient>
      <linearGradient id="tt-${k}-rand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[k][2]}"/><stop offset="1" stop-color="${s[k][3]}"/></linearGradient>`).join('');
  }
  if (window.Pronk && Pronk.opWijziging) Pronk.opWijziging(() => { if (lagen.defs) kleurSchijven(); });
  function maakSchijf(kant) {
    const g = el('g', { class: 'tt-schijf ' + (kant ? 'zwart' : 'wit'), 'data-kant': kant });
    el('circle', { class: 'tt-schaduw', cx: 2.5, cy: 4.5, r: RS }, g);
    const b = el('g', { class: 'tt-binnen' }, g);
    el('circle', { r: RS, cy: 2.2, fill: `url(#tt-${kant ? 'zwart' : 'wit'}-rand)` }, b);
    el('circle', { r: RS - 0.6, fill: `url(#tt-${kant ? 'zwart' : 'wit'})`, class: 'tt-lijf' }, b);
    el('circle', { r: RS * 0.76, class: 'tt-groef' }, b);
    el('circle', { r: RS * 0.42, class: 'tt-groef' }, b);
    el('ellipse', { cx: -RS * 0.32, cy: -RS * 0.36, rx: RS * 0.34, ry: RS * 0.15, class: 'tt-glans', transform: `rotate(-32 ${(-RS * 0.32).toFixed(1)} ${(-RS * 0.36).toFixed(1)})` }, b);
    // uitgenomen of nog naast het bord: een schijf op zijn kant
    el('rect', { class: 'tt-plak', x: -29, y: -4.7, width: 58, height: 9.4, rx: 3.6 }, g);
    lagen.schijven.appendChild(g);
    return g;
  }
  // Bouw de stapels opnieuw op uit de stand (bij een nieuw spel, laden of terugnemen)
  function bouwStapels(s) {
    lagen.schijven.innerHTML = '';
    Object.keys(stapels).forEach((k) => { delete stapels[k]; });
    const leg = (plek, kant, n) => { if (!stapels[plek]) stapels[plek] = []; for (let i = 0; i < n; i++) stapels[plek].push(maakSchijf(kant)); };
    for (let i = 0; i < 24; i++) if (s.bord[i]) leg(i, s.bord[i] > 0 ? 0 : 1, Math.abs(s.bord[i]));
    [0, 1].forEach((kant) => { leg('bar' + kant, kant, s.bar[kant]); leg('af' + kant, kant, s.af[kant]); leg('w' + kant, kant, s.wacht[kant]); });
    plaatsAlles(false);
  }
  const transformVan = (plek, j, n) => {
    const [x, y] = M(...plekXY(plek, j, n));
    return `translate(${x.toFixed(1)} ${y.toFixed(1)})${isPlak(plek) && staand ? ' rotate(90)' : ''}`;
  };
  function plaatsAlles(anim) {
    for (const plek in stapels) {
      const lijst = stapels[plek], n = lijst.length, plak = isPlak(plek);
      lijst.forEach((e, j) => {
        const t = transformVan(isNaN(+plek) ? plek : +plek, j, n);
        e.classList.toggle('plak', plak);
        if (e.getAttribute('transform') === t) return;
        const oud = e.getAttribute('transform');
        e.setAttribute('transform', t);
        if (anim && oud && !rustig() && e.animate) e.animate([{ transform: svgNaarCss(oud) }, { transform: svgNaarCss(t) }], { duration: 220, easing: 'ease-out' });
      });
      // de bovenste schijf ligt bovenop
      lijst.forEach((e) => lagen.schijven.appendChild(e));
    }
  }
  const svgNaarCss = (t) => t.replace(/translate\(([-\d.]+) ([-\d.]+)\)/, 'translate($1px, $2px)').replace(/rotate\(([-\d.]+)\)/, 'rotate($1deg)');
  const sleutelVan = (p, kant) => { const t = tekenPlek(p, kant); return typeof t === 'number' ? String(t) : t; };

  // Eén schijf van de ene naar de andere plek, met een boogje; geslagen schijven vliegen naar de bar
  async function verschuif(z, kant, opties) {
    const van = sleutelVan(z.van, kant), naar = sleutelVan(z.naar, kant);
    const lijst = stapels[van] || [];
    const e = lijst.pop();
    if (!e) return;
    if (!stapels[naar]) stapels[naar] = [];
    let geslagen = null;
    if (z.slaat) {
      geslagen = stapels[naar].pop();
      if (geslagen) { if (!stapels['bar' + (1 - kant)]) stapels['bar' + (1 - kant)] = []; stapels['bar' + (1 - kant)].push(geslagen); }
    }
    stapels[naar].push(e);
    const oud = e.getAttribute('transform');
    const nieuw = transformVan(isNaN(+naar) ? naar : +naar, stapels[naar].length - 1, stapels[naar].length);
    lagen.boven.appendChild(e);
    e.classList.toggle('plak', isPlak(naar));
    e.setAttribute('transform', nieuw);
    const duur = opties && opties.snel ? 220 : 380;
    if (!rustig() && e.animate) {
      const a = svgNaarCss(oud), b = svgNaarCss(nieuw);
      const lift = e.animate([{ transform: a }, { transform: b }], { duration: duur, easing: 'cubic-bezier(.3,.7,.25,1)' });
      const binnen = e.querySelector('.tt-binnen');
      if (binnen && binnen.animate) binnen.animate([{ transform: 'scale(1)' }, { transform: 'translateY(-10px) scale(1.12)', offset: 0.45 }, { transform: 'scale(1)' }], { duration: duur, easing: 'ease-out' });
      await lift.finished.catch(() => {});
    }
    Geluid.steen();
    // trillen alleen bij je eigen zetten (en als jij geslagen wordt)
    if (window.Tril && mens(kant)) Tril.tik();
    if (geslagen) {
      Geluid.pak();
      if (window.Tril && (mens(kant) || mens(1 - kant))) Tril.klik();
    }
    plaatsAlles(true);
  }

  // ============================================================
  // DOBBELSTENEN: echte kubusjes, zoals bij het ganzenbord
  // ============================================================
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const DRAAI = { 1: [0, 0], 2: [90, 0], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 6: [0, 180] };
  function maakDobbels() {
    ui.dobbels.innerHTML = '';
    ui.dob = [0, 1, 2, 3].map(() => {
      const d = document.createElement('div');
      d.className = 'gb-dob tt-dob';
      const k = document.createElement('div');
      k.className = 'gb-kubus';
      for (let v = 1; v <= 6; v++) {
        const z = document.createElement('i');
        z.className = 'gb-zijde z' + v;
        z.innerHTML = Array.from({ length: 9 }, (_, i) => (PIPS[v].includes(i) ? '<b></b>' : '<span></span>')).join('');
        k.appendChild(z);
      }
      d.appendChild(k);
      ui.dobbels.appendChild(d);
      return d;
    });
    kleurDobbels();
  }
  function kleurDobbels() {
    const s = window.Pronk ? Pronk.stijl('dobbels') : null;
    if (!s || !ui.dobbels) return;
    ui.dobbels.style.setProperty('--dob-a', s.a); ui.dobbels.style.setProperty('--dob-b', s.b);
    ui.dobbels.style.setProperty('--dob-c', s.c); ui.dobbels.style.setProperty('--dob-pip', s.pip);
  }
  if (window.Pronk && Pronk.opWijziging) Pronk.opWijziging(kleurDobbels);
  const schaal = () => (ui.bordvak.clientWidth || 300) / VB()[0];
  // zet de dobbelstenen van een kant op hun plek (zonder tuimelen); gebruikte ogen worden grijs
  function zetDobbels(tuimel) {
    if (!ui.dob) return;
    const n = dobbelWaarden.length, k = schaal(), maat = Math.round(58 * k);
    ui.dobbels.style.setProperty('--d', maat + 'px');
    ui.dobbels.classList.toggle('zichtbaar', n > 0);
    const plekken = dobbelPlekken(dobbelKant, n);
    // welke zijn al gebruikt? (de ogen die nog over zijn, tellen we af)
    const over = !lesSoort && st && st.worp && st.aan === dobbelKant && fase !== 'opening' ? st.over.slice() : null;
    ui.dob.forEach((d, i) => {
      if (i >= n) { d.style.display = 'none'; return; }
      d.style.display = '';
      const [x, y] = M(...plekken[i]);
      if (!tuimel) {
        d.getAnimations && d.getAnimations().forEach((a) => a.cancel());
        d.style.transform = `translate3d(${(x * k - maat / 2).toFixed(1)}px, ${(y * k - maat / 2).toFixed(1)}px, 0)`;
        const [rx, ry] = DRAAI[dobbelWaarden[i]];
        d.firstChild.getAnimations && d.firstChild.getAnimations().forEach((a) => a.cancel());
        d.firstChild.style.transform = `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      let gebruikt = false;
      if (over) { const w = over.indexOf(dobbelWaarden[i]); if (w >= 0) over.splice(w, 1); else gebruikt = true; }
      d.classList.toggle('gebruikt', gebruikt);
    });
  }
  // gooi: de stenen tuimelen vanaf de kant van wie gooit; de belofte is klaar vlak voor ze stilliggen
  function tuimel(kant, waarden) {
    dobbelKant = kant; dobbelWaarden = waarden.slice();
    const n = waarden.length, k = schaal(), maat = Math.round(58 * k);
    ui.dobbels.style.setProperty('--d', maat + 'px');
    ui.dobbels.classList.add('zichtbaar');
    const plekken = dobbelPlekken(kant, n);
    const duur = rustig() ? 1 : 900;
    ui.dob.forEach((d, i) => {
      d.classList.remove('gebruikt');
      if (i >= n) { d.style.display = 'none'; return; }
      d.style.display = '';
      const [ex, ey] = M(...plekken[i]).map((v) => v * k);
      // ze komen van de kant van de speler (staand van onder of boven, liggend ook)
      const H = ui.bordvak.clientHeight;
      const sx = ex + (i - (n - 1) / 2) * 20, sy = kant === 0 ? H + maat : -maat;
      const pos = (x, y, sch) => `translate3d(${(x - maat / 2).toFixed(1)}px, ${(y - maat / 2).toFixed(1)}px, 0) scale(${sch})`;
      const [rx, ry] = DRAAI[waarden[i]];
      if (rustig() || !d.animate) {
        d.style.transform = pos(ex, ey, 1);
        d.firstChild.style.transform = `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg)`;
        return;
      }
      d.style.transform = pos(ex, ey, 1);
      d.animate([
        { transform: pos(sx, sy, 1.4), opacity: 0.2 },
        { transform: pos((sx + ex) / 2 + (i % 2 ? 24 : -24), (sy + ey) / 2, 1.2), opacity: 1, offset: 0.35 },
        { transform: pos(ex + (i % 2 ? 12 : -12), ey - 6, 1), offset: 0.62 },
        { transform: pos(ex, ey - 10, 1.05), offset: 0.78 },
        { transform: pos(ex, ey, 1) }
      ], { duration: duur, easing: 'cubic-bezier(.25,.6,.35,1)' });
      d.firstChild.style.transform = `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg)`;
      const extraX = 720 + 360 * Math.floor(Math.random() * 2), extraY = 360 + 360 * Math.floor(Math.random() * 2);
      d.firstChild.animate([
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + extraX}deg) rotateY(${ry + extraY}deg) rotateZ(${(Math.random() * 180).toFixed(0)}deg)` },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + 60}deg) rotateY(${ry - 30}deg) rotateZ(10deg)`, offset: 0.6 },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg)` }
      ], { duration: duur, easing: 'cubic-bezier(.2,.65,.3,1)' });
    });
    Geluid.dobbel();
    if (window.Tril && mens(kant)) { setTimeout(() => Tril.tik(), duur * 0.55); setTimeout(() => Tril.tik(), duur * 0.8); }
    return wacht(duur * 0.85);
  }
  function dobbelsWeg() { dobbelWaarden = []; ui.dobbels.classList.remove('zichtbaar'); }

  // ============================================================
  // MARKERINGEN: wat mag bewegen, waar hij heen kan, een tip
  // ============================================================
  function tekenMerk() {
    if (!lagen.merk) return;
    lagen.merk.innerHTML = '';
    if (!st || lesSoort) return;
    const kant = st.aan;
    // de tip: lijnen van de zetten die Gijs aanraadt
    if (tipPad && fase === 'zetten') {
      tipPad.forEach((z) => {
        const a = midden(sleutelVan(z.van, kant), true), b = midden(sleutelVan(z.naar, kant), false);
        if (a && b) el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'tt-tiplijn' }, lagen.merk);
      });
    }
    if (fase !== 'zetten' || !mens(kant)) return;
    if (!gekozen) {
      // de bronnen die mogen
      const bronnen = new Set(stappenNu().map((z) => sleutelVan(z.van, kant)));
      for (const b of bronnen) {
        const p = midden(b, true);
        if (p) el('circle', { cx: p[0], cy: p[1], r: RS + 4, class: 'tt-kan' + (b.startsWith('bar') ? ' moet' : '') }, lagen.merk);
      }
      return;
    }
    // het gekozen schijfje en zijn doelen
    const p = midden(gekozen, true);
    if (p) el('circle', { cx: p[0], cy: p[1], r: RS + 5, class: 'tt-gekozen' }, lagen.merk);
    for (const [naar, pad] of doelen) {
      const sl = sleutelVan(naar, kant);
      if (sl.startsWith('af')) {
        const [x0, y0] = M(BAK0, kant === 0 ? MID : BOVEN), [x1, y1] = M(BAK1, kant === 0 ? ONDER : MID);
        el('rect', { x: Math.min(x0, x1), y: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0), rx: 8, class: 'tt-doelbak', 'data-naar': 'af' }, lagen.merk);
        continue;
      }
      const k = +sl + 1;
      el('polygon', { points: punten(puntHoeken(k)), class: 'tt-doelpunt' + (pad.length > 1 ? ' ver' : '') + (pad[pad.length - 1].slaat ? ' slaat' : '') }, lagen.merk);
      const n = (stapels[sl] || []).length, d = pad[pad.length - 1].slaat ? 0 : n;
      const [x, y] = M(...plekXY(+sl, d, Math.max(1, n + (pad[pad.length - 1].slaat ? 0 : 1))));
      el('circle', { cx: x, cy: y, r: RS * 0.42, class: 'tt-doel' + (pad[pad.length - 1].slaat ? ' slaat' : '') }, lagen.merk);
    }
  }
  // het midden van de bovenste schijf van een plek (of waar de volgende zou komen)
  function midden(sleutel, bovenste) {
    const lijst = stapels[sleutel] || [];
    const n = lijst.length, j = bovenste ? Math.max(0, n - 1) : n;
    return M(...plekXY(isNaN(+sleutel) ? sleutel : +sleutel, j, Math.max(1, bovenste ? n : n + 1)));
  }

  // ============================================================
  // SPELERSKAARTEN, MELDINGEN
  // ============================================================
  function werkKaartenBij() {
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k];
      const aan = (fase === 'gooien' || fase === 'zetten' || fase === 'klaar' || fase === 'denkt' || fase === 'bezig') && st.aan === k;
      kaart.classList.toggle('aan', aan);
      kaart.classList.toggle('denkt', fase === 'denkt' && st.aan === k && !mens(k));
      kaart.querySelector('.mo-gezicht').innerHTML = tegen ? (k === 0 ? gezicht.wit : gezicht[tegen.id]) : gezicht[k === 0 ? 'wit' : 'zwart'];
      kaart.querySelector('.mo-naam').textContent = naamVan(k);
      // de stand van de partij en hoeveel ogen je nog moet
      const stand = kaart.querySelector('.tt-stand');
      stand.innerHTML = `<b class="tt-punten" aria-label="${partij.score[k]} punten">${partij.score[k]}</b><small class="tt-pips" aria-label="nog ${R.pips(st, k)} ogen">${R.pips(st, k)}</small>`;
      const doe = kaart.querySelector('.mo-doe');
      let ik = '', woord = '';
      if (aan && mens(k)) {
        if (fase === 'gooien') { ik = 'dobbel'; woord = 'Gooi'; }
        else if (fase === 'zetten') { ik = 'zet'; woord = 'Zet'; }
        else if (fase === 'klaar') { ik = 'vink'; woord = 'Klaar'; }
      }
      if (aan && fase === 'denkt' && !mens(k)) doe.innerHTML = '<span class="mo-denk" aria-label="denkt na"><i></i><i></i><i></i></span>';
      else doe.innerHTML = woord ? `${icoon(ik)}<span>${woord}</span>` : '';
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-dobbel"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', tegen ? `Tegenspeler: ${tegen.naam}. Tik om te wisselen` : 'Met z\'n tweeën. Tik om te wisselen');
      } else kaart.setAttribute('aria-label', `${naamVan(0)}${woord ? ': ' + woord : ''}`);
    });
    const mijnBeurt = mens(st.aan) && (fase === 'zetten' || fase === 'klaar');
    ui.terug.disabled = !(mijnBeurt && geschiedenis.length);
    ui.tip.disabled = !(fase === 'zetten' && mens(st.aan) && !st.gezet.length);
    ui.beker.disabled = !(fase === 'gooien' && mens(st.aan));
    ui.beker.classList.toggle('klaar', fase === 'gooien' && mens(st.aan));
  }
  function zeg(kant, soort) {
    if (!tegen || kant !== 1) return;
    const b = ui.kaart[1].querySelector('.mo-ballon');
    b.textContent = willekeurig(tegen.zegt[soort] || ['…']);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(zeg.t);
    zeg.t = setTimeout(() => { b.hidden = true; }, soort === 'wint' || soort === 'verliest' ? 4200 : 2400);
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }
  function toonBanier(tekst, groot) {
    const b = ui.banier;
    b.textContent = tekst;
    b.classList.toggle('groot', !!groot);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(toonBanier.t);
    toonBanier.t = setTimeout(() => { b.hidden = true; }, groot ? 1700 : 1300);
  }
  function vonken(aantal) {
    if (rustig()) return;
    const r = ui.bordvak.getBoundingClientRect();
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (Math.random() * r.width) + 'px';
      v.style.top = (Math.random() * r.height) + 'px';
      ui.vonken.appendChild(v);
      const a = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(20 + Math.random() * 40).toFixed(0)}px)) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 400, easing: 'ease-out', fill: 'both' });
      a.onfinish = () => v.remove();
    }
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  const stappenNu = () => (st && st.worp ? R.stappen(st, beurtMemo) : []);
  // zolang Gijs uitlegt, wacht het spel (de computer zet niet tussendoor)
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  function wachtOpLes() {
    return new Promise((klaar) => {
      const l = document.getElementById('les');
      if (!l || l.hidden) { klaar(); return; }
      const mo = new MutationObserver(() => { if (l.hidden) { mo.disconnect(); setTimeout(klaar, 250); } });
      mo.observe(l, { attributes: true, attributeFilter: ['hidden'] });
    });
  }
  function nieuwePartij() {
    partij = { score: [0, 0], nr: 0 };
    nieuwSpel();
  }
  async function nieuwSpel() {
    spelId++;
    const mijnId = spelId;
    clearTimeout(autoKlaar);
    st = R.beginStand(variant);
    gekozen = null; doelen = null; geschiedenis = []; tipPad = null; beurtMemo = new Map();
    ui.uitslag.hidden = true;
    ui.banier.hidden = true;
    dobbelsWeg();
    bouwStapels(st);
    fase = 'opening';
    werkKaartenBij();
    tekenMerk();
    if (partij.nr === 0) zeg(1, 'start');
    meld(tegen ? `Nieuw spel tegen ${tegen.naam}. Jij speelt wit.` : 'Nieuw spel met z\'n tweeën.');
    await wacht(eersteLes ? 900 : 500);
    eersteLes = false;
    await wachtOpLes();
    if (mijnId !== spelId) return;
    // de openingsworp: ieder één steen; de hoogste begint
    let a, b;
    for (;;) {
      a = 1 + Math.floor(Math.random() * 6); b = 1 + Math.floor(Math.random() * 6);
      dobbelKant = 0;
      await tuimelOpening(a, b);
      if (mijnId !== spelId) return;
      if (a !== b) break;
      toonBanier('Gelijk, nog eens', false);
      await wacht(1100);
      if (mijnId !== spelId) return;
    }
    const begin = a > b ? 0 : 1;
    st.aan = begin;
    toonBanier(`${naamVan(begin)} begint`, false);
    meld(`${naamVan(begin)} begint.`);
    await wacht(1000);
    if (mijnId !== spelId) return;
    if (variant === 'hollands') {
      // in de Hollandse opzet gooit wie begint opnieuw
      dobbelsWeg();
      volgendeBeurt();
    } else {
      // wie begint, speelt met de twee openingsstenen
      st = R.rol(st, Math.max(a, b), Math.min(a, b));
      dobbelKant = begin; dobbelWaarden = [Math.max(a, b), Math.min(a, b)];
      zetDobbels(false);
      if (mens(begin)) beginZetten(); else computerBeurt(true);
    }
  }
  // de openingsstenen: één aan elke kant
  async function tuimelOpening(a, b) {
    const k = schaal(), maat = Math.round(58 * k), duur = rustig() ? 1 : 900;
    ui.dobbels.style.setProperty('--d', maat + 'px');
    ui.dobbels.classList.add('zichtbaar');
    dobbelWaarden = [];
    const plekken = [dobbelPlekken(0, 1)[0], dobbelPlekken(1, 1)[0]];
    [a, b].forEach((v, i) => {
      const d = ui.dob[i];
      d.style.display = ''; d.classList.remove('gebruikt');
      const [ex, ey] = M(...plekken[i]).map((q) => q * k);
      const [rx, ry] = DRAAI[v];
      d.style.transform = `translate3d(${(ex - maat / 2).toFixed(1)}px, ${(ey - maat / 2).toFixed(1)}px, 0)`;
      d.firstChild.style.transform = `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg)`;
      if (!rustig() && d.animate) {
        d.animate([{ transform: `translate3d(${(ex - maat / 2).toFixed(1)}px, ${(ey - maat / 2 + (i ? -60 : 60)).toFixed(1)}px, 0) scale(1.3)`, opacity: 0.2 }, { transform: d.style.transform, opacity: 1 }], { duration: duur, easing: 'cubic-bezier(.25,.6,.35,1)' });
        d.firstChild.animate([{ transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + 720}deg) rotateY(${ry + 360}deg)` }, { transform: d.firstChild.style.transform }], { duration: duur, easing: 'cubic-bezier(.2,.65,.3,1)' });
      }
    });
    ui.dob[2].style.display = 'none'; ui.dob[3].style.display = 'none';
    Geluid.dobbel();
    await wacht(duur + 250);
  }

  function volgendeBeurt() {
    gekozen = null; doelen = null; tipPad = null; geschiedenis = [];
    if (mens(st.aan)) {
      fase = 'gooien';
      werkKaartenBij();
      tekenMerk();
      meld(`${naamVan(st.aan)}: gooi de stenen.`);
    } else computerBeurt(false);
    bewaar();
  }
  async function gooiMens() {
    if (fase !== 'gooien' || !mens(st.aan)) return;
    const mijnId = spelId;
    fase = 'bezig';
    werkKaartenBij();
    ui.beker.classList.remove('gooit'); void ui.beker.offsetWidth; ui.beker.classList.add('gooit');
    const [a, b] = R.gooi();
    st = R.rol(st, a, b);
    beurtMemo = new Map();
    await tuimel(st.aan, a === b ? [a, a, a, a] : [a, b]);
    if (mijnId !== spelId) return;
    meld(`Gegooid: ${a} en ${b}.`);
    beginZetten();
  }
  function beginZetten() {
    geschiedenis = []; gekozen = null; doelen = null; tipPad = null;
    zetDobbels(false);
    if (!stappenNu().length) {
      fase = 'bezig';
      werkKaartenBij(); tekenMerk();
      toonBanier('Geen zet mogelijk', false);
      meld('Je kunt met deze worp niets zetten.');
      const mijnId = spelId;
      setTimeout(() => { if (mijnId === spelId) eindeBeurt(); }, rustig() ? 200 : 1500);
      return;
    }
    fase = 'zetten';
    werkKaartenBij();
    tekenMerk();
    bewaar();
  }

  // De computer gooit, denkt na in de achtergrond en zet zijn schijven één voor één
  async function computerBeurt(alGegooid) {
    const mijnId = spelId, kant = st.aan;
    fase = 'denkt';
    werkKaartenBij(); tekenMerk();
    await wacht(alGegooid ? 300 : 650);
    await wachtOpLes();
    if (mijnId !== spelId) return;
    if (!alGegooid) {
      const [a, b] = R.gooi();
      st = R.rol(st, a, b);
      await tuimel(kant, a === b ? [a, a, a, a] : [a, b]);
      if (mijnId !== spelId) return;
      if (a === b) zeg(kant, 'dubbel');
    }
    const t0 = Date.now();
    const rij = await R.denk(st, Object.assign({}, tegen ? tegen.denk : { ruis: 0.04 }));
    if (mijnId !== spelId) return;
    await wacht(Math.max(0, 550 - (Date.now() - t0)));
    if (mijnId !== spelId) return;
    if (!rij || !rij.length) {
      toonBanier(`${naamVan(kant)} kan niet zetten`, false);
      await wacht(1300);
      if (mijnId !== spelId) return;
    }
    fase = 'bezig';
    werkKaartenBij();
    for (const z of rij || []) {
      await wachtOpLes();
      if (mijnId !== spelId) return;
      st = R.doeStap(st, z);
      zetDobbels(false);
      await verschuif(z, kant);
      if (mijnId !== spelId) return;
      if (z.slaat) { zeg(kant, 'slaat'); meld(`${naamVan(kant)} slaat een schijf van je.`); }
      werkKaartenBij();
      await wacht(180);
      if (mijnId !== spelId) return;
    }
    eindeBeurt();
  }

  function eindeBeurt() {
    clearTimeout(autoKlaar);
    gekozen = null; doelen = null; tipPad = null; geschiedenis = [];
    if (st.klaar) { spelKlaar(); return; }
    st = R.wissel(st);
    beurtMemo = new Map();
    dobbelsWeg();
    volgendeBeurt();
  }

  // ---------- jij zet ----------
  function kies(sl) {
    gekozen = sl;
    // de regelplek van deze tekenplek
    const van = sl.startsWith('bar') ? 'bar' : sl.startsWith('w') ? 'wacht' : +sl;
    doelen = bestemmingen(van);
    if (!doelen.size) { gekozen = null; doelen = null; }
    if (Geluid.tik) Geluid.tik();
    tekenMerk();
  }
  // alle plekken waar deze schijf met één of meer ogen kan komen, met de zetten ernaartoe
  function bestemmingen(van) {
    const uit = new Map();
    const zoek = (s, plek, pad) => {
      for (const z of R.stappen(s, beurtMemo)) {
        if (z.van !== plek) continue;
        const nieuw = pad.concat([z]);
        const oud = uit.get(z.naar);
        const tussenSlaat = (p) => p.slice(0, -1).some((x) => x.slaat);
        if (!oud || nieuw.length < oud.length || (nieuw.length === oud.length && tussenSlaat(oud) && !tussenSlaat(nieuw))) uit.set(z.naar, nieuw);
        if (z.naar !== 'af') zoek(R.doeStap(s, z), z.naar, nieuw);
      }
    };
    zoek(st, van, []);
    return uit;
  }
  async function voerUit(pad) {
    const mijnId = spelId, kant = st.aan;
    fase = 'bezig';
    gekozen = null; doelen = null; tipPad = null;
    tekenMerk();
    for (const z of pad) {
      geschiedenis.push({ st, stapels: kopieStapels() });
      st = R.doeStap(st, z);
      zetDobbels(false);
      await verschuif(z, kant);
      if (mijnId !== spelId) return;
      if (z.slaat) { zeg(1 - kant, 'geslagen'); meld('Je slaat een schijf!'); }
    }
    if (R.beurtKlaar(st)) {
      fase = 'klaar';
      werkKaartenBij(); tekenMerk();
      if (st.klaar) { eindeBeurt(); return; }
      // even wachten, dan is de beurt voorbij (terugnemen kan nog)
      clearTimeout(autoKlaar);
      autoKlaar = setTimeout(() => { if (mijnId === spelId && fase === 'klaar') eindeBeurt(); }, rustig() ? 300 : 1300);
    } else {
      fase = 'zetten';
      werkKaartenBij(); tekenMerk();
    }
  }
  const kopieStapels = () => { const k = {}; for (const p in stapels) k[p] = stapels[p].slice(); return k; };
  function neemTerug() {
    if (!geschiedenis.length || !(fase === 'zetten' || fase === 'klaar') || !mens(st.aan)) return;
    clearTimeout(autoKlaar);
    const vorige = geschiedenis.pop();
    st = vorige.st;
    for (const p in stapels) delete stapels[p];
    for (const p in vorige.stapels) stapels[p] = vorige.stapels[p];
    plaatsAlles(true);
    Geluid.schuif();
    fase = 'zetten';
    gekozen = null; doelen = null;
    zetDobbels(false);
    werkKaartenBij(); tekenMerk();
  }
  // de tip: wat zou Kees spelen met deze worp?
  async function geefTip() {
    if (fase !== 'zetten' || !mens(st.aan) || st.gezet.length) return;
    const mijnId = spelId;
    ui.tip.disabled = true;
    const rij = await R.denk(st, { ruis: 0, tijd: 400 });
    if (mijnId !== spelId || fase !== 'zetten') return;
    tipPad = rij && rij.length ? rij : null;
    tekenMerk();
    if (tipPad) {
      // en kies alvast de eerste schijf
      kies(sleutelVan(tipPad[0].van, st.aan));
      tipPad = rij;
      tekenMerk();
    }
  }

  // ---------- tikken en slepen ----------
  function naarBord(px, py) {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = svg.createSVGPoint(); p.x = px; p.y = py;
    const q = p.matrixTransform(m.inverse());
    return terugM(q.x, q.y);
  }
  // wat ligt er onder de vinger (in liggende maten)?
  function plekBij(x, y) {
    if (x >= BAK0 - 8 && x <= BAK1 + 8 && y >= BOVEN - 8 && y <= ONDER + 8) return y < MID ? 'bakBoven' : 'bakOnder';
    if (x >= BAR0 - 4 && x <= BAR1 + 4) return y < MID ? 'barBoven' : 'barOnder';
    if (x >= F - 10 && x < BAR0) { const c = Math.min(5, Math.max(0, Math.floor((x - F) / PW))); return String((y > MID ? 12 - c : 13 + c) - 1); }
    if (x >= BAR1 && x < RECHTS1 + 10) { const c = Math.min(5, Math.max(0, Math.floor((x - BAR1) / PW))); return String((y > MID ? 6 - c : 19 + c) - 1); }
    return null;
  }
  // van een aangetikte plek naar een sleutel voor deze speler
  function bronVan(plek, kant) {
    if (!plek) return null;
    if (plek === 'barBoven') return kant === 0 ? 'bar0' : null;
    if (plek === 'barOnder') return kant === 1 ? 'bar1' : null;
    if (plek === 'bakBoven') return kant === 0 ? 'w0' : null;
    if (plek === 'bakOnder') return kant === 1 ? 'w1' : null;
    return plek;
  }
  function doelVan(plek, kant) {
    if (!plek || !doelen) return null;
    // uitnemen: tik ergens in de bak
    if (plek === 'bakBoven' || plek === 'bakOnder') return doelen.has('af') ? 'af' : null;
    const i = +plek;
    return isNaN(i) ? null : (doelen.has(i) ? i : null);
  }
  const magKiezen = (sl) => stappenNu().some((z) => sleutelVan(z.van, st.aan) === sl);
  function neer(e) {
    if (fase !== 'zetten' || !mens(st.aan)) return;
    const [x, y] = naarBord(e.clientX, e.clientY);
    const plek = plekBij(x, y), kant = st.aan;
    // eerst: is dit een doel van het gekozen schijfje?
    const doel = doelVan(plek, kant);
    if (gekozen && doel !== null) { e.preventDefault(); const pad = doelen.get(doel); voerUit(pad); return; }
    const bron = bronVan(plek, kant);
    if (bron && magKiezen(bron)) {
      e.preventDefault();
      if (gekozen !== bron) kies(bron);
      druk = { x: e.clientX, y: e.clientY, id: e.pointerId, bron, sleept: false, el: (stapels[bron] || [])[(stapels[bron] || []).length - 1] };
      try { svg.setPointerCapture(e.pointerId); } catch (f) { /* */ }
      return;
    }
    if (gekozen) { gekozen = null; doelen = null; tekenMerk(); }
    else if (plek && bron && !magKiezen(bron) && (stapels[bron] || []).some((s) => +s.getAttribute('data-kant') === kant)) fout();
  }
  function beweeg(e) {
    if (!druk || e.pointerId !== druk.id) return;
    const dx = e.clientX - druk.x, dy = e.clientY - druk.y;
    if (!druk.sleept && Math.hypot(dx, dy) > 8) { druk.sleept = true; if (druk.el) { lagen.boven.appendChild(druk.el); druk.el.classList.add('zweeft'); } }
    if (druk.sleept && druk.el) {
      const m = svg.getScreenCTM(), p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(m.inverse());
      druk.el.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
    }
  }
  function loslaten(e) {
    if (!druk || e.pointerId !== druk.id) return;
    const d = druk; druk = null;
    if (!d.sleept) return;
    const [x, y] = naarBord(e.clientX, e.clientY);
    const doel = doelVan(plekBij(x, y), st.aan);
    if (d.el) d.el.classList.remove('zweeft');
    if (doel !== null && doelen) { const pad = doelen.get(doel); plaatsAlles(false); voerUit(pad); return; }
    plaatsAlles(true);
  }
  function annuleerSleep() {
    if (druk && druk.el) druk.el.classList.remove('zweeft');
    druk = null;
    if (lagen.schijven) plaatsAlles(true);
  }
  function fout() {
    if (window.Tril) Tril.fout();
    Geluid.pak();
    // laat even zien welke schijven wel mogen
    lagen.merk.classList.remove('flits'); void lagen.merk.getBoundingClientRect(); lagen.merk.classList.add('flits');
  }

  // ---------- het einde van een spel en van de partij ----------
  function spelKlaar() {
    fase = 'uitslag';
    dobbelsWeg();
    const u = R.uitslag(st), w = u.winnaar;
    partij.score[w] += u.punten;
    partij.nr++;
    werkKaartenBij(); tekenMerk();
    const soortTekst = u.punten === 3 ? 'Driedubbel!' : u.punten === 2 ? 'Dubbel!' : '';
    const ikWin = w === 0 || !tegen;
    toonBanier(soortTekst || (ikWin && tegen ? 'Gewonnen!' : `${naamVan(w)} wint`), ikWin);
    if (ikWin) { Geluid.tada(); vonken(u.punten * 14); } else Geluid.jammer();
    const klaar = partij.score[w] >= lengte;
    meld(`${naamVan(w)} wint ${u.punten === 1 ? 'een punt' : u.punten + ' punten'}. Stand ${partij.score[0]} tegen ${partij.score[1]}.`);
    bewaar();
    const mijnId = spelId;
    setTimeout(() => {
      if (mijnId !== spelId) return;
      if (klaar) { partijKlaar(w); return; }
      // het kaartje met de stand
      ui.uitslag.querySelector('.tt-uitslag-kop').textContent = w === 0 && tegen ? 'Jij wint!' : `${naamVan(w)} wint`;
      ui.uitslag.querySelector('.tt-uitslag-sub').textContent = u.punten === 3 ? 'Driedubbel: 3 punten' : u.punten === 2 ? 'Dubbel: 2 punten' : '1 punt';
      ui.uitslag.querySelector('.tt-s0').textContent = `${naamVan(0)} ${partij.score[0]}`;
      ui.uitslag.querySelector('.tt-s1').textContent = `${partij.score[1]} ${naamVan(1)}`;
      ui.uitslag.querySelector('.tt-s-tot').textContent = `tot ${lengte}`;
      ui.uitslag.hidden = false;
      ui.uitslag.classList.remove('in'); void ui.uitslag.offsetWidth; ui.uitslag.classList.add('in');
      ui.uitslag.querySelector('.tt-volgend').focus({ preventScroll: true });
    }, rustig() ? 200 : 1600);
  }
  function volgendSpel() { ui.uitslag.hidden = true; nieuwSpel(); }
  function partijKlaar(w) {
    fase = 'einde';
    werkKaartenBij();
    const ikWin = w === 0, tegenComputer = !!tegen;
    let bedrag, tekst, verder = null;
    if (!tegenComputer) {
      bedrag = 20; tekst = `${naamVan(w)} wint de partij!`;
      Geluid.tada(); vonken(30);
    } else if (ikWin) {
      const telling = gewonnen();
      const eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('trik-gewonnen', telling);
      bedrag = tegen.beloning; tekst = `Gewonnen van ${tegen.naam}!`;
      if (window.Tril) Tril.succes();
      zeg(1, 'verliest');
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} is vrij!`;
        verder = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('trik-tegen', volgende.id); nieuwePartij(); } };
      }
    } else {
      bedrag = 10; tekst = `${tegen.naam} won. Goed geprobeerd!`;
      zeg(1, 'wint');
    }
    meld(tekst);
    partij = { score: [0, 0], nr: 0 };
    try { localStorage.removeItem(OPSLAG); } catch (e) { /* */ }
    if (window.Duiten) Duiten.beloon({ spel: 'triktrak', bedrag, gewonnen: ikWin || !tegenComputer, tekst, verder, wacht: 800 });
    // na de beloning (of meteen, zonder beloning) een nieuwe partij klaarzetten
    const mijnId = spelId;
    setTimeout(() => { if (mijnId === spelId && fase === 'einde') nieuwePartij(); }, rustig() ? 400 : 2600);
  }

  // ---------- bewaren ----------
  function bewaar() {
    try {
      if (fase === 'einde') return;
      // bewaar de stand aan het begin van de beurt (met de worp als jij al gooide)
      const s = geschiedenis.length ? geschiedenis[0].st : st;
      localStorage.setItem(OPSLAG, JSON.stringify({ tegen: tegen ? tegen.id : 'twee', variant, lengte, score: partij.score, nr: partij.nr, st: { bord: s.bord, bar: s.bar, af: s.af, wacht: s.wacht, variant: s.variant, aan: s.aan, worp: mens(s.aan) && fase !== 'gooien' ? s.worp : null } }));
    } catch (e) { /* geen opslag */ }
  }
  function laad() {
    try {
      const d = JSON.parse(localStorage.getItem(OPSLAG) || 'null');
      if (!d || !d.st || !Array.isArray(d.st.bord) || d.st.bord.length !== 24) return null;
      const s = R.beginStand(d.st.variant === 'hollands' ? 'hollands' : 'gewoon');
      s.bord = d.st.bord.map((v) => v | 0); s.bar = d.st.bar.map((v) => v | 0); s.af = d.st.af.map((v) => v | 0); s.wacht = d.st.wacht.map((v) => v | 0);
      s.aan = d.st.aan === 1 ? 1 : 0;
      if (R.telStenen(s, 0) !== 15 || R.telStenen(s, 1) !== 15 || s.af[0] === 15 || s.af[1] === 15) return null;
      const worp = Array.isArray(d.st.worp) && d.st.worp.length === 2 && d.st.worp.every((v) => v >= 1 && v <= 6) ? d.st.worp : null;
      return { tegen: d.tegen, variant: s.variant, lengte: d.lengte === 5 ? 5 : 3, score: Array.isArray(d.score) ? d.score.map((v) => v | 0) : [0, 0], nr: d.nr | 0, st: s, worp };
    } catch (e) { return null; }
  }

  // ============================================================
  // MENU
  // ============================================================
  function openMenu() {
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.lijst.querySelector('.mo-keuze.nu') || ui.lijst.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu() { ui.menu.hidden = true; }
  function werkSchakelaars() {
    const g = ui.menu.querySelector('.mo-geluid'), m = ui.menu.querySelector('.mo-muziek');
    g.setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    m.setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
    ui.menu.querySelectorAll('[data-variant]').forEach((c) => c.setAttribute('aria-pressed', String(c.getAttribute('data-variant') === variant)));
    ui.menu.querySelectorAll('[data-lengte]').forEach((c) => c.setAttribute('aria-pressed', String(+c.getAttribute('data-lengte') === lengte)));
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
      const pips = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-dobbel"/></svg>`).join('')}</span>`;
      const gezichtje = t === TWEE ? `<span class="mo-twee">${gezicht.wit}${gezicht.zwart}</span>` : gezicht[t.id];
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
        if (window.Duiten) Duiten.zetVeld('trik-tegen', t.id);
        sluitMenu();
        nieuwePartij();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS: per stap een voorbeeld op het bord
  // ============================================================
  let lesSoort = null, lesBewaard = null;
  function lesBord(soort) {
    if (!svg || soort === lesSoort) return;
    if (!lesSoort && soort) lesBewaard = { st, dobbelKant, dobbelWaarden: dobbelWaarden.slice(), zichtbaar: ui.dobbels.classList.contains('zichtbaar') };
    lesSoort = soort;
    if (!soort) {
      if (lesBewaard) {
        bouwStapels(lesBewaard.st);
        dobbelKant = lesBewaard.dobbelKant; dobbelWaarden = lesBewaard.dobbelWaarden;
        if (lesBewaard.zichtbaar && dobbelWaarden.length) zetDobbels(false); else ui.dobbels.classList.remove('zichtbaar');
        lesBewaard = null;
        tekenMerk();
      }
      return;
    }
    const v = R.beginStand('gewoon');
    let worp = [];
    if (soort !== 'begin') v.bord.fill(0);
    const leg = (punt, n) => { v.bord[punt - 1] = n; };
    if (soort === 'zet') { leg(11, 1); leg(6, 3); leg(19, -2); worp = [3, 1]; }
    if (soort === 'dubbel') { leg(13, 2); leg(8, 2); leg(19, -2); worp = [2, 2, 2, 2]; }
    if (soort === 'slaan') { leg(10, 1); leg(7, -1); leg(6, 2); leg(19, -3); worp = [3, 5]; }
    if (soort === 'dicht') { leg(12, 1); leg(9, -2); leg(6, 2); leg(19, -3); worp = [3, 4]; }
    if (soort === 'bar') { v.bar[0] = 1; leg(13, 3); leg(6, 3); leg(19, -2); leg(21, -2); leg(23, -2); worp = [5, 2]; }
    if (soort === 'uit') { leg(1, 2); leg(2, 3); leg(3, 2); leg(5, 2); leg(6, 1); v.af[0] = 5; leg(20, -4); leg(13, -3); v.af[1] = 8; worp = [6, 2]; }
    bouwStapels(v);
    tekenMerkLeeg();
    if (worp.length) { dobbelKant = 0; dobbelWaarden = worp; zetDobbels(false); } else ui.dobbels.classList.remove('zichtbaar');
  }
  function tekenMerkLeeg() { if (lagen.merk) lagen.merk.innerHTML = ''; }
  // als Gijs klaar is, komt de echte stand terug
  if (typeof MutationObserver !== 'undefined') {
    const les = document.getElementById('les');
    if (les) new MutationObserver(() => { if (les.hidden && lesSoort) lesBord(null); }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
  }
  // van liggende bordmaten naar het scherm
  function naarScherm(x, y) {
    const [X, Y] = M(x, y), m = svg.getScreenCTM();
    return [m.a * X + m.c * Y + m.e, m.b * X + m.d * Y + m.f];
  }
  function vakVan(punten, ruimte) {
    const p = punten.map(([x, y]) => naarScherm(x, y)), r = ruimte || 0;
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    return { left: Math.min(...xs) - r, top: Math.min(...ys) - r, width: Math.max(...xs) - Math.min(...xs) + 2 * r, height: Math.max(...ys) - Math.min(...ys) + 2 * r };
  }
  const puntVak = (k) => vakVan(puntHoeken(k));
  const midScherm = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const schijfOp = (punt, j) => { const [x, y] = plekXY(punt - 1, j, Math.max(1, j + 1)); return naarScherm(x, y); };
  const dobbelVak = () => { const ds = Array.from(ui.dob).filter((d) => d.style.display !== 'none').map((d) => d.getBoundingClientRect()); if (!ds.length) return null; const l = Math.min(...ds.map((r) => r.left)), t = Math.min(...ds.map((r) => r.top)); return { left: l - 6, top: t - 6, width: Math.max(...ds.map((r) => r.right)) - l + 12, height: Math.max(...ds.map((r) => r.bottom)) - t + 12 }; };
  if (window.Les) {
    Les.zet('triktrak', () => [
      { doel: () => { lesBord('begin'); return vakVan([[BAR1, MID + 20], [RECHTS1, ONDER]]); }, gebaar: 'wijs', tekst: 'Breng al je witte schijven naar je thuisbord, hier' },
      { doel: () => { lesBord(null); return ui.beker; }, vorm: 'rond', marge: 6, gebaar: 'wijs', tekst: 'Schud de beker en gooi de twee stenen' },
      { doel: () => { lesBord('zet'); return vakVan([[puntX(11) - PW / 2, ONDER], [puntX(8) + PW / 2, ONDER - 4 * RS]]); }, gebaar: 'veeg', voorwerp: 'damsteen', van: () => schijfOp(11, 0), naar: () => schijfOp(8, 0), tekst: 'Zet een schijf zoveel punten verder als je gooit' },
      { doel: () => { lesBord('dubbel'); return dobbelVak(); }, gebaar: 'wijs', tekst: 'Dubbel gegooid? Dan zet je vier keer' },
      { doel: () => { lesBord('slaan'); return vakVan([[puntX(10) - PW / 2, ONDER], [puntX(7) + PW / 2, ONDER - 4 * RS]]); }, gebaar: 'veeg', voorwerp: 'damsteen', van: () => schijfOp(10, 0), naar: () => schijfOp(7, 0), tekst: 'Kom je op één schijf van de ander, dan sla je hem' },
      { doel: () => { lesBord('dicht'); return puntVak(9); }, gebaar: 'wijs', tekst: 'Op twee of meer van de ander kun je niet komen' },
      { doel: () => { lesBord('bar'); return vakVan([[BAR0 - 10, BOVEN], [RECHTS1, MID]]); }, gebaar: 'wijs', tekst: 'Geslagen? Dan moet je eerst weer opkomen, hier' },
      { doel: () => { lesBord('uit'); return vakVan([[BAR1, MID], [BAK1, ONDER]]); }, gebaar: 'veeg', voorwerp: 'damsteen', van: () => schijfOp(2, 2), naar: () => naarScherm((BAK0 + BAK1) / 2, ONDER - 80), tekst: 'Alles thuis? Neem ze uit. Wie het eerst klaar is, wint' },
      { doel: () => { lesBord(null); return ui.kaart[1].parentNode.querySelector('.mo-meer'); }, vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Via deze knop kies je tegen wie je speelt' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.triktrak = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const zoek = (id) => (id === 'twee' ? TWEE : TEGENSTANDERS.find((x) => x.id === id));
        const bewaard = window.Duiten ? Duiten.veld('trik-tegen', 'jantje') : 'jantje';
        const t = zoek(bewaard);
        tegen = t === TWEE ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
        variant = window.Duiten ? Duiten.veld('trik-variant', 'gewoon') : 'gewoon';
        lengte = window.Duiten ? (+Duiten.veld('trik-lengte', 3) === 5 ? 5 : 3) : 3;
        eersteLes = !!window.Les && !!window.Duiten && !Duiten.veld('les-triktrak', false);
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste) {
          const oud = laad();
          const ot = oud && (oud.tegen === 'twee' ? TWEE : TEGENSTANDERS.find((x) => x.id === oud.tegen));
          if (oud && ot && (ot === TWEE || isOpen(ot))) {
            tegen = ot === TWEE ? null : ot;
            variant = oud.variant; lengte = oud.lengte;
            partij = { score: oud.score, nr: oud.nr };
            st = oud.st;
            bouwStapels(st);
            if (oud.worp && mens(st.aan)) {
              st = R.rol(st, oud.worp[0], oud.worp[1]);
              beurtMemo = new Map();
              dobbelKant = st.aan; dobbelWaarden = oud.worp[0] === oud.worp[1] ? [oud.worp[0], oud.worp[0], oud.worp[0], oud.worp[0]] : oud.worp.slice();
              beginZetten();
            } else volgendeBeurt();
            meld(tegen ? `Verder met je partij tegen ${tegen.naam}.` : 'Verder met jullie partij.');
          } else nieuwePartij();
        } else {
          kleurSchijven();
          werkKaartenBij();
          if (fase === 'denkt' || fase === 'bezig') {
            // een onderbroken beurt van de computer begint opnieuw
            if (!mens(st.aan)) { if (st.gezet.length || !st.worp) volgendeBeurt(); else computerBeurt(true); }
          }
        }
        if (window.Les) Les.eersteKeer('triktrak');
      });
    },
    stop() {
      spelId++;
      clearTimeout(autoKlaar);
      annuleerSleep();
      if (ui.menu) sluitMenu();
      // een halve beurt van jou vervalt niet: terug naar het begin van je beurt
      if (geschiedenis.length && mens(st.aan)) {
        const begin = geschiedenis[0];
        st = begin.st;
        for (const p in stapels) delete stapels[p];
        for (const p in begin.stapels) stapels[p] = begin.stapels[p];
        geschiedenis = [];
        plaatsAlles(false);
      }
      if (fase === 'bezig' || fase === 'klaar') {
        if (st.klaar) { fase = 'uitslag'; }
        else if (mens(st.aan) && st.worp && !st.gezet.length) fase = 'zetten';
        else if (mens(st.aan) && st.worp) { eindeBeurt(); }
        else fase = 'denkt';
      }
      if (fase === 'opening') fase = 'denkt';
      gekozen = null; doelen = null;
    },
    opnieuw() { nieuwePartij(); },
    // voor tests
    _toestand() { return { fase, st: R.kopie(st), partij: { score: partij.score.slice(), nr: partij.nr }, tegen: tegen ? tegen.id : 'twee', variant, lengte, staand, gekozen, doelen: doelen ? Array.from(doelen.keys()) : null }; },
    _stappen() { return stappenNu(); },
    _gooi(a, b) { if (fase !== 'gooien' || !mens(st.aan)) return false; st = R.rol(st, a, b); beurtMemo = new Map(); dobbelKant = st.aan; dobbelWaarden = a === b ? [a, a, a, a] : [a, b]; beginZetten(); return true; },
    _zet(stand) { spelId++; clearTimeout(autoKlaar); st = Object.assign(R.beginStand(stand.variant || 'gewoon'), stand, { worp: null, over: [], gezet: [], klaar: false }); bouwStapels(st); dobbelsWeg(); volgendeBeurt(); },
    _xy(plek) {
      const [x, y] = M(...plekXY(plek, 0, 1));
      const m = svg.getScreenCTM();
      return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
    },
    _punt(i) {
      const k = i + 1, x = puntX(k), y = onderRij(k) ? ONDER - PL * 0.6 : BOVEN + PL * 0.6;
      const [X, Y] = M(x, y);
      const m = svg.getScreenCTM();
      return [m.a * X + m.c * Y + m.e, m.b * X + m.d * Y + m.f];
    },
    _bak(kant) {
      const [X, Y] = M((BAK0 + BAK1) / 2, kant === 0 ? (MID + ONDER) / 2 : (BOVEN + MID) / 2);
      const m = svg.getScreenCTM();
      return [m.a * X + m.c * Y + m.e, m.b * X + m.d * Y + m.f];
    }
  };
})();
