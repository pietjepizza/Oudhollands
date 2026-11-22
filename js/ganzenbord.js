/* Ganzenbord, schermvullend: een handgekleurd prentbord met 63 velden in een spiraal naar de ganzenhof.

   Overgenomen van succesvolle dobbelspellen:
   - het gooien moet heerlijk voelen (Monopoly GO: "I can't stop rolling"): je schudt de beker, de stenen
     tuimelen over het bord, het toestel tikt mee en je pion begint al te lopen terwijl de stenen uitrollen;
   - grote stenen, vloeiende bewegingen en een geluid bij elk bijzonder vak (populaire Slangen-en-Ladders-apps);
   - meespelers met een eigen gezicht die reageren op wat er gebeurt;
   - alles in één scherm, zonder tekst eronder (Ludo King).
   Het bord zelf hangt ook als prent aan de muur van de voorkamer (maakPrent). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const INKT = '#2B2118';
  const GANZEN = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
  const BIJZONDER = { 6: 'brug', 19: 'herberg', 31: 'put', 42: 'doolhof', 52: 'gevangenis', 58: 'dood' };
  const WAS = { gans: '#9FC0DA', brug: '#7FA2C8', herberg: '#D0704F', put: '#7FB0A8', doolhof: '#93AE6A', gevangenis: '#A99BBE', dood: '#4A4038' };
  const WASSINGEN = ['#EBC7A4', '#D3DCA8', '#C6D3E2', '#EBD79E', '#E3BDB0'];
  const KLEUREN = [
    { naam: 'Rood', kleur: '#C0392B' }, { naam: 'Blauw', kleur: '#2D5BA8' },
    { naam: 'Groen', kleur: '#3F8A44' }, { naam: 'Geel', kleur: '#E0B030' }
  ];

  // ============================================================
  // DE SPIRAAL (viewBox 720 x 720)
  // ============================================================
  const C = 360, R0 = 306, B = 62, R_EIND = 96, N = 62;
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
  const midden = [[92, 628]];
  for (let i = 1; i <= N; i++) { const tm = (grenzen[i - 1] + grenzen[i]) / 2; midden.push(punt(tm, r(tm))); }
  midden.push([C, C + 6]);
  const STARTPLEK = [[-24, -10], [24, -10], [-24, 22], [24, 22]];

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const tekst = (t, attrs, ouder) => { const e = el('text', attrs, ouder); e.textContent = t; return e; };
  const soortVan = (i) => (GANZEN.includes(i) ? 'gans' : BIJZONDER[i] || null);
  function veldPad(i) {
    const ta = grenzen[i - 1], tb = grenzen[i], stappen = 8, d = [];
    for (let k = 0; k <= stappen; k++) { const t = ta + (tb - ta) * k / stappen; const p = punt(t, r(t) + B / 2 - 1.5); d.push((k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)); }
    for (let k = stappen; k >= 0; k--) { const t = ta + (tb - ta) * k / stappen; const p = punt(t, r(t) - B / 2 + 1.5); d.push('L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)); }
    return d.join(' ') + ' Z';
  }

  // ============================================================
  // HOUTSNEDEN: de plaatjes op de bijzondere velden
  // ============================================================
  const lijn = (w) => ({ fill: 'none', stroke: INKT, 'stroke-width': w || 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  function figuur(soort, ouder, x, y, sch) {
    const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sch})` }, ouder);
    if (soort === 'gans') {
      el('path', { d: 'M-17 5 C-18 -3 -10 -7 -1 -6 C5 -5.5 7 -10 7 -16 C7 -22 12 -25 16 -22 L22 -20 L16.5 -17.5 C14.5 -15 14 -11 14.5 -6 C19 -2 18 7 9 10 C1 13 -13 12 -17 5 Z', fill: '#FBF8F0', stroke: INKT, 'stroke-width': 1.7, 'stroke-linejoin': 'round' }, g);
      el('path', { d: 'M-11 1 C-5 -3 3 -2 8 2 C2 5.5 -6 5.5 -11 1 Z', fill: '#E6E0D2', stroke: INKT, 'stroke-width': 1.1 }, g);
      el('path', { d: 'M16 -22 L23.5 -20 L16.5 -17.4 Z', fill: '#E07A2A', stroke: INKT, 'stroke-width': 1 }, g);
      el('circle', { cx: 12.6, cy: -19.6, r: 1.4, fill: INKT }, g);
      el('path', { d: 'M-2 10.5 v5 l-3 1 M4 10.5 v5 l-3 1', fill: 'none', stroke: '#E07A2A', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
    } else if (soort === 'brug') {
      el('path', { d: 'M-21 12 q5 -3 10.5 0 t10.5 0 t10.5 0 t10.5 0', fill: 'none', stroke: '#2F5F9A', 'stroke-width': 2 }, g);
      el('path', { d: 'M-21 6 Q0 -15 21 6 L21 9.5 Q0 -9 -21 9.5 Z', fill: '#B07A4A', stroke: INKT, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
      el('path', { d: 'M-15 -1 V-8 M-6 -5.4 V-12.5 M3 -5.6 V-12.6 M12 -2 V-9 M-17 -6 Q0 -21 17 -6', ...lijn(1.4) }, g);
    } else if (soort === 'herberg') {
      el('path', { d: 'M-12 -7 H6 V14 H-12 Z', fill: '#E3B655', stroke: INKT, 'stroke-width': 1.6 }, g);
      el('path', { d: 'M6 -2 H11 Q14 -2 14 2 V6 Q14 10 11 10 H6', ...lijn(1.8) }, g);
      el('path', { d: 'M-14 -8 q2 -6 6 -3 q2 -5 6 -2 q3 -4 6 0 q3 0 2 5 H-14 Z', fill: '#FBF8F0', stroke: INKT, 'stroke-width': 1.3 }, g);
      el('path', { d: 'M-7 -1 V10 M-2 -1 V10', ...lijn(1.2) }, g);
    } else if (soort === 'put') {
      el('path', { d: 'M-15 -10 L0 -19 L15 -10 Z', fill: '#B6452C', stroke: INKT, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
      el('path', { d: 'M-11 -10 V2 M11 -10 V2 M0 -10 V-3', ...lijn(1.6) }, g);
      el('rect', { x: -3, y: -3, width: 6, height: 5, fill: '#8A5A2E', stroke: INKT, 'stroke-width': 1 }, g);
      el('path', { d: 'M-14 2 H14 V14 H-14 Z', fill: '#C9C0AE', stroke: INKT, 'stroke-width': 1.6 }, g);
      el('path', { d: 'M-14 8 H14 M-7 2 V8 M3 8 V14 M8 2 V8', ...lijn(1) }, g);
    } else if (soort === 'doolhof') {
      el('rect', { x: -15, y: -15, width: 30, height: 30, fill: '#93AE6A', stroke: INKT, 'stroke-width': 1.6 }, g);
      el('path', { d: 'M-15 -15 H15 V15 H-9 V-9 H9 V9 H-3 V-3 H3', fill: 'none', stroke: '#2E4A1E', 'stroke-width': 3.2, 'stroke-linecap': 'square' }, g);
      el('circle', { cx: 0, cy: 3, r: 2.2, fill: '#E07A2A', stroke: INKT, 'stroke-width': .8 }, g);
    } else if (soort === 'gevangenis') {
      el('path', { d: 'M-14 15 V-10 L-10 -15 H10 L14 -10 V15 Z', fill: '#8F8478', stroke: INKT, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
      el('rect', { x: -8, y: -8, width: 16, height: 16, fill: '#2A241E', stroke: INKT, 'stroke-width': 1.2 }, g);
      el('path', { d: 'M-4 -8 V8 M0 -8 V8 M4 -8 V8', stroke: '#C9C0AE', 'stroke-width': 1.8, fill: 'none' }, g);
      el('path', { d: 'M-14 -2 H-8 M8 -2 H14 M-14 8 H-8 M8 8 H14', ...lijn(.9) }, g);
    } else if (soort === 'dood') {
      el('path', { d: 'M-11 -3 a11 11 0 1 1 22 0 q0 6 -5 8.5 V11 H-6 V5.5 q-5 -2.5 -5 -8.5 Z', fill: '#F1E6C8', stroke: '#F1E6C8', 'stroke-width': 1 }, g);
      el('circle', { cx: -4.6, cy: -3, r: 3.3, fill: '#2A241E' }, g);
      el('circle', { cx: 4.6, cy: -3, r: 3.3, fill: '#2A241E' }, g);
      el('path', { d: 'M0 2 l-1.8 3.4 h3.6 Z', fill: '#2A241E' }, g);
      el('path', { d: 'M-3 8 V11 M0 8 V11 M3 8 V11', stroke: '#2A241E', 'stroke-width': 1.1 }, g);
      el('path', { d: 'M-16 14 L16 20 M16 14 L-16 20', stroke: '#F1E6C8', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    } else if (soort === 'doel') {
      figuur('gans', g, 0, 2, 1);
      el('path', { d: 'M-8 -30 L-4 -22 L0 -30 L4 -22 L8 -30 L8 -20 H-8 Z', fill: '#E3B655', stroke: INKT, 'stroke-width': 1.3, 'stroke-linejoin': 'round', transform: 'translate(12 6) rotate(18)' }, g);
    }
    return g;
  }

  // ============================================================
  // HET PRENTBORD
  // ============================================================
  let papierUrl = null;
  function papier() {
    if (papierUrl !== null) return papierUrl;
    papierUrl = '';
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 360;
      const g = c.getContext('2d');
      const d = g.createImageData(360, 360);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = (Math.random() - 0.5) * 40;
        d.data[i] = 120 + v; d.data[i + 1] = 92 + v; d.data[i + 2] = 52 + v; d.data[i + 3] = 26;
      }
      g.putImageData(d, 0, 0);
      g.strokeStyle = 'rgba(120,92,52,.18)';
      for (let i = 0; i < 70; i++) {
        g.lineWidth = 0.5 + Math.random();
        g.beginPath();
        const x = Math.random() * 360, y = Math.random() * 360;
        g.moveTo(x, y); g.quadraticCurveTo(x + 8 - Math.random() * 16, y + 8, x + 20 - Math.random() * 40, y + 14 - Math.random() * 28);
        g.stroke();
      }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(140,100,50,.16)'; g.beginPath(); g.arc(Math.random() * 360, Math.random() * 360, 2 + Math.random() * 9, 0, 7); g.fill(); }
      papierUrl = c.toDataURL('image/png');
    } catch (e) { papierUrl = ''; }
    return papierUrl;
  }

  function tekenBord(sfx, eenvoudig) {
    const svg = el('svg', { viewBox: '0 0 720 720', class: 'gb-prent', role: 'img', 'aria-label': 'Ganzenbord: 63 velden in een spiraal naar de ganzenhof' });
    const defs = el('defs', {}, svg);
    const rg = el('radialGradient', { id: 'gb-vignet' + sfx, cx: '50%', cy: '50%', r: '72%' }, defs);
    el('stop', { offset: '.58', 'stop-color': '#7A5A2A', 'stop-opacity': 0 }, rg);
    el('stop', { offset: '1', 'stop-color': '#6A4A1E', 'stop-opacity': 0.32 }, rg);
    const hg = el('radialGradient', { id: 'gb-hof' + sfx, cx: '50%', cy: '45%', r: '60%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#F7DF8E' }, hg);
    el('stop', { offset: '1', 'stop-color': '#D9A62E' }, hg);

    el('rect', { width: 720, height: 720, fill: '#EFE2C0' }, svg);
    const pap = !eenvoudig && papier();
    if (pap) el('image', { href: pap, width: 720, height: 720, preserveAspectRatio: 'none', 'pointer-events': 'none' }, svg);
    el('rect', { width: 720, height: 720, fill: `url(#gb-vignet${sfx})` }, svg);
    // dubbele rand met rozetjes in de hoeken
    el('rect', { x: 8, y: 8, width: 704, height: 704, fill: 'none', stroke: INKT, 'stroke-width': 3.2 }, svg);
    el('rect', { x: 16, y: 16, width: 688, height: 688, fill: 'none', stroke: INKT, 'stroke-width': 1 }, svg);
    [[16, 16], [704, 16], [16, 704], [704, 704]].forEach(([x, y]) => {
      el('circle', { cx: x, cy: y, r: 7, fill: INKT }, svg);
      el('circle', { cx: x, cy: y, r: 3, fill: '#EFE2C0' }, svg);
    });
    // de lucht achter de spiraal: zachte stralen uit de ganzenhof
    const stralen = el('g', { opacity: 0.16 }, svg);
    for (let k = 0; k < 24; k++) {
      const a = k * Math.PI / 12;
      el('path', { d: `M${C} ${C} L${(C + 360 * Math.cos(a - 0.05)).toFixed(1)} ${(C + 360 * Math.sin(a - 0.05)).toFixed(1)} L${(C + 360 * Math.cos(a + 0.05)).toFixed(1)} ${(C + 360 * Math.sin(a + 0.05)).toFixed(1)} Z`, fill: '#C9973F' }, stralen);
    }

    // ---------- hoeken ----------
    // linksboven: de titel op een lint
    const titel = el('g', {}, svg);
    el('path', { d: 'M30 34 H196 L186 50 L196 66 H30 L40 50 Z', fill: '#B6452C', opacity: 0.85, transform: 'translate(2 2)', style: 'mix-blend-mode:multiply' }, titel);
    el('path', { d: 'M30 34 H196 L186 50 L196 66 H30 L40 50 Z', fill: 'none', stroke: INKT, 'stroke-width': 1.4 }, titel);
    tekst('Het Ganzenspel', { x: 113, y: 57, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-size': 21, fill: '#FBF3DC' }, titel);
    tekst('naer Hollandsche prenten', { x: 113, y: 84, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 11.5, fill: INKT, opacity: 0.85 }, titel);
    // rechtsboven: de eerste worp
    const worp = el('g', {}, svg);
    [[588, 34, [0, 2, 3, 5, 6, 8]], [634, 34, [0, 4, 8]]].forEach(([x, y, pips]) => {
      el('rect', { x, y, width: 34, height: 34, rx: 6, fill: '#FBF8F0', stroke: INKT, 'stroke-width': 1.4 }, worp);
      pips.forEach((pp) => el('circle', { cx: x + 8 + (pp % 3) * 9, cy: y + 8 + Math.floor(pp / 3) * 9, r: 2.6, fill: INKT }, worp));
    });
    tekst('eerste worp: naar 26', { x: 640, y: 86, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-size': 12.5, fill: INKT }, worp);
    // linksonder: de poort waar je begint
    const poort = el('g', {}, svg);
    el('path', { d: 'M40 690 V606 Q92 566 144 606 V690', fill: '#E3C79A', opacity: 0.75, transform: 'translate(2 2)', style: 'mix-blend-mode:multiply' }, poort);
    el('path', { d: 'M40 690 V606 Q92 566 144 606 V690', fill: 'none', stroke: INKT, 'stroke-width': 1.6 }, poort);
    el('path', { d: 'M30 690 H154', stroke: INKT, 'stroke-width': 1.6 }, poort);
    [[34, 600], [140, 600]].forEach(([x, y]) => {
      el('rect', { x, y, width: 10, height: 90, fill: '#B6452C', opacity: 0.8, style: 'mix-blend-mode:multiply' }, poort);
      el('rect', { x, y, width: 10, height: 90, fill: 'none', stroke: INKT, 'stroke-width': 1.2 }, poort);
      el('circle', { cx: x + 5, cy: y - 5, r: 6, fill: '#E3B655', stroke: INKT, 'stroke-width': 1.2 }, poort);
    });
    tekst('Begin', { x: 92, y: 704, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 13, fill: INKT }, poort);
    // rechtsonder: een molentje op de dijk
    const molen = el('g', { transform: 'translate(640 640)' }, svg);
    el('path', { d: 'M-70 52 Q-20 30 60 44 V56 H-70 Z', fill: '#93AE6A', opacity: 0.7, style: 'mix-blend-mode:multiply' }, molen);
    el('path', { d: 'M-70 52 Q-20 30 60 44', ...lijn(1.3) }, molen);
    el('path', { d: 'M-9 38 L-6 2 H6 L9 38 Z', fill: '#C9A27A', stroke: INKT, 'stroke-width': 1.4 }, molen);
    el('path', { d: 'M-8 2 L0 -8 L8 2 Z', fill: '#7A5A3A', stroke: INKT, 'stroke-width': 1.3 }, molen);
    el('rect', { x: -3, y: 24, width: 6, height: 12, fill: INKT }, molen);
    const wiek = el('g', { transform: 'translate(0 -4) rotate(22)' }, molen);
    [0, 90, 180, 270].forEach((a) => {
      const w = el('g', { transform: `rotate(${a})` }, wiek);
      el('rect', { x: -2, y: -40, width: 9, height: 36, fill: '#FBF8F0', stroke: INKT, 'stroke-width': 1.1 }, w);
      el('path', { d: 'M-2 -31 H7 M-2 -22 H7 M-2 -13 H7 M2.5 -40 V-4', ...lijn(0.7) }, w);
    });
    el('circle', { cx: 0, cy: -4, r: 2.6, fill: INKT }, molen);
    [[-44, 36], [36, 33]].forEach(([x, y]) => el('path', { d: `M${x} ${y} q3 -6 6 0 q3 -6 6 0`, ...lijn(1) }, molen));

    // ---------- de velden ----------
    const velden = el('g', {}, svg);
    for (let i = 1; i <= N; i++) {
      const soort = soortVan(i);
      const d = veldPad(i);
      const was = soort ? WAS[soort] : WASSINGEN[i % WASSINGEN.length];
      el('path', { d, fill: was, opacity: soort === 'dood' ? 0.95 : 0.88, transform: 'translate(2.4 1.8)', style: 'mix-blend-mode:multiply' }, velden);
      el('path', { d, fill: 'none', stroke: INKT, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, velden);
      const [x, y] = midden[i];
      if (soort) {
        figuur(soort, velden, x, y + 5, soort === 'gans' ? 0.62 : 0.68);
        tekst(String(i), { x: x.toFixed(1), y: (y - 15).toFixed(1), 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 12.5, fill: soort === 'dood' ? '#F1E6C8' : INKT }, velden);
      } else {
        tekst(String(i), { x: x.toFixed(1), y: (y + 7).toFixed(1), 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 20, fill: INKT }, velden);
      }
    }
    // ---------- de ganzenhof: veld 63 ----------
    const hof = el('g', {}, svg);
    el('circle', { cx: C + 2.4, cy: C + 1.8, r: 66, fill: `url(#gb-hof${sfx})`, opacity: 0.95, style: 'mix-blend-mode:multiply' }, hof);
    el('circle', { cx: C, cy: C, r: 66, fill: 'none', stroke: INKT, 'stroke-width': 2.2 }, hof);
    el('circle', { cx: C, cy: C, r: 59, fill: 'none', stroke: INKT, 'stroke-width': 0.8 }, hof);
    for (let k = 0; k < 18; k++) {
      const a = k * Math.PI / 9;
      el('circle', { cx: (C + 62.5 * Math.cos(a)).toFixed(1), cy: (C + 62.5 * Math.sin(a)).toFixed(1), r: 2.4, fill: '#5E8A3A', stroke: INKT, 'stroke-width': 0.6 }, hof);
    }
    figuur('doel', hof, C - 2, C - 8, 1.3);
    tekst('63', { x: C, y: C + 46, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 26, fill: INKT }, hof);
    return svg;
  }

  // ============================================================
  // TOESTAND
  // ============================================================
  const ZEGT = {
    start: ['Daar gaan we!', 'Gooien maar!'], gans: ['Gak gak!', 'Nog een keer!'], brug: ['Over de brug!'], herberg: ['Even uitrusten.'],
    put: ['Help, de put!', 'Haal me eruit!'], doolhof: ['Waar ben ik?'], gevangenis: ['Laat me eruit!'], dood: ['Nee toch!', 'Terug naar af...'],
    verlost: ['Dank je wel!', 'Vrij!'], gebotst: ['Hé, mijn plek!', 'Oei!'], wint: ['Hoera, gewonnen!'], verliest: ['Goed gedaan!', 'Gefeliciteerd!']
  };
  const EIGEN = {
    jantje: { gans: ['Joepie, een gans!'], dood: ['Neeee!'], wint: ['Ik heb gewonnen!'] },
    grietje: { gans: ['Gak gak gak!'], herberg: ['Een kopje thee.'] },
    kees: { gans: ['Wat een vogel!'], doolhof: ['Hm, verdwaald.'], wint: ['Gemalen en gewonnen!'] },
    burgemeester: { dood: ['Onaanvaardbaar!'], gevangenis: ['Weet u wel wie ik ben?'], wint: ['Zoals verwacht.'] }
  };
  const VRIENDEN = [{ id: 'vriend1', naam: 'Vriend' }, { id: 'vriend2', naam: 'Vriendin' }];

  let podium, ui = {}, bordSvg, pionSvg, gebouwd = false;
  let spelers = [], aan = 0, fase = 'klaar', spelId = 0, keuze = ['jantje', 'grietje'];
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 40) : ms));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const gezichten = () => (window.Personen ? Personen.gezicht : {});
  const naamVan = (id) => (window.Personen && Personen.namen[id]) || (VRIENDEN.find((v) => v.id === id) || {}).naam || id;
  const pionSvgHtml = (kleur) => `<svg viewBox="-20 -44 40 50" aria-hidden="true"><ellipse cx="2" cy="2" rx="13" ry="4.5" fill="rgba(0,0,0,.3)"/><path d="M-11 0 C-11 -4 -7 -6 -5 -8 L-3 -18 C-7 -20 -7 -27 0 -28 C7 -27 7 -20 3 -18 L5 -8 C7 -6 11 -4 11 0 Z" fill="${kleur}" stroke="${INKT}" stroke-width="1.4"/><circle cx="0" cy="-31" r="7.5" fill="${kleur}" stroke="${INKT}" stroke-width="1.4"/><ellipse cx="-2.5" cy="-33.5" rx="2.6" ry="1.8" fill="#fff" opacity=".55"/></svg>`;

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('gb-podium');
    podium.innerHTML = '';
    const boven = html(`<div class="mo-rij mo-boven gb-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <div class="gb-spelers" role="list" aria-label="Spelers"></div>
      <button class="mo-knop gb-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop gb-meer" type="button" aria-label="Kies met wie je speelt" title="Kies met wie je speelt" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="mo-bordvak gb-bordvak">
      <div class="gb-dobbels" aria-hidden="true"></div>
      <div class="gb-kaartje" aria-hidden="true" hidden><span class="gb-kaartje-beeld"></span><b class="gb-kaartje-titel"></b><span class="gb-kaartje-sub"></span></div>
      <div class="mo-vonken" aria-hidden="true"></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder gb-onder">
      <div class="mo-kaart gb-zelf">
        <span class="mo-gezicht gb-zelf-pion"></span>
        <span class="mo-info"><span class="mo-naam"></span></span>
        <span class="mo-doe"></span>
        <span class="mo-ballon" hidden></span>
      </div>
      <button class="gb-beker" type="button" aria-label="Schud de beker en gooi" title="Gooi">
        <svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="19" ry="4" fill="rgba(0,0,0,.35)"/><path d="M13 13 L51 13 L45.5 55 Q32 59.5 18.5 55 Z" fill="#7A4424" stroke="#2A160A" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 22 H48 M18 46 H46" stroke="#D9A64A" stroke-width="3"/><path d="M20 14 L24 54" stroke="#fff" stroke-opacity=".16" stroke-width="4"/><ellipse cx="32" cy="13" rx="19" ry="5.5" fill="#3A1E0C" stroke="#2A160A" stroke-width="2.2"/></svg>
        <span class="gb-beker-tekst">Gooi</span>
      </button>
    </div>`);
    const menu = html(`<div class="mo-menu gb-menu" role="dialog" aria-modal="true" aria-label="Met wie speel je?" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Wie spelen er mee?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="gb-keuzes"></div>
        <button class="knop gb-spelen" type="button">${icoon('pijl')}<span>Spelen!</span></button>
        <div class="mo-menu-voet">
          <button class="mo-knop mo-geluid" type="button" aria-pressed="true" aria-label="Geluid" title="Geluid">${icoon('geluid')}<i class="streep"></i></button>
          <button class="mo-knop mo-muziek" type="button" aria-pressed="false" aria-label="Muziek" title="Muziek">${icoon('muziek')}<i class="streep"></i></button>
        </div>
      </div>
    </div>`);
    const meld = html('<p class="sr-only" aria-live="polite"></p>');
    [boven, midden, onder, menu, meld].forEach((e) => podium.appendChild(e));
    ui = {
      spelers: boven.querySelector('.gb-spelers'), midden, bordvak: midden.querySelector('.gb-bordvak'),
      dobbels: midden.querySelector('.gb-dobbels'), kaartje: midden.querySelector('.gb-kaartje'), vonken: midden.querySelector('.mo-vonken'),
      zelf: onder.querySelector('.gb-zelf'), beker: onder.querySelector('.gb-beker'), menu, meld, keuzes: menu.querySelector('.gb-keuzes')
    };
    bordSvg = tekenBord('g', false);
    ui.bordvak.insertBefore(bordSvg, ui.bordvak.firstChild);
    pionSvg = el('svg', { viewBox: '0 0 720 720', class: 'gb-pionlaag', 'aria-hidden': 'true' });
    ui.bordvak.insertBefore(pionSvg, ui.dobbels);
    maakDobbels();

    boven.querySelector('.gb-meer').addEventListener('click', openMenu);
    boven.querySelector('.gb-vraag').addEventListener('click', () => { if (window.Les) Les.toon('ganzenbord'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.gb-spelen').addEventListener('click', () => { sluitMenu(); if (window.Duiten) Duiten.zetVeld('gans-spelers', keuze); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    // de beker: ingedrukt houden is schudden, loslaten is gooien
    const b = ui.beker;
    b.addEventListener('pointerdown', (e) => { if (!b.disabled) { e.preventDefault(); beginSchudden(); } });
    b.addEventListener('pointerup', () => { if (schudt) gooiMens(); });
    b.addEventListener('pointerleave', () => { if (schudt) gooiMens(); });
    b.addEventListener('pointercancel', () => { if (schudt) gooiMens(); });
    b.addEventListener('click', (e) => { if (e.detail === 0 && !b.disabled) { beginSchudden(); setTimeout(gooiMens, 260); } });

    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    gebouwd = true;
  }

  function pasMaatAan() {
    if (!ui.midden) return;
    const rr = ui.midden.getBoundingClientRect();
    if (!rr.width || !rr.height) return;
    const maat = Math.floor(Math.min(rr.width - 12, rr.height - 10, 780));
    podium.style.setProperty('--bord', Math.max(260, maat) + 'px');
  }

  // ============================================================
  // DOBBELSTENEN: echte kubusjes die over het bord tuimelen
  // ============================================================
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const DRAAI = { 1: [0, 0], 2: [90, 0], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 6: [0, 180] };
  function maakDobbels() {
    ui.dobbels.innerHTML = '';
    ui.dob = [0, 1].map(() => {
      const d = document.createElement('div');
      d.className = 'gb-dob';
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
    const st = window.Pronk ? Pronk.stijl('dobbels') : null;
    if (!st || !ui.dobbels) return;
    ui.dobbels.style.setProperty('--dob-a', st.a); ui.dobbels.style.setProperty('--dob-b', st.b);
    ui.dobbels.style.setProperty('--dob-c', st.c); ui.dobbels.style.setProperty('--dob-pip', st.pip);
  }
  if (window.Pronk) Pronk.opWijziging(kleurDobbels);

  // Gooi de stenen vanaf de kant van de speler; de belofte is klaar vlak voordat ze stilliggen.
  function tuimel(a, b, vanBoven) {
    const W = ui.bordvak.clientWidth || 360;
    const maat = Math.round(W * 0.15);
    ui.dobbels.style.setProperty('--d', maat + 'px');
    ui.dobbels.classList.add('zichtbaar');
    ui.dobbels.getAnimations && ui.dobbels.getAnimations().forEach((x) => x.cancel());
    ui.dobbels.style.opacity = 1;
    const duur = rustig() ? 1 : 1050;
    const doelen = [[W * (0.33 + Math.random() * 0.06), W * (0.42 + Math.random() * 0.1)], [W * (0.55 + Math.random() * 0.06), W * (0.46 + Math.random() * 0.1)]];
    [a, b].forEach((v, i) => {
      const d = ui.dob[i], k = d.firstChild;
      const [ex, ey] = doelen[i];
      const sx = W * (0.4 + i * 0.22), sy = vanBoven ? -maat * 1.6 : W + maat * 0.6;
      const mx = (sx + ex) / 2 + (i ? 30 : -30), my = (sy + ey) / 2;
      const pos = (x, y, sch) => `translate3d(${(x - maat / 2).toFixed(1)}px, ${(y - maat / 2).toFixed(1)}px, 0) scale(${sch})`;
      if (rustig() || !d.animate) {
        d.style.transform = pos(ex, ey, 1);
        k.style.transform = `rotateX(-24deg) rotateY(26deg) rotateX(${DRAAI[v][0]}deg) rotateY(${DRAAI[v][1]}deg)`;
        return;
      }
      d.animate([
        { transform: pos(sx, sy, 1.5), opacity: 0.2 },
        { transform: pos(mx, my, 1.25), opacity: 1, offset: 0.3 },
        { transform: pos(ex + (i ? 16 : -16), ey - 4, 1), offset: 0.55 },
        { transform: pos(ex + (i ? 6 : -6), ey - 14, 1.06), offset: 0.72 },
        { transform: pos(ex, ey, 1), offset: 0.88 },
        { transform: pos(ex, ey, 1) }
      ], { duration: duur, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'forwards' });
      const [rx, ry] = DRAAI[v];
      const extraX = 720 + 360 * Math.floor(Math.random() * 2), extraY = 360 + 360 * Math.floor(Math.random() * 2);
      k.animate([
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + extraX}deg) rotateY(${ry + extraY}deg) rotateZ(${(Math.random() * 180).toFixed(0)}deg)` },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + 60}deg) rotateY(${ry - 30}deg) rotateZ(10deg)`, offset: 0.6 },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(0deg)`, offset: 0.86 },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(0deg)` }
      ], { duration: duur, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'forwards' });
    });
    Geluid.dobbel();
    if (window.Tril) { setTimeout(() => Tril.tik(), duur * 0.55); setTimeout(() => Tril.tik(), duur * 0.8); }
    setTimeout(() => { if (Geluid.hout) Geluid.hout(0.25); }, duur * 0.55);
    return wacht(duur * 0.8);
  }
  function stenenWeg() {
    if (!ui.dobbels.classList.contains('zichtbaar')) return;
    const a = ui.dobbels.animate ? ui.dobbels.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }) : null;
    const klaar = () => { ui.dobbels.classList.remove('zichtbaar'); ui.dob.forEach((d) => { d.getAnimations && d.getAnimations().forEach((x) => x.cancel()); d.firstChild.getAnimations && d.firstChild.getAnimations().forEach((x) => x.cancel()); }); };
    if (a) a.onfinish = klaar; else klaar();
  }

  // ============================================================
  // PIONNEN
  // ============================================================
  function maakPion(p) {
    const g = el('g', { class: 'gb-pion', 'data-i': p.index }, pionSvg);
    const binnen = el('g', { class: 'gb-pion-binnen' }, g);
    el('ellipse', { cx: 2, cy: 2, rx: 13, ry: 4.6, fill: 'rgba(0,0,0,.32)', class: 'gb-pion-schaduw' }, binnen);
    el('path', { d: 'M-11 0 C-11 -4 -7 -6 -5 -8 L-3 -18 C-7 -20 -7 -27 0 -28 C7 -27 7 -20 3 -18 L5 -8 C7 -6 11 -4 11 0 Z', fill: p.kleur, stroke: INKT, 'stroke-width': 1.4 }, binnen);
    el('circle', { cx: 0, cy: -31, r: 7.5, fill: p.kleur, stroke: INKT, 'stroke-width': 1.4 }, binnen);
    el('ellipse', { cx: -2.5, cy: -33.5, rx: 2.6, ry: 1.8, fill: '#fff', opacity: 0.55 }, binnen);
    el('path', { d: 'M-8 -3 C-6 -5 -3 -6 -2 -9', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 2, fill: 'none' }, binnen);
    p.g = g;
    p.binnen = binnen;
    zetPion(p);
  }
  function plekVan(p, pos) {
    const v = pos === undefined ? p.pos : pos;
    if (v === 0) { const [x, y] = midden[0]; const o = STARTPLEK[p.index]; return [x + o[0], y + o[1]]; }
    const [x, y] = midden[v];
    return [x, y + 10];
  }
  function zetPion(p) {
    const [x, y] = plekVan(p);
    p.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    // de pion die het laagst staat wordt het laatst getekend (komt voor de andere)
    Array.from(pionSvg.querySelectorAll('.gb-pion')).sort((g1, g2) => plekY(g1) - plekY(g2)).forEach((g) => pionSvg.appendChild(g));
    if (tellerEl) pionSvg.appendChild(tellerEl);
  }
  const plekY = (g) => { const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform') || ''); return m ? +m[2] : 0; };
  async function hop(p, van, naar, hoogte, duur) {
    const [x0, y0] = plekVan(p, van), [x1, y1] = plekVan(p, naar);
    p.pos = naar;
    zetPion(p);
    if (rustig() || !p.binnen.animate) return;
    const dx = x0 - x1, dy = y0 - y1;
    await p.binnen.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(1, 1)` },
      { transform: `translate(${dx / 2}px, ${dy / 2 - hoogte}px) scale(.95, 1.06)`, offset: 0.5 },
      { transform: 'translate(0px, 0px) scale(1.1, .9)', offset: 0.85 },
      { transform: 'translate(0px, 0px) scale(1, 1)' }
    ], { duration: duur, easing: 'ease-out' }).finished.catch(() => {});
  }
  // stapje voor stapje, met een tellertje boven de pion
  async function loop(p, aantal, richting) {
    for (let k = aantal; k > 0; k--) {
      if (p.pos + richting > 63) richting = -1;
      const van = p.pos;
      teller(p, k - 1);
      Geluid.stap();
      if (window.Tril && k === 1) Tril.tik();
      await hop(p, van, van + richting, 22, 170);
    }
    teller(p, -1);
    return richting;
  }
  async function spring(p, naar) {
    const van = p.pos;
    Geluid.woesj();
    await hop(p, van, naar, 90, 620);
  }
  let tellerEl = null;
  function teller(p, n) {
    if (!tellerEl) { tellerEl = el('g', { class: 'gb-teller' }, pionSvg); el('circle', { r: 15 }, tellerEl); el('text', { y: 6, 'text-anchor': 'middle' }, tellerEl); }
    if (n <= 0) { tellerEl.style.display = 'none'; return; }
    const [x, y] = plekVan(p);
    tellerEl.style.display = '';
    tellerEl.setAttribute('transform', `translate(${x} ${y - 62})`);
    tellerEl.lastChild.textContent = n;
    pionSvg.appendChild(tellerEl);
  }

  // ============================================================
  // SPELERSKAARTEN EN KAARTJES
  // ============================================================
  function maakChips() {
    const g = gezichten();
    ui.spelers.innerHTML = '';
    spelers.forEach((p) => {
      const chip = document.createElement('div');
      chip.className = 'gb-chip';
      chip.setAttribute('role', 'listitem');
      chip.style.setProperty('--pion', p.kleur);
      chip.innerHTML = `<span class="gb-chip-gezicht">${p.persoon && g[p.persoon] ? g[p.persoon] : pionSvgHtml(p.kleur)}</span><b class="gb-chip-vak"></b><i class="gb-chip-status" hidden></i><span class="mo-ballon" hidden></span>`;
      p.chip = chip;
      ui.spelers.appendChild(chip);
    });
  }
  function werkSpelersBij() {
    spelers.forEach((p, i) => {
      const chip = p.chip;
      if (!chip) return;
      chip.classList.toggle('aan', i === aan && fase !== 'klaar');
      chip.querySelector('.gb-chip-vak').textContent = p.pos === 0 ? '·' : p.pos;
      const st = chip.querySelector('.gb-chip-status');
      const welk = p.vast ? (p.pos === 31 ? 'put' : 'tralies') : p.overslaan ? 'kroes' : '';
      st.hidden = !welk;
      if (welk && st.getAttribute('data-welk') !== welk) { st.innerHTML = icoon(welk); st.setAttribute('data-welk', welk); }
      chip.setAttribute('aria-label', `${p.naam}, ${p.pos === 0 ? 'nog bij het begin' : 'op veld ' + p.pos}${i === aan ? ', aan de beurt' : ''}`);
    });
    // onderin: wie nu mag gooien (een mens), anders jij
    const p = spelers[aan];
    const ik = p && p.mens ? p : spelers.find((q) => q.mens) || spelers[0];
    ui.zelf.querySelector('.gb-zelf-pion').innerHTML = pionSvgHtml(ik.kleur);
    ui.zelf.querySelector('.mo-naam').textContent = ik.naam;
    let doe = '';
    if (fase === 'gooien' && p.mens) doe = `${icoon('dobbel')}<span>Gooi de stenen!</span>`;
    else if (fase !== 'klaar' && p && !p.mens) doe = `<span class="mo-denk" aria-label="${p.naam} is aan de beurt"><i></i><i></i><i></i></span>`;
    else if (ik.vast) doe = `<span>Wacht op hulp</span>`;
    ui.zelf.querySelector('.mo-doe').innerHTML = doe;
    ui.zelf.classList.toggle('aan', fase === 'gooien' && p.mens);
    ui.beker.disabled = !(fase === 'gooien' && p && p.mens);
    ui.beker.classList.toggle('klaar', fase === 'gooien' && p && p.mens);
  }
  function zeg(p, soort) {
    if (!p || !p.persoon || !p.chip) return;
    const lijst = (EIGEN[p.persoon] && EIGEN[p.persoon][soort]) || ZEGT[soort];
    if (!lijst) return;
    const b = p.chip.querySelector('.mo-ballon');
    b.textContent = willekeurig(lijst);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(p.zegTimer);
    p.zegTimer = setTimeout(() => { b.hidden = true; }, 2200);
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }

  const KAARTJES = {
    gans: ['Gans!', (w, r) => `Nog ${w} ${r > 0 ? 'vooruit' : 'terug'}`],
    brug: ['De brug', () => 'Over naar 12'],
    herberg: ['De herberg', () => 'Een beurt rusten'],
    put: ['De put', () => 'Wacht op hulp'],
    doolhof: ['Het doolhof', () => 'Terug naar 39'],
    gevangenis: ['De gevangenis', () => 'Wacht op hulp'],
    dood: ['De dood', () => 'Terug naar het begin'],
    worp26: ['Eerste worp!', () => '6 en 3: naar 26'],
    worp53: ['Eerste worp!', () => '5 en 4: naar 53'],
    doel: ['De ganzenhof!', () => 'Gewonnen'],
    terug: ['Te ver!', () => 'Tel terug']
  };
  async function kaartje(soort, p, w, richting) {
    const [titel, sub] = KAARTJES[soort];
    const k = ui.kaartje;
    const beeld = k.querySelector('.gb-kaartje-beeld');
    beeld.innerHTML = '';
    const s2 = el('svg', { viewBox: '-30 -32 60 60', 'aria-hidden': 'true' });
    if (soort === 'worp26' || soort === 'worp53') {
      const [x1, x2] = soort === 'worp26' ? [6, 3] : [5, 4];
      [[x1, -26], [x2, 2]].forEach(([v, x]) => {
        el('rect', { x, y: -12, width: 24, height: 24, rx: 4, fill: '#FBF8F0', stroke: INKT, 'stroke-width': 1.4 }, s2);
        PIPS[v].forEach((pp) => el('circle', { cx: x + 6 + (pp % 3) * 6, cy: -6 + Math.floor(pp / 3) * 6, r: 2, fill: INKT }, s2));
      });
    } else if (soort === 'terug') {
      el('path', { d: 'M14 -8 H-8 M-2 -16 L-10 -8 L-2 0', fill: 'none', stroke: INKT, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s2);
      el('path', { d: 'M-14 10 H14', stroke: INKT, 'stroke-width': 2, 'stroke-dasharray': '3 4' }, s2);
    } else {
      figuur(soort, s2, 0, soort === 'doel' ? 4 : 0, soort === 'doel' ? 1.05 : 1.3);
    }
    beeld.appendChild(s2);
    k.querySelector('.gb-kaartje-titel').textContent = titel;
    k.querySelector('.gb-kaartje-sub').textContent = sub(w, richting);
    k.className = 'gb-kaartje ' + soort;
    k.hidden = false;
    k.classList.remove('in'); void k.offsetWidth; k.classList.add('in');
    meld(`${p.naam}: ${titel} ${sub(w, richting)}.`);
    const geluiden = { gans: 'gak', brug: 'hout', herberg: 'kling', put: 'plons', doolhof: 'woesj', gevangenis: 'tralies', dood: 'jammer', doel: 'tada', worp26: 'tada', worp53: 'tada', terug: 'pak' };
    const gl = geluiden[soort];
    if (gl && Geluid[gl]) Geluid[gl](); else if (gl === 'gak' && Geluid.koer) Geluid.koer();
    if (window.Tril) { if (soort === 'dood' || soort === 'put' || soort === 'gevangenis') Tril.fout(); else Tril.klik(); }
    zeg(p, soort === 'worp26' || soort === 'worp53' ? 'gans' : soort);
    await wacht(soort === 'gans' ? 850 : 1150);
    k.hidden = true;
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  function nieuwSpel() {
    spelId++;
    stenenWeg();
    const ids = ['jij'].concat(keuze).slice(0, 4);
    spelers = ids.map((id, i) => ({
      index: i, id, kleur: KLEUREN[i].kleur,
      naam: id === 'jij' ? 'Jij' : naamVan(id),
      persoon: window.Personen && Personen.ids.includes(id) ? id : null,
      mens: id === 'jij' || id.startsWith('vriend'),
      pos: 0, overslaan: 0, vast: false, eersteWorp: true
    }));
    pionSvg.textContent = '';
    tellerEl = null;
    spelers.forEach(maakPion);
    maakChips();
    aan = 0;
    fase = 'gooien';
    werkSpelersBij();
    const prater = spelers.filter((p) => p.persoon);
    if (prater.length) setTimeout(() => zeg(willekeurig(prater), 'start'), 400);
    beurt();
  }

  async function beurt() {
    const mijnId = spelId, p = spelers[aan];
    if (p.overslaan > 0) {
      p.overslaan--;
      fase = 'wacht'; werkSpelersBij();
      meld(`${p.naam} rust uit in de herberg.`);
      await wacht(900); if (mijnId !== spelId) return;
      return volgende();
    }
    if (p.vast) {
      if (spelers.every((q) => q.vast)) { spelers.forEach((q) => { q.vast = false; }); meld('Niemand kan meer helpen: iedereen is weer vrij.'); }
      else {
        fase = 'wacht'; werkSpelersBij();
        meld(`${p.naam} wacht op hulp.`);
        await wacht(800); if (mijnId !== spelId) return;
        return volgende();
      }
    }
    fase = 'gooien';
    werkSpelersBij();
    if (!p.mens) {
      await wacht(650); if (mijnId !== spelId) return;
      gooi(true);
    } else {
      meld(`${p.naam} is aan de beurt. Schud de beker.`);
    }
  }

  function volgende() {
    if (fase === 'klaar') return;
    aan = (aan + 1) % spelers.length;
    beurt();
  }

  // ---------- de beker ----------
  let schudt = false, rammel = 0, vasteWorp = null;
  function beginSchudden() {
    if (schudt || fase !== 'gooien' || !spelers[aan].mens) return;
    schudt = true;
    ui.beker.classList.add('schudt');
    Geluid.dobbel();
    if (window.Tril) Tril.tik();
    rammel = setInterval(() => { Geluid.dobbel(); if (window.Tril) Tril.tik(); }, 420);
  }
  function gooiMens() {
    if (!schudt) return;
    schudt = false;
    clearInterval(rammel);
    ui.beker.classList.remove('schudt');
    ui.beker.classList.remove('gooit'); void ui.beker.offsetWidth; ui.beker.classList.add('gooit');
    gooi(false);
  }

  async function gooi(vanBoven) {
    if (fase !== 'gooien') return;
    const mijnId = spelId, p = spelers[aan];
    fase = 'rollen';
    werkSpelersBij();
    let a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
    if (vasteWorp) { [a, b] = vasteWorp; vasteWorp = null; }
    await tuimel(a, b, vanBoven);
    if (mijnId !== spelId) return;
    meld(`${p.naam} gooit ${a} en ${b}.`);
    await speelWorp(p, a, b);
    if (mijnId !== spelId) return;
    stenenWeg();
    werkSpelersBij();
    if (p.pos === 63) return einde(p);
    await wacht(250); if (mijnId !== spelId) return;
    volgende();
  }

  async function speelWorp(p, a, b) {
    const mijnId = spelId, worp = a + b, begin = p.pos;
    if (p.eersteWorp && p.pos === 0 && a + b === 9) {
      p.eersteWorp = false;
      const naar = a === 3 || a === 6 ? 26 : 53;
      await kaartje(naar === 26 ? 'worp26' : 'worp53', p, worp, 1);
      if (mijnId !== spelId) return;
      await spring(p, naar);
    } else {
      p.eersteWorp = false;
      let richting = await loop(p, worp, 1);
      if (mijnId !== spelId) return;
      if (richting < 0) await kaartje('terug', p, worp, richting);
      // op een gans: nog eens hetzelfde aantal, ook achteruit als je terugtelt
      for (let keer = 0; keer < 10 && GANZEN.includes(p.pos); keer++) {
        await kaartje('gans', p, worp, richting);
        if (mijnId !== spelId) return;
        richting = await loop(p, worp, richting);
        if (mijnId !== spelId) return;
      }
      const v = p.pos;
      if (v === 6) { await kaartje('brug', p); await spring(p, 12); }
      else if (v === 42) { await kaartje('doolhof', p); await spring(p, 39); }
      else if (v === 58) { await kaartje('dood', p); await spring(p, 0); }
      else if (v === 19) { await kaartje('herberg', p); p.overslaan = 1; }
      else if (v === 31 || v === 52) { await kaartje(v === 31 ? 'put' : 'gevangenis', p); p.vast = true; }
    }
    if (mijnId !== spelId) return;
    // bezet? Dan moet de ander terug naar waar jij vandaan kwam
    if (p.pos !== 0 && p.pos !== 63) {
      const q = spelers.find((x) => x !== p && x.pos === p.pos);
      if (q) {
        const wasVast = q.vast;
        q.vast = false; q.overslaan = 0;
        await wacht(200);
        Geluid.pak();
        if (window.Tril) Tril.klik();
        await spring(q, begin);
        zeg(q, wasVast ? 'verlost' : 'gebotst');
        meld(`${q.naam} moet terug naar ${begin === 0 ? 'het begin' : 'veld ' + begin}${wasVast ? ' en is weer vrij' : ''}.`);
      }
    }
  }

  function einde(w) {
    fase = 'klaar';
    werkSpelersBij();
    w.binnen.classList.add('gewonnen');
    const kaart = kaartje('doel', w);
    vonken(40);
    if (window.Tril) Tril.succes();
    const mensen = spelers.filter((q) => q.mens).length, computers = spelers.length - mensen;
    spelers.forEach((q) => { if (q !== w && q.persoon) setTimeout(() => zeg(q, 'verliest'), 500); });
    let bedrag, tekst, gewonnen;
    if (w.mens && computers > 0) { bedrag = 25 + 10 * computers; tekst = w.id === 'jij' ? 'Jij wint het ganzenbord!' : `${w.naam} wint!`; gewonnen = true; }
    else if (!w.mens) { bedrag = 15; tekst = `${w.naam} wint. Goed gespeeld!`; gewonnen = false; zeg(w, 'wint'); }
    else { bedrag = 30; tekst = `${w.naam} wint!`; gewonnen = true; }
    meld(tekst);
    void kaart;
    if (window.Duiten) Duiten.beloon({ spel: 'ganzenbord', bedrag, gewonnen, tekst, wacht: 2400 });
  }

  function vonken(aantal) {
    if (rustig()) return;
    const rr = ui.bordvak.getBoundingClientRect();
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (rr.width * (0.2 + Math.random() * 0.6)) + 'px';
      v.style.top = (rr.height * (0.2 + Math.random() * 0.6)) + 'px';
      ui.vonken.appendChild(v);
      const an = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(20 + Math.random() * 40).toFixed(0)}px)) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 600, easing: 'ease-out', fill: 'both' });
      an.onfinish = () => v.remove();
    }
  }

  // ============================================================
  // KEUZEMENU: WIE SPELEN ER MEE?
  // ============================================================
  function openMenu() {
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.keuzes.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu() { if (ui.menu) ui.menu.hidden = true; }
  function werkSchakelaars() {
    const g = ui.menu.querySelector('.mo-geluid'), m = ui.menu.querySelector('.mo-muziek');
    g.setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    m.setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
  }
  function tekenMenu() {
    const g = gezichten();
    ui.keuzes.innerHTML = '';
    const opties = (window.Personen ? Personen.ids : []).concat(VRIENDEN.map((v) => v.id));
    opties.forEach((id, n) => {
      const mee = keuze.includes(id);
      const vol = !mee && keuze.length >= 3;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mo-keuze gb-keuze' + (mee ? ' nu' : '') + (vol ? ' vol' : '');
      b.setAttribute('aria-pressed', String(mee));
      const vriend = id.startsWith('vriend');
      const plaatje = vriend ? `<span class="gb-vriend">${pionSvgHtml(KLEUREN[(n % 3) + 1].kleur)}</span>` : g[id];
      b.innerHTML = `<span class="mo-gezicht">${plaatje}${mee ? `<i class="mo-medaille">${icoon('vink')}</i>` : ''}</span><span class="mo-keuze-naam">${naamVan(id)}</span>`;
      b.setAttribute('aria-label', `${naamVan(id)}${vriend ? ' (iemand naast je)' : ''}${mee ? ', speelt mee' : ''}`);
      b.addEventListener('click', () => {
        if (mee) { if (keuze.length > 1) keuze = keuze.filter((x) => x !== id); else { schud(b); return; } }
        else if (vol) { schud(b); return; }
        else keuze = keuze.concat([id]);
        Geluid.pak();
        tekenMenu();
        const nieuw = ui.keuzes.querySelectorAll('.mo-keuze')[n];
        if (nieuw) nieuw.focus({ preventScroll: true });
      });
      ui.keuzes.appendChild(b);
    });
  }
  function schud(b) {
    b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
    if (window.Tril) Tril.fout();
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function veldVak(i, ruimte) {
    const m = bordSvg.getScreenCTM();
    const [x, y] = midden[i];
    const h = ruimte * m.a;
    return { left: m.a * x + m.e - h, top: m.d * y + m.f - h, width: 2 * h, height: 2 * h };
  }
  if (window.Les) {
    Les.zet('ganzenbord', () => [
      { doel: () => ui.beker, vorm: 'rond', gebaar: 'tik', tekst: 'Houd de beker vast en laat los om te gooien' },
      { doel: () => veldVak(0, 60), gebaar: 'wijs', tekst: 'Je pion loopt vanzelf de spiraal in' },
      { doel: () => veldVak(5, 36), vorm: 'rond', gebaar: 'wijs', tekst: 'Op een gans mag je nog eens' },
      { doel: () => veldVak(58, 36), vorm: 'rond', gebaar: 'wijs', tekst: 'Pas op voor de dood' },
      { doel: () => veldVak(63, 72), vorm: 'rond', gebaar: 'wijs', tekst: 'Precies op 63? Dan win je!' },
      { doel: () => podium.querySelector('.gb-meer'), vorm: 'rond', gebaar: 'tik', tekst: 'Kies hier met wie je speelt' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.ganzenbord = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('gans-spelers', null) : null;
        if (Array.isArray(bewaard) && bewaard.length) keuze = bewaard.slice(0, 3);
        requestAnimationFrame(() => { pasMaatAan(); nieuwSpel(); });
      } else {
        kleurDobbels();
        pasMaatAan();
        // een onderbroken beurt gaat verder met de volgende speler
        if (fase === 'rollen' || fase === 'wacht') { stenenWeg(); spelers.forEach(zetPion); teller(spelers[aan], -1); volgende(); }
        else if (fase === 'gooien') { werkSpelersBij(); if (!spelers[aan].mens) beurt(); }
      }
      // het ganzenbord ziet er nu anders uit: laat Gijs het één keer opnieuw voordoen
      if (window.Duiten && !Duiten.veld('gans-les-2', false)) { Duiten.zetVeld('les-ganzenbord', false); Duiten.zetVeld('gans-les-2', true); }
      if (window.Les) Les.eersteKeer('ganzenbord');
    },
    stop() {
      spelId++;
      if (schudt) { schudt = false; clearInterval(rammel); ui.beker.classList.remove('schudt'); }
      sluitMenu();
      if (ui.kaartje) ui.kaartje.hidden = true;
    },
    opnieuw() { nieuwSpel(); },
    // de prent aan de muur van de voorkamer: hetzelfde bord, zonder papierkorrel
    maakPrent() { return tekenBord('p', true); },
    _toestand() { return { fase, aan, spelers: spelers.map((p) => ({ id: p.id, pos: p.pos, vast: p.vast, overslaan: p.overslaan, mens: p.mens })) }; },
    _test: {
      dobbel(a, b) { vasteWorp = [a, b]; },
      zet(i, pos, eerste) { const p = spelers[i]; p.pos = pos; p.eersteWorp = !!eerste; zetPion(p); werkSpelersBij(); }
    }
  };
})();
