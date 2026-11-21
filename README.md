# Het Speelhuys

Oud-Hollandse spellen om digitaal te spelen, in de sfeer van Delfts blauw en 17e-eeuwse prentborden.

**Speelbaar in deze eerste versie**

- **Ganzenbord**: handgekleurd prentbord, 2 tot 4 spelers (mens of computer), met gans, brug, herberg, put, doolhof, gevangenis en dood.
- **Sjoelen**: houten sjoelbak met natuurkunde. 30 schijven, 3 beurten, de echte telling (20 per volle reeks, verder 2-3-4-1).
- **Molenspel**: op een ingekraste steen, tegen de computer of met z'n tweeën.

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
