/* De opening: een korte film over de gracht, één keer per bezoek als je bij het huis begint.
   - Zwart, met de tegel van het huis: tik om te beginnen. Dan mag de browser ook geluid maken. (Mag dat al,
     of staat het geluid uit, dan begint de film meteen.)
   - De torenklok slaat. Het beeld komt op in de lucht boven het huis en de camera zakt langs de trapgevel
     naar de deur; 's avonds gaan de lichten één voor één aan. Een kaartje: Amsterdam, anno 1648.
   - Dan zoomt de camera uit tot de hele gracht, de blokfluit zet in en de naam verschijnt in goud.
   - De zwarte filmbalken schuiven weg en je staat voor het huis.
   Nevel, stofjes en licht liggen in lagen voor de straat en bewegen sneller mee: zo krijgt het beeld diepte.
   Overslaan kan altijd: tik ergens, druk op een toets of op 'Overslaan'. */
(function () {
  'use strict';
  const film = document.getElementById('opening');
  const html = document.documentElement;
  const klaar = () => { window.OpeningKlaar = true; window.dispatchEvent(new Event('speelhuys:opening-klaar')); };
  if (!film || !html.classList.contains('met-opening')) { if (film) film.remove(); klaar(); return; }
  try { sessionStorage.setItem('speelhuys.opening', '1'); } catch (e) { /* */ }
  const rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = document.querySelector('.gevel-svg');
  const tijd = (svg && svg.getAttribute('data-tijd')) || 'dag';
  film.setAttribute('data-tijd', tijd);
  const zwart = film.querySelector('.film-zwart');

  // de naam: elke letter apart; ze komen van buiten naar het midden toe
  const naam = film.querySelector('.film-naam');
  const tekst = naam.textContent;
  naam.setAttribute('data-tekst', tekst);
  const mid = (tekst.length - 1) / 2;
  naam.innerHTML = [...tekst].map((ch, i) => (ch === ' ' ? '<span class="letter">&nbsp;</span>' : `<span class="letter" style="--i:${i};--x:${((i - mid) * 0.1).toFixed(2)}em">${ch}</span>`)).join('');

  // filmkorrel: één keer ruis op een klein doek, die dan verspringt
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), beeld = g.createImageData(128, 128);
    for (let i = 0; i < beeld.data.length; i += 4) { const v = Math.random() * 255; beeld.data[i] = beeld.data[i + 1] = beeld.data[i + 2] = v; beeld.data[i + 3] = 255; }
    g.putImageData(beeld, 0, 0);
    film.querySelector('.film-korrel').style.backgroundImage = `url(${cv.toDataURL()})`;
  } catch (e) { /* zonder korrel */ }
  // stofjes in het licht (en 's avonds wazige lichtjes), dichterbij dan de straat
  const stof = film.querySelector('.film-stof');
  for (let i = 0; i < 20; i++) {
    const d = document.createElement('i'), groot = Math.random() < 0.3;
    const maat = groot ? 12 + Math.random() * 30 : 2 + Math.random() * 5;
    d.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${maat.toFixed(1)}px;height:${maat.toFixed(1)}px;` +
      `--d:${(5 + Math.random() * 7).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 70).toFixed(0)}px;--dy:${(-24 - Math.random() * 60).toFixed(0)}px;` +
      `opacity:${groot ? 0.16 : 0.55};filter:blur(${groot ? 5 : 0.6}px);animation-delay:-${(Math.random() * 6).toFixed(1)}s`;
    stof.appendChild(d);
  }

  // ---------- De camera: verschuiven en vergroten van de echte straat ----------
  const balk = () => parseFloat(getComputedStyle(film).getPropertyValue('--balk')) || Math.min(120, Math.max(36, innerHeight * 0.11));
  // zet punt (cx, cy) van de tekening in het midden, z keer zo groot, zonder buiten de tekening te kijken
  function kader(cx, cy, z) {
    const m = svg.getScreenCTM(), r = svg.getBoundingClientRect();
    if (!m || !r.width) return 'translate(0px, 0px) scale(1)';
    const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
    const q = p.matrixTransform(m), lx = q.x - r.left, ly = q.y - r.top;
    const W = innerWidth, H = innerHeight, b = balk();
    let tx = W / 2 - r.left - z * lx, ty = H / 2 - r.top - z * ly;
    tx = Math.min(-r.left, Math.max(W - r.left - z * r.width, tx));
    ty = Math.min(b - r.top, Math.max(H - b - r.top - z * r.height, ty));
    return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${z.toFixed(3)})`;
  }

  // 's avonds en 's nachts: eerst donker, dan gaan de lichten één voor één aan (van boven naar beneden)
  const LICHTEN = '.licht-raam, .lantaarnlicht, .licht-spiegel';
  function lichtenAan() {
    if (!svg || !svg.classList.contains('film-donker')) return;
    const lijst = [...svg.querySelectorAll(LICHTEN)].map((e) => { let y = 0; try { y = e.getBBox().y; } catch (er) { /* */ } return { e, y }; }).sort((a, b) => a.y - b.y);
    lijst.forEach(({ e }, i) => { e.style.transitionDuration = '.8s'; e.style.transitionDelay = (i * 0.07 + Math.random() * 0.2).toFixed(2) + 's'; });
    svg.classList.remove('film-donker');
    setTimeout(() => lijst.forEach(({ e }) => { e.style.transitionDuration = ''; e.style.transitionDelay = ''; }), 4500);
  }

  // ---------- Het verloop ----------
  let gestart = false, eindigt = false, camera = null, muziek = null, startTijd = 0;
  let timers = [];
  const na = (ms, f) => timers.push(setTimeout(() => { try { f(); } catch (e) { opruimen(); } }, ms));
  const anims = [];

  function start() {
    if (gestart) return;
    gestart = true;
    startTijd = Date.now();
    film.classList.remove('poort');
    film.classList.add('loopt');
    // de film heeft zijn eigen muziek (zie muziek.js): de torenklok, de gamba, de luit en de blokfluit
    const metGeluid = (window.Geluid && Geluid.aan) || (window.Muziek && Muziek.aan);
    if (metGeluid && window.Muziek && Muziek.film) { try { muziek = Muziek.film(); } catch (e) { muziek = null; } }
    try {
      if (rustig || !svg) rustigeFilm(); else bewegendeFilm();
    } catch (e) { opruimen(); }
  }

  function bewegendeFilm() {
    const DUUR = 7400, KANTEL = 4600;
    anims.push(zwart.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 2300, delay: 120, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' }));
    const staand = innerWidth / innerHeight < 0.8;
    const A = kader(800, staand ? 290 : 270, staand ? 2.5 : 2.2);
    const B = kader(800, staand ? 760 : 720, staand ? 1.55 : 1.45);
    svg.style.willChange = 'transform';
    camera = svg.animate([
      { transform: A, offset: 0, easing: 'cubic-bezier(.42, 0, .5, 1)' },
      { transform: B, offset: KANTEL / DUUR, easing: 'cubic-bezier(.55, 0, .2, 1)' },
      { transform: 'translate(0px, 0px) scale(1)', offset: 1 }
    ], { duration: DUUR, fill: 'forwards' });
    // de lagen ervoor bewegen sneller mee (ze zijn dichterbij)
    anims.push(film.querySelector('.film-diepte').animate([
      { transform: 'translateY(40vh)' }, { transform: 'translateY(8vh)', offset: KANTEL / DUUR }, { transform: 'translateY(0)' }
    ], { duration: DUUR, easing: 'ease-in-out', fill: 'forwards' }));
    anims.push(film.querySelector('.film-licht').animate([
      { opacity: 0 }, { opacity: 0.12, offset: 0.3 }, { opacity: 0.2, offset: 0.6 }, { opacity: 0.6, offset: 0.82 }, { opacity: 0.3 }
    ], { duration: 9000, easing: 'ease-in-out', fill: 'forwards' }));
    if (tijd === 'avond' || tijd === 'nacht') { svg.classList.add('film-donker'); na(2300, lichtenAan); }
    na(700, () => film.classList.add('plaats-in'));
    na(6150, () => film.classList.add('titel-in'));
    na(7350, () => film.classList.add('glans'));
    na(9000, afronden);
  }

  function rustigeFilm() {
    film.classList.add('rustig');
    anims.push(zwart.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }));
    film.classList.add('titel-in');
    na(3400, afronden);
  }

  // de balken schuiven weg, de naam verdwijnt en de knoppen komen in beeld
  function afronden() {
    if (eindigt) return;
    eindigt = true;
    film.classList.add('uit');
    html.classList.add('opening-uit');
    na(1300, opruimen);
  }
  function opruimen() {
    timers.forEach(clearTimeout); timers = [];
    document.removeEventListener('keydown', toets);
    if (camera) { camera.cancel(); camera = null; }
    anims.forEach((a) => { try { a.cancel(); } catch (e) { /* */ } });
    if (svg) { svg.style.willChange = ''; if (svg.classList.contains('film-donker')) lichtenAan(); }
    html.classList.remove('met-opening', 'opening-uit');
    if (film.parentNode) film.remove();
    if (!window.OpeningKlaar) klaar();
  }

  // overslaan: even zwart, en dan de straat zoals hij is
  function overslaan() {
    if (eindigt) return;
    eindigt = true;
    if (muziek) muziek.stop(true);
    timers.forEach(clearTimeout); timers = [];
    const van = parseFloat(getComputedStyle(zwart).opacity) || 0;
    anims.forEach((a) => { try { a.cancel(); } catch (e) { /* */ } });
    const z = zwart.animate([{ opacity: van }, { opacity: 1 }], { duration: rustig ? 1 : 220, fill: 'forwards' });
    z.onfinish = () => {
      if (camera) { camera.cancel(); camera = null; }
      if (svg && svg.classList.contains('film-donker')) lichtenAan();
      film.classList.add('uit');
      film.querySelector('.film-titel').style.display = 'none';
      html.classList.add('opening-uit');
      zwart.animate([{ opacity: 1 }, { opacity: 0 }], { duration: rustig ? 1 : 500, fill: 'forwards' });
      setTimeout(opruimen, rustig ? 200 : 1100);
    };
  }

  function toets(e) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
    if (!gestart) { if (e.key === 'Escape') { gestart = true; eindigt = true; opruimen(); } else start(); return; }
    if (Date.now() - startTijd > 600) overslaan();
  }
  document.addEventListener('keydown', toets);
  film.querySelector('.film-poort').addEventListener('click', (e) => { e.stopPropagation(); start(); });
  film.querySelector('.film-over').addEventListener('click', (e) => { e.stopPropagation(); overslaan(); });
  film.addEventListener('click', () => { if (gestart && Date.now() - startTijd > 900) overslaan(); });

  // Moet de browser eerst een tik hebben voordat er geluid mag? Dan eerst het zwarte begin; anders meteen.
  const wilGeluid = (window.Geluid && Geluid.aan) || (window.Muziek && Muziek.aan);
  let poort = false;
  if (wilGeluid && window.Klank) {
    const c = Klank.maak();
    poort = !c || c.state !== 'running';
  }
  if (/[?&]poort\b/.test(location.search)) poort = true; // (voor de tests)
  if (poort) {
    film.classList.add('poort');
    film.querySelector('.film-poort').focus({ preventScroll: true });
  } else {
    start();
  }
  window.Opening = { overslaan, get _toestand() { return { gestart, eindigt, poort: film.classList.contains('poort') }; } };
})();
