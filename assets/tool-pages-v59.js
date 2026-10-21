'use strict';
/* Dedicated tool and course routes. All processing stays in the existing modules. */
(()=>{
 const root=document.documentElement,$=id=>document.getElementById(id);
 let tools=[];
 try{const value=JSON.parse($('connect-tool-route-catalog')?.textContent||'{}');tools=Array.isArray(value.tools)?value.tools:[];}catch{}
 const byPath=new Map(tools.map(t=>[t.path,t])),byId=new Map(tools.map(t=>[t.id,t]));
 const areas=new Set(['tools','convert','qr','ai','daily','pc']);
 const categories={tools:'Browser tools',convert:'File converters',qr:'QR Studio',ai:'AI Studio',daily:'Daily Desk',pc:'Windows & Office',network:'Internet utilities'};
 let courses=[];try{const x=JSON.parse($('hub-offline-catalog')?.textContent||'{}');courses=Array.isArray(x.courses)?x.courses.filter(c=>c&&typeof c.id==='string'&&typeof c.title==='string'):[];}catch{}
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
  const related=tools.filter(t=>t.group===tool.group&&t.id!==tool.id).slice(0,5);
  for(const other of related){const a=el('a','',other.title+' ↗');a.href=other.path;nav.append(a);}
  return nav;
 }
 function intro(page,{title,description,base,course=false}){
  let hero=$('connect-tool59-hero');
  if(!hero){hero=el('section','tool59-hero');hero.id='connect-tool59-hero';page.prepend(hero);}
  else{hero.replaceChildren();}
  const breadcrumbs=el('nav','tool59-breadcrumb');breadcrumbs.setAttribute('aria-label','Breadcrumb');
  const back=el('a','','Home');back.href='/';const category=el('a','',categories[base]||'Learn');category.href=course?'/academy':'/'+base;if(base==='tools')category.dataset.toolsNoSheet='true';
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
   const candidate=$('qt-active-tool');
   window.dispatchEvent(new CustomEvent('connect:open-tool',{detail:{id:tool.target}}));
   const current=candidate?.querySelector('.tool-card');
   if(!current||current.dataset.toolsId!==tool.target){
    const fallbackSelectors={compress:'#image-file',password:'#password-output',text:'#text-content',units:'#conv-mode',csv:'#csv-content',json:'#hub-json-input',encode:'#hub-encode-input',hash:'#hub-hash-input',uuid:'#hub-uuid-output',qr:'.hub-qr-card',contrast:'.hub-contrast-card'};
    const source=$('hub-tools-source'),selector=fallbackSelectors[tool.target];
    const recovered=selector?source?.querySelector(selector)?.closest('.tool-card'):null;
    if(recovered&&candidate){candidate.replaceChildren(recovered);recovered.dataset.toolsId=tool.target;}
   }
   selected=candidate?.querySelector('.tool-card')?candidate:null;
  }else if(tool.mode==='tab'){
   const tab=$(tool.target);tab?.click();
   selected=$(tool.target.replace('-tab-','-pane-'));
   if(selected){
    selected.hidden=false;
    const all=selected.parentElement?.querySelectorAll('[role="tabpanel"]')||[];
    all.forEach(panel=>{if(panel!==selected)panel.hidden=true;});
    if(tab){tab.setAttribute('aria-selected','true');tab.classList.add('is-selected','active');}
   }
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
  if(!selected){
   console.warn('Tool workspace not available:',tool.id);
   const hero=$('connect-tool59-hero');
   const warning=el('div','tool60-recovery');
   warning.setAttribute('role','status');
   warning.append(el('strong','','This tool did not finish loading.'));
   warning.append(el('p','','Try reloading this page. If it is still unavailable, choose another related tool.'));
   const retry=el('button','tool60-retry','↻ Reload tool');retry.type='button';retry.addEventListener('click',()=>location.reload());
   warning.append(retry);hero?.append(warning);
   suppressOtherTopLevel(page);
   const related=relatedList(tool);page.insertBefore(related,hero?.nextSibling||page.firstChild);
   return;
  }
  selected.hidden=false;
  let disclosure=selected.closest('details');while(disclosure){disclosure.open=true;disclosure=disclosure.parentElement?.closest('details');}
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
  if(tool.section==='qr'){
   page.querySelector('.qr-type-tabs')?.classList.add('tool59-hidden');
   const form=$('qr-design'),steps=form?[...form.children].filter(x=>x.classList?.contains('qr-step')):[];
   if(steps.length>2&&!form.querySelector('.tool59-qr-advanced')){
    const advanced=el('details','tool59-qr-advanced'),summary=el('summary','','Customize colors, patterns & logo');
    const body=el('div','tool59-qr-advanced-body');advanced.append(summary,body);
    steps[2].before(advanced);steps.slice(2).forEach(step=>body.append(step));
   }
  }
  suppressOtherTopLevel(page);
  const related=relatedList(tool);const hero=$('connect-tool59-hero');page.insertBefore(related,hero?.nextSibling||page.firstChild);
  /* For PHP-served pages, intro/related already appeared server-side. We normalize
     them in the client so the same result appears after History API transitions. */
 }
 function directory(area){
  const page=$('page-'+area);if(!page)return;
  root.dataset.connectToolDirectory=area;
  const catalog=area==='tools'?tools:tools.filter(t=>t.section===area);
  if(!catalog.length)return;
  page.hidden=false;
  let block=$('connect-tool59-directory');
  if(!block){block=el('section','tool59-directory');block.id='connect-tool59-directory';page.prepend(block);}
  const title=area==='tools'?'All Connect Tools':(categories[area]||'Tools');
  block.replaceChildren(el('div','overline','BROWSE · SEARCH · OPEN'),el('h1','',title),el('p','','Find exactly what you need, then work in a dedicated page. No unrelated tools or extra scrolling.'));
  const form=el('form','tool60-search');
  form.setAttribute('role','search');
  const label=el('label','visually-hidden','Search '+title);label.htmlFor='tool60-search-input';
  const input=el('input','tool60-search-input');
  input.type='search';input.id='tool60-search-input';input.autocomplete='off';input.placeholder='Search tools — PDF, WhatsApp, image, JSON, Windows…';
  const clear=el('button','tool60-clear','Clear');clear.type='button';clear.hidden=true;
  clear.addEventListener('click',()=>{input.value='';selected='all';limit=12;render();input.focus();});
  form.append(label,input,clear);form.addEventListener('submit',event=>{event.preventDefault();const first=grid.querySelector('a');first?.focus();});
  block.append(form);
  const status=el('p','tool60-result-count');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const chips=el('div','tool60-filters'),grid=el('div','tool59-directory-grid'),more=el('button','tool60-load-more','Show more tools ↓');more.type='button';
  block.append(status,chips,grid,more);
  let selected='all',limit=12;
  const names={quick:'Quick & Everyday',developer:'Developer',design:'Design',files:'Files & Media',qr:'QR Studio',ai:'AI Studio',daily:'Daily Desk',activation:'Activation',system:'Windows & Internet'};
  const groups=[...new Set(catalog.map(item=>item.group))];
  function render(){
   const phrase=input.value.trim().toLowerCase().replace(/[\u0300-\u036f]/g,'');
   const words=phrase.split(/\s+/).filter(Boolean);
   const items=catalog.filter(item=>{
    const matching=selected==='all'||item.group===selected;
    const text=[item.title,item.description,item.id,item.slug,item.section,item.path,item.group].join(' ').toLowerCase().replace(/[\W_]+/g,' ');
    const aliases=(item.group==='qr'?'qrcode scan barcode ':item.group==='files'?'file converter ':item.group==='activation'?'microsoft license ':item.group==='developer'?'code developer ':'');
    return matching&&words.every(word=>(text+' '+aliases).includes(word));
   });
   status.textContent=items.length+' matching tools · '+catalog.length+' available';
   grid.replaceChildren();
   for(const item of items.slice(0,limit)){
    const a=el('a','tool59-directory-item');a.href=item.path;
    a.append(el('strong','',item.title),el('small','',item.description),el('span','','Open tool ↗'));
    grid.append(a);
   }
   if(!items.length)grid.append(el('p','tool60-empty','No results. Try a shorter or different keyword.'));
   more.hidden=items.length<=limit;
   more.textContent='Show '+Math.min(12,items.length-limit)+' more tools ↓';
   clear.hidden=!input.value;
   chips.replaceChildren();
   if(area!=='tools')return;
   for(const key of ['all',...groups]){
    const button=el('button','tool60-chip'+(selected===key?' selected':''),key==='all'?'All '+catalog.length:names[key]||key);
    button.type='button';button.setAttribute('aria-pressed',String(selected===key));
    button.addEventListener('click',()=>{selected=key;limit=12;render();});
    chips.append(button);
   }
  }
  input.addEventListener('input',()=>{limit=12;render();});
  more.addEventListener('click',()=>{limit+=12;render();});
  render();
  for(const child of page.children){if(child!==block)child.classList.add('tool59-hidden');}
 }
 function applyCourse(course){
  const page=$('page-academy');if(!page)return;
  root.dataset.connectCourseRoute=course.id;
  page.hidden=false;
  intro(page,{title:course.title,description:(course.description||'Creator-led learning path.')+' Progress, notes and quizzes stay on this device.',base:'academy',course:true});
  window.dispatchEvent(new CustomEvent('connect:select-course',{detail:{id:course.id}}));
  window.dispatchEvent(new Event('connect:lms-classroom'));
  const classroom=$('lms-view-classroom');
  if(!classroom)return;
  classroom.hidden=false;classroom.classList.add('tool59-selected');
  ancestors(classroom,page);
  suppressOtherTopLevel(page);
 }
 function syncHead(title,description,current){
  const canonical=document.querySelector('link[rel="canonical"]');
  if(canonical)canonical.href=location.origin+current;
  if(title)document.title=title;
  const values={'meta[name="description"]':description,'meta[property="og:title"]':title,'meta[property="og:description"]':description,'meta[property="og:url"]':location.origin+current};
  for(const [selector,value] of Object.entries(values)){const tag=document.querySelector(selector);if(tag&&value)tag.setAttribute('content',value);}
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
  if(requested){
   const prefix=requested.section==='ai'?'AI Studio':(requested.section==='pc'?'Windows & Office Guide':'Online Tool');
   syncHead(requested.title+' — '+prefix+' | VWEB.DEV Connect',requested.description+'. Open a dedicated workspace on VWEB.DEV Connect.',current);
   applyTool(requested);
  }else if(course){
   syncHead(course.title+' — Free Course | VWEB.DEV Connect',course.description||'Creator-led learning path with local progress tracking.',current);
   applyCourse(course);
  }else if(areas.has(base)&&current==='/'+base){
   const canonical=document.querySelector('link[rel="canonical"]');
   if(!canonical||new URL(canonical.href,location.origin).pathname!==current)syncHead((categories[base]||'Tools')+' | VWEB.DEV Connect','Browse individual online tools and open a focused workspace.',current);
   directory(base);
  }else{
   const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=location.origin+current;
  }
 }
 const registry={tools,byId,getPath:id=>byId.get(id)?.path||null,getByPath:p=>byPath.get(p)||null,update};
 window.ConnectToolRoutes=registry;
 window.addEventListener('popstate',update);
 window.addEventListener('hashchange',()=>{if(!location.hash||location.hash==='#')update();});
 update();
})();
