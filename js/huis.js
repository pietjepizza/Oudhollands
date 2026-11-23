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
      plaats: { bikkels: 'translate(220 -6)' },
      // de schouw onder het ganzenbord: midden, halve breedte, bovenkant kroonlijst, tegels naast elkaar
      schouw: { X: -4, hb: 150, top: 136, kolommen: 8, diep: 50, maat: 1 }
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
        plank: plaats([1196, 588], [658, 1010], 1.0),
        kolf: plaats([1290, 775], [764, 1180], 1.05),
        tafel: plaats([60, 945], [-30, 1300], 0.75),
        bikkels: plaats([918, 880], [470, 1250], 0.85),
        kat: plaats([1390, 925], [720, 1265], 0.8),
        koek: plaats([1290, -10], [610, -10], 0.85),
        schoen: plaats([1006.7, 789.5], [578, 1192], 0.85)
      },
      schouw: { X: -14, hb: 92, top: 300, kolommen: 4, diep: 40, maat: 0.9 }
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

  // ---------- De schouw ----------
  // Een open haard tegen de achterwand, onder het ganzenbord: een eikenhouten kroonlijst op twee zuiltjes,
  // een schoorsteenkleed met franje, een haardsteen van rode plavuizen en een gietijzeren haardplaat.
  // In de 17e eeuw werd de haardwand over de volle breedte betegeld, met de haardplaat in het midden.
  // Vóór de klus "Tegels zetten" is de wand kaal en beroet en ligt er koude as; daarna tegels en vuur.
  function bouwSchouw(ouder, L, defs, voor, na) {
    const Q = L.P, hh = L.HH, s = L.schouw, m = s.maat;
    const W = (X, Y, Z) => Q(s.X + X, Y, Z === undefined ? ZB : Z);
    const lijn = (a, b, attrs, o) => el('line', Object.assign({ x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1) }, attrs), o);
    const hb = s.hb, top = s.top, kw = Math.round(hb * 0.12), binnen = hb - kw;
    const ts = (2 * binnen) / s.kolommen, rijen = Math.floor((hh - top) / ts);
    const lijst = 24 * m, kleed = 20 * m, sh = 5, zv = ZB - s.diep, kb = hb + 12 * m, Zf = ZB - s.diep * 0.65, Zk = ZB - 8;
    verloop(defs, 'h-roet', 'radialGradient', { cx: '50%', cy: '92%', r: '80%' }, [[0, '#120B06', 0.92], [0.5, '#2A1C12', 0.55], [1, '#2A1C12', 0]]);
    verloop(defs, 'h-haardgloed', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFB45A', 0.62], [0.55, '#FF8A2E', 0.22], [1, '#FF8A2E', 0]]);
    verloop(defs, 'h-haardvlam', 'linearGradient', { x1: 0, y1: 1, x2: 0, y2: 0 }, [[0, '#FFF3B0'], [0.35, '#FFC444'], [0.75, '#FF7A22', 0.9], [1, '#D8401C', 0.15]]);
    verloop(defs, 'h-zuil', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#2E1D10'], [0.35, '#7A5534'], [0.6, '#5A3B22'], [1, '#24170C']]);
    verloop(defs, 'h-kroonlijst', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#7E5A38'], [0.5, '#5A3B22'], [1, '#3A2514']]);
    verloop(defs, 'h-schoorsteenkleed', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#46663F'], [1, '#22361F']]);
    const g = el('g', { class: 'schouw', 'data-doel': 'plint', 'pointer-events': 'none' }, ouder);

    // de haardwand: kaal en beroet, met hier en daar de baksteen; of betegeld
    const wandVak = [W(-binnen, top), W(binnen, top), W(binnen, hh), W(-binnen, hh)];
    const kaal = voor('plint', g);
    veelhoek(wandVak, { fill: '#BBAA8C' }, kaal);
    [[-0.78, 0.5, 3], [0.42, 0.3, 2], [0.55, 0.72, 3], [-0.4, 0.8, 2]].forEach(([fx, fy, n]) => {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < 2; j++) {
          const [x, y] = W(binnen * fx + j * ts * 0.5 + (i % 2) * ts * 0.25, top + (hh - top) * fy + i * ts * 0.18);
          el('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (ts * 0.46).toFixed(1), height: (ts * 0.16).toFixed(1), fill: '#8A4B33', stroke: '#6E3A26', 'stroke-width': 0.6 }, kaal);
        }
      }
    });
    veelhoek(wandVak, { fill: 'url(#h-roet)' }, kaal);
    const tegels = na('plint', g, { 'data-vonk': 'plint' });
    const motieven = ['ill-gans', 'ill-tol', 'ill-hoepel', 'ill-knikkers', 'ill-kolf', 'ill-uil', 'ill-koek', 'ill-kaarten', 'ill-sjoelbak', 'ill-molen', 'ill-dammen'];
    veelhoek(wandVak, { fill: '#E9E3D3' }, tegels);
    for (let r = 0; r < rijen; r++) {
      for (let c = 0; c < s.kolommen; c++) {
        const [x, y] = W(-binnen + c * ts, hh - (r + 1) * ts);
        el('rect', { x: x.toFixed(1), y: y.toFixed(1), width: ts.toFixed(1), height: ts.toFixed(1), fill: '#F4F1E8', stroke: '#B7B09E', 'stroke-width': 1 }, tegels);
        el('use', { href: '#hoeken', x: x.toFixed(1), y: y.toFixed(1), width: ts.toFixed(1), height: ts.toFixed(1), style: 'color:' + BLAUW, opacity: 0.85 }, tegels);
        el('use', { href: '#' + motieven[(r * 3 + c * 7) % motieven.length], x: (x + ts * 0.2).toFixed(1), y: (y + ts * 0.17).toFixed(1), width: (ts * 0.6).toFixed(1), height: (ts * 0.6).toFixed(1), style: 'color:' + BLAUW, stroke: BLAUW, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, tegels);
      }
    }

    // de haardplaat van gietijzer, met een scheepje in reliëf
    const pb = ts * 1.05, phh = ts * 2.35, boog = pb * 0.55;
    const [ax, ay] = W(-pb, hh), [bx] = W(pb, hh), [, ty] = W(0, hh - phh), mx = (ax + bx) / 2;
    el('path', { d: `M${ax.toFixed(1)} ${ay.toFixed(1)} L${ax.toFixed(1)} ${(ty + boog).toFixed(1)} Q${ax.toFixed(1)} ${ty.toFixed(1)} ${mx.toFixed(1)} ${ty.toFixed(1)} Q${bx.toFixed(1)} ${ty.toFixed(1)} ${bx.toFixed(1)} ${(ty + boog).toFixed(1)} L${bx.toFixed(1)} ${ay.toFixed(1)} Z`, fill: '#2B2521', stroke: '#141110', 'stroke-width': 1.2 }, g);
    const ins = 4 * m;
    el('path', { d: `M${(ax + ins).toFixed(1)} ${ay.toFixed(1)} L${(ax + ins).toFixed(1)} ${(ty + boog + ins * 0.4).toFixed(1)} Q${(ax + ins).toFixed(1)} ${(ty + ins).toFixed(1)} ${mx.toFixed(1)} ${(ty + ins).toFixed(1)} Q${(bx - ins).toFixed(1)} ${(ty + ins).toFixed(1)} ${(bx - ins).toFixed(1)} ${(ty + boog + ins * 0.4).toFixed(1)} L${(bx - ins).toFixed(1)} ${ay.toFixed(1)}`, fill: 'none', stroke: 'rgba(255,236,210,.13)', 'stroke-width': 1.4 }, g);
    const schip = el('g', { transform: `translate(${mx.toFixed(1)} ${(ty + phh * 0.4).toFixed(1)}) scale(${(pb / 40).toFixed(3)})`, fill: '#3E3631', stroke: 'rgba(255,236,210,.18)', 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M-26 8 Q0 18 26 8 L22 16 Q0 22 -22 16 Z' }, schip);
    el('path', { d: 'M-12 8 V-22 M2 8 V-28 M15 8 V-18', fill: 'none' }, schip);
    el('path', { d: 'M-12 -19 Q-3 -12 -12 -4 Z M2 -25 Q12 -16 2 -6 Z M15 -15 Q21 -10 15 -4 Z' }, schip);
    el('path', { d: 'M-30 25 q 6 -4 12 0 t 12 0 t 12 0 t 12 0 t 12 0', fill: 'none' }, schip);

    // de haardsteen van rode plavuizen
    const sb = hb + 10 * m;
    veelhoek([W(-sb, hh - sh, ZB), W(sb, hh - sh, ZB), W(sb, hh - sh, zv), W(-sb, hh - sh, zv)], { fill: '#8E4A33' }, g);
    for (let i = 1; i < 7; i++) {
      const X = -sb + 2 * sb * i / 7;
      lijn(W(X, hh - sh, ZB), W(X, hh - sh, zv), { stroke: 'rgba(40,14,6,.45)', 'stroke-width': 1 }, g);
    }
    lijn(W(-sb, hh - sh, (ZB + zv) / 2), W(sb, hh - sh, (ZB + zv) / 2), { stroke: 'rgba(40,14,6,.45)', 'stroke-width': 1 }, g);
    veelhoek([W(-sb, hh - sh, zv), W(sb, hh - sh, zv), W(sb, hh, zv), W(-sb, hh, zv)], { fill: '#5C2C1C' }, g);
    lijn(W(-sb, hh - sh, zv), W(sb, hh - sh, zv), { stroke: 'rgba(255,210,170,.28)', 'stroke-width': 1 }, g);

    // koude as, of een knapperend vuur
    const voet = W(0, hh - sh, ZB - s.diep * 0.4);
    const blok = (o, x1, y1, x2, y2, dik, kleur) => {
      el('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), stroke: kleur, 'stroke-width': dik.toFixed(1), 'stroke-linecap': 'round' }, o);
      el('line', { x1: x1.toFixed(1), y1: (y1 - dik * 0.22).toFixed(1), x2: x2.toFixed(1), y2: (y2 - dik * 0.22).toFixed(1), stroke: 'rgba(255,220,170,.18)', 'stroke-width': (dik * 0.25).toFixed(1), 'stroke-linecap': 'round' }, o);
    };
    const as = voor('plint', g);
    el('ellipse', { cx: voet[0].toFixed(1), cy: (voet[1] - 2).toFixed(1), rx: (ts * 1.05).toFixed(1), ry: (ts * 0.2).toFixed(1), fill: '#8F8A82' }, as);
    el('ellipse', { cx: (voet[0] - ts * 0.3).toFixed(1), cy: (voet[1] - 4).toFixed(1), rx: (ts * 0.45).toFixed(1), ry: (ts * 0.12).toFixed(1), fill: '#6F6A63' }, as);
    blok(as, voet[0] - ts * 0.7, voet[1] - ts * 0.18, voet[0] + ts * 0.55, voet[1] - ts * 0.26, ts * 0.22, '#2A1E16');
    const vuur = na('plint', g);
    el('ellipse', { cx: voet[0].toFixed(1), cy: W(0, hh - ts * 0.9)[1].toFixed(1), rx: (binnen * 0.95).toFixed(1), ry: (ts * 1.7).toFixed(1), fill: 'url(#h-haardgloed)', class: 'haardgloed' }, vuur);
    el('ellipse', { cx: voet[0].toFixed(1), cy: (voet[1] - 3).toFixed(1), rx: (ts * 0.8).toFixed(1), ry: (ts * 0.15).toFixed(1), fill: '#FF8A2E', opacity: 0.85, class: 'gloeit' }, vuur);
    blok(vuur, voet[0] - ts * 0.78, voet[1] - ts * 0.2, voet[0] + ts * 0.62, voet[1] - ts * 0.3, ts * 0.24, '#4E3220');
    blok(vuur, voet[0] - ts * 0.55, voet[1] - ts * 0.42, voet[0] + ts * 0.8, voet[1] - ts * 0.24, ts * 0.22, '#5E3D24');
    [[-0.45, 0.95, 0.5, 'a'], [0.4, 1.05, 0.5, 'b'], [-0.04, 1.55, 0.64, 'c'], [0.18, 0.8, 0.38, 'a'], [-0.26, 0.72, 0.34, 'b']].forEach(([fx, fh, fw, k]) => {
      const x0 = voet[0] + fx * ts, y0 = voet[1] - ts * 0.3, h = ts * fh, w = ts * fw;
      el('path', { d: `M${(x0 - w / 2).toFixed(1)} ${y0.toFixed(1)} C${(x0 - w / 2).toFixed(1)} ${(y0 - h * 0.45).toFixed(1)} ${(x0 - w * 0.12).toFixed(1)} ${(y0 - h * 0.6).toFixed(1)} ${x0.toFixed(1)} ${(y0 - h).toFixed(1)} C${(x0 + w * 0.14).toFixed(1)} ${(y0 - h * 0.58).toFixed(1)} ${(x0 + w / 2).toFixed(1)} ${(y0 - h * 0.42).toFixed(1)} ${(x0 + w / 2).toFixed(1)} ${y0.toFixed(1)} Z`, fill: 'url(#h-haardvlam)', class: 'haardvlam ' + k }, vuur);
    });
    // twee vuurbokken met een koperen knop
    [-1, 1].forEach((sx) => {
      const p = W(sx * ts * 0.98, hh - sh, ZB - s.diep * 0.25), h = ts * 0.7;
      el('path', { d: `M${(p[0] - 7 * m).toFixed(1)} ${p[1].toFixed(1)} L${p[0].toFixed(1)} ${(p[1] - 7 * m).toFixed(1)} L${(p[0] + 7 * m).toFixed(1)} ${p[1].toFixed(1)} Z`, fill: '#26201C' }, g);
      el('rect', { x: (p[0] - 2.2 * m).toFixed(1), y: (p[1] - h).toFixed(1), width: (4.4 * m).toFixed(1), height: h.toFixed(1), fill: '#26201C' }, g);
      el('circle', { cx: p[0].toFixed(1), cy: (p[1] - h - 3 * m).toFixed(1), r: (4.4 * m).toFixed(1), fill: 'url(#h-messing)' }, g);
    });
    const vg = W(0, hh, zv - 10);
    el('ellipse', { cx: vg[0].toFixed(1), cy: vg[1].toFixed(1), rx: (hb * 1.25).toFixed(1), ry: (16 * m).toFixed(1), fill: 'url(#h-haardgloed)', class: 'haardgloed', opacity: 0.8 }, vuur);

    // de zuiltjes onder de kroonlijst
    const voetH = 11 * m, kapH = 8 * m;
    [-1, 1].forEach((sx) => {
      const xl = sx < 0 ? -hb : hb - kw, xr = xl + kw;
      veelhoek([W(xl - 2, hh - sh - voetH, Zk), W(xr + 2, hh - sh - voetH, Zk), W(xr + 2, hh - sh, Zk), W(xl - 2, hh - sh, Zk)], { fill: '#3A2514' }, g);
      veelhoek([W(xl + 1, top + lijst + kleed + kapH, Zk), W(xr - 1, top + lijst + kleed + kapH, Zk), W(xr - 1, hh - sh - voetH, Zk), W(xl + 1, hh - sh - voetH, Zk)], { fill: 'url(#h-zuil)' }, g);
      [0.35, 0.65].forEach((f) => lijn(W(xl + kw * f, top + lijst + kleed + kapH + 4, Zk), W(xl + kw * f, hh - sh - voetH - 4, Zk), { stroke: 'rgba(0,0,0,.28)', 'stroke-width': 1 }, g));
      veelhoek([W(xl - 3, top + lijst + kleed, Zk), W(xr + 3, top + lijst + kleed, Zk), W(xr + 3, top + lijst + kleed + kapH, Zk), W(xl - 3, top + lijst + kleed + kapH, Zk)], { fill: '#4A3020' }, g);
    });

    // de kroonlijst: bovenkant en voorkant met profiellijsten
    veelhoek([W(-kb, top, Zf), W(kb, top, Zf), W(kb, top, ZB), W(-kb, top, ZB)], { fill: '#8A6542' }, g);
    veelhoek([W(-kb, top, Zf), W(kb, top, Zf), W(kb, top + lijst, Zf), W(-kb, top + lijst, Zf)], { fill: 'url(#h-kroonlijst)' }, g);
    [[0.2, 'rgba(255,225,180,.32)'], [0.56, 'rgba(0,0,0,.35)'], [0.62, 'rgba(255,225,180,.18)']].forEach(([f, kleur]) => lijn(W(-kb, top + lijst * f, Zf), W(kb, top + lijst * f, Zf), { stroke: kleur, 'stroke-width': 1.4 }, g));

    // het schoorsteenkleed: groen, geplooid, met een gouden franje
    const Zv = Zf - 1;
    const [kx0, ky0] = W(-kb + 2, top + lijst, Zv), [kx1] = W(kb - 2, top + lijst, Zv), [, ky1] = W(0, top + lijst + kleed, Zv);
    const n = Math.max(6, Math.round((kx1 - kx0) / (22 * m)));
    let rand = `M${kx1.toFixed(1)} ${ky1.toFixed(1)}`;
    for (let i = n; i > 0; i--) {
      const xa = kx0 + (kx1 - kx0) * i / n, xb = kx0 + (kx1 - kx0) * (i - 1) / n;
      rand += ` Q${((xa + xb) / 2).toFixed(1)} ${(ky1 + 9 * m).toFixed(1)} ${xb.toFixed(1)} ${ky1.toFixed(1)}`;
    }
    el('path', { d: `M${kx0.toFixed(1)} ${ky0.toFixed(1)} L${kx1.toFixed(1)} ${ky0.toFixed(1)} L` + rand.slice(1) + ' Z', fill: 'url(#h-schoorsteenkleed)' }, g);
    for (let i = 1; i < n * 2; i++) {
      const x = kx0 + (kx1 - kx0) * i / (n * 2);
      el('line', { x1: x.toFixed(1), y1: (ky0 + 1).toFixed(1), x2: x.toFixed(1), y2: (ky1 + (i % 2 ? 7 : 2) * m).toFixed(1), stroke: i % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.12)', 'stroke-width': (2.2 * m).toFixed(1) }, g);
    }
    lijn([kx0, ky0 + 3 * m], [kx1, ky0 + 3 * m], { stroke: '#C9973F', 'stroke-width': (2 * m).toFixed(1) }, g);
    el('path', { d: rand, fill: 'none', stroke: '#D9B05A', 'stroke-width': (4.5 * m).toFixed(1), 'stroke-dasharray': '1.2 2.4' }, g);
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
    verloop(defs, 'h-steenplaat', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#C9C3B6'], [1, '#9C968A']]);
    verloop(defs, 'h-licht', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0.7 }, [[0, '#FFF6DA', 0.6], [0.7, '#FFF6DA', 0.12], [1, '#FFF6DA', 0]]);
    verloop(defs, 'h-vloerglans', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#24170C', 0.4], [1, '#24170C', 0]]);
    verloop(defs, 'h-vignet', 'radialGradient', { cx: '50%', cy: '46%', r: '75%' }, [[0.55, '#000', 0], [1, '#0B0703', 0.6]]);
    verloop(defs, 'h-vlam', 'radialGradient', { cx: '50%', cy: '65%', r: '60%' }, [[0, '#FFFBE0'], [0.45, '#FFCB55'], [1, '#FF8A1E', 0]]);
    verloop(defs, 'h-gloed', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFD27A', 0.55], [1, '#FFD27A', 0]]);
    verloop(defs, 'h-gang', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#FBE6B2'], [1, '#C48F50']]);
    verloop(defs, 'h-papier', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F2E6C8'], [1, '#D9C59A']]);
    verloop(defs, 'h-bikkel', 'radialGradient', { cx: '36%', cy: '30%', r: '78%' }, [[0, '#FFF9EC'], [0.42, '#EBDCBA'], [1, '#BFA273']]);
    verloop(defs, 'h-bikkelbal', 'radialGradient', { cx: '34%', cy: '28%', r: '76%' }, [[0, '#E8BC86'], [0.45, '#B2703A'], [1, '#5A2F12']]);
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
    const lichtBeeld = (url, ouder, klasse) => el('image', { 'pointer-events': 'none', href: url, x: 0, y: 0, width: L.b, height: L.h, preserveAspectRatio: 'none', class: klasse }, ouder);
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
    // wat je buiten door het glas ziet (de sneeuw in de winter): achter het lood en de roeden
    el('g', { class: 'alleen-winter raam-buiten', 'clip-path': 'url(#h-raamclip)', 'pointer-events': 'none' }, links);
    const lood = el('g', { 'clip-path': 'url(#h-raamclip)', stroke: '#55534C', 'stroke-width': 1.3, 'stroke-opacity': 0.75 }, links);
    const zm = (r.z0 + r.z1) / 2, bereik = 2 * hh + 400;
    for (let c = -bereik; c <= bereik; c += 30) {
      [1.3, -1.3].forEach((k) => {
        const a = W(r.z0 - 120, c + (r.z0 - 120 - zm) * k), b = W(r.z1 + 120, c + (r.z1 + 120 - zm) * k);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, lood);
      });
    }
    // ijsbloemen groeien aan de binnenkant op het glas: over het lood, onder de roeden
    el('g', { class: 'alleen-winter raam-ijs', 'clip-path': 'url(#h-raamclip)', 'pointer-events': 'none' }, links);
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

    // ---------- Plint: een houten plint langs de muren (de Delftse tegels gaan in de schouw) ----------
    const plint = el('g', {}, svg);
    const ph = 26;
    veelhoek([Q(-hw, hh - ph, ZB), Q(hw, hh - ph, ZB), Q(hw, hh, ZB), Q(-hw, hh, ZB)], { fill: '#5A4330' }, plint);
    veelhoek([Q(-hw, hh - ph, ZB), Q(hw, hh - ph, ZB), Q(hw, hh - ph + 4, ZB), Q(-hw, hh - ph + 4, ZB)], { fill: '#7C6047' }, plint);
    veelhoek([Q(-hw, hh - ph, ZB), Q(-hw, hh - ph, zv), Q(-hw, hh, zv), Q(-hw, hh, ZB)], { fill: '#46331F' }, plint);
    veelhoek([Q(hw, hh - ph, ZB), Q(hw, hh - ph, dr.z1), Q(hw, hh, dr.z1), Q(hw, hh, ZB)], { fill: '#46331F' }, plint);
    const krassen = voor('plint', plint);
    for (let i = 0; i < 7; i++) {
      const x = -hw + 40 + rnd() * (2 * hw - 80), a = Q(x, hh - ph + 8 + rnd() * 10, ZB);
      el('path', { d: `M${pt(a)} l ${10 + rnd() * 30} ${rnd() * 4 - 2}`, stroke: '#2E2114', 'stroke-width': 1.4, opacity: 0.6 }, krassen);
    }
    const [px0] = Q(-hw, hh, ZB);
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
    if (marmerUrl) el('image', { 'pointer-events': 'none', href: marmerUrl, x: -200, y: vy0 - 5, width: L.b + 400, height: L.h - vy0 + 80, preserveAspectRatio: 'none', opacity: 0.8 }, vl);
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

    // ---------- De schouw met de Delftse tegels ----------
    bouwSchouw(svg, L, defs, voor, na);

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
    const lichtNa = na('ramen', svg, { 'pointer-events': 'none' });
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
    bouwBikkels(plek('bikkels', svg), L);
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
    // dezelfde ingekraste stenen plaat als in het spel
    const g = voorwerp(ouder, { spel: 'molenspel', label: 'Speel molenspel' });
    const x = 470, y = 334, b = 160, k = b / 704;
    spijker(g, 550, 292, [[480, 338], [620, 338]]);
    schaduw(g, x, y, b, b, { rx: 8 });
    el('rect', { x, y, width: b, height: b, rx: 6, fill: '#7E786C' }, g);
    el('rect', { x: x + 2.5, y: y + 2.5, width: b - 5, height: b - 5, rx: 5, fill: 'url(#h-steenplaat)' }, g);
    for (let i = 0; i < 26; i++) el('circle', { cx: x + 6 + rnd() * (b - 12), cy: y + 6 + rnd() * (b - 12), r: 0.6 + rnd() * 1.1, fill: rnd() > 0.5 ? '#6A645A' : '#E6E1D6', opacity: 0.5 }, g);
    const P = (c, r) => [x + (64 + c * 96) * k, y + (64 + r * 96) * k];
    const [a0] = P(0, 0), [a1] = P(1, 0), [a2] = P(2, 0), [a3] = P(3, 0), [a4] = P(4, 0), [a5] = P(5, 0), [a6] = P(6, 0);
    const yy = (r) => P(0, r)[1];
    const d = `M${a0} ${yy(0)} H${a6} V${yy(6)} H${a0} Z M${a1} ${yy(1)} H${a5} V${yy(5)} H${a1} Z M${a2} ${yy(2)} H${a4} V${yy(4)} H${a2} Z M${a3} ${yy(0)} V${yy(2)} M${a3} ${yy(4)} V${yy(6)} M${a0} ${yy(3)} H${a2} M${a4} ${yy(3)} H${a6}`;
    el('path', { d, fill: 'none', stroke: 'rgba(255,250,235,.55)', 'stroke-width': 1.6, transform: 'translate(.4 .5)' }, g);
    el('path', { d, fill: 'none', stroke: '#3C3833', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, g);
    [[0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]].forEach(([c, r]) => {
      const [px, py] = P(c, r);
      el('circle', { cx: px, cy: py, r: 2.2, fill: '#3C3833' }, g);
    });
    const stenen = [[0, 0, 'w'], [3, 0, 'z'], [6, 0, 'w'], [1, 3, 'z'], [3, 1, 'w'], [2, 4, 'w'], [6, 6, 'z'], [4, 3, 'z'], [5, 5, 'w'], [3, 6, 'z']];
    stenen.forEach(([c, r, kl]) => {
      const [sx, sy] = P(c, r);
      el('ellipse', { cx: sx + 1.2, cy: sy + 1.8, rx: 8, ry: 7.4, fill: '#000', opacity: 0.32 }, g);
      el('circle', { cx: sx, cy: sy, r: 7.6, fill: kl === 'w' ? '#F2EADA' : '#2C2522', stroke: kl === 'w' ? '#8D8167' : '#000', 'stroke-width': 0.8 }, g);
      el('circle', { cx: sx, cy: sy, r: 5, fill: 'none', stroke: kl === 'w' ? 'rgba(120,100,60,.35)' : 'rgba(255,255,255,.13)', 'stroke-width': 0.6 }, g);
      el('ellipse', { cx: sx - 2.4, cy: sy - 2.8, rx: 2.4, ry: 1.4, fill: '#fff', opacity: kl === 'w' ? 0.6 : 0.2, transform: `rotate(-35 ${(sx - 2.4).toFixed(1)} ${(sy - 2.8).toFixed(1)})` }, g);
    });
    naambordje(g, 550, 508, 'Molenspel');
  }

  function bouwSjoelbak(ouder) {
    // dezelfde sjoelbak als in het spel, maar lang en smal zoals een echte bak aan de muur
    const g = voorwerp(ouder, { spel: 'sjoelen', label: 'Speel sjoelen' });
    const x = 985, y = 192, b = 80, h = 410, k = b / 360;
    schaduw(g, x, y, b, h, { rx: 4 });
    if (window.Spellen && window.Spellen.sjoelen && window.Spellen.sjoelen.maakBak) {
      const bak = window.Spellen.sjoelen.maakBak(Math.round(360 * h / b));
      bak.setAttribute('class', 'sj-muur');
      bak.setAttribute('x', x); bak.setAttribute('y', y); bak.setAttribute('width', b); bak.setAttribute('height', h);
      g.appendChild(bak);
    } else {
      el('rect', { x, y, width: b, height: h, rx: 4, fill: '#5A361B' }, g);
    }
    // een paar schijven in de vakken en op de bak
    [[65, 58], [143, 104], [221, 70], [299, 120], [196, 940], [118, 1480]].forEach(([bx, by]) => {
      const cx = x + bx * k, cy = y + by * k;
      el('circle', { cx: cx + 0.6, cy: cy + 0.8, r: 3, fill: '#000', opacity: 0.3 }, g);
      el('circle', { cx, cy, r: 2.9, fill: '#E2B477', stroke: '#7A4B22', 'stroke-width': 0.5 }, g);
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
    el('circle', { cx: 1190, cy: 450, r: 66, fill: 'transparent' }, h);
    el('circle', { cx: 1198, cy: 460, r: 62, fill: 'none', stroke: '#2A1A0C', 'stroke-opacity': 0.35, 'stroke-width': 8, filter: 'url(#h-schaduw)' }, h);
    el('line', { x1: 1204, y1: 392, x2: 1246, y2: 548, stroke: '#5E3B1E', 'stroke-width': 5, 'stroke-linecap': 'round' }, h);
    el('circle', { cx: 1190, cy: 450, r: 62, fill: 'none', stroke: '#8A5A2E', 'stroke-width': 8 }, h);
    el('circle', { cx: 1190, cy: 450, r: 62, fill: 'none', stroke: '#D29E62', 'stroke-width': 2, 'stroke-dasharray': '30 14', opacity: 0.8 }, h);
    spijker(g, 1190, 386);
  }

  function bouwPlank(ouder) {
    // plank met een triktrakbord, een Delfts bord en een stapeltje sjoelschijven
    el('rect', { x: 1104, y: 598, width: 194, height: 10, fill: '#2A1A0C', opacity: 0.3, filter: 'url(#h-zacht)' }, ouder);
    el('rect', { x: 1098, y: 588, width: 196, height: 12, fill: 'url(#h-eik)' }, ouder);
    el('path', { d: 'M1116 600 l0 18 l14 -18 Z M1276 600 l0 18 l-14 -18 Z', fill: '#6B4726' }, ouder);
    const servies = el('g', { 'data-na': 'servies', 'data-vonk': 'servies' }, ouder);
    bord(servies, 1236, 564, 23, 'ill-gans');
    for (let i = 0; i < 6; i++) {
      el('ellipse', { cx: 1276, cy: 584 - i * 4.5, rx: 11, ry: 3.6, fill: i % 2 ? '#E0B77D' : '#D4A86C', stroke: '#8A5B2A', 'stroke-width': 0.7 }, ouder);
    }
    // Triktrak (verkeren): in de 17e eeuw een geliefd spel met twee dobbelstenen, vaak geschilderd,
    // o.a. door Duyster en Jan Steen. Het bord staat open tegen de muur, met de beker en de stenen ervoor;
    // tik erop om te spelen.
    const g = voorwerp(ouder, { spel: 'triktrak', label: 'Speel triktrak' });
    el('rect', { x: 1110, y: 538, width: 100, height: 56, fill: 'transparent' }, g);
    // het naambordje hangt onder de plank, tussen de steunen
    naambordje(g, 1196, 606, 'Triktrak');
    const bx = 1116, by = 545, bb = 60, bh = 43;
    el('rect', { x: bx + 3, y: by + 3, width: bb, height: bh, rx: 2, fill: '#2A1A0C', opacity: 0.32, filter: 'url(#h-zacht)' }, g);
    el('rect', { x: bx, y: by, width: bb, height: bh, rx: 2, fill: '#4A2E16', stroke: '#26170A', 'stroke-width': 0.8 }, g);
    el('rect', { x: bx + 1, y: by + 1, width: bb - 2, height: 1.2, fill: '#7A5230', opacity: 0.8 }, g);
    // twee speelvelden van licht palmhout, met in het midden de scharnierlat
    const vx = [bx + 3, bx + bb / 2 + 1.5], vb = bb / 2 - 4.5, vy = by + 3, vh = bh - 6;
    vx.forEach((x) => el('rect', { x, y: vy, width: vb, height: vh, fill: '#EADBB8' }, g));
    el('rect', { x: bx + bb / 2 - 1.5, y: by + 2, width: 3, height: bh - 4, fill: '#3A2312' }, g);
    // de punten: zes per kant, om en om ebben en rood, boven en onder
    vx.forEach((x) => {
      for (let i = 0; i < 6; i++) {
        const l = x + i * vb / 6, r = l + vb / 6, mid = (l + r) / 2, kleur = i % 2 ? '#9A2B1F' : '#2B231D';
        el('path', { d: `M${l.toFixed(2)} ${vy} L${r.toFixed(2)} ${vy} L${mid.toFixed(2)} ${(vy + vh * 0.42).toFixed(2)} Z`, fill: kleur }, g);
        el('path', { d: `M${l.toFixed(2)} ${vy + vh} L${r.toFixed(2)} ${vy + vh} L${mid.toFixed(2)} ${(vy + vh * 0.58).toFixed(2)} Z`, fill: i % 2 ? '#2B231D' : '#9A2B1F' }, g);
      }
    });
    // een paar schijven op de punten, wit en zwart
    const schijf = (x, y, wit) => el('circle', { cx: x, cy: y, r: 1.9, fill: wit ? '#F6F0E0' : '#221C17', stroke: wit ? '#9C8F74' : '#000', 'stroke-width': 0.4 }, g);
    [[vx[0] + vb / 12, vy + 2.2, 1], [vx[0] + vb / 12, vy + 5.6, 1], [vx[0] + vb / 12 * 9, vy + vh - 2.2, 0], [vx[0] + vb / 12 * 9, vy + vh - 5.6, 0],
      [vx[1] + vb / 12 * 3, vy + 2.2, 0], [vx[1] + vb / 12 * 11, vy + vh - 2.2, 1], [vx[1] + vb / 12 * 11, vy + vh - 5.6, 1]].forEach(([x, y, w]) => schijf(x, y, !!w));
    // de leren dobbelbeker
    el('ellipse', { cx: 1191, cy: 588, rx: 10, ry: 2, fill: '#000', opacity: 0.25 }, g);
    el('path', { d: 'M1182 566 L1200 566 L1198 588 L1184 588 Z', fill: '#7A4520', stroke: '#3E200C', 'stroke-width': 0.8 }, g);
    el('path', { d: 'M1185 568 L1187 586', stroke: '#A8693A', 'stroke-width': 1.6, opacity: 0.7 }, g);
    el('path', { d: 'M1183 571 L1199 571 M1184 583 L1198 583', stroke: '#E8C994', 'stroke-width': 0.7, 'stroke-dasharray': '1.4 1.2', opacity: 0.8 }, g);
    el('ellipse', { cx: 1191, cy: 566, rx: 9, ry: 2.2, fill: '#2E170A', stroke: '#5A3216', 'stroke-width': 0.8 }, g);
    // twee dobbelstenen voor het bord
    const steen = (x, y, ogen) => {
      el('path', { d: `M${x} ${y} l3 -2.4 h7 l-3 2.4 Z`, fill: '#FFFDF6', stroke: '#8C8167', 'stroke-width': 0.5 }, g);
      el('path', { d: `M${x + 7} ${y} l3 -2.4 v7 l-3 2.4 Z`, fill: '#D9CFB8', stroke: '#8C8167', 'stroke-width': 0.5 }, g);
      el('rect', { x, y, width: 7, height: 7, fill: '#F4EEDD', stroke: '#8C8167', 'stroke-width': 0.5 }, g);
      ogen.forEach(([dx, dy]) => el('circle', { cx: x + dx, cy: y + dy, r: 0.75, fill: '#1F1A15' }, g));
      el('circle', { cx: x + 5, cy: y - 1.2, r: 0.6, fill: '#1F1A15' }, g);
    };
    steen(1166, 581, [[1.8, 1.8], [3.5, 3.5], [5.2, 5.2]]);
    steen(1201, 581, [[1.8, 1.8], [5.2, 1.8], [1.8, 5.2], [5.2, 5.2]]);
  }

  function bouwKolf(ouder) {
    // kolf en bal, tegen de achterwand in de rechterhoek, met het naambordje erboven aan de muur
    const g = voorwerp(ouder, { spel: 'kolf', label: 'Speel kolf op het ijs' });
    el('rect', { x: 1236, y: 478, width: 116, height: 312, fill: 'transparent' }, g);
    naambordje(g, 1306, 480, 'Kolf');
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

    // het dambord: speelbaar, en net als in het spel: een notenhouten lijst met een biesje,
    // velden van palmhout en notenhout, gedraaide stenen en een dam van twee stenen op elkaar
    const dam = voorwerp(g, { spel: 'dammen', label: 'Speel dammen' });
    const x0 = -346, x1 = -226, z0 = 698, z1 = 814, n = 10, lijstB = 8;
    const BV = (X, Z) => T(X, Z);
    const vlak = (xa, xb, za, zb) => [BV(xa, za), BV(xb, za), BV(xb, zb), BV(xa, zb)];
    // ruim raakvlak (het bord ligt plat en is dus maar dun)
    const rl = BV(x0 - lijstB - 10, z0 - lijstB - 4), rr = BV(x1 + lijstB + 10, z0 - lijstB - 4), rb = BV(x0, z1 + lijstB);
    el('rect', { x: rl[0], y: rb[1] - 16, width: rr[0] - rl[0], height: rl[1] - rb[1] + 26, fill: 'transparent' }, dam);
    // schaduw, dikte en lijst
    veelhoek(vlak(x0 - lijstB + 5, x1 + lijstB + 7, z0 - lijstB - 3, z1 + lijstB - 2), { fill: '#1A0F06', opacity: 0.32 }, dam);
    const v1 = BV(x0 - lijstB, z0 - lijstB), v2 = BV(x1 + lijstB, z0 - lijstB);
    veelhoek([v1, v2, [v2[0], v2[1] + 4.5], [v1[0], v1[1] + 4.5]], { fill: '#24150A' }, dam);
    veelhoek(vlak(x0 - lijstB, x1 + lijstB, z0 - lijstB, z1 + lijstB), { fill: '#4B2E16', stroke: '#2A190B', 'stroke-width': 0.6 }, dam);
    veelhoek(vlak(x0 - lijstB, x1 + lijstB, z1 + lijstB * 0.35, z1 + lijstB), { fill: '#5E3C20' }, dam);
    veelhoek(vlak(x0 - lijstB * 0.5, x1 + lijstB * 0.5, z0 - lijstB * 0.5, z1 + lijstB * 0.5), { fill: 'none', stroke: '#CBA767', 'stroke-width': 0.8 }, dam);
    // de velden: rij 0 ligt aan de overkant (zwart), rij 9 aan deze kant (wit); linksonder is donker, zoals het hoort
    const kolX = (c) => x0 + (x1 - x0) * c / n, rijZ = (r) => z1 - (z1 - z0) * r / n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const donker = (r + c) % 2 === 1;
        veelhoek(vlak(kolX(c), kolX(c + 1), rijZ(r + 1), rijZ(r)), { fill: donker ? ((r * 7 + c * 3) % 5 ? '#4E3220' : '#583822') : ((r * 5 + c) % 4 ? '#E7D1A3' : '#DEC593') }, dam);
      }
    }
    veelhoek(vlak(x0, x1, z0, z1), { fill: 'none', stroke: '#1C1009', 'stroke-width': 0.7 }, dam);
    // een partij halverwege, met een witte dam diep bij zwart
    const steen = (c, r, wit, isDam) => {
      const m = BV(kolX(c + 0.5), rijZ(r + 0.5));
      const breed = BV(kolX(c + 1), rijZ(r + 0.5))[0] - BV(kolX(c), rijZ(r + 0.5))[0];
      const rx = breed * 0.37, ry = rx * 0.42, h = rx * 0.36;
      const top = wit ? '#F6EEDC' : '#3B322C', zij = wit ? '#B9AD92' : '#0F0B09', rand = wit ? '#8D8167' : '#000';
      const laag = (dy) => {
        const y = m[1] - dy;
        el('path', { d: `M${(m[0] - rx).toFixed(2)} ${(y - h).toFixed(2)} L${(m[0] - rx).toFixed(2)} ${y.toFixed(2)} A${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(m[0] + rx).toFixed(2)} ${y.toFixed(2)} L${(m[0] + rx).toFixed(2)} ${(y - h).toFixed(2)} Z`, fill: zij, stroke: rand, 'stroke-width': 0.35 }, dam);
        el('ellipse', { cx: m[0], cy: y - h, rx, ry, fill: top, stroke: rand, 'stroke-width': 0.35 }, dam);
        el('ellipse', { cx: m[0], cy: y - h, rx: rx * 0.6, ry: ry * 0.6, fill: 'none', stroke: wit ? 'rgba(110,80,40,.45)' : 'rgba(255,240,220,.25)', 'stroke-width': 0.45 }, dam);
        el('ellipse', { cx: m[0] - rx * 0.32, cy: y - h - ry * 0.35, rx: rx * 0.3, ry: ry * 0.22, fill: '#fff', opacity: wit ? 0.6 : 0.18 }, dam);
      };
      el('ellipse', { cx: m[0] + rx * 0.2, cy: m[1] + ry * 0.35, rx: rx * 1.05, ry: ry * 0.9, fill: '#000', opacity: 0.35 }, dam);
      laag(0);
      if (isDam) {
        laag(h + 0.3);
        el('path', { d: `M${(m[0] - rx * 0.32).toFixed(2)} ${(m[1] - 2 * h - 0.3).toFixed(2)} l${(rx * 0.1).toFixed(2)} ${(-ry * 0.55).toFixed(2)} l${(rx * 0.12).toFixed(2)} ${(ry * 0.3).toFixed(2)} l${(rx * 0.1).toFixed(2)} ${(-ry * 0.45).toFixed(2)} l${(rx * 0.1).toFixed(2)} ${(ry * 0.45).toFixed(2)} l${(rx * 0.12).toFixed(2)} ${(-ry * 0.3).toFixed(2)} l${(rx * 0.1).toFixed(2)} ${(ry * 0.55).toFixed(2)} Z`, fill: '#E2B14C', stroke: '#7A5212', 'stroke-width': 0.3 }, dam);
      }
    };
    // van achter naar voor tekenen, zodat de stenen voor elkaar staan
    const stukken = [
      [3, 0, 0], [7, 0, 0], [0, 1, 0], [4, 1, 0], [8, 1, 0], [6, 1, 1, 1], [1, 2, 0], [5, 2, 0], [2, 3, 0], [6, 3, 0], [3, 4, 0],
      [4, 5, 1], [3, 6, 1], [7, 6, 1], [0, 7, 1], [4, 7, 1], [8, 7, 1], [1, 8, 1], [5, 8, 1], [9, 8, 1], [2, 9, 1], [6, 9, 1]
    ];
    stukken.sort((a, b) => a[1] - b[1]).forEach(([c, r, wit, isDam]) => steen(c, r, !!wit, !!isDam));
    // een messing naambordje aan de voorkant van de tafel, zoals bij de spellen aan de muur;
    // in het oog midden onder het bord (dat ligt verder weg, dus een tikje rechts van zijn middenlijn)
    const voor = T(-269, 640);
    naambordje(dam, voor[0], voor[1] + 7, 'Dammen');

    // de speelkaarten: speelbaar, en net als in het spel: ivoren kaarten met een rood of zwart teken,
    // en een stapeltje met de Delfts blauwe rug
    const kaarten = voorwerp(g, { spel: 'klaverjassen', label: 'Speel klaverjassen' });
    // ruim raakvlak: van achter de kaarten tot aan het naambordje, en links van het dambord
    const kLinks = T(-462, 690)[0] - 8, kBoven = T(-400, 775)[1] - 6, kOnder = T(-358, 640)[1] + 7;
    el('rect', { x: kLinks, y: kBoven, width: rl[0] - 1 - kLinks, height: kOnder - kBoven, fill: 'transparent' }, kaarten);
    const kaart = (cx, cz, hoek, rug, kleur, teken) => {
      const hb = 17, hl = 25, co = Math.cos(hoek), si = Math.sin(hoek);
      const hp = (dx, dz) => T(cx + dx * co - dz * si, cz + dx * si + dz * co);
      veelhoek([hp(-hb + 1.5, -hl + 2), hp(hb + 1.5, -hl + 2), hp(hb + 1.5, hl + 2), hp(-hb + 1.5, hl + 2)], { fill: '#000', opacity: 0.22 }, kaarten);
      veelhoek([hp(-hb, -hl), hp(hb, -hl), hp(hb, hl), hp(-hb, hl)], { fill: rug ? '#F4F1E8' : '#FBF6EA', stroke: '#8C7B5A', 'stroke-width': 0.8 }, kaarten);
      if (rug) {
        veelhoek([hp(-hb + 3.5, -hl + 3.5), hp(hb - 3.5, -hl + 3.5), hp(hb - 3.5, hl - 3.5), hp(-hb + 3.5, hl - 3.5)], { fill: '#DCE3F0', stroke: BLAUW, 'stroke-width': 1 }, kaarten);
        const m = T(cx, cz);
        el('ellipse', { cx: m[0], cy: m[1], rx: 4.2, ry: 1.9, fill: '#F4F1E8', stroke: BLAUW, 'stroke-width': 0.7 }, kaarten);
        return;
      }
      const m = T(cx, cz), h = T(cx - 11 * co + 18 * si, cz - 11 * si - 18 * co);
      if (teken === 'r') el('path', { d: `M${m[0]} ${m[1] - 2.2} l 4 2.2 l -4 2.2 l -4 -2.2 Z`, fill: kleur }, kaarten);
      else el('ellipse', { cx: m[0], cy: m[1], rx: 3.6, ry: 1.9, fill: kleur }, kaarten);
      el('rect', { x: h[0] - 1.4, y: h[1] - 0.8, width: 2.8, height: 1.6, fill: kleur, opacity: 0.85 }, kaarten);
    };
    // een stapeltje dichte kaarten, dan een waaiertje open kaarten
    [0, 1, 2, 3].forEach((i) => kaart(-450 + i * 0.4, 742 - i * 0.6, -0.12, true));
    [[-428, 702, -0.5, '#B3302A', 'h'], [-410, 692, -0.15, '#B3302A', 'r'], [-392, 698, 0.25, '#1F1B17', 'k'], [-372, 708, 0.6, '#1F1B17', 's']].forEach(([cx, cz, hoek, kleur, t]) => kaart(cx, cz, hoek, false, kleur, t));
    // en net als bij het dambord een messing naambordje aan de tafelrand, in het oog onder de kaarten;
    // zo hangt het ook op een hoge telefoon, waar de kamer aan de zijkant wordt bijgesneden, helemaal in beeld
    const kv = T(-358, 640);
    naambordje(kaarten, kv[0], kv[1] + 7, 'Klaverjassen');
  }

  // Bikkels op de vloer: vier botjes en een leren balletje, net als in het spel. Knikkeren speel je op de zolder.
  // Bikkels van schapen-, varkens- en runderbotjes zijn in Delft opgegraven uit lagen van 1600 tot 1800.
  function bouwBikkels(ouder, L) {
    const g = voorwerp(ouder, { spel: 'bikkelen', label: 'Speel bikkelen' });
    const K = (X, Z) => P(X, HH, Z);
    const verweg = K(30, 770), dichtbij = K(180, 680);
    el('rect', { x: verweg[0] - 24, y: verweg[1] - 38, width: dichtbij[0] - verweg[0] + 48, height: dichtbij[1] - verweg[1] + 56, fill: 'transparent' }, g);
    // een sprongbeentje van boven gezien, met dezelfde vormen als in het spel:
    // de brede kanten (bol en hol) met een inkeping aan één eind, de smalle (rug en S) als een staafje
    const VORM = {
      breed: 'M-1 0.02 C-1 -0.36 -0.82 -0.6 -0.5 -0.6 C-0.2 -0.6 0.1 -0.52 0.4 -0.56 C0.66 -0.6 0.94 -0.48 0.98 -0.24 C1 -0.12 0.9 -0.07 0.9 0 C0.9 0.06 1 0.12 0.98 0.24 C0.94 0.46 0.68 0.58 0.4 0.56 C0.1 0.54 -0.18 0.6 -0.5 0.6 C-0.82 0.6 -1 0.38 -1 0.02 Z',
      rug: 'M-1 0 C-1 -0.3 -0.8 -0.43 -0.5 -0.42 C-0.16 -0.41 0.18 -0.38 0.5 -0.4 C0.8 -0.41 1 -0.28 1 0 C1 0.28 0.8 0.41 0.5 0.4 C0.18 0.39 -0.16 0.43 -0.5 0.42 C-0.8 0.42 -1 0.3 -1 0 Z',
      s: 'M-1 0.04 C-1 -0.28 -0.8 -0.42 -0.52 -0.38 C-0.2 -0.34 0.1 -0.46 0.44 -0.44 C0.78 -0.42 1 -0.26 1 0.02 C1 0.3 0.8 0.42 0.5 0.38 C0.2 0.34 -0.1 0.46 -0.44 0.44 C-0.78 0.42 -1 0.32 -1 0.04 Z'
    };
    // de vier kanten van een bikkel: bol (met het katrolletje), hol (met de holte), rug (een groef) en S (een kronkel)
    const bikkel = (X, Z, hoek, maat, kant) => {
      const smal = kant === 'rug' || kant === 's';
      const d = smal ? VORM[kant] : VORM.breed;
      const m = K(X, Z), s = 15 * 1000 / Z * 0.75 * maat, dik = s * (smal ? 0.46 : 0.36);
      // eerst draaien op de vloer, dan in perspectief platdrukken
      const stand = `scale(${s.toFixed(2)} ${(s * 0.64).toFixed(2)}) rotate(${hoek})${kant === 'hol' ? ' scale(1 -1)' : ''}`;
      const op = (dy) => `translate(${m[0].toFixed(1)} ${(m[1] - dy).toFixed(1)}) ${stand}`;
      el('ellipse', { cx: m[0] + 3, cy: m[1] + 1, rx: s * 1.06, ry: s * (smal ? 0.3 : 0.4), fill: '#000', opacity: 0.3 }, g);
      // de zijkant: de onderste omtrek en een paar lagen ertussen, zodat het één stevig botje wordt
      el('path', { d, transform: op(0), fill: '#937850', stroke: '#5A452A', 'stroke-width': 0.07 }, g);
      [0.34, 0.67].forEach((f) => el('path', { d, transform: op(dik * f), fill: '#A2875B' }, g));
      const boven = el('g', { transform: op(dik) }, g);
      el('path', { d, fill: 'url(#h-bikkel)', stroke: '#6B5434', 'stroke-width': 0.05 }, boven);
      if (kant === 'hol') el('ellipse', { cx: -0.06, cy: 0.02, rx: 0.42, ry: 0.2, fill: '#A08458', opacity: 0.85, transform: 'rotate(-20)' }, boven);
      else if (kant === 'bol') {
        [-0.27, 0.27].forEach((y) => el('circle', { cx: 0.56, cy: y, r: 0.24, fill: '#FFF8E6', opacity: 0.45 }, boven));
        el('path', { d: 'M0.9 0 C0.62 -0.03 0.4 0.02 0.16 0', fill: 'none', stroke: '#A68C60', 'stroke-width': 0.09, 'stroke-linecap': 'round' }, boven);
      } else if (kant === 's') el('path', { d: 'M-0.62 0.14 C-0.26 -0.34 0.26 0.36 0.62 -0.12', fill: 'none', stroke: '#A68C60', 'stroke-width': 0.09, 'stroke-linecap': 'round' }, boven);
      else el('path', { d: 'M-0.66 0.02 Q0 -0.05 0.66 0.02', fill: 'none', stroke: '#A68C60', 'stroke-width': 0.09, 'stroke-linecap': 'round' }, boven);
      el('ellipse', { cx: -0.42, cy: -0.24, rx: 0.24, ry: 0.09, fill: '#fff', opacity: 0.6 }, boven);
    };
    const bal = (X, Z) => {
      const m = K(X, Z), r = 12 * 1000 / Z * 0.75;
      el('ellipse', { cx: m[0] + 4, cy: m[1] + 1, rx: r * 1.05, ry: r * 0.4, fill: '#000', opacity: 0.35 }, g);
      el('circle', { cx: m[0], cy: m[1] - r, r, fill: 'url(#h-bikkelbal)', stroke: '#45250E', 'stroke-width': 0.8 }, g);
      // de naden van het leer
      el('path', {
        d: `M${(m[0] - r * 0.93).toFixed(1)} ${(m[1] - r * 1.3).toFixed(1)} Q${(m[0] - r * 0.05).toFixed(1)} ${(m[1] - r * 0.72).toFixed(1)} ${(m[0] + r * 0.22).toFixed(1)} ${(m[1] - r * 1.97).toFixed(1)}` +
          ` M${(m[0] - r * 0.2).toFixed(1)} ${(m[1] - r * 0.03).toFixed(1)} Q${(m[0] + r * 0.22).toFixed(1)} ${(m[1] - r * 0.92).toFixed(1)} ${(m[0] + r * 0.96).toFixed(1)} ${(m[1] - r * 0.74).toFixed(1)}`,
        fill: 'none', stroke: '#F0DDB6', 'stroke-width': 1, 'stroke-dasharray': '1.8 1.4', opacity: 0.85
      }, g);
      el('circle', { cx: m[0] - r * 0.38, cy: m[1] - r * 1.38, r: r * 0.24, fill: '#fff', opacity: 0.5 }, g);
    };
    // van achteren naar voren
    bikkel(140, 756, -28, 1, 'bol');
    bikkel(96, 736, 18, 0.96, 'hol');
    bal(58, 726);
    bikkel(162, 712, 58, 0.94, 's');
    bikkel(118, 690, -64, 1.04, 'rug');
    // het naambordje staat achter de bikkels: vóór ze ligt op de telefoon de kaart met je klus.
    // Staand is de hele groep kleiner getekend; het bordje houdt dezelfde maat als de andere bordjes.
    const staand = L && L.naam === 'staand', bx = staand ? 992 : 958, by = 836;
    const bordje = el('g', staand ? { transform: `translate(${bx} ${by + 11.5}) scale(${(1 / 0.85).toFixed(4)}) translate(${-bx} ${-(by + 11.5)})` } : {}, g);
    naambordje(bordje, bx, by, 'Bikkelen');
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

  // koekhappen: een plak ontbijtkoek aan een touwtje uit de balk, net als in het spel (met al een hap eruit)
  function bouwKoek(ouder) {
    const g = voorwerp(ouder, { spel: 'koekhappen', label: 'Speel koekhappen' });
    el('rect', { x: 1240, y: 110, width: 100, height: 200, fill: 'transparent' }, g);
    naambordje(g, 1292, 268, 'Koekhappen');
    const t = el('g', { class: 'koek-touw' }, g);
    el('line', { x1: 1290, y1: -10, x2: 1290, y2: 200, stroke: '#E4D7BC', 'stroke-width': 1.6 }, t);
    // de plak met een hap uit de hoek (en zijn schaduw op de muur)
    const plak = 'M1271 203 Q1290 195 1309 203 L1309 236 A8.5 8.5 0 0 0 1296 250 L1274 250 Q1271 250 1271 247 Z';
    el('path', { d: plak, fill: '#1A0F06', opacity: 0.3, filter: 'url(#h-zacht)', transform: 'translate(7 8)' }, t);
    el('path', { d: plak, fill: '#93511F', stroke: '#5A2C10', 'stroke-width': 1.2 }, t);
    el('path', { d: 'M1271 203 Q1290 195 1309 203 L1309 208 Q1290 200.5 1271 208 Z', fill: '#4A220C' }, t);
    el('path', { d: 'M1275 202 Q1284 198.6 1292 199', fill: 'none', stroke: '#F2CFA0', 'stroke-width': 0.9, opacity: 0.6 }, t);
    for (let i = 0; i < 16; i++) el('circle', { cx: 1274 + rnd() * 32, cy: 211 + rnd() * 36, r: 0.6 + rnd() * 0.8, fill: rnd() < 0.6 ? '#5E2E12' : '#C38A4E', opacity: 0.8 }, t);
    el('path', { d: 'M1309 236 A8.5 8.5 0 0 0 1296 250', fill: 'none', stroke: '#D9A066', 'stroke-width': 1.4 }, t);
    el('circle', { cx: 1290, cy: 205, r: 1.8, fill: '#2A1206' }, t);
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
    // Sinterklaas: een klomp bij de haard (zet je schoen!) en een chocoladeletter op tafel
    const sint = el('g', { class: 'alleen-sinterklaas' }, svg);
    bouwTafelSint(plek('tafel', sint));
    bouwKlomp(plek('schoen', sint));
    // Winter: sneeuw buiten (achter het glas, tegen een grijze winterlucht) en ijsbloemen op het glas
    const winter = svg.querySelector('.raam-buiten'), opGlas = svg.querySelector('.raam-ijs');
    const rr = [glas[0], glas[1], glas[2], glas[3]];
    veelhoek(rr, { fill: '#97A6B5', opacity: 0.55 }, winter);
    const breedte = Math.abs(rr[1][0] - rr[0][0]) + 40, hoog = Math.max(rr[2][1], rr[3][1]) - Math.min(rr[0][1], rr[1][1]);
    const x0 = Math.min(rr[0][0], rr[1][0], rr[2][0], rr[3][0]), y0 = Math.min(rr[0][1], rr[1][1]), y1 = Math.max(rr[2][1], rr[3][1]);
    // kleine vlokken ver weg (trager, doffer), grote dichtbij
    for (let i = 0; i < 44; i++) {
      const ver = i < 18;
      el('circle', {
        cx: (x0 + rnd() * breedte).toFixed(1), cy: (y0 + rnd() * hoog * 0.8).toFixed(1), r: (ver ? 1 + rnd() * 1.1 : 1.8 + rnd() * 2.2).toFixed(1),
        fill: '#FFFFFF', opacity: (ver ? 0.7 : 0.95).toFixed(2), class: 'vlok',
        style: `animation-delay:-${(rnd() * 9).toFixed(1)}s;animation-duration:${((ver ? 8 : 5) + rnd() * 4).toFixed(1)}s`
      }, winter);
    }
    // buiten ligt de sneeuw al tegen het raam
    veelhoek([rr[3], rr[2], [rr[2][0], rr[2][1] - 18], [rr[3][0], rr[3][1] - 22]], { fill: '#FFFFFF', opacity: 0.7 }, winter);
    const ijs = el('g', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4, opacity: 0.75, 'stroke-linecap': 'round' }, opGlas);
    for (let i = 0; i < 9; i++) {
      const x = x0 + rnd() * breedte, y = y1 - rnd() * hoog * 0.25;
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let j = 0; j < 4; j++) d += ` q ${(rnd() * 16 - 8).toFixed(1)} ${(-8 - rnd() * 8).toFixed(1)} ${(rnd() * 14 - 7).toFixed(1)} ${(-14 - rnd() * 10).toFixed(1)}`;
      el('path', { d }, ijs);
      el('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)} l -10 -6 M${x.toFixed(1)} ${y.toFixed(1)} l 9 -8`, opacity: 0.8 }, ijs);
    }
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
    // naast de haard: daar komt Sinterklaas door de schoorsteen
    const b = P(198, 330, 958);
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
    if (vlekUrl) el('image', { 'pointer-events': 'none', href: vlekUrl, x: 0, y: 0, width: L.b, height: L.h, preserveAspectRatio: 'none', class: 'zonvlek' }, vlekNa);
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
    const lichtNa = na('z-luik', svg, { 'pointer-events': 'none' });
    if (bundelUrl) el('image', { 'pointer-events': 'none', href: bundelUrl, x: 0, y: 0, width: L.b, height: L.h, preserveAspectRatio: 'none', class: 'lichtbundel' }, lichtNa);
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

  // De zandbak zoals in het spel: een houten bak met hoekbeslag, geharkt zand, een streep, het potje
  // met al een paar knikkers erin, de knikkers van de buren en een knikkerzakje op de vloer.
  function bouwZandbak(ouder) {
    const g = voorwerp(ouder, { spel: 'knikkeren', label: 'Speel knikkeren' });
    const x0 = -420, x1 = -120, z0 = 780, z1 = 900, top = 304, bodem = 330, rx = 14, rz = 10;
    el('ellipse', { cx: (PZ(x0, bodem, z0)[0] + PZ(x1, bodem, z0)[0]) / 2 + 8, cy: PZ(0, bodem, z0)[1] + 4, rx: 205, ry: 16, fill: 'url(#h-schaduwvlek)' }, g);
    // zijkant en voorkant van de bak, met nerf
    veelhoek([PZ(x1, top, z0), PZ(x1, top, z1), PZ(x1, bodem, z1), PZ(x1, bodem, z0)], { fill: '#4E3018' }, g);
    veelhoek([PZ(x0, top, z0), PZ(x1, top, z0), PZ(x1, bodem, z0), PZ(x0, bodem, z0)], { fill: '#6B4423' }, g);
    [310, 316, 322].forEach((y, i) => {
      const a1 = PZ(x0 + 6, y, z0), b1 = PZ(x1 - 6, y + (i % 2 ? 0.6 : -0.4), z0);
      el('path', { d: `M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} Q${((a1[0] + b1[0]) / 2).toFixed(1)} ${(a1[1] + 1.2).toFixed(1)} ${b1[0].toFixed(1)} ${b1[1].toFixed(1)}`, stroke: '#3A2210', 'stroke-width': 0.8, fill: 'none', opacity: 0.45 }, g);
    });
    // de bovenrand van de planken
    veelhoek([PZ(x0, top, z1), PZ(x1, top, z1), PZ(x1, top, z0), PZ(x0, top, z0)], { fill: '#9A6838' }, g);
    // het zand
    const zand = [PZ(x0 + rx, top, z1 - rz), PZ(x1 - rx, top, z1 - rz), PZ(x1 - rx, top, z0 + rz), PZ(x0 + rx, top, z0 + rz)];
    veelhoek(zand, { fill: '#DEC28C' }, g);
    veelhoek([zand[0], zand[1], PZ(x1 - rx, top, z1 - rz - 16), PZ(x0 + rx, top, z1 - rz - 16)], { fill: '#6A4A22', opacity: 0.18 }, g);
    veelhoek([zand[3], zand[0], PZ(x0 + rx + 12, top, z1 - rz), PZ(x0 + rx + 12, top, z0 + rz)], { fill: '#6A4A22', opacity: 0.12 }, g);
    // geharkte boogjes en korrels
    [826, 842, 858, 874].forEach((z) => {
      const a1 = PZ(x0 + rx + 10, top, z), m1 = PZ((x0 + x1) / 2, top, z - 9), b1 = PZ(x1 - rx - 10, top, z);
      el('path', { d: `M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} Q${m1[0].toFixed(1)} ${m1[1].toFixed(1)} ${b1[0].toFixed(1)} ${b1[1].toFixed(1)}`, stroke: '#FFF6DE', 'stroke-width': 1, fill: 'none', opacity: 0.35 }, g);
    });
    for (let i = 0; i < 40; i++) {
      const p = PZ(x0 + rx + 6 + rnd() * (x1 - x0 - 2 * rx - 12), top, z0 + rz + 4 + rnd() * (z1 - z0 - 2 * rz - 8));
      el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 0.7, fill: rnd() > 0.5 ? '#9A7440' : '#FFF4DA', opacity: 0.6 }, g);
    }
    // de streep vooraan
    const s1 = PZ(x0 + rx + 10, top, z0 + rz + 16), s2 = PZ(x1 - rx - 10, top, z0 + rz + 16);
    el('line', { x1: s1[0], y1: s1[1] + 0.8, x2: s2[0], y2: s2[1] + 0.8, stroke: '#FFF4D6', 'stroke-width': 1, opacity: 0.6 }, g);
    el('line', { x1: s1[0], y1: s1[1], x2: s2[0], y2: s2[1], stroke: '#5C3E1A', 'stroke-width': 1.6, opacity: 0.7 }, g);
    // het potje, met een lichte rand linksboven en al twee knikkers erin
    const pot = PZ(-270, top, 868);
    el('ellipse', { cx: pot[0], cy: pot[1], rx: 24, ry: 8, fill: '#B08A52', opacity: 0.5 }, g);
    el('ellipse', { cx: pot[0], cy: pot[1], rx: 16, ry: 5.4, fill: '#2E1E0E' }, g);
    el('path', { d: `M${pot[0] - 16} ${pot[1]} A16 5.4 0 0 1 ${pot[0] + 16} ${pot[1]}`, fill: 'none', stroke: '#FFF0CC', 'stroke-width': 1.4, opacity: 0.7 }, g);
    el('path', { d: `M${pot[0] - 13} ${pot[1] + 1} A13 3.6 0 0 0 ${pot[0] + 13} ${pot[1] + 1}`, fill: 'none', stroke: '#8A6436', 'stroke-width': 1.4, opacity: 0.8 }, g);
    [[-5, 0.8, '#7A3A26'], [4, 1.2, '#3E5A34']].forEach(([dx, dy, k]) => el('circle', { cx: pot[0] + dx, cy: pot[1] + dy, r: 3.4, fill: k }, g));
    // knikkers in het zand: van jou (klei) en van de buren
    const knikker = (X, Z, a, b, c) => {
      const p = PZ(X, top, Z);
      el('ellipse', { cx: p[0] + 2.4, cy: p[1] + 1.4, rx: 6.4, ry: 3, fill: '#4A3218', opacity: 0.35 }, g);
      el('circle', { cx: p[0], cy: p[1] - 3, r: 5.8, fill: b }, g);
      el('path', { d: `M${(p[0] - 5.8).toFixed(1)} ${(p[1] - 3).toFixed(1)} A5.8 5.8 0 0 0 ${(p[0] + 5.8).toFixed(1)} ${(p[1] - 3).toFixed(1)}`, fill: c, opacity: 0.55 }, g);
      el('circle', { cx: p[0] - 1.9, cy: p[1] - 5, r: 1.9, fill: a, opacity: 0.9 }, g);
    };
    knikker(-330, 846, '#FFF0D8', '#C9A06A', '#7A5432');
    knikker(-226, 858, '#FFE4D8', '#C2533A', '#6A2214');
    knikker(-298, 822, '#EEFBE4', '#5E9A4E', '#21441C');
    knikker(-190, 834, '#FFFFFF', '#E2DED4', '#9C9484');
    knikker(-262, 806, '#FFF8D8', '#E2B44B', '#86560F');
    knikker(-366, 812, '#FFF0D8', '#C9A06A', '#7A5432');
    // het stokje waarmee de streep is getrokken
    const t1 = PZ(-180, top, 798), t2 = PZ(-140, top, 812);
    el('line', { x1: t1[0], y1: t1[1], x2: t2[0], y2: t2[1], stroke: '#6A4626', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    // ijzeren hoekbeslag op de voorste hoeken
    [[x0, 1], [x1, -1]].forEach(([X, r]) => {
      const a1 = PZ(X, top, z0), b1 = PZ(X + r * 26, top, z0), c1 = PZ(X, top, z0 + 18), d1 = PZ(X, top + 12, z0);
      el('path', { d: `M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} L${b1[0].toFixed(1)} ${b1[1].toFixed(1)} M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} L${c1[0].toFixed(1)} ${c1[1].toFixed(1)} M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} L${d1[0].toFixed(1)} ${d1[1].toFixed(1)}`, stroke: '#2E2A26', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: (a1[0] + r * 6).toFixed(1), cy: (a1[1] + 5).toFixed(1), r: 1.3, fill: '#8A8076' }, g);
    });
    // een knikkerzakje op de vloer, met twee knikkers ernaast
    const zk = PZ(-96, bodem, 768);
    const zak = el('g', { transform: `translate(${zk[0].toFixed(1)} ${zk[1].toFixed(1)})` }, g);
    el('ellipse', { cx: 4, cy: 1, rx: 22, ry: 5, fill: '#2A1A0C', opacity: 0.3 }, zak);
    el('path', { d: 'M-16 -2 C-20 -14 -12 -26 -6 -30 L6 -30 C12 -26 20 -14 16 -2 C10 3 -10 3 -16 -2 Z', fill: '#9A7A56', stroke: '#5E4428', 'stroke-width': 1 }, zak);
    el('path', { d: 'M-7 -30 Q0 -26 7 -30 L5 -35 Q0 -33 -5 -35 Z', fill: '#8A6A46', stroke: '#5E4428', 'stroke-width': 0.8 }, zak);
    el('path', { d: 'M-6 -29 Q0 -25 6 -29 M2 -28 q8 2 10 9 M-2 -28 q-6 4 -4 10', stroke: '#B6452C', 'stroke-width': 1.3, fill: 'none' }, zak);
    el('path', { d: 'M-12 -10 Q0 -6 12 -10', stroke: '#6E5232', 'stroke-width': 0.8, 'stroke-dasharray': '2 2', fill: 'none' }, zak);
    [[24, -2, '#4C79C9'], [34, 1, '#C2533A']].forEach(([x, y, k]) => {
      el('circle', { cx: x, cy: y - 3, r: 4.6, fill: k }, zak);
      el('circle', { cx: x - 1.5, cy: y - 4.6, r: 1.4, fill: '#fff', opacity: 0.75 }, zak);
    });
    const v = PZ(-270, 317, z0);
    naambordje(g, v[0], v[1] - 11, 'Knikkeren');
  }

  // De tolkist met ervoor op de vloer een krijtkring, zoals in het spel: één tol draait nog, de ander ligt
  function bouwTolkist(ouder) {
    const g = voorwerp(ouder, { spel: 'tollen', label: 'Speel tollen' });
    const x0 = 160, x1 = 380, z0 = 800, z1 = 920, top = 220, bodem = 330;
    // de krijtkring op de vloer
    const kring = [];
    for (let i = 0; i <= 48; i++) {
      const a = i / 48 * Math.PI * 2, p = PZ(265 + Math.cos(a) * 92, bodem, 738 + Math.sin(a) * 50);
      kring.push(`${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`);
    }
    el('path', { d: kring.join(' ') + ' Z', fill: 'none', stroke: '#F6F2E6', 'stroke-width': 4, opacity: 0.35 }, g);
    el('path', { d: kring.join(' ') + ' Z', fill: 'none', stroke: '#FBF8EE', 'stroke-width': 1.8, opacity: 0.8 }, g);
    const mk = PZ(265, bodem, 738);
    el('path', { d: `M${mk[0] - 6} ${mk[1]} h12 M${mk[0]} ${mk[1] - 3} v6`, stroke: '#FBF8EE', 'stroke-width': 1.4, opacity: 0.6 }, g);
    // een draaiende tol in de kring, met de krijtkringetjes op zijn kop
    const t1 = PZ(238, bodem, 730);
    const draait = el('g', { transform: `translate(${t1[0].toFixed(1)} ${t1[1].toFixed(1)})` }, g);
    el('ellipse', { cx: 6, cy: 1, rx: 13, ry: 3.4, fill: '#000', opacity: 0.3 }, draait);
    el('path', { d: 'M-12 -26 C-12 -15 -4 -6 0 0 C4 -6 12 -15 12 -26 Z', fill: '#B6452C', stroke: '#5A2215', 'stroke-width': 0.8 }, draait);
    el('path', { d: 'M-11.5 -21 H11.5 L10.6 -18 H-10.6 Z', fill: '#1C3473' }, draait);
    el('path', { d: 'M-9 -14 H9 L8 -12 H-8 Z', fill: '#E7C36A' }, draait);
    el('ellipse', { cx: 0, cy: -26, rx: 12, ry: 4.2, fill: '#D45A3C' }, draait);
    [9, 6, 3].forEach((r, i) => el('ellipse', { cx: 0, cy: -26, rx: r, ry: r * 0.35, fill: 'none', stroke: ['#E7C36A', '#FFFFFF', '#1C3473'][i], 'stroke-width': 1.2, opacity: 0.85 }, draait));
    el('path', { d: 'M-18 -18 q-4 6 0 12 M18 -18 q4 6 0 12', fill: 'none', stroke: '#F6E6C0', 'stroke-width': 1.2, opacity: 0.6 }, draait);
    // de tol van de buurjongen ligt al om
    const t2 = PZ(306, bodem, 722);
    const ligt = el('g', { transform: `translate(${t2[0].toFixed(1)} ${t2[1].toFixed(1)}) rotate(78)` }, g);
    el('path', { d: 'M-11 -24 C-11 -14 -4 -6 0 0 C4 -6 11 -14 11 -24 Z', fill: '#E8741C', stroke: '#6A3010', 'stroke-width': 0.8 }, ligt);
    el('path', { d: 'M-10.6 -19 H10.6 L9.8 -16 H-9.8 Z', fill: '#2A2420' }, ligt);
    el('ellipse', { cx: 0, cy: -24, rx: 11, ry: 4, fill: '#F09A3E' }, ligt);
    // een stukje krijt
    const kr = PZ(372, bodem, 706);
    el('rect', { x: kr[0], y: kr[1] - 3, width: 12, height: 4, rx: 1, fill: '#F6F2E6', transform: `rotate(-12 ${kr[0]} ${kr[1]})` }, g);
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
    el('rect', { x: 880, y: 250, width: 150, height: 48, fill: 'transparent' }, g);
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
  // DE STRAAT AAN DE GRACHT (viewBox 1600 x 1000; op een staand scherm een hogere uitsnede met meer gracht)
  // Overgenomen van succesvolle spellen:
  // - aan de buitenkant zie je hoe ver je binnen bent (Homescapes, Gardenscapes): schone ramen, een geverfde deur,
  //   bloembakken, een vergulde gevelsteen, een open hijsluik met lantaarn, duiven op de top en de kat op de vensterbank;
  // - dag en nacht volgen de echte klok (Animal Crossing): 's avonds gaan de lichten aan, 's nachts twinkelen de sterren;
  // - kleine bewegingen die altijd doorgaan maken er een levende wereld van: wolken, vogels, molens, rook, eendjes,
  //   een roeibootje en wuivende bomen;
  // - de bewoners doen hun eigen ding als jij niet speelt (Hay Day): Jantje hoepelt, de burgemeester wandelt,
  //   Molenaar Kees rookt een pijpje op het bankje en Grietje zwaait uit het raam van de herberg.
  // ============================================================
  const STRAAT_ONDER = 1300;
  const VORM = {
    links: 'M-40 905 V330 H20 V290 H60 V250 H100 V905 Z',
    rechts: 'M1500 905 V300 Q1560 240 1640 300 V905 Z',
    herberg: 'M100 905 V360 H196 Q214 332 232 300 V206 Q320 150 408 206 V300 Q426 332 444 360 H540 V905 Z',
    klok: 'M1060 905 V380 H1146 C1146 300 1188 250 1228 232 V204 Q1280 172 1332 204 V232 C1372 250 1414 300 1414 380 H1500 V905 Z',
    trap: 'M530 905 V400 H584 V338 H638 V276 H692 V214 H746 V152 H854 V214 H908 V276 H962 V338 H1016 V400 H1070 V905 Z'
  };
  const BOMEN = [[34, 1], [1568, -1]];
  const KRUIN = [[-10, -160, 92], [60, -128, 78], [-80, -118, 68], [20, -250, 72], [-62, -212, 60], [92, -200, 58], [112, -108, 54],
    [-112, -170, 50], [40, -58, 60], [-40, -62, 56], [132, -58, 44], [-122, -82, 44], [0, -302, 50], [72, -282, 48], [-72, -280, 44]];
  const LANTAARNS = [240, 562, 1038, 1440];

  // bakstenen met kleurverschil: een tegel van vier lagen
  function steenPatroon(defs, id, kleuren, voeg) {
    const p = el('pattern', { id, width: 144, height: 64, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 144, height: 64, fill: voeg }, p);
    for (let r = 0; r < 4; r++) {
      for (let k = -1; k < 4; k++) {
        const x = k * 36 + (r % 2 ? 18 : 0);
        el('rect', { x: x + 1, y: r * 16 + 1, width: 34, height: 14, fill: kleuren[Math.floor(rnd() * kleuren.length)] }, p);
      }
    }
    el('rect', { width: 144, height: 1.2, fill: '#fff', opacity: 0.08 }, p);
    return p;
  }

  // Een venster met kozijn, roeden, glas-in-lood boven en een vensterbank. 's Avonds komt het licht in een aparte laag.
  const VENSTERS = [];
  function venster(ouder, cx, top, b, h, o) {
    o = o || {};
    const x = cx - b / 2;
    if (o.boog) {
      const d = `M${x - 6} ${top - 2} A${b / 2 + 6} ${(b / 2 + 6) * 0.42} 0 0 1 ${x + b + 6} ${top - 2}`;
      el('path', { d, fill: 'none', stroke: '#E4D8BD', 'stroke-width': 10 }, ouder);
      el('path', { d, fill: 'none', stroke: '#A8452E', 'stroke-width': 10, 'stroke-dasharray': '8 9' }, ouder);
    }
    el('rect', { x: x + 3, y: top + 4, width: b, height: h, fill: '#1A0F08', opacity: 0.3 }, ouder);
    el('rect', { x, y: top, width: b, height: h, fill: '#EFEADF' }, ouder);
    el('rect', { x: x + 6, y: top + 6, width: b - 12, height: h - 12, fill: 'url(#g-ruit)' }, ouder);
    if (o.gloed) el('rect', { x: x + 6, y: top + 6, width: b - 12, height: (h - 12) * 0.44, fill: 'url(#g-binnen)', class: 'raam-gloed' }, ouder);
    el('rect', { x: x + 6, y: top + 6, width: b - 12, height: (h - 12) * 0.42, fill: 'url(#g-lood)' }, ouder);
    const ty = top + h * 0.44;
    if (!o.luiken) {
      const oy = ty + 3, oh = top + h - 6 - oy, gb = b - 12;
      el('path', { d: `M${x + 6 + gb / 4} ${oy} V${oy + oh} M${x + 6 + gb * 0.75} ${oy} V${oy + oh} M${x + 6} ${oy + oh / 2} H${x + b - 6}`, stroke: '#EFEADF', 'stroke-width': 2.2 }, ouder);
    }
    el('path', { d: `M${x + 10} ${top + h - 10} L${x + b * 0.55} ${top + 10} L${x + b * 0.75} ${top + 10} L${x + 22} ${top + h - 10} Z`, fill: '#fff', opacity: 0.13 }, ouder);
    el('rect', { x: cx - 3, y: top, width: 6, height: h, fill: '#EFEADF' }, ouder);
    el('rect', { x, y: ty - 3, width: b, height: 6, fill: '#EFEADF' }, ouder);
    if (o.luiken) {
      // dichte onderluiken met zandlopermotief
      const ly = ty + 3, lh = h - (h * 0.44 + 3) - 4;
      [[x + 5, b / 2 - 7], [cx + 2, b / 2 - 7]].forEach(([lx, lb]) => {
        el('rect', { x: lx, y: ly, width: lb, height: lh, fill: '#B23B27' }, ouder);
        el('path', { d: `M${lx} ${ly} L${lx + lb} ${ly} L${lx + lb / 2} ${ly + lh / 2} Z M${lx} ${ly + lh} L${lx + lb} ${ly + lh} L${lx + lb / 2} ${ly + lh / 2} Z`, fill: '#F2EADA' }, ouder);
        el('rect', { x: lx, y: ly, width: lb, height: lh, fill: 'none', stroke: '#2B3A2E', 'stroke-width': 1.6 }, ouder);
      });
    }
    el('rect', { x: x - 6, y: top + h, width: b + 12, height: 6, fill: '#D9CCAE' }, ouder);
    el('rect', { x: x - 6, y: top + h + 6, width: b + 12, height: 3, fill: '#000', opacity: 0.2 }, ouder);
    if (o.licht) VENSTERS.push({ cx, top, b, h, luiken: !!o.luiken, licht: o.licht });
  }

  // Het licht achter een venster: warm glas, de roeden als donkere lijnen en een zachte gloed op de muur
  function raamLicht(ouder, v, i) {
    const g = el('g', { class: 'licht-raam ' + v.licht }, ouder);
    const gx = v.cx - v.b / 2 + 6, gy = v.top + 6, gb = v.b - 12;
    const gh = v.luiken ? (v.h - 12) * 0.44 : v.h - 12;
    el('rect', { x: gx - gb * 0.55, y: gy - gh * 0.35, width: gb * 2.1, height: gh * 1.7, fill: 'url(#g-schijnsel)', opacity: 0.5 }, g);
    el('rect', Object.assign({ x: gx, y: gy, width: gb, height: gh, fill: 'url(#g-raamlicht)' }, i % 3 === 1 ? { class: 'flakker', style: `animation-delay:-${((i * 1.3) % 5).toFixed(1)}s` } : {}), g);
    el('rect', { x: gx, y: gy, width: gb, height: Math.min(gh, (v.h - 12) * 0.42), fill: 'url(#g-lood-donker)' }, g);
    const ty = v.top + v.h * 0.44, donker = '#3A2414';
    el('rect', { x: v.cx - 1.6, y: gy, width: 3.2, height: gh, fill: donker, opacity: 0.85 }, g);
    if (ty < gy + gh) el('rect', { x: gx, y: ty - 1.6, width: gb, height: 3.2, fill: donker, opacity: 0.85 }, g);
    if (!v.luiken) {
      const oy = ty + 3, oh = gy + gh - oy;
      el('path', { d: `M${gx + gb / 4} ${oy} V${oy + oh} M${gx + gb * 0.75} ${oy} V${oy + oh} M${gx} ${oy + oh / 2} H${gx + gb}`, stroke: donker, 'stroke-width': 1.6, opacity: 0.7 }, g);
    }
  }

  // Een klauwstuk: een stenen krul langs een trede van de trapgevel
  function klauw(ouder, x, y, spiegel) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${spiegel ? -1 : 1} 1)` }, ouder);
    el('path', { d: 'M0 0 C-14 0 -22 10 -18 22 C-15 30 -6 30 -5 23 C-4 17 -11 15 -12 20', fill: 'none', stroke: '#E4D8BD', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M0 0 C-14 0 -22 10 -18 22 C-15 30 -6 30 -5 23', fill: 'none', stroke: '#B9A988', 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g);
  }

  // Een lantaarnpaal op de kade
  function lantaarn(ouder, x, y) {
    const g = el('g', {}, ouder);
    el('ellipse', { cx: x + 4, cy: y, rx: 14, ry: 3, fill: '#000', opacity: 0.25 }, g);
    el('rect', { x: x - 9, y: y - 14, width: 18, height: 14, rx: 2, fill: '#1E1A16' }, g);
    el('rect', { x: x - 4, y: y - 152, width: 8, height: 140, fill: '#1E1A16' }, g);
    el('rect', { x: x - 3, y: y - 152, width: 2, height: 140, fill: '#fff', opacity: 0.12 }, g);
    el('rect', { x: x - 7, y: y - 158, width: 14, height: 7, rx: 2, fill: '#1E1A16' }, g);
    el('path', { d: `M${x - 10} ${y - 158} L${x + 10} ${y - 158} L${x + 15} ${y - 192} L${x - 15} ${y - 192} Z`, fill: '#F6E6B4', opacity: 0.8 }, g);
    el('path', { d: `M${x - 10} ${y - 158} L${x + 10} ${y - 158} L${x + 15} ${y - 192} L${x - 15} ${y - 192} Z M${x} ${y - 158} V${y - 192}`, fill: 'none', stroke: '#1E1A16', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g);
    el('path', { d: `M${x - 20} ${y - 192} L${x} ${y - 209} L${x + 20} ${y - 192} Z`, fill: '#1E1A16' }, g);
    el('circle', { cx: x, cy: y - 212, r: 3.2, fill: '#1E1A16' }, g);
  }

  // Een been dat vanuit de heup heen en weer zwaait
  function been(ouder, x, heup, lengte, kleur, dik, klasse) {
    const g = el('g', { class: 'been ' + klasse, style: `transform-origin:${x}px ${heup}px` }, ouder);
    el('path', { d: `M${x} ${heup} L${x} ${heup + lengte - 1}`, stroke: kleur, 'stroke-width': dik, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: x + 2.5, cy: heup + lengte - 1, rx: dik * 0.85, ry: dik * 0.45, fill: '#1E1814' }, g);
  }

  // Een bewoner als klein figuurtje; de voeten staan op (0, 0)
  function bewoner(ouder, soort) {
    const g = el('g', {}, ouder);
    const huid = '#F1C9A5';
    if (soort === 'jantje') {
      been(g, -4, -24, 24, '#3A3A48', 4.6, 'been-a');
      been(g, 4, -24, 24, '#3A3A48', 4.6, 'been-b');
      el('path', { d: 'M-7 -42 L-14 -31', stroke: '#9A3A24', 'stroke-width': 4.2, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M-9 -46 Q0 -50 9 -46 L10 -22 H-10 Z', fill: '#B6452C' }, g);
      el('path', { d: 'M-10 -26 H10', stroke: '#7A2A1A', 'stroke-width': 2 }, g);
      el('path', { d: 'M7 -42 L18 -31', stroke: '#B6452C', 'stroke-width': 4.4, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: 18.5, cy: -30.5, r: 2.6, fill: huid }, g);
      el('rect', { x: -3, y: -50, width: 6, height: 4, fill: huid }, g);
      el('circle', { cx: 0, cy: -56, r: 8, fill: huid }, g);
      el('circle', { cx: 3.6, cy: -56.5, r: 1.1, fill: '#2A1A0C' }, g);
      el('circle', { cx: 5, cy: -53, r: 1.8, fill: '#E8907A', opacity: 0.6 }, g);
      el('path', { d: 'M-9 -58 Q-8 -67 1 -67 Q9 -67 10 -59 Z', fill: '#2C4A7C' }, g);
      el('path', { d: 'M-11 -58.5 H14', stroke: '#1E3358', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: 0.5, cy: -67, r: 1.8, fill: '#B6452C' }, g);
    } else if (soort === 'burgemeester') {
      been(g, -4, -27, 27, '#1E1A16', 5, 'been-a');
      been(g, 4, -27, 27, '#1E1A16', 5, 'been-b');
      el('path', { d: 'M-12 -52 Q0 -58 12 -52 L15 -24 Q0 -20 -15 -24 Z', fill: '#1E1A16' }, g);
      el('path', { d: 'M0 -52 V-26', stroke: '#3A342C', 'stroke-width': 1 }, g);
      [-46, -40, -34].forEach((y) => el('circle', { cx: 2.5, cy: y, r: 1, fill: '#E7C36A' }, g));
      el('path', { d: 'M-10 -48 L-19 -26', stroke: '#1E1A16', 'stroke-width': 4.6, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M-19 -28 L-23 0', stroke: '#6B4423', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: -23, cy: -30, r: 2.6, fill: '#E7C36A' }, g);
      el('ellipse', { cx: 0, cy: -54, rx: 12.5, ry: 4.6, fill: '#FBF8F0', stroke: '#CFC7B4', 'stroke-width': 1 }, g);
      el('circle', { cx: 0, cy: -63, r: 7.5, fill: huid }, g);
      el('path', { d: 'M-5 -60 Q0 -53 5 -60 Q2 -58 0 -58 Q-2 -58 -5 -60 Z', fill: '#7A5A3A' }, g);
      el('circle', { cx: -3, cy: -64, r: 1, fill: '#2A1A0C' }, g);
      el('ellipse', { cx: 0, cy: -69.5, rx: 13.5, ry: 3.2, fill: '#1E1A16' }, g);
      el('path', { d: 'M-7.5 -69 Q-8 -84 0 -84 Q8 -84 7.5 -69 Z', fill: '#1E1A16' }, g);
      el('path', { d: 'M-7.6 -72.5 H7.6', stroke: '#E7C36A', 'stroke-width': 1.6 }, g);
    } else if (soort === 'kees') {
      el('path', { d: 'M-12 -18 H6', stroke: '#E3DCCB', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M5 -18 L6 0', stroke: '#E3DCCB', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, g);
      el('ellipse', { cx: 9, cy: -1, rx: 5, ry: 2.4, fill: '#1E1814' }, g);
      el('path', { d: 'M-13 -44 Q-3 -49 7 -44 L9 -16 H-15 Z', fill: '#F1ECE0', stroke: '#D8D1C0', 'stroke-width': 1 }, g);
      el('path', { d: 'M3 -40 L12 -30 L14 -42', fill: 'none', stroke: '#E3DCCB', 'stroke-width': 4.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      el('circle', { cx: -3, cy: -52, r: 7.5, fill: huid }, g);
      el('path', { d: 'M-11 -55 Q-9 -66 1 -66 Q10 -65 8 -56 Q2 -59 -11 -55 Z', fill: '#F7F4EC', stroke: '#D8D1C0', 'stroke-width': 1 }, g);
      el('path', { d: 'M-7 -48 Q-3 -45 1 -48', fill: 'none', stroke: '#BDB7AB', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: 1, cy: -53, r: 1, fill: '#2A1A0C' }, g);
      el('path', { d: 'M2 -48 L11 -46 L12.5 -50', fill: 'none', stroke: '#5A3A1E', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
      el('rect', { x: 10.5, y: -53, width: 4.4, height: 4.4, rx: 1, fill: '#5A3A1E' }, g);
    } else if (soort === 'grietje') {
      el('path', { d: 'M-13 0 Q-13 -16 0 -18 Q13 -16 13 0 Z', fill: '#2C2A3A' }, g);
      el('path', { d: 'M-8 -6 Q0 -2 8 -6', stroke: '#C23A2A', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '2 2.4' }, g);
      el('circle', { cx: 0, cy: -26, r: 8, fill: huid }, g);
      el('circle', { cx: -2.6, cy: -26.5, r: 1, fill: '#2A1A0C' }, g);
      el('circle', { cx: 2.6, cy: -26.5, r: 1, fill: '#2A1A0C' }, g);
      el('path', { d: 'M-2 -22.5 q2 1.6 4 0', stroke: '#9A3A2A', 'stroke-width': 1.2, fill: 'none' }, g);
      el('path', { d: 'M-11 -27 Q-11 -38 0 -38 Q11 -38 11 -27 L15 -31 Q16 -24 10 -22 Q9 -33 0 -33 Q-9 -33 -10 -22 Q-16 -24 -15 -31 Z', fill: '#FBF8F0', stroke: '#CFC7B4', 'stroke-width': 0.8 }, g);
      const arm = el('g', { class: 'zwaaiarm', style: 'transform-origin:9px -10px' }, g);
      el('path', { d: 'M9 -10 L17 -25', stroke: '#2C2A3A', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, arm);
      el('circle', { cx: 18, cy: -27.5, r: 3.2, fill: huid }, arm);
    }
    return g;
  }

  function bouwGevel() {
    zaad = 99;
    VENSTERS.length = 0;
    const svg = el('svg', { viewBox: '0 0 1600 1000', class: 'gevel-svg', preserveAspectRatio: 'xMidYMax slice', role: 'group', 'aria-label': 'Het Speelhuys aan de gracht' });
    const defs = el('defs', {}, svg);
    const omlaag = { x1: 0, y1: 0, x2: 0, y2: 1 };
    verloop(defs, 'g-lucht-dag', 'linearGradient', omlaag, [[0, '#5E8CC0'], [0.55, '#A6C2D8'], [1, '#EDE4CF']]);
    verloop(defs, 'g-lucht-ochtend', 'linearGradient', omlaag, [[0, '#7F92C4'], [0.5, '#E4B6AA'], [1, '#F8DFB6']]);
    verloop(defs, 'g-lucht-avond', 'linearGradient', omlaag, [[0, '#2C376A'], [0.42, '#A45A80'], [0.75, '#E88F58'], [1, '#F5C36E']]);
    verloop(defs, 'g-lucht-nacht', 'linearGradient', omlaag, [[0, '#050A1E'], [0.6, '#121D44'], [1, '#26335E']]);
    verloop(defs, 'g-zon', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFFDF0'], [0.22, '#FFF6CC'], [0.3, '#FFE9A0', 0.6], [1, '#FFD27A', 0]]);
    verloop(defs, 'g-zon-laag', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFF3D6'], [0.2, '#FFC27E'], [0.32, '#FFA060', 0.55], [1, '#FF8A50', 0]]);
    verloop(defs, 'g-maangloed', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#F4EFD8', 0.45], [1, '#F4EFD8', 0]]);
    verloop(defs, 'g-wolk', 'radialGradient', { cx: '45%', cy: '35%', r: '70%' }, [[0, '#FFFFFF'], [0.7, '#F1F0EA'], [1, '#C9CDD0']]);
    verloop(defs, 'g-ruit', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#8EA6B4'], [0.5, '#3A4A55'], [1, '#22303A']]);
    verloop(defs, 'g-water', 'linearGradient', omlaag, [[0, '#56685F'], [0.4, '#3A4A45'], [1, '#1A2522']]);
    verloop(defs, 'g-binnen', 'radialGradient', { cx: '50%', cy: '60%', r: '70%' }, [[0, '#FFE6AE'], [0.6, '#E0A55A'], [1, '#7A4A20']]);
    verloop(defs, 'g-raamlicht', 'linearGradient', omlaag, [[0, '#FFF0C2'], [0.6, '#FFD27E'], [1, '#E9963E']]);
    verloop(defs, 'g-schijnsel', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#FFD98A', 0.6], [0.5, '#FFC870', 0.22], [1, '#FFC870', 0]]);
    verloop(defs, 'g-messing', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F6DC97'], [0.5, '#C9973F'], [1, '#71501E']]);
    verloop(defs, 'g-goud', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#FFF2B8'], [0.45, '#E7C36A'], [1, '#9A6A1E']]);
    verloop(defs, 'g-pronk', 'radialGradient', { cx: '38%', cy: '32%', r: '75%' }, [[0, '#4C8466'], [0.6, '#22432F'], [1, '#12281C']]);
    verloop(defs, 'g-zonlicht', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#FFF0C8', 0.2], [0.5, '#FFF0C8', 0], [1, '#1A0F08', 0.22]]);
    verloop(defs, 'g-schaduw', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#000', 0.25], [0.08, '#000', 0], [0.92, '#000', 0], [1, '#000', 0.3]]);
    verloop(defs, 'g-nevel', 'linearGradient', omlaag, [[0, '#F4E9DA', 0.5], [1, '#F4E9DA', 0]]);
    verloop(defs, 'g-boomblad', 'radialGradient', { cx: '38%', cy: '32%', r: '72%' }, [[0, '#93BC6C'], [0.6, '#5E8C42'], [1, '#365E2A']]);
    verloop(defs, 'g-boomdonker', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#2C4A22'], [1, '#22381A']]);
    verloop(defs, 'g-boomlicht', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#D8EFA8', 0.45], [1, '#D8EFA8', 0]]);
    verloop(defs, 'g-rook', 'radialGradient', { cx: '50%', cy: '50%', r: '50%' }, [[0, '#F2EFE8', 0.9], [0.55, '#E9E6DE', 0.55], [1, '#E9E6DE', 0]]);
    verloop(defs, 'g-straal', 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0.6 }, [[0, '#FFF4D8', 0.34], [0.7, '#FFF4D8', 0.06], [1, '#FFF4D8', 0]]);
    steenPatroon(defs, 'g-steen', ['#9B4631', '#8E3E2B', '#A3503A', '#94432F', '#86392A', '#A04A34'], '#CDBDA2');
    steenPatroon(defs, 'g-steen2', ['#6E3326', '#62291F', '#764032', '#5A271D'], '#B9AA90');
    steenPatroon(defs, 'g-steen3', ['#8B5138', '#7E4630', '#956048', '#7A432E'], '#C9B89A');
    patroonUitTextuur(defs, 'g-korrel', textuur('gevelkorrel', 256, 256, korrel([50, 28, 18], 0.18)), 256, 256);
    const kp = el('pattern', { id: 'g-kei', width: 26, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 26, height: 14, fill: '#6F675E' }, kp);
    [[6, 4, '#9A9187'], [19, 4, '#8C8379'], [0, 11, '#8E857B'], [13, 11, '#A19890'], [26, 11, '#8E857B']].forEach(([cx, cy, f]) => {
      el('ellipse', { cx, cy, rx: 6, ry: 3.4, fill: f }, kp);
      el('ellipse', { cx: cx - 1.5, cy: cy - 1.2, rx: 3, ry: 1.2, fill: '#fff', opacity: 0.12 }, kp);
    });
    const lp = el('pattern', { id: 'g-lood', width: 10, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M0 7 L5 0 L10 7 L5 14 Z', fill: 'none', stroke: '#C9D2D6', 'stroke-width': 0.6, opacity: 0.6 }, lp);
    const lpd = el('pattern', { id: 'g-lood-donker', width: 10, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M0 7 L5 0 L10 7 L5 14 Z', fill: 'none', stroke: '#5A3414', 'stroke-width': 0.8, opacity: 0.55 }, lpd);
    // de avondtint valt alleen over de huizen, de straat, de gracht en de bomen; de lucht heeft eigen kleuren
    const tintClip = el('clipPath', { id: 'g-tintclip' }, defs);
    Object.values(VORM).forEach((d) => el('path', { d }, tintClip));
    el('rect', { x: -40, y: 880, width: 1680, height: STRAAT_ONDER - 880 + 10 }, tintClip);
    const waterClip = el('clipPath', { id: 'g-waterclip' }, defs);
    el('rect', { x: -40, y: 958, width: 1680, height: STRAAT_ONDER - 958 }, waterClip);
    const rimpel = el('pattern', { id: 'g-rimpel', width: 120, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
    [[0, 4, 46], [58, 4, 40], [20, 11, 52], [86, 11, 26]].forEach(([x, y, b]) => el('rect', { x, y, width: b, height: 2.4, rx: 1.2, fill: '#22302C' }, rimpel));

    // ---------- de lucht voor elke tijd van de dag ----------
    ['dag', 'ochtend', 'avond', 'nacht'].forEach((t) => el('rect', { x: -40, y: 0, width: 1680, height: 960, fill: `url(#g-lucht-${t})`, class: 'lucht lucht-' + t }, svg));
    const sterren = el('g', { class: 'sterren' }, svg);
    for (let i = 0; i < 80; i++) {
      el('circle', { cx: (rnd() * 1600).toFixed(1), cy: (rnd() * 520).toFixed(1), r: (0.7 + rnd() * 1.5).toFixed(2), fill: '#FFF8E0', class: 'ster', style: `animation-delay:-${(rnd() * 4).toFixed(1)}s;animation-duration:${(2.5 + rnd() * 3).toFixed(1)}s` }, sterren);
    }
    const maan = el('g', { class: 'maan' }, svg);
    el('circle', { cx: 1004, cy: 104, r: 92, fill: 'url(#g-maangloed)' }, maan);
    // een maansikkel: de buitenrand van de maan en de binnenrand van de schaduw
    el('path', { d: 'M1002.27 76.06 A28 28 0 1 0 1029.53 115.46 A24 24 0 0 1 1002.27 76.06 Z', fill: '#F6F0D6' }, maan);
    el('circle', { cx: 1004, cy: 108, r: 210, fill: 'url(#g-zon)', class: 'zon zon-dag' }, svg);
    el('circle', { cx: 150, cy: 236, r: 300, fill: 'url(#g-zon-laag)', class: 'zon zon-ochtend' }, svg);
    el('circle', { cx: 1470, cy: 300, r: 330, fill: 'url(#g-zon-laag)', class: 'zon zon-avond' }, svg);
    const wolken = el('g', { class: 'wolken' }, svg);
    [[120, 150, 1.3, 140], [760, 70, 1.0, 190], [1250, 190, 1.5, 160], [460, 260, 0.8, 220]].forEach(([x, y, sch, duur], i) => {
      const w = el('g', { class: 'wolk', style: `animation-duration:${duur}s;animation-delay:-${(i * 37) % duur}s` }, wolken);
      const binnen = el('g', { transform: `translate(${x} ${y}) scale(${sch})` }, w);
      el('ellipse', { cx: 70, cy: 26, rx: 110, ry: 20, fill: '#B9C0C5', opacity: 0.6, class: 'wolk-onder' }, binnen);
      [[0, 0, 60, 34], [50, -22, 60, 42], [108, -6, 58, 36], [150, 10, 48, 26], [36, 14, 90, 24]].forEach(([cx, cy, rx, ry]) => el('ellipse', { cx, cy, rx, ry, fill: 'url(#g-wolk)' }, binnen));
    });
    const vogels = el('g', { class: 'vogels overdag' }, svg);
    [[0, 0], [34, 14], [70, -6]].forEach(([dx, dy], i) => {
      const v = el('g', { transform: `translate(${dx} ${dy})` }, vogels);
      el('path', { d: 'M0 0 q 7 -7 14 0 q 7 -7 14 0', fill: 'none', stroke: '#2E3538', 'stroke-width': 2.2, 'stroke-linecap': 'round', class: 'vleugel', style: `animation-delay:-${i * 0.21}s` }, v);
    });

    // ---------- in de verte: een kerktoren en twee molens ----------
    const verte = el('g', { class: 'verte' }, svg);
    el('path', { d: 'M1024 400 V262 h6 V244 h22 v18 h6 V400 Z', fill: 'currentColor' }, verte);
    el('path', { d: 'M1029 244 L1041 196 L1053 244 Z', fill: 'currentColor' }, verte);
    el('path', { d: 'M1041 196 V172 M1036 180 h10', stroke: 'currentColor', 'stroke-width': 2 }, verte);
    el('rect', { x: 1036, y: 274, width: 10, height: 14, rx: 5, fill: '#000', opacity: 0.18 }, verte);
    el('circle', { cx: 1041, cy: 170, r: 3, fill: '#C9A24A' }, verte);
    [[522, 318, 0.62, 11], [150, 250, 0.9, 16]].forEach(([x, y, sch, duur]) => {
      const m = el('g', { transform: `translate(${x} ${y}) scale(${sch})` }, verte);
      el('path', { d: 'M-16 120 L-10 10 H10 L16 120 Z', fill: 'currentColor' }, m);
      el('path', { d: 'M-13 12 L0 -3 L13 12 Z', fill: 'currentColor' }, m);
      el('path', { d: 'M-13 12 L0 -3 L13 12 Z', fill: '#000', opacity: 0.15 }, m);
      const wiek = el('g', { class: 'wieken', style: `animation-duration:${duur}s` }, m);
      [0, 90, 180, 270].forEach((a) => {
        const w = el('g', { transform: `rotate(${a})` }, wiek);
        el('rect', { x: -3, y: -66, width: 13, height: 60, fill: 'currentColor', opacity: 0.85 }, w);
        el('path', { d: 'M3.5 -66 V-4', stroke: 'currentColor', 'stroke-width': 2.6 }, w);
      });
      el('circle', { r: 4, fill: 'currentColor' }, m);
    });

    // ---------- schoorstenen met rook, achter de gevels ----------
    [[244, 160, 22, 48], [1182, 236, 22, 34]].forEach(([x, y, b, h], i) => {
      el('rect', { x, y, width: b, height: h, fill: '#5A2A20' }, svg);
      el('rect', { x: x - 3, y: y - 5, width: b + 6, height: 7, fill: '#3E1E16' }, svg);
      const rook = el('g', { class: 'schoorsteenrook', transform: `translate(${x + b / 2} ${y - 6})` }, svg);
      [0, 1, 2, 3].forEach((k) => el('circle', { r: 11 + k * 2, fill: 'url(#g-rook)', style: `animation-delay:-${(k * 1.4 + i * 0.7).toFixed(1)}s` }, rook));
    });

    // ---------- de gevels (ook gespiegeld in het water) ----------
    const gevelGroep = el('g', { id: 'g-gevels' }, svg);
    el('path', { d: VORM.links, fill: '#5B3A2E' }, gevelGroep);
    el('path', { d: VORM.rechts, fill: '#5E4033' }, gevelGroep);
    [400, 560, 720].forEach((y, i) => venster(gevelGroep, 40, y, 40, 62, { licht: i === 1 ? 'aan' : (i === 2 ? 'vroeg' : '') }));
    [420, 580, 740].forEach((y, i) => venster(gevelGroep, 1560, y, 40, 62, { licht: i === 0 ? 'aan' : (i === 2 ? 'vroeg' : '') }));
    // linkerbuur: de herberg met een halsgevel
    el('path', { d: VORM.herberg, fill: 'url(#g-steen2)' }, gevelGroep);
    el('path', { d: VORM.herberg, fill: 'url(#g-korrel)', opacity: 0.6 }, gevelGroep);
    el('path', { d: 'M196 360 Q214 332 232 300 V206 Q320 150 408 206 V300 Q426 332 444 360', fill: 'none', stroke: '#E2D6BA', 'stroke-width': 8 }, gevelGroep);
    el('rect', { x: 96, y: 356, width: 448, height: 12, fill: '#E2D6BA' }, gevelGroep);
    el('circle', { cx: 320, cy: 166, r: 9, fill: '#E2D6BA' }, gevelGroep);
    el('path', { d: 'M232 300 Q206 300 196 322 M408 300 Q434 300 444 322', fill: 'none', stroke: '#E2D6BA', 'stroke-width': 6, 'stroke-linecap': 'round' }, gevelGroep);
    [[190, 420, 'aan'], [320, 420, ''], [450, 420, 'aan'], [190, 580, 'vroeg'], [320, 580, 'aan'], [450, 580, ''], [190, 745, 'aan'], [450, 745, 'aan']].forEach(([cx, y, l]) => venster(gevelGroep, cx, y, 70, 104, { licht: l }));
    venster(gevelGroep, 320, 222, 56, 70, { licht: 'aan' });
    bouwHerberg(gevelGroep);
    el('path', { d: VORM.herberg, fill: 'url(#g-zonlicht)', 'pointer-events': 'none' }, gevelGroep);
    // rechterbuur: een klokgevel
    el('path', { d: VORM.klok, fill: 'url(#g-steen3)' }, gevelGroep);
    el('path', { d: VORM.klok, fill: 'url(#g-korrel)', opacity: 0.6 }, gevelGroep);
    el('path', { d: 'M1146 380 C1146 300 1188 250 1228 232 V204 Q1280 172 1332 204 V232 C1372 250 1414 300 1414 380', fill: 'none', stroke: '#EDE4D0', 'stroke-width': 9 }, gevelGroep);
    el('path', { d: 'M1228 232 C1250 222 1310 222 1332 232', fill: 'none', stroke: '#EDE4D0', 'stroke-width': 5 }, gevelGroep);
    el('circle', { cx: 1280, cy: 176, r: 8, fill: '#EDE4D0' }, gevelGroep);
    el('rect', { x: 1056, y: 376, width: 448, height: 12, fill: '#EDE4D0' }, gevelGroep);
    [[1170, 430, ''], [1280, 430, 'aan'], [1390, 430, 'aan'], [1170, 590, ''], [1280, 590, 'vroeg'], [1390, 590, 'aan'], [1170, 752, 'vroeg'], [1390, 752, 'aan']].forEach(([cx, y, l]) => venster(gevelGroep, cx, y, 70, 104, { licht: l }));
    deurtje(gevelGroep, 1280, 760);
    gevelsteen(gevelGroep, 1280, 700);
    plekKlik(gevelGroep, { x: 1240, y: 696, width: 80, height: 210 }, 'kunstkamer', 'Naar de kunstkamer: lezen en kijken over de oude spellen');
    venster(gevelGroep, 1280, 262, 60, 84, {});
    el('path', { d: VORM.klok, fill: 'url(#g-zonlicht)', 'pointer-events': 'none' }, gevelGroep);

    // ---------- Het Speelhuys: de trapgevel ----------
    const huis = el('g', { class: 'speelhuys-gevel' }, gevelGroep);
    const trap = VORM.trap;
    const huisClip = el('clipPath', { id: 'g-huisclip' }, defs);
    el('path', { d: trap }, huisClip);
    el('path', { d: trap, fill: 'url(#g-steen)' }, huis);
    el('path', { d: trap, fill: 'url(#g-korrel)', opacity: 0.55 }, huis);
    // vuile plekken en groene aanslag op de gevel: weg na het witten van de muren
    const vuil = el('g', { class: 'weg-bij-muren', 'clip-path': 'url(#g-huisclip)' }, huis);
    [[586, 870, 74, 46], [1014, 850, 62, 56], [700, 520, 50, 30], [930, 646, 42, 26], [560, 420, 40, 60]].forEach(([cx, cy, rx, ry]) => el('ellipse', { cx, cy, rx, ry, fill: '#3B3122', opacity: 0.3 }, vuil));
    [[548, 880, 22, 26], [1050, 870, 20, 34]].forEach(([cx, cy, rx, ry]) => el('ellipse', { cx, cy, rx, ry, fill: '#4F6A34', opacity: 0.35 }, vuil));
    const banden = el('g', { 'clip-path': 'url(#g-huisclip)', fill: '#E4D8BD' }, huis);
    [338, 276, 214, 556, 712].forEach((y) => el('rect', { x: 520, y, width: 560, height: 9 }, banden));
    el('rect', { x: 524, y: 396, width: 552, height: 16, fill: '#E4D8BD' }, huis);
    el('rect', { x: 524, y: 410, width: 552, height: 4, fill: '#000', opacity: 0.15 }, huis);
    [[584, 400], [638, 338], [692, 276], [746, 214], [854, 214], [908, 276], [962, 338], [1016, 400]].forEach(([x, y], i) => {
      el('rect', { x: (i < 4 ? x - 58 : x - 4), y: y - 8, width: 62, height: 9, fill: '#E4D8BD' }, huis);
      el('rect', { x: (i < 4 ? x - 58 : x - 4), y: y + 1, width: 62, height: 3, fill: '#000', opacity: 0.15 }, huis);
      if (i !== 3 && i !== 4) klauw(huis, i < 4 ? x - 54 : x + 54, y + 1, i >= 4);
    });
    el('rect', { x: 740, y: 144, width: 120, height: 10, fill: '#E4D8BD' }, huis);
    el('path', { d: 'M760 144 L800 112 L840 144 Z', fill: '#E4D8BD' }, huis);
    el('circle', { cx: 800, cy: 106, r: 8, fill: '#E4D8BD' }, huis);
    el('path', { d: 'M790 136 Q800 120 810 136', fill: 'none', stroke: '#B9A988', 'stroke-width': 2 }, huis);
    // jaartal in muurankers
    tekst('16', { x: 612, y: 384, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 26, fill: '#1E1814', opacity: 0.85 }, huis);
    tekst('48', { x: 988, y: 384, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': 26, fill: '#1E1814', opacity: 0.85 }, huis);
    el('path', { d: trap, fill: 'url(#g-zonlicht)', 'pointer-events': 'none' }, huis);
    // hijsbalk met touw en haak
    el('rect', { x: 790, y: 160, width: 20, height: 16, fill: '#3A2A1C' }, huis);
    el('line', { x1: 800, y1: 176, x2: 800, y2: 204, stroke: '#4A3A28', 'stroke-width': 2 }, huis);
    el('path', { d: 'M800 204 q -6 4 0 10 q 6 2 4 -4', fill: 'none', stroke: '#2B2B2B', 'stroke-width': 2.4 }, huis);
    // het hijsluik van de zolder: dicht, of open met licht
    el('rect', { x: 772, y: 226, width: 56, height: 82, fill: '#E9E2D2' }, huis);
    const luikDicht = el('g', { class: 'luik-dicht' }, huis);
    el('rect', { x: 777, y: 231, width: 22, height: 72, fill: '#2C4A35' }, luikDicht);
    el('rect', { x: 801, y: 231, width: 22, height: 72, fill: '#2C4A35' }, luikDicht);
    el('path', { d: 'M780 242 h16 M780 292 h16 M804 242 h16 M804 292 h16', stroke: '#1E3326', 'stroke-width': 2 }, luikDicht);
    el('path', { d: 'M780 242 L796 292 M820 242 L804 292', stroke: '#1E3326', 'stroke-width': 1.6 }, luikDicht);
    const luikOpen = el('g', { class: 'luik-open' }, huis);
    el('rect', { x: 777, y: 231, width: 46, height: 72, fill: 'url(#g-binnen)' }, luikOpen);
    el('rect', { x: 748, y: 229, width: 22, height: 74, fill: '#2C4A35', stroke: '#1E3326', 'stroke-width': 1.5 }, luikOpen);
    el('rect', { x: 830, y: 229, width: 22, height: 74, fill: '#2C4A35', stroke: '#1E3326', 'stroke-width': 1.5 }, luikOpen);
    el('path', { d: 'M800 231 v 20 M793 251 h 14 l -3 14 h -8 Z', stroke: '#3A2614', 'stroke-width': 1.5, fill: '#FFE3A0' }, luikOpen);
    el('rect', { x: 769, y: 223, width: 62, height: 88, fill: 'none', stroke: '#FFD98A', 'stroke-width': 3, class: 'luik-wenk', rx: 2 }, huis);
    VENSTERS.push({ cx: 800, top: 225, b: 58, h: 84, luiken: false, licht: 'zolder' });
    // lantaarn naast het luik (na de lantaarn op de zolder)
    const zl = el('g', { class: 'toon-bij-lantaarn' }, huis);
    el('path', { d: 'M748 236 h-10 v6', fill: 'none', stroke: '#1E1814', 'stroke-width': 2 }, zl);
    el('path', { d: 'M732 242 l6 -5 l6 5 Z', fill: '#1E1814' }, zl);
    el('rect', { x: 732.5, y: 242, width: 11, height: 15, fill: '#FFE3A0' }, zl);
    el('rect', { x: 732.5, y: 242, width: 11, height: 15, fill: 'none', stroke: '#1E1814', 'stroke-width': 1.6 }, zl);
    // vensters
    venster(huis, 690, 300, 54, 70, { licht: 'zolderraam' });
    venster(huis, 910, 300, 54, 70, { licht: 'zolderraam' });
    [640, 800, 960].forEach((cx) => venster(huis, cx, 432, 86, 108, { boog: true, gloed: true, licht: 'boven' }));
    // de eerste verdieping: de pronkkamer (daar branden 's avonds de kaarsen)
    [640, 960].forEach((cx) => venster(huis, cx, 588, 86, 108, { gloed: true, licht: 'aan' }));
    [640, 960].forEach((cx) => venster(huis, cx, 742, 92, 120, { luiken: true, boog: true, gloed: true, licht: 'voorkamer' }));
    // vuile benedenramen, tot je binnen de ramen lapt
    const vuilRaam = el('g', { class: 'weg-bij-ramen' }, huis);
    [640, 960].forEach((cx) => {
      el('rect', { x: cx - 40, y: 748, width: 80, height: 48, fill: '#6F664D', opacity: 0.78 }, vuilRaam);
      el('path', { d: `M${cx - 32} 752 l 14 18 l -6 10 M${cx + 18} 756 l -8 22 M${cx - 10} 784 q 10 -6 22 2`, stroke: '#E8E2D0', 'stroke-width': 1.2, opacity: 0.6, fill: 'none' }, vuilRaam);
      el('path', { d: `M${cx - 40} 748 l 18 0 l -18 14 Z`, fill: '#E9E2D2', opacity: 0.5 }, vuilRaam);
    });
    // een scheef hangend luik tot de deur geverfd is
    const kapot = el('g', { class: 'weg-bij-deur' }, huis);
    el('rect', { x: 599, y: 798, width: 39, height: 60, fill: '#22303A' }, kapot);
    const scheef = el('g', { transform: 'rotate(16 600 800)' }, kapot);
    el('rect', { x: 600, y: 800, width: 38, height: 56, fill: '#8E5A4A' }, scheef);
    el('path', { d: 'M600 800 L638 800 L619 828 Z M600 856 L638 856 L619 828 Z', fill: '#CFC3AC' }, scheef);
    el('rect', { x: 600, y: 800, width: 38, height: 56, fill: 'none', stroke: '#3B3A2E', 'stroke-width': 1.4 }, scheef);
    // bloembakken met geraniums
    const bloemen = el('g', { class: 'toon-bij-bloemen' }, huis);
    [640, 960].forEach((cx) => {
      for (let i = 0; i < 10; i++) {
        const x = cx - 42 + i * 9.4;
        el('circle', { cx: x, cy: 700 - (i % 2) * 4, r: 6, fill: i % 2 ? '#4F7A3A' : '#3F6A30' }, bloemen);
      }
      for (let i = 0; i < 7; i++) {
        const x = cx - 36 + i * 12;
        el('circle', { cx: x, cy: 693 - (i % 3) * 3, r: 4, fill: i % 3 ? '#D23A2A' : '#E8604E' }, bloemen);
        el('circle', { cx: x - 1, cy: 692 - (i % 3) * 3, r: 1.4, fill: '#FFD0C0', opacity: 0.8 }, bloemen);
      }
      el('rect', { x: cx - 47, y: 703, width: 94, height: 15, rx: 2, fill: '#6B4423', stroke: '#3B2412', 'stroke-width': 1 }, bloemen);
      el('path', { d: `M${cx - 40} 710 h80`, stroke: '#8A5A2E', 'stroke-width': 1.2 }, bloemen);
    });
    // muurankers
    [[558, 556], [1042, 556], [558, 712], [1042, 712]].forEach(([x, y]) => {
      el('path', { d: `M${x - 9} ${y + 4} H${x + 9} M${x} ${y - 5} V${y + 13}`, stroke: '#1E1814', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, huis);
    });
    // gevelsteen met de gans; verguld als de voorkamer bijna klaar is
    el('rect', { x: 748, y: 594, width: 104, height: 92, fill: '#E4D8BD' }, huis);
    el('rect', { x: 756, y: 602, width: 88, height: 62, fill: '#2C4A7C' }, huis);
    el('use', { href: '#ill-gans', x: 768, y: 600, width: 64, height: 64, style: 'color:#E8B94E', stroke: '#E8B94E', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, huis);
    const goud = el('g', { class: 'toon-bij-steen' }, huis);
    el('rect', { x: 750, y: 596, width: 100, height: 88, fill: 'none', stroke: 'url(#g-goud)', 'stroke-width': 5 }, goud);
    el('path', { d: 'M758 606 L796 606 L758 640 Z', fill: '#fff', opacity: 0.22, class: 'glans' }, goud);
    el('rect', { x: 756, y: 666, width: 88, height: 14, fill: '#A8402E' }, huis);
    tekst("'t Speelhuys", { x: 800, y: 677, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 10.5, fill: '#F6EBD2' }, huis);
    // voordeur met bovenlicht; eerst verveloos, na het opknappen glanzend groen
    el('rect', { x: 748, y: 712, width: 104, height: 193, fill: '#E4D8BD' }, huis);
    el('path', { d: 'M758 762 A42 42 0 0 1 842 762 Z', fill: 'url(#g-ruit)' }, huis);
    for (let i = 1; i < 6; i++) {
      const a = Math.PI - (i * Math.PI) / 6;
      el('line', { x1: 800, y1: 762, x2: 800 + 42 * Math.cos(a), y2: 762 - 42 * Math.sin(a), stroke: '#E9E2D2', 'stroke-width': 2.4 }, huis);
    }
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: 'url(#g-binnen)', class: 'deur-licht' }, huis);
    const deur = el('g', { class: 'deur-blad', id: 'deur-blad' }, huis);
    const deurOud = el('g', { class: 'weg-bij-deur' }, deur);
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: '#6E826A' }, deurOud);
    [[766, 772, 30, 56], [804, 772, 30, 56], [766, 840, 30, 56], [804, 840, 30, 56]].forEach(([x, y, b, h]) => el('rect', { x, y, width: b, height: h, fill: 'none', stroke: '#56684F', 'stroke-width': 2 }, deurOud));
    [[772, 792, 9], [820, 852, 12], [792, 884, 7], [812, 786, 5]].forEach(([x, y, r]) => el('ellipse', { cx: x, cy: y, rx: r, ry: r * 0.6, fill: '#B9A68A', opacity: 0.85 }, deurOud));
    el('circle', { cx: 832, cy: 840, r: 3, fill: '#6E6A5A' }, deurOud);
    const deurNieuw = el('g', { class: 'toon-bij-deur' }, deur);
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: '#22392B' }, deurNieuw);
    [[766, 772, 30, 56], [804, 772, 30, 56], [766, 840, 30, 56], [804, 840, 30, 56]].forEach(([x, y, b, h]) => {
      el('rect', { x, y, width: b, height: h, fill: 'none', stroke: '#3D5C46', 'stroke-width': 2.2 }, deurNieuw);
      el('rect', { x: x + 2, y: y + 2, width: b - 4, height: h - 4, fill: 'none', stroke: '#14231A', 'stroke-width': 1 }, deurNieuw);
    });
    el('rect', { x: 760, y: 764, width: 6, height: 139, fill: '#fff', opacity: 0.07 }, deurNieuw);
    el('circle', { cx: 800, cy: 828, r: 7, fill: 'none', stroke: 'url(#g-messing)', 'stroke-width': 2.4 }, deurNieuw);
    el('circle', { cx: 832, cy: 840, r: 3, fill: 'url(#g-messing)' }, deurNieuw);
    el('rect', { x: 754, y: 758, width: 92, height: 151, fill: 'none', stroke: '#FFD98A', 'stroke-width': 3, class: 'deur-wenk', rx: 2 }, huis);
    el('rect', { x: 758, y: 762, width: 84, height: 143, fill: 'transparent', class: 'deur-klik plek-klik', 'data-plek': 'voorkamer', role: 'button', tabindex: 0, 'aria-label': 'Naar de voorkamer' }, huis);
    plekKlik(huis, { x: 766, y: 220, width: 68, height: 94, class: 'plek-klik luik-klik' }, 'zolder', 'Naar de zolder');
    plekKlik(huis, { x: 597, y: 588, width: 406, height: 108, class: 'plek-klik pronk-klik' }, 'pronkkamer', 'Naar de pronkkamer');
    slotje(huis, 800, 268, 'zolder');
    // muurlantaarn naast de deur, als de voorkamer klaar is
    const deurlamp = el('g', { class: 'toon-bij-klaar' }, huis);
    el('path', { d: 'M746 772 h-14 v6', fill: 'none', stroke: '#1E1814', 'stroke-width': 2.4 }, deurlamp);
    el('path', { d: 'M724 778 l8 -6 l8 6 Z', fill: '#1E1814' }, deurlamp);
    el('rect', { x: 724.5, y: 778, width: 15, height: 20, fill: '#FFE3A0' }, deurlamp);
    el('rect', { x: 724.5, y: 778, width: 15, height: 20, fill: 'none', stroke: '#1E1814', 'stroke-width': 1.8 }, deurlamp);
    el('path', { d: trap, fill: 'url(#g-schaduw)', 'pointer-events': 'none' }, huis);
    // duiven op de top (na de duiven op de zolder)
    const duiven = el('g', { class: 'toon-bij-duiven' }, huis);
    [[772, 145, 1], [830, 145, -1]].forEach(([x, y, r], i) => {
      const p = el('g', { transform: `translate(${x} ${y}) scale(${0.55 * r} 0.55)` }, duiven);
      const d = el('g', { class: 'duif', style: `animation-delay:-${i * 1.4}s` }, p);
      el('path', { d: 'M-22 -10 L-34 -4 L-22 -2 Z', fill: '#6D7682' }, d);
      el('ellipse', { cx: 0, cy: -12, rx: 20, ry: 11, fill: '#8E97A3' }, d);
      el('path', { d: 'M-14 -16 Q2 -22 12 -12 Q0 -6 -14 -8 Z', fill: '#727C88' }, d);
      el('circle', { cx: 16, cy: -22, r: 7.5, fill: '#7D8794' }, d);
      el('path', { d: 'M10 -16 Q16 -12 22 -16 L20 -10 Q15 -8 10 -10 Z', fill: '#5E8A7A', opacity: 0.8 }, d);
      el('path', { d: 'M22 -23 l6 2 l-6 1.5 Z', fill: '#E7C9A8' }, d);
      el('circle', { cx: 18, cy: -24, r: 1.6, fill: '#B6452C' }, d);
    });

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

    // ---------- de straat: keien, stoep, palen, lantaarns, een bankje en bomen ----------
    const straat = el('g', {}, svg);
    el('rect', { x: -40, y: 905, width: 1680, height: 44, fill: 'url(#g-kei)' }, straat);
    el('rect', { x: -40, y: 905, width: 1680, height: 44, fill: '#000', opacity: 0.1 }, straat);
    el('rect', { x: -40, y: 905, width: 1680, height: 6, fill: '#000', opacity: 0.2 }, straat);
    const onkruid = el('g', { class: 'weg-bij-muren' }, straat);
    [[546, 905], [1054, 905], [732, 905], [868, 905]].forEach(([x, y]) => el('path', { d: `M${x} ${y} q -4 -12 -9 -16 M${x} ${y} q 1 -14 4 -18 M${x} ${y} q 6 -10 11 -12`, fill: 'none', stroke: '#5E7A3A', 'stroke-width': 2, 'stroke-linecap': 'round' }, onkruid));
    // stoep met trapje en hekjes
    el('rect', { x: 738, y: 905, width: 124, height: 12, fill: '#CFC3A8' }, straat);
    el('rect', { x: 728, y: 917, width: 144, height: 12, fill: '#BDB196' }, straat);
    el('rect', { x: 728, y: 927, width: 144, height: 2, fill: '#000', opacity: 0.2 }, straat);
    [[720, 1], [880, -1]].forEach(([x, r]) => {
      el('path', { d: `M${x} 929 V888 M${x + r * 16} 929 V900 M${x} 896 L${x + r * 16} 902`, stroke: '#1E1814', 'stroke-width': 2.4, fill: 'none' }, straat);
      el('circle', { cx: x, cy: 886, r: 3.4, fill: 'url(#g-messing)' }, straat);
    });
    el('rect', { x: -40, y: 946, width: 1680, height: 12, fill: '#5E5A54' }, straat);
    el('rect', { x: -40, y: 946, width: 1680, height: 2, fill: '#8A857C' }, straat);
    // biertonnetjes bij de herberg
    [[150, 0], [184, 0], [167, -30]].forEach(([x, dy]) => {
      const t = el('g', { transform: `translate(${x} ${905 + dy})` }, straat);
      el('path', { d: 'M-14 0 Q-17 -15 -14 -30 H14 Q17 -15 14 0 Z', fill: '#7A4E2A', stroke: '#3B2412', 'stroke-width': 1.2 }, t);
      el('path', { d: 'M-15.5 -7 H15.5 M-15.5 -23 H15.5', stroke: '#2E2620', 'stroke-width': 2.4 }, t);
      el('path', { d: 'M-6 -29 Q-8 -15 -6 -1', stroke: '#9A6A3A', 'stroke-width': 1.4, fill: 'none', opacity: 0.6 }, t);
    });
    // stokrozen tegen de gevel (een geveltuintje, na flink wat opknapwerk)
    const tuin = el('g', { class: 'toon-bij-tuin' }, straat);
    [[540, 150, '#E07AA0'], [582, 118, '#F2B6C8'], [1018, 140, '#D9587E'], [1060, 112, '#F2B6C8']].forEach(([x, h, kleur], i) => {
      el('path', { d: `M${x} 905 Q${x + (i % 2 ? 4 : -3)} ${905 - h / 2} ${x + (i % 2 ? -2 : 2)} ${905 - h}`, stroke: '#4F7A3A', 'stroke-width': 3, fill: 'none' }, tuin);
      for (let k = 0; k < 6; k++) {
        const y = 905 - h + k * (h * 0.11) + 6, dx = (k % 2 ? 5 : -5);
        el('ellipse', { cx: x + dx * 0.6, cy: y + 18, rx: 7, ry: 4.5, fill: '#4F7A3A', opacity: 0.9 }, tuin);
        el('circle', { cx: x + dx * 0.3, cy: y, r: 6.2 - k * 0.3, fill: kleur }, tuin);
        el('circle', { cx: x + dx * 0.3, cy: y, r: 1.8, fill: '#F6E27A' }, tuin);
      }
    });

    // ijzeren ringen in de kademuur
    [330, 900, 1300].forEach((x) => el('circle', { cx: x, cy: 953, r: 4, fill: 'none', stroke: '#2A2622', 'stroke-width': 1.8 }, straat));
    // Amsterdammertjes langs de kant
    [70, 180, 420, 610, 690, 910, 990, 1110, 1350, 1490].forEach((x) => {
      el('rect', { x: x - 5, y: 920, width: 10, height: 28, rx: 2, fill: '#5A2A1E' }, straat);
      el('rect', { x: x - 5, y: 920, width: 3, height: 28, fill: '#fff', opacity: 0.14 }, straat);
      [927, 934, 941].forEach((y) => el('path', { d: `M${x - 2.5} ${y - 2.5} l5 5 M${x + 2.5} ${y - 2.5} l-5 5`, stroke: '#E9E2D2', 'stroke-width': 1 }, straat));
    });
    LANTAARNS.forEach((x) => lantaarn(straat, x, 956));
    // het bankje van Molenaar Kees
    el('ellipse', { cx: 1198, cy: 946, rx: 52, ry: 4, fill: '#000', opacity: 0.22 }, straat);
    el('rect', { x: 1152, y: 896, width: 92, height: 7, rx: 2, fill: '#7A532E' }, straat);
    el('rect', { x: 1150, y: 912, width: 96, height: 9, rx: 2, fill: '#6B4423' }, straat);
    el('path', { d: 'M1158 921 V944 M1238 921 V944 M1158 896 V912 M1238 896 V912', stroke: '#3B2412', 'stroke-width': 4 }, straat);
    BOMEN.forEach(([x]) => el('ellipse', { cx: x, cy: 950, rx: 40, ry: 5, fill: '#000', opacity: 0.25 }, straat));

    // ---------- de gracht ----------
    el('rect', { x: -40, y: 958, width: 1680, height: STRAAT_ONDER - 958, fill: 'url(#g-water)' }, svg);
    const spiegel = el('g', { 'clip-path': 'url(#g-waterclip)', opacity: 0.4 }, svg);
    el('use', { href: '#g-gevels', transform: 'matrix(1 0 0 -0.4 0 1320)' }, spiegel);
    el('rect', { x: -40, y: 958, width: 1680, height: STRAAT_ONDER - 958, fill: 'url(#g-rimpel)', opacity: 0.7 }, svg);
    el('rect', { x: -40, y: 958, width: 1680, height: 10, fill: '#000', opacity: 0.25 }, svg);
    const glans = el('g', { class: 'water-glans', stroke: '#E9F0EC', 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 20; i++) {
      const x = rnd() * 1600, y = 964 + Math.pow(rnd(), 1.6) * (STRAAT_ONDER - 972), l = 24 + rnd() * 60;
      el('line', { x1: x.toFixed(1), y1: y.toFixed(1), x2: (x + l).toFixed(1), y2: y.toFixed(1), 'stroke-width': 1.4, opacity: (0.15 + rnd() * 0.3).toFixed(2), style: `animation-delay:-${(rnd() * 6).toFixed(1)}s` }, glans);
    }
    el('rect', { x: -40, y: 958, width: 1680, height: 70, fill: 'url(#g-nevel)', class: 'nevel', 'pointer-events': 'none' }, svg);
    // eendjes (tik erop)
    const eenden = el('g', { class: 'eenden geen-winter' }, svg);
    [[640, 990, 0], [700, 999, 1]].forEach(([x, y, i]) => {
      const e = el('g', { class: 'eend tikbaar', 'data-bewoner': 'eend', transform: `translate(${x} ${y})` }, eenden);
      const hop = el('g', { class: 'hop' }, e);
      const zwem = el('g', { class: 'zwem', style: `animation-delay:-${i * 9}s` }, hop);
      el('ellipse', { cx: 0, cy: 6, rx: 17, ry: 2.2, fill: '#E9F0EC', opacity: 0.3, class: 'kring' }, zwem);
      const b = el('g', { class: 'eend-lijf', style: `animation-delay:-${i * 0.8}s` }, zwem);
      el('path', { d: 'M-14 -2 Q-16 -8 -10 -8 Q0 -10 8 -6 L12 0 Q0 6 -12 3 Z', fill: i ? '#8A6A4A' : '#7A6A52' }, b);
      el('path', { d: 'M-6 -6 Q2 -9 8 -5', stroke: i ? '#6A4E34' : '#5A4A38', 'stroke-width': 1.6, fill: 'none' }, b);
      el('circle', { cx: 10, cy: -9, r: 5.2, fill: i ? '#8A6A4A' : '#2E6A3A' }, b);
      if (!i) el('path', { d: 'M6 -5 h8', stroke: '#F2EEE4', 'stroke-width': 1.4 }, b);
      el('path', { d: 'M14.5 -9.5 l6.5 1.6 l-6.5 1.8 Z', fill: '#E0A030' }, b);
      el('circle', { cx: 11.5, cy: -10.5, r: 1, fill: '#1A140E' }, b);
      el('path', { d: 'M-14 -2 l-5 -4', stroke: i ? '#8A6A4A' : '#7A6A52', 'stroke-width': 3, 'stroke-linecap': 'round' }, b);
      el('rect', { x: -26, y: -24, width: 54, height: 34, fill: 'transparent' }, zwem);
    });
    // een roeibootje dat af en toe voorbij komt
    const boot = el('g', { class: 'geen-winter', transform: 'translate(0 994)' }, svg);
    const vaar = el('g', { class: 'roeiboot' }, boot);
    const bb = el('g', { class: 'deinen' }, vaar);
    el('path', { d: 'M-50 -8 H50 L38 7 H-40 Z', fill: '#6B4423', stroke: '#3B2412', 'stroke-width': 1.5 }, bb);
    el('path', { d: 'M-50 -8 H50', stroke: '#B07A4A', 'stroke-width': 2.4 }, bb);
    el('path', { d: 'M-40 -2 H40', stroke: '#2C4A7C', 'stroke-width': 2 }, bb);
    el('path', { d: 'M-6 -10 Q0 -32 6 -10 Z', fill: '#2C4A7C' }, bb);
    el('circle', { cx: 0, cy: -35, r: 6, fill: '#F1C9A5' }, bb);
    el('path', { d: 'M-8 -38 Q0 -47 8 -38 Z', fill: '#B6452C' }, bb);
    const riem = el('g', { class: 'riem' }, bb);
    el('path', { d: 'M0 -20 L-34 6', stroke: '#8A5A2E', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, riem);
    el('ellipse', { cx: -35, cy: 7, rx: 6, ry: 2, fill: '#8A5A2E' }, riem);
    el('ellipse', { cx: 0, cy: 8, rx: 58, ry: 3, fill: '#E9F0EC', opacity: 0.25 }, vaar);

    // ---------- de bewoners: overdag op straat ----------
    const mensen = el('g', { class: 'mensen overdag' }, svg);
    // Jantje met zijn hoepel
    const jantje = el('g', { class: 'bewoner hoepelaar tikbaar', 'data-bewoner': 'jantje', transform: 'translate(600 946)' }, mensen);
    const jHop = el('g', { class: 'hop' }, jantje);
    const jLoop = el('g', { class: 'loopt' }, jHop);
    el('ellipse', { cx: 14, cy: 0, rx: 30, ry: 3, fill: '#000', opacity: 0.2 }, jLoop);
    const jBob = el('g', { class: 'huppel' }, jLoop);
    bewoner(jBob, 'jantje');
    el('line', { x1: 18, y1: -30, x2: 29, y2: -14, stroke: '#5A3A1E', 'stroke-width': 2, 'stroke-linecap': 'round' }, jBob);
    const hoep = el('g', { transform: 'translate(36 -20)' }, jLoop);
    const draai = el('g', { class: 'hoepel-draai' }, hoep);
    el('circle', { r: 19, fill: 'none', stroke: '#8A5A2E', 'stroke-width': 3.4 }, draai);
    el('circle', { r: 17.4, fill: 'none', stroke: '#C9975A', 'stroke-width': 0.8 }, draai);
    el('path', { d: 'M0 -19 v4 M0 19 v-4 M-19 0 h4 M19 0 h-4', stroke: '#5A3A1E', 'stroke-width': 2 }, draai);
    el('rect', { x: -16, y: -74, width: 76, height: 76, fill: 'transparent' }, jLoop);
    // de burgemeester op zijn wandeling
    const burg = el('g', { class: 'bewoner wandelaar tikbaar', 'data-bewoner': 'burgemeester', transform: 'translate(1340 946)' }, mensen);
    const bHop = el('g', { class: 'hop' }, burg);
    const bLoop = el('g', { class: 'loopt' }, bHop);
    el('ellipse', { cx: 0, cy: 0, rx: 18, ry: 3, fill: '#000', opacity: 0.2 }, bLoop);
    const bBob = el('g', { class: 'stap' }, bLoop);
    bewoner(bBob, 'burgemeester');
    el('rect', { x: -26, y: -88, width: 52, height: 90, fill: 'transparent' }, bLoop);
    // Molenaar Kees met zijn pijpje op het bankje
    const kees = el('g', { class: 'bewoner zit tikbaar', 'data-bewoner': 'kees', transform: 'translate(1206 930) scale(-1 1)' }, mensen);
    const kHop = el('g', { class: 'hop' }, kees);
    bewoner(kHop, 'kees');
    const pijp = el('g', { class: 'pijprook', transform: 'translate(13 -55)' }, kHop);
    [0, 1, 2].forEach((i) => el('circle', { r: 4 + i * 0.8, fill: 'url(#g-rook)', style: `animation-delay:-${(i * 1.1).toFixed(1)}s` }, pijp));
    el('rect', { x: -18, y: -70, width: 38, height: 72, fill: 'transparent' }, kHop);
    // Grietje zwaait uit het raam van de herberg
    const grietje = el('g', { class: 'bewoner raam tikbaar', 'data-bewoner': 'grietje', transform: 'translate(450 516)' }, mensen);
    const gHop = el('g', { class: 'hop' }, grietje);
    bewoner(gHop, 'grietje');
    el('rect', { x: -26, y: -46, width: 52, height: 50, fill: 'transparent' }, gHop);
    // de kat op de vensterbank (na het kussen voor de kat)
    const kat = el('g', { class: 'bewoner straatkat toon-bij-kat tikbaar', 'data-bewoner': 'kat', transform: 'translate(986 862)' }, svg);
    const katHop = el('g', { class: 'hop' }, kat);
    el('path', { d: 'M12 -4 C 26 -6, 22 -26, 30 -30', fill: 'none', stroke: '#B46A2E', 'stroke-width': 4.5, 'stroke-linecap': 'round', class: 'straatkat-staart', style: 'transform-origin:12px -4px' }, katHop);
    el('ellipse', { cx: 0, cy: -10, rx: 14, ry: 10.5, fill: '#C97A3A' }, katHop);
    el('path', { d: 'M-6 -16 q 4 4 0 10 M2 -18 q 4 4 0 12', stroke: '#A85E28', 'stroke-width': 2, fill: 'none' }, katHop);
    el('circle', { cx: -10, cy: -21, r: 8, fill: '#C97A3A' }, katHop);
    el('path', { d: 'M-16 -26 L-16 -35 L-10 -28 Z M-7 -28 L-3 -36 L-1 -27 Z', fill: '#B46A2E' }, katHop);
    el('path', { d: 'M-14.5 -21.5 q1.5 1 3 0 M-8.5 -21.5 q1.5 1 3 0', stroke: '#2A1A0C', 'stroke-width': 1.2, fill: 'none' }, katHop);
    el('rect', { x: -22, y: -40, width: 56, height: 42, fill: 'transparent' }, katHop);
    // vallende blaadjes in de herfst
    const blaadjes = el('g', { class: 'blaadjes', 'pointer-events': 'none' }, svg);
    for (let i = 0; i < 9; i++) {
      const b = el('g', { class: 'blaadje', style: `animation-delay:-${(i * 2.7).toFixed(1)}s;animation-duration:${(16 + (i % 4) * 3)}s` }, blaadjes);
      el('path', { d: 'M0 -5 Q5 0 0 5 Q-5 0 0 -5 Z', fill: ['#D08A2E', '#B6452C', '#E0A848'][i % 3], transform: `translate(${(rnd() * 1500).toFixed(0)} ${(rnd() * 300 + 300).toFixed(0)})` }, b);
    }

    // ---------- Sinterklaas, winter en Koningsdag ----------
    bouwGevelSeizoen(svg, defs);

    // ---------- avond en nacht: een tint over huizen, straat, gracht en bomen ----------
    const tint = el('g', { 'clip-path': 'url(#g-tintclip)', 'pointer-events': 'none' }, svg);
    el('rect', { x: -40, y: 0, width: 1680, height: STRAAT_ONDER + 10, fill: '#F6B48C', class: 'tint tint-ochtend' }, tint);
    el('rect', { x: -40, y: 0, width: 1680, height: STRAAT_ONDER + 10, fill: '#5A3A78', class: 'tint tint-avond' }, tint);
    el('rect', { x: -40, y: 0, width: 1680, height: STRAAT_ONDER + 10, fill: '#0B1434', class: 'tint tint-nacht' }, tint);
    // zonnestralen in de ochtend
    const stralen = el('g', { class: 'zonnestralen', 'pointer-events': 'none' }, svg);
    [[0, 0.16, 0.05], [1, 0.3, 0.07], [2, 0.44, 0.05]].forEach(([i, hoek, breed]) => {
      const p = (a) => `${(150 + Math.cos(a) * 1800).toFixed(0)} ${(236 + Math.sin(a) * 1800).toFixed(0)}`;
      el('path', { d: `M150 236 L${p(hoek - breed / 2)} L${p(hoek + breed / 2)} Z`, fill: 'url(#g-straal)', class: 'straal', style: `animation-delay:-${i * 2.5}s` }, stralen);
    });

    const sneeuw = svg.querySelector('.sneeuwval');
    if (sneeuw) el('g', { class: 'alleen-winter', 'pointer-events': 'none' }, svg).appendChild(sneeuw);

    // ---------- lichten: ramen, lantaarns en hun spiegeling in de gracht ----------
    const lichten = el('g', { class: 'lichten', 'pointer-events': 'none' }, svg);
    LANTAARNS.forEach((x) => el('ellipse', { cx: x, cy: 950, rx: 120, ry: 22, fill: 'url(#g-schijnsel)', class: 'lantaarnlicht' }, lichten));
    const bronnen = el('g', { id: 'g-lichtbron' }, lichten);
    VENSTERS.forEach((v, i) => raamLicht(bronnen, v, i));
    LANTAARNS.forEach((x, i) => {
      const g = el('g', { class: 'lantaarnlicht' }, bronnen);
      el('circle', { cx: x, cy: 780, r: 66, fill: 'url(#g-schijnsel)', class: 'flakker', style: `animation-delay:-${i * 0.9}s` }, g);
      el('path', { d: `M${x - 9} 798 L${x + 9} 798 L${x + 13.5} 765 L${x - 13.5} 765 Z`, fill: '#FFF1C8' }, g);
      el('path', { d: `M${x} 798 V765`, stroke: '#3A2414', 'stroke-width': 2 }, g);
    });
    const herbergLamp = el('g', { class: 'lantaarnlicht' }, bronnen);
    el('circle', { cx: 390, cy: 790, r: 36, fill: 'url(#g-schijnsel)', class: 'flakker' }, herbergLamp);
    const deurlicht = el('g', { class: 'lantaarnlicht toon-bij-klaar' }, bronnen);
    el('circle', { cx: 732, cy: 788, r: 34, fill: 'url(#g-schijnsel)', class: 'flakker' }, deurlicht);
    el('rect', { x: 726, y: 780, width: 12, height: 16, fill: '#FFF1C8' }, deurlicht);
    const luiklicht = el('g', { class: 'lantaarnlicht toon-bij-lantaarn' }, bronnen);
    el('circle', { cx: 738, cy: 250, r: 26, fill: 'url(#g-schijnsel)', class: 'flakker' }, luiklicht);
    el('rect', { x: 734, y: 244, width: 8, height: 11, fill: '#FFF1C8' }, luiklicht);
    const spiegelLicht = el('g', { 'clip-path': 'url(#g-waterclip)', class: 'licht-spiegel' }, lichten);
    el('use', { href: '#g-lichtbron', transform: 'matrix(1 0 0 -0.4 0 1320)' }, spiegelLicht);
    el('rect', { x: -40, y: 958, width: 1680, height: STRAAT_ONDER - 958, fill: 'url(#g-rimpel)' }, spiegelLicht);
    // bomen aan de randen, vóór de verlichte ramen; blad en stam kleuren mee met seizoen en tijd van de dag
    BOMEN.forEach(([x, r], i) => {
      const boom = el('g', { class: 'boom', 'pointer-events': 'none' }, svg);
      el('path', { d: `M${x - 10} 958 C${x - 6} 820 ${x - 12} 720 ${x - 4} 600 L${x + 6} 600 C${x + 10} 720 ${x + 8} 820 ${x + 12} 958 Z`, fill: '#4A3426', class: 'stam' }, boom);
      el('path', { d: `M${x - 6} 900 C${x - 4} 800 ${x - 6} 720 ${x - 2} 620`, stroke: '#2E2018', 'stroke-width': 2, fill: 'none', opacity: 0.6 }, boom);
      const tak = { stroke: '#4A3426', fill: 'none', 'stroke-linecap': 'round', class: 'tak' };
      el('path', Object.assign({ d: `M${x} 640 C${x + r * 30} 600 ${x + r * 60} 560 ${x + r * 74} 516 M${x + r * 50} 578 C${x + r * 70} 570 ${x + r * 96} 560 ${x + r * 110} 540`, 'stroke-width': 7 }, tak), boom);
      el('path', Object.assign({ d: `M${x} 660 C${x - r * 30} 620 ${x - r * 50} 580 ${x - r * 64} 548 M${x - r * 4} 610 C${x - r * 2} 560 ${x + r * 8} 500 ${x + r * 4} 430 M${x + r * 4} 500 C${x + r * 24} 470 ${x + r * 30} 440 ${x + r * 44} 420`, 'stroke-width': 5 }, tak), boom);
      const kruin = el('g', { class: 'kruin', style: `animation-delay:-${i * 2.2}s;transform-origin:${x}px 958px` }, boom);
      KRUIN.forEach(([dx, dy, rr]) => el('circle', { cx: x + dx * r + 5, cy: 640 + dy + 9, r: rr, fill: 'url(#g-boomdonker)', class: 'blad' }, kruin));
      KRUIN.forEach(([dx, dy, rr]) => el('circle', { cx: x + dx * r, cy: 640 + dy, r: rr * 0.94, fill: 'url(#g-boomblad)', class: 'blad' }, kruin));
      KRUIN.forEach(([dx, dy, rr], k) => { if (k % 3 !== 1) el('circle', { cx: x + dx * r - rr * 0.32, cy: 640 + dy - rr * 0.36, r: rr * 0.42, fill: 'url(#g-boomlicht)', class: 'blad' }, kruin); });
    });

    // kattenogen in het donker
    const ogen = el('g', { class: 'kattenogen toon-bij-kat' }, lichten);
    [[975.5, 840.5], [981.5, 840.5]].forEach(([cx, cy]) => el('ellipse', { cx, cy, rx: 1.8, ry: 1.3, fill: '#E6F27A' }, ogen));

    // ---------- wijzers bij de deur en het luik: voortgang en "er kan een klus" ----------
    [['voorkamer', 'deur', 880, 716], ['zolder', 'luik', 884, 246]].forEach(([plek, ik, x, y]) => {
      const g = el('g', { class: 'plek-wijzer', 'data-wijzer': plek, transform: `translate(${x} ${y})` }, svg);
      const zweef = el('g', { class: 'zweef' }, g);
      el('circle', { r: 26, fill: '#1A0F06', opacity: 0.35, transform: 'translate(2 4)' }, zweef);
      el('circle', { r: 25, fill: '#2A1A0C', opacity: 0.55 }, zweef);
      el('circle', { r: 25, fill: 'none', stroke: 'rgba(255,240,200,.3)', 'stroke-width': 4 }, zweef);
      el('circle', { r: 25, fill: 'none', stroke: '#F6D77E', 'stroke-width': 4.2, 'stroke-linecap': 'round', 'stroke-dasharray': '0 157.1', transform: 'rotate(-90)', class: 'ring' }, zweef);
      el('circle', { r: 19.5, fill: 'url(#g-goud)', stroke: '#6A4A14', 'stroke-width': 1.2 }, zweef);
      el('circle', { cx: -6, cy: -7, r: 6, fill: '#fff', opacity: 0.25 }, zweef);
      el('use', { href: '#i-' + ik, x: -11, y: -11, width: 22, height: 22, style: 'color:#2A1A08' }, zweef);
      const roept = el('g', { class: 'roept', transform: 'translate(18 -18)' }, zweef);
      const puls = el('g', { class: 'puls' }, roept);
      el('circle', { r: 10.5, fill: '#B6452C', stroke: '#FBF3DC', 'stroke-width': 2 }, puls);
      el('use', { href: '#i-hamer', x: -6.5, y: -6.5, width: 13, height: 13, style: 'color:#FBF3DC' }, puls);
      const af = el('g', { class: 'af-teken', transform: 'translate(18 -18)' }, zweef);
      el('circle', { r: 10.5, fill: '#2C4A35', stroke: '#FBF3DC', 'stroke-width': 2 }, af);
      el('use', { href: '#i-vink', x: -6.5, y: -6.5, width: 13, height: 13, style: 'color:#FBF3DC' }, af);
      el('circle', { r: 31, fill: 'transparent', class: 'plek-klik', 'data-plek': plek, role: 'button', tabindex: 0, 'aria-label': plek === 'voorkamer' ? 'Naar de voorkamer' : 'Naar de zolder' }, g);
    });

    {
      const g = el('g', { class: 'plek-wijzer pronk-wijzer', 'data-wijzer': 'pronkkamer', transform: 'translate(716 642)' }, svg);
      const zweef = el('g', { class: 'zweef' }, g);
      el('circle', { r: 24, fill: '#1A0F06', opacity: 0.35, transform: 'translate(2 4)' }, zweef);
      el('circle', { r: 23, fill: '#12281C', opacity: 0.7 }, zweef);
      el('circle', { r: 23, fill: 'none', stroke: 'rgba(255,240,200,.3)', 'stroke-width': 4 }, zweef);
      el('circle', { r: 23, fill: 'none', stroke: '#F6D77E', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '0 144.5', transform: 'rotate(-90)', class: 'ring' }, zweef);
      el('circle', { r: 17.5, fill: 'url(#g-pronk)', stroke: '#6A4A14', 'stroke-width': 1.2 }, zweef);
      el('circle', { cx: -5, cy: -6, r: 5, fill: '#fff', opacity: 0.18 }, zweef);
      el('use', { href: '#i-kast', x: -10, y: -10, width: 20, height: 20, style: 'color:#F2CF7A' }, zweef);
      const ster = el('g', { class: 'nieuw-teken', transform: 'translate(17 -17)' }, zweef);
      const puls = el('g', { class: 'puls' }, ster);
      el('circle', { r: 10, fill: '#C9973F', stroke: '#FBF3DC', 'stroke-width': 2 }, puls);
      el('use', { href: '#i-ster', x: -6.5, y: -6.5, width: 13, height: 13, style: 'color:#FBF3DC' }, puls);
      el('circle', { r: 29, fill: 'transparent', class: 'plek-klik', 'data-plek': 'pronkkamer', role: 'button', tabindex: 0, 'aria-label': 'Naar de pronkkamer' }, g);
    }

    svg.setAttribute('data-tijd', tijdNu());
    svg.setAttribute('data-boom', boomNu());
    kleurTijd(svg);
    return svg;
  }

  // ---------- Tijd van de dag en het blad aan de bomen ----------
  // zonsopkomst en -ondergang in Nederland per maand (plaatselijke kloktijd, in uren)
  const ZON = [[8.8, 16.9], [8.0, 17.8], [7.0, 18.7], [6.9, 20.6], [6.0, 21.4], [5.3, 22.0], [5.6, 21.9], [6.4, 21.0], [7.3, 19.9], [8.1, 18.7], [8.0, 16.9], [8.7, 16.5]];
  const TIJDEN = ['ochtend', 'dag', 'avond', 'nacht'];
  function tijdKeuze() {
    let k = '';
    try { k = sessionStorage.getItem('speelhuys.tijd') || ''; } catch (e) { /* */ }
    return TIJDEN.includes(k) ? k : 'auto';
  }
  function tijdNu(nu) {
    const k = tijdKeuze();
    if (k !== 'auto') return k;
    const d = nu || new Date();
    const u = d.getHours() + d.getMinutes() / 60;
    const [op, onder] = ZON[d.getMonth()];
    if (u < op - 0.75 || u > onder + 1) return 'nacht';
    if (u < op + 1) return 'ochtend';
    if (u > onder - 1.2) return 'avond';
    return 'dag';
  }
  function boomNu() {
    const s = window.Seizoen ? Seizoen.huidig : 'gewoon';
    if (s === 'winter') return 'kaal';
    if (s === 'koningsdag') return 'lente';
    if (s === 'sinterklaas') return 'herfst';
    const m = new Date().getMonth();
    if (m === 11 || m <= 1) return 'kaal';
    if (m <= 4) return 'lente';
    if (m <= 7) return 'zomer';
    return 'herfst';
  }
  const WOLK_KLEUR = {
    dag: [['#FFFFFF', 1], ['#F1F0EA', 1], ['#C9CDD0', 1]],
    ochtend: [['#FFF7EC', 1], ['#F7DED2', 1], ['#C9AAB6', 1]],
    avond: [['#FFE4CC', 1], ['#EDA9A0', 1], ['#875F86', 1]],
    nacht: [['#4E5A86', 0.75], ['#323C68', 0.7], ['#1E2648', 0.6]]
  };
  const BLAD_KLEUR = {
    lente: ['#B6D88A', '#7FB056', '#4E7E36'],
    zomer: ['#93BC6C', '#5E8C42', '#365E2A'],
    herfst: ['#E2A852', '#C0702C', '#84391C'],
    kaal: ['#93BC6C', '#5E8C42', '#365E2A']
  };
  function kleurStops(svg, id, kleuren) {
    const stops = svg.querySelectorAll(`#${id} stop`);
    kleuren.forEach((k, i) => {
      if (!stops[i]) return;
      const [kleur, dekking] = Array.isArray(k) ? k : [k, 1];
      stops[i].setAttribute('stop-color', kleur);
      stops[i].setAttribute('stop-opacity', dekking);
    });
  }
  const BLAD_DONKER = { lente: ['#3E6A2C', '#2E5222'], zomer: ['#2C4A22', '#22381A'], herfst: ['#7A3418', '#5A240F'], kaal: ['#2C4A22', '#22381A'] };
  const BLAD_LICHT = { lente: [['#EEF9C8', 0.5], ['#EEF9C8', 0]], zomer: [['#D8EFA8', 0.45], ['#D8EFA8', 0]], herfst: [['#FFE6A6', 0.5], ['#FFE6A6', 0]], kaal: [['#D8EFA8', 0.45], ['#D8EFA8', 0]] };
  // dezelfde tint als over de huizen (zie de CSS), hier vooraf gemengd voor wat vóór de lichtjes staat
  const TINT = { ochtend: ['#F6B48C', 0.14], avond: ['#5A3A78', 0.36], nacht: ['#0B1434', 0.64] };
  function meng(kleur, tint) {
    if (!tint) return kleur;
    const a = parseInt(kleur.slice(1), 16), b = parseInt(tint[0].slice(1), 16), f = tint[1];
    const kanaal = (k) => Math.round(((a >> k) & 255) * (1 - f) + ((b >> k) & 255) * f);
    return '#' + ((1 << 24) | (kanaal(16) << 16) | (kanaal(8) << 8) | kanaal(0)).toString(16).slice(1);
  }
  function kleurTijd(svg) {
    const boom = svg.getAttribute('data-boom'), tint = TINT[svg.getAttribute('data-tijd')];
    const getint = (lijst) => lijst.map((k) => (Array.isArray(k) ? [meng(k[0], tint), k[1]] : meng(k, tint)));
    kleurStops(svg, 'g-wolk', WOLK_KLEUR[svg.getAttribute('data-tijd')] || WOLK_KLEUR.dag);
    kleurStops(svg, 'g-boomblad', getint(BLAD_KLEUR[boom] || BLAD_KLEUR.zomer));
    kleurStops(svg, 'g-boomdonker', getint(BLAD_DONKER[boom] || BLAD_DONKER.zomer));
    kleurStops(svg, 'g-boomlicht', getint(BLAD_LICHT[boom] || BLAD_LICHT.zomer));
    svg.querySelectorAll('.boom .stam').forEach((e) => e.setAttribute('fill', meng('#4A3426', tint)));
    svg.querySelectorAll('.boom .tak').forEach((e) => e.setAttribute('stroke', meng('#4A3426', tint)));
  }

  // de gevelsteen van de kunstkamer: een stenen bord met een opengeslagen boek, boven de deur van de buren
  function gevelsteen(ouder, cx, top) {
    const g = el('g', { class: 'gevelsteen', 'pointer-events': 'none' }, ouder);
    el('rect', { x: cx - 64 + 3, y: top + 4, width: 128, height: 46, rx: 3, fill: '#2A1A0C', opacity: 0.35 }, g);
    el('rect', { x: cx - 64, y: top, width: 128, height: 46, rx: 3, fill: '#E6DCC2', stroke: '#9C8B66', 'stroke-width': 1.4 }, g);
    el('rect', { x: cx - 59, y: top + 5, width: 118, height: 36, rx: 2, fill: 'none', stroke: '#B8A57E', 'stroke-width': 1 }, g);
    // het boekje in reliëf
    const b = el('g', { transform: `translate(${cx - 52} ${top + 11}) scale(1.05)` }, g);
    el('path', { d: 'M12 6.4 C9.6 4.8 6.4 4.4 3 5 V18.6 C6.4 18 9.6 18.4 12 20 C14.4 18.4 17.6 18 21 18.6 V5 C17.6 4.4 14.4 4.8 12 6.4 Z', fill: '#F4EDDA', stroke: '#6E5E40', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, b);
    el('path', { d: 'M12 6.4 V20', stroke: '#6E5E40', 'stroke-width': 1.2 }, b);
    tekst('Kunstkamer', { x: cx + 12, y: top + 24, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 17, fill: '#3A2E1E' }, g);
    tekst('lezen en kijken', { x: cx + 12, y: top + 37, 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-size': 10.5, fill: '#5A4A30' }, g);
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
    el('rect', { x: -40, y: 958, width: 1680, height: STRAAT_ONDER - 958, fill: '#CFE0E8' }, ijs);
    for (let i = 0; i < 22; i++) {
      const x = rnd() * 1600, y = 962 + rnd() * (STRAAT_ONDER - 975), l = 30 + rnd() * 90;
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
    plekKlik(winter, { x: 0, y: 958, width: 1600, height: STRAAT_ONDER - 958 }, 'ijsbaan', 'IJsbaan, binnenkort');
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
    pasGevelBeeld();
    maakKamer(gewensteIndeling());

    // de bewoners en de eendjes zeggen iets als je erop tikt
    gevelSvg.querySelectorAll('[data-bewoner]').forEach((b) => {
      b.addEventListener('click', (e) => { e.preventDefault(); tikBewoner(b); });
    });
    // de tijd van de dag volgt de klok
    setInterval(werkTijdBij, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) werkTijdBij(); });

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
      maatTimer = setTimeout(() => { pasGevelBeeld(); pasMaatAan(); }, 160);
    });
    if (window.Duiten) window.Duiten.opWijziging(() => { werkHudBij(); werkGevelBij(); });
    if (window.Seizoen) window.Seizoen.opWijziging(() => { if (kamerSvg) zetSchoen(kamerSvg); werkTijdBij(); });
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

  // Hoort het spel in een kamer die nog dicht is?
  // Een vast vlak onder elk voorwerp, een stukje langer dan het voorwerp zelf. Bij aanwijzen met de muis komt een
  // voorwerp een paar pixels omhoog; zonder dit vlak glijdt het dan onder een muis bij de onderrand weg, zakt terug,
  // komt weer omhoog, en zo eindeloos door. Het vlak beweegt niet mee, dus de muis blijft erop.
  function vastVlak(v) {
    if (v.querySelector(':scope > .vlak')) return;
    const vw = v.querySelector(':scope > .vw');
    if (!vw) return;
    let b;
    try { b = vw.getBBox(); } catch (e) { return; }
    if (!b || !b.width || !b.height) return;
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('class', 'vlak');
    r.setAttribute('x', b.x.toFixed(1)); r.setAttribute('y', b.y.toFixed(1));
    r.setAttribute('width', b.width.toFixed(1)); r.setAttribute('height', (b.height + 9).toFixed(1));
    r.setAttribute('fill', 'transparent');
    v.insertBefore(r, v.firstChild);
  }
  function koppelVoorwerpen(svg) {
    const viaToetsen = (v) => { try { return v.matches(':focus-visible'); } catch (e) { return false; } };
    svg.querySelectorAll('.voorwerp').forEach((v) => {
      vastVlak(v);
      // labels alleen bij de muis of het toetsenbord: op een aanraakscherm kan een label dat bij het
      // aanraken verschijnt ervoor zorgen dat Safari de tik als "aanwijzen" ziet en niet als klik
      v.addEventListener('pointerenter', (e) => { vastVlak(v); if (e.pointerType === 'mouse') toonLabel(v); });
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

  // De straat: welke plekken zijn open, en hoe ver is het huis opgeknapt?
  function werkGevelBij() {
    if (!gevelSvg || !window.Duiten) return;
    const zolder = Duiten.kamerOpen('zolder');
    gevelSvg.classList.toggle('zolder-open', zolder);
    gevelSvg.classList.toggle('kamer-klaar', Duiten.kamerKlaar('voorkamer'));
    const klaar = (id) => Duiten.klusKlaar(id);
    const n = Duiten.aantalKlaar('voorkamer');
    const stand = {
      'st-ramen': klaar('ramen'), 'st-muren': klaar('muren'), 'st-deur': n >= 5, 'st-kroon': klaar('kroon'),
      'st-bloemen': n >= 7, 'st-tuin': n >= 8, 'st-steen': n >= 9, 'st-kat': klaar('kat'),
      'st-luik': zolder && klaar('z-luik'), 'st-lantaarn': zolder && klaar('z-lantaarn'), 'st-duiven': zolder && klaar('z-duiven')
    };
    Object.keys(stand).forEach((k) => gevelSvg.classList.toggle(k, !!stand[k]));
    // de wijzers bij de deur en het luik: een ring voor de voortgang en een hamertje als er een klus kan
    ['voorkamer', 'zolder'].forEach((k) => {
      const w = gevelSvg.querySelector(`[data-wijzer="${k}"]`);
      if (!w) return;
      const tot = Duiten.klussenVan(k).length, gedaan = Duiten.aantalKlaar(k);
      w.querySelector('.ring').setAttribute('stroke-dasharray', `${(157.1 * gedaan / tot).toFixed(1)} 157.1`);
      const v = Duiten.volgendeKlus(k);
      w.classList.toggle('kan', !!v && Duiten.saldo >= v.prijs);
      w.classList.toggle('af', !v);
    });
    if (window.Pronk) {
      const nieuw = Pronk.ongezien().length > 0, won = Pronk.prijzen.filter((x) => Pronk.gewonnen(x)).length;
      const w = gevelSvg.querySelector('[data-wijzer="pronkkamer"]');
      if (w) { w.querySelector('.ring').setAttribute('stroke-dasharray', `${(144.5 * won / Pronk.prijzen.length).toFixed(1)} 144.5`); w.classList.toggle('nieuw', nieuw); }
      const knop = document.querySelector('.plek-knop[data-plek="pronkkamer"]');
      if (knop) knop.classList.toggle('nieuw', nieuw);
    }
    document.querySelectorAll('.plek-knop').forEach((k) => {
      const p = k.getAttribute('data-plek');
      const open = p === 'voorkamer' || p === 'kunstkamer' || p === 'pronkkamer' || (p === 'zolder' && zolder);
      k.classList.toggle('dicht', !open);
      const naam = k.querySelector('.plek-naam') ? k.querySelector('.plek-naam').textContent : p;
      k.setAttribute('aria-label', open ? naam : `${naam}, nog op slot`);
    });
    const welkom = gevel.querySelector('.gevel-tekst');
    if (welkom) welkom.hidden = !!Duiten.veld('bezocht', false);
  }

  function kiesPlek(plek, bron) {
    if (bezig) return;
    if (plek === 'kunstkamer') { Geluid.deur(); location.hash = '#kunstkamer'; return; }
    if (plek === 'pronkkamer') { naarPronkkamer(); return; }
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
    label.classList.remove('met-gezicht');
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

  let laatsteStart = null; // { spel, kamer }: daar ga je na het spel weer naartoe
  function zoomNaar(v) {
    if (bezig) return;
    const spel = v.getAttribute('data-spel');
    laatsteStart = { spel, kamer: kamerNaam };
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
    if (gevel.hidden === false) { terugOpStraat(); return; }
    let k = window.Duiten ? Duiten.kamerVanSpel(spel) : 'voorkamer';
    if (laatsteStart && laatsteStart.spel === spel && kamerOpen(laatsteStart.kamer)) k = laatsteStart.kamer;
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
    pasGevelBeeld();
    werkTijdBij();
    werkGevelBij();
    vierVoortgang();
  }

  // ---------- De straat: uitsnede, tijd van de dag, bewoners en nieuwe opknapklussen ----------
  // Op een staand scherm laat de tekening meer gracht zien en snijdt ze minder van het huis af.
  function pasGevelBeeld() {
    if (!gevelSvg || !toneel) return;
    const b = toneel.clientWidth || window.innerWidth, h = toneel.clientHeight || window.innerHeight;
    const a = b / Math.max(1, h);
    const dok = a >= 1.45 && h >= 520;
    gevel.classList.toggle('dok', dok);
    let hoog = 1000;
    if (a < 1.45) {
      // de knoppenbalk onderin bedekt een stukje; daarboven moet nog gracht te zien zijn
      const balk = document.getElementById('plekken');
      const bh = balk && balk.offsetHeight ? balk.offsetHeight + 20 : 90;
      hoog = Math.round(Math.min(STRAAT_ONDER, Math.max(1060, 1070 / Math.max(0.5, 1 - bh / h))));
    }
    const breed = Math.max(600, Math.min(1600, hoog * a));
    const vb = `${(800 - breed / 2).toFixed(1)} 0 ${breed.toFixed(1)} ${hoog}`;
    if (gevelSvg.getAttribute('viewBox') !== vb) gevelSvg.setAttribute('viewBox', vb);
  }

  function werkTijdBij() {
    if (!gevelSvg) return;
    const t = tijdNu(), boom = boomNu();
    if (gevelSvg.getAttribute('data-tijd') === t && gevelSvg.getAttribute('data-boom') === boom) return;
    gevelSvg.setAttribute('data-tijd', t);
    gevelSvg.setAttribute('data-boom', boom);
    kleurTijd(gevelSvg);
  }

  const ZEGT = {
    jantje: ['Kijk mij eens hoepelen!', 'Speel je straks mee?', 'Ik ben de snelste van de gracht!'],
    burgemeester: ['Goedendag!', 'Wat wordt dat pand mooi.', 'Op naar het stadhuis.'],
    kees: ['De wind zit goed vandaag.', 'Zin in een potje molen?', 'Rustig aan, jong.'],
    grietje: ['Hallo daar!', 'De herberg gaat bijna open!', 'Kom je een spelletje doen?'],
    kat: ['Miauw.', 'Prrr…'],
    eend: ['Kwak!', 'Kwak kwak!']
  };
  const KLANK = { jantje: 'fluit', grietje: 'fluit', kat: 'miauw', eend: 'kwak', burgemeester: 'tik', kees: 'tik' };
  let zegTeller = 0;
  function tikBewoner(b) {
    if (bezig) return;
    const wie = b.getAttribute('data-bewoner');
    const lijst = ZEGT[wie] || ['Hallo!'];
    const tekst = lijst[zegTeller++ % lijst.length];
    const klank = KLANK[wie];
    if (klank && Geluid[klank]) Geluid[klank]();
    if (window.Tril) Tril.klik();
    const hop = b.querySelector('.hop');
    if (hop && !rustig()) {
      hop.animate(wie === 'eend'
        ? [{ transform: 'translateY(0)' }, { transform: 'translateY(7px)', offset: 0.35 }, { transform: 'translateY(0)' }]
        : [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)', offset: 0.4 }, { transform: 'translateY(0)' }],
      { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' });
    }
    toonLabel(b, tekst);
    if (label && !label.hidden && window.Personen && Personen.gezicht[wie]) {
      const gezicht = document.createElement('span');
      gezicht.className = 'label-gezicht';
      gezicht.innerHTML = Personen.gezicht[wie];
      const zin = document.createElement('span');
      zin.textContent = tekst;
      label.textContent = '';
      label.append(gezicht, zin);
      label.classList.add('met-gezicht');
    }
  }

  // Wat is er buiten veranderd sinds je de straat het laatst zag? Daar komen vonkjes.
  const VOORTGANG_PLEK = {
    'st-ramen': [[594, 742, 92, 120], [914, 742, 92, 120]],
    'st-muren': [[540, 420, 520, 470]],
    'st-deur': [[758, 762, 84, 143], [594, 790, 50, 70]],
    'st-kroon': [[594, 742, 92, 60], [914, 742, 92, 60]],
    'st-bloemen': [[594, 686, 92, 34], [914, 686, 92, 34]],
    'st-tuin': [[530, 750, 44, 155], [1026, 760, 44, 145]],
    'st-steen': [[748, 594, 104, 92]],
    'st-kat': [[962, 820, 56, 44]],
    'kamer-klaar': [[716, 770, 32, 32], [594, 432, 412, 110]],
    'zolder-open': [[766, 220, 68, 94]],
    'st-luik': [[748, 226, 104, 82]],
    'st-lantaarn': [[726, 232, 24, 30]],
    'st-duiven': [[756, 118, 88, 30]]
  };
  function svgVak(x, y, b, h) {
    const m = gevelSvg.getScreenCTM();
    if (!m) return null;
    const p = gevelSvg.createSVGPoint();
    p.x = x; p.y = y; const a = p.matrixTransform(m);
    p.x = x + b; p.y = y + h; const c = p.matrixTransform(m);
    return new DOMRect(Math.min(a.x, c.x), Math.min(a.y, c.y), Math.abs(c.x - a.x), Math.abs(c.y - a.y));
  }
  function vierVoortgang() {
    if (!gevelSvg || !window.Duiten) return;
    const nu = Object.keys(VOORTGANG_PLEK).filter((k) => gevelSvg.classList.contains(k));
    const eerder = Duiten.veld('gevel-gezien', null);
    const nieuw = Array.isArray(eerder) ? nu.filter((k) => !eerder.includes(k)) : [];
    if (!Array.isArray(eerder) || nieuw.length || eerder.length !== nu.length) Duiten.zetVeld('gevel-gezien', nu);
    if (!nieuw.length) return;
    setTimeout(() => {
      if (gevel.hidden) return;
      if (Geluid.cadeau) Geluid.cadeau();
      nieuw.forEach((k, i) => setTimeout(() => {
        if (gevel.hidden) return;
        VOORTGANG_PLEK[k].forEach(([x, y, b, h]) => { const r = svgVak(x, y, b, h); if (r) vonkenOp(r, 14); });
      }, i * 450));
    }, 650);
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

  // Naar de pronkkamer: de camera zoomt in op de ramen van de eerste verdieping, en dan sta je in de kamer.
  function naarPronkkamer() {
    if (bezig) return;
    verbergLabel();
    if (rustig() || !gevelSvg) { location.hash = '#pronkkamer'; return; }
    bezig = true;
    try {
      const t = toneel.getBoundingClientRect(), s0 = gevelSvg.getBoundingClientRect(), r = svgVak(597, 588, 406, 108);
      const cx = r.left + r.width / 2 - s0.left, cy = r.top + r.height / 2 - s0.top;
      const s = Math.min(t.width * 0.95 / r.width, t.height * 0.9 / r.height, 9);
      const tx = t.left + t.width / 2 - s0.left - s * cx, ty = t.top + t.height / 2 - s0.top - s * cy;
      Geluid.woesj();
      gevelSvg.animate([{ transform: 'translate(0px,0px) scale(1)' }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], { duration: 1000, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      sluier.style.background = '#2A170C';
      sluier.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 1000, easing: 'ease-in', fill: 'forwards' });
    } catch (e) { bezig = false; location.hash = '#pronkkamer'; return; }
    setTimeout(() => { bezig = false; location.hash = '#pronkkamer'; }, 1010);
  }
  // terug uit de pronkkamer (of een ander scherm) terwijl je op de gracht stond: de camera zoomt weer uit
  function terugOpStraat() {
    const zoom = gevelSvg ? gevelSvg.getAnimations() : [];
    const van = zoom.length ? getComputedStyle(gevelSvg).transform : 'none';
    zoom.forEach((a) => a.cancel());
    sluier.getAnimations().forEach((a) => a.cancel());
    pasGevelBeeld();
    werkGevelBij();
    if (rustig() || van === 'none') { sluier.style.opacity = 0; return; }
    sluier.style.opacity = 1;
    gevelSvg.animate([{ transform: van }, { transform: 'translate(0px,0px) scale(1)' }], { duration: 900, easing: 'cubic-bezier(.3,0,.25,1)' });
    sluier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'forwards' });
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
    get tijd() { return gevelSvg ? gevelSvg.getAttribute('data-tijd') : tijdNu(); },
    get tijdKeuze() { return tijdKeuze(); },
    kiesTijd(k) {
      try {
        if (TIJDEN.includes(k)) sessionStorage.setItem('speelhuys.tijd', k);
        else sessionStorage.removeItem('speelhuys.tijd');
      } catch (e) { /* geen opslag */ }
      werkTijdBij();
    },
    werkBij() {
      if (!gebouwd) return;
      if (kamerNaam !== 'voorkamer' && !kamerOpen(kamerNaam)) { zetKamerNaam('voorkamer'); maakKamer(gewensteIndeling()); }
      pasStaatToe(kamerSvg);
      werkHudBij();
      werkGevelBij();
    }
  };
})();
