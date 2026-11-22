/* Damregels: het internationale damspel op honderd velden, zoals de KNDB het speelt, en een denkende tegenstander.

   - Het bord heeft vijftig donkere speelvelden, genummerd 1 tot en met 50. Zwart begint bovenaan (1–20),
     wit onderaan (31–50). Wit begint.
   - Een schijf gaat één veld schuin vooruit. Slaan mag ook achteruit.
   - Slaan is verplicht. Je moet de slag kiezen die de meeste stukken slaat (meerslag); een dam telt als één stuk.
   - Geslagen stukken gaan pas van het bord als de hele slag klaar is, en je mag een stuk geen twee keer
     overspringen (de Turkse slag). Het veld waar je slag begon, telt tijdens de slag als leeg.
   - Een schijf die op de achterste rij eindigt, wordt een dam. Komt hij daar alleen langs tijdens een slag,
     dan blijft het een schijf.
   - Een dam gaat over een vrije diagonaal zo ver hij wil, en slaat ook op afstand.
   - Wie niet meer kan zetten, heeft verloren.
   - Remise: drie keer dezelfde stand, of 25 zetten van beide spelers met alleen dammen zonder te slaan,
     en de eindspelregels: drie stukken met een dam tegen één dam is remise na 16 zetten per speler,
     twee stukken (met een dam) tegen één dam na 5 zetten per speler. */
(function (wereld) {
  'use strict';
  // waar dit bestand vandaan kwam: de achtergrondwerker laadt hetzelfde bestand
  const BRON = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || null;

  // ---------- het bord ----------
  const RIJ = new Int8Array(51), KOL = new Int8Array(51);
  const OP = Array.from({ length: 10 }, () => new Int8Array(10));
  for (let s = 1; s <= 50; s++) {
    const r = Math.floor((s - 1) / 5), p = (s - 1) % 5;
    RIJ[s] = r; KOL[s] = 2 * p + (r % 2 === 0 ? 1 : 0);
    OP[r][KOL[s]] = s;
  }
  // richtingen: 0 linksboven, 1 rechtsboven, 2 linksonder, 3 rechtsonder; wit loopt naar boven
  const RICHT = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const BUUR = Array.from({ length: 51 }, () => new Int8Array(4));
  const STRAAL = Array.from({ length: 51 }, () => [[], [], [], []]);
  for (let s = 1; s <= 50; s++) {
    for (let d = 0; d < 4; d++) {
      let r = RIJ[s] + RICHT[d][0], c = KOL[s] + RICHT[d][1];
      while (r >= 0 && r < 10 && c >= 0 && c < 10) {
        STRAAL[s][d].push(OP[r][c]);
        r += RICHT[d][0]; c += RICHT[d][1];
      }
      BUUR[s][d] = STRAAL[s][d].length ? STRAAL[s][d][0] : 0;
    }
  }

  // stukken: 0 leeg, 1 witte schijf, 2 witte dam, 3 zwarte schijf, 4 zwarte dam
  const WS = 1, WD = 2, ZS = 3, ZD = 4;
  const kleurVan = (p) => (p === 0 ? -1 : (p <= 2 ? 0 : 1));
  const isDam = (p) => p === WD || p === ZD;

  function beginstand() {
    const b = new Int8Array(51);
    for (let s = 1; s <= 20; s++) b[s] = ZS;
    for (let s = 31; s <= 50; s++) b[s] = WS;
    return { b, aan: 0 };
  }
  function kopie(st) { return { b: st.b.slice(), aan: st.aan }; }

  // ---------- zetten ----------
  // Een zet: { van, naar, slag: [geslagen velden in volgorde], pad: [landingsvelden in volgorde], kroon }
  function slagSchijf(b, van, s, ik, geslagen, pad, uit) {
    let verder = false;
    for (let d = 0; d < 4; d++) {
      const n = BUUR[s][d];
      if (!n) continue;
      const q = b[n];
      if (q === 0 || kleurVan(q) === ik || geslagen.indexOf(n) >= 0) continue;
      const l = BUUR[n][d];
      if (!l || (b[l] !== 0 && l !== van)) continue;
      geslagen.push(n); pad.push(l);
      slagSchijf(b, van, l, ik, geslagen, pad, uit);
      geslagen.pop(); pad.pop();
      verder = true;
    }
    if (!verder && geslagen.length) uit.push({ van, naar: s, slag: geslagen.slice(), pad: pad.slice() });
  }
  function slagDam(b, van, s, ik, geslagen, pad, uit) {
    let verder = false;
    for (let d = 0; d < 4; d++) {
      const ray = STRAAL[s][d];
      let i = 0;
      while (i < ray.length && (b[ray[i]] === 0 || ray[i] === van)) i++;
      if (i >= ray.length) continue;
      const n = ray[i], q = b[n];
      if (kleurVan(q) === ik || geslagen.indexOf(n) >= 0) continue;
      for (let j = i + 1; j < ray.length; j++) {
        const l = ray[j];
        if (b[l] !== 0 && l !== van) break;
        geslagen.push(n); pad.push(l);
        slagDam(b, van, l, ik, geslagen, pad, uit);
        geslagen.pop(); pad.pop();
        verder = true;
      }
    }
    if (!verder && geslagen.length) uit.push({ van, naar: s, slag: geslagen.slice(), pad: pad.slice() });
  }
  const promotieRij = (ik) => (ik === 0 ? 0 : 9);

  // alle zetten voor kant ik; bij een slag alleen de grootste (meerslag), dubbele routes samengevoegd
  function zettenVan(b, ik) {
    const slagen = [];
    for (let s = 1; s <= 50; s++) {
      const p = b[s];
      if (p === 0 || (p <= 2 ? 0 : 1) !== ik) continue;
      if (p === WD || p === ZD) slagDam(b, s, s, ik, [], [], slagen);
      else slagSchijf(b, s, s, ik, [], [], slagen);
    }
    if (slagen.length) {
      let max = 0;
      for (const z of slagen) if (z.slag.length > max) max = z.slag.length;
      let uit = slagen.filter((z) => z.slag.length === max);
      if (uit.length > 1) {
        const gezien = new Set(), schoon = [];
        for (const z of uit) {
          const k = (z.van * 51 + z.naar) + ':' + (z.slag.length > 1 ? z.slag.slice().sort((x, y) => x - y).join(',') : z.slag[0]);
          if (!gezien.has(k)) { gezien.add(k); schoon.push(z); }
        }
        uit = schoon;
      }
      const rij = promotieRij(ik);
      for (const z of uit) z.kroon = !isDam(b[z.van]) && RIJ[z.naar] === rij;
      return uit;
    }
    const uit = [], rij = promotieRij(ik);
    for (let s = 1; s <= 50; s++) {
      const p = b[s];
      if (p === 0 || (p <= 2 ? 0 : 1) !== ik) continue;
      if (p === WD || p === ZD) {
        for (let d = 0; d < 4; d++) {
          const ray = STRAAL[s][d];
          for (let i = 0; i < ray.length; i++) {
            const l = ray[i];
            if (b[l] !== 0) break;
            uit.push({ van: s, naar: l, slag: [], pad: [l], kroon: false });
          }
        }
      } else {
        const d0 = ik === 0 ? 0 : 2;
        for (let d = d0; d < d0 + 2; d++) {
          const l = BUUR[s][d];
          if (l && b[l] === 0) uit.push({ van: s, naar: l, slag: [], pad: [l], kroon: RIJ[l] === rij });
        }
      }
    }
    return uit;
  }
  const zetten = (st) => zettenVan(st.b, st.aan);
  // alle slagen van één steen, ook als het niet de meeste zijn (om uit te leggen waarom iets niet mag)
  function slagenVan(st, s) {
    const uit = [], p = st.b[s];
    if (!p) return uit;
    if (isDam(p)) slagDam(st.b, s, s, kleurVan(p), [], [], uit); else slagSchijf(st.b, s, s, kleurVan(p), [], [], uit);
    return uit;
  }

  function speel(st, z) {
    const b = st.b.slice();
    const p = b[z.van];
    b[z.van] = 0;
    for (const g of z.slag) b[g] = 0;
    b[z.naar] = z.kroon ? (p === WS ? WD : ZD) : p;
    return { b, aan: 1 - st.aan };
  }

  function perft(st, diepte) {
    if (diepte === 0) return 1;
    const lijst = zetten(st);
    if (diepte === 1) return lijst.length;
    let n = 0;
    for (const z of lijst) n += perft(speel(st, z), diepte - 1);
    return n;
  }

  // de notatie: 32-28 of 28x19 (bij een meerslag de velden waar je langs komt)
  function notatie(z) {
    if (!z.slag.length) return `${z.van}-${z.naar}`;
    return [z.van].concat(z.pad).join('x');
  }

  // stukken tellen
  function telling(b) {
    const t = [0, 0, 0, 0, 0];
    for (let s = 1; s <= 50; s++) t[b[s]]++;
    return { ws: t[WS], wd: t[WD], zs: t[ZS], zd: t[ZD], wit: t[WS] + t[WD], zwart: t[ZS] + t[ZD] };
  }

  // ---------- Zobrist-sleutels voor herhaling en de opzoektabel ----------
  let zaad = 0x2F6B1D35;
  const willek = () => { zaad ^= zaad << 13; zaad ^= zaad >>> 17; zaad ^= zaad << 5; return zaad | 0; };
  const Z1 = Array.from({ length: 5 }, () => Int32Array.from({ length: 51 }, willek));
  const Z2 = Array.from({ length: 5 }, () => Int32Array.from({ length: 51 }, willek));
  const ZA1 = willek(), ZA2 = willek();
  const samen = (h1, h2) => (h1 >>> 0) * 2097152 + ((h2 >>> 0) >>> 11);
  function hashes(b, aan) {
    let h1 = aan ? ZA1 : 0, h2 = aan ? ZA2 : 0;
    for (let s = 1; s <= 50; s++) { const p = b[s]; if (p) { h1 ^= Z1[p][s]; h2 ^= Z2[p][s]; } }
    return [h1, h2];
  }
  function sleutel(st) { const h = hashes(st.b, st.aan); return samen(h[0], h[1]); }

  // ---------- een partij: herhaling en remise ----------
  // één dam alleen tegen hooguit drie stukken met minstens één dam: remise na 16 (drie stukken) of 5 zetten per speler
  function eindspelSoort(b) {
    const t = telling(b);
    const tegen = (zwak, sterkStukken, sterkDammen) => zwak && sterkDammen >= 1 && sterkStukken <= 3;
    const witAlleen = t.ws === 0 && t.wd === 1, zwartAlleen = t.zs === 0 && t.zd === 1;
    let n = 0;
    if (tegen(witAlleen, t.zwart, t.zd)) n = Math.max(n, t.zwart);
    if (tegen(zwartAlleen, t.wit, t.wd)) n = Math.max(n, t.wit);
    if (!n) return null;
    return { grens: n === 3 ? 32 : 10, sig: t.ws + ',' + t.wd + ',' + t.zs + ',' + t.zd };
  }
  function nieuwePartij(st) {
    st = st || beginstand();
    const es = eindspelSoort(st.b);
    return { st, sleutels: [sleutel(st)], damZetten: 0, eindspel: es ? es.sig : '', eindspelGrens: es ? es.grens : 0, eindspelTeller: 0, nummer: 0, vorige: null };
  }
  function partijZet(p, z) {
    const st = speel(p.st, z);
    const onomkeerbaar = z.slag.length > 0 || !isDam(p.st.b[z.van]);
    const k = sleutel(st);
    const es = eindspelSoort(st.b);
    const sig = es ? es.sig : '';
    return {
      st,
      sleutels: onomkeerbaar ? [k] : p.sleutels.concat(k),
      damZetten: onomkeerbaar ? 0 : p.damZetten + 1,
      eindspel: sig,
      eindspelGrens: es ? es.grens : 0,
      eindspelTeller: es && sig === p.eindspel ? p.eindspelTeller + 1 : 0,
      nummer: p.nummer + 1,
      vorige: z
    };
  }
  // null zolang de partij loopt; anders wie er won of waarom het remise is
  function uitslag(p) {
    if (!zetten(p.st).length) {
      const t = telling(p.st.b);
      return { winnaar: 1 - p.st.aan, reden: (p.st.aan === 0 ? t.wit : t.zwart) ? 'vast' : 'op' };
    }
    const k = p.sleutels[p.sleutels.length - 1];
    let n = 0;
    for (const x of p.sleutels) if (x === k) n++;
    if (n >= 3) return { remise: true, reden: 'herhaling' };
    if (p.damZetten >= 50) return { remise: true, reden: 'damzetten' };
    if (p.eindspelGrens && p.eindspelTeller >= p.eindspelGrens) return { remise: true, reden: 'eindspel' };
    return null;
  }

  // ---------- de denker ----------
  // waardering per veld voor een witte schijf; zwart gebruikt het gespiegelde veld (51 - s)
  const PST = new Int8Array(51), DAMVELD = new Int8Array(51), ACHTER = new Int8Array(51);
  const LANGE_LIJN = [46, 41, 37, 32, 28, 23, 19, 14, 10, 5];
  for (let s = 1; s <= 50; s++) {
    const r = RIJ[s], c = KOL[s];
    let v = 0;
    if (r >= 3 && r <= 6 && c >= 2 && c <= 7) v += (r >= 4 && r <= 5 && c >= 3 && c <= 6) ? 6 : 3;
    if (c === 0 || c === 9) v -= 4;
    PST[s] = v;
    DAMVELD[s] = (LANGE_LIJN.indexOf(s) >= 0 ? 12 : 0) + (r >= 3 && r <= 6 && c >= 3 && c <= 6 ? 4 : 0);
  }
  ACHTER[46] = 1; ACHTER[47] = 4; ACHTER[48] = 6; ACHTER[49] = 4; ACHTER[50] = 1;
  const TEMPO = [0, 2, 4, 7, 11, 16, 22, 30, 40, 0];
  const VRIJ = [0, 70, 55, 42, 32, 24, 17, 11, 6, 3];
  // de kegel voor een schijf: velden waar een tegenstander hem nog kan tegenhouden
  const KEGEL = [[], []];
  for (let s = 1; s <= 50; s++) {
    const r = RIJ[s], c = KOL[s];
    const wit = [], zwart = [];
    for (let rr = 0; rr < 10; rr++) {
      for (let cc = 0; cc < 10; cc++) {
        const t = OP[rr][cc];
        if (!t) continue;
        if (rr < r && Math.abs(cc - c) <= (r - rr) + 1) wit.push(t);
        if (rr > r && Math.abs(cc - c) <= (rr - r) + 1) zwart.push(t);
      }
    }
    KEGEL[0][s] = Int8Array.from(wit); KEGEL[1][s] = Int8Array.from(zwart);
  }
  function evalueer(b, aan) {
    let ws = 0, zs = 0, wd = 0, zd = 0, pos = 0, wTempo = 0, zTempo = 0;
    let wL = 0, wR = 0, zL = 0, zR = 0, wAchter = 0, zAchter = 0, wVast = 0, zVast = 0;
    for (let s = 1; s <= 50; s++) {
      const p = b[s];
      if (p === 0) continue;
      if (p === WS) {
        ws++; pos += PST[s];
        const r = RIJ[s];
        wTempo += TEMPO[9 - r];
        if (KOL[s] < 5) wL++; else wR++;
        if (r === 9) wAchter += ACHTER[s];
        const a = BUUR[s][0], c = BUUR[s][1];
        if ((!a || b[a]) && (!c || b[c])) wVast++;
      } else if (p === ZS) {
        zs++; pos -= PST[51 - s];
        const r = RIJ[s];
        zTempo += TEMPO[r];
        if (KOL[s] < 5) zL++; else zR++;
        if (r === 0) zAchter += ACHTER[51 - s];
        const a = BUUR[s][2], c = BUUR[s][3];
        if ((!a || b[a]) && (!c || b[c])) zVast++;
      } else if (p === WD) { wd++; pos += DAMVELD[s]; }
      else { zd++; pos -= DAMVELD[s]; }
    }
    const mannen = ws + zs, stukken = mannen + wd + zd, fase = mannen / 40;
    const damwaarde = 300 + Math.round(60 * (1 - fase));
    let w = (ws - zs) * 100 + (wd - zd) * damwaarde + pos;
    w += (wTempo - zTempo) * (0.45 + 0.9 * (1 - fase));
    w -= (Math.abs(wL - wR) - Math.abs(zL - zR)) * (1 + 3 * fase);
    if (zs >= 6) w += wAchter;
    if (ws >= 6) w -= zAchter;
    w -= (wVast - zVast) * 3;
    // wie voor staat, ruilt graag
    const mw = ws + wd * 3, mz = zs + zd * 3;
    if (mw !== mz) w += (mw - mz) * (10 - stukken / 5);
    // vrijlopers in het eindspel
    if (stukken <= 24) {
      for (let s = 1; s <= 50; s++) {
        const p = b[s];
        if (p === WS && zd === 0) {
          const k = KEGEL[0][s];
          let vrij = true;
          for (let i = 0; i < k.length; i++) { const q = b[k[i]]; if (q === ZS || q === ZD) { vrij = false; break; } }
          if (vrij) w += VRIJ[RIJ[s]];
        } else if (p === ZS && wd === 0) {
          const k = KEGEL[1][s];
          let vrij = true;
          for (let i = 0; i < k.length; i++) { const q = b[k[i]]; if (q === WS || q === WD) { vrij = false; break; } }
          if (vrij) w -= VRIJ[9 - RIJ[s]];
        }
      }
    }
    // één dam alleen tegen weinig stukken is bijna altijd remise
    if ((ws === 0 && wd === 1 && zd >= 1 && zs + zd <= 3) || (zs === 0 && zd === 1 && wd >= 1 && ws + wd <= 3)) w /= 8;
    return (aan === 0 ? w : -w) | 0;
  }

  // snelle vraag: kan deze kant nu slaan?
  function kanSlaanVan(b, ik) {
    for (let s = 1; s <= 50; s++) {
      const p = b[s];
      if (p === 0 || (p <= 2 ? 0 : 1) !== ik) continue;
      if (p === WS || p === ZS) {
        for (let d = 0; d < 4; d++) {
          const n = BUUR[s][d];
          if (!n) continue;
          const q = b[n];
          if (q === 0 || (q <= 2 ? 0 : 1) === ik) continue;
          const l = BUUR[n][d];
          if (l && b[l] === 0) return true;
        }
      } else {
        for (let d = 0; d < 4; d++) {
          const ray = STRAAL[s][d];
          let i = 0;
          while (i < ray.length && b[ray[i]] === 0) i++;
          if (i + 1 >= ray.length) continue;
          const q = b[ray[i]];
          if ((q <= 2 ? 0 : 1) === ik) continue;
          if (b[ray[i + 1]] === 0) return true;
        }
      }
    }
    return false;
  }
  const kanSlaan = (st) => kanSlaanVan(st.b, st.aan);

  const MAT = 1000000, INF = 2000000000;
  const TT_N = 1 << 18, TT_M = TT_N - 1;
  let TK = null, TW = null, TD = null, TF = null, TZ = null;
  const KILLER = new Uint16Array(512), HIST = new Int32Array(51 * 51);
  const PH = new Float64Array(1024), PI = new Int16Array(1024);
  let KNOPEN = 0, DEADLINE = 0, GESTOPT = false, NH1 = 0, NH2 = 0;
  const opVolgorde = (a, b) => b.o - a.o;

  // zet op een kopie van het bord en reken de nieuwe sleutel bij
  function doe(b, z, h1, h2) {
    const p = b[z.van];
    b[z.van] = 0; h1 ^= Z1[p][z.van]; h2 ^= Z2[p][z.van];
    const sl = z.slag;
    for (let i = 0; i < sl.length; i++) { const g = sl[i], q = b[g]; b[g] = 0; h1 ^= Z1[q][g]; h2 ^= Z2[q][g]; }
    const np = z.kroon ? (p === WS ? WD : ZD) : p;
    b[z.naar] = np; h1 ^= Z1[np][z.naar]; h2 ^= Z2[np][z.naar];
    NH1 = h1 ^ ZA1; NH2 = h2 ^ ZA2;
  }

  function zoek(b, aan, h1, h2, diepte, alpha, beta, ply, sp, verl) {
    if ((++KNOPEN & 1023) === 0 && Date.now() > DEADLINE) GESTOPT = true;
    if (GESTOPT) return 0;
    // herhaling van zetten is remise
    if (PI[sp] <= sp - 4) {
      const k = PH[sp];
      for (let j = sp - 4; j >= PI[sp]; j -= 2) if (PH[j] === k) return 0;
    }
    const lijst = zettenVan(b, aan), n = lijst.length;
    if (!n) return -MAT + ply;
    const slaat = lijst[0].slag.length > 0;
    if (diepte <= 0 && !slaat) {
      // dreigt de ander te slaan? dan nog één zet verder kijken
      if (verl > 0 && ply < 120 && kanSlaanVan(b, 1 - aan)) { diepte = 1; verl--; }
      else return evalueer(b, aan);
    }
    const idx = h1 & TT_M, chk = h2 | 1;
    let ttZet = 0;
    if (TK[idx] === chk) {
      ttZet = TZ[idx];
      if (TD[idx] >= diepte) {
        let v = TW[idx];
        if (v > MAT - 1000) v -= ply; else if (v < -MAT + 1000) v += ply;
        const f = TF[idx];
        if (f === 1 || (f === 2 && v >= beta) || (f === 3 && v <= alpha)) return v;
      }
    }
    if (n > 1) {
      const k1 = KILLER[ply * 2], k2 = KILLER[ply * 2 + 1];
      for (let i = 0; i < n; i++) {
        const z = lijst[i], c = z.van * 51 + z.naar;
        z.o = c === ttZet ? 1 << 30 : c === k1 ? 1 << 29 : c === k2 ? (1 << 29) - 1 : HIST[c] + (z.kroon ? 1 << 28 : 0);
      }
      lijst.sort(opVolgorde);
    }
    const alpha0 = alpha;
    let beste = -INF, besteC = 0;
    for (let i = 0; i < n; i++) {
      const z = lijst[i];
      const nb = b.slice();
      doe(nb, z, h1, h2);
      const c1 = NH1, c2 = NH2;
      PH[sp + 1] = samen(c1, c2);
      PI[sp + 1] = (z.slag.length || b[z.van] === WS || b[z.van] === ZS) ? sp + 1 : PI[sp];
      let v;
      if (i === 0) v = -zoek(nb, 1 - aan, c1, c2, diepte - 1, -beta, -alpha, ply + 1, sp + 1, verl);
      else {
        v = -zoek(nb, 1 - aan, c1, c2, diepte - 1, -alpha - 1, -alpha, ply + 1, sp + 1, verl);
        if (v > alpha && v < beta && !GESTOPT) v = -zoek(nb, 1 - aan, c1, c2, diepte - 1, -beta, -alpha, ply + 1, sp + 1, verl);
      }
      if (GESTOPT) return 0;
      if (v > beste) { beste = v; besteC = z.van * 51 + z.naar; }
      if (v > alpha) {
        alpha = v;
        if (alpha >= beta) {
          if (!slaat) {
            if (KILLER[ply * 2] !== besteC) { KILLER[ply * 2 + 1] = KILLER[ply * 2]; KILLER[ply * 2] = besteC; }
            HIST[besteC] += diepte > 0 ? diepte * diepte : 1;
          }
          break;
        }
      }
    }
    let opslag = beste;
    if (opslag > MAT - 1000) opslag += ply; else if (opslag < -MAT + 1000) opslag -= ply;
    TK[idx] = chk; TW[idx] = opslag; TD[idx] = Math.max(-127, Math.min(127, diepte));
    TF[idx] = beste <= alpha0 ? 3 : beste >= beta ? 2 : 1; TZ[idx] = besteC;
    return beste;
  }

  // de beste zet binnen een tijd en diepte; ruis maakt een tegenstander menselijker
  function besteZet(st, opties) {
    const o = Object.assign({ diepte: 64, tijd: 1000, ruis: 0, geschiedenis: [], verlenging: 2 }, opties || {});
    const lijst = zetten(st);
    if (!lijst.length) return null;
    if (lijst.length === 1) return { zet: lijst[0], waarde: 0, diepte: 0, knopen: 0 };
    if (!TK) { TK = new Int32Array(TT_N); TW = new Int32Array(TT_N); TD = new Int8Array(TT_N); TF = new Uint8Array(TT_N); TZ = new Uint16Array(TT_N); }
    for (let i = 0; i < HIST.length; i++) HIST[i] >>= 2;
    KILLER.fill(0);
    const begin = Date.now();
    DEADLINE = begin + o.tijd; KNOPEN = 0; GESTOPT = false;
    let sp = 0;
    for (const k of o.geschiedenis.slice(-300)) { PH[sp] = k; PI[sp] = 0; sp++; }
    const [h1, h2] = hashes(st.b, st.aan);
    PH[sp] = samen(h1, h2); PI[sp] = 0;
    let waarden = new Map(), bereikt = 0;
    const volgorde = lijst.slice();
    for (let d = 1; d <= o.diepte; d++) {
      const nu = new Map();
      let alpha = -INF;
      for (let i = 0; i < volgorde.length; i++) {
        const z = volgorde[i];
        const nb = st.b.slice();
        doe(nb, z, h1, h2);
        const c1 = NH1, c2 = NH2;
        PH[sp + 1] = samen(c1, c2);
        PI[sp + 1] = (z.slag.length || !isDam(st.b[z.van])) ? sp + 1 : PI[sp];
        let v;
        if (o.ruis > 0) v = -zoek(nb, 1 - st.aan, c1, c2, d - 1, -INF, -(alpha - o.ruis), 1, sp + 1, o.verlenging);
        else if (i === 0) v = -zoek(nb, 1 - st.aan, c1, c2, d - 1, -INF, INF, 1, sp + 1, o.verlenging);
        else {
          v = -zoek(nb, 1 - st.aan, c1, c2, d - 1, -alpha - 1, -alpha, 1, sp + 1, o.verlenging);
          if (v > alpha && !GESTOPT) v = -zoek(nb, 1 - st.aan, c1, c2, d - 1, -INF, -alpha, 1, sp + 1, o.verlenging);
        }
        if (GESTOPT) break;
        nu.set(z, v);
        if (v > alpha) alpha = v;
      }
      if (GESTOPT) break;
      waarden = nu; bereikt = d;
      volgorde.sort((a, b) => nu.get(b) - nu.get(a));
      if (Math.abs(nu.get(volgorde[0])) > MAT - 1000) break;
      if (Date.now() - begin > o.tijd * 0.55) break;
    }
    let gekozen = volgorde[0];
    if (o.ruis > 0 && waarden.size) {
      let beste = -Infinity;
      for (const [z, v] of waarden) {
        const vr = v + (Math.random() * 2 - 1) * o.ruis;
        if (vr > beste) { beste = vr; gekozen = z; }
      }
    }
    return { zet: gekozen, waarde: waarden.get(gekozen) || 0, diepte: bereikt, knopen: KNOPEN };
  }

  // denken in een achtergrondwerker als dat kan, anders gewoon hier
  let werker = null, werkerStuk = false, volgnummer = 0;
  const wachtend = new Map();
  function zelfDenken(st, opties) { return besteZet({ b: Int8Array.from(st.b), aan: st.aan }, opties); }
  function werkerOpgeven() {
    werkerStuk = true;
    if (werker) { try { werker.terminate(); } catch (e) { /* al weg */ } }
    werker = null;
    for (const [id, w] of wachtend) { clearTimeout(w.wacht); wachtend.delete(id); w.klaar(zelfDenken(w.st, w.opties)); }
  }
  function denk(st, opties) {
    opties = Object.assign({}, opties || {});
    return new Promise((klaar) => {
      if (!werker && !werkerStuk && BRON && typeof Worker !== 'undefined') {
        try {
          werker = new Worker(BRON);
          werker.onmessage = (e) => {
            const w = wachtend.get(e.data.id);
            if (!w) return;
            clearTimeout(w.wacht); wachtend.delete(e.data.id);
            w.klaar(e.data.zet ? { zet: e.data.zet, waarde: e.data.waarde, diepte: e.data.diepte, knopen: e.data.knopen } : zelfDenken(w.st, w.opties));
          };
          werker.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); werkerOpgeven(); };
        } catch (e) { werker = null; werkerStuk = true; }
      }
      if (!werker) { setTimeout(() => klaar(zelfDenken(st, opties)), 20); return; }
      const id = ++volgnummer;
      const w = { klaar, st: { b: Int8Array.from(st.b), aan: st.aan }, opties };
      w.wacht = setTimeout(() => { if (wachtend.has(id)) werkerOpgeven(); }, (opties.tijd || 1000) + 2500);
      wachtend.set(id, w);
      werker.postMessage({ id, b: Array.from(st.b), aan: st.aan, opties });
    });
  }
  // in de werker zelf: wachten op een stand en de beste zet terugsturen
  const inWerker = typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function';
  if (inWerker) {
    self.onmessage = (e) => {
      const d = e.data;
      let r = null;
      try { r = besteZet({ b: Int8Array.from(d.b), aan: d.aan }, d.opties); } catch (fout) { r = null; }
      self.postMessage({ id: d.id, zet: r && r.zet ? { van: r.zet.van, naar: r.zet.naar, slag: r.zet.slag, pad: r.zet.pad, kroon: r.zet.kroon } : null, waarde: r ? r.waarde : 0, diepte: r ? r.diepte : 0, knopen: r ? r.knopen : 0 });
    };
  }

  const werkerStatus = () => (werker ? 'werker' : werkerStuk ? 'stuk' : 'geen');
  const Damregels = { werkerStatus, WS, WD, ZS, ZD, RIJ, KOL, OP, BUUR, STRAAL, beginstand, kopie, zetten, zettenVan, slagenVan, kanSlaan, speel, perft, notatie, telling, sleutel, evalueer, besteZet, denk, kleurVan, isDam, nieuwePartij, partijZet, uitslag, eindspelSoort };
  if (typeof module !== 'undefined' && module.exports) module.exports = Damregels;
  else wereld.Damregels = Damregels;
})(typeof window !== 'undefined' ? window : globalThis);
