/* Navigatie tussen de tegelwand en de spellen (via #ganzenbord, #sjoelen, #molenspel). */
(function () {
  const SPELLEN = ['ganzenbord', 'sjoelen', 'molenspel'];
  let huidig = null;

  function toon() {
    const naam = (location.hash || '').replace('#', '');
    const spel = SPELLEN.includes(naam) ? naam : null;
    if (huidig && huidig !== spel && window.Spellen[huidig]) window.Spellen[huidig].stop();
    document.getElementById('thuis').hidden = !!spel;
    SPELLEN.forEach((s) => { document.getElementById(s).hidden = s !== spel; });
    if (spel && huidig !== spel) {
      window.scrollTo(0, 0);
      window.Spellen[spel].start();
    }
    document.title = spel ? `${document.getElementById(spel).querySelector('h1').textContent} · Het Speelhuys` : 'Het Speelhuys';
    huidig = spel;
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
