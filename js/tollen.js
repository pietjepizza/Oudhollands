/* Tollen: houd de drijftol zo lang mogelijk draaiende door er met het zweepje langs te vegen.
   Te zacht en hij valt om, te hard en hij gaat wiebelen. Wie de tol van de plank laat lopen, verliest hem ook. */
(function () {
  const W = 360, H = 520;
  const GROND = 392;                 // waar de punt van de tol op de vloer staat
  const LINKS = 56, RECHTS = 304;    // de rand van de plank
  const HOOGTE = 96, BREEDTE = 74;

  let veld, paneel, doek, ctx, achter = null, schaal = 1, dpr = 1;
  let fase = 'wacht', spin = 0, x = W / 2, vx = 0, tijd = 0, kanteling = 0, precessie = 0, draai = 0;
  let wiebel = 0, valHoek = 0, valRicht = 1, volgendeHobbel = 5, spoor = [], zweepSpoor = [];
  let raf = 0, vorigeT = 0, actief = false, gebouwd = false, melding = '', beloond = false;
  let ui = {};

  const stijl = () => (window.Pronk ? Pronk.stijl('tollen') : { banden: ['#B6452C', '#1C3473', '#E7C36A'], kop: '#D45A3C' });

  function nieuwSpel() {
    fase = 'wacht'; spin = 0; x = W / 2; vx = 0; tijd = 0; kanteling = 0; precessie = 0; draai = 0;
    wiebel = 0; valHoek = 0; volgendeHobbel = 4 + Math.random() * 3; spoor = []; zweepSpoor = []; beloond = false;
    melding = 'Veeg met je vinger langs de tol om hem aan te zwepen.';
    werkPaneelBij();
  }

  // ---------- Zweepslag ----------
  function zweep(snelheid, richting) {
    if (fase === 'klaar' || fase === 'valt') return;
    const kracht = Math.max(0.25, Math.min(1, Math.abs(snelheid) / 1600));
    if (fase === 'wacht') { fase = 'draait'; spin = 52 + kracht * 14; melding = 'Hij draait! Blijf zwepen.'; }
    else {
      spin += 9 + kracht * 17;
      if (spin > 100) { wiebel = Math.min(1, wiebel + (spin - 100) / 25); spin = 100 - (spin - 100) * 1.2; melding = 'Te hard, hij wiebelt!'; }
      else melding = '';
    }
    vx += richting * (10 + kracht * 20);
    Geluid.zweep();
    werkPaneelBij();
  }

  function naarBord(e) {
    const r = doek.getBoundingClientRect();
    return { x: (e.clientX - r.left) / schaal, y: (e.clientY - r.top) / schaal, t: performance.now() };
  }
  function neer(e) {
    if (fase === 'klaar' || fase === 'valt') return;
    e.preventDefault();
    if (doek.setPointerCapture) doek.setPointerCapture(e.pointerId);
    spoor = [naarBord(e)];
  }
  function beweeg(e) {
    if (!spoor.length) return;
    const p = naarBord(e);
    spoor.push(p); if (spoor.length > 14) spoor.shift();
    zweepSpoor.push(p); if (zweepSpoor.length > 18) zweepSpoor.shift();
    // raakt de veeg de tol? Dan meteen een zweepslag (één per veeg)
    if (!spoor.geraakt && raaktTol(spoor[spoor.length - 2], p)) {
      const a = spoor[Math.max(0, spoor.length - 5)], dt = Math.max(0.016, (p.t - a.t) / 1000);
      const sx = (p.x - a.x) / dt;
      if (Math.abs(sx) > 260) { spoor.geraakt = true; zweep(sx, Math.sign(sx)); }
    }
  }
  function los() {
    if (spoor.geraakt && window.Tril) Tril.klik();
    spoor = [];
  }
  function raaktTol(a, b) {
    if (!a || !b) return false;
    const top = GROND - HOOGTE - 10, bodem = GROND;
    const midY = (a.y + b.y) / 2;
    if (midY < top || midY > bodem) return false;
    const links = Math.min(a.x, b.x), rechts = Math.max(a.x, b.x);
    return rechts >= x - BREEDTE / 2 && links <= x + BREEDTE / 2;
  }
  function toets(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      zweep(1100, e.key === 'ArrowRight' ? 1 : -1);
    }
  }

  // ---------- Verloop ----------
  function stap(dt) {
    const nu = performance.now();
    zweepSpoor = zweepSpoor.filter((p) => nu - p.t < 260);
    if (fase === 'draait') {
      tijd += dt;
      spin -= (4.2 + tijd * 0.12) * (spin < 30 ? 1.35 : 1) * dt;
      volgendeHobbel -= dt;
      if (volgendeHobbel <= 0) {
        volgendeHobbel = 3.5 + Math.random() * 4;
        spin -= 3 + Math.random() * 5;
        vx += (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 26);
      }
      vx += (Math.random() - 0.5) * 70 * dt * (1.25 - spin / 100);
      vx *= 1 - 0.9 * dt;
      x += vx * dt;
      wiebel = Math.max(0, wiebel - dt * 0.35);
      precessie += (2 + (100 - spin) / 18) * dt;
      kanteling = (Math.pow(1 - Math.max(0, spin) / 100, 1.7) * 28 + wiebel * 22) * Math.sin(precessie);
      draai += (spin / 100) * 26 * dt;
      if (spin <= 0 || x < LINKS || x > RECHTS) valOm(spin <= 0 ? 'Hij valt om.' : 'Van de plank gerold.');
    } else if (fase === 'valt') {
      valHoek = Math.min(82, valHoek + dt * 240);
      x += valRicht * dt * 20;
      if (valHoek >= 82) klaar();
    } else if (fase === 'wacht') {
      kanteling = 0;
    }
  }

  function valOm(reden) {
    fase = 'valt';
    valRicht = kanteling >= 0 ? 1 : -1;
    valHoek = Math.abs(kanteling);
    melding = reden;
    Geluid.val();
    werkPaneelBij();
  }

  function klaar() {
    if (fase === 'klaar') return;
    fase = 'klaar';
    const sec = Math.round(tijd * 10) / 10;
    const best = window.Duiten ? Duiten.veld('record-tollen', 0) : 0;
    const record = sec > best;
    if (record && window.Duiten) Duiten.zetVeld('record-tollen', sec);
    melding = `${melding} ${sec.toFixed(1).replace('.', ',')} seconden.`;
    if (record) Geluid.klok();
    werkPaneelBij();
    if (window.Duiten && !beloond && sec >= 2) {
      beloond = true;
      Duiten.beloon({ spel: 'tollen', bedrag: Math.min(60, 5 + Math.floor(sec / 2)), gewonnen: record, tekst: record ? `${sec.toFixed(1).replace('.', ',')} s · record!` : `${sec.toFixed(1).replace('.', ',')} seconden` });
    }
  }

  // ---------- Tekenen ----------
  function maakAchter() {
    const c = document.createElement('canvas');
    c.width = Math.round(W * schaal * dpr); c.height = Math.round(H * schaal * dpr);
    const g = c.getContext('2d');
    g.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    // houten wand van de zolder
    const wg = g.createLinearGradient(0, 0, 0, GROND);
    wg.addColorStop(0, '#5A4128'); wg.addColorStop(1, '#8A6640');
    g.fillStyle = wg; g.fillRect(0, 0, W, GROND - 40);
    for (let xx = 0; xx < W; xx += 44) {
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(xx, 0, 2, GROND - 40);
      g.fillStyle = 'rgba(255,230,190,.06)'; g.fillRect(xx + 2, 0, 2, GROND - 40);
    }
    // schuin dak met een balk
    g.fillStyle = '#3A2A1A';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 30); g.lineTo(0, 70); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255, 236, 200, .08)'; g.fillRect(0, 70, W, 3);
    // vloer van planken in perspectief
    const vg = g.createLinearGradient(0, GROND - 40, 0, H);
    vg.addColorStop(0, '#9C7349'); vg.addColorStop(1, '#6E4C2A');
    g.fillStyle = vg; g.fillRect(0, GROND - 40, W, H - GROND + 40);
    g.strokeStyle = 'rgba(40, 24, 10, .35)'; g.lineWidth = 1.4;
    for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(W / 2 + i * 22, GROND - 40); g.lineTo(W / 2 + i * 70, H); g.stroke(); }
    // de plank waarop gespeeld wordt
    g.fillStyle = 'rgba(255, 236, 200, .1)';
    g.beginPath(); g.moveTo(LINKS - 10, GROND - 10); g.lineTo(RECHTS + 10, GROND - 10); g.lineTo(RECHTS + 34, GROND + 26); g.lineTo(LINKS - 34, GROND + 26); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255, 236, 200, .35)'; g.setLineDash([5, 6]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(LINKS - 22, GROND + 8); g.lineTo(RECHTS + 22, GROND + 8); g.stroke(); g.setLineDash([]);
    // lichtvlek van het hijsluik
    const lg = g.createRadialGradient(W * 0.3, GROND - 140, 10, W * 0.3, GROND - 140, 240);
    lg.addColorStop(0, 'rgba(255, 240, 200, .28)'); lg.addColorStop(1, 'rgba(255, 240, 200, 0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    achter = c;
  }

  function tekenTol() {
    const s = stijl();
    const hoek = fase === 'valt' || fase === 'klaar' ? valRicht * valHoek : kanteling;
    // schaduw
    ctx.fillStyle = 'rgba(30, 18, 6, .35)';
    ctx.beginPath(); ctx.ellipse(x + 4, GROND + 2, 30 + Math.abs(hoek) * 0.6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(x, GROND);
    ctx.rotate(hoek * Math.PI / 180);
    // lijf van de tol
    const lijf = new Path2D();
    lijf.moveTo(-BREEDTE / 2, -HOOGTE + 18);
    lijf.quadraticCurveTo(0, -HOOGTE - 4, BREEDTE / 2, -HOOGTE + 18);
    lijf.lineTo(4, -4); lijf.lineTo(0, 0); lijf.lineTo(-4, -4); lijf.closePath();
    ctx.fillStyle = s.banden[0]; ctx.fill(lijf);
    ctx.save(); ctx.clip(lijf);
    // gekleurde banden
    ctx.fillStyle = s.banden[1]; ctx.fillRect(-BREEDTE, -HOOGTE + 30, BREEDTE * 2, 14);
    ctx.fillStyle = s.banden[2]; ctx.fillRect(-BREEDTE, -HOOGTE + 52, BREEDTE * 2, 9);
    ctx.fillStyle = s.banden[1]; ctx.fillRect(-BREEDTE, -HOOGTE + 70, BREEDTE * 2, 6);
    // stippen die rondgaan: zo zie je hoe snel hij draait
    const snel = spin / 100;
    for (let i = 0; i < 6; i++) {
      const fase2 = draai + i * (Math.PI / 3);
      const sx = Math.sin(fase2) * BREEDTE * 0.42, zicht = Math.cos(fase2);
      if (zicht < 0) continue;
      ctx.fillStyle = i % 2 ? s.banden[2] : '#F6F1E4';
      ctx.globalAlpha = 0.85 * zicht;
      if (snel > 0.55) { ctx.fillRect(sx - 10 * snel, -HOOGTE + 22, 20 * snel, 5); }
      else { ctx.beginPath(); ctx.arc(sx, -HOOGTE + 24, 3.2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // licht en schaduw op het hout
    const lg = ctx.createLinearGradient(-BREEDTE / 2, 0, BREEDTE / 2, 0);
    lg.addColorStop(0, 'rgba(255,255,255,.28)'); lg.addColorStop(0.45, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.3)');
    ctx.fillStyle = lg; ctx.fillRect(-BREEDTE, -HOOGTE - 10, BREEDTE * 2, HOOGTE + 10);
    ctx.restore();
    ctx.strokeStyle = 'rgba(40, 20, 8, .6)'; ctx.lineWidth = 1.2; ctx.stroke(lijf);
    // bovenkant en steeltje
    ctx.fillStyle = s.kop;
    ctx.beginPath(); ctx.ellipse(0, -HOOGTE + 17, BREEDTE / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(40, 20, 8, .5)'; ctx.stroke();
    ctx.fillStyle = '#6B4423'; ctx.fillRect(-3, -HOOGTE - 4, 6, 18);
    ctx.fillStyle = '#8A5A2E'; ctx.beginPath(); ctx.ellipse(0, -HOOGTE - 4, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function tekenMeter() {
    // halve meter bovenin: groen is goed, rood is gevaarlijk
    const cx = W / 2, cy = 112, r = 54;
    ctx.lineWidth = 10; ctx.lineCap = 'butt';
    const boog = (van, tot, kleur) => { ctx.strokeStyle = kleur; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI + van * Math.PI, Math.PI + tot * Math.PI); ctx.stroke(); };
    boog(0, 0.25, 'rgba(182, 69, 44, .85)');
    boog(0.25, 0.9, 'rgba(110, 150, 70, .85)');
    boog(0.9, 1, 'rgba(194, 137, 42, .9)');
    const a = Math.PI + Math.max(0, Math.min(100, spin)) / 100 * Math.PI;
    ctx.strokeStyle = '#F6F1E4'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)); ctx.stroke();
    ctx.fillStyle = '#F6F1E4'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  }

  function teken() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, doek.width, doek.height);
    if (achter) ctx.drawImage(achter, 0, 0, W * schaal, H * schaal);
    ctx.setTransform(schaal * dpr, 0, 0, schaal * dpr, 0, 0);
    tekenMeter();
    tekenTol();
    // het zweepje: een touwtje langs het pad van je vinger
    if (zweepSpoor.length > 1) {
      const nu = performance.now();
      ctx.lineCap = 'round';
      for (let i = 1; i < zweepSpoor.length; i++) {
        const a = zweepSpoor[i - 1], b = zweepSpoor[i];
        ctx.strokeStyle = `rgba(70, 40, 15, ${Math.max(0, 1 - (nu - b.t) / 260) * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    // tijd
    ctx.font = '28px "EB Garamond", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F6F1E4';
    ctx.fillText(tijd.toFixed(1).replace('.', ','), W / 2, 160);
    ctx.font = '13px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(246, 241, 228, .75)';
    ctx.fillText('seconden', W / 2, 182);
    if (fase === 'wacht') {
      ctx.font = 'italic 16px "IM Fell English", Georgia, serif'; ctx.fillStyle = 'rgba(246, 241, 228, .9)';
      ctx.fillText('Veeg langs de tol', W / 2, GROND + 70);
      const t = (performance.now() % 1600) / 1600;
      ctx.fillStyle = 'rgba(246, 241, 228, .8)';
      ctx.beginPath(); ctx.arc(x - 90 + t * 180, GROND - 50, 9, 0, Math.PI * 2); ctx.fill();
    }
  }

  function lus(t) {
    if (!actief) return;
    const dt = Math.min(0.05, (t - (vorigeT || t)) / 1000);
    vorigeT = t;
    stap(dt);
    teken();
    if (fase === 'draait' && Math.round(tijd * 10) % 5 === 0) werkTijdBij();
    raf = requestAnimationFrame(lus);
  }

  function pasGrootteAan() {
    const beschikbaar = veld.clientWidth || W;
    const boven = veld.getBoundingClientRect().top + window.scrollY;
    const hoogte = Math.max(420, window.innerHeight - boven - 16);
    schaal = Math.min(beschikbaar / W, hoogte / H, 1.4);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    doek.style.width = (W * schaal) + 'px';
    doek.style.height = (H * schaal) + 'px';
    doek.width = Math.round(W * schaal * dpr);
    doek.height = Math.round(H * schaal * dpr);
    maakAchter();
  }

  // ---------- Paneel ----------
  function bouwPaneel() {
    paneel.innerHTML = `
      <p class="status" id="to-status" aria-live="polite"></p>
      <div class="score-rij"><span class="groot-getal" id="to-tijd">0,0</span><span class="klein" id="to-best"></span></div>
      <p class="klein">seconden dat de tol bleef draaien</p>
      <div class="knoppen"><button class="knop" id="to-nieuw" type="button">Opnieuw beginnen</button></div>
      <details>
        <summary>Speelregels</summary>
        <ul>
          <li>Veeg met je vinger of muis langs de tol: dat is een zweepslag.</li>
          <li>De meter bovenin laat zien hoe hard hij draait. Houd de wijzer in het groen.</li>
          <li>Zweep je te hard, dan gaat hij wiebelen. Zweep je te weinig, dan valt hij om.</li>
          <li>Veeg naar links of rechts om de tol op de plank te houden.</li>
          <li>Toetsenbord: pijltje links of rechts is een zweepslag.</li>
        </ul>
      </details>
      <p class="geschiedenis">Op 17e-eeuwse Delftse tegels en op Bruegels <i>Kinderspelen</i> (1560) zie je kinderen met een tol en een zweepje. De drijftol werd met de zweep aan het draaien gehouden; wie hem het langst liet draaien, won.</p>
    `;
    ui.status = paneel.querySelector('#to-status');
    ui.tijd = paneel.querySelector('#to-tijd');
    ui.best = paneel.querySelector('#to-best');
    paneel.querySelector('#to-nieuw').addEventListener('click', () => { nieuwSpel(); doek.focus({ preventScroll: true }); });
  }
  function werkTijdBij() { if (ui.tijd) ui.tijd.textContent = tijd.toFixed(1).replace('.', ','); }
  function werkPaneelBij() {
    if (!ui.status) return;
    ui.status.textContent = melding || 'Blijf zwepen!';
    werkTijdBij();
    const best = window.Duiten ? Duiten.veld('record-tollen', 0) : 0;
    ui.best.textContent = best ? `Beste: ${String(best).replace('.', ',')} s` : '';
  }

  // ---------- Uitleg door Gijs de gans ----------
  function punt(px, py) { const r = doek.getBoundingClientRect(); return [r.left + px * schaal, r.top + py * schaal]; }
  function vak(px, py, b, h) { const r = doek.getBoundingClientRect(); return { left: r.left + px * schaal, top: r.top + py * schaal, width: b * schaal, height: h * schaal }; }
  if (window.Les) {
    Les.zet('tollen', () => [
      { doel: () => vak(x - 70, GROND - HOOGTE - 20, 140, HOOGTE + 30), gebaar: 'veeg', van: () => punt(x - 110, GROND - 50), naar: () => punt(x + 110, GROND - 50), duur: 1100, tekst: 'Veeg langs de tol' },
      { doel: () => vak(W / 2 - 66, 50, 132, 80), gebaar: 'wijs', tekst: 'Houd de wijzer in het groen' },
      { doel: () => vak(LINKS - 30, GROND - 20, RECHTS - LINKS + 60, 50), gebaar: 'wijs', tekst: 'Blijf op de plank' }
    ]);
  }

  window.Spellen = window.Spellen || {};
  window.Spellen.tollen = {
    start() {
      veld = document.getElementById('to-veld');
      paneel = document.getElementById('to-paneel');
      if (!gebouwd) {
        doek = document.createElement('canvas');
        doek.className = 'sjoel-doek tol-doek';
        doek.tabIndex = 0;
        doek.setAttribute('role', 'application');
        doek.setAttribute('aria-label', 'Een tol op de zoldervloer. Veeg langs de tol om hem te zwepen, of gebruik de pijltjestoetsen.');
        veld.appendChild(doek);
        ctx = doek.getContext('2d');
        doek.addEventListener('pointerdown', neer);
        doek.addEventListener('pointermove', beweeg);
        doek.addEventListener('pointerup', los);
        doek.addEventListener('pointercancel', los);
        doek.addEventListener('keydown', toets);
        window.addEventListener('resize', () => { if (actief) pasGrootteAan(); });
        bouwPaneel();
        nieuwSpel();
        gebouwd = true;
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (actief) maakAchter(); });
      }
      actief = true;
      pasGrootteAan();
      werkPaneelBij();
      vorigeT = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(lus);
      if (window.Les) Les.eersteKeer('tollen');
    },
    stop() { actief = false; cancelAnimationFrame(raf); spoor = []; },
    opnieuw() { nieuwSpel(); if (doek) doek.focus({ preventScroll: true }); }
  };
})();
