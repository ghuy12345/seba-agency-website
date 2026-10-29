/*
 * /creator-army pilot page behaviour:
 * - forwards utm_source / utm_campaign / utm_content to the Tally embed's hidden fields
 * - lazy-loads Tally's embed.js (once) when #apply nears the screen or an apply button is tapped
 * - smooth-scrolls every #apply link to the form
 * - fades the sticky apply button out while #apply is on screen
 * - switches the page to its closed state at CREATOR_ARMY.closesAt
 * Lead / Schedule events are NOT fired here: Tally's and Calendly's own pixel integrations send them.
 */
(function () {
  var config = window.CREATOR_ARMY;
  var frame = document.getElementById('tally-apply');
  var apply = document.getElementById('apply');
  var sticky = document.getElementById('sticky-cta');

  function isClosed() {
    return document.documentElement.classList.contains('is-closed');
  }

  // Forward the page's UTM params to the embed so Tally's hidden fields capture them.
  function forwardUtms() {
    if (!frame) return;
    var url = new URL(frame.getAttribute('data-tally-src'));
    var page = new URLSearchParams(location.search);
    ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (key) {
      var value = page.get(key);
      if (value) url.searchParams.set(key, value);
    });
    frame.setAttribute('data-tally-src', url.toString());
  }

  // Tally's widget script, injected once. It turns data-tally-src into a live iframe
  // and resizes it as the form changes height (dynamicHeight=1).
  var tallyRequested = false;
  function loadTally() {
    if (tallyRequested || !frame || isClosed()) return;
    tallyRequested = true;
    var script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    script.onload = function () {
      if (window.Tally && typeof window.Tally.loadEmbeds === 'function') window.Tally.loadEmbeds();
    };
    document.body.appendChild(script);
  }

  function setupLazyTally() {
    if (!apply) return;
    if (!('IntersectionObserver' in window)) { loadTally(); return; }
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      loadTally();
    }, { rootMargin: '800px 0px' });
    observer.observe(apply);
  }

  // Smooth-scroll every #apply link (hero, "Let's build an army", sticky) to the form.
  function setupApplyLinks() {
    document.querySelectorAll('a[href="#apply"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!apply || isClosed()) return;
        e.preventDefault();
        loadTally();
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        apply.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#apply');
      });
    });
  }

  // Sticky button: visible everywhere except while the form section is on screen.
  function setupSticky() {
    if (!sticky || !apply || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var hide = entries[0].isIntersecting;
      sticky.classList.toggle('is-hidden', hide);
      if (hide) sticky.setAttribute('tabindex', '-1');
      else sticky.removeAttribute('tabindex');
      sticky.setAttribute('aria-hidden', hide ? 'true' : 'false');
    }).observe(apply);
  }

  // If the page is open when the deadline passes, close it without a reload.
  function scheduleClose() {
    if (!config || isClosed()) return;
    var wait = Date.parse(config.closesAt) - Date.now();
    // setTimeout overflows past ~24.8 days; a page left open that long re-checks on reload.
    if (!(wait > 0) || wait > 2147483647) return;
    setTimeout(function () { document.documentElement.classList.add('is-closed'); }, wait);
  }

  forwardUtms();
  setupApplyLinks();
  setupSticky();
  setupLazyTally();
  scheduleClose();
})();
