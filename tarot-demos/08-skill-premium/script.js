(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.querySelector('[data-header]');
  let lastScroll = window.scrollY;

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  function hideNavOnScroll() {
    const current = window.scrollY;
    if (!header) return;
    if (current > lastScroll && current > 120) header.classList.add('nav--hidden');
    else header.classList.remove('nav--hidden');
    lastScroll = current;
  }
  window.addEventListener('scroll', hideNavOnScroll, { passive: true });

  if (window.SplitType) {
    document.querySelectorAll('[data-split]').forEach((el) => {
      new SplitType(el, { types: 'words, chars', tagName: 'span' });
    });
  }

  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduce) {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.to('.preloader__text', { yPercent: -120, opacity: 0, duration: .9, delay: .35 })
        .to('.preloader__door--left', { xPercent: -101, duration: 1.15 }, '-=.35')
        .to('.preloader__door--right', { xPercent: 101, duration: 1.15 }, '<')
        .set('.preloader', { autoAlpha: 0 })
        .to('.split-heading .char', { yPercent: -120, opacity: 1, stagger: .012, duration: .72 }, '-=.55')
        .from('.lede, .hero-actions, .page-hero .eyebrow', { y: 22, opacity: 0, stagger: .08, duration: .65 }, '-=.35');

      gsap.utils.toArray('.parallax').forEach((el) => {
        const speed = parseFloat(el.dataset.speed || 0.1);
        gsap.to(el, { yPercent: speed * 100, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true } });
      });

      gsap.utils.toArray('.story-cards article, .service-card, figure, .contact-card, details, .booking-steps li').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 42, duration: .75, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
      });

      const track = document.querySelector('.horizontal-track');
      const viewport = document.querySelector('.horizontal-viewport');
      if (track && viewport) {
        const distance = () => -(track.scrollWidth - window.innerWidth + 80);
        gsap.to(track, { x: distance, ease: 'none', scrollTrigger: { trigger: '.horizontal-section', start: 'top top', end: () => '+=' + Math.max(900, track.scrollWidth), scrub: true, pin: true, invalidateOnRefresh: true } });
      }

      const panel = document.querySelector('.pin-panel');
      if (panel) {
        gsap.fromTo(panel, { opacity: .55, scale: .96 }, { opacity: 1, scale: 1, scrollTrigger: { trigger: '.pinned-story', start: 'top center', end: 'bottom center', scrub: true } });
      }
    } else {
      document.querySelectorAll('.preloader').forEach(el => el.remove());
      document.querySelectorAll('.split-heading .char').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    }
  }

  if (finePointer && !reduce) {
    const cursor = document.querySelector('.custom-cursor');
    let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2, currentX = targetX, currentY = targetY;
    window.addEventListener('mousemove', (event) => { targetX = event.clientX; targetY = event.clientY; }, { passive: true });
    function renderCursor() {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      if (cursor) cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const relX = event.clientX - rect.left - rect.width / 2;
        const relY = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate3d(${relX * 0.16}px, ${relY * 0.16}px, 0)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'translate3d(0,0,0)'; });
      el.addEventListener('blur', () => { el.style.transform = 'translate3d(0,0,0)'; });
    });
  }
})();
