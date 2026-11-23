/* Leren door voordoen: Gijs de gans laat in een paar stapjes zien hoe een spel werkt.
   Een spotlicht wijst de plek aan, een vinger tikt of veegt, en een ballonnetje zegt in een paar woorden wat er gebeurt.
   De eerste keer dat je een spel opent komt Gijs vanzelf; daarna via de vraagteken-knop. */
(function () {
  const les = document.getElementById('les');
  if (!les) { window.Les = { zet() {}, toon() {}, eersteKeer() {} }; return; }
  const licht = document.getElementById('les-licht');
  const vinger = document.getElementById('les-vinger');
  const gans = document.getElementById('les-gans');
  const ballon = document.getElementById('les-ballon');
  const tekst = document.getElementById('les-tekst');
  const stippen = document.getElementById('les-stippen');
  const verder = document.getElementById('les-verder');
  const over = document.getElementById('les-over');
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lessen = {};
  let stappen = [], stap = 0, spel = null, vingerAnim = null, autoTimer = 0, vorigeFocus = null;

  function rechthoek(doel) {
    const d = typeof doel === 'function' ? doel() : doel;
    if (!d) return null;
    if (d.getBoundingClientRect) return d.getBoundingClientRect();
    return d; // al een rechthoek {left, top, width, height}
  }
  const punt = (p) => (typeof p === 'function' ? p() : p);

  function toonStap() {
    const s = stappen[stap];
    if (!s) { sluit(); return; }
    clearTimeout(autoTimer);
    let r = rechthoek(s.doel);
    // valt het doel buiten beeld, schuif dan eerst de pagina
    if (r && !document.body.classList.contains('volscherm') && (r.top < 50 || r.top + r.height > innerHeight - 10)) {
      window.scrollBy(0, r.top + r.height / 2 - innerHeight * 0.42);
      r = rechthoek(s.doel);
    }
    if (!r) r = { left: innerWidth / 2 - 60, top: innerHeight / 2 - 60, width: 120, height: 120 };
    const marge = s.marge === undefined ? 10 : s.marge;
    const rond = s.vorm === 'rond';
    const b = r.width + marge * 2, h = r.height + marge * 2;
    const maat = rond ? Math.max(b, h) : 0;
    Object.assign(licht.style, {
      left: (r.left + r.width / 2 - (rond ? maat : b) / 2) + 'px',
      top: (r.top + r.height / 2 - (rond ? maat : h) / 2) + 'px',
      width: (rond ? maat : b) + 'px',
      height: (rond ? maat : h) + 'px',
      borderRadius: rond ? '50%' : '14px'
    });
    tekst.textContent = s.tekst;
    // de gans staat onderin, of bovenin als het doel in de onderste helft ligt; en aan de kant waar het doel niet is
    const doelMidden = r.left + r.width / 2;
    const boven = r.top + r.height / 2 > innerHeight * 0.5;
    const rechts = doelMidden < innerWidth / 2 && (boven ? r.top < 230 : r.top + r.height > innerHeight * 0.55);
    les.classList.toggle('boven', boven);
    les.classList.toggle('gans-rechts', rechts);
    // gebaar
    if (vingerAnim) { vingerAnim.cancel(); vingerAnim = null; }
    vinger.className = 'les-vinger' + (s.voorwerp ? ' met-' + s.voorwerp : '');
    vinger.style.transform = '';
    vinger.hidden = s.gebaar === 'wijs';
    if (s.gebaar === 'tik') {
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      Object.assign(vinger.style, { left: x + 'px', top: y + 'px' });
      vinger.classList.add('tikt');
    } else if (s.gebaar === 'veeg') {
      const van = punt(s.van) || [r.left + r.width / 2, r.top + r.height];
      const naar = punt(s.naar) || [r.left + r.width / 2, r.top];
      Object.assign(vinger.style, { left: '0px', top: '0px' });
      if (!rustig()) {
        vingerAnim = vinger.animate([
          { transform: `translate(${van[0]}px, ${van[1]}px) scale(.8)`, opacity: 0 },
          { transform: `translate(${van[0]}px, ${van[1]}px) scale(1)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${naar[0]}px, ${naar[1]}px) scale(1)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${naar[0]}px, ${naar[1]}px) scale(.8)`, opacity: 0 }
        ], { duration: s.duur || 1500, iterations: Infinity, easing: 'cubic-bezier(.4,0,.3,1)' });
      } else {
        vinger.style.transform = `translate(${naar[0]}px, ${naar[1]}px)`;
      }
    }
    // stippen en knoppen
    stippen.innerHTML = stappen.map((_, i) => `<i class="${i === stap ? 'nu' : ''}"></i>`).join('');
    verder.textContent = stap === stappen.length - 1 ? 'Spelen!' : 'Verder';
    gans.classList.remove('praat'); void gans.offsetWidth; gans.classList.add('praat');
    ballon.classList.remove('in'); void ballon.offsetWidth; ballon.classList.add('in');
    if (window.Geluid && Geluid.tik) Geluid.tik();
  }

  function volgende() {
    stap++;
    if (stap >= stappen.length) sluit(); else toonStap();
  }

  function toon(naam) {
    const maker = lessen[naam];
    if (!maker) return;
    stappen = maker().filter(Boolean);
    if (!stappen.length) return;
    spel = naam; stap = 0;
    vorigeFocus = document.activeElement;
    les.hidden = false;
    les.classList.remove('open'); void les.offsetWidth; les.classList.add('open');
    toonStap();
    verder.focus({ preventScroll: true });
  }

  function sluit() {
    if (les.hidden) return;
    les.hidden = true;
    if (vingerAnim) { vingerAnim.cancel(); vingerAnim = null; }
    clearTimeout(autoTimer);
    if (spel && window.Duiten) window.Duiten.zetVeld('les-' + spel, true);
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus({ preventScroll: true });
  }

  verder.addEventListener('click', volgende);
  over.addEventListener('click', sluit);
  licht.addEventListener('click', volgende);
  document.addEventListener('keydown', (e) => {
    if (les.hidden) return;
    if (e.key === 'Escape') sluit();
    if (e.key === 'ArrowRight') volgende();
  });
  window.addEventListener('resize', () => { if (!les.hidden) toonStap(); });
  window.addEventListener('hashchange', sluit);

  window.Les = {
    // een spel geeft een functie die de stappen maakt (op dat moment staan de onderdelen op hun plek)
    zet(naam, maker) { lessen[naam] = maker; },
    toon,
    sluit,
    eersteKeer(naam) {
      if (window.Duiten && window.Duiten.veld('les-' + naam, false)) return;
      setTimeout(() => { if (location.hash === '#' + naam && les.hidden) toon(naam); }, 650);
    }
  };
})();
