/* Molenspel, schermvullend: negen stenen per speler op een ingekraste steen.
   Alles zit in het speelveld: bovenin je tegenstander, in het midden het bord, onderin jijzelf met je knoppen.

   Overgenomen van succesvolle molen- en bordspel-apps:
   - tegenstanders met een eigen gezicht en karakter, van makkelijk tot heel moeilijk (zoals de bots van Chess.com);
     versla je er een, dan komt de volgende vrij;
   - je ziet waar je kunt zetten, en de laatste zet van de ander blijft zichtbaar (gevraagd op Board Game Arena);
   - onbeperkt terugnemen en een tip (gevraagd in recensies van molen-apps);
   - een feestje bij een molen, en een groter feest bij een zwikmolen (zoals 'Briljant' bij Chess.com);
   - tikken of slepen, grote stenen en korte potjes. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  // BORD EN REGELS
  // De 24 punten zijn bits in een getal; zo rekent de computer snel.
  // ============================================================
  const PUNTEN = [
    [0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2],
    [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3],
    [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]
  ];
  const MOLENS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
    [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]
  ];
  const BUREN = PUNTEN.map(() => []);
  MOLENS.forEach(([a, b, c]) => { BUREN[a].push(b); BUREN[b].push(a, c); BUREN[c].push(b); });
  const BIT = PUNTEN.map((_, i) => 1 << i);
  const MOLENMASKER = MOLENS.map((m) => BIT[m[0]] | BIT[m[1]] | BIT[m[2]]);
  const MOLENS_VAN = PUNTEN.map((_, i) => MOLENMASKER.filter((m) => m & BIT[i]));
  const BUURMASKER = BUREN.map((l) => l.reduce((a, j) => a | BIT[j], 0));
  const ALLES = (1 << 24) - 1;
  const RAND = 64, STAP = 96, MAAT = RAND * 2 + STAP * 6;
  const xy = (i) => [RAND + PUNTEN[i][0] * STAP, RAND + PUNTEN[i][1] * STAP];
  function bits(m) { let n = 0; while (m) { m &= m - 1; n++; } return n; }
  const inMolen = (mask, i) => MOLENS_VAN[i].some((m) => (mask & m) === m);
  const NIEUW = () => ({ s: [0, 0], hand: [9, 9], aan: 0, zonder: 0 });

  // Alle zetten voor wie aan zet is: [van, naar, weg]; van = -1 bij plaatsen, weg = -1 zonder molen.
  function zetten(st) {
    const ik = st.aan, jij = 1 - ik, mijn = st.s[ik], zijn = st.s[jij];
    const leeg = ALLES & ~(mijn | zijn);
    const lijst = [];
    let vrij = -1; // stenen van de ander die je mag wegnemen, pas uitrekenen als het nodig is
    const voegToe = (van, naar, nieuw) => {
      if (!MOLENS_VAN[naar].some((m) => (nieuw & m) === m)) { lijst.push([van, naar, -1]); return; }
      if (vrij < 0) {
        vrij = 0;
        for (let i = 0; i < 24; i++) if ((zijn & BIT[i]) && !inMolen(zijn, i)) vrij |= BIT[i];
        if (!vrij) vrij = zijn;
      }
      if (!vrij) { lijst.push([van, naar, -1]); return; }
      for (let i = 0; i < 24; i++) if (vrij & BIT[i]) lijst.push([van, naar, i]);
    };
    if (st.hand[ik] > 0) {
      for (let n = 0; n < 24; n++) if (leeg & BIT[n]) voegToe(-1, n, mijn | BIT[n]);
    } else {
      const vlieg = bits(mijn) === 3;
      for (let v = 0; v < 24; v++) {
        if (!(mijn & BIT[v])) continue;
        const doelen = vlieg ? leeg : (BUURMASKER[v] & leeg);
        if (!doelen) continue;
        const zonder = mijn & ~BIT[v];
        for (let n = 0; n < 24; n++) if (doelen & BIT[n]) voegToe(v, n, zonder | BIT[n]);
      }
    }
    return lijst;
  }

  function speel(st, z) {
    const [van, naar, weg] = z, ik = st.aan, jij = 1 - ik;
    const s = [st.s[0], st.s[1]], hand = [st.hand[0], st.hand[1]];
    if (van < 0) hand[ik]--; else s[ik] &= ~BIT[van];
    s[ik] |= BIT[naar];
    if (weg >= 0) s[jij] &= ~BIT[weg];
    const schuiven = hand[0] === 0 && hand[1] === 0;
    return { s, hand, aan: jij, zonder: weg >= 0 || !schuiven ? 0 : st.zonder + 1 };
  }

  // Maakt deze zet (zonder het wegnemen) een molen?
  function maaktMolen(st, van, naar) {
    let nieuw = st.s[st.aan];
    if (van >= 0) nieuw &= ~BIT[van];
    nieuw |= BIT[naar];
    return MOLENS_VAN[naar].filter((m) => (nieuw & m) === m);
  }

  // Wie aan zet is: verloren, gelijkspel of nog bezig?
  function uitslag(st) {
    const ik = st.aan;
    if (bits(st.s[ik]) + st.hand[ik] < 3) return 'verloren';
    if (st.hand[ik] === 0 && !zetten(st).length) return 'vast';
    if (st.zonder >= 50) return 'remise';
    return null;
  }
  const sleutel = (st) => st.s[0] + ',' + st.s[1] + ',' + st.aan + ',' + st.hand[0] + ',' + st.hand[1];

  // ============================================================
  // DE COMPUTER: alpha-beta, steeds een zet dieper zolang er tijd is
  // ============================================================
  let deadline = 0, knopen = 0;
  const STOP = { stop: true };

  function beweeglijk(mask, leeg) {
    let n = 0;
    for (let v = 0; v < 24; v++) if (mask & BIT[v]) n += bits(BUURMASKER[v] & leeg);
    return n;
  }
  function waarde(st, kant) {
    const ander = 1 - kant, m = st.s[kant], t = st.s[ander];
    const nm = bits(m) + st.hand[kant], nt = bits(t) + st.hand[ander];
    const leeg = ALLES & ~(m | t);
    let w = (nm - nt) * 100;
    for (let k = 0; k < 16; k++) {
      const mm = MOLENMASKER[k], a = bits(m & mm), b = bits(t & mm);
      if (a === 3) w += 14; else if (a === 2 && b === 0) w += 18;
      if (b === 3) w -= 14; else if (b === 2 && a === 0) w -= 18;
    }
    if (st.hand[kant] === 0 && bits(m) > 3) w += 6 * beweeglijk(m, leeg);
    if (st.hand[ander] === 0 && bits(t) > 3) {
      const mob = beweeglijk(t, leeg);
      w -= 6 * mob;
      if (mob === 0) w += 3000; // de ander zit klem
    }
    return w;
  }
  function zoek(st, diepte, alpha, beta, ply) {
    if ((++knopen & 1023) === 0 && performance.now() > deadline) throw STOP;
    const ik = st.aan;
    if (bits(st.s[ik]) + st.hand[ik] < 3) return -100000 + ply;
    if (st.zonder >= 50) return 0;
    const lijst = zetten(st);
    if (!lijst.length) return -100000 + ply;
    if (diepte <= 0) return waarde(st, ik);
    lijst.sort((a, b) => (b[2] >= 0) - (a[2] >= 0));
    let beste = -Infinity;
    for (let k = 0; k < lijst.length; k++) {
      const v = -zoek(speel(st, lijst[k]), diepte - 1, -beta, -alpha, ply + 1);
      if (v > beste) { beste = v; if (v > alpha) { alpha = v; if (alpha >= beta) break; } }
    }
    return beste;
  }
  function slimmeZet(st, diepte, tijd, ruis) {
    let lijst = zetten(st);
    if (lijst.length <= 1) return lijst[0] || null;
    deadline = performance.now() + tijd;
    let klaar = null, klaarScores = null;
    for (let d = 1; d <= diepte; d++) {
      try {
        let best = -Infinity;
        const sc = [];
        for (const z of lijst) {
          const grens = best === -Infinity ? -Infinity : best - ruis - 1;
          const v = -zoek(speel(st, z), d - 1, -Infinity, -grens, 1);
          sc.push(v);
          if (v > best) best = v;
        }
        const volgorde = lijst.map((_, i) => i).sort((a, b) => sc[b] - sc[a]);
        lijst = volgorde.map((i) => lijst[i]);
        klaar = lijst; klaarScores = volgorde.map((i) => sc[i]);
        if (Math.abs(klaarScores[0]) > 50000) break;
      } catch (e) {
        if (e !== STOP) throw e;
        break;
      }
    }
    if (!klaar) return lijst[0];
    const top = klaarScores[0];
    const kandidaten = klaar.filter((_, i) => klaarScores[i] >= top - ruis);
    return kandidaten[Math.floor(Math.random() * kandidaten.length)];
  }
  function domZet(st) {
    const lijst = zetten(st);
    const molen = lijst.filter((z) => z[2] >= 0);
    if (molen.length && Math.random() < 0.65) return molen[Math.floor(Math.random() * molen.length)];
    // soms een molen van de ander tegenhouden
    if (Math.random() < 0.35) {
      const ander = { s: st.s, hand: st.hand, aan: 1 - st.aan, zonder: 0 };
      const dreig = new Set(zetten(ander).filter((z) => z[2] >= 0).map((z) => z[1]));
      const blok = lijst.filter((z) => dreig.has(z[1]));
      if (blok.length) return blok[Math.floor(Math.random() * blok.length)];
    }
    return lijst[Math.floor(Math.random() * lijst.length)];
  }

  // ============================================================
  // TEGENSTANDERS
  // ============================================================
  const gezicht = Object.assign({}, window.Personen ? Personen.gezicht : {}, {
    wit: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#5A4630"/><circle cx="33" cy="35" r="20" fill="#000" opacity=".3"/><circle cx="32" cy="32" r="20" fill="url(#mo-mini-wit)"/><circle cx="32" cy="32" r="13" fill="none" stroke="rgba(120,100,60,.35)" stroke-width="1.4"/></svg>',
    zwart: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#7A6A52"/><circle cx="33" cy="35" r="20" fill="#000" opacity=".3"/><circle cx="32" cy="32" r="20" fill="url(#mo-mini-zwart)"/><circle cx="32" cy="32" r="13" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.4"/></svg>'
  });

  const TEGENSTANDERS = [
    { id: 'jantje', naam: 'Jantje', niveau: 1, dom: true, beloning: 25,
      zegt: { start: ['Ik ga winnen!', 'Doe je mee?'], molen: ['Joepie, molen!', 'Hihi, molen!'], kwijt: ['Hé, mijn steen!', 'Oeps!'], wint: ['Hoera, gewonnen!'], verliest: ['Nog een keer?', 'Jij bent goed!'] } },
    { id: 'grietje', naam: 'Grietje', niveau: 2, diepte: 2, tijd: 250, ruis: 45, beloning: 40,
      zegt: { start: ['Zullen we?', 'Pas maar op!'], molen: ['Molen!', 'Die is voor mij.'], kwijt: ['Ach, mijn steen.', 'Slim hoor.'], wint: ['Gewonnen!'], verliest: ['Goed gespeeld!'] } },
    { id: 'kees', naam: 'Molenaar Kees', niveau: 3, diepte: 4, tijd: 450, ruis: 12, beloning: 60,
      zegt: { start: ['De wieken draaien.', 'Daar gaan we.'], molen: ['Zo maalt de molen.', 'Molen!'], kwijt: ['Hm, slim.', 'Die zag ik niet.'], wint: ['Fijngemalen!'], verliest: ['Knap gedaan!'] } },
    { id: 'burgemeester', naam: 'De burgemeester', niveau: 4, diepte: 9, tijd: 950, ruis: 0, beloning: 90,
      zegt: { start: ['Welaan.', 'Ik speel om te winnen.'], molen: ['Zo gaat dat.', 'Molen.'], kwijt: ['Brutaal!', 'Hm.'], wint: ['De stad is van mij.'], verliest: ['Petje af!'] } }
  ];
  const TWEE = { id: 'twee', naam: 'Met z\'n tweeën' };
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, svg, lagen = {}, ui = {}, gebouwd = false;
  let stand = NIEUW();
  let tegen = TEGENSTANDERS[0];   // null = met z'n tweeën
  let fase = 'klaar';             // kies | pak | denkt | klaar
  let gekozen = -1, tussen = null, laatste = null, tip = null, geschiedenis = [], herhaling = new Map();
  let spelId = 0, buit = [0, 0], uitkomst = null, druk = null, sleep = null;
  let laatsteTussenZet = { van: -1, naar: -1 };
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 60) : ms));
  const mens = (kant) => !tegen || kant === 0;
  const naamVan = (kant) => (tegen ? (kant === 0 ? 'Jij' : tegen.naam) : (kant === 0 ? 'Wit' : 'Zwart'));
  const gewonnen = () => (window.Duiten ? Duiten.veld('molen-gewonnen', {}) : {});
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
  // OPBOUW VAN HET SPEELVELD
  // ============================================================
  function bouw() {
    podium = document.getElementById('mo-podium');
    podium.innerHTML = '';
    podium.appendChild(html(`<svg class="mo-defs" width="0" height="0" aria-hidden="true"><defs>
      <radialGradient id="mo-mini-wit" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFDF6"/><stop offset=".7" stop-color="#E6DCC6"/><stop offset="1" stop-color="#B9AD92"/></radialGradient>
      <radialGradient id="mo-mini-zwart" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#6A5F57"/><stop offset=".6" stop-color="#2C2522"/><stop offset="1" stop-color="#151110"/></radialGradient>
    </defs></svg>`));
    const boven = html(`<div class="mo-rij mo-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="mo-kaart mo-speler" type="button" data-kant="1" aria-haspopup="dialog">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-wieken"></span><span class="mo-doe"></span></span>
        <span class="mo-stapels"><span class="mo-hand"></span><span class="mo-buit"></span></span>
        <span class="mo-ballon" hidden></span>
      </button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenstander" title="Kies je tegenstander" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="mo-bordvak"><div class="mo-banier" aria-hidden="true" hidden></div><div class="mo-vonken" aria-hidden="true"></div></div></div>`);
    const onder = html(`<div class="mo-rij mo-onder">
      <div class="mo-kaart mo-speler" data-kant="0">
        <span class="mo-gezicht"></span>
        <span class="mo-info"><span class="mo-naam"></span><span class="mo-doe"></span></span>
        <span class="mo-stapels"><span class="mo-hand"></span><span class="mo-buit"></span></span>
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
    ui.bordvak.insertBefore(bouwBord(), ui.bordvak.firstChild);

    boven.querySelector('.mo-speler').addEventListener('click', openMenu);
    boven.querySelector('.mo-meer').addEventListener('click', openMenu);
    boven.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('molenspel'); });
    ui.terug.addEventListener('click', neemTerug);
    ui.tip.addEventListener('click', geefTip);
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ui.menu.hidden) sluitMenu(); });

    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    gebouwd = true;
  }

  // Het bord zo groot mogelijk in het midden
  function pasMaatAan() {
    if (!ui.midden) return;
    const r = ui.midden.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const maat = Math.floor(Math.min(r.width - 16, r.height - 12, 760));
    podium.style.setProperty('--bord', Math.max(240, maat) + 'px');
  }

  // Een ingekraste steen; de korrel wordt één keer op een canvas getekend
  let korrelUrl = null;
  function korrel() {
    if (korrelUrl !== null) return korrelUrl;
    korrelUrl = '';
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 320;
      const g = c.getContext('2d');
      const d = g.createImageData(320, 320);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 70;
        d.data[i] = v; d.data[i + 1] = v * 0.98; d.data[i + 2] = v * 0.93; d.data[i + 3] = 60;
      }
      g.putImageData(d, 0, 0);
      for (let i = 0; i < 260; i++) {
        g.fillStyle = Math.random() < 0.5 ? 'rgba(60,52,44,.25)' : 'rgba(255,250,235,.25)';
        g.beginPath(); g.arc(Math.random() * 320, Math.random() * 320, Math.random() * 2.2, 0, 7); g.fill();
      }
      korrelUrl = c.toDataURL('image/png');
    } catch (e) { korrelUrl = ''; }
    return korrelUrl;
  }

  function bouwBord() {
    svg = el('svg', { viewBox: `0 0 ${MAAT} ${MAAT}`, class: 'mo-bord', role: 'group', 'aria-label': 'Het molenbord' });
    const defs = el('defs', {}, svg);
    const grad = (id, stops, attrs) => {
      const g = el(attrs && attrs.lin ? 'linearGradient' : 'radialGradient', Object.assign({ id }, attrs && attrs.lin ? { x1: 0, y1: 0, x2: 0, y2: 1 } : { cx: '35%', cy: '30%', r: '75%' }), defs);
      stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));
    };
    grad('mo-wit', [[0, '#FFFDF6'], [0.7, '#E6DCC6'], [1, '#B9AD92']]);
    grad('mo-zwart', [[0, '#6A5F57'], [0.6, '#2C2522'], [1, '#151110']]);
    grad('mo-vlak', [[0, '#C9C3B6'], [1, '#9C968A']], { lin: true });
    // de stenen plaat met een afgeschuinde rand
    el('rect', { x: 10, y: 16, width: MAAT - 20, height: MAAT - 16, rx: 22, fill: '#000', opacity: 0.35 }, svg);
    el('rect', { x: 4, y: 4, width: MAAT - 8, height: MAAT - 8, rx: 22, fill: '#7E786C' }, svg);
    el('rect', { x: 10, y: 10, width: MAAT - 20, height: MAAT - 20, rx: 18, fill: 'url(#mo-vlak)' }, svg);
    const k = korrel();
    if (k) el('image', { href: k, x: 10, y: 10, width: MAAT - 20, height: MAAT - 20, preserveAspectRatio: 'none', opacity: 0.9, 'pointer-events': 'none' }, svg);
    el('rect', { x: 10, y: 10, width: MAAT - 20, height: MAAT - 20, rx: 18, fill: 'none', stroke: 'rgba(255,250,235,.35)', 'stroke-width': 2 }, svg);
    // ingekraste lijnen: licht randje en een donkere groef
    const a = RAND, b = RAND + STAP, c = RAND + 2 * STAP, m = RAND + 3 * STAP, d = RAND + 4 * STAP, e = RAND + 5 * STAP, f = RAND + 6 * STAP;
    const lijnen = [`M${a} ${a} H${f} V${f} H${a} Z`, `M${b} ${b} H${e} V${e} H${b} Z`, `M${c} ${c} H${d} V${d} H${c} Z`,
      `M${m} ${a} V${c} M${m} ${d} V${f} M${a} ${m} H${c} M${d} ${m} H${f}`];
    lijnen.forEach((p) => {
      el('path', { d: p, fill: 'none', stroke: 'rgba(255,250,235,.5)', 'stroke-width': 6, transform: 'translate(1.4 1.8)', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      el('path', { d: p, fill: 'none', stroke: '#3C3833', 'stroke-width': 4.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    });
    PUNTEN.forEach((_, i) => {
      const [x, y] = xy(i);
      el('circle', { cx: x + 1.2, cy: y + 1.6, r: 10, fill: 'rgba(255,250,235,.45)' }, svg);
      el('circle', { cx: x, cy: y, r: 9, fill: '#3C3833' }, svg);
    });
    lagen.merk = el('g', { class: 'mo-merk' }, svg);
    lagen.molen = el('g', { class: 'mo-molenlaag' }, svg);
    lagen.stenen = el('g', { class: 'mo-stenen' }, svg);
    lagen.doelen = el('g', { class: 'mo-doelen' }, svg);
    lagen.sleep = el('g', { class: 'mo-sleeplaag' }, svg);
    lagen.raak = el('g', { class: 'mo-raak' }, svg);
    PUNTEN.forEach((_, i) => {
      const [x, y] = xy(i);
      const r = el('circle', { cx: x, cy: y, r: STAP * 0.46, fill: 'transparent', tabindex: 0, role: 'button', 'data-i': i, class: 'mo-punt', 'aria-label': `Punt ${i + 1}` }, lagen.raak);
      r.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tik(i); } });
    });
    svg.addEventListener('pointerdown', neer);
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', () => { annuleerSleep(); druk = null; });
    return svg;
  }

  // ============================================================
  // TEKENEN
  // ============================================================
  function steenStijl() { return window.Pronk ? Pronk.stijl('stenen') : { wit: ['#FFFDF6', '#E6DCC6', '#B9AD92', '#8D8167'], zwart: ['#6A5F57', '#2C2522', '#151110', '#000'] }; }
  function kleurStenen() {
    const st = steenStijl();
    document.querySelectorAll('#mo-wit stop, #mo-mini-wit stop').forEach((s, i) => s.setAttribute('stop-color', st.wit[i % 3]));
    document.querySelectorAll('#mo-zwart stop, #mo-mini-zwart stop').forEach((s, i) => s.setAttribute('stop-color', st.zwart[i % 3]));
    if (podium) {
      podium.style.setProperty('--mo-wit-a', st.wit[0]); podium.style.setProperty('--mo-wit-b', st.wit[1]); podium.style.setProperty('--mo-wit-c', st.wit[2]);
      podium.style.setProperty('--mo-zwart-a', st.zwart[0]); podium.style.setProperty('--mo-zwart-b', st.zwart[1]); podium.style.setProperty('--mo-zwart-c', st.zwart[2]);
    }
    if (svg) tekenStenen();
  }
  if (window.Pronk) Pronk.opWijziging(kleurStenen);

  function maakSteen(kant, x, y, ouder) {
    const st = steenStijl();
    const g = el('g', { class: 'mo-steen ' + (kant === 0 ? 'wit' : 'zwart'), transform: `translate(${x} ${y})` }, ouder);
    const binnen = el('g', { class: 'mo-binnen' }, g);
    el('ellipse', { cx: 4, cy: 7, rx: 34, ry: 31, fill: 'rgba(0,0,0,.38)', class: 'mo-schaduw' }, binnen);
    el('circle', { r: 33, fill: kant === 0 ? 'url(#mo-wit)' : 'url(#mo-zwart)', stroke: kant === 0 ? st.wit[3] : st.zwart[3], 'stroke-width': 1.4 }, binnen);
    el('circle', { r: 22, fill: 'none', stroke: kant === 0 ? 'rgba(120,100,60,.32)' : 'rgba(255,255,255,.13)', 'stroke-width': 1.6 }, binnen);
    el('ellipse', { cx: -11, cy: -13, rx: 11, ry: 6, fill: '#fff', opacity: kant === 0 ? 0.55 : 0.18, transform: 'rotate(-35 -11 -13)' }, binnen);
    return g;
  }

  // Alle stenen op het bord, volgens de stand (of de tussenstand tijdens het wegnemen)
  function tekenStenen() {
    lagen.stenen.textContent = '';
    const s = tussen ? tussen.s : stand.s;
    lagen.raak.querySelectorAll('.mo-punt').forEach((c, i) => c.setAttribute('aria-label', `Punt ${i + 1}: ${s[0] & BIT[i] ? (tegen ? 'jouw steen' : 'wit') : s[1] & BIT[i] ? (tegen ? 'steen van ' + tegen.naam : 'zwart') : 'leeg'}`));
    for (let i = 0; i < 24; i++) {
      for (let k = 0; k < 2; k++) {
        if (!(s[k] & BIT[i])) continue;
        const [x, y] = xy(i);
        const g = maakSteen(k, x, y, lagen.stenen);
        g.setAttribute('data-i', i);
        if (i === gekozen) g.classList.add('gekozen');
      }
    }
    tekenMerk();
  }

  // Markeringen: laatste zet, mogelijke zetten, weg te nemen stenen, tip
  function tekenMerk() {
    lagen.merk.textContent = '';
    lagen.doelen.textContent = '';
    if (laatste && fase !== 'klaar') {
      const [x, y] = xy(laatste.naar);
      if (laatste.van >= 0) {
        const [vx, vy] = xy(laatste.van);
        el('line', { x1: vx, y1: vy, x2: x, y2: y, class: 'mo-spoor' }, lagen.merk);
        el('circle', { cx: vx, cy: vy, r: 12, class: 'mo-vanaf' }, lagen.merk);
      }
      el('circle', { cx: x, cy: y, r: 44, class: 'mo-laatste' }, lagen.merk);
      if (laatste.weg >= 0) {
        const [wx, wy] = xy(laatste.weg);
        el('path', { d: `M${wx - 14} ${wy - 14} L${wx + 14} ${wy + 14} M${wx + 14} ${wy - 14} L${wx - 14} ${wy + 14}`, class: 'mo-weg-kruis' }, lagen.merk);
      }
    }
    if (!mens(stand.aan) || (fase !== 'kies' && fase !== 'pak')) return;
    const st = tussen || stand;
    if (fase === 'pak') {
      wegneembaar().forEach((i) => { const [x, y] = xy(i); el('circle', { cx: x, cy: y, r: 41, class: 'mo-pakbaar' }, lagen.doelen); });
      return;
    }
    const lijst = zetten(st);
    if (st.hand[st.aan] > 0) {
      new Set(lijst.map((z) => z[1])).forEach((i) => { const [x, y] = xy(i); el('circle', { cx: x, cy: y, r: 11, class: 'mo-plek' }, lagen.doelen); });
    } else if (gekozen >= 0) {
      new Set(lijst.filter((z) => z[0] === gekozen).map((z) => z[1])).forEach((i) => { const [x, y] = xy(i); el('circle', { cx: x, cy: y, r: 16, class: 'mo-doel' }, lagen.doelen); });
    } else {
      // laat zien welke stenen kunnen bewegen
      new Set(lijst.map((z) => z[0])).forEach((i) => { const [x, y] = xy(i); el('circle', { cx: x, cy: y, r: 39, class: 'mo-kan' }, lagen.doelen); });
    }
    if (tip) {
      const [x, y] = xy(tip[1]);
      if (tip[0] >= 0) { const [vx, vy] = xy(tip[0]); el('line', { x1: vx, y1: vy, x2: x, y2: y, class: 'mo-tip-lijn' }, lagen.doelen); el('circle', { cx: vx, cy: vy, r: 40, class: 'mo-tip-ring' }, lagen.doelen); }
      el('circle', { cx: x, cy: y, r: 40, class: 'mo-tip-ring' }, lagen.doelen);
    }
  }

  function miniStenen(kant, n) {
    let s = '';
    for (let i = 0; i < n; i++) s += `<i class="mo-mini ${kant === 0 ? 'wit' : 'zwart'}"></i>`;
    return s;
  }

  // De twee spelerskaarten: wie is aan zet, wat moet hij doen, hoeveel stenen in de hand en gewonnen
  function werkKaartenBij() {
    const st = tussen || stand;
    [0, 1].forEach((k) => {
      const kaart = ui.kaart[k];
      const aan = fase !== 'klaar' && st.aan === k;
      kaart.classList.toggle('aan', aan);
      kaart.classList.toggle('denkt', fase === 'denkt' && st.aan === k);
      kaart.querySelector('.mo-gezicht').innerHTML = tegen ? (k === 0 ? gezicht.wit : gezicht[tegen.id]) : gezicht[k === 0 ? 'wit' : 'zwart'];
      kaart.querySelector('.mo-naam').textContent = naamVan(k);
      kaart.querySelector('.mo-hand').innerHTML = miniStenen(k, st.hand[k]);
      kaart.querySelector('.mo-buit').innerHTML = miniStenen(1 - k, buit[k]);
      const doe = kaart.querySelector('.mo-doe');
      let ik = '', woord = '';
      if (aan && mens(k)) {
        if (fase === 'pak') { ik = 'pak'; woord = 'Pak een steen'; }
        else if (st.hand[k] > 0) { ik = 'zet'; woord = 'Zet een steen'; }
        else if (bits(st.s[k]) === 3) { ik = 'vlieg'; woord = 'Spring!'; }
        else { ik = 'schuif'; woord = 'Schuif een steen'; }
      }
      if (aan && fase === 'denkt') doe.innerHTML = '<span class="mo-denk" aria-label="denkt na"><i></i><i></i><i></i></span>';
      else doe.innerHTML = woord ? `${icoon(ik)}<span>${woord}</span>` : '';
      if (k === 1) {
        const w = kaart.querySelector('.mo-wieken');
        w.innerHTML = tegen ? Array.from({ length: 4 }, (_, i) => `<svg class="${i < tegen.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-wiek"/></svg>`).join('') : '';
        kaart.setAttribute('aria-label', tegen ? `Tegenstander: ${tegen.naam}. Tik om te wisselen` : 'Met z\'n tweeën. Tik om te wisselen');
      } else {
        kaart.setAttribute('aria-label', `${naamVan(0)}${woord ? ': ' + woord : ''}`);
      }
    });
    ui.terug.disabled = !geschiedenis.length || fase === 'denkt' || (tegen && !geschiedenis.some((g) => g.stand.aan === 0));
    ui.tip.disabled = !(fase === 'kies' && mens(stand.aan));
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
  function steenOp(i) { return lagen.stenen.querySelector(`.mo-steen[data-i="${i}"]`); }
  function animeer(e, frames, opties) {
    if (!e || rustig() || !e.animate) return Promise.resolve();
    const a = e.animate(frames, opties);
    return a.finished.catch(() => {});
  }
  // De steen komt vanuit het bakje van de speler aanvliegen
  function vliegIn(kant, naar) {
    const g = steenOp(naar);
    if (!g) return Promise.resolve();
    const bak = ui.kaart[kant].querySelector('.mo-hand');
    const r = bak.getBoundingClientRect();
    const [bx, by] = r.width ? naarBord(r.right - 8, r.top + r.height / 2) : [MAAT / 2, kant ? -60 : MAAT + 60];
    const [x, y] = xy(naar);
    return animeer(g.querySelector('.mo-binnen'), [
      { transform: `translate(${bx - x}px, ${by - y}px) scale(.45)` },
      { transform: `translate(${(bx - x) * 0.35}px, ${(by - y) * 0.35 - 40}px) scale(1.15)`, offset: 0.6 },
      { transform: 'translate(0px, 0px) scale(1)' }
    ], { duration: 460, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
  function schuifIn(van, naar, vliegen) {
    const g = steenOp(naar);
    if (!g) return Promise.resolve();
    const [vx, vy] = xy(van), [x, y] = xy(naar);
    const dx = vx - x, dy = vy - y;
    return animeer(g.querySelector('.mo-binnen'), vliegen ? [
      { transform: `translate(${dx}px, ${dy}px) scale(1)` },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 50}px) scale(1.25)`, offset: 0.5 },
      { transform: 'translate(0px, 0px) scale(1)' }
    ] : [
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: 'translate(0px, 0px)' }
    ], { duration: vliegen ? 520 : 340, easing: 'cubic-bezier(.4,0,.2,1)' });
  }
  // Een weggenomen steen vliegt naar het buitbakje van wie hem pakte
  function vliegWeg(kantVanSteen, i, pakker) {
    const [x, y] = xy(i);
    const g = maakSteen(kantVanSteen, x, y, lagen.sleep);
    const bak = ui.kaart[pakker].querySelector('.mo-buit');
    const r = bak.getBoundingClientRect();
    const [bx, by] = r.width ? naarBord(r.left + r.width + 6, r.top + r.height / 2) : [x, pakker ? -80 : MAAT + 80];
    return animeer(g.querySelector('.mo-binnen'), [
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
      { transform: 'translate(0px, -26px) scale(1.25)', opacity: 1, offset: 0.25 },
      { transform: `translate(${bx - x}px, ${by - y}px) scale(.4)`, opacity: 0.2 }
    ], { duration: 620, easing: 'cubic-bezier(.5,0,.4,1)' }).then(() => g.remove());
  }
  function landing(i) {
    const g = steenOp(i);
    if (g) animeer(g.querySelector('.mo-binnen'), [{ transform: 'scale(1)' }, { transform: 'scale(.92, 1.06)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  }
  // Molen! Een gouden lijn langs de drie stenen en een banier
  async function vierMolen(molens, kant, zwik) {
    lagen.molen.textContent = '';
    molens.forEach((mm) => {
      const pts = MOLENS[MOLENMASKER.indexOf(mm)].map(xy);
      el('line', { x1: pts[0][0], y1: pts[0][1], x2: pts[2][0], y2: pts[2][1], class: 'mo-molenlijn' }, lagen.molen);
    });
    molens.forEach((mm) => MOLENS[MOLENMASKER.indexOf(mm)].forEach((i) => { const g = steenOp(i); if (g) g.classList.add('in-molen'); }));
    toonBanier(zwik ? 'Zwikmolen!' : 'Molen!', zwik);
    if (Geluid.molen) Geluid.molen(); else Geluid.tada();
    if (window.Tril) Tril.succes();
    if (zwik) vonken(18);
    zeg(kant, 'molen');
    await wacht(zwik ? 1000 : 760);
  }
  function wisMolen() {
    lagen.molen.textContent = '';
    lagen.stenen.querySelectorAll('.in-molen').forEach((g) => g.classList.remove('in-molen'));
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
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 500, easing: 'ease-out', fill: 'both' });
      a.onfinish = () => v.remove();
    }
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  function nieuwSpel() {
    spelId++;
    stand = NIEUW();
    fase = 'kies';
    gekozen = -1; tussen = null; laatste = null; tip = null; uitkomst = null;
    geschiedenis = []; herhaling = new Map(); buit = [0, 0];
    annuleerSleep();
    wisMolen();
    ui.banier.hidden = true;
    tekenStenen();
    werkKaartenBij();
    zeg(1, 'start');
    meld(tegen ? `Nieuw spel tegen ${tegen.naam}. Jij begint met wit.` : 'Nieuw spel met z\'n tweeën. Wit begint.');
  }

  function bewaarVoorTerug() {
    geschiedenis.push({ stand, laatste, buit: buit.slice() });
    if (geschiedenis.length > 400) geschiedenis.shift();
  }

  // Een complete zet uitvoeren (na eventueel wegnemen), met wat er bij hoort
  function voerUit(z) {
    const kant = stand.aan;
    bewaarVoorTerug();
    stand = speel(stand, z);
    tussen = null; gekozen = -1; tip = null;
    if (z[2] >= 0) buit[kant]++;
    laatste = { van: z[0], naar: z[1], weg: z[2], kant };
    if (stand.hand[0] === 0 && stand.hand[1] === 0) {
      const k = sleutel(stand);
      herhaling.set(k, (herhaling.get(k) || 0) + 1);
    }
  }

  function wegneembaar() {
    const st = tussen || stand;
    const zijn = st.s[1 - st.aan];
    const vrij = [];
    for (let i = 0; i < 24; i++) if ((zijn & BIT[i]) && !inMolen(zijn, i)) vrij.push(i);
    if (vrij.length) return vrij;
    const alle = [];
    for (let i = 0; i < 24; i++) if (zijn & BIT[i]) alle.push(i);
    return alle;
  }

  // De mens doet een zet (plaatsen of schuiven); bij een molen volgt nog het wegnemen
  async function menselijkeZet(van, naar, gesleept) {
    const mijnId = spelId, kant = stand.aan;
    laatsteTussenZet = { van, naar };
    const molens = maaktMolen(stand, van, naar);
    const zwik = van >= 0 && molens.length > 0 && inMolen(stand.s[kant], van);
    // tussenstand: de steen staat er al, maar er is nog niets weggenomen
    const s = [stand.s[0], stand.s[1]], hand = [stand.hand[0], stand.hand[1]];
    if (van < 0) hand[kant]--; else s[kant] &= ~BIT[van];
    s[kant] |= BIT[naar];
    tussen = { s, hand, aan: kant, zonder: stand.zonder };
    gekozen = -1; tip = null;
    fase = 'bezig';
    tekenStenen();
    werkKaartenBij();
    Geluid.steen();
    if (window.Tril) Tril.tik();
    if (van < 0) await vliegIn(kant, naar);
    else if (!gesleept) await schuifIn(van, naar, bits(stand.s[kant]) === 3);
    else landing(naar);
    if (mijnId !== spelId) return;
    if (molens.length && wegneembaar().length) {
      await vierMolen(molens, kant, zwik);
      if (mijnId !== spelId) return;
      fase = 'pak';
      tekenMerk();
      werkKaartenBij();
      meld('Molen! Kies een steen van de ander om weg te nemen.');
      return;
    }
    voerUit([van, naar, -1]);
    volgendeBeurt();
  }

  async function menselijkWegnemen(i) {
    const mijnId = spelId, kant = tussen.aan;
    const z = [laatsteTussenZet.van, laatsteTussenZet.naar, i];
    fase = 'bezig';
    wisMolen();
    Geluid.pak();
    if (window.Tril) Tril.klik();
    // eerst de steen van het bord halen, dan wegvliegen
    tussen.s[1 - kant] &= ~BIT[i];
    tekenStenen();
    await vliegWeg(1 - kant, i, kant);
    if (mijnId !== spelId) return;
    zeg(1 - kant, 'kwijt');
    voerUit(z);
    volgendeBeurt();
  }
  function volgendeBeurt() {
    tekenStenen();
    const u = uitslag(stand);
    const k = stand.hand[0] === 0 && stand.hand[1] === 0 ? sleutel(stand) : null;
    if (u) return einde(u === 'remise' ? null : 1 - stand.aan, u);
    if (k && herhaling.get(k) >= 3) return einde(null, 'herhaling');
    if (mens(stand.aan)) {
      fase = 'kies';
      werkKaartenBij();
      tekenMerk();
      return;
    }
    computerBeurt();
  }

  async function computerBeurt() {
    const mijnId = spelId;
    fase = 'denkt';
    werkKaartenBij();
    tekenMerk();
    await wacht(520 + Math.random() * 380);
    if (mijnId !== spelId) return;
    const z = tegen.dom ? domZet(stand) : slimmeZet(stand, tegen.diepte, tegen.tijd, tegen.ruis);
    if (!z || mijnId !== spelId) return;
    const kant = stand.aan, [van, naar, weg] = z;
    const molens = maaktMolen(stand, van, naar);
    const zwik = van >= 0 && molens.length > 0 && inMolen(stand.s[kant], van);
    const s = [stand.s[0], stand.s[1]], hand = [stand.hand[0], stand.hand[1]];
    if (van < 0) hand[kant]--; else s[kant] &= ~BIT[van];
    s[kant] |= BIT[naar];
    tussen = { s, hand, aan: kant, zonder: stand.zonder };
    tekenStenen();
    werkKaartenBij();
    Geluid.steen();
    if (van < 0) await vliegIn(kant, naar); else await schuifIn(van, naar, bits(stand.s[kant]) === 3);
    if (mijnId !== spelId) return;
    meld(`${tegen.naam} ${van < 0 ? 'zet een steen' : 'schuift een steen'}.`);
    if (weg >= 0) {
      await vierMolen(molens, kant, zwik);
      if (mijnId !== spelId) return;
      wisMolen();
      tussen.s[1 - kant] &= ~BIT[weg];
      tekenStenen();
      Geluid.pak();
      if (window.Tril) Tril.fout();
      await vliegWeg(1 - kant, weg, kant);
      if (mijnId !== spelId) return;
      meld(`${tegen.naam} heeft een molen en neemt een steen van je weg.`);
    }
    voerUit(z);
    volgendeBeurt();
  }

  function einde(winnaar, reden) {
    fase = 'klaar';
    tussen = null; gekozen = -1; tip = null;
    uitkomst = { winnaar, reden };
    tekenStenen();
    werkKaartenBij();
    // de verliezer laat zijn stenen zakken
    if (winnaar !== null) lagen.stenen.querySelectorAll('.mo-steen.' + (winnaar === 0 ? 'zwart' : 'wit')).forEach((g) => g.classList.add('verloren'));
    const ikWin = winnaar === 0, tegenComputer = !!tegen;
    let bedrag, tekst, verder = null;
    if (winnaar === null) {
      bedrag = 15; tekst = 'Gelijkspel';
      toonBanier('Gelijkspel', false);
      Geluid.klok();
    } else if (!tegenComputer) {
      bedrag = 20; tekst = `${naamVan(winnaar)} wint!`;
      toonBanier(tekst, true);
      Geluid.tada(); vonken(30);
    } else if (ikWin) {
      const telling = gewonnen();
      const eerste = !telling[tegen.id];
      telling[tegen.id] = (telling[tegen.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('molen-gewonnen', telling);
      bedrag = tegen.beloning; tekst = `Gewonnen van ${tegen.naam}!`;
      toonBanier('Gewonnen!', true);
      Geluid.tada(); vonken(40);
      if (window.Tril) Tril.succes();
      zeg(1, 'verliest');
      const volgende = TEGENSTANDERS[TEGENSTANDERS.indexOf(tegen) + 1];
      if (volgende) {
        if (eerste) tekst += ` ${volgende.naam} is vrij!`;
        verder = { tekst: `Tegen ${volgende.naam}`, actie: () => { tegen = volgende; if (window.Duiten) Duiten.zetVeld('molen-tegen', volgende.id); nieuwSpel(); } };
      }
    } else {
      bedrag = 10; tekst = `${tegen.naam} won. Goed geprobeerd!`;
      toonBanier(`${tegen.naam} wint`, false);
      Geluid.jammer();
      zeg(1, 'wint');
    }
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'molenspel', bedrag, gewonnen: winnaar === 0 || !tegenComputer, tekst, verder, wacht: 2300 });
  }

  // ============================================================
  // TIKKEN EN SLEPEN
  // ============================================================
  function puntBij(px, py, ruim) {
    const [x, y] = naarBord(px, py);
    let beste = -1, afstand = Infinity;
    for (let i = 0; i < 24; i++) {
      const [qx, qy] = xy(i);
      const d = Math.hypot(qx - x, qy - y);
      if (d < afstand) { afstand = d; beste = i; }
    }
    return afstand < STAP * (ruim ? 0.6 : 0.47) ? beste : -1;
  }
  function magKiezen(i) {
    const st = stand;
    return st.hand[st.aan] === 0 && (st.s[st.aan] & BIT[i]) && zetten(st).some((z) => z[0] === i);
  }
  function neer(e) {
    if (!mens(stand.aan) || (fase !== 'kies' && fase !== 'pak')) return;
    const i = puntBij(e.clientX, e.clientY);
    druk = { i, x: e.clientX, y: e.clientY, id: e.pointerId, wasGekozen: gekozen === i };
    if (fase === 'kies' && i >= 0 && magKiezen(i)) {
      sleep = { van: i, actief: false };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      if (gekozen !== i) { gekozen = i; tekenStenen(); Geluid.pak(); if (window.Tril) Tril.tik(); }
    }
    e.preventDefault();
  }
  function beweeg(e) {
    if (!sleep || !druk || e.pointerId !== druk.id) return;
    if (!sleep.actief && Math.hypot(e.clientX - druk.x, e.clientY - druk.y) > 10) {
      sleep.actief = true;
      const g = steenOp(sleep.van);
      if (g) g.classList.add('weg-gesleept');
      const [x, y] = xy(sleep.van);
      sleep.g = maakSteen(stand.aan, x, y, lagen.sleep);
      sleep.g.classList.add('zweeft');
    }
    if (sleep.actief) {
      const [x, y] = naarBord(e.clientX, e.clientY);
      sleep.g.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - 18).toFixed(1)})`);
      const doel = puntBij(e.clientX, e.clientY, true);
      lagen.doelen.querySelectorAll('.mo-doel').forEach((c) => c.classList.remove('onder'));
      if (doel >= 0) {
        const [dx, dy] = xy(doel);
        const c = Array.from(lagen.doelen.querySelectorAll('.mo-doel')).find((k) => +k.getAttribute('cx') === dx && +k.getAttribute('cy') === dy);
        if (c) c.classList.add('onder');
      }
    }
  }
  function annuleerSleep() {
    if (sleep && sleep.g) sleep.g.remove();
    lagen.stenen && lagen.stenen.querySelectorAll('.weg-gesleept').forEach((g) => g.classList.remove('weg-gesleept'));
    sleep = null;
  }
  function los(e) {
    if (!druk || e.pointerId !== druk.id) return;
    const begin = druk;
    druk = null;
    if (sleep && sleep.actief) {
      const van = sleep.van;
      const doel = puntBij(e.clientX, e.clientY, true);
      annuleerSleep();
      const mag = doel >= 0 && zetten(stand).some((z) => z[0] === van && z[1] === doel);
      if (mag) menselijkeZet(van, doel, true);
      else { gekozen = van; tekenStenen(); if (doel !== van && window.Tril) Tril.fout(); }
      return;
    }
    sleep = null;
    if (begin.i < 0) { if (gekozen >= 0) { gekozen = -1; tekenStenen(); } return; }
    if (Math.hypot(e.clientX - begin.x, e.clientY - begin.y) >= 24) return;
    const st = stand;
    if (fase === 'kies' && st.hand[st.aan] === 0 && (st.s[st.aan] & BIT[begin.i])) {
      // de steen werd bij het neerzetten van de vinger al gekozen; nog een tik laat hem los
      if (begin.wasGekozen) { gekozen = -1; tekenStenen(); } else if (!magKiezen(begin.i)) fout();
      return;
    }
    tik(begin.i);
  }

  function tik(i) {
    if (!mens(stand.aan)) return;
    if (fase === 'pak') {
      if (wegneembaar().includes(i)) menselijkWegnemen(i); else fout();
      return;
    }
    if (fase !== 'kies') return;
    const st = stand, kant = st.aan;
    if (st.hand[kant] > 0) {
      if (!((st.s[0] | st.s[1]) & BIT[i])) menselijkeZet(-1, i, false); else fout();
      return;
    }
    if (st.s[kant] & BIT[i]) {
      if (!magKiezen(i)) { fout(); return; }
      gekozen = gekozen === i ? -1 : i;
      Geluid.pak();
      tekenStenen();
      return;
    }
    if (gekozen >= 0 && zetten(st).some((z) => z[0] === gekozen && z[1] === i)) { menselijkeZet(gekozen, i, false); return; }
    if (gekozen >= 0) { gekozen = -1; tekenStenen(); }
    fout();
  }
  function fout() {
    if (window.Tril) Tril.fout();
    Geluid.pak();
    const v = ui.kaart[stand.aan].querySelector('.mo-doe');
    v.classList.remove('schud'); void v.offsetWidth; v.classList.add('schud');
  }

  // ============================================================
  // TERUGNEMEN EN TIP
  // ============================================================
  function neemTerug() {
    if (!geschiedenis.length || fase === 'denkt') return;
    spelId++;
    annuleerSleep();
    wisMolen();
    let vorige = geschiedenis.pop();
    // tegen de computer: terug tot jij weer aan zet bent
    while (tegen && vorige.stand.aan !== 0 && geschiedenis.length) vorige = geschiedenis.pop();
    if (tegen && vorige.stand.aan !== 0) { geschiedenis.push(vorige); return; }
    // de herhalingsteller klopt niet meer precies; begin opnieuw te tellen
    herhaling = new Map();
    stand = vorige.stand; laatste = vorige.laatste; buit = vorige.buit;
    tussen = null; gekozen = -1; tip = null; uitkomst = null;
    fase = 'kies';
    tekenStenen();
    werkKaartenBij();
    Geluid.schuif();
    if (window.Tril) Tril.tik();
    meld('Zet teruggenomen.');
  }

  function geefTip() {
    if (fase !== 'kies' || !mens(stand.aan)) return;
    const z = slimmeZet(stand, 5, 420, 0);
    if (!z) return;
    tip = z;
    gekozen = z[0] >= 0 ? z[0] : -1;
    tekenStenen();
    Geluid.pak();
    if (window.Tril) Tril.tik();
    meld(z[0] >= 0 ? 'Tip: schuif de gemarkeerde steen.' : 'Tip: zet je steen op de gemarkeerde plek.');
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
      const wieken = t === TWEE ? '' : `<span class="mo-wieken">${Array.from({ length: 4 }, (_, i) => `<svg class="${i < t.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-wiek"/></svg>`).join('')}</span>`;
      const gezichtje = t === TWEE ? `<span class="mo-twee">${gezicht.wit}${gezicht.zwart}</span>` : gezicht[t.id];
      b.innerHTML = `<span class="mo-gezicht">${gezichtje}${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span>
        <span class="mo-keuze-naam">${t.naam}</span>${wieken}
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
        if (window.Duiten) Duiten.zetVeld('molen-tegen', t.id);
        sluitMenu();
        nieuwSpel();
      });
      ui.lijst.appendChild(b);
    });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function puntVak(lijst, ruimte) {
    const m = svg.getScreenCTM();
    const pts = lijst.map((i) => { const [x, y] = xy(i); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; });
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), h = ruimte * m.a;
    return { left: Math.min(...xs) - h, top: Math.min(...ys) - h, width: Math.max(...xs) - Math.min(...xs) + 2 * h, height: Math.max(...ys) - Math.min(...ys) + 2 * h };
  }
  const midden = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  if (window.Les) {
    Les.zet('molenspel', () => [
      { doel: () => puntVak([4], 40), vorm: 'rond', gebaar: 'tik', tekst: 'Tik op een punt om je steen te zetten' },
      { doel: () => puntVak([0, 1, 2], 44), gebaar: 'wijs', tekst: 'Drie op een rij is een molen' },
      { doel: () => puntVak([21], 40), vorm: 'rond', gebaar: 'tik', tekst: 'Dan pak je een steen van de ander' },
      { doel: () => puntVak([9, 10], 44), gebaar: 'veeg', van: () => midden(puntVak([9], 0)), naar: () => midden(puntVak([10], 0)), voorwerp: 'steen', tekst: 'Later schuif of sleep je je stenen' },
      { doel: () => ui.kaart[1], gebaar: 'tik', tekst: 'Tik hier om een tegenstander te kiezen' },
      { doel: () => { const a = ui.terug.getBoundingClientRect(), b = ui.tip.getBoundingClientRect(); return { left: a.left, top: Math.min(a.top, b.top), width: b.right - a.left, height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) }; }, gebaar: 'wijs', tekst: 'Zet terug, of vraag een tip' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.molenspel = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('molen-tegen', 'jantje') : 'jantje';
        const t = TEGENSTANDERS.find((x) => x.id === bewaard);
        tegen = bewaard === 'twee' ? null : (t && isOpen(t) ? t : TEGENSTANDERS[0]);
        kleurStenen();
        requestAnimationFrame(() => { pasMaatAan(); nieuwSpel(); });
      } else {
        kleurStenen();
        pasMaatAan();
        werkKaartenBij();
        if (fase === 'denkt') computerBeurt();
      }
      // het molenspel ziet er nu anders uit: laat Gijs het één keer opnieuw voordoen
      if (window.Duiten && !Duiten.veld('molen-les-2', false)) { Duiten.zetVeld('les-molenspel', false); Duiten.zetVeld('molen-les-2', true); }
      if (window.Les) Les.eersteKeer('molenspel');
    },
    stop() {
      spelId++;
      annuleerSleep();
      if (ui.menu) sluitMenu();
      // een onderbroken beurt begint opnieuw bij terugkomst (een halve zet van jou vervalt)
      if (fase === 'bezig' || fase === 'denkt' || fase === 'pak') {
        tussen = null; gekozen = -1; tip = null;
        wisMolen();
        fase = mens(stand.aan) ? 'kies' : 'denkt';
        if (svg) tekenStenen();
      }
    },
    opnieuw() { nieuwSpel(); },
    // voor tests
    _regels: { zetten, speel, uitslag, slimmeZet, NIEUW },
    _toestand() { return { stand, fase, tussen, gekozen, uitkomst, tegen: tegen ? tegen.id : 'twee' }; }
  };
})();
