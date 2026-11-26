/* Het uilenspel, schermvullend: een geluksspel met drie dobbelstenen op een rond prentbord.

   Naar de oude prenten (Jan Christoffel Jegher, 1628–1667; Hendriksen in Rotterdam; Brepols in Turnhout) en de
   Franse Jeu de la Chouette:
   - een rond bord met vijftig vakken: elke worp met drie stenen, behalve de zes met drie gelijke. In elk vak staan
     de drie stenen, een plaatje van een dier of voorwerp, en of je moet betalen (B) of mag trekken (T), en hoeveel;
   - in het midden zit een uil voor een spiegel; daar ligt de pot;
   - drie gelijke stenen: de helft van de pot. Drie zessen: de uil, en de hele pot is voor jou;
   - iedereen legt in, en is de pot leeg, dan legt iedereen opnieuw in.
   Een partij duurt zolang de kaars brandt (acht rondes); dan wint wie de meeste penningen heeft.
   De bedragen per vak verschilden per prent. Hier hangen ze af van hoe zeldzaam de worp is: een lage worp kost
   geld, een hoge brengt geld op, en hoe zeldzamer, hoe meer, met een paar verrassingen (doorgerekend: de pot
   loopt ongeveer twee keer per partij leeg, en blut gaan gebeurt zelden).
   Het bord hangt ook als prent aan de muur van de voorkamer (maakPrent). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const INKT = '#2B2118';
  const BEGIN = 20, INLEG = 3, RONDES = 8;
  const C = 360;
  // drie ringen met vakken (van buiten naar binnen), dan de ring met de zes gelijke worpen, in het midden de uil
  const RINGEN = [{ n: 22, r0: 266, r1: 327 }, { n: 16, r0: 205, r1: 266 }, { n: 12, r0: 148, r1: 205 }];
  const DRIE = [106, 148];
  const KLEUREN = ['#C0392B', '#2D5BA8', '#3F8A44', '#E0B030'];

  // ============================================================
  // DE VAKKEN: alle worpen, wat ze doen en welk plaatje erbij hoort
  // ============================================================
  const VELDEN = [];
  for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) for (let c = b; c <= 6; c++) if (!(a === b && b === c)) VELDEN.push([a, b, c]);
  const sleutel = (w) => w.slice().sort((x, y) => x - y).join('');
  const NIETS = ['145', '226', '236', '344'];
  const BIJZONDER = { 123: ['trek', 3], 456: ['trek', 4] };
  function effectVan(w) {
    const k = sleutel(w), som = w[0] + w[1] + w[2];
    if (BIJZONDER[k]) return { soort: BIJZONDER[k][0], n: BIJZONDER[k][1] };
    if (NIETS.includes(k)) return { soort: 'niets', n: 0 };
    if (som <= 10) return { soort: 'betaal', n: som <= 5 ? 4 : som <= 7 ? 3 : som <= 9 ? 2 : 1 };
    return { soort: 'trek', n: som <= 11 ? 1 : som <= 13 ? 2 : som <= 15 ? 3 : 4 };
  }
  // de plaatjes in de volgorde van de vakken: lage worpen dieren en dingen die geld kosten, hoge worpen geluk
  const PLAATJE = ['muis', 'ezel', 'varken', 'kat', 'hond', 'slak', 'ster', 'kikker', 'pijp', 'kan', 'laars', 'klomp', 'bezem', 'emmer', 'schaar', 'bril', 'appel', 'peer', 'vis', 'kreeft',
    'roemer', 'worst', 'kaas', 'kaars', 'brood', 'hoed', 'trom', 'maan', 'eend', 'druiven', 'tulp', 'bij', 'haan', 'koe',
    'kip', 'vlinder', 'schaap', 'lantaarn', 'zwaan', 'ooievaar', 'haas', 'paard', 'molen',
    'klok', 'sleutel', 'hart', 'schip', 'huis', 'zon', 'beurs'];
  const HET = ['varken', 'brood', 'schaap', 'paard', 'hart', 'schip', 'huis'];
  const titelVan = (p) => (p === 'druiven' ? 'De druiven' : (HET.includes(p) ? 'Het ' : 'De ') + p);
  const veldVan = (w) => VELDEN.findIndex((v) => sleutel(v) === sleutel(w));

  // ============================================================
  // HOUTSNEDEN: vijftig plaatjes in een vakje van 24 bij 24, met de hand ingekleurd
  // ([kleur, pad] gevuld met een inktlijn; [kleur, [x, y, r]] een rondje; ['-', ...] alleen een lijn;
  // ['=kleur', pad] een dikke gekleurde lijn)
  // ============================================================
  const KLEUR = { r: '#C8553A', g: '#E6B53F', b: '#5D87B8', v: '#7DA35A', n: '#A0703F', w: '#F7EFDD', z: '#9A9282', k: '#2B2118', o: '#E28A3A', p: '#E9A48E', l: '#CFE0EC', q: '#BFD39A', m: '#7A4E8A' };
  function ster(n, R, r, cx, cy) {
    cx = cx || 0; cy = cy || 0;
    let d = '';
    for (let i = 0; i < 2 * n; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, s = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + s * Math.cos(a)).toFixed(2) + ' ' + (cy + s * Math.sin(a)).toFixed(2) + ' ';
    }
    return d + 'Z';
  }
  const PLAATJES = {
    muis: [['z', 'M-8 3 C-8 -2 -2 -4 3 -3.5 C6 -3 8 -1 10 2.5 L10.6 3.6 L8 4.6 C6 5.6 2 6 -3 6 C-6 6 -8 5 -8 3 Z'], ['p', 'M3.6 -3.4 C2.6 -7.4 7 -7.8 7 -3.8 Z'], ['k', [7.2, 0.8, 0.75]], ['-', 'M-8 4 C-11 3 -11 -1 -9 -3 C-8 -4.5 -10 -6 -11.5 -5'], ['-', 'M-3 6 v1.6 M3 5.8 v1.6']],
    ezel: [['z', 'M-4 -4 L-7.5 -12 L-1.5 -6 Z'], ['z', 'M4 -4 L7.5 -12 L1.5 -6 Z'], ['z', 'M-5 -5 C-5 -8.5 5 -8.5 5 -5 L4.2 6 C4 10.5 -4 10.5 -4.2 6 Z'], ['w', 'M-4.2 3.5 C-4.2 1 4.2 1 4.2 3.5 C4.2 8.6 -4.2 8.6 -4.2 3.5 Z'], ['k', [-2.4, -2, 0.8]], ['k', [2.4, -2, 0.8]], ['k', [-1.4, 5, 0.55]], ['k', [1.4, 5, 0.55]], ['-', 'M-1 -7.6 L0 -4.5 L1 -7.6']],
    varken: [['p', 'M-9 1 C-9 -4 -4 -6 2 -6 C7 -6 9 -3 9 0 C9 4 6 6 1 6 H-4 C-7 6 -9 4 -9 1 Z'], ['p', 'M8.6 -2.2 H11 V2.2 H8.6 Z'], ['p', 'M3.6 -5.8 L5.8 -9.2 L7 -5 Z'], ['-', 'M-6 5.6 v3.4 M-2 6 v3.2 M3 6 v3.2 M6 5.4 v3.4'], ['-', 'M-9 0 c-2 -1 -2 -3 0 -3 c1 0 1 2 -1 2'], ['k', [6, -2.4, 0.7]], ['k', [10, -0.8, 0.4]], ['k', [10, 0.9, 0.4]]],
    kat: [['z', 'M-5 10 C-7.5 4 -6.5 -1 -3.2 -3 L-3.4 -6.4 L-5.6 -11.2 L-1.2 -8.2 H2 L5.8 -11.2 L4.4 -6.4 C6.4 -3 7.4 3 5.2 10 Z'], ['-', 'M5 9.4 C9.5 9.4 10.6 5 8.4 2'], ['g', [-1.5, -5.2, 1]], ['g', [2.2, -5.2, 1]], ['k', [-1.5, -5.2, 0.4]], ['k', [2.2, -5.2, 0.4]], ['-', 'M-0.6 -3.2 h-4.6 M1.4 -3.2 h4.6 M-0.2 -3.6 L0.4 -2.8 L1 -3.6']],
    hond: [['n', 'M-7 10 C-8 5 -6 0 -2 -1 L2 -6 C3 -9 7 -10 9 -8 C10 -7 10.6 -5.6 10 -5 L7.6 -4.4 C6 -2 6 2 6 6 V10 Z'], ['k', 'M3 -7 C1 -6 0 -3 1.4 -1.6 C2.6 -3 3 -5 4.2 -6.2 Z'], ['k', [6.6, -7, 0.7]], ['k', [10.1, -5.6, 0.6]], ['-', 'M-7 8 C-10 7 -11 4 -10 2'], ['-', 'M2 10 V5.5']],
    slak: [['z', 'M-10.5 6 C-6 5 4 5 7 4 C8 2 8 0 8.6 -2 C10 -1 10.4 2 10.2 4 C10 6 8 7 6 7 H-8 Z'], ['g', [-1.5, -1, 6]], ['-', 'M-1.5 -1 C-1.5 -3 1.5 -3 1.5 -1 C1.5 2 -3.5 2 -3.5 -1 C-3.5 -5 3.8 -5 3.8 -1'], ['-', 'M8.2 -1 L7 -6 M9.6 -1 L11 -6'], ['k', [7, -6.4, 0.8]], ['k', [11, -6.4, 0.8]]],
    ster: [['g', ster(8, 11, 4.6)], ['o', [0, 0, 2.6]]],
    kikker: [['v', 'M-8 6 C-10.5 0 -6 -6 0 -6 C6 -6 10.5 0 8 6 C6 9 -6 9 -8 6 Z'], ['v', 'M-7.6 5 L-11 9.4 L-6.6 8.4 Z'], ['v', 'M7.6 5 L11 9.4 L6.6 8.4 Z'], ['w', [-4.4, -6, 2.6]], ['w', [4.4, -6, 2.6]], ['k', [-4.4, -6, 1.05]], ['k', [4.4, -6, 1.05]], ['-', 'M-4 1 Q0 4 4 1']],
    pijp: [['w', 'M-11 7 L3.6 2.6 L4.2 4.4 L-10.6 8.6 Z'], ['w', 'M3 4.2 C2 0 2.4 -4 3.4 -6.2 H8.2 C8.6 -3 8.2 1 6.6 4.4 C5.6 5.6 4 5.6 3 4.2 Z'], ['n', 'M3.4 -6.2 H8.2 V-5 H3.4 Z'], ['-', 'M5.6 -7.4 C4 -9.4 7 -10.2 5.6 -12']],
    kan: [['b', 'M-5 -7 H5 L6 -4 C8 0 7 6 4 9.4 H-4 C-7 6 -8 0 -6 -4 Z'], ['z', 'M-6.4 -8.4 H6.4 V-6.6 H-6.4 Z'], ['b', 'M-6.2 -7.4 L-9.6 -9.6 L-6.2 -4.8 Z'], ['-', 'M6 -4 C11.4 -4 11.4 4.4 6 5.2'], ['-', 'M-6.6 1.6 H6.8']],
    laars: [['n', 'M-3 -9 H4 V3.6 L9.6 4.8 C11 5.6 11 8.6 9 9 H-4 Z'], ['k', 'M-4 -10.6 H5 V-7.6 H-4 Z'], ['k', 'M-4.4 9 H10 V10.6 H-4.4 Z']],
    klomp: [['g', 'M-10 4 C-10 -1 -6 -2 -2 -1 L2 -3 C5 -4.2 9 -3 10 0 C11 3 10 6 7 6 H-7 C-9 6 -10 5 -10 4 Z'], ['k', 'M1.2 -2.4 C3 -3.6 7 -3 8.2 -1 C6 0 3 0 1.2 -2.4 Z'], ['-', 'M-7 2 h7 M-6 4 h5']],
    bezem: [['n', 'M-10.4 -9.6 L-9.4 -10.6 L3.4 2.2 L2.4 3.2 Z'], ['g', 'M1 2 L4 -1 L11 6 L6 11 Z'], ['-', 'M4.6 3.6 L8 9 M6.8 1.8 L10 7.2 M2.8 5 L5.6 10']],
    emmer: [['n', 'M-7 -4 H7 L5 9 H-5 Z'], ['-', 'M-6.4 0 H6.4 M-5.6 5 H5.6'], ['-', 'M-7 -4 C-7 -11.4 7 -11.4 7 -4']],
    schaar: [['z', 'M-1.6 -1.4 L10.6 -6.4 L-0.6 1.2 Z'], ['z', 'M-1.6 1.4 L10.6 6.4 L-0.6 -1.2 Z'], ['-', [-6, -4.2, 3]], ['-', [-6, 4.2, 3]], ['-', 'M-3.6 -2.4 L-1.6 -1.4 M-3.6 2.4 L-1.6 1.4'], ['k', [0, 0, 0.9]]],
    bril: [['l', [-5, 0.5, 4.2]], ['l', [5, 0.5, 4.2]], ['-', 'M-0.8 -0.4 C-0.4 -2.2 0.4 -2.2 0.8 -0.4'], ['-', 'M-9.2 -0.4 L-11.4 -3.4 M9.2 -0.4 L11.4 -3.4'], ['-', 'M-7 -1.4 C-6.2 -2.4 -5 -2.6 -4 -2.2']],
    appel: [['r', 'M0 -5 C-4 -8 -10 -5 -9 1 C-8 7 -3 10 0 8 C3 10 8 7 9 1 C10 -5 4 -8 0 -5 Z'], ['-', 'M0 -5 C0 -7 1 -9 2 -10'], ['v', 'M1 -8 C3 -11 7 -10 7 -8 C5 -7 3 -7 1 -8 Z'], ['-', 'M-5 -2 C-6 0 -6 2 -5 4']],
    peer: [['g', 'M0 -8 C-2 -8 -3 -6 -3 -3 C-3 -1 -7 1 -7 5 C-7 9 -3 10.4 0 10.4 C3 10.4 7 9 7 5 C7 1 3 -1 3 -3 C3 -6 2 -8 0 -8 Z'], ['-', 'M0 -8 L1 -11'], ['v', 'M1 -10 C3 -12 6 -11 6 -10 C4 -9 2 -9 1 -10 Z']],
    vis: [['b', 'M-9.6 0 C-5 -6.4 4 -6 7 0 C4 6 -5 6.4 -9.6 0 Z'], ['b', 'M6 0 L11 -5 L10 0 L11 5 Z'], ['k', [-5.6, -1, 0.85]], ['-', 'M-3 -3.4 C-2 -1 -2 1 -3 3.4'], ['-', 'M0 -1 l1.5 1 l-1.5 1 M3 -1 l1.5 1 l-1.5 1']],
    kreeft: [['r', 'M-2.5 -4 C-2.5 -7 2.5 -7 2.5 -4 L2 5 L4 9.6 H-4 L-2 5 Z'], ['r', 'M-2 -5 L-6 -9 C-9 -10 -10 -7 -8 -6 L-6 -6.6 L-7 -4 C-5 -3 -3 -3 -2 -4 Z'], ['r', 'M2 -5 L6 -9 C9 -10 10 -7 8 -6 L6 -6.6 L7 -4 C5 -3 3 -3 2 -4 Z'], ['-', 'M-2.3 -1 H2.3 M-2.1 2 H2.1 M-2.6 5.4 H2.6'], ['-', 'M-2.2 0 L-6 2 M2.2 0 L6 2 M-2 2.6 L-6 4.6 M2 2.6 L6 4.6'], ['-', 'M-1 -6.6 L-4 -11 M1 -6.6 L4 -11']],
    roemer: [['q', 'M-6 -9.4 H6 C6 -4 4 -2 0 -2 C-4 -2 -6 -4 -6 -9.4 Z'], ['r', 'M-5.6 -6.4 H5.6 C5 -4 3.6 -3 0 -3 C-3.6 -3 -5 -4 -5.6 -6.4 Z'], ['v', 'M-2.4 -2 H2.4 V6 H-2.4 Z'], ['v', [-1.2, 0.6, 0.95]], ['v', [1.2, 3.2, 0.95]], ['v', 'M-5.4 9.4 C-5.4 6.2 5.4 6.2 5.4 9.4 Z']],
    worst: [['r', 'M-10 2 C-10 -4 -2 -6 4 -4 C8 -3 10 0 10 3 C10 6 8 6.4 6 4.4 C4 1.4 -2 1.4 -6 4.4 C-8 6.2 -10 5 -10 2 Z'], ['-', 'M-10 2 L-11.4 4.4 M10 3 L11.4 5.4'], ['-', 'M-6 -1 l1 1 M-1 -3 l1 1 M4 -2 l1 1']],
    kaas: [['o', 'M-10 -1.6 V3.4 C-10 7.6 10 7.6 10 3.4 V-1.6 Z'], ['g', 'M-10 -1.6 C-10 -6 10 -6 10 -1.6 C10 2.8 -10 2.8 -10 -1.6 Z'], ['-', 'M-4 -3 C-2 -4 2 -4 4 -3']],
    kaars: [['w', 'M-2 -6 H2 V6 H-2 Z'], ['g', 'M0 -12 C2 -9 2 -7 0 -6.4 C-2 -7 -2 -9 0 -12 Z'], ['g', 'M-7 6 H7 L5 9 H-5 Z'], ['-', [8.4, 7.4, 2]], ['-', 'M0 -6.4 V-5']],
    brood: [['o', 'M-10.4 4 C-10.4 -3 -5 -6.4 0 -6.4 C5 -6.4 10.4 -3 10.4 4 Z'], ['-', 'M-5 -3 L-3 1 M-1 -4.4 L1 0 M3 -3 L5 1'], ['-', 'M-10.4 4 H10.4']],
    hoed: [['k', 'M-5 -9 H5 L6 3 H-6 Z'], ['k', 'M-11 3 C-11 0.8 11 0.8 11 3 C11 6 -11 6 -11 3 Z'], ['g', 'M-5.6 -1.4 H5.6 V1.2 H-5.6 Z'], ['g', 'M-1.4 -1.8 H1.4 V1.6 H-1.4 Z']],
    trom: [['r', 'M-8 -4 V5 C-8 9 8 9 8 5 V-4 Z'], ['w', 'M-8 -4 C-8 -8 8 -8 8 -4 C8 0 -8 0 -8 -4 Z'], ['-', 'M-8 -1 L-4 7 L0 -0.4 L4 7 L8 -1'], ['-', 'M2 -6 L9 -12 M-2 -6 L-9 -12']],
    maan: [['g', 'M2 -10.4 C-6 -9 -9.4 -3 -8.4 3 C-7.4 8.4 -2 11.2 3.4 10.2 C-2 7.4 -4.2 2 -3.2 -2.4 C-2.4 -6.4 0 -9.2 2 -10.4 Z'], ['g', ster(5, 3, 1.3, 6.5, -5.5)], ['g', ster(5, 2.2, 1, 8, 4)]],
    eend: [['w', 'M-9 2 C-9 -2 -5 -3 -1 -2 C1 -1 2 -2 2 -5 C2 -8 7 -9 8 -6 L11 -5 L8 -4 C7 -2 7 0 8 2 C8 6 4 8 -1 8 C-6 8 -9 6 -9 2 Z'], ['v', 'M2 -5 C2 -8 7 -9 8 -6 L8 -4 C6.4 -4.4 4 -4 2.6 -3 C2.2 -3.6 2 -4.2 2 -5 Z'], ['o', 'M8 -6 L11.4 -5 L8 -4 Z'], ['-', 'M-5 2 C-2 0 2 1 4 3'], ['k', [5.4, -6, 0.7]]],
    druiven: [['m', [-4.6, -3.6, 2.5]], ['m', [0, -3.6, 2.5]], ['m', [4.6, -3.6, 2.5]], ['m', [-2.3, 0.6, 2.5]], ['m', [2.3, 0.6, 2.5]], ['m', [0, 4.8, 2.5]], ['-', 'M0 -6.2 L1 -11'], ['v', 'M1 -9 C4 -12 9 -10 8 -7 C5 -7 3 -8 1 -9 Z']],
    tulp: [['v', 'M0 9 C-5 7 -8 3 -7 0 C-4 2 -1 5 0 9 Z'], ['v', 'M0 7 C4 5 6 2 6 0 C3 1 1 4 0 7 Z'], ['-', 'M0 1 V11'], ['r', 'M-5 -8 L-2.5 -4.6 L0 -9.4 L2.5 -4.6 L5 -8 C6 -3 4 1 0 1 C-4 1 -6 -3 -5 -8 Z'], ['w', 'M-1 -0.6 C-2.2 -3.6 -1.4 -6 0 -8.4 C0 -5.6 1 -3.4 -1 -0.6 Z']],
    bij: [['l', 'M-2 -3 C-6 -10 2 -11 1 -3 Z'], ['l', 'M1 -3 C2 -10 9 -8 4 -2.6 Z'], ['g', 'M-6 0 C-6 -4 6 -4 6 0 C6 4 -6 4 -6 0 Z'], ['k', 'M-2 -3.6 H0 V3.6 H-2 Z'], ['k', 'M2 -3.2 H3.6 V3.2 H2 Z'], ['k', [-7.2, 0, 1.9]], ['-', 'M6 0 L8.6 0']],
    haan: [['v', 'M-6 2 C-12 -2 -12 -8 -9 -10.4 C-9 -5 -7 -2 -5 -1 Z'], ['g', 'M-7 4 C-9 -1 -6 -5 -1 -4 C1 -8 4 -10 6 -8 C8 -6 7 -3 6 -1 C8 1 7 5 3 7 C-1 9 -6 8 -7 4 Z'], ['r', 'M3 -9 C3 -11 5 -12 5.6 -10 C6 -12 8 -11.6 7.6 -9.6 C8.6 -9 8 -7.6 6.6 -8 Z'], ['r', 'M7 -5 C8 -4 8 -2.4 7 -2.4 C6.4 -3 6.4 -4 7 -5 Z'], ['g', 'M7.4 -7 L10.2 -6 L7.4 -5.2 Z'], ['k', [5.6, -7, 0.7]], ['-', 'M0 7 V11 M3 6.6 V11 M-1.6 11 H1.6 M1.6 11 H4.6'], ['-', 'M-3 1 C-1 -1 2 0 3 2']],
    koe: [['w', 'M-9 -4 H5 L7 -6.4 H10 L11 -2 L8 0 L7 3 H-9 Z'], ['k', 'M-6 -3 C-4 -4 -2 -2 -3 0 C-5 1 -7 -1 -6 -3 Z'], ['k', 'M0 -4 H3 C3 -2 2 0 0 0 Z'], ['-', 'M-8 3 V8.4 M-5 3 V8.4 M3 3 V8.4 M6 3 V8.4'], ['-', 'M-9 -3 C-11 -1 -11 3 -10 4.4'], ['-', 'M8 -6.4 L9 -8.6 M10 -6.4 L11.4 -8'], ['k', [9, -3.6, 0.6]], ['p', [3, 3.2, 1.4]]],
    kip: [['n', 'M-7 1 C-10 -2 -10 -5 -8 -6 C-7 -3 -6 -1 -5 0 Z'], ['n', 'M-8 3 C-9 -2 -5 -4 -1 -3 C1 -6 3 -8 6 -7 C8 -6 8 -3 7 -1 C9 2 7 6 2 7 C-3 8 -7 7 -8 3 Z'], ['r', 'M5 -8 C5 -9.6 6.6 -9.6 7 -8 Z'], ['g', 'M8 -5.6 L10 -4.6 L7.8 -4 Z'], ['k', [6, -5.6, 0.65]], ['-', 'M0 7 V10.4 M3 6.6 V10.4'], ['-', 'M-3 1 C-1 -1 2 0 3 2']],
    vlinder: [['g', 'M0 0 C-3 -8 -11 -9 -10 -3 C-9 1 -4 1 0 0 Z'], ['g', 'M0 0 C3 -8 11 -9 10 -3 C9 1 4 1 0 0 Z'], ['r', 'M0 1 C-3 2 -8 4 -6 8 C-4 10 -1 6 0 1 Z'], ['r', 'M0 1 C3 2 8 4 6 8 C4 10 1 6 0 1 Z'], ['k', 'M-0.8 -4 H0.8 V7 H-0.8 Z'], ['-', 'M0 -4 C-1 -7 -2 -9 -4 -10 M0 -4 C1 -7 2 -9 4 -10'], ['k', [-5.6, -3.6, 1]], ['k', [5.6, -3.6, 1]]],
    schaap: [['w', 'M-8 2 C-11 1 -10 -4 -7 -4 C-6 -7 -2 -7 -1 -5 C1 -7 5 -6 5 -3 C8 -3 8 2 5 3 C4 5 -6 5 -8 2 Z'], ['k', 'M5 -4 C7 -6 10 -5 10 -2 C10 0 8 1 6 0 Z'], ['=k', 'M-6 4 V9 M-3 4.4 V9 M1 4.4 V9 M4 4 V9'], ['-', 'M-6 -1 c1 -1 2 0 3 -1 M-2 1 c1 -1 2 0 3 -1']],
    lantaarn: [['k', 'M-6 -6 L0 -10 L6 -6 Z'], ['g', 'M-5 -6 H5 V7 H-5 Z'], ['l', 'M-3.6 -4.6 H3.6 V5.6 H-3.6 Z'], ['g', 'M0 -2 C1.4 0 1.4 1.6 0 2.4 C-1.4 1.6 -1.4 0 0 -2 Z'], ['-', [0, -11.4, 1.4]], ['k', 'M-6 7 H6 V9 H-6 Z']],
    zwaan: [['w', 'M-9 3 C-9 -1 -4 -2 1 0 C2 -4 1 -7 3 -9 C5 -11 8 -10 8 -8 L10 -7 L8 -6.4 C6 -7 5 -5 5 -2 C6 0 9 1 9 4 C9 7 4 8 -2 8 C-7 8 -9 6 -9 3 Z'], ['o', 'M8 -8 L10.6 -7 L8 -6.4 Z'], ['k', [6, -8.2, 0.6]], ['-', 'M-6 3 C-2 0 3 2 5 5'], ['=b', 'M-11 9.6 q2 -1.4 4 0 t4 0 t4 0 t4 0 t4 0']],
    ooievaar: [['=r', 'M-1 1 L-1 11 M1 1 L4 6 L1 7'], ['w', 'M-6 -2 C-6 -6 0 -7 3 -5 C4 -8 4 -10 6 -11 C8 -11 8 -9 7 -8 L6 -5 C6 -2 3 1 -1 1 C-4 1 -6 0 -6 -2 Z'], ['k', 'M-6 -2 C-4 -5 0 -4 2 -2 C0 0 -3 1 -6 -2 Z'], ['r', 'M7 -10.4 L11.6 -7 L7 -8.6 Z'], ['k', [6.4, -9.6, 0.55]]],
    haas: [['n', 'M-9 6 C-10 1 -6 -2 -1 -2 C2 -2 4 -3 5 -5 L4 -11 L6.4 -6 L7 -11 L8.4 -5 C10 -4 11 -2 10 0 L8 1 C8 4 6 6 3 7 H-7 C-8.4 7 -9 6.6 -9 6 Z'], ['w', [-9.4, 3, 1.7]], ['k', [8, -2.6, 0.65]], ['-', 'M1 7 L3 4']],
    paard: [['k', 'M-9 -2 C-12 0 -12 4 -10.4 6.4 C-10 3 -9 1 -9 0 Z'], ['n', 'M-9 0 C-9 -3 -6 -4 -2 -4 H3 L6 -9 C7 -10 9 -10 10 -8 L11 -5 L9 -5 L7 -2 C7 0 6 2 4 2 H-6 C-8 2 -9 1 -9 0 Z'], ['k', 'M3 -4 L6 -9 L5 -5 Z'], ['-', 'M-7 2 L-8 9.4 M-4 2 L-4 9.4 M2 2 L2 9.4 M5 2 L6 9.4'], ['k', [8.6, -7, 0.55]]],
    molen: [['w', 'M0 -5 L-7.4 -12 L-9 -10.4 L-1.6 -3.4 Z'], ['w', 'M0 -5 L7.4 -12 L9 -10.4 L1.6 -3.4 Z'], ['w', 'M0 -5 L7.4 2 L9 0.4 L1.6 -6.6 Z'], ['w', 'M0 -5 L-7.4 2 L-9 0.4 L-1.6 -6.6 Z'], ['n', 'M-4 10.6 L-3 -2.6 H3 L4 10.6 Z'], ['k', 'M-3.6 -2.6 L0 -6 L3.6 -2.6 Z'], ['k', 'M-1 10.6 V7.4 C-1 6.4 1 6.4 1 7.4 V10.6 Z'], ['k', [0, -5, 1]]],
    klok: [['g', 'M-1 -9 H1 C1 -9 5 -8 5 -2 C5 2 6 5 8 6 H-8 C-6 5 -5 2 -5 -2 C-5 -8 -1 -9 -1 -9 Z'], ['k', [0, 8, 1.6]], ['-', [0, -10.4, 1.4]], ['-', 'M-7.4 4 H7.4']],
    sleutel: [['g', [-6, 0, 3.8]], ['w', [-6, 0, 1.6]], ['g', 'M-2.4 -1.1 H10.4 V1.1 H-2.4 Z'], ['g', 'M6 1 H8 V5.4 H6 Z'], ['g', 'M9 1 H10.4 V4 H9 Z']],
    hart: [['r', 'M0 9.4 C-11 1 -10 -8 -4.5 -8 C-2 -8 -0.5 -6 0 -4 C0.5 -6 2 -8 4.5 -8 C10 -8 11 1 0 9.4 Z'], ['-', 'M-6 -5 C-7 -3 -7 -1 -6 1']],
    schip: [['n', 'M-10 2 H10 L7 7 H-7 Z'], ['n', 'M-10 2 V-1.4 H-6 V2 Z'], ['-', 'M-2 2 V-11 M5 2 V-8'], ['w', 'M-6 -10 H2 C3 -6 3 -3 2 0 H-6 C-5 -3 -5 -6 -6 -10 Z'], ['w', 'M2 -7 H8.4 C9.4 -5 9.4 -3 8.4 -1 H2 Z'], ['r', 'M-2 -11 L2.4 -12.4 L-2 -13.6 Z'], ['=b', 'M-11.4 8.6 q2 -1.4 4 0 t4 0 t4 0 t4 0 t4 0 t3 0']],
    huis: [['r', 'M-7 10.4 V-1 H-5 V-4 H-3 V-7 H-1 V-10 H1 V-7 H3 V-4 H5 V-1 H7 V10.4 Z'], ['w', 'M-5 1 H-2 V4 H-5 Z'], ['w', 'M2 1 H5 V4 H2 Z'], ['n', 'M-1.5 10.4 V5.4 H1.5 V10.4 Z'], ['w', 'M-1 -5 H1 V-2.6 H-1 Z']],
    zon: [['g', ster(16, 11.2, 7.4)], ['g', [0, 0, 6.4]], ['k', [-2.2, -1.4, 0.7]], ['k', [2.2, -1.4, 0.7]], ['-', 'M-2.6 2 Q0 4 2.6 2']],
    kroon: [['g', 'M-10 6 L-11 -6 L-5 -1 L0 -9.6 L5 -1 L11 -6 L10 6 Z'], ['g', 'M-10.4 5 H10.4 V9 H-10.4 Z'], ['r', [0, 1.6, 1.7]], ['b', [-5.6, 2.6, 1.2]], ['b', [5.6, 2.6, 1.2]], ['w', [0, -9.6, 1.3]], ['w', [-11, -6, 1.1]], ['w', [11, -6, 1.1]]],
    beurs: [['r', 'M-7 -2 C-9.4 3 -7 9.4 0 9.4 C7 9.4 9.4 3 7 -2 C5 -5 -5 -5 -7 -2 Z'], ['r', 'M-3.4 -4 C-3.4 -7.4 3.4 -7.4 3.4 -4 Z'], ['-', 'M-4.4 -4.4 C-2 -3 2 -3 4.4 -4.4'], ['-', 'M-4.4 -4.4 L-6.4 -8 M4.4 -4.4 L6.4 -8'], ['g', [-8.6, 8.2, 2.2]], ['g', [9, 6, 2]], ['-', 'M-9.6 7.6 h2 M8 5.4 h2']]
  };

  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  const tekst = (t, attrs, ouder) => { const e = el('text', attrs, ouder); e.textContent = t; return e; };
  const f = (v) => v.toFixed(1);
  function plaatje(naam, ouder, x, y, sch, dik) {
    const g = el('g', { transform: `translate(${f(x)} ${f(y)}) scale(${sch})` }, ouder);
    const w = dik || 1.1;
    (PLAATJES[naam] || []).forEach(([s, vorm]) => {
      const kleur = s[0] === '=' ? s.slice(1) : null;
      const attrs = s === '-' ? { fill: 'none', stroke: INKT, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
        : kleur ? { fill: 'none', stroke: KLEUR[kleur], 'stroke-width': w * 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
          : { fill: KLEUR[s], stroke: INKT, 'stroke-width': w, 'stroke-linejoin': 'round' };
      if (Array.isArray(vorm)) el('circle', Object.assign({ cx: vorm[0], cy: vorm[1], r: vorm[2] }, attrs), g);
      else el('path', Object.assign({ d: vorm }, attrs), g);
    });
    return g;
  }
  // een steen van boven gezien
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function steen(ouder, x, y, s, v, eenvoudig) {
    el('rect', { x: f(x - s / 2), y: f(y - s / 2), width: s, height: s, rx: (s * 0.2).toFixed(1), fill: '#FBF6E8', stroke: INKT, 'stroke-width': (s * 0.075).toFixed(2) }, ouder);
    if (eenvoudig) return;
    const d = s * 0.27, r = s * 0.1;
    PIPS[v].forEach((p) => el('circle', { cx: f(x + ((p % 3) - 1) * d), cy: f(y + (Math.floor(p / 3) - 1) * d), r: r.toFixed(2), fill: INKT }, ouder));
  }

  // ============================================================
  // HET PRENTBORD (viewBox 720 x 720; met de regels eronder 720 x 860)
  // ============================================================
  const pt = (a, r) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  function veldPlek(i) {
    let k = i;
    for (let r = 0; r < RINGEN.length; r++) {
      const R = RINGEN[r];
      if (k < R.n) {
        const stap = 2 * Math.PI / R.n, a0 = -Math.PI / 2 - stap / 2 + k * stap;
        return { a0, a1: a0 + stap, r0: R.r0, r1: R.r1 };
      }
      k -= R.n;
    }
    return null;
  }
  // de zes gelijke worpen: drie zessen bovenaan, dan rechtsom 1-1-1 tot 5-5-5
  const drieHoek = (v) => -Math.PI / 2 + (v % 6) * Math.PI / 3;
  const driePlek = (v) => ({ a0: drieHoek(v) - Math.PI / 6, a1: drieHoek(v) + Math.PI / 6, r0: DRIE[0], r1: DRIE[1] });
  function sectorPad(p) {
    const [x0, y0] = pt(p.a0, p.r1), [x1, y1] = pt(p.a1, p.r1), [x2, y2] = pt(p.a1, p.r0), [x3, y3] = pt(p.a0, p.r0);
    return `M${f(x0)} ${f(y0)} A${p.r1} ${p.r1} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${p.r0} ${p.r0} 0 0 0 ${f(x3)} ${f(y3)} Z`;
  }
  const middenVan = (p) => pt((p.a0 + p.a1) / 2, (p.r0 + p.r1) / 2);
  const WAS = { trek: '#EBD79E', betaal: '#E8C2B4', niets: '#C6D3E2' };
  const LABEL = { trek: '#2E5A2A', betaal: '#8E2A1E', niets: '#4A4038' };
  const labelTekst = (e) => (e.soort === 'niets' ? 'Niets' : `${e.soort === 'trek' ? 'T' : 'B'} ${e.n}`);

  let papierUrl = null;
  function papier() {
    if (papierUrl !== null) return papierUrl;
    papierUrl = '';
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 360;
      const g = c.getContext('2d');
      const d = g.createImageData(360, 360);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = (Math.random() - 0.5) * 40;
        d.data[i] = 120 + v; d.data[i + 1] = 92 + v; d.data[i + 2] = 52 + v; d.data[i + 3] = 26;
      }
      g.putImageData(d, 0, 0);
      g.strokeStyle = 'rgba(120,92,52,.18)';
      for (let i = 0; i < 70; i++) {
        g.lineWidth = 0.5 + Math.random();
        g.beginPath();
        const x = Math.random() * 360, y = Math.random() * 360;
        g.moveTo(x, y); g.quadraticCurveTo(x + 8 - Math.random() * 16, y + 8, x + 20 - Math.random() * 40, y + 14 - Math.random() * 28);
        g.stroke();
      }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(140,100,50,.16)'; g.beginPath(); g.arc(Math.random() * 360, Math.random() * 360, 2 + Math.random() * 9, 0, 7); g.fill(); }
      papierUrl = c.toDataURL('image/png');
    } catch (e) { papierUrl = ''; }
    return papierUrl;
  }

  // de uil op zijn stok, van voren: een ransuil met oorpluimen en oranje ogen
  function tekenUil(ouder, x, y, s, eenvoudig) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, ouder);
    const uil = el('g', { class: 'ul-uil' }, g);
    el('path', { d: 'M-52 50 C-22 45 22 45 52 50 L51 56 C22 51 -22 51 -51 56 Z', fill: '#7A5230', stroke: INKT, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, uil);
    el('path', { d: 'M-40 51 l-4 6 M32 49 l5 7', stroke: INKT, 'stroke-width': 1.2, fill: 'none' }, uil);
    const vl = el('g', { class: 'ul-vleugel ul-vleugel-l' }, uil);
    el('path', { d: 'M-26 -12 C-41 2 -41 30 -24 47 C-25 28 -24 10 -18 -4 Z', fill: '#8E5E30', stroke: INKT, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, vl);
    const vr = el('g', { class: 'ul-vleugel ul-vleugel-r' }, uil);
    el('path', { d: 'M26 -12 C41 2 41 30 24 47 C25 28 24 10 18 -4 Z', fill: '#8E5E30', stroke: INKT, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, vr);
    el('path', { d: 'M-27 -12 C-29 -40 -17 -52 0 -52 C17 -52 29 -40 27 -12 C33 16 23 44 0 50 C-23 44 -33 16 -27 -12 Z', fill: '#B07A43', stroke: INKT, 'stroke-width': 1.8 }, uil);
    el('path', { d: 'M-16 -2 C-18 20 -10 38 0 42 C10 38 18 20 16 -2 C10 -8 -10 -8 -16 -2 Z', fill: '#E8CFA0', stroke: INKT, 'stroke-width': 1 }, uil);
    if (!eenvoudig) {
      el('path', { d: 'M-8 4 v6 M0 2 v7 M8 4 v6 M-11 14 v6 M-3 13 v7 M5 13 v7 M12 15 v5 M-8 25 v6 M0 24 v7 M8 25 v6 M-4 34 v4 M4 34 v4', stroke: '#6A4420', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, uil);
      el('path', { d: 'M-31 6 l4 3 l3 -4 M-32 16 l4 3 l3 -4 M-31 26 l4 3 l3 -4 M31 6 l-4 3 l-3 -4 M32 16 l-4 3 l-3 -4 M31 26 l-4 3 l-3 -4', fill: 'none', stroke: '#5A3A1A', 'stroke-width': 1.1 }, uil);
    }
    el('path', { d: 'M-17 -45 L-27 -70 L-8 -50 Z', fill: '#8E5E30', stroke: INKT, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, uil);
    el('path', { d: 'M17 -45 L27 -70 L8 -50 Z', fill: '#8E5E30', stroke: INKT, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, uil);
    el('path', { d: 'M-26 -30 C-26 -45 -4 -47 0 -35 C4 -47 26 -45 26 -30 C26 -14 4 -12 0 -18 C-4 -12 -26 -14 -26 -30 Z', fill: '#EAD3A6', stroke: INKT, 'stroke-width': 1.5 }, uil);
    [-12, 12].forEach((ox) => {
      el('circle', { cx: ox, cy: -30, r: 8.2, fill: '#F0A830', stroke: INKT, 'stroke-width': 1.4, class: 'ul-oog' }, uil);
      el('circle', { cx: ox, cy: -30, r: 4.2, fill: '#1A120C' }, uil);
      el('circle', { cx: ox - 1.8, cy: -32, r: 1.5, fill: '#fff', opacity: 0.85 }, uil);
      if (!eenvoudig) el('ellipse', { cx: ox, cy: -30, rx: 9, ry: 9, fill: '#B07A43', stroke: INKT, 'stroke-width': 1.2, class: 'ul-ooglid' }, uil);
    });
    el('path', { d: 'M-3.4 -24 L0 -13 L3.4 -24 Z', fill: '#4A3A2A', stroke: INKT, 'stroke-width': 1 }, uil);
    el('path', { d: 'M-12 45 l-3 7 M-9 45 l0 8 M-6 45 l3 7 M6 45 l-3 7 M9 45 l0 8 M12 45 l3 7', stroke: '#4A3A2A', 'stroke-width': 2, 'stroke-linecap': 'round' }, uil);
    return uil;
  }

  // de kaars in de hoek rechtsonder: met acht ringen, één per ronde; hij brandt op tijdens het spel
  const KAARS = { x: 656, voet: 694, ring: 8, stomp: 10 };
  function tekenKaars(ouder, sfx) {
    const g = el('g', { class: 'ul-kaars' }, ouder);
    plaatje('bril', g, 604, 690, 1.9, 0.9);
    el('ellipse', { cx: KAARS.x + 2, cy: KAARS.voet + 9, rx: 34, ry: 5, fill: '#2A1A0C', opacity: 0.25 }, g);
    el('path', { d: `M${KAARS.x - 30} ${KAARS.voet + 2} Q${KAARS.x} ${KAARS.voet + 12} ${KAARS.x + 30} ${KAARS.voet + 2} L${KAARS.x + 26} ${KAARS.voet - 3} Q${KAARS.x} ${KAARS.voet + 5} ${KAARS.x - 26} ${KAARS.voet - 3} Z`, fill: '#E6B53F', stroke: INKT, 'stroke-width': 1.3 }, g);
    el('circle', { cx: KAARS.x + 35, cy: KAARS.voet - 2, r: 5, fill: 'none', stroke: INKT, 'stroke-width': 1.6 }, g);
    const lijf = el('rect', { x: KAARS.x - 8, width: 16, fill: '#F7EFDD', stroke: INKT, 'stroke-width': 1.3, class: 'ul-kaarslijf' }, g);
    const ringen = el('g', {}, g);
    const vlam = el('g', { class: 'ul-vlam' }, g);
    el('ellipse', { cx: 0, cy: -8, rx: 13, ry: 16, fill: `url(#ul-gloed${sfx})` }, vlam);
    el('path', { d: 'M0 -3 V2', stroke: INKT, 'stroke-width': 1.2 }, vlam);
    const binnen = el('g', { class: 'ul-vlam-binnen' }, vlam);
    el('path', { d: 'M0 -18 C4 -12 4.4 -6 0 -3 C-4.4 -6 -4 -12 0 -18 Z', fill: '#F2C14E', stroke: INKT, 'stroke-width': 1 }, binnen);
    el('path', { d: 'M0 -12 C1.6 -9 1.6 -6.6 0 -5.4 C-1.6 -6.6 -1.6 -9 0 -12 Z', fill: '#FFF4CC' }, binnen);
    const k = { lijf, ringen, vlam };
    zetKaars(k, RONDES);
    return k;
  }
  function zetKaars(k, over) {
    if (!k) return;
    const h = KAARS.stomp + Math.max(0, over) * KAARS.ring, top = KAARS.voet - 3 - h;
    k.lijf.setAttribute('y', f(top)); k.lijf.setAttribute('height', f(h));
    k.ringen.textContent = '';
    for (let i = 1; i <= over; i++) el('path', { d: `M${KAARS.x - 8} ${f(KAARS.voet - 3 - KAARS.stomp - (i - 1) * KAARS.ring)} h16`, stroke: '#B89A6A', 'stroke-width': 1 }, k.ringen);
    k.vlam.setAttribute('transform', `translate(${KAARS.x} ${f(top)})`);
    k.vlam.style.display = over > 0 ? '' : 'none';
  }

  function tekenBord(sfx, eenvoudig, metRegels) {
    const H = metRegels ? 860 : 720;
    const svg = el('svg', { viewBox: `0 0 720 ${H}`, class: 'ul-prent', role: 'img', 'aria-label': 'Het uilenspel: een rond bord met vijftig vakken en in het midden een uil voor een spiegel' });
    const defs = el('defs', {}, svg);
    const vg = el('radialGradient', { id: 'ul-vignet' + sfx, cx: '50%', cy: '50%', r: '72%' }, defs);
    el('stop', { offset: '.58', 'stop-color': '#7A5A2A', 'stop-opacity': 0 }, vg);
    el('stop', { offset: '1', 'stop-color': '#6A4A1E', 'stop-opacity': 0.32 }, vg);
    const glas = el('radialGradient', { id: 'ul-glas' + sfx, cx: '38%', cy: '32%', r: '80%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#F4F7F6' }, glas);
    el('stop', { offset: '.45', 'stop-color': '#B8C6CC' }, glas);
    el('stop', { offset: '1', 'stop-color': '#5E707A' }, glas);
    const gl = el('radialGradient', { id: 'ul-gloed' + sfx }, defs);
    el('stop', { offset: '0', 'stop-color': '#FFE7A0', 'stop-opacity': 0.75 }, gl);
    el('stop', { offset: '1', 'stop-color': '#FFE7A0', 'stop-opacity': 0 }, gl);
    const hart = el('radialGradient', { id: 'ul-hart' + sfx, cx: '50%', cy: '45%', r: '60%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#F3E2B6' }, hart);
    el('stop', { offset: '1', 'stop-color': '#DCC08A' }, hart);
    const clip = el('clipPath', { id: 'ul-spiegelclip' + sfx }, defs);
    el('circle', { cx: C, cy: 330, r: 58 }, clip);

    el('rect', { width: 720, height: H, fill: '#EFE2C0' }, svg);
    const pap = !eenvoudig && papier();
    if (pap) el('image', { href: pap, width: 720, height: H, preserveAspectRatio: 'none', 'pointer-events': 'none' }, svg);
    el('rect', { width: 720, height: H, fill: `url(#ul-vignet${sfx})` }, svg);
    el('rect', { x: 5, y: 5, width: 710, height: H - 10, fill: 'none', stroke: INKT, 'stroke-width': 3 }, svg);
    el('rect', { x: 11, y: 11, width: 698, height: H - 22, fill: 'none', stroke: INKT, 'stroke-width': 1 }, svg);

    // ---------- de hoeken: roken, drinken, dobbelen, en de kaars met de bril ----------
    const hoek = el('g', {}, svg);
    plaatje('pijp', hoek, 66, 70, 3.1, 0.75);
    [[38, 30], [52, 22], [44, 14]].forEach(([x, y], i) => el('circle', { cx: x + 52, cy: y, r: 3 + i, fill: 'none', stroke: INKT, 'stroke-width': 0.9, opacity: 0.7 }, hoek));
    plaatje('roemer', hoek, 630, 62, 2.4, 0.8);
    plaatje('kan', hoek, 676, 74, 2.3, 0.8);
    // de beker met drie stenen
    const beker = el('g', { transform: 'translate(54 648) rotate(-18)' }, hoek);
    el('path', { d: 'M-18 -26 H18 L13 24 Q0 29 -13 24 Z', fill: '#7A4424', stroke: INKT, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, beker);
    el('path', { d: 'M-16.4 -14 H16.4 M-14.4 12 H14.4', stroke: '#D9A64A', 'stroke-width': 2.6 }, beker);
    el('ellipse', { cx: 0, cy: -26, rx: 18, ry: 5, fill: '#3A1E0C', stroke: INKT, 'stroke-width': 1.6 }, beker);
    [[86, 676, 6], [104, 664, 3], [98, 690, 5]].forEach(([x, y, v]) => steen(hoek, x, y, 16, v, eenvoudig));
    const kaars = eenvoudig ? null : tekenKaars(svg, sfx);
    if (eenvoudig) { plaatje('kaars', hoek, 656, 652, 2.8, 0.8); plaatje('bril', hoek, 604, 690, 1.9, 0.9); }

    // ---------- de band met de titel en de spreuk ----------
    const band = el('g', {}, svg);
    el('circle', { cx: C, cy: C, r: 344, fill: '#F3E8CC', stroke: INKT, 'stroke-width': 2.2 }, band);
    el('circle', { cx: C, cy: C, r: 327, fill: 'none', stroke: INKT, 'stroke-width': 1.4 }, band);
    if (!eenvoudig) {
      el('path', { id: 'ul-boog-boven' + sfx, d: `M${C - 331} ${C} A331 331 0 0 1 ${C + 331} ${C}`, fill: 'none' }, defs);
      el('path', { id: 'ul-boog-onder' + sfx, d: `M${C - 340} ${C} A340 340 0 0 0 ${C + 340} ${C}`, fill: 'none' }, defs);
      const t1 = el('text', { 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 15.5, fill: INKT, 'letter-spacing': 2.2 }, band);
      const p1 = el('textPath', { href: `#ul-boog-boven${sfx}`, startOffset: '50%', 'text-anchor': 'middle' }, t1); p1.textContent = 'Het nieuwe tydkortige Uylenspel';
      const t2 = el('text', { 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-size': 14.5, fill: INKT, 'letter-spacing': 1.2 }, band);
      const p2 = el('textPath', { href: `#ul-boog-onder${sfx}`, startOffset: '50%', 'text-anchor': 'middle' }, t2); p2.textContent = 'Wat baet kaers en bril, als den uyl niet sien wil';
      [Math.PI * 0.03, Math.PI * 0.97, -Math.PI * 0.03, -Math.PI * 0.97].forEach((a) => { const [x, y] = pt(a, 335.5); el('circle', { cx: f(x), cy: f(y), r: 3, fill: INKT }, band); });
    }

    // ---------- de vakken ----------
    const velden = el('g', {}, svg);
    VELDEN.forEach((w, i) => {
      const p = veldPlek(i), e = effectVan(w), d = sectorPad(p);
      el('path', { d, fill: WAS[e.soort], opacity: 0.92, transform: 'translate(1.6 1.2)' }, velden);
      el('path', { d, fill: 'none', stroke: INKT, 'stroke-width': 1.25, 'stroke-linejoin': 'round' }, velden);
      const [mx, my] = middenVan(p);
      [-14.5, 0, 14.5].forEach((dx, k) => steen(velden, mx + dx, my - 17, 12.5, w[k], eenvoudig));
      if (!eenvoudig) plaatje(PLAATJE[i], velden, mx, my + 1.5, 0.84);
      tekst(labelTekst(e), { x: f(mx), y: f(my + 23), 'text-anchor': 'middle', 'font-family': 'IM Fell English, Georgia, serif', 'font-size': e.soort === 'niets' ? 11.5 : 13, 'font-style': e.soort === 'niets' ? 'italic' : 'normal', fill: LABEL[e.soort] }, velden);
    });
    RINGEN.forEach((R) => el('circle', { cx: C, cy: C, r: R.r0, fill: 'none', stroke: INKT, 'stroke-width': 2 }, velden));

    // ---------- de zes gelijke worpen ----------
    const drie = el('g', {}, svg);
    for (let v = 1; v <= 6; v++) {
      const p = driePlek(v), d = sectorPad(p);
      el('path', { d, fill: v === 6 ? '#F2CF6E' : '#D9CBE2', opacity: 0.95, transform: 'translate(1.6 1.2)' }, drie);
      el('path', { d, fill: 'none', stroke: INKT, 'stroke-width': 1.4 }, drie);
      const [mx, my] = middenVan(p);
      [-13.5, 0, 13.5].forEach((dx) => steen(drie, mx + dx, my - 6, 11.5, v, eenvoudig));
      tekst(v === 6 ? 'Alles' : 'Helft', { x: f(mx), y: f(my + 15), 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': v === 6 ? 13.5 : 12, fill: v === 6 ? '#6A3E0C' : '#3C2E4A' }, drie);
    }
    el('circle', { cx: C, cy: C, r: DRIE[0], fill: 'none', stroke: INKT, 'stroke-width': 2.2 }, drie);

    // ---------- het midden: een uil voor een spiegel ----------
    const mid = el('g', {}, svg);
    el('circle', { cx: C, cy: C, r: DRIE[0] - 2, fill: `url(#ul-hart${sfx})` }, mid);
    el('circle', { cx: C, cy: C, r: DRIE[0] - 7, fill: 'none', stroke: INKT, 'stroke-width': 0.8, 'stroke-dasharray': '2 4' }, mid);
    el('circle', { cx: C, cy: 330, r: 69, fill: '#2E2018', stroke: INKT, 'stroke-width': 1.5 }, mid);
    if (!eenvoudig) for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; el('circle', { cx: f(C + 64.5 * Math.cos(a)), cy: f(330 + 64.5 * Math.sin(a)), r: 1.7, fill: '#C9973F' }, mid); }
    el('circle', { cx: C, cy: 330, r: 58, fill: `url(#ul-glas${sfx})`, stroke: '#C9973F', 'stroke-width': 2 }, mid);
    if (!eenvoudig) {
      // in de bolle spiegel: klein de achterkant van de uil
      const weer = el('g', { 'clip-path': `url(#ul-spiegelclip${sfx})`, opacity: 0.32 }, mid);
      el('path', { d: 'M332 318 C330 300 352 296 356 312 C362 330 360 356 346 362 C334 360 330 340 332 318 Z', fill: '#4A3A2A' }, weer);
      el('path', { d: 'M336 304 L332 292 L342 301 M350 300 L356 290 L353 304', fill: '#4A3A2A', stroke: '#4A3A2A', 'stroke-width': 1.5 }, weer);
      el('path', { d: 'M316 316 C322 296 340 284 360 282', fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.6, 'clip-path': `url(#ul-spiegelclip${sfx})` }, mid);
    }
    const uil = tekenUil(mid, C, 372, 1.02, eenvoudig);

    // ---------- de regels eronder, in twee kolommen (voor de prent aan de muur) ----------
    if (metRegels) {
      const r = el('g', {}, svg);
      tekst('Regelen van het Uylenspel', { x: C, y: 748, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': 24, fill: INKT }, r);
      el('path', { d: 'M150 758 H570', stroke: INKT, 'stroke-width': 1.2 }, r);
      el('path', { d: `M${C} 770 V846`, stroke: INKT, 'stroke-width': 1 }, r);
      let z = 11;
      const rnd = () => { z = (z * 16807) % 2147483647; return (z - 1) / 2147483646; };
      [[44, 336], [384, 676]].forEach(([x0, x1]) => {
        for (let y = 776; y < 846; y += 9) {
          let x = x0;
          while (x < x1 - 10) { const b = Math.min(x1 - x, 14 + rnd() * 36); el('rect', { x: f(x), y, width: f(b), height: 3.4, fill: INKT, opacity: 0.55 }, r); x += b + 6; }
        }
      });
    }
    svg.ul = { kaars, uil };
    return svg;
  }

  // ============================================================
  // TOESTAND
  // ============================================================
  const ZEGT = {
    start: ['Wie durft?', 'Inleggen maar!', 'Daar gaan we!'], betaal: ['Au!', 'Daar gaat het.', 'Zuur!', 'Ach.'], trek: ['Kassa!', 'Mooi zo!', 'Lekker!'],
    leeg: ['De pot is leeg!'], niets: ['Hm.', 'Niks.', 'Pff.'], uil: ['Oehoe!', 'De uil!'], helft: ['De helft!', 'Joepie!'],
    bijna: ['Bijna de uil!'], blut: ['Ik ben blut...', 'Op is op.'], wint: ['Hoera, gewonnen!'], verliest: ['Goed gespeeld!', 'Gefeliciteerd!']
  };
  const EIGEN = {
    opoe: { trek: ['Voor de spaarpot.', 'Kijk eens aan!'], betaal: ['Foei, foei.'], uil: ['Wat een uil!'], wint: ['Opoe kan het nog!'] },
    kees: { trek: ['Gemalen!'], betaal: ['Tol betalen.'], niets: ['Windstil.'], wint: ['Gemalen en gewonnen!'] },
    burgemeester: { betaal: ['Dat gaat van de belasting af.'], uil: ['Zoals verwacht.'], wint: ['Uiteraard.'] },
    jantje: { uil: ['Joepie, de uil!'], trek: ['Ik ben rijk!'], betaal: ['Neeee!'] },
    grietje: { niets: ['Jammer.'], trek: ['Hihi!'], uil: ['Oehoe!'] }
  };
  const VRIENDEN = [{ id: 'vriend1', naam: 'Vriend' }, { id: 'vriend2', naam: 'Vriendin' }];
  const KEUZE = ['opoe', 'kees', 'burgemeester', 'grietje', 'jantje'];

  let podium, ui = {}, bordSvg, laag, gebouwd = false;
  let spelers = [], aan = 0, fase = 'klaar', spelId = 0, pot = 0, potGetoond = 0, ronde = 0, keuze = ['opoe', 'kees', 'burgemeester'];
  let vasteWorp = null, uilGegooid = false;
  const rustig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wacht = (ms) => new Promise((res) => setTimeout(res, rustig() ? Math.min(ms, 40) : ms));
  const willekeurig = (l) => l[Math.floor(Math.random() * l.length)];
  const html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const gezichten = () => (window.Personen ? Personen.gezicht : {});
  const naamVan = (id) => (window.Personen && Personen.namen[id]) || (VRIENDEN.find((v) => v.id === id) || {}).naam || id;
  const MUNT = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><use href="#ul-penning" x="-12" y="-12" width="24" height="24"/></svg>';
  const pionSvgHtml = (kleur) => `<svg viewBox="-20 -44 40 50" aria-hidden="true"><ellipse cx="2" cy="2" rx="13" ry="4.5" fill="rgba(0,0,0,.3)"/><path d="M-11 0 C-11 -4 -7 -6 -5 -8 L-3 -18 C-7 -20 -7 -27 0 -28 C7 -27 7 -20 3 -18 L5 -8 C7 -6 11 -4 11 0 Z" fill="${kleur}" stroke="${INKT}" stroke-width="1.4"/><circle cx="0" cy="-31" r="7.5" fill="${kleur}" stroke="${INKT}" stroke-width="1.4"/><ellipse cx="-2.5" cy="-33.5" rx="2.6" ry="1.8" fill="#fff" opacity=".55"/></svg>`;
  // een stapeltje penningen (voor jezelf onderin)
  const STAPELTJE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#3A2A1C"/>' +
    [[22, 44], [40, 46], [31, 36], [24, 28], [40, 30], [32, 20]].map(([x, y]) => `<g transform="translate(${x} ${y}) scale(.8)"><use href="#ul-penning" x="-12" y="-12" width="24" height="24"/></g>`).join('') + '</svg>';

  // ============================================================
  // OPBOUW
  // ============================================================
  function bouw() {
    podium = document.getElementById('ul-podium');
    podium.innerHTML = '';
    const sprite = html(`<svg class="mo-defs" aria-hidden="true" focusable="false"><defs>
      <radialGradient id="ul-koper" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F4C891"/><stop offset=".55" stop-color="#C47A3A"/><stop offset="1" stop-color="#7A4218"/></radialGradient>
      <symbol id="ul-penning" viewBox="-12 -12 24 24">
        <circle r="11.4" fill="#5E3414"/><circle r="10.6" fill="url(#ul-koper)"/>
        <circle r="7.8" fill="none" stroke="#7A4218" stroke-width="1" opacity=".8"/>
        <path d="M-3.4 -0.8 C-3.4 -4.4 3.4 -4.4 3.4 -0.8 L3.4 2.6 C3.4 4.8 -3.4 4.8 -3.4 2.6 Z M-3.2 -2.6 L-4.4 -5.6 L-1.6 -3.8 M3.2 -2.6 L4.4 -5.6 L1.6 -3.8" fill="none" stroke="#6A3A16" stroke-width="1"/>
        <circle cx="-1.4" cy="-1.2" r=".95" fill="#6A3A16"/><circle cx="1.4" cy="-1.2" r=".95" fill="#6A3A16"/>
        <ellipse cx="-4" cy="-5" rx="3.6" ry="1.6" fill="#fff" opacity=".42" transform="rotate(-30 -4 -5)"/>
      </symbol>
    </defs></svg>`);
    const boven = html(`<div class="mo-rij mo-boven gb-boven">
      <a class="mo-knop" href="#" aria-label="Naar het huis" title="Naar het huis">${icoon('huis')}</a>
      <div class="gb-spelers" role="list" aria-label="Spelers"></div>
      <button class="mo-knop ul-vraag" type="button" aria-label="Gijs laat zien hoe het werkt" title="Hoe werkt het?">${icoon('vraag')}</button>
      <button class="mo-knop ul-meer" type="button" aria-label="Kies met wie je speelt" title="Kies met wie je speelt" aria-haspopup="dialog">${icoon('menu')}</button>
    </div>`);
    const midden = html(`<div class="mo-midden"><div class="mo-bordvak ul-bordvak">
      <div class="gb-dobbels" aria-hidden="true"></div>
      <div class="gb-kaartje ul-kaartje" aria-hidden="true" hidden><span class="ul-kaartje-worp"></span><span class="gb-kaartje-beeld"></span><b class="gb-kaartje-titel"></b><span class="gb-kaartje-sub"></span></div>
      <div class="mo-vonken" aria-hidden="true"></div>
    </div></div>`);
    const onder = html(`<div class="mo-rij mo-onder gb-onder">
      <div class="mo-kaart gb-zelf ul-zelf">
        <span class="mo-gezicht ul-zelf-beeld">${STAPELTJE}</span>
        <span class="mo-info"><span class="mo-naam">Jij</span><span class="ul-geld ul-zelf-geld">${MUNT}<b>0</b></span></span>
        <span class="mo-doe"></span>
        <span class="mo-ballon" hidden></span>
      </div>
      <button class="gb-beker" type="button" aria-label="Schud de beker en gooi" title="Gooi">
        <svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="19" ry="4" fill="rgba(0,0,0,.35)"/><path d="M13 13 L51 13 L45.5 55 Q32 59.5 18.5 55 Z" fill="#7A4424" stroke="#2A160A" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 22 H48 M18 46 H46" stroke="#D9A64A" stroke-width="3"/><path d="M20 14 L24 54" stroke="#fff" stroke-opacity=".16" stroke-width="4"/><ellipse cx="32" cy="13" rx="19" ry="5.5" fill="#3A1E0C" stroke="#2A160A" stroke-width="2.2"/></svg>
        <span class="gb-beker-tekst">Gooi</span>
      </button>
    </div>`);
    const menu = html(`<div class="mo-menu gb-menu" role="dialog" aria-modal="true" aria-label="Met wie speel je?" hidden>
      <div class="mo-menu-kaart">
        <div class="mo-menu-kop"><span class="mo-menu-titel">Wie spelen er mee?</span><button class="mo-knop mo-menu-sluit" type="button" aria-label="Sluiten">${icoon('sluit')}</button></div>
        <div class="gb-keuzes"></div>
        <button class="knop gb-spelen" type="button">${icoon('pijl')}<span>Spelen!</span></button>
        <div class="mo-menu-voet">
          <button class="mo-knop mo-geluid" type="button" aria-pressed="true" aria-label="Geluid" title="Geluid">${icoon('geluid')}<i class="streep"></i></button>
          <button class="mo-knop mo-muziek" type="button" aria-pressed="false" aria-label="Muziek" title="Muziek">${icoon('muziek')}<i class="streep"></i></button>
        </div>
      </div>
    </div>`);
    const vlucht = html('<div class="ul-vlucht" aria-hidden="true"></div>');
    const meld = html('<p class="sr-only" aria-live="polite"></p>');
    [sprite, boven, midden, onder, menu, vlucht, meld].forEach((e) => podium.appendChild(e));
    ui = {
      spelers: boven.querySelector('.gb-spelers'), midden, bordvak: midden.querySelector('.ul-bordvak'),
      dobbels: midden.querySelector('.gb-dobbels'), kaartje: midden.querySelector('.ul-kaartje'), vonken: midden.querySelector('.mo-vonken'),
      zelf: onder.querySelector('.ul-zelf'), zelfGeld: onder.querySelector('.ul-zelf-geld'), beker: onder.querySelector('.gb-beker'),
      menu, meld, vlucht, keuzes: menu.querySelector('.gb-keuzes')
    };
    bordSvg = tekenBord('g', false, false);
    ui.bordvak.insertBefore(bordSvg, ui.bordvak.firstChild);
    ui.kaars = bordSvg.ul.kaars; ui.uil = bordSvg.ul.uil;
    // de laag boven het bord: het oplichtende vak en de pot
    laag = el('svg', { viewBox: '0 0 720 720', class: 'ul-laag', 'aria-hidden': 'true' });
    ui.gloed = el('path', { class: 'ul-gloed', d: '' }, laag);
    ui.pot = el('g', { class: 'ul-pot' }, laag);
    ui.potTal = el('g', { class: 'ul-pot-tal' }, laag);
    el('circle', { cx: 0, cy: 0, r: 15 }, ui.potTal);
    ui.potTekst = tekst('0', { x: 0, y: 6, 'text-anchor': 'middle' }, ui.potTal);
    ui.bordvak.insertBefore(laag, ui.dobbels);
    maakDobbels();

    boven.querySelector('.ul-meer').addEventListener('click', openMenu);
    boven.querySelector('.ul-vraag').addEventListener('click', () => { if (window.Les) Les.toon('uilenspel'); });
    menu.querySelector('.mo-menu-sluit').addEventListener('click', sluitMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) sluitMenu(); });
    menu.querySelector('.gb-spelen').addEventListener('click', () => { sluitMenu(); if (window.Duiten) Duiten.zetVeld('uil-spelers', keuze); nieuwSpel(); });
    menu.querySelector('.mo-geluid').addEventListener('click', () => { Geluid.zet(!Geluid.aan); werkSchakelaars(); });
    menu.querySelector('.mo-muziek').addEventListener('click', () => { const k = document.getElementById('knop-muziek'); if (k) k.click(); setTimeout(werkSchakelaars, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menu && !ui.menu.hidden) sluitMenu(); });
    const b = ui.beker;
    b.addEventListener('pointerdown', (e) => { if (!b.disabled) { e.preventDefault(); beginSchudden(); } });
    b.addEventListener('pointerup', () => { if (schudt) gooiMens(); });
    b.addEventListener('pointerleave', () => { if (schudt) gooiMens(); });
    b.addEventListener('pointercancel', () => { if (schudt) gooiMens(); });
    b.addEventListener('click', (e) => { if (e.detail === 0 && !b.disabled) { beginSchudden(); setTimeout(gooiMens, 260); } });

    if ('ResizeObserver' in window) new ResizeObserver(pasMaatAan).observe(ui.midden);
    window.addEventListener('resize', pasMaatAan);
    gebouwd = true;
  }

  function pasMaatAan() {
    if (!ui.midden) return;
    const rr = ui.midden.getBoundingClientRect();
    if (!rr.width || !rr.height) return;
    // liggend op een telefoon: de kolommen links en rechts geven ruimte af (tot 150 px), zodat het bord past
    const liggend = window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches;
    const breed = liggend ? podium.clientWidth - 2 * 150 - 44 : rr.width - 12;
    const maat = Math.floor(Math.min(breed, rr.height - 10, 780));
    podium.style.setProperty('--bord', Math.max(liggend ? 180 : 260, maat) + 'px');
  }

  // ============================================================
  // DOBBELSTENEN: drie kubusjes die over het bord tuimelen
  // ============================================================
  const DRAAI = { 1: [0, 0], 2: [90, 0], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 6: [0, 180] };
  function maakDobbels() {
    ui.dobbels.innerHTML = '';
    ui.dob = [0, 1, 2].map(() => {
      const d = document.createElement('div');
      d.className = 'gb-dob';
      const k = document.createElement('div');
      k.className = 'gb-kubus';
      for (let v = 1; v <= 6; v++) {
        const z = document.createElement('i');
        z.className = 'gb-zijde z' + v;
        z.innerHTML = Array.from({ length: 9 }, (_, i) => (PIPS[v].includes(i) ? '<b></b>' : '<span></span>')).join('');
        k.appendChild(z);
      }
      d.appendChild(k);
      ui.dobbels.appendChild(d);
      return d;
    });
    kleurDobbels();
  }
  function kleurDobbels() {
    const st = window.Pronk ? Pronk.stijl('dobbels') : null;
    if (!st || !ui.dobbels) return;
    ui.dobbels.style.setProperty('--dob-a', st.a); ui.dobbels.style.setProperty('--dob-b', st.b);
    ui.dobbels.style.setProperty('--dob-c', st.c); ui.dobbels.style.setProperty('--dob-pip', st.pip);
  }
  if (window.Pronk) Pronk.opWijziging(kleurDobbels);

  function tuimel(w, vanBoven) {
    const W = ui.bordvak.clientWidth || 360;
    const maat = Math.round(W * 0.12);
    ui.dobbels.style.setProperty('--d', maat + 'px');
    ui.dobbels.classList.add('zichtbaar');
    ui.dobbels.getAnimations && ui.dobbels.getAnimations().forEach((x) => x.cancel());
    ui.dobbels.style.opacity = 1;
    const duur = rustig() ? 1 : 1050;
    const doelen = [[0.36, 0.56], [0.5, 0.49], [0.64, 0.57]].map(([x, y]) => [W * (x + (Math.random() - 0.5) * 0.05), W * (y + (Math.random() - 0.5) * 0.06)]);
    w.forEach((v, i) => {
      const d = ui.dob[i], k = d.firstChild;
      const [ex, ey] = doelen[i];
      const sx = W * (0.34 + i * 0.16), sy = vanBoven ? -maat * 1.6 : W + maat * 0.6;
      const mx = (sx + ex) / 2 + (i - 1) * 30, my = (sy + ey) / 2;
      const pos = (x, y, sch) => `translate3d(${(x - maat / 2).toFixed(1)}px, ${(y - maat / 2).toFixed(1)}px, 0) scale(${sch})`;
      if (rustig() || !d.animate) {
        d.style.transform = pos(ex, ey, 1);
        k.style.transform = `rotateX(-24deg) rotateY(26deg) rotateX(${DRAAI[v][0]}deg) rotateY(${DRAAI[v][1]}deg)`;
        return;
      }
      d.animate([
        { transform: pos(sx, sy, 1.5), opacity: 0.2 },
        { transform: pos(mx, my, 1.25), opacity: 1, offset: 0.3 },
        { transform: pos(ex + (i - 1) * 14, ey - 4, 1), offset: 0.55 },
        { transform: pos(ex + (i - 1) * 5, ey - 14, 1.06), offset: 0.72 },
        { transform: pos(ex, ey, 1), offset: 0.88 },
        { transform: pos(ex, ey, 1) }
      ], { duration: duur, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'forwards' });
      const [rx, ry] = DRAAI[v];
      const extraX = 720 + 360 * Math.floor(Math.random() * 2), extraY = 360 + 360 * Math.floor(Math.random() * 2);
      k.animate([
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + extraX}deg) rotateY(${ry + extraY}deg) rotateZ(${(Math.random() * 180).toFixed(0)}deg)` },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx + 60}deg) rotateY(${ry - 30}deg) rotateZ(10deg)`, offset: 0.6 },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(0deg)`, offset: 0.86 },
        { transform: `rotateX(-24deg) rotateY(26deg) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(0deg)` }
      ], { duration: duur, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'forwards' });
    });
    Geluid.dobbel();
    if (window.Tril) { setTimeout(() => Tril.tik(), duur * 0.55); setTimeout(() => Tril.tik(), duur * 0.8); }
    setTimeout(() => { if (Geluid.hout) Geluid.hout(0.25); }, duur * 0.55);
    return wacht(duur * 0.85);
  }
  function stenenWeg() {
    if (!ui.dobbels.classList.contains('zichtbaar')) return;
    const a = ui.dobbels.animate ? ui.dobbels.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }) : null;
    const klaar = () => { ui.dobbels.classList.remove('zichtbaar'); ui.dob.forEach((d) => { d.getAnimations && d.getAnimations().forEach((x) => x.cancel()); d.firstChild.getAnimations && d.firstChild.getAnimations().forEach((x) => x.cancel()); }); };
    if (a) a.onfinish = klaar; else klaar();
  }

  // ============================================================
  // DE POT EN DE PENNINGEN
  // ============================================================
  // vaste plekken voor de penningen op de stapel bij de voeten van de uil: eerst in het midden, dan breder en hoger
  const STAPEL = (() => {
    const l = [];
    let z = 7;
    const r = () => { z = (z * 16807) % 2147483647; return (z - 1) / 2147483646; };
    for (let i = 0; i < 44; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()), laag2 = Math.floor(i / 11);
      l.push([C + Math.cos(a) * d * (20 + i * 0.9), 446 + Math.sin(a) * d * (6 + i * 0.18) - laag2 * 3.4]);
    }
    return l;
  })();
  const POT_PLEK = [C, 444];
  function tekenPot(n) {
    potGetoond = Math.max(0, n);
    ui.pot.textContent = '';
    const zicht = Math.min(potGetoond, STAPEL.length);
    for (let i = 0; i < zicht; i++) {
      const [x, y] = STAPEL[i];
      el('ellipse', { cx: f(x + 1), cy: f(y + 2), rx: 10, ry: 9, fill: '#2A1A0C', opacity: 0.22 }, ui.pot);
      el('use', { href: '#ul-penning', x: f(x - 10), y: f(y - 10), width: 20, height: 20 }, ui.pot);
    }
    ui.potTal.setAttribute('transform', `translate(${C + 62} 452)`);
    ui.potTal.style.display = potGetoond > 0 ? '' : 'none';
    ui.potTekst.textContent = potGetoond;
  }
  function plekOpScherm(x, y) {
    const m = laag.getScreenCTM();
    return m ? { x: m.a * x + m.e, y: m.d * y + m.f } : { x: 0, y: 0 };
  }
  function plekVan(p) {
    if (p === 'pot') return plekOpScherm(POT_PLEK[0], POT_PLEK[1]);
    const doel = p.id === 'jij' ? ui.zelfGeld.querySelector('svg') : (p.chip && p.chip.querySelector('.ul-chip-geld')) || p.chip;
    const r = doel.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function toonGeld(p) {
    if (p.id === 'jij') ui.zelfGeld.querySelector('b').textContent = p.getoond;
    if (p.chip) p.chip.querySelector('.ul-chip-geld b').textContent = p.getoond;
  }
  // penningen vliegen van de een naar de ander; de getallen tellen mee bij elke penning die aankomt
  function vlieg(van, naar, x) {
    if (x <= 0) return Promise.resolve();
    const p = van === 'pot' ? naar : van, naarPot = naar === 'pot';
    // (in stapjes bij wat er al getoond wordt: bij het inleggen vliegen er penningen van iedereen tegelijk)
    let gedaan = 0;
    const zet = (tot) => {
      const stap = tot - gedaan;
      gedaan = tot;
      p.getoond += naarPot ? -stap : stap; toonGeld(p);
      tekenPot(potGetoond + (naarPot ? stap : -stap));
    };
    if (rustig() || !document.body.animate) { zet(x); return Promise.resolve(); }
    const pr = podium.getBoundingClientRect();
    const a = plekVan(van), b = plekVan(naar);
    const zicht = Math.min(x, 12);
    return new Promise((klaar) => {
      let aangekomen = 0;
      for (let k = 0; k < zicht; k++) {
        const m = document.createElement('div');
        m.className = 'ul-munt';
        m.innerHTML = MUNT;
        ui.vlucht.appendChild(m);
        const sx = a.x - pr.left + (Math.random() - 0.5) * 16, sy = a.y - pr.top + (Math.random() - 0.5) * 10;
        const ex = b.x - pr.left + (Math.random() - 0.5) * 10, ey = b.y - pr.top + (Math.random() - 0.5) * 6;
        const hx = sx + (ex - sx) * 0.5 + (Math.random() - 0.5) * 40, hy = Math.min(sy, ey) - 40 - Math.random() * 40;
        const an = m.animate([
          { transform: `translate(${f(sx)}px, ${f(sy)}px) scale(.55)`, opacity: 0 },
          { transform: `translate(${f(sx + (hx - sx) * 0.55)}px, ${f(sy + (hy - sy) * 0.75)}px) scale(1.05)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${f(hx)}px, ${f(hy)}px) scale(1.15)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${f(ex)}px, ${f(ey)}px) scale(.85)`, opacity: 1 }
        ], { duration: 600, delay: k * 85, easing: 'cubic-bezier(.35,.55,.45,1)', fill: 'both' });
        an.onfinish = () => {
          m.remove();
          aangekomen++;
          if (aangekomen % 2 === 1 || aangekomen === zicht) Geluid.penning();
          zet(aangekomen === zicht ? x : Math.round(x * aangekomen / zicht));
          if (aangekomen === zicht) klaar();
        };
      }
    });
  }
  async function betaal(p, n) {
    const x = Math.min(n, p.geld);
    p.geld -= x; pot += x;
    await vlieg(p, 'pot', x);
    if (p.geld === 0) { p.blut = true; werkSpelersBij(); }
    return x;
  }
  async function trek(p, n) {
    const x = Math.min(n, pot);
    p.geld += x; pot -= x;
    await vlieg('pot', p, x);
    return x;
  }
  // iedereen legt in (bij het begin, en als de pot leeg is)
  async function inleggen() {
    const mijnId = spelId;
    meld('Iedereen legt drie penningen in de pot.');
    const wie = spelers.filter((q) => !q.blut);
    await Promise.all(wie.map((q, i) => wacht(i * 140).then(() => (mijnId === spelId ? betaal(q, INLEG) : null))));
  }

  // ============================================================
  // SPELERSKAARTEN, KAARTJES EN HET OPLICHTEN
  // ============================================================
  function maakChips() {
    const g = gezichten();
    ui.spelers.innerHTML = '';
    spelers.forEach((p) => {
      if (p.id === 'jij') return;
      const chip = document.createElement('div');
      chip.className = 'gb-chip ul-chip';
      chip.setAttribute('role', 'listitem');
      chip.style.setProperty('--pion', p.kleur);
      chip.innerHTML = `<span class="gb-chip-gezicht">${p.persoon && g[p.persoon] ? g[p.persoon] : pionSvgHtml(p.kleur)}</span><b class="ul-geld ul-chip-geld">${MUNT}<b>0</b></b><span class="mo-ballon" hidden></span>`;
      p.chip = chip;
      ui.spelers.appendChild(chip);
    });
  }
  function werkSpelersBij() {
    const p = spelers[aan];
    spelers.forEach((q, i) => {
      toonGeld(q);
      if (!q.chip) return;
      q.chip.classList.toggle('aan', i === aan && fase !== 'klaar');
      q.chip.classList.toggle('blut', q.blut);
      q.chip.setAttribute('aria-label', `${q.naam}, ${q.geld} penningen${q.blut ? ', blut' : ''}${i === aan ? ', aan de beurt' : ''}`);
    });
    const ik = spelers[0];
    let doe = '';
    if (fase === 'gooien' && p && p.mens) doe = `${icoon('dobbel')}<span>${p.id === 'jij' ? 'Gooi de stenen!' : p.naam + ' gooit'}</span>`;
    else if (fase !== 'klaar' && p && !p.mens) doe = `<span class="mo-denk" aria-label="${p.naam} is aan de beurt"><i></i><i></i><i></i></span>`;
    else if (ik && ik.blut) doe = '<span>Blut</span>';
    ui.zelf.querySelector('.mo-doe').innerHTML = doe;
    ui.zelf.classList.toggle('aan', fase === 'gooien' && p && p.mens);
    ui.beker.disabled = !(fase === 'gooien' && p && p.mens);
    ui.beker.classList.toggle('klaar', fase === 'gooien' && p && p.mens);
  }
  function zeg(p, soort) {
    if (!p) return;
    const lijst = (p.persoon && EIGEN[p.persoon] && EIGEN[p.persoon][soort]) || ZEGT[soort];
    if (!lijst || p.id === 'jij' || !p.persoon) return;
    const b = p.chip && p.chip.querySelector('.mo-ballon');
    if (!b) return;
    b.textContent = willekeurig(lijst);
    b.hidden = false;
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    clearTimeout(p.zegTimer);
    p.zegTimer = setTimeout(() => { b.hidden = true; }, 2200);
  }
  function meld(t) { if (ui.meld) ui.meld.textContent = t; }

  function markeer(p) {
    if (!ui.gloed) return;
    ui.gloed.setAttribute('d', p ? sectorPad(p) : '');
    ui.gloed.classList.remove('aan'); void ui.gloed.getBoundingClientRect(); if (p) ui.gloed.classList.add('aan');
  }
  // het kaartje: de worp, het plaatje en wat er gebeurt
  async function kaartje(o) {
    const k = ui.kaartje;
    const worp = k.querySelector('.ul-kaartje-worp'), beeld = k.querySelector('.gb-kaartje-beeld');
    worp.innerHTML = ''; beeld.innerHTML = '';
    if (o.w) {
      const sw = el('svg', { viewBox: '0 0 60 20', 'aria-hidden': 'true' });
      o.w.slice().sort((x, y) => x - y).forEach((v, i) => steen(sw, 10 + i * 20, 10, 17, v, false));
      worp.appendChild(sw);
    }
    const sb = el('svg', { viewBox: o.uil ? '-60 -76 120 136' : '-13 -13 26 26', 'aria-hidden': 'true' });
    if (o.uil) tekenUil(sb, 0, 0, 1, false);
    else if (o.plaatje) plaatje(o.plaatje, sb, 0, 0, 1, 1.05);
    beeld.appendChild(sb);
    k.querySelector('.gb-kaartje-titel').textContent = o.titel;
    k.querySelector('.gb-kaartje-sub').textContent = o.sub;
    k.className = 'gb-kaartje ul-kaartje ' + (o.soort || '');
    k.hidden = false;
    k.classList.remove('in'); void k.offsetWidth; k.classList.add('in');
    meld(`${o.p ? o.p.naam + ': ' : ''}${o.titel}. ${o.sub}.`);
    await wacht(o.duur || 1150);
    k.hidden = true;
  }
  // drie zessen: de uil klappert met zijn vleugels en zijn ogen gloeien (de vleugels met Web Animations: gedraaid om de schouder)
  function uilFeest() {
    if (!ui.uil) return;
    ui.uil.classList.remove('ul-feest'); void ui.uil.getBoundingClientRect(); ui.uil.classList.add('ul-feest');
    setTimeout(() => ui.uil.classList.remove('ul-feest'), 2400);
    if (!rustig() && document.body.animate) {
      [['l', 34], ['r', -34]].forEach(([k, a]) => {
        const v = ui.uil.querySelector('.ul-vleugel-' + k);
        if (v) v.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${a}deg)` }], { duration: 300, iterations: 8, direction: 'alternate', easing: 'ease-in-out' });
      });
    }
    if (Geluid.oehoe) Geluid.oehoe();
  }
  // af en toe knippert de uil met zijn ogen
  let knipperTimer = 0;
  function knipper() {
    clearTimeout(knipperTimer);
    if (!ui.uil || rustig() || !document.body.animate) return;
    knipperTimer = setTimeout(() => {
      ui.uil.querySelectorAll('.ul-ooglid').forEach((l) => l.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: 0.45 }, { transform: 'scaleY(1)', offset: 0.6 }, { transform: 'scaleY(0)' }], { duration: 280, easing: 'ease-in-out' }));
      knipper();
    }, 3500 + Math.random() * 5000);
  }

  // ============================================================
  // SPELVERLOOP
  // ============================================================
  async function nieuwSpel() {
    spelId++;
    const mijnId = spelId;
    stenenWeg(); markeer(null);
    if (ui.kaartje) ui.kaartje.hidden = true;
    const ids = ['jij'].concat(keuze).slice(0, 4);
    spelers = ids.map((id, i) => ({
      index: i, id, kleur: KLEUREN[i],
      naam: id === 'jij' ? 'Jij' : naamVan(id),
      persoon: window.Personen && Personen.gezicht[id] ? id : null,
      mens: id === 'jij' || id.startsWith('vriend'),
      geld: BEGIN, getoond: BEGIN, blut: false
    }));
    pot = 0; ronde = 0; aan = 0; uilGegooid = false;
    tekenPot(0);
    zetKaars(ui.kaars, RONDES);
    maakChips();
    fase = 'inleg';
    werkSpelersBij();
    const prater = spelers.filter((p) => p.persoon);
    if (prater.length) setTimeout(() => zeg(willekeurig(prater), 'start'), 300);
    await wacht(450); if (mijnId !== spelId) return;
    await inleggen(); if (mijnId !== spelId) return;
    beurt();
  }

  async function beurt() {
    const mijnId = spelId;
    if (pot <= 0) {
      fase = 'inleg'; werkSpelersBij();
      zeg(willekeurig(spelers.filter((q) => q.persoon && !q.blut)), 'leeg');
      await inleggen(); if (mijnId !== spelId) return;
      if (spelers[0].blut || spelers.filter((q) => !q.blut).length < 2) return einde();
      if (spelers[aan].blut) return volgende();
    }
    const p = spelers[aan];
    fase = 'gooien';
    werkSpelersBij();
    if (!p.mens) {
      await wacht(700); if (mijnId !== spelId) return;
      gooi(true);
    } else meld(`${p.id === 'jij' ? 'Jij bent' : p.naam + ' is'} aan de beurt. Schud de beker.`);
  }

  function volgende() {
    if (fase === 'klaar') return;
    if (spelers[0].blut || spelers.filter((q) => !q.blut).length < 2) { einde(); return; }
    let i = aan;
    do {
      i = (i + 1) % spelers.length;
      if (i === 0) {
        ronde++;
        zetKaars(ui.kaars, RONDES - ronde);
        if (ronde >= RONDES) { einde(); return; }
      }
    } while (spelers[i].blut);
    aan = i;
    beurt();
  }

  // ---------- de beker ----------
  let schudt = false, rammel = 0;
  function beginSchudden() {
    if (schudt || fase !== 'gooien' || !spelers[aan].mens) return;
    schudt = true;
    ui.beker.classList.add('schudt');
    Geluid.dobbel();
    if (window.Tril) Tril.tik();
    rammel = setInterval(() => { Geluid.dobbel(); if (window.Tril) Tril.tik(); }, 420);
  }
  function gooiMens() {
    if (!schudt) return;
    schudt = false;
    clearInterval(rammel);
    ui.beker.classList.remove('schudt');
    ui.beker.classList.remove('gooit'); void ui.beker.offsetWidth; ui.beker.classList.add('gooit');
    gooi(false);
  }

  async function gooi(vanBoven) {
    if (fase !== 'gooien') return;
    const mijnId = spelId, p = spelers[aan];
    fase = 'rollen';
    werkSpelersBij();
    const d = () => 1 + Math.floor(Math.random() * 6);
    let w = [d(), d(), d()];
    if (vasteWorp) { w = vasteWorp.slice(); vasteWorp = null; }
    await tuimel(w, vanBoven);
    if (mijnId !== spelId) return;
    meld(`${p.naam} gooit ${w.join(', ')}.`);
    await speelWorp(p, w);
    if (mijnId !== spelId) return;
    stenenWeg(); markeer(null);
    werkSpelersBij();
    await wacht(320); if (mijnId !== spelId) return;
    volgende();
  }

  async function speelWorp(p, w) {
    const mijnId = spelId, snel = !p.mens ? 950 : 1150;
    if (w[0] === w[1] && w[1] === w[2]) {
      const v = w[0];
      markeer(driePlek(v));
      if (v === 6) {
        uilGegooid = uilGegooid || p.id === 'jij';
        uilFeest();
        vonken(36);
        if (window.Tril) Tril.succes();
        await kaartje({ soort: 'uil', uil: true, w, p, titel: 'De uil!', sub: 'De hele pot is voor ' + (p.id === 'jij' ? 'jou' : p.naam), duur: 1700 });
        if (mijnId !== spelId) return;
        await trek(p, pot);
        zeg(p, 'uil');
      } else {
        if (Geluid.tada) Geluid.tada();
        await kaartje({ soort: 'helft', w, p, plaatje: 'ster', titel: 'Drie gelijk!', sub: 'De helft van de pot', duur: snel + 200 });
        if (mijnId !== spelId) return;
        await trek(p, Math.ceil(pot / 2));
        zeg(p, 'helft');
      }
      return;
    }
    const i = veldVan(w), e = effectVan(w);
    markeer(veldPlek(i));
    const sub = e.soort === 'niets' ? 'Er gebeurt niets' : e.soort === 'trek' ? `Trek ${e.n} uit de pot` : `Betaal ${e.n} in de pot`;
    if (e.soort === 'trek' && Geluid.kling) Geluid.kling();
    if (window.Tril) { if (e.soort === 'betaal') Tril.fout(); else Tril.klik(); }
    await kaartje({ soort: e.soort, w, p, plaatje: PLAATJE[i], titel: titelVan(PLAATJE[i]), sub, duur: snel });
    if (mijnId !== spelId) return;
    if (e.soort === 'betaal') { await betaal(p, e.n); zeg(p, p.blut ? 'blut' : 'betaal'); }
    else if (e.soort === 'trek') { const x = await trek(p, e.n); zeg(p, sleutel(w) === '566' ? 'bijna' : x ? 'trek' : 'leeg'); }
    else zeg(p, 'niets');
    if (p.blut) meld(`${p.naam} is blut.`);
  }

  function einde() {
    if (fase === 'klaar') return;
    fase = 'klaar';
    stenenWeg(); markeer(null);
    zetKaars(ui.kaars, Math.max(0, RONDES - ronde));
    werkSpelersBij();
    const ik = spelers[0];
    const max = Math.max(...spelers.map((q) => q.geld));
    const winnaars = spelers.filter((q) => q.geld === max);
    const mensen = spelers.filter((q) => q.mens).length, computers = spelers.length - mensen;
    const mensWint = winnaars.some((q) => q.mens) && !ik.blut;
    let bedrag, tekst2, gewonnen;
    if (ik.blut) { bedrag = 10; tekst2 = 'Je bent blut. Volgende keer beter!'; gewonnen = false; if (Geluid.jammer) Geluid.jammer(); }
    else if (mensWint && computers > 0) {
      bedrag = 25 + 10 * computers; gewonnen = true;
      tekst2 = winnaars.length > 1 ? 'Gelijk bovenaan: jullie winnen samen!' : winnaars[0].id === 'jij' ? 'Jij hebt de meeste penningen!' : `${winnaars[0].naam} wint!`;
      if (winnaars.some((q) => q.id === 'jij') && window.Duiten) Duiten.zetVeld('uil-gewonnen', Math.max(Duiten.veld('uil-gewonnen', 0) || 0, computers));
    } else if (!mensWint) { bedrag = 15; gewonnen = false; tekst2 = `${winnaars[0].naam} heeft de meeste penningen. Goed gespeeld!`; }
    else { bedrag = 30; gewonnen = true; tekst2 = `${winnaars[0].naam} wint!`; }
    // één iemand zegt iets (anders praten ze door elkaar): de winnaar, of anders een van de anderen
    const sprekers = spelers.filter((q) => q.persoon);
    const spreker = winnaars.find((q) => q.persoon) || (sprekers.length ? willekeurig(sprekers) : null);
    if (spreker) setTimeout(() => zeg(spreker, winnaars.includes(spreker) ? 'wint' : 'verliest'), 500);
    if (gewonnen) { vonken(40); if (window.Tril) Tril.succes(); if (Geluid.tada) Geluid.tada(); }
    meld(tekst2);
    const w = winnaars[0];
    kaartje({ soort: 'einde', p: null, plaatje: gewonnen ? 'kroon' : 'kaars', titel: ik.blut ? 'Blut!' : gewonnen ? 'Gewonnen!' : 'De kaars is op', sub: ik.blut ? 'Geen penningen meer' : `${w.id === 'jij' ? 'Jij' : w.naam}: ${max} penningen`, duur: 2200 });
    if (window.Duiten) Duiten.beloon({ spel: 'uilenspel', bedrag, gewonnen, tekst: tekst2, wacht: 2600 });
  }

  function vonken(aantal) {
    if (rustig()) return;
    const rr = ui.bordvak.getBoundingClientRect();
    for (let i = 0; i < aantal; i++) {
      const v = document.createElement('i');
      v.className = 'vonk' + (i % 3 === 0 ? ' groot' : '');
      v.style.left = (rr.width * (0.25 + Math.random() * 0.5)) + 'px';
      v.style.top = (rr.height * (0.25 + Math.random() * 0.5)) + 'px';
      ui.vonken.appendChild(v);
      const an = v.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, calc(-50% - ${(20 + Math.random() * 40).toFixed(0)}px)) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 700, delay: Math.random() * 600, easing: 'ease-out', fill: 'both' });
      an.onfinish = () => v.remove();
    }
  }

  // ============================================================
  // KEUZEMENU: WIE SPELEN ER MEE?
  // ============================================================
  function openMenu() {
    tekenMenu();
    werkSchakelaars();
    ui.menu.hidden = false;
    ui.menu.classList.remove('open'); void ui.menu.offsetWidth; ui.menu.classList.add('open');
    const eerste = ui.keuzes.querySelector('.mo-keuze');
    if (eerste) eerste.focus({ preventScroll: true });
  }
  function sluitMenu() { if (ui.menu) ui.menu.hidden = true; }
  function werkSchakelaars() {
    const g = ui.menu.querySelector('.mo-geluid'), m = ui.menu.querySelector('.mo-muziek');
    g.setAttribute('aria-pressed', String(Geluid.aan));
    const mk = document.getElementById('knop-muziek');
    m.setAttribute('aria-pressed', mk ? mk.getAttribute('aria-pressed') : 'false');
  }
  function tekenMenu() {
    const g = gezichten();
    ui.keuzes.innerHTML = '';
    const opties = KEUZE.filter((id) => g[id]).concat(VRIENDEN.map((v) => v.id));
    opties.forEach((id, n) => {
      const mee = keuze.includes(id);
      const vol = !mee && keuze.length >= 3;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mo-keuze gb-keuze' + (mee ? ' nu' : '') + (vol ? ' vol' : '');
      b.setAttribute('aria-pressed', String(mee));
      const vriend = id.startsWith('vriend');
      const plaatje2 = vriend ? `<span class="gb-vriend">${pionSvgHtml(KLEUREN[(n % 3) + 1])}</span>` : g[id];
      b.innerHTML = `<span class="mo-gezicht">${plaatje2}${mee ? `<i class="mo-medaille">${icoon('vink')}</i>` : ''}</span><span class="mo-keuze-naam">${naamVan(id)}</span>`;
      b.setAttribute('aria-label', `${naamVan(id)}${vriend ? ' (iemand naast je)' : ''}${mee ? ', speelt mee' : ''}`);
      b.addEventListener('click', () => {
        if (mee) { if (keuze.length > 1) keuze = keuze.filter((x) => x !== id); else { schud(b); return; } }
        else if (vol) { schud(b); return; }
        else keuze = keuze.concat([id]);
        Geluid.pak();
        tekenMenu();
        const nieuw = ui.keuzes.querySelectorAll('.mo-keuze')[n];
        if (nieuw) nieuw.focus({ preventScroll: true });
      });
      ui.keuzes.appendChild(b);
    });
  }
  function schud(b) {
    b.classList.remove('schud'); void b.offsetWidth; b.classList.add('schud');
    if (window.Tril) Tril.fout();
  }

  // ============================================================
  // UITLEG DOOR GIJS DE GANS
  // ============================================================
  function vakOpScherm(x, y, ruimte) {
    const m = bordSvg.getScreenCTM();
    const h = ruimte * m.a;
    return { left: m.a * x + m.e - h, top: m.d * y + m.f - h, width: 2 * h, height: 2 * h };
  }
  if (window.Les) {
    Les.zet('uilenspel', () => [
      { doel: () => ui.beker, vorm: 'rond', gebaar: 'tik', tekst: 'Houd de beker vast en laat los om te gooien' },
      { doel: () => { const [x, y] = middenVan(veldPlek(veldVan([2, 5, 6]))); return vakOpScherm(x, y, 40); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Elk vak is een worp: B is betalen, T is trekken' },
      { doel: () => vakOpScherm(C, 430, 46), vorm: 'rond', gebaar: 'wijs', tekst: 'Betalen doe je in de pot, bij de uil' },
      { doel: () => { const [x, y] = middenVan(driePlek(6)); return vakOpScherm(x, y, 32); }, vorm: 'rond', gebaar: 'wijs', tekst: 'Drie zessen? Dan is de hele pot voor jou!' },
      { doel: () => vakOpScherm(KAARS.x, 640, 56), vorm: 'rond', gebaar: 'wijs', tekst: 'Is de kaars op, dan wint wie het meest heeft' },
      { doel: () => podium.querySelector('.ul-meer'), vorm: 'rond', gebaar: 'tik', tekst: 'Kies hier met wie je speelt' }
    ]);
  }

  // ============================================================
  // VOOR DE REST VAN DE SITE
  // ============================================================
  window.Spellen = window.Spellen || {};
  window.Spellen.uilenspel = {
    start() {
      if (!gebouwd) {
        bouw();
        const bewaard = window.Duiten ? Duiten.veld('uil-spelers', null) : null;
        if (Array.isArray(bewaard) && bewaard.length) keuze = bewaard.slice(0, 3);
        requestAnimationFrame(() => { pasMaatAan(); nieuwSpel(); });
      } else {
        kleurDobbels();
        pasMaatAan();
        // een onderbroken beurt gaat verder met de volgende speler
        if (fase === 'rollen' || fase === 'inleg') {
          stenenWeg(); markeer(null);
          spelers.forEach((q) => { q.getoond = q.geld; });
          tekenPot(pot);
          werkSpelersBij();
          volgende();
        } else if (fase === 'gooien') { werkSpelersBij(); if (!spelers[aan].mens) beurt(); }
      }
      if (window.Les) Les.eersteKeer('uilenspel');
      knipper();
    },
    stop() {
      spelId++;
      clearTimeout(knipperTimer);
      if (schudt) { schudt = false; clearInterval(rammel); ui.beker.classList.remove('schudt'); }
      sluitMenu();
      if (ui.kaartje) ui.kaartje.hidden = true;
      if (ui.vlucht) ui.vlucht.textContent = '';
    },
    opnieuw() { nieuwSpel(); },
    // de prent aan de muur van de voorkamer: hetzelfde bord, eenvoudiger, met de regels eronder
    maakPrent() { return tekenBord('p', true, true); },
    velden: VELDEN, effectVan, plaatjes: PLAATJE,
    _toestand() { return { fase, aan, ronde, pot, spelers: spelers.map((p) => ({ id: p.id, geld: p.geld, blut: p.blut, mens: p.mens })) }; },
    _test: {
      dobbel(a, b, c) { vasteWorp = [a, b, c]; },
      zetPot(n) { pot = n; tekenPot(n); },
      zetGeld(i, n) { const p = spelers[i]; p.geld = n; p.getoond = n; toonGeld(p); werkSpelersBij(); },
      zetRonde(r) { ronde = r; zetKaars(ui.kaars, RONDES - r); },
      gooi() { if (fase === 'gooien' && spelers[aan].mens) { beginSchudden(); gooiMens(); } },
      kaartje: (o) => kaartje(o)
    }
  };
})();
