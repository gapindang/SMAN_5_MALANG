export function initializeNavigation(){
 const header=document.querySelector<HTMLElement>('[data-site-header]');
 const nav=document.querySelector<HTMLElement>('#navigation');
 const toggle=header?.querySelector<HTMLButtonElement>('.menu');
 const backdrop=document.querySelector<HTMLButtonElement>('.nav-backdrop');
 if(!header||!nav||!toggle||!backdrop)return;
 const mobile=window.matchMedia('(max-width: 900px)');
 const links=Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'));
 const indicator=nav.querySelector<HTMLElement>('.nav-indicator');
 const active=nav.querySelector<HTMLAnchorElement>('[aria-current="page"]');
 header.classList.add('nav-enhanced');
 function setOpen(open:boolean,restore=false){
  const expanded=open&&mobile.matches;
  nav!.classList.toggle('open',expanded);
  nav!.inert=mobile.matches&&!expanded;
  toggle!.setAttribute('aria-expanded',String(expanded));
  toggle!.setAttribute('aria-label',expanded?'Tutup navigasi':'Buka navigasi');
  backdrop!.hidden=!expanded;
  if(restore)toggle!.focus();
 }
 function moveIndicator(link:HTMLAnchorElement|null){
  if(!indicator||mobile.matches)return;
  if(!link){indicator.style.opacity='0';return;}
  const parent=nav!.getBoundingClientRect();const rect=link.getBoundingClientRect();
  indicator.style.width=`${rect.width}px`;
  indicator.style.transform=`translateX(${rect.left-parent.left-nav!.clientLeft}px)`;
  indicator.style.opacity='1';nav!.classList.add('indicator-ready');
 }
 function restIndicator(){const focused=links.find(link=>link===document.activeElement);moveIndicator(focused||active);}
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
 backdrop.addEventListener('click',()=>setOpen(false,true));
 links.forEach(link=>{
  link.addEventListener('pointerenter',()=>moveIndicator(link));
  link.addEventListener('focus',()=>moveIndicator(link));
  link.addEventListener('click',()=>setOpen(false));
 });
 nav.addEventListener('pointerleave',restIndicator);
 nav.addEventListener('focusout',()=>queueMicrotask(restIndicator));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')setOpen(false,true);});
 document.addEventListener('pointerdown',event=>{if(event.target instanceof Node&&!header.contains(event.target)&&toggle.getAttribute('aria-expanded')==='true')setOpen(false);});
 header.addEventListener('focusout',()=>queueMicrotask(()=>{if(!header.contains(document.activeElement)&&toggle.getAttribute('aria-expanded')==='true')setOpen(false);}));
 function syncViewport(){const focusHidden=mobile.matches&&nav!.contains(document.activeElement);setOpen(false,focusHidden);requestAnimationFrame(restIndicator);}
 mobile.addEventListener('change',syncViewport);
 let pending=false;
 function updateScroll(){header!.classList.toggle('is-scrolled',window.scrollY>60);pending=false;}
 window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateScroll);}},{passive:true});
 if('ResizeObserver' in window)new ResizeObserver(restIndicator).observe(nav);
 document.fonts.ready.then(restIndicator);
 setOpen(false);updateScroll();requestAnimationFrame(restIndicator);
}
