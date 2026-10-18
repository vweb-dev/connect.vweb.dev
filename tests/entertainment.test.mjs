import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=text('index.html'),runtime=text('assets/entertainment.js'),
  app=text('assets/app.js'),sw=text('sw.js'),css=text('assets/style.css');
const data=JSON.parse(text('data/entertainment.json'));
test('each entertainment route has its own accessible page',()=>{
 for(const name of ['tv','watch','listen','play','discover']){
  assert.ok(page.includes('id="page-'+name+'"'));
  assert.ok(app.includes("'"+name+"'"));
 }
 assert.match(page,/id="mobile-drawer"/);
});
test('media directory has valid rights metadata',()=>{
 assert.ok(data.items.length>=10);
 const seen=new Set();
 for(const entry of data.items){
  assert.ok(!seen.has(entry.id));seen.add(entry.id);
  assert.ok(['tv','watch','podcast','discover'].includes(entry.kind));
  assert.ok(['official_embed','official_link','licensed_stream'].includes(entry.permission));
  assert.ok(entry.source_url.startsWith('https://'));
  if(entry.provider==='youtube')assert.match(entry.external_id,/^[\w-]{11}$/);
  if(entry.provider==='spotify')assert.match(entry.external_id,/^[a-zA-Z0-9]{22}$/);
 }
});
test('single-source, browser-only streaming and games',()=>{
 assert.match(runtime,/youtube-nocookie\.com\/embed/);
 assert.match(runtime,/api\.radio-browser\.info/);
 assert.match(runtime,/open\.spotify\.com\/embed/);
 assert.match(runtime,/opentdb\.com\/api\.php/);
 assert.match(runtime,/openlibrary\.org\/search\.json/);
 assert.match(runtime,/stopRadio\(\)/);
 assert.match(runtime,/clearTv\(\)/);
 assert.match(runtime,/clearPodcast\(\)/);
 for(const kind of ['quiz','memory','number','flags','word','sudoku']){
  assert.ok(page.includes('id="game-'+kind+'"'));
 }
});
test('PWA caches static directory; loads JS network first',()=>{
 assert.match(sw,/data\/entertainment\.json/);
 assert.match(sw,/path==='\/assets\/entertainment\.js'/);
 assert.ok(page.includes('entertainment.js?v='));
});
test('first-party advertising is clearly labelled and outside player',()=>{
 assert.ok(page.includes('data-ent-sponsor="tv"'));
 assert.match(runtime,/SPONSORED/);
 assert.ok(!runtime.includes('document.write('));
});
test('responsive small-screen rendering exists',()=>{
 assert.ok(css.includes('mobile-drawer'));
 assert.ok(css.includes('ent-catalog'));
 assert.ok(css.includes('ent-radio-dock'));
});
