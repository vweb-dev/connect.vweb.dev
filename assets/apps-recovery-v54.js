'use strict';
/* Resilient app directory: if the main catalog fails, provide complete local discovery. */
(()=>{
const $=id=>document.getElementById(id),host=$('hub-app-library'),embedded=$('hub-offline-catalog');
if(!host||!embedded)return;
let catalog=[];
try{const doc=JSON.parse(embedded.textContent);if(Array.isArray(doc.apps))catalog=doc.apps.filter(item=>item&&typeof item.name==='string'&&typeof item.open==='string'&&/^https:\/\//i.test(item.open));}catch{}
let active=false,category='All',kind='All',sort='featured',search='',limit=12,layout='grid';
const elements=['hub-app-search','hub-app-kind','hub-app-sort','hub-app-reset','hub-app-more','hub-app-view-grid','hub-app-view-list','hub-app-categories','hub-app-count'];
if(elements.some(id=>!$(id)))return;
const ids=['powertoys','7zip','vscode','vlc','gimp','firefox','brave','obsidian','excalidraw','localsend','it-tools','vert'];
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
function favorites(){try{const state=JSON.parse(localStorage.getItem('vweb.connect20.v1')||'{}');return Array.isArray(state.favorites)?state.favorites:[];}catch{return [];}}
function toggleFavorite(id){try{const key='vweb.connect20.v1',state=JSON.parse(localStorage.getItem(key)||'{}'),favs=favorites();state.favorites=favs.includes(id)?favs.filter(item=>item!==id):[...favs,id].slice(-150);localStorage.setItem(key,JSON.stringify(state));}catch{}draw();}
function card(item){
 const c=el('article','hub-app-card'),mark=el('div','hub-app-mark',item.initial||'◧'),name=el('h3','',item.name),desc=el('p','',item.desc||'Visit the official publisher website.');
 const meta=el('div','hub-app-meta');meta.append(el('span','hub-pill',item.category||'App'),el('span','hub-pill',item.kind||'Software'));
 const foot=el('div','hub-app-footer'),link=el('a','hub-card-link',item.kind==='Windows App'?'Official download ↗':'Open official app ↗');
 link.href=item.open;link.target='_blank';link.rel='noopener noreferrer';foot.append(link);
 if(item.winget&&/^[-.\w+]+$/.test(item.winget)){
  const cmd=el('button','hub-app-winget','⌘ WinGet');cmd.type='button';cmd.addEventListener('click',()=>navigator.clipboard?.writeText('winget install --id '+item.winget+' --exact --source winget').then(()=>{cmd.textContent='Copied ✓';}).catch(()=>{cmd.textContent='Copy unavailable';}));foot.append(cmd);
 }
 const saved=favorites().includes(item.id),fav=el('button','hub-fav',saved?'♥':'♡');fav.type='button';fav.setAttribute('aria-label',(saved?'Remove favorite ':'Save ')+item.name);fav.setAttribute('aria-pressed',String(saved));fav.addEventListener('click',()=>toggleFavorite(item.id));foot.append(fav);
 c.append(mark,name,desc,meta,foot);return c;
}
function draw(){
 const categories=['All',...new Set(catalog.map(item=>item.category).filter(Boolean)),'Saved'];
 const chips=$('hub-app-categories');chips.replaceChildren();categories.forEach(value=>{const b=el('button','hub-chip'+(category===value?' selected':''),value);b.type='button';b.setAttribute('aria-pressed',String(category===value));b.addEventListener('click',()=>{category=value;limit=12;draw();});chips.append(b);});
 const favs=favorites(),visible=catalog.filter(item=>{
  const c=category==='All'||(category==='Saved'?favs.includes(item.id):item.category===category);
  return c&&(kind==='All'||item.kind===kind)&&[item.name,item.desc,item.category,...(Array.isArray(item.tags)?item.tags:[])].join(' ').toLowerCase().includes(search);
 });
 visible.sort((a,b)=>{if(sort==='az')return a.name.localeCompare(b.name);if(sort==='za')return b.name.localeCompare(a.name);const x=ids.indexOf(a.id),y=ids.indexOf(b.id);return (x===-1?999:x)-(y===-1?999:y)||a.name.localeCompare(b.name);});
 const page=visible.slice(0,limit);host.replaceChildren();host.classList.toggle('is-list',layout==='list');const fragment=document.createDocumentFragment();page.forEach(item=>fragment.append(card(item)));host.append(fragment);
 $('hub-app-count').textContent='Showing '+page.length+' of '+visible.length+' verified publisher listings · local catalog fallback';
 const more=$('hub-app-more');more.hidden=visible.length<=limit;more.textContent='Show '+Math.min(12,visible.length-limit)+' more apps ↓';
 if(!page.length)host.append(el('p','hub-muted',catalog.length?'No apps match these filters. Reset to view all.':'App catalog unavailable. Reload to try again.'));
 $('hub-app-view-grid').setAttribute('aria-pressed',String(layout==='grid'));$('hub-app-view-list').setAttribute('aria-pressed',String(layout==='list'));
}
function activate(){if(active||!catalog.length)return;active=true;const input=$('hub-app-search');if(input)input.value='';draw();
 input.addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();limit=12;draw();});
 $('hub-app-kind').addEventListener('change',e=>{kind=e.target.value;limit=12;draw();});
 $('hub-app-sort').addEventListener('change',e=>{sort=e.target.value;draw();});
 $('hub-app-reset').addEventListener('click',()=>{search='';kind='All';sort='featured';category='All';limit=12;input.value='';$('hub-app-kind').value='All';$('hub-app-sort').value='featured';draw();});
 $('hub-app-more').addEventListener('click',()=>{limit+=12;draw();});
 for(const mode of ['grid','list'])$('hub-app-view-'+mode).addEventListener('click',()=>{layout=mode;draw();});
 document.querySelectorAll('[data-app-shortcut]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.appShortcut;search='';kind='All';limit=12;input.value='';$('hub-app-kind').value='All';draw();}));
 const status=$('hub-catalog-status-text');if(status)status.textContent='Showing built-in apps while the primary catalog is unavailable.';
}
function check(){const count=$('hub-app-count')?.textContent||'';const cards=host.querySelectorAll('.hub-app-card');if(!count.startsWith('Showing ')||cards.length===0)activate();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check();
window.addEventListener('pageshow',()=>{if(!active)check();});
})();