const reducedQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
let manuallyReduced=false;
let revealObserver;
let introClose=null;
let scrollFrame=0;
let firstMount=true;
const reduced=()=>reducedQuery.matches||manuallyReduced;
const animate=(el,frames,options)=>!reduced()&&el?.animate?el.animate(frames,options):null;

function applyPreference(){
  document.body.classList.toggle('motion-reduced',reduced());
  document.querySelectorAll('[data-action="toggle-motion"]').forEach(button=>{
    button.setAttribute('aria-pressed',String(reduced()));
    button.textContent=reduced()?'动态效果已减少':'减少动态效果';
  });
  if(reduced()){
    revealObserver?.disconnect();
    document.querySelectorAll('.m-reveal-ready').forEach(el=>el.classList.remove('m-reveal-ready'));
    document.getAnimations?.().forEach(animation=>animation.cancel());
    introClose?.();
  }
  updateScroll();
}

export function toggleMotion(){
  manuallyReduced=!reduced();
  // The system setting always wins; an in-page control cannot force motion on.
  if(reducedQuery.matches)manuallyReduced=false;
  applyPreference();
  mountMotion(document.querySelector('#app'),{quiet:true,page:document.body.dataset.page});
}

export function initMotion(){
  applyPreference();
  reducedQuery.addEventListener?.('change',applyPreference);
  window.addEventListener('scroll',()=>{
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateScroll();});
  },{passive:true});
  document.addEventListener('pointerdown',event=>{
    const target=event.target.closest('.primary-button,.outline-button,.small-button');
    if(target&&!target.disabled)animate(target,[{transform:'scale(1)'},{transform:'scale(.985)'},{transform:'scale(1)'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
  },{passive:true});
}

function updateScroll(){
  const hero=document.querySelector('.hero-photo');
  if(hero)hero.style.setProperty('--parallax-offset',`${reduced()?0:Math.min(window.scrollY*.07,32)}px`);
}

export function mountMotion(root,{quiet=false,page='home'}={}){
  if(root.id==='app')revealObserver?.disconnect();
  if(!reduced()){
    if(!quiet){
      animate(root,[{opacity:.35,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
      const progress=document.querySelector('#route-progress');
      animate(progress,[{transform:'translateX(-105%)',opacity:0},{transform:'translateX(-20%)',opacity:1,offset:.25},{transform:'translateX(105%)',opacity:0}],{duration:500,easing:'cubic-bezier(.35,0,.2,1)'});
    }
    if(page==='drive-mode'){
      animate(root.querySelector('.drive-visual'),[{opacity:.4,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],{duration:340,easing:'cubic-bezier(.16,1,.3,1)'});
      animate(root.querySelector('.drive-panel-body'),[{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
    }
    if(['home','schedule','station','courses','course'].includes(page)&&'IntersectionObserver' in window){
      revealObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('m-is-visible');revealObserver.unobserve(entry.target);}});
      },{threshold:.08,rootMargin:'0px 0px 35px 0px'});
      root.querySelectorAll('.drive-selector,.calendar-preview,.selected-courses,.m-heritage,.brand-statement,.schedule-list>.station-card,.course-list>.course-card,.highlights>div').forEach((el,i)=>{
        // Above-the-fold content is available immediately, even before observers fire.
        if(el.getBoundingClientRect().top<window.innerHeight-20)return;
        el.classList.add('m-reveal-ready');el.style.setProperty('--reveal-delay',`${Math.min(i%3,2)*45}ms`);revealObserver.observe(el);
      });
    }
    root.querySelectorAll('.success-symbol .icon path').forEach(path=>{
      path.setAttribute('pathLength','1');
      animate(path,[{strokeDasharray:'1',strokeDashoffset:1},{strokeDasharray:'1',strokeDashoffset:0}],{duration:560,delay:100,easing:'ease-out',fill:'backwards'});
    });
  }
  updateScroll();
  if(firstMount){
    firstMount=false;
    if(!reduced())requestAnimationFrame(()=>playIntro({automatic:true}));
  }
}

export async function playIntro({automatic=false}={}){
  if(introClose)return;
  if(automatic&&reduced())return;
  const previousFocus=document.activeElement;
  const root=document.createElement('section');
  root.id='m-intro';root.className='m-intro';root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','m-intro-title');
  root.innerHTML=`<div class="intro-inner"><header class="intro-header"><img src="assets/bmw-m-mark.svg" alt="BMW M"/><span>BMW DRIVING EXPERIENCE</span></header><div class="intro-copy"><span class="intro-kicker">HERITAGE IN MOTION</span><h2 id="m-intro-title">M POWER<span>从热爱，到此刻。</span></h2></div><div class="intro-scene"><img class="intro-photo" src="assets/m3-e30-motion.jpg" alt="经典 BMW M3 E30 驶过山间道路"/><div class="intro-photo-shade"></div><div class="intro-speed-lines" aria-hidden="true"><i></i><i></i><i></i></div><span class="intro-car-label">BMW M3 E30 <i>/</i> THE ORIGINAL SPIRIT.</span></div><div class="intro-footer"><div class="intro-load-line" aria-hidden="true"><i></i><i></i><i></i></div><p>赛车基因，点燃此刻。</p><span>2027 BMW 精英驾驶培训</span><small>经典车型为品牌传承展示，非本期课程用车</small></div></div>`;
  document.body.append(root);
  document.body.classList.add('intro-playing');
  const surfaces=[...document.querySelectorAll('.phone-shell,.desktop-intro,.preview-nav')];
  const priorInert=surfaces.map(el=>el.inert);
  surfaces.forEach(el=>el.inert=true);
  let closed=false;
  let release;
  const finished=new Promise(resolve=>release=resolve);
  const onKey=event=>{
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){event.preventDefault();root.focus({preventScroll:true});}
  };
  const close=async()=>{
    if(closed)return;closed=true;clearTimeout(timer);document.removeEventListener('keydown',onKey);
    const exit=animate(root,[{opacity:1},{opacity:0}],{duration:240,easing:'ease-out'});
    if(exit)try{await exit.finished;}catch{}
    root.remove();document.body.classList.remove('intro-playing');
    surfaces.forEach((el,i)=>el.inert=priorInert[i]);introClose=null;
    if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});
    release();
  };
  introClose=close;
  document.addEventListener('keydown',onKey);root.focus({preventScroll:true});
  // A fixed cap prevents an image/network failure from trapping the interface.
  const timer=setTimeout(close,reduced()?800:2200);
  const photo=root.querySelector('.intro-photo');
  try{await Promise.race([photo.decode(),new Promise(resolve=>setTimeout(resolve,350))]);}catch{}
  if(!closed)root.classList.add('intro-ready');
  return finished;
}
