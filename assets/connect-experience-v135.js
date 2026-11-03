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
