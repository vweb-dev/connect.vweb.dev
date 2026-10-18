import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),hub=read('assets/hub.js'),css=read('assets/style.css'),
 sw=read('sw.js'),catalog=JSON.parse(read('data/connect-hub.json'));
test('global command palette has accessible focusable controls',()=>{
 assert.match(html,/id="hub-command-dialog"/);
 assert.match(html,/id="hub-command-query"/);
 assert.match(html,/id="hub-command-results"/);
 assert.match(hub,/function paletteOptions/);
 assert.match(hub,/function openPalette/);
 assert.match(hub,/ArrowDown/);
 assert.match(hub,/ArrowUp/);
 assert.match(hub,/event\.key\.toLowerCase\(\)==='k'/);
});
test('course library includes verified publisher video metadata',()=>{
 assert.ok(catalog.courses.length>=5);
 assert.ok(catalog.courses.reduce((n,c)=>n+c.modules.reduce((m,g)=>m+g.lessons.length,0),0)>=70);
 for(const course of catalog.courses){
  assert.match(course.videoId,/^[\w-]{11}$/);
  const chapters=course.modules.flatMap(m=>m.lessons.map(l=>l[1]));
  assert.ok(chapters.every((t,i)=>Number.isInteger(t)&&t>=0&&(i===0||t>chapters[i-1])),
   'Chapter times must increase for '+course.id);
 }
 assert.match(hub,/youtube-nocookie\.com\/embed/);
});
test('resource hub has curated, filtered publisher destinations',()=>{
 assert.ok(catalog.apps.length>=33);
 for(const app of catalog.apps){
  assert.ok(app.open.startsWith('https://'));
  assert.ok(!/cracked-software|pirated-apps/.test(app.open));
 }
 assert.match(hub,/hub-app-categories/);
 assert.match(hub,/renderApps/);
});
test('enhanced QR and developer tools stay on device',()=>{
 for(const s of ['Wi-Fi','WhatsApp','Contact','JSON Studio','Color Contrast Checker'])
  assert.ok(hub.includes(s),s);
 assert.match(hub,/qrcode@1\.5\.4\/lib\/browser\.min\.js/);
 assert.match(hub,/JSON\.parse\(input\.value\)/);
 assert.match(hub,/navigator\.clipboard/);
 assert.doesNotMatch(hub,/fetch\(.+payload/);
});
test('WinGet presets never execute installation on website server',()=>{
 for(const pack of ['essential','creator','developer']){
  assert.match(html,new RegExp('data-pack="'+pack+'"'));
 }
 assert.match(hub,/winget install --id /);
 assert.match(hub,/vweb-software-pack\.ps1/);
 assert.match(hub,/vweb-software-pack\.json/);
 assert.doesNotMatch(hub,/kmsauto|keygen|activation bypass/i);
});
test('service worker uses network-first static catalog with safe offline fallback',()=>{
 assert.match(sw,/vweb-connect-static-v15/);
 assert.match(sw,/path==='\/data\/connect-hub\.json'/);
 assert.match(sw,/caches\.match\(path\)/);
 assert.match(html,/id="hub-network-status"/);
 assert.match(html,/id="hub-update-alert"/);
});
test('premium responsive styling and canonical metadata',()=>{
 assert.match(css,/hub-command-dialog/);
 assert.match(css,/hub-learning-poster/);
 assert.match(css,/hub-qr-types/);
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(html,/rel="canonical" href="https:\/\/connect\.vweb\.dev\/"/);
});

test('independent offline utilities and revalidated catalogs',()=>{
 const start=hub.indexOf('async function boot(){');
 const setup=hub.indexOf('addQR();addDeveloperUtilities();',start);
 const request=hub.indexOf("fetch('/data/connect-hub.json'",start);
 assert.ok(setup>start&&setup<request,'quick tools should initialize before catalog request');
 assert.match(hub,/cache:'no-cache'/);
 assert.match(read('assets/entertainment.js'),/fetch\('\/data\/entertainment\.json',\{cache:'no-cache'\}\)/);
 const apache=read('.htaccess');
 assert.match(apache,/Cache-Control "public, max-age=3600/);
 assert.match(apache,/Cache-Control "no-cache, must-revalidate"/);
});
