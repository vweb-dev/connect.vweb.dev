'use strict';
/* Accessible keyboard UX for shared global search and command palette. Search ranking lives in hub.js. */
(()=>{
const input=document.getElementById('hub-search'),results=document.getElementById('hub-search-results'),form=document.getElementById('hub-global-form');
if(input&&results&&form){
 input.setAttribute('aria-controls','hub-search-results');input.setAttribute('aria-expanded','false');input.setAttribute('aria-autocomplete','list');
 results.setAttribute('role','listbox');results.setAttribute('aria-label','Search suggestions');
 const sync=()=>{const visible=!results.hidden;input.setAttribute('aria-expanded',String(visible));const buttons=results.querySelectorAll('button');buttons.forEach((b,i)=>{b.setAttribute('role','option');b.setAttribute('aria-label',b.innerText||b.textContent||'Open result');b.tabIndex=-1;});};
 new MutationObserver(sync).observe(results,{attributes:true,attributeFilter:['hidden'],childList:true});sync();
 input.addEventListener('keydown',event=>{
  const choices=[...results.querySelectorAll('button')];if(event.key==='Escape'){results.hidden=true;input.setAttribute('aria-expanded','false');return}
  if(event.key==='ArrowDown'&&choices.length&&!results.hidden){event.preventDefault();choices[0].focus()}
 });
 results.addEventListener('keydown',event=>{
  const options=[...results.querySelectorAll('button')],i=options.indexOf(document.activeElement);if(i<0)return;
  if(event.key==='ArrowDown'){event.preventDefault();options[(i+1)%options.length]?.focus()}
  if(event.key==='ArrowUp'){event.preventDefault();i===0?input.focus():options[i-1].focus()}
  if(event.key==='Escape'){event.preventDefault();results.hidden=true;input.focus()}
 });
 document.addEventListener('click',event=>{if(!form.contains(event.target)&&!results.contains(event.target)){results.hidden=true;input.setAttribute('aria-expanded','false')}});
}
})();
