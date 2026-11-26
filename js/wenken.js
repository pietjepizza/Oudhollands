/* Wenken: geen uitleg vooraf, maar een tikkende hand op de plek waar je iets kunt doen.
   - Buiten, zolang je nog nooit binnen was: de hand tikt op de deur. Wie iets aanraakt, ziet de hand even niet;
     daarna komt hij terug tot je naar binnen gaat.
   - Binnen wijst geen hand meer (die bleef maar terugkomen): de spellen lichten even op als je binnenkomt, en de
     klusknop roept zelf zodra je een klus kunt betalen.
   In het menu staat 'Zo werkt het': vier plaatjes (spelen, duiten, opknappen, prijzen). */
(function () {
  'use strict';
  const D = () => window.Duiten;
  const $ = (s) => document.querySelector(s);
  const html = document.documentElement;
  const zichtbaar = (e) => !!e && e.getClientRects().length > 0;
  const thuis = () => !location.hash || location.hash === '#';

  // ---------- De tikkende hand ----------
  const hand = document.createElement('div');
  hand.className = 'wenk-hand';
  hand.setAttribute('aria-hidden', 'true');
  hand.hidden = true;
  hand.innerHTML = '<i class="wenk-ring"></i><svg><use href="#i-hand"/></svg>';
  document.body.appendChild(hand);
  let rust = 0, doelNu = null, klok = 0;

  // waar moet de hand nu tikken? (null = nergens)
  function zoekDoel() {
    const d = D();
    if (!d || !thuis() || html.classList.contains('met-opening') || Date.now() < rust) return null;
    if (document.querySelector('.vel:not([hidden]), .beloning:not([hidden]), .cadeau-vel:not([hidden]), .les:not([hidden])')) return null;
    const gevel = $('#gevel');
    if (gevel && !gevel.hidden && !d.veld('bezocht', false)) return $('.gevel-svg .deur-klik');
    return null;
  }
  // nog iets te wijzen, of zijn we klaar met wenken? (klaar zodra je een keer binnen bent geweest)
  function nogNodig() {
    const d = D();
    return !d || !d.veld('bezocht', false);
  }
  function werk() {
    const doel = zoekDoel();
    if (!doel || !zichtbaar(doel)) { if (!hand.hidden) hand.hidden = true; doelNu = null; return; }
    const r = doel.getBoundingClientRect();
    if (r.width < 4 || r.bottom < 0 || r.top > innerHeight) { hand.hidden = true; return; }
    const maat = hand.offsetWidth || 64;
    // de vingertop komt iets onder het midden van het doel. Staat het doel onderaan het scherm, dan komt de hand van
    // boven en wijst hij omlaag; anders valt de hand half van het scherm.
    const omlaag = r.top + r.height * 0.58 + maat * 0.95 > innerHeight;
    const x = r.left + r.width * 0.5, y = r.top + r.height * (omlaag ? 0.32 : 0.58);
    hand.classList.toggle('omlaag', omlaag);
    // de vingertop zit op 46% en 7% van de hand; omgedraaid (180 graden om het midden) op 54% en 93%
    hand.style.transform = omlaag ? `translate(${Math.round(x - maat * 0.54)}px, ${Math.round(y - maat * 0.93)}px) rotate(180deg)`
      : `translate(${Math.round(x - maat * 0.42)}px, ${Math.round(y - maat * 0.06)}px)`;
    if (doelNu !== doel) { doelNu = doel; hand.hidden = false; hand.classList.remove('in'); void hand.offsetWidth; hand.classList.add('in'); }
  }
  function start() {
    if (klok || !nogNodig()) return;
    klok = setInterval(() => {
      if (!nogNodig()) { clearInterval(klok); klok = 0; hand.hidden = true; return; }
      werk();
    }, 350);
    werk();
  }
  // tikt iemand ergens, dan wijkt de hand even (en hij volgt niet de zoom- of deuranimatie)
  window.addEventListener('pointerdown', () => { rust = Date.now() + 1600; hand.hidden = true; doelNu = null; }, { capture: true, passive: true });
  window.addEventListener('hashchange', () => { hand.hidden = true; doelNu = null; });
  window.addEventListener('resize', () => { doelNu = null; werk(); });
  if (window.OpeningKlaar) start();
  else window.addEventListener('speelhuys:opening-klaar', start, { once: true });
  // valt de opening weg (geen opening deze keer), begin dan meteen
  setTimeout(start, 1200);

  // ---------- Zo werkt het ----------
  const zo = $('#zo-werkt');
  let vorigeFocus = null;
  function openZo() {
    if (!zo) return;
    vorigeFocus = document.activeElement;
    const zilver = zo.querySelector('.zo-beeld.zilver');
    if (zilver && !zilver.firstChild && window.Pronk) zilver.innerHTML = Pronk.prijsSvg('molen');
    zo.hidden = false;
    zo.classList.remove('open'); void zo.offsetWidth; zo.classList.add('open');
    $('#zo-sluit').focus({ preventScroll: true });
  }
  function sluitZo() {
    if (!zo || zo.hidden) return;
    zo.hidden = true;
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus({ preventScroll: true });
  }
  if (zo) {
    $('#zo-sluit').addEventListener('click', sluitZo);
    zo.addEventListener('click', (e) => { if (e.target === zo) sluitZo(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluitZo(); });
  }
  const km = $('#menu-uitleg');
  if (km) km.addEventListener('click', () => {
    const s = $('#menu-sluit');
    if (s) s.click();
    setTimeout(openZo, 80);
  });

  window.Wenken = { zoWerktHet: openZo, get _doel() { const d = zoekDoel(); return d ? (d.id || d.getAttribute('data-spel') || d.getAttribute('class')) : null; } };
})();
