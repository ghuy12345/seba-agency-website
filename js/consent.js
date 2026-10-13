/*
 * Cookie consent (§ 25 TDDDG / GDPR).
 * PostHog is only initialised after the visitor clicks "Accept".
 * The choice is stored in localStorage; any element with
 * [data-consent-settings] reopens the banner so consent can be withdrawn.
 */
(function () {
  var STORAGE_KEY = 'seba-consent-v1';
  var POSTHOG_KEY = 'phc_kMrTAFRdN4yGF4y9gftGfP48Y4ALhppD3tS6Xz2KP8qi';
  var POSTHOG_OPTIONS = { api_host: 'https://eu.i.posthog.com', defaults: '2026-01-30' };
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
      if (name.indexOf('ph_') !== 0) return;
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
      startAnalytics();
    } else {
      clearAnalytics();
      // PostHog cannot be fully unloaded once running; reload to stop it.
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
      '<div class="consent-title">Analytics cookies</div>' +
      '<p>With your consent, we use PostHog analytics (hosted in the EU) to see how visitors use this site. ' +
      'PostHog stores a cookie on your device. You can change your choice at any time via "Cookie settings" in the footer. ' +
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
    if (choice === 'granted') startAnalytics();
    else if (choice !== 'denied') showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
