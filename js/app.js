/* Navigatie tussen het huis en de spellen (via #ganzenbord, #sjoelen, #molenspel). */
(function () {
  const SPELLEN = ['ganzenbord', 'sjoelen', 'molenspel'];
  let huidig; // undefined = er is nog niets getoond

  function toon() {
    const naam = (location.hash || '').replace('#', '');
    const spel = SPELLEN.includes(naam) ? naam : null;
    const vorige = huidig;
    if (vorige && vorige !== spel && window.Spellen[vorige]) window.Spellen[vorige].stop();
    document.getElementById('thuis').hidden = !!spel;
    SPELLEN.forEach((s) => { document.getElementById(s).hidden = s !== spel; });
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
    document.title = spel ? `${document.getElementById(spel).querySelector('h1').textContent} · Het Speelhuys` : 'Het Speelhuys';
    huidig = spel;
    if (window.Muziek) window.Muziek.kies(spel || 'thuis');
  }

  const knop = document.getElementById('knop-geluid');
  function knopTekst() {
    knop.setAttribute('aria-pressed', String(Geluid.aan));
    knop.textContent = Geluid.aan ? 'Geluid aan' : 'Geluid uit';
  }
  knop.addEventListener('click', () => { Geluid.zet(!Geluid.aan); knopTekst(); if (Geluid.aan) Geluid.pak(); });
  knopTekst();

  window.addEventListener('hashchange', toon);
  toon();
})();
