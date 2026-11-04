'use strict';
/* Connect v136 workspace usability: active studio link, keyboard access, contextual labels. */
(()=>{
 const studios=new Set(['tools','convert','ai','qr']);
 const navs=[...document.querySelectorAll('.studio48-switcher')];
 if(!navs.length)return;
 function active(){
  const segment=location.pathname.split('/').filter(Boolean)[0]||'home';
  const hash=location.hash.replace(/^#/,'');
  const current=studios.has(hash)?hash:studios.has(segment)?segment:null;
  navs.forEach(nav=>{
   nav.querySelectorAll('[data-studio-switch]').forEach(link=>{
    const selected=current===link.dataset.studioSwitch&&!nav.closest('.page[hidden]');
    if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
   });
  });
 }
 // Route changes are handled by the app's existing navigation engine.
 window.addEventListener('connect:routechange',active);
 window.addEventListener('popstate',active);
 window.addEventListener('hashchange',active);
 // In-page tool detail views can change without a custom route event.
 const navigationObserver=new MutationObserver(active);
 navs.forEach(nav=>{const page=nav.closest('.page');if(page)navigationObserver.observe(page,{attributes:true,attributeFilter:['hidden']});});
 active();
 // Horizontal studio tabs work with the keyboard without changing Tab order.
 navs.forEach(nav=>nav.addEventListener('keydown',event=>{
  if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
  const links=[...nav.querySelectorAll('a[href]')];
  const index=links.indexOf(document.activeElement);
  if(index<0)return;
  event.preventDefault();
  links[(index+(event.key==='ArrowRight'?1:-1)+links.length)%links.length].focus();
 }));
})();
