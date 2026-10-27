/*
 * Cookie consent (§ 25 TDDDG / GDPR).
 * PostHog and the Meta Pixel are only loaded after the visitor clicks "Accept".
 * The choice is stored in localStorage; any element with
 * [data-consent-settings] reopens the banner so consent can be withdrawn.
 */
(function () {
  // v2: Meta Pixel added, so earlier choices (PostHog only) are asked again.
  var STORAGE_KEY = 'seba-consent-v2';
  var POSTHOG_KEY = 'phc_kMrTAFRdN4yGF4y9gftGfP48Y4ALhppD3tS6Xz2KP8qi';
  var POSTHOG_OPTIONS = { api_host: 'https://eu.i.posthog.com', defaults: '2026-01-30' };
  var META_PIXEL_ID = '4428283004052309';
  var banner = null;

  function getChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function startAnalytics() {
    var ph = window.posthog;
    if (!ph || ph.__loaded || typeof ph.init !== 'function') return;
    ph.init(POSTHOG_KEY, POSTHOG_OPTIONS);
  }

  // Meta Pixel Code
  function startMetaPixel() {
    if (window.fbq) return;
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  // End Meta Pixel Code

  function startTracking() {
    startAnalytics();
    startMetaPixel();
  }

  function clearAnalytics() {
    try {
      if (window.posthog && window.posthog.__loaded) window.posthog.opt_out_capturing();
    } catch (e) {}
    var host = location.hostname;
    var parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('ph_') !== 0 && name !== '_fbp' && name !== '_fbc') return;
      domains.forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
    });
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('ph_') === 0 || k.indexOf('__ph') === 0) localStorage.removeItem(k);
      });
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf('ph_') === 0 || k.indexOf('__ph') === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('consent-styles')) return;
    var css =
      '#consent-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
      'background:#0a0a0a;color:#d4d4d4;border:1px solid #262626;border-radius:16px;padding:20px;' +
      'font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.55;box-shadow:0 10px 40px rgba(0,0,0,.5)}' +
      '#consent-banner p{margin:0 0 16px}' +
      '#consent-banner a{color:#fff;text-decoration:underline;text-underline-offset:2px}' +
      '#consent-banner .consent-title{color:#fff;font-weight:600;font-size:15px;margin-bottom:6px}' +
      '#consent-banner .consent-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '#consent-banner button{flex:1 1 140px;padding:10px 16px;border-radius:999px;font:inherit;font-weight:600;cursor:pointer;' +
      'background:#fff;color:#000;border:1px solid #fff}' +
      '#consent-banner button:hover{background:#e5e5e5}' +
      '#consent-banner button:focus-visible{outline:2px solid #fff;outline-offset:2px}';
    var style = document.createElement('style');
    style.id = 'consent-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function closeBanner() {
    if (banner) { banner.remove(); banner = null; }
  }

  function decide(value) {
    var previous = getChoice();
    setChoice(value);
    closeBanner();
    if (value === 'granted') {
      startTracking();
    } else {
      clearAnalytics();
      // PostHog and the Meta Pixel cannot be unloaded once running; reload to stop them.
      if (previous === 'granted') location.reload();
    }
  }

  function showBanner() {
    if (banner) return;
    injectStyles();
    banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie settings');
    banner.innerHTML =
      '<div class="consent-title">Analytics and advertising cookies</div>' +
      '<p>With your consent, we use PostHog analytics (hosted in the EU) to see how visitors use this site, and the Meta Pixel ' +
      '(Meta Platforms Ireland) to measure and improve our ads on Facebook and Instagram. Both store cookies on your device. ' +
      'You can change your choice at any time via "Cookie settings" in the footer. ' +
      '<a href="/legal/privacy-policy.html#analytics">Privacy policy</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" data-consent="denied">Reject</button>' +
      '<button type="button" data-consent="granted">Accept</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (btn) decide(btn.getAttribute('data-consent'));
    });
    document.body.appendChild(banner);
  }

  window.sebaConsent = { open: showBanner };

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-consent-settings]');
    if (trigger) { e.preventDefault(); showBanner(); }
  });

  function init() {
    var choice = getChoice();
    if (choice === 'granted') startTracking();
    else if (choice !== 'denied') showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
