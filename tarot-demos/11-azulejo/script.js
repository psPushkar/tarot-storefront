
(function () {
  document.body.classList.add('preloading');
  const preloader = document.querySelector('[data-preloader]');
  const finishLoad = () => {
    if (!preloader) return;
    preloader.classList.add('is-done');
    document.body.classList.remove('preloading');
    setTimeout(() => preloader.remove(), 850);
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finishLoad();
  else window.addEventListener('load', () => setTimeout(finishLoad, 900), { once: true });

  const nav = document.querySelector('[data-nav]');
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (nav) nav.classList.toggle('nav--hidden', current > lastScroll && current > 160);
    document.documentElement.style.setProperty('--scroll', String(current));
    lastScroll = current;
  }, { passive: true });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const mx = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const my = (event.clientY - rect.top - rect.height / 2) * 0.16;
        el.style.setProperty('--mx', mx.toFixed(1) + 'px');
        el.style.setProperty('--my', my.toFixed(1) + 'px');
      });
      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }

  document.querySelectorAll('[data-fake-submit]').forEach((button) => {
    button.addEventListener('click', () => {
      const note = document.querySelector('[data-form-note]');
      if (note) note.textContent = 'Demo only: the booking request is held on this page and is not submitted.';
    });
  });
})();
