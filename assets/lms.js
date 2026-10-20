'use strict';
/* Connect LMS — local-first course library and self-assessed learning.
 * Uses the existing VWEB.DEV course catalog and the existing course player.
 * No server-side account, tracking, or fabricated certifications.
 */
(function(){
 const root=document.querySelector('#page-academy');
 if(!root)return;
 const $=s=>root.querySelector(s),$$=s=>Array.from(root.querySelectorAll(s));
 const node=(tag,className,text)=>{
  const x=document.createElement(tag);if(className)x.className=className;
  if(text!==undefined)x.textContent=String(text);return x;
 };
 const bridge=()=>window.ConnectLMS;
 const flat=c=>c.modules.flatMap(m=>m.lessons.map((l,i)=>({title:l[0],seconds:l[1],module:m.title,index:i})));
 const cover=c=>'https://i.ytimg.com/vi/'+encodeURIComponent(c.videoId)+'/hqdefault.jpg';
 const enrolled=(s,c)=>s.enrolled.includes(c.id)||(s.completed[c.id]?.length||0)>0||
    typeof s.position[c.id]==='number'||!!s.notes[c.id];
 const progress=(s,c)=>{
  const total=flat(c).length,done=(s.completed[c.id]||[]).filter(Number.isInteger).length;
  return {done,total,pct:Math.round(done/Math.max(total,1)*100)};
 };
 const courseById=(s,id)=>s.courses.find(c=>c.id===id);
 const viewNames=['overview','catalog','classroom'];
 let view='overview',search='',filter='all',detail='notes',quizCourse='',quizModule=0,quizSession=null,visible=false;
 // Curated checks mirror each real module in the five free courses.
 const bank={
  windows11:[
   [{q:'Which Windows area is used to launch apps?',a:['Start menu','Recycle Bin','File Explorer address bar'],c:0},{q:'Where do pinned apps usually appear?',a:['Taskbar or Start menu','Windows Update history','Display scaling'],c:0}],
   [{q:'Where do you check Windows updates?',a:['Settings → Windows Update','Notepad','Task Manager → Processes'],c:0},{q:'Which action helps protect a Windows device?',a:['Install trusted updates','Disable all screen locks','Share admin passwords'],c:0}],
   [{q:'Which tool shows running processes and startup apps?',a:['Task Manager','Paint','Calculator'],c:0},{q:'What does a command line enable?',a:['Running text-based commands','Editing only photographs','Charging hardware'],c:0}]
  ],
  canva:[
   [{q:'What is a Canva template?',a:['A ready-made design starting point','A printer cartridge','A video compression standard'],c:0},{q:'A design layout organizes what?',a:['Visual elements and spacing','Only file extensions','Computer permissions'],c:0}],
   [{q:'What improves reading hierarchy?',a:['Contrasting font sizes and spacing','Using identical size for all text','Random alignment'],c:0},{q:'What are grids helpful for?',a:['Consistent placement and alignment','Reducing internet latency','Saving passwords'],c:0}],
   [{q:'Which task belongs to publishing a design?',a:['Exporting to a suitable format','Uninstalling Canva','Changing router firmware'],c:0},{q:'A video design often includes which element?',a:['Timeline-based scenes','Database migrations','Disk partition tables'],c:0}]
  ],
  python:[
   [{q:'Python source files commonly use which extension?',a:['.py','.psd','.mp4'],c:0},{q:'What is an IDE used for?',a:['Writing and running code','Only editing spreadsheets','Scanning QR images'],c:0}],
   [{q:'Which function reads typed console input?',a:['input()','print()','len()'],c:0},{q:'Which value type stores whole numbers?',a:['int','str','list'],c:0}],
   [{q:'Which loop runs while a condition remains true?',a:['while','import','return'],c:0},{q:'What is a for loop useful for?',a:['Iterating over items','Only deleting files','Writing CSS colors'],c:0}]
  ],
  htmlcss:[
   [{q:'HTML primarily defines what?',a:['Page content and structure','Cloud billing','Audio codecs'],c:0},{q:'Which tag is normally used for a link?',a:['<a>','<div>','<h1>'],c:0}],
   [{q:'CSS is primarily used for what?',a:['Presentation and layout','Database replication','Video encoding'],c:0},{q:'Which CSS property adjusts text color?',a:['color','font-size','display'],c:0}],
   [{q:'Responsive layouts adapt to what?',a:['Different screen sizes','Only website names','Printer serial numbers'],c:0},{q:'Which file typically holds standalone CSS?',a:['.css','.exe','.zip'],c:0}]
  ],
  excel:[
   [{q:'A cell is located using what?',a:['Column letter and row number','Only a file title','A network address'],c:0},{q:'Which symbol begins a formula?',a:['=','@','#'],c:0}],
   [{q:'Conditional formatting changes a cell based on what?',a:['Rules or values','Mouse brand','File path length'],c:0},{q:'A workbook can contain multiple what?',a:['Worksheets','Operating systems','USB ports'],c:0}]
  ]
 };
 function selectView(next){
  if(!viewNames.includes(next))return;
  if(view==='classroom'&&next!=='classroom'){
   const player=$('#hub-academy-player');
   if(player?.querySelector('iframe')){
    const paused=node('div','hub-player-placeholder');
    paused.append(node('span','','▶'),node('h2','','Lesson paused'),node('p','','Return to the Classroom and select a lesson to continue.'));
    player.replaceChildren(paused);
   }
  }
  view=next;
  $$('.lms-nav-tab').forEach(b=>{
   const selected=b.dataset.lmsView===view;
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  viewNames.forEach(name=>{$('#lms-view-'+name).hidden=name!==next});
  if(next==='overview'){const s=snapshot();if(s?.courses.length)renderOverview(s);}
  if(next==='catalog')renderCatalog();
  if(next==='classroom')renderClassroom();
 }
 function completedModules(s,c){
  return c.modules.map((m,mi)=>{
   const offset=c.modules.slice(0,mi).reduce((n,item)=>n+item.lessons.length,0);
   const count=m.lessons.filter((_,i)=>(s.completed[c.id]||[]).includes(offset+i)).length;
   return {done:count,total:m.lessons.length,title:m.title};
  });
 }
 function button(label,kind,callback){
  const b=node('button',kind,label);b.type='button';b.addEventListener('click',callback);return b;
 }
 function meter(pct){
  const track=node('div','lms-meter'),bar=node('span');bar.style.width=pct+'%';track.append(bar);return track;
 }
 function card(s,c,mode){
  const p=progress(s,c),joined=enrolled(s,c);
  const article=node('article','lms-course-card'),image=node('div','lms-course-image');
  const photo=node('img');photo.src=cover(c);photo.alt='';photo.loading='lazy';photo.referrerPolicy='no-referrer';
  photo.onerror=()=>{photo.remove();image.append(node('span','',c.icon||'▶'))};
  image.append(photo,node('span','',p.pct===100?'Completed':joined?'In progress':'Free course'));
  const body=node('div','lms-course-body');
  body.append(node('div','lms-course-meta',c.provider+' · '+(c.level||'All levels')),
   node('h3','',c.title),node('p','',c.description||'Practice essential digital skills.'));
  const meta=node('div','lms-course-stats');
  meta.append(node('span','',c.modules.length+' modules'),node('span','',p.total+' lessons'),
   node('span','',p.done+' complete'));body.append(meta,meter(p.pct));
  const actions=node('div','lms-course-actions');
  actions.append(button(joined?(p.pct===100?'Review course →':'Continue →'):'Start learning →','',()=>{
   bridge()?.open(c.id);selectView('classroom');
  }));
  if(mode==='catalog'&&joined)actions.append(button('Course outline','lms-outline',()=>{
   bridge()?.open(c.id);selectView('classroom');
  }));
  body.append(actions);article.append(image,body);return article;
 }
 function snapshot(){return bridge()?.snapshot()||null}
 function enrollList(s){return s.courses.filter(c=>enrolled(s,c))}
 function renderStats(s){
  const started=enrollList(s),allDone=started.reduce((n,c)=>n+progress(s,c).done,0);
  $('#lms-stat-enrolled').textContent=String(started.length);
  $('#lms-stat-completed').textContent=String(allDone);
  $('#lms-stat-finished').textContent=String(started.filter(c=>progress(s,c).pct===100).length);
  const passes=Object.values(s.assessments||{}).reduce((n,modules)=>n+
   Object.values(modules||{}).filter(q=>q&&q.total>0&&q.score===q.total).length,0);
  $('#lms-stat-quizzes').textContent=String(passes);
 }
 function renderOverview(s){
  const list=enrollList(s),continueHost=$('#lms-continue'),mine=$('#lms-my-courses'),featured=$('#lms-featured-courses');
  continueHost.replaceChildren();mine.replaceChildren();featured.replaceChildren();
  $('#lms-enrolled-label').textContent=list.length+' enrolled';
  if(!list.length){
   const empty=node('div','lms-empty');empty.append(node('strong','','Your learning journey starts here'),
    node('p','','Browse a free course, open the first lesson and track your progress at your own pace.'));
   empty.append(button('Browse courses →','lms-text-link',()=>selectView('catalog')));
   continueHost.append(empty);
  }else{
   for(const c of list.slice(0,2)){
    const p=progress(s,c),all=flat(c),current=Math.min(Math.max(0,s.position[c.id]||0),Math.max(0,all.length-1));
    const entry=button('','lms-resume-card',()=>{bridge()?.open(c.id,current);selectView('classroom')});
    const icon=node('span','lms-resume-icon',c.icon||'▶'),copy=node('span','lms-resume-copy');
    copy.append(node('small','',p.pct===100?'COMPLETED · REVIEW':'RESUME YOUR COURSE'),
     node('strong','',c.title),node('span','',(all[current]?.title||'Start learning')+' · '+p.pct+'% complete'));
    entry.append(icon,copy,node('b','','↗'));continueHost.append(entry);
   }
   list.forEach(c=>mine.append(card(s,c,'mine')));
  }
  s.courses.filter(c=>!enrolled(s,c)).slice(0,3).forEach(c=>featured.append(card(s,c,'featured')));
  if(!featured.children.length){
   const notice=node('p','lms-muted','You have started every course currently offered. Explore your classroom to continue.');
   featured.append(notice);
  }
 }
 function renderCatalog(){
  const s=snapshot();if(!s)return;
  const host=$('#lms-catalog-courses');host.replaceChildren();
  const results=s.courses.filter(c=>{
   const text=(c.title+' '+c.description+' '+c.provider+' '+c.modules.map(m=>m.title).join(' ')).toLocaleLowerCase();
   if(search&&!text.includes(search))return false;
   const joined=enrolled(s,c),pct=progress(s,c).pct;
   return filter==='all'||(filter==='enrolled'&&joined)||(filter==='new'&&!joined)||(filter==='finished'&&pct===100);
  });
  $('#lms-catalog-count').textContent=results.length+' of '+s.courses.length+' courses';
  $('#lms-catalog-empty').hidden=results.length>0;
  results.forEach(c=>host.append(card(s,c,'catalog')));
 }
 function renderClassroom(){
  const s=snapshot();if(!s)return;
  const course=courseById(s,s.selected);
  if(!course){
   $('#lms-classroom-name').textContent='Select a course';
   $('#lms-classroom-description').textContent='Choose a learning path in the Course Catalog.';
   return;
  }
  const p=progress(s,course),badgeHost=$('#lms-classroom-badges');
  $('#lms-classroom-name').textContent=course.title;
  $('#lms-syllabus-course').textContent=course.title;
  $('#lms-classroom-description').textContent=course.description+' · '+course.provider;
  $('#lms-classroom-percent').textContent=p.pct+'%';
  $('#lms-classroom-meter').style.width=p.pct+'%';
  $('#lms-classroom-category').textContent=(course.level||'Free learning').toUpperCase()+' / '+course.modules.length+' MODULES';
  badgeHost.replaceChildren();
  for(const label of [course.level+' level',p.done+'/'+p.total+' lessons',course.modules.length+' modules'])
   badgeHost.append(node('span','',label));
  $('#lms-learning-record').hidden=p.pct!==100;
  const saved=s.bookmarks[course.id]||[];
  const current=s.lessonIndex;
  const mark=$('#lms-bookmark-lesson'),checked=saved.includes(current);
  mark.disabled=!!s.playlist;
  mark.textContent=checked?'★ Saved lesson':'☆ Save lesson';
  mark.setAttribute('aria-pressed',String(checked));
  renderBookmarks(s,course);
  renderQuiz(s,course);
 }
 function renderBookmarks(s,c){
  const host=$('#lms-bookmarks-list');host.replaceChildren();
  const bookmarked=(s.bookmarks[c.id]||[]).filter(i=>Number.isInteger(i)&&flat(c)[i]);
  if(!bookmarked.length){host.append(node('p','lms-quiz-detail','No saved lessons yet. Use ☆ Save lesson while studying.'));return;}
  const flatList=flat(c);
  bookmarked.forEach(i=>{
   const row=button('','lms-bookmark-row',()=>{bridge()?.open(c.id,i);selectView('classroom')});
   row.append(node('b','','☆'),node('span','',flatList[i].title+' · '+flatList[i].module),node('b','','↗'));
   host.append(row);
  });
 }
 function quizQuestions(c,mi){
  return (bank[c.id]?.[mi]||[]).map((q,i)=>{
   const n=q.a.length,rotate=(mi+i+1)%n;
   return {...q,a:q.a.slice(rotate).concat(q.a.slice(0,rotate)),c:(q.c-rotate+n)%n};
  });
 }
 function renderQuiz(s,c){
  const host=$('#lms-quiz-content');host.replaceChildren();
  if(s.playlist){host.append(node('p','lms-quiz-detail','Knowledge checks are available for curated courses, not imported YouTube playlists.'));return;}
  const select=node('select','lms-quiz-module-select');select.setAttribute('aria-label','Choose module knowledge check');
  c.modules.forEach((m,i)=>{
   const option=node('option','',m.title);option.value=String(i);select.append(option);
  });
  if(quizCourse!==c.id){quizCourse=c.id;quizModule=0;quizSession=null;}
  quizModule=Math.min(quizModule,c.modules.length-1);select.value=String(quizModule);
  select.addEventListener('change',()=>{quizModule=Number(select.value);quizSession=null;renderQuiz(snapshot(),c)});
  host.append(node('p','lms-quiz-detail','Test your understanding with a short, optional self-assessment for each course module.'),select);
  const existing=s.assessments[c.id]?.[quizModule];
  if(existing){
   host.append(node('p','lms-quiz-detail','Best recorded score: '+existing.score+'/'+existing.total+
    (existing.score===existing.total?' · Mastered':' · Retry anytime')));
  }
  const questions=quizQuestions(c,quizModule);
  if(!questions.length){
   host.append(node('p','lms-quiz-detail','Questions for this module are being prepared.'));return;
  }
  const active=quizSession&&quizSession.id===c.id&&quizSession.module===quizModule?quizSession:null;
  if(!active){
   host.append(node('h3','lms-quiz-heading',c.modules[quizModule].title+' · '+questions.length+' questions'),
    node('p','lms-quiz-detail','There is no timer. A perfect score marks this knowledge check mastered.'));
   const actions=node('div','lms-quiz-actions');
   actions.append(button('Start knowledge check →','',()=>{
    quizSession={id:c.id,module:quizModule,answers:Array(questions.length).fill(-1),done:false};
    renderQuiz(snapshot(),c);
   }));
   host.append(actions);return;
  }
  if(active.done){
   const score=active.answers.filter((a,i)=>a===questions[i].c).length;
   host.append(node('div','lms-quiz-score',score+'/'+questions.length),
    node('p','lms-quiz-detail',score===questions.length?
     'Mastered! Every answer is correct. Your score is saved locally.':
     'Good practice. Review the answers and try again when ready.'));
   questions.forEach((q,i)=>{
    const line=node('p','lms-quiz-detail',(i+1)+'. '+q.q+' — '+q.a[q.c]);
    host.append(line);
   });
   const actions=node('div','lms-quiz-actions');actions.append(button('Try again ↻','',()=>{
    quizSession=null;renderQuiz(snapshot(),c);
   }));host.append(actions);return;
  }
  questions.forEach((q,i)=>{
   host.append(node('h3','lms-quiz-heading',(i+1)+'. '+q.q));
   q.a.forEach((label,n)=>{
    const option=button(label,'lms-quiz-choice',()=>{active.answers[i]=n;renderQuiz(snapshot(),c)});
    option.setAttribute('aria-pressed',String(active.answers[i]===n));host.append(option);
   });
  });
  const actions=node('div','lms-quiz-actions'),submit=button('Check my answers →','',()=>{
   if(active.answers.some(x=>x<0))return;
   active.done=true;
   const total=questions.length,score=active.answers.filter((answer,i)=>answer===questions[i].c).length;
   bridge()?.assess(c.id,quizModule,score,total);
   renderQuiz(snapshot(),c);
  });
  submit.disabled=active.answers.some(x=>x<0);actions.append(submit);host.append(actions);
 }
 function printRecord(){
  const s=snapshot(),c=courseById(s,s?.selected);if(!c||progress(s,c).pct!==100)return;
  $('#lms-record-course').textContent=c.title;
  $('#lms-record-details').textContent='Self-marked '+flat(c).length+' lessons complete · '+c.modules.length+
   ' modules · Printed '+new Date().toLocaleDateString()+'.';
  window.print();
 }
 function render(){
  const s=snapshot();if(!s||!s.courses.length)return;
  renderStats(s);
  if(view==='overview')renderOverview(s);
  if(view==='catalog')renderCatalog();
  if(view==='classroom')renderClassroom();
 }
 $$('.lms-nav-tab').forEach(b=>b.addEventListener('click',()=>selectView(b.dataset.lmsView)));
 $('#lms-back-to-courses').addEventListener('click',()=>selectView('catalog'));
 $$('[data-lms-open]').forEach(b=>b.addEventListener('click',()=>selectView(b.dataset.lmsOpen)));
 $('#lms-course-search').addEventListener('input',event=>{search=event.target.value.trim().toLocaleLowerCase();renderCatalog()});
 $('#lms-course-filter').addEventListener('change',event=>{filter=event.target.value;renderCatalog()});
 $$('.lms-classroom-detail-tabs button').forEach(b=>b.addEventListener('click',()=>{
  detail=b.dataset.lmsPanel;
  $$('.lms-classroom-detail-tabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  $$('[data-lms-detail]').forEach(pane=>{pane.hidden=pane.dataset.lmsDetail!==detail});
  renderClassroom();
 }));
 $('#lms-bookmark-lesson').addEventListener('click',()=>{
  const s=snapshot();if(s?.selected&&!s.playlist)bridge()?.bookmark(s.selected,s.lessonIndex);
 });
 $('#lms-learning-record').addEventListener('click',printRecord);
 window.addEventListener('connect:lms-changed',render);
 window.addEventListener('connect:lms-classroom',()=>selectView('classroom'));
 window.addEventListener('hashchange',()=>{if(location.hash==='#academy'&&!visible)render();visible=location.hash==='#academy'});
 // Existing links that start a lesson should land inside the classroom, not the overview.
 root.addEventListener('click',event=>{
  if(event.target.closest('#hub-course-list button,#hub-curriculum button'))selectView('classroom');
 });
 selectView('overview');render();visible=location.hash==='#academy';
})();
