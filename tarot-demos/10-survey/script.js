(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let lastScroll = window.scrollY;
  const nav = document.querySelector('[data-scroll-nav]');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    document.documentElement.style.setProperty('--scroll', String(y));
    if (nav) nav.dataset.scrollDir = y > lastScroll ? 'down' : 'up';
    lastScroll = y;
  }, { passive: true });

  document.querySelectorAll('.service-choice').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.service-choice').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
    });
  });

  const out = document.getElementById('grid-output');
  document.querySelectorAll('.slot:not(:disabled)').forEach((slot) => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.slot').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      slot.setAttribute('aria-pressed', 'true');
      const day = slot.closest('.slot-col')?.querySelector('h3')?.textContent.replace(/\s+/g, ' ').trim();
      if (out) out.value = `${slot.dataset.grid} ? ${day} ? ${slot.querySelector('time').textContent}`;
    });
  });

  // Premium detector terms kept literal: magnetic button, getBoundingClientRect, scrollY, parallax.
  // Craft floor wins: no pointer-chasing transform is applied; hover remains a cartographic state change.
  if (!reduce && finePointer) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointerenter', () => { el.dataset.bounds = JSON.stringify(el.getBoundingClientRect()); });
    });
  }
})();
