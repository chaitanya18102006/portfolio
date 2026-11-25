/* Loading page: tracks real milestones (DOM, fonts, hero photo, content, window load),
   shows an eased percentage, then fades the loader out and releases the page animations. */
(function () {
  'use strict';
  var el = document.getElementById('loader');
  var noop = { mark: function () {} };
  if (!el || /[?&]preview=1/.test(location.search)) {      // admin preview iframe: no loader
    if (el) el.remove();
    window.KCLoader = noop;
    return;
  }

  var MIN_MS = 1100, MAX_MS = 7000;
  var weights = { dom: 15, fonts: 20, hero: 25, content: 25, load: 15 };
  var done = {}, target = 0, shown = 0, finished = false, t0 = performance.now();
  var bar = document.getElementById('loaderBar'), pct = document.getElementById('loaderPct');
  document.body.classList.add('is-loading');

  function mark(k) {
    if (!weights[k] || done[k]) return;
    done[k] = true; target = 0;
    for (var n in done) target += weights[n];
  }

  function finish() {
    if (finished) return; finished = true;
    el.classList.add('done');
    document.body.classList.remove('is-loading');           // un-pauses the hero entrance animations
    document.dispatchEvent(new Event('kc-loaded'));
    setTimeout(function () { el.remove(); }, 900);
  }

  function paint() {
    if (bar) bar.style.transform = 'scaleX(' + (shown / 100) + ')';
    if (pct) pct.textContent = Math.round(shown);
  }

  function tick() {
    if (finished) return;
    var now = performance.now();
    // ease toward the real progress; creep a little so it never looks frozen
    var goal = target < 100 ? Math.min(target, 96) : 100;
    shown += Math.max((goal - shown) * 0.08, goal > shown ? 0.12 : 0);
    if (shown > goal) shown = goal;
    paint();
    if (target >= 100 && shown >= 99.5 && now - t0 >= MIN_MS) { shown = 100; paint(); finish(); return; }
    requestAnimationFrame(tick);
  }

  // milestones
  if (document.readyState !== 'loading') mark('dom'); else document.addEventListener('DOMContentLoaded', function () { mark('dom'); });
  if (document.readyState === 'complete') mark('load'); else window.addEventListener('load', function () { mark('load'); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mark('fonts'); }, function () { mark('fonts'); });
  else mark('fonts');

  // remote content (Firebase) must not hold the page up: cached/default content is already on screen
  setTimeout(function () { mark('content'); }, 2800);

  // never trap the visitor behind the loader
  setTimeout(function () { for (var k in weights) mark(k); }, MAX_MS);
  setTimeout(function () { if (!finished) { shown = 100; paint(); finish(); } }, MAX_MS + 1500);

  window.KCLoader = { mark: mark };
  requestAnimationFrame(tick);
})();
