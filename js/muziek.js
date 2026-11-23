/* Achtergrondmuziek: melodieën uit Jacob van Eyck, Der Fluyten Lust-hof (Amsterdam, 1649 en 1654).
   De browser speelt de noten zelf met Web Audio, dus er is geen opname en er zijn geen uitvoeringsrechten.

   Een klein barokensemble speelt ze: blokfluit, luit, klavecimbel, viola da gamba en een tabortrommel.
   - De luit en het klavecimbel zijn getokte snaren (Karplus-Strong, zie geluid.js), de blokfluit heeft adem en
     vibrato, de gamba strijkt de baslijn en de tabor slaat de maat bij de dans.
   - Van Eyck schreef alleen de melodie. De begeleiding wordt hier voor elk stuk zelf bedacht: per halve of hele maat
     een akkoord uit de toonsoort, gekozen zoals een continuospeler dat doet (de melodietonen moeten passen, met de
     gebruikelijke stappen zoals IV-V-I, en aan het eind van een deel een cadens V-I). Daarbij een vloeiende baslijn
     en akkoorden die zo min mogelijk verspringen.
   - Gespeeld als door mensen: nadruk op de tel, een ademende frase, een triller op de slotnoot, iets vertragen
     naar het eind van elk deel, en net niet precies tegelijk.

   Notatie van de noten: Duitse nootnamen (h = si, b = si-mol, fis = fa-kruis), ' = octaaf hoger,
   c' = centrale do, getal = notenwaarde (4 = kwart), punt = gepunteerd, ~ = overbinding, | = maatstreep,
   |: :| = herhaling, [1 [2 = eerste en tweede eind, || = slot. */
(function () {
  const STUKKEN = {
    thuis: {
      titel: 'Engels Nachtegaeltje',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      melodie: 'blokfluit', stijl: 'arpeggio', tempo: 74, transpositie: 0, maat: 4, grond: 0, mineur: false, niveau: 0.52,
      noten: "|: e''4. d''16 e''16 c''4 g''8. f''16 | e''2. , c''8 d''8 | e''4 c''4 e''4 fis''4 | g''2. , e''8 f''8 | " +
             "g''4 g''8 a''8 g''4 e''8 f''8 | g''8 f''8 g''8 a''8 g''4 e''8 f''8 | g''4 e''4 f''4 g''4 | a''4 , a'4 a'4. h'8 | " +
             "c''8 d''8 e''8 f''8 g''4 c''4 | h'8. c''16 d''4 g'4 g''4 | e''8. f''16 g''8 e''8 d''4. c''8 | c''2. :| " +
             "|: f''8. g''16 | a''4 f''4 f''4. g''8 | a''8 f''8 a''8 f''8 a''8 f''8 a''8 f''8 | a''8 f''8 a''8 f''8 e''4 fis''4 | g''1 | " +
             "g''1 , | g''8 g''8 g''8 g''8 g''2 | g''8 g''8 g''8 g''8 g''8 g''8 g''4 | e''8. f''16 g''8 e''8 d''4. c''8 | [1 c''2. :| [2 c''1 ||"
    },
    ganzenbord: {
      titel: 'Malle Symen',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      melodie: 'blokfluit', stijl: 'dans', tempo: 100, transpositie: 0, maat: 4, grond: 2, mineur: true, trom: true, niveau: 0.5,
      noten: "|: a'2 f''2 | e''2 a'4 a''4 | g''4 f''4 e''4 d''4 | cis''4 a'4 a'2 , | " +
             "f''4 d''4 e''4 a'4 | g'4 f'4 e'4 d'4 | a'4 d''4 h'4 cis''4 | d''1 :| " +
             "|: f''8 g''8 a''4 e''8 f''8 g''4 | d''8 f''8 e''8 d''8 cis''4 a'4 , | f'8 g'8 a'4 e'8 f'8 g'4 | " +
             "d'8 f''8 e''8 d''8 cis''8 h'8 a'4 , | d''8 e''8 f''8 g''8 a''8 f''8 d''4 | d'8 e'8 f'8 g'8 a'8 f'8 d'4 , | " +
             "f''8 g''8 a''8 b''8 c'''8 a''8 f''4 | f'8 g'8 a'8 b'8 c''8 a'8 f'4 , | f''4. f''8 e''4. e''8 | " +
             "d''8 f''8 e''8 d''8 cis''4 a'4 | h'8 c''8 d''8 h'8 cis''8 d''8 e''8 cis''8 | d''4 d'4 d''2 :|"
    },
    sjoelen: {
      titel: 'Onder de Linde groene',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof II (1654)',
      melodie: 'klavecimbel', stijl: 'klavier', tempo: 90, transpositie: 0, maat: 4, grond: 0, mineur: false, niveau: 1.8,
      noten: "|: g'2 c''2 | e'4. f'8 g'2 | c''4 g'4 a'4 g'4 | e'8 f'8 g'4 e''2 , | " +
             "g'4. a'8 h'8 c''8 d''4 | f'4. g'8 a'8 h'8 c''4 | e'2 d'2 | c'1 :| " +
             "|: g'4 g'4 a'8 h'8 c''4 | c''4 h'4 c''2 , | d''8 e''8 f''8 d''8 e''4 e''4 | d''8 e''8 f''8 d''8 e''8. f''16 g''4 , | " +
             "g'4. a'8 h'8 c''8 d''4 | f'4. g'8 a'8 h'8 c''4 | e'2 d'2 | c'1 :|"
    },
    molenspel: {
      titel: "Doen Daphne d'over schoone Maeght",
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      melodie: 'luit', stijl: 'menuet', tempo: 96, transpositie: 0, maat: 3, grond: 2, mineur: true, niveau: 1,
      noten: "d'4 | f'2 g'4 | a'2 d''4 | cis''4. d''8 e''4 | d''2 , a'4 | " +
             "c''4 a'4 f'4 | g'4 e'4 c'4 | d'4 f'4 e'4 | [1 d'2 :| [2 d'2. | " +
             "|: f''2 f''4 | e''2 e''4 | d''2 d''4 | cis''2 , a'4 | a'4. b'8 a'4 | g'4. a'8 f'4 | f'4. g'8 e'4 | f'2. :| " +
             "|: c''4 c''4 d''4 | c''4 a'4 f'4 | c''4. d''8 e''8 f''8 | g''4 e''4 c''4 , | a'4. g'8 f'4 | e'4 d'4 d''4 | " +
             "cis''4. d''8 e''4 | d''2 , a'8 h'8 | c''4 a'4 f'4 | g'4 e'4 c'4 | d'8 e'8 f'8 g'8 e'4 | d'2. :|"
    }
  };

  // ============================================================
  // NOTEN LEZEN: noten, maatstrepen en het eind van elk deel (voor de cadensen)
  // ============================================================
  const STAM = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, h: 11, b: 10 };
  function lees(tekst) {
    const delen = tekst.replace(/\//g, ' ').split(/\s+/).filter(Boolean);
    const uit = [];
    let herhaalVanaf = 0, volta1 = null;
    for (const t of delen) {
      if (t === '|:') { uit.push({ streep: true }); herhaalVanaf = uit.length; continue; }
      if (t === ':|') {
        uit.push({ streep: true, einde: true });
        if (volta1 !== null) { uit.push(...uit.slice(herhaalVanaf, volta1)); volta1 = null; }
        else uit.push(...uit.slice(herhaalVanaf));
        herhaalVanaf = uit.length;
        continue;
      }
      if (t === '|') { uit.push({ streep: true }); continue; }
      if (t === '||') { uit.push({ streep: true, einde: true }); continue; }
      if (t === '[1') { volta1 = uit.length; continue; }
      const m = t.match(/^\(?([a-hr])(is|es|s)?('*)(\d+)(\.?)(~?)\)?$/);
      if (!m) continue;
      const duur = (4 / Number(m[4])) * (m[5] ? 1.5 : 1);
      if (m[1] === 'r') { uit.push({ midi: null, duur, bind: false }); continue; }
      const toon = STAM[m[1]] + (m[2] === 'is' ? 1 : m[2] ? -1 : 0);
      uit.push({ midi: 48 + 12 * m[3].length + toon, duur, bind: !!m[6] });
    }
    const noten = [], strepen = [];
    let tel = 0;
    for (const n of uit) {
      if (n.streep) {
        const vorige = strepen[strepen.length - 1];
        if (vorige && Math.abs(vorige.t - tel) < 1e-6) vorige.einde = vorige.einde || !!n.einde;
        else strepen.push({ t: tel, einde: !!n.einde });
        continue;
      }
      const laatste = noten[noten.length - 1];
      if (laatste && laatste.bind && laatste.midi === n.midi) { laatste.duur += n.duur; laatste.bind = n.bind; }
      else noten.push({ midi: n.midi, duur: n.duur, bind: n.bind, begin: tel });
      tel += n.duur;
    }
    if (!strepen.length || strepen[strepen.length - 1].t < tel - 1e-6) strepen.push({ t: tel, einde: true });
    else strepen[strepen.length - 1].einde = true;
    return { noten, strepen, lengte: tel };
  }

  // ============================================================
  // DE BEGELEIDING BEDENKEN (zoals een continuospeler)
  // ============================================================
  const MAJEUR = [
    { naam: 'I', fn: 'T', tonen: [0, 4, 7] }, { naam: 'ii', fn: 'S2', tonen: [2, 5, 9] }, { naam: 'iii', fn: 'M', tonen: [4, 7, 11] },
    { naam: 'IV', fn: 'S', tonen: [5, 9, 0] }, { naam: 'V', fn: 'D', tonen: [7, 11, 2] }, { naam: 'vi', fn: 'Tp', tonen: [9, 0, 4] },
    { naam: 'V/V', fn: 'DD', tonen: [2, 6, 9] }
  ];
  const MINEUR = [
    { naam: 'i', fn: 'T', tonen: [0, 3, 7] }, { naam: 'III', fn: 'M', tonen: [3, 7, 10] }, { naam: 'iv', fn: 'S', tonen: [5, 8, 0] },
    { naam: 'IV', fn: 'S', tonen: [5, 9, 0] }, { naam: 'V', fn: 'D', tonen: [7, 11, 2] }, { naam: 'v', fn: 'D', tonen: [7, 10, 2] },
    { naam: 'VI', fn: 'Tp', tonen: [8, 0, 3] }, { naam: 'VII', fn: 'DT', tonen: [10, 2, 5] }
  ];
  const VOORKEUR = { T: 0.3, D: 0.2, S: 0.15, Tp: 0.08, S2: 0.05, M: -0.3, DD: -0.15, DT: 0 };
  const OVERGANG = {
    'T>S': 0.3, 'T>D': 0.3, 'T>Tp': 0.2, 'T>S2': 0.15, 'S2>D': 0.45, 'S>D': 0.4, 'S>T': 0.2, 'S>S2': 0.1, 'D>T': 0.55,
    'D>Tp': 0.2, 'Tp>S2': 0.3, 'Tp>S': 0.3, 'Tp>D': 0.1, 'M>Tp': 0.25, 'M>S': 0.15, 'DD>D': 0.55, 'T>DD': 0.1, 'S>DD': 0.1,
    'Tp>DD': 0.15, 'DT>M': 0.35, 'DT>T': 0.2, 'M>DT': 0.1, 'T>DT': 0.1, 'D>S': -0.35, 'D>S2': -0.3, 'S2>T': -0.1, 'S>M': -0.2,
    'DD>T': -0.3, 'DD>S': -0.3, 'D>DD': -0.2
  };
  function harmoniseer(stuk) {
    const akk = stuk.mineur ? MINEUR : MAJEUR;
    // de stukken: halve maten in 4/4, hele maten in 3/4 (en de opmaat apart)
    const grenzen = [0].concat(stuk.strepen.map((s) => s.t)).filter((t, i, l) => i === 0 || t > l[i - 1] + 1e-6);
    const eindes = new Set(stuk.strepen.filter((s) => s.einde).map((s) => s.t.toFixed(3)));
    const segs = [];
    for (let i = 0; i < grenzen.length - 1; i++) {
      const a = grenzen[i], b = grenzen[i + 1];
      if (stuk.maat === 4 && b - a > 3.5) { segs.push({ a, b: a + 2 }); segs.push({ a: a + 2, b, einde: eindes.has(b.toFixed(3)) }); }
      else segs.push({ a, b, einde: eindes.has(b.toFixed(3)) });
    }
    // hoe goed past elk akkoord bij de melodietonen in dit stuk?
    const passend = segs.map((s) => akk.map((ak) => {
      let sc = VOORKEUR[ak.fn] || 0;
      stuk.noten.forEach((n) => {
        if (n.midi === null) return;
        const lo = Math.max(s.a, n.begin), hi = Math.min(s.b, n.begin + n.duur);
        if (hi <= lo + 1e-6) return;
        const pc = ((n.midi - stuk.grond) % 12 + 12) % 12;
        const opTel = Math.abs(n.begin - s.a) < 1e-6 ? 1.6 : Math.abs(n.begin - Math.round(n.begin)) < 1e-6 ? 1 : 0.55;
        const w = (hi - lo) * opTel;
        sc += ak.tonen.includes(pc) ? (pc === ak.tonen[0] ? 1.1 : 1) * w : -0.8 * w;
      });
      return sc;
    }));
    segs.forEach((s, i) => {
      if (s.einde) akk.forEach((ak, j) => { passend[i][j] += ak.fn === 'T' ? 3 : -1; });
      if (segs[i + 1] && segs[i + 1].einde) akk.forEach((ak, j) => { if (ak.fn === 'D') passend[i][j] += 1.2; });
      if (i === 0 || (i === 1 && segs[0].b - segs[0].a < stuk.maat - 0.01)) akk.forEach((ak, j) => { if (ak.fn === 'T') passend[i][j] += 1.2; });
    });
    // de beste reeks akkoorden (Viterbi)
    const n = segs.length, m = akk.length;
    const best = passend.map((r) => r.slice()), terug = segs.map(() => new Array(m).fill(0));
    for (let i = 1; i < n; i++) {
      for (let j = 0; j < m; j++) {
        let b = -Infinity, bk = 0;
        for (let k = 0; k < m; k++) {
          const sleutel = akk[k].fn + '>' + akk[j].fn;
          const ov = k === j ? 0.12 : (OVERGANG[sleutel] || 0);
          const v = best[i - 1][k] + ov;
          if (v > b) { b = v; bk = k; }
        }
        best[i][j] += b; terug[i][j] = bk;
      }
    }
    let j = best[n - 1].indexOf(Math.max(...best[n - 1]));
    const keuze = new Array(n);
    for (let i = n - 1; i >= 0; i--) { keuze[i] = j; j = terug[i][j]; }
    return segs.map((s, i) => ({ a: s.a, b: s.b, einde: !!s.einde, akkoord: akk[keuze[i]] }));
  }

  // een baslijn die vloeiend loopt, en akkoorden die zo min mogelijk verspringen
  function kiesBas(pc, vorige, lo, hi) {
    let best = null;
    for (let m = lo; m <= hi; m++) if (((m % 12) + 12) % 12 === pc && (best === null || Math.abs(m - vorige) < Math.abs(best - vorige))) best = m;
    return best === null ? lo + pc : best;
  }
  function kiesLigging(pcs, vorige, lo, hi) {
    let best = null, bestAfstand = Infinity;
    for (let basis = lo; basis <= hi; basis++) {
      if (((basis % 12) + 12) % 12 !== pcs[0] && ((basis % 12) + 12) % 12 !== pcs[1] && ((basis % 12) + 12) % 12 !== pcs[2]) continue;
      const ligging = [basis];
      for (let k = 1; k < 3; k++) {
        let x = ligging[k - 1] + 1;
        while (!pcs.includes(((x % 12) + 12) % 12) || ligging.some((y) => (y % 12) === (x % 12))) x++;
        ligging.push(x);
      }
      if (ligging[2] > hi + 2) continue;
      const afstand = vorige ? ligging.reduce((s, x, k) => s + Math.abs(x - vorige[k]), 0) : Math.abs(ligging[1] - (lo + hi) / 2);
      if (afstand < bestAfstand) { bestAfstand = afstand; best = ligging; }
    }
    return best || pcs.map((p) => lo + p);
  }

  // ============================================================
  // HET ARRANGEMENT: alle gebeurtenissen van één ronde, in tellen
  // ============================================================
  function arrangeer(stuk) {
    const akkoorden = harmoniseer(stuk);
    const ev = [];
    const g = stuk.grond, tr = stuk.transpositie || 0;
    let bas = 43 + g, ligging = null;
    const eindes = stuk.strepen.filter((s) => s.einde).map((s) => s.t);
    const toonladder = stuk.mineur ? [0, 2, 3, 5, 7, 8, 10, 11] : [0, 2, 4, 5, 7, 9, 11];
    const bovenBuur = (midi) => { for (let s = 1; s <= 2; s++) if (toonladder.includes((((midi + s - g) % 12) + 12) % 12)) return midi + s; return midi + 2; };
    // de melodie, met nadruk op de tel en een triller vlak voor het slot
    stuk.noten.forEach((n, i) => {
      if (n.midi === null) return;
      const inMaat = (() => { let laatst = 0; stuk.strepen.forEach((s) => { if (s.t <= n.begin + 1e-6) laatst = s.t; }); return n.begin - laatst; })();
      const nadruk = Math.abs(inMaat) < 1e-6 ? 1 : Math.abs(inMaat - Math.round(inMaat)) < 1e-6 ? (stuk.maat === 4 && Math.abs(inMaat - 2) < 1e-6 ? 0.92 : 0.86) : 0.76;
      const volgende = stuk.noten[i + 1];
      const slot = volgende && eindes.some((e) => Math.abs(volgende.begin + volgende.duur - e) < 1e-6);
      const legato = volgende && volgende.midi !== null && Math.abs(volgende.midi - n.midi) <= 2 && n.duur <= 0.5;
      if (slot && n.duur >= 0.99 && stuk.melodie === 'blokfluit') {
        const boven = bovenBuur(n.midi), stap = 0.125, triller = Math.min(n.duur * 0.6, 1);
        for (let t = 0, k = 0; t < triller - 1e-6; t += stap, k++) ev.push({ t: n.begin + t, inst: 'melodie', midi: (k % 2 ? n.midi : boven) + tr, duur: stap, vol: 0.85, legato: true });
        ev.push({ t: n.begin + triller, inst: 'melodie', midi: n.midi + tr, duur: n.duur - triller, vol: 0.9, legato: true });
      } else ev.push({ t: n.begin, inst: 'melodie', midi: n.midi + tr, duur: n.duur, vol: nadruk, legato });
    });
    // de begeleiding per akkoord
    akkoorden.forEach((s) => {
      const pcs = s.akkoord.tonen.map((p) => (p + g) % 12);
      const lengte = s.b - s.a;
      bas = kiesBas(pcs[0], bas, 36, 50);
      ligging = kiesLigging(pcs, ligging, 52, 63);
      const zacht = s.einde ? 0.85 : 1;
      if (stuk.stijl === 'arpeggio') {
        ev.push({ t: s.a, inst: 'bas', midi: bas, duur: lengte, vol: 0.9 });
        if (lengte >= 1.99) [0, 1, 2, 1].forEach((k, x) => ev.push({ t: s.a + x * 0.5, inst: 'begeleiding', midi: ligging[k], duur: 1.2, vol: (x ? 0.8 : 1.04) * zacht }));
        else ev.push({ t: s.a, inst: 'begeleiding', midi: ligging[1], duur: lengte, vol: 0.6 });
      } else if (stuk.stijl === 'dans') {
        ev.push({ t: s.a, inst: 'begeleiding', midi: bas, duur: 0.9, vol: 0.95 });
        if (lengte >= 1.99) ligging.forEach((m, k) => ev.push({ t: s.a + 1 + k * 0.03, inst: 'begeleiding', midi: m, duur: 0.6, vol: 0.62 }));
        if (s.einde) ligging.forEach((m, k) => ev.push({ t: s.a + k * 0.04, inst: 'begeleiding', midi: m, duur: lengte, vol: 0.66 }));
      } else if (stuk.stijl === 'klavier') {
        ev.push({ t: s.a, inst: 'begeleiding', midi: bas, duur: Math.min(lengte, 1.9), vol: 1.05 });
        ev.push({ t: s.a, inst: 'begeleiding', midi: bas - 12, duur: Math.min(lengte, 1.9), vol: 0.8 });
        if (lengte >= 1.99) [0.5, 1.5].forEach((o) => ligging.forEach((m, k) => ev.push({ t: s.a + o + k * 0.012, inst: 'begeleiding', midi: m, duur: 0.42, vol: 0.5 })));
        else ligging.forEach((m, k) => ev.push({ t: s.a + k * 0.02, inst: 'begeleiding', midi: m, duur: lengte, vol: 0.55 }));
      } else if (stuk.stijl === 'menuet') {
        ev.push({ t: s.a, inst: 'bas', midi: bas, duur: lengte, vol: 0.6 });
        if (lengte >= 2.99) [1, 2].forEach((o) => ligging.forEach((m, k) => ev.push({ t: s.a + o + k * 0.025, inst: 'begeleiding', midi: m, duur: 0.9, vol: 0.52 })));
        else ligging.forEach((m, k) => ev.push({ t: s.a + k * 0.03, inst: 'begeleiding', midi: m, duur: lengte, vol: 0.5 }));
      }
    });
    // de tabortrommel bij de dans: lang, kort-kort
    if (stuk.trom) {
      for (let maat = 0; maat < stuk.lengte - 0.01; maat += 4) {
        [[0, 'sterk'], [1, ''], [1.5, 'zacht'], [2, 'sterk'], [3, ''], [3.5, 'zacht']].forEach(([o, s]) => {
          if (maat + o < stuk.lengte - 0.01) ev.push({ t: maat + o, inst: 'trom', sterk: s });
        });
      }
    }
    ev.sort((a, b) => a.t - b.t);
    // iets vertragen naar het eind van elk deel: een tempokaart (tel naar seconden)
    const spb = 60 / stuk.tempo;
    const stukjes = [];
    let vorig = 0;
    eindes.forEach((e) => {
      const r = Math.max(vorig, e - 2);
      if (r > vorig) stukjes.push([vorig, r, 1]);
      stukjes.push([r, e, 1.09]);
      vorig = e;
    });
    if (vorig < stuk.lengte) stukjes.push([vorig, stuk.lengte, 1]);
    const tijd = (tel) => {
      let s = 0;
      for (const [a, b, f] of stukjes) {
        if (tel <= a) break;
        s += (Math.min(tel, b) - a) * f * spb;
      }
      return s;
    };
    return { ev, tijd, lengte: tijd(stuk.lengte), akkoorden };
  }

  Object.values(STUKKEN).forEach((s) => { Object.assign(s, lees(s.noten)); s.arr = arrangeer(s); });

  // ============================================================
  // INSTRUMENTEN
  // ============================================================
  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const GAMBA = new WeakMap();
  function gambaGolf(c) {
    let w = GAMBA.get(c);
    if (w) return w;
    const n = 16, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = Math.pow(k, -0.95) * (k % 2 ? 1 : 0.82);
    w = c.createPeriodicWave(re, im);
    GAMBA.set(c, w);
    return w;
  }
  // de viola da gamba: een gestreken baslijn, met een strijkstok die aanzet
  function gamba(c, uit, f, t, duur, vol, pan) {
    const k = window.Klank.ketting(c);
    const lengte = Math.max(0.15, duur * 0.97);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.07);
    g.gain.setTargetAtTime(vol * 0.78, t + 0.07, 0.25);
    g.gain.setValueAtTime(vol * 0.78, t + lengte);
    g.gain.linearRampToValueAtTime(0.0001, t + lengte + 0.14);
    let naar = uit;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(uit); naar = p; }
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.5;
    const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 620; pk.Q.value = 1.2; pk.gain.value = 4;
    g.connect(lp); lp.connect(pk); pk.connect(naar);
    const o = c.createOscillator(); o.setPeriodicWave(gambaGolf(c)); o.frequency.value = f;
    if (lengte > 0.8) {
      const lfo = c.createOscillator(); lfo.frequency.value = 4.8;
      const diep = c.createGain(); diep.gain.setValueAtTime(0, t); diep.gain.linearRampToValueAtTime(7, t + 0.6);
      lfo.connect(diep); diep.connect(o.detune); lfo.start(t); lfo.stop(t + lengte + 0.2);
    }
    o.connect(g); o.start(t); o.stop(t + lengte + 0.2);
    const r = c.createBufferSource(); r.buffer = k.ruis; r.loop = true;
    const rb = c.createBiquadFilter(); rb.type = 'bandpass'; rb.frequency.value = 1900; rb.Q.value = 0.8;
    const rg = c.createGain(); rg.gain.value = 0.05;
    r.connect(rb); rb.connect(rg); rg.connect(g);
    r.start(t, Math.random() * 1.5); r.stop(t + lengte + 0.2);
  }
  // de tabor: een trommeltje met een snaar over het vel
  function tabor(c, uit, t, sterk) {
    const k = window.Klank.ketting(c);
    const v = sterk === 'sterk' ? 1 : sterk === 'zacht' ? 0.45 : 0.7;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(175, t); o.frequency.exponentialRampToValueAtTime(108, t + 0.06);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.42 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    let naar = uit;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = 0.12; p.connect(uit); naar = p; }
    o.connect(g); g.connect(naar); o.start(t); o.stop(t + 0.3);
    const r = c.createBufferSource(); r.buffer = k.ruis;
    const rb = c.createBiquadFilter(); rb.type = 'bandpass'; rb.frequency.value = 2700; rb.Q.value = 0.9;
    const rg = c.createGain(); rg.gain.setValueAtTime(0, t); rg.gain.linearRampToValueAtTime(0.16 * v, t + 0.002); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    r.connect(rb); rb.connect(rg); rg.connect(naar);
    r.start(t, Math.random() * 1.5, 0.2);
  }

  // speel één gebeurtenis
  function speel(c, uit, stuk, e, t, sec) {
    const K = window.Klank;
    const mens = 1 + (Math.random() - 0.5) * 0.1;
    if (e.inst === 'melodie') {
      if (stuk.melodie === 'blokfluit') K.blokfluit(c, uit, freq(e.midi), t, sec, 0.32 * e.vol * mens, -0.16, { legato: e.legato });
      else K.tokkel(c, uit, stuk.melodie, e.midi, t, (stuk.melodie === 'luit' ? 0.5 : 0.42) * e.vol * mens, stuk.melodie === 'klavecimbel' ? sec * 0.96 : 0, -0.12);
    } else if (e.inst === 'begeleiding') {
      const soort = stuk.stijl === 'klavier' ? 'klavecimbel' : 'luit';
      K.tokkel(c, uit, soort, e.midi, t, (soort === 'luit' ? 0.3 : 0.24) * e.vol * mens, soort === 'klavecimbel' ? sec : 0, soort === 'luit' ? 0.24 : 0.1);
    } else if (e.inst === 'bas') gamba(c, uit, freq(e.midi), t, sec, 0.2 * e.vol * mens, 0.18);
    else if (e.inst === 'trom') tabor(c, uit, t, e.sterk);
  }

  // ============================================================
  // AFSPELEN
  // ============================================================
  let ctx = null, hoofd = null;
  let aan = false;
  try { aan = localStorage.getItem('speelhuys.muziek') === 'aan'; } catch (e) { /* geen opslag */ }

  function maakContext() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => { /* */ }); return ctx; }
    ctx = window.Klank ? window.Klank.maak() : null;
    if (!ctx) return null;
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* */ });
    hoofd = ctx.createGain(); hoofd.gain.value = 0.62;
    hoofd.connect(window.Klank.ketting(ctx).muziek);
    return ctx;
  }

  let huidigStuk = null, gewenst = 'thuis', speelt = null, klok = 0;
  const VOORUIT = 0.4, PAUZE = 1.6; // seconden vooruit plannen, seconden stilte tussen herhalingen

  function begin(naam) {
    const stuk = STUKKEN[naam];
    if (!stuk || !maakContext()) return;
    const uitgang = ctx.createGain();
    uitgang.gain.setValueAtTime(0.0001, ctx.currentTime);
    uitgang.gain.exponentialRampToValueAtTime(stuk.niveau || 1, ctx.currentTime + 0.8);
    uitgang.connect(hoofd);
    speelt = { naam, stuk, uitgang, index: 0, ronde: 0, start: ctx.currentTime + 0.15 };
    huidigStuk = naam;
    toonTitel();
    clearInterval(klok);
    klok = setInterval(plan, 60);
    plan();
  }

  function plan() {
    if (!speelt) return;
    const s = speelt, stuk = s.stuk, arr = stuk.arr;
    const horizon = ctx.currentTime + VOORUIT, ronde = arr.lengte + PAUZE;
    for (let veilig = 0; veilig < 400; veilig++) {
      const rondeBegin = s.start + s.ronde * ronde;
      if (s.index >= arr.ev.length) {
        if (rondeBegin + ronde > horizon) break;
        s.index = 0; s.ronde++;
        continue;
      }
      const e = arr.ev[s.index];
      const t = rondeBegin + arr.tijd(e.t) + (Math.random() - 0.5) * (e.inst === 'melodie' ? 0.012 : 0.02);
      if (t > horizon) break;
      if (t > ctx.currentTime - 0.05) speel(ctx, s.uitgang, stuk, e, Math.max(t, ctx.currentTime), arr.tijd(e.t + (e.duur || 0)) - arr.tijd(e.t));
      s.index++;
    }
  }

  function stopHuidig(snel) {
    if (!speelt) return;
    const g = speelt.uitgang;
    const nu = ctx.currentTime;
    g.gain.cancelScheduledValues(nu);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), nu);
    g.gain.exponentialRampToValueAtTime(0.0001, nu + (snel ? 0.15 : 0.7));
    setTimeout(() => g.disconnect(), 1200);
    speelt = null; huidigStuk = null;
    clearInterval(klok);
    toonTitel();
  }

  // ---------- Bediening ----------
  const knop = document.getElementById('knop-muziek');
  const titelVak = document.getElementById('nu-speelt');

  function toonTitel() {
    if (!titelVak) return;
    if (speelt) { titelVak.textContent = speelt.stuk.titel; titelVak.title = speelt.stuk.bron; titelVak.hidden = false; }
    else { titelVak.textContent = ''; titelVak.hidden = true; }
  }
  function knopTekst() {
    if (!knop) return;
    knop.setAttribute('aria-pressed', String(aan));
    knop.title = aan ? 'Muziek uitzetten' : 'Muziek aanzetten';
  }

  function zet(waarde) {
    aan = waarde;
    try { localStorage.setItem('speelhuys.muziek', aan ? 'aan' : 'uit'); } catch (e) { /* */ }
    knopTekst();
    if (aan) { if (window.Klank) window.Klank.ontgrendel(); begin(gewenst); } else stopHuidig();
  }

  if (knop) knop.addEventListener('click', () => zet(!aan));
  knopTekst();

  // Browsers spelen pas geluid na een klik: stond de muziek de vorige keer aan, dan start hij bij de eerste klik.
  function eersteGebaar() {
    ['touchend', 'pointerup', 'keydown'].forEach((t) => window.removeEventListener(t, eersteGebaar, true));
    if (aan && !speelt) begin(gewenst);
  }
  ['touchend', 'pointerup', 'keydown'].forEach((t) => window.addEventListener(t, eersteGebaar, true));

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (speelt) { const naam = speelt.naam; stopHuidig(true); gewenst = naam; } }
    else if (aan && !speelt) begin(gewenst);
  });

  window.Muziek = {
    stukken: STUKKEN,
    get speelt() { return speelt ? speelt.naam : null; },
    get aan() { return aan; },
    kies(naam) {
      const doel = STUKKEN[naam] ? naam : 'thuis';
      gewenst = doel;
      if (!aan || !ctx) return;
      if (huidigStuk === doel) return;
      stopHuidig();
      setTimeout(() => { if (aan && gewenst === doel && !speelt) begin(doel); }, 500);
    },
    // (voor de tests) een stuk opnemen in plaats van afspelen
    _render(naam, seconden) {
      const stuk = STUKKEN[naam];
      return window.Klank.render(seconden, (oc, k) => {
        const h = oc.createGain(); h.gain.value = 0.62 * (stuk.niveau || 1); h.connect(k.muziek);
        const arr = stuk.arr;
        for (let r = 0; r < 3; r++) {
          const begin = 0.1 + r * (arr.lengte + PAUZE);
          if (begin > seconden) break;
          arr.ev.forEach((e) => { const t = begin + arr.tijd(e.t); if (t < seconden) speel(oc, h, stuk, e, t, arr.tijd(e.t + (e.duur || 0)) - arr.tijd(e.t)); });
        }
      });
    }
  };
})();
