/* =========================================================
   NEWJEANS — Restaurant | Interactions
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', function () {
    if (!preloader) return;
    setTimeout(function () {
      preloader.classList.add('is-done');
      document.body.style.overflow = '';
    }, 600);
  });
  document.body.style.overflow = 'hidden';

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (window.scrollY > 24) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  navToggle.addEventListener('click', function () {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('.nav-link')) {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });

  /* ---------- Scroll spy (active nav link) ---------- */
  const navLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);
  const spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (l) {
        l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { spy.observe(s); });

  /* ---------- Lenis smooth scroll (paybox-style luxury) ---------- */
  if (window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    document.documentElement.classList.add('lenis');
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;

    /* anchor link -> lenis.scrollTo */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const id = a.getAttribute('href');
        if (id.length <= 1) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72, duration: 1.2 });
      });
    });

    /* sync scroll spy + header dengan lenis */
    let headerTick = false;
    lenis.on('scroll', function () {
      if (headerTick) return;
      headerTick = true;
      requestAnimationFrame(function () {
        const y = lenis.scroll || 0;
        const header = document.querySelector('.site-header');
        if (header) header.classList.toggle('is-scrolled', y > 60);
        headerTick = false;
      });
    });
  }

  /* ---------- Reveal on scroll (paybox-style: blur + easeOutExpo) ---------- */
  const revealables = document.querySelectorAll(
    '.section-head, .about-media, .about-content, .feature, .dish-card, .testi-card, .contact-card, .form-card, .video-frame, .reserve-info, .marquee, .filmstrip'
  );
  revealables.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--delay', (i % 4) * 90 + 'ms');
  });
  const revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
  revealables.forEach(function (el) { revealObs.observe(el); });

  /* ---------- Menu filter ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const dishCards = document.querySelectorAll('.dish-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      dishCards.forEach(function (card) {
        const show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- Toast ---------- */
  const toastStack = document.getElementById('toastStack');
  function toast(title, msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<strong></strong><span></span>';
    t.querySelector('strong').textContent = title;
    t.querySelector('span').textContent = msg;
    toastStack.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-leaving');
      setTimeout(function () { t.remove(); }, 320);
    }, 3600);
  }

  /* ---------- Order buttons ---------- */
  document.querySelectorAll('.dish-order').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const name = btn.closest('.dish-card').querySelector('.dish-name').textContent;
      toast('Ditambahkan ke pesanan', name + ' telah ditambahkan ke pesanan anda.');
    });
  });

  /* ---------- Promo video ---------- */
  const promo = document.getElementById('promoVideo');
  const playBtn = document.getElementById('promoPlayBtn');
  playBtn.addEventListener('click', function () {
    promo.play();
    playBtn.classList.add('is-hidden');
  });
  promo.addEventListener('pause', function () {
    playBtn.classList.remove('is-hidden');
  });
  promo.addEventListener('play', function () {
    playBtn.classList.add('is-hidden');
  });

  /* ---------- Reservation form ---------- */
  const form = document.getElementById('reserveForm');
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('date');
  dateInput.min = today;
  dateInput.value = today;

  function setErr(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('is-invalid', Boolean(msg));
    field.querySelector('.err').textContent = msg || '';
  }

  const rules = {
    date: function (v) { return v ? '' : 'silakan pilih tanggal'; },
    time: function (v) { return v ? '' : 'silakan pilih waktu'; },
    guests: function (v) { return v ? '' : 'silakan pilih jumlah tamu'; },
    name: function (v) { return v.trim().length >= 2 ? '' : 'nama terlalu pendek'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'masukkan email yang valid'; }
  };

  Object.keys(rules).forEach(function (id) {
    const input = document.getElementById(id);
    input.addEventListener('blur', function () { setErr(input, rules[id](input.value)); });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) {
        setErr(input, rules[id](input.value));
      }
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let ok = true;
    Object.keys(rules).forEach(function (id) {
      const input = document.getElementById(id);
      const msg = rules[id](input.value);
      setErr(input, msg);
      if (msg) ok = false;
    });
    if (!ok) {
      toast('Periksa formulir', 'Silakan perbaiki kolom yang ditandai.');
      return;
    }
    const name = document.getElementById('name').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const guests = document.getElementById('guests').value;
    toast('Reservasi terkonfirmasi', guests + ' tamu · ' + date + ' pukul ' + time + '. Detail dikirim ke ' + name + '.');
    form.reset();
    dateInput.value = today;
  });

  /* ---------- Newsletter ---------- */
  const newsletter = document.getElementById('newsletterForm');
  if (newsletter) {
    newsletter.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = newsletter.querySelector('input[type="email"]');
      const v = input.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) {
        input.classList.add('is-invalid');
        toast('Periksa formulir', 'Masukkan alamat email yang valid.');
        input.focus();
        return;
      }
      input.classList.remove('is-invalid');
      toast('Berlangganan', 'Terima kasih! Info musiman akan dikirim ke ' + v + '.');
      input.value = '';
    });
    newsletter.querySelector('input[type="email"]').addEventListener('input', function () {
      this.classList.remove('is-invalid');
    });
  }

  /* ---------- Filmstrip counter + scroll-driven auto advance ---------- */
  const fstrip = document.querySelector('.filmstrip-frames');
  const fcount = document.querySelector('.filmstrip-count');
  if (fstrip && fcount) {
    const frames = fstrip.querySelectorAll('.frame');
    const pad = String(frames.length).padStart(2, '0');
    let fTicking = false;
    function updateCount() {
      const center = fstrip.scrollLeft + fstrip.clientWidth / 2;
      let idx = 0;
      let best = Infinity;
      frames.forEach(function (fr, i) {
        const mid = fr.offsetLeft + fr.offsetWidth / 2;
        const d = Math.abs(mid - center);
        if (d < best) { best = d; idx = i; }
      });
      fcount.textContent = String(idx + 1).padStart(2, '0') + ' / ' + pad;
      fTicking = false;
    }
    fstrip.addEventListener('scroll', function () {
      if (fTicking) return;
      fTicking = true;
      requestAnimationFrame(updateCount);
    }, { passive: true });

    /* auto-gulir: scroll halaman scrub strip (bawah/atas, dua arah) */
    let userInteracting = false;
    let interactTimer = null;
    let scrubRaf = false;
    const maxScroll = function () { return Math.max(0, fstrip.scrollWidth - fstrip.clientWidth); };

    function scrubStrip() {
      scrubRaf = false;
      if (userInteracting) return;
      const rect = fstrip.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      /* progress 0 saat strip masuk dari bawah viewport, 1 saat keluar di atas */
      const total = rect.height + vh;
      const p = Math.min(Math.max((vh - rect.top) / total, 0), 1);
      const max = maxScroll();
      if (max <= 0) return;
      const target = max * p;
      if (Math.abs(fstrip.scrollLeft - target) < 1) return;
      fstrip.style.scrollSnapType = 'none';
      fstrip.scrollLeft = target;
      updateCount();
      requestAnimationFrame(function () { fstrip.style.scrollSnapType = ''; });
    }
    function scheduleScrub() {
      if (scrubRaf) return;
      scrubRaf = true;
      requestAnimationFrame(scrubStrip);
    }
    /* sinkron: lenis + native scroll */
    if (window.__lenis) window.__lenis.on('scroll', scheduleScrub);
    window.addEventListener('scroll', scheduleScrub, { passive: true });
    window.addEventListener('resize', scheduleScrub);
    /* interaksi manual: hanya gesture horizontal (trackpad swipe / drag) yang pause scrub.
       wheel vertikal tetap jadi scroll halaman biasa, gak di-takeover. */
    fstrip.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) markUser();
    }, { passive: true });
    fstrip.addEventListener('touchstart', markUser, { passive: true });
    fstrip.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      markUser();
    }, { passive: true });

    function markUser() {
      userInteracting = true;
      fstrip.classList.add('is-user');
      clearTimeout(interactTimer);
      interactTimer = setTimeout(function () {
        userInteracting = false;
        fstrip.classList.remove('is-user');
        scheduleScrub();
      }, 1200);
    }
    scheduleScrub();
    updateCount();
  }

  /* ---------- Back to top ---------- */
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', function () {
    backTop.classList.toggle('is-visible', window.scrollY > 480);
  }, { passive: true });
  backTop.addEventListener('click', function () {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Footer year ---------- */
  const yr = document.querySelector('.footer-bottom p');
  if (yr) yr.innerHTML = '&copy; ' + new Date().getFullYear() + ' NewJeans Restoran. Hak cipta dilindungi.';
})();
