'use strict';
(function(){
 const page=document.getElementById('page-network');if(!page)return;
 const tabs=Array.from(page.querySelectorAll('[data-network-screen]'));
 const panels=Array.from(page.querySelectorAll('[data-network-panel]'));
 const valid=new Set(['speed','services','social','intelligence']);
 function show(name){
  if(!valid.has(name))name='speed';
  tabs.forEach(t=>{const selected=t.dataset.networkScreen===name;t.setAttribute('aria-pressed',String(selected));t.classList.toggle('selected',selected);});
  panels.forEach(p=>{p.hidden=p.dataset.networkPanel!==name;});
  try{sessionStorage.setItem('connect.network.tab',name);}catch{}
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>show(tab.dataset.networkScreen)));
 let previous='speed';try{previous=sessionStorage.getItem('connect.network.tab')||'speed';}catch{}
 show(previous);
})();