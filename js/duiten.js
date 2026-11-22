/* Duiten: de munten die je verdient met spelen en uitgeeft aan het opknappen van het huis.
   Het huis heeft kamers met elk hun eigen klussen. Is een kamer klaar, dan kun je de volgende vrijspelen.
   Alles wordt in deze browser bewaard (localStorage). */
(function () {
  const SLEUTEL = 'speelhuys.staat';
  const BEGINSALDO = 30;

  // De kamers en hun klussen, van goedkoop naar duur. De tekeningen staan in huis.js.
  const KAMERS = {
    voorkamer: {
      naam: 'Voorkamer',
      klussen: [
        { id: 'spinnen', naam: 'Spinnenwebben weg', icoon: 'web', prijs: 10 },
        { id: 'ramen', naam: 'Ramen lappen', icoon: 'raam', prijs: 20 },
        { id: 'muren', naam: 'Muren witten', icoon: 'kwast', prijs: 30 },
        { id: 'vloer', naam: 'Vloer boenen', icoon: 'boender', prijs: 40 },
        { id: 'plint', naam: 'Tegels zetten', icoon: 'tegel', prijs: 50 },
        { id: 'kroon', naam: 'Kroonluchter', icoon: 'kroon', prijs: 60 },
        { id: 'prenten', naam: 'Prenten ophangen', icoon: 'prent', prijs: 60 },
        { id: 'servies', naam: 'Delfts servies', icoon: 'bord', prijs: 70 },
        { id: 'kleed', naam: 'Tafelkleed', icoon: 'kleed', prijs: 70 },
        { id: 'kat', naam: 'Kussen voor de kat', icoon: 'kat', prijs: 80 }
      ],
      // na de laatste klus: de trap naar de zolder
      ontgrendelt: { id: 'trap', naam: 'Trap naar de zolder', icoon: 'trap', prijs: 60, kamer: 'zolder' },
      spellen: ['ganzenbord', 'sjoelen', 'molenspel', 'dammen', 'klaverjassen']
    },
    zolder: {
      naam: 'Zolder',
      klussen: [
        { id: 'z-rommel', naam: 'Rommel opruimen', icoon: 'kist', prijs: 30 },
        { id: 'z-luik', naam: 'Hijsluik open', icoon: 'luik', prijs: 40 },
        { id: 'z-balken', naam: 'Balken schuren', icoon: 'kwast', prijs: 50 },
        { id: 'z-vloer', naam: 'Planken boenen', icoon: 'boender', prijs: 60 },
        { id: 'z-lantaarn', naam: 'Lantaarn', icoon: 'lantaarn', prijs: 60 },
        { id: 'z-kleed', naam: 'Lappendeken', icoon: 'kleed', prijs: 70 },
        { id: 'z-hobbel', naam: 'Hobbelpaard', icoon: 'paard', prijs: 80 },
        { id: 'z-duiven', naam: 'Duiven op de balk', icoon: 'duif', prijs: 90 }
      ],
      ontgrendelt: null,
      spellen: ['knikkeren', 'tollen']
    }
  };
  const SPEL_KAMER = {};
  Object.keys(KAMERS).forEach((k) => KAMERS[k].spellen.forEach((s) => { SPEL_KAMER[s] = k; }));

  const leeg = () => ({ duiten: BEGINSALDO, klussen: [], potjes: 0, velden: {} });
  let staat = leeg();
  try {
    const s = JSON.parse(localStorage.getItem(SLEUTEL) || 'null');
    if (s && typeof s.duiten === 'number' && Array.isArray(s.klussen)) staat = Object.assign(leeg(), s);
    if (!staat.velden || typeof staat.velden !== 'object') staat.velden = {};
  } catch (e) { /* geen opslag beschikbaar: we spelen zonder geheugen */ }

  const luisteraars = [];
  function bewaar() { try { localStorage.setItem(SLEUTEL, JSON.stringify(staat)); } catch (e) { /* */ } }
  function meld() { luisteraars.forEach((f) => { try { f(staat); } catch (e) { /* */ } }); }
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Munt-teller in de kop ----------
  const beurs = document.getElementById('beurs');
  const bedragEl = document.getElementById('beurs-bedrag');
  let getoond = staat.duiten, telFrame = 0;
  function toonBedrag(animeer) {
    const doel = staat.duiten;
    if (beurs) beurs.setAttribute('aria-label', doel + ' duiten');
    if (!bedragEl) return;
    cancelAnimationFrame(telFrame);
    if (!animeer || rustig()) { getoond = doel; bedragEl.textContent = doel; return; }
    beurs.classList.remove('wip'); void beurs.offsetWidth; beurs.classList.add('wip');
    const van = getoond, start = performance.now(), duur = 650;
    const stap = (t) => {
      const k = Math.min(1, (t - start) / duur);
      getoond = Math.round(van + (doel - van) * (1 - Math.pow(1 - k, 3)));
      bedragEl.textContent = getoond;
      if (k < 1) telFrame = requestAnimationFrame(stap);
    };
    telFrame = requestAnimationFrame(stap);
  }
  toonBedrag(false);

  const klaar = (id) => staat.klussen.includes(id);
  const Duiten = {
    kamers: KAMERS,
    kamerVanSpel(spel) { return SPEL_KAMER[spel] || 'voorkamer'; },
    klussenVan(kamer) { return (KAMERS[kamer] || KAMERS.voorkamer).klussen; },
    aantalKlaar(kamer) { return Duiten.klussenVan(kamer).filter((k) => klaar(k.id)).length; },
    kamerKlaar(kamer) { return Duiten.klussenVan(kamer).every((k) => klaar(k.id)); },
    // de voorkamer is altijd open; andere kamers gaan open met de ontgrendel-klus van een andere kamer
    kamerOpen(kamer) {
      if (kamer === 'voorkamer') return true;
      return Object.values(KAMERS).some((k) => k.ontgrendelt && k.ontgrendelt.kamer === kamer && klaar(k.ontgrendelt.id));
    },
    // volgende klus in deze kamer; na de laatste klus de ontgrendeling van de volgende kamer
    volgendeKlus(kamer) {
      const k = KAMERS[kamer] || KAMERS.voorkamer;
      const open = k.klussen.find((x) => !klaar(x.id));
      if (open) return open;
      if (k.ontgrendelt && !klaar(k.ontgrendelt.id)) return k.ontgrendelt;
      return null;
    },
    get saldo() { return staat.duiten; },
    klusKlaar(id) { return klaar(id); },
    bij(n) { staat.duiten += n; bewaar(); toonBedrag(true); meld(); },
    af(n) {
      if (staat.duiten < n) return false;
      staat.duiten -= n; bewaar(); toonBedrag(true); meld();
      return true;
    },
    markeer(id) { if (!klaar(id)) { staat.klussen.push(id); bewaar(); meld(); } },
    // kleine opslagvakjes voor andere onderdelen (pronkkast, schoen, records)
    veld(naam, standaard) { return Object.prototype.hasOwnProperty.call(staat.velden, naam) ? staat.velden[naam] : standaard; },
    zetVeld(naam, waarde) { staat.velden[naam] = waarde; bewaar(); meld(); },
    wis() { staat = leeg(); bewaar(); toonBedrag(false); meld(); },
    opWijziging(f) { luisteraars.push(f); },
    beloon
  };
  window.Duiten = Duiten;

  // ---------- Beloning na een spel ----------
  const bel = document.getElementById('beloning');
  let belSpel = null, belTimer = 0, vorigeFocus = null, belVerder = null;

  function beloon(o) {
    if (!o || !o.bedrag) return;
    staat.potjes = (staat.potjes || 0) + 1;
    Duiten.bij(o.bedrag);
    clearTimeout(belTimer);
    if (window.Tril) Tril.succes();
    // eerst even de uitslag laten zien, dan de beloning
    belTimer = setTimeout(() => {
      if (location.hash === '#' + o.spel) toonBeloning(o);
    }, o.wacht === undefined ? 1400 : o.wacht);
  }

  function toonBeloning(o) {
    if (!bel) return;
    belSpel = o.spel;
    belVerder = o.verder || null;
    const verder = document.getElementById('bel-verder');
    if (verder) {
      verder.hidden = !belVerder;
      if (belVerder) verder.querySelector('span').textContent = belVerder.tekst;
    }
    vorigeFocus = document.activeElement;
    document.getElementById('bel-sub-tekst').textContent = o.tekst || (o.gewonnen ? 'Gewonnen!' : 'Goed gespeeld');
    const v = Duiten.volgendeKlus(Duiten.kamerVanSpel(o.spel)) || Duiten.volgendeKlus('voorkamer');
    const vak = document.getElementById('bel-volgende');
    if (v) {
      vak.hidden = false;
      document.getElementById('bel-v-use').setAttribute('href', '#i-' + v.icoon);
      document.getElementById('bel-v-prijs').textContent = v.prijs;
      document.getElementById('bel-v-naam').textContent = v.naam;
      document.getElementById('bel-v-meter').style.width = Math.min(100, Math.round(staat.duiten / v.prijs * 100)) + '%';
      vak.classList.toggle('kan', staat.duiten >= v.prijs);
      vak.setAttribute('aria-label', `Volgende klus: ${v.naam}, ${v.prijs} duiten`);
    } else {
      vak.hidden = true;
    }
    bel.hidden = false;
    bel.classList.remove('open'); void bel.offsetWidth; bel.classList.add('open');
    const getal = document.getElementById('bel-bedrag');
    if (rustig()) getal.textContent = '+' + o.bedrag;
    else {
      const start = performance.now();
      const tel = (t) => {
        const k = Math.min(1, (t - start) / 900);
        getal.textContent = '+' + Math.round(o.bedrag * (1 - Math.pow(1 - k, 3)));
        if (k < 1 && !bel.hidden) requestAnimationFrame(tel);
      };
      requestAnimationFrame(tel);
    }
    if (window.Geluid && Geluid.munt) Geluid.munt();
    document.getElementById('bel-huis').focus({ preventScroll: true });
  }

  function sluit() {
    if (!bel || bel.hidden) return;
    bel.hidden = true;
    bel.classList.remove('open');
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus({ preventScroll: true });
  }

  if (bel) {
    document.getElementById('bel-huis').addEventListener('click', () => { sluit(); location.hash = '#'; });
    const verderKnop = document.getElementById('bel-verder');
    if (verderKnop) verderKnop.addEventListener('click', () => { const v = belVerder; sluit(); if (v && v.actie) v.actie(); });
    document.getElementById('bel-nog').addEventListener('click', () => {
      sluit();
      const s = window.Spellen && window.Spellen[belSpel];
      if (s && s.opnieuw) s.opnieuw();
    });
    bel.addEventListener('click', (e) => { if (e.target === bel) sluit(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluit(); });
    window.addEventListener('hashchange', sluit);
  }
})();
