'use strict';
/* Connect-wide discovery and fast navigation. No paid APIs, account or analytics. */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const GROUPS=[['all','All'],['tools','Tools'],['convert','Convert'],['qr','QR Studio'],['ai','AI'],['pc','Windows'],['network','Internet'],['academy','Learn']];
function init(){
 if($('connect-command-center'))return;
 let catalog={tools:[]};try{catalog=JSON.parse($('connect-tool-route-catalog')?.textContent||'{}')}catch{}
 let academy={courses:[]};try{academy=JSON.parse($('hub-offline-catalog')?.textContent||'{}')}catch{}
 const entries=[];
 const seen=new Set();
 function add(title,path,section,desc){
   if(!title||!path||!path.startsWith('/')||path.startsWith('//')||seen.has(path))return;
   seen.add(path);entries.push({title,path,section,desc:desc||''});
 }
 for(const t of catalog.tools||[])add(t.title,t.path,t.section,t.description);
 for(const c of academy.courses||[])add(c.title,'/academy/course/'+encodeURIComponent(c.id),'academy',c.description);
 for(const [title,path,section] of [['All tools','/tools','tools'],['Convert Studio','/convert','convert'],['QR Code Studio','/qr','qr'],['AI Studio','/ai','ai'],['Connect Academy','/academy','academy'],['Windows & Office','/pc','pc'],['Internet Utilities','/network','network'],['Home','/','all']])add(title,path,section);
 const memoryKey='connect-command-recent-v1';
 const read=()=>{try{const value=JSON.parse(localStorage.getItem(memoryKey)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string').slice(0,8):[]}catch{return[]}};
 const remember=path=>{try{localStorage.setItem(memoryKey,JSON.stringify([path,...read().filter(x=>x!==path)].slice(0,8)))}catch{}};
 const active=entries.find(e=>e.path===location.pathname);
 if(active)remember(active.path);
 const launcher=document.createElement('button');launcher.type='button';launcher.id='cc-launcher';launcher.className='cc-launcher';launcher.setAttribute('aria-haspopup','dialog');launcher.setAttribute('aria-controls','connect-command-center');launcher.innerHTML='<span aria-hidden="true">⌕</span><span>Find anything</span><kbd>Ctrl K</kbd>';
 const modal=document.createElement('div');modal.id='connect-command-center';modal.className='cc-overlay';modal.hidden=true;
 modal.innerHTML='<div class="cc-backdrop" data-cc-close></div><section class="cc-dialog" role="dialog" aria-modal="true" aria-label="Find tools and courses"><header class="cc-header"><label class="visually-hidden" for="cc-input">Find tools and courses</label><input type="search" id="cc-input" autocomplete="off" placeholder="Search tools, PDF, QR, courses, Windows…" aria-controls="cc-results"><button type="button" id="cc-close" aria-label="Close search">✕</button></header><nav class="cc-filters" aria-label="Filter results" id="cc-filters"></nav><div class="cc-summary" id="cc-summary" role="status" aria-live="polite"></div><div class="cc-results" id="cc-results" role="listbox" aria-label="Matching destinations"></div><footer class="cc-footer">↑ ↓ navigate · Enter open · Esc close <span>No tracking · Browser only</span></footer></section>';
 document.body.append(launcher,modal);
 const input=$('cc-input'),results=$('cc-results'),filters=$('cc-filters'),summary=$('cc-summary');
 let group='all',shown=[],selected=0,prevFocus=null;
 const score=(entry,terms)=>{
   const title=esc(entry.title),desc=esc(entry.desc),path=esc(entry.path);
   let total=0;
   for(const term of terms){
     if(title===term)total+=18;
     else if(title.startsWith(term))total+=12;
     else if(title.includes(term))total+=8;
     else if(path.includes(term))total+=5;
     else if(desc.includes(term))total+=2;
     else return -1;
   }
   return total;
 };
 function draw(){
   const terms=esc(input.value.trim()).split(/\s+/).filter(Boolean);
   const recent=read(),sortByRecent=!terms.length;
   shown=entries.filter(e=>group==='all'||e.section===group).map(e=>({...e,rank:terms.length?score(e,terms):0,recency:recent.indexOf(e.path)})).filter(e=>e.rank>=0);
   shown.sort((a,b)=>sortByRecent?(Number(b.recency>=0)-Number(a.recency>=0)||((a.recency<0?999:a.recency)-(b.recency<0?999:b.recency))||a.title.localeCompare(b.title)):(b.rank-a.rank||a.title.localeCompare(b.title)));
   shown=shown.slice(0,40);
   selected=0;results.replaceChildren();
   for(let i=0;i<shown.length;i++){
     const item=shown[i],row=document.createElement('a');row.className='cc-result';row.href=item.path;row.id='cc-result-'+i;row.setAttribute('role','option');row.setAttribute('aria-selected',String(i===selected));row.tabIndex=-1;
     const main=document.createElement('span');main.className='cc-result-copy';
     const title=document.createElement('strong');title.textContent=item.title;
     const desc=document.createElement('small');desc.textContent=item.desc||item.path;
     main.append(title,desc);const tag=document.createElement('span');tag.className='cc-result-tag';tag.textContent=item.section;
     row.append(main,tag);row.addEventListener('mouseenter',()=>select(i));row.addEventListener('click',()=>remember(item.path));results.append(row);
   }
   if(!shown.length){const empty=document.createElement('p');empty.className='cc-empty';empty.textContent='No matches. Try another term or select All.';results.append(empty)}
   summary.textContent=shown.length+(shown.length===40?'+':'')+' destinations'+(!terms.length?' · recently used first':'');
   select(0,false);
 }
 function select(index,scroll=true){
   if(!shown.length)return;
   selected=Math.max(0,Math.min(index,shown.length-1));
   results.querySelectorAll('[role="option"]').forEach((row,i)=>row.setAttribute('aria-selected',String(i===selected)));
   const row=$('cc-result-'+selected);input.setAttribute('aria-activedescendant',row?.id||'');
   if(scroll)row?.scrollIntoView({block:'nearest'});
 }
 function filter(){
   filters.replaceChildren();
   for(const [id,label] of GROUPS){
     const count=id==='all'?entries.length:entries.filter(e=>e.section===id).length;
     if(!count)continue;
     const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(group===id));
     button.addEventListener('click',()=>{group=id;filter();draw();input.focus()});filters.append(button);
   }
 }
 function open(){if(!modal.hidden)return;prevFocus=document.activeElement;modal.hidden=false;document.body.classList.add('cc-open');group='all';input.value='';filter();draw();input.focus()}
 function close(){if(modal.hidden)return;modal.hidden=true;document.body.classList.remove('cc-open');input.removeAttribute('aria-activedescendant');prevFocus?.focus?.()}
 launcher.addEventListener('click',open);$('cc-close').addEventListener('click',close);
 modal.querySelector('[data-cc-close]').addEventListener('click',close);
 input.addEventListener('input',draw);
 modal.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key==='ArrowDown'){e.preventDefault();select((selected+1)%shown.length);return}
   if(e.key==='ArrowUp'){e.preventDefault();select((selected-1+shown.length)%shown.length);return}
   if(e.key==='Enter'&&document.activeElement===input&&shown.length){e.preventDefault();remember(shown[selected].path);location.assign(shown[selected].path);return}
   if(e.key==='Tab'){
     const focusables=[...modal.querySelectorAll('button:not([disabled]),input,a[href]')].filter(el=>el.getClientRects().length);
     const first=focusables[0],last=focusables.at(-1);
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
   }
 });
 document.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();modal.hidden?open():close();return}
   if(e.key==='/'&&modal.hidden&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.target.closest('input,textarea,select,[contenteditable]')){e.preventDefault();open()}
 });
 window.ConnectCommandCenter={open,close,entries:entries.length};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();