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
 tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>show(tab.dataset.networkScreen));tab.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();show(tabs[next].dataset.networkScreen);});});
 const search=page.querySelector('#network-social-search'),cards=Array.from(page.querySelectorAll('.connect-social-card')),count=page.querySelector('#network-social-count');
 if(search){search.addEventListener('input',()=>{const query=search.value.trim().toLocaleLowerCase();let visible=0;cards.forEach(card=>{const match=card.querySelector('h3')?.textContent.toLocaleLowerCase().includes(query);card.hidden=!match;if(match)visible++;});if(count)count.textContent=visible+' of '+cards.length+' platforms';});}
 let previous='speed';try{previous=sessionStorage.getItem('connect.network.tab')||'speed';}catch{}
 show(previous);
})();