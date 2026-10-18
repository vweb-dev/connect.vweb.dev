'use strict';
/** VWEB.DEV Connect 2.0: browser-only dashboard, academy, tools, catalog and PC guides. */
(() => {
const $=selector=>document.querySelector(selector),$$=selector=>Array.from(document.querySelectorAll(selector));
const el=(tag,cls,txt)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=txt;
 return n;
};
const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:null;}catch(_){return null;}};
const STORAGE='vweb.connect20.v1';
let data={courses:[],apps:[],studios:[],help:[]},appFilter='All',appSearch='',appKind='All',appSort='featured',appLimit=12,courseId=null,lessonIndex=0,playlistId=null;
const emptyState=()=>({favorites:[],pinnedTools:[],completed:{},position:{},notes:{},recent:[]});
function loadStore(){
 try{
  const p=JSON.parse(localStorage.getItem(STORAGE)||'null');
  if(!p||typeof p!=='object'||Array.isArray(p))return emptyState();
  return {
   favorites:Array.isArray(p.favorites)?p.favorites.filter(x=>typeof x==='string').slice(0,150):[],
   pinnedTools:Array.isArray(p.pinnedTools)?[...new Set(p.pinnedTools.filter(x=>typeof x==='string'))].slice(0,10):[],
   completed:p.completed&&typeof p.completed==='object'&&!Array.isArray(p.completed)?p.completed:{},
   position:p.position&&typeof p.position==='object'&&!Array.isArray(p.position)?p.position:{},
   notes:p.notes&&typeof p.notes==='object'&&!Array.isArray(p.notes)?p.notes:{},
   recent:Array.isArray(p.recent)?p.recent.filter(x=>typeof x==='string').slice(0,18):[]
  };
 }catch(_){return emptyState();}
}
let state=loadStore();
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(_){}}
function link(label,href,cls='hub-card-link',external=false){
 const n=el('a',cls,label);n.href=href;
 if(external){n.target='_blank';n.rel='noopener noreferrer';}
 return n;
}
function clear(root){if(root)root.replaceChildren();}
function textMsg(root,message){clear(root);root.append(el('p','hub-muted',message));}
function pill(txt){return el('span','hub-pill',txt);}
function favButton(id){
 const btn=el('button','hub-fav',state.favorites.includes(id)?'♥':'♡');
 btn.type='button';btn.setAttribute('aria-label',(state.favorites.includes(id)?'Remove favorite ':'Save ')+id);
 btn.setAttribute('aria-pressed',String(state.favorites.includes(id)));
 btn.addEventListener('click',()=>{
  state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id].slice(-150);
  save();renderApps();renderDashboard();renderHome();
 });
 return btn;
}
function appCard(item){
 const c=el('article','hub-app-card');
 const mark=el('div','hub-app-mark',item.initial||'◧');
 const title=el('h3','',item.name);
 const d=el('p','',item.desc);
 const meta=el('div','hub-app-meta');
 meta.append(pill(item.category),pill(item.kind));
 const footer=el('div','hub-app-footer');
 footer.append(link(item.kind==='Windows App'?'Official download ↗':'Open official app ↗',safeUrl(item.open)||'#apps','hub-card-link',true));
 if(item.winget && /^[-.\w+]+$/.test(item.winget)){
  const cmd=el('button','hub-app-winget','⌘ WinGet');cmd.type='button';
  cmd.title='Copy official package command for '+item.name;
  cmd.addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText('winget install --id '+item.winget+' --exact --source winget');
    cmd.textContent='Copied ✓';setTimeout(()=>cmd.textContent='⌘ WinGet',1800);
   }catch(_){cmd.title='Clipboard unavailable. Open Windows Hub to copy commands.';}
  });footer.append(cmd);
 }
 footer.append(favButton(item.id));
 c.append(mark,title,d,meta,footer);
 return c;
}
function studioCard(item){
 const c=el('article','hub-studio-card');
 const head=el('div','hub-studio-head');
 head.append(el('span','hub-studio-icon',item.icon),el('h3','',item.title));
 c.append(head,el('p','',item.subtitle));
 const tags=el('div','hub-studio-tags');
 (item.features||[]).forEach(f=>tags.append(pill(f)));
 c.append(tags);
 const open=el('button','hub-card-link','Open workspace ↗');
 open.type='button';
 open.addEventListener('click',()=>{
  location.hash='#'+item.page;
  if(item.tab)requestAnimationFrame(()=>{
   const tab=$('#convert-tab-'+item.tab);
   if(tab)tab.click();
  });
 });
 c.append(open);return c;
}
function renderHome(){
 $('#hub-count-studios').textContent=String(data.studios.length);
 $('#hub-count-apps').textContent=String(data.apps.length);
 $('#hub-count-courses').textContent=String(data.courses.length);
 $('#hub-count-tools').textContent=String(quickToolIndex.length);
 const root=$('#hub-home-studios');clear(root);
 data.studios.slice(0,4).forEach(item=>root.append(studioCard(item)));
 const apps=$('#hub-home-apps');clear(apps);
 ['powertoys','vert','7zip','vscode'].forEach(id=>{
  const item=data.apps.find(x=>x.id===id);if(item)apps.append(appCard(item));
 });
 const study=$('#hub-home-courses');clear(study);
 data.courses.forEach(course=>{
  const lessons=flatLessons(course),done=completedList(course.id).length;
  const card=el('button','hub-learning-card');card.type='button';
  const cover=el('img','hub-learning-poster');
  cover.src='https://i.ytimg.com/vi/'+course.videoId+'/mqdefault.jpg';
  cover.loading='lazy';cover.referrerPolicy='no-referrer';cover.alt='';cover.width=126;cover.height=72;
  cover.onerror=()=>cover.replaceWith(el('span','hub-learning-icon',course.icon));
  card.append(cover);
  const detail=el('div');detail.append(el('small','',course.provider+' · '+course.level),
   el('strong','',course.title),el('span','',done+' / '+lessons.length+' lessons completed'));
  card.append(detail,el('b','','↗'));
  card.addEventListener('click',()=>{setCourse(course.id,true);location.hash='#academy';startLesson(lessonIndex);});
  study.append(card);
 });
 const cont=$('#hub-continue');clear(cont);
 const last=data.courses.map(c=>{
  const progress=state.completed[c.id]||[];
  return {course:c,done:Array.isArray(progress)?progress.length:0,total:c.modules.reduce((n,m)=>n+m.lessons.length,0),
   last:Number.isInteger(state.position[c.id])?state.position[c.id]:0};
 }).sort((a,b)=>b.done-a.done);
 for(const item of last.slice(0,2)){
  const card=el('button','hub-continue-card');card.type='button';
  card.append(el('span','hub-continue-icon',item.course.icon),el('strong','',item.course.title));
  const p=el('div','hub-progress-track');
  const fill=el('span','hub-progress-fill');fill.style.width=Math.round(item.done/item.total*100)+'%';p.append(fill);
  card.append(p,el('small','',item.done+'/'+item.total+' steps completed'));
  card.addEventListener('click',()=>{setCourse(item.course.id,true);location.hash='#academy';startLesson(lessonIndex);});
  cont.append(card);
 }
}
function renderStudios(){
 const root=$('#hub-studios-grid');clear(root);
 data.studios.forEach(s=>root.append(studioCard(s)));
}
// Directory: show only a page of cards to keep low-memory phones responsive.
let appLayout='grid';
const featuredApps=['powertoys','7zip','vscode','vlc','gimp','obsidian','excalidraw','vert','firefox','brave','localsend','it-tools'];
function renderApps(){
 const host=$('#hub-app-library');clear(host);
 host.classList.toggle('is-list',appLayout==='list');
 $('#hub-app-view-grid').setAttribute('aria-pressed',String(appLayout==='grid'));
 $('#hub-app-view-list').setAttribute('aria-pressed',String(appLayout==='list'));
 const cats=$('#hub-app-categories');clear(cats);
 ['All',...new Set(data.apps.map(x=>x.category)),'Saved'].forEach(category=>{
  const button=el('button','hub-chip'+(appFilter===category?' selected':''),category);
  button.type='button';button.setAttribute('aria-pressed',String(appFilter===category));
  button.addEventListener('click',()=>{appFilter=category;appLimit=12;renderApps();});
  cats.append(button);
 });
 const visible=data.apps.filter(item=>{
  const category=appFilter==='All'||(appFilter==='Saved'?state.favorites.includes(item.id):item.category===appFilter);
  const kind=appKind==='All'||item.kind===appKind;
  return category&&kind&&[item.name,item.desc,item.category,...(item.tags||[])].join(' ').toLowerCase().includes(appSearch);
 });
 visible.sort((a,b)=>{
  if(appSort==='az')return a.name.localeCompare(b.name);
  if(appSort==='za')return b.name.localeCompare(a.name);
  const aRank=featuredApps.indexOf(a.id),bRank=featuredApps.indexOf(b.id);
  if(aRank!==-1||bRank!==-1)return (aRank===-1?999:aRank)-(bRank===-1?999:bRank);
  return a.name.localeCompare(b.name);
 });
 const shown=visible.slice(0,appLimit);
 $('#hub-app-count').textContent='Showing '+shown.length+' of '+visible.length+' resources · official publisher links';
 const more=$('#hub-app-more');more.hidden=visible.length<=appLimit;
 more.textContent='Show '+Math.min(12,visible.length-appLimit)+' more resources ↓';
 if(!visible.length)textMsg(host,'No matching apps. Change a filter or clear your search.');
 const fragment=document.createDocumentFragment();
 shown.forEach(item=>fragment.append(appCard(item)));
 host.append(fragment);
}
function resetApps(){
 appFilter='All';appSearch='';appKind='All';appSort='featured';appLimit=12;
 $('#hub-app-search').value='';$('#hub-app-kind').value='All';$('#hub-app-sort').value='featured';
 renderApps();
}
$('#hub-app-search').addEventListener('input',event=>{
 appSearch=event.target.value.trim().toLowerCase();appLimit=12;renderApps();
});
$('#hub-app-kind').addEventListener('change',event=>{
 appKind=event.target.value;appLimit=12;renderApps();
});
$('#hub-app-sort').addEventListener('change',event=>{
 appSort=event.target.value;appLimit=12;renderApps();
});
$('#hub-app-reset').addEventListener('click',resetApps);
$('#hub-app-more').addEventListener('click',()=>{appLimit+=12;renderApps();});
$$('[data-app-shortcut]').forEach(button=>button.addEventListener('click',()=>{
 const target=button.dataset.appShortcut;
 appFilter=target;appKind='All';appSearch='';appLimit=12;
 $('#hub-app-search').value='';$('#hub-app-kind').value='All';
 renderApps();
}));
for(const kind of ['grid','list']){
 $('#hub-app-view-'+kind).addEventListener('click',()=>{appLayout=kind;renderApps();});
}
// Optional global find: user searches a curated local index, not a backend.
const quickToolIndex=[
 {title:'Password Generator',detail:'Create strong passwords locally',destination:'#tools',tool:'password',icon:'✳'},
 {title:'Text Studio',detail:'Word count, text cleanup and uppercase',destination:'#tools',tool:'text',icon:'Aa'},
 {title:'Unit Converter',detail:'Convert length, mass, temperature and area',destination:'#tools',tool:'units',icon:'⇄'},
 {title:'CSV to JSON',detail:'Convert spreadsheet rows into JSON',destination:'#tools',tool:'csv',icon:'▤'},
 {title:'JSON Studio',detail:'Format, minify and validate JSON',destination:'#tools',tool:'json',icon:'{ }'},
 {title:'Text Encoder',detail:'URL and Unicode Base64 encode / decode',destination:'#tools',tool:'encode',icon:'↔'},
 {title:'SHA-256 Hash',detail:'Generate SHA-256 text fingerprints',destination:'#tools',tool:'hash',icon:'⌁'},
 {title:'UUID Generator',detail:'Create random UUID identifiers',destination:'#tools',tool:'uuid',icon:'#'},
 {title:'QR Code Studio',detail:'QR for website, Wi-Fi, WhatsApp and contact',destination:'#tools',tool:'qr',icon:'▦'},
 {title:'Color Contrast',detail:'Check accessible WCAG text contrast',destination:'#tools',tool:'contrast',icon:'◐'}
];
function openIndexedResult(item){
 if(item.course)setCourse(item.course,true);
 if(item.app){
  appFilter='All';appSearch=item.app.toLowerCase();appKind='All';appLimit=12;
  $('#hub-app-search').value=item.app;$('#hub-app-kind').value='All';renderApps();
 }
 if(item.tool){
  if(location.hash!=='#tools')location.hash='#tools';
  requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('connect:open-tool',{detail:{id:item.tool}})));
  return;
 }
 if(location.hash===item.destination&&item.destination==='#academy'&&item.course)startLesson(lessonIndex);
 else location.hash=item.destination;
}

function searchIndex(query){
 const q=query.toLowerCase().trim();
 if(!q)return [];
 const all=[
  ...quickToolIndex,
  ...data.studios.map(x=>({title:x.title,detail:x.subtitle,destination:'#studios',icon:x.icon})),
  ...data.courses.map(x=>({title:x.title,detail:x.description,destination:'#academy',course:x.id,icon:x.icon})),
  ...data.apps.map(x=>({title:x.name,detail:x.desc,destination:'#apps',app:x.name,icon:x.initial||'◧'})),
  ...data.help.map(x=>({title:x.title,detail:x.description,destination:'#pc',icon:'▦'}))
 ];
 return all.filter(x=>(x.title+' '+x.detail).toLowerCase().includes(q)).slice(0,9);
}
function renderGlobalSearch(){
 const root=$('#hub-search-results');
 const term=$('#hub-search').value.trim();
 clear(root);root.hidden=term.length<2;if(root.hidden)return;
 const matches=searchIndex(term);
 if(!matches.length){root.append(el('p','hub-muted','No matches. Try software, Windows, PDF, image or courses.'));return;}
 matches.forEach(item=>{
  const b=el('button','hub-search-item');b.type='button';
  b.append(el('span','hub-search-mark',item.icon),el('strong','',item.title),el('small','',item.detail.slice(0,100)));
  b.addEventListener('click',()=>{
   $('#hub-search').value='';root.hidden=true;
   openIndexedResult(item);
  });
  root.append(b);
 });
}
$('#hub-search').addEventListener('input',renderGlobalSearch);
$$('[data-hub-search]').forEach(button=>button.addEventListener('click',()=>{
 $('#hub-search').value=button.dataset.hubSearch;renderGlobalSearch();
 const field=$('#hub-search');field.focus();
}));
$('#hub-global-form').addEventListener('submit',event=>{
 event.preventDefault();
 renderGlobalSearch();
 const first=$('#hub-search-results button');
 if(first)first.click();
});
const palette=$('#hub-command-dialog'),paletteQuery=$('#hub-command-query'),paletteResults=$('#hub-command-results');
let paletteRows=[],palettePos=0;
const quickSections=[
 {title:'Tool Studios',detail:'Image, PDF, Media, QR, Design and developer tools',destination:'#studios',icon:'⇄'},
 {title:'Video Academy',detail:'Organized YouTube courses and full playlists',destination:'#academy',icon:'▶'},
 {title:'Windows & PC Help',detail:'Activation, repairs and official installers',destination:'#pc',icon:'▦'},
 {title:'App Directory',detail:'Curated Windows downloads, web apps and PWAs',destination:'#apps',icon:'◧'},
 {title:'My Workspace',detail:'Saved apps, notes, progress and recent activities',destination:'#dashboard',icon:'◇'},
 {title:'Convert Studio',detail:'On-device image, PDF, video and audio converters',destination:'#convert',icon:'▤'},
 {title:'Quick Utilities',detail:'QR code, passwords, text and everyday tools',destination:'#tools',icon:'⌘'},
 {title:'AI Studio',detail:'Puter AI chat, images, video and captions',destination:'#ai',icon:'✦'}
];
function paletteOptions(query){
 const q=query.toLowerCase().trim();
 const options=q?[...quickSections,...searchIndex(q)].filter(item=>
  (item.title+' '+item.detail).toLowerCase().includes(q)).slice(0,12):quickSections;
 const unique=new Set();
 return options.filter(item=>{
  const key=item.destination+'|'+item.title;
  if(unique.has(key))return false;unique.add(key);return true;
 });
}
function gotoSearchResult(item){
 if(palette.open)palette.close();
 $('#hub-search-results').hidden=true;
 openIndexedResult(item);
}
function highlightPalette(index){
 palettePos=index;
 paletteRows.forEach((button,i)=>{
  const active=i===palettePos;button.classList.toggle('selected',active);
  button.setAttribute('aria-selected',String(active));
 });
 if(paletteRows[palettePos])paletteRows[palettePos].scrollIntoView({block:'nearest'});
}
function renderPalette(){
 clear(paletteResults);
 paletteRows=[];
 const options=paletteOptions(paletteQuery.value);
 if(!options.length){paletteResults.append(el('p','hub-muted','No results. Try "PDF", "Windows", "courses", "AI" or "QR".'));return;}
 options.forEach((item,i)=>{
  const button=el('button','hub-command-item');button.type='button';button.setAttribute('role','option');
  button.append(el('span','hub-command-icon',item.icon||'◇'));
  const content=el('span','hub-command-text');
  content.append(el('strong','',item.title),el('small','',item.detail));
  button.append(content,el('span','hub-command-arrow','↗'));
  button.addEventListener('click',()=>gotoSearchResult(item));
  button.addEventListener('mouseenter',()=>highlightPalette(i));
  paletteResults.append(button);paletteRows.push(button);
 });
 highlightPalette(0);
}
function openPalette(){
 if(typeof palette.showModal!=='function'){location.hash='#home';$('#hub-search').focus();return;}
 if(palette.open)return;
 paletteQuery.value='';renderPalette();palette.showModal();
 paletteQuery.focus();
}
$('#hub-command-open').addEventListener('click',openPalette);
$('#hub-command-form').addEventListener('submit',event=>{event.preventDefault();if(palette.open)palette.close();});
paletteQuery.addEventListener('input',renderPalette);
paletteQuery.addEventListener('keydown',event=>{
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
  event.preventDefault();if(!paletteRows.length)return;
  highlightPalette((palettePos+paletteRows.length+(event.key==='ArrowDown'?1:-1))%paletteRows.length);
 }else if(event.key==='Enter'){
  event.preventDefault();if(paletteRows[palettePos])paletteRows[palettePos].click();
 }
});
palette.addEventListener('click',event=>{if(event.target===palette)palette.close();});
window.addEventListener('keydown',event=>{
 const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
 if(((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k')||
    (event.key==='/'&&!typing&&!event.ctrlKey&&!event.altKey)){
  event.preventDefault();openPalette();
 }
});
// Course Player: YouTube embeds only after click; no scraping or unauthorized playback proxy.
const courseList=$('#hub-course-list'),curriculum=$('#hub-curriculum');
function selectedCourse(){return data.courses.find(c=>c.id===courseId)||null;}
function flatLessons(course){
 if(!course)return [];
 return course.modules.flatMap((m,mi)=>m.lessons.map((l,li)=>({title:l[0],seconds:l[1],module:m.title,moduleIndex:mi,within:li})));
}
function completedList(id){
 const items=state.completed[id];return Array.isArray(items)?items:[];
}
function progressUpdate(course,items){
 const all=flatLessons(course),done=completedList(course.id).length;
 $('#hub-lesson-progress').textContent=done+' of '+all.length+' lessons marked completed ('+Math.round(done/Math.max(1,all.length)*100)+'%). Completion is marked by you, not tracked by YouTube.';
 $('#hub-curriculum-count').textContent=all.length+' lessons · '+course.modules.length+' sections';
}
function setCourse(id,restore=false){
 const next=data.courses.find(x=>x.id===id);if(!next)return;
 courseId=id;playlistId=null;
 const all=flatLessons(next);
 lessonIndex=restore&&Number.isInteger(state.position[id])?
  Math.max(0,Math.min(all.length-1,state.position[id])):0;
 $('#hub-course-note').value=typeof state.notes[id]==='string'?state.notes[id]:'';
 $('#hub-lesson-title').textContent=next.title;
 $('#hub-lesson-desc').textContent=next.description+' · '+next.provider;
 const link=$('#hub-video-official');link.href='https://www.youtube.com/watch?v='+next.videoId;link.hidden=false;
 const player=$('#hub-academy-player');clear(player);player.append(playerPlaceholder('Select a lesson to begin',next.provider+' · '+next.duration));
 renderCourses();renderCurriculum();progressUpdate(next);
 $('#hub-lesson-complete').disabled=false;
 $('#hub-lesson-complete').textContent=completedList(next.id).includes(lessonIndex)?'✓ Completed — undo':'✓ Mark lesson complete';
}
function playerPlaceholder(title,description){
 const div=el('div','hub-player-placeholder');div.append(el('span','','▶'),el('h2','',title),el('p','',description));return div;
}
function renderCourses(){
 clear(courseList);$('#hub-course-count').textContent=data.courses.length+' available';
 data.courses.forEach(item=>{
  const button=el('button','hub-course-choice'+(courseId===item.id?' selected':''));button.type='button';
  const cover=el('img','hub-course-poster');cover.src='https://i.ytimg.com/vi/'+item.videoId+'/default.jpg';cover.alt='';cover.loading='lazy';cover.referrerPolicy='no-referrer';cover.width=90;cover.height=68;
  cover.onerror=()=>cover.replaceWith(el('span','hub-course-symbol',item.icon));
  button.append(cover);
  const info=el('div');info.append(el('strong','',item.title),el('small','',item.provider+' · '+item.level));
  button.append(info);button.addEventListener('click',()=>{setCourse(item.id);startLesson(0);});courseList.append(button);
 });
}
function renderCurriculum(){
 clear(curriculum);
 const course=selectedCourse();if(!course)return;
 const all=flatLessons(course),done=completedList(course.id);
 course.modules.forEach((module,mi)=>{
  const group=el('section','hub-module');
  const header=el('div','hub-module-heading');
  header.append(el('strong','',module.title),el('small','',module.lessons.length+' lessons'));
  group.append(header);
  const offset=course.modules.slice(0,mi).reduce((n,m)=>n+m.lessons.length,0);
  module.lessons.forEach((lesson,idx)=>{
   const absolute=offset+idx;
   const button=el('button','hub-lesson-row'+(absolute===lessonIndex?' current':'')+(done.includes(absolute)?' finished':''));
   button.type='button';
   button.append(el('span','hub-lesson-status',done.includes(absolute)?'✓':'▶'));
   button.append(el('span','hub-lesson-name',(absolute+1)+'. '+lesson[0]));
   button.append(el('small','',Math.floor(lesson[1]/60)+':'+String(lesson[1]%60).padStart(2,'0')));
   button.addEventListener('click',()=>startLesson(absolute));
   group.append(button);
  });curriculum.append(group);
 });
 progressUpdate(course,all);
}
function playerIframe(src,title){
 const iframe=document.createElement('iframe');
 iframe.src=src;iframe.title=title;iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
 iframe.allowFullscreen=true;iframe.loading='lazy';iframe.referrerPolicy='strict-origin-when-cross-origin';
 const host=$('#hub-academy-player');host.replaceChildren(iframe);
}
function startLesson(index){
 const course=selectedCourse();if(!course)return;
 const all=flatLessons(course);if(!all[index])return;
 lessonIndex=index;
 state.position[course.id]=index;save();
 const current=all[index];
 const next=all[index+1];
 const url='https://www.youtube-nocookie.com/embed/'+course.videoId+'?start='+current.seconds+(next?'&end='+next.seconds:'')+'&rel=0&playsinline=1';
 playerIframe(url,course.title+' — '+current.title);
 $('#hub-lesson-title').textContent=current.title;
 $('#hub-lesson-desc').textContent=course.title+' · '+current.module+' · '+course.provider;
 $('#hub-video-official').href='https://www.youtube.com/watch?v='+course.videoId+'&t='+current.seconds+'s';
 $('#hub-video-official').hidden=false;
 $('#hub-lesson-complete').textContent=completedList(course.id).includes(index)?'✓ Completed — undo':'✓ Mark lesson complete';
 renderCurriculum();renderHome();renderDashboard();
}
function changeLesson(amount){
 const c=selectedCourse(),all=flatLessons(c);if(!all.length)return;
 startLesson(Math.max(0,Math.min(all.length-1,lessonIndex+amount)));
}
$('#hub-lesson-previous').addEventListener('click',()=>changeLesson(-1));
$('#hub-lesson-next').addEventListener('click',()=>changeLesson(1));
$('#hub-lesson-complete').addEventListener('click',()=>{
 const c=selectedCourse();if(!c||playlistId)return;
 const done=completedList(c.id);
 state.completed[c.id]=done.includes(lessonIndex)?done.filter(x=>x!==lessonIndex):[...done,lessonIndex];
 save();renderCurriculum();renderHome();renderDashboard();
 $('#hub-lesson-complete').textContent=state.completed[c.id].includes(lessonIndex)?'✓ Completed — undo':'✓ Mark lesson complete';
});
$('#hub-course-note').addEventListener('input',e=>{
 if(!courseId||playlistId)return;
 state.notes[courseId]=e.target.value.slice(0,12000);save();
});
function parsePlaylist(value){
 try{
  const u=new URL(value);
  if(!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(u.hostname))return null;
  const list=u.searchParams.get('list');
  return list&&/^[a-zA-Z0-9_-]{12,80}$/.test(list)?list:null;
 }catch(_){return null;}
}
$('#hub-playlist-open').addEventListener('click',()=>{
 const list=parsePlaylist($('#hub-playlist-url').value.trim());
 if(!list){$('#hub-playlist-url').setCustomValidity('Paste a valid YouTube playlist URL containing ?list=…');$('#hub-playlist-url').reportValidity();return;}
 $('#hub-playlist-url').setCustomValidity('');
 playlistId=list;courseId=null;
 $('#hub-lesson-complete').disabled=true;
 renderCourses();clear(curriculum);
 curriculum.append(el('p','hub-muted','YouTube’s official playlist player shows its playlist contents, navigation and playback. Custom lesson metadata requires the YouTube Data API or a separately curated curriculum.'));
 $('#hub-lesson-title').textContent='Your YouTube playlist';
 $('#hub-lesson-desc').textContent='Native playlist player · videos are loaded from YouTube, not Hostinger.';
 $('#hub-lesson-progress').textContent='Imported playlists are not automatically tracked as courses. Add a curated curriculum to enable completion and notes.';
 $('#hub-course-note').value='';
 $('#hub-video-official').href='https://www.youtube.com/playlist?list='+encodeURIComponent(list);
 $('#hub-video-official').hidden=false;
 playerIframe('https://www.youtube-nocookie.com/embed/videoseries?list='+encodeURIComponent(list)+'&rel=0','YouTube playlist');
});
$('#hub-playlist-url').addEventListener('input',e=>e.target.setCustomValidity(''));
// A custom playlist uses YouTube's native playlist UI. Its private/listing
// status is resolved by YouTube; we do not scrape YouTube pages.
// Help center: verified official destinations, copy-only diagnostic command.
const advice={
 digital:['Digital license not activated','Confirm your PC is online, sign into the Microsoft account linked to the license, then open Settings → System → Activation. Use Troubleshoot if available.'],
 hardware:['Activation lost after a hardware change','Use the Activation troubleshooter and “I changed hardware on this device recently”, using the Microsoft account previously linked to the license. Some license types cannot transfer.'],
 edition:['Edition or key does not match','Check whether Windows Home or Pro is installed, and compare against your legitimate license. A Home key generally does not activate Pro.'],
 'no-key':['No genuine license available','Windows needs a valid product key or digital license. Purchase one from Microsoft or an authorized retailer. Do not run unofficial activation scripts.']
};
function renderActivation(){
 const [title,desc]=advice[$('#hub-activation-case').value]||advice.digital;
 const area=$('#hub-activation-advice');clear(area);area.append(el('h3','',title),el('p','',desc));
 area.append(link('Microsoft activation help ↗','https://support.microsoft.com/en-us/windows/activate-windows','hub-card-link',true));
}
$('#hub-activation-case').addEventListener('change',renderActivation);
$('#hub-activation-copy').addEventListener('click',()=>copy('slmgr /xpr','#hub-activation-copy','Copy safe status-check command'));
function renderGuides(){
 const root=$('#hub-pc-guides');clear(root);
 data.help.forEach(item=>{
  const row=link(item.title+' ↗',item.url,'hub-guide',true);
  row.append(el('small','',item.description));root.append(row);
 });
}
// WinGet builder is a curated, client-side generator. It does not install apps.
const winGetKinds={
 'Browser':['firefox','chrome','brave'],
 'Everyday':['7zip','vlc','libreoffice','sumatrapdf','everything','powertoys','terminal'],
 'Creator':['gimp','inkscape','blender','audacity','obs','handbrake','sharex'],
 'Development':['vscode','git','github-desktop','nodejs','python','docker','filezilla','winscp','putty','notepadpp'],
 'Security':['keepassxc','brave','thunderbird'],
 'Communication':['telegram','discord'],
 'Entertainment':['steam','vlc','obsidian']
};
const selectedWinget=new Set();
let wingetSearch='',wingetCategory='All';
function packageKind(item){
 const category=Object.entries(winGetKinds).find(([,ids])=>ids.includes(item.id));
 return category?category[0]:'Other';
}
function renderWinGet(){
 const list=$('#hub-winget-options');list.replaceChildren();
 const apps=data.apps.filter(a=>a.winget && /^[-.\w+]+$/.test(a.winget));
 const categories=['All',...new Set(apps.map(packageKind))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b));
 const selector=$('#hub-winget-category');
 selector.replaceChildren();
 categories.forEach(category=>{
  const opt=el('option','',category==='All'?'All categories':category);opt.value=category;
  selector.append(opt);
 });
 selector.value=wingetCategory;
 const display=apps.filter(item=>{
  if(wingetCategory!=='All'&&packageKind(item)!==wingetCategory)return false;
  return [item.name,item.desc,item.winget].join(' ').toLowerCase().includes(wingetSearch);
 });
 display.forEach(item=>{
  const label=el('label','hub-winget-option');
  const input=document.createElement('input');input.type='checkbox';input.value=item.winget;
  input.checked=selectedWinget.has(item.winget);
  const content=el('span');content.append(el('strong','',item.name),el('small','',item.winget));
  input.addEventListener('change',()=>{
    if(input.checked)selectedWinget.add(item.winget);
    else selectedWinget.delete(item.winget);
    updateWinGet();
  });
  label.append(input,content);list.append(label);
 });
 $('#hub-winget-visible-count').textContent=display.length+' of '+apps.length+' installable packages displayed';
 if(!display.length)list.append(el('p','hub-muted','No matching packages. Clear the search or change the category.'));
 updateWinGet();
}
$('#hub-winget-search').addEventListener('input',event=>{
 wingetSearch=event.target.value.trim().toLowerCase();renderWinGet();
});
$('#hub-winget-category').addEventListener('change',event=>{
 wingetCategory=event.target.value;renderWinGet();
});
$('#hub-winget-select-visible').addEventListener('click',()=>{
 $$('#hub-winget-options input').forEach(i=>{i.checked=true;selectedWinget.add(i.value);});
 updateWinGet();
});
$('#hub-winget-clear').addEventListener('click',()=>{
 selectedWinget.clear();renderWinGet();
});
const softwarePacks={
 essential:['Mozilla.Firefox','7zip.7zip','VideoLAN.VLC','TheDocumentFoundation.LibreOffice','Microsoft.PowerToys','voidtools.Everything'],
 creator:['VideoLAN.VLC','OBSProject.OBSStudio','Google.Chrome','GIMP.GIMP','ShareX.ShareX'],
 developer:['Git.Git','Microsoft.VisualStudioCode','Notepad++.Notepad++','Mozilla.Firefox','Microsoft.WindowsTerminal','OpenJS.NodeJS.LTS'],
 creative:['BlenderFoundation.Blender','Inkscape.Inkscape','GIMP.GIMP','Audacity.Audacity','HandBrake.HandBrake'],
 privacy:['KeePassXCTeam.KeePassXC','Brave.Brave','Mozilla.Thunderbird','7zip.7zip'],
 media:['VideoLAN.VLC','HandBrake.HandBrake','OBSProject.OBSStudio','Audacity.Audacity']
};
$$('[data-pack]').forEach(button=>button.addEventListener('click',()=>{
 const allowed=new Set(data.apps.map(i=>i.winget).filter(Boolean));
 selectedWinget.clear();
 (softwarePacks[button.dataset.pack]||[]).filter(id=>allowed.has(id)).forEach(id=>selectedWinget.add(id));
 renderWinGet();
 $('#hub-winget-message').textContent=button.dataset.pack==='clear'?'Selection cleared.':'Software pack selected. Review each installer before use.';
}));
function downloadText(name,type,contents){
 const url=URL.createObjectURL(new Blob([contents],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function selectedWinGet(){
 const allow=new Set(data.apps.map(i=>i.winget).filter(id=>id&&/^[-.\w+]+$/.test(id)));
 return [...selectedWinget].filter(id=>allow.has(id)).sort();
}
function wingetCommand(id){return 'winget install --id '+id+' --exact --source winget';}
function wingetLines(){return selectedWinGet().map(wingetCommand);}
function updateWinGet(){
 $$('#hub-winget-options input').forEach(el=>el.checked=selectedWinget.has(el.value));
 const lines=wingetLines();
 $('#hub-winget-output').value=lines.join('\n');
 $('#hub-winget-count').textContent=lines.length+' app'+(lines.length===1?'':'s')+' selected';
 const chips=$('#hub-winget-selected-list');chips.replaceChildren();
 const picked=selectedWinGet();
 const label=el('span','hub-winget-picked-label',picked.length?'Ready to review:':'No software selected yet.');
 chips.append(label);
 for(const id of picked.slice(0,7)){
  const pkg=data.apps.find(item=>item.winget===id);
  const remove=el('button','hub-winget-picked-chip',(pkg?.name||id)+' ×');
  remove.type='button';remove.title='Remove '+(pkg?.name||id);
  remove.addEventListener('click',()=>{selectedWinget.delete(id);updateWinGet();});
  chips.append(remove);
 }
 if(picked.length>7)chips.append(el('span','hub-winget-picked-more','+'+(picked.length-7)+' more'));
}
$('#hub-winget-download').addEventListener('click',()=>{
 const commands=wingetLines();
 if(!commands.length){$('#hub-winget-message').textContent='Select applications first.';return;}
 const lines=['# VWEB.DEV Connect · WinGet software setup','# Generated locally; review package details before running.',
  '# Run winget show --id <ID> --exact to inspect a package.',...commands,''];
 downloadText('vweb-software-pack.ps1','text/plain;charset=utf-8',lines.join('\r\n'));
 $('#hub-winget-message').textContent='PowerShell file downloaded. Read and run it only if you trust every package.';
});
$('#hub-winget-cmd-download').addEventListener('click',()=>{
 const commands=wingetLines();
 if(!commands.length){$('#hub-winget-message').textContent='Select applications first.';return;}
 const lines=['@echo off','REM VWEB.DEV Connect software setup','REM Review and verify each package before running.',
  'where winget >nul 2>&1 || (echo WinGet is not available. & pause & exit /b 1)',
  ...commands,'echo Completed. Review installation results.','pause',''];
 downloadText('vweb-software-pack.cmd','text/plain;charset=utf-8',lines.join('\r\n'));
 $('#hub-winget-message').textContent='CMD batch file downloaded. Inspect it before executing on your PC.';
});
$('#hub-winget-json').addEventListener('click',()=>{
 const selected=selectedWinGet();
 if(!selected.length){$('#hub-winget-message').textContent='Select at least one application.';return;}
 const manifest={format:'vweb-software-pack',version:1,
  items:selected.map(id=>({packageId:id,source:'winget'}))};
 downloadText('vweb-software-pack.json','application/json',JSON.stringify(manifest,null,2));
 $('#hub-winget-message').textContent='Package list exported as VWEB JSON (not an importable WinGet manifest).';
});
$('#hub-winget-copy').addEventListener('click',()=>{
 if(!$('#hub-winget-output').value){$('#hub-winget-message').textContent='Select apps before copying.';return;}
 copy($('#hub-winget-output').value,'#hub-winget-message','');
});
// Legitimate Microsoft CMD diagnostics and licensed activation workflow.
let activationCmd='slmgr /xpr';
$$('[data-act-cmd]').forEach(button=>button.addEventListener('click',()=>{
 activationCmd=button.dataset.actCmd;$('#hub-act-cmd-text').textContent=activationCmd;
 $$('[data-act-cmd]').forEach(x=>x.classList.toggle('active',x===button));
}));
$('#hub-act-cmd-copy').addEventListener('click',()=>copy(activationCmd,'#hub-act-cmd-copy','Copy CMD'));
$('#hub-act-check-download').addEventListener('click',()=>{
 const script=['@echo off','title Windows activation status - read only',
 'echo Windows activation status report','cscript //nologo "%windir%\\system32\\slmgr.vbs" /xpr',
 'echo.','echo This tool never activates or alters a license.','pause',''];
 downloadText('windows-activation-status.cmd','text/plain;charset=utf-8',script.join('\r\n'));
});
async function copy(value,selector,defaultText){
 const target=$(selector);
 try{
  await navigator.clipboard.writeText(value);
  if(target.tagName==='BUTTON'){target.textContent='Copied ✓';setTimeout(()=>target.textContent=defaultText,2200);}
  else target.textContent='Copied. Review each command before running it in Windows Terminal.';
 }catch(_){
  if(target.tagName==='BUTTON')target.textContent='Copy unavailable: select the command below.';
  else target.textContent='Clipboard unavailable; select and copy commands manually.';
 }
}
// Dashboard, privacy and recent use
const pageNames={home:'Overview',studios:'Tool Studios',academy:'Video Academy',pc:'Windows Help',apps:'App Directory',
 dashboard:'My Workspace',convert:'Convert Studio',tools:'Quick Utilities',ai:'AI Studio',play:'Games',watch:'Watch',offers:'Deals',community:'Local & Learn',discover:'Discover'};
function trackVisit(){
 const route=(location.hash||'#home').slice(1)||'home';
 if(!pageNames[route])return;
 if(route==='academy'&&!playlistId&&!courseId&&data.courses.length)setCourse(data.courses[0].id,true);
 if(route==='dashboard')renderDashboard();
 state.recent=[route,...state.recent.filter(x=>x!==route)].slice(0,15);
 save();
 // Prevent unnecessary YouTube playback while browsing other sections.
 if(route!=='academy'){
  const p=$('#hub-academy-player');if(p.querySelector('iframe')){
   clear(p);p.append(playerPlaceholder('Video paused on leaving Academy','Return to the lesson and select Play.'));
  }
 }
}
function renderDashboard(){
 const favorites=state.favorites.filter(id=>data.apps.some(a=>a.id===id));
 const completed=Object.values(state.completed).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0);
 const pinned=state.pinnedTools.filter(id=>quickToolIndex.some(t=>t.tool===id));
 $('#hub-stat-saved').textContent=String(favorites.length+pinned.length);
 $('#hub-stat-done').textContent=String(completed);
 $('#hub-stat-recent').textContent=String(state.recent.length);
 const learning=$('#hub-dashboard-learning');clear(learning);
 data.courses.forEach(course=>{
  const all=flatLessons(course),count=completedList(course.id).length;
  const b=el('button','hub-dashboard-row');b.type='button';
  b.append(el('span','hub-dash-icon',course.icon),el('strong','',course.title),el('small','',count+'/'+all.length+' lessons'));
  b.addEventListener('click',()=>{setCourse(course.id,true);location.hash='#academy';startLesson(lessonIndex);});
  learning.append(b);
 });
 const saved=$('#hub-dashboard-saved');clear(saved);
 if(!favorites.length&&!pinned.length)saved.append(el('p','hub-muted','Save useful apps or pin Quick Utilities to find them here.'));
 favorites.forEach(id=>{
  const item=data.apps.find(a=>a.id===id);
  if(item)saved.append(link('◧ '+item.name+' ↗',item.open,'hub-dashboard-row',true));
 });
 pinned.forEach(id=>{
  const item=quickToolIndex.find(t=>t.tool===id);
  if(!item)return;
  const button=el('button','hub-dashboard-row','⌘ '+item.title+' ↗');button.type='button';
  button.addEventListener('click',()=>{
   location.hash='#tools';
   requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('connect:open-tool',{detail:{id}})));
  });
  saved.append(button);
 });
 const recent=$('#hub-dashboard-recent');clear(recent);
 state.recent.forEach(page=>recent.append(link(pageNames[page]+' ↗','#'+page,'hub-recent-chip')));
}
$('#hub-data-export').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify({format:'vweb-connect-workspace',version:1,exportedAt:new Date().toISOString(),data:state},null,2)],
  {type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='vweb-connect-workspace.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 $('#hub-data-message').textContent='Workspace exported as JSON.';
});
$('#hub-data-import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];
 if(!file)return;e.target.value='';
 if(file.size>1000000){$('#hub-data-message').textContent='Import file must be under 1 MB.';return;}
 try{
  const val=JSON.parse(await file.text());
  if(val.format!=='vweb-connect-workspace'||val.version!==1||!val.data)throw Error('Unknown workspace format.');
  const p=val.data;
  if(!Array.isArray(p.favorites)||!Array.isArray(p.recent)||typeof p.notes!=='object'||typeof p.completed!=='object'||typeof p.position!=='object')throw Error('Invalid workspace data.');
  const allowed=new Set(data.apps.map(a=>a.id)),courseIds=new Set(data.courses.map(c=>c.id));
  state.favorites=p.favorites.filter(x=>allowed.has(x)).slice(0,150);
  const toolIds=new Set(quickToolIndex.map(item=>item.tool));
  state.pinnedTools=Array.isArray(p.pinnedTools)?[...new Set(p.pinnedTools.filter(x=>toolIds.has(x)))].slice(0,10):[];
  state.recent=p.recent.filter(x=>pageNames[x]).slice(0,15);
  state.completed={};state.position={};state.notes={};
  for(const course of courseIds){
   const size=flatLessons(data.courses.find(c=>c.id===course)).length;
   const done=p.completed[course];
   state.completed[course]=Array.isArray(done)?[...new Set(done.filter(n=>Number.isInteger(n)&&n>=0&&n<size))]:[];
   const position=p.position[course];
   if(Number.isInteger(position)&&position>=0&&position<size)state.position[course]=position;
   const note=p.notes[course];
   if(typeof note==='string')state.notes[course]=note.slice(0,12000);
  }
  save();renderApps();renderHome();renderDashboard();if(courseId)setCourse(courseId,true);
  window.dispatchEvent(new Event('connect:pins-changed'));
  $('#hub-data-message').textContent='Workspace restored in this browser.';
 }catch(err){$('#hub-data-message').textContent='Could not import: '+err.message;}
});
$('#hub-data-reset').addEventListener('click',()=>{
 if(!window.confirm('Clear locally saved favorite apps, pinned tools, course progress, notes and recent sections?'))return;
 state=emptyState();save();renderApps();renderHome();renderDashboard();
 window.dispatchEvent(new Event('connect:pins-changed'));
 if(courseId)setCourse(courseId);
 $('#hub-data-message').textContent='Local workspace data cleared.';
});
// QR quick utility. Keep the existing tools page; avoid duplicating converters.
// Browser-local QR Studio with privacy-preserving Wi-Fi, contact and WhatsApp presets.
function addQR(){
 const tools=$('#page-tools .tools-grid');if(!tools)return;
 const card=el('article','tool-card hub-qr-card');
 const title=el('div','card-heading');const icon=el('div','tool-icon','▦'),intro=el('div');
 intro.append(el('h2','','QR Code Studio'),el('p','','Branded QR codes for links, Wi-Fi, contacts and WhatsApp.'));
 title.append(icon,intro);card.append(title);
 const tabs=el('div','hub-qr-types');
 const modes=[['url','Link / text'],['wifi','Wi-Fi'],['whatsapp','WhatsApp'],['contact','Contact']];
 let mode='url',loading=null,qrBlobUrl=null,lastPayload='';
 const editor=el('div','hub-qr-editor'),result=el('div','hub-qr-output');
 const config=el('div','hub-qr-config');
 const status=el('p','small-status','No file upload. QR is generated locally in your browser.');
 const actions=el('div','actions');
 const gen=el('button','button primary','Generate QR ↗');gen.type='button';
 const download=el('a','button secondary','Download PNG ↓');download.hidden=true;download.download='vweb-qr.png';
 const copyButton=el('button','button secondary','Copy QR content');copyButton.type='button';copyButton.disabled=true;
 actions.append(gen,download,copyButton);
 function field(name,label,type='text',placeholder=''){
  const wrapper=el('label','hub-qr-field');
  wrapper.append(el('span','',label));
  const control=el('input');control.name=name;control.type=type;control.placeholder=placeholder;control.autocomplete='off';
  control.className='hub-qr-field-input';wrapper.append(control);
  return wrapper;
 }
 function makeEditor(){
  editor.replaceChildren();
  const fields={
   url:[['payload','URL or text','text','https://example.com']],
   wifi:[['ssid','Wi-Fi network (SSID)','text','Your Wi-Fi'],['password','Wi-Fi password','password','Password'],['security','Security — WPA2/WPA3 password recommended','text','WPA']],
   whatsapp:[['number','WhatsApp number (international digits)','tel','923001234567'],['message','Prefilled message (optional)','text','Hello!']],
   contact:[['fullName','Contact name','text','Full name'],['phone','Phone number','tel','+92...'],['email','Email','email','name@example.com']]
  };
  for(const [name,label,type,placeholder] of fields[mode])editor.append(field(name,label,type,placeholder));
  if(mode==='wifi'){
   editor.querySelector('[name=security]').value='WPA';
   editor.querySelector('[name=password]').autocomplete='new-password';
  }
  if(mode==='url')editor.querySelector('[name=payload]').value='https://vweb.dev';
  status.textContent='Select Generate. QR content stays on this device.';
 }
 function getValue(name){return editor.querySelector('[name='+name+']')?.value?.trim()||'';}
 const escapeWifi=(s)=>s.replace(/[\\;,":]/g,'\\$&');
 function payload(){
  if(mode==='url'){const value=getValue('payload');if(!value)throw Error('Enter text or a link.');return value;}
  if(mode==='wifi'){
   const ssid=getValue('ssid'),password=getValue('password'),sec=getValue('security').toUpperCase();
   if(!ssid)throw Error('Enter your Wi-Fi network name.');
   if(!['WPA','WEP','NOPASS'].includes(sec))throw Error('Security must be WPA, WEP or nopass.');
   return 'WIFI:T:'+(sec==='NOPASS'?'nopass':sec)+';S:'+escapeWifi(ssid)+';P:'+escapeWifi(password)+';;';
  }
  if(mode==='whatsapp'){
   const digits=getValue('number').replace(/[+\s()-]/g,'');
   if(!/^\d{8,15}$/.test(digits))throw Error('Enter an international WhatsApp number (8–15 digits).');
   const msg=getValue('message');
   return 'https://wa.me/'+digits+(msg?'?text='+encodeURIComponent(msg):'');
  }
  const fullname=getValue('fullName'),phone=getValue('phone'),email=getValue('email');
  if(!fullname)throw Error('Enter a contact name.');
  const safe=s=>s.replace(/\\/g,'\\\\').replace(/\n/g,' ').replace(/[,;]/g,'\\$&');
  return ['BEGIN:VCARD','VERSION:3.0','FN:'+safe(fullname),
   phone?'TEL:'+safe(phone):'',email?'EMAIL:'+safe(email):'','END:VCARD'].filter(Boolean).join('\n');
 }
 modes.forEach(([key,label])=>{
  const btn=el('button','hub-qr-mode'+(key===mode?' active':''),label);
  btn.type='button';btn.addEventListener('click',()=>{
   mode=key;tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));
   result.replaceChildren();download.hidden=true;copyButton.disabled=true;makeEditor();
  });tabs.append(btn);
 });
 const colorOne=field('darkColor','QR pattern','color'),colorTwo=field('lightColor','Background','color');
 colorOne.querySelector('input').value='#101820';colorTwo.querySelector('input').value='#ffffff';
 const size=el('label','hub-qr-field');size.append(el('span','','Image size'));
 const sizes=el('select');sizes.innerHTML='<option value="256">256 × 256</option><option value="512" selected>512 × 512</option><option value="1024">1024 × 1024</option>';
 size.append(sizes);config.append(colorOne,colorTwo,size);
 card.append(tabs,editor,config,actions,result,status);tools.append(card);makeEditor();
 function library(){
  if(window.QRCode?.toCanvas)return Promise.resolve(window.QRCode);
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/qrcode@1.5.4/lib/browser.min.js';
   script.async=true;const timer=setTimeout(()=>{script.remove();loading=null;reject(Error('QR library timeout. Check network access.'));},14000);
   script.onload=()=>{clearTimeout(timer);
    if(window.QRCode?.toCanvas)resolve(window.QRCode);
    else{loading=null;reject(Error('QR library unavailable.'));}};
   script.onerror=()=>{clearTimeout(timer);loading=null;reject(Error('Could not load QR library.'));};
   document.head.append(script);
  });
  return loading;
 }
 gen.addEventListener('click',async()=>{
  let value;try{value=payload();}catch(error){status.textContent=error.message;return;}
  if(new TextEncoder().encode(value).length>1400){status.textContent='QR contents too long. Reduce text to 1,400 UTF-8 bytes.';return;}
  gen.disabled=true;status.textContent='Generating in your browser…';
  try{
   const lib=await library(),canvas=document.createElement('canvas');
   const dark=colorOne.querySelector('input').value,light=colorTwo.querySelector('input').value;
   await lib.toCanvas(canvas,value,{width:Number(sizes.value),margin:3,errorCorrectionLevel:'M',color:{dark,light}});
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG export failed.')),'image/png'));
   if(qrBlobUrl)URL.revokeObjectURL(qrBlobUrl);
   qrBlobUrl=URL.createObjectURL(blob);download.href=qrBlobUrl;download.hidden=false;
   result.replaceChildren(canvas);copyButton.disabled=false;lastPayload=value;
   status.textContent='QR ready. Keep high contrast for reliable scanning. No network request sent your content.';
  }catch(error){status.textContent=error.message;}
  finally{gen.disabled=false;}
 });
 copyButton.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(lastPayload);status.textContent='QR text copied to clipboard.';}
  catch(_){status.textContent='Clipboard unavailable; manually copy the input values.';}
 });
 window.addEventListener('pagehide',()=>{if(qrBlobUrl)URL.revokeObjectURL(qrBlobUrl);},{once:true});
}
// Small verified, dependency-free developer utilities.
function addDeveloperUtilities(){
 const parent=$('#page-tools .tools-grid');if(!parent)return;
 const json=el('article','tool-card hub-json-card');
 const head=el('div','card-heading');
 const icon=el('div','tool-icon','{ }');const info=el('div');
 info.append(el('h2','','JSON Studio'),el('p','','Format, minify, validate and copy JSON. All parsing is local.'));
 head.append(icon,info);
 const label=el('label','','Paste JSON');label.htmlFor='hub-json-input';
 const input=el('textarea');input.id='hub-json-input';input.rows=7;input.placeholder='{"hello":"world"}';
 const actions=el('div','actions');
 const out=el('textarea');out.id='hub-json-output';out.rows=7;out.readOnly=true;out.placeholder='Formatted output appears here';
 const note=el('p','small-status','Nothing is uploaded to Hostinger.');
 const verbs=[['Format',2],['Minify',0],['Validate',-1]];
 for(const [name,spaces] of verbs){
  const btn=el('button','button '+(spaces===2?'primary':'secondary'),name);btn.type='button';
  btn.addEventListener('click',()=>{
   try{
    if(input.value.length>500000)throw Error('Input too large for this browser tool (500 KB limit).');
    const parsed=JSON.parse(input.value);
    out.value=spaces===-1?'Valid JSON ✓':JSON.stringify(parsed,null,spaces);
    note.textContent='Valid JSON · '+(Array.isArray(parsed)?'array':parsed===null?'null':typeof parsed);
   }catch(error){out.value='';note.textContent='Invalid JSON: '+error.message;}
  });actions.append(btn);
 }
 const copyBtn=el('button','button secondary','Copy result');copyBtn.type='button';
 copyBtn.addEventListener('click',async()=>{
  if(!out.value)return;
  try{await navigator.clipboard.writeText(out.value);note.textContent='Copied result.';}
  catch(_){out.select();note.textContent='Select and copy the result manually.';}
 });
 const dl=el('button','button secondary','Download .json');dl.type='button';
 dl.addEventListener('click',()=>{
  if(!out.value||out.value==='Valid JSON ✓')return;
  downloadText('vweb-formatted.json','application/json',out.value);
 });
 actions.append(copyBtn,dl);json.append(head,label,input,actions,out,note);parent.append(json);
 const contrast=el('article','tool-card hub-contrast-card');
 const hd=el('div','card-heading'),ic=el('div','tool-icon','◐'),inf=el('div');
 inf.append(el('h2','','Color Contrast Checker'),el('p','','Live WCAG contrast ratio for accessible text.'));
 hd.append(ic,inf);
 const row=el('div','hub-contrast-inputs');
 const fg=fieldColor('Text color','#1b2730'),bg=fieldColor('Background','#f5e7cd');
 row.append(fg,bg);
 const preview=el('div','hub-contrast-preview','Readable text sample · Aa Bb Cc 123');
 const result=el('p','small-status');
 contrast.append(hd,row,preview,result);parent.append(contrast);
 function luminance(hex){
  const parts=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*parts[0]+.7152*parts[1]+.0722*parts[2];
 }
 function render(){
  const f=fg.querySelector('input').value,b=bg.querySelector('input').value;
  const l1=luminance(f),l2=luminance(b),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  preview.style.color=f;preview.style.background=b;
  result.textContent='Contrast '+ratio.toFixed(2)+':1 · '+(ratio>=7?'AAA normal text':ratio>=4.5?'AA normal text':ratio>=3?'AA large text only':'Fails AA text contrast');
 }
 function fieldColor(label,initial){
  const wrapper=el('label','hub-color-field');wrapper.append(el('span','',label));
  const input=el('input');input.type='color';input.value=initial;
  input.addEventListener('input',render);wrapper.append(input);return wrapper;
 }
 render();
}
// Lightweight tools for developers and everyday security checks.
function addExtraUtilities(){
 const parent=$('#hub-tools-source');if(!parent)return;
 function card(title,description,symbol,extraClass){
  const node=el('article','tool-card hub-tools-extra '+extraClass);
  const head=el('div','card-heading'),icon=el('div','tool-icon',symbol),info=el('div');
  info.append(el('h2','',title),el('p','',description));head.append(icon,info);
  node.append(head);parent.append(node);return node;
 }
 function control(tag,attributes,text){
  const node=el(tag,'',text);
  for(const [key,value] of Object.entries(attributes||{}))node[key]=value;
  return node;
 }
 function notice(parent,message){const n=el('p','small-status',message);parent.append(n);return n;}
 function copyText(value,target,status){
  if(!value){status.textContent='Generate a result first.';return;}
  if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(value).then(()=>status.textContent='Copied to clipboard.').catch(()=>{
    target.focus();target.select();status.textContent='Select and copy the highlighted result.';
   });
  }else{target.focus();target.select();status.textContent='Select and copy the highlighted result.';}
 }
 const encode=card('Text Encoder & Decoder','Encode or decode URL and Unicode-safe Base64 text.','⇄','hub-encode-card');
 const modeLabel=el('label','','Conversion');modeLabel.htmlFor='hub-encode-mode';
 const mode=control('select',{id:'hub-encode-mode'});
 for(const [id,label] of [['url-encode','URL encode'],['url-decode','URL decode'],['base64-encode','Base64 encode'],['base64-decode','Base64 decode']]){
  const option=control('option',{value:id},label);mode.append(option);
 }
 const inputLabel=el('label','','Input text');inputLabel.htmlFor='hub-encode-input';
 const input=control('textarea',{id:'hub-encode-input',rows:4,placeholder:'Enter or paste text…'});
 const outputLabel=el('label','','Result');outputLabel.htmlFor='hub-encode-output';
 const output=control('textarea',{id:'hub-encode-output',rows:4,readOnly:true,placeholder:'Output appears here…'});
 const encodeActions=el('div','actions wrap'),convert=control('button',{type:'button'},'Convert'),copy=control('button',{type:'button'},'Copy result');
 convert.className='button primary';copy.className='button secondary';
 encodeActions.append(convert,copy);encode.append(modeLabel,mode,inputLabel,input,encodeActions,outputLabel,output);
 const encodeStatus=notice(encode,'Uses the browser only. Nothing is sent to our server.');
 function toBase64(value){
  const bytes=new TextEncoder().encode(value);let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
 }
 function fromBase64(value){
  const binary=atob(value.trim());const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 }
 convert.addEventListener('click',()=>{
  try{
   if(input.value.length>100000)throw Error('Please use 100,000 characters or fewer.');
   const choice=mode.value;
   output.value=choice==='url-encode'?encodeURIComponent(input.value):
    choice==='url-decode'?decodeURIComponent(input.value):
    choice==='base64-encode'?toBase64(input.value):fromBase64(input.value);
   encodeStatus.textContent='Conversion complete · '+output.value.length+' characters.';
  }catch(error){output.value='';encodeStatus.textContent='Could not convert: '+error.message;}
 });
 copy.addEventListener('click',()=>copyText(output.value,output,encodeStatus));
 const hash=card('SHA-256 Hash Generator','Create a one-way fingerprint for text using Web Crypto.','⌁','hub-hash-card');
 const hashLabel=el('label','','Text to hash');hashLabel.htmlFor='hub-hash-input';
 const hashInput=control('textarea',{id:'hub-hash-input',rows:4,placeholder:'Text to fingerprint…'});
 const hashOutputLabel=el('label','','SHA-256 fingerprint');hashOutputLabel.htmlFor='hub-hash-output';
 const hashOut=control('textarea',{id:'hub-hash-output',rows:3,readOnly:true,placeholder:'64-character hexadecimal hash…'});
 const hashActions=el('div','actions wrap');
 const generate=control('button',{type:'button'},'Generate hash'),hashCopy=control('button',{type:'button'},'Copy hash');
 generate.className='button primary';hashCopy.className='button secondary';
 hashActions.append(generate,hashCopy);hash.append(hashLabel,hashInput,hashActions,hashOutputLabel,hashOut);
 const hashStatus=notice(hash,'The input remains on your device. SHA-256 is not encryption.');
 generate.addEventListener('click',async()=>{
  if(!crypto?.subtle){hashStatus.textContent='Web Crypto is unavailable. Open this page over HTTPS.';return;}
  if(hashInput.value.length>500000){hashStatus.textContent='Limit input to 500,000 characters.';return;}
  try{
   generate.disabled=true;
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(hashInput.value));
   hashOut.value=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
   hashStatus.textContent='SHA-256 generated locally.';
  }catch(err){hashStatus.textContent='Hash failed: '+err.message;}
  finally{generate.disabled=false;}
 });
 hashCopy.addEventListener('click',()=>copyText(hashOut.value,hashOut,hashStatus));
 const uuid=card('UUID Generator','Generate random identifiers for development and testing.','#','hub-uuid-card');
 const countLabel=el('label','','How many UUIDs?');countLabel.htmlFor='hub-uuid-count';
 const count=control('select',{id:'hub-uuid-count'});
 for(const amount of [1,5,10,20])count.append(control('option',{value:String(amount)},String(amount)));
 const uuidActions=el('div','actions wrap'),uuidGen=control('button',{type:'button'},'Generate UUIDs'),uuidCopy=control('button',{type:'button'},'Copy UUIDs');
 uuidGen.className='button primary';uuidCopy.className='button secondary';uuidActions.append(uuidGen,uuidCopy);
 const uuidLabel=el('label','','Generated UUIDs');uuidLabel.htmlFor='hub-uuid-output';
 const uuidOut=control('textarea',{id:'hub-uuid-output',rows:5,readOnly:true,placeholder:'Random UUIDs appear here…'});
 uuid.append(countLabel,count,uuidActions,uuidLabel,uuidOut);
 const uuidStatus=notice(uuid,'Generated with the browser’s cryptographically secure random source.');
 function randomUuid(){
  if(crypto.randomUUID)return crypto.randomUUID();
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 }
 uuidGen.addEventListener('click',()=>{
  try{
   uuidOut.value=Array.from({length:Number(count.value)},randomUuid).join('\n');
   uuidStatus.textContent='New random UUIDs generated locally.';
  }catch(err){uuidStatus.textContent='Cannot generate UUIDs: '+err.message;}
 });
 uuidCopy.addEventListener('click',()=>copyText(uuidOut.value,uuidOut,uuidStatus));
}
// Progressive enhancement: if this script fails or is blocked, the original
// quick utilities remain visible as ordinary cards.
// Quick Utilities 4.0 — single-tool workbench and compact searchable launcher.
// Move the original tool DOM node rather than cloning it: listeners and form state survive.
function initToolsTabs(){
 const root=$('#page-tools'),source=$('#hub-tools-source'),controls=$('#hub-tools-controls');
 const active=$('#qt-active-tool'),search=$('#hub-tools-search');
 if(!root||!source||!controls||!active||!search)return;
 const buttons=$$('#page-tools [data-tools-tab]');
 const keys=['all','everyday','developer','creative'];
 const panels=Object.fromEntries(keys.map(k=>[k,$('#hub-tools-panel-'+k)]));
 const lists=Object.fromEntries(keys.map(k=>[k,$('#hub-tools-list-'+k)]));
 if(buttons.length!==keys.length||keys.some(k=>!panels[k]||!lists[k]))return;
 const inventory=[
  {id:'password',category:'everyday',selector:'#password-output',icon:'✳',title:'Password Generator',detail:'Secure random passwords',keywords:'credentials symbols security'},
  {id:'text',category:'everyday',selector:'#text-content',icon:'Aa',title:'Text Studio',detail:'Count, clean and change case',keywords:'word count uppercase writing'},
  {id:'units',category:'everyday',selector:'#conv-mode',icon:'⇄',title:'Unit Converter',detail:'Distance, weight and temperature',keywords:'kilometer miles feet celsius'},
  {id:'csv',category:'developer',selector:'#csv-content',icon:'▤',title:'CSV to JSON',detail:'Turn rows into structured data',keywords:'spreadsheet excel convert'},
  {id:'json',category:'developer',selector:'#hub-json-input',icon:'{ }',title:'JSON Studio',detail:'Format, minify and validate',keywords:'developer formatter'},
  {id:'encode',category:'developer',selector:'#hub-encode-input',icon:'↔',title:'Text Encoder',detail:'URL and Base64 encoding',keywords:'decode unicode base64'},
  {id:'hash',category:'developer',selector:'#hub-hash-input',icon:'⌁',title:'SHA-256 Hash',detail:'Fingerprint your text',keywords:'crypto checksum sha'},
  {id:'uuid',category:'developer',selector:'#hub-uuid-output',icon:'#',title:'UUID Generator',detail:'Create unique identifiers',keywords:'random guid identifier'},
  {id:'qr',category:'creative',selector:'.hub-qr-card',icon:'▦',title:'QR Code Studio',detail:'Links, Wi-Fi and contacts',keywords:'whatsapp share scan'},
  {id:'contrast',category:'creative',selector:'.hub-contrast-card',icon:'◐',title:'Color Contrast',detail:'Check WCAG readability',keywords:'design accessible color contrast checker'}
 ];
 const tools=[];
 for(const item of inventory){
  const node=source.querySelector(item.selector)?.closest('.tool-card');
  if(!node)continue;
  tools.push({...item,node});
 }
 if(!tools.length)return;
 // Legacy static tools remain mounted for earlier script handlers, but are not offered twice.
 const counts={all:tools.length,everyday:0,developer:0,creative:0};
 tools.forEach(item=>{counts[item.category]++;item.node.dataset.toolsId=item.id;});
 keys.forEach(k=>{$('#hub-tool-count-'+k).textContent=String(counts[k]);});
 const clearButton=$('#hub-tools-clear'),summary=$('#hub-tools-summary'),empty=$('#hub-tools-no-results');
 const categoryLabel={all:'All tools',everyday:'Everyday',developer:'Developer',creative:'Design & Share'};
 let currentTab='all',current=null;
 const entries=new Map(),pinButton=$('#qt-pin-tool');
 function refreshPins(){
  entries.forEach((button,id)=>{
   const pinned=state.pinnedTools.includes(id);
   button.classList.toggle('pinned',pinned);
   const mark=button.querySelector('.qt-tool-arrow');
   if(mark)mark.textContent=pinned?'★':'↗';
  });
  if(!current||!pinButton)return;
  const pinned=state.pinnedTools.includes(current.id);
  pinButton.textContent=pinned?'★ Saved tool':'☆ Save tool';
  pinButton.setAttribute('aria-pressed',String(pinned));
 }
 if(pinButton)pinButton.addEventListener('click',()=>{
  if(!current)return;
  state.pinnedTools=state.pinnedTools.includes(current.id)
   ?state.pinnedTools.filter(id=>id!==current.id):state.pinnedTools.concat(current.id).slice(0,10);
  save();refreshPins();renderDashboard();
 });
 window.addEventListener('connect:pins-changed',refreshPins);
 function choose(item,{focusPanel=false}={}){
  if(!item||current===item)return;
  if(current)source.append(current.node);
  current=item;active.replaceChildren(item.node);
  $('#qt-active-title').textContent=item.title;
  $('#qt-active-description').textContent=item.detail;
  $('#qt-active-category').textContent=categoryLabel[item.category].toUpperCase()+' / WORKSPACE';
  entries.forEach((button,id)=>{
   const chosen=id===item.id;button.classList.toggle('active',chosen);
   button.setAttribute('aria-pressed',String(chosen));
   if(chosen&&focusPanel)button.scrollIntoView({block:'nearest',inline:'nearest'});
  });
  refreshPins();
  if(focusPanel&&matchMedia('(max-width: 700px)').matches){
   $('#qt-active-title').scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
 function matches(item,q){
  return !q||[item.title,item.detail,item.keywords,item.category].join(' ').toLowerCase().includes(q);
 }
 for(const item of tools){
  const button=el('button','qt-tool-choice');button.type='button';
  button.dataset.toolId=item.id;
  const icon=el('span','qt-tool-symbol',item.icon);
  const label=el('span','qt-tool-copy');
  label.append(el('strong','',item.title),el('small','',item.detail));
  const arrow=el('span','qt-tool-arrow','↗');arrow.setAttribute('aria-hidden','true');
  button.append(icon,label,arrow);
  button.addEventListener('click',()=>choose(item,{focusPanel:true}));
  entries.set(item.id,button);
 }
 function render(){
  const q=search.value.trim().toLowerCase();
  const candidates=tools.filter(item=>(currentTab==='all'||item.category===currentTab)&&matches(item,q));
  const list=lists[currentTab];list.replaceChildren();
  for(const item of candidates)list.append(entries.get(item.id));
  empty.hidden=candidates.length!==0;
  clearButton.hidden=q.length===0;
  summary.textContent=candidates.length+' '+(candidates.length===1?'tool':'tools');
  if(candidates.length&&(!current||!candidates.some(item=>item.id===current.id)))choose(candidates[0]);
  // Do not replace an existing active tool with a blank state on no search results.
 }
 function activate(key,{focus=false,resetSearch=false}={}){
  if(!keys.includes(key))key='all';
  currentTab=key;
  if(resetSearch)search.value='';
  buttons.forEach(button=>{
   const selected=button.dataset.toolsTab===key;
   button.setAttribute('aria-selected',String(selected));
   button.tabIndex=selected?0:-1;
  });
  keys.forEach(k=>{panels[k].hidden=k!==key;});
  render();
  if(focus)buttons.find(button=>button.dataset.toolsTab===key)?.focus();
 }
 buttons.forEach((button,index)=>{
  button.addEventListener('click',()=>activate(button.dataset.toolsTab,{resetSearch:true}));
  button.addEventListener('keydown',event=>{
   let next=null;
   if(event.key==='ArrowRight')next=(index+1)%buttons.length;
   else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;
   else if(event.key==='Home')next=0;
   else if(event.key==='End')next=buttons.length-1;
   if(next===null)return;
   event.preventDefault();activate(buttons[next].dataset.toolsTab,{focus:true,resetSearch:true});
  });
 });
 search.addEventListener('input',()=>activate('all'));
 clearButton.addEventListener('click',()=>{
  search.value='';activate('all');search.focus();
 });
 window.addEventListener('connect:open-tool',event=>{
  const item=tools.find(x=>x.id===event.detail?.id);
  if(!item)return;
  activate(item.category,{resetSearch:true});
  choose(item,{focusPanel:true});
 });
 // Expose the new interface only when the entire launcher is initialized.
 choose(tools[0]);
 source.hidden=true;
 controls.hidden=false;
 root.classList.add('qt-enhanced');
 activate('all');
}

// Critical Tool Studios and App Directory must never be empty because a
// network request is slow, a service worker is stale or optional APIs are down.
const fallbackCatalogNodes=new Map();
for(const selector of ['#hub-home-studios','#hub-home-apps','#hub-home-courses','#hub-studios-grid']){
 const root=$(selector);
 if(root)fallbackCatalogNodes.set(selector,root.innerHTML);
}
let catalogReady=false,catalogRefreshInProgress=false;
function catalogStatus(message){
 const root=$('#hub-catalog-status'),label=$('#hub-catalog-status-text');
 if(!root||!label)return;
 root.hidden=!message;
 label.textContent=message||'';
}
function restoreStaticCatalog(){
 for(const [selector,markup] of fallbackCatalogNodes){
  const root=$(selector);
  if(root&&!root.children.length&&markup)root.innerHTML=markup;
 }
}
function applyCatalog(payload){
 if(!payload||!Array.isArray(payload.studios)||!Array.isArray(payload.courses)||
   !Array.isArray(payload.apps)||!Array.isArray(payload.help)||!payload.studios.length)
  throw Error('Invalid tool catalog schema');
 const cleaned={...payload,
  apps:payload.apps.filter(item=>item&&safeUrl(item.open)),
  help:payload.help.filter(item=>item&&safeUrl(item.url))};
 data=cleaned;
 const failures=[];
 for(const fn of [renderHome,renderStudios,renderApps,renderGuides,renderActivation,renderWinGet,renderDashboard]){
  try{fn();}catch(err){failures.push(fn.name);console.warn('Connect catalog: '+fn.name,err);}
 }
 if(cleaned.courses.length){
  try{
   if(!courseId||!cleaned.courses.some(course=>course.id===courseId))setCourse(cleaned.courses[0].id,true);
   else{renderCourses();renderCurriculum();}
  }catch(err){failures.push('course player');console.warn('Connect course player',err);}
 }
 restoreStaticCatalog();
 catalogReady=true;
 if(failures.length)catalogStatus('Some tools could not initialize ('+failures.join(', ')+'). Refresh or retry the catalog.');
 return failures.length===0;
}
async function refreshCatalog(){
 if(catalogRefreshInProgress)return;
 catalogRefreshInProgress=true;
 const button=$('#hub-catalog-retry');
 if(button)button.disabled=true;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7500);
 try{
  const response=await fetch('/data/connect-hub.json',{cache:'no-cache',signal:controller.signal});
  if(!response.ok)throw Error('HTTP '+response.status);
  const fresh=await response.json();
  if(!fresh||!Array.isArray(fresh.studios)||!Array.isArray(fresh.apps)||!Array.isArray(fresh.courses))
   throw Error('Unexpected catalog format');
  const changed=!catalogReady||JSON.stringify(fresh)!==JSON.stringify(data);
  if(changed){if(!applyCatalog(fresh))return;}
  catalogStatus('');
 }catch(err){
  console.warn('Connect catalog request; offline fallback remains available',err);
  if(catalogReady)catalogStatus('Showing built-in tools and software. Latest catalog unavailable; you can keep working or retry.');
  else catalogStatus('Tool catalog could not load. Use the direct tool links below or retry.');
  restoreStaticCatalog();
 }finally{
  clearTimeout(timeout);
  catalogRefreshInProgress=false;
  if(button)button.disabled=false;
 }
}
$('#hub-catalog-retry').addEventListener('click',()=>refreshCatalog());
function boot(){
 // Local independent tools should continue working even if one fails.
 for(const init of [addQR,addDeveloperUtilities,addExtraUtilities,initToolsTabs]){
  try{init();}catch(err){console.warn('Local tool did not initialize',err);}
 }
 try{
  const fallback=$('#hub-offline-catalog');
  if(!fallback)throw Error('Embedded catalog missing');
  applyCatalog(JSON.parse(fallback.textContent||'{}'));
 }catch(err){
  console.warn('Embedded catalog unavailable',err);
  restoreStaticCatalog();
  catalogStatus('Tool catalog could not initialize. Open direct links below, or retry.');
 }
 trackVisit();
 // Background revalidation never blocks first render.
 void refreshCatalog();
}

// Network/PWA state: communicate limitations rather than silently failing.
function updateNetworkStatus(){
 const banner=$('#hub-network-status');if(!banner)return;
 banner.hidden=navigator.onLine!==false;
 banner.textContent='Offline mode: cached tools may work; YouTube, streams, software downloads and other online services require a connection.';
}
window.addEventListener('online',updateNetworkStatus);
window.addEventListener('offline',updateNetworkStatus);
updateNetworkStatus();
if('serviceWorker' in navigator){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  const el=$('#hub-update-alert');if(el)el.hidden=false;
 });
}
$('#hub-update-reload').addEventListener('click',()=>location.reload());

window.addEventListener('hashchange',trackVisit);
boot();
})();
