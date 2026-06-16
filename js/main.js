(function () {
  // AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });

  // Mobile nav
  var menuBtn = document.getElementById('menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { mobileMenu.classList.remove('open'); });
    });
  }

  // Testimonial carousel
  var track = document.querySelector('.testimonial-track');
  var slides = track ? track.children : [];
  var current = 0;
  function goTo(n) {
    if (!track || slides.length === 0) return;
    current = (n + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    document.querySelectorAll('.dot').forEach(function (d, i) {
      d.classList.toggle('bg-white', i === current);
      d.classList.toggle('bg-white/30', i !== current);
    });
  }
  document.querySelectorAll('[data-prev]').forEach(function (btn) {
    btn.addEventListener('click', function () { goTo(current - 1); });
  });
  document.querySelectorAll('[data-next]').forEach(function (btn) {
    btn.addEventListener('click', function () { goTo(current + 1); });
  });
  document.querySelectorAll('.dot').forEach(function (dot, i) {
    dot.addEventListener('click', function () { goTo(i); });
  });
})();
