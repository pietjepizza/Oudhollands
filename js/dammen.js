/* Dammen, schermvullend: het damspel op honderd velden, zoals het in Nederland gespeeld wordt.
   Bovenin je tegenstander, in het midden een houten dambord, onderin jijzelf met je knoppen.
   De regels en de denkende tegenstander staan in damregels.js.

   Overgenomen van succesvolle dam- en schaakapps (Lidraughts, Chess.com, populaire dam-apps):
   - tegenstanders met een gezicht en karakter, van makkelijk tot heel sterk; versla je er een, dan komt de volgende vrij;
   - slaan is verplicht: de stenen die moeten slaan lichten op, en wie iets anders probeert, ziet waarom het niet mag;
   - een meerslag tik je stap voor stap, of je tikt meteen het eindveld; geslagen stenen blijven staan tot de slag klaar is;
   - de laatste zet blijft zichtbaar, met het spoor van de slag en kruisjes waar stenen weggingen;
   - onbeperkt terugnemen en een tip; tikken of slepen;
   - een feestje bij een dam en bij een grote slag; de partij wordt bewaard als je even weggaat. */
(function () {
  'use strict';
  const R = window.Damregels;
  if (!R) return;
  const NS = 'http://www.w3.org/2000/svg';
  const MAAT = 1000, RAND = 34, VELD = (MAAT - 2 * RAND) / 10;
  const xy = (s) => [RAND + (R.KOL[s] + 0.5) * VELD, RAND + (R.RIJ[s] + 0.5) * VELD];
  const OPSLAG = 'speelhuys.dammen';

  // ============================================================
  // TEGENSTANDERS
  // ============================================================
  const TEGENSTANDERS = [
    { id: 'jantje', naam: 'Jantje', niveau: 1, beloning: 25, denk: { diepte: 1, ruis: 80, tijd: 300, verlenging: 0 },
      zegt: { start: ['Ik ga winnen!', 'Dammen kan ik best!'], slaat: ['Hap!', 'Hebbes!'], dam: ['Ik heb een dam!', 'Kijk, een torentje!'], kwijt: ['Hé, mijn steen!', 'Oeps!'], wint: ['Hoera, gewonnen!'], verliest: ['Nog een keer?', 'Jij bent goed!'], remise: ['Gelijk! Ook leuk.'] } },
    { id: 'grietje', naam: 'Grietje', niveau: 2, beloning: 40, denk: { diepte: 3, ruis: 25, tijd: 400, verlenging: 0 },
      zegt: { start: ['Zullen we?', 'Pas op je stenen!'], slaat: ['Die is voor mij.', 'Dank je wel!'], dam: ['Een dam!', 'Kijk eens wat ik heb.'], kwijt: ['Ach, mijn steen.', 'Slim hoor.'], wint: ['Gewonnen!'], verliest: ['Goed gespeeld!'], remise: ['Remise. Netjes.'] } },
    { id: 'kees', naam: 'Molenaar Kees', niveau: 3, beloning: 60, denk: { diepte: 6, ruis: 5, tijd: 700, verlenging: 1 },
      zegt: { start: ['Rustig aan, steen voor steen.', 'Daar gaan we.'], slaat: ['Zo maalt de molen.', 'Erin en eruit.'], dam: ['Een dam, zwaar als een molensteen.'], kwijt: ['Hm, slim.', 'Die zag ik niet.'], wint: ['Fijngemalen!'], verliest: ['Knap gedaan!'], remise: ['Remise. Eerlijk verdeeld.'] } },
    { id: 'burgemeester', naam: 'De burgemeester', niveau: 4, beloning: 90, denk: { diepte: 64, tijd: 1500, ruis: 0, verlenging: 2 },
      zegt: { start: ['Welaan.', 'Ik speel om te winnen.'], slaat: ['Zo gaat dat.', 'Precies volgens plan.'], dam: ['Dam. Uiteraard.'], kwijt: ['Brutaal!', 'Hm.'], wint: ['De stad is van mij.'], verliest: ['Petje af!'], remise: ['Remise. Een eervolle vrede.'] } }
  ];
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];

  // gezichten: de tegenstanders uit Personen, en een damsteen voor jezelf
  const steenGezicht = (kant) => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${kant ? '#8A7458' : '#4E3520'}"/>
    <ellipse cx="34" cy="41" rx="22" ry="20" fill="#000" opacity=".32"/>
    <circle cx="32" cy="35.5" r="21" fill="url(#dm-mini-rand-${kant ? 'zwart' : 'wit'})"/>
    <circle cx="32" cy="31" r="21" fill="url(#dm-mini-${kant ? 'zwart' : 'wit'})"/>
    <circle cx="32" cy="31" r="16.5" fill="none" stroke="${kant ? 'rgba(255,240,220,.2)' : 'rgba(110,80,40,.38)'}" stroke-width="1.4"/>
    <circle cx="32" cy="31" r="10" fill="none" stroke="${kant ? 'rgba(255,240,220,.16)' : 'rgba(110,80,40,.3)'}" stroke-width="1.2"/>
    <ellipse cx="24.5" cy="22.5" rx="7.5" ry="3.4" fill="#fff" opacity="${kant ? 0.2 : 0.55}" transform="rotate(-32 24.5 22.5)"/></svg>`;
  const gezicht = Object.assign({}, window.Personen ? Personen.gezicht : {}, { wit: steenGezicht(0), zwart: steenGezicht(1) });

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, svg, doek, lagen = {}, ui = {}, gebouwd = false;
  let partij = R.nieuwePartij();
  let tegen = TEGENSTANDERS[0];   // null = met z'n tweeën
  let fase = 'klaar';             // kies | slaat | bezig | denkt | klaar
  let gekozen = 0, deelpad = [], tussen = null, laatste = null, tip = null, geschiedenis = [], uitkomst = null;
  let spelId = 0, druk = null, sleep = null, lijstCache = null, verplichtGezegd = 0, focusVeld = 0, tipBezig = false;
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 60) : ms));
  const mens = (kant) => !tegen || kant === 0;
  const naamVan = (kant) => (tegen ? (kant === 0 ? 'Jij' : tegen.naam) : (kant === 0 ? 'Wit' : 'Zwart'));
  const gewonnen = () => (window.Duiten ? Duiten.veld('dam-gewonnen', {}) : {});
  const isOpen = (t) => { const i = TEGENSTANDERS.indexOf(t); return i <= 0 || (gewonnen()[TEGENSTANDERS[i - 1].id] || 0) > 0; };
  const eigen = (stuk, kant) => stuk !== 0 && R.kleurVan(stuk) === kant;

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;

  // ============================================================
  // OPBOUW VAN HET SPEELVELD
  // ============================================================
  function bouw() {
    podium = document.getElementById('dm-podium');
    podium.innerHTML = '';
    podium.appendChild(html(`<svg class="mo-defs" width="0" height="0" aria-hidden="true"><defs>
      <radialGradient id="dm-mini-wit" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFFDF6"/><stop offset=".65" stop-color="#E6DCC6"/><stop offset="1" stop-color="#B9AD92"/></radialGradient>
      <radialGradient id="dm-mini-zwart" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#6A5F57"/><stop offset=".65" stop-color="#2C2522"/><stop offset="1" stop-color="#151110"/></radialGradient>
      <linearGradient id="dm-mini-rand-wit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9AD92"/><stop offset="1" stop-color="#8D8167"/></linearGradient>
      <linearGradient id="dm-mini-rand-zwart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151110"/><stop offset="1" stop-color="#000"/></linearGradient>
    </defs></svg>`));
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="mo-stapels"><span class="mo-buit"></span></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenstander" title="Kies je tegenstander" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="mo-bordvak dm-bordvak"><canvas class="dm-hout" aria-hidden="true"></canvas><div class="mo-banier" aria-hidden="true" hidden></div><div class="mo-vonken" aria-hidden="true"></div></div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="mo-stapels"><span class="mo-buit"></span></span>
        <span class="mo-ballon" hidden></span>
      </div>
      <button class="mo-knop mo-terug" type="button" aria-label="Zet terugnemen" title="Zet terugnemen">${icoon('terugzet')}</button>
      <button class="mo-knop mo-tip" type="button" aria-label="Tip" title="Tip">${icoon('tip')}</button>
    </div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenstander" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Tegen wie speel je?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
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
      bordvak: midden.querySelector('.mo-bordvak'), midden, banier: midden.querySelector('.mo-banier'), vonken: midden.querySelector('.mo-vonken'),
      terug: onder.querySelector('.mo-terug'), tip: onder.querySelector('.mo-tip'), menu, meld,
      lijst: menu.querySelector('.mo-tegenstanders')
    };
    doek = midden.querySelector('.dm-hout');
    ui.bordvak.insertBefore(bouwBord(), ui.banier);

    boven.querySelector('.mo-speler').addEventListener('click', openMenu);
    boven.querySelector('.mo-meer').addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('dammen'); });
    ui.terug.addEventListener('click', neemTerug);
    ui.tip.addEventListener('click', geefTip);
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

  // Het bord zo groot mogelijk in het midden
  const DWARS = '(orientation: landscape) and (max-height: 620px)';
  function pasMaatAan() {
    if (!ui.midden) return;
    let maat;
    if (window.matchMedia && window.matchMedia(DWARS).matches) {
      // telefoon dwars: het bord zo hoog als het scherm, de kaarten links en rechts in wat overblijft
      const p = podium.getBoundingClientRect(), cs = getComputedStyle(podium);
      if (!p.width || !p.height) return;
      const h = p.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const b = p.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * 150 - 24;
      maat = Math.floor(Math.min(h - 4, b, 860));
    } else {
      const r = ui.midden.getBoundingClientRect();
      if (!r.width || !r.height) return;
      maat = Math.floor(Math.min(r.width - (r.width < 500 ? 4 : 12), r.height - 10, 860));
    }
    podium.style.setProperty('--bord', Math.max(200, maat) + 'px');
    requestAnimationFrame(tekenHout);
  }

  // ============================================================
  // HET HOUTEN BORD: één keer getekend op een canvas, scherp op elk scherm
  // ============================================================
  function tint(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const k = (v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
    return `rgb(${k(n >> 16)},${k((n >> 8) & 255)},${k(n & 255)})`;
  }
  function tekenHout() {
    if (!doek || !ui.bordvak) return;
    const r = ui.bordvak.getBoundingClientRect();
    const px = Math.round(r.width * Math.min(3, window.devicePixelRatio || 1));
    if (!px || doek.width === px) return;
    doek.width = doek.height = px;
    const g = doek.getContext('2d');
    if (!g) return;
    g.setTransform(px / MAAT, 0, 0, px / MAAT, 0, 0);
    let zaad = 1636;
    const rnd = () => { zaad = (zaad * 16807) % 2147483647; return (zaad - 1) / 2147483646; };
    const rond = (x, y, b, h, rr) => { g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + b, y, x + b, y + h, rr); g.arcTo(x + b, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + b, y, rr); g.closePath(); };

    // de lijst van notenhout
    const lijst = g.createLinearGradient(0, 0, MAAT, MAAT);
    lijst.addColorStop(0, '#62401F'); lijst.addColorStop(0.5, '#4B2E16'); lijst.addColorStop(1, '#33200E');
    g.fillStyle = lijst;
    rond(0, 0, MAAT, MAAT, 22); g.fill();
    g.save();
    rond(0, 0, MAAT, MAAT, 22); g.clip();
    // nerf langs de vier latten
    for (let i = 0; i < 70; i++) {
      const kant = i % 4, t = rnd() * RAND, a = 0.12 + rnd() * 0.22;
      g.strokeStyle = rnd() < 0.3 ? `rgba(150,105,60,${a})` : `rgba(20,10,4,${a})`;
      g.lineWidth = 0.6 + rnd() * 1.2;
      g.beginPath();
      if (kant === 0) { g.moveTo(0, t); g.bezierCurveTo(330, t + rnd() * 4 - 2, 660, t + rnd() * 4 - 2, MAAT, t); }
      if (kant === 1) { g.moveTo(0, MAAT - t); g.bezierCurveTo(330, MAAT - t + rnd() * 4 - 2, 660, MAAT - t + rnd() * 4 - 2, MAAT, MAAT - t); }
      if (kant === 2) { g.moveTo(t, 0); g.bezierCurveTo(t + rnd() * 4 - 2, 330, t + rnd() * 4 - 2, 660, t, MAAT); }
      if (kant === 3) { g.moveTo(MAAT - t, 0); g.bezierCurveTo(MAAT - t + rnd() * 4 - 2, 330, MAAT - t + rnd() * 4 - 2, 660, MAAT - t, MAAT); }
      g.stroke();
    }
    g.restore();
    // verstekken in de hoeken
    g.strokeStyle = 'rgba(15,8,3,.55)'; g.lineWidth = 1.4;
    [[4, 4, RAND, RAND], [MAAT - 4, 4, MAAT - RAND, RAND], [4, MAAT - 4, RAND, MAAT - RAND], [MAAT - 4, MAAT - 4, MAAT - RAND, MAAT - RAND]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    // afgeronde buitenkant: licht boven, donker onder
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(255,225,170,.28)'; rond(1.5, 1.5, MAAT - 3, MAAT - 3, 21); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(22, MAAT - 1.5); g.lineTo(MAAT - 22, MAAT - 1.5); g.stroke();
    // ingelegd biesje van palmhout met een zwart randje
    const b = RAND * 0.44;
    g.strokeStyle = 'rgba(10,5,2,.55)'; g.lineWidth = 4.2; g.strokeRect(b, b, MAAT - 2 * b, MAAT - 2 * b);
    g.strokeStyle = '#CBA767'; g.lineWidth = 2.2; g.strokeRect(b, b, MAAT - 2 * b, MAAT - 2 * b);
    // ruitjes in de hoeken
    [[RAND / 2, RAND / 2], [MAAT - RAND / 2, RAND / 2], [RAND / 2, MAAT - RAND / 2], [MAAT - RAND / 2, MAAT - RAND / 2]].forEach(([x, y]) => {
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
      g.fillStyle = '#1C120A'; g.fillRect(-8.5, -8.5, 17, 17);
      g.fillStyle = '#D9BC80'; g.fillRect(-6, -6, 12, 12);
      g.fillStyle = '#1C120A'; g.fillRect(-2.2, -2.2, 4.4, 4.4);
      g.restore();
    });

    // de velden: palmhout en notenhout, ingelegd, met nerf om en om
    for (let rij = 0; rij < 10; rij++) {
      for (let kol = 0; kol < 10; kol++) {
        const x = RAND + kol * VELD, y = RAND + rij * VELD, donker = (rij + kol) % 2 === 1;
        const v = rnd() * 2 - 1;
        const grad = g.createLinearGradient(x, y, x + VELD, y + VELD);
        if (donker) { grad.addColorStop(0, tint('#603D22', v * 0.08)); grad.addColorStop(1, tint('#47291A', v * 0.08)); }
        else { grad.addColorStop(0, tint('#ECD8AC', v * 0.05)); grad.addColorStop(1, tint('#DDC28F', v * 0.05)); }
        g.fillStyle = grad;
        g.fillRect(x, y, VELD + 0.5, VELD + 0.5);
        g.save();
        g.beginPath(); g.rect(x, y, VELD, VELD); g.clip();
        const n = 6 + Math.floor(rnd() * 5);
        for (let i = 0; i < n; i++) {
          const t = (i + rnd()) / n, w = () => rnd() * 7 - 3.5;
          g.beginPath();
          if (donker) {
            const xx = x + t * VELD;
            g.moveTo(xx, y); g.bezierCurveTo(xx + w(), y + VELD * 0.33, xx + w(), y + VELD * 0.66, xx + w(), y + VELD);
            g.strokeStyle = rnd() < 0.28 ? `rgba(140,92,52,${0.18 + rnd() * 0.2})` : `rgba(22,11,4,${0.2 + rnd() * 0.25})`;
          } else {
            const yy = y + t * VELD;
            g.moveTo(x, yy); g.bezierCurveTo(x + VELD * 0.33, yy + w(), x + VELD * 0.66, yy + w(), x + VELD, yy + w());
            g.strokeStyle = `rgba(150,104,48,${0.09 + rnd() * 0.15})`;
          }
          g.lineWidth = 0.5 + rnd() * 1.5;
          g.stroke();
        }
        // een enkele vlam in het palmhout
        if (!donker && rnd() < 0.18) {
          const cx = x + VELD * (0.25 + rnd() * 0.5), cy = y + VELD * (0.25 + rnd() * 0.5);
          g.strokeStyle = 'rgba(150,104,48,.16)'; g.lineWidth = 1;
          for (let k = 1; k <= 3; k++) { g.beginPath(); g.ellipse(cx, cy, 5 * k, 2.2 * k, 0, 0, Math.PI * 2); g.stroke(); }
        }
        g.restore();
      }
    }
    // voegen tussen de velden
    g.strokeStyle = 'rgba(28,15,6,.32)'; g.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      g.beginPath(); g.moveTo(RAND + i * VELD, RAND); g.lineTo(RAND + i * VELD, MAAT - RAND); g.stroke();
      g.beginPath(); g.moveTo(RAND, RAND + i * VELD); g.lineTo(MAAT - RAND, RAND + i * VELD); g.stroke();
    }
    // de lijst werpt een randje schaduw op het speelveld
    const s = 9;
    const schaduw = (x0, y0, x1, y1, w, h, a) => { const sg = g.createLinearGradient(x0, y0, x1, y1); sg.addColorStop(0, `rgba(10,5,2,${a})`); sg.addColorStop(1, 'rgba(10,5,2,0)'); g.fillStyle = sg; g.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h); };
    schaduw(RAND, RAND, RAND, RAND + s, MAAT - 2 * RAND, s, 0.45);
    schaduw(RAND, RAND, RAND + s, RAND, s, MAAT - 2 * RAND, 0.35);
    g.strokeStyle = 'rgba(255,225,170,.22)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(RAND, MAAT - RAND + 0.8); g.lineTo(MAAT - RAND, MAAT - RAND + 0.8); g.lineTo(MAAT - RAND + 0.8, RAND); g.stroke();
    g.strokeStyle = 'rgba(10,5,2,.6)'; g.lineWidth = 1.4; g.strokeRect(RAND, RAND, MAAT - 2 * RAND, MAAT - 2 * RAND);
    // licht van links boven, en een glans van de was
    const licht = g.createRadialGradient(MAAT * 0.28, MAAT * 0.22, 40, MAAT * 0.5, MAAT * 0.5, MAAT * 0.86);
    licht.addColorStop(0, 'rgba(255,238,205,.13)'); licht.addColorStop(0.55, 'rgba(255,238,205,0)'); licht.addColorStop(1, 'rgba(0,0,0,.2)');
    g.fillStyle = licht; g.fillRect(0, 0, MAAT, MAAT);
    const glans = g.createLinearGradient(0, 0, MAAT, MAAT);
    glans.addColorStop(0.3, 'rgba(255,255,255,0)'); glans.addColorStop(0.42, 'rgba(255,250,235,.06)'); glans.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.fillStyle = glans; g.fillRect(RAND, RAND, MAAT - 2 * RAND, MAAT - 2 * RAND);
  }

  // ============================================================
  // HET SVG-BORD: stenen, markeringen en aanraking
  // ============================================================
  function bouwBord() {
    svg = el('svg', { viewBox: `0 0 ${MAAT} ${MAAT}`, class: 'dm-bord', role: 'application', tabindex: 0, 'aria-label': 'Het dambord. Gebruik de pijltjes en Enter.' });
    const defs = el('defs', {}, svg);
    const grad = (id, stops, lin) => {
      const g = el(lin ? 'linearGradient' : 'radialGradient', Object.assign({ id }, lin ? { x1: 0, y1: 0, x2: 0, y2: 1 } : { cx: '38%', cy: '30%', r: '78%' }), defs);
      stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));
    };
    grad('dm-top-wit', [[0, '#FFFDF6'], [0.65, '#E6DCC6'], [1, '#B9AD92']]);
    grad('dm-top-zwart', [[0, '#6A5F57'], [0.65, '#2C2522'], [1, '#151110']]);
    grad('dm-rand-wit', [[0, '#B9AD92'], [1, '#8D8167']], true);
    grad('dm-rand-zwart', [[0, '#151110'], [1, '#000000']], true);
    const goud = el('linearGradient', { id: 'dm-goud', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [[0, '#FFE9A6'], [0.55, '#E2B14C'], [1, '#A8741C']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, goud));
    // een gedraaide damsteen: dikte, bovenkant, twee groeven en een glans
    const steen = (ouder, kant, dy) => {
      const k = kant === 0 ? 'wit' : 'zwart';
      const groef = kant === 0 ? 'rgba(110,80,40,.36)' : 'rgba(255,240,220,.16)';
      const lichtje = kant === 0 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.1)';
      el('circle', { cy: dy + 5.5, r: 36.5, fill: `url(#dm-rand-${k})`, class: 'dm-rand' }, ouder);
      el('circle', { cy: dy, r: 36.5, fill: `url(#dm-top-${k})` }, ouder);
      el('circle', { cy: dy + 0.9, r: 29.5, fill: 'none', stroke: lichtje, 'stroke-width': 1.1 }, ouder);
      el('circle', { cy: dy, r: 29.5, fill: 'none', stroke: groef, 'stroke-width': 1.7 }, ouder);
      el('circle', { cy: dy + 0.8, r: 19, fill: 'none', stroke: lichtje, 'stroke-width': 1 }, ouder);
      el('circle', { cy: dy, r: 19, fill: 'none', stroke: groef, 'stroke-width': 1.4 }, ouder);
      el('circle', { cy: dy, r: 6.5, fill: kant === 0 ? 'rgba(110,80,40,.12)' : 'rgba(255,240,220,.07)' }, ouder);
      el('ellipse', { cx: -12, cy: dy - 15, rx: 14, ry: 6.2, fill: '#fff', opacity: kant === 0 ? 0.5 : 0.17, transform: `rotate(-32 -12 ${dy - 15})` }, ouder);
    };
    [0, 1].forEach((kant) => {
      const k = kant === 0 ? 'wit' : 'zwart';
      steen(el('g', { id: `dm-s-${k}` }, defs), kant, 0);
      const dam = el('g', { id: `dm-d-${k}` }, defs);
      steen(dam, kant, 6);
      steen(dam, kant, -6);
      // een kroontje van bladgoud op de bovenste steen
      el('path', { d: 'M-13 1 L-14.5 -11 L-7 -5 L0 -15.5 L7 -5 L14.5 -11 L13 1 Z', fill: 'url(#dm-goud)', stroke: kant === 0 ? '#7A5212' : '#3A2608', 'stroke-width': 1.5, 'stroke-linejoin': 'round', transform: 'translate(0 2)' }, dam);
      [[-14.5, -9], [0, -13.5], [14.5, -9]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 2.2, fill: '#FFF1C4', stroke: kant === 0 ? '#7A5212' : '#3A2608', 'stroke-width': 0.9 }, dam));
    });
    lagen.merk = el('g', { class: 'dm-merklaag' }, svg);
    lagen.ring = el('g', { class: 'dm-ringlaag' }, svg);
    lagen.stenen = el('g', { class: 'dm-stenen' }, svg);
    lagen.doelen = el('g', { class: 'dm-doelen' }, svg);
    lagen.vlieg = el('g', { class: 'dm-vlieglaag' }, svg);
    lagen.focus = el('g', { class: 'dm-focuslaag' }, svg);
    svg.addEventListener('pointerdown', neer);
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', () => { annuleerSleep(); druk = null; });
    svg.addEventListener('keydown', toets);
    svg.addEventListener('blur', () => { lagen.focus.textContent = ''; });
    return svg;
  }

  // ============================================================
  // TEKENEN
  // ============================================================
  function steenStijl() { return window.Pronk ? Pronk.stijl('stenen') : { wit: ['#FFFDF6', '#E6DCC6', '#B9AD92', '#8D8167'], zwart: ['#6A5F57', '#2C2522', '#151110', '#000'] }; }
  function kleurStenen() {
    const st = steenStijl();
    const zet = (id, kleuren) => { const g = document.getElementById(id); if (g) g.querySelectorAll('stop').forEach((s, i) => s.setAttribute('stop-color', kleuren[i])); };
    zet('dm-top-wit', st.wit); zet('dm-top-zwart', st.zwart);
    zet('dm-mini-wit', st.wit); zet('dm-mini-zwart', st.zwart);
    zet('dm-rand-wit', [st.wit[2], st.wit[3]]); zet('dm-rand-zwart', [st.zwart[2], st.zwart[3]]);
    zet('dm-mini-rand-wit', [st.wit[2], st.wit[3]]); zet('dm-mini-rand-zwart', [st.zwart[2], st.zwart[3]]);
    if (podium) {
      podium.style.setProperty('--mo-wit-a', st.wit[0]); podium.style.setProperty('--mo-wit-b', st.wit[1]); podium.style.setProperty('--mo-wit-c', st.wit[2]);
      podium.style.setProperty('--mo-zwart-a', st.zwart[0]); podium.style.setProperty('--mo-zwart-b', st.zwart[1]); podium.style.setProperty('--mo-zwart-c', st.zwart[2]);
    }
  }
  if (window.Pronk) Pronk.opWijziging(kleurStenen);

  function maakSteen(stuk, s, ouder) {
    const [x, y] = xy(s);
    const wit = R.kleurVan(stuk) === 0, dam = R.isDam(stuk);
    const g = el('g', { class: 'dm-steen ' + (wit ? 'wit' : 'zwart') + (dam ? ' dam' : ''), transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, 'data-veld': s }, ouder);
    el('ellipse', { class: 'dm-schaduw', cx: 3.5, cy: dam ? 14 : 9, rx: 37, ry: 34 }, g);
    const binnen = el('g', { class: 'dm-binnen' }, g);
    el('use', { href: `#dm-${dam ? 'd' : 's'}-${wit ? 'wit' : 'zwart'}` }, binnen);
    return g;
  }
  let lesStand = null, lesSoort = null;   // tijdens de uitleg van Gijs: een voorbeeldstand
  const beeldBord = () => lesStand || (tussen ? tussen.b : partij.st.b);
  const steenOp = (s) => lagen.stenen.querySelector(`.dm-steen[data-veld="${s}"]`);

  function tekenStenen() {
    if (!svg) return;
    lagen.stenen.textContent = '';
    const b = beeldBord();
    const op = lesStand ? 0 : (tussen ? tussen.op : gekozen);
    for (let s = 1; s <= 50; s++) {
      if (!b[s]) continue;
      const g = maakSteen(b[s], s, lagen.stenen);
      if (s === op && (fase === 'kies' || fase === 'slaat' || tussen)) g.classList.add('gekozen');
      if (tussen && tussen.geslagen.indexOf(s) >= 0) g.classList.add('geslagen');
      if (!lesStand && uitkomst && uitkomst.winnaar !== undefined && R.kleurVan(b[s]) !== uitkomst.winnaar) g.classList.add('verloren');
    }
    // de steen die beweegt of gekozen is, bovenop
    const boven = op && steenOp(op);
    if (boven) lagen.stenen.appendChild(boven);
    tekenMerk();
  }

  const vak = (s, klasse, ouder) => { const [x, y] = xy(s); return el('rect', { x: (x - VELD / 2).toFixed(1), y: (y - VELD / 2).toFixed(1), width: VELD.toFixed(1), height: VELD.toFixed(1), class: klasse }, ouder); };
  const lijnDoor = (velden, klasse, ouder) => el('polyline', { points: velden.map((s) => xy(s).map((v) => v.toFixed(1)).join(',')).join(' '), class: klasse }, ouder);

  // laatste zet, wie moet slaan, waar je heen kunt, wat je slaat, de tip
  function tekenMerk() {
    if (!svg) return;
    lagen.merk.textContent = ''; lagen.ring.textContent = ''; lagen.doelen.textContent = '';
    if (lesStand) {
      if (lesSoort === 'meer') {
        lijnDoor([32, 23, 12], 'dm-spoor nu', lagen.merk);
        [28, 18].forEach((s) => { const [x, y] = xy(s); el('circle', { cx: x, cy: y, r: 42, class: 'dm-prooi' }, lagen.ring); });
      }
      return;
    }
    if (laatste && !tussen) {
      vak(laatste.van, 'dm-vak', lagen.merk);
      if (laatste.naar !== laatste.van) vak(laatste.naar, 'dm-vak', lagen.merk);
      if (laatste.slag.length) {
        lijnDoor([laatste.van].concat(laatste.pad), 'dm-spoor', lagen.merk);
        laatste.slag.forEach((s) => { const [x, y] = xy(s); el('path', { d: `M${x - 13} ${y - 13} L${x + 13} ${y + 13} M${x + 13} ${y - 13} L${x - 13} ${y + 13}`, class: 'dm-kruis' }, lagen.merk); });
      }
    }
    if (tussen) {
      // tijdens een slag: het spoor tot nu toe
      if (tussen.pad.length) lijnDoor([tussen.van].concat(tussen.pad), 'dm-spoor nu', lagen.merk);
      tussen.geslagen.forEach((s) => { const [x, y] = xy(s); el('circle', { cx: x, cy: y, r: 42, class: 'dm-prooi weg' }, lagen.ring); });
    }
    if (!mens(partij.st.aan) || (fase !== 'kies' && fase !== 'slaat')) return;
    const lijst = zettenNu();
    const slaan = lijst.length && lijst[0].slag.length > 0;
    if (slaan && !gekozen) {
      new Set(lijst.map((z) => z.van)).forEach((s) => { const [x, y] = xy(s); el('circle', { cx: x, cy: y, r: 45, class: 'dm-moet' }, lagen.ring); });
    }
    const op = tussen ? tussen.op : gekozen;
    if (op) {
      const [x, y] = xy(op);
      el('circle', { cx: x, cy: y - 4, r: 44, class: 'dm-kies' }, lagen.ring);
      const k = deelpad.length;
      optiesVan(gekozen).forEach((z) => {
        if (z.pad.length <= k) return;
        const l = z.pad[k];
        if (z.slag.length) { const [px, py] = xy(z.slag[k]); el('circle', { cx: px, cy: py, r: 42, class: 'dm-prooi' }, lagen.ring); }
        if (lagen.doelen.querySelector(`[data-veld="${l}"]`)) return;
        const [dx, dy] = xy(l);
        el('circle', { cx: dx, cy: dy, r: z.slag.length ? 18 : 16, class: 'dm-doel' + (z.slag.length ? ' slag' : ''), 'data-veld': l }, lagen.doelen);
      });
    }
    if (tip && !tussen) {
      lijnDoor([tip.van].concat(tip.pad), 'dm-tip-lijn', lagen.doelen);
      [tip.van, tip.naar].forEach((s) => { const [x, y] = xy(s); el('circle', { cx: x, cy: y, r: 46, class: 'dm-tip-ring' }, lagen.doelen); });
    }
  }

  function miniStenen(kant, n) {
    let s = '';
    for (let i = 0; i < n; i++) s += `<i class="mo-mini ${kant === 0 ? 'wit' : 'zwart'}"></i>`;
    return s;
  }

  // De twee spelerskaarten: wie is aan zet, wat moet hij doen, hoeveel stenen hij sloeg
  function werkKaartenBij() {
    const st = partij.st, t = R.telling(st.b);
    const geslagen = [20 - t.zwart, 20 - t.wit];
    const slaan = fase !== 'klaar' && zettenNu().length && zettenNu()[0].slag.length > 0;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k];
      const aan = fase !== 'klaar' && st.aan === k;
      kaart.classList.toggle('aan', aan);
      kaart.classList.toggle('denkt', fase === 'denkt' && st.aan === k);
      kaart.querySelector('.mo-gezicht').innerHTML = tegen ? (k === 0 ? gezicht.wit : gezicht[tegen.id]) : gezicht[k === 0 ? 'wit' : 'zwart'];
      kaart.querySelector('.mo-naam').textContent = naamVan(k);
      // geslagen stenen: een paar steentjes, en bij veel een getal erbij
      const n = geslagen[k], buit = kaart.querySelector('.mo-buit');
      buit.innerHTML = n > 5 ? `${miniStenen(1 - k, 3)}<b class="dm-tal">${n}</b>` : miniStenen(1 - k, n);
      buit.setAttribute('aria-label', n ? `${n} ${n === 1 ? 'steen' : 'stenen'} geslagen` : '');
      const doe = kaart.querySelector('.mo-doe');
      let ik = '', woord = '';
      if (aan && mens(k)) {
        if (fase === 'slaat') { ik = 'pak'; woord = 'Sla verder'; }
        else if (slaan) { ik = 'pak'; woord = 'Slaan!'; }
        else if (tegen) { ik = 'zet'; woord = 'Jouw zet'; }
        else { ik = 'zet'; woord = 'Aan zet'; }
      }
      if (aan && fase === 'denkt') doe.innerHTML = '<span class="mo-denk" aria-label="denkt na"><i></i><i></i><i></i></span>';
      else doe.innerHTML = woord ? `${icoon(ik)}<span>${woord}</span>` : '';
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-dam"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', tegen ? `Tegenstander: ${tegen.naam}. Tik om te wisselen` : 'Met z\'n tweeën. Tik om te wisselen');
      } else {
        kaart.setAttribute('aria-label', `${naamVan(0)}${woord ? ': ' + woord : ''}`);
      }
    });
    ui.terug.disabled = fase === 'denkt' || fase === 'bezig' || (!geschiedenis.length && fase !== 'slaat') || (tegen && fase !== 'slaat' && !geschiedenis.some((g) => g.partij.st.aan === 0));
    ui.tip.disabled = tipBezig || !(fase === 'kies' && mens(st.aan));
  }

  function zeg(kant, soort) {
    if (!tegen || kant !== 1) return;
    const b = ui.kaart[1].querySelector('.mo-ballon');
    b.textContent = willekeurig(tegen.zegt[soort] || ['…']);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(zeg.t);
    zeg.t = setTimeout(() => { b.hidden = true; }, soort === 'wint' || soort === 'verliest' || soort === 'remise' ? 4200 : 2400);
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }

  // ============================================================
  // ANIMATIES
  // ============================================================
  function naarBord(px, py) {
    const m = svg.getScreenCTM();
    if (!m) return [MAAT / 2, MAAT / 2];
    const p = svg.createSVGPoint(); p.x = px; p.y = py;
    const q = p.matrixTransform(m.inverse());
    return [q.x, q.y];
  }
  function animeer(e, frames, opties) {
    if (!e || rustig() || !e.animate) return Promise.resolve();
    return e.animate(frames, opties).finished.catch(() => {});
  }
  const afstand = (a, b) => Math.abs(R.RIJ[a] - R.RIJ[b]);
  // een steen schuift of springt van veld naar veld; de schaduw blijft op het bord
  function verplaats(g, van, naar, springen) {
    if (!g) return Promise.resolve();
    const [ax, ay] = xy(van), [bx, by] = xy(naar);
    g.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)})`);
    g.setAttribute('data-veld', naar);
    lagen.stenen.appendChild(g);
    if (rustig() || !g.animate) return Promise.resolve();
    const n = afstand(van, naar);
    const duur = springen ? 300 + Math.min(6, n) * 28 : 230 + Math.min(8, n - 1) * 45;
    const a = g.animate([{ transform: `translate(${ax}px, ${ay}px)` }, { transform: `translate(${bx}px, ${by}px)` }], { duration: duur, easing: 'cubic-bezier(.45,.05,.35,1)' });
    const binnen = g.querySelector('.dm-binnen');
    if (binnen) {
      binnen.animate(springen ? [
        { transform: 'translate(0px, 0px) scale(1)' },
        { transform: 'translate(0px, -34px) scale(1.17)', offset: 0.5 },
        { transform: 'translate(0px, 0px) scale(1)' }
      ] : [
        { transform: 'translate(0px, 0px) scale(1)' },
        { transform: 'translate(0px, -5px) scale(1.05)', offset: 0.5 },
        { transform: 'translate(0px, 0px) scale(1)' }
      ], { duration: duur, easing: 'ease-in-out' });
    }
    return a.finished.catch(() => {});
  }
  function landing(g) {
    if (g) animeer(g.querySelector('.dm-binnen'), [{ transform: 'scale(1)' }, { transform: 'scale(1.06, .94)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' });
  }
  // een geslagen steen vliegt naar het stapeltje van wie hem sloeg
  function vliegWeg(s, stuk, pakker, vertraging) {
    const orig = steenOp(s);
    if (orig) orig.remove();
    if (rustig()) return Promise.resolve();
    const g = maakSteen(stuk, s, lagen.vlieg);
    const [x, y] = xy(s);
    const bak = ui.kaart[pakker].querySelector('.mo-buit');
    const r = bak.getBoundingClientRect();
    const [bx, by] = r.height ? naarBord(r.right + 8, r.top + r.height / 2) : [x, pakker ? -80 : MAAT + 80];
    if (!g.animate) { g.remove(); return Promise.resolve(); }
    return g.animate([
      { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
      { transform: `translate(${x}px, ${y - 34}px) scale(1.14)`, opacity: 1, offset: 0.22 },
      { transform: `translate(${bx}px, ${by}px) scale(.3)`, opacity: 0.2 }
    ], { duration: 620, delay: vertraging, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'backwards' }).finished.catch(() => {}).then(() => g.remove());
  }
  // Dam! Er komt een tweede steen bovenop
  async function kroon(s, kant) {
    const stuk = kant === 0 ? R.WS : R.ZS;
    const [x, y] = xy(s);
    if (!rustig()) {
      const g = maakSteen(stuk, s, lagen.vlieg);
      g.querySelector('.dm-schaduw').remove();
      if (g.animate) {
        await g.animate([
          { transform: `translate(${x}px, ${y - 150}px) scale(1.4)`, opacity: 0 },
          { transform: `translate(${x}px, ${y - 14}px) scale(1.03)`, opacity: 1, offset: 0.72 },
          { transform: `translate(${x}px, ${y - 6}px) scale(1)`, opacity: 1 }
        ], { duration: 460, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' }).finished.catch(() => {});
      }
      g.remove();
    }
    tussen.b[s] = kant === 0 ? R.WD : R.ZD;
    tekenStenen();
    landing(steenOp(s));
    if (Geluid.kling) Geluid.kling(); else Geluid.tada();
    if (window.Tril) Tril.succes();
    vonken(14, s);
  }
  function toonBanier(tekst, groot) {
    const b = ui.banier;
    b.textContent = tekst;
    b.classList.toggle('groot', !!groot);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(toonBanier.t);
    toonBanier.t = setTimeout(() => { b.hidden = true; }, groot ? 1700 : 1300);
  }
  function vonken(aantal, rondVeld) {
    if (rustig()) return;
    const r = ui.bordvak.getBoundingClientRect();
    const [cx, cy] = rondVeld ? xy(rondVeld).map((v) => v / MAAT) : [0.5, 0.5];
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      const spreid = rondVeld ? 0.12 : 1;
      v.style.left = ((rondVeld ? cx + (Math.random() - 0.5) * spreid : Math.random()) * r.width) + 'px';
      v.style.top = ((rondVeld ? cy + (Math.random() - 0.5) * spreid : Math.random()) * r.height) + 'px';
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
  function zettenNu() { if (!lijstCache) lijstCache = R.zetten(partij.st); return lijstCache; }
  // de zetten van deze steen die passen bij wat je al gesprongen hebt
  function optiesVan(van) { return van ? zettenNu().filter((z) => z.van === van && deelpad.every((l, i) => z.pad[i] === l)) : []; }

  function nieuwSpel() {
    spelId++;
    partij = R.nieuwePartij();
    lijstCache = null;
    fase = 'kies';
    gekozen = 0; deelpad = []; tussen = null; laatste = null; tip = null; uitkomst = null; geschiedenis = []; verplichtGezegd = 0; tipBezig = false;
    annuleerSleep();
    ui.banier.hidden = true;
    tekenStenen();
    werkKaartenBij();
    zeg(1, 'start');
    bewaarPartij();
    meld(tegen ? `Nieuw spel tegen ${tegen.naam}. Jij speelt met wit en begint.` : 'Nieuw spel met z\'n tweeën. Wit begint.');
  }

  function bewaarVoorTerug() {
    geschiedenis.push({ partij, laatste });
    if (geschiedenis.length > 600) geschiedenis.shift();
  }
  function bewaarPartij() {
    try {
      const p = partij;
      localStorage.setItem(OPSLAG, JSON.stringify({ tegen: tegen ? tegen.id : 'twee', b: Array.from(p.st.b), aan: p.st.aan, sleutels: p.sleutels, damZetten: p.damZetten, eindspel: p.eindspel, eindspelGrens: p.eindspelGrens, eindspelTeller: p.eindspelTeller, nummer: p.nummer, laatste, klaar: !!uitkomst }));
    } catch (e) { /* geen opslag */ }
  }
  function laadPartij() {
    try {
      const d = JSON.parse(localStorage.getItem(OPSLAG) || 'null');
      if (!d || d.klaar || !Array.isArray(d.b) || d.b.length !== 51 || d.b.some((v) => !(v >= 0 && v <= 4))) return null;
      const st = { b: Int8Array.from(d.b), aan: d.aan === 1 ? 1 : 0 };
      const t = R.telling(st.b);
      if (!t.wit || !t.zwart) return null;
      const p = { st, sleutels: Array.isArray(d.sleutels) && d.sleutels.length ? d.sleutels : [R.sleutel(st)], damZetten: d.damZetten | 0, eindspel: d.eindspel || '', eindspelGrens: d.eindspelGrens | 0, eindspelTeller: d.eindspelTeller | 0, nummer: d.nummer | 0, vorige: null };
      if (R.uitslag(p)) return null;
      const l = d.laatste && typeof d.laatste.van === 'number' && Array.isArray(d.laatste.pad) && Array.isArray(d.laatste.slag) ? d.laatste : null;
      return { tegen: d.tegen, partij: p, laatste: l };
    } catch (e) { return null; }
  }

  // Een zet afspelen: schuiven of springen, geslagen stenen weghalen, eventueel dam worden
  async function speelAf(z, kant, o) {
    o = o || {};
    const mijnId = spelId;
    fase = 'bezig'; tip = null;
    if (!tussen) tussen = { b: partij.st.b.slice(), geslagen: [], van: z.van, pad: [], op: z.van };
    tekenStenen();
    werkKaartenBij();
    let van = tussen.op;
    for (let i = tussen.pad.length; i < z.pad.length; i++) {
      const l = z.pad[i];
      const g = steenOp(van);
      if (z.slag.length) {
        if (!(o.gesleept && z.pad.length === 1)) await verplaats(g, van, l, true);
        else if (g) verplaats(g, l, l, false);
      } else if (o.gesleept) {
        verplaats(g, l, l, false);
        landing(g);
      } else await verplaats(g, van, l, false);
      if (mijnId !== spelId) return;
      tussen.b[l] = tussen.b[van]; if (l !== van) tussen.b[van] = 0;
      tussen.pad.push(l); tussen.op = l;
      if (z.slag.length) { tussen.geslagen.push(z.slag[i]); Geluid.steen(); if (window.Tril) Tril.tik(); }
      else { Geluid.steen(); if (window.Tril) Tril.tik(); }
      van = l;
      tekenStenen();
    }
    // de geslagen stenen gaan pas nu van het bord (de Turkse slag)
    if (z.slag.length) {
      await wacht(o.snel ? 60 : 160);
      if (mijnId !== spelId) return;
      const stukken = z.slag.map((s) => tussen.b[s]);
      Geluid.pak();
      if (window.Tril) Tril.klik();
      const vluchten = z.slag.map((s, i) => vliegWeg(s, stukken[i], kant, i * 90));
      z.slag.forEach((s) => { tussen.b[s] = 0; });
      tussen.geslagen = [];
      await Promise.all(vluchten);
      if (mijnId !== spelId) return;
      tekenStenen();
    }
    if (z.kroon) {
      await kroon(z.naar, kant);
      if (mijnId !== spelId) return;
    }
    // vastleggen
    bewaarVoorTerug();
    partij = R.partijZet(partij, z);
    lijstCache = null; tussen = null; gekozen = 0; deelpad = [];
    laatste = { van: z.van, naar: z.naar, pad: z.pad.slice(), slag: z.slag.slice(), kant };
    tekenStenen();
    bewaarPartij();
    // feestjes en praatjes
    const n = z.slag.length;
    if (n >= 3) {
      toonBanier(n === 3 ? 'Drie in één slag!' : n === 4 ? 'Vier in één slag!' : `${n} in één slag!`, true);
      Geluid.tada(); vonken(18 + n * 4);
    } else if (z.kroon) {
      toonBanier('Dam!', true);
    }
    if (tegen) {
      if (kant === 1 && z.kroon) zeg(1, 'dam');
      else if (kant === 1 && n && Math.random() < 0.55) zeg(1, 'slaat');
      else if (kant === 0 && n && (n >= 2 || Math.random() < 0.35)) zeg(1, 'kwijt');
    }
    meld(`${naamVan(kant)}: ${R.notatie(z)}${n ? `, ${n} ${n === 1 ? 'steen' : 'stenen'} geslagen` : ''}${z.kroon ? '. Dam!' : ''}`);
    volgendeBeurt();
  }

  function volgendeBeurt() {
    const u = R.uitslag(partij);
    if (u) return einde(u);
    if (mens(partij.st.aan)) {
      fase = 'kies';
      gekozen = 0;
      // moet je slaan en kan dat maar met één steen, dan pakken we die vast op
      const lijst = zettenNu();
      if (lijst.length && lijst[0].slag.length && new Set(lijst.map((z) => z.van)).size === 1) gekozen = lijst[0].van;
      tekenStenen();
      werkKaartenBij();
      if (lijst.length && lijst[0].slag.length) meld('Je moet slaan.');
      return;
    }
    computerBeurt();
  }

  async function computerBeurt() {
    const mijnId = spelId;
    fase = 'denkt';
    gekozen = 0;
    tekenStenen();
    werkKaartenBij();
    const st = partij.st;
    const opties = Object.assign({ geschiedenis: partij.sleutels.slice(0, -1) }, tegen.denk);
    // de burgemeester opent niet elke keer hetzelfde
    if (!opties.ruis && partij.nummer < 10) opties.ruis = 6;
    const [antwoord] = await Promise.all([R.denk(st, opties), wacht(480 + Math.random() * 420)]);
    if (mijnId !== spelId) return;
    while (lesOpen() && mijnId === spelId) await wacht(250);
    if (mijnId !== spelId) return;
    const z = vindZet(antwoord && antwoord.zet) || zettenNu()[0];
    if (!z) return;
    // eerst even de steen oppakken
    tussen = { b: partij.st.b.slice(), geslagen: [], van: z.van, pad: [], op: z.van };
    fase = 'bezig';
    tekenStenen();
    Geluid.pak();
    await wacht(260);
    if (mijnId !== spelId) return;
    speelAf(z, st.aan, {});
  }
  // de zet uit de denker (of de tip) terugvinden in onze eigen lijst
  function vindZet(z) {
    if (!z) return null;
    const sl = (z.slag || []).slice().sort((a, b) => a - b).join(',');
    return zettenNu().find((m) => m.van === z.van && m.naar === z.naar && m.slag.slice().sort((a, b) => a - b).join(',') === sl) || null;
  }

  const REDEN = { herhaling: 'drie keer dezelfde stand', damzetten: '25 zetten alleen met dammen', eindspel: 'niemand kan nog winnen' };
  function einde(u) {
    fase = 'klaar';
    tussen = null; gekozen = 0; tip = null; deelpad = [];
    uitkomst = u;
    tekenStenen();
    werkKaartenBij();
    bewaarPartij();
    const winnaar = u.remise ? null : u.winnaar;
    const ikWin = winnaar === 0, tegenComputer = !!tegen;
    let bedrag, tekst, verder = null;
    if (winnaar === null) {
      bedrag = 15; tekst = `Remise: ${REDEN[u.reden] || 'gelijkspel'}`;
      toonBanier('Remise', false);
      Geluid.klok();
      zeg(1, 'remise');
    } else if (!tegenComputer) {
      bedrag = 20; tekst = `${naamVan(winnaar)} wint!`;
      toonBanier(tekst, true);
      Geluid.tada(); vonken(30);
    } else if (ikWin) {
      const telling = gewonnen();
      const eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('dam-gewonnen', telling);
      bedrag = tegen.beloning; tekst = `Gewonnen van ${tegen.naam}!`;
      toonBanier('Gewonnen!', true);
      Geluid.tada(); vonken(40);
      if (window.Tril) Tril.succes();
      zeg(1, 'verliest');
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} is vrij!`;
        verder = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('dam-tegen', volgende.id); nieuwSpel(); } };
      }
    } else {
      bedrag = 10; tekst = `${tegen.naam} won. Goed geprobeerd!`;
      toonBanier(`${tegen.naam} wint`, false);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst + (u.reden === 'vast' ? ' (geen zet meer mogelijk)' : ''));
    if (window.Duiten) Duiten.beloon({ spel: 'dammen', bedrag, gewonnen: winnaar === 0 || !tegenComputer, tekst, verder, wacht: 2300 });
  }

  // ============================================================
  // TIKKEN, SLEPEN EN TOETSEN
  // ============================================================
  function veldBij(px, py, ruim) {
    const [x, y] = naarBord(px, py);
    const kol = Math.floor((x - RAND) / VELD), rij = Math.floor((y - RAND) / VELD);
    if (!ruim) {
      if (kol < 0 || kol > 9 || rij < 0 || rij > 9) return 0;
      return R.OP[rij][kol] || 0;
    }
    // bij loslaten: het dichtstbijzijnde donkere veld
    let beste = 0, d = Infinity;
    for (let s = 1; s <= 50; s++) {
      const [qx, qy] = xy(s);
      const a = Math.hypot(qx - x, qy - y);
      if (a < d) { d = a; beste = s; }
    }
    return d < VELD * 0.75 ? beste : 0;
  }
  const kanKiezen = (s) => zettenNu().some((z) => z.van === s);

  function kies(s) {
    gekozen = s; deelpad = []; tip = tip && tip.van === s ? tip : null;
    Geluid.pak();
    if (window.Tril) Tril.tik();
    tekenStenen();
    werkKaartenBij();
  }

  function neer(e) {
    if (!mens(partij.st.aan) || (fase !== 'kies' && fase !== 'slaat')) return;
    const s = veldBij(e.clientX, e.clientY);
    druk = { s, x: e.clientX, y: e.clientY, id: e.pointerId, wasGekozen: gekozen === s && fase === 'kies' };
    const b = partij.st.b;
    if (fase === 'kies' && s && eigen(b[s], partij.st.aan) && kanKiezen(s)) {
      sleep = { van: s, actief: false };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      if (gekozen !== s) kies(s);
    } else if (fase === 'slaat' && s && s === tussen.op) {
      sleep = { van: s, actief: false, verder: true };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    }
    e.preventDefault();
  }
  function beweeg(e) {
    if (!sleep || !druk || e.pointerId !== druk.id) return;
    if (!sleep.actief && Math.hypot(e.clientX - druk.x, e.clientY - druk.y) > 10) {
      sleep.actief = true;
      const g = steenOp(sleep.van);
      if (g) g.classList.add('weg-gesleept');
      sleep.g = maakSteen(beeldBord()[sleep.van], sleep.van, lagen.vlieg);
      sleep.g.classList.add('zweeft');
    }
    if (sleep.actief) {
      const [x, y] = naarBord(e.clientX, e.clientY);
      sleep.g.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - 22).toFixed(1)})`);
      const doel = veldBij(e.clientX, e.clientY - 22 * (svg.getBoundingClientRect().width / MAAT), true);
      lagen.doelen.querySelectorAll('.dm-doel').forEach((c) => c.classList.toggle('onder', +c.getAttribute('data-veld') === doel));
    }
  }
  function annuleerSleep() {
    if (sleep && sleep.g) sleep.g.remove();
    if (lagen.stenen) lagen.stenen.querySelectorAll('.weg-gesleept').forEach((g) => g.classList.remove('weg-gesleept'));
    sleep = null;
  }
  function los(e) {
    if (!druk || e.pointerId !== druk.id) return;
    const begin = druk;
    druk = null;
    if (sleep && sleep.actief) {
      const doel = veldBij(e.clientX, e.clientY - 22 * (svg.getBoundingClientRect().width / MAAT), true);
      const van = sleep.van;
      annuleerSleep();
      if (doel && doel !== van) tik(doel, true);
      else { tekenStenen(); if (doel !== van && window.Tril) Tril.fout(); }
      return;
    }
    sleep = null;
    if (Math.hypot(e.clientX - begin.x, e.clientY - begin.y) >= 24) return;
    if (fase === 'kies' && begin.s && begin.s === gekozen) {
      // de steen werd bij het neerzetten van de vinger al gekozen; nog een tik laat hem los
      if (begin.wasGekozen) { gekozen = 0; tip = null; tekenStenen(); werkKaartenBij(); }
      return;
    }
    tik(begin.s, false);
  }

  function tik(s, gesleept) {
    if (!mens(partij.st.aan) || (fase !== 'kies' && fase !== 'slaat')) return;
    const b = partij.st.b, kant = partij.st.aan;
    if (fase === 'slaat') {
      const k = deelpad.length, opts = optiesVan(gekozen);
      if (s && opts.some((z) => z.pad[k] === s)) { slaStap(s, gesleept); return; }
      const eind = opts.filter((z) => z.naar === s);
      if (s && eind.length === 1) { speelAf(eind[0], kant, { gesleept: false }); return; }
      fout();
      return;
    }
    if (s && eigen(b[s], kant)) {
      if (kanKiezen(s)) { if (gekozen !== s) kies(s); return; }
      const lijst = zettenNu();
      if (lijst.length && lijst[0].slag.length) { moetSlaan(s); return; }
      fout();
      return;
    }
    if (gekozen && s) {
      const opts = optiesVan(gekozen);
      const eerste = opts.filter((z) => z.pad[0] === s);
      if (eerste.length === 1 && eerste[0].pad.length === 1) { speelAf(eerste[0], kant, { gesleept }); return; }
      if (eerste.length) { slaStap(s, gesleept); return; }
      const eind = opts.filter((z) => z.naar === s);
      if (eind.length === 1) { speelAf(eind[0], kant, {}); return; }
    }
    if (gekozen) { gekozen = 0; tekenStenen(); werkKaartenBij(); }
    if (s && !b[s] && zettenNu().length && zettenNu()[0].slag.length) { moetSlaan(0); return; }
    if (s) fout();
  }

  // een meerslag stap voor stap; is er nog maar één weg, dan gaat hij vanzelf verder
  async function slaStap(l, gesleept) {
    const mijnId = spelId, kant = partij.st.aan, k = deelpad.length;
    const opts = optiesVan(gekozen).filter((z) => z.pad[k] === l);
    if (!opts.length) return;
    if (!tussen) tussen = { b: partij.st.b.slice(), geslagen: [], van: gekozen, pad: [], op: gekozen };
    const van = tussen.op, prooi = opts[0].slag[k];
    fase = 'bezig';
    tekenStenen();
    werkKaartenBij();
    const g = steenOp(van);
    if (gesleept && k === 0) { verplaats(g, l, l, false); landing(g); }
    else await verplaats(g, van, l, true);
    if (mijnId !== spelId) return;
    tussen.b[l] = tussen.b[van]; if (l !== van) tussen.b[van] = 0;
    tussen.geslagen.push(prooi); tussen.pad.push(l); tussen.op = l;
    deelpad.push(l);
    Geluid.steen();
    if (window.Tril) Tril.tik();
    const rest = optiesVan(gekozen);
    if (rest.length === 1 && rest[0].pad.length === deelpad.length) { speelAf(rest[0], kant, {}); return; }
    const volgende = new Set(rest.map((z) => z.pad[deelpad.length]));
    fase = 'slaat';
    if (volgende.size === 1) { tekenStenen(); await wacht(90); if (mijnId === spelId && fase === 'slaat') slaStap([...volgende][0], false); return; }
    tekenStenen();
    werkKaartenBij();
    meld('Sla verder: kies waar je steen landt.');
  }

  // Slaan is verplicht: laat zien welke stenen moeten slaan
  function moetSlaan(s) {
    fout();
    const lijst = zettenNu();
    // kan deze steen wel slaan, maar niet de meeste stukken? dan zeggen we dat
    let tekst = 'Slaan is verplicht!';
    if (s && R.slagenVan(partij.st, s).length) tekst = 'Sla zoveel mogelijk!';
    if (verplichtGezegd < 3 || tekst !== 'Slaan is verplicht!') { toonBanier(tekst, false); verplichtGezegd++; }
    meld(tekst + ` Je kunt slaan met ${lijst.length === 1 ? 'de steen op veld ' + lijst[0].van : 'de stenen die oplichten'}.`);
    lagen.ring.querySelectorAll('.dm-moet').forEach((c) => { c.classList.remove('flits'); void c.getBoundingClientRect(); c.classList.add('flits'); });
  }
  function fout() {
    if (window.Tril) Tril.fout();
    Geluid.pak();
    const v = ui.kaart[partij.st.aan].querySelector('.mo-doe');
    v.classList.remove('schud'); void v.offsetWidth; v.classList.add('schud');
  }

  // toetsenbord: pijltjes over de donkere velden, Enter of spatie om te tikken
  function toets(e) {
    const pijl = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!pijl && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (!focusVeld) focusVeld = gekozen || 32;
    if (pijl) {
      let r = R.RIJ[focusVeld], c = R.KOL[focusVeld];
      if (pijl[1]) c += pijl[1] * 2;
      if (pijl[0] < 0) { r--; c += c < 9 ? 1 : -1; }
      if (pijl[0] > 0) { r++; c += c > 0 ? -1 : 1; }
      r = Math.max(0, Math.min(9, r)); c = Math.max(0, Math.min(9, c));
      if (!R.OP[r][c]) c += c < 9 ? 1 : -1;
      if (R.OP[r][c]) focusVeld = R.OP[r][c];
    } else {
      tik(focusVeld, false);
    }
    lagen.focus.textContent = '';
    vak(focusVeld, 'dm-focus', lagen.focus);
    const stuk = beeldBord()[focusVeld];
    meld(`Veld ${focusVeld}${stuk ? ': ' + (R.kleurVan(stuk) === 0 ? 'wit' : 'zwart') + (R.isDam(stuk) ? 'e dam' : 'e steen') : ''}`);
  }

  // ============================================================
  // TERUGNEMEN EN TIP
  // ============================================================
  function neemTerug() {
    if (fase === 'denkt' || fase === 'bezig') return;
    // midden in een slag: alleen de halve slag terug
    if (fase === 'slaat') {
      spelId++;
      tussen = null; deelpad = [];
      fase = 'kies';
      tekenStenen(); werkKaartenBij();
      Geluid.schuif();
      return;
    }
    if (!geschiedenis.length) return;
    spelId++;
    annuleerSleep();
    let vorige = geschiedenis.pop();
    // tegen de computer: terug tot jij weer aan zet bent
    while (tegen && vorige.partij.st.aan !== 0 && geschiedenis.length) vorige = geschiedenis.pop();
    if (tegen && vorige.partij.st.aan !== 0) { geschiedenis.push(vorige); return; }
    partij = vorige.partij; laatste = vorige.laatste;
    lijstCache = null; tussen = null; gekozen = 0; deelpad = []; tip = null; uitkomst = null;
    fase = 'kies';
    ui.banier.hidden = true;
    tekenStenen();
    werkKaartenBij();
    bewaarPartij();
    Geluid.schuif();
    if (window.Tril) Tril.tik();
    meld('Zet teruggenomen.');
  }

  async function geefTip() {
    if (fase !== 'kies' || !mens(partij.st.aan) || tipBezig) return;
    const mijnId = spelId, nummer = partij.nummer;
    tipBezig = true;
    werkKaartenBij();
    const r = await R.denk(partij.st, { diepte: 64, tijd: 700, geschiedenis: partij.sleutels.slice(0, -1) });
    tipBezig = false;
    if (mijnId !== spelId || partij.nummer !== nummer || fase !== 'kies') { werkKaartenBij(); return; }
    const z = vindZet(r && r.zet) || zettenNu()[0];
    if (!z) { werkKaartenBij(); return; }
    tip = z;
    gekozen = z.van; deelpad = [];
    tekenStenen();
    werkKaartenBij();
    Geluid.pak();
    if (window.Tril) Tril.tik();
    meld(`Tip: ${R.notatie(z)}`);
  }

  // ============================================================
  // KEUZEMENU: TEGEN WIE SPEEL JE?
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
      const pips = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-dam"/></svg>`).join('')}</span>`;
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
        if (window.Duiten) Duiten.zetVeld('dam-tegen', t.id);
        sluitMenu();
        nieuwSpel();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function veldVak(lijst, ruimte) {
    const m = svg.getScreenCTM();
    const pts = lijst.map((s) => { const [x, y] = xy(s); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; });
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), h = ruimte * m.a;
    return { left: Math.min(...xs) - h, top: Math.min(...ys) - h, width: Math.max(...xs) - Math.min(...xs) + 2 * h, height: Math.max(...ys) - Math.min(...ys) + 2 * h };
  }
  const midden = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  // voorbeeldstanden voor de uitleg; de steen die Gijs verschuift, draagt zijn vinger
  const lesOpen = () => { const l = document.getElementById('les'); return !!l && !l.hidden; };
  function lesBord(soort) {
    if (!svg) return;
    if (soort && fase !== 'kies' && fase !== 'klaar' && fase !== 'slaat') soort = null;
    if (soort === lesSoort) return;
    lesSoort = soort;
    if (!soort) { lesStand = null; tekenStenen(); return; }
    const b = new Int8Array(51);
    const leg = (lijst, stuk) => lijst.forEach((v) => { b[v] = stuk; });
    if (soort === 'schuif') { leg([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], R.ZS); leg([31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], R.WS); }
    if (soort === 'slaan') { leg([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 28], R.ZS); leg([31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], R.WS); }
    if (soort === 'meer') { leg([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 15, 16, 18, 20, 28], R.ZS); leg([31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], R.WS); }
    if (soort === 'overkant') { leg([13, 15, 16, 20, 24, 26], R.ZS); leg([33, 36, 38, 44, 47, 49], R.WS); }
    if (soort === 'vlieg') { leg([13, 15, 16, 20, 24, 26], R.ZS); leg([33, 38, 44, 47, 49], R.WS); leg([46], R.WD); }
    lesStand = b;
    tekenStenen();
  }
  // als Gijs klaar is, komt de echte partij terug
  if (typeof MutationObserver !== 'undefined') {
    const les = document.getElementById('les');
    if (les) new MutationObserver(() => { if (les.hidden && lesSoort) lesBord(null); }).observe(les, { attributes: true, attributeFilter: ['hidden'] });
  }
  if (window.Les) {
    const veeg = (van, naar) => ({ van: () => midden(veldVak([van], 0)), naar: () => midden(veldVak([naar], 0)) });
    Les.zet('dammen', () => [
      Object.assign({ doel: () => { lesBord('schuif'); return veldVak([32, 28], 50); }, gebaar: 'veeg', voorwerp: 'damsteen', tekst: 'Schuif je steen schuin vooruit' }, veeg(32, 28)),
      Object.assign({ doel: () => { lesBord('slaan'); return veldVak([32, 28, 23], 50); }, gebaar: 'veeg', voorwerp: 'damsteen', tekst: 'Spring over een steen om hem te slaan' }, veeg(32, 23)),
      { doel: () => { lesBord('meer'); return veldVak([32, 28, 23, 18, 12], 46); }, gebaar: 'wijs', tekst: 'Slaan moet, en dan zoveel mogelijk' },
      Object.assign({ doel: () => { lesBord('overkant'); return veldVak([7, 1, 2, 3], 46); }, gebaar: 'veeg', voorwerp: 'damsteen', tekst: 'Kom je aan de overkant, dan word je dam' }, veeg(7, 2)),
      Object.assign({ doel: () => { lesBord('vlieg'); return veldVak([46, 5], 44); }, gebaar: 'veeg', duur: 1900, tekst: 'Een dam vliegt over de hele lijn' }, veeg(46, 5)),
      { doel: () => { lesBord(null); return ui.kaart[1]; }, gebaar: 'tik', tekst: 'Tik hier om een tegenstander te kiezen' },
      { doel: () => { lesBord(null); const a = ui.terug.getBoundingClientRect(), b = ui.tip.getBoundingClientRect(); return { left: a.left, top: Math.min(a.top, b.top), width: b.right - a.left, height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) }; }, gebaar: 'wijs', tekst: 'Zet terug, of vraag een tip' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.dammen = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('dam-tegen', 'jantje') : 'jantje';
        const zoek = (id) => (id === 'twee' ? TWEE : TEGENSTANDERS.find((x) => x.id === id));
        const t = zoek(bewaard);
        tegen = t === TWEE ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
        kleurStenen();
        const oud = laadPartij();
        requestAnimationFrame(() => {
          pasMaatAan();
          const ot = oud && zoek(oud.tegen);
          if (oud && ot && (ot === TWEE || isOpen(ot))) {
            // verder waar je was
            tegen = ot === TWEE ? null : ot;
            partij = oud.partij; laatste = oud.laatste; lijstCache = null;
            geschiedenis = []; uitkomst = null; tussen = null; gekozen = 0; deelpad = [];
            if (mens(partij.st.aan)) volgendeBeurt(); else computerBeurt();
            meld(tegen ? `Verder met je partij tegen ${tegen.naam}.` : 'Verder met jullie partij.');
          } else {
            nieuwSpel();
          }
        });
      } else {
        kleurStenen();
        pasMaatAan();
        werkKaartenBij();
        if (fase === 'denkt') computerBeurt();
      }
      if (window.Les) Les.eersteKeer('dammen');
    },
    stop() {
      spelId++;
      annuleerSleep();
      lesStand = null; lesSoort = null;
      tipBezig = false;
      if (ui.menu) sluitMenu();
      // een onderbroken beurt begint opnieuw bij terugkomst (een halve zet van jou vervalt)
      if (fase === 'bezig' || fase === 'denkt' || fase === 'slaat') {
        tussen = null; gekozen = 0; deelpad = []; tip = null;
        fase = mens(partij.st.aan) ? 'kies' : 'denkt';
        if (svg) tekenStenen();
      }
    },
    opnieuw() { nieuwSpel(); },
    // voor tests
    _toestand() { return { fase, aan: partij.st.aan, nummer: partij.nummer, b: Array.from(beeldBord()), gekozen, deelpad: deelpad.slice(), uitkomst, tegen: tegen ? tegen.id : 'twee', laatste }; },
    _zet(b, aan) { spelId++; partij = R.nieuwePartij({ b: Int8Array.from(b), aan }); lijstCache = null; laatste = null; geschiedenis = []; uitkomst = null; tussen = null; gekozen = 0; deelpad = []; tip = null; volgendeBeurt(); },
    _xy(s) { const [x, y] = xy(s); const m = svg.getScreenCTM(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; }
  };
})();
