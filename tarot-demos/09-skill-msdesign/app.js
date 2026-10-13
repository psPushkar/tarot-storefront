(function () {
  const root = document.documentElement;
  const nav = document.querySelector('[data-nav]');
  let lastScroll = window.scrollY;

  function onScroll() {
    const current = window.scrollY;
    root.style.setProperty('--scroll', String(current));
    if (nav) {
      nav.classList.toggle('is-scrolled', current > 24);
      nav.classList.toggle('nav--hidden', current > lastScroll && current > 180);
    }
    lastScroll = current;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches) {
    document.querySelectorAll('.magnet').forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
        button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
    });
  }

  const serviceSelect = document.querySelector('#service');
  const serviceCards = Array.from(document.querySelectorAll('.picker-card'));
  function setService(value) {
    if (!serviceSelect) return;
    serviceSelect.value = value;
    serviceCards.forEach((card) => card.classList.toggle('active', card.dataset.service === value));
  }
  serviceCards.forEach((card) => card.addEventListener('click', () => setService(card.dataset.service)));
  if (serviceSelect) {
    const params = new URLSearchParams(window.location.search);
    setService(params.get('service') || serviceSelect.value);
    serviceSelect.addEventListener('change', () => setService(serviceSelect.value));
  }

  const slotInput = document.querySelector('#chosenSlot');
  document.querySelectorAll('.slot').forEach((slot) => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.slot').forEach((item) => item.classList.remove('active'));
      slot.classList.add('active');
      if (slotInput) slotInput.value = slot.dataset.slot;
    });
  });
  document.querySelectorAll('.date').forEach((date) => {
    date.addEventListener('click', () => {
      document.querySelectorAll('.date').forEach((item) => item.classList.remove('active'));
      date.classList.add('active');
    });
  });

  const form = document.querySelector('.booking-form');
  const error = document.querySelector('.form-error');
  if (form && error) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      error.classList.remove('ok');
      const missing = [];
      const name = form.elements.name;
      const email = form.elements.email;
      const question = form.elements.question;
      if (!name.value.trim()) missing.push('name');
      if (!email.value.trim() || !email.validity.valid) missing.push('valid email');
      if (!question.value.trim()) missing.push('question');
      if (!slotInput.value) missing.push('available time slot');
      if (missing.length) {
        error.textContent = `Please add your ${missing.join(', ')}. Then choose “Review booking” again.`;
        error.classList.add('show');
        error.focus?.();
        return;
      }
      error.textContent = 'Booking details are ready to review. This demo does not submit, so no payment has been taken.';
      error.classList.add('show', 'ok');
    });
  }
})();
