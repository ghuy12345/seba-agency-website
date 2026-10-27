/*
 * /scale landing page behaviour:
 * - logo marquee: fills the duplicate set so the loop is seamless
 * - "Apply for the pilot": reloads the Tally embed with interest=creator-army-pilot
 * - sticky "Book a call" button (after the hero, hidden while #apply is on screen)
 * - Meta Pixel Lead on Tally.FormSubmitted
 */
(function () {
  var TALLY_FORM_ID = 'WJJMva';

  // Logo marquee — the track scrolls by -50%, so both sets must be identical and at
  // least as wide as the viewport. Repeat the logos inside the set until they are.
  function setupMarquee() {
    var sets = document.querySelectorAll('.marquee-set');
    if (sets.length < 2) return;
    var original = sets[0];
    var items = Array.prototype.slice.call(original.children);
    var guard = 0;
    while (original.scrollWidth < window.innerWidth * 1.1 && guard++ < 4) {
      items.forEach(function (li) {
        var copy = li.cloneNode(true);
        copy.className = 'is-clone';
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelector('img').alt = '';
        original.appendChild(copy);
      });
    }
    sets[1].innerHTML = original.innerHTML;
    Array.prototype.forEach.call(sets[1].querySelectorAll('img'), function (img) { img.alt = ''; });
  }

  // Smooth-scroll every #apply link (header, hero, pilot, sticky) to the form.
  function scrollToApply(e) {
    var target = document.getElementById('apply');
    if (!target) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#apply');
  }

  function setInterest(value) {
    var frame = document.getElementById('tally-apply');
    if (!frame) return;
    var current = frame.getAttribute('src') || frame.getAttribute('data-tally-src');
    var url = new URL(current);
    if (url.searchParams.get('interest') === value) return;
    url.searchParams.set('interest', value);
    frame.setAttribute('data-tally-src', url.toString());
    // Already loaded by Tally's embed.js: point the iframe at the new URL directly.
    if (frame.getAttribute('src')) frame.setAttribute('src', url.toString());
  }

  function setupApplyLinks() {
    document.querySelectorAll('a[href="#apply"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var interest = link.getAttribute('data-interest');
        if (interest) setInterest(interest);
        scrollToApply(e);
      });
    });
  }

  // Sticky CTA
  function setupStickyCta() {
    var bar = document.getElementById('sticky-cta');
    var hero = document.getElementById('hero');
    var apply = document.getElementById('apply');
    if (!bar || !hero || !apply || !('IntersectionObserver' in window)) return;
    var link = bar.querySelector('a');
    var pastHero = false;
    var applyVisible = false;

    function render() {
      var show = pastHero && !applyVisible;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      link.setAttribute('tabindex', show ? '0' : '-1');
    }

    new IntersectionObserver(function (entries) {
      var entry = entries[0];
      // Past the hero once it has left the viewport through the top.
      pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      render();
    }).observe(hero);

    new IntersectionObserver(function (entries) {
      applyVisible = entries[0].isIntersecting;
      render();
    }, { threshold: 0.05 }).observe(apply);
  }

  // Meta Pixel: Lead when the embedded Tally form is submitted.
  function trackLead(attempt) {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead');
      return;
    }
    // The pixel base code may still be loading (it comes in via Tag Manager); retry briefly.
    if ((attempt || 0) < 20) setTimeout(function () { trackLead((attempt || 0) + 1); }, 250);
  }

  function setupLeadTracking() {
    var seen = {};
    window.addEventListener('message', function (e) {
      if (typeof e.origin !== 'string' || !/^https:\/\/([a-z0-9-]+\.)*tally\.so$/.test(e.origin)) return;
      var data = e.data;
      if (typeof data === 'string') {
        if (data.indexOf('Tally.FormSubmitted') === -1) return;
        try { data = JSON.parse(data); } catch (err) { return; }
      }
      if (!data || data.event !== 'Tally.FormSubmitted') return;
      var payload = data.payload || {};
      if (payload.formId && payload.formId !== TALLY_FORM_ID) return;
      var key = payload.id || payload.respondentId || 'submission';
      if (seen[key]) return;
      seen[key] = true;
      trackLead(0);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'tally_form_submitted', form_id: TALLY_FORM_ID });
      if (window.posthog && window.posthog.__loaded) {
        window.posthog.capture('tally_form_submitted', { form_id: TALLY_FORM_ID });
      }
    });
  }

  setupMarquee();
  setupApplyLinks();
  setupStickyCta();
  setupLeadTracking();
})();
