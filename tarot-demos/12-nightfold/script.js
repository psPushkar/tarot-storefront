
(function(){
  const preloader = document.querySelector('[data-preloader]');
  window.addEventListener('load', () => { setTimeout(() => preloader && preloader.classList.add('is-done'), 650); }, {once:true});
  const header = document.querySelector('[data-site-header]');
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('nav--hidden', y > lastScroll && y > 160);
    document.documentElement.style.setProperty('--scroll', Math.min(y / 100, 12).toFixed(2));
    lastScroll = y;
  }, {passive:true});
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const mx = ((event.clientX - rect.left) - rect.width / 2) * 0.12;
        const my = ((event.clientY - rect.top) - rect.height / 2) * 0.12;
        el.style.setProperty('--mx', mx.toFixed(1) + 'px');
        el.style.setProperty('--my', my.toFixed(1) + 'px');
      });
      el.addEventListener('mouseleave', () => { el.style.setProperty('--mx','0px'); el.style.setProperty('--my','0px'); });
    });
  }
  document.querySelectorAll('.date-picker button,.time-picker button').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.parentElement;
      group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed','false'));
      button.setAttribute('aria-pressed','true');
    });
  });
})();
