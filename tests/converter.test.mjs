import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html');
const engine=read('assets/converter.js');
const app=read('assets/app.js');
const sw=read('sw.js');
const css=read('assets/style.css');
test('Convert Studio is discoverable from homepage and mobile nav',()=>{
 assert.match(html,/href="#convert"/);
 assert.match(html,/id="page-convert"/);
 assert.match(app,/'convert'/);
 assert.match(html,/id="convert-image-input"/);
 assert.match(html,/id="convert-pdf-input"/);
 assert.match(html,/id="convert-audio-input"/);
 assert.match(html,/id="convert-video-input"/);
});
test('four accessible converter tabs',()=>{
 for(const kind of ['image','pdf','audio','video']){
  assert.ok(html.includes('role="tabpanel" aria-labelledby="convert-tab-'+kind+'"'));
  assert.ok(html.includes('data-convert-tab="'+kind+'"'));
  assert.ok(html.includes('id="convert-'+kind+'-status"'));
 }
 assert.match(engine,/ArrowRight/);
 assert.match(engine,/ArrowLeft/);
});
test('image export and ZIP are local',()=>{
 for(const token of ['canvasBlob','imageAsBlob','zipStored','crc32','image/avif','image/jpeg','image/png','image/webp']){
  assert.ok(engine.includes(token),token);
 }
 assert.match(engine,/blob\.type!==mime/);
});
test('PDF merge split extraction and photos are supported',()=>{
 for(const token of ["pdfMode==='merge'","pdfMode==='extract'","pdfMode==='split'","pdfMode==='photos'"]){
  assert.ok(engine.includes(token),token);
 }
 assert.match(engine,/pdf-lib@1\.17\.1/);
 assert.match(engine,/copyPages/);
 assert.match(engine,/parseRange/);
});
test('audio and video processing stays browser-side',()=>{
 assert.match(engine,/decodeAudioData/);
 assert.match(engine,/wav16/);
 assert.match(engine,/video\.currentTime/);
 assert.match(engine,/ctx\.drawImage\(video/);
 assert.doesNotMatch(engine,/new XMLHttpRequest|fetch\(.+file\.arrayBuffer|POST.*multipart/);
});
test('PWA caches self-hosted converter file with fresh asset revision',()=>{
 assert.match(html,/converter\.js\?v=(convert-lab-|connect20-|(?:tools-(?:recovery|fix|tabs)-|(?:connect-refresh-|(?:connect-focus-|connect-activation-))))/);
 assert.match(sw,/vweb-connect-static-v(11|12|13|14|15|16|17|18|19|20|21|22|23|24|25)/);
 assert.match(sw,/assets\/converter\.js/);
 assert.match(css,/convert-dropzone/);
});
test('Watch and Discover are retired but games remain',()=>{
 for(const route of ['tv','listen','watch','discover'])
  assert.ok(!html.includes('id="page-'+route+'"'),route);
 assert.ok(!read('assets/entertainment.js').includes('radio-browser.info'));
 assert.ok(html.includes('id="page-play"'));
});
