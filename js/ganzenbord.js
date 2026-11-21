/* Ganzenbord: handgekleurd prentbord met 62 velden in een spiraal en veld 63 in het midden. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const GANZEN = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
  const BIJZONDER = { 6: 'brug', 19: 'herberg', 31: 'put', 42: 'doolhof', 52: 'gevangenis', 58: 'dood' };
  const KLEUR_BIJZONDER = { gans: '#E6B94E', brug: '#8FAED3', herberg: '#D06A4A', put: '#5E9A96', doolhof: '#86A55A', gevangenis: '#9B8AAE', dood: '#4A4038' };
  const WASSINGEN = ['#EBC9AE', '#CFD8AE', '#C3D0E0', '#E8D9A8'];
  const INKT = '#2B2118';
  const SPELERS = [
    { naam: 'Rood', kleur: '#B23A2A' },
    { naam: 'Blauw', kleur: '#2D4F9A' },
    { naam: 'Groen', kleur: '#3F7A3A' },
    { naam: 'Geel', kleur: '#D8A92A' }
  ];

  // Spiraalmaten (viewBox 720 x 720)
  const C = 360, R0 = 308, B = 60, R_EIND = 100, N = 62;
  const PHI0 = Math.PI * 0.62;
  const THETA_MAX = (R0 - R_EIND) * 2 * Math.PI / B;
  const A = B / (4 * Math.PI);
  const r = (t) => R0 - (B / (2 * Math.PI)) * t;
  const s = (t) => R0 * t - A * t * t;
  const S_TOT = s(THETA_MAX);
  const thetaVoor = (sk) => (R0 - Math.sqrt(R0 * R0 - (B / Math.PI) * sk)) * (2 * Math.PI / B);
  const punt = (t, straal) => [C + straal * Math.cos(PHI0 + t), C + straal * Math.sin(PHI0 + t)];

  const grenzen = [];
  for (let k = 0; k <= N; k++) grenzen.push(thetaVoor((k / N) * S_TOT));
  const midden = [null];
  for (let i = 1; i <= N; i++) { const tm = (grenzen[i - 1] + grenzen[i]) / 2; midden.push(punt(tm, r(tm))); }
  midden.push([C, C]); // veld 63
  midden[0] = [96, 640]; // beginvak

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const wacht = (ms) => new Promise((res) => setTimeout(res, ms));

  let veld, paneel, svg, pionLaag;
  let spelers = [];
  let instelling = [{ computer: false }, { computer: true }];
  let beurt = 0, bezig = false, winnaar = null, spelId = 0, gebouwd = false;
  let ui = {};

  function veldPad(i) {
    const ta = grenzen[i - 1], tb = grenzen[i], stappen = 8, d = [];
    for (let k = 0; k <= stappen; k++) { const t = ta + (tb - ta) * k / stappen; const p = punt(t, r(t) + B / 2 - 1.5); d.push((k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)); }
    for (let k = stappen; k >= 0; k--) { const t = ta + (tb - ta) * k / stappen; const p = punt(t, r(t) - B / 2 + 1.5); d.push('L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)); }
    return d.join(' ') + ' Z';
  }

  function soortVan(i) {
    if (GANZEN.includes(i)) return 'gans';
    return BIJZONDER[i] || null;
  }

  function icoon(soort, g) {
    const lijn = { fill: 'none', stroke: INKT, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    if (soort === 'gans') {
      el('use', { href: '#ill-gans', x: -20, y: -21, width: 40, height: 40, style: 'color:' + INKT, stroke: INKT, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      return;
    }
    const paden = {
      brug: 'M-14 6 Q0 -10 14 6 M-15 6 H15 M-8 6 V-1 M0 6 V-3.5 M8 6 V-1',
      herberg: 'M-8 -6 H6 V11 H-8 Z M6 -2 H10 V7 H6 M-9 -7 q2.5 -4 5 0 q2.5 -4 5 0 q2.5 -4 5 0',
      put: 'M-11 0 H11 V11 H-11 Z M-12 -11 L0 -17 L12 -11 M-8 -11 V0 M8 -11 V0 M0 -11 V-4',
      doolhof: 'M-11 -11 H11 V11 H-7 V-7 H7 V7 H-3 V-3 H3',
      gevangenis: 'M-11 -11 H11 V11 H-11 Z M-5.5 -11 V11 M0 -11 V11 M5.5 -11 V11',
      dood: 'M-8 -2 a8 8 0 1 1 16 0 q0 5 -4 7 V10 H-4 V5 q-4 -2 -4 -7 Z M-3 -2 v.5 M3 -2 v.5'
    };
    const kleur = soort === 'dood' ? '#F1E6C8' : INKT;
    el('path', Object.assign({}, lijn, { d: paden[soort], stroke: kleur }), g);
  }

  function bouwBord(sfx, eenvoudig) {
    sfx = sfx || '';
    const svg = el('svg', { viewBox: '0 0 720 720', class: 'gb-bord', role: 'img', 'aria-label': 'Ganzenbord met 63 velden in een spiraal' });
    const defs = el('defs', {}, svg);
    const f = el('filter', { id: 'gb-papier' + sfx }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '3', result: 'r' }, f);
    el('feColorMatrix', { in: 'r', values: '0 0 0 0 .45  0 0 0 0 .33  0 0 0 0 .15  0 0 0 .13 0' }, f);
    el('feComposite', { in2: 'SourceGraphic', operator: 'in' }, f);
    const rg = el('radialGradient', { id: 'gb-vignet' + sfx, cx: '50%', cy: '50%', r: '70%' }, defs);
    el('stop', { offset: '.6', 'stop-color': '#7A5A2A', 'stop-opacity': '0' }, rg);
    el('stop', { offset: '1', 'stop-color': '#7A5A2A', 'stop-opacity': '.28' }, rg);
    const pg = el('radialGradient', { id: 'gb-pion' + sfx, cx: '35%', cy: '30%', r: '75%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '.6' }, pg);
    el('stop', { offset: '.5', 'stop-color': '#fff', 'stop-opacity': '0' }, pg);

    el('rect', { width: 720, height: 720, fill: '#EFE3C3' }, svg);
    if (!eenvoudig) el('rect', { width: 720, height: 720, fill: '#EFE3C3', filter: 'url(#gb-papier' + sfx + ')' }, svg);
    el('rect', { width: 720, height: 720, fill: 'url(#gb-vignet' + sfx + ')' }, svg);
    el('rect', { x: 9, y: 9, width: 702, height: 702, fill: 'none', stroke: INKT, 'stroke-width': 2.4 }, svg);
    el('rect', { x: 16, y: 16, width: 688, height: 688, fill: 'none', stroke: INKT, 'stroke-width': .8 }, svg);

    // Hoekteksten
    const t1 = el('text', { x: 30, y: 52, fill: INKT, 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 26, 'font-style': 'italic' }, svg);
    t1.textContent = 'Het Gansespel';
    const t1b = el('text', { x: 31, y: 74, fill: INKT, 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 13, opacity: .8 }, svg);
    t1b.textContent = 'naar Hollandse prenten';
    [['Eerste worp', 40], ['6 en 3: naar 26', 60], ['5 en 4: naar 53', 78]].forEach(([tekst, y], i) => {
      const t = el('text', { x: 690, y, 'text-anchor': 'end', fill: INKT, 'font-family': i ? 'IM Fell English, Georgia, serif' : 'IM Fell English SC, Georgia, serif', 'font-size': i ? 15 : 14 }, svg);
      t.textContent = tekst;
    });
    [['Wie over 63 gooit,', 668], ['telt terug.', 686]].forEach(([tekst, y]) => {
      const t = el('text', { x: 690, y, 'text-anchor': 'end', fill: INKT, 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 15, 'font-style': 'italic' }, svg);
      t.textContent = tekst;
    });

    // Velden
    const veldLaag = el('g', {}, svg);
    for (let i = 1; i <= N; i++) {
      const soort = soortVan(i);
      const d = veldPad(i);
      const kleur = soort ? KLEUR_BIJZONDER[soort] : WASSINGEN[i % WASSINGEN.length];
      el('path', { d, fill: kleur, opacity: .9, transform: 'translate(2.4 1.8)', style: 'mix-blend-mode:multiply' }, veldLaag);
      el('path', { d, fill: 'none', stroke: INKT, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, veldLaag);
      const [x, y] = midden[i];
      const g = el('g', { transform: `translate(${x.toFixed(1)} ${(y + 3).toFixed(1)}) scale(.62)` }, veldLaag);
      if (soort) icoon(soort, g);
      const nr = el('text', { x: x.toFixed(1), y: (y - (soort ? 14 : -5)).toFixed(1), 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': soort ? 12 : 17, fill: soort === 'dood' ? '#F1E6C8' : INKT }, veldLaag);
      nr.textContent = i;
    }
    // Veld 63: de ganzenhof
    el('circle', { cx: C + 2.4, cy: C + 1.8, r: 64, fill: '#D9A62E', opacity: .85, style: 'mix-blend-mode:multiply' }, veldLaag);
    el('circle', { cx: C, cy: C, r: 64, fill: 'none', stroke: INKT, 'stroke-width': 2 }, veldLaag);
    el('circle', { cx: C, cy: C, r: 58, fill: 'none', stroke: INKT, 'stroke-width': .7 }, veldLaag);
    el('use', { href: '#ill-gans', x: C - 30, y: C - 52, width: 60, height: 60, style: 'color:' + INKT, stroke: INKT, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, veldLaag);
    const t63 = el('text', { x: C, y: C + 38, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 34, fill: INKT }, veldLaag);
    t63.textContent = '63';

    // Beginvak
    el('rect', { x: 50, y: 604, width: 94, height: 74, rx: 6, fill: '#E8D9A8', opacity: .9, transform: 'translate(2 1.5)', style: 'mix-blend-mode:multiply' }, veldLaag);
    el('rect', { x: 50, y: 604, width: 94, height: 74, rx: 6, fill: 'none', stroke: INKT, 'stroke-width': 1.3 }, veldLaag);
    const tb = el('text', { x: 97, y: 696, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 14, fill: INKT }, veldLaag);
    tb.textContent = 'Begin';

    const laag = el('g', {}, svg);
    return { svg, laag };
  }

  function pionPlek(index, pos) {
    const [x, y] = midden[pos];
    if (pos === 0) {
      const off = [[-22, -12], [22, -12], [-22, 14], [22, 14]][index];
      return [x + off[0], y + off[1]];
    }
    const n = spelers.length;
    const off = n <= 2 ? [[-9, 0], [9, 0]][index] : [[-9, -8], [9, -8], [-9, 8], [9, 8]][index];
    return [x + off[0], y + off[1] + 2];
  }

  function tekenPion(p) {
    const [x, y] = pionPlek(p.index, p.pos);
    p.g.style.transform = `translate(${x}px, ${y}px)`;
  }

  function maakPionnen() {
    pionLaag.textContent = '';
    spelers.forEach((p) => {
      const g = el('g', { class: 'pion' }, pionLaag);
      el('ellipse', { cx: 1.5, cy: 9, rx: 11, ry: 4, fill: '#000', opacity: .25 }, g);
      el('path', { d: 'M-9 8 Q-10 -2 -4 -6 A6 6 0 1 1 4 -6 Q10 -2 9 8 Z', fill: p.kleur, stroke: INKT, 'stroke-width': 1.2 }, g);
      el('path', { d: 'M-9 8 Q-10 -2 -4 -6 A6 6 0 1 1 4 -6 Q10 -2 9 8 Z', fill: 'url(#gb-pion)' }, g);
      p.g = g;
      tekenPion(p);
    });
  }

  // ---------- Paneel ----------
  function bouwPaneel() {
    paneel.innerHTML = `
      <p class="status" id="gb-status" aria-live="polite"></p>
      <div class="dobbels" aria-hidden="true"><div class="dobbel" id="gb-d1"></div><div class="dobbel" id="gb-d2"></div></div>
      <div class="knoppen"><button class="knop" id="gb-werp" type="button">Werp de stenen</button></div>
      <div><h3>Spelers</h3><ul class="spelers" id="gb-spelers"></ul></div>
      <details id="gb-instellingen">
        <summary>Spelers instellen</summary>
        <div class="veld-rij" id="gb-inst-rijen"></div>
        <div class="knoppen" style="margin-top:10px">
          <button class="knop knop--licht" id="gb-meer" type="button">Speler erbij</button>
          <button class="knop knop--licht" id="gb-minder" type="button">Speler eraf</button>
        </div>
        <div class="knoppen" style="margin-top:10px"><button class="knop" id="gb-nieuw" type="button">Nieuw spel</button></div>
      </details>
      <div><h3>Kroniek</h3><ol class="kroniek" id="gb-kroniek"></ol></div>
      <details>
        <summary>Speelregels</summary>
        <ul>
          <li>Gooi met twee stenen en loop het totaal aantal velden.</li>
          <li><b>Gans</b> (5, 9, 14 …): loop je worp nog een keer.</li>
          <li><b>Brug</b> (6): steek over naar 12.</li>
          <li><b>Herberg</b> (19): één beurt overslaan.</li>
          <li><b>Put</b> (31) en <b>gevangenis</b> (52): wacht tot een ander je komt verlossen.</li>
          <li><b>Doolhof</b> (42): terug naar 39.</li>
          <li><b>Dood</b> (58): terug naar het begin.</li>
          <li>Precies op 63 komen wint. Gooi je te veel, dan tel je terug.</li>
        </ul>
      </details>
      <p class="geschiedenis">Het ganzenspel kwam uit Italië en werd in de 17e eeuw in de Republiek een geliefd prentbord. Amsterdamse uitgevers drukten het als "Nieuw en vermakelyk Gansespel", met de regels op rijm in het midden. Elk exemplaar werd met de hand ingekleurd, waardoor de kleur vaak net naast de lijn viel.</p>
    `;
    ui.status = paneel.querySelector('#gb-status');
    ui.d1 = paneel.querySelector('#gb-d1');
    ui.d2 = paneel.querySelector('#gb-d2');
    ui.werp = paneel.querySelector('#gb-werp');
    ui.spelers = paneel.querySelector('#gb-spelers');
    ui.kroniek = paneel.querySelector('#gb-kroniek');
    ui.instRijen = paneel.querySelector('#gb-inst-rijen');
    ui.werp.addEventListener('click', () => { if (!bezig && !huidige().computer && !winnaar) werp(); });
    paneel.querySelector('#gb-nieuw').addEventListener('click', nieuwSpel);
    paneel.querySelector('#gb-meer').addEventListener('click', () => { if (instelling.length < 4) { instelling.push({ computer: true }); tekenInstelling(); } });
    paneel.querySelector('#gb-minder').addEventListener('click', () => { if (instelling.length > 2) { instelling.pop(); tekenInstelling(); } });
    toonDobbel(ui.d1, 6); toonDobbel(ui.d2, 3);
    tekenInstelling();
  }

  function tekenInstelling() {
    ui.instRijen.innerHTML = '';
    instelling.forEach((inst, i) => {
      const lab = document.createElement('label');
      lab.setAttribute('for', 'gb-type-' + i);
      lab.innerHTML = `<span class="stip" style="background:${SPELERS[i].kleur}"></span>${SPELERS[i].naam}`;
      const sel = document.createElement('select');
      sel.id = 'gb-type-' + i;
      sel.innerHTML = '<option value="mens">Mens</option><option value="computer">Computer</option>';
      sel.value = inst.computer ? 'computer' : 'mens';
      sel.addEventListener('change', () => { inst.computer = sel.value === 'computer'; });
      ui.instRijen.append(lab, sel);
    });
  }

  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function toonDobbel(d, n) {
    d.innerHTML = '';
    for (let i = 0; i < 9; i++) { const pip = document.createElement('i'); if (PIPS[n].includes(i)) pip.className = 'p'; d.appendChild(pip); }
    d.setAttribute('aria-label', 'Steen: ' + n);
  }

  function huidige() { return spelers[beurt]; }
  function naamHtml(p) { return `<span class="stip" style="background:${p.kleur}"></span>${p.naam}`; }

  function log(html) {
    const li = document.createElement('li');
    li.innerHTML = html;
    ui.kroniek.prepend(li);
    while (ui.kroniek.children.length > 40) ui.kroniek.lastChild.remove();
  }

  function zetStatus(html) { ui.status.innerHTML = html; }

  function tekenSpelers() {
    ui.spelers.innerHTML = '';
    spelers.forEach((p, i) => {
      const li = document.createElement('li');
      if (i === beurt && !winnaar) li.className = 'aan-zet';
      let extra = '';
      if (p.vast) extra = p.pos === 31 ? ' · in de put' : ' · gevangen';
      else if (p.overslaan) extra = ' · in de herberg';
      li.innerHTML = `<span>${naamHtml(p)}${p.computer ? ' <small>(computer)</small>' : ''}</span><span class="plek">${p.pos === 0 ? 'begin' : 'veld ' + p.pos}${extra}</span>`;
      ui.spelers.appendChild(li);
    });
  }

  function knopStand() {
    const p = huidige();
    ui.werp.disabled = bezig || !!winnaar || !p || p.computer;
  }

  // ---------- Spelverloop ----------
  function nieuwSpel() {
    spelId++;
    spelers = instelling.map((inst, i) => ({ index: i, naam: SPELERS[i].naam, kleur: SPELERS[i].kleur, computer: inst.computer, pos: 0, overslaan: 0, vast: false, eersteWorp: true }));
    beurt = 0; bezig = false; winnaar = null;
    ui.kroniek.innerHTML = '';
    maakPionnen();
    log('Een nieuw spel begint.');
    const inst = paneel.querySelector('#gb-instellingen'); if (inst) inst.open = false;
    beurtBegin();
  }

  async function beurtBegin() {
    const mijnId = spelId;
    const p = huidige();
    tekenSpelers();
    if (p.overslaan > 0) {
      p.overslaan--;
      zetStatus(`${naamHtml(p)} drinkt nog een kroes in de herberg.`);
      log(`${naamHtml(p)} slaat een beurt over.`);
      bezig = true; knopStand();
      await wacht(1100); if (mijnId !== spelId) return;
      bezig = false;
      return volgende();
    }
    if (p.vast) {
      if (spelers.every((q) => q.vast)) {
        spelers.forEach((q) => { q.vast = false; });
        log('Niemand kan meer redden: iedereen mag weer verder.');
      } else {
        zetStatus(`${naamHtml(p)} ${p.pos === 31 ? 'zit in de put' : 'zit in de gevangenis'} en wacht op verlossing.`);
        bezig = true; knopStand();
        await wacht(1100); if (mijnId !== spelId) return;
        bezig = false;
        return volgende();
      }
    }
    zetStatus(`${naamHtml(p)} is aan de beurt${p.computer ? '…' : '. Werp de stenen.'}`);
    knopStand();
    if (p.computer) {
      await wacht(800); if (mijnId !== spelId) return;
      werp();
    }
  }

  function volgende() {
    if (winnaar) return;
    beurt = (beurt + 1) % spelers.length;
    beurtBegin();
  }

  async function stap(p, richting) {
    if (p.pos + richting > 63) richting = -1;
    p.pos += richting;
    tekenPion(p);
    Geluid.stap();
    await wacht(160);
    return richting;
  }

  async function loop(p, aantal, richting) {
    for (let i = 0; i < aantal; i++) richting = await stap(p, richting);
    return richting;
  }

  async function spring(p, naar) {
    p.pos = naar;
    tekenPion(p);
    Geluid.schuif();
    await wacht(450);
  }

  async function werp() {
    const mijnId = spelId;
    const p = huidige();
    bezig = true; knopStand();
    const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
    Geluid.dobbel();
    ui.d1.classList.remove('rolt'); ui.d2.classList.remove('rolt');
    void ui.d1.offsetWidth;
    ui.d1.classList.add('rolt'); ui.d2.classList.add('rolt');
    for (let i = 0; i < 5; i++) { toonDobbel(ui.d1, 1 + Math.floor(Math.random() * 6)); toonDobbel(ui.d2, 1 + Math.floor(Math.random() * 6)); await wacht(80); }
    toonDobbel(ui.d1, a); toonDobbel(ui.d2, b);
    if (mijnId !== spelId) return;
    const worp = a + b;
    zetStatus(`${naamHtml(p)} gooit ${a} en ${b}.`);

    if (p.eersteWorp && p.pos === 0 && ((a === 6 && b === 3) || (a === 3 && b === 6))) {
      p.eersteWorp = false;
      log(`${naamHtml(p)} gooit 6 en 3 bij de eerste worp en gaat direct naar 26.`);
      await spring(p, 26);
    } else if (p.eersteWorp && p.pos === 0 && ((a === 5 && b === 4) || (a === 4 && b === 5))) {
      p.eersteWorp = false;
      log(`${naamHtml(p)} gooit 5 en 4 bij de eerste worp en gaat direct naar 53.`);
      await spring(p, 53);
    } else {
      p.eersteWorp = false;
      let richting = await loop(p, worp, 1);
      if (mijnId !== spelId) return;
      if (richting < 0) log(`${naamHtml(p)} gooit ${worp}, te veel, en telt terug naar ${p.pos}.`);
      else log(`${naamHtml(p)} gooit ${worp} en komt op ${p.pos}.`);
      // Gevolgen van het veld
      for (let keer = 0; keer < 12; keer++) {
        if (mijnId !== spelId) return;
        const v = p.pos;
        if (v === 63) break;
        if (GANZEN.includes(v)) {
          log(`Gans op ${v}: ${naamHtml(p)} loopt nog eens ${worp}.`);
          await wacht(250);
          richting = await loop(p, worp, richting);
          continue;
        }
        if (v === 6) { log('De brug: oversteken naar 12.'); await spring(p, 12); break; }
        if (v === 42) { log('Verdwaald in het doolhof: terug naar 39.'); await spring(p, 39); break; }
        if (v === 58) { log(`De dood op 58: ${naamHtml(p)} moet terug naar het begin.`); Geluid.jammer(); await spring(p, 0); break; }
        if (v === 19) { p.overslaan = 1; log(`${naamHtml(p)} gaat de herberg in en slaat een beurt over.`); break; }
        if (v === 31 || v === 52) {
          const plek = v === 31 ? 'de put' : 'de gevangenis';
          spelers.forEach((q) => { if (q !== p && q.pos === v && q.vast) { q.vast = false; log(`${naamHtml(q)} is verlost uit ${plek}.`); } });
          p.vast = true;
          if (v === 31) Geluid.plons();
          log(`${naamHtml(p)} belandt in ${plek}.`);
          break;
        }
        break;
      }
    }
    if (mijnId !== spelId) return;
    tekenSpelers();
    if (p.pos === 63) {
      winnaar = p;
      zetStatus(`${naamHtml(p)} bereikt de ganzenhof en wint!`);
      log(`<b>${naamHtml(p)} wint het spel.</b>`);
      Geluid.klok();
      bezig = false; knopStand(); tekenSpelers();
      ui.werp.textContent = 'Werp de stenen';
      // duiten: een mens die wint krijgt 40, verliezen tegen de computer levert 15 op
      if (window.Duiten && spelers.some((q) => !q.computer)) {
        window.Duiten.beloon({ spel: 'ganzenbord', bedrag: p.computer ? 15 : 40, gewonnen: !p.computer, tekst: p.computer ? `${p.naam} won, goed gespeeld` : `${p.naam} wint!` });
      }
      return;
    }
    await wacht(500);
    if (mijnId !== spelId) return;
    bezig = false;
    volgende();
  }

  window.Spellen = window.Spellen || {};
  window.Spellen.ganzenbord = {
    start() {
      veld = document.getElementById('gb-veld');
      paneel = document.getElementById('gb-paneel');
      if (!gebouwd) {
        const b = bouwBord();
        svg = b.svg; pionLaag = b.laag;
        veld.appendChild(svg);
        bouwPaneel();
        gebouwd = true;
        nieuwSpel();
      } else if (!winnaar) {
        beurtBegin();
      }
    },
    stop() { spelId++; bezig = false; },
    opnieuw() { nieuwSpel(); },
    // een losse prent van het bord, om aan de muur van het huis te hangen
    maakPrent() { const b = bouwBord('-wand', true); b.svg.removeAttribute('class'); b.svg.setAttribute('aria-hidden', 'true'); return b.svg; }
  };
})();
