# Het Speelhuys

Oud-Hollandse spellen om digitaal te spelen, in de sfeer van Delfts blauw en 17e-eeuwse prentborden.

**Het huis.** Je begint aan de gracht, voor een pand met een trapgevel, een gevelsteen met een gans en een uithangbord.
Via de voordeur kom je in een 17e-eeuwse kamer naar Vermeer en De Hooch: glas-in-loodraam met zonlicht en stofjes,
marmeren vloer, tegelplint, kroonluchter en een slapende kat. De spellen hangen aan de muur; klik erop en de kamer zoomt
in naar het spel. Spellen die nog niet klaar zijn hangen achter een gordijntje of liggen op tafel.

**Speelbaar in deze eerste versie**

- **Ganzenbord**: handgekleurd prentbord, 2 tot 4 spelers (mens of computer), met gans, brug, herberg, put, doolhof, gevangenis en dood.
- **Sjoelen**: houten sjoelbak met natuurkunde. 30 schijven, 3 beurten, de echte telling (20 per volle reeks, verder 2-3-4-1).
- **Molenspel**: op een ingekraste steen, tegen de computer of met z'n tweeën.

**Muziek** (knop "Muziek" rechtsboven): melodieën uit Jacob van Eyck, *Der Fluyten Lust-hof* (1649 en 1654), die de browser zelf speelt met Web Audio, op blokfluit en luit. Elke plek heeft een eigen stuk:

| Plek | Stuk | Klank |
|---|---|---|
| Tegelwand | Engels Nachtegaeltje | blokfluit |
| Ganzenbord | Malle Symen | blokfluit en trom |
| Sjoelen | Onder de Linde groene | luit |
| Molenspel | Doen Daphne d'over schoone Maeght | luit |

De composities zijn al eeuwen rechtenvrij. Er worden geen opnames gebruikt, dus er spelen ook geen rechten van uitvoerenden. De thema's zijn overgezet uit moderne edities op IMSLP (o.a. de CC0-editie van Cayo Gomes, 2024).

Nog "in de oven": dammen, klaverjassen, knikkeren, tollen, kolf op het ijs, koekhappen, hoepelen, kop van Jut en uilenspel.

## Techniek

Een statische site zonder build-stap: `index.html`, `css/stijl.css` en losse scripts in `js/`.
Lokaal draaien:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Publiceren met GitHub Pages

Settings → Pages → *Build and deployment* → Source: **Deploy from a branch**, kies de branch met deze code en map `/ (root)`.
