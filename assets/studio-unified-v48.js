'use strict';
(function(){
 const studioPages=['ai','convert','tools','qr'];
 const navLinks=Array.from(document.querySelectorAll('[data-studio-switch]'));
 function active(){const page=location.hash.slice(1)||location.pathname.split('/').filter(Boolean)[0]||'home';navLinks.forEach(link=>{const yes=link.dataset.studioSwitch===page;link.classList.toggle('current',yes);if(yes)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});}
 document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-studio-target]');
  if(!btn)return;
  const target=document.getElementById(btn.dataset.studioTarget);
  if(!target)return;
  if(btn.dataset.studioFocus==='true'){target.focus();target.scrollIntoView({behavior:'smooth',block:'center'});return;}
  if(target.matches('button')){target.click();const section=target.closest('[role=tablist],.qr-workbench,.qr-editor-card,.qt-controls')||target;section.scrollIntoView({behavior:'smooth',block:'start'});}
  else{target.scrollIntoView({behavior:'smooth',block:'center'});if(target.matches('input,textarea,select'))target.focus();}
 });
 window.addEventListener('hashchange',active);window.addEventListener('popstate',active);
 active();
})();