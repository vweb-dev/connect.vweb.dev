'use strict';
/* Unified section navigator — same bottom-sheet interaction as the Tools explorer. */
(()=>{
const $=id=>document.getElementById(id),overlay=$('connect-nav-overlay'),sheet=$('connect-nav-sheet'),content=$('connect-nav-content'),query=$('connect-nav-search');
if(!overlay||!sheet||!content||!query)return;
const sectionTitles={studios:'Workspaces',apps:'App Directory',academy:'Learn / LMS',pc:'Windows & Office',daily:'Daily Desk',network:'Speed Test',ai:'AI Studio',convert:'Convert Studio',qr:'QR Code Studio',play:'Games & Quizzes',offers:'Deals & Offers',community:'Local & Learn',dashboard:'My Workspace',account:'My Account'};
let catalog={apps:[],courses:[]};
try{const embedded=JSON.parse($('hub-offline-catalog')?.textContent||'{}');catalog.apps=Array.isArray(embedded.apps)?embedded.apps.filter(a=>a&&/^https:\/\//.test(a.open)):[];catalog.courses=Array.isArray(embedded.courses)?embedded.courses:[];}catch{}
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
const group=(id,title,icon,description,entries)=>({id,title,icon,description,entries});
const item=(id,title,description,url,options={})=>({id,title,description,url,...options});
const catalogGroups=[...new Set(catalog.apps.map(a=>a.category).filter(Boolean))].map(cat=>group('apps-'+cat,cat,'◧',catalog.apps.filter(a=>a.category===cat).length+' official app links',catalog.apps.filter(a=>a.category===cat).map(a=>item(a.id,a.name,a.desc,a.open,{external:true,kind:a.kind,icon:a.initial||'◧'}))));
function globalMenuResults(query){
 let tools=[];
 try{const parsed=JSON.parse($('connect-tool-route-catalog')?.textContent||'{}');tools=Array.isArray(parsed.tools)?parsed.tools:[];}catch{}
 const term=query.toLowerCase().trim(),words=term.split(/\s+/).filter(Boolean);
 const rows=[
  ...tools.map(t=>item('global-'+t.id,t.title,t.description,t.path,{icon:'⌘'})),
  ...catalog.apps.map(a=>item('global-app-'+a.id,a.name,a.desc||'Official publisher app',a.open,{external:true,icon:a.initial||'◧'})),
  ...catalog.courses.map(c=>item('global-course-'+c.id,c.title,c.description||'Video course','/academy/course/'+c.id,{icon:c.icon||'▶',courseId:c.id}))
 ];
 return rows.filter(i=>words.every(w=>(i.title+' '+i.description+' '+i.url).toLowerCase().includes(w))).slice(0,40);
}
const appGroups=[group('apps-featured','Featured apps','★','Popular publisher tools',catalog.apps.filter(a=>['powertoys','7zip','vscode','vlc','firefox','excalidraw','it-tools','vert','localsend','obsidian'].includes(a.id)).map(a=>item(a.id,a.name,a.desc,a.open,{external:true,kind:a.kind,icon:a.initial||'◧'}))),...catalogGroups];
const courseList=catalog.courses.map(c=>item('course-'+c.id,c.title,(c.provider||'Creator course')+' · '+(c.level||'Free lessons'),'/academy',{courseId:c.id,icon:c.icon||'▶',videoId:/^[a-zA-Z0-9_-]{11}$/.test(c.videoId||'')?c.videoId:null}));
const deep=(name,title,description,url,tool,options={})=>item(name,title,description,url+(tool?'?tool='+encodeURIComponent(tool):''),options);
const menus={
 apps:appGroups,
 academy:[group('courses','Video courses','▶','Continue a course from the learning library',courseList),group('learning','Learning tools','▤','Other ways to learn',[item('academy-open','Open complete LMS','Lessons, playlists and progress','/academy'),item('academy-apps','Education apps','Browse apps useful for learning','/apps')])],
 studios:[group('studios-create','Creative studios','✦','Create, convert and design',[item('ai-workspace','AI Studio','Chat, images, video and captions','/ai'),item('converter-workspace','Convert Studio','Images, PDF, audio and video','/convert'),item('qr-workspace','QR Studio','Design branded QR codes','/qr')]),group('studios-utility','Daily tools','⌘','Everyday and specialist utilities',[item('quick-workspace','All Tools','49 tool entries and subtools','/tools'),item('daily-workspace','Daily Desk','Notes, focus and calculations','/daily')])],
 pc:[group('pc-activation','Windows & Office Activation','▦','Choose licensing help or diagnostics',[
  deep('pc-win','Windows activation','Activation documentation and original sources','/pc','windows-activation'),
  deep('pc-office','Office activation','Microsoft 365 or Office activation help','/pc','office-activation'),
  deep('pc-diagnostics','License diagnostics','Built-in status and information commands','/pc','activation-diagnostics'),
  deep('pc-mas','MAS documentation','Review original GitHub repository and precautions','/pc','mas-methods')
 ]),group('pc-software','Windows software','▧','Install and maintain Windows',[
  deep('pc-winget','WinGet package builder','Build app installation commands','/pc','winget'),
  item('pc-apps','Software Directory','Official publisher links and downloads','/apps'),
  item('pc-winpage','Windows Command Center','All Windows resources and guides','/pc')
 ])],
 convert:[group('convert-files','File conversion','▤','Choose a dedicated tool',[deep('convert-image','Image Lab','Resize, compress and export images','/convert','image-lab'),deep('convert-pdf','PDF Lab','PDF extraction and document tools','/convert','pdf-lab'),deep('convert-audio','Audio Lab','Browser audio processing','/convert','audio-lab'),deep('convert-video','Video Lab','Browser media previews and exports','/convert','video-lab')])],
 ai:[group('ai-create','AI creation','✦','Requires Puter account; credits may apply',[deep('ai-chat','AI Chat','Questions and text generation','/ai','ai-chat'),deep('ai-image','Image Generator','Create images from text','/ai','ai-image'),deep('ai-video','Video Studio','Generate or test video capabilities','/ai','ai-video'),deep('ai-captions','Caption Studio','Social captions and ideas','/ai','ai-caption')])],
 qr:[group('qr-content','QR content types','▦','Choose what your QR opens',[
  ...[['url','Website'],['text','Text'],['wifi','Wi-Fi'],['whatsapp','WhatsApp'],['contact','Contact'],['email','Email'],['sms','SMS'],['phone','Phone'],['location','Location'],['event','Event']].map(([id,title])=>deep('qr-'+id,title+' QR','Generate a '+title.toLowerCase()+' QR code','/qr','qr-'+id)),
  deep('qr-designer','QR Designer','Colors, gradients, logos and exports','/qr','qr-designer')
 ])],
 daily:[group('daily-organize','Planning & notes','◷','Save data locally in your browser',[
  deep('daily-tasks','To-do List','Add and complete tasks','/daily','daily-tasks'),
  deep('daily-notes','Quick Notes','Autosaved notes','/daily','daily-notes'),
  deep('daily-timer','Focus Timer','25-minute sessions','/daily','daily-timer'),
  deep('daily-backup','Backup & Restore','Export/import your tasks and notes','/daily','daily-backup')
 ]),group('daily-utility','Calculators & utilities','⌘','Quick results without a paid API',[
  ...[['daily-currency','Currency Converter'],['daily-text','Text Tools'],['daily-password','Password Generator'],['daily-date','Date Calculator'],['daily-dictionary','Dictionary'],['daily-books','Book Discovery'],['daily-calculator','Calculator'],['daily-seo','SEO Snippet Checker']].map(([id,title])=>deep(id,title,'Open '+title.toLowerCase()+' workspace','/daily',id))
 ])],
 network:[group('network-speed','Connection tools','◉','Measure your browser connection',[deep('speed-test','Internet Speed Test','Download, upload, latency and jitter','/network','speed-test')])],
 play:[group('play-all','Games & Quizzes','◆','Play and learn',[item('play-all','Open Games & Quizzes','All available games','/play')])],
 offers:[group('offers-all','Deals & Offers','◈','Browse offers and resources',[item('offers-all','View current offers','All listed partner offers','/offers')])],
 community:[group('community-all','Community & resources','◎','Discover useful resources',[item('community-all','Explore resources','Local links and learning','/community')])],
 dashboard:[group('dashboard-all','Personal workspace','◇','Continue your local work',[item('dashboard-all','Open My Workspace','Saved apps, tools and activity','/dashboard')])],
 account:[group('account-all','Account options','◉','Manage your preferences',[item('account-all','Open My Account','Account and help','/account')])]
};
menus.more=[group('more-workspaces','Workspaces','⇄','AI, file conversion, QR and tools',[item('more-tools','Tools','Browse all tools','/tools'),item('more-ai','AI Studio','AI chat, images and more','/ai'),item('more-convert','Convert Studio','Files and media','/convert'),item('more-qr','QR Studio','Build QR codes','/qr')]),group('more-utilities','Utilities & services','⌘','Daily tools, apps and Windows',[item('more-daily','Daily Desk','Notes, focus and calculators','/daily'),item('more-pc','Windows & Office','Activation and software','/pc'),item('more-apps','App Directory','Official software links','/apps'),item('more-network','Speed Test','Network diagnostics','/network')]),group('more-personal','Learn & personal','◇','Continue learning and explore more',[item('more-learn','Learn / LMS','All courses','/academy'),item('more-play','Games','Quizzes and games','/play'),item('more-account','My Account','Your account options','/account')])];
let section='more',stage='groups',selectedGroup=null,selectedItem=null,lastFocused=null,searchReturnStage='groups';
const sections=Object.keys(sectionTitles);
const title=$('connect-nav-heading'),subtitle=$('connect-nav-subheading'),topBack=$('connect-nav-top-back'),bottomBack=$('connect-nav-bottom-back'),center=$('connect-nav-view-full');
function go(url,{courseId,appCategory}={}){
 close();let destination=new URL(url,location.origin);
 if(courseId&&destination.pathname==='/academy')destination=new URL('/academy/course/'+encodeURIComponent(courseId),location.origin);
 const legacyId=destination.searchParams.get('tool');
 if(legacyId){const canonical=window.ConnectToolRoutes?.getPath(legacyId);if(canonical)destination=new URL(canonical,location.origin);}
 if(destination.origin===location.origin&&destination.pathname==='/tools'&&!destination.search){$('connect-tools-launch')?.click();return;}
 if(destination.origin!==location.origin){window.open(destination.href,'_blank','noopener,noreferrer');return;}
 if(location.pathname!==destination.pathname||location.search!==destination.search||location.hash){history.pushState(null,'',destination.pathname+destination.search);window.dispatchEvent(new Event('popstate'));}
 if(courseId)window.dispatchEvent(new CustomEvent('connect:select-course',{detail:{id:courseId}}));
 if(courseId)window.dispatchEvent(new Event('connect:lms-classroom'));
 if(appCategory)window.dispatchEvent(new CustomEvent('connect:apps-open-category',{detail:{category:appCategory}}));
}
function courseThumbnail(source,detail=false){
 const wrap=el('span',detail?'lms58-detail-thumbnail':'lms58-thumbnail');
 const icon=el('span','lms58-thumbnail-fallback',source.icon||'▶');
 if(!source.videoId){wrap.append(icon);return wrap;}
 const img=el('img','lms58-thumbnail-image');
 img.src='https://i.ytimg.com/vi/'+encodeURIComponent(source.videoId)+'/mqdefault.jpg';
 img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 img.width=320;img.height=180;
 img.addEventListener('error',()=>{img.remove();wrap.append(icon);},{once:true});
 wrap.append(img);
 return wrap;
}
function drawRow(source,activate){
 const button=el('button','ct53-row connect56-row'+(source.courseId?' lms58-course-row':''));button.type='button';
 button.append(source.courseId?courseThumbnail(source):el('span','ct53-row-symbol',source.icon||'↗'));
 const copy=el('span','ct53-row-body');copy.append(el('strong','',source.title),el('small','',source.description||''));button.append(copy,el('span','ct53-chevron','›'));button.addEventListener('click',()=>activate(source));return button;
}
function viewFull(){go(section==='more'?'/studios':'/'+section);}
const desk57Rail=$('connect-nav-rail');
const desk57Wide=()=>window.matchMedia('(min-width:961px)').matches;
function desk57RenderRail(){
 if(!desk57Rail)return;
 desk57Rail.replaceChildren();
 const groups=menus[section]||menus.more;
 desk57Rail.append(el('div','desk57-rail-label','BROWSE '+(sectionTitles[section]||'CONNECT').toUpperCase()));
 for(const g of groups){
  const b=el('button','desk57-rail-item'+(selectedGroup?.id===g.id&&stage!=='groups'?' is-selected':''));b.type='button';
  b.setAttribute('aria-pressed',String(selectedGroup?.id===g.id&&stage!=='groups'));
  const icon=el('span','desk57-rail-icon',g.icon);const t=el('span','desk57-rail-copy');
  t.append(el('strong','',g.title),el('small','',g.entries.length+' options'));
  b.append(icon,t);
  b.addEventListener('click',()=>{selectedGroup=g;selectedItem=null;stage='list';query.value='';render();content.scrollTop=0;});
  desk57Rail.append(b);
 }
 const all=el('button','desk57-rail-all','◫ All categories');all.type='button';
 all.addEventListener('click',()=>{stage='groups';selectedGroup=null;query.value='';render();});
 desk57Rail.append(all);
}
function render(){
 const groups=menus[section]||menus.more,term=query.value.trim().toLowerCase();
 sheet.dataset.stage=term&&stage!=='detail'?'search':stage;
 desk57RenderRail();
 content.replaceChildren();const headline=section==='more'?'Explore Connect':(sectionTitles[section]||'Explore Connect');
 title.textContent=stage==='list'&&selectedGroup?.title||stage==='detail'&&selectedItem?.title||headline;
 subtitle.textContent=stage==='detail'?'Open the selected resource':stage==='list'?'Choose a tool or app':term?'Search results':'Browse categories and subtools';
 const canBack=stage!=='groups'||!!term;bottomBack.disabled=!canBack;topBack.disabled=!canBack;
 center.textContent='View full '+(section==='more'?'Connect':sectionTitles[section]||'section')+' ↗';
 if(term&&stage!=='detail'){
  const all=groups.flatMap(g=>g.entries.map(i=>({...i,icon:i.icon||g.icon})));
  const scoped=all.filter(i=>(i.title+' '+i.description).toLowerCase().includes(term));
  const found=section==='more'?[...scoped,...globalMenuResults(term)].slice(0,50):scoped.slice(0,120);
  if(!found.length)content.append(el('p','ct53-empty','No matching entries. Try a different search.'));
  found.forEach(i=>content.append(drawRow(i,selectItem)));return;
 }
 if(stage==='groups'){
  groups.forEach(g=>content.append(drawRow({...g,description:g.description+' · '+g.entries.length+' options'},()=>{selectedGroup=g;stage='list';render();})));return;
 }
 if(stage==='list'){
  if(!selectedGroup){stage='groups';render();return;}
  selectedGroup.entries.forEach(i=>content.append(drawRow({...i,icon:i.icon||selectedGroup.icon},selectItem)));return;
 }
 if(stage==='detail'&&selectedItem){
  const i=selectedItem,box=el('div','ct53-tool-detail');
  box.append(i.courseId?courseThumbnail(i,true):el('span','ct53-detail-icon',i.icon||selectedGroup?.icon||'◈'),el('h3','',i.title),el('p','',i.description));
  if(i.external)box.append(el('p','ct53-detail-note','Opens the official publisher website in a new tab. Downloads are not hosted by Connect.'));
  const actions=el('div','ct53-detail-actions'),open=el('button','ct53-primary',i.external?'Open official website ↗':'Open '+i.title+' ↗');open.type='button';open.addEventListener('click',()=>go(i.url,{courseId:i.courseId}));actions.append(open);
  if(section==='apps'){const full=el('button','ct53-secondary','Browse all apps');full.type='button';full.addEventListener('click',()=>go('/apps',{appCategory:selectedGroup?.id.startsWith('apps-')?selectedGroup?.title:'All'}));actions.append(full);}
  box.append(actions);content.append(box);
 }
}
function selectItem(i){selectedItem=i;query.value='';stage='detail';render();}
function back(){if(query.value){query.value='';stage='groups';render();return;}if(stage==='detail')stage='list';else if(stage==='list')stage='groups';else return;render();}
function open(which='more'){if(!overlay.hidden)return;section=menus[which]?which:'more';stage=desk57Wide()?'list':'groups';selectedGroup=desk57Wide()?(menus[section]?.[0]||null):null;selectedItem=null;lastFocused=document.activeElement;query.value='';overlay.hidden=false;document.body.classList.add('ct53-open');render();requestAnimationFrame(()=>sheet.focus({preventScroll:true}));}
function close(){if(overlay.hidden)return;overlay.hidden=true;document.body.classList.remove('ct53-open');if(lastFocused?.isConnected)lastFocused.focus({preventScroll:true});}
for(const id of ['connect-nav-top-back','connect-nav-bottom-back'])$(id)?.addEventListener('click',back);
for(const id of ['connect-nav-top-close','connect-nav-bottom-close'])$(id)?.addEventListener('click',close);
center?.addEventListener('click',viewFull);
query.addEventListener('input',render);
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
let touchY=null;const handle=sheet.querySelector('.ct53-handle');
handle?.addEventListener('pointerdown',event=>{touchY=event.clientY;});
handle?.addEventListener('pointerup',event=>{if(touchY!=null&&event.clientY-touchY>65)close();touchY=null;});
handle?.addEventListener('pointercancel',()=>{touchY=null;});
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();close();return;}
 if(e.key==='Tab'){const options=[...sheet.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(x=>x.getClientRects().length);const first=options[0],last=options[options.length-1];if(!first)return;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
 const button=event.target.closest('#mobile-more,#connect-apps-open-sheet,[data-connect-section],.side a[data-nav],.mobile-app-tabs [data-mobile-tab],.studio48-switcher a[data-studio-switch]');
 if(!button||button.closest('.ct53-overlay')||button.hasAttribute('download'))return;
 let target=button.dataset.connectSection||button.dataset.nav||button.dataset.studioSwitch||'more';
 if(button.id==='connect-apps-open-sheet')target='apps';
 if(button.id==='mobile-more')target='more';
 if(target==='home'||target==='tools')return;
 if(target==='studios'&&button.closest('.mobile-app-tabs'))target='studios';
 if(!menus[target])return;
 event.preventDefault();event.stopPropagation();open(target);
},true);
/* Contextual launchers make every section discoverable without changing the URL. */
for(const [route,name] of Object.entries(sectionTitles)){
 if(route==='apps')continue; // Apps has its own concise Browse Apps launcher.
 const page=$('page-'+route);if(!page)continue;
 const banner=el('div','connect56-page-banner');
 const copy=el('div','connect56-banner-copy');copy.append(el('strong','',name+' · Quick navigation'),el('span','',route==='apps'?'Browse app categories and official publisher links':'Explore related tools and sub-sections'));
 const btn=el('button','connect56-launch','Explore '+name+' ↑');btn.type='button';btn.dataset.connectSection=route;btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-controls','connect-nav-sheet');
 banner.append(copy,btn);page.insertBefore(banner,page.firstChild);
}
/* Explicit in-page triggers for apps and other sections. */
$('connect-desktop-explore')?.addEventListener('click',()=>open('more'));
window.ConnectSectionMenu={open};
})();
