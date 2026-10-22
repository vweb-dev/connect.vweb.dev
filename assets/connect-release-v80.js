'use strict';
/* Connect release quality layer: transparent external links, reliable focus, tools discovery, conversion deep links. */
(()=> {
const $=id=>document.getElementById(id);
const ready=()=> {
 const catalog=window.ConnectToolRoutes?.tools||[];
 const page=$('page-apps'),lms=$('page-academy');
 for(const root of [page,lms]){if(!root||root.querySelector('.connect-release-search'))continue;
 const cards=[...root.querySelectorAll('a[href],article')].filter(el=>el.textContent.trim().length>15 && !el.closest('nav,footer'));
 if(cards.length<6)continue;
 const box=document.createElement('div');box.className='connect-release-search';
 const input=document.createElement('input');input.type='search';input.placeholder=root===page?'Filter apps and software…':'Find a course or topic…';input.setAttribute('aria-label',input.placeholder);
 const count=document.createElement('span');count.setAttribute('role','status');box.append(input,count);
 const heading=root.querySelector('.page-header,.app56-intro,.lms-header');(heading||root).after(box);
 const refresh=()=>{let shown=0;const q=input.value.trim().toLocaleLowerCase();cards.forEach(el=>{const ok=!q||el.textContent.toLocaleLowerCase().includes(q);el.hidden=!ok;el.classList.toggle('connect-release-filtered',!ok);if(ok)shown++});count.textContent=shown+' results'};
 input.addEventListener('input',refresh);refresh();
 }
 document.querySelectorAll('a[href^="http"]').forEach(a=>{try{if(new URL(a.href).origin!==location.origin){a.rel='noopener noreferrer';a.target='_blank'}}catch{}});
 const converter=$('convert72-suite');
 if(converter&&!converter.querySelector('.connect-release-actions')){const toolbar=document.createElement('div');toolbar.className='connect-release-actions';const button=document.createElement('button');button.type='button';button.textContent='Reset current converter';button.addEventListener('click',()=>{const panel=[...converter.querySelectorAll('[data-convert72-panel]')].find(el=>!el.hidden);if(!panel)return;panel.querySelectorAll('input:not([type=checkbox]),textarea').forEach(input=>{if(input.readOnly)input.value='';else if(input.id!=='c72-unit-amount'&&input.id!=='c72-base-input')input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))});panel.querySelector('[role=status]')?.replaceChildren()});toolbar.append(button);converter.append(toolbar)}
 if(catalog.length){const count=$('connect-release-tool-count');if(count)count.textContent=catalog.length+' dedicated tools available'}
};
window.addEventListener('popstate',()=>requestAnimationFrame(ready));window.addEventListener('pageshow',ready);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();