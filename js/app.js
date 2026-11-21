/* Navigatie tussen het huis en de spellen (via #ganzenbord, #sjoelen, #molenspel),
   de knoppen in de kop, het menu en het installeren als app. */
(function () {
  const SPELLEN = ['ganzenbord', 'sjoelen', 'molenspel'];
  let huidig; // undefined = er is nog niets getoond

  function toon() {
    const naam = (location.hash || '').replace('#', '');
    const spel = SPELLEN.includes(naam) ? naam : null;
    const vorige = huidig;
    if (vorige && vorige !== spel && window.Spellen[vorige]) window.Spellen[vorige].stop();
    document.getElementById('thuis').hidden = !!spel;
    SPELLEN.forEach((s) => { document.getElementById('scherm-' + s).hidden = s !== spel; });
    document.body.classList.toggle('in-spel', !!spel);
    if (spel && vorige !== spel) {
      window.scrollTo(0, 0);
      window.Spellen[spel].start();
    }
    if (!spel && window.Huis) {
      if (vorige) {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => window.Huis.terugUit(vorige));
      } else if (vorige === undefined) {
        window.Huis.toon();
      }
    }
    document.title = spel ? `${document.getElementById('scherm-' + spel).querySelector('h1').textContent} · Het Speelhuys` : 'Het Speelhuys';
    huidig = spel;
    if (window.Muziek) window.Muziek.kies(spel || 'thuis');
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
    document.getElementById('menu-klussen').textContent = window.Duiten ? `${Duiten.aantalKlaar}/${Duiten.klussenLijst.length}` : '0';
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
    document.getElementById('menu-klussen').textContent = window.Duiten ? `0/${Duiten.klussenLijst.length}` : '0';
    document.getElementById('wis-vraag').hidden = true;
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
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline werken is een extraatje */ });
    });
  }

  window.addEventListener('hashchange', toon);
  toon();
})();
