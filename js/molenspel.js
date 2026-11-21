/* Molenspel: negen stenen per speler op een ingekraste steen, zoals in middeleeuwse kerkvloeren. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
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
  const xy = (i) => [50 + PUNTEN[i][0] * 70, 50 + PUNTEN[i][1] * 70];
  const NAAM = { 1: 'Wit', 2: 'Zwart' };
  const wacht = (ms) => new Promise((res) => setTimeout(res, ms));

  let veld, paneel, svg, steenLaag, puntLaag, gebouwd = false;
  let bord, teZetten, aanZet, fase, gekozen, wegnemen, winnaar, zettenZonderMolen, spelId = 0;
  let tegenComputer = true;
  let ui = {};

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };

  // ---------- Regels ----------
  const tel = (b, s) => b.filter((v) => v === s).length;
  const ander = (s) => 3 - s;
  function inMolen(b, i) { const s = b[i]; return s && MOLENS.some((m) => m.includes(i) && m.every((p) => b[p] === s)); }
  function maaktMolen(b, naar, s, van) {
    return MOLENS.some((m) => m.includes(naar) && m.every((p) => p === naar || (b[p] === s && p !== van)));
  }
  function mag(b, s, tz) {
    // lijst van zetten [van, naar]; van = -1 bij plaatsen
    const leeg = [];
    b.forEach((v, i) => { if (!v) leeg.push(i); });
    if (tz[s] > 0) return leeg.map((n) => [-1, n]);
    const eigen = []; b.forEach((v, i) => { if (v === s) eigen.push(i); });
    const vliegen = eigen.length === 3;
    const z = [];
    eigen.forEach((v) => { (vliegen ? leeg : BUREN[v].filter((n) => !b[n])).forEach((n) => z.push([v, n])); });
    return z;
  }
  function wegneembaar(b, s) {
    const tegen = []; b.forEach((v, i) => { if (v === s) tegen.push(i); });
    const vrij = tegen.filter((i) => !inMolen(b, i));
    return vrij.length ? vrij : tegen;
  }

  // ---------- Computer ----------
  function dreigingen(b, s, tz) {
    // lege punten waar speler s volgende zet een molen kan maken
    const plekken = new Set();
    mag(b, s, tz).forEach(([van, naar]) => { if (maaktMolen(b, naar, s, van)) plekken.add(naar); });
    return plekken;
  }
  function kiesZet() {
    const s = aanZet, t = ander(s);
    const zetten = mag(bord, s, teZetten);
    const zijnDreiging = dreigingen(bord, t, teZetten);
    let beste = null, besteScore = -Infinity;
    for (const [van, naar] of zetten) {
      let score = Math.random() * 3;
      if (maaktMolen(bord, naar, s, van)) score += 100;
      if (zijnDreiging.has(naar)) score += 50;
      const b2 = bord.slice(); if (van >= 0) b2[van] = 0; b2[naar] = s;
      const tz2 = teZetten.slice(); if (van < 0) tz2[s]--;
      // eigen kansen voor de volgende beurt
      MOLENS.forEach((m) => { if (m.includes(naar) && m.filter((p) => b2[p] === s).length === 2 && m.some((p) => !b2[p])) score += 6; });
      // geef de tegenstander geen molen weg
      if (dreigingen(b2, t, tz2).size > zijnDreiging.size) score -= 40;
      if (van >= 0 && dreigingen(b2, t, tz2).has(van)) score -= 30;
      if (score > besteScore) { besteScore = score; beste = [van, naar]; }
    }
    return beste;
  }
  function kiesWegnemen() {
    const s = aanZet, t = ander(s);
    const kandidaten = wegneembaar(bord, t);
    let beste = kandidaten[0], besteScore = -Infinity;
    for (const i of kandidaten) {
      let score = Math.random();
      MOLENS.forEach((m) => { if (m.includes(i) && m.filter((p) => bord[p] === t).length === 2 && m.some((p) => !bord[p])) score += 10; });
      if (score > besteScore) { besteScore = score; beste = i; }
    }
    return beste;
  }

  // ---------- Tekenen ----------
  function bouwBord() {
    svg = el('svg', { viewBox: '0 0 520 520', class: 'mo-bord', role: 'img', 'aria-label': 'Molenspelbord' });
    const defs = el('defs', {}, svg);
    const f = el('filter', { id: 'mo-steen' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.55', numOctaves: '4', seed: '4', result: 'r' }, f);
    el('feColorMatrix', { in: 'r', values: '0 0 0 0 .35  0 0 0 0 .34  0 0 0 0 .32  0 0 0 .35 0' }, f);
    el('feComposite', { in2: 'SourceGraphic', operator: 'in' }, f);
    const vg = el('radialGradient', { id: 'mo-vlak', cx: '45%', cy: '40%', r: '75%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#B9B3A6' }, vg);
    el('stop', { offset: '1', 'stop-color': '#8F897D' }, vg);
    const wg = el('radialGradient', { id: 'mo-wit', cx: '35%', cy: '30%', r: '75%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#FFFDF6' }, wg);
    el('stop', { offset: '.7', 'stop-color': '#E6DCC6' }, wg);
    el('stop', { offset: '1', 'stop-color': '#B9AD92' }, wg);
    const zg = el('radialGradient', { id: 'mo-zwart', cx: '35%', cy: '30%', r: '75%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#6A5F57' }, zg);
    el('stop', { offset: '.6', 'stop-color': '#2C2522' }, zg);
    el('stop', { offset: '1', 'stop-color': '#151110' }, zg);

    el('rect', { x: 4, y: 4, width: 512, height: 512, rx: 14, fill: 'url(#mo-vlak)' }, svg);
    el('rect', { x: 4, y: 4, width: 512, height: 512, rx: 14, fill: '#9A9488', filter: 'url(#mo-steen)' }, svg);
    el('rect', { x: 4, y: 4, width: 512, height: 512, rx: 14, fill: 'none', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 3 }, svg);

    // ingekraste lijnen: licht randje + donkere groef
    const lijnen = [
      'M50 50 H470 V470 H50 Z', 'M120 120 H400 V400 H120 Z', 'M190 190 H330 V330 H190 Z',
      'M260 50 V190 M260 330 V470 M50 260 H190 M330 260 H470'
    ];
    lijnen.forEach((d) => {
      el('path', { d, fill: 'none', stroke: 'rgba(255,250,235,.45)', 'stroke-width': 5, transform: 'translate(1.2 1.6)', 'stroke-linecap': 'round' }, svg);
      el('path', { d, fill: 'none', stroke: '#3C3833', 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    });
    PUNTEN.forEach((_, i) => {
      const [x, y] = xy(i);
      el('circle', { cx: x + 1, cy: y + 1.3, r: 8, fill: 'rgba(255,250,235,.4)' }, svg);
      el('circle', { cx: x, cy: y, r: 7.5, fill: '#3C3833' }, svg);
    });

    steenLaag = el('g', {}, svg);
    puntLaag = el('g', {}, svg);
    PUNTEN.forEach((_, i) => {
      const [x, y] = xy(i);
      const c = el('circle', { cx: x, cy: y, r: 30, fill: 'transparent', class: 'punt', tabindex: 0, role: 'button', 'data-i': i }, puntLaag);
      c.addEventListener('click', () => klik(i));
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); klik(i); } });
    });
    return svg;
  }

  function teken() {
    steenLaag.textContent = '';
    const doelen = new Set();
    const pakbaar = new Set();
    if (!winnaar && !computerAanZet()) {
      if (wegnemen) wegneembaar(bord, ander(aanZet)).forEach((i) => pakbaar.add(i));
      else if (gekozen !== null) mag(bord, aanZet, teZetten).forEach(([v, n]) => { if (v === gekozen) doelen.add(n); });
    }
    doelen.forEach((i) => {
      const [x, y] = xy(i);
      el('circle', { cx: x, cy: y, r: 14, fill: 'none', stroke: '#1C3473', 'stroke-width': 3, 'stroke-dasharray': '4 4' }, steenLaag);
    });
    bord.forEach((v, i) => {
      if (!v) return;
      const [x, y] = xy(i);
      const g = el('g', { class: 'steen' }, steenLaag);
      el('ellipse', { cx: x + 3, cy: y + 5, rx: 23, ry: 21, fill: 'rgba(0,0,0,.35)' }, g);
      el('circle', { cx: x, cy: y, r: 23, fill: v === 1 ? 'url(#mo-wit)' : 'url(#mo-zwart)', stroke: v === 1 ? '#8D8167' : '#000', 'stroke-width': 1.2 }, g);
      el('circle', { cx: x, cy: y, r: 15, fill: 'none', stroke: v === 1 ? 'rgba(120,100,60,.35)' : 'rgba(255,255,255,.12)', 'stroke-width': 1.2 }, g);
      if (i === gekozen) el('circle', { cx: x, cy: y, r: 27, fill: 'none', stroke: '#C2892A', 'stroke-width': 3.5 }, steenLaag);
      if (pakbaar.has(i)) el('circle', { cx: x, cy: y, r: 27, fill: 'none', stroke: '#B6452C', 'stroke-width': 3, 'stroke-dasharray': '5 4' }, steenLaag);
    });
    werkPaneelBij();
  }

  // ---------- Verloop ----------
  function computerAanZet() { return tegenComputer && aanZet === 2; }

  function nieuwSpel() {
    spelId++;
    bord = Array(24).fill(0);
    teZetten = [0, 9, 9];
    aanZet = 1; gekozen = null; wegnemen = false; winnaar = null; zettenZonderMolen = 0;
    melding(`Wit begint. Zet een steen op een kruispunt.`);
    teken();
  }

  function melding(t) { if (ui.status) ui.status.textContent = t; }

  function faseTekst(s) {
    if (teZetten[s] > 0) return 'zetten';
    return tel(bord, s) === 3 ? 'springen' : 'schuiven';
  }

  function klik(i) {
    if (winnaar || computerAanZet()) return;
    if (wegnemen) {
      if (wegneembaar(bord, ander(aanZet)).includes(i)) neemWeg(i);
      return;
    }
    if (teZetten[aanZet] > 0) {
      if (!bord[i]) doeZet(-1, i);
      return;
    }
    if (bord[i] === aanZet) { gekozen = gekozen === i ? null : i; Geluid.pak(); teken(); return; }
    if (gekozen !== null && !bord[i]) {
      if (mag(bord, aanZet, teZetten).some(([v, n]) => v === gekozen && n === i)) doeZet(gekozen, i);
    }
  }

  function doeZet(van, naar) {
    const s = aanZet;
    const molen = maaktMolen(bord, naar, s, van);
    if (van >= 0) bord[van] = 0; else teZetten[s]--;
    bord[naar] = s;
    gekozen = null;
    Geluid.steen();
    if (molen) {
      wegnemen = true;
      zettenZonderMolen = 0;
      melding(`${NAAM[s]} heeft een molen! ${computerAanZet() ? 'Zwart kiest een steen…' : 'Kies een steen van ' + NAAM[ander(s)] + ' om weg te nemen.'}`);
      teken();
      if (computerAanZet()) computerBeurt();
      return;
    }
    if (teZetten[1] === 0 && teZetten[2] === 0) zettenZonderMolen++;
    eindeBeurt();
  }

  function neemWeg(i) {
    bord[i] = 0;
    wegnemen = false;
    Geluid.pak();
    eindeBeurt();
  }

  function eindeBeurt() {
    const t = ander(aanZet);
    if (tel(bord, t) + teZetten[t] < 3) return einde(aanZet, `${NAAM[t]} heeft nog maar twee stenen.`);
    if (mag(bord, t, teZetten).length === 0) return einde(aanZet, `${NAAM[t]} kan geen kant meer op.`);
    if (zettenZonderMolen >= 50) { winnaar = 3; melding('Vijftig zetten zonder molen: remise.'); teken(); return; }
    aanZet = t;
    const f = faseTekst(aanZet);
    const uitleg = { zetten: 'Zet een steen op een leeg kruispunt.', schuiven: 'Kies een steen en schuif hem naar een leeg buurpunt.', springen: 'Nog drie stenen: je mag naar elk leeg punt springen.' };
    melding(computerAanZet() ? 'Zwart denkt na…' : `${NAAM[aanZet]} is aan zet. ${uitleg[f]}`);
    teken();
    if (computerAanZet()) computerBeurt();
  }

  function einde(w, reden) {
    winnaar = w;
    melding(`${reden} ${NAAM[w]} wint!`);
    if (!tegenComputer || w === 1) Geluid.klok(); else Geluid.jammer();
    teken();
  }

  async function computerBeurt() {
    const mijnId = spelId;
    await wacht(650);
    if (mijnId !== spelId || winnaar) return;
    if (wegnemen) {
      const i = kiesWegnemen();
      await wacht(250);
      if (mijnId !== spelId) return;
      bord[i] = 0; wegnemen = false; Geluid.pak();
      eindeBeurt();
      return;
    }
    const z = kiesZet();
    if (!z) return;
    doeZet(z[0], z[1]);
  }

  // ---------- Paneel ----------
  function bouwPaneel() {
    paneel.innerHTML = `
      <p class="status" id="mo-status" aria-live="polite"></p>
      <div class="voorraad">
        <div><span class="stip" style="background:#EFE7D4;box-shadow:inset 0 0 0 1px #8D8167"></span>Wit: <b id="mo-w"></b></div>
        <div><span class="stip" style="background:#2C2522"></span>Zwart: <b id="mo-z"></b></div>
      </div>
      <div class="veld-rij">
        <label for="mo-tegen">Tegenstander</label>
        <select id="mo-tegen"><option value="computer">Computer</option><option value="mens">Tweede speler</option></select>
      </div>
      <div class="knoppen"><button class="knop" id="mo-nieuw" type="button">Nieuw spel</button></div>
      <details>
        <summary>Speelregels</summary>
        <ul>
          <li>Om de beurt zet je een van je negen stenen op een kruispunt.</li>
          <li>Drie eigen stenen op één lijn is een <b>molen</b>: je mag dan een steen van de ander wegnemen. Stenen in een molen zijn veilig, tenzij er geen andere zijn.</li>
          <li>Staan alle stenen op het bord, dan schuif je naar een leeg buurpunt.</li>
          <li>Heb je nog drie stenen, dan mag je springen naar elk leeg punt.</li>
          <li>Wie nog twee stenen heeft of niet meer kan schuiven, verliest.</li>
        </ul>
      </details>
      <p class="geschiedenis">Het molenspel is eeuwenoud. In Nederland zijn borden gevonden die in stenen zijn gekrast: in een laatmiddeleeuwse baksteen van de Martinikerk in Groningen, op een daklei in Eindhoven en in de vloer van een oude gevangenis in Enkhuizen. Samen met schaak en triktrak hoorde het bij de klassieke spellen van de middeleeuwen.</p>
    `;
    ui.status = paneel.querySelector('#mo-status');
    ui.w = paneel.querySelector('#mo-w');
    ui.z = paneel.querySelector('#mo-z');
    const tegen = paneel.querySelector('#mo-tegen');
    tegen.addEventListener('change', () => { tegenComputer = tegen.value === 'computer'; nieuwSpel(); });
    paneel.querySelector('#mo-nieuw').addEventListener('click', nieuwSpel);
  }

  function werkPaneelBij() {
    if (!ui.w) return;
    const fmt = (s) => {
      const op = tel(bord, s);
      return teZetten[s] > 0 ? `${teZetten[s]} te zetten, ${op} op het bord` : `${op} op het bord`;
    };
    ui.w.textContent = fmt(1);
    ui.z.textContent = fmt(2);
  }

  window.Spellen = window.Spellen || {};
  window.Spellen.molenspel = {
    start() {
      veld = document.getElementById('mo-veld');
      paneel = document.getElementById('mo-paneel');
      if (!gebouwd) {
        bouwPaneel();
        veld.appendChild(bouwBord());
        gebouwd = true;
        nieuwSpel();
      } else if (computerAanZet() && !winnaar) {
        computerBeurt();
      }
    },
    stop() { spelId++; }
  };
})();
