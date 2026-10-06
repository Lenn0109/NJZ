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
    '.section-head, .about-media, .about-content, .feature, .menu-tgroup, .testi-card, .contact-card, .form-card, .video-frame, .reserve-info, .marquee, .filmstrip'
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
  const menuTgroups = document.querySelectorAll('.menu-tgroup');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      menuTgroups.forEach(function (group) {
        const show = f === 'all' || group.dataset.cat === f;
        group.classList.toggle('is-hidden', !show);
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

  /* ---------- Order buttons → keranjang (cart) ---------- */
  const cart = { items: [] };

  const cartList = document.getElementById('cartList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFoot = document.getElementById('cartFoot');
  const cartBadge = document.getElementById('cartBadge');
  const orderNote = document.getElementById('orderNote');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartService = document.getElementById('cartService');
  const cartTotal = document.getElementById('cartTotal');
  const orderSubmit = document.getElementById('orderSubmit');

  function rupiah(n) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  }
  function parseHarga(txt) {
    return parseInt(String(txt).replace(/[^0-9]/g, ''), 10) || 0;
  }

  function renderCart() {
    const n = cart.items.length;
    const totalQty = cart.items.reduce(function (a, b) { return a + b.qty; }, 0);
    const subtotal = cart.items.reduce(function (a, b) { return a + b.price * b.qty; }, 0);
    const service = Math.round(subtotal * 0.1);

    cartEmpty.hidden = n > 0;
    cartList.hidden = n === 0;
    cartFoot.hidden = n === 0;
    cartBadge.textContent = totalQty + ' item';
    cartSubtotal.textContent = rupiah(subtotal);
    cartService.textContent = rupiah(service);
    cartTotal.textContent = rupiah(subtotal + service);

    if (n === 0) {
      cartList.innerHTML = '';
      orderNote.textContent = 'Keranjang masih kosong.';
      orderSubmit.disabled = true;
      return;
    }
    orderSubmit.disabled = false;
    orderNote.textContent = totalQty + ' item · ' + rupiah(subtotal + service) + ' (termasuk layanan)';

    cartList.innerHTML = cart.items.map(function (it, i) {
      return '<li class="cart-item">' +
        '<span class="cart-item-name">' + it.name + '</span>' +
        '<span class="cart-item-price">' + rupiah(it.price) + '</span>' +
        '<span class="cart-item-meta">' +
          '<span class="cart-qty">' +
            '<button type="button" data-act="dec" data-i="' + i + '" aria-label="Kurangi ' + it.name + '">&minus;</button>' +
            '<span>' + it.qty + '</span>' +
            '<button type="button" data-act="inc" data-i="' + i + '" aria-label="Tambah ' + it.name + '">+</button>' +
          '</span>' +
          '<span class="cart-item-sub">' + rupiah(it.price * it.qty) + '</span>' +
          '<button type="button" class="cart-remove" data-act="del" data-i="' + i + '">hapus</button>' +
        '</span>' +
      '</li>';
    }).join('');
  }

  /* tombol +/- / hapus di dalam keranjang (event delegation) */
  if (cartList) {
    cartList.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const i = +btn.dataset.i;
      const act = btn.dataset.act;
      if (act === 'inc') cart.items[i].qty += 1;
      else if (act === 'dec') {
        cart.items[i].qty -= 1;
        if (cart.items[i].qty <= 0) cart.items.splice(i, 1);
      } else if (act === 'del') cart.items.splice(i, 1);
      renderCart();
    });
  }

  const cartClear = document.getElementById('cartClear');
  if (cartClear) {
    cartClear.addEventListener('click', function () {
      cart.items = [];
      renderCart();
      toast('Keranjang dikosongkan', 'Semua item dihapus dari pesanan.');
    });
  }

  /* tombol "tambah" di tabel menu */
  document.querySelectorAll('.dish-order').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const row = btn.closest('tr');
      if (!row) return;
      const cells = row.children;
      const name = cells[1] ? cells[1].textContent.trim() : 'menu';
      const price = parseHarga(cells[3] ? cells[3].textContent : '0');

      const found = cart.items.find(function (it) { return it.name === name; });
      if (found) found.qty += 1;
      else cart.items.push({ name: name, price: price, qty: 1 });

      renderCart();
      toast('Masuk keranjang', name + ' · qty ' + (found ? found.qty : 1));
      btn.classList.add('is-added');
      setTimeout(function () { btn.classList.remove('is-added'); }, 700);
    });
  });

  renderCart();

  /* ---------- Pesan: time select + validasi + submit ---------- */
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    const oDate = document.getElementById('oDate');
    const oTime = document.getElementById('oTime');
    const oService = document.getElementById('oService');
    const oAddress = document.getElementById('oAddress');
    const todayISO = new Date().toISOString().split('T')[0];
    oDate.min = todayISO;
    oDate.value = todayISO;

    /* isi opsi waktu dari jam buka, tiap 30 menit */
    (function fillTimes() {
      const slots = [];
      function add(h, m) { slots.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')); }
      for (let h = 10; h <= 21; h++) { add(h, 0); if (h < 21) add(h, 30); }
      oTime.innerHTML = '<option value="">pilih waktu</option>' + slots.map(function (t) {
        return '<option value="' + t + '">' + t + '</option>';
      }).join('');
    })();

    function setOrderErr(input, msg) {
      const field = input.closest('.field');
      field.classList.toggle('is-invalid', Boolean(msg));
      const err = field.querySelector('.err');
      if (err) err.textContent = msg || '';
    }

    const orderRules = {
      oName: function (v) { return v.trim().length >= 2 ? '' : 'nama terlalu pendek'; },
      oPhone: function (v) { return v.replace(/[^0-9]/g, '').length >= 9 ? '' : 'nomor telepon tidak valid'; },
      oEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'masukkan email yang valid'; },
      oDate: function (v) { return v ? '' : 'silakan pilih tanggal'; },
      oTime: function (v) { return v ? '' : 'silakan pilih waktu'; },
      oGuests: function (v) { return v ? '' : 'silakan pilih jumlah tamu'; },
      oService: function (v) { return v ? '' : 'silakan pilih layanan'; },
      oAddress: function (v) {
        if (oService.value === 'delivery') return v.trim().length >= 8 ? '' : 'wajib isi alamat lengkap';
        return '';
      }
    };

    Object.keys(orderRules).forEach(function (id) {
      const input = document.getElementById(id);
      input.addEventListener('blur', function () { setOrderErr(input, orderRules[id](input.value)); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('is-invalid')) {
          setOrderErr(input, orderRules[id](input.value));
        }
      });
      input.addEventListener('change', function () {
        if (id === 'oService') setOrderErr(oAddress, orderRules.oAddress(oAddress.value));
      });
    });

    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (cart.items.length === 0) {
        toast('Keranjang kosong', 'Tambahkan minimal satu menu sebelum mengirim.');
        return;
      }
      let ok = true;
      Object.keys(orderRules).forEach(function (id) {
        const input = document.getElementById(id);
        const msg = orderRules[id](input.value);
        setOrderErr(input, msg);
        if (msg) ok = false;
      });
      if (!ok) {
        toast('Periksa formulir', 'Silakan perbaiki kolom yang ditandai.');
        const firstBad = orderForm.querySelector('.field.is-invalid input, .field.is-invalid select');
        if (firstBad) firstBad.focus();
        return;
      }

      /* nomor pesanan acak, format NJ-YYMMDD-XXX */
      const d = new Date(oDate.value);
      const code = 'NJ-' + String(d.getFullYear()).slice(2) +
        String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' +
        String(Math.floor(Math.random() * 900) + 100);

      const totalQty = cart.items.reduce(function (a, b) { return a + b.qty; }, 0);
      const subtotal = cart.items.reduce(function (a, b) { return a + b.price * b.qty; }, 0);
      const total = subtotal + Math.round(subtotal * 0.1);

      toast('Pesanan terkonfirmasi', code + ' · ' + totalQty + ' item · ' + rupiah(total) + '. Kitchen sudah diberi tahu.');

      cart.items = [];
      renderCart();
      orderForm.reset();
      oDate.value = todayISO;
      if (window.__lenis) window.__lenis.scrollTo(orderForm, { offset: -120, duration: 1.2 });
    });
  }

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
