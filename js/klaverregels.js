/* Klaverjasregels: het Hollandse klaverjassen met 32 kaarten, met de regels van de Nederlandse klaverjasbonden,
   en drie denkende tafelgenoten.

   - Vier spelers, twee tegen twee; maats zitten tegenover elkaar. Er wordt met de klok mee gedeeld en gespeeld.
   - Verplicht spelen: wie links van de gever zit (voorhand), kiest troef en komt uit. Zijn kant is de spelende partij.
   - Rangorde in troef: boer, negen, aas, tien, heer, vrouw, acht, zeven (20, 14, 11, 10, 4, 3, 0, 0 punten).
     In de andere kleuren: aas, tien, heer, vrouw, boer, negen, acht, zeven (11, 10, 4, 3, 2, 0, 0, 0).
     Samen 152 punten, plus 10 voor de laatste slag: 162.
   - Bekennen is verplicht. Kun je niet bekennen, dan moet je troeven; ligt er al troef, dan overtroeven als dat kan.
     Ondertroeven mag alleen als je niets anders hebt. Wordt er troef gevraagd, dan moet je overtroeven als je kunt.
     Amsterdams: heeft je maat de slag, dan hoef je niet te troeven (ondertroeven mag nog steeds alleen als het moet).
   - Roem in één slag: drie op een rij 20, vier op een rij 50 (volgorde 7 8 9 10 boer vrouw heer aas), heer en
     vrouw van troef (stuk) 20, vier gelijke kaarten 100. De roem is voor wie de slag haalt.
   - De spelende partij moet meer dan de helft halen (punten plus roem), anders is ze nat: dan gaan alle punten en
     alle roem naar de tegenpartij. Haalt de spelende partij alle slagen, dan is dat pit: 100 roem extra. */
(function (wereld) {
  'use strict';
  const BRON = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || null;

  // ---------- de kaarten ----------
  // kaart k = kleur * 8 + rang; rang in de gewone volgorde 7 8 9 10 B V H A (zo tellen ook de rijtjes voor roem)
  const KLEUREN = ['klaveren', 'ruiten', 'harten', 'schoppen'];
  const TEKENS = ['♣', '♦', '♥', '♠'];
  const RANGEN = ['7', '8', '9', '10', 'B', 'V', 'H', 'A'];
  const RANGNAAM = ['zeven', 'acht', 'negen', 'tien', 'boer', 'vrouw', 'heer', 'aas'];
  const kleurVan = (k) => k >> 3;
  const rangVan = (k) => k & 7;
  const bit = (k) => (1 << k) >>> 0;
  const KLEURMASKER = [0xFF, 0xFF00, 0xFF0000, 0xFF000000].map((m) => m >>> 0);
  // sterkte om een slag te winnen, en punten
  const STERK_GEWOON = [0, 1, 2, 6, 3, 4, 5, 7];
  const STERK_TROEF = [0, 1, 6, 4, 7, 2, 3, 5];
  const PUNT_GEWOON = [0, 0, 0, 10, 2, 3, 4, 11];
  const PUNT_TROEF = [0, 0, 14, 10, 20, 3, 4, 11];
  const sterkte = (k, troef) => (kleurVan(k) === troef ? 8 + STERK_TROEF[rangVan(k)] : STERK_GEWOON[rangVan(k)]);
  const puntenVan = (k, troef) => (kleurVan(k) === troef ? PUNT_TROEF[rangVan(k)] : PUNT_GEWOON[rangVan(k)]);
  const kaartNaam = (k) => `${KLEUREN[kleurVan(k)]} ${RANGNAAM[rangVan(k)]}`;
  const kort = (k) => RANGEN[rangVan(k)] + TEKENS[kleurVan(k)];

  function aantal(m) { m = m >>> 0; let n = 0; while (m) { m &= m - 1; n++; } return n; }
  // laagste bit (index), voor lusjes over een masker
  function laagste(m) { return 31 - Math.clz32(m & -m); }
  function kaartenIn(m) { const uit = []; m = m >>> 0; while (m) { const k = laagste(m); uit.push(k); m = (m & (m - 1)) >>> 0; } return uit; }

  // ---------- schudden en delen ----------
  function schud(willekeur) {
    const r = willekeur || Math.random;
    const a = Array.from({ length: 32 }, (_, i) => i);
    for (let i = 31; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // delen in pakjes van 3, 2 en 3, met de klok mee, te beginnen links van de gever
  function deel(stapel, gever) {
    const handen = [0, 0, 0, 0], volgorde = [];
    let i = 0;
    for (const pak of [3, 2, 3]) {
      for (let z = 1; z <= 4; z++) {
        const zit = (gever + z) % 4;
        for (let n = 0; n < pak; n++) { const k = stapel[i++]; handen[zit] = (handen[zit] | bit(k)) >>> 0; volgorde.push([zit, k]); }
      }
    }
    return { handen, volgorde };
  }

  // ---------- de slag ----------
  // slag: lijst van kaarten in de volgorde waarin ze gespeeld zijn
  function winnaarIndex(slag, troef) {
    let beste = 0;
    const gevraagd = kleurVan(slag[0]);
    for (let i = 1; i < slag.length; i++) {
      const k = slag[i], b = slag[beste];
      const kt = kleurVan(k) === troef, bt = kleurVan(b) === troef;
      if (kt && !bt) beste = i;
      else if (kt === bt && kleurVan(k) === kleurVan(b) && (kt || kleurVan(k) === gevraagd) && sterkte(k, troef) > sterkte(b, troef)) beste = i;
    }
    return beste;
  }
  function slagPunten(slag, troef) { let p = 0; for (const k of slag) p += puntenVan(k, troef); return p; }

  // roem in een volle slag: rijtjes in één kleur, stuk, vier gelijke
  function roemVan(slag, troef) {
    let punten = 0;
    const soorten = [];
    // vier gelijke kaarten
    if (slag.length === 4 && slag.every((k) => rangVan(k) === rangVan(slag[0]))) {
      return { punten: 100, soorten: ['vier'] };
    }
    // rijtjes: per kleur de rangen
    const perKleur = [0, 0, 0, 0];
    for (const k of slag) perKleur[kleurVan(k)] |= 1 << rangVan(k);
    for (let s = 0; s < 4; s++) {
      const m = perKleur[s];
      let langste = 0, n = 0;
      for (let r = 0; r < 8; r++) { if (m & (1 << r)) { n++; if (n > langste) langste = n; } else n = 0; }
      if (langste >= 4) { punten += 50; soorten.push('vierkaart'); } else if (langste === 3) { punten += 20; soorten.push('driekaart'); }
    }
    // stuk: heer en vrouw van troef in dezelfde slag
    if ((perKleur[troef] & (1 << 5)) && (perKleur[troef] & (1 << 6))) { punten += 20; soorten.push('stuk'); }
    return { punten, soorten };
  }

  // ---------- wat mag je bijspelen? ----------
  // hand: masker; slag: kaarten op tafel; zitten: wie ze speelde; zit: wie nu speelt
  function legaal(hand, slag, zitten, zit, troef, variant) {
    hand = hand >>> 0;
    if (!slag.length) return hand;
    const gevraagd = kleurVan(slag[0]);
    const troefMasker = KLEURMASKER[troef];
    let hoogste = -1;
    for (const k of slag) if (kleurVan(k) === troef) hoogste = Math.max(hoogste, STERK_TROEF[rangVan(k)]);
    const hogereTroeven = () => {
      let m = 0;
      for (const k of kaartenIn(hand & troefMasker)) if (STERK_TROEF[rangVan(k)] > hoogste) m |= bit(k);
      return m >>> 0;
    };
    const inKleur = (hand & KLEURMASKER[gevraagd]) >>> 0;
    if (gevraagd === troef) {
      if (!inKleur) return hand;
      const hoger = hogereTroeven();
      return hoger || inKleur;
    }
    if (inKleur) return inKleur;
    const troeven = (hand & troefMasker) >>> 0;
    if (!troeven) return hand;
    const anders = (hand & ~troefMasker) >>> 0;
    const hoger = hoogste < 0 ? troeven : hogereTroeven();
    // Amsterdams: zit je maat goed, dan hoef je niet te troeven
    if (variant === 'amsterdams') {
      const w = zitten[winnaarIndex(slag, troef)];
      if ((w & 1) === (zit & 1)) return (anders | hoger) >>> 0 || troeven;
    }
    if (hoger) return hoger;
    return anders || troeven;
  }
  // waarom mag een kaart niet? (voor de uitleg aan de speler)
  function waaromNiet(hand, slag, zitten, zit, troef, variant, k) {
    const mag = legaal(hand, slag, zitten, zit, troef, variant);
    if (mag & bit(k)) return null;
    const gevraagd = kleurVan(slag[0]);
    if (hand & KLEURMASKER[gevraagd]) return kleurVan(k) !== gevraagd ? 'bekennen' : 'overtroeven';
    if (kleurVan(k) === troef) return (mag & KLEURMASKER[troef]) ? 'overtroeven' : 'ondertroeven';
    return slag.some((x) => kleurVan(x) === troef) ? 'overtroeven' : 'troeven';
  }

  // ---------- een spel (één keer delen) ----------
  function nieuwSpel(o) {
    const gever = o.gever || 0;
    const { handen, volgorde } = deel(o.stapel || schud(o.willekeur), gever);
    const voorhand = (gever + 1) % 4;
    return {
      handen, delen: volgorde, gever, voorhand, troef: o.troef === undefined ? -1 : o.troef, variant: o.variant || 'rotterdams',
      spelend: voorhand & 1, aan: voorhand, slag: [], zitten: [], slagen: [], punten: [0, 0], roem: [0, 0], aantalSlagen: [0, 0],
      gespeeld: 0, klaar: false, uitslag: null
    };
  }
  function kopie(s) {
    return Object.assign({}, s, { handen: s.handen.slice(), slag: s.slag.slice(), zitten: s.zitten.slice(), slagen: s.slagen.slice(), punten: s.punten.slice(), roem: s.roem.slice(), aantalSlagen: s.aantalSlagen.slice() });
  }
  const magNu = (s) => legaal(s.handen[s.aan], s.slag, s.zitten, s.aan, s.troef, s.variant);
  // speel kaart k voor wie aan de beurt is; geeft een nieuwe stand terug
  function speel(s0, k) {
    const s = kopie(s0);
    const zit = s.aan;
    if (!(magNu(s0) & bit(k))) throw new Error('kaart mag niet: ' + kort(k));
    s.handen[zit] = (s.handen[zit] & ~bit(k)) >>> 0;
    s.slag.push(k); s.zitten.push(zit);
    s.gespeeld = (s.gespeeld | bit(k)) >>> 0;
    if (s.slag.length < 4) { s.aan = (zit + 1) % 4; return s; }
    const wi = winnaarIndex(s.slag, s.troef), winnaar = s.zitten[wi], team = winnaar & 1;
    const laatste = s.slagen.length === 7;
    const p = slagPunten(s.slag, s.troef) + (laatste ? 10 : 0);
    const r = roemVan(s.slag, s.troef);
    s.punten[team] += p; s.roem[team] += r.punten; s.aantalSlagen[team]++;
    s.slagen.push({ kaarten: s.slag, zitten: s.zitten, winnaar, punten: p, roem: r.punten, soorten: r.soorten });
    s.slag = []; s.zitten = []; s.aan = winnaar;
    if (laatste) { s.klaar = true; s.uitslag = afrekenen(s); }
    return s;
  }
  // nat of pit, en wat elke kant opschrijft
  function afrekenen(s) {
    const sp = s.spelend, tp = 1 - sp;
    const roem = s.roem.slice();
    const pit = s.aantalSlagen[sp] === 8;
    if (pit) roem[sp] += 100;
    const spel = s.punten[sp] + roem[sp], tegen = s.punten[tp] + roem[tp];
    const nat = spel <= tegen;
    const score = [0, 0], punten = [0, 0], roemUit = [0, 0];
    if (nat) {
      punten[tp] = 162; roemUit[tp] = roem[0] + roem[1];
    } else {
      punten[sp] = s.punten[sp]; punten[tp] = s.punten[tp]; roemUit[sp] = roem[sp]; roemUit[tp] = roem[tp];
    }
    score[0] = punten[0] + roemUit[0]; score[1] = punten[1] + roemUit[1];
    return { nat, pit, spelend: sp, punten, roem: roemUit, score };
  }

  // ============================================================
  // DE DENKENDE TAFELGENOTEN
  // ============================================================
  // troef kiezen: zo sterk mogelijk in troef, met azen ernaast
  function troefWaarde(hand, s) {
    const m = (hand & KLEURMASKER[s]) >>> 0;
    const r = (x) => !!(m & bit(s * 8 + x));
    let w = aantal(m) * 9;
    if (r(4)) w += 26; if (r(2)) w += r(4) ? 18 : 10; if (r(7)) w += 9; if (r(3)) w += 6; if (r(6) && r(5)) w += 8;
    for (let t = 0; t < 4; t++) {
      if (t === s) continue;
      const a = !!(hand & bit(t * 8 + 7)), tien = !!(hand & bit(t * 8 + 3)), n = aantal(hand & KLEURMASKER[t]);
      if (a) w += 10; if (tien && (a || n >= 3)) w += 5; if (!n) w += 6;
    }
    return w;
  }
  function kiesTroef(hand, ruis) {
    let beste = 0, bw = -Infinity;
    for (let s = 0; s < 4; s++) {
      const w = troefWaarde(hand, s) + (ruis ? (Math.random() * 2 - 1) * ruis : 0);
      if (w > bw) { bw = w; beste = s; }
    }
    return beste;
  }

  // ---------- wat weten we over de handen van de anderen? ----------
  // Uit de gespeelde slagen: wie welke kleur niet meer heeft, en hoe hoog iemands troeven hooguit nog zijn.
  function kennis(s) {
    const geen = [0, 0, 0, 0];            // per zit: masker van kleuren (bit per kleur) die op zijn
    const troefTot = [9, 9, 9, 9];         // per zit: troeven met sterkte >= dit zijn er niet (9 = geen grens)
    const alle = s.slagen.map((x) => ({ kaarten: x.kaarten, zitten: x.zitten })).concat(s.slag.length ? [{ kaarten: s.slag, zitten: s.zitten }] : []);
    for (const sl of alle) {
      const gevraagd = kleurVan(sl.kaarten[0]);
      for (let i = 1; i < sl.kaarten.length; i++) {
        const k = sl.kaarten[i], z = sl.zitten[i];
        const voor = sl.kaarten.slice(0, i), zv = sl.zitten.slice(0, i);
        let hoogste = -1;
        for (const v of voor) if (kleurVan(v) === s.troef) hoogste = Math.max(hoogste, STERK_TROEF[rangVan(v)]);
        if (kleurVan(k) !== gevraagd) {
          geen[z] |= 1 << gevraagd;
          if (gevraagd !== s.troef) {
            // niet getroefd terwijl het moest: geen troef (of bij Amsterdams met maat aan slag: niets te zeggen)
            const maatZit = s.variant === 'amsterdams' && ((zv[winnaarIndex(voor, s.troef)] & 1) === (z & 1));
            if (kleurVan(k) !== s.troef && !maatZit) {
              if (hoogste < 0) geen[z] |= 1 << s.troef;
              else troefTot[z] = Math.min(troefTot[z], hoogste + 1);
            }
            if (kleurVan(k) === s.troef && hoogste >= 0 && STERK_TROEF[rangVan(k)] < hoogste) {
              // ondergetroefd: dan had hij niets anders, en geen hogere troef
              troefTot[z] = Math.min(troefTot[z], hoogste + 1);
              for (let t = 0; t < 4; t++) if (t !== s.troef) geen[z] |= 1 << t;
            }
          }
        } else if (gevraagd === s.troef && hoogste >= 0 && STERK_TROEF[rangVan(k)] < hoogste) {
          // troef gevraagd en niet overgetroefd: geen hogere troef
          troefTot[z] = Math.min(troefTot[z], hoogste + 1);
        }
      }
    }
    return { geen, troefTot };
  }

  // verdeel de onbekende kaarten over de anderen, passend bij wat we weten
  function steekproef(s, ik, ken, rnd) {
    const r = rnd || Math.random;
    const handen = s.handen.slice();
    let onbekend = 0;
    const nodig = [0, 0, 0, 0];
    for (let z = 0; z < 4; z++) if (z !== ik) { onbekend |= handen[z]; nodig[z] = aantal(handen[z]); handen[z] = 0; }
    onbekend >>>= 0;
    const kaarten = kaartenIn(onbekend);
    const magHebben = (z, k) => !((ken.geen[z] >> kleurVan(k)) & 1) && !(kleurVan(k) === s.troef && STERK_TROEF[rangVan(k)] >= ken.troefTot[z]);
    for (let poging = 0; poging < 40; poging++) {
      // de kaarten met de minste plekken eerst
      const lijst = kaarten.map((k) => ({ k, z: [0, 1, 2, 3].filter((z) => z !== ik && magHebben(z, k)) }));
      lijst.sort((a, b) => a.z.length - b.z.length || r() - 0.5);
      const over = nodig.slice(), h = [0, 0, 0, 0];
      let gelukt = true;
      for (const { k, z } of lijst) {
        const kan = z.filter((x) => over[x] > 0);
        if (!kan.length) { gelukt = false; break; }
        // kies met kans naar wat er nog in moet
        let tot = 0; for (const x of kan) tot += over[x];
        let t = r() * tot, kies = kan[0];
        for (const x of kan) { t -= over[x]; if (t <= 0) { kies = x; break; } }
        h[kies] = (h[kies] | bit(k)) >>> 0; over[kies]--;
      }
      if (gelukt) { for (let z = 0; z < 4; z++) if (z !== ik) handen[z] = h[z]; return handen; }
    }
    // het lukt niet netjes: verdeel zonder beperkingen
    const schuif = kaarten.slice().sort(() => r() - 0.5);
    let i = 0;
    for (let z = 0; z < 4; z++) if (z !== ik) { for (let n = 0; n < nodig[z]; n++) handen[z] = (handen[z] | bit(schuif[i++])) >>> 0; }
    return handen;
  }

  // ---------- dubbel-dummy: alle kaarten open, beste spel van beide kanten ----------
  // Waarde = (punten + roem van de spelende partij) min (die van de tegenpartij) vanaf nu, plus 100 bij pit.
  let H = [0, 0, 0, 0], T = 0, V = 'rotterdams', SP = 0;
  let KNOPEN = 0, DEADLINE = 0, GESTOPT = false;
  const TT = new Map();
  // volgorde-waarde per kaart (hoog en veel punten eerst), per troefkleur vooraf uitgerekend
  const ORDE = [0, 1, 2, 3].map((t) => Int16Array.from({ length: 32 }, (_, k) => sterkte(k, t) * 3 + puntenVan(k, t)));
  function ddZoek(aan, slag, zitten, nummer, verloren, alpha, beta) {
    if ((++KNOPEN & 4095) === 0 && Date.now() > DEADLINE) GESTOPT = true;
    if (GESTOPT) return 0;
    const begin = slag.length === 0;
    let sleutel = 0, eerst = -1;
    if (begin) {
      if (nummer === 8) return 0;
      sleutel = ((H[0] | H[1] | H[2] | H[3]) >>> 0) * 16 + aan * 2 + (verloren ? 1 : 0);
      const e = TT.get(sleutel);
      if (e) {
        if (e.f === 0) return e.v;
        if (e.f === 1 && e.v >= beta) return e.v;
        if (e.f === 2 && e.v <= alpha) return e.v;
        eerst = e.b;
      }
    }
    const maxi = (aan & 1) === SP;
    const lijst = kaartenIn(legaal(H[aan], slag, zitten, aan, T, V));
    if (lijst.length > 1) {
      const orde = ORDE[T];
      lijst.sort((a, b) => (b === eerst) - (a === eerst) || orde[b] - orde[a]);
    }
    const a0 = alpha, b0 = beta;
    let beste = maxi ? -Infinity : Infinity, besteKaart = -1;
    for (let i = 0; i < lijst.length; i++) {
      const k = lijst[i];
      H[aan] = (H[aan] & ~bit(k)) >>> 0;
      slag.push(k); zitten.push(aan);
      let v;
      if (slag.length === 4) {
        const wi = winnaarIndex(slag, T), w = zitten[wi], team = w & 1;
        const laatste = nummer === 7;
        let p = slagPunten(slag, T) + (laatste ? 10 : 0) + roemVan(slag, T).punten;
        const kant = team === SP ? 1 : -1;
        const nuVerloren = verloren || team !== SP;
        if (laatste && !nuVerloren) p += 100;
        const k0 = slag[0], k1 = slag[1], k2 = slag[2], k3 = slag[3], z0 = zitten[0], z1 = zitten[1], z2 = zitten[2], z3 = zitten[3];
        slag.length = 0; zitten.length = 0;
        v = kant * p + ddZoek(w, slag, zitten, nummer + 1, nuVerloren, alpha - kant * p, beta - kant * p);
        slag.push(k0, k1, k2, k3); zitten.push(z0, z1, z2, z3);
      } else {
        v = ddZoek((aan + 1) % 4, slag, zitten, nummer, verloren, alpha, beta);
      }
      slag.pop(); zitten.pop();
      H[aan] = (H[aan] | bit(k)) >>> 0;
      if (GESTOPT) return 0;
      if (maxi) { if (v > beste) { beste = v; besteKaart = k; } if (beste > alpha) alpha = beste; }
      else { if (v < beste) { beste = v; besteKaart = k; } if (beste < beta) beta = beste; }
      if (alpha >= beta) break;
    }
    if (begin) {
      TT.set(sleutel, { v: beste, f: beste <= a0 ? 2 : beste >= b0 ? 1 : 0, b: besteKaart });
      if (TT.size > 400000) TT.clear();
    }
    return beste;
  }
  // waarde van elke toegestane kaart in een stand met open kaarten
  function ddWaarden(s, handen, kaarten, tot) {
    H = handen.slice(); T = s.troef; V = s.variant; SP = s.spelend;
    if (tot !== undefined) DEADLINE = tot; else if (DEADLINE < Date.now()) DEADLINE = Infinity;
    GESTOPT = false;
    TT.clear();
    const uit = new Map();
    const verloren = s.aantalSlagen[1 - s.spelend] > 0;
    for (const k of kaarten) {
      const slag = s.slag.slice(), zitten = s.zitten.slice(), aan = s.aan;
      H[aan] = (H[aan] & ~bit(k)) >>> 0;
      slag.push(k); zitten.push(aan);
      let v;
      if (slag.length === 4) {
        const wi = winnaarIndex(slag, T), w = zitten[wi], team = w & 1;
        const laatste = s.slagen.length === 7;
        let p = slagPunten(slag, T) + (laatste ? 10 : 0) + roemVan(slag, T).punten;
        const kant = team === SP ? 1 : -1;
        const nuVerloren = verloren || team !== SP;
        if (laatste && !nuVerloren) p += 100;
        v = kant * p + ddZoek(w, [], [], s.slagen.length + 1, nuVerloren, -Infinity, Infinity);
      } else {
        v = ddZoek((aan + 1) % 4, slag, zitten, s.slagen.length, verloren, -Infinity, Infinity);
      }
      H[aan] = (H[aan] | bit(k)) >>> 0;
      if (GESTOPT) return null;
      uit.set(k, v);
    }
    return uit;
  }

  // ---------- eenvoudig maar verstandig spel (voor de makkelijke tafelgenoten, en als terugval) ----------
  function slimVlug(s, ruis) {
    const zit = s.aan, mag = kaartenIn(magNu(s)), tr = s.troef, mijnTeam = zit & 1;
    if (mag.length === 1) return mag[0];
    if (ruis && Math.random() < ruis) return mag[Math.floor(Math.random() * mag.length)];
    const nogBuiten = (k) => !(s.gespeeld & bit(k)) && !(s.handen[zit] & bit(k));
    const hoogsteVanKleur = (k) => {
      // is k de hoogste kaart die nog in het spel is van zijn kleur?
      const kl = kleurVan(k);
      for (let r = 0; r < 8; r++) { const x = kl * 8 + r; if (x !== k && nogBuiten(x) && sterkte(x, tr) > sterkte(k, tr)) return false; }
      return true;
    };
    if (!s.slag.length) {
      // uitkomen
      const troeven = mag.filter((k) => kleurVan(k) === tr);
      if (mijnTeam === s.spelend && troeven.length && troeven.some((k) => hoogsteVanKleur(k))) {
        return troeven.filter(hoogsteVanKleur).sort((a, b) => sterkte(b, tr) - sterkte(a, tr))[0];
      }
      const azen = mag.filter((k) => kleurVan(k) !== tr && hoogsteVanKleur(k));
      if (azen.length) return azen.sort((a, b) => puntenVan(b, tr) - puntenVan(a, tr))[0];
      const laag = mag.filter((k) => kleurVan(k) !== tr).sort((a, b) => puntenVan(a, tr) - puntenVan(b, tr) || sterkte(a, tr) - sterkte(b, tr));
      return laag.length ? laag[0] : mag.sort((a, b) => sterkte(a, tr) - sterkte(b, tr))[0];
    }
    const wi = winnaarIndex(s.slag, tr), wz = s.zitten[wi], maatWint = (wz & 1) === mijnTeam;
    const laatsteSpeler = s.slag.length === 3;
    const wint = mag.filter((k) => winnaarIndex(s.slag.concat([k]), tr) === s.slag.length);
    if (maatWint) {
      // maat heeft de slag: is hij veilig, dan punten erbij (pitten), anders laag
      const veilig = laatsteSpeler || hoogsteVanKleur(s.slag[wi]) || (kleurVan(s.slag[wi]) === tr && kleurVan(s.slag[0]) !== tr);
      const opPunten = mag.slice().sort((a, b) => (puntenVan(b, tr) - puntenVan(a, tr)) || (sterkte(a, tr) - sterkte(b, tr)));
      if (veilig) return opPunten.filter((k) => kleurVan(k) !== tr || mag.every((x) => kleurVan(x) === tr))[0] || opPunten[0];
      return opPunten[opPunten.length - 1];
    }
    if (wint.length) {
      // de goedkoopste kaart die wint; als laatste speler: de winnende met de meeste punten
      if (laatsteSpeler) return wint.sort((a, b) => puntenVan(b, tr) - puntenVan(a, tr) || sterkte(a, tr) - sterkte(b, tr))[0];
      return wint.sort((a, b) => sterkte(a, tr) - sterkte(b, tr))[0];
    }
    return mag.sort((a, b) => puntenVan(a, tr) - puntenVan(b, tr) || sterkte(a, tr) - sterkte(b, tr))[0];
  }

  // ---------- Monte Carlo met open kaarten ----------
  // Bij elke steekproef van de onbekende kaarten rekenen we elke kaart door; de uitslag van het spel
  // (met nat en pit) bepaalt welke kaart gemiddeld het beste is.
  function kiesKaart(s, opties) {
    const o = Object.assign({ tijd: 600, ruis: 0, steekproeven: 40, vanafSlag: 2 }, opties || {});
    const mag = kaartenIn(magNu(s));
    if (mag.length === 1) return { kaart: mag[0], hoe: 'enige' };
    if (s.slagen.length < o.vanafSlag || o.steekproeven <= 0) return { kaart: slimVlug(s, o.ruis), hoe: 'vlug' };
    const ken = kennis(s);
    const zit = s.aan, team = zit & 1, sp = s.spelend;
    const begin = Date.now();
    DEADLINE = begin + o.tijd; GESTOPT = false; KNOPEN = 0;
    const som = new Map(mag.map((k) => [k, 0]));
    let n = 0;
    // al behaalde verschillen (spelende partij min tegenpartij)
    const nuVerschil = (s.punten[sp] + s.roem[sp]) - (s.punten[1 - sp] + s.roem[1 - sp]);
    const roemTot = s.roem[0] + s.roem[1];
    while (n < o.steekproeven && Date.now() < DEADLINE) {
      const handen = steekproef(s, zit, ken);
      const w = ddWaarden(s, handen, mag, DEADLINE);
      if (!w) break;
      for (const [k, v] of w) {
        const verschil = nuVerschil + v;
        // uitslag voor de spelende partij: gewonnen verschil, of nat
        const voorSpelend = verschil > 0 ? verschil : -(162 + roemTot);
        som.set(k, som.get(k) + (team === sp ? voorSpelend : -voorSpelend));
      }
      n++;
    }
    if (!n) return { kaart: slimVlug(s, o.ruis), hoe: 'vlug' };
    let beste = mag[0], bw = -Infinity;
    for (const k of mag) {
      const v = som.get(k) / n + (o.ruis ? (Math.random() * 2 - 1) * o.ruis * 40 : 0);
      if (v > bw) { bw = v; beste = k; }
    }
    return { kaart: beste, hoe: 'mc', steekproeven: n, knopen: KNOPEN, ms: Date.now() - begin };
  }

  // ---------- denken in een achtergrondwerker als dat kan ----------
  let werker = null, werkerStuk = false, volgnummer = 0;
  const wachtend = new Map();
  function zelf(s, opties) { return kiesKaart(s, opties); }
  function werkerOpgeven() {
    werkerStuk = true;
    if (werker) { try { werker.terminate(); } catch (e) { /* al weg */ } }
    werker = null;
    for (const [id, w] of wachtend) { clearTimeout(w.wacht); wachtend.delete(id); w.klaar(zelf(w.s, w.opties)); }
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
            w.klaar(e.data.uit || zelf(w.s, w.opties));
          };
          werker.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); werkerOpgeven(); };
        } catch (e) { werker = null; werkerStuk = true; }
      }
      if (!werker) { setTimeout(() => klaar(zelf(s, opties)), 20); return; }
      const id = ++volgnummer;
      const w = { klaar, s, opties };
      w.wacht = setTimeout(() => { if (wachtend.has(id)) werkerOpgeven(); }, (opties.tijd || 600) + 2500);
      wachtend.set(id, w);
      werker.postMessage({ id, s, opties });
    });
  }
  const inWerker = typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function';
  if (inWerker) {
    self.onmessage = (e) => {
      let uit = null;
      try { uit = kiesKaart(e.data.s, e.data.opties); } catch (fout) { uit = null; }
      self.postMessage({ id: e.data.id, uit });
    };
  }
  const werkerStatus = () => (werker ? 'werker' : werkerStuk ? 'stuk' : 'geen');

  const Klaverregels = {
    KLEUREN, TEKENS, RANGEN, RANGNAAM, KLEURMASKER, kleurVan, rangVan, bit, sterkte, puntenVan, kaartNaam, kort, aantal, kaartenIn,
    schud, deel, winnaarIndex, slagPunten, roemVan, legaal, waaromNiet, nieuwSpel, kopie, magNu, speel, afrekenen,
    troefWaarde, kiesTroef, kennis, steekproef, ddWaarden, slimVlug, kiesKaart, denk, werkerStatus
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Klaverregels;
  else wereld.Klaverregels = Klaverregels;
})(typeof window !== 'undefined' ? window : globalThis);
