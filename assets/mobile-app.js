'use strict';
/* VWEB.DEV Connect mobile app shell: tabs, nested bottom sheets and screen history. */
(function(){
 const $=s=>document.querySelector(s);
 const $$=s=>Array.from(document.querySelectorAll(s));
 const drawer=$('#mobile-drawer'),panel=$('.mobile-drawer-panel');
 if(!drawer||!panel||!$('#mobile-app-topbar'))return;
 const titles={home:'Overview',studios:'Workspaces',tools:'Quick Actions',qr:'QR Code Studio',convert:'Convert Studio',apps:'App Directory',academy:'Learn / LMS',ai:'AI Studio',pc:'Windows & Office Help',dashboard:'My Workspace',play:'Games & Quizzes',offers:'Deals',community:'Local & Learn',account:'My Account'};
 const groups={home:'home',studios:'studios',tools:'studios',qr:'studios',convert:'studios',apps:'apps',pc:'apps',academy:'academy',ai:'more',dashboard:'more',play:'more',offers:'more',community:'more',account:'more'};
 const sheetNames={root:'Explore Connect',create:'Workspaces & Actions',learn:'Learn & Explore',services:'Windows & Services',personal:'My Connect',install:'Install Connect'};
 const sheetScreens=$$('[data-stack-screen]');
 const mobile=()=>matchMedia('(max-width:800px)').matches;
 let screens=['home'],lastRoute='home',sheetTrail=['root'],returnFocus=null,swipeOrigin=null;
 const route=()=>{const key=(location.hash||'#home').slice(1)||'home';return titles[key]?key:'home'};
 const currentSheet=()=>sheetTrail[sheetTrail.length-1];
 function selectSheet(id){
  if(!sheetNames[id])id='root';
  sheetScreens.forEach(el=>el.hidden=el.dataset.stackScreen!==id);
  $('#mobile-drawer-title').textContent=sheetNames[id];
  $('#mobile-stack-back').hidden=id==='root';
  $('#mobile-sheet-scroll').scrollTop=0;
 }
 function closeSheet(){
  if(drawer.hidden)return;
  drawer.hidden=true;document.body.classList.remove('drawer-open');
  for(const name of ['mobile-more','mobile-app-open-menu']){
   const item=$('#'+name);if(item)item.setAttribute('aria-expanded','false');
  }
  const restore=returnFocus;returnFocus=null;
  if(restore&&restore.isConnected&&mobile())restore.focus({preventScroll:true});
 }
 function openSheet(){
  if(!mobile()||!drawer.hidden)return;
  returnFocus=document.activeElement;
  sheetTrail=['root'];selectSheet('root');
  drawer.hidden=false;document.body.classList.add('drawer-open');
  for(const name of ['mobile-more','mobile-app-open-menu']){
   const item=$('#'+name);if(item)item.setAttribute('aria-expanded','true');
  }
  $('#mobile-drawer-close').focus({preventScroll:true});
 }
 function sheetBack(){
  if(sheetTrail.length<=1){closeSheet();return;}
  sheetTrail.pop();selectSheet(currentSheet());
  $('#mobile-stack-back').focus({preventScroll:true});
 }
 function screenBack(){
  if(!drawer.hidden){sheetBack();return;}
  if(route()==='home')return;
  const previous=screens.length>1?screens[screens.length-2]:'home';
  location.hash='#'+(previous===route()?'home':previous);
 }
 function updateScreen(){
  const key=route();
  if(key!==lastRoute){
   if(screens.length>1&&screens[screens.length-2]===key)screens.pop();
   else{screens.push(key);if(screens.length>24)screens.splice(1,screens.length-24);}
   lastRoute=key;
  }
  const home=key==='home';
  $('#mobile-app-brand').hidden=!home;
  $('#mobile-app-screen-name').hidden=home;
  $('#mobile-app-back').hidden=home;
  $('#mobile-app-title').textContent=titles[key];
  $('#mobile-app-category').textContent='CONNECT / '+({studios:'WORKSPACES',tools:'ACTIONS',convert:'FILES',apps:'SOFTWARE',pc:'SOFTWARE',academy:'LEARN'}[key]||'EXPLORE');
  $$('.mobile-app-tabs [data-mobile-tab]').forEach(el=>{
   const active=groups[key]===el.dataset.mobileTab;
   el.classList.toggle('is-active',active);
   if(el.tagName==='A'){
    if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
   }else el.setAttribute('aria-pressed',String(active));
  });
  if(!drawer.hidden)closeSheet();
 }
 function openSearch(){
  closeSheet();
  const button=$('#hub-command-open');if(button)button.click();
 }
 for(const id of ['mobile-more','mobile-app-open-menu']){
  const button=$('#'+id);if(button)button.addEventListener('click',()=>drawer.hidden?openSheet():closeSheet());
 }
 $('#mobile-app-back').addEventListener('click',screenBack);
 $('#mobile-app-search').addEventListener('click',openSearch);
 $('#mobile-drawer-close').addEventListener('click',closeSheet);
 $('#mobile-stack-back').addEventListener('click',sheetBack);
 $('#mobile-sheet-search').addEventListener('click',openSearch);
 drawer.addEventListener('click',event=>{if(event.target===drawer)closeSheet()});
 $$('[data-stack-next]').forEach(el=>el.addEventListener('click',()=>{
  if(!sheetNames[el.dataset.stackNext])return;
  sheetTrail.push(el.dataset.stackNext);
  selectSheet(currentSheet());
  $('#mobile-stack-back').focus({preventScroll:true});
 }));
 drawer.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeSheet));
 document.addEventListener('keydown',event=>{
  if(drawer.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeSheet();return;}
  if(event.key!=='Tab')return;
  const focusable=Array.from(panel.querySelectorAll('button,a,input,[tabindex="0"]'))
   .filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length>0);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 // Downward swipe on handle/header closes sheet without hijacking a scrolling menu.
 for(const el of [$('#mobile-drawer-handle'),$('.mobile-drawer-head')]){
  el.addEventListener('touchstart',event=>{
   if(event.touches.length!==1)return;
   const touch=event.touches[0];swipeOrigin={x:touch.clientX,y:touch.clientY};
  },{passive:true});
  el.addEventListener('touchend',event=>{
   if(!swipeOrigin||drawer.hidden)return;
   const touch=event.changedTouches[0],dx=touch.clientX-swipeOrigin.x,dy=touch.clientY-swipeOrigin.y;
   swipeOrigin=null;if(dy>95&&dy>Math.abs(dx)*1.5)closeSheet();
  },{passive:true});
 }
 const install=$('#mobile-install-app'),oldInstall=$('#install');
 const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const standalone=window.navigator.standalone===true||matchMedia('(display-mode:standalone)').matches;
 if(isiOS&&!standalone){install.hidden=false;install.textContent='Install on iPhone ↗';}
 const appleDevice=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||
  (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const appInstalled=()=>navigator.standalone===true||
  matchMedia('(display-mode:standalone)').matches||matchMedia('(display-mode:fullscreen)').matches;
 function syncInstall(){
  if(appInstalled()){install.hidden=true;return;}
  install.hidden=!(appleDevice()||!oldInstall.hidden);
  install.textContent=appleDevice()?'＋ Install on iPhone / iPad':'↓ Install Connect app';
 }
 install.addEventListener('click',()=>{
  if(appleDevice()){
   sheetTrail.push('install');
   selectSheet('install');
   $('#mobile-stack-back').focus({preventScroll:true});
  }else{closeSheet();if(!oldInstall.hidden)oldInstall.click();}
 });
 window.addEventListener('beforeinstallprompt',syncInstall);
 window.addEventListener('appinstalled',syncInstall);
 window.addEventListener('pageshow',syncInstall);
 syncInstall();
 window.addEventListener('hashchange',updateScreen);
 window.addEventListener('resize',()=>{if(!mobile())closeSheet()});
 updateScreen();
})();
