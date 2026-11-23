/* De rondleiding: Gijs de gans laat zien hoe Het Speelhuys werkt.
   - Buiten aan de gracht: de deur naar de spellen, de duiten, het opknappen, de zolder, de plekken die nog komen,
     de Kunstkamer, het menu en het vraagteken.
   - Binnen in een kamer: een spel aan de muur, de klussen, de voortgang, de pronkkast en de weg naar buiten.
   De eerste keer begint hij vanzelf (na de opening); daarna via het vraagteken op de straat, in de kamer of in het menu. */
(function () {
  'use strict';
  if (!window.Les) return;
  const $ = (s) => document.querySelector(s);
  const zichtbaar = (e) => !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0;
  const knop = (plek) => $(`.plek-knop[data-plek="${plek}"]`);
  // één vak om een paar knoppen heen
  function samen(lijst) {
    const r = lijst.filter(zichtbaar).map((e) => e.getBoundingClientRect());
    if (!r.length) return null;
    const l = Math.min(...r.map((x) => x.left)), t = Math.min(...r.map((x) => x.top));
    const rr = Math.max(...r.map((x) => x.right)), b = Math.max(...r.map((x) => x.bottom));
    return { left: l, top: t, width: rr - l, height: b - t };
  }
  const alsZichtbaar = (e) => (zichtbaar(e) ? e : null);

  Les.zet('huis', () => {
    const deur = $('.gevel-svg .deur-klik');
    const wijzer = $('.gevel-svg .plek-wijzer[data-wijzer="voorkamer"]');
    return [
      { doel: () => alsZichtbaar(deur), marge: 12, gebaar: 'wijs', tekst: 'Welkom in Het Speelhuys! Achter deze deur staan de spellen. Tik op de deur om naar binnen te gaan' },
      { doel: () => alsZichtbaar($('#beurs')), marge: 8, gebaar: 'wijs', tekst: 'Met elk potje verdien je duiten. Win je, dan krijg je er meer' },
      zichtbaar(wijzer) ? { doel: () => wijzer, vorm: 'rond', marge: 6, gebaar: 'wijs', tekst: 'Met je duiten knap je het huis op: ramen lappen, muren witten, een kroonluchter. De gouden ring laat zien hoe ver je bent' } : null,
      { doel: () => alsZichtbaar(knop('zolder')), vorm: 'rond', marge: 4, gebaar: 'wijs', tekst: 'Is de voorkamer klaar, dan koop je de trap naar de zolder. Daar knikker en tol je' },
      { doel: () => samen(['herberg', 'kermis', 'ijsbaan'].map(knop)), marge: 6, gebaar: 'wijs', tekst: 'Later gaan er nog meer plekken open: de herberg, de kermis en de ijsbaan' },
      { doel: () => alsZichtbaar(knop('kunstkamer')), vorm: 'rond', marge: 4, gebaar: 'wijs', tekst: 'In de Kunstkamer lees en kijk je hoe de spellen vroeger gingen. Daar speel je niet' },
      // staat het vraagteken op de straat in beeld, dan wijst Gijs het aan; anders zit de rondleiding in het menu
      zichtbaar($('#knop-uitleg'))
        ? { doel: () => alsZichtbaar($('#knop-menu')), vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'In het menu vind je je pronkkast, het seizoen en de tijd van de dag' }
        : { doel: () => alsZichtbaar($('#knop-menu')), vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'In het menu vind je je pronkkast, het seizoen en deze rondleiding. In elk spel leg ik je ook uit hoe het werkt' },
      zichtbaar($('#knop-uitleg')) ? { doel: () => alsZichtbaar($('#knop-uitleg')), vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Weet je iets niet? Tik op het vraagteken. In elk spel leg ik je ook uit hoe het werkt' } : null
    ];
  });

  Les.zet('kamer', () => {
    const spel = [...document.querySelectorAll('#kamer .voorwerp.speelbaar')].find(zichtbaar);
    const vlak = spel && (spel.querySelector('.vlak') || spel);
    return [
      vlak ? { doel: () => vlak, marge: 6, gebaar: 'tik', tekst: 'Alles met een koperen bordje kun je spelen. Tik erop, dan begint het spel' } : null,
      { doel: () => alsZichtbaar($('#klusknop')), marge: 6, gebaar: 'wijs', tekst: 'Hier knap je de kamer op met je duiten: eerst de spinnenwebben, dan de ramen, en zo verder' },
      { doel: () => alsZichtbaar($('#voortgang')), marge: 6, gebaar: 'wijs', tekst: 'Zoveel klussen zijn er al klaar. Is alles af, dan gaat de volgende kamer open' },
      { doel: () => alsZichtbaar($('#knop-kast')), vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'In de pronkkast zet je wat je met je duiten koopt: mooie knikkers, tollen en stenen' },
      { doel: () => alsZichtbaar($('#knop-straat')), vorm: 'rond', marge: 5, gebaar: 'wijs', tekst: 'Hiermee ga je weer naar buiten, naar de gracht' }
    ];
  });

  const inKamer = () => { const k = document.getElementById('kamer'); return !!k && !k.hidden; };
  function begin() { Les.toon(inKamer() ? 'kamer' : 'huis'); }
  const kb = document.getElementById('knop-uitleg'), kk = document.getElementById('knop-uitleg-kamer'), km = document.getElementById('menu-uitleg');
  if (kb) kb.addEventListener('click', begin);
  if (kk) kk.addEventListener('click', begin);
  if (km) km.addEventListener('click', () => {
    const sluit = document.getElementById('menu-sluit');
    if (sluit) sluit.click();
    const opStraat = !location.hash || location.hash === '#';
    if (!opStraat) location.hash = '';
    setTimeout(begin, opStraat ? 250 : 900);
  });

  // de eerste keer: vanzelf, als de opening klaar is en je buiten aan de gracht staat
  const proef = new URLSearchParams(location.search).has('rondleiding');
  function misschienVanzelf() {
    if (navigator.webdriver && !proef) return;
    if (!window.Duiten || Duiten.veld('les-huis', false)) return;
    if (location.hash && location.hash !== '#') return;
    setTimeout(() => {
      const l = document.getElementById('les');
      const gevel = document.getElementById('gevel');
      if ((location.hash && location.hash !== '#') || !l || !l.hidden || !gevel || gevel.hidden) return;
      Les.toon('huis');
    }, 900);
  }
  if (window.OpeningKlaar) misschienVanzelf();
  else window.addEventListener('speelhuys:opening-klaar', misschienVanzelf, { once: true });
  window.Rondleiding = { begin };
})();
