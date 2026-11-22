/* Klaverjassen, schermvullend: aan de voorkamertafel met het Perzische kleed. Jij speelt samen met Opoe,
   tegenover je, tegen twee bewoners van het huis. De regels en het denkwerk staan in klaverregels.js.

   Overgenomen van succesvolle klaverjas-apps en van de kaarttafel thuis:
   - je kunt geen fout maken: kaarten die niet mogen zijn grijs, en tik je er toch op, dan hoor je waarom
     (bekennen, troeven, overtroeven, ondertroeven mag niet);
   - roem wordt vanzelf geroepen door wie de slag haalt; nat en pit worden gevierd (of betreurd);
   - de stand staat in een ouderwets klaverjasboekje: wij en zij, met de roem ernaast;
   - Rotterdams of Amsterdams, een kort potje van vier spellen of een hele boom van zestien;
   - tegenstanders met een gezicht; versla een paar en het volgende komt aan tafel;
   - de partij wordt bewaard als je even weggaat. */
(function () {
  'use strict';
  const K = window.Klaverregels;
  if (!K) return;
  const OPSLAG = 'speelhuys.klaverjassen';
  const BLAUW = '#1C3473';
  const INKT = ['#1F1B17', '#B3302A', '#B3302A', '#1F1B17'];
  const KLEURNAAM = ['Klaveren', 'Ruiten', 'Harten', 'Schoppen'];

  // ============================================================
  // TAFELGENOTEN
  // ============================================================
  const PAREN = [
    { id: 'jantje-grietje', wie: ['jantje', 'grietje'], niveau: 1, beloning: 30, speler: { soort: 'vlug', ruis: 0.35, troefRuis: 25 } },
    { id: 'grietje-kees', wie: ['grietje', 'kees'], niveau: 2, beloning: 50, speler: { soort: 'vlug', ruis: 0.04, troefRuis: 4 } },
    { id: 'kees-burgemeester', wie: ['kees', 'burgemeester'], niveau: 3, beloning: 80, speler: { soort: 'mc', tijd: 700, steekproeven: 32 } }
  ];
  const OPOE = { soort: 'mc', tijd: 550, steekproeven: 24 };
  const ZEGT = {
    opoe: { start: ['Kom, kind, we gaan kaarten.', 'Ik heb er zin in!'], roem: ['Roem, kind!', 'Die tellen we!'], nat: ['Ach, nat.', 'Dat wordt nat.'], zijNat: ['Nat! Goed zo.', 'Mooi zo, kind!'], pit: ['Pit! Prachtig!'], wint: ['Gewonnen, kind!'], verliest: ['Volgende keer beter.'] },
    jantje: { start: ['Ik kan al klaverjassen!', 'Kom maar op!'], roem: ['Roem! Hihi.', 'Twintig, toch?'], wijNat: ['Nat, nat, nat!'], nat: ['Oei, nat.'], pit: ['Pit!'], wint: ['Hoera!'], verliest: ['Nog een keer?'] },
    grietje: { start: ['Zullen we?', 'Schud maar goed.'], roem: ['Roem voor ons.', 'Dank je wel!'], wijNat: ['Nat, hoor!'], nat: ['Ach, nat.'], pit: ['Pit!'], wint: ['Gewonnen!'], verliest: ['Goed gespeeld!'] },
    kees: { start: ['Rustig aan, kaart voor kaart.', 'Daar gaan we.'], roem: ['Roem, zo maalt de molen.', 'Die is voor ons.'], wijNat: ['Nat. Fijngemalen.'], nat: ['Hm, nat.'], pit: ['Pit! Allemaal binnen.'], wint: ['Gewonnen!'], verliest: ['Knap gedaan.'] },
    burgemeester: { start: ['Welaan, de kaarten.', 'Ik speel om te winnen.'], roem: ['Roem. Uiteraard.', 'Genoteerd.'], wijNat: ['Nat. Zo gaat dat.'], nat: ['Hm. Nat.'], pit: ['Pit. Zoals verwacht.'], wint: ['De stad is van mij.'], verliest: ['Petje af!'] }
  };
  const ROEMWOORD = { 20: 'Twintig roem!', 40: 'Veertig roem!', 50: 'Vijftig roem!', 70: 'Zeventig roem!', 100: 'Honderd roem!', 120: 'Honderdtwintig!', 150: 'Honderdvijftig!' };
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const gezichtVan = (id) => (window.Personen && Personen.gezicht[id]) || '';
  const naamVan = (id) => (window.Personen && Personen.namen[id]) || id;
  // aan tafel noem je elkaar kort
  const TAFELNAAM = { kees: 'Kees', burgemeester: 'Burgemeester' };
  const tafelNaam = (id) => TAFELNAAM[id] || naamVan(id);
  const klein = (naam) => (naam.startsWith('De ') ? 'de ' + naam.slice(3) : naam);
  const paarNaam = (p) => `${naamVan(p.wie[0])} en ${klein(naamVan(p.wie[1]))}`;

  // ============================================================
  // KAARTEN TEKENEN: Hollandse letters, getekende plaatjes, een Delfts blauwe rug
  // ============================================================
  function symbool(s, x, y, maat, draai) {
    const kleur = INKT[s];
    const t = `translate(${x} ${y}) scale(${(maat / 100).toFixed(3)})${draai ? ' rotate(180 50 50)' : ''}`;
    if (s === 0) return `<g transform="${t}" fill="${kleur}"><circle cx="50" cy="29" r="18"/><circle cx="29" cy="57" r="18"/><circle cx="71" cy="57" r="18"/><path d="M40 36 L60 36 L62 60 L38 60 Z"/><path d="M50 52 C51 72 56 85 66 95 L34 95 C44 85 49 72 50 52 Z"/></g>`;
    if (s === 1) return `<g transform="${t}"><path d="M50 4 L86 50 L50 96 L14 50 Z" fill="${kleur}"/></g>`;
    if (s === 2) return `<g transform="${t}"><path d="M50 90 C24 70 6 52 6 32 C6 18 17 8 30 8 C39 8 46 13 50 21 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 52 76 70 50 90 Z" fill="${kleur}"/></g>`;
    return `<g transform="${t}"><path d="M50 6 C60 24 92 40 92 62 C92 75 82 83 71 83 C63 83 57 79 54 73 C55 83 59 90 66 95 L34 95 C41 90 45 83 46 73 C43 79 37 83 29 83 C18 83 8 75 8 62 C8 40 40 24 50 6 Z" fill="${kleur}"/></g>`;
  }
  const PIPS = [
    [[38, 40], [82, 40], [60, 62], [38, 84], [82, 84], [38, 128], [82, 128]],
    [[38, 40], [82, 40], [60, 62], [38, 84], [82, 84], [60, 106], [38, 128], [82, 128]],
    [[38, 40], [82, 40], [38, 69], [82, 69], [60, 84], [38, 99], [82, 99], [38, 128], [82, 128]],
    [[38, 40], [82, 40], [60, 55], [38, 69], [82, 69], [38, 99], [82, 99], [60, 113], [38, 128], [82, 128]]
  ];
  function plaatje(s, r) {
    const rood = s === 1 || s === 2, mantel = rood ? '#B3302A' : BLAUW, sier = rood ? BLAUW : '#B3302A', inkt = INKT[s];
    let g = `<rect x="22" y="28" width="76" height="112" rx="5" fill="#F7EFDD" stroke="${inkt}" stroke-width="1.6"/>`;
    g += `<rect x="25.5" y="31.5" width="69" height="105" rx="3" fill="none" stroke="#C9973F" stroke-width="1"/>`;
    g += `<path d="M28 136.5 Q30 106 60 102 Q90 106 92 136.5 Z" fill="${mantel}"/>`;
    if (r === 6) g += `<path d="M38 116 Q60 124 82 116 L84 124 Q60 133 36 124 Z" fill="#FBF8F0"/><g fill="#1F1B17"><circle cx="46" cy="121" r="1.2"/><circle cx="56" cy="124" r="1.2"/><circle cx="66" cy="124" r="1.2"/><circle cx="75" cy="121" r="1.2"/></g>`;
    if (r === 4) g += `<path d="M44 104 Q60 114 76 104 L72 112 Q60 118 48 112 Z" fill="#FBF8F0" stroke="#D3CDBF" stroke-width=".8"/>`;
    g += `<rect x="54" y="90" width="12" height="14" fill="#EFC6A2"/><circle cx="60" cy="80" r="15.5" fill="#F7D6B8"/>`;
    g += `<circle cx="54.6" cy="80" r="1.9" fill="#2A1A0C"/><circle cx="65.4" cy="80" r="1.9" fill="#2A1A0C"/><circle cx="51.5" cy="85.5" r="2.8" fill="#E8907A" opacity=".55"/><circle cx="68.5" cy="85.5" r="2.8" fill="#E8907A" opacity=".55"/>`;
    if (r === 6) {
      // de heer: kroon en baard
      g += `<path d="M47 86 Q48 101 60 103 Q72 101 73 86 Q67 93 60 93 Q53 93 47 86 Z" fill="#8A5A32"/><path d="M55 88 q5 3 10 0" stroke="#5A3A1E" stroke-width="1.6" fill="none"/>`;
      g += `<path d="M44 68 L45.5 52 L52.5 60.5 L60 48 L67.5 60.5 L74.5 52 L76 68 Z" fill="#E2B14C" stroke="#8A6418" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="60" r="2.4" fill="${sier}"/><circle cx="50" cy="63" r="1.7" fill="${sier}"/><circle cx="70" cy="63" r="1.7" fill="${sier}"/>`;
    } else if (r === 5) {
      // de vrouw: kanten mutsje, parelsnoer en een tulp
      g += `<path d="M46 81 Q45 68 60 66 Q75 68 74 81 Q70 73 60 72 Q50 73 46 81 Z" fill="#C98A3A"/>`;
      g += `<path d="M43 82 Q41 58 60 56 Q79 58 77 82 Q75 66 60 64.5 Q45 66 43 82 Z" fill="#FFFFFF" stroke="#D3CDBF" stroke-width="1"/><path d="M43 82 l-5 -9 l6 3 Z M77 82 l5 -9 l-6 3 Z" fill="#FFFFFF" stroke="#D3CDBF" stroke-width=".8"/>`;
      g += `<path d="M55.5 87.5 q4.5 3 9 0" stroke="#9A3A2A" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      g += `<g fill="#FBF8F0" stroke="#C9C0AA" stroke-width=".5">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${(47 + i * 4.3).toFixed(1)}" cy="${(107 + Math.sin(i / 6 * Math.PI) * 5).toFixed(1)}" r="1.9"/>`).join('')}</g>`;
      g += `<path d="M84 132 Q83 120 80 112" stroke="#3F7A3A" stroke-width="1.6" fill="none"/><path d="M80 114 q-6 -4 -4 -10 q3 3 4 2 q1 -5 4 -6 q2 4 1 8 q4 -2 5 0 q-2 6 -10 6 Z" fill="${rood ? '#E0A02A' : '#C8402A'}" stroke="#7A2A18" stroke-width=".6"/>`;
    } else {
      // de boer: hoed met veer en een snor
      g += `<path d="M53 86.5 q3.5 -2.6 7 0 q3.5 -2.6 7 0" stroke="#5A3A1E" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      g += `<path d="M47 76 Q47 63 60 62.5 Q73 63 73 76 Z" fill="#2A221C"/><ellipse cx="60" cy="70" rx="23" ry="5" fill="#2A221C"/><path d="M48 69 Q60 73 72 69" stroke="#C9973F" stroke-width="1.6" fill="none"/>`;
      g += `<path d="M70 66 Q86 52 92 40 Q86 58 72 68 Z" fill="${sier}" opacity=".9"/>`;
    }
    g += symbool(s, 27, 33, 13);
    g += `<g transform="rotate(180 60 84)">${symbool(s, 27, 33, 13)}</g>`;
    return g;
  }
  const voorkantCache = new Map();
  function voorkant(k) {
    if (voorkantCache.has(k)) return voorkantCache.get(k);
    const s = K.kleurVan(k), r = K.rangVan(k), inkt = INKT[s], label = K.RANGEN[r];
    let midden = '';
    if (r <= 3) {
      midden = PIPS[r].map(([x, y]) => symbool(s, x - 11, y - 11, 22, y > 84)).join('');
    } else if (r === 7) {
      midden = `<ellipse cx="60" cy="84" rx="34" ry="42" fill="none" stroke="${inkt}" stroke-opacity=".22" stroke-width="1.4"/>` + symbool(s, 33, 57, 54);
    } else {
      midden = plaatje(s, r);
    }
    const hoek = `<text x="13" y="27" font-family="EB Garamond, Georgia, serif" font-weight="600" font-size="${label === '10' ? 20 : 24}" text-anchor="middle" fill="${inkt}">${label}</text>${symbool(s, 6, 31, 14)}`;
    const svg = `<svg viewBox="0 0 120 168" aria-hidden="true"><rect x="1.5" y="1.5" width="117" height="165" rx="10" fill="url(#kj-papier)" stroke="#BCAE8C" stroke-width="1.6"/>${hoek}<g transform="rotate(180 60 84)">${hoek}</g>${midden}</svg>`;
    voorkantCache.set(k, svg);
    return svg;
  }
  const ACHTER = `<svg viewBox="0 0 120 168" aria-hidden="true"><rect x="1.5" y="1.5" width="117" height="165" rx="10" fill="#F4F1E8" stroke="#BCAE8C" stroke-width="1.6"/><rect x="8" y="8" width="104" height="152" rx="6" fill="url(#kj-rugpatroon)" stroke="${BLAUW}" stroke-width="2.4"/><circle cx="60" cy="84" r="25" fill="#F4F1E8" stroke="${BLAUW}" stroke-width="2.2"/><use href="#ill-gans" x="40" y="64" width="40" height="40" style="color:${BLAUW}" stroke="${BLAUW}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ============================================================
  // TOESTAND
  // ============================================================
  let podium, tafel, laag, ui = {}, gebouwd = false;
  let paar = PAREN[0], variant = 'rotterdams', lengte = 4;
  let partij = null;            // { spellen: [uitslagen], gever }
  let spel = null;              // stand van het huidige spel
  let fase = 'klaar';           // delen | troef | spelen | denkt | bezig | afrekening | klaar
  let toonSlag = null, gedeeld = null, omgedraaid = true, spelId = 0, druk = null, gekozen = -1, tipKaart = -1;
  const kaartEls = new Map(), plekNu = new Map();
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 40) : ms));
  const gewonnen = () => (window.Duiten ? Duiten.veld('klaver-gewonnen', {}) : {});
  const isOpen = (p) => { const i = PAREN.indexOf(p); return i <= 0 || (gewonnen()[PAREN[i - 1].id] || 0) > 0; };
  const wieZit = (zit) => (zit === 0 ? 'jij' : zit === 2 ? 'opoe' : paar.wie[zit === 1 ? 0 : 1]);
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const kleurSvg = (s, maat) => `<svg viewBox="0 0 100 100" width="${maat}" height="${maat}" aria-hidden="true">${symbool(s, 0, 0, 100)}</svg>`;

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('kj-podium');
    podium.innerHTML = '';
    podium.appendChild(html(`<svg class="mo-defs" width="0" height="0" aria-hidden="true"><defs>
      <linearGradient id="kj-papier" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFCF3"/><stop offset=".6" stop-color="#F8F0DE"/><stop offset="1" stop-color="#EFE3C8"/></linearGradient>
      <pattern id="kj-rugpatroon" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#F4F1E8"/><path d="M7 1.5 L12.5 7 L7 12.5 L1.5 7 Z" fill="none" stroke="${BLAUW}" stroke-width="1.1"/><circle cx="7" cy="7" r="1.6" fill="${BLAUW}"/></pattern>
    </defs></svg>`));
    const balk = html(`<div class="kj-balk">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <button class="kj-stand" type="button" aria-label="Het klaverjasboekje"><span class="kj-wij">Wij <b>0</b></span><span class="kj-zij"><b>0</b> Zij</span><small class="kj-teller"></small></button>
      <button class="mo-knop mo-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop mo-meer" type="button" aria-label="Kies je tegenstanders" title="Kies je tegenstanders" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const tafelEl = html(`<div class="kj-tafel">
      <div class="kj-medaillon" aria-hidden="true"></div>
      <div class="kj-troef" role="img" hidden></div>
      <div class="kj-kaarten"></div>
      ${[1, 2, 3].map((z) => `<div class="kj-zit" data-zit="${z}"><span class="kj-gezicht"></span><span class="kj-naam"></span><span class="mo-denk" hidden><i></i><i></i><i></i></span><span class="mo-ballon" hidden></span></div>`).join('')}
      <div class="kj-jij"><span class="kj-naam">Jij</span><span class="kj-doe"></span></div>
      <div class="kj-melding" hidden></div>
      <div class="kj-troefkeuze" hidden><p class="kj-troefkop">Kies troef</p><div class="kj-kleuren">${[0, 2, 3, 1].map((s) => `<button class="kj-kleur" type="button" data-s="${s}" aria-label="${KLEURNAAM[s]} is troef">${kleurSvg(s, 34)}<span>${KLEURNAAM[s]}</span></button>`).join('')}</div></div>
      <button class="kj-tipknop mo-knop mo-tip" type="button" aria-label="Tip" title="Tip">${icoon('tip')}</button>
      <div class="mo-banier" aria-hidden="true" hidden></div>
      <div class="mo-vonken" aria-hidden="true"></div>
    </div>`);
    const afrekening = html(`<div class="kj-afrekening" role="dialog" aria-modal="true" aria-label="Uitslag van het spel" hidden><div class="kj-afr-kaart">
      <p class="kj-afr-kop"></p>
      <div class="kj-afr-rijen"></div>
      <p class="kj-afr-uitslag"></p>
      <p class="kj-afr-stand"></p>
      <button class="knop kj-verder" type="button">Volgende spel</button>
    </div></div>`);
    const boekje = html(`<div class="kj-boekje" role="dialog" aria-modal="true" aria-label="Het klaverjasboekje" hidden><div class="kj-boek-kaart">
      <div class="kj-boek-kop"><span>Klaverjasboekje</span><button class="mo-knop kj-boek-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
      <table class="kj-boek-tabel"><thead><tr><th></th><th>Wij</th><th>roem</th><th>Zij</th><th>roem</th></tr></thead><tbody></tbody><tfoot></tfoot></table>
    </div></div>`);
    const menu = html(`<div class="mo-menu" role="dialog" aria-modal="true" aria-label="Kies je tegenstanders" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Met Opoe tegen…</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="mo-tegenstanders kj-paren"></div>
        <div class="kj-opties">
          <div class="kj-optie" role="group" aria-label="Regels"><button type="button" class="kj-chip" data-variant="rotterdams">Rotterdams</button><button type="button" class="kj-chip" data-variant="amsterdams">Amsterdams</button></div>
          <div class="kj-optie" role="group" aria-label="Lengte"><button type="button" class="kj-chip" data-lengte="4">4 spellen</button><button type="button" class="kj-chip" data-lengte="16">Een boom</button></div>
        </div>
        <div class="mo-menu-voet">
          <button class="mo-knop mo-geluid" type="button" aria-pressed="true" aria-label="Geluid" title="Geluid">${icoon('geluid')}<i class="streep"></i></button>
          <button class="mo-knop mo-muziek" type="button" aria-pressed="false" aria-label="Muziek" title="Muziek">${icoon('muziek')}<i class="streep"></i></button>
          <button class="mo-knop mo-nieuw" type="button" aria-label="Opnieuw beginnen" title="Opnieuw beginnen">${icoon('opnieuw')}</button>
        </div>
      </div>
    </div>`);
    const meld = html('<p class="sr-only" aria-live="polite"></p>');
    [balk, tafelEl, afrekening, boekje, menu, meld].forEach((e) => podium.appendChild(e));
    tafel = tafelEl;
    laag = tafelEl.querySelector('.kj-kaarten');
    ui = {
      balk, stand: balk.querySelector('.kj-stand'), troef: tafelEl.querySelector('.kj-troef'),
      zit: [null, ...[1, 2, 3].map((z) => tafelEl.querySelector(`.kj-zit[data-zit="${z}"]`))], jij: tafelEl.querySelector('.kj-jij'),
      melding: tafelEl.querySelector('.kj-melding'), troefkeuze: tafelEl.querySelector('.kj-troefkeuze'), tip: tafelEl.querySelector('.kj-tipknop'),
      banier: tafelEl.querySelector('.mo-banier'), vonken: tafelEl.querySelector('.mo-vonken'),
      afrekening, boekje, menu, meld, paren: menu.querySelector('.kj-paren')
    };
    balk.querySelector('.mo-meer').addEventListener('click', openMenu);
    balk.querySelector('.mo-vraag').addEventListener('click', () => { if (window.Les) Les.toon('klaverjassen'); });
    ui.stand.addEventListener('click', openBoekje);
    boekje.querySelector('.kj-boek-sluit').addEventListener('click', () => { boekje.hidden = true; });
    boekje.addEventListener('click', (e) => { if (e.target === boekje) boekje.hidden = true; });
    afrekening.querySelector('.kj-verder').addEventListener('click', volgende);
    ui.troefkeuze.querySelectorAll('.kj-kleur').forEach((b) => b.addEventListener('click', () => {
      if (fase !== 'troef' || !spel || spel.voorhand !== 0) return;
      zetTroef(+b.getAttribute('data-s'), 0);
    }));
    ui.tip.addEventListener('click', geefTip);
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.mo-nieuw').addEventListener('click', () => { sluitMenu(); nieuwePartij(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    menu.querySelectorAll('[data-variant]').forEach((c) => c.addEventListener('click', () => {
      if (variant === c.getAttribute('data-variant')) return;
      variant = c.getAttribute('data-variant');
      if (window.Duiten) Duiten.zetVeld('klaver-variant', variant);
      werkSchakelaars(); sluitMenu(); nieuwePartij();
    }));
    menu.querySelectorAll('[data-lengte]').forEach((c) => c.addEventListener('click', () => {
      if (lengte === +c.getAttribute('data-lengte')) return;
      lengte = +c.getAttribute('data-lengte');
      if (window.Duiten) Duiten.zetVeld('klaver-lengte', lengte);
      werkSchakelaars(); sluitMenu(); nieuwePartij();
    }));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (ui.menu && !ui.menu.hidden) sluitMenu();
      if (ui.boekje && !ui.boekje.hidden) ui.boekje.hidden = true;
    });
    laag.addEventListener('pointerdown', neer);
    laag.addEventListener('pointermove', beweeg);
    laag.addEventListener('pointerup', los);
    laag.addEventListener('pointercancel', () => { druk = null; plaatsAlles(true); });
    laag.addEventListener('keydown', (e) => {
      const el = e.target.closest && e.target.closest('.kj-kaart');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tikKaart(+el.dataset.k); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => pasMaatAan()).observe(tafel);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => pasMaatAan());
    window.addEventListener('resize', pasMaatAan);
    for (let k = 0; k < 32; k++) kaartEl(k);
    gebouwd = true;
  }

  function kaartEl(k) {
    let e = kaartEls.get(k);
    if (e) return e;
    e = document.createElement('div');
    e.className = 'kj-kaart dicht';
    e.dataset.k = k;
    e.innerHTML = `<div class="kj-binnen"><div class="kj-voor">${voorkant(k)}</div><div class="kj-achter">${ACHTER}</div></div>`;
    laag.appendChild(e);
    kaartEls.set(k, e);
    return e;
  }

  // ============================================================
  // WAAR LIGT ELKE KAART?
  // ============================================================
  let M = null;
  function maten() {
    const r = tafel.getBoundingClientRect();
    const W = r.width, H = r.height;
    // lage tafel (telefoon dwars): de hand zakt half onder de rand, de kaarten passen in de hoogte
    const kort = H < 400;
    const kb = kort ? Math.round(Math.max(40, Math.min(80, (H - 72) / 2.42 / 1.4))) : Math.round(Math.max(50, Math.min(108, W / 5.7, H / 6.4)));
    const kh = Math.round(kb * 1.4);
    const cy = kort ? (72 + (H - kh * 0.62)) / 2 : H * 0.45;
    return { W, H, kb, kh, cx: W / 2, cy, kort };
  }
  // de waaier van je hand: de stap tussen de kaarten en waar de eerste kaart ligt
  function handMaat(m, n) {
    const stap = n > 1 ? Math.min(m.kb * 0.68, (m.W - 16 - m.kb) / (n - 1)) : 0;
    return { stap, x0: (m.W - (m.kb + stap * Math.max(0, n - 1))) / 2 };
  }
  // jouw naam: boven je hand, of op een lage tafel links naast je kaarten
  function zetJij(n) {
    const m = M;
    if (!m || !ui.jij) return;
    if (!m.kort) { ui.jij.style.left = ''; ui.jij.style.right = ''; ui.jij.style.top = (m.H - m.kh - 40) + 'px'; return; }
    ui.jij.style.left = 'auto';
    ui.jij.style.right = Math.round(m.W - handMaat(m, Math.max(1, n)).x0 + 14) + 'px';
    ui.jij.style.top = Math.round(m.H - m.kh * 0.62 + m.kh * 0.06) + 'px';
  }
  function pasMaatAan() {
    if (!tafel) return;
    const m = maten();
    if (!m.W || !m.H) return;
    M = m;
    podium.style.setProperty('--kb', m.kb + 'px');
    podium.style.setProperty('--kh', m.kh + 'px');
    podium.classList.toggle('kort', m.kort);
    // de zijspelers schuiven naar binnen als hun naam anders over de rand zou lopen
    const naamBreed = (z) => { const n = ui.zit[z].querySelector('.kj-naam'); return n ? n.offsetWidth : 0; };
    const rand = m.kort ? 44 : 46;
    m.zx = [null, Math.max(rand, Math.ceil(20 + naamBreed(1) / 2)), m.cx, m.W - Math.max(rand, Math.ceil(20 + naamBreed(3) / 2))];
    // staand zitten de buren iets onder het midden: hun naam valt dan onder de slag in plaats van erdoor
    m.zy = m.kort ? m.cy : m.cy + m.kh * 0.36;
    // Opoe zo hoog als het kan, maar met haar hele gezicht binnen de rand
    const opoeH = ui.zit[2].offsetHeight || 64;
    m.zy2 = Math.max(m.kort ? 30 : 40, Math.ceil(opoeH / 2 + (m.kort ? 10 : 14)));
    const zitPlek = [null, [m.zx[1], m.zy], [m.cx, m.zy2], [m.zx[3], m.zy]];
    for (let z = 1; z <= 3; z++) { ui.zit[z].style.left = zitPlek[z][0] + 'px'; ui.zit[z].style.top = zitPlek[z][1] + 'px'; }
    zetJij(spel ? K.aantal(spel.handen[0]) : 8);
    plaatsAlles(false);
  }
  // de volgorde in je hand: troef vooraan, dan om en om rood en zwart; hoog naar laag
  function kleurVolgorde() {
    const t = spel && spel.troef >= 0 ? spel.troef : -1;
    if (t < 0) return [0, 2, 3, 1];
    const rood = t === 1 || t === 2, zwart = [0, 3].filter((x) => x !== t), roden = [2, 1].filter((x) => x !== t);
    return rood ? [t, zwart[0], roden[0], zwart[1]] : [t, roden[0], zwart[0], roden[1]];
  }
  function gesorteerd(hand) {
    const volg = kleurVolgorde(), tr = spel ? spel.troef : -1;
    return K.kaartenIn(hand).sort((a, b) => (volg.indexOf(K.kleurVan(a)) - volg.indexOf(K.kleurVan(b))) || (K.sterkte(b, tr) - K.sterkte(a, tr)));
  }
  function doelen() {
    const m = M, uit = new Map();
    if (!m || !spel) return uit;
    // wie welke slag won (voor de stapeltjes)
    const slagVan = new Map();
    spel.slagen.forEach((sl, i) => sl.kaarten.forEach((k) => slagVan.set(k, { team: sl.winnaar & 1, i })));
    const inToon = new Map();
    if (toonSlag) toonSlag.kaarten.forEach((k, i) => inToon.set(k, toonSlag.zitten[i]));
    spel.slag.forEach((k, i) => inToon.set(k, spel.zitten[i]));
    const delenTot = gedeeld === null ? 99 : gedeeld;
    const gedeeldSet = new Set(spel.delen.slice(0, delenTot).map((x) => x[1]));
    const sb = 0.4;
    for (let z = 0; z < 4; z++) {
      const lijst = z === 0 ? gesorteerd(spel.handen[0]) : K.kaartenIn(spel.handen[z]);
      const n = lijst.length;
      lijst.forEach((k, i) => {
        if (!gedeeldSet.has(k)) return;
        const t = n > 1 ? i / (n - 1) - 0.5 : 0;
        if (z === 0) {
          const { stap, x0 } = handMaat(m, n);
          const op = (k === gekozen ? 18 : 0) + (k === tipKaart ? 10 : 0);
          uit.set(k, { x: x0 + i * stap, y: (m.kort ? m.H - m.kh * 0.62 : m.H - m.kh - 8) + t * t * m.kh * 0.28 - op, r: t * 9, s: 1, dicht: !omgedraaid, z: 300 + i });
        } else if (z === 2) {
          uit.set(k, { x: m.cx - m.kb / 2 + t * m.kb * 1.1, y: (m.zy2 || (m.kort ? 30 : 40)) - m.kh / 2 - m.kh * 0.12 + t * t * 8, r: -t * 14, s: sb, dicht: true, z: 50 + i });
        } else {
          const x = (m.zx ? m.zx[z] : z === 1 ? 44 : m.W - 44) - m.kb / 2;
          const zy = m.zy === undefined ? m.cy - 6 : m.kort ? m.cy - 6 : m.zy;
          uit.set(k, { x, y: zy - m.kh * 0.32 - m.kh / 2 + t * m.kh * 0.3, r: (z === 1 ? 90 : -90) + t * 8, s: sb, dicht: true, z: 50 + i });
        }
      });
    }
    // de slag op tafel
    const d = m.kb * (m.kort ? 0.95 : 0.78), dy = m.kh * (m.kort ? 0.36 : 0.46);
    const PLEK = [[0, dy, -4], [-d, 0, 6], [0, -dy, 3], [d, 0, -7]];
    let volg = 0;
    for (const [k, zit] of inToon) {
      const [dx, ddy, r] = PLEK[zit];
      uit.set(k, { x: m.cx - m.kb / 2 + dx, y: m.cy - m.kh / 2 + ddy, r, s: 1, dicht: false, z: 200 + volg++ });
    }
    // de gewonnen slagen: een stapeltje voor wij (links onder) en zij (rechts boven)
    for (const [k, v] of slagVan) {
      if (inToon.has(k)) continue;
      const wij = v.team === 0;
      const x = wij ? 14 + m.kb * 0.1 : m.W - m.kb * 0.62 - 14;
      const y = m.kort ? (wij ? m.H - m.kh * 0.55 : m.kh * 0.2) : (wij ? m.H - m.kh * 1.62 : 92);
      uit.set(k, { x: x - m.kb * 0.28 + v.i * 1.4, y: y - m.kh * 0.3 - v.i * 1.2, r: (wij ? -8 : 8) + (v.i % 3) * 3, s: 0.42, dicht: true, z: 10 + v.i });
    }
    // nog niet gedeeld: op de stapel bij de gever
    if (gedeeld !== null) {
      const gp = [[m.cx, m.H - m.kh], [70, m.cy], [m.cx, 70], [m.W - 70, m.cy]][spel.gever];
      for (let k = 0; k < 32; k++) if (!uit.has(k)) uit.set(k, { x: gp[0] - m.kb / 2 + (k % 4) * 0.4, y: gp[1] - m.kh / 2 - k * 0.3, r: 0, s: 0.55, dicht: true, z: 400 + k });
    }
    return uit;
  }
  const transformVan = (p) => `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.r.toFixed(1)}deg) scale(${p.s})`;
  function plaatsAlles(anim, duur) {
    if (!M || !spel) return;
    zetJij(K.aantal(spel.handen[0]));
    const uit = doelen();
    const mag = fase === 'spelen' && spel.aan === 0 && !spel.klaar ? K.magNu(spel) : 0;
    for (let k = 0; k < 32; k++) {
      const e = kaartEl(k), p = uit.get(k);
      if (!p) { e.style.visibility = 'hidden'; plekNu.delete(k); continue; }
      e.style.visibility = '';
      const nieuw = transformVan(p), oud = plekNu.get(k);
      e.style.zIndex = p.z;
      e.classList.toggle('dicht', p.dicht);
      const inHand = !!(spel.handen[0] & K.bit(k));
      e.classList.toggle('mijn', inHand);
      e.classList.toggle('mag-niet', inHand && fase === 'spelen' && spel.aan === 0 && !(mag & K.bit(k)));
      e.classList.toggle('gekozen', k === gekozen);
      e.classList.toggle('tip', k === tipKaart);
      e.tabIndex = inHand && omgedraaid ? 0 : -1;
      e.setAttribute('role', inHand ? 'button' : 'img');
      e.setAttribute('aria-label', p.dicht ? 'kaart' : K.kaartNaam(k));
      if (oud === nieuw) continue;
      e.style.transform = nieuw;
      if (anim && oud && !rustig() && e.animate) {
        e.animate([{ transform: oud }, { transform: nieuw }], { duration: duur || 420, easing: 'cubic-bezier(.3,.7,.25,1)' });
      }
      plekNu.set(k, nieuw);
    }
  }

  // ============================================================
  // STAND, TROEF, SPREKEN
  // ============================================================
  function totalen() {
    const t = [0, 0];
    if (partij) for (const u of partij.spellen) { t[0] += u.score[0]; t[1] += u.score[1]; }
    return t;
  }
  function werkBij() {
    if (!ui.stand) return;
    const [wij, zij] = totalen();
    ui.stand.querySelector('.kj-wij b').textContent = wij;
    ui.stand.querySelector('.kj-zij b').textContent = zij;
    const nr = partij ? Math.min(lengte, partij.spellen.length + (spel && !spel.klaar ? 1 : 0)) : 0;
    ui.stand.querySelector('.kj-teller').textContent = partij ? `${Math.max(1, nr)}/${lengte}` : '';
    ui.stand.setAttribute('aria-label', `Stand: wij ${wij}, zij ${zij}. Spel ${Math.max(1, nr)} van ${lengte}. Tik voor het klaverjasboekje`);
    // troef en wie er speelt
    if (spel && spel.troef >= 0) {
      const nieuw = ui.troef.hidden;
      ui.troef.hidden = false;
      if (nieuw && !rustig()) { ui.troef.classList.remove('in'); void ui.troef.offsetWidth; ui.troef.classList.add('in'); }
      ui.troef.innerHTML = `${kleurSvg(spel.troef, 24)}<span class="kj-wie">${gezichtVan(spel.voorhand === 0 ? '' : wieZit(spel.voorhand)) || '<b>Jij</b>'}</span>`;
      ui.troef.setAttribute('aria-label', `${KLEURNAAM[spel.troef]} is troef. ${spel.voorhand === 0 ? 'Jij speelt' : naamVan(wieZit(spel.voorhand)) + ' speelt'}`);
      ui.troef.classList.toggle('wij', spel.spelend === 0);
    } else ui.troef.hidden = true;
    // wie is aan de beurt
    for (let z = 1; z <= 3; z++) ui.zit[z].classList.toggle('aan', !!spel && !spel.klaar && spel.aan === z && (fase === 'denkt' || fase === 'spelen' || fase === 'troef'));
    const mijnBeurt = !!spel && !spel.klaar && spel.aan === 0 && fase === 'spelen';
    ui.jij.classList.toggle('aan', mijnBeurt || (fase === 'troef' && spel && spel.voorhand === 0));
    const doe = ui.jij.querySelector('.kj-doe');
    doe.textContent = fase === 'troef' && spel && spel.voorhand === 0 ? 'Kies troef' : mijnBeurt ? (spel.slag.length ? 'Jouw beurt' : 'Kom uit') : '';
    ui.jij.classList.toggle('zegt', !!doe.textContent);
    ui.tip.hidden = !(mijnBeurt || (fase === 'troef' && spel && spel.voorhand === 0));
    ui.troefkeuze.hidden = !(fase === 'troef' && spel && spel.voorhand === 0);
    // terwijl jij troef kiest, praten de buren even niet (hun ballonnen zouden onder de keuze vallen)
    tafel.classList.toggle('kiest', !ui.troefkeuze.hidden);
  }
  function zetGezichten() {
    for (let z = 1; z <= 3; z++) {
      const id = wieZit(z);
      ui.zit[z].querySelector('.kj-gezicht').innerHTML = gezichtVan(id);
      ui.zit[z].querySelector('.kj-naam').textContent = tafelNaam(id);
      ui.zit[z].classList.toggle('maat', z === 2);
    }
    pasMaatAan();
  }
  function denkt(zit, aan) { if (zit > 0) ui.zit[zit].querySelector('.mo-denk').hidden = !aan; }
  function zeg(zit, tekst) {
    if (zit === 0 || !tekst) return;
    const b = ui.zit[zit].querySelector('.mo-ballon');
    b.textContent = tekst;
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(b._t);
    b._t = setTimeout(() => { b.hidden = true; }, 2300);
  }
  const zegSoort = (zit, soort) => { const id = wieZit(zit); if (ZEGT[id] && ZEGT[id][soort]) zeg(zit, willekeurig(ZEGT[id][soort])); };
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }
  function melding(tekst, duur, midden) {
    const m = ui.melding;
    m.textContent = tekst;
    // midden op de tafel als daar nog niets ligt, anders boven de slag
    m.style.top = midden && M ? Math.round(M.cy) + 'px' : '';
    m.hidden = false;
    m.classList.remove('in'); void m.offsetWidth; m.classList.add('in');
    clearTimeout(m._t);
    m._t = setTimeout(() => { m.hidden = true; }, duur || 1600);
  }
  function toonBanier(tekst, groot) {
    const b = ui.banier;
    b.textContent = tekst;
    b.classList.toggle('groot', !!groot);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(toonBanier.t);
    toonBanier.t = setTimeout(() => { b.hidden = true; }, groot ? 1700 : 1300);
  }
  function vonken(aantal) {
    if (rustig()) return;
    const r = tafel.getBoundingClientRect();
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (r.width * (0.2 + Math.random() * 0.6)) + 'px';
      v.style.top = (r.height * (0.2 + Math.random() * 0.5)) + 'px';
      ui.vonken.appendChild(v);
      const a = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(20 + Math.random() * 40).toFixed(0)}px)) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 400, easing: 'ease-out', fill: 'both' });
      a.onfinish = () => v.remove();
    }
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  function nieuwePartij() {
    spelId++;
    partij = { spellen: [], gever: 3 };
    spel = null; toonSlag = null; gekozen = -1; tipKaart = -1;
    ui.afrekening.hidden = true;
    ui.banier.hidden = true;
    zetGezichten();
    zegSoort(1, 'start');
    setTimeout(() => zegSoort(2, 'start'), 900);
    delen();
  }

  async function delen() {
    const mijnId = spelId;
    fase = 'delen';
    toonSlag = null; gekozen = -1; tipKaart = -1;
    spel = K.nieuwSpel({ gever: partij.gever, variant });
    gedeeld = 0; omgedraaid = false;
    plekNu.clear();
    plaatsAlles(false);
    werkBij();
    if (Geluid.schud) Geluid.schud();
    meld(`${partij.gever === 0 ? 'Jij geeft' : naamVan(wieZit(partij.gever)) + ' geeft'}. Spel ${partij.spellen.length + 1} van ${lengte}.`);
    await wacht(650);
    for (let i = 0; i < 32; i++) {
      if (mijnId !== spelId) return;
      gedeeld = i + 1;
      plaatsAlles(true, 360);
      if (i % 3 === 0 && Geluid.deel) Geluid.deel();
      await wacht(rustig() ? 0 : 34);
    }
    gedeeld = null;
    await wacht(380);
    if (mijnId !== spelId) return;
    omgedraaid = true;
    plaatsAlles(true);
    await wacht(520);
    if (mijnId !== spelId) return;
    bewaar();
    troefKiezen();
  }

  async function troefKiezen() {
    const mijnId = spelId;
    fase = 'troef';
    const vh = spel.voorhand;
    werkBij();
    if (vh === 0) { meld('Jij komt uit. Kies troef.'); return; }
    denkt(vh, true);
    await wacht(900);
    denkt(vh, false);
    if (mijnId !== spelId) return;
    const ruis = vh === 2 ? 0 : (paar.speler.troefRuis || 0);
    zetTroef(K.kiesTroef(spel.handen[vh], ruis), vh);
  }
  function zetTroef(t, vh) {
    spel.troef = t;
    fase = 'spelen';
    tipKaart = -1;
    const wie = vh === 0 ? 'Jij speelt' : `${naamVan(wieZit(vh))} speelt`;
    melding(`${KLEURNAAM[t]} is troef`, 1500, true);
    meld(`${KLEURNAAM[t]} is troef. ${wie}.`);
    if (Geluid.kling) Geluid.kling();
    plaatsAlles(true);
    werkBij();
    bewaar();
    verder();
  }

  // de computers spelen tot jij weer aan de beurt bent
  async function verder() {
    const mijnId = spelId;
    while (spel && !spel.klaar && mijnId === spelId) {
      if (spel.aan === 0) {
        fase = 'spelen';
        werkBij();
        plaatsAlles(true);
        return;
      }
      fase = 'denkt';
      werkBij();
      plaatsAlles(true);
      const k = await computerKaart(spel.aan);
      if (mijnId !== spelId) return;
      await legKaart(k);
    }
    if (spel && spel.klaar && mijnId === spelId) afrekening();
  }
  async function computerKaart(zit) {
    const cfg = zit === 2 ? OPOE : paar.speler;
    denkt(zit, true);
    const minimaal = wacht(380 + Math.random() * 380);
    let k = -1;
    if (cfg.soort === 'mc') {
      const [r] = await Promise.all([K.denk(spel, { tijd: cfg.tijd, steekproeven: cfg.steekproeven, vanafSlag: 2 }), minimaal]);
      k = r ? r.kaart : -1;
    } else {
      await minimaal;
      k = K.slimVlug(spel, cfg.ruis);
    }
    denkt(zit, false);
    const mag = K.magNu(spel);
    if (k < 0 || !(mag & K.bit(k))) k = K.kaartenIn(mag)[0];
    return k;
  }
  async function legKaart(k) {
    const mijnId = spelId, voor = spel, zit = spel.aan;
    spel = K.speel(spel, k);
    gekozen = -1; tipKaart = -1;
    // de troefmelding staat midden op tafel: weg zodra er een kaart op komt
    if (ui.melding.style.top && !ui.melding.hidden) ui.melding.hidden = true;
    if (Geluid.kaart) Geluid.kaart();
    if (window.Tril) Tril.tik();
    const af = spel.slagen.length > voor.slagen.length;
    if (af) toonSlag = spel.slagen[spel.slagen.length - 1];
    fase = af ? 'bezig' : fase;
    plaatsAlles(true, zit === 0 ? 320 : 440);
    werkBij();
    meld(`${zit === 0 ? 'Jij' : naamVan(wieZit(zit))}: ${K.kaartNaam(k)}`);
    await wacht(af ? 560 : 300);
    if (mijnId !== spelId) return;
    if (af) await slagAf();
    bewaar();
  }
  async function slagAf() {
    const mijnId = spelId, sl = toonSlag;
    const wk = sl.kaarten[sl.zitten.indexOf(sl.winnaar)];
    const el = kaartEl(wk);
    el.classList.add('wint');
    await wacht(480);
    if (mijnId !== spelId) return;
    if (sl.roem) {
      const woord = ROEMWOORD[sl.roem] || `${sl.roem} roem!`;
      const tekst = sl.soorten.length === 1 && sl.soorten[0] === 'stuk' ? 'Stuk!' : woord;
      if (sl.winnaar === 0) toonBanier(tekst, sl.roem >= 50);
      else zeg(sl.winnaar, tekst);
      if ((sl.winnaar & 1) === 0 && sl.winnaar !== 0) toonBanier(tekst, sl.roem >= 50);
      if (Geluid.tada && sl.roem >= 50) Geluid.tada(); else if (Geluid.kling) Geluid.kling();
      if ((sl.winnaar & 1) === 0) vonken(10 + Math.min(20, sl.roem / 5));
      meld(`${tekst} Voor ${(sl.winnaar & 1) === 0 ? 'ons' : 'hen'}.`);
      await wacht(1050);
      if (mijnId !== spelId) return;
    }
    el.classList.remove('wint');
    toonSlag = null;
    plaatsAlles(true, 460);
    if (Geluid.schuif) Geluid.schuif();
    werkBij();
    await wacht(420);
  }

  // ---------- jij speelt ----------
  function tikKaart(k) {
    if (!spel || fase !== 'spelen' || spel.aan !== 0 || !(spel.handen[0] & K.bit(k))) return;
    const reden = K.waaromNiet(spel.handen[0], spel.slag, spel.zitten, 0, spel.troef, spel.variant, k);
    if (reden) { magNiet(k, reden); return; }
    fase = 'bezig';
    legKaart(k).then(() => { if (fase !== 'afrekening' && fase !== 'klaar') verder(); });
  }
  const REDEN = {
    bekennen: (s) => `Bekennen: speel ${KLEURNAAM[s].toLowerCase()}`,
    troeven: () => 'Je moet troeven',
    overtroeven: () => 'Je moet overtroeven',
    ondertroeven: () => 'Ondertroeven mag niet'
  };
  function magNiet(k, reden) {
    if (window.Tril) Tril.fout();
    if (Geluid.pak) Geluid.pak();
    const e = kaartEl(k);
    e.classList.remove('schud'); void e.offsetWidth; e.classList.add('schud');
    melding(REDEN[reden](K.kleurVan(spel.slag[0])), 1800);
    meld(REDEN[reden](K.kleurVan(spel.slag[0])));
    // laat even zien welke kaarten wel mogen
    laag.classList.remove('wijs'); void laag.offsetWidth; laag.classList.add('wijs');
  }
  function kaartBij(e) { const el = e.target.closest && e.target.closest('.kj-kaart.mijn'); return el ? +el.dataset.k : -1; }
  function neer(e) {
    const k = kaartBij(e);
    if (k < 0 || !spel || fase !== 'spelen' || spel.aan !== 0) return;
    druk = { k, x: e.clientX, y: e.clientY, id: e.pointerId, sleept: false };
    try { laag.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    e.preventDefault();
  }
  function beweeg(e) {
    if (!druk || e.pointerId !== druk.id) return;
    const dx = e.clientX - druk.x, dy = e.clientY - druk.y;
    if (!druk.sleept && Math.hypot(dx, dy) > 12) druk.sleept = true;
    if (druk.sleept) {
      const el = kaartEl(druk.k), basis = plekNu.get(druk.k) || '';
      el.style.transform = `translate(${dx}px, ${dy}px) ` + basis;
      el.style.zIndex = 900;
    }
  }
  function los(e) {
    if (!druk || e.pointerId !== druk.id) return;
    const d = druk;
    druk = null;
    const dy = e.clientY - d.y;
    if (d.sleept) {
      const el = kaartEl(d.k);
      el.style.transform = plekNu.get(d.k) || '';
      if (dy < -(M ? M.kh * 0.45 : 50)) tikKaart(d.k);
      else plaatsAlles(true);
      return;
    }
    tikKaart(d.k);
  }

  async function geefTip() {
    if (!spel) return;
    if (fase === 'troef' && spel.voorhand === 0) {
      const t = K.kiesTroef(spel.handen[0], 0);
      ui.troefkeuze.querySelectorAll('.kj-kleur').forEach((b) => b.classList.toggle('tip', +b.getAttribute('data-s') === t));
      if (Geluid.pak) Geluid.pak();
      return;
    }
    if (fase !== 'spelen' || spel.aan !== 0) return;
    const mijnId = spelId, nr = spel.slagen.length * 4 + spel.slag.length;
    ui.tip.disabled = true;
    const r = await K.denk(spel, { tijd: 600, steekproeven: 24, vanafSlag: 2 });
    ui.tip.disabled = false;
    if (mijnId !== spelId || !spel || spel.slagen.length * 4 + spel.slag.length !== nr || fase !== 'spelen') return;
    tipKaart = r ? r.kaart : -1;
    plaatsAlles(true);
    if (Geluid.pak) Geluid.pak();
    if (tipKaart >= 0) meld(`Tip: ${K.kaartNaam(tipKaart)}`);
  }

  // ---------- na elk spel ----------
  function afrekening() {
    const mijnId = spelId;
    fase = 'afrekening';
    const u = spel.uitslag, sp = u.spelend;
    partij.spellen.push({ score: u.score, punten: u.punten, roem: u.roem, nat: u.nat, pit: u.pit, spelend: sp, troef: spel.troef, voorhand: spel.voorhand, ruw: spel.punten.slice(), ruweRoem: spel.roem.slice() });
    bewaar();
    werkBij();
    const wijSpelen = sp === 0;
    let uitslag = 'Gehaald!';
    if (u.pit) {
      uitslag = 'Pit!';
      toonBanier('Pit!', true); vonken(wijSpelen ? 30 : 0);
      if (wijSpelen) { zegSoort(2, 'pit'); if (Geluid.tada) Geluid.tada(); } else zegSoort(1, 'pit');
    } else if (u.nat) {
      uitslag = 'Nat!';
      toonBanier('Nat!', false);
      if (wijSpelen) { zegSoort(1, 'wijNat'); setTimeout(() => zegSoort(2, 'nat'), 700); if (Geluid.jammer) Geluid.jammer(); }
      else { zegSoort(2, 'zijNat'); setTimeout(() => zegSoort(3, 'nat'), 700); if (Geluid.tada) Geluid.tada(); vonken(16); }
    }
    // het kaartje met de uitslag
    const kop = ui.afrekening.querySelector('.kj-afr-kop');
    kop.innerHTML = `Spel ${partij.spellen.length} van ${lengte} · ${kleurSvg(spel.troef, 18)} ${spel.voorhand === 0 ? 'jij speelde' : naamVan(wieZit(spel.voorhand)) + ' speelde'}`;
    const rij = (team, naam) => {
      const roem = u.roem[team];
      return `<div class="kj-afr-rij ${team === 0 ? 'wij' : 'zij'}${team === sp ? ' speelt' : ''}"><span>${naam}</span><b>${u.punten[team]}</b><i>${roem ? '+' + roem + ' roem' : ''}</i></div>`;
    };
    ui.afrekening.querySelector('.kj-afr-rijen').innerHTML = rij(0, 'Wij') + rij(1, 'Zij');
    const uit = ui.afrekening.querySelector('.kj-afr-uitslag');
    uit.textContent = uitslag;
    uit.className = 'kj-afr-uitslag' + (u.nat ? (wijSpelen ? ' slecht' : ' goed') : u.pit ? ' goed' : '');
    const [wij, zij] = totalen();
    ui.afrekening.querySelector('.kj-afr-stand').textContent = `Stand: wij ${wij}, zij ${zij}`;
    const laatste = partij.spellen.length >= lengte;
    ui.afrekening.querySelector('.kj-verder').textContent = laatste ? 'Uitslag' : 'Volgende spel';
    meld(`${uitslag} Wij ${u.score[0]}, zij ${u.score[1]}. Stand: wij ${wij}, zij ${zij}.`);
    setTimeout(() => {
      if (mijnId !== spelId || fase !== 'afrekening') return;
      ui.afrekening.hidden = false;
      ui.afrekening.classList.remove('open'); void ui.afrekening.offsetWidth; ui.afrekening.classList.add('open');
      ui.afrekening.querySelector('.kj-verder').focus({ preventScroll: true });
    }, u.nat || u.pit ? 1300 : 500);
  }
  function volgende() {
    ui.afrekening.hidden = true;
    if (!partij) return;
    if (partij.spellen.length >= lengte) { einde(); return; }
    partij.gever = (partij.gever + 1) % 4;
    delen();
  }
  function einde() {
    fase = 'klaar';
    spel = null;
    const [wij, zij] = totalen();
    const ikWin = wij > zij, gelijk = wij === zij;
    let bedrag, tekst, verder = null;
    if (gelijk) {
      bedrag = 15; tekst = 'Gelijk spel';
      toonBanier('Gelijk!', false);
      if (Geluid.klok) Geluid.klok();
    } else if (ikWin) {
      const telling = gewonnen();
      const eerste = !telling[paar.id];
      telling[paar.id] = (telling[paar.id] || 0) + 1;
      if (window.Duiten) Duiten.zetVeld('klaver-gewonnen', telling);
      bedrag = paar.beloning * (lengte >= 16 ? 2 : 1);
      tekst = `Gewonnen met Opoe! ${wij} tegen ${zij}.`;
      toonBanier('Gewonnen!', true);
      if (Geluid.tada) Geluid.tada();
      vonken(40);
      zegSoort(2, 'wint');
      setTimeout(() => zegSoort(1, 'verliest'), 900);
      const volgendPaar = PAREN[PAREN.indexOf(paar) + 1];
      if (volgendPaar) {
        if (eerste) tekst += ` ${paarNaam(volgendPaar)} komen aan tafel!`;
        verder = { tekst: `Tegen ${paarNaam(volgendPaar)}`, actie: () => { paar = volgendPaar; if (window.Duiten) Duiten.zetVeld('klaver-paar', paar.id); nieuwePartij(); } };
      }
    } else {
      bedrag = 10; tekst = `Verloren, ${wij} tegen ${zij}. Goed geprobeerd!`;
      toonBanier('Verloren', false);
      if (Geluid.jammer) Geluid.jammer();
      zegSoort(1, 'wint');
      setTimeout(() => zegSoort(2, 'verliest'), 900);
    }
    partij.klaar = true;
    bewaar();
    werkBij();
    meld(tekst);
    if (window.Duiten) Duiten.beloon({ spel: 'klaverjassen', bedrag, gewonnen: ikWin, tekst, verder, wacht: 2000 });
  }

  // ---------- het klaverjasboekje ----------
  function openBoekje() {
    if (!partij) return;
    const body = ui.boekje.querySelector('tbody'), voet = ui.boekje.querySelector('tfoot');
    body.innerHTML = partij.spellen.map((u, i) => {
      const cel = (team) => {
        const nat = u.nat && u.spelend === team;
        return `<td class="${nat ? 'nat' : ''}">${nat ? 'nat' : u.punten[team]}</td><td class="roem">${u.roem[team] || ''}${u.pit && u.spelend === team ? '<sup>pit</sup>' : ''}</td>`;
      };
      return `<tr><th>${i + 1}<span class="kj-boek-troef">${kleurSvg(u.troef, 12)}</span></th>${cel(0)}${cel(1)}</tr>`;
    }).join('') + (partij.spellen.length < lengte ? `<tr class="leeg"><th>${partij.spellen.length + 1}</th><td></td><td></td><td></td><td></td></tr>` : '');
    const [wij, zij] = totalen();
    voet.innerHTML = `<tr><th>Totaal</th><td colspan="2">${wij}</td><td colspan="2">${zij}</td></tr>`;
    ui.boekje.hidden = false;
    ui.boekje.classList.remove('open'); void ui.boekje.offsetWidth; ui.boekje.classList.add('open');
  }

  // ---------- bewaren en terugkomen ----------
  function bewaar() {
    try {
      localStorage.setItem(OPSLAG, JSON.stringify({ paar: paar.id, variant, lengte, partij, spel: spel && !spel.klaar ? spel : null }));
    } catch (e) { /* geen opslag */ }
  }
  function laad() {
    try {
      const d = JSON.parse(localStorage.getItem(OPSLAG) || 'null');
      if (!d || !d.partij || d.partij.klaar || !Array.isArray(d.partij.spellen)) return null;
      if (d.spel && (!Array.isArray(d.spel.handen) || d.spel.handen.length !== 4)) d.spel = null;
      return d;
    } catch (e) { return null; }
  }

  // ============================================================
  // MENU
  // ============================================================
  function openMenu() {
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.paren.querySelector('.mo-keuze.nu') || ui.paren.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu() { ui.menu.hidden = true; }
  function werkSchakelaars() {
    const g = ui.menu.querySelector('.mo-geluid'), m = ui.menu.querySelector('.mo-muziek');
    g.setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    m.setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
    ui.menu.querySelectorAll('[data-variant]').forEach((c) => c.setAttribute('aria-pressed', String(c.getAttribute('data-variant') === variant)));
    ui.menu.querySelectorAll('[data-lengte]').forEach((c) => c.setAttribute('aria-pressed', String(+c.getAttribute('data-lengte') === lengte)));
  }
  function tekenMenu() {
    const telling = gewonnen();
    ui.paren.innerHTML = '';
    PAREN.forEach((p) => {
      const open = isOpen(p);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mo-keuze kj-paar' + (paar === p ? ' nu' : '') + (open ? '' : ' dicht');
      const keer = telling[p.id] || 0;
      const namen = paarNaam(p);
      b.innerHTML = `<span class="mo-gezicht"><span class="mo-twee">${gezichtVan(p.wie[0])}${gezichtVan(p.wie[1])}</span>${keer ? `<i class="mo-medaille">${icoon('ster')}</i>` : ''}${open ? '' : `<i class="mo-slot">${icoon('slot')}</i>`}</span>
        <span class="mo-keuze-naam">${namen}</span><span class="mo-wieken">${Array.from({ length: 3 }, (_, i) => `<svg class="${i < p.niveau ? 'vol' : ''}" aria-hidden="true"><use href="#i-kaarten"/></svg>`).join('')}</span>
        ${open ? `<span class="mo-keuze-prijs">${icoon('duit', 'duit')}${p.beloning}</span>` : ''}`;
      b.setAttribute('aria-label', `${namen}, niveau ${p.niveau} van 3${open ? '' : ', nog op slot'}${keer ? `, ${keer} keer gewonnen` : ''}`);
      b.addEventListener('click', () => {
        if (!open) {
          b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
          if (window.Tril) Tril.fout();
          if (Geluid.pak) Geluid.pak();
          return;
        }
        paar = p;
        if (window.Duiten) Duiten.zetVeld('klaver-paar', p.id);
        sluitMenu();
        nieuwePartij();
      });
      ui.paren.appendChild(b);
    });
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  if (window.Les) {
    const vakVan = (el) => el && el.getBoundingClientRect();
    const handVak = () => { const ks = Array.from(laag.querySelectorAll('.kj-kaart.mijn')).map((e) => e.getBoundingClientRect()); if (!ks.length) return null; const l = Math.min(...ks.map((r) => r.left)), t = Math.min(...ks.map((r) => r.top)), rr = Math.max(...ks.map((r) => r.right)), b = Math.max(...ks.map((r) => r.bottom)); return { left: l, top: t, width: rr - l, height: b - t }; };
    const midVak = () => { const r = tafel.getBoundingClientRect(); return { left: r.left + M.cx - M.kb * 1.3, top: r.top + M.cy - M.kh * 0.95, width: M.kb * 2.6, height: M.kh * 1.9 }; };
    Les.zet('klaverjassen', () => [
      { doel: handVak, gebaar: 'wijs', tekst: 'Dit zijn jouw kaarten' },
      { doel: () => vakVan(ui.zit[2]), vorm: 'rond', gebaar: 'wijs', tekst: 'Opoe is je maat: jullie spelen samen' },
      { doel: () => vakVan(!ui.troefkeuze.hidden ? ui.troefkeuze : ui.troef.hidden ? ui.stand : ui.troef), gebaar: 'wijs', tekst: 'Wie uitkomt, kiest troef' },
      { doel: midVak, gebaar: 'wijs', tekst: 'Speel dezelfde kleur. Heb je die niet? Dan troeven' },
      { doel: midVak, gebaar: 'wijs', tekst: 'Troefboer en troefnegen zijn het sterkst' },
      { doel: midVak, gebaar: 'wijs', tekst: 'Kaarten op een rij in één slag zijn roem' },
      { doel: () => vakVan(ui.stand), gebaar: 'wijs', tekst: 'Wie speelt, moet meer dan de helft halen. Anders nat' },
      { doel: () => vakVan(ui.balk.querySelector('.mo-meer')), vorm: 'rond', gebaar: 'tik', tekst: 'Hier kies je tegen wie je speelt' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.klaverjassen = {
    start() {
      const eerste = !gebouwd;
      if (eerste) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('klaver-paar', PAREN[0].id) : PAREN[0].id;
        const p = PAREN.find((x) => x.id === bewaard);
        paar = p && isOpen(p) ? p : PAREN[0];
        variant = window.Duiten ? Duiten.veld('klaver-variant', 'rotterdams') : 'rotterdams';
        lengte = window.Duiten ? +Duiten.veld('klaver-lengte', 4) || 4 : 4;
      }
      requestAnimationFrame(() => {
        pasMaatAan();
        if (eerste) {
          const oud = laad();
          const op = oud && PAREN.find((x) => x.id === oud.paar);
          if (oud && op && isOpen(op)) {
            paar = op; variant = oud.variant || variant; lengte = oud.lengte || lengte;
            partij = oud.partij;
            zetGezichten();
            if (oud.spel) {
              spel = oud.spel; gedeeld = null; omgedraaid = true; toonSlag = null;
              fase = spel.troef < 0 ? 'troef' : 'spelen';
              plaatsAlles(false); werkBij();
              if (spel.troef < 0) troefKiezen(); else verder();
              meld('Verder met jullie potje.');
            } else if (partij.spellen.length < lengte) {
              partij.gever = (partij.gever + 1) % 4;
              delen();
            } else einde();
          } else {
            nieuwePartij();
          }
        } else {
          werkBij();
          if (fase === 'delen' && partij) delen();
          else if (fase === 'afrekening') { ui.afrekening.hidden = false; }
          else if (spel && !spel.klaar) {
            if (fase === 'troef') troefKiezen();
            else if (fase === 'denkt' || fase === 'bezig' || fase === 'spelen') verder();
          }
        }
      });
      if (window.Les) Les.eersteKeer('klaverjassen');
    },
    stop() {
      spelId++;
      druk = null;
      if (ui.menu) sluitMenu();
      if (ui.boekje) ui.boekje.hidden = true;
      // een halve slag die nog werd afgehandeld, ruimen we op; de stand zelf blijft
      if (toonSlag) { toonSlag = null; plaatsAlles(false); }
      for (let z = 1; z <= 3; z++) if (ui.zit && ui.zit[z]) denkt(z, false);
      if (fase === 'denkt' || fase === 'bezig') fase = spel && spel.aan === 0 ? 'spelen' : 'denkt';
    },
    opnieuw() { nieuwePartij(); },
    // voor tests
    _toestand() { return { fase, spel, partij, paar: paar.id, variant, lengte }; },
    _speel(k) { tikKaart(k); },
    _troef(t) { if (fase === 'troef' && spel && spel.voorhand === 0) zetTroef(t, 0); },
    _verder() { volgende(); }
  };
})();
