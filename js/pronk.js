/* Pronkkast: verzamelobjecten die je met duiten koopt. Ze veranderen alleen hoe de spellen eruitzien,
   nooit je kans om te winnen. Net als in een 17e-eeuwse pronkkast staat je verzameling op planken. */
(function () {
  const SOORTEN = [
    { id: 'schijven', naam: 'Sjoelschijven' },
    { id: 'dobbels', naam: 'Dobbelstenen' },
    { id: 'stenen', naam: 'Molen- en damstenen' },
    { id: 'knikkers', naam: 'Knikkers' },
    { id: 'tollen', naam: 'Tollen' }
  ];
  // prijs 0 = heb je al; prijs null = alleen als cadeautje (bijvoorbeeld uit de schoen van Sinterklaas)
  const VOORWERPEN = [
    { id: 'schijf-beuk', soort: 'schijven', naam: 'Beukenhout', prijs: 0, s: { a: '#F6DDB0', b: '#D9A866', c: '#A8743C', rand: '#7A4B22' } },
    { id: 'schijf-kers', soort: 'schijven', naam: 'Kersenhout', prijs: 60, s: { a: '#EFA982', b: '#A94F2C', c: '#5E2410', rand: '#3E170A' } },
    { id: 'schijf-delft', soort: 'schijven', naam: 'Delfts blauw', prijs: 120, s: { a: '#FFFFFF', b: '#EEF1F6', c: '#BFC8DA', rand: '#1C3473', motief: 'delft' } },
    { id: 'schijf-goud', soort: 'schijven', naam: 'Gouden dukaten', prijs: 200, s: { a: '#FFF1B8', b: '#E2B44B', c: '#9A6B1F', rand: '#7A5418', motief: 'ster' } },
    { id: 'schijf-choco', soort: 'schijven', naam: 'Chocolade', prijs: null, s: { a: '#9A6844', b: '#5C3520', c: '#3A1E10', rand: '#24120A', motief: 'choco' } },

    { id: 'dobbel-been', soort: 'dobbels', naam: 'Been', prijs: 0, s: { a: '#FFFEF8', b: '#EDE4CC', c: '#D9CCA8', pip: '#2A1F18' } },
    { id: 'dobbel-delft', soort: 'dobbels', naam: 'Delfts blauw', prijs: 80, s: { a: '#FFFFFF', b: '#F1F3F8', c: '#D5DBE8', pip: '#1C3473' } },
    { id: 'dobbel-goud', soort: 'dobbels', naam: 'Goud', prijs: 150, s: { a: '#FFF3C2', b: '#E2B44B', c: '#9A6B1F', pip: '#3E2606' } },

    { id: 'steen-klassiek', soort: 'stenen', naam: 'Wit en zwart', prijs: 0, s: { wit: ['#FFFDF6', '#E6DCC6', '#B9AD92', '#8D8167'], zwart: ['#6A5F57', '#2C2522', '#151110', '#000000'] } },
    { id: 'steen-delft', soort: 'stenen', naam: 'Delfts', prijs: 90, s: { wit: ['#FFFFFF', '#EEF1F6', '#C9D2E4', '#8C9AB8'], zwart: ['#6684D0', '#1C3473', '#0E1A3E', '#0A1230'] } },
    { id: 'steen-barnsteen', soort: 'stenen', naam: 'Barnsteen en git', prijs: 160, s: { wit: ['#FFE7A8', '#E0A23A', '#9A5A12', '#6A3A08'], zwart: ['#5A5A64', '#18181C', '#050506', '#000000'] } },

    { id: 'knikker-klei', soort: 'knikkers', naam: 'Gebakken klei', prijs: 0, s: { a: '#E8CFAB', b: '#B88B5C', c: '#7A5432', ader: null, glans: 0.25 } },
    { id: 'knikker-glas', soort: 'knikkers', naam: 'Kattenoog', prijs: 70, s: { a: '#E8F6FF', b: '#59A7D9', c: '#1F4E79', ader: '#F4E06A', glans: 0.85 } },
    { id: 'knikker-agaat', soort: 'knikkers', naam: 'Agaat', prijs: 140, s: { a: '#F6E2D2', b: '#B0573A', c: '#5A2016', ader: '#F8F0E6', glans: 0.7 } },
    { id: 'knikker-delft', soort: 'knikkers', naam: 'Delfts', prijs: 180, s: { a: '#FFFFFF', b: '#EEF1F6', c: '#BFC8DA', ader: '#1C3473', glans: 0.8 } },

    { id: 'tol-kermis', soort: 'tollen', naam: 'Kermiskleuren', prijs: 0, s: { banden: ['#B6452C', '#1C3473', '#E7C36A'], kop: '#D45A3C' } },
    { id: 'tol-delft', soort: 'tollen', naam: 'Delfts blauw', prijs: 100, s: { banden: ['#F6F4EE', '#1C3473', '#F6F4EE'], kop: '#2B4C9A' } },
    { id: 'tol-goud', soort: 'tollen', naam: 'Goud', prijs: 180, s: { banden: ['#E2B44B', '#8A5A12', '#FFF1B8'], kop: '#C9973F' } }
  ];
  const opId = {};
  VOORWERPEN.forEach((v) => { opId[v.id] = v; });

  const D = () => window.Duiten;
  function bezit() {
    const standaard = VOORWERPEN.filter((v) => v.prijs === 0).map((v) => v.id);
    const lijst = D() ? D().veld('bezit', []) : [];
    return Array.from(new Set(standaard.concat(Array.isArray(lijst) ? lijst : [])));
  }
  function gekozen() { return (D() && D().veld('gekozen', {})) || {}; }
  function heeft(id) { return bezit().includes(id); }
  function gekozenId(soort) {
    const g = gekozen()[soort];
    if (g && heeft(g)) return g;
    return VOORWERPEN.find((v) => v.soort === soort && v.prijs === 0).id;
  }
  const luisteraars = [];
  function meld() { luisteraars.forEach((f) => { try { f(); } catch (e) { /* */ } }); }
  function kies(id) {
    const v = opId[id]; if (!v || !heeft(id)) return;
    const g = Object.assign({}, gekozen()); g[v.soort] = id;
    D().zetVeld('gekozen', g);
    meld();
  }
  function geef(id) {
    if (!opId[id] || heeft(id)) return false;
    D().zetVeld('bezit', bezit().concat([id]));
    return true;
  }

  // ---------- Kleine tekeningen voor de kast ----------
  function voorbeeld(v) {
    const s = v.s, id = 'pr-' + v.id;
    const grad = (naam, a, b, c) => `<radialGradient id="${naam}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
    let inhoud = '';
    if (v.soort === 'schijven') {
      inhoud = `<defs>${grad(id, s.a, s.b, s.c)}</defs>
        <ellipse cx="34" cy="38" rx="24" ry="24" fill="#000" opacity=".25"/>
        <circle cx="32" cy="34" r="24" fill="url(#${id})" stroke="${s.rand}" stroke-width="1.6"/>
        <circle cx="32" cy="34" r="14.5" fill="none" stroke="${s.rand}" stroke-opacity=".45" stroke-width="1.2"/>`;
      if (s.motief === 'delft') inhoud += `<circle cx="32" cy="34" r="20" fill="none" stroke="#1C3473" stroke-width="1.6"/><circle cx="32" cy="34" r="5" fill="#1C3473"/><path d="M32 22v4M32 42v4M20 34h4M40 34h4" stroke="#1C3473" stroke-width="1.6"/>`;
      if (s.motief === 'ster') inhoud += `<path d="M32 24l2.6 5.4 6 .7-4.4 4 1.2 5.9-5.4-3-5.4 3 1.2-5.9-4.4-4 6-.7z" fill="#8A6320"/>`;
      if (s.motief === 'choco') inhoud += `<path d="M14 34h36M32 16v36M19 21l26 26M45 21L19 47" stroke="#2A140A" stroke-opacity=".5" stroke-width="1.2"/><ellipse cx="24" cy="25" rx="6" ry="3" fill="#fff" opacity=".18"/>`;
    } else if (v.soort === 'dobbels') {
      const pip = (x, y) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${s.pip}"/>`;
      inhoud = `<defs>${grad(id, s.a, s.b, s.c)}</defs>
        <rect x="12" y="14" width="40" height="40" rx="8" fill="#000" opacity=".22" transform="translate(2 3)"/>
        <rect x="12" y="12" width="40" height="40" rx="8" fill="url(#${id})" stroke="rgba(0,0,0,.18)"/>
        ${pip(22, 22)}${pip(42, 22)}${pip(32, 32)}${pip(22, 42)}${pip(42, 42)}`;
    } else if (v.soort === 'stenen') {
      const steen = (cx, cy, k, n) => `<defs>${grad(id + n, k[0], k[1], k[2])}</defs><circle cx="${cx + 1.5}" cy="${cy + 2.5}" r="15" fill="#000" opacity=".28"/><circle cx="${cx}" cy="${cy}" r="15" fill="url(#${id + n})" stroke="${k[3]}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="9.5" fill="none" stroke="${k[3]}" stroke-opacity=".35"/>`;
      inhoud = steen(24, 38, s.wit, 'w') + steen(40, 26, s.zwart, 'z');
    } else if (v.soort === 'knikkers') {
      inhoud = `<defs>${grad(id, s.a, s.b, s.c)}</defs>
        <ellipse cx="34" cy="52" rx="16" ry="5" fill="#000" opacity=".25"/>
        <circle cx="32" cy="32" r="20" fill="url(#${id})"/>
        ${s.ader ? `<path d="M16 34 C 24 22, 34 46, 48 30" fill="none" stroke="${s.ader}" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>` : '<circle cx="26" cy="38" r="2" fill="#6A4628" opacity=".5"/><circle cx="38" cy="30" r="1.6" fill="#6A4628" opacity=".4"/>'}
        <ellipse cx="25" cy="24" rx="6" ry="4" fill="#fff" opacity="${s.glans}" transform="rotate(-30 25 24)"/>`;
    } else if (v.soort === 'tollen') {
      const [b1, b2, b3] = s.banden;
      inhoud = `<path d="M14 24 Q32 12 50 24 L35 54 L29 54 Z" fill="${b1}" stroke="rgba(0,0,0,.35)"/>
        <path d="M17 30 Q32 22 47 30 L44 36 Q32 30 20 36 Z" fill="${b2}"/>
        <path d="M24 42 Q32 39 40 42 L37 48 L27 48 Z" fill="${b3}"/>
        <ellipse cx="32" cy="23" rx="18" ry="5" fill="${s.kop}"/>
        <rect x="30" y="9" width="4" height="13" fill="#6B4423"/>`;
    }
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${inhoud}</svg>`;
  }

  // ---------- De kast ----------
  const kast = document.getElementById('pronkkast');
  let soort = 'schijven', vorigeFocus = null;

  function teken() {
    if (!kast) return;
    document.getElementById('kast-saldo').textContent = D() ? D().saldo : 0;
    const tabs = document.getElementById('kast-tabs');
    tabs.innerHTML = '';
    SOORTEN.forEach((so) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kast-tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(so.id === soort));
      b.setAttribute('aria-label', so.naam);
      b.title = so.naam;
      b.innerHTML = voorbeeld(opId[gekozenId(so.id)]);
      b.addEventListener('click', () => { soort = so.id; teken(); });
      tabs.appendChild(b);
    });
    const plank = document.getElementById('kast-plank');
    plank.innerHTML = `<h3 class="kast-soort">${SOORTEN.find((x) => x.id === soort).naam}</h3>`;
    const rij = document.createElement('div');
    rij.className = 'kast-rij';
    VOORWERPEN.filter((v) => v.soort === soort).forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      const isGekozen = gekozenId(soort) === v.id, isBezit = heeft(v.id);
      b.className = 'kast-vak' + (isBezit ? ' bezit' : '') + (isGekozen ? ' gekozen' : '') + (v.prijs === null && !isBezit ? ' cadeau' : '');
      let voet;
      if (isGekozen) voet = '<span class="vak-voet"><svg aria-hidden="true"><use href="#i-vink"/></svg></span>';
      else if (isBezit) voet = '<span class="vak-voet">Kies</span>';
      else if (v.prijs === null) voet = '<span class="vak-voet"><svg aria-hidden="true"><use href="#i-schoen"/></svg></span>';
      else voet = `<span class="vak-voet"><svg class="duit" aria-hidden="true"><use href="#i-duit"/></svg>${v.prijs}</span>`;
      b.innerHTML = `${voorbeeld(v)}<span class="vak-naam">${v.naam}</span>${voet}`;
      b.setAttribute('aria-label', isGekozen ? `${v.naam}, gekozen` : isBezit ? `${v.naam}, kiezen` : v.prijs === null ? `${v.naam}, alleen als cadeautje` : `${v.naam}, kopen voor ${v.prijs} duiten`);
      b.addEventListener('click', () => kiesVak(v, b));
      rij.appendChild(b);
    });
    plank.appendChild(rij);
    const noot = document.createElement('p');
    noot.className = 'kast-noot'; noot.id = 'kast-noot';
    plank.appendChild(noot);
  }

  function noot(tekst) { const n = document.getElementById('kast-noot'); if (n) n.textContent = tekst; }

  function kiesVak(v, knop) {
    if (heeft(v.id)) {
      if (gekozenId(v.soort) !== v.id) { kies(v.id); if (window.Geluid) Geluid.pak(); teken(); noot(`${v.naam} gekozen`); }
      return;
    }
    if (v.prijs === null) { noot('Alleen als cadeautje te krijgen'); schud(knop); return; }
    if (!D() || D().saldo < v.prijs) { noot(`Nog ${v.prijs - (D() ? D().saldo : 0)} duiten nodig`); schud(knop); if (window.Tril) Tril.fout(); return; }
    D().af(v.prijs);
    geef(v.id);
    kies(v.id);
    if (window.Geluid) Geluid.munt();
    if (window.Tril) Tril.succes();
    teken();
    const nieuw = Array.from(document.querySelectorAll('.kast-vak')).find((b) => b.classList.contains('gekozen'));
    if (nieuw) { nieuw.classList.add('nieuw'); setTimeout(() => nieuw.classList.remove('nieuw'), 900); }
    noot(`${v.naam} staat in je kast`);
  }
  function schud(b) { b.classList.remove('schud-vak'); void b.offsetWidth; b.classList.add('schud-vak'); }

  function open(welke) {
    if (!kast) return;
    if (welke) soort = welke;
    vorigeFocus = document.activeElement;
    teken();
    kast.hidden = false;
    kast.classList.remove('open'); void kast.offsetWidth; kast.classList.add('open');
    document.getElementById('kast-sluit').focus({ preventScroll: true });
  }
  function sluit() {
    if (!kast || kast.hidden) return;
    kast.hidden = true;
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus({ preventScroll: true });
  }
  if (kast) {
    document.getElementById('kast-sluit').addEventListener('click', sluit);
    kast.addEventListener('click', (e) => { if (e.target === kast) sluit(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluit(); });
    if (window.Duiten) window.Duiten.opWijziging(() => { if (!kast.hidden) document.getElementById('kast-saldo').textContent = D().saldo; });
  }

  window.Pronk = {
    soorten: SOORTEN,
    voorwerpen: VOORWERPEN,
    stijl(s) { return opId[gekozenId(s)].s; },
    gekozenId,
    heeft,
    geef,
    kies,
    voorbeeld,
    open,
    sluit,
    opWijziging(f) { luisteraars.push(f); }
  };
})();
