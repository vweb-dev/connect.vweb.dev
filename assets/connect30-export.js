'use strict';
(()=>{const root=document.getElementById('convert72-suite');if(!root)return;
const bar=document.createElement('div');bar.className='connect30-export-bar';
const save=document.createElement('button');save.type='button';save.textContent='Download result as TXT';
const message=document.createElement('span');message.setAttribute('role','status');bar.append(save,message);root.append(bar);
save.addEventListener('click',()=>{
const active=[...root.querySelectorAll('[data-convert72-panel]')].find(p=>!p.hidden);
const output=active?.querySelector('textarea[readonly]')?.value||active?.querySelector('#c72-unit-result')?.textContent||active?.querySelector('#c72-base-results')?.textContent||'';
if(!output){message.textContent='Convert something first.';return}
const url=URL.createObjectURL(new Blob([output],{type:'text/plain;charset=utf-8'}));
const link=document.createElement('a');link.href=url;link.download='connect-result.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
message.textContent='Download started.';
});
})();