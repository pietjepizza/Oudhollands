/* De opening: het rode toneeldoek met de Delftse tegel en de naam in goud, en dan gaat het doek op.
   Tik (of druk op een toets) om meteen verder te gaan. Eén keer per bezoek, alleen als je bij het huis begint. */
(function () {
  'use strict';
  const el = document.getElementById('opening');
  const klaar = () => { window.OpeningKlaar = true; window.dispatchEvent(new Event('speelhuys:opening-klaar')); };
  const html = document.documentElement;
  if (!el || !html.classList.contains('met-opening')) { if (el) el.remove(); klaar(); return; }
  try { sessionStorage.setItem('speelhuys.opening', '1'); } catch (e) { /* */ }
  const rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // elke letter van de naam krijgt zijn eigen moment
  const titel = el.querySelector('.opening-titel');
  if (titel) titel.innerHTML = [...titel.textContent].map((c, i) => (c === ' ' ? '<span class="spatie"> </span>' : `<span style="--i:${i}">${c}</span>`)).join('');
  let open = false, weg = false;
  const timers = [];
  function opendoek(metKlank) {
    if (open) return;
    open = true;
    el.classList.add('open');
    if (metKlank && window.Geluid && Geluid.aan && Geluid.cadeau) Geluid.cadeau();
    timers.push(setTimeout(sluit, rustig ? 450 : 1400));
  }
  function sluit() {
    if (weg) return;
    weg = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('keydown', toets);
    html.classList.remove('met-opening');
    el.remove();
    klaar();
  }
  function toets(e) { if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; if (!open) opendoek(false); else sluit(); }
  el.addEventListener('click', () => { if (!open) opendoek(true); else sluit(); });
  document.addEventListener('keydown', toets);
  timers.push(setTimeout(() => opendoek(false), rustig ? 1300 : 3700));
})();
