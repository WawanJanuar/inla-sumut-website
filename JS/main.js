/* ============================================
   INLA SUMUT — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── LOADER ─────────────────────────────── */
  const loader = document.getElementById('loaderOverlay');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 1100);
  }

  /* ─── SCROLL PROGRESS BAR ────────────────── */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      progressBar.style.width = ((scrolled / maxScroll) * 100) + '%';
    }, { passive: true });
  }

  /* ─── NAVBAR SCROLL BEHAVIOR ─────────────── */
  const navbar = document.querySelector('.custom-navbar');
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Active nav link based on current page
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.custom-navbar .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes(currentPath) || (currentPath === 'index.html' && href === '#' ))) {
        link.classList.add('active');
      }
    });
  }

  /* ─── BACK TO TOP ───────────────────────── */
  const backTop = document.getElementById('backToTop');
  if (backTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backTop.classList.add('visible');
      } else {
        backTop.classList.remove('visible');
      }
    }, { passive: true });
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─── AOS INIT ──────────────────────────── */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 70,
      delay: 0,
    });
  }

  /* ─── TYPED.JS ──────────────────────────── */
  const typedEl = document.getElementById('typed-text');
  if (typedEl && typeof Typed !== 'undefined') {
    new Typed('#typed-text', {
      strings: [
        'Building harmony between people and nature.',
        'Membangun dunia yang harmonis.',
        'Bersama sebagai satu keluarga.',
        'Spreading love through arts and culture.',
      ],
      typeSpeed: 46,
      backSpeed: 28,
      loop: true,
      backDelay: 2200,
      startDelay: 600,
      smartBackspace: true,
    });
  }

  /* ─── GSAP HERO ENTRANCE ────────────────── */
  if (typeof gsap !== 'undefined' && document.querySelector('.hero-badge')) {
    gsap.registerPlugin(ScrollTrigger);

    const heroTl = gsap.timeline({ delay: 1.0 });
    heroTl
      .from('.hero-badge', {
        y: -24, opacity: 0, duration: 0.6, ease: 'back.out(2)'
      })
      .from('.hero-title', {
        y: 55, opacity: 0, duration: 0.9, ease: 'power3.out'
      }, '-=0.25')
      .from('.hero-subtitle', {
        y: 38, opacity: 0, duration: 0.7, ease: 'power2.out'
      }, '-=0.45')
      .from('.hero-desc', {
        y: 28, opacity: 0, duration: 0.65, ease: 'power2.out'
      }, '-=0.35')
      .from('.hero-buttons .btn-explore, .hero-buttons .btn-learn', {
        y: 22, opacity: 0, stagger: 0.16, duration: 0.55, ease: 'back.out(1.5)'
      }, '-=0.25')
      .from('.hero-scroll-indicator', {
        y: 12, opacity: 0, duration: 0.5
      }, '-=0.1');

    // Parallax on hero bg
    gsap.to('.hero-section', {
      backgroundPositionY: '25%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });
  }

  /* ─── GSAP BANNER ENTRANCE (sub-pages) ───── */
  if (typeof gsap !== 'undefined' && document.querySelector('.banner-title')) {
    gsap.from('.banner-tag',      { y: -20, opacity: 0, duration: 0.6, ease: 'back.out(2)',   delay: 0.3 });
    gsap.from('.banner-title',    { y:  50, opacity: 0, duration: 0.85, ease: 'power3.out',   delay: 0.5 });
    gsap.from('.banner-subtitle', { y:  32, opacity: 0, duration: 0.7,  ease: 'power2.out',   delay: 0.7 });
    gsap.from('.banner-btns .btn-outline-light, .banner-btns .btn-primary-green', {
      y: 20, opacity: 0, stagger: 0.15, duration: 0.55, ease: 'back.out(1.5)', delay: 0.85
    });

    // Slow zoom-in on banner background
    const bannerBg = document.querySelector('.hero-banner-bg');
    if (bannerBg) {
      setTimeout(() => {
        document.querySelector('.hero-banner')?.classList.add('in-view');
      }, 100);
    }
  }

  /* ─── COUNTER ANIMATION ─────────────────── */
  const counters = document.querySelectorAll('.counter-number');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const startTime = performance.now();

        const update = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(easedProgress * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(update);
          else el.textContent = target + suffix;
        };
        requestAnimationFrame(update);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  }

  /* ─── LIGHTBOX ──────────────────────────── */
  const lightboxOverlay = document.getElementById('lightbox');
  if (lightboxOverlay) {
    const lightboxImg     = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
    let currentIndex = 0;

    const open = (index) => {
      currentIndex = index;
      const trigger = triggers[currentIndex];
      const src     = trigger.dataset.src || trigger.querySelector('img')?.src || '';
      const caption = trigger.dataset.caption || '';
      lightboxImg.src = src;
      if (lightboxCaption) lightboxCaption.textContent = caption;
      if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${triggers.length}`;
      lightboxOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      lightboxOverlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => { lightboxImg.src = ''; }, 350);
    };

    const navigate = (dir) => {
      currentIndex = (currentIndex + dir + triggers.length) % triggers.length;
      lightboxImg.style.opacity = '0';
      setTimeout(() => {
        open(currentIndex);
        lightboxImg.style.opacity = '1';
      }, 220);
    };

    lightboxImg.style.transition = 'opacity 0.22s ease';

    triggers.forEach((el, i) => el.addEventListener('click', () => open(i)));

    document.getElementById('lightboxClose')?.addEventListener('click', close);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => navigate(-1));
    document.getElementById('lightboxNext')?.addEventListener('click', () => navigate(1));

    lightboxOverlay.addEventListener('click', e => { if (e.target === lightboxOverlay) close(); });

    document.addEventListener('keydown', e => {
      if (!lightboxOverlay.classList.contains('active')) return;
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   navigate(-1);
      if (e.key === 'ArrowRight')  navigate(1);
    });
  }

  /* ─── PAGE TRANSITIONS ──────────────────── */
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel')) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 380);
    });
  });

  /* ─── CURSOR GLOW ───────────────────────── */
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', e => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  /* ─── GALLERY FILTER (activities) ──────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.filterable');
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        galleryItems.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            item.style.animation = 'fadeInUp 0.5s ease';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ─── SMOOTH SCROLL FOR HASH LINKS ─────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─── MARQUEE PAUSE ON HOVER ────────────── */
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeTrack.addEventListener('mouseleave', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }

  /* ─── ANIMATED UNDERLINES ON SCROLL ─────── */
  const underlines = document.querySelectorAll('.animated-underline');
  if (underlines.length) {
    const ul = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.6 });
    underlines.forEach(el => ul.observe(el));
  }

});
