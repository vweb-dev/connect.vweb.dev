import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('index.html'),runtime=read('assets/entertainment.js'),
 app=read('assets/app.js'),sw=read('sw.js'),css=read('assets/style.css');
const catalog=JSON.parse(read('data/entertainment.json'));
test('retired live radio and television are completely removed',()=>{
 assert.ok(!page.includes('id="page-tv"'));
 assert.ok(!page.includes('id="page-listen"'));
 assert.ok(!page.includes('href="#tv"'));
 assert.ok(!page.includes('href="#listen"'));
 assert.ok(!app.includes("'ai','tv','watch'"));
 assert.ok(!runtime.includes('radio-browser.info'));
 assert.ok(!runtime.includes('const radioHosts'));
 assert.ok(!runtime.includes('hls.js'));
 assert.ok(catalog.items.every(x=>x.kind!=='tv'));
});
test('watch collections, podcasts, games and books remain accessible',()=>{
 for(const route of ['watch','play','discover']){
  assert.ok(page.includes('id="page-'+route+'"'));
  assert.ok(app.includes("'"+route+"'"));
 }
 for(const id of ['watch-list','podcast-list','podcast-player','discover-list','book-form']){
  assert.ok(page.includes('id="'+id+'"'));
 }
 assert.match(runtime,/open\.spotify\.com\/embed\/show/);
 assert.match(runtime,/opentdb\.com\/api\.php/);
 assert.match(runtime,/openlibrary\.org\/search\.json/);
 for(const game of ['quiz','memory','number','flags','word','sudoku']){
  assert.ok(page.includes('id="game-'+game+'"'));
 }
});
test('editorial directory retains safe official URLs',()=>{
 const ids=new Set();
 for(const item of catalog.items){
  assert.ok(!ids.has(item.id));ids.add(item.id);
  assert.ok(['watch','discover','podcast'].includes(item.kind));
  assert.ok(item.source_url.startsWith('https://'));
  assert.ok(['official_embed','official_link','licensed_stream'].includes(item.permission));
 }
});
test('PWA caches simplified discovery engine and catalog',()=>{
 assert.match(sw,/data\/entertainment\.json/);
 assert.match(sw,/path==='\/assets\/entertainment\.js'/);
 assert.match(sw,/vweb-connect-static-v17/);
 assert.match(page,/entertainment\.js\?v=/);
});
test('sponsored discovery placement and mobile cards remain',()=>{
 assert.ok(page.includes('data-ent-sponsor="watch"'));
 assert.ok(page.includes('data-ent-sponsor="play"'));
 assert.ok(!page.includes('data-ent-sponsor="tv"'));
 assert.ok(css.includes('ent-catalog'));
 assert.ok(!runtime.includes('document.write('));
});
