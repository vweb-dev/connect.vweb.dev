'use strict';
/* Connect release quality layer: transparent external links, reliable focus, tools discovery, conversion deep links. */
(()=> {
const $=id=>document.getElementById(id);
const ready=()=> {
 const catalog=window.ConnectToolRoutes?.tools||[];
 // Existing Apps and LMS already provide discovery; avoid injecting duplicate search bars.
 document.querySelectorAll('.connect-release-search').forEach(node=>node.remove());
 document.querySelectorAll('a[href^="http"]').forEach(a=>{try{if(new URL(a.href).origin!==location.origin){a.rel='noopener noreferrer';a.target='_blank'}}catch{}});
 const converter=$('convert72-suite');
 if(converter&&!converter.querySelector('.connect-release-actions')){const toolbar=document.createElement('div');toolbar.className='connect-release-actions';const button=document.createElement('button');button.type='button';button.textContent='Reset current converter';button.addEventListener('click',()=>{const panel=[...converter.querySelectorAll('[data-convert72-panel]')].find(el=>!el.hidden);if(!panel)return;panel.querySelectorAll('input:not([type=checkbox]),textarea').forEach(input=>{if(input.readOnly)input.value='';else if(input.id!=='c72-unit-amount'&&input.id!=='c72-base-input')input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))});panel.querySelector('[role=status]')?.replaceChildren()});toolbar.append(button);converter.append(toolbar)}
 if(catalog.length){const count=$('connect-release-tool-count');if(count)count.textContent=catalog.length+' dedicated tools available'}
};
window.addEventListener('popstate',()=>requestAnimationFrame(ready));window.addEventListener('pageshow',ready);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();