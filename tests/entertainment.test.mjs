import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('index.html'),runtime=read('assets/entertainment.js'),
 app=read('assets/app.js'),sw=read('sw.js'),css=read('assets/style.css');
test('both public Watch/Discover modules and menus are gone',()=>{
 const routes=app.match(/var routes=\[([^\]]+)\]/)?.[1]||'';
 for(const key of ['watch','discover']){
  assert.ok(!page.includes('id="page-'+key+'"'));
  assert.ok(!page.includes('href="#'+key+'"'));
  assert.ok(!page.includes('data-nav="'+key+'"'));
  assert.ok(!routes.includes("'"+key+"'"));
 }
 for(const token of ['Watch & Discover','Watch & Podcasts','id="watch-list"','id="podcast-list"','id="discover-list"','id="book-form"'])
  assert.ok(!page.includes(token),token);
});
test('obsolete hashes redirect to overview',()=>{
 assert.match(app,/includes\(key\)\)\{key='home';history\.replaceState\(null,'','#home'\)/);
 for(const key of ['watch','discover','tv','listen'])assert.ok(app.includes("'"+key+"'"));
});
test('all six games remain accessible and locally initialized',()=>{
 assert.ok(page.includes('id="page-play"'));
 assert.ok(app.includes("'play'"));
 for(const key of ['quiz','memory','number','flags','word','sudoku'])assert.ok(page.includes('id="game-'+key+'"'),key);
 for(const id of ['quiz-start','memory-new','number-next','flag-next','word-check','sudoku-check'])assert.ok(runtime.includes(id),id);
 assert.match(runtime,/opentdb\.com\/api\.php/);
 assert.ok(page.includes('data-ent-sponsor="play"'));
});
test('retired on-demand media fetching is not part of games or PWA shell',()=>{
 assert.doesNotMatch(runtime,/entertainment\.json|api\/media\.php|spotify\.com\/embed|openlibrary\.org|podcast-player|book-form|openDiscoveryWhenNeeded/);
 assert.doesNotMatch(sw,/entertainment\.json/);
 assert.match(sw,/vweb-connect-static-v28/);
 assert.match(page,/entertainment\.js\?v=(?:connect-focus-|connect-activation-|connect-qr-route-|connect-lms-)/);
 assert.ok(!page.includes('data-ent-sponsor="watch"'));
 assert.ok(css.includes('ent-game-board'));
});

test('games quiz fallback and Sudoku input collection remain usable',()=>{
 assert.match(runtime,/function empty\(root,message\)/);
 assert.match(runtime,/const got=\$\$\('#sudoku-grid input'\)\.map/);
 assert.doesNotMatch(runtime,/const got=\$\('#sudoku-grid input'\)\.map/);
});

test('retired media API and publisher return 410 without reading the database',()=>{
 const api=read('api/media.php'),admin=read('admin/media.php'),cms=read('admin/index.php'),apache=read('.htaccess');
 assert.match(api,/http_response_code\(410\)/);
 assert.match(admin,/http_response_code\(410\)/);
 assert.doesNotMatch(api,/connect_db\(/);
 assert.doesNotMatch(admin,/connect_db\(/);
 assert.ok(!cms.includes('href="/admin/media.php"'));
 assert.ok(!cms.includes("'watch'=>'Watch'"));
 assert.ok(apache.includes("RewriteRule ^data/entertainment\\.json$ - [G,L,NC]"));
});
