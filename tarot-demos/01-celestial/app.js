(function(){
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function resolvePreloader(){
    const loader=document.querySelector('.preloader');
    if(!loader)return;
    if(reduced){loader.remove();return;}
    const fonts=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();
    const timeout=new Promise(resolve=>setTimeout(resolve,220));
    Promise.race([fonts,timeout]).then(()=>requestAnimationFrame(()=>{
      loader.classList.add('is-done');
      setTimeout(()=>loader.remove(),360);
    }));
  }

  function splitHeadlines(){
    document.querySelectorAll('h1').forEach(heading=>{
      if(heading.dataset.wordsReady)return;
      const text=heading.textContent.trim().replace(/\s+/g,' ');
      heading.dataset.wordsReady='true';
      heading.setAttribute('aria-label',text);
      heading.classList.add('word-cascade');
      heading.innerHTML=text.split(' ').map((word,index)=>`<span aria-hidden="true" style="--word-index:${index}">${word}</span>`).join(' ');
    });
  }

  const navToggle=document.querySelector('.nav-toggle'),navLinks=document.querySelector('.nav-links'),header=document.querySelector('.site-header');
  if(navToggle&&navLinks){navToggle.addEventListener('click',()=>{const open=navLinks.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));header&&header.classList.remove('is-hidden');});}

  function setupScrollNav(){
    if(!header)return;
    let lastY=window.scrollY,ticking=false,clearWill;
    const update=()=>{
      const y=window.scrollY;
      const menuOpen=navLinks&&navLinks.classList.contains('is-open');
      header.classList.toggle('is-scrolled',y>12);
      if(!menuOpen){
        if(y>lastY+8&&y>120)header.classList.add('is-hidden');
        else if(y<lastY-6)header.classList.remove('is-hidden');
      }
      lastY=y;
      ticking=false;
      clearTimeout(clearWill);
      clearWill=setTimeout(()=>{header.style.willChange='';},160);
    };
    window.addEventListener('scroll',()=>{
      header.style.willChange='transform';
      if(!ticking){requestAnimationFrame(update);ticking=true;}
    },{passive:true});
  }

  function setupReveal(){
    const revealItems=document.querySelectorAll('[data-reveal]');
    if(reduced||!('IntersectionObserver'in window)){revealItems.forEach(i=>i.classList.add('is-visible'));return;}
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12});
    revealItems.forEach(i=>observer.observe(i));
  }

  function setupSelectors(){
    document.querySelectorAll('.date-pill, .slot').forEach(button=>{button.addEventListener('click',()=>{const group=button.classList.contains('date-pill')?'.date-pill':'.slot';document.querySelectorAll(group).forEach(peer=>peer.classList.remove('is-selected'));button.classList.add('is-selected');});});
    const firstDate=document.querySelector('.date-pill'),firstSlot=document.querySelector('.slot');if(firstDate)firstDate.classList.add('is-selected');if(firstSlot)firstSlot.classList.add('is-selected');
    const form=document.querySelector('.booking-form');if(form)form.addEventListener('submit',event=>event.preventDefault());
  }

  function setupMagnetic(){
    if(!finePointer)return;
    document.querySelectorAll('.hero .button.primary,.closing-cta .button.primary').forEach(button=>{
      button.classList.add('is-magnetic');
      button.addEventListener('pointermove',event=>{
        const rect=button.getBoundingClientRect();
        const dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
        const distance=Math.hypot(dx,dy);
        const pull=Math.max(0,1-distance/180)*.18;
        button.style.willChange='transform';
        button.style.transform=`translate3d(${dx*pull}px,${dy*pull}px,0)`;
      });
      button.addEventListener('pointerleave',()=>{button.style.transform='';setTimeout(()=>{button.style.willChange='';},220);});
    });
  }

  function setupParallax(){
    if(reduced)return;
    const layers=[];
    [['#starfield',.035],['.hero-glow',.07],['.orbital-plate',.12]].forEach(([selector,depth])=>{
      document.querySelectorAll(selector).forEach(el=>{el.dataset.parallax='';layers.push({el,depth});});
    });
    if(!layers.length)return;
    let ticking=false,clearWill;
    const update=()=>{
      const y=window.scrollY;
      layers.forEach(({el,depth})=>{
        const rect=el.getBoundingClientRect();
        const center=rect.top+rect.height/2-window.innerHeight/2;
        const offset=Math.max(-18,Math.min(18,(center+y)*depth*.02));
        el.style.setProperty('--parallax-y',offset.toFixed(2)+'px');
      });
      ticking=false;
      clearTimeout(clearWill);
      clearWill=setTimeout(()=>layers.forEach(({el})=>{el.style.willChange='';}),180);
    };
    const request=()=>{layers.forEach(({el})=>{el.style.willChange='transform';});if(!ticking){requestAnimationFrame(update);ticking=true;}};
    window.addEventListener('scroll',request,{passive:true});
    window.addEventListener('resize',request,{passive:true});
    request();
  }

  function setupPointerAtmosphere(){
    if(reduced||!finePointer)return;
    let ticking=false,lastEvent=null,clearWill;
    document.addEventListener('pointermove',event=>{lastEvent=event;if(ticking)return;ticking=true;requestAnimationFrame(()=>{
      const x=(lastEvent.clientX/window.innerWidth-.5)*8;const y=(lastEvent.clientY/window.innerHeight-.5)*8;
      document.querySelectorAll('.parallax-scene').forEach((el,index)=>{const depth=index?-.35:.22;el.style.willChange='transform';el.style.transform=`translate3d(${x*depth}px, ${y*depth}px, 0)`;});
      clearTimeout(clearWill);clearWill=setTimeout(()=>document.querySelectorAll('.parallax-scene').forEach(el=>{el.style.willChange='';}),180);
      ticking=false;
    });},{passive:true});
  }

  function setupStarfield(){
    const canvas=document.getElementById('starfield');if(!canvas||reduced)return;const ctx=canvas.getContext('2d');let width=0,height=0,stars=[],raf;
    function resize(){const ratio=Math.min(window.devicePixelRatio||1,2);width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=Math.floor(width*ratio);canvas.height=Math.floor(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);const count=Math.min(360,Math.max(180,Math.floor((width*height)/4200)));stars=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.25+.25,vx:(Math.random()-.5)*.018,vy:(Math.random()-.5)*.014,phase:Math.random()*Math.PI*2,tone:Math.random()>.82?'gold':'silver'}));}
    function draw(time){ctx.clearRect(0,0,width,height);stars.forEach(star=>{star.x+=star.vx;star.y+=star.vy;if(star.x<0)star.x=width;if(star.x>width)star.x=0;if(star.y<0)star.y=height;if(star.y>height)star.y=0;const twinkle=.35+Math.sin(time*.0008+star.phase)*.18+Math.random()*.02;ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fillStyle=star.tone==='gold'?`rgba(194,163,86,${twinkle*.55})`:`rgba(201,209,232,${twinkle})`;ctx.fill();});raf=requestAnimationFrame(draw);}
    resize();window.addEventListener('resize',resize,{passive:true});raf=requestAnimationFrame(draw);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(draw);});
  }

  resolvePreloader();splitHeadlines();setupScrollNav();setupReveal();setupSelectors();setupMagnetic();setupParallax();setupPointerAtmosphere();setupStarfield();
})();
