(function () {
  function waitForPostHog(callback) {
    if (window.posthog && window.posthog.__loaded) {
      callback();
    } else {
      var interval = setInterval(function () {
        if (window.posthog && window.posthog.__loaded) {
          clearInterval(interval);
          callback();
        }
      }, 100);
    }
  }

  function getSocialPlatform(href) {
    if (href.indexOf('instagram.com') !== -1) return 'instagram';
    if (href.indexOf('linkedin.com') !== -1) return 'linkedin';
    if (href.indexOf('x.com') !== -1 || href.indexOf('twitter.com') !== -1) return 'x';
    return 'unknown';
  }

  function getNavLinkLabel(href) {
    if (href.indexOf('#abou-us-hero') !== -1) return 'about_us';
    if (href.indexOf('#our-services') !== -1) return 'our_services';
    if (href.indexOf('case-studies') !== -1) return 'case_study';
    if (href === '/' || href === '/index.html') return 'home';
    if (href.indexOf('legal') !== -1) return 'legal';
    return href;
  }

  function getTextContent(el) {
    var text = el.textContent || el.innerText || '';
    return text.trim().slice(0, 100);
  }

  function getSection(el) {
    var sections = ['call-to-action', 'our-services', 'services', 'abou-us-hero', 'faq', 'testimonials'];
    var parent = el;
    while (parent && parent !== document.body) {
      for (var i = 0; i < sections.length; i++) {
        if (parent.id === sections[i]) return sections[i];
      }
      parent = parent.parentElement;
    }
    return null;
  }

  function setupClickTracking() {
    document.body.addEventListener('click', function (e) {
      var el = e.target;
      while (el && el !== document.body) {
        var href = el.getAttribute('href');

        // CTA button clicks — use data-cta="true"
        if (el.getAttribute('data-cta') === 'true' || el.closest('[data-cta="true"]')) {
          var ctaEl = el.getAttribute('data-cta') === 'true' ? el : el.closest('[data-cta="true"]');
          window.posthog.capture('cta_clicked', {
            button_text: getTextContent(ctaEl),
            href: ctaEl.getAttribute('href') || null,
            section: getSection(ctaEl)
          });
          break;
        }

        // Social link clicks
        if (href && (
          href.indexOf('instagram.com') !== -1 ||
          href.indexOf('linkedin.com') !== -1 ||
          href.indexOf('x.com') !== -1 ||
          href.indexOf('twitter.com') !== -1
        )) {
          window.posthog.capture('social_link_clicked', {
            platform: getSocialPlatform(href),
            href: href
          });
          break;
        }

        // Navigation link clicks
        if (href && (
          href.indexOf('#') !== -1 ||
          href === '/' ||
          href.indexOf('case-studies') !== -1
        ) && href.indexOf('instagram') === -1 && href.indexOf('linkedin') === -1 && href.indexOf('x.com') === -1) {
          window.posthog.capture('nav_link_clicked', {
            label: getNavLinkLabel(href),
            href: href
          });
          break;
        }

        // FAQ expand — use .faq-question class
        if (el.classList.contains('faq-question') || el.closest('.faq-question')) {
          var faqEl = el.classList.contains('faq-question') ? el : el.closest('.faq-question');
          window.posthog.capture('faq_expanded', {
            question_text: getTextContent(faqEl)
          });
          break;
        }

        el = el.parentElement;
      }
    }, true);
  }

  function setupCTASectionObserver() {
    var ctaSection = document.getElementById('call-to-action');
    if (!ctaSection || !window.IntersectionObserver) return;
    var observed = false;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !observed) {
          observed = true;
          window.posthog.capture('cta_section_viewed', { section_id: 'call-to-action' });
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(ctaSection);
  }

  function setupYouTubeTracking() {
    var iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
    if (!iframe) return;
    var src = iframe.src;
    if (src.indexOf('enablejsapi') === -1) {
      iframe.src = src + (src.indexOf('?') !== -1 ? '&' : '?') + 'enablejsapi=1';
    }
    var played = false;
    window.addEventListener('message', function (e) {
      if (played) return;
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'onStateChange' && data.info === 1) {
          played = true;
          window.posthog.capture('video_played', { video_id: 'pM2i3qycVdk', platform: 'youtube' });
        }
      } catch (err) {}
    });
  }

  waitForPostHog(function () {
    setupClickTracking();
    setupCTASectionObserver();
    setupYouTubeTracking();
  });
})();
