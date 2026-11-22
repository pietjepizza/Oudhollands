/* Het Speelhuys: een grachtenpand met trapgevel en een 17e-eeuwse voorkamer (naar Vermeer en De Hooch)
   waarin de spellen aan de muur hangen. Klik op een spel en de kamer zoomt erin.
   Met de duiten die je verdient knap je de kamer op: elke klus verandert iets zichtbaars. */
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
  // DE KAMER
  // De kamer bestaat in twee indelingen: breed (1600 x 1000, voor computers en tablets) en staand
  // (900 x 1600, voor de iPhone). De muren, het raam, de vloer en het licht worden per indeling
  // opnieuw berekend; de voorwerpen worden getekend in de maten van de brede kamer en in de
  // staande kamer met een verschuiving en schaal op hun plek gezet.
  // ============================================================
  const F = 1000, ZB = 1000;
  const VX = 800, VY = 445, HW = 520, HH = 330;
  const P = (X, Y, Z) => [VX + F * X / Z, VY + F * Y / Z]; // projectie van de brede kamer, voor de voorwerpen
  const BLAUW = '#1C3473';
  const plaats = (anker, doel, s) => `translate(${(doel[0] - s * anker[0]).toFixed(1)} ${(doel[1] - s * anker[1]).toFixed(1)}) scale(${s})`;

  const INDELINGEN = {
    breed: {
      naam: 'breed', b: 1600, h: 1000, VX: 800, VY: 445, HW: 520, HH: 330, ZV: 560,
      balken: [-390, -130, 130, 390],
      raam: { z0: 690, z1: 930, y0: -210, y1: 150 },
      deur: { z0: 694, z1: 912, top: -64 },
      licht: [1, 0.7, 0.5],
      plaats: { knikkers: 'translate(220 -6)' }
    },
    staand: {
      naam: 'staand', b: 900, h: 1600, VX: 450, VY: 690, HW: 330, HH: 490, ZV: 520,
      balken: [-250, -85, 85, 250],
      raam: { z0: 760, z1: 960, y0: -300, y1: 170 },
      deur: { z0: 760, z1: 950, top: -120 },
      licht: [1, 0.75, 0.45],
      plaats: {
        kroon: plaats([800, 0], [450, 20], 1.1),
        ganzenbord: plaats([800, 208], [450, 262], 1.22),
        sjoelbak: plaats([1025, 186], [712, 262], 1.05),
        kopvanjut: plaats([1176, 169], [192, 262], 0.8),
        rek: plaats([365, 372], [192, 430], 0.78),
        molenspel: plaats([550, 292], [240, 735], 1.05),
        uilenspel: plaats([360, 173], [440, 755], 0.9),
        hoepel: plaats([1190, 386], [622, 760], 1.0),
        plank: plaats([1196, 588], [628, 1010], 1.0),
        kolf: plaats([1290, 775], [764, 1180], 1.05),
        tafel: plaats([60, 945], [-30, 1300], 0.75),
        knikkers: plaats([918, 880], [470, 1250], 0.85),
        kat: plaats([1390, 925], [720, 1265], 0.8),
        koek: plaats([1290, -10], [800, -10], 1.0),
        schoen: plaats([1056, 783], [604, 1188], 0.85)
      }
    }
  };
  Object.values(INDELINGEN).forEach((L) => { L.P = (X, Y, Z) => [L.VX + F * X / Z, L.VY + F * Y / Z]; });

  // Waar valt het zonlicht door het raam? Elk punt van het raam wordt langs de lichtrichting
  // doorgetrokken tot het de achterwand of de vloer raakt.
  function lichtvlekken(L) {
    const hw = L.HW, hh = L.HH, r = L.raam, [dx, dy, dz] = L.licht;
    const raak = (Z0, Y0) => { const tw = (ZB - Z0) / dz, tf = (hh - Y0) / dy; return { tw, tf, w: tw <= tf }; };
    const wand = [], vloer = [];
    const hoeken = [[r.z0, r.y0], [r.z1, r.y0], [r.z1, r.y1], [r.z0, r.y1]];
    for (let e = 0; e < 4; e++) {
      const [za, ya] = hoeken[e], [zb, yb] = hoeken[(e + 1) % 4];
      let vorige = null, vZ = 0;
      for (let i = 0; i <= 24; i++) {
        const Z0 = za + (zb - za) * i / 24, Y0 = ya + (yb - ya) * i / 24;
        const h = raak(Z0, Y0);
        if (vorige && vorige.w !== h.w) {
          const dp = vorige.tw - vorige.tf, dc = h.tw - h.tf, s = dp / (dp - dc);
          const t = (ZB - (vZ + (Z0 - vZ) * s)) / dz;
          const grens = [Math.min(hw, -hw + dx * t), hh, ZB];
          wand.push(grens); vloer.push(grens);
        }
        if (h.w) wand.push([Math.min(hw, -hw + dx * h.tw), Math.max(-hh, Y0 + dy * h.tw), ZB]);
        else vloer.push([Math.min(hw, -hw + dx * h.tf), hh, Z0 + dz * h.tf]);
        vorige = h; vZ = Z0;
      }
    }
    const scherm = (lijst) => (lijst.length >= 3 ? omhulsel(lijst.map((p) => L.P(p[0], p[1], p[2]))) : []);
    return { wand: scherm(wand), vloer: scherm(vloer) };
  }

  function bouwVoorkamer(L) {
    zaad = 4242;
    const Q = L.P, hw = L.HW, hh = L.HH, zv = L.ZV;
    const svg = el('svg', { viewBox: `0 0 ${L.b} ${L.h}`, class: 'kamer-svg', preserveAspectRatio: 'xMidYMid slice', role: 'group', 'data-indeling': L.naam, 'data-kamer': 'voorkamer', 'aria-label': 'De voorkamer van Het Speelhuys. Aan de muur hangen de spellen.' });
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
    verloop(defs, 'h-vlek', 'radialGradient', { cx: '42%', cy: '55%', r: '60%' }, [[0, '#FFF3D2', 0.75], [0.6, '#FFF3D2', 0.3], [1, '#FFF3D2', 0]]);
    verloop(defs, 'h-vlek-warm', 'radialGradient', { cx: '50%', cy: '50%', r: '55%' }, [[0, '#FFDFA0', 0.6], [1, '#FFDFA0', 0]]);
    verloop(defs, 'h-schaduwvlek', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#1A0F06', 0.45], [1, '#1A0F06', 0]]);
    verloop(defs, 'h-vocht', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#3B3122', 0.55], [0.7, '#3B3122', 0.25], [1, '#3B3122', 0]]);
    verloop(defs, 'h-stof', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#9A917F', 0.85], [1, '#9A917F', 0]]);
    patroonUitTextuur(defs, 'h-pleister', textuur('pleister', 256, 256, korrel([120, 96, 60], 0.1)), 256, 256);
    const marmerUrl = textuur('marmer', 640, 320, marmer);
    vervaag(defs, 'h-schaduw', 6);
    vervaag(defs, 'h-zacht', 2.5);
    const tp = el('pattern', { id: 'h-tapijt', width: 44, height: 44, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 44, height: 44, fill: '#7B2620' }, tp);
    el('path', { d: 'M22 3 L41 22 L22 41 L3 22 Z', fill: '#2B3C68' }, tp);
    el('path', { d: 'M22 12 L32 22 L22 32 L12 22 Z', fill: '#C99A3E' }, tp);
    el('circle', { cx: 22, cy: 22, r: 3, fill: '#7B2620' }, tp);
    el('path', { d: 'M0 0 L6 0 L0 6 Z M44 0 L38 0 L44 6 Z M0 44 L6 44 L0 38 Z M44 44 L38 44 L44 38 Z', fill: '#E0C27A' }, tp);
    const tp2 = el('pattern', { id: 'h-tapijt-plat', width: 44, height: 44, patternUnits: 'userSpaceOnUse', patternTransform: 'scale(1 .42)' }, defs);
    Array.from(tp.childNodes).forEach((n) => tp2.appendChild(n.cloneNode(true)));

    const plek = (sleutel, ouder) => (L.plaats[sleutel] ? el('g', { transform: L.plaats[sleutel] }, ouder) : ouder);
    const voor = (id, ouder, extra) => el('g', Object.assign({ 'data-voor': id }, extra || {}), ouder);
    const na = (id, ouder, extra) => el('g', Object.assign({ 'data-na': id }, extra || {}), ouder);

    const vloer = [Q(-hw, hh, ZB), Q(hw, hh, ZB), Q(hw, hh, zv), Q(-hw, hh, zv)];
    const vloerClip = el('clipPath', { id: 'h-vloerclip' }, defs);
    veelhoek(vloer, {}, vloerClip);
    const r = L.raam, W = (Z, Y) => Q(-hw, Y, Z);
    const glas = [W(r.z0, r.y0), W(r.z1, r.y0), W(r.z1, r.y1), W(r.z0, r.y1)];
    const raamClip = el('clipPath', { id: 'h-raamclip' }, defs);
    veelhoek(glas, {}, raamClip);
    const lv = lichtvlekken(L);
    // zacht licht: de vorm wordt één keer wazig op een canvas getekend (zonder dure SVG-filters)
    const zacht = (naam, punten, kleur, van, tot, a0, a1, blur) => (punten.length < 3 ? '' : textuur(`${naam}-${L.naam}`, Math.round(L.b / 2), Math.round(L.h / 2), (g, cb) => {
      const k = 0.5, d = cb + 100;
      g.shadowColor = kleur; g.shadowBlur = blur * k; g.shadowOffsetX = d;
      const gr = g.createLinearGradient(van[0] * k - d, van[1] * k, tot[0] * k - d, tot[1] * k);
      gr.addColorStop(0, `rgba(0,0,0,${a0})`); gr.addColorStop(1, `rgba(0,0,0,${a1})`);
      g.fillStyle = gr;
      g.beginPath();
      punten.forEach(([x, y], i) => (i ? g.lineTo(x * k - d, y * k) : g.moveTo(x * k - d, y * k)));
      g.closePath(); g.fill();
    }));
    const randen = (lijst) => lijst.reduce((m, p) => [Math.min(m[0], p[0]), Math.min(m[1], p[1]), Math.max(m[2], p[0]), Math.max(m[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
    const lichtBeeld = (url, ouder, klasse) => el('image', { href: url, x: 0, y: 0, width: L.b, height: L.h, preserveAspectRatio: 'none', class: klasse }, ouder);
    const achterClip = el('clipPath', { id: 'h-achterclip' }, defs);
    veelhoek([Q(-hw, -hh, ZB), Q(hw, -hh, ZB), Q(hw, hh, ZB), Q(-hw, hh, ZB)], {}, achterClip);

    // ---------- Plafond met balken ----------
    const plafond = el('g', {}, svg);
    veelhoek([Q(-hw, -hh, ZB), Q(hw, -hh, ZB), Q(hw, -hh, zv), Q(-hw, -hh, zv)], { fill: 'url(#h-plafond)' }, plafond);
    for (let X = -hw + 26; X < hw; X += 52) {
      const a = Q(X, -hh, ZB), b = Q(X, -hh, zv);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1A120B', 'stroke-opacity': 0.45, 'stroke-width': 1.2 }, plafond);
    }
    L.balken.forEach((X) => {
      const b = 22, h = 30, zx = X < 0 ? X + b : X - b;
      veelhoek([Q(zx, -hh, ZB), Q(zx, -hh + h, ZB), Q(zx, -hh + h, zv), Q(zx, -hh, zv)], { fill: '#1C130C' }, plafond);
      veelhoek([Q(X - b, -hh + h, ZB), Q(X + b, -hh + h, ZB), Q(X + b, -hh + h, zv), Q(X - b, -hh + h, zv)], { fill: '#3D2C1E' }, plafond);
    });

    // ---------- Achterwand ----------
    const muur = el('g', {}, svg);
    const achter = [Q(-hw, -hh, ZB), Q(hw, -hh, ZB), Q(hw, hh, ZB), Q(-hw, hh, ZB)];
    veelhoek(achter, { fill: 'url(#h-muur)' }, muur);
    veelhoek(achter, { fill: 'url(#h-pleister)' }, muur);
    muurVuil(voor('muren', muur, { 'data-vonk': 'muren' }), achter, [
      [Q(-hw + 90, hh - 110, ZB), 150, 95], [Q(hw - 130, hh - 80, ZB), 130, 80], [Q(-40, -hh + 70, ZB), 170, 60], [Q(hw * 0.62, -hh * 0.62, ZB), 80, 110]
    ], [Q(hw * 0.04, hh * 0.59, ZB)], [Q(hw * 0.15, -hh + 34, ZB), Q(hw - 25, hh * 0.2, ZB)]);
    veelhoek([Q(-hw - 14, -hh, ZB - 26), Q(hw + 14, -hh, ZB - 26), Q(hw + 14, -hh + 30, ZB - 26), Q(-hw - 14, -hh + 30, ZB - 26)], { fill: '#3A2A1C' }, muur);
    veelhoek([Q(-hw, -hh + 30, ZB), Q(hw, -hh + 30, ZB), Q(hw + 14, -hh + 30, ZB - 26), Q(-hw - 14, -hh + 30, ZB - 26)], { fill: '#24180F' }, muur);
    if (lv.wand.length) {
      const rw = randen(lv.wand);
      const url = zacht('wandvlek', lv.wand, '#FFF1CC', [rw[0], rw[1]], [rw[2], rw[3]], 0.85, 0.35, 44);
      const vlek = na('ramen', muur, { 'data-vonk': 'ramen', 'clip-path': 'url(#h-achterclip)' });
      if (url) lichtBeeld(url, vlek, 'zonvlek'); else veelhoek(lv.wand, { fill: 'url(#h-vlek)', class: 'zonvlek' }, vlek);
    }

    // ---------- Linkerwand met glas-in-loodraam ----------
    const links = el('g', {}, svg);
    const linkerwand = [Q(-hw, -hh, ZB), Q(-hw, -hh, zv), Q(-hw, hh, zv), Q(-hw, hh, ZB)];
    veelhoek(linkerwand, { fill: 'url(#h-muur-l)' }, links);
    muurVuil(voor('muren', links), linkerwand, [[W((r.z0 + r.z1) / 2, r.y1 + 70), 60, 90]], [], []);
    veelhoek([W(r.z0 - 22, r.y0 - 22), W(r.z1 + 22, r.y0 - 22), W(r.z1 + 22, r.y1 + 22), W(r.z0 - 22, r.y1 + 22)], { fill: '#3A291C' }, links);
    veelhoek(glas, { fill: 'url(#h-glas)' }, links);
    const lood = el('g', { 'clip-path': 'url(#h-raamclip)', stroke: '#55534C', 'stroke-width': 1.3, 'stroke-opacity': 0.75 }, links);
    const zm = (r.z0 + r.z1) / 2, bereik = 2 * hh + 400;
    for (let c = -bereik; c <= bereik; c += 30) {
      [1.3, -1.3].forEach((k) => {
        const a = W(r.z0 - 120, c + (r.z0 - 120 - zm) * k), b = W(r.z1 + 120, c + (r.z1 + 120 - zm) * k);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, lood);
      });
    }
    const ym = r.y0 + (r.y1 - r.y0) * 0.4;
    veelhoek([W(zm - 6, r.y0), W(zm + 6, r.y0), W(zm + 6, r.y1), W(zm - 6, r.y1)], { fill: '#3A291C' }, links);
    veelhoek([W(r.z0, ym - 6), W(r.z1, ym - 6), W(r.z1, ym + 6), W(r.z0, ym + 6)], { fill: '#3A291C' }, links);
    veelhoek([W(r.z0 - 22, r.y1), W(r.z1 + 22, r.y1), Q(-hw + 34, r.y1, r.z1 + 22), Q(-hw + 34, r.y1, r.z0 - 22)], { fill: '#E4D8C0' }, links);
    // vuile ruiten
    const raamVuil = voor('ramen', links, { 'data-doel': 'ramen', 'data-vonk': 'ramen' });
    veelhoek(glas, { fill: '#6F664D', opacity: 0.8 }, raamVuil);
    const vlekjes = el('g', { 'clip-path': 'url(#h-raamclip)' }, raamVuil);
    for (let i = 0; i < 9; i++) {
      const p = W(r.z0 + rnd() * (r.z1 - r.z0), r.y0 + rnd() * (r.y1 - r.y0));
      el('ellipse', { cx: p[0], cy: p[1], rx: 6 + rnd() * 14, ry: 8 + rnd() * 20, fill: rnd() > 0.5 ? '#4E4634' : '#9C9274', opacity: 0.45 }, vlekjes);
    }
    const b1 = W(r.z0 + (r.z1 - r.z0) * 0.25, r.y0 + (r.y1 - r.y0) * 0.2), b2 = W(r.z0 + (r.z1 - r.z0) * 0.4, r.y0 + (r.y1 - r.y0) * 0.33), b3 = W(r.z0 + (r.z1 - r.z0) * 0.3, r.y0 + (r.y1 - r.y0) * 0.45);
    el('path', { d: `M${pt(b1)} L${pt(b2)} L${pt(b3)}`, fill: 'none', stroke: '#E8E2D0', 'stroke-width': 1.2, opacity: 0.7 }, raamVuil);

    // ---------- Rechterwand met deur naar de gang ----------
    const rechts = el('g', {}, svg);
    const rechterwand = [Q(hw, -hh, ZB), Q(hw, -hh, zv), Q(hw, hh, zv), Q(hw, hh, ZB)];
    veelhoek(rechterwand, { fill: 'url(#h-muur-r)' }, rechts);
    muurVuil(voor('muren', rechts), rechterwand, [[Q(hw, hh - 60, L.deur.z1 + 40), 50, 70]], [], []);
    const D = (Z, Y) => Q(hw, Y, Z), dr = L.deur, dz = dr.z1 - dr.z0;
    veelhoek([D(dr.z0, dr.top), D(dr.z1, dr.top), D(dr.z1, hh), D(dr.z0, hh)], { fill: '#2C1E14' }, rechts);
    veelhoek([D(dr.z0 + 14, dr.top + 14), D(dr.z1 - 14, dr.top + 14), D(dr.z1 - 14, hh), D(dr.z0 + 14, hh)], { fill: 'url(#h-gang)', class: 'gangLicht' }, rechts);
    const blad = voor('trap', rechts, { 'data-doel': 'trap' });
    const bz = dr.z0 + dz * 0.22;
    veelhoek([D(bz, dr.top + 14), D(dr.z1 - 14, dr.top + 14), D(dr.z1 - 14, hh), D(bz, hh)], { fill: '#4A3121' }, blad);
    const dh = hh - dr.top;
    veelhoek([D(bz + 16, dr.top + dh * 0.06), D(dr.z1 - 30, dr.top + dh * 0.06), D(dr.z1 - 30, dr.top + dh * 0.44), D(bz + 16, dr.top + dh * 0.44)], { fill: 'none', stroke: '#2B1B10', 'stroke-width': 3 }, blad);
    veelhoek([D(bz + 16, dr.top + dh * 0.52), D(dr.z1 - 30, dr.top + dh * 0.52), D(dr.z1 - 30, dr.top + dh * 0.94), D(bz + 16, dr.top + dh * 0.94)], { fill: 'none', stroke: '#2B1B10', 'stroke-width': 3 }, blad);
    const knop = D(bz + 26, dr.top + dh * 0.48);
    el('circle', { cx: knop[0], cy: knop[1], r: 5, fill: 'url(#h-messing)' }, blad);
    bouwTrapDeur(rechts, L, D, dr, hw, hh, defs);

    // ---------- Plint: eerst een versleten houten plint, later Delftse tegels ----------
    const plint = el('g', {}, svg);
    const ts = (2 * hw) / Math.round((2 * hw) / 65);
    const tegels = na('plint', plint, { 'data-vonk': 'plint' });
    const motieven = ['ill-gans', 'ill-tol', 'ill-hoepel', 'ill-knikkers', 'ill-kolf', 'ill-uil', 'ill-koek', 'ill-kaarten', 'ill-sjoelbak', 'ill-molen'];
    const [px0, py0] = Q(-hw, hh - ts, ZB);
    for (let i = 0; i < Math.round((2 * hw) / ts); i++) {
      const x = px0 + i * ts, y = py0;
      el('rect', { x, y, width: ts, height: ts, fill: '#F4F1E8', stroke: '#B7B09E', 'stroke-width': 1 }, tegels);
      el('use', { href: '#hoeken', x, y, width: ts, height: ts, style: 'color:' + BLAUW, opacity: 0.85 }, tegels);
      el('use', { href: '#' + motieven[i % motieven.length], x: x + ts * 0.2, y: y + ts * 0.17, width: ts * 0.6, height: ts * 0.6, style: 'color:' + BLAUW, stroke: BLAUW, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, tegels);
    }
    for (let Z = ZB; Z > zv; Z -= ts) {
      veelhoek([Q(-hw, hh - ts, Z), Q(-hw, hh - ts, Z - ts), Q(-hw, hh, Z - ts), Q(-hw, hh, Z)], { fill: '#D9D3C3', stroke: '#9D9684', 'stroke-width': 1 }, tegels);
      const m = Q(-hw, hh - ts / 2, Z - ts / 2);
      el('circle', { cx: m[0], cy: m[1], r: 4 * 1000 / Z, fill: 'none', stroke: BLAUW, 'stroke-width': 1.5, opacity: 0.7 }, tegels);
      if (Z - ts >= dr.z1 || Z <= dr.z0) {
        veelhoek([Q(hw, hh - ts, Z), Q(hw, hh - ts, Z - ts), Q(hw, hh, Z - ts), Q(hw, hh, Z)], { fill: '#EAE5D7', stroke: '#B0A996', 'stroke-width': 1 }, tegels);
      }
    }
    const houtenPlint = voor('plint', plint);
    const ph = 26;
    veelhoek([Q(-hw, hh - ph, ZB), Q(hw, hh - ph, ZB), Q(hw, hh, ZB), Q(-hw, hh, ZB)], { fill: '#5A4330' }, houtenPlint);
    veelhoek([Q(-hw, hh - ph, ZB), Q(hw, hh - ph, ZB), Q(hw, hh - ph + 4, ZB), Q(-hw, hh - ph + 4, ZB)], { fill: '#7C6047' }, houtenPlint);
    veelhoek([Q(-hw, hh - ph, ZB), Q(-hw, hh - ph, zv), Q(-hw, hh, zv), Q(-hw, hh, ZB)], { fill: '#46331F' }, houtenPlint);
    veelhoek([Q(hw, hh - ph, ZB), Q(hw, hh - ph, dr.z1), Q(hw, hh, dr.z1), Q(hw, hh, ZB)], { fill: '#46331F' }, houtenPlint);
    for (let i = 0; i < 7; i++) {
      const x = -hw + 40 + rnd() * (2 * hw - 80), a = Q(x, hh - ph + 8 + rnd() * 10, ZB);
      el('path', { d: `M${pt(a)} l ${10 + rnd() * 30} ${rnd() * 4 - 2}`, stroke: '#2E2114', 'stroke-width': 1.4, opacity: 0.6 }, houtenPlint);
    }
    el('line', { x1: px0, y1: Q(0, hh, ZB)[1], x2: px0 + 2 * hw, y2: Q(0, hh, ZB)[1], stroke: '#2B1E14', 'stroke-width': 4 }, plint);

    // ---------- Marmeren vloer ----------
    const vl = el('g', { 'clip-path': 'url(#h-vloerclip)' }, svg);
    veelhoek(vloer, { fill: '#E6E0D2' }, vl);
    const s = 95;
    for (let i = -8; i <= 8; i++) {
      for (let j = -1; j <= 7; j++) {
        if (((i + j) % 2 + 2) % 2 !== 0 || Math.abs(i) % 2 !== 1) continue;
        const X = i * s, Z = ZB - j * s;
        if (Z - s <= 0) continue;
        veelhoek([Q(X, hh, Z + s), Q(X + s, hh, Z), Q(X, hh, Z - s), Q(X - s, hh, Z)], { fill: '#24201D' }, vl);
      }
    }
    const vy0 = Q(0, hh, ZB)[1];
    if (marmerUrl) el('image', { href: marmerUrl, x: -200, y: vy0 - 5, width: L.b + 400, height: L.h - vy0 + 80, preserveAspectRatio: 'none', opacity: 0.8 }, vl);
    veelhoek(vloer, { fill: 'url(#h-vloerglans)' }, vl);
    if (lv.vloer.length) {
      const rv = randen(lv.vloer);
      const url = zacht('vloervlek', lv.vloer, '#FFF1CC', [rv[0], rv[1]], [rv[2], rv[3]], 0.75, 0.3, 36);
      if (url) lichtBeeld(url, na('ramen', vl), 'zonvlek'); else veelhoek(lv.vloer, { fill: 'url(#h-vlek)', class: 'zonvlek' }, na('ramen', vl));
    }
    veelhoek([Q(hw, hh, dr.z0 + 14), Q(hw, hh, dr.z0 + dz * 0.22), Q(hw - 140, hh, dr.z0), Q(hw - 190, hh, dr.z0 - 80)], { fill: 'url(#h-vlek-warm)' }, vl);
    // doffe, vuile vloer
    const vloerVuil = voor('vloer', vl, { 'data-vonk': 'vloer' });
    veelhoek(vloer, { fill: '#5B5040', opacity: 0.5 }, vloerVuil);
    for (let i = 0; i < 14; i++) {
      const p = Q(-hw + rnd() * 2 * hw, hh, zv + 60 + rnd() * (ZB - zv - 80));
      el('path', { d: `M${pt(p)} q ${12 + rnd() * 20} ${-4 + rnd() * 8} ${30 + rnd() * 30} ${rnd() * 6 - 3}`, fill: 'none', stroke: '#3B3226', 'stroke-width': 1.5 + rnd() * 2, opacity: 0.35, 'stroke-linecap': 'round' }, vloerVuil);
    }
    // glimmende vloer: twinkelende lichtpuntjes
    const glim = na('vloer', vl);
    for (let i = 0; i < 6; i++) {
      const p = Q(-hw * 0.8 + rnd() * hw * 1.6, hh, zv + 80 + rnd() * (ZB - zv - 120));
      el('path', { d: `M${p[0]} ${p[1] - 9} L${p[0] + 2} ${p[1] - 2} L${p[0] + 9} ${p[1]} L${p[0] + 2} ${p[1] + 2} L${p[0]} ${p[1] + 9} L${p[0] - 2} ${p[1] + 2} L${p[0] - 9} ${p[1]} L${p[0] - 2} ${p[1] - 2} Z`, fill: '#FFFFFF', class: 'glim', style: `animation-delay:-${(rnd() * 4).toFixed(1)}s` }, glim);
    }

    // ---------- Aan de muur ----------
    const wand = el('g', { class: 'wand' }, svg);
    bouwRek(plek('rek', wand));
    bouwGanzenbord(plek('ganzenbord', wand));
    bouwMolenspel(plek('molenspel', wand));
    bouwSjoelbak(plek('sjoelbak', wand));
    bouwPrent(plek('uilenspel', wand), { x: 300, y: 180, b: 120, h: 140, naam: 'Uilenspel', ill: 'ill-uil', gordijn: '#3F5B3B' });
    bouwPrent(plek('kopvanjut', wand), { x: 1112, y: 176, b: 128, h: 144, naam: 'Kop van Jut', ill: 'ill-jut', gordijn: '#7A2E28' });
    bouwHoepel(plek('hoepel', wand));
    bouwPlank(plek('plank', wand));

    // ---------- Lichtbundel en stofjes (na het lappen van de ramen) ----------
    const lichtNa = na('ramen', svg);
    const bundel = omhulsel(glas.concat(lv.wand, lv.vloer));
    const gemPunt = (lijst) => lijst.reduce((a, p) => [a[0] + p[0] / lijst.length, a[1] + p[1] / lijst.length], [0, 0]);
    const bundelUrl = zacht('bundel', bundel, '#FFF6DA', gemPunt(glas), gemPunt(lv.wand.concat(lv.vloer).length ? lv.wand.concat(lv.vloer) : glas), 0.62, 0.02, 34);
    if (bundelUrl) lichtBeeld(bundelUrl, lichtNa, 'lichtbundel');
    else veelhoek(bundel, { fill: 'url(#h-licht)', opacity: 0.5, class: 'lichtbundel' }, lichtNa);
    const stof = el('g', { class: 'stof' }, lichtNa);
    const gem = (lijst) => lijst.reduce((a, p) => [a[0] + p[0] / lijst.length, a[1] + p[1] / lijst.length], [0, 0]);
    const van = gem(glas), doelPunt = gem(lv.wand.concat(lv.vloer).length ? lv.wand.concat(lv.vloer) : glas);
    const spreiding = L.b * 0.16;
    for (let i = 0; i < 46; i++) {
      const t = rnd();
      const x = van[0] + (doelPunt[0] - van[0]) * t + (rnd() - 0.5) * spreiding * (0.3 + t);
      const y = van[1] + (doelPunt[1] - van[1]) * t + (rnd() - 0.5) * spreiding * (0.3 + t);
      el('circle', {
        cx: x.toFixed(1), cy: y.toFixed(1), r: (0.8 + rnd() * 1.8).toFixed(2), fill: '#FFF8E6', class: 'stofje',
        style: `--dx:${((rnd() - 0.5) * 40).toFixed(1)}px;--dy:${((rnd() - 0.6) * 46).toFixed(1)}px;animation-duration:${(6 + rnd() * 9).toFixed(1)}s;animation-delay:-${(rnd() * 12).toFixed(1)}s`
      }, stof);
    }

    // ---------- Voorgrond ----------
    bouwKolf(plek('kolf', svg));
    bouwTafel(plek('tafel', svg));
    bouwKnikkers(plek('knikkers', svg));
    bouwKat(plek('kat', svg));
    bouwKoek(plek('koek', svg));
    bouwKroon(plek('kroon', svg));
    bouwSeizoenVoorkamer(svg, L, glas, defs);

    // ---------- Spinnenwebben en stof (voor de eerste klus) ----------
    const spinnen = voor('spinnen', svg);
    el('rect', { width: L.b, height: L.h, fill: '#8C8270', opacity: 0.14, 'pointer-events': 'none' }, spinnen);
    const hb = Q(-hw, -hh + 30, ZB), hr = Q(hw, -hh + 30, ZB);
    web(spinnen, hb[0], hb[1], 95, 0, Math.PI / 2);
    web(spinnen, hr[0], hr[1], 85, Math.PI / 2, Math.PI);
    const rw = W(r.z1, r.y0);
    web(spinnen, rw[0] - 2, rw[1], 55, Math.PI * 0.55, Math.PI * 0.98);
    const dw = D(dr.z0, dr.top);
    web(spinnen, dw[0] + 4, dw[1], 45, Math.PI * 0.05, Math.PI * 0.48);
    const pl = Q(-hw, -hh, zv + 150);
    web(spinnen, pl[0] + 6, pl[1] + 6, 70, 0, Math.PI / 2);
    [[-hw + 70, ZB - 30, 1.1], [hw - 90, ZB - 24, 1], [hw * 0.2, ZB - 170, 1.3], [-hw * 0.35, ZB - 60, 0.9]].forEach(([X, Z, sch]) => {
      const p = Q(X, hh, Z);
      stofwolk(spinnen, p[0], p[1], sch * 1000 / Z);
    });

    // ---------- Schemer en vignet ----------
    el('rect', { width: L.b, height: L.h, fill: '#170E06', class: 'schemer', 'pointer-events': 'none' }, svg);
    el('rect', { width: L.b, height: L.h, fill: 'url(#h-vignet)', 'pointer-events': 'none' }, svg);
    return svg;
  }

  // Vuile, vochtige muur: grauwe waas, vochtplekken, scheuren en kale plekken waar de baksteen doorkomt.
  function muurVuil(ouder, vlak, vlekken, kaal, scheuren) {
    veelhoek(vlak, { fill: '#5F5848', opacity: 0.4 }, ouder);
    vlekken.forEach(([p, rx, ry]) => el('ellipse', { cx: p[0], cy: p[1], rx, ry, fill: 'url(#h-vocht)' }, ouder));
    kaal.forEach((p) => {
      const g = el('g', { transform: `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})` }, ouder);
      el('path', { d: 'M-34 -14 L-10 -24 L22 -18 L36 -2 L28 16 L-6 22 L-30 12 Z', fill: '#8C4A33' }, g);
      el('path', { d: 'M-30 -6 H32 M-28 6 H30 M-6 -20 V-6 M14 -6 V6 M-14 6 V18 M10 6 V18', stroke: '#C9B89C', 'stroke-width': 1.4, opacity: 0.8 }, g);
      el('path', { d: 'M-34 -14 L-10 -24 L22 -18 L36 -2 L28 16 L-6 22 L-30 12 Z', fill: 'none', stroke: '#B8A88A', 'stroke-width': 2 }, g);
    });
    scheuren.forEach((p) => {
      let d = `M${pt(p)}`, x = p[0], y = p[1];
      for (let i = 0; i < 7; i++) { x += rnd() * 16 - 8; y += 12 + rnd() * 14; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
      el('path', { d, fill: 'none', stroke: '#4A3F30', 'stroke-width': 1.6, opacity: 0.6, 'stroke-linejoin': 'round' }, ouder);
    });
  }

  function web(ouder, cx, cy, r, a0, a1) {
    const g = el('g', { class: 'web', 'data-vonk': 'spinnen', fill: 'none', stroke: '#F1ECE2', 'stroke-width': 0.9, 'stroke-opacity': 0.6 }, ouder);
    const n = 6, hoeken = [];
    for (let i = 0; i < n; i++) hoeken.push(a0 + (a1 - a0) * i / (n - 1));
    hoeken.forEach((a) => el('line', { x1: cx, y1: cy, x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a) }, g));
    for (let k = 1; k <= 5; k++) {
      const rr = r * k / 5.4;
      let d = '';
      hoeken.forEach((a, i) => {
        const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
        if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
        else {
          const am = (a + hoeken[i - 1]) / 2, rm = rr * 0.85;
          d += ` Q${(cx + rm * Math.cos(am)).toFixed(1)} ${(cy + rm * Math.sin(am)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      });
      el('path', { d }, g);
    }
    const am = (a0 + a1) / 2;
    el('path', { d: `M${(cx + r * 0.7 * Math.cos(am)).toFixed(1)} ${(cy + r * 0.7 * Math.sin(am)).toFixed(1)} q 3 ${r * 0.3} -2 ${r * 0.55}`, 'stroke-opacity': 0.4 }, g);
    el('circle', { cx: cx + r * 0.45 * Math.cos(am), cy: cy + r * 0.45 * Math.sin(am), r: 2.2, fill: '#2A2018', stroke: 'none', opacity: 0.8 }, g);
  }

  function stofwolk(ouder, x, y, s) {
    const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})` }, ouder);
    el('ellipse', { cx: 0, cy: -4, rx: 18, ry: 8, fill: 'url(#h-stof)' }, g);
    el('ellipse', { cx: 10, cy: -6, rx: 10, ry: 6, fill: 'url(#h-stof)' }, g);
    el('path', { d: 'M-14 -6 q 3 -6 7 -2 M2 -10 q 4 -5 8 0 M10 -4 q 6 -2 8 2', fill: 'none', stroke: '#B3AA97', 'stroke-width': 1, opacity: 0.8 }, g);
  }

  // Een voorwerp is een link (speelbaar) of een groep (binnenkort); de binnenste groep beweegt bij hover.
  function voorwerp(ouder, opties) {
    let buiten;
    if (opties.spel) {
      buiten = el('a', { href: '#' + opties.spel, class: 'voorwerp speelbaar', 'data-spel': opties.spel, 'data-label': opties.label, 'aria-label': opties.label }, ouder);
    } else if (opties.kamer) {
      buiten = el('g', { class: 'voorwerp naar-kamer', tabindex: 0, role: 'button', 'data-kamer': opties.kamer, 'data-label': opties.label, 'aria-label': opties.label }, ouder);
    } else {
      buiten = el('g', { class: 'voorwerp binnenkort', tabindex: 0, role: 'button', 'data-label': opties.label, 'aria-label': opties.label }, ouder);
    }
    return el('g', { class: 'vw' }, buiten);
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
  function bord(ouder, cx, cy, r, motief) {
    el('circle', { cx: cx + 2, cy: cy + 3, r, fill: '#000', opacity: 0.25 }, ouder);
    el('circle', { cx, cy, r, fill: '#F4F1E8', stroke: '#B7B09E', 'stroke-width': 1 }, ouder);
    el('circle', { cx, cy, r: r * 0.9, fill: 'none', stroke: BLAUW, 'stroke-width': 1.7 }, ouder);
    el('circle', { cx, cy, r: r * 0.62, fill: 'none', stroke: BLAUW, 'stroke-width': 1, 'stroke-dasharray': '2 3' }, ouder);
    el('use', { href: '#' + motief, x: cx - r * 0.55, y: cy - r * 0.6, width: r * 1.1, height: r * 1.1, style: 'color:' + BLAUW, stroke: BLAUW, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ouder);
    el('ellipse', { cx: cx - r * 0.38, cy: cy - r * 0.42, rx: r * 0.3, ry: r * 0.13, fill: '#fff', opacity: 0.55, transform: `rotate(-35 ${(cx - r * 0.38).toFixed(1)} ${(cy - r * 0.42).toFixed(1)})` }, ouder);
  }

  function bouwGanzenbord(ouder) {
    const g = voorwerp(ouder, { spel: 'ganzenbord', label: 'Speel ganzenbord' });
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

  function bouwMolenspel(ouder) {
    const g = voorwerp(ouder, { spel: 'molenspel', label: 'Speel molenspel' });
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

  function bouwSjoelbak(ouder) {
    const g = voorwerp(ouder, { spel: 'sjoelen', label: 'Speel sjoelen' });
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
    [[x + 12, y - 2], [x + b - 12, y - 2]].forEach(([cx, cy]) => {
      el('circle', { cx: cx + 1, cy: cy + 2, r: 5, fill: '#000', opacity: 0.3 }, g);
      el('circle', { cx, cy, r: 5, fill: '#6B4423', stroke: '#3B2412' }, g);
    });
    naambordje(g, x + b / 2, y + h + 12, 'Sjoelen');
  }

  function bouwPrent(ouder, o) {
    // voor de klus: een lichte rand op de muur waar ooit een prent hing, en de spijker
    const leeg = el('g', { 'data-voor': 'prenten' }, ouder);
    el('rect', { x: o.x + 6, y: o.y + 6, width: o.b - 12, height: o.h - 12, fill: '#FFF8E8', opacity: 0.3 }, leeg);
    el('rect', { x: o.x + 6, y: o.y + 6, width: o.b - 12, height: o.h - 12, fill: 'none', stroke: '#8A7A5C', 'stroke-opacity': 0.3, 'stroke-width': 2 }, leeg);
    spijker(leeg, o.x + o.b / 2, o.y - 4);
    const hangt = el('g', { 'data-na': 'prenten', 'data-vonk': 'prenten' }, ouder);
    const g = voorwerp(hangt, { label: o.naam + ' · komt binnenkort' });
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

  // Bordenrek met vier Delfts blauwe borden (klus: Delfts servies)
  function bouwRek(ouder) {
    const g = el('g', { 'data-na': 'servies', 'data-doel': 'servies', 'data-vonk': 'servies' }, ouder);
    const x = 300, y = 372, b = 130, h = 168;
    schaduw(g, x, y, b, h);
    el('rect', { x, y, width: 8, height: h, fill: 'url(#h-eik)' }, g);
    el('rect', { x: x + b - 8, y, width: 8, height: h, fill: 'url(#h-eik)' }, g);
    el('path', { d: `M${x - 6} ${y} h${b + 12} l-6 12 h${-b} z`, fill: '#6B4726' }, g);
    [y + 84, y + 162].forEach((py) => {
      el('rect', { x: x + 4, y: py, width: b - 8, height: 8, fill: 'url(#h-eik)' }, g);
      el('rect', { x: x + 4, y: py - 12, width: b - 8, height: 3, fill: '#6B4726' }, g);
    });
    const motief = ['ill-gans', 'ill-molen', 'ill-tol', 'ill-hoepel'];
    [[x + 36, y + 54], [x + 94, y + 54], [x + 36, y + 132], [x + 94, y + 132]].forEach(([cx, cy], i) => bord(g, cx, cy, 26, motief[i]));
  }

  function bouwHoepel(ouder) {
    const g = voorwerp(ouder, { label: 'Hoepelen · komt binnenkort' });
    const h = el('g', { class: 'hoepel-hang' }, g);
    el('circle', { cx: 1198, cy: 460, r: 62, fill: 'none', stroke: '#2A1A0C', 'stroke-opacity': 0.35, 'stroke-width': 8, filter: 'url(#h-schaduw)' }, h);
    el('line', { x1: 1204, y1: 392, x2: 1246, y2: 548, stroke: '#5E3B1E', 'stroke-width': 5, 'stroke-linecap': 'round' }, h);
    el('circle', { cx: 1190, cy: 450, r: 62, fill: 'none', stroke: '#8A5A2E', 'stroke-width': 8 }, h);
    el('circle', { cx: 1190, cy: 450, r: 62, fill: 'none', stroke: '#D29E62', 'stroke-width': 2, 'stroke-dasharray': '30 14', opacity: 0.8 }, h);
    spijker(g, 1190, 386);
  }

  function bouwPlank(ouder) {
    // plank met een tol, een Delfts bord en een stapeltje sjoelschijven
    el('rect', { x: 1104, y: 598, width: 194, height: 10, fill: '#2A1A0C', opacity: 0.3, filter: 'url(#h-zacht)' }, ouder);
    el('rect', { x: 1098, y: 588, width: 196, height: 12, fill: 'url(#h-eik)' }, ouder);
    el('path', { d: 'M1116 600 l0 18 l14 -18 Z M1276 600 l0 18 l-14 -18 Z', fill: '#6B4726' }, ouder);
    const servies = el('g', { 'data-na': 'servies', 'data-vonk': 'servies' }, ouder);
    bord(servies, 1236, 564, 23, 'ill-gans');
    for (let i = 0; i < 6; i++) {
      el('ellipse', { cx: 1276, cy: 584 - i * 4.5, rx: 11, ry: 3.6, fill: i % 2 ? '#E0B77D' : '#D4A86C', stroke: '#8A5B2A', 'stroke-width': 0.7 }, ouder);
    }
    const g = voorwerp(ouder, { label: 'Tollen · komt binnenkort' });
    el('rect', { x: 1120, y: 534, width: 90, height: 56, fill: 'transparent' }, g);
    el('path', { d: 'M1131 559 Q1148 549 1165 559 L1150 586 L1146 586 Z', fill: '#B6452C', stroke: '#5A2215', 'stroke-width': 1 }, g);
    el('path', { d: 'M1134 564 Q1148 558 1162 564 L1159 570 Q1148 566 1137 570 Z', fill: BLAUW }, g);
    el('path', { d: 'M1141 574 Q1148 572 1155 574 L1152 580 L1144 580 Z', fill: '#E7C36A' }, g);
    el('ellipse', { cx: 1148, cy: 558, rx: 17, ry: 4, fill: '#D45A3C' }, g);
    el('rect', { x: 1146, y: 546, width: 4, height: 11, fill: '#6B4423' }, g);
    el('path', { d: 'M1170 586 q 14 -3 22 -16 M1192 570 q 6 10 -6 16', fill: 'none', stroke: '#4A3018', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
  }

  function bouwKolf(ouder) {
    // kolf en bal, tegen de achterwand in de rechterhoek
    const g = voorwerp(ouder, { label: 'Kolf op het ijs · komt binnenkort' });
    el('rect', { x: 1236, y: 500, width: 92, height: 290, fill: 'transparent' }, g);
    el('line', { x1: 1306, y1: 512, x2: 1290, y2: 766, stroke: '#2A1A0C', 'stroke-opacity': 0.25, 'stroke-width': 7, transform: 'translate(7 3)' }, g);
    el('line', { x1: 1306, y1: 512, x2: 1290, y2: 762, stroke: '#6E4A26', 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g);
    el('line', { x1: 1306, y1: 512, x2: 1303, y2: 556, stroke: '#3A2614', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M1293 754 L1262 770 Q1256 776 1264 778 L1296 772 Z', fill: '#5B5B58', stroke: '#2E2E2C', 'stroke-width': 1 }, g);
    el('ellipse', { cx: 1246, cy: 784, rx: 10, ry: 3, fill: '#000', opacity: 0.3 }, g);
    el('circle', { cx: 1244, cy: 776, r: 8, fill: '#EDE3CC', stroke: '#8C7B5A', 'stroke-width': 1 }, g);
    el('path', { d: 'M1238 772 q 6 4 12 0', fill: 'none', stroke: '#8C7B5A', 'stroke-width': 0.8 }, g);
  }

  function bouwTafel(ouder) {
    const T = (X, Z) => P(X, 170, Z);
    const g = el('g', { class: 'tafel', 'data-doel': 'kleed' }, ouder);
    veelhoek([P(-470, HH, 820), P(-170, HH, 820), P(-150, HH, 640), P(-470, HH, 620)], { fill: 'url(#h-schaduwvlek)' }, g);
    const blad = [T(-470, 820), T(-170, 820), T(-170, 640), T(-470, 640)];
    const a = T(-470, 640), b = T(-170, 640), c = T(-170, 820);

    // kale eikenhouten tafel (voor de klus)
    const kaal = el('g', { 'data-voor': 'kleed' }, g);
    const poot = (X, Z, boven) => {
      const vloerPt = P(X, HH, Z), top = boven, x = vloerPt[0];
      el('rect', { x: x - 9, y: top, width: 18, height: vloerPt[1] - top, fill: '#4E331C' }, kaal);
      [0.25, 0.6].forEach((f) => el('ellipse', { cx: x, cy: top + (vloerPt[1] - top) * f, rx: 12, ry: 8, fill: '#5E3F22' }, kaal));
      el('rect', { x: x - 6, y: top, width: 4, height: vloerPt[1] - top, fill: '#8A6038', opacity: 0.5 }, kaal);
    };
    poot(-185, 808, T(-185, 808)[1] + 26);
    veelhoek(blad, { fill: 'url(#h-eik)' }, kaal);
    for (let X = -410; X < -170; X += 60) {
      const p1 = T(X, 820), p2 = T(X, 640);
      el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: '#5A3B1E', 'stroke-opacity': 0.4, 'stroke-width': 1.4 }, kaal);
    }
    veelhoek([a, b, [b[0], b[1] + 14], [a[0], a[1] + 14]], { fill: '#6B4726' }, kaal);
    veelhoek([b, c, [c[0], c[1] + 12], [b[0], b[1] + 14]], { fill: '#4E331C' }, kaal);
    veelhoek([[a[0] + 16, a[1] + 14], [b[0] - 12, b[1] + 14], [b[0] - 12, b[1] + 42], [a[0] + 16, a[1] + 42]], { fill: '#5E3F22' }, kaal);
    poot(-455, 652, a[1] + 42);
    poot(-190, 652, b[1] + 42);
    const vl1 = P(-455, HH, 652), vl2 = P(-190, HH, 652);
    el('rect', { x: vl1[0], y: vl1[1] - 46, width: vl2[0] - vl1[0], height: 9, fill: '#4E331C' }, kaal);

    // Perzisch tafelkleed en Delfts blauwe kan (na de klus)
    const kleed = el('g', { 'data-na': 'kleed', 'data-vonk': 'kleed' }, g);
    veelhoek(blad, { fill: 'url(#h-tapijt-plat)' }, kleed);
    veelhoek(blad, { fill: '#000', opacity: 0.12 }, kleed);
    const onder = 945;
    let d = `M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${b[0] + 4} ${onder - 8}`;
    for (let x = b[0]; x > a[0]; x -= 39) d += ` Q${x - 10} ${onder + 8} ${x - 20} ${onder - 2} T${x - 39} ${onder - 6}`;
    d += ` L${a[0] - 6} ${a[1] + 40} Z`;
    el('path', { d, fill: 'url(#h-tapijt)' }, kleed);
    const plooien = el('g', { opacity: 0.35 }, kleed);
    for (let x = a[0] + 30; x < b[0]; x += 58) {
      el('path', { d: `M${x} ${a[1] + 6} Q${x + 6} ${a[1] + 120} ${x - 4} ${onder - 4}`, fill: 'none', stroke: '#000', 'stroke-width': 14, filter: 'url(#h-zacht)' }, plooien);
    }
    el('path', { d: `M${b[0]} ${b[1]} L${c[0]} ${c[1]} L${c[0]} ${P(-170, 300, 820)[1]} L${b[0] + 4} ${onder - 8} Z`, fill: 'url(#h-tapijt)' }, kleed);
    el('path', { d: `M${b[0]} ${b[1]} L${c[0]} ${c[1]} L${c[0]} ${P(-170, 300, 820)[1]} L${b[0] + 4} ${onder - 8} Z`, fill: '#000', opacity: 0.35 }, kleed);
    el('path', { d: `M${a[0]} ${onder - 2} L${b[0]} ${onder - 6}`, fill: 'none', stroke: '#D9B05A', 'stroke-width': 5, 'stroke-dasharray': '1.5 3' }, kleed);
    veelhoek([blad[0], [blad[0][0] + 160, blad[0][1]], [blad[3][0] + 150, blad[3][1]], blad[3]], { fill: '#FFF0C8', opacity: 0.22, filter: 'url(#h-zacht)' }, kleed);
    const k = T(-205, 800);
    const kan = el('g', { transform: `translate(${k[0].toFixed(1)} ${k[1].toFixed(1)})` }, kleed);
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

  function bouwKnikkers(ouder) {
    const g = voorwerp(ouder, { kamer: 'zolder', label: 'Knikkeren · op de zolder' });
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

  function bouwKat(ouder) {
    const g = el('g', { class: 'kat', 'data-na': 'kat', 'data-doel': 'kat', 'data-vonk': 'kat' }, ouder);
    const k = [P(330, HH, 720), P(460, HH, 720), P(460, HH, 640), P(330, HH, 640)];
    veelhoek(k.map(([x, y]) => [x + 10, y + 8]), { fill: 'url(#h-schaduwvlek)' }, g);
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

  function bouwKoek(ouder) {
    const g = voorwerp(ouder, { label: 'Koekhappen · komt binnenkort' });
    const t = el('g', { class: 'koek-touw' }, g);
    el('line', { x1: 1290, y1: -10, x2: 1290, y2: 212, stroke: '#D8CBB0', 'stroke-width': 1.6 }, t);
    el('rect', { x: 1268, y: 214, width: 52, height: 32, rx: 5, fill: '#1A0F06', opacity: 0.3, filter: 'url(#h-zacht)', transform: 'translate(6 6)' }, t);
    el('rect', { x: 1264, y: 210, width: 52, height: 32, rx: 5, fill: '#7A4519' }, t);
    el('rect', { x: 1268, y: 214, width: 44, height: 24, rx: 3, fill: '#A86A2C' }, t);
    for (let i = 0; i < 7; i++) el('circle', { cx: 1272 + rnd() * 36, cy: 218 + rnd() * 16, r: 1.2, fill: '#6A3A12' }, t);
    el('circle', { cx: 1290, cy: 211, r: 2.5, fill: '#D8CBB0' }, t);
  }

  function bouwKroon(ouder) {
    // voor de klus: alleen een haak in het plafond
    const haak = el('g', { 'data-voor': 'kroon' }, ouder);
    el('line', { x1: 800, y1: -10, x2: 800, y2: 16, stroke: '#3A2C1C', 'stroke-width': 3 }, haak);
    el('path', { d: 'M800 16 q -7 4 -3 11 q 5 4 8 -2', fill: 'none', stroke: '#3A2C1C', 'stroke-width': 2.6 }, haak);
    const diepte = el('g', { class: 'diepte' }, ouder);
    const hangt = el('g', { 'data-na': 'kroon', 'data-doel': 'kroon', 'data-vonk': 'kroon' }, diepte);
    const g = el('g', { class: 'kroon' }, hangt);
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
  // DE TRAP EN DE SEIZOENEN IN DE VOORKAMER
  // ============================================================
  // Na het kopen van de trap staat de deur naar de gang open: een steile Hollandse trap naar de zolder.
  function bouwTrapDeur(ouder, L, D, dr, hw, hh, defs) {
    const Q = L.P;
    const g = el('g', { 'data-na': 'trap', 'data-vonk': 'trap' }, ouder);
    const opening = [D(dr.z0 + 14, dr.top + 14), D(dr.z1 - 14, dr.top + 14), D(dr.z1 - 14, hh), D(dr.z0 + 14, hh)];
    const clip = el('clipPath', { id: 'h-trapclip' }, defs);
    veelhoek(opening, {}, clip);
    const binnen = el('g', { 'clip-path': 'url(#h-trapclip)' }, g);
    veelhoek(opening, { fill: 'url(#h-gang)' }, binnen);
    veelhoek([Q(hw, hh, 560), Q(hw + 420, hh, 560), Q(hw + 420, hh, 1400), Q(hw, hh, 1400)], { fill: '#8A6440' }, binnen);
    const xa = hw + 40, xb = hw + 160, rise = 34, run = 30, z0 = dr.z0 - 30;
    const n = Math.ceil((hh - dr.top + 80) / rise);
    const stappen = [];
    for (let i = 0; i < n; i++) stappen.push({ y: hh - (i + 1) * rise, z: z0 + i * run });
    const boven = Q(xa + 40, stappen[n - 1].y, stappen[n - 1].z);
    el('ellipse', { cx: boven[0], cy: boven[1], rx: 80, ry: 110, fill: 'url(#h-gloed)', class: 'gloed' }, binnen);
    for (let i = n - 1; i >= 0; i--) {
      const s = stappen[i];
      if (s.y > 0) veelhoek([Q(xa, s.y, s.z), Q(xb, s.y, s.z), Q(xb, s.y, s.z + run), Q(xa, s.y, s.z + run)], { fill: '#B4854F' }, binnen);
      veelhoek([Q(xa, s.y, s.z), Q(xb, s.y, s.z), Q(xb, s.y + rise, s.z), Q(xa, s.y + rise, s.z)], { fill: '#6E4826' }, binnen);
      veelhoek([Q(xa, s.y, s.z), Q(xb, s.y, s.z), Q(xb, s.y + 4, s.z), Q(xa, s.y + 4, s.z)], { fill: '#D9AC70' }, binnen);
    }
    // de zijwang van de trap, met daarboven het trapkoord
    const diep = 96, zEind = z0 + n * run;
    const wang = [Q(xa, hh, z0)];
    stappen.forEach((s) => { wang.push(Q(xa, s.y, s.z)); wang.push(Q(xa, s.y, s.z + run)); });
    wang.push(Q(xa, hh - (n + 1) * rise + diep, zEind));
    wang.push(Q(xa, hh, z0 + (diep - rise) * run / rise));
    veelhoek(wang, { fill: '#5A3A1E', stroke: '#3A2412', 'stroke-width': 1.5 }, binnen);
    const k1 = Q(xa - 6, hh - rise - 90, z0), k2 = Q(xa - 6, hh - (n + 1) * rise - 90, zEind);
    el('line', { x1: k1[0], y1: k1[1], x2: k2[0], y2: k2[1], stroke: '#A07A48', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, binnen);
    // klikvlak en naambordje
    const vw = voorwerp(g, { kamer: 'zolder', label: 'Naar de zolder' });
    veelhoek(opening, { fill: 'transparent' }, vw);
    const mid = D((dr.z0 + dr.z1) / 2, dr.top - 8);
    naambordje(vw, mid[0], mid[1] - 26, 'Zolder');
  }

  // Seizoensversiering in de voorkamer: alleen zichtbaar als <html data-seizoen> klopt.
  function bouwSeizoenVoorkamer(svg, L, glas, defs) {
    const Q = L.P, hw = L.HW, hh = L.HH, zv = L.ZV;
    const plek = (sleutel, ouder) => (L.plaats[sleutel] ? el('g', { transform: L.plaats[sleutel] }, ouder) : ouder);
    // Sinterklaas: een klomp bij de plint (zet je schoen!) en een chocoladeletter op tafel
    const sint = el('g', { class: 'alleen-sinterklaas' }, svg);
    bouwTafelSint(plek('tafel', sint));
    bouwKlomp(plek('schoen', sint));
    // Winter: ijsbloemen op het raam en sneeuw buiten
    const winter = el('g', { class: 'alleen-winter', 'clip-path': 'url(#h-raamclip)' }, svg);
    const rr = [glas[0], glas[1], glas[2], glas[3]];
    const breedte = Math.abs(rr[1][0] - rr[0][0]) + 40, hoog = Math.max(rr[2][1], rr[3][1]) - Math.min(rr[0][1], rr[1][1]);
    const x0 = Math.min(rr[0][0], rr[1][0], rr[2][0], rr[3][0]), y0 = Math.min(rr[0][1], rr[1][1]), y1 = Math.max(rr[2][1], rr[3][1]);
    for (let i = 0; i < 30; i++) {
      el('circle', { cx: (x0 + rnd() * breedte).toFixed(1), cy: (y0 + rnd() * hoog * 0.8).toFixed(1), r: (1.6 + rnd() * 2.4).toFixed(1), fill: '#FFFFFF', class: 'vlok', style: `animation-delay:-${(rnd() * 8).toFixed(1)}s;animation-duration:${(5 + rnd() * 5).toFixed(1)}s` }, winter);
    }
    const ijs = el('g', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4, opacity: 0.75, 'stroke-linecap': 'round' }, winter);
    for (let i = 0; i < 9; i++) {
      const x = x0 + rnd() * breedte, y = y1 - rnd() * hoog * 0.25;
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let j = 0; j < 4; j++) d += ` q ${(rnd() * 16 - 8).toFixed(1)} ${(-8 - rnd() * 8).toFixed(1)} ${(rnd() * 14 - 7).toFixed(1)} ${(-14 - rnd() * 10).toFixed(1)}`;
      el('path', { d }, ijs);
      el('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)} l -10 -6 M${x.toFixed(1)} ${y.toFixed(1)} l 9 -8`, opacity: 0.8 }, ijs);
    }
    veelhoek([rr[3], rr[2], [rr[2][0], rr[2][1] - 18], [rr[3][0], rr[3][1] - 22]], { fill: '#FFFFFF', opacity: 0.55, stroke: 'none' }, ijs);
    // Koningsdag: vlaggetjes langs de bovenkant van beide zijmuren
    const oranje = el('g', { class: 'alleen-koningsdag' }, svg);
    vlaggetjes(oranje, Q(-hw, -hh + 40, ZB - 10), Q(-hw, -hh + 40, zv + 40), 40, 26);
    vlaggetjes(oranje, Q(hw, -hh + 40, ZB - 10), Q(hw, -hh + 40, zv + 40), 40, 26);
  }

  function bouwTafelSint(ouder) {
    const g = el('g', {}, ouder);
    const p = P(-330, 170, 760);
    // chocoladeletter in de vorm van een S, met een stukje goudfolie
    el('ellipse', { cx: p[0] + 4, cy: p[1] + 2, rx: 30, ry: 7, fill: '#000', opacity: 0.25 }, g);
    tekst('S', { x: p[0], y: p[1], 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-weight': 700, 'font-size': 74, fill: '#5A2E14', stroke: '#2E1608', 'stroke-width': 2.4, 'paint-order': 'stroke' }, g);
    tekst('S', { x: p[0] - 2, y: p[1] - 2, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-weight': 700, 'font-size': 74, fill: 'none', stroke: '#8A4E26', 'stroke-width': 1.2, opacity: 0.7 }, g);
    el('path', { d: `M${p[0] - 22} ${p[1] - 4} l 44 0 l -3 8 l -38 0 Z`, fill: '#D8B04A', opacity: 0.9 }, g);
    // pepernoten
    for (let i = 0; i < 14; i++) {
      const q = P(-440 + rnd() * 240, 170, 650 + rnd() * 150);
      el('ellipse', { cx: q[0], cy: q[1], rx: 5, ry: 3.4, fill: i % 3 ? '#A0602A' : '#8A4E1E' }, g);
      el('ellipse', { cx: q[0] - 1, cy: q[1] - 1, rx: 2, ry: 1, fill: '#D08A48', opacity: 0.6 }, g);
    }
  }

  // De klomp voor Sinterklaas: tik om hem te zetten, de volgende dag zit er iets in.
  function bouwKlomp(ouder) {
    const b = P(250, 330, 975);
    const g = el('g', { class: 'schoen', tabindex: 0, role: 'button', 'data-stand': 'leeg', 'aria-label': 'Zet je klomp', transform: `translate(${b[0].toFixed(1)} ${b[1].toFixed(1)})` }, ouder);
    const vw = el('g', { class: 'vw' }, g);
    el('ellipse', { cx: 4, cy: 2, rx: 46, ry: 7, fill: '#000', opacity: 0.3 }, vw);
    el('circle', { cx: 0, cy: -30, r: 70, fill: 'url(#h-gloed)', class: 's-gloed' }, vw);
    // wortel en hooi (gezet)
    const wortel = el('g', { class: 's-wortel' }, vw);
    el('path', { d: 'M-14 -34 l 30 -40 l 6 4 l -26 42 Z', fill: '#E0782A', stroke: '#A44E14', 'stroke-width': 1.2 }, wortel);
    el('path', { d: 'M16 -74 l 4 -14 M19 -71 l 12 -8 M18 -72 l 10 -16', stroke: '#4F8A3A', 'stroke-width': 3, 'stroke-linecap': 'round' }, wortel);
    el('path', { d: 'M-30 -34 q -6 -16 2 -26 M-26 -34 q 0 -18 10 -24 M-20 -34 q 8 -14 18 -14', fill: 'none', stroke: '#D9C27A', 'stroke-width': 2, 'stroke-linecap': 'round' }, wortel);
    // cadeautje (de volgende dag)
    const cadeau = el('g', { class: 's-cadeau' }, vw);
    el('rect', { x: -26, y: -78, width: 40, height: 36, rx: 3, fill: '#B6452C', stroke: '#7A2A18', 'stroke-width': 1.2 }, cadeau);
    el('rect', { x: -10, y: -78, width: 8, height: 36, fill: '#E7C36A' }, cadeau);
    el('rect', { x: -26, y: -64, width: 40, height: 7, fill: '#E7C36A' }, cadeau);
    el('path', { d: 'M-6 -78 q -14 -14 -18 -2 q 6 6 18 2 q 12 -14 18 -2 q -6 6 -18 2', fill: '#E7C36A', stroke: '#B08A30', 'stroke-width': 1 }, cadeau);
    // de klomp zelf, gele populier met een rood randje
    el('path', { d: 'M-40 -2 Q-46 -26 -34 -40 L-6 -42 Q4 -40 10 -30 Q30 -26 48 -14 Q58 -6 50 0 Q20 4 -40 -2 Z', fill: '#E3B860', stroke: '#9A6E26', 'stroke-width': 1.6 }, vw);
    el('path', { d: 'M-34 -40 Q-20 -46 -6 -42 Q-2 -34 -12 -30 Q-26 -28 -34 -40 Z', fill: '#5A3A16' }, vw);
    el('path', { d: 'M-36 -38 Q-20 -46 -4 -42', fill: 'none', stroke: '#B6452C', 'stroke-width': 2.4 }, vw);
    el('path', { d: 'M8 -24 q 10 -2 16 4 q -8 6 -16 -4 Z M28 -16 q 8 0 10 6 q -8 2 -10 -6 Z', fill: '#B6452C', opacity: 0.85 }, vw);
    el('path', { d: 'M-30 -14 Q0 -10 40 -8', fill: 'none', stroke: '#FFF3C8', 'stroke-width': 2, opacity: 0.5 }, vw);
  }

  // ============================================================
  // DE ZOLDER, onder de trapgevel
  // Een eigen kamer met schuine daken, een hijsluik in de gevel en twee spellen:
  // knikkeren in de zandbak en tollen op de kist. Ook hier tekenen we de voorwerpen
  // in de brede maat en zetten ze in de staande zolder op hun plek.
  // ============================================================
  const ZOLDER = {
    breed: {
      naam: 'breed', b: 1600, h: 1000, VX: 800, VY: 470, HW: 600, HH: 330, KH: 120, HR: 380, ZV: 560,
      luik: { x0: -95, x1: 95, y0: -50, y1: 250 }, oog: { y: -235, r: 32 }, hanen: -150,
      licht: [0.12, 0.62, -1],
      plaats: {
        knikkeren: 'translate(95 0)',
        hobbel: plaats([330, 860], [212, 852], 0.85)
      }
    },
    staand: {
      naam: 'staand', b: 900, h: 1600, VX: 450, VY: 720, HW: 380, HH: 480, KH: 140, HR: 600, ZV: 520,
      luik: { x0: -90, x1: 90, y0: -60, y1: 260 }, oog: { y: -390, r: 30 }, hanen: -260,
      licht: [0.1, 0.62, -1],
      plaats: {
        lantaarn: plaats([630, 300], [314, 425], 1.0),
        duiven: plaats([950, 288], [566, 413], 0.9),
        vlieger: plaats([535, 452], [272, 690], 0.85),
        stelten: plaats([1045, 470], [632, 800], 1.2),
        hobbel: plaats([330, 860], [165, 1292], 0.78),
        knikkeren: plaats([490, 865], [330, 1270], 0.78),
        tollen: plaats([1125, 800], [650, 1262], 0.7),
        kisten: plaats([1400, 840], [790, 1190], 0.62),
        rommel: plaats([800, 860], [450, 1236], 0.6)
      }
    }
  };
  Object.values(ZOLDER).forEach((L) => { L.P = (X, Y, Z) => [L.VX + F * X / Z, L.VY + F * Y / Z]; });
  const PZ = ZOLDER.breed.P; // projectie voor de zoldervoorwerpen

  // Zacht licht, één keer wazig getekend op een canvas (zie ook de voorkamer).
  function zachteVorm(L, naam, punten, kleur, van, tot, a0, a1, blur) {
    if (punten.length < 3) return '';
    return textuur(`${naam}-${L.naam}`, Math.round(L.b / 2), Math.round(L.h / 2), (g, cb) => {
      const k = 0.5, d = cb + 100;
      g.shadowColor = kleur; g.shadowBlur = blur * k; g.shadowOffsetX = d;
      const gr = g.createLinearGradient(van[0] * k - d, van[1] * k, tot[0] * k - d, tot[1] * k);
      gr.addColorStop(0, `rgba(0,0,0,${a0})`); gr.addColorStop(1, `rgba(0,0,0,${a1})`);
      g.fillStyle = gr;
      g.beginPath();
      punten.forEach(([x, y], i) => (i ? g.lineTo(x * k - d, y * k) : g.moveTo(x * k - d, y * k)));
      g.closePath(); g.fill();
    });
  }

  function bouwZolder(L) {
    zaad = 777;
    const Q = L.P, hw = L.HW, hh = L.HH, kh = L.KH, hr = L.HR, zv = L.ZV, knie = hh - kh;
    const svg = el('svg', { viewBox: `0 0 ${L.b} ${L.h}`, class: 'kamer-svg zolder-svg', preserveAspectRatio: 'xMidYMid slice', role: 'group', 'data-indeling': L.naam, 'data-kamer': 'zolder', 'aria-label': 'De zolder van Het Speelhuys, onder de trapgevel.' });
    const defs = el('defs', {}, svg);
    verloop(defs, 'z-dak', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#24180F'], [1, '#5A4028']]);
    verloop(defs, 'z-knie', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#6A4A2C'], [1, '#4A321C']]);
    verloop(defs, 'z-vloer', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#6E4C2C'], [1, '#A57A4C']]);
    verloop(defs, 'z-lucht', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#86A8C8'], [0.7, '#D6E1E6'], [1, '#EEE8D6']]);
    verloop(defs, 'z-muurlicht', 'radialGradient', { cx: '50%', cy: '62%', r: '55%' }, [[0, '#FFE9C0', 0.4], [1, '#FFE9C0', 0]]);
    verloop(defs, 'h-messing', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F6DC97'], [0.45, '#C9973F'], [1, '#71501E']]);
    verloop(defs, 'h-eik', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#C4955E'], [1, '#7A532E']]);
    verloop(defs, 'h-vignet', 'radialGradient', { cx: '50%', cy: '50%', r: '75%' }, [[0.5, '#000', 0], [1, '#0B0703', 0.65]]);
    verloop(defs, 'h-vlam', 'radialGradient', { cx: '50%', cy: '65%', r: '60%' }, [[0, '#FFFBE0'], [0.45, '#FFCB55'], [1, '#FF8A1E', 0]]);
    verloop(defs, 'h-gloed', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFD27A', 0.5], [1, '#FFD27A', 0]]);
    verloop(defs, 'h-schaduwvlek', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#1A0F06', 0.45], [1, '#1A0F06', 0]]);
    verloop(defs, 'h-stof', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#9A917F', 0.85], [1, '#9A917F', 0]]);
    verloop(defs, 'h-licht', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#FFF6DA', 0.55], [1, '#FFF6DA', 0]]);
    vervaag(defs, 'h-schaduw', 6);
    vervaag(defs, 'h-zacht', 2.5);
    const sp = el('pattern', { id: 'z-steen', width: 36, height: 16, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 36, height: 16, fill: '#7E4A34' }, sp);
    el('rect', { x: 18, y: 8, width: 18, height: 8, fill: '#6C3D2A' }, sp);
    el('rect', { x: 0, y: 0, width: 10, height: 8, fill: '#8C563C', opacity: 0.6 }, sp);
    el('path', { d: 'M0 0 H36 M0 8 H36 M0 0 V8 M18 8 V16', stroke: '#B9A88A', 'stroke-width': 1.3, opacity: 0.7 }, sp);

    const plek = (sleutel, ouder) => (L.plaats[sleutel] ? el('g', { transform: L.plaats[sleutel] }, ouder) : ouder);
    const voor = (id, ouder, extra) => el('g', Object.assign({ 'data-voor': id }, extra || {}), ouder);
    const na = (id, ouder, extra) => el('g', Object.assign({ 'data-na': id }, extra || {}), ouder);
    const dakX = (Y) => hw * (1 - (knie - Y) / (knie + hr)); // halve breedte van de zolder op hoogte Y

    // ---------- Dak met sporen ----------
    const dak = el('g', {}, svg);
    [-1, 1].forEach((z) => {
      veelhoek([Q(z * hw, knie, ZB), Q(0, -hr, ZB), Q(0, -hr, zv), Q(z * hw, knie, zv)], { fill: 'url(#z-dak)' }, dak);
      for (let t = 0.08; t < 1; t += 0.085) {
        const Y = knie + (-hr - knie) * t, X = z * dakX(Y);
        const a = Q(X, Y, ZB), b = Q(X, Y, zv);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#160E07', 'stroke-opacity': 0.55, 'stroke-width': 1.2 }, dak);
      }
    });
    const balken = el('g', {}, svg);
    for (let Z = ZB - 30; Z > zv; Z -= 105) {
      [-1, 1].forEach((z) => {
        veelhoek([Q(z * hw, knie, Z), Q(0, -hr, Z), Q(0, -hr, Z - 16), Q(z * hw, knie, Z - 16)], { fill: '#3E2A18' }, balken);
        const a = Q(z * hw, knie, Z), b = Q(0, -hr, Z);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#7A5634', 'stroke-width': 1.5, 'stroke-opacity': 0.6 }, balken);
      });
    }
    // nok en gordingen
    veelhoek([Q(-16, -hr, ZB), Q(16, -hr, ZB), Q(16, -hr, zv), Q(-16, -hr, zv)], { fill: '#2E2014' }, balken);
    [-1, 1].forEach((z) => {
      const Y = knie + (-hr - knie) * 0.5, X = z * dakX(Y);
      veelhoek([Q(X, Y - 14, ZB), Q(X, Y + 14, ZB), Q(X, Y + 14, zv), Q(X, Y - 14, zv)], { fill: '#4A321E' }, balken);
    });

    // ---------- Knieschotten ----------
    [-1, 1].forEach((z) => {
      const vlak = [Q(z * hw, knie, ZB), Q(z * hw, knie, zv), Q(z * hw, hh, zv), Q(z * hw, hh, ZB)];
      veelhoek(vlak, { fill: 'url(#z-knie)' }, svg);
      for (let Z = ZB - 40; Z > zv; Z -= 40) {
        const a = Q(z * hw, knie, Z), b = Q(z * hw, hh, Z);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#2A1C10', 'stroke-opacity': 0.5, 'stroke-width': 1.4 }, svg);
      }
    });

    // ---------- Achtergevel van baksteen met hijsluik en rond venstertje ----------
    const muur = el('g', {}, svg);
    const gevelVlak = [Q(-hw, hh, ZB), Q(hw, hh, ZB), Q(hw, knie, ZB), Q(0, -hr, ZB), Q(-hw, knie, ZB)];
    veelhoek(gevelVlak, { fill: 'url(#z-steen)' }, muur);
    veelhoek(gevelVlak, { fill: '#1A0F06', opacity: 0.28 }, muur);
    const lk = L.luik, lp = [Q(lk.x0, lk.y0, ZB), Q(lk.x1, lk.y0, ZB), Q(lk.x1, lk.y1, ZB), Q(lk.x0, lk.y1, ZB)];
    const luikOpen = na('z-luik', muur);
    veelhoek(gevelVlak, { fill: 'url(#z-muurlicht)' }, luikOpen);
    // rond venstertje (oculus)
    const oc = Q(0, L.oog.y, ZB);
    el('circle', { cx: oc[0], cy: oc[1], r: L.oog.r + 7, fill: '#3A291C' }, muur);
    el('circle', { cx: oc[0], cy: oc[1], r: L.oog.r, fill: 'url(#z-lucht)' }, muur);
    el('path', { d: `M${oc[0] - L.oog.r} ${oc[1]} H${oc[0] + L.oog.r} M${oc[0]} ${oc[1] - L.oog.r} V${oc[1] + L.oog.r}`, stroke: '#3A291C', 'stroke-width': 3 }, muur);
    // het hijsluik: kozijn, daarachter de lucht boven de gracht
    veelhoek([Q(lk.x0 - 16, lk.y0 - 16, ZB), Q(lk.x1 + 16, lk.y0 - 16, ZB), Q(lk.x1 + 16, lk.y1 + 8, ZB), Q(lk.x0 - 16, lk.y1 + 8, ZB)], { fill: '#2E2014' }, muur);
    const opening = el('g', {}, muur);
    veelhoek(lp, { fill: 'url(#z-lucht)' }, opening);
    const luikClip = el('clipPath', { id: 'z-luikclip' }, defs);
    veelhoek(lp, {}, luikClip);
    const buiten = el('g', { 'clip-path': 'url(#z-luikclip)' }, opening);
    const lb = lp[1][0] - lp[0][0], lh = lp[2][1] - lp[1][1];
    // wolkjes en de daken aan de overkant van de gracht
    [[0.2, 0.18, 0.22], [0.7, 0.3, 0.3]].forEach(([fx, fy, fr]) => el('ellipse', { cx: lp[0][0] + lb * fx, cy: lp[0][1] + lh * fy, rx: lb * fr, ry: lh * 0.06, fill: '#FFFFFF', opacity: 0.85 }, buiten));
    const dy0 = lp[0][1] + lh * 0.62;
    el('path', { d: `M${lp[0][0]} ${lp[2][1]} V${dy0} h${lb * 0.18} v${-lh * 0.12} h${lb * 0.1} v${-lh * 0.1} h${lb * 0.12} v${lh * 0.1} h${lb * 0.1} v${lh * 0.12} h${lb * 0.14} v${-lh * 0.2} q${lb * 0.1} ${-lh * 0.12} ${lb * 0.2} 0 v${lh * 0.2} h${lb * 0.06} V${lp[2][1]} Z`, fill: '#7A5848', opacity: 0.85 }, buiten);
    // het touw van de hijsbalk hangt buiten voor het luik
    el('line', { x1: (lp[0][0] + lp[1][0]) / 2, y1: lp[0][1], x2: (lp[0][0] + lp[1][0]) / 2, y2: lp[0][1] + lh * 0.45, stroke: '#5A4632', 'stroke-width': 2.2 }, buiten);
    el('path', { d: `M${(lp[0][0] + lp[1][0]) / 2} ${lp[0][1] + lh * 0.45} q -8 6 0 14 q 8 2 5 -6`, fill: 'none', stroke: '#2B2B2B', 'stroke-width': 3 }, buiten);
    const sneeuwLuik = el('g', { class: 'alleen-winter' }, buiten);
    for (let i = 0; i < 18; i++) el('circle', { cx: lp[0][0] + rnd() * lb, cy: lp[0][1] + rnd() * lh, r: 1.5 + rnd() * 2, fill: '#FFFFFF', class: 'vlok', style: `animation-delay:-${(rnd() * 6).toFixed(1)}s;animation-duration:${(4 + rnd() * 4).toFixed(1)}s` }, sneeuwLuik);
    // dichte luiken (voor de klus)
    const dicht = voor('z-luik', muur, { 'data-doel': 'z-luik' });
    const midX = (lp[0][0] + lp[1][0]) / 2;
    el('rect', { x: lp[0][0], y: lp[0][1], width: lb / 2 - 1, height: lh, fill: '#3E2A1A' }, dicht);
    el('rect', { x: midX + 1, y: lp[0][1], width: lb / 2 - 1, height: lh, fill: '#3A2617' }, dicht);
    for (let i = 1; i < 6; i++) el('line', { x1: lp[0][0], y1: lp[0][1] + lh * i / 6, x2: lp[1][0], y2: lp[0][1] + lh * i / 6, stroke: '#24180E', 'stroke-width': 1.5 }, dicht);
    [0.18, 0.82].forEach((f) => el('rect', { x: lp[0][0] + 4, y: lp[0][1] + lh * f - 5, width: lb - 8, height: 10, fill: '#1E1A16', opacity: 0.85 }, dicht));
    el('circle', { cx: midX - 8, cy: lp[0][1] + lh / 2, r: 4, fill: '#1E1A16' }, dicht);
    const kier = Q(0, lk.y0, ZB);
    el('line', { x1: kier[0], y1: lp[0][1] + 3, x2: kier[0], y2: lp[2][1] - 3, stroke: '#FFE7B0', 'stroke-width': 1.6, opacity: 0.7 }, dicht);

    // ---------- Vloer van brede planken ----------
    const vloer = [Q(-hw, hh, ZB), Q(hw, hh, ZB), Q(hw, hh, zv), Q(-hw, hh, zv)];
    const vlClip = el('clipPath', { id: 'z-vloerclip' }, defs);
    veelhoek(vloer, {}, vlClip);
    const vl = el('g', { 'clip-path': 'url(#z-vloerclip)' }, svg);
    veelhoek(vloer, { fill: 'url(#z-vloer)' }, vl);
    for (let X = -hw; X <= hw; X += 58) {
      const a = Q(X, hh, ZB), b = Q(X, hh, zv - 200);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#3A2614', 'stroke-opacity': 0.55, 'stroke-width': 1.6 }, vl);
    }
    for (let i = 0; i < 26; i++) {
      const X = -hw + 29 + Math.floor(rnd() * (2 * hw / 58)) * 58, Z = zv + rnd() * (ZB - zv);
      const a = Q(X, hh, Z), b = Q(X + 58, hh, Z);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#3A2614', 'stroke-opacity': 0.4, 'stroke-width': 1.2 }, vl);
    }
    el('line', { x1: Q(-hw, hh, ZB)[0], y1: Q(0, hh, ZB)[1], x2: Q(hw, hh, ZB)[0], y2: Q(0, hh, ZB)[1], stroke: '#24180E', 'stroke-width': 4 }, vl);
    // zonlicht door het open luik op de vloer
    const [ldx, ldy, ldz] = L.licht;
    const vloerVlek = [[lk.x0, lk.y1], [lk.x1, lk.y1], [lk.x1, lk.y0], [lk.x0, lk.y0]].map(([X0, Y0]) => {
      const t = (hh - Y0) / ldy;
      return Q(X0 + ldx * t, hh, Math.max(zv - 60, ZB + ldz * t));
    });
    const vlekUrl = zachteVorm(L, 'z-vloervlek', omhulsel(vloerVlek), '#FFF1CC', vloerVlek[0], vloerVlek[2], 0.75, 0.25, 40);
    const vlekNa = na('z-luik', vl);
    if (vlekUrl) el('image', { href: vlekUrl, x: 0, y: 0, width: L.b, height: L.h, preserveAspectRatio: 'none', class: 'zonvlek' }, vlekNa);
    // stoffige vloer met gaten (voor de klus)
    const vloerVuil = voor('z-vloer', vl, { 'data-vonk': 'z-vloer' });
    veelhoek(vloer, { fill: '#6A6152', opacity: 0.5 }, vloerVuil);
    [[-300, 860], [120, 930], [380, 780], [-80, 720]].forEach(([X, Z]) => {
      veelhoek([Q(X, hh, Z), Q(X + 58, hh, Z), Q(X + 58, hh, Z - 70), Q(X, hh, Z - 70)], { fill: '#120B05', opacity: 0.85 }, vloerVuil);
    });
    for (let i = 0; i < 30; i++) {
      const p = Q(-hw + rnd() * 2 * hw, hh, zv + rnd() * (ZB - zv));
      el('path', { d: `M${pt(p)} l ${6 + rnd() * 10} ${rnd() * 4 - 2}`, stroke: '#D9C27A', 'stroke-width': 1.4, opacity: 0.7 }, vloerVuil);
    }
    const glim = na('z-vloer', vl);
    for (let i = 0; i < 5; i++) {
      const p = Q(-hw * 0.7 + rnd() * hw * 1.4, hh, zv + 80 + rnd() * (ZB - zv - 120));
      el('path', { d: `M${p[0]} ${p[1] - 9} L${p[0] + 2} ${p[1] - 2} L${p[0] + 9} ${p[1]} L${p[0] + 2} ${p[1] + 2} L${p[0]} ${p[1] + 9} L${p[0] - 2} ${p[1] + 2} L${p[0] - 9} ${p[1]} L${p[0] - 2} ${p[1] - 2} Z`, fill: '#FFFFFF', class: 'glim', style: `animation-delay:-${(rnd() * 4).toFixed(1)}s` }, glim);
    }

    // ---------- Hanenbalk dwars door de zolder ----------
    const hb = el('g', {}, svg);
    const Zh = 880, Yh = L.hanen, xh = dakX(Yh) * 0.98;
    veelhoek([Q(-xh, Yh - 14, Zh), Q(xh, Yh - 14, Zh), Q(xh, Yh + 14, Zh), Q(-xh, Yh + 14, Zh)], { fill: '#4A321E' }, hb);
    veelhoek([Q(-xh, Yh + 14, Zh), Q(xh, Yh + 14, Zh), Q(xh, Yh + 14, Zh + 20), Q(-xh, Yh + 14, Zh + 20)], { fill: '#2E2014' }, hb);
    // stoffige balken en spinnenwebben (voor de klus "balken schuren")
    const balkVuil = voor('z-balken', svg, { 'data-vonk': 'z-balken' });
    [-1, 1].forEach((z) => {
      veelhoek([Q(z * hw, knie, ZB), Q(0, -hr, ZB), Q(0, -hr, zv), Q(z * hw, knie, zv)], { fill: '#8A8476', opacity: 0.32 }, balkVuil);
    });
    veelhoek([Q(-xh, Yh - 14, Zh), Q(xh, Yh - 14, Zh), Q(xh, Yh + 14, Zh), Q(-xh, Yh + 14, Zh)], { fill: '#9A9384', opacity: 0.45 }, balkVuil);
    const w1 = Q(-dakX(Yh) * 0.9, Yh + 14, Zh), w2 = Q(dakX(Yh) * 0.9, Yh + 14, Zh);
    web(balkVuil, w1[0], w1[1], 70, 0, Math.PI / 2);
    web(balkVuil, w2[0], w2[1], 60, Math.PI / 2, Math.PI);
    const nk = Q(0, -hr, ZB);
    web(balkVuil, nk[0], nk[1] + 10, 50, Math.PI * 0.15, Math.PI * 0.85);

    // ---------- Koningsdag: vlaggetjes langs de hanenbalk ----------
    const oranje = el('g', { class: 'alleen-koningsdag' }, svg);
    vlaggetjes(oranje, Q(-xh, Yh + 16, Zh), Q(xh, Yh + 16, Zh), 34, 22);

    // ---------- Lichtbundel door het open luik ----------
    const bundel = omhulsel(lp.concat(vloerVlek));
    const bundelUrl = zachteVorm(L, 'z-bundel', bundel, '#FFF4D6', [(lp[0][0] + lp[1][0]) / 2, lp[0][1]], [(vloerVlek[0][0] + vloerVlek[2][0]) / 2, Math.max(vloerVlek[0][1], vloerVlek[2][1])], 0.55, 0.04, 34);
    const lichtNa = na('z-luik', svg);
    if (bundelUrl) el('image', { href: bundelUrl, x: 0, y: 0, width: L.b, height: L.h, preserveAspectRatio: 'none', class: 'lichtbundel' }, lichtNa);
    const stof = el('g', { class: 'stof' }, lichtNa);
    const van = [(lp[0][0] + lp[1][0]) / 2, (lp[0][1] + lp[2][1]) / 2], naar = [(vloerVlek[0][0] + vloerVlek[2][0]) / 2, (vloerVlek[0][1] + vloerVlek[2][1]) / 2];
    for (let i = 0; i < 34; i++) {
      const t = rnd();
      el('circle', {
        cx: (van[0] + (naar[0] - van[0]) * t + (rnd() - 0.5) * lb * (0.6 + t)).toFixed(1),
        cy: (van[1] + (naar[1] - van[1]) * t + (rnd() - 0.5) * 60).toFixed(1),
        r: (0.8 + rnd() * 1.8).toFixed(2), fill: '#FFF8E6', class: 'stofje',
        style: `--dx:${((rnd() - 0.5) * 40).toFixed(1)}px;--dy:${((rnd() - 0.6) * 46).toFixed(1)}px;animation-duration:${(6 + rnd() * 9).toFixed(1)}s;animation-delay:-${(rnd() * 12).toFixed(1)}s`
      }, stof);
    }

    // ---------- Voorwerpen ----------
    bouwVlieger(plek('vlieger', svg));
    bouwStelten(plek('stelten', svg));
    bouwKisten(plek('kisten', svg));
    bouwRommel(plek('rommel', svg));
    bouwHobbelpaard(plek('hobbel', svg));
    const kn = plek('knikkeren', svg);
    bouwLappendeken(kn);
    bouwZandbak(kn);
    bouwTolkist(plek('tollen', svg));
    bouwLantaarn(plek('lantaarn', svg));
    bouwDuiven(plek('duiven', svg));

    el('rect', { width: L.b, height: L.h, fill: '#120A04', class: 'schemer', 'pointer-events': 'none' }, svg);
    el('rect', { width: L.b, height: L.h, fill: 'url(#h-vignet)', 'pointer-events': 'none' }, svg);
    return svg;
  }

  // Een lijn met vlaggetjes in oranje, rood, wit en blauw
  function vlaggetjes(ouder, a, b, stap, lengte) {
    const zak = 26;
    const d = `M${pt(a)} Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + zak * 2} ${pt(b)}`;
    el('path', { d, fill: 'none', stroke: '#3A2C1C', 'stroke-width': 1.5 }, ouder);
    const kleuren = ['#E8741C', '#B6452C', '#F4F1E8', '#2B4C9A', '#E8741C'];
    const n = Math.max(4, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / stap));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ((a[0] + b[0]) / 2) + t * t * b[0];
      const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ((a[1] + b[1]) / 2 + zak * 2) + t * t * b[1];
      const g = el('g', { class: 'vlagje', style: `animation-delay:-${(i * 0.37).toFixed(2)}s` }, ouder);
      el('path', { d: `M${(x - lengte * 0.38).toFixed(1)} ${y.toFixed(1)} L${(x + lengte * 0.38).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + lengte).toFixed(1)} Z`, fill: kleuren[i % kleuren.length], stroke: 'rgba(0,0,0,.2)', 'stroke-width': 0.6 }, g);
    }
  }

  function bouwVlieger(ouder) {
    const g = voorwerp(ouder, { label: 'Vliegeren · komt binnenkort' });
    el('rect', { x: 470, y: 440, width: 130, height: 290, fill: 'transparent' }, g);
    spijker(g, 535, 452);
    el('path', { d: 'M535 458 L592 522 L535 604 L478 522 Z', fill: '#2A1A0C', opacity: 0.3, filter: 'url(#h-schaduw)', transform: 'translate(8 10)' }, g);
    el('path', { d: 'M535 458 L592 522 L535 522 Z', fill: '#B6452C' }, g);
    el('path', { d: 'M535 458 L478 522 L535 522 Z', fill: '#E8D9AE' }, g);
    el('path', { d: 'M478 522 L535 604 L535 522 Z', fill: '#2B4C9A' }, g);
    el('path', { d: 'M592 522 L535 604 L535 522 Z', fill: '#E8D9AE' }, g);
    el('path', { d: 'M535 458 V604 M478 522 H592', stroke: '#6B4423', 'stroke-width': 2.4 }, g);
    el('path', { d: 'M535 458 L592 522 L535 604 L478 522 Z', fill: 'none', stroke: '#4A3018', 'stroke-width': 1.5 }, g);
    el('path', { d: 'M535 604 q -14 30 4 56 q 16 26 -6 60', fill: 'none', stroke: '#5A4632', 'stroke-width': 1.4 }, g);
    [[531, 630, '#B6452C'], [538, 662, '#2B4C9A'], [534, 698, '#E8741C']].forEach(([x, y, k]) => el('path', { d: `M${x - 8} ${y - 5} L${x + 8} ${y + 5} M${x + 8} ${y - 5} L${x - 8} ${y + 5}`, stroke: k, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g));
  }

  function bouwStelten(ouder) {
    const g = voorwerp(ouder, { label: 'Steltlopen · komt binnenkort' });
    el('rect', { x: 990, y: 460, width: 110, height: 350, fill: 'transparent' }, g);
    [[1010, 1036], [1052, 1078]].forEach(([onder, boven], i) => {
      el('line', { x1: onder + 6, y1: 800, x2: boven + 6, y2: 472, stroke: '#1A0F06', 'stroke-opacity': 0.25, 'stroke-width': 9 }, g);
      el('line', { x1: onder, y1: 800, x2: boven, y2: 470, stroke: i ? '#8A5E35' : '#7A532E', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
      const y = 690, x = onder + (boven - onder) * (800 - y) / 330;
      el('path', { d: `M${x - 3} ${y} h-18 l4 -10 h14 Z`, fill: '#5A3A1E' }, g);
    });
  }

  function bouwKisten(ouder) {
    const g = el('g', { 'data-na': 'z-rommel', 'data-vonk': 'z-rommel' }, ouder);
    const kist = (x0, x1, z0, z1, y0, y1, kleur) => {
      veelhoek([PZ(x0, y0, z0), PZ(x0, y0, z1), PZ(x0, y1, z1), PZ(x0, y1, z0)], { fill: '#3E2A18' }, g);
      veelhoek([PZ(x0, y0, z1), PZ(x1, y0, z1), PZ(x1, y0, z0), PZ(x0, y0, z0)], { fill: kleur }, g);
      veelhoek([PZ(x0, y0, z0), PZ(x1, y0, z0), PZ(x1, y1, z0), PZ(x0, y1, z0)], { fill: '#6B4726' }, g);
      [0.2, 0.8].forEach((f) => {
        const x = x0 + (x1 - x0) * f;
        veelhoek([PZ(x - 6, y0, z0), PZ(x + 6, y0, z0), PZ(x + 6, y1, z0), PZ(x - 6, y1, z0)], { fill: '#2A241E', opacity: 0.8 }, g);
      });
    };
    kist(430, 560, 760, 880, 250, 330, '#8A5E35');
    kist(450, 545, 790, 860, 190, 250, '#9A6A3E');
    // Sinterklaas heeft hier pakjes verstopt
    const pakjes = el('g', { class: 'alleen-sinterklaas' }, g);
    [[360, 420, 760, 800, 290, '#B6452C', '#E7C36A'], [395, 440, 790, 830, 300, '#2B4C9A', '#F4F1E8'], [370, 410, 805, 840, 250, '#E7C36A', '#B6452C']].forEach(([x0, x1, z0, z1, y0, k, lint]) => {
      veelhoek([PZ(x0, y0, z0), PZ(x1, y0, z0), PZ(x1, 330, z0), PZ(x0, 330, z0)], { fill: k }, pakjes);
      veelhoek([PZ(x0, y0, z1), PZ(x1, y0, z1), PZ(x1, y0, z0), PZ(x0, y0, z0)], { fill: k, opacity: 0.8 }, pakjes);
      const m = PZ((x0 + x1) / 2, y0, z0), o = PZ((x0 + x1) / 2, 330, z0);
      el('line', { x1: m[0], y1: m[1], x2: o[0], y2: o[1], stroke: lint, 'stroke-width': 3 }, pakjes);
      el('path', { d: `M${m[0]} ${m[1]} q -8 -10 -12 -2 q 4 6 12 2 q 8 -10 12 -2 q -4 6 -12 2`, fill: lint }, pakjes);
    });
  }

  function bouwRommel(ouder) {
    const g = el('g', { 'data-voor': 'z-rommel', 'data-doel': 'z-rommel', 'data-vonk': 'z-rommel' }, ouder);
    // kapotte stoel
    const s = [PZ(-540, 250, 900), PZ(-450, 250, 900), PZ(-450, 250, 830), PZ(-540, 250, 830)];
    veelhoek(s, { fill: '#5A3A1E' }, g);
    [[-535, 830], [-455, 830], [-535, 900], [-455, 900]].forEach(([X, Z], i) => {
      const a = PZ(X, 250, Z), b = PZ(X + (i === 1 ? 30 : 0), 330, Z);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#4A2E16', 'stroke-width': 5 }, g);
    });
    const r1 = PZ(-540, 250, 900), r2 = PZ(-540, 120, 900), r3 = PZ(-470, 160, 900);
    el('path', { d: `M${pt(r1)} L${pt(r2)} M${pt(r2)} L${pt(r3)}`, stroke: '#4A2E16', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    // zakken
    [[-420, 320, 860, 1], [-380, 320, 820, 0.8]].forEach(([X, Y, Z, s2]) => {
      const p = PZ(X, Y, Z);
      el('path', { d: `M${p[0] - 34 * s2} ${p[1]} Q${p[0] - 40 * s2} ${p[1] - 50 * s2} ${p[0] - 8 * s2} ${p[1] - 58 * s2} L${p[0] - 4 * s2} ${p[1] - 70 * s2} L${p[0] + 4 * s2} ${p[1] - 58 * s2} Q${p[0] + 40 * s2} ${p[1] - 50 * s2} ${p[0] + 34 * s2} ${p[1]} Z`, fill: '#A08A62', stroke: '#6E5C3E', 'stroke-width': 1.5 }, g);
    });
    // kratten voor het luik
    const krat = (x0, x1, z0, y0) => {
      veelhoek([PZ(x0, y0, z0), PZ(x1, y0, z0), PZ(x1, 330, z0), PZ(x0, 330, z0)], { fill: '#8A6A42' }, g);
      veelhoek([PZ(x0, y0, z0 + 70), PZ(x1, y0, z0 + 70), PZ(x1, y0, z0), PZ(x0, y0, z0)], { fill: '#A07C50' }, g);
      for (let i = 1; i < 4; i++) { const a = PZ(x0, y0 + (330 - y0) * i / 4, z0), b = PZ(x1, y0 + (330 - y0) * i / 4, z0); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#5A4026', 'stroke-width': 1.4 }, g); }
    };
    krat(-60, 50, 930, 250);
    krat(30, 120, 905, 280);
    // opgerold tapijt en een mand
    const t1 = PZ(430, 310, 950), t2 = PZ(560, 310, 950);
    el('line', { x1: t1[0], y1: t1[1], x2: t2[0], y2: t2[1], stroke: '#7B2620', 'stroke-width': 22, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: t1[0], cy: t1[1], rx: 6, ry: 11, fill: '#5A1A16' }, g);
    const m = PZ(470, 330, 880);
    el('path', { d: `M${m[0] - 30} ${m[1]} L${m[0] - 36} ${m[1] - 40} H${m[0] + 36} L${m[0] + 30} ${m[1]} Z`, fill: '#B08A52', stroke: '#7A5A30', 'stroke-width': 1.5 }, g);
    for (let i = 1; i < 4; i++) el('line', { x1: m[0] - 34, y1: m[1] - i * 10, x2: m[0] + 34, y2: m[1] - i * 10, stroke: '#7A5A30', 'stroke-width': 1 }, g);
    // stro
    for (let i = 0; i < 26; i++) {
      const p = PZ(-560 + rnd() * 1100, 330, 760 + rnd() * 220);
      el('path', { d: `M${pt(p)} l ${8 + rnd() * 10} ${rnd() * 6 - 3}`, stroke: '#D9C27A', 'stroke-width': 1.5 }, g);
    }
  }

  function bouwHobbelpaard(ouder) {
    const g = el('g', { 'data-na': 'z-hobbel', 'data-doel': 'z-hobbel', 'data-vonk': 'z-hobbel' }, ouder);
    el('ellipse', { cx: 335, cy: 864, rx: 112, ry: 14, fill: 'url(#h-schaduwvlek)' }, g);
    const w = el('g', { class: 'hobbel' }, g);
    el('path', { d: 'M220 840 Q330 884 442 840', fill: 'none', stroke: '#6B4423', 'stroke-width': 10, 'stroke-linecap': 'round' }, w);
    el('path', { d: 'M268 846 L284 772 M300 854 L306 774 M360 854 L354 774 M392 846 L376 772', stroke: '#E9E4DA', 'stroke-width': 10, 'stroke-linecap': 'round' }, w);
    el('path', { d: 'M268 846 L284 772 M392 846 L376 772', stroke: '#B9B2A4', 'stroke-width': 3, 'stroke-linecap': 'round' }, w);
    el('ellipse', { cx: 330, cy: 760, rx: 72, ry: 30, fill: '#ECE7DD' }, w);
    [[300, 752, 5], [322, 766, 4], [348, 750, 5], [366, 768, 4], [286, 770, 3.5]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#A9A39A', opacity: 0.7 }, w));
    el('path', { d: 'M382 752 Q412 704 404 672 L430 664 Q450 672 446 692 Q432 702 422 714 Q406 742 398 772 Z', fill: '#ECE7DD' }, w);
    el('path', { d: 'M398 676 q -8 22 -18 42 q -6 14 -12 26', fill: 'none', stroke: '#4A4A4A', 'stroke-width': 7, 'stroke-linecap': 'round' }, w);
    el('path', { d: 'M260 752 q -28 6 -34 38', fill: 'none', stroke: '#4A4A4A', 'stroke-width': 8, 'stroke-linecap': 'round' }, w);
    el('path', { d: 'M302 732 Q330 722 358 732 L354 756 Q330 762 306 756 Z', fill: '#B23A2A' }, w);
    el('path', { d: 'M306 742 h48', stroke: '#E7C36A', 'stroke-width': 2 }, w);
    el('path', { d: 'M414 676 L438 690 M430 664 L426 654 L438 660', fill: 'none', stroke: '#B23A2A', 'stroke-width': 2.6 }, w);
    el('circle', { cx: 433, cy: 676, r: 2.6, fill: '#2A1A0C' }, w);
  }

  function bouwLappendeken(ouder) {
    const g = el('g', { 'data-na': 'z-kleed', 'data-doel': 'z-kleed', 'data-vonk': 'z-kleed' }, ouder);
    const kleuren = ['#B6452C', '#E0B44A', '#2B4C9A', '#5E8A4A', '#D8CFBC', '#8A3A5A', '#D98A3A', '#4A7A8A'];
    const x0 = -480, x1 = -60, z0 = 750, z1 = 940, n = 7, m = 4;
    veelhoek([PZ(x0 - 8, 330, z1 + 8), PZ(x1 + 8, 330, z1 + 8), PZ(x1 + 8, 330, z0 - 8), PZ(x0 - 8, 330, z0 - 8)], { fill: '#6E2A22' }, g);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n, za = z0 + (z1 - z0) * j / m, zb = z0 + (z1 - z0) * (j + 1) / m;
        veelhoek([PZ(xa, 330, zb), PZ(xb, 330, zb), PZ(xb, 330, za), PZ(xa, 330, za)], { fill: kleuren[Math.floor(rnd() * kleuren.length)], stroke: '#F4E9CF', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.95 }, g);
      }
    }
  }

  function bouwZandbak(ouder) {
    const g = voorwerp(ouder, { spel: 'knikkeren', label: 'Speel knikkeren' });
    const x0 = -420, x1 = -120, z0 = 780, z1 = 900, top = 304, bodem = 330;
    el('ellipse', { cx: (PZ(x0, bodem, z0)[0] + PZ(x1, bodem, z0)[0]) / 2 + 8, cy: PZ(0, bodem, z0)[1] + 4, rx: 200, ry: 16, fill: 'url(#h-schaduwvlek)' }, g);
    veelhoek([PZ(x1, top, z0), PZ(x1, top, z1), PZ(x1, bodem, z1), PZ(x1, bodem, z0)], { fill: '#4E3018' }, g);
    veelhoek([PZ(x0, top, z1), PZ(x1, top, z1), PZ(x1, top, z0), PZ(x0, top, z0)], { fill: '#8A5A2E' }, g);
    veelhoek([PZ(x0 + 14, top, z1 - 10), PZ(x1 - 14, top, z1 - 10), PZ(x1 - 14, top, z0 + 10), PZ(x0 + 14, top, z0 + 10)], { fill: '#D9BC86' }, g);
    veelhoek([PZ(x0, top, z0), PZ(x1, top, z0), PZ(x1, bodem, z0), PZ(x0, bodem, z0)], { fill: '#6B4423' }, g);
    const pot = PZ(-270, top, 868);
    el('ellipse', { cx: pot[0], cy: pot[1], rx: 18, ry: 6, fill: '#4A3218' }, g);
    el('ellipse', { cx: pot[0], cy: pot[1] - 1, rx: 12, ry: 3.5, fill: '#2A1A0C' }, g);
    [[-330, 820, '#4C79C9'], [-250, 810, '#B0573A'], [-200, 845, '#4F9A54'], [-300, 850, '#D9963A'], [-180, 800, '#E8CFAB']].forEach(([X, Z, k]) => {
      const p = PZ(X, top, Z);
      el('circle', { cx: p[0] + 1.5, cy: p[1] + 1, r: 6, fill: '#000', opacity: 0.25 }, g);
      el('circle', { cx: p[0], cy: p[1] - 2, r: 6, fill: k }, g);
      el('circle', { cx: p[0] - 2, cy: p[1] - 4, r: 1.8, fill: '#fff', opacity: 0.8 }, g);
    });
    const v = PZ(-270, 317, z0);
    naambordje(g, v[0], v[1] - 11, 'Knikkeren');
  }

  function bouwTolkist(ouder) {
    const g = voorwerp(ouder, { spel: 'tollen', label: 'Speel tollen' });
    const x0 = 160, x1 = 380, z0 = 800, z1 = 920, top = 220, bodem = 330;
    el('ellipse', { cx: (PZ(x0, bodem, z0)[0] + PZ(x1, bodem, z0)[0]) / 2 + 10, cy: PZ(0, bodem, z0)[1] + 4, rx: 160, ry: 14, fill: 'url(#h-schaduwvlek)' }, g);
    veelhoek([PZ(x0, top, z0), PZ(x0, top, z1), PZ(x0, bodem, z1), PZ(x0, bodem, z0)], { fill: '#4E331C' }, g);
    veelhoek([PZ(x0, top, z1), PZ(x1, top, z1), PZ(x1, top, z0), PZ(x0, top, z0)], { fill: '#9A6A3E' }, g);
    veelhoek([PZ(x0, top, z0), PZ(x1, top, z0), PZ(x1, bodem, z0), PZ(x0, bodem, z0)], { fill: '#7A532E' }, g);
    [0.18, 0.82].forEach((f) => {
      const x = x0 + (x1 - x0) * f;
      veelhoek([PZ(x - 7, top, z0), PZ(x + 7, top, z0), PZ(x + 7, bodem, z0), PZ(x - 7, bodem, z0)], { fill: '#2A241E', opacity: 0.85 }, g);
    });
    const sl = PZ((x0 + x1) / 2, top + 24, z0);
    el('rect', { x: sl[0] - 9, y: sl[1] - 7, width: 18, height: 16, rx: 2, fill: 'url(#h-messing)' }, g);
    // de tol en het zweepje op de kist
    const t = PZ(250, top, 870);
    const tol = el('g', { transform: `translate(${t[0].toFixed(1)} ${t[1].toFixed(1)}) scale(1.3)` }, g);
    el('ellipse', { cx: 3, cy: 1, rx: 16, ry: 4, fill: '#000', opacity: 0.3 }, tol);
    el('path', { d: 'M-17 -27 Q0 -37 17 -27 L2 0 L-2 0 Z', fill: '#B6452C', stroke: '#5A2215', 'stroke-width': 0.8 }, tol);
    el('path', { d: 'M-14 -22 Q0 -28 14 -22 L11 -16 Q0 -20 -11 -16 Z', fill: BLAUW }, tol);
    el('path', { d: 'M-7 -12 Q0 -14 7 -12 L4 -6 L-4 -6 Z', fill: '#E7C36A' }, tol);
    el('ellipse', { cx: 0, cy: -28, rx: 17, ry: 4, fill: '#D45A3C' }, tol);
    el('rect', { x: -2, y: -40, width: 4, height: 11, fill: '#6B4423' }, tol);
    const z = PZ(320, top, 860);
    el('path', { d: `M${z[0] - 40} ${z[1] + 4} L${z[0] + 10} ${z[1] - 6} M${z[0] + 10} ${z[1] - 6} q 18 -4 26 6 q -8 10 -22 4`, fill: 'none', stroke: '#4A3018', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
    const v = PZ((x0 + x1) / 2, 290, z0);
    naambordje(g, v[0], v[1] - 11, 'Tollen');
  }

  function bouwLantaarn(ouder) {
    const haak = el('g', { 'data-voor': 'z-lantaarn' }, ouder);
    el('path', { d: 'M630 300 v 14 q -6 4 -2 10 q 5 3 7 -3', fill: 'none', stroke: '#1E1A16', 'stroke-width': 2.4 }, haak);
    const g = el('g', { 'data-na': 'z-lantaarn', 'data-doel': 'z-lantaarn', 'data-vonk': 'z-lantaarn' }, ouder);
    const z = el('g', { class: 'lantaarn-zwaai' }, g);
    el('circle', { cx: 630, cy: 424, r: 110, fill: 'url(#h-gloed)', class: 'gloed' }, z);
    el('line', { x1: 630, y1: 300, x2: 630, y2: 378, stroke: '#2A2420', 'stroke-width': 3, 'stroke-dasharray': '5 2.5' }, z);
    el('path', { d: 'M602 386 L630 362 L658 386 Z', fill: '#2E2A26' }, z);
    el('circle', { cx: 630, cy: 360, r: 4, fill: '#2E2A26' }, z);
    el('rect', { x: 606, y: 386, width: 48, height: 64, fill: '#FFE3A0', opacity: 0.55 }, z);
    el('rect', { x: 606, y: 386, width: 48, height: 64, fill: 'none', stroke: '#2E2A26', 'stroke-width': 3 }, z);
    el('path', { d: 'M630 386 V450 M606 418 H654', stroke: '#2E2A26', 'stroke-width': 1.6 }, z);
    el('rect', { x: 626, y: 424, width: 8, height: 22, fill: '#F5ECD8' }, z);
    el('path', { d: 'M630 424 C 626 419, 627 413, 630 407 C 633 413, 634 419, 630 424 Z', fill: 'url(#h-vlam)', class: 'vlam' }, z);
    el('rect', { x: 600, y: 450, width: 60, height: 8, fill: '#2E2A26' }, z);
  }

  function bouwDuiven(ouder) {
    const g = el('g', { 'data-na': 'z-duiven', 'data-doel': 'z-duiven', 'data-vonk': 'z-duiven', class: 'duiven' }, ouder);
    [[915, 288, 1], [990, 290, -1]].forEach(([x, y, r], i) => {
      const p = el('g', { transform: `translate(${x} ${y}) scale(${r} 1)` }, g);
      const d = el('g', { class: 'duif', style: `animation-delay:-${i * 1.3}s` }, p);
      el('path', { d: 'M-22 -10 L-34 -4 L-22 -2 Z', fill: '#6D7682' }, d);
      el('ellipse', { cx: 0, cy: -12, rx: 20, ry: 11, fill: '#8E97A3' }, d);
      el('path', { d: 'M-14 -16 Q2 -22 12 -12 Q0 -6 -14 -8 Z', fill: '#727C88' }, d);
      el('path', { d: 'M-12 -12 h 16 M-10 -9 h 14', stroke: '#4A525C', 'stroke-width': 1.6 }, d);
      el('circle', { cx: 16, cy: -22, r: 7.5, fill: '#7D8794' }, d);
      el('path', { d: 'M10 -16 Q16 -12 22 -16 L20 -10 Q15 -8 10 -10 Z', fill: '#5E8A7A', opacity: 0.8 }, d);
      el('path', { d: 'M22 -23 l6 2 l-6 1.5 Z', fill: '#E7C9A8' }, d);
      el('circle', { cx: 18, cy: -24, r: 1.6, fill: '#B6452C' }, d);
      el('path', { d: 'M-2 -2 v4 M4 -2 v4', stroke: '#D9837A', 'stroke-width': 2 }, d);
    });
  }

  // ============================================================
  // DE GEVEL AAN DE GRACHT (viewBox 1600 x 1000)
  // ============================================================
  function bouwGevel() {
    zaad = 99;
    const svg = el('svg', { viewBox: '0 0 1600 1000', class: 'gevel-svg', preserveAspectRatio: 'xMidYMax slice', role: 'group', 'aria-label': 'Het Speelhuys: een grachtenpand met een trapgevel' });
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
    [[190, 420], [320, 420], [450, 420], [190, 580], [320, 580], [450, 580], [190, 745], [450, 745]].forEach(([cx, y]) => raam(gevelGroep, cx, y, 70, 104, false));
    bouwHerberg(gevelGroep);
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
    const luikDicht = el('g', { class: 'luik-dicht' }, huis);
    el('rect', { x: 777, y: 231, width: 22, height: 72, fill: '#2C4A35' }, luikDicht);
    el('rect', { x: 801, y: 231, width: 22, height: 72, fill: '#2C4A35' }, luikDicht);
    const luikOpen = el('g', { class: 'luik-open' }, huis);
    el('rect', { x: 777, y: 231, width: 46, height: 72, fill: 'url(#g-binnen)', class: 'raam-gloed' }, luikOpen);
    el('rect', { x: 748, y: 229, width: 22, height: 74, fill: '#2C4A35', stroke: '#1E3326', 'stroke-width': 1.5 }, luikOpen);
    el('rect', { x: 830, y: 229, width: 22, height: 74, fill: '#2C4A35', stroke: '#1E3326', 'stroke-width': 1.5 }, luikOpen);
    el('path', { d: 'M800 231 v 20 M793 251 h 14 l -3 14 h -8 Z', stroke: '#3A2614', 'stroke-width': 1.5, fill: '#FFE3A0' }, luikOpen);
    el('rect', { x: 769, y: 223, width: 62, height: 88, fill: 'none', stroke: '#FFD98A', 'stroke-width': 3, class: 'luik-wenk', rx: 2 }, huis);
    raam(huis, 690, 300, 54, 70, false);
    raam(huis, 910, 300, 54, 70, false);
    plekKlik(huis, { x: 766, y: 220, width: 68, height: 94, class: 'plek-klik luik-klik' }, 'zolder', 'Naar de zolder');
    slotje(huis, 800, 268, 'zolder');
    // vensters
    [640, 800, 960].forEach((cx) => raam(huis, cx, 432, 86, 108, false, true));
    [640, 960].forEach((cx) => raam(huis, cx, 588, 86, 108, false, true));
    [640, 960].forEach((cx) => raam(huis, cx, 742, 92, 120, true, true, true));
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
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: 'transparent', class: 'deur-klik plek-klik', 'data-plek': 'voorkamer', role: 'button', tabindex: 0, 'aria-label': 'Naar de voorkamer' }, huis);
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
    bouwGevelSeizoen(svg, defs);
    return svg;
  }

  function raam(ouder, cx, top, b, h, luiken, boog, gloed) {
    const x = cx - b / 2;
    if (boog) {
      el('path', { d: `M${x - 6} ${top - 2} A${b / 2 + 6} ${(b / 2 + 6) * 0.42} 0 0 1 ${x + b + 6} ${top - 2}`, fill: 'none', stroke: '#E4D8BD', 'stroke-width': 10 }, ouder);
      el('path', { d: `M${x - 6} ${top - 2} A${b / 2 + 6} ${(b / 2 + 6) * 0.42} 0 0 1 ${x + b + 6} ${top - 2}`, fill: 'none', stroke: '#A8452E', 'stroke-width': 10, 'stroke-dasharray': '8 9' }, ouder);
    }
    el('rect', { x, y: top, width: b, height: h, fill: '#EFEADF' }, ouder);
    el('rect', { x: x + 6, y: top + 6, width: b - 12, height: h - 12, fill: 'url(#g-ruit)' }, ouder);
    if (gloed) el('rect', { x: x + 6, y: top + 6, width: b - 12, height: (h - 12) * 0.44, fill: 'url(#g-binnen)', class: 'raam-gloed' }, ouder);
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

  // ---------- Plekken aan de gracht: elke plek is een deur naar een kamer of een spel buiten ----------
  function slotje(ouder, x, y, plek) {
    const g = el('g', { class: 'plek-slot', 'data-slot': plek, transform: `translate(${x} ${y})`, 'pointer-events': 'none' }, ouder);
    el('circle', { r: 16, fill: '#2A1A0C', opacity: 0.85 }, g);
    el('circle', { r: 16, fill: 'none', stroke: '#E7C36A', 'stroke-width': 1.6 }, g);
    el('use', { href: '#i-slot', x: -9.5, y: -10, width: 19, height: 19, style: 'color:#F4E9CF' }, g);
    return g;
  }
  function plekKlik(ouder, attrs, plek, label) {
    return el('rect', Object.assign({ fill: 'transparent', class: 'plek-klik', 'data-plek': plek, role: 'button', tabindex: 0, 'aria-label': label }, attrs), ouder);
  }

  function bouwHerberg(ouder) {
    const g = el('g', { class: 'herberg' }, ouder);
    deurtje(g, 320, 760);
    el('rect', { x: 254, y: 712, width: 132, height: 32, rx: 3, fill: '#2C4A35', stroke: '#C9973F', 'stroke-width': 2.4 }, g);
    tekst('Herberg', { x: 320, y: 734, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 19, fill: '#F2D78E' }, g);
    // lantaarn naast de deur, met een kroes op het glas
    el('path', { d: 'M372 770 h 18 v 8', fill: 'none', stroke: '#1E1814', 'stroke-width': 2.4 }, g);
    el('path', { d: 'M380 778 l 10 -8 l 10 8 Z', fill: '#1E1814' }, g);
    el('rect', { x: 381, y: 778, width: 18, height: 24, fill: '#FFD98A', class: 'lamp-glas' }, g);
    el('rect', { x: 381, y: 778, width: 18, height: 24, fill: 'none', stroke: '#1E1814', 'stroke-width': 2 }, g);
    plekKlik(g, { x: 276, y: 750, width: 88, height: 155 }, 'herberg', 'Herberg, binnenkort');
    slotje(g, 320, 828, 'herberg');
  }

  // ---------- Seizoenen buiten ----------
  function bouwGevelSeizoen(svg, defs) {
    // Sinterklaas: de stoomboot in de gracht en het witte paard op het dak
    const sint = el('g', { class: 'alleen-sinterklaas' }, svg);
    const boot = el('g', { class: 'stoomboot', transform: 'translate(1230 984)' }, sint);
    const deint = el('g', { class: 'deinen' }, boot);
    el('path', { d: 'M-96 -18 H96 L80 6 H-84 Z', fill: '#2A2F3A' }, deint);
    el('path', { d: 'M-96 -18 H96 L93 -13 H-94 Z', fill: '#B6452C' }, deint);
    el('rect', { x: -58, y: -40, width: 100, height: 22, fill: '#F4F1E8', stroke: '#6E6A62', 'stroke-width': 1 }, deint);
    [-48, -30, -12, 6, 24].forEach((x) => el('rect', { x, y: -35, width: 10, height: 9, rx: 2, fill: '#2C4A7C' }, deint));
    el('rect', { x: -8, y: -64, width: 14, height: 26, fill: '#B6452C' }, deint);
    el('rect', { x: -8, y: -64, width: 14, height: 5, fill: '#2A2F3A' }, deint);
    el('line', { x1: 60, y1: -18, x2: 60, y2: -72, stroke: '#2A2F3A', 'stroke-width': 2 }, deint);
    el('path', { d: 'M60 -72 h 26 v 9 h -26 Z', fill: '#B6452C' }, deint);
    el('path', { d: 'M60 -63 h 26 v 9 h -26 Z', fill: '#F4F1E8' }, deint);
    el('path', { d: 'M-80 -18 l 0 -26 M-80 -44 l 22 26', stroke: '#2A2F3A', 'stroke-width': 1.5 }, deint);
    [[-60, -6, '#E7C36A'], [-44, -4, '#2B4C9A'], [52, -6, '#4F8A3A']].forEach(([x, w, k]) => {
      el('rect', { x, y: -54 - w, width: 14, height: 14, fill: k, stroke: '#1E1814', 'stroke-width': 0.6 }, deint);
    });
    const rook = el('g', { class: 'rook' }, boot);
    [0, 1, 2].forEach((i) => el('circle', { cx: -1, cy: -72, r: 8 + i * 3, fill: '#E9E6DE', opacity: 0.8, style: `animation-delay:-${i * 1.2}s` }, rook));
    // het paard van de Sint op het dak, met zijn ruiter
    const paard = el('g', { class: 'dakpaard', transform: 'translate(884 213) scale(.62)' }, sint);
    el('path', { d: 'M-34 -26 Q-30 -46 0 -46 Q26 -46 30 -30 L46 -58 Q54 -64 60 -58 L64 -46 Q56 -44 50 -36 L38 -22 Q34 -14 26 -14 L-26 -14 Q-40 -16 -34 -26 Z', fill: '#F4F1E8', stroke: '#8E8A80', 'stroke-width': 2 }, paard);
    el('path', { d: 'M-28 -16 L-34 0 M-16 -16 L-14 0 M18 -16 L14 0 M28 -16 L34 0', stroke: '#F4F1E8', 'stroke-width': 6, 'stroke-linecap': 'round' }, paard);
    el('path', { d: 'M-28 -16 L-34 0 M-16 -16 L-14 0 M18 -16 L14 0 M28 -16 L34 0', stroke: '#8E8A80', 'stroke-width': 1, fill: 'none' }, paard);
    el('path', { d: 'M-34 -28 q -16 4 -18 22', fill: 'none', stroke: '#D9D4C8', 'stroke-width': 5, 'stroke-linecap': 'round' }, paard);
    el('path', { d: 'M46 -58 q -6 6 -10 16', fill: 'none', stroke: '#D9D4C8', 'stroke-width': 4 }, paard);
    el('path', { d: 'M-12 -44 Q-16 -76 0 -84 Q16 -76 12 -44 Z', fill: '#B6452C' }, paard);
    el('path', { d: 'M-8 -84 Q0 -110 8 -84 Z', fill: '#F4F1E8', stroke: '#B6452C', 'stroke-width': 2 }, paard);
    el('path', { d: 'M0 -102 v 12 M-4 -96 h 8', stroke: '#E7C36A', 'stroke-width': 2 }, paard);
    el('path', { d: 'M-6 -84 q 6 14 12 0', fill: '#F4F1E8' }, paard);
    el('line', { x1: 14, y1: -60, x2: 30, y2: -110, stroke: '#E7C36A', 'stroke-width': 3 }, paard);
    el('path', { d: 'M30 -110 q 8 -2 6 8', fill: 'none', stroke: '#E7C36A', 'stroke-width': 3 }, paard);

    // Winter: sneeuw op de trappen en vensterbanken, sneeuwval en een bevroren gracht met schaatsers
    const winter = el('g', { class: 'alleen-winter' }, svg);
    [[584, 400], [638, 338], [692, 276], [746, 214], [854, 214], [908, 276], [962, 338], [1016, 400]].forEach(([x, y], i) => {
      el('rect', { x: (i < 4 ? x - 60 : x - 6), y: y - 15, width: 66, height: 9, rx: 4.5, fill: '#FBFBF7' }, winter);
    });
    el('rect', { x: 736, y: 136, width: 128, height: 10, rx: 5, fill: '#FBFBF7' }, winter);
    el('rect', { x: 94, y: 349, width: 452, height: 9, rx: 4.5, fill: '#FBFBF7' }, winter);
    el('rect', { x: 1054, y: 369, width: 452, height: 9, rx: 4.5, fill: '#FBFBF7' }, winter);
    [[640, 432, 86, 108], [800, 432, 86, 108], [960, 432, 86, 108], [640, 588, 86, 108], [960, 588, 86, 108], [640, 742, 92, 120], [960, 742, 92, 120], [690, 300, 54, 70], [910, 300, 54, 70]].forEach(([cx, top, b, h]) => {
      el('rect', { x: cx - b / 2 - 7, y: top + h - 4, width: b + 14, height: 7, rx: 3.5, fill: '#FBFBF7' }, winter);
    });
    el('rect', { x: 0, y: 899, width: 1600, height: 8, fill: '#FBFBF7', opacity: 0.9 }, winter);
    const ijs = el('g', {}, winter);
    el('rect', { x: 0, y: 958, width: 1600, height: 42, fill: '#CFE0E8' }, ijs);
    for (let i = 0; i < 22; i++) {
      const x = rnd() * 1600, y = 962 + rnd() * 34, l = 30 + rnd() * 90;
      el('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)} q ${(l / 2).toFixed(1)} ${(rnd() * 4 - 2).toFixed(1)} ${l.toFixed(1)} 0`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.2, opacity: 0.7 }, ijs);
    }
    [[0, 1, 46], [1, 0.85, 62]].forEach(([i, s, duur]) => {
      const loop = el('g', { class: 'schaatser', style: `animation-duration:${duur}s;animation-delay:-${i * 23}s` }, ijs);
      const f = el('g', { transform: `translate(0 992) scale(${s})` }, loop);
      const lijf = el('g', { class: 'schaats-lijf', style: `animation-delay:-${i * 0.4}s` }, f);
      el('ellipse', { cx: 10, cy: 2, rx: 22, ry: 3, fill: '#7A93A0', opacity: 0.5 }, f);
      el('path', { d: 'M10 -30 L18 -12 L30 -2 M18 -12 L4 -2', fill: 'none', stroke: '#2A2A30', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lijf);
      el('path', { d: 'M-2 -2 h 12 M24 -1 h 12', stroke: '#9AA4AA', 'stroke-width': 1.6 }, lijf);
      el('path', { d: 'M4 -50 Q12 -46 14 -30 L8 -28 Q2 -40 4 -50 Z', fill: i ? '#2C4A7C' : '#5A2A20' }, lijf);
      el('circle', { cx: 2, cy: -54, r: 5.5, fill: '#E8C9A8' }, lijf);
      el('path', { d: 'M-3 -57 q 5 -8 11 -1', fill: i ? '#B6452C' : '#2A2A30' }, lijf);
      el('path', { d: 'M4 -48 q -10 2 -16 8', fill: 'none', stroke: '#B6452C', 'stroke-width': 3, 'stroke-linecap': 'round' }, lijf);
    });
    plekKlik(winter, { x: 0, y: 958, width: 1600, height: 42 }, 'ijsbaan', 'IJsbaan, binnenkort');
    const sneeuw = el('g', { class: 'sneeuwval', 'pointer-events': 'none' }, winter);
    for (let i = 0; i < 70; i++) {
      el('circle', { cx: (rnd() * 1640 - 20).toFixed(1), cy: (-30 - rnd() * 40).toFixed(1), r: (1.6 + rnd() * 3).toFixed(1), fill: '#FFFFFF', opacity: (0.6 + rnd() * 0.4).toFixed(2), class: 'vlok', style: `animation-delay:-${(rnd() * 14).toFixed(1)}s;animation-duration:${(9 + rnd() * 8).toFixed(1)}s` }, sneeuw);
    }

    // Koningsdag: vlaggetjes over de gevels, de vlag met oranje wimpel en een draaiorgel op de kade
    const oranje = el('g', { class: 'alleen-koningsdag' }, svg);
    vlaggetjes(oranje, [540, 520], [1060, 520], 36, 24);
    vlaggetjes(oranje, [100, 680], [540, 680], 36, 22);
    vlaggetjes(oranje, [1060, 700], [1500, 700], 36, 22);
    const vlag = el('g', { class: 'vlag', transform: 'translate(1062 470) rotate(-35)' }, oranje);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -130, stroke: '#E9E2D2', 'stroke-width': 4 }, vlag);
    el('circle', { cx: 0, cy: -132, r: 4, fill: '#E7C36A' }, vlag);
    const doek = el('g', { class: 'vlag-doek' }, vlag);
    el('rect', { x: 2, y: -126, width: 62, height: 14, fill: '#B6452C' }, doek);
    el('rect', { x: 2, y: -112, width: 62, height: 14, fill: '#F4F1E8' }, doek);
    el('rect', { x: 2, y: -98, width: 62, height: 14, fill: '#2B4C9A' }, doek);
    el('path', { d: 'M2 -126 L110 -122 L2 -116 Z', fill: '#E8741C' }, doek);
    bouwDraaiorgel(oranje);
  }

  function bouwDraaiorgel(ouder) {
    const g = el('g', { class: 'orgel', transform: 'translate(1384 903)' }, ouder);
    el('ellipse', { cx: 4, cy: 2, rx: 76, ry: 6, fill: '#000', opacity: 0.25 }, g);
    el('rect', { x: -66, y: -26, width: 132, height: 14, fill: '#5A2A20' }, g);
    [-44, 44].forEach((x) => {
      el('circle', { cx: x, cy: -10, r: 15, fill: '#3A2418', stroke: '#E7C36A', 'stroke-width': 2.5 }, g);
      el('path', { d: `M${x - 13} -10 h 26 M${x} -23 v 26 M${x - 9} -19 l 18 18 M${x + 9} -19 l -18 18`, stroke: '#E7C36A', 'stroke-width': 1.5 }, g);
    });
    el('path', { d: 'M-60 -26 V-98 Q-60 -132 0 -138 Q60 -132 60 -98 V-26 Z', fill: '#B6452C', stroke: '#E7C36A', 'stroke-width': 3 }, g);
    for (let i = -4; i <= 4; i++) {
      const h = 64 - Math.abs(i) * 6;
      el('rect', { x: i * 11 - 3.5, y: -36 - h, width: 7, height: h, rx: 3, fill: '#F0D27A', stroke: '#9A6E26', 'stroke-width': 0.8 }, g);
    }
    el('path', { d: 'M-50 -36 H50', stroke: '#E7C36A', 'stroke-width': 4 }, g);
    el('circle', { cx: 0, cy: -118, r: 9, fill: '#E8741C', stroke: '#E7C36A', 'stroke-width': 2 }, g);
    [-40, 40].forEach((x) => el('circle', { cx: x, cy: -112, r: 6, fill: '#2B4C9A', stroke: '#E7C36A', 'stroke-width': 1.5 }, g));
    el('path', { d: 'M60 -70 h 14 v 14', fill: 'none', stroke: '#2A1A0C', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    const noten = el('g', { class: 'noten', 'pointer-events': 'none' }, g);
    [[-30, 0], [10, 1.3], [36, 2.6]].forEach(([x, d]) => {
      const n = el('g', { class: 'noot', style: `animation-delay:-${d}s` }, noten);
      el('ellipse', { cx: x, cy: -146, rx: 5, ry: 4, fill: '#2A1A0C' }, n);
      el('path', { d: `M${x + 4} -146 v -18 q 6 2 8 8`, fill: 'none', stroke: '#2A1A0C', 'stroke-width': 2 }, n);
    });
    plekKlik(g, { x: -70, y: -142, width: 140, height: 146 }, 'kermis', 'Kermis, binnenkort');
    slotje(g, 0, -72, 'kermis');
  }

  // ============================================================
  // GEDRAG
  // ============================================================
  let toneel, kamer, kamerScroll, kamerSvg = null, indeling = null, gevel, gevelSvg, sluier, label, hint, vonkenLaag;
  let klusknop, voortgang, wenkEl, knopKamer, gebouwd = false, bezig = false, wenkTimer = 0, maatTimer = 0, labelTimer = 0;
  let kamerNaam = 'voorkamer', getekend = null;

  const rustig = () => bewegingRustig();
  const wacht = (ms) => new Promise((res) => setTimeout(res, ms));
  function sessie(sleutel, waarde) {
    try {
      if (waarde === undefined) return sessionStorage.getItem(sleutel);
      sessionStorage.setItem(sleutel, waarde);
    } catch (e) { /* */ }
    return null;
  }
  const zetBinnen = (w) => sessie('speelhuys.binnen', w ? '1' : '');
  const isBinnen = () => sessie('speelhuys.binnen') === '1';
  const KAMERS = ['voorkamer', 'zolder'];
  const kamerTitel = (k) => (window.Duiten && Duiten.kamers[k] ? Duiten.kamers[k].naam : k);
  const kamerOpen = (k) => !window.Duiten || Duiten.kamerOpen(k);
  const andereKamer = () => (kamerNaam === 'voorkamer' ? 'zolder' : 'voorkamer');
  function zetKamerNaam(k) { kamerNaam = k; sessie('speelhuys.kamer', k); }

  // Staand (telefoon) of breed (computer, tablet)?
  function gewensteIndeling() {
    const b = toneel.clientWidth || window.innerWidth, h = toneel.clientHeight || window.innerHeight;
    return b / h < 0.72 ? 'staand' : 'breed';
  }

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
    vonkenLaag = document.getElementById('vonken');
    klusknop = document.getElementById('klusknop');
    voortgang = document.getElementById('voortgang');
    wenkEl = document.getElementById('klus-wenk');
    knopKamer = document.getElementById('knop-kamer');

    const bewaard = sessie('speelhuys.kamer');
    kamerNaam = KAMERS.includes(bewaard) && kamerOpen(bewaard) ? bewaard : 'voorkamer';

    gevelSvg = bouwGevel();
    gevel.insertBefore(gevelSvg, gevel.firstChild);
    maakKamer(gewensteIndeling());

    // plekken aan de gracht: in de tekening en in de balk eronder
    gevel.querySelectorAll('[data-plek]').forEach((p) => {
      p.addEventListener('click', (e) => { e.preventDefault(); kiesPlek(p.getAttribute('data-plek'), p); });
      if (p.tagName.toLowerCase() !== 'button') {
        p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kiesPlek(p.getAttribute('data-plek'), p); } });
      }
    });
    document.getElementById('naar-binnen').addEventListener('click', () => binnengaan('voorkamer'));
    const buiten = document.getElementById('naar-buiten');
    if (buiten) buiten.addEventListener('click', (e) => { e.preventDefault(); naarBuiten(); });
    const straat = document.getElementById('knop-straat');
    if (straat) straat.addEventListener('click', () => { if (!bezig) naarBuiten(); });
    const kast = document.getElementById('knop-kast');
    if (kast) kast.addEventListener('click', () => { if (window.Pronk) Pronk.open(); });
    if (knopKamer) knopKamer.addEventListener('click', () => gaNaarKamer(andereKamer(), knopKamer));
    kamerScroll.addEventListener('scroll', () => { if (hint) hint.classList.add('weg'); verbergLabel(); }, { passive: true });
    klusknop.addEventListener('click', doeKlus);
    window.addEventListener('resize', () => {
      clearTimeout(maatTimer);
      maatTimer = setTimeout(pasMaatAan, 160);
    });
    if (window.Duiten) window.Duiten.opWijziging(() => { werkHudBij(); werkGevelBij(); });
    if (window.Seizoen) window.Seizoen.opWijziging(() => { if (kamerSvg) zetSchoen(kamerSvg); });
    werkHudBij();
    werkGevelBij();

    // zachte diepte bij het bewegen van de muis
    toneel.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || rustig()) return;
      const r = toneel.getBoundingClientRect();
      toneel.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      toneel.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  }

  function maakKamer(naam) {
    const nieuw = kamerNaam === 'zolder' ? bouwZolder(ZOLDER[naam]) : bouwVoorkamer(INDELINGEN[naam]);
    pasStaatToe(nieuw);
    zetSchoen(nieuw);
    if (kamerSvg) kamerScroll.replaceChild(nieuw, kamerSvg); else kamerScroll.appendChild(nieuw);
    kamerSvg = nieuw;
    indeling = naam;
    getekend = kamerNaam;
    kamer.classList.toggle('staand', naam === 'staand');
    kamer.setAttribute('data-kamer', kamerNaam);
    koppelVoorwerpen(nieuw);
    zetScrollModus();
    centreer();
    werkHudBij();
  }

  function pasMaatAan() {
    if (!gebouwd || bezig) return;
    const gewenst = gewensteIndeling();
    if (gewenst !== indeling || getekend !== kamerNaam) maakKamer(gewenst);
    else { zetScrollModus(); centreer(); }
  }

  // Brede kamer in een smal venster: zijwaarts vegen in plaats van bijsnijden.
  function zetScrollModus() {
    const b = toneel.clientWidth, h = toneel.clientHeight;
    kamer.classList.toggle('scrollen', indeling === 'breed' && h > 0 && b / h < 1.35);
  }

  function schud(e) {
    if (!e) return;
    e.classList.remove('schud'); void e.getBoundingClientRect(); e.classList.add('schud');
  }

  function koppelVoorwerpen(svg) {
    const viaToetsen = (v) => { try { return v.matches(':focus-visible'); } catch (e) { return false; } };
    svg.querySelectorAll('.voorwerp').forEach((v) => {
      // labels alleen bij de muis of het toetsenbord: op een aanraakscherm kan een label dat bij het
      // aanraken verschijnt ervoor zorgen dat Safari de tik als "aanwijzen" ziet en niet als klik
      v.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') toonLabel(v); });
      v.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') verbergLabel(); });
      v.addEventListener('focus', () => { if (viaToetsen(v)) toonLabel(v); });
      v.addEventListener('blur', verbergLabel);
      v.addEventListener('click', (e) => {
        if (v.classList.contains('speelbaar')) {
          e.preventDefault();
          zoomNaar(v);
        } else if (v.hasAttribute('data-kamer')) {
          gaNaarKamer(v.getAttribute('data-kamer'), v);
        } else {
          toonLabel(v);
          schud(v);
          Geluid.pak();
        }
      });
      v.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !v.classList.contains('speelbaar')) { e.preventDefault(); v.dispatchEvent(new MouseEvent('click')); }
      });
    });
    const kat = svg.querySelector('.kat');
    if (kat) kat.addEventListener('click', () => { if (window.Duiten && Duiten.klusKlaar('kat')) Geluid.miauw(); });
    svg.querySelectorAll('.duiven').forEach((d) => d.addEventListener('click', () => { if (Geluid.koer) Geluid.koer(); schud(d); }));
    svg.querySelectorAll('.hobbel').forEach((h) => h.addEventListener('click', () => { Geluid.hout(); h.classList.remove('hobbelt'); void h.getBoundingClientRect(); h.classList.add('hobbelt'); }));
    const schoen = svg.querySelector('.schoen');
    if (schoen) {
      schoen.addEventListener('click', () => klikSchoen(schoen));
      schoen.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); klikSchoen(schoen); } });
    }
  }

  // ---------- De klomp van Sinterklaas ----------
  function zetSchoen(svg) {
    const s = svg && svg.querySelector('.schoen');
    if (!s || !window.Seizoen) return;
    const stand = Seizoen.schoenStand();
    s.setAttribute('data-stand', stand);
    s.setAttribute('aria-label', stand === 'leeg' ? 'Zet je klomp' : stand === 'gezet' ? 'Je klomp staat klaar. Morgen kijken!' : 'Er zit iets in je klomp!');
  }
  function klikSchoen(s) {
    if (!window.Seizoen || bezig) return;
    const uit = Seizoen.schoenKlik();
    if (uit === 'gezet') {
      if (Geluid.plop) Geluid.plop();
      vonkenOp(s.getBoundingClientRect(), 12);
      toonLabel(s, 'Morgen kijken!');
    } else if (uit === 'wacht') {
      schud(s);
      Geluid.pak();
      toonLabel(s, 'Morgen kijken!');
    }
    zetSchoen(kamerSvg);
  }

  // ---------- Opknappen: de stand van de kamer ----------
  function alleKlussen() {
    const ids = [];
    Object.values(Duiten.kamers).forEach((k) => {
      k.klussen.forEach((x) => ids.push(x.id));
      if (k.ontgrendelt) ids.push(k.ontgrendelt.id);
    });
    return ids;
  }

  function pasStaatToe(svg) {
    if (!window.Duiten || !svg) return;
    alleKlussen().forEach((id) => {
      const af = Duiten.klusKlaar(id);
      svg.querySelectorAll(`[data-na="${id}"]`).forEach((e) => e.classList.toggle('uit', !af));
      svg.querySelectorAll(`[data-voor="${id}"]`).forEach((e) => e.classList.toggle('uit', af));
    });
    zetSchemer(svg);
  }

  const VERSCHIJNEN = ['kroon', 'prenten', 'servies', 'kleed', 'kat', 'trap', 'z-rommel', 'z-lantaarn', 'z-kleed', 'z-hobbel', 'z-duiven'];
  function pasKlusToe(id) {
    kamerSvg.querySelectorAll(`[data-na="${id}"]`).forEach((e) => {
      e.classList.remove('uit');
      if (VERSCHIJNEN.includes(id) && !rustig()) {
        e.classList.add('verschijnt');
        setTimeout(() => e.classList.remove('verschijnt'), 1100);
      }
    });
    kamerSvg.querySelectorAll(`[data-voor="${id}"]`).forEach((e) => e.classList.add('uit'));
  }

  function zetSchemer(svg) {
    const doel = svg || kamerSvg;
    const s = doel && doel.querySelector('.schemer');
    if (!s || !window.Duiten) return;
    const k = doel.getAttribute('data-kamer') || 'voorkamer';
    const deel = Duiten.aantalKlaar(k) / Duiten.klussenVan(k).length;
    s.style.opacity = ((k === 'zolder' ? 0.42 : 0.34) * (1 - deel)).toFixed(3);
  }

  // De knop onderin: de volgende klus, of door naar de volgende kamer.
  function werkHudBij() {
    if (!klusknop || !window.Duiten) return;
    const k = kamerNaam, lijst = Duiten.klussenVan(k), v = Duiten.volgendeKlus(k), n = Duiten.aantalKlaar(k);
    voortgang.innerHTML = lijst.map((x) => `<i class="${Duiten.klusKlaar(x.id) ? 'af' : ''}"></i>`).join('');
    voortgang.setAttribute('aria-label', `${kamerTitel(k)} opgeknapt: ${n} van ${lijst.length}`);
    const use = document.getElementById('klus-ikoon-use');
    const naamEl = document.getElementById('klus-naam'), prijsEl = document.getElementById('klus-prijs');
    const prijsVak = document.getElementById('klus-prijs-vak'), meter = document.getElementById('klus-meter');
    const ont = Duiten.kamers[k].ontgrendelt;
    const verder = !v && ont && Duiten.klusKlaar(ont.id) ? ont : null;
    klusknop.classList.toggle('ga', !!verder);
    if (verder) {
      use.setAttribute('href', '#i-' + verder.icoon);
      naamEl.textContent = 'Naar de ' + kamerTitel(verder.kamer).toLowerCase();
      prijsVak.hidden = true;
      meter.style.width = '100%';
      klusknop.classList.add('klaar');
      klusknop.classList.remove('kan');
      klusknop.setAttribute('aria-label', naamEl.textContent);
    } else if (!v) {
      use.setAttribute('href', '#i-ster');
      naamEl.textContent = kamerTitel(k) + ' klaar!';
      prijsVak.hidden = true;
      meter.style.width = '100%';
      klusknop.classList.add('klaar');
      klusknop.classList.remove('kan');
      klusknop.setAttribute('aria-label', `De ${kamerTitel(k).toLowerCase()} is helemaal opgeknapt`);
    } else {
      use.setAttribute('href', '#i-' + v.icoon);
      naamEl.textContent = v.naam;
      prijsEl.textContent = v.prijs;
      prijsVak.hidden = false;
      meter.style.width = Math.min(100, Math.round(Duiten.saldo / v.prijs * 100)) + '%';
      const kan = Duiten.saldo >= v.prijs;
      klusknop.classList.toggle('kan', kan);
      klusknop.classList.remove('klaar');
      klusknop.setAttribute('aria-label', kan ? `${v.naam} voor ${v.prijs} duiten` : `${v.naam}: nog ${v.prijs - Duiten.saldo} duiten nodig`);
    }
    if (knopKamer) {
      knopKamer.hidden = !Duiten.kamerOpen('zolder');
      const naar = andereKamer();
      const tekst = 'Naar de ' + kamerTitel(naar).toLowerCase();
      knopKamer.setAttribute('aria-label', tekst);
      knopKamer.title = tekst;
      knopKamer.classList.toggle('omlaag', kamerNaam === 'zolder');
      const use = knopKamer.querySelector('use');
      if (use) use.setAttribute('href', kamerNaam === 'zolder' ? '#i-trap-af' : '#i-trap');
    }
    if (kamerSvg) zetSchoen(kamerSvg);
  }

  // De straat: welke plekken zijn open?
  function werkGevelBij() {
    if (!gevelSvg || !window.Duiten) return;
    const zolder = Duiten.kamerOpen('zolder');
    gevelSvg.classList.toggle('zolder-open', zolder);
    gevelSvg.classList.toggle('kamer-klaar', Duiten.kamerKlaar('voorkamer'));
    document.querySelectorAll('.plek-knop').forEach((k) => {
      const p = k.getAttribute('data-plek');
      const open = p === 'voorkamer' || (p === 'zolder' && zolder);
      k.classList.toggle('dicht', !open);
      const naam = k.querySelector('.plek-naam') ? k.querySelector('.plek-naam').textContent : p;
      k.setAttribute('aria-label', open ? naam : `${naam}, nog op slot`);
    });
    const welkom = gevel.querySelector('.gevel-tekst');
    if (welkom) welkom.hidden = !!Duiten.veld('bezocht', false);
  }

  function kiesPlek(plek, bron) {
    if (bezig) return;
    if (plek === 'voorkamer' || plek === 'zolder') {
      if (!kamerOpen(plek)) {
        schud(bron);
        Geluid.pak();
        if (window.Tril) Tril.fout();
        toonLabel(bron, 'Knap eerst de voorkamer op');
        return;
      }
      binnengaan(plek);
      return;
    }
    schud(bron);
    Geluid.pak();
    toonLabel(bron, { herberg: 'De herberg: binnenkort', kermis: 'De kermis: binnenkort', ijsbaan: 'De ijsbaan: binnenkort' }[plek] || 'Binnenkort');
  }

  function toonWenk(tekst) {
    if (!wenkEl) return;
    wenkEl.querySelector('span').textContent = tekst;
    wenkEl.hidden = false;
    wenkEl.classList.remove('in'); void wenkEl.offsetWidth; wenkEl.classList.add('in');
    clearTimeout(wenkTimer);
    wenkTimer = setTimeout(verbergWenk, 3400);
  }
  function verbergWenk() { if (wenkEl) wenkEl.hidden = true; }

  async function doeKlus() {
    if (bezig || !window.Duiten) return;
    try {
      await voerKlusUit();
    } catch (err) {
      bezig = false;
      kamer.classList.remove('hud-weg');
      if (kamerSvg) { kamerSvg.getAnimations().forEach((a) => a.cancel()); kamerSvg.classList.remove('zoomt'); pasStaatToe(kamerSvg); }
      werkHudBij();
    }
  }
  async function voerKlusUit() {
    if (klusknop.classList.contains('ga')) {
      const ont = Duiten.kamers[kamerNaam].ontgrendelt;
      if (ont) gaNaarKamer(ont.kamer, klusknop);
      return;
    }
    const v = Duiten.volgendeKlus(kamerNaam);
    if (!v) {
      toonWenk(kamerNaam === 'zolder' ? 'De herberg komt eraan' : 'Nieuwe kamers komen eraan');
      vonkenOp(klusknop.getBoundingClientRect(), 10);
      return;
    }
    if (Duiten.saldo < v.prijs) {
      schud(klusknop);
      if (window.Tril) Tril.fout();
      toonWenk('Speel een spel en verdien duiten');
      kamerSvg.querySelectorAll('.speelbaar').forEach((s) => { s.classList.remove('wenk'); void s.getBoundingClientRect(); s.classList.add('wenk'); });
      Geluid.pak();
      return;
    }
    bezig = true;
    verbergWenk();
    verbergLabel();
    Duiten.af(v.prijs);
    Geluid.munt();
    const doel = kamerSvg.querySelector(`[data-doel="${v.id}"]`);
    let ingezoomd = null;
    kamer.classList.add('hud-weg');
    if (doel && !rustig()) {
      const t = toneel.getBoundingClientRect(), r = doel.getBoundingClientRect();
      if (r.width > 0 && r.width * r.height < t.width * t.height * 0.3) {
        centreerOp(doel);
        ingezoomd = zoomWaarden(doel, 1.45, true);
        kamerSvg.classList.add('zoomt');
        const a = kamerSvg.animate([{ transform: 'translate(0px, 0px) scale(1)' }, { transform: ingezoomd }], { duration: 750, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
        await a.finished.catch(() => {});
      }
    }
    Geluid.klus();
    if (window.Tril) Tril.succes();
    pasKlusToe(v.id);
    Duiten.markeer(v.id);
    zetSchemer();
    await wacht(rustig() ? 0 : 150);
    vonkenVoor(v.id);
    if (v.id === 'kat') setTimeout(() => Geluid.miauw(), 900);
    if (v.id === 'z-duiven' && Geluid.koer) setTimeout(() => Geluid.koer(), 900);
    await wacht(rustig() ? 400 : 1700);
    if (ingezoomd) {
      const a = kamerSvg.animate([{ transform: ingezoomd }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: 700, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
      await a.finished.catch(() => {});
      kamerSvg.getAnimations().forEach((x) => x.cancel());
      kamerSvg.classList.remove('zoomt');
    }
    kamer.classList.remove('hud-weg');
    werkHudBij();
    werkGevelBij();
    bezig = false;
    if (v.kamer) feest(kamerTitel(v.kamer) + ' open!', 'trap');
    else if (Duiten.kamerKlaar(kamerNaam)) feest(kamerTitel(kamerNaam) + ' klaar!', 'ster');
  }

  // Sterretjes boven alles wat met de klus te maken heeft
  function vonkenVoor(id) {
    let doelen = Array.from(kamerSvg.querySelectorAll(`[data-vonk="${id}"]`));
    if (!doelen.length) doelen = Array.from(kamerSvg.querySelectorAll(`[data-na="${id}"], [data-voor="${id}"]`));
    const per = Math.max(6, Math.round(26 / Math.max(1, doelen.length)));
    doelen.forEach((d) => vonkenOp(d.getBoundingClientRect(), per));
  }

  function vonkenOp(r, aantal) {
    if (!vonkenLaag || rustig()) return;
    const t = toneel.getBoundingClientRect();
    const links = Math.max(r.left, t.left), boven = Math.max(r.top, t.top);
    const rechts = Math.min(r.right, t.right), onder = Math.min(r.bottom, t.bottom);
    if (rechts <= links || onder <= boven) return;
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (links - t.left + Math.random() * (rechts - links)) + 'px';
      v.style.top = (boven - t.top + Math.random() * (onder - boven)) + 'px';
      vonkenLaag.appendChild(v);
      const a = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(18 + Math.random() * 30).toFixed(0)}px)) scale(0) rotate(110deg)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 700, delay: Math.random() * 520, easing: 'ease-out', fill: 'both' });
      a.onfinish = () => v.remove();
    }
  }

  function feest(tekst, icoon) {
    Geluid.tada();
    vonkenOp(toneel.getBoundingClientRect(), 46);
    const banier = document.createElement('div');
    banier.className = 'feest';
    banier.setAttribute('role', 'status');
    banier.innerHTML = `<svg aria-hidden="true"><use href="#i-${icoon || 'ster'}"/></svg><span></span>`;
    banier.querySelector('span').textContent = tekst;
    toneel.appendChild(banier);
    setTimeout(() => banier.remove(), 3600);
  }

  // ---------- Labels bij de voorwerpen ----------
  function toonLabel(v, tekst) {
    if (!label || bezig || !v) return;
    const r = v.getBoundingClientRect(), t = toneel.getBoundingClientRect();
    label.textContent = tekst || v.getAttribute('data-label') || v.getAttribute('aria-label') || '';
    if (!label.textContent) return;
    label.hidden = false;
    const x = Math.min(t.width - 90, Math.max(90, r.left + r.width / 2 - t.left));
    const y = Math.min(t.height - 20, Math.max(44, r.top - t.top - 8));
    label.style.left = x + 'px';
    label.style.top = y + 'px';
    clearTimeout(labelTimer);
    if (tekst) labelTimer = setTimeout(verbergLabel, 2600);
  }
  function verbergLabel() { if (label) label.hidden = true; }

  // ---------- Inzoomen ----------
  function zoomWaarden(v, maxS, klem) {
    const t = toneel.getBoundingClientRect();
    const s0 = kamerSvg.getBoundingClientRect();
    const r = v.getBoundingClientRect();
    const cx = r.left + r.width / 2 - s0.left, cy = r.top + r.height / 2 - s0.top;
    const s = Math.min(t.width * 0.9 / r.width, t.height * 0.9 / r.height, maxS || 7);
    let tx = t.left + t.width / 2 - s0.left - s * cx, ty = t.top + t.height / 2 - s0.top - s * cy;
    if (klem) {
      const zl = t.left - s0.left, zr = zl + t.width, zt = t.top - s0.top, zo = zt + t.height;
      tx = Math.min(zl, Math.max(zr - s * s0.width, tx));
      ty = Math.min(zt, Math.max(zo - s * s0.height, ty));
    }
    return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(3)})`;
  }

  function zoomNaar(v) {
    if (bezig) return;
    const spel = v.getAttribute('data-spel');
    verbergLabel();
    verbergWenk();
    if (rustig()) { location.hash = '#' + spel; return; }
    bezig = true;
    try {
      kamerSvg.getAnimations().forEach((a) => a.cancel());
      const doel = zoomWaarden(v);
      Geluid.woesj();
      kamerSvg.classList.add('zoomt');
      kamer.classList.add('hud-weg');
      kamerSvg.animate([{ transform: 'translate(0px, 0px) scale(1)' }, { transform: doel }], { duration: 950, easing: 'cubic-bezier(.65,0,.3,1)', fill: 'forwards' });
      sluier.style.background = 'var(--grond)';
      sluier.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: 950, easing: 'ease-in', fill: 'forwards' });
    } catch (err) {
      bezig = false;
      location.hash = '#' + spel;
      return;
    }
    setTimeout(() => {
      bezig = false;
      location.hash = '#' + spel;
    }, 960);
  }

  // Van kamer wisselen: de trap op of af.
  async function gaNaarKamer(naar, bron) {
    if (bezig || !KAMERS.includes(naar)) return;
    try {
      await wisselKamer(naar, bron);
    } catch (err) {
      bezig = false;
      kamer.classList.remove('hud-weg');
      sluier.getAnimations().forEach((a) => a.cancel());
      sluier.style.opacity = 0;
      if (getekend !== kamerNaam) maakKamer(gewensteIndeling());
    }
  }
  async function wisselKamer(naar, bron) {
    if (naar === kamerNaam) { centreer(); return; }
    if (!kamerOpen(naar)) {
      schud(bron);
      Geluid.pak();
      if (window.Tril) Tril.fout();
      toonWenk('Knap eerst de voorkamer op');
      return;
    }
    verbergLabel();
    verbergWenk();
    const omhoog = naar === 'zolder';
    if (rustig()) { zetKamerNaam(naar); maakKamer(gewensteIndeling()); return; }
    bezig = true;
    kamerSvg.getAnimations().forEach((a) => a.cancel());
    kamer.classList.add('hud-weg');
    kamerSvg.classList.add('zoomt');
    const deur = omhoog ? kamerSvg.querySelector('.naar-kamer[data-kamer="zolder"]') : null;
    const dr = deur && deur.getBoundingClientRect();
    const h = toneel.clientHeight;
    const doel = dr && dr.width > 0 ? zoomWaarden(deur, 3.2, false) : `translate(0px, ${(omhoog ? 0.25 : -0.25) * h}px) scale(1.12)`;
    kamerSvg.animate([{ transform: 'translate(0px, 0px) scale(1)' }, { transform: doel }], { duration: 750, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' });
    sluier.style.background = '#1E130A';
    const s1 = sluier.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 750, easing: 'ease-in', fill: 'forwards' });
    for (let i = 0; i < 5; i++) setTimeout(() => { if (Geluid.stap) Geluid.stap(); }, 120 + i * 190);
    await s1.finished.catch(() => {});
    zetKamerNaam(naar);
    maakKamer(gewensteIndeling());
    kamer.classList.add('hud-weg');
    kamerSvg.classList.add('zoomt');
    const b = kamerSvg.animate([
      { transform: `translate(0px, ${(omhoog ? 0.16 : -0.16) * h}px) scale(1.1)` },
      { transform: 'translate(0px, 0px) scale(1)' }
    ], { duration: 950, easing: 'cubic-bezier(.2,.7,.2,1)' });
    sluier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
    await b.finished.catch(() => {});
    kamerSvg.classList.remove('zoomt');
    kamer.classList.remove('hud-weg');
    bezig = false;
    if (hint) hint.classList.remove('weg');
    if (omhoog) {
      kamerSvg.querySelectorAll('.speelbaar').forEach((s) => { s.classList.remove('wenk'); void s.getBoundingClientRect(); s.classList.add('wenk'); });
    }
  }

  function terugUit(spel) {
    bouw();
    if (gevel.hidden === false) return;
    let k = window.Duiten ? Duiten.kamerVanSpel(spel) : 'voorkamer';
    if (!kamerOpen(k)) k = 'voorkamer';
    if (k !== kamerNaam) zetKamerNaam(k);
    if (kamer.hidden) { zetBinnen(true); toonKamer(); }
    pasMaatAan();
    const v = kamerSvg.querySelector(`[data-spel="${spel}"]`);
    kamerSvg.getAnimations().forEach((a) => a.cancel());
    sluier.getAnimations().forEach((a) => a.cancel());
    kamer.classList.remove('hud-weg');
    werkHudBij();
    if (!v || rustig()) { kamerSvg.classList.remove('zoomt'); sluier.style.opacity = 0; return; }
    centreerOp(v);
    const van = zoomWaarden(v);
    kamerSvg.classList.add('zoomt');
    const anim = kamerSvg.animate([{ transform: van }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: 850, easing: 'cubic-bezier(.3,0,.25,1)' });
    sluier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = () => kamerSvg.classList.remove('zoomt');
    if (klusknop && klusknop.classList.contains('kan')) {
      setTimeout(() => vonkenOp(klusknop.getBoundingClientRect(), 8), 900);
    }
  }

  function centreer() {
    if (!kamerScroll) return;
    const over = kamerScroll.scrollWidth - kamerScroll.clientWidth;
    kamerScroll.scrollLeft = over > 0 ? over / 2 : 0;
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
    document.body.classList.remove('op-straat');
    pasMaatAan();
    centreer();
  }

  function toonGevel() {
    kamer.hidden = true;
    gevel.hidden = false;
    document.body.classList.add('op-straat');
    gevelSvg.getAnimations().forEach((a) => a.cancel());
    const blad = gevelSvg.querySelector('#deur-blad');
    blad.getAnimations().forEach((a) => a.cancel());
    werkGevelBij();
  }

  function binnengaan(naar) {
    if (bezig) return;
    naar = naar === 'zolder' && kamerOpen('zolder') ? 'zolder' : 'voorkamer';
    zetBinnen(true);
    if (window.Duiten && !Duiten.veld('bezocht', false)) Duiten.zetVeld('bezocht', true);
    if (naar !== kamerNaam) zetKamerNaam(naar);
    if (getekend !== kamerNaam) maakKamer(gewensteIndeling());
    if (rustig()) { toonKamer(); return; }
    bezig = true;
    verbergLabel();
    const deurKlik = gevelSvg.querySelector(naar === 'zolder' ? '.luik-klik' : '.deur-klik');
    if (naar === 'voorkamer') {
      const blad = gevelSvg.querySelector('#deur-blad');
      Geluid.deur();
      blad.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.12)' }], { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
    } else {
      Geluid.hout();
    }
    const t = toneel.getBoundingClientRect(), s0 = gevelSvg.getBoundingClientRect(), r = deurKlik.getBoundingClientRect();
    const cx = r.left + r.width / 2 - s0.left, cy = r.top + r.height / 2 - s0.top;
    const s = Math.min(t.height * 1.6 / r.height, 14);
    const tx = t.left + t.width / 2 - s0.left - s * cx, ty = t.top + t.height / 2 - s0.top - s * cy;
    const wachtTijd = naar === 'voorkamer' ? 500 : 150;
    setTimeout(() => {
      Geluid.woesj();
      gevelSvg.animate([{ transform: 'translate(0px,0px) scale(1)' }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], { duration: 1100, easing: 'cubic-bezier(.7,0,.35,1)', fill: 'forwards' });
      sluier.style.background = '#F7E3B5';
      sluier.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: 1100, easing: 'ease-in', fill: 'forwards' });
    }, wachtTijd);
    setTimeout(() => {
      bezig = false;
      try {
        toonKamer();
        kamerSvg.getAnimations().forEach((a) => a.cancel());
        kamerSvg.classList.add('zoomt');
        const a = kamerSvg.animate([{ transform: 'scale(1.18)', filter: 'blur(3px)' }, { transform: 'scale(1)', filter: 'blur(0px)' }], { duration: 1300, easing: 'cubic-bezier(.2,.7,.2,1)' });
        a.onfinish = () => kamerSvg.classList.remove('zoomt');
        sluier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
        if (hint) hint.classList.remove('weg');
      } catch (err) {
        gevel.hidden = true; kamer.hidden = false; sluier.style.opacity = 0;
      }
    }, wachtTijd + 1120);
  }

  function naarBuiten() {
    bouw();
    zetBinnen(false);
    verbergLabel();
    verbergWenk();
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
    terugUit,
    naarBuiten,
    gaNaarKamer(k) { bouw(); gaNaarKamer(k); },
    get kamer() { return kamerNaam; },
    werkBij() {
      if (!gebouwd) return;
      if (kamerNaam !== 'voorkamer' && !kamerOpen(kamerNaam)) { zetKamerNaam('voorkamer'); maakKamer(gewensteIndeling()); }
      pasStaatToe(kamerSvg);
      werkHudBij();
      werkGevelBij();
    }
  };
})();
