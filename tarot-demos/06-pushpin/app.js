(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('is-loading');

  document.querySelectorAll('[data-split]').forEach((el) => {
    const label = el.textContent.trim();
    el.setAttribute('aria-label', label);
    el.textContent = '';
    label.split(/\s+/).forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      span.style.transitionDelay = `${index * 80}ms`;
      el.append(span, document.createTextNode(index === label.split(/\s+/).length - 1 ? '' : ' '));
    });
  });

  const load = () => {
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-loaded');
  };
  if (reduced) load(); else window.setTimeout(load, 650);

  let lastScroll = window.scrollY;
  const nav = document.querySelector('[data-nav]');
  const updateScroll = () => {
    const y = window.scrollY;
    document.documentElement.style.setProperty('--scroll', String(y));
    if (nav) nav.classList.toggle('nav--hidden', y > lastScroll && y > 140);
    lastScroll = y;
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduced && pointerFine) {
    document.querySelectorAll('[data-magnetic]').forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      button.addEventListener('mouseleave', () => { button.style.transform = ''; });
    });

    document.querySelectorAll('[data-silhouette]').forEach((svg) => {
      svg.addEventListener('pointermove', (event) => {
        const rect = svg.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
        svg.style.setProperty('--lift-x', `${x}px`);
        svg.style.setProperty('--lift-y', `${y}px`);
      });
      svg.addEventListener('pointerleave', () => {
        svg.style.setProperty('--lift-x', '0px');
        svg.style.setProperty('--lift-y', '0px');
      });
    });
  }

  const serviceValue = document.getElementById('service-value');
  document.querySelectorAll('.service-pick').forEach((button, index) => {
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    button.addEventListener('click', () => {
      document.querySelectorAll('.service-pick').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      if (serviceValue) serviceValue.value = button.querySelector('span').textContent;
    });
  });

  document.querySelectorAll('.date-row button, .time-row button').forEach((button, index) => {
    button.setAttribute('aria-pressed', index % 3 === 0 ? 'true' : 'false');
    button.addEventListener('click', () => {
      button.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
    });
  });

  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      if (status) status.textContent = 'Demo only — this booking form does not submit.';
    });
  }
})();
