/* Knikkeren: schiet tien knikkers vanaf de streep naar het potje in het zand.
   Daarna mag je met drie duimpjes knikkers die blijven liggen nog in het potje tikken. */
(function () {
  const W = 360, H = 620;
  const RAND = 14;                    // houten rand van de zandbak
  const POT = { x: 180, y: 178, r: 21 };
  const LIJN = 520;
  const RK = 8.5;                     // straal knikker
  const WRIJVING = 250;
  const VANG = 235;                   // langzamer dan dit en hij valt in het potje
  const VMAX = 860;
  const AANTAL = 10, DUIMPJES = 3;

  let veld, paneel, doek, ctx, grond = null, schaal = 1, dpr = 1;
  let knikkers = [], hand = AANTAL, duim = DUIMPJES, fase = 'gooien', vast = null, spoor = [], mik = null;
  let raf = 0, vorigeT = 0, actief = false, gebouwd = false, melding = '', laatsteTik = 0, beloond = false;
  let ui = {};

  const klem = (v, a, b) => Math.max(a, Math.min(b, v));
  const stijl = () => (window.Pronk ? Pronk.stijl('knikkers') : { a: '#E8CFAB', b: '#B88B5C', c: '#7A5432', ader: null, glans: 0.25 });

  // ---------- Natuurkunde ----------
  function tik(kracht) {
    const nu = performance.now();
    if (kracht > 50 && nu - laatsteTik > 40) { laatsteTik = nu; Geluid.knik(Math.min(1, kracht / 600)); if (window.Tril) Tril.bots(kracht / 600); }
  }

  function stap(dt) {
    for (const k of knikkers) {
      if (k.inPot) continue;
      const v = Math.hypot(k.vx, k.vy);
      if (v > 0) {
        const dv = (WRIJVING + v * 0.35) * dt;
        if (v <= dv) { k.vx = 0; k.vy = 0; } else { const f = (v - dv) / v; k.vx *= f; k.vy *= f; }
      }
      k.x += k.vx * dt; k.y += k.vy * dt;
      k.draai += v * dt / RK;
      // rand van de zandbak
      if (k.x < RAND + RK) { k.x = RAND + RK; k.vx = Math.abs(k.vx) * 0.35; tik(k.vx * 2); }
      if (k.x > W - RAND - RK) { k.x = W - RAND - RK; k.vx = -Math.abs(k.vx) * 0.35; tik(-k.vx * 2); }
      if (k.y < RAND + RK) { k.y = RAND + RK; k.vy = Math.abs(k.vy) * 0.35; tik(k.vy * 2); }
      if (k.y > H - RAND - RK) { k.y = H - RAND - RK; k.vy = -Math.abs(k.vy) * 0.35; }
      // het potje
      const dx = POT.x - k.x, dy = POT.y - k.y, d = Math.hypot(dx, dy), snel = Math.hypot(k.vx, k.vy);
      if (d < POT.r - 2) {
        if (snel < VANG) { valIn(k); continue; }
        // te hard: hij rolt over de rand en wijkt een beetje af
        if (!k.lip) {
          const hoek = (Math.random() - 0.5) * 0.9;
          const c = Math.cos(hoek), s = Math.sin(hoek);
          const nx = k.vx * c - k.vy * s, ny = k.vx * s + k.vy * c;
          k.vx = nx * 0.82; k.vy = ny * 0.82; k.lip = true;
        }
      } else {
        k.lip = false;
        // vlak bij het potje rolt een langzame knikker erin, het zand loopt schuin af
        if (d < POT.r + 9 && snel < 90) { k.vx += dx / d * 160 * dt; k.vy += dy / d * 160 * dt; }
      }
    }
    for (let i = 0; i < knikkers.length; i++) {
      const a = knikkers[i]; if (a.inPot) continue;
      for (let j = i + 1; j < knikkers.length; j++) {
        const b = knikkers[j]; if (b.inPot) continue;
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * RK * RK || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (2 * RK - d) / 2;
        a.x += nx * over; a.y += ny * over; b.x -= nx * over; b.y -= ny * over;
        const vrel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vrel < 0) {
          const imp = -(1 + 0.9) * vrel / 2;
          a.vx += imp * nx; a.vy += imp * ny; b.vx -= imp * nx; b.vy -= imp * ny;
          tik(-vrel);
        }
      }
    }
  }

  function valIn(k) {
    k.inPot = true; k.vx = 0; k.vy = 0;
    k.valT = performance.now();
    const n = knikkers.filter((x) => x.inPot).length;
    const hoek = n * 2.4;
    k.px = POT.x + Math.cos(hoek) * (n > 1 ? 7 : 0);
    k.py = POT.y + Math.sin(hoek) * (n > 1 ? 6 : 0);
    Geluid.plop();
    if (window.Tril) Tril.tik();
    werkPaneelBij();
  }

  const stil = () => knikkers.every((k) => k.inPot || (k.vx === 0 && k.vy === 0));
  const buiten = () => knikkers.filter((k) => !k.inPot);
  const inPot = () => knikkers.filter((k) => k.inPot).length;

  // ---------- Spelverloop ----------
  function nieuwSpel() {
    knikkers = []; hand = AANTAL; duim = DUIMPJES; fase = 'gooien'; vast = null; mik = null; beloond = false;
    melding = 'Pak een knikker achter de streep en schiet hem naar het potje.';
    werkPaneelBij();
  }

  function controleerFase() {
    if (!stil() || vast || mik) return;
    if (fase === 'gooien' && hand === 0) {
      if (buiten().length && duim > 0) {
        fase = 'duimen';
        melding = `Nog ${duim} duimpjes: trek een knikker naar achteren en laat los.`;
        werkPaneelBij();
      } else klaar();
    } else if (fase === 'duimen' && (duim === 0 || !buiten().length)) {
      klaar();
    }
  }

  function klaar() {
    if (fase === 'klaar') return;
    fase = 'klaar';
    const score = inPot();
    const best = window.Duiten ? Duiten.veld('record-knikkeren', 0) : 0;
    const record = score > best;
    if (record && window.Duiten) Duiten.zetVeld('record-knikkeren', score);
    melding = score === AANTAL ? 'Alle tien in het potje!' : `${score} ${score === 1 ? 'knikker' : 'knikkers'} in het potje.`;
    if (record) Geluid.klok();
    werkPaneelBij();
    if (window.Duiten && !beloond) {
      beloond = true;
      Duiten.beloon({ spel: 'knikkeren', bedrag: 10 + score * 4, gewonnen: record || score >= 6, tekst: record ? `${score} in het potje · record!` : `${score} in het potje` });
    }
  }

  // ---------- Invoer ----------
  function naarBord(e) {
    const r = doek.getBoundingClientRect();
    return { x: (e.clientX - r.left) / schaal, y: (e.clientY - r.top) / schaal, t: performance.now() };
  }

  function neer(e) {
    if (fase === 'klaar') return;
    const p = naarBord(e);
    if (fase === 'gooien') {
      if (vast || hand <= 0 || !stil() || p.y < LIJN - 40) return;
      e.preventDefault();
      if (doek.setPointerCapture) doek.setPointerCapture(e.pointerId);
      hand--;
      vast = { x: klem(p.x, RAND + RK, W - RAND - RK), y: klem(p.y, LIJN + RK + 2, H - RAND - RK), kleur: Math.random() };
      spoor = [p];
      Geluid.pak();
      werkPaneelBij();
    } else if (fase === 'duimen') {
      if (!stil() || duim <= 0) return;
      let beste = null, bd = 34;
      buiten().forEach((k) => { const d = Math.hypot(k.x - p.x, k.y - p.y); if (d < bd) { bd = d; beste = k; } });
      if (!beste) return;
      e.preventDefault();
      if (doek.setPointerCapture) doek.setPointerCapture(e.pointerId);
      mik = { k: beste, x: p.x, y: p.y };
      Geluid.pak();
    }
  }

  function beweeg(e) {
    const p = naarBord(e);
    if (vast) {
      spoor.push(p); if (spoor.length > 12) spoor.shift();
      vast.x = klem(p.x, RAND + RK, W - RAND - RK);
      vast.y = klem(p.y, LIJN + RK + 2, H - RAND - RK);
      if (p.y < LIJN - 6) los();
    } else if (mik) {
      mik.x = p.x; mik.y = p.y;
    }
  }

  function los() {
    if (vast) {
      const nu = performance.now();
      const recent = spoor.filter((q) => nu - q.t < 110);
      let vx = 0, vy = 0;
      if (recent.length >= 2) {
        const a = recent[0], b = recent[recent.length - 1], dt = Math.max(0.016, (b.t - a.t) / 1000);
        vx = (b.x - a.x) / dt * 0.85; vy = (b.y - a.y) / dt * 0.85;
      }
      if (vy > -80) {
        hand++; vast = null; spoor = [];
        melding = 'Te zacht. Schiet de knikker met een vlotte beweging naar voren.';
        werkPaneelBij();
        return;
      }
      const v = Math.hypot(vx, vy);
      if (v > VMAX) { vx *= VMAX / v; vy *= VMAX / v; }
      knikkers.push({ x: vast.x, y: vast.y, vx, vy, inPot: false, draai: Math.random() * 6, kleur: vast.kleur });
      vast = null; spoor = [];
      melding = hand ? `Nog ${hand} in je hand.` : 'Laatste knikker!';
      Geluid.schuif();
      if (window.Tril) Tril.tik();
      werkPaneelBij();
    } else if (mik) {
      const k = mik.k, tx = k.x - mik.x, ty = k.y - mik.y, l = Math.hypot(tx, ty);
      if (l > 12) {
        const kracht = Math.min(l, 120) * 5.2;
        k.vx = tx / l * kracht; k.vy = ty / l * kracht;
        duim--;
        melding = duim ? `Nog ${duim} ${duim === 1 ? 'duimpje' : 'duimpjes'}.` : 'Laatste duimpje!';
        Geluid.knik(0.8);
        if (window.Tril) Tril.klik();
        werkPaneelBij();
      }
      mik = null;
    }
  }

  // ---------- Tekenen ----------
  function maakGrond() {
    const c = document.createElement('canvas');
    c.width = Math.round(W * schaal * dpr); c.height = Math.round(H * schaal * dpr);
    const g = c.getContext('2d');
    g.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    // houten rand
    const rg = g.createLinearGradient(0, 0, W, H);
    rg.addColorStop(0, '#7A5230'); rg.addColorStop(1, '#4E321A');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 3 + i * 2.2); g.lineTo(W, 2 + i * 2.2); g.stroke(); }
    // zand
    const zg = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H / 2, H * 0.7);
    zg.addColorStop(0, '#E2C893'); zg.addColorStop(1, '#C9A86E');
    g.fillStyle = zg; g.fillRect(RAND, RAND, W - 2 * RAND, H - 2 * RAND);
    let zaad = 7;
    const rnd = () => { zaad = (zaad * 16807) % 2147483647; return (zaad - 1) / 2147483646; };
    for (let i = 0; i < 2600; i++) {
      const x = RAND + rnd() * (W - 2 * RAND), y = RAND + rnd() * (H - 2 * RAND);
      g.fillStyle = rnd() > 0.5 ? 'rgba(120, 88, 40, .22)' : 'rgba(255, 245, 220, .3)';
      g.fillRect(x, y, 1 + rnd() * 1.2, 1 + rnd() * 1.2);
    }
    for (let i = 0; i < 14; i++) {
      const x = RAND + 20 + rnd() * (W - 2 * RAND - 40), y = RAND + 20 + rnd() * (H - 2 * RAND - 40);
      g.fillStyle = `rgba(${130 + rnd() * 40}, ${110 + rnd() * 30}, ${90 + rnd() * 20}, .8)`;
      g.beginPath(); g.ellipse(x, y, 2 + rnd() * 3, 1.5 + rnd() * 2, rnd() * 3, 0, Math.PI * 2); g.fill();
    }
    // het potje: een kuiltje in het zand
    const pg = g.createRadialGradient(POT.x - 4, POT.y - 5, 2, POT.x, POT.y, POT.r + 10);
    pg.addColorStop(0, '#3E2A14'); pg.addColorStop(0.55, '#6E4E26'); pg.addColorStop(0.8, '#B08A52'); pg.addColorStop(1, 'rgba(201, 168, 110, 0)');
    g.fillStyle = pg; g.beginPath(); g.arc(POT.x, POT.y, POT.r + 10, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255, 240, 210, .45)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(POT.x, POT.y, POT.r + 1, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    // streep in het zand
    g.strokeStyle = 'rgba(90, 60, 25, .5)'; g.lineWidth = 2.5; g.setLineDash([9, 7]);
    g.beginPath(); g.moveTo(RAND + 8, LIJN); g.lineTo(W - RAND - 8, LIJN + 2); g.stroke(); g.setLineDash([]);
    g.font = '13px "IM Fell English SC", Georgia, serif'; g.fillStyle = 'rgba(90, 60, 25, .65)'; g.textAlign = 'center';
    g.fillText('streep', W / 2, LIJN + 18);
    // binnenschaduw van de rand
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 4; g.strokeRect(RAND + 2, RAND + 2, W - 2 * RAND - 4, H - 2 * RAND - 4);
    grond = c;
  }

  function tekenKnikker(x, y, r, k, opgetild, schaduw) {
    const s = stijl();
    if (schaduw !== false) {
      ctx.fillStyle = 'rgba(60, 35, 10, .3)';
      ctx.beginPath(); ctx.ellipse(x + (opgetild ? 5 : 2), y + (opgetild ? 6 : 2.5), r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    }
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, s.a); gr.addColorStop(0.6, s.b); gr.addColorStop(1, s.c);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const hoek = (k && k.draai) || 0;
    if (s.ader) {
      ctx.strokeStyle = s.ader; ctx.lineWidth = r * 0.42; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(hoek) * r, y + Math.sin(hoek) * r);
      ctx.quadraticCurveTo(x + Math.cos(hoek + 2) * r * 0.2, y + Math.sin(hoek + 2) * r * 0.2, x + Math.cos(hoek + Math.PI) * r, y + Math.sin(hoek + Math.PI) * r);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(90, 60, 30, .35)';
      for (let i = 0; i < 3; i++) { const a = hoek + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.13, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
    ctx.fillStyle = `rgba(255,255,255,${s.glans})`;
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.42, r * 0.32, r * 0.2, -0.6, 0, Math.PI * 2); ctx.fill();
  }

  function teken() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, doek.width, doek.height);
    if (grond) ctx.drawImage(grond, 0, 0, W * schaal, H * schaal);
    ctx.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    // knikkers in het potje
    const nu = performance.now();
    knikkers.filter((k) => k.inPot).forEach((k) => {
      const t = Math.min(1, (nu - k.valT) / 260);
      const r = RK * (1 - 0.25 * t);
      ctx.globalAlpha = 1 - 0.3 * t;
      tekenKnikker(k.px, k.py, r, k, false, false);
      ctx.globalAlpha = 1;
    });
    // mikken bij een duimpje
    if (mik) {
      const k = mik.k, tx = k.x - mik.x, ty = k.y - mik.y, l = Math.min(Math.hypot(tx, ty), 120);
      if (l > 4) {
        const a = Math.atan2(ty, tx);
        ctx.strokeStyle = 'rgba(28, 52, 115, .8)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x + Math.cos(a) * l * 1.6, k.y + Math.sin(a) * l * 1.6); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(90, 60, 25, .6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(mik.x, mik.y); ctx.stroke();
      }
    }
    knikkers.filter((k) => !k.inPot).forEach((k) => tekenKnikker(k.x, k.y, RK, k));
    if (fase === 'duimen' && stil() && !mik) {
      buiten().forEach((k) => {
        ctx.strokeStyle = 'rgba(242, 193, 78, .9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(k.x, k.y, RK + 5 + Math.sin(nu / 250) * 1.5, 0, Math.PI * 2); ctx.stroke();
      });
    }
    if (vast) tekenKnikker(vast.x, vast.y, RK * 1.08, vast, true);
    else if (fase === 'gooien' && hand > 0 && stil()) {
      ctx.globalAlpha = 0.5; tekenKnikker(W / 2, H - 52, RK, null); ctx.globalAlpha = 1;
    }
    // tellers
    ctx.font = '15px "IM Fell English", Georgia, serif'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(70, 45, 15, .85)'; ctx.textAlign = 'left';
    ctx.fillText(fase === 'duimen' ? `Duimpjes: ${duim}` : `In de hand: ${hand}`, RAND + 10, H - RAND - 14);
    ctx.textAlign = 'right';
    ctx.fillText(`Potje: ${inPot()}`, W - RAND - 10, H - RAND - 14);
  }

  function lus(t) {
    if (!actief) return;
    const dt = Math.min(0.05, (t - (vorigeT || t)) / 1000);
    vorigeT = t;
    let rest = dt;
    while (rest > 0) { const h = Math.min(1 / 240, rest); stap(h); rest -= h; }
    controleerFase();
    teken();
    raf = requestAnimationFrame(lus);
  }

  function pasGrootteAan() {
    const beschikbaar = veld.clientWidth || W;
    const boven = veld.getBoundingClientRect().top + window.scrollY;
    const hoogte = Math.max(440, window.innerHeight - boven - 16);
    schaal = Math.min(beschikbaar / W, hoogte / H, 1.3);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    doek.style.width = (W * schaal) + 'px';
    doek.style.height = (H * schaal) + 'px';
    doek.width = Math.round(W * schaal * dpr);
    doek.height = Math.round(H * schaal * dpr);
    maakGrond();
  }

  // ---------- Paneel ----------
  function bouwPaneel() {
    paneel.innerHTML = `
      <p class="status" id="kn-status" aria-live="polite"></p>
      <div class="score-rij"><span class="groot-getal" id="kn-score">0</span><span class="klein" id="kn-best"></span></div>
      <p class="klein">knikkers in het potje, van de ${AANTAL}</p>
      <div class="knoppen"><button class="knop" id="kn-nieuw" type="button">Opnieuw beginnen</button></div>
      <details>
        <summary>Speelregels</summary>
        <ul>
          <li>Je hebt tien knikkers. Schiet ze een voor een vanaf de streep naar het potje.</li>
          <li>Rolt een knikker te hard, dan springt hij over het potje heen.</li>
          <li>Daarna krijg je drie duimpjes: trek een knikker die nog in het zand ligt naar achteren en laat los.</li>
          <li>Elke knikker in het potje telt.</li>
        </ul>
      </details>
      <p class="geschiedenis">Knikkeren is eeuwenoud. Op Delftse tegels uit de 17e eeuw zie je jongens knikkeren, en ook op de gravure <i>Kinder-spel</i> van Adriaen van de Venne (1625). De knikkers waren toen van gebakken klei; glazen knikkers kwamen pas in de 19e eeuw.</p>
    `;
    ui.status = paneel.querySelector('#kn-status');
    ui.score = paneel.querySelector('#kn-score');
    ui.best = paneel.querySelector('#kn-best');
    paneel.querySelector('#kn-nieuw').addEventListener('click', () => { nieuwSpel(); doek.focus({ preventScroll: true }); });
  }

  function werkPaneelBij() {
    if (!ui.status) return;
    ui.status.textContent = melding;
    ui.score.textContent = inPot();
    const best = window.Duiten ? Duiten.veld('record-knikkeren', 0) : 0;
    ui.best.textContent = best ? `Beste: ${best}` : '';
  }

  // ---------- Uitleg door Gijs de gans ----------
  function punt(x, y) { const r = doek.getBoundingClientRect(); return [r.left + x * schaal, r.top + y * schaal]; }
  function vak(x, y, b, h) { const r = doek.getBoundingClientRect(); return { left: r.left + x * schaal, top: r.top + y * schaal, width: b * schaal, height: h * schaal }; }
  if (window.Les) {
    Les.zet('knikkeren', () => [
      { doel: () => vak(RAND, LIJN, W - 2 * RAND, H - LIJN - RAND), gebaar: 'veeg', van: () => punt(W / 2, H - 50), naar: () => punt(W / 2, LIJN - 70), voorwerp: 'knikker', tekst: 'Pak een knikker en schiet' },
      { doel: () => vak(POT.x - 34, POT.y - 34, 68, 68), vorm: 'rond', gebaar: 'wijs', tekst: 'Mik op het potje' },
      { doel: () => vak(POT.x - 70, POT.y + 60, 140, 120), gebaar: 'veeg', van: () => punt(POT.x + 6, POT.y + 130), naar: () => punt(POT.x + 6, POT.y + 175), voorwerp: 'knikker', tekst: 'Duimpje: trek naar achteren' }
    ]);
  }

  window.Spellen = window.Spellen || {};
  window.Spellen.knikkeren = {
    start() {
      veld = document.getElementById('kn-veld');
      paneel = document.getElementById('kn-paneel');
      if (!gebouwd) {
        doek = document.createElement('canvas');
        doek.className = 'sjoel-doek knikker-doek';
        doek.tabIndex = 0;
        doek.setAttribute('role', 'application');
        doek.setAttribute('aria-label', 'Zandbak met een potje. Sleep een knikker vanaf de streep naar voren om te schieten.');
        veld.appendChild(doek);
        ctx = doek.getContext('2d');
        doek.addEventListener('pointerdown', neer);
        doek.addEventListener('pointermove', beweeg);
        doek.addEventListener('pointerup', los);
        doek.addEventListener('pointercancel', los);
        window.addEventListener('resize', () => { if (actief) pasGrootteAan(); });
        bouwPaneel();
        nieuwSpel();
        gebouwd = true;
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (actief) maakGrond(); });
      }
      actief = true;
      pasGrootteAan();
      werkPaneelBij();
      vorigeT = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(lus);
      if (window.Les) Les.eersteKeer('knikkeren');
    },
    stop() { actief = false; cancelAnimationFrame(raf); if (vast) { hand++; vast = null; } mik = null; },
    opnieuw() { nieuwSpel(); if (doek) doek.focus({ preventScroll: true }); }
  };
})();
