/* Eenvoudige geluiden, opgewekt met Web Audio (geen geluidsbestanden nodig). */
(function () {
  let ctx = null;
  let aan = true;
  try { aan = localStorage.getItem('speelhuys.geluid') !== 'uit'; } catch (e) { /* geen opslag */ }

  function context() {
    if (!aan) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
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
    },
    dobbel() { for (let i = 0; i < 6; i++) ruis(0.05, 1800 + Math.random() * 1500, 4, 0.5, i * 0.06 + Math.random() * 0.03); },
    stap() { ruis(0.04, 900, 3, 0.35); },
    hout(kracht) { const v = Math.min(0.9, 0.15 + (kracht || 0.5)); ruis(0.07, 500 + Math.random() * 200, 2.5, v); toon(180, 0.08, v * 0.25, 'triangle'); },
    schuif() { ruis(0.25, 300, 0.8, 0.12); },
    steen() { ruis(0.05, 2600, 6, 0.6); toon(1400, 0.05, 0.08, 'sine'); },
    pak() { ruis(0.05, 1200, 2, 0.4); },
    klok() { [0, 0.45, 0.9].forEach((w, i) => { toon(660 - i * 110, 1.4, 0.18, 'sine', w); toon(1320 - i * 220, 0.8, 0.05, 'sine', w); }); },
    plons() { ruis(0.5, 400, 0.7, 0.35); },
    jammer() { toon(300, 0.25, 0.1, 'triangle'); toon(220, 0.4, 0.1, 'triangle', 0.22); }
  };
})();
