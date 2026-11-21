/* Seizoenen: Sinterklaas (half november tot 5 december), winter met ijspret (6 december tot eind februari)
   en Koningsdag (20 tot en met 27 april). De versiering staat in huis.js en wordt via
   data-seizoen op <html> aan- of uitgezet. In de sinterklaastijd kun je je schoen zetten. */
(function () {
  const SLEUTEL = 'speelhuys.seizoen';
  const NAMEN = { auto: 'Automatisch', sinterklaas: 'Sinterklaas', winter: 'Winter', koningsdag: 'Koningsdag', gewoon: 'Gewoon' };

  function opDatum(d) {
    const m = d.getMonth() + 1, dag = d.getDate();
    if ((m === 11 && dag >= 12) || (m === 12 && dag <= 5)) return 'sinterklaas';
    if ((m === 12 && dag >= 6) || m === 1 || m === 2) return 'winter';
    if (m === 4 && dag >= 20 && dag <= 27) return 'koningsdag';
    return 'gewoon';
  }
  let keuze = 'auto';
  try { keuze = localStorage.getItem(SLEUTEL) || 'auto'; } catch (e) { /* */ }
  if (!NAMEN[keuze]) keuze = 'auto';
  const luisteraars = [];
  function huidig() { return keuze === 'auto' ? opDatum(new Date()) : keuze; }
  function pasToe() {
    document.documentElement.setAttribute('data-seizoen', huidig());
    luisteraars.forEach((f) => { try { f(huidig()); } catch (e) { /* */ } });
  }
  pasToe();

  // ---------- Schoen zetten ----------
  const twee = (n) => String(n).padStart(2, '0');
  const vandaag = () => { const d = new Date(); return `${d.getFullYear()}-${twee(d.getMonth() + 1)}-${twee(d.getDate())}`; };
  const D = () => window.Duiten;
  function schoenStand() {
    const gezet = D() ? D().veld('schoen', null) : null;
    if (!gezet) return 'leeg';
    return gezet < vandaag() ? 'cadeau' : 'gezet';
  }
  function kiesCadeau() {
    const P = window.Pronk;
    if (P && !P.heeft('schijf-choco')) {
      P.geef('schijf-choco');
      return { soort: 'voorwerp', id: 'schijf-choco', titel: 'Chocolade sjoelschijven!', sub: 'Ze staan in je pronkkast' };
    }
    if (P && Math.random() < 0.3) {
      const kans = P.voorwerpen.filter((v) => v.prijs && v.prijs <= 120 && !P.heeft(v.id));
      if (kans.length) {
        const v = kans[Math.floor(Math.random() * kans.length)];
        P.geef(v.id);
        return { soort: 'voorwerp', id: v.id, titel: v.naam + '!', sub: 'Ze staan in je pronkkast' };
      }
    }
    const bedrag = 15 + Math.floor(Math.random() * 5) * 5;
    D().bij(bedrag);
    return { soort: 'duiten', bedrag, titel: `${bedrag} chocolade duiten!`, sub: 'Om mee op te knappen' };
  }
  function schoenKlik() {
    const stand = schoenStand();
    if (stand === 'leeg') { D().zetVeld('schoen', vandaag()); return 'gezet'; }
    if (stand === 'gezet') return 'wacht';
    D().zetVeld('schoen', null);
    toonCadeau(kiesCadeau());
    return 'cadeau';
  }

  // ---------- Cadeautje uitpakken ----------
  const cad = document.getElementById('cadeau');
  let vorigeFocus = null;
  function toonCadeau(c) {
    if (!cad) return;
    vorigeFocus = document.activeElement;
    const beeld = document.getElementById('cad-beeld');
    if (c.soort === 'voorwerp' && window.Pronk) {
      const v = window.Pronk.voorwerpen.find((x) => x.id === c.id);
      beeld.innerHTML = v ? window.Pronk.voorbeeld(v) : '';
    } else {
      beeld.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-duit"/></svg>';
    }
    document.getElementById('cad-titel').textContent = c.titel;
    document.getElementById('cad-sub').textContent = c.sub;
    cad.hidden = false;
    cad.classList.remove('open'); void cad.offsetWidth; cad.classList.add('open');
    if (window.Geluid) Geluid.cadeau();
    if (window.Tril) Tril.succes();
    document.getElementById('cad-ok').focus({ preventScroll: true });
  }
  function sluitCadeau() {
    if (!cad || cad.hidden) return;
    cad.hidden = true;
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus({ preventScroll: true });
  }
  if (cad) {
    document.getElementById('cad-ok').addEventListener('click', sluitCadeau);
    cad.addEventListener('click', (e) => { if (e.target === cad) sluitCadeau(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluitCadeau(); });
  }

  window.Seizoen = {
    namen: NAMEN,
    get huidig() { return huidig(); },
    get keuze() { return keuze; },
    kies(k) {
      keuze = NAMEN[k] ? k : 'auto';
      try { localStorage.setItem(SLEUTEL, keuze); } catch (e) { /* */ }
      pasToe();
    },
    opWijziging(f) { luisteraars.push(f); },
    schoenStand,
    schoenKlik,
    // proefknop: doe alsof de schoen gisteren is gezet
    schoenMorgen() { if (D()) D().zetVeld('schoen', '2000-01-01'); },
    toonCadeau
  };
})();
