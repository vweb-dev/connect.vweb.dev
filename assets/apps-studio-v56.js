'use strict';
/* Self-sufficient official Apps Directory. Keeps functioning if the wider catalog module fails. */
(()=>{
 const $=id=>document.getElementById(id),host=$('hub-app-library'),embedded=$('hub-offline-catalog');
 if(!host||!embedded)return;
 let apps=[];
 try{const data=JSON.parse(embedded.textContent||'{}');apps=Array.isArray(data.apps)?data.apps.filter(a=>a&&typeof a.name==='string'&&typeof a.open==='string'&&/^https:\/\/[^/\s]+/i.test(a.open)):[];}catch(e){}
 if(!apps.length)return; // preserve all server-rendered app cards
 window.__connectAppsStudio=true;
 const refs=['hub-app-search','hub-app-kind','hub-app-sort','hub-app-categories','hub-app-count','hub-app-more','hub-app-view-grid','hub-app-view-list','hub-app-reset'];
 if(refs.some(id=>!$(id)))return;
 const key='vweb.connect20.v1',featured=['powertoys','7zip','vscode','vlc','gimp','firefox','brave','obsidian','excalidraw','localsend','it-tools','vert'];
 let category='All',kind='All',sort='featured',search='',limit=24,layout='grid';
 const elt=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=String(value);return el;};
 const stored=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}};
 const favoriteIds=()=>{const favs=stored().favorites;return Array.isArray(favs)?favs.filter(v=>typeof v==='string'):[];};
 function toggleFavorite(app){const data=stored(),favs=favoriteIds();data.favorites=favs.includes(app.id)?favs.filter(id=>id!==app.id):[...favs,app.id].slice(-150);try{localStorage.setItem(key,JSON.stringify(data));}catch{};render();window.dispatchEvent(new CustomEvent('connect:apps-favorites-changed'));}
 function card(app){
  const el=elt('article','hub-app-card app56-card');el.dataset.appId=app.id;
  el.append(elt('div','hub-app-mark',app.initial||'◧'),elt('h3','',app.name),elt('p','',app.desc||'Explore the official publisher website.'));
  const meta=elt('div','hub-app-meta');meta.append(elt('span','hub-pill',app.category||'Software'),elt('span','hub-pill',app.kind||'App'));el.append(meta);
  const footer=elt('div','hub-app-footer'),link=elt('a','hub-card-link',app.kind==='Windows App'?'Official download ↗':'Open official app ↗');
  link.href=app.open;link.target='_blank';link.rel='noopener noreferrer';footer.append(link);
  if(app.winget&&/^[-.\w+]+$/.test(app.winget)){
   const command='winget install --id '+app.winget+' --exact --source winget';
   const btn=elt('button','hub-app-winget','⌘ WinGet');btn.type='button';btn.title='Copy WinGet command';btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command);btn.textContent='Copied ✓';}catch{btn.textContent='Clipboard unavailable';}});footer.append(btn);
  }
  const favorite=favoriteIds().includes(app.id),save=elt('button','hub-fav',favorite?'♥':'♡');save.type='button';save.setAttribute('aria-pressed',String(favorite));save.setAttribute('aria-label',(favorite?'Remove saved app: ':'Save app: ')+app.name);
  save.addEventListener('click',()=>toggleFavorite(app));footer.append(save);el.append(footer);return el;
 }
 const categories=['All',...new Set(apps.map(a=>a.category).filter(Boolean)),'Saved'];
 function render(){
  const favs=favoriteIds();
  const filtered=apps.filter(a=>(category==='All'||(category==='Saved'?favs.includes(a.id):a.category===category))&&(kind==='All'||a.kind===kind)&&[a.name,a.desc,a.category,a.kind,...(Array.isArray(a.tags)?a.tags:[])].join(' ').toLowerCase().includes(search));
  filtered.sort((a,b)=>{if(sort==='az')return a.name.localeCompare(b.name);if(sort==='za')return b.name.localeCompare(a.name);const aa=featured.indexOf(a.id),bb=featured.indexOf(b.id);return (aa<0?999:aa)-(bb<0?999:bb)||a.name.localeCompare(b.name);});
  const show=filtered.slice(0,limit),fragment=document.createDocumentFragment();show.forEach(app=>fragment.append(card(app)));
  if(!show.length)fragment.append(elt('p','hub-muted',apps.length?'No matching apps. Reset your filters to see all software.':'App catalog is temporarily unavailable.'));
  host.replaceChildren(fragment);host.classList.toggle('is-list',layout==='list');
  const filters=$('hub-app-categories');filters.replaceChildren();
  for(const c of categories){const button=elt('button','hub-chip'+(category===c?' selected':''),c);button.type='button';button.setAttribute('aria-pressed',String(category===c));button.addEventListener('click',()=>{category=c;limit=24;render();});filters.append(button);}
  $('hub-app-count').textContent='Showing '+show.length+' of '+filtered.length+' official apps · '+apps.length+' listed';
  const more=$('hub-app-more');more.hidden=show.length===filtered.length;more.textContent='Show '+Math.min(24,filtered.length-show.length)+' more apps ↓';
  for(const mode of ['grid','list'])$('hub-app-view-'+mode).setAttribute('aria-pressed',String(mode===layout));
 }
 function reset(){category='All';kind='All';sort='featured';search='';limit=24;$('hub-app-search').value='';$('hub-app-kind').value='All';$('hub-app-sort').value='featured';render();}
 $('hub-app-search').addEventListener('input',event=>{search=event.target.value.trim().toLowerCase();limit=24;render();});
 $('hub-app-kind').addEventListener('change',event=>{kind=event.target.value;limit=24;render();});
 $('hub-app-sort').addEventListener('change',event=>{sort=event.target.value;render();});
 $('hub-app-reset').addEventListener('click',reset);
 $('hub-app-more').addEventListener('click',()=>{limit+=24;render();});
 for(const mode of ['grid','list'])$('hub-app-view-'+mode).addEventListener('click',()=>{layout=mode;render();});
 document.querySelectorAll('[data-app-shortcut]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.appShortcut;kind='All';search='';limit=24;$('hub-app-search').value='';$('hub-app-kind').value='All';render();}));
 window.addEventListener('storage',event=>{if(event.key===key)render();});
 window.addEventListener('connect:apps-open-category',event=>{category=categories.includes(event.detail?.category)?event.detail.category:'All';search='';limit=24;render();});
 window.ConnectApps={render,apps,categories,chooseCategory:(value)=>{category=categories.includes(value)?value:'All';search='';limit=24;render();}};
 render();
})();