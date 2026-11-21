/* Klank: één gedeelde AudioContext voor geluidseffecten en muziek.
   Op de iPhone gelden twee extra regels:
   1. Geluid mag pas starten na een aanraking; die telt pas bij het loslaten (touchend), niet bij het neerzetten.
   2. De stille-modus-schakelaar dempt Web Audio. Met audioSession 'playback' (iOS 17+) of een
      stil afspelend audio-element (oudere iOS) speelt het geluid toch, zoals bij een video. */
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

  window.Klank = { maak, ontgrendel, get ctx() { return ctx; } };

  // ---------- Geluidseffecten ----------
  let aan = true;
  try { aan = localStorage.getItem('speelhuys.geluid') !== 'uit'; } catch (e) { /* geen opslag */ }

  function context() {
    if (!aan) return null;
    const c = maak();
    if (!c) return null;
    if (c.state === 'suspended') c.resume().catch(() => { /* */ });
    return c;
  }

  function ruis(duur, freq, q, volume, wanneer) {
    const c = context(); if (!c) return;
    const t = c.currentTime + (wanneer || 0);
    const len = Math.max(1, Math.floor(c.sampleRate * duur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(volume, t);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t);
  }

  function toon(freq, duur, volume, type, wanneer) {
    const c = context(); if (!c) return;
    const t = c.currentTime + (wanneer || 0);
    const o = c.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + duur + 0.05);
  }

  window.Geluid = {
    get aan() { return aan; },
    zet(waarde) {
      aan = waarde;
      try { localStorage.setItem('speelhuys.geluid', aan ? 'aan' : 'uit'); } catch (e) { /* */ }
      if (aan) ontgrendel();
    },
    dobbel() { for (let i = 0; i < 6; i++) ruis(0.05, 1800 + Math.random() * 1500, 4, 0.5, i * 0.06 + Math.random() * 0.03); },
    stap() { ruis(0.04, 900, 3, 0.35); },
    hout(kracht) { const v = Math.min(0.9, 0.15 + (kracht || 0.5)); ruis(0.07, 500 + Math.random() * 200, 2.5, v); toon(180, 0.08, v * 0.25, 'triangle'); },
    schuif() { ruis(0.25, 300, 0.8, 0.12); },
    steen() { ruis(0.05, 2600, 6, 0.6); toon(1400, 0.05, 0.08, 'sine'); },
    pak() { ruis(0.05, 1200, 2, 0.4); },
    klok() { [0, 0.45, 0.9].forEach((w, i) => { toon(660 - i * 110, 1.4, 0.18, 'sine', w); toon(1320 - i * 220, 0.8, 0.05, 'sine', w); }); },
    plons() { ruis(0.5, 400, 0.7, 0.35); },
    jammer() { toon(300, 0.25, 0.1, 'triangle'); toon(220, 0.4, 0.1, 'triangle', 0.22); },
    deur() { ruis(0.6, 220, 1.2, 0.25); toon(140, 0.5, 0.06, 'triangle', 0.05); },
    woesj() { ruis(0.5, 700, 0.6, 0.18); },
    // munten die rinkelen
    munt() {
      for (let i = 0; i < 5; i++) {
        const w = i * 0.075 + Math.random() * 0.02;
        toon(2300 + Math.random() * 700, 0.16, 0.07, 'sine', w);
        toon(3400 + Math.random() * 600, 0.08, 0.03, 'sine', w);
        ruis(0.03, 5000, 4, 0.12, w);
      }
    },
    // schrobben en een glinstering
    klus() {
      for (let i = 0; i < 4; i++) ruis(0.14, 1400 + i * 200, 1.2, 0.22, i * 0.12);
      [1568, 2093, 2637].forEach((f, i) => toon(f, 0.5, 0.06, 'sine', 0.55 + i * 0.09));
    },
    // de kamer is af
    tada() {
      [523, 659, 784, 1047].forEach((f, i) => { toon(f, 0.6, 0.11, 'triangle', i * 0.12); toon(f * 2, 0.4, 0.03, 'sine', i * 0.12); });
      [0.6, 1.0].forEach((w) => toon(1568, 1.2, 0.05, 'sine', w));
    },
    miauw() {
      const c = context(); if (!c) return;
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(520, t);
      o.frequency.linearRampToValueAtTime(860, t + 0.18);
      o.frequency.linearRampToValueAtTime(470, t + 0.62);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.2;
      f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1500, t + 0.2); f.frequency.linearRampToValueAtTime(800, t + 0.6);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.06);
      g.gain.setValueAtTime(0.16, t + 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.75);
    }
  };
})();
