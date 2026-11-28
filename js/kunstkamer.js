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
      muziek: 'Een Engels volksdeuntje (Mall Sims) dat in de Gouden Eeuw in heel Holland bekend was. Er zitten echo\'s in: daarom heette het ook \'de Engelse echo\'. Het huppelt van noot naar noot, zoals je gans van vak naar vak, en het is een beetje mal, net als het geluk van de dobbelstenen.',
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
      id: 'uilenspel', naam: 'Uilenspel', tegel: 'ill-uil', tijd: 'Zeventiende eeuw', kort: 'Drie stenen, vijftig vakken en een uil met de pot',
      muziek: 'Het uilenspel speelde je \'s avonds in de herberg, met een pijp en een kan bier. Daar hoort een dans bij die een beetje geheimzinnig klinkt, als een uil in het donker.',
      herkomst: [
        'Het uilenspel is een geluksspel met drie dobbelstenen op een rond bord. Het komt waarschijnlijk uit Italië, waar het <i>Pela il chiù</i> heette. In Frankrijk speelde men het als <i>Jeu de la chouette</i>.',
        'In de Nederlanden was het in de zeventiende en achttiende eeuw een geliefd spel voor volwassenen, naast het ganzenbord. Op een prent van Jan Christoffel Jegher, gedrukt tussen 1628 en 1667, zitten in de vier hoeken mensen te roken en te drinken.',
        'Later drukten Hendriksen in Rotterdam en Brepols in Turnhout het uilenspel als goedkope prent, met de regels eronder. Zo hing het ook in de huiskamer.'
      ],
      spelen: ['Iedereen legt drie penningen in de pot, bij de uil in het midden.', 'Om de beurt gooi je met drie stenen. Elk vak hoort bij één worp: daar staat of je moet betalen (B) of mag trekken (T), en hoeveel.', 'Drie gelijke stenen? Dan trek je de helft van de pot. Drie zessen: de uil! Dan is de hele pot voor jou.', 'Is de pot leeg, dan legt iedereen opnieuw in. Is de kaars op, dan wint wie de meeste penningen heeft.'],
      weetjes: ['Het bord heeft vijftig vakken: zoveel verschillende worpen kun je met drie stenen gooien, als je de zes worpen met drie gelijke niet meetelt.', 'Op de Franse borden stond een P voor <i>payer</i> (betalen) en een T voor <i>tirer</i> (trekken).', 'Op ons bord staat het oude spreekwoord: wat baten kaars en bril, als de uil niet zien wil? Wie iets niet wil zien, heeft niets aan licht of een bril.', 'Een uil en een spiegel: zo werd ook Tijl Uilenspiegel vaak getekend.'],
      kunst: [
        { titel: 'Het nieuwe tydkortige uylenspel', maker: 'Jan Christoffel Jegher, 1628–1667', url: 'https://www.rijksmuseum.nl/en/collection/object/Het-nieuwe-tydkortige-uylenspel--0ea74a32e305c51c8e534ad6a16b4e0a', waar: 'Rijksmuseum' },
        { titel: 'Het uilenbord / Jeu de la chouette', maker: 'Brepols & Dierckx zoon, Turnhout, 1833–1911', url: 'https://www.rijksmuseum.nl/en/collection/RP-P-OB-202.154', waar: 'Rijksmuseum' },
        { titel: 'Bordspel Nieuw Uilenspel', maker: 'Rotterdam, 1812–1849', url: 'https://www.collectiegelderland.nl/nederlandsopenluchtmuseum/object/4512ca7e-64cd-54ed-b285-b06553238e80', waar: 'Nederlands Openluchtmuseum' },
        { titel: 'Nouveau jeu de la chouette', maker: 'Jean Crépy, omstreeks 1720–1730', url: 'https://essentiels.bnf.fr/fr/image/d4988541-2616-4cb0-a29f-b77a3db0ab6f-nouveau-jeu-la-chouette', waar: 'Bibliothèque nationale de France' }
      ],
      bronnen: [
        { tekst: 'Uilenspel (Canon van Nederland)', url: 'https://www.canonvannederland.nl/nl/page/232265/uilenspel' },
        { tekst: 'Le Jeu de la Chouette, XVIIIe siècle (Musées de Poissy)', url: 'https://musees.ville-poissy.fr/fr/objet-du-mois/le-jeu-de-la-chouette-xviiie-siecle' },
        { tekst: 'Het Uilenbord, N.226 (Nederlands Openluchtmuseum)', url: 'https://www.collectiegelderland.nl/nederlandsopenluchtmuseum/object/9d47f1e6-ec3b-590d-91ea-8daf74b6d7b6' }
      ]
    },
    {
      id: 'sjoelen', naam: 'Sjoelen', tegel: 'ill-sjoelbak', tijd: 'Nederland, negentiende eeuw', kort: 'Houten schijven over een gladde bak de poortjes in',
      muziek: 'Een oud lied over de groene linde, dat Van Eyck voor de blokfluit bewerkte. Hier speelt het klavecimbel het: rustige, gelijke noten, schuif na schuif, zoals de schijven over de bak glijden.',
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
      muziek: 'Een Engels lied over de nimf Daphne, die wegvlucht voor de god Apollo (When Daphne did from Phoebus fly). In Holland zong iedereen het. Een ernstige melodie in mineur, voor een spel waarbij je goed moet nadenken en, net als Daphne, je stenen moet zien te redden.',
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
      muziek: 'De gavotte was een deftige dans aan het hof. Rustig en bedachtzaam, op de luit: zo heb je tijd om je volgende zet te bedenken.',
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
      muziek: 'Gezellig, zoals Opoe het graag heeft aan tafel. Je hoort de één-twee-drie van kaarten die op tafel vallen, slag na slag.',
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
      muziek: 'Een gaillarde gaat met vijf passen en een sprong, zoals stenen die over het bord springen. In mineur en een beetje spannend, want met dobbelstenen weet je nooit hoe het afloopt.',
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
      muziek: 'De melodie huppelt op en neer als het balletje, en de tabortrom tikt als de bikkels op de stoep.',
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
      muziek: 'Een wals glijdt rond, zoals schaatsers op het ijs. Het klavecimbel speelt hem, zoals in een deftig huis aan de gracht op een winteravond.',
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
      muziek: 'Koekhappen doe je op de kermis, en daar hoort het draaiorgel bij. Een polka is kort en huppelend: hap, hap, mis!',
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
      id: 'hoepelen', naam: 'Hoepelen', tegel: 'ill-hoepel', tijd: 'Sinds de oudheid', kort: 'Een hoepel, een stok, en rennen maar',
      muziek: 'De noten rollen rond als een hoepel over de klinkers, en de tabortrom klinkt als klompen op straat.',
      herkomst: [
        'Een hoepel en een stok: meer had je niet nodig. In het oude Griekenland en Rome hoepelden kinderen al; de Romeinen noemden de hoepel trochus.',
        'Vaak was het een oude band van een ton, van hout of van ijzer. Met een stokje hield je hem aan het rollen.',
        'In de zeventiende eeuw zag je hoepelende kinderen overal: op Delftse tegels, op prenten en op schilderijen. Op de Kinderspelen van Pieter Bruegel (1560) rennen ze met hun hoepel door de straat.'
      ],
      spelen: ['Je geeft de hoepel een tik met je stok, zodat hij blijft rollen.', 'Rolt hij te langzaam, dan gaat hij wiebelen en valt hij om.', 'Je kunt een race houden: wie het eerst bij de brug is, wint.', 'Of je stuurt hem zo lang mogelijk door de straat, om alles heen wat in de weg staat.'],
      weetjes: ['Sommige hoepels hadden belletjes of plaatjes, die rinkelden als ze rolden.', 'De lantaarns langs de gracht in het spel zijn van Jan van der Heyden. Hij was schilder en uitvinder: in 1669 kreeg Amsterdam zijn olielampen op palen.', 'Gesina ter Borch tekende rond 1675 haar neefjes Gerrit en Cornelis Schellinger; een van hen heeft een hoepel.'],
      kunst: [
        { titel: 'De kinderspelen', maker: 'Pieter Bruegel de Oude, 1560', url: 'https://en.wikipedia.org/wiki/Children%27s_Games_(Bruegel)', waar: 'Kunsthistorisches Museum, Wenen' },
        { titel: 'Tegel met een jongen met een hoepel', maker: 'Tweede kwart zeventiende eeuw', url: 'https://www.lakenhal.nl/en/collection/z-n-611', waar: 'Museum De Lakenhal, Leiden' },
        { titel: 'Tegel met een jongen met hoepel en stok', maker: 'Tweede helft zeventiende eeuw', url: 'https://www.lakenhal.nl/en/collection/10087', waar: 'Museum De Lakenhal, Leiden' },
        { titel: 'Gerrit en Cornelis Schellinger als kinderen', maker: 'Gesina ter Borch, omstreeks 1675-1685', url: 'https://www.rijksmuseum.nl/en/stories/get-ready--get-set--draw/story/a-very-personal-drawing', waar: 'Rijksmuseum, Amsterdam' }
      ],
      bronnen: [
        { tekst: 'Hoop rolling (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Hoop_rolling' },
        { tekst: 'Hoop and hook (Amgueddfa Cymru, Museum Wales)', url: 'https://museum.wales/traditional_toys/hoop_and_hook' },
        { tekst: 'Children\'s Games van Bruegel (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Children%27s_Games_(Bruegel)' },
        { tekst: 'Tegels met hoepelende jongens (Museum De Lakenhal)', url: 'https://www.lakenhal.nl/en/collection/z-n-611' },
        { tekst: 'A very personal drawing (Rijksmuseum)', url: 'https://www.rijksmuseum.nl/en/stories/get-ready--get-set--draw/story/a-very-personal-drawing' },
        { tekst: 'Jan van der Heyden and the dawn of efficient street lights (JSTOR Daily)', url: 'https://daily.jstor.org/jan-van-der-heyden-and-the-dawn-of-efficient-street-lights/' }
      ]
    },
    {
      id: 'vliegeren', naam: 'Vliegeren', tegel: 'ill-vlieger', tijd: 'Sinds de zeventiende eeuw', kort: 'Papier, twee latjes en een lang touw',
      muziek: 'Licht en luchtig, voor een dag in de wind op het stoppelveld: de blokfluit zweeft boven de luit, zoals je vlieger boven het veld.',
      herkomst: [
        'Vliegers komen uit Azië: in China liet men ze al meer dan tweeduizend jaar geleden op. Hoe de platte vlieger van papier naar Europa kwam, weet niemand precies; misschien met zeelieden en handelaars.',
        'Een van de vroegste afbeeldingen van een vlieger in de Nederlanden staat in het <i>Kinder-spel</i> van Jacob Cats (Middelburg, 1618). Op de prent naar Adriaen van de Venne spelen kinderen op het plein voor het Hof van Zeeland, en hoog boven hen staat een vlieger.',
        'Bij Cats is elk kinderspel ook een les voor grote mensen. Op latere prenten werd de vlieger zelfs een beeld voor de staat.',
        'Vroeger was de nazomer de tijd om te vliegeren: na de oogst lagen de velden open en stond er wind. Dan stonden de vliegers boven de stoppels.'
      ],
      spelen: ['Een kruisvlieger maak je van twee latjes, een touw eromheen en papier eroverheen, met een staart van papieren strikjes.', 'Met de wind in je rug laat je hem opstijgen. Vier je touw, dan gaat hij verder weg; haal je in, dan klimt hij steiler.', 'In een windvlaag moet je niet hard trekken, anders knapt het touw en waait je vlieger weg.', 'Wie het hoogst staat, wint. En wie durft, stuurt een papiertje langs het touw naar boven.'],
      weetjes: ['Zo\'n papiertje langs het touw heette in Brabant een bode en in Brugge een verzendertje. De wind duwt het omhoog tot bij de vlieger.', 'De staart houdt de vlieger recht. Zonder staart tolt hij rond en duikt hij naar beneden.', 'In het spel zie je een windvlaag aankomen als een donkere strook over het veld, met windkrullen zoals op de oude prenten.'],
      kunst: [
        { titel: 'Kinder-spel, uit het boek van Jacob Cats', maker: 'Naar Adriaen van de Venne (1618); deze druk 1655', url: 'https://artsandculture.google.com/asset/print-book-out-of-trifles-children-s-games-seriousness-kinder-spel/JgFZZ-k3Ul0faA', waar: 'The Strong National Museum of Play' },
        { titel: 'Kinderen aan het vliegeren', maker: 'Joseph Antoine Cochet, omstreeks 1645-1670', url: 'https://www.rijksmuseum.nl/en/collection/RP-P-1911-759', waar: 'Rijksmuseum, Amsterdam' }
      ],
      bronnen: [
        { tekst: 'De vlieger als terugkerend beeld in de Nederlandse cultuur (Neerlandistiek)', url: 'https://neerlandistiek.nl/2020/11/de-vlieger-als-terugkerend-beeld-in-de-nederlandse-cultuur/' },
        { tekst: 'The Kite of State (Early Modern Low Countries)', url: 'https://emlc-journal.org/article/view/7152' },
        { tekst: 'Kites (Cotsen Children\'s Library, Princeton)', url: 'https://static-prod.lib.princeton.edu/cotsen/exhibitions2/Kites/Kites1.html' },
        { tekst: 'Biekorf, jaargang 37 (1931): boden en verzendertjes', url: 'https://dbnl.org/tekst/_bie001193101_01/_bie001193101_01_0070.php' }
      ]
    },
    {
      id: 'ringsteken', naam: 'Ringsteken', tegel: 'ill-draaimolen', tijd: 'Eeuwenoud, en nog steeds', kort: 'In volle vaart met je lans door de ring',
      muziek: 'Bij de draaimolen stond altijd een draaiorgel: dit is de muziek waarbij je je rondjes rijdt, en bij elke ronde komt de ring weer langs.',
      herkomst: [
        'Ringsteken en ringrijden zijn eeuwenoud. Een ruiter komt in volle vaart aanrijden en probeert met een lans of een houten stok een kleine ring te steken die aan een galg hangt.',
        'Op Walcheren werd het ringrijden vroeger op alle dorpen gehouden, ter gelegenheid van de kermis. In Zeeland en in Enkhuizen doen ze het nog steeds.',
        'Het woord carrousel komt van de ruitertoernooien uit de zeventiende eeuw, waar ook ringgestoken werd. Later kwamen er draaimolens met houten paarden, eerst om te oefenen en daarna voor de kermis. Op oude draaimolens hing soms een arm met ringen die je in het voorbijrijden kon pakken.'
      ],
      spelen: ['Je rijdt op een houten paard in de draaimolen. Aan een galg naast de molen hangt een ring.', 'Elk rondje kom je er één keer langs. Steek je lans uit op het goede moment, dan schuift de ring erop.', 'Een gouden ring telt drie keer.', 'Na tien rondjes wint wie de meeste ringen heeft.'],
      weetjes: ['Het woord kermis komt van kerkmis: het feest van de wijding van de kerk.', 'Volgens het Guinness Book of Records staat de oudste draaimolen die nog draait in de Efteling: de Vermolen uit 1865. Maar in het Duitse Hanau draait sinds 2016 weer een draaimolen uit 1780.', 'In Laren steken ze op Koningsdag ringen vanuit een rijtuigje: cabriolet-ringsteken.'],
      kunst: [
        { titel: 'Draaimolen', maker: 'Willem de Zwart, omstreeks 1890-1924', url: 'https://www.rijksmuseum.nl/en/collection/object/Draaimolen--95609ed63d39a52c05c0928a629fec6d', waar: 'Rijksmuseum, Amsterdam' },
        { titel: 'Perspectivische Vorstellung eines Jahrmarckts oder Kirchweyh (een kermis)', maker: 'Martin Engelbrecht, tweede helft achttiende eeuw', url: 'https://www.lakenhal.nl/en/collection/3126-93', waar: 'Museum De Lakenhal, Leiden' }
      ],
      bronnen: [
        { tekst: 'Carousel (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Carousel' },
        { tekst: 'The dizzy history of carousels begins with knights (Smithsonian)', url: 'https://www.smithsonianmag.com/smart-news/dizzy-history-carousels-begins-knights-180964100/' },
        { tekst: 'Ringrijden op Walcheren, ter gelegenheid der kermis (DBNL)', url: 'https://www.dbnl.org/tekst/vinc014wati01_01/vinc014wati01_01_0012.php' },
        { tekst: 'Eeuwenoude volksvermaak ringsteken nog altijd populair in Enkhuizen (NH Nieuws)', url: 'https://www.nhnieuws.nl/nieuws/308626/eeuwenoude-volksvermaak-ringsteken-nog-altijd-populair-in-enkhuizen' },
        { tekst: 'Cabriolet-ringsteken: een Larense traditie op Koningsdag (NH Nieuws)', url: 'https://www.nhnieuws.nl/nieuws/318148/cabriolet-ringsteken-een-larense-traditie-op-koningsdag' },
        { tekst: 'Oldest operating carousel (Guinness World Records)', url: 'https://www.guinnessworldrecords.com/world-records/76321-oldest-operating-carousel' }
      ]
    },
    {
      id: 'kopvanjut', naam: 'Kop van Jut', tegel: 'ill-jut', tijd: 'Sinds de jaren 1870', kort: 'Sla zo hard je kan: ding!',
      muziek: 'Precies goed voor de sterke mannen op de kermis, die met de moker laten zien hoe hard ze kunnen slaan. De grote trom slaat mee.',
      herkomst: [
        'De kop van Jut is een krachtmeter op de kermis. Je slaat met een zware houten hamer op een blok, en een slee schiet langs een hoge paal omhoog. Sla je hard genoeg, dan klinkt bovenin de bel.',
        'De naam komt van Hendrik Jut. In 1872 pleegde hij in Den Haag een beruchte roofmoord. Toen hij in 1876 terechtstond, was het hele land boos, en kermisbazen boden een kop van Jut aan: een houten kop waar je met een hamer op mocht slaan. Zo gaat het verhaal; helemaal zeker is het niet.'
      ],
      spelen: ['Houd je vinger op het veld: je tilt de zware moker op.', 'Laat los als hij helemaal boven is: dan sla je het hardst en schiet de slee het hoogst.', 'Raak je de bel, dan krijg je honderd punten. Bij een perfecte slag vliegt de hoed van de kop: honderdvijfentwintig.', 'Vijf slagen elk: wie bij elkaar het hoogst komt, wint.'],
      weetjes: ['De kop van Jut zijn betekent: de zondebok zijn, degene die overal de schuld van krijgt.', 'Op een prent uit de negentiende eeuw staat een groepje jongens bij de kop van Jut; één van hen staat klaar om te slaan.'],
      kunst: [
        { titel: 'Prent met voorstelling van de kop van Jut', maker: 'Anoniem, tweede helft negentiende eeuw', url: 'https://www.lakenhal.nl/en/collection/z-n-334', waar: 'Museum De Lakenhal, Leiden' }
      ],
      bronnen: [
        { tekst: 'Hendrik Jut (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Hendrik_Jut' },
        { tekst: 'Waar is de kop van Jut gebleven? (Joop, BNNVARA)', url: 'https://www.bnnvara.nl/joop/artikelen/waar-is-de-kop-van-jut-gebleven' },
        { tekst: 'Prent met voorstelling van de kop van Jut (Museum De Lakenhal)', url: 'https://www.lakenhal.nl/en/collection/z-n-334' }
      ]
    },
    {
      id: 'knikkeren', naam: 'Knikkeren', tegel: 'ill-knikkers', tijd: 'Eeuwenoud', kort: 'Een potje in het zand',
      muziek: 'De snaren van het klavecimbel worden aangetokkeld: korte, heldere tikjes, als knikkers die tegen elkaar ketsen en wegrollen.',
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
      muziek: 'In drie tellen, met noten die om en om draaien: zo blijft de muziek bewegen zolang je tol draait.',
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
    },
    {
      id: 'muziek', naam: 'De muziek', tegel: 'ill-muziek', tijd: 'Gouden Eeuw, en later', kort: 'Wat je hoort in Het Speelhuys, en waarom',
      herkomst: [
        'In Het Speelhuys heeft elke plek en elk spel een eigen stuk. Er klinkt geen opname: een klein ensemble zoals in de zeventiende eeuw speelt alles zelf, in je telefoon of computer. De blokfluit en de luit spelen de melodie, de viola da gamba strijkt de bas, de cister tokkelt, het klavecimbel tikt en de tabortrom slaat de maat.',
        'Vier melodieën komen van Jacob van Eyck (rond 1590-1657). Hij was blind, stadsbeiaardier van Utrecht en de grootste klokkenkenner van zijn tijd. Volgens de verhalen speelde hij \'s avonds blokfluit voor de wandelaars op het Janskerkhof.',
        'Zijn stukken staan in <i>Der Fluyten Lust-hof</i> (Amsterdam, 1644-1656): bekende liedjes, vaak uit Engeland, met daarna variaties waarin de noten steeds sneller worden. Het is het grootste werk voor één blaasinstrument uit de Europese geschiedenis.',
        'De andere stukken zijn nieuw, in de trant van toen: dansen, menuetten, een gaillarde en een gavotte. Op zolder speelt een speeldoos en op de kermis een draaiorgel; die kwamen pas later, rond 1800 en in de negentiende eeuw.'
      ],
      plekken: [
        ['straat', 'De gracht', 'Een vrolijk haakje dat in je hoofd blijft hangen (do, do-re, mi, do): zo word je welkom geheten aan de gracht, en zo herken je het huis.'],
        ['voorkamer', 'De voorkamer', 'Deftig en rustig, zoals een nette voorkamer met een kroonluchter en spellen aan de muur.'],
        ['zolder', 'De zolder', 'Zacht en een beetje dromerig, zoals een oud speeldoosje dat je tussen het speelgoed onder de balken terugvindt.'],
        ['pronkkamer', 'De pronkkamer', 'Hier staan je prijzen achter glas: daar hoort plechtige muziek bij, alsof je met je zilver binnenkomt.'],
        ['kunstkamer', 'De Kunstkamer', 'De blokfluit zingt als een nachtegaal, met trillers en loopjes: een van de bekendste stukken van Van Eyck, om rustig bij te lezen.'],
        ['kermis', 'De kermis', 'Met klokkenspel, grote trom en bekken: zo klonk de kermis, al van ver.']
      ],
      weetjes: ['Elk stuk komt in ronden: eerst de melodie, dan een variatie met snellere noten, en dan de melodie op een ander instrument. Zo deed Van Eyck het ook.', 'De begeleiding wordt per stuk bedacht, zoals een speler aan het klavecimbel dat vroeger deed: bij elke maat het akkoord dat het best bij de melodie past.', 'Vlak voor het slot van een deel klinkt een triller, en het tempo vertraagt een tikje, zoals echte musici dat doen.'],
      kunst: [
        { titel: 'Jonge fluitspeler', maker: 'Judith Leyster, omstreeks 1630-1635', url: 'https://collection.nationalmuseum.se/en/collection/item/18123/', waar: 'Nationalmuseum, Stockholm' },
        { titel: 'Jonge vrouw met een luit', maker: 'Johannes Vermeer, omstreeks 1662-1665', url: 'https://metmuseum.org/toah/works-of-art/25.110.24', waar: 'Metropolitan Museum of Art, New York' }
      ],
      bronnen: [
        { tekst: 'Jacob van Eyck (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Jacob_van_Eyck' },
        { tekst: 'Der Fluyten Lust-hof (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Der_Fluyten_Lust-hof' },
        { tekst: 'Proefschrift over Jacob van Eyck (Universiteit Utrecht)', url: 'https://dspace.library.uu.nl/handle/1874/9195' },
        { tekst: 'Louis Peter Grijp, Het Nederlandse lied in de Gouden Eeuw (DBNL)', url: 'https://dbnl.org/tekst/grij001nede01_01/grij001nede01_01_0042.php' }
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

  // ---------- De muziek: welk stuk, waar het vandaan komt, wie het speelt, en luisteren ----------
  const INSTRUMENT = { blokfluit: 'blokfluit', luit: 'luit', klavecimbel: 'klavecimbel' };
  function bezettingVan(st) {
    if (st.stijl === 'orgel') return 'draaiorgel';
    if (st.stijl === 'speeldoos') return 'speeldoos';
    const l = [INSTRUMENT[st.melodie] || st.melodie];
    if (st.stijl === 'klavier') l.push('klavecimbel');
    if (st.stijl === 'dans') { l.push('cister'); if (st.gamba) l.push('viola da gamba'); if (st.trom) l.push('tabortrom'); }
    if (st.stijl === 'arpeggio' || st.stijl === 'menuet') { if (st.klokjes) l.push('klokjes'); l.push('luit', 'viola da gamba'); }
    const u = Array.from(new Set(l));
    return u.length > 1 ? u.slice(0, -1).join(', ') + ' en ' + u[u.length - 1] : u[0];
  }
  const stukVan = (naam) => (window.Muziek && Muziek.stukken[naam]) || null;
  let luisterNaar = null;   // het stuk dat je hier aanzette (null: het eigen stuk van de Kunstkamer)
  function luisterKnop(naam, wat) {
    const aan = luisterNaar === naam && window.Muziek && Muziek.aan;
    return `<button class="kk-luister${aan ? ' speelt' : ''}" type="button" data-stuk="${naam}" aria-pressed="${aan}" aria-label="Luister naar ${esc(wat)}">${icoon('muziek')}<span>${aan ? 'Speelt nu' : 'Luister'}</span></button>`;
  }
  function stukRegel(naam, wat, uitleg) {
    const st = stukVan(naam);
    if (!st) return '';
    // de instrumenten noemen we niet nog eens als de beschrijving ze al noemt
    const bez = bezettingVan(st), al = bez.split(/, | en /).every((i) => st.bron.toLowerCase().includes(i));
    return `<div class="kk-stukregel">${luisterKnop(naam, st.titel)}<div><p class="kk-stuktitel">${wat ? `<span class="kk-plek">${esc(wat)}</span>` : ''}<b>${esc(st.titel)}</b></p><p class="kk-stukbron">${esc(st.bron)}.${al ? '' : ` Gespeeld op ${esc(bez)}.`}</p>${uitleg ? `<p>${esc(uitleg)}</p>` : ''}</div></div>`;
  }
  function werkLuisterknoppen() {
    if (!zaal) return;
    zaal.querySelectorAll('.kk-luister').forEach((b) => {
      const aan = b.dataset.stuk === luisterNaar && window.Muziek && Muziek.aan;
      b.classList.toggle('speelt', !!aan);
      b.setAttribute('aria-pressed', String(!!aan));
      b.querySelector('span').textContent = aan ? 'Speelt nu' : 'Luister';
    });
  }
  function luister(naam) {
    if (!window.Muziek) return;
    if (luisterNaar === naam && Muziek.aan) { luisterNaar = null; Muziek.kies('kunstkamer'); werkLuisterknoppen(); return; }
    luisterNaar = naam;
    Muziek.kies(naam);
    // staat de muziek uit, dan zet deze knop hem aan (je vroeg erom)
    if (!Muziek.aan) { const k = document.getElementById('knop-muziek'); if (k) k.click(); }
    werkLuisterknoppen();
  }
  function terugNaarEigenMuziek() {
    if (luisterNaar === null) return;
    luisterNaar = null;
    if (window.Muziek && location.hash === '#kunstkamer') Muziek.kies('kunstkamer');
  }
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
            <h3>${s.plekken ? 'Waar komt de muziek vandaan?' : 'Waar komt het vandaan?'}</h3>
            ${s.herkomst.map((p) => `<p>${p}</p>`).join('')}
            ${s.spelen ? `<h3>Zo speel je het</h3>${lijstje(s.spelen.map(esc))}` : ''}
            ${s.plekken ? `<section class="kk-muziek"><h3>Wat je waar hoort</h3>${s.plekken.map(([naam, wat, uitleg]) => stukRegel(naam, wat, uitleg)).join('')}
              <h3>En in de spellen</h3>${STUKKEN.filter((x) => x.muziek).map((x) => stukRegel(x.id, x.naam, '')).join('')}</section>` : ''}
            ${s.muziek ? `<section class="kk-muziek"><h3>De muziek in het spel</h3>${stukRegel(s.id, '', s.muziek)}</section>` : ''}
            ${s.weetjes.length ? `<div class="kk-weetje"><h3>Wist je dat?</h3>${s.weetjes.map((w) => `<p>${esc(w)}</p>`).join('')}</div>` : ''}
            <h3 class="kk-bron-kop">Bronnen</h3>
            <ul class="kk-bronnen">${s.bronnen.map((b) => `<li><a href="${b.url}" target="_blank" rel="noopener">${esc(b.tekst)}</a></li>`).join('')}</ul>
            ${s.plekken ? '' : `<a class="kk-naar-spel" href="#${s.id}">${icoon('pijl')}<span>Zelf ${esc(s.naam.toLowerCase())} spelen in Het Speelhuys</span></a>`}
          </div>
        </div>
        <nav class="kk-blader" aria-label="Bladeren">
          <button class="kk-vorige" type="button">${icoon('pijl', 'kk-links')}<span>${esc(vorige.naam)}</span></button>
          <button class="kk-volgende" type="button"><span>${esc(volgende.naam)}</span>${icoon('pijl')}</button>
        </nav>
      </div>`;
    stuk.querySelector('.kk-terug').addEventListener('click', terug);
    stuk.querySelectorAll('.kk-luister').forEach((b) => b.addEventListener('click', () => luister(b.dataset.stuk)));
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
    terugNaarEigenMuziek();
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
    stop() { open = null; luisterNaar = null; },
    _stukken: STUKKEN.map((s) => s.id),
    _toon(id) { const i = STUKKEN.findIndex((s) => s.id === id); if (i >= 0) toonStuk(i); }
  };
})();
