/* Navigatie tussen het huis en de spellen (via #ganzenbord, #sjoelen, #molenspel, #dammen, #klaverjassen, #triktrak, #knikkeren, #tollen),
   de knoppen in de kop, het menu, tikgeluid en trilling, en het installeren als app. */
(function () {
  const SPELLEN = ['ganzenbord', 'sjoelen', 'molenspel', 'dammen', 'klaverjassen', 'triktrak', 'bikkelen', 'kolf', 'koekhappen', 'knikkeren', 'tollen'];
  // muziek per spel: [stuk, ronde]. Spellen die een stuk delen, beginnen elk bij een andere variatie
  // (0 = het thema, 1 en 2 = de modi met versieringen, 3 = het thema op een ander instrument)
  const MUZIEK = {
    ganzenbord: ['ganzenbord', 0], sjoelen: ['sjoelen', 0], molenspel: ['molenspel', 0],
    knikkeren: ['ganzenbord', 1], tollen: ['sjoelen', 2], dammen: ['molenspel', 3], klaverjassen: ['sjoelen', 1],
    triktrak: ['molenspel', 1], bikkelen: ['ganzenbord', 3], kolf: ['sjoelen', 3], koekhappen: ['ganzenbord', 2]
  };
  // plekken om te lezen en te kijken; geen spel
  const PAGINAS = ['kunstkamer', 'pronkkamer'];
  const PAGINA = { kunstkamer: () => window.Kunstkamer, pronkkamer: () => window.Pronk };
  let huidig; // undefined = er is nog niets getoond

  function toon() {
    // het oude adres van de pronkkast leidt naar de pronkkamer
    if (location.hash === '#pronkkast') { location.replace('#pronkkamer'); return; }
    const naam = (location.hash || '').replace('#', '');
    const spel = SPELLEN.includes(naam) ? naam : null;
    const pagina = PAGINAS.includes(naam) ? naam : null;
    const wie = spel || pagina;
    const vorige = huidig;
    if (vorige && vorige !== wie) {
      if (window.Spellen[vorige]) window.Spellen[vorige].stop();
      const p = PAGINA[vorige] && PAGINA[vorige]();
      if (p && p.stop) p.stop();
    }
    document.getElementById('thuis').hidden = !!wie;
    SPELLEN.concat(PAGINAS).forEach((s) => { document.getElementById('scherm-' + s).hidden = s !== wie; });
    document.body.classList.toggle('in-spel', !!spel);
    // sommige spellen (en de kunstkamer) vullen het hele scherm: dan verdwijnen de kop en de tekst eronder
    document.body.classList.toggle('volscherm', !!wie && document.getElementById('scherm-' + wie).classList.contains('volscherm'));
    if (wie && vorige !== wie) {
      window.scrollTo(0, 0);
      if (spel) window.Spellen[spel].start();
      else { const p = PAGINA[pagina] && PAGINA[pagina](); if (p && p.start) p.start(); }
    }
    if (!wie && window.Huis) {
      if (vorige === 'kunstkamer') {
        // uit de kunstkamer stap je weer op de gracht
        window.scrollTo(0, 0);
        requestAnimationFrame(() => window.Huis.naarBuiten());
      } else if (vorige) {
        // uit een spel of de pronkkamer: terug in de kamer (of op de gracht, als je daar was)
        window.scrollTo(0, 0);
        requestAnimationFrame(() => window.Huis.terugUit(vorige));
      } else if (vorige === undefined) {
        window.Huis.toon();
      }
    }
    document.title = wie ? `${document.getElementById('scherm-' + wie).querySelector('h1').textContent} · Het Speelhuys` : 'Het Speelhuys';
    huidig = wie;
    if (window.Muziek) { const m = spel ? (MUZIEK[spel] || [spel, 0]) : ['thuis', 0]; window.Muziek.kies(m[0], m[1]); }
  }

  // ---------- Hoogte van de kop, zodat de kamer precies het scherm vult ----------
  const kop = document.getElementById('kop');
  function meetKop() { document.documentElement.style.setProperty('--kop-h', kop.offsetHeight + 'px'); }
  meetKop();
  window.addEventListener('resize', meetKop);

  // ---------- Geluid ----------
  const geluidKnop = document.getElementById('knop-geluid');
  function geluidStand() {
    geluidKnop.setAttribute('aria-pressed', String(Geluid.aan));
    geluidKnop.title = Geluid.aan ? 'Geluid uitzetten' : 'Geluid aanzetten';
  }
  geluidKnop.addEventListener('click', () => { Geluid.zet(!Geluid.aan); geluidStand(); if (Geluid.aan) Geluid.pak(); });
  geluidStand();

  // ---------- Menu ----------
  const menu = document.getElementById('menu');
  const menuKnop = document.getElementById('knop-menu');
  let vorigeFocus = null;
  function openMenu() {
    vorigeFocus = document.activeElement;
    document.getElementById('menu-duiten').textContent = window.Duiten ? Duiten.saldo : 0;
    document.getElementById('menu-klussen').textContent = klussenTekst();
    tekenSeizoenen();
    tekenTijden();
    trilStand();
    document.getElementById('wis-vraag').hidden = true;
    document.getElementById('installeer').hidden = true;
    document.getElementById('menu-installeer').hidden = isApp();
    menu.hidden = false;
    menu.classList.remove('open'); void menu.offsetWidth; menu.classList.add('open');
    document.getElementById('menu-sluit').focus({ preventScroll: true });
  }
  function sluitMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus({ preventScroll: true });
  }
  menuKnop.addEventListener('click', openMenu);
  document.getElementById('menu-sluit').addEventListener('click', sluitMenu);
  menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluitMenu(); });
  document.getElementById('menu-buiten').addEventListener('click', () => {
    sluitMenu();
    if (location.hash && location.hash !== '#') location.hash = '#';
    setTimeout(() => { if (window.Huis) window.Huis.naarBuiten(); }, 50);
  });
  document.getElementById('menu-wis').addEventListener('click', () => { document.getElementById('wis-vraag').hidden = false; });
  document.getElementById('wis-nee').addEventListener('click', () => { document.getElementById('wis-vraag').hidden = true; });
  document.getElementById('wis-ja').addEventListener('click', () => {
    if (window.Duiten) Duiten.wis();
    if (window.Huis) Huis.werkBij();
    document.getElementById('menu-duiten').textContent = window.Duiten ? Duiten.saldo : 0;
    document.getElementById('menu-klussen').textContent = klussenTekst();
    document.getElementById('wis-vraag').hidden = true;
  });

  function klussenTekst() {
    if (!window.Duiten) return '0';
    let af = 0, alle = 0;
    Object.keys(Duiten.kamers).forEach((k) => {
      if (!Duiten.kamerOpen(k)) return;
      af += Duiten.aantalKlaar(k);
      alle += Duiten.klussenVan(k).length;
    });
    return `${af}/${alle}`;
  }
  document.getElementById('menu-kast').addEventListener('click', () => {
    sluitMenu();
    setTimeout(() => { location.hash = '#pronkkamer'; }, 60);
  });

  // ---------- Trillen ----------
  const trilKnop = document.getElementById('menu-tril');
  function trilStand() { if (trilKnop && window.Tril) trilKnop.setAttribute('aria-checked', String(Tril.aan)); }
  if (trilKnop) trilKnop.addEventListener('click', () => {
    if (!window.Tril) return;
    Tril.zet(!Tril.aan);
    trilStand();
    if (Tril.aan) Tril.klik();
  });

  // ---------- Seizoen kiezen ----------
  function tekenSeizoenen() {
    const vak = document.getElementById('seizoen-keuze');
    if (!vak || !window.Seizoen) return;
    vak.innerHTML = '';
    Object.keys(Seizoen.namen).forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seizoen-chip';
      b.setAttribute('aria-pressed', String(Seizoen.keuze === k));
      b.textContent = Seizoen.namen[k];
      b.addEventListener('click', () => { Seizoen.kies(k); tekenSeizoenen(); });
      vak.appendChild(b);
    });
  }

  // ---------- Tijd van de dag: volgt de klok, of kies er zelf een ----------
  const TIJD_NAMEN = { auto: 'Klok', ochtend: 'Ochtend', dag: 'Dag', avond: 'Avond', nacht: 'Nacht' };
  function tekenTijden() {
    const vak = document.getElementById('tijd-keuze');
    if (!vak || !window.Huis) return;
    vak.innerHTML = '';
    const keuze = Huis.tijdKeuze;
    Object.keys(TIJD_NAMEN).forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seizoen-chip';
      b.setAttribute('aria-pressed', String(keuze === k));
      b.textContent = TIJD_NAMEN[k];
      b.addEventListener('click', () => { Huis.kiesTijd(k); tekenTijden(); });
      vak.appendChild(b);
    });
  }

  // ---------- Proefknoppen (om alles snel te kunnen bekijken) ----------
  document.getElementById('proef-duiten').addEventListener('click', () => {
    if (!window.Duiten) return;
    Duiten.bij(200);
    document.getElementById('menu-duiten').textContent = Duiten.saldo;
  });
  document.getElementById('proef-schoen').addEventListener('click', () => {
    if (!window.Seizoen) return;
    if (Seizoen.schoenStand() === 'leeg') Seizoen.schoenKlik();
    Seizoen.schoenMorgen();
    if (window.Huis) Huis.werkBij();
    sluitMenu();
  });

  // ---------- Gijs de gans: de vraagteken-knop in elk spel ----------
  document.querySelectorAll('.les-knop').forEach((k) => {
    k.addEventListener('click', () => { if (window.Les) Les.toon(k.getAttribute('data-les')); });
  });

  // ---------- Een klein tikje bij elke aanraking ----------
  const TIKBAAR = 'button, a[href], [role="button"], .voorwerp, .plek-klik, .kast-vak, .seizoen-chip';
  document.addEventListener('pointerdown', (e) => {
    const doel = e.target.closest && e.target.closest(TIKBAAR);
    if (!doel || doel.disabled) return;
    if (window.Geluid && Geluid.tik) Geluid.tik();
  }, { passive: true });
  document.addEventListener('click', (e) => {
    const doel = e.target.closest && e.target.closest(TIKBAAR);
    if (!doel || doel.disabled) return;
    if (window.Tril) Tril.tik();
  });

  // ---------- Installeren als app ----------
  let installeerVraag = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installeerVraag = e; });
  function isApp() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  document.documentElement.classList.toggle('als-app', isApp());
  document.getElementById('menu-installeer').addEventListener('click', async () => {
    if (installeerVraag) {
      installeerVraag.prompt();
      try { await installeerVraag.userChoice; } catch (e) { /* */ }
      installeerVraag = null;
      return;
    }
    const uitleg = document.getElementById('installeer');
    uitleg.hidden = !uitleg.hidden;
  });

  // Offline werken via een service worker, alleen op de echte website (GitHub Pages) of lokaal.
  const host = location.hostname;
  if ('serviceWorker' in navigator && (host.endsWith('github.io') || host === 'localhost' || host === '127.0.0.1')) {
    let registratie = null, laatsteVraag = 0;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => { registratie = r; }).catch(() => { /* offline werken is een extraatje */ });
    });
    // Komt de app terug uit de achtergrond (een app op het beginscherm laadt dan niet opnieuw), vraag dan of er een
    // nieuwe versie is; zo blijft niemand hangen op een oude versie. Hoogstens eens per minuut.
    const vraagNieuweVersie = () => {
      if (!registratie || document.hidden || Date.now() - laatsteVraag < 60000) return;
      laatsteVraag = Date.now();
      registratie.update().catch(() => { /* geen internet: dan later */ });
    };
    document.addEventListener('visibilitychange', vraagNieuweVersie);
    window.addEventListener('focus', vraagNieuweVersie);
    window.addEventListener('online', vraagNieuweVersie);
    // Neemt een nieuwe versie het over, laad dan één keer opnieuw (niet midden in een spel: dan bij terugkomst in het huis).
    const hadVersie = !!navigator.serviceWorker.controller;
    let herladen = false;
    const herlaad = () => { if (!herladen) { herladen = true; location.reload(); } };
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadVersie) return;
      if (!location.hash || location.hash === '#') herlaad();
      else window.addEventListener('hashchange', () => { if (!location.hash || location.hash === '#') herlaad(); });
    });
  }

  window.addEventListener('hashchange', toon);
  toon();
})();
