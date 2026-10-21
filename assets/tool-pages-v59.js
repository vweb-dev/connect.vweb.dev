'use strict';
/* Dedicated tool and course routes. All processing stays in the existing modules. */
(()=>{
 const root=document.documentElement,$=id=>document.getElementById(id);
 let tools=[];
 try{const value=JSON.parse($('connect-tool-route-catalog')?.textContent||'{}');tools=Array.isArray(value.tools)?value.tools:[];}catch{}
 const byPath=new Map(tools.map(t=>[t.path,t])),byId=new Map(tools.map(t=>[t.id,t]));
 const areas=new Set(['tools','convert','qr','ai','daily','pc']);
 const categories={tools:'Browser tools',convert:'File converters',qr:'QR Studio',ai:'AI Studio',daily:'Daily Desk',pc:'Windows & Office',network:'Internet utilities'};
 const courses=[{id:'windows11',title:'Master Windows 11'},{id:'canva',title:'Canva Design Masterclass'},{id:'python',title:'Python Programming — Full Course'},{id:'htmlcss',title:'HTML & CSS — Build Real Websites'},{id:'excel',title:'Microsoft Excel for Beginners'}];
 const byCourse=new Map(courses.map(c=>['/academy/course/'+c.id,c]));
 const el=(tag,cls,content)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(content!=null)x.textContent=content;return x;};
 function path(){return '/'+location.pathname.split('/').filter(Boolean).join('/');}
 function ancestors(target,page){
  let node=target;
  while(node&&node!==page){node.classList.add('tool59-branch');node=node.parentElement;}
 }
 function clear(){
  for(const el of document.querySelectorAll('.tool59-hidden,.tool59-branch,.tool59-selected'))el.classList.remove('tool59-hidden','tool59-branch','tool59-selected');
  root.removeAttribute('data-connect-tool-route');root.removeAttribute('data-connect-tool-directory');root.removeAttribute('data-connect-course-route');
  for(const id of ['connect-tool59-hero','connect-tool59-related','connect-tool59-directory'])$(id)?.remove();
  document.querySelectorAll('.tool59-related').forEach(n=>n.remove());
 }
 function relatedList(tool){
  const nav=el('nav','tool59-related');nav.id='connect-tool59-related';nav.setAttribute('aria-label','Related tools');
  nav.append(el('span','', 'Related tools'));
  const related=tools.filter(t=>t.section===tool.section&&t.id!==tool.id).slice(0,5);
  for(const other of related){const a=el('a','',other.title+' ↗');a.href=other.path;nav.append(a);}
  return nav;
 }
 function intro(page,{title,description,base,course=false}){
  let hero=$('connect-tool59-hero');
  if(!hero){hero=el('section','tool59-hero');hero.id='connect-tool59-hero';page.prepend(hero);}
  else{hero.replaceChildren();}
  const breadcrumbs=el('nav','tool59-breadcrumb');breadcrumbs.setAttribute('aria-label','Breadcrumb');
  const back=el('a','','Home');back.href='/';const category=el('a','',categories[base]||'Learn');category.href=course?'/academy':'/'+base;
  breadcrumbs.append(back,el('span','', '›'),category,el('span','', '›'),el('span','',title));
  hero.append(breadcrumbs,el('div','overline',course?'YOUR FOCUSED CLASSROOM':'ONE TOOL · ONE WORKSPACE'),el('h1','',title),el('p','',description));
  return hero;
 }
 function suppressOtherTopLevel(page){
  for(const child of page.children){
   if(!child.classList.contains('tool59-branch')&&child.id!=='connect-tool59-hero'&&child.id!=='connect-tool59-related')child.classList.add('tool59-hidden');
  }
 }
 function applyTool(tool){
  root.dataset.connectToolRoute=tool.id;
  const page=$('page-'+tool.section);if(!page)return;
  page.hidden=false;
  intro(page,{title:tool.title,description:tool.description+'.',base:tool.section});
  let selected=null;
  if(tool.mode==='quick'){
   const candidate=$('qt-active-tool');selected=candidate;
   window.dispatchEvent(new CustomEvent('connect:open-tool',{detail:{id:tool.target}}));
   selected=candidate;
  }else if(tool.mode==='tab'){
   const tab=$(tool.target);tab?.click();selected=$(tool.target.replace('-tab-','-pane-'));
  }else if(tool.mode==='qr'){
   document.querySelector('[data-qr-type="'+tool.target+'"]')?.click();
   selected=page.querySelector('.qr-workbench');
  }else if(tool.mode==='office'){
   const pick=$(tool.target);if(pick){pick.value='office-account';pick.dispatchEvent(new Event('change',{bubbles:true}));}
   selected=pick?.closest('.hub-panel')||pick?.parentElement;
   $('office-activation-help')?.classList.add('tool59-branch');
  }else if(tool.mode==='expand'){
   selected=$(tool.target)?.closest('details')||$(tool.target);
   if(selected?.tagName==='DETAILS')selected.open=true;
  }else{
   selected=$(tool.target);
   if(tool.section==='daily')selected=selected?.closest('.daily-panel')||selected;
   if(tool.section==='pc')selected=selected?.closest('.hub-panel,.connect-mas-command,.ct54-office-help,.win-deep-dive,.hub-activation-scripts')||selected;
  }
  if(!selected){console.warn('Tool workspace not available:',tool.id);return;}
  selected.classList.add('tool59-selected');
  ancestors(selected,page);
  if(tool.section==='daily'){
   page.querySelectorAll('.daily-panel').forEach(panel=>{if(panel!==selected)panel.classList.add('tool59-hidden');});
   const extended=page.querySelector('.daily-extended');
   if(extended&&!extended.contains(selected))extended.classList.add('tool59-hidden');
  }
  if(tool.section==='tools'){
   page.querySelectorAll('.qt-library,.qt-bottom-links,.qt-workspace-footer,.qt-workspace-header').forEach(n=>n.classList.add('tool59-hidden'));
   const toolsControls=$('hub-tools-controls');toolsControls?.classList.add('tool59-branch');toolsControls && (toolsControls.hidden=false);
  }
  if(tool.section==='convert'){
   page.querySelector('.convert-rail')?.classList.add('tool59-hidden');
   page.querySelectorAll('.convert-panel').forEach(panel=>{if(panel!==selected)panel.classList.add('tool59-hidden');});
  }
  if(tool.section==='ai'){
   page.querySelector('.ai-tool-tabs')?.classList.add('tool59-hidden');
   page.querySelectorAll('[id^="ai-pane-"]').forEach(pane=>{if(pane!==selected)pane.classList.add('tool59-hidden');});
   page.querySelector('.puter-auth')?.classList.add('tool59-branch');
   page.querySelector('.puter-help')?.classList.add('tool59-branch');
   page.querySelector('.ai-info')?.classList.add('tool59-branch');
  }
  if(tool.section==='qr')page.querySelector('.qr-type-tabs')?.classList.add('tool59-hidden');
  suppressOtherTopLevel(page);
  const related=relatedList(tool);const hero=$('connect-tool59-hero');page.insertBefore(related,hero?.nextSibling||page.firstChild);
  /* For PHP-served pages, intro/related already appeared server-side. We normalize
     them in the client so the same result appears after History API transitions. */
 }
 function directory(area){
  const page=$('page-'+area);if(!page)return;
  root.dataset.connectToolDirectory=area;
  const group=tools.filter(x=>x.section===area);
  if(!group.length)return;
  page.hidden=false;
  let block=$('connect-tool59-directory');
  if(!block){block=el('section','tool59-directory');block.id='connect-tool59-directory';page.prepend(block);}
  block.replaceChildren(el('div','overline','CHOOSE YOUR TOOL'),el('h1','',categories[area]||'Tools'),el('p','','Choose a dedicated tool. Only its workspace opens, with no unnecessary scrolling.'));
  const grid=el('div','tool59-directory-grid');
  for(const t of group){
   const a=el('a','tool59-directory-item');a.href=t.path;
   a.append(el('strong','',t.title),el('small','',t.description),el('span','','Open tool ↗'));grid.append(a);
  }
  block.append(grid);
  for(const child of page.children){if(child!==block)child.classList.add('tool59-hidden');}
 }
 function applyCourse(course){
  const page=$('page-academy');if(!page)return;
  root.dataset.connectCourseRoute=course.id;
  page.hidden=false;
  intro(page,{title:course.title,description:'Continue the original creator-led learning path. Progress, notes and quizzes are stored locally on this device.',base:'academy',course:true});
  window.dispatchEvent(new CustomEvent('connect:select-course',{detail:{id:course.id}}));
  window.dispatchEvent(new Event('connect:lms-classroom'));
  const classroom=$('lms-view-classroom');
  if(!classroom)return;
  classroom.hidden=false;classroom.classList.add('tool59-selected');
  ancestors(classroom,page);
  suppressOtherTopLevel(page);
 }
 function update(){
  const current=path();
  const requested=byPath.get(current),course=byCourse.get(current);
  const base=current.split('/')[1]||'';
  const legacyId=new URLSearchParams(location.search).get('tool');
  if(!requested&&legacyId&&byId.has(legacyId)&&current==='/'+byId.get(legacyId).section){
   const target=byId.get(legacyId);
   history.replaceState(null,'',target.path+location.hash);
   update();return;
  }
  clear();
  if(requested)applyTool(requested);
  else if(course)applyCourse(course);
  else if(areas.has(base)&&current==='/'+base)directory(base);
 }
 const registry={tools,byId,getPath:id=>byId.get(id)?.path||null,getByPath:p=>byPath.get(p)||null,update};
 window.ConnectToolRoutes=registry;
 window.addEventListener('popstate',update);
 window.addEventListener('hashchange',()=>{if(!location.hash||location.hash==='#')update();});
 update();
})();
