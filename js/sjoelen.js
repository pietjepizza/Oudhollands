/* Sjoelen: houten sjoelbak met eenvoudige natuurkunde. Schijven pak je vast en schuif je naar voren. */
(function () {
  const W = 360, H = 780;
  const L = 24, R = 336, VAK_B = (R - L) / 4;
  const TOP = 22, POORT_Y = 162, POORT_H = 14;
  const WERP_Y = 640, ONDER = H - 14;
  const RS = 13;                 // straal schijf
  const OPENING = 19;            // halve breedte poortje
  const WRIJVING = 240;          // vertraging in eenheden/s²
  const VMAX = 1000;
  const WAARDE = [2, 3, 4, 1];
  const RUST_X = W / 2, RUST_Y = 712;

  let veld, paneel, doek, ctx, bordBeeld = null;
  let schaal = 1, dpr = 1;
  let schijven = [], hand = 30, beurt = 1, klaar = false, gebouwd = false, actief = false;
  let vast = null, spoor = [], mikX = RUST_X, laden = null;
  let raf = 0, vorigeT = 0, laatsteTik = 0, melding = '';
  let ui = {};

  // Vaste obstakels
  const muren = [];
  (function () {
    // poortbalk met vier openingen
    let x = L;
    for (let k = 0; k < 4; k++) {
      const c = L + VAK_B * k + VAK_B / 2;
      muren.push([x, POORT_Y, c - OPENING, POORT_Y + POORT_H]);
      x = c + OPENING;
    }
    muren.push([x, POORT_Y, R, POORT_Y + POORT_H]);
    // schotjes tussen de vakken
    for (let k = 1; k < 4; k++) { const sx = L + VAK_B * k; muren.push([sx - 2.5, TOP, sx + 2.5, POORT_Y]); }
  })();

  // ---------- Natuurkunde ----------
  function botsRechthoek(s, m) {
    const cx = Math.max(m[0], Math.min(s.x, m[2]));
    const cy = Math.max(m[1], Math.min(s.y, m[3]));
    let dx = s.x - cx, dy = s.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= RS * RS) return;
    let d = Math.sqrt(d2), nx, ny;
    if (d < 1e-6) { nx = 0; ny = 1; d = 0; } else { nx = dx / d; ny = dy / d; }
    s.x += nx * (RS - d); s.y += ny * (RS - d);
    const vn = s.vx * nx + s.vy * ny;
    if (vn < 0) {
      s.vx -= 1.45 * vn * nx; s.vy -= 1.45 * vn * ny;
      s.vx *= 0.92; s.vy *= 0.92;
      tik(Math.abs(vn));
    }
  }

  function tik(kracht) {
    const nu = performance.now();
    if (kracht > 60 && nu - laatsteTik > 45) { laatsteTik = nu; Geluid.hout(Math.min(1, kracht / 700)); }
  }

  function stapNatuur(dt) {
    for (const s of schijven) {
      const v = Math.hypot(s.vx, s.vy);
      if (v > 0) {
        const dv = WRIJVING * dt;
        if (v <= dv) { s.vx = 0; s.vy = 0; }
        else { const f = (v - dv) / v; s.vx *= f; s.vy *= f; }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < L + RS) { s.x = L + RS; s.vx = Math.abs(s.vx) * 0.5; tik(s.vx * 2); }
      if (s.x > R - RS) { s.x = R - RS; s.vx = -Math.abs(s.vx) * 0.5; tik(-s.vx * 2); }
      if (s.y < TOP + RS) { s.y = TOP + RS; s.vy = Math.abs(s.vy) * 0.3; tik(s.vy * 3); }
      if (s.y > ONDER - RS) { s.y = ONDER - RS; s.vy = -Math.abs(s.vy) * 0.3; }
      for (const m of muren) botsRechthoek(s, m);
      if (s.vak === null && s.y + RS <= POORT_Y + 0.5) {
        s.vak = Math.max(0, Math.min(3, Math.floor((s.x - L) / VAK_B)));
      }
      if (s.vak !== null && s.y + RS > POORT_Y) { s.y = POORT_Y - RS; s.vy = -Math.abs(s.vy) * 0.3; }
    }
    // schijven onderling
    for (let i = 0; i < schijven.length; i++) {
      const a = schijven[i];
      for (let j = i + 1; j < schijven.length; j++) {
        const b = schijven[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= 4 * RS * RS || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (2 * RS - d) / 2;
        a.x += nx * over; a.y += ny * over; b.x -= nx * over; b.y -= ny * over;
        const vrel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vrel < 0) {
          const j = -(1 + 0.86) * vrel / 2;
          a.vx += j * nx; a.vy += j * ny; b.vx -= j * nx; b.vy -= j * ny;
          tik(-vrel);
        }
      }
    }
  }

  function allesStil() { return schijven.every((s) => s.vx === 0 && s.vy === 0); }

  // ---------- Spelverloop ----------
  function telling() {
    const n = [0, 0, 0, 0];
    schijven.forEach((s) => { if (s.vak !== null) n[s.vak]++; });
    const reeksen = Math.min(...n);
    const rest = n.reduce((som, c, i) => som + (c - reeksen) * WAARDE[i], 0);
    return { n, reeksen, rest, totaal: reeksen * 20 + rest };
  }

  function nieuwSpel() {
    schijven = []; hand = 30; beurt = 1; klaar = false; vast = null; laden = null; mikX = RUST_X;
    melding = 'Pak de schijf onderaan en schuif hem met vaart naar voren.';
    werkPaneelBij();
  }

  function eindeBeurt() {
    const los = schijven.filter((s) => s.vak === null);
    if (beurt < 3 && los.length > 0) {
      schijven = schijven.filter((s) => s.vak !== null);
      hand = los.length; beurt++;
      melding = `Beurt ${beurt} van 3: ${hand} ${hand === 1 ? 'schijf' : 'schijven'} terug in de hand.`;
      Geluid.schuif();
    } else {
      klaar = true;
      const t = telling();
      let best = 0;
      try { best = Number(localStorage.getItem('speelhuys.sjoelen.best') || 0); } catch (e) { /* */ }
      if (t.totaal > best) {
        try { localStorage.setItem('speelhuys.sjoelen.best', String(t.totaal)); } catch (e) { /* */ }
        melding = `Klaar! ${t.totaal} punten, je beste worp tot nu toe.`;
        Geluid.klok();
      } else {
        melding = `Klaar! ${t.totaal} punten. Je beste is ${best}.`;
      }
    }
    werkPaneelBij();
  }

  // ---------- Invoer ----------
  function naarBord(e) {
    const rect = doek.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / schaal, y: (e.clientY - rect.top) / schaal, t: performance.now() };
  }
  const klem = (v, a, b) => Math.max(a, Math.min(b, v));

  function pakVast(e) {
    if (klaar || vast || hand <= 0) return;
    const p = naarBord(e);
    if (p.y < WERP_Y - 40) return;
    e.preventDefault();
    doek.setPointerCapture && doek.setPointerCapture(e.pointerId);
    hand--;
    vast = { x: klem(p.x, L + RS, R - RS), y: klem(p.y, WERP_Y + RS + 2, ONDER - RS) };
    spoor = [p];
    Geluid.pak();
    werkPaneelBij();
  }

  function beweeg(e) {
    if (!vast) return;
    const p = naarBord(e);
    spoor.push(p);
    if (spoor.length > 12) spoor.shift();
    vast.x = klem(p.x, L + RS, R - RS);
    vast.y = klem(p.y, WERP_Y + RS + 2, ONDER - RS);
    if (p.y < WERP_Y - 6) laatLos();
  }

  function laatLos() {
    if (!vast) return;
    const nu = performance.now();
    const recent = spoor.filter((p) => nu - p.t < 110);
    let vx = 0, vy = 0;
    if (recent.length >= 2) {
      const a = recent[0], b = recent[recent.length - 1];
      const dt = Math.max(0.016, (b.t - a.t) / 1000);
      vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt;
    }
    if (vy > -90) {
      // te weinig vaart: schijf terug in de hand
      hand++; vast = null; spoor = [];
      melding = 'Te zacht. Schuif de schijf met een vlotte beweging naar voren.';
      werkPaneelBij();
      return;
    }
    const v = Math.hypot(vx, vy);
    if (v > VMAX) { vx *= VMAX / v; vy *= VMAX / v; }
    schijven.push({ x: vast.x, y: vast.y, vx, vy, vak: null });
    vast = null; spoor = [];
    melding = '';
    Geluid.schuif();
    werkPaneelBij();
  }

  function toets(e) {
    if (klaar || vast) return;
    if (e.key === 'ArrowLeft') { mikX = klem(mikX - 8, L + RS, R - RS); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { mikX = klem(mikX + 8, L + RS, R - RS); e.preventDefault(); }
    else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && hand > 0 && laden === null) { laden = performance.now(); e.preventDefault(); }
  }
  function toetsLos(e) {
    if ((e.key === ' ' || e.key === 'Enter') && laden !== null) {
      e.preventDefault();
      const kracht = laadKracht();
      laden = null;
      hand--;
      schijven.push({ x: mikX, y: RUST_Y, vx: (Math.random() - 0.5) * 12, vy: -(420 + kracht * 420), vak: null });
      melding = '';
      Geluid.schuif();
      werkPaneelBij();
    }
  }
  function laadKracht() {
    if (laden === null) return 0;
    const t = ((performance.now() - laden) / 1400) % 2;
    return t < 1 ? t : 2 - t;
  }

  // ---------- Tekenen ----------
  function maakBord() {
    const c = document.createElement('canvas');
    c.width = Math.round(W * schaal * dpr); c.height = Math.round(H * schaal * dpr);
    const g = c.getContext('2d');
    g.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    // rand van donker hout
    const rg = g.createLinearGradient(0, 0, W, 0);
    rg.addColorStop(0, '#4E2F18'); rg.addColorStop(.5, '#6E4524'); rg.addColorStop(1, '#4E2F18');
    g.fillStyle = rg; roundRect(g, 0, 0, W, H, 10); g.fill();
    // speelvlak
    const sg = g.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, '#CFA46B'); sg.addColorStop(.5, '#DDB683'); sg.addColorStop(1, '#D3A970');
    g.fillStyle = sg; g.fillRect(L, TOP - 8, R - L, ONDER - TOP + 8);
    // houtnerf
    let zaad = 11;
    const rnd = () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280; };
    g.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x0 = L + rnd() * (R - L);
      g.strokeStyle = `rgba(110, 66, 28, ${0.05 + rnd() * 0.09})`;
      g.beginPath(); g.moveTo(x0, TOP - 8);
      for (let y = TOP; y <= ONDER; y += 40) g.lineTo(x0 + Math.sin(y / 90 + i) * (2 + rnd() * 4), y);
      g.stroke();
    }
    // glans
    const gl = g.createLinearGradient(L, 0, R, 0);
    gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.35, 'rgba(255,248,230,.18)'); gl.addColorStop(.5, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.fillRect(L, TOP - 8, R - L, ONDER - TOP + 8);
    // vakken iets donkerder
    g.fillStyle = 'rgba(80, 45, 15, .12)'; g.fillRect(L, TOP - 8, R - L, POORT_Y - TOP + 8);
    // cijfers
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '46px "IM Fell English", Georgia, serif';
    for (let k = 0; k < 4; k++) {
      g.fillStyle = 'rgba(255, 246, 225, .55)';
      g.fillText(String(WAARDE[k]), L + VAK_B * k + VAK_B / 2, 66);
    }
    // poortbalk en schotjes
    for (const m of muren) {
      const bg = g.createLinearGradient(0, m[1], 0, m[3]);
      bg.addColorStop(0, '#7A4C27'); bg.addColorStop(1, '#4A2B14');
      g.fillStyle = bg; g.fillRect(m[0], m[1], m[2] - m[0], m[3] - m[1]);
      g.fillStyle = 'rgba(255,230,190,.25)'; g.fillRect(m[0], m[1], m[2] - m[0], 1.5);
    }
    // werpstreep
    g.strokeStyle = 'rgba(60, 30, 10, .55)'; g.lineWidth = 2; g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(L + 4, WERP_Y); g.lineTo(R - 4, WERP_Y); g.stroke(); g.setLineDash([]);
    g.font = '13px "IM Fell English SC", Georgia, serif'; g.fillStyle = 'rgba(60, 30, 10, .6)';
    g.fillText('werpstreep', W / 2, WERP_Y + 14);
    // binnenschaduw van de rand
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.strokeRect(L + 1.5, TOP - 6.5, R - L - 3, ONDER - TOP + 5);
    bordBeeld = c;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function tekenSchijf(x, y, opgetild, geest) {
    const g = ctx;
    g.save();
    if (geest) g.globalAlpha = 0.45;
    g.fillStyle = 'rgba(40, 20, 5, .35)';
    g.beginPath(); g.ellipse(x + (opgetild ? 5 : 2), y + (opgetild ? 6 : 2.5), RS, RS, 0, 0, Math.PI * 2); g.fill();
    const r = opgetild ? RS * 1.06 : RS;
    const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    gr.addColorStop(0, '#F6DDB0'); gr.addColorStop(.7, '#D9A866'); gr.addColorStop(1, '#A8743C');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(90, 50, 20, .55)'; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.arc(x, y, r * .6, 0, Math.PI * 2); g.strokeStyle = 'rgba(120, 70, 30, .3)'; g.stroke();
    g.restore();
  }

  function teken() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, doek.width, doek.height);
    if (bordBeeld) ctx.drawImage(bordBeeld, 0, 0, W * schaal, H * schaal);
    ctx.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    for (const s of schijven) tekenSchijf(s.x, s.y, false);
    if (vast) tekenSchijf(vast.x, vast.y, true);
    else if (!klaar && hand > 0 && allesStil()) tekenSchijf(mikX, RUST_Y, false, true);
    // stapel in de hand
    ctx.save();
    ctx.font = '15px "IM Fell English", Georgia, serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(60, 30, 10, .75)';
    ctx.fillText(`In de hand: ${hand}`, L + 8, ONDER - 16);
    ctx.textAlign = 'right';
    ctx.fillText(`Beurt ${beurt} van 3`, R - 8, ONDER - 16);
    if (laden !== null) {
      const k = laadKracht();
      ctx.fillStyle = 'rgba(40,20,5,.3)'; ctx.fillRect(R - 16, WERP_Y + 20, 8, 80);
      ctx.fillStyle = '#1C3473'; ctx.fillRect(R - 16, WERP_Y + 100 - 80 * k, 8, 80 * k);
    }
    if (!vast && !klaar && hand > 0 && schijven.length === 0 && beurt === 1) {
      ctx.textAlign = 'center'; ctx.font = 'italic 15px "IM Fell English", Georgia, serif';
      ctx.fillStyle = 'rgba(60, 30, 10, .8)';
      ctx.fillText('Pak de schijf en schuif hem naar voren', W / 2, RUST_Y - 34);
    }
    ctx.restore();
  }

  function lus(t) {
    if (!actief) return;
    const dt = Math.min(0.05, (t - (vorigeT || t)) / 1000);
    vorigeT = t;
    let rest = dt;
    while (rest > 0) { const h = Math.min(1 / 240, rest); stapNatuur(h); rest -= h; }
    // schijven die voor de streep stil blijven liggen gaan terug in de hand
    if (!klaar) {
      const terug = schijven.filter((s) => s.vx === 0 && s.vy === 0 && s.vak === null && s.y > WERP_Y);
      if (terug.length) {
        schijven = schijven.filter((s) => !terug.includes(s));
        hand += terug.length;
        melding = 'Die schijf haalde de werpstreep niet en gaat terug in de hand.';
        werkPaneelBij();
      }
    }
    const stil = allesStil();
    if (!klaar && !vast && hand === 0 && stil && laden === null) eindeBeurt();
    if (stil !== lus.vorigStil) { lus.vorigStil = stil; werkPaneelBij(); }
    teken();
    raf = requestAnimationFrame(lus);
  }

  function pasGrootteAan() {
    const beschikbaar = veld.clientWidth || W;
    const boven = veld.getBoundingClientRect().top + window.scrollY;
    const hoogte = Math.max(460, window.innerHeight - boven - 16);
    schaal = Math.min(beschikbaar / W, hoogte / H, 1.25);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    doek.style.width = (W * schaal) + 'px';
    doek.style.height = (H * schaal) + 'px';
    doek.width = Math.round(W * schaal * dpr);
    doek.height = Math.round(H * schaal * dpr);
    maakBord();
  }

  // ---------- Paneel ----------
  function bouwPaneel() {
    paneel.innerHTML = `
      <p class="status" id="sj-status" aria-live="polite"></p>
      <div class="score-rij"><span class="groot-getal" id="sj-totaal">0</span><span class="klein" id="sj-best"></span></div>
      <table class="score-tabel">
        <thead><tr><th scope="col">Vak</th><th scope="col">2</th><th scope="col">3</th><th scope="col">4</th><th scope="col">1</th></tr></thead>
        <tbody><tr><th scope="row">Schijven</th><td id="sj-n0">0</td><td id="sj-n1">0</td><td id="sj-n2">0</td><td id="sj-n3">0</td></tr></tbody>
      </table>
      <p class="klein" id="sj-uitleg"></p>
      <div class="knoppen"><button class="knop" id="sj-nieuw" type="button">Opnieuw beginnen</button></div>
      <details>
        <summary>Speelregels</summary>
        <ul>
          <li>Je hebt 30 schijven en drie beurten.</li>
          <li>Schijven die na een beurt nog op het speelvlak liggen, mag je in de volgende beurt opnieuw schuiven.</li>
          <li>Een volle reeks (één schijf in elk vak) is 20 punten waard.</li>
          <li>Losse schijven tellen de waarde van hun vak: 2, 3, 4 of 1.</li>
          <li>Een schijf telt alleen als hij helemaal door het poortje is.</li>
          <li>Toetsenbord: pijltjes om te mikken, spatie ingedrukt houden voor kracht.</li>
        </ul>
      </details>
      <p class="geschiedenis">De sjoelbak ontstond waarschijnlijk aan het eind van de 19e eeuw in Nederland en werd een vast onderdeel van kerst en oud en nieuw in de huiskamer. Sinds 1977 is sjoelen een wedstrijdsport onder de Algemene Nederlandse Sjoelbond. In Duitsland heet hetzelfde spel Jakkolo.</p>
    `;
    ui.status = paneel.querySelector('#sj-status');
    ui.totaal = paneel.querySelector('#sj-totaal');
    ui.best = paneel.querySelector('#sj-best');
    ui.uitleg = paneel.querySelector('#sj-uitleg');
    ui.n = [0, 1, 2, 3].map((i) => paneel.querySelector('#sj-n' + i));
    paneel.querySelector('#sj-nieuw').addEventListener('click', () => { nieuwSpel(); doek.focus({ preventScroll: true }); });
  }

  function werkPaneelBij() {
    if (!ui.status) return;
    const t = telling();
    ui.totaal.textContent = t.totaal;
    t.n.forEach((c, i) => { ui.n[i].textContent = c; });
    ui.uitleg.textContent = `${t.reeksen} volle ${t.reeksen === 1 ? 'reeks' : 'reeksen'} × 20 = ${t.reeksen * 20}, losse schijven: ${t.rest}.`;
    let best = 0;
    try { best = Number(localStorage.getItem('speelhuys.sjoelen.best') || 0); } catch (e) { /* */ }
    ui.best.textContent = best ? `Beste worp: ${best}` : '';
    ui.status.textContent = melding || (klaar ? '' : `Beurt ${beurt} van 3 · nog ${hand} in de hand`);
  }

  window.Spellen = window.Spellen || {};
  window.Spellen.sjoelen = {
    start() {
      veld = document.getElementById('sj-veld');
      paneel = document.getElementById('sj-paneel');
      if (!gebouwd) {
        doek = document.createElement('canvas');
        doek.className = 'sjoel-doek';
        doek.tabIndex = 0;
        doek.setAttribute('role', 'application');
        doek.setAttribute('aria-label', 'Sjoelbak. Sleep de schijf naar voren, of mik met de pijltjestoetsen en houd de spatiebalk ingedrukt.');
        veld.appendChild(doek);
        ctx = doek.getContext('2d');
        doek.addEventListener('pointerdown', pakVast);
        doek.addEventListener('pointermove', beweeg);
        doek.addEventListener('pointerup', laatLos);
        doek.addEventListener('pointercancel', laatLos);
        doek.addEventListener('keydown', toets);
        doek.addEventListener('keyup', toetsLos);
        window.addEventListener('resize', () => { if (actief) pasGrootteAan(); });
        bouwPaneel();
        nieuwSpel();
        gebouwd = true;
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (actief) maakBord(); });
      }
      actief = true;
      pasGrootteAan();
      werkPaneelBij();
      vorigeT = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(lus);
    },
    stop() { actief = false; cancelAnimationFrame(raf); if (vast) { hand++; vast = null; } laden = null; }
  };
})();
