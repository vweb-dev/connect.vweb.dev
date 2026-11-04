'use strict';
/* VWEB.DEV Connect UX v135: progressive enhancement, no extra dependencies. */
(()=>{
 const $=s=>document.querySelector(s);
 const home=$('#page-home');
 const items=[
  ['tools','Quick Actions','Everyday utilities','⌘'],
  ['convert','Convert Studio','Images, PDF & media','▤'],
  ['academy','Learn / LMS','Courses & practice','⌨'],
  ['qr','QR Code Studio','Design & export QR','▦'],
  ['apps','App Directory','Trusted software','◧'],
  ['pc','Windows & Office','Guides & setup','⊞'],
  ['network','Speed Test','Check your connection','◉'],
  ['dashboard','My Workspace','Saved items & progress','◇']
 ];
 if(home&&!$('#cx135-quick')){
  const section=document.createElement('section');section.id='cx135-quick';section.className='cx135-quick';section.setAttribute('aria-labelledby','cx135-quick-title');
  const heading=document.createElement('div');heading.className='cx135-quick-top';
  const title=document.createElement('strong');title.id='cx135-quick-title';title.textContent='Jump into Connect';
  const hint=document.createElement('span');hint.textContent='Your essentials, one tap away';heading.append(title,hint);
  const grid=document.createElement('div');grid.className='cx135-quick-grid';
  items.forEach(([id,name,subtitle,symbol])=>{
   if(!$('#page-'+id))return;
   const a=document.createElement('a');a.href='/'+id;a.className='cx135-quick-link';a.setAttribute('aria-label',name+' — '+subtitle);
   const icon=document.createElement('span');icon.className='cx135-quick-icon';icon.setAttribute('aria-hidden','true');icon.textContent=symbol;
   const content=document.createElement('span');content.className='cx135-quick-text';
   const strong=document.createElement('strong');strong.textContent=name;
   const small=document.createElement('small');small.textContent=subtitle;
   content.append(strong,small);a.append(icon,content);grid.append(a);
  });
  section.append(heading,grid);
  const hero=home.querySelector('.hub-hero');
  if(hero)hero.after(section);else home.prepend(section);
 }
 const top=$('.workspace>.top'),actions=top?.querySelector('.top-actions'),side=$('.side');
 if(top&&actions&&side&&!$('#cx135-sidebar-toggle')){
  const button=document.createElement('button');button.id='cx135-sidebar-toggle';button.className='cx135-sidebar-toggle';button.type='button';
  button.setAttribute('aria-controls','connect-main-sidebar');
  side.id ||= 'connect-main-sidebar';
  let compact=false;
  try{compact=localStorage.getItem('connect.cx135.compact')==='1'}catch(_){}
  const sync=()=>{
   document.documentElement.classList.toggle('cx135-compact',compact);
   button.textContent=compact?'☷ Expand menu':'☰ Compact menu';
   button.setAttribute('aria-pressed',String(compact));
   button.setAttribute('aria-label',compact?'Expand sidebar':'Compact sidebar');
   side.querySelectorAll('nav a').forEach(link=>{
    if(compact)link.title=link.querySelector('span')?.textContent?.trim()||link.textContent.trim();
    else link.removeAttribute('title');
   });
  };
  button.addEventListener('click',()=>{compact=!compact;try{localStorage.setItem('connect.cx135.compact',compact?'1':'0')}catch(_){}sync()});
  actions.prepend(button);sync();
 }
})();


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

'use strict';
/* Unified navigation history: first-party, browser-local and opt-out through Clear. */
(()=>{
 const routes={
  home:'Overview',daily:'Daily Desk',studios:'Workspaces',academy:'Learn / LMS',
  network:'Speed Test',pc:'Windows & Office',apps:'App Directory',
  dashboard:'My Workspace',convert:'Convert Studio',tools:'Quick Actions',
  qr:'QR Studio',ai:'AI Studio',play:'Games & Quizzes',
  offers:'Deals',community:'Community',account:'My Account'
 };
 const key='connect.ui.recent.v137',home=document.getElementById('page-home');
 if(!home)return;
 const route=()=>{
  const hash=location.hash.slice(1),part=location.pathname.split('/').filter(Boolean)[0]||'home';
  return Object.hasOwn(routes,hash)?hash:part==='windows'?'pc':Object.hasOwn(routes,part)?part:null;
 };
 const read=()=>{try{
  const data=JSON.parse(localStorage.getItem(key)||'[]');
  return Array.isArray(data)?data.filter(x=>typeof x==='string'&&Object.hasOwn(routes,x)).slice(0,4):[];
 }catch(_){return []}};
 const section=document.createElement('section');
 section.id='cx137-recent';section.className='cx137-recent';
 section.setAttribute('aria-labelledby','cx137-recent-title');
 const heading=document.createElement('div');heading.className='cx137-recent-heading';
 const h=document.createElement('h2');h.id='cx137-recent-title';h.textContent='Recently opened';
 const clear=document.createElement('button');clear.type='button';clear.textContent='Clear history';clear.setAttribute('aria-label','Clear recently opened pages');
 heading.append(h,clear);
 const list=document.createElement('div');list.className='cx137-recent-links';
 section.append(heading,list);
 const shortcuts=document.getElementById('cx135-quick');
 if(shortcuts)shortcuts.after(section);else home.querySelector('.hub-hero')?.after(section);
 function draw(){
  const items=read();list.replaceChildren();
  section.hidden=items.length===0;
  items.forEach(id=>{
   const a=document.createElement('a');a.href='/'+id;
   const label=document.createElement('span');label.textContent=routes[id];
   const arrow=document.createElement('b');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
   a.append(label,arrow);list.append(a);
  });
 }
 function record(){
  const id=route();
  if(!id||id==='home')return;
  const next=[id,...read().filter(x=>x!==id)].slice(0,4);
  try{localStorage.setItem(key,JSON.stringify(next))}catch(_){}
  draw();
 }
 clear.addEventListener('click',()=>{
  try{localStorage.removeItem(key)}catch(_){}
  draw();
 });
 window.addEventListener('connect:routechange',record);
 window.addEventListener('popstate',record);
 window.addEventListener('hashchange',record);
 // Clicking a studio link is already handled by the main router;
 // observe any remaining same-document navigation via the URL event listeners.
 draw();record();
})();
