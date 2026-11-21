/* Achtergrondmuziek: melodieën uit Jacob van Eyck, Der Fluyten Lust-hof (Amsterdam, 1649 en 1654).
   De browser speelt de noten zelf met Web Audio, dus er is geen opname en er zijn geen uitvoeringsrechten.
   Notatie van de noten: Duitse nootnamen (h = si, b = si-mol, fis = fa-kruis), ' = octaaf hoger,
   c' = centrale do, getal = notenwaarde (4 = kwart), punt = gepunteerd, ~ = overbinding. */
(function () {
  const STUKKEN = {
    thuis: {
      titel: 'Engels Nachtegaeltje',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      instrument: 'blokfluit', tempo: 78, transpositie: 0,
      noten: "|: e''4. d''16 e''16 c''4 g''8. f''16 | e''2. , c''8 d''8 | e''4 c''4 e''4 fis''4 | g''2. , e''8 f''8 | " +
             "g''4 g''8 a''8 g''4 e''8 f''8 | g''8 f''8 g''8 a''8 g''4 e''8 f''8 | g''4 e''4 f''4 g''4 | a''4 , a'4 a'4. h'8 | " +
             "c''8 d''8 e''8 f''8 g''4 c''4 | h'8. c''16 d''4 g'4 g''4 | e''8. f''16 g''8 e''8 d''4. c''8 | c''2. :| " +
             "|: f''8. g''16 | a''4 f''4 f''4. g''8 | a''8 f''8 a''8 f''8 a''8 f''8 a''8 f''8 | a''8 f''8 a''8 f''8 e''4 fis''4 | g''1 | " +
             "g''1 , | g''8 g''8 g''8 g''8 g''2 | g''8 g''8 g''8 g''8 g''8 g''8 g''4 | e''8. f''16 g''8 e''8 d''4. c''8 | [1 c''2. :| [2 c''1 ||"
    },
    ganzenbord: {
      titel: 'Malle Symen',
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      instrument: 'blokfluit', tempo: 104, transpositie: 0, trom: 4,
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
      instrument: 'luit', tempo: 96, transpositie: -12,
      noten: "|: g'2 c''2 | e'4. f'8 g'2 | c''4 g'4 a'4 g'4 | e'8 f'8 g'4 e''2 , | " +
             "g'4. a'8 h'8 c''8 d''4 | f'4. g'8 a'8 h'8 c''4 | e'2 d'2 | c'1 :| " +
             "|: g'4 g'4 a'8 h'8 c''4 | c''4 h'4 c''2 , | d''8 e''8 f''8 d''8 e''4 e''4 | d''8 e''8 f''8 d''8 e''8. f''16 g''4 , | " +
             "g'4. a'8 h'8 c''8 d''4 | f'4. g'8 a'8 h'8 c''4 | e'2 d'2 | c'1 :|"
    },
    molenspel: {
      titel: "Doen Daphne d'over schoone Maeght",
      bron: 'Jacob van Eyck, Der Fluyten Lust-hof I (1649)',
      instrument: 'luit', tempo: 92, transpositie: -12,
      noten: "d'4 | f'2 g'4 | a'2 d''4 | cis''4. d''8 e''4 | d''2 , a'4 | " +
             "c''4 a'4 f'4 | g'4 e'4 c'4 | d'4 f'4 e'4 | [1 d'2 :| [2 d'2. | " +
             "|: f''2 f''4 | e''2 e''4 | d''2 d''4 | cis''2 , a'4 | a'4. b'8 a'4 | g'4. a'8 f'4 | f'4. g'8 e'4 | f'2. :| " +
             "|: c''4 c''4 d''4 | c''4 a'4 f'4 | c''4. d''8 e''8 f''8 | g''4 e''4 c''4 , | a'4. g'8 f'4 | e'4 d'4 d''4 | " +
             "cis''4. d''8 e''4 | d''2 , a'8 h'8 | c''4 a'4 f'4 | g'4 e'4 c'4 | d'8 e'8 f'8 g'8 e'4 | d'2. :|"
    }
  };

  // ---------- Noten lezen ----------
  const STAM = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, h: 11, b: 10 };
  function lees(tekst) {
    const delen = tekst.replace(/\//g, ' ').split(/\s+/).filter(Boolean);
    const uit = [];
    let herhaalVanaf = 0, volta1 = null;
    for (const t of delen) {
      if (t === '|:') { herhaalVanaf = uit.length; continue; }
      if (t === ':|') {
        if (volta1 !== null) { uit.push(...uit.slice(herhaalVanaf, volta1)); volta1 = null; }
        else uit.push(...uit.slice(herhaalVanaf));
        herhaalVanaf = uit.length;
        continue;
      }
      if (t === '[1') { volta1 = uit.length; continue; }
      const m = t.match(/^\(?([a-hr])(is|es|s)?('*)(\d+)(\.?)(~?)\)?$/);
      if (!m) continue;
      const duur = (4 / Number(m[4])) * (m[5] ? 1.5 : 1);
      if (m[1] === 'r') { uit.push({ midi: null, duur, bind: false }); continue; }
      const toon = STAM[m[1]] + (m[2] === 'is' ? 1 : m[2] ? -1 : 0);
      uit.push({ midi: 48 + 12 * m[3].length + toon, duur, bind: !!m[6] });
    }
    // overbindingen samenvoegen
    const noten = [];
    for (const n of uit) {
      const vorige = noten[noten.length - 1];
      if (vorige && vorige.bind && vorige.midi === n.midi) { vorige.duur += n.duur; vorige.bind = n.bind; }
      else noten.push(Object.assign({}, n));
    }
    let tel = 0;
    noten.forEach((n) => { n.begin = tel; tel += n.duur; });
    return { noten, lengte: tel };
  }
  Object.values(STUKKEN).forEach((s) => { Object.assign(s, lees(s.noten)); });

  // ---------- Klank ----------
  let ctx = null, hoofd = null, galm = null, ruisBuffer = null;
  let aan = false;
  try { aan = localStorage.getItem('speelhuys.muziek') === 'aan'; } catch (e) { /* geen opslag */ }

  function maakContext() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    hoofd = ctx.createGain(); hoofd.gain.value = 0.16;
    // eenvoudige galm, als in een betegelde kamer
    galm = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let k = 0; k < 2; k++) { const d = ir.getChannelData(k); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    galm.buffer = ir;
    const nat = ctx.createGain(); nat.gain.value = 0.22;
    hoofd.connect(ctx.destination);
    hoofd.connect(galm); galm.connect(nat); nat.connect(ctx.destination);
    ruisBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
    const rd = ruisBuffer.getChannelData(0); for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
    return ctx;
  }

  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function blokfluit(uitgang, f, t, duur) {
    const lengte = Math.max(0.08, duur * 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.03);
    g.gain.setValueAtTime(0.8, t + Math.max(0.04, lengte - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + lengte + 0.06);
    g.connect(uitgang);
    const toonbron = [[1, 'sine', 1], [2, 'sine', 0.08], [3, 'sine', 0.035], [1, 'triangle', 0.12]];
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
    const vibDiepte = ctx.createGain(); vibDiepte.gain.setValueAtTime(0, t);
    if (lengte > 0.45) vibDiepte.gain.linearRampToValueAtTime(f * 0.004, t + lengte);
    vib.connect(vibDiepte);
    toonbron.forEach(([mult, type, vol]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mult;
      vibDiepte.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = vol * 0.5;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + lengte + 0.1);
    });
    vib.start(t); vib.stop(t + lengte + 0.1);
    // aanblaas-ruisje
    const r = ctx.createBufferSource(); r.buffer = ruisBuffer;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
    const rg = ctx.createGain(); rg.gain.setValueAtTime(0.12, t); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    r.connect(bp); bp.connect(rg); rg.connect(uitgang);
    r.start(t); r.stop(t + 0.06);
  }

  function luit(uitgang, f, t, duur) {
    const uitklink = Math.min(2.2, Math.max(0.6, duur * 1.8));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(Math.min(5200, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + 0.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + uitklink);
    lp.connect(g); g.connect(uitgang);
    [[0, 'sawtooth', 0.35], [3, 'triangle', 0.5], [-4, 'square', 0.08]].forEach(([cent, type, vol]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = cent;
      const og = ctx.createGain(); og.gain.value = vol;
      o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + uitklink + 0.05);
    });
  }

  function trom(uitgang, t, zwaar) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(zwaar ? 120 : 160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const g = ctx.createGain(); g.gain.setValueAtTime(zwaar ? 0.5 : 0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(uitgang); o.start(t); o.stop(t + 0.25);
    const r = ctx.createBufferSource(); r.buffer = ruisBuffer;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const rg = ctx.createGain(); rg.gain.setValueAtTime(0.18, t); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    r.connect(lp); lp.connect(rg); rg.connect(uitgang); r.start(t); r.stop(t + 0.1);
  }

  // ---------- Afspelen ----------
  let huidigStuk = null, gewenst = 'thuis', speelt = null, klok = 0;
  const VOORUIT = 0.35, PAUZE = 2; // seconden vooruit plannen, tellen stilte tussen herhalingen

  function begin(naam) {
    const stuk = STUKKEN[naam];
    if (!stuk || !maakContext()) return;
    const uitgang = ctx.createGain();
    uitgang.gain.setValueAtTime(0.0001, ctx.currentTime);
    uitgang.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8);
    uitgang.connect(hoofd);
    speelt = { naam, stuk, uitgang, index: 0, ronde: 0, start: ctx.currentTime + 0.15, volgendeTrom: 0 };
    huidigStuk = naam;
    toonTitel();
    clearInterval(klok);
    klok = setInterval(plan, 60);
    plan();
  }

  function plan() {
    if (!speelt) return;
    const s = speelt, stuk = s.stuk, tel = 60 / stuk.tempo;
    const horizon = ctx.currentTime + VOORUIT;
    while (true) {
      const rondeBegin = s.start + s.ronde * (stuk.lengte + PAUZE) * tel;
      if (stuk.trom && s.volgendeTrom < stuk.lengte) {
        const tt = rondeBegin + s.volgendeTrom * tel;
        const n = stuk.noten[s.index];
        const nt = n ? rondeBegin + n.begin * tel : Infinity;
        if (tt <= nt && tt < horizon) {
          trom(s.uitgang, tt, s.volgendeTrom % stuk.trom === 0);
          s.volgendeTrom += stuk.trom / 2;
          continue;
        }
      }
      if (s.index >= stuk.noten.length) {
        if (rondeBegin + stuk.lengte * tel > horizon) break;
        s.index = 0; s.ronde++; s.volgendeTrom = 0;
        continue;
      }
      const n = stuk.noten[s.index];
      const t = rondeBegin + n.begin * tel;
      if (t > horizon) break;
      if (n.midi !== null) {
        const f = freq(n.midi + stuk.transpositie);
        if (stuk.instrument === 'luit') luit(s.uitgang, f, t, n.duur * tel);
        else blokfluit(s.uitgang, f, t, n.duur * tel);
      }
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
    knop.textContent = aan ? 'Muziek aan' : 'Muziek uit';
  }

  function zet(waarde) {
    aan = waarde;
    try { localStorage.setItem('speelhuys.muziek', aan ? 'aan' : 'uit'); } catch (e) { /* */ }
    knopTekst();
    if (aan) begin(gewenst); else stopHuidig();
  }

  if (knop) knop.addEventListener('click', () => zet(!aan));
  knopTekst();

  // Browsers spelen pas geluid na een klik: stond de muziek de vorige keer aan, dan start hij bij de eerste klik.
  function eersteGebaar() {
    window.removeEventListener('pointerdown', eersteGebaar, true);
    window.removeEventListener('keydown', eersteGebaar, true);
    if (aan && !speelt) begin(gewenst);
  }
  window.addEventListener('pointerdown', eersteGebaar, true);
  window.addEventListener('keydown', eersteGebaar, true);

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (speelt) { const naam = speelt.naam; stopHuidig(true); gewenst = naam; } }
    else if (aan && !speelt) begin(gewenst);
  });

  window.Muziek = {
    stukken: STUKKEN,
    get speelt() { return speelt ? speelt.naam : null; },
    kies(naam) {
      const doel = STUKKEN[naam] ? naam : 'thuis';
      gewenst = doel;
      if (!aan || !ctx) return;
      if (huidigStuk === doel) return;
      stopHuidig();
      setTimeout(() => { if (aan && gewenst === doel && !speelt) begin(doel); }, 500);
    }
  };
})();
