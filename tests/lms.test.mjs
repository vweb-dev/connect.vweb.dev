import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),hub=read('assets/hub.js'),lms=read('assets/lms.js'),
 css=read('assets/lms.css'),worker=read('sw.js'),manifest=JSON.parse(read('manifest.webmanifest')),
 catalog=JSON.parse(read('data/connect-hub.json'));
test('existing Academy route is a three-screen local learning portal',()=>{
 assert.ok(html.includes('id="page-academy"'));
 for(const screen of ['overview','catalog','classroom']){
  assert.ok(html.includes('id="lms-view-'+screen+'"'));
  assert.ok(html.includes('data-lms-view="'+screen+'"'));
 }
 for(const id of ['lms-stat-enrolled','lms-stat-completed','lms-stat-finished','lms-stat-quizzes',
   'lms-continue','lms-my-courses','lms-featured-courses','lms-catalog-courses',
   'lms-course-search','lms-course-filter'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(css,/\.lms-course-grid/);
 assert.match(css,/\.lms-nav-tab\[aria-current=page\]/);
});
test('existing course catalog and classroom/player IDs remain intact',()=>{
 assert.equal(catalog.courses.length,5);
 for(const id of ['hub-course-list','hub-course-count','hub-academy-player','hub-lesson-title',
   'hub-lesson-desc','hub-lesson-previous','hub-lesson-next','hub-lesson-complete',
   'hub-course-note','hub-curriculum','hub-curriculum-count','hub-playlist-open'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(hub,/function setCourse\(id,restore=false\)/);
 assert.match(hub,/function startLesson\(index\)/);
 assert.match(hub,/youtube-nocookie\.com\/embed/);
});
test('enrollment, notes, module assessments and bookmarks save under the established workspace key',()=>{
 assert.match(hub,/const STORAGE='vweb\.connect20\.v1'/);
 assert.match(hub,/enrolled:\[\],bookmarks:\{\},assessments:\{\}/);
 assert.match(hub,/enrolled:Array\.isArray\(p\.enrolled\)/);
 assert.match(hub,/bookmarks:p\.bookmarks/);
 assert.match(hub,/assessments:p\.assessments/);
 assert.match(hub,/window\.ConnectLMS=\{/);
 for(const method of ['open','enroll','bookmark','assess','snapshot'])
  assert.ok(hub.includes(method+ (method==='snapshot'?':lmsSnapshot':'(')),method);
 assert.match(hub,/state\.bookmarks\[course\]=Array\.isArray\(marked\)/);
 assert.match(hub,/state\.assessments\[course\]/);
 assert.match(hub,/emitLearning\(\)/);
});
test('catalog and classroom interactions have real first-party callbacks',()=>{
 assert.match(lms,/function selectView\(next\)/);
 assert.match(lms,/function renderCatalog\(\)/);
 assert.match(lms,/function renderClassroom\(\)/);
 assert.match(lms,/bridge\(\)\?\.open/);
 assert.match(lms,/bridge\(\)\?\.bookmark/);
 assert.match(lms,/bridge\(\)\?\.assess/);
 assert.match(lms,/connect:lms-changed/);
 assert.match(lms,/connect:lms-classroom/);
 assert.match(lms,/window\.print\(\)/);
});
test('knowledge checks cover every course module without a quiz backend',()=>{
 for(const course of catalog.courses){
  assert.ok(lms.includes('  '+course.id+':['),'quiz bank missing '+course.id);
 }
 assert.match(lms,/quizSession=\{id:c\.id,module:quizModule/);
 assert.match(lms,/active\.done=true/);
 assert.match(lms,/score===questions\.length/);
 assert.doesNotMatch(lms,/fetch\(|XMLHttpRequest|\/api\/quiz|\/api\/lms|WebSocket/);
});
test('self-marked activity is explicitly not an accredited award',()=>{
 assert.match(html,/not an accredited certificate/i);
 assert.match(html,/not tracked automatically/i);
 assert.match(css,/@media print/);
 assert.ok(manifest.shortcuts.some(x=>x.url==='/#academy'));
});
test('LMS source files are included in the PWA shell and released with matching version',()=>{
 assert.match(worker,/vweb-connect-static-v28/);
 for(const ext of ['css','js']){
  assert.ok(html.includes('/assets/lms.'+ext+'?v=connect-ios-focus-20261020a'));
  assert.ok(worker.includes('/assets/lms.'+ext));
 }
 assert.ok(html.includes('/assets/hub.js?v=connect-lms-20261020a'));
 assert.ok(html.includes('/assets/app.js?v=connect-lms-20261020a'));
});

test('classroom is a single-course focus view with explicit return navigation',()=>{
 assert.ok(html.includes('id="lms-back-to-courses"'));
 assert.ok(html.includes('id="lms-syllabus-course"'));
 assert.match(html,/id="lms-course-switcher-legacy" hidden aria-hidden="true"/);
 assert.ok(html.includes('id="hub-course-list"'),'legacy course list retained for compatibility');
 assert.match(css,/#page-academy #lms-course-switcher-legacy\[hidden\]/);
 assert.match(css,/\.lms-module-accordion/);
 assert.match(lms,/lms-back-to-courses/);
 assert.match(lms,/selectView\('catalog'\)/);
 assert.match(hub,/el\('details','hub-module lms-module-accordion'\)/);
 assert.match(hub,/el\('summary','hub-module-heading'\)/);
});

test('classroom focuses on a single course',()=>{assert.ok(html.includes('id="lms-course-switcher-legacy" hidden'));assert.ok(html.includes('id="lms-back-to-courses"'));assert.ok(html.includes('id="lms-syllabus-course"'));assert.match(lms,/lms-back-to-courses/);});
