(function(){
  const reveal=document.querySelectorAll('.fade-in');
  if(reveal.length){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){reveal.forEach(e=>e.classList.add('visible'));}
    else{const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('visible');io.unobserve(en.target);}})},{threshold:.12});reveal.forEach(e=>io.observe(e));}
  }
  document.querySelectorAll('.faq-question').forEach(b=>b.addEventListener('click',()=>{const a=document.getElementById(b.getAttribute('aria-controls'));const open=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!open));if(a)a.hidden=open;}));
  const sel=document.getElementById('service');
  document.querySelectorAll('.pick').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.pick').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');if(sel)sel.value=b.dataset.service;}));
  document.querySelectorAll('.slot').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');}));
})();

(function(){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=document.documentElement;
  const preloader=document.querySelector('.preloader');
  function splitHeading(){
    document.querySelectorAll('h1').forEach((h)=>{
      if(h.dataset.wordsReady)return;
      const text=h.textContent.trim();
      h.setAttribute('aria-label',text);
      h.dataset.wordsReady='true';
      h.textContent='';
      text.split(/(\s+)/).forEach((part)=>{
        if(!part)return;
        if(/\s+/.test(part)){h.appendChild(document.createTextNode(part));return;}
        const span=document.createElement('span');
        span.className='word';
        span.setAttribute('aria-hidden','true');
        span.textContent=part;
        span.style.transitionDelay=(h.querySelectorAll('.word').length*55)+'ms';
        h.appendChild(span);
      });
    });
  }
  function finishPreloader(){
    document.body.classList.add('is-loaded');
    if(preloader)setTimeout(()=>{preloader.hidden=true;},document.body.classList.contains('grimoire')?980:680);
  }
  splitHeading();
  if(reduce){ if(preloader)preloader.remove(); document.body.classList.add('is-loaded'); }
  else{
    const fonts=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();
    Promise.race([fonts,new Promise(r=>setTimeout(r,document.body.classList.contains('grimoire')?620:340))]).then(()=>requestAnimationFrame(finishPreloader));
  }
  const header=document.querySelector('.site-header');
  let lastY=window.scrollY;
  let navTimer=0;
  function setHeader(hidden){
    if(!header)return;
    header.classList.toggle('nav-hidden',hidden);
    header.style.willChange='transform';
    clearTimeout(navTimer);
    navTimer=setTimeout(()=>{header.style.willChange='';},460);
  }
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    if(Math.abs(y-lastY)>8)setHeader(y>lastY&&y>120);
    lastY=y;
  },{passive:true});
  if(!reduce){
    let ticking=false;
    function depth(){
      const y=window.scrollY;
      root.style.setProperty('--grid-y',Math.max(-8,Math.min(8,y*-0.018)).toFixed(2)+'px');
      root.style.setProperty('--mid-y',Math.max(-12,Math.min(12,y*0.018)).toFixed(2)+'px');
      root.style.setProperty('--fg-y',Math.max(-8,Math.min(8,y*-0.012)).toFixed(2)+'px');
      root.style.setProperty('--frame-y',Math.max(-7,Math.min(7,y*-0.011)).toFixed(2)+'px');
      ticking=false;
    }
    window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(depth);ticking=true;}},{passive:true});
    depth();
  }
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(fine){
    document.querySelectorAll('.button').forEach((button)=>{
      button.dataset.magnetic='true';
      const max=document.body.classList.contains('grimoire')?6:8;
      button.addEventListener('pointermove',(e)=>{
        const r=button.getBoundingClientRect();
        const x=((e.clientX-r.left)/r.width-.5)*max;
        const y=((e.clientY-r.top)/r.height-.5)*max;
        button.style.willChange='transform';
        button.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      });
      button.addEventListener('pointerleave',()=>{
        button.style.transform='translate3d(0,0,0)';
        setTimeout(()=>{button.style.willChange='';},240);
      });
    });
  }
})();
