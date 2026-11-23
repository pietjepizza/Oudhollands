/* De Kunstkamer: het buurhuis aan de gracht, waar je leest en kijkt over de oude spellen.
   Hier speel je niet. Elke vitrine vertelt waar een spel vandaan komt, hoe je het speelt,
   op welke schilderijen en prenten het staat, iets om te onthouden, en waar het verhaal vandaan komt.
   Een kunstkamer (of rariteitenkabinet) was in de zeventiende eeuw de verzameling waarmee een
   welgestelde burger zijn bezoekers liet zien wat hij allemaal wist en had. */
(function () {
  'use strict';

  // ============================================================
  // DE VITRINES
  // ============================================================
  const STUKKEN = [
    {
      id: 'ganzenbord', naam: 'Ganzenbord', tegel: 'ill-gans', tijd: 'Italië, vijftiende eeuw', kort: 'Het bordspel dat op één vel papier paste',
      herkomst: [
        'Het ganzenbord komt uit Italië, waar het <i>il gioco dell\'oca</i> heet. De oudste vermelding is uit 1480, in de preken van de Italiaanse monnik Gabriele da Barletta.',
        'Volgens een oud verhaal stuurde groothertog Francesco de\' Medici van Florence een ganzenbord naar koning Filips II van Spanje. Dat verhaal werd pas in 1617 opgeschreven; of het echt zo ging, weet niemand zeker.',
        'Het oudste gedateerde bord dat nog bestaat, werd in 1598 in Rome gedrukt. Omdat het hele spel op één vel papier paste, was het goedkoop. Zo raakte het in heel Europa bekend, ook in de Nederlanden, waar drukkers er hun eigen prenten van maakten.'
      ],
      spelen: ['Een slakkenhuis van 63 vakken: wie het eerst precies op 63 komt, wint.', 'Gooi twee dobbelstenen en loop zoveel vakken.', 'Kom je op een gans, dan loop je je worp nog een keer.', 'De brug, de herberg, de put, het doolhof, de gevangenis en de dood houden je op of sturen je terug.', 'Gooi je te veel, dan tel je vanaf 63 terug.'],
      weetjes: ['De ganzen staan steeds met twee bij elkaar, om de negen vakken. Daardoor kun je met één worp soms heel ver komen.', 'Er waren ook ganzenborden met lesjes erop, over aardrijkskunde, geschiedenis of goede manieren.'],
      kunst: [
        { titel: 'Il gioco dell\'oca dilettevole', maker: 'Italiaans speelbord', url: 'https://collections.vam.ac.uk/item/O25992/il-gioco-delloca-dilettevole-per-board-game-unknown/', waar: 'Victoria and Albert Museum' },
        { titel: 'Gedrukt ganzenbord', maker: 'Prent', url: 'https://www.britishmuseum.org/collection/object/P_1869-0410-2465-', waar: 'British Museum' }
      ],
      bronnen: [
        { tekst: 'Game of the Goose (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Game_of_the_Goose' },
        { tekst: 'Franco Pratesi over de herkomst (naibi.net)', url: 'https://naibi.net/f/OCA.pdf' }
      ]
    },
    {
      id: 'sjoelen', naam: 'Sjoelen', tegel: 'ill-sjoelbak', tijd: 'Nederland, negentiende eeuw', kort: 'Houten schijven over een gladde bak de poortjes in',
      herkomst: [
        'Sjoelen is een echt Nederlands spel, familie van het Engelse <i>shuffleboard</i>. Sjoelbakken komen in Nederland vanaf de late negentiende eeuw voor, en het spel wordt vaak met Friesland verbonden.',
        'Lange tijd werd er vooral thuis en in buurthuizen gesjoeld, bij de kachel of op verjaardagen. Sinds 1977 is sjoelen ook een wedstrijdsport, met een eigen bond: de Algemene Nederlandse Sjoelbond.'
      ],
      spelen: ['Je hebt dertig houten schijven en drie beurten.', 'Na elke beurt pak je de schijven die niet in een vak liggen, en schuif je die opnieuw.', 'De vier vakken zijn 2, 3, 4 en 1 punt waard.', 'Heb je in elk vak een schijf, dan telt dat setje 20 punten.', 'De hoogste score is 148.'],
      weetjes: ['148 haal je zo: zeven volle setjes (7 × 20) en de laatste twee schijven in het vak van 4.', 'Een goede sjoelbak wordt glad gemaakt met poeder of was, zodat de schijven ver doorglijden.'],
      kunst: [],
      bronnen: [
        { tekst: 'Sjoelen (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sjoelen' },
        { tekst: 'Dutch shuffleboard (Masters of Games)', url: 'https://www.mastersofgames.com/cat/table/sjoelbak.htm' }
      ]
    },
    {
      id: 'molenspel', naam: 'Molenspel', tegel: 'ill-molen', tijd: 'Romeinse tijd, en misschien ouder', kort: 'Drie op een rij: een molen',
      herkomst: [
        'Het molenspel is een van de oudste bordspellen die we kennen. De Romeinen speelden het al, en in de middeleeuwen werd het bord in heel Europa in stenen, kerkbanken en kloostermuren gekrast.',
        'Ook in Nederland zijn zulke borden gevonden, zoals een ingekraste molen op een laatmiddeleeuwse baksteen uit de Martinikerk in Groningen.',
        'In het Engels heet het <i>nine men\'s morris</i>, naar de negen stenen die elke speler heeft.'
      ],
      spelen: ['Elke speler heeft negen stenen.', 'Om de beurt zet je een steen op een punt; daarna schuif je ze langs de lijnen.', 'Drie op een rij is een molen: dan mag je een steen van de ander weghalen.', 'Heb je nog maar drie stenen, dan mag je springen.', 'Wie nog maar twee stenen heeft of niet meer kan schuiven, verliest.'],
      weetjes: ['In 1993 rekende Ralph Gasser met een computer uit dat het molenspel gelijk eindigt als beide spelers volmaakt spelen.'],
      kunst: [{ titel: 'Speelbord voor het molenspel', maker: 'Onbekend', url: 'https://collections.vam.ac.uk/item/O27610/nine-mens-morris-board-game-unknown', waar: 'Victoria and Albert Museum' }],
      bronnen: [
        { tekst: 'Nine men\'s morris (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Nine_men%27s_morris' },
        { tekst: 'Nine Men\'s Morris (tradgames.org.uk)', url: 'https://tradgames.org.uk/games/Nine-Mens-Morris.htm' }
      ]
    },
    {
      id: 'dammen', naam: 'Dammen', tegel: 'ill-dammen', tijd: 'De Nederlanden, zeventiende eeuw', kort: 'Twintig stenen op honderd velden',
      herkomst: [
        'Dammen op een bord van honderd velden komt uit de Nederlanden en Frankrijk. Volgens de taalkundige Arie van der Stoep kende men het bord van honderd velden in de zeventiende eeuw al, toen nog met vijftien stenen per speler.',
        'In Friesland speelde men van oudsher op honderd velden. Daar mag je ook recht vooruit en opzij slaan: dat heet Fries dammen.',
        'De schrijver Jacob Campo Weyerman noemde het dammen al in 1721. De naam <i>dames à la polonaise</i>, Pools dammen, komt uit het Frans; misschien betekende \'Pools\' toen gewoon \'vreemd\'.'
      ],
      spelen: ['Elke speler heeft twintig stenen op de donkere velden.', 'Je schuift schuin vooruit, één veld per keer.', 'Slaan is verplicht, ook achteruit, en je moet de meeste stenen slaan.', 'Kom je aan de overkant, dan word je een dam: die mag over de hele lijn.'],
      weetjes: ['Volgens een recent boek over de Nederlandse spelgeschiedenis was dammen eeuwenlang het meest gespeelde bordspel in Nederland.'],
      kunst: [],
      bronnen: [
        { tekst: 'International draughts (Wikipedia)', url: 'https://en.wikipedia.org/wiki/International_draughts' },
        { tekst: 'De herkomst van het dammen (checkers.online)', url: 'https://checkers.online/magazine/history/draughts-origins' },
        { tekst: 'Geschiedenis van het Fries dammen', url: 'https://frisiandraughts.com/spagina/5/6/history.html' },
        { tekst: 'Weyerman over het dammen (DBNL)', url: 'https://dbnl.org/tekst/_med009198701_01/_med009198701_01_0015.php' }
      ]
    },
    {
      id: 'klaverjassen', naam: 'Klaverjassen', tegel: 'ill-kaarten', tijd: 'Holland, achttiende eeuw', kort: 'Troef, roem en een maat tegenover je',
      herkomst: [
        'Klaverjassen is een Nederlands kaartspel. Al in 1730 wordt het genoemd als \'een soort kaartspel in Holland\', en in 1821 beschreef een Nederlands boek een vroege vorm ervan.',
        'De naam komt van <i>klaver</i>, de kleur klaveren, en <i>jas</i>, de oude naam voor de troefboer: de sterkste kaart. Volgens kaartspelkenner David Parlett is deze familie van jas-spellen in de Nederlanden ontstaan. In Zwitserland is <i>Jass</i> nu het grote volkskaartspel.'
      ],
      spelen: ['Vier spelers, twee tegen twee: je maat zit tegenover je.', 'Er wordt gespeeld met 32 kaarten, van zeven tot aas.', 'Wie uitkomt, kiest troef. In troef is de boer het sterkst, en dan de negen.', 'Volg de kleur. Kun je dat niet, dan moet je troeven (Rotterdams); bij Amsterdams hoeft dat niet als je maat de slag al heeft.', 'Drie of vier kaarten op een rij in één slag geven roem.', 'Wie troef koos, moet meer dan de helft van de punten halen. Anders gaat hij nat.'],
      weetjes: ['De troefnegen heet \'nel\'.', 'Wie verkeerd bekent of niet troeft terwijl het moet, verzaakt: dan krijgt de andere partij alle punten van dat spel.'],
      kunst: [],
      bronnen: [
        { tekst: 'Klaverjas (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Klaverjas' },
        { tekst: 'Klaverjassen (pagat.com)', url: 'https://pagat.com/jass/klaverjassen.html' },
        { tekst: 'Kaartspellen in Nederland (pagat.com)', url: 'https://www.pagat.com/national/netherlands.html' }
      ]
    },
    {
      id: 'triktrak', naam: 'Triktrak', tegel: 'ill-triktrak', tijd: 'Geliefd in de zeventiende eeuw', kort: 'Vijftien schijven en twee dobbelstenen',
      herkomst: [
        'Triktrak is de oude Nederlandse naam voor het spel dat we nu backgammon noemen. Spellen met vijftien schijven en twee dobbelstenen, de \'tafelspellen\', worden al heel lang gespeeld; de Romeinen kenden al een verwant spel.',
        'In de zeventiende eeuw was triktrak in de Republiek erg geliefd, in herbergen en in deftige huizen. Schilders als Willem Duyster en Jan Steen schilderden mensen aan het triktrakbord.',
        'De naam komt waarschijnlijk van het geklik van de schijven en de stenen op het bord: trik, trak.'
      ],
      spelen: ['Elke speler heeft vijftien schijven en loopt het bord rond, naar huis.', 'Gooi twee stenen en zet je schijven zoveel punten verder. Met dubbel zet je vier keer.', 'Een losse schijf van de ander kun je slaan: die moet dan opnieuw het bord op.', 'Staan al je schijven thuis, dan neem je ze uit. Wie het eerst alles uit heeft, wint.'],
      weetjes: ['Er bestond ook een Hollandse opzet: dan beginnen alle schijven naast het bord, en mag je pas slaan als je zelf een schijf thuis hebt.'],
      kunst: [{ titel: 'Triktrakspelers', maker: 'Willem Cornelisz. Duyster', url: 'https://www.rijksmuseum.nl/nl/collectie/SK-A-1427', waar: 'Rijksmuseum' }],
      bronnen: [
        { tekst: 'Backgammon (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Backgammon' },
        { tekst: 'Tables game (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Tables_game' },
        { tekst: 'De regels (bkgm.com)', url: 'https://bkgm.com/rules.html' },
        { tekst: 'De Hollandse opzet (bkgm.com)', url: 'https://bkgm.com/variants/DutchBackgammon.html' }
      ]
    },
    {
      id: 'bikkelen', naam: 'Bikkelen', tegel: 'ill-bikkel', tijd: 'Sinds de oudheid', kort: 'Vier botjes en een balletje op de stoep',
      herkomst: [
        'Bikkels zijn sprongbeentjes uit de enkel van een schaap. Er werd al in de oudheid mee gespeeld. In de Nederlanden was bikkelen vooral een spel van meisjes, op de stoep of op tafel, vaak met liedjes erbij.',
        'In Delft zijn bikkels van schapen-, varkens- en runderbotjes opgegraven uit lagen van 1600 tot 1800. Later kwamen er ook metalen bikkels; in sommige families gingen die van moeder op dochter over.',
        'Twee generaties geleden werd er op het platteland nog volop gebikkeld.'
      ],
      spelen: ['Gooi de vier bikkels op de grond.', 'Gooi het balletje op, pak gauw een bikkel en vang de bal als hij één keer gestuit is.', 'Daarna twee tegelijk, dan drie en één, en dan alle vier.', 'Dan draai je ze op dezelfde kant: bol, hol, rug en S.', 'Raak je een verkeerde bikkel of mis je de bal, dan is de ander aan de beurt.'],
      weetjes: ['De vier kanten van een bikkel hebben per streek andere namen: bol en hol, maar ook put, rug, stander en esser.'],
      kunst: [
        { titel: 'Drie meisjes spelen op de stoep het bikkelspel', maker: 'Jan Luyken, 1712', url: 'https://www.rijksmuseum.nl/en/collection/object/Drie-meisjes-spelen-op-de-stoep-het-bikkelspel--ba2738483379581d5acb39f4165c82d8', waar: 'Rijksmuseum' },
        { titel: 'Man die aan het bikkelen is', maker: 'Jan Baptist Weenix', url: 'https://www.rijksmuseum.nl/nl/collectie/RP-T-1899-A-4239', waar: 'Rijksmuseum' },
        { titel: 'Kinderen spelen ossekies', maker: 'Zacharias Chatelain, 1712', url: 'https://www.rijksmuseum.nl/en/collection/RP-P-1896-A-19368-2919', waar: 'Rijksmuseum' }
      ],
      bronnen: [
        { tekst: 'Madoc 1996, over bikkelen (DBNL)', url: 'https://www.dbnl.org/tekst/_mad001199601_01/_mad001199601_01_0039.php' },
        { tekst: 'De Nieuwe Taalgids 1959 (DBNL)', url: 'https://dbnl.org/tekst/_taa008195901_01/_taa008195901_01_0078.php' }
      ]
    },
    {
      id: 'kolf', naam: 'Kolf op het ijs', tegel: 'ill-kolf', tijd: 'Middeleeuwen tot zeventiende eeuw', kort: 'Met de kolf naar de paal',
      herkomst: [
        'Colf, of kolf, werd in de Nederlanden al in de middeleeuwen gespeeld: je sloeg een bal met een kolf naar een doel, met zo min mogelijk slagen. Er wordt een wedstrijd uit 1297 in Loenen aan de Vecht genoemd.',
        'In de winter speelde men het op het ijs. Op de schilderijen van Hendrick Avercamp zie je kolvers tussen de schaatsers. Op het ijs sloeg je naar een paal.',
        'Later werd kolf een binnenspel op een korte baan, de kolfbaan. Dat kolf wordt nog steeds gespeeld, door een kleine groep liefhebbers.'
      ],
      spelen: ['Sla je bal met de kolf naar de paal.', 'Om de beurt; elke slag telt.', 'Wie met de minste slagen de paal raakt, wint.'],
      weetjes: ['Over de regels op het ijs is weinig bewaard gebleven. Een gedicht van Jan Six van Chandelier spreekt van een spel aan een paal.', 'Kolf wordt wel een voorloper van golf genoemd, maar dat is niet zeker.'],
      kunst: [
        { titel: 'Kolven op het ijs', maker: 'Hendrick Avercamp, omstreeks 1620', url: 'https://www.rct.uk/collection/906470', waar: 'Royal Collection' },
        { titel: 'Schaatsers op het ijs met een kolfspeler', maker: 'Hendrick Avercamp', url: 'https://www.rijksmuseum.nl/en/collection/RP-T-1891-A-2430(V)', waar: 'Rijksmuseum' },
        { titel: 'Winterlandschap met ijsvermaak', maker: 'Hendrick Avercamp, omstreeks 1608', url: 'https://www.rijksmuseum.nl/nl/collectie/SK-A-1718', waar: 'Rijksmuseum' }
      ],
      bronnen: [
        { tekst: 'Colf on ice (schaatshistorie.nl)', url: 'https://www.schaatshistorie.nl/english/on-and-around-the-ice/colf-on-ice/' },
        { tekst: 'Historie van de kolfsport (golfgeschiedenis.nl)', url: 'https://static.golfgeschiedenis.nl/2180/Historie--Kolfsport-NL.pdf' },
        { tekst: 'From colf to kolf', url: 'https://ancientgolf.dse.nl/pdfs/colf%20to%20kolf.pdf' },
        { tekst: 'Kolf (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Kolf' }
      ]
    },
    {
      id: 'koekhappen', naam: 'Koekhappen', tegel: 'ill-koek', tijd: 'Negentiende eeuw tot nu', kort: 'Een koek aan een touwtje, je handen op je rug',
      herkomst: [
        'Koek was lang een feestelijke lekkernij, en op de kermis kon je er ook mee spelen. Jan ter Gouw noemt in zijn boek De volksvermaken (1871) vier spellen met koek: koekhakken, koekhappen, koekknuppelen en koekgooien.',
        'Koekhappen gaat natuurlijk met de mond, schrijft hij. Hij zag het zelf in 1869 nog in de Diemermeer, bij de Tolbrug.',
        'Later werd koekhappen een spel voor kinderfeestjes en voor Koninginnedag, nu Koningsdag. Er hangen plakjes ontbijtkoek aan touwtjes aan een lijn.'
      ],
      spelen: ['Aan een lijn hangen koeken aan touwtjes, net boven je mond.', 'Je staat eronder met je handen op je rug. Drie, twee, één: happen maar!', 'Raak je de koek met je neus, dan zwaait hij weg.', 'Wie zijn koek het eerst op heeft, wint.'],
      weetjes: ['Ter Gouw dacht dat je het steeds minder zag omdat de jongens het wat vies begonnen te vinden.', 'Soms was de koek met boter besmeerd. Dan zat je gezicht er helemaal onder.', 'Op Koningsdag 2018 tekende Google koekhappende kinderen op zijn zoekpagina.'],
      kunst: [
        { titel: 'Koekhappen (a Dutch party game)', maker: 'Petrus van der Velden, 1876', url: 'https://collections.tepapa.govt.nz/object/42816', waar: 'Te Papa, Nieuw-Zeeland' }
      ],
      bronnen: [
        { tekst: 'Jan ter Gouw, De volksvermaken (1871), DBNL', url: 'https://www.dbnl.org/tekst/gouw002volk01_01/gouw002volk01_01_0037.php' },
        { tekst: 'Koekhappen in Traditie (Kenniscentrum Immaterieel Erfgoed)', url: 'https://www.immaterieelerfgoed.nl/image/2018/9/19/traditie_2005_2_spread.pdf' },
        { tekst: 'Regula Ysewijn, Dark Rye and Honey Cake: koek als vermaak', url: 'https://app.ckbk.com/section/dark51814c19s001ss007/koek-as-entertainment' },
        { tekst: 'Koekhappen wordt bij het erfgoedvuil gezet (NOS)', url: 'https://nos.nl/artikel/2026580-koekhappen-wordt-bij-het-erfgoedvuil-gezet' },
        { tekst: 'Koningsdag 2018 (Google Doodle)', url: 'https://doodles.google/doodle/kings-day-2018/' }
      ]
    },
    {
      id: 'knikkeren', naam: 'Knikkeren', tegel: 'ill-knikkers', tijd: 'Eeuwenoud', kort: 'Een potje in het zand',
      herkomst: [
        'Kinderen speelden al in de oudheid met noten, steentjes en balletjes. Knikkers waren vaak van gebakken klei; die waren goedkoop. Wie meer geld had, kon knikkers van steen of glas kopen.',
        'Op prenten uit de zeventiende eeuw zie je kinderen knikkeren, zoals op het Knikkerspel van Michiel Mosijn (omstreeks 1640 tot 1655).'
      ],
      spelen: ['Iedereen zet een paar knikkers in.', 'Gooi vanaf de streep naar het potje; wie het dichtst bij ligt, begint.', 'Tik om de beurt een knikker naar het potje. Raak is nog een keer.', 'Wie de laatste knikker erin tikt, wint de hele pot.'],
      weetjes: ['In het voorjaar was het knikkertijd: dan was de grond weer droog genoeg voor een potje.'],
      kunst: [
        { titel: 'Knikkerspel', maker: 'Michiel Mosijn, omstreeks 1640–1655', url: 'https://www.rijksmuseum.nl/en/collection/object/Knikkerspel--7b81ebfe6159049d5b25295340ab2716', waar: 'Rijksmuseum' },
        { titel: 'Knikkerspel', maker: 'Prent', url: 'https://www.rijksmuseum.nl/en/collection/object/Knikkerspel--77d845a2dabbeb7d72ac200a5ba30453', waar: 'Rijksmuseum' }
      ],
      bronnen: [{ tekst: 'Prenten van het knikkerspel (Rijksmuseum)', url: 'https://www.rijksmuseum.nl/nl/collectie/node/playing-at-marbles--c3e2ad51f12e43d528193f4133f98ea7' }]
    },
    {
      id: 'tollen', naam: 'Tollen', tegel: 'ill-tol', tijd: 'Eeuwenoud', kort: 'Een zweepje en een tol die maar blijft draaien',
      herkomst: [
        'De tol is een van de oudste stukken speelgoed. Op het schilderij Kinderspelen van Pieter Bruegel de Oude, uit 1560, zie je kinderen die hun tol met een zweepje laten draaien.',
        'Er waren drijftollen, die je met een zweepje aan de gang houdt, en tollen die je met een touw opwindt en weggooit.'
      ],
      spelen: ['Geef de tol een zweepslag, of wind hem op en gooi hem weg.', 'Houd hem met het zweepje aan het draaien.', 'In onze tollenstrijd wint wie het langst in de krijtkring blijft draaien.'],
      weetjes: ['Op Bruegels Kinderspelen staan meer dan tachtig spelletjes: zoek de tollen, de hoepels en de bikkels maar eens op.'],
      kunst: [{ titel: 'Kinderspelen', maker: 'Pieter Bruegel de Oude, 1560', url: 'https://en.wikipedia.org/wiki/Children%27s_Games_(Bruegel)', waar: 'Kunsthistorisches Museum, Wenen' }],
      bronnen: [
        { tekst: 'Children\'s Games (Bruegel) (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Children%27s_Games_(Bruegel)' },
        { tekst: 'Bruegels Kinderspelen (World History Commons)', url: 'https://worldhistorycommons.org/node/83' }
      ]
    }
  ];

  // ============================================================
  // OPBOUW
  // ============================================================
  let zaal, gebouwd = false, open = null;
  const icoon = (naam, klasse) => `<svg class="${klasse || ''}" aria-hidden="true"><use href="#i-${naam}"/></svg>`;
  const tegel = (id, klasse) => `<svg class="kk-tegel ${klasse || ''}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="5" class="merk-grond"/><use href="#hoeken" class="merk-hoeken"/><use href="#${id}" x="12" y="10" width="76" height="76" class="tekening"/></svg>`;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function bouw() {
    zaal = document.getElementById('kk-zaal');
    zaal.innerHTML = `
      <header class="kk-kop">
        <a class="mo-knop kk-naar-buiten" href="#" aria-label="Terug naar de gracht" title="Terug naar de gracht">${icoon('huis')}</a>
        <div class="kk-titel"><h2>De Kunstkamer</h2><p>Lezen en kijken: zo werd er vroeger gespeeld. <b>Hier speel je niet.</b></p></div>
      </header>
      <div class="kk-vitrines" role="list"></div>
      <article class="kk-stuk" hidden aria-live="polite"></article>`;
    const lijst = zaal.querySelector('.kk-vitrines');
    STUKKEN.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kk-vitrine';
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', `${s.naam}: ${s.kort}. Lees het verhaal`);
      b.innerHTML = `<span class="kk-glas">${tegel(s.tegel)}</span><span class="kk-bordje"><b>${esc(s.naam)}</b><small>${esc(s.tijd)}</small></span><span class="kk-kort">${esc(s.kort)}</span>`;
      b.addEventListener('click', () => toonStuk(i));
      lijst.appendChild(b);
    });
    zaal.addEventListener('keydown', (e) => {
      if (open === null) return;
      if (e.key === 'Escape') { e.preventDefault(); terug(); }
      if (e.key === 'ArrowRight') toonStuk((open + 1) % STUKKEN.length);
      if (e.key === 'ArrowLeft') toonStuk((open + STUKKEN.length - 1) % STUKKEN.length);
    });
    gebouwd = true;
  }

  function lijstje(items) { return `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`; }
  function toonStuk(i) {
    const s = STUKKEN[i];
    open = i;
    const stuk = zaal.querySelector('.kk-stuk');
    const vorige = STUKKEN[(i + STUKKEN.length - 1) % STUKKEN.length], volgende = STUKKEN[(i + 1) % STUKKEN.length];
    stuk.innerHTML = `
      <div class="kk-blad">
        <div class="kk-blad-kop">
          <button class="kk-terug" type="button">${icoon('pijl', 'kk-links')}<span>Alle vitrines</span></button>
          <span class="kk-nummer">${i + 1} van ${STUKKEN.length}</span>
        </div>
        <div class="kk-blad-binnen">
          <aside class="kk-zij">
            ${tegel(s.tegel, 'groot')}
            ${s.kunst.length ? `<h3>Op schilderijen en prenten</h3><ul class="kk-kunst">${s.kunst.map((k) => `<li><a href="${k.url}" target="_blank" rel="noopener"><b>${esc(k.titel)}</b><span>${esc(k.maker)}</span><small>${esc(k.waar)}</small></a></li>`).join('')}</ul>` : ''}
          </aside>
          <div class="kk-tekst">
            <h2>${esc(s.naam)}</h2>
            <p class="kk-tijd">${esc(s.tijd)}</p>
            <h3>Waar komt het vandaan?</h3>
            ${s.herkomst.map((p) => `<p>${p}</p>`).join('')}
            <h3>Zo speel je het</h3>
            ${lijstje(s.spelen.map(esc))}
            ${s.weetjes.length ? `<div class="kk-weetje"><h3>Wist je dat?</h3>${s.weetjes.map((w) => `<p>${esc(w)}</p>`).join('')}</div>` : ''}
            <h3 class="kk-bron-kop">Bronnen</h3>
            <ul class="kk-bronnen">${s.bronnen.map((b) => `<li><a href="${b.url}" target="_blank" rel="noopener">${esc(b.tekst)}</a></li>`).join('')}</ul>
            <a class="kk-naar-spel" href="#${s.id}">${icoon('pijl')}<span>Zelf ${esc(s.naam.toLowerCase())} spelen in Het Speelhuys</span></a>
          </div>
        </div>
        <nav class="kk-blader" aria-label="Bladeren">
          <button class="kk-vorige" type="button">${icoon('pijl', 'kk-links')}<span>${esc(vorige.naam)}</span></button>
          <button class="kk-volgende" type="button"><span>${esc(volgende.naam)}</span>${icoon('pijl')}</button>
        </nav>
      </div>`;
    stuk.querySelector('.kk-terug').addEventListener('click', terug);
    stuk.querySelector('.kk-vorige').addEventListener('click', () => toonStuk((i + STUKKEN.length - 1) % STUKKEN.length));
    stuk.querySelector('.kk-volgende').addEventListener('click', () => toonStuk((i + 1) % STUKKEN.length));
    stuk.hidden = false;
    zaal.classList.add('leest');
    stuk.scrollTop = 0;
    zaal.scrollTop = 0;
    stuk.classList.remove('in'); void stuk.offsetWidth; stuk.classList.add('in');
    if (window.Geluid && Geluid.kaart) Geluid.kaart();
    const kop = stuk.querySelector('h2');
    if (kop) { kop.setAttribute('tabindex', '-1'); kop.focus({ preventScroll: true }); }
  }
  function terug() {
    const was = open;
    open = null;
    const stuk = zaal.querySelector('.kk-stuk');
    stuk.hidden = true;
    zaal.classList.remove('leest');
    const knoppen = zaal.querySelectorAll('.kk-vitrine');
    if (was !== null && knoppen[was]) knoppen[was].focus({ preventScroll: false });
  }

  window.Kunstkamer = {
    start() {
      if (!gebouwd) bouw();
      if (open !== null) terug();
      zaal.scrollTop = 0;
    },
    stop() { open = null; },
    _stukken: STUKKEN.map((s) => s.id),
    _toon(id) { const i = STUKKEN.findIndex((s) => s.id === id); if (i >= 0) toonStuk(i); }
  };
})();
