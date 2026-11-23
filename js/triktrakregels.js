/* Triktrakregels: het spel met vijftien schijven en twee dobbelstenen, zoals het in de 17e eeuw in Holland
   aan tafel werd gespeeld (o.a. geschilderd door Duyster en Jan Steen), met de regels van het backgammon.

   - Twee spelers, wit (0, jij) en zwart (1). Het bord heeft 24 punten; index 0..23 is punt 1..24 van wit.
     Wit loopt van punt 24 naar punt 1 en neemt daarna uit; zwart loopt de andere kant op.
   - Je zet met elke dobbelsteen één schijf; bij een dubbele worp vier keer. Een punt met twee of meer schijven
     van de ander is dicht. Kom je op één schijf van de ander (een losse), dan sla je hem: die gaat naar de bar
     en moet eerst weer opkomen in jouw thuisbord voor die speler iets anders mag zetten.
   - Je moet zoveel mogelijk ogen gebruiken; kun je er maar één spelen, dan het hoogste als dat kan.
   - Staan al je schijven thuis (punt 1..6), dan neem je uit: met het precieze getal, of met een hoger getal
     als er hoger geen schijven van jou meer staan.
   - Wie het eerst alles heeft uitgenomen, wint: 1 punt, 2 als de ander nog niets uitnam (dubbel),
     3 als de ander dan ook nog op de bar of in jouw thuisbord staat (driedubbel).
   - Hollandse opzet: alle schijven beginnen naast het bord en komen op in het thuisbord van de ander;
     slaan mag pas als je zelf een schijf thuis hebt, en wie de openingsworp wint, gooit opnieuw.

   Ook de tegenspelers wonen hier: een waardering van de stand (punten, priemen, losse schijven die
   geraakt kunnen worden, de bar, de race), en de sterkste kijkt een worp vooruit. In een achtergrondwerker. */
(function (wereld) {
  'use strict';
  const BRON = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || null;

  // ---------- stand ----------
  function beginStand(variant) {
    const bord = new Array(24).fill(0);
    const s = { bord, bar: [0, 0], af: [0, 0], wacht: [0, 0], variant: variant === 'hollands' ? 'hollands' : 'gewoon', aan: 0, worp: null, over: [], gezet: [], klaar: false, winnaar: -1, punten: 0 };
    if (s.variant === 'hollands') { s.wacht = [15, 15]; return s; }
    bord[23] = 2; bord[12] = 5; bord[7] = 3; bord[5] = 5;      // wit: 2 op 24, 5 op 13, 3 op 8, 5 op 6
    bord[0] = -2; bord[11] = -5; bord[16] = -3; bord[18] = -5; // zwart, gespiegeld
    return s;
  }
  const kopie = (s) => ({ bord: s.bord.slice(), bar: s.bar.slice(), af: s.af.slice(), wacht: s.wacht.slice(), variant: s.variant, aan: s.aan, worp: s.worp ? s.worp.slice() : null, over: s.over.slice(), gezet: s.gezet.slice(), klaar: s.klaar, winnaar: s.winnaar, punten: s.punten });
  const sleutel = (s) => s.bord.join(',') + '|' + s.bar[0] + s.bar[1] + '|' + s.af[0] + ',' + s.af[1] + '|' + s.wacht[0] + ',' + s.wacht[1];
  const teken = (p) => (p === 0 ? 1 : -1);
  // het punt (1..24) van een index, gezien vanuit speler p
  const punt = (i, p) => (p === 0 ? i + 1 : 24 - i);
  // de index van punt k (1..24) gezien vanuit speler p
  const idx = (k, p) => (p === 0 ? k - 1 : 24 - k);
  const telStenen = (s, p) => { let n = s.bar[p] + s.af[p] + s.wacht[p]; const t = teken(p); for (let i = 0; i < 24; i++) if (s.bord[i] * t > 0) n += s.bord[i] * t; return n; };

  function alleThuis(s, p) {
    if (s.bar[p] || s.wacht[p]) return false;
    const t = teken(p);
    for (let i = 0; i < 24; i++) if (s.bord[i] * t > 0 && punt(i, p) > 6) return false;
    return true;
  }
  function hogerBezet(s, p, k) {
    const t = teken(p);
    for (let j = k + 1; j <= 6; j++) if (s.bord[idx(j, p)] * t > 0) return true;
    return false;
  }
  // Hollandse opzet: slaan mag pas als je zelf een schijf in je thuisbord hebt (of al uitnam)
  function magSlaan(s, p) {
    if (s.variant !== 'hollands') return true;
    if (s.af[p] > 0) return true;
    const t = teken(p);
    for (let k = 1; k <= 6; k++) if (s.bord[idx(k, p)] * t > 0) return true;
    return false;
  }

  // ---------- losse zetten ----------
  // Alle zetten van één schijf met worp d, zonder de regel 'zoveel mogelijk ogen'. Een zet: { van, naar, d, slaat }
  // met van = index, 'bar' of 'wacht' en naar = index of 'af'.
  function losseZetten(s, p, d) {
    const uit = [], t = teken(p), b = s.bord, slaan = magSlaan(s, p);
    const doel = (j) => { const v = b[j] * t; if (v >= 0) return 0; if (v === -1) return slaan ? 1 : -1; return -1; };
    const instap = p === 0 ? 24 - d : d - 1;
    if (s.bar[p] > 0) {
      const o = doel(instap);
      if (o >= 0) uit.push({ van: 'bar', naar: instap, d, slaat: o === 1 });
      return uit; // wie op de bar staat, moet eerst opkomen
    }
    if (s.wacht[p] > 0) {
      const o = doel(instap);
      if (o >= 0) uit.push({ van: 'wacht', naar: instap, d, slaat: o === 1 });
    }
    const thuis = alleThuis(s, p);
    for (let i = 0; i < 24; i++) {
      if (b[i] * t <= 0) continue;
      const j = p === 0 ? i - d : i + d;
      if (j >= 0 && j <= 23) {
        const o = doel(j);
        if (o >= 0) uit.push({ van: i, naar: j, d, slaat: o === 1 });
      } else if (thuis) {
        const k = punt(i, p);
        if (k === d || (k < d && !hogerBezet(s, p, k))) uit.push({ van: i, naar: 'af', d, slaat: false });
      }
    }
    return uit;
  }
  function zet(s, p, z) {
    const n = { bord: s.bord.slice(), bar: s.bar.slice(), af: s.af.slice(), wacht: s.wacht.slice(), variant: s.variant, aan: s.aan, worp: s.worp, over: s.over, gezet: s.gezet, klaar: s.klaar, winnaar: s.winnaar, punten: s.punten };
    const t = teken(p);
    if (z.van === 'bar') n.bar[p]--; else if (z.van === 'wacht') n.wacht[p]--; else n.bord[z.van] -= t;
    if (z.naar === 'af') n.af[p]++;
    else {
      if (n.bord[z.naar] === -t) { n.bord[z.naar] = 0; n.bar[1 - p]++; }
      n.bord[z.naar] += t;
    }
    return n;
  }
  const zonder = (lijst, r) => lijst.slice(0, r).concat(lijst.slice(r + 1));
  // Hoeveel ogen kun je vanaf hier nog gebruiken?
  function maxGebruik(s, p, rest, memo) {
    if (!rest.length || s.af[p] === 15) return 0;
    const k = sleutel(s) + '#' + rest.join('');
    const m = memo.get(k);
    if (m !== undefined) return m;
    let best = 0;
    const gehad = new Set();
    for (let r = 0; r < rest.length && best < rest.length; r++) {
      const d = rest[r];
      if (gehad.has(d)) continue;
      gehad.add(d);
      const andere = zonder(rest, r);
      for (const z of losseZetten(s, p, d)) {
        const v = 1 + maxGebruik(zet(s, p, z), p, andere, memo);
        if (v > best) best = v;
        if (best === rest.length) break;
      }
    }
    memo.set(k, best);
    return best;
  }
  const worpLijst = (a, b) => (a === b ? [a, a, a, a] : [a, b]);

  // ---------- een beurt ----------
  // Gooi (of zet de worp): de ogen die je deze beurt mag gebruiken
  function rol(s, a, b) {
    const n = kopie(s);
    n.worp = [a, b];
    n.over = worpLijst(a, b);
    n.gezet = [];
    return n;
  }
  // De zetten die je nu met één schijf mag doen (rekening houdend met 'zoveel mogelijk ogen' en 'het hoogste oog')
  function stappen(s, memo) {
    if (s.klaar || !s.worp || !s.over.length) return [];
    memo = memo || new Map();
    const p = s.aan, rest = s.over, max = maxGebruik(s, p, rest, memo);
    if (max === 0) return [];
    let uit = [];
    const gehad = new Set();
    for (let r = 0; r < rest.length; r++) {
      const d = rest[r];
      if (gehad.has(d)) continue;
      gehad.add(d);
      const andere = zonder(rest, r);
      for (const z of losseZetten(s, p, d)) if (1 + maxGebruik(zet(s, p, z), p, andere, memo) === max) uit.push(z);
    }
    // kun je maar één oog spelen, en verschillen de ogen: dan het hoogste als dat kan
    const [a, b] = s.worp;
    if (max === 1 && a !== b && !s.gezet.length) {
      const hoog = Math.max(a, b), metHoog = uit.filter((z) => z.d === hoog);
      if (metHoog.length) uit = metHoog;
    }
    return uit;
  }
  // Doe één zet van de beurt; het gebruikte oog gaat van de lijst
  function doeStap(s, z) {
    const n = zet(s, s.aan, z);
    const r = n.over.indexOf(z.d);
    n.over = zonder(s.over, r);
    n.gezet = s.gezet.concat([z]);
    if (n.af[s.aan] === 15) { n.over = []; eindig(n, s.aan); }
    return n;
  }
  const beurtKlaar = (s) => s.klaar || !s.over.length || !stappen(s).length;
  function wissel(s) {
    const n = kopie(s);
    n.aan = 1 - s.aan; n.worp = null; n.over = []; n.gezet = [];
    return n;
  }
  function eindig(s, p) {
    s.klaar = true; s.winnaar = p;
    const q = 1 - p;
    if (s.af[q] > 0) { s.punten = 1; return; }
    // dubbel; driedubbel als de verliezer nog op de bar, naast het bord of in het thuisbord van de winnaar staat
    let ver = s.bar[q] > 0 || s.wacht[q] > 0;
    const t = teken(q);
    for (let k = 19; k <= 24 && !ver; k++) if (s.bord[idx(k, q)] * t > 0) ver = true;
    s.punten = ver ? 3 : 2;
  }
  const uitslag = (s) => (s.klaar ? { winnaar: s.winnaar, punten: s.punten, soort: s.punten === 3 ? 'driedubbel' : s.punten === 2 ? 'dubbel' : 'gewoon' } : null);

  // Alle eindstanden van een beurt (elke stand één keer, met een rij zetten die er komt)
  function eindStanden(s, p, worp) {
    const t0 = Object.assign(kopie(s), { aan: p });
    const rest = worpLijst(worp[0], worp[1]), memo = new Map();
    const max = maxGebruik(t0, p, rest, memo);
    const uit = new Map(), gezien = new Set();
    const verschil = worp[0] !== worp[1], hoog = Math.max(worp[0], worp[1]);
    const hoogKan = max === 1 && verschil && losseZetten(t0, p, hoog).length > 0;
    (function zoek(t, over, pad, nog) {
      if (nog === 0) {
        const k = sleutel(t);
        if (!uit.has(k)) uit.set(k, { stand: t, zetten: pad });
        return;
      }
      const vk = sleutel(t) + '#' + over.join('');
      if (gezien.has(vk)) return;
      gezien.add(vk);
      const gehad = new Set();
      for (let r = 0; r < over.length; r++) {
        const d = over[r];
        if (gehad.has(d)) continue;
        gehad.add(d);
        if (hoogKan && d !== hoog) continue;
        const andere = zonder(over, r);
        for (const z of losseZetten(t, p, d)) {
          const n = zet(t, p, z);
          if (1 + maxGebruik(n, p, andere, memo) !== nog) continue;
          zoek(n, andere, pad.concat([z]), nog - 1);
        }
      }
    })(t0, rest, [], max);
    return Array.from(uit.values());
  }

  // ---------- tellen en waarderen ----------
  function pips(s, p) {
    const t = teken(p);
    let n = 25 * (s.bar[p] + s.wacht[p]);
    for (let i = 0; i < 24; i++) if (s.bord[i] * t > 0) n += s.bord[i] * t * punt(i, p);
    return n;
  }
  // het bord gezien vanuit p: r[k] > 0 eigen schijven op punt k, < 0 die van de ander
  function relatief(s, p) {
    const r = new Array(26).fill(0);
    for (let i = 0; i < 24; i++) r[punt(i, p)] = p === 0 ? s.bord[i] : -s.bord[i];
    return r;
  }
  // de ander loopt omhoog (van 0, de bar, naar 25); raakt hij een losse schijf van ons, en hoe erg is dat?
  function schoten(r, barAnder, wachtAnder) {
    const losse = [];
    for (let k = 1; k <= 24; k++) if (r[k] === 1) losse.push(k);
    if (!losse.length) return { kans: 0, verlies: 0 };
    const schutters = [];
    if (barAnder > 0 || wachtAnder > 0) schutters.push(0);
    for (let j = 1; j <= 24; j++) if (r[j] < 0) schutters.push(j);
    const dicht = (k) => k >= 1 && k <= 24 && r[k] >= 2;
    let geraakt = 0, verlies = 0;
    for (let a = 1; a <= 6; a++) {
      for (let b = a; b <= 6; b++) {
        const gewicht = a === b ? 1 : 2;
        let ergst = 0;
        for (const j of schutters) {
          for (const k of losse) {
            const af = k - j;
            if (af <= 0) continue;
            let raak = false;
            if (a !== b) raak = af === a || af === b || (af === a + b && (!dicht(j + a) || !dicht(j + b)));
            else if (af % a === 0 && af / a <= 4) { raak = true; for (let m = 1; m < af / a; m++) if (dicht(j + a * m)) { raak = false; break; } }
            if (raak && 25 - k > ergst) ergst = 25 - k;
          }
        }
        if (ergst) { geraakt += gewicht; verlies += gewicht * ergst; }
      }
    }
    return { kans: geraakt / 36, verlies: verlies / 36 };
  }
  const PUNTWAARDE = [0, 0.18, 0.32, 0.48, 0.66, 0.84, 0.86, 0.74, 0.5, 0.3, 0.16, 0.14, 0.1, 0.1, 0.08, 0.08, 0.08, 0.08, 0.1, 0.26, 0.4, 0.34, 0.22, 0.16, 0.12];
  const PRIEM = [0, 0, 0, 0.18, 0.42, 0.75, 1.25, 1.5];
  // de gewichten van de waardering (afgesteld met partijen tegen zichzelf)
  const GEWICHT = { pip: 0.022, punt: 1, priem: 1, bar: 0.32, barThuis: 0.12, losVerlies: 0.028, losKans: 0.32, losThuis: 0.16, stapel: 0.02, race: 0.09, raceVoor: 4, af: 0.06, anker: 1, bouwer: 0.1, klem: 0.05, stapel3: 0.05 };
  // De waarde van een stand voor p (hoger is beter); p heeft net gezet, de ander is aan de beurt.
  function waarde(s, p, G) {
    G = G || GEWICHT;
    if (s.af[p] === 15) return 100 + (s.af[1 - p] === 0 ? 30 : 0);
    if (s.af[1 - p] === 15) return -100 - (s.af[p] === 0 ? 30 : 0);
    const r = relatief(s, p), q = 1 - p;
    const mijnPips = pips(s, p), zijnPips = pips(s, q);
    // contact: staat er nog iets van ons achter iets van de ander?
    let achterste = s.bar[p] || s.wacht[p] ? 25 : 0, zijnAchterste = s.bar[q] || s.wacht[q] ? 0 : 25;
    for (let k = 24; k >= 1; k--) if (r[k] > 0) { achterste = Math.max(achterste, k); break; }
    for (let k = 1; k <= 24; k++) if (r[k] < 0) { zijnAchterste = Math.min(zijnAchterste, k); break; }
    const contact = achterste > zijnAchterste;
    if (!contact) {
      // race: wie het eerst thuis is en uitneemt; de ander is aan de beurt (een halve worp voorsprong)
      let verspild = 0;
      for (let k = 1; k <= 6; k++) if (r[k] > 2) verspild += (r[k] - 2) * 0.012 * (7 - k) / 6;
      return (zijnPips - mijnPips - G.raceVoor) * G.race + (s.af[p] - s.af[q]) * 0.04 - verspild;
    }
    let v = (zijnPips - mijnPips) * G.pip;
    let mijnThuisDicht = 0, zijnThuisDicht = 0, lang = 0, langst = 0;
    for (let k = 1; k <= 24; k++) {
      if (r[k] >= 2) {
        v += PUNTWAARDE[k] * (k >= 19 ? G.anker : G.punt);
        if (r[k] > 4) v -= (r[k] - 4) * G.stapel;
        if (k <= 6) mijnThuisDicht++;
        lang++; if (lang > langst) langst = lang;
      } else lang = 0;
      if (r[k] <= -2 && k >= 19) zijnThuisDicht++;
    }
    v += PRIEM[Math.min(7, langst)] * G.priem;
    // bouwstenen: schijven op punt 4..11 waarmee je straks thuis punten maakt
    if (G.bouwer) { let b = 0; for (let k = 4; k <= 11; k++) if (r[k] > 0) b++; v += b * G.bouwer; }
    // achterste schijven die klem zitten achter punten van de ander
    if (G.klem) {
      for (let k = 19; k <= 24; k++) {
        if (r[k] <= 0) continue;
        let dicht = 0;
        for (let j = k - 1; j >= Math.max(1, k - 6); j--) if (r[j] <= -2) dicht++;
        v -= r[k] * dicht * G.klem;
      }
    }
    // hoge stapels zijn weinig waard
    if (G.stapel3) for (let k = 1; k <= 24; k++) if (r[k] > 3) v -= (r[k] - 3) * G.stapel3;
    // de ander moet nog opkomen tegen ons dichte thuisbord
    v += (s.bar[q] + s.wacht[q] * 0.15) * (G.bar + mijnThuisDicht * G.barThuis);
    v -= (s.bar[p] + s.wacht[p] * 0.15) * (G.bar + zijnThuisDicht * G.barThuis);
    // losse schijven die geraakt kunnen worden: hoe verder ze zijn, hoe meer het kost
    const sch = schoten(r, s.bar[q], s.wacht[q]);
    v -= (sch.verlies * G.losVerlies + sch.kans * G.losKans) * (1 + zijnThuisDicht * G.losThuis);
    // al uitgenomen schijven
    v += (s.af[p] - s.af[q]) * G.af;
    return v;
  }

  // ---------- de tegenspelers ----------
  function willekeur(zaad) {
    let x = (zaad >>> 0) || 0x2545F491;
    return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  const WORPEN = [];
  for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) WORPEN.push([a, b, a === b ? 1 / 36 : 2 / 36]);

  // Kies de zetten voor s.aan met s.worp. opties: { ruis, vooruit (0/1), tijd, kandidaten }
  function kiesZet(s, opties) {
    opties = opties || {};
    const p = s.aan, ruis = opties.ruis || 0, rnd = willekeur(opties.zaad || (Date.now() ^ 0x9E3779B9));
    const eind = eindStanden(s, p, s.worp);
    if (!eind.length) return [];
    if (eind.length === 1) return eind[0].zetten;
    const G = opties.gewichten || GEWICHT;
    for (const e of eind) e.v = waarde(e.stand, p, G) + (ruis ? (rnd() - 0.5) * 2 * ruis : 0);
    eind.sort((a, b) => b.v - a.v);
    if (!opties.vooruit) return eind[0].zetten;
    // een worp vooruit kijken: gemiddeld over alle worpen van de ander, die zelf zijn beste zet kiest
    const start = Date.now(), tijd = opties.tijd || 900, n = Math.min(eind.length, opties.kandidaten || 6);
    let best = eind[0], bestV = -Infinity;
    for (let i = 0; i < n; i++) {
      const e = eind[i];
      if (e.stand.klaar) return e.zetten;
      let som = 0;
      for (const [a, b, kans] of WORPEN) {
        // de ander kiest zijn beste zet; daarna zijn wij aan de beurt, dus tellen we die stand vanuit hem (en keren om)
        const zijn = eindStanden(e.stand, 1 - p, [a, b]);
        let v = waarde(e.stand, p, G);
        if (zijn.length) {
          let beste = -Infinity;
          for (const z of zijn) { const w = waarde(z.stand, 1 - p, G); if (w > beste) beste = w; }
          v = -beste;
        }
        som += kans * v;
      }
      if (som > bestV) { bestV = som; best = e; }
      if (Date.now() - start > tijd) break;
    }
    return best.zetten;
  }
  // de openingsworp: twee verschillende ogen; de hoogste begint
  function opening(rnd) {
    rnd = rnd || Math.random;
    let a, b;
    do { a = 1 + Math.floor(rnd() * 6); b = 1 + Math.floor(rnd() * 6); } while (a === b);
    return [a, b];
  }
  const gooi = (rnd) => { rnd = rnd || Math.random; return [1 + Math.floor(rnd() * 6), 1 + Math.floor(rnd() * 6)]; };

  // ---------- denken in een achtergrondwerker als dat kan ----------
  let werker = null, werkerStuk = false, volgnummer = 0;
  const wachtend = new Map();
  function werkerOpgeven() {
    werkerStuk = true;
    if (werker) { try { werker.terminate(); } catch (e) { /* al weg */ } }
    werker = null;
    for (const [id, w] of wachtend) { clearTimeout(w.wacht); wachtend.delete(id); w.klaar(kiesZet(w.s, w.opties)); }
  }
  function denk(s, opties) {
    opties = Object.assign({}, opties || {});
    return new Promise((klaar) => {
      if (!werker && !werkerStuk && BRON && typeof Worker !== 'undefined') {
        try {
          werker = new Worker(BRON);
          werker.onmessage = (e) => {
            const w = wachtend.get(e.data.id);
            if (!w) return;
            clearTimeout(w.wacht); wachtend.delete(e.data.id);
            w.klaar(e.data.uit || kiesZet(w.s, w.opties));
          };
          werker.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); werkerOpgeven(); };
        } catch (e) { werker = null; werkerStuk = true; }
      }
      if (!werker) { setTimeout(() => klaar(kiesZet(s, opties)), 20); return; }
      const id = ++volgnummer;
      const w = { klaar, s, opties };
      w.wacht = setTimeout(() => { if (wachtend.has(id)) werkerOpgeven(); }, (opties.tijd || 900) + 3000);
      wachtend.set(id, w);
      werker.postMessage({ id, s, opties });
    });
  }
  const inWerker = typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function';
  if (inWerker) {
    self.onmessage = (e) => {
      let uit = null;
      try { uit = kiesZet(e.data.s, e.data.opties); } catch (fout) { uit = null; }
      self.postMessage({ id: e.data.id, uit });
    };
  }
  const werkerStatus = () => (werker ? 'werker' : werkerStuk ? 'stuk' : 'geen');

  const Triktrakregels = {
    beginStand, kopie, sleutel, punt, idx, telStenen, alleThuis, magSlaan, losseZetten, zet, maxGebruik, worpLijst,
    rol, stappen, doeStap, beurtKlaar, wissel, uitslag, eindStanden, pips, relatief, schoten, waarde, GEWICHT,
    kiesZet, opening, gooi, willekeur, denk, werkerStatus
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Triktrakregels;
  else wereld.Triktrakregels = Triktrakregels;
})(typeof window !== 'undefined' ? window : globalThis);
