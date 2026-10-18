import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),js=read('assets/hub.js'),app=read('assets/app.js'),
 style=read('assets/style.css'),sw=read('sw.js'),data=JSON.parse(read('data/connect-hub.json'));
test('six Connect 2.0 routes and mobile nav',()=>{
 for(const name of ['home','studios','academy','pc','apps','dashboard']){
  assert.ok(html.includes('id="page-'+name+'"'));
  assert.ok(app.includes("'"+name+"'"));
 }
 assert.match(html,/href="#academy"/);
 assert.match(html,/id="hub-search"/);
});
test('valid static catalog with curated courses and apps',()=>{
 assert.ok(data.courses.length>=2);
 assert.ok(data.apps.length>=20);
 assert.ok(data.studios.length>=7);
 assert.ok(data.help.length>=6);
 for(const c of data.courses){
  assert.match(c.videoId,/^[A-Za-z0-9_-]{11}$/);
  const chapters=c.modules.flatMap(m=>m.lessons);
  assert.ok(chapters.length>=5);
  assert.ok(chapters.every(l=>typeof l[0]==='string'&&Number.isInteger(l[1])&&l[1]>=0));
 }
 for(const item of data.apps)assert.ok(item.open.startsWith('https://'));
});
test('official YouTube embedding and playlist URL import',()=>{
 assert.match(js,/youtube-nocookie\.com\/embed\/videoseries\?list=/);
 assert.match(js,/youtube-nocookie\.com\/embed\//);
 assert.match(js,/parsePlaylist/);
 assert.match(js,/startLesson/);
 assert.match(js,/playerPlaceholder/);
});
test('legal Windows activation and WinGet package generation',()=>{
 assert.match(html,/Microsoft activation guide/);
 assert.match(html,/Windows 11 download/);
 assert.match(js,/slmgr \/xpr/);
 assert.match(js,/winget install --id /);
 assert.doesNotMatch(js,/kmsauto|keygen|activator\.exe/i);
});
test('browser-only workspace data and grouped tools',()=>{
 assert.match(js,/localStorage\.getItem/);
 assert.match(js,/localStorage\.setItem/);
 assert.match(js,/vweb\.connect20\.v1/);
 assert.match(js,/hub-data-import/);
 assert.match(js,/hub-data-export/);
 assert.match(js,/hub-data-reset/);
 assert.doesNotMatch(js,/method:\s*['"]POST/);
 for(const kind of ['image','pdf','media','developer','qr','ai','design']){
  assert.ok(data.studios.find(s=>s.id===kind),kind);
 }
 assert.match(js,/qrcode@1\.5\.4\/lib\/browser\.min\.js/);
 assert.match(js,/\.toCanvas\(/);
});
test('service worker pre-caches static app shell and catalog',()=>{
 assert.match(sw,/vweb-connect-static-v12/);
 assert.match(sw,/\/assets\/hub\.js/);
 assert.match(sw,/\/data\/connect-hub\.json/);
 assert.match(html,/hub\.js\?v=connect20-/);
 assert.match(style,/hub-academy-layout/);
});
