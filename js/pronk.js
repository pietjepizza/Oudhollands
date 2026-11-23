/* De pronkkast: een glazen kast in de voorkamer.
   - Bovenin, achter glas, staan zilveren prijsjes. Elke prijs win je door de kampioen van een spel te verslaan.
     Zulke piepkleine zilveren voorwerpen maakten Amsterdamse zilversmeden in de 17e en 18e eeuw voor
     pronkkasten en poppenhuizen (zie de poppenhuizen en de miniaturen in het Rijksmuseum).
   - Onderin zitten vijf laatjes met speelgoed: daar kies je je sjoelschijven, dobbelstenen, stenen, knikkers en
     tollen, of koop je nieuwe met duiten. Ze veranderen alleen hoe de spellen eruitzien, nooit je kans om te winnen.
   De kast is een eigen scherm (#pronkkast); in de voorkamer hangt hij aan de muur en zie je wat erin staat. */
(function () {
  'use strict';
  const SOORTEN = [
    { id: 'schijven', naam: 'Sjoelschijven', kort: 'Schijven' },
    { id: 'dobbels', naam: 'Dobbelstenen', kort: 'Dobbels' },
    { id: 'stenen', naam: 'Molen- en damstenen', kort: 'Stenen' },
    { id: 'knikkers', naam: 'Knikkers', kort: 'Knikkers' },
    { id: 'tollen', naam: 'Tollen', kort: 'Tollen' }
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

  // De prijzen: één per spel. De spellen houden zelf bij van wie je gewonnen hebt; de kampioen is de laatste
  // tegenstander op de ladder. Bij het ganzenbord (geluk) win je van drie spelers tegelijk.
  const PRIJZEN = [
    { id: 'gans', spel: 'ganzenbord', titel: 'Ganzenbord', naam: 'Zilveren gans', veld: 'gans-gewonnen', minstens: 3, eis: 'Win van drie spelers tegelijk', gezicht: 'grietje' },
    { id: 'sjoelbak', spel: 'sjoelen', titel: 'Sjoelen', naam: 'Zilveren sjoelbakje', veld: 'sjoel-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' },
    { id: 'molen', spel: 'molenspel', titel: 'Molenspel', naam: 'Zilveren molentje', veld: 'molen-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' },
    { id: 'dam', spel: 'dammen', titel: 'Dammen', naam: 'Zilveren dam met kroon', veld: 'dam-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' },
    { id: 'kaarten', spel: 'klaverjassen', titel: 'Klaverjassen', naam: 'Vergulde kaarten', veld: 'klaver-gewonnen', kampioen: 'kees-burgemeester', eis: 'Win met Opoe van Kees en de burgemeester', gezicht: 'burgemeester' },
    { id: 'beker', spel: 'triktrak', titel: 'Triktrak', naam: 'Zilveren dobbelbeker', veld: 'trik-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' },
    { id: 'bikkels', spel: 'bikkelen', titel: 'Bikkelen', naam: 'Zilveren bikkels', veld: 'bik-gewonnen', kampioen: 'opoe', eis: 'Win van Opoe' },
    { id: 'kolf', spel: 'kolf', titel: 'Kolf op het ijs', naam: 'Zilveren kolf', veld: 'kolf-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' },
    { id: 'koek', spel: 'koekhappen', titel: 'Koekhappen', naam: 'Vergulde koek', veld: 'kh-gewonnen', kampioen: 'teun', eis: 'Win van bakkersjongen Teun' },
    { id: 'knikkers', spel: 'knikkeren', titel: 'Knikkeren', naam: 'Zilveren knikkerschaal', veld: 'knikker-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' },
    { id: 'tol', spel: 'tollen', titel: 'Tollen', naam: 'Zilveren tol', veld: 'tol-gewonnen', kampioen: 'burgemeester', eis: 'Win van de burgemeester' }
  ];
  const prijsOpId = {};
  PRIJZEN.forEach((p) => { prijsOpId[p.id] = p; });

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
  // een cadeautje of een aankoop: het ligt in het laatje, met een rood stipje tot je het laatje opentrekt
  function geef(id, gekocht) {
    if (!opId[id] || heeft(id)) return false;
    D().zetVeld('bezit', bezit().concat([id]));
    if (!gekocht) {
      const nieuw = D().veld('pk-nieuw', []);
      D().zetVeld('pk-nieuw', (Array.isArray(nieuw) ? nieuw : []).concat([opId[id].soort]));
    }
    return true;
  }
  const nieuweSoorten = () => { const n = D() ? D().veld('pk-nieuw', []) : []; return Array.isArray(n) ? n : []; };

  // ---------- Prijzen ----------
  function gewonnen(p) {
    if (typeof p === 'string') p = prijsOpId[p];
    if (!p || !D()) return false;
    const v = D().veld(p.veld, null);
    if (p.minstens) return typeof v === 'number' && v >= p.minstens;
    return !!(v && typeof v === 'object' && (v[p.kampioen] || 0) > 0);
  }
  const lijstVeld = (naam) => { const v = D() ? D().veld(naam, null) : null; return Array.isArray(v) ? v : null; };
  // nog niet bekeken in de kast (de kast in de voorkamer glinstert dan)
  function ongezien() {
    const gezien = lijstVeld('pk-gezien') || [];
    return PRIJZEN.filter((p) => gewonnen(p) && !gezien.includes(p.id)).map((p) => p.id);
  }
  // een prijs die bij dit spel hoort en nog niet in het beloningsscherm is gemeld
  function meldNieuw(spel) {
    if (!D()) return null;
    const gemeld = lijstVeld('pk-gemeld') || [];
    const p = PRIJZEN.find((x) => x.spel === spel && gewonnen(x) && !gemeld.includes(x.id));
    if (!p) return null;
    D().zetVeld('pk-gemeld', gemeld.concat([p.id]));
    return p;
  }
  // wie de prijzen al had voordat de kast bestond, krijgt ze er meteen bij (zonder beloningsscherm)
  if (D() && !lijstVeld('pk-gemeld')) D().zetVeld('pk-gemeld', PRIJZEN.filter(gewonnen).map((p) => p.id));

  // ---------- De zilveren prijsjes (viewBox 0 0 100 100) ----------
  const Z = 'url(#pk-zilver)', ZH = 'url(#pk-zilver-h)', ZR = 'url(#pk-zilver-r)', G = 'url(#pk-goud)', GH = 'url(#pk-goud-h)';
  const LIJN = '#454D57', DONKER = '#5B636D';
  const voet = (cx, y, rx) => `<ellipse cx="${cx}" cy="${y + 3}" rx="${rx}" ry="${(rx * 0.2).toFixed(1)}" fill="#7E5616"/><rect x="${cx - rx}" y="${y - 1}" width="${rx * 2}" height="4" fill="${GH}"/><ellipse cx="${cx}" cy="${y - 1}" rx="${rx}" ry="${(rx * 0.2).toFixed(1)}" fill="${ZR}" stroke="${LIJN}" stroke-width=".7"/>`;
  const glans = (d, breed) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${breed || 1.6}" stroke-linecap="round" opacity=".75"/>`;
  function zeil(hoek) {
    let s = `<g transform="rotate(${hoek} 50 36)"><path d="M50 36 V4" stroke="${DONKER}" stroke-width="2" stroke-linecap="round"/><rect x="51" y="6" width="7" height="24" fill="${ZH}" fill-opacity=".3" stroke="${ZH}" stroke-width="1.3"/><path d="M54.5 6 V30" stroke="${ZH}" stroke-width=".7"/>`;
    for (let y = 9; y < 30; y += 3) s += `<path d="M51 ${y} H58" stroke="${ZH}" stroke-width=".7"/>`;
    return s + '</g>';
  }
  function bikkel(x, y, hoek, s) {
    return `<g transform="translate(${x} ${y}) rotate(${hoek}) scale(${s})"><path d="M-10 -3 C-10 -7 -6 -8 -3 -6.5 C-1 -5.6 1 -5.6 3 -6.5 C6 -8 10 -7 10 -3 L10 3 C10 7 6 8 3 6.5 C1 5.6 -1 5.6 -3 6.5 C-6 8 -10 7 -10 3 Z" fill="${ZR}" stroke="${LIJN}" stroke-width=".8"/><path d="M-4 -1.5 C-1 1 1 1 4 -1.5" fill="none" stroke="${DONKER}" stroke-width="1"/><ellipse cx="-5" cy="-3.6" rx="3" ry="1.3" fill="#fff" opacity=".7"/></g>`;
  }
  function kaart(hoek, teken, rood) {
    const kleur = rood ? '#B6372A' : '#1F1A17';
    let figuur;
    if (teken === 'klaver') figuur = `<g fill="${kleur}"><circle cx="0" cy="-5" r="3.6"/><circle cx="-3.8" cy="0.2" r="3.6"/><circle cx="3.8" cy="0.2" r="3.6"/><path d="M-1 0 L1 0 L2.2 6.5 L-2.2 6.5 Z"/></g>`;
    else if (teken === 'hart') figuur = `<path d="M0 6 C-8 0 -7 -6.5 -3.4 -6.5 C-1.6 -6.5 -0.4 -5.2 0 -3.6 C0.4 -5.2 1.6 -6.5 3.4 -6.5 C7 -6.5 8 0 0 6 Z" fill="${kleur}"/>`;
    else figuur = `<path d="M0 -7.5 L5.4 0 L0 7.5 L-5.4 0 Z" fill="${kleur}"/>`;
    return `<g transform="rotate(${hoek} 50 84)"><rect x="37" y="30" width="26" height="40" rx="3" fill="#FBF8EF" stroke="${G}" stroke-width="1.8"/><rect x="40" y="33" width="20" height="34" rx="1.5" fill="none" stroke="#C99A3F" stroke-width=".6" opacity=".8"/><g transform="translate(50 50)">${figuur}</g></g>`;
  }
  const TEKENING = {
    gans: () => voet(48, 86, 25) +
      `<path d="M43 72 L42 84 M53 72 L54 84" stroke="#9A6A1E" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M14 47 C24 42 44 46 60 42 C64 34 60 22 66 14 C69 9 76 9 78 14 C74 22 70 30 72 44 C76 56 66 72 50 73 C36 74 22 66 18 56 C16 52 15 50 14 47 Z" fill="${Z}" stroke="${LIJN}" stroke-width="1.2"/>` +
      `<path d="M27 52 C36 44 52 46 62 52 C56 60 44 64 32 62 C28 61 26 56 27 52 Z" fill="${ZR}" stroke="${DONKER}" stroke-width="1"/>` +
      `<path d="M33 57 H55 M35 60.5 H51 M40 54 H58" stroke="${DONKER}" stroke-width=".8" opacity=".7"/>` +
      `<path d="M77 13.5 L88 17 L77.5 20 Z" fill="${G}" stroke="#7E5616" stroke-width=".5"/><circle cx="73" cy="14.5" r="1.4" fill="#1F242A"/>` +
      glans('M20 48 C28 45 40 47 52 46') + glans('M65 18 C63 24 63 30 64 38', 1.3),
    sjoelbak: () => `<path d="M16 90 L84 90 L69 20 L31 20 Z" fill="${DONKER}"/><path d="M18 88 L82 88 L68 22 L32 22 Z" fill="${Z}" stroke="${LIJN}" stroke-width="1"/>` +
      `<path d="M24 86 L76 86 L64.5 26 L35.5 26 Z" fill="#E9EDF0"/>` +
      `<path d="M35.6 27 H64.4 V36 H35.6 Z" fill="#C9D0D6"/><path d="M42.8 27 V36 M50 27 V36 M57.2 27 V36" stroke="${DONKER}" stroke-width="1.2"/>` +
      `<path d="M34.6 36 H65.4 V41 H34.6 Z" fill="${ZH}" stroke="${LIJN}" stroke-width=".7"/>` +
      [37.5, 44.7, 51.9, 59.1].map((x) => `<path d="M${x} 41 V38.6 Q${x + 1.7} 36.6 ${x + 3.4} 38.6 V41 Z" fill="#2B3138"/>`).join('') +
      [[44, 72, 1], [58, 60, 0.85], [49, 49, 0.72], [46, 31.5, 0.5], [60.5, 31.5, 0.5]].map(([x, y, s]) => `<ellipse cx="${x}" cy="${y + 1.6 * s}" rx="${6 * s}" ry="${2.4 * s}" fill="#000" opacity=".25"/><ellipse cx="${x}" cy="${y}" rx="${6 * s}" ry="${2.4 * s}" fill="${G}" stroke="#7E5616" stroke-width=".5"/>`).join('') +
      glans('M21 86 L33 25', 1.2),
    molen: () => voet(50, 87, 21) +
      `<path d="M36 86 L41 40 L59 40 L64 86 Z" fill="${ZH}" stroke="${LIJN}" stroke-width="1"/>` +
      `<path d="M45 40 L43.5 86 M55 40 L56.5 86" stroke="${DONKER}" stroke-width=".7" opacity=".6"/>` +
      `<path d="M33 62 H67" stroke="${G}" stroke-width="2.4"/><path d="M36 62 L40 67 M64 62 L60 67 M50 62 V67" stroke="${DONKER}" stroke-width=".8"/>` +
      `<path d="M46 86 V77 Q50 72 54 77 V86 Z" fill="#3C434B"/><rect x="48" y="49" width="4" height="5" fill="#3C434B"/>` +
      `<path d="M38.5 41 Q50 26 61.5 41 Z" fill="${Z}" stroke="${LIJN}" stroke-width="1"/>` +
      zeil(18) + zeil(108) + zeil(198) + zeil(288) +
      `<circle cx="50" cy="36" r="3" fill="${G}" stroke="#7E5616" stroke-width=".6"/>`,
    dam: () => {
      const schijf = (y) => `<path d="M23 ${y} V${y + 9} A27 8 0 0 0 77 ${y + 9} V${y} Z" fill="${ZH}" stroke="${LIJN}" stroke-width=".8"/>` +
        Array.from({ length: 13 }, (_, i) => { const x = 25 + i * 4.2; return `<path d="M${x.toFixed(1)} ${y + 1.5} V${(y + 9 + 6 * Math.sin(Math.acos(Math.max(-1, Math.min(1, (x - 50) / 27))))).toFixed(1)}" stroke="${DONKER}" stroke-width=".5" opacity=".55"/>`; }).join('') +
        `<ellipse cx="50" cy="${y}" rx="27" ry="8" fill="${ZR}" stroke="${LIJN}" stroke-width=".8"/><ellipse cx="50" cy="${y}" rx="18" ry="5.2" fill="none" stroke="${DONKER}" stroke-width=".9" opacity=".7"/>`;
      return `<ellipse cx="50" cy="88" rx="29" ry="5" fill="#000" opacity=".2"/>` + schijf(72) + schijf(60) +
        `<path d="M36 59 L34 43 L42 50 L50 38 L58 50 L66 43 L64 59 Z" fill="${G}" stroke="#7E5616" stroke-width=".8"/>` +
        `<rect x="35" y="54" width="30" height="5" rx="1" fill="${GH}" stroke="#7E5616" stroke-width=".6"/>` +
        `<circle cx="34" cy="42" r="1.8" fill="#FFF5CC"/><circle cx="50" cy="37" r="2" fill="#FFF5CC"/><circle cx="66" cy="42" r="1.8" fill="#FFF5CC"/>` +
        `<circle cx="50" cy="56.5" r="1.7" fill="#B6372A"/><circle cx="42" cy="56.5" r="1.3" fill="#2C58A8"/><circle cx="58" cy="56.5" r="1.3" fill="#2C58A8"/>`;
    },
    kaarten: () => `<ellipse cx="50" cy="89" rx="24" ry="4.5" fill="#000" opacity=".2"/>` + kaart(-22, 'hart', true) + kaart(22, 'ruit', true) + kaart(0, 'klaver', false) +
      `<path d="M30 80 Q50 92 70 80 L72 86 Q50 98 28 86 Z" fill="${ZH}" stroke="${LIJN}" stroke-width=".9"/>` + glans('M33 84 Q50 93 67 84', 1.1),
    beker: () => `<ellipse cx="46" cy="86" rx="19" ry="4.6" fill="#000" opacity=".22"/>` +
      `<path d="M27 24 L33 82 Q46 88 59 82 L65 24 Z" fill="${ZH}" stroke="${LIJN}" stroke-width="1"/>` +
      `<path d="M28.2 34 Q46 40 63.8 34 L63.2 39 Q46 45 28.8 39 Z" fill="${GH}"/><path d="M31.6 68 Q46 74 60.4 68 L60 73 Q46 79 32 73 Z" fill="${GH}"/>` +
      `<path d="M33 45 L39 62 L45 45 L51 62 L57 45 M36 62 L42 45 L48 62 L54 45 L60 62" fill="none" stroke="${DONKER}" stroke-width=".7" opacity=".7"/>` +
      `<ellipse cx="46" cy="24" rx="19" ry="5.6" fill="${ZR}" stroke="${LIJN}" stroke-width="1"/><ellipse cx="46" cy="24.8" rx="15.5" ry="4" fill="#20262C"/>` +
      glans('M33 30 L37 78', 1.6) +
      `<g transform="translate(66 74)"><path d="M0 0 l4 -3 h10 l-4 3 Z" fill="#FFFDF6" stroke="#8C8167" stroke-width=".5"/><path d="M10 0 l4 -3 v10 l-4 3 Z" fill="#D9CFB8" stroke="#8C8167" stroke-width=".5"/><rect width="10" height="10" fill="#F4EEDD" stroke="#8C8167" stroke-width=".5"/><circle cx="2.6" cy="2.6" r="1" fill="#1F1A15"/><circle cx="5" cy="5" r="1" fill="#1F1A15"/><circle cx="7.4" cy="7.4" r="1" fill="#1F1A15"/></g>`,
    bikkels: () => `<ellipse cx="50" cy="88" rx="30" ry="4.5" fill="#000" opacity=".2"/>` +
      bikkel(30, 80, 8, 1) + bikkel(68, 82, -12, 1) + bikkel(48, 70, 24, 1.05) +
      bikkel(64, 61, -70, 0.95) +
      `<circle cx="44" cy="84" r="6.5" fill="${G}" stroke="#7E5616" stroke-width=".7"/><ellipse cx="42" cy="81.5" rx="2.4" ry="1.4" fill="#fff" opacity=".8"/>`,
    kolf: () => voet(50, 88, 26) +
      `<path d="M28.5 12 L32 11 L58 76 L54.6 77.4 Z" fill="${ZH}" stroke="${LIJN}" stroke-width=".8"/>` +
      `<path d="M29.3 14 L32.4 13 M30.2 16.4 L33.3 15.4 M31.1 18.8 L34.2 17.8 M32 21.2 L35.1 20.2" stroke="#6B4423" stroke-width="1.6"/>` +
      `<path d="M52 74 L79 77 C83 77.5 84.5 82.5 80.5 84 L55 85.5 C51.5 85.6 50.5 82 51 78.5 Z" fill="${G}" stroke="#7E5616" stroke-width=".9"/>` +
      `<path d="M56 78 L78 80" stroke="#FFF5CC" stroke-width="1" opacity=".8"/>` +
      `<circle cx="30" cy="78" r="7.5" fill="${ZR}" stroke="${LIJN}" stroke-width=".8"/><path d="M23 77 Q30 81 37 77" fill="none" stroke="${DONKER}" stroke-width=".7"/>`,
    koek: () => voet(50, 88, 28) +
      `<rect x="24" y="14" width="4.5" height="73" fill="${ZH}" stroke="${LIJN}" stroke-width=".7"/><rect x="71.5" y="14" width="4.5" height="73" fill="${ZH}" stroke="${LIJN}" stroke-width=".7"/>` +
      `<rect x="20" y="10" width="60" height="5.5" rx="1.5" fill="${Z}" stroke="${LIJN}" stroke-width=".8"/>` +
      `<circle cx="22" cy="12.7" r="2.6" fill="${G}"/><circle cx="78" cy="12.7" r="2.6" fill="${G}"/>` +
      `<path d="M50 15.5 V36" stroke="#C99A3F" stroke-width="1"/><path d="M46 18 Q50 22 54 18 Q50 26 46 18 Z" fill="#B6372A"/>` +
      `<circle cx="50" cy="51" r="15.5" fill="${G}" stroke="#7E5616" stroke-width="1.1"/><circle cx="50" cy="51" r="12" fill="none" stroke="#7E5616" stroke-width=".7" stroke-dasharray="1.6 1.6"/>` +
      `<path d="M50 42 C53 42 53 46 50 47 C47 46 47 42 50 42 Z M46 49 L54 49 M50 47 V57 M50 57 L46.5 61 M50 57 L53.5 61" fill="none" stroke="#7E5616" stroke-width="1.2" stroke-linecap="round"/>` +
      `<ellipse cx="44" cy="44.5" rx="4" ry="2" fill="#FFF5CC" opacity=".8" transform="rotate(-35 44 44.5)"/>`,
    knikkers: () => `<ellipse cx="50" cy="90" rx="17" ry="3.6" fill="#7E5616"/><ellipse cx="50" cy="88" rx="17" ry="3.6" fill="${ZR}" stroke="${LIJN}" stroke-width=".7"/>` +
      `<path d="M46 88 L47.5 70 L52.5 70 L54 88 Z" fill="${ZH}"/><ellipse cx="50" cy="72" rx="5" ry="2.4" fill="${G}"/>` +
      `<ellipse cx="50" cy="46" rx="31" ry="9" fill="#2F363D"/>` +
      [[37, 41, '#B0573A', '#F8F0E6'], [50, 37, '#3F7EC0', '#F4E06A'], [62, 41, '#4E8F5A', '#F6F2E0'], [44, 44, '#E0A23A', null], [57, 45, '#F2F0EA', '#1C3473']].map(([x, y, k, a]) =>
        `<circle cx="${x}" cy="${y}" r="6.2" fill="${k}"/>${a ? `<path d="M${x - 5} ${y + 1} C${x - 2} ${y - 3} ${x + 1} ${y + 4} ${x + 5} ${y - 1}" fill="none" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/>` : ''}<circle cx="${x - 2}" cy="${y - 2.4}" r="1.6" fill="#fff" opacity=".85"/>`).join('') +
      `<path d="M19 46 C19 62 36 71 50 71 C64 71 81 62 81 46 C81 52 66 56 50 56 C34 56 19 52 19 46 Z" fill="${ZH}" stroke="${LIJN}" stroke-width="1"/>` +
      `<path d="M19 46 C19 52 34 56 50 56 C66 56 81 52 81 46" fill="none" stroke="${G}" stroke-width="2"/>` + glans('M25 54 C31 63 41 67 50 68', 1.4),
    tol: () => `<ellipse cx="52" cy="90" rx="14" ry="3" fill="#000" opacity=".22"/>` +
      `<g transform="rotate(9 50 88)"><rect x="47" y="10" width="6" height="16" rx="2" fill="${G}" stroke="#7E5616" stroke-width=".6"/>` +
      `<path d="M27 32 C27 22 73 22 73 32 C73 50 58 66 53 80 L50 89 L47 80 C42 66 27 50 27 32 Z" fill="${ZH}" stroke="${LIJN}" stroke-width="1"/>` +
      `<path d="M27.6 36 Q50 44 72.4 36 L71.6 40.5 Q50 48.5 28.4 40.5 Z" fill="${GH}"/><path d="M33.5 51 Q50 57 66.5 51" fill="none" stroke="${DONKER}" stroke-width="1"/><path d="M38.5 60 Q50 64.5 61.5 60" fill="none" stroke="${DONKER}" stroke-width="1"/>` +
      `<ellipse cx="50" cy="29" rx="22" ry="6" fill="${ZR}" stroke="${LIJN}" stroke-width=".8"/><path d="M46.5 80 L50 89 L53.5 80 Z" fill="${G}"/>` +
      glans('M33 34 C34 46 40 58 46 70', 1.6) + '</g>'
  };
  function tekenPrijs(id) { const f = TEKENING[id]; return f ? f() : ''; }
  function prijsSvg(id, klasse) { return `<svg class="${klasse || ''}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${tekenPrijs(id)}</svg>`; }

  // ---------- Kleine tekeningen van het speelgoed ----------
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

  // ============================================================
  // HET SCHERM: de kast met deurtjes, planken en laatjes
  // ============================================================
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const klank = (naam) => { if (window.Geluid && Geluid[naam]) Geluid[naam](); };
  const PER_PLANK = 4;
  let zaal = null, gebouwd = false, openLa = null, gekozenInLa = null, kaartjeVan = null, actief = false;

  function bouw() {
    zaal = document.getElementById('pk-zaal');
    if (!zaal) return;
    const planken = Math.ceil(PRIJZEN.length / PER_PLANK);
    let plankHtml = '';
    for (let i = 0; i < planken; i++) {
      plankHtml += `<div class="pk-plank" role="list">${PRIJZEN.slice(i * PER_PLANK, (i + 1) * PER_PLANK).map((p) => `<button class="pk-prijs" type="button" role="listitem" data-prijs="${p.id}">${prijsSvg(p.id)}<i class="pk-glim" aria-hidden="true"></i></button>`).join('')}${i === planken - 1 ? '<span class="pk-servies" aria-hidden="true"></span>' : ''}</div>`;
    }
    zaal.innerHTML = `
      <header class="pk-kop">
        <a class="mo-knop pk-terug" href="#" aria-label="Terug" title="Terug">${icoon('terug')}</a>
        <span class="pk-saldo" aria-label="Duiten"><svg class="duit" aria-hidden="true"><use href="#i-duit"/></svg><b class="pk-saldo-getal">0</b></span>
      </header>
      <div class="pk-midden">
        <div class="pk-kast">
          <div class="pk-kroon"><span class="pk-plaat"><b>Pronkkast</b><small class="pk-teller"></small></span></div>
          <div class="pk-vitrine">
            <div class="pk-binnen">${plankHtml}</div>
            <div class="pk-deur pk-deur-l" aria-hidden="true"></div>
            <div class="pk-deur pk-deur-r" aria-hidden="true"></div>
          </div>
          <div class="pk-laden" role="list" aria-label="Laatjes met speelgoed">${SOORTEN.map((so) => `<button class="pk-la" type="button" role="listitem" data-soort="${so.id}"><span class="pk-la-raam"></span><span class="pk-la-naam">${so.kort}</span><i class="pk-la-greep" aria-hidden="true"></i><i class="pk-stip" aria-hidden="true"></i></button>`).join('')}</div>
          <div class="pk-voet" aria-hidden="true"></div>
        </div>
      </div>
      <div class="pk-sluier" hidden></div>
      <div class="pk-kaartje" role="dialog" aria-modal="true" aria-labelledby="pk-k-naam" hidden>
        <button class="pk-x" type="button" aria-label="Sluiten">${icoon('sluit')}</button>
        <div class="pk-k-beeld"></div>
        <p class="pk-k-naam" id="pk-k-naam"></p>
        <p class="pk-k-regel"></p>
        <a class="knop pk-k-speel" href="#">${icoon('pijl')}<span></span></a>
      </div>
      <div class="pk-lade" role="dialog" aria-modal="true" aria-labelledby="pk-l-naam" hidden>
        <div class="pk-l-kop"><p class="pk-l-naam" id="pk-l-naam"></p><button class="pk-x" type="button" aria-label="Laatje dicht">${icoon('sluit')}</button></div>
        <div class="pk-l-vakken"></div>
        <button class="knop pk-l-doe" type="button"></button>
      </div>`;
    zaal.querySelectorAll('.pk-prijs').forEach((b) => b.addEventListener('click', () => toonKaartje(b.getAttribute('data-prijs'), b)));
    zaal.querySelectorAll('.pk-la').forEach((b) => b.addEventListener('click', () => (openLa === b.getAttribute('data-soort') ? sluitLa() : openLaatje(b.getAttribute('data-soort')))));
    zaal.querySelector('.pk-kaartje .pk-x').addEventListener('click', sluitKaartje);
    zaal.querySelector('.pk-lade .pk-x').addEventListener('click', sluitLa);
    zaal.querySelector('.pk-sluier').addEventListener('click', () => { sluitKaartje(); sluitLa(); });
    zaal.querySelector('.pk-l-doe').addEventListener('click', doeInLa);
    zaal.querySelector('.pk-k-speel').addEventListener('click', () => { sluitKaartje(true); });
    zaal.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (kaartjeVan || openLa) { e.preventDefault(); e.stopPropagation(); sluitKaartje(); sluitLa(); }
    });
    gebouwd = true;
  }

  function teken() {
    if (!gebouwd) return;
    const nieuw = ongezien();
    let aantal = 0;
    zaal.querySelectorAll('.pk-prijs').forEach((b) => {
      const p = prijsOpId[b.getAttribute('data-prijs')], won = gewonnen(p);
      if (won) aantal++;
      b.classList.toggle('gewonnen', won);
      b.classList.toggle('nieuw', won && nieuw.includes(p.id));
      b.setAttribute('aria-label', won ? `${p.naam}, gewonnen met ${p.titel.toLowerCase()}` : `Nog te winnen: ${p.naam}. ${p.titel}: ${p.eis.toLowerCase()}`);
    });
    zaal.querySelector('.pk-teller').textContent = `${aantal} van ${PRIJZEN.length}`;
    zaal.querySelector('.pk-kast').classList.toggle('met-servies', !!(D() && D().klusKlaar && D().klusKlaar('servies')));
    const stippen = nieuweSoorten();
    zaal.querySelectorAll('.pk-la').forEach((b) => {
      const so = SOORTEN.find((x) => x.id === b.getAttribute('data-soort'));
      const v = opId[gekozenId(so.id)];
      b.querySelector('.pk-la-raam').innerHTML = voorbeeld(v);
      b.classList.toggle('met-stip', stippen.includes(so.id));
      b.setAttribute('aria-label', `Laatje ${so.naam.toLowerCase()}: ${v.naam}`);
      b.setAttribute('aria-expanded', String(openLa === so.id));
    });
    zetSaldo();
  }
  function zetSaldo() { if (gebouwd) zaal.querySelector('.pk-saldo-getal').textContent = D() ? D().saldo : 0; }

  // ---------- Een prijs bekijken ----------
  function toonKaartje(id, knop) {
    const p = prijsOpId[id];
    if (!p) return;
    sluitLa();
    const won = gewonnen(p);
    kaartjeVan = id;
    const k = zaal.querySelector('.pk-kaartje');
    k.classList.toggle('gewonnen', won);
    k.querySelector('.pk-k-beeld').innerHTML = prijsSvg(id);
    k.querySelector('.pk-k-naam').textContent = won ? p.naam : 'Nog te winnen';
    const wie = p.gezicht || p.kampioen;
    const gezicht = window.Personen && Personen.gezicht[wie] ? `<span class="pk-k-gezicht">${Personen.gezicht[wie]}</span>` : '';
    k.querySelector('.pk-k-regel').innerHTML = won
      ? `${gezicht}<span>Gewonnen met ${esc(p.titel.toLowerCase())}</span>`
      : `${gezicht}<span><b>${esc(p.eis)}</b><small>${esc(p.titel)}</small></span>`;
    const speel = k.querySelector('.pk-k-speel');
    const kamer = D() ? D().kamerVanSpel(p.spel) : 'voorkamer';
    const open = !D() || D().kamerOpen(kamer);
    speel.hidden = won || !open;
    speel.setAttribute('href', '#' + p.spel);
    speel.querySelector('span').textContent = 'Speel ' + p.titel.toLowerCase();
    toonLaag(k);
    if (won) klank('kling'); else klank('tik');
    if (won && knop && knop.classList.contains('nieuw')) {
      const gezien = lijstVeld('pk-gezien') || [];
      if (!gezien.includes(id)) D().zetVeld('pk-gezien', gezien.concat([id]));
    }
    k.querySelector('.pk-x').focus({ preventScroll: true });
  }
  function sluitKaartje(naarSpel) {
    if (!kaartjeVan) return;
    const was = kaartjeVan;
    kaartjeVan = null;
    verbergLaag(zaal.querySelector('.pk-kaartje'));
    if (naarSpel !== true) { const b = zaal.querySelector(`.pk-prijs[data-prijs="${was}"]`); if (b) b.focus({ preventScroll: true }); }
  }

  // ---------- Een laatje opentrekken ----------
  function openLaatje(soort) {
    sluitKaartje();
    openLa = soort;
    gekozenInLa = gekozenId(soort);
    const so = SOORTEN.find((x) => x.id === soort);
    const la = zaal.querySelector('.pk-lade');
    la.querySelector('.pk-l-naam').textContent = so.naam;
    const stippen = nieuweSoorten();
    if (stippen.includes(soort)) D().zetVeld('pk-nieuw', stippen.filter((x) => x !== soort));
    tekenLa();
    zaal.querySelectorAll('.pk-la').forEach((b) => b.classList.toggle('open', b.getAttribute('data-soort') === soort));
    teken();
    toonLaag(la);
    klank('schuif');
    const eerste = la.querySelector('.pk-vak.gekozen') || la.querySelector('.pk-vak');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function tekenLa() {
    const la = zaal.querySelector('.pk-lade'), vakken = la.querySelector('.pk-l-vakken');
    vakken.innerHTML = '';
    VOORWERPEN.filter((v) => v.soort === openLa).forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      const inGebruik = gekozenId(openLa) === v.id, bezitV = heeft(v.id);
      b.className = 'pk-vak' + (bezitV ? ' bezit' : '') + (inGebruik ? ' in-gebruik' : '') + (gekozenInLa === v.id ? ' gekozen' : '') + (v.prijs === null ? ' cadeau' : '');
      let voetTekst;
      if (inGebruik) voetTekst = icoon('vink');
      else if (bezitV) voetTekst = '';
      else if (v.prijs === null) voetTekst = icoon('schoen');
      else voetTekst = `<svg class="duit" aria-hidden="true"><use href="#i-duit"/></svg>${v.prijs}`;
      b.innerHTML = `${voorbeeld(v)}<span class="pk-vak-naam">${esc(v.naam)}</span><span class="pk-vak-voet">${voetTekst}</span>`;
      b.setAttribute('aria-pressed', String(gekozenInLa === v.id));
      b.setAttribute('aria-label', inGebruik ? `${v.naam}, in gebruik` : bezitV ? `${v.naam}, van jou` : v.prijs === null ? `${v.naam}, alleen als cadeautje` : `${v.naam}, ${v.prijs} duiten`);
      b.addEventListener('click', () => { gekozenInLa = v.id; klank('tik'); tekenLa(); const nu = la.querySelector('.pk-vak.gekozen'); if (nu) nu.focus({ preventScroll: true }); });
      vakken.appendChild(b);
    });
    zetDoeKnop();
  }
  function zetDoeKnop() {
    const knop = zaal.querySelector('.pk-l-doe');
    const v = opId[gekozenInLa];
    knop.className = 'knop pk-l-doe';
    knop.disabled = false;
    if (!v) { knop.hidden = true; return; }
    knop.hidden = false;
    if (gekozenId(openLa) === v.id) { knop.innerHTML = `${icoon('vink')}<span>In gebruik</span>`; knop.disabled = true; knop.classList.add('stil'); }
    else if (heeft(v.id)) knop.innerHTML = `${icoon('hand')}<span>Gebruik ${esc(v.naam.toLowerCase())}</span>`;
    else if (v.prijs === null) { knop.innerHTML = `${icoon('schoen')}<span>Alleen als cadeautje</span>`; knop.disabled = true; knop.classList.add('stil'); }
    else if (!D() || D().saldo < v.prijs) { knop.innerHTML = `<svg class="duit" aria-hidden="true"><use href="#i-duit"/></svg><span>Nog ${v.prijs - (D() ? D().saldo : 0)} duiten nodig</span>`; knop.disabled = true; knop.classList.add('stil'); }
    else { knop.innerHTML = `<svg class="duit" aria-hidden="true"><use href="#i-duit"/></svg><span>Koop voor ${v.prijs}</span>`; knop.classList.add('koop'); }
  }
  function doeInLa() {
    const v = opId[gekozenInLa];
    if (!v || !openLa) return;
    if (heeft(v.id)) {
      if (gekozenId(openLa) !== v.id) { kies(v.id); klank('pak'); if (window.Tril) Tril.klik(); }
    } else if (v.prijs && D() && D().saldo >= v.prijs) {
      D().af(v.prijs);
      geef(v.id, true);
      kies(v.id);
      klank('munt');
      if (window.Tril) Tril.succes();
    } else return;
    tekenLa();
    teken();
    const nu = zaal.querySelector('.pk-vak.gekozen');
    if (nu && !rustig()) { nu.classList.add('net'); setTimeout(() => nu.classList.remove('net'), 900); }
  }
  function sluitLa() {
    if (!openLa) return;
    const was = openLa;
    openLa = null;
    verbergLaag(zaal.querySelector('.pk-lade'));
    zaal.querySelectorAll('.pk-la').forEach((b) => b.classList.remove('open'));
    teken();
    klank('schuif');
    const b = zaal.querySelector(`.pk-la[data-soort="${was}"]`);
    if (b) b.focus({ preventScroll: true });
  }

  function toonLaag(el) {
    const sluier = zaal.querySelector('.pk-sluier');
    sluier.hidden = false;
    el.hidden = false;
    el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
  }
  function verbergLaag(el) {
    el.hidden = true;
    el.classList.remove('in');
    if (!kaartjeVan && !openLa) zaal.querySelector('.pk-sluier').hidden = true;
  }

  // de deurtjes gaan open als je voor de kast staat
  function openDeuren() {
    const kast = zaal.querySelector('.pk-kast');
    kast.classList.remove('open');
    if (rustig()) { kast.classList.add('open'); return; }
    void kast.offsetWidth;
    setTimeout(() => { if (!actief) return; kast.classList.add('open'); klank('kling'); }, 260);
  }

  function start() {
    if (!gebouwd) bouw();
    if (!gebouwd) return;
    actief = true;
    sluitKaartje(true); sluitLa();
    teken();
    openDeuren();
    // wat nieuw is, glinstert even en telt daarna als gezien
    const nieuw = ongezien();
    if (nieuw.length) setTimeout(() => { if (actief && D()) D().zetVeld('pk-gezien', (lijstVeld('pk-gezien') || []).concat(nieuw)); }, 2600);
    const terug = zaal.querySelector('.pk-terug');
    if (terug) terug.focus({ preventScroll: true });
  }
  function stop() {
    actief = false;
    if (!gebouwd) return;
    kaartjeVan = null; openLa = null;
    ['.pk-kaartje', '.pk-lade', '.pk-sluier'].forEach((s) => { zaal.querySelector(s).hidden = true; });
    zaal.querySelectorAll('.pk-la').forEach((b) => b.classList.remove('open'));
  }

  if (window.Duiten) window.Duiten.opWijziging(() => { if (actief) { zetSaldo(); if (openLa) zetDoeKnop(); } });

  window.Pronk = {
    soorten: SOORTEN,
    voorwerpen: VOORWERPEN,
    prijzen: PRIJZEN,
    stijl(s) { return opId[gekozenId(s)].s; },
    gekozenId,
    heeft,
    geef,
    kies,
    voorbeeld,
    gewonnen,
    ongezien,
    meldNieuw,
    tekenPrijs,
    prijsSvg,
    start,
    stop,
    open() { location.hash = '#pronkkast'; },
    sluit() { if (location.hash === '#pronkkast') location.hash = '#'; },
    opWijziging(f) { luisteraars.push(f); },
    get _toestand() { return { gebouwd, actief, openLa, kaartjeVan, gekozenInLa }; }
  };
})();
