/* Het Speelhuys: een grachtenpand met trapgevel en een 17e-eeuwse kamer (naar Vermeer en De Hooch)
   waarin de spellen aan de muur hangen. Klik op een spel en de kamer zoomt erin. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const pt = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const veelhoek = (punten, attrs, ouder) => el('polygon', Object.assign({ points: punten.map(pt).join(' ') }, attrs), ouder);
  const tekst = (t, attrs, ouder) => { const e = el('text', attrs, ouder); e.textContent = t; return e; };
  let zaad = 4242;
  const rnd = () => { zaad = (zaad * 16807) % 2147483647; return (zaad - 1) / 2147483646; };
  const bewegingRustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function verloop(defs, id, type, attrs, stops) {
    const g = el(type, Object.assign({ id }, attrs), defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a === undefined ? 1 : a }, g));
    return g;
  }
  function vervaag(defs, id, sd) {
    const f = el('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feGaussianBlur', { stdDeviation: sd }, f);
  }
  function omhulsel(punten) {
    const p = punten.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const kruis = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const onder = [], boven = [];
    for (const q of p) { while (onder.length >= 2 && kruis(onder[onder.length - 2], onder[onder.length - 1], q) <= 0) onder.pop(); onder.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (boven.length >= 2 && kruis(boven[boven.length - 2], boven[boven.length - 1], q) <= 0) boven.pop(); boven.push(q); }
    onder.pop(); boven.pop();
    return onder.concat(boven);
  }

  // Texturen één keer tekenen op een canvas: veel lichter dan SVG-filters die bij elke animatieframe opnieuw rekenen.
  const texturen = {};
  function textuur(naam, b, h, teken) {
    if (texturen[naam]) return texturen[naam];
    let url = '';
    try {
      const c = document.createElement('canvas'); c.width = b; c.height = h;
      const g = c.getContext('2d');
      teken(g, b, h);
      url = c.toDataURL('image/png');
    } catch (e) { url = ''; }
    texturen[naam] = url;
    return url;
  }
  function korrel(kleur, sterkte) {
    return (g, b, h) => {
      const img = g.createImageData(b, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random();
        img.data[i] = kleur[0]; img.data[i + 1] = kleur[1]; img.data[i + 2] = kleur[2];
        img.data[i + 3] = Math.floor(v * v * 255 * sterkte);
      }
      g.putImageData(img, 0, 0);
      for (let i = 0; i < 18; i++) {
        const x = Math.random() * b, y = Math.random() * h, r = 10 + Math.random() * 40;
        const rg = g.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, `rgba(${kleur[0]},${kleur[1]},${kleur[2]},${0.03 + Math.random() * 0.04})`);
        rg.addColorStop(1, `rgba(${kleur[0]},${kleur[1]},${kleur[2]},0)`);
        g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
    };
  }
  function patroonUitTextuur(defs, id, url, b, h) {
    const p = el('pattern', { id, width: b, height: h, patternUnits: 'userSpaceOnUse' }, defs);
    if (url) el('image', { href: url, width: b, height: h }, p);
    return p;
  }
  function marmer(g, b, h) {
    g.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x = Math.random() * b, y = Math.random() * h;
      g.strokeStyle = `rgba(90, 84, 76, ${0.06 + Math.random() * 0.16})`;
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x + 60 + Math.random() * 80, y - 30 + Math.random() * 60, x + 120 + Math.random() * 120, y - 40 + Math.random() * 80, x + 200 + Math.random() * 200, y - 30 + Math.random() * 60);
      g.stroke();
    }
  }

  // ============================================================
  // DE KAMER (viewBox 1600 x 1000, één-puntsperspectief)
  // ============================================================
  const F = 1000, VX = 800, VY = 445, HW = 520, HH = 330, ZB = 1000, ZV = 560;
  const P = (X, Y, Z) => [VX + F * X / Z, VY + F * Y / Z];
  const BLAUW = '#1C3473';

  function bouwKamer() {
    zaad = 4242;
    const svg = el('svg', { viewBox: '0 0 1600 1000', class: 'kamer-svg', preserveAspectRatio: 'xMidYMid slice', role: 'group', 'aria-label': 'De kamer van Het Speelhuys. Aan de muur hangen de spellen.' });
    const defs = el('defs', {}, svg);
    verloop(defs, 'h-muur', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0.3 }, [[0, '#F3EBD9'], [0.4, '#E8DDC5'], [1, '#CDBD9C']]);
    verloop(defs, 'h-muur-l', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#7E6E52'], [1, '#B4A383']]);
    verloop(defs, 'h-muur-r', 'linearGradient', { x1: 1, y1: 0, x2: 0, y2: 0 }, [[0, '#C7B794'], [1, '#E4D7BA']]);
    verloop(defs, 'h-plafond', 'linearGradient', { x1: 0, y1: 1, x2: 0, y2: 0 }, [[0, '#5C4531'], [1, '#2A1E14']]);
    verloop(defs, 'h-glas', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#FFFEF6'], [0.55, '#F1F3EC'], [1, '#D2DEDF']]);
    verloop(defs, 'h-messing', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F6DC97'], [0.45, '#C9973F'], [1, '#71501E']]);
    verloop(defs, 'h-goud', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F3D88F'], [0.5, '#B4832E'], [1, '#6A4716']]);
    verloop(defs, 'h-eik', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#C4955E'], [1, '#7A532E']]);
    verloop(defs, 'h-beuk', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#E2BE88'], [0.5, '#D7AF75'], [1, '#C39558']]);
    verloop(defs, 'h-licht', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0.7 }, [[0, '#FFF6DA', 0.6], [0.7, '#FFF6DA', 0.12], [1, '#FFF6DA', 0]]);
    verloop(defs, 'h-vloerglans', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#24170C', 0.4], [1, '#24170C', 0]]);
    verloop(defs, 'h-vignet', 'radialGradient', { cx: '50%', cy: '46%', r: '75%' }, [[0.55, '#000', 0], [1, '#0B0703', 0.6]]);
    verloop(defs, 'h-vlam', 'radialGradient', { cx: '50%', cy: '65%', r: '60%' }, [[0, '#FFFBE0'], [0.45, '#FFCB55'], [1, '#FF8A1E', 0]]);
    verloop(defs, 'h-gloed', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFD27A', 0.55], [1, '#FFD27A', 0]]);
    verloop(defs, 'h-gang', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#FBE6B2'], [1, '#C48F50']]);
    verloop(defs, 'h-papier', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F2E6C8'], [1, '#D9C59A']]);
    verloop(defs, 'h-knikker-b', 'radialGradient', { cx: '35%', cy: '30%', r: '70%' }, [[0, '#E6F0FF'], [0.4, '#4C79C9'], [1, '#1B3170']]);
    verloop(defs, 'h-knikker-g', 'radialGradient', { cx: '35%', cy: '30%', r: '70%' }, [[0, '#EAFBE6'], [0.4, '#4F9A54'], [1, '#1E4D22']]);
    verloop(defs, 'h-knikker-o', 'radialGradient', { cx: '35%', cy: '30%', r: '70%' }, [[0, '#FFF4DC'], [0.4, '#D9963A'], [1, '#7A4510']]);
    verloop(defs, 'h-kat', 'radialGradient', { cx: '40%', cy: '35%', r: '70%' }, [[0, '#E9A45E'], [1, '#A9612A']]);

    patroonUitTextuur(defs, 'h-pleister', textuur('pleister', 256, 256, korrel([120, 96, 60], 0.1)), 256, 256);
    const marmerUrl = textuur('marmer', 640, 320, marmer);
    verloop(defs, 'h-vlek', 'radialGradient', { cx: '42%', cy: '55%', r: '60%' }, [[0, '#FFF3D2', 0.75], [0.6, '#FFF3D2', 0.3], [1, '#FFF3D2', 0]]);
    verloop(defs, 'h-vlek-warm', 'radialGradient', { cx: '50%', cy: '50%', r: '55%' }, [[0, '#FFDFA0', 0.6], [1, '#FFDFA0', 0]]);
    verloop(defs, 'h-schaduwvlek', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#1A0F06', 0.45], [1, '#1A0F06', 0]]);
    vervaag(defs, 'h-waas', 16);
    vervaag(defs, 'h-schaduw', 6);
    vervaag(defs, 'h-zacht', 2.5);

    const tp = el('pattern', { id: 'h-tapijt', width: 44, height: 44, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 44, height: 44, fill: '#7B2620' }, tp);
    el('path', { d: 'M22 3 L41 22 L22 41 L3 22 Z', fill: '#2B3C68' }, tp);
    el('path', { d: 'M22 12 L32 22 L22 32 L12 22 Z', fill: '#C99A3E' }, tp);
    el('circle', { cx: 22, cy: 22, r: 3, fill: '#7B2620' }, tp);
    el('path', { d: 'M0 0 L6 0 L0 6 Z M44 0 L38 0 L44 6 Z M0 44 L6 44 L0 38 Z M44 44 L38 44 L44 38 Z', fill: '#E0C27A' }, tp);
    const tp2 = el('pattern', { id: 'h-tapijt-plat', width: 44, height: 44, patternUnits: 'userSpaceOnUse', patternTransform: 'scale(1 .42)' }, defs);
    // inhoud hergebruiken: kopie van het patroon, platgedrukt voor het tafelblad
    Array.from(tp.childNodes).forEach((n) => tp2.appendChild(n.cloneNode(true)));

    const vloerClip = el('clipPath', { id: 'h-vloerclip' }, defs);
    const vloer = [P(-HW, HH, ZB), P(HW, HH, ZB), P(HW, HH, ZV), P(-HW, HH, ZV)];
    veelhoek(vloer, {}, vloerClip);

    // ---------- Plafond met balken ----------
    const plafond = el('g', {}, svg);
    veelhoek([P(-HW, -HH, ZB), P(HW, -HH, ZB), P(HW, -HH, ZV), P(-HW, -HH, ZV)], { fill: 'url(#h-plafond)' }, plafond);
    for (let X = -HW + 26; X < HW; X += 52) {
      const a = P(X, -HH, ZB), b = P(X, -HH, ZV);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1A120B', 'stroke-opacity': 0.45, 'stroke-width': 1.2 }, plafond);
    }
    [-390, -130, 130, 390].forEach((X) => {
      const b = 22, h = 30, zx = X < 0 ? X + b : X - b;
      veelhoek([P(zx, -HH, ZB), P(zx, -HH + h, ZB), P(zx, -HH + h, ZV), P(zx, -HH, ZV)], { fill: '#1C130C' }, plafond);
      veelhoek([P(X - b, -HH + h, ZB), P(X + b, -HH + h, ZB), P(X + b, -HH + h, ZV), P(X - b, -HH + h, ZV)], { fill: '#3D2C1E' }, plafond);
    });

    // ---------- Achterwand ----------
    const muur = el('g', {}, svg);
    const achter = [P(-HW, -HH, ZB), P(HW, -HH, ZB), P(HW, HH, ZB), P(-HW, HH, ZB)];
    veelhoek(achter, { fill: 'url(#h-muur)' }, muur);
    veelhoek(achter, { fill: 'url(#h-pleister)' }, muur);
    // moerbalk langs de wand
    veelhoek([P(-HW - 14, -HH, ZB - 26), P(HW + 14, -HH, ZB - 26), P(HW + 14, -HH + 30, ZB - 26), P(-HW - 14, -HH + 30, ZB - 26)], { fill: '#3A2A1C' }, muur);
    veelhoek([P(-HW, -HH + 30, ZB), P(HW, -HH + 30, ZB), P(HW + 14, -HH + 30, ZB - 26), P(-HW - 14, -HH + 30, ZB - 26)], { fill: '#24180F' }, muur);
    // zonlicht op de wand
    const wandVlek = [P(-380, -112, ZB), P(100, 224, ZB), P(100, HH, ZB), P(-263, HH, ZB), P(-380, 248, ZB)];
    veelhoek(wandVlek, { fill: 'url(#h-vlek)', class: 'zonvlek' }, muur);

    // ---------- Linkerwand met glas-in-loodraam ----------
    const links = el('g', {}, svg);
    veelhoek([P(-HW, -HH, ZB), P(-HW, -HH, ZV), P(-HW, HH, ZV), P(-HW, HH, ZB)], { fill: 'url(#h-muur-l)' }, links);
    const W = (Z, Y) => P(-HW, Y, Z);
    veelhoek([W(668, -232), W(952, -232), W(952, 172), W(668, 172)], { fill: '#3A291C' }, links);
    const glas = [W(690, -210), W(930, -210), W(930, 150), W(690, 150)];
    const raamClip = el('clipPath', { id: 'h-raamclip' }, defs);
    veelhoek(glas, {}, raamClip);
    veelhoek(glas, { fill: 'url(#h-glas)' }, links);
    const lood = el('g', { 'clip-path': 'url(#h-raamclip)', stroke: '#55534C', 'stroke-width': 1.3, 'stroke-opacity': 0.75 }, links);
    for (let c = -700; c <= 700; c += 30) {
      [1.3, -1.3].forEach((r) => {
        const a = W(600, c + (600 - 810) * r), b = W(1000, c + (1000 - 810) * r);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, lood);
      });
    }
    veelhoek([W(804, -210), W(816, -210), W(816, 150), W(804, 150)], { fill: '#3A291C' }, links);
    veelhoek([W(690, -66), W(930, -66), W(930, -54), W(690, -54)], { fill: '#3A291C' }, links);
    veelhoek([W(668, 150), W(952, 150), P(-HW + 34, 150, 952), P(-HW + 34, 150, 668)], { fill: '#E4D8C0' }, links);

    // ---------- Rechterwand met deur naar de gang ----------
    const rechts = el('g', {}, svg);
    veelhoek([P(HW, -HH, ZB), P(HW, -HH, ZV), P(HW, HH, ZV), P(HW, HH, ZB)], { fill: 'url(#h-muur-r)' }, rechts);
    const D = (Z, Y) => P(HW, Y, Z);
    veelhoek([D(694, -64), D(912, -64), D(912, HH), D(694, HH)], { fill: '#2C1E14' }, rechts);
    veelhoek([D(708, -50), D(898, -50), D(898, HH), D(708, HH)], { fill: 'url(#h-gang)', class: 'gangLicht' }, rechts);
    const blad = el('g', {}, rechts);
    veelhoek([D(742, -50), D(898, -50), D(898, HH), D(742, HH)], { fill: '#4A3121' }, blad);
    veelhoek([D(758, -30), D(882, -30), D(882, 120), D(758, 120)], { fill: 'none', stroke: '#2B1B10', 'stroke-width': 3 }, blad);
    veelhoek([D(758, 150), D(882, 150), D(882, 305), D(758, 305)], { fill: 'none', stroke: '#2B1B10', 'stroke-width': 3 }, blad);
    const knop = D(768, 135);
    el('circle', { cx: knop[0], cy: knop[1], r: 5, fill: 'url(#h-messing)' }, blad);

    // ---------- Tegelplint ----------
    const plint = el('g', {}, svg);
    const motieven = ['ill-gans', 'ill-tol', 'ill-hoepel', 'ill-knikkers', 'ill-kolf', 'ill-uil', 'ill-koek', 'ill-kaarten', 'ill-sjoelbak', 'ill-molen'];
    const [px0, py0] = P(-HW, HH - 65, ZB);
    for (let i = 0; i < 16; i++) {
      const x = px0 + i * 65, y = py0;
      el('rect', { x, y, width: 65, height: 65, fill: '#F4F1E8', stroke: '#B7B09E', 'stroke-width': 1 }, plint);
      el('use', { href: '#hoeken', x, y, width: 65, height: 65, style: 'color:' + BLAUW, opacity: 0.85 }, plint);
      el('use', { href: '#' + motieven[i % motieven.length], x: x + 13, y: y + 11, width: 39, height: 39, style: 'color:' + BLAUW, stroke: BLAUW, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, plint);
    }
    for (let Z = ZB; Z > ZV; Z -= 65) {
      veelhoek([P(-HW, HH - 65, Z), P(-HW, HH - 65, Z - 65), P(-HW, HH, Z - 65), P(-HW, HH, Z)], { fill: '#D9D3C3', stroke: '#9D9684', 'stroke-width': 1 }, plint);
      const m = P(-HW, HH - 32, Z - 32);
      el('circle', { cx: m[0], cy: m[1], r: 4 * 1000 / Z, fill: 'none', stroke: BLAUW, 'stroke-width': 1.5, opacity: 0.7 }, plint);
      if (Z - 65 >= 912 || Z <= 694) {
        veelhoek([P(HW, HH - 65, Z), P(HW, HH - 65, Z - 65), P(HW, HH, Z - 65), P(HW, HH, Z)], { fill: '#EAE5D7', stroke: '#B0A996', 'stroke-width': 1 }, plint);
      }
    }
    el('line', { x1: px0, y1: P(0, HH, ZB)[1], x2: px0 + 1040, y2: P(0, HH, ZB)[1], stroke: '#2B1E14', 'stroke-width': 4 }, plint);

    // ---------- Marmeren vloer ----------
    const vl = el('g', { 'clip-path': 'url(#h-vloerclip)' }, svg);
    veelhoek(vloer, { fill: '#E6E0D2' }, vl);
    const s = 95;
    for (let i = -8; i <= 8; i++) {
      for (let j = -1; j <= 6; j++) {
        if (((i + j) % 2 + 2) % 2 !== 0 || Math.abs(i) % 2 !== 1) continue;
        const X = i * s, Z = ZB - j * s;
        if (Z - s <= 0) continue;
        veelhoek([P(X, HH, Z + s), P(X + s, HH, Z), P(X, HH, Z - s), P(X - s, HH, Z)], { fill: '#24201D' }, vl);
      }
    }
    if (marmerUrl) el('image', { href: marmerUrl, x: -200, y: 770, width: 2000, height: 300, preserveAspectRatio: 'none', opacity: 0.8 }, vl);
    veelhoek(vloer, { fill: 'url(#h-vloerglans)' }, vl);
    const vloerVlek = [P(-263, HH, 818), P(-263, HH, ZB), P(100, HH, ZB)];
    veelhoek(vloerVlek, { fill: 'url(#h-vlek)', class: 'zonvlek' }, vl);
    veelhoek([P(HW, HH, 708), P(HW, HH, 742), P(380, HH, 690), P(330, HH, 610)], { fill: 'url(#h-vlek-warm)' }, vl);

    // ---------- Aan de muur ----------
    const wand = el('g', { class: 'wand' }, svg);
    bouwGanzenbord(wand);
    bouwMolenspel(wand);
    bouwSjoelbak(wand);
    bouwPrent(wand, { x: 300, y: 180, b: 120, h: 140, naam: 'Uilenspel', ill: 'ill-uil', gordijn: '#3F5B3B' });
    bouwPrent(wand, { x: 1112, y: 176, b: 128, h: 144, naam: 'Kop van Jut', ill: 'ill-jut', gordijn: '#7A2E28' });
    bouwHoepel(wand);
    bouwPlank(wand);

    // ---------- Lichtbundel en stofjes ----------
    const bundel = omhulsel(glas.concat(wandVlek, vloerVlek));
    veelhoek(bundel, { fill: 'url(#h-licht)', opacity: 0.5, class: 'lichtbundel' }, svg);
    const stof = el('g', { class: 'stof' }, svg);
    const van = [140, 400], naar = [680, 640];
    for (let i = 0; i < 46; i++) {
      const t = rnd();
      const x = van[0] + (naar[0] - van[0]) * t + (rnd() - 0.5) * 260 * (0.3 + t);
      const y = van[1] + (naar[1] - van[1]) * t + (rnd() - 0.5) * 260 * (0.3 + t);
      el('circle', {
        cx: x.toFixed(1), cy: y.toFixed(1), r: (0.8 + rnd() * 1.8).toFixed(2), fill: '#FFF8E6', class: 'stofje',
        style: `--dx:${((rnd() - 0.5) * 40).toFixed(1)}px;--dy:${((rnd() - 0.6) * 46).toFixed(1)}px;animation-duration:${(6 + rnd() * 9).toFixed(1)}s;animation-delay:-${(rnd() * 12).toFixed(1)}s`
      }, stof);
    }

    // ---------- Voorgrond ----------
    bouwKolf(svg);
    bouwTafel(svg);
    bouwKnikkers(svg);
    bouwKat(svg);
    bouwKoek(svg);
    bouwKroon(svg);
    el('rect', { width: 1600, height: 1000, fill: 'url(#h-vignet)', 'pointer-events': 'none' }, svg);
    return svg;
  }

  // Een voorwerp is een link (speelbaar) of een groep (binnenkort); de binnenste groep beweegt bij hover.
  function voorwerp(ouder, opties) {
    let buiten;
    if (opties.spel) {
      buiten = el('a', { href: '#' + opties.spel, class: 'voorwerp speelbaar', 'data-spel': opties.spel, 'data-label': opties.label, 'aria-label': opties.label }, ouder);
    } else {
      buiten = el('g', { class: 'voorwerp binnenkort', tabindex: 0, role: 'button', 'data-label': opties.label, 'aria-label': opties.label }, ouder);
    }
    const binnen = el('g', { class: 'vw' }, buiten);
    return binnen;
  }
  function schaduw(ouder, x, y, b, h, extra) {
    el('rect', Object.assign({ x: x + 9, y: y + 12, width: b, height: h, fill: '#2A1A0C', opacity: 0.38, filter: 'url(#h-schaduw)' }, extra || {}), ouder);
  }
  function spijker(ouder, x, y, koord) {
    if (koord) koord.forEach(([kx, ky]) => el('line', { x1: x, y1: y, x2: kx, y2: ky, stroke: '#5A4632', 'stroke-width': 1.6 }, ouder));
    el('circle', { cx: x, cy: y, r: 3.4, fill: '#2E241A' }, ouder);
    el('circle', { cx: x - 1, cy: y - 1, r: 1.2, fill: '#8A7A66' }, ouder);
  }
  function naambordje(ouder, cx, y, naam) {
    const b = Math.max(92, naam.length * 9 + 26);
    el('rect', { x: cx - b / 2 + 2, y: y + 3, width: b, height: 23, rx: 2, fill: '#2A1A0C', opacity: 0.3, filter: 'url(#h-zacht)' }, ouder);
    el('rect', { x: cx - b / 2, y, width: b, height: 23, rx: 2, fill: 'url(#h-messing)', stroke: '#5C3D12', 'stroke-width': 0.8 }, ouder);
    el('circle', { cx: cx - b / 2 + 6, cy: y + 11.5, r: 1.6, fill: '#5C3D12' }, ouder);
    el('circle', { cx: cx + b / 2 - 6, cy: y + 11.5, r: 1.6, fill: '#5C3D12' }, ouder);
    tekst(naam, { x: cx, y: y + 16.5, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 14.5, fill: '#2A1A08' }, ouder);
  }

  function bouwGanzenbord(wand) {
    const g = voorwerp(wand, { spel: 'ganzenbord', label: 'Speel ganzenbord' });
    spijker(g, 800, 208, [[682, 252], [918, 252]]);
    schaduw(g, 660, 244, 280, 280);
    el('rect', { x: 660, y: 244, width: 280, height: 280, fill: '#1A130F' }, g);
    el('rect', { x: 664, y: 248, width: 272, height: 272, fill: 'none', stroke: '#3A2C22', 'stroke-width': 2 }, g);
    el('rect', { x: 670, y: 254, width: 260, height: 260, fill: 'url(#h-goud)' }, g);
    el('rect', { x: 675, y: 259, width: 250, height: 250, fill: '#EFE3C3' }, g);
    if (window.Spellen && window.Spellen.ganzenbord && window.Spellen.ganzenbord.maakPrent) {
      const prent = window.Spellen.ganzenbord.maakPrent();
      prent.setAttribute('x', 675); prent.setAttribute('y', 259); prent.setAttribute('width', 250); prent.setAttribute('height', 250);
      g.appendChild(prent);
    }
    veelhoek([[675, 259], [760, 259], [675, 380]], { fill: '#FFFFFF', opacity: 0.1 }, g);
    naambordje(g, 800, 538, 'Ganzenbord');
  }

  function bouwMolenspel(wand) {
    const g = voorwerp(wand, { spel: 'molenspel', label: 'Speel molenspel' });
    const x = 470, y = 334, b = 160;
    spijker(g, 550, 292, [[480, 338], [620, 338]]);
    schaduw(g, x, y, b, b, { rx: 8 });
    el('rect', { x, y, width: b, height: b, rx: 8, fill: 'url(#h-eik)' }, g);
    for (let i = 0; i < 9; i++) {
      const yy = y + 8 + i * 18 + rnd() * 6;
      el('path', { d: `M${x + 4} ${yy} q ${b / 3} ${rnd() * 6 - 3} ${b / 1.5} ${rnd() * 4 - 2} t ${b / 3 - 8} ${rnd() * 4 - 2}`, fill: 'none', stroke: '#5E3E1E', 'stroke-opacity': 0.25, 'stroke-width': 1 }, g);
    }
    const lijn = { fill: 'none', stroke: '#2E1E10', 'stroke-width': 2.6 };
    [16, 42, 66].forEach((m) => el('rect', Object.assign({ x: x + m, y: y + m, width: b - 2 * m, height: b - 2 * m }, lijn), g));
    const c = x + b / 2;
    el('path', Object.assign({ d: `M${c} ${y + 16} V${y + 66} M${c} ${y + b - 66} V${y + b - 16} M${x + 16} ${y + b / 2} H${x + 66} M${x + b - 66} ${y + b / 2} H${x + b - 16}` }, lijn), g);
    const stenen = [[16, 16, 'w'], [80, 16, 'z'], [144, 16, 'w'], [42, 80, 'z'], [118, 42, 'w'], [66, 94, 'w'], [144, 144, 'z'], [94, 118, 'z']];
    stenen.forEach(([sx, sy, k]) => {
      el('circle', { cx: x + sx + 1.5, cy: y + sy + 2.5, r: 8, fill: '#000', opacity: 0.3 }, g);
      el('circle', { cx: x + sx, cy: y + sy, r: 8, fill: k === 'w' ? '#EFE6D2' : '#2A2320', stroke: k === 'w' ? '#8D8167' : '#000', 'stroke-width': 1 }, g);
      el('circle', { cx: x + sx - 2.5, cy: y + sy - 2.5, r: 2.2, fill: '#fff', opacity: k === 'w' ? 0.7 : 0.18 }, g);
    });
    naambordje(g, 550, 508, 'Molenspel');
  }

  function bouwSjoelbak(wand) {
    const g = voorwerp(wand, { spel: 'sjoelen', label: 'Speel sjoelen' });
    const x = 985, y = 192, b = 80, h = 410;
    schaduw(g, x, y, b, h, { rx: 4 });
    el('rect', { x, y, width: b, height: h, rx: 4, fill: '#5A361B' }, g);
    el('rect', { x: x + 7, y: y + 7, width: b - 14, height: h - 14, fill: 'url(#h-beuk)' }, g);
    for (let i = 0; i < 8; i++) {
      const xx = x + 10 + rnd() * (b - 20);
      el('path', { d: `M${xx} ${y + 8} q ${rnd() * 6 - 3} ${h / 2} ${rnd() * 4 - 2} ${h - 16}`, fill: 'none', stroke: '#8A5B2A', 'stroke-opacity': 0.18 }, g);
    }
    el('rect', { x: x + 7, y: y + 7, width: b - 14, height: 64, fill: '#5A361B', opacity: 0.12 }, g);
    for (let k = 1; k < 4; k++) el('rect', { x: x + 7 + k * 16.5 - 1, y: y + 7, width: 2, height: 64, fill: '#4A2C14' }, g);
    ['2', '3', '4', '1'].forEach((n, k) => tekst(n, { x: x + 15.25 + k * 16.5, y: y + 30, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 12, fill: '#FFF2D6', opacity: 0.85 }, g));
    el('rect', { x: x + 7, y: y + 71, width: b - 14, height: 6, fill: '#4A2C14' }, g);
    for (let k = 0; k < 4; k++) el('rect', { x: x + 11 + k * 16.5, y: y + 71, width: 8, height: 6, fill: '#E0BA82' }, g);
    el('line', { x1: x + 9, y1: y + 350, x2: x + b - 9, y2: y + 350, stroke: '#4A2C14', 'stroke-dasharray': '3 3', 'stroke-width': 1.2 }, g);
    [[x + 15, y + 46], [x + 48, y + 56], [x + 31, y + 40]].forEach(([cx, cy]) => {
      el('circle', { cx, cy, r: 6, fill: '#E9C48A', stroke: '#8A5B2A', 'stroke-width': 0.8 }, g);
    });
    // houten pinnen
    [[x + 12, y - 2], [x + b - 12, y - 2]].forEach(([cx, cy]) => {
      el('circle', { cx: cx + 1, cy: cy + 2, r: 5, fill: '#000', opacity: 0.3 }, g);
      el('circle', { cx, cy, r: 5, fill: '#6B4423', stroke: '#3B2412' }, g);
    });
    naambordje(g, x + b / 2, y + h + 12, 'Sjoelen');
  }

  function bouwPrent(wand, o) {
    const g = voorwerp(wand, { label: o.naam + ' · komt binnenkort' });
    schaduw(g, o.x, o.y, o.b, o.h);
    el('rect', { x: o.x, y: o.y, width: o.b, height: o.h, fill: '#17110D' }, g);
    el('rect', { x: o.x + 8, y: o.y + 8, width: o.b - 16, height: o.h - 16, fill: 'url(#h-papier)' }, g);
    el('use', { href: '#' + o.ill, x: o.x + 18, y: o.y + 14, width: o.b - 36, height: o.b - 36, style: 'color:#5A3A1E', stroke: '#5A3A1E', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g);
    tekst(o.naam, { x: o.x + o.b / 2, y: o.y + o.h - 16, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-size': 14, fill: '#4A2E14' }, g);
    // gordijntje voor de prent, zoals men in de 17e eeuw schilderijen afdekte
    el('line', { x1: o.x - 10, y1: o.y - 7, x2: o.x + o.b + 10, y2: o.y - 7, stroke: 'url(#h-messing)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
    const gd = el('g', { class: 'gordijn' }, g);
    const gx = o.x + o.b * 0.28, gb = o.b * 0.8, gh = o.h + 18;
    el('path', { d: `M${gx} ${o.y - 7} H${gx + gb} V${o.y - 7 + gh} q ${-gb / 4} 6 ${-gb / 2} 0 t ${-gb / 2} 2 Z`, fill: o.gordijn }, gd);
    for (let i = 1; i < 6; i++) {
      el('line', { x1: gx + i * gb / 6, y1: o.y - 6, x2: gx + i * gb / 6 + (rnd() * 4 - 2), y2: o.y - 9 + gh, stroke: '#000', 'stroke-opacity': 0.22, 'stroke-width': 3 }, gd);
      el('line', { x1: gx + i * gb / 6 + 3, y1: o.y - 6, x2: gx + i * gb / 6 + 3, y2: o.y - 9 + gh, stroke: '#fff', 'stroke-opacity': 0.08, 'stroke-width': 2 }, gd);
    }
    for (let i = 0; i < 6; i++) el('circle', { cx: gx + 4 + i * (gb - 8) / 5, cy: o.y - 7, r: 3, fill: 'none', stroke: '#B9893A', 'stroke-width': 1.5 }, gd);
  }

  function bouwHoepel(wand) {
    const g = voorwerp(wand, { label: 'Hoepelen · komt binnenkort' });
    const h = el('g', { class: 'hoepel-hang' }, g);
    el('circle', { cx: 1198, cy: 460, r: 62, fill: 'none', stroke: '#2A1A0C', 'stroke-opacity': 0.35, 'stroke-width': 8, filter: 'url(#h-schaduw)' }, h);
    el('line', { x1: 1204, y1: 392, x2: 1246, y2: 548, stroke: '#5E3B1E', 'stroke-width': 5, 'stroke-linecap': 'round' }, h);
    el('circle', { cx: 1190, cy: 450, r: 62, fill: 'none', stroke: '#8A5A2E', 'stroke-width': 8 }, h);
    el('circle', { cx: 1190, cy: 450, r: 62, fill: 'none', stroke: '#D29E62', 'stroke-width': 2, 'stroke-dasharray': '30 14', opacity: 0.8 }, h);
    spijker(g, 1190, 386);
  }

  function bouwPlank(wand) {
    // plank met een tol, een Delfts bord en een stapeltje sjoelschijven
    el('rect', { x: 1104, y: 598, width: 194, height: 10, fill: '#2A1A0C', opacity: 0.3, filter: 'url(#h-zacht)' }, wand);
    el('rect', { x: 1098, y: 588, width: 196, height: 12, fill: 'url(#h-eik)' }, wand);
    el('path', { d: 'M1116 600 l0 18 l14 -18 Z M1276 600 l0 18 l-14 -18 Z', fill: '#6B4726' }, wand);
    // Delfts bord (versiering)
    el('ellipse', { cx: 1236, cy: 566, rx: 23, ry: 23, fill: '#F4F1E8', stroke: '#C9C3B3', 'stroke-width': 1 }, wand);
    el('ellipse', { cx: 1236, cy: 566, rx: 16, ry: 16, fill: 'none', stroke: BLAUW, 'stroke-width': 1.4 }, wand);
    el('use', { href: '#ill-gans', x: 1222, y: 552, width: 28, height: 28, style: 'color:' + BLAUW, stroke: BLAUW, 'stroke-width': 4, fill: 'none' }, wand);
    for (let i = 0; i < 6; i++) {
      el('ellipse', { cx: 1276, cy: 584 - i * 4.5, rx: 11, ry: 3.6, fill: i % 2 ? '#E0B77D' : '#D4A86C', stroke: '#8A5B2A', 'stroke-width': 0.7 }, wand);
    }
    const g = voorwerp(wand, { label: 'Tollen · komt binnenkort' });
    el('rect', { x: 1120, y: 534, width: 90, height: 56, fill: 'transparent' }, g);
    el('path', { d: 'M1131 559 Q1148 549 1165 559 L1150 586 L1146 586 Z', fill: '#B6452C', stroke: '#5A2215', 'stroke-width': 1 }, g);
    el('path', { d: 'M1134 564 Q1148 558 1162 564 L1159 570 Q1148 566 1137 570 Z', fill: BLAUW }, g);
    el('path', { d: 'M1141 574 Q1148 572 1155 574 L1152 580 L1144 580 Z', fill: '#E7C36A' }, g);
    el('ellipse', { cx: 1148, cy: 558, rx: 17, ry: 4, fill: '#D45A3C' }, g);
    el('rect', { x: 1146, y: 546, width: 4, height: 11, fill: '#6B4423' }, g);
    el('path', { d: 'M1170 586 q 14 -3 22 -16 M1192 570 q 6 10 -6 16', fill: 'none', stroke: '#4A3018', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
  }

  function bouwKolf(svg) {
    // kolf en bal, tegen de achterwand in de rechterhoek
    const g = voorwerp(svg, { label: 'Kolf op het ijs · komt binnenkort' });
    el('rect', { x: 1268, y: 500, width: 60, height: 290, fill: 'transparent' }, g);
    el('line', { x1: 1306, y1: 512, x2: 1290, y2: 766, stroke: '#2A1A0C', 'stroke-opacity': 0.25, 'stroke-width': 7, transform: 'translate(7 3)' }, g);
    el('line', { x1: 1306, y1: 512, x2: 1290, y2: 762, stroke: '#6E4A26', 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g);
    el('line', { x1: 1306, y1: 512, x2: 1303, y2: 556, stroke: '#3A2614', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M1293 754 L1262 770 Q1256 776 1264 778 L1296 772 Z', fill: '#5B5B58', stroke: '#2E2E2C', 'stroke-width': 1 }, g);
    el('ellipse', { cx: 1246, cy: 784, rx: 10, ry: 3, fill: '#000', opacity: 0.3 }, g);
    el('circle', { cx: 1244, cy: 776, r: 8, fill: '#EDE3CC', stroke: '#8C7B5A', 'stroke-width': 1 }, g);
    el('path', { d: 'M1238 772 q 6 4 12 0', fill: 'none', stroke: '#8C7B5A', 'stroke-width': 0.8 }, g);
  }

  function bouwTafel(svg) {
    const T = (X, Z) => P(X, 170, Z);
    const g = el('g', { class: 'tafel' }, svg);
    const blad = [T(-470, 820), T(-170, 820), T(-170, 640), T(-470, 640)];
    // schaduw op de vloer
    veelhoek([P(-470, HH, 820), P(-170, HH, 820), P(-150, HH, 640), P(-470, HH, 620)], { fill: 'url(#h-schaduwvlek)' }, g);
    veelhoek(blad, { fill: 'url(#h-tapijt-plat)' }, g);
    veelhoek(blad, { fill: '#000', opacity: 0.12 }, g);
    // afhangend kleed aan de voorkant en zijkant
    const a = T(-470, 640), b = T(-170, 640), c = T(-170, 820);
    const onder = 945;
    let d = `M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${b[0] + 4} ${onder - 8}`;
    for (let x = b[0]; x > a[0]; x -= 39) d += ` Q${x - 10} ${onder + 8} ${x - 20} ${onder - 2} T${x - 39} ${onder - 6}`;
    d += ` L${a[0] - 6} ${a[1] + 40} Z`;
    el('path', { d, fill: 'url(#h-tapijt)' }, g);
    const plooien = el('g', { opacity: 0.35 }, g);
    for (let x = a[0] + 30; x < b[0]; x += 58) {
      el('path', { d: `M${x} ${a[1] + 6} Q${x + 6} ${a[1] + 120} ${x - 4} ${onder - 4}`, fill: 'none', stroke: '#000', 'stroke-width': 14, filter: 'url(#h-zacht)' }, plooien);
    }
    el('path', { d: `M${b[0]} ${b[1]} L${c[0]} ${c[1]} L${c[0]} ${P(-170, 300, 820)[1]} L${b[0] + 4} ${onder - 8} Z`, fill: 'url(#h-tapijt)' }, g);
    el('path', { d: `M${b[0]} ${b[1]} L${c[0]} ${c[1]} L${c[0]} ${P(-170, 300, 820)[1]} L${b[0] + 4} ${onder - 8} Z`, fill: '#000', opacity: 0.35 }, g);
    el('path', { d: `M${a[0]} ${onder - 2} L${b[0]} ${onder - 6}`, fill: 'none', stroke: '#D9B05A', 'stroke-width': 5, 'stroke-dasharray': '1.5 3' }, g);
    // licht van het raam op het kleed
    veelhoek([blad[0], [blad[0][0] + 160, blad[0][1]], [blad[3][0] + 150, blad[3][1]], blad[3]], { fill: '#FFF0C8', opacity: 0.22, filter: 'url(#h-zacht)' }, g);

    // Delfts blauwe kan (versiering)
    const k = T(-205, 800);
    const kan = el('g', { transform: `translate(${k[0].toFixed(1)} ${k[1].toFixed(1)})` }, g);
    el('ellipse', { cx: 3, cy: 1, rx: 18, ry: 4, fill: '#000', opacity: 0.3 }, kan);
    el('path', { d: 'M-12 0 Q-18 -30 -9 -44 L-8 -56 Q0 -60 8 -56 L9 -44 Q18 -30 12 0 Z', fill: '#F4F1E8', stroke: '#B7B09E', 'stroke-width': 0.8 }, kan);
    el('path', { d: 'M9 -46 Q24 -44 16 -20 Q14 -14 11 -12', fill: 'none', stroke: '#E9E4D6', 'stroke-width': 3 }, kan);
    el('path', { d: 'M-12 -22 Q0 -14 12 -22 M-14 -10 Q0 -2 14 -10 M-6 -36 q6 -6 12 0', fill: 'none', stroke: BLAUW, 'stroke-width': 1.6 }, kan);
    el('circle', { cx: -2, cy: -30, r: 3, fill: BLAUW, opacity: 0.7 }, kan);

    // dambord (binnenkort)
    const dam = voorwerp(g, { label: 'Dammen · komt binnenkort' });
    const x0 = -340, x1 = -228, z0 = 712, z1 = 800, n = 10;
    veelhoek([T(x0 - 6, z1 + 6), T(x1 + 6, z1 + 6), T(x1 + 6, z0 - 6), T(x0 - 6, z0 - 6)], { fill: '#3A2614' }, dam);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n;
        const za = z0 + (z1 - z0) * j / n, zb = z0 + (z1 - z0) * (j + 1) / n;
        veelhoek([T(xa, zb), T(xb, zb), T(xb, za), T(xa, za)], { fill: (i + j) % 2 ? '#3E2A18' : '#E8D3A8' }, dam);
      }
    }
    [[1, 2, '#F2EAD8'], [3, 2, '#F2EAD8'], [6, 7, '#1E1714'], [4, 6, '#1E1714'], [8, 7, '#1E1714']].forEach(([i, j, kl]) => {
      const m = T(x0 + (x1 - x0) * (i + 0.5) / n, z0 + (z1 - z0) * (j + 0.5) / n);
      el('ellipse', { cx: m[0], cy: m[1] - 1.5, rx: 5.5, ry: 2.6, fill: kl, stroke: '#000', 'stroke-opacity': 0.4, 'stroke-width': 0.6 }, dam);
    });

    // speelkaarten (binnenkort)
    const kaarten = voorwerp(g, { label: 'Klaverjassen · komt binnenkort' });
    [[-430, 700, -0.5, '#B6452C'], [-410, 690, -0.15, '#1E1714'], [-392, 696, 0.25, '#B6452C'], [-372, 706, 0.6, '#1E1714']].forEach(([cx, cz, hoek, kleur]) => {
      const hb = 17, hl = 25, co = Math.cos(hoek), si = Math.sin(hoek);
      const hoekpunt = (dx, dz) => T(cx + dx * co - dz * si, cz + dx * si + dz * co);
      veelhoek([hoekpunt(-hb, -hl), hoekpunt(hb, -hl), hoekpunt(hb, hl), hoekpunt(-hb, hl)], { fill: '#F7F1E2', stroke: '#8C7B5A', 'stroke-width': 0.8 }, kaarten);
      const m = T(cx, cz);
      el('ellipse', { cx: m[0], cy: m[1], rx: 3.5, ry: 1.8, fill: kleur }, kaarten);
    });
  }

  function bouwKnikkers(svg) {
    const g = voorwerp(svg, { label: 'Knikkeren · komt binnenkort' });
    const K = (X, Z) => P(X, HH, Z);
    const zak = K(40, 760);
    el('ellipse', { cx: zak[0] + 6, cy: zak[1] + 4, rx: 30, ry: 8, fill: 'url(#h-schaduwvlek)' }, g);
    el('path', { d: `M${zak[0] - 26} ${zak[1]} Q${zak[0] - 30} ${zak[1] - 30} ${zak[0] - 6} ${zak[1] - 34} L${zak[0] - 2} ${zak[1] - 44} M${zak[0] - 6} ${zak[1] - 34} Q${zak[0] + 28} ${zak[1] - 30} ${zak[0] + 26} ${zak[1]} Z`, fill: '#8C6A43', stroke: '#5A4026', 'stroke-width': 1.4 }, g);
    el('path', { d: `M${zak[0] - 14} ${zak[1] - 32} q 8 6 18 0`, fill: 'none', stroke: '#C9A46A', 'stroke-width': 2 }, g);
    [[95, 720, 'b'], [130, 700, 'g'], [70, 690, 'o'], [160, 740, 'b'], [112, 760, 'o']].forEach(([X, Z, k]) => {
      const m = K(X, Z), r = 9 * 1000 / Z * 0.75;
      el('ellipse', { cx: m[0] + 3, cy: m[1] + 1, rx: r, ry: r * 0.4, fill: '#000', opacity: 0.35 }, g);
      el('circle', { cx: m[0], cy: m[1] - r, r, fill: `url(#h-knikker-${k})` }, g);
      el('circle', { cx: m[0] - r * 0.35, cy: m[1] - r * 1.35, r: r * 0.25, fill: '#fff', opacity: 0.8 }, g);
    });
  }

  function bouwKat(svg) {
    const g = el('g', { class: 'kat' }, svg);
    const k = [P(330, HH, 720), P(460, HH, 720), P(460, HH, 640), P(330, HH, 640)];
    veelhoek([k[0], k[1], k[2], k[3]].map(([x, y]) => [x + 10, y + 8]), { fill: 'url(#h-schaduwvlek)' }, g);
    veelhoek([[k[3][0], k[3][1]], [k[2][0], k[2][1]], [k[2][0], k[2][1] + 16], [k[3][0], k[3][1] + 16]], { fill: '#4E1C18' }, g);
    veelhoek([[k[0][0], k[0][1] - 10], [k[1][0], k[1][1] - 10], [k[2][0], k[2][1]], [k[3][0], k[3][1]]], { fill: '#7A2E27' }, g);
    [k[3], k[2]].forEach(([x, y]) => el('path', { d: `M${x} ${y + 14} l -4 12 m 4 -12 l 4 12`, stroke: '#C99A3E', 'stroke-width': 2 }, g));
    const kat = el('g', { class: 'kat-lijf' }, g);
    el('ellipse', { cx: 1392, cy: 922, rx: 62, ry: 28, fill: 'url(#h-kat)' }, kat);
    [[-30, 0], [-10, -2], [10, -2], [30, 2]].forEach(([dx, dy]) => el('path', { d: `M${1392 + dx} ${896 + dy} q -6 14 0 26`, fill: 'none', stroke: '#8E4F1E', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 }, kat));
    el('circle', { cx: 1342, cy: 916, r: 20, fill: 'url(#h-kat)' }, kat);
    el('path', { d: 'M1328 904 L1326 884 L1340 897 Z M1350 898 L1360 882 L1362 902 Z', fill: '#B46A2E' }, kat);
    el('path', { d: 'M1333 914 q 4 3 8 0 M1347 914 q 4 3 8 0', fill: 'none', stroke: '#3A2210', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, kat);
    el('path', { d: 'M1343 922 l -2 2 l 4 0 Z', fill: '#6E3A2A' }, kat);
    el('path', { d: 'M1360 938 q 10 6 26 4', fill: 'none', stroke: '#F3D2A5', 'stroke-width': 6, 'stroke-linecap': 'round' }, kat);
    el('path', { class: 'kat-staart', d: 'M1450 926 C 1470 948, 1430 960, 1372 952', fill: 'none', stroke: '#B46A2E', 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
  }

  function bouwKoek(svg) {
    const g = voorwerp(svg, { label: 'Koekhappen · komt binnenkort' });
    const t = el('g', { class: 'koek-touw' }, g);
    el('line', { x1: 1290, y1: -10, x2: 1290, y2: 212, stroke: '#D8CBB0', 'stroke-width': 1.6 }, t);
    el('rect', { x: 1268, y: 214, width: 52, height: 32, rx: 5, fill: '#1A0F06', opacity: 0.3, filter: 'url(#h-zacht)', transform: 'translate(6 6)' }, t);
    el('rect', { x: 1264, y: 210, width: 52, height: 32, rx: 5, fill: '#7A4519' }, t);
    el('rect', { x: 1268, y: 214, width: 44, height: 24, rx: 3, fill: '#A86A2C' }, t);
    for (let i = 0; i < 7; i++) el('circle', { cx: 1272 + rnd() * 36, cy: 218 + rnd() * 16, r: 1.2, fill: '#6A3A12' }, t);
    el('circle', { cx: 1290, cy: 211, r: 2.5, fill: '#D8CBB0' }, t);
  }

  function bouwKroon(svg) {
    const g = el('g', { class: 'kroon' }, el('g', { class: 'diepte' }, svg));
    el('line', { x1: 800, y1: -10, x2: 800, y2: 96, stroke: '#5C4220', 'stroke-width': 3, 'stroke-dasharray': '5 2.5' }, g);
    el('circle', { cx: 800, cy: 100, r: 5, fill: 'url(#h-messing)' }, g);
    el('rect', { x: 797, y: 104, width: 6, height: 34, fill: 'url(#h-messing)' }, g);
    const houders = [[-96, 140], [-62, 150], [-28, 144], [28, 144], [62, 150], [96, 140]];
    houders.forEach(([hx, hy]) => {
      el('path', { d: `M800 160 C ${800 + hx * 0.25} 192, ${800 + hx * 0.95} 194, ${800 + hx} ${hy + 5}`, fill: 'none', stroke: 'url(#h-messing)', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g);
    });
    el('circle', { cx: 800, cy: 156, r: 17, fill: 'url(#h-messing)' }, g);
    el('ellipse', { cx: 794, cy: 150, rx: 6, ry: 4, fill: '#FFF3C4', opacity: 0.6 }, g);
    el('circle', { cx: 800, cy: 180, r: 7, fill: 'url(#h-messing)' }, g);
    el('path', { d: 'M800 186 l -3 6 l 3 6 l 3 -6 Z', fill: 'url(#h-messing)' }, g);
    houders.forEach(([hx, hy]) => {
      const x = 800 + hx;
      el('ellipse', { cx: x, cy: hy + 5, rx: 9, ry: 3, fill: 'url(#h-messing)' }, g);
      el('rect', { x: x - 3, y: hy - 18, width: 6, height: 22, fill: '#F5ECD8' }, g);
      el('rect', { x: x + 0.5, y: hy - 18, width: 2.5, height: 22, fill: '#D8C9A9' }, g);
      el('circle', { cx: x, cy: hy - 26, r: 16, fill: 'url(#h-gloed)', class: 'gloed' }, g);
      el('path', { d: `M${x} ${hy - 18} C ${x - 4} ${hy - 23}, ${x - 3} ${hy - 29}, ${x} ${hy - 35} C ${x + 3} ${hy - 29}, ${x + 4} ${hy - 23}, ${x} ${hy - 18} Z`, fill: 'url(#h-vlam)', class: 'vlam' }, g);
    });
  }

  // ============================================================
  // DE GEVEL AAN DE GRACHT (viewBox 1600 x 1000)
  // ============================================================
  function bouwGevel() {
    zaad = 99;
    const svg = el('svg', { viewBox: '0 0 1600 1000', class: 'gevel-svg', preserveAspectRatio: 'xMidYMax slice', role: 'img', 'aria-label': 'Het Speelhuys: een grachtenpand met een trapgevel' });
    const defs = el('defs', {}, svg);
    verloop(defs, 'g-lucht', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#7F9CB8'], [0.55, '#B9C6CC'], [1, '#E9E2CF']]);
    verloop(defs, 'g-wolk', 'radialGradient', { cx: '45%', cy: '35%', r: '70%' }, [[0, '#FFFFFF'], [0.7, '#F1F0EA'], [1, '#C9CDD0']]);
    verloop(defs, 'g-ruit', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#7E95A3'], [0.5, '#34434D'], [1, '#22303A']]);
    verloop(defs, 'g-water', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#55665F'], [1, '#26332F']]);
    verloop(defs, 'g-binnen', 'radialGradient', { cx: '50%', cy: '60%', r: '70%' }, [[0, '#FFE6AE'], [0.6, '#E0A55A'], [1, '#7A4A20']]);
    verloop(defs, 'g-messing', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F6DC97'], [0.5, '#C9973F'], [1, '#71501E']]);
    verloop(defs, 'g-schaduw', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#000', 0.25], [0.08, '#000', 0], [0.92, '#000', 0], [1, '#000', 0.3]]);
    [['g-steen', '#9B4631', '#8A3C29'], ['g-steen2', '#6E3326', '#5F2A20'], ['g-steen3', '#8B5138', '#7A4430']].forEach(([id, a, b]) => {
      const p = el('pattern', { id, width: 36, height: 16, patternUnits: 'userSpaceOnUse' }, defs);
      el('rect', { width: 36, height: 16, fill: a }, p);
      el('rect', { x: 18, y: 8, width: 18, height: 8, fill: b }, p);
      el('rect', { x: 0, y: 0, width: 9, height: 8, fill: b, opacity: 0.5 }, p);
      el('path', { d: 'M0 0 H36 M0 8 H36 M0 0 V8 M18 8 V16', stroke: '#CDBDA2', 'stroke-width': 1.2, opacity: 0.75 }, p);
    });
    const kp = el('pattern', { id: 'g-kei', width: 26, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 26, height: 14, fill: '#6F675E' }, kp);
    el('ellipse', { cx: 6, cy: 4, rx: 6, ry: 3.4, fill: '#9A9187' }, kp);
    el('ellipse', { cx: 19, cy: 4, rx: 6, ry: 3.4, fill: '#8C8379' }, kp);
    el('ellipse', { cx: 0, cy: 11, rx: 6, ry: 3.4, fill: '#8E857B' }, kp);
    el('ellipse', { cx: 13, cy: 11, rx: 6, ry: 3.4, fill: '#A19890' }, kp);
    el('ellipse', { cx: 26, cy: 11, rx: 6, ry: 3.4, fill: '#8E857B' }, kp);
    const lp = el('pattern', { id: 'g-lood', width: 10, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M0 7 L5 0 L10 7 L5 14 Z', fill: 'none', stroke: '#C9D2D6', 'stroke-width': 0.6, opacity: 0.6 }, lp);
    vervaag(defs, 'g-vaag', 3);
    vervaag(defs, 'g-wolkvaag', 2);
    const ruis = el('filter', { id: 'g-ruis' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.8', numOctaves: '2', seed: '5', result: 'r' }, ruis);
    el('feColorMatrix', { in: 'r', values: '0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .05  0 0 0 .18 0' }, ruis);
    el('feComposite', { in2: 'SourceGraphic', operator: 'in' }, ruis);

    el('rect', { width: 1600, height: 960, fill: 'url(#g-lucht)' }, svg);
    // wolken
    const wolken = el('g', {}, svg);
    [[120, 150, 1.3, 140], [760, 70, 1.0, 190], [1250, 190, 1.5, 160], [460, 260, 0.8, 220]].forEach(([x, y, sch, duur], i) => {
      const w = el('g', { class: 'wolk', style: `animation-duration:${duur}s;animation-delay:-${(i * 37) % duur}s` }, wolken);
      const binnen = el('g', { transform: `translate(${x} ${y}) scale(${sch})` }, w);
      el('ellipse', { cx: 70, cy: 26, rx: 110, ry: 20, fill: '#B9C0C5', opacity: 0.6 }, binnen);
      [[0, 0, 60, 34], [50, -22, 60, 42], [108, -6, 58, 36], [150, 10, 48, 26], [36, 14, 90, 24]].forEach(([cx, cy, rx, ry]) => el('ellipse', { cx, cy, rx, ry, fill: 'url(#g-wolk)' }, binnen));
    });
    // vogels
    const vogels = el('g', { class: 'vogels' }, svg);
    [[0, 0], [34, 14], [70, -6]].forEach(([dx, dy]) => el('path', { d: `M${dx} ${dy} q 7 -7 14 0 q 7 -7 14 0`, fill: 'none', stroke: '#2E3538', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, vogels));

    const gevelGroep = el('g', { id: 'g-gevels' }, svg);
    // verre panden
    el('path', { d: 'M-20 905 V330 H20 V290 H60 V250 H100 V905 Z', fill: '#5B3A2E' }, gevelGroep);
    el('path', { d: 'M1500 905 V300 Q1560 240 1620 300 V905 Z', fill: '#5E4033' }, gevelGroep);
    // linkerbuur: halsgevel
    const hals = el('path', { d: 'M100 905 V360 H196 Q214 332 232 300 V206 Q320 150 408 206 V300 Q426 332 444 360 H540 V905 Z', fill: 'url(#g-steen2)' }, gevelGroep);
    hals.setAttribute('stroke', '#E2D6BA'); hals.setAttribute('stroke-width', 0);
    el('path', { d: 'M196 360 Q214 332 232 300 V206 Q320 150 408 206 V300 Q426 332 444 360', fill: 'none', stroke: '#E2D6BA', 'stroke-width': 8 }, gevelGroep);
    el('rect', { x: 96, y: 356, width: 448, height: 12, fill: '#E2D6BA' }, gevelGroep);
    el('circle', { cx: 320, cy: 166, r: 9, fill: '#E2D6BA' }, gevelGroep);
    [[190, 420], [320, 420], [450, 420], [190, 580], [320, 580], [450, 580], [190, 745], [320, 745], [450, 745]].forEach(([cx, y]) => raam(gevelGroep, cx, y, 70, 104, false));
    raam(gevelGroep, 320, 222, 56, 70, false);
    // rechterbuur: klokgevel
    el('path', { d: 'M1060 905 V380 H1146 C1146 300 1188 250 1228 232 V204 Q1280 172 1332 204 V232 C1372 250 1414 300 1414 380 H1500 V905 Z', fill: 'url(#g-steen3)' }, gevelGroep);
    el('path', { d: 'M1146 380 C1146 300 1188 250 1228 232 V204 Q1280 172 1332 204 V232 C1372 250 1414 300 1414 380', fill: 'none', stroke: '#EDE4D0', 'stroke-width': 9 }, gevelGroep);
    el('rect', { x: 1056, y: 376, width: 448, height: 12, fill: '#EDE4D0' }, gevelGroep);
    [[1170, 430], [1280, 430], [1390, 430], [1170, 590], [1280, 590], [1390, 590], [1170, 752], [1390, 752]].forEach(([cx, y]) => raam(gevelGroep, cx, y, 70, 104, false));
    deurtje(gevelGroep, 1280, 760);
    raam(gevelGroep, 1280, 262, 60, 84, false);

    // ---------- Het Speelhuys: trapgevel ----------
    const huis = el('g', { class: 'speelhuys-gevel' }, gevelGroep);
    const trap = 'M530 905 V400 H584 V338 H638 V276 H692 V214 H746 V152 H854 V214 H908 V276 H962 V338 H1016 V400 H1070 V905 Z';
    const huisClip = el('clipPath', { id: 'g-huisclip' }, defs);
    el('path', { d: trap }, huisClip);
    el('path', { d: trap, fill: 'url(#g-steen)' }, huis);
    const banden = el('g', { 'clip-path': 'url(#g-huisclip)', fill: '#E4D8BD' }, huis);
    [338, 276, 214, 556, 712].forEach((y) => el('rect', { x: 520, y, width: 560, height: 9 }, banden));
    el('rect', { x: 524, y: 396, width: 552, height: 16, fill: '#E4D8BD' }, huis);
    // dekstenen op de trappen
    [[584, 400], [638, 338], [692, 276], [746, 214], [854, 214], [908, 276], [962, 338], [1016, 400]].forEach(([x, y], i) => {
      el('rect', { x: (i < 4 ? x - 58 : x - 4), y: y - 8, width: 62, height: 9, fill: '#E4D8BD' }, huis);
    });
    el('rect', { x: 740, y: 144, width: 120, height: 10, fill: '#E4D8BD' }, huis);
    el('path', { d: 'M760 144 L800 112 L840 144 Z', fill: '#E4D8BD' }, huis);
    el('circle', { cx: 800, cy: 106, r: 8, fill: '#E4D8BD' }, huis);
    // hijsbalk met touw en haak
    el('rect', { x: 790, y: 160, width: 20, height: 16, fill: '#3A2A1C' }, huis);
    el('line', { x1: 800, y1: 176, x2: 800, y2: 204, stroke: '#4A3A28', 'stroke-width': 2 }, huis);
    el('path', { d: 'M800 204 q -6 4 0 10 q 6 2 4 -4', fill: 'none', stroke: '#2B2B2B', 'stroke-width': 2.4 }, huis);
    // hijsluik en gevelraampjes
    el('rect', { x: 772, y: 226, width: 56, height: 82, fill: '#E9E2D2' }, huis);
    el('rect', { x: 777, y: 231, width: 22, height: 72, fill: '#2C4A35' }, huis);
    el('rect', { x: 801, y: 231, width: 22, height: 72, fill: '#2C4A35' }, huis);
    raam(huis, 690, 300, 54, 70, false);
    raam(huis, 910, 300, 54, 70, false);
    // vensters
    [640, 800, 960].forEach((cx) => raam(huis, cx, 432, 86, 108, false, true));
    [640, 960].forEach((cx) => raam(huis, cx, 588, 86, 108, false, true));
    [640, 960].forEach((cx) => raam(huis, cx, 742, 92, 120, true, true));
    // muurankers
    [[558, 556], [1042, 556], [558, 712], [1042, 712]].forEach(([x, y]) => {
      el('path', { d: `M${x - 9} ${y + 4} H${x + 9} M${x} ${y - 5} V${y + 13}`, stroke: '#1E1814', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, huis);
    });
    // gevelsteen met gans
    el('rect', { x: 748, y: 594, width: 104, height: 92, fill: '#E4D8BD' }, huis);
    el('rect', { x: 756, y: 602, width: 88, height: 62, fill: '#2C4A7C' }, huis);
    el('use', { href: '#ill-gans', x: 768, y: 600, width: 64, height: 64, style: 'color:#E8B94E', stroke: '#E8B94E', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, huis);
    el('rect', { x: 756, y: 666, width: 88, height: 14, fill: '#A8402E' }, huis);
    tekst("'t Speelhuys", { x: 800, y: 677, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 10.5, fill: '#F6EBD2' }, huis);
    // voordeur met bovenlicht
    el('rect', { x: 748, y: 712, width: 104, height: 193, fill: '#E4D8BD' }, huis);
    el('path', { d: 'M758 762 A42 42 0 0 1 842 762 Z', fill: 'url(#g-ruit)' }, huis);
    for (let i = 1; i < 6; i++) {
      const a = Math.PI - (i * Math.PI) / 6;
      el('line', { x1: 800, y1: 762, x2: 800 + 42 * Math.cos(a), y2: 762 - 42 * Math.sin(a), stroke: '#E9E2D2', 'stroke-width': 2.4 }, huis);
    }
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: 'url(#g-binnen)', class: 'deur-licht' }, huis);
    const deur = el('g', { class: 'deur-blad', id: 'deur-blad' }, huis);
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: '#22392B' }, deur);
    [[766, 772, 30, 56], [804, 772, 30, 56], [766, 840, 30, 56], [804, 840, 30, 56]].forEach(([x, y, b, h]) => {
      el('rect', { x, y, width: b, height: h, fill: 'none', stroke: '#3D5C46', 'stroke-width': 2.2 }, deur);
      el('rect', { x: x + 2, y: y + 2, width: b - 4, height: h - 4, fill: 'none', stroke: '#14231A', 'stroke-width': 1 }, deur);
    });
    el('circle', { cx: 800, cy: 828, r: 7, fill: 'none', stroke: 'url(#g-messing)', 'stroke-width': 2.4 }, deur);
    el('circle', { cx: 832, cy: 840, r: 3, fill: 'url(#g-messing)' }, deur);
    el('rect', { x: 754, y: 758, width: 92, height: 151, fill: 'none', stroke: '#FFD98A', 'stroke-width': 3, class: 'deur-wenk', rx: 2 }, huis);
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: 'transparent', class: 'deur-klik', role: 'button', 'aria-label': 'Ga naar binnen' }, huis);
    // schaduw langs de randen van het pand
    el('path', { d: trap, fill: 'url(#g-schaduw)' }, huis);

    // uithangbord
    const bord = el('g', {}, gevelGroep);
    el('path', { d: 'M1070 626 H1178 M1074 650 Q1100 626 1150 626', fill: 'none', stroke: '#1E1814', 'stroke-width': 3.5 }, bord);
    el('path', { d: 'M1160 626 q 10 -12 18 0', fill: 'none', stroke: '#1E1814', 'stroke-width': 2.5 }, bord);
    const zwaai = el('g', { class: 'uithangbord' }, bord);
    el('line', { x1: 1094, y1: 626, x2: 1094, y2: 640, stroke: '#1E1814', 'stroke-width': 2 }, zwaai);
    el('line', { x1: 1160, y1: 626, x2: 1160, y2: 640, stroke: '#1E1814', 'stroke-width': 2 }, zwaai);
    el('rect', { x: 1080, y: 640, width: 94, height: 70, rx: 4, fill: '#2C4A35', stroke: '#C9973F', 'stroke-width': 3 }, zwaai);
    tekst('Het', { x: 1127, y: 662, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-size': 14, fill: '#F2D78E' }, zwaai);
    tekst('Speelhuys', { x: 1127, y: 684, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 18, fill: '#F2D78E' }, zwaai);
    el('path', { d: 'M1102 698 H1152', stroke: '#C9973F', 'stroke-width': 1.2 }, zwaai);

    // stoep en kade
    el('rect', { x: 0, y: 905, width: 1600, height: 44, fill: 'url(#g-kei)' }, svg);
    el('rect', { x: 0, y: 905, width: 1600, height: 44, fill: '#000', opacity: 0.12 }, svg);
    el('rect', { x: 738, y: 905, width: 124, height: 12, fill: '#CFC3A8' }, svg);
    el('rect', { x: 728, y: 917, width: 144, height: 12, fill: '#BDB196' }, svg);
    el('rect', { x: 0, y: 946, width: 1600, height: 12, fill: '#5E5A54' }, svg);
    // water met spiegeling
    const waterClip = el('clipPath', { id: 'g-waterclip' }, defs);
    el('rect', { x: 0, y: 958, width: 1600, height: 42 }, waterClip);
    el('rect', { x: 0, y: 958, width: 1600, height: 42, fill: 'url(#g-water)' }, svg);
    const spiegel = el('g', { 'clip-path': 'url(#g-waterclip)', opacity: 0.32 }, svg);
    el('use', { href: '#g-gevels', transform: 'matrix(1 0 0 -0.35 0 1275)' }, spiegel);
    const glans = el('g', { class: 'water-glans', stroke: '#E9F0EC', 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 1600, y = 966 + rnd() * 30, l = 20 + rnd() * 60;
      el('line', { x1: x, y1: y, x2: x + l, y2: y, 'stroke-width': 1.4, opacity: (0.15 + rnd() * 0.3).toFixed(2), style: `animation-delay:-${(rnd() * 6).toFixed(1)}s` }, glans);
    }
    return svg;
  }

  function raam(ouder, cx, top, b, h, luiken, boog) {
    const x = cx - b / 2;
    if (boog) {
      el('path', { d: `M${x - 6} ${top - 2} A${b / 2 + 6} ${(b / 2 + 6) * 0.42} 0 0 1 ${x + b + 6} ${top - 2}`, fill: 'none', stroke: '#E4D8BD', 'stroke-width': 10 }, ouder);
      el('path', { d: `M${x - 6} ${top - 2} A${b / 2 + 6} ${(b / 2 + 6) * 0.42} 0 0 1 ${x + b + 6} ${top - 2}`, fill: 'none', stroke: '#A8452E', 'stroke-width': 10, 'stroke-dasharray': '8 9' }, ouder);
    }
    el('rect', { x, y: top, width: b, height: h, fill: '#EFEADF' }, ouder);
    el('rect', { x: x + 6, y: top + 6, width: b - 12, height: h - 12, fill: 'url(#g-ruit)' }, ouder);
    el('rect', { x: x + 6, y: top + 6, width: b - 12, height: (h - 12) * 0.42, fill: 'url(#g-lood)' }, ouder);
    el('path', { d: `M${x + 10} ${top + h - 10} L${x + b * 0.55} ${top + 10} L${x + b * 0.75} ${top + 10} L${x + 22} ${top + h - 10} Z`, fill: '#fff', opacity: 0.12 }, ouder);
    el('rect', { x: cx - 3, y: top, width: 6, height: h, fill: '#EFEADF' }, ouder);
    el('rect', { x, y: top + h * 0.44 - 3, width: b, height: 6, fill: '#EFEADF' }, ouder);
    if (luiken) {
      // dichte onderluiken met zandlopermotief
      const ly = top + h * 0.44 + 3, lh = h - (h * 0.44 + 3) - 4;
      [[x + 5, b / 2 - 7], [cx + 2, b / 2 - 7]].forEach(([lx, lb]) => {
        el('rect', { x: lx, y: ly, width: lb, height: lh, fill: '#B23B27' }, ouder);
        el('path', { d: `M${lx} ${ly} L${lx + lb} ${ly} L${lx + lb / 2} ${ly + lh / 2} Z M${lx} ${ly + lh} L${lx + lb} ${ly + lh} L${lx + lb / 2} ${ly + lh / 2} Z`, fill: '#F2EADA' }, ouder);
        el('rect', { x: lx, y: ly, width: lb, height: lh, fill: 'none', stroke: '#2B3A2E', 'stroke-width': 1.6 }, ouder);
      });
    }
    el('rect', { x: x - 6, y: top + h, width: b + 12, height: 6, fill: '#D9CCAE' }, ouder);
  }
  function deurtje(ouder, cx, top) {
    el('rect', { x: cx - 40, y: top - 6, width: 80, height: 151, fill: '#EDE4D0' }, ouder);
    el('rect', { x: cx - 32, y: top, width: 64, height: 145, fill: '#5A2A20' }, ouder);
    el('rect', { x: cx - 26, y: top + 8, width: 52, height: 40, fill: 'none', stroke: '#3C1B14', 'stroke-width': 2 }, ouder);
    el('rect', { x: cx - 26, y: top + 60, width: 52, height: 76, fill: 'none', stroke: '#3C1B14', 'stroke-width': 2 }, ouder);
  }

  // ============================================================
  // GEDRAG
  // ============================================================
  let toneel, kamer, kamerScroll, kamerSvg, gevel, gevelSvg, sluier, label, hint, gebouwd = false;
  let bezig = false;

  function rustig() { return bewegingRustig(); }
  function zetBinnen(w) { try { sessionStorage.setItem('speelhuys.binnen', w ? '1' : ''); } catch (e) { /* */ } }
  function isBinnen() { try { return sessionStorage.getItem('speelhuys.binnen') === '1'; } catch (e) { return false; } }

  function bouw() {
    if (gebouwd) return;
    gebouwd = true;
    toneel = document.getElementById('toneel');
    kamer = document.getElementById('kamer');
    kamerScroll = document.getElementById('kamer-scroll');
    gevel = document.getElementById('gevel');
    sluier = document.getElementById('sluier');
    label = document.getElementById('huis-label');
    hint = document.getElementById('veeg-hint');
    kamerSvg = bouwKamer();
    kamerScroll.appendChild(kamerSvg);
    gevelSvg = bouwGevel();
    gevel.insertBefore(gevelSvg, gevel.firstChild);

    kamerSvg.querySelectorAll('.voorwerp').forEach((v) => {
      v.addEventListener('pointerenter', () => toonLabel(v));
      v.addEventListener('pointerleave', verbergLabel);
      v.addEventListener('focus', () => toonLabel(v));
      v.addEventListener('blur', verbergLabel);
      v.addEventListener('click', (e) => {
        if (v.classList.contains('speelbaar')) {
          e.preventDefault();
          zoomNaar(v);
        } else {
          toonLabel(v);
          v.classList.remove('schud'); void v.getBoundingClientRect(); v.classList.add('schud');
          Geluid.pak();
        }
      });
      v.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !v.classList.contains('speelbaar')) { e.preventDefault(); v.dispatchEvent(new MouseEvent('click')); }
      });
    });
    gevel.querySelector('.deur-klik').addEventListener('click', binnengaan);
    document.getElementById('naar-binnen').addEventListener('click', binnengaan);
    document.getElementById('naar-buiten').addEventListener('click', (e) => { e.preventDefault(); naarBuiten(); });
    kamerScroll.addEventListener('scroll', () => { if (hint) hint.classList.add('weg'); verbergLabel(); }, { passive: true });
    window.addEventListener('resize', centreer);

    // zachte diepte bij het bewegen van de muis
    toneel.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || rustig()) return;
      const r = toneel.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      toneel.style.setProperty('--px', dx.toFixed(3));
      toneel.style.setProperty('--py', dy.toFixed(3));
    });
  }

  function centreer() {
    if (!kamerScroll) return;
    const over = kamerScroll.scrollWidth - kamerScroll.clientWidth;
    if (over > 0) kamerScroll.scrollLeft = over / 2;
  }

  function toonLabel(v) {
    if (!label || bezig) return;
    const r = v.getBoundingClientRect(), t = toneel.getBoundingClientRect();
    label.textContent = v.getAttribute('data-label');
    label.hidden = false;
    const x = Math.min(t.width - 90, Math.max(90, r.left + r.width / 2 - t.left));
    const y = Math.max(44, r.top - t.top - 8);
    label.style.left = x + 'px';
    label.style.top = y + 'px';
  }
  function verbergLabel() { if (label) label.hidden = true; }

  function zoomWaarden(v) {
    const t = toneel.getBoundingClientRect();
    const s0 = kamerSvg.getBoundingClientRect();
    const r = v.getBoundingClientRect();
    const cx = r.left + r.width / 2 - s0.left, cy = r.top + r.height / 2 - s0.top;
    const s = Math.min(t.width * 0.9 / r.width, t.height * 0.9 / r.height, 7);
    const tx = t.left + t.width / 2 - s0.left - s * cx, ty = t.top + t.height / 2 - s0.top - s * cy;
    return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(3)})`;
  }

  function zoomNaar(v) {
    if (bezig) return;
    const spel = v.getAttribute('data-spel');
    verbergLabel();
    if (rustig()) { location.hash = '#' + spel; return; }
    bezig = true;
    kamerSvg.getAnimations().forEach((a) => a.cancel());
    const doel = zoomWaarden(v);
    Geluid.woesj();
    kamerSvg.classList.add('zoomt');
    kamerSvg.animate([{ transform: 'translate(0px, 0px) scale(1)' }, { transform: doel }], { duration: 950, easing: 'cubic-bezier(.65,0,.3,1)', fill: 'forwards' });
    sluier.style.background = 'var(--grond)';
    sluier.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: 950, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => {
      location.hash = '#' + spel;
      bezig = false;
    }, 960);
  }

  function terugUit(spel) {
    bouw();
    if (gevel.hidden === false) return;
    if (kamer.hidden) { zetBinnen(true); toonKamer(); }
    const v = kamerSvg.querySelector(`[data-spel="${spel}"]`);
    kamerSvg.getAnimations().forEach((a) => a.cancel());
    sluier.getAnimations().forEach((a) => a.cancel());
    if (!v || rustig()) { kamerSvg.classList.remove('zoomt'); return; }
    centreerOp(v);
    const van = zoomWaarden(v);
    kamerSvg.classList.add('zoomt');
    const anim = kamerSvg.animate([{ transform: van }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: 850, easing: 'cubic-bezier(.3,0,.25,1)' });
    sluier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = () => kamerSvg.classList.remove('zoomt');
  }

  function centreerOp(v) {
    const over = kamerScroll.scrollWidth - kamerScroll.clientWidth;
    if (over <= 0) return;
    const r = v.getBoundingClientRect(), s = kamerScroll.getBoundingClientRect();
    kamerScroll.scrollLeft += (r.left + r.width / 2) - (s.left + s.width / 2);
  }

  function toonKamer() {
    gevel.hidden = true;
    kamer.hidden = false;
    centreer();
  }

  function toonGevel() {
    kamer.hidden = true;
    gevel.hidden = false;
    gevelSvg.getAnimations().forEach((a) => a.cancel());
    const blad = gevelSvg.querySelector('#deur-blad');
    blad.getAnimations().forEach((a) => a.cancel());
  }

  function binnengaan() {
    if (bezig) return;
    zetBinnen(true);
    if (rustig()) { toonKamer(); return; }
    bezig = true;
    const blad = gevelSvg.querySelector('#deur-blad');
    const deurKlik = gevelSvg.querySelector('.deur-klik');
    Geluid.deur();
    blad.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.12)' }], { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
    const t = toneel.getBoundingClientRect(), s0 = gevelSvg.getBoundingClientRect(), r = deurKlik.getBoundingClientRect();
    const cx = r.left + r.width / 2 - s0.left, cy = r.top + r.height / 2 - s0.top;
    const s = Math.min(t.height * 1.6 / r.height, 14);
    const tx = t.left + t.width / 2 - s0.left - s * cx, ty = t.top + t.height / 2 - s0.top - s * cy;
    setTimeout(() => {
      Geluid.woesj();
      gevelSvg.animate([{ transform: 'translate(0px,0px) scale(1)' }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], { duration: 1100, easing: 'cubic-bezier(.7,0,.35,1)', fill: 'forwards' });
      sluier.style.background = '#F7E3B5';
      sluier.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: 1100, easing: 'ease-in', fill: 'forwards' });
    }, 500);
    setTimeout(() => {
      toonKamer();
      kamerSvg.getAnimations().forEach((a) => a.cancel());
      kamerSvg.classList.add('zoomt');
      const a = kamerSvg.animate([{ transform: 'scale(1.18)', filter: 'blur(3px)' }, { transform: 'scale(1)', filter: 'blur(0px)' }], { duration: 1300, easing: 'cubic-bezier(.2,.7,.2,1)' });
      a.onfinish = () => kamerSvg.classList.remove('zoomt');
      sluier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
      bezig = false;
      if (hint) hint.classList.remove('weg');
    }, 1620);
  }

  function naarBuiten() {
    zetBinnen(false);
    toonGevel();
    sluier.getAnimations().forEach((a) => a.cancel());
    sluier.style.opacity = 0;
    if (!rustig()) gevelSvg.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' });
    toneel.scrollIntoView({ behavior: rustig() ? 'auto' : 'smooth', block: 'start' });
  }

  window.Huis = {
    toon() {
      bouw();
      if (isBinnen()) toonKamer(); else toonGevel();
    },
    terugUit
  };
})();
