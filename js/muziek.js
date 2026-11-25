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
  // De kermiswals: een eigen melodie in de trant van de oude kermiswalsen, voor het draaiorgel. Lange tonen met
  // een chromatisch buurtje (e-dis-e, d-cis-d, a-gis-a), A-B-A. De akkoorden staan per maat in 'maten';
  // het orgel speelt ze als hoempa: de bas op de één, het akkoord op twee en drie.
  const KERMIS_A = "e''2. | e''4 dis''4 e''4 | g''2. | f''4 e''4 d''4 | d''2. | d''4 cis''4 d''4 | f''2. | e''4 d''4 c''4 | " +
    "a''2. | a''4 gis''4 a''4 | c'''2. | h''4 a''4 g''4 | g''2. | e''4 f''4 g''4 | f''4 e''4 d''4 | c''2 g'4 | ";
  const KERMIS_B = "d''4 h'4 d''4 | g''2. | fis''4 e''4 fis''4 | a''2. | a''4 g''4 fis''4 | g''4 a''4 h''4 | c'''4 h''4 a''4 | g''2. | " +
    "e''4 dis''4 e''4 | c'''2. | h''4 a''4 g''4 | d''2. | f''4 e''4 d''4 | g''2. | g''4 f''4 e''4 | d''2 g'4 | ";
  const KERMIS_AKK_A = 'C C C G7 G7 G7 G7 C F F F G7 C C G7 C ';
  const KERMIS_AKK_B = 'G G D7 D7 D7 G D7 G C C G G G7 G7 G7 G7 ';

  const STUKKEN = {
    kermis: {
      titel: 'Kermiswals',
      bron: 'Op het draaiorgel: een eigen wals in de trant van de oude kermiswalsen',
      melodie: 'orgel', stijl: 'orgel', tempo: 168, transpositie: 0, maat: 3, grond: 0, mineur: false, niveau: 0.5,
      noten: KERMIS_A + KERMIS_B + KERMIS_A + '||',
      maten: KERMIS_AKK_A + KERMIS_AKK_B + KERMIS_AKK_A,
      // de registers per ronde: vioolpijpen, fluiten met klokkenspel, viool met klokkenspel, en het volle orgel
      ronden: [
        { reg: 'viool', naam: '', pauze: 0.35 },
        { reg: 'fluit', klok: true, naam: 'met klokkenspel', pauze: 0.35 },
        { reg: 'viool', klok: true, naam: 'met klokkenspel', pauze: 0.35 },
        { reg: 'vol', klok: true, bekken: true, naam: 'vol orgel', pauze: 1.6 }
      ]
    },
    thuis: {
      titel: 'Engels Nachtegaeltje',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      melodie: 'blokfluit', stijl: 'arpeggio', tempo: 74, transpositie: 0, maat: 4, grond: 0, mineur: false, niveau: 0.52, wissel: 3.2,
      noten: "|: e''4. d''16 e''16 c''4 g''8. f''16 | e''2. , c''8 d''8 | e''4 c''4 e''4 fis''4 | g''2. , e''8 f''8 | " +
             "g''4 g''8 a''8 g''4 e''8 f''8 | g''8 f''8 g''8 a''8 g''4 e''8 f''8 | g''4 e''4 f''4 g''4 | a''4 , a'4 a'4. h'8 | " +
             "c''8 d''8 e''8 f''8 g''4 c''4 | h'8. c''16 d''4 g'4 g''4 | e''8. f''16 g''8 e''8 d''4. c''8 | c''2. :| " +
             "|: f''8. g''16 | a''4 f''4 f''4. g''8 | a''8 f''8 a''8 f''8 a''8 f''8 a''8 f''8 | a''8 f''8 a''8 f''8 e''4 fis''4 | g''1 | " +
             "g''1 , | g''8 g''8 g''8 g''8 g''2 | g''8 g''8 g''8 g''8 g''8 g''8 g''4 | e''8. f''16 g''8 e''8 d''4. c''8 | [1 c''2. :| [2 c''1 ||"
    },
    ganzenbord: {
      titel: 'Malle Symen',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      melodie: 'blokfluit', stijl: 'dans', tempo: 100, transpositie: 0, maat: 4, grond: 2, mineur: true, trom: true, niveau: 0.5, wissel: 3.6,
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
      melodie: 'klavecimbel', stijl: 'klavier', tempo: 90, transpositie: 0, maat: 4, grond: 0, mineur: false, niveau: 1.8, wissel: 0.17,
      noten: "|: g'2 c''2 | e'4. f'8 g'2 | c''4 g'4 a'4 g'4 | e'8 f'8 g'4 e''2 , | " +
             "g'4. a'8 h'8 c''8 d''4 | f'4. g'8 a'8 h'8 c''4 | e'2 d'2 | c'1 :| " +
             "|: g'4 g'4 a'8 h'8 c''4 | c''4 h'4 c''2 , | d''8 e''8 f''8 d''8 e''4 e''4 | d''8 e''8 f''8 d''8 e''8. f''16 g''4 , | " +
             "g'4. a'8 h'8 c''8 d''4 | f'4. g'8 a'8 h'8 c''4 | e'2 d'2 | c'1 :|"
    },
    molenspel: {
      titel: "Doen Daphne d'over schoone Maeght",
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      melodie: 'luit', stijl: 'menuet', tempo: 96, transpositie: 0, maat: 3, grond: 2, mineur: true, niveau: 1, wissel: 0.33,
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
  // VERSIEREN: de 'modi' van Van Eyck. Hij speelde eerst het thema en daarna variaties waarin de noten
  // werden opgedeeld in steeds snellere loopjes: doorgangsnoten, wisselnoten en omspelingen, in de toonsoort
  // en passend bij het akkoord eronder (bij de dominant in mineur dus met de verhoogde leidtoon).
  // ============================================================
  function ladderVoor(stuk, akkoord) {
    const l = stuk.mineur ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    akkoord.tonen.forEach((pc) => {
      if (l.includes(pc)) return;
      let i = l.indexOf((pc + 11) % 12);
      if (i < 0) i = l.indexOf((pc + 1) % 12);
      if (i >= 0) l[i] = pc;
    });
    return l;
  }
  // k noten die op x beginnen en naar het doel lopen (zonder het doel zelf)
  function figuur(x, doel, k, st) {
    const r = doel > x ? 1 : doel < x ? -1 : 0;
    const tussen = [];
    if (r) { let y = st(x, r); while ((r > 0 ? y < doel : y > doel) && tussen.length < 14) { tussen.push(y); y = st(y, r); } }
    // past de hele toonladder er niet in, dan springt het loopje eerst en loopt het stap voor stap naar het doel
    const loop = tussen.length > k - 1 ? tussen.slice(tussen.length - (k - 1)) : tussen;
    const kant = r === 0 ? 1 : -r;
    const om = [st(x, kant), x, st(x, -kant), x];
    const lijn = [x];
    for (let i = 0; i < k - 1 - loop.length; i++) lijn.push(om[i % 4]);
    lijn.push(...loop);
    // nooit vlak voor het doel al op het doel uitkomen
    if (lijn.length > 1 && lijn[lijn.length - 1] === doel) lijn[lijn.length - 1] = st(doel, r || 1);
    return lijn.slice(0, k);
  }
  function versier(stuk, modo) {
    if (!modo) return stuk.noten;
    const g = stuk.grond;
    const eindes = stuk.strepen.filter((s) => s.einde).map((s) => s.t);
    const isEinde = (t) => eindes.some((e) => Math.abs(e - t) < 1e-6);
    const akkOp = (t) => stuk.akkoorden.find((s) => t >= s.a - 1e-6 && t < s.b - 1e-6) || stuk.akkoorden[stuk.akkoorden.length - 1];
    const uit = [];
    stuk.noten.forEach((n, i) => {
      const volg = stuk.noten[i + 1];
      if (n.midi === null || !volg || volg.midi === null) { uit.push(n); return; }
      // de slotnoot en de noot met de triller ervoor blijven zoals ze zijn
      const slot = isEinde(n.begin + n.duur);
      const voorSlot = isEinde(volg.begin + volg.duur) && volg.duur >= 0.99;
      let eenheid = 0;
      if (modo === 1) eenheid = n.duur >= 0.99 ? 0.5 : 0;
      else eenheid = n.duur > 1.01 ? 0.5 : n.duur >= 0.49 ? 0.25 : 0;
      const aantal = eenheid ? Math.round(n.duur / eenheid) : 0;
      if (slot || voorSlot || aantal < 2 || Math.abs(aantal * eenheid - n.duur) > 1e-6) { uit.push(n); return; }
      const lad = ladderVoor(stuk, akkOp(n.begin).akkoord).map((p) => (p + g) % 12);
      const op = (m) => lad.includes(((m % 12) + 12) % 12);
      const st = (m, r) => { let x = m + r; for (let v = 0; v < 3 && !op(x); v++) x += r; return x; };
      figuur(n.midi, volg.midi, aantal, st).forEach((m, k) => uit.push({ midi: m, duur: eenheid, begin: n.begin + k * eenheid, bind: false, versiering: k > 0 }));
    });
    return uit;
  }

  // ============================================================
  // HET ARRANGEMENT: alle gebeurtenissen van één ronde, in tellen.
  // De ronden: eerst het thema, dan twee modi, dan het thema nog eens op een ander instrument.
  // ============================================================
  const RONDEN = [{ modo: 0, pauze: 0.6 }, { modo: 1, pauze: 0.5 }, { modo: 2, pauze: 1.3 }, { modo: 0, wissel: true, pauze: 2.4 }];
  const WISSEL = { blokfluit: 'luit', luit: 'blokfluit', klavecimbel: 'blokfluit' };
  function arrangeer(stuk, ronde) {
    ronde = ronde || RONDEN[0];
    const akkoorden = stuk.akkoorden;
    const noten = versier(stuk, ronde.modo);
    const speler = ronde.wissel ? (WISSEL[stuk.melodie] || stuk.melodie) : stuk.melodie;
    // het stuk is afgesteld op zijn eigen melodie-instrument; voor het andere instrument staat bij elk stuk
    // hoeveel harder of zachter (gemeten, zie 'wissel')
    const wisselVol = ronde.wissel ? (stuk.wissel || 1) : 1;
    const ev = [];
    const g = stuk.grond, tr = stuk.transpositie || 0;
    let bas = 43 + g, ligging = null;
    const eindes = stuk.strepen.filter((s) => s.einde).map((s) => s.t);
    const toonladder = stuk.mineur ? [0, 2, 3, 5, 7, 8, 10, 11] : [0, 2, 4, 5, 7, 9, 11];
    const bovenBuur = (midi) => { for (let s = 1; s <= 2; s++) if (toonladder.includes((((midi + s - g) % 12) + 12) % 12)) return midi + s; return midi + 2; };
    // frasering: elke zin van twee maten zwelt aan en neemt weer af
    const eerste = stuk.strepen.length ? stuk.strepen[0].t : 0, zin = 2 * stuk.maat;
    const frase = (t) => { const p = ((((t - eerste) % zin) + zin) % zin) / zin; return 0.9 + 0.16 * Math.sin(Math.PI * p); };
    const rondeVol = ronde.modo === 2 ? 1.04 : ronde.wissel ? 0.96 : 1;
    // de melodie, met nadruk op de tel en een triller vlak voor het slot
    noten.forEach((n, i) => {
      if (n.midi === null) return;
      const inMaat = (() => { let laatst = 0; stuk.strepen.forEach((s) => { if (s.t <= n.begin + 1e-6) laatst = s.t; }); return n.begin - laatst; })();
      const nadruk = Math.abs(inMaat) < 1e-6 ? 1 : Math.abs(inMaat - Math.round(inMaat)) < 1e-6 ? (stuk.maat === 4 && Math.abs(inMaat - 2) < 1e-6 ? 0.92 : 0.86) : 0.76;
      const volgende = noten[i + 1];
      const slot = volgende && eindes.some((e) => Math.abs(volgende.begin + volgende.duur - e) < 1e-6);
      const legato = volgende && volgende.midi !== null && Math.abs(volgende.midi - n.midi) <= 2 && n.duur <= 0.5;
      const vol = nadruk * (n.versiering ? 0.84 : 1) * frase(n.begin) * rondeVol * wisselVol;
      if (slot && n.duur >= 0.99 && speler === 'blokfluit') {
        const boven = bovenBuur(n.midi), stap = 0.125, triller = Math.min(n.duur * 0.6, 1);
        for (let t = 0, k = 0; t < triller - 1e-6; t += stap, k++) ev.push({ t: n.begin + t, inst: 'melodie', speler, midi: (k % 2 ? n.midi : boven) + tr, duur: stap, vol: 0.85 * frase(n.begin) * wisselVol, legato: true });
        ev.push({ t: n.begin + triller, inst: 'melodie', speler, midi: n.midi + tr, duur: n.duur - triller, vol: 0.9 * frase(n.begin) * wisselVol, legato: true });
      } else ev.push({ t: n.begin, inst: 'melodie', speler, midi: n.midi + tr, duur: n.duur, vol, legato });
    });
    // de begeleiding per akkoord; in de snelle modo speelt de luit rustiger, zodat de loopjes te horen zijn
    akkoorden.forEach((s) => {
      const pcs = s.akkoord.tonen.map((p) => (p + g) % 12);
      const lengte = s.b - s.a;
      bas = kiesBas(pcs[0], bas, 36, 50);
      ligging = kiesLigging(pcs, ligging, 52, 63);
      const zacht = (s.einde ? 0.85 : 1) * frase(s.a);
      if (stuk.stijl === 'arpeggio') {
        ev.push({ t: s.a, inst: 'bas', midi: bas, duur: lengte, vol: 0.9 * frase(s.a) });
        if (lengte >= 1.99 && ronde.modo !== 2) [0, 1, 2, 1].forEach((k, x) => ev.push({ t: s.a + x * 0.5, inst: 'begeleiding', midi: ligging[k], duur: 1.2, vol: (x ? 0.8 : 1.04) * zacht }));
        else if (lengte >= 1.99) [0, 1].forEach((o) => ligging.forEach((m, k) => ev.push({ t: s.a + o + k * 0.035, inst: 'begeleiding', midi: m, duur: 0.9, vol: (o ? 0.6 : 0.78) * zacht })));
        else ev.push({ t: s.a, inst: 'begeleiding', midi: ligging[1], duur: lengte, vol: 0.6 * zacht });
      } else if (stuk.stijl === 'dans') {
        ev.push({ t: s.a, inst: 'begeleiding', midi: bas, duur: 0.9, vol: 0.95 * zacht });
        if (lengte >= 1.99) ligging.forEach((m, k) => ev.push({ t: s.a + 1 + k * 0.03, inst: 'begeleiding', midi: m, duur: 0.6, vol: 0.62 * zacht }));
        if (s.einde) ligging.forEach((m, k) => ev.push({ t: s.a + k * 0.04, inst: 'begeleiding', midi: m, duur: lengte, vol: 0.66 * zacht }));
      } else if (stuk.stijl === 'klavier') {
        ev.push({ t: s.a, inst: 'begeleiding', midi: bas, duur: Math.min(lengte, 1.9), vol: 1.05 * zacht });
        ev.push({ t: s.a, inst: 'begeleiding', midi: bas - 12, duur: Math.min(lengte, 1.9), vol: 0.8 * zacht });
        if (lengte >= 1.99) [0.5, 1.5].forEach((o) => ligging.forEach((m, k) => ev.push({ t: s.a + o + k * 0.012, inst: 'begeleiding', midi: m, duur: 0.42, vol: 0.5 * zacht })));
        else ligging.forEach((m, k) => ev.push({ t: s.a + k * 0.02, inst: 'begeleiding', midi: m, duur: lengte, vol: 0.55 * zacht }));
      } else if (stuk.stijl === 'menuet') {
        ev.push({ t: s.a, inst: 'bas', midi: bas, duur: lengte, vol: 0.6 * frase(s.a) });
        if (lengte >= 2.99) [1, 2].forEach((o) => ligging.forEach((m, k) => ev.push({ t: s.a + o + k * 0.025, inst: 'begeleiding', midi: m, duur: 0.9, vol: 0.52 * zacht })));
        else ligging.forEach((m, k) => ev.push({ t: s.a + k * 0.03, inst: 'begeleiding', midi: m, duur: lengte, vol: 0.5 * zacht }));
      }
    });
    // de tabortrommel bij de dans: lang, kort-kort (en in de snelle modo wat drukker)
    if (stuk.trom) {
      const slagen = ronde.modo === 2 ? [[0, 'sterk'], [0.5, 'zacht'], [1, ''], [1.5, 'zacht'], [2, 'sterk'], [2.5, 'zacht'], [3, ''], [3.5, 'zacht']]
        : [[0, 'sterk'], [1, ''], [1.5, 'zacht'], [2, 'sterk'], [3, ''], [3.5, 'zacht']];
      for (let maat = 0; maat < stuk.lengte - 0.01; maat += 4) {
        slagen.forEach(([o, s]) => { if (maat + o < stuk.lengte - 0.01) ev.push({ t: maat + o, inst: 'trom', sterk: s }); });
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

  // ============================================================
  // HET DRAAIORGEL: de melodie op de vioolpijpen (of de fluiten), het klokkenspel erbij, en hoempa:
  // de baspijp op de één, het akkoord kort op twee en drie. De grote trom op de één, de kleine trom zacht op
  // twee en drie, een roffeltje naar elk nieuw deel en in het volle orgel een bekken. Een orgel speelt strak
  // in de maat: geen vertraging naar het slot.
  // ============================================================
  const AKKOORD = { C: [0, 4, 7], F: [5, 9, 0], G: [7, 11, 2], G7: [7, 11, 2, 5], D7: [2, 6, 9, 0], Am: [9, 0, 4], C7: [0, 4, 7, 10] };
  function arrangeerOrgel(stuk, ronde) {
    const ev = [], maat = stuk.maat, lengte = stuk.lengte;
    const regs = ronde.reg === 'vol' ? [['viool', 1], ['fluit', 0.5]] : ronde.reg === 'fluit' ? [['fluit', 1]] : [['viool', 1], ['fluit', 0.36]];
    stuk.noten.forEach((n) => {
      if (n.midi === null) return;
      const opTel = Math.abs(n.begin / maat - Math.round(n.begin / maat)) < 1e-6;
      const vol = opTel ? 1 : 0.86;
      regs.forEach(([sp, v]) => ev.push({ t: n.begin, inst: 'orgel', speler: sp, midi: n.midi, duur: n.duur * 0.92, vol: vol * v }));
      if (ronde.klok && (opTel || n.duur >= 2)) ev.push({ t: n.begin, inst: 'klokje', midi: n.midi + 12, vol: (n.duur >= 2 ? 1 : 0.8) });
    });
    let vorige = null, kwint = false;
    stuk.maten.split(/\s+/).filter(Boolean).forEach((naam, i) => {
      const a = i * maat;
      if (a >= lengte - 1e-6) return;
      const pcs = AKKOORD[naam] || AKKOORD.C;
      kwint = naam === vorige ? !kwint : false; vorige = naam;
      ev.push({ t: a, inst: 'orgelbas', midi: 36 + (kwint ? pcs[2] : pcs[0]), duur: 0.75, vol: 1 });
      const van = pcs.length > 3 ? 1 : 0;
      const ligging = pcs.slice(van, van + 3).map((p) => 55 + ((p - 7 + 12) % 12)).sort((x, y) => x - y);
      [1, 2].forEach((o) => ligging.forEach((m, k) => ev.push({ t: a + o + k * 0.006, inst: 'pah', midi: m, duur: 0.42, vol: o === 1 ? 1 : 0.88 })));
      ev.push({ t: a, inst: 'grotetrom', vol: i % 4 === 0 ? 0.95 : 0.66 });
      ev.push({ t: a + 1, inst: 'kleinetrom', vol: 0.34 });
      ev.push({ t: a + 2, inst: 'kleinetrom', vol: 0.28 });
      if ((i + 1) % 16 === 0) [2.25, 2.5, 2.75].forEach((o, k) => ev.push({ t: a + o, inst: 'kleinetrom', vol: 0.3 + k * 0.1 }));
      if (ronde.bekken && i % 16 === 0) ev.push({ t: a, inst: 'bekken', vol: 1 });
    });
    ev.sort((x, y) => x.t - y.t);
    const spb = 60 / stuk.tempo;
    const tijd = (tel) => tel * spb;
    return { ev, tijd, lengte: tijd(lengte), akkoorden: [] };
  }

  Object.values(STUKKEN).forEach((s) => {
    Object.assign(s, lees(s.noten));
    if (s.stijl === 'orgel') {
      s.akkoorden = [];
      s.arrs = s.ronden.map((r) => arrangeerOrgel(s, r));
    } else {
      s.akkoorden = harmoniseer(s);
      s.arrs = RONDEN.map((r) => arrangeer(s, r));
    }
    s.arr = s.arrs[0];
  });
  // de ronden van een stuk: het orgel heeft zijn eigen registers, de andere stukken de modi
  const rondenVan = (stuk) => stuk.ronden || RONDEN;

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
  // de viola da gamba: een gestreken baslijn. De strijkstok zet aan (even ruwer en helderder), dan zingt de
  // snaar; twee tonen een fractie uit elkaar voor de klankkast, en formanten rond 260, 620 en 1300 Hz.
  function gamba(c, uit, f, t, duur, vol, pan) {
    const k = window.Klank.ketting(c);
    const lengte = Math.max(0.15, duur * 0.97);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol * 0.8, t + 0.045);
    g.gain.linearRampToValueAtTime(vol, t + 0.16);
    g.gain.setTargetAtTime(vol * 0.8, t + 0.16, 0.3);
    g.gain.setValueAtTime(vol * 0.8, t + lengte);
    g.gain.linearRampToValueAtTime(0.0001, t + lengte + 0.16);
    let naar = uit;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(uit); naar = p; }
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(2700, t); lp.frequency.exponentialRampToValueAtTime(1350, t + 0.28);
    let keten = lp;
    [[260, 1.4, 3], [620, 1.2, 4], [1300, 2, 2]].forEach(([ff, q, gg]) => { const b = c.createBiquadFilter(); b.type = 'peaking'; b.frequency.value = ff; b.Q.value = q; b.gain.value = gg; keten.connect(b); keten = b; });
    g.connect(lp); keten.connect(naar);
    const o = c.createOscillator(); o.setPeriodicWave(gambaGolf(c)); o.frequency.value = f;
    const o2 = c.createOscillator(); o2.setPeriodicWave(gambaGolf(c)); o2.frequency.value = f * 1.0024;
    const g2 = c.createGain(); g2.gain.value = 0.32;
    if (lengte > 0.8) {
      const lfo = c.createOscillator(); lfo.frequency.value = 4.6 + Math.random() * 0.5;
      const diep = c.createGain(); diep.gain.setValueAtTime(0, t); diep.gain.linearRampToValueAtTime(6, t + 0.7);
      lfo.connect(diep); diep.connect(o.detune); diep.connect(o2.detune); lfo.start(t); lfo.stop(t + lengte + 0.2);
    }
    o.connect(g); o2.connect(g2); g2.connect(g);
    o.start(t); o.stop(t + lengte + 0.2); o2.start(t); o2.stop(t + lengte + 0.2);
    // het strijken: ruis van de stok over de snaar, met een krasje bij de aanzet
    const r = c.createBufferSource(); r.buffer = k.ruis; r.loop = true;
    const rb = c.createBiquadFilter(); rb.type = 'bandpass'; rb.frequency.value = 1900; rb.Q.value = 0.8;
    const rg = c.createGain(); rg.gain.setValueAtTime(0.11, t); rg.gain.setTargetAtTime(0.045, t + 0.05, 0.08);
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

  // ---------- Het draaiorgel ----------
  // Pijpen in plaats van snaren: de fluitpijp is bijna zuiver en spreekt aan met een zuchtje wind; de vioolpijp is
  // smal en helder, in twee rijen een fractie uit elkaar (de zweving van het draaiorgel); de gedekte baspijp
  // (bourdon) heeft vooral oneven boventonen. Alle pijpen golven met de tremulant, zo'n zes keer per seconde.
  const ORGEL = new WeakMap();
  function orgelGolven(c) {
    let w = ORGEL.get(c);
    if (w) return w;
    const golf = (n, f) => { const re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = f(k); return c.createPeriodicWave(re, im); };
    w = {
      fluit: golf(8, (k) => [0, 1, 0.2, 0.09, 0.035, 0.015, 0.008, 0][k]),
      viool: golf(28, (k) => Math.pow(k, -1.08) * (k % 2 ? 1 : 0.78)),
      bourdon: golf(10, (k) => (k % 2 ? [0, 1, 0, 0.36, 0, 0.14, 0, 0.06, 0, 0.025][k] : 0.03 / k))
    };
    ORGEL.set(c, w);
    return w;
  }
  function pijp(c, uit, soort, f, t, duur, vol, pan) {
    const k = window.Klank.ketting(c), w = orgelGolven(c);
    const lengte = Math.max(0.06, duur), aan = soort === 'bourdon' ? 0.016 : 0.026, af = soort === 'bourdon' ? 0.06 : 0.05;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + aan);
    g.gain.setValueAtTime(vol, t + lengte);
    g.gain.linearRampToValueAtTime(0.0001, t + lengte + af);
    let naar = uit;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(uit); naar = p; }
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.value = soort === 'viool' ? 5200 : soort === 'bourdon' ? 1400 : 3800;
    g.connect(lp); lp.connect(naar);
    const trem = c.createGain(); trem.gain.value = 1;
    const lfo = c.createOscillator(); lfo.frequency.value = 6.1;
    const diep = c.createGain(); diep.gain.value = soort === 'bourdon' ? 0.04 : 0.16;
    lfo.connect(diep); diep.connect(trem.gain); trem.connect(g);
    const rijen = soort === 'viool' ? [[w.viool, 1, 0.62], [w.viool, 1.0042, 0.5]] : soort === 'bourdon' ? [[w.bourdon, 1, 1]] : [[w.fluit, 1, 0.9], [w.fluit, 0.9986, 0.25]];
    const eind = t + lengte + af + 0.05;
    rijen.forEach(([golf, r, v]) => {
      const o = c.createOscillator(); o.setPeriodicWave(golf); o.frequency.value = f * r;
      const gv = c.createGain(); gv.gain.value = v;
      o.connect(gv); gv.connect(trem); o.start(t); o.stop(eind);
    });
    lfo.start(t); lfo.stop(eind);
    if (soort !== 'viool') {
      const r = c.createBufferSource(); r.buffer = k.ruis;
      const rb = c.createBiquadFilter(); rb.type = 'bandpass'; rb.frequency.value = Math.min(9000, f * 3.2); rb.Q.value = 1.2;
      const rg = c.createGain(); rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(vol * 0.45, t + 0.006); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      r.connect(rb); rb.connect(rg); rg.connect(naar); r.start(t, Math.random() * 1.5, 0.1);
    }
  }
  // het klokkenspel: metalen staafjes, helder en lang uitklinkend, met de onzuivere boventonen van een staaf
  function klokje(c, uit, f, t, vol, pan) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    let naar = uit;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(uit); naar = p; }
    g.connect(naar);
    [[1, 1, 1.3], [2.76, 0.3, 0.3], [5.4, 0.12, 0.14]].forEach(([r, v, d]) => {
      const o = c.createOscillator(); o.frequency.value = f * r;
      const gv = c.createGain(); gv.gain.setValueAtTime(v, t); gv.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(gv); gv.connect(g); o.start(t); o.stop(t + 1.35);
    });
  }
  // de trommen van het orgel: de grote trom, de kleine trom en een bekken
  function grotetrom(c, uit, t, vol) {
    const k = window.Klank.ketting(c);
    const o = c.createOscillator(); o.frequency.setValueAtTime(92, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.14);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.8 * vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g); g.connect(uit); o.start(t); o.stop(t + 0.45);
    const r = c.createBufferSource(); r.buffer = k.ruis;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const rg = c.createGain(); rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.35 * vol, t + 0.003); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    r.connect(lp); lp.connect(rg); rg.connect(uit); r.start(t, Math.random(), 0.12);
  }
  function kleinetrom(c, uit, t, vol) {
    const k = window.Klank.ketting(c);
    let naar = uit;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = -0.15; p.connect(uit); naar = p; }
    const r = c.createBufferSource(); r.buffer = k.ruis;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3400; bp.Q.value = 0.7;
    const rg = c.createGain(); rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.32 * vol, t + 0.002); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    r.connect(bp); bp.connect(rg); rg.connect(naar); r.start(t, Math.random() * 1.5, 0.15);
    const o = c.createOscillator(); o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18 * vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(naar); o.start(t); o.stop(t + 0.09);
  }
  function bekken(c, uit, t, vol) {
    const k = window.Klank.ketting(c);
    let naar = uit;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = 0.28; p.connect(uit); naar = p; }
    const r = c.createBufferSource(); r.buffer = k.ruis; r.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200;
    const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 8200; pk.Q.value = 1.4; pk.gain.value = 6;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22 * vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    r.connect(hp); hp.connect(pk); pk.connect(g); g.connect(naar); r.start(t, Math.random() * 1.5); r.stop(t + 1.7);
  }

  // speel één gebeurtenis
  function speel(c, uit, stuk, e, t, sec) {
    const K = window.Klank;
    const mens = 1 + (Math.random() - 0.5) * 0.1;
    if (e.inst === 'melodie') {
      const sp = e.speler || stuk.melodie;
      if (sp === 'blokfluit') K.blokfluit(c, uit, freq(e.midi), t, sec, 0.32 * e.vol * mens, -0.16, { legato: e.legato });
      else K.tokkel(c, uit, sp, e.midi, t, (sp === 'luit' ? 0.5 : 0.42) * e.vol * mens, sp === 'klavecimbel' ? sec * 0.96 : 0, -0.12);
    } else if (e.inst === 'begeleiding') {
      const soort = stuk.stijl === 'klavier' ? 'klavecimbel' : stuk.stijl === 'dans' ? 'cister' : 'luit';
      K.tokkel(c, uit, soort, e.midi, t, ({ luit: 0.3, klavecimbel: 0.24, cister: 0.2 })[soort] * e.vol * mens, soort === 'klavecimbel' ? sec : 0, ({ luit: 0.24, klavecimbel: 0.1, cister: 0.3 })[soort]);
    } else if (e.inst === 'bas') gamba(c, uit, freq(e.midi), t, sec, 0.2 * e.vol * mens, 0.18);
    else if (e.inst === 'trom') tabor(c, uit, t, e.sterk);
    else if (e.inst === 'orgel') pijp(c, uit, e.speler, freq(e.midi), t, sec, (e.speler === 'viool' ? 0.15 : 0.17) * e.vol * mens, -0.08);
    else if (e.inst === 'pah') pijp(c, uit, 'fluit', freq(e.midi), t, sec, 0.06 * e.vol * mens, 0.14);
    else if (e.inst === 'orgelbas') pijp(c, uit, 'bourdon', freq(e.midi), t, sec, 0.3 * e.vol * mens, 0);
    else if (e.inst === 'klokje') klokje(c, uit, freq(e.midi), t, 0.085 * e.vol * mens, 0.24);
    else if (e.inst === 'grotetrom') grotetrom(c, uit, t, e.vol);
    else if (e.inst === 'kleinetrom') kleinetrom(c, uit, t, e.vol);
    else if (e.inst === 'bekken') bekken(c, uit, t, e.vol);
  }

  // ============================================================
  // AFSPELEN
  // ============================================================
  let ctx = null, hoofd = null;
  // de muziek staat aan, tenzij je hem zelf hebt uitgezet
  let aan = true;
  try { aan = localStorage.getItem('speelhuys.muziek') !== 'uit'; } catch (e) { /* geen opslag */ }

  function maakContext() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => { /* */ }); return ctx; }
    ctx = window.Klank ? window.Klank.maak() : null;
    if (!ctx) return null;
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* */ });
    hoofd = ctx.createGain(); hoofd.gain.value = 0.62;
    hoofd.connect(window.Klank.ketting(ctx).muziek);
    return ctx;
  }

  let huidigStuk = null, gewenst = 'thuis', gewenstVanaf = 0, speelt = null, klok = 0;
  const VOORUIT = 0.4; // seconden vooruit plannen
  const RONDE_NAAM = ['', '1e modo', '2e modo', ''];

  function begin(naam, vanaf) {
    const stuk = STUKKEN[naam];
    if (!stuk || !maakContext()) return;
    const uitgang = ctx.createGain();
    uitgang.gain.setValueAtTime(0.0001, ctx.currentTime);
    uitgang.gain.exponentialRampToValueAtTime(stuk.niveau || 1, ctx.currentTime + 0.8);
    uitgang.connect(hoofd);
    speelt = { naam, stuk, uitgang, index: 0, ronde: 0, vanaf: vanaf || 0, rondeBegin: ctx.currentTime + 0.15 };
    huidigStuk = naam;
    toonTitel();
    clearInterval(klok);
    klok = setInterval(plan, 60);
    plan();
  }
  const rondeNr = (s) => (s.ronde + s.vanaf) % rondenVan(s.stuk).length;

  function plan() {
    if (!speelt) return;
    const s = speelt, stuk = s.stuk;
    const horizon = ctx.currentTime + VOORUIT;
    for (let veilig = 0; veilig < 400; veilig++) {
      const nr = rondeNr(s), arr = stuk.arrs[nr];
      if (s.index >= arr.ev.length) {
        const volgende = s.rondeBegin + arr.lengte + rondenVan(stuk)[nr].pauze;
        if (volgende > horizon) break;
        s.index = 0; s.ronde++; s.rondeBegin = volgende;
        toonTitel();
        continue;
      }
      const e = arr.ev[s.index];
      const t = s.rondeBegin + arr.tijd(e.t) + (Math.random() - 0.5) * (e.inst === 'melodie' ? 0.012 : 0.02);
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

  // ============================================================
  // DE FILMMUZIEK BIJ DE OPENING (zie opening.js): de torenklok slaat twee keer, een gamba zwelt aan op een
  // open kwint, de luit breekt de akkoorden C, F en G, en dan zet de blokfluit het begin van het Engels
  // Nachtegaeltje in. Het slotakkoord, met een roffel op de tabor, valt precies als de naam verschijnt.
  // ============================================================
  function film() {
    if (!maakContext()) return null;
    const c = ctx, K = window.Klank, k = K.ketting(c);
    const uit = c.createGain(); uit.gain.value = 0.62; uit.connect(hoofd);
    const klokken = c.createGain(); klokken.gain.value = 0.8; klokken.connect(k.muziek);
    const galm = c.createGain(); galm.gain.value = 0.6; klokken.connect(galm); galm.connect(k.galm);
    const t0 = c.currentTime + 0.06, T = (s) => t0 + s;
    // de torenklok (slagtoon C, de brom een octaaf lager)
    K.klok(c, klokken, T(0), 130.8, 0.19, -0.35);
    K.klok(c, klokken, T(1.75), 130.8, 0.12, -0.35);
    // de gamba: eerst een open kwint, dan de baslijn onder de akkoorden
    [[2.2, 1.75, 36, 0.12], [2.35, 1.6, 43, 0.07], [3.95, 0.6, 41, 0.17], [4.55, 0.3, 43, 0.18], [4.85, 1.88, 36, 0.19],
      [6.73, 0.63, 43, 0.21], [7.36, 1.1, 36, 0.25], [7.36, 1.1, 48, 0.1], [8.46, 0.3, 43, 0.19], [8.76, 2.6, 36, 0.21]]
      .forEach(([s, d, m, v]) => gamba(c, uit, freq(m), T(s), d, v, 0.18));
    // de luit breekt de akkoorden
    const breek = (s, noten, stap, vol) => noten.forEach((m, i) => K.tokkel(c, uit, 'luit', m, T(s + i * stap), vol * (1 - i * 0.04), 0, 0.24));
    breek(3.0, [48, 55, 60, 64, 67], 0.16, 0.27);
    breek(3.95, [53, 57, 60, 65], 0.12, 0.25);
    breek(4.55, [55, 59, 62, 67], 0.07, 0.26);
    breek(4.85, [48, 55, 60, 64], 0.03, 0.28);
    breek(6.11, [52, 55, 60], 0.03, 0.18);
    breek(6.73, [55, 59, 62, 65], 0.03, 0.26);
    breek(7.36, [48, 55, 60, 64, 67, 72], 0.035, 0.34);
    breek(8.46, [55, 59, 62, 67], 0.03, 0.22);
    breek(8.76, [48, 55, 60, 64, 67], 0.07, 0.3);
    // het klavecimbel versterkt het slotakkoord, en hoog glinstert het als de naam verschijnt
    [60, 64, 67, 72].forEach((m, i) => K.tokkel(c, uit, 'klavecimbel', m, T(7.36 + i * 0.012), 0.2, 1.3, 0.1));
    [84, 88, 91, 96].forEach((m, i) => K.tokkel(c, uit, 'klavecimbel', m, T(7.5 + i * 0.1), 0.1, 0.7, 0.35 - i * 0.18));
    [60, 64, 67, 72].forEach((m, i) => K.tokkel(c, uit, 'klavecimbel', m, T(8.76 + i * 0.02), 0.18, 2.4, 0.1));
    // de blokfluit: e'' d'' e'' c'' g'' f'' | e'' d'' c''
    [[4.85, 0.94, 76, 1, false], [5.79, 0.16, 74, 0.9, true], [5.95, 0.16, 76, 0.9, true], [6.11, 0.62, 72, 0.95, true], [6.73, 0.47, 79, 1, false],
      [7.2, 0.16, 77, 0.9, true], [7.36, 1.1, 76, 1.15, false], [8.46, 0.3, 74, 0.95, true], [8.76, 2.1, 72, 1, true]]
      .forEach(([s, d, m, v, legato]) => K.blokfluit(c, uit, freq(m), T(s), d, 0.3 * v, -0.16, { legato }));
    // een roffel op de tabor naar het slotakkoord
    for (let i = 0; i < 9; i++) tabor(c, uit, T(6.79 + i * 0.064), i < 5 ? 'zacht' : '');
    tabor(c, uit, T(7.36), 'sterk');
    tabor(c, uit, T(8.76), 'zacht');
    let gestopt = false;
    return {
      duur: 11,
      stop(snel) {
        if (gestopt) return;
        gestopt = true;
        const n = c.currentTime;
        [uit, klokken].forEach((gg) => { gg.gain.cancelScheduledValues(n); gg.gain.setValueAtTime(Math.max(0.0001, gg.gain.value), n); gg.gain.exponentialRampToValueAtTime(0.0001, n + (snel ? 0.4 : 1.4)); });
        setTimeout(() => { uit.disconnect(); klokken.disconnect(); galm.disconnect(); }, 2500);
      }
    };
  }

  // ---------- Bediening ----------
  const knop = document.getElementById('knop-muziek');
  const titelVak = document.getElementById('nu-speelt');

  function toonTitel() {
    if (!titelVak) return;
    if (speelt) {
      const nr = rondeNr(speelt), r = rondenVan(speelt.stuk)[nr];
      const extra = speelt.stuk.ronden ? r.naam : r.wissel ? `op de ${WISSEL[speelt.stuk.melodie] || speelt.stuk.melodie}` : RONDE_NAAM[nr];
      titelVak.textContent = speelt.stuk.titel + (extra ? ` · ${extra}` : '');
      titelVak.title = speelt.stuk.bron; titelVak.hidden = false;
    } else { titelVak.textContent = ''; titelVak.hidden = true; }
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
    if (aan) { if (window.Klank) window.Klank.ontgrendel(); begin(gewenst, gewenstVanaf); } else stopHuidig();
  }

  if (knop) knop.addEventListener('click', () => zet(!aan));
  knopTekst();

  // Browsers spelen pas geluid na een tik: dan begint de muziek. Loopt de opening nog, dan wacht de muziek
  // tot de film klaar is (die heeft zijn eigen muziek) en zwelt daarna rustig aan.
  const filmLoopt = () => document.documentElement.classList.contains('met-opening');
  function eersteGebaar() {
    ['touchend', 'pointerup', 'keydown'].forEach((t) => window.removeEventListener(t, eersteGebaar, true));
    if (!aan || speelt) return;
    if (filmLoopt()) window.addEventListener('speelhuys:opening-klaar', () => setTimeout(() => { if (aan && !speelt) begin(gewenst, gewenstVanaf); }, 1400), { once: true });
    else begin(gewenst, gewenstVanaf);
  }
  ['touchend', 'pointerup', 'keydown'].forEach((t) => window.addEventListener(t, eersteGebaar, true));

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (speelt) { const naam = speelt.naam; stopHuidig(true); gewenst = naam; } }
    else if (aan && !speelt && !filmLoopt()) begin(gewenst, gewenstVanaf);
  });

  window.Muziek = {
    stukken: STUKKEN,
    ronden: RONDEN,
    get speelt() { return speelt ? speelt.naam : null; },
    get ronde() { return speelt ? rondeNr(speelt) : null; },
    get aan() { return aan; },
    // het stuk voor dit scherm; 'vanaf' laat elk spel met een eigen variatie beginnen
    kies(naam, vanaf) {
      const doel = STUKKEN[naam] ? naam : 'thuis';
      gewenst = doel; gewenstVanaf = vanaf || 0;
      if (!aan || !ctx) return;
      if (huidigStuk === doel) return;
      stopHuidig();
      setTimeout(() => { if (aan && gewenst === doel && !speelt) begin(doel, gewenstVanaf); }, 500);
    },
    film,
    // (voor de tests) een stuk opnemen in plaats van afspelen, met de ronden na elkaar
    _render(naam, seconden, vanaf) {
      const stuk = STUKKEN[naam];
      return window.Klank.render(seconden, (oc, k) => {
        const h = oc.createGain(); h.gain.value = 0.62 * (stuk.niveau || 1); h.connect(k.muziek);
        let begin = 0.1;
        const ronden = rondenVan(stuk);
        for (let r = 0; r < 8 && begin < seconden; r++) {
          const nr = (r + (vanaf || 0)) % ronden.length, arr = stuk.arrs[nr], b = begin;
          arr.ev.forEach((e) => { const t = b + arr.tijd(e.t); if (t < seconden) speel(oc, h, stuk, e, t, arr.tijd(e.t + (e.duur || 0)) - arr.tijd(e.t)); });
          begin += arr.lengte + ronden[nr].pauze;
        }
      });
    },
    _renderFilm(seconden) {
      return window.Klank.render(seconden, (oc, k) => {
        const vorig = ctx, vorigHoofd = hoofd;
        ctx = oc; hoofd = oc.createGain(); hoofd.gain.value = 0.62; hoofd.connect(k.muziek);
        try { film(); } finally { ctx = vorig; hoofd = vorigHoofd; }
      });
    }
  };
})();
