'use strict';
/* Connect v53 — category > subtool > real workspace. No API or dependency. */
(()=>{
const $=id=>document.getElementById(id);
const T=(id,title,desc,path,mode,target,extra='')=>({id,title,desc,path,mode,target,extra});
const groups=[
 {id:'quick',icon:'⌘',title:'Quick & Everyday',subtitle:'Small tasks, instant results',items:[
  T('password','Password Generator','Random passwords, length and symbols','/tools','quick','password'),
  T('text','Text Studio','Word count, uppercase and cleanup','/tools','quick','text'),
  T('units','Unit Converter','Length, weight, area and temperature','/tools','quick','units'),
  T('compress','Image Compressor','Compress JPG, PNG and WebP images','/tools','quick','compress')
 ]},
 {id:'developer',icon:'{ }',title:'Developer Tools',subtitle:'JSON, CSV, encoding and hashes',items:[
  T('csv','CSV to JSON','Convert CSV rows to JSON locally','/tools','quick','csv'),
  T('json','JSON Formatter','Format, validate and minify JSON','/tools','quick','json'),
  T('encode','Text Encoder / Decoder','URL and Base64 conversion','/tools','quick','encode'),
  T('hash','SHA-256 Hash','Generate a text fingerprint','/tools','quick','hash'),
  T('uuid','UUID Generator','Create random identifiers','/tools','quick','uuid')
 ]},
 {id:'design',icon:'◐',title:'Design & Accessibility',subtitle:'Visual checks and creative utilities',items:[
  T('contrast','Color Contrast Checker','WCAG text readability checks','/tools','quick','contrast')
 ]},
 {id:'files',icon:'▤',title:'Files & Media',subtitle:'Image, PDF, audio and video labs',items:[
  T('image-lab','Image Lab','Convert, resize and optimize images','/convert','tab','convert-tab-image'),
  T('pdf-lab','PDF Lab','PDF extraction and browser tools','/convert','tab','convert-tab-pdf'),
  T('audio-lab','Audio Lab','Audio trimming and conversion tools','/convert','tab','convert-tab-audio'),
  T('video-lab','Video Lab','Video previews and supported exports','/convert','tab','convert-tab-video')
 ]},
 {id:'qr',icon:'▦',title:'QR Code Studio',subtitle:'Create, brand and export QR codes',items:[
  T('quick-qr','Quick QR Generator','Simple link, Wi-Fi or contact QR','/tools','quick','qr'),
  T('qr-url','Website QR','Link to a website or page','/qr','qr','url'),
  T('qr-text','Text QR','Store plain text in a QR code','/qr','qr','text'),
  T('qr-wifi','Wi-Fi QR','Share network credentials by scanning','/qr','qr','wifi'),
  T('qr-whatsapp','WhatsApp QR','Start a WhatsApp conversation','/qr','qr','whatsapp'),
  T('qr-contact','Contact QR','Share a vCard contact','/qr','qr','contact'),
  T('qr-email','Email QR','Prefill an email message','/qr','qr','email'),
  T('qr-sms','SMS QR','Prefill a text message','/qr','qr','sms'),
  T('qr-phone','Phone QR','Provide a phone dialing action','/qr','qr','phone'),
  T('qr-location','Location QR','Share geographic coordinates','/qr','qr','location'),
  T('qr-event','Event QR','Share event details','/qr','qr','event'),
  T('qr-designer','QR Designer','Patterns, logo, gradients and exports','/qr','focus','qr-design')
 ]},
 {id:'ai',icon:'✦',title:'AI Studio',subtitle:'Puter account · limits and credits may apply',items:[
  T('ai-chat','AI Chat','Ask questions and draft content','/ai','tab','ai-tab-chat'),
  T('ai-image','AI Image','Generate an image from text','/ai','tab','ai-tab-image'),
  T('ai-video','AI Video','Create or test video generation','/ai','tab','ai-tab-video'),
  T('ai-caption','AI Captions','Write social captions and ideas','/ai','tab','ai-tab-caption')
 ]},
 {id:'daily',icon:'◷',title:'Daily Workspace',subtitle:'Notes, planning, calculators and lookup',items:[
  T('daily-tasks','To-do List','Add and complete tasks on this device','/daily','focus','daily-task-input'),
  T('daily-notes','Quick Notes','Autosave notes and export text','/daily','focus','daily-note'),
  T('daily-timer','Focus Timer','25-minute focus session','/daily','focus','daily-start'),
  T('daily-currency','Currency Converter','Daily reference exchange rates','/daily','focus','daily-amount'),
  T('daily-text','Text & Clipboard','Clean, count, transform and copy text','/daily','focus','daily-text-tool'),
  T('daily-password','Secure Passwords','Browser cryptographic password generator','/daily','focus','daily-password-length'),
  T('daily-date','Date Calculator','Measure days between dates','/daily','focus','daily-date-start'),
  T('daily-backup','Notes & Task Backup','Export or import local JSON','/daily','focus','daily-backup-export'),
  T('daily-dictionary','Dictionary','Look up English word definitions','/daily','focus','daily-word'),
  T('daily-books','Book Discovery','Search titles in Open Library','/daily','focus','daily-book'),
  T('daily-calculator','Calculator','Arithmetic and percentages','/daily','focus','daily-calc-a'),
  T('daily-seo','SEO Snippet Checker','Review page title and meta length','/daily','focus','daily-seo-title')
 ]},
 {id:'system',icon:'◈',title:'Windows & Internet',subtitle:'Software utilities and connection tests',items:[
  T('winget','WinGet App Installer','Find apps and build install commands','/pc','focus','hub-winget-search'),
  T('windows-help','Windows & Office Help','Diagnostics, licensing and guides','/pc','focus','windows-license-diagnostics'),
  T('speed-test','Internet Speed Test','Download, upload, ping and jitter','/network','focus','connect-speed-start')
 ]}
];
const all=groups.flatMap(group=>group.items.map(item=>({...item,group:group.id,groupName:group.title,groupIcon:group.icon})));
const byId=new Map(all.map(item=>[item.id,item]));
let saved=[];try{saved=JSON.parse(localStorage.getItem('connect.tools.pins.v53')||'[]');if(!Array.isArray(saved))saved=[];}catch{}saved=saved.filter(id=>byId.has(id)).slice(0,24);
function savePins(){try{localStorage.setItem('connect.tools.pins.v53',JSON.stringify(saved));}catch{}}
let recent=[];try{recent=JSON.parse(localStorage.getItem('connect.tools.recent.v53')||'[]');if(!Array.isArray(recent))recent=[];}catch{}
recent=recent.filter(id=>byId.has(id)).slice(0,9);
function remember(item){recent=[item.id,...recent.filter(x=>x!==item.id)].slice(0,9);try{localStorage.setItem('connect.tools.recent.v53',JSON.stringify(recent));}catch{}}

const backdrop=$('connect-tools-overlay'),sheet=$('connect-tools-sheet'),content=$('connect-tools-content'),search=$('connect-tools-search'),back=$('connect-tools-back'),heading=$('connect-tools-heading'),hint=$('connect-tools-subheading');
if(!backdrop||!sheet||!content||!search)return;
let stage='groups',currentGroup=null,currentItem=null,focusReturn=null;
const count=n=>n===1?'1 tool':n+' tools';
function element(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;}
function row(item,fn,asLink=false){
 const b=element(asLink?'a':'button','ct53-row');
 if(asLink){b.href=item.path+'?tool='+encodeURIComponent(item.id);}else b.type='button';
 b.append(element('span','ct53-row-symbol',item.groupIcon||'↗'));
 const text=element('span','ct53-row-body');
 text.append(element('strong','',item.title),element('small','',item.desc));
 b.append(text,element('span','ct53-chevron','›'));
 b.addEventListener('click',fn);
 return b;
}
function setHeader(title,sub){heading.textContent=title;hint.textContent=sub;back.hidden=stage==='groups';}
function fillRows(items,onSelect){
 content.replaceChildren();
 if(!items.length){content.append(element('p','ct53-empty','No matching tools. Try a different search.'));return;}
 const frag=document.createDocumentFragment();
 items.forEach(item=>frag.append(row(item,()=>onSelect(item))));
 content.append(frag);
}
function render(){
 content.replaceChildren();const q=search.value.trim().toLowerCase();
 if(q){stage='search';setHeader('Search tools',count(all.length)+' across all categories');fillRows(all.filter(item=>(item.title+' '+item.desc+' '+item.groupName).toLowerCase().includes(q)),choose);return;}
 if(stage==='search')stage='groups';
 if(stage==='groups'){
  setHeader('Explore tools',count(all.length)+' · '+groups.length+' categories');
  if(saved.length){const title=element('div','ct53-section-label','★ SAVED TOOLS');content.append(title);saved.map(id=>byId.get(id)).filter(Boolean).forEach(item=>content.append(row(item,()=>choose(item))));}
  if(recent.length){content.append(element('div','ct53-section-label','↺ RECENTLY USED'));recent.slice(0,4).map(id=>byId.get(id)).filter(Boolean).forEach(item=>content.append(row(item,()=>choose(item))));}
  content.append(element('div','ct53-section-label','ALL CATEGORIES'));
  groups.forEach(group=>{
   const button=element('button','ct53-row ct53-category');
   button.type='button';button.append(element('span','ct53-row-symbol',group.icon));
   const copy=element('span','ct53-row-body');copy.append(element('strong','',group.title),element('small','',group.subtitle+' · '+count(group.items.length)));
   button.append(copy,element('span','ct53-chevron','›'));button.addEventListener('click',()=>{stage='list';currentGroup=group;render();});
   content.append(button);
  });return;
 }
 if(stage==='list'&&currentGroup){
  setHeader(currentGroup.title,count(currentGroup.items.length)+' · Select a tool');
  fillRows(currentGroup.items.map(item=>byId.get(item.id)),choose);return;
 }
 if(stage==='detail'&&currentItem){
  const item=currentItem;
  setHeader(item.title,item.groupName);
  const info=element('div','ct53-tool-detail');
  info.append(element('span','ct53-detail-icon',item.groupIcon),element('h3','',item.title),element('p','',item.desc));
  const note=element('p','ct53-detail-note',item.group==='ai'?'Requires your Puter account; usage and paid credits depend on the provider.':item.group==='files'?'Supported formats depend on the browser and source file.':'Opens the existing working Connect workspace for this tool.');
  info.append(note);
  const actions=element('div','ct53-detail-actions');
  const open=element('button','ct53-primary','Open '+item.title+' ↗');open.type='button';open.addEventListener('click',()=>launch(item));
  const pin=element('button','ct53-secondary',saved.includes(item.id)?'★ Saved':'☆ Save tool');pin.type='button';pin.setAttribute('aria-pressed',String(saved.includes(item.id)));
  pin.addEventListener('click',()=>{saved=saved.includes(item.id)?saved.filter(id=>id!==item.id):[item.id,...saved].slice(0,24);savePins();render();});
  actions.append(open,pin);info.append(actions);
  const related=(groups.find(group=>group.id===item.group)?.items||[]).filter(candidate=>candidate.id!==item.id).slice(0,3);
  if(related.length){info.append(element('div','ct53-section-label','RELATED TOOLS'));const links=element('div','ct53-related');related.forEach(other=>{const b=element('button','ct53-related-link',other.title+' ↗');b.type='button';b.addEventListener('click',()=>choose(byId.get(other.id)));links.append(b);});info.append(links);}
  content.append(info);
 }
}
function choose(item){currentItem=item;stage='detail';render();}
function doBack(){if(search.value){search.value='';stage='groups';render();search.focus();return;}if(stage==='detail'){stage='list';currentGroup=groups.find(x=>x.id===currentItem?.group)||groups[0];}else stage='groups';render();}
function openSheet(){if(!backdrop.hidden)return;focusReturn=document.activeElement;stage='groups';currentGroup=null;currentItem=null;search.value='';render();backdrop.hidden=false;document.body.classList.add('ct53-open');requestAnimationFrame(()=>sheet.focus({preventScroll:true}));}
function closeSheet(){if(backdrop.hidden)return;backdrop.hidden=true;document.body.classList.remove('ct53-open');if(focusReturn?.isConnected)focusReturn.focus({preventScroll:true});}
function reveal(item){
 if(item.mode==='quick'){window.dispatchEvent(new CustomEvent('connect:open-tool',{detail:{id:item.target}}));const el=$('qt-active-tool');if(el)el.scrollIntoView({block:'start',behavior:'smooth'});return;}
 if(item.mode==='tab'){const tab=$(item.target);if(tab)tab.click();const section=tab?.closest('[role=tablist]')||tab;if(section)section.scrollIntoView({block:'start',behavior:'smooth'});return;}
 if(item.mode==='qr'){const tab=document.querySelector('[data-qr-type="'+item.target+'"]');if(tab)tab.click();const target=$('qr-content');if(target)target.scrollIntoView({block:'start',behavior:'smooth'});return;}
 const target=$(item.target);if(target){target.scrollIntoView({block:'center',behavior:'smooth'});if(target.matches('input,textarea,select'))target.focus({preventScroll:true});}
}
function launch(item){
 remember(item);
 closeSheet();
 const next=item.path+'?tool='+encodeURIComponent(item.id);
 if(location.pathname!==item.path||location.search!==new URL(next,location.origin).search){
  history.pushState({tool:item.id},'',next);
  window.dispatchEvent(new Event('popstate'));
 }
 requestAnimationFrame(()=>requestAnimationFrame(()=>reveal(item)));
}
back?.addEventListener('click',doBack);
$('connect-tools-close')?.addEventListener('click',closeSheet);
backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeSheet();});
search.addEventListener('input',render);
let swipeY=null;const handle=sheet.querySelector('.ct53-handle');
if(handle){handle.addEventListener('pointerdown',event=>{swipeY=event.clientY;});
handle.addEventListener('pointerup',event=>{if(swipeY!==null&&event.clientY-swipeY>65)closeSheet();swipeY=null;});
handle.addEventListener('pointercancel',()=>{swipeY=null;});}

document.addEventListener('keydown',event=>{
 if(backdrop.hidden)return;
 if(event.key==='Escape'){event.preventDefault();closeSheet();return;}
 if(event.key==='Tab'){
  const els=Array.from(sheet.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled]),a[href]')).filter(el=>el.getClientRects().length);
  const first=els[0],last=els[els.length-1];if(!first)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href]');
 if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||anchor.hasAttribute('download')||anchor.hasAttribute('data-tools-no-sheet')||anchor.closest('#connect-tools-overlay'))return;
 let url;try{url=new URL(anchor.href,location.href);}catch{return;}
 if(url.origin!==location.origin||url.pathname.replace(/\/$/,'')!=='/tools'||url.search)return;
 event.preventDefault();openSheet();
},true);
$('connect-tools-launch')?.addEventListener('click',openSheet);
$('connect-tools-show-all')?.addEventListener('click',()=>{closeSheet();history.pushState(null,'','/tools');window.dispatchEvent(new Event('popstate'));$('connect-tools-directory')?.scrollIntoView({block:'start',behavior:'smooth'});});
/* Full /tools page also displays every cross-studio tool for search engines and direct visitors. */
const library=$('connect-tools-directory');
if(library){
 const q=$('connect-tools-directory-search'),host=$('connect-tools-directory-items'),summary=$('connect-tools-directory-count');
 function renderDirectory(){
  const term=(q?.value||'').trim().toLowerCase();const found=all.filter(item=>(item.title+' '+item.desc+' '+item.groupName).toLowerCase().includes(term));
  summary.textContent=count(found.length)+' · '+groups.length+' categories';
  host.replaceChildren();
  for(const group of groups){const items=found.filter(item=>item.group===group.id);if(!items.length)continue;const section=element('section','ct53-directory-group');section.append(element('h3','',group.icon+' '+group.title));const grid=element('div','ct53-directory-grid');items.forEach(item=>grid.append(row(item,event=>{event.preventDefault();launch(item);},true)));section.append(grid);host.append(section);}
  if(!found.length)host.append(element('p','ct53-empty','No matching tool. Try another keyword.'));
 }
 q?.addEventListener('input',renderDirectory);renderDirectory();
}
/* Deep links /tools?tool=json and /qr?tool=qr-wifi work on first load and refresh. */
function readDeepLink(){const id=new URLSearchParams(location.search).get('tool');const item=byId.get(id);if(!item||item.path!==location.pathname)return;requestAnimationFrame(()=>requestAnimationFrame(()=>reveal(item)));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',readDeepLink,{once:true});else readDeepLink();
})();
