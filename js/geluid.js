/* Klank: één gedeelde AudioContext voor geluidseffecten en muziek.
   Op de iPhone gelden twee extra regels:
   1. Geluid mag pas starten na een aanraking; die telt pas bij het loslaten (touchend), niet bij het neerzetten.
   2. De stille-modus-schakelaar dempt Web Audio. Met audioSession 'playback' (iOS 17+) of een
      stil afspelend audio-element (oudere iOS) speelt het geluid toch, zoals bij een video.

   Alles klinkt door één mengpaneel: een galm als in een betegelde 17e-eeuwse kamer en een zachte begrenzer.
   De geluiden zelf zijn nagebootst zoals ze in het echt ontstaan:
   - hout, been, steen, glas, metaal en klokken: een handvol tonen die elk op hun eigen tempo uitsterven
     (modale klank), met een tikje ruis waar het ding iets raakt;
   - luit en klavecimbel: een getokte snaar (Karplus-Strong): ruis die in een lus rondgaat en een toon wordt;
   - blokfluit: een bijna zuivere toon met adem, een aanblaasruisje en vibrato;
   - schuiven, papier, kruim en water: gevormde ruis, soms in honderden piepkleine korrels.
   Elk geluid klinkt elke keer net iets anders, zoals in het echt. */
(function () {
  let ctx = null;
  let stilleSpeler = null;

  function maak() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    return ctx;
  }

  function stilteWav() {
    const n = 4000; // een halve seconde stilte, 8 kHz, 8 bit mono
    const b = new Uint8Array(44 + n);
    const dv = new DataView(b.buffer);
    const tekst = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
    tekst(0, 'RIFF'); dv.setUint32(4, 36 + n, true); tekst(8, 'WAVE');
    tekst(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
    tekst(36, 'data'); dv.setUint32(40, n, true);
    b.fill(128, 44);
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return 'data:audio/wav;base64,' + btoa(s);
  }

  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function ontgrendel() {
    const c = maak();
    if (!c) return;
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* */ }
    if (iOS && !navigator.audioSession && (window.Geluid.aan || (window.Muziek && window.Muziek.aan))) {
      if (!stilleSpeler) {
        stilleSpeler = new Audio(stilteWav());
        stilleSpeler.loop = true;
        stilleSpeler.setAttribute('playsinline', '');
      }
      if (stilleSpeler.paused) stilleSpeler.play().catch(() => { /* */ });
    }
    if (c.state !== 'running') {
      c.resume().catch(() => { /* */ });
      // een leeg geluidje binnen de aanraking zet oudere iOS-versies open
      const buf = c.createBuffer(1, 1, 22050);
      const src = c.createBufferSource(); src.buffer = buf; src.connect(c.destination); src.start(0);
    }
  }

  ['touchend', 'pointerup', 'click', 'keydown'].forEach((t) => {
    window.addEventListener(t, ontgrendel, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && stilleSpeler && !stilleSpeler.paused) stilleSpeler.pause();
  });

  // ============================================================
  // HET MENGPANEEL: per context één galm, een begrenzer en twee groepen (effecten en muziek)
  // ============================================================
  const KETTINGEN = new WeakMap();
  // de galm van een kamer met een plavuizen vloer en houten balken: vroege weerkaatsingen en een staart die doffer wordt
  function galmIR(c) {
    const sr = c.sampleRate, duur = 2.0, n = Math.floor(sr * duur);
    const ir = c.createBuffer(2, n, sr);
    for (let k = 0; k < 2; k++) {
      const d = ir.getChannelData(k);
      [[0.009, 0.5], [0.014, 0.38], [0.021, 0.36], [0.027, 0.28], [0.036, 0.25], [0.047, 0.19], [0.058, 0.16], [0.071, 0.12]].forEach(([t, a]) => {
        const i = Math.floor((t + (k ? 0.0021 : 0) + Math.random() * 0.0025) * sr);
        if (i < n) d[i] += a * (Math.random() < 0.5 ? -1 : 1);
      });
      let lp = 0;
      const begin = Math.floor(0.01 * sr);
      for (let i = begin; i < n; i++) {
        const t = i / sr;
        const omhulsel = Math.exp(-6.9 * t / duur) * Math.min(1, (t - 0.01) / 0.035);
        const helder = 0.55 * Math.exp(-t / 0.5) + 0.05;
        lp += helder * ((Math.random() * 2 - 1) - lp);
        d[i] += lp * omhulsel * 0.62;
      }
    }
    return ir;
  }
  function witteRuis(c) {
    const n = Math.floor(c.sampleRate * 2);
    const b = c.createBuffer(1, n, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function ketting(c) {
    let k = KETTINGEN.get(c);
    if (k) return k;
    const master = c.createGain(); master.gain.value = 0.92;
    const rem = c.createDynamicsCompressor();
    rem.threshold.value = -14; rem.knee.value = 12; rem.ratio.value = 4; rem.attack.value = 0.003; rem.release.value = 0.22;
    master.connect(rem); rem.connect(c.destination);
    const galm = c.createConvolver(); galm.buffer = galmIR(c);
    galm.connect(master);
    const groep = (niveau, nat) => {
      const g = c.createGain(); g.gain.value = niveau; g.connect(master);
      const s = c.createGain(); s.gain.value = nat; g.connect(s); s.connect(galm);
      return g;
    };
    k = { master, galm, effect: groep(1, 0.16), muziek: groep(1, 0.34), ruis: witteRuis(c), rompen: new Map() };
    KETTINGEN.set(c, k);
    return k;
  }

  // ============================================================
  // DE GETOKTE SNAAR (luit en klavecimbel), één keer uitgerekend per toon
  // ============================================================
  const SNAAR_SOORT = {
    // zacht getokt met de vinger, dubbele snaren (koren) die een fractie verstemd zijn
    luit: { sr: 24000, helder: 0.3, pos: 0.19, koor: 2.6, oct: 0, t60: (m) => Math.max(0.9, Math.min(2.6, 2.5 - (m - 40) * 0.04)) },
    // een ganzenveer tokkelt de snaar fel aan, en een tweede register een octaaf hoger
    klavecimbel: { sr: 32000, helder: 0.6, pos: 0.12, koor: 1.1, oct: 0.17, t60: (m) => Math.max(1.0, Math.min(3.4, 3.3 - (m - 36) * 0.045)) },
    // de cister (op schilderijen van Vermeer en Metsu): koperen snaren in koren, met een plectrum aangeslagen
    cister: { sr: 32000, helder: 0.8, pos: 0.09, koor: 3.4, oct: 0.24, t60: (m) => Math.max(0.7, Math.min(2.2, 2.2 - (m - 48) * 0.035)) }
  };
  const SNAREN = new Map();
  function renderSnaar(f, o, duur) {
    const sr = o.sr, n = Math.floor(sr * duur);
    const uit = new Float32Array(n);
    const een = (fr, niveau, t60) => {
      const P = sr / fr;
      const L = Math.max(2, Math.floor(P - 0.5));
      const d = Math.min(0.999, Math.max(0.001, P - 0.5 - L));
      const C = (1 - d) / (1 + d);
      const lijn = new Float32Array(L);
      let lp = 0;
      for (let i = 0; i < L; i++) { lp += o.helder * ((Math.random() * 2 - 1) - lp); lijn[i] = lp; }
      const kam = Math.max(1, Math.round(L * o.pos));
      for (let i = L - 1; i >= kam; i--) lijn[i] -= lijn[i - kam];
      let m = 0; for (let i = 0; i < L; i++) m += lijn[i]; m /= L;
      for (let i = 0; i < L; i++) lijn[i] -= m;
      const rho = Math.pow(10, -3 / (t60 * fr));
      let idx = 0, vorige = 0, apX = 0, apY = 0;
      for (let i = 0; i < n; i++) {
        const y = lijn[idx];
        uit[i] += y * niveau;
        const v = rho * 0.5 * (y + vorige);
        vorige = y;
        const ap = C * v + apX - C * apY;
        apX = v; apY = ap;
        lijn[idx] = ap;
        if (++idx >= L) idx = 0;
      }
    };
    return { uit, een, n, sr };
  }
  function snaarBuffer(c, soort, midi) {
    const sleutel = soort + ':' + midi;
    if (SNAREN.has(sleutel)) return SNAREN.get(sleutel);
    const o = SNAAR_SOORT[soort] || SNAAR_SOORT.luit;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const t60 = o.t60(midi);
    const duur = Math.min(3.2, t60 * 0.95 + 0.1);
    const r = renderSnaar(f, o, duur);
    r.een(f, 1, t60);
    if (o.koor) r.een(f * Math.pow(2, o.koor / 1200), 0.8, t60 * 0.95);
    if (o.oct) r.een(f * 2 * Math.pow(2, 1.4 / 1200), o.oct, t60 * 0.6);
    let piek = 0; for (let i = 0; i < r.n; i++) piek = Math.max(piek, Math.abs(r.uit[i]));
    const s = piek > 0 ? 0.92 / piek : 1, staart = Math.floor(r.sr * 0.06);
    for (let i = 0; i < r.n; i++) { let g = s; if (i < 20) g *= i / 20; if (i > r.n - staart) g *= (r.n - i) / staart; r.uit[i] *= g; }
    let buf;
    try { buf = new AudioBuffer({ length: r.n, sampleRate: r.sr, numberOfChannels: 1 }); } catch (e) { buf = c.createBuffer(1, r.n, r.sr); }
    buf.getChannelData(0).set(r.uit);
    if (SNAREN.size > 140) SNAREN.delete(SNAREN.keys().next().value);
    SNAREN.set(sleutel, buf);
    return buf;
  }
  // de klankkast: luit warm rond 220 Hz, klavecimbel met een heldere glans
  function romp(c, uit, soort) {
    const k = ketting(c);
    const sleutel = soort;
    let per = k.rompen.get(uit);
    if (!per) { per = {}; k.rompen.set(uit, per); }
    if (per[sleutel]) return per[sleutel];
    const filters = {
      klavecimbel: [['peaking', 260, 1.0, 3], ['peaking', 1900, 1.1, -3.5], ['highshelf', 5500, 0.7, -2]],
      cister: [['peaking', 340, 1.1, 3.5], ['peaking', 1150, 1.4, -2.5], ['peaking', 2600, 1.0, 2.5], ['highshelf', 6500, 0.7, -4]],
      luit: [['peaking', 215, 1.2, 5], ['peaking', 520, 1.4, 2.5], ['highshelf', 2800, 0.7, -6]]
    }[soort] || [['peaking', 215, 1.2, 5], ['peaking', 520, 1.4, 2.5], ['highshelf', 2800, 0.7, -6]];
    let eerste = null, vorige = null;
    filters.forEach(([type, f, q, gain]) => {
      const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = gain;
      if (vorige) vorige.connect(b); else eerste = b;
      vorige = b;
    });
    vorige.connect(uit);
    per[sleutel] = eerste;
    return eerste;
  }
  // één getokte toon; bij het klavecimbel valt de demper erop als de toets wordt losgelaten
  function tokkel(c, uit, soort, midi, t, vol, duur, pan) {
    const buf = snaarBuffer(c, soort, Math.round(midi));
    const src = c.createBufferSource(); src.buffer = buf;
    if (midi !== Math.round(midi)) src.detune.value = (midi - Math.round(midi)) * 100;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    let stop = t + buf.duration;
    if (duur && duur < buf.duration) {
      const eind = t + Math.max(0.09, duur);
      g.gain.setValueAtTime(vol, eind);
      g.gain.setTargetAtTime(0.0001, eind, soort === 'klavecimbel' ? 0.03 : 0.07);
      stop = Math.min(stop, eind + 0.5);
    }
    let doelNode = romp(c, uit, soort);
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(doelNode); doelNode = p; }
    src.connect(g); g.connect(doelNode);
    src.start(t); src.stop(stop);
  }

  // ============================================================
  // DE BLOKFLUIT: een bijna zuivere toon, adem, een aanblaasruisje en vibrato op lange noten
  // ============================================================
  const GOLVEN = new WeakMap();
  function fluitGolf(c) {
    let w = GOLVEN.get(c);
    if (w) return w;
    const deel = [0, 1, 0.2, 0.075, 0.035, 0.018, 0.008];
    const re = new Float32Array(deel.length), im = new Float32Array(deel);
    w = c.createPeriodicWave(re, im, { disableNormalization: false });
    GOLVEN.set(c, w);
    return w;
  }
  function blokfluit(c, uit, f, t, duur, vol, pan, o) {
    o = o || {};
    const k = ketting(c);
    const lengte = Math.max(0.07, duur * (o.legato ? 0.99 : 0.9));
    const aanzet = o.legato ? 0.012 : 0.024;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + aanzet);
    g.gain.setTargetAtTime(vol * 0.84, t + aanzet, 0.09);
    g.gain.setValueAtTime(vol * 0.84, t + lengte);
    g.gain.linearRampToValueAtTime(0.0001, t + lengte + 0.05);
    let naar = uit;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(uit); naar = p; }
    g.connect(naar);
    const osc = c.createOscillator();
    osc.setPeriodicWave(fluitGolf(c));
    osc.frequency.setValueAtTime(f, t);
    // de toon zet een fractie te laag in en schiet dan op zijn plek
    osc.detune.setValueAtTime(o.legato ? -6 : -22, t);
    osc.detune.setTargetAtTime(0, t, 0.018);
    if (lengte > 0.42 && !o.zonderVibrato) {
      const lfo = c.createOscillator(); lfo.frequency.value = 5.1 + Math.random() * 0.5;
      const diep = c.createGain(); diep.gain.setValueAtTime(0, t);
      diep.gain.setValueAtTime(0, t + 0.22); diep.gain.linearRampToValueAtTime(11, t + Math.min(lengte, 0.7));
      lfo.connect(diep); diep.connect(osc.detune);
      lfo.start(t); lfo.stop(t + lengte + 0.1);
    }
    osc.connect(g);
    osc.start(t); osc.stop(t + lengte + 0.08);
    // adem: ruis rond de grondtoon en het octaaf
    const adem = c.createBufferSource(); adem.buffer = k.ruis; adem.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 1.4;
    const ag = c.createGain(); ag.gain.value = 0.11;
    adem.connect(bp); bp.connect(ag); ag.connect(g);
    adem.start(t, Math.random() * 1.5); adem.stop(t + lengte + 0.08);
    // het aanblaasruisje (de 'chiff')
    if (!o.legato) {
      const ch = c.createBufferSource(); ch.buffer = k.ruis;
      const chf = c.createBiquadFilter(); chf.type = 'bandpass'; chf.frequency.value = Math.min(8000, f * 4); chf.Q.value = 1.2;
      const chg = c.createGain();
      chg.gain.setValueAtTime(vol * 0.5, t); chg.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      ch.connect(chf); chf.connect(chg); chg.connect(naar);
      ch.start(t, Math.random() * 1.5, 0.05);
    }
  }

  // ============================================================
  // DE TORENKLOK: een gegoten klok (zoals de klokken van Hemony) met zijn deeltonen: de brom een octaaf lager,
  // de slagtoon, de kleine terts, de kwint en de nominaal; de lage tonen zweven door kleine onzuiverheden
  // in het gietsel, de hoge sterven snel uit. Ver weg: zachter in de hoogte en met veel galm.
  // ============================================================
  const KLOKDELEN = [[0.5, 0.5, 11], [1, 0.75, 7.5], [1.19, 0.42, 5.5], [1.5, 0.24, 3.6], [2, 0.7, 4.5], [2.52, 0.2, 2.4], [3, 0.26, 2], [4.17, 0.12, 1.2], [5.43, 0.07, 0.75], [6.8, 0.04, 0.5]];
  function klok(c, uit, t, f, vol, pan) {
    const k = ketting(c);
    const g = c.createGain(); g.gain.value = vol;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600; lp.Q.value = 0.4;
    g.connect(lp);
    let naar = uit;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(uit); naar = p; }
    lp.connect(naar);
    KLOKDELEN.forEach(([r, a, d]) => {
      [[1, a], [1.0011 + Math.random() * 0.0008, a * 0.45]].forEach(([z, aa], i) => {
        if (i && r > 2.1) return;
        const o = c.createOscillator(); o.frequency.value = f * r * z;
        const og = c.createGain();
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(aa, t + 0.003 + r * 0.001);
        og.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(og); og.connect(g); o.start(t); o.stop(t + d + 0.05);
      });
    });
    // de klepel tegen het brons
    const n = c.createBufferSource(); n.buffer = k.ruis;
    const nb = c.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = f * 9; nb.Q.value = 0.9;
    const ng = c.createGain(); ng.gain.setValueAtTime(0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    n.connect(nb); nb.connect(ng); ng.connect(g);
    n.start(t, Math.random() * 1.5, 0.1);
  }

  window.Klank = {
    maak, ontgrendel, get ctx() { return ctx; },
    ketting, tokkel, blokfluit, snaarBuffer, klok,
    // (voor de tests) een geluid of stukje muziek opnemen in plaats van afspelen
    async render(duur, fn) {
      const sr = 44100;
      const oc = new OfflineAudioContext(2, Math.floor(sr * duur), sr);
      const vorig = doel;
      doel = { c: oc, k: ketting(oc) };
      try { fn(oc, doel.k); } finally { doel = vorig; }
      return oc.startRendering();
    }
  };

  // ---------- Trillen ----------
  // Android: navigator.vibrate. iPhone (iOS 18 en nieuwer): Safari geeft een tikje als een
  // schakelaar (input type=checkbox switch) omgaat; dat werkt alleen tijdens een aanraking.
  // In een latere App Store-versie (Capacitor) wordt de Haptics-plug-in gebruikt.
  let trilAan = true;
  try { trilAan = localStorage.getItem('speelhuys.trillen') !== 'uit'; } catch (e) { /* */ }
  let schakel = null;
  function iosTik() {
    try {
      if (!schakel) {
        const label = document.createElement('label');
        label.setAttribute('aria-hidden', 'true');
        label.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
        const inp = document.createElement('input');
        inp.type = 'checkbox'; inp.setAttribute('switch', ''); inp.tabIndex = -1;
        label.appendChild(inp);
        document.body.appendChild(label);
        schakel = label;
      }
      schakel.click();
    } catch (e) { /* */ }
  }
  function capacitor() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics; }
  function tril(patroon, sterkte) {
    if (!trilAan) return;
    const cap = capacitor();
    if (cap) { try { cap.impact({ style: sterkte || 'LIGHT' }); } catch (e) { /* */ } return; }
    if (navigator.vibrate) { try { navigator.vibrate(patroon); } catch (e) { /* */ } return; }
    if (iOS) iosTik();
  }
  window.Tril = {
    get aan() { return trilAan; },
    zet(w) { trilAan = w; try { localStorage.setItem('speelhuys.trillen', w ? 'aan' : 'uit'); } catch (e) { /* */ } if (w) tril(20, 'MEDIUM'); },
    tik() { tril(8, 'LIGHT'); },
    klik() { tril(18, 'MEDIUM'); },
    bots(kracht) { if (kracht > 0.45) tril(Math.round(6 + kracht * 14), 'LIGHT'); },
    succes() { tril([14, 60, 22], 'HEAVY'); },
    fout() { tril([30, 40, 30], 'MEDIUM'); }
  };

  // ============================================================
  // BOUWSTENEN VOOR DE GELUIDSEFFECTEN
  // ============================================================
  let aan = true;
  try { aan = localStorage.getItem('speelhuys.geluid') !== 'uit'; } catch (e) { /* geen opslag */ }
  let doel = null; // bij opnemen (tests): { c, k }
  let schaal = 1;   // het niveau van het geluid dat nu gemaakt wordt (zie NIVEAU onderaan)

  function bron() {
    if (doel) return doel;
    if (!aan) return null;
    const c = maak();
    if (!c) return null;
    if (c.state === 'suspended') c.resume().catch(() => { /* */ });
    return { c, k: ketting(c) };
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));

  // een eigen volumeknop en plek in het stereobeeld, naar de effectengroep
  function uitgang(B, vol, pan, pan2, duur, t) {
    const c = B.c, g = c.createGain(); g.gain.value = vol * schaal;
    if ((pan || pan2) && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.setValueAtTime(klem(pan || 0, -1, 1), t || c.currentTime);
      if (pan2 !== undefined && duur) p.pan.linearRampToValueAtTime(klem(pan2, -1, 1), (t || c.currentTime) + duur);
      g.connect(p); p.connect(B.k.effect);
    } else g.connect(B.k.effect);
    return g;
  }
  // modale klank: een paar sinussen, elk met zijn eigen uitsterftijd (hout, been, steen, glas, metaal, klok)
  function modaal(B, t, f, delen, vol, pan) {
    const c = B.c, out = uitgang(B, vol, pan, undefined, 0, t);
    delen.forEach(([r, a, d]) => {
      const fr = f * r * rnd(0.995, 1.005);
      if (fr > c.sampleRate * 0.45) return;
      const o = c.createOscillator(); o.frequency.value = fr;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a, t + 0.0012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + d + 0.02);
    });
  }
  // een ruisstoot door een filter (eventueel glijdend), met een aanzet en uitsterven
  function stoot(B, t, o) {
    const c = B.c, ruis = B.k.ruis;
    const src = c.createBufferSource(); src.buffer = ruis;
    const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.Q.value = o.q || 1;
    fl.frequency.setValueAtTime(o.f, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + o.duur * (o.f2op || 1));
    const g = c.createGain();
    const aanzet = o.aanzet || 0.0015;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.vol, t + aanzet);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(aanzet + 0.003, o.duur));
    src.connect(fl); fl.connect(g); g.connect(uitgang(B, 1, o.pan || 0, o.pan2, o.duur, t));
    src.start(t, Math.random() * (ruis.duration - o.duur - 0.06), o.duur + 0.05);
  }
  // een toon die van hoogte glijdt (plop, boing, vallen, duiven)
  function glij(B, t, o) {
    const c = B.c, osc = c.createOscillator(); osc.type = o.golf || 'sine';
    osc.frequency.setValueAtTime(o.f1, t);
    osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.duur * (o.glijOp || 1));
    if (o.vib) { const l = c.createOscillator(); l.frequency.value = o.vibF || 6; const dg = c.createGain(); dg.gain.value = o.vib; l.connect(dg); dg.connect(osc.detune); l.start(t); l.stop(t + o.duur + 0.05); }
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.vol, t + (o.aanzet || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.duur);
    let naar = uitgang(B, 1, o.pan || 0, undefined, 0, t);
    if (o.formanten) {
      const som = c.createGain(); som.connect(naar);
      o.formanten.forEach(([ff, q, a]) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; const bg = c.createGain(); bg.gain.value = a; b.connect(bg); bg.connect(som); g.connect(b); });
    } else g.connect(naar);
    if (o.ruw) { const l = c.createOscillator(); l.frequency.value = o.ruw; const tg = c.createGain(); tg.gain.value = 0.45; const mid = c.createGain(); mid.gain.value = 0.55; l.connect(tg); tg.connect(mid.gain); osc.connect(mid); mid.connect(g); l.start(t); l.stop(t + o.duur + 0.05); }
    else osc.connect(g);
    osc.start(t); osc.stop(t + o.duur + 0.05);
  }
  // korrels: piepkleine stootjes door elkaar (kruim, grind, rammelende ketting, het rollen van een dobbelsteen)
  function korrels(B, t, o) {
    for (let i = 0; i < o.n; i++) {
      stoot(B, t + Math.pow(Math.random(), o.klont || 1) * o.duur, { duur: rnd(o.lmin || 0.003, o.lmax || 0.009), f: rnd(o.fmin, o.fmax), q: o.q || 2.5, vol: o.vol * rnd(0.35, 1), pan: (o.pan || 0) + rnd(-0.15, 0.15) });
    }
  }

  // de stoffen waar alles van gemaakt is: [verhouding tot de grondtoon, sterkte, uitsterftijd in seconden]
  const HOUT = [[1, 1, 0.085], [2.57, 0.5, 0.042], [4.9, 0.24, 0.024], [7.8, 0.1, 0.013]];
  const HOUT_DOF = [[1, 1, 0.14], [2.3, 0.38, 0.06], [3.9, 0.15, 0.03]];
  const BEEN = [[1, 1, 0.028], [2.31, 0.55, 0.016], [3.92, 0.3, 0.009], [5.7, 0.12, 0.006]];
  const STEEN = [[1, 1, 0.04], [1.93, 0.6, 0.024], [3.1, 0.34, 0.014], [4.6, 0.14, 0.008]];
  const GLAS = [[1, 1, 0.16], [2.32, 0.6, 0.1], [4.25, 0.32, 0.06], [6.63, 0.14, 0.035]];
  const MUNT = [[1, 1, 0.5], [1.594, 0.62, 0.36], [2.136, 0.48, 0.28], [2.296, 0.36, 0.24], [2.653, 0.28, 0.18], [3.15, 0.12, 0.11]];
  const IJZER = [[1, 1, 0.9], [2.32, 0.6, 0.55], [4.25, 0.4, 0.34], [6.63, 0.24, 0.2], [9.4, 0.1, 0.11]];
  const KLOK = [[0.5, 0.4, 4.4], [1, 0.72, 3.3], [1.19, 0.5, 2.6], [1.5, 0.3, 1.9], [2, 0.95, 1.7], [2.51, 0.2, 1.1], [3.0, 0.28, 0.95], [4.07, 0.12, 0.6], [5.2, 0.07, 0.4]];
  const BELLETJE = [[1, 1, 0.85], [2.76, 0.3, 0.42], [5.4, 0.15, 0.22], [8.93, 0.06, 0.12]];
  const SPEELDOOS = [[1, 1, 0.65], [3.9, 0.22, 0.2], [9.5, 0.06, 0.07]];
  const nu = (B, w) => B.c.currentTime + 0.005 + (w || 0);
  // een kort ding dat iets raakt: de toon van het ding plus een tikje ruis
  function raak(B, t, stof, f, vol, pan, helder, ruisVol) {
    modaal(B, t, f * rnd(0.97, 1.03), stof, vol, pan);
    stoot(B, t, { duur: 0.011, f: helder || Math.min(9000, f * 2.2), q: 1.1, vol: vol * (ruisVol === undefined ? 0.45 : ruisVol), pan });
  }
  // een kraak (deur, molen): een zaagtand die stroef haperend over het hout gaat
  function kraak(B, t, duur, f, vol, pan) {
    const c = B.c, o = c.createOscillator(); o.type = 'sawtooth';
    const stappen = 24, curve = new Float32Array(stappen);
    let v = f; for (let i = 0; i < stappen; i++) { v = klem(v * rnd(0.9, 1.12), f * 0.6, f * 1.6); curve[i] = v; }
    o.frequency.setValueCurveAtTime(curve, t, duur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + duur * 0.25); g.gain.setValueAtTime(vol, t + duur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + duur);
    const naar = uitgang(B, 1, pan || 0, undefined, 0, t);
    [[650, 4, 1], [1350, 6, 0.6], [2600, 8, 0.25]].forEach(([ff, q, a]) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; const bg = c.createGain(); bg.gain.value = a; g.connect(b); b.connect(bg); bg.connect(naar); });
    o.connect(g); o.start(t); o.stop(t + duur + 0.05);
  }
  // een getokte toon voor feestjes en jammer-geluidjes
  function noot(B, t, midi, vol, soort, duur, pan) { tokkel(B.c, B.k.effect, soort || 'klavecimbel', midi, t, vol * schaal, duur, pan); }

  window.Geluid = {
    get aan() { return aan; },
    zet(waarde) {
      aan = waarde;
      try { localStorage.setItem('speelhuys.geluid', aan ? 'aan' : 'uit'); } catch (e) { /* */ }
      if (aan) ontgrendel();
    },
    // twee benen dobbelstenen: rammelen in de leren beker, stuiteren op het bord en uitrollen
    dobbel() {
      const B = bron(); if (!B) return;
      const t0 = nu(B);
      for (let i = 0; i < 5; i++) {
        const t = t0 + i * 0.048 + rnd(0, 0.016);
        modaal(B, t, rnd(1900, 2600), BEEN, 0.07, rnd(-0.2, 0.2));
        stoot(B, t, { duur: 0.035, type: 'lowpass', f: 900, q: 0.7, vol: 0.05 });
      }
      [0, 1].forEach((d) => {
        let t = t0 + 0.3 + d * 0.037, gat = 0.13 + d * 0.012, v = 0.55;
        const pan = d ? 0.28 : -0.18, f = rnd(2000, 2700);
        for (let i = 0; i < 6; i++) {
          modaal(B, t, f * rnd(0.94, 1.06), BEEN, v * 0.42, pan);
          modaal(B, t, rnd(380, 470), HOUT, v * 0.32, pan);
          stoot(B, t, { duur: 0.013, f: 3200, q: 1, vol: v * 0.22, pan });
          t += gat; gat *= 0.72; v *= 0.66;
        }
        korrels(B, t, { n: 6, duur: 0.12, fmin: 1800, fmax: 2900, vol: 0.05, pan });
      });
    },
    // een pion huppelt een vakje verder
    stap() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      raak(B, t, HOUT, rnd(640, 760), 0.2, rnd(-0.1, 0.1), 2200, 0.25);
      modaal(B, t, rnd(150, 175), [[1, 1, 0.06], [2.1, 0.3, 0.03]], 0.2);
    },
    // hout tegen hout (sjoelschijven, de brug op het ganzenbord)
    hout(kracht) {
      const B = bron(); if (!B) return;
      const v = klem(0.14 + (kracht === undefined ? 0.5 : kracht) * 0.6, 0.1, 0.8);
      raak(B, nu(B), HOUT, rnd(520, 640), v * 0.5, rnd(-0.15, 0.15), 1700, 0.5);
    },
    // een houten schijf die over gewreven hout glijdt
    schuif() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.38, type: 'bandpass', f: 560, f2: 360, q: 1.3, aanzet: 0.035, vol: 0.13 });
      stoot(B, t, { duur: 0.3, type: 'bandpass', f: 2200, f2: 1500, q: 2, aanzet: 0.03, vol: 0.025 });
      glij(B, t, { f1: 92, f2: 70, duur: 0.32, vol: 0.05, aanzet: 0.04 });
    },
    // een steen op het steen: molen- en damstenen
    steen() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      raak(B, t, STEEN, rnd(2000, 2450), 0.24, rnd(-0.12, 0.12), 4200, 0.4);
      modaal(B, t, rnd(215, 245), [[1, 1, 0.05], [2.4, 0.3, 0.025]], 0.2);
    },
    // iets oppakken: een zacht tikje
    pak() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.03, f: 1500, q: 1.4, vol: 0.08 });
      modaal(B, t, rnd(1100, 1300), [[1, 1, 0.025], [2.6, 0.3, 0.012]], 0.06);
    },
    // de kerkklok slaat drie keer
    klok() {
      const B = bron(); if (!B) return;
      [0, 0.95, 1.9].forEach((w) => { const t = nu(B, w); modaal(B, t, 311, KLOK, 0.2, 0.05); stoot(B, t, { duur: 0.02, f: 1300, q: 0.8, vol: 0.08 }); });
    },
    // in het water: een plons en een paar belletjes
    plons() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.6, type: 'lowpass', f: 2600, f2: 320, q: 0.6, aanzet: 0.004, vol: 0.38 });
      stoot(B, t, { duur: 0.22, type: 'bandpass', f: 900, q: 0.8, vol: 0.18 });
      for (let i = 0; i < 6; i++) glij(B, t + rnd(0.12, 0.55), { f1: rnd(260, 380), f2: rnd(700, 1100), duur: 0.05, vol: 0.05, pan: rnd(-0.3, 0.3) });
    },
    // jammer: een zuchtje op de luit
    jammer() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      noot(B, t, 64, 0.34, 'luit', 0.32, -0.1);
      noot(B, t + 0.28, 60, 0.3, 'luit', 0.5, -0.1);
      noot(B, t + 0.28, 45, 0.18, 'luit', 0.6, 0.1);
    },
    // een houten deur die kraakt en dichtvalt
    deur() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      kraak(B, t, 0.55, 105, 0.07, -0.2);
      modaal(B, t + 0.56, 125, HOUT_DOF, 0.3, 0);
      raak(B, t + 0.56, IJZER.map(([r, a, d]) => [r, a, d * 0.18]), 1700, 0.06, 0.1, 5000, 0.2);
    },
    // een zuchtje wind dat voorbijkomt
    woesj() {
      const B = bron(); if (!B) return;
      stoot(B, nu(B), { duur: 0.46, type: 'bandpass', f: 320, f2: 1500, q: 1.1, aanzet: 0.2, vol: 0.2, pan: -0.6, pan2: 0.6 });
    },
    // munten die rinkelend in de beurs vallen
    munt() {
      const B = bron(); if (!B) return;
      const t0 = nu(B);
      let t = t0;
      for (let i = 0; i < 6; i++) {
        const f = rnd(2300, 3400), pan = rnd(-0.35, 0.35);
        modaal(B, t, f, MUNT, rnd(0.06, 0.1), pan);
        stoot(B, t, { duur: 0.006, f: 6500, q: 1, vol: 0.07, pan });
        if (!i) modaal(B, t, 880, [[1, 1, 0.05], [2.7, 0.3, 0.02]], 0.08, pan);
        t += rnd(0.045, 0.1);
      }
    },
    // schrobben, en dan glinstert het
    klus() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      for (let i = 0; i < 4; i++) stoot(B, t + i * 0.12, { duur: 0.13, type: 'bandpass', f: rnd(1800, 2600), q: 1.4, aanzet: 0.035, vol: 0.15, pan: i % 2 ? 0.2 : -0.2 });
      [1568, 2093, 2637].forEach((f, i) => modaal(B, t + 0.55 + i * 0.09, f, BELLETJE, 0.08, -0.25 + i * 0.25));
    },
    // feest: een akkoord op het klavecimbel en een belletje
    tada() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      [60, 64, 67, 72].forEach((m, i) => noot(B, t + i * 0.075, m, 0.34, 'klavecimbel', 1.3 - i * 0.07, -0.2 + i * 0.13));
      noot(B, t, 48, 0.3, 'klavecimbel', 1.4, -0.1);
      noot(B, t + 0.4, 76, 0.26, 'klavecimbel', 0.9, 0.2);
      noot(B, t + 0.55, 79, 0.3, 'klavecimbel', 1.2, 0.25);
      modaal(B, t + 0.55, 1046.5, BELLETJE, 0.07, 0.3);
    },
    // zacht houten tikje bij elke aanraking
    tik() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      modaal(B, t, rnd(1500, 1700), [[1, 1, 0.022], [2.3, 0.3, 0.01]], 0.07);
      stoot(B, t, { duur: 0.006, f: 3200, q: 1, vol: 0.03 });
    },
    // glazen knikkers tegen elkaar
    knik(kracht) {
      const B = bron(); if (!B) return;
      const v = klem(0.1 + (kracht === undefined ? 0.5 : kracht) * 0.6, 0.08, 0.7);
      raak(B, nu(B), GLAS, rnd(2900, 3900), v * 0.24, rnd(-0.2, 0.2), 6500, 0.35);
    },
    // een botje dat op de stoep tikt
    bikkel(kracht) {
      const B = bron(); if (!B) return;
      const v = klem(0.2 + (kracht === undefined ? 0.5 : kracht) * 0.6, 0.1, 0.8), t = nu(B);
      raak(B, t, BEEN, rnd(2300, 3000), v * 0.32, rnd(-0.15, 0.15), 4800, 0.3);
      modaal(B, t, rnd(480, 620), STEEN, v * 0.16);
    },
    // een leren balletje dat stuit
    stuit(kracht) {
      const B = bron(); if (!B) return;
      const v = klem(0.25 + (kracht === undefined ? 0.6 : kracht) * 0.6, 0.15, 0.9), t = nu(B);
      glij(B, t, { f1: 165, f2: 85, duur: 0.11, vol: v * 0.42 });
      stoot(B, t, { duur: 0.045, f: 950, q: 0.9, vol: v * 0.3 });
    },
    // de bal valt in je hand
    vang() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.06, f: 1100, q: 0.8, vol: 0.24 });
      glij(B, t, { f1: 210, f2: 120, duur: 0.07, vol: 0.12 });
    },
    // de ijzeren kop van de kolf tegen de leren bal
    kolf(kracht) {
      const B = bron(); if (!B) return;
      const v = klem(0.25 + (kracht === undefined ? 0.5 : kracht) * 0.7, 0.15, 0.95), t = nu(B);
      modaal(B, t, rnd(820, 950), [[1, 1, 0.05], [2.4, 0.45, 0.03], [4.1, 0.2, 0.015]], v * 0.34);
      stoot(B, t, { duur: 0.03, f: 1400, q: 1, vol: v * 0.34 });
      glij(B, t, { f1: 220, f2: 140, duur: 0.06, vol: v * 0.2 });
    },
    // de bal tegen de houten paal
    paal(kracht) {
      const B = bron(); if (!B) return;
      const v = klem(0.3 + (kracht === undefined ? 0.5 : kracht) * 0.6, 0.2, 0.9), t = nu(B);
      modaal(B, t, rnd(300, 340), HOUT_DOF, v * 0.46);
      stoot(B, t, { duur: 0.04, f: 720, q: 1, vol: v * 0.3 });
      modaal(B, t, 760, [[1, 1, 0.2]], v * 0.07);
    },
    // koekhappen: een knapperige hap, tanden op elkaar, de koek tegen je neus, aftellen en happen maar
    hap() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      korrels(B, t, { n: 15, duur: 0.11, fmin: 1500, fmax: 4800, vol: 0.2, lmin: 0.003, lmax: 0.011, q: 1.8, klont: 1.6 });
      stoot(B, t, { duur: 0.075, type: 'lowpass', f: 420, q: 0.7, vol: 0.2 });
      korrels(B, t + 0.2, { n: 6, duur: 0.08, fmin: 1200, fmax: 3200, vol: 0.09, lmax: 0.008 });
    },
    klap() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      modaal(B, t, rnd(2500, 2800), BEEN, 0.18);
      modaal(B, t + 0.012, rnd(2900, 3300), BEEN, 0.1);
    },
    boing() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      glij(B, t, { f1: 430, f2: 250, duur: 0.17, vol: 0.12, vib: 22, vibF: 18 });
      modaal(B, t, 360, HOUT_DOF, 0.12);
    },
    tel() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      modaal(B, t, 1050, [[1, 1, 0.08], [2.7, 0.3, 0.03]], 0.22);
      stoot(B, t, { duur: 0.007, f: 2600, q: 1, vol: 0.06 });
    },
    start() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      blokfluit(B.c, B.k.effect, 784, t, 0.13, 0.24 * schaal, 0, { zonderVibrato: true });
      blokfluit(B.c, B.k.effect, 1046.5, t + 0.14, 0.42, 0.26 * schaal, 0, {});
    },
    // een gans die gakt
    gak() {
      const B = bron(); if (!B) return;
      [0, 0.21].forEach((w, i) => glij(B, nu(B, w), { golf: 'sawtooth', f1: 400 - i * 30, f2: 340 - i * 30, duur: 0.16, vol: 0.4, aanzet: 0.012, ruw: 28, formanten: [[950, 5, 0.5], [2300, 7, 0.28], [600, 3, 0.2]] }));
    },
    // twee glazen die tegen elkaar tikken in de herberg
    kling() {
      const B = bron(); if (!B) return;
      const t = nu(B), f = rnd(2350, 2600), lang = GLAS.map(([r, a, d]) => [r, a, d * 4]);
      modaal(B, t, f, lang, 0.11, -0.15);
      modaal(B, t + 0.012, f * 1.068, lang, 0.08, 0.15);
      stoot(B, t, { duur: 0.008, f: 7000, q: 1, vol: 0.06 });
    },
    // de ijzeren deur van de gevangenis valt dicht, met een rammelende ketting
    tralies() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      modaal(B, t, 178, IJZER, 0.24, 0);
      modaal(B, t, 467, IJZER, 0.09, 0.1);
      stoot(B, t, { duur: 0.05, f: 2000, q: 0.8, vol: 0.18 });
      korrels(B, t + 0.08, { n: 14, duur: 0.32, fmin: 3000, fmax: 7500, vol: 0.07, lmin: 0.006, lmax: 0.02, q: 4 });
    },
    // de molen: houten wieken die kraken, en een belletje
    molen() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      [0, 0.24].forEach((w, i) => kraak(B, t + w, 0.2, 140 + i * 30, 0.05, -0.3 + i * 0.6));
      [784, 1047, 1319].forEach((f, i) => modaal(B, t + 0.5 + i * 0.09, f, BELLETJE, 0.08, -0.2 + i * 0.2));
    },
    // een kurk die eraf springt
    plop() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.02, type: 'highpass', f: 1500, q: 0.7, vol: 0.22 });
      glij(B, t, { f1: 300, f2: 1100, duur: 0.05, vol: 0.18, glijOp: 0.6 });
    },
    // een zweepslag
    zweep() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.12, type: 'bandpass', f: 600, f2: 3000, q: 1, aanzet: 0.08, vol: 0.12, pan: -0.3, pan2: 0.3 });
      stoot(B, t + 0.12, { duur: 0.02, type: 'highpass', f: 2500, q: 0.7, aanzet: 0.0006, vol: 0.5 });
      modaal(B, t + 0.12, 2200, [[1, 1, 0.012]], 0.16);
    },
    // iets valt omver
    val() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      glij(B, t, { f1: 125, f2: 55, duur: 0.3, vol: 0.3 });
      stoot(B, t, { duur: 0.22, type: 'lowpass', f: 520, q: 0.7, vol: 0.24 });
      korrels(B, t + 0.05, { n: 8, duur: 0.18, fmin: 1500, fmax: 3500, vol: 0.06 });
    },
    // een speeldoosje met een cadeautje
    cadeau() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      [784, 988, 1175, 1568].forEach((f, i) => modaal(B, t + i * 0.11, f, SPEELDOOS, 0.13, -0.3 + i * 0.2));
      stoot(B, t + 0.05, { duur: 0.3, type: 'highpass', f: 7000, q: 0.7, aanzet: 0.08, vol: 0.03 });
    },
    // een duif die koert
    koer() {
      const B = bron(); if (!B) return;
      [0, 0.44].forEach((w) => {
        const t = nu(B, w);
        glij(B, t, { golf: 'triangle', f1: 390, f2: 330, duur: 0.34, vol: 0.28, aanzet: 0.05, vib: 30, vibF: 11, formanten: [[460, 2.2, 0.6], [900, 3, 0.15]] });
      });
    },
    // een eend die twee keer kwaakt
    kwak() {
      const B = bron(); if (!B) return;
      [0, 0.2].forEach((w, i) => glij(B, nu(B, w), { golf: 'sawtooth', f1: 340 - i * 30, f2: 245 - i * 20, duur: 0.15, vol: 0.42, aanzet: 0.012, ruw: 34, formanten: [[1100, 3.2, 0.5], [2600, 5, 0.25]] }));
    },
    // kaarten: een kaart neerleggen, delen en schudden
    kaart() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.032, type: 'highpass', f: 1800, q: 0.7, vol: 0.22, pan: rnd(-0.1, 0.1) });
      glij(B, t, { f1: 185, f2: 120, duur: 0.03, vol: 0.1 });
    },
    deel() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.05, type: 'bandpass', f: 3400, q: 0.8, aanzet: 0.006, vol: 0.15, pan: -0.3, pan2: 0.3 });
      stoot(B, t + 0.035, { duur: 0.02, type: 'highpass', f: 1800, q: 0.7, vol: 0.08, pan: 0.3 });
    },
    schud() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      for (let i = 0; i < 30; i++) stoot(B, t + i * 0.012 + rnd(0, 0.003), { duur: 0.008, f: rnd(2500, 4600), q: 1.4, vol: rnd(0.04, 0.09), pan: -0.25 + i * 0.017 });
      stoot(B, t + 0.4, { duur: 0.26, type: 'bandpass', f: 2000, q: 0.8, aanzet: 0.05, vol: 0.09 });
    },
    // iemand op straat fluit een deuntje
    fluit() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      glij(B, t, { f1: 1150, f2: 1520, duur: 0.2, vol: 0.07, aanzet: 0.03, vib: 14, vibF: 6, glijOp: 0.8 });
      glij(B, t + 0.2, { f1: 1520, f2: 1260, duur: 0.18, vol: 0.06, aanzet: 0.01, vib: 14, vibF: 6 });
      stoot(B, t, { duur: 0.36, type: 'bandpass', f: 1400, q: 2, aanzet: 0.03, vol: 0.012 });
    },
    // de kat
    miauw() {
      const B = bron(); if (!B) return;
      const c = B.c, t = nu(B);
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(520, t);
      o.frequency.linearRampToValueAtTime(860, t + 0.18);
      o.frequency.linearRampToValueAtTime(470, t + 0.62);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * schaal, t + 0.06);
      g.gain.setValueAtTime(0.45 * schaal, t + 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      const naar = uitgang(B, 1 / schaal, 0.2, undefined, 0, t);
      [[900, 1500, 800, 2.2, 0.5], [2200, 2900, 2000, 4, 0.2]].forEach(([a, b, e, q, v]) => {
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
        f.frequency.setValueAtTime(a, t); f.frequency.linearRampToValueAtTime(b, t + 0.2); f.frequency.linearRampToValueAtTime(e, t + 0.6);
        const fg = c.createGain(); fg.gain.value = v;
        g.connect(f); f.connect(fg); fg.connect(naar);
      });
      o.connect(g); o.start(t); o.stop(t + 0.75);
    },
    // de stok tikt tegen de houten hoepel; de belletjes aan de hoepel schudden mee
    hoepel(kracht) {
      const B = bron(); if (!B) return;
      const t = nu(B), k = klem(kracht === undefined ? 0.7 : kracht, 0, 1);
      raak(B, t, HOUT, rnd(900, 1040), 0.12 + 0.16 * k, rnd(-0.1, 0.1), 2600, 0.55);
      modaal(B, t, rnd(230, 260), [[1, 1, 0.05], [2.6, 0.3, 0.02]], 0.08 + 0.06 * k);
      [0, 1].forEach((i) => modaal(B, t + 0.012 + i * rnd(0.018, 0.04), rnd(2900, 3900), BELLETJE.map(([r, a, d]) => [r, a, d * 0.45]), 0.02 + 0.03 * k, rnd(-0.25, 0.25)));
    },
    // de belletjes aan een rollende hoepel
    rinkel(kracht, pan) {
      const B = bron(); if (!B) return;
      const t = nu(B), k = klem(kracht === undefined ? 0.5 : kracht, 0, 1), n = k > 0.6 ? 3 : 2;
      for (let i = 0; i < n; i++) modaal(B, t + i * rnd(0.02, 0.05), rnd(3000, 4300), BELLETJE.map(([r, a, d]) => [r, a, d * 0.35]), 0.012 + 0.024 * k, (pan || 0) + rnd(-0.2, 0.2));
    },
    // een hoepel die omvalt en uitdraait op de klinkers: steeds snellere tikjes
    kletter() {
      const B = bron(); if (!B) return;
      let t = nu(B), gat = 0.16, v = 0.22;
      for (let i = 0; i < 9; i++) {
        raak(B, t, HOUT, rnd(760, 900), v, rnd(-0.15, 0.15), 2400, 0.5);
        if (i % 3 === 0) modaal(B, t + 0.01, rnd(2900, 3800), BELLETJE.map(([r, a, d]) => [r, a, d * 0.4]), v * 0.25, rnd(-0.2, 0.2));
        t += gat; gat *= 0.74; v *= 0.84;
      }
      stoot(B, nu(B), { duur: 0.5, type: 'lowpass', f: 700, f2: 300, q: 0.6, vol: 0.06 });
    },
    // door een plas: een spat en wat druppels
    spat() {
      const B = bron(); if (!B) return;
      const t = nu(B);
      stoot(B, t, { duur: 0.3, type: 'lowpass', f: 3200, f2: 600, q: 0.6, aanzet: 0.003, vol: 0.22 });
      stoot(B, t, { duur: 0.12, type: 'bandpass', f: 1500, q: 0.9, vol: 0.1 });
      for (let i = 0; i < 4; i++) glij(B, t + rnd(0.06, 0.3), { f1: rnd(500, 700), f2: rnd(1200, 1800), duur: 0.035, vol: 0.035, pan: rnd(-0.3, 0.3) });
    },
    // een voetstap op de klinkers: een klomp klakt, een schoen klopt zacht
    voet(soort, pan) {
      const B = bron(); if (!B) return;
      const t = nu(B);
      if (soort === 'klomp') {
        raak(B, t, HOUT_DOF, rnd(330, 400), 0.16, pan || 0, 1500, 0.5);
        modaal(B, t, rnd(1150, 1350), [[1, 1, 0.018], [2.4, 0.3, 0.008]], 0.05, pan || 0);
      } else {
        stoot(B, t, { duur: 0.05, type: 'lowpass', f: 700, q: 0.7, vol: 0.12, pan: pan || 0 });
        modaal(B, t, rnd(140, 170), [[1, 1, 0.04]], 0.1, pan || 0);
      }
    },
    // het rollen van een houten hoepel over de klinkers, zolang hij rolt (zet de vaart, en stop aan het eind)
    rollen() {
      const leeg = { zet() {}, stop() {} };
      const B = bron(); if (!B) return leeg;
      const c = B.c, t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = B.k.ruis; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 240; bp.Q.value = 0.9;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.5;
      const am = c.createGain(); am.gain.value = 0.62;
      const lfo = c.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 20;
      const diep = c.createGain(); diep.gain.value = 0.38;
      lfo.connect(diep); diep.connect(am.gain);
      const g = c.createGain(); g.gain.value = 0;
      src.connect(bp); bp.connect(lp); lp.connect(am); am.connect(g); g.connect(uitgang(B, 1, 0));
      src.start(t, Math.random()); lfo.start(t);
      let weg = false;
      return {
        zet(v) {
          if (weg) return;
          const n = c.currentTime, k = klem(v / 5, 0, 1.25);
          g.gain.setTargetAtTime(k * 0.2, n, 0.06);
          lfo.frequency.setTargetAtTime(6 + v * 8.5, n, 0.08);
          bp.frequency.setTargetAtTime(170 + v * 38, n, 0.1);
        },
        stop() {
          if (weg) return;
          weg = true;
          const n = c.currentTime;
          g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0, n, 0.05);
          try { src.stop(n + 0.4); lfo.stop(n + 0.4); } catch (e) { /* */ }
        }
      };
    }
  };

  // Elk geluid op zijn eigen niveau, afgesteld met opnames: feestjes het luidst, spelgeluiden daaronder,
  // het tikje bij elke aanraking heel zacht (en alles door de zachte begrenzer van het mengpaneel)
  const NIVEAU = {
    dobbel: 0.42, stap: 1.46, hout: 2.1, schuif: 1.9, steen: 1.58, pak: 2.1, klok: 0.72, plons: 1.7, jammer: 0.74, deur: 0.44,
    woesj: 1.8, munt: 1.12, klus: 1.45, tada: 1, tik: 1.6, knik: 3.4, bikkel: 2, stuit: 2.1, vang: 2.8, kolf: 2.05, paal: 1.58,
    hap: 3.9, klap: 1.6, boing: 2.4, tel: 1.86, start: 0.7, gak: 2.1, kling: 2.1, tralies: 1.1, molen: 1.23, plop: 2.1,
    zweep: 0.5, val: 1.78, cadeau: 1.3, koer: 1.1, kwak: 1.7, kaart: 2.7, deel: 2.6, schud: 1.8, fluit: 1.33, miauw: 1.06,
    hoepel: 2.2, rinkel: 2.4, kletter: 1.7, spat: 1.6, voet: 1.5, rollen: 1.4
  };
  Object.keys(window.Geluid).forEach((naam) => {
    const d = Object.getOwnPropertyDescriptor(window.Geluid, naam);
    if (!d || typeof d.value !== 'function' || naam === 'zet') return;
    const kaal = d.value;
    window.Geluid[naam] = function () {
      schaal = NIVEAU[naam] || 1;
      try { return kaal.apply(this, arguments); } finally { schaal = 1; }
    };
  });
})();
