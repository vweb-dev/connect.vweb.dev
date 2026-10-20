import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),mobile=read('assets/mobile-app.js'),css=read('assets/mobile-app.css'),
 app=read('assets/app.js'),worker=read('sw.js'),manifest=JSON.parse(read('manifest.webmanifest'));
test('five mobile app tabs and independent app header are present',()=>{
 for(const id of ['mobile-app-topbar','mobile-app-back','mobile-app-search','mobile-app-open-menu','mobile-app-title','mobile-more'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const route of ['home','studios','apps','academy','more'])assert.ok(html.includes('data-mobile-tab="'+route+'"'),route);
 assert.match(css,/@media\(max-width:800px\)/);
});
test('menu opens as a bottom-up multi-level sheet',()=>{
 for(const screen of ['root','create','learn','services','personal'])
  assert.ok(html.includes('data-stack-screen="'+screen+'"'),screen);
 assert.match(html,/aria-modal="true"/);
 assert.match(css,/align-items:flex-end/);
 assert.match(css,/84dvh/);
 assert.match(mobile,/sheetTrail\.push\(el\.dataset\.stackNext\)/);
 assert.match(mobile,/function sheetBack\(\)/);
 assert.match(mobile,/function closeSheet\(\)/);
});
test('menu links preserve real routes and do not restore retired routes',()=>{
 for(const route of ['#studios','#tools','#convert','#ai','#apps','#academy','#play','#pc','#offers','#community','#dashboard','#account'])
  assert.ok(html.includes('href="'+route+'"'),route);
 for(const route of ['#watch','#discover','#internet','#rewards'])assert.ok(!html.includes('href="'+route+'"'),route);
 assert.match(app,/function route\(focusHeading\)/);
});
test('app shell contains previous-screen support, focus loop and safe dismiss gestures',()=>{
 assert.match(mobile,/screens\.push\(key\)/);
 assert.match(mobile,/function screenBack\(\)/);
 assert.match(mobile,/event\.key==='Escape'/);
 assert.match(mobile,/event\.key!=='Tab'/);
 assert.match(mobile,/getClientRects\(\)\.length>0/);
 assert.match(mobile,/touchstart/);
 assert.match(mobile,/touchend/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('global search and native PWA install remain connected without new APIs',()=>{
 assert.match(mobile,/hub-command-open/);
 assert.match(mobile,/oldInstall\.click\(\)/);
 assert.match(mobile,/beforeinstallprompt/);
 assert.doesNotMatch(mobile,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
 assert.ok(manifest.shortcuts.length>=4);
});
test('mobile assets use the same deploy cache version',()=>{
 assert.match(worker,/vweb-connect-static-v28/);
 for(const asset of ['mobile-app.js','mobile-app.css']){
  const version=asset==='mobile-app.js'?'connect-ios-focus-20261020a':'connect-qr-route-20261020b';
  assert.ok(html.includes('/assets/'+asset+'?v='+version),asset);
  assert.ok(worker.includes('/assets/'+asset),asset);
 }
});
